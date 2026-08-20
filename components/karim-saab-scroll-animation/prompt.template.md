---
slug: karim-saab-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Masked Image Reveal Scroll Animation (Pinned Spotlight + Growing SVG Mask)

## Goal
Build a cinematic scroll-story section: after an intro screen, a **spotlight section pins for 7 viewport-heights**. During the first half of the pin, a **300svh-tall grid of desaturated portrait photos scrolls vertically upward** past a fixed centered headline. Overlapping it (progress 0.25 → 0.75), a full-viewport banner image is **revealed through a CSS `mask` shaped like a bold inverted-Y emblem whose `mask-size` grows from 0% to 450%** while the image inside scales down 1.5 → 1. In the final stretch (0.75 → 0.95) a second headline appears **word by word** (hard opacity toggles via SplitText). One `ScrollTrigger` with `onUpdate` drives everything; scroll is smoothed with Lenis.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** and **`SplitText`** plugins, plus **`lenis`**:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
```
Everything runs inside a `DOMContentLoaded` listener. Register both plugins, then wire Lenis the standard way:
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
No timelines, no tweens — the entire effect is **one `ScrollTrigger.create()` whose `onUpdate` writes absolute states** with `gsap.set` and direct `style.setProperty` calls.

## Layout / HTML
```html
<body>
  <nav>
    <img src="(logo)" alt="" />
  </nav>

  <section class="intro">
    <div class="header"><h1>Awaken the Scroll</h1></div>
  </section>

  <section class="spotlight">
    <div class="header"><h1>Where Frames Fade Into Fate</h1></div>

    <div class="spotlight-images">
      <div class="row">
        <div class="img"></div>
        <div class="img"><img src="(photo-1)" /></div>
        <div class="img"></div>
        <div class="img"><img src="(photo-2)" /></div>
      </div>
      <div class="row">
        <div class="img"><img src="(photo-3)" /></div>
        <div class="img"></div>
        <div class="img"></div>
        <div class="img"></div>
      </div>
      <div class="row">
        <div class="img"></div>
        <div class="img"><img src="(photo-4)" /></div>
        <div class="img"><img src="(photo-5)" /></div>
        <div class="img"></div>
      </div>
      <div class="row">
        <div class="img"></div>
        <div class="img"><img src="(photo-6)" /></div>
        <div class="img"></div>
        <div class="img"><img src="(photo-7)" /></div>
      </div>
      <div class="row">
        <div class="img"><img src="(photo-8)" /></div>
        <div class="img"></div>
        <div class="img"><img src="(photo-9)" /></div>
        <div class="img"></div>
      </div>
    </div>

    <div class="mask-container">
      <div class="mask-img"><img src="(banner)" alt="" /></div>
      <div class="header"><h1>The Last Frame Hits Hard</h1></div>
    </div>
  </section>

  <section class="outro">
    <h1>End of Act One</h1>
  </section>
  <script type="module" src="./script.js"></script>
