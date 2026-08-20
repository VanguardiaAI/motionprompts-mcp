# Water Ripple Text Simulation — build prompt

## Goal
Build a full-screen hero for a fictional product studio called **"Soft Horizon"**. The whole viewport is a WebGL water surface: a giant canvas-drawn wordmark (**"softhorizon"**) sits under a real-time **wave simulation**, and as the pointer moves across the screen the cursor injects pressure into the fluid, leaving **rippling wakes that refract the text and throw off bright specular glints**, like poking the surface of a still pool. Nav and footer text float above the water. The star effect is the physics itself: a double-buffered (ping-pong) GPU wave-equation solver whose gradient field distorts and lights the text every frame. **No GSAP, no scroll** — everything is driven by `mousemove` on the canvas plus a `requestAnimationFrame` loop.

## Tech
Vanilla HTML/CSS/JS with ES module imports. The only runtime dependency is **`three`** (npm), imported as `import * as THREE from "three"`. There is **no GSAP, no Lenis, no scroll library**. Assume a fresh Vite project with `three` installed via npm.

Split the code into four files:
- `index.html`
- `styles.css`
- `script.js` — the Three.js app (`<script type="module" src="./script.js">`), wrapped in a `DOMContentLoaded` listener.
- `shaders.js` — a small module that exports **four** GLSL strings: `simulationVertexShader`, `simulationFragmentShader`, `renderVertexShader`, `renderFragmentShader`. Imported by `script.js`.

## Layout / HTML
Two fixed UI layers over the canvas; the `<canvas>` is created and appended to `<body>` by JS at runtime.

```
nav
  .logo > p            → "Soft Horizon"
  .nav-items
    p ×3               → "Product", "Concept", "Partners"
    button             → "Try now"
footer
  h1                   → "Expanding perspectives with serene and boundless possibilities"
  .footer-links
    p ×2               → "Sign Up", "Log In"
```

## Styling
- Font: a **bold neo-grotesque sans-serif**. The original uses `"Test Söhne"`; any similar grotesque (Söhne / Helvetica Neue / Inter / Arial) is fine as long as a **bold** weight is available for the canvas text. `body { font-family: "Test Söhne", sans-serif; }`.
- Colors — only two, and they are load-bearing (the canvas reuses the exact same hexes so the WebGL surface blends into the page):
  - Background **orange** `#fb7427`.
  - Text / foreground **pale cream-yellow** `#fef4b8`.
- Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`.
- `body`: `width:100%; height:100%; background:#fb7427; color:#fef4b8;`
- `h1`: `font-size:36px; font-weight:400; line-height:1.25;`
- `p`: `font-size:15px; line-height:1.25;`
- `nav`: `position:fixed; top:0; left:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center; z-index:2;`
- `.nav-items`: `display:flex; align-items:center; gap:2em;`
- `button`: `outline:none; border:2px solid #fef4b8; border-radius:2em; color:#fef4b8; background:transparent; font-family:"Test Söhne"; font-size:15px; padding:0.5em 1em;`
- `footer`: `position:fixed; bottom:0; left:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:flex-end; z-index:2;`
- `footer h1`: `width:40%;`
- `.footer-links`: `display:flex; gap:2em;`
- `canvas`: `position:fixed; top:0; left:0; width:100vw; height:100vh;` (it sits at the default `z-index`, below the `z-index:2` nav/footer).

## The effect (be exhaustive — this is the whole component)

The technique is a **ping-pong wave simulation**: each frame, a simulation shader reads the previous water state from render target A and writes the new state into render target B; then a render shader samples B to refract and light a text texture onto the screen; then A and B are swapped. The water state is stored in an **RGBA float texture** where the four channels mean: **R = pressure (height), G = pressure velocity, B = ∂pressure/∂x (x gradient), A = ∂pressure/∂y (y gradient)**.

