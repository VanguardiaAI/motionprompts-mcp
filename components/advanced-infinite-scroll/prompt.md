# Advanced Infinite Scroll — Endless Wrapping Editorial Menu with Velocity Squash & Tilt

## Goal
Build a **fullscreen, edge-to-edge vertical menu** of large editorial rows (a small category label + a huge serif title per row) that **loops endlessly in both directions**. You drive it by **mouse wheel** or by **click-and-drag** (and touch). A `requestAnimationFrame` loop **lerps** the scroll position for buttery inertia, and every row is repositioned each frame with `gsap.set` using a `y` **modifier** that runs `gsap.utils.wrap` so items that leave one edge seamlessly re-enter from the other — a true infinite recycle with only 10 DOM nodes. On top of that, the whole list **elastically scales down and tilts** proportional to the current scroll **velocity**: flick it fast and the rows shrink and rotate; let it settle and they spring back to `scale 1`, `rotate 0`. A dark, vignetted photo sits fixed behind everything.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) — **core only**. No plugins (no ScrollTrigger, no Draggable, no SplitText), no smooth-scroll library. The infinite wrap and the inertia are done by hand with `gsap.set` + `gsap.utils.wrap` + a manual `requestAnimationFrame` lerp loop.
```js
import gsap from "gsap";
```

