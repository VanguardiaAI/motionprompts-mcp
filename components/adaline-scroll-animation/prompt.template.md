---
slug: adaline-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Adaline-Style Scroll Animation (Canvas Image-Sequence Hero)

## Goal
Build a cinematic landing hero where a **104-frame image sequence plays back frame-by-frame on a full-viewport `<canvas>`, driven entirely by scroll**. The hero section is **pinned for 7 viewport-heights** of scrolling; as the user scrolls, a single ScrollTrigger's `onUpdate` maps progress to (1) the current video frame drawn on canvas, (2) a fade-out of the fixed nav, (3) the headline block being **pushed away on the Z axis** (`translateZ` 0 → −500px) while fading, and (4) a product-dashboard mockup that **flies in from deep 3D space** (`translateZ(1000px)` → `0`) and lands centered as the sequence ends. A plain outro section follows. Scroll is smoothed with Lenis.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin, plus **`lenis`** for smooth scrolling:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```
Everything runs inside a `DOMContentLoaded` listener. Register ScrollTrigger, then wire Lenis the standard way:
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
No timelines and no tweens — the whole effect is **one `ScrollTrigger.create()` whose `onUpdate` writes absolute states with `gsap.set`** plus manual canvas drawing.

## Layout / HTML
```html
<body>
  <nav>
    <div class="nav-links">
      <a href="#">Overview</a><a href="#">Solutions</a><a href="#">Resources</a>
    </div>
    <div class="logo"><a href="#"><img src="(logo)" alt=""> Byewind</a></div>
    <div class="nav-buttons">
      <div class="btn primary"><a href="#">Live Demo</a></div>
      <div class="btn secondary"><a href="#">Get Started</a></div>
    </div>
  </nav>

  <section class="hero">
    <canvas></canvas>
    <div class="hero-content">
      <div class="header">
        <h1>One unified workspace to build, test, and ship AI faster</h1>
        <p>Trusted by</p>
        <div class="client-logos">
          <div class="client-logo"><img src="(client-logo-1)" alt=""></div>
          <div class="client-logo"><img src="(client-logo-2)" alt=""></div>
          <div class="client-logo"><img src="(client-logo-3)" alt=""></div>
          <div class="client-logo"><img src="(client-logo-4)" alt=""></div>
        </div>
      </div>
    </div>
    <div class="hero-img-container">
      <div class="hero-img"><img src="(dashboard)" alt=""></div>
    </div>
  </section>

  <section class="outro">
    <h1>Join teams building faster with Byewind.</h1>
  </section>
  <script type="module" src="./script.js"></script>
</body>
```
The class names `.hero`, `.header`, `.hero-img`, plus the bare `nav` and `canvas` elements are what the JS queries — keep them exact.

## Styling
Google Fonts: **"DM Mono"** (300/400/500 + italics) and **"Host Grotesk"** (variable 300–800). Palette via CSS variables: `--fg: #241910` (near-black warm brown), `--bg: #fefbf4` (warm off-white cream).

