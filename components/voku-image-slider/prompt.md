# Arc Coverflow Image Slider — infinite cosine-arc carousel

## Goal
Build a full-viewport **infinite horizontal image slider** whose 9 slides are laid out along a
**cosine arc** (a coverflow / carousel curve). The slide nearest the horizontal center is the
largest and is **lifted up**; slides to either side **shrink** and **sink down along the arc** the
farther they sit from center. Mouse wheel and touch-drag feed a scroll target that is
**lerp-smoothed every animation frame**; the slides recycle with a modular wrap so the row loops
**forever in both directions**. A single caption pinned near the bottom always shows the title of
the slide currently closest to center. The star of the piece is the per-frame arc-layout engine —
there is no GSAP timeline, no ScrollTrigger, just `gsap.set` called on every `requestAnimationFrame`.

## Tech
Vanilla HTML / CSS / JS with an ES module entry (`<script type="module" src="./script.js">`),
bundled by Vite. **`gsap` (npm)** is the only dependency — imported as `import gsap from "gsap"`.
**No GSAP plugins** (no ScrollTrigger, SplitText, CustomEase), **no Lenis, no Three.js.** GSAP is
used purely as a fast writer of inline transforms via `gsap.set`. All motion is a hand-written
`requestAnimationFrame` loop with manual linear interpolation. Everything must run in a fresh Vite
project with only `gsap` installed.

## Layout / HTML
Flat, static markup — all 9 slides exist in the HTML up front (they are **not** generated in JS),
plus one caption paragraph.

```html
<header class="masthead">
  <span class="brand">Objet</span>
  <p class="masthead-note">The metal &amp; glass edit — refillable</p>
</header>

<section class="slider" aria-label="Objet product gallery">
  <div class="slide"><img src="/path/img1.jpg" alt="Crumpled ceramic vessel on a polished chrome pedestal" /></div>
  <div class="slide"><img src="/path/img2.jpg" alt="Twisted glass sculpture catching prismatic light on black" /></div>
  <div class="slide"><img src="/path/img3.jpg" alt="Brushed aluminium abstract form under soft rim light" /></div>
  <div class="slide"><img src="/path/img4.jpg" alt="Open chrome refill mirror" /></div>
  <div class="slide"><img src="/path/img5.jpg" alt="Matte lipstick beside a black glass jar" /></div>
  <div class="slide"><img src="/path/img6.jpg" alt="Stacked stone and steel totem in chiaroscuro light" /></div>
  <div class="slide"><img src="/path/img7.jpg" alt="Frosted glass monolith glowing from within" /></div>
  <div class="slide"><img src="/path/img8.jpg" alt="Chrome torus knot floating over velvet" /></div>
  <div class="slide"><img src="/path/img9.jpg" alt="Hand-blown amber glass form on black slate" /></div>

  <div class="caption">
    <span class="caption-eyebrow">Selected object</span>
    <p id="slide-title">Cleansing balm</p>
    <span class="caption-hint">Scroll or drag to turn the collection</span>
  </div>
</section>
```

- `.slider` is the full-screen stage and the interaction surface (wheel + touch listeners attach
  here). It clips everything with `overflow: hidden`.
- Each `.slide` wraps exactly one `<img>`. There are exactly **9** slides.
- `#slide-title` is the live caption; it starts with the first slide's title (`"Cleansing balm"`).
  It sits inside `.caption` between two fixed labels — an eyebrow (`Selected object`) and a hint
  (`Scroll or drag to turn the collection`) — which never change; only `#slide-title` is rewritten
  by the JS.
- The `.masthead` is static chrome outside the slider (brand + one line of copy). Nothing animates
  it; it exists so the stage reads as a gallery rather than a bare carousel.

## Styling
Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`

- **Font:** `body { font-family: "Hanken Grotesk", sans-serif; }` — import Hanken Grotesk from
  Google Fonts, `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap");` (or any clean neutral grotesque sans as
  fallback). The caption is **weight 500**.
- **`img`** — `width: 100%; height: 100%; object-fit: cover;` (fills its `.slide` box; the JS sizes
  the box, `cover` handles the crop).
