# Agent Roster Ledger — The Agency

The **canonical registry of the agent roster** — the single source of truth for who exists, what they do, the division they sit in, and their department head. When the org-chart and this ledger disagree, this ledger is authoritative for *roster membership*; the org-chart remains authoritative for the slug↔persona display table it owns.

**Owned by `chief-of-staff`** (Cass Chief-of-Staff — keeps it current). **Reviewed by `people-talent-director`** (Perry People) **at RECONCILE.**

Every agent carries an **alliterative, gender-neutral persona** (mandatory). The persona is also how a hot-injected agent identifies itself in the usage ledger, so it never logs as `general-purpose`. Generated specialists are **appended here at creation**; retired ones are **marked, not deleted**.

The **slug** is the load-bearing spawn identifier — never change it without updating every reference. The **persona** is a cosmetic display name.

Divisions are listed in canonical order. Sub-agencies (Design, GTM) are listed in their own subsections.

---

## Management — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| chief-of-staff | Cass Chief-of-Staff | Builds the mission task graph + reconciled status board (the PMO truth of "where are we"). | ✓ |
| memory-architect | Marlo Memory | Owns shared-memory structure, the core ontology/controlled vocabulary, and curated standards. | ✓ |
| risk-quality-officer | Quinn Quality | Owns the decisions log, risk register, and the GO/NO-GO gate verdicts (governance). | ✗ |
| people-talent-director | Perry People | CHRO for the agent workforce — performance reviews, charter-improvement proposals, roster gap analysis. | ✓ |

**Count: 4**

---

## Research bureau — Department Head: **research-lead (Reese Research)**

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| research-lead | Reese Research | Heads the bureau — triages, routes sub-questions, and synthesizes one cited, evidence-graded brief. | ✓ |
| web-researcher | Wren Web | Balanced cited briefs on general/current open-web questions — news, "latest on X", landscape scans. | ✓ |
| technical-researcher | Tory Technical | Version-pinned, primary-sourced technical briefs — docs, APIs, standards, CVE status. | ✓ |
| market-researcher | Mika Market | Grounded market-intelligence briefs — sizing, competitors, pricing, segment signals. | ✓ |
| academic-researcher | Avery Academic | Rigor-graded literature briefs — papers, benchmarks, methods, algorithm selection. | ✓ |

**Count: 5**

---

## Quality & Release — Department Head: **risk-quality-officer (Quinn Quality)**

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| architecture-reviewer | Arlo Architecture | G1 verdict — boundaries, coupling, data ownership, failure modes, scaling, ADR coverage. | ✓ |
| ux-reviewer | Uli UX | G2 verdict — all five UI states, WCAG 2.2 AA, human error messages, destructive-action safety. | ✓ |
| code-quality-reviewer | Charlie Code | G3 verdict — correctness, readability, maintainability + the loop-closure loose-ends sweep. | ✓ |
| security-reviewer | Sage Security | G4 verdict — threat model, OWASP Top 10, authn/authz, secrets, injection, supply chain. | ✓ |
| privacy-reviewer | Parker Privacy | G5 verdict — what PII is collected, where it lives, retention, consent, PII leakage. | ✓ |
| testing-reviewer | Tatum Testing | G6 verdict — whether the (real, run-green) suite would actually catch a regression. | ✓ |
| cicd-reviewer | Cameron CI/CD | G7 verdict — reproducible builds, blocking gates, artifact provenance, promotion, rollback. | ✓ |
| sre-scalability-reviewer | Skyler Scalability | G8 verdict — concurrency, capacity evidence, timeouts, retries, circuit breakers, restores. | ✓ |
| observability-reviewer | Oakley Observability | G9 verdict — logs, golden-signal metrics, tracing, SLO alerts, dashboards, runbooks. | ✓ |
| docs-release-reviewer | Dakota Docs | G10 verdict — can a non-author build/configure/deploy/roll back from the docs alone. | ✓ |
| a11y-checker | Allie Accessibility | Standing G2 a11y specialist — contrast math, hit-target, motion, keyboard/focus reachability. | ✓ |

**Count: 11**

---

## GitHub — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| repo-steward | Robin Repo | Repo-health audits + structural fixes — branch strategy, protection, CODEOWNERS, hygiene. | ✓ |
| pr-manager | Peyton PR | PR lifecycle — structure, reviewer routing by blast radius, merge verdict against hard gates. | ✓ |
| issue-triage | Izzy Issues | Triaged, deduped, prioritized backlog; issues→labels→tasks/PRs and T- task proposals. | ✓ |
| release-tagger | Riley Release | Release artifacts — SemVer bump with justification, annotated tag/release, grouped changelog. | ✓ |

