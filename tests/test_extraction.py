"""Extraction correctness — the algorithmic core (SPEC acceptance #5, #6)."""
from woundpipe.extract.sniff import detect_format, unwrap_assessment
from woundpipe.extract.regex_lane import find_wounds, collapse_dups
from woundpipe.models import NoteFormat


def test_envive_format_and_2d_measure():
    txt = ("*Envive Care Conference Review - V 4.0\nWound Status: Pressure Ulcer to Right hip / "
           "Measures 2.9 cm x 2.8 cm / Stage: Stage 3\nDrainage present - serosanguineous, heavy.")
    fmt, conf = detect_format(txt)
    assert fmt is NoteFormat.ENVIVE and conf >= 0.9
    w = find_wounds(txt)[0]
    assert w["length_cm"] == 2.9 and w["width_cm"] == 2.8 and w["depth_cm"] is None
    assert w["stage"] == "3" and w["drainage"] == "heavy" and w["location"] == "Right hip"


def test_soap_3d_and_dup_typo_collapse():
    txt = ("Subjective: pain 9/10.\nObjective: Diabetic diabetic Right plantar measures "
           "4.3 cm x 1.8 cm x 0.3 cm. Drainage: moderate.")
    fmt, _ = detect_format(txt)
    assert fmt is NoteFormat.SOAP
    w = find_wounds(collapse_dups(txt))[0]
    assert (w["length_cm"], w["width_cm"], w["depth_cm"]) == (4.3, 1.8, 0.3)
    assert w["drainage"] == "moderate" and w["wound_type"] == "diabetic_foot_ulcer"


def test_multi_wound_split():
    txt = ("Pressure Ulcer Left buttock measures aprx 5.9 x 4.5cm, depth 1.8cm. "
           "Heel wound also eval - L heel 3.5x2.7, 0.9cm deep.")
    wounds = find_wounds(collapse_dups(txt))
    assert len(wounds) == 2
    assert wounds[0]["location"] == "Left buttock" and wounds[0]["depth_cm"] == 1.8
    assert wounds[1]["location"] == "Left heel" and wounds[1]["depth_cm"] == 0.9


def test_stage_na_maps_to_not_applicable():
    txt = "Wound Status: Pressure Ulcer to Left buttock / Measures 5.9 cm x 4.5 cm / Stage: N/A"
    w = find_wounds(txt)[0]
    assert w["stage"] == "N/A" and w["stage_status"] == "not_applicable"


def test_no_fabricated_measurements_spans_are_literal():
    """Every measurement span must re-index to a real substring (acceptance #6)."""
    txt = "Right hip Measures 2.9 cm x 2.8 cm / Stage: Stage 3"
    w = find_wounds(txt)[0]
    s, e = w["measure_span"]
    assert "2.9" in txt[s:e] and "2.8" in txt[s:e]


def test_assessment_unwrap_nested_narrative():
    raw = ('{"sections":[{"questions":[{"question":"Wound narrative",'
           '"answer":"Pressure Ulcer to Right hip / Measures 2.9 cm x 2.8 cm / Stage: Stage 3"}]}]}')
    body = unwrap_assessment(raw)
    assert "Right hip" in body
    w = find_wounds(body)[0]
    assert w["length_cm"] == 2.9
