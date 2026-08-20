# Modular Carousel — click-advanced split-panel clip-path image slider

## Goal
Build a **full-viewport, click-driven image carousel**. The whole page is the button: every click
anywhere advances the slider. Two things happen per click, in parallel: (1) a horizontal strip of
big centered slide **titles** slides one slot to the left via a slow 2s `gsap.to` `power4.out`
tween, promoting a new title to the highlighted center position; and (2) in a small centered stage
made of **two offset split panels** (a top band and a bottom band cut with CSS `clip-path`
polygons), a **fresh pair of `<img>` elements is injected and revealed** — their own animated
`clip-path` wipes open from the right edge while they simultaneously **scale from 2 → 1**, with a
0.15s stagger between the top and bottom panel. The star effect is this layered clip-path reveal:
each new image is stacked on top of the previous ones and sweeps in; old images are trimmed away
after the tween completes. Hovering the image stage widens the two clip-path windows via a pure-CSS
transition.

## Tech
Vanilla HTML / CSS / JS with an ES module entry (`<script type="module" src="./script.js">`),
bundled by Vite. **`gsap` (npm)** is the only dependency — `import gsap from "gsap"`. **No GSAP
plugins** (no ScrollTrigger, SplitText, CustomEase), **no Lenis, no Three.js, no canvas.** GSAP is
used only for two `gsap.to` tweens (the title strip transform and the image clip-path/scale
reveal). Everything else — the split-panel windows and the hover widening — is plain CSS
`clip-path` + CSS `transition`. Must run in a fresh Vite project with only `gsap` installed.

## Layout / HTML
Static chrome (fixed nav + footer) plus the slider. The 9 title elements are hard-coded in the
HTML; the image `<img>` elements are **not** in the HTML — JS injects them at runtime.

```html
<nav>
  <a href="#">Motionprompts</a>
  <p>Unlock Source Code with PRO</p>
</nav>

<footer>
  <div class="links">
    <a href="#">Subscribe</a>
    <a href="#">Instagram</a>
    <a href="#">Twitter</a>
  </div>
  <p>Link in description</p>
</footer>

<div class="slider">
  <div class="slide-titles">
    <div class="title"><h1>Neo Forge Towers</h1></div>
    <div class="title"><h1>Arcadian Complex</h1></div>
    <div class="title"><h1>Shadowline Spire</h1></div>
    <div class="title"><h1>Echo Nexus Habitat</h1></div>
    <div class="title"><h1>Cascade Enclave</h1></div>
    <div class="title"><h1>Prism Sector</h1></div>
    <div class="title"><h1>Iron Eden Colony</h1></div>
    <div class="title"><h1>Neo Forge Towers</h1></div>
    <div class="title"><h1>Arcadian Complex</h1></div>
  </div>
  <div class="slide-images">
    <div class="img-top"></div>
    <div class="img-bottom"></div>
  </div>
</div>
```

- **Exactly 9 `.title` blocks.** There are only **7 unique** titles; the last two
  (`Neo Forge Towers`, `Arcadian Complex`) intentionally repeat the first two so the loop never
  reveals an empty edge. Titles are fictional futuristic-architecture names — keep them or swap for
  any neutral set, but keep 9 of them with the first two repeated at the end.
- `.slide-images` holds two empty panel containers, `.img-top` and `.img-bottom`. JS appends the
  injected `<img>` elements into these.

