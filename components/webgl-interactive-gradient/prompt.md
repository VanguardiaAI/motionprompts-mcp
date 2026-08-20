# WebGL Interactive Gradient

## Goal
Build a full-screen hero whose entire background is a **living, flowing multi-color gradient rendered in WebGL** (Three.js + two custom fragment shaders). A **real-time fluid simulation** runs in a ping-pong pair of float render targets; a display pass warps a time-evolving trig-based gradient by the fluid's velocity field. **Moving the mouse stirs the fluid** — the gradient ripples, smears and swirls along the cursor's trail, then slowly relaxes back to its ambient flow. A minimal white nav, a centered logo image and a footer strip float on top. The star effect is the cursor-reactive fluid distortion of the animated gradient.

## Tech
Vanilla HTML/CSS/JS with ES module imports. **No GSAP is needed** — all motion is a raw `requestAnimationFrame` loop driving shader uniforms. Use `three` (npm):
```js
import * as THREE from "three";
import { vertexShader, fluidShader, displayShader } from "./shaders.js";
```
Put the three shader source strings in a sibling module `shaders.js` and export them as template-literal strings.

## Layout / HTML
```html
<nav>
  <div class="logo"><p>Orbit Studio</p></div>
  <div class="nav-items">
    <p>Index</p><p>Portfolio</p><p>Info</p><p>Contact</p>
  </div>
</nav>
<section class="hero">
  <div class="gradient-canvas"></div>
  <div class="hero-logo"><img src="/path/logo.jpg" alt="" /></div>
  <div class="hero-footer">
    <p>Experiment 0469</p>
    <p>Built by Orbit Studio</p>
  </div>
</section>
<script type="module" src="./script.js"></script>
```
- `.gradient-canvas` is the WebGL container — JS appends the renderer's `<canvas>` into it.
- `.hero-logo` holds a single centered logo image on top of the gradient.
- Nav/footer copy is neutral demo text ("Orbit Studio", "Experiment 0469", etc.) — invent your own if you like.

## Styling
Font import: `@import url("https://fonts.googleapis.com/css2?family=Host+Grotesk:ital,wght@0,300..800;1,300..800&display=swap");`

Global reset: `* { margin:0; padding:0; box-sizing:border-box; }` and `body { font-family:"Host Grotesk"; }`

- `img`: `width:100%; height:100%; object-fit:cover;`
- `p`: `color:#fff; font-size:0.9rem; font-weight:450;` — all UI text is small white grotesk.
- `nav, .hero-footer`: `position:absolute; left:0; width:100vw; padding:2rem; display:flex; justify-content:space-between; align-items:center; z-index:2;` (nav sticks to the top by default flow; footer adds `bottom:0`).
- `.nav-items`: `display:flex; gap:4rem;`
- `nav .logo p`: `font-weight:700;`
- `section` (the hero): `position:relative; width:100vw; height:100svh; overflow:hidden;`
- `.hero-logo`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:25%;` — the logo spans 25% of the viewport width, dead center.
- `.gradient-canvas`: `position:absolute; top:0; left:0; width:100%; height:100%;`
- Responsive: `@media (max-width:1000px) { nav { flex-direction:column; gap:2rem; } }`

## The effect (Three.js fluid-distorted gradient — be exact)

### Config object (single source of truth, re-synced to uniforms every frame)
```js
const config = {
  brushSize: 25.0,
  brushStrength: 0.5,
  distortionAmount: 2.5,
  fluidDecay: 0.98,      // how long fluid velocity persists (per-frame multiplier)
  trailLength: 0.8,      // per-frame multiplier on the trail/pressure channel
  stopDecay: 0.85,       // extra damping near a stationary cursor
  color1: "#b8fff7",     // pale mint
  color2: "#6e3466",     // muted plum
  color3: "#0133ff",     // vivid electric blue
  color4: "#66d1fe",     // light sky blue
  colorIntensity: 1.0,
  softness: 1.0,
};
```
Add a `hexToRgb(hex)` helper returning `[r,g,b]` in 0–1 for the color uniforms.

### Scene setup
- `camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);` — full-screen quad rig, no perspective.
- `renderer = new THREE.WebGLRenderer({ antialias: true });` sized to `window.innerWidth × window.innerHeight`, appended into `.gradient-canvas`.
- **Two ping-pong render targets** (`fluidTarget1`, `fluidTarget2`), both `window.innerWidth × window.innerHeight` with:
  ```js
  { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat, type: THREE.FloatType }
  ```
  `FloatType` is required — the sim stores signed velocities.
- Track `currentFluidTarget` / `previousFluidTarget` refs plus a `frameCount` integer (starts 0).
- `geometry = new THREE.PlaneGeometry(2, 2);` shared by two meshes: `fluidPlane` (with `fluidMaterial`) and `displayPlane` (with `displayMaterial`). No scene graph needed — render each mesh directly with `renderer.render(mesh, camera)`.

**`fluidMaterial` (ShaderMaterial) uniforms:** `iTime` (float), `iResolution` (Vector2 = window size), `iMouse` (Vector4 = x, y, prevX, prevY, initialized 0,0,0,0), `iFrame` (int), `iPreviousFrame` (sampler, starts null), `uBrushSize`, `uBrushStrength`, `uFluidDecay`, `uTrailLength`, `uStopDecay` — all seeded from `config`. Vertex = `vertexShader`, fragment = `fluidShader`.

**`displayMaterial` (ShaderMaterial) uniforms:** `iTime`, `iResolution`, `iFluid` (sampler, starts null), `uDistortionAmount`, `uColor1`–`uColor4` (Vector3s from `hexToRgb`), `uColorIntensity`, `uSoftness`. Vertex = `vertexShader`, fragment = `displayShader`.

### Mouse input
```js
let mouseX = 0, mouseY = 0, prevMouseX = 0, prevMouseY = 0, lastMoveTime = 0;

