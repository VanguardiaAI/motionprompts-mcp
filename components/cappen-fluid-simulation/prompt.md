# Fluid Simulation Hero (Cappen-style ink over inverted type)

## Goal
Build a full-screen landing hero with a giant white typographic headline and a **GPU fluid
simulation** painted on top of everything. Moving the pointer injects swirling "ink" that flows,
curls and dissipates like real fluid (a Navier–Stokes solver running entirely in fragment
shaders). The fluid canvas uses `mix-blend-mode: difference`, so the moving white ink **inverts**
whatever it passes over — black over the white page, white over the black headline — producing the
signature liquid, self-inverting trail. The star of this piece is the fluid solver, not any DOM
animation.

## Tech
- Vanilla HTML / CSS / JS with ES module imports, bundled by Vite.
- **`three` (npm)** is the only JS dependency — a WebGL fluid simulation written by hand in GLSL.
- **No GSAP, no ScrollTrigger, no SplitText, no Lenis.** All motion is a `requestAnimationFrame`
  physics loop driving custom shaders. Do not reach for any animation library.
- Fonts loaded from Google Fonts: **Inter** (variable) and **DM Mono**.

## Layout / HTML
Semantic, minimal. Body contains a fixed nav, a hero section, and a single fixed canvas.

```
<nav>
  <div class="nav-logo"><a href="#">Vortex</a></div>
  <div class="nav-links">
    <a href="#">works</a>
    <a href="#">about</a>
    <a href="#">updates</a>
    <a href="#">start a project</a>
  </div>
</nav>

<section class="hero">
  <div class="header">
    <h1>Fluid System In</h1>
    <h1>Constant Field</h1>
    <h1>Of Interaction</h1>
  </div>
</section>

<canvas id="fluid"></canvas>
<script type="module" src="./script.js"></script>
```

The three `<h1>` lines are staggered horizontally: line 1 left-aligned (default), line 2
`align-self: flex-end` (pushed right), line 3 `align-self: center`.

## Styling
- **Palette:** page/hero background `#ffffff`, text `#000`. Everything is black on white — the fluid
  provides all the color via inversion.
- **Type:**
  - `h1` — `font-family: "Inter"`, `font-weight: 900`, `text-transform: uppercase`,
    `font-size: clamp(3rem, 10vw, 15rem)`, `line-height: 0.9`, `letter-spacing: -4%`.
  - `.nav-logo a` — Inter, `font-weight: 900`, `1rem`, uppercase, `letter-spacing: -2%`.
  - `.nav-links a` — `font-family: "DM Mono"`, `font-weight: 500`, `0.85rem`, uppercase, `#000`.
- **Reset:** `* { margin:0; padding:0; box-sizing:border-box }`.
- **nav** — `position: fixed; top:0; left:0; width:100%; padding:2rem; display:flex;
  justify-content:space-between; gap:1rem; z-index:2`. `.nav-links` is `display:flex; gap:4rem`.
- **.hero** — `position:relative; width:100%; height:100svh; padding:2rem; background:#fff;
  display:flex; flex-direction:column; justify-content:center; overflow:hidden`. `.header` is a
  flex column.
- **#fluid (critical)** — `position:fixed; inset:0; width:100%; height:100%; pointer-events:none;
  z-index:100; mix-blend-mode: difference`. The `pointer-events:none` lets mouse events reach the
  page while the canvas still tracks them on `window`. The `mix-blend-mode: difference` is what
  makes white ink read as black over the white page and invert the giant type where it crosses it.
- **Responsive `@media (max-width:1000px)`** — `.nav-links` becomes a right-aligned vertical column
  (`flex-direction:column; align-items:flex-end; gap:0`); all `.hero h1` become
  `align-self:center !important; text-align:center`.

## The star effect — real-time GPU fluid simulation (be exact)

Implement a stable-fluids Navier–Stokes solver on double-buffered (ping-pong) float render
targets. This is a direct GLSL port; reproduce the pipeline, uniforms, and constants exactly.

### Renderer & scene
- `THREE.WebGLRenderer({ canvas, alpha: true })`.
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`; `renderer.setSize(innerWidth, innerHeight)`.
- Cache `dpr = renderer.getPixelRatio()`, and simulation `width = innerWidth*dpr`,
  `height = innerHeight*dpr`. On `window resize`, re-`setSize` and recompute `width`/`height`.
