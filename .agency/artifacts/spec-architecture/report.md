# SPEC §S1 — Architecture & Interfaces (Systems Architect)
_Persisted by CEO; subagent was read-only/blocked. Conforms to MASTER-BLUEPRINT.md. Authoritative DB shape = research-schema. Deltas flagged inline (A–E)._

## A. Flagged deltas (read first — CEO reconciles at synthesis)
- **Delta A — stage count.** Blueprint says "7-stage" but names six. Resolution: keep six named data-stages + make **format-sniff an explicit seam (S3)**. Canonical: **S0 ingest · S1 resolve · S2 normalize · S3 sniff · S4 extract · S5 route · S6 publish**.
- **Delta B — evidence spans not in the DB.** Frontend highlight + evidence graph (§4b) need verbatim char-offset spans per field; `wound_extraction` stores values+confidences but NO spans. Resolution: carry `FieldEvidence{value, evidence_span:(start,end), method, source_conf}` in DTO + JSON export; persist via side table `wound_field_evidence(extraction_id, field, char_start, char_end, method)` OR a JSON column. **→ DB engineer must adopt.**
- **Delta C — pcc_patient vs patient.** Follow research-schema: single `pcc_patient(patient_id PK, id UNIQUE)`, both keys first-class. `PatientRef` carries both.
- **Delta D — corroboration source `diagnosis` has no note/assessment id.** Evidence-graph builder must tolerate a dx node whose evidence is the ICD-10 code string.
- **Delta E — `auto_accept` threshold 0.80 is a placeholder** → `settings.auto_accept_threshold` (one calibratable knob).

