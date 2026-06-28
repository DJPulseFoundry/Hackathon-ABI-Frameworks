# T3 — SQLite Schema + Query Layer (database-engineer) — EXECUTION-VERIFIED
_Persisted by CEO; subagent write was harness-blocked. Verified against SQLite 3.51.0 / Python sqlite3 3.53.0. Validated scratch DBs at scratchpad/{schema.sql,test.db,mig.db}._

## Recommendation
Ship STRICT raw layer + `wound_extraction` + `v_patient_eligibility` VIEW; drive ingestion with guarded UPSERT; manage change with versioned up/down SQL + `PRAGMA user_version` runner under expand/contract with tested rollback.

**Connection PRAGMAs:** `journal_mode=WAL` (verified), `foreign_keys=ON`, `busy_timeout=5000`, `synchronous=NORMAL`.
**Versions:** SQLite 3.51 (STRICT/generated-cols/DROP COLUMN/FTS5/JSON1 all present), Python lib 3.53; migration runner yoyo-migrations 9.x (or zero-dep runner below); sqlite-utils 3.x for ad-hoc.

## Full DDL (centerpiece)
```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA user_version = 1;

-- ============ RAW / LANDING LAYER ============
CREATE TABLE pcc_patient (
  patient_id          TEXT    NOT NULL PRIMARY KEY,   -- string identity (FA-001) -> dx, coverage
  id                  INTEGER NOT NULL UNIQUE,        -- integer identity (1)     -> notes, assessments
  facility_id         INTEGER NOT NULL,
  first_name TEXT, last_name TEXT, birth_date TEXT, gender TEXT,
  primary_payer_code  TEXT,
  last_modified_at    TEXT,
  is_new_admission    INTEGER NOT NULL DEFAULT 0 CHECK (is_new_admission IN (0,1)),
  fetched_at TEXT NOT NULL, source_endpoint TEXT NOT NULL DEFAULT '/pcc/patients',
  raw_payload TEXT NOT NULL, sync_version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1))
) STRICT;
CREATE INDEX ix_patient_facility ON pcc_patient(facility_id);
CREATE INDEX ix_patient_payer    ON pcc_patient(primary_payer_code);

CREATE TABLE pcc_diagnosis (
  id INTEGER NOT NULL PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES pcc_patient(patient_id),
  icd10_code TEXT, icd10_description TEXT,
  clinical_status TEXT CHECK (clinical_status IN ('active','resolved','inactive') OR clinical_status IS NULL),
  onset_date TEXT, last_modified_at TEXT,
  fetched_at TEXT NOT NULL, source_endpoint TEXT NOT NULL DEFAULT '/pcc/diagnoses',
  raw_payload TEXT NOT NULL, sync_version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1))
) STRICT;
CREATE INDEX ix_dx_active_wound ON pcc_diagnosis(patient_id)
  WHERE clinical_status = 'active' AND icd10_code LIKE 'L89%';   -- PARTIAL
CREATE INDEX ix_dx_patient ON pcc_diagnosis(patient_id);

CREATE TABLE pcc_coverage (
  id INTEGER NOT NULL PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES pcc_patient(patient_id),
  payer_name TEXT, payer_code TEXT, payer_type TEXT,    -- reality: "Medicare", NOT "Medicare B"
  effective_from TEXT, effective_to TEXT,               -- NULL => active (eligibility key)
  last_modified_at TEXT,
  fetched_at TEXT NOT NULL, source_endpoint TEXT NOT NULL DEFAULT '/pcc/coverage',
  raw_payload TEXT NOT NULL, sync_version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1))
) STRICT;
CREATE INDEX ix_cov_active_mcb ON pcc_coverage(patient_id)
  WHERE payer_code = 'MCB' AND effective_to IS NULL;            -- PARTIAL: eligibility hot path

CREATE TABLE progress_note (
  id INTEGER NOT NULL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES pcc_patient(id),
  org_id TEXT, pcc_note_id INTEGER,
  note_type TEXT,                                          -- does NOT determine format
  effective_date TEXT, note_text TEXT, created_by TEXT, note_label TEXT,
  fetched_at TEXT NOT NULL, source_endpoint TEXT NOT NULL DEFAULT '/pcc/notes',
  raw_payload TEXT NOT NULL, sync_version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1))
) STRICT;
CREATE INDEX ix_note_patient ON progress_note(patient_id, effective_date);

CREATE TABLE pcc_assessment (
  id INTEGER NOT NULL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES pcc_patient(id),
  org_id TEXT, pcc_assessment_id INTEGER,
  assessment_type TEXT, status TEXT,
  assessment_date TEXT, completion_date TEXT, template_id INTEGER,
  assessment_type_description TEXT,
  raw_json TEXT,                              -- shape VARIES: flat OR nested narrative
  a_wound_type TEXT GENERATED ALWAYS AS (json_extract(raw_json,'$.wound_type')) VIRTUAL,
  a_stage      TEXT GENERATED ALWAYS AS (json_extract(raw_json,'$.stage'))      VIRTUAL,
  a_location   TEXT GENERATED ALWAYS AS (json_extract(raw_json,'$.location'))   VIRTUAL,
  a_length_cm  REAL GENERATED ALWAYS AS (json_extract(raw_json,'$.length_cm'))  VIRTUAL,
  a_width_cm   REAL GENERATED ALWAYS AS (json_extract(raw_json,'$.width_cm'))   VIRTUAL,
  a_depth_cm   REAL GENERATED ALWAYS AS (json_extract(raw_json,'$.depth_cm'))   VIRTUAL,
  fetched_at TEXT NOT NULL, source_endpoint TEXT NOT NULL DEFAULT '/pcc/assessments',
  raw_payload TEXT NOT NULL, sync_version INTEGER NOT NULL DEFAULT 1,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0,1))
) STRICT;
CREATE INDEX ix_assess_patient ON pcc_assessment(patient_id, assessment_date);
CREATE INDEX ix_assess_wtype   ON pcc_assessment(a_wound_type);

-- FTS5 external-content over note_text (zero text duplication)
CREATE VIRTUAL TABLE progress_note_fts USING fts5(
  note_text, content='progress_note', content_rowid='id', tokenize='porter unicode61');
-- + AFTER INSERT/DELETE/UPDATE triggers keeping FTS in sync (progress_note_ai/ad/au)

-- ============ EXTRACTION / DERIVED LAYER ============
CREATE TABLE wound_extraction (
  id INTEGER PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES pcc_patient(patient_id),
  source_kind TEXT NOT NULL CHECK (source_kind IN ('note','assessment','diagnosis')),
  source_note_id INTEGER REFERENCES progress_note(id),
  source_assessment_id INTEGER REFERENCES pcc_assessment(id),
  is_primary INTEGER NOT NULL DEFAULT 1 CHECK (is_primary IN (0,1)),     -- multi-wound -> primary
  extraction_method TEXT NOT NULL CHECK (extraction_method IN
    ('regex_spn','regex_envive','regex_prose','soap','json','llm','manual')),
  wound_type TEXT, wound_type_conf REAL CHECK (wound_type_conf BETWEEN 0 AND 1 OR wound_type_conf IS NULL),
  stage TEXT CHECK (stage IN ('1','2','3','4','unstageable','DTI','N/A') OR stage IS NULL),
  stage_conf REAL, location TEXT, location_conf REAL,
  length_cm REAL CHECK (length_cm >= 0 OR length_cm IS NULL),
  width_cm  REAL CHECK (width_cm  >= 0 OR width_cm  IS NULL),
  depth_cm  REAL CHECK (depth_cm  >= 0 OR depth_cm  IS NULL),
  measure_conf REAL,
  drainage TEXT CHECK (drainage IN ('none','light','moderate','heavy') OR drainage IS NULL),
  drainage_conf REAL,
  overall_conf REAL CHECK (overall_conf BETWEEN 0 AND 1 OR overall_conf IS NULL),
  extracted_at TEXT NOT NULL
) STRICT;
CREATE INDEX ix_wx_patient ON wound_extraction(patient_id, is_primary);
```

