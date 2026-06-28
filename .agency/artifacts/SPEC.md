# SPEC — ABI Frameworks Wound-Care Billing-Triage (MVP)
### Engineering Specification · v1.0 · 2026-06-28
_Synthesized by CEO from 5 parallel spec sections (architecture · ingestion · extraction · routing · data). Authoritative parent: `MASTER-BLUEPRINT.md`. This document RESOLVES all cross-section deltas (§B) and is the build's source of truth; the 5 section files hold the full detail._

---

## A. How to read this spec
- **§B Reconciliation ledger** — the 9 cross-section deltas, each with a CEO DECISION. **Read this first; it overrides any section that disagrees.**
- **§C Canonical contracts** — the reconciled artifacts that span sections (final DDL additions, shared constants, frontend JSON contract, the routing-ownership rule).
- **§D Section index** — pointers to the 5 detailed section files.
- **§E Build plan · §F Acceptance criteria · §G Open risks.**

The product (one line): pull 300 patients from a rate-limited PCC EHR → extract wound fields from 4 messy note formats → SQLite (schema-managed, queryable) → route each patient `auto_accept`/`flag_for_review`/`reject` with a plain-English reason → React command-center dashboard with data-flow + evidence-graph visuals. Locked: **hybrid extraction**, **React command-center**, **confidence = cross-source corroboration (not LLM self-report)**.

---

## B. Reconciliation ledger (CEO decisions — authoritative)

| # | Delta (who raised) | Tension | **DECISION** |
|---|---|---|---|
| **R1** | Per-field evidence + confidence (architect Delta B + extraction D1 — raised twice) | DB stored ONE span per `wound_extraction` row; frontend `highlights[]` + per-field gauges need per-FIELD spans | **Adopt a child table `wound_field_evidence(extraction_id FK, field, char_start, char_end, quote, method, confidence)`** as the canonical home for per-field {value, span, method, confidence}. The scalar `evidence_span_*`/`evidence_quote` on `wound_extraction` stay as the *primary-wound summary* span (cheap path); the child table powers per-field highlights. **MVP cut-line:** if time-pressed, ship summary-span-only highlighting; per-field is the stretch. Migration `002_wound_field_evidence`. |
| **R2** | Runtime tables (ingestion) vs DB's shapes | ingestion specced `fetch_log(endpoint,key)`+`content_hash`+`sync_state`; DB specced `fetch_log(task_id PK)`+`run_manifest`, no `sync_state` | **Use DB's richer `fetch_log` (deterministic `task_id` PK, status/retry/n_records) + ADD ingestion's `content_hash` column. Use DB's `run_manifest`. ADD ingestion's `sync_state(scope PK, watermark, last_run_id, updated_at)`.** All in migration `001` (greenfield). `task_id` = `'<endpoint>:<identity_value>'`. |
| **R3** | `WOUND_FAMILIES` (routing) vs DB | DB's `active_wound_dx` matches `L89%` only; routing needs DFU/venous/arterial/non-pressure | **Adopt routing's allowlist via a small reference table `wound_icd_family(prefix, wound_class)` joined into `active_wound_dx`; widen `ix_dx_active_wound` to `clinical_status='active'` (drop the L89-only WHERE, or add a second partial index for the GLOB set).** Families: L89, L97, L98.41-49, E1x.621/622, I83.0/.2, I70.23x-25x. Out-of-scope (S-codes, T81.3x) → reject naming the code. |
| **R4** | `AUTO_ACCEPT_TAU` parameterization (routing + architect Delta E) | DB hardcodes `0.80` inline in the VIEW; routing wants a named, calibratable constant | **Single source of truth = a 1-row `config(key,value)` table; the VIEW reads `(SELECT value FROM config WHERE key='auto_accept_tau')`; `settings.auto_accept_threshold` mirrors it for app-side use and docs.** Default 0.80, R-flagged placeholder. Calibration (§gold-set) = one UPDATE, zero code edits. |
| **R5** | **Routing ownership** — Python `route()` (routing) vs SQL `v_patient_eligibility` (DB) — TWO implementations | Drift risk: two places decide the route | **The SQL `v_patient_eligibility` VIEW is the single EXECUTION path** (deterministic, sub-ms, what `publish` reads). The routing spec's Python `route()` is the **reference specification + unit-test oracle** (asserted equal to the VIEW on the fixture), NOT a second runtime path. **Confidence MATH** (`overall_conf`, the per-field formula) IS computed in Python by the reconciler and *stored* in `wound_extraction` (too complex for SQL); the VIEW only *thresholds + applies categorical gates*. Clean split: Python computes confidence → SQL decides route. |
| **R6** | `span_verified` weight (routing) | research left it unweighted (sum=0.80); routing assigned 0.20 | **Accept:** `field_confidence = clamp(0.40·agreement + 0.20·method + 0.20·span_verified + 0.20·completeness − min(0.15, penalty), 0, 1)`, AND keep the §2.3 hard cap (unverified measurement → ≤0.30). Weights close to 1.00. |
| **R7** | `corrob_mult` (routing) | blueprint §4b said "agree_sources is one input to overall_conf" w/o formula | **Accept:** `overall_conf = field_mean × corrob_mult`, `corrob_mult = {agree:1.00, single_source:0.90, conflict:0.75}`. Graph feeds routing twice (categorical gate + continuous multiplier). |
| **R8** | Stage count (architect Delta A) | blueprint "7-stage" vs 6 named | **Accept 7 seams:** S0 ingest · S1 resolve · S2 normalize · **S3 sniff** · S4 extract · S5 route · S6 publish (sniff is its own seam). |
| **R9** | LLM client timeout (ingestion cross-flag) | extraction's anthropic client must also carry an explicit timeout | **Accept as a global rule:** NO outbound call (PCC or Anthropic) without an explicit timeout — a call without one is a failed build (NFR). `llm_timeout_s=20` in settings. |

