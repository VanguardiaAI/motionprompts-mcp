---
slug: gsap-clip-carousel
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 4
structural_literals: 14
structural:
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Fullscreen Click-Driven Product Carousel — Center Clip-Path Reveal + Box-to-Viewport Grow + Zoom + Per-Character Title Roll

## Goal

Build a fullscreen (100vw × 100vh) editorial product carousel that advances **on every click anywhere on the page**. Each click reveals the next product image inside a small centered box whose `clip-path` opens from a single center point, and that box then **grows to fill the whole viewport** to become the new active slide — while the outgoing active image simultaneously **zooms to scale 2**. In sync, the current product name **rolls up and out one character at a time** (per-letter stagger) as the next name rises into place from below. Everything is driven by plain `gsap.to`/`gsap.set` with `power3.out` eases and animated `clipPath` polygons — no ScrollTrigger, no plugins.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use only **`gsap` (npm)** — `import gsap from "gsap"`. **No GSAP plugins** (no ScrollTrigger, no SplitText — the character split is done by hand), no Lenis, no Three.js. All code runs at module top level (the initial reveal fires immediately on load; the rest is inside a single `document` `click` listener).

## Layout / HTML

```
nav                              ← fixed top bar, 3 flex columns (each flex:1)
  .logo   > a         "Echo Node"           (fictional brand name)
  .links  > a×4       "Home," "Products," "Info," "Contact,"
  .shop   > a×3       "Search" "Account" "Cart"

.copy                            ← absolute, vertically centered band
  p "Lifestyle Catalogue"
  p "2024 / 2025"

footer                           ← absolute bottom-right
  p "Launching Soon"

.slider                          ← fullscreen viewport, overflow hidden
  .slide-active > img            ← image #1 (the starting full-bleed slide)
  .slide-next                    ← flex-centered wrapper
    .slide-next-img > img        ← image #2, inside the small centered clip box

.slider-content                  ← bottom-left masked title window (height 175px)
  .slider-content-active > h1    ← first product name  (e.g. "LuminaPad")
  .slider-content-next   > h1    ← second product name (e.g. "PulseEar")
```

Only these two slides and two title lines exist in the HTML. Every subsequent slide box and title line is created in JS with `insertAdjacentHTML` and appended, then reclassified after each transition.

## Styling

- Global reset: `* { margin:0; padding:0; box-sizing:border-box }`.
- Body font: a **neutral grotesque sans** (original uses "PP Neue Montreal"; fall back to Helvetica Now / Inter / system sans). `h1` font: a **tall, condensed, light-weight display serif** (original uses "Timmons NY 2.005"; fall back to a condensed serif such as a light "Times"/"PT Serif Caption"-style face if unavailable).
- `img { width:100%; height:100%; object-fit:cover }`.
- `p, a { text-decoration:none; color:#fff; font-size:14px }` — all UI text is white over the imagery.
- `nav`: `position:fixed; top:0; width:100%; padding:2em; display:flex; align-items:center; z-index:2`. `nav > div { flex:1 }`. `.links { display:flex; justify-content:center; align-items:center; gap:0.5em }`. `.shop { display:flex; justify-content:flex-end; align-items:center; gap:2em }`.
- `.copy`: `position:absolute; top:45%; transform:translateY(-50%); width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center; z-index:2` (label on the left, date on the right).
- `footer`: `position:absolute; bottom:0; width:100vw; padding:2em; display:flex; justify-content:flex-end; align-items:center; z-index:2`.
- `.slider`: `position:absolute; top:0; left:0; width:100vw; height:100vh; overflow:hidden`.
- `.slide-active`: `position:absolute; width:100%; height:100%` (its `<img>` fills the whole viewport).
- `.slide-next`: `position:absolute; width:100%; height:100%; display:flex; justify-content:center; align-items:center` (centers its child box).
- **The centered clip box** — `.slide-next .slide-next-img`: `width:250px; height:350px; clip-path:polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)`. All four polygon points collapse to the exact center, so the box is **invisible until animated open**. Its inner `<img>` still fills 250×350 with `object-fit:cover`.
- **The title window** — `.slider-content`: `position:absolute; left:2em; bottom:0; width:100%; height:175px; clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%); overflow:hidden`. The full-rectangle clip + `overflow:hidden` make it a **175px-tall mask** that hides any title translated outside it.
- `.slider-content-active`: `position:absolute; top:0; left:0; clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%)`.
- `.slider-content-next`: `position:absolute; top:200px; left:0; clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%)` — starts **200px below** the window (out of sight) so it can rise in later.
- `h1`: `text-transform:uppercase; font-size:150px; font-weight:lighter; color:#fff`. `h1 span { position:relative }` — the per-character split wraps each letter in a `position:relative` `<span>` whose `top` is what the tweens animate.
- Responsive `@media (max-width:900px)`: hide `.links`, `.shop`, `footer`; center `.logo` (`justify-content:center; text-align:center`).

