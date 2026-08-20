---
slug: vucko-scroll-animation-javascript
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Scroll-Grow Showreel Video Reveal (Scrub + Mouse Parallax)

## Goal
Build a minimal editorial landing page where a **tiny video-preview thumbnail (scaled to 0.25, pulled up above its section) grows into a full-width 16:9 showreel as the intro section scrolls into view**. A GSAP ScrollTrigger scrub timeline drives nothing directly — its `onUpdate` only interpolates values into a shared state object (`translateY`, `scale`, column `gap`, and a **two-phase title font-size**), and a `requestAnimationFrame` loop applies them as a transform string, adding an **eased mouse-follow horizontal parallax** that fades out as the video reaches full scale. Scroll is smoothed with Lenis. Desktop-only effect.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin, plus **`lenis`**:
```js
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```
Everything runs inside a `DOMContentLoaded` listener, and the **entire script body is wrapped in `if (window.innerWidth >= 900) { ... }`** — below 900px no Lenis, no ScrollTrigger, no rAF loop at all. Wire Lenis the standard way:
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
No tweens and no eases anywhere — the ScrollTrigger `onUpdate` computes linear interpolations with `gsap.utils.interpolate`, and a rAF loop writes inline styles.

## Layout / HTML
```html
<body>
  <nav>
    <div class="logo"><a href="#">Motionprompts</a></div>
    <div class="links">
      <a href="#">Home</a><a href="#">About</a><a href="#">Videos</a><a href="#">Contact</a>
    </div>
  </nav>

  <section class="hero">
    <h1>Motionprompts</h1>
    <div class="hero-copy">
      <p>One subscription, endless web design.</p>
      <p>(Scroll)</p>
    </div>
  </section>

  <section class="intro">
    <div class="video-container-desktop">
      <div class="video-preview">
        <div class="video-wrapper">
          <img class="showreel-img" src="(showreel)" alt="PRO Showreel" />
        </div>
      </div>
      <div class="video-title">
        <p>PRO Showreel</p>
        <p>2023 - 2024</p>
      </div>
    </div>

    <div class="video-container-mobile">
      <!-- exact same inner markup: .video-preview > .video-wrapper > img, then .video-title with the two <p> -->
    </div>
  </section>

  <section class="outro">
    <p>Delve into coding without clutter.</p>
  </section>
  <script type="module" src="./script.js"></script>
</body>
```
The JS queries `.intro`, `.video-container-desktop`, and `.video-title p` — keep those class names exact. Note the duplicated video block: `.video-container-desktop` (animated) and `.video-container-mobile` (static fallback, hidden on desktop).

## Styling
Font: **"Hanken Grotesk"** (Google Fonts) loaded via `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap");`. Palette: text `#1a1a1a` on warm paper `#e3e3db`; the video placeholder plate is `#b9b9b3`; nav links are `#fff` (inverted by blend mode).

- Global reset `* { margin:0; padding:0; box-sizing:border-box; }`; `body { font-family:"Hanken Grotesk"; color:#1a1a1a; background:#e3e3db; overflow-x:hidden; }`.
- Base type: `h1 { font-size:60px; font-weight:500; }`, `p { font-size:20px; font-weight:500; }`, `a { text-decoration:none; color:#fff; font-size:20px; font-weight:500; }`.
- `nav`: `position:fixed; top:0; left:0; width:100vw; padding:2em 2.5em; display:flex; justify-content:space-between; mix-blend-mode:difference; z-index:2;` — the white links invert against the light background. `.links { display:flex; gap:1em; }`.
- Every `section`: `width:100vw; height:100svh; padding:2.5em;`.
- `.hero`: flex column, `justify-content:space-between`, `padding-top:4em`. Its `h1`: `position:relative; left:-0.05em; text-transform:uppercase; font-weight:500; font-size:20vw; letter-spacing:-0.04em; line-height:1;` — a giant single-line wordmark. `.hero-copy { display:flex; justify-content:space-between; align-items:flex-end; }` (tagline left, "(Scroll)" right).
- `.intro { height:100%; }` (overrides the `100svh`).
- `.video-container-desktop`: `position:relative; display:flex; flex-direction:column; gap:2em; will-change:transform;` with **initial state in CSS: `transform: translateY(-105%) scale(0.25);`** — before JS runs it must already sit pulled up above the intro (overlapping the hero as a small centered thumbnail) at quarter scale. Its `.video-title p { position:relative; font-size:78px; font-weight:500; }` (the JS immediately takes over the font-size).
- `.video-container-mobile`: `display:none; width:100%; max-width:800px; margin:0 auto;`.
- `.video-preview`: `position:relative; width:100%; aspect-ratio:16/9; border-radius:1.5rem; background:#b9b9b3; overflow:hidden;`. `.video-wrapper`: absolutely positioned full-bleed inside it, same `border-radius:1.5rem; overflow:hidden;`. The img: `width:100%; height:100%; object-fit:cover; display:block;`.
- `@media (max-width:900px)`: `nav, section { padding:1.5em; }`; `.hero { justify-content:flex-end; gap:2em; }`; `.hero h1 { font-size:19vw; }`; `.video-container-desktop { display:none; }`; `.video-container-mobile { display:flex; flex-direction:column; gap:1em; }`.

