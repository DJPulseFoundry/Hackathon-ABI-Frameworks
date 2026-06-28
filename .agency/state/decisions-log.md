# Decisions Log (ADRs)

> Owned by risk-quality-officer. Append-only. Records non-obvious or irreversible choices so they aren't relitigated.

### D-000 — Adopt the Agency blackboard model
- **Date:** <timestamp>
- **Decision:** Agents coordinate through `.agency/` shared memory + message bus; the main session is the sole spawner.
- **Why:** Claude Code subagents can't nest-spawn; shared memory is more robust, persistent, and auditable.
- **Status:** accepted

<!-- Template:
### D-00X — <title>
- **Date:**
- **Decision:**
- **Why / alternatives considered:**
- **Status:** proposed | accepted | superseded
-->

## Promotion — when a mission decision should outlive the mission

Mission ADRs live here, scoped to this mission. But some decisions are *durable* — a strategy, an
architecture call, a rule of how the project works, a policy — and should outlive any one mission.
**Promote** those up to the project tier so they become canonical, retrievable, and never re-asked:

- Promote to `docs/decisions/D-NNN-<slug>.md` (via `/lock-decision`), reusing the **same ADR shape**
  used here — title, Date, Decision, Why / alternatives, Status, Supersedes/Superseded-by. One format
  across both tiers; don't reshape it.
- Leave a **back-link** here: append `→ promoted to docs/decisions/D-NNN` to the mission ADR, so the
  trail from mission to durable record is intact.
- **risk-quality-officer owns the promote step.** It decides which mission decisions are durable and
  carries them up to `docs/decisions/`, supersede-not-delete.
