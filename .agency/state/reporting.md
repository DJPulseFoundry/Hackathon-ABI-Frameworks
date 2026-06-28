# reporting.md — the reporting-rules config (the engine gate)

> **What this file is.** The single, user-facing config that tells the agency
> HOW and WHERE to report project status. It controls the Custom Project Status
> Dashboard: where it is delivered, in what format, how often it regenerates, and
> who it reports to. It is the **gate** that the engine reads before any work
> begins — see "The INTAKE gate" below.
>
> **It is user-editable.** You (the CEO) may hand-edit the fields below directly,
> OR ask the agency in plain language ("report at phase boundaries", "switch to
> Interlude", "publish to ./status.html") and the orchestrator will fold the
> change in for you. Either way, your edits are read at INTAKE and honored.
>
> **It is learnable.** This file accrues your reporting preferences over time.
> When you express a durable preference, the orchestrator records it here so the
> agency defaults to it on the next run (see "How this learns" at the bottom).
>
> **Single writer = orchestrator.** Per the Agency single-writer rule, the
> **orchestrator is the sole writer of this file.** No worker agent edits it
> mid-cycle. User hand-edits are READ at INTAKE and folded by the orchestrator —
> they are not a second writer racing the orchestrator; they are input the
> orchestrator reconciles at the serial INTAKE/RECONCILE steps. This keeps the
> gate race-free while still letting you edit it whenever you like.

---

## Config (active instance)

```yaml
# -------------------------------------------------------------------------
# Default instance for a fresh install. This satisfies the gate's SHAPE
# (standalone, every-update, local-file default). On the first real run the
# orchestrator CONFIRMS delivery_location with you (or applies the local
# default below) before staffing any task — see "The INTAKE gate".
# -------------------------------------------------------------------------

delivery_location: ".agency/artifacts/status-dashboard/dashboard.html"
  # REQUIRED. Where the dashboard is written/published. The engine gate BLOCKS
  # until this is set. DEFAULT = a local file path — NO server, even on the
  # same machine. Hosted/published delivery is a documented future expansion.
  # Confirmed-at-first-run: the orchestrator will confirm or replace this value
  # with you at INTAKE; the default above is a working placeholder.

format: standalone
  # "standalone" (default) | "interlude"
  #   standalone  = a freestanding standalone webpage (Option A). Full-page,
  #                 host-design-system styling, no form-factor constraints.
  #   interlude   = a contained light-card tool (Option B), auto-added to its
  #                 own Interlude playlist. Paper #FAFAF8 card, contained width
  #                 ~320-760px (<=~640px), no page/nav chrome, vertically
  #                 scrollable, reduced-motion guard. Interlude informs ONLY the
  #                 form factor — the visual language stays the host project's.

cadence: every meaningful update
  # "every meaningful update" (default) | "phase boundaries"
  #   every meaningful update = regenerate at every RECONCILE that changed the
  #                             arc, the active phase, the done/doing/next lists,
  #                             or the risk set.
  #   phase boundaries        = regenerate only when the active phase changes
  #                             (one arc item completes and the next begins).

owner: "CEO (orchestrator / main session)"
  # The CEO/contact this dashboard reports to. Shown in the dashboard footer
  # (zone5_footer.owner). Default = the user/CEO running the agency.

# --- optional ---

mid_flight_deliverables: false
  # OPTIONAL. For long projects: whether interim artifacts ship at phase
  # boundaries (not just at final delivery). Introduced in onboarding Step C.5.
  # false (default) = deliver at project end; true = ship interim artifacts as
  # each phase completes.
```

---

## The INTAKE gate (rule)

> **Gate rule:** Before any work begins (at STAFF), `delivery_location` MUST be
> set in this file. If `delivery_location` is empty or unset, the orchestrator
> establishes it — by asking the user, or by applying the local-file default —
> **before staffing any task.** No task is staffed against an unset delivery
> location.

This gate is self-documenting so the orchestrator command wiring (INTAKE, §0)
can point directly at it. The command does not need to restate the rule — it
reads this file, checks `delivery_location`, and applies the rule above:

- `delivery_location` **set** → gate open; proceed to STAFF.
- `delivery_location` **empty/unset** → gate closed; orchestrator confirms a
  value with the user, or applies the local-file default
  (`.agency/artifacts/status-dashboard/dashboard.html`), writes it here, THEN
  proceeds. (Orchestrator is the sole writer — see header.)

The gate checks **presence and shape**, not network reachability: a local file
path that does not yet exist is valid (the dashboard is created there on first
regeneration). `format` and `cadence` always have working defaults, so only
`delivery_location` can block the gate.

---

## The regeneration contract (when / where / which format)

This file defines **WHEN**, **WHERE**, and **in which FORMAT** the dashboard
regenerates. It does **NOT** define HOW the dashboard is populated — the
field-by-field source mapping is owned by
`artifacts/status-dashboard/dashboard.data.md` (its "AUTO-POPULATION MAPPING"
block is the single source of truth for HOW). Do not restate that mapping here.

| Axis | Governed by | Value |
|---|---|---|
| **WHEN** it regenerates | `cadence` | every meaningful update \| phase boundaries |
| **WHERE** it is written | `delivery_location` | a local file path |
| **In which FORMAT** | `format` | standalone \| interlude |
| **HOW** it is populated | `dashboard.data.md` (auto-population map) | *(not defined here — link)* |

**RECONCILE rule (§5):** at each RECONCILE, the orchestrator (1) regenerates
`dashboard.data.md` mechanically from the blackboard per its auto-population map,
then (2) renders it through the `format` wrapper and writes the result to
`delivery_location` — **but only when `cadence` says to**:

- `cadence: every meaningful update` → render+write whenever this RECONCILE
  changed the arc, active phase, done/doing/next lists, or risks.
- `cadence: phase boundaries` → render+write only when the active phase changed
  this RECONCILE; otherwise the regenerated data is recorded but not re-rendered.

If `format: interlude`, the rendered file is also auto-added to its Interlude
playlist (a local HTML file; no server).

---

## How this learns

This file accrues durable reporting preferences so the agency defaults to what
the CEO wants without being re-asked each run. When you express a lasting
preference (not a one-off), the orchestrator records it here. Examples of
preferences this file can accrue over time:

- "CEO prefers **phase-boundary** cadence" → set `cadence: phase boundaries`.
- "**Always include the risk section**" → recorded as a preference note (the
  dashboard already renders zone4 risks; this pins it as non-optional).
- "**Interlude on this machine**" → set `format: interlude` as the standing
  default for this environment.
- "Report to **<name>**, not just 'CEO'" → set `owner` accordingly.
- "This is a long project — **ship interim deliverables**" → set
  `mid_flight_deliverables: true`.

Preferences are written ONLY by the orchestrator (single-writer rule). A
one-off instruction ("just this once, skip the dashboard") is honored for the
run but NOT written here; only durable preferences are persisted.

<!--
============================================================================
  CONTRACT SUMMARY (for command wiring — T-007/T-009)
============================================================================
  - INTAKE (section 0) gate: delivery_location MUST be set before STAFF. If
    empty, orchestrator confirms with user OR applies the local-file default,
    writes it here, then proceeds. Gate checks presence+shape, not reachability.
  - RECONCILE (section 5): regenerate dashboard.data.md per its auto-population
    map, then render via format to delivery_location — gated by cadence
    (every meaningful update | phase boundaries).
  - HOW-to-populate lives in dashboard.data.md, NOT here. This file = when /
    where / which format only.
  - Single writer = orchestrator. User hand-edits read at INTAKE and folded;
    no worker writes this file mid-cycle.
============================================================================
-->
