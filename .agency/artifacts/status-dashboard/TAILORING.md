# Status Dashboard — Tailoring Process & Token Contract

> Owner: `design-system-specialist` (T-002). Read by `design-systems-engineer` (T-003, the
> scaffold), `frontend-engineer` (T-004 standalone / T-005 Interlude wrappers), and any future
> `/SDLC-design` run that re-skins the dashboard for a new host project.
>
> **What this is.** The Design Agency does NOT ship one fixed look for the status dashboard
> (mission Constraint #4). It ships a **project-agnostic scaffold** (T-003) plus **this process**
> for making that scaffold look native to whatever host project it lands in. The visual language is
> always the **host project's** own design system — never a token set unique to this skill, and
> never Interlude's tokens (Constraint #5).
>
> **The one rule that governs everything below:** reuse before invent. The scaffold reads the
> host's tokens; it does not define its own palette.

---

## 0. TL;DR for the next agent

- The scaffold (T-003) and both wrappers (T-004/T-005) consume the **`--dash-*` token contract**
  defined in §2. Those variable names are frozen — implement them exactly.
- A **tailoring run** (a `/SDLC-design` invocation re-skinning the dashboard) does ONE job: bind each
  `--dash-*` variable to a **host token** via `var(--host-token, <fallback>)`, in a single small
  `:root` override block. It does not touch the scaffold's markup or the wrappers.
- The fallbacks in §2 are a **neutral safety net** so the scaffold renders legibly before tailoring.
  They are NOT the design. A shipped, un-tailored dashboard (still on fallbacks) is incomplete.
- Interlude (Option B) changes the **form factor only** (contained light card) — it uses the SAME
  host tokens for color/type. Interlude's own tokens are never imported (§3).

---

## 1. The reuse workflow (what a tailoring run does, in order)

A tailoring run is the step where the dashboard is bound to a specific host project. It runs as a
`/SDLC-design` task and follows this sequence:

1. **Read the host design registry.** Open the host project's `memory/design-system.md`. Inventory
   its **Tokens** (color/type/space/radius/motion/elevation), **Components**, **Patterns**, and
   **Interaction conventions**. This is the source of truth for the host's visual language.

2. **Read the host's raw token source, if present.** If the project ships a `tokens.css` (or
   `tokens.json` / a documented design-decisions file), read it to recover the actual custom-property
   names the host already uses (e.g. `--accent`, `--paper`, `--ink`, `--sans`). These names become
   the right-hand side of each binding in §2. If `memory/design-system.md` cites a source file per
   token row (it should — provenance is mandatory), follow that citation.

3. **Map host tokens → the `--dash-*` contract.** For each variable in §2, find the closest existing
   host token and write the binding `--dash-x: var(--host-token, <fallback>)`. Map by **role**, not
   by name: the host's "primary brand color" → `--dash-accent`, its "page background" → `--dash-bg`,
   its "body text" → `--dash-fg`, and so on. Use the §4 worked example as the pattern.

4. **Reuse host Components / Patterns where they exist.** If the host design system already defines a
   card, a status pill/badge, a progress bar, a section header, or a "metric" block, the wrappers
   should compose those rather than re-style new ones. Note the reuse in your run report so it's
   traceable. Reuse beats a visually-close re-implementation every time.

5. **Only extend if there's a genuine gap.** If the dashboard needs a reusable element the host
   system truly lacks (not a one-off preference — a real, repeatable element), that's a **gap**.
   Do not silently invent it. Either (a) file it for `design-systems-engineer` to spec into the host
   `memory/design-system.md`, or (b) if you build it in the run, **capture it back** with provenance
   per §5. Reuse-before-invent means a new entry is the exception that must justify itself.

6. **Honor the host's interaction conventions as a hard gate.** The dashboard inherits the host
   registry's behavior rules. In this engine those are non-negotiable (see Constraints, bottom):
   reduced-motion guard (hard gate), compositor-only motion, directional easing. A tailoring run
   never overrides these.

**Output of a tailoring run:** a small `:root` binding block (the §2 contract bound to host tokens),
a reuse note (which host Components/Patterns were reused), and — only if something new was built — a
capture-back entry per §5. Nothing else in the scaffold or wrappers changes.

---

## 2. The token contract (the heart of this doc)