- **Palette** — achromatic on purpose, so the objects carry every tone:
  ```css
  :root {
    --bg: #e9e7e2;       /* soft limestone gallery wall */
    --bg-fade: #ded9d1;  /* faint vignette */
    --ink: #1b1916;
    --muted: #79736a;    /* labels + meta */
    --hair: rgba(27, 25, 22, 0.16);
  }
  body { color: var(--ink); background: radial-gradient(120% 90% at 50% 6%, var(--bg) 40%, var(--bg-fade) 100%); }
  ```
- **`.slider`** — `position: relative; width: 100%; height: 100svh; overflow: hidden;` It sets no
  background of its own; the body gradient shows behind the slides.
- **`.slide`** — `position: absolute; overflow: hidden; will-change: transform, width, height;
  box-shadow: 0 24px 60px -30px rgba(27,25,22,.5);` No `top`/`left` are set (they default to `0`),
  so the element's origin is the top-left of `.slider`; the JS positions it entirely through GSAP's
  `x`/`y` (CSS transforms) plus inline `width`/`height`. The shadow is what lifts each object off
  the wall.
- **`.masthead`** — `position: absolute; inset: 0 0 auto 0; z-index: 200; display: flex;
  align-items: baseline; justify-content: space-between;` with fluid `clamp()` padding. `.brand` is
  700 weight; `.masthead-note` is a 0.72rem uppercase line in `--muted` with `letter-spacing:.18em`.
- **`.caption`** — `position: absolute; bottom: 22svh; left: 50%; transform: translateX(-50%);
  z-index: 200;` a centered column (`display:flex; flex-direction:column; align-items:center;
  gap:.7rem; width:min(90vw,640px)`) holding three lines: `.caption-eyebrow` (0.7rem uppercase,
  `letter-spacing:.28em`, `--muted`, flanked by two 1.6rem hairlines drawn with `::before`/`::after`
  in `--hair`), `p#slide-title` (`font-weight:500; font-size:clamp(1.5rem,3.4vw,2.25rem)`), and
  `.caption-hint` (0.78rem, `--muted`).
- **Mobile `@media (max-width: 768px)`** — the masthead stacks and centres, the caption rises to
  `bottom: 16svh`, `p#slide-title` drops to `1.55rem` and the eyebrow's hairlines shorten.
- **`@media (prefers-reduced-motion: reduce)`** — `.slide { transition: none !important; }`.

## The effect — exhaustive spec (per-frame cosine-arc engine, `gsap.set` only)

### Config constants (use these exact values)
```js
const SLIDE_WIDTH  = 200;   // base slide box width in px (at center scale 1)
const SLIDE_HEIGHT = 275;   // base slide box height in px (≈ portrait 3:4, exactly 200:275)
const SLIDE_GAP    = 100;   // horizontal spacing between consecutive slide anchors, in "track" px
const SLIDE_COUNT  = 9;     // number of slides / images
const ARC_DEPTH    = 200;   // max downward drop (px) of a side slide along the arc
const CENTER_LIFT  = 100;   // max upward lift (px) applied to the centered slide
const SCROLL_LERP  = 0.05;  // per-frame smoothing factor toward the scroll target
```

### Slide titles (caption data, in slide order)
```js
const slideTitles = [
  "Cleansing balm", "Facial oil", "Kohl liner", "Refill mirror", "Matte lipstick",
  "Hand cream", "Foaming cleanser", "Pressed powder", "Refill case",
];
```

### Derived quantities (computed once on load, recomputed on resize)
```js
const trackWidth  = SLIDE_COUNT * SLIDE_GAP;   // = 900  — the wrap period along the virtual track
let   windowWidth  = window.innerWidth;
let   windowHeight = window.innerHeight;
let   windowCenterX = windowWidth / 2;
let   arcBaselineY  = windowHeight * 0.4;       // vertical anchor of the arc (40% down the viewport)
```

### The core layout function — `computeSlideTransform(slideIndex, scrollOffset)`
Called for every slide, every frame. Returns the slide's pixel geometry, z-index, and its absolute
distance from center. Reproduce this math **exactly**:

