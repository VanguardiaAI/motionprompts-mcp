---
slug: criticaldanger-rebuild
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Scroll-Pinned Horizontal Heading + Fly-Across Product Cards

## Goal
Build a scroll-driven, **pinned** section where a **giant single-line heading slides horizontally to the left** as you scroll, while **five product cards fly in from off the right edge, travel all the way across the screen and off the left**, each one **staggered by a scroll delay** and following its own hand-authored path of vertical bob + rotation. The whole section is pinned for 5 viewport heights of scroll, smooth-scrolled with Lenis. The star effect is the interplay between the massive horizontally-panning title and the swarm of cards arcing across it, all scrubbed 1:1 to scroll via a single `ScrollTrigger.onUpdate` that recomputes every element per frame with `gsap.utils.interpolate`. A full-bleed hero image sits above the pinned section and a plain dark outro sits below it.

## Tech
Vanilla HTML/CSS/JS with ES module imports (Vite/npm project). Use `gsap` (npm) plus the single GSAP plugin **`ScrollTrigger`**, and `lenis` (npm) for smooth scroll. No other plugins, no framework, no SplitText/CustomEase/Three.js.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```
Register once: `gsap.registerPlugin(ScrollTrigger);`. Wrap all setup in a `DOMContentLoaded` listener.

## Layout / HTML
Order top to bottom: an absolutely-positioned `<nav>`, a full-viewport hero, the pinned sticky section (contains the giant header + five cards), then a full-viewport outro. Class names are load-bearing (JS queries `.sticky`, `.sticky-header`, `.card`).

```html
<nav>
  <div class="logo"><a href="#">Nebulon</a></div>
  <div class="nav-items">
    <a href="#">Catalog</a>
    <a href="#">Cart</a>
  </div>
</nav>

<section class="hero"></section>

<section class="sticky">
  <div class="sticky-header">
    <h1>Nebulon Does it again.</h1>
  </div>

  <!-- 5 cards, all identical structure -->
  <div class="card">
    <div class="card-img"><img src="…img1" alt="" /></div>
    <div class="card-content">
      <div class="card-title"><h2>Immersive Training Simulations</h2></div>
      <div class="card-description">
        <p>Revolutionize hands-on learning with lifelike training environments, enhancing skill development and retention.</p>
      </div>
    </div>
  </div>
  <!-- card 2 … card 5 -->
</section>

<section class="outro"><p>(Your next section goes here)</p></section>

<script type="module" src="./script.js"></script>
```

- **Exactly five `.card`s**, each: `.card-img > img`, then `.card-content` holding `.card-title > h2` and `.card-description > p`.
- "Nebulon" is the fictional demo brand — use it for the nav logo and heading; no real client/brand names.
- Neutral feature copy per card (title / description):
  1. **Immersive Training Simulations** — "Revolutionize hands-on learning with lifelike training environments, enhancing skill development and retention."
  2. **Virtual Design Collaboration** — "Enable remote teams to co-create in 3D spaces, speeding up design iterations and boosting innovation."
  3. **Immersive Product Demos** — "Showcase products in a fully interactive, 360-degree experience, making presentations more engaging and memorable."
  4. **Remote Healthcare Solutions** — "Empower healthcare professionals with virtual consultations and remote diagnostics in immersive 3D environments."
  5. **Interactive Entertainment** — "Deliver a new dimension of gaming and entertainment with fully immersive and interactive virtual experiences."
- Outro paragraph text: "(Your next section goes here)".

## Styling

**Font:** a **light serif display** face (original uses "Apple Garamond Light"; any thin Garamond-style serif is fine as a fallback — the look is thin, wide, editorial). Set it on `html, body`. Note headings use `font-weight: lighter`.

**Palette:**
- Sticky section background: `#ded8c8` (warm greige / bone).
- Cards: background `#000`, all card text `#fff`.
- Nav links & body text: `#000`.
- Outro: background `#000`, its `<p>` text `#ded8c8`.
- Hero: a full-bleed background photo (`background-size: cover; no-repeat 50% 50%`).

