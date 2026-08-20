---
slug: fiddle-digital-hover-effect
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Digital Scramble Hover Effect

## Goal

Build a full-viewport page with a single centered hero image. The star effect: an **invisible grid of tiny fixed cells** is overlaid exactly on top of the image, and each cell secretly holds a random monospace symbol (`O X * > $ W`). As the cursor moves across the image, the cell nearest the pointer — **plus a short random chain of up to 7 of its neighbors** — briefly flips to a solid black tile with a visible white glyph, and a subset of those tiles **scrambles its symbol every 150 ms**. Each activated tile stays lit for ~300 ms then fades back to invisible. The net result is a live **digital-noise / glitch trail** of black glyph-blocks that follows the mouse across the picture, like the image is being "read" pixel-by-pixel.

## Tech

Vanilla HTML/CSS/JS with an ES-module script (`<script type="module" src="./script.js">`). **No GSAP, no Lenis, no libraries, no npm dependencies at all.** The entire effect is hand-rolled with a `mousemove` listener, `Date.now()` timestamps, `setInterval` scramble tickers, and one `requestAnimationFrame` loop that expires lit cells. Do not reach for any tween/animation library — the original is intentionally timer- and class-toggle-driven (the only "animation" is a CSS `opacity` on/off).

## Layout / HTML

Minimal, three fixed elements plus the hero. The grid overlay is **built in JS**, not authored in HTML.

```html
<nav>
  <p>Scramble Hover Effect</p>
  <p>MP01701202025</p>
</nav>

<section class="hero">
  <div class="hover-img">
    <img src="/path/to/hero.jpg" alt="" />
  </div>
</section>

<footer>
  <p>Experiment 515</p>
  <p>Developed by Studio</p>
</footer>

<script type="module" src="./script.js"></script>
```

Use neutral placeholder text as above (no real brand names). The `.hover-img` wrapper is the interaction surface and the container the JS injects `.grid-overlay` into.

## Styling

Fonts (Google Fonts): **IBM Plex Mono** (weights 100–700, used for the grid glyphs) and **Inter** (used for the nav/footer text).

- Reset: `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { background-color:#e3e3db; }` — warm off-white/grey. This exact value is reused as the glyph text color so the white symbols match the page.
- `p { font-family:"Inter",sans-serif; font-size:0.8rem; font-weight:500; letter-spacing:-0.01rem; }`
- `nav, footer { position:fixed; width:100%; padding:2rem; display:flex; justify-content:space-between; align-items:center; z-index:2; }` — `nav { top:0; }`, `footer { bottom:0; }`.
- `.hero { position:relative; width:100%; height:100svh; display:flex; justify-content:center; align-items:center; }` — vertically & horizontally centers the image.
- `.hover-img { position:relative; width:700px; height:500px; overflow:hidden; }` — **fixed 700×500 box** (7:5). The fixed pixel size matters: it determines the grid dimensions (see below).
- `.hover-img img { width:100%; height:100%; object-fit:cover; }`

Grid overlay styling (the JS injects these elements; the CSS must exist):

- `.grid-overlay { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2; }` — sits on top of the image; **`pointer-events:none`** so the mouse events fire on `.hover-img`, not the overlay.
- `.grid-block { position:absolute; display:flex; justify-content:center; align-items:center; background-color:#1a1a1a; color:#e3e3db; font-family:"IBM Plex Mono",monospace; font-size:20px; font-weight:400; opacity:0; }` — near-black tile, off-white glyph, **hidden by default (`opacity:0`)**.
- `.grid-block.active { opacity:1; }` — the **only** thing that makes a tile visible is toggling the `active` class. There is no CSS transition, so the on/off is instant (the "fade" feel comes purely from how many tiles are lit at once around the cursor).

## The effect (be exact — this is the whole component)

### Config (top of the module)

