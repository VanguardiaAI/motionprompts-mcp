---
slug: turbulent-inversion-lens-hover-effect-javascript
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Turbulent Inversion Lens Hover Effect

## Goal

Build a full-viewport WebGL image viewer with a "turbulent inversion lens". A single photograph fills the screen, rendered on a Three.js fullscreen quad through a custom fragment shader. The star effect: as the cursor moves over the image, a **circular lens trails the mouse with a smooth lag**, and everything inside that circle is shown as **inverted grayscale** (a photographic-negative look). The lens edge is not a clean circle — it is **jittered by animated fractal turbulence (fBm noise)**, so the boundary constantly boils and crackles like static. The lens radius **grows open when the cursor enters** the container and **shrinks closed to nothing when it leaves** (or when the section scrolls out of view). No scroll effects, no clicks — just cursor-driven shading.

## Tech

Vanilla HTML/CSS/JS with ES module imports. **No GSAP, no Lenis.** The only runtime dependency is `three` (npm). All motion comes from a `requestAnimationFrame` loop that lerps values into shader uniforms.

Imports needed:

- `three` (`import * as THREE from "three"`)
- A local `./shaders.js` module exporting two GLSL strings: `vertexShader` and `fragmentShader` (given verbatim below — they are load-bearing).

## Layout / HTML

Minimal. One full-viewport container holding a hidden `<img>`; the WebGL canvas is created in JS and appended into the container.

```html
<div class="inversion-lens">
  <img src="<path-to-image>" alt="" />
</div>
<script type="module" src="./script.js"></script>
```

The `<img>` is never displayed — JS reads its `src` and loads it as a texture. The JS must support multiple `.inversion-lens` containers: `document.querySelectorAll(".inversion-lens").forEach(initHoverEffect)`.

## Styling

Tiny stylesheet — all visuals come from WebGL.

- Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`
- `.inversion-lens { position:relative; width:100vw; height:100svh; overflow:hidden; }`
- `.inversion-lens img { display:none; }`

No fonts, no text, no other elements.

## Core effect (be exhaustive — this is the whole component)

### Config (exact values)

```js
const config = {
  maskRadius: 0.15,          // lens radius in UV space when hovering
  maskSpeed: 0.75,           // multiplier on u_time for the turbulence scroll
  lerpFactor: 0.05,          // mouse-follow lerp per frame
  radiusLerpSpeed: 0.1,      // radius open/close lerp per frame
  turbulenceIntensity: 0.075 // amplitude of the edge jitter
};
```

### Per-container state

- `targetMouse = new THREE.Vector2(0.5, 0.5)` and `lerpedMouse = new THREE.Vector2(0.5, 0.5)` — pointer position in UV space (0–1, y flipped).
- `targetRadius = 0.0` — desired lens radius (0 when closed, `config.maskRadius` when hovering).
- `isInView`, `isMouseInsideContainer`, `lastMouseX`, `lastMouseY` trackers.

### Texture load → scene setup

Use `new THREE.TextureLoader().load(img.src, callback)`. In the callback:

1. `imageAspect = texture.image.width / texture.image.height` — passed to the shader for cover-fit cropping.
2. Texture quality: `texture.minFilter = THREE.LinearMipMapLinearFilter; texture.magFilter = THREE.LinearFilter; texture.anisotropy = 16;`
3. `scene = new THREE.Scene()`; `camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)` (identity fullscreen camera — the vertex shader ignores matrices anyway).
4. Uniforms (exact):
   ```js
   uniforms = {
     u_texture:            { value: texture },
     u_mouse:              { value: new THREE.Vector2(0.5, 0.5) },
     u_time:               { value: 0.0 },
     u_resolution:         { value: new THREE.Vector2(containerW, containerH) },
     u_radius:             { value: 0.0 },                        // starts closed
     u_speed:              { value: config.maskSpeed },           // 0.75
     u_imageAspect:        { value: imageAspect },
     u_turbulenceIntensity:{ value: config.turbulenceIntensity }, // 0.075
   };
   ```
5. Mesh: `new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader }))`, added to the scene.
6. Renderer: `new THREE.WebGLRenderer({ antialias: true })`, `setPixelRatio(window.devicePixelRatio)`, `setSize(container.clientWidth, container.clientHeight)`, then append `renderer.domElement` into the container. (No resize handler — the canvas keeps its initial size.)

### Pointer / visibility tracking

- `document.addEventListener("mousemove", ...)` (on **document**, not the container) → call `updateCursorState(e.clientX, e.clientY)`.
- `window.addEventListener("scroll", ...)` → re-run `updateCursorState(lastMouseX, lastMouseY)` so the lens tracks correctly while the page scrolls under a stationary cursor.
- An `IntersectionObserver` on the container with `{ threshold: 0.1 }`: when the container leaves the viewport set `targetRadius = 0.0` (lens closes).

`updateCursorState(x, y)`:

- Store `lastMouseX/Y`, get `container.getBoundingClientRect()` and test whether the point is inside the rect.
- If inside: `targetMouse.x = (x - rect.left) / rect.width;` `targetMouse.y = 1.0 - (y - rect.top) / rect.height;` (flip Y into UV space) and `targetRadius = config.maskRadius` (0.15).
- If outside: `targetRadius = 0.0`.

### The rAF loop (the actual "animation")

Every frame:

```js
lerpedMouse.lerp(targetMouse, 0.05);                       // lens center trails the cursor
uniforms.u_mouse.value.copy(lerpedMouse);
uniforms.u_time.value += 0.01;                             // drives turbulence scroll
uniforms.u_radius.value += (targetRadius - uniforms.u_radius.value) * 0.1; // radius eases open/closed
renderer.render(scene, camera);
```

- Mouse lerp factor `0.05` → noticeable elastic lag behind the cursor.
- Radius lerp factor `0.1` → the circle grows from 0 to 0.15 on enter and collapses back to 0 on leave, both eased exponentially.
- `u_time` advances a fixed `0.01` per frame; the shader multiplies it by `u_speed` (0.75) to scroll the noise field, which makes the lens edge boil continuously even when the cursor is still.

### Shaders (`shaders.js` — exact GLSL, load-bearing)

```js
export const vertexShader = `
  varying vec2 v_uv;
  void main() {
    v_uv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  precision highp float;

  uniform sampler2D u_texture;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_radius;
  uniform float u_speed;
  uniform float u_imageAspect;
  uniform float u_turbulenceIntensity;

  varying vec2 v_uv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float turbulence(vec2 p) {
    float t = 0.0;
    float w = 0.5;
    for (int i = 0; i < 8; i++) {
      t += abs(noise(p)) * w;
      p *= 2.0;
      w *= 0.5;
    }
    return t;
  }

  void main() {
    vec2 uv = v_uv;
    float screenAspect = u_resolution.x / u_resolution.y;
    float ratio = u_imageAspect / screenAspect;

    vec2 texCoord = vec2(
      mix(0.5 - 0.5 / ratio, 0.5 + 0.5 / ratio, uv.x),
      uv.y
    );

    vec4 tex = texture2D(u_texture, texCoord);
    float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 invertedGray = vec3(1.0 - gray);

    vec2 correctedUV = uv;
    correctedUV.x *= screenAspect;
    vec2 correctedMouse = u_mouse;
    correctedMouse.x *= screenAspect;

    float dist = distance(correctedUV, correctedMouse);

    float jaggedDist = dist + (turbulence(uv * 25.0 + u_time * u_speed) - 0.5) * u_turbulenceIntensity;

    float mask = step(jaggedDist, u_radius);

    vec3 finalColor = mix(invertedGray, tex.rgb, 1.0 - mask);
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;
```

What the fragment shader does, step by step:

- **Cover-fit crop:** `ratio = imageAspect / screenAspect`; the x texture coordinate is remapped with `mix(0.5 - 0.5/ratio, 0.5 + 0.5/ratio, uv.x)` so a wider-than-viewport image is center-cropped horizontally (like CSS `object-fit: cover`).
- **Negative look:** luma via the Rec.601 weights `(0.299, 0.587, 0.114)`, then inverted: `vec3(1.0 - gray)`.
- **Aspect-corrected distance:** both the fragment UV and the mouse UV have their x multiplied by `screenAspect` before `distance()`, so the lens is a true circle on any viewport.
- **Turbulent edge:** `jaggedDist = dist + (turbulence(uv * 25.0 + u_time * u_speed) - 0.5) * u_turbulenceIntensity` — an 8-octave value-noise fBm (`abs(noise)`, weight halving each octave) sampled at 25× UV frequency, scrolled by time, remapped to ±0.5 and scaled by 0.075, perturbs the distance field.
- **Hard mask:** `mask = step(jaggedDist, u_radius)` — a binary inside/outside test (no soft edge; the jitter itself provides the texture).
- **Composite:** `mix(invertedGray, tex.rgb, 1.0 - mask)` — inverted grayscale inside the lens, untouched photo outside.

