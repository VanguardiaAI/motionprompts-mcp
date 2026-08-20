# Sage East 3D Scroll

## Goal
Build a fixed, full-viewport **3D perspective slider** on a black stage. Ten editorial fashion cards sit at staggered `translateZ` depths inside a CSS `perspective` container and **fly toward the camera as you scroll a very tall (2000vh) page** — like flipping through a deck that keeps rushing out of deep space, alternating left and right. A **per-slide `ScrollTrigger` (scrub)** maps scroll progress to a shared Z increment, recomputes each card's `opacity` with a `mapRange` fade, and **cross-fades a blurred, full-screen background image** (`gsap.to`, `power3.out`) as each card reaches the front so the whole screen glows with the ambient color of the frontmost photo. There is no ScrollTrigger tween and no pinning — the scroll span itself is the timeline, and every transform is written by hand inside `onUpdate`.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** plus the GSAP plugin **`ScrollTrigger`** — nothing else (no Lenis, no SplitText, no CustomEase, no Three.js). Import as:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```
All setup runs inside a single `window.addEventListener("load", …)` so `getComputedStyle` can read each slide's initial `matrix3d`.

## Layout / HTML
Fixed nav and footer overlay a scroll-driven 3D stage. The `.container` is the tall scroll driver; everything visible is `position: fixed` inside it.

```html
<nav>
  <div class="links-1"><a href="#">Works</a><a href="#">Archive</a></div>
  <div class="logo"><a href="#">Modavate</a></div>
  <div class="links-2"><a href="#">Info</a><a href="#">Contact</a></div>
</nav>

<footer>
  <p>Watch Showreel</p>
  <p>Launching 2024</p>
</footer>

<div class="container">
  <!-- blurred ambient background: the SAME 10 images, stacked & full-screen -->
  <div class="active-slide">
    <img src="/img/1.jpg" alt="" />
    … <img> ×10 in order …
  </div>

  <!-- the 3D deck: 10 flying cards -->
  <div class="slider">
    <div class="slide" id="slide-1">
      <div class="slide-copy">
        <p>Neo Elegance°</p>
        <p id="index">( ES 2023 0935 )</p>
      </div>
      <div class="slide-img"><img src="/img/1.jpg" alt="" /></div>
    </div>
    … slide-2 … slide-10 (each with its own copy + image) …
  </div>
</div>
<script type="module" src="./script.js"></script>
```
Ten slides, ids `slide-1` … `slide-10`. Each `.slide` holds a `.slide-copy` (a title `<p>` plus a `<p id="index">` catalog code) and a `.slide-img > img`. Sample titles (fictional): Neo Elegance°, Future Luxe, Cyber Glam, Visionary Threads, Galactic Chic, Tech Sophistication, Avant Edge, Moda Futura, Eco Futurist, Sleek Tomorrow. Index codes read like `( ES 2023 0935 )`, `0936`, … `0944`. Every card also has a **twin image** in `.active-slide`, in the same order, which becomes its blurred background.

## Styling
- **Palette:** `--color-accent: rgb(230, 170, 40)` (warm amber/gold) for all text; page `background: #000`.
- Global reset `* { margin:0; padding:0; box-sizing:border-box }`; `img { width:100%; height:100%; object-fit:cover }`.
- **Type:** all `a`/`p` are `text-transform:uppercase; font-size:12px; color:var(--color-accent)`, font family a neutral grotesque (original uses "Basis Grotesque Pro" — substitute any clean sans, e.g. system-ui/Helvetica). The `.logo a` and slide titles use an **extended display font** (original "PP Monument Extended" — substitute any wide/extended weight, or a bold condensed-inverse feel): logo `16px`, `font-weight:bolder`, `letter-spacing:-0.02em`; slide title `13px`, `bolder`, `line-height:150%`, centered. `p#index` uses the grotesque at `11px`, `font-weight:400`, `margin-bottom:0.75em`.
- **nav:** `position:fixed; top:0; width:100%; padding:1.5em 2em; display:flex; align-items:center`. Its three `> div` children each `flex:1`; `.links-1`/`.links-2` are `display:flex; gap:2em` (links-2 justified flex-end); `.logo` centers its link.
- **footer:** `position:fixed; bottom:0; width:100%; padding:1.5em 2em; display:flex; justify-content:space-between; align-items:center`.
- **.container:** `width:100%; height:2000vh` — the scroll length that drives the whole effect.
- **.active-slide** (ambient backdrop): `position:fixed; inset:0; width:100%; height:100%; overflow:hidden; background:#000; opacity:0.35; z-index:-1`. Its `img`s are `position:absolute; filter:blur(50px); transform:scale(1.125)` — stacked full-screen; the frontmost non-faded one shows through as a soft, out-of-focus color wash.
- **.slider** (the 3D camera): `position:fixed; top:0; width:100vw; height:100vh; overflow:hidden; transform-style:preserve-3d; perspective:750px`. **This `perspective:750px` is the lens** — it makes the deep negative-Z slides read as tiny far-away specks that balloon to full size as they approach `z:0`.
- **.slide:** `position:absolute; width:400px; height:500px; overflow:hidden` (a 4:5 card).