- Global reset `* { margin:0; padding:0; box-sizing:border-box; }`. `body { font-family:"DM Mono", monospace; }`. `img { width:100%; height:100%; object-fit:cover; }`.
- `h1 { font-family:"Host Grotesk"; font-size:3rem; font-weight:400; line-height:1.1; }`.
- `p` and `a`: `text-transform:uppercase; font-size:0.8rem; font-weight:500;` — links `color:var(--fg); text-decoration:none;`.
- `.btn { padding:0.75rem 1.5rem; border-radius:0.25rem; }` — `.primary` has `background:var(--bg)` with `--fg` text; `.secondary` is inverted (`background:var(--fg)`, `--bg` text).
- `nav`: `position:fixed; width:100vw; padding:1.5rem 2rem; display:flex; align-items:center; gap:2rem; z-index:2; will-change:opacity;` — each of its three direct children gets `flex:1` so the logo sits dead-center. `.nav-links { display:flex; gap:3rem; }`; `.logo` centers its content, logo img `width:2rem`, logo text is Host Grotesk `1.5rem` with `text-transform:none`; `.nav-buttons { display:flex; gap:1.5rem; justify-content:flex-end; }`.
- Every `section`: `position:relative; width:100vw; height:100svh; overflow:hidden;`.
- `.outro`: flex-centered text, `padding:2rem`, `background:var(--bg)`, `color:var(--fg)`.
- `canvas { width:100%; height:100%; object-fit:cover; }` — fills the hero.
- `.hero-content`: `position:absolute; top:25%; left:50%; transform:translateX(-50%); transform-style:preserve-3d; perspective:1000px; padding:0.5rem 0;` — **this `perspective` is the camera for the headline's Z push; do not omit it.**
- `.header`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100vw;` flex column, centered, `gap:1.5rem; text-align:center; color:var(--fg); transform-origin:center; will-change:transform,opacity;`. Its `h1` is `width:50%; margin-bottom:0.5rem;`; its `p` has `opacity:0.35`.
- `.client-logos`: `width:30%; display:flex; gap:0.5rem;` — each `.client-logo` is `flex:1`, its img `object-fit:contain`.
- `.hero-img-container`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:50%; transform-style:preserve-3d; perspective:1000px;` — the camera for the mockup fly-in.
- `.hero-img`: `position:relative; width:100%; height:100%;` with **initial state in CSS: `transform:translateZ(1000px); opacity:0;`** and `will-change:transform,opacity;` — it must start invisible and deep behind the camera even before JS runs.
- `@media (max-width:1000px)`: `h1 { font-size:2rem; }`, hide `.nav-links` and `.nav-buttons`, and give `.header h1`, `.client-logos`, `.hero-img-container` a width of `calc(100% - 4rem)`.

## GSAP effect (the important part — be exhaustive)

### 1. Hi-DPI canvas setup
```js
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const setCanvasSize = () => {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * pixelRatio;
  canvas.height = window.innerHeight * pixelRatio;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  context.scale(pixelRatio, pixelRatio);
};
setCanvasSize();
```

### 2. Frame loading — a moving window, not a gate

- `const frameCount = 104;` frames live in a `frames/` folder named `frame_0001.jpg` … `frame_0104.jpg` (index + 1, zero-padded to 4 digits).
- Keep the current frame in an object: `let videoFrames = { frame: 0 };`.
- **Do not create all the `Image` objects at once, and do not wait for all of them before drawing.** The obvious version of this effect — 200-odd `new Image()` in a loop, a countdown, `render()` and `setupScrollTrigger()` only when the counter hits zero — is what makes these hero sequences notorious: the browser opens every connection it has for frames nobody is looking at yet, everything else on the page queues behind them, and the hero stays blank until the *last* frame lands. Load them **in order, through a window of six**, and start as soon as you have a handful:

```js
const images = new Array(frameCount);
const LOAD_WINDOW = 6;   // concurrent downloads
const START_AFTER = 10;  // frames in hand before the ScrollTrigger is created
let nextFrame = 0, loadedCount = 0, started = false;

const loadNext = () => {
  if (nextFrame >= frameCount) return;
  const i = nextFrame++;
  const img = new Image();
  const settled = () => {                  // bound to onload AND onerror
    loadedCount++;
    if (i === 0) render();                 // first frame paints as soon as it exists
    if (!started && loadedCount >= Math.min(START_AFTER, frameCount)) {
      started = true;
      setupScrollTrigger();
    }
    loadNext();                            // the chain feeds itself
  };
  img.onload = settled;
  img.onerror = settled;
  img.src = currentFrame(i);
  images[i] = img;
};
for (let i = 0; i < LOAD_WINDOW; i++) loadNext();
```

  The scrub can now outrun the download, which is fine as long as `render()` degrades (next section). `onerror` must run the same handler as `onload` or one missing file stalls the whole chain.

### 3. `render()` — manual cover-fit draw
Each call clears the canvas (`clearRect` over `innerWidth × innerHeight` — CSS pixels, since the context is scaled) and draws the current frame with **aspect-ratio cover math**.

