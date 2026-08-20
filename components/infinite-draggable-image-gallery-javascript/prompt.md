# Infinite Draggable Image Gallery

## Goal
Build a full-viewport, **infinitely draggable image gallery**: an endless grid of small portrait thumbnails on a pale canvas that you grab and pan in any direction forever (DOM items are virtualized — created/destroyed as they enter/leave a buffered viewport), with a **lerp-smoothed drag and velocity-based momentum** on release. Clicking a thumbnail is the star moment: the tile hides, every other tile fades out, a pale overlay closes in, and a **fixed clone of the image expands from the thumbnail's exact spot to a large centered frame via a single GSAP `fromTo` tween on a custom "hop" ease**, while the project's title **staggers up word-by-word from behind a clip mask** (SplitType). Clicking the expanded image or the overlay reverses everything back into the grid.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`CustomEase`**, and **`split-type`** (npm, default export `SplitType`) for the word splitting. No ScrollTrigger, no Lenis — the page never scrolls (`body { overflow: hidden }`); all motion is a custom `requestAnimationFrame` lerp loop plus GSAP tweens. Ship `index.html`, `styles.css`, an ES-module `script.js`, and a tiny `items.js` data module.

Register and create the custom ease once at startup:
```js
gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");
```
`"hop"` = cubic-bezier(0.9, 0, 0.1, 1): a heavy slow-in / slow-out snap used for both the expand and the collapse.

## Layout / HTML
```html
<nav>
  <div class="logo"><a href="#">Motionprompts</a></div>
  <div class="links">
    <a href="#">About</a>
    <a href="#">Contact</a>
    <div class="socials">
      <a href="#">FB</a><a href="#">IG</a><a href="#">YT</a>
    </div>
  </div>
</nav>

<footer>
  <p>Experiment 445</p>
  <p>Drag to Explore</p>
</footer>

<div class="container">
  <div class="canvas" id="canvas"></div>
  <div class="overlay" id="overlay"></div>
</div>

<div class="project-title"><p></p></div>

<script type="module" src="./script.js"></script>
```
- `.container` — the full-viewport drag surface (all mouse/touch listeners hang off it).
- `.canvas` — the infinite plane; the JS translates this element and appends/removes `.item` tiles inside it.
- `.overlay` — a full-screen pale scrim toggled with a CSS class during the expanded state.
- `.project-title p` — starts empty; the JS injects the clicked project's title and splits it into words.

`items.js` exports a default array of 20 short, evocative two-word project titles (index i pairs with image i+1), e.g.:
```js
const items = [
  "Chromatic Loopscape", "Solar Bloom", "Neon Handscape", "Echo Discs",
  "Void Gaze", "Gravity Sync", "Heat Core", "Fractal Mirage",
  "Nova Pulse", "Sonic Horizon", "Dream Circuit", "Lunar Mesh",
  "Radiant Dusk", "Pixel Drift", "Vortex Bloom", "Shadow Static",
  "Crimson Phase", "Retro Cascade", "Photon Fold", "Zenith Flow",
];
export default items;
```

## Styling
- Import the Google font **Inter** (variable weights). `* { margin:0; padding:0; box-sizing:border-box; user-select:none; }`
- `body`: `font-family:"Inter",sans-serif; background-color:#e3e3db; overflow:hidden;` — a warm pale-grey/bone canvas.
- `a, p`: `display:block; text-decoration:none; color:#fff; font-size:14px; font-weight:600; letter-spacing:-0.01rem; -webkit-font-smoothing:antialiased;`
- `nav, footer`: `position:absolute; left:0; width:100vw; padding:1em; display:flex; justify-content:space-between; gap:2em; mix-blend-mode:difference; z-index:10000;` — nav pinned `top:0`, footer `bottom:0`. The `mix-blend-mode:difference` makes the white UI text invert over whatever passes beneath (dark thumbnails vs pale background).
- `.links, .socials`: `display:flex; gap:2em;` and `nav > *, .links a { flex:1; }`
- `.container`: `position:relative; width:100vw; height:100vh; overflow:hidden; cursor:grab;`
- `.canvas`: `position:absolute; will-change:transform;`
- `.item`: `position:absolute; width:120px; height:160px; overflow:hidden; background-color:#000; cursor:pointer;` — small 3:4 portrait tiles.
- `.expanded-item`: `position:fixed; z-index:100; top:50%; left:50%; transform:translate(-50%,-50%); background-color:#e3e3db; overflow:hidden; cursor:pointer;` — the clone lives dead-center; GSAP `x`/`y` offsets move it relative to the viewport center.
- `img`: `width:100%; height:100%; object-fit:cover; pointer-events:none;`
- `.overlay`: `position:fixed; top:0; left:0; width:100%; height:100%; background-color:#e3e3db; pointer-events:none; transition:opacity 0.3s ease; opacity:0; z-index:2;` — with `.overlay.active { pointer-events:auto; opacity:1; }`. Note z-index 2: it covers the grid but sits *under* the `.expanded-item` (z 100) and the nav/footer/title (z 10000).
- `.project-title`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; text-align:center; pointer-events:none; z-index:10000;`
- `.project-title p`: `position:relative; height:42px; color:#fff; clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%);` — the fixed-height box + clip-path is the **mask** the words rise out of.
- `.project-title p .word`: `position:relative; display:inline-block; font-family:"Inter"; font-size:36px; letter-spacing:-0.02rem; margin-right:0.1em; transform:translateY(0%); will-change:transform;` (the `.word` class is what SplitType produces).

