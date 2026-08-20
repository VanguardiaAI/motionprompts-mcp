# Hero Warp Slider

## Goal
Build a **full-screen WebGL hero slider**: a Three.js fragment shader renders the current image cover-fit to the viewport, and **clicking anywhere advances to the next slide through an expanding "lens-warp bubble"** — a circular magnifying-lens distortion that grows from the center of the screen until the new image fills the frame. In sync, the overlay text (a big uppercase title split into characters, and a small description split into lines) **slides out upward and the next slide's text slides back in**, every fragment masked by an `overflow: hidden` wrapper. The star effect is the shader transition driven by a single GSAP tween on the `uProgress` uniform (0 → 1, 2.5s, `power2.inOut`) plus the GSAP/SplitText text choreography.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) with the **`SplitText`** plugin, and `three` (npm):
```js
import * as THREE from "three";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);
gsap.config({ nullTargetWarn: false });
```
Put the slide data in a sibling module `slides.js` (`export const slides = [...]`) and the two shader strings in `shaders.js` (`export const vertexShader / fragmentShader`), imported into `script.js`. No Lenis, no ScrollTrigger — the page doesn't scroll.

## Layout / HTML
```html
<div class="slider">
  <canvas></canvas>

  <div class="slider-content">
    <div class="slide-title">
      <h1>Quiet Green</h1>
    </div>
    <div class="slide-description">
      <p>A cinematic study of solitude, nature, and a gaze that remembers something forgotten.</p>
      <div class="slide-info">
        <p>Type. Editorial</p>
        <p>Field. Fine Art</p>
        <p>Date. 2025</p>
      </div>
    </div>
  </div>
</div>
<script type="module" src="./script.js"></script>
```
- The `<canvas>` is the WebGL surface; `.slider-content` is an absolutely-positioned DOM overlay on top of it.
- Only slide 1 is in the initial HTML. Every later slide's content node is **built in JS** from the data module and swapped in during the transition.

`slides.js` — 4 entries, each `{ title, description, type, field, date, image }`:
1. `"Quiet Green"` / "A cinematic study of solitude, nature, and a gaze that remembers something forgotten." / Editorial / Fine Art / 2025 / image 1
2. `"Crimson Reign"` / "Ornate textures and ceremonial gold unravel across a sea of red—silent power in stillness." / Editorial / Conceptual / 2022 / image 2
3. `"Gilded Brow"` / "A baroque close-up capturing the tactile intimacy of skin, shadow, and the glitter of ritual." / Detail Study / Experimental / 2024 / image 3
4. `"Golden Flight"` / "A blur of motion in sun-soaked gold—freedom becomes visible only in the act of leaving." / Motion Still / Cinematic / 2023 / image 4

## Styling
Font import: `@import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");`

Global reset `* { margin:0; padding:0; box-sizing:border-box; }`, `body { font-family:"Inter"; }`

- `h1`: `text-transform:uppercase; font-size:7vw; font-weight:700; line-height:1;`
- `p`: `font-size:0.95rem;`
- `.slider`: `position:relative; width:100vw; height:100svh; color:#fff; overflow:hidden;`
- `canvas`: `display:block; width:100%; height:100%;`
- `.slider-content`: `position:absolute; top:0; left:0; width:100%; height:100%; user-select:none; z-index:2;`
- `.slide-title`: `position:absolute; top:45%; left:50%; transform:translate(-50%,-50%); width:100%; text-align:center;`
- `.slide-description`: `position:absolute; top:60%; left:60%; transform:translate(-50%,-50%); width:25%; display:flex; flex-direction:column; gap:2rem;` (sits right-of-center, below the title)
- `.slide-info p`: `text-transform:uppercase;`
- **Split-text scaffolding (required for the masked reveals):**
  - `.slide-title h1 { display:flex; justify-content:center; gap:0.2em; }`
  - `.slide-title h1 .word { display:flex; }`
  - `.slide-title h1 .char { display:block; }`
  - `.char, .line { overflow:hidden; }` — the masks
  - `.char span, .line span { display:inline-block; will-change:transform; position:relative; }` — the animated inner spans
- Responsive `@media (max-width:1000px)`: `.slide-title { top:50%; }` and `.slide-description { width:75%; text-align:center; top:unset; bottom:5%; left:50%; transform:translate(-50%,-50%); }`

