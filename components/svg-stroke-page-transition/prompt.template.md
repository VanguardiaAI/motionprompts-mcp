---
slug: svg-stroke-page-transition
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 8
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"power1.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# SVG Stroke Page Transition — Two Self-Drawing Squiggle Strokes That Swell to Wipe the Screen

## Goal
Build a tiny multi-page site (three full-screen hero "pages": **Home / About / Contact**) with a fixed top navbar. The star effect is the **page transition**: clicking a nav link runs a two-phase GSAP sequence over two full-screen, winding inline-SVG paths. **Leave phase** — both squiggly strokes *draw themselves in* (classic `strokeDasharray`/`strokeDashoffset` line-draw) while their `stroke-width` **swells from 200 to 700**, so the two fattening ribbons cover the entire viewport and wipe out the old page. Then the visible page is swapped underneath. **Enter phase** — the strokes *keep drawing out* the same direction (dashoffset continues past zero into negative) while the `stroke-width` **thins back from 700 to 200**, uncovering the new page. It is entirely click-driven — no scroll, no autoplay. A small hand-rolled "fake router" toggles which hero is visible (this stands in for a framework router like next-transition-router).

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) only. **No GSAP plugins, no ScrollTrigger, no Lenis, no SplitText.**

```js
import gsap from "gsap";
```
No `gsap.registerPlugin(...)` — nothing to register.

## Layout / HTML
A `<nav>`, one fixed full-screen `.transition-svg` overlay holding the two paths, and three `.hero.page` sections (only the active one is displayed). Class names and `data-route` attributes are load-bearing (the JS queries them).

```html
<nav class="navbar">
  <div class="navbar-logo">
    <div class="navbar-item">
      <a href="/" data-route="/">Motionprompts</a>
    </div>
  </div>
  <div class="navbar-items">
    <div class="navbar-item"><a href="/" data-route="/">Home</a></div>
    <div class="navbar-item"><a href="/about" data-route="/about">About</a></div>
    <div class="navbar-item"><a href="/contact" data-route="/contact">Contact</a></div>
  </div>
</nav>

<div class="transition-svg">
  <svg viewBox="0 0 2453 2535" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <path
      d="M227.549 1818.76C227.549 1818.76 406.016 2207.75 569.049 2130.26C843.431 1999.85 -264.104 1002.3 227.549 876.262C552.918 792.849 773.647 2456.11 1342.05 2130.26C1885.43 1818.76 14.9644 455.772 760.548 137.262C1342.05 -111.152 1663.5 2266.35 2209.55 1972.76C2755.6 1679.18 1536.63 384.467 1826.55 137.262C2013.5 -22.1463 2209.55 381.262 2209.55 381.262"
      stroke="var(--transition-stroke-1)" stroke-width="200" stroke-linecap="round" />
    <path
      d="M1661.28 2255.51C1661.28 2255.51 2311.09 1960.37 2111.78 1817.01C1944.47 1696.67 718.456 2870.17 499.781 2255.51C308.969 1719.17 2457.51 1613.83 2111.78 963.512C1766.05 313.198 427.949 2195.17 132.281 1455.51C-155.219 736.292 2014.78 891.514 1708.78 252.012C1437.81 -314.29 369.471 909.169 132.281 566.512C18.1772 401.672 244.781 193.012 244.781 193.012"
      stroke="var(--transition-stroke-2)" stroke-width="200" stroke-linecap="round" />
  </svg>
</div>

<section class="hero page active" data-route="/"><h1>Home</h1></section>
<section class="hero page" data-route="/about"><h1>About</h1></section>
<section class="hero page" data-route="/contact"><h1>Contact</h1></section>

<script type="module" src="./script.js"></script>
```

Notes on structure:
- Keep both `<path>` `d` strings **exactly** as above — this precise, chaotic, screen-spanning squiggle geometry (in the `2453 × 2535` viewBox) is what makes the two thick strokes blanket the viewport when they fatten. `preserveAspectRatio="none"` lets the SVG stretch to the container's aspect ratio (so the strokes fill any window shape). `stroke-width="200"` and `stroke-linecap="round"` are the resting values.
- Path 1 is the light-grey stroke, path 2 is the magenta stroke (colors below). Order matters: magenta is painted **on top** of grey.
- Exactly **three** `.hero.page` sections, each with a unique `data-route` (`/`, `/about`, `/contact`) and an `<h1>`. Only the first (`/`) starts with the `active` class.
- Labels are neutral demo text (Home / About / Contact, logo "Motionprompts") — no real brands.

