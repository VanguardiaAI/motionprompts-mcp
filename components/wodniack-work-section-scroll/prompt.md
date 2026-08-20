# Work Section Scroll — Curved Letter Streams + WebGL Filmstrip

## Goal
Build a full-viewport, pinned "WORK" section wedged between a red intro and a red outro. While the section is pinned for **700% of the viewport height**, three layered effects run in sync, all driven by one ScrollTrigger progress value:

1. A **red dot grid** (2D canvas) that slides horizontally as you scroll.
2. Sixty HTML letter `<div>`s — fifteen each of **W, O, R, K** — that stream along **four Three.js CatmullRom curves**, projected from 3D world space to screen pixels every scroll tick, with a per-frame **lerp (0.07)** gliding each letter toward its target and a snap rule that hides the wrap-around jump.
3. A **parabolically warped Three.js plane** carrying a `CanvasTexture` filmstrip of 7 project images that slides across the screen from right to left over the full scroll.

Lenis smooths the scroll; a single `ScrollTrigger` (pin + `scrub: 1`) feeds its `progress` to all three layers in `onUpdate`.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin, **`lenis`** for smooth scrolling, and **`three`** for the WebGL layers:

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);
```

Everything runs inside a `DOMContentLoaded` handler declared `async` (the image textures are awaited before the plane is built).

## Layout / HTML
Three stacked full-viewport sections; the middle one is the stage. All canvases and letters are created in JS:

```html
<body>
  <section class="intro"><h1>( Intro )</h1></section>
  <section class="work">
    <div class="text-container"></div>
  </section>
  <section class="outro"><h1>( Outro )</h1></section>
  <script type="module" src="./script.js"></script>
</body>
```

JS appends into `.work`, in this order:
- a 2D `<canvas id="grid-canvas">` (the dot grid),
- the letters WebGL renderer canvas (`id="letters-canvas"`),
- the cards WebGL renderer canvas (`id="cards-canvas"`),
- and 60 `div.letter` elements go inside `.text-container`.

## Styling
Global reset `* { box-sizing:border-box; margin:0; padding:0; }`.

- `body`: `background-color: #f40c3f; overflow-x: hidden;` — the signature saturated red.
- `section`: `width:100vw; height:100vh; position:relative;`
- `.intro, .outro`: flex, centered both axes, `background-color:#f40c3f; color:#000;`. Their `h1`: a display sans-serif, `font-size:5vw; font-weight:lighter; text-transform:uppercase;`. `.outro { top:-0.125em; }` (tucks it under the pinned section, hiding a hairline seam).
- `.work`: `position:relative; background-color:#000; overflow:hidden;`
- All canvases: `position:absolute; top:0; left:0;`. Stacking order matters: `#grid-canvas { z-index:0; }`, `#letters-canvas { z-index:1; }`, `.text-container { z-index:2; }`, `#cards-canvas { z-index:10; }` — the filmstrip plane renders **on top of the letters**, the dot grid behind everything.
- `.text-container`: `width:100%; height:100%; position:absolute; top:0; left:0; z-index:2; pointer-events:none; perspective:2500px; perspective-origin:center;`
- `.letter`: `position:absolute; font-family: a heavy sans-serif; font-size:14rem; font-weight:bold; color:#f40c3f; text-shadow:1px 1px 2px rgba(0,0,0,0.1); opacity:1; z-index:2; transform-origin:center; transform-style:preserve-3d; will-change:transform;`

No webfont files are required — a bold system sans-serif is fine; the look is defined by the giant 14rem red glyphs on black.

## GSAP effect (be exhaustive)

### 1. Lenis + GSAP ticker wiring
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### 2. The single ScrollTrigger (drives everything)
```js
ScrollTrigger.create({
  trigger: ".work",
  start: "top top",
  end: "+=700%",
  pin: true,
  pinSpacing: true,
  scrub: 1,
  onUpdate: (self) => {
    updateTargetPositions(self.progress); // letters
    drawCardsOnCanvas(self.progress);     // filmstrip texture
    drawGrid(self.progress);              // dot grid
    cardsTexture.needsUpdate = true;      // re-upload the canvas texture
  },
});
```
No timelines, no tweened properties — the scrub-smoothed `progress` (0→1 across 7 viewport heights) is piped straight into three imperative draw/update functions. `scrub: 1` gives ~1 s of catch-up smoothing on top of Lenis.

