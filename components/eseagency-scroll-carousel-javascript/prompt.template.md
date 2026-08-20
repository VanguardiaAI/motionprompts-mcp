---
slug: eseagency-scroll-carousel-javascript
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 4
structural:
  - { kind: duration, literal: "10", rule: duration/loop }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"linear\"", rule: ease/scrub-linear }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Scroll-Powered Full-Screen Project Carousel (Clip-Path Wipes + Marquee Titles)

## Goal
Build a full-screen, editorial project carousel that is **pinned by ScrollTrigger and driven entirely by scroll progress**: as the user scrolls through 15 viewport-heights of pinned distance, 5 slides swap in and out. Each swap is a **1-second clip-path polygon wipe** — the incoming slide unclips from one edge while the outgoing slide collapses toward the opposite edge — combined with **opposing parallax `y` translations** on the slide image (±25%) and the slide copy (±100%), all on `power4.inOut`. On every slide, the giant project title scrolls sideways forever as an **infinite GSAP linear marquee**, and **5 progress bars** at the bottom fill left-to-right via a `--progress` CSS variable. Direction-aware: scrolling back reverses the wipe direction. Scroll is smoothed with Lenis.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin, plus **`lenis`** for smooth scrolling:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```
Everything runs inside a `DOMContentLoaded` listener. Wire Lenis the standard way:
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Keep the slide data in a separate `slides.js` ES module (default-exported array of `{ tag, marquee, image }` objects) imported by the main script.

## Layout / HTML
```html
<body>
  <nav>
    <div class="logo"><a href="#">nova</a></div>
    <div class="nav-items">
      <a href="#">Home</a><a href="#">Projects</a><a href="#">Gallery</a>
      <a href="#">Experiences</a><a href="#">Contact</a>
    </div>
  </nav>

  <section class="intro">
    <p>Where Vision Ignites and Boundaries Fade.</p>
  </section>

  <section class="carousel">
    <div class="slide">
      <div class="slide-img"><img src="(slide image 1)" alt="" /></div>
      <div class="slide-copy">
        <div class="slide-tag"><p>Website</p></div>
        <div class="slide-marquee">
          <div class="marquee-container">
            <h1>Eclipse Interactive Art Portfolio</h1>
          </div>
        </div>
      </div>
    </div>
    <div class="carousel-progress">
      <div class="progress-bar"></div>
      <div class="progress-bar"></div>
      <div class="progress-bar"></div>
      <div class="progress-bar"></div>
      <div class="progress-bar"></div>
    </div>
  </section>

  <section class="outro">
    <p>Endless Horizons Await Beyond the Canvas.</p>
  </section>
  <script type="module" src="./script.js"></script>
