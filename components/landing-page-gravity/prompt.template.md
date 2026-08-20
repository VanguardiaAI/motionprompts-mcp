---
slug: landing-page-gravity
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 11
structural:
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: stagger, literal: "-0.1", rule: stagger/shape }
  - { kind: ease, literal: "\"power3.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Physics Gravity Landing Page (Matter.js drop + GSAP overlay)

## Goal

Build a full-viewport, single-screen hero where **twelve small image tiles** (90×60px each, thin black border) are scattered across a flat acid-lime panel. A `[ Drop / Raise ]` button in the top-right toggles real physics: on **Drop**, Matter.js gravity switches on and all twelve tiles **fall, tumble with random spin, bounce and pile up on an invisible floor** at the bottom. On **Raise**, gravity switches off and a manual eased `requestAnimationFrame` lerp **glides every tile back to its exact starting position and 0° angle**. In sync with the drop, GSAP animates the lime overlay's `clip-path` (collapsing it into a thin band at the bottom), grows and re-positions the giant `Freefall` headline, flips the toggle button's color, and reveals four columns of footer nav links from behind a clip mask. Raising reverses all of it. The whole thing is one screen — no scroll.

## Tech

Vanilla HTML/CSS/JS with ES module imports (Vite-style npm imports). Use:

- `gsap` (npm) — for all the overlay/headline/text/button tweens. **No GSAP plugins** (no ScrollTrigger, no SplitText — text splitting is done by hand).
- `matter-js` (npm) — the physics engine. Destructure `const { Engine, Runner, World, Bodies, Body, Events } = Matter;`.

```js
import gsap from "gsap";
import Matter from "matter-js";
```

No smooth-scroll library, no canvas, no WebGL. Matter.js runs **headless** (no `Render`) and its bodies drive the DOM tiles via inline `style.top/left/transform` on every `afterUpdate` tick. All code runs at module top level (no `DOMContentLoaded` wrapper needed since the module is loaded at end of `<body>`).

## Layout / HTML

```
<div class="container">              <!-- z-index:2, holds the 12 tiles -->
  <button id="toggle-btn">[ Drop / Raise ]</button>
  <div class="item item-1"><img src="…" alt="" /></div>
  … item-2 … through … item-12 …    <!-- 12 total, each wraps one <img> -->
</div>

<div class="overlay">                 <!-- z-index:0, the acid-lime full-screen panel -->
  <h1>Motionprompts</h1>
</div>

<div class="content">                 <!-- footer nav, 4 flex columns -->
  <div class="col"> 5× <div class="line"><p>…</p></div> </div>
  … 4 columns total …
</div>
```

- The 12 tiles are `.item .item-1` … `.item .item-12`; each contains exactly one `<img>`.
- The toggle button text is literally `[ Drop / Raise ]`.
- The headline text is `Motionprompts` (uppercased via CSS).
- The four `.col` columns each hold five `.line` rows; each `.line` wraps one `<p>`. Column 1 line texts: `About Us / Our Team / Our Mission / Careers / Contact`. Column 2: `Services / Web Development / Mobile Apps / UI/UX Design / SEO Optimization`. Column 3: `Projects / E-commerce / Portfolio / Blog / Landing Pages`. Column 4: `Resources / Tutorials / Documentation / Community / Support`. (Any neutral link labels work; the first line of each column is a dimmed "header".)

## Styling

Global reset `* { margin:0; padding:0; box-sizing:border-box; }`.

- `html, body`: `width:100%; max-width:100vw; height:100vh; background: var(--ink); overflow:hidden; font-family: var(--mono);`.
- Palette and type:
  ```css
  :root {
    --ink: #111111;         /* the page under the panel, all dark type */
    --lime-hi: #eff28f;     /* the panel, top of its gradient */
    --lime-lo: #dcea4e;     /* …and its bottom */
    --paper-white: #fbfbf3; /* the footer links over black */
    --mono: "Space Mono", ui-monospace, monospace;
  }
  ```
  **Space Mono** for every small label and the toggle button, **Space Grotesk** for the headline, **Inter** for the masthead kicker. The whole page is two colours plus black — the acid panel is the design.
- `img { width:100%; height:100%; object-fit:cover; }`.
- `.container { position:absolute; width:100%; height:100%; z-index:2; }` — the tile layer sits on top.
- `#toggle-btn`: `position:absolute; top:2em; right:2em; background:none; border:none; outline:none; font-family: var(--mono); text-transform:uppercase; font-size:12px; padding:0.5em 1em; cursor:pointer; color: var(--ink); mix-blend-mode:difference; z-index:2;`. The `mix-blend-mode:difference` makes it invert against whatever is behind it.
- `.item`: `position:absolute; width:90px; height:60px; border:2px solid var(--ink);` (3:2 landscape tiles). Their scattered **initial** positions (top/left as % of the viewport, this is the "floating grid" pose):
  - item-1 `top:50% left:5%` · item-2 `15%/10%` · item-3 `25%/15%` · item-4 `5%/37.5%` · item-5 `35%/40%` · item-6 `30%/52.5%` · item-7 `40%/50%` · item-8 `20%/60%` · item-9 `60%/65%` · item-10 `27.5%/75%` · item-11 `37.5%/85%` · item-12 `65%/82.5%`.
- `.overlay`: `position:absolute; top:0; left:0; width:100%; max-width:100vw; height:100%; padding:1em; background: linear-gradient(180deg, var(--lime-hi) 0%, var(--lime-lo) 100%); overflow:hidden; z-index:0;` and **initial** `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);` (a full rectangle — the acid panel covers the whole screen). The `overflow:hidden` contains the oversized headline (~130vw wide when grown) so it never pushes the document past the viewport.
- `.overlay h1`: `position:absolute; bottom:0; left:0; padding:0.35em 0.45em; color: var(--ink); font-family:"Space Grotesk"; text-transform:uppercase; line-height:100%; letter-spacing:-0.03em; white-space:nowrap;` — a heavy geometric grotesque, set in ink on the lime.
- `.overlay h1 span`: `display:inline-block; font-size:10vw; font-weight:700;` — the headline is split into per-character `<span>`s in JS and **each span carries the font-size** (so animating span font-size scales every letter). `15vw` on mobile.
- `.content`: `position:relative; width:100%; display:flex;` — the four columns sit in normal flow at the top of the page (painting above the `z-index:0` overlay, below the `z-index:2` tiles).
- `.col`: `flex:1; padding:2em; gap:2em;`. `.col .line:nth-child(1) { margin-bottom:1em; opacity:0.5; }` (dim column header).
- `.line`: `position:relative; width:100%; height:24px; opacity:0.75; clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);` — a 24px-tall **clip window**.
- `.line p`: `position:absolute; text-transform:uppercase; font-size:11px; letter-spacing:0.08em; color: var(--paper-white); opacity:0.86; transform:translateY(30px);` — **starts pushed 30px down**, i.e. below the 24px clip window, so the link text is hidden until GSAP lifts it to `y:0`.

## GSAP + physics effect (be exhaustive — this is the whole component)

### 1. Split the headline into character spans (manual, no SplitText)

Run a helper on the `h1`: take its `innerText`, split into characters, wrap each in `<span>…</span>` (replace a space with `&nbsp;&nbsp;`), and set `element.innerHTML` to the joined result. This turns the headline into one `<span>` per letter so GSAP can stagger `font-size` per letter.

### 2. Matter.js setup (gravity OFF, bodies static)

```js
const engine = Engine.create({ gravity: { x: 0, y: 0 } });   // gravity starts OFF
const runner = Runner.create();
Runner.run(runner, engine);                                  // runner runs immediately
```

- Grab all `.item` elements. Snapshot each tile's **initial** grid position: `initialPositions[i] = { x: item.offsetLeft, y: item.offsetTop, angle: 0 }`.
- For each tile create a rectangle body centered on the tile:
  ```js
  Bodies.rectangle(
    initialPositions[i].x + item.offsetWidth / 2,
    initialPositions[i].y + item.offsetHeight / 2,
    item.offsetWidth,          // 90
    item.offsetHeight,         // 60
    { restitution: 0.75, friction: 0.5, frictionAir: 0.0175, isStatic: true }
  );
  ```
  Add each to the world, keep them in a `bodies[]` array (index-aligned with `items`). `restitution:0.75` = bouncy; `frictionAir:0.0175` = mild air drag; all start `isStatic:true` so nothing moves until Drop.
- Add one **static floor** just below the viewport: `Bodies.rectangle(window.innerWidth/2, window.innerHeight + 5, window.innerWidth, 20, { isStatic:true })`.

### 3. State & constants

```js
let gravityEnabled = false;   // false = raised/floating, true = dropped
let isAnimating   = false;    // click lock during a transition
const duration    = 0.75;     // seconds, for the manual raise-back lerp
const easeOutQuad = (t) => t * (2 - t);
```

### 4. Toggle button click handler (`#toggle-btn`)

Guard at the top: `if (isAnimating) return; isAnimating = true;`. Then branch on the **current** `gravityEnabled`:

**Drop branch (`!gravityEnabled`):**
- `engine.world.gravity.y = 1;` (turn gravity on).
- For every body: `Body.setStatic(body, false)` then `Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.25)` — wake it up and give it a small random spin (±0.125 rad/s). Gravity then pulls all twelve tiles down; they tumble, bounce (restitution 0.75) and pile on the floor.
- Set `gravityEnabled = true`.

**Raise branch (`gravityEnabled`):** a manual eased lerp back to the grid (no GSAP here):
- `engine.world.gravity.y = 0;`
- For each body `i`: `Body.setStatic(body, true)`. Capture `startPos = {x: body.position.x, y: body.position.y}`, `startAngle = body.angle`. Target `endPos = { x: initialPositions[i].x + items[i].offsetWidth/2, y: initialPositions[i].y + items[i].offsetHeight/2 }`, `endAngle = 0`. Record `startTime = performance.now()`.
- Drive a `requestAnimationFrame` loop `animateBack(currentTime)`:
  - `elapsed = (currentTime - startTime) / 1000; t = Math.min(elapsed / duration, 1); easedT = easeOutQuad(t);`
  - `x = startPos.x + easedT*(endPos.x - startPos.x)` (same for `y` and `angle` toward `endAngle`).
  - Apply inside a **`setTimeout(() => { Body.setPosition(body, {x, y}); Body.setAngle(body, angle); }, 750)`** — note the original defers each frame's write by 750 ms, so the glide-back visibly starts ~0.75 s after the click and eases into place (easeOutQuad, ~0.75 s span). Keep this 750 ms delay to match timing.
  - If `t < 1`, request the next frame.
- Set `gravityEnabled = false`.

**Both branches** then call `toggleClipPath()` (below) and finally `setTimeout(() => { isAnimating = false; }, 2000)` — a 2 s lock so you can't spam the button mid-transition.

### 5. `toggleClipPath()` — the GSAP overlay/headline/text/button tweens

`gravityEnabled` has **already been flipped** by the time this runs, so `gravityEnabled === true` means "we just dropped", `false` means "we just raised". Fire these five `gsap.to` calls (all run simultaneously):

- **Overlay clip-path** — `gsap.to(overlay, { clipPath: <A/B>, duration: 1.5, ease: "power3.inOut" })`:
  - dropped → `"polygon(5% 60%, 95% 60%, 95% 100%, 5% 100%)"` (collapse the lime panel into a short band across the lower area, 5–95% wide, 60→100% tall).
  - raised → `"polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"` (full-screen rectangle).
- **Button color** — `gsap.to("#toggle-btn", { color: <"#fbfbf3" / "#111111">, delay: 0.5, duration: 1 })`: dropped → off-white, raised → ink.
- **Headline position** — `gsap.to(".overlay h1", { left: <"32.5%" / "0%">, duration: 1, ease: "power4.inOut" })`: dropped slides the headline right to `32.5%`, raised back to `0%`.
- **Headline size** — `gsap.to(".overlay h1 span", { fontSize: <"20vw" / "10vw">, duration: 1, ease: "power4.inOut", stagger: <−0.035 / 0.035> })`: dropped grows every letter to `20vw` with a **negative** stagger `-0.035` (last letter first); raised shrinks to `10vw` with `+0.035` (first letter first).
- **Footer links** — for **each** `.col` separately, `gsap.to(col.querySelectorAll(".line p"), { y: <0 / 30>, delay: <0.75 / 0>, duration: 1, ease: "power3.out", stagger: <0.1 / −0.1> })`:
  - dropped → `y:0` (lift each link up into its clip window, revealing it), `delay:0.75`, `stagger:0.1` (top-to-bottom cascade).
  - raised → `y:30` (drop back out of the clip, hidden), `delay:0`, `stagger:-0.1` (reverse cascade).
  - Because it's applied per-column, all four columns animate at once, each staggering its own five rows.

Summary of the two visual states:
- **Raised (initial):** the full acid-lime panel; twelve tiles floating in their scattered grid; the headline at 10vw pinned bottom-left in heavy Space Grotesk; footer links hidden; toggle button ink (inverting via blend against the lime).
- **Dropped:** tiles have fallen and piled at the bottom; the lime overlay collapsed to a thin lower band; the headline grown to 20vw and shifted to `left:32.5%`; four columns of off-white mono footer links revealed over the black; toggle button off-white.

**Typography recap:** the headline is **Space Grotesk** at 700; every small label — nav, footer, toggle — is **Space Mono**; the masthead kicker is **Inter**. All three are free web fonts, so nothing here depends on a local fallback.

### 6. Physics → DOM sync (`afterUpdate`)

Subscribe once: `Events.on(engine, "afterUpdate", …)`. On **every** engine tick, for each body/tile pair write the tile's inline style from the body:

```js
item.style.top       = `${body.position.y - item.offsetHeight / 2}px`;
item.style.left      = `${body.position.x - item.offsetWidth  / 2}px`;
item.style.transform = `rotate(${body.angle}rad)`;
```

This runs continuously (the runner is always on), so the tiles follow their bodies both while falling and while being lerped back. In the raised state the bodies are static at the grid centers, so the tiles hold their scattered positions.

## Assets / images

**12 image tiles**, each rendered `object-fit:cover` inside a **90×60px (3:2 landscape)** black-bordered frame — so any source aspect is fine, it will be center-cropped to 3:2. Use a cohesive set of **moody, high-fashion / editorial art-direction** stills so the scattered grid reads like a gallery wall. Variety within the set (one idea per tile, no repeats): a dark still-life of a bottle on draped fabric; an editorial figure crouching on a saturated colored backdrop; a hooded/veiled portrait on black; a blue light-installation corridor with silhouetted figures; a grainy high-contrast B&W portrait in sunglasses; a dim runway/fashion-show walk under a spotlight; a caped figure with a wide-brim hat in a concrete space; a warm-lit gallery interior with a silhouetted viewer; a studio fashion portrait on a blue gradient; a minimalist monochrome desert with a lone walker; an overhead of a figure on an ornate golden staircase; a studio portrait in a black turtleneck and beret on pale grey. Provide 12 files in order; if fewer are available, repeat in order. **No client logos or real brand names** — the demo headline is the single word `Freefall`, over a masthead kicker reading "Twelve frames held in suspension.".

## Behavior notes

- **Single screen, no scroll.** `body { overflow:hidden }`; everything is absolute/fixed to the viewport. The floor lives 5px below the bottom edge.
- **State machine:** the button strictly alternates Drop → Raise → Drop; the 2 s `isAnimating` lock prevents overlapping transitions.
- **The Raise is not a physics simulation** — gravity is turned off and bodies are set static, then a hand-rolled easeOutQuad rAF lerp (with the 750 ms deferred write) glides every body from its tumbled pose back to the exact captured grid center and 0 rad. Keep both the lerp and the `setTimeout(…, 750)` to reproduce the timing.
- No reduced-motion handling and no resize recomputation in the original (floor/bodies are sized once on load). The effect is desktop-oriented but works down to smaller widths (tiles just have less room to fall).
- Performance is on the heavier side (a live Matter.js runner plus per-tick DOM writes for 12 elements), but it's only active while the page is open.

## Images

This component ships with 12 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/landing-page-gravity/img1.jpg
https://motionprompts.dev/c/landing-page-gravity/img10.jpg
https://motionprompts.dev/c/landing-page-gravity/img11.jpg
https://motionprompts.dev/c/landing-page-gravity/img12.jpg
https://motionprompts.dev/c/landing-page-gravity/img2.jpg
https://motionprompts.dev/c/landing-page-gravity/img3.jpg
… 6 more under https://motionprompts.dev/c/landing-page-gravity/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--lime-hi`, `--lime-lo`, `--paper-white`, plus the type variable `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component builds a Matter `Engine` and `Runner` the instant it mounts, plus a rectangle body for each of the twelve tiles and one static floor. Run that construction twice without tearing the first copy down and you get two runners stepping two worlds at once, two `afterUpdate` listeners both writing `top`/`left`/`transform` onto the same twelve `.item` nodes every tick, and — because pressing `[ Drop / Raise ]` to raise the grid spins up one independent `requestAnimationFrame` loop per tile — up to twenty-four competing rAF chains fighting over the same DOM the moment a second click lands. The visible symptom is tiles jittering between two positions, or falling and re-settling twice as fast as they should, and none of it reproduces in a production build, because React only does the double mount in development.

*(1) The entry point.* The fallback boot path checks `document.readyState` before subscribing to `DOMContentLoaded` — the guard that lets this file also run standalone, outside an editor/harness context, when dropped into a plain page. Under React, `useEffect` already runs after the DOM this effect measures (`item.offsetLeft`, `item.offsetWidth` — the numbers `initialPositions` is built from) has committed, so `document.readyState` inside it is always `"complete"`. Drop the guard, the `DOMContentLoaded` listener, and the editor-registration branch entirely. What remains — reading the toggle button and the twelve tiles, splitting the `h1` into character spans, building `engine`/`runner`/`bodies`/`floor`, wiring the click handler, subscribing `afterUpdate` — becomes the body of a `useEffect` with an empty dependency array. The tunable physics values (gravity, restitution, air friction, spin, the two stagger amounts) become the effect's own local constants, or props if the host app needs to drive them.

*(2) Element lookups.* `document.getElementById("toggle-btn")`, every `document.querySelectorAll(".item")` / `"h1"` / `".overlay h1 span"` / `".col .line p"` all assume this component owns the whole document. Give the section a root `ref` and resolve every one of those from it instead. This is not a style nit here specifically: during the StrictMode remount, two `#toggle-btn`s and two full sets of twelve `.item`s briefly coexist in the DOM, and an unscoped lookup will bind to whichever copy the browser hands back first — not necessarily the one this effect run is about to wire a click handler and physics bodies to.

*(3) Cleanup.*

**GSAP.** Wrap the five `gsap.to` calls inside `toggleClipPath` — the overlay clip-path, the toggle button's color, the headline's position and per-letter size, and each column's footer links — in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* read the elements, build engine/runner/bodies/floor,
       wire the toggle handler, subscribe afterUpdate */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`toggleClipPath` does not run during that synchronous setup, though — it only fires from inside the click handler, once per press of `[ Drop / Raise ]`, which is outside the window `gsap.context` auto-tracks. Wrap the handler's tweening in `ctx.add(() => { ... })` so every click's tweens get adopted retroactively, or keep this component's own belt-and-suspenders move and call `gsap.killTweensOf` directly in the cleanup against the same five targets (`overlay`, `toggleBtn`, the overlay `h1`s, their letter spans, every column's link paragraphs) it already tracks for this exact reason.

