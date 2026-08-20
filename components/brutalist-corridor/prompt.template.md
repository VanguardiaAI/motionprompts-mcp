---
slug: brutalist-corridor
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 2
structural_literals: 13
structural:
  - { kind: duration, literal: "4", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: duration, literal: "0.1", rule: duration/loop }
  - { kind: duration, literal: "0.15", rule: duration/loop }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Brutalist Sci-fi Corridor — WebGL Preloader Reveal

## Goal
Build a full-viewport WebGL hero: a **brutalist concrete corridor** rendered in Three.js with **UnrealBloom + a custom film-grain shader**, revealed by an on-load cinematic sequence. First a **preloader counter climbs 0 → 100** over a solid black overlay while the GLTF model loads; then a single **GSAP timeline** fades the counter and overlay out, **sweeps the camera 180° around** the corridor to its resting angle, and **scrambles the nav + heading text in** via randomized per-character opacity flickers. Once the intro finishes, the camera **follows the mouse** with a lerped parallax sway. The overlaid HTML text uses `mix-blend-mode: difference`, so it reads as black over the bright, bloom-blown white scene and inverts as the camera moves.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** and **`three` (npm)**. **No GSAP plugins** (no ScrollTrigger, no SplitText, no CustomEase — the text split is hand-rolled). No Lenis / no smooth-scroll (the page never scrolls). Import from three's examples/addons:
```js
import gsap from "gsap";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
```

## Layout / HTML
Four stacked layers over the canvas host. Fictional brand name is **"Astrolume"** (use it or neutral text — no real brands).
```html
<body>
  <div class="corridor"></div>            <!-- WebGL canvas is appended here by JS -->

  <div class="loading">Loading Scene</div> <!-- shown until GLTF finishes loading -->

  <div class="overlay">                     <!-- opaque black cover over the whole viewport -->
    <div class="counter"><p>0</p></div>     <!-- preloader number -->
  </div>

  <div class="hero">                        <!-- HTML UI layer, mix-blend-mode: difference -->
    <nav>
      <div class="logo"><a href="#">Astrolume</a></div>
      <div class="nav-items">
        <a href="#">Apparel</a><a href="#">Events</a><a href="#">Archive</a>
      </div>
      <div class="site-year"><p>2024 [N]</p></div>
    </nav>
    <h1>Blending contemporary minimalism with futuristic innovation to create designs that transcend trends and define elegance.</h1>
    <div class="footer"><p>/ Made by Astrolume</p></div>
  </div>

  <script type="module" src="./script.js"></script>
</body>
```

## Styling
- Reset `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; background-color:#0f0f0f; }` (the CSS body bg only shows for a blink; the WebGL scene background is white).
- `.corridor { position:absolute; top:0; left:0; width:100vw; height:100vh; }` — hosts `renderer.domElement`.
- `.loading { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); text-transform:uppercase; font-family:"PP Neue Montreal"; font-size:13px; color:#fff; }` (any clean sans fallback is fine).
- `.overlay { position:fixed; inset:0; width:100vw; height:100vh; background-color:#000; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:1em; }` — the black preloader cover. `.counter p { color:#fff; }`.
- `h1 { position:absolute; bottom:1em; left:1em; width:60%; text-transform:uppercase; font-family:"LomoCopy Lt Std"; color:#fff; user-select:none; }` — big display serif/display face bottom-left (any bold display fallback is fine).
- `p, a { text-decoration:none; text-transform:uppercase; font-family:"Akkurat Mono", monospace; font-size:12px; color:#fff; }` — small mono UI text.
- `.hero { position:absolute; inset:0; width:100vw; height:100vh; z-index:2; mix-blend-mode:difference; }` — **critical**: this is what makes the white UI text invert to black over the white/bloomed scene and shift as the camera pans.
- `nav { position:absolute; top:0; left:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center; }`. `.nav-items { display:flex; gap:2em; }`. `.footer { position:absolute; right:2em; bottom:2em; }`.

## The effect (be exhaustive)

