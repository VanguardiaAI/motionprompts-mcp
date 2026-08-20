# Pinned Stacking Cards — Scroll-Driven Deck That Deals Up & Flies Off

## Goal
Build a single pinned section where **six rotated product cards** deal up one at a time from the bottom of the viewport as you scroll. Each card slides up to dead center; once the next card starts coming in, the previous cards drift off toward the **top-left corner** — earlier cards flying farther than later ones, so a fanned trail of tilted cards accumulates up-left while a fresh card keeps landing in the middle. The whole thing is driven by ONE pinned, scrubbed `ScrollTrigger` (spanning 8 viewport-heights of scroll, Lenis-smoothed) whose `onUpdate` maps scroll progress to every card's entry `y` and staggered exit `x/y`. A dark hero above and a dark outro below bookend the light-grey pinned stage.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**, and **`lenis`** for smooth scroll. Register with `gsap.registerPlugin(ScrollTrigger)`. Run everything inside a `DOMContentLoaded` handler.

Lenis wiring (standard GSAP integration):
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

## Layout / HTML
Three stacked full-viewport sections. Class names are load-bearing — the JS/CSS query them.

```
<section class="hero">
  <h1>Future threads for a fractured world.</h1>
</section>

<section class="sticky-cards">
  <div class="card">
    <div class="card-img"><img src="..." alt="" /></div>
    <div class="card-content"><p>X01-842</p></div>
  </div>
  <!-- 5 more .card blocks, same structure, different label + image -->
</section>

<section class="outro">
  <h1>Tomorrow, tailored.</h1>
</section>
```

- Exactly **6** `.card` elements inside `.sticky-cards`.
- Card labels (the `.card-content p` text), in DOM order: **X01-842**, **V9-372K**, **Z84-Q17**, **L56-904**, **A23-7P1**, **T98-462** — cryptic uppercase product/SKU codes.
- Hero copy: "Future threads for a fractured world." Outro copy: "Tomorrow, tailored." No nav, no footer.

