# Warp Lens Slider

## Goal
Build a **full-screen WebGL image slider**: a Three.js canvas fills the viewport and shows one cinematic photograph at a time, with a big centered uppercase title and a small description block layered on top in HTML. **Clicking anywhere** advances to the next slide with the signature effect — a **circular "lens bubble" expands from the exact center of the screen**, revealing the incoming photo inside it while the bubble's rim **warps the new image with a magnifying-glass distortion** (a custom fragment shader). While the bubble grows, GSAP slides the title characters and description lines up out of their masks and staggers the next slide's text back in. Slides loop forever in one direction.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`SplitText`** plugin, plus **`three`** (npm) for the WebGL layer:
```js
import * as THREE from "three";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
```
Call `gsap.registerPlugin(SplitText)` and `gsap.config({ nullTargetWarn: false })` (content nodes are removed mid-timeline, so null targets must not warn). You may keep the slide data and the GLSL shader strings in separate local modules (e.g. `slides.js`, `shaders.js`) or inline in `script.js`.

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
Only the **first** slide lives in the static HTML. Subsequent `.slider-content` blocks are built in JS from a data array and swapped in during transitions.

### Slide data (4 slides)
```js
const slides = [
  { title: "Quiet Green",   description: "A cinematic study of solitude, nature, and a gaze that remembers something forgotten.",          type: "Editorial",    field: "Fine Art",     date: "2025", image: "./img-1.jpg" },
  { title: "Crimson Reign", description: "Ornate textures and ceremonial gold unravel across a sea of red—silent power in stillness.",     type: "Editorial",    field: "Conceptual",   date: "2022", image: "./img-2.jpg" },
  { title: "Gilded Brow",   description: "A baroque close-up capturing the tactile intimacy of skin, shadow, and the glitter of ritual.",  type: "Detail Study", field: "Experimental", date: "2024", image: "./img-3.jpg" },
  { title: "Golden Flight", description: "A blur of motion in sun-soaked gold—freedom becomes visible only in the act of leaving.",        type: "Motion Still", field: "Cinematic",    date: "2023", image: "./img-4.jpg" },
];
```
The dynamically-built content uses the exact same markup as the static block, with the info lines templated as `Type. ${type}`, `Field. ${field}`, `Date. ${date}`.

## Styling
Font: **Inter** from Google Fonts (variable weights). Global reset `* { margin:0; padding:0; box-sizing:border-box; }`, `body { font-family: "Inter"; }`.

