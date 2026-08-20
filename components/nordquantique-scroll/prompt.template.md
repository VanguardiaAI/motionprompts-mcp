---
slug: nordquantique-scroll
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Pixelated Block Reveal Scroll

## Goal

Build a scroll-driven, full-bleed page where two editorial photo sections are each masked by a chunky grid of solid-color squares ("pixels"). As each photo section scrolls up through the viewport, the grid at its **top edge dissolves block-by-block in a randomized wave to reveal the photo**, and as the section scrolls away, a second grid at its **bottom edge builds up block-by-block to cover the photo** with the next section's color. The block colors are chosen so the transitions are seamless between the solid-color divider sections and the photos — a pixelated dissolve/build page transition, entirely scrubbed by scroll.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin only — no Lenis, no other plugins, no framework.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
```

Everything runs inside a `DOMContentLoaded` listener; call `gsap.registerPlugin(ScrollTrigger)` first. There are **no tweens and no timeline** — the whole effect is a set of `ScrollTrigger.create()` instances whose `onUpdate` writes each block's opacity imperatively from `self.progress`. Native scroll (no smooth-scroll library).

## Layout / HTML

A single `.container` wrapping **five stacked sections** in this exact order:

1. `<section class="hero">` — a solid-color divider with a centered `<h1>Section 1</h1>`.
2. `<section class="hero-img">` — the first photo reveal section (see block markup below), holding `img-1`.
3. `<section class="about">` — a solid-color divider, centered `<h1>Section 2</h1>`.
4. `<section class="about-img">` — the second photo reveal section, holding `img-2`.
5. `<section class="footer">` — a solid-color divider, centered `<h1>Section 3</h1>`.

Each of the two `*-img` sections contains, in this order:
- `<img src="(photo)" alt="" />` — the full-bleed background photo.
- `<div class="blocks-container top">` with **exactly 4 empty** `<div class="blocks-row"></div>` children.
- `<div class="blocks-container bottom">` with **exactly 4 empty** `<div class="blocks-row"></div>` children.

Example for one photo section:

```html
<section class="hero-img">
  <img src="/img-1.jpg" alt="" />
  <div class="blocks-container top">
    <div class="blocks-row"></div>
    <div class="blocks-row"></div>
    <div class="blocks-row"></div>
    <div class="blocks-row"></div>
  </div>
  <div class="blocks-container bottom">
    <div class="blocks-row"></div>
    <div class="blocks-row"></div>
    <div class="blocks-row"></div>
    <div class="blocks-row"></div>
  </div>
</section>
```

The `.block` squares themselves are **not** in the HTML — JS injects them into each `.blocks-row`. Load `script.js` with `<script type="module" src="./script.js"></script>` at the end of `<body>`. Class names `.blocks-container`, `.blocks-row`, `.block`, `.top`, `.bottom` are what the JS/CSS query — keep them exact.

## Styling

Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; }`.

**Palette (exact hex — the block colors depend on these):**
- `.hero` background `#757637` (dark olive/khaki)
- `.about` background `#375955` (dark teal-green)
- `.footer` background `#645439` (warm brown)

**Sections:** `section { position:relative; width:100%; min-height:100vh; }`. The two photo sections override height: `section.hero-img, section.about-img { position:relative; height:200vh; }` — each photo section is **two viewport-heights tall** so there's a long stretch where the full photo shows, with the block grids only occupying the extreme top/bottom 400px.

**Photos:** `img { position:absolute; width:100%; height:100%; object-fit:cover; z-index:-1; }` — each fills its section and sits **behind** the blocks (blocks paint over it).

**Headings:** `h1 { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:12vw; font-weight:600; letter-spacing:-0.025em; color:#000; opacity:0.5; }`. Use a clean modern grotesque/neo-grotesque sans-serif (the original references a trial font "Saans TRIAL"; any similar tight-tracked sans works — set a `sans-serif` fallback, no external webfont required). The half-opacity black text reads as a subtle darkening over each solid divider.

