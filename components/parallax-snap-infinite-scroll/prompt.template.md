---
slug: parallax-snap-infinite-scroll
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Infinite Vertical Project List — Lerp-Smoothed Scroll, Recycled Slides, Per-Image Parallax, Cubic Snap

## Goal
Build a **full-viewport, endlessly looping vertical project gallery**. Each "slide" is a 100vw × 100vh split screen — one half is a project title (name + catalog number), the other half is a full-bleed image — and the halves **alternate sides** down the list. Wheel and touch scrolling drive a `translateY` on every slide through a **lerp inside a `requestAnimationFrame` loop**, so nothing jumps: the whole column glides and settles with inertia-like smoothness. Three details sell it: (1) the list is **infinite in both directions** — slides are procedurally created around the viewport and recycled out of a `Map`, so you can scroll forever; (2) each slide's image gets an **independent parallax offset** (it drifts against the scroll at a 0.2 ratio, with its own secondary lerp); and (3) when scrolling **stops**, the list eases with a **cubic ease-out** to snap the nearest slide perfectly into the frame.

## Tech
Vanilla HTML/CSS/JS with ES module imports. **No GSAP and no animation libraries are needed** — the entire engine is a hand-rolled `requestAnimationFrame` loop with linear interpolation (lerp) plus a manual cubic-ease snap. No smooth-scroll library either: the page itself never scrolls (`body { overflow: hidden }`); the wheel is hijacked to drive the slides. Everything runs on plain DOM `style.transform` writes.

## Layout / HTML
The static HTML is almost empty — the JS builds every slide by cloning a hidden template.

```
.container
  ul.project-list
    .project.template  (style="display:none" — the clone source)
      .side
        .title
          h1  "Euphoria"
          h1  "01"
      .side
        .img > img (src="" alt="")

script type="module" src="./script.js"
```

The template holds both halves in the **title-left / image-right** order; the JS rewrites each clone's `innerHTML` to place the image on the correct side per slide (see below). Key classes the engine depends on: `.container`, `.project-list`, `.project`, `.template`, `.side`, `.img`, `.title`.

Put the slide data inline in `script.js` as an array of 6 objects. `isAlternate` decides which half the image lands in (`false` = title-left/image-right, `true` = image-left/title-right); it alternates down the list:

```js
const projectData = [
  { title: "Euphoria",      image: "./images/img1.jpeg", isAlternate: false },
  { title: "Scratcher",     image: "./images/img2.jpeg", isAlternate: true  },
  { title: "Ember",         image: "./images/img3.jpeg", isAlternate: false },
  { title: "Liquid Soleil", image: "./images/img4.jpeg", isAlternate: true  },
  { title: "Vacuum",        image: "./images/img5.jpeg", isAlternate: false },
  { title: "Synthesis",     image: "./images/img6.jpeg", isAlternate: true  },
];
```

## Styling
**Font** — the CSS sets `html, body { font-family: "Lay Grotesk"; }`, but **no `@font-face` / web-font is loaded**, so it simply falls back to the platform default sans-serif. Use any clean grotesk (or the system default); the type look is fully defined by the `h1` rules below, not by that family name.

**Global reset / page** — `* { margin:0; padding:0; box-sizing:border-box }`. `html, body { width:100%; height:100%; overflow:hidden }`. Background is the default white; text default black. No color palette beyond that — the images supply all the color.

**Structure CSS** (load-bearing — the transforms only work with this positioning):
- `.container`: `position: fixed; width: 100%; height: 100vh;` — the fixed stage.
- `.project-list`: `position: absolute; width: 100%; list-style: none; will-change: transform;`.
- `.project`: `width: 100vw; height: 100vh; display: flex; overflow: hidden; position: absolute; left: 0; will-change: transform;` — **every slide is absolutely stacked at the top-left**; its `translateY` is the only thing that positions it vertically. `display:flex` splits it into the two halves.
- `.side`: `flex: 1; height: 100%; overflow: hidden;` — the two equal halves.
- `.img`: `width: 100%; height: 100%; overflow: hidden;` — the clipping mask around the image.
- `img`: `position: relative; width: 100%; height: 100%; object-fit: cover; will-change: transform; transform: translateY(0) scale(1.5);` — the **`scale(1.5)` zoom is the parallax headroom**; the JS overwrites this transform every frame (always re-appending `scale(1.5)`).
- `.title`: `display: flex; justify-content: space-between; align-items: center;` — pushes the name to one edge and the number to the other within its half.
- `h1`: `text-transform: uppercase; font-size: 2.5rem; font-weight: 500; letter-spacing: -0.0125rem; padding: 0.5em;` — big uppercase grotesk; the `0.5em` padding is what separates the name from the number.

