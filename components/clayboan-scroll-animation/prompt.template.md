---
slug: clayboan-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 4
structural:
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Clayboan Scroll Gallery — Clip-Path Reveal + Char-by-Char Titles

## Goal
Build a full-page vertical scroll gallery (portfolio style) with Lenis smooth scroll where each tall "work" section is scrubbed by GSAP ScrollTrigger. As a section enters the viewport, its full-bleed image's `clip-path` morphs from an angular slanted polygon into a full rectangle (a diagonal wipe-open reveal); as the section leaves, the clip-path morphs again into a bottom-slanted polygon (a diagonal wipe-close). Meanwhile the big white project title, centered over the image, animates in character by character: SplitText masks every char and each char slides up from below its mask, with each character bound to its OWN scroll window so the reveal cascades left-to-right as you scroll.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`ScrollTrigger`** and **`SplitText`**, and **`lenis`** for smooth scroll. Register with `gsap.registerPlugin(ScrollTrigger, SplitText)`. Run everything inside a `DOMContentLoaded` handler.

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```
<section class="hero">
  <h1>Beyond the limits</h1>
</section>

<!-- repeat this block 5 times, one per project -->
<section class="work-item">
  <div class="work-item-img"><img src="..." alt="" /></div>
  <div class="work-item-name">
    <h1>Carbon Edge</h1>
  </div>
</section>

<section class="outro">
  <h1>Back to base</h1>
</section>
```

- Exactly **5** `.work-item` sections between the hero and the outro.
- Project titles, in order: **Carbon Edge**, **Velocity Grid**, **Aeroform**, **Mach Horizon**, **Titan Rail**.
- Hero copy: "Beyond the limits". Outro copy: "Back to base". No nav, no footer — just these 7 stacked sections.

## Styling
Font (Google Fonts): **Inter Tight** (variable weight import). Body: `font-family: "Inter Tight", sans-serif; background: #fcfcfc; color: #141414`.

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `h1 { text-transform:uppercase; text-align:center; font-size:5rem; font-weight:550; line-height:1 }` (weight 550 works because Inter Tight is a variable font).
- `section { position:relative; width:100vw; overflow:hidden }`.

Sections:
- `.hero, .outro { height:100svh; display:flex; justify-content:center; align-items:center; padding:2rem }` — dark text on the off-white page background.
- `.work-item { height:150svh }` — each project section is 1.5 viewport heights tall, which creates the scroll runway for the scrubbed animations.
- `.work-item-img { position:absolute; width:100%; height:100%; will-change:clip-path }` with **initial** `clip-path: polygon(25% 25%, 75% 40%, 100% 100%, 0% 100%)` (an irregular quadrilateral: top edge slanted downward left-to-right, full bottom). The image fills the whole 150svh section behind the title.
- `.work-item-name { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; z-index:1 }` — the title is centered in the section, layered above the image.
- `.work-item-name h1 { color:#fff }` (white title over the photo).
- Media query `max-width: 1000px`: all `h1` (including `.work-item-name h1`) drop to `font-size: 2.5rem`.

## GSAP effect (be exact)

### Lenis + ScrollTrigger wiring
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Lenis drives the scroll; GSAP's ticker drives Lenis (time is in seconds, Lenis wants ms, hence `* 1000`).

### Per work item
Loop `gsap.utils.toArray(".work-item")`. For each `item`, grab `img = item.querySelector(".work-item-img")` and `nameH1 = item.querySelector(".work-item-name h1")`, then create THREE kinds of scrubbed ScrollTriggers:

**1. Title chars — one ScrollTrigger per character.**
```js
const split = SplitText.create(nameH1, { type: "chars", mask: "chars" });
gsap.set(split.chars, { y: "125%" });
```
`mask: "chars"` wraps every char in its own overflow-clipping mask element, so `y: "125%"` hides each char fully below its own line box. Then, for each `char` at `index`:
```js
ScrollTrigger.create({
  trigger: item,
  start: `top+=${index * 25 - 250} top`,
  end:   `top+=${index * 25 - 100} top`,
  scrub: 1,
  animation: gsap.fromTo(char, { y: "125%" }, { y: "0%", ease: "none" }),
});
```
- Each character gets its own 150px scroll window, offset 25px later per index — that per-index offset is what produces the left-to-right cascade (it is a scroll-position stagger, not a time stagger).
- The negative base offsets (`-250` / `-100`) mean the first characters start revealing BEFORE the section top reaches the viewport top (i.e. while the section is still entering), and scrubbing back down reverses them.
- `scrub: 1` gives the chars a ~1s catch-up smoothing.

