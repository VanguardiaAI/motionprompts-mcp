# Build: Scroll Wave Image Gallery

## Goal
A tall, single-column **vertical gallery of 12 images that drift left and right in a rippling sine-wave pattern as you scroll**. Each image is its own ScrollTrigger: as it travels through the viewport, three layered sine waves (a slow **base** swell, a fast **flow** oscillation, and a fine **detail** jitter) are summed and scaled to viewport width to drive its horizontal `translate`, while a symmetric left/right `clip-path` inset **closes the image to a narrow slit at the top and bottom of its travel and opens it fully wide exactly when it is centered on screen**. A short intro title screen and outro title screen bookend the gallery. Smooth scroll is provided by Lenis wired into GSAP's ticker. The star effect is the organic, wave-like horizontal shimmer of the whole stack combined with the center-focused clip reveal.

## Tech
Vanilla HTML/CSS/JS with ES module imports (Vite/npm project). Use `gsap` (npm) plus the single GSAP plugin **`ScrollTrigger`**, and `lenis` (npm) for smooth scroll. No other plugins, no framework, no SplitText/CustomEase/Three.js.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```

## Layout / HTML
Three full-height `<section>`s. The middle one has an **empty** container that the JS fills with 12 image tiles at runtime. Class names are load-bearing.

```html
<section class="intro">
  <h1>Loose Structure</h1>
</section>

<section class="spotlight">
  <div class="spotlight-images"></div>   <!-- JS injects 12 .spotlight-image tiles here -->
</section>

<section class="outro">
  <h1>Crafted by Motionprompts</h1>
</section>

<script type="module" src="./script.js"></script>
```

Use the neutral copy above verbatim ("Loose Structure" intro, "Crafted by Motionprompts" outro). "Motionprompts" is the fictional demo name — no real client/brand names.

## Styling
Font (Google Fonts): **Cossette Titre** (weights 400 & 700) for the two `<h1>`s. A serif/display fallback is fine if that face is unavailable.
```css
@import url("https://fonts.googleapis.com/css2?family=Cossette+Titre:wght@400;700&display=swap");
```

Palette (CSS variables):
- `--bg: #e3e4d8` — warm pale sage/off-white page background.
- `--fg: #000` — near-black text.

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { background: var(--bg); color: var(--fg); }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1 { font-family:"Cossette Titre", sans-serif; font-size: clamp(5rem, 6vw, 7rem); font-weight:500; letter-spacing:-1%; line-height:1; text-align:center; }`

Sections:
- `section { position:relative; width:100%; height:100svh; padding:2rem; overflow:hidden; }` — note the **`overflow:hidden`**, which clips the horizontal wave drift so images never trigger a horizontal page scrollbar.
- `.intro, .outro { display:flex; justify-content:center; align-items:center; }` — the title centered.
- **`.spotlight { height:100%; }`** — CRITICAL: this class-level `height:100%` overrides the `section`'s `height:100svh`. Because `<body>` has no fixed height, `100%` resolves to **auto**, so the spotlight section grows to the full stacked height of its 12 tiles (~4000px+). That tall middle section IS the scroll runway. Do not clamp it to one viewport.

Gallery containers:
- `.spotlight-images { display:flex; flex-direction:column; align-items:flex-start; }` — a single left-aligned vertical column of tiles (the JS then shifts each one horizontally via `translate`).
- `.spotlight-image { position:relative; clip-path: inset(0 20% 0 20%); will-change: transform, clip-path; overflow:hidden; }` — **each tile starts clipped 20% in from the left and 20% from the right** (a narrow center slit). This initial clip matches the clip amount the JS computes at the very top/bottom of a tile's travel, so there is no jump on first paint.

## GSAP effect (the important part — be exact)

### Smooth-scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Lenis fires `ScrollTrigger.update` on every scroll; Lenis' own rAF is driven by GSAP's ticker; lag smoothing is disabled so the wave math tracks the scroll position tightly.

### Config constants
```js
const CONFIG = {
  waves: {
    base:   { amp: 0.1,   freq: 1.0, speed: 1.0, phase: 5.0  },
    flow:   { amp: 0.15,  freq: 5.0, speed: 5.0, phase: 10.0 },
    detail: { amp: 0.025, freq: 5.0, speed: 1.5, phase: 2.5  },
  },
  clipMax: 20,   // max clip inset in %
  clipPower: 2,  // exponent on the center-distance curve
};