```js
function computeSlideTransform(slideIndex, scrollOffset) {
  // 1. Virtual X of this slide on the track, then wrap it into [0, trackWidth):
  let wrappedOffsetX =
    (((slideIndex * SLIDE_GAP - scrollOffset) % trackWidth) + trackWidth) % trackWidth;
  // 2. Fold the far half back to the negative side so offsets live in [-450, 450):
  if (wrappedOffsetX > trackWidth / 2) wrappedOffsetX -= trackWidth;

  const slideCenterX   = windowCenterX + wrappedOffsetX;                 // px, screen space
  const normalizedDist = (slideCenterX - windowCenterX) / (windowWidth * 0.5); // = offset / halfWidth
  const absDist        = Math.min(Math.abs(normalizedDist), 1.3);        // clamp at 1.3

  // 3. Scale: linear falloff, floored at 0.25
  const scaleFactor  = Math.max(1 - absDist * 0.8, 0.25);
  const scaledWidth  = SLIDE_WIDTH  * scaleFactor;
  const scaledHeight = SLIDE_HEIGHT * scaleFactor;

  // 4. Arc drop: raised-cosine easing, 0 at center → ARC_DEPTH (200) at absDist ≥ 1
  const clampedDist = Math.min(absDist, 1);
  const arcDropY    = (1 - Math.cos(clampedDist * Math.PI)) * 0.5 * ARC_DEPTH;

  // 5. Center lift: linear, CENTER_LIFT (100) at center → 0 at absDist ≥ 0.5
  const centerLiftY = Math.max(1 - absDist * 2, 0) * CENTER_LIFT;

  return {
    x: slideCenterX - scaledWidth / 2,                            // left edge (box is centered on slideCenterX)
    y: arcBaselineY - scaledHeight / 2 + arcDropY - centerLiftY,  // top edge on the arc
    width: scaledWidth,
    height: scaledHeight,
    zIndex: Math.round((1 - absDist) * 100),                      // center 100, decreasing outward (can go negative)
    distanceFromCenter: Math.abs(wrappedOffsetX),                 // used to pick the active caption
  };
}
```

**What this produces (verify against these reference values at `scrollOffset = 0`, 1920×1080):**
the 9 slides sit symmetrically around center with wrapped offsets `0, +100, +200, +300, +400,
-400, -300, -200, -100` px. Center slide: `scale 1`, box `200×275`, `drop 0`, `lift 100`,
`z 100`. Its neighbours: `scale ~0.917`, `drop ~5`, `lift ~79`, `z 90`. Two steps out:
`scale ~0.833`, `drop ~21`, `lift ~58`. Outermost visible pair: `scale ~0.667`, `drop ~74`,
`lift ~17`, `z 58`. So the row curves: **biggest and highest in the middle, shrinking and dipping
toward both edges** — a coverflow arc.

Key nuances to preserve:
- The scale falloff is **linear** (`1 − 0.8·absDist`) with a hard **floor of 0.25**; a slide
  reaches minimum size at `absDist ≈ 0.9375`.
- The vertical arc is a **raised cosine** (`(1 − cos(d·π))/2`), so the drop eases in/out smoothly,
  reaching its full `200 px` at `absDist ≥ 1`.
- The lift is a **narrow linear spike** at the very center: full `100 px` at dead center, gone by
  `absDist = 0.5`. Combined `y = arcBaselineY − scaledHeight/2 + arcDropY − centerLiftY`.
