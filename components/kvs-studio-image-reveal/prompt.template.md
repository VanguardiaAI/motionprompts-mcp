---
slug: kvs-studio-image-reveal
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Studio Scroll-Powered Image Reveal — clip-path wipe with ASCII dissolve band

## Goal
Build a pinned, full-viewport **stack of five images** that is scrubbed through by scrolling. As you scroll, the top image's `clip-path` **wipes upward** (its top edge slides down) to uncover the next image below it, one image at a time — four transitions total. The star effect: riding exactly on the moving wipe edge is a **band of orange ASCII glyphs** (a fixed 16px grid of random characters) that **dithers/dissolves** the boundary — a dense scatter of flickering monospace characters that fades out above and below the edge with a probabilistic density falloff, so the hard clip line reads as a granular, disintegrating transition. Everything is driven by a single pinned `ScrollTrigger` with `scrub`, synced to Lenis smooth scrolling.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**, and **`lenis`** for smooth scroll. Register the plugin with `gsap.registerPlugin(ScrollTrigger)`. There is **no** SplitText / CustomEase / Three.js here — the dissolve is a hand-built DOM grid of `<div>` cells whose visibility is toggled every frame from the ScrollTrigger `onUpdate` callback. No GSAP tweens/timelines are used at all; all motion comes from `scrub` progress driving direct `style` writes.

Lenis wiring (exact):
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

## Layout / HTML
Three stacked full-viewport `<section>`s in document order:

1. `<section class="intro">` — a single centered uppercase mono `<p>` (copy: `Scroll down to decode the craft`).
2. `<section class="spotlight">` — the pinned stage. Contains **five** `<div class="spotlight-img">`, each wrapping one `<img>`, followed by one empty `<div class="dissolve-grid">` (the ASCII overlay, populated at runtime).
3. `<section class="outro">` — a single centered uppercase mono `<p>` (copy: `The rest is under NDA`).

```html
<section class="intro"><p>Scroll down to decode the craft</p></section>
<section class="spotlight">
  <div class="spotlight-img"><img src="/…/img-1.jpg" alt="" /></div>
  <div class="spotlight-img"><img src="/…/img-2.jpg" alt="" /></div>
  <div class="spotlight-img"><img src="/…/img-3.jpg" alt="" /></div>
  <div class="spotlight-img"><img src="/…/img-4.jpg" alt="" /></div>
  <div class="spotlight-img"><img src="/…/img-5.jpg" alt="" /></div>
  <div class="dissolve-grid"></div>
</section>
<section class="outro"><p>The rest is under NDA</p></section>
```

## Styling

### Fonts
Google Fonts: **DM Mono** (import weights 300/400/500 with italics). Used for all `<p>` and for every dissolve cell.

### Reset & globals
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `p { text-transform:uppercase; font-family:"DM Mono", monospace; font-weight:500; line-height:1; }` (no explicit font-size → inherits ~16px)
- `section { position:relative; width:100%; height:100svh; overflow:hidden; }`

### Sections
- `.intro, .outro { padding:clamp(1.5rem,3.5vw,3rem); display:flex; flex-direction:column; justify-content:space-between; background-color:var(--ink); color:var(--paper); font-family:"DM Mono", monospace; }` — near-black bookend panels laid out as editorial blocks (a `.bar` row on a hairline `var(--line)` rule at each end), not centred text.
- Palette:
  ```css
  :root {
    --ink: #16161a;     /* the bookend panels */
    --paper: #f2f2f0;   /* type on them */
    --muted: #8c8c88;
    --line: rgba(242, 242, 240, 0.14);
    --signal: #ff6426;  /* the dissolve cells — the one saturated colour */
  }
  ```

### Stacked images (initial state matters)
- `.spotlight-img { position:absolute; top:0; left:0; width:100%; height:100%; clip-path:polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); will-change:clip-path; }`
  - The initial `clip-path` is the **full rectangle** (0% top edge) → every image starts fully visible; they are stacked and only the top one shows until it gets clipped away.
- z-index is assigned in JS: `img[i].style.zIndex = totalImages - i`, so image 1 sits on top (z=5) and image 5 is at the back (z=1). Image 1 is the first to wipe away; image 5 is revealed last.

### Dissolve overlay
- `.dissolve-grid { position:absolute; top:0; left:0; width:100%; height:100%; z-index:100; pointer-events:none; }` — sits above all images. A CSS var is set on it in JS: `--dissolve-color: #ff6426`.
- `.dissolve-cell { position:absolute; background:var(--dissolve-color, #ff6426); visibility:hidden; font-family:"DM Mono", monospace; font-weight:500; line-height:1; color:#000; display:flex; align-items:center; justify-content:center; overflow:hidden; }` — each cell is an **orange square with a black glyph**, hidden by default; the JS toggles `visibility` per frame. Cells are absolutely positioned and sized inline by the JS.