**Block grids:**
- `.blocks-container { position:absolute; width:100%; height:400px; }`. `.blocks-container.top { top:0; }`, `.blocks-container.bottom { bottom:0; }` — one grid pinned to the top edge of the photo section, one to the bottom edge.
- `.blocks-row { width:100%; height:100px; overflow:hidden; display:flex; }` — 4 rows × 100px = the 400px container height; `overflow:hidden` clips whatever blocks overflow the viewport width.
- `.block { width:100px; height:100px; transition:opacity 250ms; }` — **fixed 100px squares** (the chunky "pixel" size, independent of viewport). The `transition:opacity 250ms` softly smooths each per-frame opacity write into a gentle fade rather than a hard snap.
- **Initial opacities:** top-grid blocks start opaque, bottom-grid blocks start transparent:
  `.blocks-container.top .block { opacity:1; }`, `.blocks-container.bottom .block { opacity:0; }`.

**Block colors — this is what makes the transition seamless.** Each grid is painted the color of the neighbouring divider section, so a fully-opaque grid is indistinguishable from the adjacent solid section:
- `.hero-img .blocks-container.top .block { background:#757637; }` (matches `.hero` above)
- `.hero-img .blocks-container.bottom .block { background:#375955; }` (matches `.about` below)
- `.about-img .blocks-container.top .block { background:#375955; }` (matches `.about` above)
- `.about-img .blocks-container.bottom .block { background:#645439; }` (matches `.footer` below)

So scrolling top→bottom the color flow is: olive divider → olive top-grid dissolves to reveal photo 1 → (full photo 1) → teal bottom-grid builds up → teal divider → teal top-grid dissolves to reveal photo 2 → (full photo 2) → brown bottom-grid builds → brown divider. Continuous color the whole way.

## GSAP effect (the important part — be exhaustive)

Everything is inside `DOMContentLoaded`, after `gsap.registerPlugin(ScrollTrigger)`.

### 1. Inject the blocks

For **every** `.blocks-row` in the document, append **exactly 16** `<div class="block">` children:

```js
document.querySelectorAll(".blocks-row").forEach((row) => {
  for (let i = 0; i < 16; i++) {
    const block = document.createElement("div");
    block.className = "block";
    row.appendChild(block);
  }
});
```

So each row is 16 squares (1600px of blocks; the row is 100% wide with `overflow:hidden`, so only as many as fit the viewport are visible). Each grid is therefore a 4-row × up-to-16-column field of 100px squares.

### 2. One ScrollTrigger per row

Iterate every `.blocks-container` (there are 4 total: top+bottom on each of the 2 photo sections). For each container capture `numRows = 4` and whether it is a top grid (`isTop = container.classList.contains("top")`). Then for **each row** (`rowIndex` 0→3, top row = 0):

- `blocks = Array.from(row.querySelectorAll(".block"))` (16 elements).
- **`randomizedOrder = gsap.utils.shuffle(blocks.map((block, idx) => idx))`** — a shuffled permutation of the indices `0..15`. This is computed **once per row** at setup and fixed for the life of the page; it's what makes each row dissolve in a random per-block order.
- Create a scrubbed ScrollTrigger on the **container** (all 4 rows of a container share the same trigger element and range):

```js
ScrollTrigger.create({
  trigger: container,
  start: "top bottom",   // progress 0 when the container's top edge reaches the viewport bottom
  end: "bottom top",     // progress 1 when the container's bottom edge reaches the viewport top
  scrub: true,           // plain scrub:true (directly tied to scroll, no smoothing lag)
  onUpdate: (self) => {
    const progress = self.progress;                       // 0 → 1 over (100vh + 400px) of scroll
    const rowDelay = 0.25 * (numRows - rowIndex - 1);     // 0.75, 0.5, 0.25, 0 for rows 0..3
    const adjustedProgress = Math.max(0, Math.min(1, progress - rowDelay));
    updateBlocksOpacity(blocks, randomizedOrder, isTop, adjustedProgress);
  },
});
```

