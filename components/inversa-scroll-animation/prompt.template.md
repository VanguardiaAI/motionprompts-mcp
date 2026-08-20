---
slug: inversa-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Inversa Scroll Animation

## Goal
Build a single pinned hero that plays a **scroll-scrubbed "map framing" sequence** driven entirely by one `ScrollTrigger.onUpdate` handler doing hand-written smoothstep math (no tweens, no timeline). As you scroll four viewport-heights of pinned distance: a column of four stacked text blocks **slides up** through the viewport; a very tall (200svh) aerial photo **parallaxes in the opposite direction** (it drifts *down* while the text goes *up* — this counter-motion is the "inversa" idea); a fixed dark layer carrying a **subtractive vertical-bar SVG mask scales from 2.5 → 1** to squeeze the photo into a narrow bar-code-shaped window while the photo simultaneously **desaturates to grayscale and darkens**; and a **blueprint grid overlay**, **two pulsing location markers**, and a **vertical progress bar** fade in during the middle "analysis" phase, then everything reverses — the mask scales back to 2.5, color returns, overlays clear — as the sequence resolves. Smooth scroll via Lenis. A short outro section follows once the pin releases.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scroll. No other plugins, no framework, no Three.js, no SplitText/CustomEase. Plain Vite-style module imports:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```
Register once at top level: `gsap.registerPlugin(ScrollTrigger);`. Wrap all setup in a `DOMContentLoaded` listener.

## Layout / HTML
Two `<section>` elements only — a tall pinned `.hero` and a short `.outro`:

```html
<section class="hero">
  <div class="hero-img"><img src="…hero-img" alt="" /></div>   <!-- 200svh photo, anchored bottom -->
  <div class="hero-mask"></div>                                 <!-- fixed dark layer w/ subtractive SVG mask -->
  <div class="hero-grid-overlay"><img src="…grid-overlay.svg" alt="" /></div>

  <div class="marker marker-1">
    <span class="marker-icon"></span>
    <p class="marker-label">Anchor Field</p>
  </div>
  <div class="marker marker-2">
    <span class="marker-icon"></span>
    <p class="marker-label">Drift Field</p>
  </div>

  <div class="hero-content">                                    <!-- 400svh tall, flex column of 4 blocks -->
    <div class="hero-content-block">
      <div class="hero-content-copy"><h1>Location Framework</h1></div>
    </div>
    <div class="hero-content-block">
      <div class="hero-content-copy"><h2>Coordinate Mapping</h2><p>…</p></div>
    </div>
    <div class="hero-content-block">
      <div class="hero-content-copy"><h2>Active Locations</h2><p>…</p></div>
    </div>
    <div class="hero-content-block">
      <div class="hero-content-copy"><h2>Spatial Center</h2><p>…</p></div>
    </div>
  </div>

  <div class="hero-scroll-progress-bar"></div>
</section>

<section class="outro"><p>The system has reached its final spatial state.</p></section>
```

Roles / order (DOM order = paint order, no z-index used):
- `.hero-img` paints at the back (the photo). `.hero-mask` sits over it (the dark framing layer). `.hero-grid-overlay`, the two `.marker`s, `.hero-content`, and the progress bar layer over that.
- **`.hero-content`** is one tall (400svh) flex column holding **four full-viewport `.hero-content-block`s**; each block holds a `.hero-content-copy`. Block 1 = an `<h1>` only; blocks 2–4 = `<h2>` + `<p>`.
- Two **markers**, each a small dot (`.marker-icon`) plus an uppercase mono label (`.marker-label`). Marker 1 = "Anchor Field", marker 2 = "Drift Field".

Neutral fictional copy (invent nothing brand-related):
- Block 1 `h1`: "Location Framework"
- Block 2 `h2`: "Coordinate Mapping"; `p`: *"Terrain data is interpreted through directional vectors. Movement responds to relative position rather than absolute distance."*
- Block 3 `h2`: "Active Locations"; `p`: *"Key points are indexed within the field. Each location functions as a reference for spatial alignment and transition logic."*
- Block 4 `h2`: "Spatial Center"; `p`: *"The system converges toward a balanced focal region. Motion decelerates as positional variance reaches equilibrium."*
- `.outro p`: "The system has reached its final spatial state."

## Styling
Import fonts:
```css
@import url("https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap");
```

Palette (CSS variables on `:root`):
- `--light: #fff`
- `--dark: #141414`
- `--accent-1: #dcdc35` (acid yellow — marker 1)
- `--accent-2: #76ef78` (mint green — marker 2)

