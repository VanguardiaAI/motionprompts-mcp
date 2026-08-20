# Sticky Cards ScrollTrigger — Pinned Full-Screen Deck That Shrinks Each Image

## Goal
Build a full-screen, scroll-driven image gallery. A hero heading and a stack of full-viewport image cards are each **pinned in place one after another** with ScrollTrigger (`pin`, `pinSpacing:false`, `scrub`), so every card holds fixed while the next section scrolls up and covers it. As a card gets covered, **its centered image scales down from 1 to 0.5** (a fixed 1000×700 frame shrinking to half). The giant hero headline **fades its opacity from 1 to 0** across the first 400vh of scroll. The last card scrolls normally (not pinned), then a footer releases the whole pinned stack. The signature effect is the layered "sticky cards" stack with each image quietly shrinking as it's buried.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the single GSAP plugin **`ScrollTrigger`**. No other plugins, no Lenis, no framework — plain Vite-style module imports:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
```
Register once: `gsap.registerPlugin(ScrollTrigger);`. Wrap all setup in a `DOMContentLoaded` listener. Native scroll (no smooth-scroll library).

## Layout / HTML
A `.container` wraps a fixed logo, a hero section, six card sections, and a footer. Class names are load-bearing — the JS queries `.pinned`, `.card.scroll`, `.img`, `.footer`, and `.hero h1`.

```html
<div class="container">
  <div class="logo"><a href="#">Flow Canvas</a></div>

  <section class="hero pinned">
    <h1>Sculpted Zen <br />Playground</h1>
  </section>

  <section class="card pinned"><div class="img"><img src="…img1" alt="" /></div></section>
  <section class="card pinned"><div class="img"><img src="…img2" alt="" /></div></section>
  <section class="card pinned"><div class="img"><img src="…img3" alt="" /></div></section>
  <section class="card pinned"><div class="img"><img src="…img4" alt="" /></div></section>
  <section class="card pinned"><div class="img"><img src="…img5" alt="" /></div></section>

  <section class="card scroll"><div class="img"><img src="…img6" alt="" /></div></section>

  <section class="footer"><h1>Footer</h1></section>
</div>

<script type="module" src="./script.js"></script>
```

Structure notes — these are what the effect hangs on:
- **`.pinned` matches 6 elements**: the hero (`class="hero pinned"`) **plus** the five image cards (`class="card pinned"`). The hero is treated as a pinned section too, even though it has **no `.img`** child (only an `<h1>`).
- The **sixth/last** card is `class="card scroll"` (NOT `.pinned`) — it scrolls normally and is never pinned or scaled.
- Every image card is `section.card > div.img > img`. The `.img` div is the animated element (the image scales via its wrapper).
- Copy is fictional demo text: logo "Flow Canvas", hero "Sculpted Zen / Playground" (two lines via `<br>`), footer "Footer".

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`.

Palette & type:
- Page background **`#000`** (pure black); all text **`#fff`**.
- Font family: a neutral sans-serif at weight 400 for everything (original references a proprietary face named "PP Acma" — any clean grotesque/sans is fine).

```css
html, body { width:100%; height:100%; font-family:"PP Acma", sans-serif; background:#000; }
img { width:100%; height:100%; object-fit:cover; }
.container { width:100%; height:100%; }

section { width:100vw; height:100vh; }   /* every section is a full viewport */
```

- **Logo** — fixed banner, top-center, above everything:
  ```css
  .logo { position:absolute; top:0; left:50%; transform:translateX(-50%); padding:2em; z-index:2; }
  .logo a { text-decoration:none; font-size:24px; font-weight:400; color:#fff; }
  ```
- **Hero heading** — huge centered display type:
  ```css
  .hero h1 {
    position:absolute; width:100%; top:50%; left:50%; transform:translate(-50%,-50%);
    text-align:center; font-weight:400; font-size:200px; color:#fff;
    letter-spacing:-8px; line-height:90%;
  }
  ```
- **The image frame** — a fixed-size box centered in each card, centered with a 3D-safe transform (important, GSAP scales it):
  ```css
  .img {
    position:absolute; top:50%; left:50%;
    transform:translate3d(-50%,-50%,0);
    width:1000px; height:700px;              /* ~10:7 landscape, object-fit:cover */
  }
  ```
- **Last (scroll) card** gets `position:relative;` — `.card.scroll { position:relative; }`. (The pinned cards keep the default static position; only the scrolling card is made relative.)
- **Footer** — half-height, flex-centered:
  ```css
  .footer { width:100%; height:50vh; display:flex; justify-content:center; align-items:center; color:#fff; }
  .footer h1 { font-size:48px; font-weight:400; letter-spacing:-2px; }
  ```

The document is naturally tall: 7 sections at 100vh (hero + 6 cards) + a 50vh footer ≈ **750vh** of native scroll. `pinSpacing:false` (below) means the pins do **not** add extra scroll length.

## GSAP effect (be exhaustive — this is the core)

Everything runs inside `document.addEventListener("DOMContentLoaded", …)` after `gsap.registerPlugin(ScrollTrigger)`.