const TOTAL_IMAGES = 12;
const IMAGE_BASE_HEIGHT = 375;                       // px
const ASPECT_RATIOS = ["3/2", "4/3", "5/4", "7/5"];  // cycled per tile
```

### Building the 12 tiles (loop `i = 0 … 11`)
For each `i`, create `<div class="spotlight-image"><img/></div>` appended to `.spotlight-images`, and:
- **Aspect ratio:** `imageItem.style.aspectRatio = ASPECT_RATIOS[i % 4]` — cycles 3/2, 4/3, 5/4, 7/5 down the column (all landscape-ish). Width therefore follows from the set height.
- **Progressive shrink of the last quarter:**
  ```js
  const shrinkStartIndex = Math.floor(TOTAL_IMAGES * 0.75);   // = 9
  const shrinkFactor = i >= shrinkStartIndex
    ? (i - shrinkStartIndex + 1) / (TOTAL_IMAGES - shrinkStartIndex)   // i=9→1/3, i=10→2/3, i=11→1
    : 0;
  const imageHeight = IMAGE_BASE_HEIGHT * (1 - shrinkFactor * 0.5);
  imageItem.style.height = `${Math.round(imageHeight)}px`;
  ```
  So tiles 0–8 are 375px tall; tiles 9, 10, 11 shrink to ~313px, 250px, ~188px — the column tapers toward the end.
- **Image source:** one `<img>` per tile, `src` pointing at the i-th gallery image (`img1.jpg` … `img12.jpg`).

### Responsive height pass — `updateImageSizes()`
Run once after building, and again on every resize:
```js
const sizeFactor = Math.min(window.innerWidth / 750, 1);   // <750px → shrink; else 1
// for each tile, recompute with the same shrinkFactor logic:
const imageHeight = IMAGE_BASE_HEIGHT * sizeFactor * (1 - shrinkFactor * 0.5);
imageItem.style.height = `${Math.round(imageHeight)}px`;
```

### Per-tile ScrollTrigger (the wave engine) — this is the whole point
Iterate every tile with its `index`. Compute `normalizedIndex = index / (TOTAL_IMAGES - 1)` (i.e. `index / 11`, ranging **0 at the top tile → 1 at the bottom tile**). Create **one ScrollTrigger per tile** — no `scrub`, no `pin`; the motion is written imperatively inside `onUpdate` using ScrollTrigger's reported `progress`:

```js
ScrollTrigger.create({
  trigger: imageItem,
  start: "top bottom",   // progress 0 = tile's top enters the viewport bottom
  end:   "bottom top",   // progress 1 = tile's bottom leaves the viewport top
  onUpdate: ({ progress }) => {
    const { base, flow, detail } = CONFIG.waves;
    const vw = window.innerWidth;

    // Three superimposed sine waves. Each argument mixes the tile's fixed
    // vertical position (normalizedIndex) with the live scroll progress:
    const baseWave =
      Math.sin(normalizedIndex * base.freq + (1 - progress) * base.speed + base.phase);
      // = sin(normalizedIndex*1.0 + (1 - progress)*1.0 + 5.0)   — note (1 - progress)

    const flowWave =
      0.5 + Math.sin(normalizedIndex * flow.freq + flow.phase + progress * flow.speed);
      // = 0.5 + sin(normalizedIndex*5.0 + 10.0 + progress*5.0)

    const detailWave =
      0.5 + Math.sin(normalizedIndex * detail.freq + detail.phase + progress * detail.speed);
      // = 0.5 + sin(normalizedIndex*5.0 + 2.5 + progress*1.5)

    // Horizontal position = center the tile, bias 10%vw left, then add the 3 waves,
    // each scaled by viewport width * its amplitude:
    const translateX =
        (vw - imageItem.offsetWidth) / 2          // horizontally center the tile
      - vw * 0.1                                  // constant 10%-of-viewport leftward bias
      + baseWave   * vw * base.amp                // slow swell   (± ~10% vw)
      + flowWave   * vw * flow.amp                // fast flow    ( 0…~30% vw, offset by 0.5)
      + detailWave * vw * detail.amp;             // fine detail  ( 0…~5%  vw, offset by 0.5)

    // Symmetric clip: fully clipped (20%) at the extremes of travel, fully open at center.
    const centerOffset = Math.abs(progress - 0.5) * 2;               // 1 → 0 → 1 across travel
    const clipAmount = Math.pow(centerOffset, CONFIG.clipPower) * CONFIG.clipMax; // 20 → 0 → 20 (%)

    imageItem.style.translate = `${translateX}px`;                    // CSS `translate` (X only)
    imageItem.style.clipPath  = `inset(0 ${clipAmount}% 0 ${clipAmount}%)`;
  },
});
```

Key behaviors to preserve exactly:
- **The three waves are additive and layered.** `base` uses `(1 - progress)` (runs backward vs. scroll), while `flow` and `detail` use `progress` directly. `flow` and `detail` are lifted by `+0.5` before the sine, so their contribution is always positive (biasing tiles rightward), whereas `base` swings symmetric about zero. `flow` is the dominant, most visible ripple (amp 0.15, high freq 5, high speed 5); `base` is the slow underlying sway; `detail` is a subtle high-frequency shiver.
- **Because the wave arguments include `normalizedIndex`, adjacent tiles are phase-shifted** — the column reads as a continuous travelling wave down the page, not 12 identical bounces.
- **The clip is a symmetric horizontal `inset`** driven by `pow(|progress-0.5|*2, 2) * 20`: a tile is a **20%-inset slit** as it enters at the bottom (progress 0) and as it exits at the top (progress 1), and opens to **`inset(0 0% 0 0%)` (full width) exactly at screen center** (progress 0.5). The exponent 2 makes the opening snap open near center and stay narrow longer at the edges.
- **No ease/duration/stagger/timeline** — this is not a tween. It is direct per-frame style writes from `onUpdate`, so the motion is 1:1 scrubbed to scroll position via Lenis.

### Resize handler
```js
window.addEventListener("resize", () => {
  updateImageSizes();
  ScrollTrigger.refresh();
});
```

## Assets / images
**12 gallery images**, landscape-ish, filling their tiles with `object-fit: cover` (tile aspect ratios cycle 3/2, 4/3, 5/4, 7/5, so source them roughly landscape — exact crop doesn't matter). They read as one quiet, editorial still-life/nature set with an airy, warm-neutral feel: a mix of macro close-ups, abstract texture, an interior, and a product shot — some on dark backdrops, others high-key and pale. Colors range across warm ambers and browns, soft marble greys, deep burgundy, and pale beige/sage. Describe generically, by role. Verified examples from the actual set:

1. Still-life macro — a silver spoon heaped with translucent amber-gold sugar crystals, lit warm against a near-black deep-blue backdrop.
2. Abstract macro of flowing white-and-grey marble, glossy sculptural swells veined in charcoal (a soft, high-key texture plate).
3. Two pale cream-white moths, wings spread, floating against a rich deep-burgundy velvet field.
4. Warm macro of curled, dried autumn leaves — coppery orange-brown, backlit, on a dark shadowed background.
5. Soft, faded interior — a tall paned window with climbing white roses and green vines, a distressed pale wall, and an ornate gilt-framed mirror; airy off-white and sage tones.
6. Beauty product still-life — a frosted cream jar, a rose-pink lipstick in a rose-gold case, and a frosted serum bottle beside pale petals on cream silk; soft blush-beige palette.

The remaining tiles continue this restrained still-life/nature/texture mix (macro details, soft textures, and quiet interiors) in the same warm-neutral-to-dark range — no branded or fashion-catalog imagery. If you have fewer than 12, repeat them in order; the effect is identical regardless of content.

## Behavior notes
- **Scroll is the sole driver.** There is no autoplay and no pin/scrub timeline — each tile's own `ScrollTrigger` reports `progress` and the `onUpdate` writes `translate` + `clip-path` every frame. Scrolling up reverses the wave exactly.
- **The tall `.spotlight` section (height auto via `height:100%`) provides the runway**; intro and outro stay at `100svh` each. Keep `overflow:hidden` on sections so horizontal wave drift is clipped, not scrollable.
- **`sizeFactor = min(innerWidth/750, 1)`** scales tile heights down on narrow screens; the wave math itself always uses live `window.innerWidth`, so amplitudes scale with the viewport. Effect is desktop-oriented but functions at all widths.
- Keep `will-change: transform, clip-path` on tiles for smooth clip animation, and set the initial CSS `clip-path: inset(0 20% 0 20%)` so tiles paint pre-clipped (matching the `progress = 0` state).
- No reduced-motion branch in the original.

## Images

This component ships with 12 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/scroll-wave-image-gallery/img1.jpg
https://motionprompts.dev/c/scroll-wave-image-gallery/img10.jpg
https://motionprompts.dev/c/scroll-wave-image-gallery/img11.jpg
https://motionprompts.dev/c/scroll-wave-image-gallery/img12.jpg
https://motionprompts.dev/c/scroll-wave-image-gallery/img2.jpg
https://motionprompts.dev/c/scroll-wave-image-gallery/img3.jpg
… 6 more under https://motionprompts.dev/c/scroll-wave-image-gallery/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--carmine`, `--muted`, `--bone`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that runs once at import time, builds its own gallery by appending twelve nodes to the page with `document.createElement`, and never expects to be asked to undo any of it. React withdraws all three of those guarantees at once, and it does it quietly — the gallery paints, the wave looks right for a moment, and then something underneath is wrong in a way that doesn't point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. The doubling here is worse than the usual "two triggers" story: if the twelve-tile build loop reruns against a `.spotlight-images` container that already holds the first pass's twelve children, you get twenty-four `.spotlight-image` divs, `gsap.utils.toArray(".spotlight-image")` picks up all twenty-four, `normalizedIndex` is computed against the wrong denominator for every one of them, and every tile now has two independent `ScrollTrigger`s writing `translate` and `clip-path` in dueling frames — visible as an image that never settles, jittering between two wave positions on every scroll tick. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect — and treat the DOM-building loop as something that has to stop being imperative altogether, not just something that has to move.

