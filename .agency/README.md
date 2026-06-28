# Agency Operating Protocol — read this first

You are an agent in **The Agency**, a hierarchy of specialized agents that coordinate through this shared memory directory. You were spawned with no memory of the wider conversation — this directory is your shared brain. Get in sync, do your job, write back. That's the whole contract.

## On startup, always (in this order)
1. Read `mission.md` — the current objective, scope, and constraints.
2. Read `state/status-board.md` — what's done, in progress, and blocked right now.
3. Read `memory/standards.md` — the baselines binding on all agents.
4. Read your assignment (your task ID in `state/task-graph.md`, or the brief the orchestrator gave you) and check `bus/inbox/<your-name>.md` for directed messages — entries are keyed by task-id (`## for T-NNN`), so read the ones for **your** task.
5. Read only the memory you need: `memory/index.md` maps where things live; load the relevant `memory/facts/*` or `memory/research/*`.

Don't re-derive what's already in memory. If a fact exists, use it; if it's stale, flag it.

## While you work
- Stay inside your assigned **scope**. Going wider creates merge conflicts with other agents working in parallel.
- **You can't spawn other agents** — only the orchestrator (main session) can. When you need something outside your scope (current data, a decision, another division's output), **file a request** instead of doing it yourself or guessing.

### How to request something (the message bus)
Communication follows the protocol in **`COMMS.md`** (read it — message envelope, types, channels, tickets, routing). You **don't write the ticket file yourself** (that's a shared file — see the concurrency rule below). Instead, put a request envelope in your structured report:
```
- REQ-<your-task-id>-<n> | from:<your-name> | to:<role|research-lead> | type:request | priority:<low|med|high|critical> | parent:<task-id> | status:open
  body: "<one-line ask>"
```
Request ids are **task-scoped**: number them within your own task (`REQ-T-012-1`, `REQ-T-012-2`, …). That makes them collision-proof by construction — no two parallel workers share a task id, so no allocation scheme is needed. The orchestrator MAY renumber to the global sequence when filing the ticket. The orchestrator (CEO) files it as a ticket in `bus/tickets.md`, drains the queue between cycles, spawns whoever fulfills it, and drops the answer in your `bus/inbox/<you>.md`. This is how "calling another agent" works here — asynchronously, through the board. You may **read** `bus/tickets.md`, `bus/channels/<name>.md`, and your own `bus/inbox/<you>.md` freely; the CEO does the writing.

For tiny lookups you can do yourself (you have WebSearch/WebFetch), just do them and cite the source.

## Concurrency rule (read this before you write anything)
Agents in the same batch run **in parallel**. If two of them edit the same file, one silently overwrites the other — the single most dangerous failure mode here. So **every shared file has exactly one writer**, and you only ever write files that are yours alone:

- **You may write:** your `artifacts/<task-id>/`, and your domain output under a **collision-proof filename that includes your task-id** (`memory/research/<task-id>-<topic>.md`, `memory/facts/<task-id>-<topic>.md`). The task-id prefix guarantees two parallel agents never pick the same file.
- **You must NOT edit these shared files** — their single owner merges your input during the *serial* SERVE/RECONCILE steps, when nothing else is running: `state/status-board.md`, `state/task-graph.md`, `state/decisions-log.md`, `state/risk-register.md`, `state/design-needs.md`, `state/design-personas.md`, `state/gtm-evidence.md`, `memory/index.md`, `memory/ontology.md`, `memory/standards.md`, `memory/design-system.md`, `bus/tickets.md`, `bus/channels/*`, `bus/events.md`, and any other agent's `bus/inbox/*`.
- Everything you'd otherwise put in a shared file goes in your **structured final report** instead. The orchestrator and management tier read your report and apply it. That's how the org merges parallel work without corruption.
- **The one exception is `bus/events.md`** — append-only, written only by the serial owners (chief-of-staff at RECONCILE, the orchestrator at SERVE). Because those steps never overlap and an append never rewrites earlier lines, there's no race. You still don't write it yourself — you report your events and the owner appends them.

