# Pixelated Text Hover Shaders — full-viewport wordmark

## Goal
Build a full-viewport white hero showing one huge, thin lowercase wordmark centered on screen. The wordmark is **not DOM text** — it is painted to an offscreen 2D canvas and used as a texture on a full-screen Three.js plane rendered through a **custom fragment shader**. The star effect: as the cursor moves across the wordmark, the shader quantizes the image into a **40×40 grid of square cells** and, in a soft radius around the cursor, **shoves each cell's texture sample in the direction the mouse is travelling** — producing a chunky, blocky, pixelated "smear" that ripples off the cursor and eases back to rest when the mouse stops or leaves. All motion is a hand-written `requestAnimationFrame` lerp feeding two shader uniforms; **there is no GSAP and no scroll**.

## Tech
Vanilla HTML/CSS/JS with an ES-module entry (`<script type="module">`). **No animation library at all — no GSAP, no Lenis.** The only dependency is Three.js. Import it as:
```js
import * as THREE from "three";
```
The whole effect is: one WebGL `ShaderMaterial` on a 2×2 plane under an orthographic camera, a canvas-generated text texture, and a raw rAF loop that eases a mouse position each frame and writes it to the shader. Runs in a fresh Vite project with `three` as the only npm dep.

## Layout / HTML
The body is essentially empty — a single container the renderer's `<canvas>` is appended into:
```html
<body>
  <div id="textContainer"></div>
  <script type="module" src="./script.js"></script>
</body>
```
- `#textContainer` is the mount point. JS does `document.getElementById("textContainer")`, builds the Three.js renderer, and appends `renderer.domElement` into it.
- No headings, no images, no other markup. Everything visible is WebGL.

## Styling
Font: import a thin display face at the top of the CSS. This uses **Jost** at weight **100** (a light geometric sans, Google Fonts — circular bowls, single-storey `a`):
```css
@import url("https://fonts.googleapis.com/css2?family=Jost:wght@100&display=swap");
```
- `body, html`: `margin:0; padding:0; width:100%; height:100%; overflow:hidden; background-color:#ffffff; font-family:"Jost", sans-serif;`
- `#textContainer`: `position:absolute; width:100%; height:100%; overflow:hidden;`
- `canvas`: `position:absolute; top:45%; left:50%; transform:translate(-50%,-50%); display:block; width:100%; height:100%;` — note the canvas is centered at **45%** vertically (slightly above true center), not 50%.

Palette is deliberately minimal:
- Page background: white `#ffffff`.
- Text fill + stroke color (inside the canvas texture): near-black `#1a1a1a`.
- Renderer clear color: white `0xffffff`.

There are no CSS-styled type elements — the only "typography" is the wordmark drawn onto the offscreen canvas (see below).

## The wordmark texture (`createTextTexture` — reproduce exactly)
A helper builds a `THREE.CanvasTexture` from a 2D canvas. This is what the shader samples.

`createTextTexture(text, font, size, color, fontWeight = "100")`:
1. Create a `<canvas>` sized to **twice the viewport**: `canvasWidth = window.innerWidth * 2`, `canvasHeight = window.innerHeight * 2`.
2. Fill the whole canvas with the background color (`color`, passed as `"#ffffff"`) via `fillRect`.
3. `fontSize = size || Math.floor(canvasWidth * 2)` — deliberately gigantic; it gets scaled down in step 6.
4. Set text style: `ctx.fillStyle = "#1a1a1a"`, `ctx.font = \`${fontWeight} ${fontSize}px "${font}"\`` (fontWeight `"100"`, font `"Jost"`), `textAlign:"center"`, `textBaseline:"middle"`, `imageSmoothingEnabled = true`, `imageSmoothingQuality = "high"`.
5. Measure the text: `textWidth = ctx.measureText(text).width`.
6. Compute a fit transform:
   - `scaleFactor = Math.min(1, (canvasWidth * 1) / textWidth)` — shrink the huge glyphs so the word spans the canvas width.
   - `aspectCorrection = canvasWidth / canvasHeight` (= viewport aspect ratio).
   - `ctx.setTransform(scaleFactor, 0, 0, scaleFactor / aspectCorrection, canvasWidth/2, canvasHeight/2)` — horizontal scale `scaleFactor`, vertical scale `scaleFactor / aspectCorrection` (squashes vertically to compensate for the wide viewport), origin recentered to the canvas middle.
7. Thicken the thin weight-100 glyphs by stroking before filling: `ctx.strokeStyle = "#1a1a1a"`, `ctx.lineWidth = fontSize * 0.005`, then **`strokeText(text, 0, 0)` three times** in a loop, then `ctx.fillText(text, 0, 0)`.
8. `return new THREE.CanvasTexture(canvas);`

