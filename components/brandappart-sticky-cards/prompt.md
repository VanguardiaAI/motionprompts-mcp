# Scroll-Pinned Sticky Cards Deck (3D tilt-off)

## Goal
Build a scroll-driven section that holds a **deck of four stacked cards** pinned in the middle of the viewport. As the user scrolls through the (long) pinned section, the **front card flies straight up while tilting back in 3D perspective (rotationX 0→35deg)**, and the cards stacked behind it **slide forward and scale up** to take the front position — one card handed off per scroll segment, in a continuous scrubbed loop. Smooth scroll via Lenis. There is an intro panel above and an outro panel below the pinned deck.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scroll. No other plugins, no framework — plain Vite-style module imports:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```
Register once: `gsap.registerPlugin(ScrollTrigger);`. Wrap all setup in a `DOMContentLoaded` listener.

## Layout / HTML
Three full-viewport `<section>`s in order — an intro, the pinned card deck, an outro:

```html
<section class="intro"><h1>Enter the Frame</h1></section>

<section class="sticky-cards">
  <div class="card" id="card-1">
    <div class="col"><p>Quiet Control</p><h1>Signal Drift</h1></div>
    <div class="col"><img src="…card-img-1" alt="" /></div>
  </div>
  <div class="card" id="card-2"> … id="card-2" … </div>
  <div class="card" id="card-3"> … </div>
  <div class="card" id="card-4"> … </div>
</section>

<section class="outro"><h1>Loop Complete</h1></section>
```

- **Four cards**, ids `card-1` … `card-4`. Each card has exactly **two `.col`** children: column 1 holds a small `<p>` eyebrow at the top and an `<h1>` title (the two are pushed apart top/bottom); column 2 holds a single `<img>`.
- Neutral fictional copy. Suggested per card — eyebrow / title:
  1. "Quiet Control" / "Signal Drift"
  2. "Fluid Structures" / "Skyline Drift"
  3. "Wired Thought" / "Neural Assembly"
  4. "Silent Repetition" / "Learning Loop"
- Intro `<h1>` "Enter the Frame", outro `<h1>` "Loop Complete".

## Styling
Import fonts:
```css
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100..900;1,100..900&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap");
```

Palette — four card background colors as CSS variables (all card text is `#fff`):
- `--base-1: #9d2fa9` (magenta/purple) → `#card-1`
- `--base-2: #daff22` (acid lime) → `#card-2`
- `--base-3: #ffdd33` (warm yellow) → `#card-3`
- `--base-4: #6b7847` (muted olive) → `#card-4`
- Deck section background: `#e3e3db` (warm off-white/greige). Intro & outro sections have no special background (default/transparent).

