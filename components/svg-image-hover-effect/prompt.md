# SVG Scribble Draw-On Image Hover — Self-Drawing Strokes Over a Card Grid

## Goal
Build a page with a **3-row × 2-column grid of square image cards**. Each card is overlaid by **two oversized, scribbled SVG paths** (a colored one + a light-grey one) that are invisible at rest. On **mouseenter**, both scribbles **draw themselves on** (classic `strokeDasharray`/`strokeDashoffset` line-drawing trick, offset animated from full path length → 0) while simultaneously **swelling their stroke-width from 200 → 700**, and the card's title **rises in word-by-word** from behind a mask. On **mouseleave** everything reverses: the scribbles un-draw and thin back to 200, and the title drops back down word-by-word (reversed order). Smooth scroll via Lenis. The star effect is the pair of thick scribbles drawing on over the photo plus the masked word-rise on the title.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite + npm project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`SplitText`** (used for the title word-mask reveal).
- **`lenis`** — smooth scroll, stepped by its own `requestAnimationFrame` loop.

```js
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(SplitText);
```
No ScrollTrigger, no CustomEase, no Three.js. Ship exactly three files: one `index.html`, one `styles.css`, one ES-module `script.js`.

> ### ⚠️ MANDATORY: link the stylesheet, or the effect is invisible
> `index.html` **must be a complete HTML document** (see the full skeleton below) with **`<link rel="stylesheet" href="./styles.css">` inside `<head>`** and **`<script type="module" src="./script.js"></script>`** before `</body>`. Do **not** emit `index.html` as a loose fragment that starts at `<header>` — it must begin with `<!doctype html>`.
>
> The entire star effect lives in the CSS. **If `styles.css` is not linked, nothing works:** the grid collapses to a single column, the cards are no longer square or clipped, and — worst of all — the two SVG scribbles render at their **native size (~2500px each)**, stacked in normal document flow far below the photo, so the draw-on stroke animation is never seen over the image. The GSAP timeline still runs with zero console errors, but the result is a broken ~38000px-tall page of giant loose scribbles. Three CSS rules in particular carry the effect and must be present:
> ```css
> .card-container { overflow: hidden; }                 /* clips the oversized scribbles + masked words to the card box */
> .card-container .svg-stroke {                          /* centers each scribble and blows it up 1.5× over the photo */
>   position: absolute; top: 50%; left: 50%;
>   transform: translate(-50%, -50%) scale(1.5);
>   width: 100%; height: 100%;
> }
> img, svg { width: 100%; height: 100%; object-fit: cover; }  /* photo AND scribble fill the square card */
> ```
> Treat linking the stylesheet as a hard requirement of a correct reproduction.

