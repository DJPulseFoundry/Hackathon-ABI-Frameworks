# SPEC §Data Layer (database-engineer) — BUILD-READY
_Persisted by CEO; subagent write harness-blocked. Built on EXECUTION-VERIFIED research-schema (SQLite 3.51.0 / py 3.53.0). Conforms to MASTER-BLUEPRINT §4/§4b._

## 0. Engine & PRAGMAs
SQLite 3.51 (STRICT, generated cols, FTS5, JSON1, partial indexes, user_version, WAL — all confirmed; portable to 3.37). Every connection: `journal_mode=WAL, foreign_keys=ON, busy_timeout=5000, synchronous=NORMAL`. Migrations run ONLY at Stage 0 (scaffold), never interleaved with ingest. Roaring bitmaps/sketches rejected (300 patients = trivially in-memory; B-tree + partial indexes win).

## 1. Final DDL (migration 001_initial_schema.up.sql)
Raw tables (pcc_patient, pcc_diagnosis, pcc_coverage, progress_note, pcc_assessment) STRICT + CHECK enums + provenance (fetched_at, source_endpoint, raw_payload, sync_version, is_current). Key points (full DDL in research-schema/report.md, extended here):
- `pcc_patient(patient_id TEXT PK, id INTEGER UNIQUE, ...)` — two-identity both keys first-class.
- `pcc_diagnosis`: partial `ix_dx_active_wound ON (patient_id) WHERE clinical_status='active' AND icd10_code LIKE 'L89%'`.
- `pcc_coverage`: partial `ix_cov_active_mcb ON (patient_id) WHERE payer_code='MCB' AND effective_to IS NULL`.
- `pcc_assessment`: VIRTUAL generated cols a_wound_type/a_stage/a_location/a_length_cm/a_width_cm/a_depth_cm via json_extract (flat shape; nested narrative → NULL → text extractor).
- FTS5 external-content `progress_note_fts(note_text, content='progress_note', content_rowid='id', tokenize='porter unicode61')` + AFTER INSERT/DELETE/UPDATE sync triggers.
- **wound_extraction** STRICT: id, patient_id→pcc_patient, source_kind CHECK('note','assessment','diagnosis'), source_note_id, source_assessment_id, is_primary, extraction_method CHECK(enum), wound_type+conf, stage CHECK('1'..'4','unstageable','DTI','N/A')+conf, location+conf, length/width/depth_cm CHECK(>=0)+measure_conf, drainage CHECK('none','light','moderate','heavy')+conf, overall_conf, **evidence_span_start/end + evidence_quote** (highlight), extracted_at. Indexes ix_wx_patient(patient_id,is_primary), ix_wx_source(source_kind,patient_id), unique ux_wx_dedup(patient_id,source_kind,IFNULL(source_note_id,-1),IFNULL(source_assessment_id,-1)).
  - **A synthetic `source_kind='diagnosis'` row** (wound_type/location/stage from active L89 dx via ICD-10 taxonomy) is written by EXTRACTION so dx participates as an evidence node.
- **fetch_log** STRICT: task_id TEXT PK (deterministic e.g. 'diagnoses:FA-001'), endpoint, identity_kind CHECK('facility','patient_id','id'), identity_value, status CHECK('pending','in_flight','done','failed'), attempts, http_status, retry_count, retry_after_s, n_records, error, planned_at/first_attempt_at/last_attempt_at/completed_at. Partial `ix_fetch_pending ON (status) WHERE status<>'done'`.
- **run_manifest** STRICT: run_id PK, started_at, finished_at, n_calls, n_429, n_retries, n_patients, n_extracted, counts_json (by-format/by-route JSON), git_sha.

## 2. Views
### 2a. v_wound_corroboration (§4b)
One row per patient×evidence-source (edge to primary wound; `corroborates` = edge color).
```sql
CREATE VIEW v_wound_corroboration AS
WITH primary_wound AS (
  SELECT patient_id, wound_type, stage, location, MAX(overall_conf) AS overall_conf
  FROM wound_extraction WHERE is_primary=1 GROUP BY patient_id)
SELECT w.patient_id, w.source_kind AS evidence_node, w.source_note_id, w.source_assessment_id, w.id AS extraction_id,
  (w.wound_type=p.wound_type) AS type_agrees, (w.location=p.location) AS location_agrees,
  (w.stage IS p.stage) AS stage_agrees,
  (w.wound_type=p.wound_type AND w.location=p.location) AS corroborates,
  w.overall_conf, w.evidence_quote
FROM wound_extraction w JOIN primary_wound p USING(patient_id);
CREATE VIEW v_corroboration_summary AS
SELECT patient_id, COUNT(*) AS n_sources, SUM(corroborates) AS n_agree,
  MIN(corroborates) AS all_agree, (COUNT(*)-SUM(corroborates)) AS n_conflict
FROM v_wound_corroboration GROUP BY patient_id;
```
`all_agree=1 AND n_sources>=2` = true cross-source agreement.

