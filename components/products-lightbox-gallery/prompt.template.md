---
slug: products-lightbox-gallery
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 8
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "0.4", rule: value/narrated }
  - { kind: ease, literal: "\"power1.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Products Lightbox Gallery

## Goal
Build an **explorable product wall**: a huge fixed-size canvas (a 12×12 grid of 144 product tiles) that the user **pans around by click-dragging with the mouse**, where the drag follows the cursor with an eased, slightly inertial lag. **Clicking a single tile** (as opposed to dragging) **fades in a full-screen lightbox modal** that shows that product's image, name and info plus a "users also bought" panel. The two star effects are (1) the **GSAP-smoothed drag-to-pan** of the oversized grid and (2) the **opacity cross-fade of the lightbox** on open/close, with a precise **drag-vs-click disambiguation** so panning never accidentally opens a product.

## Tech
Vanilla HTML/CSS/JS with ES module imports, bundled by Vite. Use `gsap` (npm) **only** — **no GSAP plugins**, no ScrollTrigger, no SplitText, no CustomEase, no smooth-scroll library, no `requestAnimationFrame`/lerp loop, no Three.js. Every motion is a plain `gsap.to()` / `gsap.set()` / `gsap.getProperty()` call driven by native mouse events. Import:
```js
import gsap from "gsap";
```
The modal close button uses the **Ionicons** web component (`<ion-icon name="close-outline">`), loaded as two classic `<script>` tags — see **Icons** below for the exact version and where to get it (`type="module"` + `nomodule` fallback pair in `<head>`). If you'd rather not add Ionicons, put a plain "×" glyph inside the close button — the animation only needs a clickable circle.

Wrap all JS in `document.addEventListener("DOMContentLoaded", () => { … })`.

## Layout / HTML
Two independent pieces at the top level of `<body>`: an **empty `#container`** (the grid is generated entirely in JS) and a **`.modal`** authored statically in HTML (populated on click).

```html
<div id="container"></div>

<div class="modal">
  <div class="col product-view">
    <div class="close-btn">
      <div class="close"><ion-icon name="close-outline"></ion-icon></div>
    </div>
    <div class="product-img">
      <div class="product-img-container">
        <img src="/img/img1.jpg" alt="" />
      </div>
    </div>
    <div class="product-name">
      <div class="name">
        <h1>White | Phantom</h1>
        <p>The Volley Advantage</p>
      </div>
      <div class="cart-btn"><button>Add to cart</button></div>
    </div>
  </div>

  <div class="col product-info">
    <div>
      <p>Neutral placeholder paragraph, one or two sentences of product copy.</p>
      <p>A second, longer placeholder paragraph describing the product in three or four sentences.</p>
    </div>
    <div class="suggestions">
      <p>Users also bought</p>
      <div class="box"><img class="img" src="/img/img4.jpg"><p>The Volley Clubhouse</p><h1>White | Flint</h1></div>
      <div class="box"><img class="img" src="/img/img2.jpg"><p>The Volley Advantage</p><h1>White | Sand</h1></div>
    </div>
  </div>
</div>

<script type="module" src="./script.js"></script>
```

- `#container` starts **empty**; JS creates 144 `.box` tiles inside it, each tile = one `<img class="img">` + one `.content` wrapper holding a `<p>` (product line) and an `<h1>` (colorway name).
- `.modal` is a two-column flex row: **left `.col.product-view`** (the big product view, `flex: 3`) and **right `.col.product-info`** (copy + suggestions, `flex: 2`).
- Keep all copy **neutral/fictional** — no real brand or client names anywhere. Invent a fictional shoe line; use product lines like `"The Volley Advantage"`, `"The Volley Clubhouse"`, `"The Volley Centercourt"` and colorway names like `"White | Sand"`, `"White | Rust"`, `"White | Phantom"`.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box }`. `html, body { height:100%; overflow:hidden; font-family:"Neue Montreal" }` (any clean neutral sans-serif fallback is fine). **The page never scrolls** — panning is done by dragging the oversized canvas, so `overflow:hidden` is load-bearing.

Base typography:
- `img { width:100%; height:80%; object-fit:contain }` (images are letterboxed inside their tile, not cropped).
- `h1 { margin:5px 0; font-size:26px; font-weight:500 }`
- `p { font-size:10px; text-transform:uppercase; font-weight:500; margin-top:-15px; color:gray }`
- `ion-icon { position:relative; top:1.5px; font-size:18px }`

**The grid canvas (the thing you drag):**
- `#container`: `width:2080px; height:2880px; background:#ccc; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)`. **JS overrides the width** to `columns * boxSize = 12 * 240 = 2880px`, so the live canvas is **2880×2880**, a solid `#ccc` square centered in the viewport and far larger than the screen (only a portion is ever visible → you drag to explore).
- `.box`: `width:240px; height:240px; background:#f4efef; border:1px solid #dadada; float:left; padding:10px` (border-box, so 240 includes border+padding → exactly **12 tiles per row, 12 rows** = 144 tiles perfectly tiling the 2880² canvas). Each tile shows its contained product image on top and its `.content` (uppercase gray line + 26px name) below.
- `.suggestions .box p { margin:-15px 0 0 0 }` (tightens the label above the name inside suggestion cards).

