# Three.js 3D Scroll Experience

## Goal
Build a full-page editorial hero for a fictional furniture design studio (**"oak atelier"**) whose star effect is a **fixed Three.js furniture model** (a designer chair loaded from a GLB) floating in the center of the viewport. On load the model **scales up from nothing** with an elastic-free ease; it then **bobs gently up and down forever** (a sine float) while its **X-axis rotation is driven directly by page-scroll progress** — as you scroll the 400vh page the chair tumbles head-over-heels through two full revolutions (4π radians). Smooth scrolling is handled by **Lenis**, wired into GSAP's ticker, and the same ticker also runs the Three.js render loop. A secondary effect: the closing headline is split into lines and **each line masks up into view with a staggered translateY** via ScrollTrigger.

## NON-NEGOTIABLE visual requirements (get these exactly right)
These are essential — a reproduction that misses them does not look like the original, even if the animation is perfect:
1. **Dark canvas, always.** The page background is a near-black **`#111111`** with **white (`#fff`) text**. There is no light mode, no white page. The transparent WebGL chair floats above this dark canvas. If you ship a white/unstyled page you have failed the brief.
2. **The stylesheet MUST be linked.** The `index.html` `<head>` must contain `<link rel="stylesheet" href="./styles.css" />`. Without it the page renders 100% unstyled (white background, browser-default type, a raw blue underlined link) — this is the single most common way this build breaks. See the full HTML skeleton below.
3. **Real display typography.** A **huge 225px uppercase grotesque headline** and **120px serif archive titles** — load actual web fonts (below). System-font fallbacks (Helvetica/Times) do not read like the original.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** plus the GSAP plugin **`ScrollTrigger`**, **`three`** (Three.js core + `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`), **`lenis`** for smooth scroll, and **`split-type`** for the headline line-split. Imports:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Lenis from "lenis";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);
```

## Fonts (load these concretely — do not rely on system fonts)
The original pairs a neutral Swiss grotesque (Akkurat-style) with a high-contrast Didone serif that has a **true italic** (Gascogne-style). Reproduce that pairing with two web-loadable Google Fonts and keep explicit fallbacks:
- **Grotesque (global / body / the 225px `h1`):** **Inter** — neutral, Helvetica-adjacent. Stack: `"Inter", "Helvetica Neue", Arial, sans-serif`.
- **High-contrast serif WITH true italic (the "atelier" nav span, the 120px archive `<h2>`, the italic "Collection" label, the `<span>`s inside outro paragraphs):** **Playfair Display** — a Didone with a genuine italic (not a slanted roman). Stack: `"Playfair Display", Georgia, "Times New Roman", serif`.

Load both at the very top of `styles.css` (include the italic axis so the italics are real):
```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Playfair+Display:ital,wght@0,300;0,400;1,400;1,500&display=swap");
```
(If you prefer, load the same two families via `<link>` in the `<head>` instead — either works, but they MUST be loaded. If Google Fonts is unavailable in your environment, substitute any neutral grotesque + any high-contrast serif-with-true-italic and self-host via `@font-face`; never leave the display type on system defaults.)

## Layout / HTML
Single scrolling page. **Show and ship the whole document** — the `<head>` (with the stylesheet link) is part of the deliverable, not boilerplate you can drop:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Three.js 3D Scroll Experience</title>
    <!-- REQUIRED: without this link the page renders completely unstyled -->
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div class="model"></div>            <!-- fixed; Three.js canvas is appended here -->

    <nav>
      <p>oak <span>atelier</span></p>     <!-- "atelier" is set in the serif italic -->
      <a href="#">Contact Us</a>
    </nav>

    <section class="intro">
      <div class="header-row"><h1>Spaces for</h1></div>
      <div class="header-row">
        <h1>Future</h1>
        <p>Innovative furniture design studio. Crafting sustainable, bespoke, and functional solutions for homes and businesses.</p>
      </div>
      <div class="header-row"><h1>Living Here</h1></div>
    </section>

    <section class="archive">
      <div class="archive-header"><p>Collection</p></div>
      <!-- 6 archive-item blocks; each: -->
      <div class="archive-item">
        <h2>Ripple Bench</h2>
        <div class="archive-info"><p>US / EU</p><p>Design Concept</p><p>Bench</p><p>Outdoor</p></div>
      </div>
      <!-- remaining five titles + info rows:
           Arc Table    | US / EU | Design Concept  | Table    | Modern
           Orb Vase     | US / EU | Limited Edition | Decor    | Contemporary
           Grid Shelving| US / EU | Project Details | Shelving | Industrial
           Halo Pendant | US / EU | Project Details | Lighting | Modern
           Flow Chair   | US / EU | Design Concept  | Armchair | Minimalist -->
    </section>

    <section class="outro">
      <div class="outro-copy">
        <h2>We are a French, Dutch, and German multidisciplinary design atelier specializing in bespoke furniture, spatial installations, and immersive visual experiences.</h2>
        <p>Promos <span>info.oakatelier.com</span></p>
        <p>Contact <span>hello.oakatelier.com</span></p>
      </div>
      <div class="footer">
        <p>We are a French, Dutch, and German multidisciplinary design atelier specializing in bespoke furniture, spatial installations, and immersive visual experiences.</p>
        <p>Built by oak atelier</p>
      </div>
    </section>

    <!-- REQUIRED: the module entry point, at the end of the body -->
    <script type="module" src="./script.js"></script>
  </body>
</html>
```

