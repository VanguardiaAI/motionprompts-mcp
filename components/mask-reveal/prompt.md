# Mask Reveal On Scroll (3×3 clip-path mosaic image reveal)

## Goal
Build a long editorial gallery page where **every image reveals itself as a 3×3 grid of clip-path tiles that unfold cell-by-cell in a diagonal wave when its row scrolls into view**. Each `.img` is layered with nine identical full-cover copies of its picture, each copy clipped to one cell of a 3×3 grid; a ScrollTrigger timeline animates the nine `clip-path` polygons from collapsed zero-area points (each pinned at its cell's top-left corner) out to full cells, cascading top-left → bottom-right along five anti-diagonal waves. The star effect is that per-image mosaic "tile-in" reveal. Trigger is scroll (each image row entering the viewport, one-shot). Lenis provides smooth scrolling synced to ScrollTrigger.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin, plus **`lenis`** for smooth scroll:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);
```
No SplitText, no CustomEase, no Three.js, no canvas. Wire Lenis to GSAP's ticker the standard way:
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

## Layout / HTML
A single scrolling document for a fictional dystopian fashion label — use the neutral brand name **"Wasteland Couture"** (no real brands). Structure top to bottom:
```
nav                         (absolute, top; brand link left, "Shop" link right)
  a "Wasteland Couture"
  a "Shop"

section.hero
  h1 "WASTELAND COUTURE"    (giant centered display heading)

section.info                (two short right-aligned body paragraphs)
  p … p …

section.hero-imgs
  .row
    .img.img-1
    .img.img-2

section.clients             (two columns)
  .col > p "Selected Clients"
  .col
    .clients-list           (~16 <p> fictional client names)
    .clients-list           (~16 more <p> names)

section.clients-imgs        (one large full-width image row, 700px tall)
  .row > .img.img-3

section.product-filters     (a filter label row with bottom border)
  .col > p "All" / "Lighting" / "Textiles" / "Furniture" / "Accessories" / "Surfaces"
  .col (empty)

section.products            (4 rows × 4 tiles; ~half populated, half left blank)
  .row  .img  .img.img-4  .img.img-5  .img
  .row  .img.img-6  .img  .img  .img.img-7
  .row  .img  .img.img-8  .img  .img.img-9
  .row  .img.img-10  .img  .img.img-11  .img.img-12

section.about               (two body paragraphs)
  p … p …

section.about-imgs
  .row > .img.img-13 + .img.img-14

section.outro
  .row > .img.img-15 + .img.img-16 + .img.img-17

footer                      (brand name left, "© 2026" right)
```
- The tiles/masks are **not in the HTML** — every `.img` starts empty; JS injects the nine `.mask` divs into each one. The class names `.row`, `.img`, `.img-1 … .img-17`, and (JS-created) `.mask`, `.m-1 … .m-9` are load-bearing.
- Note the products grid deliberately mixes populated tiles (`.img-N`) with plain `.img` cells that carry no background — those animate too but reveal nothing, creating a scattered, gappy editorial layout.

## Styling
- Global reset `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; max-width:100%; height:100%; overflow-x:hidden; background: var(--paper); color: var(--ink); font-family:"Inter", sans-serif; }` — the page is **dark**: charcoal ground, ivory type.
- Palette and fonts:
  ```css
  :root {
    --paper: #141414;   /* the ground, despite the name */
    --ink: #efece3;     /* ivory type */
    --muted: #8f8d86;
    --line: rgba(239, 236, 227, 0.16);
    --accent: #f04e23;
    --accent-deep: #7a1f00;
  }
  ```
  **Space Grotesk** for the headline, **Inter** for body copy, **Space Mono** for small labels.
- `a, p { text-decoration:none; font-size:17px; font-weight:400; line-height:1.55; color: var(--ink); }`.
- `img { width:100%; height:100%; object-fit:cover; }`.
- `nav { position:absolute; top:0; left:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center; }`.
- `footer { width:100%; padding:2em; display:flex; justify-content:space-between; align-items:center; margin-top:4em; }`.
- `section { width:100%; padding:2em; }`.
- `.row { width:100%; display:flex; gap:2em; }` and `.col { flex:1; display:flex; gap:1em; }`.
- `.hero h1 { margin-top:1.5em; text-align:center; text-transform:uppercase; font-family:"Space Grotesk"; font-size:15vw; font-weight:600; line-height:0.9; letter-spacing:-0.03em; color: var(--ink); }` — huge, near-full-width headline (`20vw` and `margin-top:0.8em` on mobile).
- `.info { display:flex; justify-content:flex-end; gap:2em; }` and `.info p { width:25%; }` — two narrow paragraphs pushed to the right.
- `.hero-imgs { margin-top:10em; }`. `.clients { display:flex; }`, `.clients-list { flex:1; }`. `.clients-imgs { margin-top:4em; }` and **`.clients-imgs .row { height:700px; }`** (the one oversized hero-scale image). `.product-filters { padding-bottom:1em; display:flex; border-bottom:1px solid var(--line); }`. `.products { display:flex; flex-direction:column; gap:2em; }`. `.about { display:flex; }` with `.about p { margin-top:8em; flex:1; }`. `.outro .row { margin-top:8em; }`.

### The tile / mask CSS (critical for the effect)
- `.img { position:relative; width:100%; height:100%; aspect-ratio:4/5; }` — each image cell is a 4:5 portrait box (except the 700px-tall clients row).
- `.mask { position:absolute; top:0; left:0; width:100%; height:100%; }` — every mask is a full-size overlay stacked on its `.img`.
- **Each populated `.img-N` sets the SAME full-cover background on all of its `.mask` children** (not per-cell slices — every mask holds the whole picture, `background: url(...) no-repeat 50% 50%; background-size: cover;`). The 3×3 tiling comes purely from clip-path; the imagery underneath is identical across the nine masks, so as each cell's polygon grows it uncovers its portion of one continuous photo.

### Image ↔ tile mapping (7 photos reused across 17 populated tiles)
There are only **7 distinct source images**; they repeat across the 17 `.img-N` classes. Wire each photo to the same tile classes so the reproduction matches:
- image-3 → `.img-1, .img-6, .img-12`
- image-4 → `.img-2, .img-7, .img-14`
- image-7 → `.img-3, .img-15`
- image-1 → `.img-4, .img-10`
- image-2 → `.img-5, .img-11, .img-16`
- image-5 → `.img-8, .img-17`
- image-6 → `.img-9, .img-13`

## GSAP effect (the important part — be exhaustive)

### 1. The two polygon tables (9 masks per image, 3×3 grid)
Cell coordinates snap to the thirds 0% / 33% / 66% (right/bottom edges land at 33.5% / 66.5% / 100%, the extra 0.5% overlap hiding seams). Two parallel arrays, index 0→8 mapping to cells row-major (mask `.m-1`=index 0 top-left … `.m-9`=index 8 bottom-right):

**`initialClipPaths` — collapsed zero-area points, each pinned at its cell's TOP-LEFT corner:**
```js
const initialClipPaths = [
  "polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)",        // cell 0  TL corner (0,0)
  "polygon(33% 0%, 33% 0%, 33% 0%, 33% 0%)",    // cell 1  (33,0)
  "polygon(66% 0%, 66% 0%, 66% 0%, 66% 0%)",    // cell 2  (66,0)
  "polygon(0% 33%, 0% 33%, 0% 33%, 0% 33%)",    // cell 3  (0,33)
  "polygon(33% 33%, 33% 33%, 33% 33%, 33% 33%)",// cell 4  (33,33) center
  "polygon(66% 33%, 66% 33%, 66% 33%, 66% 33%)",// cell 5  (66,33)
  "polygon(0% 66%, 0% 66%, 0% 66%, 0% 66%)",    // cell 6  (0,66)
  "polygon(33% 66%, 33% 66%, 33% 66%, 33% 66%)",// cell 7  (33,66)
  "polygon(66% 66%, 66% 66%, 66% 66%, 66% 66%)",// cell 8  (66,66)
];
```

**`finalClipPaths` — the full cell rectangles (with the 0.5% overlap seams):**
```js
const finalClipPaths = [
  "polygon(0% 0%, 33.5% 0%, 33.5% 33%, 0% 33.5%)",
  "polygon(33% 0%, 66.5% 0%, 66.5% 33%, 33% 33.5%)",
  "polygon(66% 0%, 100% 0%, 100% 33%, 66% 33.5%)",
  "polygon(0% 33%, 33.5% 33%, 33.5% 66%, 0% 66.5%)",
  "polygon(33% 33%, 66.5% 33%, 66.5% 66%, 33% 66.5%)",
  "polygon(66% 33%, 100% 33%, 100% 66%, 66% 66.5%)",
  "polygon(0% 66%, 33.5% 66%, 33.5% 100%, 0% 100%)",
  "polygon(33% 66%, 66.5% 66%, 66.5% 100%, 33% 100%)",
  "polygon(66% 66%, 100% 66%, 100% 100%, 66% 100%)",
];
```
Because each initial polygon is all four vertices stacked on the cell's top-left corner and the final polygon is that cell's four corners, **each tile grows/unfolds outward from its own top-left corner** to fill its ninth of the frame.

### 2. Inject the masks
```js
function createMasks() {
  document.querySelectorAll(".img").forEach((img) => {
    for (let i = 1; i <= 9; i++) {
      const mask = document.createElement("div");
      mask.classList.add("mask", `m-${i}`);
      img.appendChild(mask);
    }
  });
}
createMasks();
```
Every `.img` (populated or blank) receives nine masks `.m-1 … .m-9`, appended in order so their NodeList index equals the polygon index above.

### 3. Per-row ScrollTrigger timelines
Iterate rows, then each image in the row, then its masks. Set each mask to its collapsed initial state, then build a one-shot timeline triggered by the row:
```js
gsap.utils.toArray(".row").forEach((row) => {
  row.querySelectorAll(".img").forEach((img) => {
    const masks = img.querySelectorAll(".mask");
    masks.forEach((mask, index) => gsap.set(mask, { clipPath: initialClipPaths[index] }));

    const tl = gsap.timeline({
      scrollTrigger: { trigger: row, start: "top 75%" },
    });

    const animationOrder = [
      [".m-1"],                    // wave 0
      [".m-2", ".m-4"],            // wave 1
      [".m-3", ".m-5", ".m-7"],    // wave 2
      [".m-6", ".m-8"],            // wave 3
      [".m-9"],                    // wave 4
    ];

    animationOrder.forEach((targets, index) => {
      tl.to(
        targets.map((cls) => img.querySelector(cls)),
        {
          clipPath: (i, el) => finalClipPaths[Array.from(masks).indexOf(el)],
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
        },
        index * 0.125
      );
    });
  });
});
```

### 4. Exact motion spec
- **Trigger:** `ScrollTrigger { trigger: row, start: "top 75%" }` — **no `end`, no `scrub`, no `pin`.** The timeline plays **once, forward** the moment the row's top reaches 75% down the viewport (i.e. 25% into view from the bottom). It does not reverse on scroll-up. Every `.img` in a row shares the same row trigger, so all images in that row reveal simultaneously.
- **Waves (diagonal cascade):** the five `animationOrder` groups are anti-diagonals of the 3×3 grid. Each group's tween is placed at absolute timeline position **`index * 0.125`** (0, 0.125, 0.25, 0.375, 0.5 s), so waves start 0.125 s apart and overlap heavily — the reveal sweeps corner-to-corner from top-left (`.m-1`) to bottom-right (`.m-9`).
- **Per-tile tween:** `clip-path` from its `initialClipPaths[i]` (collapsed point) to `finalClipPaths[i]` (full cell), `duration: 0.5`, `ease: "power2.out"`.
- **Within-wave stagger:** `stagger: 0.1` — in the two-tile and three-tile waves the members fire 0.1 s apart (e.g. wave 2 `.m-3` → `.m-5` → `.m-7`).
- **Final-value lookup:** the `clipPath` target is a function `(i, el) => finalClipPaths[Array.from(masks).indexOf(el)]` — it resolves each element's real index within the image's mask NodeList, so `.m-3` maps to `finalClipPaths[2]`, `.m-5` to `[4]`, etc., regardless of the order it appears inside the wave array.
- Total per-image reveal wall-clock ≈ 0.5 (last wave offset) + 0.1 (stagger) + 0.5 (duration) ≈ 1.1 s.

## Assets / images
**7 distinct full-bleed images**, reused across the tiles per the mapping above. They are shown via `background-size: cover; background-position: 50% 50%`, so any orientation works — the mask box crops them. Aim for a **moody, cinematic, dystopian editorial mood**: dark, high-contrast, atmospheric scenes (weathered post-apocalyptic landscapes, glowing structures against night skies, desolate terrain, industrial/avant-garde textures) so the mosaic tiles read dramatically as they unfold. One of the seven (image-7 → `.img-3`) fills the oversized 700px-tall full-width row, so favour a wide, hero-scale composition there. No real brands, logos, or text in the imagery. Any 7 cohesive cinematic photos in this register work.

## Behavior notes
- Reveals are **one-shot and irreversible** (no scrub, no `toggleActions` reset) — once a row has tiled in, it stays revealed.
- No `prefers-reduced-motion` branch and no min-width gate in the original; it runs on desktop and mobile alike. Sections stack vertically and the effect is unchanged on narrow screens.
- Light performance cost: pure CSS `clip-path` tweens, no WebGL/canvas. Blank `.img` cells still get masks and still animate (invisibly) — that is intended.
- Lenis smooth scroll is synced to ScrollTrigger via `gsap.ticker`; keep `lagSmoothing(0)` so the tie-in stays frame-accurate.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/mask-reveal/img1.jpg
https://motionprompts.dev/c/mask-reveal/img2.jpg
https://motionprompts.dev/c/mask-reveal/img3.jpg
https://motionprompts.dev/c/mask-reveal/img4.jpg
https://motionprompts.dev/c/mask-reveal/img5.jpg
https://motionprompts.dev/c/mask-reveal/img6.jpg
… 1 more under https://motionprompts.dev/c/mask-reveal/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--muted`, `--line`, `--accent`, `--accent-deep`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script above runs at the top level: `createMasks()` and the `gsap.utils.toArray(".row")` walk both fire the instant the module is evaluated. In React that moment is import time, before this component has rendered a single `.row` or `.img`, so both calls would run against an empty document — no error, no mosaic, nothing to debug. Move the whole body — the `Lenis` construction, the ticker wiring, `createMasks()`, and the per-row loop that builds the wave timelines — into a `useEffect` with an empty dependency array. Do not leave any of it in the component body: that re-runs on every render and would re-inject masks and rebuild every row's timeline each time.

