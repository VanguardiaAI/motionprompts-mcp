---
slug: threejs-video-gallery
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Framecast — 3D Curved Video Wall (Three.js)

## Goal
Build a full-viewport, white WebGL scene: a **7×7 grid of 49 flat planes**, each textured with a **looping muted video**, bent into a **parabolic wall** that curves back toward the viewer on both the horizontal and vertical axes (a shallow satellite-dish / IMAX-screen shape). As the user **moves the mouse**, the whole wall reacts: every plane gets independent **parallax + gentle sinusoidal oscillation**, the **camera eases its `lookAt` target** around so the wall appears to turn, and a fixed CSS-3D headline ("FRAMECAST") **tilts in 3D** like a card catching the light. A small lime nav badge ("FRAMES 2024") floats top-center. This is a pure Three.js piece — **no GSAP at all**; all motion lives in a `requestAnimationFrame` loop driven by mouse position through eased/`lerp`-style interpolation.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`three` (npm) only** — no GSAP, no Lenis. (`lil-gui` is imported for an optional debug panel that is disabled by default; you can omit it entirely.) Import:
```js
import * as THREE from "three";
// optional, debug only: import GUI from "lil-gui";
```

## Layout / HTML
Almost empty — the canvas is injected by JS into `<body>`:
```html
<body>
  <nav><p>Frames 2024</p></nav>
  <div class="header"><h1>Framecast</h1></div>
  <script type="module" src="./script.js"></script>
</body>
```
JS appends the WebGL `<canvas>` (`renderer.domElement`) directly to `document.body`.