### Renderer / camera / scene
```js
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);            // bright white backdrop (bloom blows it out)
const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ powerPreference:"high-performance", antialias:false, stencil:false, depth:false });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.NoToneMapping;
document.querySelector(".corridor").appendChild(renderer.domElement);
```

### Lights
- `AmbientLight(0xffffff, 0.5)`.
- `DirectionalLight(0xffffff, 0.5)` at `(5,8,5)`, `castShadow = true` (key).
- `DirectionalLight(0x000000, 0.5)` at `(-5,3,-5)` (black fill → effectively no fill, kept for parity).
- `PointLight(0xffffff, 2, 1)` at `(2,3,2)` and another at `(-2,3,-2)` (distance 1, so very localized hot spots).

### Camera orbit geometry (constants)
```js
const initialAngle = Math.PI / 4;      // 45° — the resting angle
const radius       = Math.sqrt(50);    // ≈ 7.071
let currentAngle   = initialAngle + Math.PI;  // start 180° opposite (≈225°)
let targetAngle    = initialAngle;
let currentY = 0, targetY = 0;
```
Camera always sits on a horizontal circle of `radius` around the origin and looks at `(0,0,0)`:
`camera.position.x = Math.cos(currentAngle)*radius; camera.position.z = Math.sin(currentAngle)*radius; camera.position.y = currentY; camera.lookAt(0,0,0);`
So the resting shot is `(5, 0, 5)` and the start shot is `(-5, 0, -5)`.

### GLTF load + material rebuild
Load a brutalist corridor GLTF (path `/c/brutalist-corridor/scene.gltf`). In the callback, `model.traverse` every mesh:
- `child.castShadow = child.receiveShadow = true`.
- Pick an **emissive color by mesh-name substring** from `{ screen:0x00ff00, lamp:0xffaa00, light:0xffffff, default:0xffffff }` (first key whose lowercase name is `includes`-matched wins; else `default`). This single-mesh corridor matches none, so all meshes get white — and emissiveIntensity is 0 anyway, so emissive is inert here; keep the logic for parity.
- Replace each material with:
```js
new THREE.MeshStandardMaterial({
  color: child.material.color,
  map: child.material.map,
  emissive: emissiveColor,
  emissiveIntensity: 0,
  roughness: 5.0,     // clamped to 1 internally → fully matte concrete
  metalness: 0.125,
});
```
- If there's a `map`: `map.encoding = THREE.sRGBEncoding; map.flipY = false;`.
- After traversal, **recenter** the model: `const box = new THREE.Box3().setFromObject(model); const center = box.getCenter(new THREE.Vector3()); model.position.sub(center);` then `scene.add(model)`.
- Hide `.loading` (`display:none`) and call `startAnimations()`.

### Hand-rolled text split (run once at module load, before the model finishes)
`splitText()` over `document.querySelectorAll("nav a, nav p, h1, .footer p")`. For each element: uppercase its text, clear it, then rebuild character-by-character:
- Space → `<span class="space">` with inline styles `display:inline-block; width:15px; opacity:0`.
- Any other char → `<span class="char">CHAR</span>` with `display:inline-block; opacity:0`.
Every glyph therefore starts invisible; the reveal animates these `.char`/`.space` spans.

### The intro GSAP timeline (`startAnimations`, fired after GLTF load)
`const timeline = gsap.timeline({ onComplete: () => { animationComplete = true; } });` — the `onComplete` flag is what later enables mouse parallax.

1. **Counter tween (0 → 100).** First build a `checkpoints` array of ascending integers: start `[0]`, `numJumps = 7`; loop while `checkpoints.length < 7` computing `maxJump = Math.floor((100 - currentValue)/(numJumps - checkpoints.length + 1)) * 2`, `jump = 5 + Math.floor(Math.random()*(maxJump - 5))`, `currentValue += jump`, and push it only if `< 97`; finally `push(97); push(100);`. Then:
```js
timeline.to({}, {
  duration: 4, ease: "{{motion.ease.primary}}",
  onUpdate: function () {
    const p = this.progress();
    const idx = Math.floor(p * checkpoints.length);
    if (idx !== currentIndex && idx < checkpoints.length) { currentIndex = idx; counter.textContent = checkpoints[idx]; }
  },
  onComplete: function () { counter.textContent = "100"; },
});
```
So over 4s of linear time the number jumps through the random checkpoints and lands on 100.