## GSAP effect — be exhaustive

### Constants & state
```js
const itemCount = 20;   // distinct images
const itemGap   = 150;  // px between tiles
const columns   = 4;    // used only in the image-index formula
const itemWidth = 120, itemHeight = 160;
```
State variables: `isDragging`, `startX/startY`, `targetX/targetY` (where the canvas wants to be), `currentX/currentY` (where it is), `dragVelocityX/Y`, `lastDragTime`, `mouseHasMoved`, `visibleItems` (a `Set` of ids), `lastUpdateTime`, `lastX/lastY`, `isExpanded`, `activeItem`, `canDrag` (starts `true`), `originalPosition`, `expandedItem`, `activeItemId`, `titleSplit`.

### 1) The infinite pan — rAF lerp loop
An endless `requestAnimationFrame` loop `animate()`:
- Only while `canDrag`: lerp with factor **0.075** —
  `currentX += (targetX - currentX) * 0.075;` (same for Y), then
  `canvas.style.transform = translate(currentX px, currentY px)`.
- Track how far the canvas moved since the last virtualization pass; call `updateVisibleItems()` when **distance moved > 100px** OR **more than 120ms** elapsed, then store `lastX/lastY/lastUpdateTime`.
- Always re-queue `requestAnimationFrame(animate)`.

**Mouse drag** (listeners: `mousedown` on `.container`, `mousemove`/`mouseup` on `window`):
- `mousedown` (ignored unless `canDrag`): `isDragging = true`, `mouseHasMoved = false`, record `startX/startY = e.clientX/Y`, set `container.style.cursor = "grabbing"`.
- `mousemove` (only while dragging and `canDrag`): `dx/dy` = movement since the previous event; if `|dx| > 5 || |dy| > 5` set `mouseHasMoved = true` (this later suppresses the click-to-expand). Compute `dt = max(10, now - lastDragTime)` in ms and per-ms velocities `dragVelocityX = dx/dt`, `dragVelocityY = dy/dt`. Then **add** the deltas to the target: `targetX += dx; targetY += dy;` and reset `startX/startY` to the current pointer.
- `mouseup`: stop dragging, restore `cursor:"grab"`; **momentum** — if `|dragVelocityX| > 0.1 || |dragVelocityY| > 0.1`, throw the canvas: `targetX += dragVelocityX * 200; targetY += dragVelocityY * 200;` (momentumFactor = 200). The 0.075 lerp turns that offset into a smooth glide-out.

**Touch drag**: `touchstart` on the container and `touchmove`/`touchend` on window mirror the mouse logic (same 5px `mouseHasMoved` threshold, `targetX/Y += dx/dy`), but **no momentum** is applied on `touchend`.

