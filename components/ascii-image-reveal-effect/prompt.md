# ASCII Image Reveal Effect

## Goal
Build an editorial photo grid where **each frame paints itself as live ASCII art on a `<canvas>` the moment it scrolls into view**, then cross-fades into the real photograph. Cells fill in **random order**; the shadow cells snap straight to their final glyph while the mid-tones and highlights — the lit part of the face — **flicker through dense random glyphs** for about three quarters of a second before locking in. When a whole grid has settled it holds for a beat, then dissolves to the photo. Frames that enter together cascade 140 ms apart. Tapping or clicking a frame scans it again.

## Tech
Vanilla HTML/CSS/JS. **No GSAP, no libraries, no framework, no npm dependencies** — the whole effect is hand-rolled with the **Canvas 2D API**, one `requestAnimationFrame` loop per tile, and an `IntersectionObserver`. A single ES-module script (`<script type="module" src="./script.js">`) drives everything.

## Layout / HTML
A single `<section class="gallery">` holding an `.intro` block and **15** `<figure class="frame fN">` elements. Each figure holds a `<div class="img">` wrapper with one `<img class="ascii-reveal">` inside it, plus a `<figcaption>`. The script inserts a `<canvas>` into each `.img` at runtime.

```html
<section class="gallery">
  <div class="intro">…eyebrow, h1, lede, credits, hint…</div>

  <figure class="frame f1">
    <div class="img">
      <img class="ascii-reveal" src="/…/img1.jpg" alt="…" loading="lazy" decoding="async" />
    </div>
    <figcaption><span class="no">01</span>Balm No. 1, travel tin</figcaption>
  </figure>
  … 15 total …
</section>
```

The first four images are `loading="eager"`; the rest are `loading="lazy"`. The DOM order drives nothing on its own — the cascade comes from what enters the viewport, not from the index.

## Styling

### Reset & page
- `* { margin:0; padding:0; box-sizing:border-box; }`
- Palette on `:root`: `--ground:#1a1310` (page), `--frame:#0f0d0b` (tile and canvas ground), `--glyph:#d5cdbd` (canvas ink), `--ink:#efe6d9`, `--muted:#a6907f`, `--carmine:#c33a2e`, `--rose:#d9a290`, `--hairline:rgba(239,230,217,.12)`, `--space:.75rem`.
- Type: "Fraunces" (variable serif) for the editorial voice, "DM Mono" for every technical label — eyebrow, credits, captions, footer line.

**`--frame` and `--glyph` are the ASCII palette and the script reads them with `getComputedStyle` at paint time.** Do not hard-code the two colours in the JS. The moment they live in two places, a palette change repaints the page and leaves the canvases on the old colours — and if the ink ever lands on the ground colour the whole effect goes invisible with nothing in the console.

### Grid (this defines the scattered look)
`.gallery`:
- `position:relative; width:100%; min-height:calc(100svh - 4.2rem);`
- `padding: calc(var(--space)*3) calc(var(--space)*4) calc(var(--space)*6);`
- `display:grid; grid-template-columns:repeat(10,1fr); grid-auto-rows:auto; gap:calc(var(--space)*3) calc(var(--space)*2); align-content:start;`

Ten tracks, **every frame two tracks wide** (`.frame { grid-column: span 2 }`), scattered over six rows with the intro parked at `grid-column: 7 / 11; grid-row: 1 / 3`:

| frame | start column | span | row |   | frame | start column | span | row |
|-------|--------------|------|-----|---|-------|--------------|------|-----|
| 1 | 1 | 2 | 1 |   | 9  | 6 | 2 | 4 |
| 2 | 4 | 2 | 1 |   | 10 | 9 | 2 | 4 |
| 3 | 2 | 2 | 2 |   | 11 | 1 | 2 | 5 |
| 4 | 5 | 2 | 2 |   | 12 | 4 | 2 | 5 |
| 5 | 1 | 2 | 3 |   | 13 | 7 | 2 | 5 |
| 6 | 4 | 2 | 3 |   | 14 | 2 | 2 | 6 |
| 7 | 8 | 2 | 3 |   | 15 | 6 | **4** | 6 |
| 8 | 2 | 2 | 4 |   |    |   |   |   |