- Scene with an `OrthographicCamera(-1, 1, 1, -1, 0, 1)` and a single full-screen
  `Mesh(new PlaneGeometry(2, 2))` whose material is swapped every pass. A pass = set the quad's
  material, `renderer.setRenderTarget(target ?? null)`, `renderer.render(scene, camera)`.

### Render targets
All targets: `new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false })`.
A "double" is `{ read, write, swap() }` where `swap` exchanges `read`/`write`.
- `aspect = width / height`.
- **simSize** = `{ w: simResolution, h: Math.round(simResolution / aspect) }`.
- **dyeSize** = `{ w: dyeResolution, h: Math.round(dyeResolution / aspect) }`.
- `velocity` = double at simSize, `pressure` = double at simSize, `dye` = double at dyeSize.
- `divergence` = single at simSize, `curl` = single at simSize.

### Config constants (use these exact values)
```
simResolution      = 256
dyeResolution      = 1024
curl (curlStrength)= 50
pressureIterations = 40
velocityDissipation= 0.95
dyeDissipation     = 0.95
splatRadius        = 0.3      // divided by 100 in the shader → 0.003
forceStrength      = 8.5
pressureDecay      = 0.75
threshold          = 1.0
edgeSoftness       = 0.0
inkColor           = THREE.Color(1, 1, 1)   // white
```

### Shaders (all share one trivial vertex shader)
Vertex (all passes): `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }`.
Fragment precision headers: `precision highp float;` (+ `precision mediump sampler2D;` for the
sim passes). Write these nine fragment programs:

1. **splat** — uniforms `sampler2D uTarget`, `float aspectRatio`, `float radius`, `vec3 color`,
   `vec2 point`. `vec2 p = vUv - point; p.x *= aspectRatio;`
   `gl_FragColor = vec4(texture2D(uTarget,vUv).xyz + exp(-dot(p,p)/radius) * color, 1.0);`
   (adds a Gaussian blob of `color` centered at `point`).
2. **advection** — uniforms `sampler2D uVelocity, uSource`, `vec2 texelSize`, `float dt`,
   `float dissipation`. Semi-Lagrangian backtrace:
   `gl_FragColor = vec4(dissipation * texture2D(uSource, vUv - dt*texture2D(uVelocity,vUv).xy*texelSize).rgb, 1.0);`
3. **divergence** — samples velocity at L/R/T/B neighbors (offset by `texelSize.x`/`.y`), with a
   boundary helper that clamps the sampled uv to `[0,1]` and negates the fetched velocity
   component when it goes out of bounds (free-slip walls). Output
   `0.5 * (vel(R).x - vel(L).x + vel(T).y - vel(B).y)` in the red channel.
4. **curl** — `texture2D(uVelocity,R).y - texture2D(uVelocity,L).y - texture2D(uVelocity,T).x + texture2D(uVelocity,B).x` in red.
5. **vorticity** — uniforms `uVelocity, uCurl, texelSize, curlStrength, dt`. Compute
   `vec2 f = normalize(vec2(abs(curl(T)) - abs(curl(B)), abs(curl(R)) - abs(curl(L))) + 0.0001) * curlStrength * curl(center);`
   then `gl_FragColor = vec4(texture2D(uVelocity,vUv).xy + f*dt, 0.0, 1.0);` (vorticity
   confinement — adds the swirl).
6. **pressure** — Jacobi iteration: neighbors clamped to `[0,1]`,
   `(pL + pR + pT + pB - divergence) * 0.25` in red.
