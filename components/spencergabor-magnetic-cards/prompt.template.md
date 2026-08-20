---
slug: spencergabor-magnetic-cards
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Magnetic Cards — Cursor-Reactive Physics Fan

## Goal
Build a single full-viewport dark section holding a **fanned stack of four square image cards centered on screen**. The star effect: the cards react **magnetically to cursor velocity**. When the mouse moves quickly near the stack, the cards nearest the pointer are shoved and tilted in the direction of the swipe; slower/farther motion barely nudges them. Neighboring cards get dragged along a little, and when the cursor stops or leaves, every card springs back to its resting fan layout with an elastic, slightly-bouncy settle. There is **no GSAP tween or timeline** — the whole thing is a hand-rolled spring-and-friction physics integrator run every frame by `gsap.ticker`, with `gsap.set` writing the transforms.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm) only** — **no GSAP plugins, no Lenis, no Three.js, no smooth scroll**. GSAP is used purely for `gsap.set()` (write transforms) and `gsap.ticker.add()` (the per-frame loop). Ship one `index.html` (`<link rel="stylesheet" href="./styles.css">` and `<script type="module" src="./script.js">`), one `styles.css`, one ES-module `script.js`. Must run in a fresh Vite + npm project.

## Layout / HTML
```html
<section class="spotlight">
  <div class="cards">
    <div class="card"><img src="<card image 1>" alt="" /></div>
    <div class="card"><img src="<card image 2>" alt="" /></div>
    <div class="card"><img src="<card image 3>" alt="" /></div>
    <div class="card"><img src="<card image 4>" alt="" /></div>
  </div>
</section>
```
- One `.spotlight` section is the interaction surface (mouse events bind here).
- One `.cards` wrapper is the geometric center reference — it is centered in the section and every card is positioned **relative to this wrapper's center** (not the viewport).
- Exactly **four `.card` elements**, each wrapping one `<img>`. Card order in the DOM (1→4) is left→right in the fan and also determines `zIndex` (later cards render on top).

