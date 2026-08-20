# Cursor Smudge Revealer — Gooey SVG-Mask Hero

## Goal
Build a full-screen hero made of **two stacked full-viewport layers**: a dark foreground carrying a giant title, and a light background carrying a hidden message. Moving the cursor (or dragging a finger) **smudges the dark foreground away**, revealing the light layer beneath through the cursor trail. The star effect: at a **lerp-smoothed pointer position**, white circles are continuously stamped into an **SVG mask** whose contents run through a **gooey (metaball) SVG filter**, so overlapping stamps fuse into organic blobs. Each stamp is **sized by pointer speed**, **expands 2× over 2s** with GSAP, then **dissolves back to 0 over 3s** and is removed — producing a soft, wet "wipe-away" reveal that heals itself when you stop moving.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) only — **no** ScrollTrigger, SplitText, Lenis, or any other plugin. No smooth scroll. Import as:
```js
import gsap from "gsap";
```
No `registerPlugin` needed. All motion is **pointer-driven** (mousemove + touch), animated per-stamp via `gsap.timeline`, and pumped by a manual `requestAnimationFrame` loop. Runs in a fresh Vite project with just `gsap` installed.

## Layout / HTML
A single `<section class="hero">` containing two absolutely-stacked content layers and one inline `<svg>` that holds the mask + filter definitions:

```html
<section class="hero">
  <div class="hero-content-foreground">
    <h1>Dig in</h1>
  </div>

  <div class="hero-content-background">
    <h3>
      The things worth finding are never on the surface. They live in the
      parts you almost scrolled past.
    </h3>
  </div>

  <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" class="smudge-revealer">
    <defs>
      <filter id="smudge-goo">
        <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
        <feColorMatrix type="matrix"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 -14" />
      </filter>
    </defs>
    <mask id="smudge-mask">
      <g class="smudge-blobs" filter="url(#smudge-goo)"></g>
    </mask>
  </svg>

  <script type="module" src="./script.js"></script>
</section>
```

Key structural facts (load-bearing):
- `.hero-content-foreground` is the **dark** layer on top with the big `<h1>`.
- `.hero-content-background` is the **light** layer underneath with the `<h3>` message, and it is the element the mask is applied to (`mask: url(#smudge-mask)`).
- The `<svg>` is empty of visible geometry: it only defines the goo `<filter>` and the `<mask>`. The `<g class="smudge-blobs">` is where JS injects `<circle>` elements at runtime; that group carries `filter="url(#smudge-goo)"`.
- Use neutral demo copy. Title: **"Dig in"**. Message: a short two-sentence line about things worth finding living below the surface. No brands.

## Styling
Fonts (read carefully — this is the one thing reproductions get wrong): the original CSS declares `font-family: "Hanson", sans-serif;` for both `h1` and `h3` **but never actually loads a Hanson font** — there is no `@font-face`, no web-font import, no `<link>`. So in a real browser the declared family fails and the headings **fall back to the generic `sans-serif` default** (a neutral, medium-weight face like Helvetica/Arial), rendered at **normal weight (400)**. That neutral, normal-weight look is exactly what the visible reference shows, and it must be reproduced.

- Do **NOT** substitute a heavy/condensed display face (Anton, Archivo Black, Oswald, etc.). Those are much bolder, narrower, and taller and will make the giant near-viewport-filling `<h1>` clearly wrong.
- Do **NOT** add an external font via Google Fonts `@import`/`<link>` or a bundled `@font-face`. It changes the look and adds an unnecessary network dependency to an otherwise fully self-contained, image-free component.
- Reproduce the CSS as the original has it: keep `font-family: "Hanson", sans-serif;` (leaving the unresolved "Hanson" first is fine and faithful — it just falls through to `sans-serif`), and **do not set `font-weight`** (so it stays the default `normal` / `400`). If you prefer to be explicit, write `font-family: sans-serif; font-weight: 400;` — same visible result: a plain system sans at normal weight.
- Both headings: `text-transform: uppercase; line-height: 0.9;` (these stay).

Reset: `* { margin:0; padding:0; box-sizing:border-box; }`.

Type sizes:
- `h1`: `font-size: clamp(5rem, 22.5vw, 30rem);` — enormous, near-viewport-filling.
- `h3`: `font-size: clamp(3rem, 5vw, 6rem);`