These are the CSS custom properties the **scaffold (T-003)** defines and the **wrappers (T-004/T-005)**
consume. The names are **frozen** — T-003 MUST declare exactly these, and the wrappers MUST reference
only these (never a raw host token, never a hardcoded value). This single indirection layer is what
lets one scaffold serve every host: re-skinning is just re-binding the right-hand side.

**How a binding works.** The scaffold declares each `--dash-*` with a neutral fallback. A tailoring
run overrides `:root` to point each at a host token, keeping the fallback as the second `var()`
argument:

```css
/* scaffold default (T-003) — neutral, legible, NOT the design */
:root {
  --dash-accent: #3B5BDB;            /* fallback only */
}

/* tailoring run output — bind to the host's real token */
:root {
  --dash-accent: var(--host-accent, #3B5BDB);
}
```

If the host token is absent at runtime, the fallback keeps the dashboard legible. The fallback is a
floor, not the target.

### 2a. Color

| Variable | Role / what it's for | Binds to (host role) | Neutral fallback |
|---|---|---|---|
| `--dash-bg` | Page / canvas background behind the whole dashboard | host page/canvas background | `#FFFFFF` |
| `--dash-surface` | Card / panel background (zones sit on this) | host card/surface background | `#F7F7F5` |
| `--dash-fg` | Primary text (headings, body) | host primary ink / body text | `#1A1A1A` |
| `--dash-muted` | Secondary text (labels, metadata, footer) | host muted / secondary text | `#6B7280` |
| `--dash-accent` | Brand accent — active phase, progress fill, key emphasis | host primary brand/accent | `#3B5BDB` |
| `--dash-accent-soft` | Tint of accent — active-zone wash, selected background | host accent-tint (or derive) | `#E7ECFB` |
| `--dash-rule` | Hairline borders, dividers, card edges, axis lines | host rule/border color | `#E3E3E0` |
| `--dash-ok` | Status: done / on-track / healthy | host success color | `#3F7D54` |
| `--dash-warn` | Status: at-risk / attention / in-progress-with-concern | host warning color | `#B7791F` |
| `--dash-risk` | Status: blocked / off-track / failed | host danger/error color | `#B23B3B` |

> `--dash-accent-soft` is the only commonly-missing one: many host systems don't name an accent tint.
> If absent, a tailoring run may derive it (`color-mix(in srgb, var(--dash-accent) 14%, var(--dash-surface))`)
> rather than introduce a new opaque value — and should note the derivation, not register a new token.

### 2b. Type

| Variable | Role / what it's for | Binds to (host role) | Neutral fallback |
|---|---|---|---|
| `--dash-font-sans` | UI / body font (default for everything) | host sans / body font stack | `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` |
| `--dash-font-display` | Headings / zone titles / hero numbers (if host has a display face) | host display/serif font stack | `var(--dash-font-sans)` |
| `--dash-font-mono` | Timestamps, IDs, task codes (footer, the-arc labels) | host mono font stack | `ui-monospace, SFMono-Regular, Menlo, monospace` |
| `--dash-text-xs` | Metadata / footer / eyebrow size | host type-scale step | `0.75rem` |
| `--dash-text-sm` | Labels, secondary copy | host type-scale step | `0.875rem` |
| `--dash-text-base` | Body size | host type-scale step | `1rem` |
| `--dash-text-lg` | Zone titles | host type-scale step | `1.25rem` |
| `--dash-text-xl` | Project title / hero | host type-scale step | `1.75rem` |

> If the host has no separate display face, `--dash-font-display` falls back to the sans — the
> dashboard stays single-typeface and coherent, no invention needed.

### 2c. Space, radius, elevation