## Text splitting
Two different mechanisms:

**Title — manual character splitter** (function `createCharacterElements(element)`; bail out if the element already contains `.char` nodes). Split `textContent` on spaces; for each word append `<div class="word">` containing one `<div class="char"><span>X</span></div>` per character; between words append an extra `.word` holding `<div class="char"><span> </span></div>` (a real space character in a span). This gives per-character masks while the flex `gap:0.2em` on the h1 provides word spacing.

**Description — SplitText lines.** For every `.slide-description p` run `new SplitText(element, { type: "lines", linesClass: "line" })`, then post-process each `.line` by replacing its innerHTML with `<span>${line.textContent}</span>` so each line has an inner span to translate inside the `overflow:hidden` line.

Wrap both in `processTextElements(container)` — split the title h1 with the char splitter and all description `p`s (including the three `.slide-info` rows) with the line splitter.

## Three.js scene (the stage)
- `scene = new THREE.Scene();`
- `camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);` — a fullscreen quad rig.
- `renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("canvas"), antialias: true });` then `renderer.setSize(window.innerWidth, window.innerHeight);`
- One mesh: `new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial)` added to the scene.
- `shaderMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })` with uniforms:
  - `uTexture1: { value: null }` (current image), `uTexture2: { value: null }` (incoming image)
  - `uProgress: { value: 0.0 }` — the transition driver
  - `uResolution: { value: new THREE.Vector2(innerWidth, innerHeight) }`
  - `uTexture1Size` / `uTexture2Size`: `new THREE.Vector2(1, 1)` — the pixel dimensions of each texture, needed for cover-fit.
- **Texture loading:** with a `THREE.TextureLoader`, load each slide's image sequentially (await a promise around `loader.load`); set `texture.minFilter = texture.magFilter = THREE.LinearFilter;` and stash `texture.userData = { size: new THREE.Vector2(image.width, image.height) };`. Push into a `slideTextures` array. After loading, seed `uTexture1` with texture 0 and `uTexture2` with texture 1 (plus their sizes).
- Plain `requestAnimationFrame` loop calling `renderer.render(scene, camera)` forever.
- Resize handler: `renderer.setSize(innerWidth, innerHeight)` and `uResolution.value.set(innerWidth, innerHeight)`.

## Shaders (`shaders.js`)

