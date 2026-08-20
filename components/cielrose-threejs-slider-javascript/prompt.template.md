---
slug: cielrose-threejs-slider-javascript
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Three.js Wheel-Driven Shader Slider

## Goal
Build a full-viewport **WebGL image slider driven by the mouse wheel**. A single 16:9 plane floats in the center of the screen over a soft grey-to-white gradient page. Scrolling wheels through an endless loop of 7 images: a custom fragment shader performs a **vertical filmstrip wipe** (the next image slides up from the bottom edge while the current one slides out the top), a vertex shader **bulges the plane toward the camera** proportionally to scroll velocity, and the whole plane **swells/shrinks slightly** with scroll intensity. When scrolling stops, a lerp **snaps to the nearest whole image** and the project title (clipped inside a 16px-tall mask) **slides back up into view** with the new slide's name. Everything is hand-rolled in a `requestAnimationFrame` loop plus one CSS transition — **no GSAP, no ScrollTrigger, no page scroll**.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`three` (npm) only**:
```js
import * as THREE from "three";
```
No GSAP, no Lenis. Structure the JS in three modules: `script.js` (main), `shaders.js` (exports `vertexShader` and `fragmentShader` GLSL strings), and `slides.js` (exports a `slides` array of `{ title, url, image }`).

## Layout / HTML
```html
<body>
  <nav>
    <div class="logo"><a href="#">Motionprompts</a></div>
    <div class="links">
      <a href="#">About</a>
      <a href="#">Contact</a>
      <div class="socials">
        <a href="#">FB</a><a href="#">IG</a><a href="#">YT</a>
      </div>
    </div>
  </nav>

  <footer>
    <p>Experiment 444</p>
    <p>Scroll to explore</p>
  </footer>

  <div class="gradient-bg"></div>

  <div class="container">
    <div class="project-title-container">
      <a href="#" id="project-link">
        <div class="project-title-mask">
          <p id="project-title">Title 1</p>
        </div>
      </a>
    </div>
  </div>
  <script type="module" src="./script.js"></script>
</body>
```
The Three.js `<canvas>` is appended by JS into `.container`. The title sits in a fixed, centered overlay exactly matching the plane's footprint.

## Styling
Import Google font **Roboto Mono** (`@import url("https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap")`). Global reset `* { margin:0; padding:0; box-sizing:border-box; }`.

- `a, p`: `display:block; text-decoration:none; text-transform:uppercase; color:#000; font-family:"Roboto Mono"; font-size:12px; font-weight:400;` — everything on the page is tiny uppercase mono text.
- `nav, footer`: `position:absolute; left:0; width:100vw; padding:1em; display:flex; justify-content:space-between; gap:2em; z-index:1;` — nav pinned `top:0`, footer pinned `bottom:0`.
- `.links, .socials`: `display:flex; gap:2em;`. Also `nav > *, .links a { flex:1; }` so the nav spreads evenly across the top.
- `.gradient-bg`: `position:absolute; bottom:0; width:100vw; height:100svh; background:linear-gradient(0deg, rgba(204,204,204,1) 0%, rgba(255,255,255,1) 100%); z-index:0;` — light grey at the bottom fading to white at the top. The WebGL canvas is transparent, so this gradient is the page background.
- `.container`: `position:relative; width:100vw; height:100svh; overflow:hidden; z-index:2;` — hosts the canvas.
- `.project-title-container`: `position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:50%; aspect-ratio:16/9;` — the exact same box as the WebGL plane (50% of viewport width, 16:9), so the title is vertically centered over the image.
- `#project-link`: `width:100%; height:100%; display:flex; align-items:center; color:#fff;`.
- `.project-title-mask`: `position:relative; width:100%; height:16px; clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%); overflow:hidden;` — a **16px-tall clipping window**; the title hides by translating just past it.
- `#project-title`: `display:block; position:relative; transform:translateY(0px); color:#fff; text-align:center; text-transform:uppercase; font-family:"Roboto Mono"; font-size:13px; line-height:1; transition: transform 0.5s ease-in-out;` — **this CSS transition is the only tweened animation**; JS just flips the `transform` value.

## The effect (be exhaustive — hand-rolled rAF + shaders, no GSAP)

### Slides data (`slides.js`)
7 entries, each `{ title, url, image }`. Titles: **"Chromatic Loopscape", "Solar Bloom", "Neon Handscape", "Echo Discs", "Void Gaze", "Gravity Sync", "Heat Core"**. URLs are placeholder links (e.g. `https://example.com/alpha` … `/eta`). Images are the 7 texture files. On load, set `#project-title` text and `#project-link` href from `slides[0]`.