**Global / reset & document height:**
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`
- **`html, body { width:100vw; height:800vh; }`** — the tall `800vh` body guarantees the scroll runway; it lines up with the pin spacer (see effect). Keep it.
- `section { width:100vw; height:100vh; overflow:hidden; }` — every section is one viewport tall; `overflow:hidden` clips the off-screen cards and the over-wide header so they never create scrollbars.

**Nav:**
- `nav { position:absolute; top:0; width:100vw; padding:1em; display:flex; justify-content:space-between; align-items:center; }`
- `.logo, .nav-items { flex:1; }` and `.nav-items { display:flex; justify-content:center; gap:2em; }`
- `nav a { text-decoration:none; color:#000; font-size:24px; letter-spacing:-0.02em; }`

**Sticky section & the giant header (critical geometry):**
- `.sticky { position:relative; background-color:#ded8c8; }` (height comes from `section` = 100vh).
- `.sticky-header { position:absolute; top:0; left:0; width:250vw; height:100%; display:flex; justify-content:center; align-items:center; will-change:transform; }` — **the header wrapper is 2.5 viewport-widths wide**; that extra width is the horizontal travel distance the JS pans through.
- `.sticky-header h1 { margin:0; color:#000; font-size:30vw; font-weight:lighter; letter-spacing:-0.05em; line-height:100%; }` — one enormous line, `30vw` tall.

**Cards (critical geometry — the animation is expressed in `%` of these dimensions):**
- `.card { position:absolute; top:10%; left:100%; width:325px; height:500px; background-color:#000; border-radius:1em; padding:0.5em; will-change:transform; z-index:2; }` — **fixed pixel size 325×500**, anchored at `top:10%; left:100%` so each card's default origin is just past the **right edge** of the viewport. All five stack at the same origin; the JS pulls them apart via transforms.
- `.card .card-img { width:100%; height:200px; border-radius:0.5em; overflow:hidden; }`
- `.card-content { width:100%; height:275px; display:flex; flex-direction:column; justify-content:space-between; color:#fff; padding:0.5em; }`
- `.card-content h2 { font-size:42px; font-weight:lighter; letter-spacing:-0.005em; }`
- `.card-content p { font-size:20px; font-weight:lighter; letter-spacing:-0.005em; }`

**Outro:** `.outro { display:flex; justify-content:center; align-items:center; background-color:#000; }`, `.outro p { color:#ded8c8; font-size:30px; letter-spacing:-0.005em; }`.

**Responsive:** only tweak is `@media (max-width:900px){ .nav-items{ justify-content:flex-end; } }`.

Include the standard Lenis helper CSS (`.lenis.lenis-smooth{scroll-behavior:auto !important;}`, `.lenis.lenis-stopped{overflow:hidden;}`, etc.).

## GSAP effect (the important part — be exhaustive)

### Smooth-scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Default Lenis options. Lenis' rAF is driven by GSAP's ticker; Lenis fires `ScrollTrigger.update` on scroll; lag smoothing off. **All smoothing comes from Lenis — the ScrollTrigger below has NO `scrub`.**

### Elements & constants
```js
const stickySection = document.querySelector(".sticky");
const stickyHeader  = document.querySelector(".sticky-header");
const cards         = document.querySelectorAll(".card");     // 5
const stickyHeight  = window.innerHeight * 5;                 // pin distance = 5 viewport heights
```

### Per-card keyframe tables (hand-authored — reproduce these numbers exactly)
Each card has a **4-keyframe `yPercent` track** and a **4-keyframe `rotation` track**, indexed `[cardIndex][0]` = yPercent keyframes, `[cardIndex][1]` = rotation keyframes:

```js
const transforms = [
  [ [10,  50, -10,  10], [ 20, -10, -45, 20] ], // card 0
  [ [ 0, 47.5, -10, 15], [-25,  15, -45, 30] ], // card 1
  [ [ 0, 52.5, -10,  5], [ 15,  -5, -40, 60] ], // card 2
  [ [ 0,  50,  30, -80], [ 20, -10,  60,  5] ], // card 3
  [ [ 0,  55, -15,  30], [ 25, -15,  60, 95] ], // card 4
];
```
(Units: yPercent = % of card height 500px; rotation = degrees.)

### The single pinned ScrollTrigger (no timeline, no scrub — all `gsap.set` inside `onUpdate`)
```js
ScrollTrigger.create({
  trigger: stickySection,
  start: "top top",
  end: `+=${stickyHeight}px`,   // +=5*innerHeight
  pin: true,
  pinSpacing: true,
  onUpdate: (self) => { /* see below */ },
});
```
- The `.sticky` section pins at `top top` and stays pinned for **5× viewport height** of scroll. `pinSpacing:true` inserts the real spacer (which is why the `800vh` body height lines up: hero 100vh + pinned-section spacer 600vh + outro 100vh ≈ 800vh).
- **No `scrub`, no tween, no timeline.** Every frame `onUpdate` reads `self.progress` (0→1) and recomputes the header + all five cards with plain `gsap.set`. Motion is therefore 1:1 with scroll (Lenis supplies the smoothing).

### Per-frame logic inside `onUpdate(self)`

**1) The giant header pans left:**
```js
const progress = self.progress;
const maxTranslate = stickyHeader.offsetWidth - window.innerWidth; // 250vw − 100vw = 1.5 * viewport width
gsap.set(stickyHeader, { x: -progress * maxTranslate });
```
The header's `x` goes `0 → −1.5·innerWidth` linearly across the whole pin — it slides left by one-and-a-half viewport widths, revealing the rest of the over-wide `<h1>`.

