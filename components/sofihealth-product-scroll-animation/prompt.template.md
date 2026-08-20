---
slug: sofihealth-product-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 2
structural_literals: 4
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# 3D Product Scroll Showcase — pinned scrub section with rotating GLTF model

## Goal

Build a full-page scroll experience for a fictional fitness shaker brand called "GRND". The star of the show is a pinned, scrub-driven section where a Three.js GLTF shaker-bottle model spins on its Y axis in sync with scroll progress while, mapped to the same progress value, two giant headlines slide horizontally across the screen, a dark circular clip-path mask expands to swallow the background, and two feature tooltips reveal with masked, staggered SplitText line animations.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins `ScrollTrigger` and `SplitText`, `lenis` for smooth scrolling, and `three` (npm) with `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js` for the 3D model. Icons are Ionicons v7 web components served from your own origin (`/vendor/ionicons/ionicons.esm.js` as a module script plus the `nomodule` fallback `ionicons.js`); get them with `npm i ionicons@7.1.0` and copy the whole `node_modules/ionicons/dist/ionicons/` folder, since the loader fetches its chunks and one SVG per icon relative to the script's own URL.

All JS runs inside a `DOMContentLoaded` listener. Register `ScrollTrigger` and `SplitText` with `gsap.registerPlugin`.

## Layout / HTML

Three stacked full-viewport sections:

1. `<section class="intro">` — a single `<h1>` with the copy "GRND doesn't shake. It performs."
2. `<section class="product-overview">` — the pinned showcase, containing in this order:
   - `<div class="header-1"><h1>Every Rep Starts With</h1></div>`
   - `<div class="header-2"><h1>GRND Shaker</h1></div>`
   - `<div class="circular-mask"></div>`
   - `<div class="tooltips">` with exactly two `<div class="tooltip">` blocks. Each tooltip contains, in order: `<div class="icon"><ion-icon name="..."></ion-icon></div>`, `<div class="divider"></div>`, `<div class="title"><h2>...</h2></div>`, `<div class="description"><p>...</p></div>`.
     - Tooltip 1: icon `flash`, title "Built to last", description "Designed to match your pace, GRND runs all week on a single charge. No interruptions, no slowing down."
     - Tooltip 2: icon `bluetooth`, title "Stay synced", description "With app integration, GRND helps you stay consistent. Monitor intake, set goals, and make every sip count."
   - `<div class="model-container"></div>` — empty; the WebGL canvas is appended here.
3. `<section class="outro">` — a single `<h1>` with the copy "Don't Just Train — GRND".

## Styling

- Font: `"Hanken Grotesk", sans-serif` (Google Fonts, import with `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap");`). Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- Type scale: `h1` 4rem / weight 500 / line-height 1. `h2` 3rem / weight 500 / line-height 1.125 / letter-spacing -0.03rem. `p` 1.1rem / weight 500 / line-height 1.5.
- Every `section` is `position: relative; width: 100vw; height: 100svh; overflow: hidden;` with background `#e0dfdf` and text `#0d0d0d`.
- `.intro` and `.outro` invert the palette (background `#0d0d0d`, text `#e0dfdf`), flex-centered, `padding: 2rem`.
- `.model-container`: absolutely centered (`top/left 50%`, `translate(-50%, -50%)`), `width/height 100%`, `z-index: 100`.
- `.header-1`: `position: relative; width: 200vw; height: 100svh;` color `#0d0d0d`, initial `transform: translateX(0%)`.
- `.header-2`: `position: fixed; top: 0; left: 0; width: 150vw; height: 100svh;` color `#e0dfdf`, initial `transform: translateX(100%)`, `z-index: 2`.
- Both headers are flex containers (`align-items: center; padding: 0 2rem`) and their `h1` is `width: 100%; font-size: 15vw; line-height: 1.25; letter-spacing: -0.02em` — a single huge line that overflows the viewport horizontally.
- `.circular-mask`: absolute, fills the section, background `#0d0d0d`, initial `clip-path: circle(0% at 50% 50%)`.
- `.tooltips`: absolutely centered, `width: 75%; height: 75%`, `display: flex; gap: 15rem`.
- `.tooltip`: `flex: 1`, column flex with `gap: 0.5rem`, color `#e0dfdf`. The second tooltip is pushed to the bottom-right of its column (`justify-content: flex-end; align-items: flex-end`).
- `.tooltip .divider`: `width: 100%; height: 1px; background: #5f5f5f; margin: 0.5rem 0;` initial `transform: scaleX(0%)`. Transform-origin: `right center` on tooltip 1, `left center` on tooltip 2 (so they grow toward each other from the middle).
- `.tooltip .icon`: `font-size: 2.5rem; overflow: hidden`. `.tooltip .description`: color `#5f5f5f`. On tooltip 2, `.icon` and `.title` are `width: 70%`; every `.description` is also `width: 70%`.
- Text-mask plumbing (critical for the reveal effect):
  - `.header-1 h1 .char`, `.tooltip .title .line`, `.tooltip .description .line` → `display: inline-block; overflow: hidden;`
  - `.header-1 h1 .char > span`, `.tooltip .icon ion-icon`, `.tooltip .title .line > span`, `.tooltip .description .line > span` → `position: relative; display: block; transform: translateY(100%); will-change: transform;` (everything starts hidden below its overflow mask).