## Assets / images

One image only:

- A single **full-bleed photographic portrait in landscape orientation, roughly 3:2** (e.g. a studio portrait of a person against a light, uncluttered background). High resolution (~1440px wide or more). Light/bright imagery reads best because the inversion flips it to a dramatic dark negative inside the lens. Referenced by the hidden `<img>` in the container; the shader center-crops it to cover the viewport.

## Behavior notes

- Initial state: plain photo, no lens (`u_radius` starts at 0 and `targetRadius` is 0 until the first mousemove lands inside the container).
- The lens closes (radius eases to 0) whenever the cursor exits the container rect **and** when the container is less than 10% visible (IntersectionObserver).
- Mouse tracking is document-level plus a scroll listener re-check, so the effect stays correct in a scrolling page; the component itself does not hijack scroll.
- Desktop / pointer-driven only — no touch handling, no click states, no reduced-motion branch. The rAF loop runs continuously.
- No window-resize handling in the original; keep the renderer at its initial container size.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/turbulent-inversion-lens-hover-effect-javascript/portrait.jpeg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--gold`, `--black`, `--font-display`, `--font-mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a self-booting module: `mount(config)` walks every `.inversion-lens`
container on the page, calls `initHoverEffect` on each, and folds their individual `destroy`
functions into the single teardown it returns. The catalogue's own editor hook
(`window.MP.register`) already leans on that mount/destroy shape being callable more than once
with a different config object — which is useful, because it is also exactly the contract
`useEffect` wants. What doesn't survive the trip is the branch that decides *whether* to call
`mount()` at all, and the assumption, baked into `document.querySelectorAll(".inversion-lens")`
and the `document`-level `mousemove` listener, that this script owns the whole page rather than one
subtree of a React tree.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. Here that lands on the async seam specifically: `setupEventListeners()` and
`animate()` only run from **inside** the `loader.load` callback, not synchronously when
`initHoverEffect` is called, so a StrictMode unmount can land while the texture is still in
flight. If the callback doesn't check for that, it goes on to build a second scene against a
container whose first `<canvas>` is still attached, bind a second `mousemove` listener next to the
first (both racing to write their own `lerpedMouse`), start a second `IntersectionObserver`, and
kick off a second `requestAnimationFrame` loop — four leaks from one missed check, all downstream
of a single callback, and none of it will reproduce in a production build, because only
development does the double mount. The script already guards this with its own `destroyed`
boolean; the port has to keep that guard and tie it to the effect's lifetime instead of treating it
as incidental.