## Layout / HTML
Class names are load-bearing — the JS and CSS query them.
```
.menu                              (fullscreen stage; the drag + wheel surface; cursor: grab)
  .menu-img                        (fixed full-bleed background image layer)
    img                            (the dark photo)
  ul.menu-wrapper                  (the list; list-style: none)
    li.menu-item                   (one row — repeated 10×; absolutely positioned, moved by JS)
      .item-category > p           (small uppercase label, e.g. "Cinema")
      .item-name > p               (huge serif title, e.g. "La Strada Nascosta")
```
Use exactly **10** `.menu-item` rows with neutral, fictional category/title pairs (no real brands):
1. Cinema — La Strada Nascosta
2. Advertising — Echoes in Motion
3. Videoclip — Hyperspace
4. Cinema — Onda Silenziosa
5. Media — Nexus
6. Workshop — Between Lines
7. Media Kit — The Enigma
8. Cinema — Le Stelle Cadenti
9. Videoclip — Quantum Pulse
10. Advertising — Neon Flow

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; user-select:none; }`.

`html, body { width:100vw; height:100vh; background:#000; color:#fff; overflow:hidden; }` — the page never scrolls natively; all motion is JS-driven inside the fixed viewport.

`img { width:100%; height:100%; object-fit:cover; }`.

**Background layer**
- `.menu-img { position:absolute; top:0; left:0; width:100%; height:100%; }` — full-bleed photo.
- `.menu-img::after` — a **radial vignette** overlay on top of the photo that darkens toward the edges and goes pure black at the corners:
  ```css
  .menu-img::after {
    content:""; position:absolute; inset:0; z-index:1;
    background: radial-gradient(circle,
      rgba(0,0,0,0)    0%,
      rgba(0,0,0,0.75) 50%,
      rgba(0,0,0,1)    100%);
  }
  ```

**Stage / rows**
- `.menu { width:100%; height:100%; overflow:hidden; cursor:grab; }` and `.menu.is-dragging { cursor:grabbing; }` (JS toggles the class while dragging).
- `.menu-wrapper { list-style:none; }`.
- `.menu-item { position:absolute; top:0; left:0; width:100%; padding:4em 0; display:flex; gap:2em; }` — every row is stacked at the same absolute origin; JS gives each its own `y`. `padding:4em 0` (≈64px top+bottom at the default 16px root) sets the row rhythm and therefore the measured row height.
- `.item-category { flex:2; display:flex; justify-content:flex-end; align-items:flex-end; }` — right-aligned, bottom-aligned label column.
- `.item-name { flex:4; display:flex; align-items:flex-end; }` — bottom-aligned title column, twice as wide as the category column.

**Typography** (both faces are stylized display fonts; substitute close web equivalents and keep the *sizes/roles*):
- `.item-category p { font-family:"Dharma Gothic M", "Oswald", sans-serif; font-size:40px; text-transform:uppercase; }` — a **tall, condensed uppercase grotesque** for the small category tag.
- `.item-name p { font-family:"RL-Unno Test", "Playfair Display", serif; font-size:120px; line-height:90%; }` — a **large elegant serif** for the title; the `line-height:90%` (=108px) is what dominates the row height.

## GSAP effect (be exhaustive)

There is **no ScrollTrigger and no plugin** — the whole effect is (A) a hand-rolled inertial scroll value, (B) an infinite wrap that recycles rows, and (C) a velocity-reactive squash/tilt tween. Wire it as follows.

### 0. Refs & measured constants
```js
const menuElement       = document.querySelector(".menu");
const menuItemElements  = document.querySelectorAll(".menu-item");
let menuElementHeight   = menuElement.clientHeight;          // viewport height
let menuItemHeight      = menuItemElements[0].clientHeight;  // one row's live pixel height
let totalMenuHeight     = menuItemElements.length * menuItemHeight; // 10 rows tall
```
Scroll state:
```js
let currentScrollPosition = 0;  // the target (updated by wheel/drag)
let lastScrollY           = 0;  // previous frame's smoothed value (for velocity)
let smoothScrollY         = 0;  // the eased/lerped value actually rendered
```
Linear-interpolation helper (classic lerp):
```js
const interpolate = (start, end, factor) => start * (1 - factor) + end * factor;
```

### 1. Position + infinite wrap (called every frame)
```js
const adjustMenuItemsPosition = (scroll) => {
  gsap.set(menuItemElements, {
    y: (index) => index * menuItemHeight + scroll,
    modifiers: {
      y: (y) => {
        const wrappedY = gsap.utils.wrap(
          -menuItemHeight,                 // min
          totalMenuHeight - menuItemHeight, // max (exclusive)
          parseInt(y)
        );
        return `${wrappedY}px`;
      },
    },
  });
};
adjustMenuItemsPosition(0);  // initial layout
```
- Each row's **base y** is `index * menuItemHeight + scroll` — so at `scroll = 0` they stack 0, 1×H, 2×H … 9×H down the page.
- The **`modifiers.y`** function wraps that value into the half-open range `[-menuItemHeight, totalMenuHeight - menuItemHeight)` — a span of exactly `totalMenuHeight` (10 rows). A row pushed past the bottom edge instantly reappears one row above the top (and vice-versa), which is what makes the loop seamless and gap-free. `parseInt(y)` strips the unit before wrapping; the return is a px string.
- Because every row is `position:absolute; top:0` and gets its own transform `y`, this single `gsap.set` (with function-based `y`) lays out and recycles the entire list on each call.

### 2. Input → target scroll position
**Wheel** (note: bound to the legacy `"mousewheel"` event) accumulates the *negative* deltaY:
```js
const onWheelScroll = (event) => { currentScrollPosition -= event.deltaY; };
```
**Click/touch drag** with a **3× multiplier** so a short drag travels far:
```js
let startY = 0, currentY = 0, isDragging = false;

const onDragStart = (e) => {
  startY = e.clientY || e.touches[0].clientY;
  isDragging = true;
  menuElement.classList.add("is-dragging");   // cursor → grabbing
};
const onDragMove = (e) => {
  if (!isDragging) return;
  currentY = e.clientY || e.touches[0].clientY;
  currentScrollPosition += (currentY - startY) * 3;   // 3× drag gain
  startY = currentY;
};
const onDragEnd = () => {
  isDragging = false;
  menuElement.classList.remove("is-dragging");
};
```

### 3. The rAF loop — inertia + velocity squash/tilt (the star)
```js
const animate = () => {
  requestAnimationFrame(animate);

  // (A) ease the rendered scroll toward the target — inertia. Lerp factor 0.1.
  smoothScrollY = interpolate(smoothScrollY, currentScrollPosition, 0.1);
  adjustMenuItemsPosition(smoothScrollY);

  // (B) instantaneous velocity = how far the smoothed value moved this frame
  const scrollSpeed = smoothScrollY - lastScrollY;
  lastScrollY = smoothScrollY;

  // (C) drive the whole list's scale + rotation from that velocity
  gsap.to(menuItemElements, {
    scale: 1 - Math.min(100, Math.abs(scrollSpeed)) * 0.0075,
    rotate: scrollSpeed * 0.2,
  });
};
animate();
```
Exact semantics — reproduce these numbers precisely:
- **Inertia:** `smoothScrollY` chases `currentScrollPosition` with **lerp factor `0.1`** every frame — a soft, trailing catch-up that keeps gliding after you stop.
- **Velocity:** `scrollSpeed` is the signed per-frame delta of the *smoothed* position, so it grows while accelerating and decays to 0 as the lerp settles.
- **Scale (squash):** `scale = 1 - Math.min(100, |scrollSpeed|) * 0.0075`. Speed is clamped at 100, so scale bottoms out at `1 - 100*0.0075 = 0.25` on a hard flick and returns to `1.0` at rest. Applied to **all rows uniformly**.
- **Rotate (tilt):** `rotate = scrollSpeed * 0.2` **degrees** — signed, so scrolling up tilts one way and down the other; 0° at rest.
- **The tween itself:** this is a plain `gsap.to` with **no explicit `duration` or `ease`**, so it uses GSAP's defaults (**`duration: 0.5`, `ease: "power1.out"`**). It is re-issued **every frame**, and GSAP's overwrite means each new tween retargets the in-flight scale/rotate — the net result is a smooth, slightly *elastic* lag where the squash/tilt trails the motion and springs back. Do **not** add a duration; the every-frame re-tween is exactly what produces the elastic feel.
- Note the layering: `gsap.set` writes each row's `y` (per-item) every frame while `gsap.to` tweens `scale`/`rotate` (shared) — GSAP composes all three onto the same transform, so position, squash, and tilt coexist.

### 4. Listeners & resize
```js
menuElement.addEventListener("mousewheel", onWheelScroll);
menuElement.addEventListener("touchstart", onDragStart);
menuElement.addEventListener("touchmove",  onDragMove);
menuElement.addEventListener("touchend",   onDragEnd);
menuElement.addEventListener("mousedown",  onDragStart);
menuElement.addEventListener("mousemove",  onDragMove);
menuElement.addEventListener("mouseleave", onDragEnd);
menuElement.addEventListener("mouseup",    onDragEnd);
menuElement.addEventListener("selectstart", () => false);   // block text selection while dragging

window.addEventListener("resize", () => {
  menuElementHeight = menuElement.clientHeight;
  menuItemHeight    = menuItemElements[0].clientHeight;
  totalMenuHeight   = menuItemElements.length * menuItemHeight;
});
```

## Assets / images
**1 image**, role = *fixed full-bleed background behind the scrolling menu*. A single **dark, moody, cinematic photograph** (any aspect — it is `object-fit:cover` over the full viewport; landscape works best). It is heavily dimmed by the CSS radial vignette so only the center peeks through and the edges go black; a low-key, desaturated frame (a dim interior, a night scene, atmospheric fog) reads best behind the white type. No logos, no brands.

## Behavior notes
- **Infinite in both directions** — wheel and drag can run forever; `gsap.utils.wrap` recycles the same 10 rows with no seam and no accumulating DOM.
- **Two inputs, one target:** wheel adds `-deltaY`, drag adds `(Δpointer)*3`, both into `currentScrollPosition`; the rAF lerp is the single source of what's rendered.
- **Cursor feedback:** `grab` at rest, `grabbing` (`.is-dragging`) while pressed; `selectstart → false` and `user-select:none` prevent text-selection artifacts during drag.
- **Reduced motion / mobile:** the effect is light (transforms only, ~10 nodes) and touch-enabled out of the box; no ScrollTrigger, canvas, or WebGL.
- On **resize**, re-measure `menuItemHeight`/`totalMenuHeight` so the wrap range stays correct.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/advanced-infinite-scroll/bg.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--pine`, `--fog`, `--sage`, `--grass`, `--hair`, `--gutter`, `--display`, `--ui`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone module: it grabs `.menu` and the ten `.menu-item` rows with global selectors the instant the file is evaluated, drives them from a `requestAnimationFrame` loop that also lives at module scope, and tracks scroll position, drag state and velocity in plain top-level `let`s that are meant to exist exactly once for the life of the page. React withdraws every one of those guarantees, and the failure here is not a thrown error — the menu renders, wheels and drags normally for a moment, and then quietly runs at double gain or keeps recycling rows after you've routed away.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. This component is unusually exposed to that, because none of its state lives inside an instance a remount can throw away — `currentScrollPosition`, `smoothScrollY`, `lastScrollY`, `isDragging`, `startY`, `currentY` and the three measured heights are all bare variables. Treat the cleanup as part of the effect, not an afterthought: it has to stop the loop, remove every listener, and leave no scroll state behind for the next mount to inherit.

*(1) The entry point* — There is no `DOMContentLoaded` guard here at all; the script runs at the top level, the moment the module is evaluated. `menuElement`, `menuItemElements`, the measured heights, and the first call to `adjustMenuItemsPosition(0)` all execute during import, followed immediately by `animate()` and the block of `addEventListener` calls. In React that is before your component has rendered anything, so `.menu` and `.menu-item` don't exist yet and every one of those lookups returns `null` or an empty `NodeList`. Move the whole body — measurements, the initial layout call, `animate`, and every listener registration — into a `useEffect` with an empty dependency array. Leaving any of it at module scope means it runs once for the life of the page and every mount after the first reuses stale heights and a stale scroll position; leaving it in the component body means it re-measures and re-adds every listener on every render.

*(2) Element lookups* — `document.querySelector(".menu")` and `document.querySelectorAll(".menu-item")` both assume this component owns the document. Put a `ref` on the `.menu` stage element itself — the node the script calls `menuElement` — and read `menuItemElements` off that ref (`rootRef.current.querySelectorAll(".menu-item")`) instead of off `document`. This is not cosmetic here: during the StrictMode remount two copies of `.menu` exist for an instant, and an unscoped `querySelectorAll` can bind `menuItemElements` to the ten rows that are on their way out — after which the rAF loop spends its whole life positioning elements no longer attached to anything.

*(3) Cleanup* — Wrap the setup in a `gsap.context` scoped to the root ref, but this component needs one thing beyond the usual revert: the `gsap.set` call inside `adjustMenuItemsPosition` and the `gsap.to` that drives scale/rotate are not only called once during setup, they're re-issued from inside `animate` on every single frame, indefinitely, for as long as the loop runs. A plain `gsap.context(fn, scope)` only auto-tracks animations created synchronously while `fn` itself is executing; by the time a later animation frame calls back into `animate`, that synchronous window has long closed, so those per-frame tweens are invisible to `ctx.revert()`. Use the context argument GSAP passes into your setup function and route the recurring calls through `self.add()` so they register:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const items = root.querySelectorAll(".menu-item");
  let currentScrollPosition = 0;
  let lastScrollY = 0;
  let smoothScrollY = 0;
  let rafId;

  const ctx = gsap.context((self) => {
    adjustMenuItemsPosition(items, 0);
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      smoothScrollY = interpolate(smoothScrollY, currentScrollPosition, ONE_TENTH);
      self.add(() => {
        adjustMenuItemsPosition(items, smoothScrollY);
        const scrollSpeed = smoothScrollY - lastScrollY;
        lastScrollY = smoothScrollY;
        gsap.to(items, { scale: squashFor(scrollSpeed), rotate: tiltFor(scrollSpeed) });
      });
    };
    animate();
  }, rootRef);

  return () => {
    cancelAnimationFrame(rafId);
    ctx.revert();
  };
}, []);
```

Cancel the loop before you revert, in that order: `cancelAnimationFrame` stops any new frame from calling back in, and only then does `ctx.revert()` need to clean up whatever the last tracked frame actually created — including the scale/rotate tween that's still catching up to rest when the unmount lands mid-flick, which `revert()` can now kill instead of leaving to finish out its own default timing against a root that's about to disappear.

Move `currentScrollPosition`, `lastScrollY`, `smoothScrollY`, `isDragging`, `startY`, `currentY` and the three measured heights (`menuElementHeight`, `menuItemHeight`, `totalMenuHeight`) from module-level `let` into variables declared inside this same effect. As written, those are initialized once when the file is first imported, not once per mount — so a StrictMode remount doesn't start the menu at rest, it inherits whatever `smoothScrollY` and drag flags the aborted first mount left behind, and if this menu is ever mounted twice on the same page, both instances read and write the same scroll position.

Finally, pair every listener with a matching removal in the same cleanup. `onWheelScroll`, `onDragStart`, `onDragMove` and `onDragEnd` are already named, so `removeEventListener` can reference them directly — but the `resize` handler and the `selectstart` handler are both inline anonymous arrows in the code above; give each a name so it can be removed too. This matters more than usual on this component because React does not recreate the `.menu` host node between the StrictMode unmount and remount — the same DOM element survives — so unremoved `mousewheel`/`touchstart`/`mousedown`/etc. listeners don't just leak, they double up on that surviving node. A single wheel flick then fires `onWheelScroll` twice per event, and the menu scrolls and drags at twice the intended gain: the concrete shape "doubled speed" takes here. The `resize` listener is worse if left on `window`, since `window` itself is never torn down — an un-removed subscription accumulates one extra copy per mount for the life of the tab, each one re-measuring the same three heights redundantly on every future resize.