**Vertex shader** — passthrough forwarding `uv` as `vUv`:
```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**Fragment shader** — the lens-warp bubble. Uniforms: `sampler2D uTexture1, uTexture2; float uProgress; vec2 uResolution, uTexture1Size, uTexture2Size; varying vec2 vUv;`

Helper 1 — CSS-`cover` UVs so any aspect ratio fills the screen without stretching:
```glsl
vec2 getCoverUV(vec2 uv, vec2 textureSize) {
  vec2 s = uResolution / textureSize;
  float scale = max(s.x, s.y);
  vec2 scaledSize = textureSize * scale;
  vec2 offset = (uResolution - scaledSize) * 0.5;
  return (uv * uResolution - offset) / scaledSize;
}
```

Helper 2 — push a UV along a direction (y displacement doubled for a stretched, anamorphic feel):
```glsl
vec2 getDistortedUv(vec2 uv, vec2 direction, float factor) {
  vec2 scaledDirection = direction;
  scaledDirection.y *= 2.0;
  return uv - scaledDirection * factor;
}
```

Helper 3 — the lens. Returns a struct `LensDistortion { vec2 distortedUV; float inside; }`:
```glsl
LensDistortion getLensDistortion(vec2 p, vec2 uv, vec2 sphereCenter,
                                 float sphereRadius, float focusFactor) {
  vec2 distortionDirection = normalize(p - sphereCenter);
  float focusRadius = sphereRadius * focusFactor;
  float focusStrength = sphereRadius / 3000.0;
  float focusSdf = length(sphereCenter - p) - focusRadius;
  float sphereSdf = length(sphereCenter - p) - sphereRadius;
  float inside = smoothstep(0.0, 1.0, -sphereSdf / (sphereRadius * 0.001));

  float magnifierFactor = focusSdf / (sphereRadius - focusRadius);
  float mFactor = clamp(magnifierFactor * inside, 0.0, 1.0);
  mFactor = pow(mFactor, 5.0);

  float distortionFactor = mFactor * focusStrength;
  vec2 distortedUV = getDistortedUv(uv, distortionDirection, distortionFactor);
  return LensDistortion(distortedUV, inside);
}
```
`inside` is a razor-thin smoothstep (width = 0.1% of the radius) — effectively a hard circular edge. Inside the bubble, distortion ramps from 0 at the inner "focus" circle (25% of the radius, sharp) to max at the rim, with `pow(…, 5.0)` biasing the warp hard toward the rim.

`main()` — work in **pixel space**:
```glsl
void main() {
  vec2 center = vec2(0.5, 0.5);
  vec2 p = vUv * uResolution;

  vec2 uv1 = getCoverUV(vUv, uTexture1Size);
  vec2 uv2 = getCoverUV(vUv, uTexture2Size);

  float maxRadius = length(uResolution) * 1.5;
  float bubbleRadius = uProgress * maxRadius;
  vec2 sphereCenter = center * uResolution;
  float focusFactor = 0.25;

  float dist = length(sphereCenter - p);
  float mask = step(bubbleRadius, dist);

  vec4 currentImg = texture2D(uTexture1, uv1);
  LensDistortion distortion =
    getLensDistortion(p, uv2, sphereCenter, bubbleRadius, focusFactor);
  vec4 newImg = texture2D(uTexture2, distortion.distortedUV);

  float finalMask = max(mask, 1.0 - distortion.inside);
  vec4 color = mix(newImg, currentImg, finalMask);
  gl_FragColor = color;
}
```
Net effect: at `uProgress = 0` you see only texture 1; as progress rises a circle grows from screen center showing texture 2 warped like glass, and at `uProgress = 1` (radius = 1.5 × the viewport diagonal) texture 2 covers everything, undistorted at the center.

## GSAP effect (the important part — be exact)

### State
`currentSlideIndex = 0`, `isTransitioning = false`. Global listeners:
- `window "load"` → run the intro text animation, then initialize the renderer/textures.
- `document "click"` (anywhere) → `handleSlideChange()`.
- `window "resize"` → resize handler above.

### 1) Intro on page load
After `processTextElements` on the initial `.slider-content`, grab `chars = .char span` and `lines = .line span`, then:
- `gsap.fromTo(chars, { y: "100%" }, { y: "0%", duration: 0.8, stagger: 0.025, ease: "power2.out" })`
- `gsap.fromTo(lines, { y: "100%" }, { y: "0%", duration: 0.8, stagger: 0.025, ease: "power2.out", delay: 0.2 })`

Percentage `y` transforms, so each span rises exactly its own height out of the mask.

### 2) Click → shader transition
`handleSlideChange()`:
1. If `isTransitioning`, return. Set `isTransitioning = true`.
2. `nextIndex = (currentSlideIndex + 1) % slides.length` — infinite wrap.
3. Point the uniforms: `uTexture1` = texture of the current slide, `uTexture2` = texture of the next, and copy both `userData.size` vectors into `uTexture1Size`/`uTexture2Size`.
4. Kick off the text timeline (below) **and** the shader tween simultaneously:
```js
gsap.fromTo(shaderMaterial.uniforms.uProgress,
  { value: 0 },
  {
    value: 1,
    duration: 2.5,
    ease: "power2.inOut",
    onComplete: () => {
      shaderMaterial.uniforms.uProgress.value = 0;
      shaderMaterial.uniforms.uTexture1.value = slideTextures[nextIndex];
      shaderMaterial.uniforms.uTexture1Size.value = slideTextures[nextIndex].userData.size;
    },
  }
);
```
The tween animates the **uniform object's `value` property** directly. On complete it snaps progress back to 0 and promotes the new texture to `uTexture1` — visually seamless because at progress 1 the bubble already covers the screen.

### 3) Text out/in timeline (runs in parallel with the shader tween)
`animateSlideTransition(nextIndex)` builds one `gsap.timeline()`:
- **Chars out:** `.to(currentContent.querySelectorAll(".char span"), { y: "-100%", duration: 0.6, stagger: 0.025, ease: "power2.inOut" })` at time 0.
- **Lines out:** same tween on `.line span` (`y: "-100%"`, 0.6s, stagger 0.025, `power2.inOut`) at **position `0.1`** — description trails the title by 100ms.
- **`.call(fn, null, 0.5)`** — at the 0.5s mark (while the outro tails are still finishing):
  1. Build the next slide's `.slider-content` DOM node from `slides[nextIndex]` (same inner markup as the static HTML, with `Type.` / `Field.` / `Date.` prefixes) with inline `opacity: 0`.
  2. `timeline.kill()`, remove the old content node, append the new one to `.slider`.
  3. `gsap.set(newContent.querySelectorAll("span"), { y: "100%" })` as a pre-hide.
  4. **`setTimeout(…, 100)`** (lets layout settle so SplitText measures real line breaks), then:
     - `processTextElements(newContent)`;
     - `gsap.set([newChars, newLines], { y: "100%" })`; `gsap.set(newContent, { opacity: 1 })`;
     - a new timeline with `onComplete: () => { isTransitioning = false; currentSlideIndex = nextIndex; }`:
       - **Chars in:** `.to(newChars, { y: "0%", duration: 0.5, stagger: 0.025, ease: "power2.inOut" })` at time 0.
       - **Lines in:** `.to(newLines, { y: "0%", duration: 0.5, stagger: 0.1, ease: "power2.inOut" }, 0.3)` — lines enter with a chunkier 0.1 stagger, starting 0.3s in.

Timing summary: text exits over ~0.7s, new text enters from ~0.6s onward, all while the 2.5s bubble is still growing — the type settles well before the warp finishes. Clicks during the transition are ignored until the *text* timeline completes (`isTransitioning` is released by the text, not the shader tween).

## Assets / images
**4 full-bleed images**, one per slide, loaded as WebGL textures and cover-fit by the shader — any aspect works, but a cohesive cinematic set around **3:2–16:9 landscape, ≥1600px wide** looks best. Dark, painterly, editorial photography suits the white overlay type. Suggested roles:
1. **Slide 1 ("Quiet Green")** — moody portrait of a fair-haired woman lit from the side against near-black, framed by dark green foliage with small orange berries and a white flower.
2. **Slide 2 ("Crimson Reign")** — woman with long dark curls reclining on ornate red-and-gold brocade, gilded embroidery and gold objects around her.
3. **Slide 3 ("Gilded Brow")** — extreme macro of skin and a brow crowned by a glittering gold jeweled headpiece in warm light.
4. **Slide 4 ("Golden Flight")** — motion-blurred figure in pale cream running through sun-soaked golden grass with splashing water.

No brands or logos; any four images in this cinematic register work.

## Behavior notes
- **Click anywhere** on the page advances (listener on `document`), looping 1→2→3→4→1 forever. There are no arrows or dots.
- Transitions are **locked** while one runs (`isTransitioning` guard) — rapid clicks don't queue.
- Textures are awaited sequentially before the first render, so the first click always has both textures ready.
- Responsive: below 1000px the title centers vertically and the description drops to a centered block near the bottom. The canvas resizes with the window (renderer size + `uResolution`).
- No scroll, no Lenis, no reduced-motion branch in the original.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/warp-slider/img-1.jpg
https://motionprompts.dev/c/warp-slider/img-2.jpg
https://motionprompts.dev/c/warp-slider/img-3.jpg
https://motionprompts.dev/c/warp-slider/img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--paper-dim`, `--gold`, `--gold-dim`, `--pad-x`, `--pad-y`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a page that boots exactly once on the window `load` event and never expects to run a second time. `initializeRenderer` builds a `THREE.Scene`, the orthographic camera and a `WebGLRenderer` bound to whatever `<canvas>` `document.querySelector("canvas")` finds, loads the four slide textures into a module-level `slideTextures` array, and only then starts its own `requestAnimationFrame` loop; `setupInitialSlide` splits and animates the first slide's text; and `currentSlideIndex`, `isTransitioning`, `shaderMaterial` and `renderer` all live as bare module-scope `let`s rather than anything scoped to one run of the script. React withdraws the "runs once" part first. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen — and because those four variables are module state, not effect state, a naive port has the *second* mount's `initializeRenderer` grab the same `<canvas>` node and hand it to a second `WebGLRenderer`. A canvas returns the *same* underlying WebGL context object for a second same-type `getContext` call rather than a fresh one, so the two `WebGLRenderer` instances end up driving one shared context through two independent internal state caches — each renderer's idea of which texture and program are currently bound goes stale the instant the other renderer touches the context, and the visible result is flicker or a frame that renders half of one slide transition and half of the previous mount's. Meanwhile the first mount's now-orphaned `requestAnimationFrame` loop keeps calling `.render()` against a scene the second mount's textures were never loaded into. None of this reproduces in a production build, because only development does the double mount. Treat the cleanup as part of the effect, and treat the module-level state itself as the bug — not as a detail to carry over.

