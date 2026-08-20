---
slug: mat-voyce-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 3
structural_literals: 3
structural:
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power1.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Kinetic Type Scroll — pinned horizontal title reel + 3D fly-through cards

## Goal

Build a full-page scroll experience: a pinned section where four giant italic uppercase project titles scroll horizontally as a 400vw reel while ten rounded image cards fly toward the camera from extremely deep `translateZ`. Each title is three stacked color copies, and the two top copies jitter horizontally based on live scroll velocity — a kinetic-typography "ink offset" effect.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) with the `ScrollTrigger` plugin, plus `lenis` for smooth scrolling. No other libraries.

Wire Lenis to GSAP exactly like this: create `new Lenis()`, call `ScrollTrigger.update` on its `scroll` event, drive it from GSAP's ticker with `lenis.raf(time * 1000)`, and call `gsap.ticker.lagSmoothing(0)`. Run everything inside a `DOMContentLoaded` handler.

## Layout / HTML

- `<nav>` — fixed, top-left, full width, `z-index: 2`, padding `2em`, flex with `gap: 4em`. Three children:
  - `.logo` (`flex: 3`) containing `.logo-img` (width `120px`) with an `<img>` logo.
  - `.tagline` (`flex: 1`): a `<p>` reading "Your go-to creative powerhouse for" then a line break and a `<span>` "design, branding, and motion." (span in gray).
  - `.about` (`flex: 1`): two `<p>`: "Headquartered in Toronto" and a `<span>` "Collaborating worldwide" (gray).
- `<section class="hero">` — 100vw × 100vh, centered `<h1>(Scroll if you dare)</h1>`.
- `<section class="sticky">` — 100vw × 100vh, contains:
  - `<div class="titles">` with four `<div class="title">` blocks. Each block holds THREE stacked copies of the same heading: `<h1 class="title-1">`, `<h1 class="title-2">`, `<h1 class="title-3">`. The four headings read: "Showcase Hub", "Nova Stream", "Circle 30", "Bites & Banter".
  - `<div class="images">` — empty in HTML; the 10 cards are created by JS.
- `<section class="outro">` — 100vw × 100vh, centered `<h1>(That's a wrap)</h1>`.

All `section`s: `position: relative; width: 100vw; height: 100vh; overflow: hidden;`.

## Styling

- Reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`. All `img { width: 100%; height: 100%; object-fit: cover; }`.
- Typeface: a heavy condensed display font. Use `font-family: "F37 Judge", "Anton", Impact, sans-serif` on `body` (the original uses an F37 Judge–style condensed grotesque; any bold condensed sans is an acceptable substitute). Nav `p` are `font-weight: 500`, antialiased; `nav p span { color: gray; }`.
- `h1` global: `text-transform: uppercase; font-size: 4vw; font-weight: 500; color: #1f1f1f;`.
- Palette: `.hero` and `.outro` background `#edebde` (warm cream); `.sticky` background `#fffef8` (near-white).
- `.titles`: `position: absolute; top: 0; left: 0; width: 400vw; height: 100vh; display: flex; will-change: transform;`. Each `.title`: `position: relative; flex: 1;` flex-centered. Each `.title h1`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 9vw; font-style: italic; will-change: transform;` — the three copies sit exactly on top of each other.
- Title copy colors (stacking order matters — `.title-3` is last in DOM so it paints on top): `h1.title-1 { color: #dafa6c; }` (lime), `h1.title-2 { color: #10d0f4; }` (cyan), `h1.title-3 { color: #1f1f1f; }` (near-black).
- `.images`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 200vw; height: 200vh; transform-style: preserve-3d; perspective: 2000px; z-index: -1;` — it sits BEHIND the titles.
- `.card`: `position: absolute; width: 200px; height: 200px; border-radius: 2em; background: #c0c0c0; transform-style: preserve-3d; will-change: transform; overflow: hidden;`.

## GSAP effect (exhaustive)

Register `ScrollTrigger`.

### Card creation (JS, before animation)

Create 10 cards in a loop (`card card-1` … `card card-10`), each containing an `<img>` (images 1–10). Position each card via inline `top`/`left` percentages, in this exact order:

```
{ top: 30%, left: 55% }, { top: 20%, left: 25% }, { top: 50%, left: 10% },
{ top: 60%, left: 40% }, { top: 30%, left: 30% }, { top: 60%, left: 60% },
{ top: 20%, left: 50% }, { top: 60%, left: 10% }, { top: 20%, left: 40% },
{ top: 45%, left: 55% }
```

Append them to `.images`. Then initialize every card with `gsap.set(card, { z: -50000, scale: 0 })` — they start 50,000px deep into the scene and invisible.

### ScrollTrigger

One single `ScrollTrigger.create({...})` drives everything:

- `trigger: ".sticky"`, `start: "top top"`, `end: "+=" + (window.innerHeight * 5) + "px"` (5 viewport heights of scroll), `pin: true`, `scrub: 1`.
- All animation happens in `onUpdate(self)` — there is no timeline; values are computed from `self.progress` (0→1) each tick.

### 1) Horizontal title reel

`const moveDistance = window.innerWidth * 3` (the 400vw strip minus one screen). Every update: `gsap.set(".titles", { x: -moveDistance * self.progress })`. So the reel translates from `x: 0` to `x: -3 × viewportWidth` linearly with progress, smoothed only by `scrub: 1` and Lenis.

### 2) Velocity-based kinetic type jitter

Each update, read `const velocity = self.getVelocity()`, then:

- `normalizedVelocity = velocity / Math.abs(velocity) || 0` (just the sign: -1, 0 or 1).
- `maxOffset = 30`; `currentSpeed = Math.min(Math.abs(velocity / 500), maxOffset)`.
- `isAtEdge = self.progress <= 0 || self.progress >= 1`.

For each of the four `.title` blocks, grab its `.title-1`, `.title-2`, `.title-3`:

- If `isAtEdge`: snap the two color copies back — `gsap.to([title1, title2], { xPercent: -50, x: 0, duration: {{motion.duration.fast}}, ease: "power2.out", overwrite: true })`.
- Otherwise, with `baseOffset = normalizedVelocity * currentSpeed`:
  - `gsap.to(title1, { xPercent: -50, x: baseOffset * 4 + "px", duration: {{motion.duration.fast}}, ease: "power1.out", overwrite: "auto" })` (lime copy drifts furthest),
  - `gsap.to(title2, { xPercent: -50, x: baseOffset * 2 + "px", duration: {{motion.duration.fast}}, ease: "power1.out", overwrite: "auto" })` (cyan copy drifts half as far).
- Always: `gsap.set(title3, { xPercent: -50, x: 0 })` — the dark top copy never moves.

`xPercent: -50` keeps every copy horizontally centered (GSAP picks up the `-50%` vertical translate from the CSS transform), so the colored copies fan out behind the dark one only while scrolling fast, then spring back together.

### 3) 3D card fly-through (staggered by index, computed per tick)

For each card `index` (0–9), inside the same `onUpdate`:

- `staggerOffset = index * 0.075` — each card starts its journey 7.5% of total progress after the previous one.
- `scaledProgress = (self.progress - staggerOffset) * 3` — each card completes its full flight in one third of the scroll range.
- `individualProgress = clamp(scaledProgress, 0, 1)`.
- `targetZ = 2000` for cards 0–8, but `1500` for the LAST card (index 9) — since the perspective is 2000px, the first nine fly PAST the camera and out of view, while the final card stops just short and ends up covering the screen.
- `newZ = -50000 + (targetZ + 50000) * individualProgress` — linear interpolation from -50000 to targetZ.
- `scale = clamp(individualProgress * 10, 0, 1)` — the card pops from scale 0 to 1 within the first 10% of its own flight, then Z does the rest of the growing via perspective.
- Apply with `gsap.set(card, { z: newZ, scale: scale })` (no tween — direct set every tick).

The result: cards emerge as tiny dots in the far distance, rush toward the viewer one after another and blow past the camera, while the title reel slides left; releasing the scroll makes the color-fringed titles settle back into a single solid word.

## Assets / images

- 1 logo: a bold black italic outlined wordmark on transparent background (fictional studio name, e.g. "Kota Verge"), placed in the nav, ~120px wide.
- 10 photographic images for the cards, roughly square (they render in 200×200 rounded-corner cards with `object-fit: cover`, so 1:1 is ideal). Varied colorful editorial/lifestyle photos work best.

## Behavior notes

- The pinned section consumes 5 viewport heights of scroll; total page = hero + pinned distance + outro.
- Everything is driven by one ScrollTrigger's `onUpdate` — no timelines, no stagger config; the stagger is hand-computed from `index * 0.075`.
- `moveDistance` and `end` are captured from `window.innerWidth` / `window.innerHeight` at load (no resize handling needed).
- Keep `will-change: transform` on `.titles`, `.title h1` and `.card` for smoothness; `z-index: -1` on `.images` keeps cards behind the titles, and `overflow: hidden` on sections prevents scrollbar blowout from the 400vw strip.

## Images

This component ships with 11 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/mat-voyce-scroll-animation/img1.jpeg
https://motionprompts.dev/c/mat-voyce-scroll-animation/img10.jpeg
https://motionprompts.dev/c/mat-voyce-scroll-animation/img2.jpeg
https://motionprompts.dev/c/mat-voyce-scroll-animation/img3.jpeg
https://motionprompts.dev/c/mat-voyce-scroll-animation/img4.jpeg
https://motionprompts.dev/c/mat-voyce-scroll-animation/img5.jpeg
… 5 more under https://motionprompts.dev/c/mat-voyce-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--muted`, `--cream`, `--paper`, `--amber`, `--teal`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, builds ten `.card` elements by hand with `document.createElement`/`appendChild`, wires `Lenis` into GSAP's ticker, and drives the title-reel translate, the three-copy velocity jitter and the ten-card fly-through out of a single `ScrollTrigger.create({ onUpdate })` that nothing ever tears down — because the tab reloads long before any of it could run twice. React withdraws that guarantee.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that produces two independent problems at once: a second pin/scrub on `.sticky`, both reading `self.progress` off the same scroll and racing to set the same `.titles` translate, and — worse — a second pass through the card-creation loop, which does not touch the ten cards the first pass already appended, so `.images` ends up holding twenty `.card` elements instead of ten. Nothing throws; the fly-through just looks doubled and mis-staggered, and it will not reproduce in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — the whole body, from `gsap.registerPlugin` through the closing brace of `ScrollTrigger.create`, sits inside `document.addEventListener("DOMContentLoaded", () => {...})`. A React component mounts after that event has already fired on the document, so the listener is registered and never called: no `Lenis` instance, no cards, no pin — `.sticky` just scrolls past as flat, static content, with nothing in the console to explain why. Delete the listener and move its body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can move to module scope.

*(2) Element lookups* — `.titles` and `.images` are each looked up once via `document.querySelector` and both need a root-ref scope instead. `document.querySelectorAll(".card")` is also a one-time, unscoped lookup, captured in the `cards` variable the fly-through loop closes over — scope it too. The lookup that needs more than scoping is `document.querySelectorAll(".title")`: unlike `cards`, it is not hoisted out of `onUpdate` — it re-runs on every scroll tick for as long as the user scrubs the pinned section. Scoped to the root ref that stops being a correctness bug, but it is still wasted work repeated at scroll-frame rate for a list that never changes: the four `.title` blocks and their three children each are static markup, so resolve them once, outside `onUpdate`, into a list your code indexes into. `titleContainer.querySelector(".title-1"/".title-2"/".title-3")` inherits the fix once its parent list does.

*(3) Cleanup* — wrap the card setup and the `ScrollTrigger.create` call in one `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the effect exactly as described above, querying off rootRef instead of document */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` undoes the single `ScrollTrigger` this component creates and every inline style its `gsap.set`/`gsap.to` calls wrote inside `onUpdate` — the titles' translate, and whatever `z`/`scale` a card was mid-flight at when the unmount happened. It does not undo two things: the `gsap.ticker.add` subscription, and the cards themselves.

`gsap.ticker.add` is not covered by the context. Keep the exact function reference passed to it and call `gsap.ticker.remove` on that same reference in the cleanup, alongside `lenis.destroy()`. `gsap.ticker.lagSmoothing(0)` is global and idempotent, safe to leave as-is.

This reel is written assuming it owns the whole document's scroll, the same assumption flagged above for a non-React host. In a React tree the fix is the same: if this pinned section is one part of a larger app, lift `Lenis` to the app shell and have this effect wire the existing instance's `scroll` event to `ScrollTrigger.update` rather than constructing a second instance to fight the first over the same wheel input. If this component does own Lenis, construct it inside the effect and call `destroy()` in the cleanup, after removing the ticker subscription as described above.

*(4) What is specific to this component* — the ten cards are not GSAP output, they are plain DOM nodes built with `document.createElement` and appended to `.images`, so neither `ctx.revert()` nor unmounting the component removes them. The fix is not to clean them up by hand in the effect — it is to stop creating them imperatively at all. `cardPositions` is already a plain array of `{ top, left }` pairs; render the ten `.card` divs declaratively from it and let React own their identity across remounts:

```jsx
{cardPositions.map((pos, i) => (
  <div key={i} className={`card card-${i + 1}`} style={{ top: pos.top, left: pos.left }}>
    <img src={`/c/mat-voyce-scroll-animation/img${i + 1}.jpeg`} alt={`Image ${i + 1}`} />
  </div>
))}
```

With the cards already in the tree, the effect no longer creates them — it only reads them back (`rootRef.current.querySelectorAll(".card")`, or a ref collected per card) to run the initial `gsap.set` that pushes each one to its starting depth and to drive the per-tick fly-through inside `onUpdate`. A StrictMode remount then re-reads the same ten nodes instead of appending ten more.
