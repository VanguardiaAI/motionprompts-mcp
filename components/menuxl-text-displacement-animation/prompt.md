# Text Displacement Cursor Repel (letters & words flee the cursor)

## Goal
Build a full-viewport dark typographic page where **two giant headings and a justified paragraph are split into individual letters (headings) and words (paragraph), and every fragment is elastically pushed away from the mouse cursor: any fragment whose original center lies within a 150px radius of the cursor gets a displacement force pointing radially away from the mouse, scaling linearly up to 300px at zero distance, and every fragment eases toward its target each frame with per-element lerp smoothing (factor 0.1), so text bulges away from the cursor and springs softly back to place when the mouse leaves**. The star effect is this smooth repel-and-settle displacement field over live text.

## Tech
Vanilla HTML/CSS/JS with an ES module script (`<script type="module" src="./script.js">`). **No GSAP, no plugins, no Lenis, no libraries at all** — the entire effect is manual DOM text splitting, one `mousemove` listener, per-element linear interpolation (lerp), and an infinite `requestAnimationFrame` loop writing inline CSS `transform: translate(x, y)`. There is no scroll interaction.

## Layout / HTML
```
div.container                      (full-viewport flex stage)
  h1.anime-header                  "one subscription"
  p.anime-text                     (long justified paragraph, see text below)
  h1.anime-header                  "endless web design"
```
Use this exact paragraph copy for `.anime-text` (a single `<p>`, no line breaks needed):

> Sharing all the sauce behind building dope interactive experiences and the finest websites that truly stand out. Recently, MotionpromptsPRO was introduced, a subscription-based service tailored to the needs of passionate web designers. As a PRO member, you gain exclusive access to source code for each tutorial and monthly website templates. These resources are carefully curated to support and inspire your creativity, helping you take your web design skills to the next level. MotionpromptsPRO opens up a realm of opportunities for professional growth and empowers you to bring your ideas to life with ease. Delve into coding without clutter. Access the source code for every tutorial published on the Motionprompts YouTube channel and build elegant website components effortlessly. Take the fast lane to mastery. Each month, you'll receive a fresh complete responsive website template. Inspired by award winning web experiences, these templates allow you to build standout websites without starting from scratch, serving as the perfect foundation for your next project.

The markup starts as plain text — JS replaces the text content of all three elements with `<span>` fragments at runtime (see effect section).

## Styling
- `* { margin:0; padding:0; box-sizing:border-box; user-select:none; }` — text must NOT be selectable (the cursor sweeps across it constantly).
- `body { background-color:#1a1a1a; color:#fff; font-family:"TWK Lausanne", monospace; }` — near-black page, white text. "TWK Lausanne" is a commercial font that is not loaded, so keep the declaration exactly as-is and let it fall back to the generic **monospace** system font (that fallback IS the intended look).
- `.container { position:relative; width:100vw; height:100vh; padding:2em; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:4em; overflow:hidden; }` — heading / paragraph / heading stacked and centered with 4em gaps; displaced fragments that overshoot the viewport get clipped.
- `.anime-text { font-size:16px; font-weight:400; line-height:1.25; text-align:justify; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }`
- `.anime-header { font-size:10vw; font-weight:400; }` — the two headings scale with the viewport (huge, roughly one line each).
- `.word { position:relative; margin-right:0.75em; margin-bottom:0.5em; display:inline-block; will-change:transform; }` — paragraph fragments.
- `.letter { position:relative; display:inline-block; will-change:transform; }` — heading fragments (no margins; real space text nodes separate the words).

## The effect (exhaustive — vanilla JS, mousemove + lerp + rAF)

### Entry point & calls
On DOM ready, run one generic function twice:
```js
animateTextElements(".anime-text", "words");
animateTextElements(".anime-header", "letters");
```
`animateTextElements(selector, splitBy)` loops over ALL elements matching the selector (so both `h1.anime-header` are handled by the same call) and, per element, performs the split, position capture, mouse tracking and rAF loop described below.

Bootstrapping: since the script is a deferred ES module, use the robust pattern — define an `init` that does the two calls, then:
```js
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
```

