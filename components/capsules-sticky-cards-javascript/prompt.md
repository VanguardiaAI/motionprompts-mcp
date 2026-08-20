# Capsule-to-Fullscreen Sticky Cards (scroll deck with marquee + SplitText reveals)

## Goal
Build a scroll-driven page with a **deck of four full-viewport cards that pin on top of each other**. The star effect: the **first card starts as a small pill-shaped "capsule"** (image wrapper scaled to 0.5 with a 400px border-radius) floating over a **giant looping horizontal text marquee**; as the user scrolls through 300vh, the capsule **grows into a full-bleed image** (scale 0.5→1, border-radius 400px→25px) while the marquee fades away, and when the expansion completes the card's **title characters slide in through overflow masks (SplitText)** together with a small description. Every following card then pins over the previous one — the outgoing card **scales down and fades**, the incoming card's image **de-zooms (scale 2→1) and sharpens its corners (border-radius 150px→25px)**, and its title/description animate in the same masked-chars way. Smooth scroll via Lenis. An intro section sits above the deck and an outro below.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins `ScrollTrigger` and `SplitText`, and `lenis` (npm) for smooth scrolling. No framework:

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
```

Register once: `gsap.registerPlugin(SplitText, ScrollTrigger);`. Wrap all setup in a `DOMContentLoaded` listener. Put the seamless-marquee helper in a second module (`marquee.js`) exporting `setupMarqueeAnimation()`.

## Layout / HTML
Three blocks in order — intro, cards deck, outro:

```html
<section class="intro">
  <h1>We design spaces that don’t just exist.</h1>
</section>

<section class="cards">
  <div class="card">
    <div class="card-marquee">
      <div class="marquee">
        <h1>Design Beyond Boundaries</h1>
        <h1>Built for Tomorrow</h1>
        <h1>Real Impact</h1>
        <h1>Digital Visions</h1>
      </div>
    </div>
    <div class="card-wrapper">
      <div class="card-content">
        <div class="card-title"><h1>Curved Horizon</h1></div>
        <div class="card-description">
          <p>A futuristic residence that plays with curvature and flow, blending bold geometry with natural topography.</p>
        </div>
      </div>
      <div class="card-img"><img src="…image-1" alt="" /></div>
    </div>
  </div>
  <!-- cards 2–4: identical structure but WITHOUT .card-marquee -->
</section>

<section class="outro">
  <h1>Architecture reimagined for the virtual age.</h1>
</section>
```

- **Four `.card`s.** Only the first card contains the `.card-marquee > .marquee` block (four `<h1>`s). Every card has `.card-wrapper > (.card-content + .card-img > img)`, and `.card-content` holds `.card-title > h1` plus `.card-description > p`.
- Card titles / descriptions (neutral fictional architecture copy):
  1. **Curved Horizon** — "A futuristic residence that plays with curvature and flow, blending bold geometry with natural topography."
  2. **Glass Haven** — "A sleek pavilion of pure transparency, openness and light, designed to dissolve into its environment."
  3. **Moss Cube** — "A minimalist cube home crowned with a living moss dome, merging micro-architecture with ecological design."
  4. **Floating Shelter** — "This design explores an ethereal structure perched on a grassy islet, seemingly hovering above water."

## Styling
Font: Inter (Google Fonts variable import), `body { font-family: "Inter", sans-serif; }`. Dark editorial look — every `section` is `#0f0f0f` background with `#fff` text.

