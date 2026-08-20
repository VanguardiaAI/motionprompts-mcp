# Scroll-Scaling Editorial Image Grid

## Goal

Build a full-page scroll gallery: a dark editorial grid of portraits arranged in 10 four-column rows, where each row's images **scale up from 0 to 1** (from a corner transform-origin) as the row scrolls into view, then the row **pins** and its images **scale back down from 1 to 0** as it scrolls out — all driven by scrubbed ScrollTriggers and Lenis smooth scrolling.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` for smooth scrolling.

```js
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```

Run everything inside a `DOMContentLoaded` listener.

## Layout / HTML

Three sections in `<body>`:

1. `<section class="intro">` — an `<h1>` reading "Design that Captivates" and a `<p>` reading "( Explore Below )".
2. `<section class="work">` — **10** `<div class="row">` elements. Every row contains exactly **4** `<div class="col">` elements. Some cols are empty; others contain one `<div class="img" data-origin="left|right"><img src="..." alt="" /></div>`. There are **17 images total**, distributed like this (cols listed 1→4, `L` = `data-origin="left"`, `R` = `data-origin="right"`, `—` = empty col):
   - Row 1: `R` (img 1), `—`, `L` (img 2), `—`
   - Row 2: `—`, `L` (img 3), `—`, `—`
   - Row 3: `R` (img 4), `—`, `—`, `L` (img 5)
   - Row 4: `—`, `L` (img 6), `R` (img 7), `—`
   - Row 5: `L` (img 8), `—`, `—`, `L` (img 9)
   - Row 6: `—`, `—`, `L` (img 10), `—`
   - Row 7: `—`, `L` (img 11), `—`, `L` (img 12)
   - Row 8: `R` (img 13), `—`, `L` (img 14), `—`
   - Row 9: `—`, `L` (img 15), `—`, `—`
   - Row 10: `R` (img 16), `—`, `—`, `L` (img 17)
3. `<section class="outro">` — a single `<p>` reading "( Return to the Beginning )".

## Styling

- Universal reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `body`: `font-family: "TWK Lausanne", monospace;` (a neutral grotesque sans; monospace fallback is fine).
- `img`: `width: 100%; height: 100%; object-fit: cover;`.
- `h1`: `text-transform: uppercase; text-align: center; font-size: 10vw; font-weight: 400;`.
- `p`: `text-transform: uppercase; font-family: "Akkurat Mono"; font-size: 13px;` (small mono caption style).
- `.intro, .outro`: `position: relative; width: 100vw; height: 100vh; background-color: #101214; color: #fff;` flex column, centered both axes, `gap: 4em; overflow: hidden;`.
- `.work`: `position: relative; width: 100vw; overflow: hidden; background-color: #1a1d20;` (slightly lighter charcoal than intro/outro).
- `.row`: `width: 100vw; display: flex;`.
- `.col`: `flex: 1; aspect-ratio: 1;` — so each col is a 25vw × 25vw square and each row is 25vw tall.
- `.img`: `position: relative; width: 100%; height: 100%; will-change: transform;`.
- Transform origins are critical for the effect (images grow out of a top corner):
  - `.img[data-origin="left"] { transform-origin: 0% 0%; }`
  - `.img[data-origin="right"] { transform-origin: 100% 0%; }`

## GSAP effect (be precise)

### Lenis + ScrollTrigger wiring

