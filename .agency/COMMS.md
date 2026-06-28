# COMMS — the Agency communication protocol

How agents talk when none of them stay alive. There is no live channel between agents (the platform forbids it); all communication is **asynchronous, file-based, and routed by the CEO** (the main session). This file is the nervous system: it defines the message format, the message types, the channels and tickets they travel on, and the exact routing rules the CEO follows.

Mental model: it's an **operating system**. The CEO is the kernel/scheduler — the only process that can `fork()` (spawn). Agents are short-lived processes that read shared memory, do work, write output, and exit. Messages are async IPC (queues, mailboxes, an event journal) — never live pipes. On top of that we run two familiar apps: **Linear** (tickets/board for the work) and **Slack** (channels/threads for the talk).

---

## 1. The message envelope (one canonical format)

Every message — wherever it's written — uses this block:

```
- id: MSG-014                # unique — see the id rules below
  ts: 2026-06-02T10:04:00Z   # ISO-8601 UTC
  from: backend-engineer     # an agent name (or "orchestrator")
  to: research-lead          # an agent name, a #channel, or "broadcast"
  type: request              # see §2
  priority: high             # low | med | high | critical
  refs: [T-012, REQ-003]     # task/ticket/risk ids this relates to
  thread: TKT-012            # the ticket/thread this belongs to (optional)
  body: "Need current CVE status for lodash@4.17.20 before I finalize T-012."
  status: open               # open | done  (for request/escalation)
```

Keep `body` to a line or two; link to detail in `artifacts/` rather than pasting it.

**Id rules.** Ids written by the CEO (`MSG-`, `TKT-`, and *filed* `REQ-`) are global and monotonic — the CEO is the single writer, so it can keep a sequence. **Workers never self-assign global ids** (two parallel workers would both pick `REQ-007`). Instead, a worker emits **task-scoped ids**: `REQ-<task-id>-<n>` (e.g. `REQ-T-012-1`, `REQ-T-012-2`) — collision-proof by construction, since no two parallel workers share a task id. The CEO MAY renumber a task-scoped id into the global sequence when filing the ticket, keeping the original id in `refs` so the trail stays joined.

## 2. Message types (the verbs)

- **request** — "I need something I can't produce" (data, a decision, another division's output). Goes on the ticket queue; the CEO fulfills it. The async substitute for calling another agent.
- **reply** — the answer to a request; delivered to the requester's inbox and the thread.
- **handoff** — "my part is done; the next role should take it from here" (e.g. backend-engineer → testing-reviewer). Carries the context the next agent needs.
- **escalation** — "a blocker/risk that needs authority." Routes up the hierarchy (→ risk-quality-officer → CEO) and always also creates a `risk-register.md` entry.
- **broadcast** — org-wide notice (a new standard, a decision, an incident declared). Posted to a channel; read by every agent spawned afterward.
- **status** — progress update; moves a card on the board and logs an event.

## 3. Where messages live

**Linear (the work) —** `bus/tickets.md` *(written only by the CEO)*
A ticket is a unit of work-or-ask with: `id (TKT-/REQ-)`, `title`, `type`, `assignee` (a role), `status` (backlog/doing/blocked/done), `priority`, `parent` (the T- task), and a link to its thread. This is the board view of all open requests and handoffs. Agents don't edit it — they emit envelopes in their reports and the CEO files/updates the tickets (single writer, no collisions).

**Slack (the talk) —** `bus/channels/` and `bus/threads/`
- `bus/channels/general.md` — broadcasts, standards, decisions everyone should see.
- `bus/channels/research.md` — research asks and briefs.
- `bus/channels/incidents.md` — incident declaration and live timeline.
- `bus/channels/releases.md` — deploys, gates, version cuts.
- `bus/threads/<ticket-id>.md` — the conversation attached to one ticket (request → reply → follow-ups), named by the ticket's id (e.g. `threads/REQ-003.md`, `threads/TKT-012.md`), so context stays together. Written by the CEO.

**Mailboxes —** `bus/inbox/<agent>.md`
Directed delivery. When the CEO has an answer for a role, it drops the message here **keyed by the requesting task's id** (a `## for T-012` section) — two parallel instances of the same role then can't consume each other's mail. The next time that role is spawned, it reads the section for its task first. Once a message is **consumed** (the addressee's report shows it acted on it), the CEO **moves** the entry to the ticket's thread at SERVE — inboxes stay short; threads keep the history. An inbox is a queue, not an archive.

