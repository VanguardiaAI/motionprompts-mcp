# Photo Dump Scroll Scatter — Pinned Ring of Cards that Fly In and Out

## Goal
Build a full-screen, pinned "photo dump" gallery. A dark section pins in place for **six viewport heights of scroll**, split into **four segments**. In each segment, **15 rotated photo cards** are scattered in a loose ring around a **centered serif heading**. Every time you cross a segment boundary, the whole set re-shuffles: the current 15 cards **fly out to their nearest screen edge** (accelerating away) while 15 fresh cards from the **next image set fly in from the edges** (decelerating into place) with a half-second overlap, and the heading **cross-fades** to a new phrase. The star effect is this choreographed scatter-out / scatter-in card swap driven by scroll position while the section stays pinned.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**, and `lenis` (npm) for smooth scroll. No other plugins, no framework:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```
Register once: `gsap.registerPlugin(ScrollTrigger);`. Run everything inside `document.addEventListener("DOMContentLoaded", …)`. Must run in a fresh Vite + npm project. Ship one `index.html` (`<link rel="stylesheet" href="./styles.css">` and `<script type="module" src="./script.js">`), one `styles.css`, one ES-module `script.js`.

## Layout / HTML
Three stacked full-screen `<section>`s. Class names are load-bearing — the JS/CSS query them. The cards are **not** in the markup; the JS creates and injects all of them into `.gallery`.

```html
<section class="intro">
  <h1>Time loosens its grip and the stack begins to shift</h1>
</section>

<section class="gallery">
  <h1></h1>
</section>

<section class="outro">
  <h1>Eventually, the stack settles and the scroll continues</h1>