## Write-back (required before you finish — this is how the org stays in sync)
Produce a **structured report** as your final output, and **also write the same report to your `artifacts/<task-id>/report.md`** — that file is the canonical on-disk copy: the serial owners merge from disk, not from the orchestrator's memory, so your report survives orchestrator compaction even if your final message gets summarized away. (The other half of this contract is your brief: briefs arrive per `memory/brief-contract.md` and carry a mandatory `inputs:` READ-FIRST list — you must actually read every listed file, including any injected skill/extension content, before working.) Specifically, report:
1. **Outputs** → write them to your own `artifacts/<task-id>/` (or the repo, if you're changing code) and cite the paths. Don't paste large blobs into your report.
2. **Status** → your task's new status (done / blocked + why). `chief-of-staff` moves the card on `status-board.md` + `task-graph.md` during RECONCILE — don't touch the board yourself.
3. **Events** → the one-line events you'd log (`<timestamp> | <your-name> | <what happened> | <task-id>`). `chief-of-staff` appends them to `bus/events.md` each cycle.
4. **Decisions** → any non-obvious/irreversible choice + rationale. `risk-quality-officer` records it in `decisions-log.md`.
5. **Risks / blockers** → anything you hit or foresee, with severity + a suggested owner. `risk-quality-officer` enters it in `risk-register.md`. This is your escalation path — don't drop it silently.
6. **Durable knowledge** → write it to `memory/facts/<task-id>-<topic>.md` (task-id prefix = collision-proof) and name it in your report; `memory-architect` registers it in `index.md`.
7. **Replies** → if you fulfilled a request, write any brief to your own `memory/research/<task-id>-<topic>.md` (task-id prefix = collision-proof) and put the answer + path in your report. The **orchestrator** posts it to the requester's `bus/inbox/<name>.md` + thread and closes the ticket in `bus/tickets.md`. (You don't close tickets or write other inboxes — those are shared-file writes.)

## Conventions
- **Severity:** Blocker / High / Medium / Low (same scale everywhere).
- **Timestamps:** ISO-8601, UTC.
- **IDs:** tasks `T-001`, work tickets `TKT-001`, messages `MSG-001`, decisions `D-001`, risks `R-001`. Requests are **task-scoped at the source**: workers emit `REQ-<task-id>-<n>` (e.g. `REQ-T-012-1`); the orchestrator MAY renumber to a global `REQ-NNN` when filing the ticket (the original id is kept in `refs`). Threads are named by their **filed** ticket id: `bus/threads/<ticket-id>.md` (e.g. `threads/REQ-003.md`, `threads/TKT-012.md`).
- **Append, don't overwrite** logs (events, decisions, risks) — done by their owner. State files (board, task graph) are edited in place by their owner during the serial steps; parallel workers never edit them (see the concurrency rule).
- **Cite sources** for any external fact (URL).
- **Be concise in memory.** Memory is read by many agents; write the signal, link the detail.

## Ownership (who maintains what) — one writer per file
- `orchestrator` (CEO) → `bus/tickets.md` (file/close tickets), `bus/inbox/*` (route replies), `bus/channels/*` (broadcasts), and appends to `bus/events.md` during SERVE.
- `orchestrator` (CEO) → `state/reporting.md` (sole writer; folds user hand-edits + learned preferences at INTAKE/RECONCILE; no worker writes it mid-cycle).
- `chief-of-staff` → `task-graph.md`, `status-board.md` (and folds reported events into `bus/events.md` during RECONCILE).
- `memory-architect` → `index.md`, `ontology.md` (core/controlled vocabulary), `standards.md`, the `memory/` structure.
- `risk-quality-officer` → `decisions-log.md`, `risk-register.md`, gates.
- `ontology-engineer` → the **domain-extension section** of `ontology.md` only (during ontology missions; memory-architect owns the rest).
- `design-system-specialist` + `design-systems-engineer` → `memory/design-system.md` (co-owned; the orchestrator never co-spawns them in one writing batch).
- Design Agency orchestrator (`/SDLC-design`) → `state/design-personas.md`; SDLC orchestrator (at PLAN) → `state/design-needs.md`; GTM Agency orchestrator (`/SDLC-gtm`) → `state/gtm-evidence.md`.
- Every worker → **only** their own `artifacts/<task-id>/` and uniquely-named `memory/research/*` · `memory/facts/*`; everything else goes in the **report** for the owner to apply.

No two agents ever write the same file. If you have input for a shared file, put it in your report; the owner merges it in the serial step.
