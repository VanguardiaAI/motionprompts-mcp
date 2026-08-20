---
slug: grid-deformation-effect
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Grid Deformation Hover Effect (WebGL mouse-velocity image distortion)

## Goal
Build a full-screen hero that shows a single background image, but the image is not a plain
`<img>` — it is rendered onto a **Three.js shader plane**. Moving the pointer over the hero injects
**velocity** into a coarse grid of cells stored in a `DataTexture`; each cell's accumulated push
**displaces the image UVs** locally, dragging the pixels in the direction of the swipe, with a
subtle **RGB chromatic-aberration split** along the displacement. When the cursor stops, the whole
field **relaxes back to rest smoothly** (a per-cell decay of `0.925`/frame), so the image un-warps
on its own. The star of this piece is the grid-based UV displacement shader + the mouse-velocity
physics — there is no DOM animation and nothing scrolls.

## Tech
- Vanilla HTML / CSS / JS with ES module imports, bundled by Vite.
- **`three` (npm)** is the only JS dependency. Import it as `import * as THREE from "three";`.
- **No GSAP, no ScrollTrigger, no SplitText, no CustomEase, no Lenis.** All motion is a continuous
  `renderer.setAnimationLoop(...)` that re-integrates the grid every frame and re-renders. Do not
  reach for any animation library — the "easing" is the numeric relaxation + velocity-decay
  constants, applied by hand.

## Layout / HTML
Minimal DOM. One section, one `<img>` inside it. JS hides the `<img>` and appends the WebGL
`<canvas>` on top.
```html
<section class="hero">
  <img class="hero-video" src="/assets/hero-portrait.jpg" alt="" crossorigin="anonymous" />
</section>
<script type="module" src="./script.js"></script>
```
- `.hero` is the full-viewport container; the renderer's `<canvas>` is appended into it by JS
  (JS also adds the class `hero-canvas` to that canvas).
