---
slug: silenceo
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 2
structural_literals: 14
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.in\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# 3D Scroll Scanner Experience

## Goal
Build a full-page, five-viewport-tall scroll story whose star is a **single stylized 3D product model (a beverage-can hero prop)** rendered in Three.js against a clean off-white stage. On load the model **scales up from nothing and floats** (a gentle sine bob) while slowly self-rotating. As you scroll, its **X-rotation is driven by scroll progress** through a Lenis-fed render loop, so it tumbles forward as the page advances. When you reach a **pinned "scanner" section** — an empty rounded rectangle frame with product-ID chip, barcode, and a red "verified" pill — a GSAP `ScrollTrigger.onEnter` handler **plays a scanner-beep sound, spins the model a full 360°, then shrinks the model and the scanner frame to zero** (the product is "scanned away"). Scrolling back up re-grows the frame and restores the model. The whole thing runs on a continuous `requestAnimationFrame` render loop plus two ScrollTriggers.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`three` (npm)**, **`gsap` (npm)** with the **`ScrollTrigger`** plugin, and **`lenis`** for smooth scroll. Import exactly:
```js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```
Motion comes from three sources working together: (a) a per-frame `requestAnimationFrame` loop that floats/rotates the model and maps scroll→rotation, (b) two `ScrollTrigger`s (one pin + reveal, one reset-on-scroll-back), and (c) GSAP tweens fired inside the ScrollTrigger callbacks. Lenis drives the ticker and feeds `ScrollTrigger.update`.

## Layout / HTML
The DOM is tiny — a fixed WebGL host div plus four full-viewport sections. The renderer's `<canvas>` is appended into `.model`; everything else is HTML overlay/copy.
```html
<body>
  <div class="model"></div>

  <section class="hero">
    <h1>Digital <br />Evolution</h1>
    <h2>Transform Your Brand Identity</h2>
    <p>Experience the next generation of digital product design. We craft
       immersive experiences that blend innovation with functionality, helping
       brands stand out in the digital landscape.</p>
  </section>

  <section class="info">
    <div class="tags">
      <p>Brand Strategy</p>
      <p>User Experience</p>
      <p>Digital Products</p>
      <p>Innovation Lab</p>
    </div>
    <h2>We believe in creating digital products that not only look exceptional
        but drive real business growth and user engagement through thoughtful
        design and strategic innovation.</h2>
    <p>Our approach combines cutting-edge technology with human-centered design
       principles. We transform complex challenges into seamless digital
       experiences that resonate with your audience and elevate your brand in
       the digital space.</p>
  </section>

  <section class="scanner">
    <div class="scan-info">
      <div class="product-id"><h2>#2024</h2></div>
      <div class="product-description"><p>Transform Your Digital Identity</p></div>
    </div>

    <div class="scan-container"></div>

    <div class="barcode"><img src="/path/barcode.png" alt="" /></div>

    <div class="purchased"><p>Innovation Verified</p></div>
  </section>

  <section class="outro">
    <h2>Join the revolution where innovative experience meets strategic thinking.
        Let's create products that don't just exist in digital space -
        they define it.</h2>
  </section>

  <script type="module" src="./script.js"></script>
</body>
```
- `.model` — fixed full-viewport WebGL host; the `<canvas>` is appended here in JS. It sits **behind** the sections (they have `z-index:2`), so the 3D model is always visible centered on screen while the copy scrolls over the top of it.
- `.scanner` — the pinned section. `.scan-info` is an absolutely-positioned top bar (product-ID chip left, description right). `.scan-container` is the empty **280×480 bordered frame** the model appears to sit inside. `.barcode` is a bottom-left image; `.purchased` is a bottom-right red "verified" pill.
- All copy is neutral placeholder text — invent your own; no real client brands.

## Styling
Global reset `* { margin:0; padding:0; box-sizing:border-box; }`, and critically **every element** uses `font-family:"Neue Haas Grotesk Display Pro"` (fall back to a clean neutral grotesk like Helvetica/Arial) and `text-transform:uppercase`.