- `h1`: `text-transform: uppercase; font-size: 7vw; font-weight: 700; line-height: 1;`
- `p`: `font-size: 0.95rem;`
- `.slider`: `position: relative; width: 100vw; height: 100svh; color: #fff; overflow: hidden;`
- `canvas`: `display: block; width: 100%; height: 100%;`
- `.slider-content`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; user-select: none; z-index: 2;` (sits above the canvas; text is white over the photo)
- `.slide-title`: `position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%); width: 100%; text-align: center;`
- `.slide-description`: `position: absolute; top: 60%; left: 60%; transform: translate(-50%, -50%); width: 25%; display: flex; flex-direction: column; gap: 2rem;` (offset right of center, below the title)
- `.slide-info p`: `text-transform: uppercase;`

Text-mask plumbing (essential for the reveal effect):
- `.slide-title h1`: `display: flex; justify-content: center; gap: 0.2em;` (the gap renders the space between words)
- `.slide-title h1 .word`: `display: flex;`
- `.slide-title h1 .char`: `display: block;`
- `.char, .line`: `overflow: hidden;` — these are the clipping masks
- `.char span, .line span`: `display: inline-block; will-change: transform; position: relative;` — these are what GSAP moves

Responsive (`@media (max-width: 1000px)`): `.slide-title { top: 50%; }`; `.slide-description { width: 75%; text-align: center; top: unset; bottom: 5%; left: 50%; transform: translate(-50%, -50%); }`.

## GSAP effect (be exhaustive)

### Text splitting
Two different mechanisms:
- **Title (`h1`) — manual character split** (not SplitText): split `textContent` on spaces; for each word create `<div class="word">`, and inside it one `<div class="char"><span>X</span></div>` per character. Between words append an extra `.word` containing `<div class="char"><span> </span></div>` (a literal space span). Guard: if the element already contains `.char` nodes, skip (never double-split).
- **Description paragraphs — GSAP SplitText**: `new SplitText(p, { type: "lines", linesClass: "line" })`, then replace each `.line`'s innerHTML with `<span>${line.textContent}</span>` so every line has an inner span to animate inside the `overflow:hidden` line mask.

A `processTextElements(container)` helper applies the char split to `.slide-title h1` and the line split to every `.slide-description p` (both paragraphs: the description and each `.slide-info p` — select all `p` inside `.slide-description`).

### Intro animation (on load)
After splitting the initial content:
- `gsap.fromTo(charSpans, { y: "100%" }, { y: "0%", duration: 0.8, stagger: 0.025, ease: "power2.out" })`
- `gsap.fromTo(lineSpans, { y: "100%" }, { y: "0%", duration: 0.8, stagger: 0.025, ease: "power2.out", delay: 0.2 })`

### Three.js setup
- `THREE.Scene()` + `THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)`.
- `THREE.WebGLRenderer({ canvas, antialias: true })`, `renderer.setSize(window.innerWidth, window.innerHeight)`.
- One full-screen quad: `new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial)`.
- `THREE.ShaderMaterial` with uniforms:
  - `uTexture1: null` (outgoing image), `uTexture2: null` (incoming image)
  - `uProgress: 0.0` (the transition driver, 0→1)
  - `uResolution: new THREE.Vector2(window.innerWidth, window.innerHeight)`
  - `uTexture1Size` / `uTexture2Size`: `new THREE.Vector2(1, 1)` (natural pixel sizes, needed for cover-fit)
- Load all 4 slide images sequentially with `THREE.TextureLoader` (await each). For each texture set `minFilter = magFilter = THREE.LinearFilter` and stash `new THREE.Vector2(image.width, image.height)` (e.g. in `texture.userData.size`). After loading, assign texture 0 → `uTexture1`, texture 1 → `uTexture2`, plus their sizes.
- Plain `requestAnimationFrame` loop calling `renderer.render(scene, camera)` every frame.

### Fragment shader (the warp — reproduce this math exactly)
Vertex shader is a pass-through that forwards `uv` as `vUv`. The fragment shader composites the two textures with an expanding lens bubble:

```glsl
// cover-fit UV (like CSS object-fit: cover), per texture:
vec2 getCoverUV(vec2 uv, vec2 textureSize) {
  vec2 s = uResolution / textureSize;
  float scale = max(s.x, s.y);
  vec2 scaledSize = textureSize * scale;
  vec2 offset = (uResolution - scaledSize) * 0.5;
  return (uv * uResolution - offset) / scaledSize;
}

// radial push, with the vertical component doubled:
vec2 getDistortedUv(vec2 uv, vec2 direction, float factor) {
  vec2 scaledDirection = direction;
  scaledDirection.y *= 2.0;
  return uv - scaledDirection * factor;
}

struct LensDistortion { vec2 distortedUV; float inside; };

LensDistortion getLensDistortion(vec2 p, vec2 uv, vec2 sphereCenter,
                                 float sphereRadius, float focusFactor) {
  vec2 distortionDirection = normalize(p - sphereCenter);
  float focusRadius = sphereRadius * focusFactor;          // inner "clear" zone
  float focusStrength = sphereRadius / 3000.0;             // warp amplitude grows with the bubble
  float focusSdf = length(sphereCenter - p) - focusRadius;
  float sphereSdf = length(sphereCenter - p) - sphereRadius;
  float inside = smoothstep(0.0, 1.0, -sphereSdf / (sphereRadius * 0.001)); // ~binary inside-bubble mask, hairline AA edge

  float magnifierFactor = focusSdf / (sphereRadius - focusRadius); // 0 at focus ring -> 1 at rim
  float mFactor = clamp(magnifierFactor * inside, 0.0, 1.0);
  mFactor = pow(mFactor, 5.0);                             // warp concentrated at the rim

  float distortionFactor = mFactor * focusStrength;
  vec2 distortedUV = getDistortedUv(uv, distortionDirection, distortionFactor);
  return LensDistortion(distortedUV, inside);
}

