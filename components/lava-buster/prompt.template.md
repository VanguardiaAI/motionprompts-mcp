---
slug: lava-buster
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Lava Buster — GPU Particle-Fluid Blaster (Three.js / GLSL)

## Goal
Build a **full-screen WebGL background** that looks like molten lava. Thousands of glowing
particles are continuously **blasted out from the exact center of the screen**, swirl and stream
outward like incandescent fluid, and **react to the cursor**: moving the mouse aims the field and
**holding the mouse button down** injects a spinning vortex of force around the pointer. The whole
thing is a multi-pass GLSL simulation running in ping-pong float render targets — glowing
orange filaments (`rgb 1.0, 0.3, 0.1`) on pure black, brightest where the flow curls. Minimal
nav/footer text overlays sit on top. The star of this piece is the shader simulation, not any DOM
animation.

## Tech
- Vanilla **HTML / CSS / JS** with ES module imports, bundled by **Vite** (`npm`).
- **`three` (npm) is the ONLY JS dependency.** The entire effect is a hand-written multi-pass
  fragment-shader simulation on `THREE.WebGLRenderTarget`s.
- **No GSAP, no ScrollTrigger, no SplitText, no Lenis, no CustomEase.** There is zero tween-library
  code. All motion is a bare `requestAnimationFrame` loop advancing custom GLSL shaders. Do not
  reach for any animation library — the "easing" is entirely the physics inside the shaders.
- Ship the GLSL as exported template strings from a `shaders.js` module (`bufferAShader`,
  `bufferBShader`, `imageShader`) and import them into `script.js`.
- Font: **DM Mono** with a generic `monospace` fallback, for the overlay labels (the only type on the page).

## Layout / HTML
Dead simple. The body holds only two fixed text overlays; the `<canvas>` is created and appended by
JS (`renderer.domElement`), so it is NOT in the HTML.

```html
<body>
  <nav>
    <div class="nav-items"><a href="#">Motionprompts</a></div>
    <div class="nav-items"><a href="#">/Experiment 0381</a></div>
  </nav>

  <footer>
    <p>Unlock Source Code with PRO</p>
    <p>Link in Description</p>
  </footer>

  <script type="module" src="./script.js"></script>
</body>
```

## Styling
- **Reset:** `* { margin:0; padding:0; box-sizing:border-box }`.
- **body:** `width:100vw; height:100vh; overflow:hidden; font-family:"DM Mono", ui-monospace, monospace; background: var(--bg); color: var(--text)`. No background
  color is needed — the WebGL canvas fills the viewport and the shader paints pure black behind the
  glowing particles.
- **nav & footer:** `position:fixed; left:0; width:100vw; padding:2em; display:flex;
  justify-content:space-between; z-index:2`. `nav { top:0 }`, `footer { bottom:0 }`. They must sit
  ABOVE the canvas (`z-index:2`; the canvas defaults to `z-index:auto`).