</body>
```
Only the **first slide** exists in the HTML — the other 4 are created dynamically by JS. The class names `.carousel`, `.slide`, `.slide-img`, `.slide-copy`, `.slide-tag`, `.slide-marquee`, `.marquee-container`, `.carousel-progress`, `.progress-bar` are all queried by JS/CSS — keep them exact.

The 5 slides' data (in `slides.js`):

| # | tag | marquee title |
|---|------------|--------------------------------------|
| 1 | Website | Atlas · Interactive Art Archive |
| 2 | Identity | Solano · Avant-Garde Brand System |
| 3 | Exhibition | Lumen · Immersive Light Room |
| 4 | Immersive | Halcyon · Virtual Reality Space |
| 5 | Campaign | Ember · Global Launch Film |

## Styling
Fonts: **Space Grotesk** (`--display`, the marquee title and the logo), **Inter** (`--sans`, body), **Space Mono** (`--mono`, tags and small labels).

Palette — a **light** page with one dark section: the still intro/outro sit on bone, the carousel itself inverts to near-black, and a single warm red is the only accent.
```css
:root {
  --bg: #f2f2f2;
  --ink: #16161a;
  --graphite: #2b2b31;
  --accent: #ff4e45;
  --muted: rgba(22, 22, 26, 0.58);
  --bone-muted: rgba(242, 242, 242, 0.6);
  --line: rgba(242, 242, 242, 0.24);
}
```

- Global reset `* { margin:0; padding:0; box-sizing:border-box; }`; `body { background-color: var(--bg); color: var(--ink); font-family: var(--sans); }`.
- `h1` (the marquee title): `position:relative; white-space:nowrap; color: var(--bg); font-family: var(--display); font-size: clamp(4.5rem, 14vw, 12rem); font-weight:700; letter-spacing:-0.03em; line-height:1.04; will-change:transform;` — huge, tightly tracked, and **bone-coloured because it runs across the dark carousel**.
- `p`: `color: var(--ink); font-size:1.25rem; font-weight:400; letter-spacing:-0.01em; line-height:1.4;`.
- `a`: `color: var(--ink); text-decoration:none;`; `.logo a { font-family: var(--display); font-size:1.45rem; font-weight:700; letter-spacing:-0.02em; }` — and inside the pinned carousel the nav flips to `var(--bg)`, with hover in `var(--accent)`.
- `img`: `position:relative; width:100%; height:100%; object-fit:cover; will-change:transform;`.
- `nav`: `position:fixed; top:0; left:0; width:100vw; padding:2em 4em; display:flex; justify-content:space-between; z-index:2;`; `.nav-items { display:flex; gap:1em; }`.
- Every `section`: `position:relative; width:100vw; height:100svh; display:flex; justify-content:center; align-items:center; background-color: var(--bg); overflow:hidden;` — except `section.carousel`, which is `background-color: var(--ink)`. The `.intro` and `.outro` also carry a faint `radial-gradient(ellipse 90% 55% at 50% 110%, rgba(255,78,69,.12), transparent 70%)` lift from below.
- `.slide, .slide-img`: `position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden;` — slides stack on top of each other inside `.carousel`.
- `.slide`: additionally `display:flex; align-items:flex-end; padding-bottom:5em;` so the copy block sits near the bottom.
- `.slide-img img`: `position:relative; transform:scale(1.25); will-change:transform;` — **the 1.25 overscale is what gives the ±25% parallax travel headroom; do not omit it.**
- `.slide-copy`: `position:relative; width:100%; overflow:hidden; will-change:transform; z-index:0;`.
- `.slide-tag { padding:0 4em; }`; `.slide-marquee { width:100%; overflow:hidden; }`; `.marquee-container { width:1000%; }` — the marquee track must be far wider than the viewport so the tripled `h1` never wraps.
- `.carousel-progress`: `position:absolute; bottom:0; width:100%; padding:4em; display:flex; justify-content:space-between; gap:1em; z-index:2;`.
- `.progress-bar`: `position:relative; flex:1; width:100%; height:2px; background-color: var(--line);` with a `::after` fill: `content:""; position:absolute; top:0; left:0; width:100%; height:100%; background-color: var(--accent); transform-origin:center left; transform:scaleX(var(--progress, 0)); will-change:transform;` — **the fill is driven purely by the `--progress` CSS variable set from JS.**
- `@media (max-width: 900px)`: hide `.nav-items`; `nav { padding:2em; }`; `.slide-tag { padding:0 2em; }`; `.marquee-container { width:2000%; }`; `.carousel-progress { padding:2em 1em; gap:0.5em; }`.

## GSAP effect (the important part — be exhaustive)

### 1. State + initial slide setup
Track four mutable variables: `activeSlideIndex = 0`, `previousProgress = 0`, `isAnimatingSlide = false`, `triggerDestroyed = false`.

On load, hard-set the initial slide fully visible:
```js
gsap.set(initialSlide, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" });
gsap.set(initialSlide.querySelector(".slide-img img"), { y: "0%" });
```
Then start the marquee on its `h1` (below).

### 2. Infinite marquee — `initMarqueeAnimation(h1)`
Called for every slide's `h1` (the initial one and each dynamically created one):
- **Triple the text content**: `h1.textContent = text + " " + text + " " + text;`
- Then one infinite linear tween:
```js
gsap.to(h1, { x: "-33.33%", duration: 10, ease: "linear", repeat: -1, rotation: 0.01 });
```
Because the text is tripled and it travels exactly one third of its own width per cycle, the loop is seamless. The `rotation: 0.01` is a deliberate sub-pixel-rendering hack — keep it.

### 3. Progress bars — `updateProgressBars(progress)`
Called on every ScrollTrigger update. For each of the 5 `.progress-bar` elements (index 0–4):
```js
const barProgress = Math.min(Math.max(progress * 5 - index, 0), 1);
bar.style.setProperty("--progress", barProgress);
```
So bar *n* fills linearly while global progress runs from `n/5` to `(n+1)/5` — the bars fill one after another, and the CSS `scaleX(var(--progress))` renders it. Fully reversible when scrolling back.

### 4. The pinned ScrollTrigger (the driver)
```js
ScrollTrigger.create({
  trigger: ".carousel",
  start: "top top",
  end: `+=${window.innerHeight * 15}px`,   // 15 viewport-heights of pinned scroll
  pin: true,
  pinSpacing: true,
  scrub: 1,
  onUpdate: (self) => {
    if (triggerDestroyed) return;
    const progress = self.progress;
    updateProgressBars(progress);
    if (isAnimatingSlide) { previousProgress = progress; return; }  // don't queue swaps mid-animation
    const isScrollingForward = progress > previousProgress;
    const targetSlideIndex = Math.min(Math.floor(progress * 5), 4);
    if (targetSlideIndex !== activeSlideIndex) {
      isAnimatingSlide = true;
      try {
        createAndAnimateSlide(targetSlideIndex, isScrollingForward);
        activeSlideIndex = targetSlideIndex;
      } catch (err) { isAnimatingSlide = false; }
    }
    previousProgress = progress;
  },
  onKill: () => { triggerDestroyed = true; },
});
```
Key semantics: the pinned distance is split into 5 equal bands (`floor(progress * 5)`, clamped to 4). Crossing a band boundary fires **one discrete slide transition** — the transition itself is time-based (1s tweens), not scrubbed; only *when* it fires is scroll-driven. `isAnimatingSlide` gates re-entry so a fast scroll can't stack transitions; progress keeps being recorded so direction detection stays correct.

### 5. Slide transition — `createAndAnimateSlide(index, isScrollingForward)`
Build a brand-new `.slide` DOM node from `slides[index]` (image, tag `p`, marquee `h1` with the slide's title), call `initMarqueeAnimation` on its `h1`, then `gsap.killTweensOf` the current slide, its `.slide-img`, and its `.slide-copy` before animating. All tweens below use **`duration: 1, ease: "power4.inOut"`**.

**Forward (scrolling down) — new slide wipes up from the bottom:**
- Initial `gsap.set` on the new slide: `clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)"` (a zero-height line at the bottom edge); its `img` at `y: "25%"`; its `.slide-copy` at `y: "100%"`.
- `carousel.appendChild(newSlide)` (stacks on top of the current one).
- Animate the new slide's clip to full: `clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)"` — the top edge of the clip travels from the bottom to the top of the screen.
- Simultaneously tween `[newSlideCopy, newSlideImg]` to `y: "0%"` — image and copy slide up into place as the wipe reveals them (a counter-parallax entrance).
- Simultaneously collapse the current slide: `clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)"` (a zero-height line at the top edge). In its `onStart`, push the outgoing image to `y: "-25%"` and outgoing copy to `y: "-100%"` (both 1s power4.inOut) — the old slide's content drifts upward as it is swallowed. In `onComplete`, `currentSlide.remove()` and release `isAnimatingSlide = false`; also release the flag in `onInterrupt`.

