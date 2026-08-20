# Scroll Image Reveal Sequence — Clip-Path Wipe Cross-Dissolve + Zoom-to-3×

## Goal
Build a long, quiet vertical-scroll story on a black page. Seven giant centered word-headers ("VACCUM", "EMBER", "SCRATCH", "AZURE", "SYNTHESIS", "EUPHORIA", "THE END") are spaced far apart and scroll up the screen. Fixed dead-center sits a single 500×700 portrait "window". As each header approaches, its matching editorial photo **wipes up into view** through a `clip-path` reveal, and while it holds the frame its inner image **continuously zooms from scale 1 to scale 3**; then, as the next header arrives, the old photo **wipes up and out the top** while the next photo wipes up from the bottom — a seamless upward cross-dissolve of six images driven entirely by GSAP ScrollTrigger scrub. A small fixed line of intro copy sits behind the window and is only visible in the gaps.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the single GSAP plugin **`ScrollTrigger`**. Register with `gsap.registerPlugin(ScrollTrigger)`. **No Lenis, no SplitText, no CustomEase, no Three.js, no canvas** — native browser scroll only. No build framework; Claude will scaffold Vite + npm.

## Layout / HTML
Class names and IDs are load-bearing — the JS/CSS query them. One outer `.container` holds three stacked layers:

```
<div class="container">
  <!-- Layer A: fixed intro copy, sits BEHIND the image window -->
  <div class="intro-copy">
    <p>This message stays right here,</p>
    <p>no matter where you go,</p>
    <p>it won't move an inch,</p>
    <p>even if you scroll up or down.</p>
  </div>

  <!-- Layer B: the tall scrolling headers (this is what creates the scroll length) -->
  <div class="headers">
    <section id="section-1"><h1>Vaccum</h1></section>
    <section id="section-2"><h1>Ember</h1></section>
    <section id="section-3"><h1>Scratch</h1></section>
    <section id="section-4"><h1>Azure</h1></section>
    <section id="section-5"><h1>Synthesis</h1></section>
    <section id="section-6"><h1>Euphoria</h1></section>
    <section id="section-7"><h1>The End</h1></section>
    <div class="spacer"></div>
  </div>

  <!-- Layer C: fixed 500x700 image stack, sits ON TOP -->
  <div class="section-previews">
    <div class="img" id="preview-1"><img src="…img-1…" alt="" /></div>
    <div class="img" id="preview-2"><img src="…img-2…" alt="" /></div>
    <div class="img" id="preview-3"><img src="…img-3…" alt="" /></div>
    <div class="img" id="preview-4"><img src="…img-4…" alt="" /></div>
    <div class="img" id="preview-5"><img src="…img-5…" alt="" /></div>
    <div class="img" id="preview-6"><img src="…img-6…" alt="" /></div>
  </div>
</div>
```

Notes:
- **Exactly 7 `<section>` headers but only 6 `#preview-N` images.** Section 7 ("The End") is the outro header and has no image — it only serves to trigger the conceal of the last (6th) image. Keep the header words verbatim, including the intentional spelling "**Vaccum**".
- The `.spacer` is an empty 200px-tall div after the last section.
- The six `#preview-N` divs are absolutely stacked on top of each other inside the fixed window; each `.img` wrapper carries the `clip-path`, the inner `<img>` is what gets scaled.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box }`.

`html, body`: `width:100%; height:100%; background:#000; font-family:"PP Neue Montreal"` — that face is not actually loaded, so fall back to a neutral grotesque sans (system-ui / Helvetica / Arial); the font is not load-bearing to the effect.

`.container { width:100%; height:100% }`.

`img { width:100%; height:100%; object-fit:cover }` (fills the window; cover-crops the portrait).

`h1` (the header words): `color:#fff; font-size:14vw; font-weight:400; letter-spacing:-0.025em; text-transform:uppercase; text-align:center`. These are enormous — nearly full viewport width per word.

`p` (intro copy lines): `color:#fff; font-size:14px; font-weight:500; text-transform:uppercase; text-align:center`.

