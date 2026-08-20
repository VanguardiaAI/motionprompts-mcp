---
slug: mormal
native_system: entry-veil
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 3
structural_literals: 22
structural:
  - { kind: duration, literal: "3", rule: value/narrated }
  - { kind: duration, literal: "4", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: stagger, literal: "0.25", rule: value/narrated }
  - { kind: stagger, literal: "-0.25", rule: stagger/shape }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Image-Grid Assembly Intro → 6× Zoom Hero Reveal

## Goal
Build a **self-playing, full-viewport intro/preloader** for a creative portfolio. On load, **five vertical columns of images assemble themselves from off-screen** — odd columns slide up from below, even columns' tiles drop in from above, each column's tiles cascading in with a slow `power4.inOut` stagger. The moment the grid has locked together, the **entire image grid scales up 6×** (a big zoom-into-the-wall move) while, on the layer above it, the **nav links, a masked hero title, a slide counter and a strip of footer thumbnails all slide up into their clip-path frames**, and two small **"+" icons pop from scale 0 → 1**. It is one continuous GSAP timeline that plays exactly once on page load. The star effect is the **staggered multi-column grid assembly followed by the synchronized 6× grid zoom + masked content reveal**.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) **only** — no GSAP plugins, no ScrollTrigger, no smooth-scroll library, no scroll/hover/click interaction at all. The whole thing is a single load-triggered `gsap.timeline()`. Import:
```js
import gsap from "gsap";
```
The two "+" glyphs in the hero are rendered with the **Ionicons** web component (`<ion-icon name="add-sharp">`) — see **Icons** below for the exact version and where to get it. If you'd rather not add Ionicons, substitute any inline element containing a "+" mark — the animation only needs an element it can scale; just keep the same selectors/initial `scale(0)`.

## Layout / HTML
Two stacked full-viewport layers. The **image grid** is a `position: fixed` background layer; the **content** (nav / hero / footer) sits above it at `z-index: 2`.

```html
<div class="container">
  <div class="col c-1">
    <div class="item"><img src="<img 1>"  alt="" /></div>
    <div class="item"><img src="<img 2>"  alt="" /></div>
    <div class="item"><img src="<img 3>"  alt="" /></div>
    <div class="item"><img src="<img 4>"  alt="" /></div>
    <div class="item"><img src="<img 5>"  alt="" /></div>
  </div>
  <div class="col c-2"> …five .item/img, images 6–10… </div>
  <div class="col c-3"> …five .item/img, images 11–15… </div>
  <div class="col c-4"> …five .item/img, REUSE images 1–5… </div>
  <div class="col c-5"> …five .item/img, REUSE images 6–10… </div>
</div>

<div class="content">
  <nav>
    <div class="nav-item"><a href="#" id="active">Work</a></div>
    <div class="nav-item"><a href="#">About</a></div>
  </nav>

  <div class="hero">
    <div class="icon"><ion-icon name="add-sharp"></ion-icon></div>
    <div class="title"><p>The Regeneration Site</p></div>
    <div class="icon-2"><ion-icon name="add-sharp"></ion-icon></div>
  </div>

  <footer>
    <div class="preview">
      <!-- seven small thumbnails drawn from the set (e.g. images 1,2,3,4,5,6,8) -->
      <img src="…" alt="" /> … ×7
    </div>
    <div class="slide-num"><p>1 &mdash; 3</p></div>
  </footer>
</div>
```

- `.container` → the 5-column flex grid (background layer).
- Each `.col` (`.c-1` … `.c-5`) → a flex **column** holding exactly five `.item`s; each `.item` wraps one `<img>`.
- `.content` → nav + hero + footer, above the grid.
- Keep all copy neutral/fictional: nav "Work" (active) / "About", hero title "The Regeneration Site", slide counter "1 — 3". No real brand or client names anywhere.

## Styling

**Page shell**
- `html, body`: `width: 100vw; height: 100vh; overflow: hidden;` background `#141414`, `font-family: "Neue Montreal"` (any clean neutral sans-serif is fine as a fallback). The whole component is a fixed, non-scrolling screen.
- `img`: `width: 100%; height: 100%; object-fit: cover;`

**Grid (`.container` / `.col` / `.item`)**
- `.container`: `position: fixed; width: 100%; height: 100%; display: flex; gap: 1em;` (5 equal columns side by side). Default `transform-origin` = center (the 6× zoom scales from the center).
- `.col`: `position: relative; flex: 1; display: flex; flex-direction: column; gap: 1em;` (five equal-height tiles stacked).
- `.item`: `position: relative; flex: 1; overflow: hidden; background: gainsboro;` (a light placeholder shows behind any missing image; `overflow: hidden` clips the image).

