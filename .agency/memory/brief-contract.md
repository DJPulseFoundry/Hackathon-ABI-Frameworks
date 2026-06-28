# Brief & Report contract — the two envelopes every spawn lives by

> Referenced from `/SDLC` (STAFF, EXECUTE, RECONCILE). The **brief** is what an agent is told; the **report** is what it says back. Both are persisted to disk so neither depends on anyone's context surviving compaction.

## Why pointers over paraphrase
A hand-summarized brief is a copy of a copy — after auto-compaction the orchestrator paraphrases from a summary of a summary, and the handoff goes lossy exactly when it matters. So the rule is: **the orchestrator copies *paths*, not content**; the worker reads the files fresh from disk. Inline content only when it's small and load-bearing, always labelled with its source path.

## BRIEF — written by the orchestrator, persisted to `bus/briefs/<task-id>.md` BEFORE spawning

Every spawn prompt uses this template. The persisted copy is the audit trail of what each agent was actually told, and a re-spawned agent gets the identical brief — not a re-paraphrase.

```
# BRIEF <task-id>
task-id: T-0XX
objective: <one or two lines — what done looks like>
scope: <the exact files/paths this agent may write — bounded; nothing else>
inputs:                          # exact file paths to READ FIRST — pointers over paraphrase
  - .agency/mission.md
  - .agency/state/status-board.md
  - <producer artifact paths this task consumes>
  - <bus/inbox/<agent>.md entry for this task, if any — path + anchor>
  - "READ FIRST (binding): .claude/skills/<x>/SKILL.md"   # injected extensions ride here
outputs: <expected artifacts and where they land — artifacts/<task-id>/…>
constraints: <binding standards, fallbacks for not-yet-active tools (see memory/extension-injection.md), anything non-negotiable>
effort: <S | M | L — the budget; stop and report rather than overrun>
report-to: artifacts/<task-id>/report.md  (plus your structured final report)
```

**Mandatory fields:** `task-id` · `objective` · `scope` · `inputs` · `outputs` · `constraints` · `effort`. A brief missing any of them doesn't spawn. If augmentation installed extensions this mission, every relevant brief MUST carry them: file-types (skills/commands/agents) by path in `inputs:` (inline only if small); MCP/plugins by their fallback instruction in `constraints:` until the user reloads — full protocol in `memory/extension-injection.md`.

## REPORT — written by the worker, twice

Every worker returns the structured report as its final output **and also writes the identical copy to its own `artifacts/<task-id>/report.md`** before finishing. That disk copy is canonical: RECONCILE's management tier merges from `artifacts/*/report.md` on disk — not from the orchestrator's memory of the reports — so a compaction landing between EXECUTE and RECONCILE loses nothing.

```
# REPORT <task-id>
status: done | blocked — <why>
outputs:
  - <path> — <one line on what it is>
events:                          # chief-of-staff appends to bus/events.md
  - <ISO-8601 UTC> | <your-name> | <what happened> | <task-id>
decisions:                       # risk-quality-officer files in decisions-log.md
  - <non-obvious/irreversible choice> — <rationale>
risks:                           # risk-quality-officer files in risk-register.md
  - <Blocker|High|Medium|Low> | <risk/blocker> | suggested owner: <role>
requests:                        # envelopes per COMMS.md §1; orchestrator files them as tickets
  - REQ-<id> | from:<your-name> | to:<role> | type:request | priority:<low|med|high|critical> | parent:<task-id> | status:open
    body: "<one-line ask>"
facts:                           # memory-architect registers in index.md
  - memory/facts/<task-id>-<topic>.md — <one line>
```

Sections with nothing to say carry an explicit `none` — an empty section and a dropped section must be distinguishable to the mergers.

**Workers write no shared files.** Envelopes, status, events, decisions, and risks live *in the report*; the serial owners (orchestrator, chief-of-staff, risk-quality-officer, memory-architect) apply them to `bus/`, the board, the registers, and the index during SERVE/RECONCILE. Concurrency rule and ownership table: `.agency/README.md`.
