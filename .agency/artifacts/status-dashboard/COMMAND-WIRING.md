<!--
============================================================================
  COMMAND-WIRING.md — drop-in patch spec for the engine gate + RECONCILE rule
============================================================================
  WHAT THIS FILE IS
    The exact, paste-ready command copy that wires the Custom Project Status
    Dashboard into the orchestrator command files. This is a SPEC (T-007):
    T-009 applies it; no command file is edited by T-007.

  AUTHORITY / WHY IT'S SHORT
    The gate rule and the regeneration rule already live, fully self-
    documenting, in:
      - state/reporting.md          (WHEN / WHERE / WHICH FORMAT + the gate)
      - artifacts/status-dashboard/dashboard.data.md  (HOW it auto-populates)
    The command files must only INVOKE those — point at them, do not restate
    the field mapping or the rule text. Brevity is correct (Mission P2 +
    reporting.md "command does not need to restate the rule"). Each insertion
    below is 1–2 sentences, identical in intent across all three commands so
    the engine behaves the same in every agency.

  SEMANTICS (frozen by T-006 — build on, do not relitigate)
    - INTAKE gate: before STAFF, read reporting.md, check delivery_location.
      Set -> gate open. Empty/unset -> orchestrator confirms a value with the
      user OR applies the local-file default
      (.agency/artifacts/status-dashboard/dashboard.html), writes it to
      reporting.md (orchestrator = sole writer), then proceeds. No task is
      staffed against an unset delivery_location. Gate checks presence+shape,
      not reachability.
    - RECONCILE rule: (1) regenerate dashboard.data.md from the blackboard per
      ITS auto-population map; (2) render through the `format` wrapper
      (standalone|interlude) and write to delivery_location, gated by
      `cadence` (every-meaningful-update -> render when arc / active-phase /
      done-doing-next / risks changed; phase-boundaries -> render only when the
      active phase changed). If format=interlude, also auto-add the local HTML
      to its playlist.
============================================================================
-->

# Command wiring — gate + RECONCILE regeneration (drop-in patch spec)

Three command files run the same blackboard engine and must all report status
the same way. Each gets two small hooks:

1. an **INTAKE gate** hook (before any task is staffed), and
2. a **RECONCILE regeneration** hook (regenerate + render per cadence).

The copy **points at** `state/reporting.md` (the gate + when/where/format) and
`artifacts/status-dashboard/dashboard.data.md` (the how). It does not restate
either. Keep all three identical in intent.

---

## Patch 1 — `claude/commands/SDLC.md`

SDLC.md has explicit numbered steps `**0. INTAKE**` (gate point) and
`**5. RECONCILE**` (regeneration point).

### 1a — INTAKE gate

**Anchor (insert immediately AFTER this existing line):**

```
**0. INTAKE** — Write/refresh `.agency/mission.md`: objective, type, scope, blast radius, constraints, definition of done, likely divisions. Log the event.
```

**Insert this line:**

```

  **Reporting gate (before STAFF):** Read `.agency/state/reporting.md` and check `delivery_location`. If set, the gate is open. If empty/unset, confirm a value with the user or apply the local-file default (`.agency/artifacts/status-dashboard/dashboard.html`), write it back to `reporting.md` (you are its sole writer), then proceed. No task is staffed against an unset `delivery_location`. The gate checks presence + shape, not reachability — see `reporting.md` "The INTAKE gate" for the full rule.
```

### 1b — RECONCILE regeneration

**Anchor (insert immediately AFTER this existing line):**

```
**5. RECONCILE** — Spawn the management tier to merge this cycle's **reports** into the shared files (each is the sole writer of its own): `chief-of-staff` folds reported events into `bus/events.md` and updates graph/board, `risk-quality-officer` records reported decisions + risks and evaluates gates, `memory-architect` registers reported facts/briefs in the index and dedupes memory. Management runs serially here, so these writes never collide.
```

**Insert this line:**

