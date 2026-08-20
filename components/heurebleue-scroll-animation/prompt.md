# Scroll Zoom-Through Image Gallery ("Serene Drift")

## Goal
Build a scroll-driven **fly-through-the-images** effect: a fixed 5-column grid of photos sits pinned behind the page, and as a tall transparent spacer section scrolls past, a single `ScrollTrigger` (scrub) reads its progress and **scales the whole gallery wrapper up** (1 → ~3.65x on desktop, 1 → ~5x on mobile) while it **pushes the four side columns downward** and **shrinks the centered focal image from scale 2 down to ~1.15**. The viewer appears to accelerate forward through a wall of images. Opaque editorial sections (hero, intro, outro, footer) sit above the gallery; only the transparent spacer section lets the zooming gallery show through. Lenis drives smooth scrolling synced to GSAP's ticker.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin, plus **`lenis`** for smooth scrolling:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);
```
No frameworks. `script.js` is loaded as `<script type="module" src="./script.js">` at the end of `<body>`, so it runs after the DOM is parsed — no `DOMContentLoaded` wrapper is needed. There are **no tweens and no timeline** — the entire effect is **one `ScrollTrigger.create()` whose `onUpdate` writes absolute inline `style.transform` strings** every frame; all smoothing comes from `scrub: 1` + Lenis inertia.

## Layout / HTML
Two top-level blocks in `<body>`: first the fixed gallery (`.sticky`), then the scrolling page content (`.container`).

```html
<body>
  <!-- Fixed gallery that lives BEHIND the page -->
  <section class="sticky">
    <div class="gallery-wrapper">
      <div class="col side-1">
        <div class="img"><img src="(img1)" alt="" /></div>
        <div class="img"><img src="(img2)" alt="" /></div>
        <div class="img"><img src="(img3)" alt="" /></div>
      </div>
      <div class="col side-2">
        <div class="img"><img src="(img4)" alt="" /></div>
        <div class="img"><img src="(img5)" alt="" /></div>
        <div class="img"><img src="(img6)" alt="" /></div>
      </div>
      <div class="col main">
        <div class="img"><img src="(img7)" alt="" /></div>
        <div class="img main"><img src="(img8)" alt="" /></div>   <!-- focal image -->
        <div class="img"><img src="(img9)" alt="" /></div>
      </div>
      <div class="col side-3">
        <div class="img"><img src="(img10)" alt="" /></div>
        <div class="img"><img src="(img11)" alt="" /></div>
        <div class="img"><img src="(img12)" alt="" /></div>
      </div>
      <div class="col side-4">
        <div class="img"><img src="(img1)" alt="" /></div>   <!-- reuse img1–img3 -->
        <div class="img"><img src="(img2)" alt="" /></div>
        <div class="img"><img src="(img3)" alt="" /></div>
      </div>
    </div>
  </section>

  <!-- Scrolling page content -->
  <div class="container">
    <section class="hero">
      <div class="hero-img"><img src="(hero)" alt="" /></div>
      <div class="header"><h1>serene</h1><h1>drift</h1></div>
    </section>

    <section class="intro">
      <div class="tagline"><p>Inspired visuals for creators of calm and beauty</p></div>
      <div class="divider"></div>
      <div class="intro-header"><h1>elevating</h1><h1>serenity</h1></div>
    </section>

    <section class="ws"></section>   <!-- the tall TRANSPARENT scroll spacer that drives everything -->

    <section class="outro"><h1>crafted calm</h1><h1>and beauty</h1></section>

    <section class="footer">
      <div class="footer-bg"><img src="(footer)" alt="" /></div>
    </section>
  </div>

  <script type="module" src="./script.js"></script>
</body>
```
The JS queries exactly: `.gallery-wrapper`, `.col:not(.main)` (the four side columns), `.img.main img` (the focal image), and `.ws` (the ScrollTrigger trigger). Keep all those class names exact. There are **5 columns × 3 images = 15 gallery slots but only 12 unique gallery files** (`side-4` reuses `img1`–`img3`).

## Styling
Fonts: the original uses two proprietary display faces — headings in **"PP Acma"** (a high-contrast editorial display face) and body/paragraph text in **"PP Neue Montreal"** (a clean neo-grotesque sans). Substitute any similar pair (e.g. a large elegant display serif/grotesque for `h1`, a neutral grotesk / `system-ui` for body); the look is calm, editorial, oversized headings.

Palette (exact hex):
- `#000` — background of the fixed `.sticky` gallery stage.
- `#fff` — fallback background of each image cell, and the hero heading text color.
- `#e1dedc` — warm greige/off-white background of every page section.
- `#05364c` — dark teal/petrol used for text on the intro/outro sections and the divider.