</section>
```

- `.intro` and `.outro` are simple dark panels with a centered heading each — they exist only to give scroll runway before and after the pinned gallery.
- `.gallery > h1` starts **empty**; the JS fills its text from the headings array and animates it.
- All `.card` elements are generated at runtime and appended into `.gallery` (see GSAP section).

## Styling
Font (Google Fonts): **Instrument Serif** (import italic axis too):
```css
@import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap");
```

Palette (CSS variables on `:root`):
- `--base-100: #fff` — heading text color (white).
- `--base-200: #4a4a4a` — the card's border color (mid-gray frame).
- `--base-300: #141414` — the `.gallery` background (near-black).
- `--base-400: #0f0f0f` — the `.intro` / `.outro` background (slightly darker near-black).

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { font-family:"Instrument Serif", sans-serif; }`
- `h1 { font-size: clamp(3rem, 5vw, 7vw); font-weight:500; line-height:0.9; letter-spacing:-0.025rem; }`

Sections:
- `section { position:relative; width:100%; height:100svh; display:flex; justify-content:center; align-items:center; color:var(--base-100); overflow:hidden; }`
- `section h1 { width:45%; text-align:center; will-change:opacity; z-index:2; }` — the heading is constrained to 45% width, centered, and sits **above** the cards (cards have no z-index, so `z-index:2` keeps the heading on top).
- `.intro, .outro { background-color:var(--base-400); }`
- `.gallery { background-color:var(--base-300); }`

Card (critical — this is the exact box the JS positions):
```css
.card {
  position: absolute;
  width: 250px;
  height: 300px;
  border-radius: 1rem;
  border: 0.5rem solid var(--base-200);
  box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.25);
  will-change: transform;
  overflow: hidden;
}
.card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}
```
Cards are `position:absolute` inside `.gallery` and are placed entirely with inline `left`/`top`/`rotation` written by GSAP — never by CSS coordinates. Each is a fixed **250×300** portrait card (roughly 5:6) with a thick gray frame and rounded corners.

Responsive:
- `@media (max-width:1000px) { section h1 { width:100%; padding:2rem; } }` — heading relaxes to full width on narrow screens.

## GSAP effect (be exhaustive)

### Smooth scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### Config constants
```js
const CONFIG = {
  cardCount: 15,
  cardWidth: 250,
  cardHeight: 300,
  animationDuration: 0.75,
  animationOverlap: 0.5,
  headingFadeDuration: 0.5,
  headings: [
    "Order is temporary while you're passing through",
    "Memories shuffle like cards in an endless deck",
    "Each moment scatters as another takes its place",
    "The fragments float before settling once more",
  ],
};
```

### Viewport + state
```js
let viewport = {
  centerX: window.innerWidth / 2,
  centerY: window.innerHeight / 2,
  rangeMin: Math.min(window.innerWidth, window.innerHeight) * 0.35,
  rangeMax: Math.min(window.innerWidth, window.innerHeight) * 0.7,
};
let state = { activeCards: [], currentSection: 0, isAnimating: false };
```
`updateViewport()` recomputes these four values from the current window size. `rangeMin`/`rangeMax` are the inner and outer radii of the scatter ring (35% and 70% of the smaller viewport dimension).

### Ring placement — `createCards(setNumber)`
Creates and returns an array of **15** card objects. For each `i` (0–14):
1. Make a `div.card`, give it a child `<img>` whose `src` is `/c/poly-app-photo-dump/set${setNumber}/img${i + 1}.jpg` (image sets numbered 1–4; each set has 15 images).
2. Pick a random polar position around the viewport center:
   ```js
   const angle  = Math.random() * Math.PI * 2;               // 0..2π
   const radius = viewport.rangeMin + Math.random() * (viewport.rangeMax - viewport.rangeMin);
   const centerX = viewport.centerX + Math.cos(angle) * radius;
   const centerY = viewport.centerY + Math.sin(angle) * radius;
   ```
3. Place the card so its **center** lands on `(centerX, centerY)`, with a random tilt:
   ```js
   gsap.set(card, {
     left: centerX - CONFIG.cardWidth / 2,
     top:  centerY - CONFIG.cardHeight / 2,
     rotation: Math.random() * 50 - 25,     // -25°..+25°
   });
   ```
4. Append to `.gallery`, and push `{ element: card, centerX, centerY }` (remember each card's home ring point for later).

### Nearest-edge target — `getEdgePosition(centerX, centerY)`
Given a card's home center, compute an **off-screen** `{x, y}` (used directly as `left`/`top`) on whichever screen edge is closest to that point:
```js
const distances = {
  left:   centerX,
  right:  window.innerWidth  - centerX,
  top:    centerY,
  bottom: window.innerHeight - centerY,
};
const minDistance = Math.min(...Object.values(distances));
const offsetVariation = () => (Math.random() - 0.5) * 400;   // -200..+200 jitter
```
- Nearest = **left** → `x: -300 - Math.random() * 200` (i.e. -300..-500), `y: centerY - cardHeight/2 + offsetVariation()`.
- Nearest = **right** → `x: window.innerWidth + 50 + Math.random() * 200`, `y: centerY - cardHeight/2 + offsetVariation()`.
- Nearest = **top** → `x: centerX - cardWidth/2 + offsetVariation()`, `y: -400 - Math.random() * 200`.
- Nearest = **bottom** (fallthrough) → `x: centerX - cardWidth/2 + offsetVariation()`, `y: window.innerHeight + 50 + Math.random() * 200`.
So a card exits toward, and enters from, the edge it is nearest to, with vertical/horizontal jitter so the flock doesn't move in lockstep.

### The card swap — `animateCards(exitingCards, enteringCards)` (the star effect)
Returns a single `gsap.timeline()` built as follows:

**Exiting cards** — for each currently-visible card, tween it OUT to its nearest edge, added at position **`0`**:
```js
tl.to(element, {
  left: targetEdge.x,                 // getEdgePosition(centerX, centerY)
  top:  targetEdge.y,
  rotation: Math.random() * 180 - 90, // -90°..+90° tumble
  duration: 0.75,                     // CONFIG.animationDuration
  ease: "power2.in",                  // accelerate away
  onComplete: () => element.remove(), // detach from DOM when off-screen
}, 0);
```

**Entering cards** — for each of the 15 new cards, first snap it to an edge (its `getEdgePosition` from its own home center), then tween it IN to its home ring position, added at position **`0.5`** (`CONFIG.animationOverlap`):
```js
gsap.set(element, {                    // start off-screen at the edge
  left: targetEdge.x,
  top:  targetEdge.y,
  rotation: Math.random() * 180 - 90,
});
tl.to(element, {
  left: centerX - CONFIG.cardWidth / 2,   // land centered on its ring point
  top:  centerY - CONFIG.cardHeight / 2,
  rotation: Math.random() * 50 - 25,      // settle to -25°..+25°
  duration: 0.75,                         // CONFIG.animationDuration
  ease: "power2.out",                     // decelerate into place
}, 0.5);                                   // begins halfway through the exit
```
Net timing: exit tweens run t=0→0.75; enter tweens run t=0.5→1.25, so the new cards start streaming in while the old ones are still leaving — a continuous cross-flow. Note the cards animate **`left`/`top`** (layout position), plus `rotation` (transform).

### Heading cross-fade — `animateHeading(newText)`
Returns a timeline that fades the gallery heading out, swaps its text, and fades it back:
```js
gsap.timeline()
  .to(galleryHeading, { opacity: 0, duration: 0.5, ease: "power2.inOut" })
  .call(() => { galleryHeading.textContent = newText; })
  .to(galleryHeading, { opacity: 1, duration: 0.5, ease: "power2.inOut" });