## Layout / HTML
Emit a **complete HTML document**. Below is the exact skeleton — `<!doctype html>`, `<head>` with charset/viewport/**stylesheet link**, `<body>` holding a centered `<header>` (big `<h1>`), then **three `.row`s** (each with **two `.card-container`s**), then a `<footer>` (big `<h1>`), and finally the **module script**. Class/ID names are load-bearing (the JS queries `.card-container`, `.svg-stroke path`, `.card-title h3`; the CSS colors strokes by `#card-N`).

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SVG Image Hover Effect</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <header><h1>The Hover State</h1></header>

    <div class="row">
      <div class="card-container" id="card-1">
        <div class="card-img"><img src="<card 1 image>" alt="" /></div>
        <div class="svg-stroke svg-stroke-1"><svg …>…path 1…</svg></div>
        <div class="svg-stroke svg-stroke-2"><svg …>…path 2…</svg></div>
        <div class="card-title"><h3>Synthetic Silhouette</h3></div>
      </div>
      <div class="card-container" id="card-2"> … <h3>Red Form Study</h3> … </div>
    </div>

    <div class="row">
      <div class="card-container" id="card-3"> … <h3>Material Pause</h3> … </div>
      <div class="card-container" id="card-4"> … <h3>Obscured Profile</h3> … </div>
    </div>

    <div class="row">
      <div class="card-container" id="card-5"> … <h3>Muted Presence</h3> … </div>
      <div class="card-container" id="card-6"> … <h3>Spatial Balance</h3> … </div>
    </div>

    <footer><h1>End of Interaction</h1></footer>

    <script type="module" src="./script.js"></script>
  </body>
</html>
```

- **6 cards total**, ids `card-1` … `card-6`, laid out 2 per `.row`. Titles in order: **Synthetic Silhouette, Red Form Study, Material Pause, Obscured Profile, Muted Presence, Spatial Balance**. Header `h1` = "The Hover State"; footer `h1` = "End of Interaction". All copy is neutral demo text — no brands.
- Every card has the **same internal structure** shown for `card-1`: a `.card-img` wrapping `<img>`, then two `.svg-stroke` overlays (`.svg-stroke-1` then `.svg-stroke-2`), then a `.card-title` wrapping `<h3>`.
- Inside **every** card, the two `.svg-stroke` overlays are **identical across all six cards** — the same two SVG scribbles are repeated in each card (only the CSS stroke color differs per card, see Styling). Use these exact SVGs (the `viewBox`, path `d`, `stroke-width:200`, and `stroke-linecap:round` define the whole scribble look):

`.svg-stroke-1` (first overlay — the wide scribble):
```html
<svg width="2453" height="2273" viewBox="0 0 2453 2273" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262"
    stroke="#FE5E41" stroke-width="200" stroke-linecap="round" />
</svg>
```

`.svg-stroke-2` (second overlay — the tall scribble):
```html
<svg width="2250" height="2535" viewBox="0 0 2250 2535" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012"
    stroke="#6E44FF" stroke-width="200" stroke-linecap="round" />
</svg>
```
The inline `stroke` attributes (`#FE5E41`, `#6E44FF`) are **overridden by CSS** — the rendered colors come from the CSS variables below, not these attributes. (Because the CSS also sets `img, svg { width:100%; height:100%; object-fit:cover }`, these giant native `width`/`height` attributes are irrelevant **once the stylesheet is linked** — but they are exactly why an unstyled page explodes to ~2500px scribbles.)

## Styling

**Font**: a clean geometric/humanist sans. Use a genuinely available family as the primary so typography is reproducible — **Inter** (or **Google Sans Text**) works well. The original references **"Google Sans"** via a Google Fonts `@import`, but that face is **not a public Google Font and does not load** (it silently falls back to the default sans on both the original and any reproduction), so keep it only as an optional first name in the stack. Whatever you pick, the visual weight and geometry matter more than the exact family.
```css
/* Optional — matches the original source verbatim; note it does not actually load: */
@import url("https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap");
```

**Palette** — per-card stroke colors live in CSS variables. The **colored** overlay (`.svg-stroke-1`) is recolored per card via `#card-N`; the **second** overlay (`.svg-stroke-2`) is the same light grey on every card:
```css
:root {
  --card-1-stroke: #d1e639;  /* lime-yellow */
  --card-2-stroke: #a69763;  /* muted gold */
  --card-3-stroke: #ebd128;  /* yellow */
  --card-4-stroke: #a6a09d;  /* warm grey */
  --card-5-stroke: #99938a;  /* taupe grey */
  --card-6-stroke: #6f5f98;  /* muted violet */
  --card-base-stroke: #e0e0e0;  /* light grey — used on svg-stroke-2 in ALL cards */
  --card-copy: #000;            /* title text color */
}
```
Wire them: `#card-1 .svg-stroke-1 svg path { stroke: var(--card-1-stroke); }` … `#card-6 .svg-stroke-1 svg path { stroke: var(--card-6-stroke); }`, and `.card-container .svg-stroke-2 svg path { stroke: var(--card-base-stroke); }`. Page background is default white; title copy is `#000`.

