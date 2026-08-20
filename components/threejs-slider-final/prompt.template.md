---
slug: threejs-slider-final
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Three.js Infinite Curved-Distortion Slider — Velocity-Reactive Vertex Warp

## Goal
Build a **full-viewport, infinitely looping horizontal image slider rendered entirely in Three.js**. Ten textured planes drift left/right in 3D space, driven by mouse wheel, touch drag, or arrow keys. The star effect: as the strip moves, the planes **bend toward the camera in a radial bulge centered on the middle of the screen** — a curved-screen distortion whose intensity is proportional to scroll velocity. Fast flicks warp the slides dramatically; when motion settles, the planes relax back to perfectly flat. The strip wraps seamlessly, so you can scroll forever in either direction. Everything is lerped every frame — position, per-slide easing, and the distortion factor itself — so the whole thing feels weighty and fluid, never snappy.

## Tech
Vanilla HTML/CSS/JS with ES module imports. **`three` (npm) only — no GSAP, no smooth-scroll library.** The entire engine is a hand-rolled `requestAnimationFrame` loop with linear interpolation and a velocity tracker. `import * as THREE from "three";`

## Layout / HTML
```
nav                 (fixed top strip — two small labels)
  p  "[ Silhouette ]"
  p  "/ Experiment by Silhouette"
footer              (fixed bottom strip — two small labels)
  p  "Infinite WebGL Slider"
  p  "Scroll to explore ↓"
canvas#canvas       (the Three.js render target, fills the viewport)
```
The `<script type="module" src="./script.js">` goes at the end of `<body>`.

