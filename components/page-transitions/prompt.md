# Block Grid Page Transitions — A 10×11 Grid of Blocks Curtains Over the Viewport to Swap Pages

## Goal
Build a tiny single-page "fake router" site (three virtual pages: **Index / About / Contact**) with a fixed top navbar and one giant centered heading. The star effect is the **page transition**: clicking a nav link fires a two-phase GSAP sequence over a fullscreen **10-row × 11-column grid of solid blocks**. **Cover phase** — a grid of blocks *grows up from the bottom* (`scaleY: 0 → 1`, `transform-origin: bottom`), each block starting on its own per-row random delay, until the whole viewport is blanketed. The heading text is swapped underneath at the exact moment of full coverage. **Reveal phase** — a *second* grid of blocks (already covering) *shrinks up toward the top* (`scaleY: 1 → 0`, `transform-origin: top`) with the same per-block random stagger, uncovering the new page. The same reveal also plays **once on initial load** as a page-in. Every block tween uses a **GSAP `CustomEase` reproduction of the `cubic-bezier(0.22, 1, 0.36, 1)`** snappy ease over a fixed **1s** duration. It is entirely click-driven — no scroll, no autoplay.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the single GSAP plugin **`CustomEase`**. No ScrollTrigger, no SplitText, no Lenis/smooth-scroll, no Three.js.

```js
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
```

## Layout / HTML
A `.nav` bar, a `.container` holding the single `<h1>`, and **two** empty fullscreen `.blocks-container` overlays (`.transition-in` and `.transition-out`) that the JS fills with the block grid. Class names and the `data-page` attributes are load-bearing (the JS queries them).

```html
<div class="nav">
  <div class="logo">
    <a class="nav-link" href="#" data-page="index">Ink_Octopus</a>
  </div>
  <div class="nav-links">
    <div class="nav-item"><a class="nav-link" href="#" data-page="index">Home</a></div>
    <div class="nav-item"><a class="nav-link" href="#" data-page="about">About</a></div>
    <div class="nav-item"><a class="nav-link" href="#" data-page="contact">Contact</a></div>
  </div>
</div>

<div class="container">
  <h1>Index</h1>
</div>

<div class="blocks-container transition-in"></div>
<div class="blocks-container transition-out"></div>

<script type="module" src="./script.js"></script>
```

Notes on structure:
- The logo is a link to `data-page="index"` with fictional text **`Ink_Octopus`**; the three nav links carry `data-page="index" | "about" | "contact"` with visible labels **Home / About / Contact**. All four are `.nav-link` (all are clickable route triggers).
- Both `.blocks-container` divs start **empty** — the JS injects 10 `.row` divs, each with 11 `.block` divs, into **each** container (so two full grids exist, one for covering, one for revealing).
- The `<h1>` initial text is `Index`; it is rewritten by JS during a transition (never on click directly).
- Use neutral demo labels only — no real brand names.

## Styling
Global reset applies a text color to everything: `* { margin:0; padding:0; box-sizing:border-box; color:#0f0f0f; }`.

Fonts: the heading uses **"PP Monument Extended"** (a wide/extended heavy grotesque display face) and the nav links use **"PP Supply Mono"** (a monospace). These are commercial; the original declares them by name with no `@font-face` (graceful fallback). For a runnable reproduction, either load look-alike free fonts or supply fallbacks — a very wide/expanded bold sans for the heading (e.g. Archivo Expanded / a condensed-inverse wide grotesque) and any monospace (e.g. Space Mono / DM Mono) for the nav. Keep the family *names* in CSS as written so the intent is clear.

```css
html, body { font-family: "PP Monument Extended"; background: #ffffff; }
```

Palette (exact hex):
- Page background: `#ffffff` (white)
- Text / global color: `#0f0f0f` (near-black); nav anchors explicitly `#000`
- **Block fill: `#667067`** (a muted sage grey-green) — this is the curtain color that flashes across the screen.