*(1) The entry point* — the script waits for the window `load` event before running either `setupInitialSlide` or `initializeRenderer`; that event has already fired by the time a React component mounts, so a listener ported as-is never runs. Move both calls into a `useEffect` with an empty dependency array — but `initializeRenderer` is `async` and awaits a `THREE.TextureLoader` load per slide, sequentially, before it ever calls `render()` for the first time, which makes this exactly the case where the effect callback itself has to stay synchronous. Do not write `useEffect(async () => { await initializeRenderer(); })`: the value returned would be a promise, not a cleanup function, and React 19 throws `cleanup is not a function` and takes the whole tree down with it. Start the async work from inside a synchronous effect body, and check a cancellation flag both after the texture loop's last `await` and again immediately before the first `requestAnimationFrame(render)` call — four sequential image loads are slow enough that a StrictMode unmount can land in either window:

```jsx
useEffect(() => {
  let cancelled = false;
  const ctx = gsap.context(() => {
    setupInitialSlide(); // synchronous — its two intro tweens get tracked here
  }, rootRef);

  initializeRenderer().then(() => {
    if (cancelled) return; // unmount already ran while the four textures were loading
  });

  return () => { cancelled = true; ctx.revert(); };
}, []);
```

Thread the same `cancelled` flag into `initializeRenderer` itself (pass it as an argument, or read it off a ref) so the loop inside it can bail before starting `render()`, not just after the promise chain returns to the effect.

