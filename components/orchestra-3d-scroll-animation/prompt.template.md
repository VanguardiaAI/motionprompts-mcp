---
slug: orchestra-3d-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Orchestra 3D Scroll Animation

## Goal

Build a pinned full-screen hero where six image-mapped CSS 3D cubes fly in from extremely deep 3D space (`translateZ(-30000px)`) and assemble into a symmetric spread as the user scrolls, while a geometric block logo blurs away, a large intro headline scales up and fades out, and a second headline de-blurs into view. Everything is driven by a single scrubbed, pinned ScrollTrigger whose `onUpdate` manually interpolates every value from scroll progress (no tweens).

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scrolling. Register ScrollTrigger with `gsap.registerPlugin(ScrollTrigger)`. No other libraries.

Wire Lenis to GSAP exactly like this:

- `const lenis = new Lenis()` (default options)
- `lenis.on("scroll", ScrollTrigger.update)`
- `gsap.ticker.add((time) => lenis.raf(time * 1000))`
- `gsap.ticker.lagSmoothing(0)`

Run all JS inside `DOMContentLoaded`.

## Layout / HTML

Two full-viewport `<section>` elements:

```
section.sticky
  div.logo
    div.col > div.block.block-1 + div.block.block-2
    div.col > div.block.block-3 + div.block.block-4
    div.col > div.block.block-5 + div.block.block-6
  div.cubes
    div.cube.cube-1 > div.front + div.back + div.right + div.left + div.top + div.bottom
    div.cube.cube-2 > (same 6 face divs)
    div.cube.cube-3 > (same 6 face divs)
    div.cube.cube-4 > (same 6 face divs)
    div.cube.cube-5 > (same 6 face divs)
    div.cube.cube-6 > (same 6 face divs)
  div.header-1
    h1 "The first media company crafted for the digital first generation."
  div.header-2
    h2 "Where innovation meets precision."
    p  "Symphonia unites visionary thinkers, creative architects, and analytical experts, collaborating seamlessly to transform challenges into opportunities. Together, we deliver tailored solutions that drive impact and inspire growth."

section.about
  h2 "Your next section goes here"
```

The cube faces start empty; JS fills each one with an `<img>` (see GSAP effect section).

## Styling

- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `html, body { width: 100vw; height: 600vh; }`. Fonts: **Inter** for body, **Space Grotesk** for the headers, **Space Mono** for the small uppercase labels.
- Palette (P1 Canary):
  ```css
  :root {
    --ink: #0a0a0a;    /* the pinned stage */
    --bone: #f4f4f0;   /* its type, and the closing panel */
    --canary: #ffe500; /* the logo blocks and the link chip — the only colour */
    --gray: #8c8c88;
  }
  ```
- `img { width: 100%; height: 100%; object-fit: cover; }`.
- Every `section`: `position: relative; width: 100vw; height: 100vh; overflow: hidden;`.
- `.sticky`: `background-color: var(--ink)`, text `var(--bone)`.
- `.about`: flex-centered text, `background-color: var(--bone)`, text `var(--ink)`; its link is a chip that fills with `var(--canary)` on hover.

**Logo** (an abstract mark built from 6 canary squares):

- `.logo`: `position: absolute; top: 25%; left: 50%; transform: translate(-50%, -50%); display: flex; gap: 24px; z-index: 2;`.
- `.col`: `display: flex; flex-direction: column; justify-content: flex-end;`. The 2nd column gets `gap: 26px`.
- `.block`: `35px × 35px`, `background-color: var(--canary)`.
- `.block-1`: `transform: rotate(42deg); transform-origin: bottom right;`. `.block-5`: `transform: rotate(-42deg); transform-origin: bottom left;`.

**Cubes container and cube geometry**:

- `.cubes`: `position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; transform-style: preserve-3d; perspective: 10000px;`.
- `.cube`: `position: absolute; width: 150px; height: 150px; transform-style: preserve-3d;`.
- `.cube > div` (each face): `position: absolute; width: 150px; height: 150px; transform-style: preserve-3d; backface-visibility: visible;`.
- Face transforms: `.front { transform: translateZ(75px); }`, `.back { transform: translateZ(-75px) rotateY(180deg); }`, `.right { transform: translateX(75px) rotateY(90deg); }`, `.left { transform: translateX(-75px) rotateY(-90deg); }`, `.top { transform: translateY(-75px) rotateX(90deg); }`, `.bottom { transform: translateY(75px) rotateX(-90deg); }`.
- Static CSS starting state per cube — position with `top`/`left` (percentages) and `transform: translate3d(-50%, -50%, -30000px) rotateX(...) rotateY(...) rotateZ(...)` using the **initial** values from the table in the GSAP section below (all cubes start at z `-30000px`, above the viewport with negative `top`).

**Headers** (both absolutely centered in the sticky section, `text-align: center`, colour `var(--bone)`):

- `.header-1`: `width: 60%; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(1); transform-origin: center center;`. Its `h1`: `font-family:"Space Grotesk"; font-weight: 600; font-size: clamp(2.4rem, 5.4vw, 4.5rem); line-height: 1; letter-spacing: -0.035em;`.
- `.header-2`: `width: 34%; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.75); transform-origin: center center; opacity: 0; filter: blur(10px);`. On mobile it also gets `z-index:3` and a `rgba(10,10,10,.9)` backdrop, because the full-width cubes of the assembled state otherwise sit right under the copy. Its `h2` has `margin-bottom: 0.5rem`; its `p`: `font-size: 1.25rem; font-weight: lighter;`.
- Include the standard Lenis recommended CSS (`.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }`, `.lenis.lenis-stopped { overflow: clip; }`, `.lenis.lenis-smooth iframe { pointer-events: none; }`).

## GSAP effect (exhaustive)

### Setup