- `@media (max-width: 1000px)`: `h1` 2rem and centered; `h2` and `.tooltip .icon` 1.5rem; `.tooltips` becomes a full-width centered column with `gap: 2rem`; each `.tooltip` is `width: 85%` and tooltip 2 resets to `flex-start` alignment; dividers become `width: 70%` and tooltip 2's divider origin flips to `right center`; tooltip 2's icon/title go back to `width: 100%`.

## GSAP effect (exhaustive)

### Smooth scroll bridge

Instantiate `new Lenis()`, wire `lenis.on("scroll", ScrollTrigger.update)`, drive it with `gsap.ticker.add((time) => lenis.raf(time * 1000))`, and call `gsap.ticker.lagSmoothing(0)`.

### SplitText setup

- Split `.header-1 h1` with `type: "chars", charsClass: "char"`.
- Split `.tooltip .title h2` and `.tooltip .description p` with `type: "lines", linesClass: "line"`.
- After splitting, manually wrap the innerHTML of every char and every line in a `<span>` (e.g. `char.innerHTML = `<span>${char.innerHTML}</span>``). The outer char/line acts as an `overflow: hidden` mask and the inner span is the element that animates (CSS starts it at `translateY(100%)`).

### Shared tween options

`const animOptions = { duration: 1, ease: "power3.out", stagger: {{motion.stagger.tight}} };` — reused by the divider and tooltip tweens below.

### ScrollTrigger #1 — header-1 char reveal on approach

`ScrollTrigger.create` with `trigger: ".product-overview"`, `start: "75% bottom"` (no scrub):

- `onEnter`: `gsap.to(".header-1 h1 .char > span", { y: "0%", duration: 1, ease: "power3.out", stagger: {{motion.stagger.tight}} })` — chars rise out of their masks left to right.
- `onLeaveBack`: same tween back to `y: "100%"`.

### ScrollTrigger #2 — the pinned scrub timeline (imperative, via onUpdate)

`ScrollTrigger.create` with `trigger: ".product-overview"`, `start: "top top"`, `end: "+=" + window.innerHeight * 10 + "px"` (the section stays pinned for 10 viewport heights), `pin: true`, `pinSpacing: true`, `scrub: 1`.