### Renderer / scenes / camera
- **Two scenes:** `scene` (final on-screen pass) and `simScene` (off-screen simulation pass).
- `camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)` — maps a `[-1,1]` quad to the full viewport (shared by both passes).
- `renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })`.
  - **`renderer.outputColorSpace = THREE.LinearSRGBColorSpace;`** — critical. Disable sRGB output encoding so shader output is written to the framebuffer verbatim and the `#fb7427` / `#fef4b8` colors match the CSS exactly (mirrors the old three r128 pipeline). Without this the orange/cream will look washed out.
  - `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));`
  - `renderer.setSize(window.innerWidth, window.innerHeight);`
  - Append `renderer.domElement` to `document.body`.
- `const mouse = new THREE.Vector2();` and `let frame = 0;`

### Render targets (the double buffer)
- Compute simulation resolution at **full device pixel ratio** (not the capped renderer ratio):
  `const width = window.innerWidth * window.devicePixelRatio;`
  `const height = window.innerHeight * window.devicePixelRatio;`
- Options: `{ format: THREE.RGBAFormat, type: THREE.FloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, stencilBuffer: false, depthBuffer: false }`. **`FloatType` is required** — the wave state needs full-precision floats.
- `let rtA = new THREE.WebGLRenderTarget(width, height, options);`
  `let rtB = new THREE.WebGLRenderTarget(width, height, options);` (declared with `let` so they can be swapped).

### Materials & quads
- `simMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: simulationVertexShader, fragmentShader: simulationFragmentShader })` with uniforms:
  - `textureA: { value: null }` (the previous water state)
  - `mouse: { value: mouse }` (the shared Vector2, in device pixels)
  - `resolution: { value: new THREE.Vector2(width, height) }`
  - `time: { value: 0 }`
  - `frame: { value: 0 }`
- `renderMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: renderVertexShader, fragmentShader: renderFragmentShader, transparent: true })` with uniforms:
  - `textureA: { value: null }` (new water state)
  - `textureB: { value: null }` (the text texture)
- `const plane = new THREE.PlaneGeometry(2, 2);`
- `simQuad = new THREE.Mesh(plane, simMaterial);` → `simScene.add(simQuad);`
- `renderQuad = new THREE.Mesh(plane, renderMaterial);` → `scene.add(renderQuad);`

### The text texture (canvas-drawn wordmark)
Draw the wordmark once into a 2D canvas and wrap it as a `CanvasTexture` — this is the image the water refracts (there are **no image files**).
- Create a `<canvas>` sized `width × height` (the DPR-scaled sim size), get `ctx = canvas.getContext("2d", { alpha: true })`.
- Fill the whole canvas with the **orange** background first: `ctx.fillStyle = "#fb7427"; ctx.fillRect(0, 0, width, height);`.
- `const fontSize = Math.round(250 * window.devicePixelRatio);`
- `ctx.fillStyle = "#fef4b8";` (cream text)
- `ctx.font = \`bold ${fontSize}px Test Söhne\`;`
- `ctx.textAlign = "center"; ctx.textBaseline = "middle";`
- `ctx.textRendering = "geometricPrecision"; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";`
- `ctx.fillText("softhorizon", width / 2, height / 2);` — one lowercase word, centered, huge.
- `const textTexture = new THREE.CanvasTexture(canvas);` then `textTexture.minFilter = THREE.LinearFilter; textTexture.magFilter = THREE.LinearFilter; textTexture.format = THREE.RGBAFormat;`

### Pointer input (on `renderer.domElement`)
- `mousemove`: convert to **device pixels with a Y flip** (WebGL origin is bottom-left):
  `mouse.x = e.clientX * window.devicePixelRatio;`
  `mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio;`
- `mouseleave`: `mouse.set(0, 0);` — parks the pointer at the origin, which disables ripple injection (the sim gates on `mouse.x > 0`).

### The render loop (ping-pong — reproduce this order exactly)
`const animate = () => { ... requestAnimationFrame(animate); }` called once. Each frame:
1. `simMaterial.uniforms.frame.value = frame++;` (post-increment — first frame passes `0`).
2. `simMaterial.uniforms.time.value = performance.now() / 1000;`
3. **Simulation pass:** `simMaterial.uniforms.textureA.value = rtA.texture;` → `renderer.setRenderTarget(rtB); renderer.render(simScene, camera);` (reads A, writes the new state into B).
4. **Screen pass:** `renderMaterial.uniforms.textureA.value = rtB.texture; renderMaterial.uniforms.textureB.value = textTexture;` → `renderer.setRenderTarget(null); renderer.render(scene, camera);` (samples the fresh state B + the text, draws to the canvas).
5. **Swap:** `const temp = rtA; rtA = rtB; rtB = temp;` (B becomes the "previous" for next frame).