**2. Image reveal on enter.**
```js
ScrollTrigger.create({
  trigger: item,
  start: "top bottom",
  end: "top top",
  scrub: 0.5,
  animation: gsap.fromTo(
    img,
    { clipPath: "polygon(25% 25%, 75% 40%, 100% 100%, 0% 100%)" },
    { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", ease: "none" }
  ),
});
```
While the section travels from "top hits viewport bottom" to "top hits viewport top", the slanted top edge of the polygon unfolds up into the full rectangle — the photo wipes open diagonally. `ease: "none"` + scrub keeps it perfectly tied to scroll; `scrub: 0.5` adds a half-second smoothing lag.

**3. Image conceal on exit.**
```js
ScrollTrigger.create({
  trigger: item,
  start: "bottom bottom",
  end: "bottom top",
  scrub: 0.5,
  animation: gsap.fromTo(
    img,
    { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" },
    { clipPath: "polygon(0% 0%, 100% 0%, 75% 60%, 25% 75%)", ease: "none" }
  ),
});
```
While the section's bottom travels from viewport bottom to viewport top (the section leaving upward), the BOTTOM edge folds up into a slanted polygon (full top edge kept, bottom collapsing to points at 60%/75% height) — the mirror-image wipe-close of the entrance.

Important: both image triggers animate the same element's `clipPath` in separate non-overlapping scroll ranges (enter range ends where the section is fully on screen; exit range starts when its bottom reaches the viewport bottom), so they hand off cleanly. All polygons have 4 points so the morph interpolates smoothly. No pinning anywhere — the sections scroll naturally; the 150svh height is what stretches the effect out.