**2) Each card, staggered, flies across with its own path:**
```js
cards.forEach((card, index) => {
  const delay = index * 0.1125;                                   // 0, 0.1125, 0.225, 0.3375, 0.45
  const cardProgress = Math.max(0, Math.min((progress - delay) * 2, 1)); // 0→1 over 0.5 of scroll, after `delay`

  if (cardProgress > 0) {
    const cardStartX = 25;
    const cardEndX   = -650;
    const yPos       = transforms[index][0];
    const rotations  = transforms[index][1];

    // X: single linear lerp start→end
    const cardX = gsap.utils.interpolate(cardStartX, cardEndX, cardProgress); // xPercent 25 → -650

    // Y & rotation: step through the 4-keyframe tracks (3 equal sub-segments)
    const yProgress      = cardProgress * 3;                        // 0 → 3
    const yIndex         = Math.min(Math.floor(yProgress), yPos.length - 2); // 0,1,2 (clamped to 2)
    const yInterpolation = yProgress - yIndex;                      // fractional position within segment
    const cardY        = gsap.utils.interpolate(yPos[yIndex],      yPos[yIndex + 1],      yInterpolation);
    const cardRotation = gsap.utils.interpolate(rotations[yIndex], rotations[yIndex + 1], yInterpolation);

    gsap.set(card, { xPercent: cardX, yPercent: cardY, rotation: cardRotation, opacity: 1 });
  } else {
    gsap.set(card, { opacity: 0 });
  }
});
```

