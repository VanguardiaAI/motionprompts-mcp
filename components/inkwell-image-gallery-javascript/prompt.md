# Circular Image Gallery with Cursor-Proximity Card Flips and Click-to-Preview Zoom

## Goal

Build a full-screen interactive gallery: 25 small photo cards arranged in a perfect circle. As the cursor moves, nearby cards flip over (180° on rotationY), scale up and push radially outward with smooth lerp interpolation, while the whole ring tilts in 3D toward the mouse (parallax). Clicking a card spins and scales the entire ring 5x so the clicked image fills the view like a full-screen preview, and its title animates in word-by-word with SplitText. Clicking anywhere (or pressing Escape) reverses everything back to the ring.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `SplitText` (`import SplitText from "gsap/SplitText"`, then `gsap.registerPlugin(SplitText)`). No ScrollTrigger, no smooth-scroll library — the page never scrolls. Keep the image data in a separate `collection.js` module that default-exports an array of `{ title, img }` objects (20 entries).

## Layout / HTML

- `<nav>`: an `<a>` with the brand text "Silhouette Stock" on the left and a `<p>` "Download Assets" on the right.
- `<div class="container">` wrapping:
  - `<div class="gallery-container">` → `<div class="gallery">` (empty — the 25 `.card` elements are created in JS; each card contains one `<img>`).
  - `<div class="title-container">` (empty — the preview title `<p>` is created/removed in JS).
- `<footer>`: two `<p>` elements, "Experiment 454" and "Made by Motionprompts".
- `<script type="module" src="./script.js">` at the end of `<body>`.

## Styling

- Global reset (`* { margin:0; padding:0; box-sizing:border-box }`).
- `body` background: `#e3e3db` (warm off-white/bone).
- `a, p`: color `#1f1f1f`, font-family "Suisse Intl" (fall back to a clean grotesque sans-serif), `font-size: 15px`, `font-weight: 600`, `line-height: 1`, `letter-spacing: -0.02rem`, no text decoration.
- `img`: `width/height: 100%`, `object-fit: cover`, `backface-visibility: hidden` (so the image disappears when its card flips past 90°, showing "the back").
- `nav` and `footer`: `position: absolute` (nav `top: 0`, footer `bottom: 0`), `left: 0`, `width: 100vw`, `padding: 2em`, flex row with `justify-content: space-between`, `align-items: center`, `z-index: 2`.
- `.container`: `position: relative`, `width: 100vw`, `height: 100svh`, `overflow: hidden`.
- `.gallery-container`: `position: relative`, `width/height: 100%`, flex centering, `transform-style: preserve-3d`, `perspective: 2000px`, `will-change: transform`. This is the element that receives the parallax tilt.
- `.gallery`: `position: relative`, `width: 600px`, `height: 600px`, flex centering, `transform-origin: center`, `will-change: transform`. This is the element that spins/scales on preview.
- `.card`: `position: absolute`, `width: 45px`, `height: 60px`, `border-radius: 4px`, `transform-origin: center`, `transform-style: preserve-3d`, `backface-visibility: visible`, `overflow: hidden`, `will-change: transform`. All 25 cards start stacked at the center of `.gallery`; GSAP moves them onto the ring.
- `.title-container`: `position: fixed`, `bottom: 25%`, `left: 50%`, `transform: translate(-50%, -50%)`, `width: 100%`, `height: 42px`, `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%)` — acts as an overflow mask for the word reveal.
- `.title-container p`: `position: absolute`, `width: 100%`, `text-align: center`, `font-size: 36px`, `letter-spacing: -0.05rem`.
- `.word` (SplitText word wrapper class): `position: relative`, `display: inline-block`, `will-change: transform`.

## GSAP effect (be precise)

Everything runs inside `DOMContentLoaded`. Keep this config object:

```
imageCount: 25, radius: 275, sensitivity: 500, effectFalloff: 250,
cardMoveAmount: 50, lerpFactor: 0.15, isMobile: window.innerWidth < 1000
```

