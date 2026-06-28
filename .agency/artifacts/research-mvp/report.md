# T6 — Domain & MVP-Framing (market-researcher)
_Persisted by CEO; subagent write was harness-blocked. Confidence: MEDIUM-HIGH on framing; LOW on "ABI Frameworks" identity._

## Headline
Not a toy parsing task — it sits on the most expensive, highest-denial documentation problem in post-acute billing.

- **EHR = PointClickCare**: ~60% SNF market share, 27,000+ LTC/PAC providers — the de-facto post-acute OS. Building against mock PCC = building against what 6/10 SNFs run.
- Medicare Part B wound billing needs exactly what we extract: **active wound** (active ICD-10 dx), **active Part B** (`MCB` + `effective_to==null`), **objective documentation every visit** (L×W×D cm, tissue %, drainage type+amount, periwound, medical necessity). **Our extraction fields ARE the LCD pay criteria** — the whole credibility story.
- Easter egg (THIN): "ABI" plausibly winks at **Ankle-Brachial Index** (vascular test for lower-extremity ulcers) — use as a flourish.
- Who is ABI Frameworks? No public company found (LOW). Inference: small/stealth **post-acute RCM-enablement startup**. Adjacent: Waystar, Net Health, SimiTree, Quadax.

## Why it matters (problem slide)
- **Volume:** SNF pressure-ulcer prevalence ~2–24%, ~18% on admission (peer-reviewed). Standing billing event across hundreds of residents.
- **Documentation is the #1 failure:** wound-care denials **25–35%** (vs ~9% benchmark); CERT documentation error **~25% (≈3× Medicare avg)**; documentation, not coding, leads. (RCM-vendor blogs, triangulated ×3 — treat exact % as ESTIMATES.)
- **Rework is leakage:** ~**$25.20** to rework a denial (MGMA), **~65% never reworked**. One-liner: *billers manually read hundreds of inconsistent charts; missing depth/drainage is invisible until it denies — we move the catch upstream where a fix is cheap.*

## Prior art to borrow
Net Health Tissue Analytics / Swift Medical = image→structured wound data; we do the **text→structured** half (complementary). Autonomous coders (Fathom, Nym, Solventum) give the judge-credible UX: **auto-accept high-confidence, escalate exceptions, always show highlighted source evidence + the documentation gap.** Our `auto_accept/flag/reject` IS that pattern — say so.

## What this judge wants (reasoning > accuracy)
Lead with a tradeoff, not a score. The **Envive prose** case (2D-only, `Stage: N/A`) is the money slide: *"we flag rather than hallucinate a missing depth into a claim that'll deny."* Pair with the 3-source corroboration confidence backbone + "docs diverged from reality, we built for reality."

## Biller persona — Dana, Wound-Care RCM Specialist
Non-clinical; covers 300+ residents on PointClickCare. Today: opens charts one-by-one, reads four inconsistent formats, cross-checks dx + coverage, guesses billable-vs-not, lives in denial queues. **Wins when** a glance-able table says *act / review / skip*, names the one missing field, and shows the source quote proving the decision.

## From hackathon to MVP (roadmap slide)
1. **Now:** format-agnostic extraction (detect from text), 3-source corroboration confidence, `auto_accept/flag/reject` + plain-English reasons + source quotes, glance-able dashboard; synthetic, PHI-safe.
2. **Audit trail + explainability:** every decision stores its evidence — appeal/compliance-ready.
3. **Human-in-the-loop feedback:** Dana confirms/overrides → tune thresholds (active learning); a CDI signal.
4. **Incremental sync (`since`):** re-pull only changed records — load/cost control (~1,203-call/~360-retry envelope).
5. **Real PCC integration:** mock → live PCC under a **BAA**, FHIR-aligned, HIPAA-ready posture in place.
6. **Expand rules engine:** encode full LCD criteria → predict denial risk, not just eligibility. Triage tool → denial-prevention product.

## Compliance one-liner
*"Synthetic data, no PHI; HIPAA-ready by design — no PHI in logs, least-privilege, audit trail per decision — drops onto a real PCC tenant under a BAA without redesign."* Say "HIPAA-ready," never "HIPAA-compliant."

## Biggest uncertainty
"ABI Frameworks" identity unconfirmed (LOW). Denial/CERT % from RCM-vendor blogs (who sell denial-reduction) — directionally robust, treat as estimates. Most defensible: MGMA $25.20 rework, PCC market share. Softest: wound-denial %. Bear case: specialist billers already hit sub-5% manually + generic LLM adds hallucination risk — which is exactly why **flag-don't-guess** is the right stance to present.

## Key sources
PointClickCare share (IntuitionLabs, PCC SNF platform) · Part B wound docs (Noridian JF Part B, CMS LCD L34587) · Prevalence (Wiley Intl Wound Journal 2024, PubMed) · Denial/CERT (DrBiller, RevenueES, EliteMed) · Rework cost (Aegis, Physicians Practice) · Prior art (Net Health Tissue Analytics, Swift Medical, Fathom, Nym) · ABI domain (StatPearls, WCEI).
