# Spotlight Stroke Draw — Pinned Scroll Section Where Thick Diagonal SVG Strokes Paint Over the Screen and Un-paint

## Goal
Build a three-section scroll page whose star effect is a **pinned "spotlight" section** where **13 thick, parallel, diagonal SVG strokes draw themselves on** — one after another in a scattered, staggered order — until they **completely blanket the viewport**, then, at the moment of full cover, the centered headline **swaps underneath** ("WAIT FOR IT" → "THERE IT IS") and **three cartoon sparkles pop**, after which the same strokes **un-draw in reverse**, wiping themselves off the far end to reveal the new message. The whole sequence is one GSAP timeline **scrubbed** to a pinned `ScrollTrigger` (4 viewport-heights of scroll), with Lenis smooth scrolling. The strokes use the classic `strokeDasharray`/`strokeDashoffset` line-drawing trick, and each stroke is **doubled** into a dark outline + yellow fill for a comic-ink look.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`ScrollTrigger`**.
- **`lenis`** — smooth scroll, wired into GSAP's ticker and `ScrollTrigger.update`.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```
Run everything inside `document.addEventListener("DOMContentLoaded", …)`. No other plugins, no framework. **No SplitText, no CustomEase, no lerp/rAF interpolation, no Three.js.**

## Layout / HTML
Three top-level `<section>`s: an **intro** hero, the **spotlight** (the pinned stage), and an **outro** hero. Inside the spotlight, in this DOM order: two overlapping message blocks, then the strokes SVG, then the sparkles SVG. **Paint order matters** — the strokes SVG sits *after* (on top of) both message blocks so the drawn strokes cover the text, and the sparkles SVG is last (on top of the strokes). Class names are load-bearing.

```html
<section class="intro">
  <h1>Blink and you'll miss it</h1>
</section>

<section class="spotlight">
  <div class="spotlight-content spotlight-content-in">
    <h2>Wait for it</h2>
    <p>
      The good part is closer, just one scroll away. Don't blink, or you'll
      miss the moment it turns.
    </p>
  </div>

  <div class="spotlight-content spotlight-content-out">
    <h2>There it is</h2>
    <p>
      That's the kind of payoff worth holding out for. Clean, sharp, and
      right when you needed it.
    </p>
  </div>

  <div class="strokes">
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="#FFF280" stroke-linecap="round">
        <path class="stroke" d="M -251 -42 C 156 -405 595 -695 1176 -648" stroke-width="150" />
        <path class="stroke" d="M -195 90 C 212 -273 651 -562 1232 -516" stroke-width="150" />
        <path class="stroke" d="M -138 223 C 269 -140 707 -430 1288 -383" stroke-width="150" />
        <path class="stroke" d="M -82 355 C 325 -8 764 -297 1345 -250" stroke-width="150" />
        <path class="stroke" d="M -26 488 C 381 125 820 -165 1401 -118" stroke-width="150" />
        <path class="stroke" d="M 30 620 C 438 257 876 -32 1457 15" stroke-width="150" />
        <path class="stroke" d="M 87 753 C 494 390 932 101 1513 147" stroke-width="150" />
        <path class="stroke" d="M 143 885 C 550 522 989 233 1570 280" stroke-width="150" />
        <path class="stroke" d="M 199 1018 C 606 655 1045 366 1626 412" stroke-width="150" />
        <path class="stroke" d="M 255 1150 C 663 788 1101 498 1682 545" stroke-width="150" />
        <path class="stroke" d="M 312 1283 C 719 920 1157 631 1738 677" stroke-width="150" />
        <path class="stroke" d="M 368 1416 C 775 1053 1214 763 1795 810" stroke-width="150" />
        <path class="stroke" d="M 424 1548 C 831 1185 1270 896 1851 942" stroke-width="150" />
      </g>
    </svg>
  </div>

  <svg class="sparkles" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <g fill="#fff" stroke="#141414" stroke-width="4" stroke-linejoin="round">
      <g transform="translate(360 230) scale(1.5)">
        <path class="sparkle" vector-effect="non-scaling-stroke" d="M 0 -55 C 8 -16 16 -8 55 0 C 16 8 8 16 0 55 C -8 16 -16 8 -55 0 C -16 -8 -8 -16 0 -55 Z" />
      </g>
      <g transform="translate(1180 520) scale(1)">
        <path class="sparkle" vector-effect="non-scaling-stroke" d="M 0 -55 C 8 -16 16 -8 55 0 C 16 8 8 16 0 55 C -8 16 -16 8 -55 0 C -16 -8 -8 -16 0 -55 Z" />
      </g>
      <g transform="translate(640 730) scale(0.65)">
        <path class="sparkle" vector-effect="non-scaling-stroke" d="M 0 -55 C 8 -16 16 -8 55 0 C 16 8 8 16 0 55 C -8 16 -16 8 -55 0 C -16 -8 -8 -16 0 -55 Z" />
      </g>
    </g>
  </svg>
</section>

<section class="outro">
  <h1>Told you it was worth it</h1>
</section>

<script type="module" src="./script.js"></script>
```