void main() {
  vec2 center = vec2(0.5, 0.5);
  vec2 p = vUv * uResolution;                  // pixel space
  vec2 uv1 = getCoverUV(vUv, uTexture1Size);
  vec2 uv2 = getCoverUV(vUv, uTexture2Size);

  float maxRadius = length(uResolution) * 1.5; // bubble fully covers the screen at progress 1
  float bubbleRadius = uProgress * maxRadius;
  vec2 sphereCenter = center * uResolution;    // dead center of the viewport
  float focusFactor = 0.25;

  float dist = length(sphereCenter - p);
  float mask = step(bubbleRadius, dist);       // 1 outside the bubble, 0 inside

  vec4 currentImg = texture2D(uTexture1, uv1);
  LensDistortion distortion = getLensDistortion(p, uv2, sphereCenter, bubbleRadius, focusFactor);
  vec4 newImg = texture2D(uTexture2, distortion.distortedUV);

  float finalMask = max(mask, 1.0 - distortion.inside);
  gl_FragColor = mix(newImg, currentImg, finalMask); // inside bubble: warped new image; outside: current image
}
```
Reading of the effect: at `uProgress = 0` the bubble has zero radius so only the current image shows. As `uProgress` rises, a hard-edged circle grows from the center; **inside** it you see the incoming image, sampled through a radial magnifier whose strength peaks at the circle's rim (`pow(…, 5.0)`) and whose vertical displacement is 2× the horizontal — the new photo looks smeared/stretched at the bubble edge and clean near the center. At `uProgress = 1` the radius (`1.5 × diagonal`) exceeds the screen, the warp has relaxed, and the new image fully covers the frame.

### Click transition
State: `currentSlideIndex = 0`, `isTransitioning = false`. On `click` anywhere on `.slider`:
1. If `isTransitioning`, ignore. Set `isTransitioning = true`; `nextIndex = (currentSlideIndex + 1) % slides.length`.
2. Point the uniforms: `uTexture1` = texture of the current slide, `uTexture2` = texture of the next slide (plus both `u…Size` uniforms).
3. **Shader tween** (runs in parallel with the text): `gsap.fromTo(shaderMaterial.uniforms.uProgress, { value: 0 }, { value: 1, duration: 2.5, ease: "power2.inOut", onComplete })`. In `onComplete`: reset `uProgress.value = 0` and set `uTexture1` (and `uTexture1Size`) to the **next** slide's texture, so the resting frame shows the new image with the bubble collapsed.
4. **Text-out / text-in timeline** (`gsap.timeline()`):
   - `.to(currentChar spans, { y: "-100%", duration: 0.6, stagger: 0.025, ease: "power2.inOut" })` — title exits upward through its masks.
   - `.to(currentLine spans, { y: "-100%", duration: 0.6, stagger: 0.025, ease: "power2.inOut" }, 0.1)` — description lines follow, starting at absolute position `0.1`.
   - `.call(fn, null, 0.5)` — at the 0.5 s mark: kill this timeline, `remove()` the old `.slider-content`, build the next slide's content node (created with inline `opacity: 0`), append it to `.slider`, and `gsap.set` all its `span`s to `y: "100%"`. Then, after a `setTimeout(…, 100)` (lets the DOM settle so SplitText measures real line breaks):
     - run `processTextElements(newContent)` (char + line splitting),
     - `gsap.set` the fresh `.char span` and `.line span` collections to `y: "100%"`, `gsap.set(newContent, { opacity: 1 })`,
     - play the entrance timeline with `onComplete: () => { isTransitioning = false; currentSlideIndex = nextIndex; }`:
       - `.to(newChars, { y: "0%", duration: 0.5, stagger: 0.025, ease: "power2.inOut" })`
       - `.to(newLines, { y: "0%", duration: 0.5, stagger: 0.1, ease: "power2.inOut" }, 0.3)`

Net choreography: the old text is fully gone by ~0.5 s, the new text lands by ~1.4 s, while the lens bubble keeps expanding until 2.5 s — the text swap happens **inside** the slow warp, which is what makes it feel cinematic.

### Resize
On `window` resize: `renderer.setSize(innerWidth, innerHeight)` and update `uResolution` — the cover-fit UVs adapt automatically.

## Assets / images
**4 full-bleed photographic slide textures** (one per slide), loaded as WebGL textures and cover-fitted by the shader, so any reasonably large landscape image works (~16:9 or bigger; 1920 px+ wide recommended). They should read as one cohesive **dark, cinematic, fine-art editorial series** so the white text stays legible:
1. *Quiet Green* — moody chiaroscuro portrait wrapped in dark green foliage on a near-black background.
2. *Crimson Reign* — opulent figure in red-and-gold brocade on a matching crimson textured set with scattered gold.
3. *Gilded Brow* — extreme warm-lit baroque close-up of skin and lashes beneath a glittering gold headpiece.
4. *Golden Flight* — motion-blurred figure in a pale dress running through sunlit golden grass.

## Behavior notes
- **Click only** — no scroll hijacking, no keyboard, no autoplay. Every click advances one slide, always forward, looping `0→1→2→3→0…`.
- `isTransitioning` locks input for the full text choreography (released when the entrance timeline completes); clicks during a transition are ignored.
- Textures are all loaded up-front (sequential awaits) before the render loop starts; the first painted frame is slide 1.
- The `.char`/`.line` masks plus inner spans are the entire reveal mechanism — without `overflow: hidden` on the wrappers the y-percent slides won't clip.
- `gsap.config({ nullTargetWarn: false })` is required because the outgoing content node is removed while its timeline is still referenced.
- Below 1000 px the description recenters at the bottom; the WebGL effect itself is resolution-independent. Heavy on GPU — desktop-first. No reduced-motion handling in the original.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/warp-slider-next/img-1.jpg
https://motionprompts.dev/c/warp-slider-next/img-2.jpg
https://motionprompts.dev/c/warp-slider-next/img-3.jpg
https://motionprompts.dev/c/warp-slider-next/img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-soft`, `--ink-faint`, `--scrim`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes one `initSlider()` closure, kicked off once at the bottom of the file, that owns five pieces of state as plain `let` bindings — `currentSlideIndex`, `isTransitioning`, `slideTextures`, `shaderMaterial`, `renderer` — reaches into the page with `document.querySelector`, wires one `click` listener on `.slider` and one `resize` listener on `window`, and never expects to run twice or undo any of it. React withdraws that guarantee. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen, and the DOM committed by render is **not** rebuilt between the fake unmount and the real remount — only the effect body runs again. Call `initSlider()` from a bare `useEffect` and the second pass builds a second `WebGLRenderer` bound to the same `<canvas>`, starts a second self-scheduling render loop racing the first to draw into it, attaches a second `click` listener to `.slider` so one tap fires two `handleSlideChange()` calls — two lens-bubble tweens driving the same `shaderMaterial.uniforms.uProgress`, two text-out timelines animating the same `.char span`/`.line span` nodes — and re-runs the sequential four-texture load a second time. None of this reproduces in a production build; it only shows up on the StrictMode double-invoke or on an ordinary navigate-away-and-back, because nothing here is ever torn down.

