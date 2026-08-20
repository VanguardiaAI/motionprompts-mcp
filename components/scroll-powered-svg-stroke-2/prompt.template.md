---
slug: scroll-powered-svg-stroke-2
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 3
structural:
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Draw SVG Stroke On Scroll — Scroll-Scrubbed Self-Drawing Line

## Goal
Build an editorial scroll page whose star effect is a **tall, winding, thick orange stroke that draws itself on from top to bottom as you scroll**. A single inline `<svg>` path — a chunky, rounded, S-shaped ribbon — sits **behind** a centered column of content (image rows and text cards) at `z-index: -1`. Using the classic `strokeDasharray`/`strokeDashoffset` line-drawing trick, one **scrubbed** GSAP `ScrollTrigger` ties the stroke's `strokeDashoffset` directly to scroll progress through the middle section, so the orange line appears to snake into existence behind the content and un-draws when you scroll back up. Smooth scroll via Lenis. That's the whole trick — no timeline, no stagger, one property.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`ScrollTrigger`**.
- **`lenis`** — smooth scroll, wired into GSAP's ticker and `ScrollTrigger.update`.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```
Run everything inside `document.addEventListener("DOMContentLoaded", …)`. No other plugins, no framework.

## Layout / HTML
Three top-level `<section>`s: a full-viewport **hero**, a tall **spotlight** (the content column + the drawing SVG), and a full-viewport **outro**. Class names are load-bearing.

```html
<section class="hero">
  <h1>Designed to keep information clear and connected</h1>
</section>

<section class="spotlight">
  <div class="row">
    <div class="img"><img src="…" alt="" /></div>
  </div>

  <div class="row">
    <div class="col">
      <div class="card">
        <h2>A cleaner way to handle incoming updates</h2>
        <p>
          Instead of showing every message or notification instantly, the
          app groups related items and presents them in an organized panel.
          It keeps your workspace calm, even when activity spikes.
        </p>
      </div>
    </div>
    <div class="col">
      <div class="img"><img src="…" alt="" /></div>
    </div>
  </div>

  <div class="row">
    <div class="col">
      <div class="img"><img src="…" alt="" /></div>
    </div>
    <div class="col">
      <div class="card">
        <h2>Built for increasing information demands</h2>
        <p>
          Whether it is files, notes, or incoming messages, the app sorts
          and prioritizes items automatically. It prevents clutter and helps
          maintain clarity during busy periods.
        </p>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="img"><img src="…" alt="" /></div>
  </div>

  <div class="svg-path">
    <svg
      viewBox="0 0 1378 2760"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMin meet"
    >
      <path
        id="stroke-path"
        d="M639.668 100C639.668 100 105.669 100 199.669 601.503C293.669 1103.01 1277.17 691.502 1277.17 1399.5C1277.17 2107.5 -155.332 1968 140.168 1438.5C435.669 909.002 1442.66 2093.5 713.168 2659.5"
        stroke="#FF5F0A"
        stroke-width="200"
        stroke-linecap="round"
      />
    </svg>
  </div>
</section>

<section class="outro">
  <h1>Clearer organization ready for whatever comes next</h1>
</section>

<script type="module" src="./script.js"></script>
```

Notes on structure:
- The spotlight has **exactly 4 `.row`s**. Rows 1 and 4 are a single centered `.img` (constrained to 50% width). Rows 2 and 3 are two-column: an image column and a text `.card` column, in **alternating order** (row 2 = card left / image right; row 3 = image left / card right).
- The **`.svg-path` is the last child of `.spotlight`**, absolutely positioned and pushed behind everything with `z-index: -1`. Keep the SVG markup **exactly** as above — the `viewBox`, path `d`, `stroke` color, `stroke-width: 200`, and `stroke-linecap: round` define the whole visual. The path must carry `id="stroke-path"` (the JS queries it).
- Copy is neutral demo prose about an app that organizes information — use it verbatim; no brands.

## Styling
Fonts: **Manrope** for headings and body, **Space Mono** for the small uppercase labels:
```css
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap");
```

