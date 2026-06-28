# Scout Cadences — keeping the knowledge libraries fresh

> Routine doc for the two recurring "scouts" that stop the corporation's knowledge from going stale. Each scout is a **draft-only** refresh agent: it researches and writes its own collision-proof file; the **library owner merges** that into the shared index during a serial step (per the concurrency rule in `.agency/README.md`). **Agents do not self-schedule** — the user wires the cadence via `/schedule` (see "How to wire it").

Two scouts, one per library:

| Scout | Refreshes | Owner who merges | Cadence | Event trigger |
|-------|-----------|------------------|---------|---------------|
| **innovation-scout** | `memory/sota/` | the SOTA-library owner (academic-researcher / memory-architect) | **Monthly** | when a tracked frontier-moving event nears (major model/framework release, benchmark refresh) |
| **trend-scout** | `memory/intel/` | the intel-library owner (business-strategist) | **Bi-weekly** | when a tracked forced-demand date nears (e.g. EU AI Act **2 Aug 2026**) |

---

## innovation-scout → refreshes `memory/sota/`

Re-runs the **T-301-style SOTA scan** across the five tracks: AI/agentic, low-level/HPC, algorithms & data structures, databases, applied math/physics-in-CS.

- **Reads:** `memory/sota/index.md` (the current 20-technique snapshot, its labels and sources), `memory/standards.md` (what's already encoded as a default), and the meta-principles at the top of the SOTA index. Cite `sota/index.md` as the baseline being refreshed.
- **Researches:** fresh primary sources (arXiv, vendor eng blogs, conference proceedings) for each track — new techniques, and re-verification of the fast-moving rankings/metrics the snapshot explicitly flags as time-sensitive.
- **Writes (draft, collision-proof):** `memory/research/<task-id>-sota-refresh.md` containing:
  - **New techniques** to append — same table shape as the index (Technique · What it is · When to apply · Class · Source), with URLs.
  - **Supersession flags** — existing rows to mark `[STALE]` (technique displaced, metric stale, tool ranking moved), each with the superseding source. Never delete; mark `[STALE]` and let the owner decide (hygiene rule, `memory/index.md`).
  - **No-change tracks** — explicitly note which of the five tracks had no material change this cycle (so the owner knows it was actually scanned).
- **Owner merges:** the SOTA-library owner folds the draft into `sota/index.md` during a serial step — appends new rows, applies `[STALE]` marks, bumps the technique count and the footer date. The scout never edits the shared index itself.

## trend-scout → refreshes `memory/intel/`

Re-runs the **T-302-style cross-sector trend scan** across the sectors in the intel library: Healthcare/Biotech, Education, Business/Fintech/SaaS, Climate/Energy/Hard-Tech, Entertainment/Media, and the cross-cutting AI-Regulation/Privacy track.

- **Reads:** `memory/intel/index.md` (headline thesis, per-sector trend→gap→buildable-X cards, the forced-demand events table, and the HARD/EST/THIN evidence legend). Cite `intel/index.md` as the baseline being refreshed.
- **Researches:** fresh funding/market signals and regulatory movement per sector; re-checks whether the headline thesis still holds and whether any tracked forced-demand date has passed or shifted.
- **Writes (draft, collision-proof):** `memory/research/<task-id>-intel-refresh.md` containing:
  - **Per-sector card updates** — new/changed trend→gap→buildable-X rows, each tagged `HARD` / `EST` / `THIN` per the existing legend (do not upgrade evidence quality without a stronger source).
  - **Forced-demand events** — add newly-dated buying triggers; mark passed dates and update their status; flag any date moving inside the event-trigger window (see cadence below).
  - **Thesis check** — one line confirming the "applied/vertical AI on rented models" headline still holds, or flagging drift with evidence.
- **Owner merges:** the intel-library owner (business-strategist) folds the draft into `intel/index.md` during a serial step — updates sector tables, the forced-demand table, and the footer refresh note. The scout never edits the shared index itself.

---

## Cadence rationale

- **SOTA = monthly.** Technique frontier moves fast but not daily; a month is enough to catch a meaningful model/kernel/DB advance without churning the library. The index itself warns to re-verify fast-moving rankings *at decision time* regardless — the monthly scan keeps the snapshot honest.
- **Trends = bi-weekly.** Funding rounds, regulatory milestones, and market signals shift faster and are more decision-relevant for direction calls, so a tighter loop.
- **Event-triggered (overrides the calendar).** When a tracked date enters its **lead window**, run that scout *now* regardless of the regular cadence:
  - **trend-scout** — fire when a forced-demand date is **≤ 30 days** out (e.g. **EU AI Act fully applicable 2 Aug 2026**; CPT-2026 rolling unlocks). Demand spikes ahead of the deadline, so the library must be current *before* it lands, not after.
  - **innovation-scout** — fire on a pre-announced frontier event (major foundation-model or framework release, a benchmark refresh) that could supersede a SOTA row.

---

## How to wire it (via `/schedule`)

Scouts are **drafted by agents but scheduled/executed by the user** — agents cannot self-schedule. To put a scout on a cadence:

1. The user runs **`/schedule`** and registers the recurrence:
   - `innovation-scout` → **monthly** (e.g. 1st of each month).
   - `trend-scout` → **bi-weekly** (e.g. every other Monday).
2. Add **event-triggered one-offs** for tracked dates — e.g. schedule a `trend-scout` run for **~1 Jul 2026** to refresh ahead of the **2 Aug 2026** EU AI Act deadline. Re-add a one-off each time a new dated event lands in the intel library's forced-demand table.
3. Each scheduled run spawns the scout, which writes its `memory/research/<task-id>-*-refresh.md` draft and reports it. The library owner merges the draft into the relevant `index.md` on the next serial pass.

Keep the tracked-date one-offs in sync with the **forced-demand events** table in `intel/index.md` — when a date passes, drop its one-off; when a new one is added, schedule its lead-window run.

---

_Companion to `sota/index.md` (T-301) and `intel/index.md` (T-302). Refresh this doc if the scout set, cadences, or the `/schedule` wiring change._
