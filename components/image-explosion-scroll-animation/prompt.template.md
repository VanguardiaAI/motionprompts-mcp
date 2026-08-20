---
slug: image-explosion-scroll-animation
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Image Explosion Scroll Animation

## Goal

Build a 4-section scroll page whose payoff is the footer: when the footer scrolls at least half-way into view, **15 photos erupt from below the footer's bottom edge like confetti**, launched upward with randomized velocity and spin, then arc back down under simulated gravity until they fall out of sight. The whole effect is a hand-rolled particle physics system (velocity + gravity + friction + rotation) driven by `requestAnimationFrame` — **no GSAP, no libraries, zero dependencies**.

## Tech

Vanilla HTML/CSS/JS. `script.js` is loaded as an ES module (`<script type="module" src="./script.js">`) but needs **no imports whatsoever** — do not install or import GSAP, Lenis or anything else. Everything is plain DOM + rAF.

## Layout / HTML

Four blocks in `<body>`, in this order:

```
<section class="hero"></section>

<section class="about">
  <p>
    The world collapsed, but the game survived. In the neon-lit ruins of
    civilization, the last remnants of power aren't in governments or
    corporations—they're in the **Oblivion Decks**. Each card carries a
    fragment of lost history, a code of survival, a weapon of deception.
    The elite hoard them. The rebels steal them. The desperate gamble
    their lives for them. Do you have what it takes to **play the game
    that decides the future**?
  </p>
</section>

<section class="outro"></section>

<footer>
  <h1>The future is in your hands</h1>
  <div class="copyright-info">
    <p>&copy; 2025 Oblivion Decks</p>
    <p>All rights reserved.</p>
  </div>

  <div class="explosion-container"></div>
</footer>

<script type="module" src="./script.js"></script>
```

Notes:
- The `**double asterisks**` in the paragraph are **literal text characters** (raw markdown-style emphasis left unrendered) — keep them.
- `.hero` and `.outro` are empty; their imagery comes from CSS `background`.
- `.explosion-container` starts empty; JS injects the particle `<img>` elements into it.

## Styling

- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `p { text-transform: uppercase; font-family: "Akkurat Mono", monospace; font-size: 14px; }` — a monospaced family; the generic `monospace` fallback is fine.
- `img { width: 100%; height: 100%; object-fit: cover; }`.
- Every `section`: `position: relative; width: 100vw; height: 100svh; padding: 2em;`.
- `.hero`: full-bleed background photo — `background: url(<hero image>) no-repeat 50% 50%; background-size: cover;`.
- `.about`: `color: #000; background-color: #e3e3db;` (warm off-white), flex, centered both axes; `.about p { width: 50%; text-align: center; }`.
- `.outro`: full-bleed background photo, same pattern as `.hero`.
- `footer`: `position: relative; width: 100vw; height: 75svh; background-color: #0f0f0f; color: #fff; padding: 2em; display: flex; flex-direction: column; justify-content: space-between; align-items: center; overflow: hidden;`. The `overflow: hidden` is essential — it clips the particles while they idle below the footer and after they fall back out.
- `footer h1`: `text-transform: uppercase; font-family: "FK Screamer", sans-serif; font-size: 12vw; font-weight: 500; line-height: 0.85;` — a very heavy condensed display face; if unavailable, a bold condensed sans fallback (e.g. `sans-serif`) is acceptable.
- `.copyright-info`: `width: 100%; display: flex; justify-content: space-between;` (the two `<p>`s sit at opposite edges).
- `.explosion-container`: `position: absolute; bottom: 0; left: 0; width: 100%; height: 200%; pointer-events: none;`. The 200% height (twice the footer) matters — the fall-out check below measures against half of this container's height.
- `.explosion-particle-img`: `position: absolute; bottom: -200px; left: 50%; width: 150px; height: auto; object-fit: cover; transform: translateX(-50%); will-change: transform;`. Every particle starts at the same spot: horizontally centered, 200px **below** the container's bottom edge (hidden by the footer's `overflow: hidden`).

## The explosion effect (vanilla physics — be exact)

There is no GSAP, no timeline, no ScrollTrigger. The animation is a custom particle engine. Reproduce these numbers exactly.

### Config (module-scope constants)

