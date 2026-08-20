---
slug: work-carousel-karim-saab
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 1
structural_literals: 9
structural:
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power4.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Full-Screen Work Carousel — Fly-Off Exit + Clip-Path Entry + SplitText Reveals

## Goal

Build a full-screen, scroll-hijacked work/portfolio carousel (one slide visible at a time). On wheel or touch swipe, the current slide shrinks, rotates and flies off screen while the next slide enters from the opposite edge inside an animated `clip-path` polygon that expands to full screen; then the slide's title words and every text line (description, tags, index, link) reveal upward through SplitText masks with staggered power4 eases.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `SplitText` (`import { SplitText } from "gsap/SplitText"`). No other libraries. Do NOT register ScrollTrigger — scrolling is fully hijacked with native `wheel`/`touch` listeners.

## Data

Create a `slides.js` module that default-exports an array of 4 slide objects, each with:

- `slideTitle` (string, e.g. "Second Skin", "Half Light", "Sharp Shoulder", "Under Veil")
- `slideDescription` (one sentence, ~20 words, editorial tone about the project)
- `slideUrl` (e.g. `/work/second-skin`)
- `slideTags` (array of 4 short tags, e.g. `["Leather", "Studio", "Still life", "AW25"]`)
- `slideImg` (path to the slide's full-bleed image)

## Layout / HTML

`<body>` contains only:

```
.slider                     ← fixed-size viewport container
  .slide                    ← the FIRST slide, hard-coded in the HTML (matches slides[0])
    .slide-img > img        ← full-bleed image
    .slide-header
      .slide-title > h1     ← project title
      .slide-description > p
      .slide-link > a       ← text "View Project", href = slideUrl
    .slide-info
      .slide-tags           ← <p>Tags</p> followed by one <p> per tag
      .slide-index-wrapper  ← <p id="slide-index">01</p> <p>/</p> <p id="total-slide-count">04</p>
```

All subsequent slides are built entirely in JS with `document.createElement`, reproducing this exact structure (the index `<p>` shows the current slide number zero-padded to 2 digits, e.g. `02`, and the total count `04`).

## Styling

- Google Fonts: **DM Sans** (body/headings) and **DM Mono** (all small text). Global reset (`* { margin:0; padding:0; box-sizing:border-box }`).
- `img { width:100%; height:100%; object-fit:cover }`.
- All `h1, p, a`: `text-transform: uppercase; color: #fff`. Links have no underline.
- `h1`: DM Sans, `font-size: 5rem`, `font-weight: 600`, `letter-spacing: -0.1rem`.
- `p, a`: DM Mono, `font-size: 0.9rem`, `font-weight: 500`, `letter-spacing: -0.01rem`.
- `.slider`: `position: relative; width: 100vw; height: 100svh; background-color: #000; overflow: hidden`.
- `.slide` and `.slide-img`: `position: absolute; top: 0; left: 0; width: 100vw; height: 100svh`. `.slide { will-change: transform }`.
- `.slide-header`: absolute, `bottom: 2rem; left: 50%; transform: translate(-50%, 0%)`, `width: 75%`, centered text, flex column, `align-items: center; gap: 1rem; z-index: 1`.
- `.slide-description`: `width: 60%; text-align: center; margin-bottom: 1rem`.
- `.slide-info`: absolute, `left: 0; bottom: 2rem; width: 100vw; padding: 0 2rem`, flex `justify-content: space-between; align-items: flex-end`.
- `.slide-tags`: flex column; its first `<p>` ("Tags") has `margin-bottom: 1rem`.
- `.slide-index-wrapper`: flex row; each `<p>` inside is `width: 2rem; text-align: center`.
- `.line, .word` (SplitText output): `position: relative; display: inline-block; will-change: transform`.
- `@media (max-width: 1000px)`: `h1 { font-size: 2rem; letter-spacing: 0 }`, `p { font-size: 0.8rem }`, `.slide-header { top: 50%; bottom: unset; transform: translate(-50%, -50%); width: 90% }`, `.slide-description { width: 100% }`.

## GSAP effect (be exact)

Everything runs inside `DOMContentLoaded`. State: `currentSlide = 1`, `isAnimating = false`, `scrollAllowed = true`, `lastScrollTime = 0`, `totalSlides = slides.length`.

### Input → trigger

- `window` `wheel` listener with `{ passive: false }` + `e.preventDefault()`; `direction = e.deltaY > 0 ? "down" : "up"`.
- Touch: on `touchstart` record `touchStartY` and set `isTouchActive = true`; on `touchmove` (`{ passive: false }`, `preventDefault()`), if the vertical delta exceeds **50px**, set `isTouchActive = false` and fire with `direction = delta > 0 ? "down" : "up"`; `touchend` resets `isTouchActive`.
- A `handleScroll(direction)` gate ignores input while `isAnimating || !scrollAllowed`, and also throttles: ignore if `Date.now() - lastScrollTime < 1000` ms; otherwise update `lastScrollTime` and run the transition.

### Slide counter (infinite wrap)

`direction === "down"` → `currentSlide = currentSlide === totalSlides ? 1 : currentSlide + 1`; `"up"` → wrap the other way.

### Direction-dependent values

- Exit translate: `exitY = direction === "down" ? "-200vh" : "200vh"`.
- Entry start translate: `entryY = direction === "down" ? "100vh" : "-100vh"` (new slide comes from the bottom when scrolling down).
- Entry start clip-path:
  - down: `polygon(20% 20%, 80% 20%, 80% 100%, 20% 100%)` (a 60%-wide window anchored to the bottom edge)
  - up: `polygon(20% 0%, 80% 0%, 80% 80%, 20% 80%)` (anchored to the top edge)

### 1) Exit tween (current slide)

`gsap.to(currentSlideElement, { scale: 0.25, opacity: 0, rotation: 30, y: exitY, duration: 2, ease: "power4.inOut", force3D: true, onComplete: () => currentSlideElement.remove() })` — the slide simultaneously shrinks to a quarter size, fades out, tilts 30° clockwise and flies two viewport-heights off screen.

### 2) Entry (new slide) — starts after a 750 ms `setTimeout`

1. Build the new slide element from the data, then `gsap.set(newSlide, { y: entryY, clipPath: entryClipPath, force3D: true })` and append it to `.slider`.
2. Run SplitText on it:
   - Title `h1`: `SplitText.create(h1, { type: "words", wordsClass: "word", mask: "words" })`.
   - Every `p` and `a` in the slide: `SplitText.create(el, { type: "lines", linesClass: "line", mask: "lines", reduceWhiteSpace: false })`.
3. `gsap.set([all .word, all .line], { y: "100%", force3D: true })` — all text starts hidden below its mask.
4. Container tween: `gsap.to(newSlide, { y: 0, clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: {{motion.duration.slow}}, ease: "power4.out", force3D: true })` — the slide travels to center while the polygon window expands to the full rectangle.
5. In that tween's `onStart`, build a `gsap.timeline()` for the text reveals (all `y: "100%"` → `"0%"`, all `ease: "power4.out"`, all `duration: 1`):
   - `.slide-title .word` with `stagger: 0.1`, placed at absolute time `0.75` on the timeline.
   - `.slide-tags .line` with `stagger: 0.1`, position `"-=0.75"` (overlaps the title reveal).
   - `.slide-index-wrapper .line` with `stagger: 0.1`, position `"<"` (same start as tags).
   - `.slide-description .line` with `stagger: 0.1`, position `"<"`.
   - `.slide-link .line` (no stagger), position `"-=1"`.
6. In the container tween's `onComplete`: `isAnimating = false`, and after a 100 ms timeout set `scrollAllowed = true` and `lastScrollTime = Date.now()`.

Net result: exit and entry overlap (exit lasts 2 s, entry starts at 0.75 s), so for a moment both slides are moving in opposite directions.

## Assets / images

4 full-bleed, cinematic fashion/editorial portraits (moody studio lighting, futuristic styling), one per slide, displayed full-screen with `object-fit: cover` — landscape ~16:9 or larger works best. Each slide pairs its image with its title/description/tags. No logos or brand marks.

## Behavior notes

- The first slide is static HTML and its text is NOT split — SplitText only runs on slides created during transitions.
- The carousel loops infinitely in both directions.
- Native page scroll never happens: the page is exactly one viewport tall and wheel/touch events are prevented.
- Works on touch devices via the 50px swipe threshold; the responsive breakpoint at 1000px recenters the header vertically.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/work-carousel-karim-saab/slide-img-1.jpg
https://motionprompts.dev/c/work-carousel-karim-saab/slide-img-2.jpg
https://motionprompts.dev/c/work-carousel-karim-saab/slide-img-3.jpg
https://motionprompts.dev/c/work-carousel-karim-saab/slide-img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--hair`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, builds new slides with `document.createElement`, and drives the whole thing off two `window`-level input listeners that live for as long as the page does. React withdraws all three of those guarantees at once, and it does so quietly — the carousel renders, the first slide looks right, and then a scroll or a swipe misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component's mutable state — `currentSlide`, `isAnimating`, `scrollAllowed`, `lastScrollTime` — lives in `let` bindings closed over by the wheel and touch handlers, so a double-mount does not produce two counters agreeing with each other; it produces two independent closures, each with its own `isAnimating` gate, both listening on the same `window`. If the first mount's listeners are not removed before the second mount's are added, a single wheel tick fires `handleScroll` twice from two closures that cannot see each other's state, and two transitions start at once — two exit tweens racing on two different reads of `.slide`, two entry slides appended to the same `.slider`. Keep these four values in refs rather than state (none of them need to trigger a re-render when they change) and treat listener cleanup as the load-bearing part of the effect, not an afterthought.

**(1) The entry point** — the script wraps its entire body in a `DOMContentLoaded` listener. By the time a React component mounts, that event has already fired, so the listener would simply never run — no carousel, no error, nothing to debug. Delete the listener and move its body directly into a `useEffect` with an empty dependency array.

**(2) Element lookups** — `animateSlide` re-queries `document.querySelector(".slider")` on every call, and from it re-queries `.slide` for the outgoing element. That is scoped to a class name that should be unique, but it still assumes there is exactly one `.slider` in the whole document. Give the component a root ref, render `.slider` as the outermost element the ref points to, and query from that ref instead of `document`. During the StrictMode remount, two copies of `.slider` exist in the document for an instant, and an unscoped `document.querySelector` is not guaranteed to resolve to the copy that is staying.

**(3) Cleanup** — three different kinds of thing get created here, on three different schedules, and each needs its own teardown:

*GSAP and the timeline.* Wrap the setup in a `gsap.context` scoped to the root ref, but this component does not create its tweens synchronously inside that setup call — `animateSlide` runs later, once per wheel tick or swipe, for the entire life of the mount. A `gsap.context` call that only registers the listeners in its factory function auto-tracks whatever runs during that one synchronous pass, which produces no tweens at all; every exit tween, entry tween and the inner timeline built inside the entry tween's `onStart` would then be created outside the context's tracking window and would survive `ctx.revert()` untouched. Register `animateSlide` as a reusable context method instead — `ctx.add("animateSlide", (direction) => { /* the function body above */ })`, called as `ctx.animateSlide(direction)` from the wheel and touch handlers — so that every tween and timeline it produces, no matter how many times the user has scrolled by the time the component unmounts, is tracked and gets reverted with everything else.

*The splits.* The first slide ships static and unsplit — `SplitText.create` only ever runs on slides built during a transition, on the title `h1` (by word) and on every other `p`/`a` (by line) — so there is no risk of splitting the same element twice on mount. But a slide mid-transition when the route changes still has live spans wired into the tweens above; reverting them as part of the same context tears down the tweens, the timeline and the splits in the right order, instead of leaving GSAP holding references into a subtree React is about to discard.

*The fonts gate.* The line-type splits measure against the loaded webfont — split DM Sans or DM Mono before either has loaded and SplitText draws its line boxes against the fallback face, so the mask wrapped around each line ends up cutting through a break that moves once the real font swaps in. The very first transition therefore has to wait on `document.fonts.ready`, and that wait is exactly what breaks under React 19 if you reach for the obvious tool. Do not declare the effect callback `async`, and do not wrap the carousel's setup in an `async` function whose resolved return value you hand back as the effect's cleanup. Both shapes make the function passed to `useEffect` return a promise instead of a teardown function; React never awaits that promise; it treats whatever the callback returned as the cleanup and invokes it on unmount, so calling a promise as a function throws `cleanup is not a function` — and that exception is not scoped to this component, it unmounts the whole tree. Keep the effect body synchronous: build the `gsap.context`, register `animateSlide` on it, and attach the four `window` listeners in that same synchronous pass, so a wheel tick or swipe that arrives before fonts resolve lands on a listener that already exists, rather than one a pending `await` hasn't reached yet. Use the `isAnimating` ref already in place as the gate instead of introducing new state: initialize it `true` before the listeners go on, so input that arrives early is a no-op through the same branch that already ignores input mid-transition, and flip it back `false` from a `document.fonts.ready.then(...)` chained alongside the effect, never awaited inside it. That `.then()` callback is itself a continuation that can resolve after the component is gone — a StrictMode unmount right after mount, or a route change away and back, both leave the uncancelable `document.fonts.ready` pending against a `ctx` that has, by the time it resolves, already been reverted. Guard the callback with the same cancellation flag the cleanup sets, and check that flag before touching the ref or the context: set the flag alongside `ctx.revert()` in the function the effect returns, and have the `.then()` callback's first line bail out when it reads true.

*The timeouts.* The wait before the new slide is built and appended, and the shorter wait after the entry tween completes before `scrollAllowed` flips back, are plain `setTimeout` calls — `gsap.context` does not know about them. If the component unmounts mid-transition, both still fire: the first appends a freshly built slide, runs `SplitText.create` and `gsap.set` against a `.slider` that may already be detached from the document; the second writes into refs belonging to a component that no longer exists. Replace both with `gsap.delayedCall` inside the same context so they get canceled by the same `ctx.revert()`, or, if you keep raw timeouts, hold their IDs and `clearTimeout` them in the cleanup function.

*The window listeners.* Remove `wheel`, `touchstart`, `touchmove` and `touchend` from `window` in the same cleanup that reverts the context. They are attached above as inline arrow functions; give each one a name so the same reference can be passed to `removeEventListener`, or there is nothing for the cleanup to remove, and the double-listener failure described at the top of this section is exactly what the first StrictMode mount will surface.
