---
slug: fameestate-scroll-animation
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 1
structural:
  - { kind: duration, literal: "0.16", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# FameEstate Scroll Animation — Pinned Clip-Path Hero Reveal

## Goal
Build a full-screen luxury real-estate hero that is **pinned and scrubbed over seven viewport heights** while a single GSAP timeline plays a cinematic reveal, then hands off to a plain `about` section. In order, as you scroll: the full-bleed background image **zooms out** (scale 1.5 → 1); a mustard-gold panel (the "revealer") **opens from a hair-thin vertical seam at screen center** — first growing top-to-bottom, then wiping outward left-and-right to fill the screen; three full-bleed images **cascade in one after another** from a collapsed center point, each expanding via clip-path while scaling 0 → 1; a gold **outro panel with a heading scales in**, then **splits down the middle into two halves that slide apart** (left half off-screen left, right half off-screen right) to uncover the `about` section beneath. Smooth scroll via Lenis. The whole hero is one scrubbed ScrollTrigger timeline.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**, and `lenis` (npm) for smooth scroll. No other plugins, no framework — plain Vite-style module imports:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```
Register once: `gsap.registerPlugin(ScrollTrigger);`. Run everything inside `document.addEventListener("DOMContentLoaded", …)`.

## Layout / HTML
Two top-level `<section>`s. Class names are load-bearing — the JS/CSS query them.

```html
<section class="hero">
  <div class="hero-bg"><img src="…" alt="" /></div>

  <div class="hero-content">
    <h1>A modern approach to luxury living and timeless spaces</h1>
  </div>

  <div class="hero-revealer"></div>

  <div class="hero-images">
    <div class="hero-img"><img src="…" alt="" /></div>
    <div class="hero-img"><img src="…" alt="" /></div>
    <div class="hero-img"><img src="…" alt="" /></div>
  </div>

  <div class="hero-outro-content">
    <h1>Thoughtfully crafted spaces designed to inspire modern living connections</h1>
  </div>
</section>

<section class="about">
  <div class="about-content">
    <h3>Designing digital experiences that feel effortless</h3>
    <p>From initial concept to final detail, every element is considered with purpose and clarity</p>
  </div>
</section>
```

Notes:
- `.hero-images` holds exactly **3** `.hero-img` wrappers (each with one `<img>`).
- `.hero-outro-content` is a single element in the markup — the JS **clones it at runtime** and turns the pair into left/right halves (see GSAP section). Both the original and the clone keep the `hero-outro-content` class.
- Use the neutral editorial copy above verbatim (uppercase real-estate/design prose). "FameEstate" is the fictional demo brand — no real client names.

## Styling
Font (Google Fonts): **DM Sans** — import the full optical-size/weight axis:
```css
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap");
```

Palette (CSS variables):
- `--base-100: #f0f0e6` — page background (warm off-white/cream); also the text color on the hero panels.
- `--base-200: #997f1f` — mustard/olive-gold; the color of BOTH the `hero-revealer` and the `hero-outro-content` panel.
- `--base-300: #0f0f0f` — near-black; the `about` section text color.

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { font-family:"DM Sans", sans-serif; background-color:var(--base-100); }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1, h3, p { text-transform:uppercase; font-weight:500; line-height:1; }`
- `h1 { font-size: clamp(3rem, 4vw, 5rem); }`
- `h3 { font-size: clamp(2rem, 3vw, 4rem); }`
- `p { font-size: 1.1rem; }`

`.hero`:
- `position:relative; width:100%; height:100svh; overflow:hidden; z-index:2;` (sits ABOVE the about section, which is `z-index:1`).

Full-cover overlays — `.hero-bg, .hero-content, .hero-revealer, .hero-images` all share:
- `position:absolute; top:0; left:0; width:100%; height:100%; will-change:transform;`

Centered/scaled layers — `.hero-img, .hero-outro-content` share:
- `position:absolute; top:50%; left:50%; width:100%; height:100%;`
- `transform: translate(-50%, -50%) scale(0);` — **both start scaled to zero** (this is the initial state GSAP scales up from).
- `will-change:transform;`

Text panels — `.hero-content, .hero-outro-content`:
- `padding:2rem; display:flex; justify-content:center; align-items:center; text-align:center; color:var(--base-100);`
- Their `h1` is constrained: `.hero-content h1, .hero-outro-content h1 { width:65%; }`.

Panel-specific:
- `.hero-outro-content { background-color: var(--base-200); }` — the gold outro panel.
- `.hero-bg { transform: scale(1.5); }` — **background starts zoomed in 1.5×** (GSAP zooms it out to 1).
- `.hero-revealer { background-color: var(--base-200); clip-path: polygon(49.5% 50%, 50.5% 50%, 50.5% 50%, 49.5% 50%); }` — **initial clip is a 1%-wide, zero-height sliver collapsed at the exact center** (all four points at `y:50%`). Effectively invisible until animated. `will-change:transform` (from the shared rule).
- `.hero-img { clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); will-change:clip-path; }` — **initial clip is a single point at the center** (all four polygon points at `50% 50%`), fully collapsed.

`.about`:
- `position:relative; width:100%; height:100svh; padding:2rem; background-color:var(--base-100); color:var(--base-300); z-index:1;`
- **`margin-top: 500svh;`** — CRITICAL. This 5-viewport gap is the scroll runway the pinned hero consumes (see behavior notes). Without it there is no room to scroll through the pinned timeline.
- `.about-content { width:40%; height:100%; margin:0 auto; display:flex; flex-direction:column; justify-content:space-between; text-align:center; }` (heading at top, paragraph at bottom).

## GSAP effect (the important part — be exact)

### Smooth scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Lenis' scroll events call `ScrollTrigger.update`; Lenis is driven by GSAP's ticker; lag smoothing is off so scrub stays glued to the scroll position.

### DOM prep — clone the outro into two halves
Grab the elements, then clone the outro panel so there are two identical stacked copies, one clipped to each half:
```js
const heroSection       = document.querySelector(".hero");
const heroBackground    = document.querySelector(".hero-bg");
const heroContent       = document.querySelector(".hero-content");
const heroRevealer      = document.querySelector(".hero-revealer");
const heroImagesWrapper = document.querySelector(".hero-images");
const heroImages        = gsap.utils.toArray(".hero-img");        // length 3
const heroOutroContent  = document.querySelector(".hero-outro-content");

