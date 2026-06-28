# MISSION — ABI Frameworks Hackathon → treat as MVP

## Objective
Research-first cycle. Produce an **extensive, cited, decision-ready research + architecture + design blueprint** for a wound-care Medicare-Part-B billing-triage pipeline, built to **MVP** quality (not throwaway hackathon code). Pipeline: rate-limited PCC API → extract wound fields from heterogeneous notes/assessments → SQLite (queryable, schema-managed) → routing decision (`auto_accept`/`flag_for_review`/`reject`) + plain-English reason → **beast-mode** biller dashboard with data-flow visuals.

## Type
RESEARCH + ARCHITECTURE + DESIGN-DIRECTION (precedes BUILD). Part of an `/SDLC` build mission, currently in its research/plan phase.

## Scope / blast radius
- This cycle: research artifacts only under `.agency/artifacts/`. No app code yet.
- Working dir clean, on `main`, remote `origin` = github.com/yashwanthsai1234/Hackathon-ABI-Frameworks. Build will branch off main (never commit to main directly).

## Hard constraints (from the user, non-negotiable)
- **MVP mindset**, not hackathon-throwaway. Maintainable, well-modeled.
- **Schema management is a MUST.**
- **DB = SQLite**, local, with **state-of-the-art queryable methods**.
- **Frontend must be a beast**: outstanding UI/UX, "perception as reality," product visuals AND **data-flow visuals** (data-intensive — show the data moving).
- **Cutting-edge methods** for extraction/routing.
- Ground everything in the REAL API (grounding artifact), not idealized docs.

## Definition of done (this research cycle)
A synthesized master blueprint the user can green-light, each section cited + with trade-offs:
1. Extraction engine approach (rules vs LLM vs hybrid; confidence/calibration).
2. Routing/eligibility logic grounded in real ambiguity.
3. SQLite schema + queryable layer + schema-management/migration strategy.
4. Ingestion resilience architecture (429 handling, two-ID model, incremental sync, DAG).
5. Frontend/visualization direction (stack + data-flow viz + biller UX).
6. MVP framing (domain credibility, biller persona, success bar).
+ Recommended tech stack and a phased build plan with cut-lines.

## Judging criteria to optimize
Pipeline design · Extraction accuracy (structured + free text) · Schema & data modeling · Presentation (explainable to non-technical biller) · Problem-solving (ambiguity handling, tradeoffs).

## Key grounding facts
See `.agency/artifacts/grounding/api-reality.md`. note_type ≠ format (detect from text); assessments embed free-text narrative; payer_code MCB (not payer_type) is the eligibility key; ICD-10 active wound dx corroborates notes (free confidence signal); two-identity join trap; ~1,200 calls @ 30% 429.

## Status
Cycle 1 — INTAKE + grounding done. Research fleet spawning.
Reporting: local HTML dashboard at `.agency/artifacts/status-dashboard/dashboard.html` (default).