**Count: 4**

---

## Production/SRE — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| deploy-operator | Drew Deploy | Safe production deploys — canary/blue-green/staged rollout with abort criteria + tested rollback. | ✓ |
| monitoring-watch | Monroe Monitoring | Production health verdicts — golden-signal baselines, SLO burn, alert health, anomaly detection. | ✓ |
| incident-commander | Ira Incident | Incident command — severity, mitigate-vs-rollback, timeline, comms, CEO spawn recommendations. | ✓ |
| recovery-engineer | Remy Recovery | Durable post-incident recovery — root cause, permanent fix + regression guard, postmortem. | ✓ |
| support-engineer | Sutton Support | User-facing self-serve — FAQ, troubleshooting KB, onboarding guide, known-issues page. | ✓ |

**Count: 5**

---

## Build — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| frontend-engineer | Frankie Frontend | User-facing code — UI components, client state, API integration with full UI-state + a11y coverage. | ✓ |
| backend-engineer | Bailey Backend | Server-side code — APIs, services, business logic, integrations, auth — secure + concurrency-correct. | ✓ |
| database-engineer | Dana Database | Data-layer changes — schemas with constraints, migration+rollback pairs, indexing, backup/restore. | ✓ |
| optimization-engineer | Ollie Optimization | Measured performance/cost wins — profiling-driven, smallest effective change, before/after evidence. | ✓ |

**Count: 4**

---

## Knowledge & Strategy — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| ontology-engineer | Onyx Ontology | Designs ontologies/controlled vocabularies — entity types, properties, relationships, taxonomies. | ✓ |
| knowledge-graph-engineer | Kai Knowledge | Builds/populates knowledge graphs — entity+relation extraction, dedup, mapped to the ontology. | ✓ |
| business-strategist | Blair Business | Turns research into strategy — value props, positioning, business cases, build-vs-buy/go-no-go. | ✓ |
| data-analyst | Darby Data | Descriptive analytics — metric trees/KPIs, dashboard specs with exact queries, experiment readouts. | ✓ |
| lifecycle-retention | Lior Lifecycle | Post-activation lifecycle — activation/aha, retention, expansion, advocacy, churn/win-back. | ✓ |

**Count: 5**

---

## Product — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| product-manager | Presley Product | The PRD — problem, target users, user stories + acceptance criteria, metrics, cut-lines, backlog. | ✓ |

**Count: 1**

---

## Business Office — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| finance-analyst | Finley Finance | FP&A artifacts — TCO/cost models, unit economics/runway, pricing sheets, build-vs-buy comparisons. | ✓ |
| legal-compliance-counsel | Lennox Legal | Legal/compliance drafts — OSS license audits, ToS/privacy drafts, GDPR/AI-Act/SOC 2 checklists. | ✓ |
| payments-ops | Pax Payments | Money mechanics — provider choice, checkout/refunds/disputes/dunning/tax; drafts, never moves money. | ✓ |
| people-ops | Harper HR | The HUMAN team — hiring/role docs, contractor classification, onboarding, access provisioning/offboarding. | ✗ |

**Count: 4**

---

## Design Agency (sub-agency) — Department Head: **design-lead (Dale Design-Lead)**

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| design-lead | Dale Design-Lead | Frames a design ask into distinct directions, sets the explorer roster, synthesizes a ★ option set. | ✓ |
| design-explorer | Ellis Explorer | Takes ONE assigned direction, returns a single self-contained HTML prototype (concepts only). | ✓ |
| design-researcher | Dara Design-Research | Research arm — how best-in-class/competitor products solve a surface; cited evidence, not designs. | ✓ |
| design-system-specialist | Sam System | Curates the shared design system — which existing tokens/components/patterns to reuse; spots gaps. | ✓ |
| design-systems-engineer | Sully Systems | Specs a genuinely new reusable element — token, component anatomy+states, pattern recipe. | ✓ |

**Count: 5**

---

## GTM Agency (sub-agency) — Department Head: **gtm-lead (Gale GTM)**

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| gtm-lead | Gale GTM | Frames a GTM ask as a decision + cheapest real test, sets roster, synthesizes evidence-tied options. | ✓ |
| gtm-strategist | Stevie Strategy | Positioning/pricing/demand — falsifiable hypotheses with pre-registered pass/fail, read honestly. | ✓ |
| gtm-builder | Bo Builder | Launch artifacts — landing page, per-channel posts, ad creative + ~$20 plan, feedback forms (drafts). | ✓ |
| user-testing-coordinator | Uri User-Testing | Lightweight tests that produce real signal — scripts, recruit criteria, pre-registered metrics. | ✓ |
| content-marketer | Casey Content | Long-form owned media — blog/launch posts, SEO briefs, editorial calendar, docs-as-marketing. | ✓ |
| sales-engineer | Sasha Sales | Pre-sales collateral — demo scripts, POC/pilot plans, one-pagers, RFP/security-questionnaire bank. | ✓ |

