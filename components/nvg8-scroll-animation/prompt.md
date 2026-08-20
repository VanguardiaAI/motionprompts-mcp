# Nvg8 Scroll Animation — Pinned Scroll-Scrubbed SVG Stroke Reveal

## Goal
Build a single full-screen intro that is **pinned for eight viewport heights and scrubbed with Lenis smooth scroll**, driving one GSAP timeline. As you scroll: **nine thick, rounded, outlined SVG bars draw themselves on** (via `strokeDashoffset`) in a deliberately shuffled order across three horizontal rows; then **two big curved strokes draw on and then un-draw**; at the timeline's midpoint the whole section **flips from a warm light theme to a dark theme with a swapped headline**; and finally the three rows of bars **slide off to the right** with a stagger to reveal a plain outro section. Every bar has a darker cloned "border" path behind it, so each colored stroke reads as an outlined shape. The star effect is the staggered scroll-scrubbed stroke-drawing choreography.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`ScrollTrigger`**.
- **`lenis`** — smooth scroll, wired into GSAP's ticker.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```

No other plugins, no framework. Run everything inside `document.addEventListener("DOMContentLoaded", …)`.

## Layout / HTML
Two `<section>`s: `.intro` (the pinned stage) and `.outro`. Class names and SVG `id`s are load-bearing — the JS queries them.

```html
<section class="intro">
  <h1 class="intro-header-in">Scroll down to watch calm quietly unravel</h1>
  <h1 class="intro-header-out">Welcome back, things have shifted again</h1>

  <!-- Three rows of thick horizontal bars -->
  <div class="svg-container">
    <div class="svg-row">
      <svg id="svg-top-1"    viewBox="0 0 3360 360" …>…</svg>
      <svg id="svg-top-2"    viewBox="0 0 3360 360" …>…</svg>
      <svg id="svg-top-3"    viewBox="0 0 3360 360" …>…</svg>
    </div>
    <div class="svg-row">
      <svg id="svg-middle-1" viewBox="0 0 3360 360" …>…</svg>
      <svg id="svg-middle-2" viewBox="0 0 3360 360" …>…</svg>
      <svg id="svg-middle-3" viewBox="0 0 3360 360" …>…</svg>
    </div>
    <div class="svg-row">
      <svg id="svg-bottom-1" viewBox="0 0 3360 360" …>…</svg>
      <svg id="svg-bottom-2" viewBox="0 0 3360 360" …>…</svg>
      <svg id="svg-bottom-3" viewBox="0 0 3360 360" …>…</svg>
    </div>
  </div>

  <!-- Two overlapping curved strokes, in the MIDDLE of a 3-row container -->
  <div class="svg-container-2">
    <div class="svg-row"></div>
    <div class="svg-row">
      <svg id="svg-curve-1" viewBox="0 0 2248 1112" …>…</svg>
      <svg id="svg-curve-2" viewBox="0 0 2248 1112" …>…</svg>
    </div>
    <div class="svg-row"></div>
  </div>
</section>

<section class="outro">
  <h1>This is the outro, pretend it’s profound</h1>
</section>

<script type="module" src="./script.js"></script>
```

### SVG geometry (exact)
Every SVG has `width`/`height` matching its viewBox, `fill="none"`, and one `<path>`.

- **The nine horizontal bars** (`svg-top-*`, `svg-middle-*`, `svg-bottom-*`): `viewBox="0 0 3360 360"`, path `d="M180 180H3180"` — a straight horizontal line at mid-height from x=180 to x=3180. Stroke attributes: `stroke-width="360"`, `stroke-miterlimit="3.8637"`, `stroke-linecap="round"`. With the 360-wide round-capped stroke the line reads as a **fat pill/bar spanning nearly the full 3360 width**.
- **The two curves** (`svg-curve-1`, `svg-curve-2`): `viewBox="0 0 2248 1112"`, path `d="M180 180.538C1512.01 180.54 1718.64 133.099 2067.5 931.594"` — one cubic bézier that runs nearly flat across the top then hooks steeply down on the right. Same `stroke-width="360"`, `stroke-miterlimit="3.8637"`, `stroke-linecap="round"`. Both curves have identical geometry, only their `stroke` color differs.