**(1) The entry point.** The script runs at the top level, the moment the module is evaluated: the tile-building loop, `updateImageSizes()`, the per-tile `ScrollTrigger.create` loop, the resize listener, and the Lenis/ticker wiring all execute at import time, before any component has rendered a `.spotlight-images` for the loop to fill. Moving this verbatim into a `useEffect` with an empty dependency array is *necessary* for the `ScrollTrigger` loop and the Lenis wiring, but it is not *sufficient* for the tile-building loop — see (2) below. Do not leave any of it in the component body: that reruns on every render and would rebuild the gallery, and re-subscribe Lenis to the ticker, on every unrelated state change anywhere in this tree.

**(2) Element lookups and the tile-building loop.** `document.querySelector(".spotlight-images")` assumes this component owns the whole document, but the deeper problem is the loop underneath it: `document.createElement("div")` twelve times, populated from the `PLATES` array and the `img${i+1}.jpg` naming, then `appendChild`ed straight into that container. That is DOM mutation happening outside React's ownership of `.spotlight-images`'s children, and it is exactly the shape that produces the doubling above — React has no record of those twelve nodes, so it cannot reconcile them, diff them away on a re-render, or stop a second effect pass from adding twelve more beside them. Render the tiles as JSX instead: map over `PLATES`, and for each index build the `<div className="spotlight-image">` with its `aspectRatio` set inline from `ASPECT_RATIOS[i % ASPECT_RATIOS.length]`, an `<img>` whose `src` follows the same `img${i+1}.jpg` pattern, and the `.plate-caption` markup — the zero-padded index plus the title — as static children. None of that depends on scroll position or viewport width, so none of it belongs inside the effect. Collect a ref to each tile as it renders (a callback ref pushing into an array, or a `Map` keyed by index) instead of re-deriving the list with `gsap.utils.toArray(".spotlight-image")` afterward; the array's index order already *is* the `normalizedIndex` denominator (`index / (TOTAL_IMAGES - 1)`), so reading it off the refs is more direct than re-querying the DOM for something you already know. `updateImageSizes()` and the resize listener still belong in the effect, since both read the live `window.innerWidth`, which JSX cannot precompute.

