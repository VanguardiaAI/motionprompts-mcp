---
slug: moblinks-interactive-logo
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Interactive Logo Depth Tunnel

## Goal
Build a full-viewport hero that frames a centered monogram logo inside a **tunnel of concentric, logo-shaped holes** receding into depth. Five solid, purple, full-bleed layers each have the **same glyph silhouette punched out of them** at progressively smaller sizes (via `mask-composite: subtract`), stacked with a sixth layer that holds the real logo image at the very center. As the pointer moves over the hero, every layer **trails the cursor** — but each one reads a progressively *older* cursor position from a frame-buffer (an 8-frame stagger per layer) and eases toward it with a slow lerp. The result is a soft, cascading parallax "wormhole": the inner logo leads, the outer rings lag behind like a comet tail, and the whole tunnel swings toward wherever the mouse is. No scroll, no click — pure `mousemove` + a per-frame ticker.

## Tech
Vanilla HTML/CSS/JS with an ES-module entry (`<script type="module">`). **Only dependency is `gsap` (npm)** — no plugins, no ScrollTrigger, no Lenis, no Three.js. The motion uses `gsap.ticker.add(...)` for the per-frame loop, `gsap.utils.toArray(...)` to collect the layers, and `gsap.set(...)` to write transforms. Runs in a fresh Vite project with a single import: `import gsap from "gsap"`.

## Layout / HTML
One hero section containing **six sibling `.depth-layer` divs**. The first five each wrap a `.depth-mask`; the sixth wraps a `.logo` with the `<img>`:

```html
<section class="hero">
  <div class="depth-layer"><div class="depth-mask"></div></div>
  <div class="depth-layer"><div class="depth-mask"></div></div>
  <div class="depth-layer"><div class="depth-mask"></div></div>
  <div class="depth-layer"><div class="depth-mask"></div></div>
  <div class="depth-layer"><div class="depth-mask"></div></div>
  <div class="depth-layer">
    <div class="logo"><img src="/path/to/logo.jpg" alt="" /></div>
  </div>
</section>
<script type="module" src="./script.js"></script>
```

DOM order matters: the JS collects `.depth-layer` in document order and derives each layer's lag from its index, so the **logo layer must be last** (index 5). Key classes the CSS/JS depend on: `.hero` (event target + measurement box), `.depth-layer` (the translated elements), `.depth-mask` (the punched shape), `.logo`/`.logo img` (centered mark).

## Styling

**Global reset**: `* { margin:0; padding:0; box-sizing:border-box; }`.