*(1) The entry point* — The script checks `document.readyState` before deciding whether to wait for `DOMContentLoaded`. That guard exists to survive being parsed after the event has already fired in a plain document; `useEffect` already runs post-commit, so the guard and the listener are both dead weight. Drop the `if`/`else` at the bottom of the file and the `initSlider` wrapper name with it — put its body directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — `sliderElement` comes from `document.querySelector(".slider")` and `canvasElement` from `sliderElement.querySelector("canvas")`; give the component a root ref on the element rendering `.slider` and resolve both from it. Most of the other lookups in this file are already scoped correctly and need no change — `processTextElements`, `createCharacterElements` and `createLineElements` all take a `container` argument and query within it, never the document. The one that does need scoping is buried inside `animateSlideTransition`: `document.querySelector(".slider-content")`, re-run fresh on every click because the node it targets is destroyed and rebuilt each transition. Route that one through the root ref too (`rootRef.current.querySelector(".slider-content")`) — during the StrictMode remount two `.slider-content` nodes can exist for an instant, and an unscoped lookup can grab the one already mid-teardown.

*(3) Cleanup* — `gsap.registerPlugin(SplitText)` and `gsap.config({ nullTargetWarn: false })` both belong at module scope, exactly where they already sit, not inside the effect. Four other things need real attention.