## The animation engine (exhaustive — this IS the effect)

No GSAP. Everything below is one `requestAnimationFrame` loop plus event handlers mutating a shared `state` object, and a `Map`-based slide recycler.

### Helpers, config, state
```js
const lerp = (start, end, factor) => start + (end - start) * factor;

const config = {
  SCROLL_SPEED: 0.75,     // wheel deltaY multiplier
  LERP_FACTOR: 0.05,      // main list smoothing per frame
  BUFFER_SIZE: 15,        // slides kept alive on each side of the current index
  CLEANUP_THRESHOLD: 50,  // remove slides farther than this (in indices) from current
  MAX_VELOCITY: 120,      // per-wheel-event clamp
  SNAP_DURATION: 500,     // ms of the snap ease
};

const state = {
  currentY: 0, targetY: 0,      // the lerp pair driving the whole column
  lastY: 0,                     // targetY captured at touch start
  scrollVelocity: 0,
  isDragging: false, startY: 0,
  projects: new Map(),          // index -> .project element
  parallaxImages: new Map(),    // index -> per-image parallax controller
  projectHeight: window.innerHeight,
  isSnapping: false, snapStartTime: 0, snapStartY: 0, snapTargetY: 0,
  lastScrollTime: Date.now(),
  isScrolling: false,
};
```

### Slide indexing and the infinite data wrap
Slides are addressed by a signed integer `index` (…, −2, −1, 0, 1, 2, …). The data array (length 6) is wrapped with a **negative-safe modulo** so any index maps to a real project:
```js
const wrap = (i) => ((Math.abs(i) % projectData.length) + projectData.length) % projectData.length;
const getProjectData = (index) => projectData[wrap(index)];
```
The displayed **catalog number** is `(wrap(index) + 1)` padded to 2 digits → `"01"`…`"06"`, repeating every 6 slides.

### Creating a slide (`createProjectElement(index)`)
1. If `state.projects.has(index)`, bail (idempotent).
2. Clone the `.template`, set its `display:flex`, remove the `template` class.
3. Rewrite `innerHTML` with the two `.side` halves. If `data.isAlternate` → **image half first, title half second**; else → **title half first, image half second**. Title half is `<div class="side"><div class="title"><h1>${title}</h1><h1>${number}</h1></div></div>`; image half is `<div class="side"><div class="img"><img src="${image}" alt="${title}" /></div></div>`.
4. Position it: `project.style.transform = translateY(${index * state.projectHeight}px)` (its base slot before scroll offset).
5. Append to `.project-list`, store in `state.projects`, and create + store its parallax controller (below) in `state.parallaxImages`.

### Per-image parallax controller (`createParallaxImage(imgEl)`)
Closure over one `<img>`; captures bounds **once at creation** (right after the base transform is set, so `bounds.top ≈ index * projectHeight`):
```js
updateBounds() → rect = imgEl.getBoundingClientRect();
                 bounds = { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
                 // window.scrollY is always 0 (page never scrolls)

update(scroll) {                             // called every frame with state.currentY
  const relativeScroll = -scroll - bounds.top;      // = -(slide's current on-screen Y)
  targetTranslateY = relativeScroll * 0.2;          // parallax ratio 0.2
  currentTranslateY = lerp(currentTranslateY, targetTranslateY, 0.1);  // secondary lerp 0.1
  if (Math.abs(currentTranslateY - targetTranslateY) > 0.01)
    imgEl.style.transform = `translateY(${currentTranslateY}px) scale(1.5)`;
}
```
Net effect: an image whose slide sits at on-screen Y = `y` targets `translateY = -0.2 * y`. A slide **above** the viewport (negative y) pushes its image **down**; a slide **below** (positive y) pulls it **up**; a slide perfectly framed (y ≈ 0) targets 0. The extra `scale(1.5)` gives the room to move without exposing edges, and the **0.2 ratio + independent 0.1 lerp** make each image drift slightly slower and laggier than the slide it lives in.