## GSAP effect (the important part — be exhaustive)

### 1. Responsive initial values (breakpoints table)
The starting `translateY` (in **%** of the container's own height) and the mouse-parallax strength depend on viewport width. Check in order, first match wins:
```js
const breakpoints = [
  { maxWidth: 1000, translateY: -135, movMultiplier: 450 },
  { maxWidth: 1100, translateY: -130, movMultiplier: 500 },
  { maxWidth: 1200, translateY: -125, movMultiplier: 550 },
  { maxWidth: 1300, translateY: -120, movMultiplier: 600 },
];
// width > 1300 → { translateY: -105, movementMultiplier: 650 }
```
A `getInitialValues()` helper returns `{ translateY, movementMultiplier }` for the current `window.innerWidth`.

### 2. Shared animation state
All animated values live in one plain object (no GSAP targets):
```js
const animationState = {
  scrollProgress: 0,
  initialTranslateY: initialValues.translateY,
  currentTranslateY: initialValues.translateY,
  movementMultiplier: initialValues.movementMultiplier,
  scale: 0.25,
  fontSize: 80,
  gap: 2,
  targetMouseX: 0,
  currentMouseX: 0,
};
```
On `resize`: recompute `getInitialValues()`, overwrite `initialTranslateY` and `movementMultiplier`, and **only reset `currentTranslateY` if `scrollProgress === 0`** (don't snap mid-scroll).

### 3. The ScrollTrigger (scrub, no pin)
One `gsap.timeline({ scrollTrigger: { ... } })` with an **empty timeline** — the ScrollTrigger exists purely for its `onUpdate`:
```js
scrollTrigger: {
  trigger: ".intro",
  start: "top bottom",   // fires as soon as the intro enters the viewport
  end: "top 10%",        // completes when the intro's top reaches 10% from the viewport top
  scrub: true,
  onUpdate: (self) => { ... },
}
```
No pinning, no pinSpacing. In `onUpdate`, set `animationState.scrollProgress = self.progress` and interpolate **linearly** with `gsap.utils.interpolate`:
- `currentTranslateY`: `initialTranslateY → 0` (% — the container slides down from above into its natural place).
- `scale`: `0.25 → 1`.
- `gap`: `2 → 1` (em — the gap between video and title tightens as it grows).
- `fontSize` is **two-phase**:
  - `progress ≤ 0.4`: `firstPartProgress = progress / 0.4`; fontSize `80 → 40`.
  - `progress > 0.4`: `secondPartProgress = (progress − 0.4) / 0.6`; fontSize `40 → 20`.
  - (Fast shrink early, slow settle late — at full scale the title reads as a normal 20px caption.)

### 4. Mouse tracking
```js
document.addEventListener("mousemove", (e) => {
  animationState.targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2; // −1 … 1
});
```

### 5. The rAF apply loop (this is what actually moves pixels)
An `animate()` function called via `requestAnimationFrame(animate)` forever (kick it off once). It bails with `return` (stopping the loop) if `window.innerWidth < 900`. Each frame:
```js
const scaledMovementMultiplier = (1 - scale) * movementMultiplier;
const maxHorizontalMovement = scale < 0.95 ? targetMouseX * scaledMovementMultiplier : 0;
animationState.currentMouseX = gsap.utils.interpolate(
  currentMouseX, maxHorizontalMovement, 0.05   // lerp factor 0.05 → soft trailing ease
);
videoContainer.style.transform =
  `translateY(${currentTranslateY}%) translateX(${animationState.currentMouseX}px) scale(${scale})`;
videoContainer.style.gap = `${gap}em`;
videoTitleElements.forEach((el) => { el.style.fontSize = `${fontSize}px`; });
```
Key behaviors this produces:
- **Parallax strength is proportional to how small the video is**: `(1 − scale) × movementMultiplier` px of max travel at each side, so the tiny thumbnail swings widely (up to ±~487px at scale 0.25 on wide screens) and the movement dies to nothing as it grows.
- **Hard gate at `scale ≥ 0.95`**: the target snaps to 0, and the 0.05 lerp glides the video back to center as it reaches full size.
- The transform order must be exactly `translateY(%) translateX(px) scale()`.
- Everything is fully reversible — scrolling back up shrinks the video back into the floating thumbnail.

## Assets / images
- **1 landscape 16:9 image** used as the showreel poster inside the video preview: a cinematic, moody motion-blurred human figure — dark, atmospheric, long-exposure feel, like a frame from a motion-design reel. It fills the rounded 16:9 plate with `object-fit:cover`. (Same image in both the desktop and mobile containers.)

Use the neutral brand name "Motionprompts" — no real studio or client names.

## Behavior notes
- **Desktop-only animation**: below 900px viewport width nothing initializes (no Lenis, no ScrollTrigger, no parallax); the CSS media query swaps in the static `.video-container-mobile` block instead.
- The initial `translateY(-105%) scale(0.25)` in CSS matches the JS default for >1300px, so there's no first-frame jump on wide screens; on narrower desktops the JS breakpoint value takes over on the first rAF tick.
- The scrub has no smoothing of its own (`scrub: true`, not a number) — the floaty feel comes from Lenis inertia plus the 0.05 mouse lerp.
- No SplitText, no CustomEase, no Three.js, no pinning, no reduced-motion branch in the original.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/vucko-scroll-animation-javascript/showreel.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--muted`, `--hairline`, `--steel`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no error, no animation, nothing to debug. Delete the listener and put its body directly inside a `useEffect` with an empty dependency array. That body is itself gated on `window.innerWidth >= 900`, and nothing in the original script ever re-evaluates that branch after it runs once — the `resize` handler only recomputes `translateY`/`movementMultiplier` for the desktop rig, it never switches a mobile mount over to the desktop path or back. Keep that: the `if (window.innerWidth >= 900) { … } else { … }` stays a one-time branch taken synchronously inside the effect, not a value you track in state or re-derive on every resize.

*(2) Element lookups* — `document.querySelector(".video-container-desktop")`, `document.querySelectorAll(".video-title p")`, and, on the mobile path, `document.querySelector(".video-container-mobile .video-preview")` are plain DOM calls and assume this component owns the document; scope all three to a root `ref` (e.g. `rootRef.current.querySelector(...)`). The `trigger: ".intro"` and `trigger: ".video-container-mobile"` strings inside the two `scrollTrigger` configs are a different case: GSAP resolves selector text passed to its own APIs through the active `gsap.context`, so once the timeline/tween that reads them is created synchronously inside the context factory below, those two strings resolve only within the root automatically — don't add a manual scope for them, and don't assume the reverse (that being "inside the context" also scopes the raw `document.querySelector` calls above; it doesn't, those go through the DOM API directly, not through GSAP's selector resolution).

*(3) Cleanup* — Wrap both scrollTrigger-driven paths — the desktop timeline whose `onUpdate` writes into `animationState`, and the mobile `gsap.set` + `gsap.to` pair that scales `.video-preview` from a quarter size up to full — in one `gsap.context` scoped to the root ref, and revert that context in the cleanup. Only one of the two branches runs per mount (the width check above picks it), but wrapping both means the cleanup is correct regardless of which one a given mount took:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the width check, then whichever branch it selects, exactly as above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Without the revert, a StrictMode remount on a desktop-width viewport leaves a second scrollTrigger with its own `onUpdate` writing into a second `animationState` object, both driven by the same scroll.

`gsap.ticker.add((time) => { lenis.raf(time * 1000); })` is not covered by the context: the ticker subscription that pumps Lenis is neither a tween nor a trigger, so `ctx.revert()` leaves it calling `lenis.raf` on a Lenis instance the cleanup is about to destroy. Keep the exact function reference passed to `gsap.ticker.add` and call `gsap.ticker.remove` on that same reference before (or alongside) `lenis.destroy()`. This Lenis instance is created only on the desktop branch — the mobile branch has no Lenis at all — so the destroy/ticker-remove pair belongs behind the same width check, not unconditionally in the cleanup.

The `animate()` rAF loop that actually writes the `transform`, `gap`, and `fontSize` inline styles is the one piece of this component with no cancellation at all in the original: it calls `requestAnimationFrame(animate)` unconditionally (its only exit is the width check at the top of each frame, which is not a signal a cleanup can use). Capture the handle from the outermost `requestAnimationFrame(animate)` call and cancel it with `cancelAnimationFrame` in the same cleanup that reverts the context and destroys Lenis — otherwise the loop keeps reading `videoContainer`/`videoTitleElements` from the closure and writing to nodes a reverted, unmounted pass no longer owns, once per frame, for as long as the page stays open.

Two more subscriptions in this script are neither GSAP- nor Lenis-owned, so neither `ctx.revert()` nor `lenis.destroy()` touches them, and the original never removes either because a static page never needs to: the `mousemove` listener on `document` that feeds `animationState.targetMouseX`, and the `resize` listener on `window` that recomputes the breakpoint values. Keep both handler references and remove them explicitly in the cleanup, or a StrictMode remount leaves two of each writing into two different `animationState` closures.