- `html, body`: `width:100vw; height:500vh;` — **the page is five viewports tall**; the extra height beyond the four sections gives the pinned scanner room to scroll.
- `img`: `width:100%; height:100%; object-fit:cover;`
- `canvas`: `position:fixed; top:0; left:0;`
- `h1`: `text-align:center; font-size:10vw; font-weight:300; line-height:100%;` — huge, light hero headline.
- `h2`: `font-size:2.5vw; font-weight:500; line-height:100%;`
- `p`: `font-size:12px; font-weight:500; line-height:100%;` — tiny uppercase body text.
- `.model`: `position:fixed; width:100%; height:100vh; background:#fefdfd;` — off-white full-screen stage behind the content.
- `section`: `position:relative; width:100vw; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:1em; z-index:2;` — each section is exactly one viewport, contents centered.
- `.hero h1`: `margin-bottom:0.25em;` · `.hero p`: `width:50%; text-align:center;`
- `.info`: `gap:8em;` · `.info .tags`: `width:60%; display:flex; gap:2em;` · `.info h2`: `width:75%; text-align:center;` · `.info p`: `width:60%; text-align:center;`
- `.scan-info`: `position:absolute; top:0; width:100vw; display:flex; justify-content:space-between; padding:2em;`
- `.scan-container`: `width:280px; height:480px; border:1px solid #000; border-radius:0.5em;` — the empty scanner frame (no fill; the 3D model shows through from the fixed canvas behind it).
- `.barcode`: `position:absolute; bottom:1em; left:2em; width:200px; height:100px;`
- `.purchased`: `position:absolute; bottom:2em; right:2em; padding:0.5em 4em; color:red; border:1px solid red; border-radius:2em;` — a red-outlined pill.
- `.outro h2`: `width:70%; text-align:center;`
- Include the standard Lenis CSS block (`.lenis.lenis-smooth{scroll-behavior:auto !important} .lenis.lenis-stopped{overflow:clip}` etc.).

Palette: near-white `#fefdfd` stage, black text/border, one **red** accent on the "verified" pill. The renderer clear color is white (`0xffffff`) and the scene background is `#fefdfd`, so canvas and page blend seamlessly.

## Three.js scene & render pipeline (be exhaustive)

### 1. Smooth scroll (Lenis) drives the GSAP ticker
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

### 2. Scene / camera / renderer
```js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefdfd);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;               // bright, punchy exposure for the white stage
document.querySelector(".model").appendChild(renderer.domElement);
```
Camera `z` is **not** set here — it is computed after the model loads from the model's bounding-box size (see §5).

### 3. Lighting — four sources (bright, even, product-shot lighting)
```js
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 7.5);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 3);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);
```
All white lights, high intensities — the product reads clean and bright on the near-white background.

### 4. Bootstrap render loop (runs until the model is ready)
Before the GLTF resolves, run a minimal loop so the (empty) scene paints:
```js
function basicAnimate() { renderer.render(scene, camera); requestAnimationFrame(basicAnimate); }
basicAnimate();
```
When the model finishes loading, `cancelAnimationFrame(basicAnimate)` and start the full `animate()` loop (§7) instead.

### 5. Load, tune, recenter and frame the GLTF model
```js
let model;
const loader = new GLTFLoader();
loader.load("/path/product.glb", (gltf) => {
  model = gltf.scene;
  model.traverse((node) => {
    if (node.isMesh && node.material) {
      node.material.metalness = 0.3;
      node.material.roughness = 0.4;
      node.material.envMapIntensity = 1.5;
    }
    node.castShadow = true;
    node.receiveShadow = true;
  });

  // recenter on world origin via bounding-box center
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  scene.add(model);

  // frame the camera from the model's size
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.z = maxDim * 1.5;              // pull back 1.5× the largest dimension

  model.scale.set(0, 0, 0);                       // start invisible for the reveal
  playInitialAnimation();

  cancelAnimationFrame(basicAnimate);
  animate();
});
```
Every mesh gets a **semi-metallic material** (`metalness 0.3`, `roughness 0.4`, `envMapIntensity 1.5`) and shadow casting/receiving. The `Box3 → getCenter → position.sub(center)` step puts the model's geometric middle at `(0,0,0)`; `camera.position.z = maxDim * 1.5` frames it consistently regardless of authored scale.

### 6. Animation constants + scanner wiring
```js
const floatAmplitude = 0.2;   // vertical bob height
const floatSpeed     = 1.5;   // bob frequency
const rotationSpeed  = 0.3;   // idle self-spin rate
let   isFloating     = true;
let   currentScroll  = 0;

const stickyHeight     = window.innerHeight;
const scannerSection   = document.querySelector(".scanner");
const scannerPosition  = scannerSection.offsetTop;      // scroll offset where scanner starts
const scanContainer    = document.querySelector(".scan-container");
const scanSound        = new Audio("/path/scan-sfx.mp3");
gsap.set(scanContainer, { scale: 0 });                  // frame starts collapsed
```

