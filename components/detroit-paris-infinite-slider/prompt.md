# Infinite Perspective Slider — "Perpetual Motion"

## Goal
Build a full-viewport, **infinitely draggable horizontal image slider** where slides are anchored to the bottom edge and **grow exponentially wider from left to right**, producing a receding-perspective "wall of images" that never ends in either direction. Dragging, wheeling or swiping feeds a scroll target that is **lerp-smoothed every animation frame**; the images recycle modulo 10 so the stream loops forever. The star effect is the exponential width ramp + seamless infinite wrap driven entirely by a hand-written `requestAnimationFrame` loop.

## Tech
Vanilla HTML/CSS/JS with an ES module entry (`<script type="module">`). **No animation library is used — no GSAP, no Lenis.** All motion is a custom `requestAnimationFrame` render loop with manual linear interpolation (lerp). Everything must run in a fresh Vite project with zero npm dependencies.

## Layout / HTML
Minimal, semantic; the JS generates all slides at runtime.

```html
<section class="slider">
  <div class="slider-header">
    <h1>Perpetual Motion</h1>
  </div>
</section>
```

- `.slider` is the full-screen stage and the interaction surface (wheel / touch / pointer listeners attach here).
- `.slider-header` holds a single `<h1>` pinned top-left.
- The JS creates N `<div class="slide">` children, each containing one `<img>`, and appends them into `.slider`. There is **no** markup for slides in the HTML — they are all built in script.

## Styling
Paleta / type:
- `body` background: `#edede7` (warm off-white / bone).
- Fonts, both Google Fonts, in one import: `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap");`
  - **"Hanken Grotesk"** for everything by default — if unavailable, fall back to a clean grotesk sans-serif.
  - **"Instrument Serif"** for the two serif accents only: `.brand-mark` and `.eyebrow` (`font-family: "Instrument Serif", serif`).
- Global reset: `* { margin:0; padding:0; box-sizing:border-box; user-select:none; }`.

`.slider`:
- `position:relative; width:100%; height:100svh; overflow:hidden;`
- `touch-action:none;` (so wheel/touch are fully custom)
- `cursor:grab;` and `.slider:active { cursor:grabbing; }`

`.slide`:
- `position:absolute; left:0; bottom:0; overflow:hidden;`
- `will-change: transform, width, height;`
- Its `width`, `height`, `zIndex` and `transform` are all set inline by the render loop every frame. Slides are **bottom-anchored** (they grow upward as they get wider).

`.slide img`:
- `width:100%; height:100%; object-fit:cover; display:block; pointer-events:none;`

`.slider-header`:
- `position:absolute; top:3rem; left:3rem;`
- `<h1>`: `width:50%; font-weight:500; font-size:clamp(3rem, 5vw, 7rem); letter-spacing:-0.02em; line-height:1;`

## The effect — exhaustive spec (rAF engine, no GSAP)

### Config constants (use these exact values)
```js
const config = {
  totalSlides: 10,   // number of UNIQUE images (mod for looping)
  lerp: 0.075,       // smoothing factor per frame
  scrollSpeed: 3.5,  // global input multiplier
  minSize: 0.1,      // smallest slide width = 10% of slider width
  growth: 0.25,      // exponential growth exponent per slide step
  aspect: 1 / 1.25,  // slide width/height ratio = 0.8 (portrait, taller than wide)
  baseline: 0.0,     // vertical offset fraction (0 = flush to bottom)
};
```

### Derived quantities
- `growthRatio = Math.exp(config.growth)` ≈ **1.2840** — each slide to the right is ~1.284× wider than its left neighbour.
- Number of DOM slides to create:
  ```js
  const slideCount =
    Math.ceil(Math.log(1 + (growthRatio - 1) / config.minSize) / config.growth) + 4;
  ```
  With these constants this evaluates to **10**. Create exactly this many `.slide` elements once, up front, and reuse them forever (object pool). Push each into a `slides[]` array and initialise a parallel `slideStreamIndex[]` array with `[0,1,2,…,slideCount-1]`.

