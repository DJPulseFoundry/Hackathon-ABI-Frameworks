# Org Chart & Ownership (actor ontology)

The roster and who owns what. See `AGENCY.md` (kit root) for the full hierarchy and rationale.

## Agencies (one engine, several remits — see `AGENCY.md`)
- **SDLC Agency** (`/SDLC`) — full build-out; the divisions below.
- **Design Agency** (`/SDLC-design`) — prototypes/concepts only: design-lead, design-explorer, design-researcher, design-system-specialist, design-systems-engineer.
- **GTM Agency** (`/SDLC-gtm`) — launch + real signal: gtm-lead, gtm-strategist, gtm-builder, user-testing-coordinator, content-marketer, sales-engineer.
- **Explanation Agency** (`/SDLC-explain`) — teach one topic deeply (intuition→formalism, real cited case study): explainer-narrative (story-driven read), explainer-visual (interactive 3Blue1Brown-style HTML).
- **Blog Agency** (`/SDLC-blog`) — one Medium-ready technical post in the user's voice per `memory/blog-voice.md`: blog-writer (Blaise Blog). Drafts only — the user publishes.

## Tiers (SDLC Agency) — 57 agents on disk
- **Orchestrator** (main session, `/SDLC` · `/SDLC-design` · `/SDLC-gtm` · `/SDLC-explain` · `/SDLC-blog`) — only spawner; sets mission; owns go/no-go.
- **Management** (4) — chief-of-staff, memory-architect, risk-quality-officer, people-talent-director (CHRO for the agent workforce — performance reviews from the usage-ledger, charter audits, roster gap analysis; staffed at RECONCILE on big missions).
- **Research bureau** (5) — research-lead (head) + web / technical / market / academic researchers.
- **Divisions** — Quality & Release (10), GitHub (4), Production/SRE (5: + support-engineer — user-facing FAQ/KB/onboarding before DELIVER + post-incident), Build (4), Knowledge & Strategy (5: + data-analyst — metric trees, dashboard specs, experiment readouts; + lifecycle-retention — the post-activation user lifecycle loop: activation/retention/expansion/advocacy/win-back, consuming data-analyst's numbers; staffed in OPERATE/GROW), **Product** (1: product-manager — PRD + story backlog at PLAN; pairs with the Design Agency), **Business Office** (3: finance-analyst — TCO/unit-economics/pricing; legal-compliance-counsel — license audits/policy drafts/regulatory checklists, escalates straight to the orchestrator like a real GC; payments-ops — the operational mechanics of taking/returning money: provider choice (MoR vs processor), checkout/refunds/disputes/dunning/tax; drafts but never moves money; staffed at LAUNCH; people-ops — the HUMAN team: hiring, teammate onboarding, least-privilege access provisioning + offboarding (distinct from people-talent-director, who runs the *agent* workforce); staffed in OPERATE/GROW).

## Personas (display names ↔ spawn slug)
Each agent has an alliterative, gender-neutral **persona name** it introduces itself by; the **slug** (left) is the unchanged identifier the orchestrator spawns and every file references. Renaming a persona is cosmetic; the slug is load-bearing — never change it here without updating every reference.

| Slug (spawn identifier) | Persona | Slug | Persona |
|---|---|---|---|
| chief-of-staff | Cass Chief-of-Staff | release-tagger | Riley Release |
| risk-quality-officer | Quinn Quality | deploy-operator | Drew Deploy |
| memory-architect | Marlo Memory | monitoring-watch | Monroe Monitoring |
| research-lead | Reese Research | incident-commander | Ira Incident |
| academic-researcher | Avery Academic | recovery-engineer | Remy Recovery |
| technical-researcher | Tory Technical | frontend-engineer | Frankie Frontend |
| market-researcher | Mika Market | backend-engineer | Bailey Backend |
| web-researcher | Wren Web | database-engineer | Dana Database |
| architecture-reviewer | Arlo Architecture | optimization-engineer | Ollie Optimization |
| ux-reviewer | Uli UX | ontology-engineer | Onyx Ontology |
| code-quality-reviewer | Charlie Code | knowledge-graph-engineer | Kai Knowledge |
| security-reviewer | Sage Security | business-strategist | Blair Business |
| privacy-reviewer | Parker Privacy | design-lead | Dale Design-Lead |
| testing-reviewer | Tatum Testing | design-explorer | Ellis Explorer |
| cicd-reviewer | Cameron CI/CD | design-researcher | Dara Design-Research |
| sre-scalability-reviewer | Skyler Scalability | design-system-specialist | Sam System |
| observability-reviewer | Oakley Observability | design-systems-engineer | Sully Systems |
| docs-release-reviewer | Dakota Docs | gtm-lead | Gale GTM |
| repo-steward | Robin Repo | gtm-strategist | Stevie Strategy |
| pr-manager | Peyton PR | gtm-builder | Bo Builder |
| issue-triage | Izzy Issues | explainer-narrative | Nico Narrative |
| explainer-visual | Val Visual | user-testing-coordinator | Uri User-Testing |
| product-manager | Presley Product | finance-analyst | Finley Finance |
| legal-compliance-counsel | Lennox Legal | people-talent-director | Perry People |
| data-analyst | Darby Data | content-marketer | Casey Content |
| sales-engineer | Sasha Sales | support-engineer | Sutton Support |
| payments-ops | Pax Payments | lifecycle-retention | Lior Lifecycle |
| blog-writer | Blaise Blog | people-ops | Harper HR |
| a11y-checker | Allie Accessibility | | |

(The onboarding kit's own personas — **Garry Git** and **Ori Orc** — already follow this convention.)

## Delegation hierarchy (how the roster scales without breaking down)
The org is a **routing tree**, not a flat list the orchestrator must hold in its head:

```
Orchestrator (CEO — the main session running /SDLC*)   ← only entity that can spawn (platform rule)
   │  supported by
Chief of Staff (Cass)   — keeps the Roster Ledger current; briefs the CEO on who fits each need
   │  routes via
Department Heads        — organize their division's specialists, relay a need to the right one, flag gaps up
   │
Specialists             — the roster (every one an alliterative persona)
```

- **Only the main session spawns subagents** (platform constraint). So "department heads" are an *organizing/routing* layer the orchestrator consults through the blackboard + briefs — a head recommends the right specialist (or surfaces a gap); the orchestrator does the actual spawn.
- **Chief of Staff is the default router.** A division gets its **own department head only when it grows large enough to need one** — until then Cass routes it directly. Designated heads today: Research bureau → `research-lead`; Quality & Release → `risk-quality-officer`; Design Agency → `design-lead`; GTM Agency → `gtm-lead`. Add a head (promote an existing lead, or GENERATE one) when a division's specialist count makes the CoS the bottleneck, and record it in the ledger. This layering is what keeps the orchestrator's per-task judgment from becoming a single point of failure as the roster grows.

## Roster ledger (the canonical registry)
`roster-ledger.md` (this directory) is the **single source of truth** for who exists: slug · persona · division · department head · mandate · status. **Chief of Staff keeps it current; people-talent-director reviews it at RECONCILE.** At STAFF, consult the ledger (or ask the relevant head) before staffing — never staff from memory of the roster.

## Growing the roster (generated specialists)
When the staffing ladder reaches **GENERATE** (no existing specialist fits a substantive task — see `commands/SDLC.md` STAFF), a new agent is authored via **Earl** (Sage's reactive mode) and becomes a **permanent roster member**:
- **Mandatory alliterative, gender-neutral persona** — *every* agent, including generated ones. The persona is also how a hot-injected agent identifies itself, so it never logs as `general-purpose`. (Personas may alliterate on the role/function word — e.g. **Q**uinn **Q**uality, **H**arper **HR**, **A**llie **A**ccessibility.)
- Full charter (Name & Persona · Mandate · Domain Expertise · Inputs/Outputs · Guardrails + escalation · Acceptance Criteria), passing people-talent-director's onboarding audit.
- Registered both here (persona table) **and** in `roster-ledger.md`, assigned to a division + head.
- Reviewed at mission end by people-talent-director (KEEP / REFINE / MERGE / RETIRE) and counted in the `LEARNINGS.md` gap-closure ledger.

## Ownership of memory (one writer per file — see `README.md` concurrency rule)
| File | Owner (sole writer) |
|---|---|
| mission.md | orchestrator |
| state/reporting.md | orchestrator (sole writer; user hand-edits read at INTAKE and folded — no worker writes it mid-cycle) |
| bus/tickets.md, bus/inbox/*, bus/channels/* | orchestrator (files/closes/routes) |
| bus/events.md | chief-of-staff (folds in reported events; orchestrator may append during SERVE) |
| state/task-graph.md, state/status-board.md | chief-of-staff |
| state/decisions-log.md, state/risk-register.md | risk-quality-officer |
| memory/index.md, ontology.md (core), standards.md | memory-architect |
| memory/ontology.md (domain-extension section) | ontology-engineer |
| memory/design-system.md | design-system-specialist + design-systems-engineer (never co-spawned in one writing batch) |
| state/design-needs.md | orchestrator (captured at PLAN) |
| state/design-personas.md | /SDLC-design orchestrator (Design Director) |
| state/gtm-evidence.md | /SDLC-gtm orchestrator (GTM Director) |
| memory/research/* | research bureau (one file per brief, named `<task-id>-<topic>.md`) |
| memory/facts/* | the authoring agent (named `<task-id>-<topic>.md`); memory-architect curates the index |
| bus/threads/* | orchestrator (request→reply→follow-ups) |
| artifacts/<task-id>/* | the assigned agent |

## Escalation
worker → risk-register → risk-quality-officer → orchestrator.
