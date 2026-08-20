# Editorial Portfolio Gallery — Fixed Project Number that Sticks at Center then Peels Upward as the Next Section Pushes it Out

## Goal
Build a tall, scroll-driven vertical portfolio. Eight full-viewport project sections scroll past under smooth (Lenis) scrolling. On the left edge of each section a large **two-digit project number** (01–08) sits pinned; when a section reaches the vertical center of the screen its number **switches from absolutely-positioned to `position:fixed` at `top:50vh`** so it hangs at screen-center, and the moment the **next** section climbs into view the number **peels upward out of a fixed-height mask** — the mask, an inner digit-wrapper, and each of the two digit glyphs all translate `y:-80` with **staggered durations and delays** so the number exits in layers. Meanwhile a slim right-edge **progress bar** fills top→bottom, a small **project-name list** on the left has a triangular **indicator that hops down one row per section** while the current name goes black, and a **bottom-right preview thumbnail swaps to whichever gallery image is currently crossing the viewport's vertical center**. The star effect is the layered, velocity-aware masked-number push-up driven entirely from a single per-frame `ScrollTrigger.onUpdate` reading `getBoundingClientRect()`.

## Tech
Vanilla HTML/CSS/JS with ES module imports, fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`ScrollTrigger`** only.
- **`lenis`** — smooth scroll.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```
Wrap the whole script in `document.addEventListener("DOMContentLoaded", () => { … })`. No SplitText, no CustomEase, no canvas/WebGL. The digit-splitting and the image-grid population are done by hand in JS (see below), so the HTML you author does **not** contain the digit spans or the gallery `<img>`s — JS injects them.

## Layout / HTML
Class names are load-bearing (JS/CSS query them). Author the gallery `.images` containers **empty** — JS fills them.

```html
<nav>
  <a href="#">Index</a>
  <a href="#">Watch Showreel</a>
</nav>
<div class="nav-items">
  <a href="#">Work,</a>
  <a href="#">About,</a>
  <a href="#">Contact</a>
</div>

<div class="whitespace w-1"></div>

<div class="gallery">
  <!-- Repeat this .project block 8 times, numbers 01 → 08 -->
  <div class="project">
    <div class="index">
      <div class="mask"><h1>01</h1></div>
    </div>
    <div class="images"></div>   <!-- left empty; JS injects 6 .img each -->
  </div>
  <!-- …02 … 08 … -->
</div>

<div class="whitespace w-2"></div>

<div class="project-names">
  <div class="indicator">
    <div class="symbol"></div>
  </div>
  <div class="name active"><p>Atlas Studio</p></div>
  <div class="name"><p>Nimbus</p></div>
  <div class="name"><p>Solara</p></div>
  <div class="name"><p>Quantum</p></div>
  <div class="name"><p>Echo Labs</p></div>
  <div class="name"><p>Vesper</p></div>
  <div class="name"><p>Axon</p></div>
  <div class="name"><p>Horizon</p></div>
</div>

<div class="preview-img">
  <img src="/img1.jpg" alt="" />
</div>

<div class="progress-bar"></div>

<div class="footer"><p>Portfolio 2024</p></div>

<script type="module" src="./script.js"></script>
```
Notes:
- Exactly **8** `.project` blocks; each `.mask h1` holds a **two-character** number as text (`01`…`08`) — the split logic assumes exactly two glyphs.
- There are **8** `.name` rows matching the 8 projects; the first row carries `.active`. Names are neutral invented studio names (no real brands).
- The `.preview-img`'s initial `<img>` src is the first gallery image; JS will overwrite `.src` on scroll.

## Styling
Fonts: **Inter** (`--sans`) for the small type, **Space Grotesk** (`--display`) for the big numbers and titles.

Palette (P1 Canary) — near-black on bone, with one canary accent that only ever appears as a **surface** (a link's hover fill), never as text:
```css
:root {
  --paper: #f4f4f0;
  --paper-deep: #e8e8e4;
  --ink: #0a0a0a;
  --muted: #5f6368;
  --gray: #8c8c88;
  --line: rgba(10, 10, 10, 0.14);
  --accent: #ffe500;
}
body { background-color: var(--paper); }
```

Reset & type:
- `::-webkit-scrollbar { display:none; }` (hide native scrollbar).
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1 { font-family: var(--display); font-weight:600; font-size:70px; line-height:70px; letter-spacing:-0.02em; color: var(--ink); font-variant-numeric: tabular-nums; }` — the tabular figures matter: the project numbers must not jitter as they peel.
- `p, a { text-decoration:none; font-family: var(--sans); font-size:13.5px; font-weight:500; letter-spacing:0.005em; color: var(--ink); transition: color 0.3s; }`, and `a:hover { background: var(--accent); }` — the canary shows up only as that highlight.

