# Scroll-Driven Arc Card Carousel with Synced Step Counter

## Goal

Build a single full-screen **pinned** section where a row of image cards is laid out along a **circular arc** (like cards resting on the rim of a giant wheel below the viewport) and **rotates through the top of the screen as you scroll** — each card swings up from the right, passes upright through the center, and swings off to the left, staying tangent to the arc the whole way. A large **step counter (01–05)** in the corner slides vertically to stay in sync with whichever card is currently centered. Smooth scroll via Lenis. The card positions are recomputed every frame with trigonometry (`cos`/`sin`) and applied through `gsap.set` — there is **no tween/timeline** on the cards themselves; only the counter uses a tween.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scroll. No other plugins, no framework:

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```

Register once: `gsap.registerPlugin(ScrollTrigger);`. Wrap all setup in a `DOMContentLoaded` listener. Card positioning is done with a native `IntersectionObserver` (for the counter) plus GSAP.

## Layout / HTML

Everything lives inside a `<div class="container">`. Structure top to bottom:

1. `<nav>` — a `<p id="logo">` reading `Voxel` (fictional brand) and a `<button>` reading `Download Now`. Absolutely positioned, spans the top of the viewport, `z-index: 2`.
2. `<section class="intro">` — empty; it is just a full-viewport panel with a full-bleed background image.
3. `<section class="steps">` — **the pinned stage.** Contains two blocks:
   - `<div class="step-counter">` → `<div class="counter-title"><h1>steps</h1></div>` and `<div class="count"><div class="count-container"> <h1>01</h1> <h1>02</h1> <h1>03</h1> <h1>04</h1> <h1>05</h1> </div></div>`. The five number `<h1>`s are stacked vertically inside `.count-container`; only one shows at a time through the clipped `.count` window.
   - `<div class="cards">` → **seven** `<div class="card">` elements. The first **five** each contain `<div class="card-img"><img src="…" alt="" /></div>` and `<div class="card-content"><p>…</p></div>`. The last **two** are `<div class="card empty"><p>EMPTY</p></div>` (invisible spacers — see note). All seven must exist; the arc math depends on the count being 7.
4. `<section class="outro">` — a single centered `<p>` with one highlighted `<span>` — the only chartreuse words on the page.

Card copy (steps 1→5). Each card carries a mono `.card-tag` (`01 / Silhouette`, `02 / Pattern`, `03 / Cloth`, `04 / Tailoring`, `05 / Collection`) above a short paragraph — neutral demo copy for a fictional tailoring house ("Méridien"):
1. "Every season begins with one silhouette. We build the rest of the collection outward from it."
2. "Patterns are drafted by hand and cut in calico, fitted on the stand before we touch the cloth."
3. "We buy from a short list of mills in Italy and Scotland we have worked with for years."
4. "Each piece is tailored, pressed, and finished in our own atelier."
5. "When your design is complete, export it in various formats optimized for production or further editing."

## Styling

Palette & type:
- Palette — a dark olive room, bone type, one chartreuse accent:
  ```css
  :root {
    --ground: #20241c;   /* the page */
    --surface: #3a4034;  /* card wells and the hero blend base */
    --paper: #f2efe6;    /* type */
    --accent: #d5e14e;   /* chartreuse: the highlighted word, hover fills */
    --display: "Space Grotesk", sans-serif;
    --sans: "Inter", sans-serif;
    --mono: "Space Mono", monospace;
  }
  ```
- Page: `background: var(--ground); color: var(--paper);`. Body `font-family: var(--sans)`.
- Logo and all big display type: `font-family: var(--display); font-weight: 700;` — and the small labels, tags and buttons run in `var(--mono)`, 11px uppercase with `letter-spacing: .08em`.
- `button`: an outline chip — `border: 1px solid rgba(242,239,230,.45); background: transparent; color: var(--paper); font-family: var(--mono); font-size: 11px; text-transform: uppercase; letter-spacing: .08em; padding: 0.85em 1.4em; border-radius: 0;` — filling with `var(--accent)` on hover.
- `.outro`: `display:flex; justify-content:center; align-items:center; background: var(--ground);`. `.outro p`: `width:68%; max-width:980px; text-align:center; font-family:var(--display); font-size:clamp(30px,4.2vw,54px); font-weight:600; line-height:1.12; letter-spacing:-0.02em;`. `.outro p span { color: var(--accent); }` (the one chartreuse word).
- `img { width:100%; height:100%; object-fit:cover; }`. Global reset `* { margin:0; padding:0; box-sizing:border-box; }`.

Critical structural CSS (the effect hangs on these exact values):

- `section { position:relative; width:100vw; height:100vh; overflow:hidden; }`
- `html, body { width:100vw; height:900vh; }` (tall page; the real scroll distance is actually created by the pin spacer, below).
- `.intro { background: url("…hero…") no-repeat 50% 50%; background-size:cover; }`
- `.cards { position:absolute; top:25%; left:50%; transform:translate(-50%,-50%); width:150vw; height:600px; will-change:transform; }` — the card layer is centered horizontally and sits with its center at **25% of viewport height** (high up, so the arc's top passes through the upper third).
- `.card { position:absolute; width:500px; height:550px; left:50%; top:50%; margin-left:-250px; transform-origin:center center; display:flex; flex-direction:column; gap:1em; will-change:transform; }` — every card is stacked at the same origin point; GSAP then moves each one out onto the arc.
- `.card-img { position:relative; flex:1; background-color: var(--surface); border-radius:0; overflow:hidden; }` (square corners — the whole design is unrounded)
- `.card-content { width:100%; min-height:76px; display:flex; flex-direction:column; gap:0.45em; border-top:1px solid rgba(242,239,230,.22); padding-top:0.8em; }` — a hairline rule under each image, with the caption and a `.card-tag` mono label beneath it
- `.empty { opacity:0; }` — the two spacer cards are laid out on the arc but invisible.
- Step counter:
  - `.step-counter { position:absolute; display:flex; flex-direction:column; margin:2em; }`
  - `.counter-title, .count { position:relative; width:1200px; height:150px; overflow:hidden; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }` (a clipped 150px-tall window).
  - `.count { top:-10px; }`
  - `.count-container { position:relative; transform:translateY(150px); will-change:transform; }` — **starts translated down 150px** (initial rest state = blank window above "01").
  - `.step-counter h1 { font-family:var(--display); font-size:150px; line-height:1; letter-spacing:-0.02em; font-weight:700; color:var(--paper); }` — so each number is exactly 150px tall = one window height. Stacking five of them makes a 750px column that slides through the 150px window.

## GSAP effect (be exhaustive — this is the whole component)

### Smooth-scroll wiring (Lenis + GSAP ticker)

```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

