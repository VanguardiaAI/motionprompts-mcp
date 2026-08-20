# Studio Navbar — Scroll-Expanding 16:9 Window with Flip Logo Fly

## Goal
Build a fixed, centered **16:9 "navbar window"** — a cream panel carrying two pairs of nav links and an oversized studio logo — floating over a **full-viewport fixed cinematic backdrop image**. The star effect: as you scroll the first viewport height, the cream window **expands from ~50% width up to fullscreen** (scrubbed frame-by-frame via `ScrollTrigger.onUpdate` + `gsap.utils.interpolate`), the nav links hold their pixel width near the corners instead of spreading, and simultaneously a **paused GSAP Flip animation flies the big bottom-centered logo up to a small pinned position at the very top**, shrinking it as it goes. Once the window has filled the screen, further scrolling reveals a plain hero heading and an about section. Smooth scroll via Lenis. Desktop-only for the expand effect; mobile gets a static full-screen fallback.

## Tech
Vanilla HTML/CSS/JS with ES module imports, fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugins **`ScrollTrigger`** and **`Flip`**.
- **`lenis`** — smooth scroll.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/all";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, Flip);
```

Everything runs from `document.addEventListener("DOMContentLoaded", …)`.

## Layout / HTML
Two fixed navbar layers (backdrop + items) plus two normal-flow sections. All class names are load-bearing — the JS and CSS query them.

```html
<!-- fixed backdrop: full-viewport image + centered cream panel -->
<div class="navbar-backdrop">
  <div class="navbar-img">
    <img src="/path/to/backdrop.jpg" alt="" />
  </div>
  <div class="navbar-background"></div>
</div>

<!-- fixed 16:9 window content: two link groups + oversized logo -->
<div class="navbar-items">
  <div class="navbar-links">
    <a href="#">Index</a>
    <a href="#">Studio</a>
  </div>
  <div class="navbar-links">
    <a href="#">Archive</a>
    <a href="#">Connect</a>
  </div>

  <div class="navbar-logo">
    <a href="#"><img src="/path/to/logo.svg" alt="" /></a>
  </div>
</div>

<section class="hero">
  <h1>Designing movement beyond fixed frames and rigid form</h1>
</section>

<section class="about">
  <h1>The frame dissolves, but the movement continues forward</h1>
</section>

<script type="module" src="./script.js"></script>
```

Notes:
- Exactly **two** `.navbar-links` groups (each holds two `<a>`). Group 1 = `Index` / `Studio`, group 2 = `Archive` / `Connect`.
- `.navbar-logo` is a **single oversized element pinned to the bottom** of the navbar window in the markup; the JS re-pins it to the top and shrinks it via Flip. There is no brand — treat the logo as a neutral studio wordmark (see Assets).
- Keep the hero/about headings verbatim (neutral editorial copy, no client names).

## Styling
Fonts (Google Fonts): **Barlow Condensed** (headings) and **Host Grotesk** (nav links).
```css
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Host+Grotesk:ital,wght@0,300..800;1,300..800&display=swap");
```

Palette (CSS variables — only two tokens):
```css
--base-100: #f9f4eb;  /* warm cream — page bg, the navbar panel, link/heading text color base */
--base-200: #141414;  /* near-black — text color (links + headings) */
```

Reset & globals:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { background-color: var(--base-100); color: var(--base-200); }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1 { text-transform:uppercase; font-family:"Barlow Condensed",sans-serif; font-size:clamp(3rem, 5vw, 7rem); font-weight:900; line-height:0.8; }`
- `a { text-decoration:none; color:var(--base-200); font-family:"Host Grotesk"; font-size:1.125rem; font-weight:450; line-height:0.9; }`

The fixed backdrop layers:
- `.navbar-backdrop, .navbar-img { position:fixed; top:0; left:0; width:100%; height:100svh; pointer-events:none; overflow:hidden; }` — `.navbar-img` holds the full-viewport backdrop image.

The centered 16:9 window — **two co-located, identically-sized layers** (`.navbar-background` behind, `.navbar-items` in front):
```css
.navbar-background,
.navbar-items {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  min-width: 720px;      /* window never narrower than 720px */
  aspect-ratio: 16 / 9;  /* height derived from width */
  will-change: width, height;
}
.navbar-background { background-color: var(--base-100); pointer-events:none; z-index:0; } /* the opaque cream panel */
.navbar-items     { display:flex; justify-content:space-between; align-items:flex-start; z-index:2; } /* link groups sit along the top edge */
```

Stacking (paint order matters): `.navbar-background` `z-index:0` (paints over the fixed image), `section` `z-index:1`, `.navbar-items` + `.navbar-logo` `z-index:2` (top). So on load you see: full-viewport image, a centered opaque cream 16:9 card over it, nav links along the card's top and a huge logo along its bottom.

