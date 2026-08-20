# Second Skin — Scroll-Scrubbed WebGL Dissolve Hero

## Goal
Build a very tall hero (`175svh`) where scrolling makes a solid near-black fill **sweep upward over a full-bleed portrait**, dissolving the image away behind an **organic, ragged, fbm-noise edge**. The fill is a Three.js fullscreen quad running a custom GLSL shader whose `uProgress` uniform is driven by Lenis scroll position — so it is fully scroll-scrubbed, not time-based. Once the fill has covered the lower part of the hero, a long paragraph sitting over it **fades in one word at a time**, each word's opacity tied directly to a ScrollTrigger's progress. Below, a dark closing section. The star effect is the noisy WebGL dissolve reveal.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`three`** — WebGL scene/renderer/shader material.
- **`gsap`** (3.x) plus the plugins **`ScrollTrigger`** and **`SplitText`**.
- **`lenis`** — smooth scroll; it also owns the scroll value that drives the shader.

```js
import { vertexShader, fragmentShader } from "./shaders.js";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);
```

Keep the two GLSL shader strings in a separate `shaders.js` module that exports `vertexShader` and `fragmentShader`.

### Lenis ↔ GSAP wiring
```js
const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  ScrollTrigger.update();
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on("scroll", ScrollTrigger.update);
```

## Layout / HTML
Two sections. The hero stacks four absolutely-positioned layers (image, header text, WebGL canvas, content paragraph); the WebGL canvas sits **above** the image and header in paint order so the dissolve covers them.

```html
<section class="hero">
  <div class="hero-img">
    <img src="/path/to/wall.jpg" alt="A weathered lime-plaster wall cracking to reveal the earthen substrate beneath" />
  </div>

  <div class="hero-header">
    <span class="eyebrow">Calx · Earthen Plaster Studio</span>
    <h1>Second Skin</h1>
    <p>Hand-troweled lime and clay finishes for old walls.</p>
  </div>

  <canvas class="hero-canvas"></canvas>

  <div class="hero-content">
    <span class="hero-content-mark" aria-hidden="true">&#10033;</span>   <!-- ✱, a purely decorative glyph -->
    <h2>
      We rebuild lime-plastered walls by hand: mortar mixed on site,
      textures matched to the original, surfaces left to breathe.
    </h2>
  </div>
</section>

<section class="about">
  <div class="about-inner">
    <span class="eyebrow eyebrow--light">The studio</span>
    <p>
      Calx is a small crew working on old masonry across the valley. We build
      our coats from slaked lime, local sand, and earth pigment. No cement, no
      plastic paint. Each wall is floated, troweled, and burnished by hand,
      then left to carbonate and harden over the seasons.
    </p>
    <p class="about-meta">Restoration &amp; new finishes · Booking two seasons out</p>
  </div>
</section>

<script type="module" src="./script.js"></script>
```

Load-bearing selectors used by JS: `.hero`, `.hero-canvas`, `.hero-content h2`. The copy is neutral demo text for a fictional plaster studio ("Calx"): title **"Second Skin"**, subtitle **"Hand-troweled lime and clay finishes for old walls."** Swap it for your own; no real brands. `.hero-content-mark` is a decorative asterisk (`&#10033;`) sitting above the paragraph, `aria-hidden` and untouched by the animation.

## Styling
Reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `img { width:100%; height:100%; object-fit:cover; }`.

Fonts: **Space Grotesk** (headings), **Inter** (body), **Space Mono** (the eyebrow and the small asterisk mark).
- `h1, h2`: `font-family:"Space Grotesk"`, `font-weight:700`.
- `h1`: `text-transform:uppercase`, `line-height:0.9`, `letter-spacing:-0.02em`, `font-size: clamp(3.75rem, 12vw, 11rem);`
- `h2`: `font-weight:600`, `line-height:1.06`, `font-size: clamp(2rem, 4.2vw, 4.25rem);`
- `p`: `font-family:"Inter"`, `font-size:1.0625rem`, `font-weight:400`, `line-height:1.6`.
- `.eyebrow`: `font-family:"Space Mono"`, `font-size:0.6875rem`, uppercase.

