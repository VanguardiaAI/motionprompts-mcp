---
slug: sticky-image-minimap
native_system: reveal-on-enter
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 1
structural:
  - { kind: duration, literal: "0.3", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Sticky Image Minimap — Scroll-Synced Thumbnail Highlight

## Goal
Build a tall, dark editorial travel gallery: a wide column of big full-size images that you scroll past, paired with a **sticky vertical minimap** of small thumbnails pinned to the left that stays centered on screen the whole time. The star effect: as each full-size image passes through the vertical center of the viewport, its matching thumbnail in the minimap **lights up** — it pops to `scale 1.3`, goes fully opaque, gains a white border and jumps above its neighbors — then softly reverts once the image leaves the center band. The result reads like a live "you are here" indicator tracking your scroll position through the gallery. Driven by one GSAP `ScrollTrigger` per image using its `onToggle` callback (no scrubbing).

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the single GSAP plugin **`ScrollTrigger`**. No smooth-scroll library, no canvas/WebGL. Import and register as:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```
Run everything inside a `DOMContentLoaded` handler.

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):
```
<nav>
  <a href="#">Meridian</a>          (fictional travel brand / logo)
  <button>Sign Up</button>
</nav>

<div class="container">
  <h1> long editorial travel headline </h1>
</div>

<div class="gallery">
  <div class="minimap">
    <div class="preview"></div>      (JS injects the 10 thumbnails here)
  </div>
  <div class="images"></div>         (JS injects the 10 full-size images here)
</div>

<div class="container">
  <h1> second long editorial travel headline </h1>
</div>
```
- Two `.container` blocks (one above, one below the gallery) each hold a single large `<h1>` of neutral travel prose (e.g. *"Embark on a journey where every destination is a paradise, offering a symphony of colors, cultures, and experiences that enrich the soul…"* and *"Explore a world where every horizon promises new wonders and each journey is a tapestry of breathtaking landscapes and timeless moments…"*). No brand names in the copy.
- Nav: a text logo (fictional — e.g. **"Meridian"**) on the left and a **"Sign Up"** pill button on the right.
- **Important:** `.minimap .preview` and `.images` start **empty**. The JS clears both (`innerHTML = ""`) and generates all thumbnails and full-size images programmatically (see GSAP section). Do not hardcode the images in HTML — the effect depends on the JS build loop.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`.

**Fonts** (the original uses two proprietary faces — name them with sane fallbacks):
- **"Neue Montreal"** (neutral neo-grotesque sans) for `html, body` — substitute Inter / Neue Haas / any clean grotesque.
- **"PP Editorial Old"** (a high-contrast serif) for the nav link, the button, and the big `h1` headings — substitute any elegant editorial serif (e.g. PP Editorial New, Times-ish display serif).

The `html, body` rule carries **only** `font-family` — that's the entire rule: `html, body { font-family: "Neue Montreal"; }`. It has **no `background`, no `background-color`, and no `color`**. Text color (`#fff`) is set per element (on `nav a`, `button`, `h1`, and via `color:#fff` on `.gallery`), and the dark backdrop is set per section block (see Palette). Leave `html`/`body` transparent.

**Palette:** near-black `#0f0f0f` and white `#fff` text — a dark, minimal editorial look.

> **Critical (this breaks the whole component if you get it wrong):** the `#0f0f0f` background belongs to the **section blocks** — `.container` and `.gallery` each set their own `background:#0f0f0f` — and **NOT** to `html`, `body`, or any other root/ancestor element. Do **not** add a global dark background in a reset/boilerplate (`html, body { background:#0f0f0f }`, `background:#0f0f0f` on `*`, etc.). Here's why it matters: `.gallery` sits at `z-index:-1` (see Key CSS), so it paints **beneath** its ancestors. If `html` or `body` has any background color, that background paints on top of the negatively-stacked gallery and hides the entire minimap + image column — you get a black page showing only the fixed nav ("Meridian" / "Sign Up") and nothing else, even though the GSAP logic runs perfectly. The correct result: `html`/`body` stay transparent, and the visible `#0f0f0f` you see everywhere is contributed piece-by-piece by the `.container` and `.gallery` blocks, which stack normally.

Key CSS:
- `nav { position:fixed; width:100%; display:flex; justify-content:space-between; align-items:center; padding:2em; }` — floats over the top of everything.
- `nav a { color:#fff; text-decoration:none; }`.
- `button { padding:1em 2em; border:1px solid #fff; background:rgba(255,255,255,0.15); border-radius:50px; color:#fff; z-index:10000; }` — a translucent white-outlined pill.
- `.container { padding:10em 2em 5em 2em; width:100%; height:100%; background:#0f0f0f; }`.
- `h1 { color:#fff; font-family:"PP Editorial Old"; font-size:60px; font-weight:lighter; }` — big, thin, elegant serif.
- `.gallery { position:relative; width:100%; display:flex; background:#0f0f0f; color:#fff; padding:5em 2em; z-index:-1; }` — the sticky minimap and the image column sit side by side; this block carries its **own** `background:#0f0f0f`. (`z-index:-1` tucks it beneath the `.container` blocks so the nav/pill stay above it.)
  - **⚠️ Gotcha — the single most important detail in this component:** that `z-index:-1` makes `.gallery` paint below **any** ancestor that has a background. It works only because `html` and `body` are transparent (no `background`). If you put a background on `html`/`body` (a common dark-theme reset habit), it will cover the gallery and the entire effect — minimap, images, and highlight — vanishes behind a flat black page while the JS still runs silently. Keep `html`/`body` background-free; let `.container` and `.gallery` each own their `#0f0f0f`.
- `.minimap { position:sticky; top:0; width:20%; height:100vh; padding:2em 0; display:flex; justify-content:center; align-items:center; }` — **this is the sticky rail**: it occupies the left 20%, is one viewport tall, and its `.preview` stack is centered vertically. Because it's `position:sticky; top:0` inside the tall `.gallery`, it stays fixed on screen while the image column scrolls.
- `.images { position:relative; top:0; width:80%; }` — the right 80% holds the tall stack of big images.
- `.img { position:relative; width:800px; height:1000px; border-radius:40px; overflow:hidden; margin:50px auto; }` — each full-size image is a large rounded 4:5 portrait card, 50px vertical gap between cards, horizontally centered in the column.
- `.img-thumbnail { position:relative; width:50px; height:70px; border-radius:10px; overflow:hidden; opacity:0.5; }` — the minimap tile: a tiny 5:7 rounded thumbnail, **half-opacity by default**. No margins, so the 10 thumbnails stack directly touching, forming a ~700px vertical filmstrip inside the centered `.preview`.
- `img { width:100%; height:100%; object-fit:cover; }` — both full images and thumbnails hard-crop to fill their box.
- Media query `max-width:900px`: `.img { width:400px; height:500px; }` (the big cards shrink; thumbnails stay 50×70).

## GSAP effect (be exhaustive — this is the whole component)

Everything runs inside a single `DOMContentLoaded` handler.

### 1. Setup
```js
const numberOfImages = 10;
const minimap = document.querySelector(".minimap .preview");
const fullSizeContainer = document.querySelector(".images");
minimap.innerHTML = "";
fullSizeContainer.innerHTML = "";
let activeThumbnail = null;
```
`activeThumbnail` is a module-level pointer to the currently highlighted thumbnail so the code can un-highlight the previous one when a new one activates.

### 2. Random horizontal jitter helper
```js
function getRandomLeft() {
  const values = [-15, -7.5, 0, 7.5, 15];
  return values[Math.floor(Math.random() * values.length)] + "px";
}
```
Returns a random horizontal offset from the discrete set **{−15, −7.5, 0, 7.5, 15}px**. This is applied as an inline `style.left` to give the otherwise perfectly-aligned column an organic, slightly-scattered feel.

### 3. Build loop — for `i = 1 … 10`
For each index:
1. `const randomLeft = getRandomLeft();` — **one** offset value is computed per index and applied to **both** the thumbnail and the matching full image, so a thumbnail and its big image share the same horizontal nudge.
2. `const imagePath = "/c/sticky-image-minimap/img" + i + ".jpg";` (same source image used for both the thumbnail and the full card).
3. **Thumbnail:** create `div.img-thumbnail`, set `style.left = randomLeft`, append an `<img src=imagePath>`, append the div into `.minimap .preview`.
4. **Full image:** create `div.img`, set `style.left = randomLeft`, append an `<img src=imagePath>`, append the div into `.images`.
5. **Create the ScrollTrigger** bound to that full image div:
```js
ScrollTrigger.create({
  trigger: imgDiv,
  start: "top center",
  end: "bottom center",
  onToggle: (self) => {
    if (self.isActive) {
      if (activeThumbnail && activeThumbnail !== thumbnailDiv) {
        animateThumbnail(activeThumbnail, false); // un-highlight the previous
      }
      animateThumbnail(thumbnailDiv, true);       // highlight this one
      activeThumbnail = thumbnailDiv;
    } else if (activeThumbnail === thumbnailDiv) {
      animateThumbnail(thumbnailDiv, false);      // leaving center → revert
    }
  },
});
```

### ScrollTrigger config (exact)
- **One ScrollTrigger per full-size image** (10 total). No shared timeline, no pin, no `scrub`.
- `trigger`: the full-size `.img` div.
- `start: "top center"` — becomes active when the top of the image reaches the vertical center of the viewport.
- `end: "bottom center"` — deactivates when the bottom of the image passes the vertical center. So a trigger is **active for the entire span the image straddles the screen's vertical midline.**
- The effect is driven purely by **`onToggle`** (fires each time `self.isActive` flips), not by scroll progress. `self.isActive` is the boolean state.
- Toggle logic: on activation, first revert any *other* currently-active thumbnail, then highlight this one and store it as `activeThumbnail`. On deactivation, revert this thumbnail only if it was the active one. (Because big cards are 1000px tall with only 50px gaps and start/end both key off `center`, the active window of consecutive images can briefly overlap during fast scrolls — the "revert previous, then activate new" guard keeps exactly one highlighted.)

### The highlight tween
```js
function animateThumbnail(thumbnail, isActive) {
  gsap.to(thumbnail, {
    border: isActive ? "1px solid rgba(255, 255, 255, 1)" : "none",
    opacity: isActive ? 1 : 0.5,
    scale: isActive ? 1.3 : 1,
    zIndex: isActive ? 10000 : 1,
    duration: 0.3,
  });
}
```
Each thumbnail state change is a **0.3s `gsap.to`** (default `power1.out` ease — no ease specified, no delay, no stagger). Active vs inactive targets:
- `border`: `1px solid rgba(255,255,255,1)` (crisp white outline) ↔ `none`.
- `opacity`: `1` ↔ `0.5`.
- `scale`: `1.3` ↔ `1` (the active tile grows ~30%, overlapping its touching neighbors).
- `zIndex`: `10000` ↔ `1` (brings the enlarged active tile on top of the others).

There is no other animation anywhere — no reveal on load, no scrub, no parallax. The full-size images do not animate; only the thumbnails react.

## Assets / images
**10 travel photographs** forming one cohesive, editorial, wanderlust set — golden-hour coastlines, mountain vistas, misty valleys, desert dunes, forests, architecture and shorelines, warm and moody. Each source is reused twice (as a big card and as its thumbnail). Both display boxes are portrait-cropped with `object-fit:cover` (full card = 800×1000 ≈ 4:5; thumbnail = 50×70 ≈ 5:7), so **portrait-friendly framing works best**, though the cover crop forgives any aspect. Suggested rhythm by role:
1. Wide golden-hour coastal / landscape, warm tones.
2. Wide travel landscape.
3. Tall vertical travel portrait.
4. Wide scenic landscape.
5. Tall vertical scenic portrait.
6. Tall vertical travel portrait.
7. Tall vertical travel portrait.
8. Tall vertical scenic portrait.
9. Wide travel landscape, warm tones.
10. Square-format travel scene.

## Behavior notes
- **Scroll-driven and reversible**: scrolling back up re-fires the toggles, so highlights turn on/off going either direction. Nothing autoplays on load — on first paint the minimap shows all 10 thumbnails at rest (0.5 opacity, no border).
- **The sticky minimap** is pure CSS (`position:sticky; top:0` on a 100vh element inside the tall `.gallery`); GSAP only touches the thumbnail highlight state.
- The per-image random `left` jitter is decorative and re-randomizes on every page load (matches the original).
- Light/mobile-safe: only 10 cheap `ScrollTrigger`s and short 0.3s tweens; no heavy assets or continuous rAF loop.
- Reduced-motion: the only motion is the user's own scroll plus brief 0.3s state tweens; it's already calm. If honoring `prefers-reduced-motion`, you can drop the scale/opacity tween to an instant `gsap.set`.

## Images

This component ships with 10 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/sticky-image-minimap/img1.jpg
https://motionprompts.dev/c/sticky-image-minimap/img10.jpg
https://motionprompts.dev/c/sticky-image-minimap/img2.jpg
https://motionprompts.dev/c/sticky-image-minimap/img3.jpg
https://motionprompts.dev/c/sticky-image-minimap/img4.jpg
https://motionprompts.dev/c/sticky-image-minimap/img5.jpg
… 4 more under https://motionprompts.dev/c/sticky-image-minimap/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--muted`, `--amber`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, reaches into the page with `document.querySelector` for `.minimap .preview` and `.images`, and then imperatively builds ten thumbnail/full-image pairs with `document.createElement` and `appendChild`, wiring one `ScrollTrigger` per pair as it goes. React withdraws the ready-made document, the free run of an unscoped selector, and the license to never tear anything down — and it does it quietly: the minimap lights up correctly the first time the page loads, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component's setup is a build loop, not a single wire-up, so a double mount without teardown doesn't just double one trigger — it reruns `minimap.innerHTML = ""` and `fullSizeContainer.innerHTML = ""` against nodes that may already belong to the second mount, rebuilds all twenty thumbnail/image elements with a freshly re-rolled set of jitter offsets, and stacks a second set of ten `ScrollTrigger`s on top of the first. Two triggers per image now fire `onToggle` into a shared `activeThumbnail` pointer, and the highlight visibly races or lags a step behind the scroll position in development. None of this reproduces in a production build — React only double-invokes in development — so treat the teardown below as load-bearing, not optional.

*(1) The entry point* — the whole build-and-wire sequence, from clearing the two containers through creating all twenty DOM nodes and all ten `ScrollTrigger`s, lives inside `document.addEventListener("DOMContentLoaded", ...)`. By the time a React component mounts, that event has already fired, so the listener is registered and never called — the minimap and the image column stay permanently empty, with nothing to point at as broken. Delete the listener and move its entire body into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `document.querySelector(".minimap .preview")` and `document.querySelector(".images")` assume this component owns the whole document, but the bigger issue is the imperative build itself. `minimap.innerHTML = ""` followed by ten rounds of `createElement`/`appendChild` is DOM surgery on a subtree React expects to own exclusively once this renders as a component; it works on the very first mount and then fights the renderer the moment anything (a StrictMode remount, a parent re-render) causes this component to run again while the hand-built nodes are still attached. Replace the build loop with a declarative one: hold the ten image paths in an array, `.map()` it into JSX for both the `.preview` list and the `.images` list, and give each pair a callback ref instead of the loop-local `thumbnailDiv`/`imgDiv` variables the vanilla version closes over:

```jsx
{items.map((item, i) => (
  <div key={item.path} className="img" ref={(el) => (imageRefs.current[i] = el)}>
    <img src={item.path} style={{ left: item.left }} />
  </div>
))}
```

Put a root ref on the element wrapping `.minimap` and `.images` so anything you still reach with a lookup is scoped to it, not the document.

*(3) Cleanup* — wrap the ten `ScrollTrigger.create` calls in a single `gsap.context` scoped to the root ref, building each trigger off the ref array rather than the closure variables the `for` loop used above:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    imageRefs.current.forEach((imgEl, i) => {
      ScrollTrigger.create({
        trigger: imgEl,
        start: "top center",
        end: "bottom center",
        onToggle: (self) => { /* same activate/deactivate logic, targeting thumbnailRefs.current[i] */ },
      });
    });
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` removes all ten triggers in one call and rolls back every inline style the `animateThumbnail` tweens wrote — border, opacity, scale, z-index. Skip it and the StrictMode remount leaves ten stale triggers bound to scroll positions that belonged to the first mount's DOM nodes, still firing into thumbnails the second mount replaced.

The `activeThumbnail` pointer needs a home that isn't `useState`. It changes on nearly every `onToggle` firing across all ten triggers — routing it through state would re-render the whole component on each activation and hand every `onToggle` closure a stale value from whatever render created it, since these callbacks are registered once, at mount, and never recreated. A `useRef(null)`, read and written directly inside the ten `onToggle` callbacks exactly as the plain variable works above, survives across all ten without forcing a render.

The per-pair `getRandomLeft()` jitter needs a home too, and it isn't the render body: computed inline inside a `.map()` over the render, it rerolls on every re-render and breaks the rule that a thumbnail and its full image share one offset. Compute the ten offsets once, before the loop that builds `items`, and freeze them in the ref array or the memoized data driving `.map()` — `useMemo(() => Array.from({ length: 10 }, getRandomLeft), [])` — so index `i`'s offset stays fixed for the life of the mount instead of reshuffling every time this component happens to re-render.
