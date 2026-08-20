---
slug: infinite-horizontal-scroll
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Infinite Horizontal Scroll

## Goal

Build a full-page, seamlessly looping horizontal scroll experience: a row of 8 editorial panels that scrolls sideways forever in either direction. Vertical mouse-wheel deltas (and horizontal touch drags) are converted into smooth, lerp-eased horizontal movement of a giant flex strip. Cloned copies of the panel sequence on both sides make the loop invisible, and a fixed progress bar plus a percentage counter track the position within one loop (0–100).

## Tech

Vanilla HTML/CSS/JS with an ES module script (`<script type="module" src="./script.js">`). **No GSAP and no external libraries are needed** — the entire effect is a hand-rolled `lerp` + `requestAnimationFrame` loop with native `wheel` / `touch` event listeners. Do not import gsap or lenis.

## Layout / HTML

Everything lives inside a fixed, viewport-sized container that hides overflow:

```
.container                     (fixed wrapper)
├── .progress-bar              (empty div, fixed top bar)
├── .progress-counter          (fixed bottom-right) > h1 with initial text "0"
└── .scroller                  (the horizontal flex strip)
    ├── section.intro          h1 "Once You Start Scrolling, There’s No Way Out!"
    │                          (note the curly typographer’s apostrophe ’ in "There’s", not a straight ')
    │                          h2 "What If Your Website Could Scroll Forever?"
    ├── section.hero-img       > img (full-bleed photo)
    ├── section.header         h1 "Traversing the frontier of digital evolution, crafting the future."
    ├── section.about          > .row > .copy (two <p> of futuristic studio copy)
    │                                > .img > img
    │                          then h1 "Future Architectonics"
    ├── section.banner-img     > img (full-bleed photo)
    ├── section.story          four h1s: "Digital Alchemy", "Neoteric Identities",
    │                          "Cinematic Realities", "Symphonics"
    ├── section.concept-img    > img (full-bleed photo)
    └── section.outro          h1 "horizons.com"
```

The two `.about` paragraphs are short marketing copy about engineering next-generation digital experiences (2–3 sentences each; any similar futuristic-studio prose works).

## Styling

- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; user-select: none; }`.
- **Typography — read carefully; the fonts are deliberately NOT loaded**
  - None of the named webfonts below are bundled or linked: there is **no `@font-face`, no `<link>`, and no import** for any font. This is intentional and must be preserved — do NOT add a Google Fonts `<link>`, an `@font-face`, or a self-hosted font. The named families simply never resolve, so the browser substitutes its **default serif** (a Times-like face) for every heading and paragraph. That default serif — rendered at **normal letter width, NOT condensed** — is exactly what the original demo shows and what the reproduction must match.
  - `h1`: `font-family: "Druk Condensed", serif`. "Druk Condensed" is the *intended* ultra-condensed display face, but because it is never loaded the giant headings actually render in the browser's **default serif at normal width**. Keep the `, serif` fallback (or leave the family bare) and **never** substitute a sans fallback such as `"Arial Narrow"`, `"Impact"`, or `sans-serif` — a sans headline is the single biggest divergence from the original. Other h1 properties: `font-size: 15vw`, `font-weight: lighter`, `text-transform: uppercase`, `line-height: 0.8`, `padding-top: 0.2em`.
  - `h2`: `font-family: "Saans TRIAL"` (likewise unbundled → falls back to the same **default serif**; do not add a sans/Helvetica fallback), `font-size: 30px`, `font-weight: 700`.
  - `p`: `font-family: "Saans TRIAL"` (same unbundled family → default serif), `font-size: 15px`, `font-weight: 500`.
- `img { width: 100%; height: 100%; object-fit: cover; }`.
- `.container`: `position: fixed; top: 0; left: 0; width: 100vw; height: 100svh; overflow: hidden;`.
- `.progress-bar`: `position: fixed; top: 0; left: 0; width: 100vw; height: 10px; transform: scaleX(0); transform-origin: center left; background-color: #fff; will-change: transform; z-index: 2;`.
- `.progress-counter`: `position: fixed; bottom: 1em; right: 2.5em; color: #fff; z-index: 2;` (its `h1` inherits the giant 15vw display style).
- `.scroller`: `position: relative; width: 700vw; height: 100svh; display: flex; will-change: transform; transform: translateX(0);` (the width is overridden in px by JS after cloning).
- Every `section`: `position: relative; height: 100svh; display: flex; justify-content: center; align-items: center;`.
- Section widths: `.intro, .hero-img, .about, .banner-img, .story, .outro { width: 75vw; }` and `.header, .concept-img { width: 100vw; }`.
- Panel colors:
  - `.intro, .header`: `padding: 2em; background-color: #000; color: #fff;`.
  - `.about`: `padding: 4em 3em 1em 2em; background-color: #eb001b;` (vivid red), `color: #fff`.
  - `.story`: `padding: 4em 2em 2em 2em; background-color: #f69e1c;` (amber).
  - `.outro`: `background-color: #fe5e00;` (bright orange).