### 1. Manual text splitting (no SplitText — hand-rolled)
For each target element:
- **`splitBy === "words"`** (the paragraph): `element.textContent.trim().split(/\s+/)` → array of words. Element type/class: `word`.
- **`splitBy === "letters"`** (the headings): split into words the same way, then flatten each word into its individual characters, pushing a literal `" "` entry between words (after every word except the last). Element type/class: `letter`.

Then clear the container (`textContent = ""`) and rebuild it:
- For each entry, create a `<span>` with class `word` or `letter` and the fragment as text, append it to the container.
- **Spaces are plain text nodes, never spans, never animated:** in letters mode, when the entry is `" "`, append `document.createTextNode(" ")` and skip it (no tracking object). In words mode, append a `createTextNode(" ")` after every word span except the last.
- For every created span, push a tracking object into an `animatedElements` array:
  ```js
  { element: span, originalX: 0, originalY: 0, currentX: 0, currentY: 0, targetX: 0, targetY: 0 }
  ```

### 2. Original-position capture (once, 100ms after split)
Inside a `setTimeout(..., 100)` (lets layout settle), for each tracked span read `getBoundingClientRect()` and store its **center in viewport coordinates**:
```js
originalX = rect.left + rect.width / 2;
originalY = rect.top + rect.height / 2;
```
and reset `currentX/Y` and `targetX/Y` to 0. These originals are measured **once and never re-measured** — no resize/scroll recalculation (the layout is a static 100vh page).

### 3. Mouse tracking — the repel field
A `document`-level `mousemove` listener updates every element's target each time the mouse moves, using these exact constants:
```js
const radius = 150;           // px — influence radius around the cursor
const maxDisplacement = 300;  // px — force at distance 0
```
For each tracked element:
```js
const dx = originalX - mouseX;          // vector FROM the cursor TO the element
const dy = originalY - mouseY;
const distance = Math.sqrt(dx * dx + dy * dy);

if (distance < radius) {
  const force = (1 - distance / radius) * maxDisplacement;  // linear falloff: 300 at 0px → 0 at 150px
  targetX = (dx / distance) * force;    // normalized direction × force → pushed AWAY from cursor
  targetY = (dy / distance) * force;
} else {
  targetX = 0;                          // outside the radius → spring back home
  targetY = 0;
}
```
Key semantics: the distance test uses the **original** (rest) center, not the displaced position — so an element that has been pushed out of the radius keeps being driven while the cursor stays near its home spot, and elements can never be "chased" indefinitely.

### 4. rAF render loop — lerp smoothing
An infinite `requestAnimationFrame` loop (started immediately, per container) eases every element toward its target with **lerp factor 0.1**:
```js
const lerpFactor = 0.1;
currentX += (targetX - currentX) * lerpFactor;
currentY += (targetY - currentY) * lerpFactor;
element.style.transform = `translate(${currentX}px, ${currentY}px)`;
```
This single loop produces both halves of the motion: the springy push-away while the cursor is near (targets jump on every mousemove, positions catch up smoothly) and the soft settle back to `translate(0, 0)` when the cursor leaves the radius (targets snap to 0, positions decay exponentially). No easing curves, no durations — the feel comes entirely from the 0.1 lerp at display refresh rate.

### Timeline summary (there is no timeline)
No GSAP, no tweens, no ScrollTrigger, no SplitText, no CustomEase. Trigger is `mousemove` only; motion model is per-frame exponential smoothing (`current += (target − current) × 0.1`) applied to `transform: translate()` on every letter/word span, at all times, forever.

## Assets / images
**None.** The component is pure typography on a flat `#1a1a1a` background. No images, no icons, no external fonts to load.