7. **gradientSubtract** — `velocity.xy - vec2(pR-pL, pT-pB)` (project velocity to divergence-free).
8. **clear** — `gl_FragColor = value * texture2D(uTexture, vUv);` (multiplicative fade of pressure).
9. **display** — uniforms `sampler2D uTexture`, `float threshold, edgeSoftness`, `vec3 inkColor`.
   `float d = clamp(length(texture2D(uTexture,vUv).rgb), 0.0, 1.0);`
   `float a = edgeSoftness > 0.0 ? smoothstep(threshold - edgeSoftness*0.5, threshold + edgeSoftness*0.5, d) : step(threshold, d);`
   `gl_FragColor = vec4(inkColor, a);` — with `threshold=1.0`, `edgeSoftness=0.0` this is a hard
   `step(1.0, d)`: opaque white ink only where dye magnitude ≥ 1, fully transparent elsewhere.

### Input → splat
- Track `mouse = { x, y, velocityX, velocityY, moved }`, all in **device pixels**.
- On `window` `mousemove` (and `touchmove`, with `preventDefault`, `{passive:false}`), given
  client `x,y`: `velocityX = (x*dpr - mouse.x) * forceStrength`, `velocityY = (y*dpr - mouse.y) * forceStrength`,
  then store `mouse.x = x*dpr`, `mouse.y = y*dpr`, set `mouse.moved = true`.
- `splat(x, y, vx, vy)`: set splat uniforms `aspectRatio = width/height`,
  `point = (x/width, 1 - y/height)`, `radius = splatRadius/100`. First splat **into velocity**:
  `uTarget = velocity.read`, `color = vec3(vx, -vy, 0)`, render to `velocity.write`, swap. Then
  splat **into dye**: `uTarget = dye.read`, `color = vec3(3,3,3)` (bright white ink), render to
  `dye.write`, swap.

### Simulation step order (per frame, `simulate(dt)`), `simTexel = (1/simSize.w, 1/simSize.h)`
1. **curl** pass (velocity.read → curl).
2. **vorticity** pass (velocity.read + curl, `curlStrength=50`, `dt`) → velocity.write, swap.
3. **divergence** pass (velocity.read → divergence).
4. **clear** pressure (`value = pressureDecay = 0.75`) → pressure.write, swap.
5. **pressure** solve — loop `pressureIterations` (40) times: set `uPressure = pressure.read`,
   render to `pressure.write`, swap. (`uDivergence` set once before the loop.)
6. **gradientSubtract** (pressure.read + velocity.read) → velocity.write, swap.
7. **advection of velocity** (`uVelocity=uSource=velocity.read`, simTexel,
   `dissipation=velocityDissipation=0.95`) → velocity.write, swap.
8. **advection of dye** (`uVelocity=velocity.read`, `uSource=dye.read`,
   texel = `(1/dyeSize.w, 1/dyeSize.h)`, `dissipation=dyeDissipation=0.95`) → dye.write, swap.

### Render + loop
- `render()`: display pass with `uTexture = dye.read`, `threshold`, `edgeSoftness`, `inkColor`,
  rendered to the **screen** (`setRenderTarget(null)`).
- `loop()`: `dt = Math.min((Date.now() - lastTime)/1000, 0.016)` (clamped to ~60fps step);
  update `lastTime`. If `mouse.moved`, call `splat(...)` then reset `moved=false`. Then
  `simulate(dt)`, `render()`, `requestAnimationFrame`. No easing curves — the fluid's `dissipation`
  factors (0.95 per frame) and the vorticity term ARE the motion feel: ink smears along the pointer
  path, curls into vortices, and fades out over ~1–2 seconds.

## Assets / images
None. There are no image assets — the visual is 100% type + generated fluid.

## Behavior notes
- **Desktop pointer-driven**; also handles `touchmove`. There is no idle/auto animation — a still
  pointer shows only the plain black-on-white hero; the ink appears and lives only while/after the
  pointer moves.