**Two tracks, not one.** A one-track frame is about 115 px wide at 1440, and a glyph grid that narrow reads as noise, not as a picture — you cannot see a face in sixteen columns. Two tracks put the tile near 250 px, which is the width at which the ASCII starts holding a likeness. This is a legibility constraint, not a taste one: whatever grid you use, keep the tile at 220 px or wider on desktop.

**The last frame is printed four tracks wide.** Eleven frames over four rows lands as 3 + 3 + 3 + 2, so the final row is always short — and with the intro parked top-right, a short last row leaves the whole bottom-right corner of the sheet empty. Enlarging the closing frame fills that corner, gives the sequence an ending instead of a trailing off, and, because the column count is capped at `MAX_COLUMNS`, renders its glyphs noticeably larger — which is what an enlargement off a contact sheet actually looks like. Rows 4 and 5 also push right (columns 6 and 9, then 7) for the same reason.

### Tiles, images, canvas
- `.img { position:relative; width:100%; aspect-ratio:4/5; overflow:hidden; background:var(--frame); box-shadow:0 0 0 1px var(--hairline); }`
- `.img img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity .55s ease; }`
- `.img canvas { position:absolute; inset:0; width:100%; height:100%; opacity:0; pointer-events:none; transition:opacity .25s ease; }`
- The swap is driven by an `is-ascii` class on the wrapper: `.img.is-ascii img { opacity:0; transition-duration:0s }` and `.img.is-ascii canvas { opacity:1; transition-duration:0s }`. **Entering the ASCII state is instant, leaving it is the eased cross-fade** — the transition belongs to the reveal. Ease both directions and every tile plays a backwards fade from photograph into glyphs before it starts.
- `@media print { .img.is-ascii img { opacity:1 } .img canvas { display:none } }` — print never runs the observer, so without this the page prints whatever the canvases happened to be holding.

**`is-ascii` is added by the script, never written into the markup.** The photo is visible by default, so with JS disabled or broken the page degrades to a plain, perfectly readable gallery. Putting `display:none` (or `opacity:0`) on the `<img>` in the stylesheet inverts that: one thrown exception and the reader gets fifteen empty boxes.

- `.img[role="button"] { cursor:pointer }` and `.img:focus-visible { outline:1px solid var(--carmine); outline-offset:3px }` — the tile only advertises itself as a control once the script has actually wired it up.

### Responsive
- `@media (max-width:1100px)`: `.gallery` becomes `repeat(3,1fr)`, the intro spans `1 / -1`, and `.frame` plus every `.fN` reset to `grid-column:auto; grid-row:auto`. **The reset has to include `.frame` itself**, or the base `span 2` leaks into the collapsed grid and every tile eats two of the three tracks.
- `@media (max-width:768px)`: two columns, nav and brand subtitle hidden, footer stacked. Two columns and not three: below roughly 150 px a tile stops being enough pixels for a glyph grid to hold a face.
- `@media (prefers-reduced-motion:reduce)`: transition durations collapse to `.01ms`.

## The effect (be exact — this is the whole component)

There is no timeline library. Each tile runs its own `requestAnimationFrame` loop over a per-cell state machine.

### Constants (top of the module)
```js
const RAMP            = " .'`:;~+=*xoXO#%@"; // 17 steps, sparse -> dense ink
const SCRAMBLE_FROM   = 5;    // ramp index at or above which a cell flickers
const SCRAMBLE_GLYPHS = "xoXO#%@0369".split("");

const LEVEL_CLIP      = 0.02; // per-frame auto-levels percentile
const MIN_LEVEL_SPAN  = 0.12; // below this the frame is flat — skip the stretch
const TARGET_MID      = 0.40; // where the median cell should land on the ramp
const GAMMA_MIN       = 0.85; // the shadow lift; never brighten past this
const GAMMA_MAX       = 3.0;