### Per-element stroke colors (the `stroke` attribute on each path)
```
svg-top-1    #FF6D38   (orange)        svg-middle-1 #7A78FF   (indigo)
svg-top-2    #C6FE69   (lime)          svg-middle-2 #B9DDFD   (pale blue)
svg-top-3    #7A78FF   (indigo)        svg-middle-3 #C6FE69   (lime)
svg-bottom-1 #FFC412   (gold)          svg-curve-1  #ffc412   (gold)
svg-bottom-2 #FF6D38   (orange)        svg-curve-2  #FF6D38   (orange)
svg-bottom-3 #B9DDFD   (pale blue)
```

Copy is neutral (no brands). "Nvg8" is only the fictional demo name; keep the three headline strings verbatim.

## Styling
Font (Google Fonts): **Barlow Condensed**, import the full weight range (100–900, roman + italic).

Reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `body { font-family:"Barlow Condensed", sans-serif; overflow-x:hidden; }`.

Type: `h1 { text-transform:uppercase; font-size:4rem; font-weight:800; line-height:0.85; }`.

Sections and theme:
- `section { position:relative; width:100%; height:100svh; overflow:hidden; background-color:#e3e3db; }` — the light warm-grey base theme.
- `section h1 { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:50%; text-align:center; }` — headline centered over everything.
- `h1.intro-header-out { display:none; }` — the "out" headline is hidden by default.
- Dark-theme override, toggled by a class `out` on `.intro`:
  ```css
  .intro.out { background-color:#141414; color:#fff; }
  .intro.out h1.intro-header-in  { display:none; }
  .intro.out h1.intro-header-out { display:block; }
  ```
  So flipping `.intro.out` on both swaps the background/text color to dark **and** swaps which headline is visible.

Stroke stage layout:
- `.svg-container, .svg-container-2 { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:300%; height:calc(100svh - 7.5px); display:flex; flex-direction:column; justify-content:center; align-items:center; }` — **both stages are 300% of viewport width** (so the bars overflow far past both edges and only their middle is visible) and centered.
- `.svg-row { position:relative; flex:1; width:100%; height:100%; will-change:transform; }` — three equal-height rows stacked vertically.
- `.svg-row svg { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; height:100%; overflow:visible; }` — every bar fills its row; `overflow:visible` so the fat stroke and its border aren't clipped.
- `.svg-container-2 svg { position:absolute; top:0%; left:40%; height:310%; object-fit:contain; transform:translate(-50%,-1%); }` — the two curves are pulled left of center and blown up to 310% row height so the bézier sweeps across a big diagonal region.
- `.svg-row svg path { will-change:stroke-dashoffset; }`.

Responsive: `@media (max-width:1000px) { section h1 { width:90%; } .svg-container, .svg-container-2 { width:1000%; } }` — on narrow screens the stages balloon to 1000% width so the visible slice of the bars stays proportionally similar.

## GSAP effect (the important part — be exact)

### Smooth-scroll wiring (Lenis ↔ GSAP)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### DOM prep (runs before building the timeline — three passes)

**Pass 1 — clone a dark "border" path behind every stroke.** Iterate **every** `.svg-row svg path` (this matches all 9 bars AND both curves). Clone each path, recolor the clone to `#0f0f0f`, make it `originalWidth + 10` wide (so `370` for all of them), tag it `.border-path`, and insert it **before** its original inside the same `<svg>`:
```js
document.querySelectorAll(".svg-row svg path").forEach((originalPath) => {
  const borderPath = originalPath.cloneNode(true);
  const originalWidth = parseInt(originalPath.getAttribute("stroke-width"));
  borderPath.setAttribute("stroke", "#0f0f0f");
  borderPath.setAttribute("stroke-width", originalWidth + 10);
  borderPath.classList.add("border-path");
  originalPath.parentElement.insertBefore(borderPath, originalPath);
});
```
Because the clone sits **behind** the colored path but is 10px wider, a thin near-black outline shows around every bar/curve. Each `#svg-…` now contains **two** paths (border + colored), and every subsequent `#id path` query animates both together.