## Styling
Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`

- **Page:** `html, body { width: 100vw; height: 100vh; overflow: hidden; background: #0f0f0f;
  font-family: "Circular Std"; }` — dark near-black stage. If Circular Std is unavailable, use any
  clean geometric sans (e.g. a neutral grotesque) as fallback.
- **`img`** (global) — `position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover;` Every injected image fills its panel box and is cropped by `cover`.
- **`nav`, `footer`** — `position: fixed; width: 100%; padding: 2em; display: flex;
  justify-content: space-between; align-items: center; z-index: 2; mix-blend-mode: difference;`
  `nav { top: 0; }` `footer { bottom: 0; }`. The `mix-blend-mode: difference` makes the white
  labels invert against whatever passes beneath them.
- **`a`, `p`** — `color: #fff; font-size: 14px; text-decoration: none;`. `.links { display: flex;
  gap: 2em; }`
- **`.slider`** — `width: 100vw; height: 100vh;`
- **`.slide-titles`** — `position: absolute; top: 0; left: 0; width: 300vw; height: 100vh;
  display: flex; pointer-events: none; z-index: 2;` A **300vw-wide** flex row of the 9 titles.
- **`.title`** — `flex: 1; width: 100%; height: 100%; display: flex; justify-content: center;
  align-items: center;` Each title is `300vw / 9 = 33.33vw` wide, so **three titles span the
  viewport** and exactly one sits centered on screen at any resting position.
- **`.title h1`** — `text-align: center; font-size: 28px; font-weight: 400;
  color: rgba(255, 255, 255, 0.2); transition: color 0.25s ease, opacity 0.25s ease;` Dim by
  default (20% white).
- **`.active h1`** — `color: #fff;` The centered/active title brightens to solid white; the
  0.25s color transition makes the highlight cross-fade as slides change.
- **`.slide-images`** — `width: 550px; height: 500px; position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); pointer-events: all; opacity: 0.5;` A **550×500px** near-square
  stage centered in the viewport, held at **50% opacity** so the images read as dim/atmospheric
  behind the titles.
- **`.img-top`** — `position: absolute; width: 100%; height: 100%;
  clip-path: polygon(85% 0%, 0% 0%, 0% 50%, 85% 50%);
  transition: clip-path 1s cubic-bezier(0.075, 0.82, 0.165, 1);` A rectangular window covering the
  **top-left band** (x: 0→85%, y: 0→50%), shifted left.
- **`.img-bottom`** — `position: absolute; width: 100%; height: 100%;
  clip-path: polygon(100% 50%, 15% 50%, 15% 100%, 100% 100%);
  transition: clip-path 1s cubic-bezier(0.075, 0.82, 0.165, 1);` A rectangular window covering the
  **bottom-right band** (x: 15→100%, y: 50→100%), shifted right. Together the two offset bands make
  the signature staggered "modular" split — the top half pushed left, the bottom half pushed right.
- **Hover** (`cubic-bezier(0.075, 0.82, 0.165, 1)` = ease-out-circ over 1s):
  `.slide-images:hover .img-top { clip-path: polygon(90% 0%, 10% 0%, 10% 50%, 90% 50%); }` and
  `.slide-images:hover .img-bottom { clip-path: polygon(90% 50%, 10% 50%, 10% 100%, 90% 100%); }` —
  both bands slide toward center and become symmetric (x: 10→90%), so the split closes into a
  centered, aligned pair while hovered.

## The effect — exhaustive GSAP + interaction spec

### State (module scope)
```js
let currentIndex = 1;   // which title index is centered/active (0-based into the 9 .title nodes)
let totalSlides  = 7;   // number of unique slides in the loop
```

### Active-title highlighting — `updateActiveSlide()`
Loop over all `.title` nodes; add class `active` to the one whose index equals `currentIndex`,
remove it from all others. Only the active title's `h1` is solid white (via `.active h1`), the
0.25s CSS transition cross-fades the highlight.

### Click handler — `handleSlider()` (bound to `document` click)
A click **anywhere on the page** triggers one advance:
1. Advance the index with a 7-state wrap: `if (currentIndex < totalSlides) currentIndex++;
   else currentIndex = 1;`. So the index cycles `1 → 2 → 3 → 4 → 5 → 6 → 7 → 1 → …` (it never
   sits at 0).