**Journal —** `bus/events.md`
Append-only audit log of everything that happened. The source of truth for reconstructing history.

`@mention` is just an addressing hint inside a message (`to: @security-reviewer` or `to: #incidents`) telling the CEO where to route/deliver it.

## 4. The CEO's routing & scheduling rules (the kernel)

Between every spawn batch, the CEO drains the queues and applies these rules:

1. **Scan & file** — read this cycle's reports plus `bus/tickets.md` (open requests/handoffs), `escalations`, and channel posts since the last cycle; file each worker-emitted envelope (task-scoped `REQ-<task-id>-<n>`, see §1) as a ticket, optionally renumbering it into the global sequence with the original id in `refs`.
2. **Schedule by priority:** `critical > high > med > low`. Escalations and gate-blocking items **preempt** feature work. A `blocked` ticket can't be scheduled until its blocker (a risk) is cleared.
3. **Route by type:**
   - `request` → spawn the `to` role (or `research-lead` for research), hand it the message + thread; capture its `reply` to the requester's inbox + thread; mark the ticket `done`.
   - `handoff` → schedule the named next role with the payload.
   - `escalation` → ensure a `risk-register.md` entry exists; route to `risk-quality-officer`, then surface to the CEO for a decision; bump priority.
   - `broadcast` → post to the channel; it becomes required reading for later spawns (the CEO includes it in their brief).
   - `status` → update the board; no spawn needed.
4. **Deliver & log:** write replies to inboxes, update the board, append to `events.md`.
5. **Hygiene (every SERVE):** any ticket `status:open` for **≥2 cycles** is **re-triaged** — escalate it (file a risk with an owner), reassign it, or close it with a recorded reason. A ticket is never silently ignored; "still open, no owner, no reason" is a protocol violation. In the same pass, move consumed inbox entries to their ticket's thread (§3) so inboxes stay short and threads keep the history.
6. **Repeat** until the queue is drained for this cycle, then move to the next batch.

The CEO never lets a message vanish: every request is either fulfilled, converted to a ticket with an owner, or escalated as a risk.

## 5. An agent's comms duties (every agent, every run)

On startup: read `mission.md`, `status-board.md`, your `bus/inbox/<you>.md` (the `## for <your-task-id>` section), and the relevant channel(s). Before finishing: put any `request`/`handoff`/`escalation`/`status` as an envelope **in your structured report** (request ids task-scoped: `REQ-<task-id>-<n>`), write the report itself to your own `artifacts/<task-id>/report.md` (the canonical on-disk copy the serial owners merge from), and write any answer/brief to your own `artifacts/`/`memory/research/` file. You do **not** edit `bus/tickets.md`, other inboxes, threads, or `events.md` — the CEO and management apply your report to those shared files during the serial steps (this is what stops parallel agents from overwriting each other). This is the whole contract — see `.agency/README.md`.

## 6. Worked example (a request flowing end to end)

```
Cycle 1 — backend-engineer (spawned for T-012) can't verify a dependency:
  emits in its REPORT a request envelope (task-scoped id — collision-proof
  even if ten workers ran in this batch):
    - REQ-T-012-1 | from:backend-engineer | to:research-lead | type:request
      priority:high | parent:T-012 | status:open
      "Is lodash@4.17.20 affected by any current critical CVE?"
  blocks/yields T-012 and exits. (It writes no shared files.)

Between cycles — the CEO (SERVE):
  files the request into bus/tickets.md as REQ-003 (global sequence;
  refs: [T-012, REQ-T-012-1]) + opens bus/threads/REQ-003.md,
  sees it's high → spawns research-lead for it.

Cycle 2 — research-lead:
  checks current advisories, writes the brief to its own memory/research/REQ-003-lodash-cve.md,
  returns the answer + brief path in its REPORT.
  The CEO writes the reply to bus/inbox/backend-engineer.md under "## for T-012"
  + bus/threads/REQ-003.md, closes REQ-003, and appends the event.

Cycle 3 — the CEO re-schedules backend-engineer for T-012:
  it reads the "## for T-012" section of its inbox, sees the answer, finishes T-012,
  hands off (in its report) to testing-reviewer. At the next SERVE the CEO moves
  the consumed inbox entry into bus/threads/REQ-003.md — the inbox stays short,
  the thread keeps the history.
```

No two agents were ever alive together, and no two ever wrote the same file; they still "had a conversation" — through tickets, a thread, and a mailbox, with the CEO as the sole postman. That's the Agency's whole communication model.