2. **Fade the counter out:** `timeline.to(".counter", { opacity:0, duration:{{motion.duration.base}}, ease:"power2.out" }, "+=0.2");` (0.2s after the counter tween ends).

3. **Camera 180° sweep** (0.2s after the counter fades in the timeline sequence) via a proxy object so GSAP can ease the angle:
```js
const rotationProxy = { angle: currentAngle };      // ≈225°
timeline.to(rotationProxy, {
  angle: initialAngle,                               // → 45°
  duration: 2, ease: "power2.inOut",
  onUpdate: () => {
    currentAngle = rotationProxy.angle;
    camera.position.x = Math.cos(currentAngle)*radius;
    camera.position.z = Math.sin(currentAngle)*radius;
    camera.lookAt(0,0,0);
  },
}, "+=0.2");
```

4. **Overlay fade-out, concurrent with the sweep** (position `"<"` = start together): `timeline.to(overlay, { opacity:0, duration:1.5, ease:"power2.inOut", onComplete:()=>overlay.remove() }, "<");` — the black cover dissolves to reveal the corridor as the camera orbits.

5. **Text scramble-in** (added at `"-=1"`, i.e. overlapping the last second of the sweep) as a **nested timeline** returned from `timeline.add(fn, "-=1")`. Grab `const allChars = document.querySelectorAll(".char, .space")` and run three staggered opacity passes — all animate to `opacity:1`, `ease:"power2.inOut"`, with `from:"random"` staggers whose `yoyo/repeat` make characters flicker on/off before settling on:
```js
tl.to(allChars, { duration:0.1, opacity:1, ease:"power2.inOut", stagger:{ amount:1, each:0.1, from:"random", repeat:2, yoyo:true } });
tl.to(allChars, { duration:0.1, opacity:1, ease:"power2.inOut", stagger:{ amount:1, each:0.1, from:"random", repeat:1, yoyo:true } });
tl.to(allChars, { duration:0.15, opacity:1, ease:"power2.inOut", stagger:{ amount:1, each:0.2, from:"random" } });
```
The first two passes (with `yoyo:true` + `repeat`) make glyphs blink on and off in random order (a "boot-up / scramble" feel); the final pass with no yoyo latches them all fully visible.

### Post-processing chain
```js
const renderScene = new RenderPass(scene, camera);
const bloomPass   = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 2.0, 0.25, 0.5); // strength 2.0, radius 0.25, threshold 0.5
const composer    = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(filmGrainPass);   // renderToScreen = true
```
The strong bloom (strength 2.0) over the white background gives the corridor its hazy, overexposed sci-fi glow.

**Custom film-grain `ShaderPass`** (`filmGrainPass.renderToScreen = true`) — uniforms `{ tDiffuse:null, time:0, amount:0.15, speed:2.0, size:1.0 }`; passthrough vertex shader; fragment adds animated noise:
```glsl
float random(vec2 co){ return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  vec4 color = texture2D(tDiffuse, vUv);
  vec2 position = vUv * size;
  float grain = random(position * time * speed);
  color.rgb += grain * amount;          // additive grain
  gl_FragColor = color;
}
```

