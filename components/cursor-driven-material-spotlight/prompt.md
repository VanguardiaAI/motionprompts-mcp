# Cursor-Driven Material Spotlight

## Goal

Build a full-viewport WebGL scene showing a single monochrome 3D sculpture sitting on a flat warm-grey backdrop. The star effect: as the cursor moves over the canvas, an invisible **spotlight trails the mouse with a smooth lag** and, wherever it lands on the model's surface, the material locally turns **glossier and darker** — a soft round "wet/polished" patch that reveals reflections and follows the pointer. The reveal fades in when the cursor enters and fades out when it leaves. There is no scroll, no click state, no page chrome — just the sculpture and the roaming highlight.

## Tech

Vanilla HTML/CSS/JS with ES module imports. **No GSAP, no Lenis, no scroll library.** The only runtime dependency is `three` (npm). The motion is produced entirely by a `requestAnimationFrame` loop that linearly interpolates (lerps) values into custom shader uniforms.

Imports needed:

- `three`
- `three/examples/jsm/loaders/GLTFLoader.js`
- `three/examples/jsm/environments/RoomEnvironment.js`
- A local `./shaders.js` module that exports four GLSL string snippets (see below).

## Layout / HTML

Minimal. One full-viewport section; the WebGL `<canvas>` is created in JS and appended into it.

```html
<section class="spotlight"></section>
<script type="module" src="./script.js"></script>
```

## Styling

Tiny stylesheet — the visuals come from WebGL, not CSS.

- Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`
- `.spotlight { width:100%; height:100svh; background:#dddcd7; }` — warm off-white/grey (`#dddcd7`), same value used as the renderer clear color so canvas and page blend seamlessly.
- `canvas { display:block; }`

No fonts, no text, no other elements.

## Core effect (be exhaustive — this is the whole component)

### Renderer / scene / camera setup

- `THREE.Scene`, `THREE.PerspectiveCamera(45, containerW / containerH, 0.1, 100)`, `THREE.WebGLRenderer({ antialias: true })`.
- `renderer.setSize(container.clientWidth, container.clientHeight)`.
- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
- `renderer.setClearColor(0xdddcd7)` — matches the CSS background.
- `renderer.toneMapping = THREE.ACESFilmicToneMapping`; `renderer.toneMappingExposure = 0.65` (slightly under-exposed so the glossy reveal reads as a darker, richer patch).
- Append `renderer.domElement` into `.spotlight`.
- **Environment lighting via PMREM:** `const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment()).texture; pmrem.dispose();` — this image-based lighting is what makes the low-roughness reveal show reflections. There are **no explicit lights**; all shading comes from `scene.environment`.

### Shared state / config

```js
const config = { radius: 0.15, softness: 0.35, lerp: 0.05 };
const shaders = [];                                  // collected patched shaders
const uHit   = new THREE.Vector3(0, 100, 0);         // current spotlight world pos (starts far off-model)
const target = new THREE.Vector3(0, 100, 0);         // desired spotlight world pos
const mouse  = new THREE.Vector2();                  // NDC pointer
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // z=0 world plane
const planeHit = new THREE.Vector3();
let uActive = 0;         // smoothed 0→1 hover intensity fed to shader
let active  = false;     // raw hover boolean (true on mousemove, false on mouseleave)
```

`uHit` and `target` start at `(0,100,0)` — high above the model — so no reveal is visible until the pointer moves.

### Model load + framing (GLTFLoader)

Load a single `.glb` model (see Assets). In the load callback:

1. **Center it:** `const box = new THREE.Box3().setFromObject(model); model.position.sub(box.getCenter(new THREE.Vector3()));`
2. **Frame the camera to fit:** compute `size = box.getSize(...)`, then
   `dist = Math.max(size.x, size.y, size.z) / (2 * Math.tan((camera.fov * Math.PI/180) / 2));`
   Set `camera.position.set(0, 0, dist * 1.75)` and `camera.lookAt(0, 0, 0)`. The `1.75` factor leaves comfortable margin around the sculpture.
3. **Patch every mesh material** (see next section).
4. `scene.add(model)`.

### Material patching via `onBeforeCompile` (the shader trick)

Traverse the model; for each `node.isMesh`:

- Force `node.material.roughness = 0.95` (matte base so the reveal contrast is strong).
- Set `node.material.onBeforeCompile = (shader) => { ... }` and inside it:
  - Add uniforms:
    ```js
    shader.uniforms.uHitPoint = { value: uHit };   // shared Vector3, live-updated in the rAF loop
    shader.uniforms.uActive   = { value: 0 };
    shader.uniforms.uRadius   = { value: config.radius };   // 0.15
    shader.uniforms.uSoftness = { value: config.softness }; // 0.35
    ```
  - Inject into the **vertex shader**: after `#include <common>` append `varying vec3 vWPos;`; after `#include <worldpos_vertex>` append `vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;` (world-space position passed to the fragment stage).
  - Inject into the **fragment shader**: after `#include <common>` append the uniform/varying declarations; after `#include <roughnessmap_fragment>` append the reveal math (below).
  - `shaders.push(shader);` so the loop can update all patched materials.
- `node.material.needsUpdate = true;`

**`shaders.js` exports (exact GLSL — load-bearing):**

```js
export const vertexPars = `varying vec3 vWPos;`;

export const vertexMain = `vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`;

export const fragmentPars = `
  uniform vec3 uHitPoint;
  uniform float uActive, uRadius, uSoftness;
  varying vec3 vWPos;
`;

export const fragmentMain = `
  float d = distance(vWPos, uHitPoint);
  float reveal = 1.0 - smoothstep(uRadius, uRadius + uSoftness, d);
  float mask = reveal * uActive;
  roughnessFactor = mix(0.95, 0.45, mask);
  diffuseColor.rgb *= mix(1.0, 0.5, mask);
`;
```

What the fragment math does, per fragment:

- `d` = world-space distance from this surface point to the spotlight center `uHitPoint`.
- `reveal` = `1 − smoothstep(uRadius, uRadius+uSoftness, d)` → `1` inside radius `0.15`, smoothly ramping to `0` across the `0.35` softness band, `0` beyond. This is the soft round falloff.
- `mask = reveal * uActive` → gates the whole effect by the fade-in/out hover intensity.
- `roughnessFactor = mix(0.95, 0.45, mask)` → roughness drops from `0.95` (matte) toward `0.45` (glossy) at the center, so environment reflections appear.
- `diffuseColor.rgb *= mix(1.0, 0.5, mask)` → diffuse darkened to 50% at the center, reinforcing the "polished/wet" look.

### Pointer input

On `.spotlight`:

- `mousemove`: convert to NDC using the element's `getBoundingClientRect()` —
  `mouse.x = ((e.clientX − r.left)/r.width)*2 − 1;`
  `mouse.y = −((e.clientY − r.top)/r.height)*2 + 1;` and set `active = true`.
- `mouseleave`: set `active = false`.

### The rAF lerp loop (the actual "animation")

```js
function animate() {
  requestAnimationFrame(animate);

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, planeHit); // project pointer onto z=0 world plane
  target.copy(planeHit);

  uHit.lerp(target, config.lerp);                       // spotlight trails toward target (factor 0.05)
  uActive += ((active ? 1 : 0) - uActive) * config.lerp; // hover intensity eases in/out (factor 0.05)

  for (const s of shaders) {
    s.uniforms.uHitPoint.value.copy(uHit);
    s.uniforms.uActive.value = uActive;
  }

  renderer.render(scene, camera);
}
animate();
```

- The pointer is raycast against a fixed `z = 0` world plane; the intersection is the *desired* spotlight world position `target`.
- `uHit.lerp(target, 0.05)` each frame gives the **smooth trailing lag** — the highlight chases the cursor rather than snapping to it.
- `uActive` eases from `0→1` on enter and `1→0` on leave with the same `0.05` factor, producing a soft fade of the whole reveal.
- Both smoothed values are copied into every patched shader's uniforms right before `renderer.render`.

### Resize

On `window` `resize`: `camera.aspect = container.clientWidth/container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight);`

## Assets / images

One `.glb` model only:

- A **single classical figure sculpture** (e.g. a nude athletic human figure in a dynamic pose), monochrome, one **matte grey PBR material** covering the whole mesh (no textures/colors needed — the material is recolored/roughened by the shader). Binary glTF, roughly 5–6 MB. It should be a solid mesh with real surface detail so the glossy reveal has geometry to reflect off. Load it from an assets path such as `./model.glb`. Center and auto-frame it as described above; no ground plane, no other objects.

## Behavior notes

- **Desktop / pointer-driven only.** Effect is entirely `mousemove`-based; there is no touch, click, or scroll interaction. On leave, the reveal fades out but the render loop keeps running continuously.
- No reduced-motion branch in the original; the loop always runs.
- Initial state shows the plain matte sculpture (spotlight parked off-model at world `(0,100,0)`, `uActive = 0`).
- The clear color, CSS background, and tone-mapping exposure together give a calm, slightly muted studio look; keep `#dddcd7` consistent between CSS and `setClearColor`.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/cursor-driven-material-spotlight/model.glb
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--plaster`, `--ivory`, `--ink`, `--stone`, `--rubric`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above is written as a `mount(config)` function that builds the scene and returns a
`destroy()` that undoes it — this catalogue's own live-editing runtime (`window.MP.register`)
calls `mount` again with a new `config` whenever a knob moves, relying on `destroy()` to fully
retire the previous scene first. That shape already looks like an effect and its cleanup, which
makes parts of this port mechanical and one part treacherous: `destroy()` has to reach three
unrelated kinds of resource — a `requestAnimationFrame` handle, five DOM listeners spread across
`.spotlight` and `window`, and the GPU memory held by the loaded model's geometries, materials and
the PMREM environment texture — and none of the three are undone by the same mechanism. There is
no GSAP anywhere in this component, so a port that reaches for `gsap.context`-style bookkeeping out
of habit finds nothing to hook it to; the only teardown mechanism here is the explicit block at the
end of `mount`.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. A `mount`/`destroy` pair that isn't wired as an effect's return value survives
that remount as two renderers appending two `<canvas>` elements into the same `.spotlight`, two
`animate()` loops both raycasting the same `mouse` toward the same plane and lerping two separate
`uHit` vectors at once, and — because the `GLTFLoader` callback only checks a local `destroyed`
flag, not React's own lifecycle — a `.glb` that finishes loading after the first mount's teardown
quietly calls `scene.add(model)` on a scene nobody is rendering anymore, while its geometry and
materials sit on the GPU with no live `destroy()` left to reach them. None of this reproduces in a
production build, because only development does the double mount.

*(1) The entry point* — Ignore the `window.MP.register` branch entirely; it exists so this
catalogue's own editor can remount the scene with different knob values, and it has no equivalent
in a consuming app. The branch that matters is the other one, and it is the guarded form: it checks
`document.readyState` before subscribing to `DOMContentLoaded`, a guard against being loaded late
into a plain document. `useEffect` already runs after the DOM is committed, so both the guard and
the listener are dead weight. Drop them along with the `window.MP` branch, and move the body of
`mount` — renderer/scene/camera/PMREM setup, the `GLTFLoader.load` call, the five listeners, and the
`animate()` loop — directly into a `useEffect` with an empty dependency array, called with the
default config values (or props) standing in for whatever `window.MP` would have supplied.

*(2) Element lookups* — `mount` finds its attachment point with a single
`document.querySelector(".spotlight")` and never queries the document again; everything else
(`renderer.domElement`, the model) is held by direct reference from that point on. Give the
component a root `ref` on the element playing `.spotlight`'s role and read it as `rootRef.current`
instead of querying by class. During the StrictMode remount two `.spotlight` sections exist for an
instant, and a class-name lookup can bind to the outgoing copy — the one whose `destroy()` is about
to run.

*(3) Cleanup* — Preserve the `destroyed` boolean, but tie it to the effect's own lifecycle instead
of to `mount`'s local closure: flip it inside the cleanup function, and check it exactly where the
original already does — inside the `GLTFLoader.load` callback, before `scene.add(model)` — since
every other side effect in this component runs synchronously and needs no such guard. The
`requestAnimationFrame` handle (`frame`) is already captured and cancelled correctly in the original
`destroy()`; carry that over unchanged, it's the one piece of this component that needed no
rewriting to be StrictMode-safe. Do the same for the five listeners (`mousemove`, `mouseleave`,
`touchmove`, `touchend` on the root, `resize` on `window`) and for the GPU teardown: walk the model
disposing each mesh's geometry and materials (and any texture a material holds), dispose
`scene.environment` — the PMREM texture generated from `RoomEnvironment`, which nothing else in the
scene graph references and which `pmrem.dispose()` at setup time does not free — and finish with
`renderer.dispose()`, `renderer.forceContextLoss()`, and removing `renderer.domElement` from the
root. Skipping `forceContextLoss()` is the failure that only shows up once a user has revisited this
route enough times in one session to exhaust the browser's WebGL context budget, not on the first
navigation away.

*(4) Rendering this in `@react-three/fiber`* — `<Canvas>` replaces the hand-built
`WebGLRenderer`/`Scene`/`PerspectiveCamera` block and the manual `resize` listener; it observes its
own container and calls `setSize` for you, so nothing here should start a second
`requestAnimationFrame` loop of its own — `useFrame` takes over `animate()`'s job instead.
`useGLTF(url)` replaces `GLTFLoader.load` — the URL is already same-domain
(`/c/cursor-driven-material-spotlight/model.glb`) — and because `useGLTF` is Suspense-driven, the
`destroyed` guard around `scene.add(model)` stops being necessary: a Suspense boundary that unmounts
before the model resolves never commits the component that would have added it to the scene in the
first place. Keep the guard only if you have a specific reason to bypass `useGLTF` and call
`GLTFLoader.load` yourself inside the Canvas.

The material patch is the part that resists going fully declarative, because `onBeforeCompile` is
not a prop `<meshStandardMaterial>` exposes — it has to run once, imperatively, against the loaded
mesh, exactly as the traversal above does. Run that traversal in a `useEffect` keyed on the loaded
`gltf.scene`, not on the radius/softness knobs: the original never triggers a second shader compile
after the one that follows `node.material.needsUpdate = true` at setup, so re-running the traversal
on every knob change would buy nothing without also forcing that recompile yourself — which is
exactly what reading `config.radius`/`config.softness` fresh every frame, instead of baking them
into the shader once, is already designed to avoid. Keep that per-frame read: hold radius, softness
and the per-frame follow factor in a ref if they can change from props, and write them into every
collected shader's uniforms inside `useFrame`, the same way `uHitPoint` and `uActive` already get
written there. One caveat specific to `useGLTF`: it caches the parsed scene by URL, so a second
mount of this component — or the StrictMode double-invoke — that traverses the same cached
`gltf.scene` without cloning it first ends up patching the very same mesh objects twice. Clone the
scene (`gltf.scene.clone()`) before traversing, so each mounted instance owns its own materials and
its own `shaders` array instead of two components silently sharing one spotlight.

`useFrame` also lets most of the manual pointer bookkeeping go. `state.pointer` is already the
NDC-space cursor position R3F tracks from native events on the canvas, and `state.raycaster` is
already configured against it each frame, so `raycaster.ray.intersectPlane(plane, planeHit)` can
run straight off `state.raycaster` inside `useFrame`, without a separate `THREE.Raycaster`/`Vector2`
pair fed by a hand-written `mousemove` handler. What R3F does not give you for free is the `active`
boolean — there is no ambient "is anything hovering the canvas" flag on `state` — so keep that as a
ref toggled by `onPointerMove`/`onPointerLeave` on the `<Canvas>` (or a full-bleed group inside it).
Those two pointer-event props already fire for touch as well as mouse, since Pointer Events unify
the two at the browser level; the separate `touchmove`/`touchend` pair the original registers to
cover touch devices collapses into the same two handlers and can be deleted rather than ported.

A static poster is mandatory here, not a nicety: the model is the roughly 5–6 MB binary glTF the
Assets section above already describes, and until it decodes and uploads to the GPU the canvas has
nothing to show but the flat clear color. Render a poster image sized to fill `.spotlight`, wrap the
loaded model in `<Suspense fallback={null}>`, and swap the poster out once that boundary resolves —
the sculpture's silhouette and lighting should already be recognizable in the poster so the swap
doesn't read as a layout shift.

The environment lighting was never going to trip this catalogue's rule against `Environment preset`
in the first place — `RoomEnvironment` is three's own procedural studio scene, not a hosted HDRI, so
there is no third-party CDN to depend on here. The straightforward port keeps the manual approach:
pull `gl` and `scene` from `useThree()`, run the same `PMREMGenerator`/`RoomEnvironment` block inside
a `useEffect`, assign the result to `scene.environment`, and dispose both the generated texture and
the generator in that effect's cleanup. Drei's `Environment` component isn't needed to satisfy the
rule, because this scene was never reaching for a preset or a remote file to begin with. There are
still no explicit lights anywhere in this scene; every bit of shading, matte or glossy, comes from
that one environment map.