Notes on structure:
- **Keep the 13 stroke `<path>` `d` strings and `stroke-width="150"` exactly as above.** They are 13 near-parallel, gently-curved cubic beziers marching top-to-bottom (each start-point `y` steps down ~132 units), each 150 units thick in the `1600×900` viewBox — since 150 > the 132 vertical spacing, the bands **overlap and fully tile the viewport** when all are drawn. `preserveAspectRatio="xMidYMid slice"` makes the SVG cover-fill the container. `stroke-linecap="round"` gives rounded ends.
- The stroke group is `fill="none" stroke="#FFF280"` (pale yellow) — the JS will clone each path into a dark outline layer at runtime (see effect).
- **Keep the 3 sparkle `<path>` `d` and their wrapping `<g transform>`s exactly** — three four-pointed "twinkle" shapes at `(360,230) scale(1.5)`, `(1180,520) scale(1)`, `(640,730) scale(0.65)`, white fill with a `#141414` 4px `non-scaling-stroke` outline. Each `.sparkle` starts at `transform: scale(0)` (hidden) via CSS.
- Copy is neutral demo text — use it verbatim, no brands.

## Styling
Fonts (Google Fonts): **Barlow Condensed** (all weights 100–900, italics too; used for the big uppercase headings) and **DM Sans** (variable optical-size + weight; used for the spotlight paragraph).
```css
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100..900;1,100..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap");
```

Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `body { font-family:"Barlow Condensed", sans-serif; }`.

Sections — each is a full-screen panel with the same pink→yellow gradient:
```css
section {
  position: relative;
  width: 100%;
  height: 100svh;
  background: linear-gradient(90deg, #ff668c 0%, #fff280 100%); /* hot-pink → pale-yellow */
  color: #141414;                                               /* near-black text */
  overflow: hidden;
}
```

Intro / outro heroes — one big centered uppercase headline:
```css
.intro, .outro {
  display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 2rem;
}
.intro h1, .outro h1 {
  text-transform: uppercase;
  font-weight: 900;
  font-size: clamp(2.5rem, 7vw, 6rem);
  letter-spacing: -2%;
  line-height: 0.8;
  max-width: 15ch;
}
```

Spotlight messages — two absolutely-stacked, centered blocks filling the section:
```css
.spotlight-content {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  text-align: center; padding: 0 8vw;
}
.spotlight-content h2 {
  text-transform: uppercase; font-weight: 900;
  font-size: clamp(2.2rem, 5.5vw, 4.5rem);
  letter-spacing: -2%; line-height: 0.9; max-width: 14ch;
}
.spotlight-content p {
  margin-top: 1.5rem;
  font-family: "DM Sans", sans-serif;
  font-size: clamp(1.1rem, 1.8vw, 1.6rem);
  font-weight: 400; line-height: 1.25; max-width: 25ch;
}
.spotlight-content-out { opacity: 0; } /* second message starts hidden */
```

Overlay layers:
```css
.strokes {
  position: absolute; inset: -10%;
  width: 120%; height: 120%;         /* over-sized so bands overshoot the edges */
  pointer-events: none;
}
.strokes svg { width: 100%; height: 100%; overflow: visible; }
.stroke { will-change: stroke-dashoffset; }

.sparkles {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  overflow: visible; pointer-events: none;
}
.sparkle { will-change: transform; transform: scale(0); }
```

Responsive: `@media (max-width:1000px) { .spotlight-content { padding: 0 6vw; } }`.

## GSAP effect (the important part — be exhaustive)