**Backward (scrolling up) — exact mirror, wiping down from the top:**
- New slide starts as a zero-height line at the **top**: `clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)"`; its `img` at `y: "-25%"`; its `.slide-copy` at `y: "-100%"`.
- Insert it **before** the current slide (`carousel.insertBefore(newSlide, currentSlide)`).
- Animate its clip to full: `clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"`; tween `[newSlideImg, newSlideCopy]` to `y: "0%"`.
- Collapse the current slide toward the **bottom**: `clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)"`, with `onStart` pushing the outgoing image to `y: "25%"` and copy to `y: "100%"`; same `onComplete`/`onInterrupt` cleanup.

Net result: only one (or briefly two, mid-transition) `.slide` nodes ever exist in the DOM; the carousel always converges back to a single slide.

## Assets / images
**5 full-bleed project images, landscape (viewport-filling, ~16:9)**, one per slide, displayed with `object-fit: cover` at `scale(1.25)`. The set is one idea photographed five ways — **smoke on black, graded to greyscale** — so the wipes read as one continuous piece and nothing competes with the bone marquee type:
1. A monochrome smoke curl (slide 1 — initial).
2. An elegant spiralling column.
3. A vertical rising column.
4. A flowing corkscrew.
5. A dramatic horizontal burst.