```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

### Setup

- Safety pass: for every `.img` **without** a `data-origin` attribute, assign one alternating by index — `index % 2 === 0` → `"left"`, otherwise `"right"`.
- Initial state: `gsap.set(".img", { scale: 0, force3D: true });` — all images start invisible at scale 0.

### Per-row ScrollTriggers

Loop over all `.row` elements (`rows.forEach((row, index) => ...)`). Skip rows with no `.img` children. For each qualifying row, set `row.id = "row-" + index` and create **three** ScrollTriggers (give them ids so they can look each other up):

**1. Scale-in trigger** (`id: "scaleIn-" + index`):
- `trigger: row`, `start: "top bottom"`, `end: "bottom bottom-=10%"`, `scrub: 1`, `invalidateOnRefresh: true`.
- No tween — drive it manually in `onUpdate(self)`: only when `self.isActive`, compute
  ```js
  const easedProgress = Math.min(1, self.progress * 1.2);
  const scaleValue = gsap.utils.interpolate(0, 1, easedProgress);
  ```
  and `gsap.set` every image in the row to `{ scale: scaleValue, force3D: true }`. This 1.2 multiplier makes images reach full size at 83% of the trigger distance. Additionally, when `self.progress > 0.95`, hard-snap the row's images to `{ scale: 1, force3D: true }`.
- `onLeave`: snap the row's images to `{ scale: 1, force3D: true }`.

**2. Scale-out trigger with pin** (`id: "scaleOut-" + index`):
- `trigger: row`, `start: "top top"`, `end: "bottom top"`, `pin: true`, `pinSpacing: false`, `scrub: 1`, `invalidateOnRefresh: true`. (With `pinSpacing: false` each row pins at the top of the viewport while the next row slides up over it.)
- `onEnter`: set the row's images to `{ scale: 1, force3D: true }`.
- `onUpdate(self)`:
  - If `self.isActive`: `const scale = gsap.utils.interpolate(1, 0, self.progress);` and `gsap.set` each image to `{ scale, force3D: true, clearProps: self.progress === 1 ? "scale" : "" }` (clear the inline scale only when fully done).
  - Else: if `self.scroll() < self.start` (viewport is above the row), reset the images to `{ scale: 1, force3D: true }`.

**3. Marker/guard trigger** (`id: "marker-" + index`):
- `trigger: row`, `start: "bottom bottom"`, `end: "top top"`, no scrub, no pin.
- In `onEnter`, `onLeave`, and `onEnterBack` (same body in all three): look up the scale-out trigger via `ScrollTrigger.getById("scaleOut-" + index)`; if it exists and its `progress === 0`, force the row's images to `{ scale: 1, force3D: true }`. This guard keeps rows fully visible in the zone between "finished scaling in" and "started scaling out", including when scrolling back up.

### Resize

```js
window.addEventListener("resize", () => { ScrollTrigger.refresh(true); });
```

## Assets / images

**17 moody editorial fashion portraits** (a mix of color — deep reds, teals, warm skin tones — and high-contrast black-and-white studio shots: close-up faces, silhouettes, full-body figures in sculptural garments). Any aspect ratio works because each is cropped into a **1:1 square** cell via `object-fit: cover`; portrait-oriented (2:3-ish) crops look best. Name them `img1.jpeg` … `img17.jpeg` and place them in the HTML order given in the layout table above.

## Behavior notes

- This is a page-level component: Lenis takes over scrolling for the whole page.
- The net choreography: images of a row grow from 0→1 out of their top-left or top-right corner while the row travels up the viewport, the row then sticks to the top of the screen (pinned, no pin spacing) and its images shrink 1→0 as the following row covers it — producing a continuous bloom-and-collapse rhythm through all 10 rows.
- The intro and outro sections have no animation; they simply bookend the grid with full-viewport dark panels.
- All scaling is done through `gsap.set` inside `onUpdate` callbacks (not tweens), so motion smoothness comes entirely from `scrub: 1` + Lenis interpolation.
- Use `force3D: true` on every set to keep the transforms on the GPU; `will-change: transform` is already on `.img`.

## Images

This component ships with 17 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/fiddle-digital-scroll-animation/img1.jpeg
https://motionprompts.dev/c/fiddle-digital-scroll-animation/img10.jpeg
https://motionprompts.dev/c/fiddle-digital-scroll-animation/img11.jpeg
https://motionprompts.dev/c/fiddle-digital-scroll-animation/img12.jpeg
https://motionprompts.dev/c/fiddle-digital-scroll-animation/img13.jpeg
https://motionprompts.dev/c/fiddle-digital-scroll-animation/img14.jpeg
… 11 more under https://motionprompts.dev/c/fiddle-digital-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-2`, `--paper`, `--mute`, `--mark`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener body — the `Lenis` construction, the ticker wiring, the `data-origin` safety pass, the thirty `ScrollTrigger.create` calls (three per row across the ten rows), the resize listener — never runs: the rows sit inert at `scale: 0` forever, with nothing in the console to point at. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its body directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — Give the component a root ref on the wrapper that holds `.intro`, `.work` and `.outro`, and scope both `document.querySelectorAll(".img:not([data-origin])")` and `document.querySelectorAll(".row")` to it. This component carries a second, more specific hazard: every `ScrollTrigger.create` here is keyed by a bare id — `scaleIn-${index}`, `scaleOut-${index}`, `marker-${index}` — built from nothing but the row's position in the loop, and `ScrollTrigger.getById` resolves globally, not per component instance. Render two of these galleries on one page, or let a StrictMode remount fire before the first copy's context reverts, and both instances register a trigger under `scaleIn-3`; the marker trigger's `onEnter`/`onLeave`/`onEnterBack` handlers then call `ScrollTrigger.getById("scaleOut-3")` and can get the other instance's trigger back, snapping the wrong row's images to full scale. Mint a per-mount prefix with `useId()` and build every id as `` `${idPrefix}-scaleIn-${index}` `` (and likewise for `scaleOut-` and `marker-`).

*(3) Cleanup* — Wrap the Lenis setup and all thirty `ScrollTrigger.create` calls in a `gsap.context` scoped to the root ref, and revert it on cleanup; the context tracks every trigger created inside it, so the revert undoes all thirty in one call without naming them individually:

```jsx
useEffect(() => {
  const idPrefix = /* value from useId() */;
  const ctx = gsap.context(() => {
    /* Lenis construction, the ticker wiring, the data-origin pass, and the
       rows.forEach loop, exactly as described above, with every ScrollTrigger
       id namespaced by idPrefix */
  }, rootRef);

  const onResize = () => ScrollTrigger.refresh(true);
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    ctx.revert();
  };
}, []);
```

The vanilla script's `resize` listener is never removed because the document it lives in never goes away; a React instance does, so leaving it bound means every unmounted copy of this gallery keeps forcing a global `ScrollTrigger.refresh(true)` for rows that no longer exist. `gsap.ticker.add((time) => { lenis.raf(time * 1000); })` needs the same treatment as the trigger cleanup but through a different door: the context does not track ticker subscriptions, so keep the function reference and pair it with `gsap.ticker.remove` in the same cleanup — otherwise the ticker keeps calling `lenis.raf` on an instance whose `destroy()` has already run. Call `lenis.destroy()` in that same cleanup. And because this component's own behavior notes describe it as page-level — Lenis is meant to own scroll for the whole document — treat that as a hard constraint when embedding it in a larger app: if the host already runs Lenis, drop the `new Lenis()` call here and reuse the existing instance instead of racing two smooth-scroll loops against the same wheel events.