## B. Repo / package layout
```
Hackathon-ABI-Frameworks/
  pyproject.toml              # [project.scripts] woundpipe = "woundpipe.cli:app"
  Makefile  .env.example  .env(gitignored)  .gitignore
  data/  woundpipe.db · runs/<run_id>.json · export.json
  migrations/  NNN_name.{up,down}.sql   (data-layer author)
  src/woundpipe/
    config.py  logging.py  errors.py  models.py  cli.py
    db/        engine.py(PRAGMA WAL,FK on,busy_timeout) migrate.py(user_version) schema/
    ingest/    client.py(httpx+tenacity,Semaphore8) fetch.py checkpoint.py(fetch_log resume)
    resolve/   identity.py(S1 gate: patient_id<->id map + fan-out)
    normalize/ records.py(S2: active_mcb/active_wound_dx; unwrap assessment raw_json)
    extract/   sniff.py(S3) regex_lane.py llm_lane.py reconcile.py engine.py(S4)
    route/     eligibility.py(S5 selective classifier) reasons.py
    publish/   views.py(S6 -> export.json) corroboration.py(EvidenceGraph)
    observability/ manifest.py(RunManifest)
  tests/  fixtures/(from api_samples.json) test_*.py
  frontend/  Vite SPA reads data/export.json; screens CommandCenter·Triage·PatientDetail·PipelineFlow
```
Ownership seams: db/schema+migrations=DB author; extract/* internals=extraction author; route/eligibility policy=routing author; ingest/*=ingestion author; models.py, publish/, observability/, cli.py, config.py=architecture.

## C. Stage interface contracts (7 seams)
Every stage: `fn(settings, conn, run, *args) -> StageResult`. All idempotent + resumable.
```python
@dataclass
class StageResult:
    stage: str; ok: bool; counts: dict[str,int]; duration_ms: int; errors: list[StageError]
```
- **S0 ingest**(`facilities=(101,102,103), resume=True`): fetch 3 patient lists → `pcc_patient`; one `fetch_log` row per task. Idempotent UPSERT w/ last_modified_at guard. ThreadPoolExecutor(max_concurrency); tenacity honors Retry-After on 429, exp+jitter 500/timeout, stop_after_attempt(6); 422→`PermanentHTTP` no retry.
- **S1 resolve** (HARD GATE + fan-out): confirm patient_id↔id map total; fan out 1,200 per-patient fetches w/ correct key per endpoint (patient_id→dx/coverage, id→notes/assessments). Nothing downstream runs until ok=True.
- **S2 normalize**: raw→typed; `active_mcb=payer_code=='MCB' AND effective_to IS NULL` (Delta 3); `active_wound_dx=clinical_status=='active' AND icd10 LIKE 'L89%'`; unwrap assessment raw_json (flat→generated cols; nested→text). Does NOT touch wound_extraction.
- **S3 sniff**: `detect_format(text)->(NoteFormat, conf)` from TEXT not note_type. Formats: envive/soap/prose/spn/assess_flat/assess_narrative/unknown. Low format_conf = ambiguity flag.
- **S4 extract**(`use_llm=True`): Lane1 regex (owns L×W×D/stage/drainage/location, literal-or-null); Lane2 Claude structured (temp0, pinned model, evidence_span before value, verbatim-span gate); Lane3 reconciler (per-field + overall_conf from source agreement). Picks is_primary. Writes wound_extraction (+wound_field_evidence, Delta B). Degradation: LLM error→regex-only lowered conf, never aborts.
- **S5 route**: deterministic selective classifier → route+reason using `settings.auto_accept_threshold`. Every patient gets a non-empty reason (NFR-7). Conforms to v_patient_eligibility CASE.
- **S6 publish**: ensure views; assemble export.json (patients[]+manifest+funnel); persist RunManifest to runs row + data/runs/<run_id>.json.
Orchestration: `cli.run` threads one RunManifest(run_id=uuid) S0→S6; each subcommand independently re-runnable.

## D. Shared DTOs (models.py) — conform to wound_extraction
```python
@dataclass(frozen=True)
class PatientRef: patient_id:str; id:int; facility_id:int; primary_payer_code:str|None; last_modified_at:str|None
class Drainage(StrEnum): NONE="none";LIGHT="light";MODERATE="moderate";HEAVY="heavy"
class Stage(StrEnum): S1="1";S2="2";S3="3";S4="4";UNSTAGEABLE="unstageable";DTI="DTI";NA="N/A"
class SourceKind(StrEnum): NOTE="note";ASSESSMENT="assessment";DIAGNOSIS="diagnosis"
class ExtractionMethod(StrEnum): REGEX_SPN="regex_spn";REGEX_ENVIVE="regex_envive";REGEX_PROSE="regex_prose";SOAP="soap";JSON="json";LLM="llm";MANUAL="manual"
class Route(StrEnum): AUTO="auto_accept";FLAG="flag_for_review";REJECT="reject"
@dataclass
class FieldEvidence: value:str|float|None; evidence_span:tuple[int,int]|None; method:ExtractionMethod; source_conf:float|None
@dataclass
class ExtractedWound:  # mirrors wound_extraction columns 1:1
    patient_id:str; source_kind:SourceKind; source_note_id:int|None; source_assessment_id:int|None
    is_primary:bool; extraction_method:ExtractionMethod
    wound_type:str|None; wound_type_conf:float|None; stage:Stage|None; stage_conf:float|None
    location:str|None; location_conf:float|None
    length_cm:float|None; width_cm:float|None; depth_cm:float|None; measure_conf:float|None
    drainage:Drainage|None; drainage_conf:float|None; overall_conf:float|None; extracted_at:str
    evidence:dict[str,FieldEvidence]   # Delta B, keyed by field name
@dataclass
class EvidenceNode: id:str; kind:str; label:str        # 'dx:L89.143'|'note:1'|'assess:55001'|'wound:primary'
@dataclass
class EvidenceEdge: source:str; target:str; relation:str; color:str   # agree/conflict, green/red
@dataclass
class EvidenceGraph: nodes:list[EvidenceNode]; edges:list[EvidenceEdge]; agreeing_sources:int
@dataclass
class PatientFacts: ref:PatientRef; has_active_mcb:bool; has_active_wound:bool; primary:ExtractedWound|None; completeness:float; agreement:str; ambiguity_flags:list[str]
@dataclass
class RoutedPatient: ref:PatientRef; route:Route; reason:str; confidence:float|None; facts:PatientFacts; graph:EvidenceGraph
```

## E. RunManifest schema (observability/manifest.py)
Persisted to `runs` row + data/runs/<run_id>.json; frontend pipeline-flow reads it.
- IngestCounts: calls_total, calls_429, calls_422, calls_500, retries, resumed, by_endpoint{}, wall_ms
- ResolveCounts: patients_resolved, facilities, fanout_tasks
- ExtractCounts: notes_seen, by_format{envive/soap/prose/spn/assess_flat/assess_narrative}, extracted_ok, llm_used, span_gate_drops
- RouteCounts: auto_accept, flag_for_review, reject, by_reason{}
- RunManifest: run_id(uuid4), started_at, finished_at, base_url(secret-free), ingest, resolve, extract, route, per_stage_ms{}, ok
Invariants: calls_total==sum(by_endpoint); auto+flag+reject==patients_resolved; extracted_ok<=notes_seen.

## F. Config & secrets (config.py — pydantic-settings, env_prefix WP_)
Fields: anthropic_api_key(secret), pcc_base_url(default hackathon URL), db_path, export_path, runs_dir, max_concurrency=8, http_timeout_s=30, max_attempts=6, retry_after_cap_s=10, use_llm=True, model_bulk="claude-haiku-4-5-20251001", model_escalate="claude-sonnet-4-6", llm_timeout_s=20, auto_accept_threshold=0.80(Delta E).
Precedence: constructor > .env > process env(WP_*) > default. .env.example committed (no secrets). Redaction: SECRET_FIELDS={anthropic_api_key}; structlog processor redacts keys matching *_key/*_token/authorization. Manifest stores base_url only.

## G. Frontend JSON data contract (data/export.json) — backend↔frontend seam
Top-level: `generated_at, run_id, manifest(RunManifest), funnel, patients[]`.
- **funnel**: total, mcb_active, active_wound, has_measurements, auto_accept, flag_for_review, reject, sankey[]{source,target,value} (payer→eligibility→route bands).
- **patients[]** each: patient_id, internal_id, facility_id, name, payer_code, has_active_mcb, has_active_wound,
  `wound{wound_type,stage,location,length_cm,width_cm,depth_cm,drainage,format}`,
  `route`(enum), `reason`(non-empty), `confidence`(=overall_conf),
  `field_confidence{}` (per-field, drives gauge + highlight intensity),
  `note_text`(raw string the UI renders),
  `highlights[]{field,start,end,value}` (char offsets into note_text — Delta B),
  `eligibility_checks[]{label,ok,detail?}` (Active wound / MCB active / Measurements L×W×D),
  `evidence_graph{nodes[],edges[],agreeing_sources}` (§4b).
Contract rules: route always ∈ enum; reason always non-empty; highlights index into the SAME note_text; absent fields = null (never omitted); evidence_graph always has wound node + ≥1 source.

## H. Error taxonomy (errors.py)
`WoundpipeError` root → TransientError{RateLimited(429,retry_after), TransientHTTP(500/timeout)} (retryable) · PermanentError{PermanentHTTP(422 fail-fast), NormalizationError, ExtractionError→degrade}. `StageError{stage,key,kind,message}` collected non-fatally.
Per-stage: ingest→tenacity retry then mark fetch_log failed+continue; 422→PermanentHTTP log+continue run; normalize→skip record; extract→LLM fail falls back regex-only / un-parseable→flag_for_review; route→pure; publish→export schema-validation failure is the ONE fatal. **Rule: transient⇒retry then degrade; permanent⇒fail-fast per-record never per-run; only corrupt export aborts.**

## I. Non-functional requirements & acceptance criteria (testable)
1. Cold run fetches 300 patients + ~1,200 calls despite ~30% 429s honoring Retry-After, concurrency 8, <8 min.
2. Kill at ~call 700 + re-run completes only remaining tasks (resumed>0, totals correct).
3. Idempotency: run twice → identical row counts.
4. Identity gate: no per-patient fetch before map total; correct key per endpoint; zero wrong-key 422s.
5. Format from text: detect_format correct on fixture incl. ≥1 case where note_type disagrees and detected wins.
6. No fabricated measurements: every numeric field is a literal substring of source (each evidence_span slice == stored value).
7. Every routed patient has non-empty reason (`count WHERE reason IS NULL OR ''`==0).
8. Route correctness vs policy on golden-route fixture.
9. auto_accept only if active_mcb AND active_wound AND completeness==1 AND agreement=='agree' AND no ambiguity AND overall_conf>=threshold.
10. Manifest truthfulness: calls_total==sum(by_endpoint); route totals==patients_resolved.
11. export.json validates against §G schema; highlights in-range; routes ∈ enum.
12. No secrets in logs (grep key value → empty).
13. Demo independence: with base_url unreachable, publish still regenerates export.json from snapshot.
14. LLM degradation: use_llm=false completes + routes everything (regex-only), no crash.

## K. Data-flow (7 seams)
`PCC API ─fetch─▶[S0 INGEST]─▶[S1 RESOLVE id↔patient_id GATE]─▶[S2 NORMALIZE active_mcb/dx, unwrap raw_json]─▶[S3 SNIFF format from TEXT]─▶[S4 EXTRACT regex+LLM+reconcile+span-gate]─▶[S5 ROUTE selective+reason, Δthreshold]─▶[S6 PUBLISH v_* views → export.json + runs/<id>.json]` ; RunManifest threads through all; pre-demo snapshot so demo never needs live fetch; React SPA reads export.json (CommandCenter·Triage·PatientDetail·Flow). Cross-cutting: config.py · logging.py(redaction) · db/engine.py(WAL,FK).