Layout / positioning (this geometry IS the effect's timing):
- `.intro-copy { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:0 }` — centered, pinned, low layer.
- `section { margin:150vh 0 }` — **each header has 150vh of margin above AND below.** Adjacent margins collapse, so consecutive headers are separated by ~150vh of empty scroll; this huge spacing is the runway that stretches each reveal/zoom out. There is also ~150vh before the first header.
- `.section-previews { position:fixed; width:500px; height:700px; top:50%; left:50%; transform:translate(-50%,-50%) }` — a fixed 5:7 window dead-center. No z-index set, but because it is the last positioned element in DOM it paints **above** both the `.intro-copy` (z-index:0) and the in-flow scrolling headers.
- `.img { width:100%; height:100%; position:absolute; overflow:hidden; clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%) }` — every preview starts **fully collapsed to a zero-height sliver at the bottom edge (invisible)**. `overflow:hidden` clips the scaled inner image.
- `.spacer { width:100%; height:200px }`.

Layering recap: fixed image window (top) → scrolling giant headers (middle) → fixed intro copy (bottom). When the window is empty (all previews collapsed) you see the intro copy and a header; once a preview reveals it covers the center.

## GSAP effect (be exact)
Two independent scrubbed systems run per section. **System 1** scales the active image; **System 2** wipes the `clip-path` of the image wrappers. They target different elements (System 1 → the inner `#preview-N img`; System 2 → the `#preview-N` wrapper), so they compose without conflict.

### System 1 — continuous zoom-to-3× of the active image (`scrub: 1`)
Loop over every `<section>` with `gsap.utils.toArray("section")` (all 7). For each `section` at `index` (0-based):

```js
const image = document.querySelector(`#preview-${index + 1} img`);
const startCondition = index === 0 ? "top top" : "bottom bottom";

gsap.to(image, {
  scrollTrigger: {
    trigger: section,
    start: startCondition,
    end: () => {
      const viewportHeight = window.innerHeight;
      const sectionBottom = section.offsetTop + section.offsetHeight;
      const additionalDistance = viewportHeight * 0.5;
      const endValue = sectionBottom - viewportHeight + additionalDistance;
      return `+=${endValue}`;
    },
    scrub: 1,
  },
  scale: 3,
  ease: "none",
});
```

- **Property:** inner `<img>` `scale` from **1 → 3** (linear, `ease:"none"`), tied to scroll via `scrub:1` (≈1s catch-up smoothing).
- **Start:** for the FIRST section only, `"top top"` (section-1's top hits the viewport top); for every other section `"bottom bottom"` (the section's bottom reaches the viewport bottom, i.e. as it enters from below).
- **End:** a *relative* distance `+=endValue` computed live by the callback above — `sectionBottom − viewportHeight + 0.5·viewportHeight`, i.e. it scrubs across roughly one-and-a-half-plus viewport heights of scroll so the zoom is slow and continuous while that photo owns the window.
- Because `#preview-7 img` does not exist, the 7th iteration's tween simply has no target (harmless GSAP "target not found" — keep 7 sections / 6 images as-is).

### System 2 — clip-path wipe reveal / conceal (`scrub: 0.125`)
Helper that lazily builds a scrubbed clip-path tween the first time its section crosses `start`:

```js
function animateClipPath(sectionId, previewId, startClipPath, endClipPath,
                         start = "top center", end = "bottom top") {
  const section = document.querySelector(sectionId);
  const preview = document.querySelector(previewId);
  ScrollTrigger.create({
    trigger: section,
    start, end,
    onEnter: () => {
      gsap.to(preview, {
        scrollTrigger: { trigger: section, start, end, scrub: 0.125 },
        clipPath: endClipPath,
        ease: "none",
      });
    },
  });
}
```

Important faithful-reproduction detail: `startClipPath` is passed but **never applied** — the tween is a `gsap.to` that animates from the element's *current* live clip-path to `endClipPath`. In practice the live value always equals the documented `startClipPath` (from CSS or the previous tween's end), so an equivalent, more robust implementation is a scrubbed `gsap.fromTo(preview, {clipPath:startClipPath}, {clipPath:endClipPath, ease:"none", scrollTrigger:{trigger:section,start,end,scrub:0.125}})`. Either way: **`ease:"none"`, `scrub:0.125`.**

The three clip-path polygon states (all 4-point polygons so they interpolate cleanly):
- **Collapsed-bottom (hidden):** `polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)` — zero-height at the bottom.
- **Full rectangle (visible):** `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`.
- **Collapsed-top (hidden):** `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)` — zero-height at the top.