## Styling
- **Fonts:** put the Google Fonts `@import` (above) as the first line of `styles.css`. Global font is the grotesque **Inter** stack; the serif **Playfair Display** stack is used for the word "atelier" in the nav, the archive `<h2>` titles, the "Collection" label (italic), and the `<span>`s inside paragraphs.
- **Reset:** `* { margin:0; padding:0; box-sizing:border-box; font-family:"Inter","Helvetica Neue",Arial,sans-serif; }`.
- **Page (dark canvas — mandatory):** `html, body { width:100vw; height:400vh; background-color:#111111; color:#fff; overflow-x:hidden; }`. Near-black background, white text — non-negotiable.
- **Type scale:** `h1` uppercase, `font-size:225px; font-weight:400; line-height:0.85;`. `a, p` `text-decoration:none; color:#fff; font-size:13px; font-weight:400; line-height:0.9;` and `<a>` uppercase. `p span` uses the Playfair serif stack.
- **.model:** `position:fixed; z-index:2;` — the WebGL canvas lives here, fixed above the scrolling content.
- **nav:** `position:fixed; top:0; left:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center;`. `nav a { text-transform:uppercase; }`.
- **section:** each `width:100vw; height:100vh` **except** `.archive` which is `height:200vh`.
- **.intro:** `display:flex; flex-direction:column; justify-content:center; padding:1em;`. `.header-row { display:flex; gap:12em; align-items:center; }`; `.header-row p { text-transform:uppercase; width:20%; }`.
- **.archive:** `display:flex; flex-direction:column; gap:3em; justify-content:center; align-items:center; text-align:center;`. `.archive h2 { font-family:"Playfair Display",Georgia,serif; font-size:120px; font-weight:300; color:#4f4f4f; }`. `.archive-info { width:100%; padding:1em; display:flex; justify-content:space-around; align-items:center; }` with its `p`s uppercase and `#4f4f4f`. `.archive-header p { font-family:"Playfair Display",Georgia,serif; font-style:italic; }`.
- **.outro:** `display:flex; flex-direction:column; justify-content:space-between; padding:6em 2em 2em 2em;`. `.outro-copy h2 { width:75%; text-transform:uppercase; font-size:60px; font-weight:400; line-height:1; margin-bottom:0.5em; }`. `.outro-copy p { display:flex; margin:1em 0; gap:2em; text-transform:uppercase; }`. `.outro-copy p span { font-family:"Playfair Display",Georgia,serif; }`. `.footer { display:flex; justify-content:space-between; align-items:flex-end; text-transform:uppercase; }` and `.footer p:nth-child(1) { width:25%; }`.
- **SplitText line mask (required for the outro reveal):** the JS splits `.outro-copy h2` into `.line` wrappers and puts a `<span>` inside each. Style them so the span can slide behind a clipped edge:
```css
.outro-copy h2 .line { position:relative; display:block; overflow:hidden;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
.outro-copy h2 .line span { position:relative; display:block; will-change:transform;
  transform: translateY(70px); }   /* starts pushed down, hidden by the line's overflow:hidden */
```
- Include the standard Lenis helper CSS: `.lenis.lenis-smooth { scroll-behavior:auto !important; }`, `.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior:contain; }`, `.lenis.lenis-stopped { overflow:clip; }`, `.lenis.lenis-smooth iframe { pointer-events:none; }`.