```
Total ~1.0s, running in parallel with the card swap.

### Segment mapping — `getSectionIndex(progress)`
```js
if (progress < 0.25) return 0;
if (progress < 0.5)  return 1;
if (progress < 0.75) return 2;
return 3;
```
Four equal quarters of the pinned scroll → sections 0,1,2,3 → image sets 1,2,3,4.

### The pinned ScrollTrigger
```js
ScrollTrigger.create({
  trigger: ".gallery",
  start: "top top",
  end: () => `+=${window.innerHeight * 6}`,   // pin for 6 viewport heights
  pin: true,
  pinSpacing: true,
  onUpdate: ({ progress }) => {
    if (state.isAnimating) return;                       // ignore updates mid-swap
    const targetSection = getSectionIndex(progress);
    if (targetSection === state.currentSection) return;  // only fire on a boundary crossing

    state.isAnimating = true;
    const newCards = createCards(targetSection + 1);      // build the next 15 cards (already at their ring spots)

    Promise.all([
      animateCards(state.activeCards, newCards).then(),   // swap cards
      animateHeading(CONFIG.headings[targetSection]).then(), // cross-fade heading
    ]).then(() => {
      state.activeCards = newCards;
      state.currentSection = targetSection;
      state.isAnimating = false;                          // unlock for the next boundary
    });
  },
});
```
Key behaviors: the section **pins in place** while you scroll six viewport heights; the swap is **not scrubbed** — crossing a quarter boundary triggers a self-contained ~1.25s animation once, and the `isAnimating` lock prevents overlapping swaps (fast scrolls just queue the next boundary until the current swap finishes). Because `createCards` injects the new set at its ring positions and `animateCards` immediately `gsap.set`s them to the edges, the incoming cards are only ever seen flying in from the edges.

### Initial paint
```js
state.activeCards = createCards(1);                 // set 1 scattered around center
galleryHeading.textContent = CONFIG.headings[0];    // first phrase
gsap.set(galleryHeading, { opacity: 1 });
```

### Resize handling — `reinitialize()`
```js
window.addEventListener("resize", () => {
  state.activeCards.forEach(({ element }) => element.remove());
  updateViewport();
  state.activeCards = createCards(state.currentSection + 1);  // rebuild current set at new ring
  ScrollTrigger.refresh();
});
```

## Assets / images
**60 photo cards total = 4 sets × 15 images.** Source images are **landscape-oriented photographs (≈4:3, wider than tall)**, but each is displayed in a fixed **250×300 portrait card with `object-fit: cover`** — so the middle vertical slice of each landscape shot is what actually shows; exact crop doesn't matter. File layout the JS expects: `set1/img1.jpg … set1/img15.jpg`, `set2/img1.jpg … set2/img15.jpg`, etc. No brands, logos, or text anywhere.

The photos are **general scenic / atmospheric stock-style imagery** rather than one tight subject per set — a loose mix of landscapes, cityscapes, and interiors that reads as a warm, cinematic "photo dump". Suggested roles by set:

- **Set 1 (segment 1)** — 15 scenic photographs (any cohesive-feeling grab bag).
- **Set 2 (segment 2)** — 15 mixed-subject atmospheric photos, loosely themed around **sky / flight and neon night cities**. Verified contents include: an **aerial view of a turquoise river meandering through bright-green grassland** under a pale blue sky (teal + green); an **aerial shot above a blanket of white cumulus clouds** with a clear blue sky above (white + soft blue); a **night sky with a bright moon and stars over dramatic clouds lit fiery red-orange** against deep navy; an **airplane silhouette flying across a blazing red-orange sunset sky**; a **sunset seen through an oval airplane window**, warm orange-and-blue sky over a low cloud layer; and several **neon-lit cyberpunk city streets at night/dusk** in magenta/purple tones — a glowing car on a wet foggy avenue, two figures beside a red-lit neon monolith, and a tree-lined boulevard leading to backlit neon towers. Dominant colors across the set span teals and greens, cool blues and whites, fiery reds and oranges, and electric magentas/purples — no single unifying palette.
- **Set 3 (segment 3)** — 15 scenic photographs (any cohesive-feeling grab bag).
- **Set 4 (segment 4)** — 15 scenic photographs (any cohesive-feeling grab bag).

If you have fewer than 15 per set, repeat images to fill each set.

## Behavior notes
- **Not scrubbed:** the pin holds the section; each segment crossing plays a one-shot card swap + heading cross-fade, gated by an `isAnimating` flag so swaps never overlap. Scrolling back up re-crosses boundaries and swaps in the appropriate set the same way.
- Heading always stays centered and on top (`z-index:2`); cards render beneath it.
- Cards are `position:absolute` and animated via `left`/`top` + `rotation`; keep `will-change:transform` on `.card` and `will-change:opacity` on the heading.
- `lagSmoothing(0)` + the function-based `end` keep the pin distance correct; `ScrollTrigger.refresh()` on resize plus `reinitialize()` re-derive ring positions for the new viewport.
- No SplitText, no CustomEase, no lerp/rAF loop, no Three.js — just ScrollTrigger pinning, Lenis smooth scroll, and per-boundary GSAP timelines.

## Images

This component ships with 60 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/poly-app-photo-dump/set1/img1.jpg
https://motionprompts.dev/c/poly-app-photo-dump/set1/img10.jpg
https://motionprompts.dev/c/poly-app-photo-dump/set1/img11.jpg
https://motionprompts.dev/c/poly-app-photo-dump/set1/img12.jpg
https://motionprompts.dev/c/poly-app-photo-dump/set1/img13.jpg
https://motionprompts.dev/c/poly-app-photo-dump/set1/img14.jpg
… 54 more under https://motionprompts.dev/c/poly-app-photo-dump/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-raised`, `--bone`, `--paper`, `--taupe`, `--ember`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here: two `Lenis` instances pulling on the same wheel, two pinned `ScrollTrigger`s on `.gallery` each claiming their own six-viewport-height scroll runway, and two independent `isAnimating` locks, each convinced it owns the boundary crossings — so a single scroll past the quarter mark can fire one instance's `onUpdate` while the other is still mid-swap, and you end up with two overlapping rings of 15 `.card` elements scattered under the same heading. The visible symptom is a doubled or stuck pin and a gallery that never fully clears between segments, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener body — the `isMobile` check, `CONFIG`, the `.gallery`/`.gallery h1` lookups, `viewport` and `state`, every helper (`updateViewport`, `getEdgePosition`, `createCards`, `animateHeading`, `animateCards`, `getSectionIndex`, `reinitialize`), the Lenis + ticker wiring, the initial `createCards(1)` paint, the `ScrollTrigger.create` pin, and the `resize` listener — never runs, no error, nothing to debug. Delete the listener and move that entire body, in the same order, into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `.gallery` is doing three jobs at once here: it's the `querySelector` target, the `ScrollTrigger` trigger, and the element every `.card` gets `appendChild`-ed into. Give the component a root `ref` on `<section className="gallery">`, pass `rootRef.current` as `trigger` instead of the class string, and append cards to `rootRef.current` instead of a fresh `document.querySelector(".gallery")` call. Keep a second ref for the `h1` and keep writing its text with `textContent` the way `animateHeading` already does — the fade-swap-fade is orchestrated by a GSAP timeline outside the render cycle, and routing it through `useState` would just re-introduce the same problem cards have: React re-rendering a subtree that GSAP is also mutating directly.