2. Tween the whole title strip left by exactly one title-width:
```js
gsap.to(".slide-titles", {
  x: `-${(currentIndex - 1) * 11.1111}%`,   // percentage of the element's OWN width (300vw)
  duration: 2,
  ease: "power4.out",
  onStart: () => {
    setTimeout(() => { updateActiveSlide(); }, 100);   // promote new active title 100ms in
    updateImages(currentIndex + 1);                    // reveal the NEXT image (see offset note)
  },
});
```
- `x` is a **percentage string**, so GSAP writes it as a `translateX` relative to the strip's own
  `300vw` width. `11.1111%` of `300vw` = **33.33vw** = exactly one title slot. At `currentIndex=1`,
  `x = 0`; at `currentIndex=2`, `x = -11.1111%`; … at `currentIndex=7`, `x = -66.66%`. Each step
  glides the row one slot left over **2s with `power4.out`** (fast start, long soft settle).
- The **active title updates 100ms after the tween starts** (via `setTimeout`), not at the end —
  the highlight jumps to the incoming title early while the strip is still gliding.

### Image reveal — `updateImages(imageNumber)`
Called with an image number; injects and animates a fresh pair of stacked images:
```js
const imgSrc = `/c/modular-slider/img${imageNumber}.jpg`;
const imgTop = document.createElement("img");
const imgBottom = document.createElement("img");
imgTop.src = imgSrc;
imgBottom.src = imgSrc;

// initial (collapsed) state — a zero-width sliver pinned at the RIGHT edge, zoomed 2×:
imgTop.style.clipPath    = "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)";
imgBottom.style.clipPath = "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)";
imgTop.style.transform    = "scale(2)";
imgBottom.style.transform = "scale(2)";

document.querySelector(".img-top").appendChild(imgTop);
document.querySelector(".img-bottom").appendChild(imgBottom);

gsap.to([imgTop, imgBottom], {
  clipPath: "polygon(100% 0%, 0% 0%, 0% 100%, 100% 100%)",  // full rectangle
  transform: "scale(1)",
  duration: 2,
  ease: "power4.out",
  stagger: 0.15,          // top panel reveals, bottom panel 0.15s behind
  onComplete: trimExcessImages,
});
```
Reveal mechanics to reproduce exactly:
- **Both panels get the SAME image** (`imgTop` and `imgBottom` share `imgSrc`); the container
  clip-paths (`.img-top` / `.img-bottom`) carve them into the offset top/bottom bands, so the two
  copies together look like one image split across the two windows.
- The animated **`clip-path` goes from a degenerate polygon collapsed at the right edge**
  (all four points at `x = 100%`) **to the full rectangle** (`polygon(100% 0%, 0% 0%, 0% 100%,
  100% 100%)`). The two left corners travel from `x = 100%` to `x = 0%`, so the image **wipes open
  from the right edge leftward**.
- Simultaneously **`scale(2) → scale(1)`** — a zoom-out that resolves as the wipe completes.
- **`power4.out`, `duration: 2`**, with a **0.15s stagger** so the bottom band trails the top band.
- Each call **appends** new `<img>` nodes on top of the previous ones (absolute-positioned stack),
  so the freshly revealed image slides in over the still-visible previous one.

### Trimming the stack — `trimExcessImages()` (the reveal tween's `onComplete`)
For each of `.img-top` and `.img-bottom`: collect its child `<img>`s and, if there are more than
**5**, remove the **oldest** ones (`images.slice(0, images.length - 5)`), keeping the last 5. This
caps each panel at 5 stacked layers so the DOM doesn't grow unbounded while preserving a few layers
behind the newest reveal.

### Init — on `DOMContentLoaded`
```js
document.addEventListener("click", handleSlider);
updateImages(2);        // reveal img2 into both panels on load
updateActiveSlide();    // highlight the title at index 1 ("Arcadian Complex")
```

### The title↔image offset (important)
The **active title index** and the **image number** are intentionally off by one: the code reveals
`updateImages(currentIndex + 1)` while highlighting title index `currentIndex`. On load
(`currentIndex = 1`) it shows **img2** and highlights index **1**. Through the click loop the image
number runs **img2 → img3 → img4 → img5 → img6 → img7 → img8 → (wrap) → img2 …**. So **img1 is a
spare that the default click cycle never reaches** — only images 2–8 appear. Preserve this mapping.