Color tokens (exact hex — the dissolve fill color must match `--base-100`):
```css
--bg: #141414;          /* near-black ground — the dissolve fill + dark sections */
--ivory: #efece3;       /* ivory ink — display + body text */
--ember: #f04e23;       /* ember orange — accent and microlabels on dark */
--ember-deep: #7a1f00;  /* the sunk end of the ember gradient */

/* legacy aliases, kept so the JS CONFIG keeps matching the CSS */
--base-100: var(--bg);
--base-200: var(--ivory);
--base-300: var(--ember);
```

Layout / positioning (all the pieces that make the layering work):
- `.hero`: `position:relative; width:100%; height:175svh; color:var(--ivory); overflow:hidden;`
- `.hero-img`: `position:absolute; width:100%; height:100%;` — the portrait fills the entire 175svh hero.
- `.hero-header`: `position:absolute; width:100%; height:100svh; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:0.5rem; text-align:center;` — title + subtitle centered in the **first viewport**. `.hero-header p { width:75%; }`.
- `.hero-canvas`: `position:absolute; bottom:0; width:100%; height:100%; pointer-events:none;` — transparent WebGL layer over image + header.
- `.hero-content`: `position:absolute; bottom:0; width:100%; height:125svh; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:1rem; text-align:center;` — pinned to the **bottom 125svh** of the hero. `.hero-content h2 { max-width:18ch; color:var(--ivory); }` (ivory text that lands on the near-black fill once it has swept up). A `.hero-content::before` radial gradient sits behind it to keep the paragraph readable during the crossover, and `.hero-content-mark` is the small Space Mono asterisk above it (`color:var(--ivory); opacity:.55`).
- `.about`: `position:relative; width:100%; height:100svh; display:flex; justify-content:center; align-items:center; background-color:var(--bg); color:var(--ivory);` with an `.about-inner` column holding the eyebrow, the paragraph and `.about-meta`.
- `@media (max-width:1000px)`: `.hero-content h2, .about p { width: calc(100% - 4rem); }`.

## The effect (be exhaustive — WebGL dissolve + word-by-word fade)

There are three coupled systems: **(A)** the Three.js fullscreen-quad setup, **(B)** the fbm-dissolve fragment shader whose `uProgress` is the whole show, and **(C)** the Lenis-scroll → progress mapping. A separate ScrollTrigger drives **(D)** the SplitText word fade.

### CONFIG (exact values)
```js
const CONFIG = {
  color: "#141414", // dissolve fill color (matches --bg / --base-100)
  spread: 0.5,      // how far noise perturbs the dissolve edge
  speed: 2,         // scroll→progress multiplier (dissolve completes in first half of scroll)
};
```

### (A) Three.js scene — a single clip-space quad
- `scene = new THREE.Scene()`.
- `camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)` — maps directly to clip space.
- `renderer = new THREE.WebGLRenderer({ canvas: document.querySelector(".hero-canvas"), alpha: true, antialias: false })` — **`alpha:true`** so transparent shader pixels reveal the portrait beneath.
- `geometry = new THREE.PlaneGeometry(2, 2)` — a 2×2 plane that exactly fills the ortho camera's `-1..1` range → a fullscreen quad.
- `material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, transparent: true, uniforms: {...} })`.
- `resize()`: `renderer.setSize(hero.offsetWidth, hero.offsetHeight)` and `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`. Call once and on `window` `resize`.

Uniforms:
```js
uniforms: {
  uProgress:   { value: 0 },
  uResolution: { value: new THREE.Vector2(hero.offsetWidth, hero.offsetHeight) },
  uColor:      { value: new THREE.Vector3(r, g, b) }, // CONFIG.color parsed to 0..1 rgb
  uSpread:     { value: CONFIG.spread }, // 0.5
}
```
Parse `CONFIG.color` hex → normalized rgb (each channel `/255`) for `uColor`. On `window` `resize` also update `uResolution` to the new `hero.offsetWidth/offsetHeight`.

Render loop (runs continuously):
```js
let scrollProgress = 0;
function animate() {
  material.uniforms.uProgress.value = scrollProgress;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
```

### (B) Fragment shader — fbm-noise dissolve (reproduce exactly)
Vertex shader just passes `vUv = uv` and `gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0)`.