Exact behavior to reproduce:
- **Stagger via scroll delay:** `delay = index * 0.1125`. Card 0 starts moving immediately (progress 0), card 4 not until progress `0.45`. Each card's private `cardProgress` runs `0→1` over **0.5 of the overall scroll** (the `* 2`), so cards overlap heavily — a cascading swarm, not a single row.
- **Visibility gate:** a card is `opacity:0` until its `cardProgress > 0`; the instant it starts it snaps to `opacity:1`. So cards pop into existence off the right edge one after another, and never fade — they just appear/disappear by the gate.
- **Horizontal flight:** `xPercent 25 → −650` (linear). Since the card is CSS-anchored at `left:100%` and is 325px wide, `xPercent:25` = ~81px right of the right edge (fully off-screen right), and `xPercent:−650` = ~2112px to the left (fully off-screen left). Each card therefore **enters from off the right, crosses the entire viewport, and exits off the left.**
- **Vertical bob + rotation:** each is a **piecewise-linear 4-keyframe track** sampled by `yProgress = cardProgress*3`. `floor(yProgress)` (clamped to max index 2) picks the segment, `yProgress − yIndex` is the eased-free lerp fraction inside it. So the card passes through its 4 authored yPercent values and its 4 authored rotation values in **three equal thirds** of its crossing. The tables above make each card bob up/down and swing through different rotations (e.g. card 3 whips down to `yPercent −80` and card 4 rotates all the way to `+95°`), giving every card a distinct arc.
- **All interpolation is linear** (`gsap.utils.interpolate` = plain lerp). There is **no `ease`, `duration`, `delay` (in the GSAP sense), `stagger`, SplitText, or CustomEase anywhere** — the "stagger" is purely the per-index scroll `delay` offset, and the only smoothing is Lenis. Everything is `gsap.set` (instantaneous) recomputed each frame from scroll progress.

Net read: as you scroll into the pinned bone-colored section, the huge thin-serif title glides leftward while five black product cards launch from the right one-by-one, each tumbling and bobbing along its own hand-tuned path as it sails across and off the left side.

## Assets / images
**Five images total:**
- **1 hero background** — a full-bleed photographic backdrop for the `.hero` section, sits above the pinned section. Landscape, `cover`-cropped.
- **4 card images** — one per card content; reuse the **first** card image again for the **fifth** card (so 4 unique files fill 5 cards, card 5 repeats card 1). Each is displayed in a `325px`-wide card inside a `200px`-tall rounded frame with `object-fit:cover`, so source them **landscape ~3:2**.

The card set reads as a clean, well-lit **product-catalog / e-commerce** series: a single hero object per frame, centered, shot on a **solid pastel or seamless studio backdrop** (soft lilac, buttery yellow, sage green, pale blue, etc.). Verified examples from the actual set, in order:
1. A matte cream ceramic **vase** on a lilac backdrop.
2. A polished chrome **desk lamp** on a warm yellow backdrop.
3. A neat **stack of hardcover books** (muted orange/green/cream spines) on a sage-green backdrop.
4. A tan-leather-and-tubular-steel **lounge chair** on a pale blue backdrop.

Any cohesive set of single-object studio product shots on pastel backdrops works. No brands or logos visible. Provide 4 card files (+1 hero); if fewer are available, repeat in order.

## Behavior notes
- **Desktop-first.** Cards are a fixed `325×500px`; header travel and card X use `window.innerWidth`, so the effect scales with viewport width. The only responsive rule adjusts nav alignment at `≤900px`.
- **No autoplay, no reduced-motion branch** in the original — nothing moves until the user scrolls; the entire animation is scroll-scrubbed via the single `onUpdate`, and scrolling back up reverses it exactly.
- `overflow:hidden` on every `section` is required so the off-screen cards (well past both edges) and the 250vw header never spawn scrollbars.
- `stickyHeight` is captured once from `window.innerHeight` at load (not recomputed on resize), matching the original.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/criticaldanger-rebuild/hero.jpg
https://motionprompts.dev/c/criticaldanger-rebuild/img1.jpg
https://motionprompts.dev/c/criticaldanger-rebuild/img2.jpg
https://motionprompts.dev/c/criticaldanger-rebuild/img3.jpg
https://motionprompts.dev/c/criticaldanger-rebuild/img4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two `ScrollTrigger` instances pinning the same `.sticky` section, two Lenis instances reading the same wheel input, two `gsap.ticker` callbacks each pushing time into `lenis.raf` for the same frame. Here that shows up as a pin that engages twice — the leftover pin spacer makes the document taller than the `800vh` the layout expects — or as the five cards visibly juddering because two competing `onUpdate` callbacks are both writing `xPercent`/`yPercent`/`rotation` onto the same `.card` elements every scroll tick. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — the script wraps everything, from the Lenis instantiation through the `ScrollTrigger.create` call, in `document.addEventListener("DOMContentLoaded", () => { … })`. By the time a React component mounts, that event has already fired, so the listener is never invoked — no pin, no cards, no console error, nothing to debug. Delete the listener and move its entire body into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `stickySection`, `stickyHeader`, and the five-element `cards` NodeList all come from `document.querySelector`/`querySelectorAll`, which assumes this component owns the document. Give the wrapping element a root `ref` and scope every lookup to it (`root.querySelector(".sticky-header")`, `root.querySelectorAll(".card")`). This is not a style nit for this component specifically: during the StrictMode remount, two copies of `.sticky` exist for an instant, and an unscoped `querySelectorAll(".card")` inside the outgoing instance's `onUpdate` would keep resolving against whichever five `.card` nodes are still attached, not necessarily the ones that instance created.