### State variables (exact values matter)
```js
let scrollIntensity = 0, targetScrollIntensity = 0;
const maxScrollIntensity = 1.0;
const scrollSmoothness = 0.5;          // fast lerp — intensity reacts snappily

let scrollPosition = 0, targetScrollPosition = 0;
const scrollPositionSmoothness = 0.05; // slow lerp — position glides with heavy inertia

let isMoving = false;
const movementThreshold = 0.001;
let isSnapping = false;

let stableCurrentIndex = 0, stableNextIndex = 1, isStable = false;
let titleHidden = false, titleAnimating = false, currentProjectIndex = 0;
```

### Scene setup
- `THREE.Scene()`, `THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000)`, `camera.position.z = 5`.
- `THREE.WebGLRenderer({ antialias: true })`; `setSize(innerWidth, innerHeight)`; `setPixelRatio(Math.min(devicePixelRatio, 2))`; **`setClearColor(0xffffff, 0)`** — alpha 0 so the CSS gradient shows through. Append `renderer.domElement` to `.container`.
- **Plane dimensions from the camera frustum**: `viewportHeight = 2 * tan(fovRadians/2) * camera.position.z`, `viewportWidth = viewportHeight * camera.aspect`. Then `widthFactor = innerWidth < 900 ? 0.9 : 0.5`; `planeWidth = viewportWidth * widthFactor`; `planeHeight = planeWidth * (9/16)`. So the plane occupies **50% of the viewport width on desktop, 90% under 900px**, always 16:9 — matching `.project-title-container`.
- `THREE.PlaneGeometry(width, height, 32, 32)` — the **32×32 segments are required** for the vertex-shader bend.
- Load all 7 textures with `THREE.TextureLoader`; set `minFilter` and `magFilter` to `THREE.LinearFilter`; mark each `needsUpdate = true` to preload.
- `THREE.ShaderMaterial` with `side: THREE.DoubleSide` and uniforms:
  - `uScrollIntensity` (float, scroll velocity −1..1)
  - `uScrollPosition` (float, fractional slide progress 0..1)
  - `uCurrentTexture`, `uNextTexture` (samplers, init `textures[0]` / `textures[1]`)

### Vertex shader (velocity bulge)
```glsl
uniform float uScrollIntensity;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = position;
  float sideDistortion = sin(uv.y * 3.14159) * uScrollIntensity * 0.5;
  float topBottomDistortion = sin(uv.x * 3.14159) * uScrollIntensity * 0.2;
  pos.z += sideDistortion + topBottomDistortion;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```
Both `sin(uv * π)` terms peak at the plane's center and vanish at the edges, so the plane **bows toward the camera like a sail** (amplitude 0.5 along the vertical axis, 0.2 along the horizontal). Sign follows scroll direction: scroll down bulges forward, scroll up bows backward.

### Fragment shader (vertical filmstrip wipe)
```glsl
uniform sampler2D uCurrentTexture;
uniform sampler2D uNextTexture;
uniform float uScrollPosition;
varying vec2 vUv;
void main() {
  float normalizedPosition = fract(uScrollPosition);
  vec2 currentUv = vec2(vUv.x, mod(vUv.y - normalizedPosition, 1.0));
  vec2 nextUv = vec2(vUv.x, mod(vUv.y + 1.0 - normalizedPosition, 1.0));
  if (vUv.y < normalizedPosition) {
    gl_FragColor = texture2D(uNextTexture, nextUv);
  } else {
    gl_FragColor = texture2D(uCurrentTexture, currentUv);
  }
}
```
As `uScrollPosition` goes 0 → 1, a horizontal seam rises from the bottom edge: below the seam the **next** texture shows, above it the **current** one, and both textures' `uv.y` are offset by the same amount so the pair scrolls together like one continuous vertical filmstrip.

### Texture index bookkeeping
`determineTextureIndices(position)` — with 7 slides:
- `baseIndex = Math.floor(position % totalImages)`; if negative, wrap with `(totalImages + baseIndex) % totalImages` — supports scrolling **backwards past zero** infinitely.
- `nextIndex = (currentIndex + 1) % totalImages`.
- `normalizedPosition = position % 1`, +1 if negative.

Every frame, `updateTextureIndices()` assigns `uCurrentTexture`/`uNextTexture` from these indices — **unless `isStable` is true**, in which case it uses the frozen `stableCurrentIndex`/`stableNextIndex` (prevents a 1-frame texture pop at rest).