## Product names (fictional, in order)

A JS array of 10 neutral tech-product names used for the rolling titles, e.g.:

```js
const sliderContent = ["LuminaPad","PulseEar","ZenithWatch","AeroCharge","NimbusCam",
                       "EclipseDrive","TerraHub","QuantumKey","MeshRouter","AuraBeam"];
```

No real brands. `totalImages = 10`.

## GSAP effect (be exhaustive — this is the point of the component)

### State

```js
let currentImageIndex = 2;    // image # currently in the centered "next" box (starts at 2.jpg)
let currentContentIndex = 1;  // index into sliderContent of the "next" title (starts at "PulseEar")
const totalImages = 10;
let isAnimating = false;      // lock; ignores clicks while a transition is in flight
```

### Manual character splitter

```js
function splitTextIntoSpans(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    el.innerHTML = el.innerText
      .split("")
      .map((ch) => `<span>${ch === " " ? "&nbsp;&nbsp;" : ch}</span>`)
      .join("");
  });
}
```

Each letter becomes a `position:relative` `<span>`; the tweens then animate each span's `top`.

### 1) Initial reveal on load (fires immediately, no click)

```js
gsap.to(".slide-next-img", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  duration: 1.5, ease: "power3.out", delay: 1
});
```

After a **1s delay**, the collapsed center-point `clip-path` of the first centered box expands to a **full rectangle** over **1.5s** — image #2 fades into view inside the 250×350 box while image #1 fills the background.

### 2) Click handler (the only interaction) — everything below runs on each `document` click

Guard first: `if (isAnimating) return; isAnimating = true;`

All of the following tweens are fired **concurrently** (they are separate `gsap.to` calls, not one timeline), so the outgoing zoom, the box-grow, the clip reveal of the new box, and the two title rolls all overlap.

**(a) Zoom the outgoing active image**

```js
splitTextIntoSpans(".slider-content-active h1");   // split the CURRENT title into spans first
gsap.to(".slide-active img", { scale: 2, duration: 2, ease: "power3.out" });
```

The full-bleed active image scales from 1 → **2** over **2s** (`power3.out`) — a slow zoom that plays under the incoming slide.

**(b) Roll the current title UP and out**

```js
gsap.to(".slider-content-active h1 span", {
  top: "-175px", stagger: {{motion.stagger.base}}, ease: "power3.out", duration: 0.5,
  onComplete: () => {
    gsap.to(".slider-content-active", { top: "-175px", duration: {{motion.duration.fast}}, ease: "power3.out" });
  }
});
```

Each letter of the active name lifts from `top:0` → `top:-175px` (up through the top of the 175px mask) with a **0.05s per-character stagger**, **0.5s** each. When the letters finish, the whole `.slider-content-active` container itself slides to `top:-175px` over **0.25s** (final tuck-away).

**(c) Roll the next title IN from below**

```js
splitTextIntoSpans(".slider-content-next h1");
gsap.set(".slider-content-next h1 span", { top: "200px" });   // letters pre-offset 200px down

gsap.to(".slider-content-next", {
  top: "0", duration: {{motion.duration.base}}, ease: "power3.out",
  onComplete: function () {
    document.querySelector(".slider-content-active").remove();          // drop old active title
    gsap.to(".slider-content-next h1 span", {
      top: 0, stagger: {{motion.stagger.base}}, ease: "power3.out", duration: 0.5          // letters settle up into place
    });
    // promote next → active
    const nextContent = document.querySelector(".slider-content-next");
    nextContent.classList.remove("slider-content-next");
    nextContent.classList.add("slider-content-active");
    nextContent.style.top = "0";
    // queue the following title as the new "next", parked 200px below
    currentContentIndex = (currentContentIndex + 1) % totalImages;
    const nextText = sliderContent[currentContentIndex];
    document.querySelector(".slider-content")
      .insertAdjacentHTML("beforeend",
        `<div class="slider-content-next" style="top: 200px;"><h1>${nextText}</h1></div>`);
  }
});
```

