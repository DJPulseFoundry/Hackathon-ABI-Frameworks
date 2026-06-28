# SPEC §Extraction — Algorithmic Core (Algorithmic Engineer — Extraction)
_Persisted by CEO; subagent write was harness-blocked. Implements MASTER-BLUEPRINT §2 (three-lane hybrid). ALL regex executed against the 4 real api_samples.json archetypes — 0 misses. Validation harness: scratchpad/test_regex.py._

Stage S4 (EXTRACT). Consumes normalized notes+assessments (S2) + sniff (S3), writes `wound_extraction` rows for routing (S5). Three lanes: L1 deterministic regex (owns numbers), L2 Claude structured (owns prose/ambiguity), L3 reconciler+confidence (separate routing spec).

## 2.1 Format sniffer — classify from TEXT not note_type
`sniff(text) -> (format_tag, format_confidence)`; tags {envive, soap_idt, prose_shorthand, labeled_spn, assessment_flat_json, assessment_narrative, unknown}. Ordered first-match (order load-bearing):
| # | Test | tag | conf |
|---|---|---|---|
| 0 | assessment raw_json parses flat (numeric keys, no `sections[]`) | assessment_flat_json | 0.95 |
| 0b | assessment raw_json nested `{sections:[{questions:[{answer}]}]}` → unwrap answer, re-run 1–5 | assessment_narrative | 0.9 |
| 1 | `text.lstrip().startswith('*Envive')` | envive | 0.99 |
| 2 | `^Subjective:` AND `^Objective:` (M) | soap_idt | 0.95 |
| 3 | `Measures\b.*?/\s*Stage:` (slash-delimited, non-Envive) | labeled_spn | 0.85 |
| 4 | `\bMeas\b` | prose_shorthand | 0.70 |
| 5 | `\b(measures\|depth\|\d+(\.\d+)?\s*(cm\|mm)?\s*[x×])\b` | prose_shorthand | 0.60 |
| 6 | none | unknown | 0.30 |
Envive (1) MUST precede labeled_spn (3) — Envive bodies also contain `Measures … / Stage:`. format_confidence → routing `low_format_conf` ambiguity flag.
**Validated:** FA-001→envive .99; FA-002 n1→envive .99; FA-002 n2→prose_shorthand .60; FA-004→soap_idt .95; assess 55001→assessment_narrative→unwrap→labeled_spn .85.

## 2.2 Lane 1 — regex grammar (OWNS measurements); stdlib `re`, IGNORECASE, literal-substring-or-null
```python
NUM = r"\d+(?:\.\d+)?"
DIM = re.compile(rf"(?P<l>{NUM})\s*(?P<lu>cm|mm)?\s*[x×]\s*(?P<w>{NUM})\s*(?P<wu>cm|mm)?"
                 rf"(?:\s*[x×]\s*(?P<d>{NUM})\s*(?P<du>cm|mm)?)?", re.I)   # 3D/2D/glued/tight-glued
DEPTH = re.compile(rf"(?:depth\s*(?P<d1>{NUM})\s*(?P<u1>cm|mm)?)|(?:(?P<d2>{NUM})\s*(?P<u2>cm|mm)?\s*deep)", re.I)
STAGE = re.compile(r"Stage:\s*(?P<stage>Stage\s*[1-4IV]+|N/?A|Unstageable|Deep Tissue(?:\s*Injury)?)", re.I)
DRAIN = re.compile(r"\b(min(?:imal)?|scant|slight|mod(?:erate)?|copious|heavy|light|none|no\s+drainage)\b", re.I)
DRAIN_MAP = {"min":"light","minimal":"light","scant":"light","slight":"light","light":"light",
             "mod":"moderate","moderate":"moderate","copious":"heavy","heavy":"heavy","none":"none","no drainage":"none"}
LAT=r"(?:right|left|bilateral|\bR\b|\bL\b)"; SITE=r"(?:hip|buttock|sacrum|coccyx|heel|plantar|foot|ankle|trochanter|ischium|toe|leg|knee|elbow|back|trunk|shoulder)"
LOC = re.compile(rf"(?P<lat>{LAT})\s+(?P<site>{SITE})", re.I)
```
- DIM serves 3D `4.3 cm x 1.8 cm x 0.3 cm`, 2D `2.9 cm x 2.8 cm`, glued `5.9 x 4.5cm`, tight `3.5x2.7`. Multiple DIM matches ⇒ multi-wound (§2.7).
- DEPTH for `depth 1.8cm` / `0.9cm deep`, associated to nearest preceding DIM by offset.
- DRAINage amount mapped to enum; exudate TYPE words (serosanguineous/serous/purulent) captured separately as drainage_type. Guard against `No odor` false hits (validated FA-002 yields no token).
- LOC: `R→Right`, `L→Left`; `L heel` validated. wound_type owned by L2 but L1 emits cheap hints (`Pressure Ulcer`, `Diabetic`→DFU).
- Optional medspaCy ConText negation = cut-line, not critical path.