Typography:
- `h1`: `text-transform: uppercase; font-family: "Barlow Condensed", sans-serif; font-size: 3rem; font-weight: 800; line-height: 1;`
- `p`: `text-transform: uppercase; font-family: "DM Mono", monospace; font-size: 0.9rem;`

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`

Sections & cards (this is the structure the effect hangs on):
- `section { position:relative; width:100%; height:100svh; overflow:hidden; }`
- `.intro, .outro { display:flex; justify-content:center; align-items:center; }`
- `.sticky-cards { background-color:#e3e3db; perspective:1000px; }` — **the `perspective:1000px` on the deck container is essential**; it is what makes the per-card `rotationX` read as a real 3D tilt-back rather than a flat squash.
- `.sticky-cards .card { position:absolute; top:50%; left:50%; width:65%; height:60%; display:flex; justify-content:center; align-items:center; gap:1rem; padding:2.5rem; border-radius:1rem; color:#fff; transform-origin:center bottom; will-change:transform; }` — all four cards are absolutely stacked at the same center point; **`transform-origin:center bottom` matters** so the tilt-back pivots from the card's bottom edge (it hinges away like a page).
- `.card .col { flex:1; height:100%; }`
- `.card .col:nth-child(1) { display:flex; flex-direction:column; justify-content:space-between; padding:0.5rem; }` (eyebrow top, title bottom)
- `.card .col:nth-child(2) { border-radius:0.75rem; overflow:hidden; }` (rounded image frame)
- Per-card background + stacking order (front-most card first):
  - `#card-1 { background-color:var(--base-1); z-index:5; }`
  - `#card-2 { background-color:var(--base-2); z-index:4; }`
  - `#card-3 { background-color:var(--base-3); z-index:3; }`
  - `#card-4 { background-color:var(--base-4); z-index:2; }`

Note the cards are centered via CSS `top/left:50%`, but the actual −50%/−50% centering offsets are applied by GSAP (`xPercent/yPercent`, below), not CSS transforms.

## GSAP effect (the important part — be exhaustive)

### Smooth scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Lenis is driven by GSAP's ticker (default Lenis options otherwise), Lenis scroll events call `ScrollTrigger.update`, and lag smoothing is disabled so the scrub stays glued to scroll position.

### Constants & card count
```js
const cards = document.querySelectorAll(".sticky-cards .card"); // 4
const totalCards = cards.length;          // 4
const segmentSize = 1 / totalCards;       // 0.25  → one card handed off per 25% of scroll progress
const cardYOffset = 5;                    // yPercent step between stacked cards
const cardScaleStep = 0.075;              // scale step between stacked cards
```

### Initial stack pose (`gsap.set` per card, before the ScrollTrigger)
```js
cards.forEach((card, i) => {
  gsap.set(card, {
    xPercent: -50,
    yPercent: -50 + i * cardYOffset, // -50, -45, -40, -35
    scale:    1 - i * cardScaleStep, // 1, 0.925, 0.85, 0.775
  });
});
```
So at rest: the front card (i=0) is perfectly centered at full scale; each card further back is nudged **down** by 5 yPercent and **shrunk** by 0.075, peeking out below the one in front — a fanned deck seen from slightly above. (Because `transform-origin` is center-bottom and cards shrink, smaller cards sit lower and reveal a stepped stack.)

### The ScrollTrigger (single pinned, scrubbed trigger — no timeline, all `gsap.set` inside `onUpdate`)
```js
ScrollTrigger.create({
  trigger: ".sticky-cards",
  start: "top top",
  end: `+=${window.innerHeight * 8}px`, // 8 viewport heights of scroll distance (computed once at load)
  pin: true,
  pinSpacing: true,
  scrub: 1,                              // 1s smoothing between scroll and animation
  onUpdate: (self) => { /* see below */ },
});
```
- The deck section pins at `top top` and stays pinned for **8× the viewport height** of scroll. `pinSpacing:true` inserts a real spacer so the outro section appears only after the whole deck sequence finishes.
- `scrub: 1` (not `true`) adds ~1s of easing catch-up on top of Lenis, giving the hand-off a soft, weighted feel.
- **No tweens/timeline** — the entire animation is recomputed each frame with `gsap.set` calls inside `onUpdate`, driven purely by `self.progress`.

### Per-frame logic inside `onUpdate(self)`
```js
const progress = self.progress; // 0 → 1 over the whole pin

// which card is the one currently flying out
const activeIndex = Math.min(Math.floor(progress / segmentSize), totalCards - 1); // 0..3
// 0→1 progress *within* the active card's segment
const segProgress = (progress - activeIndex * segmentSize) / segmentSize;

cards.forEach((card, i) => {
  if (i < activeIndex) {
    // already exited: parked off the top, tilted back
    gsap.set(card, { yPercent: -250, rotationX: 35 });
  } else if (i === activeIndex) {
    // the current front card flying out
    gsap.set(card, {
      yPercent:  gsap.utils.interpolate(-50, -200, segProgress), // rises up and off
      rotationX: gsap.utils.interpolate(0, 35, segProgress),     // hinges back in 3D
      scale: 1,                                                  // locked at full size while exiting
    });
  } else {
    // still in the stack behind: advance forward as segProgress grows
    const behindIndex   = i - activeIndex;                        // 1, 2, 3…
    const currentYOffset = (behindIndex - segProgress) * cardYOffset;
    const currentScale   = 1 - (behindIndex - segProgress) * cardScaleStep;
    gsap.set(card, {
      yPercent: -50 + currentYOffset, // slides up toward center as segProgress → 1
      rotationX: 0,
      scale: currentScale,            // scales up toward 1 as it reaches the front
    });
  }
});
```

Exact behavior to reproduce:
- **Segments:** progress 0–0.25 flies out card 0, 0.25–0.5 card 1, 0.5–0.75 card 2, 0.75–1.0 card 3. `segProgress` is the normalized 0→1 position inside whichever segment is active.
- **Exiting (active) card:** `yPercent −50 → −200` (translates straight up by ~1.5 card-heights) while `rotationX 0 → 35deg` (tilts its top edge away from the viewer, hinging on its bottom because of `transform-origin:center bottom`). Its `scale` is pinned to `1` throughout the exit — it does **not** keep any per-index shrink, because by the time a card becomes active the previous segment has already promoted it to full scale.
- **Parked cards** (index `< activeIndex`, i.e. already gone): held at `yPercent −250, rotationX 35` — pushed a bit further up than the −200 exit end so they fully clear the frame.
- **Behind cards** (index `> activeIndex`): each advances one "slot" per segment. As `segProgress` goes 0→1, `(behindIndex − segProgress)` shrinks by 1, so the nearest behind card (behindIndex 1) moves from `yPercent −45 → −50` and `scale 0.925 → 1.0` — landing exactly on the front pose right as the active card finishes exiting. The card two-back moves 0.925→0.85 equivalents forward one step, etc. `rotationX` stays 0 for all behind cards.
- All interpolation is **linear** (`gsap.utils.interpolate` = plain lerp); the only easing comes from `scrub: 1` + Lenis. No `ease`, `duration`, `delay`, `stagger`, SplitText, or CustomEase anywhere.

Net read: a continuous conveyor where the top card ramps up and hinges back into the distance while the deck below marches forward and grows to fill the vacancy, one card per quarter of the scroll.

## Assets / images
**Four card images**, one per card, each rendered inside the card's second column at `width:100%; height:100%; object-fit:cover;` inside a rounded, overflow-hidden frame. The source files are **square (1:1)** but are `object-fit:cover` cropped to the column, so they read as a **portrait-to-squarish** slice (each column is about half the card's 65vw width and its full 60vh height).