*(1) The entry point* — The fallback branch (the `else` that runs when there's no `window.MP`)
checks `document.readyState` before subscribing to `DOMContentLoaded` — dead weight in React,
since `useEffect` already runs after commit. Drop that branch and the `window.MP` branch both;
neither the readiness guard nor the editor-knob hook has a React equivalent to preserve. What's
left is `mount(Object.assign({}, DEFAULTS))`, and that call, plus the teardown it returns, is the
entire body of a `useEffect` with an empty dependency array. Because `mount()` already returns its
own multi-container `destroy`, resist inlining `initHoverEffect` by hand — calling `mount()` once
per effect and returning exactly what it hands back is less code than reimplementing its loop.

*(2) Element lookups* — `document.querySelectorAll(".inversion-lens")` exists to find containers
this script doesn't otherwise know about; a React component knows its container by definition. One
`<InversionLens>` instance should own a single root `ref` and pass that one element straight to
`initHoverEffect`, instead of asking the whole document for every `.inversion-lens` and trusting
that React only ever rendered one. Scope `container.querySelector("img")` the same way, under the
ref. The `mousemove` listener stays bound to `document` by design — it has to notice the cursor
re-entering the container from anywhere on the page — but the `getBoundingClientRect` test that
decides "inside" already scopes it correctly, so the only change needed is making sure it reads the
ref's current element rather than a `container` captured in a stale closure from a prior mount.

*(3) Cleanup — the async guard, the rAF loop, and the GPU resources* — Set the `destroyed`-style
boolean (call it `cancelled`, to match this catalogue's convention) as the first line of the
cleanup, because it is the only thing standing between a texture that resolves late and a scene
built for a container that's already gone. Store the id `animate()`'s own
`requestAnimationFrame` call returns and call `cancelAnimationFrame` on it in the same cleanup —
that id doesn't exist until the texture has already loaded and `animate()` has run once, so the
cleanup has to handle both "texture never arrived" (nothing to cancel) and "texture arrived, loop
is running" (cancel it), which the flag distinguishes for you. Remove the `mousemove` listener from
`document` and the `scroll` listener from `window` using the same function references
`setupEventListeners` created, disconnect the `IntersectionObserver`, then dispose the loaded
texture, the `PlaneGeometry`, and the `ShaderMaterial`, and finally tear down the renderer:
`renderer.dispose()`, `renderer.forceContextLoss()`, and remove `renderer.domElement` from the DOM.
Skipping `forceContextLoss()` doesn't fail on the very next remount — it fails several visits
later, when the browser's shared WebGL context budget runs out and a *later* mount of this or any
other three-family component on the page can no longer get a context at all.

*(4) Rendering this in `@react-three/fiber`* — The whole scene is one full-clip-space quad, so it
maps onto R3F almost directly: `<Canvas orthographic camera={{ left: -1, right: 1, top: 1, bottom:
-1, near: 0, far: 1 }}>` replaces the hand-built `WebGLRenderer` / `Scene` / `OrthographicCamera`
trio, and a `<mesh>` wrapping `<planeGeometry args={[2, 2]}>` and a `<shaderMaterial uniforms={…}>`
replaces the manual `Mesh` / `ShaderMaterial` construction. Carry the vertex shader's
`gl_Position = vec4(position, 1.0)` over unchanged — bypassing the camera's projection entirely is
what makes the quad fill the clip space regardless of the orthographic bounds fiber wires in, and
"fixing" it into a normal projection multiply would break the fullscreen coverage. The `animate()`
loop becomes one `useFrame` callback that advances `lerpedMouse` toward `targetMouse`, bumps the
shader clock, and eases `u_radius` toward `targetRadius`, writing all three onto the material's
`uniforms` ref — do not also keep a `requestAnimationFrame` loop running inside the `<Canvas>`,
since `useFrame` already fires once per rendered frame and a second loop would drive the same
uniforms at a competing rate. Replace `new THREE.TextureLoader().load(img.src, …)` with drei's
`useTexture(url)`, pointed at an image that resolves from your own domain — this also removes the
need for the `destroyed`-flag guard around scene construction, since Suspense unmounts cleanly
instead of racing a bare callback, though the `document`-level listeners and the
`IntersectionObserver` still need the manual cleanup described above. There's no manual resize
handler in the original to delete, but that isn't license to leave `u_resolution` fixed at its
first-mount value either: `<Canvas>` resizes its drawing buffer on its own as the container's box
changes, so read the live size from `useThree((state) => state.size)` inside `useFrame` and push it
into `u_resolution` every frame instead of setting it once at construction.

A poster is mandatory here even though the asset is a single photograph rather than a heavy model:
until `useTexture` resolves, the plane has nothing to sample and the container shows a bare frame.
The hidden `<img>` already in the markup — invisible in the vanilla version only because it exists
to hand its `src` to the texture loader — is that poster: keep it visible, sized to cover the
container the way the shader's `texCoord` remap does, and let the canvas paint over it once the
first frame with a resolved texture has rendered.

Skip drei's `Environment`, preset or otherwise. The fragment shader here is fully unlit: it samples
`u_texture`, computes a luma-based inversion, and mixes it against the untouched frame through a
noise-perturbed `step` mask — there is no normal, no reflection, nothing that would ever read an
environment map. Reaching for `Environment` would add a dependency on the third-party CDN
hard-coded into drei's presets for a scene that has no use for it, and it fails closed — an unlit
scene — the moment that CDN is unreachable.