## GSAP effect (the important part — be exhaustive)

### A. Initial reveal (fires the moment the model loads)
```js
function playInitialAnimation() {
  gsap.to(model.scale,   { x: 1, y: 1, z: 1, duration: 1, ease: "power2.out" });
  gsap.to(scanContainer, { scale: 1,          duration: 1, ease: "power2.out" });
}
```
Model **and** scanner frame both grow `0 → 1` over **1s / `power2.out`**, in parallel.

### B. ScrollTrigger #1 — restore on scroll back to the very top
```js
ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: "top -10",
  onEnterBack: () => {
    if (model) {
      gsap.to(model.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "power2.out" });
      isFloating = true;                                 // resume the float
    }
    gsap.to(scanContainer, { scale: 1, duration: 1, ease: "power2.out" });
  },
});
```
A tiny 10px trigger at the top: when the user scrolls **back** into it, the model and frame re-grow to full scale (`1s / power2.out`) and floating turns back on — undoing the scan.

### C. ScrollTrigger #2 — the pinned scan sequence
```js
ScrollTrigger.create({
  trigger: ".scanner",
  start: "top top",
  end: `${stickyHeight}px`,     // pins for one viewport of scroll
  pin: true,
  onEnter: () => {
    if (!model) return;
    isFloating = false;          // stop the bob
    model.position.y = 0;        // settle to center

    setTimeout(() => {           // 500ms after enter, play the scanner beep
      scanSound.currentTime = 0;
      scanSound.play();
    }, 500);

    // 1) spin a full 360° on Y …
    gsap.to(model.rotation, {
      y: model.rotation.y + Math.PI * 2,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        // 2) … then shrink the model to nothing …
        gsap.to(model.scale, {
          x: 0, y: 0, z: 0,
          duration: {{motion.duration.base}},
          ease: "power2.in",
          onComplete: () => {
            // 3) … then collapse the scanner frame.
            gsap.to(scanContainer, { scale: 0, duration: {{motion.duration.base}}, ease: "power2.in" });
          },
        });
      },
    });
  },
  onLeaveBack: () => {
    gsap.set(scanContainer, { scale: 0 });               // snap frame to 0 …
    gsap.to(scanContainer, { scale: 1, duration: 1, ease: "power2.out" }); // … then re-grow it
  },
});
```
This is the signature moment. On entering the pinned scanner:
1. **Full spin** — `model.rotation.y += Math.PI * 2` over **1s / `power2.inOut`**.
2. **On complete → shrink model** — `scale 1 → 0` over **0.5s / `power2.in`**.
3. **On complete → collapse frame** — `scanContainer scale 1 → 0` over **0.5s / `power2.in`**.
   The three tweens are **chained via `onComplete`**, so they run strictly in sequence (spin → model vanishes → frame vanishes), total ~2s. A 500ms `setTimeout` fires the scanner-beep SFX just as the spin begins. Scrolling back out (`onLeaveBack`) snaps the frame to 0 and re-grows it (`1s / power2.out`).

### D. Scroll value + the per-frame loop (scroll → model rotation)
```js
lenis.on("scroll", (e) => { currentScroll = e.scroll; });   // capture Lenis scroll px

function animate() {
  if (model) {
    if (isFloating) {
      const floatOffset = Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude;
      model.position.y = floatOffset;                 // sine bob, ±0.2
    }

    const scrollProgress = Math.min(currentScroll / scannerPosition, 1);   // 0→1 up to the scanner

    if (scrollProgress < 1) {
      model.rotation.x = scrollProgress * Math.PI * 2;   // X-tumble mapped to scroll (0 → 2π)
    }
    if (scrollProgress < 1) {
      model.rotation.y += 0.001 * rotationSpeed;         // slow idle Y drift while approaching
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```
Two continuous behaviors before the scan:
- **Float** — while `isFloating`, `position.y = sin(Date.now()·0.001·1.5)·0.2`, an endless gentle hover. Turned off the instant the scanner pin fires (§C) and back on at the top (§B).
- **Scroll-mapped tumble** — `scrollProgress = min(currentScroll / scannerPosition, 1)` is 0 at the top and reaches 1 exactly when the scanner section is reached. While `< 1`, **`model.rotation.x = scrollProgress · 2π`** (one full forward tumble across the pre-scanner scroll) plus a tiny `rotation.y += 0.001·0.3` idle drift each frame. Once progress hits 1 (scanner reached) these stop, handing control to the ScrollTrigger spin.