Core CSS:
- Reset `* { margin:0; padding:0; box-sizing:border-box; }`.
- `html, body { width:100%; height:1000vh; }` — **the page is 1000 viewport-heights tall; this long body is what makes the whole thing scrollable.** Body font is the grotesk sans.
- `img { width:100%; height:100%; object-fit:cover; }`.
- `h1 { font-family:(display face); font-size:12vw; font-weight:400; line-height:1; letter-spacing:-0.025em; }` — huge.
- `p { font-size:17px; font-weight:500; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }`.

Fixed gallery stage:
- `.sticky { position:fixed; top:0; left:0; width:100vw; height:100vh; padding:0; background-color:#000; overflow:hidden; }` — always full-viewport, clipping the oversized grid.
- `.gallery-wrapper { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) scale(1); width:160vw; height:100vh; display:flex; gap:4em; }` — **wider than the viewport (160vw)** and centered; `scale(1)` is the JS-animated resting state.
- `.col { position:relative; flex:1; height:100%; display:flex; flex-direction:column; gap:4em; will-change:transform; }` — each of the 5 columns holds 3 stacked cells.
- `.img { flex:1; overflow:hidden; background-color:#fff; }` — tall portrait-ish cells; `object-fit:cover` fills them.
- `.img.main img { position:relative; transform:scale(2); will-change:transform; }` — **the single focal image starts pre-zoomed at scale 2** (cropped in tight) before JS touches it.

Page content:
- `.container { width:100%; height:100%; }`.
- `section { position:relative; width:100vw; height:100vh; background-color:#e1dedc; padding:2em; }` — every section is one opaque viewport, EXCEPT `.ws` (below). Because these are `position:relative` and come later in the DOM than the fixed `.sticky`, they paint **on top of** it and hide the gallery — the transparent `.ws` is the only window through to it.
- `.hero { display:flex; justify-content:flex-end; align-items:flex-end; }` with `.hero-img { position:absolute; top:0; left:0; width:100%; height:100%; }` (full-bleed background image) and `.header { position:relative; width:100%; display:flex; justify-content:space-between; color:#fff; }` — the two words "serene" / "drift" pinned to opposite ends of the bottom row over the image.
- `.intro { display:flex; flex-direction:column; justify-content:space-between; align-items:center; text-align:center; padding:4em 0; background-color:#e1dedc; color:#05364c; }`; `.divider { width:1.5px; height:30%; background-color:#05364c; }` (thin vertical rule).
- **`section.ws { width:100vw; height:600vh; background-color:transparent; }`** — a **600vh-tall fully transparent spacer**. This is the heart of the effect: as it scrolls past, the fixed gallery behind is visible and being zoomed.
- `.outro { display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; background-color:#e1dedc; color:#05364c; }`.
- `.footer` with `.footer-bg { position:absolute; top:0; left:0; width:100%; height:100%; }` (full-bleed background image).

## GSAP effect (the important part — be exhaustive)

### Lenis + ticker wiring (standard)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

### The single ScrollTrigger
```js
ScrollTrigger.create({
  trigger: ".ws",
  start: "top bottom",   // begins when the top of .ws reaches the bottom of the viewport
  end: "bottom bottom",  // ends when the bottom of .ws reaches the bottom of the viewport
  scrub: 1,              // 1s catch-up smoothing — NOT `true`
  onUpdate: (self) => { /* everything below */ },
});
```
`start:"top bottom"` → `end:"bottom bottom"` means the tracked scroll span equals the full height of `.ws` (600vh). So `self.progress` runs 0 → 1 across those six viewport-heights of scrolling, exactly the window in which the transparent spacer exposes the gallery. There is **no `pin`** — the gallery is `position:fixed`, so it stays put on its own; the spacer just supplies scroll distance and the progress read-out.