- `.hero-video` (the `<img>`) is the picture source. It is used two ways: (1) its file is loaded a
  second time as a `THREE.Texture` to feed the shader, and (2) its `naturalWidth`/`naturalHeight`
  provide the aspect used for cover-fit. JS sets its `style.opacity = "0"` so the raw DOM image is
  invisible and only the WebGL canvas shows. Keep `crossorigin="anonymous"` so the texture is not
  tainted.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`

- `.hero` — `position:relative; width:100%; height:100svh; overflow:hidden;`
- `.hero-video` — `position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;`
  (it is hidden by JS, but styled to cover in case the canvas is delayed).
- `.hero-canvas` (added to the `<canvas>` by JS) —
  `position:absolute; top:0; left:0; width:100%; height:100%; z-index:1;` so the canvas sits above
  the (invisible) image and fills the hero.

No fonts, no text, no other DOM. The entire visual is the distorted picture.

## The star effect — Three.js grid-displacement shader (be exact)

This is a near-verbatim port; reproduce the constants, the DataTexture bookkeeping, the shader, and
the per-frame integration exactly. All of it lives in the module `script.js`.

### Config constants (use these exact values)
```js
const GRID_SIZE    = 25;     // cells along the SHORT axis of the viewport
const MOUSE_RADIUS = 0.25;   // influence radius as a fraction of GRID_SIZE
const STRENGTH     = 0.1;    // push strength (multiplied by 100 in the integrator → 10)
const RELAXATION   = 0.925;  // per-frame decay of each cell back toward 0 (the "un-warp")
const DISPLACEMENT = 0.015;  // max UV shift the grid value maps to, in the shader
const ABERRATION   = 0.15;   // RGB split as a fraction of the displacement, in the shader
```
`DISPLACEMENT` and `ABERRATION` are inlined into the fragment-shader source as literals (via
template strings), so `0.015` and `0.15` must appear in the GLSL.

### Renderer, scene & camera
- `hero = document.querySelector(".hero")`, `video = document.querySelector(".hero-video")`.
- Cache `width = hero.offsetWidth`, `height = hero.offsetHeight`.
- `const scene = new THREE.Scene();`
- **Orthographic camera** filling exactly a 2×2 world:
  `const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10); camera.position.z = 1;`
- `const renderer = new THREE.WebGLRenderer({ antialias: true });`
  `renderer.setSize(width, height);`
  `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));`
  `renderer.domElement.classList.add("hero-canvas"); hero.appendChild(renderer.domElement);`

### Image texture
```js
const videoTexture = new THREE.TextureLoader().load("/assets/hero-portrait.jpg");
videoTexture.minFilter = videoTexture.magFilter = THREE.LinearFilter;
videoTexture.generateMipmaps = false;
video.style.opacity = "0";
```
- Load the **same file** as the `<img>` `src`. Do not set a color space (leave the default) — no
  extra tone/gamma conversion is applied.

### The DataTexture grid (the deformation field)
A tiny RGBA float texture, one texel per grid cell. R holds horizontal push, G holds vertical push;
B/A unused. The grid is `GRID_SIZE` cells on the short axis and proportionally more on the long
axis, so cells stay ~square regardless of viewport aspect:
```js
let gridX, gridY;
function createDataTexture() {
  const aspect = width / height;
  gridX = aspect >= 1 ? Math.round(GRID_SIZE * aspect) : GRID_SIZE;
  gridY = aspect >= 1 ? GRID_SIZE : Math.round(GRID_SIZE / aspect);

  const data = new Float32Array(gridX * gridY * 4);   // all zeros = flat/rest
  const texture = new THREE.DataTexture(
    data, gridX, gridY, THREE.RGBAFormat, THREE.FloatType,
  );
  texture.magFilter = texture.minFilter = THREE.NearestFilter;  // hard cells, no smoothing
  texture.needsUpdate = true;
  return texture;
}
let dataTexture = createDataTexture();
```
- e.g. a 16:9 viewport → `gridX ≈ 44`, `gridY = 25`. `NearestFilter` is important: it keeps each
  cell a crisp block so the displacement reads as a coarse grid, not a smooth blob.

### Cover-fit plane
The plane is sized so the image covers the 2×2 camera frustum (like CSS `object-fit: cover`) — the
overflowing dimension is clipped by the ortho camera:
```js
function getCoverScale() {
  const videoAspect = (video.naturalWidth || 16) / (video.naturalHeight || 9);
  const containerAspect = width / height;
  const scaleX = containerAspect < videoAspect ? videoAspect / containerAspect : 1;
  const scaleY = containerAspect > videoAspect ? containerAspect / videoAspect : 1;
  return [2 * scaleX, 2 * scaleY];   // base size 2×2, one axis scaled up to cover
}
```
Before the image has decoded, `naturalWidth/Height` are 0, so it falls back to `16/9`.

### Shader material + mesh
```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTexture:     { value: videoTexture },
    uDataTexture: { value: dataTexture },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform sampler2D uDataTexture;
    varying vec2 vUv;
    void main() {
      vec4 offset = texture2D(uDataTexture, vUv);
      vec2 shift  = 0.015 * offset.rg;      // DISPLACEMENT * grid value (R=x, G=y)
      vec2 split  = shift * 0.15;           // ABERRATION * shift → RGB fan-out

      // sample each channel at a slightly different offset → chromatic aberration
      float r = texture2D(uTexture, vUv - shift + split).r;
      float g = texture2D(uTexture, vUv - shift).g;
      float b = texture2D(uTexture, vUv - shift - split).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
});

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...getCoverScale()), material);
scene.add(mesh);
```
- At rest the DataTexture is all zeros → `shift = split = 0` → the image renders undistorted.
- Where a cell has been pushed, all three channels sample from `vUv - shift`, but R is pulled an
  extra `+split` and B an extra `-split`, so edges fringe red/blue along the push direction.
- Rebuild the geometry once the image finishes decoding so the real aspect is used
  (the original listens for the `loadeddata` event; using the `<img>`'s `load` event is equivalent):
  ```js
  video.addEventListener("loadeddata", () => {
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(...getCoverScale());
  });
  ```

### Mouse input → velocity
Track normalized cursor position (0–1 within the hero) and its per-event velocity:
```js
const mouse = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