## 2.3 Lane 2 — Claude strict structured (OWNS prose/ambiguity)
Job: Envive comprehension, wound_type normalization (Diabetic diabetic→DFU), multi-wound primary selection — NOT numbers. Strict tool use / Structured Outputs GA, constrained decoding, grammar cached 24h.
- Bulk `claude-haiku-4-5-20251001`; escalate single note to `claude-sonnet-4-6` only on L1↔L2 disagreement. temp 0, pinned model. "Stable at temp 0," not bit-identical.
- **input_schema (strict tool `extract_wounds`)**: per-field `*_evidence_span` BEFORE value (defeat format tax); all nullable; enums for wound_type/stage/drainage; `additionalProperties:false`, `strict:true`; top-level `primary_reasoning`(string, written before constrained fields) + `wounds[]`. Each wound requires is_primary + per-field (evidence_span, value) for type/location/length/width/depth/stage/drainage.
- **Prompt**: SYSTEM enforces — copy evidence_span as LITERAL verbatim substring before value; null if not stated (never infer a number); copy numbers exactly; enums only; list EVERY wound, exactly one is_primary, explain in primary_reasoning. `tool_choice` forces the call. Output provisional until span gate + reconciler.

## 2.4 Verbatim-span gate (anti-hallucination, HARD)
JSON-schema numeric min/max NOT enforced under constrained decoding → drops any L2 measurement whose evidence_span isn't a literal substring of source (after normalization).
```python
def normalize_for_compare(s):
    s=s.lower().replace("×","x"); s=re.sub(r"\s+"," ",s); s=re.sub(r"\s*(cm|mm)\b",r"\1",s); return s.strip()
def span_gate(value, span, note):
    if value is None: return True
    if not span: return False
    hay=normalize_for_compare(note); n_span=normalize_for_compare(span); n_val=normalize_for_compare(str(value))
    return (n_span in hay) and (n_val in n_span or n_val in hay)
```
Applies to all measurement fields (+ recommended stage/drainage). On fail: value→null, `extraction_method="llm_rejected_span"`, record drop in RunManifest (span_gate_drops — the "flag don't hallucinate" story). L2 number surviving gate AND equal to L1 = strongest corroboration. Gate compares vs RAW original note text, not the abbrev-expanded copy.

## 2.5 Normalization (both lanes, pre-write)
1. Unit→cm float; missing unit⇒cm; mm⇒/10.
2. Dup-token collapse `re.sub(r"\b(\w+)\s+\1\b", r"\1", text, re.I)` → `Diabetic diabetic`→`Diabetic` (validated); sets data_quality_penalty (lowers conf, never blocks).
3. Abbrev expansion on a copy: `aprx|approx|~`→strip; `R/L`→Right/Left. `aprx 5.9`→5.9 (validated).
4. Stage status: numeric→`staged`; `N/A`→`not_applicable`; `Unstageable`→`unstageable`; `Deep Tissue`→`deep_tissue_injury`; absent on PU→`missing`. (FA-002 `Stage: N/A`→not_applicable validated.)
5. Implausible rejection (fail-closed→flag): dim >50cm→null + `quality_flag="implausible_magnitude"`; depth>length→keep + `quality_flag="depth_gt_length"`→FLAG. Logged, never auto-corrected.

## 2.6 Validation (executed vs 4 real samples — scratchpad/test_regex.py)
```
[FA-001 envive]   DIM 2.9x2.8 (d=None)  STAGE 'Stage 3'  DRAIN heavy   LOC Right hip
[FA-002 envive]   DIM 5.9x4.5           STAGE 'N/A'      DRAIN heavy   LOC Left buttock
[FA-002 prose]    DIM 5.9x4.5 | 3.5x2.7  DEPTH 1.8 / 0.9  DRAIN Min,slight  LOC Left buttock | L heel (2 wounds)
[FA-004 soap_idt] DIM 4.3x1.8x0.3       DRAIN moderate   LOC Right plantar
[assess 55001]    narrative→DIM 2.9x2.8  STAGE 'Stage 3'
DUP: FA-004 'Diabetic diabetic'→'Diabetic'
```
Every measurement/stage/drainage/location form + dup-typo + multi-wound split parsed. **0 misses on live archetypes.**