document.addEventListener("mousemove", (e) => {
  const rect = gradientCanvas.getBoundingClientRect();
  prevMouseX = mouseX;  prevMouseY = mouseY;
  mouseX = e.clientX - rect.left;
  mouseY = rect.height - (e.clientY - rect.top);   // flip Y to GL coords
  lastMoveTime = performance.now();
  fluidMaterial.uniforms.iMouse.value.set(mouseX, mouseY, prevMouseX, prevMouseY);
});
document.addEventListener("mouseleave", () => {
  fluidMaterial.uniforms.iMouse.value.set(0, 0, 0, 0);
});
```
Key detail: the shader treats `iMouse.z > 0.0` as "brush active", so zeroing the vector turns the brush off.

### Render loop (rAF, ping-pong)
Every frame, in this exact order:
1. `time = performance.now() * 0.001;` → write to `iTime` on **both** materials; write `frameCount` to `iFrame`.
2. **Idle cutoff:** if `performance.now() - lastMoveTime > 100` (ms), set `iMouse` to `(0,0,0,0)` — the brush only injects while the mouse is actively moving.
3. Copy every `config` value back into its uniform (brush, decay, distortion, intensity, softness, and re-run `hexToRgb` on the four colors) — this makes the config live-tweakable.
4. **Fluid pass:** `fluidMaterial.uniforms.iPreviousFrame.value = previousFluidTarget.texture;` → `renderer.setRenderTarget(currentFluidTarget);` → `renderer.render(fluidPlane, camera);`
5. **Display pass:** `displayMaterial.uniforms.iFluid.value = currentFluidTarget.texture;` → `renderer.setRenderTarget(null);` → `renderer.render(displayPlane, camera);`
6. **Swap** `currentFluidTarget` ↔ `previousFluidTarget`; `frameCount++`.

### Resize
On `window.resize`: `renderer.setSize(w, h)`, update `iResolution` on both materials, `setSize(w, h)` on **both** render targets, and reset `frameCount = 0` (re-seeds the simulation from frame zero).

## Shaders (`shaders.js`)

**Vertex shader** (shared passthrough):
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**`fluidShader`** — a compact self-advecting fluid sim. State per texel (RGBA): `xy` = velocity, `z` = pressure/trail, `w` = misc. Uniforms as listed above; `varying vec2 vUv`.

Helpers (globals `vec2 ur, U;`):
```glsl
// distance from point p to segment a–b
float ln(vec2 p, vec2 a, vec2 b) {
  return length(p-a-(b-a)*clamp(dot(p-a,b-a)/dot(b-a,b-a),0.,1.));
}
// wrap-around samples of the previous frame, in pixel space
vec4 t(vec2 v, int a, int b) { return texture2D(iPreviousFrame, fract((v+vec2(float(a),float(b)))/ur)); }
vec4 t(vec2 v)               { return texture2D(iPreviousFrame, fract(v/ur)); }
// triangle area via Heron's formula
float area(vec2 a, vec2 b, vec2 c) {
  float A = length(b-c), B = length(c-a), C = length(a-b), s = 0.5*(A+B+C);
  return sqrt(s*(s-A)*(s-B)*(s-C));
}
```
`main()`, with `U = vUv * iResolution; ur = iResolution.xy;`:
1. **Seed frame** — `if (iFrame < 1)`: `float w = 0.5+sin(0.2*U.x)*0.5; float q = length(U-0.5*ur); gl_FragColor = vec4(0.1*exp(-0.001*q*q), 0, 0, w);` (a soft central x-velocity bump so the gradient isn't static at load).
2. **Semi-Lagrangian advection** — take `v = U` and four diagonal probes `A=v+(1,1), B=v+(1,-1), C=v+(-1,1), D=v+(-1,-1)`; iterate **8 times**: subtract `t(p).xy` from each of the five points (walk each point back along the velocity field).
3. **Diffusion** — sample `me = t(v)` and its 4-neighborhood `n,e,s,w` (offsets ±1); `me = mix(t(v), 0.25*(n+e+s+w), vec4(0.15, 0.15, 0.95, 0.));` — velocity blends 15% toward the neighbor average, pressure 95%.
4. **Divergence → pressure:** `me.z -= 0.01*((area(A,B,C)+area(B,C,D)) - 4.);`
5. **Pressure gradient → velocity:** `vec4 pr = vec4(e.z, w.z, n.z, s.z); me.xy += 100.*vec2(pr.x-pr.y, pr.z-pr.w)/ur;`
6. **Decay:** `me.xy *= uFluidDecay;` `me.z *= uTrailLength;`
7. **Mouse brush** — only `if (iMouse.z > 0.0)`:
   - `mouseVel = iMouse.xy - iMouse.zw;` `velMagnitude = length(mouseVel);`
   - `q = ln(U, iMouse.xy, iMouse.zw);` (distance to the cursor's segment this frame)
   - clamp the injected vector: `if (l > 0.0) m = min(l, 10.0) * m / l;`
   - `float brushSizeFactor = 1e-4 / uBrushSize; float strengthFactor = 0.03 * uBrushStrength;`
   - `float falloff = pow(exp(-brushSizeFactor*q*q*q), 0.5);` (cubic-exponential falloff → soft wide brush)
   - `me.xyw += strengthFactor * falloff * vec3(m, 10.);`
   - **Stationary-cursor damping** — `if (velMagnitude < 2.0)`: `float influence = exp(-length(U - iMouse.xy) * 0.01); float cursorDecay = mix(1.0, uStopDecay, influence); me.xy *= cursorDecay; me.z *= cursorDecay;` (fluid calms down under a resting cursor instead of buzzing).
8. `gl_FragColor = clamp(me, -0.4, 0.4);` — hard-clamp keeps the sim stable.

**`displayShader`** — the visible gradient, warped by the fluid:
```glsl
void main() {
  vec2 fragCoord = vUv * iResolution;
  vec4 fluid = texture2D(iFluid, vUv);
  vec2 fluidVel = fluid.xy;

  float mr = min(iResolution.x, iResolution.y);
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / mr;   // centered, aspect-corrected

  uv += fluidVel * (0.5 * uDistortionAmount);          // THE hook: fluid warps the gradient

  float d = -iTime * 0.5;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {                  // iterative trig feedback → organic flow
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += iTime * 0.5;

  float mixer1 = cos(uv.x * d) * 0.5 + 0.5;
  float mixer2 = cos(uv.y * a) * 0.5 + 0.5;
  float mixer3 = sin(d + a) * 0.5 + 0.5;

  float smoothAmount = clamp(uSoftness * 0.1, 0.0, 0.9);
  mixer1 = mix(mixer1, 0.5, smoothAmount);             // softness pulls bands toward mid-blends
  mixer2 = mix(mixer2, 0.5, smoothAmount);
  mixer3 = mix(mixer3, 0.5, smoothAmount);

  vec3 col = mix(uColor1, uColor2, mixer1);
  col = mix(col, uColor3, mixer2);
  col = mix(col, uColor4, mixer3 * 0.4);               // color4 is only a 40% accent
  col *= uColorIntensity;
  gl_FragColor = vec4(col, 1.0);
}
```

## Assets / images
- **1 logo image**, roughly **square (~1:1)** — a **white abstract logo mark / wordmark** meant to sit centered over the gradient (it renders at 25% of the viewport width). Transparent or near-black background; no real brand.

## Behavior notes
- The gradient **animates on its own from frame one** (the `iTime`-driven trig loop flows continuously); the mouse only *adds* fluid energy on top. With no interaction it settles into a slow ambient drift.
- Mouse input stops injecting after **100ms** without movement, and the fluid decays (`fluidDecay 0.98` / `trailLength 0.8` per frame), so trails linger ~a second then dissolve.
- Desktop-first: the effect is mouse-driven; on touch it just plays the ambient gradient. `FloatType` render targets make it GPU-heavy — no pixel-ratio tricks in the original.
- Resizing rebuilds nothing; it resizes the targets and re-seeds the sim (`frameCount = 0`).
- No GSAP, no scroll behavior, no reduced-motion branch.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/webgl-interactive-gradient/logo_01.png
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-soft`, `--ink-faint`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above already ships as a `mount(config)` / `destroy()` pair, which is most of the way to a `useEffect` already: `mount` builds the `OrthographicCamera`, the `WebGLRenderer`, the two `FloatType` ping-pong targets, the two `ShaderMaterial`s, the shared `PlaneGeometry`, the `mousemove`/`mouseleave`/`resize` listeners and the self-scheduling `requestAnimationFrame` loop, and the closure it returns tears every one of those back down. Neither the `window.MP` dispatch at the bottom of the file nor the `document.readyState` guard it's wrapped in has anything to do with how React schedules work — but everything `mount`/`destroy` do to the GPU is exactly what an effect and its cleanup should do.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Call `mount()` without wiring its return value up as the effect's cleanup, and the second mount finds the first instance still alive: two `requestAnimationFrame` chains each running their own fluid sim, two `mousemove` listeners on `document` both writing to their own `fluidMaterial.uniforms.iMouse`, and two pairs of window-sized `FloatType` render targets — the single most expensive thing this component allocates — where there should be one. This will not reproduce in a production build, because only development double-invokes.

*(1) The entry point* — the module ends with `if (window.MP && window.MP.register) { window.MP.register(...) } else { const boot = () => mount(...); if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot(); }`. `window.MP` is this catalogue's own editor bridge and will not exist in a React host, so this always falls into the `else` branch. The `readyState` check there is dead weight in React: by the time an effect runs, the DOM it queries has already committed. Delete the whole dispatch, and put exactly `boot`'s body — the `mount(...)` call — inside a `useEffect` with an empty dependency array, passing it this component's own props merged over `DEFAULTS` instead of the bare copy. Because `mount` already returns a synchronous cleanup and never awaits anything, the effect is close to literally `useEffect(() => mount(config), [])`.

*(2) Element lookups* — the only query in the file is `document.querySelector(".gradient-canvas")`, unscoped, so during the instant where a StrictMode remount leaves two copies of the subtree mounted it can bind to the container that is on its way out. Give the component a root `ref`, render `.gradient-canvas` under it, and look the container up through that ref instead. One detail this component gets right that's worth preserving rather than "fixing": it does **not** need the clone-and-replace trick that WebGL components built around a persistent `<canvas id="...">` usually need. `mount` appends `renderer.domElement` — a canvas `three` creates fresh — into the container div, and `destroy()` calls `renderer.domElement.remove()` alongside `forceContextLoss()`. Since the canvas itself is thrown away and rebuilt on every mount, there's no stale node holding a permanently-lost WebGL context for the next mount to fight with. Keep that shape: mount into a plain container ref, let `three` own canvas creation, and make sure `destroy()`'s `remove()` call survives the port — drop it and a StrictMode remount stacks a second canvas inside the same div instead of replacing the first.

*(3) Cleanup* — there is no GSAP, ScrollTrigger, Lenis or SplitText in this file, and `mount` never awaits a promise, so none of those patterns apply here. What has to survive the port unchanged is the GPU teardown `destroy()` already performs in order: cancel the frame, remove the three DOM listeners, then `fluidTarget1.dispose()`, `fluidTarget2.dispose()`, `geometry.dispose()`, `fluidMaterial.dispose()`, `displayMaterial.dispose()`, `renderer.dispose()`, `forceContextLoss()`, `domElement.remove()`. That sequence is already correct; the only change is calling it from the function a `useEffect` returns instead of from a bare `if/else` dispatch.

### The render loop has to be the one you can cancel

`animate()` is self-scheduling: it does the fluid pass, the display pass, the target swap, then sets `frame = requestAnimationFrame(animate)` and repeats. Keep that `frame` handle and call `cancelAnimationFrame(frame)` in the cleanup — `destroy()` already does this. Skip it and a StrictMode unmount leaves the first mount's loop alive, still reading a `config` object and writing into materials the second mount considers its own; the two gradients will visibly fight over the same cursor trail.

### Mapping this scene to React Three Fiber

three 0.185 · `@react-three/fiber` 9 · `@react-three/drei` 10.7 · React 19. This scene never builds a `THREE.Scene` in the first place — `fluidPlane` and `displayPlane` are two bare `THREE.Mesh` objects, and every frame calls `renderer.render(fluidPlane, camera)` and, separately, `renderer.render(displayPlane, camera)` directly, with nothing in between them but a render-target swap. That ordering is the entire component: the fluid pass has to finish writing into its offscreen target before the display pass samples that texture as `iFluid`, every frame, without exception.

- `<Canvas orthographic camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1 }}>` replaces the manual `OrthographicCamera`/`WebGLRenderer` construction. But `<Canvas>` also owns one scene of its own and, by default, renders it automatically right after your `useFrame` callbacks finish — and a scene it renders automatically is not something you can insert a mid-frame render-target swap into. Pass a numeric priority to `useFrame` (`useFrame(callback, 1)`) to opt out of that automatic render entirely, and inside the callback do exactly what `animate()` does today: set the render target to the current fluid buffer and render `fluidPlane`, then set it back to `null` and render `displayPlane`, then swap. Keep `fluidPlane`/`displayPlane` as plain objects built once with `useMemo`, not JSX `<mesh>` children — they were never scene members before and gain nothing by becoming any now.
- The two `FloatType` render targets, the shared `PlaneGeometry` and the two `ShaderMaterial`s are not JSX-declared, so R3F's automatic disposal — which only walks what it rendered as the scene graph — never reaches them. Construct and dispose them by hand in the same effect that registers the `useFrame` callback, with the identical four `.dispose()` calls `destroy()` already makes.
- Resize is only half free. `<Canvas>` keeps its own renderer and camera sized to its container without help, but it has no notion of the two extra off-screen targets this effect owns. Read `size` from `useThree` (or keep the existing `window.resize` listener) and, on change, call `.setSize` on both targets and reset the frame counter to zero — the same reseed `onResize` performs today — since `<Canvas>`'s own resize handling never touches a target it didn't create.
- There's no `GLTFLoader` or texture `load()` anywhere in this file — both passes are hand-written GLSL reading only from each other's render target — so the usual "port `.load()` to a `use*` hook" step doesn't apply.

**A static poster is worth adding here for a different reason than a heavy model.** Nothing above is loaded over the network, so there's no multi-second wait — but this canvas *is* the entire hero background, not an accent over existing content, and it depends on `FloatType` render targets that this component's own metadata already flags as not mobile-safe. Where a lighter effect could fail quietly, a failed or delayed first frame here leaves a plain black rectangle behind the nav and the centered logo. Cover that gap with a static poster — a captured frame of the ambient, mouse-untouched gradient — shown until the first successful render confirms the loop is running, so a device that can't allocate float targets degrades to a still image instead of a black hole.

**Drei's `Environment` doesn't come up in this component, and it's worth saying so rather than leaving it implicit.** Both materials are raw `ShaderMaterial`s writing straight to `gl_FragColor`; there is no `MeshStandardMaterial` for an HDRI to light. If a future variant sits a lit object over the gradient — a glass logo, a reflective card — reach for explicit lights or a self-hosted HDRI passed to `Environment`, not a `preset`: presets are fetched from a third-party CDN hard-coded into drei, and the object renders unlit the instant that host is unreachable.
