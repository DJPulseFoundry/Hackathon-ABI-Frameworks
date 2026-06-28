"""S4 — extraction orchestrator.

Per patient: pull active wound diagnoses + notes + assessments, run the lanes
(sniff -> regex -> optional LLM -> reconcile), choose the primary wound, and
persist wound_extraction rows (+ a synthetic 'diagnosis' evidence row so the
diagnosis participates in the corroboration graph) + per-field evidence.
"""
from __future__ import annotations

import sqlite3

from woundpipe.config import Settings
from woundpipe.extract import llm_lane, reconcile, regex_lane
from woundpipe.extract.sniff import detect_format, unwrap_assessment
from woundpipe.models import NoteFormat

_FMT_METHOD = {
    NoteFormat.ENVIVE: "regex_envive",
    NoteFormat.SOAP: "soap",
    NoteFormat.PROSE: "regex_prose",
    NoteFormat.SPN: "regex_spn",
    NoteFormat.ASSESS_FLAT: "json",
    NoteFormat.ASSESS_NARRATIVE: "json",
    NoteFormat.UNKNOWN: "regex_prose",
}
_WOUND_ICD_PREFIXES = ("L89", "L97", "L98.4", "E11.62", "E10.62", "E08.62",
                       "E09.62", "E13.62", "I83.0", "I83.2", "I70.23", "I70.24", "I70.25")


def _is_wound_dx(code: str | None) -> bool:
    if not code:
        return False
    c = code.upper().replace(".", "")
    return any(c.startswith(p.replace(".", "")) for p in _WOUND_ICD_PREFIXES)


def _wound_from_text(text: str) -> dict | None:
    ws = regex_lane.find_wounds(regex_lane.collapse_dups(text or ""))
    return ws[0] if ws else None


def _area(w: dict) -> float:
    return (w.get("length_cm") or 0) * (w.get("width_cm") or 0)


def _completeness_count(w: dict) -> int:
    return sum(1 for k in ("wound_type", "location", "length_cm", "width_cm", "depth_cm", "drainage")
               if w.get(k) is not None)


def choose_primary(candidates: list[dict], dx_wounds: list[dict]) -> dict | None:
    if not candidates:
        return None
    # 1) dx-site match
    for w in candidates:
        for d in dx_wounds:
            if (w.get("location") and d.get("location") and
                    w["location"].lower() == d["location"].lower()):
                return w
    # 2) most-documented, then 3) largest area
    return sorted(candidates, key=lambda w: (_completeness_count(w), _area(w)), reverse=True)[0]


_INSERT = """INSERT INTO wound_extraction
 (patient_id, source_kind, source_note_id, source_assessment_id, is_primary, extraction_method,
  wound_type, wound_type_conf, stage, stage_conf, location, location_conf,
  length_cm, width_cm, depth_cm, measure_conf, drainage, drainage_conf, overall_conf,
  evidence_span_start, evidence_span_end, evidence_quote, extracted_at)
 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"""


def _persist(con, patient_id, source_kind, w, *, method, is_primary, note_id=None,
             assess_id=None, note_text=None, now=""):
    fc = w.get("field_confidence", {})
    span = w.get("measure_span")
    quote = note_text[span[0]:span[1]] if (span and note_text) else None
    cur = con.execute(_INSERT, (
        patient_id, source_kind, note_id, assess_id, 1 if is_primary else 0, method,
        w.get("wound_type"), fc.get("wound_type"), w.get("stage"), fc.get("stage"),
        w.get("location"), fc.get("location"),
        w.get("length_cm"), w.get("width_cm"), w.get("depth_cm"), fc.get("length_cm"),
        w.get("drainage"), fc.get("drainage"), w.get("overall_conf"),
        span[0] if span else None, span[1] if span else None, quote, now,
    ))
    eid = cur.lastrowid
    # per-field evidence for the highlight UI (R1)
    if is_primary and note_text:
        for field, span_key in (("wound_type", None), ("location", "location_span"),
                                ("measure", "measure_span"), ("stage", "stage_span"),
                                ("drainage", "drainage_span")):
            sp = w.get(span_key) if span_key else None
            if sp:
                con.execute(
                    "INSERT INTO wound_field_evidence (extraction_id, field, char_start, char_end, quote, method, confidence)"
                    " VALUES (?,?,?,?,?,?,?)",
                    (eid, field, sp[0], sp[1], note_text[sp[0]:sp[1]], method, fc.get(field if field != "measure" else "length_cm")),
                )
    return eid