### Render loop + mouse parallax
```js
function lerp(a,b,t){ return a + (b-a)*t; }
function animate(){
  requestAnimationFrame(animate);
  filmGrainPass.uniforms.time.value = performance.now() * 0.001;   // grain always animates
  if (animationComplete) {                                         // parallax only after intro
    currentAngle = lerp(currentAngle, targetAngle, 0.025);
    currentY     = lerp(currentY, targetY, 0.025);
    camera.position.x = Math.cos(currentAngle)*radius;
    camera.position.z = Math.sin(currentAngle)*radius;
    camera.position.y = lerp(camera.position.y, currentY, 0.05);
  }
  camera.lookAt(0,0,0);
  composer.render();
}
animate();
```
Mouse handler (guarded by `if (!animationComplete) return;`): `mouseX = (clientX - innerWidth/2)/(innerWidth/2)`, `mouseY = (clientY - innerHeight/2)/(innerHeight/2)`, then `targetAngle = initialAngle + (-mouseX * 0.35)` (≈ ±0.35 rad horizontal sway) and `targetY = -mouseY * 1.5` (vertical rise/fall). The lerp factors (0.025 / 0.05) give the parallax a heavy, floaty follow.

### Resize
On `window.resize`: `camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);`.

## Assets / images
No photographic images. The only asset is a **single GLTF model of a brutalist concrete corridor / interior** (`scene.gltf` + `scene.bin` + a `textures/` folder), one mesh, one PBR material named "Concrete Tiles" with four maps: **baseColor** (grey cast-concrete tiles), **metallicRoughness**, **normal**, and an **emissive** map. Point the loader at `/c/brutalist-corridor/scene.gltf`. Any comparable interior/corridor GLTF with concrete tile textures works; the material is rebuilt to matte (`roughness 5.0`, `metalness 0.125`) so surface detail comes from the normal/baseColor maps, not gloss. The scene is auto-centered at the origin, so the exact model bounds don't matter.

## Behavior notes
- **Autoplay once on load.** Sequence: "Loading Scene" until the GLTF resolves → counter 0→100 (~4s) → counter fade → 2s camera sweep with concurrent overlay dissolve → text scramble-in (overlapping the last 1s) → `animationComplete = true`. Full intro is roughly 8–9s.
- **Mouse parallax is enabled only after the intro** completes; before that, `mousemove` is ignored.
- **Desktop-oriented, WebGL-heavy** (GLTF + UnrealBloom + custom shader pass): not mobile-safe; the parallax is pointer-driven. No touch fallback in the original.
- **No scroll, no scroll hijack, no ScrollTrigger** — the page is a single fixed viewport.
- No reduced-motion branch in the original; grain + parallax run continuously via `requestAnimationFrame`.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/brutalist-corridor/scene.gltf
https://motionprompts.dev/c/brutalist-corridor/scene.bin
https://motionprompts.dev/c/brutalist-corridor/textures/Concrete_Tiles_baseColor.jpeg
https://motionprompts.dev/c/brutalist-corridor/textures/Concrete_Tiles_emissive.png
https://motionprompts.dev/c/brutalist-corridor/textures/Concrete_Tiles_metallicRoughness.png
https://motionprompts.dev/c/brutalist-corridor/textures/Concrete_Tiles_normal.png
```

**`scene.gltf` is the only one you load by hand** — it is the corridor itself, and the single URL
this component cannot work without. The other five it pulls in on its own: a `.gltf` is a JSON
manifest with *relative* paths to its geometry buffer (`scene.bin`) and its four textures, and
`GLTFLoader` resolves them against wherever the `.gltf` came from. So keep the whole set in one
directory with these exact names and this exact `textures/` subfolder, or rewrite the `buffers`
and `images` URIs inside the `.gltf` to match wherever you put them. Fetching the four textures
individually while pointing the loader somewhere else gets you an untextured corridor and four
unused downloads.

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--concrete`, `--shadow`, `--sodium`, `--mono`, `--display`, `--edge`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