**(3) Cleanup.** Wrap the twelve `ScrollTrigger.create` calls in a `gsap.context` scoped to the root ref. Nothing here needs `self.add` — every `onUpdate` callback only ever fires from ScrollTrigger's own scroll handling, none of them are invoked later from an outside listener, so a plain zero-argument context factory is enough. `gsap.ticker.add((time) => lenis.raf(time * 1000))` is neither a tween nor a trigger, so `ctx.revert()` does not touch it; keep that callback in a named variable and remove it explicitly, in the same cleanup that destroys Lenis:

```jsx
useEffect(() => {
  const tiles = tileRefs.current; // populated by each tile's callback ref, in PLATES order
  const ctx = gsap.context(() => {
    tiles.forEach((imageItem, index) => {
      const normalizedIndex = index / (TOTAL_IMAGES - 1);
      const caption = imageItem.querySelector(".plate-caption");
      ScrollTrigger.create({
        trigger: imageItem,
        start: "top bottom",
        end: "bottom top",
        onUpdate: ({ progress }) => { /* the three summed waves, translate and clip-path writes, unchanged */ },
      });
    });
  }, rootRef);

  updateImageSizes(tiles);
  const onResize = () => {
    updateImageSizes(tiles);
    ScrollTrigger.refresh();
  };
  window.addEventListener("resize", onResize);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  const syncLenis = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(syncLenis);
  gsap.ticker.lagSmoothing(0);

  return () => {
    window.removeEventListener("resize", onResize);
    gsap.ticker.remove(syncLenis);
    lenis.destroy();
    ctx.revert();
  };
}, []);
```