</body>
```
5 rows × 4 tiles = 20 `.img` slots, but **only 9 contain an `<img>`** in this exact scatter pattern (row 1: slots 2 & 4 · row 2: slot 1 · row 3: slots 2 & 3 · row 4: slots 2 & 4 · row 5: slots 1 & 3). The empty `.img` divs stay in the flow to preserve the sparse checkerboard rhythm. The JS queries `.spotlight-images`, `.mask-container`, `.mask-img`, and `.mask-container .header h1` — keep those exact.

## Styling
Google Font: **"Barlow Condensed"** (load all weights; 900 is the one used).

- Global reset `* { margin:0; padding:0; box-sizing:border-box; }`; `img { width:100%; height:100%; object-fit:cover; }`.
- `h1 { text-transform:uppercase; font-family:"Barlow Condensed"; font-size:6rem; font-weight:900; line-height:0.85; letter-spacing:-0.02rem; }` — huge condensed poster type.
- `nav`: glassmorphism pill — `position:fixed; top:2rem; left:50%; transform:translateX(-50%); width:35%; padding:1rem 0;` flex-centered, `background:rgba(255,255,255,0.2); backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1); border-radius:0.5rem; z-index:2;`. Its logo img: `width:1.5rem; object-fit:contain;`.
- Every `section`: `position:relative; width:100vw; height:100svh; background:#161616; color:#fff; overflow:hidden;`. `.spotlight` overrides background to **`#101010`**. `.intro`/`.outro` are flex-centered.
- `.header` (used in intro, spotlight, and inside the mask): `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; width:50%; z-index:1;`.
- `.spotlight-images`: `position:absolute; top:0; left:0; width:100vw; height:300svh;` flex column with `justify-content:space-between;` and **initial CSS state `transform:translateY(5%)`** (must match the JS start value so there's no jump); `will-change:transform;`.
- `.row { width:100%; padding:2rem; display:flex; gap:2rem; }`; `.img { flex:1; aspect-ratio:5/7; overflow:hidden; }`; grid photos are muted: `.img img { opacity:0.5; filter:saturate(0); }`.
- `.mask-container`: `position:absolute; top:0; left:0; width:100vw; height:100svh; overflow:hidden; z-index:10;` with the CSS mask:
  ```css
  -webkit-mask: url(./spotlight-mask.svg) center / contain no-repeat;
  mask: url(./spotlight-mask.svg) center / contain no-repeat;
  -webkit-mask-size: 0%;
  mask-size: 0%;
  ```
  (`center` position is what makes the reveal bloom from the middle as the size grows.) `.mask-img { width:100%; height:100%; }`.
- `@media (max-width:1000px)`: `h1 { font-size:4rem; }`; `nav` and `.header` become `width:calc(100% - 4rem);`; `.spotlight-images { width:200vw; left:-25vw; }` so the tiles keep a chunky portrait size on narrow screens.

### The mask SVG
Create `spotlight-mask.svg` in the project: a single solid-black filled path on a transparent background — a **bold inverted-Y emblem**: a thick vertical stem dropping from the top edge to about half height, then splitting into two thick diagonal legs that spread down to the bottom-left and bottom-right corners (like an upward arrow / bird-foot glyph). Exact geometry:
```svg
<svg width="800" height="693" viewBox="0 0 800 693" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M800 515.749L501.926 343.832V0H297.482V343.832L0 515.749L101.926 693L399.408 521.084L697.482 693L800 515.749Z" fill="black"/>
</svg>
```

## GSAP effect (the important part — be exhaustive)

### Setup measurements (taken once on load)
```js
const spotlightContainerHeight = spotlightImages.offsetHeight; // 300svh in px
const viewportHeight = window.innerHeight;
const initialOffset = spotlightContainerHeight * 0.05;         // the CSS translateY(5%)
const totalMovement = spotlightContainerHeight + initialOffset + viewportHeight;
```

### SplitText on the mask headline
Split `.mask-container .header h1` **by words**:
```js
headerSplit = SplitText.create(maskHeader, { type: "words", wordsClass: "spotlight-word" });
gsap.set(headerSplit.words, { opacity: 0 });
```

### The single ScrollTrigger
```js
ScrollTrigger.create({
  trigger: ".spotlight",
  start: "top top",
  end: `+=${window.innerHeight * 7}px`, // 7 viewport-heights of pinned scroll
  pin: true,
  pinSpacing: true,
  scrub: 1,                             // 1s catch-up smoothing
  onUpdate: (self) => { /* three phases below */ },
});
```
Everything reads `progress = self.progress` and writes absolute values — **no ease, no duration, no delay, no stagger anywhere**; all ramps are linear functions of progress and the floaty feel comes entirely from `scrub: 1` + Lenis inertia. Being scrub-driven, every phase is fully reversible.

**Phase A — image grid scroll-through (progress 0 → 0.5):** only while `progress <= 0.5`:
```js
const imagesMoveProgress = progress / 0.5;
const startY = 5;                                                    // %
const endY = -(totalMovement / spotlightContainerHeight) * 100;      // ≈ −138%
const currentY = startY + (endY - startY) * imagesMoveProgress;
gsap.set(spotlightImages, { y: `${currentY}%` });
```
The 300svh grid starts nudged 5% down and travels linearly up until it has fully exited above the viewport (its own height + the initial offset + one viewport). Past 0.5 nothing is written, so it just stays parked off-screen.

**Phase B — mask reveal (progress 0.25 → 0.75, overlapping phase A):** three branches:
- `0.25 ≤ progress ≤ 0.75`:
  ```js
  const maskProgress = (progress - 0.25) / 0.5;
  const maskSize = `${maskProgress * 450}%`;          // 0% → 450%
  const imageScale = 1.5 - maskProgress * 0.5;        // 1.5 → 1
  maskContainer.style.setProperty("-webkit-mask-size", maskSize);
  maskContainer.style.setProperty("mask-size", maskSize);
  gsap.set(maskImage, { scale: imageScale });
  ```
  The inverted-Y cutout blooms from a point at the center; once `mask-size` passes ~100% the shape outgrows the viewport and the banner becomes effectively fullscreen. Meanwhile the banner image inside settles from an oversized 1.5 to its natural size — a slow push-back that sells the reveal.
- `progress < 0.25`: hard-hold `mask-size: 0%` (both properties) and `scale: 1.5`.
- `progress > 0.75`: hard-hold `mask-size: 450%` and `scale: 1`.

**Phase C — word-by-word headline (progress 0.75 → 0.95):** three branches on the SplitText words:
- `0.75 ≤ progress ≤ 0.95`:
  ```js
  const textProgress = (progress - 0.75) / 0.2;
  headerSplit.words.forEach((word, index) => {
    const wordRevealProgress = index / totalWords;
    gsap.set(word, { opacity: textProgress >= wordRevealProgress ? 1 : 0 });
  });
  ```
  Words pop in sequentially left-to-right as **binary opacity switches (0 or 1)** — a typewriter-like reveal with no fades, no stagger tweens.
- `progress < 0.75`: all words `opacity: 0`.
- `progress > 0.95`: all words `opacity: 1`. The last 5% of the pin holds the finished frame.

## Assets / images
- **9 portrait editorial photographs, 5:7 aspect** — moody, cinematic people/scene shots for the grid tiles. CSS renders them desaturated (`saturate(0)`) at 50% opacity, so tonal contrast matters more than color.
- **1 wide cinematic banner photograph, landscape (≥16:9, full-viewport cover)** — the hero image revealed through the mask; it must hold up fullscreen.
- **1 small monochrome logo mark, square-ish, transparent background** (~1.5rem display size) for the glass nav pill.
- **1 SVG mask file** (`spotlight-mask.svg`) — created inline per the Styling section, not a photo.

Keep all copy neutral (the demo headlines above) — no real brand names.

## Behavior notes
- Total experience: intro (1 viewport) → spotlight pinned for `7 × innerHeight` of scroll → outro (1 viewport). `pinSpacing: true` provides the scroll runway.
- Choreography overlap is the signature: the grid is still rushing upward (phase A ends at 0.5) while the mask is already blooming (phase B starts at 0.25) — the reveal punches through the moving grid. `.mask-container` sits at `z-index:10`, so as the mask grows it covers both the grid and the "Where Frames Fade Into Fate" headline behind it.
- The centered spotlight headline never animates — it's a fixed backdrop the grid scrolls past.
- Measurements are captured once on `DOMContentLoaded`; no resize handler in the original.
- Sections use `100svh` so mobile browser chrome doesn't clip; the effect runs unchanged on mobile (≤1000px only re-sizes type, widens nav/headers, and lets the grid bleed to 200vw).
- No CustomEase, no Three.js, no lerp/rAF loop beyond the standard Lenis ticker, no reduced-motion branch in the original.

## Images

This component ships with 12 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/karim-saab-scroll-animation/img1.jpg
https://motionprompts.dev/c/karim-saab-scroll-animation/img2.jpg
https://motionprompts.dev/c/karim-saab-scroll-animation/img3.jpg
https://motionprompts.dev/c/karim-saab-scroll-animation/img4.jpg
https://motionprompts.dev/c/karim-saab-scroll-animation/img5.jpg
https://motionprompts.dev/c/karim-saab-scroll-animation/img6.jpg
… 6 more under https://motionprompts.dev/c/karim-saab-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--panel`, `--paper`, `--silver`, `--safelight`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, wires a single `Lenis` instance into the `gsap.ticker`, and drives all three phases of the effect — the grid scroll-through, the mask bloom, the word-by-word headline — off one `ScrollTrigger`'s `onUpdate`, writing every frame's state with direct `gsap.set` and `style.setProperty` calls and never undoing any of it, because the page it lives on never unmounts. React withdraws that guarantee, and it does it quietly: the pin and the reveal look right on first load, and the damage only shows up on a second mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here: two pinned `ScrollTrigger`s stacked on the same `.spotlight` section, each with its own spacer, both writing conflicting `y` to `.spotlight-images` and conflicting `mask-size` to `.mask-container` on the same scrub tick; two `Lenis` instances both calling `raf` off the same `gsap.ticker`; and a second `SplitText.create` run against a headline whose words are already split, nesting spans inside spans so the `.spotlight-word` targets the newer `onUpdate` closure reads no longer line up with the ones the older closure is still writing to. None of this reproduces in a production build, because React only double-invokes in development.

*(1) The entry point* — the whole effect is the body of `document.addEventListener("DOMContentLoaded", () => { ... })`. By the time a React component mounts, that event has already fired, so the listener would simply never run — no pin, no mask, no split, nothing to debug. Delete the listener and move its contents into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger, SplitText)` is one-time, page-wide configuration; move it to module scope next to the imports instead of re-running it on every mount.

*(2) Element lookups* — `.spotlight-images`, `.mask-container`, `.mask-img`, and `.mask-container .header h1` are each resolved with `document.querySelector`, and the trigger itself is created against the string `".spotlight"`. Give the component a root ref on the `<section className="spotlight">` element — that's what the pin and every measurement are relative to — and resolve all four lookups from it instead of `document`. Pass the ref itself as `trigger` in `ScrollTrigger.create` rather than the selector string. During the StrictMode remount two `.spotlight` subtrees exist for an instant, and an unscoped lookup can bind to the copy on its way out; worse, `spotlightContainerHeight = spotlightImages.offsetHeight`, measured once against a detached node, comes back stale or zero and wrecks the `endY` math the whole grid phase depends on.

*(3) Cleanup* — wrap the `SplitText.create` call and the single `ScrollTrigger.create` in one `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const lenis = new Lenis();
  const onTick = (time) => lenis.raf(time * 1000);

  const ctx = gsap.context(() => {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // measurements, SplitText.create(maskHeader, ...), and the ScrollTrigger.create
    // with its onUpdate exactly as above, trigger pointed at the root ref
  }, rootRef);

  return () => {
    gsap.ticker.remove(onTick);
    lenis.destroy();
    ctx.revert();
  };
}, []);
```

Nothing here needs `ctx.add`/`self`: the `onUpdate` callback only ever calls `gsap.set` and `style.setProperty` synchronously, on every scrub frame, and no click handler or code outside the factory ever has to call back into something registered under a name. `ctx.revert()` undoes the pinned trigger — which also removes its spacer and un-pins `.spotlight` — the `SplitText` created inside the same factory, and every value the three `onUpdate` phases wrote through `gsap.set` (`.spotlight-images`'s `y`, `.mask-img`'s `scale`, each `.spotlight-word`'s `opacity`). It does **not** reach the two plain writes the mask phase makes directly on `maskContainer.style` — `style.setProperty("mask-size", ...)` and its `-webkit-` twin bypass GSAP entirely, so they aren't GSAP state and the context never sees them. Left alone, whichever `mask-size` the pin last wrote stays sitting on the element after `ctx.revert()`, on the same DOM node StrictMode's fake unmount reuses for the fake remount — so a fresh `ScrollTrigger`, created at progress zero, can start life with the mask already blooming from the previous run. Clear both properties explicitly in the same cleanup (`maskContainer.style.removeProperty("mask-size")` and `"-webkit-mask-size"`) so a remount always starts from the same unrevealed state the CSS default gives it.

`gsap.ticker.add(onTick)` is what drives Lenis here — this component has no `requestAnimationFrame` loop of its own — and a ticker subscription is neither a tween nor a trigger, so the context does not track it either. Remove it explicitly, and do it *before* `lenis.destroy()`: a tick that lands between the two calls invokes `raf` on an instance that no longer exists. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — it lives on the Lenis instance's own emitter and goes with it. This component is written as a full page and is the sole owner of the smooth scroll, so creating and destroying `Lenis` here is correct as long as that stays true; folded into an app that already runs Lenis elsewhere, this effect should subscribe to the shared instance instead of opening a second one that fights the first over the same wheel event.

One thing `SplitText` needs here that the other two phases don't: create it inside the same `gsap.context` factory, not before or outside it, so `ctx.revert()` reverts the split in the same step as the trigger that writes to its words. Revert it separately, or in the wrong order relative to the trigger's teardown, and a second mount ends up calling `SplitText.create` on a headline that is still split from the first. The split here is by `words`, not `lines`, which matters for one thing this component can otherwise skip: a font that hasn't finished loading (`"Barlow Condensed"` at the weight the headline uses) doesn't corrupt the reveal the way it would for a line split. `wordRevealProgress = index / totalWords` keys off DOM order, not which line a word wraps to, so a fallback-face reflow doesn't change which word `onUpdate` unlocks at a given `progress` — it only changes where that word sits on screen for the instant before the real font swaps in.