### Core helper functions
```js
const lerp = (start, end, t) => start + (end - start) * t;
const wrap = (value, max) => ((value % max) + max) % max; // always-positive modulo
// Left edge (in px) of the slide occupying continuous stream position `position`:
const edgeX = (position, width) =>
  (width * config.minSize * (Math.pow(growthRatio, position) - 1)) /
  (growthRatio - 1);
```
`edgeX` is the closed-form sum of a geometric series: the cumulative width of every slide before `position`. Consequence: the rendered width of a slide spanning `[p, p+1)` is
`edgeX(p+1) - edgeX(p) = sliderWidth * minSize * growthRatio^p`
— i.e. slide widths follow a **geometric progression**: tiny on the left (≈10% of viewport), exponentially larger toward the right. This is the perspective illusion.

### State
```js
let scroll = 0;        // smoothed scroll position (what render uses)
let scrollTarget = 0;  // raw target updated by input events
```

### Input handlers (all attached to `.slider`)
1. **wheel** (`{ passive:false }`, calls `e.preventDefault()`):
   `scrollTarget += (e.deltaY + e.deltaX) * config.scrollSpeed * 0.0014;`
2. **touchstart**: store `lastTouchX = e.touches[0].clientX`.
   **touchmove** (`{ passive:true }`): if a touch is active,
   `scrollTarget += (lastTouchX - x) * config.scrollSpeed * 0.004;` then `lastTouchX = x`.
   **touchend**: `lastTouchX = null`.
3. **pointerdown**: `lastPointerX = e.clientX; slider.setPointerCapture(e.pointerId);`
   **pointermove**: if dragging,
   `scrollTarget += (lastPointerX - e.clientX) * config.scrollSpeed * -0.005;` then `lastPointerX = e.clientX`. (Note the **negative** 0.005 multiplier for pointer drag — sign is intentional.)
   **pointerup** / **pointercancel**: `lastPointerX = null`.

There is **no inertia/momentum** other than the lerp: input mutates `scrollTarget` instantly; `scroll` chases it.

### Render loop (runs every frame via `requestAnimationFrame`)
Call `render()` once to start; it re-schedules itself at the end.

Each frame:
1. `scroll += (scrollTarget - scroll) * config.lerp;` — the single global smoothing step (factor 0.075). This is what makes drags decelerate softly.
2. Read `sliderWidth = slider.clientWidth`, `sliderHeight = slider.clientHeight`, `baselineOffset = sliderHeight * config.baseline` (= 0 here).
3. For each slide `i` in `0…slideCount-1`:
   - Take `streamIndex = slideStreamIndex[i]`.
   - **Recycle rightward** (slide fell off the right): `while (edgeX(streamIndex + scroll, sliderWidth) > sliderWidth) streamIndex -= slideCount;`
   - **Recycle leftward** (slide fell off the left): `while (edgeX(streamIndex + scroll + 1, sliderWidth) < 0) streamIndex += slideCount;`
   - Persist it back: `slideStreamIndex[i] = streamIndex;`
   - Compute pixel geometry:
     ```js
     const left  = Math.round(edgeX(streamIndex + scroll,     sliderWidth));
     const right = Math.round(edgeX(streamIndex + scroll + 1, sliderWidth));
     const width = right - left;
     const height = width / config.aspect;   // = width * 1.25 (taller than wide)
     ```
   - **Assign image**: image number = `wrap(streamIndex, config.totalSlides) + 1` → an integer in `1…10`. Only swap the `<img>.src` when it actually changes (cache the current number on a `data-image` attribute to avoid redundant DOM writes).
   - Apply inline styles:
     ```js
     slide.style.width  = `${width}px`;
     slide.style.height = `${height}px`;
     slide.style.zIndex = Math.round(right);            // wider/rightmost slides stack on top
     slide.style.transform = `translate(${left}px, ${-baselineOffset}px)`;
     ```
4. `requestAnimationFrame(render);`

