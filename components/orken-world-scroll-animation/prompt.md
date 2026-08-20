# Pinned Horizontal Card Scroll with Triangle-Grid Fill Reveal

## Goal

Build a full-page cinematic scroll sequence. A single section **pins** for 5 viewport heights while Lenis-smoothed scrolling drives two things at once: (1) a horizontal row of three tall product cards **slides left across the screen** (across the first ~65% of the scroll), and (2) a full-screen **canvas grid of interlocking triangles** — barely-visible white outlines — that, over the last ~35% of the scroll, **fills in with bright orange one triangle at a time in random order**, each triangle easing up from scale 0→1, until the orange grid blankets the whole viewport. A dark background image sits behind everything; a hero panel precedes the pinned section and an outro panel follows it.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**, and **`lenis`** for smooth scrolling. The reveal grid is drawn with the raw **Canvas 2D API** (no extra plugin — no PixiJS/Three.js). Everything runs inside a `DOMContentLoaded` listener.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);
```

Lenis wiring (standard GSAP integration):

```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

## Layout / HTML

Class names are load-bearing — the JS/CSS query them. One `.container` wrapping three sections:

```html
<div class="container">
  <section class="hero">
    <h1><span>Enter a Universe</span> Powered by Imagination</h1>
  </section>

  <section class="sticky">
    <div class="bg-img"><img src="bg.jpg" alt="" /></div>

    <canvas class="outline-layer"></canvas>

    <div class="cards">
      <div class="card">
        <div class="card-img"><img src="card-1.jpg" alt="" /></div>
        <div class="card-title"><h1>Silent Veil</h1><p>PROD8372</p></div>
      </div>
      <div class="card">
        <div class="card-img"><img src="card-2.jpg" alt="" /></div>
        <div class="card-title"><h1>Crimson Echoes</h1><p>PROD4921</p></div>
      </div>
      <div class="card">
        <div class="card-img"><img src="card-3.jpg" alt="" /></div>
        <div class="card-title"><h1>Zenith Arc</h1><p>PROD7586</p></div>
      </div>
    </div>

    <canvas class="fill-layer"></canvas>
  </section>

  <section class="outro">
    <h1>Chase the <span>shadows</span> to embrace the light</h1>
  </section>
</div>
<script type="module" src="./script.js"></script>
```

Note the **z-order** inside `.sticky` is defined by CSS z-index, not DOM order: background image (bottom) → `outline-layer` canvas → `cards` → `fill-layer` canvas (top). So the orange fill ends up painted **over** the cards.

The copy above is placeholder demo text — keep it generic; do not add any real brand names.

## Styling