const TARGET_CELL_W   = 7;    // wanted on-screen glyph advance, CSS px
const MIN_COLUMNS     = 16;
const MAX_COLUMNS     = 54;
const MIN_ROWS        = 8;

const FRAME_STAGGER_MS  = 140; // cascade between tiles entering together
const APPEAR_MS         = 900; // time for every cell of one tile to pop in
const SCRAMBLE_STEP_MS  = 90;  // how fast a flickering cell flips glyph
const SCRAMBLE_STEPS    = 8;   // flips before it locks
const HOLD_MS           = 450; // finished ASCII stays up before the photo
const MAX_DPR           = 2;

const RESIZE_DEBOUNCE_MS    = 220;
const FONT_TIMEOUT_MS       = 1200;
const OBSERVER_WATCHDOG_MS  = 2500;
const PLACEHOLDER_DENSITY   = 0.12;
const PLACEHOLDER_ALPHA     = 0.16;

const FONT_STACK = '"DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
```

### Rule 1 — ink maps to light, so index by luminance, not by its inverse
The canvas is a dark ground with light glyphs, so **more ink reads as brighter**. A bright pixel therefore has to get the *dense* glyph:

```js
const level = Math.min(RAMP.length - 1, Math.floor(t * RAMP.length));
```

The familiar `Math.floor((1 - brightness) * RAMP.length)` is the dark-ink-on-white-paper convention. Used here it renders a **photographic negative**: a dark portrait comes out as a solid block of `#`, a white sky comes out empty, and every frame looks like a wrong-way-round smear of noise. Nothing errors, nothing logs — the picture is simply unrecognisable. This is the single easiest way to get this component wrong.

### Rule 2 — auto-level each frame before it hits the ramp, in two moves
Seventeen ramp steps is a coarse instrument, and a contact sheet mixes a blown-out concrete facade with a portrait that lives entirely in the bottom fifth of the range.

**(a) Stretch the endpoints.** Per frame: collect the luminance of every cell, sort it, take the 2nd and 98th percentile as `low`/`high`, and stretch that span across the ramp. If the span is under `MIN_LEVEL_SPAN` the frame really is flat, so leave it alone.

**(b) Anchor the gamma on the frame's own median, and only ever downward.** The stretch fixes the endpoints, not the *shape* of the histogram. A high-key frame — glossed lips, a cream bottle on beige, a lipstick on pale stone — still has nearly every cell bunched at the dense end after the stretch, and paints a slab of `#%@` with no picture in it. Solve for the exponent that puts the median cell mid-ramp:

```js
const mid   = clamp01((at(0.5) - low) / span);
const gamma = Math.min(GAMMA_MAX, Math.max(GAMMA_MIN, Math.log(TARGET_MID) / Math.log(mid)));
const t     = clamp01((luminance[i] - low) / span) ** gamma;
```

The `GAMMA_MIN` floor is the important half: it makes the correction **one-sided**. A genuinely dark frame sits at the floor and keeps its darkness; only the high-key ones get compressed. A symmetric version — or a histogram-equalisation blend — pulls every frame toward the same mid-grey and the sheet loses the contrast between a black-ground portrait and a white sky.

Measured over the fifteen frames at a 36 × 27 grid, as the share of cells landing on ramp level ≤ 1 (i.e. near-empty; under about 5 % there is no picture, only texture):

| frame | before | after |   | frame | before | after |
|-------|--------|-------|---|-------|--------|-------|
| img2  | 5 %  | **17 %** |   | img5  | 14 % | 40 % |
| img8  | 5 %  | **24 %** |   | img6  | 30 % | 41 % |
| img11 | 3 %  | **11 %** |   | img13 | 8 %  | 24 % |
| img9  | 11 % | **25 %** |   | img10 | 18 % | 24 % |

