---
slug: junni
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 12
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Tile Flip Board — full-screen 6×6 grid of 3D tiles, hover spin + board-wide flip reveal

## Goal

Build a full-viewport **6×6 grid of 3D flip tiles**. Each tile shows a slice of one shared poster image (the image is split across the whole grid via `background-position`), so at rest the 36 tiles reconstruct a single full-bleed poster. **Hovering a tile fires a GSAP timeline that spins it a complete 360° turn on `rotateX` while tilting on `rotateY`** (the tilt magnitude/direction depends on the tile's column, so tiles lean away from the board's vertical centreline). A **"Flip Tiles" button** flips the entire board 180° on `rotateX` with a **random-order stagger**, swapping every tile from the front poster to a second (back) poster and back again. A **fixed grid overlay** highlights the single 50×50px cell under the cursor on every `mousemove`, leaving a fading white-outline trail.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) only — **no GSAP plugins, no ScrollTrigger, no smooth-scroll, no Three.js**. Everything runs after `DOMContentLoaded`. Ship one `index.html` (`<link rel="stylesheet" href="./styles.css">`, `<script type="module" src="./script.js">`), one `styles.css`, one ES-module `script.js`. Must run in a fresh Vite + npm project.

## Layout / HTML

```html
<nav>
  <a href="#">Junni</a>
  <button id="flipButton">Flip Tiles</button>
</nav>

<section class="board"></section>

<div class="blocks-container">
  <div id="blocks"></div>
</div>
```

- `.board` is **empty in markup** — the JS builds `.row` × 6, each containing `.tile` × 6.
- Each `.tile` gets two faces built by JS:
  ```html
  <div class="tile">
    <div class="tile-face tile-front"></div>
    <div class="tile-face tile-back"></div>
  </div>
  ```
- `#blocks` is **empty in markup** — the JS fills it with `.block` divs (the cursor-grid overlay).
- Nav label text is the neutral demo name (e.g. `Junni`); the button reads `Flip Tiles`. No real brand names.

## Styling

**Reset**: `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; }`.

