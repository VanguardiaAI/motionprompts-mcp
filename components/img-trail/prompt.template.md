---
slug: img-trail
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 4
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: stagger, literal: "0.025", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Mouse Image Trail — cursor spawns image tiles that drop-and-fade on pause

## Goal
Build a full-viewport interactive canvas where **moving the mouse spawns image tiles at the cursor**, leaving a trail of stacked photos across the screen. The tiles keep piling up while the pointer is moving; **the instant the pointer pauses (~100 ms of no movement) GSAP animates the entire batch straight down off-screen** with a staggered scale-down + fade, then removes them. A centered uppercase headline sits behind the trail. The star effect is the `gsap.to(".item", …)` staggered drop (`y: 1000`, `scale: 0.5`, `opacity: 0`) fired on pointer-idle.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite + npm project. Install and import from npm:
- **`gsap`** (3.x) — the only dependency.

```js
import gsap from "gsap";
```
**No GSAP plugins** (no ScrollTrigger, SplitText, CustomEase), no Lenis, no Three.js, no canvas/WebGL. All logic runs inside a single `DOMContentLoaded` listener. Ship exactly three files: `index.html`, `styles.css`, `script.js`.

## Layout / HTML
A minimal document: one empty `.items` layer (JS injects tiles into it) and one headline `<h1>`. Class names are load-bearing — the JS queries `.items` and animates `.item`; the CSS positions both.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mouse Image Trail</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div class="items"></div>
    <h1>
      Move your mouse <br />
      to explore
    </h1>
    <script type="module" src="./script.js"></script>
  </body>
</html>
```

- `.items` starts **empty** — every tile is created in JS at runtime.
- The `<h1>` copy is `Move your mouse` / `to explore` with a `<br>` between the two lines. Neutral demo text, no brands.

## Styling
```css
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body { background-color: orange; }   /* CSS keyword orange = #ffa500 */

h1 {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: "PP Neue Montreal";
  font-size: 40px;
  font-weight: 400;
  text-transform: uppercase;
  line-height: 100%;
  z-index: 1;
}

.items {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2;      /* the trail layer sits ABOVE the headline */
}

.item {
  position: absolute;
  width: 150px;
  height: 200px;
  background: #000;   /* black backing shows behind the image while it loads */
  overflow: hidden;   /* clips the cover-cropped image to the tile box */
}

.item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Details that matter:
- **Background** is the CSS keyword `orange` (`#ffa500`) on both `html` and `body`.
- **Font**: `"PP Neue Montreal"` — a modern grotesque. It is not a public web font and will silently fall back; keep it as the first name but a stack like `"PP Neue Montreal", "Helvetica Neue", Arial, sans-serif` is fine. What matters visually: 40px, weight 400, uppercase, tight `line-height: 100%`, centered.
- **Stacking**: `.items` (`z-index: 2`) renders **over** the `<h1>` (`z-index: 1`), so spawned tiles cover the headline.
- **Tile box**: every `.item` is a fixed **150 × 200 px** (3:4 portrait) black rectangle with `overflow: hidden`; the `<img>` fills it with `object-fit: cover`.

## GSAP effect (the important part — be exhaustive)
Everything is **pointer-driven** (`mousemove`) — there is no load, scroll, hover-enter or click animation. Wrap all of it in `document.addEventListener("DOMContentLoaded", …)`.

### State (module-scope inside the DOMContentLoaded callback)
```js
const container = document.querySelector(".items");
let imageIndex = 1;            // 1-based, cycles 1..15
let animationTimeout = null;   // the pending "idle" timer
let currentlyAnimating = false;
```

### 1. Spawning a tile — `addNewItem(x, y)`
On each pointer move, create and position a fresh tile at the cursor:
```js
function addNewItem(x, y) {
  const newItem = document.createElement("div");
  newItem.className = "item";
  newItem.style.left = `${x - 75}px`;   // 150px wide → -75 centers HORIZONTALLY on cursor
  newItem.style.top  = `${y - 75}px`;   // NOT vertically centered (tile is 200px tall)

  const img = document.createElement("img");
  img.src = `img${imageIndex}.jpg`;     // cycles through img1.jpg … img15.jpg
  newItem.appendChild(img);
  imageIndex = (imageIndex % 15) + 1;   // 1,2,…,15,1,2,… (wraps after 15)

  container.appendChild(newItem);
  manageItemLimit();
}
```
- **Positioning**: `left = x - 75` centers the 150px-wide tile horizontally under the cursor. `top = y - 75` uses the *same* 75px offset even though the tile is 200px tall, so the cursor sits **75px below the tile's top edge** (125px above its bottom) — the tile hangs mostly *below/around* the pointer, intentionally not vertically centered. Use `event.pageX` / `event.pageY` for `x` / `y`.
- **Image cycling**: `imageIndex` runs 1→15 and wraps via `(imageIndex % 15) + 1`; each new tile takes the next image in sequence, so a fast sweep lays down all 15 in order before repeating.

