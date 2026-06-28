# API GROUNDING — Reality vs. Documented Spec (probed live, 2026-06-28)

> Source of truth for all agents. Probed the live API at `https://hackathon.prod.pulsefoundry.ai`.
> Raw samples saved at `scratchpad/api_samples.json` and `scratchpad/patients_101.json`.
> **Where the docs (README.md / API.md) and reality disagree, REALITY WINS. Build for reality.**

## Confirmed working
- `GET /health` → HTTP 307 redirect (service is up).
- `GET /pcc/patients?facility_id=101` → **120 patients** (matches README). Payer codes present: `HMO, MCA, MCB, MCD`.
- Retry-aware fetching confirmed: 429s occur frequently; honoring a short backoff (~2s) and retrying succeeds. A pure-Python `urllib` retry loop works; **a naive bash `export -f` function across subprocess does NOT** (macOS bash quirk — note for the build phase).

## ⚠️ Delta 1 — `note_type` does NOT determine note format
Docs imply format follows `note_type`. **False.** Observed `note_type` values in Facility A (first 25 patients):
`Wound (SPN)`(8), `Wound Care Progress Note`(11), `HP Skin & Wound Note`(8), `Wound (IDT)`(10).
But the *content format* is independent of the label. Example: a `Wound (SPN)` note (FA-001) actually contains an **Envive Care Conference Review** narrative.
**Implication:** the pipeline must **detect format from the note TEXT** (e.g. sniff for `*Envive`, SOAP `Subjective:/Objective:`, slash-delimited `Measures … / Stage: …`, or shorthand `Meas`), not trust `note_type`.

### Real format archetypes observed (verbatim)
**A) Envive narrative** (slash-delimited, often 2D only, no depth):
```
*Envive Care Conference Review - V 4.0
Wound Status: Pressure Ulcer to Right hip / Measures 2.9 cm x 2.8 cm / Stage: Stage 3
Drainage present - serosanguineous, heavy. Odor present. Treatment: Foam dressing change daily.
```
Note `Stage: N/A` also occurs (unstageable / missing stage).

**B) Prose / shorthand + MULTI-WOUND** (must pick primary; abbreviations `aprx`):
```
Pt seen for wound eval. Pressure Ulcer Left buttock measures aprx 5.9 x 4.5cm, depth 1.8cm.
Min drainage serosanguineous. Heel wound also eval - L heel 3.5x2.7, 0.9cm deep, slight serous.
Both wounds cleaned w/ NS, covered. Will follow up Mon.
```

**C) SOAP / IDT** (most structured; full L×W×D, wound-bed %, has a data-quality typo `Diabetic diabetic`):
```
Subjective: Patient reports pain at Right plantar wound site, rates 9/10.
Objective: Wound assessment performed. Diabetic diabetic Right plantar measures 4.3 cm x 1.8 cm x 0.3 cm.
  Wound bed: 28% slough, 72% granulation tissue. Periwound: intact.
  Drainage: moderate. Odor: present, foul.
Assessment: Diabetic diabetic Right plantar — improving.
Plan: Debridement consult ordered. Alginate dressing applied.
```

## ⚠️ Delta 2 — Assessments embed free text, not clean fields
Docs showed a flat `raw_json` (`{"wound_type":"pressure_ulcer","length_cm":3.2,...}`). **Reality** (assessment_type `HP Skin & Wound`) nests a **narrative answer**:
```json
{"assessmentId":55001,"assessmentDate":"2026-05-15","status":"Complete",
 "sections":[{"sectionName":"WOUND_INFO","questions":[
   {"question":"Wound narrative","answer":"Pressure Ulcer to Right hip / Measures 2.9 cm x 2.8 cm / Stage: Stage 3 / Drainage: serosanguineous, heavy"}]}]}
```
**Implication:** assessment `raw_json` shape **varies by assessment_type**. Some types may be flat (per docs `Weekly Wound Information Sheet`), others wrap narrative text. The parser must handle both, and the "structured" path is not always structured.

## ⚠️ Delta 3 — `payer_type` value differs from docs
Docs said `payer_type: "Medicare B"`. Reality: `payer_type: "Medicare"` with `payer_code: "MCB"`.
**Implication:** key eligibility off **`payer_code == "MCB"` + `effective_to == null` (active)**, NOT off `payer_type` string.

## ✅ Opportunity — cross-source corroboration as a confidence signal
For FA-001: diagnosis `L89.143 "Stage 3 Pressure Ulcer – Right hip"` (`clinical_status: active`) **agrees** with the note-extracted wound (Right hip, Stage 3, pressure ulcer). When the ICD-10 active wound dx, the note, and the assessment **agree**, confidence is high → `auto_accept`. When they conflict or a source is missing/ambiguous → `flag_for_review`. This is the calibrated-routing backbone.

## Eligibility primitives (from README + reality)
A patient routes toward billing only with: (1) an **active wound** (active ICD-10 wound dx and/or extracted wound), (2) **active Medicare Part B** (`MCB`, `effective_to == null`), (3) documented **measurements (L×W±D)** and **drainage**.
- `auto_accept` — all required fields clearly documented AND sources agree.
- `flag_for_review` — ambiguous/incomplete (Envive prose, missing depth, `Stage: N/A`, multi-wound ambiguity, source conflict).
- `reject` — reliable extraction impossible OR not MCB OR no active wound.

## Two-identity join trap (confirmed)
- `patient_id` (string, `FA-001`) → `/diagnoses`, `/coverage`.
- `id` (integer, `1`) → `/notes`, `/assessments`.
- `/patients` returns both — resolve once, store the mapping. The schema must make this join first-class.

## Scale / cost envelope
300 patients × {diagnoses, coverage, notes, assessments} + 3 patient lists ≈ **~1,203 calls**. At 30% 429, expect ~360+ retries. Concurrency + backoff + incremental `since` sync materially affect demo load time.