```
const config = {
  gravity: 0.25,        // px/frame² added to vy every frame
  friction: 0.99,       // per-frame decay multiplier on vx, vy and spin
  imageSize: 150,       // particle width in px
  horizontalForce: 20,  // spread of the random horizontal launch velocity
  verticalForce: 15,    // base upward launch velocity
  rotationSpeed: 10,    // spread of the random spin speed
  resetDelay: 500,      // ms after landing before the effect may re-fire
};
```

- `imageParticleCount = 15`; build an `imagePaths` array of the 15 particle image URLs (`img1.jpg` … `img15.jpg`).
- Module state: `explosionContainer`, `footer`, `explosionTriggered = false`, `particles = []`.

### `Particle` class

Constructor takes the `<img>` element and initializes:
- `x = 0`, `y = 0` (offsets in px from the CSS resting position)
- `vx = (Math.random() - 0.5) * config.horizontalForce` → uniform in **−10 … +10** px/frame
- `vy = -config.verticalForce - Math.random() * 10` → uniform in **−15 … −25** px/frame (negative = upward)
- `rotation = 0`
- `rotationSpeed = (Math.random() - 0.5) * config.rotationSpeed` → uniform in **−5 … +5** deg/frame

`update()` — called once per frame:
1. `this.vy += config.gravity;` (gravity pulls down)
2. `this.vx *= config.friction; this.vy *= config.friction; this.rotationSpeed *= config.friction;` (air drag on everything, including spin)
3. `this.x += this.vx; this.y += this.vy; this.rotation += this.rotationSpeed;`
4. Write straight to the element: ``this.element.style.transform = `translate(${this.x}px, ${this.y}px) rotate(${this.rotation}deg)`;`` — note this inline transform intentionally **replaces** the CSS `translateX(-50%)` once animation starts; that's how the original behaves.

Net motion: every card launches from the same point with a random up-and-out velocity, decelerates, apexes, then accelerates back down past its start point while its spin gradually damps out — a firework/confetti burst.

### `createParticles()`

1. `explosionContainer.innerHTML = ""` and reset `particles = []`.
2. For each of the 15 paths: create an `<img>`, set `src`, add class `explosion-particle-img`, set inline `style.width = "150px"`, append to the container.
3. Query all `.explosion-particle-img` inside the container and map each element to `new Particle(element)`, stored in `particles`.

### `explode()`

