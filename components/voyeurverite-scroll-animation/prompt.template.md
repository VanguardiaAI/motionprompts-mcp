---
slug: voyeurverite-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 3
structural_literals: 3
structural:
  - { kind: stagger, literal: "-0.05", rule: stagger/shape }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# VoyeurVerite Scroll Animation — Pinned Rotating-Slit Hero over Five Viewports

## Goal
Build a full-screen editorial hero that is **pinned and scrubbed across five viewport heights**, driven by a **single manual `ScrollTrigger.onUpdate` handler** (NOT a `gsap.timeline`) that reads `self.progress` and hand-computes four sequential phases with `gsap.utils.clamp` + `gsap.utils.interpolate`. In order, as you scroll: a full-bleed foreground image **clips inward to a thin central vertical slit** while a dark overlay simultaneously **fades in over it** (so the slit goes black); the slit then **rotates to 65°**; then it **scales down to zero** while, behind it, two background text columns **slide apart** and a gold accent overlay **flash-fills the shrinking slit**; then two side-by-side outro images **wipe in via clip-path** (left one top-down, right one bottom-up); and finally, once scroll passes 90%, a **line-masked SplitText headline staggers up** with a real (non-scrubbed) tween. Smooth scroll via Lenis. Then a plain dark `about` section follows.

## Tech
Vanilla HTML/CSS/JS with ES module imports (fresh Vite project). Install and import from npm:
- **`gsap`** (3.x) plus the plugins **`ScrollTrigger`** and **`SplitText`**.
- **`lenis`** — smooth scroll.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);
```
No framework, no Three.js, no CustomEase. Everything runs at module top level (no `DOMContentLoaded` wrapper needed since the script is a deferred module).

## Layout / HTML
One `<section class="hero">` holding three stacked full-cover layers plus a following `<section class="about">`. Class names are load-bearing — the JS and CSS query them.

```html
<section class="hero">
  <!-- z-index 2, TOP layer: the clipping/rotating/scaling foreground -->
  <div class="hero-fg-content">
    <div class="hero-fg-img">
      <img src="…" alt="" />
    </div>
    <div class="hero-fg-header">
      <h1>Silhouettes against the burning dark</h1>
    </div>
    <div class="hero-fg-overlay-dark"></div>
    <div class="hero-fg-overlay"></div>
  </div>

  <!-- z-index 0, BOTTOM layer: two text columns revealed behind the slit -->
  <div class="hero-bg-content">
    <div class="hero-bg-content-col">
      <div class="hero-bg-content-copy">
        <h3>Motion</h3>
        <p>Bodies drawn through engineered light and open dark. Every frame caught between the signal and the shadow that it quietly leaves behind.</p>
      </div>
    </div>
    <div class="hero-bg-content-col">
      <div class="hero-bg-content-copy">
        <h3>Silence</h3>
        <p>Stillness measured in reflected color and slow heat. Where the moving crowd dissolves and only the burning outline holds against the night.</p>
      </div>
    </div>
  </div>

  <!-- z-index 1, MIDDLE layer: two outro images + centered headline -->
  <div class="hero-outro-content">
    <div class="hero-outro-img"><img src="…" alt="" /></div>
    <div class="hero-outro-img"><img src="…" alt="" /></div>
    <div class="hero-outro-header">
      <h3>You become the shape that the light finally learns to find.</h3>
    </div>
  </div>
</section>

<section class="about">
  <h3>A studio built for image, motion, and the quiet glow that keeps burning after.</h3>
</section>

<script type="module" src="./script.js"></script>
```

Use the neutral demo copy above verbatim (uppercase editorial prose). "VoyeurVerite" is only the fictional demo name — it never appears in visible text. No real brands.

## Styling
Font: **Hanken Grotesk** (Google Fonts), imported via `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap");` — or self-hosted, which is what the published demo does.