The eight low-key frames (img1 66 %, img3 41 %, img4 64 %, img7 30 %, img12 22 %, img14 31 %, img15 48 %) are bit-for-bit unchanged: their gamma is pinned at the floor. Dense-end occupancy on the four offenders falls at the same time — img11 goes from 51 % of cells at level ≥ 12 to 6 %, img2 from 49 % to 25 %.

### Rule 3 — measure the grid, never assume it
Nothing about the grid is a constant. For a tile whose box is `W × H` CSS pixels:

```js
const columns    = clamp(MIN_COLUMNS, Math.round(W / TARGET_CELL_W), MAX_COLUMNS);
const cellWidth  = W / columns;
const fontSize   = cellWidth / advanceRatio;      // advance == exactly one cell
const rows       = Math.max(MIN_ROWS, Math.round(H / fontSize));
const cellHeight = H / rows;                      // the grid tiles the box exactly
```

`advanceRatio` is **measured**, not guessed: `measureText("M").width / 100` on a context set to `100px ${FONT_STACK}`. DM Mono and the platform fallbacks do not agree on advance, and every other number here is derived from it. Deriving the row count from `fontSize` and then re-deriving `cellHeight` from the box is what keeps the ASCII at the photo's aspect ratio — a line height that does not match the cell height stretches or squashes the picture.

Then size the backing store to the box, not to the grid:

```js
const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
canvas.width  = Math.round(W * dpr);
canvas.height = Math.round(H * dpr);
ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
```

**One canvas unit is now one CSS pixel.** The version this replaces built a fixed `25 × 20` grid into a `450 × 560` backing store and let `width:100%` squeeze it into a 115 px tile — a four-fold downscale, which is a blur where the ASCII should be. If the canvas has an intrinsic size that is not the tile's size, you have already lost.

### Step 1 — image → glyph grid
1. **Center-crop to the tile's aspect** (`W / H`, read from the box — not a hard-coded `4/5`), mirroring `object-fit:cover`.
2. **Downsample** the crop into an offscreen canvas sized `columns × rows`, obtained with `getContext("2d", { willReadFrequently: true })`, then `getImageData`.
3. **Per cell**: `luminance = (R*.299 + G*.587 + B*.114) / 255`, then rules 1 and 2 above. Keep two parallel arrays — `glyphs[i]` (the final character) and `levels[i]` (its ramp index, used for the flicker threshold).

Wrap the `getImageData` in `try/catch`. A cross-origin photo served without CORS headers taints the canvas and the read throws; the honest fallback is to give up on the ASCII and reveal the photograph.

### Step 2 — draw a cell
Snap every rect to whole pixels before filling:

```js
const x0 = Math.floor(col * cellWidth),  x1 = Math.floor((col + 1) * cellWidth);
const y0 = Math.floor(row * cellHeight), y1 = Math.floor((row + 1) * cellHeight);
ctx.fillStyle = ground;  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
ctx.fillStyle = ink;     ctx.fillText(glyph, (x0 + x1) / 2, (y0 + y1) / 2);
```

Cells land on fractional coordinates, and a `fillRect` on fractional edges antialiases instead of clearing — it leaves hairline seams of the previous glyph between cells that build up over a second of flicker. Context is set once per tile: `ctx.font = "${fontSize}px ${FONT_STACK}"`, `textAlign = "center"`, `textBaseline = "middle"`. A `" "` glyph is a fill and no text.

### Step 3 — the loop
Per tile: `order` = `[0..n-1]` Fisher–Yates shuffled, `remaining` = `Int8Array(n)`, a `scrambling` `Set`, and counters `cursor`, `settled`, `lastStep`.

