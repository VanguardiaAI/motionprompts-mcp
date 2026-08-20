---
slug: sarah-bassett
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 6
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "2.5", rule: value/narrated }
  - { kind: ease, literal: "\"power1.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Zoomable Image Wall — random-stagger mosaic reveal + click-zoom explosion + drag-to-pan

## Goal
Build a full-viewport, pitch-black **mosaic wall of 1200 tiny image tiles** that fills a canvas larger than the screen. On load, every tile **pops in from `scale:0` to `scale:1` with a random grid stagger** (the mosaic materialises tile-by-tile in no particular order). A floating pill of two buttons (zoom-out / zoom-in) toggles a **2.5s zoom**: clicking zoom-in makes every tile **explode radially outward from the viewport centre and blow up to 5×** (you dive into the wall); clicking zoom-out reverses it. While zoomed, a transparent drag layer lets you **click-drag to pan** the enlarged wall, smoothed by a manual `requestAnimationFrame` lerp loop writing `translate3d`. No scroll, no ScrollTrigger, no GSAP plugins — just core `gsap`, a click state machine, and a rAF pan loop.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm) only** — no plugins (no ScrollTrigger, no SplitText), no Lenis. Import as:
```js
import gsap from "gsap";
```
All logic runs inside a `DOMContentLoaded` listener. The load reveal and the two zoom transitions use `gsap.to` / `gsap.timeline`; the drag-pan uses a plain `lerp` + `requestAnimationFrame` loop (not GSAP).

## Layout / HTML
```html
<body>
  <div class="logo"><p>Motionprompts</p></div>

  <div class="pads">
    <button id="zoom-out" class="active"><!-- magnifier-minus SVG --></button>
    <button id="zoom-in"><!-- magnifier-plus SVG --></button>
  </div>

  <div id="drag-layer"></div>

  <div class="container">
    <div class="gallery"></div>
  </div>

  <script type="module" src="./script.js"></script>
</body>
```
- `.logo` — small frosted pill fixed top-centre with a short uppercase wordmark (neutral text, e.g. "MOTIONPROMPTS").
- `.pads` — frosted pill fixed bottom-centre holding two icon buttons. `#zoom-out` starts with class `active` (it is the current state on load — the wall begins zoomed OUT). Each button holds an 18×18 white-stroked SVG: `#zoom-out` a magnifier with a minus, `#zoom-in` a magnifier with a plus.
- `#drag-layer` — full-viewport transparent overlay, `display:none` by default; shown only while zoomed to capture drag input.
- `.container` → `.gallery` — the oversized stage and the flex-wrap mosaic. **The 1200 tile `<div class="img">` elements (each wrapping an `<img>`) are created in JS, not in the HTML.**

## Styling
Global reset `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; background:#000; overflow:hidden; }` — the whole page is black and never scrolls. `img { width:100%; height:100%; object-fit:cover; user-select:none; }`.

- `.logo`: `position:fixed; left:50%; transform:translateX(-50%); width:20%; margin:2em auto; padding:8px 0; text-align:center; background-color:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-radius:8px; z-index:2;`. Its `p`: `text-transform:uppercase; font-family:"PP Neue Montreal", sans-serif;` (any clean neutral grotesque sans is fine) `font-size:12px; font-weight:500;`.
- `.pads`: `position:fixed; left:50%; bottom:2em; transform:translateX(-50%); padding:0 4px; display:flex; gap:0.2em; background-color:rgba(255,255,255,0.25); border:1px solid rgba(255,255,255,0.125); backdrop-filter:blur(20px); border-radius:8px; z-index:2;`.
- `.pads button`: `opacity:1; outline:none; border:none; background:none; padding:8px; transition:0.5s opacity; pointer-events:all;`.
- `.pads button.active`: `opacity:0.5; pointer-events:none;` — the active (current) button is dimmed and un-clickable; the other one is the live control.
- `.container`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:150vw; height:150vh; overflow:visible;` — **a stage 1.5× the viewport in both axes**, centred, so the mosaic bleeds well past the screen edges.
- `.gallery`: `position:relative; width:100%; height:100%; display:flex; flex-wrap:wrap; justify-content:center; align-items:flex-start; gap:4px; padding:4px; transform-origin:center center; will-change:transform;` — a centred flex-wrap grid of the tiles. **The gallery's own `transform` is used exclusively by the drag-pan loop.**
- `.img` (each tile): `width:calc((100% - 236px) / 60); transform:scale(0); transform-origin:center center; will-change:transform; pointer-events:none; opacity:0;` — starts invisible and collapsed. The width math packs **exactly 60 tiles per row**: `236px = 59 gaps × 4px`, so `(100% − total gaps) / 60` = one tile width. Each tile's **height is set inline in JS to a random 30–40px** (so rows have slightly ragged, editorial heights).
- `#drag-layer`: `position:fixed; top:0; left:0; width:100vw; height:100vh; display:none; touch-action:none; z-index:1;`.