Palette (exact CSS variables — the dark overlay must match `--base-300`, the accent overlay must match `--base-200`):
```css
:root {
  --base-100: #dcdbd5;  /* pale warm grey — page/bg-content background, header + about text */
  --base-200: #e1c81a;  /* gold/chartreuse accent — the flash overlay + bg-content h3 color */
  --base-300: #1a0401;  /* near-black oxblood — fg-content bg, dark overlay, dark text, about bg */
}
```

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1, h3 { text-transform:uppercase; font-family:"Hanken Grotesk", sans-serif; font-weight:500; line-height:0.8; letter-spacing:-3%; }`
- `h1 { font-size: clamp(2rem, 8vw, 14rem); }`
- `h3 { font-size: clamp(2rem, 5vw, 8rem); }`
- `p { text-transform:uppercase; font-family:"Hanken Grotesk", sans-serif; font-size:0.85rem; font-weight:500; line-height:1.1; }`
- `section { position:relative; width:100%; height:100svh; overflow:hidden; }`

Stacking layers — `.hero-fg-content` and `.hero-bg-content` share `position:absolute; top:0; left:0; width:100%; height:100%; transform-origin:center center;`. The three hero layers stack by z-index:
- `.hero-fg-content` — **z-index:2** (top). `background-color:var(--base-300); clip-path:polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); will-change:clip-path, transform;` — starts as a full-screen rectangle (no clipping). `transform-origin:center center` matters for the later rotate + scale.
- `.hero-bg-content` — **z-index:0** (bottom). `display:flex; background-color:var(--base-100);`
- `.hero-outro-content` — **z-index:1** (middle). `position:absolute; top:0; left:0; width:100%; height:100%; display:flex;`

Foreground internals:
- `.hero-fg-img { position:absolute; width:100%; height:100%; }` — the full-bleed hero photo.
- `.hero-fg-header { position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:95%; padding:2rem; color:var(--base-100); text-align:center; }` — the big `h1` pinned to the bottom-center.
- `.hero-fg-overlay-dark, .hero-fg-overlay { position:absolute; top:0; left:0; width:100%; height:100%; opacity:0; will-change:opacity; }` — **both start fully transparent.** `.hero-fg-overlay-dark { background-color:var(--base-300); }` (dark), `.hero-fg-overlay { background-color:var(--base-200); }` (gold accent). Both sit inside `.hero-fg-content`, so they are clipped by its clip-path (they only ever show inside the slit).

Background text columns:
- `.hero-bg-content-col { flex:1; height:100%; display:flex; align-items:center; padding:2rem; }`
- `.hero-bg-content-col:nth-child(2) { justify-content:flex-end; }` — second column right-aligned.
- `.hero-bg-content-copy { display:flex; flex-direction:column; gap:0.5rem; width:50%; will-change:transform; }`
- `.hero-bg-content-copy h3 { color:var(--base-200); }` (gold), `.hero-bg-content-copy p { color:var(--base-300); }` (dark). Left column reads "Motion" top-left; right column reads "Silence", pushed to the right edge.

Outro images (side-by-side, each half width) — **initial clip-paths are the collapsed starting states GSAP grows from:**
- `.hero-outro-img { flex:1; height:100%; will-change:clip-path; }`
- `.hero-outro-img:nth-child(1) { clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%); }` — **zero-height, collapsed to the TOP edge** (invisible; reveals downward).
- `.hero-outro-img:nth-child(2) { clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%); }` — **zero-height, collapsed to the BOTTOM edge** (invisible; reveals upward).
- `.hero-outro-header { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:var(--base-100); text-align:center; width:60%; }` — centered headline overlaid on the two images.
- `.hero-outro-header .line { position:relative; will-change:transform; }` — the class SplitText assigns to each masked line.

`.about`:
- `background-color:var(--base-300); display:flex; justify-content:center; align-items:center;`
- `.about h3 { text-align:center; color:var(--base-100); width:60%; }`

Responsive `@media (max-width:1000px)`:
- `.hero-bg-content-copy { width:100%; }`
- `.hero-bg-content-col:nth-child(1) .hero-bg-content-copy { margin-top:-50svh; }` (nudge first column up)
- `.hero-bg-content-col:nth-child(2) .hero-bg-content-copy { margin-top:50svh; }` (nudge second column down)
- `.about h3, .hero-outro-header { width:100%; padding:2rem; }`

## GSAP effect (the important part — be exhaustive)

### Smooth-scroll wiring (Lenis ↔ GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

### SplitText setup (masked lines, hidden below)
```js
const outroHeaderSplit = SplitText.create(".hero-outro-header h3", {
  type: "lines",
  mask: "lines",         // each line wrapped in an overflow-clipping mask
  linesClass: "line",
});
gsap.set(outroHeaderSplit.lines, { y: "100%" });   // all lines start pushed fully below their mask (hidden)
```

### Cache the animated elements
```js
const fgContent      = document.querySelector(".hero-fg-content");
const fgOverlayDark   = document.querySelector(".hero-fg-overlay-dark");
const fgOverlayAccent = document.querySelector(".hero-fg-overlay");
const bgCopyLeft      = document.querySelectorAll(".hero-bg-content-copy")[0];
const bgCopyRight     = document.querySelectorAll(".hero-bg-content-copy")[1];
const outroImgTop     = document.querySelectorAll(".hero-outro-img")[0];   // left image
const outroImgBottom  = document.querySelectorAll(".hero-outro-img")[1];   // right image
let areOutroLinesRevealed = false;   // latch so the headline tween fires only once per crossing
```

### The single ScrollTrigger — pinned, scrubbed, hand-driven via `onUpdate`
```js
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${window.innerHeight * 5}px`,   // scroll runway = 5 viewport heights
  pin: true,
  pinSpacing: true,                        // ScrollTrigger inserts the spacer (no manual margin runway)
  scrub: 1,                                // 1s catch-up smoothing on the scrub
  onUpdate: (self) => {
    const scrollProgress = self.progress;  // 0 → 1 across the 5vh runway
    /* four phases, computed below */
  },
});
```
Every property below is set imperatively with `gsap.set(...)` inside `onUpdate` — there is **no timeline and no per-tween ease**; motion is purely the scroll-position → progress mapping, so it is linear within each phase and freezes wherever the scroll parks. Each phase carves out a sub-range of `scrollProgress` via `clamp(0, 1, (scrollProgress - start) / span)` and drives values with `gsap.utils.interpolate(from, to, phaseProgress)`.

