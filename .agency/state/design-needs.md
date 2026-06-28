# Design needs — first-class plan items

> Owned by the orchestrator (captured at PLAN). Every user-facing surface a mission touches gets a
> row here so design is planned, not bolted on. Each row ties to a feature set / ontology Feature and
> carries its **Gate-1** status (a locked DesignDocument or `none needed — <reason>`) — code does not
> start on a UI Feature until its design is resolved (see `memory/standards.md` Design conformance).

## Needs

| Surface / Feature | Feature set | Reuses (design-system) | Net-new needed | Gate-1 design | Intent Ledger (G1.5) | Parity evidence (G2) | Status |
|---|---|---|---|---|---|---|---|
| _e.g._ signup screen | signup-onboarding | Button, Field, empty-state | trial-card pattern | `designs/trial-card.html` (locked) | `designs/trial-card.ledger.md` | `artifacts/<task>/verification.md` (screenshot pair) | ready |

> Status vocabulary: `needs-design` · `in-design` · `ready` (Gate-1 resolved) · `done` (Gate-2 parity
> confirmed). **For a UX surface, "ready" also requires the Intent Ledger (GOAL ⟂ PLAN, Gate 1.5,
> owned by `dana-design-direction`), and "done" requires ran-not-asserted parity evidence** — a
> screenshot of the running app paired with the locked design (Gate 2 / G2.5). "Net-new needed" lists
> elements not yet in `design-system.md` — route those through the Design Agency and capture back on
> acceptance.

## North-star (optional, aspirational)
> If the user opted into a north-star for any surface, link it here. The north-star is the ideal
> end-state as a concrete artifact — it guides direction and is **decoupled from this mission's
> scope** (not a commitment to build all of it now). For the shape + quality bar, copy the worked
> example at `skills/claude-code-onboarding/assets/example-north-star.html` (self-contained HTML,
> motion conforming to `memory/micro-animation-toolkit.md`).

| Surface | North-star artifact | Registered as DesignDocument? |
|---|---|---|
| _e.g._ dashboard | `artifacts/north-star/dashboard.html` | yes (ontology) |