### Buffering & recycling (`checkAndCreateProjects`, run every frame)
- `currentIndex = Math.round(-state.targetY / state.projectHeight)`.
- Ensure every index in `[currentIndex − BUFFER_SIZE, currentIndex + BUFFER_SIZE]` (±15) exists → creates them as needed.
- **Cleanup:** any slide whose index is more than `CLEANUP_THRESHOLD` (50) away from `currentIndex` is `.remove()`d and deleted from both maps. This keeps the DOM bounded (~31 live slides in steady state) while the loop stays infinite.
- On load, `createInitialProjects()` seeds indices `−15 … +15`.

### Snap logic (cubic ease-out, manual)
- `getClosestSnapPoint()` → `-Math.round(-state.targetY / state.projectHeight) * state.projectHeight` (the nearest whole-slide offset).
- `initiateSnap()` → `isSnapping = true; snapStartTime = Date.now(); snapStartY = targetY; snapTargetY = getClosestSnapPoint();`.
- `updateSnap()` per frame:
  ```js
  const progress = Math.min((Date.now() - snapStartTime) / config.SNAP_DURATION, 1); // 0→1 over 500ms
  const t = 1 - Math.pow(1 - progress, 3);   // cubic ease-out
  state.targetY = snapStartY + (snapTargetY - snapStartY) * t;
  if (progress >= 1) { state.isSnapping = false; state.targetY = snapTargetY; }
  ```
  Note the snap animates **`targetY`** (not `currentY`); `currentY` then lerps toward it, so the snap is doubly softened.

### The rAF loop (`animate`) — order matters
```js
function animate() {
  const timeSinceLastScroll = Date.now() - state.lastScrollTime;

  // 1. Auto-snap once input has been idle > 100ms and we're not already snapping/dragging
  if (!state.isSnapping && !state.isDragging && timeSinceLastScroll > 100) {
    const snapPoint = getClosestSnapPoint();
    if (Math.abs(state.targetY - snapPoint) > 1) initiateSnap();
  }

  // 2. Advance the snap ease if active (writes targetY)
  if (state.isSnapping) updateSnap();

  // 3. Main lerp — ONLY when not dragging: currentY chases targetY at factor 0.05
  if (!state.isDragging) state.currentY += (state.targetY - state.currentY) * config.LERP_FACTOR;

  // 4. Grow/recycle the buffer around the current index
  checkAndCreateProjects();

  // 5. Position every live slide and update its image parallax
  state.projects.forEach((project, index) => {
    const y = index * state.projectHeight + state.currentY;
    project.style.transform = `translateY(${y}px)`;
    state.parallaxImages.get(index)?.update(state.currentY);
  });

  requestAnimationFrame(animate);
}
```
- **The main lerp factor is 0.05** — this exponential chase is the entire "smoothness" of the column; every input only ever nudges `targetY`.
- **While dragging, `currentY` is intentionally frozen** (step 3 is skipped): the visible column holds during a touch drag and then eases to catch up to `targetY` the moment the finger lifts.

### Input handlers
- **Wheel** (`window`, `{ passive: false }`): `e.preventDefault()`; cancel any snap (`isSnapping = false`); stamp `lastScrollTime = Date.now()`; then
  ```js
  const scrollDelta = e.deltaY * config.SCROLL_SPEED;                  // ×0.75
  state.targetY -= Math.max(Math.min(scrollDelta, config.MAX_VELOCITY), -config.MAX_VELOCITY); // clamp ±120 per event
  ```
  Scroll down (positive `deltaY`) decreases `targetY` → the column moves **up**. The ±120 clamp caps how far a single wheel tick can throw it.
