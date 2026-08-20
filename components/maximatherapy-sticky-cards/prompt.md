# Sticky Cards — Scroll-Pinned 3D Flip & One-by-One Dismiss

## Goal
Build a full-screen, scroll-pinned hero where a stack of cards rises into view while the headline slides out the top; past the halfway point a single "front" card performs a springy 3D flip to reveal four tilted, colored cards fanned on top of each other, which are then dismissed upward one at a time as you keep scrolling. The star effect is the **elastic 3D card flip driven by a long scrubbed, pinned ScrollTrigger**, combined with a **staggered per-card dismiss** keyed to precise scroll-progress windows.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Build under Vite (npm). Use:
- `gsap` (npm) with the plugin **`ScrollTrigger`** (`gsap/ScrollTrigger`), registered via `gsap.registerPlugin(ScrollTrigger)`.
- `lenis` (npm) for smooth scroll, wired into GSAP's ticker.
- Icon glyphs via the **Ionicons** web component (`ion-icon`) — see **Icons** below for the exact version and where to get it. No raster images are used.

Wire Lenis to GSAP exactly like this:
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

## Layout / HTML
Three stacked full-viewport regions. Every `section` is `position: relative; width: 100%; height: 100svh; overflow: hidden;`.

1. `section.hero` — contains two absolutely-positioned overlays:
   - `div.hero-content` → `h1` headline. Neutral copy, e.g. **"Scroll down and watch everything fall into place"**.
   - `div.sticky-cards` → the card stack. It holds, in this DOM order:
     - **1** `div.card.card-front` with `h3` ("First Frame"), a `span` badge ("Start here"), a `p`, and a `div.icon` holding `<ion-icon name="chevron-down">`.
     - **4** `div.card.card-back`, each with `id="card-1"` … `id="card-4"`, each containing an `h3` title, a `span.card-index` ("01"…"04"), a `div.icon` with an `ion-icon`, and a `p`. Titles and icons, in DOM order: card-1 "Breathe" (`leaf-outline`), card-2 "Move" (`footsteps-outline`), card-3 "Notice" (`eye-outline`), card-4 "Rest" (`moon-outline`).
2. `section.about` — a centered `h3` with a short reflective sentence (e.g. "A quiet progression of motion and stillness, where each layer reveals itself with intention and nothing feels out of place."), width 60% (85% under 1000px), text-align center.

## Styling
Fonts (Google Fonts): **Barlow Condensed** for `h1`/`h3` (weight 900, `text-transform: uppercase`, `line-height: 0.85`), **DM Sans** for body. Sizes: `h1` `clamp(3rem, 5vw, 7rem)`; `h3` `clamp(2rem, 3vw, 5rem)`; `p` `1.125rem`/weight 450/line-height 1.1; `span` badge uppercase 0.9rem, padding 0.5rem, radius 0.25rem, white bg, dark text.

Color tokens (CSS variables):
- `--base-100: #fff`
- `--base-200: #fbfff2` (hero background)
- `--base-300: #dfebe0` (about background)
- `--base-400: #f0fd00` (acid yellow — front card + card-1)
- `--base-500: #dfebe0` (card-2)
- `--base-600: #8c26fd` (violet — card-3)
- `--base-700: #9bfd40` (lime — card-4)
- `--base-800: #0f0f0f` (near-black text)

`.hero` bg `--base-200`, text `--base-800`. `.hero-content` is `position: absolute; width:100%; height:100svh;` flex-centered, `will-change: transform`; its `h1` is width 60%, centered.

**Card stack container** `.sticky-cards`: `position: absolute; width:100%; height:100svh; overflow:hidden;` and critically **`transform-style: preserve-3d; perspective: 1000px;`** — this perspective is what makes the flip read as 3D.

**Every `.card`**: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:25%; min-width:300px; aspect-ratio:4/5; padding:4rem 2rem; border-radius:1rem;` flex column, `justify-content:space-between; align-items:center; text-align:center; will-change:transform;` default bg `--base-400`, color `--base-100`. All five cards therefore occupy the **exact same centered spot**, stacked.

- `.card-front` overrides transform to `translate(-50%, 50%) rotateY(0deg)` and sets `backface-visibility: hidden`. Its `.icon` is a 4rem circle with a `0.125rem` white border.
- `.card-back` overrides transform to `translate(-50%, 50%) rotateY(180deg)` and sets `backface-visibility: hidden`. Its `.icon` is a 5rem filled white circle, font-size 1.5rem, colored `--base-400`.
- Per-card back colors: `#card-1` bg `--base-400`/text `--base-100`; `#card-2` bg `--base-500`/text `--base-800`; `#card-3` bg `--base-600`/text `--base-100`; `#card-4` bg `--base-700`/text `--base-800`.