**Reset / base**:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { font-family:"Inter", "Google Sans", sans-serif; }`
- `img, svg { width:100%; height:100%; object-fit:cover; }` — note **both img and svg** fill their box and use `object-fit:cover`. This is one of the three load-bearing rules: it shrinks the ~2500px native SVGs down into the square card.

**Typography** (the two big scales):
- `h1 { font-size:clamp(3rem, 5vw, 7rem); font-weight:500; line-height:1.25; letter-spacing:-0.05rem; }`
- `h3 { font-size:clamp(2rem, 2.5vw, 3rem); font-weight:450; line-height:1.25; letter-spacing:-0.025rem; }`

**Header / footer**: `header, footer { width:100%; padding:15rem 2rem; display:flex; justify-content:center; align-items:center; text-align:center; }` — very tall vertical padding so the grid sits between two roomy title blocks.

**Grid rows**: `.row { width:100%; padding:0 1rem; margin-bottom:1rem; display:flex; gap:1rem; }` (two cards side by side, 1rem gutter).

**Card**: `.card-container { position:relative; flex:1; aspect-ratio:1; border-radius:1rem; overflow:hidden; }` — **square** (aspect-ratio 1), rounded, and **`overflow:hidden` is essential** (it clips the oversized scribbles and the masked title words to the card box). This is load-bearing rule #2.

**Stroke overlays — critical positioning (load-bearing rule #3)**:
```css
.card-container .svg-stroke {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(1.5);  /* centered AND blown up 1.5× */
  width: 100%;
  height: 100%;
}
```
`position:absolute` lifts the scribbles out of flow and stacks them over the photo; `scale(1.5)` makes them read as huge, overflowing gestures that get clipped by the card's rounded box. Omit this block (e.g. by forgetting the stylesheet) and the scribbles fall into normal flow at native size.

**Title**: `.card-title { position:absolute; bottom:2rem; left:2rem; color:var(--card-copy); }` (anchored to the card's bottom-left). And `.card-title .word { will-change:transform; }` — `.word` is the class SplitText assigns to each word (see JS); the will-change is a perf hint for the y-transform.

## GSAP effect (the important part — be exhaustive)

### Smooth-scroll wiring (Lenis, self-driven rAF)
Lenis is stepped by its **own** `requestAnimationFrame` loop (not GSAP's ticker here):
```js
const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

### Per-card setup (loop over every `.card-container`)
For each card, grab `cardPaths = cardContainer.querySelectorAll(".svg-stroke path")` (the **2** scribble paths) and `cardTitle = cardContainer.querySelector(".card-title h3")`.

**Split the title into masked words**:
```js
const split = SplitText.create(cardTitle, {
  type: "words",
  mask: "words",
  wordsClass: "word",
});
gsap.set(split.words, { yPercent: 100 });
```
`type:"words"` splits the `h3` into per-word spans; `mask:"words"` wraps each word in an `overflow:hidden` masking element; `wordsClass:"word"` tags each word span with `.word`. The immediate `gsap.set(..., { yPercent:100 })` pushes every word **down by 100% of its own height**, so at rest all words are hidden below their masks.

**Prime each scribble path for line-drawing**:
```js
cardPaths.forEach((path) => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
});
```
Setting `strokeDasharray === strokeDashoffset === length` makes the single dash exactly as long as the whole path and pushes it fully "off the end," so each scribble is **invisible at rest**. Animating `strokeDashoffset` down to `0` draws the stroke on progressively; animating it back up to `length` un-draws it.

**Hold one timeline handle per card** (`let tl;`) that is **killed and rebuilt** on each hover event (so rapid enter/leave never queues conflicting tweens).

### `mouseenter` — draw on + word rise
```js
cardContainer.addEventListener("mouseenter", () => {
  if (tl) tl.kill();
  tl = gsap.timeline();

  // both scribbles, started together at position 0
  cardPaths.forEach((path) => {
    tl.to(path, {
      strokeDashoffset: 0,
      attr: { "stroke-width": 700 },
      duration: 1.5,
      ease: "power2.out",
    }, 0);
  });

  // title words rise, starting 0.35s into the timeline
  tl.to(split.words, {
    yPercent: 0,
    duration: 0.75,
    ease: "power3.out",
    stagger: 0.075,
  }, 0.35);
});
```
Details:
- **Both paths animate in parallel** (each `.to(..., 0)` is placed at absolute position `0`): `strokeDashoffset` → `0` (the scribble draws itself on from start to end) **and** the SVG attribute `stroke-width` **200 → 700** (the line swells from a bold ribbon to a very fat one). `duration:1.5`, `ease:"power2.out"`. Note `attr:{ "stroke-width": 700 }` tweens the *attribute*, not a CSS prop.
- **Title words**: `yPercent 100 → 0` (rise up into their masks from below), `duration:0.75`, `ease:"power3.out"`, `stagger:0.075` (each word 75ms after the previous, left-to-right), placed at timeline position **`0.35`** so the words start rising a beat after the scribbles begin drawing.