Each rAF tick, with `elapsed = now - startedAt`:
1. **Pop in** every cell whose slot has come up: `due = Math.ceil(elapsed / APPEAR_MS * n)`. A cell with `levels[i] >= SCRAMBLE_FROM` gets `remaining[i] = SCRAMBLE_STEPS`, joins `scrambling` and paints a random `SCRAMBLE_GLYPHS` character; anything below paints its final glyph and counts as settled immediately.
2. **Advance the flicker on step boundaries only** — `step = Math.floor(elapsed / SCRAMBLE_STEP_MS)`, and do nothing unless it changed. Every member of `scrambling` decrements; at zero it paints its final glyph, leaves the set and counts as settled, otherwise it paints another random dense glyph. Deleting from a `Set` while iterating it is safe.
3. When `settled === n`, stop the loop and `setTimeout` the reveal by `HOLD_MS`.

The loop only touches every cell on a step boundary — roughly eleven times a second, not sixty. This matters: the version this replaces scheduled one `setTimeout` per cell, which was 7 500 live timers across the page before anything had been drawn.

### Step 4 — the trigger
An `IntersectionObserver` at `{ threshold: 0.2, rootMargin: "0px 0px -6% 0px" }`, `unobserve`d on first hit. A module-level cursor spaces starts `FRAME_STAGGER_MS` apart, so a row of tiles arriving together cascades while a tile arriving alone starts at once:

```js
let nextSlot = 0;
const start = (tile) => {
  const now = performance.now();
  const delay = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + FRAME_STAGGER_MS;
  setTimeout(() => whenDecoded(tile.img).then((ok) => ok ? runTile(tile) : reveal(tile)), delay);
};
```

**On load, not on view, is the bug that kills this component.** A load-triggered one-shot on a page several viewports tall is finished before the reader has scrolled to the second row — on a phone, where the grid is eight screens long, thirteen of the fifteen frames animate to an audience of nobody and the component looks like it does not work at all. Ship the observer.

Each tile also gets `role="button"`, `tabindex="0"`, an `aria-label`, and `click` / `Enter` / `Space` handlers that re-run it. Touch has no hover and no way to re-trigger a one-shot, so the replay affordance has to be a tap — and the intro says so out loud in a `.hint` line.

### Step 5 — the un-scanned state
`is-ascii` goes on at setup, not on entry, so the photograph is never seen before its scan. That leaves eleven tiles below the fold sitting in the ASCII state with nothing painted, and a blank canvas over `background: var(--frame)` is a flat black rectangle — which is what the page looks like in any capture taken before you scroll.

Paint a **placeholder** instead: lay out the tile and dust roughly `PLACEHOLDER_DENSITY` of its cells with a random low-ramp glyph at `globalAlpha = PLACEHOLDER_ALPHA`. It costs no image decode and no timer — about a hundred `fillText` calls per tile, once — and it reads as unexposed stock waiting for the scan rather than as a hole in the page.

The alternative, moving `is-ascii` to the intersection callback, trades the problem for a worse one: the tile shows its photograph, then destroys it into glyphs, then rebuilds it. The reveal only lands if the photograph was never shown.

### Four more gates
- **Fonts.** Run everything behind `document.fonts.ready`, raced against `FONT_TIMEOUT_MS`. `measureText` on the fallback font returns a different advance, and the entire grid is derived from that number — measure early and every tile is built to the wrong cell width. Keep the timeout id and `clearTimeout` it in a `.finally`, or the loser of the race outlives it.
- **Reduced motion.** `matchMedia("(prefers-reduced-motion: reduce)")`: paint the settled grid in one pass, hold for `HOLD_MS * 2`, then reveal. The picture still forms; it just does not flicker.
- **Resize and orientation.** Debounce `resize` and `orientationchange` by `RESIZE_DEBOUNCE_MS`, then walk the tiles: anything still showing its canvas whose box width has changed gets rebuilt — `runTile` if it is mid-scan or in its hold, `paintPlaceholder` if it has not started. Without this, turning the phone leaves a grid built for the old box stretched by CSS into the new one, which is precisely the blur the measured grid exists to prevent. Tiles that have already revealed need nothing: they are showing a CSS-responsive `<img>`.
- **A watchdog on the observer.** `is-ascii` hides the photograph, so an `IntersectionObserver` that never fires — a webview that stubs it, a zero-height ancestor, a print pass — strands the reader with fifteen dark boxes. If no entry at all has fired after `OBSERVER_WATCHDOG_MS`, disconnect and scan every tile. Pair it with the `@media print` rule above; between them there is no path where the photographs stay hidden.

