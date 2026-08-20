# Editorial Portfolio Preloader → Stacked Clip-Path Hero Reveal

## Goal
Build a full-screen photographer/creative-director **landing-page intro**. On load, a bottom-right **odometer counter** made of four stacked digit reels rolls from `000%` up to `100%` while a thin black **progress bar** fills, all sitting on a flat **chrome-yellow** page. When the "load" completes, a stack of **7 full-bleed editorial photos wipe in one-by-one** via a staggered `clip-path` reveal (right edge → left), the whole hero **scales up to 1.3**, the top nav **drops down** into place, and a giant surname **headline rises letter-by-letter** out of a clip mask. Everything plays automatically once on page load — no scroll, no hover, no click. Total run ≈ 12.5 s.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) only — no GSAP plugins, no smooth-scroll library. Import `import gsap from "gsap";`. The whole thing is a set of independent load-triggered `gsap.to` / `gsap.set` tweens (not one master timeline); each is scheduled by an explicit `delay`. Wrap the logic in a `DOMContentLoaded` listener. The per-character text split of the headline is done with a small **hand-rolled function** (wrap each character in a `<span>`) — NOT the SplitText plugin.

## Layout / HTML
Two stacked layers over a `.hero` section. Class/tag names are load-bearing — the JS queries them.

```html
<section class="hero">
  <div class="pre-loader">
    <p>Loading</p>

    <div class="counter">
      <div class="digit-1">
        <div class="num">0</div>
        <div class="num offset">1</div>
      </div>
      <div class="digit-2">
        <div class="num">0</div><div class="num">1</div><div class="num">2</div>
        <div class="num">3</div><div class="num">4</div><div class="num">5</div>
        <div class="num">6</div><div class="num">7</div><div class="num">8</div>
        <div class="num">9</div><div class="num">0</div>
      </div>
      <div class="digit-3">
        <div class="num">0</div><div class="num">1</div><div class="num">2</div>
        <div class="num">3</div><div class="num">4</div><div class="num">5</div>
        <div class="num">6</div><div class="num">7</div><div class="num">8</div>
        <div class="num">9</div>
      </div>
      <div class="digit-4">%</div>
    </div>

    <div class="progress-bar"></div>
  </div>

  <div class="hero-imgs">
    <img src="<photo 1>" alt="" />
    <img src="<photo 2>" alt="" />
    <img src="<photo 3>" alt="" />
    <img src="<photo 4>" alt="" />
    <img src="<photo 5>" alt="" />
    <img src="<photo 6>" alt="" />
    <img src="<photo 7>" alt="" />
  </div>
</section>

<div class="website-content">
  <nav>
    <div class="logo"><p>Logo</p></div>
    <div class="site-info"><p>(Photographer, creative director, filmmaker)</p></div>
    <div class="menu"><p>Menu</p></div>
  </nav>

  <div class="header"><h1>Marlow</h1></div>
</div>
```

The `.digit-1` and `.digit-2` reels are authored fully in HTML; the `.digit-3` reel is authored with only its first 10 nums and then **extended by JS** (see GSAP setup). `<h1>` holds a single surname word (use a neutral placeholder like `Marlow` — an arbitrary 6-letter surname; the character count drives the reveal stagger). Do not use any real client brand.

## Styling
Single flat palette:
- **`#ebdc0b`** — chrome/acid yellow: the full-page background (`html, body`), the nav text color, and the headline color.
- **`#000`** — black: default text (the `Loading` label + counter digits sit black-on-yellow) and the progress-bar fill.

Global reset: `* { margin:0; padding:0; box-sizing:border-box }`. `html, body { width:100vw; height:100vh; overflow:hidden; background:#ebdc0b }`.

Typography (two display faces; if the exact fonts are unavailable, substitute a **bold condensed display serif** for the loader/nav and a **very thin, light, wide sans** for the headline):
- Loader label, counter and nav use family **"Timmons NY"** (a tall condensed display face).
- Headline `<h1>` uses family **"PP Neue World"**, weight **200** (ultra-thin).

