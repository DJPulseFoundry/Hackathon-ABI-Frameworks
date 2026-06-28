# Pipeline Architecture — Wound-Care Medicare Part B Billing-Triage (MVP)

> Owner: Pipeline Architect. Scope: the SYSTEM — how stages fit, data flow, ingestion
> resilience, orchestration, observability, build sequence. NOT the DB column schema
> (DB engineer owns it), NOT extraction algorithm internals (extraction researcher owns it).
> Grounded in `.agency/artifacts/grounding/api-reality.md` (REALITY WINS over docs).

---

## 0. The shape of the problem (numbers that drive every decision)

- **~1,203 API calls per full sync**: 3 patient-list calls (one per facility) + 300 patients ×
  4 per-patient endpoints (`/diagnoses`, `/coverage`, `/notes`, `/assessments`) = 1,200.
- **~30% of calls return HTTP 429** with `Retry-After: 1..5`s → expect ~360+ retries on a cold run.
- **Two identities** (`patient_id` string `FA-001` vs `id` integer `1`) must be resolved before
  the per-patient fan-out — this is a hard sequencing constraint, not a detail.
- **DB = SQLite** (mission hard constraint), schema-managed, queryable.
- The **frontend is data-flow-heavy** and needs *real numbers* (fetched / retried / extracted /
  routed) — so observability is a first-class deliverable, not an afterthought.
- The single biggest demo risk is **the live API failing during the 10-minute presentation**.
  The architecture is built so the demo never depends on a live cold fetch.

---

## 1. Recommended architecture (one sentence)

A **linear, idempotent, resumable 7-stage pipeline** of plain Python modules
(`fetch → land raw → resolve identity → normalize → extract → score/route → publish`),
each reading and writing **SQLite**, orchestrated by a thin **Typer CLI** (one subcommand per
stage + `run-all`), with a **structlog** event stream and a persisted **run manifest** that
feeds the dashboard's data-flow visuals. No workflow engine (Prefect/Dagster) — overkill.

This is the simplest thing that is still maintainable and demo-reliable for an MVP.

---

## 2. ASCII data-flow diagram (the whole pipeline)

```
                                   ┌───────────────────────────────────────────────┐
                                   │   PCC MOCK API  hackathon.prod.pulsefoundry.ai │
                                   │   30% -> 429 (Retry-After 1-5s) · 422 · 500    │
                                   └───────────────────────────────────────────────┘
                                                      ▲  GET (idempotent)
                  retry w/ backoff+jitter, honor Retry-After │  bounded concurrency (semaphore=8)
                                                      │
  ┌─────────┐   3 calls    ┌──────────────────────────┴───────────────────────────┐
  │ STAGE 1 │ ───────────► │  ingest/client.py  (httpx + tenacity + semaphore)     │
  │ FETCH   │              │  - 429/500/timeout -> retry ; 422 -> fail-fast + log   │
  │ patients│◄──────────── │  writes raw_* rows + fetch_log (checkpoint) per task   │
  └────┬────┘   patients   └───────────────────────────────────────────────────────┘
       │  (id, patient_id, facility_id, payer_code, last_modified_at)
       ▼
  ┌─────────┐   PERSIST the patient_id<->id map ONCE.  Gate: must finish before fan-out.
  │ STAGE 2 │  resolve/identity.py  ──►  patient table (both keys, first-class join)
  │ RESOLVE │
  └────┬────┘
       │   fan out two ways:
       │      patient_id (FA-001) ─► /diagnoses , /coverage      (1200 calls total,
       │      id (1, int)         ─► /notes     , /assessments    checkpointed + resumable)
       ▼
  ┌─────────────────────── STAGE 1 (cont.) lands ALL raw to SQLite raw_* + fetch_log ───────────┐
  │  raw_patients · raw_diagnoses · raw_coverage · raw_notes · raw_assessments                   │
  └────┬─────────────────────────────────────────────────────────────────────────────────────────┘
       ▼
  ┌─────────┐  normalize/records.py: raw JSON -> typed rows
  │ STAGE 4 │  - coverage: active_mcb = (payer_code=='MCB' AND effective_to IS NULL)   [Delta 3]
  │NORMALIZE│  - diagnoses: active_wound_dx = (wound ICD-10 AND clinical_status=='active')
  └────┬────┘  - assessments: unwrap raw_json (flat OR nested narrative answer)        [Delta 2]
       ▼
  ┌─────────┐  extract/ (researcher owns internals; architecture owns the interface)
  │ STAGE 5 │  router.py: SNIFF FORMAT FROM TEXT, not note_type  [Delta 1]
  │ EXTRACT │     (*Envive | SOAP Subjective:/Objective: | prose 'Meas' | multi-wound)
  │         │  engine.py: extract() -> {wound_type,stage,location,L,W,D,drainage, confidence}
  └────┬────┘     regex baseline ALWAYS ; LLM fallback (flagged, timeout, -> flag_for_review)
       ▼
  ┌─────────┐  route/eligibility.py
  │ STAGE 6 │  inputs: active_mcb + active_wound + measurements(LxW±D)+drainage + corroboration
  │ ROUTE   │  cross-source agreement (dx vs note vs assessment) = confidence backbone
  │         │  -> auto_accept | flag_for_review | reject  + plain-English reason
  └────┬────┘
       ▼
  ┌─────────┐  publish/views.py
  │ STAGE 7 │  eligibility_output (one row/patient) + SQL views + per-patient lineage
  │ PUBLISH │  observability/manifest.py -> runs row + data/runs/<run_id>.json
  └────┬────┘
       │
       ▼                         ┌──────────────────────────────────────────────┐
  eligibility_output (SQLite) ─► │  BEAST DASHBOARD (design agent owns)          │
  run manifest JSON          ─► │  reads exported JSON + SQLite (NO live API     │
  per-patient lineage        ─► │  dependency at demo time) · animates the flow  │
                                 └──────────────────────────────────────────────┘

  Cross-cutting:  config.py (pydantic-settings, .env, ANTHROPIC_API_KEY)  ·
                  logging.py (structlog JSON+console, run_id on every event) ·
                  db/engine.py (WAL, foreign_keys=ON)
  Incremental re-run:  sync_state watermark -> ?since= on patients/notes/assessments
```

