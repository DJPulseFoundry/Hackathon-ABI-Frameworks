# SOTA Library — the standards Build agents apply

> A curated, scannable reference of state-of-the-art and evergreen CS techniques. Source: research brief T-301 (academic-researcher). Coordinate schema with ontology-engineer.

## How to use this
When a task is **performance-sensitive, architecture-sensitive, or eval-sensitive**, check here *first* — before optimizing or designing — and **cite the technique you applied** in your report/PR. Two labels:
- **Evergreen** = encode as a default standard; safe to reach for by default.
- **SOTA** = apply when the workload justifies it; the frontier moves, so **re-verify fast-moving tool rankings/metrics at decision time**, not from this snapshot.

Cross-cutting meta-principles (encode as standards): (1) measure the binding constraint before optimizing; (2) minimize data movement, not just FLOPs; (3) layout follows access pattern; (4) bounded approximation beats exact-but-infeasible at scale; (5) isolate context, parallelize independent work, reconcile serially; (6) calibrate confidence, abstain when unsure.

---

## 1. AI / Agentic Systems

| Technique | What it is | When to apply | Class | Source |
|-----------|-----------|---------------|-------|--------|
| Speculative decoding (draft-then-verify, EAGLE-3) | Small draft model proposes tokens; large model verifies in one pass — identical output, 2–6x faster | Latency-bound autoregressive generation when you control serving (vLLM/TRT-LLM config flag); less at high batch | SOTA | [E2E EAGLE-3](https://www.e2enetworks.com/blog/Accelerating_LLM_Inference_with_EAGLE) · [Introl](https://introl.com/blog/speculative-decoding-llm-inference-speedup-guide-2025) |
| KV-cache discipline (PagedAttention + prefix caching + FP8) | Paged 16-token blocks (<4% waste), reuse shared-prompt KV across requests, FP8 cache halves memory | Any multi-request LLM serving; prefix caching near-free when requests share a long system prompt | Evergreen/SOTA | [PremAI](https://blog.premai.io/kv-cache-optimization-pagedattention-prefix-caching-memory-management/) · [vLLM FP8 KV](https://vllm.ai/blog/2026-04-22-fp8-kvcache) |
| Orchestrator–worker multi-agent + context isolation | Lead decomposes, spawns 3–5 specialized subagents in parallel each with own context, synthesizes | Read/research-heavy parallelizable work; NOT tightly-coupled sequential edits | SOTA | [Anthropic multi-agent](https://www.anthropic.com/engineering/multi-agent-research-system) |
| Context engineering | Actively prune/edit context, feed budget signal, memory tools, programmatic tool calling, handoff files | Long-horizon agent runs that overflow/degrade; handoff-file pattern is the cheap default | Evergreen-emerging | [Anthropic](https://www.anthropic.com/engineering/multi-agent-research-system) · [arXiv 2603.09619](https://arxiv.org/pdf/2603.09619) |
| Hybrid retrieval + late-interaction reranking (ColBERT) + contextual chunks | Stage1 BM25/SPLADE+dense fusion; Stage2 rerank top-k with ColBERTv2 (~23ms); prepend doc context per chunk | Any knowledge-grounded agent; rerank only a pre-filtered candidate set | SOTA | [Production RAG](https://machine-mind-ml.medium.com/production-rag-that-works-hybrid-search-re-ranking-colbert-splade-e5-bge-624e9703fa2b) · [2026 RAG patterns](https://dev.to/young_gao/rag-is-not-dead-advanced-retrieval-patterns-that-actually-work-in-2026-2gbo) |
| Contamination-resistant + rubric-graded eval | Public benchmarks are ~45% contaminated; use dynamic/refreshed test items + structured rubric grading | Any claim that a model/prompt/agent is "better"; build private versioned held-out eval sets | SOTA | [EMNLP 2025](https://aclanthology.org/2025.emnlp-main.511/) · [LiveMedBench arXiv 2602.10367](https://arxiv.org/html/2602.10367) |

## 2. Low-level / HPC / Systems

| Technique | What it is | When to apply | Class | Source |
|-----------|-----------|---------------|-------|--------|
| Data-oriented design (SoA / AoSoA layout) | Lay out data per access pattern; SoA gives cache-efficient, auto-vectorizing field arrays (4–8x) | Hot loops over large collections touching a field subset (sim, ECS, columnar, kernels); not small/cold data | Evergreen | [DOD Grokipedia](https://grokipedia.com/page/Data-oriented_design) · [Data layout, not objects](https://medium.com/@michaelstebel/thinking-in-data-layout-not-objects-bfef321e083d) |
| Roofline-driven GPU kernel optimization | Place kernel on roofline (FLOPs/byte) to find binding limit; tile to shared mem, coalesce, avoid bank conflicts | Any custom CUDA/Triton kernel; watch occupancy vs register/shared-mem pressure | Evergreen/SOTA | [FlashAttention](https://openreview.net/pdf?id=H4DqfPSibmx) · [EmergentMind](https://www.emergentmind.com/topics/cuda-kernel-generation-and-optimization) |
| Lock-free reclamation (hazard pointers / EBR / RCU) | Safely free nodes other threads may read: hazard ptrs (safe/overhead), EBR (fast/blocking), RCU (read-mostly) | Only on proven contention hot paths; else a sharded lock or vetted concurrent map is safer | Evergreen | [LFQ EBR/HP](https://ethancornell.github.io/blog/2025/LFQ_EBR/) · [IN-COM](https://www.in-com.com/blog/implementing-lock-free-data-structures-in-high-concurrency-systems/) |
| Profiling-driven optimization | No speculative perf work: profile to find actual bottleneck, fix it, re-measure | Always, before any perf change. Codify: "no perf PR without before/after profile" | Evergreen | [DataPelago SIMD](https://www.datapelago.ai/resources/CPU-Acceleration) |

## 3. Algorithms & Data Structures

| Technique | What it is | When to apply | Class | Source |
|-----------|-----------|---------------|-------|--------|
| Roaring bitmaps | Compressed bitset (dense bitmap / sparse array / run-length); fast AND/OR/cardinality; in Spark/ClickHouse/Lucene | Large integer sets, inverted indexes, distinct-count, filter pushdown; default over HashSet<int> at scale | Evergreen | [RoaringBitmap.org](https://roaringbitmap.org/) · [arXiv 1402.6407](https://arxiv.org/pdf/1402.6407) |
| Probabilistic sketches (HyperLogLog, Count-Min) | Sublinear-memory approx: HLL cardinality (~1.5KB, ~2% err), CMS frequencies/heavy-hitters; both mergeable | Streaming/at-scale analytics where exact is too costly and bounded error is OK (unique visitors, top-k, rate limit) | Evergreen | [Roaring sketch context](https://roaringbitmap.org/about/) (verify impl, e.g. Apache DataSketches) |
| Swiss Tables / F14 hash maps | SIMD open-addressing: control byte per slot scans ~8–16 candidates per probe; high load factor, cache-friendly | Default high-perf map in C++/Rust/Go-class code; note iterator/pointer-stability (flat vs node) | Evergreen | [Abseil Swiss Tables](https://abseil.io/about/SDLC-design/swisstables) · [Go Swiss maps](https://go.dev/blog/swisstable) |
| Work-stealing + parallel prefix-scan | Idle threads steal tasks for irregular divide-and-conquer; scan is the primitive under sort/graph/compaction | Recursive/irregular CPU parallelism (use a runtime, don't hand-roll pools); express aggregation as scan/reduce | Evergreen | [Work-stealing analysis](https://www.researchgate.net/publication/356083508_Analysis_of_Work-Stealing_and_Parallel_Cache_Complexity) · [RandMScan](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12820164/) |

## 4. Databases

| Technique | What it is | When to apply | Class | Source |
|-----------|-----------|---------------|-------|--------|
| Columnar OLAP with zone maps | Columnar storage + per-block min/max zone maps for data-skipping + compression + vectorized exec (DuckDB/ClickHouse) | Aggregations/scans over wide tables; DuckDB embedded/local, ClickHouse at scale; sort on filter cols to prune | Evergreen/SOTA | [Indexing tradeoff spectrum](https://datalakehousehub.com/blog/2026-04-29-query-engine-optimization-04-indexing-strategies/) · [DuckDB vs ClickHouse](https://medium.com/@npavfan2facts/duckdb-vs-clickhouse-which-olap-engine-wins-360009142f0f) |
| LSM-tree tuning (RUM tradeoff) | Write-batched LSM (RocksDB/Cassandra) merges in levels; tune compaction, bloom filters, cache, level multiplier | Write/ingest-heavy KV storage; choose B-tree for read-heavy/range-scan, LSM for ingest-heavy | Evergreen | [Indexing tradeoff spectrum](https://datalakehousehub.com/blog/2026-04-29-query-engine-optimization-04-indexing-strategies/) · [CoreNN](https://blog.wilsonl.in/corenn/) |
| Vector indexing: HNSW vs DiskANN/Vamana | HNSW in-memory graph = lowest latency when RAM fits; DiskANN SSD-resident = billions on modest RAM | HNSW when working set fits memory; DiskANN when data ≫ RAM; co-locate vectors with analytics (data gravity) | SOTA | [Vector DBs 2025](https://medium.com/@bhagyarana80/top-10-vector-databases-for-2025-when-each-one-wins-fa2978b67650) · [CoreNN](https://blog.wilsonl.in/corenn/) · [BatANN arXiv 2512.09331](https://arxiv.org/pdf/2512.09331) |

## 5. Applied Math / Physics in CS

| Technique | What it is | When to apply | Class | Source |
|-----------|-----------|---------------|-------|--------|
| Conformal prediction | Distribution-free wrapper giving any predictor finite-sample coverage guarantees (e.g. 90% sets/intervals) | Decisions on model confidence: selective prediction, abstain-when-unsure, flag low-confidence outputs for review | SOTA (underused) | [Conformal UQ PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12091895/) · [BO w/ conformal sets arXiv 2210.12496](https://arxiv.org/abs/2210.12496) |
| Bayesian optimization (GP / TPE) | Sample-efficient black-box optimization: probabilistic surrogate + acquisition function picks next query | Tuning anything costly to evaluate (hyperparams, config knobs, tile/batch sizes); beats grid/random search | Evergreen | [Optuna TPE arXiv 2509.19417](https://arxiv.org/html/2509.19417) · [Localized online CP arXiv 2411.17387](https://arxiv.org/pdf/2411.17387) |
| IO-awareness / arithmetic-intensity lens | Data movement, not arithmetic, is usually the cost; keep data in the fastest tier (reg>L1>L2>DRAM>SSD>net) | Any perf-critical design: pick the algorithm minimizing bytes-moved per result, then optimize compute | Evergreen (cross-cutting) | [FlashAttention](https://openreview.net/pdf?id=H4DqfPSibmx) |

---

_20 techniques. All claims trace to T-301 (2025–2026 sources or canonical primary refs). Tool rankings are snapshots — **re-verify metrics at decision time**._
