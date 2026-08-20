---
slug: infinite-parallax-scroll-with-minimap
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Build: Infinite Parallax Scroll with Synchronized Minimap

## Goal

A full-screen, **infinitely looping vertical scroll** through editorial project images, with a **centered floating minimap** that mirrors the exact same scroll at miniature scale. The star effect: a hand-rolled `requestAnimationFrame` engine that lerps a virtual scroll position driven by wheel + touch, recycles a small window of DOM slides for endless looping, applies **per-image parallax**, and **magnetically snaps to the nearest project** after the user stops scrolling. The big slides and the tiny minimap move in perfect proportional lockstep.

## Tech

Vanilla HTML/CSS/JS with ES module imports (Vite/npm project). **No GSAP, no ScrollTrigger, no Lenis, no animation library at all** — the entire motion system is a single custom `requestAnimationFrame` loop with a manual `lerp()` helper and custom `wheel`/`touch` listeners. Everything is driven by imperative `element.style.transform` writes. Desktop uses wheel; mobile uses touch drag.

## Layout / HTML

Minimal shell — JS generates all repeating content dynamically:

```html
<div class="container">
  <ul class="project-list"></ul>          <!-- full-screen slides injected here -->
  <div class="minimap">
    <div class="minimap-wrapper">
      <div class="minimap-img-preview"></div>   <!-- mini image filmstrip -->
      <div class="minimap-info-list"></div>      <!-- text info stack -->
    </div>
  </div>
</div>
<script type="module" src="./script.js"></script>
```

The JS builds three parallel virtualized lists, all keyed by the same integer index:

- **`.project`** (appended to `.project-list`): `<div class="project"><img src=... alt=... /></div>` — one full-viewport slide.
- **`.minimap-img-item`** (appended to `.minimap-img-preview`): `<div class="minimap-img-item"><img .../></div>` — the same image, miniature.
- **`.minimap-item-info`** (appended to `.minimap-info-list`): two rows of text:
  ```html
  <div class="minimap-item-info-row"><p>{NN}</p><p>{title}</p></div>
  <div class="minimap-item-info-row"><p>{category}</p><p>{year}</p></div>
  ```
  where `{NN}` is the 1-based project number zero-padded to 2 digits (`01`–`05`).

## Styling

- **Font:** Inter (Google Fonts, variable weight 100–900), applied to `body`.
- **`p`:** `text-transform: uppercase; font-size: 0.85rem; font-weight: 600; letter-spacing: -0.0125rem;`
- **`img` (global):** `width:100%; height:100%; object-fit:cover;`
- **`.container`:** `position:fixed; width:100%; height:100svh; overflow:hidden;` (whole thing is a fixed, non-scrolling viewport — native page scroll never happens).
- **`.project`:** `position:absolute; width:100%; height:100svh; overflow:hidden; will-change:transform;` — stacked absolutely at top:0, moved only via `translateY`.
- **Images inside slides and minimap items** (`.project img`, `.minimap-img-item img`): `position:relative; transform:scale(1.5); will-change:transform;` — the 1.5× overscale gives the parallax room to move without exposing edges.
- **`.minimap`:** `position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:75%; height:calc(250px + 3rem); background:#fff; padding:1.5rem; overflow:hidden;` — a white horizontal panel floating dead-center over the slides.
- **`.minimap-wrapper`:** `position:relative; width:100%; height:100%;`
- **`.minimap-img-preview`:** `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:35%; height:100%; overflow:hidden;` — a narrow centered window showing the miniature image filmstrip.
- **`.minimap-img-item`:** `position:absolute; width:100%; height:100%; overflow:hidden; will-change:transform;`
- **`.minimap-info-list`:** `position:relative; width:100%; height:100%; overflow:hidden;` — full-width text layer behind/around the center image window.
- **`.minimap-item-info`:** `position:absolute; width:100%; height:250px; display:flex; flex-direction:column; justify-content:space-between; will-change:transform;`
- **`.minimap-item-info-row`:** `width:100%; display:flex; justify-content:space-between; padding:0.5rem;` — number left / title right on the top row, category left / year right on the bottom row.
- **Responsive `@media (max-width:1000px)`:** `.minimap-img-preview { left:unset; right:0; transform:translate(0,-50%); }` (image window pins to the right edge) and `.minimap-item-info-row { flex-direction:column; }`.

## The Effect (be exhaustive — this is the whole point)

There is **no library**. Reproduce this engine exactly.

### Data & config

Five demo projects, each `{ title, image, category, year }`. Use neutral fictional titles/categories (e.g. "Redroom Gesture 14" / "Concept Series" / "2025", "Shadowwear 6AM" / "Photography" / "2024", "Blur Formation 03" / "Kinetic Study" / "2024", "Sunglass Operator" / "Editorial Motion" / "2023", "Azure Figure 5" / "Visual Research" / "2024"). No real brand names.