Because both faces use `backface-visibility: hidden`: at rest only the single front card is visible; the four back cards are rotated so their reverse faces the viewer and they are invisible until the flip.

`.about`: flex-centered, bg `--base-300`, text `--base-800`, `h3` width 60% (85% under 1000px).

## GSAP effect (be exhaustive)

### Selectors & constants
```
stickyCards      = all .card            (5 elements: 1 front + 4 back)
frontStickyCard  = .card-front          (1)
backStickyCards  = all .card-back        (4, in DOM order card-1..card-4)
heroHeadline     = .hero-content
stickyCardCount  = 4
```
Scroll-length budget expressed in svh units:
```
CARDS_ENTER_END        = 100
CARD_FLIP_TRIGGER      = 200
CARD_DISMISS_START     = 300
CARD_DISMISS_DURATION  = 100
TOTAL_SCROLL_SVH       = CARD_DISMISS_START + stickyCardCount * CARD_DISMISS_DURATION  = 700
svhToProgress(svh)     = svh / TOTAL_SCROLL_SVH          // maps an svh milestone to 0..1 progress
totalScroll(px)        = window.innerHeight * (TOTAL_SCROLL_SVH / 100)  = 7 * innerHeight
```
Tilt tables (index-aligned to the four back cards in DOM order):
```
cardFlipTiltAngles    = [-10, -20, -5, 10]    // rotationZ each card lands on when revealed
cardDismissTiltAngles = [-50, -60, -45, 50]   // rotationZ each card ramps to while dismissed
```

### Per-card dismiss windows (reverse order — this matters)
For each back card `i` (0..3), compute `dismissOrder = stickyCardCount - 1 - i`, then its progress window is
`[svhToProgress(CARD_DISMISS_START + dismissOrder*100), svhToProgress(CARD_DISMISS_START + (dismissOrder+1)*100)]`.
This makes the **last card in the DOM dismiss first**. Resulting windows (progress 0..1):
- card-4 (i=3) → `[0.4286, 0.5714]` (dismisses **first**)
- card-3 (i=2) → `[0.5714, 0.7143]`
- card-2 (i=1) → `[0.7143, 0.8571]`
- card-1 (i=0) → `[0.8571, 1.0]` (dismisses **last**)

Back-to-back, non-overlapping, each spanning 100/700 of progress.

### Initial state
```
gsap.set(frontStickyCard,  { rotationY: 0 });
gsap.set(backStickyCards,  { rotationY: -180 });
let isFlipped = false;
```

### The flip — imperative one-shot elastic tweens (NOT scrubbed)
Two helper functions fire a single spring animation when the flip threshold is crossed. All tweens: `duration: 1, ease: "elastic.out(1, 0.5)"`.

`revealBackCards()`:
- `frontStickyCard` → `rotationY: 180`
- each back card `i` → `rotationY: 0`, `rotationZ: cardFlipTiltAngles[i]`

`concealBackCards()` (reverse):
- `frontStickyCard` → `rotationY: 0`
- each back card → `rotationY: -180`, `rotationZ: 0`