- `absDist` is clamped to `1.3` (so extreme off-center slides don't compute past the arc), and
  z-index is `round((1−absDist)·100)` — the center slide always stacks on top, side slides can even
  go slightly negative.

### Applying the layout — `layoutSlides(scrollOffset)`
```js
function layoutSlides(scrollOffset) {
  slideElements.forEach((slideEl, i) => {
    const { x, y, width, height, zIndex } = computeSlideTransform(i, scrollOffset);
    gsap.set(slideEl, { x, y, width, height, zIndex });
  });
}
```
`gsap.set` writes `x`/`y` as a CSS `transform: translate(...)` and `width`/`height`/`zIndex` inline
— no tween, instantaneous per frame. Call `layoutSlides(0)` once immediately after defining it, so
the arc is correct on first paint before the rAF loop starts.

### Input → scroll target (wheel + touch)
Two module-level accumulators drive everything:
```js
let scrollTarget  = 0;  // raw target, mutated by input
let scrollCurrent = 0;  // smoothed value the layout actually uses
```
Handlers, all attached to `.slider`:
1. **wheel** (`{ passive: false }`, calls `e.preventDefault()`):
   `scrollTarget += e.deltaY * 0.5;`
2. **touchstart**: `touchStartX = e.touches[0].clientX;`
   **touchmove** (`{ passive: false }`, `e.preventDefault()`):
   `scrollTarget += (touchStartX - e.touches[0].clientX) * 1.2; touchStartX = e.touches[0].clientX;`
   (drag-to-scroll: dragging left advances the row, with a 1.2× gain).

There is **no momentum/inertia** beyond the lerp — input mutates `scrollTarget` instantly and
`scrollCurrent` chases it.

### Active-caption sync — `syncActiveTitle(scrollOffset)`
Every frame, find the slide with the smallest `distanceFromCenter` and, **only when the index
changes**, set `titleDisplay.textContent = slideTitles[closestIndex]`. Track the last active index
(start it at `-1`) to avoid redundant DOM writes.

```js
let activeSlideIndex = -1;
function syncActiveTitle(scrollOffset) {
  let closestIndex = 0, closestDist = Infinity;
  slideElements.forEach((_, i) => {
    const { distanceFromCenter } = computeSlideTransform(i, scrollOffset);
    if (distanceFromCenter < closestDist) { closestDist = distanceFromCenter; closestIndex = i; }
  });
  if (closestIndex !== activeSlideIndex) {
    activeSlideIndex = closestIndex;
    titleDisplay.textContent = slideTitles[closestIndex];
  }
}
```

### The render loop (the whole engine)
```js
function animate() {
  scrollCurrent += (scrollTarget - scrollCurrent) * SCROLL_LERP;  // single lerp toward target (0.05/frame)
  layoutSlides(scrollCurrent);
  syncActiveTitle(scrollCurrent);
  requestAnimationFrame(animate);
}
animate();
```
That lerp (factor `0.05`) is the only "easing" in the piece: drags and wheel flicks decelerate
softly as `scrollCurrent` glides toward `scrollTarget`. Because the wrap in
`computeSlideTransform` is modular over `trackWidth`, the row is **truly infinite** — there is no
first or last slide, no snapping, no bounds.

### Resize
On `window.resize`, recompute `windowWidth`, `windowHeight`, `windowCenterX`, and
`arcBaselineY = windowHeight * 0.4`. (The next frame re-lays everything with the new center.)

## Assets / images
- **9 slide slots, 9 distinct full-bleed portrait photographs** (`img1`–`img9`, each a tall portrait
  roughly **4:5**; the slide box itself is 200:275 ≈ 0.727 and `object-fit: cover` crops any real
  ratio).
- Aesthetic: **objects photographed as sculpture**, not as packshots. Single subjects on dark studio
  grounds — charcoal, black slate, velvet — lit hard and directionally, so each frame carries one
  bright form against a deep field. Material over colour: ceramic, glass, chrome, aluminium, stone.
  The captions name cosmetics; the images deliberately do **not** show the products literally, which
  is what keeps the carousel reading as a gallery. Real per-image subjects (generic, **no brand marks
  or baked-in logos/text**):
  1. **Ceramic vessel on chrome** — a crumpled, softly folded stoneware vessel with a cobalt glaze
     wash across its middle, standing on a polished chrome pedestal, deep charcoal background.
  2. **Glass sculpture** — a twisted clear-glass form catching prismatic light, macro detail, black
     backdrop.
  3. **Aluminium form** — a brushed abstract metal shape under soft rim light in a dark studio.
  4. **Chrome compact, open, on black** — an open round polished **silver** double mirror compact,
     lid raised, high specular highlights against a pure **black** background.
  5. **Dark glamour still life** — an upright matte **red** lipstick beside a glossy **black** glass
     jar on a mottled cool **grey** studio backdrop. The single colour accent of the set.
  6. **Stone and steel totem** — stacked slabs of rough stone and steel in chiaroscuro light.
  7. **Frosted monolith** — a frosted glass slab glowing from within, dark scene.
  8. **Chrome torus knot** — a mirror-finish knot floating over velvet, hard specular highlights.
  9. **Amber glass form** — a hand-blown amber vessel on black slate, cinematic light.
- Each `<img>` carries that description as its `alt`; the visible caption for the same slide comes
  from `slideTitles`, and the two intentionally differ.

## Behavior notes
- **Desktop + touch.** Wheel scroll on desktop, touch-drag on mobile — both feed the same
  `scrollTarget`. `e.preventDefault()` on wheel and touchmove suppresses native page scroll so the
  slider owns the gesture.
- **Infinite in both directions**, no start/end, no snap-to-slide. The row idles perfectly still
  (it does not autoplay) until the user interacts, then glides via the lerp.
- The caption updates **discretely** — it swaps only when a different slide becomes the closest to
  center, not continuously.
- No explicit reduced-motion branch in the original; motion is entirely user-driven, so it stays
  static when untouched.
- Keep the loop lean: it recomputes all 9 transforms twice per frame (once for layout, once for the
  caption search) with no per-frame allocations of note; `gsap.set` is the only DOM write path.

## Images

This component ships with 9 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/voku-image-slider/img1.jpg
https://motionprompts.dev/c/voku-image-slider/img2.jpg
https://motionprompts.dev/c/voku-image-slider/img3.jpg
https://motionprompts.dev/c/voku-image-slider/img4.jpg
https://motionprompts.dev/c/voku-image-slider/img5.jpg
https://motionprompts.dev/c/voku-image-slider/img6.jpg
… 3 more under https://motionprompts.dev/c/voku-image-slider/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--bg-fade`, `--ink`, `--muted`, `--hair`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: `mount()` reaches into the page with three lookups — `.slider`, `#slide-title`, and the nine `.slide` boxes — wires `wheel`/`touchstart`/`touchmove` listeners onto the container, and starts a self-recursing `requestAnimationFrame` loop that recomputes the whole arc and writes fresh `x`/`y`/`width`/`height`/`zIndex` onto all nine slides every frame through `gsap.set`. It never has to undo any of that on its own — the page just stays open. React withdraws that guarantee quietly: the arc keeps curving, the caption keeps swapping, and something underneath is now doubled.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that never runs leaves two of everything here: two `wheel`/`touchmove` listeners on the same `.slider` node, each accumulating its own `scrollTarget` from the same pointer events, and two independent `animate()` loops racing to `gsap.set` the same nine slides on every tick. A single wheel notch now moves `scrollTarget` in both closures, so the row advances at roughly double speed, and the arc layout jitters between two writers disagreeing by a frame. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — This script is already closer to React's shape than most in this catalogue: `mount(config)` returns a `destroy()` that undoes exactly what `mount()` built, a split that exists so this catalogue's own editor runtime (`window.MP.register`) can tear the slider down and remount it with a different `arcDepth` or `centerLift` when a knob moves. Drop the `window.MP` branch entirely — it is the editor's hook into this file, not something a consuming app ships. Drop the `document.readyState` check and its `DOMContentLoaded` listener too: that guard exists to survive being loaded late into a plain document, and `useEffect` already runs after the DOM is committed. What is left is exactly the effect body:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS });
  return destroy;
}, []);
```

*(2) Element lookups* — `mount()` opens by resolving `.slider`, `#slide-title` and `.slide` against `document`, and quietly returns a no-op `destroy` if any of the three comes back empty. That guard is fine; the lookup itself is not — `#slide-title` is a bare ID selector, and two copies of this slider on one page, or the two transient copies StrictMode mounts side by side for an instant, resolve to the same node, so one instance's caption starts overwriting the other's. Scope all three lookups to a root ref instead of `document`: pass the root element into `mount`, or have it query inside `rootRef.current`.