Load-bearing CSS:
- `.nav`: `position: fixed; width: 100%; display: flex; justify-content: space-between;` (logo left, links right; sits above the page content, **below** the block overlays which come later in the DOM / cover it).
- `.nav-links`: `display: flex;`. `.logo, .nav-item`: `padding: 1.5em; font-weight: 400;`.
- `a`: `font-family: "PP Supply Mono"; text-transform: uppercase; text-decoration: none; color: #000; font-size: 13px; font-weight: 400;`.
- `h1`: `width: 80%; position: absolute; top: 47.5%; left: 50%; transform: translate(-50%, -50%); text-align: center; font-weight: 900; font-size: 10vw; text-transform: uppercase; line-height: 1; letter-spacing: -0.05em;` — one huge centered uppercase word.
- `.blocks-container`: `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; pointer-events: none;` — a fullscreen overlay that **never blocks clicks**. Both containers stack at the same spot.
- `.row`: `flex: 1; width: 100%; display: flex;` — 10 equal-height rows filling the viewport.
- `.block`: `position: relative; flex: 1; background: #667067; margin: -0.25px;` — 11 equal-width blocks per row. The **negative `-0.25px` margin** overlaps block edges by a hair so there are **no seam gaps** between blocks when they cover.
- **Rest / origin states (critical — these set the animation direction):**
  ```css
  .transition-in .block  { transform-origin: top;    transform: scaleY(1); }  /* reveal grid: starts covering, collapses UP */
  .transition-out .block { transform-origin: bottom; transform: scaleY(0); }  /* cover grid:  starts hidden,   grows UP from bottom */
  ```
  The `.transition-in` grid scales from its **top** edge (shrinking up reveals the page from the bottom); the `.transition-out` grid scales from its **bottom** edge (growing up covers the page from the bottom).

## GSAP effect (the important part — be exhaustive)

### 1. The CustomEase — reproduce `cubic-bezier(0.22, 1, 0.36, 1)`
The original (a framer-motion `ease: [0.22, 1, 0.36, 1]`, 1s) is reproduced **exactly** as a named GSAP `CustomEase`. Register it once and reuse for every tween:
```js
const ease = CustomEase.create("pageTransition", "M0,0 C0.22,1 0.36,1 1,1");
```
This is a very snappy ease-out (fast overshoot-free launch, long soft settle) — do not substitute `power`/`expo` presets; use the literal bezier control points `0.22,1 → 0.36,1`.

### 2. Grid construction + per-block random stagger
Constants and the grid builder:
```js
const ROWS = 10;
const COLS = 11;

function buildBlocks(container) {
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement("div");
    row.className = "row";
    for (let c = 0; c < COLS; c++) {
      const block = document.createElement("div");
      block.className = "block";
      row.appendChild(block);
    }
    container.appendChild(row);
  }
}
```
Build **both** `.transition-in` and `.transition-out` (110 blocks each). Then collect `inBlocks` / `outBlocks` node lists, the `heading` (`.container h1`), and all `.nav-link`s.

