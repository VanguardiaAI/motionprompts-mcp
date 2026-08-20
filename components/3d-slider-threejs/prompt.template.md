---
slug: 3d-slider-threejs
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# ThreeJS 3D Curved Slider (WebGL canvas-texture, Lenis scroll, no GSAP)

## Goal
Build a full-screen **3D curved plane that displays an endless vertical slideshow of captioned images**, rendered entirely in Three.js. Seven images with title captions are painted onto a tall repeating **2D canvas** that is used as a texture on one big **parabolically curved plane** tilted in 3D space. **Lenis smooth-scroll progress (0→1 over a very tall page) is fed into a scroll listener that shifts the texture's vertical offset and re-renders the WebGL scene**, so scrolling pushes the strip of images continuously up through the curved 3D sheet and loops forever. The star effect: the **image strip appears to bend and flow over a concave wave** because the flat canvas is mapped onto a plane whose vertices curve toward the camera at the top and bottom edges, viewed from an angled, rolled camera. A dark radial vignette overlay and fixed nav/footer frame the scene.

## Tech
- Vanilla HTML / CSS / JS with ES module imports, bundled by **Vite** (npm project).
- **`three` (npm)** imported `import * as THREE from "three";` and **`lenis` (npm)** imported `import Lenis from "lenis";`.
- **No GSAP, no ScrollTrigger, no shaders.** All motion is: Lenis for smooth scroll + a `lenis.on("scroll", …)` callback that redraws a 2D `<canvas>` texture and calls `renderer.render()`. There is **no continuous rAF render loop** — the scene renders once at init and then only on scroll events. `MeshBasicMaterial` (unlit) — no lights.
- Everything runs inside a single `window.addEventListener("load", …)` in one `script.js`.

## Layout / HTML
Almost no DOM — a fixed nav, a fixed footer, the WebGL `<canvas>` inside a wrapper, and a vignette overlay. Text is neutral/fictional demo copy (no real brands). Class names are load-bearing (`.slider-wrapper`, `.overlay`).

```html
<nav>
  <div class="site-info">
    <p id="logo">Motionprompts</p>
    <p>YouTube Channel</p>
  </div>
  <div class="nav-links">
    <p>Index</p>
    <p>About</p>
  </div>
</nav>

<footer>
  <p>Experiment 0410</p>
  <p>&copy; 2024</p>
</footer>

<div class="slider-wrapper">
  <canvas></canvas>
</div>

<div class="overlay"></div>

<script type="module" src="./script.js"></script>
```

`document.querySelector("canvas")` is passed straight into the renderer. Use the copy above verbatim; "Motionprompts" is the fictional demo name.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`

- **Palette (P8 Nocturne Glass)** — plum-black ground, cool white ink, violet/peach/teal mesh accents on glass surfaces:
  ```css
  :root {
    --ground: #17141f;
    --ink: #f5f3f7;
    --ink-soft: rgba(245, 243, 247, 0.64);
    --violet: #8b5cf6;
    --peach: #f0a884;
    --teal: #5eead4;
    --glass: rgba(255, 255, 255, 0.06);
    --glass-border: rgba(255, 255, 255, 0.15);
  }
  ```
  **The `--ground` value is load-bearing twice over**: the WebGL renderer clears to `0x17141f` and the texture canvas fills with `#17141f`, so if you change it you must change all three or the plane will not match the page.
- **Page = scroll runway.** `html, body { width:100%; height:1000vh; font-family:"Inter"; background: var(--ground); color: var(--ink); }` — the body is **1000vh tall**; that giant page height is the entire scroll distance Lenis reports and the only thing that drives the slideshow. Nothing else scrolls.
- **Fonts:** **Inter** for the page, **Space Mono** for the small fixed labels, **Space Grotesk** for the slide titles drawn into the canvas texture. `p { font-size:13px; line-height:1.5; }` in `--ink-soft`; the logo runs at full `--ink`.
- **`nav`** — `position:fixed; top:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center; z-index:2;`. `.nav-links { display:flex; gap:2em; }` (site-info left, nav-links right).
- **`footer`** — `position:fixed; bottom:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center; z-index:2;`.
- **`.slider-wrapper`** — `position:fixed; width:100vw; height:100vh; overflow:hidden;`.
- **`canvas`** — `position:fixed; top:0; left:0; width:100%; height:100%;` (fills the viewport behind everything).
- **`.overlay`** — `position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:1;` carrying the **mesh**: a violet radial at 12%/10%, a teal one at 88%/88%, and a closing vignette. Transparent in the middle, coloured and darkening at the corners. Sits above the canvas (z-index 1) but below nav/footer (z-index 2).