### `mouseleave` — un-draw + word drop (reversed)
```js
cardContainer.addEventListener("mouseleave", () => {
  if (tl) tl.kill();
  tl = gsap.timeline();

  cardPaths.forEach((path) => {
    const length = path.getTotalLength();
    tl.to(path, {
      strokeDashoffset: length,
      attr: { "stroke-width": 200 },
      duration: 1,
      ease: "power2.out",
    }, 0);
  });

  tl.to(split.words, {
    yPercent: 100,
    duration: 0.5,
    ease: "power3.out",
    stagger: { each: 0.05, from: "end" },
  }, 0);
});
```
Details:
- **Both paths** (again started together at `0`): `strokeDashoffset` back to the full `length` (scribble un-draws), `stroke-width` **700 → 200** (thins back), `duration:1` (faster than the 1.5s draw-on), `ease:"power2.out"`.
- **Title words**: `yPercent 0 → 100` (drop back down out of view), `duration:0.5`, `ease:"power3.out"`, `stagger:{ each:0.05, from:"end" }` — the stagger runs **from the last word to the first**, so words fall in reverse order. Placed at position **`0`** (starts immediately, unlike the 0.35 delay on enter).

**No ScrollTrigger, no CustomEase, no lerp/rAF interpolation of the effect, no Three.js.** Only Lenis-smoothed scrolling plus these two per-card hover timelines.

## Assets / images
**6 photographic images**, one per card (`img1.jpg` … `img6.jpg` → `card-1` … `card-6`), each shown in a **square (1:1)** box with `object-fit:cover`. Four restrained black-and-white editorial portraits plus two high-saturation color frames, so the per-card colored scribble and black title read clearly over them. Roles (by card title):
1. **Synthetic Silhouette** — high-contrast black-and-white head-and-shoulders close-up of a young man with a short cropped haircut, facing the camera with a direct gaze, against a plain mid-grey studio backdrop. Dominant tones: greys and black with pale skin highlights.
2. **Muted Presence** — clean black-and-white side profile of a woman with a sleek jaw-length black bob and a double pearl drop earring, wearing a black jacket, against a pale off-white background. Dominant tones: deep black hair and jacket over light grey. (Card title "Red Form Study" in the markup; the actual photo is this B&W profile.)
3. **Material Pause** — dramatic low-key black-and-white portrait, the face lit from one side and half-lost to shadow, full lips catching the light, dark collar below. Dominant tones: near-black shadows with a soft grey backdrop.
4. **Obscured Profile** — soft high-key black-and-white frame of a face veiled under draped sheer white translucent fabric, features showing faintly through the cloth. Dominant tones: near-white greys.
5. **Muted Presence** — full-length color portrait of a woman in a deep wine-red pleated dress under a matching red wool coat, small gold hoop earring, hands at her waist, set against a saturated cobalt-blue backdrop. Dominant tones: crimson red and vivid blue. (Card title "Muted Presence" in the markup; the actual photo is this red-on-blue color portrait.)
6. **Spatial Balance** — three-quarter color portrait of a man in an olive-green tailored suit and tie, standing in front of a pastel painterly abstract backdrop of peach, orange and teal brushstrokes. Dominant tones: olive green over warm peach and soft teal.

No brands or logos. All six frames are distinct photographs; exact framing is forgiving under `object-fit:cover`. Note the markup's card titles (Synthetic Silhouette, Red Form Study, Material Pause, Obscured Profile, Muted Presence, Spatial Balance) are neutral demo labels and do not literally describe every paired photo.