State: three booleans — `isPreviewActive`, `isTransitioning`, plus `currentTitle` (the active title `<p>` or null). A `parallaxState` object holds `targetX/targetY/targetZ` and `currentX/currentY/currentZ` (all start at 0). A `transformState` array holds, per card: `currentRotation/targetRotation` (0), `currentX/targetX/currentY/targetY` (0), `currentScale/targetScale` (1), and the card's ring `angle`.

### 1. Ring construction (on load)

For each of the 25 cards, index `i`:
- `angle = (i / 25) * Math.PI * 2`; base position `x = 275 * cos(angle)`, `y = 275 * sin(angle)`.
- The card's image and title come from the 20-item collection using `i % 20` (so 5 images repeat). Store `data-index = i` and `data-title` on the card.
- `gsap.set(card, { x, y, rotation: angle * 180 / Math.PI + 90, transformPerspective: 800, transformOrigin: "center center" })` — the `+90°` makes every card stand perpendicular to the circle, like ticks on a clock face.
- Attach a click handler on the card: if no preview is active and not transitioning, open the preview for that index and `e.stopPropagation()` (so the document-level close handler doesn't fire immediately).

### 2. Mouse-proximity flip + parallax (mousemove on document)

Ignored while `isPreviewActive`, `isTransitioning`, or on mobile (`innerWidth < 1000`). On each mousemove:
- Normalize cursor to viewport center: `percentX = (clientX - centerX) / centerX`, `percentY = (clientY - centerY) / centerY` (each in −1…1).
- Parallax targets for the whole container: `targetY = percentX * 15` (rotateY, deg), `targetX = -percentY * 15` (rotateX, deg), `targetZ = (percentX + percentY) * 5` (z rotation, deg).
- Per card: measure the distance from the cursor to the card's center (`getBoundingClientRect`). If `distance < 500` (sensitivity):
  - `flipFactor = Math.max(0, 1 - distance / 250)` (effectFalloff — so the effect only really kicks in inside 250px and maxes at 1 on top of the card).
  - `targetRotation = 180 * flipFactor` (rotationY flip, deg).
  - `targetScale = 1 + 0.3 * flipFactor` (up to 1.3).
  - `targetX = 50 * flipFactor * cos(angle)`, `targetY = 50 * flipFactor * sin(angle)` — pushes the card radially outward up to 50px (cardMoveAmount).
  - Otherwise all four targets reset to `0 / 1 / 0 / 0`.

Also listen for `mouseout` to `<html>`/window (when `e.relatedTarget` is null or `HTML`): if idle (no preview, not transitioning), reset every card's targets and the parallax targets to neutral.

### 3. Per-frame lerp loop (requestAnimationFrame, runs forever)

Each frame, only when `!isPreviewActive && !isTransitioning`:
- Lerp parallax: `current += (target - current) * 0.15` for X, Y, Z; then `gsap.set(galleryContainer, { rotateX: currentX, rotateY: currentY, rotation: currentZ, transformOrigin: "center center" })`.
- For each card, lerp `currentRotation`, `currentScale`, `currentX`, `currentY` toward their targets with the same 0.15 factor, then:
  `gsap.set(card, { x: baseX + currentX, y: baseY + currentY, rotationY: currentRotation, scale: currentScale, rotation: angleDeg + 90, transformOrigin: "center center", transformPerspective: 1000 })`
  where `baseX/baseY` are the ring coordinates recomputed from `radius` and `angle`.

### 4. Click-to-preview (togglePreview)

Set `isPreviewActive = true`, `isTransitioning = true`. Compute how far the ring must rotate so the clicked card lands at the "12 o'clock" position: `rotationRadians = (3π/2) - cardAngle`, normalized into (−π, π] (add/subtract 2π if outside). Reset every card's transformState (targets and currents) to neutral. Then three simultaneous animations:

1. **Gallery zoom** — `gsap.to(gallery, { scale: 5, y: 1300, rotation: rotationRadians * 180/π + 360, duration: 2, ease: "power4.inOut" })` (the extra +360° adds a full spin during the zoom). `onComplete: isTransitioning = false`. In its `onStart`, tween every card back to its exact base ring position: `{ x: baseX, y: baseY, rotationY: 0, scale: 1, duration: 1.25, ease: "power4.out" }` (un-flips any hovered cards while the ring zooms).
2. **Parallax settle** — `gsap.to(parallaxState, { currentX: 0, currentY: 0, currentZ: 0, duration: 0.5, ease: "power2.out" })` with an `onUpdate` that applies the values to `galleryContainer` via `gsap.set` (the rAF loop is paused by the flags, so this tween drives the container back to level).
3. **Title reveal** — create a `<p>` with the card's `data-title`, append to `.title-container`, keep a reference in `currentTitle`. `new SplitText(p, { type: "words", wordsClass: "word" })`; `gsap.set(words, { y: "125%" })` then `gsap.to(words, { y: "0%", duration: 0.75, delay: 1.25, stagger: 0.1, ease: "power4.out" })` — words slide up from below the clip-path mask just as the zoom finishes.

### 5. Close / reset (document click while preview is active, or Escape key)

Guard with `isTransitioning`. Set `isTransitioning = true`, then:
- Title exit: `gsap.to(words, { y: "-125%", duration: 0.75, delay: 0.5, stagger: 0.1, ease: "power4.out" })`, removing the `<p>` and clearing `currentTitle` on complete (words exit upward through the mask).
- Gallery return: `gsap.to(gallery, { scale: <responsive scale>, x: 0, y: 0, rotation: 0, duration: 2.5, ease: "power4.inOut" })`. On complete: `isPreviewActive = isTransitioning = false` and zero out the whole parallaxState.

### 6. Resize handling

On `resize` (and once on load): recompute `isMobile` (`< 1000`), and `gsap.set` the gallery scale responsively — `0.6` below 768px, `0.8` below 1200px, `1` otherwise. If no preview is active, also reset all parallax and card transform state to neutral. The reset tween in step 5 must use this same responsive scale as its target.

## Assets / images

20 unique moody, stylized portrait/silhouette photographs (dramatic lighting, monochrome and duotone tones), portrait orientation 3:4 (cards are 45×60px). They fill the 25 cards cyclically (`i % 20`). Each has a short two-word evocative title shown in the preview. Use this collection (title → one image each):

"Shadow Profile", "Crimson Silhouette", "Wavelength", "Noir Figure", "Midnight Gaze", "Cobalt Contrast", "Half-Light", "Scarlet Frame", "Pale Vision", "Spectral Form", "Monochrome Motion", "Platinum Edge", "Electric Shade", "Veiled Light", "Luminous Dark", "Haze Portrait", "Glowing Contour", "Dark Elegance", "Ruby Accent", "Clear Gaze".

## Behavior notes

- The hover flip/parallax is desktop-only (`window.innerWidth < 1000` disables it); the ring still renders and the click-to-preview still works on mobile, just scaled down (0.6 / 0.8).
- Cards ignore clicks while a preview is open or a transition is running; the document-level click closes the preview only when it's fully open.
- The rAF loop never stops — it simply skips its work while previewing/transitioning, so hover interactivity resumes seamlessly after closing.
- `backface-visibility: hidden` on the `<img>` plus `transformPerspective` on the cards is what makes the 180° flip read as a real card flip (blank back).
- No page scroll, no ScrollTrigger; everything is driven by mousemove, click, Escape and rAF.

## Images

This component ships with 20 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/inkwell-image-gallery-javascript/img1.jpeg
https://motionprompts.dev/c/inkwell-image-gallery-javascript/img10.jpeg
https://motionprompts.dev/c/inkwell-image-gallery-javascript/img11.jpeg
https://motionprompts.dev/c/inkwell-image-gallery-javascript/img12.jpeg
https://motionprompts.dev/c/inkwell-image-gallery-javascript/img13.jpeg
https://motionprompts.dev/c/inkwell-image-gallery-javascript/img14.jpeg
… 14 more under https://motionprompts.dev/c/inkwell-image-gallery-javascript/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--bone`, `--muted`, `--amber`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: `mount(cfg)` builds 25 card elements by hand, wires four `document`-level listeners and one on `window`, and starts a `requestAnimationFrame` loop that runs for the life of the page. React withdraws all of that at once, and it does it quietly — the ring keeps spinning, right up until the moment two copies of it start fighting over the same DOM.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. If the imperative card-building loop survives the port unchanged, a double-mount without cleanup appends a second batch of 25 `.card` elements into `.gallery` on top of the first — fifty cards, not twenty-five, each pair sharing the same ring position. Even with cleanup wired up, the failure mode during the brief window both mounts coexist is a doubled `animate()` loop: two independent closures, each with its own `parallaxState` and `transformState` arrays, both reading the same `mousemove` events and both calling `gsap.set` on the same `galleryContainer` and the same 25 cards every frame. The two loops converge toward the same lerp targets but never agree on the intermediate values, so what you see is flicker or a faint double-image jitter on every hover, not a hard crash — the kind of bug that is easy to dismiss as "GPU stutter" instead of tracing back to a missing cleanup. None of this reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The bootstrap at the bottom of the file checks `window.MP` for this catalogue's own tuning harness, and otherwise guards `DOMContentLoaded` behind `document.readyState`. Neither has a place in a shipped component: there is no `window.MP` outside this repo's editor, and `useEffect` already runs after `.gallery`/`.gallery-container`/`.title-container` have committed. Delete the whole `if (window.MP...) / else` block and the `boot` wrapper, and move the body of `mount(cfg)` into a `useEffect` with an empty dependency array. `DEFAULTS` — `imageCount`, `radius`, `sensitivity`, `effectFalloff`, `cardMoveAmount`, `lerpFactor` — stops being a config object an external editor hands to `mount`; read those as local constants inside the effect, or lift the ones a host app actually needs to vary into props. `isMobile` stays computed from `window.innerWidth` at effect time, same as today — it is a viewport read, not a knob.

*(2) Element lookups and the card ring* — The three `document.querySelector` calls for `.gallery`, `.gallery-container` and `.title-container` assume this component owns the page; give it a root ref and resolve all three from it instead. More consequential: the 25-card loop (`document.createElement("div")`, set `dataset.index`/`dataset.title`, append an `<img>`, `gsap.set` the ring position, push into `cards`/`transformState`, attach a click listener) is exactly the imperative construction that produces the fifty-card doubling described above. Move it out of the effect entirely — render the 25 cards as JSX, mapping over `collection` with `i % 20` for the cycled image and index/title as ordinary props instead of `dataset` reads, so React's declarative render (immune to StrictMode's effect double-invoke) owns creation and removal of the nodes. Collect each card's DOM node into a ref array via its `ref` callback, and have the effect do only what still has to run imperatively: the initial per-card `gsap.set` of `x`/`y`/`rotation`/`transformPerspective` onto that ref array (so the ring doesn't flash stacked-at-center for one frame before the rAF loop's first tick paints it), and wiring each card's click to open the preview.