**All 9 resolved. No open conflicts.** The DB engineer independently anticipated R1 (span cols), R2 (fetch_log/run_manifest), and the agreement-tightening behind R5 — so the deltas are small.

---

## C. Canonical cross-cutting contracts

### C.1 Final schema additions (beyond research-schema, as reconciled)
Migration `001` ships: all raw tables + FTS5 + `wound_extraction` (with summary `evidence_span_*`) + `fetch_log`(+`content_hash`) + `run_manifest` + `sync_state` + `config`(1 row: auto_accept_tau=0.80) + `wound_icd_family` + the two corroboration views + `v_patient_eligibility` (threshold read from `config`, agreement = `all_agree=1 AND n_sources>=2`, dx-family via `wound_icd_family`). Migration `002` ships `wound_field_evidence` (R1). All STRICT; all idempotent-UPSERT-able; tested up→down→up.

### C.2 Shared constants (one home each)
`auto_accept_tau=0.80` (config table; mirror settings.auto_accept_threshold) · `FORMAT_CONF_MIN=0.70` · `MEASURE_TOL_CM=0.20` · field weights {agreement .40, method .20, span .20, completeness .20}, penalty_cap .15 · `corrob_mult {1.00,0.90,0.75}` · `max_concurrency=8` · `max_attempts=6`, per-call deadline 45s · models `claude-haiku-4-5-20251001` (bulk) / `claude-sonnet-4-6` (escalate), temp 0 · `llm_timeout_s=20`.

### C.3 Frontend JSON contract (the backend↔frontend seam — architecture §G ≡ DB export_json §7)
`export.json` = `{generated_at, run_id, manifest(RunManifest), funnel{total,mcb_active,active_wound,has_measurements,auto_accept,flag_for_review,reject,sankey[]}, patients[]}`. Each patient: identity + `wound{type,stage,location,L,W,D,drainage,format}` + `route`(enum) + `reason`(non-empty) + `confidence` + `field_confidence{}` + `note_text` + `highlights[]{field,start,end,value}` (R1) + `eligibility_checks[]` + `evidence_graph{nodes[],edges[],agreeing_sources}`. **Rules:** route ∈ enum; reason non-empty; highlights index into the same note_text; absent fields = null (never omitted); evidence_graph always has the wound node + ≥1 source. **The DB `export_json()` keys are authoritative; architecture's contract maps to them verbatim (REQ-D3 resolved → adopt).**

