# Shared Ontology

> Owned by memory-architect. The controlled vocabulary so every agent means the same thing by the same word. Extend per mission (especially for ontology/knowledge-graph work).

## Core entities
- **Mission** — the active objective.
- **Task (T-)** — a unit of work with an owner and status.
- **Agent** — a role in the org (see org-chart.md).
- **Artifact** — an output produced by an agent.
- **Request (REQ-)** — an async ask placed on the bus.
- **Decision (D-)** — a recorded choice. **Risk (R-)** — a tracked threat/blocker.
- **Gate** — a checkpoint with exit criteria.

## Core relationships
- Agent *owns* Task · Task *produces* Artifact · Task *depends-on* Task.
- Agent *raises* Risk · Risk *blocks* Task · Decision *resolves* Risk.
- Request *from* Agent *to* Agent · Research-brief *informs* Decision.

## Product & design domain (default for product/SDLC-design missions)
> The entity types the SDLC, Design, and GTM agencies share when building a product. A **feature set
> IS a Release** and its items ARE Features — so the project's feature lists and this ontology are
> the same structure. Design-system types are first-class so "reuse before you invent" is checkable.

- **Product** — the thing being built. **Release** — a versioned milestone; *this is a feature set*.
- **Feature** — a capability/work item; *this is a feature-set item*.
- **DesignDocument** — a design artifact (mockup, prototype, north-star, spec). **Spec** — an engineering spec.
- **DesignSystem** — the reusable visual + interaction language (see `design-system.md`).
- **Token** — a named design value (color/space/type/radius/motion). **Component** — a reusable UI block.
- **Pattern** — a reusable layout/flow. **InteractionConvention** — a reusable behavior rule.
- **BusinessDoc** — PR/FAQ, pitch, GTM/launch plan. **GTMEvidence** — a real-world demand signal (ad/landing/user-test result) with provenance.

Relationships:
- Product *has* Release (1→many) · Release *contains* Feature (1→many) ← the feature set.
- DesignDocument *specifies* Feature · Spec *implements* Feature · Decision *affects* Feature | DesignDocument.
- Component *uses* Token · Pattern *composes* Component · DesignDocument *conforms-to* DesignSystem · Feature *governed-by* InteractionConvention.
- BusinessDoc *describes* Product | Release · GTMEvidence *supports* Decision (every estimate/projection cites ≥1 GTMEvidence — see `standards.md`).

## Status-reporting domain (CEO-facing status dashboard)
> The entity types for the standing project-status deliverable every agency creates at kickoff and
> regenerates each cycle. Added 2026-06-08 (Custom Project Status Dashboard mission).

- **StatusDashboard** — the standing, CEO-facing project-status deliverable an agency creates at
  kickoff and regenerates each cycle. Five zones: overview / the-arc / you-are-here / progress+risks /
  footer. Has two **output formats** (`standalone` webpage | `interlude` widget) that share one
  format-agnostic content source (`dashboard.data.md`).
- **ReportingConfig** — the user-editable rules file (`state/reporting.md`) that gates delivery:
  `delivery_location` / `format` / `cadence` / `owner`. Learnable; single-writer = orchestrator.
- **DeliveryLocation** — where the rendered StatusDashboard is written (local file path is the default).
- **MidFlightDeliverable** — an interim artifact shipped at a phase boundary on long projects.
- **TokenContract** (`--dash-*`) — a host-agnostic, re-skinnable CSS-custom-property convention that
  binds the dashboard to the host DesignSystem's Tokens via `var(--host-x, fallback)`; never a
  skill-unique token set. A specialization of the **Token** concept above.

Relationships:
- Agency *creates* StatusDashboard (at kickoff) · StatusDashboard *reports-on* Mission.
- StatusDashboard *renders-from* `dashboard.data.md` · `dashboard.data.md` *populates-from*
  Task / status-board / risk-register (the arc, you-are-here, progress, risks).
- ReportingConfig *gates* StatusDashboard · ReportingConfig *sets* DeliveryLocation · StatusDashboard
  *written-to* DeliveryLocation.
- StatusDashboard *conforms-to* DesignSystem *via* TokenContract (TokenContract *binds-to* Token).
- MidFlightDeliverable *delivered-at* Gate (a phase boundary).

## Domain extensions
> For a knowledge-graph or ontology mission, define the project's entity types and relations here (the ontology-engineer owns this section during such missions; memory-architect owns the rest of this file). Keep it consistent with the relationships above.
>
> **Concurrency:** because both roles can edit this one file, the orchestrator must never spawn `memory-architect` and `ontology-engineer` in the **same** batch — sequence them across cycles so there is only ever one writer at a time.