- The effect is continuous and unbounded (runs every frame forever); dissipation keeps it from
  saturating.
- `mix-blend-mode: difference` on the canvas is essential and non-optional — without it the ink
  would render as flat white rectangles instead of inverting the page and headline.
- Half-float render targets are required for solver stability; keep `depthBuffer:false`.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--accent`, `--muted`, `--hairline`, `--pad`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that is already close to a `useEffect`: `mount` builds a `FluidSimulation` instance — the `WebGLRenderer`, six half-float render targets (`velocity`, `pressure`, `divergence`, `curl`, and the double-buffered `dye`), nine `ShaderMaterial`s, `window`-level `mousemove`/`touchmove`/`resize` listeners, and a self-scheduling `requestAnimationFrame` loop — and `destroy()` walks every one of those back off `this` generically. Neither the dispatch at the bottom of the file nor the `getElementById` call it starts from has anything to do with how React schedules work.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Call `mount()` without returning its own `destroy` as the effect's cleanup, and the second mount finds the first `FluidSimulation` still alive: two `requestAnimationFrame` chains rendering into two canvases stacked at the same `z-index:100`, two sets of `mousemove` listeners each computing their own `velocityX`/`velocityY` off the same pointer, and twelve render targets' worth of GPU memory where there should be six. This will not reproduce in a production build, because only development double-invokes.

*(1) The entry point* — the module ends with `if (window.MP && window.MP.register) { window.MP.register({ defaults: DEFAULTS, mount }); } else { mount(Object.assign({}, DEFAULTS)); }`, which runs the instant the module is evaluated — import time in a bundled app, before the component that renders `<canvas id="fluid">` has committed anything. `window.MP` is this catalogue's own editor bridge and won't exist in a React host, so this always falls to the `else` branch and finds no canvas to attach to. Delete the whole dispatch and move `mount`'s body into a `useEffect` with an empty dependency array, handing it this component's own props merged over `DEFAULTS` instead of the bare `DEFAULTS` copy.

*(2) Element lookups* — the only DOM query in the file is `document.getElementById("fluid")`, and `mount` does something unusual with the result before touching it: `canvas.cloneNode(false); canvas.replaceWith(fresh)`. That line exists because `destroy()` ends with `renderer.forceContextLoss()`, and a WebGL context that has been force-lost can never be reacquired from `getContext()` on that same `<canvas>` node — without the clone, a second mount against the surviving node renders solid black forever. Give the component a root `ref` on the `<canvas>` React itself renders, drop `getElementById`, and drop the clone-and-replace dance with it: it was a workaround for owning canvas creation and destruction by hand, and a `ref`-scoped effect doesn't need it — React hands you the same live node on every mount, and as long as your cleanup doesn't force-lose its context, that node stays reusable indefinitely.

*(3) Cleanup* — there is no GSAP, ScrollTrigger, Lenis, or SplitText anywhere in this file, and nothing here awaits a promise, so none of those patterns apply. What has to be undone by hand is the frame loop, and — unless you move to R3F below — the six render targets and nine materials, which `destroy()`'s `Object.values(this)` walk already disposes correctly; that logic doesn't need to change, only where it gets called from.

### The render loop has to be the one you can cancel

`_loop()` is self-scheduling: `tick()` reads `this.mouse.moved`, conditionally splats, runs `_simulate`/`_render`, then sets `this._frame = requestAnimationFrame(tick)` again, forever. Keep that handle and call `cancelAnimationFrame(this._frame)` in the cleanup, exactly as `destroy()` already does. Skip it and the StrictMode unmount leaves the first mount's loop alive, still reading `this.mouse` off a `FluidSimulation` instance the second mount has already replaced — the ink will visibly lag and double up.

### The touchmove listener has to stay a manual `addEventListener`, not a JSX prop

`_onTouchMove` calls `e.preventDefault()` so a finger dragging ink doesn't also scroll the page, and it only works because the listener is registered with `window.addEventListener("touchmove", this._onTouchMove, { passive: false })`. React's synthetic touch handlers are bound at the root as passive listeners, so a JSX `onTouchMove` prop calling `preventDefault()` is silently ignored by the browser and the page scrolls under the user's finger regardless. Keep this exact listener — manual `addEventListener` with the non-passive option, inside the effect, torn down the same way in the cleanup — instead of translating it into an `onTouchMove` prop on the canvas element.

### Mapping this scene to React Three Fiber

three 0.185 · `@react-three/fiber` 9 · `@react-three/drei` 10.7 · React 19. This scene is nine full-screen shader passes over an orthographic quad, not a lit 3D world, so most of the usual R3F win — declaring geometry and lights as JSX — doesn't apply the way it would for a modeled scene. What does carry over:

- `<Canvas orthographic camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1 }} gl={{ alpha: true }}>` replaces the manual `WebGLRenderer` / `Scene` / `OrthographicCamera` construction; the single full-screen quad can be declared once as `<mesh><planeGeometry args={[2, 2]} /></mesh>` with its material swapped imperatively per pass, the same way `this.quad.material = material` does today.
- `_loop()`'s `tick` becomes a `useFrame((_, delta) => { ... })` callback. Don't keep calling `requestAnimationFrame` yourself inside a `<Canvas>` — it already runs one frame loop, and a second one competing with it doubles the GPU work for no gain. Replace the hand-rolled `Date.now()`-based delta clamp with `useFrame`'s own `delta`, clamped the same way, so a tab that was backgrounded doesn't feed the solver one oversized step on return.
- The six render targets and nine `ShaderMaterial`s are **not** scene-graph objects — they're never attached to a mesh R3F renders, so R3F's automatic disposal (which only walks JSX-declared geometries and materials) never touches them. Keep constructing and disposing them by hand, inside the same effect that sets up `useFrame`, exactly the way `_setupTargets`/`_setupMaterials` and `destroy()` do now.
- Resize is mostly free: `<Canvas>` observes its own container and keeps the renderer's size in sync on its own. What it doesn't know about is `simSize`/`dyeSize`, which are derived from `width`/`height` once at construction and never revisited today — add your own resize handling (`useThree(({ size }) => size)` or a `ResizeObserver`) to recompute the aspect ratio and reallocate the six render targets when it actually changes, since `<Canvas>`'s own resize handling stops at the renderer and the camera.
- There's no `GLTFLoader` or texture load anywhere in this file — the entire visual is nine hand-written GLSL passes — so the usual "port `.load()` to a `use*` hook" step doesn't apply here.

**A static poster matters less here than for a modeled scene, but for a different reason.** Nothing in this component loads over the network and construction of the render targets and materials is synchronous, so there's no multi-second blank frame the way a heavy `.glb` would cause. The state that does need covering is the ordinary one: before the effect owning `useFrame` has run, or on a device where `THREE.HalfFloatType` render targets fail to allocate, the canvas should read as nothing — which is already this component's own idle look, since with `alpha: true` and no dye splatted yet the canvas is fully transparent and the plain hero shows through underneath. Don't paper over that gap with a loading spinner or a dark overlay; a transparent canvas over the plain type is both the correct "not ready yet" state and the correct "waiting for the pointer to move" state once it is.

**Drei's `Environment` doesn't come up here, and that's worth stating rather than leaving implicit.** Every pass in this file is a raw `ShaderMaterial` writing straight to `gl_FragColor` — there are no lights and no `MeshStandardMaterial` for an HDRI to illuminate. If a future variant of this hero adds a lit object behind the ink (a debug plane, a background mesh), reach for explicit lights or a self-hosted HDRI, not `<Environment preset="...">`: the presets fetch from a third-party CDN hard-coded into drei, and the scene renders unlit the moment that host is unreachable.
