# Voltlites Scroll Animation — Pinned Hero Zoom-Out Reveal

## Goal
Build a full-screen dark hero that is **pinned for four viewport heights** while a giant **3×3 spotlight image grid** (300% of the viewport, 300svh tall) **zooms out** from the center. As you scroll: the whole grid scales `1 → 0.5` while every image **counter-zooms** `1.25 → 1` (so the images stay full-bleed inside their cells as the grid shrinks); a **fixed brand logo** shrinks from a huge `6×` (`2×` on mobile) down to `1×` and **travels from the bottom-left corner up toward the top**; a small **footer tagline blurs and fades away** early; and a centered **SplitText headline reveals word-by-word** followed by a CTA button, each fading in as you scroll. When the next section reaches the viewport, a second scrubbed trigger **slides the whole hero up 25% under a darkening black overlay** as an exit parallax. All of it is driven by **manual `lerp` + `mapRange` math inside `onUpdate`** (not scrub tweens), with Lenis smooth scroll.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`ScrollTrigger`** and **`SplitText`**, and `lenis` (npm) for smooth scroll. No framework — plain Vite-style module imports:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
```
Register once: `gsap.registerPlugin(ScrollTrigger, SplitText);`. (SplitText is a now-free GSAP plugin.)

## Layout / HTML
Three top-level `<section>`s: `.hero`, `.studio`, `.connect`. A `.logo` div sits outside the sections as a fixed overlay. Class names are load-bearing — the JS/CSS query them.

```html
<div class="logo"><img src="…" alt="" /></div>

<section class="hero">
  <div class="hero-inner">
    <div class="hero-spotlight-gallery">
      <!-- exactly 3 columns, each with exactly 3 items = 9 images total -->
      <div class="hero-spotlight-col">
        <div class="hero-spotlight-item"><img src="…" alt="" /></div>
        <div class="hero-spotlight-item"><img src="…" alt="" /></div>
        <div class="hero-spotlight-item"><img src="…" alt="" /></div>
      </div>
      <div class="hero-spotlight-col"> …3 items… </div>
      <div class="hero-spotlight-col"> …3 items… </div>
    </div>

    <div class="hero-header">
      <h3>A living catalogue of images that shouldn't exist, collected frame by frame from the edge of the real.</h3>
      <a href="#" class="btn">Request Access</a>
    </div>

    <div class="hero-footer">
      <h5>An archive of the unreal</h5>
    </div>
  </div>
  <div class="hero-overlay"></div>
</section>

<section class="studio"><h1>Studio</h1></section>
<section class="connect"><h1>Connect</h1></section>
```

Notes:
- `.hero-spotlight-gallery` contains exactly **3** `.hero-spotlight-col`, each with exactly **3** `.hero-spotlight-item` (each item wraps one `<img>`) → **9 images** in a 3×3 grid.
- The copy is neutral/fictional (an uncanny-image "archive" concept). Use it verbatim; no real brand names. The logo is a fictional studio wordmark.

## Styling
Font (Google Fonts): **Plus Jakarta Sans**, full weight axis + italics:
```css
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap");
```

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `body { font-family:"Plus Jakarta Sans", sans-serif; }`
- `h1, h3, h5 { font-weight:500; line-height:1.25; letter-spacing:-4%; }`
- `h1 { font-size: clamp(2rem, 4vw, 6rem); }`
- `h3 { font-size: clamp(1.5rem, 2.5vw, 3.5rem); }`
- `h5 { font-size: clamp(1.25rem, 2vw, 2.75rem); }`

Palette:
- Hero background `#0f0f0f` (near-black).
- Studio section `#58634a` (muted olive/sage), Connect section `#1c1f14` (very dark green). Both center white text.
- CTA button `a.btn`: `color:#000; background-color:#c4d600` (bright **chartreuse/lime**); `padding:1rem 2rem; border-radius:0.25rem; font-weight:500; width:max-content; will-change:opacity; opacity:0` (starts invisible — GSAP fades it in).