| Variable | Role / what it's for | Binds to (host role) | Neutral fallback |
|---|---|---|---|
| `--dash-space-1` | Tightest gap (inline, icon↔label) | host space scale step | `4px` |
| `--dash-space-2` | Inner padding small | host space scale step | `8px` |
| `--dash-space-3` | Default gap between elements | host space scale step | `12px` |
| `--dash-space-4` | Zone inner padding | host space scale step | `16px` |
| `--dash-space-5` | Gap between zones | host space scale step | `24px` |
| `--dash-space-6` | Outer page padding | host space scale step | `32px` |
| `--dash-radius` | Card / panel corner radius | host radius (default) | `10px` |
| `--dash-radius-sm` | Pills, badges, small chips | host radius (small) | `6px` |
| `--dash-elevation` | Card shadow (Option A may use; Option B card uses host's card shadow) | host card elevation / shadow | `0 1px 3px rgba(0,0,0,0.08)` |

### 2d. Motion (inherit, don't redefine)

The dashboard does **not** introduce motion tokens — it reuses the ones already in the host registry
(`motion.duration.micro`, `motion.duration.large`, `motion.ease.enter`, `motion.ease.exit`). The
scaffold should expose them as `--dash-motion-*` aliases bound to the host motion tokens so the
wrappers reference the contract, not raw host names:

| Variable | Binds to (host token) | Fallback |
|---|---|---|
| `--dash-motion-fast` | `motion.duration.micro` | `200ms` |
| `--dash-motion-slow` | `motion.duration.large` | `400ms` |
| `--dash-ease-enter` | `motion.ease.enter` | `cubic-bezier(0,0,0,1)` |
| `--dash-ease-exit` | `motion.ease.exit` | `cubic-bezier(0.3,0,1,1)` |

All motion still sits behind the reduced-motion guard and is compositor-only (transform/opacity)
per the host interaction conventions — these are hard gates, not preferences.

**Contract size: 10 color + 8 type + 9 space/radius/elevation + 4 motion = 31 variables.** Keep it
there. Adding a variable is a contract change that both T-003 and the wrappers must absorb — justify
it as a real gap before proposing one.

---

## 3. The Interlude form-factor note (Option B only)

When the user picks **Option B (Interlude)**, the dashboard is delivered as a local HTML file sized
for the Interlude desktop widget. **This changes the form factor, not the visual language:**

- **Same host tokens.** Color and type still come from the host project via the `--dash-*` contract.
  The Interlude wrapper does NOT import `~/Documents/Interlude/designs/assets/tokens.css` and does NOT
  use `--paper`, `--ink`, `--accent`, etc. Interlude's tokens are a different project's design system.
- **What Interlude DOES dictate (form factor only):**
  - A **contained light card** — responsive contained width ~320–760px, **~640px max**.
  - **No page/nav chrome** — no full-bleed header, no site nav; just the card.
  - **Vertically scrollable** content within the card.
  - **Light surface** — the card reads as a light "paper" card (this is why a host with a dark page
    background should still render the *card* on a light `--dash-surface`; the form factor expects a
    light contained card, while color accents/text still come from host tokens).
  - **Reduced-motion guard** present (already a hard gate everywhere).
  - Delivered as a **local HTML file** auto-added to its own playlist.

> Rule of thumb: Interlude answers "what shape and how big," the host design system answers "what
> color, type, and texture." If you find yourself reaching for an Interlude color token, stop — bind
> a `--dash-*` to the host instead.

Option A (standalone, the default) is a freestanding webpage with no width clamp and may use page
chrome; it consumes the identical `--dash-*` contract.

---

## 4. Worked example — binding the contract to an example host

To show the mapping concretely we use the **Interlude project's `tokens.css`** as an *example host*
(`~/Documents/Interlude/designs/assets/tokens.css`). **This is an example host only — not a
dependency.** We are demonstrating "given a host that defines accent + paper + ink + a sans + a
serif, here's how a tailoring run binds the contract." Any host with the same *roles* maps the same
way; the variable names on the right would differ per project.

The example host defines (among others): `--ink #0E1116`, `--mist #6B7280`, `--paper #FAFAF8`,
`--stone #F0EDE6`, `--rule #E5E2DA`, `--accent #B85C2C`, `--accent-soft #F4E4D6`, `--green #5B7553`,
`--amber #C68B2E`, `--red #A04545`, `--sans` (Inter), `--serif` (Fraunces), `--mono` (JetBrains Mono).

A tailoring run for this host emits this single `:root` block (the only thing it writes):

```css
/* Tailoring binding — EXAMPLE HOST (Interlude project tokens). Not a dependency. */
:root {
  /* color */
  --dash-bg:          var(--paper,  #FFFFFF);
  --dash-surface:     var(--stone,  #F7F7F5);   /* or --paper for a flatter card */
  --dash-fg:          var(--ink,    #1A1A1A);
  --dash-muted:       var(--mist,   #6B7280);
  --dash-accent:      var(--accent, #3B5BDB);
  --dash-accent-soft: var(--accent-soft, #E7ECFB);
  --dash-rule:        var(--rule,   #E3E3E0);
  --dash-ok:          var(--green,  #3F7D54);
  --dash-warn:        var(--amber,  #B7791F);
  --dash-risk:        var(--red,    #B23B3B);

  /* type */
  --dash-font-sans:    var(--sans,  -apple-system, system-ui, sans-serif);
  --dash-font-display: var(--serif, var(--dash-font-sans));
  --dash-font-mono:    var(--mono,  ui-monospace, Menlo, monospace);
  /* type scale: host has no numeric scale tokens → keep the contract fallbacks */

  /* space/radius: host has no named scale → keep fallbacks (a real gap to flag, see §5) */
  /* elevation: host has --shadow-card for light cards → bind it */
  --dash-elevation: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08));

  /* motion: host registry already defines the four motion tokens → alias them */
  --dash-motion-fast: var(--motion-duration-micro, 200ms);
  --dash-motion-slow: var(--motion-duration-large, 400ms);
  --dash-ease-enter:  var(--motion-ease-enter, cubic-bezier(0,0,0,1));
  --dash-ease-exit:   var(--motion-ease-exit,  cubic-bezier(0.3,0,1,1));
}
```

Reading of this example:
- **Color & type mapped cleanly** by role — the host's brand orange `--accent` becomes the
  dashboard accent; its `--paper`/`--ink`/`--mist` become bg/fg/muted; its three status colors map to
  ok/warn/risk; its sans+serif drive body+display.
- **`--shadow-card`** (the light-card shadow, not the dark `--shadow-widget`) is the right elevation
  to reuse — especially under Option B, where the form factor wants a light contained card.
- **Gaps surfaced:** the example host names no numeric **type-scale** steps and no **space scale**.
  The contract fallbacks carry those, and the run flags them as candidate additions to the host
  registry (§5) rather than inventing one-off pixel values inline.

This is the template every future host follows: map by role, bind with a fallback, flag genuine gaps.

---

## 5. Capture-back checklist (when a run invents something new)

Reuse is the default. But if a tailoring run builds a genuinely-new reusable element (because the
host system truly lacked it), it MUST be logged to the host `memory/design-system.md` with
provenance — never left as a one-off. A tailoring run reports the following for the serial owner of
`design-system.md` to fold in (the run does **not** write that file itself):

- [ ] **New Component?** → add a row to the **Components** table: name, the states it handles
      (default/hover/focus/disabled/loading/empty as applicable), anatomy notes, and **Source** = the
      real artifact file it was built in (e.g. `artifacts/status-dashboard/<wrapper>.html`).
- [ ] **New Pattern?** → add a row to the **Patterns** table: name, when-to-use, what it composes,
      Source. (The dashboard layout itself is a reusable pattern — see proposed additions below.)
- [ ] **New Token?** → only if a real, repeatable value is missing (e.g. the host had no space scale).
      Add to the **Tokens** table with tier + a real Source file. A binding-only fallback is NOT a new
      token — don't register fallbacks.
- [ ] **Capture log entry** → one line in the **Capture log**: what was added, which run/task-id,
      which artifact. No instance without a real source file.
- [ ] **Did NOT honor an interaction convention?** → not allowed. The reduced-motion guard,
      compositor-only motion, and directional easing are hard gates; a run that needs to deviate
      escalates rather than ships.

What does NOT get captured back: per-host binding blocks (§2/§4) and derived tints/fallbacks. Those
are project-local skin, not reusable design-system entries.

---

## Constraints honored (from `memory/design-system.md` interaction conventions + standards)

- **Reduced-motion guard — hard gate.** Every animation sits behind
  `@media (prefers-reduced-motion: no-preference)` (or is neutralized under `reduce`); resting state
  is fully usable with no motion. Non-negotiable across the scaffold and both wrappers.
- **Compositor-only motion.** Animate `transform`/`opacity` only — never width/height/top/left/margin.
- **Directional easing.** ease-out on enter, ease-in on exit; 100–300ms micro (≤400ms large).
- **Reuse before invent.** Host tokens are the visual language. No token set unique to this skill;
  Interlude tokens are never the visual language (Constraint #5). New reusable elements are captured
  back with provenance (Constraint: capture-back).

_Authored by design-system-specialist (T-002). Mirrored identically in `sdlc-cli/agency-template/`
and `.agency/`._