### 2) Virtualized infinite grid — `updateVisibleItems()`
The grid is conceptually infinite in all four directions; only tiles near the viewport exist in the DOM.
- `buffer = 2.5`; `viewWidth = innerWidth * 3.5`, `viewHeight = innerHeight * 3.5`.
- Determine travel direction: `movingRight = targetX > currentX`, `movingDown = targetY > currentY`; direction buffers `directionBufferX = movingRight ? -300 : 300` (same for Y) extend the window toward where you're heading.
- Column/row range (cell pitch = `itemWidth + itemGap` = 270 horizontally, `itemHeight + itemGap` = 310 vertically):
  ```js
  startCol = Math.floor((-currentX - viewWidth/2 + (movingRight ? directionBufferX : 0)) / (itemWidth + itemGap));
  endCol   = Math.ceil ((-currentX + viewWidth*1.5 + (!movingRight ? directionBufferX : 0)) / (itemWidth + itemGap));
  // startRow/endRow identical with currentY, viewHeight, movingDown, itemHeight
  ```
- For every `(col,row)` in range: id = `"${col},${row}"`. Skip if already in `visibleItems`, or if it is the currently-expanded tile (`activeItemId === id && isExpanded`). Otherwise create `<div class="item" id="col,row">` at `left = col * (itemWidth+itemGap)`, `top = row * (itemHeight+itemGap)` (store `dataset.col/row`), containing an `<img>` whose image number is
  ```js
  const itemNum = (Math.abs(row * columns + col) % itemCount) + 1;  // 1..20
  img.src = `/path/to/img${itemNum}.jpg`;
  ```
  so the 20 images tile deterministically across the infinite plane. Attach a `click` listener that bails if `mouseHasMoved || isDragging`, else calls `handleItemClick(item)`. Append to the canvas and register in `visibleItems`.
- Finally sweep `visibleItems`: remove any DOM item whose id fell out of the current range (or that is the active expanded tile) and delete it from the set.

### 3) Click → expand (the hero tween)
`handleItemClick` toggles: if already expanded → close; else `expandItem(item)`:
1. Flags: `isExpanded = true`, `activeItem = item`, `activeItemId = item.id`, `canDrag = false`, `container.style.cursor = "auto"`.
2. Parse the image number out of the tile's `img.src` (regex `/img(\d+)\.jpg/`); `titleIndex = (imgNum - 1) % items.length` → the matching title from `items.js`.
3. **Title setup** — `setAndAnimateTitle(title)`: if a previous `SplitType` instance exists, `revert()` it; set `projectTitleElement.textContent = title`; `titleSplit = new SplitType(el, { types: "words" })`; then `gsap.set(titleSplit.words, { y: "100%" })` so every word starts fully below the 42px clip mask.
4. Hide the source tile: `item.style.visibility = "hidden"`, and stash `originalPosition = { id, rect: item.getBoundingClientRect(), imgSrc }`.
5. `overlay.classList.add("active")` → the pale scrim fades in via its CSS `opacity 0.3s ease` transition and starts intercepting clicks.
6. Build the clone: `<div class="expanded-item">` sized `120 × 160` px with the same `<img>`, appended to `<body>`; clicking it closes.
7. **Fade the grid**: every other `.item` → `gsap.to(el, { opacity: 0, duration: 0.3, ease: "power2.out" })`.
8. Target size: `targetWidth = window.innerWidth * 0.4`, `targetHeight = targetWidth * 1.2` (keeps the 3:4 portrait ratio, 40% of viewport width).
9. `gsap.delayedCall(0.5, animateTitleIn)` — the title starts rising halfway through the expansion.
10. **The expansion tween** (remember the clone is `position:fixed` centered with `translate(-50%,-50%)`, so `x/y` are offsets from the viewport center):
    ```js
    gsap.fromTo(expandedItem,
      { width: itemWidth, height: itemHeight,
        x: rect.left + itemWidth/2  - window.innerWidth/2,
        y: rect.top  + itemHeight/2 - window.innerHeight/2 },
      { width: targetWidth, height: targetHeight, x: 0, y: 0,
        duration: 1, ease: "hop" });
    ```
    i.e. it starts exactly over the clicked thumbnail (position + size) and lands dead-center at 40vw wide — one tween animating `width`, `height`, `x`, `y` together on the `"hop"` CustomEase.
- `animateTitleIn()`: `gsap.to(titleSplit.words, { y: "0%", duration: 1, stagger: 0.1, ease: "power3.out" })` — words rise out of the clip mask left-to-right, 0.1s apart.

