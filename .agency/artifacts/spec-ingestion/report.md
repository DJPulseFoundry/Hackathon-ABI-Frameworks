# SPEC §Ingestion & Pipeline Runtime (Software Engineer — Ingestion)
_Persisted by CEO; subagent write harness-blocked. Conforms to MASTER-BLUEPRINT §1/§4/§7/§8. Grounded in api-reality (reality wins). Pins LOCKED: httpx==0.27.2, tenacity==8.5.0, pydantic-settings==2.4.0, structlog==24.4.0, typer>=0.12,<0.13, anthropic>=0.39, stdlib sqlite3/ThreadPoolExecutor._

## 1. HTTP client contract (ingest/client.py)
**Single chokepoint** `fetch_one(endpoint, params) -> httpx.Response`; no `httpx.get` elsewhere. Module-level singletons: `Limits(max_connections=8)`, `Timeout(connect=5,read=15,write=10,pool=5)` (NEVER None — a call without timeout is a FAILED run), one reused `Client`.

**Retry policy (tenacity 8.5.0):** model retryable statuses as raised sentinels so `retry_if_exception_type` governs uniformly.
- `429`→retry, honor `Retry-After` exactly (parse int, clamp 1..10, default 2).
- `500`/`TimeoutException`/`TransportError`→retry, exponential base 0.5s cap 8s + FULL jitter (anti-thundering-herd across 8 workers).
- `422` + other 4xx→**FAIL-FAST** (our bug), never retried. `200`→return.
```python
class RetryableHTTP(Exception): ...   # status, retry_after(429 only)
class FatalHTTP(Exception): ...       # 422/4xx
def _wait_policy(rs):
    exc=rs.outcome.exception()
    if isinstance(exc,RetryableHTTP) and exc.retry_after is not None: return float(exc.retry_after)
    base=min(8.0, 0.5*(2**(rs.attempt_number-1))); return random.uniform(0,base)
_RETRYER = Retrying(retry=retry_if_exception_type(RetryableHTTP), wait=_wait_policy,
                    stop=(stop_after_attempt(6) | stop_after_delay(45)), reraise=True, before_sleep=_log_retry)
```
- Max 6 attempts (P(6 straight 429s)≈0.0007). Per-call deadline 45s → else mark `failed`, run continues (fail-closed). `reraise=True`. `before_sleep` increments retry/429 manifest counters.
- Call-site: success→mark_done+land_raw (idempotent UPSERT); FatalHTTP→mark_failed+log+continue; exhausted→mark_failed+continue. **One bad task never aborts the run.**

## 2. Concurrency — Semaphore(8)/ThreadPoolExecutor(8)
`MAX_CONCURRENCY=8` (settings knob). IO-bound; threads + sync client = demo-reliable (async = optional upgrade, not MVP). **No token bucket** — API has no RPS ceiling; 429 is random 30% per-request, not aggregate-rate; a bucket would throttle a nonexistent limit. Lever = bounded politeness.
**Load-bearing invariant:** retries are PER-REQUEST; the semaphore permit is **held during retry sleeps** (caps in-flight+sleeping at 8, prevents retry storm). No shared retry state → no race. Manifest counters behind one `threading.Lock` → exact under concurrency.

## 3. fetch_log — checkpoint/resume
**DDL request → database-engineer (additive migration `NNN_ingest_runtime`, expand-only):**
```sql
CREATE TABLE fetch_log (
  endpoint TEXT NOT NULL, key TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','done','failed')),
  http_status INTEGER, attempts INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT, error TEXT, run_id TEXT, completed_at TEXT,
  PRIMARY KEY (endpoint,key)) STRICT;
CREATE INDEX ix_fetch_log_open ON fetch_log(status) WHERE status!='done';
```
`(endpoint,key)` = stable task identity → UPSERT-safe, no duplicates.
**Resume algorithm:** (1) Plan full task set: 3×(patients,facility) + per-patient (diagnoses,patient_id)(coverage,patient_id)(notes,id)(assessments,id) = 1,203 cold. (2) Seed `pending` via `INSERT…ON CONFLICT DO NOTHING` (done rows untouched). (3) Select `WHERE status!='done'` (uses partial index). (4) Execute via §2 executor. (5) Content-hash short-circuit: skip raw write if hash unchanged, still mark done. (6) Done gate = `NOT EXISTS WHERE status!='done'`; failed rows keep run not-done so later ingest retries.

