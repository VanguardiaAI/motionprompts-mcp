---
slug: hypnotic-gallery-gsap-flip
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 5
structural_literals: 8
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: duration, literal: "0.3", rule: value/narrated }
  - { kind: duration, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Hypnotic Image Gallery — GSAP Flip Layout Morph (3 layouts) + Lenis Scroll List

## Goal
Build a full-viewport image gallery of **14 tiles** that **morphs between three completely different layouts** when you click the numbered nav items (`01` / `02` / `03`). The star effect is **GSAP Flip**: on every switch it records the on-screen state of all 14 tiles, swaps a single layout class on the gallery, then animates every tile smoothly from its old position/size to its new one with a custom **"hop"** ease and a tiny per-tile stagger. Layout `01` is a scattered editorial grid, layout `02` is a small vertical column that becomes a **Lenis-smoothed vertical scroll list** (a framed "minimap" box and a hidden full-size preview column fade in and drift as you scroll), and layout `03` piles all 14 tiles into a single stacked deck in the top-right corner.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`Flip`**, **`CustomEase`**, and **`ScrollToPlugin`**, and **`lenis`** for smooth scroll. Imports:
```js
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Lenis from "lenis";

gsap.registerPlugin(Flip, CustomEase, ScrollToPlugin);
```
Start Lenis immediately with a self-driving rAF loop (do NOT tie it to gsap.ticker here — it runs its own loop):
```js
const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

## Layout / HTML
Class/id names are load-bearing — the JS and the Flip layouts query them.
```
<nav>
  <div class="nav-item"><p>Motionprompts</p></div>
  <div class="nav-item"><p id="layout-1-gallery">01</p></div>
  <div class="nav-item"><p id="layout-2-gallery">02</p></div>
  <div class="nav-item"><p id="layout-3-gallery">03</p></div>
  <div class="nav-item"><p>Menu</p></div>
</nav>

<div class="gallery-container">
  <div class="gallery layout-1-gallery">
    <div class="img" id="img1"><img src="…/img1.jpg" alt="" /></div>
    <div class="img" id="img2"><img src="…/img2.jpg" alt="" /></div>
    …
    <div class="img" id="img14"><img src="…/img14.jpg" alt="" /></div>
  </div>
</div>

<div class="minimap"></div>

<div class="img-previews">
  <img src="…/img1.jpg" alt="" />
  …
  <img src="…/img14.jpg" alt="" />   <!-- all 14, same order -->
</div>
```
- The gallery starts with **both** classes `gallery layout-1-gallery`. There are exactly **14** `.img` tiles, ids `img1`…`img14` in DOM order; each wraps one `<img>`.
- `.minimap` is an **empty** framed box (no content).
- `.img-previews` is a hidden column that repeats **all 14 images at full size** — it is invisible (`opacity:0`) but its tall absolute height is what makes the page scrollable in layout `02` (the scroll handler reads its `scrollHeight`). Keep the same 14 images in the same order.
- Nav labels: keep `Motionprompts`, `01`, `02`, `03`, `Menu` (neutral demo text — no real brand). Only the three numbered `<p>` carry ids and are clickable layout switches.

## Styling
- Font: **"Hanken Grotesk"** (Google Fonts, import with `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap");`); if unavailable, fall back to a clean grotesk `sans-serif`. `html, body { width:100%; height:100%; font-family:"Hanken Grotesk"; }`.
- Global reset `* { margin:0; padding:0; box-sizing:border-box; }`. Colors are default black text on the page's default white background (no explicit palette). `img { width:100%; height:100%; object-fit:cover; }` — every tile is a hard cover-crop of its box.
- `nav`: `position:fixed; top:0; left:0; width:100%; padding:0.75em 2em; display:flex; z-index:2;`. Each `.nav-item { flex:1; }`. `.nav-item p { text-transform:uppercase; font-size:13px; font-weight:500; padding:1em 0.25em; cursor:pointer; }`.
- `.gallery-container`: `width:100%; height:100%; padding-top:4em;`.

**Layout 01 — scattered grid** (`.gallery.layout-1-gallery`): `position:relative; width:100%; height:100%; transform:translateX(0%);`. Tiles are `.gallery.layout-1-gallery .img { position:absolute; width:100px; height:125px; }` and placed by percentage rows (`top`) and columns (`left`/`right`):
- Rows: `top:0%` → img1–img4; `top:25%` → img5–img8; `top:50%` → img9,img10; `top:75%` → img11–img14.
- Columns: `left:2em` → img1,img5,img11; `left:15%` → img2; `left:25%` → img6; `left:45%` → img3,img9; `left:65%` → img4,img10,img12; `left:75%` → img13; `right:15%` → img7; `right:2em` → img8,img14.

**Layout 02 — vertical column** (`.gallery.layout-2-gallery`): `padding-top:0.5em; position:fixed; top:25%; left:10%; transform:translateX(0%);`. Its `.img` are `width:75px; height:100px; margin-bottom:1em;` with **no** absolute positioning, so they stack as a normal vertical column in DOM order.

**Layout 03 — stacked deck** (`.gallery.layout-3-gallery`): `position:relative; width:100%; height:100%; transform:translateX(0%);`. Its `.img` are `position:absolute; top:4em; right:4em; width:300px; height:400px;` — **all 14 share the same corner coordinates**, so they pile into one big overlapping stack in the top-right (later ids on top).

**Minimap** `.minimap`: `position:fixed; top:25%; left:12.5%; transform:translateX(-50%); width:140px; height:90px; border:1px solid #000; border-radius:2px; z-index:2; visibility:hidden; opacity:0;` — a small empty framed rectangle, hidden until layout `02`.

**Preview column** `.img-previews`: `position:absolute; top:25%; left:50%; transform:translateX(-50%); width:30%; opacity:0;`. `.img-previews img { width:600px; height:700px; padding:1em 0; }` — a tall stack of 14 big images, permanently invisible; its job is purely to give the document its scroll height.

Include the Lenis helper CSS (`.lenis.lenis-smooth { scroll-behavior:auto !important; }`, `.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior:contain; }`, `.lenis.lenis-stopped { overflow:hidden; }`, `.lenis.lenis-smooth iframe { pointer-events:none; }`).

## GSAP effect (be exhaustive)

### CustomEase "hop"
Register one custom ease used for every Flip transition:
```js
CustomEase.create("hop", "M0,0 C0.028,0.528 0.129,0.74 0.27,0.852 0.415,0.967 0.499,1 1,1");
```
This is a fast-out / long-settle curve — it rushes ~85% of the way early, then eases into the final position with a gentle tail (the "hypnotic" glide).

### State + refs
```js
const items            = document.querySelectorAll("nav .nav-item p");
const gallery          = document.querySelector(".gallery");
const galleryContainer = document.querySelector(".gallery-container");
const imgPreviews      = document.querySelector(".img-previews");
const minimap          = document.querySelector(".minimap");
let activeLayout = "layout-1-gallery";
```

### Click → switchLayout(newLayout)
Each of the three numbered `<p>` gets a `click` listener; if it has an `id`, call `switchLayout(item.id)`.
```js
function switchLayout(newLayout) {
  if (newLayout === activeLayout) return;
  // Special case: leaving layout 02 while scrolled down → smooth-scroll back to top first
  if (activeLayout === "layout-2-gallery" && window.scrollY > 0) {
    gsap.to(window, {
      scrollTo: { y: 0 },
      duration: 0.5,
      ease: "power3.out",
      onComplete: () => switchLayoutHandler(newLayout),
    });
  } else {
    switchLayoutHandler(newLayout);
  }
}
```
So if you're scrolled inside layout `02` and click `01`/`03`, it first uses **ScrollToPlugin** to glide the window back to `y:0` over **0.5s `power3.out`**, and only then runs the Flip (prevents morphing from a scrolled offset).

### The Flip morph — switchLayoutHandler(newLayout)
This is the core. Capture → swap class → Flip.from:
```js
function switchLayoutHandler(newLayout) {
  const state = Flip.getState(gallery.querySelectorAll(".img"));   // 1. record current rects of all 14 tiles

  gallery.classList.remove(activeLayout);                          // 2. swap the single layout class…
  gallery.classList.add(newLayout);                               //    …tiles jump to their new CSS positions/sizes

  let staggerValue = 0.025;                                        // 3. default per-tile stagger
  if (
    (activeLayout === "layout-1-gallery" && newLayout === "layout-2-gallery") ||
    (activeLayout === "layout-3-gallery" && newLayout === "layout-2-gallery")
  ) {
    staggerValue = 0;                                              //    collapsing INTO the column → no stagger (all at once)
  }

  Flip.from(state, {                                              // 4. animate old rects → new rects
    duration: 1.5,
    ease: "{{motion.ease.primary}}",
    stagger: staggerValue,
  });

  activeLayout = newLayout;
  …
}
```
Exact values:
- **`Flip.from` duration `1.5`s, `ease:"{{motion.ease.primary}}"`.** Flip interpolates each tile's position AND size (100×125 ↔ 75×100 ↔ 300×400) between layouts — tiles slide, scale, and re-pile in one continuous move.
- **`stagger`**: `0.025`s per tile in DOM order for most transitions, giving a rippling cascade; but it's forced to **`0`** (all tiles move simultaneously) specifically when going **01→02** or **03→02**, so collapsing into the vertical column snaps together rather than trailing.

### Layout-02 chrome fade + scroll wiring
Immediately after starting the Flip, toggle the extra UI depending on the target layout:
```js
if (newLayout === "layout-2-gallery") {
  gsap.to([imgPreviews, minimap], { autoAlpha: 1, duration: 0.3, delay: 0.5 });
  window.addEventListener("scroll", handleScroll);
} else {
  gsap.to([imgPreviews, minimap], { autoAlpha: 0, duration: 0.3 });
  window.removeEventListener("scroll", handleScroll);
  gsap.set(gallery, { clearProps: "y" });
  gsap.set(minimap, { clearProps: "y" });
}
// mark the active nav item (class only, no built-in style)
items.forEach((item) => item.classList.toggle("active", item.id === newLayout));
```
- Entering `02`: fade the minimap + preview column in via **`autoAlpha:1`** (opacity + visibility), **duration 0.3s, delay 0.5s** (so they appear as the Flip is settling), and attach the scroll handler.
- Leaving `02` (to `01` or `03`): **`autoAlpha:0`** over 0.3s, detach the scroll handler, and **`clearProps:"y"`** on both `gallery` and `minimap` to wipe any scroll-driven `y` transform so they return to their untranslated home.

### Scroll handler (layout 02 only) — parallax of gallery + minimap
While in layout `02`, `handleScroll` maps page scroll to a `y` translate on the fixed gallery column (so it scrolls even though it's `position:fixed`) and drifts the minimap down slightly:
```js
function handleScroll() {
  if (activeLayout !== "layout-2-gallery") return;

  const imgPreviewsHeight = imgPreviews.scrollHeight;   // tall hidden column = scrollable range
  const galleryHeight     = gallery.scrollHeight;
  const scrollY           = window.scrollY;
  const windowHeight      = window.innerHeight;

  const scrollFraction    = scrollY / (imgPreviewsHeight - windowHeight);
  const galleryTranslateY = -scrollFraction * (galleryHeight - windowHeight) * 1.525;
  const minimapTranslateY =  scrollFraction * (windowHeight - minimap.offsetHeight) * 0.425;

  gsap.to(gallery, { y: galleryTranslateY, ease: "{{motion.ease.primary}}", duration: 0.1 });
  gsap.to(minimap, { y: minimapTranslateY, ease: "{{motion.ease.primary}}", duration: 0.1 });
}
```
- `scrollFraction` is 0→1 across the scrollable range defined by the hidden preview column.
- The gallery column moves **up** proportionally, over-scrolled by the magic factor **`1.525`** so the small 75×100 tiles travel further than the page (fast list feel). The minimap drifts **down** by up to `(windowHeight − 90) × 0.425`.
- Both are `gsap.to` with `ease:"{{motion.ease.primary}}"`, `duration:0.1` — a short smoothing tween each scroll event, riding on top of Lenis's already-smoothed scroll.

### On load
`window` `load` → if `activeLayout === "layout-2-gallery"` call `handleScroll()` once (no-op on the default `01`, but keeps state correct).

## Assets / images
**14 distinct images**, role = *gallery tiles* (`img1`…`img14`), reused verbatim (same files, same order) in the hidden full-size preview column. Because every `<img>` is `object-fit:cover`, any source aspect works, but they render in **portrait-ish boxes** (100×125, 75×100, 300×400), so portrait or square framing crops best. For a cohesive editorial feel, use a **varied set on dark/neutral backgrounds**: e.g. a moody macro photograph, a few abstract 3D renders (glossy forms, stacked discs), several dramatically-lit product still-lifes (a camera, a wristwatch, a VR headset, a portable speaker, a vintage radio), and a couple of interior/architecture detail shots. No brand logos or real client marks. Provide all 14 as separate files.

## Behavior notes
- Entirely **click + scroll driven** — no autoplay, no hover. The three numbered nav items are the only triggers; the Flip plays on each switch.
- The scroll listener is added only while in layout `02` and removed on exit; `clearProps:"y"` resets the parallax so re-entering `01`/`03` starts clean.
- The `.active` class toggled on nav items is a state hook only (no visual style is required unless you want to add one).
- Guard re-entry: `switchLayout` early-returns if the requested layout equals the active one. GSAP naturally overwrites in-flight tweens if the user clicks mid-morph.
- Layout `02`'s scrollability comes entirely from the invisible `.img-previews` column's height — keep it present and full-size even though `opacity:0`.

## Images

This component ships with 14 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/hypnotic-gallery-gsap-flip/img1.jpg
https://motionprompts.dev/c/hypnotic-gallery-gsap-flip/img10.jpg
https://motionprompts.dev/c/hypnotic-gallery-gsap-flip/img11.jpg
https://motionprompts.dev/c/hypnotic-gallery-gsap-flip/img12.jpg
https://motionprompts.dev/c/hypnotic-gallery-gsap-flip/img13.jpg
https://motionprompts.dev/c/hypnotic-gallery-gsap-flip/img14.jpg
… 8 more under https://motionprompts.dev/c/hypnotic-gallery-gsap-flip/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--stone`, `--iris`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body:has(.gallery.layout-3-gallery) .statement`, `body:has(.gallery.layout-1-gallery) .footer-mode span[data-layout="1"], body:has(.gallery.layout-2-gallery) .footer-mode span[data-layout="2"], body:has(.gallery.layout-3-gallery) .footer-mode span[data-layout="3"]`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone module that runs once, reaches into the page with `document.querySelector`, and drives one Lenis instance and a handful of GSAP tweens for the life of the tab — nothing it creates ever expects to be undone. React withdraws that guarantee, and it does so quietly: the gallery keeps flipping between layouts, but underneath it two Lenis instances, two self-scheduling raf loops and two sets of click listeners are now fighting over the same fourteen tiles.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. If the raf loop's handle isn't cancelled on the first pass, the second pass's `new Lenis()` and its own raf loop start alongside the first's, which never stopped — two smooth-scroll instances now both calling `.raf()` against the same wheel input, doubling the damping and making scroll feel sluggish and inconsistent in a way that has nothing to do with the numbers in the setup above. If the click listeners aren't torn down either, one click on `01`/`02`/`03` fires `switchLayoutHandler` twice: the second `Flip.getState()` records rects mid-way through the first call's still-running `Flip.from`, so the tiles jump partway through their move instead of completing the intended fast-out, long-settle glide. None of this reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — Nearly the entire file runs the instant the module is evaluated: `new Lenis()` and the `lenis.stop()` that keeps layout `01` from scrolling, the self-scheduling raf loop, `gsap.registerPlugin(Flip, CustomEase, ScrollToPlugin)`, the `CustomEase.create("hop", …)` registration, every `document.querySelector`/`querySelectorAll`, and the three nav-item click listeners — none of it waits for `DOMContentLoaded` or `load`. Move all of it into a `useEffect` with an empty dependency array. `gsap.registerPlugin` and `CustomEase.create` can stay at module scope, above the component: re-registering either on a second mount is harmless, and the "hop" ease only needs to exist once. The one line that genuinely is gated on an event is the closing `window.addEventListener("load", () => { if (activeLayout === "layout-2-gallery") handleScroll(); })` — and in a React app, which mounts only after its own bundle has finished loading, `document.readyState` is already `"complete"` by the time this effect runs, so `load` has already fired and that listener would never be called. Replace it with an immediate check: if `document.readyState === "complete"`, call `handleScroll()` directly inside the effect; otherwise attach the `load` listener and remove it in the cleanup, so a StrictMode unmount landing before the real event doesn't leave a listener that fires into a component whose `gallery`/`minimap` lookups now resolve to nothing.

*(2) Element lookups* — `document.querySelectorAll("nav .nav-item p")`, `document.querySelector(".gallery")`, `.gallery-container` (captured but never read again — nothing to scope, just stop pulling it off `document`), `.img-previews` and `.minimap` all assume this component owns the page. Give the component a root `ref` around the `<nav>` and the `.gallery-container`, and resolve all of them off it. `gallery.querySelectorAll(".img")` inside `switchLayoutHandler` is already scoped to the `gallery` element itself, so it needs no change beyond `gallery` coming from the ref instead of `document`. This matters specifically because of the Flip mechanic: during the StrictMode remount two `.gallery` elements briefly coexist, and an unscoped `Flip.getState()`/`Flip.from()` pair can measure one copy and animate the other — which shows up as tiles that snap to their new layout with no transition at all, not as an error.

*(3) Cleanup* — Wrap the click listeners in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    const items = rootRef.current.querySelectorAll("nav .nav-item p");
    // gallery, imgPreviews and minimap resolved the same way, off rootRef.current

    items.forEach((item) => {
      item.addEventListener("click", () => {
        if (!item.id) return;
        self.add(() => switchLayout(item.id));
      });
    });
  }, rootRef);

  return () => {
    ctx.revert();
    window.removeEventListener("scroll", handleScroll);
  };
}, []);
```

`ctx.revert()` has almost nothing to undo at mount — no tween exists until the first click — so its real job is catching a Flip or a fade that is still mid-flight when the component unmounts. That only works if every tween this component creates is actually attributed to the context, and none of them are created while the factory above is still synchronously running: `switchLayoutHandler`'s `Flip.from`, the `autoAlpha` fade of `imgPreviews`/`minimap`, and the `gsap.set(…, { clearProps: "y" })` pair all fire from inside a click callback, from the `onComplete` of the scroll-to-top tween in `switchLayout`, or — while layout `02` is active — from every `scroll` event `handleScroll` handles. All of those run after the factory has already returned, so `gsap.context` never attributes them to `ctx` unless each call site wraps its work in the one-argument `self.add(() => { … })`, the way the click listener above wraps `switchLayout`. Do the same at `switchLayout`'s `onComplete` (`onComplete: () => self.add(() => switchLayoutHandler(newLayout))`) and inside `handleScroll`'s body — otherwise a Flip that is still interpolating tile positions, or a parallax tween still writing `y` on the gallery, keeps running against tiles React has already thrown away.

The `scroll` listener needs its own line in the cleanup regardless of any of that: the script only calls `window.removeEventListener("scroll", handleScroll)` when `switchLayoutHandler` leaves layout `02` for `01` or `03`. If the component unmounts *while* layout `02` is still active, that removal never runs, and `handleScroll` keeps firing on every scroll of a page whose gallery is gone — reading `scrollHeight`/`offsetHeight` off elements that are now detached. Remove it unconditionally in the effect's own cleanup, on top of whatever `switchLayoutHandler` already does during normal use.

**Do not promote `activeLayout` to `useState`.** Every read and write to it happens inside `switchLayout`/`switchLayoutHandler`, and nothing in JSX branches on its value — the active layout is expressed entirely by which class sits on the `.gallery` element, toggled directly by `classList`, exactly as the vanilla script does. Flip's technique depends on `Flip.getState()` capturing the *pre*-change rects and the class swap landing synchronously, in the same tick, with no render in between; routing the layout through React state would insert a commit between "record old positions" and "apply new class," and Flip would either animate from stale rects or find nothing changed to animate against. Keep `activeLayout` a plain variable closed over by the effect, the same way it is above.

Smooth scroll and the raf loop that drives it need their own explicit teardown, in an order that matters. Create the one `Lenis` instance inside the effect, keep the exact handle the self-scheduling loop's `requestAnimationFrame` call returns, and in the cleanup cancel that handle before calling `lenis.destroy()` — so no frame already queued calls `.raf()` on an instance that no longer exists:

```jsx
let rafId;
const lenis = new Lenis();
lenis.stop(); // layout 01 must not scroll

function raf(time) {
  lenis.raf(time);
  rafId = requestAnimationFrame(raf);
}
rafId = requestAnimationFrame(raf);

// cleanup:
cancelAnimationFrame(rafId);
lenis.destroy();
```

Keep `lenis.start()`/`lenis.stop()` tied to entering/leaving layout `02` exactly as `switchLayoutHandler` already does — that logic doesn't change. What has to survive the port unchanged is the paired `lenis.resize()` call right after each `start()`/`stop()`: the CSS hides `.img-previews` with `display:none` whenever the gallery isn't in layout `02` (a `body:not(:has(.gallery.layout-2-gallery))` rule), and that column's full height is the only thing giving the document anything to scroll. Lenis measures its scroll range on window resize, not on class changes or `display` toggles, so skipping the manual `resize()` call leaves the smoothed scroll range stale — typically zero — right after switching into layout `02`, and the parallax `handleScroll` drives looks frozen until an unrelated window resize happens to correct it.