### The scrubbed, pinned ScrollTrigger (the driver)
```
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${totalScroll}px`,   // 7 * innerHeight
  pin: true,
  pinSpacing: true,
  scrub: true,
  onUpdate: ({ progress }) => { ... }
});
```
Inside `onUpdate`, every frame, using `gsap.utils.mapRange` and `gsap.utils.clamp`:

1. **Enter phase** — `enterProgress = clamp(0, 1, mapRange(0, svhToProgress(100), 0, 1, progress))` (i.e. progress 0 → 0.1428 maps to 0 → 1, clamped after).
   - `gsap.set(stickyCards, { y: mapRange(0, 1, 50, -50, enterProgress) + "%" })` — **all five cards** rise from `y: 50%` to `y: -50%`.
   - `gsap.set(heroHeadline, { y: mapRange(0, 1, 0, -100, enterProgress) + "%" })` — headline exits from `y: 0%` to `y: -100%`.

2. **Flip trigger** (one-shot, latched by `isFlipped`):
   - if `progress > svhToProgress(200)` (0.2857) and `!isFlipped` → `revealBackCards(); isFlipped = true;`
   - else if `progress <= 0.2857` and `isFlipped` → `concealBackCards(); isFlipped = false;`

3. **Dismiss phase** — for each back card `i`, read its `[dismissStart, dismissEnd]` window, compute `dismissProgress = clamp(0, 1, mapRange(dismissStart, dismissEnd, 0, 1, progress))`, then:
   - `gsap.set(card, { y: mapRange(0, 1, -50, -250, dismissProgress) + "%", rotation: mapRange(0, 1, cardFlipTiltAngles[i], cardDismissTiltAngles[i], dismissProgress) })`.
   - So each back card slides from `y: -50%` up to `y: -250%` while its z-rotation ramps from its flip tilt to its dismiss tilt, only within its own scroll window. Note `rotation` here is the 2D z-rotation (alias of `rotationZ`), so it continues from where the flip left it.

Notes on interplay: the enter `gsap.set(stickyCards, …)` writes `y` on the back cards too, but since each back card's `dismissProgress` clamps to 0 before its window opens, its `y` sits at `-50%` — continuous with the group. The front card only ever receives the group `y`, so after the enter phase it rests at `y: -50%` and then flips away, staying put.

## Icons

This component uses **Ionicons v7.1.0** web components — `<ion-icon name="chevron-down">`, `<ion-icon name="eye-outline">`, `<ion-icon name="footsteps-outline">`, `<ion-icon name="leaf-outline">`, `<ion-icon name="moon-outline">`.
Ionicons is **not** an npm import here: it is two classic `<script>` tags in `<head>`, and the
custom element does the rest.

The demo serves its own copy, pinned and content-hashed. Point at it directly, or download the two
files and serve them from your own origin:

```
https://motionprompts.dev/c/_vendor/ionicons-7.1.0.eeda8f3b/ionicons.esm.js
https://motionprompts.dev/c/_vendor/ionicons-7.1.0.eeda8f3b/ionicons.js
```

```html
<script type="module" src="/c/_vendor/ionicons-7.1.0.eeda8f3b/ionicons.esm.js"></script>
<script nomodule src="/c/_vendor/ionicons-7.1.0.eeda8f3b/ionicons.js"></script>
```

If you self-host, take the **whole** `ionicons/` folder (`npm i ionicons@7.1.0` →
`node_modules/ionicons/dist/ionicons/`): the loader fetches its `p-*.entry.js` chunks and one
`svg/<name>.svg` per icon at runtime, resolved relative to the script's own URL. Copying just the
two entry files gives you a page with no icons and no error.

Any equivalent icon set is an acceptable substitute — keep the element and its selectors so the
animation still has something to target.

## Behavior notes
- Desktop-oriented, scroll-driven; the whole hero is pinned for `7 × viewport height` of scroll, so the page is tall. `pinSpacing: true` reserves that scroll length.
- The flip is a discrete spring (elastic) that plays once each direction as you cross the midpoint; the enter and dismiss motions are continuously scrubbed. Scrolling back up conceals the cards and reverses everything.
- Under `max-width: 1000px`, widen `.hero-content h1` and `.about h3` to 85%. Cards keep `min-width: 300px`.
- Keep `perspective`, `transform-style: preserve-3d`, and `backface-visibility: hidden` — without them the 3D flip and the hide-the-reverse-face behavior break.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--paper-dim`, `--ink`, `--blue`, `--coral`, `--gold`, `--green`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component's entire animation graph hangs off one pinned `ScrollTrigger`, so a first pass left without cleanup means the second mount pins `.hero` a second time: two triggers scrub the same five cards on every tick, each holding its own copy of `isFlipped`, so the elastic flip can fire from one trigger while the other still has its cards concealed, and Lenis ends up pumped by two ticker callbacks fighting over the same wheel event. The visible symptom is a stack that rises to two different heights or a flip that never quite lands where the scrollbar says it should, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script above runs at the top level: the four element lookups (`stickyCards`, `frontStickyCard`, `backStickyCards`, `heroHeadline`), the `Lenis` construction and its ticker wiring, the two `gsap.set` calls that put the front card face-up and the four back cards face-down, and the `ScrollTrigger.create(...)` pin all fire the instant the module is evaluated — which in React is import time, before this component has rendered a single `.card`. Move all of it into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` and `gsap.ticker.lagSmoothing(0)` are the two lines that can stay at module scope: both are one-time, app-wide configuration, harmless to run again on a remount.