## 4. Two-identity resolution — Stage 1 HARD GATE (resolve/identity.py)
(1) Fetch 3 facility lists (concurrent, checkpointed). (2) UPSERT both keys into pcc_patient (patient_id TEXT PK + id INT UNIQUE) keyed on patient_id. (3) **GATE:** resolution done only when all 3 list tasks done AND identity row count >0; CLI refuses fan-out / later stages until passed (fail-closed). (4) Fan out with correct key: patient_id→dx/coverage, id(stringified)→notes/assessments — planner reads key column from identity table so wrong-key 422 is structurally impossible. (5) Seed fan-out into fetch_log + execute.

## 5. Typer CLI (woundpipe)
| cmd | args | does |
|---|---|---|
| init-db | --db,--force | create SQLite, PRAGMA WAL/FK on/busy_timeout, run migrations to current user_version. Idempotent. |
| migrate | --db,--to N,--down | apply pending NNN_*.up.sql one-tx-each stamping user_version; --down rolls back via *.down.sql |
| ingest | --db,--facilities,--since,--only,--max-concurrency | plan+seed fetch_log → fetch lists → identity gate → fan out → execute status!='done' → land raw + manifest. --since=incremental. Re-run=resume. |
| extract | --db,--patient,--no-llm | S4 sniff+regex(+LLM). Reads raw, writes wound_extraction. Idempotent per (patient,source). |
| route | --db,--patient | S5 selective classifier → route+reason. Idempotent. |
| publish | --db,--out | materialize views + RunManifest → static JSON for frontend. No live API. |
| run-all | --db,--since,--no-llm,--out | full ordered pipeline w/ resume at every stage. |
**run-all order:** init-db→ingest(GATE before fan-out)→extract(only un-extracted)→route(only un-routed)→publish(always re-materializes, cheap). Resume-safe, fail-closed sequencing (partial map never advances).

## 6. Observability — structlog + RunManifest
JSONL to data/runs/<run_id>.jsonl + pretty console; processor binds run_id, **redacts** *key*/*token*/*secret*/authorization; note_text + names NEVER logged.
**12 events:** run.start/end, ingest.plan, fetch.start/ok/retry/fatal/exhausted, resolve.gate, extract.record, route.decision, snapshot.write (fields per event).
**Counters (thread-safe, persisted to runs row + data/runs/<run_id>.json):** calls_total (per HTTP send incl. retries), calls_429, calls_500, calls_422, retries, tasks_done/failed/resumed, by_format{}, by_route{}, wall_ms, per_stage_ms. Manifest JSON shape = frontend contract.

## 7. Incremental `since` sync
since filters: /patients=last_modified_at, /notes=effective_date, /assessments=assessment_date. **/diagnoses + /coverage have NO since** → patient-delta trigger.
**DDL request → database-engineer:** `sync_state(scope TEXT PK, watermark TEXT, last_run_id TEXT, updated_at TEXT) STRICT`.
Algorithm: (1) read watermarks. (2) fetch deltas via since. (3) dx/coverage: re-fetch only for patients whose last_modified_at advanced (trigger set). (4) guarded UPSERT (ON CONFLICT…WHERE excluded.last_modified_at>=existing). (5) re-process only run_id-touched records. (6) **advance watermark LAST, only after clean run** (no failed in scope) — fail-closed, never skip an un-ingested window.

## 8. Pre-demo snapshot
Highest-impact demo-reliability (R4). (1) build phase: `run-all` repeatedly until `count WHERE status='failed'`==0. (2) **atomic snapshot via SQLite online backup API + `PRAGMA wal_checkpoint(TRUNCATE)`** — NOT `cp` (WAL correctness). (3) ship data/snapshots/demo.db + data/export/snapshot.json; frontend reads JSON, DB queries hit snapshot copy. (4) demo refresh: `publish --db snapshots/demo.db` re-exports offline. Only optional `ingest --since` touches network at demo. Verify: failed==0, patients≈300+, JSON parses, publish offline (airplane-mode).

## 9. Deltas / flags
No policy deltas. Refinements: stop_after_delay(45) added alongside attempts(6); permit held during retry sleeps (anti-storm); snapshot via backup API + WAL checkpoint not cp.
**DDL requests to database-engineer (additive, expand-only, no contract break):** `fetch_log`, `sync_state`, `runs`.
**Cross-section consistency:** the anthropic LLM-lane client (extraction) must ALSO carry an explicit timeout — "no outbound call without a timeout" end-to-end.
**Review requests:** sre-scalability (Semaphore(8)+45s budget vs ~1,203-call wall time); database-engineer (3 runtime DDLs); testing (429-then-200, 422 fail-fast, timeout-exhaustion→failed, resume-after-crash, wrong-key gate refusal).