### 3. Dot grid canvas (z-index 0)
- Sized to the viewport × `devicePixelRatio` (set canvas `width/height` to `innerWidth*dpr / innerHeight*dpr`, CSS size to `innerWidth/innerHeight` px, then `ctx.scale(dpr, dpr)`).
- `drawGrid(scrollProgress)`:
  - fill the whole canvas **black**, then `fillStyle = "#f40c3f"`;
  - `dotSize = 0.75` (arc radius, px), `spacing = 20`;
  - `rows = Math.ceil(canvas.height / spacing)`, `cols = Math.ceil(canvas.width / spacing) + 15` (extra columns so the wrap never shows);
  - `offset = (scrollProgress * spacing * 10) % spacing;`
  - draw a filled circle at `(x * spacing - offset, y * spacing)` for every cell.

The grid marches **left** as you scroll, completing 10 wrap cycles over the full pin — a subtle conveyor-belt undercurrent.

### 4. Three.js setup (two scenes, two renderers)
- Two scenes: `lettersScene` and `cardsScene`.
- Two `PerspectiveCamera(50, innerWidth/innerHeight, 0.1, 1000)`, both at `position.z = 20`.
- Two `WebGLRenderer({ antialias: true, alpha: true })`, both `setSize(innerWidth, innerHeight)` and `setClearColor(0x000000, 0)` (transparent). Letters renderer: `setPixelRatio(devicePixelRatio)`. Cards renderer: `setPixelRatio(Math.min(devicePixelRatio, 2))`. Give their DOM elements the ids `letters-canvas` and `cards-canvas` and append both to `.work`.