### Initial slide placement (critical — the JS reads these back)
Each `#slide-N` is absolutely positioned at `top:50%`, with `transform:translateX(-50%) translateY(-50%) translateZ(<Zn>px)`. Odd slides sit at `left:70%`, even slides at `left:30%` — so as they rush forward they **alternate right / left** of center. The Z depths step by **+2500px**, deepest first:

| slide | left | translateZ | opacity |
|------|------|-----------|---------|
| 1 | 70% | −22500px | 0 |
| 2 | 30% | −20000px | 0 |
| 3 | 70% | −17500px | 0 |
| 4 | 30% | −15000px | 0 |
| 5 | 70% | −12500px | 0 |
| 6 | 30% | −10000px | 0 |
| 7 | 70% | −7500px | 0 |
| 8 | 30% | −5000px | 0 |
| 9 | 70% | −2500px | 0.5 |
| 10 | 30% | 0px | 1 |

Only slides 9 (`opacity:0.5`) and 10 (`opacity:1`) are visible at rest; everything else is fully transparent far away. Slide 10 is the hero at the camera plane; slide 9 is the half-faded one just behind it.

## GSAP effect (the important part — be exhaustive)

### Two helpers
```js
// read the CURRENT translateZ out of the computed matrix3d (m43 = 15th value, index 14)
function getInitialTranslateZ(slide) {
  const style = window.getComputedStyle(slide);
  const matrix = style.transform.match(/matrix3d\((.+)\)/);
  if (matrix) {
    const values = matrix[1].split(", ");
    return parseFloat(values[14]) || 0;   // the z translation, e.g. -22500 … 0
  }
  return 0;
}

// plain linear remap
function mapRange(value, inMin, inMax, outMin, outMax) {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
```

### One ScrollTrigger per slide
```js
const slides = gsap.utils.toArray(".slide");
const activeSlideImages = gsap.utils.toArray(".active-slide img");

slides.forEach((slide, index) => {
  const initialZ = getInitialTranslateZ(slide);   // -22500 for slide1 … 0 for slide10

  ScrollTrigger.create({
    trigger: ".container",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const progress = self.progress;             // 0 → 1 across the full 2000vh
      const zIncrement = progress * 22500;         // every slide travels +22500px in Z
      const currentZ = initialZ + zIncrement;

      // opacity from depth, in two linear bands
      let opacity;
      if (currentZ >= -2500) {
        opacity = mapRange(currentZ, -2500, 0, 0.5, 1);   // near front: 0.5 → 1
      } else {
        opacity = mapRange(currentZ, -5000, -2500, 0, 0.5); // approaching: 0 → 0.5
      }
      slide.style.opacity = opacity;

      // write the live depth
      slide.style.transform =
        `translateX(-50%) translateY(-50%) translateZ(${currentZ}px)`;

      // cross-fade THIS slide's blurred background twin
      if (currentZ < 100) {
        gsap.to(activeSlideImages[index], 1.5, { opacity: 1, ease: "power3.out" });
      } else {
        gsap.to(activeSlideImages[index], 1.5, { opacity: 0, ease: "power3.out" });
      }
    },
  });
});
```