Fixed chrome (all corners pinned to the viewport):
- `nav { position:fixed; top:0; left:0; width:100vw; padding:2em; display:flex; justify-content:space-between; }` — "Index" left, "Watch Showreel" right.
- `.nav-items { position:fixed; top:2em; left:40%; display:flex; gap:0.25em; }` — three inline links.
- `nav a, .nav-items a { text-transform:none; }` (override the global uppercase for the nav links only).
- `.footer p { position:fixed; bottom:2em; left:40%; text-transform:none; }`

A **`left:40%` vertical guide** aligns `.nav-items`, `.project-names`, and the footer to the same column.

Spacers (pure scroll runway so the first/last project can travel through center):
- `.whitespace.w-1 { width:100vw; height:50vh; }`
- `.whitespace.w-2 { width:100vw; height:45vh; }`

Gallery grid:
- `.gallery { position:relative; width:100%; display:flex; flex-direction:column; gap:20em; }` — big **20em vertical gap** between projects.
- `.project { position:relative; width:100vw; height:100vh; display:flex; }` — each section is one full viewport, a **flex row**.
- `.index { flex:1; padding-left:2em; height:0; }` — left rail, **1/7 of the row width, zero height** (it only anchors the absolutely-positioned mask; it must not consume vertical space).
- `.images { flex:6; display:flex; flex-direction:column; gap:1em; height:100vh; }` — right column, **6/7 width, full height**, holding 6 stacked images with 1em gaps.
- `.img { flex:1; width:200px; background-color:lightgray; overflow:hidden; }` — each image cell splits the column height equally (`flex:1`), clips overflow.
- `.img img { opacity:0.9; }` — gallery images sit at 90% opacity.

The masked number (critical geometry):
- `.index .mask { position:absolute; top:0; left:2em; height:70px; overflow:hidden; will-change:transform; }` — the mask is a **70px-tall clipping window** at the top-left of each `.project` (its offset parent is `.project`, which is `relative`). `overflow:hidden` is what makes the digit disappear as it slides up.
- `.index .mask h1 { position:relative; will-change:transform; }`
- `.index .mask h1 span { position:relative; display:inline-block; will-change:transform; }`
- `.digit-wrapper, .digit-wrapper span { display:inline-block; position:relative; will-change:transform; }` — the JS-injected wrapper and its two digit spans are inline-blocks so each can be transformed independently.