Fragment shader — the ragged upward-sweeping dissolve. The dissolve edge is a horizontal line at `uv.y = uProgress*1.2`, perturbed by value-noise fbm so it reads as an organic torn edge; below the edge alpha=1 (the fill), above alpha=0 (transparent → the photograph shows). A ~1px `smoothstep` keeps the edge crisp.

```glsl
uniform float uProgress;
uniform vec2  uResolution;
uniform vec3  uColor;
uniform float uSpread;
varying vec2  vUv;

float Hash(vec2 p) {
  vec3 p2 = vec3(p.xy, 1.0);
  return fract(sin(dot(p2, vec3(37.1, 61.7, 12.4))) * 3758.5453123);
}

float noise(in vec2 p) {          // smoothed value noise
  vec2 i = floor(p);
  vec2 f = fract(p);
  f *= f * (3.0 - 2.0 * f);       // smoothstep interpolation
  return mix(
    mix(Hash(i + vec2(0.0, 0.0)), Hash(i + vec2(1.0, 0.0)), f.x),
    mix(Hash(i + vec2(0.0, 1.0)), Hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {               // 3 octaves, 0.5 / 0.25 / 0.125
  float v = 0.0;
  v += noise(p * 1.0) * 0.5;
  v += noise(p * 2.0) * 0.25;
  v += noise(p * 4.0) * 0.125;
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 centeredUv = (uv - 0.5) * vec2(aspect, 1.0); // aspect-correct so noise cells stay square

  float dissolveEdge = uv.y - uProgress * 1.2;      // edge rises as progress grows
  float noiseValue   = fbm(centeredUv * 15.0);      // noise frequency ×15 → fine ragged detail
  float d            = dissolveEdge + noiseValue * uSpread;

  float pixelSize = 1.0 / uResolution.y;
  float alpha = 1.0 - smoothstep(-pixelSize, pixelSize, d); // d<0 → filled, d>0 → transparent

  gl_FragColor = vec4(uColor, alpha);
}
```

Feel: at `uProgress=0` the fill sits just below the bottom edge; as progress climbs, the near-black sweeps up the full 175svh with a jagged, noisy, ever-shifting frontier, blotting out the photograph.

### (C) Scroll → progress mapping (Lenis, not ScrollTrigger)
`scrollProgress` is computed on every Lenis scroll event, **clamped to 1.1** and multiplied by `CONFIG.speed`, so the dissolve reaches full coverage within roughly the first half of the hero's scrollable range:
```js
lenis.on("scroll", ({ scroll }) => {
  const heroHeight   = hero.offsetHeight;
  const windowHeight = window.innerHeight;
  const maxScroll    = heroHeight - windowHeight;
  scrollProgress = Math.min((scroll / maxScroll) * CONFIG.speed, 1.1);
});
```

### (D) SplitText word-by-word fade (ScrollTrigger, scrubbed manually)
The hero-content paragraph is split into words; each word's opacity is a direct function of a ScrollTrigger's `progress`, so words illuminate sequentially left-to-right as that section scrolls through.

```js
const heroH2 = document.querySelector(".hero-content h2");
const split  = new SplitText(heroH2, { type: "words" });
const words  = split.words;

gsap.set(words, { opacity: 0 });

ScrollTrigger.create({
  trigger: ".hero-content",
  start: "top 25%",
  end: "bottom 100%",
  onUpdate: (self) => {
    const progress = self.progress;
    const total = words.length;
    words.forEach((word, index) => {
      const wordProgress     = index / total;
      const nextWordProgress = (index + 1) / total;
      let opacity = 0;
      if (progress >= nextWordProgress) {
        opacity = 1;
      } else if (progress >= wordProgress) {
        opacity = (progress - wordProgress) / (nextWordProgress - wordProgress);
      }
      gsap.to(word, { opacity, duration: 0.1, overwrite: true });
    });
  },
});
```
Each word owns an equal `1/total` slice of the trigger's 0→1 progress: fully lit once progress passes its slice, linearly fading in while inside its slice, hidden before it. The tiny `duration:0.1` + `overwrite:true` keeps it responsive to scrub while smoothing per-frame jumps. No `scrub` property is set — this ScrollTrigger reveals purely via `onUpdate`.

