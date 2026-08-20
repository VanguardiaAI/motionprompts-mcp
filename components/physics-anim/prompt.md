# Interactive Divs with Physics — floating grayscale cards that scatter from the cursor

## Goal

Build a full-screen, black, zero-gravity playground where **twelve grayscale polaroid-style image cards drift over the whole viewport**. Each card is a real HTML `<div>` whose position and rotation are driven, every frame, by a Matter.js rigid body living in a **gravity-free** physics world. A big centered word sits behind them. The star effect: **moving the mouse near a card fires a random impulse into it**, so nearby cards shoot away, slowly coast to a stop under air friction, gently bounce off the invisible viewport walls, and keep floating. It reads like a slow-motion swarm of photo prints you can bat around with the cursor.

## Tech

Vanilla HTML/CSS/JS. Two libraries with **two different loading mechanisms** (match this exactly — the sketch depends on p5 running in "global mode"):

1. **p5.js v1.4.0 as a classic `<script>` in `<head>`, served from your own origin** (NOT an npm import). This runs p5 in global mode: p5 auto-initializes on window load and attaches globals like `createCanvas`, `random`, `dist`, `background`, `width`, `height`, `mouseX`, `mouseY`, and calls your global `setup()` / `draw()` / `mouseMoved()` functions.
   ```html
   <script src="/vendor/p5-1.4.0.js"></script>
   ```
   Get the file with `npm i p5@1.4.0` and copy `node_modules/p5/lib/p5.js` into your public
   directory. It must stay a plain `<script>` — importing it as a module kills global mode.
2. **matter-js as an npm ESM import** in your module script:
   ```js
   import Matter from "matter-js";
   const { Engine, World, Bodies, Body } = Matter;
   ```

No GSAP, no ScrollTrigger, no Lenis, no framework. The page does not scroll.

**Global-mode bridge (critical):** because your code is an ES module, `setup`/`draw`/`mouseMoved` are module-scoped and p5 can't see them. At the very bottom of the module, expose them on `window`:
```js
window.setup = setup;
window.draw = draw;
window.mouseMoved = mouseMoved;
```

## Layout / HTML

Minimal. p5 injects its own `<canvas>` and the JS creates the card divs at runtime.

```html
<body>
  <div class="header"><h1>Motionprompts</h1></div>
  <script type="module" src="./script.js"></script>
</body>
```

- One `.header` with an `<h1>` (fictional brand text `Motionprompts`), absolutely centered — it sits *behind* the floating cards (the p5 canvas and the `.item` divs are appended to `<body>` after it and paint on top).
- No card markup in HTML: the twelve `<div class="item">` elements (each containing one `<img>`) are created in JS and appended to `document.body`.

## Styling

Reset and full-bleed stage:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `html, body { width:100vw; height:100vh; overflow:hidden; background:#000; }` — the page is exactly one viewport, no scroll, pure black behind everything.

Header (centered background word):
- `.header { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }`
- `.header h1 { font-family:"Circular Std", sans-serif; font-size:12vw; font-weight:500; letter-spacing:-0.05em; line-height:175%; color:#fff; text-align:center; }` — a very large, tight, geometric-sans word in white. Any clean geometric sans works as fallback.

The cards (`.item` — a white polaroid frame):
- `.item { position:absolute; width:200px; height:225px; padding:0.5em 0.5em 4em 0.5em; overflow:hidden; background:#fff; }` — a **200×225px white card** with an asymmetric pad (thin on top/sides, `4em` thick at the **bottom**) so the photo sits in the upper area and leaves a polaroid-style white chin.
- `.item img { width:100%; height:100%; object-fit:cover; filter:grayscale(100%); }` — the photo fills the padded content box, cropped, and rendered **fully grayscale**.

JS sets each card's inline `left`, `top`, and `transform: rotate(<rad>)` every frame (see below).

## Physics + render effect (be exhaustive — this is the whole component)

### Engine & world

```js
let engine = Engine.create();
engine.world.gravity.y = 0;   // ZERO gravity — cards float, they never fall
```

Keep module-level state: `engine`, `items = []`, `lastMouseX = -1`, `lastMouseY = -1`.

### `setup()` (runs once)

1. `createCanvas(window.innerWidth, window.innerHeight);` — a p5 canvas the full size of the window.
2. `engine = Engine.create();` then `engine.world.gravity.y = 0;`.
3. `addBoundaries();` (below).
4. Spawn **12 cards** in a loop `for (let i = 0; i < 12; i++)`:
   - `x = random(100, width - 100)`, `y = random(100, height - 100)` — random start inside a 100px inset.
   - `items.push(new Item(x, y, "img" + (i + 1) + ".jpg"));` — image sources `img1.jpg … img12.jpg`.

### `addBoundaries()` — four invisible static walls