They are a cohesive set of **warm, sun-faded vintage-film retro-futurist photographs** — 1950s/60s Kodachrome look, grainy, soft, dominated by **cream/ivory whites, orange, amber and gold** with muted accents. Subjects, in card order:
1. **card-img-1** — two figures in **orange jumpsuits** with white over-ear headphones, seen from behind at a retro control-panel console, gazing through a window at a starfield with a spiral galaxy and ringed planet (Saturn). Cream cabin, orange suits, deep-blue space.
2. **card-img-2** — a **retro-futurist spaceport/building** with tapered spires and domes in orange and cream, a vintage two-tone car parked out front, framed by autumn foliage under a hazy warm sky. Orange, cream, amber.
3. **card-img-3** — a person in a cream armchair reading an **orange book**, their head a transparent glass dome packed with colorful clockwork gears and machinery; sunlit room with bookshelf and lamp. Cream, orange, warm gold.
4. **card-img-4** — a young child writing at a **wooden school desk** in a sunlit vintage classroom, with a large chrome-and-glass space helmet resting on the desk and a globe nearby. Amber, honey-cream, muted teal chalkboard.

Any cohesive warm-toned retro-futurist photo set works; the shared cream/orange palette reads well against the vivid card backgrounds. Provide 4 files in card order; if fewer are available, repeat in order.

