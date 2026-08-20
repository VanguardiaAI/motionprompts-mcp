# Interactive Fluid Particle Logo

## Goal
Build a full-viewport **WebGL hero** where a PNG logo is rasterized pixel-by-pixel into tens of thousands of soft round `GL_POINTS` particles floating on a near-black background. The star effect: **moving the mouse repels nearby particles with an inverse-square force**, scattering them fluidly, and each particle then **springs back to its home position** through velocity damping plus a constant return force — with an exponentially damped clamp that stops any particle drifting more than ~100px from home. The whole simulation is raw WebGL + a hand-rolled physics loop on `requestAnimationFrame`. **No GSAP, no Three.js, no libraries at all.**

## Tech
Vanilla HTML/CSS/JS with ES module scripts. **Zero npm dependencies** — use the raw `canvas.getContext("webgl")` API directly. Put the two GLSL source strings in a sibling module and import them:
```js
import { vertexShader, fragmentShader } from "./shaders.js";
```

## Layout / HTML
Minimal — the entire page is one canvas:
```html
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="./script.js"></script>
</body>
```
Page title: "Interactive Fluid Particle Logo".

## Styling
Only a global reset — nothing else:
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
```
The canvas is sized by JS (below) and the background color is painted by WebGL's `clearColor`, not CSS.

## Config (top of `script.js`)
Centralize every tunable in one object; all the exact values matter:
```js
const config = {
  logoPath: "/path/logo.png",   // square PNG with transparency
  logoSize: 1250,               // sampling grid resolution (px)
  logoColor: "#404040",         // tint multiplied onto the logo pixels
  canvasBg: "#141414",          // WebGL clear color
  distortionRadius: 3000,       // mouse influence radius (device px, used squared)
  forceStrength: 0.0035,        // scales the repulsion acceleration
  maxDisplacement: 100,         // max px a particle may drift from home
  returnForce: 0.025,           // spring factor pulling back to origin
};
```

## Canvas + WebGL setup
- **Canvas sizing (DPR-aware):** `canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;` with `canvas.style.width/height` set to the CSS pixel size (`dpr = window.devicePixelRatio || 1`). All simulation coordinates live in **device pixels**.
- **Context:** `canvas.getContext("webgl", { alpha: true, depth: false, stencil: false, antialias: true, powerPreference: "high-performance", premultipliedAlpha: false })`.
- **Blending:** `gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);`
- Compile the two shaders, link one program. No depth test, no textures.

## Shaders (`shaders.js`)

**Vertex shader** — positions arrive in device-pixel space; convert to clip space with a Y-flip, forward the per-particle color, fixed point size **3.5**:
```glsl
precision highp float;
uniform vec2 u_resolution;
attribute vec2 a_position;
attribute vec4 a_color;
varying vec4 v_color;
void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 clipSpace = (zeroToOne * 2.0 - 1.0);
    v_color = a_color;
    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
    gl_PointSize = 3.5;
}
```

**Fragment shader** — each point is a **soft anti-aliased disc**: radial alpha falloff via `smoothstep`, discarding fully transparent particles:
```glsl
precision highp float;
varying vec4 v_color;
void main() {
    if (v_color.a < 0.01) discard;
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
}
```

## Building the particles from the logo
1. Load the PNG with `new Image()`. In `onload`, draw it onto an **offscreen 2D canvas of `logoSize × logoSize` (1250×1250)** at **scale 0.9, centered** (`size = 1250 * 0.9`, `offset = (1250 - size) / 2`).
2. `getImageData` over the full 1250×1250 grid. Loop rows `i` (y) and columns `j` (x); `pixelIndex = (i * logoSize + j) * 4`.
3. For every pixel with **alpha > 10**, create one particle at:
   - `particleX = canvas.width/2 + (j - logoSize/2) * 1.0`
   - `particleY = canvas.height/2 + (i - logoSize/2) * 1.0`
   
   i.e. **1 particle per source pixel, 1 device-pixel spacing**, logo centered in the canvas (so the point cloud spans up to 1250 device px).
4. Per-particle color = original pixel RGB (normalized 0–1) **multiplied channel-wise by the `#404040` tint**, alpha = original pixel alpha / 255 (this keeps anti-aliased logo edges soft). Result: dark-grey logo on the `#141414` background — subtle, low-contrast.
5. Each particle object stores `{ originalX, originalY, velocityX: 0, velocityY: 0 }`. Current positions live in a flat `Float32Array` (`positionArray`, 2 floats per particle) uploaded to a `gl.DYNAMIC_DRAW` buffer; colors in a `Float32Array` (4 floats per particle) uploaded once as `gl.STATIC_DRAW`.
6. Only after particles exist, start the rAF loop.