hero.addEventListener("mousemove", (event) => {
  const rect = hero.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top)  / rect.height;

  mouse.vX = x - mouse.prevX;   // velocity ≈ movement delta
  mouse.vY = y - mouse.prevY;
  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = x;
  mouse.y = y;
});
```
Keep this exact bookkeeping order (`vX` is computed against the *previous* stored `prevX`, then
`prevX` is advanced to the last `mouse.x`).

### Per-frame integration (the physics — be exact)
Every frame, first **relax** the whole field toward zero, then **add** velocity to every cell inside
the cursor's influence radius, weighted by an inverse-distance falloff:
```js
function updateDataTexture() {
  const data = dataTexture.image.data;

  // 1) relaxation: decay R and G of every cell toward 0 (un-warp)
  for (let i = 0; i < data.length; i += 4) {
    data[i]     *= RELAXATION;   // 0.925
    data[i + 1] *= RELAXATION;
  }

  // 2) cursor position in grid space; y is flipped (texture origin bottom-left)
  const gridMouseX = gridX * mouse.x;
  const gridMouseY = gridY * (1 - mouse.y);
  const maxDist = GRID_SIZE * MOUSE_RADIUS;      // 25 * 0.25 = 6.25 cells

  for (let i = 0; i < gridX; i++) {
    for (let j = 0; j < gridY; j++) {
      const distanceSq = (gridMouseX - i) ** 2 + (gridMouseY - j) ** 2;
      if (distanceSq >= maxDist * maxDist) continue;          // outside brush → skip

      const index = 4 * (i + gridX * j);
      const power = Math.min(10, maxDist / Math.sqrt(distanceSq));   // ↑ near cursor, capped at 10
      data[index]     += STRENGTH * 100 * mouse.vX * power;   // 10 * vX * power → R (horizontal)
      data[index + 1] -= STRENGTH * 100 * mouse.vY * power;   // -(10 * vY * power) → G (vertical)
    }
  }

  // 3) velocity itself bleeds off so a flick fades even between mousemove events
  mouse.vX *= 0.9;
  mouse.vY *= 0.9;
  dataTexture.needsUpdate = true;
}
```
- The brush is a soft disc of radius `6.25` cells; cells right under the cursor get the strongest
  push (`power` up to 10), cells at the edge get almost none.
- Two decays stack to make the "spring-back" feel: the stored field decays `0.925`/frame and the
  input velocity decays `0.9`/frame. Together, a fast swipe drags a smear that snaps back over
  roughly half a second after the cursor stops.

### Resize
```js
window.addEventListener("resize", () => {
  width = hero.offsetWidth;
  height = hero.offsetHeight;

  mesh.geometry.dispose();
  mesh.geometry = new THREE.PlaneGeometry(...getCoverScale());

  dataTexture.dispose();
  dataTexture = createDataTexture();                       // grid re-derived from new aspect
  material.uniforms.uDataTexture.value = dataTexture;

  renderer.setSize(width, height);
});
```

### Render loop
```js
renderer.setAnimationLoop(() => {
  updateDataTexture();
  renderer.render(scene, camera);
});
```
No `requestAnimationFrame` bookkeeping, no delta-time — the constants are tuned per-frame at ~60fps.

## Assets / images
- **1 full-bleed background image** — a **motion-blurred editorial/fashion photograph** (`hero-image.jpg`),
  roughly **16:9 landscape**, used as the single cover-fit texture for the shader plane. The real subject
  is a **cropped human figure caught mid-movement**: a bare shoulder and arm (warm skin tone) draped in
  layers of sheer, gauzy fabric — cream/off-white cloth below and translucent grey tulle sweeping across
  the upper body — against a soft, out-of-focus background. Dominant colors are **muted and desaturated:
  cool greys and slate, cream/ivory whites, and warm skin beige**, with a visible **film-grain / soft-focus**
  quality throughout. This kind of imagery works well because the built-in blur and grain, combined with
  the high-contrast fabric folds and skin edges, make the chromatic fringing and local UV smear read
  clearly. It is cover-fit and cropped, so exact aspect is not critical (anything from ~3:4 portrait to
  ~16:9 landscape is fine). Any strong, detailed photo will show the effect. No logos, no text baked in.

## Behavior notes
- **Desktop, pointer-driven.** With no cursor movement the hero shows the plain, undistorted image;
  the warp exists only while (and shortly after) the pointer sweeps across it. There is no autoplay,
  no idle animation, nothing scroll-triggered.
- The animation loop runs continuously (forever), but at rest it re-renders an all-zero field, so
  the picture is static until the mouse moves.
- The grid resolution scales with viewport aspect; the influence radius and strengths are in
  grid-cell units, so the effect feels consistent across sizes.
- `pixelRatio` is capped at 2 for performance. There is no reduced-motion branch and no touch
  handler in the original — on touch devices the image simply sits undistorted.
- Requires WebGL. `NearestFilter` on the DataTexture (blocky cells) and `LinearFilter` on the image
  texture (smooth photo) are both intentional and non-optional to the look.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/grid-deformation-effect/hero-image.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-deep`, `--paper`, `--paper-dim`, `--line`, `--ch-red`, `--ch-cyan`, `--font-display`, `--font-mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair built to survive being re-invoked by this catalogue's editor runtime (`window.MP.register`): one call builds the scene, the shader plane, the `DataTexture` grid and the three DOM listeners (`mousemove`, `touchmove`, `resize`), and the function it returns tears every one of them down, including the GPU resources. That shape is close to a React effect already, but it is not one — `mount`/`destroy` were written for one external caller re-triggering them on a knob change, not for React's own remount timing. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Call `mount()` without returning its `destroy` as the effect's own cleanup, and the second mount finds the first `renderer.setAnimationLoop` still ticking, a second `<canvas class="hero-canvas">` stacked on the first inside `.hero`, and two `mousemove` listeners both writing into two different `mouse` closures. It will not reproduce in a production build, because only development does the double mount — treat the returned `destroy()` as the effect's cleanup itself, not as something the effect calls in addition to its own teardown.

*(1) The entry point* — the script checks `document.readyState` before deciding whether to wait for `DOMContentLoaded`, exactly the `dcl-guarded` shape. That guard exists so the module survives being parsed after the page has already reached `DOMContentLoaded`, in a plain document; `useEffect` never faces that race, because it always runs after the DOM is committed. Drop the `if (document.readyState === "loading")` branch, the `window.MP` branch beside it, and the `boot` wrapper — none of them have a role once a real component lifecycle is calling this — and call `mount({ ...DEFAULTS })` directly inside a `useEffect` with an empty dependency array, keeping the `destroy` it returns as that effect's cleanup function.

*(2) Element lookups* — `mount` resolves exactly two elements up front, `document.querySelector(".hero")` and `document.querySelector(".hero-video")`, and every later measurement reads through them: `hero.offsetWidth`/`offsetHeight` seed `width`/`height`, `hero.getBoundingClientRect()` turns every pointer event into the 0–1 `mouse.x`/`mouse.y` pair, and `video.naturalWidth`/`naturalHeight` drive `getCoverScale()`. Give the component a root ref standing in for `.hero`, render the `<img>` inside it with its own ref standing in for `.hero-video`, and resolve both from those refs instead of the document. During the StrictMode remount two copies of this subtree exist for an instant, and an unscoped `querySelector` can bind to the `<img>` that is on its way out — which would silently point `getCoverScale()` at a node whose `naturalWidth` is about to become unreliable.

*(3) Cleanup* — the texture load is the one asynchronous continuation in this file, and it already carries the guard the async-safety rule above asks for: `new THREE.TextureLoader().load(url, (texture) => { if (destroyed) texture.dispose(); })`. A StrictMode unmount can land while that file is still in flight, and without the flag the callback would call `.dispose()` on nothing (harmless here only because the callback body has no other side effect) or, in a version of this pattern that also assigned the loaded texture into a live uniform, write into a `material` the cleanup has already disposed. Keep `destroyed` (or rename it to whatever this codebase's convention is) and keep checking it first thing inside the loader callback — do not assume removing the `resize`/`mousemove`/`touchmove` listeners in cleanup is enough, since the texture callback is not a listener the cleanup removes, it is a promise-like callback already queued.

*(4) Rendering this in `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19. There is no `.glb` here, so there is no `GLTFLoader`/`useGLTF` swap; the loaded asset is the same `hero-image.jpg` the `<img>` already points at, fed into a `THREE.TextureLoader`. Prefer drei's `useTexture(url)` (or `useLoader(TextureLoader, url)` from `@react-three/fiber`) over the manual loader-plus-`destroyed`-flag pair: both suspend the component until the image has decoded, which removes the `loadeddata` listener and its geometry-rebuild callback entirely — by the time your component body runs, `texture.image.width`/`height` are already real numbers, so `getCoverScale()` can read them on the first render instead of waiting for an event that fires after the fact.

