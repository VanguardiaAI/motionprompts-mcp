# Ingamana Scroll Animation

## Goal
Build a long scroll page: a full-screen intro, then a **10-row image grid**, then a full-screen outro. The signature effect: **each grid row continuously widens as you scroll it through the viewport** — from `125%` to `500%` of the viewport width (`250% → 750%` on mobile) — and because every row is horizontally centered inside an `overflow:hidden` container, the extra width bleeds off both edges symmetrically, so the whole row (and its images) reads as a smooth **zoom-in / push-in** the deeper it travels up the screen. Every row runs its own zoom independently, keyed to that row's own scroll progress, producing a staggered cascade of expanding rows. Smooth scroll via Lenis. Crucially, this is **NOT a ScrollTrigger effect** — it is hand-computed every frame from `window.scrollY` inside a `gsap.ticker` callback.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) and `lenis` (npm) for smooth scroll. **No GSAP plugins at all** — no ScrollTrigger, no SplitText, no CustomEase, no Three.js. No framework. Plain Vite-style module imports:
```js
import gsap from "gsap";
import Lenis from "lenis";
```

## Layout / HTML
Three top-level blocks in `<body>`:

```
section.intro                 (full-screen, centered)  > p "Intro Section"
section.projects              (the grid; JS sets its explicit pixel height)
  div.projects-row            × 10   (each row is a horizontal flex strip)
    div.project               × 9    (nine cards per row)
      div.project-img > img
      div.project-info > p (label) + p (year)
section.outro                 (full-screen, centered)  > p "Outro Section"

<script type="module" src="./script.js">   (before </body>)
```

Details that the CSS/JS depend on:
- **Exactly 10 `.projects-row` elements**, each containing **exactly 9 `.project` cards** (90 cards total). The row count and card count both matter — the section-height precompute multiplies by `rows.length`, and 9 flex cards per row set the aspect/height math.
- Each `.project` holds a `.project-img` (the image, cropped) above a `.project-info` bar with two `<p>`: a short **label** on the left and a 4-digit **year** on the right.
- Fill the 90 cards by cycling through 16 distinct images (img1…img16, then repeat). Use neutral one/two-word placeholder labels + years, e.g. `Fieldnotes 2020`, `Redline 2021`, `Gallery Walk 2019`, `Side Profile 2022`, `Open Mic 2023`, `Backboard 2024`, `Afterglow 2021`, `Hill House 2020`, `Low Tide 2018`, `Timepiece 2019`, `Close Focus 2022`, `Airframe 2023`, `Hardcase 2024`, `Deep Red 2021`, `Fast Track 2022`, `Night Shift 2025`. Invent nothing brand-related. Intro/outro paragraphs are literally "Intro Section" / "Outro Section".

## Styling
Fonts: **Inter** for the page, **Space Grotesk** for the display type, **Space Mono** for the small uppercase labels.