## Styling
Minimal — the video wall is the whole show; the two DOM overlays sit above it on `z-index: 2`.
- Global reset `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `html, body { width: 100%; height: 100%; background-color: #fff; overflow: hidden; }` — page never scrolls; the white backdrop matches the renderer clear color.
- `canvas { position: fixed; top: 0; left: 0; }` — full-bleed, pinned behind the overlays.
- `nav { position: fixed; top: 0; left: 0; width: 100vw; padding: 2em; display: flex; justify-content: center; z-index: 2; }` — centered strip at the very top.
- `nav p` — the lime badge: `text-transform: uppercase; font-family: "Akkurat Trial TT"; font-size: 12px; font-weight: 600; padding: 4px; background-color: #d4f70c;` (chartreuse/lime green — the one accent color) plus `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`. Declare the family name **exactly as written, with no generic fallback keyword** — the "Akkurat Trial TT" webfont is never actually loaded, so the browser falls back to its **default serif**. At 12px uppercase the serif-vs-sans difference is subtle, but do **not** append `, sans-serif` (that would visibly diverge from the original).
- `.header { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; transform-style: preserve-3d; perspective: 1000px; will-change: transform; z-index: 2; }` — the 3D-tiltable headline wrapper, dead-center. The `perspective` here is what makes the JS-driven `rotateX/rotateY/translateZ` read as real 3D.
- `h1 { text-transform: uppercase; font-family: "Cy Grotesk"; font-size: 7.5vw; letter-spacing: -0.025em; line-height: 1; transform-style: preserve-3d; backface-visibility: hidden; }` — one huge word in black (default text color). **CRITICAL font detail (this is what the reproduction must match):** the CSS names `"Cy Grotesk"` **with NO generic fallback keyword**, and that webfont is **never loaded**. So the browser drops all the way to its **default serif**, and on screen "FRAMECAST" reads as a **heavy SERIF / Didone-style display face** — *not* a sans/grotesk. Reproduce that look exactly: set `font-family: "Cy Grotesk";` verbatim and **do NOT append `, sans-serif`** (or any generic keyword). If you cannot rely on the browser default, target a heavy serif (e.g. a Times/Didone-style face) — never a grotesk sans. The name "Cy Grotesk" describes the font the original author *intended*, not what actually renders.

## Three.js effect (the important part — be exhaustive)

### Config params (exact values)
```js
const params = {
  rows: 7,
  columns: 7,
  curvature: 5,          // horizontal parabola tightness
  spacing: 10,           // world-unit gap between plane centers (both axes)
  imageWidth: 7,         // plane geometry width
  imageHeight: 4.5,      // plane geometry height (~14:9 landscape)
  depth: 7.5,            // parabola depth divisor
  elevation: 0,          // vertical world offset applied to y
  lookAtRange: 20,       // how far the camera target swings with the mouse
  verticalCurvature: 0.5 // how much rows tilt/recede top & bottom
};
```

### Scene / camera / renderer
- `scene = new THREE.Scene()` — no lights (unlit `MeshBasicMaterial`).
- `camera = new THREE.PerspectiveCamera(25, innerWidth / innerHeight, 0.1, 1000)` — a **long 25° lens** (flattens perspective, cinematic). `camera.position.set(0, 0, 40)`.
- Renderer:
```js
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);   // white backdrop
document.body.appendChild(renderer.domElement);
```

### Curved-wall geometry (exact math — this defines the shape)
For each cell `row` (0…6) × `col` (0…6), compute a base position and base rotation.

**Position** `calculatePosition(row, col)`:
```js
let x = (col - params.columns / 2) * params.spacing;   // centered horizontally
let y = (row - params.rows / 2) * params.spacing;      // centered vertically

// horizontal parabola: planes farther from center X are pushed toward the camera
let z = (x * x) / (params.depth * params.curvature);

// vertical curvature: top & bottom rows recede with a signed square curve
const normalizedY = y / ((params.rows * params.spacing) / 2);   // -1 … 1
z += Math.abs(normalizedY) * normalizedY * params.verticalCurvature * 5;

y += params.elevation;   // 0 here
```

**Rotation** `calculateRotations(x, y)` — each plane is angled to stay roughly tangent to the curved wall so it faces the viewer:
```js
const a       = 1 / (params.depth * params.curvature);
const slopeY  = -2 * a * x;              // derivative of the horizontal parabola
const rotationY = Math.atan(slopeY);     // yaw: columns turn to face center

const maxYDistance = (params.rows * params.spacing) / 2;
const normalizedY  = y / maxYDistance;
const rotationX    = normalizedY * params.verticalCurvature;   // pitch: rows tilt
```
Return `{ x, y, z, rotationX, rotationY }`. Set `plane.position.set(x, y, z)`, `plane.rotation.x = rotationX`, `plane.rotation.y = rotationY` (base `rotation.z = 0`).

### The video pool (exact paths — do NOT invent placeholder paths)
Declare a pool of **10** clips using these **exact source paths** (the fixtures are served from `/c/threejs-video-gallery/`):
```js
const videos = [
  { name: "/c/threejs-video-gallery/v1.mp4" },
  { name: "/c/threejs-video-gallery/v2.mp4" },
  { name: "/c/threejs-video-gallery/v3.mp4" },
  { name: "/c/threejs-video-gallery/v4.mp4" },
  { name: "/c/threejs-video-gallery/v5.mp4" },
  { name: "/c/threejs-video-gallery/v6.mp4" },
  { name: "/c/threejs-video-gallery/v7.mp4" },
  { name: "/c/threejs-video-gallery/v8.mp4" },
  { name: "/c/threejs-video-gallery/v9.mp4" },
  { name: "/c/threejs-video-gallery/v10.mp4" },
];
```
Use these literal `/c/threejs-video-gallery/vN.mp4` paths — **`.mp4` extension, absolute-from-root scheme**. Do **not** substitute `./videos/N.mp4` or any invented placeholder: if the paths are wrong the textures 404 and **the whole wall collapses to solid black rectangles**, which is the single worst failure mode for this piece (the video wall *is* the entire visual payload). The clips must actually load and play — a wall of black planes is a broken reproduction, not an acceptable one.

### Video-textured planes (one mesh per cell)
For each cell, `createImagePlane(row, col)`:
```js
const videoData = videos[Math.floor(Math.random() * videos.length)]; // random from the pool of 10, repeats fine
const geometry  = new THREE.PlaneGeometry(params.imageWidth, params.imageHeight);

const video = document.createElement("video");
video.src = videoData.name;
video.crossOrigin = "anonymous";
video.loop = true;
video.muted = true;          // required for autoplay
video.playsInline = true;
video.play().catch(() => {});

const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;

// ANTI-BLACK FALLBACK (required): a plane must NEVER render as solid black.
// Start the material with a visible fallback COLOR and only swap in the video
// texture once the clip is confirmed playing. If the clip 404s / errors / never
// buffers, the plane stays a solid non-black color instead of a black rectangle.
const material = new THREE.MeshBasicMaterial({
  color: 0xdddddd,           // light-grey poster fallback (any visible, non-black tone)
  side: THREE.DoubleSide,    // planes on the far edges are visible from behind too
});
const showVideo = () => {
  material.map = videoTexture;
  material.color.set(0xffffff); // white so the video texture shows at true color (map * color)
  material.needsUpdate = true;
};
video.addEventListener("loadeddata", showVideo);
video.addEventListener("playing", showVideo);
// on error, do nothing — the grey fallback color remains, never black.

const plane = new THREE.Mesh(geometry, material);
```
The point of the fallback: with `MeshBasicMaterial`, a `map` bound to a video that never loads samples as **black** (black × any color = black), so you cannot just set a color alongside a broken map. Instead keep the map **off** until `loadeddata`/`playing` fires, so an unloaded/failed plane shows the grey poster color and a loaded plane shows its live video. The correct, faithful result is **live video on every plane**; the grey is only a safety net so a fixture hiccup degrades to visible grey rectangles rather than a dead black grid.
Place it with `calculatePosition`, then stash per-plane **random** animation seeds in `plane.userData`:
```js
plane.userData.basePosition   = { x, y, z };
plane.userData.baseRotation   = { x: rotationX, y: rotationY, z: 0 };
plane.userData.parallaxFactor = Math.random() * 0.5 + 0.5;              // 0.5 … 1.0
plane.userData.randomOffset   = {                                       // each -1 … 1
  x: Math.random() * 2 - 1,
  y: Math.random() * 2 - 1,
  z: Math.random() * 2 - 1,
};
plane.userData.rotationModifier = {
  x: Math.random() * 0.15 - 0.075,   // -0.075 … 0.075
  y: Math.random() * 0.15 - 0.075,
  z: Math.random() * 0.2  - 0.1,     // -0.1 … 0.1
};
plane.userData.phaseOffset = Math.random() * Math.PI * 2;              // desync the oscillation
plane.userData.video       = video;
```
`updateGallery()` clears any existing planes (pause + remove each `userData.video`, `scene.remove`), then builds the full `rows × columns` grid and pushes every mesh to an `images[]` array and `scene.add`s it. Call it once at startup.

### Mouse tracking (the only input)
```js
let mouseX = 0, mouseY = 0;        // normalized -1 … 1, updated on mousemove
let targetX = 0, targetY = 0;      // eased followers of mouseX/Y
const lookAtTarget = new THREE.Vector3(0, 0, 0);

// header CSS-3D drivers
let headerRotationX = 0, headerRotationY = 0, headerTranslateZ = 0;

document.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX - innerWidth  / 2) / (innerWidth  / 2);   // -1 (left)  … 1 (right)
  mouseY = (e.clientY - innerHeight / 2) / (innerHeight / 2);   // -1 (top)   … 1 (bottom)
  headerRotationX = -mouseY * 30;                 // pitch headline up to ±30°
  headerRotationY =  mouseX * 30;                 // yaw   headline up to ±30°
  headerTranslateZ = Math.abs(mouseX * mouseY) * 50; // push headline toward viewer in the corners
});
```

### Render loop `animate()` (rAF, runs every frame)
1. **Headline (CSS-3D, not WebGL)** — write a transform string and let a CSS transition smooth it:
```js
header.style.transform = `
  translate(-50%, -50%)
  perspective(1000px)
  rotateX(${headerRotationX}deg)
  rotateY(${headerRotationY}deg)
  translateZ(${headerTranslateZ}px)`;
header.style.transition = "transform 0.5s cubic-bezier(0.215, 0.61, 0.355, 1)";
```
(The `easeOutCubic` bezier `0.215, 0.61, 0.355, 1` gives the headline its smooth, slightly lagging tilt.)

2. **Ease the camera target** toward the mouse (`lerp` factor **0.05** — slow, floaty catch-up):
```js
targetX += (mouseX - targetX) * 0.05;
targetY += (mouseY - targetY) * 0.05;

lookAtTarget.x = targetX * params.lookAtRange;   // ±20
lookAtTarget.y = -targetY * params.lookAtRange;  // inverted so up-mouse looks up
lookAtTarget.z = (lookAtTarget.x * lookAtTarget.x) / (params.depth * params.curvature); // ride the parabola
```

3. **Per-plane parallax + oscillation** — for every plane, with `time = performance.now() * 0.001`:
```js
const mouseDistance = Math.sqrt(targetX * targetX + targetY * targetY); // 0 at center
const parallaxX = targetX * parallaxFactor * 3 * randomOffset.x;
const parallaxY = targetY * parallaxFactor * 3 * randomOffset.y;
const oscillation = Math.sin(time + phaseOffset) * mouseDistance * 0.1;  // idle wobble, scaled by how far the mouse is from center

// position drifts from its base
plane.position.x = basePosition.x + parallaxX + oscillation * randomOffset.x;
plane.position.y = basePosition.y + parallaxY + oscillation * randomOffset.y;
plane.position.z = basePosition.z + oscillation * randomOffset.z * parallaxFactor;

// rotation drifts from its base
plane.rotation.x = baseRotation.x + targetY * rotationModifier.x * mouseDistance + oscillation * rotationModifier.x * 0.2;
plane.rotation.y = baseRotation.y + targetX * rotationModifier.y * mouseDistance + oscillation * rotationModifier.y * 0.2;
plane.rotation.z = baseRotation.z + targetX * targetY * rotationModifier.z * 2 + oscillation * rotationModifier.z * 0.3;
```
Key behaviors that fall out of this math: when the mouse sits dead-center, `mouseDistance ≈ 0`, so the oscillation and the parallax nearly vanish — the wall settles almost perfectly still. The farther the mouse strays, the more each plane both parallax-shifts (by its own random amount/direction) and gently sways out of phase, giving the wall a living, shimmering depth.

4. `camera.lookAt(lookAtTarget)` then `renderer.render(scene, camera)`; `requestAnimationFrame(animate)`.

Kick off with `updateGallery(); animate();`.

### Resize handler
On `window.resize`: `camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight)`.

## Assets / videos
A pool of **10 short, silent, seamlessly-looping video clips** served at **`/c/threejs-video-gallery/v1.mp4` … `/c/threejs-video-gallery/v10.mp4`** (absolute-from-root paths — see the exact array above). Keep them **web-weight**: h264, 1280px wide, no audio, `+faststart`, around 0.5–1.5 MB each. The demo originally shipped 1080p ProRes-bitrate `.mov` files (96 MB for the ten) and opening the page cost 182 MB — the wall looks identical at a tenth of that, and forty-nine planes share only ten decoders. Landscape orientation (roughly 14:9 to fit the 7 × 4.5 planes without obvious cropping), editorial / cinematic subject matter — motion textures, b-roll, moody film-like footage. They are interchangeable: each of the 49 planes picks one at random, so repeats across the grid are expected and fine. All must be `muted` + `playsInline` so browsers allow autoplay.

**Each plane MUST be textured with an actually-loading, looping, muted clip — this is non-negotiable.** The playing videos are the entire visual payload; if they don't load, the composition is nothing but black (or grey-fallback) rectangles.
- Use the exact `.mp4` paths above; a wrong extension or scheme 404s every clip.
- Apply the **anti-black fallback** from `createImagePlane`: while a clip buffers, or if it fails to load, the plane shows a **visible non-black color (or a poster frame)** — never solid black. A grid of solid-black planes is a failed reproduction.
- If genuinely fewer clips are available, reduce the pool and repeat; a handful still reads correctly since placement is random — but they must be **real, loading** clips, not placeholder paths.

## Behavior notes
- **Interaction only** — nothing animates on load beyond the videos playing; all wall/camera/headline motion is driven by mouse position. With no mouse movement (or mouse at center) the scene is nearly static.
- **The playing video textures are the wall's only "life" at rest.** Because the wall/camera/headline are frozen until the pointer moves, the *only* thing changing frame-to-frame with the pointer at rest is the video imagery itself. A frame-diff / animation check that never moves the mouse will therefore register motion **only** from the playing clips — which means broken, absent, or black video textures make the whole piece look **dead and static**, and a naive "is it animating?" test will read false. So the videos loading and playing is not just cosmetic; it is what proves the piece is alive. Get the clips loading (exact `.mp4` paths + anti-black fallback) before worrying about anything else.
- **Desktop-oriented and WebGL-heavy**: 49 simultaneous `VideoTexture`s is expensive; the piece assumes a pointer device (no touch/scroll handling) and a capable GPU. No reduced-motion handling in the original.
- No GSAP, no ScrollTrigger, no scroll hijacking — the page itself never scrolls (`overflow: hidden`); the only easing is the hand-rolled `lerp` (factor 0.05) and the CSS transition on the headline.
- The `DoubleSide` material means edge planes that turn away from the camera still show their (mirrored) video on the back — intentional, keeps the curved wall solid-looking from oblique angles.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--muted`, `--accent`, `--hairline`, `--sans`, `--display`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already does most of what a `useEffect` needs: `mount` builds the scene, camera and renderer, decodes the ten shared clips into `videoTexturePool` exactly once, builds the 7×7 grid of video-textured planes, wires up the debug `lil-gui` panel when `DEBUG_MODE` is on, and starts the `animate()` loop that drives the camera's `lookAt`, the per-plane parallax/oscillation, and the `.header` element's CSS-3D tilt. The function `mount` returns walks essentially all of that back. What's missing is the wiring: the file decides for itself when to call `mount`, through two branches — a `window.MP.register` hook for this catalogue's own editor, and a `document.readyState` guard for everyone else — and neither has anything to do with how React schedules effects.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Call `mount()` without wiring its return value up as the effect's cleanup, and the second mount finds the first `animate()` loop, the first injected `<canvas>`, and the first `videoTexturePool` still alive: two rAF loops racing to render two canvases stacked on `document.body`, and two pools each re-decoding all ten clips — twice the decode work the shared pool exists to avoid, now duplicated across mounts instead of across planes. It will not reproduce in a production build, because only development does the double mount.

*(1) The entry point* — delete the `if (window.MP && window.MP.register) { … } else { … }` dispatch at the bottom of the file; both halves belong to the standalone demo page and its editor, not to a React host. The `else` branch's `document.readyState` check exists so the script survives being parsed after `DOMContentLoaded` has already fired in a plain document — a race `useEffect` never hits, since it only runs after the DOM is committed. `mount` already resolves every parameter through its own `num()` helper and a `Math.max` floor, so a missing or malformed prop falls back to `DEFAULTS` field by field; the effect doesn't need to spread `DEFAULTS` itself, it can hand `mount` this component's own props directly:

```jsx
useEffect(() => {
  return mount(props);
}, []);
```

*(2) Element lookups* — the only selector in the file is `document.querySelector(".header")`, used to grab the CSS-3D headline `animate()` tilts every frame, and `renderer.domElement` is appended straight to `document.body` rather than to anything this component owns. Scope the header lookup to a root `ref` (`root.current.querySelector(".header")`) so a StrictMode remount's two live `.header` elements can't cross-bind; append the canvas into that same root instead of `document.body`, so it lives inside this component's own subtree rather than always landing as the last child of `body` — stacked on top of whatever the page mounts after it, including, on a bare remount, this component's own previous canvas.

*(3) Cleanup* — `destroy()` already runs the checklist a React effect needs, in the right order. It flips the `destroyed` flag `animate()` checks before every `requestAnimationFrame(animate)` call and cancels the pending `frameId`, removes the `mousemove`/`resize` listeners, tears down the `lil-gui` panel when `DEBUG_MODE` built one (`gui.destroy()` alone leaves its `<div>` attached to the body — the cleanup removes that node explicitly), and restores `.header`'s original `style` attribute, captured once at mount via `getAttribute("style")` before the loop starts overwriting `transform`/`transition` on it. Only after all of that does it reach for the GPU: disposing each plane's geometry and material, then disposing and unloading the ten shared `videoTexturePool` entries (`texture.dispose()`, pausing the `<video>`, clearing its `src`, calling `load()` to release the decoder) before `renderer.dispose()` and `renderer.forceContextLoss()`. That ordering is deliberate: page-level state (listeners, the injected canvas, the header's inline style) gets undone before GPU state, so a GPU-side throw during teardown can't leave stray listeners or a mutated header behind. Preserve it — return `destroy` itself as the effect's cleanup rather than re-deriving these steps, and don't reorder them.

*(4) Mapping to `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

`<Canvas camera={{ fov: 25, near: 0.1, far: 1000, position: [0, 0, 40] }}>` replaces the `WebGLRenderer`/`Scene`/`PerspectiveCamera` block outright. This whole material stack is unlit — `MeshBasicMaterial` everywhere, no lights in the scene at all — so `renderer.setClearColor(0xffffff)` is the only thing painting the white backdrop; carry it over as `<color attach="background" args={["white"]} />` inside the scene, or leave the canvas transparent over the page's own white background, as long as something still paints white behind the planes.

`animate()` splits along a real seam. The per-plane parallax/oscillation math and `camera.lookAt(lookAtTarget)` belong inside a `useFrame` callback, reading and writing through a `ref` per `<mesh>` instead of the mutable `images` array this version walks by hand. The `.header` tilt is different in kind: `headerRotationX`, `headerRotationY` and `headerTranslateZ` are already computed once per `mousemove` event, not per frame — `animate()` merely re-writes the same `header.style.transform` string on every rendered frame regardless of whether the mouse has moved since. That write touches a plain DOM node outside anything the `<Canvas>` draws, so keep it out of `useFrame` entirely: do it directly inside the `mousemove` handler, since the CSS `transition` on `.header` supplies the easing, not the write frequency. Routing those three numbers through component state instead of a ref would re-render the component on every mouse move for values only ever read by an inline style. Do not start a `requestAnimationFrame` loop of your own inside the `Canvas` for the wall itself — `useFrame` already runs once per rendered frame.

There is no `GLTFLoader` here — the loaded asset is the ten shared clips, not a model — so `useGLTF` doesn't apply. Keep one `<video>` per `videoTexturePool` entry, off-canvas or held in a ref exactly as today, and build its `VideoTexture` once with `useMemo`; hand that same texture instance to every `<mesh>` randomly assigned it at creation. The pooling that already keeps this piece from decoding forty-nine copies of ten clips carries over unchanged — it just moves from a module-level array to a hook.

Resize handling is already done: `<Canvas>` observes its own container, so the manual `resize` listener, `camera.updateProjectionMatrix()`, and `renderer.setSize(...)` calls all go away. Whatever is still built by hand — the `PlaneGeometry`s, the `MeshBasicMaterial`s — should move to `<planeGeometry args={[...]} />` / `<meshBasicMaterial map={texture} />` declared per mesh, so R3F disposes the geometry and material on unmount; the shared `VideoTexture`s and their `<video>` elements remain yours to dispose explicitly, the same way `destroy()` does today.

**A static poster is mandatory, not a nicety.** Forty-nine planes competing to buffer ten video sources on a cold visit is exactly the load this rule exists for. Render a poster in the same box the `<Canvas>` occupies and swap it out once enough of the pool's videos have actually started playing to read as a wall of live footage — not the instant the component mounts.

**Do not use drei's `Environment` with a preset.** This wall has no lights at all — every plane is an unlit `MeshBasicMaterial`, by design, so the parabola reads as a flat, evenly-lit surface rather than a shaded 3D object. Reaching for `<Environment preset="…">` to give the R3F port some default lighting would both change the look and wire the component to a third-party CDN it has no use for; leave the scene unlit, matching the original.
