# Explainer Toolkit — every Explanation Agency explainer reads this before teaching

> **Owner:** explainer-narrative + explainer-visual (co-owned craft floor, same rule as the
> design toolkit).
> **Audience:** every `explainer-narrative` and `explainer-visual`, and the `/SDLC-explain` orchestrator.
> **Contract:** any written explanation passes the **narrative standard** (§1); any visual explainer
> passes the **Quality Floor** (§3) *and* the **non-negotiables** (§4) — conformance gates, not
> nice-to-haves. The reduced-motion guard, the accessibility floor, and the **vendor-local rule**
> (libraries downloaded beside the HTML; SRI only on genuinely http-served pages, never on a
> file-opened page) are hard requirements (see `memory/standards.md` → Motion conformance; this doc
> extends it with a Security clause for third-party scripts).
> **Quality bar:** `examples/example-explainer.html` (interactive Gradient Descent) is the **FLOOR
> reference** — one widget done correctly (a11y, reduced motion, defer-safe boot). It is *not* the
> target: real explainers must meet the multi-scene **Quality Floor in §3**.
>
> Confidence: High — claims pinned to MDN / web.dev / WCAG / KaTeX primary sources (§ Sources).
> Freshness: re-verify the vendored library versions and the WCAG version annually, and whenever
> you bump a library.

This is the shared craft floor: reach for the same arc, the same stack, and the same accessibility +
security guards every time, so explanations differ by *topic and insight* — not by one explainer
knowing the case-study discipline or the SRI trick and another not.

---

## 1. The universal narrative standard (binds BOTH modes)

Whether the output is prose or an interactive page, the *teaching* follows the same arc. The visual
explainer renders these beats as panels/scenes; the narrative explainer writes them as sections.

1. **Hook — open a curiosity gap.** A question, a surprise, a paradox, or a concrete scene that makes
   the learner *want* the answer. **Never open with a definition.**
2. **Intuition before formalism.** The mental picture first — analogy, metaphor, "what is this really
   doing" in plain words — so the learner understands the idea *before* any notation. Then introduce
   the formal version and show it's the same idea in precise clothing. A correct-but-opaque dump is a
   failed explanation.
3. **Decompose + name the connections.** Break the topic into small pieces **and name how they
   connect** (this causes that; this is a special case of that; these two are dual). Structure is the
   teaching — an unstructured pile of true facts is not an explanation.
4. **Ground it — ≥1 real example + 1 cited case study.** A worked example the learner can follow step
   by step, plus a **real, researched, cited** case study (a real system, paper, event, or product).
   Every external fact gets a URL. **No invented references, numbers, or quotes.**
5. **Recap + the aha.** Tie back to the hook; state the one durable insight in a memorable sentence.
   The learner leaves with a compressed mental model, not a transcript.

**Interesting facts throughout** — the surprising origin, the famous mistake, the counterintuitive
consequence. They are the handholds memory grabs onto. **Calibrate to the audience** in the brief;
define each term on first use; be rigorous *and* warm (precision and plain language are not in
tension).

---

## 2. The web-native visual stack (binds the VISUAL mode)

A 3Blue1Brown-style explainer **in the browser**: a single self-contained HTML file, no build step,
opens over `python3 -m http.server`. Pick the tools the topic needs — not all four for their own
sake.

| Library | Use it for | Notes |
|---|---|---|
| **KaTeX** | Math typesetting — update rules, formulas, inline symbols | Fast, deterministic, print-quality. Use `auto-render` to typeset `$...$` / `$$...$$`. |
| **p5.js** or raw `<canvas>` | The central animation — the *mechanism* moving | Redraw in a `requestAnimationFrame` loop with **timestamp-derived** progress (frame-rate independent). Raw canvas is lighter when you don't need p5's helpers. |
| **D3** | Data-driven diagrams, axes, scales, the mental map | Great for the concept map (force/links) and any plotted curve with real ticks. |
| **GSAP** | Orchestrated, sequenced transitions where CSS/raf gets unwieldy | Earn its weight — don't pull it in for a single fade. |