## Styling
- Reset: `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `.spotlight { position:relative; width:100%; height:100svh; background-color:#141414; overflow:hidden; }` — near-black background; **`overflow:hidden` matters** so cards that get flung outward are clipped by the section.
- `.cards { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }` — a zero-size anchor pinned to the exact center of the section. (Note: JS overwrites the cards' own transforms via `gsap.set`, but this wrapper keeps its centering transform.)
- `.card { position:absolute; width:250px; height:250px; border-radius:1rem; overflow:hidden; }` — **fixed 250×250 (1:1) squares**, rounded corners, image clipped to the rounded box. All four cards are absolutely positioned and stacked at the wrapper origin, then offset by JS.

No web fonts, no text — the section is purely the four image cards on the dark field.

## GSAP effect (be exhaustive)

### Imports & element handles
```js
import gsap from "gsap";

const cards = document.querySelectorAll(".card");
const spotlight = document.querySelector(".spotlight");
const cardsContainer = document.querySelector(".cards");
```

### Tuning constants (exact values)
```js
const PROXIMITY_RADIUS  = 500;   // px — cursor must be within this of a card to push it
const PUSH_FORCE        = 10;    // multiplier on cursor velocity → push strength
const TILT_AMOUNT       = 0.1;   // how much horizontal push force converts to rotation
const NEIGHBOR_INFLUENCE= 0.2;   // per-step falloff of force bleeding to neighbor cards
const SPRING_STIFFNESS  = 0.05;  // spring constant pulling a card back toward its target
const BOUNCE_FRICTION   = 0.85;  // velocity retained each frame (damping)
const CURSOR_SMOOTHING  = 0.75;  // low-pass on cursor velocity (0.75 old / 0.25 new)
```

### Resting fan layout (per card, index 0→3)
```js
const layout = {
  rotation: [5, -5, 7.5, -10],   // degrees
  x:        [-275, -100, 100, 275], // px offset from the .cards center
  y:        [10, -10, 25, -10],     // px offset from the .cards center
};
```
So at rest the four squares fan across the center: card 0 far-left rotated +5°, card 1 left rotated −5°, card 2 right rotated +7.5°, card 3 far-right rotated −10°, with small vertical jitter. They overlap because each is 250px wide but only ~175–200px apart.

### Cursor state & per-card physics state
```js
const cursor = { x: 0, y: 0, vx: 0, vy: 0 };
let prevCursorX = 0;
let prevCursorY = 0;
```
Initialize each card with `gsap.set` and build a physics object:
```js
const cardPhysics = [...cards].map((el, i) => {
  gsap.set(el, {
    x: layout.x[i],
    y: layout.y[i],
    rotation: layout.rotation[i],
    zIndex: i,          // DOM order stacking
    xPercent: -50,      // center each card on the .cards origin
    yPercent: -50,
  });
  return {
    el,
    restX: layout.x[i], restY: layout.y[i], restR: layout.rotation[i], // targets
    x: layout.x[i], y: layout.y[i], r: layout.rotation[i],             // current
    vx: 0, vy: 0, vr: 0,                                               // velocities
  };
});
```
Note `xPercent:-50, yPercent:-50` — cards are centered on the wrapper origin, then translated by the layout `x`/`y`.

### Cursor velocity tracking (`mousemove` on `.spotlight`)
On every `mousemove`, compute a **smoothed cursor velocity** with an exponential low-pass filter, then store the raw position:
```js
spotlight.addEventListener("mousemove", (e) => {
  cursor.vx = cursor.vx * CURSOR_SMOOTHING + (e.clientX - prevCursorX) * (1 - CURSOR_SMOOTHING);
  cursor.vy = cursor.vy * CURSOR_SMOOTHING + (e.clientY - prevCursorY) * (1 - CURSOR_SMOOTHING);
  prevCursorX = cursor.x = e.clientX;
  prevCursorY = cursor.y = e.clientY;
});
```
So `vx/vy` are 75% previous velocity + 25% of the latest per-event pixel delta — a heavily smoothed, momentum-ish swipe velocity in screen pixels.

On `mouseleave`, zero the velocity so the push force decays to nothing and the cards spring home:
```js
spotlight.addEventListener("mouseleave", () => { cursor.vx = cursor.vy = 0; });
```

### Per-card push force (`calculatePushForce(card)`)
For each card, compute the force the cursor exerts this frame:
1. `speed = Math.sqrt(cursor.vx**2 + cursor.vy**2)`. **If `speed < 0.5`, return `{fx:0, fy:0}`** — a still (or barely moving) cursor exerts no force, no matter how close.
2. Get the live center of the stack from the DOM: `rect = cardsContainer.getBoundingClientRect()`, then the card's resting center in screen space is `cx = rect.left + rect.width/2 + card.restX`, `cy = rect.top + rect.height/2 + card.restY`.
3. `dist = Math.sqrt((cursor.x - cx)**2 + (cursor.y - cy)**2)`. **If `dist > PROXIMITY_RADIUS` (500px), return `{fx:0, fy:0}`.**
4. Proximity weight with a **cubic falloff**: `weight = (1 - dist / PROXIMITY_RADIUS) ** 3` — 1 at the card's center, easing sharply toward 0 at 500px.
5. Force = smoothed cursor velocity × push constant × weight:
   ```js
   return { fx: cursor.vx * PUSH_FORCE * weight, fy: cursor.vy * PUSH_FORCE * weight };
   ```
The push is **in the direction the cursor is moving** (velocity vector), scaled by how fast and how close.

### Neighbor influence (`applyNeighborInfluence(forces, index)`)
Each card also feels a fraction of every *other* card's force, so a shove propagates through the fan:
```js
function applyNeighborInfluence(forces, index) {
  let fx = forces[index].fx;
  let fy = forces[index].fy;
  forces.forEach((f, j) => {
    if (j === index) return;
    const falloff = NEIGHBOR_INFLUENCE ** Math.abs(j - index); // 0.2^distance
    fx += f.fx * falloff;
    fy += f.fy * falloff * 0.6;   // vertical bleed is dampened to 60%
  });
  return { fx, fy };
}
```
`0.2 ** |j-index|` means an adjacent card contributes 20% of its force, a two-away card 4%, etc. Vertical influence is further multiplied by 0.6 so neighbors drag more horizontally than vertically.

### The per-frame integrator (`gsap.ticker.add`)
The whole simulation runs inside one ticker callback (≈60fps), **not a tween**:
```js
gsap.ticker.add(() => {
  const forces = cardPhysics.map(calculatePushForce);   // raw force per card this frame

  cardPhysics.forEach((card, i) => {
    const { fx, fy } = applyNeighborInfluence(forces, i); // + neighbor bleed

    // Damped spring toward (rest + force). Velocity is integrated then scaled by friction.
    card.vx = (card.vx + (card.restX + fx - card.x) * SPRING_STIFFNESS) * BOUNCE_FRICTION;
    card.vy = (card.vy + (card.restY + fy - card.y) * SPRING_STIFFNESS) * BOUNCE_FRICTION;
    card.vr = (card.vr + (card.restR + fx * TILT_AMOUNT - card.r) * SPRING_STIFFNESS) * BOUNCE_FRICTION;

    card.x += card.vx;
    card.y += card.vy;
    card.r += card.vr;

    gsap.set(card.el, { x: card.x, y: card.y, rotation: card.r });
  });
});
```
Read the spring line carefully — it is the heart of the effect:
- The **target** for each card is `restX + fx` (its home position displaced by the current push). Rotation targets `restR + fx * TILT_AMOUNT`, so a **horizontal** push also tilts the card (leftward shove rotates one way, rightward the other), by 10% of the horizontal force.
- `(target - current) * SPRING_STIFFNESS` (0.05) is the spring pull added to the existing velocity → an under-damped spring that overshoots and oscillates.
- Multiplying the whole velocity by `BOUNCE_FRICTION` (0.85) each frame bleeds off 15% per frame, so oscillations decay and the card settles — giving the springy, slightly-bouncy return. Higher friction toward 1 = looser/bouncier; this 0.85 gives a quick but visibly elastic settle.
- Because the force term (`fx`,`fy`) drops to 0 the instant the cursor slows below `speed 0.5` / leaves / moves beyond 500px, the target collapses back to `rest*`, and the same spring carries every card home.

### Feel summary
- Fast swipe **through** the stack: nearby cards fling in the swipe direction and tilt, neighbors trail, then all bounce back.
- Slow drift: almost no motion (velocity < 0.5 or cubic falloff kills it).
- Cursor leaves the section: velocity zeroed, cards spring home.
- No easing functions, no durations, no timeline — spring stiffness (0.05) and friction (0.85) fully define the motion, integrated every ticker frame.

## Assets / images
**Four square (1:1) card images**, each filling a 250×250 rounded box (`object-fit:cover`). Use **flat, graphic, single-figure character illustrations** in a muted vector/editorial poster style — one hooded or costumed figure per card, waist-up or full-body, centered on a flat, softly-textured single-color background, with subtle grain and simple shading (no photos, no text, no client or third-party branding). The four are distinct, earthy-toned action characters, each on its own muted field:
- **Card 1 (leftmost):** a hooded figure in an olive-green tunic gripping a long-handled scythe, on a pale warm grey-green (sage/tan) background.
- **Card 2:** a man in a tan trench coat, white shirt, dark tie and black glasses, shown in profile pointing to the right, on a desaturated dark teal/slate-green background.
- **Card 3:** a black-clad ninja crouching with a dagger, on a muted steel-blue background.
- **Card 4 (rightmost):** a grey-hooded, cloaked archer drawing a bow with arrows on the back, on a warm off-white/cream background.

Card 1 is the leftmost in the fan, card 4 the rightmost. Any four distinct, high-contrast single-figure illustrations of this kind read well — the specific characters and muted backgrounds are interchangeable so long as each card is one bold figure on a flat, low-saturation field.

## Behavior notes
- **Desktop / pointer-driven only** — the entire effect is `mousemove` velocity on the `.spotlight` section; there is no touch, click, scroll, or load animation, and no reduced-motion branch (the ticker always runs).
- **Live-anchored math**: the stack center is re-read from `getBoundingClientRect()` every frame, so resizing the window keeps the physics correctly centered without extra code.
- The cards are a fixed 250px fan; the `x`/`y`/`rotation` layout arrays and the seven tuning constants define the exact look and response — keep them as given.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/spencergabor-magnetic-cards/card-img-1.jpg
https://motionprompts.dev/c/spencergabor-magnetic-cards/card-img-2.jpg
https://motionprompts.dev/c/spencergabor-magnetic-cards/card-img-3.jpg
https://motionprompts.dev/c/spencergabor-magnetic-cards/card-img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-2`, `--bone`, `--muted`, `--lede`, `--ember`, `--ember-soft`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, calling `boot()` straight away if the document is already past `"loading"`. That guard is dead weight in React, where `useEffect` already runs after the DOM is committed — but the branch above it matters more: `if (window.MP && window.MP.register) { window.MP.register({ defaults: DEFAULTS, mount }); }` wires this file into this catalogue's own live-knobs editor, which has no equivalent in a plain React host. Drop that branch along with the `readyState` guard and its listener. What is left, `mount(config)` and the function it returns, is already an exact setup/teardown pair — this component was built to be re-mounted on demand in the first place, since the editor calls `mount()` again with a new `config` every time a knob moves, and the `destroy()` it hands back has to leave nothing behind for that to keep working. That is the same guarantee StrictMode's double-invoke demands, so the port is close to mechanical: call `mount(Object.assign({}, DEFAULTS))` — the same call `boot()` already makes — inside a `useEffect` with an empty dependency array, and return the function `mount` gives back as the effect's cleanup. Leave `lastPointer` exactly where it sits, at module scope outside `mount()`: it exists so a fresh mount inherits the last real pointer position instead of jumping from `(0, 0)`, and because it is plain module state rather than anything React owns, it already survives a StrictMode remount unchanged — moving it into a ref or into the effect body would only reintroduce the jump the original comment is guarding against.

*(2) Element lookups* — `mount()` resolves three things off `document`: `document.querySelectorAll(".card")`, `document.querySelector(".spotlight")`, and `document.querySelector(".cards")`. The last two are read more than once — `spotlight` is where the `mousemove`/`mouseleave` listeners attach, and `cardsContainer.getBoundingClientRect()` inside `calculatePushForce` runs again on every animation frame — so an unscoped match is not a one-time risk, it is a per-frame one. Put the root `ref` on `.spotlight` itself (it is already the outermost element this component renders) and pass it into `mount`, resolving `.cards` and the four `.card` nodes from it instead of from `document`:

```jsx
function mount(config, root) {
  const cards = root.querySelectorAll(".card");
  const spotlight = root; // `.spotlight` is the root itself, already in hand
  const cardsContainer = root.querySelector(".cards");
  // ...the rest of mount(), unchanged, now reading from these three instead of from `document`
}
```

For the instant both copies of the subtree exist side by side during a StrictMode remount, an unscoped `document.querySelector(".cards")` resolves to whichever `.cards` happens to come first in the DOM — so the second mount's per-frame math would read a bounding box belonging to the copy that is already on its way out.

*(3) Cleanup* — This component has no tween and no `ScrollTrigger` to wrap: every visible change is a `gsap.set()` call, four of them made once inside `mount()` and one more per card issued every frame from `gsap.ticker.add(tick)`. A `gsap.context` only records what runs during its own synchronous setup pass, so wrapping `mount()`'s body in one would capture those four initial calls and nothing the ticker does afterward — reaching for `gsap.context` here would look like coverage without being any. `destroy()` already does the real work, by hand, completely: `gsap.ticker.remove(tick)` stops the per-frame integrator (a ticker subscription is never something a context can revert, tracked or not); the two `removeEventListener` calls drop `onMouseMove`/`onMouseLeave` from `.spotlight`, plain DOM listeners that sit outside anything GSAP tracks either way; `gsap.killTweensOf(nodes)` is belt-and-braces, since every write here is an instantaneous `gsap.set()` rather than a running tween with anything left in flight to kill; and `gsap.set(nodes, { clearProps: "x,y,rotation,xPercent,yPercent,zIndex" })` erases exactly the six inline properties `mount()` and the ticker ever wrote. That list is explicit on purpose, not `clearProps: "all"` — a future change that gives `.card` its own inline styling (a hover outline, say) would survive a cleanup that only ever claims what it put there itself. Call `mount` inside the effect and return `destroy` directly as the cleanup; there is nothing left for a `gsap.context` to add on top:

```jsx
useEffect(() => {
  return mount(Object.assign({}, DEFAULTS), rootRef.current);
}, []);
```

Skip this and the StrictMode remount leaves two `tick` callbacks alive on `gsap.ticker` at once — each with its own `onMouseMove` listener computing an equivalent velocity from the same real mouse events, each running its own spring simulation, and both calling `gsap.set` on the same four `.card` elements every single frame. The visible result is not a clean doubled speed, it is the fan fighting itself: two independent integrators racing to write the same `x`/`y`/`rotation` on every tick. Outside of StrictMode, the same gap is a plain leak — navigate away without the returned cleanup running and both listeners and the ticker subscription keep computing forever, for the life of the page.