**Row-stagger detail:** `rowDelay = 0.25 * (numRows - rowIndex - 1)` gives the **bottom row (index 3) a delay of 0** (it animates first, from progress 0) and the **top row (index 0) a delay of 0.75** (it only begins at progress 0.75). Each row's local progress is `clamp(progress − rowDelay, 0, 1)`. Net effect: the dissolve/build wave sweeps **from the bottom row upward**, one row starting each 0.25 of scroll progress.

### 3. `updateBlocksOpacity(blocks, order, isTop, progress)` — per-block math

For each block at DOM index `idx`:

```js
const offset = order.indexOf(idx) / blocks.length;        // this block's slot in the shuffle, normalized 0 → 15/16
const adjustedProgress = (progress - offset) * blocks.length;  // ramps 0→1 across a 1/16-wide progress window
const opacity = isTop
  ? 1 - Math.min(1, Math.max(0, adjustedProgress))         // TOP grid: 1 → 0 (dissolve away, reveal photo)
  : Math.min(1, Math.max(0, adjustedProgress));            // BOTTOM grid: 0 → 1 (build up, cover photo)
block.style.opacity = opacity;
```

Reading this out:
- Each block has an `offset` = its position in the row's shuffled order, normalized to `0 … 15/16`. The block's opacity transition **starts** when the row's local progress reaches `offset` and **completes** `1/16` of progress later. So the 16 blocks of a row flip one after another, in the shuffled (random-looking) order, spread evenly across the row's whole local-progress range.
- **Top grid** (`isTop` true): opacity goes **1 → 0** — the opaque colored blocks vanish one by one, revealing the photo underneath in a scattered, pixel-dissolve pattern.
- **Bottom grid** (`isTop` false): opacity goes **0 → 1** — transparent cells fill in one by one with the next section's color, pixel-building a cover over the photo.

There are **no eases, durations, delays, or staggers in GSAP tweens** here at all — every opacity is a direct clamped-linear function of scroll progress. The only softening is the CSS `transition: opacity 250ms` on `.block` and the `scrub:true` scroll binding.

### 4. Console note

The original logs each block's opacity every frame (`console.log(...)`). **Omit that log** — it spams the console with no visual effect; the reveal is identical without it.

### Trigger geometry recap

- 2 photo sections × 2 grids × 4 rows = **16 ScrollTriggers**, each `scrub:true`, `start:"top bottom"`, `end:"bottom top"` on its 400px container.
- Because a grid is only 400px and sits at the extreme edge of a 200vh section, its whole animation happens as that edge enters/leaves the viewport; the middle of the 200vh section shows the bare photo with no grid.

## Assets / images

- **2 full-bleed editorial fashion/portrait photos (JPG)**, displayed `object-fit:cover` filling a very tall (200vh) section, so effectively a portrait crop. Warm, editorial, softly-lit studio look that harmonizes with the olive / teal / brown palette:
  - **Photo 1** — a sunlit editorial portrait of a person in a warm mustard-toned top against a beige backdrop (harmonizes with the olive grid).
  - **Photo 2** — a full-body editorial fashion portrait of a person in a navy/dark outfit against a draped beige-fabric backdrop with dramatic shadows (harmonizes with the teal→brown grids).
- Any two moody, warm-neutral editorial photos work; the point is that they read as premium fashion imagery revealed from behind the colored pixels. No brand names or logos.

## Behavior notes