### 2. Capping the trail — `manageItemLimit()`
```js
function manageItemLimit() {
  while (container.children.length > 20) {
    container.removeChild(container.firstChild);   // drop the OLDEST tile
  }
}
```
At most **20 tiles** exist at once; while the pointer keeps moving, the oldest tiles are silently removed from the front so the trail's length stays bounded.

### 3. The drop — `startAnimation()` (the signature GSAP tween)
```js
function startAnimation() {
  if (currentlyAnimating || container.children.length === 0) return;
  currentlyAnimating = true;
  gsap.to(".item", {
    y: 1000,
    scale: 0.5,
    opacity: 0,
    duration: 0.5,
    stagger: 0.025,
    onComplete: function () {
      this.targets().forEach((item) => {
        if (item.parentNode) item.parentNode.removeChild(item);
      });
      currentlyAnimating = false;
    },
  });
}
```
Exact spec:
- **Targets**: the selector `".item"` — GSAP resolves it to **all tiles present at call time**, animating the whole current batch together.
- **Properties animated (from current → to)**: `y` `0 → 1000` (translate 1000px straight down, well off-screen), `scale` `1 → 0.5` (shrink to half), `opacity` `1 → 0` (fade out). All three run concurrently on each tile.
- **`duration: 0.5`** seconds per tile.
- **`stagger: 0.025`** — each tile starts 25 ms after the previous one, in DOM order (oldest first), so the batch cascades downward rather than dropping in unison.
- **Ease**: none is passed, so GSAP's **default `power1.out`** applies.
- **`onComplete`**: iterates `this.targets()` and removes each animated tile from the DOM, then clears `currentlyAnimating = false`. (Tiles spawned *after* this tween was created are not part of `this.targets()` and survive to the next drop.)
- **Guards**: returns early if a drop is already running (`currentlyAnimating`) or there is nothing to animate (`container.children.length === 0`), so overlapping/empty tweens never start.

### 4. The trigger — `mousemove` on the container
```js
container.addEventListener("mousemove", function (event) {
  clearTimeout(animationTimeout);
  addNewItem(event.pageX, event.pageY);
  animationTimeout = setTimeout(startAnimation, 100);
});
```
This is the whole interaction loop, and the timing is the effect:
- The listener is on **`.items`** (the fixed full-viewport layer), not `document`/`window`.
- Every move **(a)** clears the previously-scheduled idle timer, **(b)** spawns a tile at the cursor, **(c)** re-arms a **100 ms** `setTimeout(startAnimation, 100)`.
- **While the pointer keeps moving** (events < 100 ms apart), the timer is cleared and reset on every event, so `startAnimation` never fires — tiles just accumulate (capped at 20) and trail the cursor.
- **The moment the pointer pauses** for ≥ 100 ms, the pending timer finally fires → `startAnimation()` drops the whole batch. So the trail lives while you move and evaporates the instant you stop.

## Assets / images
**15 portrait images** referenced as `img1.jpg … img15.jpg`, each shown inside a **150 × 200 px (3:4) tile** with `object-fit: cover` (framing is forgiving). Cinematic / experimental / editorial mood, coherent as a set. Roles by index:
1. Minimalist lone figure on a reflective wet surface with a diagonal shaft of light, teal/cyan tones.
2. Close-up of a golden reflective astronaut helmet against a dark green backdrop.
3. Lone astronaut silhouette walking through foggy golden desert, large glowing sun behind.
4. Dark moody portrait of a woman, hands raised to her face in low light with jewelry.
5. Silhouette pressing a hand against frosted glass, warm orange backlight.
6. Moody studio portrait of a blonde woman in black against a dark background.
7. Figure in a wide decorative conical hat and futuristic sunglasses, teal/lavender tones.
8. Small golden lucky-cat figurine inside a red circle on plain white.
9. Person in a black suit, head obscured by white feathers/fabric, grey background.
10. Golden-hour city skyline silhouette under a warm orange sky.
11. Soft-lit figure with wet hair leaning to one side, pale blue tones.
12. Green-lit muscular figure sculpture amid soft bokeh light spots.
13. Still life of pink roses and green leaves in an S-shape on black.
14. Portrait of a woman with sleek dark hair in large futuristic visor sunglasses, warm brown backdrop.
15. Woman sitting on a paddleboard on calm water at dusk.

No brands or logos. If fewer than 15 real images are available, any consistent set of portrait-oriented photos works; the effect does not depend on the specific subjects.

## Behavior notes
- **Desktop / mouse only** — the whole thing is `mousemove`-driven with no touch fallback; leave it as-is (pointer-first).
- **No reduced-motion guard** in the original.
- The trail self-limits to 20 live tiles; each pause fires exactly one staggered drop that cleans itself up in `onComplete`.
- Tiles render **above** the centered headline (`z-index` 2 vs 1), so a busy trail temporarily hides the "Move your mouse to explore" text.