### 8. Resize
```js
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}, false);
```

## Assets / images
- **One GLTF/GLB 3D model** — a **single stylized hero product: a beverage can** (a tall cylindrical drink can with printed label artwork). Mid-poly, meant to be viewed as one centered object. Any comparable canned-drink / bottle GLB works; no real-world brand or label text required. Materials are overridden in code to a light semi-metallic look.
- **One barcode image** (`barcode.png`) — a **black-and-white product barcode graphic**, roughly **2:1 landscape** (displayed 200×100), bottom-left of the scanner section.
- **One audio file** (`scan-sfx.mp3`) — a short **scanner-beep / checkout-scan sound effect** (~1s), played once when the scan sequence begins.

## Behavior notes
- **Trigger model:** load (initial reveal) + scroll (Lenis smooth scroll → scroll-mapped tumble) + a pinned ScrollTrigger (the scan sequence). No hover/click/mousemove.
- **Heavy, WebGL-required, desktop-first.** The scene renders continuously via `requestAnimationFrame`; not mobile-optimized. `100vw/500vh` fixed layout with `vw`-based type; no responsive breakpoints in the original.
- **Audio needs a user gesture** — the beep may be blocked until the user has interacted with the page (browsers gate autoplay audio); scrolling to the scanner generally satisfies this.
- **Reversible:** scrolling back up to the top re-grows the model and frame and resumes floating; the piece has no explicit reduced-motion path.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/silenceo/barcode.png
https://motionprompts.dev/c/silenceo/josta.glb
https://motionprompts.dev/c/silenceo/scan-sfx.mp3
```

The third one is the scanner beep. The GSAP section writes it as `new Audio("/path/scan-sfx.mp3")`
— replace that placeholder path with the URL above (or your own file).

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--muted`, `--red`, `--teal`, `--halo`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here specifically: two `ScrollTrigger`s pinning the same `.scanner` section, two Lenis instances fighting over the same wheel event, two `WebGLRenderer`s both appended into `.model`. The visible symptom is a scanner pin that fires twice, or a float that runs at double amplitude, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

**(1) The entry point.** This script runs at the top level: the Lenis instantiation, the `THREE.Scene`/camera/`WebGLRenderer` construction, the four lights, the first call to `basicAnimate()`, and the `GLTFLoader.load("/c/silenceo/josta.glb", …)` call all fire the moment the module is evaluated. In a component that moment is import time, before the `.model` div exists. Move the whole block — everything from the Lenis setup through the `resize` listener — into a `useEffect` with an empty dependency array. Do not leave any of it in the component body: re-running `new THREE.WebGLRenderer(...)` and re-issuing the GLTF fetch on every render would leak a renderer and refetch the model on every keystroke that touches this component's state.

**(2) Element lookups.** `document.querySelector(".model")`, `.scanner`, and `.scan-container` all assume this component owns the page. Give the component a root ref, mount it on the wrapper that contains `.model` and all four sections, and scope those three lookups to it. The one exception is the first `ScrollTrigger.create({ trigger: "body", ... })` — that trigger is legitimately document-level (it fires on the top ten pixels of page scroll, not on anything inside this component), so leave it targeting `"body"` rather than the root ref.

**(3) Cleanup.**

*GSAP / ScrollTrigger* — Wrap both `ScrollTrigger.create` calls and the two tweens inside `playInitialAnimation` in a `gsap.context` scoped to the root ref, and revert it on cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* Lenis wiring, scene/lights, both ScrollTrigger.create calls, playInitialAnimation */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Without the revert, the StrictMode remount leaves a second pinned `.scanner` trigger and a second top-of-page trigger, both listening to the same scroll. `gsap.ticker.add((time) => lenis.raf(time * 1000))` is neither a tween nor a trigger, so `ctx.revert()` does not touch it — keep the function reference and call `gsap.ticker.remove` on it yourself, or the ticker keeps calling `.raf()` on a Lenis instance the same cleanup just destroyed.