- Everything is fully **reversible** — scroll back up and the grids re-cover / re-reveal because every opacity is derived live from scroll progress.
- The shuffle order is generated once at load, so each row keeps a stable (but random-looking) dissolve pattern for the session; reloading reshuffles.
- No pin, no `pinSpacing`, no smooth-scroll, no SplitText, no CustomEase, no Three.js, no reduced-motion branch in the original.
- Works on mobile (`mobileSafe`): fixed 100px blocks just show fewer columns on narrow viewports; the effect is light-weight (opacity writes only).
- The 100px block size and 4-row/16-column counts are fixed values (not responsive); keep them as-is to match the chunky pixel scale.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/nordquantique-scroll/img-1.jpg
https://motionprompts.dev/c/nordquantique-scroll/img-2.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bone`, `--bone-dim`, `--ink`, `--ink-soft`, `--pewter`, `--pewter-hi`, `--font`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, reaches into the page with unscoped selector strings, and never has to undo anything, because the tab reloads long before any of it could run twice. React withdraws that guarantee, and it does it quietly. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here: sixteen `ScrollTrigger` instances instead of eight, each pair scrubbing the same four-row grid and disagreeing about the same `self.progress` — and, because the `.block` squares are not GSAP objects but plain `<div>`s created with `document.createElement` and appended by hand, twice as many of them stacked inside every `.blocks-row`, with the row's `overflow:hidden` quietly hiding the surplus instead of erroring. The visible symptom is a dissolve that freezes partway when you navigate back to the page, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — the whole effect, including `gsap.registerPlugin(ScrollTrigger)` itself, lives inside `document.addEventListener("DOMContentLoaded", function () {...})`. By the time a React component mounts, that event has already fired, so the listener is registered and never called: no blocks get injected, no `ScrollTrigger` gets created, and every `*-img` section just shows the bare photo with its blocks stuck at their CSS-default opacity — nothing in the console points at why. Delete the listener and move its body — the injection loop over `.blocks-row`, the `.blocks-container` iteration, and the sixteen `ScrollTrigger.create()` calls it produces — into a `useEffect` with an empty dependency array. Hoist `gsap.registerPlugin(ScrollTrigger)` out to module scope; it does not need to run on every mount.

*(2) Element lookups* — `document.querySelectorAll(".blocks-row")` (to inject blocks) and `document.querySelectorAll(".blocks-container")` (to wire up triggers) are both unscoped, and there are sixteen of the former and four of the latter, spread across the two `*-img` sections (`hero-img`, `about-img`). Give the component a root ref on the element that wraps both photo sections and both dividers around them, and resolve both queries off it instead of off `document`. During the StrictMode remount, two copies of this markup exist for an instant; an unscoped query can hand the injection loop or the trigger setup the outgoing copy's rows instead of the one that is about to remain on screen.

*(3) Cleanup* — wrap the block-injection loop and all sixteen `ScrollTrigger.create()` calls in one `gsap.context` scoped to the root ref, and revert it in the cleanup. `ctx.revert()` alone is not enough here, and this is the one place this component departs from the general rule: the `.block` divs are appended with plain DOM calls, so the context — which only tracks tweens, timelines, `ScrollTrigger`s, and `Draggable`s it creates — has no idea they exist. Reverting kills the sixteen triggers but leaves every injected block sitting in the DOM at whatever opacity its last `onUpdate` wrote. The next mount's injection loop then appends sixteen more blocks onto the same `.blocks-row` elements — those rows are declared in JSX and survive the remount, only the effect body reruns — so each row now holds thirty-two blocks instead of sixteen, and because the row clips overflow, the visible sixteen are the stale, un-reverted ones from the first mount while the live triggers from the second mount are scrubbing an equal number of blocks pushed out of view. Track every block you create and remove it in the same cleanup:

```jsx
useEffect(() => {
  const injected = [];
  const ctx = gsap.context(() => {
    rootRef.current.querySelectorAll(".blocks-row").forEach((row) => {
      for (let i = 0; i < 16; i++) {
        const block = document.createElement("div");
        block.className = "block";
        row.appendChild(block);
        injected.push(block);
      }
    });
    // the .blocks-container iteration and the sixteen ScrollTrigger.create()
    // calls, exactly as above, each reading the shuffled block order and
    // the isTop flag from the container it belongs to
  }, rootRef);

  return () => {
    ctx.revert();
    injected.forEach((block) => block.remove());
  };
}, []);
```

Since every block's `onUpdate` writes `opacity` directly onto `block.style` rather than through a GSAP tween, `ctx.revert()` would not have rolled that back even if the nodes had stayed put — removing the nodes is what actually undoes it. The shuffle itself (`gsap.utils.shuffle`) needs no special handling beyond living inside the context callback: it already runs once per row on every execution of the effect and produces a fresh random order each time, which is the same behavior the original has on every page reload.