**Palette** — a single monochrome purple family, all `hsl(270, 56%, L%)`:
- `.hero` background: `hsl(270, 56%, 65%)`.
- Mask fill colors (the solid rectangle each hole is cut from), per layer 1→5: `50%`, `55%`, `60%`, `52.5%`, `55%`.
- Per-layer drop-shadow color (`filter: drop-shadow(0 0 1rem hsl(270,56% L%))`), layers 1→5: `25%`, `30%`, `35%`, `27.5%`, `75%`. (Layer 5's very light `75%` shadow reads as a bright rim/glow around the innermost ring.)

**`.hero`**: `position:relative; width:100%; height:100svh; overflow:hidden` (overflow hidden clips the oversized layers as they translate).

**`.depth-layer`**: `position:absolute; width:250%; height:250%; top:-75%; left:-75%; will-change:transform`. Each layer is **2.5× the viewport and offset up-left by 75%**, i.e. centered but massively oversized so it can be translated in any direction without ever exposing an edge inside the hero.

**`.depth-mask`**: `width:100%; height:100%`. Its fill is a solid `background: hsl(270,56%,L%)` (per-layer above). The cutout is done with a **dual mask + subtract**:
```css
-webkit-mask:
  linear-gradient(#fff, #fff),
  url("/path/to/mask.svg") center / var(--size) no-repeat;
-webkit-mask-composite: subtract;
mask:
  linear-gradient(#fff, #fff),
  url("/path/to/mask.svg") center / var(--size) no-repeat;
mask-composite: subtract;
```
The first mask layer (`linear-gradient(#fff,#fff)`) shows the entire rectangle; the second (the SVG glyph silhouette, centered, sized to `var(--size)`) is **subtracted**, punching a logo-shaped transparent hole through the solid color. Larger `--size` = larger hole.

**Per-layer `--size` and `z-index`** (this is what builds the tunnel — bigger holes on top, smaller holes behind, so you look *through* nested cutouts down to the logo):

| layer (nth-child) | z-index | mask fill L | `--size` (hole) | drop-shadow L |
|---|---|---|---|---|
| 1 | 7 | 50%   | **90%**   | 25%  |
| 2 | 6 | 55%   | **67.5%** | 30%  |
| 3 | 5 | 60%   | **45%**   | 35%  |
| 4 | 4 | 52.5% | **27.5%** | 27.5%|
| 5 | 3 | 55%   | **15%**   | 75%  |
| 6 (logo) | 2 | — | — | — |

So the front-most layer (z 7) has the biggest hole (90%) and the innermost visible ring (z 3) has the smallest (15%), with the logo image sitting behind everything at z 2, framed dead-center in the shrinking tunnel of holes.

**`.logo`**: `width:100%; height:100%; display:flex; justify-content:center; align-items:center`.
**`.logo img`**: `width:200px; height:auto; object-fit:contain`.

**Responsive** `@media (max-width:1000px)`: `.depth-layer` grows to `width:500%; height:500%; top:-200%; left:-200%` — even more oversized on small screens (layers translate a larger fraction of the viewport there, so they need more bleed to never reveal an edge).

## The effect (be exhaustive — this is the whole component)

There is **no timeline and no tween**. Motion is a hand-rolled frame-buffer + lerp running inside `gsap.ticker`. Reproduce every constant.

### Tunable constants (exact)
```
SENSITIVITY   = 0.3    // max pointer displacement as a fraction of hero size
LERP          = 0.04   // easing factor toward the sampled target, per frame
STAGGER_DELAY = 8      // frames of lag added per layer step
```
Derived: `totalDepthLayers = 6`; `BUFFER_SIZE = totalDepthLayers * STAGGER_DELAY + 1 = 49`.

### 1. Pointer tracking (normalized, centered on the hero)
Keep `const mouse = { x: 0, y: 0 }`.
- On `.hero` `mousemove`: read `rect = hero.getBoundingClientRect()`, then
  `mouse.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2`,
  `mouse.y = ((e.clientY - rect.top)  / rect.height - 0.5) * 2`.
  Range **−1..1**, with **0,0 at the hero center**.
- On `.hero` `mouseleave`: reset `mouse.x = 0; mouse.y = 0` (the tunnel eases back to rest/center).

### 2. Per-layer state
`const depthLayers = gsap.utils.toArray(".depth-layer")` (document order). Map to state objects:
```
layers[i] = {
  el: node,
  delay: (totalDepthLayers - 1 - i) * STAGGER_DELAY,  // i0→40, i1→32, i2→24, i3→16, i4→8, i5→0
  current: { x: 0, y: 0 },
}
```
Note the delay is **inverted vs. DOM index**: the **logo layer (index 5) has delay 0** (leads, most responsive), and the **front-most big-hole layer (index 0) has delay 40** (lags most). Also keep `const cursorTrail = []` — a rolling buffer of recent target positions.

### 3. The ticker loop (`gsap.ticker.add(() => { ... })`) — the star
Every frame:
1. `const rect = hero.getBoundingClientRect()`.
2. **Push the current target** onto the trail:
   `cursorTrail.push({ x: mouse.x * rect.width * SENSITIVITY, y: mouse.y * rect.height * SENSITIVITY })`.
   (At the extreme corner the target is ±30% of the hero's width/height.)
3. **Cap the buffer**: `if (cursorTrail.length > BUFFER_SIZE) cursorTrail.shift()` (drop the oldest).
4. For **each** layer:
   - `const trailIndex = Math.max(0, cursorTrail.length - 1 - layer.delay)` — sample a position `delay` frames in the past (clamped to the oldest entry while the buffer is still filling).
   - `const targetPos = cursorTrail[trailIndex]`.
   - Ease toward it: `layer.current.x += (targetPos.x - layer.current.x) * LERP` (and `.y` likewise).
   - Write it: `gsap.set(layer.el, { x: layer.current.x, y: layer.current.y })`.

### Why it looks the way it does
- **Two-stage lag.** Each layer first samples an *older* cursor target (the 8-frame-per-step stagger), then *eases* toward that stale target at only 4%/frame. Both effects compound: inner rings snap toward the cursor almost immediately while outer rings drift in behind them, producing a fluid caterpillar/comet-tail cascade rather than a rigid parallax.
- **Direction.** Positive `mouse.x` (cursor right of center) → positive target x → layers translate **right, toward the cursor**; same for y. The whole tunnel leans toward the pointer, and because the holes are concentric you get a convincing "looking down a shaft" perspective shift.
- **Rest state.** With the pointer outside the hero, targets are `0,0`; every layer lerps back to center and the tunnel settles perfectly aligned.
- **Softness.** Nothing is ever tweened to completion — the lerp means the layers are *always chasing*, so motion feels weighty and floaty, and stops the instant the target stabilizes.

## Assets / images
- **1 logo image** (`logo.jpg`): a bold, high-contrast **monogram / short wordmark** (e.g. two uppercase letters) in **solid white on a fully transparent background**, on a **square ~1:1 canvas** (~2800×2800). Displayed small (`width:200px`) dead-center on the innermost layer. Any simple, chunky mark works — no brand logos; use a neutral placeholder monogram.
- **1 SVG mask** (`mask.svg`): an SVG whose **`viewBox` matches the logo canvas (0 0 2800 2800)** containing a **single solid-fill (`#000`) silhouette path** of the same glyph. This is the shape subtracted from all five layers to cut the tunnel holes, so **it must match the logo's dominant silhouette** — if you swap the logo, regenerate this mask to the same shape. A bold, closed letterform path (thick strokes, no thin details, so the cutout reads clearly at every size from 90% down to 15%) works best.

## Behavior notes
- **Desktop / pointer only.** The effect is driven entirely by `mousemove`; touch devices that don't emit `mousemove` simply show the static, centered tunnel — that's acceptable, there's no touch fallback in the original.
- **Infinite, no trigger.** The ticker runs continuously from load; there is no start/stop, no `ScrollTrigger`, and **no reduced-motion guard** in the original. The tunnel is idle (centered) until the pointer enters the hero.
- **Perf.** `will-change: transform` on every layer; transforms are written with `gsap.set` (no layout thrash). The oversized 250%/500% layers plus `overflow:hidden` on `.hero` are what let layers translate freely without exposing edges.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/moblinks-interactive-logo/mask.svg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--v-void`, `--v-900`, `--v-700`, `--v-500`, `--v-400`, `--v-300`, `--v-core`, `--glow`, `--ink`, `--ink-dim`, `--ink-mute`, `--font-display`, `--font-mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one module that runs once at import time, grabs `.hero` and the six `.depth-layer` nodes off the live document, and hands its whole animation state — the `mouse` object, the `cursorTrail` buffer, and each layer's `current` position — to closures that are meant to live for the life of the page. React withdraws that guarantee quietly: the tunnel still looks centered and correct on first paint, and the damage only shows up as a faint tremor in the cascade once you've navigated away from the route and back.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here: two `mousemove`/`mouseleave` listeners on the same `.hero`, each feeding its own private `mouse` and `cursorTrail`, and two `gsap.ticker` callbacks, each computing its own six `current` positions and calling `gsap.set` on the very same six `.depth-layer` elements every frame. Because both closures target the live DOM directly rather than anything scoped to "their" render, the two loops don't render as two separate tunnels — they render as one tunnel whose position keeps getting overwritten by a second, independently-lerped trajectory, which reads as a faint stutter or lag inconsistency in the cascade rather than an obvious duplicate. It will not reproduce in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script runs at the top level: the `hero` and `depthLayers` lookups, the `mousemove`/`mouseleave` listeners, the `layers` array built from `depthLayers.map(...)`, and the `gsap.ticker.add` subscription all execute the moment the module is evaluated. In React that is import time, before `.hero` exists. Move all of it — from the lookups through the ticker subscription — into a `useEffect` with an empty dependency array. Don't leave any of it in the component body: rebuilding `layers` and re-subscribing the ticker on every render would restart the lerp state, and stack one more ticker callback, on every parent re-render, not just on mount.

*(2) Element lookups* — `document.querySelector(".hero")` and `gsap.utils.toArray(".depth-layer")` both assume this component owns the document. `.hero` is already this component's outermost element, so give it the root `ref` directly and reach the six children through a selector scoped to that ref: `const q = gsap.utils.selector(rootRef); const depthLayers = q(".depth-layer");`. Document order still has to survive that scoping — the effect derives each layer's delay from its position in the returned array, and the logo layer has to stay last (index five of six) for the "total layers minus one minus index" math to keep assigning it the shortest delay. During the StrictMode remount two copies of the six-layer markup exist for an instant; an unscoped lookup risks handing the ticker loop the outgoing copy's nodes, and the tunnel actually on screen never receives a single `gsap.set`.

*(3) Cleanup* — This component is the exception to "wrap it in `gsap.context`": there is no tween, timeline, or `ScrollTrigger` anywhere in it to revert. The only GSAP call is the bare `gsap.set` inside the ticker callback, and it fires on every animation frame, long after any context's synchronous setup call has already returned — the named-registration form of `self.add` doesn't cover it either, since that pattern re-runs its function once, on demand, from a click or similar listener, not automatically forever on every tick. A context here would have an empty revert list. What actually needs manual teardown is the ticker subscription and the two `hero` listeners, none of which GSAP tracks for you:

```jsx
useEffect(() => {
  const hero = rootRef.current;
  const q = gsap.utils.selector(rootRef);
  const depthLayers = q(".depth-layer");
  const mouse = { x: 0, y: 0 };
  const cursorTrail = [];
  const layers = depthLayers.map((el, i) => ({
    el,
    delay: (depthLayers.length - 1 - i) * STAGGER_DELAY,
    current: { x: 0, y: 0 },
  }));

  const onMove = (e) => { /* the same rect-relative math as above, writing into `mouse` */ };
  const onLeave = () => { mouse.x = 0; mouse.y = 0; };
  hero.addEventListener("mousemove", onMove);
  hero.addEventListener("mouseleave", onLeave);

  const tick = () => { /* the trail push/shift and the per-layer lerp + gsap.set, unchanged */ };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    hero.removeEventListener("mousemove", onMove);
    hero.removeEventListener("mouseleave", onLeave);
  };
}, []);
```

Skip any one of those three cleanup calls and the leftover keeps running exactly as described above: remove `tick` but leave `onMove` live, and `mouse`/`cursorTrail` keep updating forever with nowhere to feed; remove the listener pair but leave `tick` live, and the ticker keeps lerping toward whatever target `mouse` last held, forever, still writing `gsap.set` onto the six real `.depth-layer` nodes every frame. All three have to go together, in the same cleanup, for a route-away-and-back to leave nothing running behind it.