- **Touch drag** (`window`):
  - `touchstart` → `isDragging = true; isSnapping = false; startY = e.touches[0].clientY; lastY = state.targetY; lastScrollTime = Date.now();`.
  - `touchmove` → if not dragging, return; else **absolute** delta from the start point: `deltaY = (e.touches[0].clientY - startY) * 1.5` (drag multiplier **1.5×**), `state.targetY = lastY + deltaY;` and re-stamp `lastScrollTime`.
  - `touchend` → `isDragging = false` (which re-enables the main lerp so the column catches up, then auto-snaps after 100ms idle).
- **Resize** (`window`): `state.projectHeight = window.innerHeight`; re-base every slide's transform to `translateY(index * projectHeight)` and call each image's `updateBounds()` (the next frame re-applies `currentY` and re-parallaxes).

### Boot
Wrap init in `DOMContentLoaded`: attach the listeners, `createInitialProjects()`, then start `animate()`.

## Assets / images
**6 images**, one per slide, each shown in a **half-viewport-wide × full-viewport-tall column** (so a tall portrait frame, roughly 1:2 at desktop widths) via `object-fit: cover` zoomed `scale(1.5)`, so most portrait-ish sources work. They should read as one **moody, editorial, cinematic portrait series** — dark, high-contrast, art-directed. By role/order:
1. Low-key studio portrait — sharp black bowl-cut hair, black turtleneck, a long pearl earring, soft blue-grey backdrop ("Euphoria" / 01).
2. Portrait with eyes closed inside a large sculptural sheer **orange** fabric headpiece billowing in warm light on cream ("Scratcher" / 02).
3. Figure fully draped in flowing **teal/sea-green** fabric, seated on a rocky desert outcrop under a clear blue sky ("Ember" / 03).
4. Face wrapped in horizontal bands of sheer black fabric — near-monochrome, very dark and high-contrast ("Liquid Soleil" / 04).
5. Profile silhouette, short bob + round glasses, lit entirely in saturated **red** ("Vacuum" / 05).
6. Extreme close-up of a face emerging from glossy, liquid-like **black-chrome** material with bright reflections ("Synthesis" / 06).

No logos, no brand marks — all titles ("Euphoria", "Scratcher", "Ember", "Liquid Soleil", "Vacuum", "Synthesis") are fictional project names. Because the data wraps every 6 slides, the same 6 images/titles repeat endlessly as you scroll.