### onUpdate — absolute writes every frame
Inside `onUpdate`, re-query the elements and compute from `progress = self.progress`:
```js
const galleryWrapper = document.querySelector(".gallery-wrapper");
const sideCols = document.querySelectorAll(".col:not(.main)");   // the 4 side columns
const mainImg = document.querySelector(".img.main img");         // focal image

const screenWidth = window.innerWidth;
const maxScale = screenWidth < 900 ? 4 : 2.65;

const scale = 1 + self.progress * maxScale;        // 1 → 3.65 (desktop) / 1 → 5 (mobile)
const yTranslate = self.progress * 300;            // 0 → 300 px
const mainImgScale = 2 - self.progress * 0.85;     // 2 → 1.15

galleryWrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
sideCols.forEach((col) => { col.style.transform = `translateY(${yTranslate}px)`; });
mainImg.style.transform = `scale(${mainImgScale})`;
```

Breakdown of the three simultaneous, purely-linear-in-progress motions:
1. **Whole-gallery zoom** — `.gallery-wrapper` keeps its `translate(-50%,-50%)` centering and scales `1 → 1 + maxScale`. Desktop `maxScale = 2.65` (final ~3.65x); if `innerWidth < 900` it jumps to `4` (final ~5x) so the effect still overwhelms the narrower screen. This is the "flying forward through the images" motion.
2. **Side columns drift down** — the four `.col:not(.main)` columns get `translateY(0 → 300px)`, so as the grid enlarges the outer columns slide downward past the frame while the center holds — reinforces the forward-rush parallax. (The center `.col.main` is deliberately excluded so the focal column stays anchored.)
3. **Focal image counter-scale** — `.img.main img` starts CSS-pre-zoomed at `scale(2)` and is driven **down** to `2 - 0.85 = 1.15`. As the overall gallery zooms IN, the focal photo zooms OUT, revealing more of itself — the destination image resolves into view as you arrive at it.

All three are direct linear functions of `progress`; there are **no eases, durations, delays, staggers, timelines, or tweens** anywhere — the floaty feel is entirely `scrub: 1` + Lenis. Everything is fully reversible on scroll-up because each frame is an absolute write, not an accumulation.

No SplitText, no CustomEase, no lerp/rAF loop of your own (Lenis provides the rAF), no Three.js, no canvas.

## Assets / images
All photos are **abstract, painterly, motion-blurred human figures on flat saturated color backgrounds** — thermal/long-exposure editorial art, moody and cinematic. Displayed `object-fit:cover` in tall portrait-ish cells.

- **12 unique gallery images** (`img1`–`img12`), portrait orientation, one per grid cell, e.g.: a motion-blurred figure in profile on teal-blue; a thermal-edge silhouette reaching an arm up on terracotta; a blurred golden figure with raised hands on magenta; an outstretched teal arm on flat red; a solid black arms-spread silhouette on pale yellow; a dark-red smoke swirl on orange; a blue open-armed silhouette on a teal-to-orange gradient; **`img8` = a glowing red dancing nude silhouette, arms out, on an orange-to-magenta gradient — this is the focal image in the center column that scales from 2x down**; ghostly motion-blurred hands on indigo; a blue seated capped figure on green; a glowing pink figure inside a light halo on purple; a golden blurred figure with directional streaks on yellow-to-red. `img1`–`img3` are reused in the 5th column.
- **1 hero background** (`hero`), full-bleed landscape: a moody indigo-violet abstract blur with dark outlined hands/figure reaching through the frame — sits behind the light "serene / drift" heading.
- **1 footer background** (`footer`), full-bleed landscape: a dark-teal thermal profile of a head-and-shoulders looking left.

Any set of cohesive, high-saturation abstract figure images works; the palette should feel jewel-toned and cinematic to match the calm/editorial mood. Neutral demo copy only (no real brands): "serene / drift", "Inspired visuals for creators of calm and beauty", "elevating / serenity", "crafted calm / and beauty".

## Behavior notes
- **Reveal order down the page:** hero (opaque) → intro (opaque) → `.ws` 600vh transparent window where the zoom plays over the fixed gallery → outro (opaque) → footer (opaque). The gallery is only ever seen through the `.ws` gap.
- The `1000vh` body height plus the `600vh` `.ws` spacer set the total scroll length; don't shorten them or the zoom span collapses.
- Mobile: the only branch is `maxScale` becoming `4` under `innerWidth < 900` — everything else is identical. `h1` at `12vw` scales fluidly.
- `will-change:transform` on `.col`, `.gallery-wrapper` (implicitly via constant restyle) and `.img.main img` keeps the per-frame transforms smooth.
- No resize handler, no reduced-motion branch, no pinning in the original.

