# Micro-Animation Toolkit — every Design Agency designer reads this before adding motion

> **Owner:** design-system-specialist + design-systems-engineer (co-owned, same rule as `design-system.md`).
> **Audience:** every `design-explorer` and anyone producing a prototype under `/SDLC-design`.
> **Contract:** any motion in a prototype must pass the **house-rules checklist** (§6). The reduced-motion
> guard (§3) is not optional — it's a conformance gate (see `memory/standards.md` → Motion conformance).
> **Scope:** techniques implementable in plain CSS / vanilla JS in a single self-contained HTML file
> (no build step) — which is exactly what the Design Agency ships.
>
> Confidence: High — claims pinned to MDN / web.dev / WCAG / Material primary sources (§ Sources).
> Freshness: re-verify browser-support baselines + the WCAG version annually.

This is the shared craft floor: reach for the same techniques, the same durations, the same easings, and
the same accessibility guard every time, so options differ by *idea* — not by one designer knowing the
reduced-motion trick and another not. New reusable motion patterns get captured back into
`design-system.md` as InteractionConventions (with provenance), same as tokens and components.

---

## 1. Glyph animation techniques (the seed case)

| Technique | What it does | Constraints / caveats | Browser support | Reach for it when |
|---|---|---|---|---|
| **SVG stroke draw-on** (`stroke-dasharray` + `stroke-dashoffset`) | Outlines a glyph as a stroked SVG path, then "draws" it by animating the dash offset | Glyph must be a **stroked path**, not a filled shape. Get path length via `path.getTotalLength()`. Reads like handwriting/inking. | Baseline: widely available since Mar 2020 | A letterform/logomark that should appear to be written or inked on |
| **SVG path morph** (`<animate>` SMIL, CSS, or JS lib) | Interpolates the `d` of one path into another (em-dash → plus, play → pause) | **Hard constraint: both paths need the same number of points/commands and compatible command types**, or the morph jumps. Normalize in a vector editor (start from the more complex shape) or use a re-sampling lib. | Native CSS path morph is Chrome-only and still needs equal point counts. SMIL `<animate>` is broad but legacy. Libs (GSAP MorphSVG) morph any point count — but that's a dependency, not single-file-pure. | Two related glyph states with the same topology |
| **CSS mask / clip reveal** (`mask-image`, `clip-path`) | Glyph renders normally; a mask/clip wipes it into view | Animate `mask-position`/`mask-size` or `clip-path` geometry — not the glyph. | `mask` Baseline since Dec 2023; `clip-path` older/broader. `-webkit-mask-*` only for older WebKit. | Reveal a *filled* glyph/wordmark with a directional wipe |
| **Variable-font animation** (`font-variation-settings`) | Animates real font axes — `wght`, `wdth`, `slnt`, `ital`, `opsz` — so the actual letterform thickens/condenses/optically resizes | Needs a variable font via `@font-face` with axis range declared. `font-variation-settings` **overrides** `font-weight`/`font-stretch` regardless of cascade order — pick one mechanism. Custom axes use UPPERCASE tags. | Baseline since Sep 2018 | Live type that should breathe in weight/width — animating the glyph itself |

**Decision shortcut:** stroked single-color letterform → **draw-on** · filled glyph/wordmark reveal →
**mask/clip** · two icon states, same topology → **morph** · real type weight/width → **variable font**.

---

## 2. Craft principles (apply to all micro-animation, not just glyphs)

**Duration.** Most UI animation runs **100–500 ms** (NN/g); the practical sweet spot is **100–400 ms**,
with 400 ms reserved for large/long moves; **≥500 ms feels like a drag.** ~100 ms reads as instant
(toggles/checkboxes); 200–300 ms suits substantial changes (modals). **The 100–300 ms band is the safe
default** — go longer only for large-area motion. *(Material tokens for reference: short 50–200, medium
250–400, long 450–600, extra-long 700–1000 ms.)*