Body: `font-family: "DM Sans", sans-serif; background:#141414; color:#fff;`. Hide scrollbars (`::-webkit-scrollbar { display:none; }`).

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`

Typography:
- `h1, h2 { font-weight:400; line-height:1.1; }`
- `h1 { font-size: clamp(3rem, 4vw, 5rem); }`
- `h2 { font-size: clamp(1.5rem, 2.25vw, 3rem); }`
- `p { font-size:1.125rem; font-weight:400; line-height:1.4; }`

Sections:
- `section { position:relative; width:100%; height:100svh; background:#141414; overflow:hidden; }`
- `.outro { display:flex; justify-content:center; align-items:center; }`

The hero layers (this geometry is what the effect hangs on):

- **`.hero-img`** — `position:absolute; bottom:0; width:100%; height:200svh; will-change:transform;` and a custom prop `--overlay-opacity:0.35`. It has a **`::after` dark scrim**: absolutely fills the element, `background:#141414; opacity:var(--overlay-opacity); will-change:opacity;`. The inner `img` has `will-change:filter;`. Because the element is 200svh tall and anchored `bottom:0`, at rest its top edge sits one viewport-height *above* the top of the screen; positive `y` translate slides it *down* to reveal its upper portion.

- **`.hero-mask`** — `position:fixed; top:0; left:0; width:100%; height:100svh; background:#141414; pointer-events:none; will-change:transform;` masked with a **two-layer subtractive mask**:
  ```css
  mask: linear-gradient(#fff, #fff), url("…mask.svg") center/50% no-repeat;
  -webkit-mask: linear-gradient(#fff, #fff), url("…mask.svg") center/50% no-repeat;
  mask-composite: subtract;
  -webkit-mask-composite: subtract;
  ```
  The solid gradient layer paints the whole dark rectangle; the SVG bar pattern (centered, sized 50% of the element) is **subtracted** from it — so the dark layer is punched full of **vertical slits** shaped like the SVG bars, and the photo shows through those slits while everything else stays dark. Scaling this element (via GSAP `scale`) scales the whole masked result, growing/shrinking those slits.

- **`.hero-grid-overlay`** — `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:55%; will-change:opacity;`. Its `img` has `opacity:0.25` (a faint blueprint grid). Element opacity is driven by GSAP.

- **`.marker`** — `position:absolute; transform:translate(-50%,-50%); display:flex; align-items:center; gap:1rem; will-change:opacity;`.
  - `.marker-1 { top:50svh; left:50vw; }` uses `--accent-1`; `.marker-2 { top:35svh; left:60vw; }` uses `--accent-2`.
  - `.marker-label { text-transform:uppercase; font-family:"DM Mono"; font-size:0.7rem; font-weight:500; padding:0.25rem 0.5rem; border-radius:0.25rem; }` — filled with the accent color (marker 1 label text `#fff`, marker 2 label text `#141414`).
  - `.marker-icon { position:relative; width:0.5rem; height:0.5rem; border-radius:2rem; }` filled with the accent color, plus a **`::before` pulsing ping ring**: absolutely centered, `width:10rem; height:10rem; border-radius:100%;` filled with the accent color, animated `animation: pulse 1.5s cubic-bezier(0.2,0.6,0.35,1) infinite;`. Keyframes:
    ```css
    @keyframes pulse {
      0%   { transform: translate(-50%,-50%) scale(0.25); }
      80%,100% { opacity: 0; }
    }
    ```
    (This ping is a pure CSS loop, independent of scroll.)

- **`.hero-content`** — `position:absolute; top:0; left:0; width:100%; height:400svh; display:flex; flex-direction:column; will-change:transform;`.
  - `.hero-content-block { width:100%; height:100svh; padding:4rem; display:flex; }`
  - `.hero-content-copy { width:35%; display:flex; flex-direction:column; gap:0.25rem; }`
  - Per-block alignment: block 1 `align-items:flex-end` (copy hugs bottom-left); blocks 2 & 4 `justify-content:flex-end; align-items:center` (copy on the right, vertically centered); block 3 `align-items:center` (copy left, vertically centered).

- **`.hero-scroll-progress-bar`** — `position:absolute; top:50%; right:2rem; transform:translateY(-50%); width:0.1rem; height:10rem; background:rgba(255,255,255,0.2);` with a custom prop `--progress:0`. Its `::after` is a white fill: `width:100%; height:100%; background:#fff; transform-origin:top; transform:scaleY(var(--progress)); will-change:transform;` — fills top→bottom as `--progress` goes 0→1.

Responsive `@media (max-width:800px)`: mask SVG sized `center/75%` instead of `50%`; grid overlay `width:100%`; marker-1 `top:52.5svh/left:50vw`, marker-2 `top:45svh/left:70vw`; block padding `1.5rem`; copy `width:75%`; progress bar `right:1rem`.

## GSAP effect (the important part — be exhaustive)

### Smooth-scroll wiring (Lenis driven by GSAP ticker)
```js
const lenis = new Lenis({ autoRaf: false });
lenis.on("scroll", ScrollTrigger.update);        // keep ScrollTrigger synced to Lenis
gsap.ticker.add((time) => { lenis.raf(time * 1000); });  // Lenis rAF driven by GSAP ticker (ms)
gsap.ticker.lagSmoothing(0);                     // disable lag smoothing so scrub stays glued
```
Note `autoRaf:false` — Lenis does not run its own rAF; the GSAP ticker drives it.

### Cache elements & measurements (read once at load)
```js
const heroContent      = document.querySelector(".hero-content");
const heroImg          = document.querySelector(".hero-img");
const heroImgElement   = document.querySelector(".hero-img img");
const heroMask         = document.querySelector(".hero-mask");
const heroGridOverlay  = document.querySelector(".hero-grid-overlay");
const marker1          = document.querySelector(".marker-1");
const marker2          = document.querySelector(".marker-2");
const progressBar      = document.querySelector(".hero-scroll-progress-bar");

const heroContentMovedistance = heroContent.offsetHeight - window.innerHeight; // ≈ 300svh in px
const heroImgMovedistance     = heroImg.offsetHeight     - window.innerHeight; // ≈ 100svh in px
```

### The smoothstep easing helper (used everywhere below)
```js
const ease = (x) => x * x * (3 - 2 * x);   // classic smoothstep, eases both ends of a 0→1 ramp
```

### The single ScrollTrigger (pin + scrub — ALL work happens by hand in `onUpdate`)
There is **no timeline and no tweens**. Every property is recomputed each frame from `self.progress` with `gsap.set`. Reproduce the exact phase math below; do not substitute `.to()` tweens.
```js
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${window.innerHeight * 4}px`,  // pinned for 4 viewport-heights of scroll
  pin: true,
  pinSpacing: true,
  scrub: 1,                              // 1s catch-up smoothing on the scrub
  onUpdate: (self) => {
    const p = self.progress;             // 0 → 1 across the pinned range
    /* … all mappings below … */
  },
});
```

Inside `onUpdate`, in this order:

**1) Progress bar** — linear, 1:1 with scroll:
```js
gsap.set(progressBar, { "--progress": p });
```

**2) Text column slide-up** — linear:
```js
gsap.set(heroContent, { y: -p * heroContentMovedistance });
```
The 400svh column translates up by up to 300svh, scrolling the four text blocks past the viewport one after another. Strictly linear (no `ease`).

**3) Photo parallax (counter-motion) — 3 phases, smoothstepped:**
```js
let imgP;
if (p <= 0.45)      imgP = ease(p / 0.45) * 0.65;                 // 0 → 0.65 (smoothstep)
else if (p <= 0.75) imgP = 0.65;                                  // held
else                imgP = 0.65 + ease((p - 0.75) / 0.25) * 0.35; // 0.65 → 1.0 (smoothstep)
gsap.set(heroImg, { y: imgP * heroImgMovedistance });            // positive y → photo drifts DOWN
```
`imgP` is a 0→1 fraction of the photo's 100svh of extra travel: it ramps to 0.65 by progress 0.45, **holds** through 0.75, then completes to 1.0 by progress 1. Because the text moves *up* while the photo moves *down*, the two run opposite directions — the signature "inversa" parallax.

**4) Mask scale + photo desaturation + scrim darkening — 5 phases, smoothstepped in the two transitions:**
```js
let maskScale, saturation, overlayOpacity;
if (p <= 0.4) {                          // Phase A — full color, unframed
  maskScale = 2.5; saturation = 1; overlayOpacity = 0.35;
} else if (p <= 0.5) {                    // Transition 1 (0.4→0.5): frame + drain color + darken
  const t = ease((p - 0.4) / 0.1);
  maskScale     = 2.5 - t * 1.5;          // 2.5 → 1
  saturation    = 1 - t;                   // 1   → 0
  overlayOpacity= 0.35 + t * 0.35;         // 0.35 → 0.7
} else if (p <= 0.75) {                   // Phase B — held: tight bar-code frame, grayscale, dark
  maskScale = 1; saturation = 0; overlayOpacity = 0.7;
} else if (p <= 0.85) {                   // Transition 2 (0.75→0.85): unframe + restore color + lighten
  const t = ease((p - 0.75) / 0.1);
  maskScale     = 1 + t * 1.5;            // 1   → 2.5
  saturation    = t;                       // 0   → 1
  overlayOpacity= 0.7 - t * 0.35;          // 0.7 → 0.35
} else {                                  // Phase C — back to full color, unframed
  maskScale = 2.5; saturation = 1; overlayOpacity = 0.35;
}
gsap.set(heroMask,       { scale: maskScale });
gsap.set(heroImgElement, { filter: `saturate(${saturation})` });
gsap.set(heroImg,        { "--overlay-opacity": overlayOpacity });
```
At `maskScale 2.5` the subtracted slits are enlarged enough to clear the whole viewport (photo essentially unobscured); at `maskScale 1` the slits shrink to their natural centered size, so the dark layer squeezes the photo into a **narrow vertical bar-code window** in the middle. In lock-step the photo goes from full color to grayscale (`saturate(1)`→`saturate(0)`) and its scrim darkens (`0.35`→`0.7`), then all three reverse in Transition 2.

**5) Grid overlay opacity — fast smoothstep in/out inside the held phase:**
```js
let gridO;
if (p <= 0.475)      gridO = 0;
else if (p <= 0.5)   gridO = ease((p - 0.475) / 0.025);        // 0 → 1 (over just 2.5% of scroll)
else if (p <= 0.75)  gridO = 1;
else if (p <= 0.775) gridO = 1 - ease((p - 0.75) / 0.025);     // 1 → 0
else                 gridO = 0;
gsap.set(heroGridOverlay, { opacity: gridO });
```

**6) Marker 1 opacity — appears at 0.5, gone by 0.75:**
```js
let m1;
if (p <= 0.5)        m1 = 0;
else if (p <= 0.525) m1 = ease((p - 0.5) / 0.025);            // 0 → 1
else if (p <= 0.7)   m1 = 1;
else if (p <= 0.75)  m1 = 1 - ease((p - 0.7) / 0.05);          // 1 → 0
else                 m1 = 0;
gsap.set(marker1, { opacity: m1 });
```

**7) Marker 2 opacity — same shape, staggered ~0.05 later on the entrance:**
```js
let m2;
if (p <= 0.55)       m2 = 0;
else if (p <= 0.575) m2 = ease((p - 0.55) / 0.025);          // 0 → 1
else if (p <= 0.7)   m2 = 1;
else if (p <= 0.75)  m2 = 1 - ease((p - 0.7) / 0.05);         // 1 → 0
else                 m2 = 0;
gsap.set(marker2, { opacity: m2 });
```

### The choreography summary (what a viewer sees across the 4-vh pin)
- **0 → 0.4** — text blocks slide up; photo parallaxes in (down) to 65% of its travel by 0.45; mask held at 2.5 (photo full-frame, full color, light scrim). Intro/reveal.
- **0.4 → 0.5** — the "framing" beat: mask 2.5→1 squeezes the photo into the bar-code window, photo desaturates to grayscale, scrim darkens; the grid overlay pops in (0.475→0.5) and marker 1 begins to appear at 0.5.
- **0.5 → 0.75** — held "analysis / map" state: tight bar-code frame, grayscale + dark photo, grid visible, both markers visible (marker 1 from 0.525, marker 2 from 0.575), photo parallax frozen at 0.65. Markers fade out 0.7→0.75; grid fades out 0.75→0.775.
- **0.75 → 0.85** — reverse framing: mask 1→2.5, color returns to full, scrim lightens; photo parallax resumes 0.65→1.0 (completing by progress 1).
- **0.85 → 1** — resolved: full-color, unframed photo finishing its downward drift; pin releases into the outro.

All easing is either strictly linear (progress bar, text slide) or the hand-written `smoothstep` on each ramp; the only additional smoothing is `scrub:1` + Lenis. No `duration`, `delay`, `stagger`, labels, SplitText, or CustomEase anywhere — the "stagger" between markers is just their different threshold windows.

## Assets / images
Three assets:

- **Hero photo** (`.hero-img > img`) — a **high-angle aerial** of a **turquoise-to-teal river** carving a wide S-curve through flat, vivid green grassland/steppe, with low rolling hills along the horizon under a pale hazy blue sky. Dominant colors: saturated grass green and bright turquoise/cyan water, with soft pale-blue sky and thin sandy banks. Rendered `width:100%; height:200svh; object-fit:cover` → a very tall vertical crop (~1:2, portrait), so the frame reads as the river's sinuous curve running top-to-bottom. Role: the layer that parallaxes and is revealed through the bar-code mask, then desaturated/darkened mid-sequence. Any high-angle landscape with a strong sinuous feature (river, road, coastline) works.

- **Bar-code mask SVG** (`mask.svg`, used as the subtractive mask layer — not an `<img>`) — a set of **~19 vertical bars** of *varying widths (≈20–60px) and heights (≈760–900px)*, unevenly spaced across the canvas, all a single flat light-gray fill (`#D9D9D9`) on a transparent background (viewBox ≈ `0 0 1550 1050`). These bars are what get subtracted to punch the vertical slits. Recreate as inline SVG or a file; exact bar layout is not critical, but keep the "irregular vertical bar-code" character and a single solid fill.

