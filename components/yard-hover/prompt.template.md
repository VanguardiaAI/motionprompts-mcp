---
slug: yard-hover
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 11
structural:
  - { kind: duration, literal: "0.3", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Editorial Hover Menu — text roll-swap rows + cursor-trailing stacked clip-path image preview

## Goal

Build a full-width list of large uppercase project rows. Hovering the whole list dims every row's text to grey; hovering an individual row **rolls its text upward and swaps in an identical black duplicate line** (the active row snaps to black, the rest stay grey). At the same time a small **stacked image-preview card follows the cursor with lag** and the hovered row's thumbnail **wipes into view from the bottom via an animated `clip-path` polygon**. Leaving the list wipes all previews upward and out. Everything is hover/mousemove-driven — no scroll, no click, no autoplay.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) only — **no GSAP plugins**, no ScrollTrigger, no smooth-scroll library. Single import: `import gsap from "gsap";`. All logic runs inside a `DOMContentLoaded` listener.

## Layout / HTML

```
<body>
  <div class="container">
    <div class="preview">
      <div class="preview-img preview-img-1"></div>
      <div class="preview-img preview-img-2"></div>
    </div>
    <div class="menu">
      <div class="menu-item">
        <div class="info"><p>Field Notes</p></div>
        <div class="name"><p>Breathing Video Experience</p></div>
        <div class="tag"><p>Creative Design</p></div>
      </div>
      <!-- 4 more .menu-item rows -->
    </div>
  </div>
  <script type="module" src="./script.js"></script>
</body>
```

**5 menu-item rows.** Each row has exactly three label divs in this order: `.info` (short left label), `.name` (big centred project title), `.tag` (short right-aligned label), each wrapping a single `<p>`. The two `.preview-img` divs start empty — images are injected by JS. Use neutral, fictional editorial-studio copy (no real brand names), e.g.:

1. `Field Notes` / `Breathing Video Experience` / `Creative Design`
2. `Nocturne` / `Nocturne Noir Show` / `Event`
3. `Halcyon` / `Halcyon x Atlas` / `Creative Concept`
4. `Grid` / `Grid Seven Years` / `Art Direction`
5. `Pulse` / `Pulse Music Battle` / `Direction`

## Styling

- Reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`. Background stays default **white**, text default **black**.
- `img { width: 100%; height: 100%; object-fit: cover; }`.
- `.container { width: 100%; height: 100%; }`.
- `.menu { width: 100%; margin: 17.5em 0; }` (large top/bottom gap so the rows sit centred).
- `.menu-item { width: 100%; padding: 0 2em; display: flex; cursor: pointer; }` — a flex row.
- **Font:** `p { font-family: "PP Neue Montreal", "Neue Montreal", "Helvetica Neue", Arial, sans-serif; font-weight: 500; text-transform: uppercase; line-height: 100%; letter-spacing: -0.025em; }`. Any tight modern grotesque works; uppercase + tight tracking is the look.
- **The roll mechanism lives here** — `p { position: absolute; top: 0%; width: 100%; transition: color 0.25s; }`. Each label div gets a second `<p>` appended by JS; the second one sits below, off-view:
  ```css
  .info p:nth-child(2),
  .name p:nth-child(2),
  .tag p:nth-child(2) { top: 100%; color: #000; }
  ```
- `.info, .tag, .name { position: relative; overflow: hidden; }` — the `overflow: hidden` is what clips the rolling text to a single-line window.
- `.info, .tag { flex: 1; height: 14px; font-size: 14px; }` and `.tag { text-align: right; }`.
- `.name { flex: 4; height: 55px; font-size: 60px; text-align: center; }` (note the 55px clip window is slightly shorter than the 60px type — intentional).
- **Menu-wide dim on hover** (pure CSS): while the pointer is anywhere over the list, every row's *first* line goes grey; the black duplicate only appears when a specific row rolls:
  ```css
  .menu:hover .info p:nth-child(1),
  .menu:hover .name p:nth-child(1),
  .menu:hover .tag  p:nth-child(1) { color: rgb(165, 165, 165); }
  ```
- **Preview card:**
  - `.preview { position: absolute; top: 0; left: 0; width: 225px; height: 275px; z-index: 2; pointer-events: none; }` (a portrait ~4:5 box, non-interactive; JS drives its position via transforms).
  - `.preview-img { position: absolute; width: 100%; height: 100%; }`.
  - `.preview-img-2 { top: 20px; left: 20px; }` — the second layer is offset +20px down/right and paints on top (later in DOM), so the two layers read as a stacked/duplicated card.
  - `.preview-img img { position: absolute; top: 0; left: 0; }` (so stacked images overlap exactly within each layer).

## GSAP effect (exhaustive)

All animation is GSAP `gsap.to`. No timelines, no plugins.

### 0. Setup on `DOMContentLoaded`

- Define an array of **5 image sources** (portrait thumbnails), one per row, in row order.
- **Duplicate every label line.** For each `.menu-item`, for each of its `.info, .name, .tag` divs, read its `<p>`, create a new `<p>` with the *same* `textContent`, and append it. Now each label div has two identical `<p>`s: child 1 at `top: 0%` (visible), child 2 at `top: 100%` (below, black `#000`).

### 1. Text roll-swap — row `mouseover` / `mouseout`

Bind `mouseover` and `mouseout` on each `.menu-item`.

**mouseOverAnimation(row)** — roll the current lines up and the duplicates in:
```js
gsap.to(row.querySelectorAll("p:nth-child(1)"), { top: "-100%", duration: 0.3 });
gsap.to(row.querySelectorAll("p:nth-child(2)"), { top:  "0%",  duration: 0.3 });
```
**mouseOutAnimation(row)** — reverse it:
```js
gsap.to(row.querySelectorAll("p:nth-child(1)"), { top: "0%",   duration: 0.3 });
gsap.to(row.querySelectorAll("p:nth-child(2)"), { top: "100%", duration: 0.3 });
```
- Both `p`s in a div animate together (info + name + tag of that row roll as one). `duration: 0.3`, **no explicit ease** → GSAP default `power1.out`. No stagger, no delay.
- Because child 1 is CSS-greyed (menu is hovered) and child 2 is black, the visible effect is: the grey line slides up and out while the identical **black** line slides up into place — the active row turns black, others stay grey. On mouseout it rolls back to the grey line (with the CSS `color 0.25s` transition easing the recolor).

### 2. Image preview reveal — `appendImages(src)` (called on each row `mouseover`)

On `mouseover`, in addition to the text roll, inject and reveal the row's thumbnail into **both** preview layers:

1. Create two `<img>` (`img1` → `.preview-img-1`, `img2` → `.preview-img-2`), both `src = src`.
2. Set each image's **initial** inline `clip-path` to a polygon collapsed onto the bottom edge (zero height, invisible):
   `polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)`.
3. Append them, then reveal both together — the top edge lifts from the bottom to full-rect:
   ```js
   gsap.to([img1, img2], {
     clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)", // full rectangle
     duration: 1,
     ease: "power3.out",
     onComplete: () => { removeExtraImages(preview1); removeExtraImages(preview2); },
   });
   ```
   So each thumbnail **wipes up from the bottom** over **1s `power3.out`**.
4. `removeExtraImages(container)`: `while (container.children.length > 10) container.removeChild(container.firstChild);` — keep at most **10 images per layer**, dropping the oldest. A fresh pair is appended on **every** `mouseover` (including re-hovering the same row), so rapidly sweeping across rows stacks reveals; the newest reveals on top.

### 3. Wipe-out on leaving the list — `.menu` `mouseout`

```js
gsap.to(".preview-img img", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", // collapsed onto the top edge
  duration: 1,
  ease: "power3.out",
});
```
Every preview image (all layers, all stacked copies) **wipes upward and out through the top** over **1s `power3.out`** when the cursor leaves the whole menu.

### 4. Cursor-trailing preview — document `mousemove`

```js
document.addEventListener("mousemove", (e) => {
  gsap.to(".preview", {
    x: e.clientX + 300,
    y: e.clientY,
    duration: 1,
    ease: "power3.out",
  });
});
```
The `.preview` card chases the pointer with heavy lag (**1s `power3.out`** per move), **offset +300px on X** (it trails to the right of the cursor) and tracks Y directly. Because `.preview` starts at `top:0; left:0` and is moved only by GSAP `x/y` transforms, it flies in from the top-left on first movement.

## Assets / images

**5 portrait photographic project thumbnails** (~4:5 / 225×275), one per row, loaded in row order. Editorial/creative-studio imagery — moody stills, performance/event shots, art-direction frames — with a coherent palette; cropped with `object-fit: cover`. No logos or brand marks. (If fewer fixtures exist than rows, repeat them in order.)

## Behavior notes

- **Desktop / mouse-only.** The whole effect is hover + mousemove; there is no touch or keyboard fallback (leave as-is).
- Preview images intentionally **accumulate** as a stack (capped at 10 per layer); there is no per-row cleanup — old images are only dropped by the 10-cap or wiped out on `.menu` `mouseout`.
- No re-entrancy guards — GSAP naturally overwrites in-flight tweens when the pointer moves quickly between rows.
- No console errors; nothing scrolls.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/yard-hover/img1.jpg
https://motionprompts.dev/c/yard-hover/img2.jpg
https://motionprompts.dev/c/yard-hover/img3.jpg
https://motionprompts.dev/c/yard-hover/img4.jpg
https://motionprompts.dev/c/yard-hover/img5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--muted`, `--cobalt`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

This component adds a wrinkle to that story: StrictMode's double-invoke does not tear down and rebuild the DOM in between mount attempts — it re-runs the effect callbacks against the *same* nodes. Two of this component's steps are one-shot writes with no guard against running twice: the row-label duplication (`copyElements.forEach`) and every `gsap.to` call. Both need explicit handling below, not just the usual context revert.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no error, no menu, nothing to debug. Delete the listener and put its body directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — Give the component a root ref on whatever plays the role of `.container`, and scope the `.menu-item`, `.preview`, `.preview-img-1` and `.preview-img-2` lookups to it instead of `document.querySelectorAll`. One lookup cannot move: the `mousemove` listener that drives the cursor-trailing `.preview` card has to stay on `document`, because the pointer needs to keep updating the preview's position even while it is over the white space around the menu, not just over `.menu-item` rows. Bound at the document level, that listener does not go away when this component's subtree unmounts — it has to be removed by hand (see (3)).

*(3) Cleanup* — Wrap the row-roll tweens, the clip-path reveal and the cursor tracker in a `gsap.context` scoped to the root ref, and revert it in the cleanup. But look at where this script's five `gsap.to` calls actually live: `mouseOverAnimation`, `mouseOutAnimation`, `appendImages`, the `.menu` mouseout wipe and the `mousemove` tracker are all *called from event listeners*, never during the effect's own synchronous pass. `gsap.context` only attributes a tween to itself for the duration of a call it is actively wrapping — textual nesting inside the factory does not matter, only whether the call went through the context. A plain `gsap.context(() => { root.querySelector(".menu-item").addEventListener(...) })` therefore tracks none of this component's animations: by the time any of the five run, the factory has already returned. Register each handler by name with `self.add` instead, and reach it back through the context reference from the listener:

```jsx
useEffect(() => {
  const root = rootRef.current;
  let trackCursor;

  const ctx = gsap.context((self) => {
    self.add("rollIn", (row) => {
      gsap.to(row.querySelectorAll("p:nth-child(1)"), { top: "-100%" });
      gsap.to(row.querySelectorAll("p:nth-child(2)"), { top: "0%" });
    });
    self.add("trackCursor", (e) => {
      gsap.to(root.querySelector(".preview"), { x: e.clientX + 300, y: e.clientY });
    });
    // rollOut, appendImages and the .menu mouseout wipe register the same way.

    root.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("mouseover", () => ctx.rollIn(item));
    });

    trackCursor = (e) => ctx.trackCursor(e);
    document.addEventListener("mousemove", trackCursor);
  }, rootRef);

  return () => {
    document.removeEventListener("mousemove", trackCursor);
    ctx.revert();
  };
}, []);
```

Inside the factory the only legal name is `self` — `ctx` is still in its temporal dead zone there, and writing `ctx.add(...)` throws `Cannot access 'ctx' before initialization` and takes the whole tree down with it. `ctx` is only safe to use from the listeners registered outside the factory, exactly as shown.

`ctx.revert()` reaches exactly what these five named calls create — the row-roll tweens, the clip-path reveal on the preview images, the wipe-out, the cursor transform — and nothing else; it does not remove event listeners. The per-row `mouseover`/`mouseout` bindings and the `.menu` mouseout binding all live on nodes inside the root subtree, so React discards them along with the nodes when it unmounts — no action needed there. `document.addEventListener("mousemove", ...)` is the one exception, because `document` itself is never unmounted: keep the function reference and remove it explicitly, as above. Skip that and a StrictMode remount leaves two `mousemove` listeners on `document` — one bound to the reverted context, one to the live one — both pushing `x`/`y` at the same `.preview` element on every pointer move, which shows up as the preview card stuttering between two different lag trails instead of following the cursor smoothly.

The row-label duplication is a different kind of leftover: it is plain DOM cloning, not a GSAP call, so no context reverts it, and it is not safe to run twice. It reads whichever `<p>` is currently first in `.info`/`.name`/`.tag` and appends a clone — run it again against the same persisting nodes, which is what a StrictMode remount does, and each label ends up with three `<p>` children instead of two. The `p:nth-child(1)`/`p:nth-child(2)` selectors that the CSS dimming rule and `mouseOverAnimation`/`mouseOutAnimation` both depend on then address the wrong lines, and the extra third paragraph sits permanently on top of the first, unstyled and unanimated. Do not try to make this step revert-safe — there is no reason to build it at runtime at all. Author both `<p>` elements for each `.info`/`.name`/`.tag` directly in JSX, with the identical label text in each, and drop the duplication loop from the effect entirely.