## Behavior notes
- **Trigger:** hover only — `mouseenter` draws the scribbles on and raises the title; `mouseleave` reverses. Nothing autoplays; there is no scroll-, load-, or click-driven animation of the effect.
- **Kill-before-build:** each handler does `if (tl) tl.kill()` then makes a fresh `gsap.timeline()`, so flicking the pointer on/off a card snaps cleanly to the new direction.
- **Both scribbles are the same two SVG shapes in every card** — only the `.svg-stroke-1` color changes per card id; `.svg-stroke-2` stays light grey (`#e0e0e0`) everywhere.
- **Responsive** (`@media (max-width:1000px)`): `.row { flex-direction:column; }` — the two cards stack vertically; everything else (square cards, hover timelines) is unchanged. The effect is pointer/hover-driven, so it targets desktop.
- No reduced-motion guard in the original.

## Acceptance check (reproduction is only faithful if all hold)
- `index.html` is a full document beginning with `<!doctype html>` and **links `./styles.css` in `<head>`**; the module `./script.js` loads before `</body>`.
- At rest: a **3×2 grid of square, rounded, clipped cards** — each just the photo, with the scribbles invisible (dashoffset = length) and the title hidden below its mask. No giant loose scribbles anywhere; total page height is a few screens, not tens of thousands of pixels.
- On hovering `card-1`: the **lime-yellow** scribble and the **light-grey** scribble both **draw on** over the photo (clipped to the rounded box) while **fattening 200 → 700**, and the title "Synthetic Silhouette" **rises word-by-word** from its bottom-left mask. `mouseleave` cleanly reverses both.
- Console is clean (zero errors); the GSAP timeline runs on hover.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/svg-image-hover-effect/img1.jpg
https://motionprompts.dev/c/svg-image-hover-effect/img2.jpg
https://motionprompts.dev/c/svg-image-hover-effect/img3.jpg
https://motionprompts.dev/c/svg-image-hover-effect/img4.jpg
https://motionprompts.dev/c/svg-image-hover-effect/img5.jpg
https://motionprompts.dev/c/svg-image-hover-effect/img6.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--ink-soft`, `--marker-red`, `--marker-cobalt`, `--overlay`, `--card-1-stroke`, `--card-2-stroke`, `--card-3-stroke`, `--card-4-stroke`, `--card-5-stroke`, `--card-6-stroke`, `--card-base-stroke`, `--card-copy`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that means two Lenis instances briefly stepping the same wheel event, two identical `mouseenter`/`mouseleave` pairs sitting on the same six `.card-container` elements, and two `SplitText.create()` calls racing to split the same six `<h3>`s. Treat the cleanup as part of the effect, not as an afterthought.

**(1) The entry point.** The script runs at the top level — `new Lenis()`, `document.querySelectorAll(".card-container")` and the `forEach` that wires every card all execute the instant the module is evaluated. In React that is import time, before the grid has rendered, so the query would return an empty NodeList and nothing would ever get wired. Move the whole body into a `useEffect` with an empty dependency array; do not leave any of it at module or component-body scope, or it either runs too early or re-runs on every render.

**(2) Element lookups.** The only unscoped lookup is the outer `document.querySelectorAll(".card-container")` — everything downstream (`cardContainer.querySelectorAll(".svg-stroke path")`, `cardContainer.querySelector(".card-title h3")`) is already relative to the `cardContainer` that outer call produced. Give the component a root `ref`, render it on the element wrapping all three `.row`s, and change only that one call to `rootRef.current.querySelectorAll(".card-container")`; the twelve per-card lookups downstream are then scoped for free. During the StrictMode remount two copies of the grid exist for an instant, and an unscoped `document.querySelectorAll` would silently wire the hover listeners onto the six cards that are on their way out.

**(3) Cleanup.** This component has five things that outlive the synchronous setup pass, and one that doesn't — only the one gets undone by `gsap.context` automatically.

