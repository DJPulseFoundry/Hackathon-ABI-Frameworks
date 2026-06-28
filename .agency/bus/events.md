# Event Log (append-only audit trail)

> Append-only audit trail. Agents **report** their events; only the serial owners append here — `chief-of-staff` folds reported events in at RECONCILE, the orchestrator may append routing events at SERVE (those steps never overlap, so there's no race). Never edit past lines. This is how anyone reconstructs what happened.

Format: `<ISO-8601 UTC> | <agent> | <what happened> | <task-id>`

- <init-timestamp> | orchestrator | agency initialized | —

- 2026-06-28 — PREFLIGHT passed: clean tree on main, remote origin present, .agency scaffolded. Live API probed (300 patients, retry-aware). Grounding artifact written (artifacts/grounding/api-reality.md). Reporting=local HTML default. Spawning 6-agent research fleet (cycle 1).

- 2026-06-28 — DECISIONS LOCKED (user): (D1) Extraction = HYBRID (deterministic rules for clean measurements + Claude LLM for Envive/multi-wound prose, per-field confidence). (D2) Frontend = REACT command-center (Vite+Tailwind+shadcn + React Flow/D3 animated data-flow visuals; demo-reliability is a hard constraint). These steer SYNTHESIS + BUILD. Augmentation deferred to build phase.

- 2026-06-28 — CYCLE 1 RESEARCH COMPLETE. All 6 reports persisted by CEO (subagent file-writes were harness-blocked; CEO persisted each per brief/report contract). Architecture report self-wrote (Plan agent). SYNTHESIS done → artifacts/MASTER-BLUEPRINT.md.
- 2026-06-28 — KEY DECISIONS (for decisions-log): (a) glass-box selective-classification routing over black-box (Rudin; no gold labels to calibrate). (b) regex-first/LLM-layered hybrid extraction with verbatim-span guardrail. (c) SQLite STRICT + VIEW eligibility + partial indexes + FTS5, schema-managed via user_version up/down. (d) React static-SPA reading JSON snapshot (demo-safe). (e) cross-source corroboration (dx⟷note⟷assessment) is the confidence backbone, NOT LLM self-confidence.
- 2026-06-28 — RISKS (for risk-register): R1 no gold labels ⇒ no certified risk (mitigate: 60–100 stratified gold set + κ). R2 auto_accept 0.80 threshold placeholder (calibrate). R3 restore drill not run on full DB. R4 demo reliability (mitigate: precomputed snapshot + static JSON).
- 2026-06-28 — BLUEPRINT UPDATE: added §4b "Graph relations — the corroboration graph" (v_wound_corroboration SQL view + per-patient evidence-graph visual; agree=green/conflict=red). Scope: SQL view over SQLite, NO graph DB, NO full ontology layer (deferred). Closes the loop between cross-source agreement and overall_conf routing threshold.