---

## 3. Ingestion resilience (the heart of "Pipeline design" judging)

### 3.1 Library choices (with version pins and trade-offs)

| Concern | Recommended (MVP) | Pin | Why / trade-off |
|---|---|---|---|
| HTTP client | **httpx** (sync client) | `httpx==0.27.2` | Modern, connection pooling, timeouts, HTTP/2 optional. Sync client used *inside* a thread pool avoids async cognitive load while keeping a modern lib. `requests` is the fallback if anything surprises. |
| Concurrency | **ThreadPoolExecutor(max_workers=8)** | stdlib | 1,200 calls are IO-bound; threads are the simplest reliable model for a demo. `asyncio + httpx.AsyncClient + asyncio.Semaphore(8)` is the optional speed upgrade — recommend ONLY if time allows; async stack traces eat hackathon hours. |
| Retry | **tenacity** | `tenacity==8.5.0` | `@retry` with a **custom wait** that honors `Retry-After` when present, else `wait_exponential_jitter(initial=1, max=30)`. `stop_after_attempt(6)`. Retry on 429/500/`httpx.TransportError`/timeout; **never** on 422. Mature, declarative, testable. |
| Config/secrets | **pydantic-settings** | `pydantic-settings==2.4.0` | Loads `.env` once into a typed `Settings`; no `os.environ` reads in business code. |
| Logging | **structlog** | `structlog==24.4.0` | Structured JSON events carry `run_id/stage/endpoint/key/attempt/status/latency_ms` — these *are* the dashboard's numbers. |
| DB | **stdlib `sqlite3`** + SQL views (+ optional FTS5) | stdlib | Simplest "state-of-the-art queryable" path. DB engineer decides ORM-vs-raw and migration tooling; architecture only requires: idempotent upserts (`ON CONFLICT ... DO UPDATE`) keyed on natural keys, and a `fetch_log`/`runs`/`sync_state` trio. |
| LLM | **anthropic** SDK | `anthropic>=0.39` | Optional extraction/summary; behind a flag, with timeout + deterministic regex fallback. Key from `.env` only. |

> **Why not async-first?** At 8-way concurrency a cold run is a few minutes; the bottleneck is
> server-side 429 backoff, not client throughput. Async would shave wall time but adds failure
> surface during a live demo. Thread pool + sync httpx is the demo-reliable default; async is a
> documented, isolated upgrade in `ingest/client.py` only.