- **Blueprint grid SVG** (`grid-overlay.svg`, an `<img>`) — a faint **technical grid**: ~10 evenly-spaced vertical + ~7 horizontal thin white lines (`stroke-width:2; opacity:0.5`) plus **two white rectangle outlines** (`stroke-width:3; fill:none`) as highlight boxes, on a transparent background (viewBox ≈ `0 0 1902 1111`). Role: the HUD/map grid that fades in during the analysis phase (further dimmed to 0.25 by CSS).

No brand marks or logos anywhere.

## Behavior notes
- **Desktop-first, fully scroll-scrubbed** — nothing autoplays except the CSS marker `pulse` rings; the whole sequence is a pure function of scroll position, so it is exactly reversible (scroll back up and it un-frames).
- Measurements (`offsetHeight`, `window.innerHeight`, `window.innerHeight * 4`) are read **once at load**; the layout is not re-measured on resize (matches the original).
- Section heights use `svh` so mobile browser chrome doesn't clip the full-viewport panels; sections are `overflow:hidden`.
- At `max-width:800px` only positions/sizes shift (larger mask, full-width grid, repositioned markers, tighter padding, wider copy column) — the effect math is unchanged.
- No reduced-motion handling in the original.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/inversa-scroll-animation/grid-overlay.svg
https://motionprompts.dev/c/inversa-scroll-animation/hero-img.jpg
https://motionprompts.dev/c/inversa-scroll-animation/mask.svg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--light`, `--dark`, `--muted`, `--accent-1`, `--accent-2`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script waiting on `DOMContentLoaded` that wires a `Lenis` instance pumped by a `gsap.ticker` callback, then creates exactly **one** `ScrollTrigger` — pinning `.hero` for four viewport-heights and scrubbing a single `onUpdate` handler that recomputes eight values every frame from `self.progress` alone. Two of them are strictly linear (the progress bar's fill, the text column's `y`); the rest are piecewise and hand-smoothstepped (the photo's counter-parallax `y`, the mask's `scale` together with the photo's `saturate()` filter and its scrim opacity, the grid overlay's opacity, and each marker's opacity) — all written with `gsap.set`, never a tween. There is no timeline and nothing to undo besides this one trigger and this one Lenis instance, but React withdraws the "this page never unmounts" assumption the whole script leans on, and it does so quietly: the sequence scrubs correctly on first load, and the damage only shows up on a second mount or a real route change.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Mount this component twice without tearing the first pass down and you get two `pin: true, pinSpacing: true` triggers stacked on the same `.hero`, each inserting its own spacer — the pinned range doubles to eight viewport-heights of scroll before `.outro` is reachable — while both `onUpdate` handlers call `gsap.set` on the same eight elements every scroll frame, so `heroMask`'s `scale` and `heroImgElement`'s `filter` end up decided by whichever handler's write lands last that frame, and the mask can visibly flicker between its framed and unframed state on an otherwise still scroll position. Two `Lenis` instances, each pumped by its own `gsap.ticker` callback, are also now fighting over the same wheel input. None of this reproduces in a production build, because React only double-invokes in development — the cleanup below is not optional polish.