Palette (P3 Chartreuse-Olive):
```css
:root {
  --paper: #f2efe6;   /* the page */
  --ink: #20241c;     /* dark olive-black type */
  --olive: #3a4034;   /* secondary copy */
  --acid: #d5e14e;    /* chartreuse — selection and small highlights only */
}
```

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { font-family:"Inter", sans-serif; background-color: var(--paper); color: var(--ink); }`
- `img { width:100%; height:100%; object-fit:cover; }` — images always fill their box, cropped.

Typography:
- `p { text-transform:uppercase; font-size:0.9rem; font-weight:500; letter-spacing:-0.02rem; line-height:1; }`
- `.project-info p { font-size:0.75rem; font-family:"Space Mono", monospace; color: var(--olive); }` (smaller than the intro/outro labels).

Intro & outro (full-screen bookends):
- `.intro, .outro { position:relative; width:100%; height:100svh; display:flex; justify-content:center; align-items:center; overflow:hidden; }`

The grid — **this is the part the effect hangs on**:
- `.projects { position:relative; width:100%; padding:0.5rem 0; display:flex; flex-direction:column; align-items:center; gap:0.5rem; overflow:hidden; }`
  - `align-items:center` + `overflow:hidden` are load-bearing: rows are **wider than the viewport** and centered, so growth spills off both sides equally and is clipped — that symmetric clip is what makes it read as a centered zoom rather than a rightward slide.
  - The `0.5rem` vertical `gap` and `0.5rem 0` `padding` are read back by the JS to compute the section's fixed height (see below), so keep them exactly.
- `.projects-row { width:125%; display:flex; gap:1rem; }` — the **`width:125%` is the animation's start value** (the CSS default before JS takes over); JS overwrites `style.width` every frame. `1rem` horizontal gap between cards.
- `.project { flex:1; aspect-ratio:7/5; display:flex; flex-direction:column; overflow:hidden; }` — nine equal `flex:1` cards; the fixed `7/5` aspect ratio is why a wider row is also a **taller** row (the images grow in both dimensions as the row expands).
- `.project-img { flex:1; min-height:0; overflow:hidden; }` (image area takes all remaining card height above the info bar; `min-height:0` lets it shrink correctly inside the flex column).
- `.project-info { display:flex; justify-content:space-between; padding:0.25rem 0; }` (label left, year right).

## GSAP effect (the important part — be exhaustive)

There is **no gsap tween and no timeline anywhere**. `gsap` is used only for (a) driving Lenis and (b) its high-frequency `ticker` as a rAF loop; all width changes are computed by hand and written to `row.style.width`. Do **not** substitute ScrollTrigger — reproduce the manual `scrollY` math exactly.

Everything runs inside `document.addEventListener("DOMContentLoaded", () => { ... })`.

### 1) Smooth-scroll wiring (Lenis driven by the GSAP ticker)
```js
const lenis = new Lenis({ autoRaf: false });          // Lenis does NOT run its own rAF
gsap.ticker.add((time) => { lenis.raf(time * 1000); }); // GSAP's ticker drives Lenis (time is seconds → ms)
gsap.ticker.lagSmoothing(0);                          // disable lag smoothing so motion stays glued to scroll
```
No `gsap.registerPlugin(...)` call (there are no plugins).

### 2) Cache elements, breakpoint, and the start/end widths
```js
const section = document.querySelector(".projects");
if (!section) return;
const rows = Array.from(section.querySelectorAll(".projects-row")); // the 10 rows

const isMobile = window.innerWidth < 1000;      // breakpoint at 1000px
let rowStartWidth = isMobile ? 250 : 125;       // START width % (mobile 250, desktop 125)
let rowEndWidth   = isMobile ? 750 : 500;       // END   width % (mobile 750, desktop 500)
```
So desktop rows animate `125% → 500%` width; mobile rows animate `250% → 750%`.

### 3) Pre-compute and lock the section's full-expanded height (prevents scroll jump)
Because a row is far taller at `500%` width than at `125%`, letting the grid reflow as rows grow would make the page height (and every row's scroll position) shift mid-scroll. To avoid that, reserve the fully-expanded height up front and pin it as an explicit pixel height on `.projects`:
```js
const firstRow = rows[0];
firstRow.style.width = `${rowEndWidth}%`;          // temporarily expand row 1 to its END width…
const expandedRowHeight = firstRow.offsetHeight;   // …measure how tall a fully-expanded row is…
firstRow.style.width = "";                         // …then revert (CSS 125% start returns)

const sectionGap     = parseFloat(getComputedStyle(section).gap) || 0;        // 0.5rem → 8px
const sectionPadding = parseFloat(getComputedStyle(section).paddingTop) || 0; // 0.5rem → 8px

const expandedSectionHeight =
  expandedRowHeight * rows.length +      // 10 fully-expanded rows
  sectionGap * (rows.length - 1) +       // 9 inter-row gaps
  sectionPadding * 2;                    // top + bottom padding