## Assets / images
**5 full-bleed photographs**, one per work item, each filling a 150svh × 100vw section with `object-fit: cover` — so use large landscape-or-taller images (roughly 4:3 to 3:4 works; they'll be cropped by cover). They should read as a matched editorial set: dramatic, dark, industrial "engineering & speed" photography — think close-ups of aircraft engines, turbine intakes, streamlined land-speed vehicles, high-speed train noses and angular jet fuselages, mostly monochrome/desaturated with hard studio lighting on dark backgrounds. White or near-white machine bodies against black work best under the white titles.

## Behavior notes
- Everything is **scroll-driven and fully scrubbed** (reversible): scrolling back down plays every reveal backwards. Nothing autoplays on load except that the hero is static text.
- No pinning, no scroll hijacking beyond Lenis smoothing.
- Uses `100svh`/`150svh` so mobile browser chrome doesn't cause jumps.
- Responsive is handled purely by the `max-width: 1000px` font-size drop; the clip-path and char animations are percentage/offset based and work at any size.
- Keep `will-change: clip-path` on `.work-item-img` — the clip morphs are the heaviest part.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/clayboan-scroll-animation/work_01.jpg
https://motionprompts.dev/c/clayboan-scroll-animation/work_02.jpg
https://motionprompts.dev/c/clayboan-scroll-animation/work_03.jpg
https://motionprompts.dev/c/clayboan-scroll-animation/work_04.jpg
https://motionprompts.dev/c/clayboan-scroll-animation/work_05.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--steel`, `--haze`, `--cloud`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, walks the five `.work-item` sections it finds via `gsap.utils.toArray`, wires a `Lenis` instance pumped by a `gsap.ticker` callback, and then — inside that same loop — builds a `SplitText` per title and, from `split.chars.forEach`, one `ScrollTrigger` per character, plus two more per item scrubbing the image's `clipPath` on entry and exit. None of it ever has to undo itself, because the page it lives on never unmounts. React withdraws that guarantee first, and quietly: the gallery scrubs correctly on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component multiplies the usual doubling problem by its own loop: five `SplitText` instances, one `ScrollTrigger` per character across five titles of different lengths (Carbon Edge, Velocity Grid, Aeroform, Mach Horizon, Titan Rail), plus two clip-path triggers per item — several dozen live triggers before the first unmount can land. Mount it twice without tearing the first pass down and every character gets two triggers disagreeing about the same scrub position, both clip-path triggers per image fight over the same `clipPath` value, and Lenis's scroll gets driven by two ticker callbacks pumping the same wheel event at once. None of this reproduces in a production build, because React only double-invokes in development; treat the cleanup below as load-bearing.

*(1) The entry point* — the whole effect is wrapped in `document.addEventListener("DOMContentLoaded", ...)`. By the time a React component mounts, that event has already fired, so the listener is registered and never called: no split characters, no clip-path scrub, nothing to debug because nothing throws. Delete the listener and move its entire body — the Lenis/ticker wiring and the `.work-item` loop with its three kinds of `ScrollTrigger.create()` calls — directly into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger, SplitText)` and `gsap.ticker.lagSmoothing(0)` belong at module scope instead: both are one-time, app-wide configuration, not per-mount state.

*(2) Element lookups* — `gsap.utils.toArray(".work-item")` is unscoped, and `item.querySelector(".work-item-img")` / `item.querySelector(".work-item-name h1")` only inherit whatever scope `item` already has. Give the component a root ref on the element wrapping the hero, the five `.work-item` sections and the outro, and scope the array lookup to it (`gsap.utils.toArray(root.querySelectorAll(".work-item"))`) — the two per-item lookups are then correctly scoped for free, since `item` is already one of the right five. During the StrictMode remount two copies of the gallery exist for an instant, and an unscoped `toArray` can bind to the five sections on their way out — every character's scroll window and both clip-path triggers for that mount would target an image and a title no longer in the visible tree.

*(3) Cleanup* — wrap the whole loop in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, then the work-item loop: SplitText.create,
    // the per-char ScrollTrigger.create calls, and the two clip-path triggers
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Every `ScrollTrigger.create` here passes its tween straight in as `animation`, and every one of those calls runs synchronously while the loop executes — the per-character triggers included, since `split.chars.forEach` is itself invoked synchronously inside the outer `.work-item` loop. `gsap.context` needs nothing special to catch them: the enter reveal, the exit conceal, and every character's own trigger, however many that turns out to be per title, are all recorded the instant they're created. One `ctx.revert()` kills all of them and restores whatever inline `clipPath` and per-character `y` transform GSAP last wrote.

What the context does not reach is `gsap.ticker.add((time) => { lenis.raf(time * 1000); })` — a ticker subscription is neither a tween nor a trigger, and here it is the component's entire drive mechanism for Lenis, since there is no separate `requestAnimationFrame` loop to fold that concern into. Keep the function reference and remove it explicitly, before destroying Lenis, or a tick landing between the two calls invokes `.raf()` on an instance already torn down:

```jsx
const onTick = (time) => { lenis.raf(time * 1000); };
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

`lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — that listener lives on the Lenis instance's own emitter, so `lenis.destroy()` clears it as a side effect. Lenis is a document-level resource, not this gallery's alone: if this page becomes one route among several, lift the `new Lenis()` call to the app shell and have this effect subscribe the shared instance instead of constructing a second one that fights the first over the same wheel event.

The five `SplitText` instances need explicit handling `gsap.context` cannot give them. Collect each `SplitText.create(nameH1, { type: "chars", mask: "chars" })` return value into an array as the loop creates it, and revert every one in the cleanup **after** `ctx.revert()`, not before: with the scrub smoothing this component uses on every per-character trigger, a tick can still be interpolating a `y` write to a `char` element right up to the moment the tree unmounts, and killing the triggers first guarantees nothing is still writing to a node the split is about to unwrap. `mask: "chars"` wraps every character in its own overflow-clipping element on top of the plain span a bare `type: "chars"` split would produce, and one un-reverted title on a remount nests a second mask inside the first — the existing per-character offset then animates the wrong, doubly-wrapped node, cascading against a mask whose height no longer matches the title's real line box.

That line-box measurement is also why the split's timing matters here specifically: the titles render at a `5rem` (`2.5rem` below the `1000px` breakpoint), weight-**550** Inter Tight, and `SplitText.create` measures each character's box the instant it runs. If the effect fires before that variable-weight face has actually painted — Inter Tight loads as a web font, not something guaranteed ready at mount — the split measures the fallback face's character widths instead, so the masks `mask: "chars"` builds end up sized wrong and the hidden starting position lands outside its own box. Gate the split behind `document.fonts.ready`, guarded with the same cancellation flag any post-mount promise needs, so a StrictMode unmount landing first doesn't split — and then animate — titles no longer in the tree.