Default Lenis options. Lenis scroll events feed `ScrollTrigger.update`; the GSAP ticker drives `lenis.raf`; lag smoothing is disabled so the scrub stays glued to scroll position.

### Constants

```js
const stickySection = document.querySelector(".steps");
const stickyHeight  = window.innerHeight * 7;   // 7 viewport heights of scroll while pinned
const cards         = document.querySelectorAll(".card"); // 7 (5 real + 2 empty)
const countContainer= document.querySelector(".count-container");
const totalCards    = cards.length;             // 7

const arcAngle   = Math.PI * 0.4;               // 72° arc span
const startAngle = Math.PI / 2 - arcAngle / 2;  // 54° (arc runs 54°→126°, centered on the vertical 90°)
```

`getRadius()` is responsive:

```js
const getRadius = () =>
  window.innerWidth < 900 ? window.innerWidth * 7.5 : window.innerWidth * 2.5;
```

So on desktop the arc radius is `2.5 × viewport width` (a very shallow, wide arc — the wheel is huge and mostly below the screen).

### The ScrollTrigger (single pinned, no scrub — driven by `onUpdate`)

```js
ScrollTrigger.create({
  trigger: stickySection,
  start: "top top",
  end: `+=${stickyHeight}px`,   // pin lasts innerHeight*7
  pin: true,
  pinSpacing: true,
  onUpdate: (self) => { positionCards(self.progress); },
});
```