## Styling
Fonts (Google Fonts): **Barlow Condensed** (weights 100–900, used for the huge hero headings) and **DM Sans** (variable optical-size + weight, used for the nav links).
```html
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@100;200;300;400;500;600;700;800;900&family=DM+Sans:opsz,wght@9..40,100..1000&display=swap" rel="stylesheet" />
```

Palette (CSS variables — exact hex):
```css
:root {
  --bg: #f0f2ef;                    /* off-white — hero page background */
  --fg: #171717;                    /* near-black — text */
  --transition-stroke-1: #d8d9d7;   /* light warm grey — path 1 */
  --transition-stroke-2: #ff44fe;   /* electric magenta/pink — path 2 (the loud one) */
  --font-barlow-condensed: "Barlow Condensed", sans-serif;
  --font-dm-sans: "DM Sans", sans-serif;
}
```

Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`.

Load-bearing CSS:
- `.navbar`: `position:fixed; width:100%; padding:1rem;` flex `justify-content:space-between; align-items:center;` `z-index:2;` (sits above the heroes, **below** the transition overlay).
- `.navbar-items`: `display:flex; gap:clamp(1rem,4vw,2rem);`. `.navbar-item`: `padding:1rem;`.
- `.navbar-item a`: `text-decoration:none; color:var(--fg); font-family:var(--font-dm-sans); font-size:1.125rem; font-weight:500; letter-spacing:-2%;`.
- `.hero`: `position:relative; width:100%; height:100svh; background-color:var(--bg); color:var(--fg);` flex `justify-content:center; align-items:center;` `overflow:hidden;`.
- `.hero h1`: `text-transform:uppercase; font-family:var(--font-barlow-condensed); font-size:clamp(5rem,15vw,20rem); font-weight:800; letter-spacing:-2%; line-height:1;` — a single gigantic centered word.
- **Fake-router page visibility:** `.page { display:none; }` and `.page.active { display:flex; }` — only the active hero is in the layout; the JS swaps the `active` class.
- **The transition overlay — critical:**
  ```css
  .transition-svg {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(1.5);  /* over-scaled so the strokes overshoot the edges */
    width: 100%; height: 100%;
    pointer-events: none;                          /* never blocks clicks */
    z-index: 100;                                  /* on top of everything */
  }
  .transition-svg svg { width: 100%; height: 100%; }
  ```
  The `scale(1.5)` blow-up plus `preserveAspectRatio="none"` ensures the fattened strokes fully cover the viewport with no gaps at the corners.
- **Initial hidden dashes (before JS runs):** `.transition-svg path { stroke-dashoffset:99999; stroke-dasharray:99999; }` — a large placeholder dash so nothing paints until the JS measures each path and overwrites these with the real length. Also mirror the stroke colors in CSS as a fallback for the presentation-attribute `var()`: `.transition-svg path:first-of-type { stroke:var(--transition-stroke-1); }` and `.transition-svg path:last-of-type { stroke:var(--transition-stroke-2); }`.

## GSAP effect (the important part — be exhaustive)

### 1. Prime both paths for line-drawing
On load, grab the SVG, collect its two paths, and for **each** path measure its length and set `strokeDasharray === strokeDashoffset === length` so the whole squiggle starts fully hidden ("off the end"):
```js
const svg = document.querySelector(".transition-svg svg");
const paths = Array.from(svg.querySelectorAll("path"));