Module-level constants (use these exact values):
```js
const STROKE_STAGGER = 0.045;    // base per-step stagger (timeline seconds)
const STROKE_DRAW_TIME = 1.25;   // base per-stroke draw duration
const OUTLINE_WIDTH = 7;         // dark outline is 7 units wider than the yellow fill
const SPOTLIGHT_PIN_HEIGHT = 4;  // pin lasts 4 viewport-heights of scroll
const STROKE_DRAW_ORDER = [0, 12, 2, 10, 4, 8, 6, 1, 3, 5, 7, 9, 11]; // scattered reveal order
```

### 1. Lenis + GSAP ticker wiring
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000)); // ticker seconds → Lenis ms
gsap.ticker.lagSmoothing(0);
```

### 2. Double each stroke into outline + fill (the comic-ink trick)
For every `.stroke` path, clone it into a **dark outline** painted *behind* a slightly-narrower **yellow fill**, then prime both for line-drawing. Build an array of `{ layers:[outline, fill], length }`:
```js
const strokes = Array.from(document.querySelectorAll(".stroke")).map((fill) => {
  const fillWidth = parseFloat(fill.getAttribute("stroke-width"));  // 150
  const outline = fill.cloneNode(true);
  outline.setAttribute("stroke", "#141414");                        // dark outline, still width 150
  fill.setAttribute("stroke-width", fillWidth - OUTLINE_WIDTH);     // yellow fill narrowed to 143
  fill.before(outline);                                             // outline inserted BEFORE → paints underneath

  const length = fill.getTotalLength();
  const layers = [outline, fill];
  layers.forEach((layer) => {
    layer.style.strokeDasharray = length;
    layer.style.strokeDashoffset = length;   // one dash the full length, pushed off the end → invisible
  });
  return { layers, length };
});
```
Result per stroke: a `#141414` outline (150 wide) under a `#FFF280` fill (143 wide) → a ~3.5px dark border rims each yellow band. Both layers animate together (they share the `layers` array). All strokes start fully hidden.

```js
const sparkles = gsap.utils.toArray(".sparkle");
const messageBefore = document.querySelector(".spotlight-content-in");
const messageAfter  = document.querySelector(".spotlight-content-out");
```

### 3. Per-stroke timing helpers
`order` is the position within `STROKE_DRAW_ORDER` (0…12), `strokeIndex` is which of the 13 paths it draws.
```js
const startTime    = (order) => order * STROKE_STAGGER;                       // 0, 0.045, 0.09, …
const timingWobble = (order) => (order % 2 === 0 ? 0 : STROKE_STAGGER * 0.6); // odd orders get +0.027 jitter
const drawDuration = (order) => STROKE_DRAW_TIME + (order % 3) * 0.12;        // 1.25 / 1.37 / 1.49 cycling
```

### 4. The scrubbed, pinned ScrollTrigger
One master timeline (no repeat), driven entirely by a pinned ScrollTrigger:
```js
const timeline = gsap.timeline();

ScrollTrigger.create({
  trigger: ".spotlight",
  start: "top top",
  end: () => `+=${window.innerHeight * SPOTLIGHT_PIN_HEIGHT}px`, // pins for 4 viewport-heights
  pin: true,
  pinSpacing: true,
  scrub: 1,            // 1s catch-up smoothing between scroll and timeline
  animation: timeline,
});
```

### 5. Draw-in phase (strokes paint over the screen)
Precompute each step's start-time and duration, and the moment everything is covered:
```js
const drawSteps = STROKE_DRAW_ORDER.map((strokeIndex, order) => ({
  strokeIndex,
  at: startTime(order) + timingWobble(order),
  duration: drawDuration(order),
}));
const coveredAt = Math.max(...drawSteps.map((s) => s.at + s.duration)); // ≈ 2.012

drawSteps.forEach(({ strokeIndex, at, duration }) => {
  timeline.to(
    strokes[strokeIndex].layers,
    { strokeDashoffset: 0, duration, ease: "power2.out" }, // length → 0: band draws itself on
    at,                                                    // absolute position on the timeline
  );
});
```
Each stroke's `strokeDashoffset` tweens `length → 0` on `power2.out`, so the yellow-with-dark-border band snakes into view. Because `at = order*0.045 (+0.027 on odd orders)` and the draw order is the scattered `[0,12,2,10,4,8,6,1,3,5,7,9,11]`, the bands appear in a shuffled, overlapping cascade rather than plain top-to-bottom — by `coveredAt ≈ 2.012s` the 13 overlapping bands fully tile the viewport, hiding the message underneath.