*(1) The entry point* — delete the `document.addEventListener("DOMContentLoaded", ...)` wrapper; by the time a React component mounts, that event has already fired, so the listener would simply never run. Move its entire body — the Lenis/ticker wiring and the single `ScrollTrigger.create` call — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` and `gsap.ticker.lagSmoothing(0)` belong at module scope instead, and so does the `ease` smoothstep helper: all three are one-time, page-wide setup or a pure function, not per-mount state, and redefining `ease` inside the effect just rebuilds the same closure on every mount for nothing.

*(2) Element lookups* — all eight elements this handler touches (`heroContent`, `heroImg`, `heroImgElement`, `heroMask`, `heroGridOverlay`, `marker1`, `marker2`, `progressBar`) are read with plain `document.querySelector`, not GSAP selector text, so `gsap.context`'s automatic scoping does not cover any of them — scope every one to a root ref explicitly instead of the bare `document`. The one string that *is* covered is `trigger: ".hero"` inside the `ScrollTrigger.create` call: GSAP resolves selector text read inside the context's factory against that context's own scope, so it can stay a plain string as long as the ref you pass as scope is an ancestor of `.hero` — the component's outermost element, which is where the root ref belongs regardless. During the StrictMode remount two copies of the markup exist for an instant; an unscoped lookup can bind to the outgoing `.hero-mask` or `.marker-1`, and the surviving trigger then scrubs styles onto a node no longer on screen while the one actually visible never updates.

*(3) Cleanup* — wrap the Lenis/ticker wiring and the `ScrollTrigger.create` call in one `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, then the single ScrollTrigger.create({ trigger: ".hero", ... })
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` un-pins `.hero` — removing its spacer and restoring `.outro`'s normal position — and reverts every value the `onUpdate` handler wrote through `gsap.set`: the `--progress` custom property, both `y` transforms, `heroMask`'s `scale`, `heroImgElement`'s `filter`, `heroGridOverlay`'s opacity, `heroImg`'s `--overlay-opacity`, and both markers' opacity — all in one call, because a `gsap.set` is tracked by the context exactly like a tween would be.

What the context does not reach is `gsap.ticker.add((time) => { lenis.raf(time * 1000); })` — the only thing driving this Lenis instance, since the component has no `requestAnimationFrame` loop of its own. Keep the function reference and remove it explicitly, before destroying Lenis:

```jsx
const onTick = (time) => { lenis.raf(time * 1000); };
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

`lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — that listener lives on the Lenis instance's own emitter and goes away with `lenis.destroy()`. Lenis is a document-level resource: this component is written as a complete two-section page, so owning the instance here is correct as long as it stays that way — fold it into a larger app and the right move is to lift `new Lenis()` to the app shell and drive `ScrollTrigger.update` off the shared instance instead of constructing a second one that fights the first over the same wheel event.