Element specifics (initial states matter — the animation depends on them):

- `img` — `position:absolute; width:100%; height:100%; object-fit:cover;` and the **critical initial clip-path** `clip-path: polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)` (all four points collapsed onto the right edge → the image is an invisible zero-width sliver pinned right).
- `.hero` — `width:100vw; height:100vh; padding:3em` (the 3em padding leaves a yellow border framing the photos).
- `.hero-imgs` — `position:relative; width:100%; height:100%; overflow:hidden; z-index:0` (all 7 images stack absolutely inside it).
- `.pre-loader` — `position:fixed; top:0; right:0; width:200%; height:100%; padding:2em; display:flex; justify-content:flex-end; align-items:flex-end; gap:0.5em; overflow:hidden; z-index:2`. It is anchored to the **bottom-right**; the label + counter + progress bar sit in a row at the bottom-right corner (the 200% width overflows off-screen left).
- `.pre-loader p` — `width:max-content; text-transform:uppercase; font-family:"Timmons NY"; font-size:60px; line-height:60px`.
- `.counter` — `height:100px; display:flex; font-family:"Timmons NY"; font-size:100px; font-weight:400; line-height:150px; clip-path: polygon(0 0, 100% 0, 100% 100px, 0 100px)`. The clip-path is a **100px-tall mask window**; each `.num` is 150px tall (line-height), so only one digit shows through the window at a time — this is what turns the reels into an odometer.
- `.digit-1, .digit-2, .digit-3, .digit-4` — `position:relative; top:-15px` (optical centering inside the 100px clip window).
- `.offset` — `position:relative; right:-7.5px` (kerning nudge for the narrow "1" glyph).
- `.progress-bar` — `position:relative; top:-15px; width:0%; height:4px; background:#000` (a thin black bar that starts at zero width).
- `.website-content` — `position:absolute; top:0; left:0; width:100%; height:100%; z-index:1` (sits **above** the images).
- `nav` — `position:fixed; top:0; width:100%; display:flex; padding:2em`. `nav > div { flex:1; font-family:"Timmons NY"; font-size:36px; font-weight:lighter; color:#ebdc0b; text-transform:uppercase }`. `.site-info { text-align:center }`, `.menu { text-align:right }` → logo left, credits centered, menu right.
- `.header` — `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)`.
- `h1` — `text-transform:uppercase; font-family:"PP Neue World"; font-size:20vw; font-weight:200; color:#ebdc0b; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)`. The clip-path is a **rectangular mask** that hides anything pushed below the headline box.
- `h1 span` (produced by the JS split) — `position:relative; top:400px` (every character starts **400px below** its resting line, hidden under the h1 clip mask).

## GSAP effect (be exhaustive)

Everything runs inside one `DOMContentLoaded` handler. There is no timeline object — each behavior is an independent `gsap.to` scheduled by `delay`. `ease` strings assume core GSAP eases (`power2/3/4.inOut/out`).

### Setup (before the tweens)
1. `gsap.set("nav", { y: -150 })` — park the whole nav 150px above the top edge.
2. Grab `const digit1 = ".digit-1"`, `digit2 = ".digit-2"`, `digit3 = ".digit-3"`.
3. **Headline split** — hand-rolled: read `.header h1` innerText, split into characters, wrap each char in `<span>…</span>`, join, and set as the h1's innerHTML. (`Marlow` → 6 spans. Each span inherits the CSS `top:400px`.)
4. **Extend the units reel** — the `.digit-3` reel authored with 10 nums (`0`–`9`) is grown by JS: append **two more full `0–9` runs** (nested loop `i<2`, `j<10`, each a `<div class="num">j</div>`), then append **one final `<div class="num">0</div>`**. Result: `.digit-3` ends with **31 nums** total, and its last num is `0`.

