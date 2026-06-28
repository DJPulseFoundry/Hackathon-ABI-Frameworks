# Team-native `/SDLC` — EXPERIMENTAL agent-teams mode

> **Status: EXPERIMENTAL, gated, opt-in.** This is an *alternative execution substrate* for the
> existing blackboard orchestration — not a replacement. When the gate below isn't satisfied, `/SDLC`
> runs the current spawn-per-cycle blackboard model **unchanged** (see "Gated fallback"). Nothing in
> this file changes default behaviour.

This describes how the CEO/orchestrator MAY run the Agency as an **Anthropic "agent team"** (an
experimental Claude Code capability) instead of as a sequence of one-shot spawn batches coordinated
through `.agency/`. The org chart, roles, gates, and single-writer discipline are **identical**; only
the *coordination mechanism between live agents* changes — from "report-and-merge through the CEO"
to teammates coordinating **directly** via a Mailbox and a shared task list.

---

## 1. When available (the gate)

Team mode is eligible **only** when **both** hold:

| Condition | Value |
|---|---|
| Environment flag | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| Claude Code version | **≥ v2.1.32** |

The orchestrator checks the flag and version at INTAKE. If either is missing → **fall back silently** to
the blackboard model (§4). Never assume team mode; never error on older setups.

When both hold, the orchestrator MAY elect to run as a **team lead**:

- **Teammates = our existing agent roles, reused as teammate types.** No new roster. `backend-engineer`,
  `testing-reviewer`, `security-reviewer`, `chief-of-staff`, `risk-quality-officer`, etc. become
  teammate *types* the lead spawns. Same scopes, same standards, same gate ownership.
- **The shared task list replaces in-batch dependency ping-pong.** Instead of the CEO ordering
  sub-batches topologically and re-spawning a consumer in a later cycle once its producer is `done`,
  teammates **claim** tasks from a shared, file-locked task list. Dependencies **auto-unblock**: when a
  prerequisite completes, dependent tasks become claimable without a CEO round-trip.
- **The Mailbox replaces report-and-merge round-trips.** Teammates exchange context directly via
  `SendMessage` (the Mailbox) instead of emitting request/handoff envelopes that the CEO files as
  tickets, routes, and replies to across cycles. A handoff that used to take three cycles
  (producer → SERVE/route → consumer) is a single direct message.
- **Gate hooks enforce the GATE natively.** Lifecycle hooks — `TaskCreated`, `TaskCompleted`,
  `TeammateIdle` — fire as work moves. The risk/quality GATE is wired as a **`TaskCompleted` hook**:
  a task can't be marked complete past an open Blocker, enforced by the hook rather than by the CEO
  remembering to re-check at the end of a cycle.

### The durable system-of-record does not change

**`.agency/` remains the durable system-of-record.** A team's shared task list, Mailbox, and idle
state are **ephemeral** — they live for the duration of the live team and **do not resume** across
sessions (no resumption). Therefore the lead still **lands durable state into `.agency/`**: mission,
task-graph/board, decisions, risks, events, memory facts/research. If the team session ends, the
blackboard is the source of truth you restart from. Team mode is a faster *runtime*; `.agency/` is the
*memory*.

---

## 2. Mapping (blackboard → team)

| Blackboard concept | Team-mode equivalent |
|---|---|
| CEO / orchestrator (sole spawner) | **Team lead** (sole spawner — see §3) |
| Agent roles (`backend-engineer`, reviewers, …) | **Teammate roles** (same roles, reused as teammate types) |
| `state/task-graph.md` (topo-scheduled by CEO) | **Shared task list** (file-locked claiming, dependency auto-unblock) |
| COMMS bus (tickets/inbox/threads, CEO-routed) | **Mailbox** (`SendMessage`, direct teammate-to-teammate) |
| Risk/quality GATE (CEO re-checks at GATE) | **`TaskCompleted` hook** (gate enforced natively on completion) |
| `.agency/` memory (facts, decisions, events, board) | **Durable record** (system-of-record; team state is ephemeral) |