Sections:
- `section { position:relative; width:100%; height:100svh; overflow:hidden; }`
- `.studio, .connect { display:flex; justify-content:center; align-items:center; text-align:center; color:#fff; }`
- **`.studio { margin-top: 300svh; }`** — CRITICAL. This 3-viewport gap (added on top of the hero's own 100svh) is the scroll runway the pinned hero consumes. Without it there is no room to scroll through the pinned sequence.

The spotlight grid (the star of the layout):
- `.hero-spotlight-gallery`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) scale(1); width:calc(300% + 2rem); height:calc(300svh + 2rem); display:flex; gap:1rem; will-change:transform;` — a grid **3× the viewport width and 3 viewport-heights tall**, centered on the hero, so at rest only the middle ~1/9 is visible through the hero's `overflow:hidden`.
- `.hero-spotlight-col`: `flex:1; display:flex; flex-direction:column; height:calc(300svh + 2rem); gap:1rem;`
- `.hero-spotlight-item`: `position:relative; flex:1; overflow:hidden;` (each of the 3 cells per column shares the height equally → each cell ≈ one viewport tall).
- `.hero-spotlight-item img`: `position:relative; transform:scale(1.25); will-change:transform;` — **every image starts pre-zoomed 1.25×** (GSAP counter-zooms it back to 1 as the grid shrinks).

Other hero layers:
- `.logo`: `position:fixed; bottom:2rem; left:2rem; width:6rem; display:flex; justify-content:center; align-items:center; transform:translateY(0px) scale(6); transform-origin:bottom left; will-change:transform; z-index:10;` — pinned to the bottom-left corner, **initially blown up 6×** and anchored by its bottom-left origin. (Mobile: `scale(2)`.)
- `.hero-inner`: `position:relative; width:100%; height:100%; will-change:transform;` (the layer the exit parallax translates).
- `.hero-overlay`: `position:absolute; inset:0; width:100%; height:100%; background:#000; opacity:0; will-change:opacity; pointer-events:none;` (the darkening exit veil).
- `.hero-header`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; width:45%; display:flex; flex-direction:column; align-items:center; gap:2rem; color:#fff;` (headline + CTA, centered).
- `.hero-footer`: `position:absolute; bottom:2rem; right:2rem; width:200px; color:#fff; will-change:transform, filter;` (the small tagline that blurs away).

Responsive (`@media (max-width:1000px)`):
- `.logo { transform: translateY(0px) scale(2); }`
- `.hero-header { width:100%; padding:2rem; }`
- `.hero-footer { width:200px; right:unset; left:50%; bottom:20svh; text-align:center; transform:translateX(-50%); }`

## GSAP effect (the important part — be exact)

This component does **NOT** use scrub timelines with tweened durations/eases. Instead each ScrollTrigger reads `self.progress` in an `onUpdate` and drives everything **imperatively via `gsap.set`**, computing intermediate values with two helpers. The "easing" is entirely the piecewise-linear windows defined by `mapRange`.

### Helper functions
```js
const lerp = (from, to, t) => from + (to - from) * t;

const mapRange = (value, rangeStart, rangeEnd) =>
  gsap.utils.clamp(0, 1, (value - rangeStart) / (rangeEnd - rangeStart));
```
`lerp` interpolates a value; `mapRange` remaps `value` from the sub-range `[rangeStart, rangeEnd]` onto `[0, 1]`, clamped. This lets each element run its own progress window inside the single scroll pass.

### Smooth scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### Element handles
```js
const spotlightGallery = document.querySelector(".hero-spotlight-gallery");
const spotlightImages  = document.querySelectorAll(".hero-spotlight-item img"); // 9
const logo             = document.querySelector(".logo");
const heroFooter       = document.querySelector(".hero-footer");
const heroInner        = document.querySelector(".hero-inner");
const heroOverlay      = document.querySelector(".hero-overlay");
const heroButton       = document.querySelector(".hero-header .btn");
```

### SplitText + header fade prep
```js
const headlineSplit = SplitText.create(".hero-header h3", {
  type: "words",
  wordsClass: "word",
});

const headerFadeTargets = [...headlineSplit.words, heroButton]; // every word + the CTA
gsap.set(headerFadeTargets, { opacity: 0 });                    // all start invisible

const headerFadeStep     = (0.6 - 0.1) / headerFadeTargets.length; // stagger step
const headerFadeDuration = headerFadeStep * 3;                     // each fade spans 3 steps (overlapping)
```
Split the headline into **words** (class `word`); the fade set is **all words plus the CTA button**, in DOM order. `headerFadeStep = 0.5 / N` where `N` = number of targets; each target's fade window is 3 steps wide, so windows overlap and the reveal cascades word-by-word.

### Mobile logo start scale (matchMedia)
```js
const MOBILE_BREAKPOINT = 1000;
let logoStartScale = 6;
gsap.matchMedia().add(`(max-width: ${MOBILE_BREAKPOINT}px)`, () => {
  logoStartScale = 2;
  return () => (logoStartScale = 6);
});
```