- **a, p:** `text-decoration:none; text-transform:uppercase; color: var(--text); font-size:12px`. Palette: `--bg:#050506`, `--text:#f2f2f0`, `--muted:#8c8c88`, `--ember:#ff5a1f`, `--amber:#ffab3d` — the two warm values belong to the simulation, not to the chrome.
- **`.nav-items:nth-child(2)`** (and the footer's right item): right-aligned
  (`display:flex; justify-content:flex-end`) with `opacity:0.5`.
- The canvas from `renderer.setSize(innerWidth, innerHeight)` gets inline `width/height` styles that
  cover the full viewport; leave it at default stacking so the overlays float on top.

## The star effect — multi-pass GLSL particle-fluid simulation (be exact)

This is a direct GLSL port (Shadertoy-style multi-buffer pipeline). Reproduce the passes, the exact
uniform wiring, and every constant. There are **five render passes per frame** plus a final blit.

### Renderer, camera, scene
- `renderer = new THREE.WebGLRenderer({ antialias: true })`;
  `renderer.setSize(innerWidth, innerHeight)`; `renderer.setPixelRatio(devicePixelRatio)`;
  `document.body.appendChild(renderer.domElement)`.
- `camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)` — shared by every pass.
- **`RESOLUTION_SCALE = 2`.** Simulation grid size is
  `size = new THREE.Vector2(round(innerWidth*2), round(innerHeight*2))` — i.e. the sim runs at 2×
  CSS resolution, independent of `devicePixelRatio`. `size` is passed to every buffer as
  `iResolution` and drives all `gl_FragCoord` math.
- A final `THREE.Scene` holds one full-screen `Mesh(new PlaneGeometry(2, 2))` whose material has an
  explicit passthrough vertex+fragment shader (below) to blit the composited texture to screen.

### Render targets (float, ping-pong)
Every buffer target is
`new THREE.WebGLRenderTarget(size.x, size.y, { minFilter: LinearFilter, magFilter: LinearFilter, format: RGBAFormat, type: FloatType })`.
Float type is required for solver stability (HalfFloatType is an acceptable fallback if full-float
is not renderable on the device).

Create a `createBuffer(size, fragmentShader)` helper returning `{ scene, target, material, mesh }`
where `material` is a `THREE.ShaderMaterial` **with only a `fragmentShader`** (no vertexShader — rely
on Three's default ShaderMaterial vertex shader; the frag passes use `gl_FragCoord.xy` directly, no
varyings). Its uniforms are:
```
iChannel0: null, iChannel1: null, iChannel2: null,
iResolution: size (the shared Vector2),
iMouse: mousePosition (a shared THREE.Vector4),
iTime: 0, iFrame: 0
```
The mesh is `Mesh(PlaneGeometry(2,2), material)` added to the buffer's own scene.

A `createDoubleBuffer(size, shader)` returns `{ read, write, swap() }` where `read`/`write` are each
a `createBuffer` and `swap()` exchanges them. Build:
- `bufferA` = double buffer using **`bufferAShader`** (particle integrator).
- `bufferB`, `bufferC`, `bufferD` = three **separate** double buffers, all using **`bufferBShader`**
  (density/pressure field). (C and D are part of the original pipeline; C feeds a branch test and D
  is fed but unused — create all three to stay identical.)
- `imageBuffer` = a single `createBuffer` using **`imageShader`** (final color composite).

### Shared GLSL macros (top of `bufferAShader`, `bufferBShader`, `imageShader`)
```glsl
#define size iResolution.xy
#define SAMPLE(a, p, s) texture((a), (p)/s)         // sample by pixel coord, normalized by size
float gauss(vec2 x, float r){ return exp(-pow(length(x)/r, 2.0)); }
const float radius = 2.0;
```

### Pass 1 — `bufferAShader` (particle position + velocity integrator)
Each texel stores one particle: `U.xy = position (in sim pixels)`, `U.zw = velocity`.
Uniforms used: `iChannel0` (self, previous A), `iChannel1` (bufferB field), `iResolution`, `iMouse`,
`iTime`, `iFrame`. Constants (with `#define SPEED` and `#define BLASTER` both active):
```glsl
#define dt 8.5              // SPEED branch
#define P  0.01             // SPEED branch
#define particle_density 1.0
#define minimal_density 0.8
```
Helpers:
```glsl
// nearest-particle gather: adopt a neighbor's particle if it lands closer to this cell (toroidal)
void Check(inout vec4 U, vec2 pos, vec2 dx){
  vec4 Unb = SAMPLE(iChannel0, pos+dx, size);
  vec2 rpos1 = mod(pos - Unb.xy + size*0.5, size) - size*0.5;
  vec2 rpos2 = mod(pos - U.xy   + size*0.5, size) - size*0.5;
  if(length(rpos1) < length(rpos2)) U = Unb;
}
vec4 B(vec2 pos){ return 5.0 * SAMPLE(iChannel1, pos, size); }   // bufferB field, x5
```
`main`:
```glsl
vec2 pos = gl_FragCoord.xy;
vec4 U = SAMPLE(iChannel0, pos, size);
// gather from all 8 neighbors so particles migrate between cells:
Check(U,pos,vec2(-1,0)); Check(U,pos,vec2(1,0)); Check(U,pos,vec2(0,-1)); Check(U,pos,vec2(0,1));
Check(U,pos,vec2(-1,-1)); Check(U,pos,vec2(1,1)); Check(U,pos,vec2(1,-1)); Check(U,pos,vec2(-1,1));
U.xy = mod(U.xy, size);
// respawn a particle at this cell if the gathered one is too far (toroidal dist > 1/0.8 = 1.25):
if(length(mod(pos - U.xy + size*0.5, size) - size*0.5) > 1.0/minimal_density) U.xy = pos;

vec2 ppos = U.xy;
// pressure = gradient of bufferB's .z channel around the particle:
vec2 pressure = vec2(B(ppos+vec2(1,0)).z - B(ppos+vec2(-1,0)).z,
                     B(ppos+vec2(0,1)).z - B(ppos+vec2(0,-1)).z);

// --- CURSOR VORTEX (only while mouse button is held: iMouse.z > 0) ---
if(iMouse.z > 0.0){
  float k = gauss(ppos - iMouse.xy, 25.0);        // gaussian, radius 25 px around cursor
  U.zw = U.zw*(1.0-k) + k*0.2*vec2(cos(0.02*iTime*dt), sin(0.02*iTime*dt)); // blend toward a spinning velocity
}

// --- CENTER BLASTER (always on): continuous emission from screen center ---
U.zw += 0.002*vec2(cos(0.01*iTime*dt), sin(0.01*iTime*dt)) * gauss(ppos - size*vec2(0.5,0.5), 8.0) * dt;

U.zw = U.zw * 0.9995;          // velocity damping
U.zw += P * pressure * dt;     // accelerate down the pressure gradient
vec2 velocity = U.zw;          // (a "0.*B(ppos).xy +" term is present but zeroed)
U.xy += dt * velocity;         // integrate position
U.xy = mod(U.xy, size);        // wrap toroidally

// initial grid seed (frame 0); in practice particles are seeded by the respawn line above too:
if(iFrame < 1.0){
  if(mod(pos, vec2(1.0/particle_density)).x < 1.0 && mod(pos, vec2(1.0/particle_density)).y < 1.0)
    U = vec4(pos, 0.0, 0.0);
}
gl_FragColor = U;
```
Key feel: the two angular terms — `0.02*iTime*dt` (cursor) and `0.01*iTime*dt` (blaster) — make the
injected velocity **slowly rotate over time**, so the fountain sweeps and the cursor swirl spins.
The `*dt` (8.5) makes it energetic; `0.9995` damping keeps it from exploding.

### Pass 2/3/4 — `bufferBShader` (density + pressure/wave field), used by bufferB, bufferC, bufferD
Uniforms: `iChannel0` (bufferA particles, current-frame write), `iChannel1` (self, previous),
`iResolution`. Helpers:
```glsl
vec4 B(vec2 pos){ return SAMPLE(iChannel1, pos, size); }   // self, previous state
vec3 pdensity(vec2 pos){
  vec4 p = SAMPLE(iChannel0, pos, size);                   // a particle's velocity(zw)+position(xy)
  return vec3(p.zw, gauss(pos - p.xy, 0.7*radius));        // (vel.x, vel.y, density falloff of that particle)
}
const vec2 damp = vec2(0.0, 0.01);   // present, unused
const vec2 ampl = vec2(0.1, 1.0);
```
`main`:
```glsl
vec2 pos = gl_FragCoord.xy;
vec3 density = pdensity(pos);
vec4 u;
u.xyz = 0.5 * density;               // x,y = half velocity; z temporarily half density
float div = B(pos+vec2(1,0)).x - B(pos-vec2(1,0)).x + B(pos+vec2(0,1)).y - B(pos-vec2(0,1)).y;
// diffuse (blur+decay) the z,w channels from the 4 neighbors, then inject divergence & density:
u.zw = (1.0-0.001)*0.25*(B(pos+vec2(0,1)) + B(pos+vec2(1,0)) + B(pos-vec2(0,1)) + B(pos-vec2(1,0))).zw;
u.zw += ampl*vec2(div, density.z);   // z += 0.1*div ; w += density
gl_FragColor = u;
```
This is a lightweight wave/pressure propagation: `u.z` (the pressure the particle pass reads back as
`B(...).z`) diffuses across neighbors and is driven by the velocity-field divergence; `u.x,u.y` carry
the smoothed velocity used to compute divergence and vorticity.

### Pass 5 — `imageShader` (final color composite → imageBuffer)
Uniforms: `iChannel0` (bufferA particles, current write), `iChannel1` (bufferB field, current write),
`iChannel2` (bufferC field, current write). Same `B`/`pdensity` helpers as above.
```glsl
vec2 pos = gl_FragCoord.xy;
vec3 density = pdensity(pos);                 // from iChannel0
vec4 blur = SAMPLE(iChannel1, pos, size);     // bufferB
float vorticity = B(pos+vec2(1,0)).y - B(pos-vec2(1,0)).y
                - B(pos+vec2(0,1)).x + B(pos-vec2(0,1)).x;   // curl of the velocity field

vec4 fragColor;
if(texture2D(iChannel2, vec2(38,2)/256.0).x > 0.5){
  // debug/alt branch — in practice this texel is < 0.5, so this is NOT taken:
  fragColor = vec4(2.0*density.z*(7.0*abs(density.xyy)+vec3(0.2,0.1,0.1)), 1.0);
  fragColor = vec4(10.0*abs(density.xyy) + 30.0*vec3(0,0,abs(blur.z)), 1.0);
} else {
  // ACTIVE RENDER PATH — molten-lava glow proportional to vorticity:
  float l1 = 490.0 * abs(vorticity);
  float l2 = 1.0 - l1;
  fragColor = vec4(vec3(1.0, 0.3, 0.1)*l1 + 0.0*vec3(0.1,0.1,0.1)*l2, 1.0);
}
gl_FragColor = fragColor;
```
So the visible image is **`vec3(1.0, 0.3, 0.1)` (molten orange) × 490 × |vorticity|** on black:
particles glow hot where the flow curls hardest, fading to black in calm regions.

### Final blit shader (the screen `Mesh` material — explicit vertex + fragment)
```glsl
// vertex
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
// fragment
uniform sampler2D tDiffuse; varying vec2 vUv;
void main(){ gl_FragColor = texture2D(tDiffuse, vUv); }
```

### Input handling (shared `mousePosition = new THREE.Vector4()`)
- `mousemove` (on `window`): `mousePosition.x = event.clientX * RESOLUTION_SCALE`;
  `mousePosition.y = (innerHeight - event.clientY) * RESOLUTION_SCALE` (Y flipped into GL space,
  scaled by 2). This is `iMouse.xy` in sim pixels.
- `mousedown`: `mousePosition.z = 1` (arms the cursor vortex). `mouseup`: `mousePosition.z = 0`.
- The same `mousePosition` Vector4 is passed by reference as the `iMouse` uniform of every buffer, so
  updates are picked up live.

### Per-frame loop (`animate()` via `requestAnimationFrame`) — exact order & wiring
```
time = performance.now() * 0.001;  frame++;   // frame starts at 0

// 1) bufferA (particles): iChannel0 = bufferA.read.tex, iChannel1 = bufferB.read.tex,
//    iTime = time, iFrame = frame  →  render to bufferA.write
// 2) bufferB (field):     iChannel0 = bufferA.write.tex, iChannel1 = bufferB.read.tex → bufferB.write
// 3) bufferC (field):     iChannel0 = bufferA.write.tex, iChannel1 = bufferC.read.tex → bufferC.write
// 4) bufferD (field):     iChannel0 = bufferA.write.tex, iChannel1 = bufferD.read.tex → bufferD.write
// 5) imageBuffer:         iChannel0 = bufferA.write.tex, iChannel1 = bufferB.write.tex,
//                         iChannel2 = bufferC.write.tex  →  render to imageBuffer.target
// 6) setRenderTarget(null); finalQuad.tDiffuse = imageBuffer.target.texture; render final scene to screen
// 7) bufferA.swap(); bufferB.swap(); bufferC.swap(); bufferD.swap();
```
Each pass = point the buffer's material at the right input textures,
`renderer.setRenderTarget(buffer.write.target)`, `renderer.render(buffer.write.scene, camera)`. Only
bufferA receives fresh `iTime`/`iFrame` each frame (bufferBShader ignores them). There are **no
tween durations, eases, delays or staggers anywhere** — timing is purely per-frame integration with
`dt = 8.5` and the `0.9995` / `0.999` decay factors.

### Resize
On `window resize`: recompute `width = round(innerWidth*2)`, `height = round(innerHeight*2)`;
`renderer.setSize(innerWidth, innerHeight)`; for every double buffer call `read.target.setSize` and
`write.target.setSize` and `iResolution.value.copy(newSize)`; do the same for `imageBuffer`.

## Assets / images
**None.** There are zero image assets — the entire visual is generated in the shaders (black
background, orange vorticity glow). No textures, no sprites, no fonts beyond the overlay labels.

## Behavior notes
- **Desktop, pointer-driven, full-screen background.** It runs continuously and forever: the center
  blaster emits every frame, so the field is alive even with the mouse idle. Moving the mouse steers
  it; **holding the button down** spins a vortex around the cursor.
- Give it a moment to build up — the field ramps over the first ~3–4 seconds from black to a full
  churning lava fountain (matches a ~3500 ms preview wait).
- **Heavy GPU cost** (five full-resolution float passes per frame at 2× CSS resolution). It is
  **not mobile-safe**; treat it as a desktop-only hero/background. No `prefers-reduced-motion`
  handling exists in the original.
- Float render targets (`type: FloatType`, `LinearFilter`) are essential; the ping-pong `swap()` on
  all four double buffers each frame is what carries state forward.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--text`, `--muted`, `--ember`, `--amber`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. Setup that runs twice with teardown that runs never leaves you two of
everything — here that means two `WebGLRenderer`s fighting for the same GPU and two independent
`requestAnimationFrame` chains both stepping the same five-pass simulation forward every frame.
The visible symptom is not a doubled tween, it is a second `<canvas>` silently stacked on the
first and a WebGL context nothing ever tears down. It will not reproduce in a production build,
because React only does the double mount in development. Treat the cleanup as part of the effect,
not as an afterthought.

*(1) The entry point* — The script runs at the top level: `init(); animate();` execute the moment
the module is evaluated, before a React component has rendered anything to mount a canvas into.
Move that pair of calls into a `useEffect` with an empty dependency array — not into the component
body, which would call `init()` (and its `WebGLRenderTarget` allocations) again on every render.

*(2) Element lookups* — There is no `document.querySelector` here, but the same ownership problem
shows up as `document.body.appendChild(renderer.domElement)`: the canvas wires itself to the whole
document rather than to anything this component owns. Give the component a root `ref` — a `<div>`
sized to fill its container — and append `renderer.domElement` to `ref.current` instead. The
`mousemove`/`mousedown`/`mouseup`/`resize` listeners staying on `window` is correct for a
full-viewport background (there is no smaller element to bind them to); the risk is not where
they attach but that a second, unremoved set from the first StrictMode mount keeps firing into
buffers the second mount has already replaced.

*(3) Cleanup* — `renderer`, `camera`, `bufferA`…`bufferD`, `imageBuffer`, `mousePosition` and
`frame` are `let` bindings at module scope today, shared by `init`, `animate`, `onWindowResize`
and the mouse handlers. That is fine for a script loaded once; inside a component it means a
second effect run calls `init()` again and quietly overwrites those bindings with a second
renderer, a second orthographic camera and a second set of five render targets, while the first
renderer's canvas — already appended to the DOM — and its buffers are never freed, because nothing
in this file calls `renderer.dispose()` or `target.dispose()`. Move all of that state inside the
effect so each mount owns its own disposable instance. One concrete trap while you're in there:
the `mousedown` and `mouseup` listeners are anonymous arrows passed straight to
`addEventListener`, unlike the named `onMouseMove`/`onWindowResize` — there is no reference left to
hand `removeEventListener`, so name them before attaching or they cannot be torn down at all.

Everything the effect creates must be undone in the function it returns. The test of a correct
adaptation is not that it looks right on first load — it is that you can navigate away to another
route and come back and nothing has accumulated.

**rAF propio** — `animate()` reschedules itself with `requestAnimationFrame(animate)` at the top
of its own body, and every one of those frames writes into `bufferA.write` through
`imageBuffer.target` and then calls `swap()` on all four double buffers. Keep the id the initial
`requestAnimationFrame(animate)` call returns and cancel it in the cleanup. Skipping this doesn't
just waste a frame callback the way an idle rAF loop would elsewhere — this loop is still holding
render-target textures and calling `renderer.setRenderTarget` on a renderer the next mount no
longer references, so the leaked chain keeps consuming a full five-pass GPU budget for a component
that is no longer on screen.

**If your host app is React**, this component's imperative Three.js setup maps onto
`@react-three/fiber` rather than being ported line by line:

- The renderer and the shared `OrthographicCamera(-1, 1, 1, -1, 0, 1)` stop being yours: a
  `<Canvas orthographic camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1 }}>` owns
  them. Delete the `new THREE.WebGLRenderer` block and the `document.body.appendChild` call. The
  final blit doesn't disappear, it becomes declarative: the `finalScene`/`finalQuad` plane that
  samples `imageBuffer`'s texture becomes the actual JSX content of the `Canvas` — a `<mesh>` with
  a full-screen `<planeGeometry>` and a shader material reading the composited texture — since
  that plane is exactly the scene a `Canvas` renders by default once your manual passes have run.
- `animate()`'s body — the five `setRenderTarget`/`render` calls in order, then the four `swap()`
  calls — becomes the body of a single `useFrame`. Do not keep the manual
  `requestAnimationFrame(animate)` chain running alongside a `Canvas`: that runs a second,
  unsynchronized clock against the same GPU work R3F's own frame loop already drives, and the two
  will race over `renderer.setRenderTarget`.
- The nine render targets behind this scene — the `read`/`write` pair for each of `bufferA`
  through `bufferD`, plus the single `imageBuffer` target — never appear as JSX, so R3F's automatic
  disposal never reaches them. Allocate them with `useMemo` and dispose every one of them yourself
  in the same cleanup that owns the `useFrame` logic; this is the same leak as the vanilla-React
  case above, just triggered by unmount instead of a route change.
- Resize is partly handled for you: `<Canvas>` observes its container and resizes the visible
  viewport, but it knows nothing about the simulation grid. `onWindowResize`'s
  `Math.round(innerWidth * RESOLUTION_SCALE)` sizing of the nine render targets and the four
  `iResolution` uniforms still needs its own effect (or resize-observer hook) keyed on the
  container size.
- **A static poster is mandatory, not a nicety.** This scene compiles three custom fragment
  shaders across nine float-type render targets before the first visible frame, and even once
  that frame lands the field still needs a few seconds to build from black into the full lava
  fountain described above. Show a poster (or just the black frame this shader converges from) in
  the same box and swap it once `frame` has advanced past that initial ramp.
- **Do not reach for drei's `Environment` with a preset.** This scene has no lighting model to
  feed one into — every pass writes a raw `vec4` into a float target, and the final composite is
  the hand-authored `vec3(1.0, 0.3, 0.1)` scaled by vorticity, not a lit material reacting to an
  HDRI. If a later revision adds a decorative element behind the shader plane, resist lighting it
  with a preset for the reason the general rule exists anyway: presets are fetched from a
  third-party CDN hard-coded inside drei, and this component would then depend on a host neither
  you nor this catalogue controls for something as small as ambient fill light.