Every reveal moves the TOP edge up (grows from bottom); every conceal moves the BOTTOM edge up (shrinks out the top) — so the whole stack reads as one continuous upward flow.

**First image reveal** (defaults `start:"top center"`, `end:"bottom top"`):
```js
animateClipPath("#section-1", "#preview-1",
  "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",  // hidden → 
  "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)");     //   full rect
```
As section-1 travels from its top-at-viewport-center to its bottom-at-viewport-top, image 1 wipes up into full view.

**Then loop `for (let i = 2; i <= 7; i++)`** with `currentSection = "#section-"+i`, `prevPreview = "#preview-"+(i-1)`, `currentPreview = "#preview-"+i`:

1. **Conceal the previous image** (window `start:"top bottom"` → `end:"center center"`):
```js
animateClipPath(currentSection, prevPreview,
  "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",  // full rect → 
  "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",      //   collapsed-top
  "top bottom", "center center");
```
As the next section enters from the viewport bottom up to its center reaching viewport center, the outgoing photo's bottom edge rises and it wipes away out the top.

2. **Reveal the current image** — only while `i < 7` (window `start:"center center"` → `end:"bottom top"`):
```js
if (i < 7) {
  animateClipPath(currentSection, currentPreview,
    "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)", // hidden → 
    "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",     //   full rect
    "center center", "bottom top");
}
```
As the same section passes from its center-at-viewport-center to its bottom-at-viewport-top, the incoming photo wipes up from the bottom into full view — overlapping the tail of the previous conceal for the cross-dissolve.

For `i === 7` (the "The End" header) only the conceal runs, hiding image 6; there is no reveal (and no 7th image).

### Summary of the choreography per transition
1. Photo N sits full-frame and slowly zooms toward 3× (System 1).
2. Section N+1 enters → photo N wipes up and out the top (System 2 conceal, `scrub 0.125`).
3. Section N+1 passes center → photo N+1 wipes up from the bottom (System 2 reveal) while it begins its own zoom.
Everything is scrub-linked and fully reversible: scrolling back up plays every wipe and zoom backwards.

## Assets / images
**Six portrait photographs**, one per header (sections 1–6), each filling the fixed 500×700 window (≈ **5:7 portrait**, `object-fit:cover`). Treat them as one matched set of **fine-art body studies** — close, cropped, sculpturally lit, nobody looking at the camera (no logos, no real brands). The essay is about skin, cloth and light, so the frames should feel like fragments of the same shoot. In order, matching the chapter that reveals each one:
1. *Ornament* — an editorial portrait of hands stacked with chunky silver rings covering a face, dark wavy hair, a warm plain wall behind.
2. *Repose* — a close-up of a woman with lowered eyes resting a hand on her bare shoulder, soft muted tones.
3. *Surface* — a portrait fragment with draped linen over a shoulder, sculptural window light.
4. *Gaze* — a study of clasped hands in chiaroscuro, painterly light.
5. *Mouth* — a profile in shadow with a single beam of light crossing the face.
6. *Close* — a study of a back and shoulder with fabric, soft directional light.