Four static rectangles of `thickness = 50`, positioned so their inner edge lines up with the viewport edges (bodies sit just *outside* the visible area). Add all four with `World.add(engine.world, [...])`:
- **Top:** `Bodies.rectangle(width/2, -thickness/2, width, thickness, { isStatic:true })`
- **Bottom:** `Bodies.rectangle(width/2, height + thickness/2, width, thickness, { isStatic:true })`
- **Left:** `Bodies.rectangle(-thickness/2, height/2, thickness, height, { isStatic:true })`
- **Right:** `Bodies.rectangle(width + thickness/2, height/2, thickness, height, { isStatic:true })`

These keep the cards contained; cards bounce off them (see restitution).

### `Item` class

**Constructor `(x, y, imagePath)`:**
- Physics body options: `{ frictionAir: 0.075, restitution: 0.25, density: 0.002, angle: Math.random() * Math.PI * 2 }`.
  - `frictionAir: 0.075` — heavy air drag, so impulses decay to a stop within ~1s (the slow, floaty coast).
  - `restitution: 0.25` — soft, low-energy bounces off walls and each other.
  - `density: 0.002` — light bodies (mass = density × area = 0.002 × 100 × 200 = 40) so the impulse below produces a big, visible kick.
  - `angle` — each card starts at a **random rotation** (0–2π).
- Body: `this.body = Bodies.rectangle(x, y, 100, 200, options);` — a **100×200 rectangle body** (note: smaller than the 200×225 visual card; this is intentional/original). `World.add(engine.world, this.body);`.
- DOM: create `<div class="item">`, position it (see offset math), create an `<img>` with `src = imagePath`, append the img to the div, append the div to `document.body`.

**Position offset (used in constructor and every frame in `update()`):**
```js
this.div.style.left = (this.body.position.x - 50) + "px";
this.div.style.top  = (this.body.position.y - 100) + "px";
```
The div's top-left is offset **−50px x / −100px y** from the body center (half of the 100×200 *body* size, not the card size — keep these exact numbers).

**`update()` (called every frame):**
```js
this.div.style.left = (this.body.position.x - 50) + "px";
this.div.style.top  = (this.body.position.y - 100) + "px";
this.div.style.transform = "rotate(" + this.body.angle + "rad)";
```
So each card's screen position and rotation mirror its physics body exactly, in radians.

### `draw()` — the p5 render loop (~60fps)

```js
function draw() {
  background("black");        // repaint canvas black each frame
  Engine.update(engine);      // step the physics simulation one tick
  items.forEach((item) => item.update());  // sync every card div to its body
}
```
The canvas itself only ever shows solid black; all the visible motion is the DOM `.item` divs being repositioned on top of it. There is no `noLoop()` — the loop runs continuously so bodies keep integrating (drifting, decaying, settling) even without input.

### `mouseMoved()` — the interaction (the star moment)

Throttle by how far the mouse has moved, then push nearby cards:
```js
function mouseMoved() {
  if (dist(mouseX, mouseY, lastMouseX, lastMouseY) > 10) {
    lastMouseX = mouseX;
    items.forEach((item) => {
      if (dist(mouseX, mouseY, item.body.position.x, item.body.position.y) < 150) {
        const forceMagnitude = 3;
        Body.applyForce(
          item.body,
          { x: item.body.position.x, y: item.body.position.y },   // apply at the body's own center → pure linear push, no torque
          { x: random(-forceMagnitude, forceMagnitude),
            y: random(-forceMagnitude, forceMagnitude) }           // random 2D impulse in [-3, 3] on each axis
        );
      }
    });
  }
}
```
Behavior to reproduce:
- Only reacts once the cursor has traveled **>10px** since the last sampled point (`lastMouseX/lastMouseY` seeded at `-1`, so it fires as soon as the mouse enters the page).
- For **every card whose body center is within 150px of the cursor**, apply a **random force vector**, each component uniformly in `[-3, 3]`, at the card's own center of mass (so it's a straight shove, no spin from the force — any rotation you see is incidental collision response).
- With `frictionAir 0.075` the shoved cards fan out fast, then glide to rest; `restitution 0.25` gives them a gentle bounce if they reach a wall or clip a neighbor.

## Assets / images

**12 editorial photographs**, `img1.jpg … img12.jpg`, one per card. Each is displayed cropped (`object-fit:cover`) into the polaroid's ~184×153px content window and forced to **grayscale** by CSS, so any source palette is fine. Aim for a cohesive, moody, cinematic/editorial set — e.g. atmospheric portraits, sci-fi/astronaut scenes, minimalist product shots, monochrome cityscapes — anything with strong tonal contrast reads well once desaturated. No logos or real brand marks. (If fewer than 12 images are available, repeat them in order.)

## Behavior notes

- **Desktop / pointer-driven, page-level component.** The whole viewport is the stage; nothing scrolls (`overflow:hidden`, page is exactly `100vw × 100vh`). Not mobile-safe (relies on `mousemove`).
- **Continuous simulation, no autoplay animation:** cards start at random positions and rotations and simply sit still (zero gravity, no initial velocity) until the cursor disturbs them; then they scatter and re-settle. Cards can overlap and gently jostle via collisions.
- Canvas is sized to the window at load; there is no resize handler in the original (bodies/walls keep their initial dimensions if the window is resized).
- No reduced-motion handling and no console errors expected. Heavy-ish (12 DOM nodes synced to a 60fps physics loop) but smooth on desktop.

