# Standards (binding on all agents)

> Owned by memory-architect; gate-enforced by risk-quality-officer. The baselines no division may violate without a recorded waiver.

## Engineering
- Changes do only what their task says; no silent scope creep.
- New logic ships with tests; the suite is green before "done."
- No scaffolding in shipping paths (debug logs, TODO/FIXME, dead code).
- Config is data, separate from artifacts; no hard-coded env values.

## Clean environment & current references (binding on every agency)
- An agency starts only from a **clean working tree on a current base**: `git fetch --prune` first, compare to the remote default branch, branch/stash any dirty WIP — never build on a dirty or stale `main`.
- Before work begins, load the **latest reference material** (plan/spec, designs, feature-sets, the standards the work touches) and flag anything stale — build on the source of truth, not a cached copy.
- Local validation runs in an **isolated container** via `/test-env`, not against the host — "it passes on my machine" is not evidence; a clean-container run is. testing-reviewer / cicd-reviewer use it for the quality gate.
- Git hygiene (clean tree, sane commits, branch discipline, no unasked history moves) is owned by **Garry Git** when installed.

## Security (see Quality division's references for depth)
- No secrets in code, config, logs, or client bundles; keys server-side.
- Input validated, output encoded; authz enforced server-side.
- Dependencies pinned and scanned; no known-critical CVEs shipping.
- OWASP Top 10 (2025) class issues are Blockers.

## Quality & evidence
- Claims are backed by evidence (file:line, test output, or a cited source).
- "Done" means demonstrably done, not "runs on my machine."
- External facts cite a current source; research is balanced (>1 source, tradeoffs noted).

## Design conformance (binding on Design Agency + UI build)
- **Reuse before you invent.** Measure every prototype against `design-system.md`; use existing Tokens/Components/Patterns/InteractionConventions unless explicitly told not to.
- **Capture back.** Any genuinely new reusable element a design run produces is registered in `design-system.md` with provenance — not left as a one-off.
- **Every UI Feature resolves its design before code (Gate 1):** a real locked DesignDocument or `none needed — <reason>`. For a UX surface, the **Intent Ledger** (GOAL ⟂ PLAN — the felt outcome vs the pixel/step spec serving it) is extracted before build and carried through as a READ-FIRST input (Gate 1.5). Parity is then verified **on the running app — ran, not asserted** (Gate 2, owned by `dana-design-direction`: serve → diff the running result on real data against the locked design + tokens, screenshot-paired; composing `design-reviewer` + `a11y-checker` (Allie Accessibility)). **No parity verdict without a pixel screenshot** — "matches the design HTML" ≠ "matches what the user sees."
- **Each design ask spins up 2–5 design agents with ≥1 net-new persona** (logged in `state/design-personas.md`) — a reused-only roster is a violation. `scripts/check-personas.sh` is the gate: it must pass before options are presented.

## Motion conformance (binding on Design Agency + UI build)
- **Reduced-motion guard is mandatory.** Every animation sits behind `@media (prefers-reduced-motion: no-preference)` (or is neutralized under `reduce`), and the resting state must be usable with no motion (WCAG 2.3.3). Shipping motion without this guard is a violation.
- **Compositor-only.** Animate `transform`/`opacity` only — never width/height/top/left/margin.
- **In-band timing + directional easing.** 100–300 ms for micro-interactions (≤400 ms for large moves), ease-out on enter / ease-in on exit. The full craft floor + recipes live in `memory/micro-animation-toolkit.md`; its §6 house-rules checklist is the self-check before any prototype with motion ships.

## Status reporting (binding on every agency)
- **One reporting path.** Every agency's project-status reporting goes through `state/reporting.md`
  (the gate: delivery_location/format/cadence/owner) + the shared status-dashboard template
  (`artifacts/status-dashboard/`). A delivery location must be set before work begins (INTAKE gate);
  the dashboard is regenerated per cadence at RECONCILE.
- **Reuse the host design system.** The dashboard is re-skinned via the host's `design-system.md`
  Tokens through the `--dash-*` token contract — never a skill-unique token set.

## GTM evidence (binding on GTM Agency)
- **No estimate from assumptions alone.** Any valuation/projection/demand/pricing claim must be pressure-tested against ≥1 non-zero real-world signal (ad / landing-page / user-test result) recorded in `state/gtm-evidence.md`, and must state the evidence it rests on.
- **Agents draft; the user executes.** GTM agents never auto-spend, auto-publish, or auto-post — they prepare the artifact; the user performs any irreversible external action.

## Autonomy safety
- **High-cost / irreversible autonomous decisions carry a calibrated confidence gate.** Where an agent acts on a model's classification or decision and a wrong action is costly, wrap the predictor in a conformal (or equivalently calibrated) confidence gate: **abstain and escalate** to a stronger model or a human when confidence falls below the calibrated threshold (prediction set empty or non-singleton), rather than acting on a low-confidence call. Choose the coverage level (α) from the cost of a wrong action. Spec: `memory/sota/conformal-gate.md`.

## Memory discipline
- Sync per `README.md` before finishing — report shared-file updates; only the owner writes them.
- Don't duplicate knowledge; link to the canonical entry in `index.md`.

## Release gates (canonical map — one reviewer per gate)
risk-quality-officer evaluates these at GATE; each Quality & Release reviewer owns exactly one.

| Gate | Owner (reviewer) | Question |
|------|------------------|----------|
| G1 | architecture-reviewer | Is the design sound under load and failure? |
| G2 | ux-reviewer | Does it work for a real user (every state, accessibility)? |
| G2.5 | dana-design-direction | Does the running UI match the locked design's GOAL on real pixels/data (ran-not-asserted parity, screenshot-paired)? |
| G3 | code-quality-reviewer | Is the change correct, maintainable, and loop-closed? |
| G4 | security-reviewer | Is it safe (OWASP, secrets, authz, supply chain)? |
| G5 | privacy-reviewer | Is personal data collected/stored/retained correctly? |
| G6 | testing-reviewer | Would the tests catch a regression? |
| G7 | cicd-reviewer | Is the commit-to-prod pipeline reproducible and gated? |
| G8 | sre-scalability-reviewer | Will it survive real load and dependency failure? |
| G9 | observability-reviewer | Will we know when it breaks and fix it fast? |
| G10 | docs-release-reviewer | Can someone who isn't the author operate and roll it back? |

> Extend per mission. Additions are decisions — log them in decisions-log.md.