paths.forEach((path) => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;   // one dash the full length, pushed entirely off → invisible
});
```

### 2. The `leave` phase — draw the strokes in + swell them to wipe the screen
A **timeline** whose `onComplete` fires the caller's `next` callback. For **each** path, a `.to()` is inserted at **position `0`** (so both paths animate in parallel, no stagger):
```js
function leave(next) {
  const tween = gsap.timeline({ onComplete: next });
  paths.forEach((path) => {
    tween.to(path, {
      strokeDashoffset: 0,             // length → 0: the squiggle draws itself on start→end
      attr: { "stroke-width": 700 },   // animate the SVG ATTRIBUTE 200 → 700: strokes fatten to cover the screen
      duration: 1,
      ease: "power1.inOut",
    }, 0);
  });
  return tween;
}
```
- Both properties tween together over `duration: 1` on `ease: "power1.inOut"`.
- `strokeDashoffset: length → 0` slides the single full-length dash into view, drawing the line progressively.
- `attr: { "stroke-width": 700 }` animates the SVG **presentation attribute** (not the CSS prop) from its resting `200` up to `700`. At `700`, combined with the over-scaled container and the winding geometry, the two ribbons blanket the entire viewport → the old page is fully wiped.
- No `delay`, no `stagger`. The two per-path tweens both live at label `0`, so they are simultaneous. Timeline span = `1s`.

### 3. The `enter` phase — keep drawing out + thin the strokes to reveal
Symmetric timeline, again per-path at position `0`, `onComplete` → `next`:
```js
function enter(next) {
  const tween = gsap.timeline({ onComplete: next });
  paths.forEach((path) => {
    const length = path.getTotalLength();
    tween.to(path, {
      strokeDashoffset: -length,       // 0 → -length: dash continues the SAME direction, un-drawing off the end
      attr: { "stroke-width": 200 },   // 700 → 200: strokes thin back down, uncovering the new page
      duration: 1,
      ease: "power1.inOut",
      onComplete: () => {
        gsap.set(path, { strokeDashoffset: length });  // reset to the hidden +length start for the next transition
      },
    }, 0);
  });
  return tween;
}
```
- `strokeDashoffset: 0 → -length` pushes the dash past the far end, so the drawn line slides off in the same drawing direction (it does **not** rewind) — the stroke "keeps going" as it disappears.
- `attr: { "stroke-width": 200 }` animates the width back down from `700` (where `leave` left it) to the resting `200`, revealing the freshly-swapped page underneath.
- Same `duration: 1`, `ease: "power1.inOut"`, parallel (position `0`), no stagger/delay.
- **Per-path `onComplete`** does a `gsap.set(path, { strokeDashoffset: length })` — snapping the offset from `-length` back to `+length` (both are the fully-hidden state) so the next `leave` starts clean.

### 4. The fake router (glue — this is what a framework router would do)
```js
const pages = document.querySelectorAll(".page");
let currentRoute = "/";
let isTransitioning = false;

function showPage(route) {
  pages.forEach((page) => page.classList.toggle("active", page.dataset.route === route));
}

function navigate(route) {
  if (isTransitioning || route === currentRoute) return;   // guard: ignore during a transition or a no-op click
  isTransitioning = true;

  leave(() => {                 // 1) strokes draw in + swell → screen fully covered
    showPage(route);            // 2) swap the visible hero UNDER the cover
    currentRoute = route;
    enter(() => {               // 3) strokes draw out + thin → new hero revealed
      isTransitioning = false;  // 4) release the guard
    });
  });
}