## Styling
Fonts: body uses **"PP Neue Montreal"** (a clean grotesque sans — fall back to a neutral sans-serif if unavailable); the card labels use **"Akkurat Mono"** (a monospace — fall back to any monospace). Neither is a Google font; the exact face is not critical, only the sans / mono contrast.

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `body { font-family:"PP Neue Montreal", sans-serif }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `section { position:relative; width:100vw; height:100vh; overflow:hidden }` — every section is exactly one viewport.

Sections:
- `.hero, .outro { display:flex; justify-content:center; align-items:center; text-align:center; padding:1em; background-color:#202020; color:#fff }` — dark charcoal panels with centered white text.
- `.hero h1, .outro h1 { font-size:3rem; font-weight:400; line-height:1 }`.
- `.sticky-cards { background-color:#e3e3e3 }` — light grey stage (this is what stays pinned).

Cards — all six are stacked in the exact same centered spot:
- `.card { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); will-change:transform; width:25%; height:50%; padding:0.5em; display:flex; flex-direction:column; gap:0.5em; background-color:#202020; color:#fff }` — a dark card, one quarter of viewport width and half its height, so a portrait tile. Keep `will-change:transform`.
- `.card-img { flex:1 1 0; min-height:0; width:100% }` — the photo fills all but the label strip.
- `.card-content { flex:0 0 12px; display:flex; align-items:center }` — a thin 12px label bar under the image.
- `.card-content p { text-transform:uppercase; font-family:"Akkurat Mono", monospace; font-size:12px }`.
- Media query `max-width: 900px`: `.card { width:75% }` (cards get much wider on small screens).

Note the CSS `transform: translate(-50%,-50%)` centering is immediately overwritten by GSAP's `gsap.set` in JS (which writes its own translate + rotate), so at runtime GSAP owns each card's transform.

## GSAP effect (be exact)

### Data
```js
const cards = gsap.utils.toArray(".card");        // the 6 cards, DOM order
const rotations = [-12, 10, -5, 5, -5, -2];       // fixed tilt per card, degrees
```
The rotation list is per-card and **set once, never re-animated** — each card keeps its tilt the entire time, which is what makes the flown-off pile look scattered rather than uniform.

### Initial state — park every card one viewport below, pre-tilted
```js
cards.forEach((card, index) => {
  gsap.set(card, {
    y: window.innerHeight,   // pushed a full viewport-height below its centered home
    rotate: rotations[index],
  });
});
```
So before any scroll, all six cards sit off-screen just under the fold, each already rotated. Nothing is visible in `.sticky-cards` except the grey background.

### The single ScrollTrigger (pinned, scrubbed, 8×viewport runway)
```js
ScrollTrigger.create({
  trigger: ".sticky-cards",
  start: "top top",
  end: `+=${window.innerHeight * 8}px`,   // eight viewport-heights of scroll distance
  pin: true,
  pinSpacing: true,
  scrub: 1,                                // ~1s catch-up smoothing on progress
  onUpdate: (self) => { /* see below */ },
});
```
`.sticky-cards` pins in place for 8 viewport-heights of scrolling; `scrub: 1` means the reported `self.progress` eases ~1 second behind the raw scroll position (gives the cards a smooth, slightly laggy feel and makes everything fully reversible).

### onUpdate — map progress to each card's position
There are **no tweens with real duration** — every frame just writes positions via `gsap.to(card, { ..., duration: 0, ease: "none" })` (an instant set; the smoothing comes from `scrub`, not from tween duration). Per frame:

```js
const progress = self.progress;              // 0 → 1 across the whole pin
const totalCards = cards.length;             // 6
const progressPerCard = 1 / totalCards;      // ≈ 0.1667 — each card owns one slice
```

Then for each `card` at `index`:

**1. Per-card entry window.**
```js
const cardStart = index * progressPerCard;                 // 0, 1/6, 2/6, …, 5/6
let cardProgress = (progress - cardStart) / progressPerCard;
cardProgress = Math.min(Math.max(cardProgress, 0), 1);     // clamp 0..1
```
So card 0 slides in over progress `0 → 1/6`, card 1 over `1/6 → 2/6`, … card 5 over `5/6 → 1`. Cards deal in strictly one after another.

**2. Entry Y (slide up from below to center).**
```js
let yPos = window.innerHeight * (1 - cardProgress);   // innerHeight → 0 as it enters
let xPos = 0;
```
While `cardProgress` runs 0→1 the card travels from `y = innerHeight` (off-screen bottom) up to `y = 0` (its centered home). At the top of its stack it sits dead center, tilted by its `rotations[index]`.

**3. Exit toward top-left (only for already-landed, non-last cards).**
```js
if (cardProgress === 1 && index < totalCards - 1) {
  const remainingProgress =
    (progress - (cardStart + progressPerCard)) /
    (1 - (cardStart + progressPerCard));
  if (remainingProgress > 0) {
    const distanceMultiplier = 1 - index * 0.15;
    xPos = -window.innerWidth  * 0.3 * distanceMultiplier * remainingProgress;
    yPos = -window.innerHeight * 0.3 * distanceMultiplier * remainingProgress;
  }
}
```
Key details:
- A card only begins leaving **after it has fully landed** (`cardProgress === 1`, i.e. `progress` passed `(index+1)/6`).
- The **last card (index 5) never leaves** — `index < totalCards - 1` excludes it, so it stays centered as the final resting card.
- `remainingProgress` = how far through *the rest of the scroll* (from the moment this card finished entering, `(index+1)/6`, to the very end `1`) we currently are, `0 → 1`.
- `distanceMultiplier = 1 - index*0.15` → card0 `1.0`, card1 `0.85`, card2 `0.70`, card3 `0.55`, card4 `0.40`. **Earlier cards fly farther**, so they end up higher and more to the left — a fanned diagonal trail toward the top-left corner.
- Both `x` and `y` go **negative** and scale together, so each departing card slides up-and-left. Max reach for card0 is `x ≈ -30% viewport width`, `y ≈ -30% viewport height`; later cards drift progressively less.
- Because rotation is never touched here, each card keeps its original tilt as it flies off.

**4. Commit the frame.**
```js
gsap.to(card, { y: yPos, x: xPos, duration: 0, ease: "none" });
```

### Net choreography
As you scroll through the 8-viewport pin: card X01-842 rises to center, then as V9-372K starts rising, X01-842 peels off up-left; V9-372K lands, then peels off up-left (a bit less far) as Z84-Q17 rises; and so on. By the end, five tilted cards are scattered across the upper-left quadrant (earlier = farther) and the sixth, T98-462, rests centered. Scrolling back up reverses the entire sequence exactly.

## Assets / images
**6 portrait editorial fashion photographs**, one per card. Each fills a `.card-img` slot that is ~25vw wide × ~50vh tall minus a 0.5em pad and a 12px label bar — so effectively a **tall portrait crop (~3:4 to ~4:5)**, `object-fit: cover`. Treat them as a matched avant-garde apparel lookbook: single garments / styled figures on plain studio or muted editorial backdrops, moody neutral palette so the images sit well on dark cards against the light-grey stage. Six distinct shots (no repeats).

## Behavior notes
- **Entirely scroll-driven and reversible** — nothing autoplays; the hero and outro are static text panels, the cards only move with scroll (smoothed by Lenis + `scrub: 1`).
- The pin **hijacks scroll** for 8 viewport-heights: after the hero, the grey `.sticky-cards` section locks in place while the whole deck deals through, then releases into the outro. `pinSpacing: true` reserves that scroll distance in the document flow.
- `window.innerHeight` / `window.innerWidth` are read at setup time for the initial park, the pin length, and the exit offsets; a page reload picks up the current viewport size (no resize handler in the original).
- Responsive: the only breakpoint is `max-width: 900px`, where cards widen to 75% — the progress-based math is all relative to the viewport, so the effect itself works at any size.
- Keep `will-change: transform` on `.card` — six simultaneously transformed cards are the heaviest part.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/thefirstthelast-scroll-animation/card-1.jpeg
https://motionprompts.dev/c/thefirstthelast-scroll-animation/card-2.jpeg
https://motionprompts.dev/c/thefirstthelast-scroll-animation/card-3.jpeg
https://motionprompts.dev/c/thefirstthelast-scroll-animation/card-4.jpeg
https://motionprompts.dev/c/thefirstthelast-scroll-animation/card-5.jpeg
https://motionprompts.dev/c/thefirstthelast-scroll-animation/card-6.jpeg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--graphite`, `--paper`, `--white`, `--mute`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, then wires up Lenis, GSAP, and one pinned `ScrollTrigger` that never has to undo itself. React withdraws all three guarantees at once, and quietly — the deck renders, looks right for a moment, then misbehaves in a way that doesn't point back at any of this. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here specifically: two `ScrollTrigger`s pinning the same `.sticky-cards` section and disagreeing about the same scrub, plus two `Lenis` instances both feeding `ScrollTrigger.update`. The visible symptom is the six cards jittering or racing ahead of the actual scroll position, and it will not reproduce in a production build, because React only double-mounts in development. Treat the cleanup as part of the effect, not an afterthought.

**(1) The entry point.** The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the whole deck stays parked below the fold — no error, nothing to debug. Delete the listener and move its body — `gsap.registerPlugin`, the `Lenis` instantiation, the ticker wiring, the initial `gsap.set` pass over the six cards, and the `ScrollTrigger.create` call — into a `useEffect` with an empty dependency array. Keep `gsap.registerPlugin(ScrollTrigger)` at module scope rather than inside the effect; re-registering on every mount is harmless but pointless.

**(2) Element lookups.** `gsap.utils.toArray(".card")` and the `ScrollTrigger`'s `trigger: ".sticky-cards"` both assume this component owns the document. Give the component a root ref that wraps `.hero`, `.sticky-cards`, and `.outro`, and scope both lookups to it — but they don't scope the same way. A selector string passed as `trigger` inside a `gsap.context` tied to that root resolves automatically, because `ScrollTrigger.create` is one of the calls the context rewrites for you. `gsap.utils.toArray` is a plain utility, not a tween or a trigger, and gets no such treatment — pass the root as its second argument, `gsap.utils.toArray(".card", rootRef.current)`, or during the StrictMode remount the six cards it collects can come from the copy of the subtree that's on its way out, and the whole per-card progress math in `onUpdate` ends up animating detached nodes.

**(3) Cleanup.** Wrap the `gsap.set` pass and the `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const cards = gsap.utils.toArray(".card", rootRef.current);
    cards.forEach((card, index) => {
      /* the parked gsap.set pass, unchanged */
    });
    ScrollTrigger.create({
      trigger: ".sticky-cards",
      /* start, end, pin, pinSpacing, scrub, onUpdate — all as above */
    });
  }, rootRef);

  return () => ctx.revert();
}, []);
```

`ctx.revert()` undoes the pinned `ScrollTrigger` and the inline transforms every `gsap.set`/`gsap.to` call in `onUpdate` wrote onto the six cards — that covers everything created during the factory's synchronous pass. It does **not** touch the `Lenis` instance or the ticker subscription that drives it, because neither is a tween or a trigger; the context has no record of them.

Lenis is the document-level resource here — this component owns one instance for the life of its mount, so create it inside the same effect and destroy it in the same cleanup. The subtler failure is the ticker: `gsap.ticker.add((time) => { lenis.raf(time * 1000); })` is a standing subscription that `ctx.revert()` does not touch, so a reverted context sitting next to an undestroyed `Lenis` instance looks like a complete teardown while the ticker keeps calling `.raf()` on an instance nothing is animating into anymore. Keep the callback in a named variable so the cleanup removes the exact same function reference:

```jsx
useEffect(() => {
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  const driveLenis = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(driveLenis);
  gsap.ticker.lagSmoothing(0);

  const ctx = gsap.context(() => {
    /* toArray + gsap.set pass + ScrollTrigger.create, as above */
  }, rootRef);

  return () => {
    ctx.revert();
    gsap.ticker.remove(driveLenis);
    lenis.destroy();
  };
}, []);
```

`lenis.destroy()` also releases the `scroll` listener registered via `.on()`, so there's nothing extra to unhook there. If a StrictMode remount leaves the previous mount's `driveLenis` registered, the new mount adds a second one on top of it — two live `Lenis` instances both call `.raf()` every tick and both push `ScrollTrigger.update`, so the progress value the pinned deck's `onUpdate` slices into six equal windows gets refreshed twice as often, and the cards visibly race ahead of where the actual scroll position says they should be.