section.style.height = `${expandedSectionHeight}px`;   // lock the height
```
This makes the total scrollable distance constant, so each row's progress window is stable while its width animates.

### 4) The per-frame zoom (runs every ticker tick)
Add a second callback to the same `gsap.ticker`; it recomputes every row's width from the live `window.scrollY` on every frame:
```js
function onScrollUpdate() {
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;

  rows.forEach((row) => {
    const rect = row.getBoundingClientRect();
    const rowTop = rect.top + scrollY;         // row's absolute top in the document
    const rowBottom = rowTop + rect.height;    // row's absolute bottom

    const scrollStart = rowTop - viewportHeight; // progress 0 when the row's top is one viewport below the scroll
    const scrollEnd   = rowBottom;               // progress 1 when scrollY reaches the row's bottom

    let progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
    progress = Math.max(0, Math.min(1, progress)); // clamp 0…1

    const width = rowStartWidth + (rowEndWidth - rowStartWidth) * progress; // linear interpolate
    row.style.width = `${width}%`;
  });
}
gsap.ticker.add(onScrollUpdate);
```
Exact behavior to reproduce:
- **Per-row progress window:** for each row, `progress` is `0` while the row's top is still ≥ one full viewport-height below the current scroll (row about to appear from the bottom), and reaches `1` once the page has scrolled such that `scrollY === rowBottom` (row's bottom crossing the very top). Between those two points progress ramps **linearly**.
- **Width mapping:** `width% = rowStartWidth + (rowEndWidth - rowStartWidth) * progress`, i.e. **125% → 500%** desktop (250% → 750% mobile), applied as an inline `width` on the row. Strictly linear — the only smoothing is Lenis's inertial scroll feeding `window.scrollY`.
- **Independent per row:** each row has its own start/end scroll positions, so at any moment different rows sit at different widths — a continuous, staggered cascade of expanding rows, not one synchronized move.
- Because the row is centered (`align-items:center`) inside a clipped container, the growth is symmetric about the horizontal center → centered zoom-in. The `7/5` card aspect ratio means the images enlarge vertically too as the row widens.

### 5) Resize handler (recompute breakpoint widths + locked height)
```js
window.addEventListener("resize", () => {
  const isMobileNow = window.innerWidth < 1000;
  rowStartWidth = isMobileNow ? 250 : 125;
  rowEndWidth   = isMobileNow ? 750 : 500;

  firstRow.style.width = `${rowEndWidth}%`;
  const newRowHeight = firstRow.offsetHeight;
  firstRow.style.width = "";

  const newSectionHeight =
    newRowHeight * rows.length +
    sectionGap * (rows.length - 1) +
    sectionPadding * 2;
  section.style.height = `${newSectionHeight}px`;
});
```
Re-derives the start/end widths for the current breakpoint and re-locks the section height (same formula). It does not otherwise re-run the zoom — the ticker keeps computing widths from the new values on the next frame.

No `ease` keyword, `duration`, `delay`, or `stagger` anywhere — none of GSAP's tweening API is used. The "stagger" look emerges naturally from each row's distinct scroll window; the "ease" is just Lenis smoothing the scroll input.

## Assets / images
**16 distinct images**, landscape framing roughly **7:5** (they render inside `.project-img` at `object-fit:cover`, so exact source ratio is forgiving — they get cropped to fill). The set is deliberately eclectic — a different subject, colour story and light per frame — which is what makes the widening rows read as a curated gallery rather than a pattern. What the demo ships, by kind:

- **Still life and product**: a wilted tulip on black; a perforated monitor back with red accents; a matte black webcam clipped to a screen edge; a minimal wall clock in dim light.
- **Portrait and figure**: a side profile against a vivid orange backdrop; a freckled face in extreme close-up; a dancer arched mid-motion against an amber sky; a figure floating eyes-closed in red water.
- **Scene**: a gallery hall lined with wooden vases; a speaker before a silhouetted audience; a surfer crossing a beach at sunset; a blurred figure scrambling over rocks.
- **Graphic**: a branding stationery flat lay with hard shadows; a studio poster wall with saturated accents.

Common thread: one clear subject per frame, generous negative space, and a saturated colour somewhere in it — the page around them is bone and olive, so the photographs supply all the chroma. Cycle the 16 across the 90 cards (img1…img16, repeat). No brand marks, logos, or text baked into the images.

## Behavior notes
- **Scroll-scrubbed and fully reversible** — nothing autoplays; every row width is a pure function of the current scroll position, so scrolling back up un-zooms the rows. The ticker recomputes all rows each frame regardless of scroll direction.
- **Breakpoint at 1000px** only swaps the start/end width pair (125/500 → 250/750); the mechanism is identical on mobile.
- Heights use `svh` on the intro/outro so mobile browser chrome doesn't clip the full-screen bookends.
- The section's pixel height is computed once on load and again on resize; the per-frame math reads `getBoundingClientRect()` + `window.scrollY` live, so it self-corrects as the locked height changes.
- No reduced-motion handling in the original.

## Images

This component ships with 16 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/ingamana-scroll-animation/img1.jpg
https://motionprompts.dev/c/ingamana-scroll-animation/img10.jpg
https://motionprompts.dev/c/ingamana-scroll-animation/img11.jpg
https://motionprompts.dev/c/ingamana-scroll-animation/img12.jpg
https://motionprompts.dev/c/ingamana-scroll-animation/img13.jpg
https://motionprompts.dev/c/ingamana-scroll-animation/img14.jpg
… 10 more under https://motionprompts.dev/c/ingamana-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--olive`, `--acid`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, builds one `Lenis` instance, pumps it from a `gsap.ticker` callback, locks a pixel height onto `.projects`, and registers a second `gsap.ticker` callback plus a `window` `resize` listener that both run for the rest of the page's life — there is no navigation event that would ever ask this script to hand any of it back. React removes that assumption the moment this becomes a component.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Nothing in this effect is a `gsap` tween or a `ScrollTrigger` — the whole thing is two functions living on the global `gsap.ticker` (the `lenis.raf` pump and `onScrollUpdate`), a `resize` listener on `window`, and inline styles written by hand (`row.style.width` every tick, `section.style.height` once). None of those four is scoped to a component instance: `gsap.ticker` is a page-wide singleton and `window` outlives every mount. Skip the cleanup and the double-invoke leaves two `lenis.raf` pumps and two `onScrollUpdate` copies both reading the same `scrollY` into the same rows every frame, two `resize` listeners, and — worse — two independent `Lenis` instances both attached to the same wheel and touch events, fighting over the same scroll the way two smooth-scrollers always do. It will not reproduce in a production build, because React only double-invokes effects in development; it will reproduce every time this route is left and revisited in an SPA, because each remount stacks one more generation of the same four resources on top of the last, forever.