**The lightbox modal:**
- `.modal`: `position:fixed; width:100vw; height:100vh; top:0; left:0; background:#f4efef; z-index:2; display:none`. It is **hidden by default** and switched to `display:flex` (a two-column row) by JS on open. Note there is **no `opacity` declared in CSS**, so its resting opacity is `1` (see the fade quirk in the GSAP section).
- `.col { height:100%; padding:2em }`.
- `.product-view { position:relative; flex:3; display:flex; flex-direction:column }`.
- `.product-info { flex:2; display:flex; flex-direction:column; justify-content:space-between; padding-bottom:5em }`.
- `.close-btn { position:absolute; right:0; width:40px; height:40px; display:flex; justify-content:center; align-items:center; background:#000; color:#fff; border-radius:100%; cursor:pointer }` (a black circle with a white close icon, pinned top-right of the product view).
- `.product-img { flex:5; padding-top:60px }` (the dominant hero image area).
- `.product-name { width:100%; height:100%; flex:3; display:flex; justify-content:space-between; align-items:center; padding:0 20px }`.
  - `.product-name h1 { font-size:60px; letter-spacing:-2px }` (large product title).
  - `.product-name p { margin:10px 0; font-size:15px }`.
- `.cart-btn button { background:#000; color:#fff; border:none; outline:none; padding:15px 40px; border-radius:4px; font-size:12px; text-transform:uppercase }` (a black "Add to cart" pill).
- `.product-info p { margin-top:0; margin-bottom:20px; font-size:20px; text-transform:none; color:#555555; line-height:100%; font-weight:400 }` (the body copy overrides the tiny uppercase gray `p` default).
- `.suggestions p { text-transform:uppercase; font-size:12px; font-weight:500; color:#7a7a7a }` ("Users also bought" label).
- Inside `.suggestions`, the two `.box` cards inherit the same 240×240 tile look and `float:left` side by side, each with a contained image + line + name.

## GSAP effect (exhaustive)

There is **no timeline and no load animation** — nothing moves until the user interacts. Three independent interaction handlers drive everything. Precise spec:

### 1. Grid generation (JS, no animation)
Constants: `boxCount = 12 * 12` (144), `boxSize = 240`, `totalImages = 5`, `columns = 12`. Set `container.style.width = columns * boxSize + "px"` (2880px). Define a `products` array of **15** objects `{ info, name }` (the fictional lines + colorways). Then loop `for (let i = 0; i < boxCount; i++)`:
- Create `.box`; create `img.img` with `src = "/c/products-lightbox-gallery/img" + ((i % totalImages) + 1) + ".jpg"` → the **5 images cycle** (img1…img5, img1…) across the whole wall.
- `product = products[i % products.length]` → the **15 products cycle** independently, so image↔product pairing repeats every 15 tiles.
- Create `<p>` = `product.info`, `<h1>` = `product.name`, wrap both in `.content`, append `img` + `content` to the box, append box to `#container`.
- Attach the three per-tile listeners below.

### 2. Drag-to-pan the whole canvas (the smoothed inertial pan)
State: `isContainerDragging = false`, `startCoords = {x,y}`, `startTranslate = {x,y}`. Listeners on `#container`: `mousedown → onDragStart`, `mouseup → onDragEnd`, `mouseleave → onDragEnd`, `mousemove → onDrag`.