const heroOutroClone = heroOutroContent.cloneNode(true);
heroOutroContent.classList.add("hero-outro-left");   // original → left half
heroOutroClone.classList.add("hero-outro-right");    // clone → right half
heroOutroContent.parentNode.appendChild(heroOutroClone);

gsap.set(".hero-outro-left",  { clipPath: "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)" });   // shows LEFT half
gsap.set(".hero-outro-right", { clipPath: "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)" }); // shows RIGHT half
gsap.set(heroImagesWrapper, { scale: 1 });
```
Both halves still carry the `hero-outro-content` class, so a tween targeting `.hero-outro-content` animates BOTH at once. Each is a full-size gold panel clipped to opposite halves; overlapped, they read as one panel with the heading centered.

### The scrubbed timeline (one ScrollTrigger)
```js
const heroScrollTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: heroSection,
    start: "top top",
    end: () => `+=${window.innerHeight * 7}`,   // scrub across 7 viewport heights
    pin: true,
    pinSpacing: false,          // no spacer — the about section's 500svh margin is the runway
    scrub: true,
    invalidateOnRefresh: true,
  },
});
```
This is a **scrub timeline built with explicit position parameters** — every tween below is placed at an absolute time on a 0 → 1.0 timeline (the numbers are relative "seconds" that get linearly mapped to the 7vh scroll distance). **No ease is specified on any tween, so GSAP's default `power1.out` shapes each tween over its own segment.** Add the tweens in this exact order, with these exact positions and durations:

1. **Background zoom-out** — pos `0`, dur `0.5`:
   `heroBackground → { scale: 1 }` (from CSS `scale(1.5)` → `1`). The landscape slowly settles/zooms out over the first half of the timeline.

2. **Revealer seam grows vertically** — pos `0`, dur `0.2`:
   `heroRevealer → { clipPath: "polygon(49.5% 0%, 50.5% 0%, 50.5% 100%, 49.5% 100%)" }`. From the collapsed center sliver to a **1%-wide full-height vertical bar** at screen center — a thin gold seam opening top-to-bottom.

3. **Revealer wipes open horizontally** — pos `0.2`, dur `0.3`:
   `heroRevealer → { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }`. The thin vertical bar expands outward to a full rectangle — the gold panel wipes the screen from center to both edges.

4. **Three images cascade in** — a `forEach` over the 3 `heroImages`, each placed at `cascadeStart + index * cascadeStagger`, where:
   ```js
   const cascadeStart = 0.4;      // first image at 0.40
   const cascadeStagger = 0.04;   // then 0.44, then 0.48
   const cascadeDuration = 0.16;
   ```
   Each tween: `heroImage → { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", scale: 1, duration: 0.16 }`. From the CSS start (`clip-path` collapsed to the center point + `scale(0)`) to a full-rectangle clip at `scale(1)`. Result: each image **irises open from a point at center while scaling up**, one after the other (positions 0.40, 0.44, 0.48), each new image landing on top of the previous.

5. **Outro panel scales in** — pos `cascadeStart + heroImages.length * cascadeStagger + cascadeStagger * 0.5` = `0.4 + 0.12 + 0.02 = 0.54`, dur `0.16`:
   `".hero-outro-content" → { scale: 1 }` (both halves, from CSS `scale(0)` → `1`). The gold heading panel pops in over the last cascaded image.

6. **Hard hide the earlier layers** — pos `0.7` (a `.set`, instantaneous):
   `heroScrollTimeline.set([heroBackground, heroContent, heroRevealer, heroImagesWrapper], { autoAlpha: 0 })`. Background, hero heading, revealer, and the images wrapper all snap invisible so only the gold outro remains.

7. **Section background → transparent** — pos `0.7` (a `.set`):
   `heroScrollTimeline.set(heroSection, { backgroundColor: "transparent" })`. So that when the outro halves part, the `about` section shows through instead of the hero's own background.

8. **Left half slides off left** — pos `0.7`, dur `0.3`:
   `".hero-outro-left" → { xPercent: -150 }`. The left half rockets fully off-screen to the left.

9. **Right half slides off right** — pos `0.7`, dur `0.3`:
   `".hero-outro-right" → { xPercent: 50 }`. The right half slides right by half its width — enough to push its visible (right-half) content off the right edge.

Steps 8 & 9 run simultaneously (both at pos `0.7`), splitting the gold panel down the seam and drawing the two halves apart to unveil the `about` section. The timeline's last tweens end at pos `1.0` (total timeline length = 1.0), exactly as the scrub reaches the end of the 7vh runway.

**No SplitText, no CustomEase, no lerp/rAF interpolation, no Three.js.** The only motion is this single scrubbed, pinned timeline of clip-path / scale / xPercent tweens, all on GSAP's default `power1.out` ease.

## Assets / images
Four **full-bleed landscape photos** (all roughly 16:9, ~1456×816), each rendered at `100%` width/height with `object-fit: cover` so they fill the entire viewport (exact crop doesn't matter — cover handles it). Editorial, cinematic set. Roles:
- **`hero-bg`** — the establishing background that starts zoomed 1.5× and settles to 1. A **golden-hour landscape of misty rolling hills with scattered pine trees**, low fog drifting through the valleys, hazy backlit sun. Dominant colors: warm gold, amber, soft cream sky, muted green.
- **`hero-img` #1** — a **dramatic backlit portrait: the profile silhouette of a person against crossing red spotlight beams** forming an X on a dark stage. Dominant colors: deep black silhouette, intense red and orange glow.
- **`hero-img` #2** — a **product still-life: a plain glossy white cosmetic bottle with a black cap resting on a smooth stone, framed by dried beige gypsophila/baby's-breath flowers** against a neutral taupe backdrop. Dominant colors: soft beige, tan, warm neutral, black accent.
- **`hero-img` #3** — a **coastal landscape: rugged tan sea cliffs dropping into deep blue ocean** at soft evening light, distant headland and a pale cloudy sky. Dominant colors: warm sandstone tan, deep teal-blue water, muted sky.

Describe generically by role and form — no brands. Each `hero-img` irises open from a center point while scaling up, one after another. If you have fewer than four, repeat.

## Behavior notes
- **Desktop-first.** At `max-width: 1000px`, the constrained widths relax to full width: `.hero-content h1, .hero-outro-content h1, .about-content { width: 100%; }`. The pin + scrub effect runs at all sizes.
- **Heights use `svh`** (`100svh`, `margin-top: 500svh`) so mobile browser chrome doesn't break the full-screen layout.
- The **`about` section's `margin-top: 500svh` is the scroll runway** — because the pin uses `pinSpacing: false`, no spacer is inserted, so the document's own height (hero 1vh + 5vh margin + about 1vh ≈ the `+=7*innerHeight` end) must supply the scroll distance. Keep them in sync.
- `invalidateOnRefresh: true` + the function-based `end` recompute the 7vh distance on resize.
- Nothing autoplays; the entire sequence is scroll-scrubbed (`scrub: true`), so it plays forward as you scroll down and reverses as you scroll up. No reduced-motion handling in the original.
- Keep the `will-change` hints (`transform` on the overlay layers, `clip-path` on `.hero-img`) — they matter for smooth clip-path animation.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/fameestate-scroll-animation/hero-bg.jpg
https://motionprompts.dev/c/fameestate-scroll-animation/hero-img-1.jpg
https://motionprompts.dev/c/fameestate-scroll-animation/hero-img-2.jpg
https://motionprompts.dev/c/fameestate-scroll-animation/hero-img-3.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--cream`, `--fog`, `--pine`, `--pine-deep`, `--ink`, `--gold`, `--gold-deep`, `--base-100`, `--base-200`, `--base-300`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, reaches into the page with `document.querySelector` for `.hero`, `.hero-bg`, `.hero-content`, `.hero-revealer`, `.hero-images` and `.hero-outro-content` (plus `gsap.utils.toArray` for the three `.hero-img` panels), clones that last element in place to build its own left/right halves, and then never has to undo any of it. React withdraws all three of those guarantees at once, and it does it quietly — the pinned reveal scrubs correctly on first load, and the damage only shows up on a second mount or on scrolling back into this route.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component piles up more live state than most before that first unmount can land: a `Lenis` instance, a ticker callback pumping it, one pinned, scrubbed `ScrollTrigger` on `.hero` — and, easiest to forget, a **cloned DOM node** appended next to the original so the outro panel can be split into two halves. A double mount that doesn't undo all of it leaves two `Lenis` instances fighting over the same wheel event, two triggers pinning `.hero` with disagreeing scrub state, and a second `.hero-outro-right` stacked underneath the first, with nothing in the markup to tell them apart. None of this reproduces in a production build — React only double-invokes in development — so treat the teardown below as load-bearing.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`. That guard exists to survive being loaded late into a plain document; `useEffect` already runs after the DOM is committed, so it is dead weight here. Drop the guard and the listener, and move the whole body — the Lenis wiring, the outro clone, the `gsap.set` calls and the scrub timeline — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can stay at module scope; repeating it on every mount is harmless but pointless.

*(2) Element lookups* — Six lookups resolve straight into named variables (`heroSection`, `heroBackground`, `heroContent`, `heroRevealer`, `heroImagesWrapper`, `heroOutroContent`), and a seventh, `gsap.utils.toArray(".hero-img")`, resolves to an array of three — all of them assume this component owns the document. Give the component a root `ref` on `.hero` and resolve every one of them off it instead of off `document`. The timeline then retargets three of these same elements a **second time**, by raw class string — `".hero-outro-content"`, `".hero-outro-left"`, `".hero-outro-right"` — rather than through the variables already in scope, because the clone and its class don't exist yet at the point those variables are captured. Scope those three strings too, off the same root, and do it after the clone has been appended: a document-wide class lookup will happily match a clone a previous, incompletely-cleaned mount left behind, or a second copy of this hero elsewhere on the page — and `.hero-outro-content` alone matches both halves at once, by design, so the wrong match here silently animates two panels instead of one.

*(3) Cleanup* — Wrap the Lenis wiring, the clone, the `gsap.set` calls and the scrub timeline in a `gsap.context` scoped to the root ref, and revert it on cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis wiring, the outro clone, gsap.set calls, the pinned scrub timeline
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills the timeline and its `ScrollTrigger`, and reverts every inline style the nine tweens and two instantaneous `.set` calls above wrote: the background's scale, both revealer clip-paths, all three image clip-paths and scales, both outro halves' scale and `xPercent`, and the `autoAlpha`/`backgroundColor` sets partway through the run. Because this trigger uses `pinSpacing: false`, there is no auto-inserted pin-spacer for the revert to remove — the scroll runway instead comes from the sibling `.about` section's own oversized top margin, which lives outside this effect and outside `ctx.revert()`'s reach entirely. If the hero and `about` end up owned by different components, that margin has to stay sized to match the pinned scroll distance by hand; nothing in this effect enforces the relationship, so letting one drift from the other either strands unreachable scroll space or clips the reveal before its last tween lands.

What `ctx.revert()` will **not** touch, under any circumstance, is the clone itself: `heroOutroContent.cloneNode(true)` followed by `appendChild` is a plain DOM mutation, not a tween or a trigger, so the context never records it. This is the one thing worth double-checking by hand — remove the clone explicitly and undo the `hero-outro-left` class the effect added to the original, so a remount starts from the same single, unmodified `.hero-outro-content` the markup shipped with:

```jsx
return () => {
  heroOutroClone.remove();
  heroOutroContent.classList.remove("hero-outro-left");
  ctx.revert();
};
```

Skip it and every remount glues one more `.hero-outro-right` underneath the last — invisible while the outro panel is still one solid gold rectangle covering the seam, and only obvious once the halves slide apart and there turn out to be more of them doing it than there should be.

`ctx.revert()` also doesn't reach the ticker subscription — a callback handed to `gsap.ticker.add` is neither a tween nor a trigger, and as written it's an inline arrow function, so there is nothing to hand `gsap.ticker.remove` unless you name it first. Declare it inside the effect, keep the reference, and remove it in the same cleanup, before destroying Lenis, so no tick still in flight calls `.raf()` on an instance you have already torn down:

```jsx
const onTick = (time) => { lenis.raf(time * 1000); };
gsap.ticker.add(onTick);
// cleanup, in order:
gsap.ticker.remove(onTick);
lenis.off("scroll", ScrollTrigger.update);
lenis.destroy();
ctx.revert();
```

`new Lenis()` here is constructed fresh for this one hero with nothing shared, which is fine as long as `.hero` is the only scroll-driven thing on the page. If this ships as one section inside a larger app, lift the instance to the app shell and have this effect subscribe to the existing one instead of standing up a second smooth-scroller that fights the first over the same wheel input.