The demo word is a short lowercase wordmark (~5 letters). Use a neutral placeholder such as **`lumen`** — any short lowercase word works; do not use a real brand name.

## Scene setup (`initializeScene`)
- `scene = new THREE.Scene();`
- `aspectRatio = window.innerWidth / window.innerHeight;`
- **Orthographic camera** (full-screen quad rig): `new THREE.OrthographicCamera(-1, 1, 1/aspectRatio, -1/aspectRatio, 0.1, 1000)`; `camera.position.z = 1`. (Left/right are fixed at ±1; top/bottom are ±1/aspectRatio, so on a landscape viewport the 2×2 plane overflows top and bottom and is cropped.)
- Uniforms:
  ```js
  {
    u_mouse:     { type: "v2", value: new THREE.Vector2() },
    u_prevMouse: { type: "v2", value: new THREE.Vector2() },
    u_texture:   { type: "t",  value: texture },
  }
  ```
- `planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader }))`; `scene.add(planeMesh)`.
- `renderer = new THREE.WebGLRenderer({ antialias: true })`; `renderer.setClearColor(0xffffff, 1)`; `renderer.setSize(window.innerWidth, window.innerHeight)`; `renderer.setPixelRatio(window.devicePixelRatio)`; append `renderer.domElement` into `#textContainer`.

Initialize once at load: `initializeScene(createTextTexture(WORDMARK, "Jost", null, PAPER, "100"))`, where `WORDMARK` is the string `"raster"` and `PAPER` the paper colour.

## The shaders (be exhaustive — this is the whole effect)

**Vertex shader** (passthrough, exposes UVs):
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**Fragment shader** — the pixelated cursor smear. Reproduce every constant:
```glsl
varying vec2 vUv;
uniform sampler2D u_texture;
uniform vec2 u_mouse;
uniform vec2 u_prevMouse;

void main() {
  // 1) Quantize UV space into a 40x40 grid of cells
  vec2 gridUV = floor(vUv * vec2(40.0, 40.0)) / vec2(40.0, 40.0);
  vec2 centerOfPixel = gridUV + vec2(1.0/40.0, 1.0/40.0);

  // 2) Direction the mouse is currently travelling (this frame's delta)
  vec2 mouseDirection = u_mouse - u_prevMouse;

  // 3) Per-cell falloff around the cursor
  vec2 pixelToMouseDirection = centerOfPixel - u_mouse;
  float pixelDistanceToMouse = length(pixelToMouseDirection);
  float strength = smoothstep(0.3, 0.0, pixelDistanceToMouse); // 1 at cursor, 0 beyond 0.3 UV

  // 4) Displace the sample, quantized per cell -> blocky smear
  vec2 uvOffset = strength * -mouseDirection * 0.4;
  vec2 uv = vUv - uvOffset;

  vec4 color = texture2D(u_texture, uv);
  gl_FragColor = color;
}
```

**Why it looks pixelated (the critical mechanism):** `strength` and the offset are derived from `centerOfPixel`, which is **constant across all fragments inside one 40×40 cell** (it is `floor()`-quantized). So every fragment in a given cell shares the exact same `uvOffset`, and the whole cell shifts as one block. The `smoothstep(0.3, 0.0, dist)` makes cells within ~0.3 UV of the cursor displace strongest and fade to zero at the edge of that radius. The offset magnitude is `mouseDirection * 0.4` — proportional to how fast the mouse is moving — so a fast sweep smears hard, a slow crawl barely nudges, and a stationary mouse (`mouseDirection ≈ 0`) leaves the text pristine. Multiplying by `-mouseDirection` pushes the sampled texture *along* the cursor's travel, so the wordmark appears to be dragged and torn in the direction of motion.

## Motion / eased mouse (rAF loop — no GSAP)
State (module scope):
```js
let easeFactor = 0.02;
let mousePosition       = { x: 0.5, y: 0.5 };
let targetMousePosition = { x: 0.5, y: 0.5 };
let prevPosition        = { x: 0.5, y: 0.5 };
```

`animateScene()` runs every frame via `requestAnimationFrame`:
1. Lerp the live mouse toward the target with the current ease factor:
   `mousePosition.x += (targetMousePosition.x - mousePosition.x) * easeFactor;` (same for `.y`).
2. Write to the shader **with Y flipped** (canvas Y-down → GL Y-up):
   `u_mouse.value.set(mousePosition.x, 1.0 - mousePosition.y);`
   `u_prevMouse.value.set(prevPosition.x, 1.0 - prevPosition.y);`
3. `renderer.render(scene, camera);`

Because `u_prevMouse` holds the *previous* target and `u_mouse` chases it with a small ease factor, `mouseDirection = u_mouse - u_prevMouse` in the shader is a smoothly decaying velocity vector — the smear trails behind the cursor and relaxes to zero when input stops.