### 3.2 Retry / backoff / Retry-After

- One `fetch_one(endpoint, key)` function wrapped by tenacity. On a 429, the **custom wait reads
  `Retry-After`** (1–5s) and sleeps exactly that; on 500/timeout it uses
  `exponential + jitter` (jitter prevents a thundering herd of the 8 workers re-firing in lockstep).
- **422 = our bug** (bad/missing param) → do **not** retry; log a structured `error` event with the
  offending key and continue (one bad patient must not abort the run).
- **500** → retry a few times, then mark the task `failed` in `fetch_log` and continue; resume picks
  it up next run.

### 3.3 Bounded concurrency — what rate is safe?

The API enforces **no documented RPS ceiling**; the 429 is a *random 30% per request*, not a leaky
bucket. So the safe move is **politeness + bounded parallelism**, not a precise token rate:
`Semaphore(8)` (8 in-flight max). This keeps 429s manageable, keeps logs readable for the demo, and
finishes fast. A `token_bucket` is optional gold-plating; the semaphore is sufficient. (Expose the
number as `settings.max_concurrency` so it is one knob.)

### 3.4 Idempotent fetch + checkpoint/resume (a partial run is never lost)

- GETs are idempotent by nature. Each fetch task has a stable key `(endpoint, key)`.
- **`fetch_log` table**: one row per task with `status (pending|done|failed)`, `http_status`,
  `attempts`, `content_hash`, `fetched_at`. Raw payload upserts into `raw_<endpoint>` keyed on the
  natural id → **re-running overwrites the same row** (idempotent landing).
- **Resume** = "select tasks where status != 'done'" and run only those. A crash at call 700 of 1,200
  costs only the remaining 500 on restart. This also makes the **pre-demo snapshot** trivial: run to
  completion once, commit/save `woundpipe.db`, and the demo never touches the live API cold.

---

## 4. Two-identity resolution as an explicit stage

`resolve/identity.py` is **Stage 2**, a hard gate:

1. Fetch the 3 facility patient lists (Stage 1).
2. Build the `patient` table holding **both** keys + `facility_id` + `primary_payer_code` +
   `last_modified_at`. This is the first-class join the schema must make permanent.
3. **Fan out** the per-patient fetches using the right key:
   `patient_id` (string) → `/diagnoses`, `/coverage`; `id` (int) → `/notes`, `/assessments`.

Persisting the map once (a) prevents the classic wrong-key 422 storm, (b) makes the join queryable,
(c) lets every later stage address a patient by a single internal key. Nothing downstream runs until
this stage's `done` flag is set.

---

## 5. Orchestration shape — plain modules + a CLI (not a workflow engine)

- **Decision: plain Python modules behind a Typer CLI.** Prefect/Dagster/Airflow are **overkill** for
  6 single-machine stages with no scheduling, no distributed workers, and a 10-minute demo — they add
  install weight, a UI to babysit, and failure surface. Say no.
- Each stage is a **pure-ish function**: read SQLite → transform → upsert SQLite. Because every stage
  is **idempotent** and checks "what's already done," the whole thing is a **resumable linear DAG**
  expressed as ordered function calls — you get DAG semantics without a DAG framework.
- CLI surface (`woundpipe` console script):
  `fetch · resolve · normalize · extract · route · publish · run` (run = all stages in order).
  A one-line `Makefile` wraps `run` for muscle memory. Each subcommand is independently re-runnable —
  ideal for live iteration and for the demo.

---

## 6. Incremental sync (`since`) — cheap re-runs (bonus, architecturally free)

- A **`sync_state`** table stores a per-(facility, endpoint) high-water mark.
- On re-run, pass `?since=<watermark>` to the endpoints that support it —
  `/patients` (`last_modified_at`), `/notes` (`effective_date`), `/assessments` (`assessment_date`).
- `/diagnoses` and `/coverage` have **no `since`** (per API.md): re-fetch only for patients whose
  `last_modified_at` advanced (use the patients delta as the trigger), or re-fetch all (600 cheap
  calls). Default to the delta-triggered path.
- Idempotent upserts make a partial incremental run safe; only **changed records re-extract**, and
  only **affected patients re-route**. Watermark advances only after a clean run.