*(2) Element lookups* — `animateSlideTransition`, `setupInitialSlide` and `initializeRenderer` each re-run `document.querySelector(".slider-content")`, `document.querySelector(".slider")` or `document.querySelector("canvas")` fresh rather than caching a reference once. Give the component a root `ref` on the element that renders `.slider`, and resolve all three from it instead of from `document`. This is not a style nit for this component specifically: `.slider-content` is the exact node `animateSlideTransition` tears down and replaces on every click, so during the instant a StrictMode remount overlaps two copies of the subtree, an unscoped lookup can grab the outgoing copy and animate a node that is already on its way out of the DOM.

*(3) Cleanup* — in this order:

**GSAP.** Wrap `setupInitialSlide`'s two intro tweens, and every tween `handleSlideChange` creates, in a `gsap.context` scoped to the root ref, and call `ctx.revert()` in the cleanup. `handleSlideChange` only ever runs later, from the `document` click listener, long after the effect's synchronous setup pass has already returned — so its tweens are invisible to a plain `gsap.context` unless the function itself is registered with the context, using the name-plus-function overload of `self.add`, and invoked through the returned method rather than the bare closure:

```jsx
const ctx = gsap.context((self) => {
  self.add("advance", handleSlideChange);
}, rootRef);
document.addEventListener("click", () => ctx.advance());
```

That covers the outer timeline `animateSlideTransition` builds and the `gsap.fromTo` tween on `shaderMaterial.uniforms.uProgress`, since both are created synchronously inside `handleSlideChange`. It does **not** cover the inner timeline built inside the outer timeline's `.call()` callback: that callback fires on GSAP's own clock, after the synchronous `advance()` invocation has already returned, so anything it creates — the `setTimeout`-delayed `processTextElements` pass and the second `gsap.timeline` that brings the new slide's characters and lines in — sits outside the window `gsap.context` can see. Keep an explicit reference to that inner timeline and to the `setTimeout` id, and in the same cleanup, clear the timeout and call `.kill()` on the timeline directly, in addition to `ctx.revert()`. Skip this and a deferred text-in animation stays free to fire against DOM nodes a fresh mount's context never created.

**rAF.** The render loop keeps no handle on itself: `requestAnimationFrame(render)` inside `render` discards the id it returns, so there is nothing to cancel later. Capture it and call `cancelAnimationFrame` on the latest id in the cleanup — and because the loop only starts after all four textures resolve, gate its very first call on the same cancellation flag from (1), or a StrictMode unmount that lands during texture loading still lets a loop start up after teardown has already run.