## Input handlers (attached to `#textContainer`)
Coordinates are normalized against the container's `getBoundingClientRect()`: `x = (clientX - rect.left)/rect.width`, `y = (clientY - rect.top)/rect.height`.

- **`mousemove`**: `easeFactor = 0.035;` then `prevPosition = { ...targetMousePosition };` (snapshot the old target), then set the new `targetMousePosition.x/y` from the normalized cursor. The higher ease (0.035) makes the smear responsive while moving.
- **`mouseenter`**: `easeFactor = 0.01;` and **snap** both live and target to the entry point: `mousePosition.x = targetMousePosition.x = normalizedX;` (same for `.y`). Prevents a whip from wherever the cursor last was.
- **`mouseleave`**: `easeFactor = 0.01;` and `targetMousePosition = { ...prevPosition };` — retarget to the last-but-one position so the wordmark eases back and settles instead of freezing mid-smear.

Exact ease-factor values matter: `0.02` at rest/init, `0.035` while actively moving (snappier), `0.01` on enter/leave (gentle settle).

## Resize (`onWindowResize`)
On `window` `resize`:
- Recompute `aspectRatio = innerWidth / innerHeight`; set `camera.left=-1; camera.right=1; camera.top=1/aspectRatio; camera.bottom=-1/aspectRatio; camera.updateProjectionMatrix();`
- `renderer.setSize(innerWidth, innerHeight);`
- Rebuild the texture at the new size and reassign it: recreate via `createTextTexture(...)` and set `planeMesh.material.uniforms.u_texture.value = newTexture;` (keeps the wordmark crisp after a resize).

## Assets / images
**None.** There are no image files. The only visual is the wordmark, which is generated at runtime by drawing text onto an offscreen 2D canvas and uploading it as a `THREE.CanvasTexture`. Use a neutral lowercase placeholder word (e.g. `lumen`); no logos or brand names.

## Behavior notes
- The scene renders continuously from load (the rAF loop never stops), but with no cursor movement the wordmark is perfectly still and sharp — the distortion only appears where and while the mouse moves over it.
- Pointer-only: the effect is driven by `mousemove`/`mouseenter`/`mouseleave`. Touch devices don't fire these, so the wordmark just sits static; treat this as a desktop-first, GPU-heavy hero (`antialias:true`, full `devicePixelRatio`). No reduced-motion branch in the original.
- No GSAP, no ScrollTrigger, no SplitText — motion is purely the per-frame lerp of a normalized mouse position feeding `u_mouse`/`u_prevMouse`, plus the fragment shader's per-cell displacement.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--accent`, `--muted`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `body, html`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.getElementById`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. This component's own state — `mousePosition`, `targetMousePosition`,
`prevPosition`, `easeFactor` — is mutated in place every frame by `animateScene`, whose render
loop is a self-rescheduling `requestAnimationFrame` that the original never cancels. Two live
copies of that loop means two `renderer.render` calls fighting over the same canvas, and a
`mousePosition` chasing a target that belongs to the instance that was supposed to be gone. The
visible symptom is a smear that never settles, or settles at the wrong speed, and it will not
reproduce in a production build, because React only double-invokes effects in development. Treat
the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — the script runs at the top level, the moment the module is evaluated:
`initializeScene(createTextTexture(...))` builds the renderer against `#textContainer` and
`animateScene()` starts the render loop before any component has rendered, and the
`document.fonts.load(...).then(() => document.fonts.ready).then(() => reloadTexture())` chain
that swaps the fallback-serif glyphs for Jost also starts unconditionally at import time.
None of that belongs at module scope in React — it must move into a `useEffect` with an empty
dependency array. Under `@react-three/fiber` most of it disappears rather than moving, because
`<Canvas>` performs the renderer/scene/camera setup this effect used to do by hand (see below).
What actually survives into the effect is the texture-and-font bookkeeping, not the renderer.

*(2) Element lookups* — `document.getElementById("textContainer")` assumes the component owns
the document, and the listeners it attaches to that element and to `window`
(`mousemove`/`mouseenter`/`mouseleave`, the three `touch...` handlers, the `resize` listener)
assume there is exactly one of it. Under R3F the equivalent surface is the `<Canvas>`'s own
wrapping element: give it a root ref instead of querying by id. You can keep the pointer math as
literal `getBoundingClientRect` arithmetic scoped to that ref, but the better fit is to drop
`handleMouseMove`/`handleMouseEnter`/`handleMouseLeave`'s manual
`(clientX - rect.left) / rect.width` normalization and use R3F's own `onPointerMove` /
`onPointerEnter` / `onPointerLeave` on the full-screen mesh instead: the intersection event
already carries `event.uv`, in the same zero-to-one texture space `vUv` occupies in the fragment
shader, computed by R3F's raycaster — no rect math, no manual Y-flip, because `uv.y` is already
GL-space.