**Pass 2 — grow the curve viewBoxes vertically.** For each `.svg-container-2 svg`, expand the viewBox by 10 up top and 20 in height so the fatter border stroke's round cap isn't clipped:
```js
document.querySelectorAll(".svg-container-2 svg").forEach((svg) => {
  const [x, y, width, height] = svg.getAttribute("viewBox").split(" ").map(Number);
  svg.setAttribute("viewBox", `${x} ${y - 10} ${width} ${height + 20}`);
});
```
(So `0 0 2248 1112` → `0 -10 2248 1132`.)

**Pass 3 — prime dash-drawing on every path.** For each `.svg-row svg path` (now including the border clones), set `strokeDasharray` and `strokeDashoffset` both equal to the path's own length, so **all strokes start fully hidden**:
```js
document.querySelectorAll(".svg-row svg path").forEach((path) => {
  const pathLength = path.getTotalLength();
  path.style.strokeDasharray = pathLength;
  path.style.strokeDashoffset = pathLength;
});
```

### The pinned, scrubbed ScrollTrigger
One timeline `tl = gsap.timeline()`, driven by one ScrollTrigger on `.intro`:
```js
const introSection = document.querySelector(".intro");
ScrollTrigger.create({
  trigger: introSection,
  start: "top top",
  end: `+=${window.innerHeight * 8}px`,   // pinned across EIGHT viewport heights
  pin: true,
  pinSpacing: true,
  scrub: 1,                                // 1s catch-up smoothing on the scrub
  animation: tl,
  onUpdate: (self) => {
    if (self.progress >= 0.5) introSection.classList.add("out");
    else introSection.classList.remove("out");
  },
});
```
The **theme flip is not a tween** — it's driven purely by `onUpdate`: crossing 50% scroll progress toggles the `.out` class (dark bg + swapped headline), and scrolling back up removes it.

### Timeline contents (exact order, positions, durations, eases)

All positions below are absolute times (in timeline "seconds") passed as the 3rd arg to `tl.to(...)`; the scrub maps the whole timeline linearly onto the 8-viewport scroll runway.

**1) Nine bars draw on, in a shuffled order, each staggered by 0.3.** Loop this exact `strokeRevealOrder` and place tween `i` at `i * 0.3`:
```js
const strokeRevealOrder = [
  "svg-top-1", "svg-bottom-1", "svg-middle-1",
  "svg-top-2", "svg-bottom-2", "svg-middle-2",
  "svg-top-3", "svg-middle-3", "svg-bottom-3",
];
strokeRevealOrder.forEach((id, index) => {
  tl.to(document.querySelectorAll(`#${id} path`),
    { strokeDashoffset: 0, duration: 1.5, ease: "power2.out" },
    index * 0.3);
});
```
So the reveal times are: top-1 @0.0, bottom-1 @0.3, middle-1 @0.6, top-2 @0.9, bottom-2 @1.2, middle-2 @1.5, top-3 @1.8, middle-3 @2.1, bottom-3 @2.4. Each bar draws left→right (its path starts at x=180) over 1.5s with `power2.out`. The order deliberately fills column 1 (top→bottom→middle), then column 2, then column 3 — a scattered, non-linear fill.

**2) Two curves draw on, then un-draw.** `curveStartTime = 5 * 0.3 + 0.3 = 1.8`. For each of `["svg-curve-1","svg-curve-2"]` at index, with `curveStartAt = 1.8 + index * 1`:
```js
["svg-curve-1", "svg-curve-2"].forEach((id, index) => {
  const paths = document.querySelectorAll(`#${id} path`);
  const pathLength = paths[0].getTotalLength();
  const curveStartAt = 1.8 + index * 1;
  tl.to(paths, { strokeDashoffset: 0,           duration: 1,   ease: "power2.out"   }, curveStartAt);
  tl.to(paths, { strokeDashoffset: -pathLength, duration: 1.5, ease: "power2.inOut" }, curveStartAt + 1);
});
```
- curve-1: **draws on** @1.8 (dur 1, `power2.out`, offset → 0), then **un-draws** @2.8 (dur 1.5, `power2.inOut`, offset → `-pathLength`, so the tail wipes off the far end).
- curve-2: draws on @2.8, un-draws @3.8.
Because the two curves overlap in place (different colors) and are offset by 1s, they read as a single curved stroke that sweeps on and then peels away.

**3) The three bar-rows slide off to the right (the exit).** Target only `.svg-container .svg-row` (the 3 horizontal rows, NOT the curve container), placed at `">-0.5"` (start 0.5s before the previous tween's end, i.e. ~4.8):
```js
tl.to(document.querySelectorAll(".svg-container .svg-row"),
  { xPercent: 100, duration: 2, ease: "power3.inOut", stagger: 0.15 },
  ">-0.5");