## Behavior notes
- **Fully scroll-scrubbed and reversible** — nothing autoplays on load. At the very top the window is empty (all previews collapsed) so only the fixed intro copy and the first giant header show; the first reveal begins once you start scrolling.
- **No scroll hijacking / no pinning** — the effect length comes purely from the `150vh` section margins; the image window and intro copy are `position:fixed` while the tall headers scroll past.
- Keep `overflow:hidden` on `.img` so the inner image scaling to 3× stays clipped to the 500×700 window.
- Because `ScrollTrigger`'s `end` for System 1 is a live callback, it recalculates on resize; call `ScrollTrigger.refresh()` if you add responsive breakpoints. The base build is desktop-centric (fixed 500px window); on narrow screens the window simply overflows less gracefully — no separate mobile layout is defined in the original.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/gabrielcontassot-scroll/img-1.jpg
https://motionprompts.dev/c/gabrielcontassot-scroll/img-2.jpg
https://motionprompts.dev/c/gabrielcontassot-scroll/img-3.jpg
https://motionprompts.dev/c/gabrielcontassot-scroll/img-4.jpg
https://motionprompts.dev/c/gabrielcontassot-scroll/img-5.jpg
https://motionprompts.dev/c/gabrielcontassot-scroll/img-6.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ground`, `--plate`, `--plaster`, `--dust`, `--plum`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: an ES module that runs its entire body the moment it is evaluated, reaches into the page through more than a dozen hard-coded ids, and wires up roughly twenty ScrollTrigger-linked tweens that are never expected to go away. React withdraws all three of those guarantees at once, and it does it quietly — the reveal-and-zoom sequence looks right on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This module builds that trigger set unevenly: `addImageScaleAnimation()` creates its scale tweens up front, but `animateClipPath()` only creates a bare `ScrollTrigger.create()` up front and defers the actual scrubbed tween to `onEnter` — the first time the user scrolls that section into view. A double mount that doesn't undo all of it leaves two full sets of `#section-N` triggers reading the same scroll position, two zoom tweens racing to set the same `<img>`'s scale, and — because `onEnter` fires only once per approach — a real chance that only one of the two mounted copies ever gets its clip-path tween built at all, so the wipe silently never happens on whichever copy loses that race. None of this reproduces in a production build, because React only double-invokes effects in development; treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — The script runs at the top level: the opening `gsap.to(".intro-copy", …)` fade, the `addImageScaleAnimation()` call, the initial `animateClipPath("#section-1", "#preview-1", …)` call, and the `for (let i = 2; i <= totalSections; i++)` loop that wires sections two through seven all execute the instant the module is evaluated. In React that is import time, before this component has rendered a single `<section>` or `<img>`, so every one of those lookups fails silently or binds to nothing. Move the whole body — all four pieces, in the order they already run — into a `useEffect` with an empty dependency array. Do not leave any of it in the component body: re-running `addImageScaleAnimation()` and the clip-path loop on every render would rebuild the entire trigger set this component owns, over and over, without ever tearing down the previous one.

*(2) Element lookups* — Every lookup here, including the ones baked into `animateClipPath`'s default parameters, is a hard-coded id: `#section-1` through `#section-7`, `#preview-1` through `#preview-6`, plus the class-based `.intro-copy`. Give the component a root ref and scope the `document.querySelector` calls to it — but scoping alone doesn't close the real gap. Ids are supposed to be document-unique, and both `document.querySelector("#preview-3")` and the untargeted `gsap.utils.toArray("section")` in `addImageScaleAnimation` (which walks the whole document by tag, not by ref) return whichever matching element comes first in the tree, regardless of which subtree it lives in. During the StrictMode remount, or if this component is ever rendered twice on the same page, two `#section-4`s and two `#preview-4`s exist simultaneously, and every trigger from both copies binds to whichever one happened to render first. Derive the ids per instance — a `useId()` prefix threaded through every `section-N` / `preview-N` in the JSX and through the lookup strings that reference them — before scoping anything, or the scoping fixes a problem a second instance re-creates one level up.

*(3) Cleanup* — Wrap the effect body in a `gsap.context` scoped to the root ref and revert it on cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // the intro-copy fade, addImageScaleAnimation(), and the animateClipPath calls
  }, rootRef);
  return () => ctx.revert();
}, []);
```

That covers the tweens `addImageScaleAnimation` builds and the synchronous half of what each `animateClipPath` call creates — but the twelve `animateClipPath` calls each defer their real work: the scrubbed tween against `preview` is only built inside that call's `onEnter`, well after `gsap.context`'s setup function has already returned. A tween created later, from inside a callback GSAP itself invokes on scroll, is not something `ctx.revert()` goes looking for. So a StrictMode remount can leave the first mount's lazily-built clip-path tween — and the second, nested `ScrollTrigger` it registers to drive its own scrub — still alive and scrubbing against a component that no longer exists, while the surviving copy builds an independent one against the same elements the next time the user scrolls past that same `onEnter`. The prompt above already documents the fix, for an unrelated reason: `startClipPath` is accepted but never actually applied, so the more robust shape is a scrubbed `gsap.fromTo` built directly, with no `ScrollTrigger.create`/`onEnter` indirection in between. Use that shape here — replace all twelve `animateClipPath` calls with direct `gsap.fromTo` calls, and every clip-path tween gets created synchronously inside the `gsap.context` callback, right alongside the scale tweens, so a single `ctx.revert()` catches all of it.