*(3) Cleanup* — everything the effect creates (the `ScrollTrigger` pin, the ticker subscription driving Lenis, the Lenis instance itself) has to be undone in the function the effect returns. See the GSAP/ScrollTrigger and Lenis notes below for the specifics of this component.

**GSAP / ScrollTrigger.** The only GSAP object this effect creates is the single `ScrollTrigger.create({ trigger: stickySection, pin: true, ... })` call — there is no timeline and no tween outside of it; every visual change (the header's `x`, each card's `xPercent`/`yPercent`/`rotation`/`opacity`) is a `gsap.set` executed synchronously inside `onUpdate`. Wrap that `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref and revert it in cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // ScrollTrigger.create({ trigger: stickySection, pin: true, pinSpacing: true, onUpdate: ... })
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` unpins `.sticky`, removes the trigger, and strips the inline transforms `gsap.set` left on `stickyHeader` and the five cards — all in the one call. Without it, the StrictMode remount leaves a second pinned trigger on `.sticky`, and both keep recomputing the header pan and the five card paths on every scroll frame. This component has no need for `ctx.add(...)` anywhere: the one thing the factory creates is created synchronously inside it, so the context already owns it. `gsap.registerPlugin(ScrollTrigger)` belongs at module scope, run once, not inside the effect.

**`gsap.ticker.add` is not covered by the context.** This component has no `requestAnimationFrame` loop of its own — the line `gsap.ticker.add((time) => { lenis.raf(time * 1000); })` is the entire drive mechanism for Lenis, and `ctx.revert()` does not touch it. Left alone, that callback keeps calling `lenis.raf` against an instance the next line is about to destroy. Keep the function reference and remove it in the same cleanup, before or alongside destroying Lenis:

```jsx
useEffect(() => {
  const lenis = new Lenis();
  const onTick = (time) => lenis.raf(time * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(onTick);
  gsap.ticker.lagSmoothing(0);

  const ctx = gsap.context(() => {
    // ScrollTrigger.create(...) as above
  }, rootRef);

  return () => {
    ctx.revert();
    gsap.ticker.remove(onTick);
    lenis.destroy();
  };
}, []);
```

**Lenis.** This page constructs the only Lenis instance it needs and drives it purely through the `gsap.ticker` callback above — there is no separate rAF loop to cancel. If this section ends up living inside a larger app rather than as its own page, lift that `new Lenis()` call and the ticker wiring up to the app shell instead of constructing them in this effect, and have this component's `ScrollTrigger.create` read off the shared instance's `"scroll"` event; a second instance created here on every mount competes with the app's own for the same wheel input, silently, with nothing in the console to point at it. If this component genuinely owns the whole document, as it does in the demo, construct Lenis inside the effect exactly as above and call `lenis.destroy()` in the same cleanup that removes `onTick`.