### Behavioural summary of the motion
- Positive scroll direction slides the whole exponential stream; slides continuously widen as they migrate right and shrink as they migrate left, then wrap seamlessly at both edges thanks to the two `while` recycle loops + the object pool.
- Because `zIndex = round(right)`, the largest/rightmost slide always overlaps its smaller left neighbour, reinforcing the depth.
- Images repeat every 10 stream steps (`wrap(streamIndex, 10)`), so a 10-image set produces an endless loop.
- Bottom-anchoring (`bottom:0` + `translateX` only) means slides visually "grow up" out of the bottom edge as they enlarge.

## Assets / images
- **10 full-bleed editorial photographs**, all portrait crop (~4:5, taller than wide). The code multiplies width by `1/aspect = 1.25`, so the intended aspect ratio is **width:height = 0.8** — supply tall images; `object-fit:cover` handles any real ratio.
- Referenced by a numbered filename pattern `slide-img-1.jpg … slide-img-10.jpg` (image number 1–10). Every slide plays the same **role**: a full-bleed background photo inside a bottom-anchored, exponentially-scaled frame; none is a logo, icon or UI chrome. **No brand marks, no text overlays.**
- The real set is an **architectural-interior + still-life** collection with a design-catalog / quiet-luxury mood, split between soft earthy neutrals and a few high-saturation jewel-tone accents. Concrete examples from the actual files:
  - Sculptural minimalist interiors: a curved cream-plaster alcove with a boucle lounge chair, potted plant and warm amber cove uplight (bone/cream + amber glow); one or more board-formed concrete great-rooms with a floating cantilevered stair, raw-oak plank dining table with woven wishbone chairs, a jute rug and an olive-green leather sofa (grey concrete + warm oak + green).
  - A bright white gallery space with a massive raw-stone monolith table, framed off-white prints on the walls, glass decanters and a large suspended brass ring (off-white + sandy stone-beige + brass).
  - A warm terracotta / peach-plaster arched courtyard with a potted olive tree, a round sunken plunge pool and magenta bougainvillea (terracotta-pink + muted green + magenta).
  - Saturated floral still lifes: a close-up of violet-purple bearded irises with golden-yellow beards against a deep crimson-red backdrop; a bouquet of purple irises in a clear glass vase on a dark green marble table against a rust-red wall (violet/purple + deep red + green + yellow).
  - A clear round glass water carafe casting scattered rainbow prism refractions across a soft grey paper backdrop (cool grey + spectral rainbow highlights).
- Dominant colours across the set: **warm bone/cream and stone beige, grey concrete, terracotta/peach, oak brown and olive green, brass — punctuated by high-chroma violet-purple, deep crimson-red and rainbow-prism accents.** Keep any replacements within this mix of soft sunlit neutrals plus occasional saturated jewel-tone stills.
- Reuse/repeat images if fewer than 10 are available; the modulo wrap tolerates it.

## Behavior notes
- **Desktop + touch**: wheel and pointer drag on desktop, touch swipe on mobile — all three feed the same `scrollTarget`.
- `touch-action:none` and `preventDefault` on wheel disable native page scroll so the slider owns the gesture.
- Infinite in **both** directions; no start or end; no snapping.
- The only "animation" is the per-frame lerp toward `scrollTarget` — there is no timeline, no easing curve object, no library. Keep the render loop lean (avoid per-frame allocations; only touch `img.src` on change).
- No explicit reduced-motion branch in the original; motion is user-driven (it does not auto-play), so it idles perfectly still until the user interacts.

## Images