### 4) Close → collapse back
`closeExpandedItem()` (fired by clicking the expanded image or the overlay):
1. `animateTitleOut()`: `gsap.to(titleSplit.words, { y: "-100%", duration: 1, stagger: 0.1, ease: "power3.out" })` — words exit **upward** through the mask (in from below, out through the top).
2. `overlay.classList.remove("active")` (CSS fades the scrim out over 0.3s).
3. Restore the grid: every `.item` except the active one → `gsap.to(el, { opacity: 1, duration: 0.5, delay: 0.5, ease: "power2.out" })` — they wait half a second, then fade back while the clone shrinks.
4. Reverse tween on the clone, back to the stored original rect:
   ```js
   gsap.to(expandedItem, {
     width: itemWidth, height: itemHeight,
     x: originalRect.left + itemWidth/2  - window.innerWidth/2,
     y: originalRect.top  + itemHeight/2 - window.innerHeight/2,
     duration: 1, ease: "hop",
     onComplete: () => { /* cleanup */ } });
   ```
   In `onComplete`: remove the clone from the DOM, set the original tile (looked up by `activeItemId`) back to `visibility:"visible"`, null out `expandedItem/activeItem/originalPosition/activeItemId`, `isExpanded = false`, `canDrag = true`, `container.style.cursor = "grab"`, and zero both drag velocities.

### 5) Resize
On `window.resize`: if currently expanded, re-fit the clone — `gsap.to(expandedItem, { width: innerWidth*0.4, height: innerWidth*0.4*1.2, duration: 0.3, ease: "power2.out" })`; otherwise just call `updateVisibleItems()`.

### 6) Boot
Call `updateVisibleItems()` once, then start `animate()`.

## Assets / images
**20 portrait images (3:4 aspect, e.g. 480×640+), named `img1.jpg` … `img20.jpg`**, tiled endlessly across the grid. They share one art direction: **abstract glossy 3D renders on black backgrounds** — iridescent chrome and holographic materials (stacked ribbon loops, twisted mobius waves, torus rings, coiled spring helixes, chrome chain links and a padlock, intersecting discs and cones, bundles of tubes, spiral drip forms, stylized reaching hands, an anatomical heart with an orbiting ring). Palette: oil-slick purples, magentas, oranges, golds and greens against deep black — the black tiles pop hard against the `#e3e3db` page and drive the `mix-blend-mode:difference` UI. Each image i pairs with title i in `items.js`. No text, no logos in the images.

## Behavior notes
- The page never scrolls; the entire experience is the drag plane. Cursor: `grab` → `grabbing` while dragging → `auto` while expanded.
- Works with mouse **and** touch; momentum-throw applies to mouse only.
- The 5px `mouseHasMoved` threshold guarantees a drag never accidentally triggers an expand.
- While expanded, dragging is fully disabled (`canDrag=false`) and the virtualization loop pauses (it runs inside the `canDrag` branch).
- Item ids are `"col,row"` strings; virtualization keeps DOM size roughly constant no matter how far you pan.
- Nav ("Motionprompts", About/Contact, FB/IG/YT) and footer ("Experiment 445" / "Drag to Explore") are static chrome in white, inverted by `mix-blend-mode:difference`.

## Images