Text splitting here uses two mechanisms, and only one of them is StrictMode-safe by accident. `createCharacterElements` already guards against re-splitting — it returns early once the title contains `.char` nodes — so when the double-invoke runs `setupInitialSlide()` twice against the same live `<h1>` (the DOM is not rebuilt between the two passes), the second call is a no-op and the title survives untouched. `createLineElements` has no equivalent guard: it calls `new SplitText(p, { type: "lines", … })` unconditionally every time it's invoked. Run `setupInitialSlide()` twice against the same static `.slide-description p` elements and the second `SplitText` call re-splits markup its own first pass already rewrote into `.line` divs and inner spans — the description nests one level deeper and the intro tween ends up targeting the wrong nodes. Give `createLineElements` the same reentrancy guard `createCharacterElements` already has (skip if the paragraph already contains a `.line` child) before wrapping any of this in a `gsap.context`, since the split has to be idempotent independent of how many times React decides to invoke the effect body. Every transition also calls `processTextElements`, but always against the freshly built `.slider-content` that `createSlideElement` returns, which was never split before — that path doesn't need the guard. It has a different risk: if the cancellation flag below is missing, a stray `setTimeout` firing after unmount can call `processTextElements` on a `newContent` node that was built but never attached, splitting text nobody will see and leaving an orphaned `SplitText` instance behind.

`handleSlideChange` is not part of the synchronous setup — it only runs later, from the `click` listener — so its timeline and its `uProgress` tween are created outside a `gsap.context`'s own synchronous pass and won't be auto-tracked. Register it through the context's `self`, and call it later through the returned `ctx`:

```jsx
const ctx = gsap.context((self) => {
  setupInitialSlide();
  self.add("handleSlideChange", handleSlideChange);
}, rootRef);

const onClick = () => ctx.handleSlideChange();
sliderEl.addEventListener("click", onClick);

return () => {
  sliderEl.removeEventListener("click", onClick);
  ctx.revert();
};
```

That covers the outer `gsap.timeline()` inside `animateSlideTransition` and the `gsap.fromTo(shaderMaterial.uniforms.uProgress, …)` tween in `handleSlideChange`, since both are created the instant `ctx.handleSlideChange()` runs. It does **not** cover the second timeline `animateSlideTransition` builds inside its own `.call(fn, null, …)` — that callback fires partway through the outer timeline's playback, well after the synchronous `self.add` window has closed, so the entrance timeline it constructs for the incoming slide is a fresh, untracked animation. The raw `setTimeout` nested one level deeper inside that same callback is further removed still. `ctx.revert()` correctly kills the outer timeline on unmount, but a transition that has already reached its `.call()` leaves the inner entrance timeline — and briefly the pending `setTimeout` — running against DOM nodes and a `shaderMaterial` the same cleanup may already be tearing down elsewhere. Keep an explicit `cancelled` flag the cleanup sets, check it at the top of the `.call()` callback and again inside the nested `setTimeout` before touching `newContent` or building the entrance timeline, and hold that entrance timeline in a variable the cleanup can also call `.kill()` on directly — a context's automatic tracking only reaches what a `self.add`-registered function creates in its own synchronous turn, not what that function schedules for later.