## Acceptance check (reproduction is faithful only if all hold)
- Full-orange (`#ffa500`) viewport with a centered, uppercase, 40px "Move your mouse / to explore" headline visible at rest (empty `.items`).
- Moving the mouse spawns 150×200 black-backed image tiles at the cursor (horizontally centered on it), cycling through 15 images and trailing the pointer, capped at ~20 on screen.
- Pausing the pointer ~100 ms triggers one `gsap.to(".item", …)` that sends the whole batch **down (`y: 1000`) while scaling to 0.5 and fading to 0**, staggered 0.025s, 0.5s each, default `power1.out` ease, then removes the tiles.
- Console is clean (zero errors); only `gsap` is imported, no plugins.

## Images

This component ships with 15 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/img-trail/img1.jpg
https://motionprompts.dev/c/img-trail/img10.jpg
https://motionprompts.dev/c/img-trail/img11.jpg
https://motionprompts.dev/c/img-trail/img12.jpg
https://motionprompts.dev/c/img-trail/img13.jpg
https://motionprompts.dev/c/img-trail/img14.jpg
… 9 more under https://motionprompts.dev/c/img-trail/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--field`, `--ink`, `--paper`, `--ink-soft`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that reaches into the page with `document.querySelector(".items")`, then keeps a `mousemove` listener alive for as long as the page is open, spawning and deleting `.item` nodes by hand outside anything React tracks. React withdraws all three of those guarantees at once, and it does it quietly — the trail keeps following the cursor, but something underneath is now doubled.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that means two `mousemove` listeners bound to the same `.items` element, each calling its own closure's `addNewItem`: every pixel of cursor movement spawns two tiles instead of one, blows through `manageItemLimit`'s cap of twenty at twice the rate, and arms two independent `animationTimeout` timers. When the pointer stops, both timers eventually fire `startAnimation`, each behind its own `currentlyAnimating` flag — so it is possible to get two overlapping `gsap.to(".item", …)` drops instead of one clean batch. The symptom is a denser, jumpier trail that drops twice, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the trail never activates — no error, nothing to debug, just a headline that never grows tiles. Delete the listener and move its entire body — the `imageIndex` / `animationTimeout` / `currentlyAnimating` state, `addNewItem`, `manageItemLimit`, `startAnimation`, and the `mousemove` binding — directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — The one `document.querySelector(".items")` assumes this component owns the document. Give the component a root `ref`, render the `.items` layer inside it, and look the container up from that ref instead of from `document`. During the StrictMode remount two `.items` elements exist for an instant; an unscoped lookup can bind the trail's listener to the copy that's on its way out.

*(3) Cleanup* — Wrap `addNewItem`, `manageItemLimit`, `startAnimation` and the `mousemove` binding in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* addNewItem, manageItemLimit, startAnimation, and the mousemove listener, unchanged */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` only undoes what GSAP itself created — tweens, triggers, and the inline styles they wrote. It does not touch either of the two things this effect adds by hand:

- **The `mousemove` listener.** `container.addEventListener("mousemove", …)` is not a GSAP call, so the context never records it. Keep the handler in a named variable and call `container.removeEventListener("mousemove", handler)` in the same cleanup that reverts the context — otherwise the stale instance from a StrictMode unmount keeps listening on a container that still exists in the DOM and keeps spawning tiles into it.
- **The pending `animationTimeout`.** This is a plain `setTimeout`, not a tween, so the context doesn't know it exists either. If the component unmounts in the roughly one-tenth-of-a-second window between the last `mousemove` and the idle fire, the scheduled `startAnimation` runs after `ctx.revert()` has already run, against a listener that's gone and a context that no longer tracks anything it creates. Capture the timer id in the same scope the cleanup closes over and call `clearTimeout` on it there, in addition to the `clearTimeout` `addNewItem`'s handler already does on every move.

Two more things follow from how this specific effect is built, not from the general React rules above:

**Don't promote `imageIndex`, `animationTimeout`, or `currentlyAnimating` to `useState`.** All three are read and written exclusively by functions declared inside this same effect — nothing in the render path or JSX ever needs their current value. A `useState` setter firing on every `mousemove` would re-render the component at cursor-tracking frequency for no visual benefit, since the tiles themselves are never rendered by React (see below); a plain variable closed over by the effect's functions, or a `ref` if you split those functions out, does the job with none of that cost.

**Don't lift the `.item` tiles into React state and render them with `.map()`.** `addNewItem` and `manageItemLimit`'s direct `createElement` / `appendChild` / `removeChild` calls, and `startAnimation`'s `onComplete` walking `this.targets()` to remove the exact nodes GSAP just animated, are the reason this runs as fast as a raw `mousemove` handler needs to. Modeling the trail as an array of tile objects and letting React reconcile them on every pointer event reintroduces the render churn this design avoids, and it races GSAP: a re-render can swap out the DOM node `this.targets()` is mid-tween on before `onComplete` gets to remove it.

**`gsap.to(".item", …)` is a live class selector, not a captured reference — this is exactly what `gsap.context`'s selector scoping is for.** Inside a context, GSAP resolves string selectors against the context's own root instead of the whole document, so `.item` only ever matches tiles this component's own `.items` container holds. That is not incidental cleanup bookkeeping here: without it, a second instance of this component elsewhere on the page — or the two copies that briefly coexist during a StrictMode remount — would have their `gsap.to(".item", …)` calls sweep up each other's tiles into a single shared drop.
