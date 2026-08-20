# Telescope Image Scroll Animation

## Goal

Build a scroll-driven "telescope" hero: a pinned full-screen banner where an image container scales up from 0 while six stacked copies of the same photo — each clipped by a silhouette-shaped CSS mask — grow at staggered scales, producing a lens-within-a-lens telescoping depth effect. Two large intro words slide apart horizontally and a centered headline fades in word-by-word near the end of the scrub.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm), plus the GSAP plugins `ScrollTrigger` and `SplitText`, and `lenis` for smooth scrolling. No frameworks, no build-specific code — plain `import` statements at the top of `script.js`.

## Layout / HTML

Three full-viewport sections in `<body>`:

1. `<section class="hero">` — a centered `<h1>` with the text "The frame is only the beginning."
2. `<section class="banner">` — the animated section. Inside:
   - `<div class="banner-img-container">` containing, in this order:
     - **7 image layers**, each `<div class="img"><img src="..." alt="" /></div>`. All 7 use the **same photo**. The **first** layer has only class `img` (the unmasked base). The remaining **6** have class `img mask` (silhouette-masked copies).
     - `<div class="banner-header"><h1>The Season Wears Confidence</h1></div>` — the headline that reveals word-by-word.
   - `<div class="banner-intro-text-container">` with two children:
     - `<div class="banner-intro-text"><h1>Surface</h1></div>`
     - `<div class="banner-intro-text"><h1>Layered</h1></div>`
3. `<section class="outro">` — a centered `<h1>` with the text "And that’s the silhouette."

Load `script.js` with `<script type="module" src="./script.js"></script>` at the end of `<body>`.

## Styling

- Google Font **Instrument Serif** (`@import` in the CSS, weights regular + italic available; only regular is used). `body { font-family: "Instrument Serif", sans-serif; }`.
- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `img { width: 100%; height: 100%; object-fit: cover; will-change: transform; }`.
- `h1 { font-size: 4rem; line-height: 1.1; }`.
- Every `section`: `position: relative; width: 100vw; height: 100svh; background-color: #e3e3db; color: #141414; overflow: hidden;`.
- `.hero` and `.outro`: flex, centered both axes; their `h1` is `width: 50%; text-align: center;`.
- `.banner-img-container`: `position: relative; width: 100%; height: 100%; will-change: transform;`.
- `.banner-img-container .img`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; will-change: transform;` (all 7 layers stack on top of each other).
- `.banner-img-container .img.mask`: apply the silhouette PNG as a CSS mask —
  `mask-image: url(<mask png>)` (plus `-webkit-mask-image`), `mask-size: cover`, `mask-position: center` (with `-webkit-` prefixed equivalents). The masked copies only show the photo through the silhouette shape.
- `.banner-header`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 75%; text-align: center; color: #e3e3db; z-index: 2;` (light text over the photo).
- `.banner-intro-text-container`: `position: absolute; top: 50%; transform: translateY(-50%); width: 100%; display: flex; gap: 0.5rem; z-index: 10;`.
- `.banner-intro-text`: `flex: 1; position: relative; will-change: transform;`. The first one gets `display: flex; justify-content: flex-end;` so the two words ("Surface" / "Layered") sit side by side at the exact horizontal center of the viewport, separated only by the 0.5rem gap.
- Media query `@media (max-width: 1000px)`: `.hero h1`, `.outro h1` and `.banner-header` become `width: calc(100% - 4rem);`.

## GSAP effect (exhaustive)

Everything runs inside a `DOMContentLoaded` listener.

### Setup

1. `gsap.registerPlugin(ScrollTrigger, SplitText)`.
2. **Lenis wiring** (standard pattern):
   ```
   const lenis = new Lenis();
   lenis.on("scroll", ScrollTrigger.update);
   gsap.ticker.add((time) => { lenis.raf(time * 1000); });
   gsap.ticker.lagSmoothing(0);
   ```