*(3) Cleanup* — Four different things accumulate state here on four different schedules, and `ctx.revert()` alone does not reach all of them.

**Mutable state.** `isPreviewActive`, `isTransitioning`, `currentTitle`, the `frame` handle, and the `parallaxState`/`transformState` structures are read and written up to sixty times a second by the rAF loop and synchronously by every pointer/keyboard listener. None of them should become `useState` — a state update on every frame would both re-render for no visual reason `useState` doesn't already handle via direct DOM writes, and reintroduce exactly the two-independent-copies problem StrictMode is designed to surface. Keep them in refs, scoped inside the same effect that creates them.

**GSAP and the two functions that fire late.** `togglePreview` and `resetGallery` don't run during the effect's synchronous setup — they run later, from a card click, a document click, or Escape. A `gsap.context` that only wraps listener registration tracks nothing, because nothing runs synchronously inside its factory. Register both as named context methods and call those from the listeners instead:

```jsx
const ctx = gsap.context((self) => {
  self.add("togglePreview", (index) => { /* the zoom tween, the parallax settle tween, the title split and its entrance tween */ });
  self.add("resetGallery", () => { /* the word exit tween, the return-to-ring tween */ });
}, rootRef);
card.addEventListener("click", () => ctx.togglePreview(index));
```