## Images

This component ships with 14 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/heurebleue-scroll-animation/footer.jpg
https://motionprompts.dev/c/heurebleue-scroll-animation/hero.jpg
https://motionprompts.dev/c/heurebleue-scroll-animation/img1.jpg
https://motionprompts.dev/c/heurebleue-scroll-animation/img10.jpg
https://motionprompts.dev/c/heurebleue-scroll-animation/img11.jpg
https://motionprompts.dev/c/heurebleue-scroll-animation/img12.jpg
… 8 more under https://motionprompts.dev/c/heurebleue-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--night`, `--dusk`, `--pale`, `--slate`, `--amber`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here specifically: two `ScrollTrigger`s reading the same `.ws` spacer and both writing `transform` to the same `.gallery-wrapper` every frame, and two `Lenis` instances fighting over the same wheel event. The visible symptom is a gallery that zooms at roughly double speed, or one that stutters instead of tracking the scrub smoothly — and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

**(1) The entry point.** The script runs at the top level, the moment the module is evaluated — `ScrollTrigger.create(...)`, `new Lenis()` and `gsap.ticker.add(...)` all execute at import time, before any component has rendered a `.gallery-wrapper` or a `.ws` for the trigger to watch. Move the whole body — the trigger, the Lenis instance, and the ticker subscription — into a `useEffect` with an empty dependency array. Do not leave it in the component body: that re-runs on every render and would stack a fresh `ScrollTrigger` and a fresh `Lenis` on top of the ones already driving the page.

**(2) Element lookups.** The `onUpdate` callback re-queries `.gallery-wrapper`, `.col:not(.main)` (the four side columns it translates downward) and `.img.main img` (the focal image it counter-scales) from `document` on every scroll frame, and the trigger is wired to the bare string `".ws"`. All four assume this component owns the whole document. Give the element that renders both `.sticky` and `.container` a root `ref`, scope the three `onUpdate` lookups to it (`rootRef.current.querySelector(".gallery-wrapper")`, and so on), and resolve `trigger` to the actual `.ws` node inside that root instead of letting GSAP resolve a bare selector globally. This is not cosmetic here: during the StrictMode remount there are briefly two `.ws` sections and two `.gallery-wrapper`s in the document, and an unscoped lookup can bind to the copy that is already on its way out, leaving the trigger writing transforms into a detached subtree while the visible gallery never moves.

**(3) Cleanup.** Wrap the `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref and revert it on cleanup — `ctx.revert()` kills the trigger created inside even though it was built with `ScrollTrigger.create` and never produced a tween. Nothing in this effect needs `self.add`: it exposes no method for a later listener to call back into, so keep the factory a plain zero-argument callback rather than naming its parameter `self`. That naming matters more here than in most components, because the script already uses `self` for the one thing `onUpdate` receives — the `ScrollTrigger` instance whose `.progress` drives all three transform writes — and giving the context factory the same name would shadow it one line down.

`gsap.ticker.add((time) => { lenis.raf(time * 1000) })` is neither a tween nor a trigger, so the context does not track it, and `ctx.revert()` alone leaves that callback calling `lenis.raf` on an already-destroyed instance. Keep it in a named variable and remove it explicitly, in the same cleanup that destroys Lenis:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: rootRef.current.querySelector(".ws"),
      start: "top bottom",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => { /* the three transform writes to gallery-wrapper, side cols and the focal image, unchanged */ },
    });
  }, rootRef);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  const syncLenis = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(syncLenis);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(syncLenis);
    lenis.destroy();
    ctx.revert();
  };
}, []);
```

`lenis.destroy()` tears down the `"scroll"` listener registered on it above, along with Lenis's own wheel and touch bindings, so that subscription needs no separate `.off()` — only the ticker callback does, because it lives on `gsap.ticker`, not on the Lenis instance. This component renders the entire page — hero, intro, the `.ws` spacer, outro and footer — so owning a single `Lenis` instance inside this effect is the right default here; only lift it to an app shell if this gallery becomes one section inside a larger React app that already runs its own `Lenis`, in which case drop the `new Lenis()` / `destroy()` pair and reuse the existing instance for the `"scroll"` wiring. `gsap.ticker.lagSmoothing(0)` is a global ticker setting rather than an instance, so calling it again on a StrictMode remount is harmless and needs no counterpart in the cleanup.