---

## 3. Why our model already fits

Team mode maps onto the Agency almost one-to-one, because the two hardest constraints are ones we
*already* enforce:

- **"No nested teams" ⇒ the lead is the sole spawner — exactly our CEO rule.** Anthropic's agent
  teams forbid teammates from spawning their own sub-teams; only the lead spawns. That is *precisely*
  the Agency's invariant that "only the orchestrator can `fork()`" (`.agency/README.md`, `COMMS.md` §the
  kernel). We don't have to relax anything: our CEO == the team lead, our agents == leaf teammates, and
  no teammate spawns. The hierarchy is naturally one level deep already.
- **Single-writer discipline still applies to shared files.** The shared task list is file-locked
  (claim-by-lock), and `.agency/` shared files keep their single owner. Teammates coordinate *work*
  through the Mailbox, but they still **never co-write the same file** — the concurrency rule from the
  README is unchanged. The Mailbox replaces *routing*, not *write ownership*. So the team's "shared task
  list" is safe for the same reason our task-graph is: exactly one writer per write, enforced by lock.

In short: the things that usually make agent teams risky (uncontrolled spawning, write races) are the
two things the Agency was already built to prevent.

---

## 4. Gated fallback (the default)

If `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is **not** set, or Claude Code is **< v2.1.32**, the
orchestrator runs the **current spawn-per-cycle blackboard model, UNCHANGED**:

- Spawn-by-context batches, topological scheduling off `state/task-graph.md`, SERVE/RECONCILE serial
  steps, CEO-routed COMMS, gates re-checked at GATE.
- Nothing in the default path imports, requires, or is altered by this file. Older Claude Code installs
  and CI/Docker runs behave **identically** to before this mode existed.

Team mode is strictly **additive and opt-in**. The fallback is not a degraded mode — it is the
canonical, fully-supported model; team mode is the experiment layered on top.

---

## 5. Honest caveat + manual validation

**This is EXPERIMENTAL and cannot be hermetically Docker-tested.** Live team orchestration depends on
the experimental flag, the Claude Code version, the live Mailbox, and lifecycle hooks firing in a real
session — none of which the project's mock-based, hermetic Docker harness can exercise. **Do not** claim
team mode "passes" via the container suite; the harness validates the *blackboard* path only.

Validate team mode **manually, with the flag on**, and record the result as evidence:

1. **Preconditions** — confirm `claude --version` ≥ v2.1.32; export
   `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
2. **Launch** — run `/SDLC` on a small, throwaway mission in a scratch repo; confirm the orchestrator
   detects the flag/version and announces it is running as **team lead** (not spawn-per-cycle).
3. **Shared task list** — create a 2-task chain (producer → consumer); confirm the consumer **auto-
   unblocks and is claimed** when the producer completes, with **no** CEO re-spawn cycle in between.
4. **Mailbox** — confirm a teammate hands context to another via `SendMessage` directly (a handoff that
   would otherwise be a ticket+inbox round-trip).
5. **Gate hook** — confirm `TaskCreated` / `TaskCompleted` / `TeammateIdle` fire; force an open Blocker
   and confirm the **`TaskCompleted` hook refuses completion** (the GATE is enforced natively).
6. **No nested teams** — confirm a teammate **cannot** spawn its own team (only the lead spawns).
7. **Durability** — end the session; confirm the **ephemeral** team state is gone but `.agency/`
   (board, decisions, events, memory) still holds the durable record, and a fresh `/SDLC` resumes from
   the blackboard.
8. **Fallback** — unset the flag (or test on < v2.1.32); confirm `/SDLC` runs the unchanged blackboard
   model and the Docker harness still passes.

Record findings in `memory/facts/<task-id>-agent-teams-validation.md` and log a decision; until manually
validated on a given setup, treat team mode as **unverified** and prefer the fallback.
