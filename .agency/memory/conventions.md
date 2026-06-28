# Conventions ledger (the codebase's established "how we do it")

> Owned by memory-architect; refreshed at `/wrap` RECONCILE. The **structured reference
> every reviewer diffs new code against** — naming, return shapes, error handling,
> architectural patterns, and security posture, each captured as the *established*
> convention with a real `file:line` example.

## Why this file exists

A diff-scoped reviewer sees only the lines that changed — it cannot tell whether a new
function quietly contradicts a convention the rest of the codebase already settled. That
blind spot is how "vibe-coding" drift accumulates: a second helper that does what an
existing one already does, a handler that returns a bare object where every sibling
returns `{data, error}`, an `apiKey` where the rest of the tree says `api_key`, a JWT
parked in `localStorage` two months after the team standardized on httpOnly cookies. None
of these is wrong *in isolation* — each is wrong only *relative to the established
baseline*, and nothing held that baseline.

This ledger holds it. A reviewer that reads this file first reviews the change **against
the codebase's own conventions**, not just against absolute best-practice. With a
structured reference like this in front of the reviewer, drift-detection precision rises
sharply (≈5.6% → ~41% in the measured study, arXiv 2411.11410) — which is why this file
is the **dependency** the other drift checks rest on, not a nice-to-have.

## How it's bootstrapped & refreshed

- **Bootstrap (once, on first real review pass):** a reviewer or `/consistency-audit`
  worker walks the existing tree and records the *dominant* pattern in each section —
  not an aspiration, the convention the code actually follows today, with a real example.
  Where the codebase is genuinely split (two competing patterns, no winner), record
  **both** and mark it `⚠ unsettled` rather than inventing a winner — an unsettled row
  tells a reviewer "either is acceptable; flag a *third* variant," which is the honest signal.
- **Refresh (every `/wrap` RECONCILE):** when a change establishes, shifts, or retires a
  convention, update the row and bump its **last-confirmed** date. A row whose
  last-confirmed date is far stale is a prompt to re-verify, not gospel.
- **Keep it real.** Every row needs a `file:line` that currently exists — a convention
  with no live example is a guess; delete it or find the example. Reviewers verify the
  example still matches before treating the row as binding.

## Naming

| Domain | Established convention | Example (`file:line`) | Last confirmed |
|---|---|---|---|
| _e.g. variables_ | _camelCase_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. files/modules_ | _kebab-case_ | _`src/...`_ | _YYYY-MM-DD_ |
| _e.g. DB columns / API fields_ | _snake_case_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. types/classes_ | _PascalCase_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. booleans_ | _`is`/`has`/`should` prefix_ | _`src/...:NN`_ | _YYYY-MM-DD_ |

## Return shapes

| Function class | Established shape | Example (`file:line`) | Last confirmed |
|---|---|---|---|
| _e.g. service/data calls_ | _`{ data, error }` — never throw across the boundary_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. list endpoints_ | _`{ items, nextCursor }` (cursor, not offset)_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. validators_ | _`Result<T, ValidationError[]>`_ | _`src/...:NN`_ | _YYYY-MM-DD_ |

## Error handling

| Situation | Established convention | Example (`file:line`) | Last confirmed |
|---|---|---|---|
| _e.g. expected failure_ | _return typed error, don't throw_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. unexpected failure_ | _throw `AppError`, caught at boundary middleware_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. user-facing message_ | _generic message + logged correlation id; never raw error_ | _`src/...:NN`_ | _YYYY-MM-DD_ |

## Architectural patterns ("how we solve X")

| Problem | Established solution | Example (`file:line`) | Last confirmed |
|---|---|---|---|
| _e.g. data access_ | _repository layer; handlers never touch the ORM directly_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. cross-cutting auth_ | _one middleware at the boundary; no per-handler auth checks_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. config_ | _typed config module loaded once; no `process.env` reads in business code_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. async work_ | _job queue; no fire-and-forget promises in request path_ | _`src/...:NN`_ | _YYYY-MM-DD_ |

A new file that solves an already-listed problem in a **structurally different** way is an
architecture finding (G1) — even when the new approach is fine on its own — because two
ways to do one thing is the drift this ledger exists to catch.

## Auth / security posture (the baseline reviewers diff against)

| Surface | Established posture | Example (`file:line`) | Last confirmed |
|---|---|---|---|
| _e.g. session/token storage_ | _httpOnly+Secure cookie; never `localStorage`/`sessionStorage`_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. authz_ | _server-side, per-object check in the service layer_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. input validation_ | _schema-validated at the boundary (zod/pydantic) before use_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. outbound/egress_ | _allowlisted hosts; no user-controlled URLs to `fetch`_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _e.g. secrets_ | _env/secret-manager only; never in source, client bundle, or logs_ | _`src/...:NN`_ | _YYYY-MM-DD_ |

New code that **weakens** an established posture (introduces `localStorage` token storage
where the baseline is httpOnly cookies, adds a per-handler auth check where the baseline is
boundary middleware, `fetch`es a user-controlled URL where egress is allowlisted) is a
**baseline-drift** finding for the security reviewer (G4) — distinct from an absolute OWASP
hit. It may pass a context-free OWASP scan and still be drift, because it's measured against
*this codebase's* posture, not a generic checklist.

## Performance & memory patterns ("how we make it fast here")

This section records the *established* performance and memory conventions of this codebase —
which caching abstraction, which data structures on hot paths, which numeric representation,
and whether native extensions exist — each with a real `file:line`. It is the baseline a
performance audit (`/perf-audit`) and the reviewers diff a proposed optimization against, so
an optimization **extends** the pattern the repo already uses instead of inventing a second one.

| Concern | Established convention | Example (`file:line`) | Last confirmed |
|---|---|---|---|
| _caching / memoization_ | _bounded cache (e.g. `functools.lru_cache(maxsize=N)` / LRU) — never an unbounded dict that grows forever_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _hot-path numeric data_ | _contiguous array (e.g. numpy ndarray), not list-of-objects / pointer-chasing_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _membership / dedup_ | _`set`/hash lookup, not linear `in` over a list on a hot path_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _bounded buffers / pooling_ | _reuse a preallocated buffer; no alloc-in-loop / create-and-discard temporaries_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _DP / space-for-time_ | _roll the table to the last row/col where the full grid isn't needed (O(n·m)→O(min(n,m)))_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _numeric width_ | _default int is fine; fixed-width (e.g. uint64) only inside a tight numeric kernel where it's justified_ | _`src/...:NN`_ | _YYYY-MM-DD_ |
| _native extensions_ | _e.g. NONE yet — pure <language>; introducing one (C++/Rust via pybind11/Cython/PyO3) is a G1 + build/deploy decision, never a silent edit_ | _—_ | _YYYY-MM-DD_ |

An optimization that introduces a **second** caching abstraction, hot-path data-structure
pattern, numeric convention, or a **new language/runtime** where this table already names one
is a drift finding (perf reviewer + G1/G3) — even when the new approach is fine in isolation —
on the same principle as the architecture section: two ways to do one thing is the drift this
ledger exists to catch. The order of leverage is fixed: **algorithm/data-structure first →
in-language memory layout second → native extension last**, and a native kernel is only ever
proposed for a profiled, already-algorithmically-optimal bottleneck, measured *net of the FFI
boundary*. When an optimization legitimately establishes a new pattern, record it here at the
next `/wrap` RECONCILE so later changes conform to *it*.
