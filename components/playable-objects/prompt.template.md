---
slug: playable-objects
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Playable Objects — Physics Pill Footer

## Goal
Build a two-screen page whose second screen is a **dark footer where 12 white "pill" tags rain down from above the viewport and pile up under real 2D physics (Matter.js)**. A GSAP ScrollTrigger with `once: true` boots the physics engine the first time the footer scrolls into view; every pill is a Matter.js rigid body synced to a DOM element via a `requestAnimationFrame` loop, and a Matter `MouseConstraint` lets the user **grab, drag and fling the pills** in real time. Smooth scrolling via Lenis. The centered footer headline reads "Because why list when you can play?".

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, `lenis` for smooth scroll, and `matter-js` for the physics simulation (`import Matter from "matter-js"`). Register the plugin with `gsap.registerPlugin(ScrollTrigger)`. No canvas rendering — Matter runs headless and you drive the DOM elements yourself.

## Layout / HTML
Two stacked full-viewport sections:

```
<section class="hero">
  <h1>Scroll down to break the laws of web design</h1>
</section>

<section class="footer">
  <div class="object-container">
    <div class="object"><p>Motionprompts</p></div>
    <div class="object"><p>HTML</p></div>
    <div class="object"><p>CSS</p></div>
    <div class="object"><p>JavaScript</p></div>
    <div class="object"><p>GSAP</p></div>
    <div class="object"><p>ScrollTrigger</p></div>
    <div class="object"><p>Lenis</p></div>
    <div class="object"><p>React</p></div>
    <div class="object"><p>Next.js</p></div>
    <div class="object"><p>WebGL</p></div>
    <div class="object"><p>Three.js</p></div>
    <div class="object"><p>Creative Dev</p></div>
  </div>

  <div class="footer-content">
    <h1>Because why list when you can play?</h1>
  </div>
</section>

<script type="module" src="./script.js"></script>
```

Key classes the JS depends on: `.object-container` (the physics world bounds) and `.object` (one per rigid body). There are **12 pills** with those exact tech-tag labels.

## Styling

**Font** — Google Fonts `DM Sans` (import the full variable range, weights 100..1000). `body { font-family: "DM Sans", sans-serif; }`.

**Reset / global**
- `* { margin: 0; padding: 0; box-sizing: border-box; }`
- `h1 { font-size: 4rem; font-weight: 500; letter-spacing: -0.04rem; line-height: 1.2; user-select: none; }`
- `section { position: relative; width: 100vw; height: 100svh; padding: 2rem; overflow: hidden; }`
- `.hero h1, .footer h1 { width: 45%; text-align: center; }`

**Hero** — `display: flex; justify-content: center; align-items: center; background: #fff; color: #0f0f0f;`.

**Footer** — `background-color: #0f0f0f; color: #fff;` (near-black on white pills is the whole palette).

**.footer-content** — `position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 2rem; display: flex; justify-content: center; align-items: center; pointer-events: none;` with `.footer-content * { pointer-events: auto; }`. It overlays the physics layer but lets pointer events pass through to the pills.

**.object-container** — `position: absolute; top: 0; left: 0; width: 100%; height: 100%;`. Fills the footer; this rect defines the physics walls.

**.object** — `position: absolute; width: max-content; font-size: 2rem; font-weight: 500; background-color: #fff; color: #0f0f0f; padding: 1rem 2rem; border-radius: 50px; cursor: grab; user-select: none; pointer-events: auto; z-index: 2;` and `.object:active { cursor: grabbing; }`. The pills start with no `left/top` set in CSS — JS positions them every frame.

**Responsive** `@media (max-width: 1000px)`: `h1 { font-size: 2rem; }`, `.hero h1, .footer h1 { width: 100%; }`, `.object { font-size: 1rem; }`.

## GSAP + Matter.js effect (be exact)

Wrap everything in `DOMContentLoaded`.

