# Fluid Particle Simulation Hero (falling shapes that pile up like a liquid)

## Goal
Build a full-screen contact/CTA hero on a saturated electric-blue background, with a centered white
headline floating over it, and — painted across the whole viewport behind the text — a **p5.js
particle physics simulation**: ~250 small white shapes (triangles, squares, circles) that spawn in a
loose grid near the top, **fall under gravity, collide, and pile up at the bottom with soft,
fluid-like collision resolution** (a spatial-grid neighbor solver that pushes overlapping particles
apart and blends their velocities so the heap behaves like a settling liquid rather than rigid
bodies). **Pressing and dragging the mouse shoves and swirls nearby particles**, injecting velocity
and spin along the drag. The star of this piece is the per-frame particle solver, not any DOM
animation — there is **no GSAP** here.

## Tech
- Vanilla HTML / CSS / JS. The page can be served by Vite, but the physics library is **not** an npm
  dependency.
- **`p5.js` version 1.4.0, loaded as a classic `<script>` in `<head>`** (not an ES import), served
  from your own origin: `<script src="/vendor/p5-1.4.0.js"></script>`. Get the file with
  `npm i p5@1.4.0` and copy `node_modules/p5/lib/p5.js` into your public directory — it stays a
  plain `<script>`, never an `import`, or global mode does not happen. The sketch runs
  in p5 **global mode** and uses the p5 globals (`createVector`, `createCanvas`, `random`, `map`,
  `dist`, `lerp`, `color`, `width`, `height`, `mouseX`/`mouseY`, `mouseIsPressed`, `p5.Vector`,
  `TWO_PI`, `pow`, `abs`, `floor`, `ceil`, `triangle`, `rect`, `circle`, …).
- The sketch itself lives in `./script.js` loaded as `<script type="module" src="./script.js">`.
  Because it is an ES module, the p5 entry points are module-scoped, so at the **bottom of the file
  you must explicitly bind them to `window`** so p5's global-mode auto-init (fired on window load) can
  find them: `window.setup = setup; window.draw = draw; window.windowResized = windowResized;`.
- **No GSAP, no ScrollTrigger, no Lenis, no Three.js.** All motion is p5's `draw()` loop integrating
  the physics every frame. Do not reach for any animation library.

## Layout / HTML
Minimal. A single overlay `.header` block; p5 injects the full-window `<canvas>` into `<body>` itself.

```html
<body>
  <div class="header">
    <p>Is your big idea ready to go wild?</p>
    <h1>Let's work <br /> together!</h1>
    <button>Let's talk</button>
  </div>
  <script type="module" src="./script.js"></script>
</body>
```

The p5 canvas is created at `windowWidth × windowHeight` and sits behind the header (which is
`z-index: 2`). Both the canvas and the CSS `body` share the exact same blue so the page reads as one
continuous field.

## Styling
- **Palette:** page + canvas background `#1a2ffb` (electric cobalt blue). All particles are pure
  white `rgb(255,255,255)`. All text white `#fff`; the button is a white pill.
- **Reset:** `* { margin:0; padding:0; box-sizing:border-box; }`.
- `body` — `width:100%; height:100%; font-family:"Aeonik"` (any clean geometric grotesque / system
  sans is fine as fallback); `background-color:#1a2ffb`; `display:flex; justify-content:center;
  align-items:center;`.
- `.header` — `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  display:flex; flex-direction:column; align-items:center; user-select:none; z-index:2;`.
- `.header p` — white, `text-transform:uppercase; font-weight:400; margin-bottom:1.5em;`.
- `.header h1` — white, `text-align:center; font-size:7.5vw; font-weight:400; line-height:100%;
  margin-bottom:0.75em;` (big but light-weight display text, broken into two lines via `<br>`).
- `button` — `border:none; outline:none; padding:1.5em 3em; text-transform:uppercase;
  font-weight:500; background-color:#fff; border-radius:2em;` (white rounded pill).

## The star effect — p5.js particle physics (be exhaustive)
Everything below is a direct port of the sketch; reproduce the constants, formulas, and per-frame
order **exactly**.

