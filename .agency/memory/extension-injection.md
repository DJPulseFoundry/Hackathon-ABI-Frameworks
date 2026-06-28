# Extension injection — getting mid-mission installs into agents that can't see them

> The orchestrator's protocol for extensions installed *after* session start. Referenced from `/SDLC` (Augment preflight step 5 "Activate" and STAFF). It lives on disk for the same reason COMMS.md does: a protocol that exists only in the orchestrator's context can be summarized away; a file can be re-read.

Two platform facts drive everything here:
1. **Spawned agents get a fresh context** — their charter + your brief, nothing else. A capability the main session gained five minutes ago is invisible to a worker unless the brief carries it.
2. **Loader timing differs by type.** Markdown extensions are just files — readable the moment they land on disk. MCP servers and plugins are processes/bundles bound at session start — no text in a brief can make their tools exist this session.

## The type matrix (the design boundary)

| Extension type | On-disk form | Main session sees it mid-session? | Spawned agent can get it? | Mechanism |
|---|---|---|---|---|
| **skill** | `.claude/skills/<x>/SKILL.md` | **Yes** — live change detection, no reload | **Yes** | inject-by-brief: pointer in `inputs:`; inline only if small |
| **command** | markdown prompt | Yes (skills path) | **Yes** | inject-by-brief — a command is just a prompt |
| **agent** | markdown charter | New `.claude/agents/*.md` is **not** in this session's Task roster | **Yes, as content** | spawn `general-purpose` with the charter body inlined as the prompt |
| **hook** | settings.json entry → executes code | No (settings snapshot) | **No** | not context — it's runtime behavior; fires from next session |
| **MCP** | server process + config | No (binds at session start; `/mcp` to connect) | **No as live tools** | inject the *fallback instruction* only; real tools next session |
| **plugin** | marketplace bundle | No (`/reload-plugins` is user-run) | **No** | same — degrade to CLI/file equivalents this session |

> Note: changes under project `.claude/skills/` take effect in the **main session** without restart (live change detection, per current Claude Code docs). This protocol exists to bridge the **subagent** gap — and the MCP/plugin gap below.

## Hot-injectable types (skill / command / agent): inject-by-brief

**Pointer-injection first.** Don't paraphrase or inline whole files into briefs — paths are cheaper, never go stale, and survive your own compaction. The worker reads the file fresh from disk (it has Read/Glob; no tool change needed). The brief's mandatory `inputs:` list (see `memory/brief-contract.md`) names the file as **binding**:

```
inputs:
  - "READ FIRST (binding): .claude/skills/frontend-design/SKILL.md — apply it as binding guidance for this task"
```

**Inline only small ones** (≲100 lines) where the content is load-bearing enough to carry verbatim — quote it, labelled with its source path so it stays auditable.

**Newly-installed agent types:** a new `.claude/agents/<x>.md` can't be spawned by type (the Task roster was fixed at session start), but the charter is hot-usable as content — Read the file and spawn **`general-purpose`** with the charter body inlined as the prompt, plus the normal brief.

**Stable pairings** (known at design time, not mission time): prefer the native `skills:` subagent-frontmatter preload — full skill content injected at the subagent's startup — over per-brief plumbing (e.g. frontend-engineer ↔ frontend-design). Inject-by-brief remains the right tool for *mission-time* installs, where editing agent files mid-run is off the table. Caveat: skills with `disable-model-invocation: true` cannot be preloaded.

## Not injectable (MCP / plugins / hooks): the degradation rule

You cannot inject a process. For anything installed mid-mission that binds at session start:

1. **Brief the fallback, not the tool** — e.g. *"use `gh` via Bash this session; github-mcp activates after restart."* Never let a brief imply a tool exists before it binds.
2. **Record the pending activation in `mission.md`** — which extension, what activates it (restart / `/reload-plugins` / `/mcp` auth), and what's degraded meanwhile.
3. **Re-check at the next cycle's STAFF** whether the user reloaded/restarted; until confirmed, keep briefing the fallback. Never silently assume the tool arrived.

Hooks are runtime behavior, not context — there is no fallback to inject; they simply start enforcing next session (note that in `mission.md` too if the mission counts on them).