3. Grab references:
   - `bannerContainer` = `.banner-img-container`
   - `bannerIntroTextElements` = `gsap.utils.toArray(".banner-intro-text")` (2 elements)
   - `bannerMaskLayers` = `gsap.utils.toArray(".mask")` (the 6 masked layers, in DOM order)
   - `bannerHeader` = `.banner-header h1`
4. **SplitText**: `new SplitText(bannerHeader, { type: "words" })`; keep `splitText.words`. Immediately `gsap.set(words, { opacity: 0 })`.
5. **Initial states**:
   - Each mask layer `i` (0-based over the 6 masked layers): `gsap.set(layer, { scale: 0.9 - i * 0.2 })` → scales 0.9, 0.7, 0.5, 0.3, 0.1, −0.1. (Yes, the last value is negative — keep the formula exactly; it's what creates the deepest layer popping in late.)
   - `gsap.set(bannerContainer, { scale: 0 })` — the whole banner starts collapsed to a point.

### ScrollTrigger

One single `ScrollTrigger.create({...})` — **no tweens, no timeline**. All motion is applied imperatively with `gsap.set` inside `onUpdate` from `self.progress` (a scrubbed progress value 0→1):

```
trigger: ".banner",
start: "top top",
end: `+=${window.innerHeight * 4}px`,   // pinned for 4 viewport heights
pin: true,
pinSpacing: true,
scrub: 1,
```

### onUpdate logic (per frame, `progress` = `self.progress`)

1. **Container zoom**: `gsap.set(bannerContainer, { scale: progress })` — linear 0 → 1 across the whole pin distance.
2. **Telescoping mask layers**: for each masked layer `i`:
   - `initialScale = 0.9 - i * 0.2`
   - `layerProgress = Math.min(progress / 0.9, 1.0)` (layers finish converging at 90% of the scrub)
   - `currentScale = initialScale + layerProgress * (1.0 - initialScale)`
   - `gsap.set(layer, { scale: currentScale })`
   - Net effect: every layer interpolates linearly from its staggered initial scale to exactly 1.0 by `progress = 0.9`, so the silhouette copies converge onto the base image.
3. **Intro words slide apart** (only while `progress <= 0.9`):
   - `textProgress = progress / 0.9`
   - `moveDistance = window.innerWidth * 0.5`
   - first intro text: `gsap.set(el, { x: -textProgress * moveDistance })` (moves left, off-screen)
   - second intro text: `gsap.set(el, { x: textProgress * moveDistance })` (moves right, off-screen)
4. **Headline word-by-word reveal** (window `0.7 <= progress <= 0.9`):
   - `headerProgress = (progress - 0.7) / 0.2` (normalized 0→1 inside the window)
   - For each word `i` of `totalWords`:
     - `wordStartDelay = i / totalWords`, `wordEndDelay = (i + 1) / totalWords`
     - if `headerProgress >= wordEndDelay` → opacity 1
     - else if `headerProgress >= wordStartDelay` → opacity = `(headerProgress - wordStartDelay) / (wordEndDelay - wordStartDelay)` (linear fade within the word's own slice)
     - else opacity 0
     - Apply with `gsap.set(word, { opacity: ... })` — a sequential left-to-right cascade fully driven by scroll.
   - Guard rails: if `progress < 0.7` set all words to opacity 0; if `progress > 0.9` set all words to opacity 1 (so scrolling backwards/forwards past the window snaps correctly).

There are no eases, durations, delays or staggers anywhere — every value is a direct linear function of scroll progress (the only smoothing comes from `scrub: 1` and Lenis inertia).

## Assets / images

- **1 editorial photo** (JPG): a full-bleed studio portrait of a single person against a bold solid-color backdrop, roughly 4:5/portrait framing, displayed with `object-fit: cover` filling the viewport. This same file is used in all 7 image layers.
- **1 silhouette alpha mask** (PNG): the silhouette of the same figure (head, hair, shoulders, arms) as a solid opaque shape on a fully transparent background. It is applied via CSS `mask-image` with `mask-size: cover; mask-position: center`, so only the silhouette area of the masked photo copies is visible. For the effect to read well, the silhouette should roughly match the subject's pose/position in the photo.

## Behavior notes

- The banner is pinned for 4 extra viewport heights (`pinSpacing: true`), so total page scroll ≈ hero (100svh) + banner pin (100svh + 4×innerHeight) + outro (100svh).
- Scrolling back up fully reverses everything (all state is derived from `progress`).
- `will-change: transform` on the container, layers, images and intro texts keeps the constant `gsap.set` scaling smooth.
- `end` and `moveDistance` read `window.innerHeight`/`window.innerWidth` once at creation; no resize handling is required.
- Works on mobile (only the text widths change under 1000px).

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/telescope-img-scroll-animation/banner-img-mask.jpg
https://motionprompts.dev/c/telescope-img-scroll-animation/banner-img.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--bg-deep`, `--paper`, `--muted`, `--accent`, `--font-serif`, `--font-sans`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, wires a single `Lenis` instance pumped by a `gsap.ticker` callback, reads its elements once with `document.querySelector`/`gsap.utils.toArray`, and drives every visual in the pinned banner from inside one `ScrollTrigger`'s `onUpdate` — there is no tween or timeline anywhere in this component, only `gsap.set` calls computed straight from `self.progress`. None of it ever has to undo itself, because the page it lives on never unmounts.

React withdraws that guarantee, and quietly. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Mount this twice without tearing the first pass down and you get two `ScrollTrigger`s pinning the same `.banner` section and disagreeing about the same `self.progress`, two `Lenis` instances pulling on the same wheel event, and a second `SplitText` split nested inside the first one on `.banner-header h1`. The visible symptom is the banner snapping between two scales, or the headline words fading in twice as fast as they should, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The whole script — `gsap.registerPlugin(ScrollTrigger, SplitText)`, the `Lenis` construction and ticker wiring, the four element lookups, the `SplitText` call, both initial `gsap.set` passes (the six mask layers' staggered scales, the container's), and the single `ScrollTrigger.create` — lives inside `document.addEventListener("DOMContentLoaded", () => {...})`. By the time a React component mounts, that event has already fired, so the listener is registered and never called: the banner never pins, the six mask layers sit at their raw unscaled size instead of their staggered telescope positions, and the headline stays invisible at the opacity its initial `gsap.set` would have given the split words. Nothing throws — there's just no animation to debug. Delete the listener and move its entire body into a `useEffect` with an empty dependency array. Hoist `gsap.registerPlugin(ScrollTrigger, SplitText)` to module scope; it's one-time, app-wide registration, not per-mount state.

*(2) Element lookups* — `document.querySelector(".banner-img-container")`, `document.querySelector(".banner-header h1")`, `gsap.utils.toArray(".banner-intro-text")` and `gsap.utils.toArray(".mask")` are all unscoped, and so is the `trigger: ".banner"` string handed to `ScrollTrigger.create`. Give the component a root ref on the wrapper that renders the hero, banner and outro sections together, and give `.banner` its own second ref (`bannerRef`), since it plays two roles — the section `ScrollTrigger` pins and the element it triggers off of. Pass `bannerRef.current` directly as `trigger` instead of a selector string, and resolve the other four lookups off `rootRef.current`. During the StrictMode remount two copies of this markup exist for an instant; an unscoped `.mask` lookup can hand the six-layer telescope loop the departing copy's layers instead of the ones actually on screen.

*(3) Cleanup* — Wrap the Lenis/ticker wiring, the four lookups, the `SplitText` call, both initial `gsap.set` passes and the `ScrollTrigger.create` in one `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  let lenis, splitText, bannerContainer, bannerMaskLayers, bannerIntroTextElements;
  const onTick = (time) => lenis.raf(time * 1000);

  const ctx = gsap.context(() => {
    lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    bannerContainer = rootRef.current.querySelector(".banner-img-container");
    bannerIntroTextElements = gsap.utils.toArray(
      rootRef.current.querySelectorAll(".banner-intro-text")
    );
    bannerMaskLayers = gsap.utils.toArray(rootRef.current.querySelectorAll(".mask"));
    const bannerHeader = rootRef.current.querySelector(".banner-header h1");

    splitText = new SplitText(bannerHeader, { type: "words" });
    gsap.set(splitText.words, { opacity: 0 });
    // the six mask layers' initial scales, the container's initial scale, and the
    // single ScrollTrigger.create exactly as above, with trigger: bannerRef.current
    // in place of the string
  }, rootRef);

  return () => {
    gsap.ticker.remove(onTick);
    lenis.destroy();
    ctx.revert();
    gsap.set(
      [bannerContainer, ...bannerMaskLayers, ...bannerIntroTextElements],
      { clearProps: "all" }
    );
    splitText.revert();
    gsap.ticker.lagSmoothing(500, 33);
  };
}, []);
```

`ctx.revert()` only reaches what ran synchronously inside that factory: the single `ScrollTrigger` instance (unpinning `.banner`, dropping its pin-spacer, restoring normal flow) and the three initial `gsap.set` calls — the six mask layers' staggered scales, the container's, and the headline words' opacity. It does **not** reach anything `onUpdate` writes, and in this component that's everything the scrub actually does after setup: the container's live scale, the six layers' converging scale, and both intro words' `x` offset are all `gsap.set` calls made from inside the trigger's callback, which fires on scroll events — asynchronously, well after the factory's synchronous pass has already returned. `ctx.revert()` stops those writes from happening again, but it never rolls back the ones already made, so the container, the six masks and the two intro-text elements are left holding whatever scale and offset the last scrubbed frame wrote. The `gsap.set([...], { clearProps: "all" })` call above is what actually removes that residue, and it has to run after `ctx.revert()` — clearing props on a node the trigger is still scrubbing just gets overwritten by the next `onUpdate` tick. The headline words don't need the same treatment: `splitText.revert()` discards their spans outright, so whatever opacity `onUpdate` last painted onto them goes with the spans.

`gsap.ticker.add(onTick)` is what actually drives Lenis's `raf` here — there's no separate `requestAnimationFrame` loop to fold that concern into — and a ticker subscription is neither a tween nor a trigger, so the context has no record of it either. Remove it before calling `lenis.destroy()`, not after: a tick landing between the two calls invokes `.raf()` on an instance that's already torn down. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown; that listener lives on Lenis's own emitter, and `destroy()` clears it as a side effect. Lenis is a document-level resource, not this banner's alone — if it ends up as one section of a larger page rather than the whole document, lift the `new Lenis()` call to the app shell and drive `ScrollTrigger.update` off the shared instance instead of constructing a second one that fights the first over the same wheel event. `gsap.ticker.lagSmoothing(0)` is also global, not scoped to this component — leaving it patched after unmount silently disables lag smoothing for every other GSAP animation running on the rest of the page. Restore GSAP's own default in the same cleanup, as shown above, instead of leaving the zero in place.

`splitText.revert()` runs last, after `ctx.revert()`: the trigger's `onUpdate` calls `gsap.set` on `splitText.words` on every scrubbed frame, and killing the trigger first guarantees nothing is still writing to a word span at the instant the split unwraps `.banner-header h1` back to plain text. Skipping the revert, or getting the order backwards, doesn't just leave stray spans behind — the next mount's `new SplitText(bannerHeader, { type: "words" })` runs against markup that is already wrapped in per-word spans, producing a nested second generation and leaving `splitText.words` pointing at elements one level deeper than the flat structure `onUpdate`'s per-word opacity cascade was written against.
