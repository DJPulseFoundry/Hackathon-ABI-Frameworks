# Research Sources — the kit's shared source knowledge base

> **READ FIRST, every research agent.** This is the binding reference for *where* to look and *how
> hard to trust it*. It is a lookup table + method, not an essay. `academic-researcher` lives in §A,
> `market-researcher` in §B; `web-researcher` and `research-lead` draw from both.
>
> **Re-verify volatile surfaces live before citing — always.** Leaderboards, funding figures, and
> community metrics rot in days-to-weeks; never quote one from memory or from this file's example
> numbers. Fetch the live surface on the day, cite the URL + access date + the exact variant.
>
> **Evidence grades (one scale, everywhere):**
> - **HARD** — primary / verified live (the org's own filing, the official board fetched today, a
>   peer-reviewed result with replication).
> - **EST** — well-established, stable secondary, or a single strong preprint/analyst — cite the URL.
> - **THIN** — single community/anecdotal surface → a *hypothesis*, never load-bearing, must be
>   triangulated (≥2 independent surfaces) before it counts.
>
> Each source below: **name · URL · "use it for" · grade.** Sourced from the two Wave-1 knowledge
> bases: `.agency/artifacts/research-fix/academic-sources.md` and
> `.agency/artifacts/research-fix/market-sources.md` (both access-dated 2026-06-22).

---

# §A — Academic (ML / CS)

## A.0 — The one critical freshness correction (verified live 2026-06-22) [HARD]

- **Papers with Code is DEAD.** Meta sunset it ~24 Jul 2025; `paperswithcode.com` now **redirects to
  Hugging Face**. The 9,300+ leaderboards and 79,000+ paper→code links are no longer served from the
  canonical URL. **Do not cite `paperswithcode.com` as live.** Its replacements, by job:
  - **SOTA leaderboards** → per-benchmark official boards (e.g. `swebench.com`), Hugging Face
    leaderboards, `llm-stats.com`, `OpenLM.ai`.
  - **paper→code links** → **Hugging Face Papers** (`huggingface.co/papers`) — each paper card links
    its GitHub repo.
  - **historical data dump** → `github.com/paperswithcode/paperswithcode-data` (archived, **not
    updated**).
  - Sources: GH issue #116 (redirect) · HyperAI writeup (`hyper.ai/en/news/42900`). Re-check before
    relying on any successor.

## A.1 — Discovery / preprint surfaces (the working set)

| Source | URL | Use it for | Grade |
|--------|-----|-----------|-------|
| **arXiv** | https://arxiv.org | Primary preprint host; stable `/abs/<id>` + versioned history (v1, v2…). Drive by category. | EST (preprint = unrefereed) |
| **arXiv categories** | https://arxiv.org/list/cs.LG/recent | The beats to watch: **cs.LG** (ML), **cs.AI** (general/agents), **cs.CL** (NLP/LLMs), **cs.CV** (vision), **cs.CC** (complexity/theory), **stat.ML**, **cs.MA** (multi-agent), **cs.IR** (retrieval/RAG), **cs.SE** (SWE agents), **cs.DC/cs.OS** (systems). | EST |
| **Semantic Scholar** | https://www.semanticscholar.org | Citation graph + TLDR + influential-citation edges. Best **free API** (`api.semanticscholar.org`) for programmatic forward/backward traversal. | EST |
| **Google Scholar** | https://scholar.google.com | Broadest recall + "Cited by" forward traversal + version clustering. No venue vetting — use for coverage, not authority. | EST (noisy) |
| **OpenReview** | https://openreview.net | The actual **peer reviews, rebuttals, scores, accept/reject** for ICLR/NeurIPS etc. Read the reviews — reviewers name the weaknesses the abstract hides. | HARD (for review signal) |
| **Hugging Face Papers** | https://huggingface.co/papers (+ `/trending`) | PwC's successor for discovery: daily/trending papers, paper→GitHub links, community threads. Ranks by GitHub-star momentum — **popularity ≠ quality**. | EST (discovery), THIN (ranking) |
| **Connected Papers** | https://www.connectedpapers.com | Visual **citation-neighborhood graph** from one seed (co-citation / bibliographic coupling). Find the cluster around a method fast. | EST |
| **Litmaps** | https://www.litmaps.com | Citation-map traversal + **monitoring** (alerts on new citing work) — "what has built on this since." | EST |
| **DBLP** | https://dblp.org | Authoritative **bibliographic index**: canonical author pages, venue proceedings, disambiguated names, correct BibTeX. Confirm where/when a paper actually appeared. | HARD (bibliographic) |
| **alphaXiv** | https://www.alphaxiv.org | Open discussion **on top of** arXiv (swap `arxiv.org`→`alphaxiv.org` on any abs URL). Community + AI Q&A layer (raised $7M seed Nov 2025). Discussion ≠ peer review — corroboration only. | THIN→EST |