The render loop never keeps the id `requestAnimationFrame` returns — `render()` just calls `requestAnimationFrame(render)` and renders, discarding the id every time. Fix that as part of the port: store the latest id in a variable each time `render` reschedules itself, and call `cancelAnimationFrame` on that variable in the cleanup. Skip this and the StrictMode remount's first loop keeps calling `renderer.render(scene, camera)` forever, racing the second loop's renderer on the same canvas.

`initializeRenderer` is `async` and loads the four slide textures with a sequential `for…of` loop, awaiting one `THREE.TextureLoader` promise per slide before starting the next; only once all four resolve does it assign the first pair of uniforms and start the render loop. Do not make the effect callback itself `async` — call `initializeRenderer()` from inside a synchronous effect and let it run as a detached promise. Check the same `cancelled` flag on every iteration of that loop, not just once at the end: a StrictMode unmount partway through the four sequential loads must stop pushing into `slideTextures`, must not assign `uTexture1`/`uTexture2`, and must not call `render()` for the first time — each of those touches a `renderer` and a `canvas` the cleanup may already have disposed.

*(4) Rendering this in `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

`<Canvas orthographic camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1 }} gl={{ antialias: true }}>` replaces the `new THREE.Scene()` / `OrthographicCamera` / `WebGLRenderer` block outright. The full-screen quad becomes a declarative `<mesh><planeGeometry args={[2, 2]} /><shaderMaterial ref={materialRef} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} /></mesh>`, with `uniforms` built once via `useMemo` so the object identity — and therefore `uniforms.uProgress` — stays stable across renders; GSAP tweens that same object's `value` property exactly as the vanilla code does, it just reaches it through a ref instead of the module-level `shaderMaterial` variable.

The sequential `for…of` texture loop becomes `useTexture(slides.map(s => s.image))` from drei: one call, Suspense holds the tree until all four have decoded, and the manual per-iteration `cancelled` check described above becomes unnecessary for the load itself — though the `userData.size` stash doesn't come for free from `useTexture` and still has to be computed per texture from `texture.image.width`/`height` once they resolve. There is no per-frame update here beyond the `renderer.render` call the vanilla loop already makes unconditionally every frame, so a default `<Canvas>` — not `frameloop="demand"` — is the right match: this shader is meant to redraw continuously regardless of whether a transition is in flight, since the tweened uniform is what's animating it.

Resize handling moves from the manual `window` `resize` listener to a small effect on `useThree(({ size }) => size)`, writing the new width and height into `uniforms.uResolution.value` on change — `<Canvas>` already resizes the renderer and the drawing buffer for you, so only the uniform update survives the port.

A poster is mandatory: nothing paints until all four textures have decoded, and this shader draws nothing recognizable — not even a placeholder tint — before then. Render slide one's image as a plain `<img>` filling the same box the canvas occupies, and swap it out only once `useTexture`'s Suspense boundary has actually resolved and a first frame has rendered, not the instant the component mounts.

Skip drei's `Environment` regardless of preset temptation: `getLensDistortion` and `getCoverUV` are hand-written GLSL sampling two raw textures directly, and the `ShaderMaterial` reads no scene lighting at all — there is nothing for an environment map to feed. If a later variant lights the plane, use explicit lights or a self-hosted HDRI, never a `preset`, which is fetched from a third-party CDN hard-coded into drei and leaves the scene unlit the moment that host is unreachable.