- Reset: `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { position:relative; width:100%; height:100%; object-fit:cover; will-change:transform; }`
- `h1 { font-size:5rem; font-weight:500; letter-spacing:-0.1rem; line-height:1.25; }`
- `p { font-size:1.125rem; font-weight:400; line-height:1.25; }`
- `section { position:relative; width:100vw; background-color:#0f0f0f; color:#fff; }`
- `.intro, .outro { height:100svh; padding:1.5em; display:flex; justify-content:center; align-items:center; }` — their `h1` is `width:60%; text-align:center; line-height:1.1;`
- `.cards { position:relative; display:flex; flex-direction:column; gap:25svh; }` — the gap between cards is part of the scroll choreography.
- `.card { position:relative; width:100vw; height:100svh; padding:1.5em; }`
- `.card:nth-child(2) { margin-top:50vh; }` — extra breathing room after the intro capsule card.
- `.card-wrapper { position:relative; width:100%; height:100%; will-change:transform; }` (this is what scales/fades out)
- `.card-img { position:absolute; width:100%; height:100%; border-radius:150px; overflow:hidden; }`
- `.card-img img { transform:scale(2); }` — **CSS default zoom for the non-intro cards**; the intro card's values are overridden by GSAP.
- `.card-content { position:absolute; width:100%; height:100%; display:flex; align-items:flex-end; justify-content:center; z-index:1; }`
- `.card-title { width:100%; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }`
- `.card-description { text-align:center; width:40%; margin-bottom:3em; position:relative; transform:translateX(40px); opacity:0; }` — **starts hidden, shifted 40px right**.
- Marquee (first card only): `.card-marquee { width:100%; position:absolute; top:50%; left:0; transform:translateY(-50%); overflow:hidden; }`, `.card-marquee .marquee { display:flex; }`, `.card-marquee .marquee h1 { white-space:nowrap; font-size:10vw; font-weight:600; margin-right:30px; }`
- SplitText mask pieces: `.char { position:relative; overflow:hidden; display:inline-block; }` and `.char span { transform:translateX(100%); display:inline-block; will-change:transform; }` — **each character span starts fully off to the right inside its own overflow-hidden char box**.
- Mobile `@media (max-width: 900px)`: `h1 { font-size:2rem; letter-spacing:0; }`, intro/outro `h1 { width:100%; }`, `.card-description { width:90%; }`.

## GSAP effect (the important part — be exhaustive)

### 1. Lenis + ScrollTrigger sync
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### 2. SplitText prep on ALL card titles
For every `.card-title h1`: `new SplitText(title, { type: "chars", charsClass: "char", tag: "div" })`. Then manually wrap each char's text in an inner span: `char.innerHTML = `<span>${char.textContent}</span>``. Result: each character is a `div.char` (overflow hidden) containing a `span` that CSS pushes to `translateX(100%)` — invisible until animated.

### 3. Intro card initial state (the capsule)
`cards = gsap.utils.toArray(".card")`, `introCard = cards[0]`. On the intro card only:
```js
gsap.set(cardImgWrapper /* .card-img */, { scale: 0.5, borderRadius: "400px" });
gsap.set(cardImg /* .card-img img */, { scale: 1.5 });
```

### 4. Shared content in/out helpers
- `animateContentIn(titleChars, description)`:
  - chars (`.char span` NodeList) → `gsap.to(chars, { x: "0%", duration: 0.75, ease: "power4.out" })`
  - description → `gsap.to(desc, { x: 0, opacity: 1, duration: 0.75, delay: 0.1, ease: "power4.out" })`
- `animateContentOut(titleChars, description)`:
  - chars → `gsap.to(chars, { x: "100%", duration: 0.5, ease: "power4.out" })`
  - description → `gsap.to(desc, { x: "40px", opacity: 0, duration: 0.5, ease: "power4.out" })`

No stagger — all chars slide together as a masked block.