## Building the mosaic (JS — do this first)
```js
const totalRows = 20;
const imagesPerRow = 60;
const totalImages = totalRows * imagesPerRow; // 1200
```
Loop `i` from `0` to `1199`:
- Create `div.img`; set `img.style.height = ${randomInt(30,40)}px` (inclusive random).
- Create an `<img>`; `src = "/c/sarah-bassett/img" + (randomInt(1,50)) + ".jpg"` — **each tile is randomly assigned one of 50 source images**, so the wall is a repeating-but-shuffled mosaic. (In a fresh project, point these at your own image folder.)
- Append `<img>` → `div.img` → `.gallery`; push each `div.img` into an `images[]` array.

## GSAP effect (the core — be exhaustive)

### 1. Load reveal — random grid stagger (fires once, on load)
```js
gsap.to(images, {
  scale: 1,
  opacity: 1,
  duration: 0.5,
  delay: 1,
  ease: "power1.out",
  stagger: {
    amount: 1.5,          // total spread of all 1200 start times = 1.5s
    grid: [totalRows, imagesPerRow], // [20, 60] — GSAP treats the array as a 2D grid
    from: "random",       // start times assigned in random grid order
  },
});
```
- Every tile animates `scale: 0 → 1` and `opacity: 0 → 1` over `0.5s` with `power1.out`.
- **`delay: 1`** — the whole wall waits 1s (blank black), then begins.
- **`stagger.amount: 1.5`** spreads the 1200 start times across a 1.5s window; **`from: "random"` with `grid: [20, 60]`** means tiles pop in in a scattered, non-sequential order (the mosaic "develops" like film). Total reveal ≈ 1s delay + 1.5s spread + 0.5s tail ≈ 3s.
- No timeline — a single tween across the `images[]` array.

### 2. Zoom IN — radial explosion to 5× (on `#zoom-in` click)
Guard: if already zoomed, return. Set `isZoomed = true`, show `#drag-layer` (`display:block`). Then **per tile**, read its current on-screen position and tween it outward from the viewport centre:
```js
images.forEach((img) => {
  const rect = img.getBoundingClientRect();
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const distX = (rect.left + rect.width / 2 - centerX) / 100; // signed, /100
  const distY = (rect.top  + rect.height / 2 - centerY) / 100;

  gsap.to(img, {
    x: distX * 1200,   // horizontal blast is 2× stronger than vertical
    y: distY * 600,
    scale: 5,
    duration: 2.5,
    ease: "power4.inOut",
  });
});
```
- Each tile's displacement is **proportional to its distance from the viewport centre** — centre tiles barely move, edge tiles fly far — producing a radial "dive into the wall" explosion. Net horizontal factor `= (dist/100)*1200 = dist*12`; vertical `= dist*6` (so the blast is anamorphic, wider than tall).
- All tiles scale `1 → 5`, over `2.5s`, `power4.inOut` (slow-in / slow-out, punchy middle).
- Swap button states: remove `active` from `#zoom-out`, add `active` to `#zoom-in`.

### 3. Zoom OUT — collapse back home (on `#zoom-out` click)
Guard: if not zoomed, return. Set `isZoomed = false`, hide `#drag-layer`. Capture and neutralise any drag offset, then reverse both the tile explosion and the gallery pan simultaneously:
```js
const currentTransform = getComputedStyle(gallery).transform; // whatever the drag left
gsap.set(gallery, { clearProps: "transform" });

const tl = gsap.timeline({ defaults: { duration: 2.5, ease: "power4.inOut" } });
tl.fromTo(gallery, { transform: currentTransform }, { x: 0, y: 0 })   // pan the wall back to origin
  .to(images, { scale: 1, x: 0, y: 0 }, 0);                            // AND collapse tiles home, at position 0
```
- **Position param `0`** on the second tween → both run **together** from the timeline start (the gallery slides back to `translate(0,0)` while every tile shrinks `5 → 1` and returns to `x:0, y:0`).
- Same `2.5s` / `power4.inOut` as zoom-in.
- Reset the pan state variables (`currentX = currentY = targetX = targetY = 0; isDragging = false;`).
- Swap button states back: add `active` to `#zoom-out`, remove from `#zoom-in`.