Everything below happens inside `onUpdate: ({ progress }) => { ... }` — each range is mapped by hand from the 0→1 progress and applied with `gsap.to` calls (the header/mask tweens use GSAP's default duration/ease, which gives them a soft glide on top of the scrub):

1. **Header 1 slides out left** — progress 0.05→0.35: `gsap.to(".header-1", { xPercent })` where `xPercent` is `0` below 0.05, `-100` above 0.35, otherwise `-100 * ((progress - 0.05) / 0.3)`.
2. **Circular mask expands** — progress 0.20→0.30: compute `maskSize` = `0` below 0.2, `100` above 0.3, otherwise `100 * ((progress - 0.2) / 0.1)`, then `gsap.to(".circular-mask", { clipPath: \`circle(${maskSize}% at 50% 50%)\` })`. The dark circle grows from the center until it covers the whole section, flipping the scene from light to dark.
3. **Header 2 sweeps across** — progress 0.15→0.50: `gsap.to(".header-2", { xPercent })` where `xPercent` is `100` below 0.15, `-200` above 0.5, otherwise `100 - 300 * ((progress - 0.15) / 0.35)` (it enters from the right, crosses the screen, and exits fully left — a 300% travel).
4. **Dividers grow** — progress 0.45→0.65: `scaleX` = `0` below 0.45, `100` above 0.65, otherwise `100 * ((progress - 0.45) / 0.2)`; apply with `gsap.to(".tooltip .divider", { scaleX: \`${scaleX}%\`, ...animOptions })`.
5. **Tooltip content reveals (threshold toggles, not ramps)** — two groups:
   - Group 1 at `progress >= 0.65`: `".tooltip:nth-child(1) .icon ion-icon"`, `".tooltip:nth-child(1) .title .line > span"`, `".tooltip:nth-child(1) .description .line > span"`.
   - Group 2 at `progress >= 0.85`: same three selectors for `.tooltip:nth-child(2)`.
   - For each group: `gsap.to(elements, { y: progress >= threshold ? "0%" : "125%", ...animOptions })` — so each group snaps its target and eases in/out with the 0.025 stagger, and scrolling back re-hides it.
6. **Model rotation** — for `progress >= 0.05`: `rotationProgress = (progress - 0.05) / 0.95`, `targetRotation = Math.PI * 3 * 4 * rotationProgress` (12π rad ≈ 6 full turns across the pin). Keep a `currentRotation` accumulator and apply only the delta: if `|targetRotation - currentRotation| > 0.001`, call `model.rotateOnAxis(new THREE.Vector3(0, 1, 0), diff)` and update the accumulator. This rotates around the model's local Y axis so the tilted bottle spins about its own long axis.

### Three.js scene

- `THREE.Scene`, `PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000)`.
- `WebGLRenderer({ antialias: true, alpha: true })`; `setClearColor(0x000000, 0)` (transparent — the page background shows through); size = window; `setPixelRatio(Math.min(devicePixelRatio, 2))`; `shadowMap.enabled = true` with `PCFSoftShadowMap`; `outputEncoding = THREE.LinearEncoding`; `toneMapping = THREE.NoToneMapping`, exposure 1.0. Append `renderer.domElement` to `.model-container`.
- Lights: `AmbientLight(0xffffff, 0.7)`; main `DirectionalLight(0xffffff, 1.0)` at `(1, 2, 3)` with `castShadow`, `shadow.bias = -0.001`, 1024×1024 shadow map; fill `DirectionalLight(0xffffff, 0.5)` at `(-2, 0, -2)`.
- Load the `.glb` with `GLTFLoader`. On load, traverse the scene and on every mesh material set `metalness: 0.05, roughness: 0.9` (matte look). Measure the model with `new THREE.Box3().setFromObject(model)` and store its size vector.
- `setupModel()` (called on load and on every resize; guard until model + size exist):
  - `isMobile = window.innerWidth < 1000`.
  - Position: x = `center.x + size.x * 1` on mobile, `-center.x - size.x * 0.4` on desktop (pushes the bottle left of center so it sits under the tooltip gap); y = `-center.y + size.y * 0.085`; z = `-center.z`.
  - `model.rotation.z = -25°` (in radians) on desktop, `0` on mobile — a jaunty tilt.
  - Camera at `(0, 0, maxDimension * d)` where `d` = 2 on mobile, 1.25 on desktop, looking at the origin.
- Plain `requestAnimationFrame` loop calling `renderer.render(scene, camera)`.
- `resize` listener: update camera aspect + projection matrix, renderer size, and re-run `setupModel()`.

## Assets / images

- **1 × GLTF binary model (`.glb`)**: a fitness shaker bottle (cylindrical drink bottle with a lid), roughly upright, real-world scale irrelevant since the camera frames it from its bounding box. Load it from a local path (e.g. `./shaker.glb`). No textures required beyond whatever the model ships with — materials get forced matte at runtime.
- No raster images. Two Ionicons glyphs (`flash`, `bluetooth`) render via the `<ion-icon>` web component.

## Behavior notes

- The whole page scroll is smoothed by Lenis; the showcase section is pinned for 10 viewport heights, so plan for a tall scroll.
- Scrolling backwards fully reverses every stage (headers slide back, mask shrinks, tooltips re-hide via the `125%` branch, the model spins back because rotation is delta-based).
- The scrub pipeline is imperative (a single `onUpdate` doing range-mapping) rather than a declarative timeline — reproduce it that way to get the same layered easing feel.
- Desktop-first; below 1000px the tooltips stack vertically, the model shifts right of center and loses its tilt, and the camera pulls back.
- The header text intentionally overflows the viewport (200vw / 150vw containers with 15vw type) — do not "fix" that; the horizontal slide depends on it.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/sofihealth-product-scroll-animation/shaker.glb
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: a single script that waits for `DOMContentLoaded`, reaches into the page with unscoped `document.querySelector` calls for `.header-1`, `.header-2`, `.circular-mask`, `.tooltip`, and `.model-container`, and only then wires two independent `ScrollTrigger.create` calls, a Lenis bridge, and a Three.js scene that never expects to be torn down. React withdraws all three of those guarantees at once, and quietly: the shaker spins, the headlines slide, and the tooltips reveal correctly on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component accumulates five independent pieces of live state before the first paint completes: a `Lenis` instance, a `gsap.ticker` subscription driving it, two `ScrollTrigger`s (the char-reveal on approach and the ten-viewport-height pinned scrub), a self-scheduling `requestAnimationFrame` render loop, and an in-flight `GLTFLoader` fetch. A double mount that doesn't undo every one of those leaves two `WebGLRenderer`s appending competing `<canvas>` elements into `.model-container`, two pins fighting over `.product-overview`'s own inline styles, two `onUpdate` callbacks each running their own `gsap.to` range-mapping against the same headlines and mask, and a shaker whose rotation stutters between two separate `currentRotation` accumulators. None of it reproduces in a production build — React only double-invokes effects in development — so treat the teardown below as load-bearing, not optional.

*(1) The entry point* — the whole script is wrapped in `document.addEventListener("DOMContentLoaded", ...)`. By the time a React component mounts, that event has already fired, so the listener never runs: no Lenis, no SplitText, no `ScrollTrigger`, no scene, nothing. Delete the listener and move its entire body — plugin registration through the closing `ScrollTrigger.create` for the pinned scrub — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger, SplitText)` can move to module scope instead; repeating it on every mount is harmless but pointless.

*(2) Element lookups* — `.header-1`, `.header-2`, `.circular-mask`, `.tooltip`, `.model-container`, and both trigger elements resolve as class selectors against `.product-overview`, and `renderer.domElement` gets appended into whatever `document.querySelector(".model-container")` finds first. Put a root ref on the wrapping `<section className="product-overview">` and scope every one of those — the two `SplitText` targets, the divider and tooltip selectors used inside `onUpdate`, and the `.model-container` the canvas is appended to — off that ref. The `.model-container` lookup is the one that bites hardest: during the StrictMode remount two copies of it briefly coexist, and an unscoped `querySelector` can append the second mount's renderer canvas into the container that's already being torn down.

*(3) Cleanup* — wrap the whole body in a `gsap.context` scoped to the root ref and revert it in cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, both SplitText calls, both ScrollTrigger.create calls
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` covers both `SplitText` instances, the char-reveal trigger, and the pinned scrub — including the pin-spacer that `pin: true` inserts around `.product-overview` and the inline styles it rewrites for the ten-viewport-height scroll. Skip the revert and a remount leaves an orphaned spacer plus a second live pin disagreeing with the first about the current progress value. This component never calls `ctx.add`/`self.add` — every trigger and tween is created directly inside the factory — so the two-overload trap doesn't apply here.

