---
slug: karim-saab-work-carousel
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 2
structural_literals: 11
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power4.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Fullscreen Work Carousel — Fling-Away / Clip-Path Reveal Slide Transitions

## Goal
Build a fullscreen, one-slide-at-a-time portfolio "work" carousel. Each mouse-wheel tick or touch swipe fires a dramatic GSAP transition: the **outgoing slide shrinks to 25%, rotates 30°, fades out and flings itself two viewport-heights off screen**, while (starting mid-flight) the **incoming slide flies in from the opposite edge inside a cropped clip-path window that opens up to the full frame**. As the new slide lands, its title words and every info line are revealed with **masked SplitText staggers** rising from below. The carousel loops infinitely in both directions.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`SplitText`** (`import { SplitText } from "gsap/SplitText"`, then `gsap.registerPlugin(SplitText)`). No other libraries, no smooth-scroll lib. Ship `index.html`, `styles.css`, and a `<script type="module" src="./script.js">`.

## Layout / HTML
The static HTML is minimal — the body contains only an empty stage:

```html
<body>
  <div class="slider"></div>
</body>
```

All slides are **built at runtime in JS** from a data array of 4 slide objects, each with: `slideTitle`, `slideDescription`, `slideUrl`, `slideTags` (array of 4 strings), `slideImg` (image path). Use exactly this fictional content:

1. **Monochrome Signal** — "A stripped-back visual experience blending luxury fashion with streetwear edge. Designed for bold statements and minimal distractions." — url `/projects/monochrome-signal` — tags: Monochrome, Editorial, Fashion, Visual Identity.
2. **Mecha Muse** — "An experimental microsite blurring the line between human and machine. Cinematic visuals and deep red hues evoke a futuristic mythos." — url `/projects/mecha-muse` — tags: Cyberpunk, Experimental, 3D Layers, Concept Design.
3. **Neon Bloom** — "A surreal fusion of light, shadow, and sound. This project celebrates contrast and silhouette in a dreamlike digital space." — url `/projects/neon-bloom` — tags: Surreal, Lightplay, Immersive, Visual Narrative.
4. **Chromawave** — "A glossy, synth-infused interface for creators at the edge of music and fashion. Perfect for launch drops or digital showrooms." — url `/projects/chromawave` — tags: Futuristic, Glassmorphism, Music, Creative Tech.

A `createSlide(slideIndex)` function (1-based index) builds this exact DOM for one slide:

```html
<div class="slide">
  <div class="slide-img"><img src="…" alt=""></div>
  <div class="slide-header">
    <div class="slide-title"><h1>Monochrome Signal</h1></div>
    <div class="slide-description"><p>…description…</p></div>
    <div class="slide-link"><a href="…">View Project</a></div>
  </div>
  <div class="slide-info">
    <div class="slide-tags">
      <p>Tags</p>
      <p>Monochrome</p><p>Editorial</p><p>Fashion</p><p>Visual Identity</p>
    </div>
    <div class="slide-index-wrapper">
      <p>01</p><p>/</p><p>04</p>
    </div>
  </div>
</div>
```

The index counter is the current slide number and the total, both zero-padded to 2 digits (`padStart(2, "0")`), separated by a `/`. Only ONE `.slide` exists in the DOM at rest; during a transition the outgoing and incoming slides briefly coexist.