### Simulation vertex & render vertex shaders (identical pass-throughs)
```glsl
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Simulation fragment shader (the wave equation — reproduce the math exactly)
Uniforms: `sampler2D textureA`, `vec2 mouse`, `vec2 resolution`, `float time`, `int frame`; varying `vec2 vUv`. Constant: `const float delta = 1.4;` (the simulation timestep).

```glsl
vec2 uv = vUv;
if (frame == 0) { gl_FragColor = vec4(0.0); return; }   // clear the buffer on the very first frame

vec4 data = texture2D(textureA, uv);
float pressure = data.x;
float pVel     = data.y;

vec2 texelSize = 1.0 / resolution;
float p_right = texture2D(textureA, uv + vec2( texelSize.x, 0.0)).x;
float p_left  = texture2D(textureA, uv + vec2(-texelSize.x, 0.0)).x;
float p_up    = texture2D(textureA, uv + vec2(0.0,  texelSize.y)).x;
float p_down  = texture2D(textureA, uv + vec2(0.0, -texelSize.y)).x;

// Neumann (reflective) boundaries: mirror the neighbor at each edge
if (uv.x <= texelSize.x)        p_left  = p_right;
if (uv.x >= 1.0 - texelSize.x)  p_right = p_left;
if (uv.y <= texelSize.y)        p_down  = p_up;
if (uv.y >= 1.0 - texelSize.y)  p_up    = p_down;

// Laplacian → acceleration on the pressure-velocity (split into x and y halves)
pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
pVel += delta * (-2.0 * pressure + p_up   + p_down) / 4.0;

// integrate height
pressure += delta * pVel;

// restoring force toward zero (spring) + velocity damping + pressure damping
pVel     -= 0.005 * delta * pressure;
pVel     *= 1.0 - 0.002 * delta;
pressure *= 0.999;

// pointer injection: a small circular pressure bump under the cursor
vec2 mouseUV = mouse / resolution;
if (mouse.x > 0.0) {
    float dist = distance(uv, mouseUV);
    if (dist <= 0.02) {
        pressure += 2.0 * (1.0 - dist / 0.02);   // radius 0.02, peak +2.0 at the exact pointer
    }
}

// pack: R=pressure, G=velocity, B=x-gradient, A=y-gradient
gl_FragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
```
Notes on the constants (they define the feel): `delta = 1.4` timestep; wave speed from the averaged 5-point Laplacian; `-0.005*delta*pressure` pulls the surface back to flat; `*= 1.0 - 0.002*delta` bleeds off velocity; `*= 0.999` slowly damps height so ripples fade to stillness; injection radius `0.02` (in UV space) with linear falloff to peak `+2.0` — a **small, sharp, intense** poke that spreads outward as a ring.

### Render fragment shader (refraction + specular — reproduce exactly)
Uniforms: `sampler2D textureA` (water state), `sampler2D textureB` (text texture); varying `vec2 vUv`.

```glsl
vec4 data = texture2D(textureA, vUv);

// refraction: offset the text-sample UV by the water's gradient (B,A channels)
vec2 distortion = 0.3 * data.zw;
vec4 color = texture2D(textureB, vUv + distortion);

// build a surface normal from the gradient and light it for a specular glint
vec3 normal   = normalize(vec3(-data.z * 2.0, 0.5, -data.w * 2.0));
vec3 lightDir = normalize(vec3(-3.0, 10.0, 3.0));
float specular = pow(max(0.0, dot(normal, lightDir)), 60.0) * 1.5;