Final resting readout of the four reels (hundreds/tens/units/%) is **`100%`** (digit-1→`1`, digit-2→`0`, digit-3→`0`, digit-4 is the static `%`).

### A — Odometer counter roll (three reels)
Helper:
```js
function animate(digit, duration, delay = 1) {
  const numHeight = digit.querySelector(".num").clientHeight; // = 150px (line-height)
  const totalDistance = (digit.querySelectorAll(".num").length - 1) * numHeight;
  gsap.to(digit, { y: -totalDistance, duration, delay, ease: "power2.inOut" });
}
```
Each reel translates up by `(numCount − 1) × 150px` so its **last** num lands in the clip window. Calls, in order:
- `animate(digit3, 5)` — units reel (31 nums): `y: -4500`, duration **5**, delay **1** (default), `power2.inOut`.
- `animate(digit2, 6)` — tens reel (11 nums): `y: -1500`, duration **6**, delay **1**, `power2.inOut`.
- `animate(digit1, 2, 5)` — hundreds reel (2 nums): `y: -150`, duration **2**, delay **5**, `power2.inOut`.

So the units and tens reels start rolling at t=1 (units settles at t≈6, tens at t≈7); the hundreds reel flips `0→1` between t=5 and t=7. All three land at ≈100% by t≈7.

### B — Progress bar (two overlapping tweens on the same element)
```js
gsap.to(".progress-bar", { width: "30%",  duration: 2, ease: "power4.inOut", delay: 7 });
gsap.to(".progress-bar", {
  width: "100%", opacity: 0, duration: 2, ease: "power3.out", delay: 8.5,
  onComplete: () => gsap.set(".pre-loader", { display: "none" }),
});
```
The bar fills `0% → 30%` starting at t=7 (`power4.inOut`, 2 s), then a second tween (starting at t=8.5, `power3.out`, 2 s) drives it on to `100%` **while fading its opacity to 0**; on completion the entire `.pre-loader` is hidden (`display:none`). (Default GSAP overwrite is off, so the two width tweens briefly co-run around t=8.5–9 — that momentary overlap is intended, the net read is "bar fills and dissolves".)

### C — Stacked photo reveal (the star effect)
```js
gsap.to(".hero-imgs > img", {
  clipPath: "polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%)",
  duration: 1, ease: "power4.inOut", stagger: 0.25, delay: 9,
});
```
Each image animates its `clip-path` from the collapsed right-edge sliver `polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)` to the **full rectangle** `polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%)` — i.e. the two left-hand vertices slide from x=100% to x=0%, so each photo **wipes open from the right edge leftward**. Duration 1 s each, `power4.inOut`, **stagger 0.25 s** across the 7 images (last image starts at t≈10.5), all beginning at delay **9**. Because they're stacked absolutely, each new reveal paints over the previous one; the 7th photo is what's left on screen.

### D — Hero zoom-in
```js
gsap.to(".hero", { scale: 1.3, duration: 3, ease: "power3.inOut", delay: 9 });
```
The whole `.hero` (photo stack) scales **1 → 1.3** over 3 s starting at t=9, so the images push in cinematically as they reveal.

### E — Nav drop-in
```js
gsap.to("nav", { y: 0, duration: 1, ease: "power3.out", delay: 11 });
```
Nav slides down from `y:-150` to `y:0` over 1 s at t=11.

### F — Headline rise (letter by letter)
```js
gsap.to("h1 span", { top: "0px", stagger: 0.1, duration: 1, ease: "power3.out", delay: 11 });
```
Each character span animates its CSS `top` from **400px → 0px**, `power3.out`, 1 s, **stagger 0.1 s**, delay **11**. Since `<h1>` has a rectangular `clip-path` mask, the letters emerge from below and rise into the box one after another (`Marlow` → 6 chars, last starts at t≈11.5).

