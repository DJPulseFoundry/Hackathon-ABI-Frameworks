# Task Graph (master DAG)

> Owned by chief-of-staff. The authoritative list of tasks, their dependencies, owners, and status.

| ID | Task | Owner (agent) | Depends on | Status | Notes |
|----|------|---------------|------------|--------|-------|
| T-001 | _example: scope the mission_ | chief-of-staff | — | done | seeds the graph |
| T-002 | _example: research current best practice_ | research-lead | T-001 | pending | |

Status values: `pending` · `in_progress` · `blocked` · `done`.

## Dependency notes
- Keep the graph acyclic. If A needs B's output, A depends on B.
- A task that's `blocked` must have a matching entry in `risk-register.md`.