*(1) The entry point* — the `Lenis` construction, both `gsap.ticker.add` calls, the row/section measurement, and the `resize` listener all sit inside `document.addEventListener("DOMContentLoaded", () => {...})`. A React component commits after that event has already fired, so the listener is registered and never called: no smooth scroll, no expanding rows, every `.projects-row` sits frozen at its CSS `width:125%` with nothing in the console to explain why. Delete the listener and move its body into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `document.querySelector(".projects")` (guarded by `if (!section) return;`) and `section.querySelectorAll(".projects-row")` assume this component owns the document. Give the `<section className="projects">` a root ref and query off it — `rootRef.current.querySelectorAll(".projects-row")` — instead of the bare class selector. The `if (!section) return;` guard can stay as defensive coding, but it stops being reachable in the ordinary case once the ref is attached to the JSX this component itself renders.

*(3) Cleanup* — this component's shape cuts against the usual GSAP advice instead of following it. There is no tween and no `ScrollTrigger` anywhere in this effect, so a `gsap.context` here would have nothing to revert: `ctx.revert()` only undoes tweens, triggers, and the inline styles a tween wrote — and every inline style this effect touches (`row.style.width`, `section.style.height`) is plain assignment, not GSAP's doing. A context would compile here and do nothing wrong, but it would also do nothing useful, so don't let it stand in for real cleanup. What actually needs undoing is three resources, none of them owned by any context:

```jsx
useEffect(() => {
  const lenis = new Lenis({ autoRaf: false });
  const pumpLenis = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(pumpLenis);
  gsap.ticker.lagSmoothing(0); // global, idempotent

  // measure firstRow, lock rootRef.current.style.height, define onScrollUpdate
  // exactly as described above, scoped to rootRef.current

  gsap.ticker.add(onScrollUpdate);
  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
    gsap.ticker.remove(onScrollUpdate);
    gsap.ticker.remove(pumpLenis);
    lenis.destroy();
  };
}, []);
```

Keep the exact function references `pumpLenis`, `onScrollUpdate`, and `handleResize` this run created, and remove each one by that same reference — `gsap.ticker.remove` and `removeEventListener` both silently no-op on a mismatched reference, so an inline arrow re-created at cleanup time removes nothing and the stale callback keeps ticking. Destroy `lenis` only after pulling `pumpLenis` off the ticker, in that order, so no tick already in flight calls `.raf()` on an instance that no longer exists. The row widths and the locked section height need no separate reset: they exist only as inline styles on DOM nodes this component rendered, and a genuine unmount removes those nodes with them. The StrictMode double-invoke doesn't touch the DOM between its two effect runs either, so the second run's own measurement step (`firstRow.style.width` set to the end value, read back, then cleared) simply recomputes the same numbers from the same layout — it does not need the first run's cleanup to have reset anything first.

This component also constructs its own `Lenis` instance, on the same assumption every full-page demo in this catalogue makes: exactly one smooth-scroll instance for the whole document. If this ships as one section inside a larger app, lift the `Lenis` instance and the `pumpLenis` wiring to whatever shell already owns scrolling, and let `onScrollUpdate` go on reading `window.scrollY` unchanged — the row-width math never touches the `Lenis` instance directly, so it survives the move without modification.