### 2b. v_patient_eligibility (SQL realization of routing policy)
CTEs: active_mcb (payer_code='MCB' AND effective_to IS NULL AND is_current), active_wound_dx (active AND icd10 LIKE 'L89%'), prim (is_primary=1, MAX overall_conf), corr (v_corroboration_summary). Route CASE (first-match, order = §3 policy):
```
reject  if no active_mcb
reject  if no active_wound (no dx AND no extracted wound_type)
reject  if wound_type NULL (extraction impossible)
auto_accept if length+width+depth+drainage all NOT NULL AND overall_conf>=0.80
            AND corr.all_agree=1 AND corr.n_sources>=2 AND active_wound_dx present
flag_for_review otherwise (default-safe abstain)
```
Reason CASE: no MCB / no wound / extraction impossible / missing depth / missing drainage / missing dimensions / sources disagree / single-source / low confidence / no corroborating dx / else "complete + agree". Non-materialized (sub-ms at 300; live correctness).
**BINDING sync flag:** threshold 0.80 (R2 placeholder, calibrate), CASE arm order, and agreement def (all_agree=1 AND n_sources>=2) MUST match spec-routing §3.

## 3. Indexes (EXPLAIN-justified)
Two-identity PK+UNIQUE; ix_patient_facility/payer (funnel/Sankey); ix_dx_patient + partial ix_dx_active_wound (verified USING INDEX); partial **ix_cov_active_mcb** (#1 eligibility predicate, verified no-scan); ix_note_patient(patient_id,effective_date); ix_assess_patient + ix_assess_wtype (generated col); ix_wx_patient/ix_wx_source/ux_wx_dedup; partial **ix_fetch_pending** (resume = "what's not done"); FTS5 inverted. Every index justified by a read path; no speculative index.

## 4. Idempotent UPSERT (per table)
Insert verbatim; ON CONFLICT DO UPDATE only if incoming newer (monotonic guard); sync_version++, is_current=1. Targets: pcc_patient(patient_id), diagnosis/coverage/note/assessment(id), wound_extraction(ux_wx_dedup), fetch_log(task_id: DO NOTHING if done). Guard: last_modified_at>= (patient/dx/coverage) or fetched_at>= (notes/assessments carry no last_modified). Verified: ran twice → count 1.

## 5. Migrations
Convention: `migrations/NNN_name.{up,down}.sql`, NNN==user_version it advances to; one tx each; down reverses to N-1 (drops views→triggers→tables FK-safe). Full schema = 001. **Zero-dep runner** db/migrate.py (migrate_up/migrate_down via PRAGMA user_version; executescript BEGIN;…;PRAGMA user_version=N;COMMIT;). yoyo 9.x optional.
**Expand/contract:** ADD COLUMN nullable (metadata-only, no rewrite) → paced batched backfill → switch → enforce via table rebuild → DROP COLUMN (rewrites under write lock, off-peak). Generated cols + FTS triggers dropped+recreated in-tx.
**Tested rollback (RUN):** up→down 0→up against /tmp copy; `.schema | sha256sum` compare + smoke SELECT on views. Verified v2→v1→v2 clean in research cycle. CI gate: migration PR not mergeable until up→down→up green.

## 6. Repository interface (typed, parameterized)
`worklist(con, route)`, `patient_detail(con, patient_id)` (eligibility+notes+extractions+corroboration), `corroboration(con, patient_id)` (edges+summary), `run_funnel(con)` (by_route/by_facility/totals), `note_search(con, q)` (FTS5 MATCH param, snippet, ORDER BY rank). row_factory=sqlite3.Row → dicts. **These dict shapes ARE the frontend contract atoms.**

## 7. JSON export (frontend contract — publish Stage S6)
`export_json(con)` → `{patients[], funnel, manifest, generated_at}`. Each patient: eligibility fields + route + reason + confidence + `evidence_graph{nodes[], edges[], summary}` (nodes = evidence sources + wound node; edges carry corroborates/type_agrees/location_agrees/stage_agrees → React Flow). Writes static app_data.json (no backend at demo). One read-only connection.

## 8. Durability (RPO/RTO)
Backup = `VACUUM INTO 'snapshots/app_<ts>.db'` (consistent under WAL, checkpoints+defrags) + app_data.json as second copy. RPO=0 for demo (demo FROM snapshot). RTO=seconds. **GAP R3:** restore drill scripted but NOT run on full 300-patient DB → add `make verify-restore` (count per table vs manifest, 3 routes present, one patient_detail read) — until run, "backups exist" is asserted not verified.

## 9. Deltas (all additive)
1. Added evidence_span_start/end + evidence_quote to wound_extraction (highlight). 2. Added fetch_log + run_manifest (flag for ingestion coordination). 3. Added corroboration views + **tightened auto_accept to require cross-source agreement** (all_agree=1 AND n_sources>=2) — matches routing §3. 4. CHECK ranges on _conf cols + ux_wx_dedup. 5. ix_wx_source + partial ix_fetch_pending. 6. Pinned MAX-bare-column pattern to 3.51.

## Requests (filed by CEO at SERVE)
- REQ-D1 → routing: confirm CONF_THRESHOLD=0.80, CASE order, agreement def match.
- REQ-D2 → ingestion: confirm fetch_log + run_manifest contract; add since-cursor via migration 002 if needed.
- REQ-D3 → architecture: adopt export_json() keys (patients[]/funnel/manifest) + evidence_graph verbatim, or map.
- REQ-D4 → sre-scalability: review WAL + busy_timeout under ~1,203-call sync.
## Risks
R3 restore drill unrun on full DB (med). R2 threshold 0.80 placeholder (med). VIEW CASE must stay lockstep with routing (low). Contract DROP COLUMN write-lock off-peak (low).