### Exactly how it reads on screen
- **Trigger / span:** `trigger:".container"`, `start:"top top"`, `end:"bottom bottom"`, `scrub:true`. There is **no tween attached** and **no pin** — `onUpdate` is the whole animation. `self.progress` runs 0→1 over the 1900vh of real scroll, and `scrub:true` keeps `progress` glued to the scrollbar so the deck tracks the wheel directly (no lag, no autoplay).
- **Shared Z increment:** every slide adds the *same* `progress * 22500` to its own `initialZ`. Because the ten `initialZ` values are spaced 2500px apart, the cards **arrive at the camera one after another**, evenly staggered — a rolling procession, not a single move. At `progress:1` slide-1 lands exactly at `z:0` (its start −22500 + 22500) while slide-10 has flown to `z:22500` (blown past the lens and clipped away).
- **Opacity bands (`mapRange`):** a slide is invisible until it's within 5000px of the front. From `z:−5000 → −2500` opacity ramps `0 → 0.5`; from `z:−2500 → 0` it ramps `0.5 → 1`; at/after `z:0` `mapRange(currentZ,-2500,0,0.5,1)` keeps returning ≥1 so it stays full-opacity as it rushes through and past the viewer. This is why slide-9 starts at 0.5 and slide-10 at 1 — the formula evaluated at their resting Z.
- **Ambient background cross-fade:** each slide owns the same-index image inside `.active-slide`. While a slide is at or in front of the lens (`currentZ < 100`) its blurred twin fades **in** to `opacity:1`; once it passes (`currentZ ≥ 100`) the twin fades **out** to `0` — both over **1.5s with `power3.out`**. The `.active-slide` images are stacked full-screen, `blur(50px) scale(1.125)`, inside a container at `opacity:0.35`, so what you actually see is a soft, defocused wash of the frontmost card's colors bleeding across the whole black screen, hand-off blending from one photo to the next as the deck advances.
- **Transform authored by hand:** `slide.style.transform` and `slide.style.opacity` are set imperatively every `onUpdate`; GSAP is only used for the 1.5s background tweens. No timeline, no labels, no stagger config — the *stagger is baked into the initial Z offsets*, and the *easing of the flight is linear* (direct scrub), with the only eased tween being the `power3.out` background fade.

## Assets / images
**10 editorial fashion photographs**, portrait orientation ~**2:3** (each shown twice: once as a crisp `400×500` 4:5 card via `object-fit:cover`, once as a full-screen `blur(50px)` background twin). Keep them a cohesive but varied high-fashion set with a warm, saturated, editorial mood, e.g.: tight **profile-portrait headshots on flat saturated backdrops** (violet, cobalt blue); **full-length couture looks on a solid color seamless** (a deep-red gown/coat against electric blue); **motion / twirl garment shots** in a neutral studio (a beige wool coat caught mid-spin); **backlit, soft-focus portraits among blossoms** (hazy pastel bloom); and **flowing silk-fabric abstractions on pastel grounds** (amber/orange satin ribboning across teal). Provide 10 files named `1.jpg … 10.jpg`; if fewer are available, repeat in order. No real brand names — use the fictional "Modavate" wordmark and the invented collection titles above.

## Behavior notes
- **Scroll-only, wheel/trackpad/scrollbar driven** — no click, hover, or keyboard; nothing autoplays. At scroll top you see slide-10 sharp and slide-9 half-faded, deep-space behind.
- **Desktop-tuned:** card size and Z depths are fixed px (400×500, up to −22500), and `perspective:750px` is calibrated for a large viewport; there are no responsive breakpoints in the original.
- The **2000vh** page height gives a long, slow reveal — roughly one slide surfacing per ~200vh of scroll.
- No reduced-motion branch in the original; motion is entirely user-driven, but the background fades keep their 1.5s `power3.out` glide after the scroll input.

## Images

This component ships with 10 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/sageeast-3d-scroll/1.jpg
https://motionprompts.dev/c/sageeast-3d-scroll/10.jpg
https://motionprompts.dev/c/sageeast-3d-scroll/2.jpg
https://motionprompts.dev/c/sageeast-3d-scroll/3.jpg
https://motionprompts.dev/c/sageeast-3d-scroll/4.jpg
https://motionprompts.dev/c/sageeast-3d-scroll/5.jpg
… 4 more under https://motionprompts.dev/c/sageeast-3d-scroll/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--amber`, `--amber-dim`, `--bone`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone module that waits for the window `load` event and then, in one pass, spins up ten independent `ScrollTrigger` instances — one per `.slide` — each writing `transform` and `opacity` straight onto its own slide with a plain DOM assignment inside `onUpdate`, and firing a `gsap.to` cross-fade on that slide's `.active-slide` twin. Nothing in the file expects a second copy of itself to exist, and nothing tears anything down. React withdraws that guarantee.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Run this setup twice without reverting the first pass and `.container` ends up carrying twenty `ScrollTrigger`s instead of ten — two per slide, both scrubbing the same "top top" / "bottom bottom" span, both writing `slide.style.transform` on every scroll tick. The visible symptom is a deck that stutters or briefly shows a card at two conflicting depths at once, and it will not reproduce in a production build, because only development double-invokes effects. Treat the cleanup as part of the effect.