`<Canvas>` replaces the `WebGLRenderer`/`Scene` block, but not the camera as-is: this shader plane is drawn through an **orthographic** camera framing an exact 2×2 world (`new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)`, `z` at `1`), not `<Canvas>`'s default perspective camera. Declare `<OrthographicCamera makeDefault left={-1} right={1} top={1} bottom={-1} near={0.1} far={10} position={[0, 0, 1]} />` from drei (or pass an equivalent `camera` prop to `<Canvas>`) so `getCoverScale()`'s `2 * scaleX` / `2 * scaleY` math keeps meaning what it means here — that math is derived from this camera's frustum being exactly 2 units tall and wide, and it silently stops covering correctly under any other camera.

`renderer.setAnimationLoop` becomes `useFrame`: move `updateDataTexture()`'s body into the `useFrame` callback verbatim, but drop the trailing `renderer.render(scene, camera)` — `<Canvas>` already renders the scene it owns once per frame by default. Do not reach for `frameloop="demand"` here the way a scroll-driven scene might: the relaxation decay means the field keeps evolving (and the canvas keeps needing a redraw) for a beat after the pointer stops, so this component genuinely needs the continuous default loop, not an invalidate-on-event one.

The `mouse` bookkeeping object (`x`, `y`, `prevX`, `prevY`, `vX`, `vY`) and the `dataTexture`/`gridX`/`gridY` triple must live in `useRef`s, not `useState` — both are rewritten on every pointer event and every single frame, and routing either through `setState` would re-render the component tree at pointer- and frame-rate for values nothing in JSX ever reads. Since `<Canvas>` unifies mouse and touch into one Pointer Events stream, `onPointerMove` on the mesh (or on the `<Canvas>` element itself) replaces the separate `mousemove` **and** `touchmove` listeners — the `event.touches[0]` branch this script needs for touch devices has no equivalent to write, because a synthetic pointer event already carries `clientX`/`clientY` regardless of input device.

