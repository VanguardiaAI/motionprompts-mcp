---
slug: image-explosion-scroll-animation-js
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 1
structural:
  - { kind: lerp, literal: "0.5", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Image Explosion Scroll Animation

## Goal

Build a single scrollable page where, the moment the footer scrolls halfway into view, 15 images violently burst upward out of the footer's bottom edge and rain back down under gravity — a one-shot "image explosion" driven by a hand-rolled requestAnimationFrame physics simulation (per-particle velocity, gravity, friction and rotation). No GSAP is used for this effect; the physics loop IS the effect.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `lenis` (npm) for smooth scrolling. No GSAP plugins are required — the explosion is pure JavaScript physics updating `style.transform` inside a `requestAnimationFrame` loop.

```js
import Lenis from "lenis";
```

Wrap all JS in a `DOMContentLoaded` listener.

## Layout / HTML

Four stacked blocks, in this order:

1. `<section class="hero">` — empty; full-screen background image.
2. `<section class="about">` — contains one `<p>` of editorial copy (centered). Use this fictional text: "The world collapsed, but the game survived. In the neon-lit ruins of civilization, the last remnants of power aren't in governments or corporations—they're in the **Oblivion Decks**. Each card carries a fragment of lost history, a code of survival, a weapon of deception. The elite hoard them. The rebels steal them. The desperate gamble their lives for them. Do you have what it takes to **play the game that decides the future**?" (the `**` markers are literal text characters, not bold markup).
3. `<section class="outro">` — empty; full-screen background image.
4. `<footer>` — contains:
   - `<h1>The future is in your hands</h1>`
   - `<div class="copyright-info">` with two `<p>` elements: `© 2025 Oblivion Decks` and `All rights reserved.`
   - `<div class="explosion-container"></div>` — empty; the JS injects the particle `<img>` elements here.

## Styling

- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- All `<p>`: `text-transform: uppercase; font-family: "Akkurat Mono", monospace; font-size: 14px;`.
- All `<img>`: `width: 100%; height: 100%; object-fit: cover;`.
- Every `section`: `position: relative; width: 100vw; height: 100svh; padding: 2em;`.
- `.hero` and `.outro`: full-bleed background image, `no-repeat 50% 50%`, `background-size: cover` (each with its own image).
- `.about`: `color: #000; background-color: #e3e3db;` flexbox centering both axes; its `p` is `width: 50%; text-align: center;`.
- `footer`: `position: relative; width: 100vw; height: 75svh; background-color: #0f0f0f; color: #fff; padding: 2em;` — column flexbox with `justify-content: space-between; align-items: center;` and, critically, `overflow: hidden` (particles must be clipped by the footer).
- `footer h1`: `text-transform: uppercase; font-family: "FK Screamer", sans-serif; font-size: 12vw; font-weight: 500; line-height: 0.85;` (a very heavy condensed display sans; fall back to any ultra-condensed sans-serif).
- `.copyright-info`: `width: 100%; display: flex; justify-content: space-between;`.
- `.explosion-container`: `position: absolute; bottom: 0; left: 0; width: 100%; height: 200%; pointer-events: none;` (twice the footer's height so particles have vertical room).
- `.explosion-particle-img`: `position: absolute; bottom: -200px; left: 50%; width: 150px; height: auto; object-fit: cover; transform: translateX(-50%); will-change: transform;` — all 15 particles start stacked at the same point, hidden 200px below the container's bottom edge, horizontally centered.

## The effect (be precise — this is the star)

### Smooth scroll

Instantiate Lenis with exactly `{ autoRaf: true, lerp: 0.5 }`.

### Config constants

```js
const config = {
  gravity: 0.25,        // px/frame² added to vy every frame
  friction: 0.99,       // per-frame multiplier on vx, vy and rotationSpeed
  imageSize: 150,       // particle width in px
  horizontalForce: 20,  // max horizontal launch speed spread
  verticalForce: 15,    // base upward launch speed
  rotationSpeed: 10,    // max rotation speed spread (deg/frame)
  resetDelay: 500,      // ms before the explosion can re-arm
};
```

### Particles

- `imageParticleCount = 15`. Build an array of 15 image paths and **preload** each one by creating `new Image()` and assigning `src` (no need to attach to DOM).
- `createParticles()`: set `explosionContainer.innerHTML = ""`, then for each path create an `<img>` with class `explosion-particle-img`, set `src`, set inline `style.width = config.imageSize + "px"`, and append to `.explosion-container`.

### Physics — `Particle` class

Constructor (takes the element):
- `x = 0`, `y = 0` (positions are relative offsets from the CSS resting spot).
- `vx = (Math.random() - 0.5) * config.horizontalForce` → range −10..+10 px/frame.
- `vy = -config.verticalForce - Math.random() * 10` → range −15..−25 px/frame (negative = upward).
- `rotation = 0`, `rotationSpeed = (Math.random() - 0.5) * config.rotationSpeed` → range −5..+5 deg/frame.

`update()` — called once per rAF frame:
1. `vy += config.gravity` (gravity pulls down).
2. `vx *= config.friction; vy *= config.friction; rotationSpeed *= config.friction;`
3. `x += vx; y += vy; rotation += rotationSpeed;`
4. Write `element.style.transform = "translate(" + x + "px, " + y + "px) rotate(" + rotation + "deg)"`. Note this inline transform **replaces** the CSS `translateX(-50%)` centering — that's intentional and matches the original look.

Net motion: each image launches upward at 15–25 px/frame with a random horizontal drift and random spin, decelerates (gravity + friction), arcs over, and falls back down out through the footer's bottom edge.

### Trigger + loop — `explode()`

- Guard with a module-level `explosionTriggered` boolean: if already `true`, return; else set it `true`.
- Call `createParticles()` (fresh DOM nodes each explosion), query all `.explosion-particle-img`, map each to a `new Particle(el)`.
- Start a rAF loop: every frame, update all particles; keep looping. When **every** particle's `y > explosionContainer.offsetHeight / 2` (i.e. all have fallen well below their start point — container is 200% of footer height, so half of it is one full footer height), `cancelAnimationFrame` the loop and, after `config.resetDelay` (500 ms), set `explosionTriggered = false` so the effect can fire again.

### Scroll detection

- `checkFooterPosition()`: read `footer.getBoundingClientRect()`; if `!explosionTriggered && footerRect.top <= window.innerHeight - footerRect.height * 0.5`, call `explode()`. (Fires once the footer is at least half revealed at the bottom of the viewport.)
- Listen to `window` `"scroll"` and debounce with `clearTimeout` + `setTimeout(checkFooterPosition, 10)`.
- On `window` `"resize"`, set `explosionTriggered = false` (re-arm).
- On init: call `createParticles()` once (pre-populates the hidden stack), then `setTimeout(checkFooterPosition, 500)` in case the page loads already scrolled to the footer.

## Assets / images

17 images total, a cohesive stylized automotive/editorial photo set (no logos or brand marks):

- **Hero background** — 1 full-bleed landscape image, ~3:2 (e.g. a dramatic studio 3D render / concept-car style shot).
- **Outro background** — 1 different full-bleed landscape image, ~3:2, same moody editorial style.
- **15 particle images** (`img1`…`img15`) — mixed aspect ratios: mostly 16:9 landscape shots with a few portrait ones (~2:3 / ~5:6) sprinkled in. Rendered at 150px wide with natural height, so exact ratios are flexible; visually they should read as a varied editorial series (night roads, studio renders, desert scenes, close-up details, etc.).

## Behavior notes

- The explosion is one-shot per approach but re-arms itself: after all particles fall past the halfway line of the container and the 500 ms delay elapses, scrolling away and back re-triggers it. Resizing also re-arms it.
- `pointer-events: none` on the container keeps the falling images from blocking clicks.
- `overflow: hidden` on the footer is essential — particles must appear to erupt from and disappear behind the footer's bottom edge, never spill over other sections.
- Works on mobile; no WebGL/canvas, just DOM images and transforms.

## Images

This component ships with 17 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/image-explosion-scroll-animation-js/hero.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation-js/img1.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation-js/img10.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation-js/img11.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation-js/img12.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation-js/img13.jpg
… 11 more under https://motionprompts.dev/c/image-explosion-scroll-animation-js/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--white`, `--red`, `--gray`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two smooth scrollers pulling on the same wheel event, two physics loops animating the same footer. The visible symptom is jitter or a doubled explosion, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought. This script is already shaped like one: `mount(config)` builds everything — the `Lenis` instance, the `explode()` physics loop, the debounced `scroll` and `resize` listeners on `window`, the three timers — inside a closure, and hands back a single function that tears down every one of them. `explosionTriggered`, `animationId`, `resetTimer` and `checkTimeout` all live inside that closure rather than at module scope, so a StrictMode double-mount produces two fully independent instances instead of two halves sharing state — the adaptation is about relocating the call, not restructuring what it does.

*(1) The entry point* — The bottom of the file only reaches `mount` through `document.readyState === "loading" ? addEventListener("DOMContentLoaded", boot) : boot()`. That guard exists to survive being evaluated late inside a plain `<script type="module">` tag; `useEffect` already runs after the DOM is committed, so it is dead weight here. Drop the `window.MP` branch, the `readyState` check and `boot` itself, and call `mount`'s body directly inside a `useEffect` with an empty dependency array, passing whatever config values the component needs in place of `DEFAULTS`. Return exactly the function `mount` builds — it already discharges every cleanup obligation below.

*(2) Element lookups* — `mount` looks up the footer and the particle container once, with `document.querySelector("footer")` and `document.querySelector(".explosion-container")`. Both need to become refs on the component's own markup — a `footerRef` on the `<footer>` and a `containerRef` on `.explosion-container` — with the same bail-out `mount` already has if either is missing. The one lookup that does not need a ref is `explosionContainer.querySelectorAll(".explosion-particle-img")` inside `explode()`: it already runs against the container variable captured in the closure, not against `document`, so it can only ever see this instance's own particles even while a stale copy of the subtree is still around during the remount.

*(3) Cleanup*

- **Lenis.** This instance is built with `autoRaf` turned on, so it drives its own internal `requestAnimationFrame` loop — there is nothing to wire up and no loop of your own to cancel for the scrolling itself. The one obligation is `lenis.destroy()`, which the returned function already calls; skip it under a double mount and the remount's fresh instance fights the orphaned one over the same wheel input, and the page's scroll position starts jittering with no error to point at.
- **The explosion's own rAF loop.** `animate()` inside `explode()` is a second, unrelated loop that has nothing to do with scrolling — it advances every `Particle`'s position and rotation and writes the result to `element.style.transform` until they have all fallen past half the container's height. Keep the `animationId` handle exactly as written and call `cancelAnimationFrame` on it in the cleanup — `stopLoop()` already does this. Losing it is a specific failure, not a generic one: an orphaned `animate()` keeps calling `.update()` on 15 `Particle` instances whose `element` references DOM nodes that a since-reverted `createParticles()` has already wiped out from under them.
- **Timers.** `firstCheck` (the initial load-time grace period), `checkTimeout` (the scroll debounce) and `resetTimer` (the re-arm delay) are all cleared in the function `mount` returns. Miss any one and it fires against a component that no longer has a `footer` or `.explosion-container` in the tree — `resetTimer` is the sharpest case, since it is scheduled only once the falling particles clear the halfway line, which can be well after the user has already navigated to another route.
- **Listeners.** The debounced `scroll` handler and the `resize` handler are both bound to `window`, not to any element inside the component, so React will never remove them on its own — `removeEventListener` for both is already in the returned function.
- **Injected particles.** `createParticles()` rebuilds the 15 `<img>` elements with `explosionContainer.innerHTML = ""` before repopulating; the cleanup performs the same wipe on the way out, so a remount does not inherit the previous instance's particle stack mid-fall.

One thing this component does *not* need to guard: the `imagePaths.forEach((path) => { const img = new Image(); img.src = path; })` preload block near the top of `mount` attaches no `onload`/`onerror` handler and nothing awaits it — it is a fire-and-forget cache warm, not a promise or callback that could resolve after unmount, so it needs no cancellation flag.