```js
const config = {
  symbols: ["O", "X", "*", ">", "$", "W"], // the 6 glyphs a cell can show
  blockSize: 25,        // px — cell width & height
  detectionRadius: 50,  // px — max distance mouse→cell-center to trigger
  clusterSize: 7,       // max length of the random neighbor chain
  blockLifetime: 300,   // ms a lit cell stays active
  emptyRatio: 0.3,      // 30% of cells are permanently blank (no glyph)
  scrambleRatio: 0.25,  // 25% of non-empty cells are "scramblers"
  scrambleInterval: 150 // ms between symbol changes while scrambling
};
const getRandomSymbol = () => config.symbols[Math.floor(Math.random() * config.symbols.length)];
```

### Building the grid (`initGridOverlay(element)`, run per `.hover-img` on `DOMContentLoaded`)

1. Create `<div class="grid-overlay">`.
2. `width = element.offsetWidth` (700), `height = element.offsetHeight` (500).
3. `cols = Math.ceil(width / blockSize)` → `ceil(700/25)` = **28**; `rows = Math.ceil(height / blockSize)` → `ceil(500/25)` = **20**. So **28 × 20 = 560 cells**.
4. Loop `row` 0..rows-1, `col` 0..cols-1. For each cell create `<div class="grid-block">` and:
   - `isEmpty = Math.random() < emptyRatio` (30%). `textContent = isEmpty ? "" : getRandomSymbol()`.
   - Absolutely position it: `style.width/height = "25px"`, `style.left = col*25 + "px"`, `style.top = row*25 + "px"`.
   - Append to the overlay, and push a state object into a `blocks[]` array:
     ```js
     {
       element,
       x: col*blockSize + blockSize/2,   // cell CENTER x (used for distance)
       y: row*blockSize + blockSize/2,   // cell CENTER y
       gridX: col, gridY: row,
       highlightEndTime: 0,              // timestamp when this cell should turn off
       isEmpty,
       shouldScramble: !isEmpty && Math.random() < scrambleRatio, // ~25% of filled cells
       scrambleInterval: null            // holds the setInterval id while scrambling
     }
     ```
5. Append `.grid-overlay` into `element`.

### Pointer interaction (`mousemove` on `.hover-img`)

On every `mousemove`:

1. `rect = element.getBoundingClientRect()`; `mouseX = e.clientX - rect.left`, `mouseY = e.clientY - rect.top`.
2. **Find the single closest cell** by scanning all `blocks` and computing Euclidean distance from the mouse to each cell center `(block.x, block.y)`; keep the minimum.
3. **Guard:** if there is no closest block **or** `closestDistance > detectionRadius` (50px), `return` — nothing happens when the pointer is far from any cell center.
4. `currentTime = Date.now()`. Activate the closest cell:
   - `closestBlock.element.classList.add("active")`.
   - `closestBlock.highlightEndTime = currentTime + blockLifetime` (now + 300 ms).
   - If `closestBlock.shouldScramble && !closestBlock.scrambleInterval`: start `setInterval(() => el.textContent = getRandomSymbol(), scrambleInterval)` (change its glyph every 150 ms) and store the id.
5. **Random neighbor chain (the trail spread):**
   - `clusterCount = Math.floor(Math.random() * clusterSize) + 1` → a random integer **1..7**.
   - `currentBlock = closestBlock`, `activeBlocks = [closestBlock]`.
   - Loop `i` from `0` to `clusterCount-1`:
     - Build `neighbors` = all `blocks` **not already** in `activeBlocks` whose grid position is within the 8-cell Moore neighborhood of `currentBlock`: `Math.abs(gridX - currentBlock.gridX) <= 1 && Math.abs(gridY - currentBlock.gridY) <= 1`.
     - If `neighbors` is empty, `break`.
     - Pick a **random** neighbor. Add `active`, set its `highlightEndTime = currentTime + blockLifetime + i*10` (each successive link lives ~10 ms longer, so the tail fades slightly after the head). If it's a scrambler and not already scrambling, start its scramble interval too.
     - Push it to `activeBlocks` and set `currentBlock = randomNeighbor`.
   - Because `currentBlock` advances to the just-picked neighbor, this is a **random walk**: each `mousemove` lights the nearest cell then wanders 1–7 steps outward through touching cells, producing an irregular organic blob/trail rather than a neat radius.