Left project-name list + indicator:
- `.project-names { position:fixed; width:200px; top:50vh; left:40%; transform:translateX(0%); }` — fixed at vertical center, left column.
- `.indicator { position:absolute; top:0; right:0; width:18px; height:18px; display:flex; justify-content:center; align-items:center; will-change:transform; }` — a small box at the right of the name list that GSAP slides down.
- `.symbol { width:12px; height:12px; background-color:#000; clip-path:polygon(0 50%, 100% 100%, 100% 0); }` — a **left-pointing black triangle**.
- `.name { height:18px; }` — each row is exactly 18px tall (matches the indicator's 18px step).
- `.name p { color:gray; }` and `.name.active p { color:#000; }` — inactive names are gray, the active one is black.

Bottom-right preview + progress bar:
- `.preview-img { position:fixed; bottom:2em; right:2em; max-width:40vw; height:calc(50vh - 2em); opacity:0.9; }` — a floating preview panel bottom-right, up to 40vw wide, roughly half-viewport tall, at 90% opacity.
- `.progress-bar { position:fixed; top:0; right:0; width:8px; height:100vh; background-color:#000; transform-origin:top; transform:scaleY(0); }` — an **8px black bar** on the far right, scaled from the top, starting collapsed (`scaleY(0)`).

## GSAP effect (be exhaustive — this is the point)

### Smooth-scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 750);
});
gsap.ticker.lagSmoothing(0);
```
Note the multiplier is **`time * 750`** (not the usual 1000) — a deliberately slower, heavier Lenis feel. Lenis pumps `ScrollTrigger.update` on every scroll; lag smoothing off.

### Up-front state (declared before any ScrollTrigger to dodge a TDZ)
A pinned trigger's `onUpdate` can fire during `ScrollTrigger.refresh()` on creation, before later declarations run, so declare these first:
```js
let scrollVelocity = 0, lastScrollTop = 0, activeIndex = -1;
```

### Manual digit split — `splitTextIntoSpans(".mask h1")`
For every `.mask h1`, read its two characters and rebuild its `innerHTML`:
```js
function splitTextIntoSpans(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    const [firstDigit, secondDigit] = el.innerText;   // e.g. "0","1"
    el.innerHTML = `
      <div class="digit-wrapper">
        <span class="first">${firstDigit}</span><span class="second">${secondDigit}</span>
      </div>`;
  });
}
splitTextIntoSpans(".mask h1");
```
Result nesting inside each mask: `h1 > .digit-wrapper > span.first + span.second`. These four layers (`mask`, `.digit-wrapper`, `.first`, `.second`) are what the push-up animates independently.

### Manual gallery population — `populateGallery()`
```js
const imagesPerProject = 6;
const totalImages = 50;
let imageIndex = 1;
function populateGallery() {
  document.querySelectorAll(".images").forEach((container) => {
    for (let j = 0; j < imagesPerProject; j++) {
      if (imageIndex > totalImages) imageIndex = 1;     // wrap/cycle
      const cell = document.createElement("div");
      cell.classList.add("img");
      const img = document.createElement("img");
      img.src = `/img${imageIndex}.jpg`;
      img.alt = `Project Image ${imageIndex}`;
      cell.appendChild(img);
      container.appendChild(cell);
      imageIndex++;
    }
  });
}
populateGallery();
```
Each of the 8 `.images` gets **6** `.img` cells → **48 images total**, numbered sequentially `img1…img48` (the cycle-back at 50 never triggers with these counts). Adjust the `/img${i}.jpg` path to wherever your fixtures live.

### 1) Side progress bar
```js
ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: "bottom bottom",
  onUpdate: (self) => gsap.set(".progress-bar", { scaleY: self.progress }),
});
```
The 8px right bar's `scaleY` tracks whole-page scroll progress 0→1 (fills downward from `transform-origin:top`). Per-frame `gsap.set`, no ease.

### 2) Bottom-right preview image follows the centered gallery image
For **every** `.img img` create a trigger keyed to the viewport's vertical center:
```js
const previewImg = document.querySelector(".preview-img img");
document.querySelectorAll(".img img").forEach((img) => {
  ScrollTrigger.create({
    trigger: img,
    start: "top 50%",
    end: "bottom 50%",
    onEnter:     () => (previewImg.src = img.src),
    onEnterBack: () => (previewImg.src = img.src),
  });
});
```
Whenever a gallery image crosses the 50%-height line (scrolling either direction) the floating preview swaps its `src` to that image. No tween — an instant source swap.

### 3) Name-list indicator hop + active name
```js
const indicator = document.querySelector(".indicator");
const indicatorStep = 18;                       // px per row (= .name height)
const names = gsap.utils.toArray(".name");
gsap.set(".indicator", { top: "0px" });
const projects = gsap.utils.toArray(".project");

