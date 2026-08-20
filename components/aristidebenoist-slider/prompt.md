# Fullscreen Horizontal Slider — Segmented Progress Nav + Kinetic Display-Type Titles

## Goal
Build a full-screen horizontal image carousel with a signature choreography driven entirely by **clicking segments in a top progress-bar navigation**. Each slide holds one centered image. Above them sits a slim horizontal bar split into 30 thin segments; the **active segment stretches wide** (a pure-CSS `flex` grow) while the others stay hairline-thin. Clicking a different segment does three things at once, all `1.5s` long on a custom **`"hop"` CustomEase**: (1) the whole horizontal track of slides **slides sideways** to the chosen slide, (2) a full-screen **background-color overlay tweens to a new random color**, and (3) a giant two-row **display-type title** re-animates — every letter is destroyed and re-created, then **slides in from the side** (from the right when advancing, from the left when going back) with `power2.out`. It's an editorial portfolio slider: oversized serif kinetic typography floating over a color wash, with a centered image per slide.

## Tech
- Vanilla HTML / CSS / JS with ES module imports, bundled by a **Vite**-style dev server (npm project).
- **`gsap` (npm)** plus exactly one GSAP plugin: **`CustomEase`**. No ScrollTrigger, no SplitText, no smooth-scroll library, no canvas/WebGL. The whole thing is **click-driven** — there is no scroll and no rAF loop.
- Imports and registration:
```js
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1");
```
- Title copy lives in a separate `data.js` (`export const titles = [...]`). All DOM building + wiring happens inside a single `document.addEventListener("DOMContentLoaded", …)` in `script.js` (`<script type="module" src="./script.js">`).

## Layout / HTML
The markup is mostly empty shells that JS fills. Class names are load-bearing. Use neutral/fictional copy — no real brand names. The demo wordmark is **"Motionprompts"**.

```html
<div class="container">
  <nav>
    <a href="#" id="logo">Motionprompts</a>
    <a href="#">Subscribe</a>
  </nav>
  <footer>
    <a href="#">Unlock Source Code with PRO</a>
    <a href="#">Link in description</a>
  </footer>

  <div class="bg-overlay"></div>     <!-- full-screen color wash -->
  <div class="slider-nav"></div>     <!-- JS injects 30 .nav-item-wrapper segments -->
  <div class="slides"></div>         <!-- JS injects 30 .slide elements in a horizontal flex row -->

  <div class="slide-title">
    <div class="slide-title-row"><!-- 7 empty .letter divs --></div>
    <div class="slide-title-row"><!-- 7 empty .letter divs --></div>
  </div>
</div>

<script type="module" src="./script.js"></script>
```

The two `.slide-title-row` divs each contain **exactly 7 empty `<div class="letter">`** in the HTML (14 letter slots total). JS injects/replaces a `<span>` inside each on every title change.

**Per-slide DOM (built in the JS loop, i = 0..29):**
```
.slide            (flex 1, one viewport wide)
  .img            (centered box, 50% × 50% of viewport)
    img           src = /c/aristidebenoist-slider/img{i+1}.jpg
```

**Per-nav-segment DOM (built in the same loop):**
```
.nav-item-wrapper   (segment 0 also gets class "active")
  .nav-item         (the thin tick inside)
```

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; }`.

**Fonts** (name these families; supply free substitutes if unavailable):
- **Body / UI**: `"PP Neue Montreal"` — a neutral grotesque sans (substitute: Inter / Neue Haas Grotesk).
- **Display** (logo + the giant title letters): `"Timmons NY 2.005"` — a tall, high-contrast condensed **serif display** face (substitute: a heavy fashion-editorial serif like a condensed Didone / GT Sectra display / Ogg). Set on `nav a#logo` and `.letter span`.

**Colors / tokens:**
- Text is black `#000`.
- `.bg-overlay` initial background: **`rgb(213, 183, 71)`** (a mustard/gold), with `filter: brightness(0.75);` and `opacity: 0.5;` — a soft muted color wash over the whole viewport. Later JS tweens its `background-color` to random hex values.