Concrete first few steps (for reference): order 0 → stroke 0 at `0.000` dur `1.25`; order 1 → stroke 12 at `0.072` dur `1.37`; order 2 → stroke 2 at `0.090` dur `1.49`; order 3 → stroke 10 at `0.162` dur `1.25`; … order 11 → stroke 9 at `0.522` dur `1.49` (this is the last-to-finish → sets `coveredAt`).

### 6. The message swap (instant, hidden under full cover)
At `coveredAt`, snap the visible message out and the second one in — invisible because the strokes fully blanket the screen at that instant:
```js
timeline.set(messageBefore, { opacity: 0 }, coveredAt);
timeline.set(messageAfter,  { opacity: 1 }, coveredAt);
```

### 7. Draw-out phase (strokes wipe off the far end, reverse order)
Reverse the draw order and continue each dashoffset **past zero into negative** — the drawn band slides off in its own drawing direction (it does **not** rewind), uncovering the new message. Positions are relative to `coveredAt`, reusing the same `startTime`/`timingWobble`/`drawDuration` cadence:
```js
[...STROKE_DRAW_ORDER].reverse().forEach((strokeIndex, order) => {
  const { layers, length } = strokes[strokeIndex];
  timeline.to(
    layers,
    { strokeDashoffset: -length, duration: drawDuration(order), ease: "power2.in" },
    coveredAt + startTime(order) + timingWobble(order),
  );
});
```
Note the ease flips to `power2.in` for the exit (vs `power2.out` on the entrance). Total timeline runs ~4s of "content time," stretched across the 4-viewport pinned scroll by the scrub.

### 8. Sparkle pops (three twinkles around the reveal moment)
Each sparkle scales up with a back-overshoot while rotating, then scales back to 0, staggered `0.25s` apart, centered just before `coveredAt`:
```js
sparkles.forEach((sparkle, index) => {
  const popAt = coveredAt - 0.4 + index * 0.25; // ≈ 1.612, 1.862, 2.112
  timeline
    .fromTo(
      sparkle,
      { scale: 0, rotate: -60, transformOrigin: "center" },
      { scale: 1, rotate: 60, duration: 0.5, ease: "back.out(2)" },
      popAt,
    )
    .to(
      sparkle,
      { scale: 0, rotate: 140, duration: 0.5, ease: "back.in(2)" },
      popAt + 0.6, // start shrinking 0.6s after popping in
    );
});
```
Pop-in: `scale 0→1`, `rotate -60°→60°`, `back.out(2)`. Pop-out: `scale 1→0`, `rotate 60°→140°`, `back.in(2)`. The three sparkles flash white right as the strokes finish covering and the headline turns over.

## Assets / images
**None.** The entire visual is CSS gradient + type + two inline SVGs (the 13 strokes and the 3 sparkles). Do not add image files.

## Behavior notes
- **Trigger:** scroll only, fully scrubbed inside a pinned section. Nothing autoplays; parking the scroll freezes the strokes mid-draw, and reversing scroll un-covers the screen and reverts the message swap.
- **Fresh load (scroll=0):** intro hero visible; the spotlight (once reached) shows "WAIT FOR IT" with all strokes hidden and all sparkles at `scale(0)`; the "THERE IT IS" block is `opacity:0`.
- **Layering is essential:** strokes SVG paints over both messages; sparkles SVG paints over the strokes; both overlays are `pointer-events:none`. `overflow:visible` on the SVGs plus the `120%` over-sized `.strokes` container let the thick bands overshoot the edges with no gaps.
- The `end` uses a function (`() => …`) so the pin length re-resolves on refresh/resize against the current `window.innerHeight`.
- No reduced-motion guard in the original.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--rose`, `--coral`, `--gold`, `--cream`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a `DOMContentLoaded` listener that wires a `Lenis` instance into `gsap.ticker`, doubles each of the 13 `.stroke` paths into a dark outline layer by cloning it, and hands one un-repeated `gsap.timeline()` to a single pinned, scrubbed `ScrollTrigger` on `.spotlight`. It runs once, on a page that never unmounts, so nothing here was ever written to be undone. React withdraws that guarantee, and this component is worse-positioned than most to survive the loss, because half its setup is not a GSAP call at all — it is `cloneNode`, `insertBefore` and raw attribute writes that `gsap.context` never records.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Run this setup twice without tearing the first pass down and three things go wrong at once: two `Lenis` instances both pump `raf` off the same `gsap.ticker`; two pins land on `.spotlight`, each inserting its own spacer and doubling the section's scrollable length, so the four-viewport pin no longer corresponds to the scroll distance `SPOTLIGHT_PIN_HEIGHT` was meant to reserve; and the `.stroke` tree ends up cloned on top of itself — the second pass's `document.querySelectorAll(".stroke")` matches not just the 13 original paths but the 13 outline clones the first pass already inserted, because `cloneNode(true)` copies the `class="stroke"` attribute along with everything else. The second pass then clones those clones, shrinks their `stroke-width` a second time from an already-shrunk value, and builds a `strokes` array with duplicate, mis-sized entries feeding competing tweens. None of this throws. The bands just come out the wrong width and color, drawn over each other, and it will not reproduce in a production build, because React only double-invokes effects in development.

*(1) The entry point* — delete the `document.addEventListener("DOMContentLoaded", ...)` wrapper; by the time a React component mounts, that event has already fired, so the listener would simply never run. Move its body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` and the module-level constants (`STROKE_STAGGER`, `STROKE_DRAW_TIME`, `OUTLINE_WIDTH`, `SPOTLIGHT_PIN_HEIGHT`, `STROKE_DRAW_ORDER`) are one-time, page-wide configuration and pure data — leave them where they are, at module scope outside the component, instead of re-declaring the order array on every mount.