**Content layer**
- `.content`: `position: relative; width: 100%; height: 100%; z-index: 2;` (renders above the fixed grid).
- `nav`: `position: fixed; width: 100%; padding: 2.5em; display: flex; justify-content: center; align-items: center; gap: 3em;`
- `.nav-item`: `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` (a full-rectangle mask over its own box). `.nav-item a`: `position: relative; top: 20px; text-decoration: none; color: #fff; opacity: 0.35;` — links start **20px below** their frame, so the clip-path hides them. `.nav-item a#active`: `opacity: 1;` (only the first link is fully lit).
- `.hero`: `position: absolute; width: 95%; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; color: #fff;`
  - `.icon` / `.icon-2`: `flex: 0.5; padding: 0 5em; font-size: 30px; opacity: 0.5;` (`.icon-2` is `text-align: right`). Their glyphs start hidden: `.icon ion-icon, .icon-2 ion-icon { transform: scale(0); }`.
  - `.title`: `flex: 2; text-align: center; font-size: 40px; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` (masked). `.title p`: `position: relative; top: 20rem;` in the stylesheet, replaced at mount by a **measured** offset (see below) — the title starts below its own mask, clipped out of view.

    **Hiding masked copy under a fluid mask — read this before picking a number.** The mask here is `.title`'s own border box, so the copy is hidden only while `top` > the height of that box. That height is not a constant: give the headline a `clamp()` size and let the `5em` padding of `.icon` / `.icon-2` squeeze the column, and the headline wraps to two lines on mid-width desktops while the subtitle wraps to two or three — the box swings from ~45px to ~220px depending on viewport width and user font scale. Two ways to get this wrong:
      - **A fixed pixel offset.** It clears the box at the width you tested and quietly stops clearing it at another. The failure is silent — nothing errors, nothing logs — and because this module is deferred, whatever CSS painted *is* frame 0 of the intro: a half-cropped headline sitting on screen at load and baked into any poster frame taken from it.
      - **A percentage offset.** `top: 180%` looks like the fix and is a no-op. Percentages on `top` resolve against the containing block's height, and `.title` is a flex item of `.hero` under `align-items: center`, so its cross size is content-based, i.e. **indefinite** — Gecko resolves it against an unconstrained size, WebKit treats it as `auto`, Blink passes an indefinite size: all three give **0**. Percentage `top` only works where the containing block has a definite height, which is why `.c-1 { top: 100% }` and `.col .item { top: 100% }` *do* work here (`.container` has `height: 100%`, and `.col` is stretched by the default `align-items: stretch`) — that is not the same case, do not copy it across.

    So: measure the mask in JS and set the pixel offset from it, and leave a deliberately oversized `rem` offset in the stylesheet for the first paint. `rem` because it must survive a user font-size change; oversized because the fallback has to fail *safe* (still hidden) instead of failing back to the bug. The alternative, if you would rather not touch JS, is `transform: translateY(...)` — percentages on `translate` resolve against the element's own border box and always resolve — but then each paragraph moves by a fraction of *its own* height rather than the mask's, so the headline and the subtitle no longer travel as one block.
- `footer`: `position: absolute; bottom: 0; width: 100%;`
  - `.preview`: `position: absolute; bottom: 2em; right: 2em; display: flex; gap: 0.3em; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` (masked). `.preview img`: `position: relative; top: 100px; width: 80px; height: 50px;` — the thumbnail strip starts **100px below**, clipped.
  - `.slide-num`: `margin: 3em 0; text-align: center; color: #fff; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` (masked). `.slide-num p`: `position: relative; top: 30px;` — starts **30px below**, clipped.

**Off-screen start positions of the grid (load-bearing — this is what the timeline animates FROM):**
```css
/* odd columns: the whole column is pushed one viewport DOWN … */
.c-1, .c-3, .c-5 { top: 100%; }
/* … and their tiles are ALSO pushed one viewport down */
.c-1 .item, .c-3 .item, .c-5 .item { top: 100%; }
/* even columns: their tiles are pushed one viewport UP (columns themselves stay at top:0) */
.c-2 .item, .c-4 .item { top: -100%; }
```
Because `.item`/`.col` are `position: relative`, a `top` of `100%` / `-100%` resolves against the column height (≈ full viewport), so every off-screen tile is a full screen-height away. `overflow: hidden` on `body` clips them until they slide in.