**Structure:**
- `.container`: `width:100vw; height:100vh; overflow:hidden;` — clips the oversized horizontal track and the giant letters.
- `nav`, `footer`: `position:fixed; left:0; width:100vw; padding:2.75em; display:flex; justify-content:space-between; z-index:2;` — `nav{top:0}`, `footer{bottom:0}`.
- `a`: `text-decoration:none; text-transform:uppercase; font-size:12px; font-weight:500; color:#000;`.
- `nav a#logo`: `position:relative; top:-12px;` display serif, `font-size:42px;`.
- `.bg-overlay`: `position:fixed; inset:0; width:100vw; height:100vh;` (see color tokens above).

**The segmented progress nav (the click target):**
- `.slider-nav`: `position:fixed; top:5%; left:50%; transform:translateX(-50%); width:25%; height:15px; display:flex; justify-content:space-between; z-index:10;`.
- `.nav-item-wrapper`: `flex:1; height:100%; display:flex; justify-content:center; align-items:center; transition: all 750ms cubic-bezier(0, 0.75, 0.5, 1);` — **CSS transition**, not GSAP.
- `.nav-item`: `width:1px; height:100%; border:1px solid rgba(0,0,0,0.15); transition: all 750ms cubic-bezier(0, 0.75, 0.5, 1);` — a faint hairline tick.
- `.nav-item-wrapper.active`: `flex:5;` — the active segment claims 5× the width of the others, so the bar reads like a progress indicator with one long lit cell.
- `.nav-item-wrapper.active .nav-item`: `width:50%; border:1px solid rgba(0,0,0,1);` — the active tick grows and turns solid black.

**The horizontal slide track:**
- `.slides`: `position:fixed; top:0; left:0; width:3000vw; height:100vh; display:flex;` — **3000vw** = 30 slides × 100vw laid side by side. GSAP translates this whole element on `x`.
- `.slide`: `flex:1; width:100vw; height:100vh; display:flex; justify-content:center; align-items:center;`.
- `.slide .img`: `width:50%; height:50%; opacity:0.75;` — image sits in a centered box occupying half the viewport each way.
- `img`: `width:100%; height:100%; object-fit:cover;`.

**The giant kinetic title:**
- `.slide-title`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:75%; height:65%; display:flex; flex-direction:column; pointer-events:none;` — floats centered over the slides, non-interactive so nav clicks pass through.
- `.slide-title-row`: `flex:1; width:100%; display:flex; gap:0;` (two rows).
- `.slide-title-row:nth-child(2)`: `position:relative; left:4em;` — the second row is nudged right for an offset editorial layout.
- `.letter`: `flex:1; height:100%; padding-left:2em; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` — each of the 7 cells per row is an equal-width column; the full-rectangle `clip-path` masks the span so a letter that slides in from the side is **clipped at the cell edges** (it wipes in rather than flying across).
- `.letter span`: `position:relative; display:inline-block; font-family:"Timmons NY 2.005"; font-size:280px; filter: brightness(0.25) saturate(0.75) !important;` — NOTE: this `!important` filter **overrides** the inline `filter` GSAP sets, so every letter renders as a dark, desaturated version of the current color (near-black), regardless of the random color assigned to it.

## GSAP effect (be exact)

### The "hop" CustomEase
`CustomEase.create("hop", "M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1")` — a fast-out, long-settle ease: it accelerates hard in the first ~30% then glides slowly into the end. Used for both the slide-track slide and the color tween.

### Build loop (30 items, index `i = 0..29`)
For each `i`:
1. Create `.nav-item-wrapper` (+ `.nav-item` child); segment `0` gets class `active`. Append to `.slider-nav`.
2. Create `.slide` (+ `.img` + `<img src="/c/aristidebenoist-slider/img{i+1}.jpg">`); slide `0` also gets class `active`. Append to `.slides`.
3. Attach a **click handler** to the wrapper (closure captures its own `i` via `let`).

Track two module-level values: `numberOfItems = 30` and `currentIndex = 0`.

### Click handler on a nav segment `i`
```js
if (i === currentIndex) return;                    // ignore clicks on the current segment