### 4. Drag-to-pan — manual lerp loop (active only while zoomed)
Not GSAP — a hand-rolled interpolation loop that writes the **gallery's** transform:
```js
function lerp(start, end, factor) { return start + (end - start) * factor; }

let isDragging=false, startX=0, startY=0, initialX=0, initialY=0,
    targetX=0, targetY=0, currentX=0, currentY=0;

function animate() {
  if (isDragging || Math.abs(targetX-currentX) > 0.01 || Math.abs(targetY-currentY) > 0.01) {
    currentX = lerp(currentX, targetX, 0.075);   // lerp factor 0.075 → smooth, weighty glide
    currentY = lerp(currentY, targetY, 0.075);
    requestAnimationFrame(() => {
      gallery.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    });
  }
  requestAnimationFrame(animate);
}
animate();
```
Pointer/touch handlers on `#drag-layer` (mouse + touch):
- **drag start** (`mousedown` / `touchstart`): only if `isZoomed`. Record `startX/startY` from the pointer; read the gallery's current translate via `new DOMMatrix(getComputedStyle(gallery).transform)` → `m41`/`m42` into `initialX/initialY`, and seed `currentX/Y = targetX/Y = initialX/Y`. Attach move/end listeners (`passive:false` on move so `preventDefault` works).
- **drag move**: `targetX = initialX + (pointerX − startX)`, `targetY = initialY + (pointerY − startY)`. The lerp loop chases the target, so the wall follows the cursor with inertia.
- **drag end**: `isDragging = false`, detach the move/end listeners. The loop keeps easing to rest, then idles.

No CustomEase; the only easings are GSAP's `power1.out` (reveal) and `power4.inOut` (both zooms), plus the manual `0.075` lerp for panning.

## Assets / images
**50 interchangeable source images** (`img1…img50`), each rendered inside a tiny `object-fit:cover` tile roughly **~24×30–40px** (portrait-ish, ~2:3-to-3:4), and each randomly reused many times across the 1200-tile wall — so at wall scale they read as a dense, colourful editorial mosaic, and only become legible photographs once you zoom in 5×. They form one cohesive high-fashion **studio-editorial** set: bold, saturated, warm-lit fashion photography — models embracing/posing, cropped accessory and still-life shots (handbags, sunglasses, a single high heel, a vintage phone/radio, a disco ball), and moody light-beam portraits. Recurring palette of **deep reds, teals, greens, warm yellows and neutral studio tones**. Provide 50 files named sequentially; if fewer are available, repeat them — the mosaic is intentionally random and repeating anyway. No logos or brand marks.

## Behavior notes
- **State machine:** exactly two states, out (default) and in. The dimmed `.active` button marks the current state and is un-clickable; the live button is the other one. Clicks are ignored if already in that state (the early-return guards).
- **Drag only works while zoomed in** (`#drag-layer` is `display:none` when zoomed out, and handlers early-return unless `isZoomed`). Both mouse and touch are supported (`touch-action:none` on the layer).
- **No scroll anywhere** — `body { overflow:hidden }`, the stage is `position:absolute`. Nothing is scroll-driven.
- Heavy tile count (1200 DOM nodes); `will-change:transform` on tiles and gallery, and the reveal/zoom lean on GPU transforms. Reasonable on desktop; on mobile it still functions (touch drag works) but is the perf-sensitive part.
- No reduced-motion handling in the original; the load reveal autoplays once, everything else is user-triggered.

## Images

This component ships with 50 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/sarah-bassett/img1.jpg
https://motionprompts.dev/c/sarah-bassett/img10.jpg
https://motionprompts.dev/c/sarah-bassett/img11.jpg
https://motionprompts.dev/c/sarah-bassett/img12.jpg
https://motionprompts.dev/c/sarah-bassett/img13.jpg
https://motionprompts.dev/c/sarah-bassett/img14.jpg
… 44 more under https://motionprompts.dev/c/sarah-bassett/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--paper-dim`, `--red`, `--glass`, `--glass-line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: `mount(config)` reaches into `document`
directly and only unwinds because something calls the `destroy()` it returns. React withdraws the
guarantee that something *will* call it at the right moment, and it does so quietly — the wall
renders, looks right for a moment, and then misbehaves in a way that does not point back at any of
this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. `mount()` as written builds 1,200 fresh `.img` nodes and appends them to
`.gallery` every time it runs; call it twice without running the matching `destroy()` in between
and the wall doubles to 2,400 tiles, the reveal tween fires across two overlapping `images[]`
arrays, and two drag-pan loops write competing `translate3d` values onto the same `.gallery`
element. None of this reproduces in a production build, because React only does the double mount
in development — treat the `destroy()` this function already hands you as load-bearing, not
optional.