**What the page must do** (the standard, expanded in `agents/explainer-visual.md`): animate the
*why* (remove the motion and the core idea is what's lost); decompose + animate the *relationships*;
and meet the **Quality Floor in §3** — multiple full-viewport scenes, multiple distinct
interactives (including a **failure regime**, not only the happy path), real imagery in the case
study, and a narration floor. The mental map is a **recap aid** (last scene), never the page's
central or only visual.

---

## 3. The Visual Quality Floor (machine-checkable — this is the TARGET)

The render gate (`sdlc-cli/test/visual-gate/vgate.js`, §6) asserts this floor mechanically, so the
author marks the structure in markup: every scene is a
`<section data-scene="hook|intuition|mechanism|formalism|failure|case-study|recap">`, and every
learner-facing control group carries `data-interactive` (theme toggles and nav buttons don't count
and must not carry the attribute).

1. **≥5 distinct scenes (7 recommended) on a progressive depth ladder.** The ladder:
   **hook** (a concrete experience or paradox — never a definition) → **intuition** (the mental
   picture, animated) → **mechanism** (decompose; animate the relationships) → **formalism** (KaTeX
   where math exists, tied visually to the running animation) → **failure** (push a parameter until
   it breaks) → **case-study** (real, researched, cited — *with imagery*) → **recap** (the mental
   map + the one durable insight). At least 5 of the 7; `hook`, `mechanism`, `failure`,
   `case-study`, `recap` are always required. Rigor *increases* down the page — a beginner exits
   early with the idea, an expert exits the bottom satisfied.
2. **Full-viewport scenes + navigation.** Each `[data-scene]` fills ≥ 80% of the viewport height.
   Navigation is scroll-driven (IntersectionObserver steps — never scroll-event handlers) **or** a
   prev/next stepper; either way ship a **visible progress indicator** and **keyboard scene
   navigation**. Under `prefers-reduced-motion` the **stepper is the canonical path** — motion never
   carries unrecoverable information (WCAG 2.3.3).
3. **≥3 distinct visual panels** — each core concept (≥3 from the decomposition) gets its **own**
   `svg`/`canvas`/animated-figure root inside a scene. Tab- or dataset-swapping one shared SVG
   counts **once**.
4. **≥2 distinct interactives** (`[data-interactive]` count ≥ 2) of different mechanisms (e.g. a
   parameter slider *and* a draggable simulation); at least one exposes a **failure regime**. The
   mental map alone never satisfies the visual or interactive requirement.
5. **≥1 real cited + licensed image** in the case-study scene, with meaningful `alt` text
   (WCAG 1.1.1). **Download it into `assets/` beside the HTML** (the vendored-lib pattern — the
   page still opens over `file://`) and record source URL + license + author in a visible credits
   block. Hotlinking is allowed **only as a flagged fallback** (cite inline; report "requires
   network"). No fabricated or AI-invented "historical" imagery.
6. **Narration floor.** Every scene carries teaching prose; total body text ≥ **~1,200 words**
   (audience-calibrated). The per-scene prose rule is the primary check — the total is a sanity
   floor, never a padding target. The visual page must stand alone as an explanation.
7. **Mental map demoted to the recap scene.** It recaps what was taught; it is never the central
   animation or the page's only visual.

All §4 non-negotiables (reduced-motion, contrast AA both themes, keyboard + labels, vendor-local,
defer-safe boot, no invented references) still apply unchanged. Thresholds may be relaxed only by
the `/SDLC-explain` orchestrator for a genuinely tiny topic, via the gate's config flags (§6) **plus
a logged Decision** — never silently.

---

## 4. Non-negotiables (these are the gates)

### 4a. Reduced motion — mandatory (WCAG 2.3.3)
Every animation sits behind `@media (prefers-reduced-motion: no-preference)`, and the page ships a
**usable static fallback** — the learner who reduces motion still gets the concept (steps drawn
statically, final state rendered, no information lost). Prefer the **opt-in** pattern (fails safe if
the query is unsupported):
```css
/* No motion by default; only animate when the user hasn't asked to reduce it */
@media (prefers-reduced-motion: no-preference) {
  .scene { transition: transform 240ms cubic-bezier(0,0,0,1), opacity 240ms; }
}
```
For canvas, gate the `requestAnimationFrame` loop on the same query and, under `reduce`, draw the
final/stepped state once instead of looping. **Shipping motion without this guard is a violation.**

### 4b. Performance / compositor-only
Animate **`transform` and `opacity` only** for DOM elements (compositor-stage; skips layout + paint).
Canvas redraws use `requestAnimationFrame` with timestamp-derived progress — never `setInterval`,
never refresh-rate-dependent stepping. `will-change` is a last resort: few elements, toggled on/off,
never baked into static CSS.

### 4c. Accessibility floor
- **Every interactive control is keyboard-operable and labelled** — native `<input type="range">` /
  `<button>` where possible; a visible `<label>` or `aria-label`, and `aria-valuetext` for sliders
  whose number needs a unit/meaning.
- **Contrast** meets WCAG AA (≥4.5:1 text, ≥3:1 large text/UI) in **both** themes.
- **Honor `prefers-color-scheme`** — ship dark *and* light, driven by the media query (and/or a
  toggle); never hard-code one.

### 4d. Loading libraries — VENDOR LOCALLY (so the page works when opened as a file)
An explainer is usually opened **straight off disk** (`file://`). Browsers **refuse a hash-pinned
(SRI) CDN script over `file://`** — so an `integrity=`'d CDN `<script>` loads *nothing* and your
visuals silently vanish (blank graph, no animation, no console error). This is the **#1 cause of a
dead explainer.** So:
- **Default — vendor the library next to the HTML.** Download it once, reference it locally, **no
  `integrity=` needed** for a same-folder file:
  ```sh
  curl -fsSL https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js -o d3.min.js
  ```
  ```html
  <script defer src="d3.min.js"></script>
  ```
  The page then works **offline, over `file://`, and over `http://`** — no CDN, no SRI surprise.
- **Only if the page will be served over http(s)** (never opened as a file) may you use a pinned CDN
  tag *with* SRI (`integrity="sha384-…" crossorigin="anonymous"`, hash computed from the exact file).
  **Never put SRI on a tag in a page meant to be double-clicked open.**
- **Pin the version** either way (the vendored filename or the CDN URL) — never `@latest`.

### 4e. Defer-safe boot — never assume a deferred lib is ready
`<script defer src="lib.js">` executes **after** your inline `<script>`, so at inline-parse time the
lib is `undefined`. **Do not early-return** when the lib "isn't loaded yet" — you'll give up before it
arrives and leave an empty page (this exact bug shipped a blank graph once). Instead:
- Put draw code in an `init()` and **wait for the lib**: boot on `DOMContentLoaded` (deferred libs are
  guaranteed ready by then), or poll `typeof Lib !== 'undefined'` briefly, and show a "couldn't load"
  fallback **only after a real timeout** (~8 s).
- Declare lib-owned variables **inside** `init()`, not at parse time.

**Verify before reporting** (the visual explainer does ALL of these every time, no exceptions):
1. **`node --check` the extracted inline JS** — zero syntax errors. (Necessary but NOT sufficient.)
2. **HEADLESS-RENDER GATE — mandatory for any visual output.** `node --check` *cannot see a blank
   canvas.* Run the kit gate (`sdlc-cli/test/visual-gate/vgate.js`, §6): it asserts liveness (drew,
   zero console/page errors, screenshot) **and the §3 Quality Floor** (scene count + kinds,
   full-viewport scenes, visual panels, interactives + interaction smoke, loaded cited image,
   narration floor, per-scene screenshots). A page that passes syntax but fails the gate is a
   **FAILED run** — fix and re-run.
3. **Loads as a file** — libraries vendored locally (or SRI only if it's genuinely http-served); no
   `file://`-blocking SRI on a file-opened page.
4. **Reduced-motion path** — the `@media (prefers-reduced-motion)` block + a usable static fallback,
   with the stepper as the canonical navigation.

---

## 5. Pre-ship checklist (self-check — this is the gate)

**Both modes**
- [ ] Opens with a **hook**, not a definition.
- [ ] **Intuition lands before** any notation/formalism.
- [ ] Topic is **decomposed** and the **connections are named**.
- [ ] **≥1 real example + 1 cited case study**; every external fact has a URL; nothing invented.
- [ ] **Recap + a memorable aha** that ties back to the hook.

**Visual mode also (the §3 Quality Floor + §4 non-negotiables)**
- [ ] **≥5 `[data-scene]` scenes** on the depth ladder; `hook`/`mechanism`/`failure`/`case-study`/`recap` present; each scene ≥ 80% viewport height.
- [ ] **Scroll or stepper navigation** + visible progress indicator + keyboard scene nav; stepper canonical under reduced motion.
- [ ] **≥3 distinct visual panels** (own `svg`/`canvas`/animated-figure roots — a dataset swap on one SVG counts once); every animation **carries the *why***, relationships are animated.
- [ ] **≥2 `[data-interactive]` interactives** of different mechanisms, keyboard-operable + labelled; one shows a **failure regime**.
- [ ] **≥1 real cited + licensed image** in the case-study scene, downloaded to `assets/`, meaningful `alt`, credits block (hotlink only as flagged fallback).
- [ ] **Narration floor:** teaching prose in every scene; body ≥ ~1,200 words.
- [ ] **Mental map appears in the recap scene** (recap aid — never the central or only visual).
- [ ] **Reduced-motion** guard + usable static fallback (WCAG 2.3.3).
- [ ] **transform/opacity** (DOM) + `requestAnimationFrame` timestamp progress (canvas) only.
- [ ] **Contrast AA** in both themes; **`prefers-color-scheme`** honored.
- [ ] **Libraries vendored locally** (`<script src="lib.js">`, downloaded next to the HTML) so it opens over `file://`; SRI **only** if the page is genuinely http-served.
- [ ] **Defer-safe boot** — draw code waits for the lib (no early-return); boots on/after `DOMContentLoaded`.
- [ ] **`node --check` passes AND the headless-render gate passes** — liveness + the full §3 floor, **0 console errors**, per-scene screenshots captured.

---

## 6. The headless-render gate
The kit gate `sdlc-cli/test/visual-gate/vgate.js` (containerised variant in the same dir) is the
canonical check: liveness (drew > 0, zero console/page errors, screenshot) **plus the §3 Quality
Floor** — scene count + mandatory kinds, ≥80%-viewport scenes, ≥3 visual roots, ≥2 interactives
with an interaction smoke (each `[data-interactive]` is activated and the DOM/canvas must mutate),
≥1 loaded image with alt, ≥1,200 body words, and per-scene screenshots. Thresholds are config flags
(env `VGATE_*` or `--min-*` argv) with the floor as defaults; `--legacy` runs only the liveness
checks (for pre-floor pages such as the single-widget example). Relaxing a threshold requires an
orchestrator Decision — never do it silently.

Minimal liveness one-liner (when the kit gate is unavailable — syntax-checking a visual page proves
nothing; you must *render* it and look):
```js
// vgate.js <file.html> <out.png> — exit 1 if the page renders blank or errors
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(), p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + process.argv[2], { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  const drew = await p.evaluate(() =>
    document.querySelectorAll('svg circle, svg path, svg line, canvas').length);
  await p.screenshot({ path: process.argv[3], fullPage: true });
  await b.close();
  if (errs.length || drew === 0) { console.error('FAIL', { drew, errs }); process.exit(1); }
  console.log('PASS drew=' + drew);
})();
```
Run: `node vgate.js "$PWD/<topic>.html" "$PWD/_render.png"`. **PASS required before reporting done**
— prefer the full kit gate above; the one-liner alone cannot certify the Quality Floor.

---

## Sources
- KaTeX — [Browser / `auto-render` usage + pinned CDN tags](https://katex.org/docs/browser)
- MDN — [Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) · [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) · [`prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) · [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- web.dev — [Animations guide (compositor-only props)](https://web.dev/articles/animations-guide)
- WCAG 2.1 — [Understanding 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html) · [Understanding 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- p5.js — [Reference](https://p5js.org/reference/) · D3 — [d3js.org](https://d3js.org/) · GSAP — [docs](https://gsap.com/docs/v3/)
- Companion craft floor: `memory/micro-animation-toolkit.md` (durations/easings/recipes) — motion timing rules apply here too.
