# MASTER BLUEPRINT — ABI Frameworks Wound-Care Billing-Triage (MVP)
_Synthesized by CEO from 6 research reports, 2026-06-28. Grounded in the LIVE API. Locked decisions: Hybrid extraction · React command-center._

> **One-line product:** Pull 300 patients from a rate-limited PCC EHR, extract wound clinical fields from four messy note formats, and tell a non-technical biller — at a glance, with the source quote — which patients are safe to bill, which to review, and which to skip, and *why*.

---

## 0. The thesis (what wins this)
Three independent researchers converged on the same spine: **trust comes from cross-source agreement, not from a model saying "95%."** The product decides when to trust an extraction the same way it asks the *judges* to trust it — by corroboration. That self-similarity is the story. The README rewards **reasoning over accuracy**, so our headline is a tradeoff: *"We flag rather than hallucinate a missing depth into a claim that will deny."*

---

## 1. Architecture — 7-stage linear, idempotent, resumable pipeline
Plain Python modules behind a **Typer CLI** (one subcommand per stage + `run-all`), every stage reading/writing SQLite. **No Prefect/Dagster** — 6 single-machine stages don't justify a workflow engine. Resume = "run tasks not yet `done`".

```
                         ┌─────────────────────── RunManifest (counts feed the dashboard) ──────────────────────┐
                         │                                                                                      │
  PCC API ──fetch──▶ [0 INGEST] ──▶ [1 RESOLVE id↔patient_id] ──▶ [2 NORMALIZE] ──▶ [3 EXTRACT] ──▶ [4 ROUTE] ──▶ [5 PUBLISH]
   (429 30%)    httpx+tenacity      two-identity map table       format-sniff       regex→LLM       selective    v_patient_
   retry/backoff  Semaphore(8)      (string→dx,cov; int→note,as) (from TEXT)        reconciler      classifier   eligibility
   honor Retry-After  fetch_log                                                     +confidence     +reason      VIEW → JSON
        │ checkpoint/resume                                                                                         │
        └──────────────────── pre-demo SQLite snapshot (demo NEVER depends on a live cold fetch) ──────────────────┘
```

**Resilience (the "pipeline design" axis):** `httpx 0.27.2` sync client in a `ThreadPoolExecutor(8)`, wrapped by `tenacity 8.5.0` — custom wait **honors `Retry-After`** on 429, exponential+jitter on 500/timeout, **422 fails fast** (our bug, never retried). API has no RPS ceiling (429 is random per-request) → the safe lever is **bounded politeness (Semaphore=8)**, not a token bucket. Every fetch idempotent + checkpointed in a `fetch_log` table → a crash at call 700/1,200 costs only the remaining 500.

**Two-identity resolution = an explicit gate (Stage 1):** fetch 3 facility lists, persist `patient_id↔id` map, then fan out — `patient_id`→diagnoses/coverage, `id`→notes/assessments. Nothing downstream runs until it's set.

**Observability is a deliverable, not a nicety:** `structlog` + a persisted **RunManifest** (calls / 429s / retries / counts by-format / routing distribution) — the real numbers that make the dashboard's data-flow visuals truthful. This turns the rate-limit *risk* into a visible *story*.

**Stack:** Python 3.11+, stdlib `sqlite3`, `pydantic-settings` for `.env`/`ANTHROPIC_API_KEY`, `structlog`.

---