Expect a large count (a bold logo yields ~100k–400k points) — the physics loop must be plain indexed `for` loops over typed arrays to stay 60fps.

## The interaction physics (the important part — be exact)

### Activity gate — simulation sleeps when idle
Keep a counter `animationCount = 0`. Every `mousemove` sets `animationCount = 300`; each physics tick decrements it and **the whole physics update early-returns when it reaches 0** (rendering continues every frame regardless). Net effect: the fluid simulation runs for ~300 frames (~5s) after the last mouse movement, letting every particle settle home, then freezes for free performance.

### Mouse tracking
`mousemove` on `document`, converted to **device pixels** relative to the canvas:
```js
mouse.x = (event.clientX - rect.left) * dpr;
mouse.y = (event.clientY - rect.top) * dpr;
animationCount = 300;
```

### Per-frame physics (for each particle `i`, current pos read from `positionArray`)
Let `radiusSquared = distortionRadius² = 9,000,000`.

1. **Inverse-square repulsion** — `deltaX/deltaY = mouse − current`, `distanceSquared = deltaX² + deltaY²`. If `0 < distanceSquared < radiusSquared`:
   - `force = -radiusSquared / distanceSquared` (negative → pushes **away** from the cursor; explodes near the cursor, fades with distance).
   - `angle = atan2(deltaY, deltaX)`.
   - **Displacement-based falloff:** `forceMultiplier = max(0.1, 1 − distFromOrigin / (maxDisplacement * 2))` where `distFromOrigin` is the particle's current distance from its home — particles already far from home resist further pushing (floor at 0.1).
   - `velocityX += force * cos(angle) * forceStrength * forceMultiplier` (same for Y with `sin`). `forceStrength = 0.0035`.
2. **Friction:** `velocityX *= 0.82; velocityY *= 0.82;` every tick, unconditionally.
3. **Spring integration:** `targetX = currentX + velocityX + (originalX − currentX) * returnForce` (returnForce = **0.025** — a lazy constant pull home; same for Y).
4. **Soft max-displacement clamp:** compute the target's offset from home; if its length `distFromOrigin > maxDisplacement (100)`:
   - `excess = distFromOrigin − maxDisplacement`
   - `scale = maxDisplacement / distFromOrigin`
   - `dampedScale = scale + (1 − scale) * exp(−excess * 0.02)` — an **exponentially damped clamp**: slight overshoot allowed near the limit, hard stop far past it (no visible snapping).
   - position = `original + offset * dampedScale`, and bleed energy: `velocity *= 0.7` (both axes).
   
   Otherwise position = target.
5. After the loop, re-upload positions with `gl.bufferSubData` on the dynamic buffer.

### Render (every frame)
`gl.viewport(0, 0, canvas.width, canvas.height)`, clear to `#141414` (alpha 1), bind program, set `u_resolution = (canvas.width, canvas.height)`, bind position attrib (2 floats) and color attrib (4 floats), then `gl.drawArrays(gl.POINTS, 0, particleCount)`.

### Resulting feel
Sweeping the cursor through the logo blasts a hole through the particles; they curl outward fluidly (the inverse-square profile makes close particles fly and distant ones barely stir), then drift back over ~1–2 seconds like iron filings re-forming, with no elastic wobble thanks to the 0.82 friction + damped clamp.

## Resize behavior
On `window.resize`, re-run the canvas sizing, then **reposition the existing particles as a centered `√N × √N` square grid** at 1px spacing (`row = floor(i / dim)`, `col = i % dim`, positioned around the new canvas center), reset `positionArray` to those spots and re-upload with `bufferSubData`. (This is a deliberate cheap re-center — after a resize the cloud reflows into a solid square block rather than re-sampling the logo; keep this behavior.)

## Assets / images
- **1 image** — a **square (1:1) PNG logo/mark on a fully transparent background**: a simple, bold, geometric shape (e.g. an abstract mountain/triangle mark) in a **light grey**, ideally ≥1000px so the 1250-grid sampling stays crisp. Solid silhouette with clean anti-aliased edges works best; the code multiplies its color by `#404040`, so a light source logo lands as dark grey on the near-black canvas. No real brand.