// active class swap (drives the CSS width transition on the bar)
document.querySelectorAll(".nav-item-wrapper").forEach(n => n.classList.remove("active"));
thisWrapper.classList.add("active");

// 1) slide the whole track horizontally
gsap.to(".slides", { x: `${-i * 100}vw`, duration: 1.5, ease: "hop" });

// 2) tween the background wash to a fresh random hex color
const newColor = getRandomColor();                 // "#" + 6 random hex chars
gsap.to(".bg-overlay", { backgroundColor: newColor, duration: 1.5, ease: "hop" });

// 3) re-animate the title (see below), then commit the index
updateTitle(i, newColor);
currentIndex = i;
```
- `getRandomColor()`: builds `"#"` + 6 characters picked at random from `0123456789ABCDEF`.
- The horizontal target is **`x: "-i*100vw"`** (e.g. clicking segment 7 → `x: "-700vw"`), so the chosen slide lands centered in the viewport.

### `updateTitle(newIndex, color)` — the kinetic letters
`titles[newIndex]` is `[rowArray0, rowArray1]`, each row a 7-element array of single characters (many are empty strings `""`, which create gaps → the scattered word layout). For **each** of the 2 `.slide-title-row`s, for **each** of its 7 `.letter` cells:
```js
const direction = newIndex > currentIndex ? 150 : -150;   // forward → enter from right; back → from left
// remove the old <span> if present
const span = document.createElement("span");
gsap.set(span, { x: direction, color: color, filter: "brightness(0.75)" });
span.textContent = title[rowIndex][letterIndex] || "";     // may be an empty string
letter.appendChild(span);
gsap.to(span, { x: 0, duration: 1, ease: "power2.out", delay: 0.125 });
```
Key points:
- Direction is decided **before** `currentIndex` is updated, so it reflects travel direction: advancing to a higher index → letters start at `x: 150` (enter from the right); going back → `x: -150` (enter from the left).
- Every letter uses the **same** `duration: 1`, `ease: "power2.out"`, `delay: 0.125` — **no stagger**; all 14 letters glide in together, clipped by their `.letter` cell so they appear to wipe in from the edge.
- The `color` set inline is the same random color used for the wash, but the CSS `filter … !important` on `.letter span` overrides the inline `filter`, so letters render near-black/desaturated regardless.

### Initial state (on load, after the build loop)
Call `updateTitle(0, getComputedStyle(bgOverlay).backgroundColor)` once. Since `newIndex (0)` is not `> currentIndex (0)`, `direction = -150`, so the very first title wipes in from the left. Slide `0` and nav segment `0` start `active`; the track sits at `x: 0`.

### Title data (`data.js`)
`export const titles` is an array of 30 entries, each `[ [7 chars], [7 chars] ]`. Empty strings are intentional gaps. Use short, neutral invented words (no real brands). Reproduce this exact set for a faithful result:
```js
export const titles = [
  [["p","","r","","i","s","m"], ["","t","","o","n","e",""]],
  [["","l","u","m","e","","n"], ["d","","r","e","a","m",""]],
  [["r","","u","s","","h",""], ["","s","l","i","","c","e"]],
  [["e","","c","h","o","","e"], ["","c","o","","d","e","6"]],
  [["t","e","","c","h","y",""], ["","m","","","a","p","l"]],
  [["","w","a","v","","e","s"], ["b","o","","x","","",""]],
  [["c","","u","b","","","e"], ["","s","i","t","","9","0"]],
  [["r","u","","s","h","","x"], ["t","","o","r","","k",""]],
  [["c","","o","d","","e",""], ["l","a","b","","","0","8"]],
  [["m","i","x","","e","","d"], ["","","a","r","","k",""]],
  [["","t","e","","s","t",""], ["b","","e","d","","5","4"]],
  [["f","o","c","u","","","s"], ["","d","o","c","k","",""]],
  [["p","","a","","c","e",""], ["s","e","t","","1","","7"]],
  [["","b","","l","a","s","t"], ["m","o","","d","","","e"]],
  [["z","o","","n","e","",""], ["g","e","3","","","n",""]],
  [["d","","r","e","a","","m"], ["s","c","a","p","0","",""]],
  [["e","l","e","v","a","n",""], ["","p","a","","t","","h"]],
  [["","s","","h","i","f","t"], ["","n","e","","","u","e"]],
  [["i","","c","o","","","n"], ["","m","e","m","o","",""]],
  [["","a","","","u","r","a"], ["w","","a","v","e","","6"]],
  [["s","t","e","l","","l","a"], ["","o","","r","b","i","t"]],
  [["v","","e","r","t","e",""], ["c","o","","r","","e",""]],
  [["i","n","f","i","","9",""], ["","","","e","t","h","o"]],
  [["","","q","u","a","n","t"], ["d","e","","c","","","k"]],
  [["","n","","","o","v","a"], ["r","","a","y","","",""]],
  [["","r","a","d","i","a","n"], ["g","l","o","","","w","0"]],
  [["c","o","s","m","i","c",""], ["p","","a","t","h","",""]],
  [["","s","o","l","a","r",""], ["d","r","i","f","","","t"]],
  [["z","e","n","","l","a","y"], ["","e","r","v","","y",""]],
  [["a","p","e","","x","",""], ["f","o","r","g","e","0","0"]],
  [["","c","r","y","s","t","a"], ["l","b","y","t","e","",""]],
];
```

## Assets / images
30 slide images at `/c/aristidebenoist-slider/img1.jpg … img30.jpg`. Each is shown in a **centered box occupying 50% × 50% of the viewport** with `object-fit: cover` at `opacity: 0.75`, so any aspect ratio works (roughly square-to-landscape framing reads best; crops are inevitable). Content is an eclectic editorial mix — extreme close-up portraits, moody studio product shots, abstract 3D renders (glossy discs, spheres, stacked panels), gadgets/devices, and interiors. Subjects need not relate; the point is variety across the 30 slides. No brand marks or logos in the images.

## Behavior notes
- **Click-only, no scroll, no rAF.** The only interactions are clicks on the 30 nav segments. Clicking the already-active segment is a no-op.
- **Responsive (`max-width: 900px`):** `.slider-nav` widens to `width:40%`; `.slide .img` grows to `width:80%; height:75%`; `.slide-title` becomes `left:47.5%; height:25%` and its second row resets to `left:0`; `.letter span` font-size drops from `280px` to `100px`.
- The bar's segment-widening is a **CSS transition** (`750ms cubic-bezier(0,0.75,0.5,1)`), intentionally slightly out of sync with the `1.5s` GSAP `"hop"` slide/color tweens.
- Colors are random each click, so no two sessions look identical; only the letter darkening (`filter … !important`) keeps the type readable over the shifting wash.

## Images

This component ships with 30 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/aristidebenoist-slider/img1.jpg
https://motionprompts.dev/c/aristidebenoist-slider/img10.jpg
https://motionprompts.dev/c/aristidebenoist-slider/img11.jpg
https://motionprompts.dev/c/aristidebenoist-slider/img12.jpg
https://motionprompts.dev/c/aristidebenoist-slider/img13.jpg
https://motionprompts.dev/c/aristidebenoist-slider/img14.jpg
… 24 more under https://motionprompts.dev/c/aristidebenoist-slider/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-soft`, `--plaster`, `--ochre`, `--hairline`, `--pad`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, builds its own thirty nav segments and thirty slides with `document.createElement`, wires a click handler onto each, and never expects to run twice. React withdraws that guarantee, and here it fails by literally doubling the deck: the build loop is not idempotent, so anything that re-runs it starts stacking `.nav-item-wrapper` and `.slide` elements instead of replacing them.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. A remount that repeats the build loop as written leaves sixty nav segments and sixty slides in the DOM instead of thirty — the progress bar shows twice as many hairline ticks as intended, the horizontal target `x: "-i*100vw"` no longer lands the clicked slide in the viewport because `.slides` is now twice as wide as the CSS expects, and two click handlers fire per segment on every click. None of this reproduces in a production build, because only development does the double mount. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no nav bar, no slides, no title, nothing to click. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its body — `CustomEase.create("hop", …)`, the build loop, and the final `updateTitle(0, …)` call — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(CustomEase)` and the `CustomEase.create("hop", …)` call currently live inside that same listener; both belong at module scope instead, evaluated once when the module loads — recreating the same named ease on every mount is harmless but pointless, and it's one less thing the effect body has to do.

*(2) Element lookups* — `.slider-nav`, `.slides`, `.bg-overlay` and `.slide-title` are all found with unscoped `document.querySelector`, which assumes this component owns the whole document; resolve all four off a root `ref` instead. The bigger issue is the build loop itself: the thirty `.nav-item-wrapper`/`.nav-item` pairs and the thirty `.slide`/`.img`/`img` trees are constructed and appended by hand inside the effect, one `document.createElement` call at a time. Don't port that loop — render both lists declaratively, mapping over the thirty indices in JSX once, with each segment's index closed over naturally by the `.map()` callback instead of the `let i` closure trick the original needs to work around a `for` loop. The two rows of seven `.letter` divs stay static markup exactly as they already are in `index.html` — that part doesn't need to become a loop — but `updateTitle`'s lookups (`slideTitle.querySelectorAll(".slide-title-row")`, then `.querySelectorAll(".letter")` per row) should resolve off the same root ref, or off a small `letterRefs` array of the fourteen cells collected via callback refs, rather than off a `slideTitle` variable that was itself found by a bare `document.querySelector(".slide-title")`. During the StrictMode remount two copies of this subtree exist for an instant, and a lookup that isn't scoped to the ref can bind a title update to the copy that's on its way out instead of the one on screen.

*(3) Cleanup — the setup, and the tweens a click creates later* — Wrap the setup in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the initial updateTitle(0, …) call against the just-rendered
       fourteen letter cells — nothing else needs to run here once the
       thirty segments and thirty slides are JSX, not createElement calls */
  }, rootRef);
  ctxRef.current = ctx;
  return () => ctx.revert();
}, []);
```

That one call reverts the inline styles the initial title reveal writes and kills its tweens if the component unmounts mid-animation. It does **not** cover the three tweens a click actually creates — the track's `x` tween on `.slides`, the color tween on `.bg-overlay`, and `updateTitle`'s fourteen `gsap.set`/`gsap.to` pairs on the freshly created letter spans — because all of that lives inside the nav segment's click handler, which runs long after the effect's synchronous body has already returned. `gsap.context` only records what executes while it is the active context; a handler merely *defined* inside that function during setup does not stay "inside" it once setup returns. Route the click handler's body through `ctx.add()`, or keep a killable reference to the in-flight track/overlay/letter tweens and call `.kill()` on them directly in the cleanup, so a StrictMode unmount mid-transition — or a real route change while a slide is still sliding — doesn't leave `.slides` or `.bg-overlay` still easing toward a target on an element React has already thrown away. `currentIndex` and `paletteCursor` are read and written synchronously inside that same handler, before `direction` is computed and before any of the three tweens fire — keep both as plain `useRef` values rather than component state, matching the module-scope mutable variables they replace, and drive the `.active` class swap on the clicked segment and slide from a small separate state value used only for that class toggle, since GSAP already owns the actual motion outside of React's render cycle.