1. Query `.sticky`, `.logo`, `.cubes`, `.header-1`, `.header-2`.
2. `const stickyHeight = window.innerHeight * 4;`
3. **Populate cube faces**: select all `.cube > div`, and for each face create an `<img>` and append it. Assign the images sequentially face by face in DOM order (cube-1 front→back→right→left→top→bottom, then cube-2, etc. — **36 faces total**). The demo ships **33** images, so wrap the index with modulo — `img${((i - 1) % 33) + 1}.jpeg` (1-based counter) — meaning the last 3 faces (cube-6's top/bottom-adjacent faces) reuse images 1–3. If your image set differs, cycle the same way so every face gets one.
4. Define a linear interpolation helper: `interpolate(start, end, progress) => start + (end - start) * progress`.

### ScrollTrigger

Create **one** ScrollTrigger (no timeline, no tweens — everything happens in `onUpdate` by writing inline styles):

```
ScrollTrigger.create({
  trigger: stickySection,
  start: "top top",
  end: `+=${stickyHeight}px`,   // 4 × viewport height
  scrub: 1,
  pin: true,
  pinSpacing: true,
  onUpdate: (self) => { ... }
})
```

### onUpdate logic (all driven by `self.progress`, 0 → 1)

All sub-progress values are clamped to [0, 1].

**Logo** (blurs out and disappears almost immediately):

- Blur: `initialProgress = min(progress * 20, 1)`; set `logo.style.filter = blur(lerp(0, 20, initialProgress)px)` — i.e. full 20px blur by progress 0.05.
- Opacity: for `progress >= 0.02`, `logoOpacityProgress = min((progress - 0.02) * 100, 1)`, else 0; set `logo.style.opacity = 1 - logoOpacityProgress` — fades 1→0 between progress 0.02 and 0.03.

**Cubes container opacity** (fades in right at the start):

- For `progress >= 0.01`, `cubesOpacityProgress = min((progress - 0.01) * 100, 1)`, else 0; set `cubesContainer.style.opacity = cubesOpacityProgress` — 0→1 between progress 0.01 and 0.02.

**Header 1** (scales up, blurs and fades out over the first 40% of scroll):

- `header1Progress = min(progress * 2.5, 1)`.
- `transform: translate(-50%, -50%) scale(lerp(1, 1.5, header1Progress))`.
- `filter: blur(lerp(0, 20, header1Progress)px)`.
- `opacity: 1 - header1Progress`.

**Header 2** (de-blurs and scales in between 40% and 50% of scroll):

- `header2Progress = clamp((progress - 0.4) * 10, 0, 1)`.
- `transform: translate(-50%, -50%) scale(lerp(0.75, 1, header2Progress))`.
- `filter: blur(lerp(10, 0, header2Progress)px)`.
- `opacity: header2Progress`.

**Cubes** (two phases):

- `firstPhaseProgress = min(progress * 2, 1)` — the fly-in/assembly runs over the first half of the scroll.
- `secondPhaseProgress = progress >= 0.5 ? (progress - 0.5) * 2 : 0` — extra flips run over the second half.

For each cube, linearly interpolate every property from `initial` to `final` using `firstPhaseProgress`, then write inline styles:

- `cube.style.top = "{top}%"`, `cube.style.left = "{left}%"`
- `cube.style.transform = "translate3d(-50%, -50%, {z}px) rotateX({rotateX}deg) rotateY({rotateY + additionalRotation}deg) rotateZ({rotateZ}deg)"`

Per-cube data (keep these exact values in a lookup object keyed by class name):

| Cube | initial top | initial left | initial rotateX | initial rotateY | initial rotateZ | initial z | final top | final left | final rotateX | final rotateY | final rotateZ | final z |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cube-1 | -55 | 37.5 | 360 | -360 | -48 | -30000 | 50 | 15 | 0 | 3 | 0 | 0 |
| cube-2 | -35 | 32.5 | -360 | 360 | 90 | -30000 | 75 | 25 | 1 | 2 | 0 | 0 |
| cube-3 | -65 | 50 | -360 | -360 | -180 | -30000 | 25 | 25 | -1 | 2 | 0 | 0 |
| cube-4 | -35 | 50 | -360 | -360 | -180 | -30000 | 75 | 75 | 1 | -2 | 0 | 0 |
| cube-5 | -55 | 62.5 | 360 | 360 | -135 | -30000 | 25 | 75 | -1 | -2 | 0 | 0 |
| cube-6 | -35 | 67.5 | -180 | -360 | -180 | -30000 | 50 | 85 | 0 | -3 | 0 | 0 |

**Second-phase extra rotation** (only two cubes): during the second half, `cube-2` gets `additionalRotation = lerp(0, 180, secondPhaseProgress)` and `cube-4` gets `additionalRotation = lerp(0, -180, secondPhaseProgress)`, added to their rotateY. All other cubes get 0.

Net result: the six cubes tumble in from deep space (multiple full 360° rotations unwinding to nearly flat, subtle ±1–3° final tilts) and settle into a 2×3 symmetric grid around the centered second headline (left column at 25%, right at 75%, outer singles at 15%/85%, rows at 25%/50%/75%), then two of them slowly flip 180° to reveal their back-face image while the user finishes scrolling.

## Assets / images

**33 square images** (effectively 1:1, since each fills a 150×150px face with `object-fit: cover`) — a gallery-grade editorial mix: fashion portraits, minimalist architecture interiors, product still-lifes (ceramics, lamps), landscapes and abstract compositions. They fly past at speed against a near-black stage, so favour frames with one clear subject and real tonal contrast. No brand marks. They map one per cube face in DOM order across the 36 faces, so the final 3 faces reuse the first 3 images (see setup step 3). Any count works: the code cycles through the available list.

## Behavior notes

- The whole effect lives in the single pinned ScrollTrigger; scrolling back up plays everything in reverse (scrub).
- `scrub: 1` plus Lenis gives the animation a soft, damped feel.
- The `.about` section after the pinned hero is plain static content confirming the pin releases correctly.
- No resize handling, no reduced-motion branch in the original; desktop-oriented but functional on mobile.

## Images

This component ships with 33 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/orchestra-3d-scroll-animation/img1.jpeg
https://motionprompts.dev/c/orchestra-3d-scroll-animation/img10.jpeg
https://motionprompts.dev/c/orchestra-3d-scroll-animation/img11.jpeg
https://motionprompts.dev/c/orchestra-3d-scroll-animation/img12.jpeg
https://motionprompts.dev/c/orchestra-3d-scroll-animation/img13.jpeg
https://motionprompts.dev/c/orchestra-3d-scroll-animation/img14.jpeg
… 27 more under https://motionprompts.dev/c/orchestra-3d-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--bone`, `--canary`, `--gray`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script gated on `DOMContentLoaded` that reaches into the page with five `document.querySelector` calls for `.sticky`, `.logo`, `.cubes`, `.header-1` and `.header-2`, builds the 36 cube faces once, and then hands scroll control to a single pinned `ScrollTrigger` whose `onUpdate` writes every cube's position and rotation, both headers' scale/blur/opacity, and the logo's blur/opacity directly as inline styles, on every scroll tick, for as long as the page lives. React withdraws the free run of that document and the license to never tear any of it down, and it does it quietly: the hero assembles correctly on first load and the damage only shows up on the next mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component acquires a `Lenis` instance, a `gsap.ticker` callback that pumps it, and one pinned `ScrollTrigger` covering four viewport-heights of scroll, all before the first paint. A double mount that doesn't undo all three leaves two `Lenis` instances fighting over the same wheel event and two pinned triggers each running their own copy of the cube-interpolation math against the same six `.cube-N` elements — visible as the cubes jittering between two disagreeing rotation states instead of assembling once. None of this reproduces in a production build, since React only double-invokes effects in development.

*(1) The entry point* — the whole effect body sits inside `document.addEventListener("DOMContentLoaded", ...)`. That event has already fired by the time a React component mounts, so the listener registers and is never called: no Lenis instance, no cube images, no `ScrollTrigger`, and nothing in the console to point at it. Delete the listener and move its entire body — the Lenis wiring, the five element lookups, the 36-face image population, and `ScrollTrigger.create` — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can stay at module scope.

*(2) Element lookups* — the five `document.querySelector` calls for `.sticky`, `.logo`, `.cubes`, `.header-1` and `.header-2`, plus `document.querySelectorAll(".cube > div")` for the 36 faces, all assume the component owns the document. The markup here is two sibling `<section>`s with no shared wrapper, so give them one — a root `div` around `section.sticky` and `section.about` — and put the ref there, then scope all six lookups to it. `onUpdate` has the same problem in a hotter spot: it calls `document.querySelector(`.${cubeClass}`)` fresh for each of the six cubes on every scroll tick for the full four-viewport scrub. Resolve the six cube elements once, before `ScrollTrigger.create`, into a lookup keyed by class name and scoped to the root, and read from that instead of querying live inside `onUpdate`. This isn't just tidiness: during the StrictMode remount two copies of the cube markup exist for an instant, and a live `querySelector` inside a callback that keeps firing for the whole scrub can latch onto the copy that is on its way out — every following tick then writes `top`/`left`/`transform` to six detached nodes instead of the six on screen.

*(3) Cleanup* — wrap the face population and `ScrollTrigger.create` in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // populate the 36 cube faces, build the cube-element lookup, ScrollTrigger.create({...})
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`pin: true` / `pinSpacing: true` makes the revert non-optional here specifically: ScrollTrigger inserts a pin-spacer around `.sticky` and rewrites `.sticky`'s own inline styles for the four-viewport-height duration of the pin. `ctx.revert()` is what removes that spacer and restores the original styles; skip it and a remount stacks a second spacer around the same section, with two triggers pinning it at once and disagreeing about the current scrub frame.

`ctx.revert()` does not reach `gsap.ticker.add((time) => lenis.raf(time * 1000))` — a ticker subscription is neither a tween nor a trigger, so the context never records it. This is exactly the case where that gap matters most: the ticker callback is the only thing driving Lenis's frame loop here. Keep the function reference and remove it before destroying Lenis:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

Reverse that order — destroy `lenis` while `onTick` is still subscribed — and the next ticker frame calls `.raf()` on an instance that no longer exists. `lenis.on("scroll", ScrollTrigger.update)` doesn't need its own teardown line: `destroy()` unbinds Lenis's internal listeners along with it.

Lenis is a document-level resource, but this hero is the kind of component that plausibly owns the whole page — `html, body` are sized to `600vh` specifically for this scroll, and nothing else on the page is expected to scroll independently. Constructing Lenis inside this effect and destroying it in this cleanup is the right call for that case. If this ever ships as one section inside a larger app that already runs Lenis, drop the `new Lenis()` line here and subscribe the existing instance's `scroll` event to `ScrollTrigger.update` instead — a second instance would fight the first over the same wheel event, with nothing in the console to explain the stutter.