Color tokens (exact hex):
- Foreground (dark) layer: `background-color: #2a2b2a;` text `color: #edf2ed;`
- Background (light) layer: `background-color: #cbd4c2;` (pale sage) text `color: #323332;`

Layout / positioning:
- `.hero`: `position: relative; width: 100%; height: 100svh; overflow: hidden;`
- `.hero-content-background, .hero-content-foreground`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 2rem; text-align: center; user-select: none;` (both fully overlap the hero).
- `.hero-content-foreground`: `display: flex; justify-content: center; align-items: flex-end;` → the title sits **bottom-centered**.
- `.hero-content-background`: `display: flex; justify-content: center; align-items: center;` → the message sits **dead-center**. Apply the mask on this element:
  ```css
  mask: url(#smudge-mask);
  -webkit-mask: url(#smudge-mask);
  ```
- `.smudge-revealer` (the svg): `position: absolute; top: 0; left: 0; pointer-events: none;` (JS sets its pixel width/height to match the viewport).

**Why it works:** an SVG `<mask>` shows the masked element only where the mask content is white and hides it where black/empty. The mask starts **empty**, so `.hero-content-background` is fully hidden and only the dark foreground + title are visible. Each white circle stamped into `.smudge-blobs` punches a visible hole revealing the light layer at that spot. The goo filter thresholds the blurred circles' alpha so nearby stamps merge into smooth blobs instead of separate discs.

### The goo filter (metaball threshold)
`#smudge-goo` = `feGaussianBlur stdDeviation="25"` (heavy blur softens each circle) → `feColorMatrix` whose **alpha row** is `0 0 0 60 -14` (multiply alpha ×60, subtract 14). This steepens the blurred alpha gradient into a near-binary edge: overlapping blurred circles that individually sit below threshold sum above it in their overlap, fusing into one gooey shape. RGB rows are identity. Keep these exact values.

## GSAP effect (exhaustive)

### Config (name these constants)
```js
const config = {
  smoothing: 0.1,          // lerp factor for pointer smoothing per frame
  movementThreshold: 0.01, // min speed (px) to stamp a smudge
  sizeFromSpeed: 0.2,      // stamp radius = pointer speed * this
  expandMultiplier: 2,     // radius grows to 2× on expand
  expandTime: 2,           // expand duration (s)
  expandEase: "power1.inOut",
  dissolveStart: 2,        // dissolve begins at t = 2s (absolute position)
  dissolveTime: 3,         // dissolve duration (s)
  dissolveEase: "power3.in",
};
```

### Pointer state & capture
- Two objects: `pointer {x,y}` (raw target) and `smoothPointer {x,y}` (lerped). Flag `hasStarted = false`.
- `onPointerMove(x, y)`: on the **first** call, seed `pointer.x = smoothPointer.x = x` and same for y, set `hasStarted = true`, and **return without stamping** (prevents a giant initial stamp from the jump-to-first-position). On subsequent calls just set `pointer.x = x; pointer.y = y`.
- Listeners on `.hero`:
  - `mousemove` → `onPointerMove(e.pageX, e.pageY)`.
  - `touchstart` and `touchmove` → `e.preventDefault()` then `onPointerMove(e.touches[0].pageX, e.touches[0].pageY)`; both registered with `{ passive: false }`.
- SVG sizing: `matchSVGToViewport()` sets `smudgeSVG.style.width = innerWidth + "px"` and height `= innerHeight + "px"`. Call once on load and on `window` `resize`.

### rAF loop — `update()` (runs continuously for the page lifetime)
Each frame, if `hasStarted`:
1. Lerp the smoothed pointer toward the raw pointer:
   ```js
   smoothPointer.x += (pointer.x - smoothPointer.x) * config.smoothing; // 0.1
   smoothPointer.y += (pointer.y - smoothPointer.y) * config.smoothing;
   ```
2. Compute **speed** as the distance between raw and smoothed pointer:
   ```js
   const speed = Math.hypot(pointer.x - smoothPointer.x, pointer.y - smoothPointer.y);
   ```
   (Faster cursor movement ⇒ larger raw/smoothed gap ⇒ bigger speed ⇒ bigger stamps. When still, speed decays to ~0 and stamping stops.)
3. If `speed > config.movementThreshold` (0.01), stamp:
   ```js
   stampSmudgeAt(smoothPointer.x, smoothPointer.y, speed * config.sizeFromSpeed); // radius
   ```
Then `requestAnimationFrame(update)`. Kick off with one `requestAnimationFrame(update)` at startup.

### `stampSmudgeAt(x, y, radius)` — the per-stamp GSAP timeline
1. Create an SVG `<circle>` via `document.createElementNS("http://www.w3.org/2000/svg","circle")` with `cx=x`, `cy=y`, `r=radius`, `fill="#fff"`. **`prepend`** it into `.smudge-blobs` (prepend, not append).
2. Hold an animatable proxy: `const animatedRadius = { current: radius };`
3. Build a `gsap.timeline` with:
   - `onUpdate()` → write the current radius back to the SVG: `circle.setAttribute("r", Math.max(0, animatedRadius.current));`
   - `onComplete()` → `timeline.kill(); circle.remove();` (cleanup so the DOM/mask doesn't accumulate dead nodes).
4. Timeline tweens (two, with an absolute position param on the second):
   - **Expand:** `tl.to(animatedRadius, { current: radius * config.expandMultiplier, duration: config.expandTime, ease: config.expandEase });` → grows radius `r → 2r` over **2s**, `power1.inOut`.
   - **Dissolve:** `tl.to(animatedRadius, { current: 0, duration: config.dissolveTime, ease: config.dissolveEase }, config.dissolveStart);` → shrinks radius `→ 0` over **3s**, `power3.in`, placed at **absolute time `2`** (the `dissolveStart` position param). So dissolve begins exactly when expand ends; **total stamp lifetime ≈ 5s** (2s grow, then 3s shrink-to-nothing), after which the circle is removed.

Net motion: a fast flick lays down a dense trail of large blobs that swell then melt away over ~5s, so the reveal is transient and "re-covers" itself; a slow drag lays smaller blobs. Because every stamp lives in the same goo-filtered group, concurrent stamps merge into continuous smudges rather than a string of separate dots.

## Assets / images
**None.** This component uses **no image files** — it is purely typographic (two big headings) plus SVG mask/filter geometry generated at runtime. Do not add images.

## Behavior notes
- **Trigger:** pointer only — `mousemove` on desktop, `touchstart`/`touchmove` on touch. No scroll, click, load, or hover-state animation. Idle (no pointer movement) ⇒ speed decays and existing stamps finish dissolving, so the hero settles back to the fully-covered dark title.
- **Static / fresh-load appearance:** because the reveal only happens *while the pointer is actively moving*, a fresh page load with no pointer motion correctly shows only the **dark foreground layer with the giant title fully covering** the light message beneath — the mask starts empty. A static screenshot of an untouched load is expected to show zero smudge (that is not a failure); the light layer and its message only peek through along the moving cursor trail.
- **Touch:** `preventDefault` on touch events (with `{ passive: false }`) so dragging smudges instead of scrolling.
- **First-move guard:** the very first pointer event only seeds positions and does not stamp.
- **Cleanup:** every stamp's timeline `kill()`s itself and removes its `<circle>` on complete — essential to keep the mask group from growing unbounded during continuous movement.
- **Viewport:** hero is `100svh`; the SVG is resized in pixels to `innerWidth × innerHeight` on load and resize so mask coordinates stay aligned with `pageX/pageY`.
- The mask relies on `url(#smudge-mask)` referencing the inline SVG in the same document; keep the SVG in the DOM (it is `pointer-events: none` and visually empty).

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-deep`, `--pink`, `--paper`, `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone module that already anticipates being rebuilt: `mount(config)` exists so this catalogue's own visual editor can call it again after a knob changes, and the `destroy()` it returns already undoes everything `mount` created — the `mousemove`/`touchstart`/`touchmove` listeners on `.hero`, the `resize` listener, the pending `requestAnimationFrame` handle, every timeline still live in `timelines`, and the `<circle>` nodes stamped into `.smudge-blobs`. That is exactly the contract a `useEffect` cleanup needs, so most of this adaptation is wiring rather than rewriting — the risk is in what gets substituted for that wiring, not in what the file is missing.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen, on the same DOM nodes. Routed straight through — call `mount` in the effect and return the `destroy` it hands back — that double-invoke is already handled: the first `destroy()` removes the listeners, cancels the pending frame, kills whatever timelines exist (none yet, this early) and empties `.smudge-blobs`, all before the second `mount()` call runs. The place this breaks is if the effect is written to match the rest of this catalogue's GSAP components instead — wrapping the call in a `gsap.context` and returning `ctx.revert()` as the cleanup. `ctx.revert()` only undoes GSAP objects the context tracked; it does not remove `heroSection`'s three pointer listeners, the `window` `resize` listener, or cancel `frame`, because none of those are GSAP's. Do that, and the second `mount()` call attaches a second full set of listeners next to the first's and starts a second `requestAnimationFrame` loop next to the first's still-running one — two independent `pointer`/`smoothPointer` closures both driving `stampSmudgeAt` off the same `mousemove` events into the same `.smudge-blobs`, and neither loop is ever cancelled by this cleanup. Unlike most StrictMode-only symptoms in this catalogue, that is not a development-only blip: the same substitution breaks a real unmount-then-remount — leaving this route and coming back — exactly the same way, because nothing about `ctx.revert()` ever touches the listeners or the frame handle, in development or in production.

*(1) The entry point* — Delete the whole `if (window.MP && window.MP.register) {...} else {...}` block; `window.MP` is this catalogue's editor hook and has no counterpart in a deployed app. What's left is `mount(Object.assign({}, DEFAULTS))` itself — call it directly inside a `useEffect` with an empty dependency array and return the `destroy` it hands back. The `document.readyState`/`DOMContentLoaded` guard wrapped around `boot()` is redundant once that call is inside `useEffect`, which never fires before the DOM it reads is committed.

*(2) Element lookups* — `mount` resolves `.hero`, `.smudge-revealer` and `.smudge-blobs` with three separate `document.querySelector` calls and bails to a no-op `destroy` if any come back empty. Put the root `ref` on `.hero` itself — it is both the outermost element and the node the pointer/touch listeners bind to, so `heroSection` becomes the ref's current value directly, no query needed for it. Rewrite the other two as `root.querySelector(".smudge-revealer")` and `root.querySelector(".smudge-blobs")` scoped under that ref, and keep the existing early-return guard — it now protects against an effect that fired before the ref attached, rather than against a missing element on the page.

*(3) Cleanup* —

**GSAP — `ctx.revert()` cannot replace `destroy()`.** If a context is introduced at all here, it only earns its keep for the per-stamp timelines, and even there it works against the grain of this file: `stampSmudgeAt` builds a fresh `gsap.timeline()` from inside `update()`'s `requestAnimationFrame` loop, called on nearly every frame the pointer moves — long after the effect's own setup call has already returned. Wrapping `mount(...)` in `gsap.context(() => mount(Object.assign({}, DEFAULTS)), rootRef)` captures nothing, because `mount`'s synchronous body creates no GSAP object itself; every timeline is built later, outside the window a context auto-tracks. The only placement that would work is opening `ctx.add(() => { /* build the timeline here */ })` inside `stampSmudgeAt`, once per stamp, so each one registers at the instant it's created. Given that cost, the `timelines` `Set` this file already keeps is doing the identical job for less ceremony — every stamp adds itself on creation, and `destroy()` already runs `timelines.forEach(tl => tl.kill())` before clearing it — so the simplest correct port carries that `Set` over untouched and skips `gsap.context` for this component entirely. Whichever way you go, `destroy()` stays the effect's cleanup; a context's `revert()` is at most one line folded inside it, never a stand-in for it.

**rAF loop — this is `requestAnimationFrame`, not `gsap.ticker`.** `update()` re-schedules itself unconditionally into `frame` on every call, so the ticker-specific caveat elsewhere in this guide — `gsap.ticker.add` surviving a `gsap.context` revert — doesn't apply; there is no ticker subscription here to separately remove. What matters is exactly what `destroy()` already does: cancel `frame` before removing the listeners, so no already-queued frame can call `stampSmudgeAt` again after the listeners that would have fed it are gone.