```
Each row translates `xPercent: 100` (fully off to the right), staggered by 0.15, easing `power3.inOut` — the whole grid of bars glides out to unveil the base background, right as the scroll approaches the end of the pinned runway.

**No SplitText, no CustomEase, no lerp/rAF interpolation, no Three.js.** The entire effect is: dash-offset stroke drawing + one class-toggle theme flip + an `xPercent` exit, all inside one pinned, scrubbed timeline.

## Assets / images
**None.** There are no raster images — every visual is an inline `<svg>` path (nine fat horizontal bars + two curved strokes), colored via the `stroke` attribute and outlined by the cloned dark border paths described above.

## Behavior notes
- **Trigger:** scroll only, fully scrubbed. Parking the scroll freezes the choreography mid-draw; scrolling up reverses everything, including un-toggling the dark theme below 50% progress.
- **Pinned for `window.innerHeight * 8`** with `pinSpacing: true`, so ScrollTrigger inserts the spacer that gives the timeline its runway. `scrub: 1` adds 1s of smoothing.
- **`svh` units** (`100svh`, `calc(100svh - 7.5px)`) keep the full-screen stage stable under mobile browser chrome.
- The `end` uses `window.innerHeight` captured at build time (no `invalidateOnRefresh` in the original) — desktop-first; on narrow screens the stages widen to `1000%` and the headline to `90%`.
- Keep the `will-change` hints (`transform` on `.svg-row`, `stroke-dashoffset` on paths) for smooth scrubbing. No reduced-motion guard in the original.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--coral`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, wires Lenis into GSAP's ticker, mutates the SVG markup in three passes, and only then builds the one pinned, scrubbed timeline — and never has to undo any of it. React withdraws that guarantee, and this component's own DOM-prep passes are exactly where the withdrawal bites hardest, because two of the three write to the DOM directly (`cloneNode`, `insertBefore`, `setAttribute`) rather than through GSAP, so nothing about `gsap.context` reaches them.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before the screen updates — and the mounted JSX subtree is **not** torn down between those two runs, only the effect body re-executes. That distinction is what turns this component's prep passes into a real bug rather than a theoretical one. Pass 1 walks every `.svg-row svg path` and inserts a `.border-path` sibling in front of it; run twice without removing what the first run inserted, and the second pass clones the clones — the eleven original paths (nine bars, two curves) become twenty-two live elements after the first pass and grow again after the second, some now `#0f0f0f`-on-`#0f0f0f`. Pass 2 reads each curve `<svg>`'s current `viewBox`, subtracts from `y` and adds to `height`; it has no baseline to return to, so a second, uncleaned run subtracts and adds a second time onto numbers the first run already shifted, and the round caps clip or overshoot depending on which pass you're looking at. Both of these are visible on the very first StrictMode double-invoke in dev, not on some later remount.