## Assets / images
- **8 full-bleed architecture photographs** named `img1.jpg … img8.jpg` under
  `/c/modular-slider/`. Mostly **portrait ~3:4** (a couple are square 1:1); each fills the
  550×500 near-square panel box via `object-fit: cover`, so exact ratio is not critical.
- Theme: **modern / futuristic residential and civic architecture**, editorial and atmospheric,
  shot in golden-hour, misty-forest, coastal-dune and mountain settings — a palette that sits well
  on the near-black stage at 50% opacity. Generic by role and form, **no brand marks, logos or
  baked-in text**:
  1. **Cantilevered beach house** — a modern two-story home clad in light wood over a dark base,
     glass railings and floor-to-ceiling windows, perched on grassy coastal sand dunes at golden
     hour. *(the spare image the click cycle never reaches)*
  2. **Glowing forest cabin** — a warmly lit angular cabin with a steep mono-slope roof and a
     full-height glass wall, orange interior glow with sofa and plants, in a misty green forest at
     dusk. *(first image shown on load)*
  3. **Rammed-earth house** — a minimalist two-story terracotta-toned home with vertical wood-slat
     screens and a large recessed window, dappled sun, warm beige monochrome.
  4. **Timber tower home** — a three-story timber-clad house with tall black-framed vertical
     windows reflecting autumn trees, raised concrete base, stone path through a green garden under
     blue sky.
  5. **Curved pod cabin** — a futuristic rounded wooden pod with a big glass front, cantilevered
     over rippled sand dunes and beach grass under a bright blue sky.
  6. **Faceted villa** — a sculptural angular villa with a sweeping faceted dark roof and a large
     triangular glass facade, on a green lawn with a curving path amid forested mountains.
  7. **Brutalist arches** — a monumental organic concrete building with flowing arched supports and
     rounded window openings, small figures at the base, warm sunset light over a forested valley.
  8. **Stacked hillside house** — a split-level modern home of pale wood volumes with big glass
     corners and balconies, built into a grassy hillside with a dirt path under clear blue sky.

## Behavior notes
- **Interaction is a single global click** — the entire document advances the slider; there are no
  arrows or dots. It does not autoplay.
- **Loop:** the 7-state index wrap plus the two duplicated trailing titles make the strip feel
  continuous; on wrap (`7 → 1`) the strip snaps its transform back toward `x = 0` for the next
  cycle.
- **Responsive (`max-width: 900px`):** the image stage becomes full-bleed (`.slide-images` →
  `width: 100%; height: 100%`), the split-panel and hover clip-paths flatten to a full rectangle
  (`polygon(0 0, 100% 0, 100% 100%, 0 100%)`), the title `h1` drops to `24px` and only the
  **active** title is visible (`.title h1 { opacity: 0 }`, `.active h1 { opacity: 1 }`, using the
  0.25s opacity transition).
- **Hover** widening is pure CSS (1s ease-out-circ) and independent of the click-driven GSAP
  tweens.
- No reduced-motion branch in the original; keep the motion GSAP-driven and lightweight (two
  concurrent tweens per click, DOM capped at 5 image layers per panel).

## Images

This component ships with 8 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/modular-slider/img1.jpg
https://motionprompts.dev/c/modular-slider/img2.jpg
https://motionprompts.dev/c/modular-slider/img3.jpg
https://motionprompts.dev/c/modular-slider/img4.jpg
https://motionprompts.dev/c/modular-slider/img5.jpg
https://motionprompts.dev/c/modular-slider/img6.jpg
… 2 more under https://motionprompts.dev/c/modular-slider/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