*Lenis* — `new Lenis()` is a single, document-scoped smooth-scroll instance. Call `lenis.destroy()` in the same cleanup that removes the ticker callback, and unsubscribe the `lenis.on("scroll", ...)` listener that feeds both `ScrollTrigger.update` and `currentScroll`.

*Model load resolving after unmount* — `GLTFLoader.load`'s success callback is exactly the kind of continuation that can fire after a StrictMode unmount: if it resolves late, it calls `scene.add(model)` on a scene the cleanup already tore down, then `playInitialAnimation()` tweens a model nothing is rendering, then it starts `animate()` — a second render loop the teardown never gets a chance to cancel. Guard the callback body with a `cancelled` flag the cleanup flips, and check it before `scene.add`, before `playInitialAnimation()`, and before calling `animate()`.

*rAF, two loops, only one active* — `basicAnimate` runs until the GLTF resolves; the load callback then calls `cancelAnimationFrame(basicAnimate)` and starts `animate`. Keep the *current* loop's id in a ref that both loops overwrite every frame, not a plain variable captured once at effect setup, and cancel whichever id the ref currently holds in the cleanup. Cancelling only the id `basicAnimate()`'s first call returned does nothing once `animate` has taken over — the loop that's actually running at unmount time survives.

### Mapping the render pipeline onto R3F

This component's `three` usage folds onto `@react-three/fiber` rather than porting the class calls one for one:

- **`<Canvas>` owns the renderer, scene and camera.** Delete `new THREE.WebGLRenderer`, `renderer.setClearColor`, the `shadowMap`/`toneMapping`/`toneMappingExposure` block, and `new THREE.PerspectiveCamera`. They become a `gl` config plus `shadows` on `<Canvas>`, and a `<PerspectiveCamera makeDefault fov={75} near={0.1} far={1000} />`; `scene.background = new THREE.Color(0xfefdfd)` becomes `<color attach="background" args={[0xfefdfd]} />`. The camera's `z` still can't live in JSX as a static prop — it's computed from the loaded model's bounding box (`maxDim` scaled up) — so that one assignment stays imperative, set once the model ref resolves.
- **The two rAF loops collapse into a single `useFrame`.** `basicAnimate`'s only job is to keep painting the off-white stage while the GLTF is in flight; inside a `<Canvas>` that already happens automatically, frame after frame, whether or not the model exists yet. There is nothing left to bootstrap. Write one `useFrame` callback that bails out when `modelRef.current` is null and otherwise runs the float and the scroll-mapped rotation against it; do not start a `requestAnimationFrame` loop of your own alongside it.
- **`GLTFLoader.load("/c/silenceo/josta.glb", ...)` becomes `useGLTF("/c/silenceo/josta.glb")`**, served from your own domain. The recenter step (`Box3` → `getCenter` → `position.sub(center)`) and the per-mesh material overrides (`metalness`, `roughness`, `envMapIntensity`) still have to run once against the loaded graph — do that in an effect keyed on the resolved scene, or on a memoized clone of it, not inline in JSX where it would rerun on every render.
- **GSAP still targets the live object, through a ref.** `model.scale`, `model.rotation`, and `model.position.y` are tweened by mutating properties directly on a plain `THREE.Object3D`; that does not change under R3F, you just reach the object as `modelRef.current` instead of the module-scoped `model` variable, and the `onEnter` / `onEnterBack` / `onLeaveBack` callbacks read `modelRef.current` the same way.
- **Resize is already handled.** `<Canvas>` observes its own container; drop the manual `window.addEventListener("resize", onWindowResize)` block along with the `camera.updateProjectionMatrix()` and `renderer.setSize` calls inside it.
- **A poster is mandatory here, not a nicety.** `useGLTF` suspends: with a `Suspense` boundary around the canvas contents, nothing paints while `josta.glb` is loading — not the model, not the off-white stage, not the four lights — whereas the vanilla version already renders `#fefdfd` and a lit, empty scene from the first frame via `basicAnimate`. Render a static poster image sized to `.model`'s box beneath the `<Canvas>` and hide it once the suspended content has committed, or the React version regresses to a blank frame the original never showed.
- **No `Environment` preset.** This scene already lights itself explicitly — one ambient light, two directional lights, one hemisphere light — and never calls drei's `Environment`. Keep it that way: reaching for an `Environment` preset later would trade four lights you fully control for a dependency on a CDN this component otherwise has nothing to do with.