**Discovery default:** start from a **survey or the official benchmark leaderboard** → pull the seed
paper's `/abs` on arXiv → expand in Connected Papers → confirm venue in DBLP → read OpenReview
reviews if submitted there.

## A.2 — Venues to weight (peer-reviewed > preprint)

A preprint is *one lab's claim*; a top-venue acceptance means ≥3 expert reviewers tried to break it
and a chair adjudicated. An 18-month-old still-unpublished preprint is a **yellow flag**, not neutral.

| Tier | Venues | Domain | Note |
|------|--------|--------|------|
| **ML/AI core** | **NeurIPS, ICML, ICLR** | general ML/DL | Top signal. ICLR + NeurIPS reviews public on OpenReview — read them. |
| **NLP/LLM** | **ACL, EMNLP, NAACL** (+TACL) | language/LLMs | ACL Anthology (`aclanthology.org`) = canonical free full-text. |
| **Vision** | **CVPR, ICCV, ECCV** | vision/multimodal | CVPR = highest weight in CV. |
| **Broad AI** | **AAAI, IJCAI** | general | Broader/older; solid but less DL-cutting-edge. |
| **Responsible AI** | **FAccT** (+AIES) | fairness/accountability/transparency | The venue for harms, bias, eval-validity critiques. |
| **Systems** | **OSDI, SOSP** (+NSDI, MLSys) | systems / ML-systems | Weight for serving, training infra, distributed/efficiency claims. |
| **Theory** | **STOC, FOCS** (+COLT, SODA) | algorithms / complexity / learning theory | Weight for complexity, bounds, optimization-theory claims. |

**Rule:** the **venue-accepted version outranks the arXiv preprint** of the same work (it's
post-review). Cite the proceedings (DBLP / ACL Anthology / OpenReview) for the *claim*; cite arXiv
for convenient full text.

## A.3 — AI-agents canon (seminal lineage) — arXiv IDs verified live 2026-06-22 [HARD]