## Behavior notes
- **Desktop-first.** At `max-width:1000px` the cards restack vertically: `.sticky-cards .card { width:calc(100% - 4rem); height:75%; flex-direction:column; }` and `.card .col { width:100%; }` (image on top of text). The scroll/pin/tilt effect still runs unchanged on all sizes.
- Section heights use `svh` so mobile browser chrome doesn't clip the full-viewport panels; `overflow:hidden` on sections keeps the off-screen exiting cards from creating scrollbars.
- The `end` distance is captured **once** from `window.innerHeight` at load, so it doesn't reflow on resize (matches the original).
- No reduced-motion handling in the original — the animation is entirely scroll-scrubbed, so nothing autoplays; it only moves as the user scrolls.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/brandappart-sticky-cards/card-img-1.jpg
https://motionprompts.dev/c/brandappart-sticky-cards/card-img-2.jpg
https://motionprompts.dev/c/brandappart-sticky-cards/card-img-3.jpg
https://motionprompts.dev/c/brandappart-sticky-cards/card-img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--base-1`, `--base-2`, `--base-3`, `--base-4`, `--r`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`/`querySelectorAll`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, the deck looks right for a moment, and then it misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two pinned `ScrollTrigger`s on `.sticky-cards`, each inserting its own pin-spacer and stretching the page by another eight viewport-heights of scroll distance; two `Lenis` instances pulling on the same wheel event; two `onUpdate` callbacks racing to write `yPercent`/`scale`/`rotationX` onto the same four cards on every scrub tick. The visible symptom is a deck that stays pinned for twice the scroll it should, or cards that snap between two disagreeing poses mid-hand-off, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only once the DOM is ready does it look up `.sticky-cards` and its four `.card` children, wire `Lenis` into the GSAP ticker, lay out the initial fanned stack with `gsap.set`, and create the single pinned `ScrollTrigger` whose `onUpdate` drives every frame of the hand-off. That guard exists to survive being loaded late in a plain document; in React it is dead weight, because `useEffect` already runs after the DOM is committed. Drop the guard and the listener both, and move the whole body — the Lenis wiring, the per-card `gsap.set` pass, and the `ScrollTrigger.create` call — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `document.querySelector(".sticky-cards")` and `document.querySelectorAll(".sticky-cards .card")` both assume this component owns the document, and the resulting list is indexed positionally everywhere after: the initial `cards.forEach((card, i) => …)` pose, and the `activeIndex`/`behindIndex` arithmetic `onUpdate` runs against that same ordering on every scroll tick. Give the component a root `ref` on the section and resolve both queries off it instead of off `document`. During the StrictMode remount two copies of `.sticky-cards` exist for an instant, and an unscoped selector will happily wire the four-card index math to the copy that is on its way out.

*(3) Cleanup* — Wrap the initial `gsap.set` pass over the four cards and the `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the initial fanned pose and the pinned ScrollTrigger, exactly as above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills the `ScrollTrigger`, and because it was created with `pin: true` and `pinSpacing: true`, that includes tearing down the pin-spacer it inserted around `.sticky-cards`. Skip it and the spacer survives the unmount: the next mount pins on top of it, and the page keeps getting taller every time this route is visited. Register the plugin (`gsap.registerPlugin(ScrollTrigger)`) at module scope, not inside the effect — repeating it, or repeating `gsap.ticker.lagSmoothing(0)`, on every mount is harmless but pointless.

That revert does **not** reach the animation itself, and this is the part specific to this component: there is no timeline or tween for the context to track. Every frame of the hand-off is a raw `gsap.set` call made from inside `onUpdate`, invoked later, on a scroll event, well after the synchronous window in which `gsap.context` was listening for calls to adopt. Those per-frame writes to `yPercent`, `scale` and `rotationX` are invisible to the context, so `ctx.revert()` leaves the four cards holding whatever pose the last `onUpdate` tick wrote right before the unmount — a visible flash of the mid-hand-off pose on the next mount. Clear it explicitly in the same cleanup, after the revert, keeping the same `cards` reference the effect already holds rather than re-querying: `gsap.set(cards, { clearProps: "all" })`.

`Lenis` and the ticker callback sit outside the context too, for the usual reason — they are not tweens or triggers. Remove the ticker callback with `gsap.ticker.remove(raf)`, the same function reference `gsap.ticker.add(raf)` was given, before calling `lenis.destroy()`, so no tick already in flight calls `lenis.raf()` on an instance that is already gone; then drop the relay with `lenis.off("scroll", ScrollTrigger.update)`. This component creates its own `Lenis` instance with nothing shared, which is fine as long as `.sticky-cards` is the only scroll-driven section on the page — if it ends up embedded alongside others, lift the instance to the app shell instead of letting every mounted copy fight over the same wheel input.

Because the pin changes the document's height for as long as it is mounted, call `ScrollTrigger.refresh()` once at the end of the cleanup if the page has other pinned or scrubbed sections that measured their start/end against this section's now-removed spacer — a single call, not one per unmount, or a StrictMode double-teardown fires it twice for nothing.