**Responsive** `@media (max-width: 900px)`: `.title` font-size → `30px`; `.icon`/`.icon-2` → `padding: 0 1em; font-size: 16px;`; `.preview img` → `60px × 40px`; `.slide-num` → left-aligned (`text-align: left; padding-left: 2em; margin-bottom: 2.5em`). Nothing about the animation changes.

## GSAP effect (exhaustive)

One timeline, created at module top, no delay: `const tl = gsap.timeline({ delay: 0 });`. Every tween below is `ease: "power4.inOut"` and `duration: 3` **except where noted**. Position parameters (`"-=n"`) are relative to the current end of the timeline. Here is the exact build order and the absolute start times it produces:

1. **Columns rise into place.**
   ```js
   tl.to(".col", { top: "0", duration: 3, ease: "power4.inOut" });
   ```
   Animates all five columns' `top` → `0`. In practice only the **odd** columns (`.c-1/.c-3/.c-5`, which started at `top: 100%`) visibly slide up a full viewport; the even columns were already at `top: 0`. Runs **t = 0 → 3s**.

2. **Column 1 tiles cascade up (top → bottom).**
   ```js
   tl.to(".c-1 .item", { top: "0", stagger: 0.25, duration: 3, ease: "power4.inOut" }, "-=2");
   ```
   The five `.c-1` tiles slide `top: 100%` → `0` with a **positive 0.25s stagger** (first tile first, going down the column). Position `"-=2"` → starts at **t = 1s**.

3. **Column 2 tiles cascade down (bottom → top).**
   ```js
   tl.to(".c-2 .item", { top: "0", stagger: -0.25, duration: 3, ease: "power4.inOut" }, "-=4");
   ```
   The five `.c-2` tiles slide `top: -100%` → `0` (dropping in from above) with a **negative 0.25s stagger** (`stagger: -0.25` reverses the order — last tile first, cascading upward). `"-=4"` → starts at **t = 1s**.

4. **Column 3 tiles** — same as column 1: `stagger: 0.25`, `top: 100%` → `0`, `"-=4"` → starts **t = 1s**.
5. **Column 4 tiles** — same as column 2: `stagger: -0.25`, `top: -100%` → `0`, `"-=4"` → starts **t = 1s**.
6. **Column 5 tiles** — same as column 1: `stagger: 0.25`, `top: 100%` → `0`, `"-=4"` → starts **t = 1s**.

   Net: at **t ≈ 1s** all five columns' tiles begin sliding into their frames at once — odd columns rising from below, even columns dropping from above, each column self-cascading over 3s. The grid is fully assembled by **≈ t = 5s**.

7. **The whole grid zooms 6×.**
   ```js
   tl.to(".container", { scale: 6, duration: 4, ease: "power4.inOut" }, "-=2");
   ```
   `.container` scales `1` → `6` from its center over **4s**, `"-=2"` → starts at **t = 3s** (so the zoom is already underway while the last tiles are still settling). The grid rushes toward the viewer and blows past the edges, uncovering the dark background and the content layer.

8. **Content reveals up through the clip-path masks.**
   ```js
   tl.to(".nav-item a, .title p, .slide-num p, .preview img",
     { top: 0, stagger: {{motion.stagger.tight}}, duration: 1, ease: "power3.out" }, "-=1.5");
   ```
   All masked content elements animate their `top` → `0` (nav links from 20px, title from 1.8× its measured mask height, slide counter from 30px, each preview thumb from 100px), sliding up into their clip-path frames with a **0.075s stagger**, `duration: 1`, `ease: "power3.out"`. `"-=1.5"` → starts at **t = 5.5s**, overlapping the tail of the zoom.

   Note the tween never *sets* a hidden state — it only animates towards `0`, and it reads its start value from whatever is on the element when it first renders. That is why the title's offset is installed at mount:

   ```js
   const titleFrame = document.querySelector(".title");
   const titleLines = gsap.utils.toArray(".title p");
   let titleRevealed = false;                       // the tween above flips this in onStart
   const hideTitle = () => {
     if (titleRevealed) return;                     // never shove it back once it is in flight
     gsap.set(titleLines, { top: Math.ceil(titleFrame.offsetHeight * 1.8) });
   };
   hideTitle();
   new ResizeObserver(hideTitle).observe(titleFrame); // late web font, resize, user font scale
   ```

   The `1.8` is choreography, not safety: any value above `1` hides, and `1.8` is the ratio the small-screen layout has always had (a 110px offset over a ~62px mask), so both paragraphs travel as one block and the copy stays clipped for the first ~44% of the slide at every width. Setting `top` on relatively positioned children does not change the height of the frame, so the observer cannot loop. Disconnect it when you tear the component down.