document.querySelectorAll(".navbar a").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(link.dataset.route);
  });
});
```
- Sequence per click: **`leave` (1s) → swap page → `enter` (1s)** ≈ a **2s** total transition.
- `isTransitioning` blocks re-entrancy; clicking the current route is a no-op. `showPage` runs **between** the two phases, at the moment the screen is fully covered, so the swap is never visible.

**No ScrollTrigger, no SplitText, no CustomEase, no lerp/rAF loop, no Three.js.** The entire effect is two parallel per-path timeline tweens (`strokeDashoffset` + animated `stroke-width` attr) on `power1.inOut`, phased leave-then-enter.

## Assets / images
**None.** There are no image assets — the whole visual is CSS type + the two inline SVG strokes. Do not add images.

## Behavior notes
- **Trigger:** click on any navbar link only. No scroll, no hover, no autoplay, no loops.
- The transition overlay is `pointer-events:none` and only paints during a transition (strokes hidden at rest), so it never obstructs the page.
- Colors carry the mood: at the wipe peak the screen is filled by the electric-magenta `#ff44fe` stroke over the light-grey `#d8d9d7` stroke — a loud flash between two calm off-white heroes.
- No reduced-motion guard and no responsive media queries in the original; the hero type and nav gap already scale via `clamp()`. `100svh` heroes.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--fg`, `--muted`, `--line`, `--magenta`, `--transition-stroke-1`, `--transition-stroke-2`, `--font-barlow-condensed`, `--font-dm-sans`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, at import time, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, a click looks like it works, and then it misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component keeps its transition guard and its current route — `isTransitioning`, `currentRoute` — as ordinary variables sitting beside the top-level calls. Port them unchanged and the double-invoke gives you two independent guards watching the same two `<path>` elements: two `click` listeners stacked on the same nav anchor, each willing to start its own `leave` timeline, so one click can fire two overlapping wipes on the same `strokeDashoffset` and `stroke-width` — one racing toward the fattened end while the other is already thinning back toward rest. That will not reproduce in a production build, because React only double-mounts in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — The script runs at the top level, the moment the module is evaluated: it grabs `.transition-svg svg`, measures both `<path>`s to prime `strokeDasharray`/`strokeDashoffset`, defines `leave`/`enter`, and wires the `click` listeners on `.navbar a` — all before your component has rendered anything, so `document.querySelector(".transition-svg svg")` resolves to `null`. Move the entire body into a `useEffect` with an empty dependency array. Do not leave it in the component body: that re-runs on every render, rebuilding `leave`/`enter` and re-attaching every nav listener on state changes that have nothing to do with this transition.

*(2) Element lookups* — `.transition-svg svg`, its two `<path>`s, `.page`, `.navbar a`: all four assume this component owns the document. Give the component a root ref spanning the nav, the overlay and the three hero sections, and resolve every one of those four off it instead of off `document`. During the StrictMode remount two copies of `.transition-svg svg` exist for an instant; an unscoped `querySelector` is not guaranteed to bind to the copy that stays, and `getTotalLength()` measured against the wrong copy primes dash values a `leave` running against the surviving nodes will never use.

*(3) Cleanup* — The animated work here never happens during `gsap.context`'s synchronous factory pass: `leave` and `enter` each build a fresh `gsap.timeline()` only once a nav link is clicked, from inside that `click` handler — well after the factory has already returned and the context has stopped listening for new tweens to adopt. A plain `gsap.timeline()` built later, from a listener, is invisible to `ctx.revert()`; unmount this component mid-swell — the user navigates away from the route hosting it while the strokes are covering the screen — and that timeline keeps running, still writing `stroke-width` and `strokeDashoffset` onto two `<path>` nodes that may already be gone.

Register the route handler itself as a **named** method on the context, so every timeline it produces later — this click's `leave`, and the `enter` chained from its `onComplete` — is built from inside a call the context is actively tracking, not from a bare listener:

```jsx
useEffect(() => {
  const paths = Array.from(rootRef.current.querySelectorAll(".transition-svg path"));
  const pages = rootRef.current.querySelectorAll(".page");
  let currentRoute = "/";
  let isTransitioning = false;

  const ctx = gsap.context((self) => {
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
    });

    self.add("navigate", (route) => {
      if (isTransitioning || route === currentRoute) return;
      isTransitioning = true;
      // leave timeline exactly as above; its onComplete swaps `.page.active`,
      // updates currentRoute, then builds the enter timeline the same way —
      // whose own onComplete clears isTransitioning
    });
  }, rootRef);

  const links = rootRef.current.querySelectorAll(".navbar a");
  const onLinkClick = (e) => {
    e.preventDefault();
    ctx.navigate(e.currentTarget.dataset.route);
  };
  links.forEach((link) => link.addEventListener("click", onLinkClick));

  return () => {
    links.forEach((link) => link.removeEventListener("click", onLinkClick));
    ctx.revert();
  };
}, []);
```

Call `ctx.navigate(route)` from the listener, never `gsap.timeline()` directly. Without the named registration, `ctx.revert()` still runs on unmount, but it has nothing of the in-flight transition to kill — the leak described above happens exactly as if there were no context at all.

`ctx.revert()` covers the two timelines `navigate` produces and the inline `stroke-dashoffset`/`stroke-width` those timelines write — that is the entire animated surface of this component. It does not cover the two `click` listeners on `.navbar a`: plain DOM listeners the context never sees, so remove them with the same function reference `addEventListener` was given, in the same cleanup that calls `ctx.revert()`. It also does not need to touch `currentRoute` or `isTransitioning` — declared as ordinary `let` bindings inside the effect rather than beside the top-level calls the way the source does, each mount gets its own pair for free: a StrictMode remount's second effect run starts with `isTransitioning` false, never inheriting `true` from a transition the first run may have started and the revert then cut short mid-swell.