## Behavior notes
- **Truly infinite both directions** — the recycler always keeps ±15 slides live around the current index and prunes beyond ±50, so the DOM stays small while scrolling never hits an end.
- **Snap-to-slide** kicks in ~100ms after the last input and eases (cubic ease-out over 500ms) so a whole slide always ends up perfectly framed; any new wheel/touch input cancels an in-progress snap.
- **Per-image parallax** is subtle and continuous (ratio 0.2, own lerp 0.1) — images drift within their frames as slides travel, always keeping the `scale(1.5)` zoom.
- The page never scrolls; only the slides' transforms move (`.container` is `position: fixed`, `body` is `overflow: hidden`). Wheel is `preventDefault`ed.
- Touch is fully supported (1.5× drag); note the deliberate quirk that the column visually freezes *during* a drag and catches up on release.
- No reduced-motion guard in the original — the rAF loop runs continuously. Everything degrades to a static first screen if JS is off (only the hidden template exists in the static HTML).

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/parallax-snap-infinite-scroll/img1.jpeg
https://motionprompts.dev/c/parallax-snap-infinite-scroll/img2.jpeg
https://motionprompts.dev/c/parallax-snap-infinite-scroll/img3.jpeg
https://motionprompts.dev/c/parallax-snap-infinite-scroll/img4.jpeg
https://motionprompts.dev/c/parallax-snap-infinite-scroll/img5.jpeg
https://motionprompts.dev/c/parallax-snap-infinite-scroll/img6.jpeg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--muted`, `--accent`, `--hair`, `--font`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: a script that reaches into the page with `document.querySelector(".template")` and `document.querySelector(".project-list")`, then keeps five `window`-level listeners (`wheel`, `touchstart`, `touchmove`, `touchend`, `resize`) and a self-recursing `requestAnimationFrame` loop alive for as long as the page is open, the loop driving two independent `Map`s of live elements. React withdraws all of that at once, and it does it quietly — the column keeps gliding, but something underneath is now doubled.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that never runs leaves two of everything here: two `animate()` loops each lerping their own `currentY` toward their own `targetY`, two sets of `wheel`/`touch`/`resize` listeners each nudging a different `targetY`, and two populations of cloned `.project` elements appended into the same `.project-list` — every slide rendered twice, one copy sliding on whichever loop's snap timer fired last, visibly out of phase with the other. The symptom is a column that jitters or briefly shows duplicated slides on the first scroll, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — This script is already shaped like a React effect: the body is a `mount(config)` that returns a `destroy()` undoing exactly what `mount()` built. The comment above `mount` explains why `state` lives inside the function instead of at module scope — so a remount starts clean, without inheriting the previous scroll position, the project clones already on screen, or a snap that was mid-flight — which is exactly the guarantee a StrictMode remount needs. Drop the `window.MP` branch entirely; that is this catalogue's own editor hook, not something a consuming app ships. Drop the `document.readyState` check and its `DOMContentLoaded` listener too — that guard exists to survive being loaded late into a plain document, and `useEffect` already runs after the DOM is committed. What is left is exactly the effect body:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS });
  return destroy;
}, []);
```

*(2) Element lookups* — `mount()` opens with `document.querySelector(".template")` and `document.querySelector(".project-list")`, bailing to a no-op `destroy` if either is missing. Neither is a descendant this component reaches into by accident: `.template` is the hidden clone source every slide is built from, and `.project-list` is the parent every clone gets appended into and the element `checkAndCreateProjects` removes stale clones from on every frame. Give the component a ref on the wrapping `.container`, resolve `.template` and `.project-list` inside it, and pass them (or the container) into `mount` instead of letting it search the whole document. This matters most during the StrictMode remount: for an instant two copies of the subtree exist, and an unscoped query can hand the loop and the wheel/touch listeners the `.project-list` that is on its way out, while the visible one sits empty.

*(3) Cleanup* — `mount()`'s own `destroy()` already does the work this catalogue's rAF-driven components usually need adding by hand, and it does it precisely because the five listeners live on `window`, not on any node inside this component's own subtree — they cannot die on their own when React unmounts the tree, the way a listener bound to an element would. `destroy()` calls `cancelAnimationFrame` on the exact `frame` handle `animate()` last returned, removes each of the five `window` listeners by the same function reference `addEventListener` was given, then walks `state.projects` to remove every cloned `.project` it created and clears both `Map`s — not a `querySelectorAll(".project")` sweep, but the precise set this closure produced. `.template` itself is correctly never touched, since `createProjectElement` clones it rather than storing it in `state.projects`. Return `destroy` unmodified from the effect.

One more thing is worth keeping exactly as it is rather than "cleaning up" on the way in: `currentY`, `targetY`, and the two `Map`s are plain closured state, mutated every frame by `animate()` and every wheel/touch/resize event, then written straight into `project.style.transform` and — through each entry in `parallaxImages`, which closes over its own `bounds`, `currentTranslateY` and `targetTranslateY` — into each image's own `style.transform`. Nothing in JSX ever reads any of it. Promoting this state to `useState` would re-render the component on every animation frame and every pixel of wheel or touch input for values the render tree never consumes; leave it as closured variables inside `mount`, exactly as written. Likewise, the `wheel` listener is registered with `{ passive: false }` specifically so its `e.preventDefault()` can stop the page from scrolling while this component hijacks the gesture to drive `targetY` instead. If this becomes a JSX `onWheel` prop rather than the manual `addEventListener` call `mount()` already uses, React binds it passively, `preventDefault()` silently does nothing, and the browser scrolls the document out from under the column on the very first wheel tick.