### Approximate timeline (seconds from load)
| t | event |
|---|-------|
| 0 | nav parked at y:-150; reels read `000%`; photos are right-edge slivers |
| 1 | units reel (A, dur 5) + tens reel (A, dur 6) start rolling |
| 5 | hundreds reel (A, dur 2) starts its `0→1` flip |
| ~6 | units reel settles on `0` |
| ~7 | tens + hundreds settle → `100%`; progress bar starts `0→30%` (B) |
| 8.5 | progress bar `30→100%` + fade-out begins (B) |
| 9 | photos begin staggered clip-path reveal (C); hero starts `scale→1.3` (D) |
| ~10.5 | progress bar done → `.pre-loader` hidden; last photo reveal fires |
| 11 | nav drops in (E); headline letters begin rising (F) |
| ~12.5 | headline fully risen; hero settled |

## Assets / images
**7 full-bleed editorial portrait photographs**, cover-cropped (`object-fit: cover`, so aspect ratio is flexible — shot roughly portrait ~2:3). They share a **warm, cinematic rust/orange palette**: a red-haired model against burnt-orange velvet furniture and sunlit concrete, styled with black heels, a vintage cream rotary phone, crystal-chandelier light refractions, and rust-toned gowns/blouses. Any cohesive set of 7 warm editorial fashion/portrait frames works — they are only ever seen as the sequential clip-path reveal, so ordering matters more than exact content (a strong final frame = the 7th, which stays on screen). No brand marks.

## Behavior notes
- **Autoplay once** on `DOMContentLoaded`; no scroll, hover, or click. Whole intro ≈ 12.5 s.
- The counter relies on the rendered `clientHeight` of a `.num` (150px), so the `.digit-3` reel must be extended **before** `animate()` runs (same tick is fine).
- Responsive (`@media (max-width:900px)`): `.pre-loader` padding drops to `1em`; `.counter` font-size → `70px`; `.pre-loader p` → `font-size:40px; line-height:64px`; `.offset` nudge → `right:-5px`. The animation logic is unchanged; the headline stays fluid at `20vw`.
- Keep `body { overflow:hidden }` and `.hero-imgs { overflow:hidden }` so the scaling photos and off-screen loader never spill.
- No reduced-motion handling exists in the reference; add one if desired but it is not part of the reference behavior.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/oshane-howard-lp-responsive/img1.jpg
https://motionprompts.dev/c/oshane-howard-lp-responsive/img2.jpg
https://motionprompts.dev/c/oshane-howard-lp-responsive/img3.jpg
https://motionprompts.dev/c/oshane-howard-lp-responsive/img4.jpg
https://motionprompts.dev/c/oshane-howard-lp-responsive/img5.jpg
https://motionprompts.dev/c/oshane-howard-lp-responsive/img6.jpg
… 1 more under https://motionprompts.dev/c/oshane-howard-lp-responsive/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--espresso`, `--cream`, `--amber`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script gated behind `DOMContentLoaded` that resolves the three digit reels with `document.querySelector`, grows `.digit-3` by hand with a nested `appendChild` loop, rewrites `.header h1`'s markup into per-character spans, and then fires ten independent `gsap.to`/`gsap.set` calls — there is no timeline, each is scheduled by its own `delay` — that never have to undo themselves because the page they intro into never unmounts. React withdraws that guarantee, and it does it quietly: the odometer looks right on first load and the damage only shows up on the next mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen, and it does so on the **same committed DOM** — there is no re-render between the two passes. A naive port that skips teardown keeps both passes' output live at once: two `gsap.set`/`gsap.to` calls now drive the same `nav`, `.progress-bar`, `.hero-imgs > img` and `.hero` nodes, and the `.digit-3` extension loop runs twice against the same live element, appending 21 more `.num` divs on top of the 21 the first pass already added — 52 children instead of the intended 31, permanently, since nothing ever prunes it back down. `animate()`'s `totalDistance` is derived straight from that child count, so the reel that is supposed to land on the final `0` at `y: -4500` instead computes a distance built from whichever child count happened to be current when it ran, and the counter no longer settles on a readable `100%`. None of this reproduces in a production build, because React only double-invokes in development — the cleanup below is not optional polish.