**rAF.** The generic advice — keep the one handle the last `requestAnimationFrame` returned and cancel it — undercounts what a single Raise click schedules here. Each tile gets its own `animateBack` loop, so up to twelve run concurrently, and every frame of every one of those loops additionally defers its actual write through a chained `setTimeout` (the reference clip's ~750ms hold before the eased value lands), so a click can leave a dozen live frame ids and a dozen live timer ids outstanding at once. Track both in a `Set` — add on schedule, delete on fire — and on unmount cancel everything still in either set. Canceling only the most recently scheduled handle leaves eleven other tiles still gliding toward their grid position against a component that no longer exists.

**The manual character split.** `splitTextIntoSpans` rewrites the `h1`'s `innerHTML` into one `<span>` per character so the per-letter size tween has something to stagger — there is no SplitText plugin here, but the failure mode is the one that plugin has too: split a second time without reverting and you wrap already-split spans in more spans, and the tween now staggers over the wrong node count. Capture the heading's original `innerHTML` before splitting and restore it in the cleanup, before clearing any inline style GSAP or Matter left on nearby nodes — reverting the split while a tween still targets one of the letter spans is what corrupts the next mount's animation.

**matter-js.** Tear down in the order the running `Runner` actually depends on: `Events.off(engine)` first, so nothing writes `top`/`left`/`transform` onto a tile after cleanup has started; then `runner.enabled = false` before `Runner.stop(runner)` — the flag matters because if a frame had already fired when the unmount runs (a backgrounded tab, a slow re-render), `Runner.stop` only cancels the *next* scheduled frame, and Matter's own loop re-schedules itself from inside the frame already in flight, resurrecting the runner right after you stopped it. Finish with `World.clear(engine.world, false)` and `Engine.clear(engine)`. Left alone, the runner keeps integrating a twelve-body world and writing to twelve DOM nodes for as long as the tab stays open, whether or not this section is still on screen.

Put together, the cleanup this component needs — cancel every outstanding frame and timer, detach the click listener, unsubscribe `afterUpdate`, disable and stop the runner before clearing the Matter world, restore the un-split heading markup, kill the five tweens, then clear the inline styles physics and GSAP left behind — is what makes it safe to navigate away from this route and back without the tiles landing in the wrong place or falling twice as fast the second time.