*(3) Cleanup* — `createCards`, `animateCards` and `animateHeading` build their tweens from inside `ScrollTrigger`'s `onUpdate`, which fires later, off a scroll event — not during the synchronous pass of the `gsap.context` factory. A plain `gsap.context(() => { ScrollTrigger.create(...) })` only sees the pin itself; every timeline a boundary crossing produces afterward is invisible to it. Register the swap as a named method instead, so calling it through the context retroactively adopts what it creates, and do the same for `reinitialize` since the `resize` listener calls it the same way, from outside the factory:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    self.add("swapSection", (targetSection) => {
      const newCards = createCards(targetSection + 1);
      return Promise.all([
        animateCards(state.activeCards, newCards).then(),
        animateHeading(CONFIG.headings[targetSection]).then(),
      ]).then(() => {
        state.activeCards = newCards;
        state.currentSection = targetSection;
        state.isAnimating = false;
      });
    });
    self.add("reinitialize", reinitialize);

    state.activeCards = createCards(1);
    ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top top",
      end: () => `+=${window.innerHeight * 6}`,
      pin: true,
      pinSpacing: true,
      onUpdate: ({ progress }) => {
        if (state.isAnimating) return;
        const targetSection = getSectionIndex(progress);
        if (targetSection === state.currentSection) return;
        state.isAnimating = true;
        ctx.swapSection(targetSection);
      },
    });
  }, rootRef);

  const onResize = () => { ctx.reinitialize(); ScrollTrigger.refresh(); };
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    ctx.revert();
    rootRef.current?.querySelectorAll(".card").forEach((el) => el.remove());
  };
}, []);
```

`state` and `viewport` stay exactly where the original script puts them — plain variables local to the effect, not `useState` or `useRef` — because nothing outside this effect ever reads them and each mount is meant to start from zero, the same way the original single page load does. That only holds if the cleanup actually empties `.gallery`, though: `ctx.revert()` kills whatever tween is in flight without letting it finish, so a card that was mid-flight out never reaches its `onComplete` and its `.remove()` never runs, and the batch of 15 cards `createCards` had just appended for the segment that was swapping in was never written to `state.activeCards` either — the swap only assigns it there after `Promise.all` resolves. Both batches are orphaned, and neither the revert nor the next mount's fresh `state` will ever find them again. The explicit `querySelectorAll(".card")` sweep in the cleanup above is what actually removes them; without it, a StrictMode remount (or a route away and back) leaves the previous run's frozen cards sitting under the next run's fresh ring.

**Lenis** — this component owns the only smooth-scroll instance the page needs, so create it inside the effect and `destroy()` it in the cleanup. `gsap.ticker.add((time) => lenis.raf(time * 1000))` is not covered by `ctx.revert()` — a ticker subscription is neither a tween nor a trigger — so keep that exact callback reference and pass it to `gsap.ticker.remove` before calling `lenis.destroy()`, or a tick already in flight calls `raf` on an instance that no longer exists. `gsap.ticker.lagSmoothing(0)` is a GSAP-wide setting, not a per-component one: leaving it patched after this component unmounts silently disables lag smoothing for every other GSAP animation running on the page afterward. Restore GSAP's own defaults (`gsap.ticker.lagSmoothing(500, 33)`) in the same cleanup.