### The rAF expiry loop (`updateHighlights`)

One `requestAnimationFrame` loop runs forever:

```js
function updateHighlights() {
  const currentTime = Date.now();
  blocks.forEach((block) => {
    if (block.highlightEndTime > 0 && currentTime > block.highlightEndTime) {
      block.element.classList.remove("active");   // turn the tile invisible again
      block.highlightEndTime = 0;
      if (block.scrambleInterval) {
        clearInterval(block.scrambleInterval);
        block.scrambleInterval = null;
        if (!block.isEmpty) block.element.textContent = getRandomSymbol(); // reset to a fresh symbol
      }
    }
  });
  requestAnimationFrame(updateHighlights);
}
updateHighlights();
```

So each lit cell auto-deactivates once `Date.now()` passes its `highlightEndTime` (~300 ms after it was touched), its scramble ticker is cleared, and a scrambler cell is reset to a new static symbol. The cursor continually re-lights cells ahead of it while the loop extinguishes the ones behind → a self-erasing trail.

### Timing / feel summary

- No easing, no interpolation, no transitions. Visibility is a hard `opacity 0↔1` class toggle; the softness of the trail comes from many cells lighting/expiring around the moving pointer.
- Head cells live 300 ms; chained tail cells 300–360 ms. ~25% of touched non-empty cells flicker through the 6 symbols at 150 ms while lit. ~30% of cells are permanently blank, so the trail has gaps (reads as "digital noise", not a solid block).
- Triggered **only** by `mousemove` over the image; there is no load, scroll, or click animation.

## Assets / images

**One hero image**, sized to fill a **700×500 (7:5) landscape box** (`object-fit:cover`; the source asset is a square ~1:1 portrait that gets center-cropped to the landscape box). Role: the central subject the scramble grid overlays and appears to "scan". A stylized, graphic, high-contrast editorial illustration works best. The original is a hand-drawn, ink-and-wash / screenprint-style bust portrait of a young Black woman looking at the camera: she wears a white bucket hat, small gold hoop earrings, and a dark collared jacket over a white top. The palette is a striking two-tone duotone — her skin and clothing rendered almost entirely in bold cobalt/royal blue with near-black shadow linework, set against a flat warm cream/beige background; the hat and inner top read as off-white highlights. Any bold, poster-like portrait at ~7:5 with a single dominant accent color and a plain contrasting background is fine; do not use real brand imagery. Because the black glyph-tiles sit on top of it, an image with strong shapes and high color contrast reads well through the noise.

## Behavior notes