*(1) The entry point* — this script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener — and everything inside it, from `gsap.set("nav", …)` through the headline-rise tween on `h1 span` — never runs. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its entire body into a `useEffect` with an empty dependency array, unchanged: the `digit1`/`digit2`/`digit3` lookups, `splitTextIntoSpans`, the reel-extension loop, the three `animate()` calls and the five remaining `gsap.to` calls all belong inside that one effect.

*(2) Element lookups* — three lookups here are plain `document.querySelector` calls that `gsap.context`'s automatic selector-scoping never touches: `digit1`, `digit2`, `digit3` (`".digit-1"`, `".digit-2"`, `".digit-3"`), and, inside `splitTextIntoSpans`, the `document.querySelector(selector)` that resolves `.header h1`. Rewrite `splitTextIntoSpans` to take the search root as an argument instead of always querying `document`, and resolve the three digit reels off that same root. The remaining targets — `"nav"`, `".progress-bar"` (twice), `".hero-imgs > img"`, `".hero"`, `"h1 span"` — are passed as selector strings straight into `gsap.to`/`gsap.set`, so wrapping the effect in `gsap.context` scoped to a root ref resolves all of them automatically — but only if that ref actually contains every one of them. It has to be deliberate here: the markup is two top-level siblings, `<section class="hero">` (which holds the pre-loader digits and `.hero-imgs`) and `<div class="website-content">` (which holds `nav` and `.header h1`), not one nested inside the other. Put the ref on a wrapper around both. A ref scoped to `.hero` alone would resolve `"nav"` and `"h1 span"` to empty selector lists, and the two tweens that target them would become silent no-ops — the nav would never drop and the headline would never rise, with nothing in the console to point at why.

*(3) Cleanup* — wrap the whole body in one `gsap.context` scoped to that shared root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // digit lookups, splitTextIntoSpans, the reel-extension loop, animate() x3,
    // and the five remaining gsap.to calls, exactly as described above
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` correctly kills every tween this component creates — including the ones still sitting in their `delay` window — and undoes the inline styles they wrote: the three reels' `y`, `nav`'s `y` (both the initial `gsap.set` park and the later drop-in), `.progress-bar`'s `width`/`opacity`, each hero image's `clip-path`, `.hero`'s `scale`, and each headline span's `top`. That part of the StrictMode remount is a non-issue once this is in place.

What it does not reach is the DOM surgery this component does outside of GSAP, and the two pieces need different treatment. The `.digit-3` extension is not safe to leave alone: it is a plain `appendChild` loop, so `ctx.revert()` has nothing to undo there, and the second effect invocation runs it again against the same 31-node `.digit-3` the first invocation already built, appending another 21 and leaving 52. `animate(digit3, …)`'s `totalDistance` is computed from `digit.querySelectorAll(".num").length` at the moment it runs — inside the correctly-scoped context, only the second invocation's tween survives the revert, and that tween is the one built from the corrupted count, so the units reel overshoots the resting frame the reference design assumes. The fix is to stop growing `.digit-3` at effect time at all: the 21 appended nodes are fully deterministic — two `0`–`9` runs plus one trailing `0` — so render all 31 `.num` divs for `.digit-3` directly in JSX and delete the loop; `animate()` then reads a `clientHeight`/count pair that can never drift. The header split, by contrast, is safe to leave un-reverted as written: `splitTextIntoSpans` rebuilds its output from `element.innerText` on every call, and `innerText` reads back through the spans to the same plain characters, so a second, unguarded run replaces `.header h1`'s markup with an equivalent set of spans rather than nesting a split inside a split.