9. **The two "+" icons pop in.**
   ```js
   tl.to(".icon ion-icon, .icon-2 ion-icon",
     { scale: 1, stagger: {{motion.stagger.tight}}, ease: "power3.out" }, "-=1");
   ```
   The two hero "+" glyphs scale `0` → `1` (**no `duration` set → GSAP default 0.5s**), `stagger: {{motion.stagger.tight}}`, `ease: "power3.out"`. `"-=1"` → starts at **t ≈ 6.25s**.

**Timeline summary:** total run ≈ **7.25s**, plays automatically once on load, never repeats. Trigger = page load only.

## Icons

This component uses **Ionicons v7.1.0** web components — `<ion-icon name="add-sharp">`.
Ionicons is **not** an npm import here: it is two classic `<script>` tags in `<head>`, and the
custom element does the rest.

The demo serves its own copy, pinned and content-hashed. Point at it directly, or download the two
files and serve them from your own origin:

```
https://motionprompts.dev/c/_vendor/ionicons-7.1.0.eeda8f3b/ionicons.esm.js
https://motionprompts.dev/c/_vendor/ionicons-7.1.0.eeda8f3b/ionicons.js
```

```html
<script type="module" src="/c/_vendor/ionicons-7.1.0.eeda8f3b/ionicons.esm.js"></script>
<script nomodule src="/c/_vendor/ionicons-7.1.0.eeda8f3b/ionicons.js"></script>
```

If you self-host, take the **whole** `ionicons/` folder (`npm i ionicons@7.1.0` →
`node_modules/ionicons/dist/ionicons/`): the loader fetches its `p-*.entry.js` chunks and one
`svg/<name>.svg` per icon at runtime, resolved relative to the script's own URL. Copying just the
two entry files gives you a page with no icons and no error.

Any equivalent icon set is an acceptable substitute — keep the element and its selectors so the
animation still has something to target.

## Assets / images
**15 unique portrait/tall images** (`object-fit: cover`, roughly 2:3–3:4 crops), plus reuse: columns 4 and 5 repeat columns 1 and 2's images, and the footer `.preview` strip shows **seven small 80×50 thumbnails** drawn from the same set. It is a curated, high-art editorial + 3D-render mix sharing a moody, cinematic, elegant mood rather than one literal subject — no logos or brand marks. A representative set:
- a cinematic dark render of a tiny lone figure walking toward a bright light between two angled monolith walls (teal/cream);
- a close-up of a racing/space helmet with a molten-gold reflective visor on lime green;
- a sci-fi spacesuited figure before a giant hazy sphere in a golden foggy sunset;
- a moody low-key portrait glimpsed through a rectangular cut-out (lower face, cigarette, blue nails);
- a silhouette pressing against frosted glass with warm orange backlight;
- a dramatic low-key studio portrait of a blonde woman, a shaft of light across her face;
- a 3D chrome robotic head in a mosaic-tiled conical hat and mirrored shades on a teal gradient;
- a minimal 3D golden lucky-cat figurine in a red circular niche on light grey;
- a conceptual portrait of a suited figure whose face is draped in translucent pale-blue tulle;
- a hazy golden-orange city skyline at sunset;
- a cool-toned portrait of a woman with wet slicked hair over her face, one red-nailed arm raised;
- a green-tinted 3D faceless muscular bust with soft bokeh;
- a vintage botanical illustration of red roses on pure black;
- a fashion portrait in oversized futuristic wraparound black visor sunglasses on amber-brown;
- a warm sunset shot of a woman on a paddleboard on calm water.

Any cohesive set of 15 moody editorial/cinematic portrait images works — the exact subjects don't matter, only the tall crop and dark, curated art direction.

## Behavior notes
- **Load-triggered only.** No scroll, no ScrollTrigger, no hover, no click, no loops — the intro auto-plays once and holds on the final revealed state.
- The screen is fixed and non-scrolling (`overflow: hidden` on `html/body`); all off-screen positioning uses percentage `top`, so it scales fluidly across viewports.
- **Check the very first frame at several widths, not just one — and at 160% text size.** Everything this intro reveals is hidden by a clip-path mask plus an offset, so a masked element that is correctly hidden at 1440px can be half-visible at 1024px once its box grows (wrapped headline, taller type) past a fixed offset. Nothing errors, nothing logs — it just shows up on load and in whatever poster frame you take from the intro. Sanity widths: 320, 390, 768, 960, 1024, 1280, 1440, 2560.
- Reduced-motion is **not** handled in the original — the animation always plays.
- Preview/verification: the full timeline takes ~7.25s, so allow ≥ ~12s before capturing the settled end state.