- **Desktop / pointer-driven only** — the whole effect is `mousemove`-based (no touch/click/scroll path in the original).
- The grid is regenerated from `offsetWidth/offsetHeight` at init, so it assumes the fixed 700×500 box; keep that size (or the cell count changes).
- Symbols, empty cells, and scrambler cells are randomized per page load, so the exact noise pattern differs each run — that's expected.
- No reduced-motion branch; the rAF loop always runs. The page background `#e3e3db`, tile background `#1a1a1a`, and glyph color `#e3e3db` must match these values for the look to read correctly.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/fiddle-digital-hover-effect/img.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--room`, `--sheet`, `--ink`, `--cobalt`, `--sky`, `--sky-dim`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone module: it waits for the document to be ready, walks every `.hover-img` on the page, and for each one builds an independent grid of `.grid-block` cells — a `blocks[]` array of cell state, a `mousemove`/`touchmove` pair, a fan-out of `setInterval` scramble tickers, and one `requestAnimationFrame` loop, all closed over that single element. It never has to undo any of that, because the tab reloads long before a second pass over `.hover-img` could run. React withdraws that guarantee: under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. If the teardown this module already builds does not make it into that unmount, the second mount runs `initGridOverlay` again against the same `.hover-img` while the first grid's overlay, rAF loop, and any scramble timers that happened to be firing under the pointer are all still live — two `.grid-overlay` nodes stacked on the same image, two expiry loops fighting over which one gets to clear `active`, and orphaned scramble intervals rewriting `textContent` on `.grid-block` divs that belong to the overlay that already got replaced. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The bottom of the module branches on `window.MP`: with the internal editor present it calls `window.MP.register({ defaults: DEFAULTS, mount })` and lets the editor decide when `mount()` runs; without it, the `else` branch is dcl-guarded — it checks `document.readyState` before subscribing to `DOMContentLoaded`, then calls `boot()`. Neither branch is relevant to a React host: `window.MP` will never exist outside this catalogue's own editor, so you are always on the guarded path, and `useEffect` already runs after commit, which is later than `DOMContentLoaded` fires in every case that guard was written for. Drop the `window.MP` check, the `readyState` guard and the listener together, and call `mount(Object.assign({}, DEFAULTS))` directly inside a `useEffect` with an empty dependency array. There is no restructuring to do beyond that: `mount()` already returns the exact shape `useEffect` wants — a function that tears down every grid it built — because the same function has to serve the editor calling `mount()` again with new knob values. Return that value as the effect's cleanup, unchanged.

*(2) Element lookups* — `mount()` calls `document.querySelectorAll(".hover-img")` and builds one independent grid per match, which is how the vanilla version supports more than one hover-image on the same page. A React component instance owns exactly one `.hover-img`. Put a ref on that element, call `initGridOverlay` once against `ref.current`, and drop the `querySelectorAll` sweep entirely — do not just narrow it to `rootRef.current.querySelectorAll(...)` and keep iterating, since that still leaves the door open to matching more than the one element this instance owns. This matters during the StrictMode remount specifically: for the instant both copies of the subtree coexist, an unscoped `querySelectorAll(".hover-img")` would build a second grid over the outgoing copy too, not just skip it.

*(3) Cleanup* — There is no GSAP, no Lenis, no SplitText here, only the loop and the timers `initGridOverlay` already manages, detailed below. The fragment that replaces the guarded `boot()` call:

```jsx
useEffect(() => {
  const element = hoverImgRef.current;
  if (!element) return;
  const destroy = initGridOverlay(element, config, symbols);
  return destroy;
}, []);
```

### The rAF loop and the scramble timers

`initGridOverlay` keeps the id its last `requestAnimationFrame(updateHighlights)` call returned in `frame`, and the teardown it returns calls `cancelAnimationFrame(frame)` — keep that pairing intact, because a lost handle is exactly what leaves `updateHighlights` running against a `blocks[]` array whose overlay has already been removed from the document. The teardown also removes both the `mousemove` and the `touchmove` listener from `element`; drop either one in translation and the surviving listener keeps calling `handlePointer` against cells no longer visible anywhere.

The instance-specific hazard is the scramble timers. A single pointer move can light the closest cell plus a random chain of neighbors reaching the configured cluster length, and any of those cells flagged as a scrambler starts its own `setInterval` ticking at the configured scramble cadence — so at the moment of a StrictMode unmount there can be several of these running at once, each holding a closure over one `.grid-block` div, independent of the rAF loop and independent of each other. The existing cleanup handles this by walking `blocks` and calling `clearInterval` on every block that has one live; port that loop as-is. Skip it and each surviving timer keeps rewriting `textContent` into a detached node at its configured interval for as long as the tab stays open — one more silent timer per remount this route survives, and because the div it targets was already removed with the rest of `.grid-overlay`, nothing on screen indicates it is still running.