*(2) Element lookups* — Scope `stickyCards`, `frontStickyCard`, `backStickyCards` and `heroHeadline` to a root ref instead of `document`. `backStickyCards`'s DOM order is load-bearing here, not incidental: the dismiss math derives each card's window from `stickyCardCount - 1 - i`, so it depends on `querySelectorAll(".card-back")` returning card-1 through card-4 in that exact order. An unscoped query during the StrictMode double-mount can return the outgoing copy's four cards instead of the live one — the pin then drives a stack that's on its way out of the tree, while the cards actually on screen sit frozen at their initial face-down, fanned-back position for the rest of the scroll. The same problem hides in `ScrollTrigger.create`'s own `trigger: ".hero"` — that's a bare selector, so ScrollTrigger resolves it with its own internal `document.querySelector`, not yours. Pass the section's actual DOM node (`root.querySelector(".hero")`, scoped under your root ref) instead of the string, or the trigger can pin the wrong copy of the hero for the same reason.

*(3) Cleanup* — Wrap the `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const frontStickyCard = root.querySelector(".card-front");
  const backStickyCards = root.querySelectorAll(".card-back");
  const stickyCards = root.querySelectorAll(".card");
  const heroHeadline = root.querySelector(".hero-content");

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  const onTick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(onTick);

  const ctx = gsap.context((self) => {
    let isFlipped = false;
    gsap.set(frontStickyCard, { rotationY: 0 });
    gsap.set(backStickyCards, { rotationY: -180 });

    ScrollTrigger.create({
      trigger: root.querySelector(".hero"),
      start: "top top",
      end: `+=${totalScroll}px`,
      pin: true,
      pinSpacing: true,
      scrub: true,
      onUpdate: ({ progress }) => {
        // enter-phase and dismiss-phase gsap.set(...) calls, unchanged from above
        if (progress > svhToProgress(CARD_FLIP_TRIGGER) && !isFlipped) {
          self.add(() => revealBackCards());
          isFlipped = true;
        } else if (progress <= svhToProgress(CARD_FLIP_TRIGGER) && isFlipped) {
          self.add(() => concealBackCards());
          isFlipped = false;
        }
      },
    });
  }, rootRef);

  return () => {
    gsap.ticker.remove(onTick);
    lenis.destroy();
    ctx.revert();
  };
}, []);
```

Note the factory above takes `self`, not `ctx`, as its argument. `ctx` is still in its temporal dead zone inside the factory, so reaching for it there — `ctx.add(...)` — throws `Cannot access 'ctx' before initialization`; `self` is what the factory actually receives, and it's what `onUpdate` closes over and calls `self.add` on.

`ctx.revert()` covers exactly two things here: the `ScrollTrigger` itself — including un-pinning `.hero` and removing its pin spacer, which matters because a lingering pin leaves `.about` sitting in the wrong place after unmount — and whatever `revealBackCards()`/`concealBackCards()` create the instant a `self.add(...)` call runs them. Both functions build their tweens with `gsap.to`, and they only ever run from inside `onUpdate`, on a scroll tick that happens long after the factory above has already returned; `gsap.context` cannot see a tween created that way unless you hand it over explicitly with `self.add`. Skip that wrapper and the elastic spring in flight when the user unmounts mid-flip keeps rotating a card that's already gone for whatever is left of its one-second run, and a StrictMode remount that flips again before the first spring finishes leaves two tweens animating the same node.

Don't extend `self.add` to the enter- and dismiss-phase `gsap.set` calls in the rest of `onUpdate` — they're plain property writes with nothing to spring back from, so the next tick (or the unmount itself) already overwrites or discards them; wrapping them buys no extra safety, only extra bookkeeping on every scroll frame. And keep `isFlipped` a plain variable closed over by the factory, the way the original script already keeps it as a bare module-level flag — it never drives JSX, so lifting it into `useState` would schedule a render on every crossing of the flip threshold for no reason, and a `useRef` would only add a layer of indirection for a value nothing outside this effect reads.

The `gsap.ticker.add((time) => lenis.raf(time * 1000))` line shown earlier in this document passes an anonymous arrow — keep a named reference instead, as `onTick` does above, since `gsap.ticker.remove` needs the exact same function object to unsubscribe it; an anonymous arrow passed straight to `.add` can never be removed. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — that listener lives on the Lenis instance's own emitter, so `lenis.destroy()` clears it as a side effect. Remove the ticker callback and destroy Lenis before calling `ctx.revert()`, not after: otherwise a tick landing between the two calls can still invoke `.raf()` on an instance the same cleanup is about to tear down, or push a scroll update into triggers that no longer exist. The note above about lifting Lenis to a shared app shell still applies unchanged if this hero stops being the whole page.