**Phase 1 — slit clip + dark overlay fade-in.** Range `[0, 0.25]`: `phase1Progress = clamp(0, 1, scrollProgress / 0.25)`.
- Clip the foreground inward to a central vertical slit:
  ```js
  const slitLeftEdge  = interpolate(0, 48, phase1Progress);    // 0% → 48%
  const slitRightEdge = interpolate(100, 52, phase1Progress);  // 100% → 52%
  gsap.set(fgContent, {
    clipPath: `polygon(${slitLeftEdge}% 0%, ${slitRightEdge}% 0%, ${slitRightEdge}% 100%, ${slitLeftEdge}% 100%)`,
  });
  ```
  So the full rectangle narrows to a **4%-wide full-height slit** (48%→52%) at screen center. Outside the slit, the z:0 cream `.hero-bg-content` (the "Motion"/"Silence" columns) shows through.
- Simultaneously fade the dark overlay in over the slit contents:
  ```js
  gsap.set(fgOverlayDark, { opacity: interpolate(0, 1, phase1Progress) });   // 0 → 1
  ```
  By the end of phase 1 the slit is a solid dark bar (the hero image inside it is fully darkened).

**Phase 2 — rotate the slit.** Range `[0.25, 0.45]`: `phase2Progress = clamp(0, 1, (scrollProgress - 0.25) / 0.2)`.
```js
gsap.set(fgContent, { rotate: interpolate(0, 65, phase2Progress) });   // 0° → 65°
```
The whole (now dark, slit-clipped) foreground rotates about its center from 0° to **65°**.

**Phase 3 — scale the slit to zero + slide the text columns apart + accent flash.** Range `[0.45, 0.65]`: `phase3Progress = clamp(0, 1, (scrollProgress - 0.45) / 0.2)`.
- Shrink the rotated slit to nothing:
  ```js
  gsap.set(fgContent, { scale: interpolate(1, 0, phase3Progress) });   // 1 → 0
  ```