This closes a real gap in the current `destroy()`: its `gsap.killTweensOf([gallery, galleryContainer, parallaxState, ...cards])` list never mentions the title's `.word` spans, so a tween interrupted mid-reveal or mid-exit is left running against a node `currentTitle.remove()` has already detached. Route the entrance and exit tweens through `ctx.togglePreview`/`ctx.resetGallery` and `ctx.revert()` catches them along with everything else.

It does not catch two other things, though, and both matter here. First, the 25 "un-flip" tweens created inside the zoom tween's `onStart` callback fire on a later tick, once GSAP's ticker actually starts that tween — by then the synchronous call to `ctx.togglePreview()` has long since returned, so those 25 tweens are never registered with the context at all. Second, the rAF loop's `gsap.set` calls on `galleryContainer` and every card run on their own later ticks too, entirely outside any `ctx.add()` invocation. Neither category is a tween `ctx.revert()` knows to kill or a style it knows to restore. Keep the explicit `gsap.killTweensOf` targeting the card refs, and follow it with `clearProps` on `galleryContainer`, `gallery`, and every card — the original script already does this for `gallery`/`galleryContainer` in its `destroy()`; extend it to the cards now that they're JSX-rendered and persist across mounts instead of being thrown away with `card.remove()`.

**The rAF loop.** Keep the exact handle `requestAnimationFrame(animate)` returns in a ref and `cancelAnimationFrame` it in the cleanup — the loop already checks `isPreviewActive`/`isTransitioning` before doing any work each tick, but a cancelled loop is still one that stops scheduling itself, which an untouched flag check does not do.