- **`onDragStart(e)`**: `isContainerDragging = true`; record `startCoords = {x:e.clientX, y:e.clientY}`; read the **current transform** with `startTranslate.x = gsap.getProperty(container, "x")` and `startTranslate.y = gsap.getProperty(container, "y")`; then `gsap.set(container, { cursor:"grabbing" })` and `gsap.set(container, { userSelect:"none" })`.
- **`onDrag(e)`**: if not dragging, return. `e.preventDefault()`. Compute `deltaX = e.clientX - startCoords.x`, `deltaY = e.clientY - startCoords.y`, then `translateX = startTranslate.x + deltaX`, `translateY = startTranslate.y + deltaY`, and animate:
  ```js
  gsap.to(container, { x: translateX, y: translateY, duration: 0.5, ease: "power1.out" });
  ```
  **This is the whole "inertia" trick:** every `mousemove` fires a fresh `0.5s power1.out` tween toward the latest cursor-derived target. Because a new tween continuously overrides the previous one before it finishes, the canvas **eases toward the cursor with a soft trailing lag** rather than snapping 1:1 — and when the user stops moving, the last tween runs out its 0.5s, giving a gentle glide-to-rest. (No lerp loop or Draggable plugin — the smoothing is purely the overlapping short tweens.)
- **`onDragEnd()`**: if not dragging, return; `isContainerDragging = false`; `gsap.set(container, { cursor:"grab" })`; `gsap.set(container, { userSelect:"auto" })`.

### 3. Tile click → open lightbox (with drag-vs-click disambiguation)
Each `.box` carries its own `isDragging` / `isClicking` flags:
- `box.mousedown → isDragging = false; isClicking = true`.
- `box.mousemove → isDragging = true; isClicking = false` (any movement over the tile marks it a drag, not a click).
- `box.click`: **only if `!isDragging && isClicking`** (i.e. a clean click with no intervening move) do:
  ```js
  gsap.set(modal, { display: "flex" });
  gsap.to(modal, { opacity: 1, duration: 0.4 });
  productImg.src = img.src;                       // copy this tile's image into the hero
  modalProductName.textContent = product.name;    // .modal .product-name h1
  modalProductInfo.textContent = product.info;    // .modal .product-name p
  ```
  So the modal is un-hidden (`display:flex`), its opacity is tweened toward `1` over **0.4s**, and the clicked product's image + name + line are injected into the product view.

### 4. Close button → fade out & hide
`.close-btn` `click`:
```js
gsap.to(modal, {
  opacity: 0,
  duration: 0.4,
  onComplete: () => gsap.set(modal, { display: "none" }),
});
```
The modal fades `opacity 1 → 0` over **0.4s**, then `onComplete` sets `display:none` to fully remove it from layout.

**Opacity fade quirk (reproduce as-is):** because CSS never sets an initial `opacity`, the modal's resting opacity is `1`. On the **very first** open, `gsap.to(opacity:1)` is a no-op (already 1) so it appears instantly; the **close** tween takes it to `0`; every **subsequent** open then animates `0 → 1`, a visible 0.4s fade. This is the original behavior. (Optional polish: add `opacity:0` to `.modal` in CSS so even the first open fades in — but the reference does not.)

**Eases/durations summary:** pan = `duration:0.5, ease:"power1.out"` (re-fired per mousemove); modal open fade = `duration:0.4` (default ease); modal close fade = `duration:0.4` (default ease) + `display` toggle on complete. No stagger, no delay, no scrub, no pin anywhere.

## Icons

This component uses **Ionicons v7.1.0** web components — `<ion-icon name="close-outline">`.
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
**5 wide, full-color landscape images (~2:1, ~1024×510)**, referenced as `/img/img1.jpg … /img/img5.jpg` and **cycled** across all 144 tiles (and reused as the modal hero + the two suggestion thumbnails). They are `object-fit: contain`, so each sits letterboxed inside a light `#f4efef` tile — transparent or plain-background product shots read best. It is a **mixed product / editorial set** sharing a clean, minimal, catalog mood; the exact subjects don't matter, only that there are 5 wide full-color images. A representative set (describe by role, no brands):
- **img1** — studio close-up of a tan suede ankle boot with a stacked wooden block heel and squared toe, on a pale seamless backdrop.
- **img2** — warm sepia-toned macro beauty shot of a brow and closed eye (skin/hair texture), full-bleed.
- **img3** — black-and-white studio shot of an open hinged twin-mirror compact / silver case on a black ground.
- **img4** — a cream-and-rust high-top athletic sneaker floating amid red and white daisies against a soft pink backdrop.
- **img5** — overhead flat-lay of purple-themed streetwear (lilac backpack, folded white tee, chain, beanie, windbreaker and a pair of white/purple high-tops) on a deep-purple ground.