```js
const config = {
  SCROLL_SPEED: 0.75,   // wheel delta multiplier
  LERP_FACTOR: 0.05,    // main scroll smoothing per frame
  BUFFER_SIZE: 5,       // slides kept alive on each side of current
  MAX_VELOCITY: 150,    // clamp per-wheel-event movement
  SNAP_DURATION: 500,   // ms snap animation length
};
```

State holds `currentY` (rendered scroll, px), `targetY` (desired scroll, px), `isDragging`, `isSnapping`, three `Map`s (`projects`, `minimap`, `minimapInfo`) keyed by integer index, `projectHeight = window.innerHeight`, `minimapHeight = 250`, a `snapStart` `{time,y,target}`, and `lastScrollTime`.

`const lerp = (a, b, t) => a + (b - a) * t;`

### Index → data wrapping (enables infinite loop)

`getProjectData(index)` maps any integer (including large negatives) into the 0–4 range via double-modulo: `((|i| % n) + n) % n`. The 2-digit label is that wrapped index `+1`, `padStart(2,"0")`.

### Virtualization / recycling (`syncElements`, runs every frame)

- `current = Math.round(-targetY / projectHeight)` = index nearest to center.
- Keep window `[current - BUFFER_SIZE, current + BUFFER_SIZE]` (11 slides).
- For each index in the window, `createElement(i)` for all three lists **only if the map doesn't already have that index** (idempotent).
- After creating, iterate each map and `el.remove()` + `map.delete(index)` for any index outside the window. This constant create/destroy is what makes the scroll infinite with a tiny DOM.
- On load, pre-seed indices `-BUFFER_SIZE … BUFFER_SIZE`.

### Positioning (`updatePositions`, every frame)

Minimap scroll is the main scroll scaled by the height ratio:
```
minimapY = currentY * minimapHeight / projectHeight;   // = currentY * 250 / innerHeight
```
- **Slides:** each `.project` at index i → `translateY(i * projectHeight + currentY)px`. Then its image parallax updates with `(currentY, i)`.
- **Minimap images:** each `.minimap-img-item` at index i → `translateY(i * minimapHeight + minimapY)px`. Image parallax updates with `(minimapY, i)`.
- **Minimap info:** each `.minimap-item-info` at index i → `translateY(i * minimapHeight + minimapY)px` (no parallax on text).

### Per-image parallax (`createParallax`, closure per image)

Each image owns a private `current = 0`. On every `update(scroll, index)`:
```
target  = (-scroll - index * height) * 0.2;   // 0.2× depth factor
current = lerp(current, target, 0.1);          // its own 0.1 smoothing
if (Math.abs(current - target) > 0.01)
  img.style.transform = `translateY(${current}px) scale(1.5)`;
```
So the image drifts inside its overscaled (1.5×) frame at 20% of the container's motion, with a secondary independent lerp — a layered, buttery parallax. The `> 0.01` guard skips redundant writes when settled.

### Magnetic snap (cubic ease-out)

In the main loop, when **not snapping, not dragging, and `now - lastScrollTime > 100` ms** (100 ms idle after last input):
- Compute `snapPoint = -Math.round(-targetY / projectHeight) * projectHeight`.
- If `|targetY - snapPoint| > 1`, call `snapToProject()`: set `isSnapping = true`, record `snapStart.time = now`, `snapStart.y = targetY`, `snapStart.target = snapPoint`.

`updateSnap()` (each frame while snapping):
```
progress = min((now - snapStart.time) / SNAP_DURATION, 1);   // 0→1 over 500ms
eased    = 1 - Math.pow(1 - progress, 3);                     // cubic ease-out
targetY  = snapStart.y + (snapStart.target - snapStart.y) * eased;
if (progress >= 1) isSnapping = false;
```

### Main loop order (`animate`, recursive `requestAnimationFrame`)

1. Check idle → maybe `snapToProject()`.
2. If snapping → `updateSnap()` (drives `targetY`).
3. If **not** dragging → `currentY += (targetY - currentY) * LERP_FACTOR` (0.05 smoothing toward target). While dragging, `currentY` is not lerped (touch sets targetY directly and it renders 1:1).
4. `syncElements()` then `updatePositions()`.
5. `requestAnimationFrame(animate)`.

### Input handling

- **Wheel** (`{ passive:false }`): `e.preventDefault()`, `isSnapping = false`, `lastScrollTime = now`. `delta = clamp(e.deltaY * SCROLL_SPEED, -MAX_VELOCITY, +MAX_VELOCITY)`, then `targetY -= delta`. (Scrolling down decreases `targetY`, advancing forward.)
- **Touchstart:** `isDragging = true`, `isSnapping = false`, store `dragStart = { y: touch.clientY, scrollY: targetY }`, `lastScrollTime = now`.
- **Touchmove:** `targetY = dragStart.scrollY + (touch.clientY - dragStart.y) * 1.5` (1.5× drag sensitivity), `lastScrollTime = now`.
- **Touchend:** `isDragging = false` (loop then lerps + snaps).