*(1) The entry point* — the whole body, from `new Lenis()` through the final `tl.to(...)` that slides the rows off, runs inside `document.addEventListener("DOMContentLoaded", ...)`. That event has already fired by the time a React component mounts, so the listener registers and is never called: no Lenis instance, no border paths, no pinned `.intro`, nothing to scroll through, and no error pointing at why. Delete the listener and move its entire body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can stay at module scope — re-registering per mount is harmless but pointless.

*(2) Element lookups* — this script leans on `id` selectors more than most in this catalogue: nine bar ids (`svg-top-1` through `svg-bottom-3`) and two curve ids, each read through a template literal (`` `#${id} path` ``), plus `.intro`, `.svg-container-2 svg` and `.svg-container .svg-row`. `id` is a document-global attribute, and during the StrictMode double-mount two transient copies of this markup carry the same eleven ids at once, so `document.querySelectorAll("#svg-top-1 path")` matches whichever copy's paths happen to be in the document — live or on its way out. Give the wrapping `<section class="intro">` a root ref and run every one of these lookups, the `#${id}` ones included, on `rootRef.current` instead of `document`. Scoping the *call*, not the selector text, is what fixes it: `Element.querySelectorAll` only searches that element's own descendants, so `rootRef.current.querySelectorAll("#svg-top-1 path")` still resolves correctly even while a second, unmounting `#svg-top-1` sits elsewhere in the tree.

*(3) Cleanup* — wrap the Lenis wiring, the three DOM-prep passes, the timeline and the `ScrollTrigger.create` call in one `gsap.context` scoped to the root ref, and capture what the prep passes are about to touch before the factory runs:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const borderPaths = [];
  const originalViewBoxes = new Map(
    Array.from(root.querySelectorAll(".svg-container-2 svg"), (svg) => [svg, svg.getAttribute("viewBox")]),
  );

  const lenis = new Lenis();
  const onTick = (time) => lenis.raf(time * 1000);

  const ctx = gsap.context(() => {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    root.querySelectorAll(".svg-row svg path").forEach((originalPath) => {
      const borderPath = originalPath.cloneNode(true);
      /* recolor, widen, insertBefore — exactly as above */
      borderPaths.push(borderPath);
    });

    /* Pass 2 (grow the curve viewBoxes), Pass 3 (prime the dash offsets), the
       timeline, and ScrollTrigger.create({ trigger: root.querySelector(".intro"), ... })
       go here, unchanged */
  }, rootRef);

  return () => {
    ctx.revert();
    gsap.ticker.remove(onTick);
    lenis.destroy();
    borderPaths.forEach((el) => el.remove());
    originalViewBoxes.forEach((viewBox, svg) => svg.setAttribute("viewBox", viewBox));
  };
}, []);
```

`ctx.revert()` covers exactly what GSAP created inside that factory: the pinned `ScrollTrigger` — and with it the pin-spacer it inserted around `.intro` — plus every tween on the timeline: the nine staggered stroke reveals, the two curve draw-then-undraw pairs, and the row slide-off. It does **not** reach the four lines above it in the returned cleanup, and none of those four are GSAP's doing. `gsap.ticker.add(onTick)` is a ticker subscription, not a tween or a trigger, so an unreverted context leaves it firing into whatever `lenis` used to be; remove `onTick` before calling `lenis.destroy()`, not after, or a tick that lands between the two calls calls `.raf()` on an instance that no longer exists. The `.border-path` clones and the rewritten `viewBox` strings are plain DOM writes from `cloneNode`/`insertBefore`/`setAttribute` — invisible to a context that only tracks GSAP's own output — so they need the explicit removal and restore shown above, using exactly the list and the map the effect built before the factory ran. Skip either one and the next mount compounds it: more phantom border paths, a `viewBox` drifting further from its authored values.