### And one on the images
`whenDecoded` must branch on `img.complete` **before** it branches on `naturalWidth`:

```js
if (img.complete) return Promise.resolve(img.naturalWidth > 0);
```

`complete === true` with `naturalWidth === 0` means the fetch already failed. Waiting on a `load`/`error` that has been and gone returns a promise that never settles, and a tile whose promise never settles keeps `is-ascii` forever — a black box with the photo hidden underneath it. The obvious `if (img.complete && img.naturalWidth)` guard has exactly this hole.

### Net timing feel
A tile takes about **900 ms** to fill plus up to **720 ms** of flicker on its last cells, holds **450 ms**, then cross-fades **550 ms** — roughly two and a half seconds from entering the viewport to being a photograph. Neighbours are 140 ms apart. No easing curves anywhere: the physics is uniform timer spacing.

## Assets / images
**15 images**, an editorial **fashion & beauty** set shot mostly in **high-contrast black and white**, with three colour frames left in as punctuation. All tiles render as **4:5 portraits**; the script center-crops to the tile's aspect regardless of source aspect and downsamples heavily, so fine detail is lost and overall composition, tone and contrast matter far more than resolution. The roles:
- **Monochrome portraits** — the backbone of the set: a portrait under strong side light on a dark ground; a profile with a sleek bob and a pearl earring; a young man with cropped hair in a dark jacket; a bald model in dark tailoring; a face veiled in sheer white fabric; a profile lit by a hard rim light.
- **Monochrome detail and architecture** — a close-up of hands wearing rings in dramatic shadow; an open chrome compact on black; a brutalist facade cut by hard shadows.
- **Movement** — a dancer mid-leap in the studio, high contrast; a motion-blurred figure in white trousers and a grey jacket; a blurred night crowd in warm light.
- **The three colour frames** — an extreme close-up of lips being glossed; a carmine lipstick bullet beside black jars on grey stone; a cream bottle with a black cap among dried flowers on a rock.

Any set of ~15 images at 4:5 works. Do not use real brand imagery. A frame with one clearly lit subject against a darker ground reads best, because the flicker threshold splits the picture along exactly that line — the lit face resolves last while the shadows have already snapped into place. The per-frame auto-levels means an under- or over-exposed frame will still use the whole ramp, so you are no longer forced to hand-pick for contrast.

## Behavior notes
- **Scroll-triggered, once per frame**, with an explicit replay on click/tap/Enter.
- **Degrades cleanly**: with JS off, the gallery is fifteen photographs. With a tainted canvas, a failed image, or a dead `IntersectionObserver`, the affected tiles fall back to photographs rather than staying hidden.
- **Reduced motion** is honoured in both the script and the stylesheet; **print** bypasses the canvas entirely.
- **Nothing outlives the page**: the observer disconnects once every tile has had its turn, and `pagehide` clears the resize timer, the stagger timers, the hold timers and the rAF loops.
- The tile ground, the canvas ground and the per-cell erase are all `var(--frame)`; the glyphs are all `var(--glyph)`. There is exactly one place each colour is written down.

## Images