```

  **Regenerate the status dashboard (this same serial step):** (1) regenerate `artifacts/status-dashboard/dashboard.data.md` from the blackboard per its own AUTO-POPULATION MAPPING; (2) render it through the `format` wrapper and write to `delivery_location`, gated by `cadence` — both read from `.agency/state/reporting.md`. `every meaningful update` -> render when the arc, active phase, done/doing/next, or risks changed this cycle; `phase boundaries` -> render only when the active phase changed. If `format: interlude`, also auto-add the local HTML to its Interlude playlist. You are the sole writer of `dashboard.data.md` and the rendered output — see `reporting.md` "The regeneration contract".
```

---

## Patch 2 — `claude/commands/SDLC-design.md`

The Design Agency has no separately numbered INTAKE step; its first cycle step
is `**1. FRAME**` (where it reads state and frames the ask) and its serial
write step is `**5. SERVE / RECONCILE**`. Wire the gate at FRAME and the
regeneration at SERVE/RECONCILE so this agency reports status identically.

### 2a — Reporting gate (at FRAME)

**Anchor (insert immediately AFTER this existing line):**

```
**1. FRAME** — Restate the design problem in one or two lines: the surface, the job it does for the
user, the constraints (existing tokens/components it should reuse, brand, platform), and what "good
options" would let the user decide between. Log it to `bus/events.md`.
```

**Insert this line:**

```

  **Reporting gate (before you STAFF explorers):** Read `.agency/state/reporting.md` and check `delivery_location`. If set, the gate is open. If empty/unset, confirm a value with the user or apply the local-file default (`.agency/artifacts/status-dashboard/dashboard.html`), write it back to `reporting.md` (you are its sole writer), then proceed. The gate checks presence + shape, not reachability — see `reporting.md` "The INTAKE gate".
```

### 2b — Dashboard regeneration (at SERVE / RECONCILE)

**Anchor (insert immediately AFTER this existing line):**

```
**5. SERVE / RECONCILE** — Route any request envelopes. You (serial writer) then:
```

**Insert this bullet as the FIRST item of the existing list (before the `- Append each new persona…` bullet):**

```
- **Regenerate the status dashboard:** rebuild `artifacts/status-dashboard/dashboard.data.md` from the blackboard per its AUTO-POPULATION MAPPING, then render it through the `format` wrapper and write to `delivery_location`, gated by `cadence` — all read from `.agency/state/reporting.md` (`every meaningful update` -> render on any arc/active-phase/done-doing-next/risk change; `phase boundaries` -> render only when the active phase changed; `interlude` -> also auto-add the local HTML to its playlist). You are the sole writer of `dashboard.data.md` and the rendered output.
```

---

## Patch 3 — `claude/commands/SDLC-gtm.md`

The GTM Agency mirrors design.md's shape: first cycle step is `**1. FRAME**`
and its serial write step is `**4. SERVE / RECONCILE**`. Wire the gate at FRAME
and the regeneration at SERVE/RECONCILE.

### 3a — Reporting gate (at FRAME)

**Anchor (insert immediately AFTER this existing line):**

```
**1. FRAME** — Restate the ask as a decision and name the cheapest real-world test that would inform
it. Log to `bus/events.md`.
```

**Insert this line:**

```

  **Reporting gate (before you STAFF):** Read `.agency/state/reporting.md` and check `delivery_location`. If set, the gate is open. If empty/unset, confirm a value with the user or apply the local-file default (`.agency/artifacts/status-dashboard/dashboard.html`), write it back to `reporting.md` (you are its sole writer), then proceed. The gate checks presence + shape, not reachability — see `reporting.md` "The INTAKE gate".
```

### 3b — Dashboard regeneration (at SERVE / RECONCILE)

**Anchor (insert immediately AFTER this existing line):**

```
**4. SERVE / RECONCILE** — Route requests. You (serial writer) record into `state/gtm-evidence.md`:
any **new signal** the user later reports back (ad clicks, sign-ups, test results) with provenance and
date — this is the ledger every future estimate must cite.
```

**Insert this line:**