The next-title container rises from `top:200px` → `top:0` over **1.125s**. On complete: remove the old active title, roll its letters from `top:200px` → `top:0` (stagger 0.05, 0.5s each), reclassify it as the new active, and append the following product name as a fresh `.slider-content-next` parked 200px below.

**(d) Reveal the NEW centered box, then grow the CURRENT box to fullscreen**

```js
currentImageIndex = (currentImageIndex % totalImages) + 1;   // advance image #, wraps 10→1

// append a brand-new centered box for the NEXT-next image
document.querySelector(".slider").insertAdjacentHTML("beforeend", `
  <div class="slide-next">
    <div class="slide-next-img"><img src="/c/gsap-clip-carousel/${currentImageIndex}.jpg" alt="" /></div>
  </div>`);

// open the clip-path of that NEW (last-child) box from center point → full rectangle
gsap.to(".slider .slide-next:last-child .slide-next-img", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  duration: 1.5, ease: "power3.out", delay: 0.5
});

// grow the ALREADY-VISIBLE box (querySelector returns the FIRST .slide-next-img in DOM) to fill the screen
const slideNextImg = document.querySelector(".slide-next-img");
gsap.to(slideNextImg, {
  width: "100vw", height: "100vh", duration: 2, ease: "power3.out",
  onComplete: function () {
    document.querySelector(".slide-active")?.remove();                 // drop old active slide
    const nextSlide = document.querySelector(".slide-next");
    nextSlide.classList.remove("slide-next");
    nextSlide.classList.add("slide-active");                            // promote box wrapper → active
    nextSlide.querySelector(".slide-next-img").classList.remove("slide-next-img"); // its box now fills
    setTimeout(() => { isAnimating = false; }, 500);                    // unlock 500ms after grow ends
  }
});
```

Key ordering subtlety to reproduce exactly:
- `currentImageIndex = (currentImageIndex % totalImages) + 1` so image numbers cycle `2→3→…→10→1→2…`.
- The **newly appended** box (`.slide-next:last-child`) is the one whose clip-path opens (delay 0.5, 1.5s).
- `document.querySelector(".slide-next-img")` returns the **first** such box in the DOM — i.e. the box that was *already visible* from the previous cycle. That box is the one that grows from `250×350` → `100vw × 100vh` over **2s** (`power3.out`), becoming the new fullscreen active slide.
- On its `onComplete`: remove the old `.slide-active`, promote the grown `.slide-next` to `.slide-active` (and strip the `.slide-next-img` class so the image fills), then unlock `isAnimating` after a **500ms** `setTimeout`.

### Net choreography of one click

Old image zooms to 2× underneath → the centered box that was showing the next image scales open to fill the viewport as the new active slide → a fresh centered box for the following image clip-reveals in the middle → the old title rolls up and out letter-by-letter while the next title rolls up into the masked window. The `isAnimating` lock (released ~2.5s after the click) prevents overlapping transitions from rapid clicks.

## Assets / images

**10 editorial product/lifestyle photographs**, filenames `1.jpg … 10.jpg`. Each is used **both** as a full-bleed background (`object-fit:cover`, 100vw × 100vh) **and** as a small centered card in the **portrait 250×350 (≈5:7)** clip box before it grows — so keep the subject centered and give each a **distinct dominant color/subject** so the advance reads clearly. Moody, elegant, catalogue/editorial mood (products, objects, lifestyle scenes). No logos or brand marks. Image #1 starts as the active slide, image #2 is pre-loaded in the first centered box.

## Behavior notes

- **Click-anywhere to advance**, no scroll, no autoplay, no wrap-limit — it cycles forward through all 10 images/titles indefinitely (`% totalImages`).
- The `isAnimating` flag blocks clicks mid-transition; a click is only accepted again ~500ms after the box-grow completes.
- No `prefers-reduced-motion` branch in the original. Desktop-first: below 900px the nav links, shop links and footer hide and the logo centers, but the click carousel itself still works.
- The two `clip-path` masks are load-bearing: the collapsed-center-point polygon hides the centered box until reveal, and the title window's full-rectangle clip + `overflow:hidden` mask any letter/line translated outside the 175px band — keep both or the layout breaks.

## Images