### 5. Intro capsule expansion — ScrollTrigger with manual scrub via onUpdate
```js
ScrollTrigger.create({
  trigger: introCard,
  start: "top top",
  end: "+=300vh",
  onUpdate: (self) => { … }
});
```
Inside `onUpdate` (no `scrub` property — everything is driven by `self.progress` with `gsap.set`):
- `imgScale = 0.5 + progress * 0.5` → wrapper scale **0.5 → 1**
- `borderRadius = 400 - progress * 375` → **400px → 25px** (applied as a px string)
- `innerImgScale = 1.5 - progress * 0.5` → inner `<img>` scale **1.5 → 1** (counter-zoom so the photo stays framed while the mask grows)
- **Marquee fade**, keyed to `imgScale`: while `0.5 ≤ imgScale ≤ 0.75`, `opacity = 1 - (imgScale - 0.5) / 0.25` (fades 1→0 during the first half of the expansion); clamp to `1` below 0.5 and `0` above 0.75. Applied with `gsap.set(marquee, { opacity })` on the first card's `.marquee`.
- **Content reveal flag**: keep a boolean on the card (e.g. `introCard.contentRevealed`). When `progress >= 1` and it's false → set it true and call `animateContentIn` with the intro card's `.char span` spans and `.card-description`. When `progress < 1` and it's true → set false and call `animateContentOut`. This makes the title/description pop in exactly when the capsule finishes expanding, and retract if the user scrolls back.

### 6. Pinning the deck
Each card gets its own pin trigger:
```js
cards.forEach((card, index) => {
  const isLastCard = index === cards.length - 1;
  ScrollTrigger.create({
    trigger: card,
    start: "top top",
    end: isLastCard ? "+=100vh" : "top top",
    endTrigger: isLastCard ? null : cards[cards.length - 1],
    pin: true,
    pinSpacing: isLastCard,
  });
});
```
So cards 1–3 pin from their own `top top` until **the LAST card's top hits the top** (`endTrigger` = last card, `pinSpacing: false` so they stack under each other without adding scroll length), and the last card pins for an extra `+=100vh` **with** pinSpacing.

### 7. Outgoing card scale/fade
For every card except the last: a trigger watching the **next** card's approach —
```js
ScrollTrigger.create({
  trigger: cards[index + 1],
  start: "top bottom",
  end: "top top",
  onUpdate: (self) => {
    gsap.set(cardWrapper /* this card's .card-wrapper */, {
      scale: 1 - self.progress * 0.25,   // 1 → 0.75
      opacity: 1 - self.progress,        // 1 → 0
    });
  },
});
```

### 8. Incoming image morph
For every card except the first: as the card itself travels from bottom of viewport to top —
```js
ScrollTrigger.create({
  trigger: card,
  start: "top bottom",
  end: "top top",
  onUpdate: (self) => {
    gsap.set(cardImg, { scale: 2 - self.progress });                      // img zoom 2 → 1
    gsap.set(imgContainer, { borderRadius: 150 - self.progress * 125 + "px" }); // 150px → 25px
  },
});
```

### 9. Content reveal for cards 2–4
For every card except the first:
```js
ScrollTrigger.create({
  trigger: card,
  start: "top top",
  onEnter: () => animateContentIn(cardTitleChars, cardDescription),
  onLeaveBack: () => animateContentOut(cardTitleChars, cardDescription),
});
```

### 10. Infinite horizontal marquee (marquee.js)
`setupMarqueeAnimation()` collects `gsap.utils.toArray(".marquee h1")` and, if any, runs the canonical GSAP **`horizontalLoop` helper** (from GSAP's official helper functions) with `{ repeat: -1, paddingRight: 30 }`:
- builds a `gsap.timeline({ repeat: -1, defaults: { ease: "none" } })`
- speed defaults to 1 → **100 pixels per second**, linear
- measures each item's width and current `xPercent`, computes `totalWidth` (last item's offset + width + the 30px `paddingRight`), then for each item chains a `.to` (slide left to `((curX - distanceToLoop) / width) * 100` xPercent, duration `distanceToLoop / pixelsPerSecond`, inserted at time 0) followed by a `.fromTo` (re-enter from the right at `((curX - distanceToLoop + totalWidth) / width) * 100` back to its start xPercent, `immediateRender: false`, inserted at `distanceToLoop / pixelsPerSecond`) — producing a seamless, gapless infinite loop of the four headlines
- finishes with `tl.progress(1, true).progress(0, true)` to pre-render positions.

Call `setupMarqueeAnimation()` at the end of the DOMContentLoaded setup.