The geometry and the `DataTexture` are hand-built (`new THREE.PlaneGeometry(...)`, `new Float32Array(...)` wrapped in `new THREE.DataTexture(...)`), so R3F will not dispose them for you — build them in a `useMemo`/`useRef`, and call `.dispose()` on the outgoing geometry and the outgoing `DataTexture` yourself. That has to happen in **two** places here, not just on unmount: this component already disposes and rebuilds both mesh geometry and the grid texture on every resize (a `PlaneGeometry` sized by `getCoverScale()`, a `DataTexture` whose `gridX`/`gridY` depend on the aspect ratio), so the resize path needs the same manual dispose-then-replace, driven off the `size` `useThree()` reports rather than a `window` resize listener — `<Canvas>` already tracks its own container, but it has no way to know this scene's geometry and grid resolution are aspect-dependent. After swapping in a new `DataTexture`, write it into `materialRef.current.uniforms.uDataTexture.value` imperatively, the same direct assignment the vanilla code does — a `<shaderMaterial>` JSX re-render will not detect that a uniform's `value` object changed identity underneath it.

A poster is mandatory, and this component already ships one for free: the `<img>` itself is the full-resolution photo, visible until JS runs. The vanilla script hides it (`video.style.opacity = "0"`) the instant `mount()` starts, before the texture has finished loading — so on a slow connection there is a real gap where the `<img>` has already vanished and the shader plane has nothing to sample yet. Do not port that timing: keep the `<img>` visible until the texture backing the shader has actually resolved (the same `useTexture`/`useLoader` suspense boundary above), then flip it to hidden. That is a correction on the original, not an embellishment — the poster this component needs was already sitting in the DOM, just released one step too early.

Skip drei's `Environment` regardless of preset temptation: the entire visual is one `ShaderMaterial` sampling `uTexture`/`uDataTexture` directly in the fragment shader, with no `MeshStandardMaterial`, no normals-dependent lighting, and no reflection anywhere in this pipeline. An `Environment` would have literally nothing to feed and nothing here would look any different with or without one — the chromatic-aberration/UV-displacement look is entirely a function of the two textures and the constants above, not of scene lighting.