- The `.steps` section pins at `top top` and stays pinned for **7× the viewport height** of scroll. `pinSpacing:true` inserts a real spacer so the outro appears only after the whole arc sequence finishes.
- **No `scrub` and no tween** — every frame, `onUpdate` recomputes card transforms from `self.progress` (0→1) via `positionCards`. Smoothness comes entirely from Lenis. Call `positionCards(0)` once at startup so the initial pose is correct before any scroll.

### `positionCards(progress)` — the trigonometric layout (the star effect)

```js
function positionCards(progress = 0) {
  const radius = getRadius();
  const totalTravel = 1 + totalCards / 7.5;              // 1 + 7/7.5 = 1.9333…
  const adjustedProgress = (progress * totalTravel - 1) * 0.75; // ranges −0.75 → +0.70

  cards.forEach((card, i) => {
    const normalizedProgress = (totalCards - 1 - i) / totalCards; // i=0 → 6/7 … i=6 → 0
    const cardProgress = normalizedProgress + adjustedProgress;
    const angle = startAngle + arcAngle * cardProgress;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const rotation = (angle - Math.PI / 2) * (180 / Math.PI); // degrees off vertical

    gsap.set(card, {
      x: x,
      y: -y + radius,            // radius*(1 − sin θ): 0 at the top (θ=90°), grows downward off-axis
      rotation: -rotation,       // keep the card tangent to the arc (upright at the top)
      transformOrigin: "center center",
    });
  });
}
```

Exact mechanics to reproduce:

- Each card `i` is given a fixed **phase offset** `normalizedProgress = (totalCards−1−i)/totalCards`, so the seven cards are evenly spread along the arc, `1/7` apart, with the **first DOM card (i=0) furthest along** (largest angle) and the last (i=6) furthest behind.
- `adjustedProgress` shifts every card's phase together as you scroll: at `progress=0` it is `(0·1.9333−1)·0.75 = −0.75`; at `progress=1` it is `(1.9333−1)·0.75 = +0.70`. That's the conveyor that walks all cards along the arc.
- `angle = startAngle + arcAngle·cardProgress`. A card is **centered/upright** when `angle = 90° (π/2)`, i.e. `cardProgress = 0.5`. As the shared `adjustedProgress` climbs from −0.75→+0.70, cards reach `cardProgress=0.5` **one after another in DOM order** (i=0 first, i=6 last) — so card-1 swings through center first, then card-2, and so on.
- Position: `x = cos(angle)·radius` (right of center when angle<90°, left when >90°); `y = −sin(angle)·radius + radius = radius·(1 − sin angle)` — **0 at the top of the arc**, increasing (pushing the card down and off-screen) as it moves away from center. The circle's center is effectively `radius` below the card layer's center, so cards ride the top edge of a huge wheel.
- Rotation: `rotation: -(angle − 90°)` in degrees — the card is rotated to stay **tangent to the arc** (perfectly upright at the top, tilting clockwise as it moves right, counter-clockwise to the left).
- Everything is applied with `gsap.set` (instantaneous per frame), never a tween. `will-change: transform` is on `.cards` and `.card`.

### Synced step counter (IntersectionObserver + one tween)

A native `IntersectionObserver` watches each card and slides the number column so the centered card's number shows:

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const cardIndex = Array.from(cards).indexOf(entry.target);
      const targetY = 150 - cardIndex * 150;      // 150, 0, −150, −300, −450, −600, −750
      gsap.to(countContainer, {
        y: targetY,
        duration: 0.3,
        ease: "power1.out",
        overwrite: true,
      });
    }
  });
}, { root: null, rootMargin: "0% 0%", threshold: 0.5 });

