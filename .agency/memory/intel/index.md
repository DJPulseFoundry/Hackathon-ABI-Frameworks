# Cross-Sector Intel Library — world-state for direction calls

> Curated by business-strategist. Read this when picking a product direction or making a build/buy/go-no-go call. It distills the cross-sector trend brief into "where could a small elite AI-dev team actually win." Source brief: `memory/research/T-302-cross-sector-trends.md` (market-researcher, 2026-06-06).
>
> **Evidence legend:** `HARD` = independently reported / official source · `EST` = vendor or analyst estimate, directional only · `THIN` = single-source or weak, verify before betting. Do **not** build financial models on EST/THIN numbers — see the caveat section at the bottom.

---

## Headline thesis — the biggest shift

**Capital has concentrated violently into a handful of frontier labs, so the application layer is the open ground.** In Q1 2026, AI took ~80% of global venture funding (~$242B of ~$300B), and three deals alone — OpenAI ($122B), Anthropic ($30B), xAI ($20B) — were 67% of *all* AI startup funding. [HARD]

The strategic implication for a small team:
1. **Frontier model capability is now a cheap, rented commodity** — don't train, rent.
2. **Money is NOT flowing to vertical/applied AI** — so that's where the least-funded competition and the most unmet demand sit.
3. **The arbitrage is "boring" applied/vertical AI on rented frontier models** — pick a regulated or workflow-embedded niche where reliability, compliance, and integration are the moat, not raw model quality.

