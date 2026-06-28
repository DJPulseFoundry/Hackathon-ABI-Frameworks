# Design system (shared)

> Owned by **design-system-specialist** (curates) + **design-systems-engineer** (implements);
> read by every Design Agency run and by SDLC build agents. The reusable visual + interaction
> language as a registry: a new prototype is measured against it ("reuse before you invent"), and
> genuinely new reusable elements are captured back here. First-class in `ontology.md`.
>
> **Concurrency:** like `ontology.md`, this file has owners — the orchestrator must not spawn both
> `design-system-specialist` and `design-systems-engineer` in the same batch when both will write.

## Tokens
> `tier` ∈ {color, space, type, radius, motion, elevation}. Component *uses* Token — never hard-code
> a value a token already names.

| Name | Value | Tier | Source |
|---|---|---|---|
| motion.duration.micro | 200ms | motion | micro-animation-toolkit.md §2 (default; tune at first setup) |
| motion.duration.large | 400ms | motion | micro-animation-toolkit.md §2 (large/long moves only) |
| motion.ease.enter | cubic-bezier(0,0,0,1) | motion | micro-animation-toolkit.md §2 (decelerate) |
| motion.ease.exit | cubic-bezier(0.3,0,1,1) | motion | micro-animation-toolkit.md §2 (accelerate) |
| _(populate the rest from the project's tokens.css / design-decisions on first design run)_ | | | |

## Components
> List the **states** each must handle (default/hover/focus/disabled/loading/error/empty as
> applicable) so a prototype can't quietly skip one.

| Name | States | Anatomy / notes | Source |
|---|---|---|---|
| _(none yet)_ | | | |

## Patterns
> Reusable layout/flow recipes; note **when to use**.

| Name | When to use | Composes | Source |
|---|---|---|---|
| status-dashboard | CEO-facing project-status deliverable produced at kickoff and updated continuously; any agency populates it. | The 5 zones (overview / the-arc / you-are-here / progress detail+risks / footer) on the `--dash-*` token contract; one shared core (`dashboard.base.css`) inherited by both the standalone (Option A) and Interlude (Option B) wrappers. | artifacts/status-dashboard/TAILORING.md |
| token-contract (`--dash-*` indirection) | Any host-agnostic, re-skinnable component that must look native to whatever host project it lands in (reuse host tokens, never a skill-unique set). | A frozen `--dash-*` variable set declared `var(--host-x, <neutral-fallback>)`; a tailoring run binds the right-hand side to real host tokens in one `:root` block. Falls back to a neutral floor when unbound. | artifacts/status-dashboard/TAILORING.md §2 |

## Interaction conventions
> Reusable behavior rules a Feature is *governed by* (focus, motion, destructive-confirm, etc.).

| Name | Rule | Source |
|---|---|---|
| reduced-motion guard | Every animation sits behind `@media (prefers-reduced-motion: no-preference)` (or is neutralized under `reduce`); resting state is usable with no motion. **Hard gate.** | micro-animation-toolkit.md §3 |
| compositor-only motion | Animate `transform`/`opacity` only — never width/height/top/left/margin. | micro-animation-toolkit.md §2,§4 |
| directional easing | ease-out on enter, ease-in on exit; durations in the 100–300 ms band (≤400 ms for large moves). | micro-animation-toolkit.md §2 |

## Capture log (provenance mandatory)
> Each genuinely new reusable element a design run invents is recorded here as it's added — what,
> which run, which artifact. No instance without a real source file.

- 2026-06-08 | status-dashboard pattern + --dash-* token-contract convention introduced (T-002/T-003) | artifacts/status-dashboard/TAILORING.md