Palette (CSS variables — exact hex):
```css
--paper: #f4f4f0;     /* cool bone — page background */
--sand: #e7e7e2;      /* cool panel — hero/outro background + card background */
--ink: #16161a;       /* near-black — body text */
--ink-soft: #5f6368;  /* cool grey — secondary copy */
--flame: #ff5f0a;     /* brand accent — matches the drawn stroke */
--line: rgba(22, 22, 26, 0.12);
```
The stroke's orange **`#FF5F0A`** lives on the SVG path itself **and** as `--flame`, which paints the labels and the small fills — keep the two in sync.

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { font-family:"Manrope", sans-serif; background-color: var(--paper); color: var(--ink); }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1, h2 { font-weight:500; line-height:1.1; }`
- `h1 { font-size:4rem; letter-spacing:-0.1rem; }`
- `h2 { font-size:2.5rem; letter-spacing:-0.075rem; }`
- `p { font-size:1.125rem; font-weight:500; }`

Sections:
- `.hero, .outro { position:relative; width:100%; height:100svh; padding:2rem; background-color:var(--sand); display:flex; justify-content:center; align-items:center; overflow:hidden; }` with `.hero h1, .outro h1 { width:60%; text-align:center; }`.
- `.spotlight { position:relative; width:100%; height:100%; padding:2rem; display:flex; flex-direction:column; gap:10rem; overflow:hidden; }` — the big `10rem` vertical gap between rows is what gives the stroke room to wander between content.
- `.spotlight .row { display:flex; justify-content:center; gap:2rem; }`
- `.spotlight .row .col { flex:1; display:flex; flex-direction:column; justify-content:center; }`
- `.spotlight .row:nth-child(1) .img, .spotlight .row:nth-child(4) .img { width:50%; }` — the two full-width rows keep their single image at half width, centered.
- `.spotlight .card { width:75%; margin:0 auto; padding:3rem; background-color:var(--sand); border-radius:1rem; display:flex; flex-direction:column; gap:1rem; }`

The drawing layer — **critical positioning**:
```css
.spotlight .svg-path {
  position: absolute;
  top: 25svh;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  height: 100%;
  z-index: -1;        /* sits BEHIND the content rows */
}
.spotlight .svg-path svg {
  width: 100%;
  height: auto;       /* tall SVG overflows its container downward */
}
```

## GSAP effect (the important part — be exhaustive)

### Smooth-scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);
```
Lenis' scroll events drive `ScrollTrigger.update`; Lenis itself is stepped by GSAP's ticker (`time * 1000` converts ticker seconds → Lenis' expected ms); lag smoothing is off so the scrub stays glued to scroll position.

### Prime the dash for line-drawing
Grab the path, measure it, and set both dash values to the **full length** so the stroke starts fully hidden:
```js
const path = document.getElementById("stroke-path");
const pathLength = path.getTotalLength();

path.style.strokeDasharray  = pathLength;   // one dash exactly as long as the whole path
path.style.strokeDashoffset = pathLength;   // offset by the full length → nothing visible yet
```
With `dasharray === dashoffset === pathLength`, the single dash is pushed entirely "off the end," so at rest the stroke is invisible. Animating `strokeDashoffset` down to `0` slides that dash into view, drawing the line progressively from its start point to its end point.

### The one scrubbed tween
A single `gsap.to` animates `strokeDashoffset` from its primed value (`pathLength`) to `0`, **linearly** (`ease: "none"`) and **fully scrubbed** to the spotlight section's scroll range:
```js
gsap.to(path, {
  strokeDashoffset: 0,
  ease: "none",
  scrollTrigger: {
    trigger: ".spotlight",
    start: "top top",       // begin drawing when the spotlight's top hits the viewport top
    end: "bottom bottom",   // finish when the spotlight's bottom hits the viewport bottom
    scrub: true,            // dashoffset is tied 1:1 to scroll progress
  },
});
```
Behavior: as you scroll through the entire height of `.spotlight`, `strokeDashoffset` interpolates linearly from `pathLength` → `0`, so the winding orange ribbon draws on **in exact lockstep with scroll** — halfway through the section the line is half-drawn; scroll back up and it un-draws. `ease: "none"` is essential so drawing speed is uniform with scroll (no easing curve). No pin, no `pinSpacing`, no timeline, no stagger — this lone property tween is the entire effect.

**No SplitText, no CustomEase, no lerp/rAF interpolation, no Three.js.** Only Lenis-smoothed scroll and one scrubbed `strokeDashoffset` tween.

## Assets / images
Four **monochrome (black / white / grey) vector cartoon illustrations** on a white background — flat, thin-stroke line-art style with no color, so the single orange stroke is the only saturated element on the page. Roles / aspect:
- **Image 1** — square (~1:1, e.g. 500×500), first row, centered at 50% width.
- **Image 2** — square (~1:1), row 2, right column beside a text card.
- **Image 3** — landscape (~3:2, e.g. 750×500), row 3, left column beside a text card.
- **Image 4** — square (~1:1), last row, centered at 50% width.

They render with `object-fit: cover`, so exact framing is forgiving. No brands or logos. If you have fewer than four, repeat.

## Behavior notes
- **Trigger:** scroll only, fully scrubbed. Nothing autoplays; parking the scroll freezes the stroke mid-draw, and reversing scroll un-draws it.
- **Responsive** (`@media (max-width:1000px)`): drop letter-spacing to `0`; `h1 → 2rem`, `h2 → 1.5rem`, `p → 1rem`; `.hero h1, .outro h1 → width:100%`; `.spotlight` gap → `5rem`; rows stack vertically (`.spotlight .row { flex-direction:column; }`); the rows-1&4 image and the cards go full width; and the drawing layer shifts to `.spotlight .svg-path { top:15svh; width:275%; }` so the wide stroke still spans the narrow column.
- The stroke's `stroke-width:200` (in the 1378×2760 viewBox) reads as a **bold ribbon**, not a hairline; `stroke-linecap:round` gives it rounded ends. Keep these — a thin stroke would change the whole look.
- No reduced-motion guard in the original.
```

## Images

This component ships with 8 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/scroll-powered-svg-stroke-2/img_1.jpg
https://motionprompts.dev/c/scroll-powered-svg-stroke-2/img_1.svg
https://motionprompts.dev/c/scroll-powered-svg-stroke-2/img_2.jpg
https://motionprompts.dev/c/scroll-powered-svg-stroke-2/img_2.svg
https://motionprompts.dev/c/scroll-powered-svg-stroke-2/img_3.jpg
https://motionprompts.dev/c/scroll-powered-svg-stroke-2/img_3.svg
… 2 more under https://motionprompts.dev/c/scroll-powered-svg-stroke-2/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--sand`, `--ink`, `--ink-soft`, `--flame`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, reaches into the page with `document.getElementById("stroke-path")` and a `.spotlight` class selector, and wires one smooth-scroll instance plus one scrubbed tween that never has to be undone because the document never goes away. React withdraws all three of those guarantees at once — the ready-made document, the license to assume an `id` or class only ever matches once, and the promise that setup runs a single time — and it does it quietly: the stroke still draws correctly on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component builds exactly three long-lived things in that first pass — a `Lenis` instance, the `gsap.ticker` callback that steps it every frame, and the single `ScrollTrigger` scrubbing `strokeDashoffset` — and all three have to be undone before the remount, or the remount doesn't replace them, it doubles them: two `Lenis` instances fighting over the same wheel event, a ticker callback still calling `.raf()` on the instance you just destroyed, or two triggers scrubbing the same path and disagreeing about the current offset. None of this reproduces in a production build, because React only double-invokes in development.

*(1) The entry point* — the whole effect body sits inside `document.addEventListener("DOMContentLoaded", ...)`. A React component mounts well after that event has already fired, so as written the listener registers and is simply never called: no `Lenis`, no ticker, no `getTotalLength()` measurement, no tween — a page with a fully invisible stroke and nothing in the console to point at. Delete the listener and move its body — the `Lenis` construction, the ticker wiring, the dasharray/dashoffset priming, and the `gsap.to` call — directly into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` already sits outside the listener in the script above; leave it at module scope.

*(2) Element lookups* — `document.getElementById("stroke-path")` and the `trigger: ".spotlight"` selector both assume a single match in the whole document. An `id` is a document-wide key: mount this component twice, or catch it mid StrictMode remount when two copies of the subtree briefly coexist, and `getElementById` can hand the length measurement and the tween to the wrong instance's path, or to the copy already on its way out. Give the `<path>` its own `ref` instead of the `id`, and give `.spotlight` a `ref` too so it can be passed straight to `scrollTrigger.trigger` instead of through a class lookup. The priming lines — `path.style.strokeDasharray = pathLength; path.style.strokeDashoffset = pathLength;` — are plain DOM writes, not GSAP calls, so leaving them outside any GSAP-managed lifecycle is fine (recomputing and rewriting the same length on every mount is idempotent); they just need the `ref` to be pointed at the right node when they run.

*(3) Cleanup* — wrap the measurement and the tween in a `gsap.context` scoped to a root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const path = pathRef.current;
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;

    gsap.to(path, {
      strokeDashoffset: 0,
      // easing and the scrollTrigger start/end/scrub config are unchanged from above
      scrollTrigger: {
        trigger: spotlightRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
  }, rootRef);
  return () => { /* see below */ };
}, []);
```

`ctx.revert()` covers exactly two things here: the `gsap.to` tween and the `ScrollTrigger` created through its `scrollTrigger` option. Reverting removes the scroll listener the trigger registered on the wheel/resize side and resets the path's `strokeDashoffset` inline style back to the primed value it held before the tween ever ran. It does **not** reach the `Lenis` instance or the `gsap.ticker.add((time) => lenis.raf(time * 1000))` subscription: a ticker callback is neither a tween nor a trigger, so the context never records it, and `Lenis` isn't a GSAP object at all. Both have to be torn down by hand, ticker first:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
gsap.ticker.lagSmoothing(0);

return () => {
  gsap.ticker.remove(onTick);
  lenis.destroy();
  ctx.revert();
};
```

Destroy `lenis` while `onTick` is still registered and the next tick GSAP's ticker fires calls `.raf()` on an instance that no longer exists. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — `lenis.destroy()` tears down Lenis's own event emitter along with it — but only once `onTick` has already stopped feeding it frames.