### The ticker drives Lenis, and the context doesn't see it

`gsap.ticker.add((time) => lenis.raf(time * 1000))` is not a tween or a trigger, so `ctx.revert()` never touches it — this is exactly the case where that matters, because this callback *is* Lenis's own frame loop. Keep the function reference and remove it before destroying Lenis, in this order:

```jsx
const driveLenis = (time) => lenis.raf(time * 1000);
gsap.ticker.add(driveLenis);
gsap.ticker.lagSmoothing(0);
// cleanup:
gsap.ticker.remove(driveLenis);
lenis.destroy();
```

Reverse that order and a ticker frame landing between the two calls invokes `.raf()` on a Lenis instance that no longer exists.

### Lenis

`new Lenis()` here is bare — no options — and its only subscriber is `lenis.on("scroll", ScrollTrigger.update)`. If this shaker section ends up as one piece of a larger app, lift the instance to the app shell and have this effect subscribe to the existing one instead of constructing a second; a page gets exactly one smooth scroller. If the section genuinely owns the page's scroll, construct it inside the effect and call `lenis.destroy()` in the cleanup, after removing `driveLenis` as shown above.

### The render loop and the pinned scrub are two separate clocks

`function animate()` only calls `renderer.render(scene, camera)` and reschedules itself — it carries no simulation state of its own, but it is a second live loop running alongside the ScrollTrigger `onUpdate` that turns the model. Keep the handle its `requestAnimationFrame` call returns and cancel it in the same cleanup that reverts the context; an uncancelled copy keeps calling `renderer.render` against a `scene`/`camera` pair the next mount has already replaced, and the shaker renders twice, out of phase.