This component ships with 20 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/infinite-draggable-image-gallery-javascript/img1.jpg
https://motionprompts.dev/c/infinite-draggable-image-gallery-javascript/img10.jpg
https://motionprompts.dev/c/infinite-draggable-image-gallery-javascript/img11.jpg
https://motionprompts.dev/c/infinite-draggable-image-gallery-javascript/img12.jpg
https://motionprompts.dev/c/infinite-draggable-image-gallery-javascript/img13.jpg
https://motionprompts.dev/c/infinite-draggable-image-gallery-javascript/img14.jpg
… 14 more under https://motionprompts.dev/c/infinite-draggable-image-gallery-javascript/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--plaster`, `--ink`, `--chrome-text`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and only bothers to structure its own teardown because this catalogue's own editor demands it — `mount(config)` returns a `destroy()` purely so a knob change (item size, gap, drag ease, momentum) can re-mount the gallery cleanly, not because a plain shipped page ever calls it. React needs that same discipline, but it needs to live in `useEffect`'s cleanup instead of a hand-rolled harness, and it needs to run even when no editor is watching.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component is unusually exposed to that: it wires eight listeners (`mousedown`/`touchstart` on the container, `mousemove`/`mouseup`/`touchmove`/`touchend`/`resize` on the window, `click` on the overlay) and starts its own `requestAnimationFrame` loop before the user does anything. Run the setup twice without tearing the first copy down and you get two live `animate()` loops, each with its own `currentX`/`currentY` closure, both writing `canvas.style.transform` on every frame — and two live `mousemove` listeners, each adding the same pointer delta to its own `targetX`/`targetY`. The visible result is not a crash: the grid pans at roughly double the speed the cursor actually moved, and the transform flickers between two slightly different values a frame apart. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The bottom of the script checks `document.readyState` before subscribing `boot` to `DOMContentLoaded`; that guard exists so the module survives being evaluated after the DOM has already parsed, something `useEffect` already guarantees by running post-commit. Drop the guard, the listener, and the `window.MP && window.MP.register` branch above it — that branch exists only so this catalogue's visual editor can re-invoke `mount` with a different `config` when a knob (`itemWidth`, `itemHeight`, `itemGap`, `columns`, `dragEase`, `momentum`) moves, and it has no equivalent in a shipped app. What survives is the body of `mount(config)` itself: the virtualization pass, the drag/rAF wiring, `expandItem`/`closeExpandedItem`, resize handling. Put that body inside a `useEffect` with an empty dependency array, and turn `config` into props (or a values object) read inside that same effect. If you do expose those six knobs as live props, keep `bufferFor()`'s ceiling on how many `.item` cells a config change is allowed to request — it exists specifically because a small `itemWidth` paired with a small `itemGap` inflates the visible-cell count by an order of magnitude, and a React version that re-runs the effect on every prop tick has exactly the same runaway-DOM-node risk this catalogue's own slider-driven editor already ran into.

*(2) Element lookups* — The four lookups at the top of `mount` (`.container`, `#canvas`, `#overlay`, `.project-title p`) assume this component owns the whole document; give the outer wrapper a root `ref` and resolve all four from it. The `canvas.querySelectorAll(".item")` calls inside `expandItem`/`closeExpandedItem` are already scoped through that same `canvas` reference, so they need no change. `#canvas`'s children, though, are not React's to touch at all: `updateVisibleItems()` creates and destroys every `.item` node itself, outside any render. Give it an empty `<div ref={canvasRef} id="canvas" />` in JSX and never place React-rendered content inside it — React has no record of the tiles this effect appends, and a render that reconciled into that subtree would collide with nodes it doesn't know exist. One lookup breaks the ref-scoping pattern on purpose: `expandItem` does `document.body.appendChild(expandedItem)`, putting the cloned tile outside the component's own subtree entirely, as a sibling of your whole React root — deliberate, since the clone has to sit above the nav/footer/title in stacking order and be positioned against the viewport, not against the gallery. Keep a plain variable for that node and make sure both `closeExpandedItem`'s completion callback and the effect's cleanup can remove it; a StrictMode unmount that lands mid-expansion is exactly the case where only the cleanup path runs.

*(3) Cleanup* — Wrap the setup in a `gsap.context` scoped to the root ref and revert it in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    /* updateVisibleItems, the drag/rAF wiring, expandItem/closeExpandedItem, resize handling */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`gsap.registerPlugin(CustomEase)` and the `CustomEase.create("hop", …)` call stay at module scope exactly as they are now — one-time global registrations, not per-mount setup, and re-running them on every effect is harmless but pointless.

This component's entire motion budget — the per-tile opacity fade in and out, the hop-eased expand/collapse tween on the cloned tile, the title's word-in and word-out tweens, the delayed call that kicks the title reveal off partway through the expansion — lives inside `expandItem`, `closeExpandedItem`, `animateTitleIn` and `animateTitleOut`, and every one of those only ever runs later, from a click listener, never while the effect's setup function itself is executing. `gsap.context` only auto-attributes animations created synchronously during that initial call; a tween built inside a click handler that fires long after mount is invisible to it unless the handler is registered through `self.add()`.

**`self.add` has two overloads and only one of them does what you want here.** Always pass a name string first:

```jsx
// CORRECT — two arguments. Registers the wrapper and returns it; nothing runs yet.
const expand = self.add("expand", (item) => {
  /* fade the other tiles, the fromTo hop tween on the clone, setAndAnimateTitle */
});
item.addEventListener("click", () => {
  if (!mouseHasMoved && !isDragging) expand(item);
});
```