### Global config (module scope)
```js
let particles = [];
const particleCount = 250;
const particleSize  = 12;
const spacing       = particleSize * 12;   // 144 — interaction radius AND grid/spawn pitch
let gravity;                                // set in setup()
let deltaTime = 1 / 60;                      // recomputed each frame
let mousePrevX = 0, mousePrevY = 0;          // previous-frame mouse, for drag velocity
```

### `setup()`
- `createCanvas(windowWidth, windowHeight); frameRate(60);`
- `gravity = createVector(0, 2.2);` (downward).
- `background("#1a2ffb");`
- Spawn the particles in a centered grid near the top:
  - `availableWidth = width * 0.95;`
  - `cols = floor(availableWidth / spacing);`
  - `startX = (width - cols * spacing) * 0.5;`  `startY = height * 0.05;`
  - Fill row by row: place `particleCount` particles, `cols` per row, at
    `x = startX + col*spacing + random(-5,5)`, `y = startY + row*spacing + random(-5,5)` (small jitter
    so the grid isn't perfectly rigid), incrementing `row` after each full row.

### `Particle` constructor `(x, y)`
```js
this.pos          = createVector(x, y);
this.vel          = createVector(random(-20, 20), random(-20, 20)); // small random launch
this.acc          = createVector(0, 0);
this.color        = color(255, 255, 255);   // white
this.lastPos      = createVector(x, y);      // for render smoothing
this.densityFactor= 0;                        // rebuilt every frame by interact()
this.rotation     = random(TWO_PI);
this.rotationVel  = random(-0.1, 0.1);
this.shapeType    = random(["triangle","square","circle"]); // fixed per particle
```

### `Particle.update()` — integration order (do not reorder)
1. Save `lastPos = pos`.
2. `rotation += rotationVel * deltaTime;`
3. Gravity, eased by local density (denser clumps fall slightly slower):
   `gravityScale = map(densityFactor, 0, 5, 1, 0.7);`
   `acc.add(p5.Vector.mult(gravity, 4 * gravityScale));`
4. **Mouse drag force** — only `if (mouseIsPressed)`:
   - `d = dist(pos.x, pos.y, mouseX, mouseY);` with `maxDist = 250;`
   - if `d < maxDist`:
     - `mouseVel = createVector(mouseX - mousePrevX, mouseY - mousePrevY);` (this-frame drag vector)
     - `densityScale = map(densityFactor, 0, 5, 1, 0.85);`
     - `force = mouseVel.copy().mult(10 * densityScale);`
     - `strength = pow(map(d, 0, maxDist, 1, 0), 1.75);` (falloff, hardest at the cursor)
     - `force.mult(strength); acc.add(force);`
     - `rotationVel += mouseVel.mag() * 0.01 * random(-1, 1);` (fast drags add random spin)
5. `dampingFactor = map(densityFactor, 0, 5, 1, 1);` (currently a no-op — always 1; keep it).
   Then `vel.add(p5.Vector.mult(acc, deltaTime * 15.0 * dampingFactor));`
6. **Floor drag vs. air drag** — if `pos.y > height - particleSize*2` (near the floor):
   `vel.mult(0.92); vel.x *= 0.94; rotationVel *= 0.95;` (heavy damping so the pile settles);
   else `vel.mult(0.985); rotationVel *= 0.99;` (light air damping).
7. `pos.add(p5.Vector.mult(vel, deltaTime * 11.5));`
8. **Walls** — `bounce = 0.45; buffer = particleSize;` (12). Clamp `pos` to
   `[buffer, dimension - buffer]` on each axis and reflect that velocity component toward the inside
   scaled by `bounce`: left/top → `vel = abs(vel)*bounce`, right/bottom → `vel = -abs(vel)*bounce`.
9. `acc.mult(0);` reset accumulator. `densityFactor = 0;` reset (rebuilt by `interact()` this frame).

### `Particle.draw()`
- `noStroke(); fill(this.color);`
- **Render at the midpoint of last→current position** for temporal smoothing:
  `renderX = lerp(lastPos.x, pos.x, 0.5); renderY = lerp(lastPos.y, pos.y, 0.5);`
- `push(); translate(renderX, renderY); rotate(rotation);` then draw at `size = particleSize` (12):
  - **triangle:** `triangle(-size/2, size/2, size/2, size/2, 0, -size/2);` (upward-pointing)
  - **square:** `rectMode(CENTER); rect(0, 0, size, size);`
  - **circle:** `circle(0, 0, size);`
  - `pop();`

### `Particle.interact(other)` — soft collision / fluid cohesion (the heart of the pile)
Only runs for pairs whose distance `d = dist(this.pos, other.pos)` is `< spacing` (144):
- **Density accumulation:** `densityIncrease = map(d, 0, spacing, 1.2, 0.1);` add it to **both**
  particles' `densityFactor` (this is what feeds the gravity/damping easing above).
- **Separation direction:** `force = p5.Vector.sub(this.pos, other.pos).normalize();` (points from
  `other` toward `this`). `strength = pow(map(d, 0, spacing, 0.8, 0), 1.1); force.mult(strength);`
- **Overlap resolution** — `overlap = spacing - d;` if `overlap > 0`:
  - `correctionStrength = map(overlap, 0, spacing, 0.15, 0.25);`
    `correction = force.copy().mult(overlap * correctionStrength);`
  - **Boundary softening:** `boundaryFactor = 1.0;` if either particle's `pos.y > height -
    particleSize*4`, set `boundaryFactor = 0.7;` then `correction.mult(boundaryFactor);` (gentler
    pushes near the floor so the heap compacts instead of exploding).
  - **Density-scaled positional push:**
    `densityScale = map(this.densityFactor + other.densityFactor, 0, 10, 1, 0.9);`
    `correctionWeight = 0.15 * densityScale;`
    `this.pos.add(p5.Vector.mult(correction, correctionWeight));`
    `other.pos.sub(p5.Vector.mult(correction, correctionWeight));`
  - **Velocity blending (viscosity)** — pull both velocities toward their average:
    `avgVel = p5.Vector.add(this.vel, other.vel).mult(0.5);`
    `velocityBlend = map(d, 0, spacing, 0.15, 0.02);`
    `velocityBlend *= map(this.densityFactor + other.densityFactor, 0, 10, 1.2, 0.95);`
    if `d < spacing*0.5` then `velocityBlend *= 1.5;`
    `this.vel.lerp(avgVel, velocityBlend); other.vel.lerp(avgVel, velocityBlend);`
- **Acceleration impulse (cohesion/repulsion):** `accForce = force.copy().mult(0.4);`
  `this.acc.add(accForce); other.acc.sub(accForce);`

### `draw()` — per-frame loop with a spatial hash grid
1. `background("#1a2ffb");` (opaque repaint — no trails). `deltaTime = 1 / frameRate();`
2. **Build the grid:** `gridSize = spacing` (144), `grid = {}`. For each particle: call
   `p.update()`, compute `key = floor(pos.x/gridSize) + "," + floor(pos.y/gridSize)`, and push the
   particle's index into `grid[key]`.
3. **Resolve collisions** over the 3×3 neighborhood: for every occupied cell `(gx,gy)`, for each of
   the 9 neighbor cells `(gx+dx, gy+dy)` with `dx,dy ∈ {-1,0,1}`, for each ordered pair of indices
   `i` (from the cell) and `j` (from the neighbor) with `i < j`, call `particles[i].interact(particles[j])`.
   (The `i < j` guard makes each pair resolve once per frame.)
4. Draw every particle: `for (p of particles) p.draw();`
5. `mousePrevX = mouseX; mousePrevY = mouseY;` (store for next frame's drag velocity).

### `windowResized()`
`resizeCanvas(windowWidth, windowHeight);` (particles keep their positions).

## Assets / images
None. The visual is 100% the blue field, the white shapes, and the overlay type — no image assets.

## Behavior notes
- **Desktop pointer-driven.** Idle behavior is autonomous: on load the grid drops, tumbles, and
  settles into a wobbling white heap along the bottom under gravity. There is no auto-reset — the
  pile just keeps jostling with its residual velocity blending.
- Interaction requires **holding the mouse button down** (`mouseIsPressed`) and dragging: that shoves
  and swirls particles within a 250px radius of the cursor, hardest right at the pointer. A stationary
  or un-pressed mouse does nothing.
- Runs continuously at `frameRate(60)`; the piece never stops. The `O(n)` spatial grid keeps the
  ~250-particle pairwise interaction cheap (medium perf cost).
- Full-window canvas, responsive via `windowResized`. No reduced-motion handling in the original — all
  motion is either gravity or user-driven.
- Particle shape is assigned once at spawn and never changes; expect a roughly even mix of triangles,
  squares, and circles across the 250.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--blue`, `--ink`, `--white`, `--white-dim`, `--white-faint`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The un-registered branch of this script (the `else` of `if (window.MP && window.MP.register)`) checks `document.readyState` before subscribing to `DOMContentLoaded`. That guard exists to survive being loaded late in a plain document; in React it is dead weight, because `useEffect` already runs after the DOM is committed. Drop the guard and the listener both, and keep only the call to `mount()` inside a `useEffect` with an empty dependency array. That does not retire all of the waiting logic, though: `mount()` itself carries a second, independent gate that checks whether the document has finished loading and, if not, defers constructing the `p5` instance to the window `load` event. That inner gate has to move into the effect along with the rest of the body, and the callback it defers needs the same treatment as any other continuation that can fire after the owning component is gone: keep the `alive` flag this script already threads through `Particle.update`, `p.setup`, and `p.draw`, and check it before the `load` handler is allowed to call `new p5(...)`. Without that check, a fast mount → unmount → remount cycle lets the *first* mount's deferred `load` callback construct a p5 instance after that copy has already been told to clean up, leaving a second simulation running behind the one the still-mounted copy created.

*(2) Element lookups* — This sketch never calls `document.querySelector`, but it has the same defect in a different shape: left with no explicit parent, `new p5(sketch)` attaches its canvas to `document.body`, inventing a `<main>` to hold it if the page has none — the `hadMain` bookkeeping and the `main.remove()` call in the cleanup above exist only to undo that afterward. A canvas parented to `document.body` sits outside the tree this component rendered, so a StrictMode remount produces two canvases hanging directly off `<body>` with no DOM relationship to whichever component instance is current. Give the component a root `ref` and pass its current node as `p5`'s second constructor argument so the canvas is created inside the subtree this component owns, and drop the `hadMain` / `main.remove()` workaround entirely — it was only needed because the vanilla script had nowhere else to put the canvas.

*(3) Cleanup* — The simulation owns its own runner, the same as any matter-js/p5 piece in this catalogue: stop it and remove the canvas in the cleanup. This script already gets the mechanics right — `instance.remove()` cancels p5's internal animation loop, strips the mouse/keyboard/resize listeners p5 attached to `window`, and deletes the `<canvas>`; the `onLoad` handle is kept specifically so the pending `load` listener can be unsubscribed if it never fired. The adaptation is structural, not mechanical: that exact teardown has to run from the function the effect returns, not from a bespoke `destroy()` a caller remembers to invoke, and the root node has to be captured in a local variable when the effect sets up rather than re-read from the ref inside the cleanup, where `.current` may already point somewhere else.

One more detail worth preserving rather than "cleaning up": the module reads viewport size from `window.innerWidth` / `window.innerHeight` through its own `vw()` / `vh()` helpers instead of p5's own `windowWidth` / `windowHeight`. The script's own comment explains why — those live on p5's prototype and only get refreshed on the instance that is currently resizing, so an instance constructed *after* a resize but before that refresh would otherwise be born reading the previous instance's cached size. That is precisely the ordering a StrictMode double-mount can produce, so when this becomes a React effect, keep sizing the canvas from `window` directly at construction time rather than switching to p5's cached globals for what looks like a simpler call.

This piece has no GSAP, no ScrollTrigger, no Lenis, and no hand-rolled animation loop to cancel — p5's internal loop is the only clock running here — so none of those variants apply beyond the p5 teardown above.