## Assets / images
Four **full-bleed architecture/landscape photos** (landscape orientation, ~16:9 or wider works best; they render full-viewport with `object-fit: cover`):
1. A futuristic white residence with curved, flowing organic geometry set into natural terrain (the capsule/intro card).
2. A sleek transparent glass pavilion full of light, dissolving into its surroundings.
3. A minimalist concrete cube house topped with a living green moss dome.
4. An ethereal structure on a small grassy islet that appears to float above water.

## Behavior notes
- The whole page scroll is the interaction — no clicks/hovers. Total scroll ≈ intro (100svh) + capsule expansion (300vh) + the stacked deck + outro.
- Scrolling back up fully reverses everything: capsule shrinks, marquee fades back in, titles retract through their masks (`onLeaveBack` / the `contentRevealed` flag).
- The marquee loop runs forever, independent of scroll.
- `will-change: transform` on images, `.card-wrapper` and `.char span` keeps the constant `gsap.set` updates smooth.
- Works on mobile via the 900px media query (smaller type, full-width text); no reduced-motion branch is required.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/capsules-sticky-cards-javascript/card-img-1.jpg
https://motionprompts.dev/c/capsules-sticky-cards-javascript/card-img-2.jpg
https://motionprompts.dev/c/capsules-sticky-cards-javascript/card-img-3.jpg
https://motionprompts.dev/c/capsules-sticky-cards-javascript/card-img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--peat`, `--peat-deep`, `--parchment`, `--parchment-dim`, `--moss`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, builds its card list off a bare `gsap.utils.toArray(".card")`, reaches into the page through `introCard.querySelector(...)` and a dozen more unscoped lookups, wires up fourteen independent `ScrollTrigger.create()` calls — the capsule-expansion scrub, four pin triggers, three outgoing-card fades, three incoming-image morphs, three content-reveal triggers — and never has to undo any of it, because the page it lives on never unmounts. React withdraws that last guarantee first, and it does it quietly: the capsule still expands and the deck still stacks on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component accumulates an unusual amount of independent live state before that first unmount can land: one `Lenis` instance pumped by a `gsap.ticker` callback, fourteen `ScrollTrigger`s (four of them pinning), four `SplitText` instances (one per `.card-title h1`), an infinite marquee timeline, and a `contentRevealed` flag written directly onto the intro card's own DOM node. Mount it twice without tearing the first pass down and every pin doubles — two triggers pinning the same card, disagreeing about the same scrub — the marquee opacity and the capsule's scale and border-radius get written by two competing `onUpdate` handlers, and Lenis's scroll gets driven by two ticker callbacks at once. None of it reproduces in a production build, because React only double-invokes in development; treat the cleanup below as load-bearing.

*(1) The entry point* — the whole effect is wrapped in `document.addEventListener("DOMContentLoaded", ...)`. By the time a React component mounts, that event has already fired, so the listener is registered and never called: no capsule, no split characters, no pins, nothing to debug because nothing throws. Delete the listener and move its entire body — plugin registration, the Lenis/ticker wiring, the `SplitText` prep loop, the capsule's initial `gsap.set`, the content-in/out helpers, all fourteen `ScrollTrigger.create()` calls, and the closing `setupMarqueeAnimation()` call — directly into a `useEffect` with an empty dependency array. While you're moving this, hoist `gsap.registerPlugin(SplitText, ScrollTrigger)` and `gsap.ticker.lagSmoothing(0)` out to module scope: both currently sit inside the `DOMContentLoaded` callback, but they're one-time, app-wide ticker configuration, not per-mount state, and re-running them on every mount is harmless only by luck, not by design.