This component ships with 15 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/ascii-image-reveal-effect/img1.jpg
https://motionprompts.dev/c/ascii-image-reveal-effect/img10.jpg
https://motionprompts.dev/c/ascii-image-reveal-effect/img11.jpg
https://motionprompts.dev/c/ascii-image-reveal-effect/img12.jpg
https://motionprompts.dev/c/ascii-image-reveal-effect/img13.jpg
https://motionprompts.dev/c/ascii-image-reveal-effect/img14.jpg
… 9 more under https://motionprompts.dev/c/ascii-image-reveal-effect/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ground`, `--frame`, `--glyph`, `--ink`, `--muted`, `--carmine`, `--rose`, `--hairline`, `--space`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix. **`--frame` and `--glyph` are load-bearing**: the script reads them off `document.documentElement`, so if you move the palette onto a wrapper you must move that lookup with it.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: fifteen `<img class="ascii-reveal">` elements are queried once, off `document`, when the module runs, and each gets a `<canvas>` created and appended into its tile by hand. There is no cleanup anywhere in the file, because a plain page only ever loads this script once. React withdraws that guarantee while keeping the timing intact, and it does so quietly: the gallery paints correctly on the very first load, and only misbehaves the moment this component gets asked to remount — a path the plain page this was written for never takes.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. A second effect run appends a second `<canvas>` into the same `.img` tile, stacked on top of the first, registers a second `IntersectionObserver` over the same nodes, and starts a second rAF loop — all while the first mount's loop is still running, still painting into a canvas React no longer renders, and still racing to strip the `is-ascii` class off a wrapper it no longer owns. The visible symptom is two canvases stacked in one tile, one of them dead but still burning frames, and it will not reproduce in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — the wiring sits at the top level of the module, behind `document.fonts.ready` and nothing else: it runs as soon as that promise settles. In React that moment can land before the fifteen `.img` tiles exist, so the query would return an empty list. Move the whole thing into a `useEffect` with an empty dependency array, scoped to the gallery's root ref (below) — not into the component body, which would re-run the whole ASCII pass on every render.

*(2) Element lookups and the canvas* — Query `.ascii-reveal` images from the root ref instead of `document`: during the StrictMode remount two copies of the gallery exist for an instant, and an unscoped query can grab the outgoing one. The bigger departure from the original is `wrap.appendChild(canvas)` — the script creates and inserts each `<canvas>` imperatively because it only ever expects to run once. Render the fifteen `<canvas>` elements in JSX instead, one per tile with its own ref, and have the effect draw into those refs. An effect that still calls `appendChild` on every mount stacks one more canvas into every tile each time it runs.

*(3) Cleanup* — four things outlive the synchronous pass that creates them.

**The observer.** `IntersectionObserver` holds a strong reference to every node it observes and to the callback closure. Call `observer.disconnect()` in the cleanup; `unobserve` per element on reveal is an optimisation, not a teardown.

**The rAF loop and the two timers.** Each tile keeps a `frameId` from `requestAnimationFrame` and a `holdId` from the reveal `setTimeout`, plus the stagger `setTimeout` that has not fired yet. Keep the ids on the tile object exactly as the vanilla version does, and have the cleanup walk every tile calling `cancelAnimationFrame(tile.frameId)` and `clearTimeout(tile.holdId)`. A loop that survives an unmount will keep calling `paintCell` on a detached canvas for as long as the page stays open.

**The per-image load gate.** `whenDecoded(img)` resolves from a `load` listener that can fire after the component is gone. Attach the listeners with an `AbortSignal` so removal is automatic, and still guard the body of the `.then` with a ref-backed cancelled flag the cleanup sets — the signal stops a listener that has not fired yet, the flag stops a continuation that had already started.

**The DOM attributes and the class.** The script writes `role`, `tabindex`, `aria-label` and the `is-ascii` class onto nodes React owns. Put all four in JSX (`role="button"`, `tabIndex={0}`, `aria-label={…}`, `className={isAscii ? "img is-ascii" : "img"}`) and drive `is-ascii` off state, or React will fight you for them on the next render.

```jsx
useEffect(() => {
  const controller = new AbortController();
  const tiles = buildTiles(rootRef.current, canvasRefs.current);
  const observer = new IntersectionObserver(onEnter, OBSERVER_OPTIONS);
  tiles.forEach((tile) => observer.observe(tile.wrap));

  return () => {
    controller.abort();
    observer.disconnect();
    tiles.forEach((tile) => {
      cancelAnimationFrame(tile.frameId);
      clearTimeout(tile.holdId);
    });
  };
}, []);
```