This is not a script animating markup that was already there — `mount(config)` stands up an entire WebGL stack (`Scene`, `PerspectiveCamera`, `WebGLRenderer`, an `EffectComposer` chaining three passes) plus a nine-second GSAP intro, and it already returns a `destroy()` that tears all of it back down. That symmetry is exactly what a `useEffect` wants. What it doesn't have yet is React's calling convention: the boot is a bare module-scope branch keyed to `window.MP`, the lookups are unscoped `document.querySelector` calls, and a StrictMode mount → unmount → mount will double every resource this component allocates — two `WebGLRenderer`s appending canvases into the same `.corridor`, two `requestAnimationFrame` loops racing to write `filmGrainPass.uniforms.time` and `currentAngle`, two in-flight `GLTFLoader.load` calls each populating a different `Scene`, and two GSAP timelines fighting over the same `.counter p` node. None of that throws. It just leaves the corridor doubled and the counter stuttering between two sequences, which reads as "the demo is glitchy" long before anyone traces it back to a missing cleanup.

*(1) The entry point.* The bottom of the module checks `document.readyState` before subscribing to `DOMContentLoaded` — the `boot()` fallback used when `window.MP` is absent. That guard exists so the script survives being dropped in as a late `<script type="module">` tag; `useEffect` already runs after commit, so the guard, the listener, and the `window.MP.register` branch all go away. Call the body of `mount(config)` directly inside a `useEffect` with an empty dependency array, and return the `destroy()` it produces as the cleanup — the shape barely has to change, it just stops reaching for `window.MP`.

*(2) Element lookups.* `document.querySelector(".corridor")`, `.overlay`, `.counter`, `.counter p`, `.loading`, and `document.querySelectorAll("nav a, nav p, h1, .footer p")` all assume one copy of the document. Give the component a root `ref` spanning the `.corridor`/`.loading`/`.overlay`/`.hero` stack and rewrite every one of those as a scoped lookup from that ref. Keep the existing `if (!corridor) return () => {};` guard as-is — it already has the shape a scoped lookup needs. The two pointer listeners are the exception: `onMouseMove`/`onTouchMove` are deliberately attached to `document`, because the parallax is meant to track the pointer anywhere in the viewport, not just over the canvas — don't rescope those to the root ref, just make sure each `mount()` call's closures remove the exact listener that same call added.

*(3) Cleanup.* The existing `destroy()` already does more than most vanilla teardowns: it flips `destroyed`, cancels `frame`, removes both pointer listeners and the resize listener, kills the parent timeline and the nested `textTimeline`, and then — before touching any styles — puts the DOM back exactly where `mount()` found it. `overlay.remove()` runs mid-timeline, inside the overlay-fade's own completion callback, so `destroy()` has to reinsert that exact node at its recorded `parent`/`nextSibling` first. `splitText()` has overwritten the `innerHTML` of every `nav a, nav p, h1, .footer p` with per-character spans, so `destroy()` restores each element's original markup from `splitOriginals` before anything else runs `splitText()` again — skip that step and the next mount splits already-split spans, one level deeper, and the char-reveal animates the wrong nodes. Wrap the GSAP work in a `gsap.context` scoped to the root ref and revert it in cleanup as usual, but keep the ordering this component already enforces (DOM nodes restored, then `clearProps`, then GPU disposal) — reordering it is the kind of thing that looks fine on the first mount and only breaks on the StrictMode remount, once the second `mount()` calls `splitText()` over spans the first `destroy()` never got a chance to undo.

### rAF loop

`animate()` stores the pending id in `frame` and re-schedules itself before doing any per-frame work, and it also returns immediately when `destroyed` is set. Both matter: `cancelAnimationFrame(frame)` only cancels a frame that is still *scheduled* — if something is holding the callback after the native frame already fired (this component's own comment calls out the editor's scrub-pause doing exactly that), the stored id is stale by the time cleanup runs, and the in-flight callback's own `if (destroyed) return;` is the thing that actually stops it. Port both checks, not just the `cancelAnimationFrame` call: cancel the stored handle in cleanup, and keep a live guard read at the top of the frame callback itself.

### GSAP