*(2) Element lookups* — scope `.spotlight`, `.stroke`, `.sparkle`, `.spotlight-content-in` and `.spotlight-content-out` to a root ref on the wrapper that contains all three sections; `gsap.context`'s selector text resolves against that ref, so `.intro` and `.outro` don't strictly need to be inside it, but `.spotlight` and everything nested under it do. `document.querySelectorAll(".stroke")` is the one lookup here that needs more than scoping — it needs to be idempotent, or the double-clone failure mode above repeats on every remount regardless of how carefully the rest of the effect is scoped. Capture the 13 original fill paths once, before any outline exists, and don't re-query for them later; the cleanup described next is what keeps the next mount's query from finding leftovers.

*(3) Cleanup* — wrap the outline-cloning pass, the timeline, and the `ScrollTrigger.create` call in one `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, the outline-cloning pass, the timeline, ScrollTrigger.create
  }, rootRef);
  return () => {
    gsap.ticker.remove(onTick);
    lenis.destroy();
    outlines.forEach((node) => node.remove());
    fills.forEach((fill, i) => fill.setAttribute("stroke-width", originalWidths[i]));
    ctx.revert();
  };
}, []);
```

`ctx.revert()` kills the pinned `ScrollTrigger` — removing its spacer and restoring `.spotlight` to unpinned layout — and reverts every `strokeDashoffset` tween on every layer back to the value it held when the timeline was built. What it does not reach is threefold. First, `gsap.ticker.add((time) => lenis.raf(time * 1000))`: a ticker subscription is neither a tween nor a trigger, and it is the only thing driving Lenis here (this script has no `requestAnimationFrame` loop of its own), so it needs an explicit `gsap.ticker.remove` against the same function reference. Second, the `Lenis` instance itself needs `destroy()` — its `lenis.on("scroll", ScrollTrigger.update)` subscription goes with it, no separate teardown required. Third, the outline-cloning pass is plain DOM mutation: `cloneNode`, `fill.before(outline)`, the `stroke`/`stroke-width` attribute writes, and the direct `layer.style.strokeDasharray = length` / `strokeDashoffset = length` assignments that prime the line-drawing trick before any tween touches the layers. None of that goes through `gsap.set` or a tween, so `gsap.context` never saw it and `ctx.revert()` walks past it untouched. Keep the array of inserted outline nodes and the original `stroke-width` values around specifically so the cleanup can remove the clones and put the 13 fills back to their un-narrowed width — that is what keeps the next mount's `querySelectorAll(".stroke")` seeing exactly 13 plain paths instead of an accumulating clone tree.

This component owns its `Lenis` instance and is written as a complete page — correct as long as it stays one. Folded into a larger app that already runs smooth scroll, lift `new Lenis()` to the app shell and have this effect subscribe to the existing instance instead of fighting it for the same wheel event; two instances driven off the same `gsap.ticker` will otherwise both call `raf` on every tick, and the scrub on `.spotlight` will visibly stutter against `ScrollTrigger.update` firing twice per scroll event.