## The star effect — Three.js curved plane + canvas-texture scroll (be exact)
Near-verbatim port. Reproduce the constants, the geometry bend, the texture-draw math, the camera placement, and the scroll wiring exactly.

### Smooth scroll (Lenis, self-driven rAF)
Create Lenis with **default options** and drive its own rAF loop (this loop only powers Lenis; it does **not** render the scene):
```js
const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

### Image preload gate
Preload all **7** images (`/…/img1.jpg` … `img7.jpg`) into an `images[]` array; count `onload`/`onerror`, and only call `initializeScene()` once all 7 have resolved. This guarantees every slide texture is ready before the first paint.

### Renderer, scene, camera
```js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("canvas"),
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x17141f);   // must equal --ground
```

### The curved plane geometry (the "wave")
One large subdivided plane whose vertices are bent along **Z** by a parabola of their **Y**:
```js
const parentWidth  = 20;
const parentHeight = 75;
const curvature    = 35;
const segmentsX    = 200;
const segmentsY    = 200;

const parentGeometry = new THREE.PlaneGeometry(parentWidth, parentHeight, segmentsX, segmentsY);

const positions = parentGeometry.attributes.position.array;
for (let i = 0; i < positions.length; i += 3) {
  const y = positions[i + 1];
  const distanceFromCenter = Math.abs(y / (parentHeight / 2));   // 0 at vertical center → 1 at top/bottom edge
  positions[i + 2] = Math.pow(distanceFromCenter, 2) * curvature; // Z = dist² × 35
}
parentGeometry.computeVertexNormals();
```
So the plane is **flat (z=0) across its vertical middle and curls forward (+z up to 35) toward its top and bottom edges** — a tall concave trough. This is what makes the image strip read as flowing over a 3D wave.

### Material, mesh, tilt
```js
const parentMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
const parentMesh = new THREE.Mesh(parentGeometry, parentMaterial);
parentMesh.position.set(0, 0, 0);
parentMesh.rotation.x = THREE.MathUtils.degToRad(-20);
parentMesh.rotation.y = THREE.MathUtils.degToRad(20);
scene.add(parentMesh);
```
The plane is tilted **−20° on X** and **+20° on Y** so we see it in perspective, not head-on.

### Camera placement (angled orbit + roll)
Position the camera on a 17.5-unit orbit at the same 20° azimuth as the mesh, lifted 5 units, aimed slightly below center, and rolled −5°:
```js
const distance = 17.5;
const heightOffset = 5;
const offsetX = distance * Math.sin(THREE.MathUtils.degToRad(20));   // ≈ 5.99
const offsetZ = distance * Math.cos(THREE.MathUtils.degToRad(20));   // ≈ 16.44

camera.position.set(offsetX, heightOffset, offsetZ);
camera.lookAt(0, -2, 0);
camera.rotation.z = THREE.MathUtils.degToRad(-5);                    // slight roll
```

### The texture canvas (where slides are drawn)
A single tall offscreen 2D canvas becomes the repeating texture:
```js
const textureCanvas = document.createElement("canvas");
const ctx = textureCanvas.getContext("2d", { alpha: false, willReadFrequently: false });
textureCanvas.width = 2048;
textureCanvas.height = 8192;               // tall strip

const texture = new THREE.CanvasTexture(textureCanvas);
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;      // vertical wrap → seamless loop
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
```

### Slide layout constants + titles
```js
const totalSlides = 7;
const slideHeight = 15;
const gap = 0.5;
const cycleHeight = totalSlides * (slideHeight + gap);   // 7 × 15.5 = 108.5