projects.forEach((project, index) => {
  ScrollTrigger.create({
    trigger: project,
    start: "top 50%",
    end: "bottom 50%",
    onEnter: () => {
      gsap.to(indicator, { top: Math.max(0, index * indicatorStep) + "px", duration: 0.3, ease: "power2.out" });
      names.forEach((n, i) => n.classList.toggle("active", i === index));
    },
    onLeaveBack: () => {
      const target = index - 1 < 0 ? 0 : (index - 1) * indicatorStep;
      gsap.to(indicator, { top: target + "px", duration: 0.3, ease: "power2.out" });
      names.forEach((n, i) => n.classList.toggle("active", i === (index - 1 < 0 ? 0 : index - 1)));
    },
  });
});
```
As each project's top crosses viewport-center the triangle **slides to row `index` (18px per row) over 0.3s `power2.out`** and that name row becomes black/active; scrolling back up returns it to the previous row.

### 4) The star: fixed-then-peel masked number (per-frame, velocity-aware)
For every project, cache its four layers, reset transforms, and build one big `onUpdate` trigger:
```js
projects.forEach((project, i) => {
  const mask = project.querySelector(".mask");
  const digitWrapper = project.querySelector(".digit-wrapper");
  const firstDigit = project.querySelector(".first");
  const secondDigit = project.querySelector(".second");

  gsap.set([mask, digitWrapper, firstDigit, secondDigit], { y: 0 });
  gsap.set(mask, { position: "absolute", top: 0 });

  ScrollTrigger.create({
    trigger: project,
    start: "top bottom",
    end: "bottom top",
    anticipatePin: 1,
    fastScrollEnd: true,
    preventOverlaps: true,
    onUpdate: (self) => {
      const projectRect = project.getBoundingClientRect();
      const windowCenter = window.innerHeight / 2;
      const nextProject = projects[i + 1];
      const velocityAdjustment = Math.min(scrollVelocity * 0.1, 100);
      const pushPoint = window.innerHeight * (0.85 + velocityAdjustment / window.innerHeight);

      if (projectRect.top <= windowCenter) {
        // (a) once this project reaches center, pin its number to screen-center
        if (!mask.isFixed) {
          mask.isFixed = true;
          gsap.set(mask, { position: "fixed", top: "50vh" });
        }
        // (b) when the NEXT project climbs to the push point, peel this number up
        if (nextProject) {
          const nextRect = nextProject.getBoundingClientRect();
          if (nextRect.top <= pushPoint && activeIndex !== i + 1) {
            gsap.killTweensOf([mask, digitWrapper, firstDigit, secondDigit]);
            activeIndex = i + 1;
            gsap.to(mask,        { y: -80, duration: 0.3,  ease: "power2.out", overwrite: true });
            gsap.to(digitWrapper,{ y: -80, duration: 0.5,  delay: 0.5, ease: "power2.out", overwrite: true });
            gsap.to(firstDigit,  { y: -80, duration: 0.75, ease: "power2.out", overwrite: true });
            gsap.to(secondDigit, { y: -80, duration: 0.75, delay: 0.1, ease: "power2.out", overwrite: true });
          }
        }
      } else {
        // above center → keep number in its normal absolute spot
        mask.isFixed = false;
        gsap.set(mask, { position: "absolute", top: 0 });
      }

      // (c) scrolling UP and this project's top is back below center → restore the PREVIOUS number
      if (self.direction === -1 && projectRect.top > windowCenter) {
        mask.isFixed = false;
        gsap.set(mask, { position: "absolute", top: 0 });
        if (i > 0 && activeIndex === i) {
          const prev = projects[i - 1];
          const pMask = prev.querySelector(".mask");
          const pWrap = prev.querySelector(".digit-wrapper");
          const pFirst = prev.querySelector(".first");
          const pSecond = prev.querySelector(".second");
          gsap.killTweensOf([pMask, pWrap, pFirst, pSecond]);
          activeIndex = i - 1;
          gsap.to([pMask, pWrap], { y: 0, duration: 0.3,  ease: "power2.out", overwrite: true });
          gsap.to(pFirst,         { y: 0, duration: 0.75, ease: "power2.out", overwrite: true });
          gsap.to(pSecond,        { y: 0, duration: 0.75, delay: 0.1, ease: "power2.out", overwrite: true });
        }
      }
    },
    onEnter: () => { if (i === 0) activeIndex = 0; },
  });
});
```
Precise behavior to reproduce:
- **Pin at center:** while `projectRect.top <= innerHeight/2`, the number's `.mask` flips to `position:fixed; top:50vh` (its `left:2em` is untouched, so it hangs at the middle-left of the screen). A per-element boolean flag `mask.isFixed` guards the one-time flip. Above center it flips back to `position:absolute; top:0`.
- **Push point is velocity-aware:** `pushPoint = innerHeight * (0.85 + velAdj/innerHeight)` where `velAdj = min(scrollVelocity*0.1, 100)`. At rest the next project must climb to **85% of viewport height** to trigger the peel; faster scrolling nudges that threshold lower (later), capped by the +100px clamp. `scrollVelocity` comes from the scroll listener below.
- **The peel (layered stagger, all `y:0 → y:-80`, all `power2.out`, all `overwrite:true`):**
  - `.mask` — **duration 0.3**, no delay (the clipping window itself lifts first/fastest).
  - `.first` (first digit) — **duration 0.75**, no delay.
  - `.second` (second digit) — **duration 0.75, delay 0.1** (trails the first digit by 0.1s).
  - `.digit-wrapper` — **duration 0.5, delay 0.5** (starts latest).
  These four independent tweens on nested layers compound (each layer's -80 adds to its ancestor's) and, because they have different speeds/delays, the number appears to **peel apart and slide up out of the 70px mask in staggered layers** rather than as one rigid block. An `activeIndex` latch (`activeIndex !== i + 1`) plus `killTweensOf` ensures the peel fires exactly once per boundary.
- **Reverse on scroll-up:** when scrolling up (`self.direction === -1`) and the current project falls back below center, the **previous** project's number is animated **back to `y:0`** (mask+wrapper 0.3s, first 0.75s, second 0.75s/delay 0.1s) and `activeIndex` steps back to `i-1`, so numbers reassemble as you scroll upward.

### 5) Scroll-velocity tracker (feeds the push point)
```js
window.addEventListener("scroll", () => {
  const st = window.pageYOffset;
  scrollVelocity = Math.abs(st - lastScrollTop);
  lastScrollTop = st;
}, { passive: true });
```
`scrollVelocity` = absolute px delta per scroll event; larger deltas raise `velocityAdjustment` (clamped 0–100) which shifts the peel's `pushPoint`.

## Assets / images
A single **editorial photography set** of **50 images** (`img1.jpg … img50.jpg`); the layout consumes the first **48** (6 per project × 8 projects), plus `img1.jpg` seeds the preview panel. All are shown with `object-fit:cover`, so exact source aspect ratios don't matter — provide a mix (the set includes tall **2:3 portraits**, near-**1:1** frames, and wide **~16:9 / 3:2 landscapes**). Mood: quiet, natural-light, film-grain editorial — character portraits, tight close-ups and atmospheric environmental frames, held together by restraint rather than by a colour story. They sit on a bone page with near-black type, so frames with a calm mid-tone and one clear subject read best; a single saturated studio backdrop every few projects gives the scroll some punctuation. No logos, no text, no brand marks. If you have fewer than 48 unique photos, repeat them to fill the grid.

## Behavior notes
- **Trigger: scroll only** (Lenis-smoothed). Nothing autoplays; every effect is scroll-position driven via `ScrollTrigger` (progress bar and preview are per-frame/threshold; the number peel is discrete tweens fired at boundaries).
- The two `.whitespace` spacers (50vh top, 45vh bottom) plus the 20em inter-project gaps give the first and last numbers room to reach and leave screen-center.
- `getBoundingClientRect()`, `window.innerHeight`, and `window.pageYOffset` are read live each frame, so the layout stays correct on resize/viewport changes without recomputing offsets.
- Desktop-oriented full-viewport composition; there is **no reduced-motion guard** and no separate mobile breakpoint in the original — the same triggers run at all sizes.

## Images

This component ships with 50 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/gregorylalle/img1.jpg
https://motionprompts.dev/c/gregorylalle/img10.jpg
https://motionprompts.dev/c/gregorylalle/img11.jpg
https://motionprompts.dev/c/gregorylalle/img12.jpg
https://motionprompts.dev/c/gregorylalle/img13.jpg
https://motionprompts.dev/c/gregorylalle/img14.jpg
… 44 more under https://motionprompts.dev/c/gregorylalle/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--paper-deep`, `--ink`, `--muted`, `--gray`, `--line`, `--accent`, plus the type variables `--sans`, `--display`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener wrapping this whole file is never called and the effect never runs — no error, no animation, nothing to debug. Delete the listener and put its body directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — Every `document.querySelector`/`querySelectorAll` above (`.mask h1`, `.images`, `.progress-bar`, `.preview-img img`, `.indicator`, `.name`, `.project`, `.img img`) assumes this component owns the document. Give the component a root `ref`, render it on the outermost element, and scope every one of those lookups to it. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of the subtree exist for an instant, and an unscoped selector will bind to the one that is on its way out.