### References
```js
const footer         = document.querySelector(".footer");
const lastCard       = document.querySelector(".card.scroll");
const pinnedSections = gsap.utils.toArray(".pinned");   // 6: hero + 5 image cards
```

### Per-pinned-section loop — TWO ScrollTriggers per section
`pinnedSections.forEach((section, index, sections) => { … })`. For each of the 6 pinned sections:

```js
let img = section.querySelector(".img");   // hero → null (GSAP tolerates a null target, no-op)

let nextSection   = sections[index + 1] || lastCard;                       // the section that will cover this one
let endScalePoint = `top+=${nextSection.offsetTop - section.offsetTop} top`; // = one viewport height of scroll
```

**(A) The pin trigger** — a target-less `gsap.to` whose only job is to attach a pin (it animates no properties):
```js
gsap.to(section, {
  scrollTrigger: {
    trigger: section,
    start: "top top",
    end: index === sections.length
      ? `+=${lastCard.offsetHeight / 2}`                 // dead branch — index never equals length
      : footer.offsetTop - window.innerHeight,           // effective end for ALL pinned sections
    pin: true,
    pinSpacing: false,
    scrub: 1,
  },
});
```
- `start:"top top"` — the section pins the moment its top reaches the top of the viewport.
- `end` is a **bare number** (`footer.offsetTop - window.innerHeight`, ≈ **600vh in px**). A numeric ScrollTrigger `end` is an **absolute page scroll position**, not relative — so **every** pinned section releases at that same scroll point (when the footer's top reaches the bottom of the viewport). Hero pins from scroll 0→600vh; card 1 from 100vh→600vh; … card 5 from 500vh→600vh. (The ternary's true branch is unreachable — `index` maxes at `sections.length - 1` — so all six use the absolute end.)
- **`pinSpacing:false`** is essential: no spacer is inserted, so the next section scrolls **up over** the pinned one instead of pushing content down. This is what makes the cards physically stack/overlap. Later DOM = painted on top, so each new card covers the previous.
- `scrub:1` → ~1s of smoothing catch-up between scroll position and the pin.