## Behavior notes
- **Desktop / mouse-driven** — there is no touch fallback; on touch devices the logo simply renders statically.
- The logo renders at device-pixel scale (1250 device px wide at most), so on a 2× display it appears ~625 CSS px wide — that's expected.
- No GSAP, no ScrollTrigger, no smooth-scroll — one rAF loop drives everything.
- The `animationCount` gate is the only perf guard; keep it, along with `powerPreference: "high-performance"` and the typed-array buffers.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/interactive-particle-logo/logo.png
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--muted`, `--accent`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already has the shape of an effect and its cleanup: `mount` finds the canvas, opens the WebGL context, compiles the two shaders, kicks off the logo `Image` load, and returns a function that cancels the frame, strips the three listeners, and frees every GPU object it created. The dispatch at the bottom of the file — the `window.MP` branch versus the plain-document fallback — has nothing to do with how React schedules work, and it is exactly what has to go.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Call this file's `mount()` without wiring its own `destroy()` back as the effect's cleanup, and the second mount finds the first one still alive: two `requestAnimationFrame` chains each reading and writing their own `positionArray`, two `mousemove` listeners on `document` each driving a different `animationCount` gate, and — because a browser only grants a page a handful of live WebGL contexts — a real chance that the second `canvas.getContext("webgl")` call returns `null` instead of a context at all. None of this reproduces in a production build, because only development double-invokes.

*(1) The entry point* — the `else` branch is the one that always runs in a React host (`window.MP` is this catalogue's own editor bridge and won't exist there); it checks `document.readyState` before subscribing to `DOMContentLoaded`, a guard that exists only to survive being loaded late into a plain document. `useEffect` already runs after commit, so the guard is dead weight. Delete the whole `if (window.MP...) { ... } else { ... }` dispatch and the `boot` closure with it, and move `mount`'s body directly into a `useEffect` with an empty dependency array, feeding it this component's own props merged over `DEFAULTS` instead of the bare copy `boot` builds today.

*(2) Element lookups* — there is exactly one DOM query in the file, `document.getElementById("canvas")`, and `mount` does something deliberate with what it finds: `existing.cloneNode(false); existing.replaceWith(canvas)`. That swap exists because `destroy()` ends by calling `WEBGL_lose_context`'s `loseContext()`, and a `<canvas>` whose context has been force-lost never returns a working one from `getContext()` again — without a fresh node, a second `mount()` against the same element draws nothing, forever. Give the component a root `ref` on the `<canvas>` JSX itself renders, and drop `getElementById` and the clone-and-replace with it — but do not carry `loseContext()` into the React cleanup unchanged. React hands you back the *same* live node across a StrictMode remount (there is no second `<canvas>` to swap onto), so force-losing its context there reproduces the exact black-canvas failure the vanilla clone trick was built to dodge. Free the GPU objects (below) and leave the context itself alive; the next mount's setup reuses it instead of reacquiring one.

*(3) Cleanup* — this piece has no GSAP, ScrollTrigger, Lenis, or SplitText. The one thing that has to be cancelled by hand is the frame loop: keep the handle `requestAnimationFrame` returns (`frame` above) and call `cancelAnimationFrame` on it in the effect's cleanup, or the StrictMode-orphaned loop keeps calling `updatePhysics`/`render` against a `positionArray` and `gl` the current mount has already replaced. Everything else `destroy()` does to the GPU objects — `deleteBuffer` on both `positionBuffer` and `colorBuffer`, `detachShader`/`deleteShader` for `vs` and `fs`, `deleteProgram` — is already correct and carries over as-is (minus `loseContext()`, per above); it just has to run from the function the effect returns rather than from a `destroy()` a caller has to remember to invoke.

One more continuation worth preserving rather than trimming: `loadLogo()`'s `Image.onload` checks `if (destroyed) return;` before turning pixels into particles, because the PNG can finish decoding after the owning `mount()` has already been torn down — a StrictMode remount is fast enough to land inside a single image decode. Keep exactly this shape in the effect: a cancellation flag the cleanup sets, checked at the top of `onload` before it calls `createParticles`, so a decode that resolves after unmount does not build a particle buffer and start `animate()` against a context and buffers the cleanup has already freed.

This component has no `three` anywhere — it drives a raw `canvas.getContext("webgl")`, not a `THREE.WebGLRenderer`, and there is no scene graph — so the R3F mapping does not apply here.