## Eligibility output as a live VIEW
```sql
CREATE VIEW v_patient_eligibility AS
WITH active_mcb AS (
  SELECT DISTINCT patient_id FROM pcc_coverage
  WHERE payer_code='MCB' AND effective_to IS NULL AND is_current=1),
active_wound_dx AS (
  SELECT DISTINCT patient_id FROM pcc_diagnosis
  WHERE clinical_status='active' AND icd10_code LIKE 'L89%' AND is_current=1),
prim AS (
  SELECT w.* FROM wound_extraction w WHERE w.is_primary=1
  GROUP BY w.patient_id HAVING w.overall_conf=MAX(w.overall_conf))
SELECT p.patient_id, p.id AS internal_id, p.facility_id, p.first_name, p.last_name,
  prim.wound_type, prim.stage, prim.location, prim.length_cm, prim.width_cm, prim.depth_cm, prim.drainage,
  prim.overall_conf AS confidence,
  (amcb.patient_id IS NOT NULL) AS has_active_mcb,
  (awd.patient_id IS NOT NULL OR prim.wound_type IS NOT NULL) AS has_active_wound,
  CASE
    WHEN amcb.patient_id IS NULL THEN 'reject'
    WHEN prim.wound_type IS NULL THEN 'reject'
    WHEN prim.length_cm IS NOT NULL AND prim.width_cm IS NOT NULL AND prim.depth_cm IS NOT NULL
         AND prim.drainage IS NOT NULL AND prim.overall_conf>=0.80 AND awd.patient_id IS NOT NULL
      THEN 'auto_accept'
    ELSE 'flag_for_review' END AS route,
  CASE
    WHEN amcb.patient_id IS NULL  THEN 'No active Medicare Part B coverage'
    WHEN prim.wound_type IS NULL  THEN 'No extractable wound found'
    WHEN prim.depth_cm IS NULL    THEN 'Missing depth measurement'
    WHEN prim.drainage IS NULL    THEN 'Missing drainage'
    WHEN prim.overall_conf<0.80   THEN 'Low extraction confidence'
    WHEN awd.patient_id IS NULL   THEN 'No corroborating active ICD-10 wound dx'
    ELSE 'Active MCB + active wound + complete measurements, sources agree' END AS reason
FROM pcc_patient p
LEFT JOIN active_mcb amcb ON amcb.patient_id=p.patient_id
LEFT JOIN active_wound_dx awd ON awd.patient_id=p.patient_id
LEFT JOIN prim ON prim.patient_id=p.patient_id
WHERE p.is_current=1;
```
VIEW (not materialized): live correctness, sub-ms at 300 patients. Materialize into `report_eligibility` only if routing becomes LLM-expensive.