Nav link groups:
```css
.navbar-links { position:relative; width:50%; display:flex; justify-content:space-between; }
.navbar-links:nth-child(1) { padding: 2.5rem 5rem 0 2.5rem; }  /* left group */
.navbar-links:nth-child(2) { padding: 2.5rem 2.5rem 0 5rem; }  /* right group */
```

The logo (default = bottom of the window, full width; pinned = top, tiny):
```css
.navbar-logo {
  position:absolute; bottom:0; left:50%; transform:translateX(-50%);
  width:100%; padding:2.5rem; pointer-events:all; z-index:2;
}
.navbar-logo.navbar-logo-pinned { bottom:unset; top:-0.25rem; } /* JS toggles this class */
.navbar-logo img { object-fit:contain; }
```

Sections:
```css
section { position:relative; width:100%; display:flex; justify-content:center; align-items:center;
          text-align:center; overflow:hidden; z-index:1; }
.hero  { padding:2.5rem 0; margin-top:200svh; } /* 2-viewport scroll runway ABOVE the hero */
.about { height:100svh; }
.hero h1, .about h1 { width:50%; }
```
The **`margin-top:200svh` on `.hero` is the scroll runway** that lets you scroll while the fixed navbar animates; keep it.

## GSAP effect (be exhaustive)

Three coupled pieces: (A) Lenis↔GSAP wiring, (B) a **paused Flip animation** of the logo, (C) a **single `ScrollTrigger` whose `onUpdate` manually drives** the window expansion, link counter-sizing, and the Flip's progress. There is **no timeline** — the whole thing is `ScrollTrigger.create({ onUpdate })` plus `gsap.utils.interpolate`.

### (A) Smooth scroll wiring
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### The init function (`initNavbarAnimations`)
Grab the elements:
```js
const navbarBg    = document.querySelector(".navbar-background");
const navbarItems = document.querySelector(".navbar-items");
const navbarLinks = document.querySelectorAll(".navbar-links");   // 2 groups
const navbarLogo  = document.querySelector(".navbar-logo");
```

**Mobile fallback (`window.innerWidth < 720`)** — no scroll effect, just snap to fullscreen:
```js
navbarLogo.classList.add("navbar-logo-pinned");
gsap.set(navbarLogo, { width: 250 });
gsap.set([navbarBg, navbarItems], { width: "100%", height: "100vh" });
return;
```

**Desktop (`window.innerWidth >= 720`)** — measure, set up Flip, create the ScrollTrigger:

1. **Measure initial geometry** (the small 16:9 window and each link's rendered width):
```js
const viewportWidth  = window.innerWidth;
const viewportHeight = window.innerHeight;
const initialWidth   = navbarBg.offsetWidth;   // ~50% vw (>=720px)
const initialHeight  = navbarBg.offsetHeight;  // 16:9 of that
const initialLinksWidths = Array.from(navbarLinks).map((link) => link.offsetWidth);
```

2. **(B) Build the paused Flip** for the logo — capture its current (bottom, full-width) layout, re-pin it to the top and shrink it to 250px, then create a **paused** Flip that will smoothly interpolate between the two layouts:
```js
const state = Flip.getState(navbarLogo);          // record bottom/full-width position
navbarLogo.classList.add("navbar-logo-pinned");   // new layout: top:-0.25rem
gsap.set(navbarLogo, { width: 250 });             // new layout: 250px wide
const flip = Flip.from(state, { duration: 1, ease: "none", paused: true });
```
So the logo's target end-state is baked in immediately (top, 250px), and `flip.progress(p)` scrubs it back-and-forth between the recorded bottom/full-width start and this top/250px end. `ease:"none"` → linear, so it tracks scroll exactly.

3. **(C) The single scrubbed `ScrollTrigger`** — no tween/timeline, all work happens in `onUpdate`:
```js
ScrollTrigger.create({
  trigger: ".navbar-backdrop",
  start: "top top",
  end: `+=${viewportHeight}px`,   // the effect completes over exactly one viewport height
  scrub: 1,                        // 1s smoothing between scroll position and progress
  onUpdate: (self) => {
    const p = self.progress;       // 0 → 1

    // window expands: small 16:9 → full viewport
    gsap.set([navbarBg, navbarItems], {
      width:  gsap.utils.interpolate(initialWidth,  viewportWidth,  p),
      height: gsap.utils.interpolate(initialHeight, viewportHeight, p),
    });

    // links counter-size: interpolate CURRENT width → the small initial width,
    // so they stay a fixed pixel size near the corners instead of spreading with the growing window
    navbarLinks.forEach((link, i) => {
      gsap.set(link, {
        width: gsap.utils.interpolate(link.offsetWidth, initialLinksWidths[i], p),
      });
    });

    flip.progress(p);              // scrub the logo fly-up in lockstep
  },
});
```

Behavior of each animated quantity across `p` 0 → 1:
- **`.navbar-background` + `.navbar-items` `width`/`height`**: interpolate from `initialWidth/Height` (the ~50%-vw 16:9 card) to full `viewportWidth`/`viewportHeight`. The cream panel grows outward from center (it stays `translate(-50%,-50%)` centered) until it fills the screen and hides the backdrop image. `aspect-ratio` is overridden by the explicit width+height here.
- **Each `.navbar-links` `width`**: interpolate from the link's *current* `offsetWidth` (re-read every frame) toward its *initial* small `offsetWidth`. Net effect: as the flex container grows, this holds the link groups to roughly their original pixel width so they park near the left/right edges rather than stretching apart.
- **`flip.progress(p)`**: drives the Flip so the logo travels from **bottom-center, full window-width** to **top (`top:-0.25rem`), 250px wide, still horizontally centered**, shrinking as it rises. The inner `<img>` is `object-fit:contain`, so the wordmark scales down cleanly.

All three are locked to the same `p`, so scrolling down plays them forward together and scrolling up reverses them. `scrub:1` adds a 1-second inertial catch-up.

### Resize handling (rebuild on resize, debounced)
On `window` `resize`, debounce 250ms, then: kill every ScrollTrigger, `gsap.set([...all navbar els], { clearProps: "all" })`, remove `navbar-logo-pinned`, and call `initNavbarAnimations()` again so all measurements (and the desktop/mobile branch) recompute.
```js
let timer;
window.addEventListener("resize", () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    ScrollTrigger.getAll().forEach((t) => t.kill());
    gsap.set([navbarBg, navbarItems, navbarLogo, ...navbarLinks], { clearProps: "all" });
    navbarLogo.classList.remove("navbar-logo-pinned");
    initNavbarAnimations();
  }, 250);
});
```

**No SplitText, no CustomEase, no manual lerp/rAF loop (Lenis owns the rAF), no Three.js.** The only easing is Flip's linear `ease:"none"`; everything else is direct `interpolate`.

## Assets / images
- **1 full-viewport fixed backdrop image**, `object-fit:cover`, filling the whole `100svh` viewport (landscape ~2:1, e.g. 1440×720). A moody, cinematic, stylized city scene reads best — here a rain-slicked tree-lined avenue at night viewed head-on down its vanishing-point center: wet cobblestone road reflecting light, rounded futuristic cars with glowing headlight rings driving toward the camera, glowing streetlamps and neon-lit storefronts along both sides, scattered silhouetted pedestrians, and a hazy skyline of towers in the distance. Dominated by saturated neon purple/magenta and pink tones with warm amber lamp glints against dark shadows. It sits behind and around the cream window and is progressively covered as the window expands. No brands or logos in it.
- **1 wordmark logo, SVG**, dark near-black (`#141414`-ish) on transparency, a **wide horizontal single-word wordmark** (~6.9:1 aspect, e.g. 4938×716 viewBox), rendered `object-fit:contain`. Use a neutral fictional studio name — do not use any real client brand.

## Behavior notes
- **Desktop-only expand effect.** Below `720px` viewport width the JS snaps the window to fullscreen and pins the logo immediately (no ScrollTrigger). At `max-width:720px` the CSS also reflows: window `min-width:100%`, link groups stack vertically and right-aligned, logo left-anchored, and `.hero` drops its `margin-top` to `0` with `height:100svh`; hero/about `h1` go full width with padding.
- **Heights use `svh`** (`100svh`, `margin-top:200svh`) so mobile browser chrome doesn't break the layout.
- The effect is **fully scroll-scrubbed** (`scrub:1`) over one viewport height; parking the scroll freezes it mid-expand, scrolling back up reverses it.
- Keep `will-change:width,height` on the window layers and `pointer-events:none` on the backdrop / cream panel so only the links and logo are interactive.
- No reduced-motion guard in the original.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/nakedcityfilms-scroll-animation/logo.svg
https://motionprompts.dev/c/nakedcityfilms-scroll-animation/navbar-img.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--base-100`, `--base-200`, `--paper-dim`, `--amber`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. Setup that runs twice with teardown that runs never leaves you two of
everything: two `Lenis` instances both listening to the wheel, two `ScrollTrigger`s scrubbing the
same `.navbar-backdrop`, two paused `Flip` tweens fighting over the same logo. The visible symptom
is jitter or a doubled fly-up speed on the logo, and it will not reproduce in a production build,
because React only does the double mount in development. Treat the cleanup as part of the effect,
not as an afterthought.

*(1) The entry point.* The smooth-scroll wiring (`new Lenis(...)`, the `gsap.ticker.add` callback,
`lagSmoothing`) and the call to `initNavbarAnimations()` sit at two different moments in the
original file: the Lenis block runs at module top level, before `DOMContentLoaded` even has a
chance to fire, while `initNavbarAnimations()` waits for that event through an unguarded
`document.addEventListener("DOMContentLoaded", …)`. By the time a React component mounts,
`DOMContentLoaded` has already fired — the listener is never called and the navbar window never
animates, no error, nothing to debug. In React both halves collapse into one `useEffect` with an
empty dependency array: delete the listener, and treat the Lenis setup and
`initNavbarAnimations()` as two statements at the top of the same effect body, not as two
separately-gated pieces.

*(2) Element lookups.* `initNavbarAnimations()` re-derives `navbarBg`, `navbarItems`,
`navbarLinks` and `navbarLogo` from `document.querySelector`/`querySelectorAll` twice — once on
the initial call, once more inside the resize handler's rebuild. Both call sites assume the
document has exactly one `.navbar-background`, `.navbar-items` and `.navbar-logo`. Give the
component a root ref on the element wrapping `.navbar-backdrop` and `.navbar-items`, and scope all
four lookups — both copies — to it.

*(3) Cleanup — GSAP, Flip and the resize rebuild.* Wrap the init in a `gsap.context` scoped to the
root ref, but register `initNavbarAnimations` as a *named* method with `self.add` instead of
calling it inline, because the resize handler has to invoke it again later, and any `ScrollTrigger`
or `Flip` tween created outside the context's synchronous pass — or outside a `self.add` call — is
invisible to `ctx.revert()`:

```jsx
useEffect(() => {
  const lenis = new Lenis({ syncTouch: true });
  const driveLenis = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(driveLenis);
  gsap.ticker.lagSmoothing(0);
  lenis.on("scroll", ScrollTrigger.update);

  let trigger;
  const ctx = gsap.context((self) => {
    self.add("initNavbar", () => {
      const navbarLogo = rootRef.current.querySelector(".navbar-logo");
      // ...mobile branch, Flip.getState / Flip.from exactly as above, then:
      trigger?.kill();
      trigger = ScrollTrigger.create({ trigger: ".navbar-backdrop", /* onUpdate as above */ });
    });
    self.initNavbar(); // NOT ctx.initNavbar() here — see the GSAP variant note above
  }, rootRef);

  let timer;
  const onResize = () => {
    clearTimeout(timer);
    timer = setTimeout(() => ctx.initNavbar(), 250); // outside the factory, ctx is safe to use
  };
  window.addEventListener("resize", onResize);

  return () => {
    clearTimeout(timer);
    window.removeEventListener("resize", onResize);
    ctx.revert();
    rootRef.current?.querySelector(".navbar-logo")?.classList.remove("navbar-logo-pinned");
    gsap.ticker.remove(driveLenis);
    lenis.destroy();
  };
}, []);
```

Three things in that shape are specific to this component, not generic GSAP advice:

- **The original resize handler kills every `ScrollTrigger` on the page**
  (`ScrollTrigger.getAll().forEach((t) => t.kill())`) before rebuilding. That is safe on a
  standalone document with one animated thing on it; inside a larger React app it kills every
  other mounted component's triggers too — this catalogue already records that exact collision for
  this slug, against `kaitonote-3d-gallery-showcase-scroll-animation` and
  `madeinuxstudio-page-transition`, both of which perform the same global kill. Keep the local
  `trigger` reference and kill only that one, both on resize and (implicitly, via `ctx.revert()`)
  on unmount.
- **`ctx.revert()` does not undo `navbarLogo.classList.add("navbar-logo-pinned")`.** That's a
  manual DOM mutation, not a GSAP-authored style, so the context never records it. Left in place
  across a StrictMode remount, the second `initNavbarAnimations()` call runs
  `Flip.getState(navbarLogo)` against an element that is *already* in the pinned, shrunk layout
  from the first pass, so `Flip.from` animates from the wrong starting frame instead of from the
  true bottom-center, full-width position. The vanilla resize handler already strips this class
  before rebuilding for exactly this reason; the unmount cleanup needs the same line, and it is the
  one manual DOM undo this component needs beyond `ctx.revert()` — the width/height sets on
  `navbarBg`, `navbarItems` and the links are all `gsap.set` calls the context already tracks.
- **`gsap.ticker.add(driveLenis)` is what actually drives Lenis's `raf` here** — this component has
  no separate `requestAnimationFrame` loop to cancel, only this ticker subscription — and the
  context still doesn't track it. Keep the `driveLenis` reference and pair it with
  `gsap.ticker.remove` in cleanup, or the ticker keeps calling `lenis.raf` on a `Lenis` instance
  that `destroy()` already tore down.

If this navbar is one section mounted inside a larger app rather than the whole page, lift the
`Lenis` instance (and the `gsap.ticker.add` wiring) to the app shell instead of creating it here —
the source file assumes it owns the only Lenis instance on the page, and a second instance fights
the first over the same scroll.