## Images

This component ships with 12 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/physics-anim/img1.jpg
https://motionprompts.dev/c/physics-anim/img10.jpg
https://motionprompts.dev/c/physics-anim/img11.jpg
https://motionprompts.dev/c/physics-anim/img12.jpg
https://motionprompts.dev/c/physics-anim/img2.jpg
https://motionprompts.dev/c/physics-anim/img3.jpg
… 6 more under https://motionprompts.dev/c/physics-anim/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--card`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body::before`, `body::after`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document that owns `window` and `document.body` outright: a p5 sketch running in global mode, so `setup`, `draw` and `mouseMoved` live as literal properties of `window` and p5's own load-time bootstrap decides when to call them; a Matter.js engine that nothing else on the page is stepping; and twelve `<div class="item">` elements appended straight onto `document.body` because nothing here is scoped to anything narrower. React withdraws all three assumptions quietly — the cards still float and scatter under the cursor, and then a second copy of the whole rig shows up without a single visible error.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. For this component that is not cosmetic doubling: a naive port gets two live `Engine.create()` worlds, each with its own four boundary walls and its own twelve rectangle bodies, each stepped once per frame by its own `Engine.update()` call inside its own `draw()`, and both writing to the same three names — `window.setup`, `window.draw`, `window.mouseMoved` — because p5's global mode has no notion of "which instance" a function call belongs to. The visible symptom is two overlapping sets of drifting cards, a cursor push that seems to fire from the wrong sketch, or twenty-four bodies integrating every frame instead of twelve — and none of it reproduces in a production build, because React only double-invokes effects in development.

*(1) The entry point* — The script's own bootstrap checks `document.readyState` before subscribing to `DOMContentLoaded` (`readyState === "loading" ? addEventListener(...) : boot()`), which is the guarded form: it exists so the script survives being loaded late into a plain HTML document. Under React that guard is dead weight — `useEffect` already runs after the DOM is committed, so `document.readyState` inside it is always `"complete"`. Delete the guard, the `DOMContentLoaded` listener and the `boot` wrapper entirely, and move the body of `setup()` — creating the `Engine`, zeroing `engine.world.gravity.y`, calling `addBoundaries()`, spawning the twelve `Item` instances — directly into a `useEffect` with an empty dependency array. Keep `engine`, `items`, `lastMouseX` and `lastMouseY` as refs rather than component state: `draw()` and `mouseMoved()` mutate them every frame, they are not values the component re-renders on.

*(2) Element lookups* — Two things here write to `document.body` unscoped: every `Item` constructor does `document.body.appendChild(this.div)`, and p5's global-mode `createCanvas` attaches its own `<canvas>` wherever global mode decides to put it (wrapped in a `<main>` it fabricates if the page does not already have one). Give the component a root `ref`, render an empty container element for the cards and the canvas to live in, and append every `Item`'s `div` to that container instead of `document.body`. This matters more than usual here because a StrictMode remount briefly has two full sets of twelve cards wanting to exist at once — an `appendChild` on `document.body` cannot tell the outgoing copy from the incoming one, so both land in the same place and both are visible until the first is torn down.

*(3) Cleanup* — Physics-anim runs two things that keep going long after the component that started them is gone, plus a bridge that only global mode makes necessary in the first place.

- **Matter.js** — `World.clear(engine.world, false)` then `Engine.clear(engine)` in the cleanup. The four boundary walls, the twelve rectangle bodies and Matter's broadphase state do not free themselves just because nothing calls `Engine.update()` on them anymore; they stay referenced by the closure `draw()` captured, which is the kind of accumulation that shows up as a slow memory climb across route visits rather than a crash on any single one.
- **p5** — do not chase a `requestAnimationFrame` handle for the render loop; p5 owns and cancels that internally, but only once you call `.remove()` on the instance. Without it, `draw()` keeps running on p5's own schedule, keeps calling `Engine.update()` on a world nothing else references, and keeps integrating forever. Switch the sketch from global mode to instance mode — `new p5((p) => { p.setup = …; p.draw = …; p.mouseMoved = …; }, rootRef.current)` — so `.remove()` is a call on an object you hold a reference to, not a lookup through `window.p5.instance`.
- **Drop the global-mode bridge.** The only reason this component writes `window.setup = setup; window.draw = draw; window.mouseMoved = mouseMoved;` is that global mode has no other way to find your functions, and the corollary is that a second mount has to overwrite the first mount's names to be found itself. Instance mode never touches `window`, so there is nothing to save, restore, or race over — no bookkeeping needed to tell whether a name you are about to clear still points at your own function or already belongs to the next mount.
- **The card divs** — once `Item` appends into the container ref instead of `document.body` per (2), removing that ref's children (or simply letting React unmount it) takes all twelve `.item` divs with it; there is nothing left to walk and remove by hand.