## Styling
Minimal — the canvas is the whole show.
- Global reset `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `body { font-family: "Akkurat Mono", monospace; background-color: #e3e3db; color: #0f0f0f; }` (no webfont needed — the monospace fallback is fine).
- `p { text-transform: uppercase; font-size: 13px; font-weight: 600; letter-spacing: -0.02em; -webkit-font-smoothing: antialiased; }`
- `nav, footer { position: fixed; width: 100vw; padding: 2em; display: flex; justify-content: space-between; align-items: center; z-index: 2; opacity: 0; }` — **yes, `opacity: 0`**: the labels are intentionally invisible in this demo (kept in the DOM but hidden). `nav { top: 0 }`, `footer { bottom: 0 }`.
- `#canvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; }`

## The Three.js engine (exhaustive — this is the effect)

### Renderer / scene / camera
```js
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe3e3db);          // matches the page background exactly

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;
```
On `resize`: update `camera.aspect`, `camera.updateProjectionMatrix()`, `renderer.setSize(...)`.

### Constants and settings (use these exact values)
```js
const settings = {
  wheelSensitivity: 0.01,
  touchSensitivity: 0.01,
  momentumMultiplier: 2,
  smoothing: 0.1,            // lerp factor: currentPosition → targetPosition
  slideLerp: 0.075,          // lerp factor: each slide's currentX → targetX
  distortionDecay: 0.95,
  maxDistortion: 2.5,        // max Z bulge in world units at distortionFactor = 1
  distortionSensitivity: 0.15,
  distortionSmoothing: 0.075 // lerp factor: currentDistortionFactor → targetDistortionFactor
};

const slideWidth = 3.0;      // world units
const slideHeight = 1.5;     // world units (2:1 landscape planes)
const gap = 0.1;
const slideCount = 10;
const imagesCount = 5;       // textures cycle: slide i uses image (i % 5) + 1
const totalWidth = slideCount * (slideWidth + gap);   // 31
const slideUnit = slideWidth + gap;                   // 3.1
```
State variables: `currentPosition`, `targetPosition`, `isScrolling`, `autoScrollSpeed`, `lastTime`, `touchStartX`, `touchLastX`, `currentDistortionFactor`, `targetDistortionFactor`, `peakVelocity`, and `velocityHistory = [0, 0, 0, 0, 0]` (a 5-entry rolling window).

### Building the slides
For each of the 10 slides:
- `new THREE.PlaneGeometry(slideWidth, slideHeight, 32, 16)` — the **32×16 segment resolution is load-bearing**; the distortion bends individual vertices.
- Material: `THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })` where `color` cycles through 5 placeholder hexes `["#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"]` (visible only until the texture loads).
- `mesh.position.x = index * slideUnit`, and store in `mesh.userData`: a **copy of the original position array** (`[...geometry.attributes.position.array]`) and the index.
- Load the texture asynchronously with `THREE.TextureLoader`. On load: set `texture.colorSpace = THREE.SRGBColorSpace`, assign `material.map = texture`, reset `material.color.set(0xffffff)`, `material.needsUpdate = true`. Then **aspect-fit (contain)** the image by scaling the mesh: if the image is wider than the 2:1 slide, `mesh.scale.y = slideAspect / imgAspect`; otherwise `mesh.scale.x = imgAspect / slideAspect`.
- Image paths: `./images/img1.jpg` … `img5.jpg`, slide `i` uses image `(i % 5) + 1`.

After creating all slides, recenter the strip: subtract `totalWidth / 2` from every slide's `position.x`, and initialize `slide.userData.targetX = slide.userData.currentX = slide.position.x`.

### The vertex distortion (`updateCurve(mesh, worldPositionX, distortionFactor)`)
A radial bulge fixed at **world center (0, 0)** with **radius 2.0**. For every vertex of the plane (reading X/Y from the stored *original* vertices, never the mutated ones):
```js
const vertexWorldPosX = worldPositionX + x;   // x, y = original local vertex coords
const distFromCenter = Math.sqrt((vertexWorldPosX - 0) ** 2 + (y - 0) ** 2);
const distortionStrength = Math.max(0, 1 - distFromCenter / 2.0);
const curveZ = Math.pow(Math.sin((distortionStrength * Math.PI) / 2), 1.5)
             * settings.maxDistortion * distortionFactor;
positionAttribute.setZ(i, curveZ);
```
Then `positionAttribute.needsUpdate = true` and `mesh.geometry.computeVertexNormals()`. The `sin^1.5` falloff makes a smooth dome: vertices near screen center push up to `2.5 × distortionFactor` world units toward the camera, fading to zero at radius 2.

### Input handlers (all on `window`)
- **Wheel** (`{ passive: false }`, `e.preventDefault()`):
  - `targetDistortionFactor = Math.min(1.0, targetDistortionFactor + Math.abs(e.deltaY) * 0.001)`
  - `targetPosition -= e.deltaY * settings.wheelSensitivity` (×0.01)
  - `isScrolling = true`; `autoScrollSpeed = Math.min(Math.abs(e.deltaY) * 0.0005, 0.05) * Math.sign(e.deltaY)` — a momentum kick in the scroll direction.
  - Debounce: clear + set a 150ms timeout that flips `isScrolling = false`.
- **Touch**: `touchstart` records `touchStartX = touchLastX = touches[0].clientX`, `isScrolling = false`. `touchmove` (`passive: false`, preventDefault) uses the **incremental** delta from `touchLastX`: `targetDistortionFactor = min(1, target + |deltaX| * 0.02)`, `targetPosition -= deltaX * settings.touchSensitivity`, `isScrolling = true`. `touchend` computes flick velocity `(touchLastX - touchStartX) * 0.005`; if `|velocity| > 0.5`: `autoScrollSpeed = -velocity * settings.momentumMultiplier * 0.05`, `targetDistortionFactor = min(1, |velocity| * 3 * settings.distortionSensitivity)`, `isScrolling = true`, then `isScrolling = false` after an 800ms timeout.
- **Keyboard**: `ArrowLeft` → `targetPosition += slideUnit`; `ArrowRight` → `targetPosition -= slideUnit`; both also `targetDistortionFactor = Math.min(1.0, targetDistortionFactor + 0.3)` — one keypress steps exactly one slide and pulses the warp.

### The rAF loop (runs forever)
Per frame, with `deltaTime` in seconds (fallback 0.016 on the first frame):

1. **Momentum**: if `isScrolling`, `targetPosition += autoScrollSpeed`, then decay it: `autoScrollSpeed *= Math.max(0.92, 0.97 - Math.abs(autoScrollSpeed) * 0.5)`; zero it below 0.001.
2. **Master lerp**: `currentPosition += (targetPosition - currentPosition) * settings.smoothing` (×0.1).
3. **Velocity tracking**: `currentVelocity = |currentPosition - prevPosition| / deltaTime`. Push into the 5-entry `velocityHistory` (shift the oldest out), average it. Track `peakVelocity = max(peakVelocity, avgVelocity)`, and decay it by `×0.99` every frame. `isDecelerating = (avgVelocity / (peakVelocity + 0.001)) < 0.7 && peakVelocity > 0.5`.
4. **Velocity → distortion**: `movementDistortion = Math.min(1.0, currentVelocity * 0.1)`; if `currentVelocity > 0.05`, `targetDistortionFactor = Math.max(targetDistortionFactor, movementDistortion)`. If `isDecelerating || avgVelocity < 0.2`, decay: `targetDistortionFactor *= isDecelerating ? settings.distortionDecay : settings.distortionDecay * 0.9` (0.95 or 0.855).
5. **Distortion lerp**: `currentDistortionFactor += (targetDistortionFactor - currentDistortionFactor) * settings.distortionSmoothing` (×0.075).
6. **Per-slide wrap + ease** — for each slide `i`:
   ```js
   let baseX = i * slideUnit - currentPosition;
   baseX = ((baseX % totalWidth) + totalWidth) % totalWidth;  // wrap into [0, totalWidth)
   if (baseX > totalWidth / 2) baseX -= totalWidth;           // center into [-15.5, 15.5]

   // teleport (don't ease) when a slide wraps around an edge:
   if (Math.abs(baseX - slide.userData.targetX) > slideWidth * 2) slide.userData.currentX = baseX;

   slide.userData.targetX = baseX;
   slide.userData.currentX += (slide.userData.targetX - slide.userData.currentX) * settings.slideLerp; // ×0.075

   const wrapThreshold = totalWidth / 2 + slideWidth;         // 18.5
   if (Math.abs(slide.userData.currentX) < wrapThreshold * 1.5) {
     slide.position.x = slide.userData.currentX;
     updateCurve(slide, slide.position.x, currentDistortionFactor);
   }
   ```
   The per-slide 0.075 lerp on top of the master 0.1 lerp gives the strip a subtle elastic follow-through; the teleport check makes the infinite wrap invisible.
7. `renderer.render(scene, camera)`.

## Assets / images
**5 abstract, cinematic art images** (they repeat across the 10 slides in order 1-2-3-4-5-1-2-3-4-5). They display aspect-fit inside 2:1 landscape planes, so landscape sources look best. They should read as one cohesive experimental series — think motion-blurred thermal-camera silhouettes, swirling fluid-ink vortices on warm gradients, neon heat-map figures with raised arms, dancing silhouettes against sunburst gradients. Bold saturated color fields (yellow/red/orange, violet/indigo, magenta) with soft blur and movement.

## Behavior notes
- The strip is **truly infinite both ways** — the modulo wrap plus teleport check means no visible ends and no snap when a slide recycles.
- The page never scrolls; the wheel is fully hijacked (`preventDefault`) to drive the slider. Touch drag works the same way on mobile.
- With no input, the strip glides to a stop (momentum decay) and the bulge melts away (distortion decay) until the planes are flat again.
- Slide distortion depends on **world position**, not slide identity: whichever slide passes through screen center bulges the most, its neighbors bend partially where they enter the radius-2 zone.
- The nav/footer labels are rendered but invisible (`opacity: 0`) — keep them anyway for structure fidelity.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/threejs-slider-final/img1.jpg
https://motionprompts.dev/c/threejs-slider-final/img2.jpg
https://motionprompts.dev/c/threejs-slider-final/img3.jpg
https://motionprompts.dev/c/threejs-slider-final/img4.jpg
https://motionprompts.dev/c/threejs-slider-final/img5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--muted`, `--amber`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already tears itself down: one call builds the renderer, the scene, the camera, all of the plane meshes (`config.slideCount`, ten by default), the six `window` listeners, the two debounce timers threaded through the `later`/`cancel` helpers, and the `animate()` loop that lerps everything toward its target every frame; the function `mount` returns cancels that loop, strips all six listeners, clears every outstanding timer, disposes every mesh's geometry, texture and material, force-loses the WebGL context, and swaps the cloned `<canvas>` back for the original DOM node. This component was built to survive being re-invoked by this catalog's own editor runtime (`window.MP.register`), so most of the discipline a React effect needs already exists on the page — but `mount`/`destroy` were designed for one external caller re-triggering them deliberately whenever a config knob changes, not for React's own remount timing, and the two do not line up for free. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Call `mount()` without wiring its return value back as the effect's own cleanup, and the second mount clones the `<canvas>` a second time, starts a second `animate()` loop lerping a second `currentPosition` toward a second `targetPosition`, and binds a second copy of all six input listeners to the same `window` — two `renderer.render` calls per frame racing to paint the same box, both reacting to the same wheel and touch events, each with its own idea of how far the strip has scrolled. It will not reproduce in a production build, because only development does the double mount. Treat `destroy()` as the cleanup itself, not as something the effect calls in addition to its own teardown.

*(1) The entry point* — the bottom of the file checks `window.MP` first; only in its absence does it fall back to checking `document.readyState` before deciding whether to wait for `DOMContentLoaded`. Both branches serve the standalone demo and this catalog's visual editor, and neither has a role inside a host React component. Delete the whole `if`/`else`, including the `window.MP.register` branch, and call `mount(Object.assign({}, DEFAULTS))` (or `mount(config)` if the config comes from props) directly inside a `useEffect` with an empty dependency array, keeping its return value as the effect's own cleanup. `useEffect` already runs after the DOM is committed, so the race the `readyState` guard defends against — a script evaluated before the DOM it queries exists — cannot happen inside a component.

*(2) Element lookups* — `mount` looks up exactly one element, `document.getElementById("canvas")`, and bails to a no-op `destroy` if it is missing; keep that guard, but resolve it against a root ref instead of the document, since during the StrictMode remount two copies of this subtree exist for an instant and an unscoped `getElementById` can resolve to the copy already on its way out. Keep the clone-and-replace immediately after the lookup untouched, too — `const canvas = original.cloneNode(false); original.replaceWith(canvas);` exists specifically so a remount never inherits a `<canvas>` whose context the previous `destroy()` already force-lost. Requesting a WebGL context from a node that already had one force-lost via `forceContextLoss()` returns null, so skipping the clone and handing the renderer the ref's node directly turns the second StrictMode mount into a blank canvas.

*(3) Cleanup* — four things here need to survive being read by more than a search for `addEventListener`.

The `animate()` loop is the only thing that ever calls `renderer.render`; nothing else paints a frame. Keep the `destroyed` check at the top of the loop body and the `frame` handle passed to `cancelAnimationFrame` in the returned cleanup — both exist to stop the exact failure a StrictMode double-mount produces: an already-scheduled frame from the first `animate()` painting after the second `mount()` has taken over `currentPosition` and `targetPosition`.

All six `window` listeners — `keydown`, `wheel`, `touchstart`, `touchmove`, `touchend`, `resize` — need matching `removeEventListener` calls, and alongside them keep the `timers` `Set` and the `later`/`cancel` pair exactly as written: the wheel handler's 150ms `isScrolling` reset and the touch handler's 800ms momentum reset are each individually cancellable, and the cleanup's `timers.forEach((t) => clearTimeout(t))` is what stops a leftover timeout from flipping `isScrolling` on a closure that a fresh mount no longer reads.

The texture loads are the asynchronous seam: one `textureLoader.load(...)` call per slide, cycling through `imagesCount` real image files, and each carries an `onLoad` that checks `destroyed` before touching `material`, disposing the freshly decoded texture instead of assigning it when the flag is set; `onError` bails the same way. Keep that check — a decode that lands after a StrictMode unmount would otherwise flip `material.needsUpdate` and rescale a mesh on a `scene` that `destroy()` has already cleared.

Disposal order matters and is already correct: `canvas.replaceWith(original)` runs *before* the per-mesh `geometry.dispose()` / `material.map.dispose()` / `material.dispose()` loop, `scene.clear()`, `renderer.dispose()`, and `renderer.forceContextLoss()` — the DOM swap doesn't depend on the GPU teardown finishing, so putting it first guarantees a remount's `getElementById` call finds the pristine original node regardless of how long disposal underneath it takes. Preserve that ordering rather than collapsing it into one pass.

*(4) Rendering this in `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

`<Canvas>` replaces the `WebGLRenderer` / `Scene` / `PerspectiveCamera` block outright: match the camera with `camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 5] }}`, carry `antialias` and `preserveDrawingBuffer` into `gl={{ antialias: true, preserveDrawingBuffer: true }}`, cap the pixel ratio the same way `Math.min(devicePixelRatio, 2)` does with `dpr={[1, 2]}`, and set the background color declaratively instead of through `scene.background = new THREE.Color(...)`. Resize handling disappears with it — drop the `resize` listener and the manual `camera.aspect` / `updateProjectionMatrix` / `setSize` calls, since `<Canvas>` already observes its own container.

There is no `.glb` here, so `useGLTF` doesn't apply, but texture loading still benefits from a drei helper: today, each slide calls its own `TextureLoader.load()` even though only `imagesCount` (five) distinct files exist, so a given JPEG gets decoded and uploaded to the GPU twice per cycle of ten slides. Loading the five unique URLs once through `useTexture` and indexing into the result by `index % imagesCount` removes that duplication as a side effect of the port, not as an extra optimization pass. The trade-off is that `useTexture` suspends, which loses the current two-stage reveal — the placeholder-colored plane showing immediately, the texture swapping in and the mesh rescaling only once decoded. If that staged reveal matters, keep the imperative `TextureLoader` call inside the effect that builds the meshes, hold the resolved texture in a ref, and apply the same aspect-fit scale comparison (`imgAspect` against `slideWidth / slideHeight`) once it resolves — the asynchronous-continuation guard from part (3) still applies to whichever loader you pick.

The geometry itself has to stay a manually-managed `BufferGeometry`, not a `<planeGeometry>` re-created on every render: `updateCurve` mutates `positionAttribute` in place every frame, reading from `mesh.userData.originalVertices`, a copy of the flat vertex array taken once at creation. Build each slide's geometry in a `useMemo` keyed on `slideWidth`/`slideHeight` (never on a per-frame value), stash the original-vertex copy in that same memo, and mutate the *live* attribute from inside `useFrame` — recreating the geometry on every render would hand `updateCurve` a fresh, undistorted `originalVertices` copy each time and the bulge would never settle. `computeVertexNormals()` after the `setZ` loop can be dropped as long as the material stays `MeshBasicMaterial`, since an unlit material never reads normals; keep it only if a later variant swaps in a lit material.

`animate()`'s body becomes the callback passed to `useFrame`: the momentum step, the master position lerp, the five-entry `velocityHistory` rolling average, `peakVelocity`, `isDecelerating`, the distortion-factor lerp, and the per-slide wrap-and-ease block all move in unchanged, with `renderer.render(scene, camera)` dropped since `<Canvas>` renders the frame once `useFrame` returns. Every one of those — `currentPosition`, `targetPosition`, `isScrolling`, `autoScrollSpeed`, `currentDistortionFactor`, `targetDistortionFactor`, `peakVelocity`, `velocityHistory` — belongs in a ref, not `useState`: this loop runs on every animation frame, and routing any of it through state would re-render the component tree at that same rate for values that only ever feed a `Mesh.position` and a `BufferAttribute`. The per-slide `userData.currentX`/`targetX` pair stays exactly what it is, since `userData` is a plain property on the real three.js `Mesh` instance R3F hands you through a `ref`, unaffected by which layer created that mesh.

The `keydown`/`wheel`/`touchstart`/`touchmove`/`touchend` listeners stay page-level input, not pointer events on a mesh, so they stay on `window`, attached from a `useEffect` that writes into the same refs `useFrame` reads, torn down exactly as `destroy()` already does — including the timer bookkeeping from part (3).

A poster is mandatory here even without a `.glb`: whichever texture-loading path is chosen, the planes render as flat, undistorted, placeholder-colored rectangles for at least one network round trip, and routing loading through `useTexture`'s Suspense means the canvas paints nothing at all until every one of the five images has decoded. Render a poster image sized to the full-bleed canvas box and swap it out only once the first frame with a real texture and a non-zero distortion factor has actually painted — not the instant the component mounts.

Skip drei's `Environment` regardless of preset temptation: every slide is `MeshBasicMaterial`, unlit by construction, so there is no lighting for an environment map to feed. If a later variant of this slider swaps in a lit material, light it with explicit lights or point `Environment` at a self-hosted HDRI — never a `preset`, which is fetched from a third-party CDN hard-coded into drei and leaves the scene unlit the moment that host is unreachable.