**Count: 6**

---

## Explanation Agency (sub-agency) — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| explainer-narrative | Nico Narrative | Story-driven written explainer — hook→intuition→decomposition→worked example→cited case study. | ✓ |
| explainer-visual | Val Visual | Multi-scene scrollytelling visual explainer (3Blue1Brown-in-the-browser), self-contained HTML. | ✓ |

**Count: 2**

---

## Blog Agency (sub-agency) — Department Head: **Chief of Staff (Cass)** (default router until a dedicated head is designated)

| Slug | Persona | Mandate (one line) | Alliterates? |
|---|---|---|---|
| blog-writer | Blaise Blog | One Medium-ready technical post in the user's voice per blog-voice.md; researched + cited; drafts only. | ✓ |

**Count: 1**

---

## Division counts

| Division | Count |
|---|---|
| Management | 4 |
| Research bureau | 5 |
| Quality & Release | 11 |
| GitHub | 4 |
| Production/SRE | 5 |
| Build | 4 |
| Knowledge & Strategy | 5 |
| Product | 1 |
| Business Office | 4 |
| Design Agency | 5 |
| GTM Agency | 6 |
| Explanation Agency | 2 |
| Blog Agency | 1 |
| **Grand total** | **57** |

---

## ALLITERATION AUDIT

The deliverable that lets us enforce "all agents alliterative." Every agent has a persona; no agent logs as `general-purpose`. Findings:

### 1. Personas that are NOT clearly alliterative (persona first-sound ≠ role first-sound)

| Slug | Persona | Role word | Why flagged | Suggested fix |
|---|---|---|---|---|
| risk-quality-officer | Quinn **Q**uality | **R**isk & **Q**uality Officer | Persona alliterates with "Quality," but the primary role word is **Risk** (R≠Q). Borderline — passes on the secondary role word. | Acceptable as-is (alliterates on "Quality"), or rename to a R-persona (e.g. "Reese" is taken — "Riggs Risk") if strict first-role-word alliteration is required. |
| people-ops | **H**arper **HR** | **P**eople-Ops Lead | Persona alliterates with "HR" (the function), NOT with the slug's role word "**P**eople-Ops." Distinct from people-talent-director (Perry People) on purpose. | Acceptable (alliterates on "HR"); the H/HR pairing is deliberate to disambiguate from Perry People. No change needed unless strict slug-word alliteration is enforced. |

Both above are **borderline-pass**: each persona alliterates with a *real word in its role/function title*, just not the first/slug word. No persona is fully non-alliterative.

### 2. Agents missing a persona entirely

**None.** All 57 agents declare a `You are **<Persona>**` persona in their body.

### 3. Slug ↔ persona mismatches between the agent file and org-chart.md

| Slug | Agent file persona | Org-chart persona | Status |
|---|---|---|---|
| a11y-checker | Allie Accessibility | *(absent from org-chart persona table)* | **MISMATCH (omission)** — a11y-checker is the 57th agent and is not listed in the org-chart's slug↔persona table (which still says "56 agents on disk"). Persona "Allie Accessibility" is alliterative (A/A) and gender-neutral, so it conforms; the org-chart simply needs to be updated to add the row and bump the count. |

All other 56 slugs match the org-chart persona table exactly (a11y-checker is the only delta).

### Verdict

- **Personas present:** 57/57 ✓
- **Gender-neutral:** 57/57 ✓ (all first names are gender-neutral)
- **Strictly alliterative (first sound of persona ≈ first sound of role word):** 55/57 clean; **2 borderline** (`risk-quality-officer` → Quinn Quality, alliterates on the secondary role word "Quality" not "Risk"; `people-ops` → Harper HR, alliterates on "HR" not "People-Ops"). Neither is a hard violation — both alliterate with a real role/function word — but both are worth a deliberate ruling if "first role word" alliteration is to be enforced strictly.
- **Slug↔persona drift:** 1 — org-chart omits `a11y-checker` (count stale at 56). Recommend adding `a11y-checker | Allie Accessibility` to the org-chart table and updating "56 agents on disk" → 57.