### 5. The four letter paths (CatmullRom curves)
```js
const createTextAnimationPath = (yPos, amplitude) => {
  const points = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    points.push(new THREE.Vector3(
      -25 + 50 * t,                                   // x: -25 → +25
      yPos + Math.sin(t * Math.PI) * -amplitude,      // y: bowed by a half sine
      (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * -5   // z: 0 at ends, -5 in the middle
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
    new THREE.LineBasicMaterial({ color: 0x000, linewidth: 1 })
  );
  line.curve = curve;
  return line;
};
```
Four paths, added to `lettersScene` (the black lines are invisible on the black background — they're just carriers for the curves):
```js
const paths = [
  createTextAnimationPath(10, 2),
  createTextAnimationPath(3.5, 1),
  createTextAnimationPath(-3.5, -1),
  createTextAnimationPath(-10, -2),
];
```
Each row spans the full width, bows vertically (outer rows twice as much as inner rows, opposite directions), and dips **away from the camera** (z −5) at the center — that recession is what the screen projection turns into the curved, perspective-squeezed letter flow.

### 6. The 60 letter divs
For each path `i` (0–3), create **15** `div.letter` elements whose `textContent` is `["W","O","R","K"][i]` — so row 0 is all W's, row 1 all O's, row 2 all R's, row 3 all K's. Append them to `.text-container` and register each in a `Map` with `{ current: {x:0,y:0}, target: {x:0,y:0} }`.

### 7. Letter target projection (scroll-driven)
```js
const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9];
const updateTargetPositions = (scrollProgress = 0) => {
  paths.forEach((line, lineIndex) => {
    line.letterElements.forEach((element, i) => {
      const point = line.curve.getPoint(
        (i / 14 + scrollProgress * lineSpeedMultipliers[lineIndex]) % 1
      );
      const vector = point.clone().project(lettersCamera);
      const positions = letterPositions.get(element);
      positions.target = {
        x: (-vector.x * 0.5 + 0.5) * window.innerWidth,
        y: (-vector.y * 0.5 + 0.5) * window.innerHeight,
      };
    });
  });
};
```
Details that matter:
- Letters are spread along the curve at `i / 14` (0 → 1 across the 15 letters), then offset by `progress × multiplier`, wrapped `% 1` — an endless conveyor along the curve.
- Each row has a **different speed multiplier** (`0.8, 1, 0.7, 0.9`), so the rows drift out of phase as you scroll.
- The projected NDC vector is mapped with **negated x and y** (`-vector.x`, `-vector.y`) — this mirrors the path both ways, making letters travel **right → left** and flipping the rows vertically (the `yPos: 10` path renders near the bottom).

### 8. Per-frame letter easing (rAF loop)
```js
const updateLetterPositions = () => {
  letterPositions.forEach((positions, element) => {
    const distX = positions.target.x - positions.current.x;
    if (Math.abs(distX) > window.innerWidth * 0.7) {
      // wrapped around the curve — snap, don't streak across the screen
      positions.current.x = positions.target.x;
      positions.current.y = positions.target.y;
    } else {
      positions.current.x = lerp(positions.current.x, positions.target.x, 0.07);
      positions.current.y = lerp(positions.current.y, positions.target.y, 0.07);
    }
    element.style.transform =
      `translate(-50%, -50%) translate3d(${positions.current.x}px, ${positions.current.y}px, 0px)`;
  });
};
```
- `lerp(start, end, t) = start + (end - start) * t` with factor **0.07** — the letters trail their targets with heavy inertia, so fast scrolls smear them elegantly along the curves.
- The `> innerWidth * 0.7` snap is essential: when a letter's curve parameter wraps `% 1`, its target jumps from one screen edge to the other; snapping prevents a visible dash across the viewport.
- The rAF loop runs continuously (independent of scroll): `updateLetterPositions()`, render `lettersScene`, render `cardsScene`, `requestAnimationFrame(animate)`.

### 9. Filmstrip texture (2D canvas → CanvasTexture)
- Load 7 image textures with `THREE.TextureLoader` (await all). On each: `generateMipmaps: true`, `minFilter: LinearMipmapLinearFilter`, `magFilter: LinearFilter`, `anisotropy: renderer.capabilities.getMaxAnisotropy()`.
- Create an offscreen canvas **4096×2048**.
- `drawCardsOnCanvas(offset = 0)`:
```js
ctx.clearRect(0, 0, 4096, 2048);
const cardWidth = 4096 / 3;        // ≈1365
const cardHeight = 2048 / 2;       // 1024 → 4:3 landscape cards
const spacing = 4096 / 2.5;        // ≈1638 (cards slightly overlap-spaced)
images.forEach((img, i) => {
  ctx.drawImage(img.image,
    i * spacing + (0.35 - offset) * 4096 * 5 - cardWidth,  // slides 5 canvas-widths right→left
    (2048 - cardHeight) / 2,
    cardWidth, cardHeight);
});
```
  At `offset = 0` the strip waits off-screen right; over the full scroll it travels `5 × 4096 = 20480` px left, so the 7 cards parade across mid-scroll.
- Wrap the canvas in a `THREE.CanvasTexture` with the same mipmap/filter/anisotropy settings plus `wrapS = wrapT = THREE.RepeatWrapping`. Set `needsUpdate = true` in the ScrollTrigger `onUpdate` after redrawing.

### 10. The warped plane
```js
const cardsPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 15, 50, 1),
  new THREE.MeshBasicMaterial({
    map: cardsTexture, side: THREE.DoubleSide,
    transparent: true, opacity: 1,
    depthTest: false, depthWrite: false,
  })
);
// parabolic bend: edges bulge toward the camera
const positions = cardsPlane.geometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
  positions.setZ(i, Math.pow(positions.getX(i) / 15, 2) * 5);
}
positions.needsUpdate = true;
```
A 30×15 plane (50 width segments) whose z follows `(x/15)² × 5` — flat at center, +5 toward the camera at the edges — so the filmstrip appears to ride the inside of a gentle cylinder, wider than the viewport, floating over the letters (its canvas has z-index 10, and transparent clear color lets the grid and letters show through the empty texture areas).

### 11. Init + resize
- On load: `drawGrid(0)`, start the rAF loop, `updateTargetPositions(0)` (letters assemble into their resting curve immediately, easing in via the lerp).
- On `resize`: resize/rescale the grid canvas and redraw at the current `ScrollTrigger.getAll()[0]?.progress || 0`; update both cameras' `aspect` + `updateProjectionMatrix()`; `setSize` both renderers; re-clamp the cards renderer pixel ratio; recompute letter targets at the current progress.

## Assets / images
**7 project images**, drawn into **4:3 landscape** card slots (≈1365×1024 on the texture canvas). One shared role: interchangeable **project/portfolio cards** in the sliding filmstrip. They read as a cohesive futuristic-tech editorial set — e.g. an astronaut walking a bridge past glassy skyscrapers, a macro face wearing AR glasses with a HUD, a dark 3D render of mesh-wrapped concrete cylinders, an isometric empty cardboard box on a beige surface, a person in a VR headset beside a floating call UI, black AR sunglasses on a dark gradient, and a glowing cylindrical dwelling in a desert at dusk. Moody, saturated, high-production sci-fi/product photography works best against the black stage and red accents. Name them sequentially (`img1.jpg` … `img7.jpg`). If fewer are available, repeat in order.

## Behavior notes
- The page has real scroll height: intro (100vh) + pinned work section (held for 700% via `pinSpacing: true`) + outro (100vh). Lenis smooths the native scroll; ScrollTrigger's `scrub: 1` adds another layer of lag, and the letters add a third (lerp 0.07) — this triple smoothing is the signature feel.
- Scrolling back up reverses everything perfectly (all three layers are pure functions of `progress`).
- The letters keep easing after the scroll stops (rAF loop never pauses).
- Desktop-oriented: 14rem letters and fixed world-space sizes; no breakpoints, no reduced-motion handling in the original.
- WebGL required (two renderer contexts); heavy effect — don't add more pixel ratio than the caps above.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/wodniack-work-section-scroll/img1.jpg
https://motionprompts.dev/c/wodniack-work-section-scroll/img2.jpg
https://motionprompts.dev/c/wodniack-work-section-scroll/img3.jpg
https://motionprompts.dev/c/wodniack-work-section-scroll/img4.jpg
https://motionprompts.dev/c/wodniack-work-section-scroll/img5.jpg
https://motionprompts.dev/c/wodniack-work-section-scroll/img6.jpg
… 1 more under https://motionprompts.dev/c/wodniack-work-section-scroll/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--riot-red`, `--riot-ink`, `--riot-bone`, `--riot-bone-dim`, `--font`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, builds two independent WebGL scenes and sixty letter `<div>`s with `document.createElement`, and drives all three visual layers — the dot grid, the letter streams, the filmstrip plane — off a single `ScrollTrigger`. React withdraws the guarantees this relies on, and it does so quietly: the section renders, the red dots and the giant letters look right for a moment, and then a route change away and back leaves two Lenis instances fighting over the same wheel event, or two rAF loops rendering into canvases neither one still controls. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen, and this component has an unusually large amount of state — a Three.js scene per WebGL layer, a `Map` of sixty DOM-node targets, a 4096×2048 offscreen canvas — for that double mount to duplicate.

*(1) The entry point* — the script wraps its body in `document.addEventListener("DOMContentLoaded", async () => { ... })`. By the time a React component mounts, `DOMContentLoaded` has already fired, so on its own the listener would simply never run — the fix for that half is the usual one: delete the listener, move its body into a `useEffect` with an empty dependency array. What doesn't carry over unchanged is the `async` on that callback. Everything downstream of `await Promise.all(images.map(loadImage))` — the `cardsTexture`, the `cardsPlane`, the `ScrollTrigger.create` call that is the only thing driving `updateTargetPositions`/`drawCardsOnCanvas`/`drawGrid`, the first `drawGrid(0)`/`animate()`/`updateTargetPositions(0)` calls, and the `resize` listener — sits behind that one await. So an `async` effect callback here is not just wrong in the abstract (it hands React a promise where a synchronous cleanup function belongs); the entire teardown surface this component needs literally does not exist until that promise settles, which means there is no version of "return a cleanup function" that works before it does. Split the effect: run everything that precedes the await — Lenis, the ticker wiring, both scenes, both cameras, both renderers, the grid canvas, the four curve paths, the sixty letter divs — synchronously in the effect body; fire the seven `loadImage()` calls without awaiting them; and build the second half inside their `.then()`, gated by a `cancelled` flag that the effect's own synchronous return flips to true.

*(2) Element lookups* — `.work` and `.text-container` are both resolved with `document.querySelector`, and every one of the sixty `.letter` divs, plus all three canvases, gets appended to whichever node those two calls happen to return. Give the component a root ref for `.work`, keep a second ref for `.text-container` scoped under it, and route the canvas/letter creation through those refs instead of the document. During the StrictMode remount two `.work` subtrees exist for an instant, and an unscoped `querySelector` is not guaranteed to resolve to the one that's staying.

*(3) Cleanup* — five kinds of live resource need their own teardown here, and one of them only starts existing after the async gate above resolves.

*Lenis and the ticker.* `lenis.on("scroll", ScrollTrigger.update)` and `gsap.ticker.add((time) => lenis.raf(time * 1000))` both run before the await, so they exist for the life of the mount regardless of how the image loads go. The ticker subscription is not tracked by any `gsap.context` — revert or not, it keeps calling `lenis.raf` on whatever instance the closure still points to. Keep the exact arrow function reference passed to `gsap.ticker.add` and pass that same reference to `gsap.ticker.remove` in cleanup, then `lenis.off("scroll", ScrollTrigger.update)` and `lenis.destroy()`. Skipping the ticker removal is what bites hardest here: it keeps invoking `lenis.raf` on a destroyed instance every frame, for as long as the page stays open.

*The ScrollTrigger.* One `ScrollTrigger.create({ trigger: ".work", start: "top top", end: "+=700%", pin: true, scrub: 1, onUpdate: ... })` is the only thing that ever calls `updateTargetPositions`, `drawCardsOnCanvas` and `drawGrid`. It can only be created after the images resolve, so wrap it in a `gsap.context` opened synchronously with an empty factory, and populate that context from inside the guarded `.then()` with the single-argument form of `add`. That call happens outside the factory's own synchronous pass, so capture the `self` the factory receives into a closure variable rather than reaching for `ctx` there — `ctx` isn't assigned until the factory returns, and referencing it early is exactly the trap this pattern exists to avoid:

```jsx
useEffect(() => {
  let cancelled = false;
  let self;
  const ctx = gsap.context((context) => { self = context; }, rootRef);
  Promise.all([1, 2, 3, 4, 5, 6, 7].map(loadImage)).then((images) => {
    if (cancelled) return;
    self.add(() => {
      // build cardsTexture + cardsPlane from `images`, then ScrollTrigger.create({ trigger: rootRef.current, ... })
    });
  });
  return () => { cancelled = true; ctx.revert(); };
}, []);
```

Without the revert, a second `.work` pin stacks on the first, both scrubbing the same seven-viewport-height stretch and both writing into whichever grid/letters/cards canvases are still attached.

*The rAF loop.* `animate()` recurses on its own `requestAnimationFrame` return and is never cancelled in the original — harmless on a plain page, since the tab eventually closes. Keep the id the call returns and cancel it in cleanup. Miss this and a leftover `animate()` from a prior mount keeps calling `lettersRenderer.render`/`cardsRenderer.render` against a scene whose `ScrollTrigger` (and therefore whose `updateTargetPositions`) is long gone — the letters stop advancing but the render loop keeps spending a frame on them regardless.

*The texture promise itself.* `loadImage`'s `THREE.TextureLoader` callback can fire after a StrictMode unmount — that is precisely the moment the `.then()` from point (1) runs. The `cancelled` check there is not incidental cleanup hygiene, it is the only thing standing between a resolved texture and building `cardsTexture`, appending `cardsPlane` to a `cardsScene` that belongs to an unmounted instance, or creating a `ScrollTrigger` against a `.work` ref that render already tore down.

*The WebGL contexts and the imperative DOM nodes.* `lettersRenderer` and `cardsRenderer` each own a real GPU context — call `dispose()` on both, plus `cardsTexture.dispose()` and the geometry/material on `cardsPlane` and each of the four curve `paths`, inside the same cleanup. And since the sixty `.letter` divs plus `#grid-canvas`, `#letters-canvas` and `#cards-canvas` are built with `createElement`/`appendChild` rather than declared as JSX, the better move is to stop creating them imperatively at all: render the sixty letters as regular mapped children with a `ref` callback per element, and let `letterPositions` become a plain array indexed by `(lineIndex, i)` instead of a `Map` keyed on DOM nodes that no longer exist after a remount.

*(4) Rendering this in `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19. The two `WebGLRenderer`/`Scene`/`PerspectiveCamera` triples here don't collapse into one `<Canvas>` — the stacking (`#letters-canvas` at z-index 1, `#cards-canvas` at z-index 10, both above the plain-2D `#grid-canvas` at z-index 0) is load-bearing, since the cards plane has to composite over the letters. Port it as two stacked `<Canvas>` elements, each absolutely positioned over the section and each with `gl={{ alpha: true }}` and a transparent clear color, keeping the original z-order; each keeps its own camera at the same field of view and z position the vanilla version sets.

There's no `GLTFLoader.load(...)` to replace with `useGLTF` — both scenes are entirely procedural. Build the four `CatmullRomCurve3` lines (the sine-bowed, center-dipping point sets that feed `createTextAnimationPath`) and the warped `cardsPlane` geometry (its vertex Z pushed forward by the square of the normalized X, the parabola bend) each in a `useMemo`, the same way they're built exactly once in the vanilla version.

The rAF loop's two jobs split apart instead of folding into one `useFrame`. Rendering `lettersScene`/`cardsScene` is what each `<Canvas>`'s own internal loop already does — delete `lettersRenderer.render(...)`, `cardsRenderer.render(...)` and the `requestAnimationFrame(animate)` recursion outright. But `updateLetterPositions` — the per-element lerp-toward-target-with-snap that moves the sixty letter divs — touches plain DOM nodes that live outside either canvas, not scene objects, so it has to run from a `useFrame` registered on a component inside one of the two `<Canvas>` trees and reach out through the ref array described in point (3), not through the scene graph. Because the letters keep drifting between scroll events — this interpolation is continuous, not re-armed only when `onUpdate` fires — leave both canvases on the default always-on frame loop; `frameloop="demand"` would starve `updateLetterPositions` of the frames it needs to keep the letters easing in after the user stops scrolling, which the vanilla version explicitly relies on.

Resize handling mostly disappears with `<Canvas>`: drop the manual `camera.aspect`/`updateProjectionMatrix` and `renderer.setSize` calls, and the pixel-ratio clamp on the cards renderer, since each `<Canvas>` already tracks its own container and exposes a `dpr` prop for the same cap. What survives resize is everything that isn't Three.js: `#grid-canvas` is a plain 2D context sized off `window.innerWidth/innerHeight` by hand, and `updateTargetPositions` needs recomputing at the current scroll progress — neither of those is `<Canvas>`'s job.

A poster is mandatory here, and it has to cover more than the model-load gap this rule usually addresses: nothing in this component paints anything at all — not the dot grid, not one letter, not a placeholder card — until every one of the seven `loadImage` promises has resolved, because `drawGrid(0)`, `animate()` and `updateTargetPositions(0)` all sit on the far side of that same await. Render a static poster over the whole section (the red dot grid with the WORK wordmark centered reads close enough) and swap it out only once the guarded `.then()` above has actually run its first `drawGrid`/`updateTargetPositions` pass — not the instant the component mounts.

Skip drei's `Environment` regardless of preset: both materials here are unlit by construction (`LineBasicMaterial` for the invisible curve carriers, `MeshBasicMaterial` for the filmstrip plane), so there's no lighting for an environment map to feed. If a later variant lights the plane, point `Environment` at a self-hosted HDRI file, never a preset — presets resolve against a third-party CDN hard-coded into drei and leave the scene unlit the moment that host is unreachable.
