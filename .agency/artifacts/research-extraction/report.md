# T1 — Extraction Engine Research (technical-researcher)
_Persisted by CEO; subagent's own write was harness-blocked. Confidence: HIGH._

## Recommendation: three-lane hybrid with a cross-source reconciler as the brain

**Lane 1 — deterministic regex/grammar (owns measurements).** Runs on *every* note + assessment. Numbers are exactly where LLMs hallucinate, so regex owns L×W×D, stage, drainage, location — returns a literal substring or null, never invention. One tolerant grammar covers all observed forms (`4.3 cm x 1.8 cm x 0.3 cm`, glued `4.5cm`, split-clause `0.9cm deep`, 2D `Measures 2.9 cm x 2.8 cm`).

**Lane 2 — Claude structured extraction (owns prose/ambiguity).** Haiku 4.5 for bulk, escalate to Sonnet 4.6 on disagreement (Opus 4.8 overkill). Structured Outputs GA via `output_config.format` / strict tool use w/ constrained decoding. LLM job = Envive comprehension, type normalization (`Diabetic diabetic`→DFU), **primary-wound selection** — NOT numbers.

**Two guardrails the docs force:** (1) JSON-schema subset does NOT enforce numeric `minimum`/`maximum` — a `depth_cm` field is type-guaranteed but value-unguaranteed; constrained decoding can still emit a hallucinated number → **verbatim-span gate**: any LLM measurement not found as a literal substring of the note is dropped. (2) Constrained decoding imposes a "format tax" degrading reasoning 10–30% → order schema **evidence_span BEFORE value** per field.

**Lane 3 — reconciler + confidence.** Do NOT use LLM self-reported confidence (systematically overconfident, unreliable in medicine). Build per-field confidence from **source agreement** (regex ↔ LLM ↔ assessment ↔ active ICD-10 dx), hard-gated by the span check. `L89.xxx` codes encode site+stage for free — structured ground-truth anchor + multi-wound tiebreaker.

## The four archetypes (observed live)
| Archetype | Signature | Hard parts | Best lane |
|---|---|---|---|
| A. Envive narrative | `*Envive Care Conference Review` … `Measures 2.9 cm x 2.8 cm / Stage: Stage 3` | 2D only, `Stage: N/A` | Regex gets measure+stage; LLM confirms type/location |
| B. Prose multi-wound | `measures aprx 5.9 x 4.5cm, depth 1.8cm … Heel wound also eval - L heel 3.5x2.7, 0.9cm deep` | `aprx`, two wounds, glued units | LLM picks primary; regex per triple |
| C. SOAP/IDT | `Diabetic diabetic Right plantar measures 4.3 cm x 1.8 cm x 0.3 cm … Drainage: moderate` | dup-typo | Regex wins (labeled); LLM checks |
| D. Assessment-embedded | `raw_json … "answer":"Pressure Ulcer to Right hip / Measures 2.9 cm x 2.8 cm / Stage: Stage 3 / Drainage: …"` | raw_json shape varies | Flat-JSON path else text extractors |

**Critical:** `note_type` does NOT predict format — sniff from text.

## Pipeline
```
Stage 0  Ingest + identity join (patient_id ↔ id) + gather {active ICD-10 wound dx, notes, assessments}
Stage 1  Format sniff (regex): Envive | SOAP | prose | labeled-SPN | assessment-flat | assessment-narrative
Stage 2  DETERMINISTIC layer → every note+assessment. {field, value, verbatim_span, method=regex}
Stage 3  LLM layer (Claude strict tool use) → per field {evidence_span (verbatim, FIRST), value, self_conf}
Stage 4  RECONCILER/VERIFIER → agreement(regex,LLM,assessment,dx) + span-verify + completeness
Stage 5  Composite confidence → routing
```