## GSAP effect (be exhaustive)

### Constants (top of module — reproduce exactly)
```js
const dissolveCellSize            = 16;    // px, square cell
const dissolveColumns             = Math.ceil(window.innerWidth  / 16);
const dissolveRows                = Math.ceil(window.innerHeight / 16);
const dissolveSpreadAbove         = 0.25;  // normalized band half-height above edge
const dissolveSpreadBelow         = 0.25;  // normalized band half-height below edge
const dissolveScatterIntensity    = 0.15;  // random per-cell offset magnitude
const dissolveSolidCoreRadius     = 0.025; // normalized radius of near-solid core
const dissolveMinScatterAtCenter  = 0.3;   // min scatter strength inside the core
const dissolveVisibilityThreshold = 0.65;  // density gate (higher = sparser)
const dissolveColor               = "#ff6426";
const dissolveCharacters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*+=?!<>{}[]";
```
Derived: `totalImages = 5`, `totalTransitions = 4`, `dissolveFontSize = Math.round(16*0.7) = 11`, `totalTravelRange = 1 + dissolveSpreadAbove + dissolveSpreadBelow = 1.5`.

### Build the dissolve grid (once, on load)
Nested loop `row` in `[0, dissolveRows)`, `col` in `[0, dissolveColumns)`. For each cell create a `<div class="dissolve-cell">`, set inline `left = col*16 + "px"`, `top = row*16 + "px"`, `width = height = "16px"`, `fontSize = "11px"`, and `textContent` = a **random** char from `dissolveCharacters` (fixed for the cell's lifetime — it does not re-randomize). Append into `.dissolve-grid`. Keep two parallel arrays: the DOM elements, and metadata `{ row, col, normalizedY: (row + 0.5) / dissolveRows }`.

### Deterministic per-cell hashes (no runtime randomness in the band)
```js
function hashFromPosition(row, col, seed) {
  const raw = Math.sin(row * seed + col * (seed * 2.45)) * 43758.5453;
  return raw - Math.floor(raw); // fractional part → pseudo-random in [0,1)
}
const cellVisibilityRandom = cells.map(c => hashFromPosition(c.row, c.col, 127.1));
const cellScatterOffset    = cells.map(c => (hashFromPosition(c.row, c.col, 269.3) - 0.5) * 0.15);
```
`cellVisibilityRandom` gates each cell's appearance; `cellScatterOffset` is a signed offset in `[-0.075, 0.075]` that scatters the band edge per cell.

### The single ScrollTrigger (the whole animation)
```js
ScrollTrigger.create({
  trigger: ".spotlight",
  start: "top top",
  end: `+=${totalTransitions * window.innerHeight}`, // +=4×viewport-height
  pin: true,
  pinSpacing: true,
  scrub: true,
  onUpdate: (self) => { /* see below */ },
});
```
So `.spotlight` pins at the top of the viewport and the stack is scrubbed over **4 viewport-heights** of scroll (one per transition). No tweens — the `onUpdate` reads `self.progress` (0→1) and writes styles directly.

### Per-frame `onUpdate` logic
```js
const scrollProgress   = self.progress;                    // 0..1
const rawPosition      = scrollProgress * totalTransitions; // 0..4
const currentTransition = Math.min(Math.floor(rawPosition), totalTransitions - 1); // 0..3
const transitionProgress = gsap.utils.clamp(0, 1, rawPosition - currentTransition); // 0..1 within current transition

// band center in normalized Y, mapped through the extended travel range:
const bandCenterY = -dissolveSpreadAbove + transitionProgress * totalTravelRange; // -0.25 .. +1.25

if (transitionProgress <= 0 || transitionProgress >= 1) {
  hideAllDissolveCells();               // no band at the exact boundaries
  updateImageClipPaths(scrollProgress, totalTravelRange);
  return;
}
updateImageClipPaths(scrollProgress, totalTravelRange);
updateDissolveBand(bandCenterY);
```

### `updateImageClipPaths(scrollProgress, travelRange)` — the wipe
Loop `i` in `[0, totalTransitions)` (one per stacked image that can wipe):
```js
const segmentStart = i / totalTransitions;        // 0, .25, .5, .75
const segmentEnd   = (i + 1) / totalTransitions;  // .25, .5, .75, 1
let segmentProgress = (scrollProgress - segmentStart) / (segmentEnd - segmentStart);
segmentProgress = gsap.utils.clamp(0, 1, segmentProgress);       // 0..1 within this image's slice
const remappedPosition = -dissolveSpreadAbove + segmentProgress * travelRange; // -0.25 .. +1.25
const clipPercent = gsap.utils.clamp(0, 100, remappedPosition * 100);          // 0..100
stackedImages[i].style.clipPath =
  `polygon(0% ${clipPercent}%, 100% ${clipPercent}%, 100% 100%, 0% 100%)`;
```
Meaning: the polygon keeps the bottom two corners fixed and moves the **top edge** from `clipPercent`=0% (image fully shown) down to 100% (image fully clipped/gone), so each image wipes upward off the screen to expose the image beneath it. Because of the `-0.25` offset and the `×1.5` travel range, the wipe stays fully open for the first ~16.7% of the slice, wipes across the middle, and is fully closed by ~83.3% of the slice — the leading/trailing buffers are exactly where the dissolve band lives.

### `updateDissolveBand(bandCenterY)` — the ASCII dither
For each cell `i`:
```js
const rawDistance = Math.abs(cell.normalizedY - bandCenterY);
// near the exact center, damp the scatter so a near-solid core survives:
const scatterStrength = gsap.utils.clamp(
  dissolveMinScatterAtCenter, 1, rawDistance / dissolveSolidCoreRadius); // 0.3..1
const scatteredDistance =
  cell.normalizedY - bandCenterY + cellScatterOffset[i] * scatterStrength;
// normalize against the appropriate half-spread (below vs above the edge):
const normalizedDistance = scatteredDistance >= 0
  ? scatteredDistance / dissolveSpreadBelow        // /0.25
  : Math.abs(scatteredDistance) / dissolveSpreadAbove; // /0.25
if (normalizedDistance >= 1) { cell.el.style.visibility = "hidden"; continue; }
const density   = (1 - normalizedDistance) * (1 - normalizedDistance); // quadratic falloff, peaks at edge
const isVisible = density > cellVisibilityRandom[i] * dissolveVisibilityThreshold;
cell.el.style.visibility = isVisible ? "visible" : "hidden";
```
Net behavior: a horizontal band of orange glyph-cells is densest right on the wipe edge (`bandCenterY`) and probabilistically thins out over ~0.25 of the viewport height above and below, gated per-cell by its fixed hash so the pattern is stable/organic rather than shimmering randomly. `hideAllDissolveCells()` simply sets every cell's `visibility="hidden"` (used at the segment boundaries).

### Timeline feel
Continuous and scrub-locked: scrolling forward wipes img1→img2→img3→img4→img5 across four viewport-heights, each transition (a) sliding the current top image's clip edge down and (b) dragging the flickering orange ASCII band along that edge. Scrolling back reverses it exactly. No easing curve, no duration/delay/stagger — the only "ease" is Lenis smoothing the scroll input.

## Assets / images
**Five full-bleed images**, stacked to fill the whole viewport (`object-fit: cover`, so any source aspect works; all sources are landscape, roughly 16:9). The set is a mostly light, high-key **near-monochrome studio collection** — pale grays, whites and brushed silver, with one warmer interior — so the orange dissolve band pops against the bright, low-saturation backgrounds. Roles, in stack order (z-index 5 → 1):
1. Top image (first to wipe away): a smooth matte white pebble/blob resting in a soft dimple on a seamless pale-gray surface, top-down studio render. Dominant colors: white and light gray.
2. A brushed **silver** wavy liquid torus ring lying flat on a flat mid-gray background, soft metallic highlights. Dominant colors: silver/gray on neutral gray.
3. A softly lit curved **plaster interior** in warm cream/beige tones: a boucle lounge chair and a small potted plant against sculpted rounded walls with hidden warm lighting. The one warm, photographic frame in the set — dominant colors: cream, beige and soft gold.
4. A black-and-white **concentric spiral / ripple** pattern (op-art), fine dark rings on a near-white ground radiating from center. Dominant colors: white with thin black lines.
5. Bottom image (revealed last): a swirling **white-and-gray marble** surface, glossy flowing veins in charcoal across a bright white ground. Dominant colors: white and gray.

Do not use real brand imagery. Any 5 cohesive, mostly high-key light/neutral abstract or studio images (with at most one warmer accent frame) work.

## Behavior notes
- **Grid is sized at load** from `window.innerWidth/innerHeight` (columns/rows and the ScrollTrigger `end` are computed once). It does not rebuild on resize — a page reload re-fits it. Keep this behavior.
- Desktop-first, pointer-scroll experience; the effect is fully scrubbed (no autoplay, no hover/click).
- The `.dissolve-grid` is `pointer-events:none` and `z-index:100` so it never blocks interaction and always overlays the images.
- Intro/outro panels (`var(--ink)`, `#16161a`) give the pin room to enter/exit and frame the piece.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/kvs-studio-image-reveal/img-1.jpg
https://motionprompts.dev/c/kvs-studio-image-reveal/img-2.jpg
https://motionprompts.dev/c/kvs-studio-image-reveal/img-3.jpg
https://motionprompts.dev/c/kvs-studio-image-reveal/img-4.jpg
https://motionprompts.dev/c/kvs-studio-image-reveal/img-5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--line`, `--signal`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two pins on `.spotlight` disagreeing about the same scrub, two Lenis instances pulling on the same wheel event, twice as many `.dissolve-cell` divs piled into the same grid, doubling both the DOM node count and the density of the flicker band. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

**(1) The entry point.** This file is unusual among the catalogue's `dcl-guarded` scripts: it doesn't inline its effect body after the `readyState` check, it factors the whole thing into a `mount(config)` that returns its own `destroy()`. The `window.MP` branch exists for this catalogue's own editor runtime and has no counterpart in a host app — a React adaptation only ever takes the `else` branch, which is the plain `dcl-guarded` pattern (`document.readyState === "loading"` gates a `DOMContentLoaded` listener, otherwise `boot()` runs immediately). By the time a React component mounts that event has already fired, so drop the guard and the listener and call `mount(Object.assign({}, DEFAULTS))` directly inside a `useEffect` with an empty dependency array. `mount` already hands back a function that reverses everything it set up — that is the shape `useEffect` wants for its cleanup, so most of the porting work is relocation, not rewriting.

**(2) Element lookups.** `mount` reaches for `.spotlight-img` (all five, via `querySelectorAll`) and `.dissolve-grid` (one, via `querySelector`) against `document`, assuming this is the only copy of the markup on the page. Give the component a root ref around the wrapper that contains `.intro` / `.spotlight` / `.outro`, and scope both lookups to it. During the StrictMode remount two copies of that subtree exist for an instant; an unscoped lookup can hand `mount` the five images or the grid belonging to the instance that is already on its way out.

**(3) Cleanup.** Nothing in `mount` runs through `gsap.to`, `gsap.set`, or any tween — as the Tech section above says, the wipe and the dissolve band are pure `style` writes made by hand inside the single `ScrollTrigger`'s `onUpdate`. That matters here specifically because of what a `gsap.context` revert actually undoes: it kills and reverts the triggers it tracked, and it also cleans up "the inline styles GSAP wrote" — but only styles written through GSAP's own API. The `clipPath` and `zIndex` this script assigns directly on `stackedImages[i].style` were never written by GSAP, so `ctx.revert()` is blind to them. Wrap the `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref and revert it in the cleanup — that replaces the manual `st.kill(true)` and correctly tears down the pin-spacer — but four more steps still belong in that same cleanup, unmanaged by the context, in this order:

- `gsap.ticker.remove(raf)` before `lenis.destroy()`. `raf` is the function that calls `lenis.raf(time * 1000)` on every tick; removing it after Lenis is destroyed still leaves one more tick calling into a dead instance.
- `lenis.off("scroll", ScrollTrigger.update)` paired with that `destroy()` call, so the scroll handler isn't still wired to `ScrollTrigger.update` for the instant Lenis is mid-teardown.
- Every `.dissolve-cell` div `mount` appended to `.dissolve-grid` removed individually. The grid itself ships empty in the markup and belongs to the render, not to this effect — only the cells the effect personally created are its responsibility to remove, or a StrictMode remount silently doubles the glyph count (there is no overlap check to catch it visually, just a denser band).
- The `clipPath` and `zIndex` the scrub wrote onto the five images cleared explicitly (`removeProperty`, or `gsap.set(stackedImages, { clearProps: "all" })`). Skip this and a remount starts from whatever clip percentage scrolling had last reached, with the top image already partway wiped away before the fresh `ScrollTrigger` has read a single frame.

Lenis itself is scoped to this component as shipped — `new Lenis()` is created with no options inside `mount`, and nothing else on the page references that instance — so create it inside the effect and destroy it in the cleanup exactly as `mount`/`destroy` already do. If this component ends up as one section of a larger React app rather than a standalone route, the move is the one the "Using this outside its demo page" note above already makes: lift Lenis to the app shell and have this effect reuse the existing instance instead of constructing a second one.