Sources: Crunchbase Q1 2026 (https://news.crunchbase.com/venture/record-breaking-funding-ai-global-q1-2026/) · PitchBook Q1 2026 (https://pitchbook.com/news/articles/q1-2026-ai-funding-blows-past-2025-total-with-three-deals-accounting-for-67-of-capital) · KPMG Venture Pulse Q1'26 (https://kpmg.com/xx/en/media/press-releases/2026/04/global-vc-investment-surges-to-record-330-9-billion-dollar-in-q1-26.html)

---

## Sector intel tables

### Healthcare / Biotech
| Trend | Unmet gap / opportunity | A small AI-dev team could build X | Evidence | Source |
|-------|------------------------|-----------------------------------|----------|--------|
| Reimbursement + regulatory infra catching up: FDA AI-device list ~1,300 authorizations; CPT 2026 added 288 digital-health/AI codes | Most clinical AI still isn't reimbursed or workflow-embedded — adoption blocked on payment, not capability | A **reimbursement-aware clinical-AI workflow layer** mapping AI tools to CPT 2026 / CMS codes inside the EHR billing flow, so hospitals adopt because it pays | HARD | https://intuitionlabs.ai/articles/fda-ai-medical-device-tracker |
| AI drug discovery moving to clinic: ~173 programs in trials; 80-90% Phase I success claimed | The **discovery-to-clinical-validation chasm** — no demonstrated Phase II superiority yet; AI advantage evaporates at efficacy | (Avoid wet-lab/FDA-trial moats as a software team; treat efficacy claims skeptically) | EST/THIN | https://medcitynews.com/2026/04/ai-drug-discovery-is-reshaping-longevity-medicine-is-your-practice-ready/ |
| Longevity/geroscience institutionalizing (~$8.5B deployed 2024) | Viable only for disease-first, human-validated, clear-FDA-pathway plays | (Not a software-team beachhead; flag as capital-heavy) | EST | https://www.biospace.com/press-releases/insilico-medicine-announces-industrys-first-longevity-board-to-accelerate-ai-driven-aging-research-for-drug-discovery |

### Education
| Trend | Unmet gap / opportunity | A small AI-dev team could build X | Evidence | Source |
|-------|------------------------|-----------------------------------|----------|--------|
| AI tutoring scaling, deep LMS integration the 2026 headline | Tutoring itself is commoditizing | (Generators/tutors crowded — go up the stack to credentials) | EST | https://www.grandviewresearch.com/industry-analysis/ai-tutors-market-report |
| Center of gravity is workforce reskilling not K-12: ~59% of workforce (~120M) needs reskilling by 2030; AI-fluency demand grew ~7x | VC favors workforce-aligned, workflow-embedded models — funded demand | **Enterprise role-based reskilling agents** that embed in actual work tools | EST/HARD | https://www.feinternational.com/blog/edtech-ma |
| Credentialing infra is the strategic prize (Coursera-Udemy cite "credentials infrastructure" as priority) | **Verifiable, portable, employer-trusted credentials** — the translation layer between learning and hiring is missing | A **proof-of-skill credentialing layer** that assesses real work output (not quizzes), issues verifiable portable credentials, and plugs into employer ATS | EST (signal better-sourced) | https://www.feinternational.com/blog/edtech-ma |

### Business / Fintech / SaaS
| Trend | Unmet gap / opportunity | A small AI-dev team could build X | Evidence | Source |
|-------|------------------------|-----------------------------------|----------|--------|
| Agentic AI is the dominant enterprise narrative; ~80% of enterprises expected to have deployed GenAI apps in 2026 | — | — | EST | https://onereach.ai/blog/agentic-ai-adoption-rates-roi-market-trends/ |
| **Adoption-to-production gap: 79% "adopted" agents, only 11% run them in production** | Agents demo well but fail at reliability, governance, eval, observability, integration — the unmet need is making them safe enough to run unattended | **Agent reliability/ops infrastructure** (eval, guardrails, observability, human-in-the-loop, rollback) | THIN/EST (vendor survey lineage) | https://onereach.ai/blog/agentic-ai-adoption-rates-roi-market-trends/ |
| Vertical SaaS eating new investment (~40% of new SaaS '25); pricing shifting to usage/outcome-based (Gartner: 40% outcome-priced by end-2026) | Regulated vertical workflows under-served by horizontal tools | A **vertical agent for one regulated workflow** (legal, healthcare ops, financial reporting); outcome-based pricing means you sell on results | EST | https://stripe.com/blog/vertical-saas-insights-sessions-2026 |

### Climate / Energy / Hard-Tech
| Trend | Unmet gap / opportunity | A small AI-dev team could build X | Evidence | Source |
|-------|------------------------|-----------------------------------|----------|--------|
| AI's own power demand is the story: ~$602B data-center/AI infra spend projected 2026; data-center power toward 2,200+ TWh by 2030 | — | — | EST | https://ttms.com/growing-energy-demand-of-ai-data-centers-2024-2026/ |
| **Grid is the bottleneck** — power availability now halts data-center growth | Software to site, schedule, and optimize energy + compute is undersupplied (hardware is capital-heavy; software is where a small team plays) | **Grid/compute orchestration software** — match compute scheduling to grid availability/price/carbon (demand-response for AI workloads), or interconnection-queue/permitting automation | EST (macro direction solid, %s soft) | https://enkiai.com/data-center/ai-data-center-grid-strain-power-halts-growth-in-2026/ |
| Nuclear/SMR + fossil-gas resurgence (nuclear ~1/5 of climate VC; non-renewable additions +71% '25→'26) | Capital-heavy, hardware-bound | (Not a software-team beachhead) | EST/THIN | https://techcrunch.com/2025/12/30/12-investors-dish-on-what-2026-will-bring-for-climate-tech/ |

### Entertainment / Media / Creator Economy
| Trend | Unmet gap / opportunity | A small AI-dev team could build X | Evidence | Source |
|-------|------------------------|-----------------------------------|----------|--------|
| Generative AI video is the fastest-moving wedge (~21% CAGR claimed) | Generation is commoditizing fast | (Don't build another generator) | EST | https://www.meticulousresearch.com/product/ai-video-generation-and-editing-software-market-forecast-6359 |
| Cost collapse: video production ~$4,500/min → ~$400/min; 59% of creators already use genAI | — | — | EST/HARD-ish | https://aivideobootcamp.com/blog/generative-ai-media-statistics-2026/ |
| Creator economy large but maturing; pivot to enterprise-grade security, rights, high-res | **Rights, provenance, authenticity, monetization plumbing** — who owns it, was it AI, can it be licensed/paid | A **content provenance + rights/licensing + monetization layer** (watermarking, IP clearance, royalty routing, brand-safety) sitting above commoditized generators; aligns with looming AI-content disclosure rules | EST/THIN (market sizes weakest here) | https://www.amt.ai/blog/creator-economy-market |

### Cross-cutting: AI Regulation / Privacy / Governance
| Trend | Unmet gap / opportunity | A small AI-dev team could build X | Evidence | Source |
|-------|------------------------|-----------------------------------|----------|--------|
| **EU AI Act becomes teeth: fully applicable 2 Aug 2026**; Annex III high-risk obligations (employment, credit, education, law enforcement) enforceable then | Governance, audit trails, model docs, risk classification undersupplied vs the dated, mandatory deadline | An **"AI Act / high-risk compliance" platform** — automated risk classification, conformity documentation, audit logging, continuous monitoring for enterprise AI deployers; horizontal across every sector above | HARD | https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai |
| Privacy enforcement rising — EU/UK DPAs targeting developers AND deployers; GDPR up to €20M / 4% turnover; biometric & emotion-recognition in crosshairs | Compliance posture shifting from "innovation" to "compliance" — recurring spend | (Adjacent to the compliance platform above) | HARD | https://www.cpomagazine.com/data-protection/2026-ai-legal-forecast-from-innovation-to-compliance/ |
| Regulatory arbitrage real — 30+ founders warn EU rules push capital/talent to permissive markets | Jurisdiction-aware deployment is a live question | (Factor into go-to-market geography, not a product per se) | HARD/EST | https://www.vestbee.com/insights/articles/eu-ai-act-takes-effect-what-you-need-to-know |

---

## Forced-demand events worth tracking

These are dated, mostly non-negotiable buying triggers — the rare cases where demand is created by a deadline rather than persuaded. Prioritize directions that ride one.

| Date / window | Event | Who is forced to buy | Evidence |
|---------------|-------|----------------------|----------|
| **2 Aug 2026** | EU AI Act fully applicable; Annex III high-risk obligations enforceable (employment, credit, education, law enforcement) | Every enterprise deploying AI in HR/credit/education in or into the EU | HARD |
| 1 Jun 2026 | EU independent expert enforcement support stood up | AI developers + deployers (enforcement capacity online) | HARD |
| 2026 (rolling) | CPT 2026 code set live — 288 new digital-health/AI codes; FDA AI-device list ~1,300 | US hospitals/payers can now reimburse AI tools → adoption unlock | HARD |
| Ongoing 2026 | EU/UK GDPR enforcement wave on AI (up to €20M / 4% turnover) | AI developers AND corporate deployers | HARD |
| By end-2026 | Gartner: ~40% of enterprise SaaS contracts outcome-priced | SaaS vendors must support outcome-based pricing/measurement | EST |

The two strongest are the **EU AI Act Aug 2026 deadline** and the **healthcare reimbursement-code unlock** — both HARD-sourced and both create mandatory, dated demand.

---

## Evidence-quality caveat — read before betting

The macro **directions** in this library are well-corroborated. The **precise numbers** mostly are not. Treat the two very differently.

**Solid enough to act on (HARD):**
- Frontier-lab funding concentration / Q1 2026 venture figures (multiple independent sources).
- FDA AI-device authorizations and CPT 2026 reimbursement codes (official/regulatory).
- EU AI Act dates and high-risk scope; GDPR penalty ceilings (official EU sources).

**Directional only — do NOT build a financial model on these (EST):**
- Nearly every CAGR and market-size figure across all sectors. Analyst reports disagree with each other; they are vendor/SEO research firms with wide variance.
- Climate % figures (data-center spend, nuclear VC share) — corroborated in *direction* (power = bottleneck) but soft on specifics.

**Weakest — verify before quoting (THIN):**
- Drug-discovery clinical-superiority claims — vendor-sourced; Phase II benefit unproven.
- The **79% adopted / 11% in production** agent stat — the single most-repeated number, but traces to vendor-survey lineage. Directionally right (there IS a big production gap); do not cite as gospel.
- Creator-economy and AI-video market sizes — weakest sourcing in the brief.

Rule of thumb for direction calls: anchor the *thesis* on HARD evidence (funding concentration, the Aug 2026 deadline, reimbursement unlock), use EST/THIN only to rank opportunities, and re-verify any number before it enters a pitch, pricing model, or board deck.

---

*Source brief: `memory/research/T-302-cross-sector-trends.md`. Refresh this library when a newer cross-sector scan lands or when a tracked forced-demand date passes.*