**SplitText.** The title and the description use two different splitters, and only one of them is safe to re-run. `createCharacterElements` bails out on itself when `.char` nodes already exist, so a second `setupInitialSlide` call against the same JSX-rendered heading is harmless. `createLineElements` has no such guard — it calls `new SplitText(element, { type: "lines", … })` unconditionally, so re-running it against the same still-mounted `<p>` re-splits already-split lines and nests `.line` one level deeper, breaking the `y` translation the intro tween relies on. Keep the `SplitText` instances `createLineElements` produces (one per `.slide-description p` — four of them in the initial markup) and call `.revert()` on each inside the same cleanup, ordered before `ctx.revert()` tears down the tweens that target their `.line span` nodes. The splits `processTextElements` performs on each freshly built slide node during a transition need no separate tracking — that node is discarded wholesale on the *next* transition — but if the component unmounts mid-transition, the still-attached replacement node and its splits are handled by the same timeline-kill-and-context-revert pair from the GSAP block above, not by anything SplitText-specific.

*(4) Rendering this in `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

`<Canvas>` replaces `new THREE.Scene()` / `OrthographicCamera` / `WebGLRenderer` outright, but the camera needs care: this rig is a fullscreen quad meant to fill clip space exactly, so the orthographic frustum has to stay the same six numbers — left/right/top/bottom of one and minus one, near zero, far one — not R3F's default perspective camera. Pass that frustum to `<Canvas orthographic camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1 }}>`, or use a drei `<OrthographicCamera makeDefault>` with the same values. The single `PlaneGeometry(2, 2)` mesh becomes `<mesh><planeGeometry args={[2, 2]} /><shaderMaterial ref={materialRef} args={[{ uniforms, vertexShader, fragmentShader }]} /></mesh>` — the shader strings and the uniform shapes carry over unchanged.

There is no `.glb` here, so `useGLTF` does not apply. The four textures replace the sequential `for (const slide of slides) { await loader.load(...) }` loop with drei's `useTexture(slides.map(s => s.image))`, which Suspense-gates the component until all four have decoded. The per-texture bookkeeping the vanilla loop does by hand — `minFilter`/`magFilter` set to `LinearFilter`, and each image's pixel size stashed into a `Vector2` for the cover-fit math — still has to run once after `useTexture` resolves; neither the hook nor R3F does it for you. The hand-rolled `render()` loop becomes the callback passed to `useFrame`, minus its own `renderer.render(...)` call — `<Canvas>` paints the frame once `useFrame` returns — and minus the `requestAnimationFrame(render)` recursion, since `useFrame` already is the loop.

Resize is mostly free — `<Canvas>` observes its own container and calls the renderer's resize for you — but `uResolution` is a uniform this component owns, not something R3F updates on your behalf. Read the logical size from `useThree(({ size }) => size)`, which reports CSS pixels the same way the vanilla `window.innerWidth`/`window.innerHeight` pair already did with no devicePixelRatio scaling, and push it into `uResolution.value.set(...)` yourself whenever it changes.

Keep the click listener exactly where it is — on `document`, not as a mesh `onClick`. `.slider-content` is a full-viewport DOM overlay sitting above the canvas in stacking order, and "click anywhere" in this component means anywhere on the page, title and description text included. An R3F pointer handler only fires for events that raycast onto the mesh itself, and would miss every click that lands on the overlay text instead.

A poster is mandatory here even without a `.glb`: with four textures gated behind Suspense and a render loop that cannot start before they resolve, a cold visit shows nothing at all — not even one painted frame — until all four have decoded. Render slide one's image ("Quiet Green") as a plain `<img>` filling the same box the canvas occupies, and swap it out only once a frame with the real textures has actually painted, not the instant the component mounts.

Skip drei's `Environment` regardless of preset temptation: `shaderMaterial` here is a fully custom, unlit material that samples only its own two texture uniforms — there is no scene lighting for an environment map to feed into. If a future variant of this slider adds a lit placeholder mesh for the loading state, light it with explicit lights or a self-hosted HDRI — never a `preset`, which is fetched from a third-party CDN hard-coded into drei and leaves that placeholder unlit the moment that host is unreachable.