## 2.7 Primary-wound selection (multi-wound)
Extract ALL wounds; never drop secondaries (is_primary=0). Rank: (1) DX-SITE MATCH (wound type+location matches active L89.*/E11.62* dx — strongest anchor) → (2) LISTED-FIRST/MOST-DETAILED (earliest offset; tie by field-completeness) → (3) LARGEST AREA (max L×W). TIE→pick #2 + set `is_ambiguous=true`. is_ambiguous OR dx-vs-note site conflict → routing `multi_wound_unclear`→FLAG. L2 primary_reasoning advisory; deterministic rank authoritative.
Worked (sample B): Left buttock 5.9×4.5×1.8 vs L heel 3.5×2.7×0.9; FA-002 active dx = Left buttock → rule 1 picks buttock primary; heel is_primary=0. (Area buttock 26.55 > heel 9.45 corroborates.)

## 2.8 Taxonomy match (corroboration anchor)
`L89.xxx` encodes site+stage (L89.143 = Stage 3 PU Right hip). Static map ICD_TYPE {L89→pressure_ulcer, E11.62→diabetic_foot_ulcer, I83.0/I87.2→venous_leg_ulcer}; ICD_SITE for laterality+region. Match = type match AND site overlap; stage digit corroborates note stage. Site conflict (dx hip vs note heel) → reconciler conflict → FLAG.

## 2.9 Output contract → wound_extraction
One row per (patient, wound, source); L1 and L2 each emit; reconciler collapses. L1 authoritative for length/width/depth/stage/drainage; L2 authoritative for wound_type/is_primary, measurements span-gated only. Per-field `*_evidence_span` + `extraction_method ∈ {regex, llm, llm_rejected_span, assessment_flat, assessment_narrative}`. Extra fields: wound_index (links L1↔L2 same wound), stage_status, drainage_type, quality_flag, format_tag, format_confidence, is_ambiguous, per-field field_confidence (reconciler finalizes).

### ⚠️ Deltas to schema owner (CONVERGES with architect Delta B)
- **D1:** need per-field `field_confidence` + per-field `*_evidence_span` for highlight UI. Recommend a **child `wound_field` table** (field, value, evidence_span, method, confidence) over per-field columns — cleaner for highlight renderer + corroboration view. **[Same conclusion as architect Delta B — ADOPT.]**
- **D2:** add stage_status, drainage_type, quality_flag, format_tag, format_confidence, is_ambiguous, wound_index.
- **D3:** reconcile enum casing — store canonical `"3"` not `"Stage 3"`; match schema CHECK verbatim.

## 2.10 Stage-4 orchestration
```
for record in notes+assessments:
    tag,fconf = sniff(text); text = unwrap_if_assessment(record,tag)
    parse_copy = collapse_dups(expand_abbrev(text))
    l1 = [normalize(w) for w in regex_extract(parse_copy, tag)]; rows += emit(l1,"regex",tag,fconf)
    if needs_llm(tag,l1):   # envive/prose/assessment_narrative/unknown OR >1 DIM OR wound_type unresolved
        l2 = [w for w in claude_extract(text,schema,"haiku-4-5",tag) if span_gate_all(w, record.text)]
        if disagree(l1,l2): l2 = claude_extract(text,schema,"sonnet-4-6",tag)  # escalate
        rows += emit(l2,"llm",tag,fconf)
    # primary §2.7 + taxonomy §2.8; reconciler finalizes confidence
write rows -> wound_extraction
```
Pure soap_idt/labeled_spn single-triple may be regex-only (LLM still runs in bulk for cheap corroboration). Span gate vs RAW note text.

## 2.11 Fail-closed posture
No parseable measurement after both lanes → nulls → routing REJECT. Span-gate fail → null, never pass through. Ambiguity (multi-wound tie, stage N/A, depth missing, conflict, low format conf) → flags → FLAG. **Flag, don't hallucinate** (the headline). Implausible → null + logged.

**Review requests:** testing-engineer (regex edge-case corpus beyond 4 samples); database-engineer (D1–D3).