### 1. Lenis smooth scroll wiring
```
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### 2. Config object (exact values)
```
const config = {
  gravity: { x: 0, y: 1 },
  restitution: 0.5,
  friction: 0.15,
  frictionAir: 0.02,
  density: 0.002,
  wallThickness: 200,
  mouseStiffness: 0.6,
};
```
Module-scope state: `let engine, runner, mouseConstraint, bodies = [], topWall = null;` plus a `clamp(val, min, max)` helper.

### 3. ScrollTrigger boot (the GSAP part)
Loop over every `section`; for the one containing `.object-container`, create:
```
ScrollTrigger.create({
  trigger: section,
  start: "top bottom",   // fires as soon as the footer's top touches the viewport bottom
  once: true,            // physics initializes exactly once, ever
  onEnter: () => {
    const container = section.querySelector(".object-container");
    if (container && !engine) initPhysics(container);
  },
});
```
No scrub, no pin, no tween — the ScrollTrigger is purely a lazy-init trigger. (Keep an `animateOnScroll = true` flag; if false, fall back to initializing on `window` `load` instead.)

### 4. initPhysics(container)
- `engine = Matter.Engine.create()`; `engine.gravity = config.gravity`; solver quality cranked up: `engine.constraintIterations = 10; engine.positionIterations = 20; engine.velocityIterations = 16; engine.timing.timeScale = 1;`.
- Measure `containerRect = container.getBoundingClientRect()`.
- **Three static walls** (200px thick rectangles, all `isStatic: true`), centered just outside the container so their inner faces sit exactly on the container edges — note there is **no top wall initially** so bodies can fall in:
  - floor: center `(width/2, height + 100)`, size `(width + 400) × 200`
  - left wall: center `(-100, height/2)`, size `200 × (height + 400)`
  - right wall: center `(width + 100, height/2)`, size `200 × (height + 400)`
- **One rectangle body per `.object` element.** For each (with its measured `getBoundingClientRect()` size):
  - `startX = Math.random() * (containerRect.width - objRect.width) + objRect.width / 2` (random, fully inside horizontally)
  - `startY = -500 - index * 200` (staggered spawn heights far above the container → they fall in one after another)
  - `startRotation = (Math.random() - 0.5) * Math.PI` (random tilt ±90°), applied via `Matter.Body.setAngle`
  - body options: `restitution: 0.5, friction: 0.15, frictionAir: 0.02, density: 0.002`
  - push `{ body, element, width, height }` into `bodies` and add the body to the world.
- **Seal the ceiling after 3 seconds**: `setTimeout(..., 3000)` adds a fourth static wall at center `(width/2, -100)`, size `(width + 400) × 200`, so once everything has fallen in, flung pills can't escape upward.

### 5. Mouse dragging (MouseConstraint)
- `const mouse = Matter.Mouse.create(container);` then **remove Matter's wheel hijacking** so page scroll keeps working:
  `mouse.element.removeEventListener("mousewheel", mouse.mousewheel);` and same for `"DOMMouseScroll"`.
- `mouseConstraint = Matter.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.6, render: { visible: false } } });` and disable the context menu: `mouseConstraint.mouse.element.oncontextmenu = () => false;`.
- **startdrag** event: remember the body's `inertia`, then `Matter.Body.setInertia(body, Infinity)` (no spin while held), `setVelocity({x:0,y:0})`, `setAngularVelocity(0)`.
- **enddrag** event: restore the original inertia (`|| 1`) and clear the dragging refs.
- **engine `beforeUpdate`**: while a body is dragged, clamp its position so it can't be pulled outside the container (`x` between `width/2` and `containerWidth - width/2`, same idea for `y`), and clamp its velocity components to **±20** — this is what makes "flinging" fast but bounded.
- Release the constraint (set `mouseConstraint.constraint.bodyB = null; ...pointB = null;`) on both container `mouseleave` and document `mouseup`, so a pill is never stuck to a pointer that left.
- Add the mouseConstraint to the world; start the sim with `runner = Matter.Runner.create(); Matter.Runner.run(runner, engine);`.

### 6. DOM sync loop
A self-scheduling `requestAnimationFrame` loop maps each physics body onto its element:
```
const x = clamp(body.position.x - width / 2, 0, containerRect.width - width);
const y = clamp(body.position.y - height / 2, -height * 3, containerRect.height - height);
element.style.left = x + "px";
element.style.top  = y + "px";
element.style.transform = `rotate(${body.angle}rad)`;
```
Positions are top-left based (`left/top`), rotation via `transform: rotate(...rad)`. The `y` clamp floor of `-height * 3` lets pills be visible slightly above the container while falling in, but the render never places them outside the box horizontally.

## Assets / images
None. The component is pure typography and CSS — no raster images, no SVG, no 3D models.

## Behavior notes
- The pills only ever spawn once (`once: true` + `!engine` guard); scrolling away and back does not re-drop them.
- Because the spawn heights are staggered (`-500 - index * 200`) the 12 pills enter the frame sequentially over ~2–3 seconds, bouncing (restitution 0.5) and settling into a pile.
- Wheel/touch scrolling stays functional over the footer because Matter's mouse wheel listeners are explicitly removed; only click-drag is captured.
- Physics + rAF DOM writes are heavy: desktop-oriented, no reduced-motion guard in the original.
- Container bounds are measured once at init; the sim is not rebuilt on resize.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--coral`, `--muted`, `--paper-dim`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component is a bad candidate for surviving that carelessly: a doubled mount does not just leave two `ScrollTrigger`s, it leaves two Matter `Engine`s integrating the same 12 pills, two `Runner`s stepping them forward, two `MouseConstraint`s both able to claim the same drag, and two DOM-sync `requestAnimationFrame` loops writing `left`/`top`/`transform` onto the same `.object` elements every frame. None of that reproduces as an obviously doubled trigger — it reads as the pile jittering between two positions or a dragged pill fighting the pointer, and it will not show up in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — This script already has React-shaped bones: the effect body has been factored into `mount(config)`, which returns a `destroy()` that undoes exactly what `mount()` built. That split exists so this catalogue's own editor runtime (`window.MP.register`) can tear the physics down and remount it with a different `config` when someone drags the gravity or restitution knob. Drop the `window.MP` branch entirely — it is the editor's hook into this file, not something a consuming app ships. Drop the `document.readyState === "loading"` check and its `DOMContentLoaded` listener too: that guard exists to survive being loaded late into a plain document, and `useEffect` already runs after the DOM is committed, so there is nothing left for it to guard against. What remains is exactly the effect body:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS });
  return destroy;
}, []);
```

*(2) Element lookups* — `mount()` still reaches past its own subtree twice: `document.querySelectorAll("section")`, walked to find the one section that contains `.object-container`, and — in the `animateOnScroll === false` fallback path — a second, unscoped `document.querySelector(".object-container")`. Both assume this component owns the whole document. A root ref already tells you which section is yours, so skip the search entirely: pass the container element (or the root ref) into `mount` and read `.object-container` from it directly, instead of iterating every `<section>` on the page to rediscover it. `container.querySelectorAll(".object")` inside `initPhysics` and `Matter.Mouse.create(container)` are already scoped correctly — both take the container you hand them, not `document`. The `document.addEventListener("mouseup", releaseDrag)` is not a scoping bug to fix: a drag can legitimately end with the pointer anywhere on the page, off the footer entirely, so that listener is correctly global. Just make sure it keeps coming off with the same reference on cleanup, which it already does.

*(3) Cleanup* — `mount()`'s own `destroy()` already implements this catalogue's checklist, in the order that matters: `Matter.Events.off(mouseConstraint)` and `Matter.Events.off(engine)` run before `Matter.Runner.stop(runner)`, so nothing writes to a body mid-teardown; `Matter.World.clear` and `Matter.Engine.clear` come after the runner has stopped; `cancelAnimationFrame(frame)` cancels the DOM-sync loop; `clearTimeout(topWallTimer)` cancels the 3-second ceiling-seal — this one matters more under StrictMode than it looks, because the mount-unmount-remount cycle finishes well inside that 3-second window, so an uncleared timer fires after the first `engine` is already gone and tries to `Matter.World.add` a wall onto a world you already cleared; `triggers.forEach(t => t.kill())` kills the one-shot `ScrollTrigger`; `gsap.ticker.remove(raf)` drops the callback driving `lenis.raf`, kept as the same `raf` reference the ticker was given — a `gsap.context` revert would not have covered that subscription anyway; and `lenis.off("scroll", ScrollTrigger.update)` runs before `lenis.destroy()`. Return `destroy` unmodified from the effect — it is already the correct cleanup function for this component, not a shape that needs translating into `gsap.context` or anything more idiomatic. One behavior worth keeping deliberately: `bodies.forEach(...)` resets each pill's inline `left`/`top`/`transform` back to empty before `destroy()` returns, so a remount's `getBoundingClientRect()` measures the pills at their laid-out rest position instead of wherever physics last left them. And since this component owns a Lenis instance purely to drive its own scroll-triggered boot, if it ends up as one section inside a larger page that already runs Lenis, lift the instance to the app shell and have `mount` reuse it instead of constructing a second one here.