- This is the "wow" mini-demo: run full sync once (offline snapshot), then a *live* `since` run that
  pulls only the handful of changed records — fast, safe, and tells the integration story.

---

## 7. Module / repo layout (separation of concerns)

```
Hackathon-ABI-Frameworks/
  pyproject.toml             # deps + pins; [project.scripts] woundpipe = "woundpipe.cli:app"
  Makefile                   # make run / make fetch / make demo
  .env.example               # PCC_BASE_URL=...  ANTHROPIC_API_KEY=...  MAX_CONCURRENCY=8
  .env                       # gitignored (real secrets)
  .gitignore                 # .env, data/*.db, data/raw/, data/runs/
  data/
    woundpipe.db             # SQLite store (gitignored; pre-demo snapshot saved separately)
    runs/<run_id>.json       # run manifests for the dashboard
  src/woundpipe/
    config.py                # pydantic-settings Settings (loaded once)
    logging.py               # structlog setup; binds run_id
    cli.py                   # Typer app: one command per stage + run
    db/
      engine.py              # sqlite connect; PRAGMA journal_mode=WAL, foreign_keys=ON
      schema/                # <- DB ENGINEER owns DDL + migrations here
    ingest/
      client.py              # httpx + tenacity (honor Retry-After) + Semaphore
      fetch.py               # idempotent endpoint fetchers; writes raw_* + fetch_log
      checkpoint.py          # fetch_log read/write; resume = pending|failed tasks
    resolve/
      identity.py            # Stage 2: patient_id <-> id map; fan-out keys
    normalize/
      records.py             # raw -> typed; active_mcb, active_wound_dx, unwrap assessments
    extract/                 # <- EXTRACTION RESEARCHER owns internals
      router.py              # format sniffer (text-based, not note_type)
      engine.py              # extract() -> WoundExtraction + confidence
    route/
      eligibility.py         # decision + plain-English reason + corroboration
    publish/
      views.py               # eligibility_output table + SQL views + lineage
    observability/
      manifest.py            # RunManifest dataclass -> runs table + JSON
  tests/                     # fixtures from scratchpad/api_samples.json (offline, deterministic)
```

- **Config + secrets**: `ANTHROPIC_API_KEY` and `PCC_BASE_URL` live in `.env` only, read once by
  `config.py`; `.env` is gitignored, `.env.example` is committed; **secrets never logged** (structlog
  processor redacts). No `os.environ` in business code.
- **Ownership boundaries**: `db/schema/` = DB engineer; `extract/` internals = extraction researcher;
  `route/eligibility.py` policy = routing researcher; `publish/` output contract = this architecture +
  design agent. Clean seams = parallel work.

### Stage interface contracts (so peers align)

- **`fetch_log`**: `(endpoint, key) PK, status, http_status, attempts, content_hash, fetched_at`.
- **`runs` / manifest**: see §8.
- **`eligibility_output`** (one row per patient; column types = DB engineer): `internal_id,
  patient_id, facility_id, name, payer_code, active_mcb, wound_type, stage, location, length_cm,
  width_cm, depth_cm, drainage, extraction_confidence, decision, reason, sources_agree,
  source_lineage_json, last_synced_at`.

---

## 8. Observability for the demo (real numbers for the data-flow visuals)

- **structlog** emits one structured event per fetch/transform: `run_id, stage, endpoint, key,
  attempt, http_status, latency_ms` → console (pretty) + JSONL (machine).
- **RunManifest** (`observability/manifest.py`) persisted to a `runs` row **and** to
  `data/runs/<run_id>.json`, capturing exactly the numbers the dashboard animates:
  - ingestion: `calls_total, calls_429, retries, calls_422, calls_500, cache_hits (resumed), wall_ms`
  - resolution: `patients_resolved, facilities`
  - extraction: `notes_seen, by_format {envive, soap, prose, multiwound}, extracted_ok, llm_used`
  - routing: `auto_accept, flag_for_review, reject`
  - timing: `per_stage_ms`
- Expose a **`v_run_stats`** SQL view + **per-patient `source_lineage_json`** so the frontend can show
  a record physically moving fetch→normalize→extract→route, with the 429/retry count as a headline
  stat (turning the rate-limit *risk* into a visible *story*).
- The dashboard reads the **exported JSON + SQLite** — **no live API dependency at demo time**.

---