```jsx
// WRONG — one argument. This is not "register for later", it is "run now, inside the context".
const expand = self.add((item) => { … });
```

The one-argument form is GSAP's *immediate* overload: it invokes your function on the spot, during the effect's setup pass, **passing the `gsap.context` object itself as the first argument**, and it returns whatever your function returned rather than a callable wrapper. Written that way, `expand` runs before a single tile has ever been clicked, its `item` parameter holds a `Context` instance instead of a `.item` element, and the first line that reaches into it — the `item.querySelector("img")` that reads the image number — throws `item.querySelector is not a function`, synchronously, inside `useEffect`. React unmounts the whole tree; the gallery never appears. (The same call also leaves `expand` bound to `undefined`, so the click listener would fail a second time even if the body had survived.) The named form takes the identical function body and changes nothing about it — only when it runs.

Do the same for `collapse` and for `animateTitleIn`/`animateTitleOut` — each gets its own name string — and pass the returned wrappers, not the original functions, into `gsap.delayedCall`: the delayed call's own eventual firing is exactly the deferred invocation `self.add` exists to cover, and passing the unwrapped function silently drops that tween back outside the context. Skip the whole mechanism and `ctx.revert()` will still run cleanly (there is nothing for it to catch — the setup itself creates zero tweens synchronously, everything is click-driven), while a tween mid-flight from a click made just before a StrictMode unmount keeps animating into a closure that no longer has a live gallery under it.

One consequence of registering these as named context methods: they are now reachable as `self.expand(…)`, and the wrapper re-enters the context on every call, so a `collapse` fired from the overlay long after mount still records its tweens where `ctx.revert()` can find them. That is the point. What it does *not* buy you is null-safety — `collapse` still has to bail when there is nothing expanded, and `animateTitleIn`/`animateTitleOut` still have to bail when `titleSplit` is null, because both can be invoked after the cleanup has already torn their targets down.

Three things `ctx.revert()` still does not know about, that the vanilla `destroy()` handles by hand and the port still has to:

- **The eight listeners.** `gsap.context` has no visibility into plain `addEventListener` calls. Keep the named handler references and remove all eight in the cleanup, same as the vanilla script does. The per-tile `click` listeners `updateVisibleItems()` attaches need no separate removal — each dies with the `.item` node it's attached to.
- **The tiles themselves.** Track them the way the vanilla script does, in a `Map` from cell id to node, and delete that mount's own nodes from the canvas in the cleanup. Do not assume unmounting disposes of them: a StrictMode double-mount tears the *effect* down and builds it again against the **same** DOM, so the canvas still holds every tile the first pass appended while the second pass starts from an empty `visibleItems` and appends a duplicate of each — same ids, twice the nodes, twice the image requests, and a virtualization sweep that only ever removes half of them. On a real unmount React does take the canvas subtree with it, which is exactly why this one hides in development and never shows up in a production build.
- **The rAF loop.** Keep the handle `animate()`'s `requestAnimationFrame` call returns and cancel it in the cleanup, or the lerp loop keeps writing to `canvas.style.transform` forever.
- **The title's `SplitType` instance.** `setAndAnimateTitle` already reverts the *previous* split before creating the next one on every click, but that guard only fires on the next click — it does nothing for whatever split is live at the moment of unmount. If the gallery unmounts while a title is mid-expansion, the cleanup itself must kill the tweens on `titleSplit.words` and then revert the split, in that order — a tween still targeting a `.word` span the revert has already removed throws — and reset the title paragraph's text back to empty, matching what the vanilla script's captured initial text restores.

And the body-level clone from *(2)*: if it still exists when the cleanup runs, kill its tweens and remove it from `document.body` there too — `closeExpandedItem`'s own completion callback already guards against running once the component is torn down, so the two removal paths never race each other.

None of this component's state belongs in `useState`: `isDragging`, `canDrag`, `isExpanded`, `mouseHasMoved`, `targetX`/`targetY`, `currentX`/`currentY`, the `visibleItems` map, `activeItemId`, `originalPosition`. Every one of them is read and written only inside closures wired up in this same effect, drives nothing but direct DOM writes and GSAP calls, and never needs to cause a re-render. Promoting any of them to component state would make React re-render a subtree this effect already owns and mutates by hand, fighting the drag loop and the virtualization pass on every frame it runs.