### Wheel input (the only trigger)
```js
window.addEventListener("wheel", (event) => {
  event.preventDefault();          // the page never scrolls
  isSnapping = false; isStable = false;
  hideTitle();
  targetScrollIntensity += event.deltaY * 0.001;
  targetScrollIntensity = Math.max(-1, Math.min(1, targetScrollIntensity)); // clamp ±1
  targetScrollPosition += event.deltaY * 0.001;
  isMoving = true;
}, { passive: false });
```

### The rAF loop (every frame, in this order)
1. `scrollIntensity += (targetScrollIntensity - scrollIntensity) * 0.5` → write to `uScrollIntensity`.
2. `scrollPosition += (targetScrollPosition - scrollPosition) * 0.05` (heavy glide).
3. `uScrollPosition = isStable ? 0 : positiveFract(scrollPosition)`.
4. `updateTextureIndices()`.
5. **Scale breathing**: `baseScale = 1.0`, `scaleIntensity = 0.1`. If `scrollIntensity > 0`: `scale = 1 + scrollIntensity * 0.1`; else `scale = 1 - |scrollIntensity| * 0.1`. Apply `plane.scale.set(scale, scale, 1)` — the plane grows up to 10% scrolling down, shrinks up to 10% scrolling up.
6. **Velocity decay**: `targetScrollIntensity *= 0.98` — intensity (bulge + scale) relaxes back to 0 on its own after input stops.
7. **Snap logic**: `scrollDelta = |targetScrollPosition - scrollPosition|`.
   - If `scrollDelta < 0.001` and `isMoving && !isSnapping` → `snapToNearestImage()`: set `targetScrollPosition = Math.round(scrollPosition)`, compute stable indices from that rounded position, store `currentProjectIndex`, call `showTitle()`. The 0.05 lerp then glides the seam to the nearest whole image.
   - If `scrollDelta < 0.0001` → if not already stable: `isStable = true`, `scrollPosition = Math.round(scrollPosition)`, `targetScrollPosition = scrollPosition`. Then `isMoving = false`, `isSnapping = false`.
8. `renderer.render(scene, camera)`.

### Title hide/show (CSS transition, 0.5s ease-in-out)
- `hideTitle()` (on first wheel event): if not hidden and not animating, set `projectTitle.style.transform = "translateY(20px)"` — the text drops below the 16px mask and disappears. A 500ms `setTimeout` flips `titleHidden = true`.
- `showTitle()` (called by the snap): if hidden and not animating, first swap `textContent` to `slides[currentProjectIndex].title` and the link `href` to the slide's URL, then set `transform = "translateY(0px)"` — the new title rises back into the mask. 500ms timeout resets the guard flags.
- Both use the `titleAnimating` flag to prevent overlap; the motion itself comes from the CSS `transition: transform 0.5s ease-in-out`.

### Resize
On `resize`: update `camera.aspect` + `updateProjectionMatrix()`, `renderer.setSize` + `setPixelRatio(min(dpr, 2))`, recompute plane dimensions (with the `< 900px → 0.9` width factor), `dispose()` the old geometry, and assign a fresh `PlaneGeometry(w, h, 32, 32)`.

## Assets / images
**7 slide textures, displayed in a 16:9 landscape frame** (any generous resolution, e.g. 1280×720+; they map edge-to-edge onto the plane). They should read as one cohesive set of **dark, saturated, abstract 3D renders with iridescent / chromatic-aberration lighting** — glossy surreal objects glowing against black or deep-gradient backgrounds. By role:

1. Slide 1 "Chromatic Loopscape" — interlocking rounded U-shaped tubes with iridescent chromatic edges on black.
2. Slide 2 "Solar Bloom" — a soft glossy translucent orb floating over a warm red-orange gradient haze.
3. Slide 3 "Neon Handscape" — two symmetrical stylized 3D hands with long fingers in purple/orange thermal tones on black.
4. Slide 4 "Echo Discs" — stacked glossy elliptical discs orbited by a thin ring over a saturated rainbow gradient.
5. Slide 5 "Void Gaze" — two glowing orbs inside a dark almond-shaped void framed by purple/orange bands, like an eye.
6. Slide 6 "Gravity Sync" — a floating ringed planet with smaller spheres over a purple-to-orange gradient.
7. Slide 7 "Heat Core" — a cross-shaped cluster of glossy metallic cylinders with orange/purple iridescent reflections on black.

Name them sequentially (`img1.jpg` … `img7.jpg`) and reference them from `slides.js`.