## 9. Tech stack recommendation (argued)

**Python 3.11+.** It is the dominant language for (a) heterogeneous-text extraction (regex + the
Anthropic SDK), (b) SQLite-first data work, (c) a mature resilience stack (httpx/tenacity/structlog/
pydantic). The whole team can read it; the extraction/routing researchers' outputs drop straight in.
SQLite (stdlib) satisfies the hard constraint and is "state-of-the-art queryable" via SQL views +
optional FTS5 over `note_text`. The frontend stays decoupled: architecture publishes a clean
`eligibility_output` table + manifest JSON; the design agent builds the dashboard against those (static
export for demo reliability, optional tiny FastAPI read endpoint only for the live `since` mini-demo).

---

## 10. Build-it-in-N-hours plan (~8.5h build; research already done) + cut-lines

| Phase | Time | Deliverable | Must / Nice |
|---|---|---|---|
| 0 Scaffold | 0:00–0:30 | repo, pyproject+pins, `config`, `logging`, `db/engine`, CLI skeleton | MUST |
| 1 Ingest | 0:30–2:00 | client+retry+semaphore, fetch patients→**resolve identity**→fan-out dx/cov/notes/assess, land raw, `fetch_log` checkpoint, manifest counts | **MUST (critical path)** |
| 2 Normalize | 2:00–3:00 | typed rows; `active_mcb` (MCB+`effective_to is null`), active wound dx, unwrap assessment `raw_json` (flat + nested) | MUST |
| 3 Extract | 3:00–5:00 | format sniffer + **regex baseline** on structured+Envive+prose; LLM fallback behind flag | MUST = regex baseline; NICE = LLM |
| 4 Route | 5:00–6:00 | eligibility + plain-English reason + cross-source corroboration confidence | MUST |
| 5 Publish | 6:00–7:30 | `eligibility_output` + SQL views + run manifest JSON for dashboard | MUST |
| 6 Polish | 7:30–8:30 | demo script, 3 example patients (auto/flag/reject), **`since` incremental mini-demo** | MUST = demo script; NICE = since-sync |
| Buffer | 8:30+ | pre-fetch + save full SQLite snapshot; rehearse | MUST |

**Cut-lines for the 10-minute presentation**
- **Must-have**: resilient ingest of all 300 patients into SQLite (429-handled, resumable);
  identity resolution; regex extraction on structured + Envive; MCB eligibility; routing + reason;
  `eligibility_output` table; run manifest with **real** retry/extract/route numbers; one strong visual.
- **Nice-to-have (drop first if behind)**: LLM extraction/summary; incremental `since` sync; FTS5
  search; live FastAPI; animated (vs static) data-flow viz; sophisticated multi-wound primary-pick.

**Critical path**: ingestion resilience → identity resolution → everything else. If ingest is flaky,
nothing demos.

**Risks & mitigations**
- **R1 Live API fails mid-demo** → pre-fetched SQLite snapshot; demo runs offline; live call only for
  the tiny `since` mini-demo. *(Highest-impact mitigation.)*
- **R2 429 storms inflate wall time** → `Semaphore(8)` + honor `Retry-After` + jitter; surface retries
  as a headline stat (risk → story).
- **R3 LLM nondeterminism/latency/cost** → regex baseline always present; LLM flagged, timeout-bounded,
  falls back to `flag_for_review`.
- **R4 `note_type` misleads format** → sniff format from text (Delta 1).
- **R5 assessment `raw_json` shape varies** → parser handles flat + nested narrative (Delta 2).
- **R6 eligibility keyed wrong** → `payer_code=='MCB'` + `effective_to is null` (Delta 3), not `payer_type`.
- **R7 async debugging eats hours** → ship threads+sync-httpx; async is an isolated optional upgrade.

---

## 11. Critical files for implementation
- `src/woundpipe/ingest/client.py` — retry (honor Retry-After) + bounded concurrency; the resilience core.
- `src/woundpipe/ingest/fetch.py` + `ingest/checkpoint.py` — idempotent landing + `fetch_log` resume.
- `src/woundpipe/resolve/identity.py` — the two-identity gate that sequences the whole fan-out.
- `src/woundpipe/cli.py` — stage orchestration (the resumable linear DAG).
- `src/woundpipe/observability/manifest.py` — run manifest = the dashboard's real numbers.