*(3) Cleanup* — Wrap every tween and trigger this component creates — the progress-bar updater, the eight preview-swap triggers, the per-project indicator triggers, and the eight per-frame mask/peel triggers — in a `gsap.context` scoped to the root ref, and revert that context in the cleanup. The context records everything GSAP creates inside it, so one call undoes the tweens, the triggers, and the inline styles GSAP wrote (including the `position`/`top` flips the mask trigger applies through `gsap.set`), in one step:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the effect exactly as described above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Without the revert, the StrictMode remount leaves a second set of eight mask triggers and a second progress-bar trigger on the same elements, both reading the same scroll. Registering the plugin (`gsap.registerPlugin`) belongs at module scope, not inside the effect.

`gsap.ticker.add` is not covered by the context: the ticker subscription that drives `lenis.raf` here is neither a tween nor a trigger, so `ctx.revert()` leaves it running after the smooth-scroll instance feeding it is gone. Keep the exact function reference passed to `gsap.ticker.add` and call `gsap.ticker.remove` on that same reference in the cleanup, alongside `lenis.destroy()`.

Smooth scroll is a document-level resource: there must be exactly one `Lenis` instance on the page, and it must be destroyed when the component that owns it unmounts. If this component is one section of a larger app, the right move is usually to lift Lenis to the app shell and let this component use the existing instance. If it does own it, create it inside the effect and call `destroy()` in the cleanup, remove the `gsap.ticker.add` subscription that feeds it as described above, and tear down the `lenis.on("scroll", ScrollTrigger.update)` wiring along with it — `Lenis` does not remove its own listeners on `destroy()`.

