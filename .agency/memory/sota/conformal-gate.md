# Conformal "abstain-when-unsure" gate

> Agent-usable spec for a calibrated confidence gate on high-cost autonomous decisions. Source: T-301 §5.1 (conformal prediction). Class: **SOTA-2026, underused**. Companion to `sota/index.md` §5 (conformal prediction row).

## What it gives you (one paragraph)
Conformal prediction is a **distribution-free, model-agnostic wrapper** that turns *any* point predictor — a classifier, a regressor, or a black-box LLM you cannot retrain — into one that emits **prediction sets** (for classification/decisions) or **intervals** (for regression) with a **finite-sample coverage guarantee**: the true label is inside the set with probability **≥ 1−α** (e.g. ≥90% at α=0.10). The guarantee is non-asymptotic (holds for any sample size), holds **even under model misspecification**, and requires only a held-out **calibration set** of labeled examples drawn from the same distribution (exchangeability). The only correction needed for distribution drift is a known covariate-shift reweighting. It is cheap, theoretically grounded, and bolts onto a frozen model without touching its weights.

## How it works (the calibration recipe)
1. **Pick a nonconformity score** `s(x, y)` = "how badly the model fits this (input, label)." For a softmax classifier the standard choice is `s = 1 − p_model(y | x)` (high score = surprised).
2. **Calibrate.** On `n` held-out labeled examples compute scores `s_1…s_n`. Set the threshold `q̂` = the **⌈(n+1)(1−α)⌉ / n** empirical quantile of those scores. (The small `(n+1)/n` finite-sample correction is what makes the guarantee exact, not asymptotic.)
3. **Predict a set.** At inference, include every candidate label `y` whose score `s(x, y) ≤ q̂`. This set covers the truth with probability ≥ 1−α.
4. **Read the set size as confidence.** A **singleton** set = the model is confident. A **large** set (or, for a forced single decision, a top score that falls *below* the conformal threshold) = low confidence.

## The abstain rule (concrete, this is the gate)
```
calibrate(model, calib_set, alpha) -> q̂
on each decision x:
    S = { y : s(x, y) <= q̂ }          # conformal prediction set
    if |S| == 1:        act on S            # confident -> autonomous action
    elif |S| == 0 or |S| > 1:  ABSTAIN + ESCALATE   # ambiguous/low-confidence
```
- **|S| = 1** → confident: the agent acts autonomously.
- **|S| ≠ 1** (empty = below threshold for all labels; or ≥2 = the model can't separate the options at the required coverage) → the agent **does not act**. It **abstains and escalates**: hand off to a stronger model, or to a human, with the candidate set attached.
- Tune `α` to the cost asymmetry: a costlier wrong action → smaller `α` → higher coverage → more abstentions (the gate trades autonomy for safety, knowably).

## When agents apply it
Any **classification / decision / gate output where a wrong autonomous action is costly** and the action is hard to reverse. Canonical agent cases:
- **"Is this safe to deploy / merge?"** release-gate and risk decisions.
- **Routing / triage** — send to the right handler, or escalate when unsure.
- **Selective answering** — flag low-confidence LLM outputs for human review instead of returning them.
- **Guarded automation / early-stopping** — only auto-proceed when the set is a singleton.

It is **cheap and black-box**: no retraining, ~one quantile over a calibration set, works on a frozen/external model. Underused relative to its leverage — make it the default wherever an agent takes an irreversible action on a model's say-so.

### Caveats (state these when applying)
- **Exchangeability is the assumption.** Calibration and production data must be drawn alike; under drift you must reweight (covariate-shift correction) or the coverage degrades.
- **It is a per-decision guarantee, not per-class** (marginal coverage). If per-group guarantees matter (fairness/safety subpopulations), use **Mondrian / class-conditional** conformal, calibrating within each group.
- **Garbage scores → wide sets.** The guarantee always holds, but a poorly-calibrated base model just abstains more often. The gate stays *safe*; it does not make a bad model *useful*.
- **Needs enough calibration data** for the chosen `α` (rough floor: `n ≳ 1/α`, so ≥~100 examples for 90% coverage; more for tighter sets).

## Worked mini-example — "is this PR safe to auto-merge?"
- Model: a classifier outputs `p(safe)` for a PR. Decision: auto-merge (safe) vs. abstain-to-reviewer. Target coverage 1−α = 0.95, so α = 0.05.
- **Calibrate** on 200 historically-labeled PRs. Nonconformity score `s = 1 − p(true_label)`. The ⌈(201)(0.95)⌉/200 = 191st-smallest score gives `q̂ = 0.88`, i.e. include any label whose model probability ≥ 0.12.
- **New PR A:** `p(safe)=0.97`, `p(unsafe)=0.03`. Scores: safe→0.03 (≤0.88 ✓), unsafe→0.97 (>0.88 ✗). Set = **{safe}**, a singleton → **auto-merge**.
- **New PR B:** `p(safe)=0.80`, `p(unsafe)=0.20`. Scores: safe→0.20 ✓, unsafe→0.80 ✓ — wait, 0.80 ≤ 0.88 ✓. Set = **{safe, unsafe}**, size 2 → **ABSTAIN + ESCALATE** to a human reviewer with both candidates flagged.
- Guarantee: over the long run the true label is in the emitted set ≥95% of the time, so an auto-merged (singleton) "safe" call is wrong at a controlled, known rate — and genuinely ambiguous PRs are routed to a human instead of being acted on.

## Best citations
- **Primary / canonical:** Angelopoulos & Bates, *A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification*, arXiv:2107.07511 — the standard reference; the calibration recipe and the ≥1−α guarantee above follow it. Code: github.com/aangelopoulos/conformal-prediction.
  - https://arxiv.org/abs/2107.07511 · https://github.com/aangelopoulos/conformal-prediction
- **Applied (decision/optimization gating):** Stanton et al., *Bayesian Optimization with Conformal Prediction Sets*, arXiv:2210.12496 — conformal sets used to guard automated decisions under uncertainty.
  - https://arxiv.org/abs/2210.12496
- **Dynamic-systems UQ (T-301 source):** *Conformal prediction for UQ in dynamic systems*, PMC12091895.
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC12091895/

---

## Draft standards delta — FOR memory-architect / risk-quality-officer to merge into `standards.md`
*(Not applied here — proposed text for the standards owner to add, e.g. under a new "Autonomy safety" heading. This file does not edit any shared file.)*

> ## Autonomy safety
> - **High-cost / irreversible autonomous decisions carry a calibrated confidence gate.** Where an agent acts on a model's classification or decision and a wrong action is costly, wrap the predictor in a conformal (or equivalently calibrated) confidence gate: **abstain and escalate** to a stronger model or a human when confidence falls below the calibrated threshold (prediction set is empty or non-singleton), rather than acting on a low-confidence call. Choose the coverage level (α) from the cost of a wrong action. Spec: `memory/sota/conformal-gate.md`.