## 2. Extraction — three-lane hybrid (LOCKED: hybrid)
**Build order is regex-first, LLM-layered — both ship.** (Reconciles the architect's "regex is the must-have baseline" with the locked hybrid decision: regex is the reliable floor; the LLM lane is built on top so a time-crunch still leaves a working demo.)

- **Lane 1 — deterministic regex/grammar OWNS measurements.** Runs on every note + assessment. Numbers are where LLMs hallucinate, so regex owns L×W×D, stage, drainage, location — returns a literal substring or null, never invention. One tolerant grammar covers `4.3 cm x 1.8 cm x 0.3 cm`, glued `4.5cm`, split-clause `0.9cm deep`, 2D `Measures 2.9 cm x 2.8 cm`.
- **Lane 2 — Claude structured extraction OWNS prose/ambiguity.** `claude-haiku-4-5-20251001` for bulk, escalate to `claude-sonnet-4-6` on disagreement. **Structured Outputs (GA)** via `output_config.format` json_schema / strict tool use (constrained decoding, grammar cached 24h). LLM job = Envive comprehension, type normalization (`Diabetic diabetic`→DFU), **primary-wound selection** — NOT numbers.
- **Lane 3 — reconciler + confidence (the brain).** Per-field confidence from **source agreement** (regex ↔ LLM ↔ assessment ↔ active ICD-10 dx), NOT LLM self-confidence.

**Two guardrails the Claude docs force:**
1. JSON-schema numeric `minimum`/`maximum` are NOT enforced → a `depth_cm` field can still hallucinate a number. **Verbatim-span gate:** any LLM measurement not found as a literal substring of the note is dropped. Nullable everything; enums for categoricals (unbreakable under constrained decoding).
2. Constrained decoding imposes a 10–30% "format tax" → order schema **`evidence_span` BEFORE `value`** per field.

**Format detection from TEXT, not `note_type`** (Delta 1). Sniff: `*Envive` · SOAP `Subjective:/Objective:` · slash-delimited `Measures … / Stage:` · shorthand `Meas`. Assessment `raw_json` flat-shape → generated columns; nested-narrative shape → text extractor (Delta 2).

**Libraries:** plain `re` + gazetteers is the primary tool (7-type closed vocabulary). Optional `medspacy==1.3.1` for ConText negation only ("no odor"/"healed"). **Skip scispaCy/QuickUMLS** — install weight ≫ payoff.

---

## 3. Routing — transparent selective classifier (glass-box)
Deterministic policy; "confidence" = interpretable structural evidence, mapped to routes with **Chow cost-asymmetric thresholds** (false-accept ≫ over-flag → the `flag` abstain region is WIDE).

```
mcb_active   = payer_code=="MCB" AND effective_to is null
active_wound = active wound ICD-10 dx OR extracted wound
completeness = |confident ∩ {type,location,length,width,drainage(+depth,+stage if PU)}| / |required|
agreement    = corroboration(dx, note, assessment)   # agree / single-source / conflict
ambiguity    = multi_wound_unclear OR stage_NA OR depth_missing OR conflict OR low_format_conf OR hedge

if NOT mcb_active:    REJECT  "No active Medicare Part B coverage"
if NOT active_wound:  REJECT  "No active wound"
if completeness==0:   REJECT  "Extraction impossible"
if completeness==1 AND agreement=="agree" AND NOT ambiguity:  AUTO_ACCEPT
else:                 FLAG_FOR_REVIEW   # default-safe abstain
```
**Why glass-box (Rudin 2019):** a biller defending a Medicare claim must audit each decision → interpretable model yields route + exact reason by construction. Don't route on verbalized LLM confidence (Xiong ICLR'24: ECE>0.37). Eligibility grounded in CMS LCD L33831 (qualifying wound + L×W×D + drainage + re-eval cadence); MVP routes on the documentation-completeness proxy (stated scope boundary).

---

## 4. Data layer — SQLite, EXECUTION-VERIFIED against 3.51
Full DDL in `artifacts/research-schema/report.md` (already run & verified). Highlights:
- **Two-identity first-class:** `pcc_patient` carries BOTH `patient_id TEXT PRIMARY KEY` and `id INTEGER UNIQUE`; child FKs point at the column matching each endpoint.
- **STRICT tables + CHECK enums** (drainage, stage, clinical_status) + full provenance (`fetched_at, source_endpoint, raw_payload, sync_version, is_current`).
- **Eligibility output = a live VIEW** `v_patient_eligibility` (one row/patient: wound fields, has_active_mcb, route, reason, confidence) — not a dump. Sub-ms at 300 patients.
- **SOTA techniques (all verified):** FTS5 external-content over `note_text` (zero duplication, full-text note search); VIRTUAL generated columns parse flat `raw_json`; **partial indexes** on the hot predicates (`ix_cov_active_mcb WHERE payer_code='MCB' AND effective_to IS NULL` — EXPLAIN-proven), WAL mode.
- **Idempotent UPSERT** (`ON CONFLICT … DO UPDATE … WHERE excluded.last_modified_at >= …`) → re-run/`since`-sync safe (verified: ran twice, count stayed 1).
- **Schema management (the hard requirement):** versioned `migrations/NNN_name.{up,down}.sql` + `PRAGMA user_version` runner; expand/contract discipline; **rollback tested** (up→down→up clean).

---

## 5. Frontend — React command-center (LOCKED: React)
Static SPA (`vite build`) reading an **exported JSON** snapshot from SQLite → zero backend to crash live. Optional thin FastAPI read endpoint as a *bonus*, never a dependency.

**Stack:** React 19 + Vite + Tailwind v4 + shadcn/ui · **TanStack Table v8** (triage grid, ~15KB, full design control — not AG Grid) · **Recharts v3** + Tremor (KPI/funnel/Sankey) · **@xyflow/react 12.10.2** (animated pipeline graph) · **Framer Motion** (count-ups, stagger, slide-overs) · Aceternity UI (2–3 flourishes). Dark "command-center" aesthetic, monospace numerics.