## Verification evidence (executed, not asserted)
- Generated cols parse `raw_json` with no app code (`a_wound_type=pressure_ulcer a_stage=3 a_length_cm=2.9 a_depth_cm=0.4`).
- FTS5 `MATCH 'serosanguineous'` → note 1, highlighted snippet.
- VIEW routes seeded FA-001 → `auto_accept` with the "sources agree" reason.
- `EXPLAIN QUERY PLAN` on active-MCB predicate → `USING INDEX ix_cov_active_mcb` (partial index chosen, no scan).
- STRICT+CHECK rejects bad drainage / clinical_status writes.
- Idempotent UPSERT ran twice → row count stayed 1.

## Idempotent UPSERT (re-fetch / since sync)
`INSERT … ON CONFLICT(patient_id) DO UPDATE SET … sync_version=pcc_patient.sync_version+1, is_current=1 WHERE excluded.last_modified_at >= pcc_patient.last_modified_at;` (monotonic guard; use `>` if identical-timestamp refetches must be no-ops). Verified no dup rows.

## Schema management / migrations
Versioned `migrations/NNN_name.{up,down}.sql` + `PRAGMA user_version`; 30-line zero-dep Python runner (applies pending ups, one tx each; body stamps user_version). Recommend yoyo-migrations 9.x for managed CLI. **Expand/contract:** ADD COLUMN nullable → paced backfill → deploy reader/writer → later off-peak DROP COLUMN (rewrites). **Rollback tested**: up→down→up clean (v2→v1→v2). Generated cols / FTS triggers recreated in-tx (can't ALTER in place).

## Six killer queries
1. worklist (auto_accept by confidence) · 2. review queue (flag_for_review) · 3. funnel by facility×route · 4. FTS note search (`f MATCH 'odor AND slough'`) · 5. source-conflict audit (flag vs active L89 dx) · 6. structured assessment pull via generated cols.

## Risks
- R1 contract-phase DROP COLUMN rewrites under write lock — off-peak, reversible (low).
- R2 restore drill scripted but not run on full 300-patient DB (medium).
- R3 `auto_accept` confidence threshold 0.80 is a PLACEHOLDER — calibrate before trusting auto-routing (medium). Ties to routing report's conformal/gold-set plan.
**Review requests:** sre-scalability (WAL + busy_timeout under ~1,203-call sync); extraction/ontology owner (R3 calibration + wound_extraction field contract).