## Behavior notes
- **Desktop / mouse only.** All interaction is mouse events (`mousedown`/`mousemove`/`mouseup`/`mouseleave`/`click`); there is no touch or pointer-event handling in the original, so it is not mobile-safe as written.
- **Nothing animates on load or scroll.** The page is a fixed, non-scrolling screen; the only motion is the drag-pan and the modal fades.
- The disambiguation flags mean a click that included *any* mouse movement over the tile is treated as a pan and will **not** open the modal — only a clean, stationary click opens a product.
- Reduced-motion is **not** handled in the original; the 0.4s/0.5s tweens are short enough to be unobtrusive, but you may add a `prefers-reduced-motion` guard if desired.
- Light perf cost: pure CSS transforms (`x`/`y` on one element) + an opacity fade; no canvas, WebGL or physics.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/products-lightbox-gallery/img1.jpg
https://motionprompts.dev/c/products-lightbox-gallery/img2.jpg
https://motionprompts.dev/c/products-lightbox-gallery/img3.jpg
https://motionprompts.dev/c/products-lightbox-gallery/img4.jpg
https://motionprompts.dev/c/products-lightbox-gallery/img5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--canvas`, `--chalk`, `--tile-line`, `--ink`, `--body`, `--muted`, `--accent`, `--accent-dark`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, builds a 144-tile grid by hand with `createElement`/`appendChild`, wires 441 raw `addEventListener` calls across the container, the tiles and the close button, and never has to undo any of it. React withdraws all three of those guarantees at once, and it does it quietly — the wall of tiles still renders, the pan and the fade still animate, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. `#container` starts life as an **empty** `<div>` — the whole point of this markup is that JS, not HTML, owns its contents — and StrictMode's mount → cleanup → mount cycle re-runs the setup against that **same** committed node rather than a fresh one. A generation loop that isn't undone in the cleanup runs twice against the same container: the second pass appends 144 more `.box` elements next to the first pass's 144, doubling every image request and duplicating each of the fifteen product/colorway pairings, and it attaches a second `mousedown`/`mousemove`/`click` trio to every tile that survived the first pass unremoved. One real click after that runs a tile's own disambiguation logic twice in the same tick — harmless here since both copies agree on the same product — but the 288 DOM nodes and 864 listeners it leaves behind do not clean themselves up on a later real unmount, because by then there are two independent generations of tiles nobody is tracking. This reproduces on every single load in development, not on some eventual production edge case, because StrictMode's remount happens synchronously before a single `mousedown` has fired.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — the `#ccc` square sits there uncovered, no tiles, no drag, nothing to debug. Delete the listener and move its entire body — the `products` array, the generation loop, the drag-to-pan wiring (`onDragStart`/`onDrag`/`onDragEnd` and the `pointFrom` helper), the per-tile disambiguation, and the close-button handler — into a `useEffect` with an empty dependency array.

*(2) Element lookups, and the tiles React doesn't know about* — `container`, `.modal`, `.close-btn`, `.product-img img`, `.modal .product-name h1` and `.modal .product-name p` are all resolved from `document`; give the wrapping element a root `ref` and resolve every one of them from it instead. This is not cosmetic: `.modal` and `.close-btn` are classes, not IDs, so during the StrictMode remount two copies of the modal briefly coexist and an unscoped `document.querySelector` returns whichever one happens to be first in document order — not necessarily the copy this effect run owns.

The 144 `.box` tiles are a bigger problem than a lookup: this loop builds every one of them itself, outside anything React ever renders, which is exactly the situation described above where a StrictMode remount doubles them. Unlike a virtualized gallery that adds and removes cells as the user scrolls, this grid is static for the component's whole life — all 144 tiles exist from the first frame and none are ever added or removed later — so there is no reason to build them imperatively at all. Render them declaratively instead: map the same `products` array (cycled the same way, index modulo the fifteen entries for the copy, index modulo the five images for the photo) into 144 `.box` elements in JSX, inside the ref'd container. That removes the double-population failure mode entirely, and it hands the 432 tile-level listeners (`mousedown`/`mousemove`/`click`, three per tile) to React's own mount/unmount bookkeeping — each tile's listeners live and die with the tile itself, as `onMouseDown`/`onMouseMove`/`onClick` props. Keep the per-tile `isDragging`/`isClicking` flags off `useState`: they flip on every `mousemove` over a tile, so hold them in a ref keyed by tile index rather than component state — promoting them would re-render the whole 144-tile grid on every pixel the cursor crosses over a tile.