| Thread | Paper (year, venue) | arXiv | Use it for |
|--------|--------------------|-------|-----------|
| Reasoning+acting | ReAct (Yao et al. 2022, ICLR'23) | [2210.03629](https://arxiv.org/abs/2210.03629) | The reason→act→observe loop under every "agent." |
| Self-reflection | Reflexion (Shinn et al. 2023, NeurIPS'23) | [2303.11366](https://arxiv.org/abs/2303.11366) | Verbal self-feedback / retry as a learning signal. |
| Tool use | Toolformer (Schick et al. 2023, NeurIPS'23) | [2302.04761](https://arxiv.org/abs/2302.04761) | Self-supervised API/tool calling. |
| Embodied lifelong | Voyager (Wang et al. 2023) | [2305.16291](https://arxiv.org/abs/2305.16291) | Open-ended skill acquisition + skill library (Minecraft). |
| Deliberate search | Tree of Thoughts (Yao et al. 2023) | [2305.10601](https://arxiv.org/abs/2305.10601) | Search over reasoning paths vs. single chain. |
| Multi-agent / social | Generative Agents (Park et al. 2023) | [2304.03442](https://arxiv.org/abs/2304.03442) | Memory-stream + believable multi-agent behavior. |
| Multi-agent framework | AutoGen (Wu et al. 2023) | [2308.08155](https://arxiv.org/abs/2308.08155) | Conversational multi-agent orchestration. |
| Retrieval grounding | RAG (Lewis et al. 2020, NeurIPS'20) | [2005.11401](https://arxiv.org/abs/2005.11401) | The origin of retrieval-augmented generation. |

**Agent eval / benchmarks (verify the live board every time — they move weekly):**
- **SWE-bench** (+ **Verified**, Multilingual, Multimodal) — https://www.swebench.com · paper
  [2310.06770](https://arxiv.org/abs/2310.06770) · `huggingface.co/datasets/princeton-nlp/SWE-bench_Verified`.
  Real GitHub-issue resolution; **Verified** = 500 human-confirmed-solvable subset. [HARD, board live]
- **GAIA** — leaderboard on Hugging Face · paper [2311.12983](https://arxiv.org/abs/2311.12983).
  Generalist assistant, 466 human-verified questions; humans ~92%; durable yardstick. [EST]
- **Holistic Agent Leaderboard (HAL)** — paper [2510.11977](https://arxiv.org/pdf/2510.11977).
  Cross-benchmark agent eval; counter-source against single-benchmark hype.

> Don't anchor on a 2023 paper as "current" — forward-traverse. Other beats to map: RAG advances,
> tool/function-calling, memory/long-horizon, multi-agent coordination, computer-use/web agents,
> agent safety/eval-validity.

## A.4 — Labs as self-interested primary sources

| Lab | URL | Use it for |
|-----|-----|-----------|
| **Anthropic** | https://www.anthropic.com/research · https://www.anthropic.com/engineering | Agent design, interpretability, safety; practitioner posts. |
| **Google DeepMind** | https://deepmind.google/research/publications/ | Gemini, RL, theory, agents. |
| **Meta FAIR** | https://ai.meta.com/research/ | Llama, RAG lineage, open models/datasets. |
| **OpenAI** | https://openai.com/research/ (+ `/index` for system cards) | Model/system cards, preparedness evals, GPT papers. |
| **Microsoft Research** | https://www.microsoft.com/en-us/research/ | AutoGen, agent frameworks, systems. |

**Lab-source discipline:** a lab blog / system card is a **primary source for what the lab built and
measured**, but it is **self-interested** — the lab chose the benchmarks and the framing. It is **not**
an independent second source for a capability claim. Triangulate with a peer-reviewed eval or an
independent leaderboard.

## A.5 — The 5-step literature METHOD (run it in order)

```
STEP 1 — ORIENT from the top, not the firehose.
  Start from a recent SURVEY ("survey" / "a review of") or the OFFICIAL benchmark leaderboard for the
  task — never from a random recent preprint. Identify the 1–3 seed papers everyone cites.

STEP 2 — TRAVERSE the citation graph both ways.
  BACKWARD (what it builds on): follow the seed's references to the foundational work.
  FORWARD (what built on it): Semantic Scholar / Scholar "Cited by" + Connected Papers / Litmaps
  neighborhood → find the CURRENT state, not the 2023 state. Stop at saturation (new queries only
  return papers you already have).

STEP 3 — APPLY peer-review discipline.
  For each load-bearing paper: PEER-REVIEWED (confirm venue in DBLP / ACL Anthology / OpenReview) or
  PREPRINT-ONLY? Read the OpenReview reviews where they exist. Weight per §A.2. An old, still-
  unpublished preprint is a yellow flag.

STEP 4 — CHECK reproducibility + benchmark caveats.
  Find the code (HF Papers card → GitHub; PwC is dead, see §A.0). Does the README reproduce the
  headline number? What EXACTLY does the benchmark measure, and what's its contamination / saturation
  status? Note REPLICATION: independently reproduced, contested, or unreplicated.

STEP 5 — SITUATE in theoretical lineage + COMPARE on tradeoffs.
  Name the theoretical family the method descends from — information theory (entropy/MDL/compression),
  Bayesian inference (priors/posteriors/uncertainty), optimization (convexity, gradients,
  regularization), statistical learning theory (bias–variance, PAC, generalization bounds), complexity
  (what's tractable). Then lay competing approaches side by side on TRADEOFFS (compute, data, sample-
  efficiency, interpretability, assumptions) — NO winner-by-decree. Novelty is not merit; ask what the
  method gives up.
```

## A.6 — Evidence rules specific to academia (the 7)

1. **Preprint caveat.** A preprint is an unreviewed claim — grade **EST at best**, label "preprint,
   not peer-reviewed." Never the sole basis for a "proven" statement.
2. **Benchmark contamination / saturation.** A high score may mean test-set leakage into pretraining
   or a saturated/gamed benchmark. Check the benchmark release date vs. the model's training cutoff;
   prefer held-out / Verified / live variants (e.g. SWE-bench Verified). State the risk explicitly.
3. **Single eval ≠ proven.** One benchmark, one seed, one run is an existence proof, not a general
   claim. Look for multiple benchmarks, seeds, variance/CIs, and ablations.
4. **Self-citation ≠ a second source.** A lab citing its own prior work (or a system card citing the
   lab's own benchmark) is **one** source. Triangulation requires an **independent** group/leaderboard.
5. **Popularity ≠ validity.** Trending on HF / GitHub stars / citation count measure attention, not
   correctness (citations can be negative — everyone refuting a flawed result).
6. **Venue-accepted > preprint of the same work.** The proceedings version is post-review; cite it
   for the claim.
7. **Leaderboards are live state.** Never assert a SOTA number from memory — fetch the official board
   on the day, cite it with the date, name the exact benchmark variant.

---

# §B — Market & Community

## B.1 — Where capital / profit flows (HARD-ish funding signal)

| Source | URL | Use it for | Grade |
|--------|-----|-----------|-------|
| **SEC EDGAR — 10-K / 10-Q + earnings calls** | https://www.sec.gov/edgar/search/ | Ground truth on revenue, segment growth, churn, guidance, stated risks from public incumbents. The only place "profit" (not just funding) is legally attested — the hardest signal available. | HARD |
| **PitchBook** | https://pitchbook.com | Deepest private-market data: PE/VC/M&A deals, valuations, investor portfolios, cap tables — analyst-grade book of record (paywalled). Where private capital concentrates before it's public. | HARD (where accessible) |
| **Crunchbase** | https://www.crunchbase.com | Broad startup + funding-round visibility; best for early-stage breadth and fast "who raised what." Free tier exists — verify rounds (community-contributed). | EST |
| **CB Insights** | https://www.cbinsights.com | Market-intelligence reports, sector maps, "State of Venture" quarterly, Mosaic scores. Best for *trend/landscape* framing, not raw round data. | EST |
| **Y Combinator — Companies + RFS** | https://www.ycombinator.com/companies · https://www.ycombinator.com/rfs | What the top accelerator funds *now* (companies) and *wants built next* (Requests for Startups = demand thesis straight from capital). | HARD (YC's own thesis) |
| **a16z "Big Ideas" (annual)** | https://a16z.com/big-ideas-2026/ | a16z partners' forecasts across infra/consumer/biotech/American Dynamism/crypto. Tilt for talk-their-book bias. | EST (primary thesis, vendor-tinted) |
| **Sequoia perspectives/essays** | https://www.sequoiacap.com/article/ | Sequoia's market theses (e.g. AI value-layer essays). Same talk-their-book caveat. | EST |
| **State of AI Report** (Air Street / Nathan Benaich) | https://www.stateof.ai | Annual independent synthesis of AI research+industry+politics+safety; 2025 ed. (8th, pub. 2025-10-09) added a 1,200-practitioner usage survey. | EST (independent) |

*Adjacent free feeds: Dealroom (`dealroom.co`), Tracxn (`tracxn.com`) as Crunchbase/PitchBook
alternatives — triangulate, don't trust one DB's totals. **Staleness: funding data rots in weeks;
theses are annual** (a16z Big Ideas ~December; YC RFS per batch — Summer 2026 pivoted to
hardware/defense/space). Re-pull live every decision.*

## B.2 — Community sentiment / demand signal (THIN individually → triangulate)

| Surface | URL / how to read it | Use it for | Grade |
|---------|----------------------|-----------|-------|
| **X / Twitter** | `x.com/search?q=<topic>` + `min_faves:` / `filter:links`; follow practitioners & founders, not influencers. | Real-time sentiment, "I wish X existed," launch buzz, who the insiders are. | THIN (per-tweet) → EST if a pattern repeats across accounts |
| **Reddit** | Sub search + `top/month`. Core: r/MachineLearning, r/LocalLLaMA, r/startups, r/SaaS, r/Entrepreneur, r/smallbusiness, r/indiehackers + the **niche sub** (the unmet-job goldmine). | Candid complaints, churn reasons, "what tool do you use for…," buying intent. | THIN→EST (volume + repetition = signal) |
| **Hacker News** | https://news.ycombinator.com · search `hn.algolia.com` · trends `hntrends.com` | **Show HN** (what's shipping), **Ask HN** (problems), monthly **"Who is hiring?"** (demand by role). | EST (engaged technical audience) |
| **Product Hunt** | https://www.producthunt.com · `/leaderboard/yearly/<year>` | What launched + upvote velocity; crowded categories vs. what resonates. Bias: rewards infra over chat-wrappers; upvotes ≠ revenue. | THIN→EST |
| **GitHub Trending** | https://github.com/trending (filter language + daily/weekly) | What devs are *actually building*; star-velocity = developer demand (revealed behavior, not opinion). | EST |
| **Medium / Substack** | Topic tags on Medium; Substack leaderboards + the domain's key newsletters. | Long-form theses, what essays resonate, the emerging vocabulary of a space. | THIN→EST (depends on author authority) |
| **Review mining — G2 / Capterra / app stores** | https://www.g2.com · https://www.capterra.com · store reviews | **Complaints = unmet jobs.** Mine "What do you dislike?" + 1–2★ reviews of incumbents; G2 sub-scores <7.5 (setup, support, direction) flag repeatable vulnerabilities. Capterra skews SMB. | EST (structured, at scale) |

*Staleness: all of §B.2 is fast-moving (days–weeks). A subreddit's top-of-month and a 6-month-old
thread answer different questions. Always read live and date the pull.*

## B.3 — The 5-step market-GAP computation METHOD (the missing core)

> Run it as a procedure, not a vibe. Output is a *ranked* gap list where every row carries its
> evidence, grade, and the cheapest test to validate it. Grounded in white-space / Jobs-to-Be-Done
> opportunity-scoring (Ulwick ODI: opportunity rises with *importance* and the *gap* between
> importance and current satisfaction).

```
STEP 1 — MAP THE INCUMBENTS (the "is")
  List existing solutions: Crunchbase/PitchBook/CB Insights + G2/Capterra category + Product Hunt +
  GitHub Trending. Capture each player's positioning, pricing, segment. → Incumbent map; note crowded
  zones (avoid) vs thinly-served zones (probe).

STEP 2 — MINE THE UNMET JOB-TO-BE-DONE (the "ought")
  Harvest pain from §B.2: G2/Capterra 1★ + "what do you dislike", "I wish X existed" / "what do you
  use for…" threads, churn/cancel reasons, app-store complaints. Phrase each as JTBD: "When
  <situation>, I want to <job>, so I can <outcome>." Tag gap type: functional / emotional / occasion.
  → Ranked unmet-job list with raw quote + source URL + date each (evidence, not vibes).

STEP 3 — CROSS WITH WHERE CAPITAL FLOWS (the "tailwind")
  For each unmet job, check the ADJACENT space in §B.1: is capital moving toward it? (YC RFS theme,
  a16z/Sequoia thesis, recent rounds, an incumbent's 10-K growth segment.) Demand AND capital nearby
  but no direct winner = prime white space. Demand but capital actively crowding in = late.

STEP 4 — SCORE EACH GAP
  GapScore = DemandSignal × UnderServed × SmallTeamAttackable   (score each 1–5, multiply)
    - DemandSignal       = strength + INDEPENDENCE of evidence (how many surfaces agree; HARD>EST>THIN).
                           A single loud tweet scores low; complaint volume across Reddit+G2+HN high.
    - UnderServed        = how poorly incumbents serve the job (high incumbent 1★ / low G2 sub-score = high).
    - SmallTeamAttackable = can a small team ship a wedge without huge capital/regulatory moat?
                           (a16z "American Dynamism"/hardware = LOW; pure-software wedges = HIGH.)
  Carry the evidence grade alongside the number — never average a THIN claim into a HARD one.

STEP 5 — OUTPUT A RANKED GAP LIST + cheapest validation test
  Sort by GapScore. Each row: JTBD · GapScore + sub-scores · evidence (URLs+dates) · grade · and THE
  CHEAPEST TEST TO VALIDATE IT:
    - landing-page / fake-door smoke test (does anyone click "buy"?),
    - concierge / manual-service MVP for 5 of the complainers,
    - a Show HN / Product Hunt / subreddit post measuring signups or upvote velocity,
    - 5 customer-dev interviews with the people who wrote the 1★ reviews.
  A gap isn't "real" until its cheapest test would distinguish a paying market from a loud crowd.
```

## B.4 — Anti-patterns (how market analysis goes wrong)

- **Vendor-tinted CAGRs.** "Market growing 40% CAGR to $X B by 2030" from a report selling into that
  market is marketing, not evidence. Prefer audited 10-K segment growth + ≥2 independent analysts;
  treat single-vendor TAM as THIN. a16z/Sequoia/YC theses are *primary but talk-their-book* — discount.
- **Single-tweet / single-thread trends.** One viral post or thread is THIN — a hypothesis, not a
  trend. Require independent repetition across ≥2 surfaces before it's EST.
- **Survivorship bias.** Studying only the launches that hit #1 (Product Hunt / HN front page / GitHub
  Trending) hides the graveyard. Ask what the dead ones did too.
- **Loud community ≠ paying market.** Upvotes, stars, claps, Discord enthusiasm are attention, not
  revenue. Free-tool lovers may never pay. Close the loop with a willingness-to-pay test (Step 5).
- **Recency blindness.** A 2023 sub-thread or old report answering "what's hot now" is a wrong answer
  with a citation. Date every pull; weight by freshness.

---

## Provenance

- **Source artifacts (both access-dated 2026-06-22):**
  `.agency/artifacts/research-fix/academic-sources.md` (Task T-RA) and
  `.agency/artifacts/research-fix/market-sources.md` (Task T-RB).
- **Live-verified 2026-06-22:** Papers-with-Code shutdown+redirect (§A.0); HF Papers; SWE-bench /
  Verified board; GAIA; arXiv IDs for ReAct/Toolformer/Voyager/RAG/Generative Agents; alphaXiv
  status/funding; State of AI 2025 (8th ed.); YC RFS Summer-2026 pivot.
- **EST (stable, not re-fetched):** Reflexion/ToT/AutoGen IDs; venue tiers; Semantic Scholar /
  Scholar / Connected Papers / Litmaps / DBLP / OpenReview feature sets; lab URLs; Crunchbase /
  PitchBook / CB Insights / G2 / Capterra positioning.
- **Re-verify cadence:** discovery tools + leaderboards + funding figures + community metrics =
  monthly or live-at-use (fast-moving); venue list + seminal arXiv IDs = stable. **Always re-check
  §A.0 (PwC successors) before citing any replacement as live.**