**Easing — direction matters.**
- **Enter → ease-out (decelerate):** starts fast, settles gently.
- **Exit → ease-in (accelerate):** starts slow, speeds away.
- Avoid `ease-in`/`ease-in-out` on entrances (sluggish); keep any ease-in short.
- **Asymmetry is good:** enter a touch slower than exit (popup in 300 ms, out 200–250 ms).
- Standard cubic-beziers (Material): standard `cubic-bezier(0.2,0,0,1)` · decelerate/enter
  `cubic-bezier(0,0,0,1)` · accelerate/exit `cubic-bezier(0.3,0,1,1)` · emphasized decelerate
  `cubic-bezier(0.05,0.7,0.1,1)` · emphasized accelerate `cubic-bezier(0.3,0,0.8,0.15)`.

**12 principles distilled for UI:** **anticipation** (a tiny wind-up signals intent) ·
**follow-through/overshoot** (settle slightly past then back — "emphasized" curves bake this in; use
sparingly) · **staging/staggering** (sequence related elements 20–50 ms apart to direct attention).
Purpose over decoration — motion explains a state change or guides attention, never garnishes.

**Animate transforms & opacity, not layout.** For 60fps, animate **`transform` and `opacity` only** —
compositor-stage, skips layout + paint. Animating `width/height/top/left/margin` forces reflow + repaint
(jank). Position via `translate()`, size via `scale()`, visibility via `opacity`.

---

## 3. Accessibility — non-negotiable (this is the gate)

**`prefers-reduced-motion`** maps to the OS "reduce motion" setting (macOS Display; iOS Motion; Windows 11
Visual Effects; Android Remove animations). Values: `no-preference`, `reduce`. Baseline since Jan 2020.

**Reduce, don't always remove.** Swap a vestibular-triggering animation for a calmer equivalent
(scale/slide → opacity fade) or shorten to near-instant — don't strip all feedback (that can lose
meaning). Always provide a non-motion equivalent of the state change.

**Vestibular triggers to avoid / gate:** large-area movement, parallax, spin/rotation, zoom/scale, big
viewport slides.

**WCAG 2.3.3 Animation from Interactions (AAA):** interaction-triggered motion must be disable-able unless
essential. Glyph micro-animations are essentially never essential → they must be disable-able. Honoring
`prefers-reduced-motion` satisfies it.

**The default pattern — opt-in to motion (fails safe). Use this for every prototype:**
```css
/* No motion by default; only animate when the user hasn't asked to reduce it */
@media (prefers-reduced-motion: no-preference) {
  .glyph { transition: transform 200ms cubic-bezier(0,0,0,1), opacity 200ms; }
}
```
Or neutralize-on-request (motion on by default, turned off under `reduce`):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Prefer the **opt-in (`no-preference`)** pattern — it fails safe if the query is unsupported or the user
opted out.

---

## 4. Performance

- **`transform` + `opacity` only** → compositor-only, no layout/paint. The single biggest 60fps lever.
- **Avoid layout thrash:** batch DOM reads then writes; don't interleave `getBoundingClientRect`/
  `offsetWidth` with style writes in a loop.
- **`will-change` is a last resort.** Costs memory + a new compositing layer/stacking context per element.
  Apply to **few** elements, **just before** the animation, **remove when done** (toggle via JS). Never
  bake into static CSS.
- **GPU compositing:** transform/opacity animations run on the compositor thread and survive a busy main
  thread; layout/paint ones don't.
- **JS motion → `requestAnimationFrame`**, never setTimeout/setInterval. Always derive progress from the
  timestamp/elapsed time, or it runs faster on 120/144 Hz displays.

---

## 5. Copy-paste recipes (single-file, plain CSS / vanilla JS, reduced-motion aware)

### (a) SVG stroke draw-on glyph
```html
<svg viewBox="0 0 100 100" width="120" aria-hidden="true">
  <path id="g" d="M20 80 L50 20 L80 80" fill="none" stroke="#111"
        stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
<style>
  @media (prefers-reduced-motion: no-preference) {
    #g {
      stroke-dasharray: var(--len);
      stroke-dashoffset: var(--len);
      animation: draw 900ms cubic-bezier(0,0,0,1) forwards;
    }
    @keyframes draw { to { stroke-dashoffset: 0; } }
  }
</style>
<script>
  const p = document.getElementById('g');
  p.style.setProperty('--len', Math.ceil(p.getTotalLength())); // exact path length
</script>
```