*(3) Cleanup* — Wrap every tween the pan and the lightbox create in one `gsap.context` scoped to the root ref, and revert it in the cleanup. The complication is that none of this component's `gsap.to`/`gsap.set` calls run during the factory's own synchronous pass — the pan tween fires from `mousemove`, the open fade fires from a tile's `click`, the close fade fires from the close button's `click`, all long after `gsap.context` has already returned. A tween created inside a plain event-handler closure like that is invisible to `ctx.revert()` unless the handler itself was registered through `self.add`:

```jsx
const ctxRef = useRef(null);

useEffect(() => {
  const root = rootRef.current;
  const container = root.querySelector("#container");
  const modal = root.querySelector(".modal");
  const productImg = root.querySelector(".product-img img");
  const modalName = root.querySelector(".modal .product-name h1");
  const modalInfo = root.querySelector(".modal .product-name p");

  const ctx = gsap.context((self) => {
    self.add("pan", (x, y) => gsap.to(container, { x, y /* same duration/ease as the pan spec above */ }));
    self.add("open", (product, imgSrc) => {
      gsap.set(modal, { display: "flex" });
      gsap.to(modal, { opacity: 1 /* same fade duration as the open spec above */ });
      productImg.src = imgSrc;
      modalName.textContent = product.name;
      modalInfo.textContent = product.info;
    });
    self.add("close", () => {
      gsap.to(modal, {
        opacity: 0,
        onComplete: () => gsap.set(modal, { display: "none" }),
        // same fade duration as the close spec above
      });
    });
  }, rootRef);
  ctxRef.current = ctx;

  // onDragStart/onDrag/onDragEnd exactly as above, except onDrag calls
  // ctx.pan(translateX, translateY) instead of calling gsap.to directly

  const controller = new AbortController();
  const { signal } = controller;
  container.addEventListener("mousedown", onDragStart, { signal });
  container.addEventListener("mousemove", onDrag, { signal });
  container.addEventListener("mouseup", onDragEnd, { signal });
  container.addEventListener("mouseleave", onDragEnd, { signal });
  container.addEventListener("touchstart", onDragStart, { passive: true, signal });
  container.addEventListener("touchmove", onDrag, { passive: false, signal });
  container.addEventListener("touchend", onDragEnd, { signal });
  container.addEventListener("touchcancel", onDragEnd, { signal });

  return () => {
    controller.abort();
    ctx.revert();
  };
}, []);
```

Inside the factory the parameter is `self`, never `ctx` — `gsap.context` runs that function synchronously, before the `const ctx = …` assignment has finished, so any reference to `ctx` there throws "Cannot access 'ctx' before initialization" and takes the tree down with it. `self.add("pan", fn)` — a name plus a function, not the one-argument overload — registers `fn` and hands back a callable wrapper; call that wrapper (`ctx.pan(...)`, `ctx.open(...)`, `ctx.close()`) from the drag handler, the tile's `onClick`, and the close button's `onClick` respectively, so the tweens each one creates are attributed to the context the same way a call made during the synchronous pass would be.

With that in place, `ctx.revert()` covers exactly three things: whatever pan tween is still running on `container` at the moment of teardown, the container's `cursor`/`userSelect`/transform inline styles the drag wrote, and the modal's `opacity`/`display` inline styles the open/close calls wrote — restoring the modal to its CSS resting state (`display:none`) even if it was left open, which is what closes a lightbox left open by whoever unmounts this mid-session. It does not cover the eight `mousedown`/`mousemove`/`mouseup`/`mouseleave`/`touchstart`/`touchmove`/`touchend`/`touchcancel` listeners on the container — `gsap.context` has no visibility into plain `addEventListener` calls — so those are what the `AbortController` above is for; one `controller.abort()` removes all eight in the same step as `ctx.revert()`. Keep `startCoords`/`startTranslate`/`isContainerDragging` as plain closured variables (or refs, never `useState`) for the same reason as the per-tile flags above: `onDrag` fires on every `mousemove`, and state written that often would re-render the 144-tile grid on every pixel of drag.

One listener in that set cannot become a JSX prop no matter how tempting that is once the tiles above are made declarative: `touchmove` needs `e.preventDefault()` to stop the page from scrolling under the pan gesture, and that only works because it is attached with `{ passive: false }`. React attaches `onTouchMove` at the root as a passive listener by default, so a JSX version of this handler would have `preventDefault()` silently do nothing and the page would scroll during a touch-drag — defeating the `overflow: hidden` this component leans on for its "the page never scrolls" contract. Keep the whole container-level set — mouse and touch alike — wired the way the block above does, not as JSX handlers, so the shared drag state and the touch-specific listener option don't end up split across two different wiring mechanisms.