Use the neutral brand name "sable" in the nav logo — no real company names.

## Behavior notes
- Page flow: intro section (1 viewport) → carousel pinned for `15 × innerHeight` → outro section. Nav stays fixed on top (`z-index: 2`) throughout.
- Transitions are direction-aware and fire once per band crossing; skipping multiple bands in one fast scroll jumps straight to the target index (intermediate slides are skipped, not queued).
- Progress bars are continuously scrubbed (fully reversible); slide swaps are discrete 1s animations.
- Marquee runs on every slide, always, independent of scroll.
- `scrub: 1` + Lenis inertia give the damped feel — don't use `scrub: true`.
- Mobile (≤900px): nav links hidden, tighter paddings, marquee track widened to 2000%; the effect itself runs unchanged. Sections use `100svh`.
- No SplitText, no CustomEase, no Three.js, no reduced-motion branch in the original.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/eseagency-scroll-carousel-javascript/slide-img-1.jpg
https://motionprompts.dev/c/eseagency-scroll-carousel-javascript/slide-img-2.jpg
https://motionprompts.dev/c/eseagency-scroll-carousel-javascript/slide-img-3.jpg
https://motionprompts.dev/c/eseagency-scroll-carousel-javascript/slide-img-4.jpg
https://motionprompts.dev/c/eseagency-scroll-carousel-javascript/slide-img-5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--graphite`, `--accent`, `--muted`, `--bone-muted`, `--line`, plus the type variables `--display`, `--sans`, `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once behind `DOMContentLoaded`, drives Lenis off GSAP's own ticker, and hands scroll progress to a single `ScrollTrigger` whose `onUpdate` builds and tears down `.slide` elements by hand. React withdraws all three guarantees at once, and here the DOM mutation is the trap: this component doesn't just create tweens on existing nodes, it creates and removes entire `.slide` elements with `document.createElement` / `appendChild` / `insertBefore` / `remove()` — none of that is GSAP output, so `gsap.context` has no visibility into it at all.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again, but the DOM itself is not torn down between those two runs — the `.carousel` subtree stays exactly as the first effect left it. If the first run's cleanup fires while a slide swap is mid-flight — the one-second clip-path wipe hasn't reached its `onComplete` yet — two `.slide` elements are still sitting inside `.carousel` when the second effect starts. Its first line, the scoped equivalent of `document.querySelector(".carousel .slide")`, now returns whichever of the two happens to be first in document order; `activeSlideIndex` resets to `0` regardless of which slide is actually on screen, and the progress bars start fresh against a carousel that's still visually frozen mid-wipe. None of this reproduces in a production build, because only development double-invokes effects. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no `readyState` guard. By the time a React component mounts, that event has already fired, so the listener is never called and none of this runs — no initial clip-path, no marquee, no pin, no error either. Delete the listener and move its body — the Lenis/ticker wiring, the `activeSlideIndex` / `previousProgress` / `isAnimatingSlide` / `triggerDestroyed` bindings, the initial slide's `gsap.set` calls, `initMarqueeAnimation` on the first `h1`, and the single `ScrollTrigger.create` — into a `useEffect` with an empty dependency array. Plugin registration (`gsap.registerPlugin(ScrollTrigger)`) stays at module scope, run once at import time, not inside the effect. All four state variables should stay plain `let` bindings local to the effect, not `useState`: none of them ever needs to cause a render, and resetting `activeSlideIndex` to `0` and `previousProgress` to `0` on every effect run is exactly what a fresh mount should do — as long as the DOM they describe actually matches that reset, which the cleanup below has to guarantee.