### C.4 The 7 stages (S0–S6)
S0 ingest (httpx+tenacity, Semaphore8, Retry-After, 422 fail-fast, fetch_log) → S1 resolve (patient_id↔id HARD GATE + fan-out) → S2 normalize (active_mcb, active_wound_dx via families, unwrap raw_json) → S3 sniff (format from TEXT) → S4 extract (regex L1 + Claude L2 + span-gate + reconciler L3 → overall_conf) → S5 route (SQL VIEW decides; Python reference) → S6 publish (views → export.json + run_manifest). RunManifest threads through; pre-demo snapshot via `VACUUM INTO` so the demo never needs a live fetch.

---

## D. Section index (full detail)
| § | File | Owns |
|---|---|---|
| Architecture & interfaces | `artifacts/spec-architecture/report.md` | repo layout, 7 stage signatures, DTOs, RunManifest, frontend contract, error taxonomy, NFRs |
| Ingestion & runtime | `artifacts/spec-ingestion/report.md` | httpx/tenacity policy, fetch_log resume, identity gate, Typer CLI, observability, since-sync, snapshot |
| Extraction algorithm | `artifacts/spec-extraction/report.md` | format sniffer, regex grammar (validated), Claude schema, span-gate, primary selection, normalization |
| Routing/confidence | `artifacts/spec-routing/report.md` | eligibility gate, confidence formula, corroboration scoring, decision tree, reason grammar, calibration |
| Data layer | `artifacts/spec-data/report.md` | full DDL, 2 views, migrations+runner, repo interface, export_json, indexes, UPSERTs, durability |
| Grounding (reality) | `artifacts/grounding/api-reality.md` | the live-API deltas all of the above build against |

---

## E. Build plan (~8.5h core; cut-lines)
0. Scaffold + migration runner (001+002) — 0.5h ✅
1. **Ingest + identity resolve (CRITICAL PATH)** — 1.5h ✅
2. Normalize + S3 sniff — 1h ✅
3. Extract: regex L1 (✅ must) → Claude L2 + reconciler — 2h ✅
4. Route: SQL VIEW + reason templates (Python oracle test) — 1h ✅
5. Publish: views → export.json — 0.5h ✅
6. Frontend: command center + triage table + patient detail (evidence graph) — 2.5h ✅ (animated flow = ⭐)
7. Polish: animated pipeline view, Sankey, snapshot, gold-set spot-check — 1.5h ⭐
**Cut-first:** animated React Flow physics · per-field highlights (R1 stretch) · since-sync · live FastAPI · LLM lane (regex floor stands). **Build the demo-safe path first, layer the beast on top.**

## F. Acceptance criteria (testable — from architecture §I, binding)
Resilient ingest (<8min despite 30% 429) · resumability (kill@700 → only remainder) · idempotency (run twice = identical counts) · identity gate (zero wrong-key 422) · format-from-text (≥1 case note_type disagrees, detected wins) · **no fabricated measurements (every numeric is a literal substring)** · every patient has non-empty reason · route matches policy on golden fixture · auto_accept only if mcb∧wound∧completeness==1∧agree∧conf≥τ · manifest truthful · export.json schema-valid · no secrets in logs · demo independence (offline publish from snapshot) · LLM degradation (use_llm=false still routes all).

## G. Open risks (owned)
- **R-risk-1** no gold labels ⇒ no certified accuracy → build 60–100 stratified gold set + κ (build/eval).
- **R-risk-2** `auto_accept_tau=0.80` placeholder → calibrate (now a `config` UPDATE, R4).
- **R-risk-3** restore drill unrun on full DB → `make verify-restore` before demo (build/eval).
- **R-risk-4** demo reliability → precomputed snapshot + static JSON (mitigated).
- **R-risk-5** SQL VIEW ↔ Python `route()` oracle must agree → CI test asserts equality on the fixture (R5).

---
_Spec complete. Build is mechanical execution of this document; every load-bearing claim is grounded in the live API or an execution-verified artifact._