## Assets / images
- **1 full-bleed photograph**, `object-fit: cover`, filling a very tall (`175svh`) hero — so the source (roughly 3:4 portrait) is cropped to a narrow vertical slice. The real asset is a macro of a weathered lime-plaster wall, cracking open to show the earthen substrate beneath: raking light, coarse texture, no subject and no horizon. Texture is the point — the dissolve eats the frame from the bottom up with a ragged noise edge, and a busy surface makes that edge read as erosion rather than as a wipe.
- Like the hero of the demo, the image is **graded in CSS, not in the file**: `.hero-img::after` lays `linear-gradient(180deg, #f04e23 0%, #d8431c 55%, #7a1f00 130%)` over it in `mix-blend-mode: multiply`, which is what ties an ordinary photograph to the ember palette. Any high-contrast, high-texture photograph works; no brands or logos.

## Behavior notes
- **Trigger:** scroll only. The dissolve is fully scrubbed by Lenis scroll position (no timeline, no autoplay); parking the scroll freezes the dissolve mid-sweep. The word fade is likewise scrubbed via ScrollTrigger `onUpdate`.
- **Fresh load (scroll=0):** the photograph fully visible with the ivory title + subtitle centered; the near-black fill just off the bottom; the hero-content paragraph is invisible (all words `opacity:0`).
- **Layering:** the transparent WebGL canvas paints over the image and header; the ivory `h2` sits in the bottom 125svh so it lands on the near-black fill. `pointer-events:none` on the canvas keeps it non-interactive.
- **Pixel ratio** capped at 2 for perf; renderer resizes with the hero. `antialias:false` (the smoothstep edge handles anti-aliasing).
- No reduced-motion guard in the original.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/ironhill-scroll-animation/hero-img.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ivory`, `--ember`, `--ember-deep`, plus the aliases `--base-100`, `--base-200`, `--base-300`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone module: it runs the instant `script.js` is parsed, reaches into the page with five separate `document.querySelector` calls, and owns two independent `requestAnimationFrame` loops, a `Lenis` smooth-scroll instance, a `WebGLRenderer`, a `ScrollTrigger`, and a `SplitText` split — all created once, for the life of the tab, with nothing that ever expects to be undone. React withdraws that guarantee, and the failure is quiet: the dissolve keeps sweeping and the words keep illuminating for a moment, while underneath it a second renderer, a second `Lenis` instance and a second pair of rAF loops are now all running against the same canvas and the same scroll events.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. This component is exposed on every axis at once: two rAF loops that never check whether they're still wanted, a `WebGLRenderer` holding a live WebGL context, and a `ScrollTrigger` plus a `SplitText` that both write into the DOM. Run the setup twice without a matching teardown and the visible symptom is a dissolve edge that sweeps twice as fast — two `animate()` loops both writing the same shader's `uProgress` from two different `scrollProgress` closures — or word-by-word opacity flickering between two disagreeing `ScrollTrigger`s. It will not reproduce in a production build, because React only double-invokes effects in development.

*(1) The entry point* — the whole file runs at the top level: no `DOMContentLoaded` listener, no `readyState` check. `new Lenis()`, both `requestAnimationFrame` starts (`raf` for scroll sync, `animate` for the render loop), the `WebGLRenderer` construction, the initial `resize()` call, the `ScrollTrigger.create` call and the `SplitText` split all execute the instant the module is evaluated — before a React component has rendered `.hero`, `.hero-canvas` or `.hero-content` for any of it to attach to. Move the entire body into a `useEffect` with an empty dependency array. The `CONFIG` object is harmless at module scope since it's inert data, but `lenis`, `renderer`, `scene`, `camera`, `material` and `scrollProgress` are not — leaving them outside the effect means a second mount reuses the first mount's live WebGL context and Lenis instance instead of creating its own, and leaving them in the component body reconstructs all of it on every render.

*(2) Element lookups* — `document.querySelector(".hero-canvas")`, `document.querySelector(".hero")` and `document.querySelector(".hero-content h2")` all assume a single document-wide instance. Give the component a root `ref` on the `.hero` section, resolve the canvas and the heading through it (`rootRef.current.querySelector(".hero-canvas")`, `rootRef.current.querySelector(".hero-content h2")`), and keep the resolved `.hero` node itself — not a re-query — wherever the code below reads `hero.offsetWidth`/`offsetHeight`. During the StrictMode remount two `.hero` sections exist for an instant; an unscoped lookup can hand the canvas or the renderer to the copy that's already on its way out.

*(3) Cleanup* — five kinds of resource need undoing, in an order that matters: stop both rAF loops before anything else, so nothing calls back into an object the rest of the cleanup is about to dispose or revert.

### GSAP / ScrollTrigger — the tween the context can't see

Wrap the `SplitText` construction and the `ScrollTrigger.create` call in one `gsap.context` scoped to the root ref. That covers the trigger itself, but `onUpdate` doesn't just read `self.progress` — it calls `gsap.to(word, …)` for every word, on every scroll tick, from inside a callback GSAP invokes long after the factory that created the trigger has already returned. A plain `ctx.revert()` only reaches animations created while that factory was synchronously running, so a batch of word-tweens issued mid-scroll and still catching up when the unmount lands is invisible to it. Bracket that per-tick work in the one-argument form of `self.add`, which attaches whatever it creates to the context **at the moment it runs**, however long after setup that turns out to be:

```jsx
useEffect(() => {
  const root = rootRef.current;
  let split;

  const ctx = gsap.context((self) => {
    split = new SplitText(root.querySelector(".hero-content h2"), { type: "words" });
    gsap.set(split.words, { opacity: 0 });

    ScrollTrigger.create({
      trigger: root.querySelector(".hero-content"),
      start: "top 25%",
      end: "bottom 100%",
      onUpdate: (st) => {
        self.add(() => {
          const total = split.words.length;
          split.words.forEach((word, index) => {
            const from = index / total;
            const to = (index + 1) / total;
            let opacity = 0;
            if (st.progress >= to) opacity = 1;
            else if (st.progress >= from) opacity = (st.progress - from) / (to - from);
            gsap.to(word, { opacity, overwrite: true });
          });
        });
      },
    });
  }, rootRef);

  return () => {
    ctx.revert();
    split.revert();
  };
}, []);
```

`self`, never `ctx`, is what the `onUpdate` closure reaches for — `ScrollTrigger.create` is called synchronously inside the factory, and `self` carries no risk if a refresh ever makes `onUpdate` fire before the factory returns. `gsap.registerPlugin(ScrollTrigger, SplitText)` stays at module scope, above the effect, exactly as in the source.

### Lenis — one instance, two loops feeding it

The module owns Lenis outright, so create it inside the same effect and call `lenis.destroy()` in the cleanup — that also unbinds the two `lenis.on("scroll", …)` subscriptions (the one forwarding to `ScrollTrigger.update`, the one recomputing `scrollProgress`), so neither needs its own `lenis.off()`. If this hero ever ships as one section inside a larger app rather than as its own page, lift this `Lenis` instance to the app shell instead — a second instance fighting the first over the same wheel events is silent in the console and only shows up as scroll that stutters or skips.

### Two independent rAF loops, both need a handle

`raf` and `animate` are separate self-scheduling loops with different jobs — `raf` ticks `lenis.raf` and `ScrollTrigger.update`; `animate` writes the shader's progress uniform and calls `renderer.render`. Neither shares the other's handle, so both need their own:

```jsx
let rafId, animateId;
function raf(time) { lenis.raf(time); ScrollTrigger.update(); rafId = requestAnimationFrame(raf); }
function animate() { material.uniforms.uProgress.value = scrollProgress; renderer.render(scene, camera); animateId = requestAnimationFrame(animate); }
```

and in the cleanup, `cancelAnimationFrame(rafId)` and `cancelAnimationFrame(animateId)`, both before the disposal step below. Leave either running and the StrictMode remount doubles either the scroll-sync work or the render work — the render loop is the more visible failure, since two `animate()` calls writing the same uniform from two different `scrollProgress` closures makes the dissolve edge visibly jitter instead of sweeping cleanly.

### SplitText — split inside the context, revert after it

Revert `ctx` before reverting `split`, not the other way around: `ctx.revert()` kills whatever word-tween is still running and restores each word's inline `opacity`, and only once those tweens are dead is it safe for `split.revert()` to unwrap the per-word `<div>`s back into the original text node. Reverting the split first pulls the DOM out from under a tween that's still targeting it — the tween itself won't throw, but it means a live GSAP animation was left holding a reference to a node no longer in the tree.

### The renderer, the geometry and the material hold GPU resources the effect must give back

`renderer.dispose()`, `geometry.dispose()` and `material.dispose()` all belong in the cleanup, after the two `cancelAnimationFrame` calls. Browsers enforce a hard, per-page cap on how many WebGL contexts can be alive simultaneously; skip `renderer.dispose()` here and every remount — StrictMode's, or a real navigate-away-and-back to this route — leaves one more context alive until `getContext("webgl")` eventually starts returning `null`, for this hero and for everything else on the page.

Also give the second, inline `window.addEventListener("resize", () => { material.uniforms.uResolution.value.set(...) })` a name before removing it — as written it's anonymous, so nothing can unsubscribe it the way `window.removeEventListener("resize", resize)` already can for the first listener.

### Mapping this scene to React Three Fiber

**If your host app is React**, this scene is small enough that R3F absorbs nearly all of the imperative setup above, not just the renderer boilerplate:

- `<Canvas orthographic camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1, position: [0, 0, 1] }} gl={{ alpha: true, antialias: false }}>` replaces the `new THREE.Scene()` / `new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)` / `new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false })` block entirely, including the `<canvas>` element itself, which `<Canvas>` renders for you.
- The fullscreen quad becomes JSX: a `<mesh>` holding `<planeGeometry args={[2, 2]} />` and a `<shaderMaterial ref={materialRef} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent uniforms={...} />`, replacing the manual `PlaneGeometry` / `ShaderMaterial` / `Mesh` construction and the `scene.add(mesh)` call.
- `animate()` becomes `useFrame(() => { materialRef.current.uniforms.uProgress.value = scrollProgressRef.current; })`, registered inside the `<Canvas>` tree — `<Canvas>` already renders every frame on its own, so this deletes one of the two rAF loops outright rather than relocating it. Keep `scrollProgress` in a `ref`, not `useState`: it changes on every scroll event, and a `ref` lets `useFrame` read the latest value without forcing a re-render on every tick.
- The `raf` loop stays outside `<Canvas>`, in the parent effect — Lenis has to tick against real scroll input regardless of whether the canvas is mounted or visible, so it isn't something `useFrame` can absorb. Keep driving `ScrollTrigger.update` from it exactly as before.
- Resize handling for the renderer itself is automatic — `<Canvas>` observes its container and keeps the drawing buffer in sync, so the `resize()` function's `renderer.setSize` / `setPixelRatio` calls go away. The `uResolution` uniform does not go away with them: it's an application uniform this shader reads for aspect-correct noise, and `<Canvas>` has no way to know that. Update it yourself, from `useThree(({ size }) => size)` or inside the same `useFrame`, whenever the container's width or height changes.
- Disposal becomes automatic for anything declared as JSX — R3F disposes the geometry and the material (uniforms included) when the `<mesh>` unmounts, which is what replaces the manual `geometry.dispose()` / `material.dispose()` pair above.

**A static poster is effectively already built into this design, not something to bolt on.** The canvas here is `alpha: true` over a `transparent` `ShaderMaterial`, and near the shader's starting `uProgress` the whole quad renders fully transparent — the `.hero-img` `<img>` underneath is what's actually visible on first paint, independent of whether `<Canvas>` has finished creating its WebGL context yet. Keep that `<img>` rendered unconditionally, outside and behind `<Canvas>`, rather than gating it behind any "scene ready" state: if WebGL context creation fails outright, the portrait is still there and the hero degrades to a static image instead of an empty frame.

**Do not reach for drei's `Environment` with a `preset`** if this scene ever grows lit materials. Right now it's a single unlit `ShaderMaterial` with no lights and nothing sampling an environment map, so the prohibition has nothing to bite on yet — but it will the moment the fill gets upgraded to something PBR-shaded to pick up reflections from the portrait behind it. Presets are fetched from a third-party CDN hard-coded inside drei; light the scene explicitly or self-host an HDRI instead.
