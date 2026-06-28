# Memory Index

> Owned by memory-architect. The map of the shared brain — what knowledge exists and where. Keep this current so agents don't re-derive what's known.

## Durable facts (`facts/`)
| Topic | File | Owner | Last verified |
|-------|------|-------|---------------|
| dashboard.data.md schema (5-zone format-agnostic content source + auto-population map) | `facts/T-001-dashboard-data-schema.md` · canonical artifact `artifacts/status-dashboard/dashboard.data.md` | knowledge-graph-engineer | 2026-06-08 |
| Dashboard tailoring process (design-agency per-project tailoring + 31-var `--dash-*` token contract) | `artifacts/status-dashboard/TAILORING.md` | design-system-specialist | 2026-06-08 |
| dashboard.base.css (shared token-driven core, host-design-system-bound) | `artifacts/status-dashboard/dashboard.base.css` | design-systems-engineer | 2026-06-08 |
| reporting.md config + engine gate (delivery_location/format/cadence/owner; INTAKE gate; RECONCILE regen contract; learnable; single-writer=orchestrator) | `state/reporting.md` | knowledge-graph-engineer | 2026-06-08 |
| Dashboard command-wiring spec (gate + RECONCILE drop-in copy for the 3 orchestrator commands) | `facts/T-007-command-wiring-spec.md` · canonical artifact `artifacts/status-dashboard/COMMAND-WIRING.md` | business-strategist | 2026-06-08 |
| Dashboard command wiring applied (kit-only patch of SDLC/SDLC-design/SDLC-gtm commands) | `facts/T-009-command-wiring.md` | business-strategist | 2026-06-08 |

## Research briefs (`research/`)
| Question | File | By | Date | Freshness |
|----------|------|----|------|-----------|
| _example (delete me): current OWASP guidance_ | _research/owasp-2025.md_ | technical-researcher | <date> | verify quarterly |

## Core references
- `ontology.md` — shared vocabulary + entity/relationship model.
- `standards.md` — binding coding/security/quality baselines.
- `design-system.md` — reusable Token/Component/Pattern/InteractionConvention registry (Design Agency).
- `micro-animation-toolkit.md` — glyph + micro-animation craft floor (techniques, durations/easings, the mandatory reduced-motion guard, copy-paste recipes). Every designer reads it before adding motion.
- `explainer-toolkit.md` — craft floor for the Explanation Agency (`/SDLC-explain`): the narrative standard + the machine-checkable Visual Quality Floor (≥5 scrollytelling scenes, ≥2 interactives, cited imagery) + web-native stack (vendor-local libs, defer-safe boot) + a11y/reduced-motion non-negotiables. Both explainer agents read it.
- `blog-voice.md` — craft floor for the Blog Agency (`/SDLC-blog`): the binding voice (cosmic/physics/economics analogy palette, geometric-visual intuition), Medium post shape, per-section text-to-image prompt blocks, and rigor gates (cited facts, verified quotes). Blaise Blog reads it before writing.
- `extension-injection.md` — inject-by-brief protocol: which extension types are hot-injectable mid-session (skills/commands/agents via briefs) vs not (MCP/plugins → fallback instruction + restart note).
- `brief-contract.md` — the BRIEF + REPORT schemas: briefs persisted to `bus/briefs/<task-id>.md` with a mandatory `inputs:` READ-FIRST list; workers write canonical `artifacts/<task-id>/report.md`.
- `research-sources.md` — **binding source knowledge base for the research bureau.** §A Academic (ML/CS): named discovery surfaces (arXiv categories, Semantic Scholar, OpenReview, HF Papers, Connected Papers, DBLP), venue tiers, the AI-agents canon, the 5-step literature-traversal method + evidence rules (incl. the live "Papers-with-Code is dead → HF Papers" correction). §B Market & Community: capital-flow sources (SEC EDGAR, PitchBook, Crunchbase, YC RFS, a16z) + community sources (X/Reddit/HN/Product Hunt/Medium/GitHub-Trending/G2) + the market-gap computation method (`GapScore = DemandSignal × UnderServed × SmallTeamAttackable` + cheapest-validation-test). academic/technical/market/web researchers + research-lead READ FIRST; re-verify volatile surfaces live.
- `sota/index.md` — curated SOTA + evergreen CS technique library (20 techniques across AI/agentic, HPC/systems, algorithms & DS, databases, applied math). Build engineers read it before optimizing/architecting and cite the technique applied. Sourced from research brief T-301; re-verify fast-moving rankings at decision time.
- `intel/index.md` — cross-sector intel / world-state for direction calls. Headline: applied/vertical AI on rented models is the open ground. Per-sector trend→gap→buildable-X tables + tracked forced-demand events (EU AI Act 2 Aug 2026; CPT 2026 codes) + HARD/EST/THIN evidence caveat. Sourced from T-302.
- `sota/conformal-gate.md` — conformal "abstain-when-unsure" gate spec (calibrated-confidence wrapper; abstain + escalate below threshold). Backs the Autonomy-safety rule in `standards.md`.
- `scout-cadences.md` — innovation-scout (monthly → refreshes `sota/`) + trend-scout (bi-weekly → refreshes `intel/`), run by the user via `/schedule`; keeps the knowledge libraries fresh.

## Hygiene rules
- Dedupe overlapping facts; link, don't copy.
- Mark stale entries `[STALE]` and trigger a re-research request rather than deleting silently.