### ScrollTrigger #1 — the pinned zoom-out (main effect)
```js
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${window.innerHeight * 4}px`, // pinned across 4 viewport heights
  pin: true,
  pinSpacing: false,                    // no spacer — .studio's 300svh margin is the runway
  onUpdate: (self) => {
    const scrollProgress = self.progress; // 0 → 1 across the 4vh pin
    …
  },
});
```
Inside `onUpdate`, compute a shared **`galleryProgress = mapRange(scrollProgress, 0, 0.75)`** — i.e. the grid/image/logo motion **completes at 75%** of the pin, then holds. Then apply, every frame:

1. **Gallery zoom-out** — `galleryScale = lerp(1, 0.5, galleryProgress)`; `gsap.set(spotlightGallery, { scale: galleryScale })`. The 300%×300svh grid scales from `1` down to `0.5`, pulling the outer ring of images into view as it shrinks toward the center.

2. **Image counter-zoom** — `imageScale = lerp(1.25, 1, galleryProgress)`; `gsap.set(spotlightImages, { scale: imageScale })`. All 9 images scale from `1.25` back to `1` in lockstep with the gallery shrink, so each cell stays full-bleed (no gaps) throughout.

3. **Logo shrink + travel** —
   ```js
   const logoScale = lerp(logoStartScale, 1, galleryProgress); // 6→1 (2→1 mobile)
   const oneRem = parseFloat(getComputedStyle(document.documentElement).fontSize);
   const logoScaledHeight = logo.offsetHeight * logoScale;
   const logoTravelDistance = window.innerHeight - logoScaledHeight - oneRem * 4;
   gsap.set(logo, { scale: logoScale, y: -logoTravelDistance * galleryProgress });
   ```
   The logo scales `6 → 1` while its `y` moves **negatively (upward)** by `logoTravelDistance * galleryProgress`. `logoTravelDistance` = viewport height minus the logo's current scaled height minus `4rem` of margin — so the logo rides from its bottom-left home position up to near the top edge, ending small at `1×`. (Anchored by `transform-origin: bottom left`.)

4. **Footer blur-out** — `footerProgress = mapRange(scrollProgress, 0.05, 0.25)` (its own early window, 5%→25% of the pin):
   ```js
   gsap.set(heroFooter, {
     scale:  lerp(1, 0.75, footerProgress),
     filter: `blur(${lerp(0, 20, footerProgress)}px)`,
     opacity: lerp(1, 0, footerProgress),
   });
   ```
   The tagline scales `1 → 0.75`, blurs `0 → 20px`, and fades `1 → 0`, disappearing within the first quarter of the pin.

5. **Headline + CTA word-by-word fade-in** — for each target at `index`:
   ```js
   headerFadeTargets.forEach((target, index) => {
     const targetStart = 0.1 + index * headerFadeStep;
     const targetProgress = mapRange(scrollProgress, targetStart, targetStart + headerFadeDuration);
     gsap.set(target, { opacity: targetProgress });
   });
   ```
   Each word's fade window starts at `0.1 + index*headerFadeStep` and spans `headerFadeDuration` (= 3 steps). Because the step is smaller than the duration, the windows overlap: words fade in `0 → 1` in sequence from ~10% scroll onward, the CTA button (the last target) fading in last around ~60%.

### ScrollTrigger #2 — exit parallax (scrubbed)
```js
ScrollTrigger.create({
  trigger: ".studio",
  start: "top bottom", // when the studio section's top enters the bottom of the viewport
  end: "top top",      // until the studio section's top reaches the top
  scrub: true,
  onUpdate: (self) => {
    const exitProgress = self.progress; // 0 → 1
    gsap.set(heroInner,   { y: `${-25 * exitProgress}%` }); // hero slides up to -25%
    gsap.set(heroOverlay, { opacity: exitProgress });        // black veil 0 → 1
  },
});
```
As the `.studio` section rises into view, the entire `.hero-inner` translates up to `-25%` and the black `.hero-overlay` fades in `0 → 1`, so the hero darkens and parallaxes away beneath the incoming section. `scrub: true` glues this to scroll position (reverses on scroll-up).

**No CustomEase, no Three.js.** The only plugins are ScrollTrigger + SplitText; all motion is `gsap.set` driven by `lerp`/`mapRange` in `onUpdate` (trigger #1 un-scrubbed, trigger #2 scrubbed), plus Lenis smoothing.

## Assets / images
- **Spotlight grid images** — full-bleed with `object-fit:cover`, arranged 3 columns × 3 rows (**9 cells**). The real set is **6 distinct photos, repeated to fill the 3×3** (`cover` handles any crop). All are **landscape/wide (roughly 16:9)** but each cell renders near square through the tall grid, so composition survives heavy cropping. Every frame shares a **cohesive uncanny/surreal editorial mood** — cinematic, dreamlike, "images that shouldn't exist" — but the palette deliberately spans warm and cool so the mosaic feels like a varied collection. The actual subjects and dominant colors:
  1. A fanned metal garden rake laid on **deep crimson/burgundy crushed velvet** — near-black shadows, blood-red highlights (an eerie still life).
  2. A couple sitting up in bed in a dim bedroom — **warm amber lamplight, mustard-yellow quilt, emerald-green curtains** (unsettling domestic scene).
  3. A **salmon/terracotta-pink** Moorish-arched courtyard with a central olive tree and magenta bougainvillea (surreal sunlit architecture).
  4. An editorial portrait in **hard colour contrast** — sharply exposed, saturated light against deep shadow (it replaced a blown-out frame that read as a hole in the mosaic).
  5. A woman in a **white Victorian dress standing between two black swans** on a misty pond bank — muted sage-green water, soft grey fog (folkloric, dreamlike).
  6. A cropped figure in a **painterly multicolor patterned garment** against a flat **bright orange** background — bare arm on hip (bold editorial fashion).
- **1 logo** — a compact **chartreuse (`#C4D600`) SVG wordmark** on a transparent background (a fictional studio mark). It's the element that scales from 6× down to 1×, so keep it a simple, legible wordmark.