gl_FragColor = color + vec4(specular);   // refracted text + additive white highlight
```
So the visible ripples come from two things at once: the **`0.3 * gradient` UV displacement** that warps the wordmark, and the **tight `pow(...,60.0) * 1.5` specular** that paints bright white crests along the wave slopes.

### Resize (`window` `resize`)
Recompute `newWidth = innerWidth * devicePixelRatio`, `newHeight = innerHeight * devicePixelRatio`, then:
- `renderer.setSize(innerWidth, innerHeight);`
- `rtA.setSize(newWidth, newHeight); rtB.setSize(newWidth, newHeight);`
- `simMaterial.uniforms.resolution.value.set(newWidth, newHeight);`
- **Redraw the text canvas at the new size**: resize the canvas, re-fill `#fb7427`, recompute `fontSize = round(250 * devicePixelRatio)`, reset the cream `bold …px` font + center alignment, `fillText("softhorizon", newWidth/2, newHeight/2)`, then `textTexture.needsUpdate = true;`

## Assets / images
**None** — there are zero image files. The only "texture" is the wordmark rendered into a 2D canvas at runtime (see *The text texture*). Do not add any `<img>` or external asset.

## Behavior notes
- **Desktop, pointer-driven.** No scroll, click, or keyboard interaction. On `mouseleave` the cursor parks at `(0,0)` so injection stops and the existing ripples simply damp out to a flat surface.
- The simulation runs **forever** at rAF cadence; the surface starts flat (`frame == 0` clears both buffers) and only comes alive under pointer motion.
- **Performance is heavy / not mobile-safe:** two full-viewport `FloatType` render targets at the raw (uncapped) device pixel ratio, plus two render passes per frame. `FloatType` render targets require float-texture support (`OES_texture_float` / WebGL2). There is no reduced-motion branch in the original.
- Keep the two hexes (`#fb7427`, `#fef4b8`) identical between CSS, the canvas fill/text, and rely on `LinearSRGBColorSpace` so the WebGL water and the HTML page read as one continuous orange field.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--sea-deep`, `--foam`, `--mist`, `--spume`, `--coral`, `--coral-bright`, `--serif`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that waits on `DOMContentLoaded`, builds a full-viewport `WebGLRenderer` and appends its canvas straight onto `document.body`, draws the wordmark into an offscreen 2D canvas, and drives a two-pass ping-pong simulation with a hand-rolled `requestAnimationFrame` loop — and none of it expects to run more than once. React withdraws that guarantee, and the fault line runs through exactly the parts that own GPU state and DOM nodes at once: the renderer/scene/camera construction, the pair of `WebGLRenderTarget`s (`rtA`/`rtB`) swapped every frame, the `CanvasTexture` redrawn once `document.fonts.ready` resolves, and the `animate` loop itself.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two `<canvas>` elements stacked in `<body>` — each one a full-viewport orthographic scene running its own `animate` loop against its own `rtA`/`rtB` pair — plus two `resize` listeners on `window` and two independent wave simulations each holding a `FloatType` render target at the raw, uncapped device pixel ratio. The visible symptom is the page getting heavier and the ripple slower every time this route remounts, and it will not reproduce in a production build, because only development does the double mount. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener body — scene, camera, renderer, both render targets, both materials, the wordmark canvas, the `animate` loop, every listener — never runs, and there is no error to point you at why the screen stayed blank. Delete the listener and move that entire body into a `useEffect` with an empty dependency array.

*(2) Element lookups* — This script never calls `document.querySelector`, but `document.body.appendChild(renderer.domElement)` makes the same assumption a different way: it treats the whole document as its mount point, and the `mousemove`/`mouseleave` listeners are attached to that same canvas only after the append. Give the component a root ref, append `renderer.domElement` into `ref.current` instead of `document.body`, and move the canvas's full-bleed sizing onto that ref's box. Skip this and a StrictMode remount leaves two canvases in `<body>`: the one appended last visually covers the first, but the first's `animate` loop keeps running underneath it, still swapping its own pair of render targets, for as long as the tab stays open.

*(3) Cleanup — the render targets, the loop, the listeners, and the font swap* — Keep the id the `animate` loop's first `requestAnimationFrame` call returns and call `cancelAnimationFrame` on it in the cleanup; skipped, the loop outlives the unmount and keeps swapping `rtA`/`rtB` and calling `renderer.render` against a canvas nobody can see. The `resize` listener on `window` and the `mousemove`/`mouseleave` listeners on the canvas are all inline arrows passed straight to `addEventListener` — none of them can be removed later, because nothing kept a reference. Assign each to a named `const` before registering it and call the matching `removeEventListener` with that same reference in the cleanup. `document.fonts.ready.then(...)` deserves its own line: it can resolve after the StrictMode unmount, and its callback calls `drawWordmark()` and flips `textTexture.needsUpdate` against a canvas and a texture the cleanup may already have disposed. Guard it with the same cancellation flag the cleanup sets — check the flag before touching either — rather than trusting the promise to settle before you tear down. Finally dispose what you allocated by hand: both `WebGLRenderTarget`s, `simMaterial` and `renderMaterial`, the shared `PlaneGeometry` (both quads reference the same one, so dispose it once), and `textTexture`; then call `renderer.dispose()` before removing the canvas node. The two `FloatType` targets are the most expensive thing on this list to leak: each is a raw-device-pixel-ratio float allocation, and there are two of them live at once even before an un-cleaned-up StrictMode remount doubles that again.

*(4) Rendering this in `@react-three/fiber`* — this catalogue targets three 0.185, `@react-three/fiber` 9, drei 10.7 and React 19. `<Canvas>` replaces the `WebGLRenderer`/`Scene`/`PerspectiveCamera` block, but the camera needs an explicit `orthographic` frustum matching the hand-built one — the same `left`/`right`/`top`/`bottom` bounds around the same unit quad the plane geometry uses — since R3F's default camera is a perspective one. The two off-screen render targets map to drei's `useFBO`, called twice, one per buffer half; because the swap has to happen every frame without triggering a React re-render, hold both inside a single ref (an object with two fields) and swap the fields inside `useFrame`, the same way the plain variables are swapped above. The simulation half of the render has no place in the declarative scene tree: build that scene once with `useMemo(() => new THREE.Scene(), [])`, add the sim quad to it by hand, and render it manually inside `useFrame` with `gl.setRenderTarget`/`gl.render` before resetting the render target to `null`. Leave the display half declarative — a single `<mesh>` holding the render quad's `planeGeometry` and a `shaderMaterial` whose `textureA`/`textureB` uniforms you update from refs in that same `useFrame` — so `<Canvas>`'s own render pass draws it for you afterward, and only the simulation pass needs a manual `gl.render` call. There is no `GLTFLoader`/`useGLTF` swap here: this component's only loaded asset is the wordmark, drawn into an off-screen 2D canvas and wrapped in a `CanvasTexture`. Build that canvas once with `useMemo`, redraw it from an effect that reacts to container size and to `document.fonts.ready` behind the same cancellation guard described above, and dispose the texture on unmount. Resize is otherwise handled for you — `<Canvas>` tracks its container and calls the renderer's resize on your behalf — but the two FBOs, the `resolution` uniform, and the wordmark canvas sit outside that and still need an effect keyed on `useThree`'s reported size and pixel ratio to resize the buffers, rewrite the uniform, and redraw the canvas, mirroring the `resize` listener above. For the pointer, prefer the mesh's own `onPointerMove`/`onPointerLeave` props over a second `window`-level listener — R3F already scopes them to the canvas — but keep the same device-pixel, Y-flipped conversion feeding the `mouse` uniform, since that coordinate space is baked into the simulation shader, not into how the event got captured.

A static poster is worth adding even though nothing here waits on a network model: two `FloatType` render targets at the raw device pixel ratio plus two shader compiles is enough GPU and driver work that a cold visit can show a blank or half-cleared frame for a moment, and the wordmark itself visibly pops from whatever fallback serif is available synchronously to the intended face once `document.fonts.ready` resolves and the canvas redraws. Render a flat poster in the same box — the background color plus the wordmark set in the fallback face is close enough — and swap it out once the first simulation frame has actually painted, not the instant the component mounts.

Skip drei's `Environment` here on different grounds than usual: this scene has no three.js lights for one to feed. The specular glint that reads as a wet highlight comes entirely from the render fragment shader, which derives a surface normal from the water's gradient channels and dots it against a light-direction constant baked into the GLSL itself — there is nothing in the scene graph for an environment map to illuminate. Adding `Environment` here would not relight anything; it would just be a CDN dependency with no job to do.