const slideTitles = [
  "Chrome", "Basalt", "Glass",
  "Oxide", "Resin", "Alloy", "Slate",
];   // neutral one-word material names — no real brands
```

### `updateTexture(offset)` — redraw the canvas each scroll frame
`offset` is a normalized cycle offset (0 → one full loop). It clears to black, sets the caption font, then draws slides `-2 … totalSlides+1` (two extra above and below so the strip never shows a gap at the seam), each wrapped modulo the canvas height:
```js
function updateTexture(offset = 0) {
  ctx.fillStyle = "#17141f";   // must equal --ground
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  const fontSize = 180;
  ctx.font = `600 ${fontSize}px "Space Grotesk", "Inter", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const extraSlides = 2;
  for (let i = -extraSlides; i < totalSlides + extraSlides; i++) {
    let slideY = -i * (slideHeight + gap);
    slideY += offset * cycleHeight;                        // scroll shifts every slide

    const textureY = (slideY / cycleHeight) * textureCanvas.height;
    let wrappedY = textureY % textureCanvas.height;
    if (wrappedY < 0) wrappedY += textureCanvas.height;    // always-positive wrap

    let slideIndex  = ((-i % totalSlides) + totalSlides) % totalSlides;   // 0..6, cycles
    let slideNumber = slideIndex + 1;

    const slideRect = {
      x: textureCanvas.width * 0.05,                       // 5% left margin
      y: wrappedY,
      width: textureCanvas.width * 0.9,                    // 90% wide (≈1843px)
      height: (slideHeight / cycleHeight) * textureCanvas.height,   // ≈1132px per slide
    };

    const img = images[slideNumber - 1];
    if (img) {
      // COVER-fit the image into slideRect (fill rect, crop overflow, keep aspect)
      const imgAspect  = img.width / img.height;
      const rectAspect = slideRect.width / slideRect.height;
      let drawWidth, drawHeight, drawX, drawY;
      if (imgAspect > rectAspect) {
        drawHeight = slideRect.height;
        drawWidth  = drawHeight * imgAspect;
        drawX = slideRect.x + (slideRect.width - drawWidth) / 2;
        drawY = slideRect.y;
      } else {
        drawWidth  = slideRect.width;
        drawHeight = drawWidth / imgAspect;
        drawX = slideRect.x;
        drawY = slideRect.y + (slideRect.height - drawHeight) / 2;
      }

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(slideRect.x, slideRect.y, slideRect.width, slideRect.height);  // clip mask (radii default 0)
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // --- nocturne duotone, applied here on the canvas (not in CSS) ---
      // 1) strip the colour: "saturation" with a black fill leaves pure luminance
      ctx.globalCompositeOperation = "saturation";
      ctx.fillStyle = "#000000";
      ctx.fillRect(slideRect.x, slideRect.y, slideRect.width, slideRect.height);
      // 2) multiply by the light end of the ramp: highlights land on #b9a8e8
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "#b9a8e8";
      ctx.fillRect(slideRect.x, slideRect.y, slideRect.width, slideRect.height);
      // 3) lift the blacks to the plum floor: the ramp's zero is #17141f
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "#17141f";
      ctx.fillRect(slideRect.x, slideRect.y, slideRect.width, slideRect.height);
      ctx.globalCompositeOperation = "source-over";
      // a soft veil so the caption breathes over the ramp's highlights
      ctx.fillStyle = "rgba(23, 20, 31, 0.12)";
      ctx.fillRect(slideRect.x, slideRect.y, slideRect.width, slideRect.height);
      ctx.restore();

      ctx.fillStyle = "#f5f3f7";
      ctx.fillText(slideTitles[slideIndex], textureCanvas.width / 2, wrappedY + slideRect.height / 2);
    }
  }

  texture.needsUpdate = true;    // push the redrawn canvas to the GPU
}
```
Each slide is an image (cover-fit, clipped to its rect), pushed through the three-step duotone above, with its **centered caption in `--ink`** drawn on top at the vertical middle of the rect. The duotone is what makes any photograph — warm, cold, whatever — belong to the plum-and-violet ramp; no source frame keeps its own hue.

### Scroll wiring (the whole engine)
Lenis reports scroll; convert to 0→1 progress, invert it into the texture offset, redraw, and render **once per scroll event**:
```js
let currentScroll = 0;
lenis.on("scroll", ({ scroll, limit }) => {
  currentScroll = scroll / limit;      // 0 at top → 1 at bottom of the 1000vh page
  updateTexture(-currentScroll);       // negative → strip moves upward as you scroll down
  renderer.render(scene, camera);
});
```
Because the texture uses `RepeatWrapping` and the draw loop wraps modulo the canvas height, the image strip **loops seamlessly** — scrolling down forever cycles the 7 slides upward through the curved plane; scrolling up reverses it exactly.

### Init + resize
- After building everything, call `updateTexture(0)` and `renderer.render(scene, camera)` **once** so the first frame is visible before any scroll.
- **Resize** (debounced 250 ms): `camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight);`.

## Assets / images
**7 slide images**, mostly **landscape** (~3:2 / 4:3 / 16:9) with one **portrait** frame — exact aspect doesn't matter since each is **cover-fit** (cropped to fill) into its slide rect.

Since the canvas duotone strips every source hue, choose for **subject and tone**, not colour. The demo set is a pottery studio shot as material study, one theme per plate: a carved stoneware urn against a plain wall; hands pulling a pot up on the wheel; unglazed jars packed together seen from above; a raw vessel drying on a bat; metallic-glazed bowls on crumpled paper; an overhead workbench with molds and tools; a small bottle vase among round vessels. Single subjects, deep shadows, no busy backgrounds — they have to stay readable as they curve away from the camera.

No logos or baked-in brand text. If you have fewer than 7, repeat in order; the effect is identical regardless of content.

## Behavior notes
- **Scroll is the sole driver, and rendering is on-demand.** There is no autoplay and no continuous animation loop — the scene renders once at init and then only inside the Lenis `scroll` callback. Idle = a static frame; movement only while scrolling.
- **The 1000vh body IS the runway.** Lenis maps that height to `scroll/limit` = 0→1; that single progress value drives the texture offset. Keep the body at `height:1000vh`.
- **Endless loop** comes from `RepeatWrapping` + the modulo wrap in `updateTexture` + the two `extraSlides` of overdraw — never a visible seam.
- WebGL + heavy geometry (200×200 segments) means this is **desktop-oriented / not mobile-safe**. `pixelRatio` capped at 2, `MeshBasicMaterial` (no lights). No reduced-motion branch and no mobile layout switch in the original.
- Keep `overflow:hidden` on `.slider-wrapper`, and the vignette `.overlay` above the canvas but below the fixed nav/footer.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/3d-slider-threejs/img1.jpg
https://motionprompts.dev/c/3d-slider-threejs/img2.jpg
https://motionprompts.dev/c/3d-slider-threejs/img3.jpg
https://motionprompts.dev/c/3d-slider-threejs/img4.jpg
https://motionprompts.dev/c/3d-slider-threejs/img5.jpg
https://motionprompts.dev/c/3d-slider-threejs/img6.jpg
… 1 more under https://motionprompts.dev/c/3d-slider-threejs/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ground`, `--ink`, `--ink-soft`, `--violet`, `--peach`, `--teal`, `--glass`, `--glass-border`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already tears itself down: one call builds the Lenis instance, the rAF loop that only ticks Lenis, the WebGL scene, the offscreen texture canvas and the scroll listener, and the function it returns walks a `cleanups` array in reverse to undo every one of them. This component was written to survive being re-invoked by an internal editor runtime (`window.MP.register`), so the discipline a React effect needs is mostly already on the page — but `mount`/`destroy` were built for one external caller re-triggering them deliberately, not for React's own remount timing, and the two do not line up for free. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Call `mount()` without wiring its return value back as the effect's own cleanup, and the second mount finds the first Lenis instance and the first `raf` loop still alive: two `lenis.raf` calls ticking the same scroll, two `WebGLRenderer`s racing to draw into two `<canvas>` elements. It will not reproduce in a production build, because only development does the double mount — treat `destroy()` as the cleanup itself, not as something the effect calls in addition to its own teardown.

*(1) The entry point* — the bottom of the file checks `document.readyState` before deciding whether to wait for `DOMContentLoaded`: loading still in progress subscribes to the event, anything past that calls `boot()` immediately. That guard exists so the script survives being injected after the parser has already moved past this point in a plain document; a React component never faces that race, because `useEffect` runs after the DOM is committed. Delete the whole `if`/`else` and the `window.MP` branch beside it — both belong to the standalone demo page and its editor, not to a React host — and call `mount({ ...DEFAULTS })` directly inside a `useEffect` with an empty dependency array, keeping its return value as the effect's cleanup function. Leave the nested guard further up alone: `startLoading` already checks `document.readyState === "complete"` before deciding whether it needs the `load` listener at all, and that check stays correct regardless of who calls `mount` — it is not the entry point this rule is about.

*(2) Element lookups* — `mount` looks for `.slider-wrapper canvas`, falling back to a bare `canvas` selector that would just as happily match an unrelated leftover node. Give the component a root ref, render the wrapper and its `<canvas>` inside it, and scope the lookup to that ref instead of the document. During the StrictMode remount two copies of this subtree exist for an instant, and an unscoped selector can bind to the one on its way out. Keep the line right after the lookup exactly as written, too: before touching the canvas, `mount` clones it and replaces the original (`host.cloneNode(false)` / `host.replaceWith(canvas)`), specifically so a remount never inherits a `<canvas>` whose WebGL context the previous mount already force-lost. Dropping that clone because "the ref already points at the right node" reintroduces the black-canvas-on-remount failure this line exists to prevent.

*(3) Cleanup* — the Lenis instance, the rAF loop, and the async continuations that can outlive the effect each need their own note.

Lenis owns the entire render trigger here — `lenis.on("scroll", onScroll)` is the only thing that ever calls `renderer.render`, there is no other tick. Keep `lenis.off("scroll", onScroll)` and `lenis.destroy()` unconditional in the cleanup, in the order they already appear, since this component owns its Lenis instance outright rather than sharing one. If this slider ends up as one section of a page that already runs Lenis elsewhere, lift the instance to the shell and feed this component scroll progress instead of constructing a second one — two instances fight over the same wheel event with nothing in the console to point at why.

The rAF loop at the top of `mount` exists only to call `lenis.raf(time)` every frame; it never touches the renderer. Keep the exact handle pattern already written — reassigning the loop's own id on every call and passing that same id to `cancelAnimationFrame` in the cleanup — because this is precisely the loop a StrictMode double-mount duplicates. Two competing `lenis.raf` calls per frame reads as stutter, not a crash, which is what makes it easy to ship unnoticed.

The `destroyed` flag already does the job the async-safety rule above asks for: `loadImages`, `countLoaded`, the `document.fonts.load(...)` continuation, `onScroll` and `onResize` all check it before touching anything. Every image `onload`/`onerror` and the font-load promise can resolve after a StrictMode unmount, and each would otherwise write into a `scene` and `renderer` the cleanup has already disposed. Keep `destroyed` (or rename it to match whatever convention the rest of the codebase uses for this flag) as the single thing every one of those continuations checks — do not simplify it away because "the cleanup already removed the listeners," since the image and font callbacks are not listeners the cleanup removes, they are promises already in flight.

*(4) Rendering this in `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19. There is no `GLTFLoader` to swap for `useGLTF` here: the entire visual is one procedural `PlaneGeometry`, bent along Z by squaring each vertex's normalized distance from the mid-height and scaling by the curvature constant, computed once in a `useMemo` keyed on the curvature and segment-count props and handed to a `<mesh geometry={...}>`. `<Canvas>` replaces the `WebGLRenderer`/`Scene`/`PerspectiveCamera` block outright, its camera's field of view, clipping planes and starting position matching the hand-built `PerspectiveCamera`, its `gl` config carrying over `antialias` and `powerPreference`, and its `dpr` capped the same way the manual `setPixelRatio` call is. Resize handling disappears with it: drop the debounced `resize` listener and the manual `updateProjectionMatrix`/`setSize` pair, since `<Canvas>` already tracks its own container.

The part that does not port as boilerplate: this component deliberately runs **no continuous render loop**. The vanilla version calls `renderer.render(scene, camera)` exactly once at startup and then only from inside the Lenis scroll handler. Mount this under a default `<Canvas>` and R3F's own internal loop starts painting every frame for nothing, spending GPU time on a scene that only ever changes when the user scrolls. Set `<Canvas frameloop="demand">` and call the `invalidate()` `useThree` exposes from inside that same scroll handler, right after the redrawn texture is flagged for upload — this is also why the generic "the animation loop becomes `useFrame`" guidance does not apply here: there is no per-frame update to move into `useFrame`, because nothing in this component changes per frame, only per scroll event.

The offscreen texture canvas and its `CanvasTexture` stay hand-rolled — there is no drei helper for a canvas you draw into yourself. Build both once in a `useMemo`, keep the 2D context in a ref, redraw into it exactly as the vanilla `updateTexture` does, and flag the texture for re-upload the same way before calling `invalidate()`. Dispose the geometry, the texture and the material in the effect's cleanup, then call `renderer.dispose()` and `forceContextLoss()` on the `gl` instance `useThree` gives you, mirroring the same disposal order already present here.

A poster is mandatory even without a `.glb`: the scene does not paint at all — not even one frame — until the font-load promise has settled and all seven images have fired `onload` or `onerror`. That is a real multi-asset wait on a cold visit, not an instant one. Render a poster image sized to the slider's box, and swap it out only once the effect's own readiness check has resolved and the first texture draw plus `invalidate()` call has actually run — not the instant the component mounts.

Skip drei's `Environment` here regardless of preset temptation: the material is `MeshBasicMaterial`, unlit by construction, so there is no lighting for an environment map to feed. If a later variant wants a lit version of this panel, add explicit lights or point `Environment` at a self-hosted HDRI — never a `preset`, which fetches from a third-party CDN hard-coded into drei and fails the scene unlit the moment that host is unreachable.