Wrap `startAnimations()` — the counter tween, the `rotationProxy` camera sweep, and the nested `textTimeline` — in a `gsap.context(() => { ... }, rootRef)` and revert it in cleanup. The nested timeline needs a second thought: `textTimeline` is built and returned from inside `timeline.add(fn, "-=1")`, but GSAP does not parent it to `timeline` just because the function that created it was one of the parent's own callbacks — it is an independent instance the module keeps its own reference to specifically so `destroy()` can kill it. Register that same reference inside the context (or kill it explicitly alongside `ctx.revert()`) rather than assuming the parent's own kill cascades into a child it never adopted. This component has no `gsap.ticker` subscription — the loop that drives motion is the raw `requestAnimationFrame` above, not the ticker — so the ticker-specific cleanup rule doesn't apply here.

### Async load resolving after unmount

`loader.load("/c/brutalist-corridor/scene.gltf", callback)` isn't a promise, but it has the same hazard: on a fast StrictMode remount, the request for `scene.gltf` can still be in flight when the first `destroy()` runs, and a callback firing after that would `scene.add(model)` into a `Scene` nobody renders anymore and flip `loading.style.display` on a node the cleanup already finished restoring. The script already opens the callback with `if (destroyed) return;` — that line is not incidental defensive style, it is the entire fix, and it has to survive the port into the effect exactly where it sits, before the callback touches `model`, the scene graph, or `loading`.

### Three.js → React Three Fiber

- **Scene ownership.** `<Canvas>` takes over the `Scene`/`PerspectiveCamera`/`WebGLRenderer` triple. Carry the renderer flags this component actually sets — `powerPreference: "high-performance"`, `antialias: false`, `stencil: false`, `depth: false`, the sRGB output color space, ACES filmic tone mapping and its exposure value — into `<Canvas gl={{ ... }}>`, and the field of view and near/far planes into the camera props. Delete the manual `renderer.setSize`/`setPixelRatio` calls and the `resize` listener; `<Canvas>` observes its own container.
- **Post-processing owns the render loop, not `<Canvas>`'s default one.** This component never lets the renderer draw on its own — `composer.render()` replaces that, called by hand from inside `animate()`. In R3F that means either `@react-three/postprocessing`'s composer (wrapping the film-grain shader as a custom effect) or, keeping three's own `EffectComposer`, a `useFrame` callback given render priority so R3F hands you the frame instead of drawing it itself. Either way, `filmGrainPass.uniforms.time.value = performance.now() * 0.001` should read its time from that same `useFrame` callback's own clock argument — don't run a second, independent `performance.now()` clock alongside it.
- **Model loading.** `GLTFLoader.load(...)` becomes `useGLTF("/c/brutalist-corridor/scene.gltf")` under a `<Suspense>` boundary, and the `destroyed` guard in the callback stops being necessary — Suspense's own unmount handling replaces it. What has to survive the port is the material grading: the callback mutates `child.material.emissive`, `emissiveIntensity`, `roughness`, and `metalness` directly on the materials the loader handed back. `useGLTF` caches the parsed GLTF by URL, so grading those materials in place grades every future consumer of that same cached asset, not just this instance — clone the material before mutating it, or a second mount of this component (or an unrelated component loading the same file) inherits lamps that are already graded, or graded twice. The `Box3` / `getCenter` recentring has no such sharing hazard and can run once, unchanged, whenever the geometry is available.
- **Poster mandatory.** `.loading` is a small centered label, not a full-viewport cover, and the scene background is already near-black (`0x0a0a0b`), so a bare `<Canvas>` frame before `scene.gltf` resolves is easy to mistake for the intentional dark cover — it is still an undesigned empty frame, not the corridor. Render a poster in the same position as `.corridor` and swap it for the live `<Canvas>` once the model has loaded and been graded, independent of whatever `.loading` or the counter overlay are doing at that moment.
- **No `Environment` preset.** This scene already lights the corridor from five explicit sources — ambient fill, two directional lights, and the two point lights that account for the lamp glow — and uses no HDRI at all. Keep it that way: don't reach for drei's `Environment` with a `preset` to add reflections to the concrete later. Light it the same way this component already does, with explicit lights, or point `Environment` at a self-hosted HDRI if you add one.