- Slide the two background copy blocks apart along X (they've been visible behind the slit this whole time):
  ```js
  gsap.set(bgCopyLeft,  { x: `${interpolate(0, 100, phase3Progress)}%` });    // left copy →  +100%
  gsap.set(bgCopyRight, { x: `${interpolate(0, -100, phase3Progress)}%` });   // right copy → −100%
  ```
- **Accent flash** — a faster sub-phase `[0.45, 0.50]`: `phase3OverlayProgress = clamp(0, 1, (scrollProgress - 0.45) / 0.05)`:
  ```js
  gsap.set(fgOverlayAccent, { opacity: interpolate(0, 1, phase3OverlayProgress) });   // 0 → 1 over just 5% of scroll
  ```
  The gold `--base-200` overlay snaps to full opacity inside the first quarter of phase 3, so the slit flashes gold right as it begins collapsing/shrinking away.

**Phase 4 — outro images wipe in.** Range `[0.65, 0.85]`: `phase4Progress = clamp(0, 1, (scrollProgress - 0.65) / 0.2)`.
- Left image reveals top-down (its bottom clip edge grows):
  ```js
  const topImgBottomEdge = interpolate(0, 100, phase4Progress);   // 0% → 100%
  gsap.set(outroImgTop, {
    clipPath: `polygon(0% 0%, 100% 0%, 100% ${topImgBottomEdge}%, 0% ${topImgBottomEdge}%)`,
  });
  ```
- Right image reveals bottom-up (its top clip edge shrinks):
  ```js
  const bottomImgTopEdge = interpolate(100, 0, phase4Progress);   // 100% → 0%
  gsap.set(outroImgBottom, {
    clipPath: `polygon(0% ${bottomImgTopEdge}%, 100% ${bottomImgTopEdge}%, 100% 100%, 0% 100%)`,
  });
  ```
  The two half-width images (z:1, above the cream bg-content) fill in from opposite vertical edges toward full coverage.

**Outro headline reveal — real tween, latched at 90%.** This is NOT scrubbed; it is a genuine `gsap.to` fired once when progress crosses 0.9 in either direction:
```js
if (scrollProgress >= 0.9 && !areOutroLinesRevealed) {
  areOutroLinesRevealed = true;
  gsap.to(outroHeaderSplit.lines, {
    y: "0%",           // rise up into view from behind the mask
    duration: {{motion.duration.base}},
    stagger: {{motion.stagger.base}},      // top line first, each subsequent line +0.1s
    ease: "power3.out",
  });
} else if (scrollProgress < 0.9 && areOutroLinesRevealed) {
  areOutroLinesRevealed = false;
  gsap.to(outroHeaderSplit.lines, {
    y: "100%",         // drop back below the mask
    duration: {{motion.duration.fast}},
    stagger: -0.05,    // reverse order, faster
    ease: "power3.out",
  });
}
```
So the masked headline lines slide up (staggered, `power3.out`) when you scroll past 90% and slide back down (quicker, reversed stagger) if you scroll back up past that line.

**No CustomEase, no lerp/rAF loop, no Three.js.** The entire effect is one pinned, scrubbed ScrollTrigger whose `onUpdate` hand-drives clip-path / opacity / rotate / scale / x with `interpolate`, plus the one latched SplitText line tween.

## Assets / images
Three **full-bleed silhouette-against-engineered-light editorial photos**, `object-fit: cover`. Every image is a dark near-black frame dominated by warm orange-to-red light, with a single human head-and-shoulders in flat black profile silhouette — cohesive enough to read as one campaign:
- **`hero` (foreground)** — the single hero photo that gets clipped to a slit, rotated and scaled away. Fills the whole viewport (source ~landscape/16:9; cover crops it). A head-and-shoulders profile silhouette facing left at center, backed by two bright orange-red spotlight beams crossing in a large **X** shape over a black stage; dominant colors are vivid red/orange against black.
- **`outro image 1` (left)** — revealed top-down. Fills a half-width, full-height column (renders ~portrait/2:3 under cover). A profile silhouette pushed to the right edge, facing left over a soft field of glowing **out-of-focus orange/amber bokeh circles** filling the left of the frame on black.
- **`outro image 2` (right)** — revealed bottom-up. Same half-width column (~portrait/2:3). A profile silhouette on the left edge facing right, with **two orange-red light beams crossing behind it** — one bright horizontal streak and one diagonal shaft — over a deep red-black background.

Warm-dark palette throughout (flat black silhouettes + orange/red glow, no other hues). No brands or logos. If you have fewer than three, repeat.

## Behavior notes
- **Trigger:** scroll only. The four phases are fully scrubbed (park the scroll and the sequence freezes mid-phase; reverse and it plays back). Only the outro headline is a discrete tween latched at the 90% mark.
- **Fresh load (progress 0):** the foreground is a full rectangle showing the hero photo + the bottom-center `h1`; the dark and accent overlays are transparent; both outro images are clipped to zero; all headline lines sit hidden below their masks.
- **`pinSpacing: true`** means ScrollTrigger creates the scroll spacer itself — do NOT add a manual `margin-top` runway on `.about`. The runway length is `window.innerHeight * 5`.
- **Heights use `svh`** so mobile browser chrome doesn't break the full-screen layout.
- Keep every `will-change` hint (`clip-path, transform` on fg-content; `opacity` on both overlays; `clip-path` on outro images; `transform` on bg copies and `.line`) — they matter for smooth clip-path/opacity animation.
- No reduced-motion guard in the original. Effect runs at all viewport sizes; the `max-width:1000px` rules only re-flow the background copy columns.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/voyeurverite-scroll-animation/hero-outro-img-1.jpg
https://motionprompts.dev/c/voyeurverite-scroll-animation/hero-outro-img-2.jpg
https://motionprompts.dev/c/voyeurverite-scroll-animation/hero.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--base-100`, `--base-200`, `--base-300`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs at module scope, wires Lenis into the GSAP ticker, splits the outro headline once, and then drives an entire five-phase pinned reveal — clip, rotate, scale, slide, wipe — from a single `ScrollTrigger`'s `onUpdate`, and it never has to undo any of it because the page it lives on never unmounts. React withdraws that guarantee, and it does it quietly: the hero pins and scrubs correctly on first load, and the damage only shows up on the second StrictMode pass or a real route change.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Mount this component twice without tearing the first pass down and you get two pinned `ScrollTrigger`s on the same `.hero`, each inserting its own pin-spacer and each claiming its own five-viewport-height runway; two `onUpdate` handlers writing clip-path, rotate, scale, opacity and `x` to the same seven elements on every scrub tick; and two `Lenis` instances pulling on the same wheel event. The visible symptom is a hero pinned for twice the scroll distance it should cover, or the slit and the rotation jittering between two disagreeing writes mid-scrub — and it will not reproduce in a production build, since React only double-invokes in development.

*(1) The entry point* — the whole script runs the instant the module is evaluated: `gsap.registerPlugin`, the `Lenis` construction and ticker wiring, the `SplitText.create` call and its initial `gsap.set(..., { y: "100%" })`, the seven element lookups, and the single `ScrollTrigger.create`. In React that is import time, before this component has rendered `.hero-fg-content` or any of the layers beneath it, so every lookup returns `null` and the trigger never gets created — no error, nothing to debug. Move the split, the lookups, and the `ScrollTrigger.create` call into a `useEffect` with an empty dependency array; leave `gsap.registerPlugin(ScrollTrigger, SplitText)` at module scope, since registering it once per app load, not once per mount, is what it's for.

*(2) Element lookups* — `fgContent`, `fgOverlayDark`, `fgOverlayAccent`, the two `.hero-bg-content-copy` blocks, the two `.hero-outro-img` elements, and the `SplitText` target `.hero-outro-header h3` are all resolved with unscoped `document.querySelector`/`querySelectorAll`, and the trigger itself is handed to `ScrollTrigger.create` as the bare string `".hero"`. Give the component a root `ref` directly on the `<section class="hero">` element — it is already the thing being pinned — and resolve the other seven lookups from it (`rootRef.current.querySelector(...)`), passing the ref's own node as `trigger` instead of the class string. During the StrictMode remount two `.hero` sections exist for an instant; an unscoped lookup or a bare selector can bind the pin, the layer references `onUpdate` closes over, or the `SplitText` target to the copy on its way out, while the surviving copy's own elements never get touched by any of the four phases.

*(3) Cleanup* — wrap the split and the trigger creation in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  let split;
  const ctx = gsap.context(() => {
    split = SplitText.create(".hero-outro-header h3", {
      type: "lines",
      mask: "lines",
      linesClass: "line",
    });
    gsap.set(split.lines, { y: "100%" });

    ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top top",
      end: `+=${window.innerHeight * 5}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: handleScrollUpdate, // the four phases, unchanged
    });
  }, rootRef);

  return () => {
    gsap.killTweensOf(split.lines);
    ctx.revert();
    gsap.set(
      [fgContent, fgOverlayDark, fgOverlayAccent, bgCopyLeft, bgCopyRight, outroImgTop, outroImgBottom],
      { clearProps: "all" },
    );
    split.revert();
  };
}, []);
```

`ctx.revert()` unpins `.hero`, removes the spacer `pinSpacing` inserted, and kills the trigger — that much is automatic. It does not touch anything `onUpdate` itself wrote: the clip-path on `fgContent`, the opacity on both overlays, the rotate and scale also on `fgContent`, the `x` on both copy blocks, and the clip-path on both outro images. `gsap.context` only adopts what gets created during the synchronous pass through its factory — the initial `gsap.set(split.lines, { y: "100%" })` above qualifies, so the revert does undo that one — but `onUpdate` runs later, once per scroll tick, long after the factory has returned, so every one of the seven `gsap.set()` calls it makes on each tick is invisible to the context. Clear those properties by hand after the revert, or a remount landing on the same DOM node — which is exactly what the StrictMode double-invoke does, since it never actually discards and recreates the tree — starts its fresh trigger with the previous pass's rotation, scale and clip-path still baked into the inline style, frozen there until a later scroll delta happens to re-touch that particular phase.

The same blind spot swallows the outro headline's own tween. The `gsap.to(...)` that raises and drops `split.lines` is not called from inside the factory either — it fires from `onUpdate`, once `scrollProgress` crosses the ninety-percent mark in either direction — so `ctx.revert()` has no record of it. If that crossing happened before unmount, the tween is still running when the effect tears down, still writing `y` to line spans the `SplitText` revert is about to unwrap underneath it. Kill it explicitly before reverting anything else, with `gsap.killTweensOf(split.lines)`.

`split.revert()` itself needs to happen regardless of whether that tween ever fired, and for a separate reason: `SplitText.create()` is not undone by `ctx.revert()`. Because the StrictMode double-invoke reuses the same `h3` node instead of recreating it, a second `SplitText.create(".hero-outro-header h3", ...)` without an intervening revert would split the already-split markup — the `mask: "lines"` wrappers from the first pass are still there, so the second pass nests a wrapper inside a wrapper, and the hidden starting offset ends up applied to a `.line` element sized against the wrong box.

**Lenis** — this component owns the smooth-scroll instance outright; nothing else on this page needs one. Create it inside the same effect and destroy it in the same cleanup, but remove the ticker callback first, keeping the exact function reference `gsap.ticker.add` was given:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
```

Skip the removal, or destroy `Lenis` before removing the callback, and a tick landing between the two calls invokes `.raf()` on an instance already torn down. `lenis.on("scroll", ScrollTrigger.update)` needs no teardown of its own — that listener lives on Lenis's own emitter, so `destroy()` clears it as a side effect. `gsap.ticker.lagSmoothing(0)` is a global GSAP setting, not one scoped to this component; restore GSAP's own default in the same cleanup, or every other GSAP animation on the page keeps running with lag smoothing disabled after this hero unmounts. And if this hero ever becomes one section inside a larger app rather than the whole page, lift the `Lenis` instance to the app shell instead of constructing a second one here — two instances fight over the same wheel event, and `ScrollTrigger.update` ends up wired to whichever one last called it.

The outro headline is set in Hanken Grotesk, loaded through the `@import` at the top of the stylesheet — not a font this effect currently waits on. `SplitText.create` measures each line's box the instant it runs; if that happens before the face has painted, `mask: "lines"` wraps boxes sized against the fallback sans-serif, and once the real face paints over it, the hidden starting offset this component computed against the fallback's line height no longer lines up with the mask it's supposed to hide behind. Gate the split behind `document.fonts.ready`, guarded by the same cancellation flag any promise that can resolve after unmount needs here, so a StrictMode unmount landing before the font resolves doesn't split — and then animate — a headline no longer in the tree.