```

  **Regenerate the status dashboard (this same serial step):** rebuild `artifacts/status-dashboard/dashboard.data.md` from the blackboard per its AUTO-POPULATION MAPPING, then render it through the `format` wrapper and write to `delivery_location`, gated by `cadence` — all read from `.agency/state/reporting.md` (`every meaningful update` -> render on any arc/active-phase/done-doing-next/risk change; `phase boundaries` -> render only when the active phase changed; `interlude` -> also auto-add the local HTML to its playlist). You are the sole writer of `dashboard.data.md` and the rendered output.
```

---

## Idempotency + kit/mirror application (for T-009)

**Apply each patch to EVERY copy of the command files that exists.** As of this
spec, command files live in TWO places (both confirmed present):

| Path | Role | Patch it? |
|---|---|---|
| `sdlc-cli/claude/commands/{SDLC,design,gtm}.md` | **kit source** (canonical) | YES |
| `~/.claude/commands/{SDLC,design,gtm}.md` | **installed global mirror** (this machine; `/SDLC` etc. run from here) | YES |

Checked and **NOT present** (do not create): `./.claude/commands/` (repo-local
override) — no command copies there. If T-009 finds a `./.claude/commands/`
copy at apply time, patch it too (same anchors).

> Note: the orchestrator preflight scaffolds `.agency/` from
> `$HOME/.claude/agency-template`, but the **command** files are NOT inside the
> agency-template — they live under `~/.claude/commands/`. So the kit↔mirror
> pair for THIS patch is `sdlc-cli/claude/commands/` (kit) and
> `~/.claude/commands/` (installed), not an `.agency/` copy. (This COMMAND-
> WIRING.md spec file itself is the artifact that gets the usual kit + `.agency/`
> mirror treatment.)

**Idempotency rules for T-009:**
- The anchor lines above are verbatim and currently UNIQUE in each file — match
  on the full anchor line, insert directly after it. The global mirror's anchors
  were verified identical to the kit (same INTAKE/RECONCILE/FRAME wording).
- **Insert-once:** before inserting, check the target file does not already
  contain the phrase `Reporting gate` / `Regenerate the status dashboard`.
  If present, the patch was already applied — skip (do not double-insert).
- Keep indentation as shown (two-space lead on the SDLC/SDLC-gtm sentences so they
  read as a sub-note of the numbered step; the design.md regeneration item is a
  top-level list bullet matching the existing list).
- After patching, the two copies of each file must be byte-identical in the
  patched regions — the engine must behave the same whether run from kit or
  installed mirror.

---

## Summary for T-009 (what to paste, where)

| Patch | File (kit) | Also patch (mirror) | Anchor (insert AFTER) | Block |
|---|---|---|---|---|
| 1a | `sdlc-cli/claude/commands/SDLC.md` | `~/.claude/commands/SDLC.md` | `**0. INTAKE**` line | gate sentence (§1a) |
| 1b | `sdlc-cli/claude/commands/SDLC.md` | `~/.claude/commands/SDLC.md` | `**5. RECONCILE**` line | regeneration sentence (§1b) |
| 2a | `sdlc-cli/claude/commands/SDLC-design.md` | `~/.claude/commands/SDLC-design.md` | `**1. FRAME**` block (…`Log it to bus/events.md.`) | gate sentence (§2a) |
| 2b | `sdlc-cli/claude/commands/SDLC-design.md` | `~/.claude/commands/SDLC-design.md` | `**5. SERVE / RECONCILE** … You (serial writer) then:` | first list bullet (§2b) |
| 3a | `sdlc-cli/claude/commands/SDLC-gtm.md` | `~/.claude/commands/SDLC-gtm.md` | `**1. FRAME**` block (…`Log to bus/events.md.`) | gate sentence (§3a) |
| 3b | `sdlc-cli/claude/commands/SDLC-gtm.md` | `~/.claude/commands/SDLC-gtm.md` | `**4. SERVE / RECONCILE** … every future estimate must cite.` | regeneration sentence (§3b) |