1. Guard: `if (explosionTriggered) return;` then set `explosionTriggered = true`.
2. Call `createParticles()` (fresh DOM elements + fresh random velocities every burst).
3. Start a rAF loop:
   - Each frame, call `update()` on every particle.
   - **Termination check**: when **every** particle satisfies `particle.y > explosionContainer.offsetHeight / 2` (i.e. it has fallen at least half the container's height — one full footer height — below its start), `cancelAnimationFrame(...)`, stop the loop with a `finished` flag, and after `config.resetDelay` (500 ms) set `explosionTriggered = false` so the effect can fire again.

### Scroll trigger

`checkFooterPosition()`:
```
const footerRect = footer.getBoundingClientRect();
if (!explosionTriggered && footerRect.top <= window.innerHeight - footerRect.height * 0.5) {
  explode();
}
```
i.e. the burst fires the moment **at least half of the footer is inside the viewport**.

### `init()`

Run on `DOMContentLoaded` (with the usual `document.readyState === "loading"` guard so it also works if the script executes late):
1. Query `.explosion-container` and `footer`.
2. **Preload** all 15 images: `new Image().src = path` for each.
3. Call `createParticles()` once up front so the images exist in the DOM at rest (invisible — parked 200px below the footer and clipped).
4. Scroll listener, debounced with a 10 ms `setTimeout` (`clearTimeout` + `setTimeout(checkFooterPosition, 10)` on every `scroll` event).
5. One initial `setTimeout(checkFooterPosition, 500)` so the effect also fires if the page loads already scrolled to the footer.
6. `resize` listener that simply resets `explosionTriggered = false`.

## Assets / images

17 images total, all landscape photos from one cohesive, moody, cinematic set (e.g. retro-futuristic concept-vehicle photography — dark, dramatic lighting; no real brands or logos):

- **1 hero background** (~16:9): full-bleed cover background of the opening section.
- **1 outro background** (~16:9): full-bleed cover background of the section just before the footer.
- **15 particle images** (~3:2 landscape): rendered as small 150px-wide cards with `height: auto` (native aspect preserved), these are the photos that explode out of the footer. They should read as a varied but matching collection.

## Behavior notes

- The explosion **re-fires**: 500 ms after all particles have fallen out, the guard flag resets, so any subsequent scroll event while the footer is still half-visible triggers a brand-new burst (with new random velocities). Resizing the window also re-arms it.
- Particles are purely decorative: `pointer-events: none` on the container, `will-change: transform` on each card.
- All physics is frame-based (per-rAF-tick), not time-based — no delta-time correction, matching the original.
- No reduced-motion handling in the original.
- The page is a normal scroll document (100svh + 100svh + 100svh + 75svh); nothing is pinned and scroll is native (no smooth-scroll library).

## Images

This component ships with 17 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/image-explosion-scroll-animation/hero.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation/img1.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation/img10.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation/img11.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation/img12.jpg
https://motionprompts.dev/c/image-explosion-scroll-animation/img13.jpg
… 11 more under https://motionprompts.dev/c/image-explosion-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--paper-bright`, `--safelight`, `--ink-soft`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that is already close to a `useEffect`: `mount` finds `.explosion-container` and `footer`, preloads the fifteen particle images, seeds the particle DOM once at rest, wires the `scroll` and `resize` listeners plus three `setTimeout`s, and returns a function that walks every one of those back off. The dispatch at the bottom of the file — the `window.MP` check and the `readyState` guard — is the part that has nothing to do with how React schedules work.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. If `mount()`'s own return value isn't the thing you hand back as the effect's cleanup, the first mount's `scroll` and `resize` listeners on `window` are never removed — they aren't scoped to any element StrictMode's remount replaces, so they just keep running, each pair closed over its own `explosionTriggered` flag and `particles` array. Revisit this route without wiring the cleanup and every mount adds one more live `scroll` listener, permanently, each independently deciding off its own stale `footer`/`explosionContainer` references whether to fire a burst. This will not reproduce in a production build, because React only double-invokes in development.

*(1) The entry point* — Delete the whole dispatch block. `window.MP && window.MP.register` is this catalogue's own editor hook; `window.MP` is undefined in a React host, so execution always falls to the `else`. And the `document.readyState === "loading"` guard around the `DOMContentLoaded` listener is dead weight once `mount()`'s body runs inside a `useEffect`, which already fires after the DOM is committed. What's left is a direct call:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS });
  return destroy;
}, []);
```

*(2) Element lookups* — `mount()` opens with `document.querySelector(".explosion-container")` and `document.querySelector("footer")`, which assumes it owns the whole document — true enough here, since this component *is* the whole page (hero, about, outro, footer, in that order), but the two lookups should still be scoped to a `ref` on whatever root the four sections render under, not to `document`, so a StrictMode remount can't hand the footer-visibility check the copy of the subtree that's on its way out. Pass that root node into `mount` (or have it query inside `rootRef.current` instead of `document`) for both lookups. Leave the `scroll` and `resize` listeners on `window` unscoped, though: the footer-visibility check reads `getBoundingClientRect()` against the viewport, not against any scoped container, so there's nothing here for the root ref to own.

*(3) Cleanup* — `mount()`'s returned function already does the complete job: `stopLoop()` cancels the exact `animationId` the running `animate()` loop holds, and the three timers are cleared by name — `firstCheck` (the half-second initial check, for a page that loads already scrolled down to the footer), `checkTimeout` (the ten-millisecond scroll debounce), and `resetTimer` (the delay before `explosionTriggered` flips back so the burst can re-arm) — before the `scroll`/`resize` listeners come off `window` and `explosionContainer.innerHTML` is cleared. Return it unmodified: there is no legacy shape here to translate into something more idiomatic, and no GSAP context or Lenis instance to fold it into, since this component uses neither.

One thing worth being deliberate about rather than "fixing": `explosionTriggered`, `particles`, `animationId` and the three timer handles all stay plain variables closed over inside `mount()`, exactly as in the original — they never become `useState`. Promoting any of them would either do nothing (the effect's dependency array is empty, so nothing re-runs) or re-fire the whole setup on every burst, since nothing outside this effect ever needs to read them.