This component ships with 10 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/detroit-paris-infinite-slider/slide-img-1.jpg
https://motionprompts.dev/c/detroit-paris-infinite-slider/slide-img-10.jpg
https://motionprompts.dev/c/detroit-paris-infinite-slider/slide-img-2.jpg
https://motionprompts.dev/c/detroit-paris-infinite-slider/slide-img-3.jpg
https://motionprompts.dev/c/detroit-paris-infinite-slider/slide-img-4.jpg
https://motionprompts.dev/c/detroit-paris-infinite-slider/slide-img-5.jpg
… 4 more under https://motionprompts.dev/c/detroit-paris-infinite-slider/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--paper-2`, `--ink`, `--ink-70`, `--ink-45`, `--oxblood`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: a script that reaches into the page with `document.querySelector(".slider")`, then keeps five event listeners (`wheel`, `pointerdown`, `pointermove`, `pointerup`, `pointercancel`) and a self-recursing `requestAnimationFrame` loop alive for as long as the page is open. React withdraws all of that at once, and it does it quietly — dragging still moves the slides, but something underneath is now doubled.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that never runs leaves two of everything here: two `render()` loops each independently smoothing their own `scroll` toward their own `scrollTarget`, two sets of `wheel`/`pointer` listeners each pushing into a different `scrollTarget`, and two pools of `slideCount` slide elements appended into the same `.slider` — twice the DOM nodes competing for the same `zIndex` stack, animated by two loops that disagree about where the stream currently sits. The symptom is a slider that stutters or jumps on the very first drag, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — This script is already closer to React's shape than most in this catalogue: the body is a `mount(config)` that returns a `destroy()` undoing exactly what `mount()` built, so this catalogue's own editor runtime (`window.MP.register`) can tear the slider down and remount it live with a different `config` (a different `growth`, a different `minSize` — anything that changes `slideCount`). Drop the `window.MP` branch entirely; that is the editor's hook into this file, not something a consuming app ships. Drop the `document.readyState` check and its `DOMContentLoaded` listener too — that guard exists to survive being loaded late into a plain document, and `useEffect` already runs after the DOM is committed. What is left is exactly the effect body:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS });
  return destroy;
}, []);
```

*(2) Element lookups* — `mount()` opens with `document.querySelector(".slider")` and quietly returns a no-op `destroy` if it doesn't find one. Here `.slider` isn't a descendant this component reaches into — it's the component's own root, the element the wheel and pointer listeners attach to and the parent every generated `.slide` gets appended into. Give the component a ref on that outermost `<section>` and pass the element itself into `mount` instead of letting it search the whole document. This matters most during the StrictMode remount: for an instant, two `.slider` elements exist in the tree, and an unscoped query can bind the loop, the listeners and the freshly-created slide pool to the copy that's on its way out while the visible copy sits inert.

*(3) Cleanup* — `mount()`'s own `destroy()` already does the work this catalogue's rAF-driven components usually need adding by hand: it calls `cancelAnimationFrame` on the exact `frame` handle `render()` last returned, removes each of the five listeners by the same function reference `addEventListener` was given (`onWheel`, `onPointerDown`, `onPointerMove`, `releasePointer` twice), and removes every element `slides[]` holds — not a `querySelectorAll(".slide")` sweep, but the precise set this closure created. That precision is required, not incidental: `slideCount` is derived from `growth` and `minSize`, so a remount with a different `config` produces a different slide count, and only a closure-scoped list — never a global selector — is guaranteed to remove exactly the ones this mount added. Return `destroy` unmodified from the effect.

Two details are worth keeping exactly as they are rather than "cleaning up" on the way in. First, `scroll`, `scrollTarget` and `slideStreamIndex[]` are plain variables closed over by `render()`, mutated on every animation frame and on every wheel or pointer event — they drive `slide.style.width/height/transform` directly and nothing in JSX ever reads them. Promoting any of them to `useState` would re-render the component on every frame and every drag pixel for values the render tree never consumes; keep them as closured variables (or refs, if some other effect genuinely needs to read the current `scroll`). Second, the `wheel` listener is registered with `{ passive: false }` specifically so its `e.preventDefault()` can suppress page scroll while the slider owns the gesture. If this gets rewritten as a JSX `onWheel` prop instead of the manual `addEventListener` call `mount()` already uses, React binds it as a passive listener and `preventDefault()` silently does nothing, so the page scrolls out from under the slider on every tick of the wheel. Keep the listener attached the way the original does, inside the effect, not as a JSX handler.
