# T5 — Beast Frontend & Dataviz Research (design-researcher)
_Persisted by CEO; subagent write was harness-blocked._

## Headline
Win the demo with TWO things: (1) an **animated "Pipeline Run" view** showing 300 patients flowing API → fetch/retry → extract → SQLite → routing, with live per-stage counters and 429-retry drama — the literal "data-flow visual" the user demanded and the rare differentiator; (2) **explainability theater** — click-to-drill patient view that **highlights extracted fields inside the original note text**.

## Recommended stack (pinned)
```
React 19 + Vite                      → static SPA, zero-runtime, can't crash live
Tailwind v4 + shadcn/ui              → owned premium components, React 19-ready
TanStack Table v8                    → headless triage grid, ~15KB, full design control
Recharts v3 (+ Tremor KPI cards)     → donut, funnel, Sankey, bars
@xyflow/react 12.10.2 (React Flow)   → animated pipeline node-edge graph (differentiator)
Framer Motion                        → count-ups, stagger, slide-overs, packet flow
Aceternity UI (sparingly)            → 2–3 hero flourishes
Data: SQLite → static JSON export    → app reads JSON; FastAPI read endpoint = optional bonus
Aesthetic: dark command-center hero + high-contrast legible triage table
```

## Stack decision
| Option | Beast | Demo-reliability | Build speed | Verdict |
|---|---|---|---|---|
| **React 19 + Vite + Tailwind v4 + shadcn + Recharts + React Flow** | ★★★★★ | ★★★★☆ (static build) | ★★★☆☆ | **PRIMARY** |
| Next.js 16 + shadcn | ★★★★★ | ★★★☆☆ (SSR to break) | ★★★☆☆ | Overkill for local demo |
| Streamlit | ★★☆☆☆ | ★★★☆☆ | ★★★★★ | Caps "wow" |
| Plotly Dash | ★★★☆☆ | ★★★☆☆ | ★★★☆☆ | Not "expensive"-looking |
| Single self-contained HTML | ★★★☆☆ | ★★★★★ | ★★★☆☆ | Keep as insurance |
`vite build` → static files, no server/SSR/websocket to die. Streamlit/Dash = internal prototypes per 3+ 2026 sources. Ship data as static JSON → runs with zero backend.

## Data-flow viz (the differentiator)
- **Pipeline Run (React Flow 12):** stage cards `PCC API → Fetch+Retry(429) → Format Sniffer → Extractor(SOAP/Prose/Multi-wound/Envive) → SQLite → Routing → {auto_accept/flag/reject}`. Packet dots flowing along edges, edge width ∝ volume, live counters (`fetched 1203 / retried 360 / extracted 287`), **429 retry flashing amber→green** (graded but rarely *shown*). Skip D3-force physics (recompute risk) — pre-positioned nodes + CSS/SVG edge animation = 80% wow, 20% risk.
- **Funnel + Sankey (Recharts):** Funnel `300 → eligible (active wound + MCB) → has measurements → auto_accept`. Sankey `Payer (MCB/MCA/MCD/HMO) → Eligibility → routing`, band width = patient count — canonical healthcare pathway viz; makes "only MCB eligible" visible at a glance.

## Biller triage UX
- **Grid = TanStack Table v8** (headless, MIT, ~15KB) not AG Grid (~330KB, best features paid). 300 rows → need design control, not scale. shadcn ships a TanStack Data Table block.
- **At-a-glance:** color **+ icon** for routing (never color alone): green/check=auto_accept, amber/triangle=flag, red/slash=reject. Confidence = radial gauge/segmented bar (maps to cross-source agreement). Plain-English reason column.
- **Explainability drill-down (trust moment):** row click → **original note text with extracted fields highlighted in place** (char-offset span highlighting of `"4.3 cm x 1.8 cm x 0.3 cm"`, no bounding boxes). Highlight *why* flagged (Envive `Stage: N/A`, multi-wound, `Diabetic diabetic` typo) — most persuasive thing a biller sees.
- **States:** skeleton shimmer rows, branded empty + error states.

## "Perception as reality" polish
- Pick ONE aesthetic: **dark command-center** hero (near-black, monospace numerics, single neon accent; refs Signal/Fortress 2026 templates, Bloomberg-terminal vocabulary) + high-contrast legible triage table.
- **Framer Motion**: count-up KPIs, row stagger, panel slide-overs, packet flow. 150–300ms durations (restraint reads expensive).
- Hero command-center landing (not login/raw table). Aceternity UI for 2–3 flourishes, sparingly.
- Typography: monospace for all numerics = "data-grade precision"; Inter/Geist for prose.

## Data access
**Static JSON export from SQLite** (★★★★★ reliability, ★ effort) — RECOMMENDED, no server, client-side filter via TanStack. Optional FastAPI read endpoint as bonus, never a live dependency. sql.js WASM = overkill (~1.5MB, main-thread blocking) for 300 rows.

## Four screens
1. **Command Center (landing):** count-up KPIs (`300 patients · 287 extracted · 62% MCB · N auto-accept · N flagged · N rejected`) + live React Flow pipeline graph + payer-mix→routing Sankey.
2. **Triage Table:** payer badge, wound summary (type·stage·L×W×D·drainage), confidence gauge, color+icon routing, plain-English reason; sticky header, instant search/filter/sort, skeleton load.
3. **Patient Detail (explainability theater):** slide-over — original note w/ highlighted extractions + format badge | structured fields + 3 eligibility checks (active wound ✓ · MCB active ✓ · measurements ✓) + cross-source agreement + decision/reason.
4. **Pipeline Flow (full):** every stage w/ fetched/retried/extracted/routed counts, 429 amber→green, 300→eligible→auto_accept funnel.

## Key sources (2026-06-28)
shadcn Tailwind v4 + Vite docs · Streamlit/Dash-vs-React (leandataengineer, reflex.dev) · React Flow 12 (xyflow.com, reactflow.dev animated-edges) · Dagster/Prefect/Airflow run UIs (zenml.io) · Sankey/funnel (astrato.io, domo.com) · Recharts v3 vs Tremor (pkgpulse) · TanStack vs AG Grid (simple-table, pkgpulse) · explainability highlight (explainx.ai, Microsoft content-understanding) · Aceternity UI · sql.js + FastAPI SQLite docs.