*(1) The entry point* — The script waits for `load` before it does anything, but look at what it's actually waiting for: `getInitialTranslateZ` parses each slide's already-CSS-authored `translateZ` back out of `getComputedStyle(slide).transform`. That value comes from the stylesheet rule positioning `#slide-1` … `#slide-10` at their fixed depths — it has nothing to do with the ten background photos or the ten card images having decoded. A `useEffect` already runs after commit, once the DOM carrying those ids exists and the browser has resolved styles against it, so the read is safe with no wait at all — as long as the stylesheet defining those rules ships as an ordinary global import rather than something lazy-loaded after this component mounts, which holds for every component in this catalogue. Drop the `window.addEventListener("load", …)` wrapper and move its body straight into a `useEffect` with an empty dependency array; unlike the load-event components here where the measurement genuinely depends on an image's decoded box, there is no cancellable-wait step to add.

*(2) Element lookups* — `.container` is the element the trigger measures ("top top" to "bottom bottom" across its full scroll length), and it's also the natural root: every animated node — the ten `.slide`s and the ten `.active-slide img` twins — descends from it, while `nav` and `footer` sit outside it as fixed overlays GSAP never touches. Make `.container` the root ref, resolve both `gsap.utils.toArray` calls off it, and pass the node directly as the trigger instead of the string `".container"`. The scoping matters more here than a class lookup usually would, because the two arrays are paired only by index — `activeSlideImages[i]` is slide `i`'s ambient twin, with no `id` or `data-*` linking them — so a stray unscoped query picking up a leftover `.active-slide img` from the outgoing copy during the StrictMode remount would still "work" positionally while cross-fading the wrong photo behind the wrong card.

*(3) Cleanup — GSAP / ScrollTrigger* — Wrap the whole `slides.forEach` loop — all ten `ScrollTrigger.create` calls — in one `gsap.context` scoped to the root ref, and revert it in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    const slides = gsap.utils.toArray(".slide", containerRef.current);
    const activeSlideImages = gsap.utils.toArray(".active-slide img", containerRef.current);

    slides.forEach((slide, index) => {
      const initialZ = getInitialTranslateZ(slide);
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (st) => {
          /* progress → currentZ → opacity, exactly as above (via st.progress); writes
             slide.style.transform and slide.style.opacity directly */
          self.add(() => {
            gsap.to(activeSlideImages[index], { opacity: currentZ < 100 ? 1 : 0 });
          });
        },
      });
    });
  }, containerRef);
  return () => ctx.revert();
}, []);
```

One `ctx.revert()` kills all ten triggers together, instead of ten teardowns to track individually. The `self.add()` around the ambient-fade tween is doing real work, not defensive boilerplate: most `onUpdate` firings happen on a scroll tick, long after the context's own synchronous setup pass has returned, so a bare `gsap.to(activeSlideImages[index], …)` call inside it would be created *outside* that pass and invisible to `ctx.revert()` — the same distinction as the plugin note above about `self.add`, just reached from a scroll callback instead of a click handler. Reaching for `self` — the argument `gsap.context` already handed the factory — instead of the closed-over `ctx` variable is not a style choice: ScrollTrigger also invokes `onEnter`/`onUpdate` synchronously the moment a trigger is created or refreshed, still inside that same synchronous setup pass, so a reference to `ctx` from inside `onUpdate` can hit the exact "Cannot access 'ctx' before initialization" crash that a synchronous reference in the factory body would; `self` cannot, because it's already in scope by the time the factory runs. The ScrollTrigger callback's own parameter is renamed `st` here for the same reason, in reverse: this component's vanilla version calls it `self` too (`onUpdate: (self) => …`, reading `self.progress`), and that name would otherwise shadow the context's `self` for the whole callback body. Skip the wrap and the failure is narrow but real: a card's ambient fade that was mid-flight the instant a StrictMode unmount lands keeps writing opacity onto that `<img>` for the rest of the same fade this effect already uses, independent of the `ScrollTrigger` that spawned it and unreachable by the `ctx.revert()` that killed it.