cards.forEach((card) => observer.observe(card));
```

- `threshold: 0.5` → the callback fires when a card is at least 50% visible (i.e. as it reaches the center of the screen). The centered card's DOM index sets `targetY = 150 − index·150`.
- The `.count-container` starts at `translateY(150px)` (blank window). Because each number `<h1>` is exactly 150px tall, `y=0` reveals "01", `y=−150` reveals "02", … `y=−600` reveals "05". The tween (`power1.out`, `0.3s`, `overwrite:true`) slides the correct number into the clipped window as each successive card passes center — the counter reads **01 → 05** in lockstep with the arc. (The two empty spacer cards also trigger the observer at the tail, which is why five numbers plus padding cover seven cards.)

### Resize

```js
window.addEventListener("resize", () => positionCards(0));
```

On resize just re-run `positionCards(0)` (recomputes radius from the new width). No `ScrollTrigger.refresh` call in the original.

## Assets / images

- **1 full-bleed hero background** for the `.intro` panel (set as a CSS `background`, `cover`, centered) — a moody, dark, atmospheric editorial/technical image; any aspect ratio (it's `cover`).
- **5 card images**, one per content card, each filling a square-cornered well roughly **500×490px** (portrait-ish, `object-fit:cover`) on `var(--surface)`. They are one continuous atelier reportage, matching the five steps: (1) a wool coat draped over the shoulder in a soft studio, (2) a calico toile pinned on a tailor's stand, (3) folded bolts of cloth stacked on a shelf, (4) hands finishing a button by hand beside a tape measure, (5) the completed coat and trousers hung in the atelier. Filmic grain, one light source, no models posing. Provide 5 files in step order; if fewer are available, repeat in order.

No client logos or real brand marks — the demo brand is the fictional "Voxel".

## Behavior notes

- **Page-level component:** Lenis takes over the whole page; the `.steps` section pins for 7 viewport heights while the cards rotate through, then releases into the outro.
- The two `.empty` cards (`opacity:0`) are **not decoration to drop** — they are real arc slots that keep the spacing and the counter timing correct; keep `totalCards = 7`.
- Responsive: at `max-width:900px` the radius switches to `innerWidth·7.5` (even shallower arc), `.cards` top moves to `27.5%`, cards shrink to `375×500`, and the counter title/number shrink to `30px` (with `.count { top:0; left:-10px; }`).
- No reduced-motion handling and no autoplay — nothing moves except in response to scroll (cards) or a card crossing center (counter), so the motion is entirely user-driven.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/ethnocare/card-1.jpg
https://motionprompts.dev/c/ethnocare/card-2.jpg
https://motionprompts.dev/c/ethnocare/card-3.jpg
https://motionprompts.dev/c/ethnocare/card-4.jpg
https://motionprompts.dev/c/ethnocare/card-5.jpg
https://motionprompts.dev/c/ethnocare/hero-clean.jpg
… 1 more under https://motionprompts.dev/c/ethnocare/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ground`, `--surface`, `--paper`, `--accent`, plus the type variables `--display`, `--sans`, `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, reaches into the page with `document.querySelector` for `.steps` and `.count-container` and `document.querySelectorAll` for `.card`, and then owns five long-lived resources for the rest of the page's life — a `Lenis` instance, the `gsap.ticker` callback that drives it, one pinned `ScrollTrigger`, an `IntersectionObserver` watching all seven cards, and a `resize` listener. React withdraws the guarantees this script leans on — the document is already there, an unscoped selector is safe, nothing needs to be undone — and it does so quietly: the arc renders and the counter tracks it correctly on first load, and the damage only shows up on the next mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. A double mount that doesn't fully undo the first leaves two pinned `ScrollTrigger`s on the same `.steps`, each with its own `onUpdate` calling `positionCards` and disagreeing about `self.progress`; two `Lenis` instances fighting over the same wheel event while a stray `gsap.ticker` callback still calls `.raf()` on the one you meant to destroy; and two `IntersectionObserver`s each watching the same seven cards and racing to tween `.count-container` — the `overwrite: true` on that tween only arbitrates between tweens started by one observer's own callback, not between two separate observers each computing their own target from `cardIndex`. None of this reproduces in a production build, because React only double-invokes in development, so the teardown below is load-bearing, not optional.

*(1) The entry point* — this script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the callback that registers the plugin, constructs `lenis`, wires the ticker, creates the pinned `ScrollTrigger`, defines `getRadius` and `positionCards`, sets up the `IntersectionObserver`, and attaches the `resize` listener never runs — the cards never take their arc positions, the counter stays blank, nothing to debug. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its entire body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can stay at module scope; re-registering it on every mount is pointless.

*(2) Element lookups* — `document.querySelector(".steps")`, `document.querySelector(".count-container")` and `document.querySelectorAll(".card")` all assume the component owns the whole document. Put a root ref on the wrapper that contains `.steps` and scope all three lookups to it. This matters specifically here because `ScrollTrigger`'s pin inserts a spacer as a sibling of `.steps`: during the StrictMode remount, two `.steps` sections and two spacers briefly coexist, and an unscoped `querySelectorAll(".card")` can bind `cards` to the seven nodes that are on their way out, so every subsequent `positionCards` call and every `IntersectionObserver` entry keeps referencing a detached arc.

*(3) Cleanup* — wrap the trigger, the pin and the arc math in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    self.add("syncCounter", (targetY) => {
      gsap.to(countContainer, { y: targetY, overwrite: true }); // same duration and easing as above
    });
    // ScrollTrigger.create({ trigger: stickySection, ... }) and the initial positionCards(0) call
  }, rootRef);
  return () => { /* see the five-part teardown below */ };
}, []);
```

