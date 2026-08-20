---
slug: sticky-cards-ashfall-rebuild-js
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 8
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Sticky Stacked Cards Scroll Reveal (GSAP + Lenis)

## Goal

Build a scroll-driven "sticky stacked cards" section: five full-size image cards sit stacked in a centered rounded container inside a pinned section. As the user scrolls, each front card shrinks and rotates away while its image zooms in, and the next card slides up from below to cover it — one card swap per viewport-height of scroll, fully scrubbed to the scrollbar.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scrolling. Register ScrollTrigger with `gsap.registerPlugin(ScrollTrigger)`. Run everything inside a `DOMContentLoaded` listener.

## Layout / HTML

Three full-viewport `<section>` elements, in order:

1. `<section class="intro">` — a single `<h1>` with a long editorial sentence about art and motion, e.g. "Art is not what you see. It's what you *feel* in the blur, the chaos, the motion — every pulse captured in color and form."
2. `<section class="sticky-cards">` — contains one `<div class="cards-container">` holding exactly **5** `<div class="card">` elements. Each card contains:
   - `<div class="tag"><p>LABEL</p></div>` — short uppercase labels, one per card, in this order: "Raw Emotion", "Inner Conflict", "Fury & Flow", "Rebellion", "Liberation".
   - `<img src="...">` — one image per card (see Assets).
3. `<section class="outro">` — another `<h1>` with a closing sentence, e.g. "This isn't just motion. It's meaning in movement. In every blurred edge and amplified hue, we trace the shape of something deeper — truth in abstraction."

Load `styles.css` via `<link>` and the script via `<script type="module" src="./script.js">` at the end of `<body>`.

## Styling

- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- Fonts (Google Fonts `@import` in the CSS): body uses **"DM Sans"**; tag labels use **"IBM Plex Mono"**.
- `img`: `position: relative; width: 100%; height: 100%; object-fit: cover;`.
- `h1`: `font-size: 5vw; font-weight: 500; line-height: 1; letter-spacing: -0.02em; text-indent: 5em; color: #e3e3db;` with antialiased font smoothing.
- Every `section`: `position: relative; width: 100vw; height: 100svh; padding: 2em; background-color: #1f1f1f; overflow: hidden;`.
- `.intro`, `.outro`: flex, centered both axes.
- `.sticky-cards`: flex, centered both axes, `background-color: #0f0f0f; color: #fff;` (darker than the other sections).
- `.cards-container`: `position: relative; width: 50%; height: 50%; border-radius: 0.5em; overflow: hidden;`. The `overflow: hidden` here is essential — it clips the incoming card that waits below at `y: 100%`.
- `.card`: `position: absolute; width: 100%; height: 100%; border-radius: 0.5em; overflow: hidden;` — all 5 cards occupy the exact same box, stacked by DOM order (later cards naturally paint on top once they slide in).
- `.tag`: `position: absolute; top: 1em; left: 1em; padding: 0.5em; border-radius: 0.25em; background: #000; z-index: 1;`.
- `.tag p`: `text-transform: uppercase; font-family: "IBM Plex Mono"; font-size: 12px; font-weight: 600; line-height: 1;`.
- Media query `max-width: 1000px`: `h1 { font-size: 7vw; text-indent: 2em; }` and `.cards-container { width: 95%; }`.

## GSAP effect (be exact)

### Lenis smooth scroll wiring