### SplitText

`header1Split` (chars, on `.header-1 h1`) and `titleSplits`/`descriptionSplits` (lines, on `.tooltip .title h2` and `.tooltip .description p`) each get their `innerHTML` rewritten a second time right after splitting, to wrap every char/line in the `<span>` the CSS mask expects (`.char > span` / `.line > span` starting at the hidden `translateY(100%)` offset). Revert all three splits inside the same `gsap.context`, before the wrap step can run again on a remount — otherwise it wraps the already-wrapped spans, the reveal targets a nested span one level too deep, and the char and line tweens in both the approach trigger and the tooltip-reveal branch of `onUpdate` stop matching any visible element.

### The GLTF load can finish after the component is gone

`new GLTFLoader().load(...)` assigns `model`, adds it to `scene`, and calls `setupModel()` from its callback — and that callback can fire after a StrictMode unmount has already reverted the first mount's context and cancelled its render loop. If it does, it populates a `scene` nothing renders and runs `setupModel()`'s `isMobile`/position math against a container the DOM has already discarded, while the *second* mount's own `onUpdate` keeps reading a `model` variable that stays `undefined` until its own, separate load resolves. Guard the callback with the same cancellation flag the cleanup sets:

```jsx
useEffect(() => {
  let cancelled = false;
  const ctx = gsap.context(() => {
    new GLTFLoader().load(modelUrl, (gltf) => {
      if (cancelled) return;
      // assign model, traverse for the matte material, scene.add, setupModel()
    });
  }, rootRef);
  return () => { cancelled = true; ctx.revert(); };
}, []);
```

### Three.js → React Three Fiber

- **Scene ownership.** `<Canvas>` takes over the `Scene`, `PerspectiveCamera(60, aspect, 0.1, 1000)`, and `WebGLRenderer({ antialias: true, alpha: true })` triple — delete that block and carry the alpha flag and the transparent clear color into `<Canvas gl={{ alpha: true }}>` so the page background still shows through the model container. The ambient light, the shadow-casting main directional light at `(1, 2, 3)`, and the fill light at `(-2, 0, -2)` become three JSX elements instead of three `new THREE.*Light()` calls.
- **No extra render loop.** `animate()`'s only job is `renderer.render(scene, camera)`, and `<Canvas>` already does that on every frame by default — delete it entirely rather than reaching for `useFrame`. The rotation itself is not a per-frame animation either: it's computed from the pinned `ScrollTrigger`'s progress, once per scrub tick, so it belongs in that same `onUpdate` callback, applied to a ref on the loaded group (`groupRef.current.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationDiff)`) — not moved into `useFrame`, which would run it on the render clock instead of the scroll one.
- **Model loading and grading.** `GLTFLoader().load(modelUrl, ...)` becomes `useGLTF(modelUrl)`. The matte-material rewrite (forcing metalness and roughness on every mesh) and the `Box3`-based centering in `setupModel()` still have to run once the geometry is available — do them in an effect keyed on the loaded scene, guarded by the same cancellation pattern, not inline during render — and keep in mind `useGLTF` caches by URL: mutate a clone of each material rather than the cached one, or a second consumer of the same `.glb` inherits an already-matte finish.
- **Resize.** `<Canvas>` already observes its own container and keeps the camera's aspect and the renderer's size in sync — drop the manual `resize` listener along with its `camera.updateProjectionMatrix()`/`renderer.setSize()` calls, and re-run only the `isMobile` branch of `setupModel()` (position, the tilt on `rotation.z`, camera distance) from a `ResizeObserver` or `useThree(({ size }) => ...)` instead of reading `window.innerWidth` directly.
- **Poster mandatory.** The `.glb` fetch plus the matte-material traverse happens after mount, and the pinned scrub above `.model-container` starts answering scroll immediately — a visitor who scrolls fast during a cold load reaches the mask-flip and tooltip reveal against an empty box where the shaker should be. Render a poster image sized to the same container and swap it for the `<Canvas>` once `useGLTF`'s suspense boundary resolves.
- **No `Environment` preset.** This scene is already fully lit by the three explicit sources above, tuned specifically for the matte finish the material traversal forces — don't reach for drei's `Environment` with a `preset` to add reflections; a fetch failure to that preset's third-party CDN would leave the shaker unlit with no visible error. Self-host an HDRI and point `Environment` at it if you want image-based lighting instead.