*(3) Cleanup* — `mount()`'s own `destroy()` already does what the rAF-driven components in this catalogue usually need adding by hand: it flips the `alive` flag `animate()` checks on entry, cancels the exact `rafId` the last `requestAnimationFrame` call returned, removes the same `onWheel`/`onTouchStart`/`onTouchMove`/`onResize` references that were attached, puts `titleDisplay.textContent` back to the caption's original text, and erases the nine slides' inline styles with `gsap.killTweensOf(slideElements)` followed by `gsap.set(slideElements, { clearProps: "all" })`. Return that `destroy` unmodified — it is already the correct, complete cleanup, not a legacy shape to translate into something more idiomatic.

Do not reach for `gsap.context` on top of it. A context exists to auto-revert tweens, triggers and inline styles a factory function creates, and to give deferred callbacks a place to register via `self.add`. Nothing here fits that shape: this component builds no tween and no trigger, and its one property writer, `gsap.set`, runs from inside `animate()`'s own recursive `requestAnimationFrame` call — outside the synchronous pass a context tracks. Wrapping the setup in a `gsap.context` would add a revert call with nothing useful to revert, while the cleanup that actually matters — cancelling the frame, removing the four listeners, restoring the caption, clearing the nine sets of inline styles — still has to be written by hand, exactly as `destroy()` already does it. Keep that function as the cleanup as-is.
