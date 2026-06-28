# SPEC §Routing — Selective Classifier, Confidence & Corroboration (Algorithmic Engineer — Routing)
_Persisted by CEO; subagent write harness-blocked. Conforms to MASTER-BLUEPRINT §3, §4b. Glass-box deterministic selective classifier; no verbalized-LLM confidence on accept path (Rudin 2019; Xiong ICLR'24)._

## 1. Eligibility gate
**1.1 mcb_active** = EXISTS coverage WHERE `payer_code=='MCB' AND effective_to IS NULL AND is_current==1` (NOT payer_type). Hot path = partial index ix_cov_active_mcb.
**1.2 active_wound** = has_active_wound_dx OR has_extracted_wound (prim.wound_type NOT NULL). Either passes gate; both+corroborating earns auto_accept.
**1.3 WOUND_FAMILIES allowlist** (case-insensitive prefix on icd10_code) — **DELTA: schema currently matches L89% only:**
| Prefix | Class |
|---|---|
| L89 | Pressure ulcer (site+stage encoded) |
| L97 | Non-pressure chronic ulcer lower limb |
| L98.41–49 | Non-pressure chronic ulcer other sites |
| E11.621/622, E10.621/622, E08/09/13.621/622 | DM foot/skin ulcer (DFU) |
| I83.0, I83.2 | Venous (varicose w/ ulcer) |
| I70.23x/24x/25x | Arterial (atherosclerosis w/ ulceration) |
Out of scope (MVP): S-codes (acute/traumatic), T81.3x (surgical). Patient whose only wound dx is out-of-scope → reject naming the code so a biller can override (flag, don't silently drop).

## 2. Per-field confidence formula
Per field f ∈ {wound_type, location, length, width, depth, drainage, stage} for the PRIMARY wound.
```
base[f]   = 0.40*source_agreement[f] + 0.20*extraction_method[f] + 0.20*span_verified[f] + 0.20*completeness_local[f]
penalty[f]= min(0.15, 0.05*data_quality_hits[f])
field_confidence[f] = clamp(base[f]-penalty[f], 0, 1)
```
**Weights close to 1.00** (0.40+0.20+0.20+0.20); span_verified assigned the 0.20 the research left implicit (DELTA, reconciliation).
- source_agreement[f] = fraction of available independent sources {regex,LLM,assessment,dx} that agree (categorical exact-after-normalize; numeric |a−b|≤0.2cm). One source only → 0.5.
- extraction_method[f]: labeled/structured (regex_spn/soap/json/manual)=1.00; positional regex (regex_envive/regex_prose)=0.85; llm-only=0.55.
- span_verified[f] = 1.0 if value is literal verbatim substring of source text, else 0.0 (categorical enums = 1.0 when gazetteer trigger found).
- completeness_local[f] = 1.0 if f's billing companions present (full L×W±D; usable non-N/A stage for PU), else 0.0.
- data_quality_hits[f]: dup-typo/aprx/hedge/unit-ambiguity/implausible, each 0.05, cap 0.15.

**2.3 Span-verified HARD GATE:** any measurement field with span_verified==0.0 → `field_confidence = min(field_confidence, 0.30)` → can never clear τ=0.80 → forces flag (anti-hallucination, expressed numerically).

**2.4 Roll-up:**
```
REQUIRED = {wound_type,location,length,width,drainage} ∪ ({depth} if depth-required type) ∪ ({stage} if pressure_ulcer)
field_mean = mean(field_confidence[f] for f in REQUIRED present)   # absent required field = 0.0
overall_conf = clamp(field_mean * corrob_mult, 0, 1)   # corrob_mult ∈ {1.00,0.90,0.75} from §4.4
```
Written to wound_extraction.overall_conf (primary row) → v_patient_eligibility.confidence.

## 3. Selective-classifier decision procedure (ordered short-circuit)
```
def route(patient):
    if not mcb_active(patient):       return REJECT, 'no_active_mcb'
    if not active_wound(patient):     return REJECT, 'no_active_wound'
    prim = pick_primary_wound(patient)
    if completeness(prim) == 0.0:     return REJECT, 'extraction_impossible'
    if (completeness(prim)==1.0 and agreement(patient)=='agree'
        and not ambiguity(prim,patient) and prim.overall_conf >= AUTO_ACCEPT_TAU):
        return AUTO_ACCEPT, 'complete_corroborated'
    return FLAG_FOR_REVIEW, dominant_driver(prim,patient)
```
**3.1 Four accept conditions (AND):** completeness==1.0; agreement=='agree' (≥2 sources corroborate type+location, no conflict); not ambiguity; overall_conf≥τ. Redundant by design (Chow cost-asymmetry safety margin).
**3.2 pick_primary_wound:** (a) dx-site match → (b) most-documented → (c) largest L×W area → (d) tie → multi_wound_unclear=True, pick (b) for display. Secondaries kept is_primary=0.
**3.3 Ambiguity triggers (any ⇒ no auto_accept):** multi_wound_unclear, stage_NA, depth_missing, source_conflict, low_format_conf (<FORMAT_CONF_MIN), hedge_present.
**3.4 Named constants (config, NOT inline):** `AUTO_ACCEPT_TAU=0.80` (placeholder, calibrate §6), `FORMAT_CONF_MIN=0.70`, `MEASURE_TOL_CM=0.20`. DELTA vs schema VIEW which hardcodes 0.80.

## 4. Corroboration scoring (§4b — confidence backbone)
**4.1 Per-source comparison** vs primary: type_agree, location_agree, stage_agree (null-safe). Normalize via ICD-10 taxonomy (L89.143→(pressure_ulcer,right_hip,stage_3)). `corroborates[s] = type_agree AND location_agree` (edge green=1/red=0); `conflict[s] = asserts(type|location) AND NOT corroborates`. Type/location disagreement = hard conflict (hip vs heel); stage disagreement alone = ambiguity flag only.
**4.2 Agreement category:** `conflict` if any conflict; `agree` if agree_sources≥2 and no conflict; else `single_source`.
**4.3 v_wound_corroboration contract (for DB engineer):** one row per (patient, evidence_source): patient_id, evidence_node('diagnosis'|'note'|'assessment'), source_note_id, source_assessment_id, type_agrees, location_agrees, stage_agrees, corroborates(=type AND location; edge color). Scalar: `agree_sources = COUNT(*) FILTER(WHERE corroborates) GROUP BY patient_id`. Primary = is_primary=1, GROUP BY patient_id HAVING overall_conf=MAX.
**4.4 Loop-closer (DELTA — new concrete formula):** `corrob_mult = 0.75 if conflict / 1.00 if agree / 0.90 if single_source`. Graph feeds routing TWICE: categorically (condition 2 / source_conflict) and continuously (multiplier on overall_conf). Conflict can never reach auto_accept by either path.

## 5. Reason-template grammar (deterministic, no LLM in reason path)
`reason(route, drivers, fields) -> sentence`. Slots: {patient}=first+last_initial, {type}/{location} humanized, {stage}, {source}, {conflict}, {code}.
- **ACCEPT:** "ACCEPT — {patient}: {type} at {location}{, stage}. L×W×D and drainage documented; diagnosis, note, and assessment agree. Safe to bill."
- **REJECT:** no_active_mcb / no_active_wound (+{code} if out-of-scope) / extraction_impossible — one template each.
- **FLAG (by dominant driver):** depth_missing, single_source, source_conflict, stage_NA, multi_wound_unclear, low_format_conf, hedge_present, low_confidence — one sentence each.
**5.3 dominant_driver precedence:** source_conflict > depth_missing > stage_NA > multi_wound_unclear > single_source > hedge_present > low_format_conf > low_confidence. Conflict leads (only driver implying extraction may be WRONG, not just incomplete). Detail panel may concatenate top-2 driver clauses; triage row shows the single dominant.

## 6. Evaluation / calibration hook (future, not MVP-blocking)
Architecture emits signals now; calibration is post-MVP (no gold labels). Gold set: 60–100 stratified, 2 annotators, Cohen's κ. Calibrate τ: sweep [0.5,1.0], pick τ meeting selective-precision-@-coverage ≥0.95 at max coverage on risk–coverage curve. τ is one named constant → recalibration = config change. Metrics emitted per run (labeled CONSISTENCY not accuracy): route mix, completeness dist, agreement rate, reject-reason breakdown. Scale-up (named, not built): conformal/isotonic once labels exist.

## 7. Data contract
Reads: pcc_coverage, pcc_diagnosis, wound_extraction (+*_conf), v_wound_corroboration (+agree_sources). Writes: wound_extraction.overall_conf (primary), route+reason via v_patient_eligibility. Constants (config): AUTO_ACCEPT_TAU=0.80, FORMAT_CONF_MIN=0.70, MEASURE_TOL_CM=0.20, WOUND_FAMILIES[], weights{agreement:0.40,method:0.20,span:0.20,completeness:0.20}, penalty_cap=0.15.

## 8. Deltas vs blueprint/schema (for CEO + database-engineer)
1. **Widen active_wound_dx** beyond L89% to WOUND_FAMILIES (§1.3) — DFU/venous/arterial/non-pressure. Request: widen predicate + partial index (keep L89; add GLOB set or wound_icd_family reference table joined in view).
2. **Parameterize AUTO_ACCEPT_TAU** — VIEW hardcodes 0.80. Request: single-row `config` table or app-side route computation so calibration = config change. Literal 0.80 OK for demo if documented as placeholder.
3. **span_verified weight** = 0.20 (research left it unweighted; sum was 0.80). Reconciliation to close to 1.00 + keep §2.3 hard cap.
4. **corrob_mult** {0.75,0.90,1.00} — new concrete formula for blueprint §4b's "agree_sources is one input to overall_conf."
**Review requests:** database-engineer (deltas 1–2, corroboration view §4.3); testing (decision-tree tests incl. every reject driver, conflict edge, span-gate cap, four-condition accept boundary at τ); sre-scalability (none — deterministic compute over 300-row VIEW).