**The document/window listeners.** `onDocumentClick`, `onKeyDown`, `onMouseMove` and `onMouseOut` on `document`, plus `handleResize` on `window`, are already named function references removed with matching `removeEventListener` calls — that part carries over unchanged. What changes is what they call: route the click and keydown handlers through `ctx.resetGallery()` and the card click through `ctx.togglePreview(index)` rather than calling the plain functions directly, so every animation those interactions produce, on every mount, stays inside the one context this effect owns.

The `SplitText` call itself needs one more piece the family's usual caution doesn't quite cover: this component doesn't split a persistent heading once at mount, it builds a fresh `<p>` and splits it fresh on every `togglePreview` call, so the double-split failure (running `SplitText` twice over already-split output) can't happen here by construction — there's no persistent element to hit twice. What can happen is unmounting while a preview is open: hold onto the `SplitText` instance itself (not just its `words`) inside the `togglePreview` closure, and call `.revert()` on it before `currentTitle.remove()` in the cleanup, rather than relying on the node's removal to make the split spans go away implicitly. It's a cheap habit, and it stops the split's internal bookkeeping from ever pointing at a node the removal already discarded. Font-readiness matters less here than it does for a hero headline split at mount — this split only ever runs well after the page (and its "Suisse Intl" custom face) has had time to settle — but if this component is dropped into a shell that loads fonts lazily, gate the very first `togglePreview` behind `document.fonts.ready` the same way, guarded by the standard cancellation flag.