**GSAP.** Wrap the setup in a `gsap.context` scoped to the root ref; `gsap.registerPlugin(SplitText)` stays at module scope, since calling it once per import is enough. The only thing GSAP creates synchronously inside the factory is the priming `gsap.set(split.words, { yPercent: 100 })`, run once per card — that is what `ctx.revert()` actually undoes here. It does not touch the hover timelines, and that is not a gap to patch with `self.add`: `gsap.timeline()` is (re)built later, inside the `mouseenter`/`mouseleave` callbacks, once per hover for as long as the card stays on screen. Routing that through `self.add` would just make the context's internal record of created tweens grow for the life of the component instead of being reused and discarded the way a plain closure already does. So lift the "current timeline" out of the closure instead of asking the context to track it:

```jsx
useEffect(() => {
  const lenis = new Lenis();
  let rafId = requestAnimationFrame(function raf(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  });

  const cardRecords = []; // lets cleanup reach the live `tl` and `split` per card

  const ctx = gsap.context(() => {
    const cards = rootRef.current.querySelectorAll(".card-container");

    cards.forEach((cardContainer) => {
      const cardPaths = cardContainer.querySelectorAll(".svg-stroke path");
      const cardTitle = cardContainer.querySelector(".card-title h3");
      const split = SplitText.create(cardTitle, { type: "words", mask: "words", wordsClass: "word" });
      gsap.set(split.words, { yPercent: 100 });

      cardPaths.forEach((path) => {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
      });

      const record = { cardContainer, split, tl: null };
      record.onEnter = () => {
        record.tl?.kill();
        record.tl = gsap.timeline();
        /* same two-path draw-on plus the delayed word-rise as the vanilla mouseenter above */
      };
      record.onLeave = () => {
        record.tl?.kill();
        record.tl = gsap.timeline();
        /* same two-path un-draw plus the reversed word-drop as the vanilla mouseleave above */
      };
      cardContainer.addEventListener("mouseenter", record.onEnter);
      cardContainer.addEventListener("mouseleave", record.onLeave);
      cardRecords.push(record);
    });
  }, rootRef);

  return () => {
    cancelAnimationFrame(rafId);
    lenis.destroy();
    cardRecords.forEach(({ cardContainer, onEnter, onLeave, tl }) => {
      cardContainer.removeEventListener("mouseenter", onEnter);
      cardContainer.removeEventListener("mouseleave", onLeave);
      tl?.kill();
    });
    ctx.revert();
    cardRecords.forEach(({ split }) => split.revert());
  };
}, []);
```

What `ctx.revert()` covers: the per-card priming `gsap.set`. What it does not, and what the cleanup above handles by hand: the twelve native `addEventListener` calls (two per card — GSAP never sees a plain DOM listener), whichever `gsap.timeline()` happens to be `record.tl` at the instant of unmount (if the pointer leaves mid-hover, an unkilled tween keeps animating `strokeDashoffset` and the SVG `stroke-width` attribute against a card that is being torn down), the six `SplitText` instances, the Lenis instance, and the rAF loop that steps it.

**Lenis.** This page owns its Lenis instance directly rather than sharing one from a host app, so create it inside the effect and call `destroy()` in the cleanup — its teardown doesn't interleave with GSAP's or the split's, so the ordering relative to them doesn't matter. If you drop this component into a page that already runs Lenis (see the single-instance note above), skip `new Lenis()` here and drive the hover timelines off the existing instance instead. Either way, the `raf` function reschedules itself every frame; keep the latest handle in `rafId` and cancel it in the same cleanup, or the loop keeps calling `lenis.raf()` into a destroyed instance for the life of the tab.

**SplitText.** `SplitText.create(cardTitle, { type: "words", mask: "words", wordsClass: "word" })` rewrites each `<h3>` into per-word spans, each wrapped in its own overflow-hidden mask — that mask is the entire mechanism behind the word-by-word rise. Run it again on the same title without reverting first and you split the mask spans themselves: `.word` then matches nodes one level deeper than the tween targets, the priming `gsap.set` on the second pass hides the wrong spans, and the title either never disappears at rest or never rises on hover. Revert every card's split in the cleanup, and do it after `ctx.revert()` — the priming set and any tween built against `split.words` need to finish running (or get killed) before the nodes they reference are collapsed back into a single text node.