**The stagger is a function-based per-element start delay** (not a cumulative GSAP stagger). Each block gets its own offset computed from its **row index** plus a random jitter:
```js
// Verbatim delay formula. rowIndex is the block's row (0 = top … 9 = bottom).
const calculateRandomBlockDelay = (rowIndex, totalRows) => {
  const blockDelay = Math.random() * 0.5;                 // 0 … 0.5s random jitter, per block
  const rowDelay   = (totalRows - rowIndex - 1) * 0.05;   // bottom row → 0, top row → 0.45s
  return blockDelay + rowDelay;
};

// GSAP function-stagger: receives the flat index i; derive the row via floor(i / COLS).
const staggerDelay = (i) => calculateRandomBlockDelay(Math.floor(i / COLS), ROWS);
```
Pass `stagger: staggerDelay` directly (a **function**, so GSAP calls it per target and uses the return as that target's absolute start offset). Net effect: the **bottom row starts first, the top row last** (row 9 → +0, row 8 → +0.05, … row 0 → +0.45), with each individual block additionally jittered by 0–0.5s — so the curtain rises with a scattered, organic edge rather than a clean line.

### 3. Initial page-in (runs once on load)
On `DOMContentLoaded`, after building the grids, prime states and play the reveal grid once:
```js
gsap.set(inBlocks,  { scaleY: 1 });   // reveal grid fully covering
gsap.set(outBlocks, { scaleY: 0 });   // cover grid hidden
gsap.to(inBlocks, {
  scaleY: 0,                 // 1 → 0: blocks collapse UP (origin top) and uncover the Index page
  duration: 1,
  ease,                      // the CustomEase "pageTransition"
  stagger: staggerDelay,     // per-block random-by-row offset
});
```
So on first paint the screen is fully covered by the sage grid, then the blocks shrink up in a scattered wave to reveal the initial "INDEX" heading.

### 4. The `navigate(targetPage)` transition (per click)
Guarded, two-phase, chained via `onComplete` callbacks:
```js
let currentPage = "index";
let isAnimating = false;
const pageTitles = { index: "Index", about: "The Crew", contact: "Say Hello" };

function navigate(targetPage) {
  if (isAnimating || targetPage === currentPage) return;   // ignore mid-anim + no-op clicks
  isAnimating = true;

  // PHASE A — COVER: the transition-out grid grows up from the bottom to blanket the screen.
  gsap.set(outBlocks, { scaleY: 0 });
  gsap.to(outBlocks, {
    scaleY: 1,                 // 0 → 1: blocks grow UP (origin bottom) → viewport fully covered
    duration: 1,
    ease,
    stagger: staggerDelay,
    onComplete: () => {
      // Fully covered → swap the heading + route behind the curtain (never visible).
      heading.textContent = pageTitles[targetPage];
      currentPage = targetPage;

      // Hand-off: reveal grid snaps to covering, cover grid snaps back to hidden.
      gsap.set(inBlocks,  { scaleY: 1 });
      gsap.set(outBlocks, { scaleY: 0 });

      // PHASE B — REVEAL: the transition-in grid shrinks up toward the top to uncover the new page.
      gsap.to(inBlocks, {
        scaleY: 0,             // 1 → 0: blocks collapse UP (origin top) → new page revealed
        duration: 1,
        ease,
        stagger: staggerDelay,
        onComplete: () => { isAnimating = false; },   // release the guard
      });
    },
  });
}
```
- **Two grids, seamless hand-off:** the `.transition-out` grid does the covering; at full coverage the heading swaps and the `.transition-in` grid is instantly set to `scaleY:1` (covering) while `.transition-out` is reset to `scaleY:0`, so the reveal grid takes over with no flicker. Then `.transition-in` shrinks away.
- **Timing per click:** cover (~1s + up to ~0.95s of scattered stagger tail) → swap → reveal (~1s + stagger tail). Each phase is a single `gsap.to` with the same `duration:1`, `ease`, and function-stagger; there are **no** `delay` or `position` parameters beyond the per-block stagger.
- **Re-entrancy guard:** `isAnimating` blocks clicks until the reveal's `onComplete`; clicking the current page is a no-op.

### 5. Wiring
```js
links.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(link.dataset.page);
  });
});
```
Every `.nav-link` (including the logo) routes through `navigate` using its `data-page`.

**No ScrollTrigger, no SplitText, no lerp/rAF loop, no Three.js.** The entire effect is `gsap.set` + `gsap.to` block tweens (`scaleY`) on the `CustomEase("pageTransition")` bezier, with a function-based per-row-random stagger, phased cover-then-reveal across two stacked fullscreen grids.

## Assets / images
**None.** There are no image assets — the visual is pure CSS type plus the solid `#667067` block grid. Do not add images.

## Behavior notes
- **Trigger:** click on any nav link (or the logo) only. No scroll, no hover, no autoplay; the reveal plays once automatically on initial load.
- Both `.blocks-container` overlays are `pointer-events: none`, so the grids never obstruct nav clicks even while covering.
- The `-0.25px` block margin is essential — without it, sub-pixel gaps between scaled blocks show the page through the curtain at full coverage.
- No reduced-motion guard and no responsive media queries in the original; `font-size: 10vw` already scales the heading. The grid is always 10×11 regardless of viewport.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--bone`, `--electric`, `--slate`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes `mount(config)`: a function that builds two full block grids inside `.transition-in`/`.transition-out`, wires every `.nav-link` to a `navigate` closure, and returns a `destroy()` — written for this catalogue's own knob-tuning editor (the `window.MP.register` branch), not because a plain page ever calls it twice. That pair already undoes its own listeners and clears its own containers on the way out, but the tweens next to them are not yet revertible with one call, and all four of `mount`'s lookups still assume they own `document`.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. If `mount`'s body becomes the effect verbatim but `destroy()` is dropped or only partly adapted, the second pass attaches a second `click` listener to the same four `.nav-link` elements, each carrying its own `isAnimating`/`currentPage` closure — a real click then fires two independent `navigate` cascades against the same `inBlocks`/`outBlocks` NodeLists, each one mutating the same `heading` node from its own guard state without the other ever seeing it. None of this reproduces in a production build, because React only double-invokes effects in development. Treat `destroy()` as the effect's cleanup, not as editor-only plumbing.

*(1) The entry point* — The bottom of the file checks `document.readyState` before subscribing to `DOMContentLoaded`; that guard exists to survive being loaded late into a plain document, and `useEffect` already runs after commit, so it is dead weight here. Drop the guard, the listener, and the `else boot()` branch, and move `mount`'s body straight into a `useEffect` with an empty dependency array, returning the function it already builds as `destroy`. The `window.MP` branch is this catalogue's editor runtime, not something a deployed app has — delete it too. `DEFAULTS` (`rows`, `cols`, `blockDuration`, `randomDelay`, `rowDelay`) stops being a config object an external caller hands to `mount`; read those five as local constants inside the effect, or lift the ones a host app should vary into props. `gsap.registerPlugin(CustomEase)` and the `CustomEase.create("pageTransition", …)` call both stay exactly where they are, at module scope above the component — they run once at import time no matter how many times the component mounts, and re-creating the same named ease on every mount would be pointless, not harmful.

*(2) Element lookups* — `mount` resolves four things from `document`: `.transition-in`, `.transition-out`, `.container h1`, and every `.nav-link`. All four need to become `rootRef.current.querySelector(...)` / `rootRef.current.querySelectorAll(...)`. This is not cosmetic here: during the StrictMode remount two copies of the markup exist for an instant, and an unscoped `document.querySelectorAll(".nav-link")` can bind the click wiring to the copy on its way out, so every real click afterward silently does nothing. Once `inContainer`/`outContainer` are scoped, the rest of this component's lookups — `inBlocks`/`outBlocks` via `querySelectorAll(".block")` on each container — already resolve to concrete `NodeList`s rather than CSS selector strings, so there is no selector text left for `gsap.context` to rewrite later inside `navigate`; the scoping work is entirely done by scoping these four initial lookups.

*(3) Cleanup* — The load-time reveal (`gsap.to(inBlocks, { scaleY: 0, … })`, right after the two `gsap.set` calls) runs synchronously while `mount` executes, so wrapping it in a `gsap.context` factory tracks it for free. `navigate` does not get the same treatment automatically: it is defined inside the factory but only ever *called* later, from a `click` listener, and both of its tweens — the cover tween on `outBlocks`, and, nested inside that tween's `onComplete`, the reveal tween on `inBlocks` — are created during that later call, not during the factory's synchronous pass. Register `navigate` itself through the factory's own parameter and invoke it as a context method:

```jsx
useEffect(() => {
  const inContainer = rootRef.current.querySelector(".transition-in");
  const outContainer = rootRef.current.querySelector(".transition-out");
  const heading = rootRef.current.querySelector(".container h1");
  const links = rootRef.current.querySelectorAll(".nav-link");

  inContainer.innerHTML = "";
  outContainer.innerHTML = "";
  buildBlocks(inContainer, ROWS, COLS);
  buildBlocks(outContainer, ROWS, COLS);
  const inBlocks = inContainer.querySelectorAll(".block");
  const outBlocks = outContainer.querySelectorAll(".block");

  let currentPage = "index";
  let isAnimating = false;

  const ctx = gsap.context((self) => {
    gsap.set(inBlocks, { scaleY: 1 });
    gsap.set(outBlocks, { scaleY: 0 });
    gsap.to(inBlocks, { scaleY: 0, ease, stagger: staggerDelay /* same block duration as above */ });

    self.add("navigate", (targetPage) => {
      if (isAnimating || targetPage === currentPage) return;
      isAnimating = true;
      gsap.set(outBlocks, { scaleY: 0 });
      gsap.to(outBlocks, {
        scaleY: 1,
        ease,
        stagger: staggerDelay,
        onComplete: () => {
          heading.textContent = pageTitles[targetPage];
          currentPage = targetPage;
          gsap.set(inBlocks, { scaleY: 1 });
          gsap.set(outBlocks, { scaleY: 0 });
          gsap.to(inBlocks, {
            scaleY: 0,
            ease,
            stagger: staggerDelay,
            onComplete: () => { isAnimating = false; },
          });
        },
      });
    });
  }, rootRef);

  const offs = [];
  links.forEach((link) => {
    const onClick = (e) => {
      e.preventDefault();
      ctx.navigate(link.dataset.page);
    };
    link.addEventListener("click", onClick);
    offs.push(() => link.removeEventListener("click", onClick));
  });

  return () => {
    offs.forEach((off) => off());
    ctx.revert();
    inContainer.innerHTML = "";
    outContainer.innerHTML = "";
  };
}, []);
```

Calling the raw `navigate` closure from the click handler instead of `ctx.navigate` would still look correct on the very next click. What breaks is teardown: without `self.add`, neither of `navigate`'s tweens is tracked by the context at all, so `ctx.revert()` cannot kill either one — a click that starts a cascade, followed by an unmount before it finishes, leaves the cover or reveal tween (whichever is in flight) still running against a heading and a grid that no longer belong to a mounted component. `isAnimating` and `currentPage` need neither `useState` nor `useRef`: nothing here reads them to render JSX, `navigate` is the only place either is written or checked, and both are recreated fresh with every effect run, exactly like `mount`'s own closures today.

`ctx.revert()` does not reach everything this effect creates, though. `buildBlocks` appends two hundred and twenty plain `div`s (`.row` and `.block`, ten rows of eleven per grid) via `createElement`/`appendChild` — GSAP never sees that DOM construction, so reverting the context clears every inline `scaleY` it wrote but leaves all two hundred and twenty nodes sitting inside `.transition-in`/`.transition-out`. Clearing both containers' `innerHTML` in the cleanup, exactly as the vanilla `destroy()` already does, is what actually removes them; drop that line and a remounted grid stacks its blocks on top of the previous mount's leftovers. The `click` listeners are the same story: they are plain `addEventListener` calls, not GSAP objects, so `ctx.revert()` never touches them either — keep the `offs` array precisely as the script already builds it, and run it before `ctx.revert()` in the same cleanup.