> Everything above describes a standalone document: one script that runs once, reaches into the
> page with `document.querySelector`, and never has to undo itself. React withdraws all three of
> those guarantees at once, and it does it quietly — the component renders, looks right for a
> moment, and then misbehaves in a way that does not point back at any of this.
>
> Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
> reaches the screen. Setup that runs twice with teardown that runs never leaves you two of
> everything here: two `document` click listeners both calling `handleSlider`, so a single click
> advances the index twice and fires two competing title-strip tweens in the same gesture, one
> immediately overriding the other's `x`. Treat the cleanup as part of the effect, not as an
> afterthought.
>
> *(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component
> mounts, that event has already fired, so the listener is never invoked — no click handler gets
> attached, no first image loads, no title is highlighted, and the slider sits inert with every
> `.title h1` at its dim resting color. Delete the `DOMContentLoaded` wrapper and move its three
> lines — attaching the click listener, the initial `updateImages(2)`, the initial
> `updateActiveSlide()` — directly inside a `useEffect` with an empty dependency array.
>
> *(2) Element lookups and module state* — `updateActiveSlide` walks every `.title` under
> `document`, `updateImages` appends into `document.querySelector(".img-top"/".img-bottom")`, and
> `trimExcessImages` reads the same two containers back — none of the three know they should be
> confined to this component's own markup. Give the component a root `ref` on the element that
> wraps `.slide-titles` and `.slide-images`, and resolve all four lookups from that ref. Separately,
> and more consequentially: `currentIndex` and `totalSlides` are **module-scope `let` bindings**,
> not component state. They persist for the life of the page, are shared by every mounted copy of
> this slider, and are never reinitialized on a remount — so the StrictMode double-mount does not
> get a fresh index 1, it inherits whatever the first pass left behind, and if two instances of this
> component ever render on the same page, a single click would advance both from the same shared
> counter. Move `currentIndex` into a `useRef(1)` created inside the component, and read
> `totalSlides` from a plain local constant; there is no reason for either to live outside the
> effect that owns them.
>
> *(3) Cleanup* — The document-level click listener is intentional here, not an oversight: the spec
> is "the whole page is the button," so keep it bound to `document` rather than narrowing it to the
> root ref — just give it a stable named reference so it can be removed. The two `gsap.to` calls
> this component makes — the title-strip glide and the injected-image clip-path reveal — are not
> created synchronously while the effect runs; they only fire later, from inside the click handler.
> Register them as named context methods with `self.add`, so a later invocation still happens while
> the context is current and the tweens it creates get recorded for `revert()`:
> ```jsx
> useEffect(() => {
>   const ctx = gsap.context((self) => {
>     self.add("revealImage", (imageNumber) => {
>       // build imgTop/imgBottom, append into the two ref-scoped panel containers,
>       // gsap.to([imgTop, imgBottom], { clipPath: …, transform: "scale(1)", onComplete: trimExcessImages, … })
>     });
>     self.add("advance", () => {
>       // wrap currentIndex.current, then gsap.to(".slide-titles", { x: `-${…}%`, onStart: () => { … }, … })
>     });
>   }, rootRef);
>
>   const handleClick = () => ctx.advance();
>   document.addEventListener("click", handleClick);
>   ctx.revealImage(2);
>   updateActiveSlide();
>
>   return () => {
>     document.removeEventListener("click", handleClick);
>     ctx.revert();
>   };
> }, []);
> ```
> `ctx.revert()` then undoes both tweens, plus the inline `clipPath`/`transform` values GSAP wrote
> on whatever `<img>` pair was mid-reveal — but it does not know about the one thing this component
> schedules by hand: the `setTimeout` inside the title tween's `onStart` that delays
> `updateActiveSlide()` by a tenth of a second so the highlight promotes just after the strip starts
> moving, not at the same instant. If the component unmounts in that gap — a click lands, the strip
> tween starts, and the route changes before the callback fires — the stale timeout still runs and
> calls `updateActiveSlide()` against a root that may already be null. Capture the timeout id from
> `self.add("advance", …)` and clear it in the same cleanup that calls `ctx.revert()`, the same way
> you would cancel any other continuation the effect can't guarantee finishes before unmount.
