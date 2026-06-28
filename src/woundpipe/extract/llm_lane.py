"""Lane 2 — Claude structured extraction (OWNS prose/ambiguity).

SPEC spec-extraction §2.3. Calls Claude with a strict tool schema when an API
key is configured; otherwise degrades to no-op (regex lane is the floor).

The orchestrator (Claude Code) can also fulfil the LLM need directly: see
`apply_llm_results()` to inject externally-produced structured wounds.
"""
from __future__ import annotations

from woundpipe.config import Settings

EXTRACT_TOOL = {
    "name": "extract_wounds",
    "description": "Extract every wound's clinical fields. Copy each evidence_span as a "
                   "verbatim substring BEFORE its value. Null if not stated; never infer numbers.",
    "input_schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "primary_reasoning": {"type": "string"},
            "wounds": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "is_primary": {"type": "boolean"},
                        "type_evidence_span": {"type": ["string", "null"]},
                        "wound_type": {"type": ["string", "null"],
                                       "enum": ["pressure_ulcer", "diabetic_foot_ulcer",
                                                "venous_leg_ulcer", "arterial_ulcer",
                                                "surgical_wound", "trauma_wound", "other", None]},
                        "location_evidence_span": {"type": ["string", "null"]},
                        "location": {"type": ["string", "null"]},
                        "length_evidence_span": {"type": ["string", "null"]},
                        "length_cm": {"type": ["number", "null"]},
                        "width_evidence_span": {"type": ["string", "null"]},
                        "width_cm": {"type": ["number", "null"]},
                        "depth_evidence_span": {"type": ["string", "null"]},
                        "depth_cm": {"type": ["number", "null"]},
                        "stage_evidence_span": {"type": ["string", "null"]},
                        "stage": {"type": ["string", "null"],
                                  "enum": ["1", "2", "3", "4", "unstageable",
                                           "deep_tissue_injury", "not_applicable", None]},
                        "drainage_evidence_span": {"type": ["string", "null"]},
                        "drainage": {"type": ["string", "null"],
                                     "enum": ["none", "light", "moderate", "heavy", None]},
                    },
                    "required": ["is_primary", "wound_type", "location",
                                 "length_cm", "width_cm", "depth_cm", "stage", "drainage"],
                },
            },
        },
        "required": ["primary_reasoning", "wounds"],
    },
}

_SYSTEM = (
    "You extract wound clinical fields from a clinician's note for Medicare billing triage.\n"
    "- Copy each *_evidence_span as a LITERAL verbatim substring of the NOTE, before its value.\n"
    "- If a field is NOT explicitly stated, set value and span to null. Never infer a number.\n"
    "- Copy numbers exactly; do not compute or round. Use the enums only.\n"
    "- List EVERY distinct wound; mark exactly one is_primary=true; explain in primary_reasoning."
)


def span_gate(value, evidence_span: str | None, note: str) -> bool:
    """Drop any measurement whose span is not a literal substring of the note."""
    if value is None:
        return True
    if not evidence_span:
        return False
    import re
    norm = lambda s: re.sub(r"\s*(cm|mm)\b", r"\1", re.sub(r"\s+", " ", str(s).lower().replace("×", "x"))).strip()
    hay, span_n, val_n = norm(note), norm(evidence_span), norm(value)
    return span_n in hay and (val_n in span_n or val_n in hay)


def extract_llm(text: str, fmt: str, settings: Settings) -> list[dict]:
    """Call Claude if configured; else [] (regex-only degrade)."""
    if not settings.use_llm or not settings.anthropic_api_key:
        return []
    try:
        import anthropic
    except ImportError:
        return []
    try:
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key, timeout=settings.llm_timeout_s)
        resp = client.messages.create(
            model=settings.model_bulk,
            max_tokens=1024,
            temperature=0,
            system=_SYSTEM,
            tools=[EXTRACT_TOOL],
            tool_choice={"type": "tool", "name": "extract_wounds"},
            messages=[{"role": "user", "content": f"NOTE (format={fmt}):\n\"\"\"{text}\"\"\"\nCall extract_wounds."}],
        )
        for block in resp.content:
            if getattr(block, "type", None) == "tool_use":
                wounds = block.input.get("wounds", [])
                return _gate_measurements(wounds, text)
        return []
    except Exception:
        return []  # never let the LLM lane abort a run (fail-closed to regex)


def _gate_measurements(wounds: list[dict], note: str) -> list[dict]:
    for w in wounds:
        for f, span_key in (("length_cm", "length_evidence_span"),
                            ("width_cm", "width_evidence_span"),
                            ("depth_cm", "depth_evidence_span")):
            if not span_gate(w.get(f), w.get(span_key), note):
                w[f] = None  # hallucination guard
    return wounds


def apply_llm_results(wounds: list[dict], note: str) -> list[dict]:
    """Inject externally-produced (orchestrator-fulfilled) LLM wounds through the span gate."""
    return _gate_measurements(wounds, note)