## Behavior notes
- Runs on any viewport (no desktop gate), but it is a mouse-driven effect — on touch devices nothing moves. No `prefers-reduced-motion` branch.
- The rAF loop never stops; with target 0 and lerp 0.1 the transforms decay to ~0 and idle cost is negligible.
- Because original centers are captured once at load (viewport coords) and the page is a fixed 100vh/100vw flex layout with `overflow:hidden`, there is no scrolling and no need to re-measure.
- The paragraph is `text-align: justify` with inline-block `.word` spans (0.75em right / 0.5em bottom margins) plus real spaces — expect a slightly airy, grid-like word spacing; that is intentional.
- Heading spaces are unstyled text nodes between `.letter` spans, so word gaps in the headings never displace.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--accent`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already returns its own teardown: `mount` splits `.anime-text` into `.word` spans and `.anime-header` into `.letter` spans via `splitTextElements`, captures each fragment's rest position off `getBoundingClientRect()` a fixed delay after mount, wires one `document`-level `mousemove` listener that recomputes every fragment's target displacement, starts the `alive`/`frame` `requestAnimationFrame` loop that lerps current position toward target and writes the inline `transform`, and returns a function that flips `alive` off, cancels the frame, clears the measurement timer, removes the listener, and — the step most hand-rolled splitters skip — walks `restores` to put each container's original child nodes back exactly as `splitTextElements` found them. What the file adds on top, and what has nothing to do with React, is the `window.MP` dispatch at the bottom that decides whether this catalogue's own editor drives `mount` with live config or the published page just boots it once with `DEFAULTS`.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Call `mount()` without wiring its return value up as the effect's own cleanup, and the second mount runs `splitTextElements` again on top of the first mount's already-split `.anime-text`/`.anime-header` — that step alone is harmless, since it clears and rebuilds from what it reads — but now two `animatedElements` arrays exist, two `mousemove` listeners sit on `document`, and two `requestAnimationFrame` loops are lerping: one visibly, one into spans the second split already tore out of the document, wasting a frame's work forever. It will not reproduce in a production build, because only development does the double mount.

*(1) The entry point* — the file's own guard is `dcl-guarded`: it checks `window.MP` first, and otherwise checks `document.readyState` before subscribing to `DOMContentLoaded`, falling back to calling `boot` immediately if the document has already loaded. Delete the whole dispatch, `window.MP` branch included — that hook belongs to this catalogue's visual editor, not to a React host — and call `mount` straight from a `useEffect` with an empty dependency array, keeping its return value as the cleanup:

```jsx
useEffect(() => {
  return mount({ radius, displacement, falloff, lerpFactor });
}, []);
```

Every field `mount` reads off `config` — radius, displacement, falloff, the smoothing factor — already falls back to its own default internally through the `num(value, fallback)` helper, so partial or absent props are safe to pass; there is no `{ ...DEFAULTS, ...props }` merge to remember at the call site the way some other `mount`-shaped components in this catalogue require.

*(2) Element lookups* — `splitTextElements` resolves its targets with `document.querySelectorAll(selector)` against `.anime-text` and `.anime-header`. Give the component a root `ref`, render the two headings and the paragraph inside it, and scope both calls to that ref instead of `document`. During the StrictMode remount two copies of the subtree exist for an instant, and an unscoped query can split the copy that is on its way out instead of the one staying mounted.

*(3) Cleanup* — this is the rare vanilla effect that already ships a correct teardown; port every piece of it, because each one guards a distinct accumulation:

- The `alive`/`frame` pair drives the self-scheduled animation loop. Setting `alive` to false alone does not stop a frame already scheduled from firing once more — that is why the source also keeps the id `requestAnimationFrame` returned and calls `cancelAnimationFrame` on it. Drop either half and a stray frame writes one more `transform` after teardown.
- The measurement timer fires a fixed delay after mount to read `getBoundingClientRect()` on every fragment. If a StrictMode unmount lands inside that window and the cleanup forgets to clear it, the callback still fires — against spans the cleanup's `restores` step has already detached from the document — and `getBoundingClientRect()` on a detached node returns a zero rect, so every fragment's rest position collapses to the viewport's top-left corner instead of its real spot on the page.
- The `mousemove` listener is bound to `document`, not to the root ref, because the repel field has to answer to the cursor anywhere on the page, not only while it is over the text. That means the scoping fix in `(2)` does not touch it, and it still has to be removed with the same function reference regardless of how the element lookups get scoped.
- `restores` — each container's original `childNodes`, captured before the split — has to be reappended on teardown, and not only for tidiness. `.anime-text` and `.anime-header` are elements your JSX renders, so their children are also what React's own fiber tree believes is there. Leaving them full of injected `.word`/`.letter` spans after cleanup is harmless as long as nothing ever re-renders those two elements again, but skip the restore and let some later reconciliation touch their children — a parent re-render, a key change — and React will try to remove or update text nodes it no longer recognizes, which surfaces as a `removeChild`-style DOM exception, not a quiet visual glitch.