*(2) Element lookups* — `document.querySelectorAll(".img")` inside `createMasks()`, `gsap.utils.toArray(".row")`, and every `row.querySelectorAll(".img")` / `img.querySelectorAll(".mask")` / `img.querySelector(cls)` that follows it assume this component owns the document. Give the component a root `ref`, render it on the outermost element wrapping the gallery's sections, and scope all of those lookups to it. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of the row/image markup exist for an instant, and an unscoped `.img` query will happily inject a fresh set of nine masks into the copy that is on its way out.

*(3) Cleanup* — Wrap the initial `gsap.set(mask, { clipPath: initialClipPaths[index] })` calls and the per-row, per-image `gsap.timeline({ scrollTrigger: { trigger: row, ... } })` in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the effect exactly as described above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` undoes the tweens, the per-row `ScrollTrigger`s, and the inline `clip-path` GSAP wrote through `gsap.set` — but it does not undo the DOM nodes `createMasks()` created. `document.createElement`/`appendChild` are plain DOM mutation, invisible to the GSAP context. A StrictMode remount that runs `createMasks()` a second time against the same `.img` elements appends nine more `.mask` divs on top of the nine already there, and every downstream step depends on there being exactly nine: `masks.forEach((mask, index) => gsap.set(mask, { clipPath: initialClipPaths[index] }))` now walks eighteen nodes against nine-entry `initialClipPaths`/`finalClipPaths` arrays, and `Array.from(masks).indexOf(el)` inside the wave tweens starts resolving `.m-1`…`.m-9` against whichever copy happens to sit first in DOM order rather than the set the current effect pass actually built. Guard `createMasks()` itself — skip an `.img` that already has `.mask` children, or clear them before re-injecting — so the count stays at nine no matter how many times the effect body runs.

`gsap.ticker.add` is not covered by the context: the callback that drives `lenis.raf` off GSAP's ticker is neither a tween nor a trigger, so `ctx.revert()` leaves it calling into a `Lenis` instance the same cleanup is about to destroy. Keep the exact function reference passed to `gsap.ticker.add` and call `gsap.ticker.remove` on that reference in the cleanup, alongside `lenis.destroy()`.

Smooth scroll is a document-level resource: there must be exactly one `Lenis` instance on the page, and it must be destroyed when the component that owns it unmounts. If this gallery is one section of a larger app, lift the `Lenis` instance to the app shell and have this effect subscribe `ScrollTrigger.update` to the existing scroll event instead of constructing its own. If this component does own it, construct `Lenis` inside the effect and, in the same cleanup, remove the `lenis.on("scroll", ScrollTrigger.update)` handler, remove the ticker callback as described above, and call `lenis.destroy()` — so a StrictMode remount does not leave a second `Lenis` instance fighting the first one over the same wheel events.