## GSAP / Three.js effect (the important part — be exhaustive)

### 1. Lenis + GSAP ticker wiring
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Also subscribe a second `lenis.on("scroll", (e) => { currentScroll = e.scroll; })` to keep a live scroll value for the model rotation.

### 2. Three.js scene, camera, renderer
```js
const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
renderer.setClearColor(0x000000, 0);                 // transparent canvas over the #111 page
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;
document.querySelector(".model").appendChild(renderer.domElement);
```

### 3. Lighting rig (four lights)
```js
scene.add(new THREE.AmbientLight(0xffffff, 0.75));

const mainLight = new THREE.DirectionalLight(0xffffff, 7.5); mainLight.position.set(0.5, 7.5, 2.5); scene.add(mainLight);
const fillLight = new THREE.DirectionalLight(0xffffff, 2.5); fillLight.position.set(-15, 0, -5);  scene.add(fillLight);
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.5); hemiLight.position.set(0, 0, 0); scene.add(hemiLight);
```

### 4. Load the model, center it, frame the camera, kick off the entrance
Run a lightweight `basicAnimate()` render loop (just `renderer.render` + `requestAnimationFrame`) until the model arrives, then swap to the real `animate()` loop.
```js
let model;
new GLTFLoader().load("/path/to/chair.glb", (gltf) => {
  model = gltf.scene;
  model.traverse((n) => {
    if (n.isMesh && n.material) {
      n.material.metalness = 2;         // pushed high for a lacquered/metallic sheen
      n.material.roughness = 3;
      n.material.envMapIntensity = 5;
    }
    n.castShadow = true; n.receiveShadow = true;
  });

  // center on origin
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  scene.add(model);

  // frame: camera distance = 1.75 × largest bounding-box dimension
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.z = maxDim * 1.75;

  model.scale.set(0, 0, 0);           // start invisible (scaled to zero)
  model.rotation.set(0, 0.5, 0);      // slight Y yaw so it reads 3/4-view
  playInitialAnimation();             // entrance tween (below)

  cancelAnimationFrame(basicAnimate); // (id is captured from the basic loop)
  animate();                          // start the real loop
});
```

### 5. Entrance tween (on load)
```js
function playInitialAnimation() {
  gsap.to(model.scale, { x:1, y:1, z:1, duration:1, ease:"power2.out" });
}
```
The chair **scales 0 → 1 over 1s, `power2.out`** — it pops into existence as the page opens.

### 6. Per-frame model animation (float + scroll-tilt)
Constants: `floatAmplitude = 0.2`, `floatSpeed = 1.5`. Precompute `totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight`. In the render loop:
```js
function animate() {
  if (model) {
    // (a) infinite vertical float — a sine bob, always on
    const floatOffset = Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude;
    model.position.y = floatOffset;   // oscillates within ±0.2 units

    // (b) scroll-driven tumble on X
    const scrollProgress = Math.min(currentScroll / totalScrollHeight, 1); // 0 → 1, clamped
    const baseTilt = 0.5;
    model.rotation.x = scrollProgress * Math.PI * 4 + baseTilt;            // up to 4 full π turns + 0.5 rad
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```
Key numbers: the float uses `Date.now()*0.001*1.5` as the sine argument (period ≈ 4.2 s, amplitude 0.2 world units). The tilt maps scroll 0→1 onto `rotation.x` of **0.5 → 0.5 + 4π** (≈ 13.07 rad) — the chair rotates head-over-heels **two full revolutions** across the whole 400vh scroll, always offset by the `baseTilt` of 0.5 rad. Rotation is **absolute per-frame** (recomputed from `currentScroll`, not incremented), so it tracks the scrollbar exactly and reverses when scrolling up.