This component ships with 10 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/gsap-clip-carousel/1.jpg
https://motionprompts.dev/c/gsap-clip-carousel/10.jpg
https://motionprompts.dev/c/gsap-clip-carousel/2.jpg
https://motionprompts.dev/c/gsap-clip-carousel/3.jpg
https://motionprompts.dev/c/gsap-clip-carousel/4.jpg
https://motionprompts.dev/c/gsap-clip-carousel/5.jpg
… 4 more under https://motionprompts.dev/c/gsap-clip-carousel/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--room`, `--shade`, `--cane`, `--brass`, `--space-1`, `--space-2`, `--space-3`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two `click` listeners advancing the carousel on the same event, two zoom tweens racing on the same outgoing image. The visible symptom is a carousel that jumps two images per click, or a title that rolls twice as fast, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script above runs at the top level: the initial clip-path reveal (the `gsap.to(".slide-next-img", …)` call that opens the second box after the load delay) and the `document.addEventListener("click", …)` registration both fire the moment the module is evaluated, which in React is import time, before this component has rendered its `nav`, `.slider` or `.slider-content` markup. Move both into a `useEffect` with an empty dependency array. Do not leave either in the component body: a `document.addEventListener` call sitting in the render path re-subscribes on every render, stacking one more listener behind the last.

*(2) Element lookups* — Every `document.querySelector` in the code above assumes this component owns the document. Give the component a root `ref`, render it on the outermost element (the one wrapping `nav`, `.copy`, `footer` and `.slider`), and scope every lookup — `.slide-active img`, `.slide-next-img`, `.slider-content-active`, `.slider-content-next` — to it. This matters more than usual here: `document.querySelector(".slide-next-img")` is deliberately unscoped by class in the vanilla version and relies on document order to return the box that is *already visible*, not the one just appended — the prompt calls this out above as a load-bearing ordering subtlety. During the StrictMode double-mount, two copies of `.slider` exist for an instant, and an unscoped query can return the outgoing copy's box instead of the live one — the grow-to-fullscreen tween then animates an element that is about to be torn down while the real box stays at its small centered size forever. The `document`-level `click` listener itself is the one lookup that should **not** be narrowed to the root ref: advancing on a click anywhere on the page is the feature, not an oversight. Everything the handler looks up once it fires still needs to be scoped.

*(3) Cleanup* — Wrap every tween this component creates in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    // initial reveal + document click listener, as described above
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Without the revert, a StrictMode remount leaves a second `click` listener wired to the same `document` and a stray tween still holding an inline `clip-path` on a box that no longer belongs to the live tree.

This component's animation graph, though, does not live where `gsap.context` can see it by default. Every tween here fires from inside the `click` handler or from an `onComplete` chained off another tween — the zoom, both title rolls, the new box's reveal and the grow-to-fullscreen tween are all created **after** the factory above has already returned once, on a later, separate turn of the event loop. `gsap.context` only auto-tracks what gets created while its factory is synchronously running; a `gsap.to` fired from a click seconds later is invisible to it unless you say otherwise. So wrap the handler's body, and every `onComplete` that itself spawns a tween or touches the DOM, in `self.add(() => { … })` — the one-argument overload, which runs immediately and attributes whatever GSAP creates inside it to the context:

```jsx
const onClick = () => {
  if (isAnimating.current) return;
  isAnimating.current = true;
  self.add(() => {
    // splitTextIntoSpans, the zoom tween, both title-roll tweens, the new-box
    // insertAdjacentHTML + reveal tween, and the grow-to-fullscreen tween —
    // each onComplete below needs its own self.add(...) wrapper for the same reason
  });
};
document.addEventListener("click", onClick);
```

Skip this and `ctx.revert()` mid-transition kills nothing at all — not because it fails, but because it never had anything to kill: the tweens it should have owned were created outside its watch, so they keep animating a `.slide-next` box that `insertAdjacentHTML` appended into a subtree React has already unmounted.

That same imperative DOM surgery is the other thing to carry over deliberately rather than by habit. Nothing under `.slider` or `.slider-content` is ever re-rendered from React state — the handler appends new `.slide-next` / `.slider-content-next` nodes with `insertAdjacentHTML`, reclassifies them with `classList`, and removes the outgoing ones by hand, exactly as the vanilla version does. Keep it that way: render the two starting slides and the two starting title lines once from JSX, then treat that subtree as a React-opaque island the effect owns outright, the same way the code above already treats it. Do not lift `currentImageIndex`, `currentContentIndex`, or `isAnimating` into `useState` — none of them drive JSX, and setting them as state would schedule a re-render of a tree that a chained `onComplete` is, at that exact moment, mutating by hand with raw DOM calls. Keep them as `useRef`s, mutated exactly where the closures above mutate the plain variables.