*(3) Cleanup* — two things this script starts are never torn down, and both matter here
specifically:
- **The rAF loop.** `animateScene` reschedules itself with `requestAnimationFrame` and nothing
  ever calls `cancelAnimationFrame` on it. Under R3F this loop is replaced by `useFrame` (below),
  which `<Canvas>` itself starts and stops — but if any part of the mouse-easing math ends up
  driven from a loop of your own outside `useFrame`, keep the handle and cancel it.
- **The font-ready chain.** The `document.fonts.load(...).then(...).then(() => reloadTexture())`
  chain can resolve after a StrictMode unmount. `reloadTexture` reaches for
  `planeMesh.material.uniforms.u_texture.value` — in the React version, either a ref that has
  already been cleared or a mesh that has already been disposed. Guard the `.then` with the same
  cancellation flag the effect's cleanup sets. Do not make the effect callback itself `async`:
  setup must stay synchronous and return a synchronous cleanup, with the font-ready chain started
  inside the effect but not awaited by it.

**Mapping onto @react-three/fiber.** The renderer, scene and orthographic camera stop being
yours to construct: delete `new THREE.WebGLRenderer`, `new THREE.Scene`, and the
`new THREE.OrthographicCamera(-1, 1, 1/aspectRatio, -1/aspectRatio, 0.1, 1000)` block, and
describe the scene as JSX under `<Canvas>`. The one piece of that camera math you cannot drop is
the frustum shape itself: this component deliberately fixes `left`/`right` at ±1 and derives
`top`/`bottom` from the aspect ratio so the 2×2 plane overflows top and bottom on a landscape
viewport — that asymmetric framing is not what R3F's default orthographic camera gives you, so
drive `left`/`right`/`top`/`bottom` on `@react-three/drei`'s `<OrthographicCamera makeDefault>`
yourself, recomputed from `useThree`'s `size` on every resize.

`animateScene`'s body becomes a `useFrame` callback. Keep `mousePosition`, `targetMousePosition`,
`prevPosition` and `easeFactor` in refs, not `useState` — they are written every frame, and
`useState` here would re-render the component on every frame for values that only ever feed a
shader uniform. Build the `uniforms` object once, mirroring the module-scope `shaderUniforms`
object above (a `useMemo` with an empty dependency array is enough), and mutate
`uniforms.u_mouse.value.set(...)` / `uniforms.u_prevMouse.value.set(...)` in place inside
`useFrame`, exactly as `animateScene` does today — replacing the uniforms object on every render
fights `<shaderMaterial>`'s reconciliation instead of just updating the numbers GLSL reads.

There is no `GLTFLoader.load(...)` here to replace with `useGLTF` — this component's only
texture is the one `createTextTexture` paints onto an offscreen 2D canvas, not a loaded asset.
Move that call, and the `reloadTexture` call it shares its drawing logic with, into a
`useEffect`/`useMemo` pair keyed on the container's pixel size, and dispose the outgoing
`CanvasTexture` before assigning the new one: `reloadTexture` currently overwrites
`uniforms.u_texture.value` without calling `.dispose()` on what it replaces, so every resize —
and every StrictMode mount-unmount-mount — leaks one GPU texture.

Resize handling is mostly already done: `<Canvas>` observes its container and resizes the
renderer for you. What it does not do for you is the two things this component's own
`onWindowResize` does beyond that — recomputing the non-default orthographic frustum described
above, and repainting the `CanvasTexture` at the new double-viewport size so the wordmark stays
crisp. Keep both, driven from `useThree`'s `size` rather than `window.innerWidth`/`innerHeight`.

A static poster is warranted here too, though not for the usual heavy-model reason — there is no
glTF asset to stream in. This component's own risk window is the webfont race its code already
exists to paper over: the first paint uses a fallback serif face because Jost has not
loaded yet, and only the `document.fonts.ready` continuation swaps in the correct glyphs via
`reloadTexture`. On a slow connection that fallback frame can hold for a visible stretch. Cover
the canvas with a poster — a static image, or a plain block matching the paper background — until
the font-ready swap has actually happened, instead of letting visitors see the wrong typeface
render first.

This component never reaches for drei's `Environment`: the `ShaderMaterial` here is unlit and
samples only the canvas-generated text texture, with no PBR surfaces or reflections to light in
the first place. The catalogue-wide rule against `Environment` with a `preset` still applies if a
future variant of this hero adds lit geometry to the scene — light it with explicit lights or a
self-hosted HDRI, never a preset fetched from drei's hard-coded third-party CDN.