**Four screens:**
1. **Command Center** — count-up KPIs (`300 patients · 287 extracted · 62% MCB · N auto / N flag / N reject`) + live React Flow pipeline graph + payer-mix→routing **Sankey**.
2. **Triage Table** — color+icon routing (never color alone), confidence gauge, plain-English reason, instant search/filter/sort, skeleton loaders.
3. **Patient Detail (explainability theater)** — slide-over: **original note text with extracted fields highlighted in place** (char-offset spans) + 3 eligibility checks (active wound ✓ · MCB active ✓ · measurements ✓) + cross-source agreement. The single most persuasive thing a biller sees.
4. **Pipeline Flow (full)** — every stage with fetched/retried/extracted/routed counts, **429 retry flashing amber→green**, 300→eligible→auto_accept funnel.

**The differentiator:** the animated data-flow view that physically shows 300 patients moving API→extract→DB→routing with the 429 drama visible. That's the "data flow visual" the user demanded, and judges rarely *see* rate-limiting rendered.

---

## 6. Evaluation — honest by construction
- **Consistency over all 300** (labeled as consistency, NOT accuracy): cross-source agreement rate, completeness distribution, route mix.
- **Small gold set (60–100 patients)** stratified across 3 facilities × 4 formats × 3 routes + hard cases; 2 annotators + Cohen's κ. Report **selective precision @ coverage** on auto_accept (target ≥95%) with n + CIs + a risk–coverage curve. This is the only true accuracy — and resolves the schema's R3 (the 0.80 threshold is a placeholder to **calibrate** against this set).
- **LLM-as-judge** optional, different model family, reason-faithfulness only, never as accuracy.
- **Honesty slide** = the methodology win: separate consistency vs accuracy, state the no-label limit, name conformal prediction as the scale-up path.

---

## 7. Recommended tech stack (one view)
| Layer | Choice |
|---|---|
| Language / runtime | Python 3.11+ |
| HTTP / resilience | httpx 0.27.2 + tenacity 8.5.0, ThreadPoolExecutor(8) |
| DB | SQLite 3.51 (STRICT, FTS5, JSON1, WAL); migrations via user_version + up/down SQL (yoyo 9.x optional) |
| Extraction | regex (`re`) + Claude (haiku-4-5 bulk / sonnet-4-6 escalate), Structured Outputs |
| Config / logging | pydantic-settings, structlog |
| Frontend | React 19 + Vite + Tailwind v4 + shadcn/ui + TanStack Table v8 + Recharts v3 + React Flow 12 + Framer Motion |
| Data bridge | SQLite → static JSON export (FastAPI read endpoint = optional bonus) |

---

## 8. Phased build plan (~8.5h core) with cut-lines
| # | Phase | Est | Must-have? |
|---|---|---|---|
| 0 | Scaffold (repo, .env, SQLite init, migration runner) | 0.5h | ✅ |
| 1 | **Ingest + identity resolve (CRITICAL PATH)** — resilient 300-patient fetch, fetch_log, snapshot | 1.5h | ✅ |
| 2 | Normalize + format-sniff | 1h | ✅ |
| 3 | Extract — regex baseline (✅) then LLM lane (locked-in) + reconciler | 2h | ✅ regex / LLM layered |
| 4 | Route — selective classifier + reason templates | 1h | ✅ |
| 5 | Publish — VIEW → JSON export | 0.5h | ✅ |
| 6 | Frontend — command center + triage table + patient detail | 2.5h | ✅ (table+detail must; animated flow = stretch) |
| 7 | Polish — animated pipeline view, Sankey, snapshot, gold-set spot-check | 1.5h | ⭐ stretch |

**Cut-line (if time runs short):** keep = resilient ingest · identity resolve · regex extraction · MCB routing+reason · output VIEW · RunManifest real numbers · triage table + patient-detail highlight. Drop-first = animated React Flow physics · `since` incremental · live FastAPI · LLM lane (regex still works). **Build the demo-safe path first, layer the beast on top.**

---

## 9. Open risks (owned)
- **R1** No gold labels ⇒ no *certified* risk; the gold set buys an honest estimate. → build/eval owner constructs the 60–100 stratified set.
- **R2** `auto_accept` threshold 0.80 is a placeholder → calibrate against gold set before trusting auto-routing.
- **R3** Restore drill scripted but not run on a full 300-patient DB.
- **R4** Demo reliability: mitigated by pre-computed SQLite snapshot + static JSON (no live API/server at demo time).

## 10. The presentation (10 min)
Problem (manual chart review, 25–35% wound-care denials, $25/denial rework, 65% never reworked) → architecture data-flow visual (the beast) → triage table glance → 2-3 example patients incl. the **Envive flag** money slide ("flag, don't hallucinate") → honest accuracy slide → hackathon→MVP roadmap (audit trail, human-in-loop, incremental sync, real PCC under BAA).