## Behavior notes
- **Wheel/trackpad only** — the wheel listener calls `preventDefault()` (registered with `{ passive: false }`), so the document never scrolls; "Scroll to explore" refers to the slider itself. No click/drag/keyboard navigation.
- **Infinite in both directions**: positive-modulo index math loops 7 → 1 forward and 1 → 7 backward with no seam.
- The slider always comes to rest **exactly on a whole image** (snap + stable-state clamp), with `uScrollPosition` forced to 0 while stable.
- **Desktop-oriented**; the only responsive concession is the plane width factor (0.5 → 0.9 below 900px viewport width) and full resize handling. No reduced-motion handling — motion is entirely user-driven.
- Canvas is transparent; the grey→white CSS gradient is the visible backdrop, and thin black mono type (nav/footer) frames the composition while the white title floats centered on the imagery.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/cielrose-threejs-slider-javascript/img1.jpg
https://motionprompts.dev/c/cielrose-threejs-slider-javascript/img2.jpg
https://motionprompts.dev/c/cielrose-threejs-slider-javascript/img3.jpg
https://motionprompts.dev/c/cielrose-threejs-slider-javascript/img4.jpg
https://motionprompts.dev/c/cielrose-threejs-slider-javascript/img5.jpg
https://motionprompts.dev/c/cielrose-threejs-slider-javascript/img6.jpg
… 1 more under https://motionprompts.dev/c/cielrose-threejs-slider-javascript/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--muted`, `--paper`, `--zinc`, `--steel`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already tears itself down: one call builds the scene, camera, renderer, the shader-driven plane and its seven textures, the wheel/touch listeners, and the `animate()` loop that drives all of it, and the function `mount` returns cancels the frame, removes all five `window` listeners, clears the two title timers, disposes the geometry, the material and every texture, force-loses the WebGL context, and restores the title's text, its inline `style`, and the link's `href` to whatever they were before `mount` touched them. This component was written to survive being re-invoked by this catalog's own editor runtime (`window.MP.register`), so most of the discipline a React effect needs is already on the page — but `mount`/`destroy` were built for one external caller re-triggering them deliberately, not for React's own remount timing, and the two do not line up for free. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Call `mount()` without wiring its return value back as the effect's own cleanup, and the second mount appends a second `<canvas>` into `.container` next to the first, binds a second set of wheel/touch listeners to the same `window`, and starts a second `animate()` loop that scales and re-textures a `plane` the first loop knows nothing about — two renderers racing to paint the same box, both reacting to the same wheel event. It will not reproduce in a production build, because only development does the double mount. Treat `destroy()` as the cleanup itself, not as something the effect calls in addition to its own teardown.

*(1) The entry point* — the bottom of the file checks `window.MP` first, and only in its absence checks `document.readyState` before deciding whether to wait for `DOMContentLoaded`. Both branches exist for the standalone demo and this catalog's visual editor; neither has a job inside a host React component. Delete the whole `if`/`else`, including the `window.MP.register` branch, and call `mount(Object.assign({}, DEFAULTS))` directly inside a `useEffect` with an empty dependency array, keeping its return value as the effect's own cleanup. A React component never needs the `readyState` guard — `useEffect` already runs after the DOM is committed, so the race that guard protects against (script parsed and run before the DOM it queries exists) cannot happen here.

*(2) Element lookups* — `mount` looks up `.container`, `#project-title` and `#project-link` against the document and already returns a no-op `destroy` if any of the three is missing; keep that guard. What is not safe unscoped is the lookup itself: give the component a root ref, render the container div and the title link inside it, and resolve the three nodes from that ref instead of the document. During the StrictMode remount two copies of this subtree exist for an instant, and an unscoped `#project-title` can bind to the copy already on its way out. Keep stashing `titleOriginalText`, `titleOriginalStyle` and `linkOriginalHref` before overwriting them, too — that triplet is what lets `destroy` hand the title node back exactly as it found it, which matters here because the title's text and `href` are driven imperatively rather than through props.

*(3) Cleanup* — two things in this effect outlive a naive `return`.

The `animate()` loop is the only thing that renders a frame: it lerps `scrollIntensity` and `scrollPosition` toward their targets, writes the two into the shader's uniforms, calls `updateTextureIndices()`, applies the scale-breathing to `plane.scale`, runs the snap check, and only then calls `renderer.render`, before scheduling its own next call. Keep the `alive` flag and the `frame` handle exactly as used: `alive` stops the body of the next already-scheduled call, and `cancelAnimationFrame(frame)` in the returned cleanup stops the call still queued. Drop either one and a StrictMode remount leaves the first loop's `render()` calls interleaved with the second's, each scaling and re-texturing a `plane` object the other loop never touches — the visible symptom is a slider whose zoom-breathing and filmstrip wipe both run at roughly double rate.