- Universal reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- **Body must be tall enough to scroll through the whole pinned range:** `html, body { width: 100%; height: 800vh; font-family: "PP Neue Montreal"; }` (a neutral grotesque sans; there is no `@font-face`, so it simply falls back to the default sans — that's fine).
- `img { width: 100%; height: 100%; object-fit: cover; }`.
- `h1`: `text-transform: uppercase; font-family: "FK Screamer"; font-weight: lighter; font-size: 64px; line-height: 1;` (a tall condensed/heavy display face; system fallback is acceptable). `h1 span { color: #ff6b00; }` — the orange accent inside headings.
- `p { font-size: 14px; font-weight: 500; }`.
- `section { position: relative; width: 100vw; height: 100vh; overflow: hidden; }`.
- `.hero, .outro`: `display: flex; justify-content: center; align-items: center; background-color: #000; color: #fff;` and their `h1` is `text-align: center; font-size: 80px;`.
- `.bg-img`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%;` (full-bleed behind everything).
- **Canvas sizing is deliberately oversized** — this matters for the look:
  ```css
  canvas { position: absolute; top: 0; left: 0; width: 150% !important; height: 150% !important; }
  canvas.outline-layer { z-index: 1; }
  canvas.fill-layer { z-index: 3; }
  ```
  The `!important` 150% overrides the inline pixel sizes the JS sets, so both canvases are stretched to 1.5× the viewport (the triangle grid overflows the edges — intended).
- `.cards`: `position: absolute; top: 0; left: 0; width: 300%; height: 100vh; display: flex; justify-content: space-around; align-items: center; will-change: transform; z-index: 2;` — the row is **three viewport-widths wide**, holding three cards spread across it.
- `.card`: `position: relative; width: 10%; height: 75%; background-color: black; display: flex; flex-direction: column; gap: 1em; padding: 1.5em;` (each card is 10% of the 300% row = ~30vw, and 75vh tall).
- `.card-img, .card-title { flex: 1; overflow: hidden; }`. `.card-title { color: #fff; display: flex; flex-direction: column; justify-content: space-between; }` (title `h1` at top, product-code `p` at bottom).
- Responsive: `@media (max-width: 900px) { .card { width: 25%; } }`.

### Palette

- `#000` black (hero/outro/card backgrounds), `#fff` white text.
- `#ff6b00` — the signature orange (heading `span`s **and** the triangle fill).
- `rgba(255,255,255,0.075)` — the near-invisible white triangle outline in the resting grid.

## GSAP effect (be exact)

There is **one** `ScrollTrigger` plus a hand-rolled canvas render loop. No SplitText, no CustomEase. All motion comes from `onUpdate` + `gsap.set` and a `requestAnimationFrame` lerp inside the canvas draw function.

### Canvas setup

Grab both canvases and their 2D contexts. Size each for crisp rendering on HiDPI:

```js
function setCanvasSize(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.scale(dpr, dpr);
}
```

(The inline style widths are then overridden by the `150% !important` CSS — the drawing coordinate system stays in CSS-pixel space of `innerWidth × innerHeight`.)

Constants: `triangleSize = 150`, `lineWidth = 1`, `SCALE_THRESHOLD = 0.01`. State: `const triangleStates = new Map();`, `let animationFrameId = null;`, `let canvasXPosition = 0;`.

### Triangle geometry

`drawTriangle(ctx, x, y, fillScale = 0, flipped = false)` with `halfSize = triangleSize / 2` (75):

- **Non-flipped** triangle (points up): `moveTo(x, y - halfSize)`, `lineTo(x + halfSize, y + halfSize)`, `lineTo(x - halfSize, y + halfSize)`, close.
- **Flipped** triangle (points down): `moveTo(x, y + halfSize)`, `lineTo(x + halfSize, y - halfSize)`, `lineTo(x - halfSize, y - halfSize)`, close.
- If `fillScale < SCALE_THRESHOLD` → draw only the **outline**: `strokeStyle = "rgba(255,255,255,0.075)"`, `lineWidth = 1`, `stroke()`.
- If `fillScale >= SCALE_THRESHOLD` → draw the **filled** triangle, scaled about its own center: `ctx.save(); ctx.translate(x, y); ctx.scale(fillScale, fillScale); ctx.translate(-x, -y);` then trace the same path and `fillStyle = "#ff6b00"`, `strokeStyle = "#ff6b00"`, `lineWidth = 1`, `stroke()`, `fill()`, `ctx.restore()`.

### Grid initialization

```js
function initializeTriangles() {
  const cols = Math.ceil(window.innerWidth / (triangleSize * 0.5)); // ceil(w / 75)
  const rows = Math.ceil(window.innerHeight / (triangleSize * 0.5)); // ceil(h / 75)
  const totalTriangles = rows * cols;
  // build every {row, col, key:`${r}-${c}`}, then Fisher–Yates shuffle the array,
  // then assign each an "order" by its POST-SHUFFLE index:
  positions.forEach((pos, index) => {
    triangleStates.set(pos.key, { order: index / totalTriangles, scale: 0, row: pos.row, col: pos.col });
  });
}
```

The shuffle is what makes the fill appear in **random order** — `order` is a 0→1 threshold; a triangle turns on when the animation progress passes its order value.

**Placement** for a triangle at `{row, col}` (used in every draw): `x = col * (triangleSize * 0.5) + triangleSize / 2 + canvasXPosition` (i.e. `col*75 + 75 + canvasXPosition`), `y = row * triangleSize + triangleSize / 2` (i.e. `row*150 + 75`), `flipped = (row + col) % 2 !== 0`. Columns are spaced 75px (half a triangle) so up/down triangles interlock into continuous horizontal strips; rows are spaced 150px.

### The draw loop (lerped fill)

```js
function drawGrid(scrollProgress = 0) {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  outlineCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
  fillCtx.clearRect(0, 0, fillCanvas.width, fillCanvas.height);

  // fill only starts after 65% of the scroll, then ramps 0→1 over the last 35%:
  const animationProgress = scrollProgress <= 0.65 ? 0 : (scrollProgress - 0.65) / 0.35;
  const animationSpeed = 0.15; // lerp factor
  let needsUpdate = false;

  // PASS 1 — outlines on outline-layer (any triangle not yet fully filled):
  triangleStates.forEach((state) => {
    if (state.scale < 1) {
      /* compute x,y,flipped as above */ drawTriangle(outlineCtx, x, y, 0, flipped);
    }
  });

  // PASS 2 — fills on fill-layer, each easing toward its target:
  triangleStates.forEach((state) => {
    const shouldBeVisible = state.order <= animationProgress;
    const targetScale = shouldBeVisible ? 1 : 0;
    const newScale = state.scale + (targetScale - state.scale) * animationSpeed; // lerp
    if (Math.abs(newScale - state.scale) > 0.001) { state.scale = newScale; needsUpdate = true; }
    if (state.scale >= SCALE_THRESHOLD) {
      /* compute x,y,flipped */ drawTriangle(fillCtx, x, y, state.scale, flipped);
    }
  });

  if (needsUpdate) animationFrameId = requestAnimationFrame(() => drawGrid(scrollProgress));
}
```

Key points: the two canvases are separate layers — **outlines** live on `outline-layer` (z-index 1, *behind* the cards) and **orange fills** on `fill-layer` (z-index 3, *over* the cards). Because `newScale` lerps toward its target with factor `0.15`, each triangle "pops" in with an ease-out feel; the `requestAnimationFrame` self-reschedules until every triangle has settled, so the fill keeps animating smoothly even between discrete scroll events.

On init: `initializeTriangles(); drawGrid();`.

### The single ScrollTrigger

```js
const stickyHeight = window.innerHeight * 5;
ScrollTrigger.create({
  trigger: ".sticky",
  start: "top top",
  end: `+=${stickyHeight}px`,   // pinned for 5 viewport heights
  pin: true,                    // default pinSpacing: true
  onUpdate: (self) => {
    canvasXPosition = -self.progress * 200;         // grid drifts left up to 200px
    drawGrid(self.progress);                        // repaint at current progress

    const cards = document.querySelector(".cards");
    const progress = Math.min(self.progress / 0.654, 1);   // remap: cards finish at 65.4% scroll
    gsap.set(cards, { x: -progress * window.innerWidth * 2 }); // slide left by 2 viewport widths
  },
});
```

So over the pinned range:
- **0 → ~65.4% progress:** `.cards` translates on X from `0` to `-2 * innerWidth`. Since the row is 300% wide, moving it left by two viewport-widths pulls the second and third cards across the screen (horizontal-scroll feel). Past 65.4%, the remap clamps to 1 so the cards hold still.
- **The whole range:** `canvasXPosition` slides the triangle grid left from 0 to −200px (subtle parallax drift of the grid).
- **65% → 100% progress:** `animationProgress` ramps 0→1, so triangles cross their random `order` thresholds and the orange fill blooms across the viewport, ending fully orange (covering the cards) at the outro handoff.

### Resize

```js
window.addEventListener("resize", () => {
  setCanvasSize(outlineCanvas, outlineCtx);
  setCanvasSize(fillCanvas, fillCtx);
  triangleStates.clear();
  initializeTriangles();
  drawGrid();
});
```

## Assets / images

Four images total:

1. **`bg.jpg`** — one dark, moody, atmospheric full-bleed background (landscape ~16:9). Sits behind the canvases and cards; sets the cinematic tone.
2–4. **`card-1.jpg`, `card-2.jpg`, `card-3.jpg`** — three stylized product/editorial artwork images, portrait-oriented (each is cropped by `object-fit: cover` into a tall card cell roughly 2:3). Distinct dark/dramatic subjects work best. Place them in the three cards in order (titles "Silent Veil", "Crimson Echoes", "Zenith Arc").

## Behavior notes

- **Page-level component:** Lenis takes over scrolling for the whole document; the `.sticky` section pins for 5× viewport height, bookended by full-screen hero and outro panels.
- **Everything is scrub-driven** through the single ScrollTrigger's `onUpdate` (no tweens on the cards, no timeline). Scrolling back up reverses both the card slide and the triangle fill, because the render is a pure function of `self.progress` plus the settling lerp.
- The triangle grid is a `<canvas>` 2D render, not DOM elements — keep it that way for performance. `perfCost` is medium.
- Two stacked canvases are essential: outlines must sit **under** the cards (z-index 1) and the orange fill **over** them (z-index 3), so the reveal reads as the scene being consumed by the triangle grid.
- No `prefers-reduced-motion` handling in the original; the effect is desktop-first but functions on mobile (cards widen to 25% under 900px).

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/orken-world-scroll-animation/bg.jpg
https://motionprompts.dev/c/orken-world-scroll-animation/card-1.jpg
https://motionprompts.dev/c/orken-world-scroll-animation/card-2.jpg
https://motionprompts.dev/c/orken-world-scroll-animation/card-3.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--amber`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, wires Lenis into GSAP's ticker, drives a hand-rolled canvas render loop off `requestAnimationFrame`, and drives the card slide and the triangle-grid reveal out of a single `ScrollTrigger.create({ onUpdate })` — and never has to undo any of it, because the tab reloads long before it could run twice. React withdraws that guarantee.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that produces three independent copies of state fighting each other: a second pin on `.sticky` racing the first to read `self.progress` and set the same `.cards` translate, a second `Lenis` instance pulling on the same wheel event, and a second `drawGrid` loop repainting `outline-layer`/`fill-layer` with a freshly reshuffled `triangleStates` map on top of whatever the first loop already settled. None of this throws — the cards jitter, the triangle fill blooms twice as fast or in a different random order than intended, and it will not reproduce in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — the whole body, from `gsap.registerPlugin` through the closing brace of `ScrollTrigger.create`, sits inside `document.addEventListener("DOMContentLoaded", () => {...})`. A React component mounts after that event has already fired on the document, so the listener is registered and never called: no Lenis instance, no triangle grid, no pin — `.sticky` just sits there as an ordinary, unpinned section, with nothing in the console to explain why. Delete the listener and move its body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can move to module scope.

*(2) Element lookups* — `.sticky`, `.outline-layer` and `.fill-layer` are each looked up once via `document.querySelector`; give the component a root ref and resolve all three off it instead. `.cards` is the one to watch: unlike the other three it is not hoisted — `document.querySelector(".cards")` runs fresh **inside `onUpdate`, once per scroll tick**, for as long as the pinned range is active. Scoping it to the root ref matters more here than for a one-time lookup: during the StrictMode remount two `.cards` elements exist for an instant, and an unscoped, per-frame lookup keeps re-resolving to whichever one is currently unmounting, right up until it disappears.

*(3) Cleanup* — wrap the canvas setup, `initializeTriangles`, the first `drawGrid()` call and the `ScrollTrigger.create` call in one `gsap.context` scoped to the root ref, and keep the Lenis instance, the ticker callback and the render-loop handle reachable from outside that context:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const lenis = new Lenis();
  const onTick = (time) => lenis.raf(time * 1000);
  const frameRef = { current: null }; // or a useRef, if you prefer

  const ctx = gsap.context(() => {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    /* canvas grabs off `root`, setCanvasSize, initializeTriangles(), drawGrid(),
       and ScrollTrigger.create({ trigger: root.querySelector(".sticky"), ... }) go here,
       with drawGrid's requestAnimationFrame call writing into frameRef.current instead of
       the module-level animationFrameId variable it uses above */
  }, rootRef);

  const onResize = () => { /* setCanvasSize on both canvases, triangleStates.clear(),
                               initializeTriangles(), drawGrid() */ };
  window.addEventListener("resize", onResize);

  return () => {
    ctx.revert();
    gsap.ticker.remove(onTick);
    lenis.destroy();
    window.removeEventListener("resize", onResize);
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  };
}, []);
```

`ctx.revert()` covers exactly what GSAP created inside that factory: it unpins `.sticky` — removing the pin spacer and the inline styles ScrollTrigger wrote for the pinned state — and removes the trigger itself, so the StrictMode remount does not leave two triggers scrubbing the same range. Everything else in the cleanup above is deliberately outside the context, because none of it is a tween or a trigger. `gsap.ticker.add(onTick)` drives `lenis.raf()` every frame regardless of whether any GSAP object still exists, so remove it before calling `lenis.destroy()`, not after — a tick landing between the two calls would call `.raf()` on an instance that is already gone. `drawGrid`'s own `requestAnimationFrame` chain is a second, independent loop: it keeps re-scheduling itself for as long as any triangle's eased scale has not yet reached its target, and `ctx.revert()` has no idea it exists, so cancel it explicitly through the ref. The resize listener is the last piece the context doesn't reach — it is a plain `window` subscription that rebuilds `triangleStates` and repaints both canvases whenever the viewport changes, so it needs its own `removeEventListener` with the exact function reference, or a resize firing after a StrictMode remount runs the handler twice and rebuilds the grid from two independently-shuffled maps into canvases only one of which is still on screen.