The original resize listener is never removed, because a standalone page never expects to tear down; give it a name so the cleanup can pass the same reference to `removeEventListener`, or a StrictMode remount leaves the first mount's listener calling `updateImageSizes` and `ScrollTrigger.refresh` against tiles that no longer exist by the time it fires again. `lenis.destroy()` covers the `"scroll"` subscription registered on it above plus Lenis's own wheel and touch bindings, so only the ticker callback needs a separate removal — it lives on `gsap.ticker`, not on the Lenis instance. This component renders the entire page — intro, gallery, outro — so owning a single `Lenis` instance inside this effect is the right default, exactly as the note above about dropping this component into an existing project already says; only reuse an app-shell instance if this gallery becomes one section among several. `gsap.ticker.lagSmoothing(0)` is a global ticker setting, not an instance, so calling it again on a remount is harmless and needs no counterpart in the cleanup.

One thing `ctx.revert()` will not undo: the raw `imageItem.style.translate`, `clipPath` and `caption.style.left` writes each `onUpdate` makes directly never went through `gsap.set`, so the context never tracked them. That is harmless here only because unmounting also removes the tiles themselves from the DOM — if this gallery ever persists across a state change that keeps the same tiles mounted while tearing the effect down, those inline styles would be left stale on the reused nodes.