### 7. Outro headline line-reveal (ScrollTrigger + SplitType)
```js
const splitText = new SplitType(".outro-copy h2", { types:"lines", lineClass:"line" });
splitText.lines.forEach((line) => {
  const text = line.innerHTML;
  line.innerHTML = `<span style="display:block; transform:translateY(70px);">${text}</span>`;
});

ScrollTrigger.create({
  trigger: ".outro",
  start: "top center",
  toggleActions: "play reverse play reverse",
  onEnter: () => gsap.to(".outro-copy h2 .line span", {
    translateY: 0, duration: 1, stagger: 0.1, ease: "power3.out", force3D: true,
  }),
  onLeaveBack: () => gsap.to(".outro-copy h2 .line span", {
    translateY: 70, duration: 1, stagger: 0.1, ease: "power3.out", force3D: true,
  }),
});
```
Each headline line is a `.line` with `overflow:hidden` + `clip-path` (see Styling); its inner `<span>` starts at `translateY(70px)` (below the mask). When `.outro`'s top hits the viewport center, the spans tween to `translateY(0)` — **duration 1s, `power3.out`, 0.1s stagger** top-to-bottom — so the sentence wipes up line by line. Scrolling back up past the trigger pushes them back down to 70px (the reverse tween).

## Assets / images
- **One 3D model file:** a single **GLB/glTF furniture model** — a stylized designer **chair** works best — modeled on/near the origin, transparent (no baked background). The code auto-centers it and auto-frames the camera to `1.75 × maxDim`, so any reasonably-scaled model fits. Material params are overridden in code (high metalness/roughness/envMapIntensity) for a glossy studio look. No texture atlas or other image assets are used.
- No photographic images anywhere else — the piece is all type + the single 3D object on a flat `#111111` background.