## LLM structured extraction done right (2026-06-28, HARD)
- Models: `claude-opus-4-8`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`. Haiku bulk, Sonnet on disagreement.
- Structured Outputs GA: `output_config={"format":{"type":"json_schema","schema":{…,"additionalProperties":false}}}` or `"strict":true` on tool `input_schema`. Grammar cached 24h.
- Trap: numeric constraints NOT schema-enforced → verbatim-span guardrail; nullable everything (`["number","null"]`+"use null if not stated"); enums for categoricals (drainage/stage/type) are unbreakable under constrained decoding.
- Determinism/cost: `temperature:0`, pinned model ID, cached grammar. Hundreds of Haiku calls = pennies/seconds. Claim "stable at temp 0", not bit-identical.
- Format tax: order `evidence_span` BEFORE `value`; allow short free-text rationale before constrained value fields for the multi-wound pick.

## Clinical NLP libraries
| Library | Latest | Buys | Verdict |
|---|---|---|---|
| medspaCy | 1.3.1 (2024-11-21) | ConText negation/uncertainty, Sectionizer | Use **ConText only** for "no odor"/"healed" |
| scispaCy | 0.6.2 | biomed NER, UMLS linker | **Skip** — 100s MB, overkill for 7 types |
| medspacy-quickumls | — | approx UMLS | **Skip** — needs UMLS license |
| plain `re` + gazetteers | stdlib | full control, deterministic | **Primary tool** |

Closed vocabulary (7 types, 4 stages, 4 drainage levels) → heavyweight NER is liability not asset for a 10-min demo.

## Hard cases
- **Multi-wound:** extract all; **primary = wound matching active ICD-10 dx site**; fallback dx-match → listed-first/most-detail → largest area. Never drop secondaries; ambiguous → flag.
- **Missing depth:** `depth_cm:null` valid; 2D → flag (billing wants L×W±D). Never fabricate.
- **`Stage: N/A`/unstageable:** `stage:"N/A"`, `stage_status:"not_stageable_or_missing"`; PU w/o usable stage → flag.
- **Typos:** collapse dup tokens `\b(\w+)\s+\1\b`; expand abbrevs; typos lower confidence.
- **Units:** normalize to cm float; mm→/10; reject implausible (>50cm, depth>length) → flag.

## Per-field confidence + routing (core)
LLM verbalized confidence is overconfident/unreliable in medicine — weak signal only.
```
field_confidence = 0.40·source_agreement (regex==LLM==assessment==dx)
                 + 0.20·extraction_method (labeled regex high; LLM-only lower)
                 + span_verified  (HARD GATE: unverified measurement → capped low)
                 + 0.20·completeness (depth present; stage present for PU)
                 − up to 0.15·data_quality_penalty (typos/aprx/ambiguity)
```
Eyeball-calibrate the auto-accept threshold against a handful of hand-labeled patients.
- `auto_accept`: all required present, every field ≥ threshold, ≥2 sources agree.
- `flag_for_review`: any field below threshold / 2D-only / Stage N/A / multi-wound ambiguity / conflict / unverified measurement.
- `reject`: no parseable measurement / not MCB (`payer_code=="MCB"` + `effective_to==null`) / no active wound.

## Cross-source corroboration (the backbone)
Three independent views — active ICD-10 dx, note, assessment. `L89.xxx` encodes site+stage → free ground-truth anchor + multi-wound tiebreaker. Reconciler scores agreement on {type, stage, location}; conflict → flag naming the disagreement. Three-way agreement IS the calibration mechanism — replaces untrustworthy model self-confidence with verifiable consensus.

## Sources
Structured outputs (platform.claude.com/docs/en/build-with-claude/structured-outputs) · Models overview · Release notes · medspacy 1.3.1 (PyPI) · scispacy 0.6.2 (PyPI) · "Let Me Speak Freely?" EMNLP 2024 · Format Tax arXiv 2604.03616 · Calibrating Verbalized Probabilities arXiv 2410.06707 · Confidence Estimation survey NAACL 2024.