## Behavior notes
- **Heights use `svh`** (`100svh`, `margin-top:300svh`, mobile footer `bottom:20svh`) so mobile browser chrome doesn't break the full-screen layout.
- The **`.studio` `margin-top:300svh` is the scroll runway**: with `pinSpacing:false` the pin inserts no spacer, so the hero (100svh) + 300svh margin = the 4-viewport (`window.innerHeight * 4`) pin distance. Keep them in sync.
- **Desktop-first**, but the effect runs at all sizes; the mobile media query only relaxes header width, repositions the footer, and (via matchMedia) starts the logo at `2×` instead of `6×`.
- Nothing autoplays. Trigger #1 is progress-driven (not scrubbed) but still tracks scroll both ways; trigger #2 is scrubbed. Both reverse on scroll-up. No reduced-motion handling in the original.
- Keep the `will-change` hints (`transform` on gallery/images/logo/inner, `transform, filter` on footer, `opacity` on overlay and button) — they matter for smooth per-frame `gsap.set` updates.

## Images

This component ships with 10 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/voltlites-scroll-animation/img1.jpg
https://motionprompts.dev/c/voltlites-scroll-animation/img2.jpg
https://motionprompts.dev/c/voltlites-scroll-animation/img3.jpg
https://motionprompts.dev/c/voltlites-scroll-animation/img4.jpg
https://motionprompts.dev/c/voltlites-scroll-animation/img5.jpg
https://motionprompts.dev/c/voltlites-scroll-animation/img6.jpg
… 4 more under https://motionprompts.dev/c/voltlites-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--moss`, `--moss-deep`, `--bone`, `--bone-dim`, `--gold`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: module-scope code that registers `ScrollTrigger` and `SplitText`, wires a `Lenis` instance pumped by a `gsap.ticker` callback, splits the headline into words, subscribes a `gsap.matchMedia()` query for the logo's mobile start scale, and creates two `ScrollTrigger` instances — the pinned zoom-out on `.hero` and the scrubbed exit parallax keyed off `.studio` — that never have to undo themselves, because the page they live on never unmounts. Neither trigger drives a tween: every value on screen — `spotlightGallery`/`spotlightImages` scale, the logo's scale and `y`, `heroFooter`'s blur/scale/opacity, each headline word's and the CTA's opacity, `heroInner`'s `y`, `heroOverlay`'s opacity — is a `gsap.set` call computed from `self.progress` inside `onUpdate`, reissued on every scroll frame. React withdraws the "runs once, never unmounts" guarantee quietly: the zoom-out and the word-by-word reveal scrub correctly on first load, and the damage only shows up on a second mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Mount this component twice without tearing the first pass down and you get two pins on `.hero`, each `onUpdate` writing conflicting scale and `y` values to the same gallery, images and logo on every scroll tick; two `Lenis` instances both pumping `raf` off the same `gsap.ticker`; a second `SplitText.create(".hero-header h3", …)` run against a headline the first pass already rewrote into `.word` spans, nesting one layer deeper and leaving the first pass's `headerFadeTargets` pointing at spans the new triggers no longer touch; and a second `gsap.matchMedia()` query stacked on the first, both now listening for the same `(max-width: 1000px)` crossing. None of this reproduces in a production build, because React only does the double mount in development.