`loadTextures` guards the one asynchronous seam in this component: each of the seven `TextureLoader.load()` calls carries an `onLoad` and an `onError` that check `destroyed` before doing anything, because a texture requested at mount time decodes and lands on three's own schedule, which can be after that mount has already been torn down. Keep `destroyed` (or fold it into whatever cancellation flag the rest of the effect uses) and keep the check in both callbacks — removing it because "the cleanup already disposed everything" leaves a late `onLoad` free to call `texture.dispose()` on a texture a fresh remount may already be pointing a live uniform at, or, if the check is dropped from `onError` too, to keep logging into a component that no longer exists.

*(4) Rendering this in `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

`<Canvas>` replaces the `new THREE.Scene()` / `PerspectiveCamera` / `WebGLRenderer` block outright: match the camera's field of view, near/far planes and starting `z` with `camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 5] }}`, and carry the `antialias: true` and the transparent clear (`setClearColor(0xffffff, 0)`) into `gl={{ antialias: true, alpha: true }}` — the CSS gradient behind the canvas is the whole reason the clear is transparent, and a default `<Canvas>` opts into it already. `calculatePlaneDimensions` should not be ported as manual frustum trigonometry: `useThree(({ viewport }) => viewport)` already gives the visible width and height in world units at the plane's depth, so only the `widthFactor` breakpoint (the switch to the wider factor under 900px) still needs a manual viewport-width check, since that number is a CSS-style breakpoint R3F's `viewport` has no opinion about. `PlaneGeometry` becomes a declarative `<planeGeometry args={[width, height, 32, 32]} />` re-created (new `key`, or a `useMemo` keyed on the computed width/height) whenever the viewport-driven dimensions change — R3F disposes the outgoing geometry for you when the element unmounts, so the manual `plane.geometry.dispose()` in `onResize` goes away with the listener itself. `renderer.setPixelRatio` becomes `<Canvas dpr={[1, 2]}>`.

`TextureLoader.load(...)` becomes drei's `useTexture`, called once with all seven URLs (`useTexture(slides.map(s => s.image))`) so Suspense holds the tree until every image has decoded, replacing the seven independent `onLoad` callbacks with one readiness gate. Keep `determineTextureIndices` and `updateTextureIndices` exactly as written — they stay pure index math over the loaded array, unaffected by how the array got loaded — and still assign the two texture uniforms by index from inside the frame loop rather than through props, since the current/next pair changes every frame while scrolling.

The `animate()` body becomes the callback passed to `useFrame`: everything between the intensity lerp and `renderer.render` moves in, unchanged in logic, except `renderer.render(scene, camera)` is dropped — `<Canvas>` renders the frame for you once `useFrame` returns. Keep `scrollIntensity`, `scrollPosition`, `isStable`, `stableCurrentIndex`/`stableNextIndex` and the title-related flags as refs, not `useState`: this loop runs every frame, and routing any of these through state re-renders the React tree at that same rate for values that only ever feed a `ShaderMaterial` uniform and a `Mesh` scale. Get the material by attaching a `ref` to a declarative `<shaderMaterial args={[{ uniforms, vertexShader, fragmentShader }]} side={THREE.DoubleSide} />` and mutate `materialRef.current.uniforms.uScrollIntensity.value` from inside `useFrame`, the same way the vanilla loop mutates `material.uniforms` directly.

The wheel and touch listeners stay exactly what they are — page-level input, not pointer events on a mesh — so they stay on `window`, attached from a `useEffect` (inside or beside the `Canvas`-hosting component) that writes into the same refs `useFrame` reads, and torn down the same way `destroy()` already does. The title hide/show pair stays outside the `Canvas` entirely: it is a DOM overlay whose only motion is the existing CSS `transition` on `transform`, so port `hideTitle`/`showTitle` as a small piece of state (or the same imperative style-write) driven by the snap logic in `useFrame`, and keep the two 500ms timers in the same kind of tracked set the vanilla script already uses, cleared in this component's own cleanup.

A poster is mandatory even though nothing here is a `.glb`: with seven textures loading through Suspense, a cold visit shows nothing at all — not even the first frame — until all seven have decoded. Render slide one's image (`img1.jpg`, "Liquid Chrome") as a plain `<img>` filling the same 16:9 box the plane occupies, and swap it out only once the `Canvas` has actually painted a frame with the loaded textures, not the instant the component mounts.

Skip drei's `Environment` regardless of preset temptation: the `ShaderMaterial` here is fully custom and reads no scene lighting at all, so there is nothing for an environment map to feed. If a later variant of this slider swaps in a lit material, light it with explicit lights or a self-hosted HDRI passed to `Environment` — never a `preset`, which is fetched from a third-party CDN hard-coded into drei and leaves the scene unlit the moment that host is unreachable.