**Fonts**: nav link and button use a **bold uppercase display font** (the original uses a custom face named `"MOSKO MAPPA"`; since there's no `@font-face`, just declare it with a heavy display/grotesque fallback stack, e.g. `"MOSKO MAPPA", "Anton", "Archivo Black", sans-serif`). Everything is `text-transform: uppercase`.

**Nav** — `position:absolute; top:0; left:0; width:100vw; display:flex; justify-content:space-between; align-items:center; padding:2em; z-index:10; pointer-events:none;`. Children re-enable pointer events (`pointer-events:all`).
- `nav a`: `color:#fff; text-decoration:none; text-transform:uppercase; font-size:28px;`.
- `nav button`: `border:none; outline:none; color:#fff; background-color:#000; border-radius:0.25em; padding:0.65em 1em 0.25em 1em; text-transform:uppercase; font-size:24px;`.

**Board (the 3D stage)** — `.board { width:100vw; height:100vh; padding:0.25em; display:flex; flex-direction:column; gap:0.25em; perspective:1000px; background-color:#000; position:relative; z-index:1; }`. The **`perspective:1000px` is load-bearing** — it gives the tile spins their 3D depth.

**Row** — `.row { flex:1; display:flex; gap:0.25em; }` (6 equal rows stacked; each row's 6 tiles are equal flex columns). The `0.25em` gaps + black board background read as thin black gridlines between tiles.

**Tile** — `.tile { flex:1; position:relative; transform-style:preserve-3d; }`. **`transform-style:preserve-3d` is essential** so the two faces occupy real 3D space and the back hides when facing away.

**Faces** — `.tile-face { position:absolute; width:100%; height:100%; backface-visibility:hidden; border-radius:0.5em; overflow:hidden; }`. `backface-visibility:hidden` is what makes each face vanish when rotated past 90°.
- `.tile-front { background-color:darkslategrey; }`
- `.tile-back { background-color:darkslategrey; transform:rotateX(180deg); }` — the back face is pre-rotated 180° on X so it reads correctly once the tile flips.

**Image slicing (the reconstruction trick)** — each face paints its image through a `::before`:
```css
.tile-front::before,
.tile-back::before {
  content:"";
  position:absolute;
  top:0; left:0; right:0; bottom:0;
  background-size:600% 600%;          /* 6× the tile → one image spans the whole 6×6 board */
  background-position:inherit;         /* inherits the per-tile position set inline by JS */
  clip-path:inset(0 round 0.25em);
}
.tile-front::before { background-image:url("<front poster image>"); }
.tile-back::before  { background-image:url("<back poster image>"); }
```
Both faces share `background-size:600% 600%`; the JS writes each face's `background-position` inline so the 36 tiles crop a 6×6 mosaic that reconstructs the whole poster.

**Cursor-grid overlay** — `.blocks-container { position:fixed; top:0; left:0; width:100vw; height:100vh; overflow:hidden; pointer-events:none; z-index:2; }`. `#blocks { width:105vw; height:100vh; display:flex; flex-wrap:wrap; justify-content:flex-start; align-content:flex-start; overflow:hidden; }`. `.block { width:50px; height:50px; border:0.5px solid transparent; transition:border-color 0.3s ease; }`. `.highlight { border-color:#fff; }` — the highlighted cell shows a thin white outline that fades in/out over the `border-color` transition.

## GSAP effect (be exhaustive)

### Imports & constants
```js
import gsap from "gsap";

const ROWS = 6;
const COLS = 6;
const BLOCK_SIZE = 50;
const COOLDOWN = 1000;   // ms hover throttle per tile
let isFlipped = false;   // module-level board flip state (front vs back poster)
```

### Building the board
- `createBoard()` appends 6 `.row` divs, each with 6 tiles from `createTile(row, col)`.
- `createTile(row, col)` builds the two-face markup, then computes `bgPosition = \`${col * 20}% ${row * 20}%\`` and writes it as inline `style.backgroundPosition` on **both** `.tile-front` and `.tile-back`. Columns 0–5 map to `0% 20% 40% 60% 80% 100%` horizontally; rows 0–5 the same vertically. Combined with the CSS `background-size:600% 600%`, each tile crops its unique 1/6 × 1/6 slice.

### 1. Hover spin (per tile, `mouseenter`)
Attach to every `.tile` (query after building). Keep a per-tile `lastEnterTime = 0`.
- On `mouseenter`, throttle: only proceed if `Date.now() - lastEnterTime > COOLDOWN` (1000 ms). Update `lastEnterTime`. **Re-entering the same tile within 1s does nothing** (an animating tile can't be re-triggered mid-spin).
- Compute the tilt from the tile's **index in the flat `.tile` NodeList** (`index % 6` = its column):

  | `index % 6` (column) | 0 | 1 | 2 | 3 | 4 | 5 |
  |---|---|---|---|---|---|---|
  | `tiltY` (deg) | −40 | −20 | −10 | +10 | +20 | +40 |

  Left half tilts negative, right half positive, magnitude grows toward the outer columns — the board "fans" away from its vertical centre.
- Call `animateTile(tile, tiltY)`, a **`gsap.timeline()`** with three steps:

  ```js
  gsap.timeline()
    .set(tile, { rotateX: isFlipped ? 180 : 0, rotateY: 0 })
    .to(tile, { rotateX: isFlipped ? 450 : 270, rotateY: tiltY, duration: 0.5, ease: "power2.out" })
    .to(tile, { rotateX: isFlipped ? 540 : 360, rotateY: 0,     duration: 0.5, ease: "power2.out" }, "-=0.25");
  ```

  - **`.set`** snaps the tile to its current resting face (`rotateX` = 180 if the board is flipped, else 0) and zeroes `rotateY`.
  - **Tween 1** spins ¾ of a turn (+270° on `rotateX`) and tilts out to `tiltY`, `duration:0.5`, `ease:"power2.out"`.
  - **Tween 2** completes the full turn (+360° total from the start) and returns `rotateY` to 0, `duration:0.5`, `ease:"power2.out"`, positioned **`"-=0.25"`** so it overlaps the first tween by 0.25s (the two half-second tweens run ~0.75s total).
  - Net motion: a **complete 360° `rotateX` flip that lands back on the same face** (a flourish, not a reveal), with `rotateY` going 0 → `tiltY` → 0. Which poster is visible is governed only by `isFlipped`.

### 2. Board flip (`#flipButton` click)
```js
flipButton.addEventListener("click", () => flipAllTiles(tiles));

function flipAllTiles(tiles) {
  isFlipped = !isFlipped;
  gsap.to(tiles, {
    rotateX: isFlipped ? 180 : 0,
    duration: 1,
    stagger: { amount: 0.5, from: "random" },
    ease: "power2.inOut",
  });
}
```
- Toggles `isFlipped`, then tweens **all 36 tiles' `rotateX` to an absolute 180° (or back to 0°)**, `duration:1`, `ease:"power2.inOut"`.
- **`stagger:{ amount:0.5, from:"random" }`** — the 36 flips are spread across a total of 0.5s in random order, so the board flips as a scattered wave. This is the real front↔back poster reveal (the hover spin never changes the visible face).

### 3. Cursor grid overlay (`mousemove`)
- `createBlocks()`: `numCols = Math.ceil(window.innerWidth / 50)`, `numRows = Math.ceil(window.innerHeight / 50)`, append `numCols * numRows` `.block` divs (each `data-index=i`) into `#blocks`. Store `{ numCols, numBlocks }` on `window.blockInfo`.
- `document.addEventListener("mousemove", highlightBlock)`: measure `#blocks` `getBoundingClientRect()`, `col = Math.floor((e.clientX - rect.left)/50)`, `row = Math.floor((e.clientY - rect.top)/50)`, `index = row * numCols + col`. Add `.highlight` to `blocks.children[index]`, then `setTimeout(() => block.classList.remove("highlight"), 250)`. The CSS `transition:border-color 0.3s ease` fades the white outline in and out, so the cursor drags a trail of briefly-lit grid cells.

### Timing / easing summary
| Action | property | from → to | duration | ease | stagger / position |
|---|---|---|---|---|---|
| hover — set | `rotateX` / `rotateY` | → `0 or 180` / `0` (snap) | — | — | timeline start |
| hover — tween 1 | `rotateX` / `rotateY` | +270° / 0 → `tiltY` | 0.5 | `power2.out` | — |
| hover — tween 2 | `rotateX` / `rotateY` | +360° total / `tiltY` → 0 | 0.5 | `power2.out` | `"-=0.25"` overlap |
| board flip | `rotateX` | 0 ↔ 180 (absolute) | 1 | `power2.inOut` | `{ amount:0.5, from:"random" }` |
| cell highlight | `border-color` (CSS) | transparent → `#fff` → transparent | 0.3s CSS | ease | 250ms hold |

### Init order
`init()` runs on `DOMContentLoaded`: `createBoard()` → attach tile `mouseenter` handlers + button click → `window.blockInfo = createBlocks()` → add the `mousemove` listener.

## Assets / images

**2 full-bleed landscape posters** (roughly viewport aspect, ~16:9 / 3:2), each displayed once but sliced across the entire 6×6 grid:

- **Front poster** — a dark charcoal/near-black background with a **large bold white display wordmark** centred, and a small **handwritten-script tagline** beneath it. This is the board's initial (unflipped) state. Use neutral invented text, no real brands.
- **Back poster** — an **electric-blue background** with a **bold white all-caps headline**, two lines of smaller uppercase subtext, and a small monogram/mark. This is revealed after pressing **Flip Tiles**. Neutral invented text, no real brands.

Because `background-size:600% 600%` stretches each image to 6× the tile box, any image reconstructs seamlessly across the board; pick landscape art whose composition reads well when tiled into 36 rounded cells.

## Behavior notes

- **Desktop / mouse-driven** — the whole thing is hover- and `mousemove`-based; there's no touch fallback (leave as-is).
- **Hover throttle** — each tile's 1000ms cooldown means a spin always finishes before it can be re-triggered; sweeping the cursor across the board fires a lively cascade of independent 360° spins, one per fresh tile.
- **Hover vs flip are independent** — the hover timeline reads `isFlipped` to spin around whichever face is currently showing but always returns to it; only the button changes which poster is face-up.
- **Cursor grid never blocks clicks** — `.blocks-container` is `pointer-events:none` (over the board, `z-index:2`), while the nav/button sit at `z-index:10` with pointer events re-enabled.
- No console errors; nothing hijacks scroll (the board is a fixed full-screen stage).

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/junni/back.jpg
https://motionprompts.dev/c/junni/front.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--tile-base`, `--paper`, `--paper-dim`, `--amber`, `--font`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, builds its own DOM (`createBoard()`, `createBlocks()`), wires plain `addEventListener` calls onto the tiles, the flip button and `document` itself, and leans on two pieces of state — `isFlipped` and `window.blockInfo` — that live outside any function, at module or global scope. React withdraws every one of those guarantees at once, and it does it quietly: the board looks right on the first paint, and the damage only shows up on a second mount, or on the very first hover after one.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves two of everything here: two `mouseenter` listeners stacked on each of the 36 freshly-built `.tile` elements, two `click` listeners on `#flipButton`, and two `mousemove` listeners on `document`, each pair independently deciding which cell under the cursor gets `.highlight`. Worse, `isFlipped` is declared with `let` at module scope, so unmount does not reset it at all — it survives the whole remount cycle. The second mount rebuilds a brand-new, unrotated board (a fresh `createBoard()` call always starts every tile showing its front face), but `isFlipped` can already be `true` from whatever the first mount's cleanup interrupted mid-gesture, so the very first hover after remount runs `.set(tile, { rotateX: 180 })` against a tile the DOM never actually rotated — it silently snaps to a face it was never showing, then spins on from there. None of this throws, and none of it reproduces in a production build, because React only double-invokes effects in development.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener at the bottom of the file is never called and the board never gets built — no error, no tiles, nothing to debug. Delete the listener and move `init()`'s body — `createBoard()`, wiring the tile and button listeners, building the cursor grid, and the `document` `mousemove` subscription — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `createBoard()` resolves `.board` with `document.querySelector`, `initializeTileAnimations()` resolves every `.tile` with `document.querySelectorAll` and `#flipButton` with `document.getElementById`, and `createBlocks()` / `highlightBlock()` both resolve `#blocks` the same way. All four assume this component owns the whole document. Give the section a root `ref`, render `.board`, `#flipButton` and the blocks container inside it, and resolve every one of these off `rootRef.current` instead of `document`. The two `getElementById` calls are the sharper case: IDs are meant to be unique, so during the StrictMode instant where two copies of this markup can exist, `document.getElementById("flipButton")` has no way to know which `#flipButton` belongs to the copy on its way out.

*(3) Cleanup* — Wrap the setup in a `gsap.context` scoped to the root ref, but the tile spin and the board flip both need `self.add`, not just a plain wrapper, because neither runs synchronously while the context's factory executes: `animateTile()` only runs later, from inside a `mouseenter` handler, and `flipAllTiles()` only runs later, from inside the button's `click` handler. A tween created inside a handler that fires after the factory has already returned is invisible to the context unless that handler was itself registered through `self.add` — register both under names and trigger them back through the context, not through the module-level functions directly:

```jsx
useEffect(() => {
  const tileHandlers = [];
  let flipButton, onFlip;

  const ctx = gsap.context((self) => {
    self.add("spinTile", (tile, tiltY) => { /* animateTile's three-step timeline, unchanged */ });
    self.add("flipAll", (tiles) => { /* flipAllTiles's board-wide tween, unchanged */ });

    const tiles = rootRef.current.querySelectorAll(".tile");
    tiles.forEach((tile, index) => {
      let lastEnterTime = 0;
      const onEnter = () => {
        const now = Date.now();
        if (now - lastEnterTime <= COOLDOWN) return;
        lastEnterTime = now;
        ctx.spinTile(tile, /* the index % 6 tilt lookup above, unchanged */ tiltFor(index));
      };
      tile.addEventListener("mouseenter", onEnter);
      tileHandlers.push([tile, onEnter]);
    });

    flipButton = rootRef.current.querySelector("#flipButton");
    onFlip = () => ctx.flipAll(tiles);
    flipButton.addEventListener("click", onFlip);
  }, rootRef);

  return () => {
    tileHandlers.forEach(([tile, fn]) => tile.removeEventListener("mouseenter", fn));
    flipButton.removeEventListener("click", onFlip);
    ctx.revert();
  };
}, []);
```

Without `self.add`, `ctx.revert()` on unmount kills nothing from a spin that was mid-flight or a flip that was still running when the user navigated away — those animations were never recorded into the context, so they keep writing `rotateX`/`rotateY` onto tiles that may already be detached. Without the explicit `removeEventListener` calls, the plain `addEventListener`s survive the revert entirely, since a DOM listener is neither a tween nor a trigger and the context has no way to know it exists.

Two more pieces of state need to move inside this same effect instead of staying where the script puts them. `isFlipped` has to become a plain variable in the effect's closure (or a ref, if something outside the effect needs to read it) — not a module-level `let` — so every mount starts it at `false` again, matching the freshly-built, always-unrotated board `createBoard()` just produced. And `window.blockInfo` has to become a local `{ numCols, numBlocks }` captured directly by the `mousemove` handler's own closure instead of read off `window` on every mouse move: the global assignment means a second instance of this component, or the StrictMode remount, silently overwrites the first one's grid geometry out from under it, and nothing about the mechanism requires going through `window` once the value can live in the same closure that owns the listener.