## Styling
- Google Fonts: **"DM Sans"** (body / h1) and **"DM Mono"** (all `p` and `a`). Global reset (`* { margin:0; padding:0; box-sizing:border-box }`).
- All `h1`, `p`, `a` are `text-transform: uppercase; color: #fff`.
- `h1`: `font-size: 5rem; font-weight: 600; letter-spacing: -0.1rem` (DM Sans).
- `p, a`: DM Mono, `font-size: 0.9rem; font-weight: 500; letter-spacing: -0.01rem; text-decoration: none`.
- `img`: `width: 100%; height: 100%; object-fit: cover`.
- `.slider`: `position: relative; width: 100vw; height: 100svh; background-color: #000; overflow: hidden` — a black fullscreen stage that clips the flying slides.
- `.slide` and `.slide-img`: `position: absolute; top: 0; left: 0; width: 100vw; height: 100svh`. `.slide` gets `will-change: transform`.
- `.slide-header`: `position: absolute; bottom: 2rem; left: 50%; transform: translate(-50%, 0); width: 75%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; z-index: 1` — title, description and link stacked and centered near the bottom of the frame.
- `.slide-description`: `width: 60%; text-align: center; margin-bottom: 1rem`.
- `.slide-info`: `position: absolute; left: 0; bottom: 2rem; width: 100vw; padding: 0 2rem; display: flex; justify-content: space-between; align-items: flex-end` — tags bottom-left, index counter bottom-right.
- `.slide-tags`: `display: flex; flex-direction: column`; its first `p` (the "Tags" label) gets `margin-bottom: 1rem`.
- `.slide-index-wrapper`: `display: flex`; each `p` inside is `width: 2rem; text-align: center`.
- **Critical for the text masks:** `.line, .word { position: relative; display: inline-block; will-change: transform; }` — these are the classes SplitText assigns; combined with SplitText's `mask` option they let the text rise out of clipped wrappers.
- Mobile (`max-width: 1000px`): `h1` drops to `2rem` / `letter-spacing: 0`; `p` to `0.8rem`; `.slide-header` moves to dead center (`top: 50%; bottom: unset; transform: translate(-50%, -50%); width: 90%`); `.slide-description` becomes `width: 100%`.

## GSAP effect (exhaustive)

Everything runs inside `DOMContentLoaded`. State variables: `currentSlide = 1`, `isAnimating = false`, `scrollAllowed = true`, `lastScrollTime = 0`, plus `touchStartY` / `isTouchActive` for touch. `totalSlides = 4`.

### SplitText setup — `splitText(slide)`
Run on every freshly created slide, AFTER it is in the DOM:
- The `h1` inside `.slide-title` → `SplitText.create(h1, { type: "words", wordsClass: "word", mask: "words" })` — word-level split with masked wrappers.
- **Every** `p` and `a` in the slide (description, "Tags" label, each tag, the three index chunks, the "View Project" link) → `SplitText.create(el, { type: "lines", linesClass: "line", mask: "lines", reduceWhiteSpace: false })` — line-level split with masked wrappers.

### Initial load animation
1. Create slide 1, append to `.slider`, run `splitText`.
2. `gsap.set` on ALL `.word` and `.line` elements: `y: "100%"` (with `force3D: true`) — every word/line hidden below its mask.
3. `gsap.to` the same collection: `y: "0%"`, `duration: 1`, `ease: "power4.out"`, `stagger: 0.1`, `force3D: true` — the whole slide's text cascades up on load.

### Slide transition — `animateSlide(direction)` ("down" = next, "up" = previous)
Guard: return if `isAnimating || !scrollAllowed`; then set both flags to block re-entry. Update `currentSlide` with wraparound (after 4 comes 1; before 1 comes 4).