## Assets / images

Five **full-bleed editorial photographs**, landscape aspect (roughly 3:2, one closer to 5:4; the wide frames are cropped by `object-fit:cover` at 1.5× overscale so exact ratio is flexible). Each appears both as a full-screen slide and as a miniature in the minimap. Consistent look: moody, high-contrast, each image built around a single dominant color:

1. Black silhouette of a person from the chest up with one open hand raised toward the viewer, flat saturated red backdrop.
2. Silhouetted head-and-shoulders profile against an X of crossing red-orange light beams on a near-black background; deep reds and warm oranges.
3. Motion-blurred cluster of young people in near-darkness, streaked with warm amber/brown skin tones over black — long-exposure blur, no sharp faces.
4. Tight editorial crop of a figure's torso and bent arm wearing a multicolor abstract painterly-print garment (blues, ochres, reds, greens), set against a vivid solid orange background.
5. Rear-view backlit silhouette of a person raising both hands to their head, against a vivid cobalt-blue background with a thin rim of light around the arms.

## Behavior notes

- **Infinite in both directions:** you can scroll up into negative indices forever; the modulo wrap + recycling means the same 5 projects cycle endlessly with correct numbering.
- **Everything is fixed-position; the page itself never scrolls** — wheel is `preventDefault`ed and consumed by the virtual scroll.
- **Snap only fires after 100 ms of idle** and only when off-center by more than 1px, so it feels like a gentle magnetic settle, never fighting active scrolling.
- Two independent smoothing stages (main `LERP_FACTOR 0.05` + per-image `0.1`) plus the `0.2` parallax factor are what produce the layered, weighty feel — keep all three exact.
- No reduced-motion branch in the original; motion is continuous.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/infinite-parallax-scroll-with-minimap/img_1.jpg
https://motionprompts.dev/c/infinite-parallax-scroll-with-minimap/img_2.jpg
https://motionprompts.dev/c/infinite-parallax-scroll-with-minimap/img_3.jpg
https://motionprompts.dev/c/infinite-parallax-scroll-with-minimap/img_4.jpg
https://motionprompts.dev/c/infinite-parallax-scroll-with-minimap/img_5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--signal`, `--muted`, `--chrome`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

This component happens to be unusually well-shaped for that discipline already. `mount(config)` builds its own local `state` — the three `Map`s (`projects`, `minimap`, `minimapInfo`), `currentY`, `targetY`, the rAF handle — entirely inside the function, and returns a `destroy()` that reverses all of it. That is the exact shape a `useEffect` wants. Three things still need attention before the transplant is complete.

**Entry point.** Delete both branches of the bottom-of-file dispatch, not just the guard. The `window.MP && window.MP.register` branch exists so this catalog's own visual editor can re-`mount` the component with new `config` values whenever a knob changes — a consuming React app is not that editor and will never define `window.MP`, so that whole path is dead code here, not a feature to preserve. What is left is the `else` branch's `document.readyState` check, and that is dead for the ordinary reason: `useEffect` already runs after the DOM is committed, past any point where `DOMContentLoaded` could still be pending. Keep only the one call that does real work, and pass it a fresh copy of `DEFAULTS` the same way the deleted `boot()` did:

```jsx
useEffect(() => {
  const destroy = mount(Object.assign({}, DEFAULTS));
  return destroy;
}, []);
```

**Element lookups.** `mount` opens with three unscoped lookups — `document.querySelector(".project-list")`, `.minimap-img-preview`, `.minimap-info-list` — each read against the whole document. During the StrictMode remount two copies of this markup exist for an instant, and an unscoped lookup can hand the incoming instance's `mount()` call a reference to the outgoing instance's `<ul>`. Give the component a root `ref`, render the three target elements under it, and change the lookups to read from that ref instead of `document`. Leave the four `window.addEventListener` calls (`wheel`, `touchstart`, `touchmove`, `touchend`) exactly where they are: `.container` is `position: fixed` over the full viewport by design, so window-level capture of the scroll gesture is the intended ownership model here, not an oversight the ref cleanup should reach into.

**Cleanup.** No extra wrapping is needed — `mount`'s own return value already cancels the `frame` handle from `requestAnimationFrame`, removes all four window listeners, and walks the three `Map`s to remove every `.project`, `.minimap-img-item` and `.minimap-item-info` element it created, so return it directly as the effect's cleanup. The one thing to actively resist is "helping" by lifting `state` out into a `useRef` created once outside the effect, on the theory that a persistent ref is more idiomatic than a local variable rebuilt every mount. That is precisely the bug the surrounding code comment already warns against: a `useRef` value, unlike a local variable inside `mount`, survives the StrictMode unmount, so the second invocation would seed its recycling window against `Map`s still populated from the first — and the three lists this component keeps in lockstep would duplicate instead of recreate cleanly. Keep `state` a plain local of `mount`, constructed fresh on every call, exactly as the source already does.