Because frames arrive progressively, don't reach for `images[videoFrames.frame]` directly: **walk backwards from the target to the last frame that actually loaded** (`img.complete && img.naturalWidth > 0`) and draw that one. A scrub that outruns the download then freezes for an instant on the previous frame instead of flashing an empty canvas.

```js
let img = null;
for (let k = videoFrames.frame; k >= 0; k--) {
  const c = images[k];
  if (c && c.complete && c.naturalWidth > 0) { img = c; break; }
}
if (img) { /* cover math + drawImage */ }
```

The cover math:
- `imageAspect = naturalWidth / naturalHeight`, `canvasAspect = innerWidth / innerHeight`.
- If `imageAspect > canvasAspect`: `drawHeight = canvasHeight; drawWidth = drawHeight * imageAspect; drawX = (canvasWidth - drawWidth) / 2; drawY = 0;`
- Else: `drawWidth = canvasWidth; drawHeight = drawWidth / imageAspect; drawX = 0; drawY = (canvasHeight - drawHeight) / 2;`
- `context.drawImage(img, drawX, drawY, drawWidth, drawHeight)`.

### 4. The single ScrollTrigger
```js
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${window.innerHeight * 7}px`,  // 7 viewport-heights of pinned scroll
  pin: true,
  pinSpacing: true,
  scrub: 1,                               // 1s catch-up smoothing
  onUpdate: (self) => { /* everything below */ },
});
```
All animation lives in `onUpdate`, reading `progress = self.progress` (0 → 1 across the whole pinned distance) and writing **absolute states with `gsap.set`** — there are no eases or durations anywhere; every ramp is a linear function of progress, and the softness comes from `scrub: 1` + Lenis inertia.

**Phase A — video scrub (0 → 0.9):**
```js
const animationProgress = Math.min(progress / 0.9, 1);
const targetFrame = Math.round(animationProgress * (frameCount - 1));
videoFrames.frame = targetFrame;
render();
```
The full 104-frame sequence completes at 90% of the pin; the last 10% of scroll holds the final frame.

**Phase B — nav fade (0 → 0.1):** while `progress <= 0.1`, `opacity = 1 - progress / 0.1` (linear 1 → 0 across the first tenth); past 0.1, hard-set `gsap.set(nav, { opacity: 0 })`.

**Phase C — headline Z push + fade (0 → 0.25):** while `progress <= 0.25`:
- `translateZ = (progress / 0.25) * -500` — the header recedes linearly from 0 to **−500px**.
- Opacity stays `1` until `progress = 0.2`, then fades linearly 1 → 0 over **0.2 → 0.25** (`opacity = 1 - (progress - 0.2) / 0.05`, clamped).
- Apply via a full transform string so the centering survives: `gsap.set(header, { transform: \`translate(-50%, -50%) translateZ(${translateZ}px)\`, opacity })`.
- Past 0.25, just `gsap.set(header, { opacity: 0 })`.

**Phase D — dashboard fly-in (0.6 → 0.9):** three branches on `.hero-img`:
- `progress < 0.6`: hold the rest state `transform: "translateZ(1000px)", opacity: 0`.
- `0.6 ≤ progress ≤ 0.9`: `imgProgress = (progress - 0.6) / 0.3`; `translateZ = 1000 - imgProgress * 1000` (1000px → 0, linear). Opacity ramps 0 → 1 **faster than the Z travel**: `opacity = (progress - 0.6) / 0.2` while `progress ≤ 0.8`, then `1` from 0.8 to 0.9 (so the mockup is fully opaque for the last third of its flight). Set `transform: \`translateZ(${translateZ}px)\`` and the opacity.
- `progress > 0.9`: lock `transform: "translateZ(0px)", opacity: 1`.

Because the parent containers carry `perspective: 1000px`, the mockup starting at `translateZ(1000px)` sits exactly at the camera plane — it materializes huge/at-lens and settles back to its natural 50%-width size, a "flying in from your face" landing.

### 5. Resize
```js
window.addEventListener("resize", () => { setCanvasSize(); render(); ScrollTrigger.refresh(); });
```

## Assets / images
- **104-frame JPG image sequence, 16:9 landscape** in `frames/frame_0001.jpg` … `frame_0104.jpg` — consecutive frames of one slow, continuous cinematic camera move (the original is a gentle aerial drift over rolling desert sand dunes under a pale hazy sky: warm sand tones that harmonize with the cream/brown palette). Any smooth ambient footage exported as sequential JPGs works; the key is that adjacent frames differ only slightly so the scrub reads as video.
  **Export them for the web, not for an editor.** This is the single heaviest thing on the page and the easiest place to ship 30 MB by accident: the demo's frames are **1440px wide at JPEG q74, ~40 KB each, 4.1 MB for the whole sequence**. Two levers, in this order — halve the frame count before you touch quality (a scrubbed sequence over seven viewport-heights reads as smooth at ~100 frames; 200+ is invisible extra weight), then cap the width at 1440. Exporting at 4K, or at one frame per source frame, is what turns a hero into a 30-second wait.
- **1 product-dashboard screenshot, landscape ≈3:2** — a clean SaaS analytics/dashboard UI mockup; it is the element that flies in from deep Z.
- **1 small square logo mark** (~2rem display size) for the nav brand.
- **4 monochrome client wordmark logos, wide landscape, transparent background** — the "Trusted by" row, each `object-fit:contain` in an equal flex column.

Use the neutral brand name "Byewind" — no real company names.

## Behavior notes
- Total scroll distance for the hero is `7 × innerHeight` of pin spacing, then the outro section scrolls in normally.
- The nav is `position:fixed` and only reappears if the user scrolls back up (its opacity is progress-driven, fully reversible — as is everything, since the whole effect is scrub-based `gsap.set` writes).
- The canvas paints as soon as frame 1 lands and the ScrollTrigger appears once ten frames are in; the rest of the sequence keeps loading underneath. Scrolling fast on a cold cache holds the last loaded frame for a moment — that is the intended degradation, not a bug.
- `scrub: 1` plus Lenis gives the floaty, damped feel — don't use `scrub: true`.
- Mobile (≤1000px): nav links/buttons hidden, headline/logos/mockup widen to `calc(100% - 4rem)`; the effect itself runs unchanged. Sections use `100svh` so mobile browser chrome doesn't clip.
- No SplitText, no CustomEase, no Three.js, no reduced-motion branch in the original.

## Images

This component ships with 106 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/adaline-scroll-animation/caravan.jpg
https://motionprompts.dev/c/adaline-scroll-animation/frames/frame_0001.jpg
https://motionprompts.dev/c/adaline-scroll-animation/frames/frame_0002.jpg
https://motionprompts.dev/c/adaline-scroll-animation/frames/frame_0003.jpg
https://motionprompts.dev/c/adaline-scroll-animation/frames/frame_0004.jpg
https://motionprompts.dev/c/adaline-scroll-animation/frames/frame_0005.jpg
… 100 more under https://motionprompts.dev/c/adaline-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--sienna`, `--stone`, `--haze`, `--dusk`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a single script that waits for `DOMContentLoaded`, reaches into the page with `document.querySelector` for `nav`, `.header`, `.hero-img` and the bare `canvas`, streams in 104 frame images, wires the one `ScrollTrigger` that pins `.hero` for seven viewport-heights and drives the canvas scrub, the nav fade, the headline's Z-push and the dashboard fly-in from a single `onUpdate`. React withdraws all three of those guarantees — the ready-made document, the free run of an unscoped selector, the license to never tear anything down — and it does it quietly: the hero renders and scrubs correctly on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component accumulates more live state than most before that first unmount can land: a `Lenis` instance, a `gsap.ticker` callback pumping it every frame, one pinned `ScrollTrigger`, a `resize` listener, and a self-feeding chain of `Image` loads that keeps requesting frames after the fact. A double mount that doesn't undo all of it leaves two `Lenis` instances fighting over the same wheel event, a ticker calling into the one you just destroyed, and two `ScrollTrigger`s pinning the same `.hero` with disagreeing scrub state. None of this reproduces in a production build — React only double-invokes in development — so treat the teardown below as load-bearing, not optional.

*(1) The entry point* — the whole effect is wrapped in `document.addEventListener("DOMContentLoaded", ...)`. By the time a React component mounts, `DOMContentLoaded` has already fired, so that listener is registered and never called: the canvas never gets a first frame, the images never start loading, no `ScrollTrigger` ever exists. Delete the listener and move its entire body — plugin registration, the Lenis wiring, `setCanvasSize`, the frame-loading chain, `setupScrollTrigger`, and the `resize` listener — directly into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can stay at module scope instead; re-registering on every mount is harmless but pointless.

*(2) Element lookups* — `document.querySelector("nav")`, `.header`, `.hero-img` and the bare `canvas` each assume there is exactly one match in the whole document. Put a root ref on the element that wraps `nav`, `.hero` and `.outro`, and scope all four lookups to it (`root.querySelector(".header")`, and so on) — or better, put a dedicated ref directly on the `<canvas>`, since the effect also needs its 2D context, and reserve scoped `querySelector` calls for `nav`, `.header` and `.hero-img`. During the StrictMode remount two copies of this markup exist for an instant, and an unscoped lookup can bind to the copy that is already on its way out — `gsap.set` then spends the rest of the scroll writing `transform` and `opacity` to a detached node every time `onUpdate` fires.

*(3) Cleanup* — wrap the effect body in a `gsap.context` scoped to the root ref and revert it on cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis setup, canvas sizing, image preload, setupScrollTrigger, resize listener
  }, rootRef);
  return () => ctx.revert();
}, []);
```

The pin is what makes this matter here specifically: `ScrollTrigger.create({ pin: true, pinSpacing: true, ... })` inserts a pin-spacer element around `.hero` and rewrites `.hero`'s own inline styles for the length of the seven-viewport-height scroll. `ctx.revert()` is what removes that spacer and restores the original styles — skip it and a remount leaves an orphaned spacer in the DOM plus a second pinned trigger disagreeing with the first about the current scrub frame.

`ctx.revert()` does **not** reach `gsap.ticker.add((time) => lenis.raf(time * 1000))` — a ticker subscription is neither a tween nor a trigger, so the context never records it, and this is exactly the case the ticker matters most: that callback is what drives Lenis's own frame loop. Keep the function reference and remove it explicitly, before destroying Lenis:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

Get the order wrong — destroy `lenis` while `onTick` is still registered — and any ticker frame that lands between the two calls invokes `.raf()` on an instance that no longer exists.

Lenis itself is a document-level resource, not this section's alone. If this hero ships as one section of a larger app, lift the `new Lenis()` call to the app shell and have this effect subscribe `lenis.on("scroll", ScrollTrigger.update)` on the shared instance instead of constructing a second one. If the hero genuinely owns scroll for the whole page, construct it inside the effect as shown and destroy it in the cleanup above.

The other thing this effect can't finish synchronously is the frame loading: the chain keeps creating `Image` objects until all 104 are in, and `setupScrollTrigger()` fires from inside one of those callbacks. That whole sequence is real elapsed time — seconds on a slow network — and a StrictMode unmount, or a genuine navigation away, lands squarely inside it. Guard the chain with a cancellation flag the same way you would an unresolved promise, and check it in **both** places: before creating the trigger, and before queueing the next download.

```jsx
let cancelled = false;
// first line of the shared `settled` handler:
if (cancelled) return;   // no draw, no trigger, no next request
// cleanup:
return () => {
  cancelled = true;
  gsap.ticker.remove(onTick);
  lenis.destroy();
  ctx.revert();
};
```

Without the flag the chain outlives the component: it keeps pulling frames for a canvas nobody will see, and calls `setupScrollTrigger()` against a `.hero` that may already be gone — or, if this was only the StrictMode remount and the node is still there, they pin it a second time, stacked on top of the trigger the live effect's own call to `setupScrollTrigger()` is about to create.

Finally, `window.addEventListener("resize", ...)` is registered with an inline arrow function, so there is nothing to hand `removeEventListener` unless you name it first. Declare it inside the same effect and remove it in the same cleanup — it calls `setCanvasSize()`, `render()` and `ScrollTrigger.refresh()`, all three of which are meaningless once the canvas ref and the trigger are gone.