## Images

This component ships with 15 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/mormal/img1.jpg
https://motionprompts.dev/c/mormal/img10.jpg
https://motionprompts.dev/c/mormal/img11.jpg
https://motionprompts.dev/c/mormal/img12.jpg
https://motionprompts.dev/c/mormal/img13.jpg
https://motionprompts.dev/c/mormal/img14.jpg
… 9 more under https://motionprompts.dev/c/mormal/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--dim`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. For this component that means the whole roughly seven-second assembly-then-zoom
timeline restarts from its beginning the instant it is remounted: the columns and content that had
already coasted into their frames snap back off-screen and cascade in a second time. That replay
itself is not the bug — it is only visible in development, and a correct cleanup makes it harmless
by putting every node back exactly where the off-screen CSS expects it to be before the second
mount starts. The actual failure mode if cleanup is incomplete is silent and permanent: this intro
ends by disabling `pointerEvents` on `.container` once it has scaled up over the whole viewport,
and it wires `.preview` thumbnails to click handlers that mutate `.hero-bg`'s image and the
`.slide-num` counter directly. None of that is GSAP state, so nothing about `gsap.context` reverts
it automatically — a remount that forgets to undo it leaves the page's nav permanently unclickable,
or leaves two stacked `click` listeners toggling the same counter.

*(1) The entry point* — The script checks `document.readyState` before subscribing to
`DOMContentLoaded`. That guard exists to survive being loaded late in a plain document; in React it
is dead weight, because `useEffect` already runs after the DOM is committed. Drop the guard, the
listener, and the `window.MP` editor-registration branch alongside it — none of the three has a
counterpart in a shipped React page — and keep only the body of `mount(config)`, inside a
`useEffect` with an empty dependency array. That body already returns a function that kills the
timeline, unbinds the `.preview` listeners, and clears every inline style the timeline wrote: that
is your cleanup, once it stops being conditional on `window.MP`.

*(2) Element lookups* — Every `document.querySelector` here — `.container`, the five `.col`
groups, `.hero-bg` and its `img`, the `.preview` thumbnails, `.slide-num p`, the `.nav-item a`
links, `.title p`, the two `ion-icon` glyphs — assumes this component owns the whole document.
Give the component a root `ref`, render it on the element that wraps both the fixed image-grid
layer and the `.content` layer, and scope every one of those lookups to it (`root.querySelectorAll(...)`
instead of the bare global call). During the StrictMode remount two copies of this subtree exist
for an instant; an unscoped selector for `.hero-bg` or `.slide-num p` will happily bind to the copy
that is on its way out.

*(3) Cleanup* — Wrap the timeline this component builds in a `gsap.context` scoped to the root ref,
and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the nine-step timeline, the click wiring, exactly as described above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` undoes the timeline and the inline `top`/`scale`/`opacity` it wrote, but it does not
know about the three things this component does outside GSAP: the `.container.style.pointerEvents
= "none"` set from the timeline's `onComplete`, the `.preview` `click` listeners, and the
`.active`/`.visible` classes `showSlide` toggles on `.hero-bg` and the thumbnails. Undo all three
explicitly, in the same cleanup, after `ctx.revert()` — this component's own `destroy()` already
does exactly that (reset `pointerEvents`, remove the listeners it added, strip `.active`/`.visible`),
so porting it is a matter of keeping that block intact rather than trusting the context to cover it.
There is no `ctx.add(...)` anywhere in this component and none is needed: `showSlide` and the click
handlers that call it live in the same closure as the timeline, so they don't need to be attributed
to the context to be reachable later — they only need their own `removeEventListener` pairing in
cleanup, which is what the existing `offs` array already gives you.

Because every step of the timeline animates `top` (never a transform) on the grid tiles and the
masked content, an incomplete cleanup leaves inline `top: 0` sitting on nodes whose CSS says
`top: 100%` / `top: -100%`. `ctx.revert()` alone won't clear that — GSAP only restores properties it
is still tracking, and by the time cleanup runs the tween has already completed and released them —
so keep the explicit `gsap.set([...], { clearProps: "all" })` sweep over the columns, tiles,
`.container`, and every masked-content selector, the same way this component already does it, or
the second mount's cascade finds every tile already at its resting position and never animates.
