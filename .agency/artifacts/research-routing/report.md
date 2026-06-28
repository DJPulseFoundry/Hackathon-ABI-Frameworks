# T2 — Routing Logic & Evaluation Under Uncertainty (academic-researcher)
_Persisted by CEO; subagent write was harness-blocked._

## Recommendation
Build a **transparent, deterministic selective-classification policy**. Compute "confidence" from **interpretable structural evidence** — eligibility gate × required-field completeness × cross-source agreement — and map to three routes with **Chow-style cost-asymmetric thresholds**. Correct academic framing (selective prediction with a reject option) AND right MVP choice given no gold labels and no trained classifier to calibrate.

## Why not a black box or raw LLM confidence
- High-stakes auditable billing → inherently interpretable models beat post-hoc-explained black boxes (**Rudin, Nature Machine Intelligence 2019, HARD**).
- Verbalized LLM confidence is overconfident/miscalibrated (**Xiong/Tian et al., ICLR 2024, HARD** — ECE > 0.37, clusters 80–100%) → must NOT be load-bearing for an accept.

## The honesty crux
Every method that would *certify* a risk level — Platt, isotonic, conformal — needs a labeled calibration set we don't have. So calibration/conformal is the **named scale-up path, not the MVP**. MVP earns trust from explainable rules (no training data) + a **small stratified hand-labeled gold set (~60–100 patients)** for an honest, CI-bounded accuracy report. Treating ICD-10 dx, note, assessment as three noisy labeling functions routed on consensus is principled weak supervision (**Snorkel/Ratner, VLDB 2017, HARD**).

## Cost asymmetry sets thresholds (Chow 1970, HARD)
False-accept of an unbillable claim = expensive (clawback/audit; CMS: missing docs = 48.6% of surgical-dressing improper payments, 2024). Over-flagging = biller minutes. So `C_error ≫ C_review` → the abstain (`flag`) region is **wide**: anything short of complete-and-corroborated routes to `flag`, not `auto_accept`.

| Outcome | Cost | Relative |
|---|---|---|
| False-accept unbillable claim | denied claim, clawback, audit exposure | HIGH (C_e) |
| Over-flag a billable claim | wasted biller minutes; recoverable | LOW–MED (C_r) |
| False-reject a billable claim | lost revenue, caught at reject-review | MED |

## Three interpretable signals (no training data)
1. **Eligibility gate** — `payer_code=="MCB"` AND `effective_to==null` AND active wound (active ICD-10 wound dx and/or extractable wound). Key off payer_code, not payer_type.
2. **Completeness** — fraction of required fields confidently extracted for the PRIMARY wound: `wound_type, location, length, width, drainage` (+ depth, + stage where type requires).
3. **Cross-source agreement** — dx ⟷ note ⟷ assessment corroborate the same wound (Snorkel consensus of noisy sources as a label-free trust signal). FA-001 confirms: dx L89.143 ⟷ note ⟷ assessment agree → high confidence.
Plus **ambiguity flags** forcing flag: multi-wound no clear primary, Stage:N/A/unstageable, missing depth, source conflict, low format-detection confidence, hedge tokens (`aprx`).

## Eligibility grounding (CMS, HARD, with scope caveat)
CMS LCD L33831 "Surgical Dressings" + Noridian require: qualifying wound; length+width+depth; number of wounds; amount+type of exudate; regular re-evaluation (weekly for nursing-facility/heavy-draining). README primitives (active wound + active MCB + L×W±D + drainage) are a faithful documentation proxy. **Caveat:** real billing is CPT/LCD-specific; MVP routes on documentation-completeness proxy, a stated scope boundary. Missing depth (common in Envive 2D) is a genuine gap → correctly a flag, not accept.

## Recommended routing policy (pseudocode)
```
mcb_active   = (payer_code=="MCB") AND (effective_to is null)
active_wound = any(active wound ICD-10 dx) OR extracted_wound_exists
primary      = pick_primary_wound(...)   # multi-wound → dx-match/largest/most-documented; tie → ambiguous
required     = {type, location, length, width, drainage} (+depth, +stage if pressure ulcer)
completeness = |confident ∩ required| / |required|
agreement    = corroboration(dx, note, assessment)   # agree / single-source / conflict
ambiguity    = multi_wound_unclear OR stage_NA OR depth_missing OR source_conflict OR low_format_conf OR hedge

if NOT mcb_active:   REJECT "no_active_MCB"
if NOT active_wound: REJECT "no_active_wound"
if completeness==0:  REJECT "extraction_impossible"
if completeness==1.0 AND agreement=="agree" AND NOT ambiguity:  AUTO_ACCEPT
else:                FLAG_FOR_REVIEW   # default-safe abstain
```
Reason template names the driver in plain English (e.g. "Depth not documented and only one source describes the wound — confirm before billing.").

## Evaluation without gold labels
Separate two claims:
- **5a. Consistency over all 300 (NOT accuracy):** cross-source agreement rate, field-completeness distribution, route mix + reject-reason breakdown. Label as consistency.
- **5b. Small hand-labeled gold set (the only true accuracy):** 60–100 patients stratified across 3 facilities × 4 formats × 3 routes + hard cases; 2 annotators, report Cohen's κ. Report selective precision @ coverage on auto_accept (target ≥95%) + risk–coverage curve + per-field extraction accuracy (measurements ±0.2cm) + route confusion matrix, with n + CIs.
- **5c. LLM-as-judge (optional, caveated):** different model family, reason-faithfulness only (not accuracy), vs human spot-check; cite position/verbosity/self-enhancement bias (Zheng, NeurIPS 2023).
- **5d. Honest presentation:** lead with precision-at-coverage (n+CIs), not one accuracy number; show risk–coverage + cost asymmetry; state no-label limitation; name conformal as scale-up. Owning the limitation is the methodology win the README rewards.

## Key risk
No labels ⇒ no *certified* risk level; the gold set buys an honest estimate, not a guarantee. Owner: build/eval engineer to construct the 60–100-patient stratified gold set with 2 annotators + κ.

## Citations (grade)
Chow 1970 IEEE TIT (HARD) · Geifman & El-Yaniv NeurIPS 2017 / SelectiveNet ICML 2019 (HARD) · Charoenphakdee ICML 2021 (EST) · Guo ICML 2017 (HARD) · Zadrozny & Elkan KDD 2002 (EST) · Angelopoulos & Bates 2021 conformal tutorial (EST; Vovk 2005 theory) · Xiong/Tian ICLR 2024 (HARD) · Quach ICLR 2024 (EST) · Rudin NMI 2019 (HARD) · Zheng NeurIPS 2023 (HARD) · Ratner Snorkel VLDB 2017 (HARD) · CMS LCD L33831 + Noridian + CMS MLN CERT 48.6% (HARD).