def extract_all(con: sqlite3.Connection, settings: Settings, manifest=None) -> dict:
    from woundpipe.ingest.checkpoint import now_iso
    now = now_iso()
    con.execute("DELETE FROM wound_field_evidence")
    con.execute("DELETE FROM wound_extraction")
    patients = con.execute("SELECT patient_id, id FROM pcc_patient WHERE is_current=1").fetchall()
    by_format: dict[str, int] = {}
    n_extracted = 0

    for pid, iid in patients:
        # --- diagnosis evidence wounds ---
        dx_wounds = []
        for code, desc in con.execute(
            "SELECT icd10_code, icd10_description FROM pcc_diagnosis "
            "WHERE patient_id=? AND clinical_status='active'", (pid,)
        ).fetchall():
            if _is_wound_dx(code):
                dw = _wound_from_text(desc or "")
                if dw:
                    dx_wounds.append(dw)

        candidates = []   # (wound, source_kind, note_id, assess_id, method, note_text)
        # --- notes ---
        for nid, ntext in con.execute(
            "SELECT id, note_text FROM progress_note WHERE patient_id=? AND is_current=1", (iid,)
        ).fetchall():
            fmt, fconf = detect_format(ntext or "")
            by_format[fmt.value] = by_format.get(fmt.value, 0) + 1
            text = regex_lane.collapse_dups(ntext or "")
            ws = regex_lane.find_wounds(text)
            if settings.use_llm and settings.anthropic_api_key:
                _ = llm_lane.extract_llm(ntext or "", fmt.value, settings)  # enhancement
            for w in ws:
                candidates.append((w, "note", nid, None, _FMT_METHOD[fmt], ntext))
        # --- assessments ---
        for aid, rawj in con.execute(
            "SELECT id, raw_json FROM pcc_assessment WHERE patient_id=? AND is_current=1", (iid,)
        ).fetchall():
            body = unwrap_assessment(rawj or "")
            fmt, _ = detect_format(rawj or "", is_assessment=True)
            ws = regex_lane.find_wounds(regex_lane.collapse_dups(body))
            for w in ws:
                candidates.append((w, "assessment", None, aid, "json", body))

        if not candidates and not dx_wounds:
            continue

        cand_wounds = [c[0] for c in candidates]
        primary = choose_primary(cand_wounds, dx_wounds)
        # corroboration sources = all candidate wounds + dx wounds
        sources = cand_wounds + dx_wounds
        if primary:
            method = next((c[4] for c in candidates if c[0] is primary), "regex_prose")
            reconcile.reconcile(primary, sources, method="regex")

        # One row per SOURCE RECORD (each source = one evidence node). Multi-wound
        # notes collapse to that record's best wound (the primary if present here).
        best_by_record: dict[tuple, tuple] = {}
        for w, sk, nid, aid, method, ntext in candidates:
            key = (sk, nid, aid)
            cur = best_by_record.get(key)
            better = (w is primary) or (cur is None) or (
                _completeness_count(w) > _completeness_count(cur[0]))
            if better:
                best_by_record[key] = (w, sk, nid, aid, method, ntext)
        for w, sk, nid, aid, method, ntext in best_by_record.values():
            _persist(con, pid, sk, w, method=method, is_primary=(w is primary),
                     note_id=nid, assess_id=aid, note_text=ntext, now=now)
        # one diagnosis evidence row (best dx, matching primary location if any)
        if dx_wounds:
            dw = next((d for d in dx_wounds if primary and d.get("location")
                       and primary.get("location")
                       and d["location"].lower() == primary["location"].lower()), dx_wounds[0])
            _persist(con, pid, "diagnosis", dw, method="manual", is_primary=False, now=now)
        n_extracted += 1

    con.commit()
    return {"patients_with_wounds": n_extracted, "by_format": by_format}
