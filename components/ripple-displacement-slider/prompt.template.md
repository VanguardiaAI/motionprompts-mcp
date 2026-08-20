---
slug: ripple-displacement-slider
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 13
structural_literals: 7
structural:
  - { kind: duration, literal: "3.0", rule: value/narrated }
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Ripple Displacement Slider (WebGL radial-wave crossfade on click)

## Goal
Build a full-screen slider that shows one large, boxed image at a time with an editorial title on
the left and a short description on the right. The image is not a DOM `<img>` — it is rendered onto
a **Three.js shader plane**. **Clicking anywhere on the slider fires a radial ripple**: a custom
GLSL wave expands from the center of the image outward, **displacing the UVs** along its front
(the pixels ripple like water) and **crossfading to the next slide's texture** right behind the
advancing wave, with a subtle brightness boost riding the crest. That ripple is a single
**GSAP tween of one shader uniform** (`uProgress`, 0 → maxCornerDistance over ~3s, `power2.out`).
Simultaneously, **SplitText** slides the current slide's title characters and description lines
**out** (`y: -100%`) and, once they clear, builds the next slide and slides its text **in**
(`y: 100%` → `0%`). The overlaid text uses `mix-blend-mode: difference`, so the white type inverts
against whatever image / background sits behind it. The star of this piece is the ripple-crossfade
shader + its GSAP-driven progress; the SplitText choreography is the supporting act.

## Tech
- Vanilla HTML / CSS / JS with ES module imports, bundled by Vite.
- **`gsap` (npm)** plus the GSAP plugin **`SplitText`** (registered via
  `gsap.registerPlugin(SplitText)`).
- **`three` (npm)**, imported `import * as THREE from "three";`.
- **No ScrollTrigger, no Lenis, no CustomEase.** Nothing scrolls; the only trigger is a click.
- Put the two shader source strings in a sibling module `shaders.js`
  (`export const vertexShader` / `export const fragmentShader`) and the slide data in `slides.js`
  (`export const slides`). Import both into `script.js`.
- **Top-level `await` is used** to preload all textures before building the scene, so `script.js`
  must be an ES module (Vite handles this).

## Data model (`slides.js`)
Export an array of **4** slide objects, each `{ title, description, image }`. Use these fictional
film-still entries (neutral demo copy, no real brands):
```js
export const slides = [
  { title: "Blackwater '91",
    description: "Flickering lanterns and twisted masks welcome unwanted visitors into a strange celebration beyond the forest trail.",
    image: "/path/slider-img-1.jpg" },
  { title: "Crimson Theory",
    description: "A mysterious performer slowly loses reality beneath violent lights and unsettling mirrored reflections inside an empty theater.",
    image: "/path/slider-img-2.jpg" },
  { title: "Tape Delay Archives",
    description: "Stacks of dusty videotapes and glowing static fill the room during another endless night without a single moment of sleep.",
    image: "/path/slider-img-3.jpg" },
  { title: "Exit 14 Westbound",
    description: "Heavy rain crashes against the windshield as terrified passengers race through midnight highways without knowing who follows.",
    image: "/path/slider-img-4.jpg" },
];
```