- `.about, .intro, .header, .story` use `display: flex; justify-content: space-between; align-items: flex-start;`, and `.intro, .about, .story` are `flex-direction: column` (so the big heading sits at the bottom of `.about`, and the intro's h1/h2 spread top/bottom).
- `.header h1 { font-size: 15.75vw; }` and `.story h1 { padding-top: 0; }`.
- `.about .row`: `display: flex; justify-content: space-between;`; each `p` inside is `width: 50%; margin-bottom: 1em;`; `.copy { flex: 3; }`; `.img { flex: 2; aspect-ratio: 7/5; }`.

## Scroll engine (the core effect — implement exactly)

All logic runs inside `DOMContentLoaded`. Constants:

- `smoothFactor = 0.05` — the lerp interpolation factor used for both the strip position and the progress bar.
- `touchSensitivity = 2.5` — multiplier applied to touch drag deltas.
- `bufferSize = 2` — number of cloned sequence copies on EACH side of the originals.
- `lerp(start, end, factor) => start + (end - start) * factor`.

State: `targetScrollX`, `currentScrollX`, `isAnimating` flag, `currentProgressScale`, `targetProgressScale`, `lastPercentage`, plus touch state (`isDown`, `lastTouchX`, `touchVelocity`, `lastTouchTime`).

### 1. Setup (`setupScroll`)

1. Remove any existing `.clone-section` elements, then collect the original `section`s.
2. Compute `sequenceWidth` = the sum of each original section's computed pixel width (`parseFloat(getComputedStyle(section).width)`).
3. Append full cloned copies of the whole sequence: `bufferSize` copies before-equivalents and `bufferSize` copies after (loop `i` from `-bufferSize` to `-1`, then `1` to `bufferSize`; for each, clone every section with `cloneNode(true)`, add class `clone-section` and attribute `data-clone-index="{i}-{index}"`, and append to `.scroller`). The DOM order ends up: originals first, then all clones appended after — this still works because the strip is translated to the middle copy.
4. Set `scroller.style.width = sequenceWidth * (1 + bufferSize * 2) + "px"` (5 sequence copies total).
5. Initialize `targetScrollX = currentScrollX = sequenceWidth * bufferSize` and apply `scroller.style.transform = translateX(-currentScrollX px)`. Return `sequenceWidth`.

### 2. Boundary wrap (`checkBoundaryAndReset`)

Keeps the strip centered on the middle copy so the loop never ends:

- If `currentScrollX > sequenceWidth * (bufferSize + 0.5)` → subtract `sequenceWidth` from BOTH `targetScrollX` and `currentScrollX`, re-apply the transform immediately, return `true`.
- If `currentScrollX < sequenceWidth * (bufferSize - 0.5)` → add `sequenceWidth` to both, re-apply, return `true`.
- Otherwise return `false`. The returned flag is used to force-snap the progress bar (no lerp glitch across the wrap).

### 3. Progress (`updateProgress(sequenceWidth, forceReset)`)

- `currentPosition = (currentScrollX - sequenceWidth * bufferSize) % sequenceWidth`; `percentage = currentPosition / sequenceWidth * 100`; if negative, `percentage = 100 + percentage`.
- Set the counter text to `Math.round(percentage)` and `targetProgressScale = percentage / 100`.
- Wrap detection: if (`lastPercentage > 80 && percentage < 20`) or (`lastPercentage < 20 && percentage > 80`) or `forceReset` → snap instantly: `currentProgressScale = targetProgressScale` and apply `scaleX(currentProgressScale)` directly (skipping the lerp for that jump).
- Store `lastPercentage = percentage`.

### 4. Animation loop (`animate(sequenceWidth, forceProgressReset = false)`)

Each frame:

1. `currentScrollX = lerp(currentScrollX, targetScrollX, 0.05)` and apply `translateX(-currentScrollX px)` to the scroller.
2. Call `updateProgress`.
3. Unless `forceProgressReset` is true for this frame, `currentProgressScale = lerp(currentProgressScale, targetProgressScale, 0.05)` and apply `scaleX(currentProgressScale)` to the progress bar.
4. If `Math.abs(targetScrollX - currentScrollX) < 0.01` set `isAnimating = false` and stop; otherwise `requestAnimationFrame(() => animate(sequenceWidth))` (subsequent frames run without the force flag).

On load: run `setupScroll()`, then `updateProgress(sequenceWidth, true)` and apply the initial `scaleX`.

### 5. Input handlers (all on `.container`)

- **Wheel** (`{ passive: false }`): `e.preventDefault()`, then `targetScrollX += e.deltaY` (vertical wheel → horizontal movement, 1:1). Call `checkBoundaryAndReset`; if not already animating, set `isAnimating = true` and start `requestAnimationFrame(() => animate(sequenceWidth, needsReset))`.
- **touchstart**: set `isDown = true`, record `lastTouchX = e.touches[0].clientX` and `lastTouchTime = Date.now()`, and kill inertia with `targetScrollX = currentScrollX`.
- **touchmove**: if not down return; `e.preventDefault()`; `touchDelta = lastTouchX - currentTouchX`; `targetScrollX += touchDelta * touchSensitivity` (2.5×). Track velocity: with `timeDelta = now - lastTouchTime`, if positive, `touchVelocity = (touchDelta / timeDelta) * 15`. Update `lastTouchX` / `lastTouchTime`, run the boundary check, and kick the animate loop like the wheel handler.
- **touchend**: `isDown = false`. If `|touchVelocity| > 0.1`, apply a momentum fling: `targetScrollX += touchVelocity * 20`, then start a rAF decay loop — each frame `touchVelocity *= 0.95`, and while `|touchVelocity| > 0.1` keep adding `touchVelocity` to `targetScrollX`, run `checkBoundaryAndReset`, and if it wrapped call `updateProgress(sequenceWidth, true)`; continue via `requestAnimationFrame`.

## Assets / images

4 photographs, referenced from the HTML:

1. **Hero panel image** — a striking full-bleed editorial/architectural photo filling a 75vw × full-viewport-height panel (roughly 3:4 to 4:5 of viewport, cropped with `object-fit: cover`).
2. **About inline image** — a photo displayed at a 7:5 landscape aspect ratio next to the two text columns inside the red about panel.
3. **Banner panel image** — a second full-bleed photo filling a 75vw × full-height panel.
4. **Concept panel image** — a third full-bleed photo filling a 100vw × full-height panel.

Any cohesive set of moody, futuristic/editorial photographs works; they are cropped by the panels.

## Behavior notes

- There is NO native page scroll: the document never scrolls; the fixed container intercepts wheel/touch and drives `translateX` on the strip. Body needs no extra height.
- The loop is bidirectional and endless — scrolling backward from the start lands on the end of the sequence with no visible jump.
- The counter and bar wrap from 100 back to 0 (and vice versa); the snap logic prevents the bar from animating backward across the seam.
- Works on touch devices via the drag + momentum handlers; desktop uses the wheel.
- `100svh` (not `100vh`) is used for all heights to behave correctly in mobile browsers.
- **Fonts (do not "improve" this):** no webfonts are loaded, so all text — including the giant 15vw headings — renders in the browser's default **serif** at normal width. Reproduce this exactly. Declare the family names as given (`"Druk Condensed", serif` / `"Saans TRIAL"`) but do not link, import, or `@font-face` any font, and never fall back to a sans/condensed face; adding a font or a sans fallback makes the reproduction diverge from the original.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/infinite-horizontal-scroll/img1.jpg
https://motionprompts.dev/c/infinite-horizontal-scroll/img2.jpg
https://motionprompts.dev/c/infinite-horizontal-scroll/img3.jpg
https://motionprompts.dev/c/infinite-horizontal-scroll/img4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--chalk`, `--azur`, `--azur-light`, `--pine`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: a `mount(config)` factory that reaches into the
page with four `document.querySelector` calls (`.container`, `.scroller`, `.progress-counter h1`,
`.progress-bar`), clones the eight-section sequence into four extra copies — two on each side,
via `bufferSize` — so the loop reads as seamless, and drives two of its own
`requestAnimationFrame` loops: the position loop that lerps `currentScrollX` toward `targetScrollX`
every frame while a scroll or drag is in flight, and the separate momentum-decay loop `touchend`
starts on release. Unusually for this catalogue, the script already hands you a teardown: `mount`
closes over `container`, `scroller`, both rAF ids and an `alive` flag, and its return value cancels
both loops, removes the four listeners, drops every `.clone-section` this call appended, and
restores the pre-mount inline styles and counter text. That is exactly the shape `useEffect` wants
— a synchronous setup that returns its own synchronous cleanup — so most of what breaks other
components under React does not apply here by construction. What still breaks is what happens when
that contract only gets half-used.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. Write `useEffect(() => { mount(config); }, [])` without returning the value
`mount` gives back, and the simulated unmount has nothing to call: the first `mount()`'s listeners
and rAF loops stay alive while a second `mount()` call adds a second set on the same `.container`.
`setupScroll`'s own sweep of `.clone-section` nodes means the second mount at least starts by
deleting the first mount's clones before appending its own, so the DOM does not visibly double its
section count — but nothing sweeps event listeners or `requestAnimationFrame` ids the same way.
From then on every wheel notch drives two independent `targetScrollX`/`currentScrollX` pairs, each
lerping into the same shared `.scroller.style.transform`, and the strip visibly stutters between
two competing rates instead of gliding. It will not reproduce in a production build, because only
development runs the double mount.

*(1) The entry point* — The script checks `document.readyState` before subscribing to
`DOMContentLoaded`, then calls `mount(Object.assign({}, DEFAULTS))`; the `window.MP.register`
branch above it is this catalogue's own visual-editor integration and has nothing to port. The
guard exists to make the script safe to drop in late on a plain HTML page; `useEffect` already runs
after the DOM is committed, so the guard, the listener and the `window.MP` check are all dead
weight in React. Delete them and call `mount` directly inside a `useEffect` with an empty
dependency array, keeping its return value as the cleanup:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS }, rootRef.current);
  return destroy;
}, []);
```

*(2) Element lookups* — The four `document.querySelector` calls inside `mount` assume there is
exactly one `.container` and one `.scroller` in the whole document. That is true only because this
script currently owns the whole page; drop this component onto a page that renders a second
instance, or next to any unrelated element that happens to carry one of these four class names, and
`mount` silently binds to whichever match comes first in document order — a second instance's
`mount()` call would end up driving the first instance's strip instead of its own. Give `mount` a
second `root` parameter and change each lookup to `root.querySelector(...)`, scoped to the ref on
this component's outermost element.

*(3) Cleanup* — There is nothing to build here that is not already built: `destroy` cancels
`rafId` and `decayRafId`, clears `alive` so a frame already in flight becomes a no-op, removes the
`wheel`/`touchstart`/`touchmove`/`touchend` listeners from `container`, and un-clones every section
it appended. React's only new requirement is discipline around calling it: never call `mount` again
— from a resize handler, a prop-change effect, anywhere — without having called the previous
`mount`'s `destroy` first. If this component grows a prop for, say, `touchSensitivity` or
`smoothFactor`, re-run the whole effect (`destroy` the old instance, `mount` a new one) on that
prop's change rather than reaching into the running closure to patch a single value — `mount` does
not expose one.