`ctx.revert()` is what removes the pin's spacer and restores `.steps`'s own inline styles, and it is also what undoes every `gsap.set` that `positionCards` wrote onto the seven cards — skip it and a remount leaves an orphaned spacer plus a second pinned trigger disagreeing with the first about the current arc position.

The counter's tween is a second, sharper reason to route through the context rather than call GSAP directly: `gsap.to(countContainer, ...)` inside the `IntersectionObserver` callback does not run during the synchronous pass through the context factory — it runs later, whenever a card crosses the intersection threshold — so on its own the context never sees it, and `ctx.revert()` would not stop it mid-flight. Registering it with `self.add("syncCounter", fn)` is exactly the deferred-handler case this needs: it hangs the function off the context as `ctx.syncCounter`, to be called later from the observer, rather than executing it once, immediately, the way a bare `self.add(fn)` would (and a bare `self.add(fn)` would also hand that function the GSAP context as its argument, not the `targetY` number the observer computes — a mistake that would only surface once a card actually crosses center).

One naming collision belongs to this script specifically: `ScrollTrigger.create` already names its `onUpdate` parameter `self` (`onUpdate: (self) => positionCards(self.progress)`), the same name the `gsap.context` factory receives above. Rename the `onUpdate` parameter — `st` reads fine — so nothing inside that callback shadows the outer `self`; a stray `self.add(...)` written inside `onUpdate` by mistake would silently resolve to the `ScrollTrigger` instance, which has no `.add` method for counters or tweens.

`ctx.revert()` does not reach `gsap.ticker.add((time) => lenis.raf(time * 1000))` — a ticker subscription is neither a tween nor a trigger, so the context never records it, and this is the case where it matters most: that callback is what feeds Lenis its frame loop. Keep the exact function reference and remove it explicitly, before destroying Lenis, alongside the observer and the resize listener:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
const onResize = () => positionCards(0);
window.addEventListener("resize", onResize);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
observer.disconnect();
window.removeEventListener("resize", onResize);
```

Remove the ticker callback before destroying Lenis specifically — a ticker frame landing between the two calls would invoke `.raf()` on an instance that no longer exists. `ctx.revert()`, `observer.disconnect()` and the `resize` removal can happen in any order relative to that pair, but all five calls belong in the same cleanup function.

The document-level-resource caveat already noted above — this component assumes it is the page's only `Lenis` instance — holds under React exactly as it does in a plain document. If `.steps` mounts as one section of a larger app, lift the `new Lenis()` construction to the app shell and have this effect only run `lenis.on("scroll", ScrollTrigger.update)` against the shared instance; if this section genuinely owns scroll for the whole page, construct and destroy `lenis` inside this same effect, as shown above.

`window.addEventListener("resize", () => positionCards(0))` in the original is registered with an inline arrow, so name it first, as `onResize` above, or `removeEventListener` has nothing to match against and the listener outlives every unmount.

The test here specifically: navigate away mid-arc — say, with the fourth card centered and the counter's tween in flight — and back again. Nothing above should still be pinning, ticking, or observing when you land, and `.count-container` should resume from the blank rest state, not from wherever the leaked tween left it.