*(4) What is specific to this component* — Two more things in this script are neither GSAP- nor Lenis-owned, so neither `ctx.revert()` nor `lenis.destroy()` will touch them:

- The scroll-velocity tracker (the `window.addEventListener("scroll", ...)` that feeds `scrollVelocity`, which the mask trigger's per-frame `onUpdate` reads to compute its push point) is a bare DOM listener. Keep the handler reference and remove it explicitly in the same cleanup, or a StrictMode remount leaves two velocity trackers writing into the closed-over variables of a pass that has already been torn down.
- `splitTextIntoSpans` and `populateGallery` are hand-rolled, not library calls, and they do not behave the same way on a second pass. `splitTextIntoSpans` is safe to re-run: it replaces each `.mask h1`'s `innerHTML` wholesale, so a second call rebuilds the `digit-wrapper`/`.first`/`.second` structure fresh from the two visible characters instead of nesting into the previous output. `populateGallery` is not safe: it appends six new `.img` cells into whatever the `.images` container already holds instead of clearing it first, so a second invocation leaves twelve cells per project instead of six — the column layout breaks, and the per-image preview triggers created afterward bind to double the elements. Clear each `.images` container (or otherwise guard against a repeat call) before appending, inside the same effect.

Also specific to this component: the `mask.isFixed` flag that latches the fixed-at-center pin is a plain property written directly onto each `.mask` element, outside both React state and GSAP's tracked state. The `.mask` nodes themselves are not recreated between the aborted first effect pass and the second — only the effect body re-runs — so a flag left `true` by the first pass survives `ctx.revert()` intact. On the second pass, the per-frame `onUpdate`'s `if (!mask.isFixed)` guard then sees a stale `true` and never re-applies the fixed positioning, even though the `gsap.set(mask, { position: "absolute", top: 0 })` at setup already reset the inline style back to normal flow. Reset every mask's flag to `false` explicitly at the top of the effect, before any trigger is created, instead of relying on the inline-style reset to imply it.