*(1) The entry point* — the script runs at the top level of the module, the moment it is imported. In React that is before your component has rendered anything, so `.hero-spotlight-gallery`, `.logo` and the rest do not exist yet — every `document.querySelector` above returns `null`, and the first property read off it (`logo.offsetHeight`, in `onUpdate`) throws. Move everything from `const lenis = new Lenis()` through the second `ScrollTrigger.create` into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger, SplitText)` can stay exactly where it is, at module scope — it's one-time, page-wide registration, not per-mount state.

*(2) Element lookups* — every lookup here (`spotlightGallery`, `spotlightImages`, `logo`, `heroFooter`, `heroInner`, `heroOverlay`, `heroButton`, plus the `".hero-header h3"` the split targets) is an unscoped `document.querySelector`/`querySelectorAll`. Give the component a root ref and resolve every one of them off it — but the ref has to reach further than `.hero`: the markup places `.logo` **outside** the three sections, as a fixed sibling, not a descendant. A ref on `<section class="hero">` alone would make `rootRef.current.querySelector(".logo")` come back `null` where the original `document.querySelector` never would — silently killing the shrink-and-travel animation, since nothing downstream throws on a `null` passed to `gsap.set`. Put the ref on the wrapper that contains `.logo`, `.hero` and `.studio` together — `.studio` has to be inside it too, since the second trigger names it directly as `trigger`. During the StrictMode remount two copies of that wrapper exist for an instant, and an unscoped selector can bind the logo's animation to the copy on its way out.

*(3) Cleanup* — wrap the Lenis/ticker wiring, the `matchMedia` query, the split and both `ScrollTrigger.create` calls in one `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, the matchMedia query, SplitText.create,
    // then the two ScrollTrigger.create calls exactly as above
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills both triggers — releasing the pin on `.hero`, stopping the exit scrub on `.studio` — but that is not the whole picture here, because **neither trigger's motion is a tween**. `gsap.context` only adopts calls made during the synchronous pass through the factory above; the one `gsap.set(headerFadeTargets, { opacity: 0 })` that runs during setup qualifies, but the six ongoing writes inside the two `onUpdate` callbacks do not, because each of those calls happens later, from a scroll event, well outside that window. `ctx.revert()` leaves the gallery, the images, the logo, the footer, every word, the CTA, `heroInner` and `heroOverlay` frozen at whatever the last scrub tick wrote. Clear them explicitly, after the revert: `gsap.set([spotlightGallery, ...spotlightImages, logo, heroFooter, ...headerFadeTargets, heroInner, heroOverlay], { clearProps: "all" })`.

**SplitText** — revert `headlineSplit` after `ctx.revert()`, not before: the pinned trigger that writes each word's opacity is still live until the context reverts, and unwrapping the `.word` spans while that write could still land targets a node `SplitText` no longer owns. Skipping the revert is worse: the next mount's `SplitText.create` runs against a headline already wrapped in `.word` spans, nests a second layer of spans inside the first, and the new mount's `headerFadeTargets` — built from the new split's `.words` — reference the inner, freshly created spans, while the first mount's now-orphaned outer spans sit inert in the DOM holding whatever opacity they last had.

**`gsap.matchMedia()`** — this is not covered by `ctx.revert()` in either direction: a `gsap.matchMedia()` instance keeps its own internal context, independent of any `gsap.context` it happens to be created inside. Keep the reference (`const mm = gsap.matchMedia();`) and call `mm.revert()` in the same cleanup — it doesn't matter whether that runs before or after `ctx.revert()`, only that it runs. Skip it and every mount leaks one more `matchMedia` listener for the life of the page, each one still flipping a `logoStartScale` variable that belongs to an effect closure whose triggers are already gone.

**Lenis** — nothing else in this component drives Lenis besides `gsap.ticker.add((time) => lenis.raf(time * 1000))`; there is no separate `requestAnimationFrame` loop to fold that concern into. A ticker subscription is neither a tween nor a trigger, so the context never sees it. Keep the function reference and remove it before destroying the instance, or a tick already in flight calls `.raf()` on a `Lenis` you've just torn down:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
```

`lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — it lives on the Lenis instance's own emitter and goes away with `lenis.destroy()`. `gsap.ticker.lagSmoothing(0)` is a global GSAP setting, not this component's alone; restore GSAP's own default (`gsap.ticker.lagSmoothing(500, 33)`) in the same cleanup, or every other animation on the page keeps running with lag smoothing disabled after this component is gone. Lenis is a document-level resource: this component is written as a full page, so owning the instance here is correct only as long as it stays that way — folded into a larger app, lift `new Lenis()` to the app shell and have this effect subscribe to the existing instance instead of fighting it over the same wheel event.