**(B) The image-scale trigger** — a separate scrubbed `fromTo` shrinking the `.img` wrapper:
```js
gsap.fromTo(
  img,
  { scale: 1 },
  {
    scale: 0.5,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: endScalePoint,     // "top+=<Δ> top" where Δ = distance to next section ≈ 100vh
      scrub: 1,
    },
  }
);
```
- Animates **`scale: 1 → 0.5`** on the `.img` box (linear, `ease:"none"`), scrubbed over exactly the scroll span during which the **next** section rises up to cover this one (`endScalePoint` = the pixel gap to the next section's top = one viewport height).
- Because `.img` is centered with `translate3d(-50%,-50%,0)`, the scale collapses toward the card's center. The 1000×700 frame becomes 500×350 by the time it's fully buried, then stays frozen at 0.5 while the section remains pinned (pin lasts to 600vh, far past the scale's 100vh span).
- The **hero** section's `img` is `null`, so its scale tween is a harmless no-op — the hero only fades (below). The **last** card (`.card.scroll`) is not in `.pinned`, so it never scales and never pins; it scrolls past at full size.

### Hero heading opacity fade (independent trigger)
```js
const heroH1 = document.querySelector(".hero h1");
ScrollTrigger.create({
  trigger: document.body,
  start: "top top",
  end: "+=400vh",
  scrub: 1,
  onUpdate: (self) => {
    heroH1.style.opacity = 1 - self.progress;   // 1 → 0 across the first 400vh of scroll
  },
});
```
- A body-level ScrollTrigger spanning the **first 400vh** of scroll. Its `onUpdate` writes the hero `<h1>`'s inline `opacity` directly (no tween) as `1 - progress`, so the headline linearly fades from fully visible to invisible while the first cards begin stacking over the hero. `scrub:1` smooths it.

### Net choreography (top → bottom scroll)
1. Hero is pinned; its 200px headline fades 1→0 over the first 400vh while card 1 scrolls up to cover it.
2. Each image card, as it reaches the top, pins; the previous card's image has already shrunk toward 0.5 as this new card rose over it. The stack keeps building — up to 6 sections pinned simultaneously, each frozen at its final scale.
3. The 6th card (`.card.scroll`) is NOT pinned — it scrolls normally over the pinned stack at full 1000×700 size.
4. When the footer's top reaches the viewport bottom (scroll ≈ 600vh) **all pins release together**, and the footer ("Footer", 50vh) scrolls into view.
- All motion is **linear and scrubbed** — the only smoothing is `scrub:1`. No timelines, labels, stagger, delay, SplitText, CustomEase, lerp/rAF loops, or Three.js. Just per-section pin + `scale 1→0.5`, plus the hero opacity fade.

## Assets / images
**6 images**, one per card, each shown inside the fixed **1000×700 px (~10:7 landscape)** `.img` frame with `object-fit:cover`. Use a cohesive, minimal/editorial set — the effect reads best with quiet, well-composed images (e.g. full-bleed editorial street/fashion portraits and soft abstract color-gradient/texture fields). No brands, logos, or text in the images.
- `img1`–`img5` → the five **pinned** cards (these are the ones that scale down as they're covered).
- `img6` → the final **scrolling** card (stays full size).

If fewer source images are available, repeat them in order; if more, use the first six.

## Behavior notes
- **Desktop-first, native scroll.** No Lenis/smooth-scroll and no reduced-motion branch in the original — nothing autoplays; every motion is scroll-scrubbed, so it only moves as the user scrolls.
- **Full-viewport sections.** Keep each `section` at `width:100vw; height:100vh` (footer 50vh). The tall document (~750vh) plus `pinSpacing:false` supplies the scroll distance; do not add extra spacers.
- **`pinSpacing:false` + numeric absolute `end` are the crux** — together they make all pinned sections release at one shared scroll position and let later cards overlap earlier ones. Changing either breaks the stacking look.
- The hero has no image, so its scale tween targets `null` — this is intentional/expected (GSAP just skips it); do not add an `.img` to the hero.
- Values are computed once at load from `offsetTop` / `window.innerHeight`; the original does not recompute on resize.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/sticky-cards-2/img1.jpg
https://motionprompts.dev/c/sticky-cards-2/img2.jpg
https://motionprompts.dev/c/sticky-cards-2/img3.jpg
https://motionprompts.dev/c/sticky-cards-2/img4.jpg
https://motionprompts.dev/c/sticky-cards-2/img5.jpg
https://motionprompts.dev/c/sticky-cards-2/img6.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--muted`, `--line`, `--bg`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, reaches into the page with plain `document.querySelector` and `gsap.utils.toArray`, and wires up thirteen ScrollTrigger instances from that single run — two per pinned section (the pin and the `.img` scale tween) across the six `.pinned` elements, plus the body-level trigger driving the hero fade — and never has to undo any of them, because the tab reloads long before a second run could collide with the first.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. A double run here doesn't just double one trigger, it doubles the whole stack: two pins on each of the six sections disagreeing about the same scrub, two `.img` scale tweens fighting over the same `scale` property, and two body-level triggers both writing into `heroH1.style.opacity` from their own copy of `self.progress`. The visible symptom is stutter in the pin handoff between cards and a headline that flickers between two fade curves, and none of it reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script subscribes straight to `DOMContentLoaded` with no `readyState` guard in front of it. By the time a React component mounts, that event has already fired, so a listener attached this way is simply never invoked — no pin, no scale, no fade, nothing to debug. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its body — the `pinnedSections.forEach(...)` loop that builds the pin-and-scale pair for each section, and the trailing `ScrollTrigger.create` for the hero fade — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can stay exactly where it is, at module scope.

*(2) Element lookups* — `.footer`, `.card.scroll` (`lastCard`) and `.hero h1` are each fetched off `document` directly, and `gsap.utils.toArray(".pinned")` walks the whole document for its six matches too. Give the outer `.container` a root ref and resolve all four the same way, off that ref: `rootRef.current.querySelector(".footer")`, `rootRef.current.querySelector(".card.scroll")`, `rootRef.current.querySelector(".hero h1")`, and `Array.from(rootRef.current.querySelectorAll(".pinned"))` in place of the global `toArray`. `section.querySelector(".img")` inside the forEach loop is already scoped to `section` and needs no change. This is not a style nit here specifically: during the StrictMode remount two copies of the six-section stack exist for an instant, and `.pinned` or `.card.scroll` resolving against the outgoing copy means the pin, the scale tween and the offset math (`nextSection.offsetTop`, `footer.offsetTop`) all get built against elements that are about to be removed.

*(3) Cleanup* — Wrap the forEach loop and the hero-fade trigger in one `gsap.context` scoped to the root ref, and revert it on cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const footer = rootRef.current.querySelector(".footer");
    const lastCard = rootRef.current.querySelector(".card.scroll");
    const pinnedSections = Array.from(rootRef.current.querySelectorAll(".pinned"));
    const heroH1 = rootRef.current.querySelector(".hero h1");
    // pinnedSections.forEach(...) building the pin trigger and the .img scale
    // tween exactly as above, then the body-level ScrollTrigger.create for heroH1
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Without the revert, the remount leaves the second copy's twelve per-section triggers stacked on the first's — same six sections, same numeric `end` computed from `footer.offsetTop`, both still scrubbing against the same scroll.

One write in this effect sits outside what `ctx.revert()` can see. The hero fade doesn't animate `heroH1` through a tween — it sets `heroH1.style.opacity = 1 - self.progress` directly inside the trigger's `onUpdate`. `ctx.revert()` restores properties GSAP itself animated back to their pre-effect values; a bare `element.style.x = …` assignment was never GSAP's to track. On the StrictMode remount, the first effect's trigger is killed mid-scroll, and whatever opacity it last wrote — anywhere between fully visible and fully transparent, depending on where the scroll position happened to be — stays painted on the headline until the second effect's own `onUpdate` next fires on a scroll event. Route it through `gsap.set(heroH1, { opacity: 1 - self.progress })` instead of the raw assignment: same visible fade, but now the value is part of GSAP's own record of the element, and `ctx.revert()` restores it along with the pins and the scale tweens.