## Layout / HTML
Minimal DOM. The renderer's `<canvas>` is **prepended** into `.slider` by JS; only the *current*
slide's text overlay lives in the DOM at any moment (JS removes and rebuilds it per transition).
```html
<div class="slider">
  <div class="slide-content">
    <div class="slide-title"><h1>Blackwater '91</h1></div>
    <div class="slide-description">
      <p>Flickering lanterns and twisted masks welcome unwanted visitors into a strange celebration beyond the forest trail.</p>
    </div>
  </div>
</div>
<script type="module" src="./script.js"></script>
```
- The initial `.slide-content` (slide 0's title + description) is hardcoded in HTML; every
  subsequent slide's `.slide-content` is created in JS from the `slides` data.
- The WebGL `<canvas>` is `slider.prepend(renderer.domElement)`, so it sits **behind** the text
  overlay.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`

- **Font:** `body { font-family: "PP Neue Montreal", sans-serif; }` — a clean neutral grotesque
  sans (use any Neue-Montreal-style face or a system sans fallback). Everything is **weight 500**.
- **`h1`** — `font-size: clamp(2rem, 4vw, 6rem); font-weight: 500; letter-spacing: -2%;
  line-height: 1.25;`
- **`p`** — `font-weight: 500;`
- **`.slider`** — `position: fixed; width: 100%; height: 100svh; background: #e0ddcf; overflow: hidden;`
  A warm cream/bone backdrop that shows through wherever the shader renders transparent (i.e. the
  letterbox around the centered image box on desktop).
- **`.slider canvas`** — `display: block; width: 100%; height: 100%;`
- **`.slide-content`** — `position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  mix-blend-mode: difference; user-select: none; pointer-events: none; z-index: 2;`
  The `pointer-events: none` lets the click fall through to `.slider`; the
  `mix-blend-mode: difference` is what makes the white text invert against the image and the cream
  background — **non-optional to the look**.
- **`.slide-title`** — `position: absolute; top: 50%; left: 3rem; transform: translate(0%, -50%);
  width: max-content; color: #fff;` (title pinned to the left edge, vertically centered).
- **`.slide-description`** — `position: absolute; top: 50%; right: 3rem;
  transform: translate(0%, -50%); width: 15%; min-width: 250px; color: #fff; display: flex;
  flex-direction: column; gap: 2rem; z-index: 2;` (narrow column pinned to the right edge).
- **`.char, .line`** — `display: inline-block; will-change: transform; position: relative;`
  (SplitText-generated pieces; `inline-block` so `y%` transforms work, sitting inside their
  clipping masks).
- **Responsive `@media (max-width: 1000px)`** — `.slide-title` re-centers
  (`top:50%; left:50%; transform: translate(-50%,-50%)`); `.slide-description` becomes a centered
  bottom caption (`width:75%; text-align:center; top:unset; bottom:5%; left:50%;
  transform: translate(-50%,-50%)`).

## The star effect — Three.js ripple-crossfade shader + GSAP progress (be exact)

This is a near-verbatim port. Reproduce the constants, the uniforms, the two shaders, and the GSAP
tween exactly.

### Renderer, scene & camera
- `const scene = new THREE.Scene();`
- **Orthographic camera** framing a 1×1 world centered on origin:
  `const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.01, 10); camera.position.z = 1;`
- `const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });`
  `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));`
  `renderer.setClearColor(0x000000, 0);` (transparent clear → the cream `.slider` background shows
  through). Then `slider.prepend(renderer.domElement);`
- A single **full-frame plane**: `new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)` exactly
  fills the `[-0.5, 0.5]` frustum. `scene.add(plane)`.

### Texture preload (top-level await)
Load **all 4** slide images sequentially with `THREE.TextureLoader`, awaiting each, into a
`textures[]` array. For each: `minFilter = magFilter = THREE.LinearFilter;
wrapS = wrapT = THREE.ClampToEdgeWrapping;`
```js
const textureLoader = new THREE.TextureLoader();
const textures = [];
for (const slide of slides) {
  const texture = await new Promise((resolve) => textureLoader.load(slide.image, resolve));
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textures.push(texture);
}
```

### Config constants (use these exact values)
```js
const rippleConfig = {
  waveFreq: 25.0,        // sine frequency of the ripple oscillation
  wavePow: 0.035,        // UV displacement amplitude
  waveWidth: 0.5,        // width of the active wave band (also added to endValue)
  falloff: 10.0,         // exponential decay of the wave with age
  boostStrength: 0.5,    // brightness boost on the crest
  crossfadeWidth: 0.05,  // smoothstep width of the current→next blend behind the front
  duration: 3.0,         // GSAP tween seconds (1.5 on mobile)
  endValue: 1.0,         // recomputed on resize = maxCornerDist + waveWidth
  ease: "power2.out",
};
```

### Uniforms
```js
const uniforms = {
  uTexCurrent:     { value: textures[0] },
  uTexNext:        { value: textures[1] },
  uProgress:       { value: 0.0 },
  uResolution:     { value: new THREE.Vector2() },
  uImageRes:       { value: new THREE.Vector2(1920, 1280) },   // source image aspect, 3:2
  uWaveFreq:       { value: rippleConfig.waveFreq },
  uWavePow:        { value: rippleConfig.wavePow },
  uWaveWidth:      { value: rippleConfig.waveWidth },
  uFalloff:        { value: rippleConfig.falloff },
  uBoostStrength:  { value: rippleConfig.boostStrength },
  uCrossfadeWidth: { value: rippleConfig.crossfadeWidth },
  uMobile:         { value: window.innerWidth <= 1000 ? 1.0 : 0.0 },
};
const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true });
```

### Vertex shader (`shaders.js`)
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment shader (`shaders.js`) — reproduce verbatim
The wave lives in an **aspect-corrected** coordinate space (y scaled by
`aspect = uResolution.y / uResolution.x`) so the ripple stays circular on any viewport. It expands
from screen center; only the band where `-waveWidth < (dist - progress) < 0` (i.e. just *inside*
the front) ripples and boosts; `blend` (a smoothstep on how far behind the front you are) fades
current→next. A `boxMin`/`boxMax` letterbox — a **centered box on desktop** (`0.25..0.75` x,
`0.175..0.825` y) that expands to **full-bleed on mobile** (`0..1`) — cover-fits the image and
renders everything outside the box fully transparent.
```glsl
uniform sampler2D uTexCurrent;
uniform sampler2D uTexNext;
uniform float uProgress;
uniform vec2 uResolution;
uniform vec2 uImageRes;
uniform float uWaveFreq;
uniform float uWavePow;
uniform float uWaveWidth;
uniform float uFalloff;
uniform float uBoostStrength;
uniform float uCrossfadeWidth;
uniform float uMobile;

varying vec2 vUv;

vec2 getImageUv(vec2 uv, vec2 screenRes, vec2 imgRes, vec2 boxMin, vec2 boxMax) {
  vec2 boxUv = (uv - boxMin) / (boxMax - boxMin);
  vec2 boxSize = (boxMax - boxMin) * screenRes;
  float boxAspect = boxSize.x / boxSize.y;
  float imgAspect = imgRes.x / imgRes.y;
  vec2 scale = vec2(1.0);
  if (boxAspect > imgAspect) {
    scale.y = imgAspect / boxAspect;
  } else {
    scale.x = boxAspect / imgAspect;
  }
  return (boxUv - 0.5) * scale + 0.5;
}

bool isInsideBox(vec2 uv, vec2 boxMin, vec2 boxMax) {
  return uv.x >= boxMin.x && uv.x <= boxMax.x && uv.y >= boxMin.y && uv.y <= boxMax.y;
}

void main() {
  vec2 boxMin = mix(vec2(0.25, 0.175), vec2(0.0), uMobile);
  vec2 boxMax = mix(vec2(0.75, 0.825), vec2(1.0), uMobile);

  float aspectRatio = uResolution.y / uResolution.x;

  vec2 coord  = vec2(vUv.x, vUv.y * aspectRatio);
  vec2 center = vec2(0.5, 0.5 * aspectRatio);

  float dist = distance(coord, center);
  float time = uProgress;

  vec2  displaced  = coord;
  float brightness = 0.0;
  float blend      = 0.0;

  if (time > 0.001) {
    float trailing = dist - time;

    if (trailing < uWaveWidth && trailing < 0.0) {
      float age   = -trailing;
      float decay = exp(-age * uFalloff);
      float wave  = sin(age * uWaveFreq) * decay;

      vec2 direction = normalize(coord - center);
      displaced += direction * wave * uWavePow;

      brightness = abs(wave) * uBoostStrength * decay;
    }

    blend = smoothstep(0.0, uCrossfadeWidth, -trailing);
  }

  vec2 finalUv = vec2(displaced.x, displaced.y / aspectRatio);
  vec2 imageUv = getImageUv(finalUv, uResolution, uImageRes, boxMin, boxMax);

  vec4 currentColor = texture2D(uTexCurrent, imageUv);
  vec4 nextColor    = texture2D(uTexNext, imageUv);

  vec4 color = mix(currentColor, nextColor, blend);
  color.rgb += color.rgb * brightness;

  if (!isInsideBox(finalUv, boxMin, boxMax)) {
    color = vec4(0.0);
  }

  gl_FragColor = color;
}
```
Key behavior to preserve: at `uProgress = 0` nothing ripples and `blend = 0`, so the plane shows
`uTexCurrent` cover-fit inside the box, transparent outside. As `uProgress` grows, the front sweeps
outward; the thin band behind it ripples (sine × exp decay displacement) and brightens, and
everything the front has already passed shows `uTexNext`.

### Resize helper (recomputes the tween target)
```js
function getMaxCornerDist() {
  const ratio = window.innerHeight / window.innerWidth;
  const cx = 0.5, cy = 0.5 * ratio;
  return Math.sqrt(cx * cx + cy * cy);   // distance center→corner in aspect-corrected space
}
function handleResize() {
  const width = slider.clientWidth, height = slider.clientHeight;
  renderer.setSize(width, height);
  uniforms.uResolution.value.set(width, height);
  uniforms.uMobile.value = window.innerWidth <= 1000 ? 1.0 : 0.0;
  rippleConfig.endValue = getMaxCornerDist() + rippleConfig.waveWidth;  // front must clear the corners
  rippleConfig.duration = window.innerWidth <= 1000 ? 1.5 : 3.0;        // faster on mobile
}
window.addEventListener("resize", handleResize);
handleResize();  // run once at startup
```
`endValue` is the progress needed for the wave to reach the farthest corner **plus** `waveWidth`,
so the ripple + crossfade fully complete edge-to-edge.

### The GSAP ripple tween (fires on transition)
A single `gsap.to` on the `uProgress` uniform value:
```js
rippleTween = gsap.to(uniforms.uProgress, {
  value: rippleConfig.endValue,
  duration: rippleConfig.duration,   // 3.0 desktop / 1.5 mobile
  ease: rippleConfig.ease,           // "power2.out"
  delay: 0.3,
  onUpdate() {
    // unlock re-clicking early, once the wave has covered most of the frame
    if (!clickUnlocked && uniforms.uProgress.value > 0.7) {
      clickUnlocked = true;
      currentIndex = nextIndex;
      isTransitioning = false;
    }
  },
  onComplete() {
    uniforms.uTexCurrent.value = textures[currentIndex]; // promote next → current
    uniforms.uProgress.value = 0.0;                      // reset the wave
    rippleTween = null;
    if (!clickUnlocked) { currentIndex = nextIndex; isTransitioning = false; }
  },
});
```

## SplitText choreography (title chars + description lines)

### Splitters
- **Title:** `SplitText.create(h1, { type: "words, chars", mask: "chars", wordsClass: "word",
  charsClass: "char" })` — masked characters (each char clipped by its own overflow box so the
  `y%` slide reads as a reveal). Operate on `split.chars`.
- **Description:** for each `.slide-description p`,
  `SplitText.create(p, { type: "lines", mask: "lines", linesClass: "line" })`, and collect all
  `split.lines` into one array.

### Initial load reveal (runs once at startup)
Split the hardcoded slide-0 content, then two independent `fromTo` tweens (masked lines & chars
rise from below):
```js
gsap.fromTo(initialTitle.chars, { y: "100%" },
  { y: "0%", duration: {{motion.duration.base}}, stagger: {{motion.stagger.tight}}, ease: "power2.out" });
gsap.fromTo(initialLines, { y: "100%" },
  { y: "0%", duration: {{motion.duration.base}}, stagger: {{motion.stagger.tight}}, ease: "power2.out", delay: 0.2 });
```

### Exit timeline (`animateTextOut`, current slide leaving)
Split the current content again, then a timeline that lifts everything **up out** of its mask:
```js
const tl = gsap.timeline();
tl.to(titleSplit.chars, { y: "-100%", duration: {{motion.duration.fast}}, stagger: {{motion.stagger.tight}}, ease: "{{motion.ease.exit}}" });      // at 0
tl.to(lines,            { y: "-100%", duration: {{motion.duration.fast}}, stagger: {{motion.stagger.tight}}, ease: "{{motion.ease.exit}}" }, 0.1);  // absolute t = 0.1
return tl;   // the caller awaits tl.then(...)
```

### Enter timeline (`animateTextIn`, next slide arriving)
Pre-set the freshly built next content offscreen-below and make the container visible, then rise in:
```js
gsap.set([chars, lines], { y: "100%" });
gsap.set(container, { opacity: 1 });   // buildSlideContent starts at opacity 0
return gsap.timeline()
  .to(chars, { y: "0%", duration: 0.5, stagger: {{motion.stagger.tight}}, ease: "{{motion.ease.exit}}" })          // at 0
  .to(lines, { y: "0%", duration: 0.5, stagger: {{motion.stagger.base}}, ease: "power2.out" }, 0.1);       // absolute t = 0.1
```
`buildSlideContent(slide)` creates a `div.slide-content` with inline `opacity: 0` and inner
`<div class="slide-title"><h1>${title}</h1></div>` + `<div class="slide-description"><p>${description}</p></div>`.

## The transition orchestration (click handler)
`slider.addEventListener("click", transition)`. Module-level state:
`currentIndex = 0`, `isTransitioning = false`, `rippleTween = null`.
```js
function transition() {
  if (isTransitioning) return;
  isTransitioning = true;

  if (rippleTween) { rippleTween.kill(); uniforms.uProgress.value = 0.0; rippleTween = null; }

  const nextIndex = (currentIndex + 1) % slides.length;   // cycles 0→1→2→3→0…
  const currentSlide = document.querySelector(".slide-content");

  const exitTimeline = animateTextOut(currentSlide);      // text flies up

  uniforms.uTexCurrent.value = textures[currentIndex];
  uniforms.uTexNext.value    = textures[nextIndex];
  uniforms.uProgress.value   = 0.0;

  let clickUnlocked = false;
  rippleTween = gsap.to(uniforms.uProgress, { /* …the ripple tween above… */ });

  exitTimeline.then(() => {
    currentSlide.remove();                                // drop old DOM overlay
    const nextSlide = buildSlideContent(slides[nextIndex]);
    slider.appendChild(nextSlide);
    requestAnimationFrame(() => animateTextIn(nextSlide)); // text flies in next frame
  });
}
```
So a click launches **two parallel things**: the ~3s ripple/crossfade (delayed 0.3s) on the WebGL
plane, and the text out→in swap gated by the exit timeline finishing. The `uProgress > 0.7` unlock
lets an impatient user click again before the wave fully lands.

### Render loop
```js
function render() {
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
```
A plain rAF render loop — no delta time, no easing here; all animation comes from GSAP mutating the
uniforms and the SplitText transforms.

## Assets / images
- **4 interchangeable slide textures**, all the same role (one is shown at a time; consecutive
  pairs crossfade during the ripple). Landscape **3:2** (~1920×1280), one shared aspect so the
  cover-fit box frames each identically. Moody, cinematic **film-still** photographs, all dominated
  by **deep reds and near-black shadows** with strong tonal contrast (the ripple displacement and
  crossfade read best on these dark, high-contrast, warm-red frames). What's actually shown:
  1. a red-lit interior: a jack-o'-lantern pumpkin-headed figure face-to-face with a red-haired
     woman seen in profile, against a black hallway with a distant red glow (dominant: warm red /
     orange pumpkin, black);
  2. a red-toned close-up of a blonde woman screaming, lit hard against a dark red velvet curtain
     (dominant: saturated red, black);
  3. a dim, dark 1980s living room where a figure leans over a boxy old TV glowing red-pink static,
     furniture barely readable in the shadows (dominant: near-black with a red screen glow);
  4. a red-lit shot through a rain-beaded car windshield at night: a frightened man and woman in the
     front seats, blurred red lights behind them (dominant: red, black, wet-glass speckle).
  Exact aspect isn't critical — the shader cover-fits into the box — but 3:2 matches the
  `uImageRes` of 1920×1280. No logos or baked-in text.

## Behavior notes
- **Click-driven on the whole `.slider`.** No autoplay, no scroll, no hover — the slider is static
  until a click, then advances one slide (wrapping after the 4th).
- On desktop the image is a **centered box** with cream letterbox margins; on mobile
  (`≤ 1000px`) it goes **full-bleed** and the ripple runs faster (1.5s vs 3s).
- The ripple must reach past the far corners: `endValue = maxCornerDist + waveWidth`, recomputed on
  every resize alongside `uResolution`, `uMobile`, and `duration`.
- `mix-blend-mode: difference` on the text overlay is essential — the white type must invert
  against the image and the cream background, not sit as flat white.
- Re-clicking is unlocked at `uProgress > 0.7` (or on tween complete), so rapid clicks queue
  smoothly; an in-flight `rippleTween` is killed and `uProgress` reset before starting the next.
- `pixelRatio` capped at 2. No reduced-motion branch in the original. Requires WebGL; top-level
  await means the scene only builds after all 4 textures load.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/ripple-displacement-slider/slider-img-1.jpg
https://motionprompts.dev/c/ripple-displacement-slider/slider-img-2.jpg
https://motionprompts.dev/c/ripple-displacement-slider/slider-img-3.jpg
https://motionprompts.dev/c/ripple-displacement-slider/slider-img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--crimson`, `--mono`, `--edge`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before
anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two
of everything: two ripple tweens fighting over the same `uProgress` uniform, two render loops
painting into two stacked canvases. The visible symptom is a doubled or stuttering ripple, and it
will not reproduce in a production build, because React only does the double mount in
development. Treat the cleanup as part of the effect, not as an afterthought.

**(1) The entry point.** The script guards its `DOMContentLoaded` listener behind a
`document.readyState` check, then wraps that in a second branch that hands `mount`/`DEFAULTS` to
`window.MP.register` when the catalogue's own editor runtime is present, falling back to a plain
`boot()` otherwise. Neither survives the port: the `readyState` guard is dead weight under
`useEffect`, which already runs after the DOM is committed, and `window.MP` will not exist in a
React host at all. Drop both branches and the guard, and move the body of `mount` — from the
config resolution (`waveFreq`, `wavePow`, `falloff`, `crossfadeWidth`, `stagger`, all clamped
against `DEFAULTS`) down to where it builds its return value — directly inside a `useEffect` with
an empty dependency array. `mount()`'s own return value is already a `destroy()` that unwinds
canvas, textures, listeners and tweens in one call; that shape is not incidental to this
component, it already **is** the effect-cleanup contract React asks for, arrived at
independently, and it should be kept rather than restructured into something else.

**(2) Element lookups.** `document.querySelector(".slider")`, and inside it `.slide-content`,
`.slide-title h1` and `.slide-description p`, all assume this component owns the document. Give
the wrapping element a root ref and scope every lookup to it instead of the bare document. The one
lookup that needs more than scoping is `.slide-content` itself: the vanilla script treats the
HTML-authored slide 0 as a piece of DOM it must literally splice back out on unmount
(`originalSlide` / `originalParent` / `originalNext`, restored before anything else runs in the
cleanup) because the very first transition calls `.remove()` on that exact node and nothing puts
it back on its own. In React that restoration dance is a symptom of DOM built by hand — render
slide 0 from the same `slides` array as every other slide (a slide-index ref or state value, not a
hardcoded `<h1>Blackwater '91</h1>` sitting in JSX) and there is no original node to protect,
because unmounting the component removes it the same way it removes everything else.

**(3) Cleanup.**

Wrap every tween and timeline this component creates — the initial reveal on `initialTitle.chars`
and `initialLines`, the two timelines inside `animateTextOut` / `animateTextIn`, and the ripple
tween on `uniforms.uProgress` — in a `gsap.context` scoped to the root ref, and revert that context
in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    /* the initial reveal only; the transition handler is wired in below, once textures resolve */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

The transition function is not created inside that synchronous factory, though — it only exists
once `loadTextures()` resolves, after the effect has already returned. Registering it still has to
go through the same context or its timelines survive the revert: call `ctx.add(() => { /*
transition(), the click listener, render-loop wiring */ })` from inside that `.then()`, using
`ctx` rather than `self` — by the time an asynchronous continuation runs, `ctx` is fully
initialized, so the temporal-dead-zone hazard only applies to the factory's own synchronous pass,
not to code that runs after it. Do not, on the other hand, make the effect itself `async` to await
the textures before returning a cleanup function. This component already carries the right
discipline for that: `loadTextures` checks its `destroyed` flag after every texture resolves and
disposes the one it just decoded instead of pushing it, and every async continuation inside
`start()` (`exitTimeline.then(...)`, the ripple tween's `onComplete`) bails out on that same flag.
Carry that flag into the effect as its cancellation flag — rename it if you like — rather than
inventing a second one.

The render loop (`render()` calling itself via `requestAnimationFrame`) and the one-shot
`requestAnimationFrame` that defers `animateTextIn` by a frame after `slider.appendChild(nextSlide)`
are two independent handles, tracked separately in the vanilla script (`frame` and the `rafs` Set)
for exactly this reason. Cancel both in the cleanup — cancelling only the render loop and
forgetting the deferred one leaves a callback that, after a StrictMode remount, calls
`animateTextIn` against text belonging to the copy that is on its way out.

`splitTitle` and `splitDescription` run on every transition, including the first slide. The
vanilla `remember()` helper only bothers tracking splits made on the original HTML-authored slide,
because every other `.slide-content` is thrown away along with its splits when the slide is
removed. Once slide markup comes from React instead of `buildSlideContent`'s `innerHTML` string,
every split is a "created" one in that same sense — track and revert all of them, most recent
first, inside the same `gsap.context` cleanup, ordered after the tweens still referencing
`titleSplit.chars` and the line spans have already been killed or reverted.

**Three.js → R3F.** The scene here is about as simple as R3F scenes get — one orthographic camera,
one full-frame plane, one shader material — which makes it a good candidate for the declarative
form rather than an argument for keeping the imperative one:

- Delete the `new THREE.Scene()` / `new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.01, 10)` /
  `new THREE.WebGLRenderer(...)` block and the `slider.prepend(renderer.domElement)` call.
  Describe the same frustum with an orthographic `<Canvas>` sized to match that camera and an
  alpha-enabled `gl`, and the geometry as a `<mesh>` holding a `<planeGeometry>` sized to one unit
  square and a `<shaderMaterial>` fed the existing `uniforms`, `vertexShader` and `fragmentShader`.
- Delete `function render() { renderer.render(scene, camera); frame =
  requestAnimationFrame(render); }` outright rather than porting it into `useFrame`. `<Canvas>`
  already repaints every frame by default, and everything this loop does — redraw after GSAP wrote
  a new `uniforms.uProgress.value` — happens for free under that default; adding a `useFrame` that
  also forces a render would be a second, redundant path drawing the same scene.
- `uResolution` and `uMobile` are **not** covered by "resize is already handled" — that guarantee
  is about the renderer's own canvas size, which `<Canvas>` does take care of. This particular
  shader also folds `uResolution` into its aspect-correction math and reads `uMobile` to switch the
  centered-box letterbox to full-bleed, and neither uniform updates itself. Read the canvas size
  from `useThree`'s `size`, and push it into the material's `uResolution` and (via the same
  breakpoint the vanilla `handleResize` uses) `uMobile` uniforms, plus the ripple's mobile/desktop
  duration and its corner-distance target, inside a small effect keyed on that size.
- `THREE.TextureLoader` loaded the four slide images sequentially with a hand-rolled `await` loop
  so the scene could index into `textures[0]` / `textures[1]`; drei's `useTexture` given the same
  four URLs replaces that loop and integrates with Suspense. The sequential-with-early-abort
  behavior this component relies on today (`if (destroyed) { texture.dispose(); return false; }`)
  goes away with it — it is the Suspense boundary, not a `destroyed` check, that now stands between
  a late-resolving load and an unmounted tree.
- **A static poster is mandatory here specifically because the load is sequential and
  network-bound**: four images must resolve, in order, before the scene has anything to show, so a
  cold visit leaves `.slider` empty for however long that takes. Render `slides[0].image` as a
  plain image in the same box the canvas will occupy, and remove it once the texture set is ready.
- **Do not reach for drei's `Environment` with a `preset`.** This `ShaderMaterial` ignores scene
  lighting entirely — it samples `uTexCurrent` / `uTexNext` directly — so there is nothing here for
  an environment map to feed. If a future revision of this component adds lighting, self-host the
  HDRI rather than depending on drei's third-party preset CDN.