Direction-dependent constants:
- `exitY` = `"-200vh"` for down, `"200vh"` for up (outgoing slide flies opposite to the incoming one's origin).
- `entryY` = `"100vh"` for down, `"-100vh"` for up.
- `entryClipPath` = down: `polygon(20% 20%, 80% 20%, 80% 100%, 20% 100%)` (a window cropped 20% from left/right and 20% from the top, open at the bottom); up: `polygon(20% 0%, 80% 0%, 80% 80%, 20% 80%)` (mirrored: open at the top, cropped 20% at the bottom).

**Outgoing slide** (the existing `.slide` in the DOM), one tween:
```
gsap.to(currentSlideElement, {
  scale: 0.25, opacity: 0, rotation: 30, y: exitY,
  duration: 2, ease: "{{motion.ease.secondary}}", force3D: true,
  onComplete: () => currentSlideElement.remove()
})
```
So it simultaneously shrinks to a quarter size, tilts 30° clockwise, fades to invisible and travels two full viewport heights away over 2 seconds with a strong in-out ease.

**Incoming slide** — inside a `setTimeout(..., 750)` (it starts 0.75 s after the exit tween begins, overlapping it):
1. `createSlide(currentSlide)`, then BEFORE appending: `gsap.set(newSlide, { y: entryY, clipPath: entryClipPath, force3D: true })`.
2. Append to `.slider`, run `splitText(newSlide)`.
3. `gsap.set` all its `.word` and `.line` elements to `y: "100%"` (`force3D: true`).
4. Main entry tween:
```
gsap.to(newSlide, {
  y: 0,
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  duration: {{motion.duration.slow}}, ease: "power4.out", force3D: true,
  onStart: …text timeline below…,
  onComplete: …unlock below…
})
```
The slide travels one full viewport height into place while the clip-path window expands from the cropped polygon to the full frame — a "window opening" reveal.

**Text reveal timeline** — built in the entry tween's `onStart` (`const tl = gsap.timeline()`), all tweens animate `y` from the pre-set `"100%"` to `"0%"` with `duration: 1`, `ease: "power4.out"`:
- `.slide-title .word` (header words): `stagger: 0.1`, `force3D: true`, placed at absolute position **`0.75`** on the timeline (waits until the slide is mostly in frame).
- `.slide-tags .line`: `stagger: 0.1`, position **`"-=0.75"`** (starts 0.75 s before the previous tween ends, i.e. overlapping the title reveal).
- `.slide-index-wrapper .line`: `stagger: 0.1`, position **`"<"`** (same start as the tags).
- `.slide-description .line`: `stagger: 0.1`, position **`"<"`** (same start again).
- `.slide-link .line` ("View Project"): no stagger, position **`"-=1"`**.

**Unlock** — the entry tween's `onComplete`: set `isAnimating = false`, then after a `setTimeout` of 100 ms set `scrollAllowed = true` and `lastScrollTime = Date.now()`.

### Input handling
- `handleScroll(direction)`: return if `isAnimating || !scrollAllowed`, and also return if `Date.now() - lastScrollTime < 1000` (1-second throttle between transitions); otherwise update `lastScrollTime` and call `animateSlide(direction)`.
- **Wheel**: `window.addEventListener("wheel", handler, { passive: false })`; the handler calls `e.preventDefault()` and maps `e.deltaY > 0` → `"down"`, else `"up"`.
- **Touch**: `touchstart` (passive: false) records `touches[0].clientY` and sets `isTouchActive = true`. `touchmove` (passive: false) calls `e.preventDefault()`; if touch is active and not animating and the vertical delta from the start exceeds **50 px**, deactivate the touch and call `handleScroll` — swipe up (finger moves up, positive difference) = `"down"`, swipe down = `"up"`. `touchend` resets `isTouchActive`.

## Assets / images
4 full-bleed background images, one per slide, each shown at full viewport size with `object-fit: cover` (use generous ~3:2 or 16:9 sources; any large image works since it's cover-cropped). Describe by role — moody, cinematic, editorial fashion/tech portraits that match each project's vibe:
1. Slide 1 ("Monochrome Signal"): black-and-white-leaning studio portrait of a model with a bleach-blond buzzcut, black tank top, layered silver chains and angular black sunglasses on a flat grey backdrop.
2. Slide 2 ("Mecha Muse"): cinematic close-up of a woman wearing a glossy black cyborg helmet with a transparent visor, against a deep red background.
3. Slide 3 ("Neon Bloom"): full-bleed editorial portrait in hard contrast, lit by a coloured gel so the face is split between saturated light and deep shadow.
4. Slide 4 ("Chromawave"): futuristic portrait of a platinum-blonde model in a glowing visor with a chrome segmented cybernetic neckpiece on a purple background.

Name them `slide-img-1.jpg` … `slide-img-4.jpg` and reference them from the slide data array. No logos or brand marks.

## Behavior notes
- The carousel is fully wraparound/infinite in both directions; there is no scrollbar and no page scroll — the wheel is hijacked (`preventDefault`) and drives slides only.
- Re-entry is triple-guarded: the `isAnimating` flag, the `scrollAllowed` flag (released 100 ms after a transition completes) and the 1000 ms `lastScrollTime` throttle. A rapid wheel flick fires exactly one transition.
- During a transition both slides are visible at once: the old one spinning/shrinking away while the new one slides in through its opening clip-path window — this overlap (incoming starts at 750 ms of the 2000 ms exit) is the signature look; keep the timings exact.
- Works on touch devices via the 50 px swipe threshold; layout adapts under 1000 px (smaller type, header centered mid-screen).
- Use `100svh` (not `100vh`) for the stage and slide heights so mobile browser chrome doesn't cause cropping.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/karim-saab-work-carousel/slide-img-1.jpg
https://motionprompts.dev/c/karim-saab-work-carousel/slide-img-2.jpg
https://motionprompts.dev/c/karim-saab-work-carousel/slide-img-3.jpg
https://motionprompts.dev/c/karim-saab-work-carousel/slide-img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-dim`, `--ink-faint`, `--accent`, `--bg`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. A single wheel transition here is not one tween — it is a chain: an exit tween, a slide built and animated in from a delayed callback, and a nested timeline for the text reveal built inside that second tween's start. A double mount does not just double the obvious part. It leaves two `wheel` listeners on `window` racing to advance the same `currentSlide` counter, and if the remount lands mid-transition, a stray timer can still fire and append a slide into a stage the first mount already tore down. The visible symptom is a scroll tick that fires two transitions instead of one, or a title that briefly renders wrapped in nested `.word` spans from a `SplitText` pass that ran twice on the same node. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only falls back to that guard when it isn't running inside this catalogue's own tuning harness (the `window.MP` branch). Neither survives the move to React: the harness branch has no equivalent in a shipped component, and the readiness check is dead weight once `useEffect` already guarantees the DOM is committed. Drop both, along with the `boot` wrapper, and move the body of `mount()` — the first slide's construction, its `SplitText` calls, and the load-in tween — into a `useEffect` with an empty dependency array. The `destroy()` this component already returns is close to a correct cleanup function as-is: it clears every pending timer, kills tweens on every live slide, reverts every split, and removes all four `window` listeners. The work below is about routing that same teardown through `gsap.context`, not replacing it.

*(2) Element lookups* — `mount()` resolves `.slider` once, from `document`, and `animateSlide` re-queries it on every transition for `slider.querySelector(".slide")` to find the outgoing slide. Put a ref on `.slider` and scope both lookups to it. This is not cosmetic here: during the StrictMode remount two `.slider` stages briefly coexist, and an unscoped query can hand one mount's `animateSlide` the other mount's `.slide` — the exit tween then flings a node that was never appended by the instance running it.

*(3) Cleanup* — The complication specific to this component is that the incoming slide is not built where the effect runs — it is built well after, inside a `setTimeout` fired mid-flight of the outgoing tween. `gsap.context` only auto-captures GSAP objects created synchronously while its factory function executes; a callback that fires that much later, from a raw timer, is outside that window. Everything the timeout callback creates — the new slide's two `SplitText` passes (words on the title, lines on every `p`/`a`), the entry tween, and the reveal timeline built inside that tween's `onStart` — has to go through the context argument explicitly, or `ctx.revert()` will not know any of it exists:

```jsx
useEffect(() => {
  const pendingTimers = new Set();
  const ctx = gsap.context((self) => {
    // build slide 1, split it, run the load-in tween exactly as above

    function animateSlide(direction) {
      // outgoing tween exactly as above
      const id = setTimeout(() => {
        pendingTimers.delete(id);
        self.add(() => {
          // build the incoming slide, split it, run the entry tween
          // and its onStart reveal timeline exactly as above
        });
      }, 750);
      pendingTimers.add(id);
    }
  }, rootRef);

  return () => {
    pendingTimers.forEach(clearTimeout);
    ctx.revert();
  };
}, []);
```

`self.add` fixes what gets reverted; it does not make the timer itself cancellable. Keep the id of every `setTimeout` this component schedules — the delay before the incoming slide appears and the shorter one after the entry tween's `onComplete` that re-opens `scrollAllowed` — in a set, and clear whatever is still pending in the same cleanup. Skip that and a transition that was mid-flight when the route changed keeps running: it builds a slide, splits it, and tweens it into a `.slider` that has already been emptied.

Because every transition mints a fresh slide element, one `SplitText` instance per element does not cover this component's lifetime the way it would for a static headline — cleanup has to revert whichever slides are alive at the moment of unmount, not just slide one. The `WeakMap` this script already keys splits by slide is the right shape for that; keep it, and revert every entry from inside the same `self.add` pass that built it, so `ctx.revert()` reaches splits created at any point in the carousel's run, not only the ones from the initial synchronous mount.

The four `wheel`/`touchstart`/`touchmove`/`touchend` listeners stay on `window` — that is the point of this component, it hijacks the whole viewport's scroll rather than just its own bounding box — but `handleWheel` and the touch handlers have to keep being declared inside this same effect, exactly as `mount()` already does, not hoisted to module scope or rebuilt in the component body. `removeEventListener` only unbinds the exact function reference `addEventListener` was given; anything else leaves the previous mount's listener attached after the StrictMode remount, and a single wheel tick then drives two transitions at once.