```
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### Initial state (gsap.set)

- Card index 0 (front card): `{ y: "0%", scale: 1, rotation: 0 }`; its `img`: `{ scale: 1 }`.
- Every other card (indices 1–4): `{ y: "100%", scale: 1, rotation: 0 }` (parked one full container-height below, hidden by the container's `overflow: hidden`); each of their `img`s: `{ scale: 1 }`.

### Pinned, scrubbed timeline

One `gsap.timeline` whose ScrollTrigger is:

- `trigger: ".sticky-cards"`
- `start: "top top"`
- `end: "+=" + window.innerHeight * (totalCards - 1)` — i.e. `+=4 × window.innerHeight` for 5 cards.
- `pin: true` (default pinSpacing, so the page gains 4 extra viewport heights of scroll)
- `scrub: 0.5`

### Timeline content

Loop `for (let i = 0; i < totalCards - 1; i++)` — 4 transitions. For each `i`, add **three tweens at the same absolute timeline position `i`** (position parameter = the integer `i`, so transition 0 occupies timeline time 0→1, transition 1 occupies 1→2, etc.). All tweens use `duration: 1` and `ease: "none"` (linear, since the motion is scrubbed):

1. Current card (`cards[i]`) → `{ scale: 0.5, rotation: 10, duration: 1, ease: "none" }` — it shrinks to half size and tilts 10 degrees clockwise while still visible behind the incoming card.
2. Current card's image (`images[i]`) → `{ scale: 1.5, duration: 1, ease: "none" }` — the photo zooms inside the shrinking card, a counter-zoom parallax.
3. Next card (`cards[i + 1]`) → `{ y: "0%", duration: 1, ease: "none" }` — it slides up from `100%` to fully cover the container, wiping over the shrinking card beneath it.

All three motions are perfectly simultaneous per transition. Because positions are integers and durations are 1, the four transitions run back-to-back with no gaps or overlaps, and each one maps to exactly one viewport-height of scroll. The last card (index 4) never shrinks — it stays full size when the pin releases.

## Assets / images

5 images, one per card, filling the card completely (`object-fit: cover`; the container is a wide landscape box — roughly 50vw × 50svh). Use abstract expressionist / painterly artworks with blurred, energetic brushstrokes matching each tag's mood:

1. Warm ochre/red abstract painting with sweeping blurred strokes (Raw Emotion).
2. Swirling smeared color, chaotic motion blur (Inner Conflict).
3. High-energy streaked strokes with amplified hues (Fury & Flow).
4. Bold gestural marks, rebellious blurred motion (Rebellion).
5. Lighter, freer flowing brushwork suggesting release (Liberation).

## Behavior notes

- The entire effect is scrub-driven: no autonomous animation on load; scrolling backwards reverses everything.
- Section is pinned for 4 extra viewport heights; intro and outro scroll normally before/after.
- Works at any viewport size; below 1000px the container widens to 95% and headings scale up.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/sticky-cards-ashfall-rebuild-js/img1.jpg
https://motionprompts.dev/c/sticky-cards-ashfall-rebuild-js/img2.jpg
https://motionprompts.dev/c/sticky-cards-ashfall-rebuild-js/img3.jpg
https://motionprompts.dev/c/sticky-cards-ashfall-rebuild-js/img4.jpg
https://motionprompts.dev/c/sticky-cards-ashfall-rebuild-js/img5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--wall`, `--wall-deep`, `--ink`, `--ink-soft`, `--ember`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelectorAll`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, the first card looks right, and then it misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two pinned `ScrollTrigger` instances on `.sticky-cards`, each inserting its own pin-spacer and growing the document by four extra viewport-heights; two `Lenis` instances fighting over the same wheel event; two sets of inline `scale`/`rotation`/`y` values racing each other onto the same five cards on every scrub tick. The visible symptom is a section that pins for twice as long as it should, or cards that snap and re-shrink partway through the scroll, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only once the DOM is ready does it query the five `.card` elements, wire up `Lenis`, and build the pinned timeline. That guard exists to survive being loaded late in a plain HTML page; in React it is dead weight, because `useEffect` already runs after the DOM is committed. Drop the guard and the listener both, and move the entire body — the `Lenis` construction, the ticker wiring, the two `gsap.set` passes over the cards and images, and the scrubbed timeline — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `document.querySelectorAll(".card")` and `document.querySelectorAll(".card img")` both assume this component owns the document, and both results get indexed positionally afterward (`cards[i]`, `cards[i + 1]`, `images[i]`) with no further check that a match belongs to this instance. Give the component a root `ref` on `.sticky-cards`, and resolve both lists off it (`root.querySelectorAll(".card")`, `root.querySelectorAll(".card img")`) instead of off `document`. During the StrictMode remount two copies of `.sticky-cards` exist for an instant, and an unscoped selector will happily animate the five cards belonging to the copy that is on its way out.

*(3) Cleanup* — This effect creates four things that must not outlive it: the pinned `ScrollTrigger` and its timeline, the inline `scale`/`rotation`/`y` values the two `gsap.set` passes and the timeline write onto the five cards and five images, the `Lenis` instance, and a callback sitting on `gsap.ticker`.

Wrap the two `gsap.set` calls and the `gsap.timeline({ scrollTrigger: { trigger: ".sticky-cards", pin: true, … } })` in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the two gsap.set passes and the scrubbed, pinned timeline, exactly as above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills the timeline's `ScrollTrigger` and reverts the transforms it wrote, in one call — and because the trigger it is reverting has `pin: true`, that includes removing the pin-spacer it inserted around `.sticky-cards`. Skip the revert and that spacer survives the unmount: the next mount pins on top of it, and the page keeps getting four viewport-heights taller every time this route is visited. Register the plugin (`gsap.registerPlugin(ScrollTrigger)`) at module scope, not inside the effect — repeating it, or repeating `gsap.ticker.lagSmoothing(0)`, on every mount is harmless but pointless.

`Lenis` and the ticker callback sit outside that context — they are not tweens or triggers, so `gsap.context` never records them, and `ctx.revert()` does nothing for either. Handle them yourself, in the reverse of the order they were created: remove the ticker callback with `gsap.ticker.remove(raf)` — the same function reference `gsap.ticker.add(raf)` was given, not a new arrow function — before calling `lenis.destroy()`, so no in-flight tick calls `lenis.raf()` on an instance that is already gone; then drop the relay with `lenis.off("scroll", ScrollTrigger.update)`. `new Lenis()` here is created fresh for this one section with nothing shared, which is fine as long as `.sticky-cards` is the only scroll-driven thing on the page; if this component ends up as one section among several, lift the instance to the app shell instead of letting every mounted copy fight over the same wheel input.

Because pinning this section changes the document's height, call `ScrollTrigger.refresh()` once after cleanup if the page has other pinned or scrubbed sections that measured their own start/end against the now-stale, taller layout — a single call, not one per unmount, or a StrictMode double-teardown fires it twice for no reason.