*(2) Element lookups* — `gsap.utils.toArray(".card")` and `gsap.utils.toArray(".card-title h1")` are both unscoped, and everything else — `introCard.querySelector(".card-img")`, `.card-img img`, `.card-marquee .marquee`, `.char span`, `.card-description`, and the same set repeated per card across the four `forEach` loops — is scoped only relative to the elements those two calls already found. Give the component a root ref on the element wrapping `.cards`, and scope both `toArray` calls to it; every downstream `.querySelector` already scopes off `introCard` or `card`, so fixing the two roots fixes the rest. The marquee helper has the same gap one level removed: `setupMarqueeAnimation()` in `marquee.js` calls its own unscoped `gsap.utils.toArray(".marquee h1")`, so pass it the root (or the marquee element itself) instead of leaving it to search the whole document. During the StrictMode remount two copies of the deck exist for an instant — an unscoped `toArray(".card")` can bind to the four cards on their way out, and every pin, scrub and reveal for the rest of that mount's life targets elements no longer in the visible tree.

*(3) Cleanup* — Wrap the whole body in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // SplitText prep, capsule initial state, the content-in/out helpers,
    // all fourteen ScrollTrigger.create() calls, setupMarqueeAnimation()
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills every `ScrollTrigger` this component creates, including the four pin triggers — un-pinning each card and, for the last one (the only one carrying `pinSpacing`), collapsing the extra scroll length it added. It also correctly tears down the marquee's infinite timeline, even though `setupMarqueeAnimation()` never returns or exposes it: that timeline is built synchronously, at the tail end of the same factory call, so `gsap.context` captures it the same way it captures everything else created while the factory is running.

What it does *not* reach is the `gsap.set` traffic inside the capsule scrub, the outgoing-fade and the incoming-morph triggers — none of those attach an `animation`, they all drive their scrub by calling `gsap.set` from inside their own `onUpdate`. A `gsap.context` only captures objects instantiated while its factory is synchronously executing; `onUpdate` fires later, on an actual scroll event, well after that synchronous pass has returned, so none of those calls are ever tracked. Reverting stops the *next* one from firing — it does not restore whatever transform, `borderRadius` or opacity the last one already wrote to `cardImgWrapper`, `cardImg`, the marquee, or a given card's `.card-wrapper`. A fresh mount's own triggers overwrite those stale values on their first tick, but only once GSAP re-evaluates them against the current scroll position — there is a real gap between revert and that first re-evaluation, not just a theoretical one.

The ticker is the sharper miss. `gsap.ticker.add((time) => lenis.raf(time * 1000))` is neither a tween nor a trigger, so the context never sees it — and this component has no `requestAnimationFrame` loop of its own to fold that concern into, because the ticker callback *is* the entire drive mechanism for Lenis's frame pump. Keep the function reference and remove it explicitly, before destroying Lenis, or a tick landing between the two calls invokes `.raf()` on an instance you've already torn down:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

`lenis.on("scroll", ScrollTrigger.update)` doesn't need the same treatment — that listener lives on the Lenis instance's own emitter, so `lenis.destroy()` clears it as a side effect of tearing the instance down. Lenis itself is a document-level resource: if this deck is one section of a larger app, lift the `new Lenis()` call to the app shell and have this effect reuse the existing instance instead of constructing a second one that fights the first for the same wheel event.

The four `SplitText` instances need the same explicit handling, one per `.card-title h1`, created in the `titles.forEach` loop. Collect them into an array as you create them and revert every one in the cleanup, ordered before `ctx.revert()` runs against the tweens that target their `.char` spans — otherwise a remount re-splits already-split markup and nests a second layer of `.char` divs inside the first. The `char.innerHTML = "<span>...</span>"` line right after each split needs no separate teardown: it writes inside the container the split itself owns, so one `revert()` call per title discards the manual span wrap along with the character division.

One more piece of state lives outside both GSAP and React: `introCard.contentRevealed`, a plain boolean written directly onto the card's DOM node and read back by the capsule trigger's `onUpdate` to decide between firing `animateContentIn` or `animateContentOut`. Neither `gsap.context` nor `SplitText`'s revert touches it, and because StrictMode's double-invoke reuses the same committed DOM node across both effect runs, the flag carries over unchanged — a second mount can inherit "already revealed" from the run before it ran at all. Reset it explicitly at the top of the effect, or replace the DOM property with a variable local to the effect's own closure, so every mount starts from a known state instead of whatever the previous one left behind.