*(1) The entry point.* The guard at the bottom of the file — checking `document.readyState`
before subscribing to `DOMContentLoaded` — exists to survive being loaded late into a plain
document; a `useEffect` already runs after the DOM is committed, so drop the guard and the
listener both. Drop the `window.MP.register` branch above it too: that path is this catalogue's
own visual-editor hook, not part of the component, and a React host has no `window.MP` to satisfy
it. What survives is exactly `mount(config)`, and it already returns the right shape — a factory
you call once and a teardown you keep:

```jsx
useEffect(() => {
  const destroy = mount(config);
  return () => destroy();
}, []);
```

*(2) Element lookups.* `.gallery`, `#zoom-out`, `#zoom-in` and `#drag-layer` are all found with an
unscoped `querySelector`/`getElementById`, on the assumption that exactly one of each exists in
the document. The two ids are the sharper failure mode: mount two copies of this component (or
just survive the StrictMode remount, which briefly leaves two copies of the subtree in the DOM)
and both calls to `getElementById("zoom-in")` resolve to whichever node comes first in document
order — so the second instance's zoom button silently drives the first instance's wall instead of
its own. Give the component a root ref on the wrapper that contains `.gallery` and the button
pair, and scope every one of those four lookups to it.

*(3) Cleanup.* The script already hands you a `destroy()` more thorough than a bare `gsap.context`
revert would be, and the parts a context can't cover are exactly the parts this component leans on
hardest.

The load reveal is caught for free; the two zoom tweens are not, unless you register them. Wrap
the body of `mount()` in `gsap.context((self) => { ... }, rootRef)`. The initial
`gsap.to(images, { ... })` reveal runs synchronously while the factory executes, so `ctx.revert()`
sweeps it automatically. `onZoomIn` and `onZoomOut` are click handlers — their `gsap.to` and
`gsap.timeline` calls run long after the factory has returned, on a click GSAP has no way to
associate with the context unless told to. Register both by name with `self.add`, inside the
factory, so they replay inside the context when the click actually happens — and call the two
buttons against `ctx`, never against the bare functions, from outside the factory where `ctx` is
already assigned:

```jsx
const ctx = gsap.context((self) => {
  gsap.to(images, { /* the load reveal, exactly as above */ });
  self.add("zoomIn", onZoomIn);
  self.add("zoomOut", onZoomOut);
}, rootRef);
zoomInBtn.addEventListener("click", () => ctx.zoomIn());
zoomOutBtn.addEventListener("click", () => ctx.zoomOut());
```

Skip this and the explosion-out / collapse-back timelines survive their own `ctx.revert()` — the
zoom still works on first mount, it just isn't torn down with everything else.

`ctx.revert()` doesn't remove the 1,200 tiles it animated, and it doesn't touch a single listener.
It undoes tweens, timelines and the inline transform/opacity/scale GSAP wrote — it has no idea
these particular nodes were created by this mount and belong nowhere else on the page. Keep the
rest of the existing teardown exactly as written: `images.forEach((img) => img.remove())`; the
four listeners on the buttons and the drag layer; and — because the drag handlers attach
`mousemove`/`touchmove`/`mouseup`/`touchend` to `document` mid-gesture rather than up front —
removing those same four from `document` unconditionally in the same cleanup, even if no drag is
in progress when the component unmounts, exactly as the original already does defensively.

Both `requestAnimationFrame` handles need cancelling, not one. The pan loop reschedules itself
(`rafLoop`) and, on every frame it actually moves the wall, schedules a second frame just to write
the transform (`rafWrite`). Cancel only the loop and the pending write still lands — one more
`gallery.style.transform` write arriving after `destroy()` has already reset the element. Keep
both handles and cancel both in the same cleanup, before nulling them, exactly as the vanilla
teardown does.

None of the `async`-effect or resolved-after-unmount rules apply here: `mount()` has no `.then()`
and waits on no font or image load — every side effect it creates happens synchronously inside the
call, which is exactly why folding it into a `gsap.context` is a clean fit rather than a rewrite.