*(2) Element lookups* — Three places reach into `document` on the assumption this markup is the only copy on the page: the initial `document.querySelector(".carousel .slide")`, the `.carousel` lookup at the top of `createAndAnimateSlide`, and `document.querySelectorAll(".progress-bar")` inside `updateProgressBars`. Give the component's outermost element a root `ref`, and give `.carousel` a second, dedicated ref — it's both the `ScrollTrigger` trigger and the node new slides get appended into or inserted before, so resolving it once up front is cleaner than re-querying it from the root ref on every call. Resolve the initial slide and the progress bars from that same root. `createAndAnimateSlide` also reaches back into its own freshly built `newSlide` node with `.querySelector(".slide-img img")` / `.querySelector(".slide-copy")` — those two are already scoped to a detached node it just created and need no change.

*(3) Cleanup* — three mechanisms need three different teardowns here, and the order between them matters.

*GSAP / ScrollTrigger.* Wrap the setup in a `gsap.context` scoped to the root ref. The `ScrollTrigger.create` call itself is captured automatically, but its `onUpdate` runs later, on every scroll tick — well outside the synchronous window the context tracks — and `onUpdate` is exactly where `createAndAnimateSlide` gets invoked, which is exactly where every `gsap.to` this component ever creates lives. Register `createAndAnimateSlide` on the context with the named-handler form of `add`, and rename the context's own factory parameter away from `self` first: `ScrollTrigger.create`'s callback already uses that name for the trigger instance in this script (`onUpdate: (self) => { const progress = self.progress; … }`), and if the factory parameter keeps the same name, the inner one silently shadows the outer one — any `self.add(...)` written inside `onUpdate` would resolve to the trigger, which has no `add` method, not to the context.

```jsx
const ctx = gsap.context((context) => {
  // the two initial gsap.set calls, initMarqueeAnimation on the first h1

  context.add("swapSlide", (index, isScrollingForward) => {
    // the body of createAndAnimateSlide, unchanged
  });

  ScrollTrigger.create({
    trigger: carouselRef.current,
    start: "top top",
    end: `+=${window.innerHeight * 15}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    onUpdate: (trigger) => {
      // updateProgressBars, the direction/band math, then
      // context.swapSlide(targetSlideIndex, isScrollingForward)
      // in place of calling createAndAnimateSlide directly
    },
  });
}, rootRef);

return () => ctx.revert();
```

With `swapSlide` registered this way, `ctx.revert()` now also kills whichever wipe tween is still running at unmount time, along with the trigger and the two initial `gsap.set`s. What it does **not** do is undo the DOM node `swapSlide` inserted with `appendChild` or `insertBefore` — a context reverts GSAP output, not arbitrary element creation, and building `.slide` elements by hand is exactly what this component does on every scroll-driven swap. If revert lands mid-swap, the surplus `.slide` is still sitting in `.carousel` afterward, which is the scenario described above. Track the node the current effect run has inserted — a `let extraSlide` declared next to `ctx`, assigned at both `carousel.appendChild(newSlide)` and `carousel.insertBefore(newSlide, currentSlide)`, and cleared in every `onComplete` once the old slide is removed — and in the cleanup, if it's still attached, remove it explicitly before reverting the context. That's what keeps the next effect run's slide lookup down to exactly one node, matching the `activeSlideIndex = 0` it's about to reset to.

*Lenis and the ticker.* `gsap.ticker.add((time) => lenis.raf(time * 1000))` is this component's entire render loop, and a `gsap.context` has no visibility into ticker subscriptions — they are neither a tween nor a trigger. Keep the function reference and remove that same reference with `gsap.ticker.remove` in the cleanup, before calling `lenis.destroy()`, not after, so a tick already scheduled by GSAP's engine doesn't call `.raf()` on an instance that's already gone. Subscribe `lenis.on("scroll", ScrollTrigger.update)` through a named reference the same way, so it can be removed with `lenis.off` by identity rather than left dangling on an instance about to be discarded. `gsap.ticker.lagSmoothing(0)` is global ticker state; calling it again on the next mount is harmless.

The `triggerDestroyed` flag and its `onKill` callback become redundant once `ctx.revert()` is doing the killing: `ScrollTrigger.kill()` still fires `onKill` synchronously, so the flag flips correctly, but nothing reads it afterward, because the trigger is already gone and can't call `onUpdate` again. Leaving it as written costs nothing; it just stops doing real work under this ordering.