### (b) Glyph cross-fade / morph (no point-count math — cross-fade two stacked glyphs)
```html
<span class="morph"><b class="a">—</b><b class="b">+</b></span>
<style>
  .morph { position: relative; display: inline-block; }
  .morph b { font-style: normal; }
  .morph .b { position: absolute; inset: 0; }
  @media (prefers-reduced-motion: no-preference) {
    .morph .a, .morph .b { transition: opacity 200ms ease, transform 200ms cubic-bezier(0,0,0,1); }
  }
  .morph .b { opacity: 0; transform: scale(.8); }
  .morph:hover .a { opacity: 0; transform: scale(.8); }
  .morph:hover .b { opacity: 1; transform: scale(1); }
</style>
```
*(For a true path morph, normalize both `d`s to equal point counts in a vector editor first; native CSS
path morph is Chrome-only.)*

### (c) Icon state transition (hamburger → close, transforms only)
```html
<button class="burger" aria-label="Menu" aria-expanded="false">
  <span></span><span></span><span></span>
</button>
<style>
  .burger { width:40px; height:40px; display:grid; gap:6px; place-content:center; background:none; border:0; }
  .burger span { width:24px; height:2px; background:#111; }
  @media (prefers-reduced-motion: no-preference) {
    .burger span { transition: transform 200ms cubic-bezier(.2,0,0,1), opacity 150ms; }
  }
  .burger[aria-expanded="true"] span:nth-child(1){ transform: translateY(8px) rotate(45deg); }
  .burger[aria-expanded="true"] span:nth-child(2){ opacity:0; }
  .burger[aria-expanded="true"] span:nth-child(3){ transform: translateY(-8px) rotate(-45deg); }
</style>
<script>
  const b = document.querySelector('.burger');
  b.addEventListener('click', () =>
    b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') !== 'true'));
</script>
```

### (d) Tasteful entrance (fade + rise) with reduced-motion guard
```html
<div class="rise">Hello</div>
<style>
  .rise { opacity: 1; }                       /* fails safe: visible with no motion */
  @media (prefers-reduced-motion: no-preference) {
    .rise { opacity: 0; transform: translateY(12px);
            animation: rise 300ms cubic-bezier(0,0,0,1) forwards; }
    @keyframes rise { to { opacity: 1; transform: translateY(0); } }
  }
</style>
```

---

## 6. House-rules checklist (self-check before shipping a prototype — this is the gate)

- [ ] **Duration in band?** 100–300 ms for micro-interactions; up to ~400 ms only for large/long moves; never ≥500 ms for a micro-interaction.
- [ ] **Easing correct for direction?** ease-out (decelerate) on enter, ease-in (accelerate) on exit; no long ease-in on entrances.
- [ ] **Reduced-motion guard present?** Wrapped in `@media (prefers-reduced-motion: no-preference)` (or neutralized under `reduce`), and the resting state is usable with no motion.
- [ ] **Transform/opacity only?** No animating width/height/top/left/margin; movement via `translate`, size via `scale`.
- [ ] **`will-change` removed when idle?** Not baked into static CSS; toggled on/off, applied to few elements.
- [ ] **JS motion uses `requestAnimationFrame`** with timestamp-based progress (not setTimeout, not refresh-rate-dependent).
- [ ] **Purposeful, not decorative?** The motion explains a state change or guides attention; remove it if it doesn't.
- [ ] **No vestibular landmines?** No large-area parallax/spin/zoom that isn't gated by reduced-motion.

---

## Sources
- MDN — [`stroke-dasharray`](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray) · [`font-variation-settings`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variation-settings) · [`mask`](https://developer.mozilla.org/en-US/docs/Web/CSS/mask) · [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) · [`will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) · [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- web.dev — [Animations guide (compositor-only props)](https://web.dev/articles/animations-guide) · [The basics of easing](https://web.dev/articles/the-basics-of-easing)
- WCAG 2.1 — [Understanding 2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- NN/g — [Executing UX Animations: Duration and Motion Characteristics](https://www.nngroup.com/articles/animation-duration/)
- Material Design 3 — [Easing and duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) · [Motion.md exact values](https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md)
- CSS-Tricks — [How SVG Shape Morphing Works (point-count constraint)](https://css-tricks.com/svg-shape-morphing-works/)