## Behavior notes
- **Desktop-first / heavy:** real-time WebGL + shadows + high-DPI render; not mobile-optimized (no reduced-motion or mobile fallback in the original).
- The float is an **infinite loop** independent of scroll; the tilt is **scroll-linked and clamped** to [0,1] progress (it stops tumbling once you reach the bottom).
- The model canvas is **fixed** and sits above the page (`z-index:2`, transparent clear color) so the scrolling type passes behind the floating chair.
- Handle window resize by updating `camera.aspect`, `camera.updateProjectionMatrix()`, and `renderer.setSize(...)` if you want it robust (the original omits this).
- `gsap.ticker.lagSmoothing(0)` is set so Lenis/GSAP time stays in lockstep on frame drops.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/offficestud/chair.glb
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--bone`, `--smoke`, `--smoke-strong`, `--oak`, `--font`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already anticipates being re-invoked: a `destroyed` flag gates both render loops, the glTF callback, and the two `ScrollTrigger` handlers, and `destroy()` walks back everything `mount` created — two `requestAnimationFrame` loops, the outro trigger, the Lenis instance and its ticker subscription, the split headline, and the chair's own geometry, materials and textures. That is most of the discipline a React effect needs. What it does not anticipate is React calling `mount()` a second time before you have done anything with the first `destroy()` — the pair was built for one external caller (this catalogue's own editor, via `window.MP.register`) re-triggering it deliberately, not for React's remount timing.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Call `mount()` and discard its return value instead of wiring that return value back as the effect's own cleanup function, and the second mount finds the first mount's `WebGLRenderer` still appending its canvas into `.model`, the first Lenis instance still ticking on the shared `gsap.ticker`, and — if the `chair.glb` fetch the first mount kicked off is still in flight — a second `GLTFLoader` request racing it into a different scene. The symptom is two canvases layered into the same fixed box, or a chair that fades in twice at two different scales, and it will not reproduce in a production build, because only development double-invokes effects. Treat `destroy()` as the effect's cleanup itself, not as an extra call the effect makes on top of its own teardown.

*(1) The entry point* — the bottom of the file checks `document.readyState` before deciding whether to still wait for `DOMContentLoaded`: loading in progress subscribes to the event, anything past that calls `boot()` immediately. That branch, and the `window.MP` branch above it, exist so this one file can run either as the published standalone page or inside this catalogue's own editor — neither situation describes a React host, where `useEffect` already runs after the DOM is committed. Delete both branches and call `mount({ ...DEFAULTS })` directly inside a `useEffect` with an empty dependency array, keeping its return value as that effect's cleanup.

*(2) Element lookups* — `mount` reaches for exactly three selectors: `.model`, to append the renderer's canvas; `.outro-copy h2`, to split into lines; and `.outro`, the `ScrollTrigger` trigger. Give the component a root ref, render all three inside it, and scope every lookup to that ref instead of `document`. During the StrictMode remount two copies of this subtree briefly coexist, and an unscoped `querySelector` can bind the canvas — or the split — to the copy that is on its way out.

*(3) Cleanup* — the two render loops, the ticker-driven Lenis instance, and the two things this effect only ever builds from an asynchronous continuation each need their own note, followed by the port to `@react-three/fiber`.

### Two render loops, and neither one is the steady state

`mount` runs two `requestAnimationFrame` loops that are never active at the same time: `basicAnimate` renders the bare, lit scene every frame until the chair arrives, then hands off to `animate`, which additionally writes the sine float and the scroll-driven tilt. Because that handoff happens inside the (asynchronous) glTF callback, which loop is running at unmount depends on network timing, not on anything the component controls — a StrictMode double-mount can easily still have the *first* mount's `basicAnimate` running when the *second* mount starts, if `chair.glb` hasn't resolved yet. Keep `frame` and `basicFrame` as two separate handles local to the effect closure, not module-level variables — module scope would let the second mount's cleanup cancel a frame that belongs to the first mount, or vice versa — and cancel whichever one is non-null in the cleanup, exactly as `destroy()` already does.

### The context starts empty: both animated things here are registered later, not created up front

Nothing this component animates with GSAP is created synchronously. The chair's entrance tween only exists once `chair.glb` has loaded; the outro line-reveal only exists once the headline has been split, and splitting only produces trustworthy line breaks once the real display face has replaced the fallback. So a `gsap.context(() => {}, rootRef)` scoped to the root ref starts out with nothing in it, and the two things it eventually owns are added from two separate asynchronous continuations — which is exactly the situation the `self`-vs-`ctx` rule is about, but with the roles reversed from the usual case: neither continuation can run *during* the synchronous factory pass, so naming the outer `ctx` from inside either one is not the temporal-dead-zone trap it would be if attempted inside the factory itself. What still matters is giving each continuation something durable to call. Register the scale-up tween as a named method during the synchronous pass — inline code such as `` self.add("playEntrance", (target) => { /* the same scale-up tween, targeting target.scale */ }) `` — and invoke it later as `ctx.playEntrance(gltf.scene)` from inside the (`cancelled`-guarded) glTF callback. That also retires the standalone `gsap.killTweensOf(model.scale)` the vanilla `destroy()` calls by hand: `ctx.revert()` already reverts anything registered through the context, entrance tween included, whenever the model did finish loading before unmount. If it never did, `disposeModel(gltf.scene)` on the just-parsed scene is the only cleanup that callback needs — the loader has already allocated GPU geometry and materials by the time it calls you back, and nothing else will free them if you just drop the reference.

The headline follows the same shape, gated by `document.fonts.ready` instead of the network. `SplitType` measures line breaks against whichever font is actually painted at the moment it runs; the outro `<h2>` renders in Playfair Display, a serif with real italics and metrics well off its Georgia fallback, so splitting before the swap breaks the mask against line boundaries the shipped font immediately invalidates. Wait on `document.fonts.ready`, guard the continuation with the *same* cancellation flag the glTF callback checks — one shared flag, not two — and register the split plus the `ScrollTrigger.create` call for `.outro` onto the context once it resolves, the same way this catalogue defers any font-dependent measurement elsewhere. Whichever order the two continuations settle in, revert in the order `destroy()` already uses: kill any tween still running on `.line span` before calling `splitText.revert()`, never after — reverting first hands GSAP a set of nodes it no longer has a tween pointed at, while the live tween keeps writing into spans `revert()` just pulled out from under it. And because StrictMode means this whole sequence can run twice, an un-reverted split on the second mount would split the first mount's already-split `<span>`s one level deeper, targeting the wrong nodes entirely.

### Lenis and the ticker it rides on

`gsap.ticker.add(raf)` is not something `ctx.revert()` undoes — the context only tracks tweens and triggers, and a ticker subscription is neither. Keep the exact `raf` reference `mount` already captures and call `gsap.ticker.remove(raf)` in the cleanup regardless of whether the rest of the setup lives inside a context. Miss it and the StrictMode remount leaves the first mount's `raf` still firing on the shared ticker after `lenis.destroy()` has already run on the instance it feeds — harmless the first time, but it doubles the ticker's per-frame work for the life of the page the next time this route mounts. If this hero ever ships as one section of a larger React app that already runs its own page-wide Lenis instance, don't construct a second one here — feed this component scroll position from the existing instance instead; two instances fighting over the same wheel event produce visible stutter with nothing in the console pointing at why.

### Mapping this scene to `@react-three/fiber`

**If your host app is React**, this scene is a strong candidate for `@react-three/fiber` rather than a verbatim `useEffect` port (three 0.185 · `@react-three/fiber` 9 · `@react-three/drei` 10.7 · React 19):

- `<Canvas>` replaces the manual `WebGLRenderer` / `Scene` / `PerspectiveCamera` block. Carry the renderer flags over as `<Canvas gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 2.5 }} shadows>`. `renderer.physicallyCorrectLights = true` has nothing to port to: the three version this catalogue pins no longer treats physically-correct light falloff as a switch you flip, it is the only behavior lights have, so that line is already dead weight even in the vanilla build.
- The four lights — the ambient wash, the two directional lights, the hemisphere light — become four JSX elements (one `<ambientLight>`, two `<directionalLight>`s, one `<hemisphereLight>`) carrying the same intensities and positions as props, instead of four `new THREE.*Light()` calls added to `scene` by hand.
- `GLTFLoader().load("/c/offficestud/chair.glb", …)` becomes `useGLTF("/c/offficestud/chair.glb")`, served from your own domain rather than this catalogue's. The bounding-box recenter and the camera-distance framing still have to happen — do them once in a `useMemo` keyed on the loaded scene, or inside a `<group>` positioned after computing the same `Box3`.
- `animate()` becomes a `useFrame` callback: the sine float writes the mesh's `position.y`, the scroll-driven tilt writes its `rotation.x`, reading current scroll progress from a ref your Lenis/`ScrollTrigger` wiring updates from outside the canvas tree — don't route that value through `setState`, or every scroll tick re-renders the React tree instead of just moving a mesh. The `basicAnimate`/`animate` handoff disappears with it: `<Canvas>` renders every frame from the moment it mounts whether or not the model has arrived, so there is no placeholder loop left to build, hold a handle for, or cancel.
- Resize handling is already done — `<Canvas>` observes its own container and keeps the camera's aspect and the renderer's size in sync without a manual `resize` listener (the vanilla script has none either, so this is a plain win, not something being taken away).
- Disposal of the model's geometry, materials and textures still needs `disposeModel`'s traversal somewhere: R3F disposes what it renders declaratively when a `<primitive object={scene} />` unmounts, but if this component ever swaps the model at runtime rather than mounting it once, run that same traversal on the outgoing scene first — drei's GLTF cache does not free it for you.

**A static poster is mandatory, not a nicety.** The chair is invisible for however long the `chair.glb` fetch and parse take, and unlike the vanilla version's `basicAnimate` — which at least paints the lit, empty scene while it waits — a cold `<Canvas>` mount shows nothing at all until its first frame. Render a poster image inside the same `.model` box and swap it out only once `useGLTF` has resolved and the entrance tween has actually started.

**Do not reach for drei's `Environment` with a `preset`.** The vanilla materials already run with no environment map at all — `envMapIntensity` is pushed high on every mesh, but nothing in this file ever assigns `scene.environment` or a material's `envMap`, so that multiplier has nothing to multiply, and the visible sheen comes entirely from the pushed metalness/roughness plus the four hand-placed lights. Porting straight to those same four lights, with no `<Environment>` at all, matches what is actually on screen today. Reaching for a preset would add a third-party CDN dependency this scene doesn't currently have, for a reflection contribution the original doesn't have either — and it fails closed, unlit, the moment that host is unreachable.
