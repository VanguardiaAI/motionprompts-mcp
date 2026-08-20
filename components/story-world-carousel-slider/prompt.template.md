---
slug: story-world-carousel-slider
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 7
structural_literals: 7
structural:
  - { kind: duration, literal: "1.5", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Story World Carousel Slider — Click-Advanced Clip-Path Reveal + Animated Hour Timeline

## Goal
Build a **fullscreen, click-advanced photo carousel** on a black page. Every click on the page swaps to the next image with a single cinematic move: the current image **slides left and off** while the next image is **wiped into view by expanding its `clip-path` from a zero-width sliver pinned to the right edge out to the full frame**, its own picture **easing in from the right** at the same time. Layered on top, a horizontal row of **hour labels (1pm → 8pm)** animates its `flex-grow` values so the "active" hour balloons wide while the rest compress — and the whole label strip **recycles itself so both the images and the clock loop forever**. Every tween shares one bespoke `CustomEase` called `"hop"` that gives the motion a soft, slightly overshooting settle. The whole stage sits under a 50% black scrim for an editorial, dusk-lit mood.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`CustomEase`** (imported from `gsap/CustomEase` and registered). No ScrollTrigger, no SplitText, no smooth-scroll library — the component is **click-driven**, not scroll-driven. No images data module; the five `<img>` are written directly in the HTML.

```js
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
```

## Layout / HTML
A near-empty document — five stacked full-screen slides, a fixed nav and footer, and the hour timeline.

```
nav                         (fixed strip, top)
  a  "Motionprompts"
  a  "( Elite web designs )"

footer                      (fixed strip, bottom)
  p  "Click anywhere to advance the story"
  p  "Motionprompts"

.slider                     (absolute, full-viewport stage)
  .slide #slide1 > img      (initial visible slide)
  .slide #slide2 > img
  .slide #slide3 > img
  .slide #slide4 > img
  .slide #slide5 > img

.timeline                   (absolute, vertically centered, flex row)
  p  1<sup>pm</sup>
  p  2<sup>pm</sup>
  p  3<sup>pm</sup>
  p  4<sup>pm</sup>
  p  5<sup>pm</sup>
  p  6<sup>pm</sup>
  p  7<sup>pm</sup>
  p  8<sup>pm</sup>
```

There are **8** `<p>` hour labels in the HTML (1pm through 8pm), each an integer plus a `<sup>pm</sup>`.

## Styling
- Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100vw; height:100vh; background:#000; overflow:hidden; }` — the page never scrolls.
- Fonts: labels/nav/footer use **"Akkurat Mono"** (any mono fallback, e.g. `"Akkurat Mono", monospace`); the big hour numbers use **"PP Neue Montreal"** weight 500 (fallback a neutral grotesque, e.g. `"PP Neue Montreal", "Neue Montreal", Helvetica, Arial, sans-serif`).
- `a, p`: `text-decoration:none; color:rgba(255,255,255,0.75); font-family:"Akkurat Mono"; font-size:11px; text-transform:uppercase;`.
- `nav, footer`: `position:fixed; width:100%; padding:2em; display:flex; justify-content:space-between; z-index:2;`. `nav{top:0}`, `footer{bottom:0}`.
- `.slider`: `position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden;`.
- **Scrim** — `.slider::after`: a full-cover `content:""` overlay, `position:absolute; inset:0; background:rgba(0,0,0,0.5);` sitting above the images (darkens every slide equally).
- `.slide`: `position:absolute; top:0; left:0; width:100%; height:100%; display:flex; justify-content:flex-end; align-items:center; overflow:hidden; will-change:transform;`. All five slides are stacked in the same spot; later ones paint on top of earlier ones (DOM order = z-order).
- `img`: `position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; will-change:transform;`. Full-bleed cover, so any landscape source fills the screen; the JS translates these on the x-axis.
- `.timeline`: `position:absolute; right:0; top:50%; transform:translateY(-50%); width:105%; z-index:2; display:flex;` — **wider than the viewport and anchored to the right**, so as labels collapse the leftmost ones spill off the left edge of the screen. On `@media (max-width:900px)` bump `width` to `110%`.
- `.timeline p`: `font-family:"PP Neue Montreal"; font-weight:500; font-size:28px; color:#fff; cursor:pointer;`.
- `.timeline p sup`: `position:relative; top:-4px; font-family:"Akkurat Mono"; font-size:11px; text-transform:uppercase;`.

## GSAP effect (exhaustive — this is the whole component)

### CustomEase
Register one ease named **`"hop"`** with exactly this path (a curve that rises steeply, then eases and slightly settles into 1):
```js
CustomEase.create("hop", "M0,0 C0.083,0.294 0.117,0.767 0.413,0.908 0.606,1 0.752,1 1,1");
```
**Every** tween in the component (images, clip-path, and all the flex-grow label tweens) uses `ease: "{{motion.ease.primary}}"` and `duration: 1.5`.

### Constants & guards
- `const duration = 1.5;`
- `let animating = false;` — a re-entrancy lock. `handleSlider` returns immediately if `animating`, and only clears it in the clip-path tween's `onComplete`. This means clicks that arrive mid-transition are **ignored** (no queueing).
- Everything runs inside `window.addEventListener("load", …)`.

### Initial state (run once on load)
1. **Slides** — leave slide 1 alone; for every slide at index > 0, `gsap.set(slide, { clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)" })`. That polygon is a **degenerate zero-width sliver collapsed onto the right edge** (all four vertices at x = 100%), so slides 2–5 are effectively invisible until revealed. Slide 1 stays fully visible.
2. **Timeline flex seed** (`initializeFlexValues()`) — set inline `flexGrow` / `width` on the eight `<p>`:
   - `p[0] → flexGrow:5`, `p[1] → 4`, `p[2] → 3`, `p[3] → 1.5`, `p[4] → 1` (each also `width:"max-content"`).
   - `p[5], p[6], p[7] → flexGrow:0, width:"0px"` (fully collapsed).
   This yields the resting look: **1pm** widest, tapering down to **5pm**, with 6/7/8pm hidden at zero width off to the right.

### Click handler — `document.addEventListener("click", handleSlider)`
On each accepted click (`!animating`), two independent things animate in parallel over the same 1.5s: the **image swap** and the **timeline shift**.

#### A) Image swap
Re-query `slides = slider.querySelectorAll(".slide")`. `firstSlide = slides[0]`, `secondSlide = slides[1]`, and their `img`s. If there is only one slide, just release the lock. Otherwise fire three tweens together (no timeline object — three concurrent `gsap.to` calls):

1. **Incoming image glides in from the right.** `gsap.set(secondSlideImg, { x: 250 })` first, then
   `gsap.to(secondSlideImg, { x: 0, duration: 1.5, ease: "{{motion.ease.primary}}" })`.
2. **Outgoing image slides off left.** `gsap.to(firstSlideImg, { x: -500, duration: 1.5, ease: "{{motion.ease.primary}}" })`.
3. **Clip-path wipe reveals the incoming slide.**
   `gsap.to(secondSlide, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.5, ease: "{{motion.ease.primary}}", onComplete: … })`.
   The clip animates from the right-edge sliver to the **full rectangle** — its left edge sweeps from x = 100% to x = 0%, uncovering the picture **right-to-left**. Because `secondSlide` is later in the DOM it paints above `firstSlide`, so you see the new image being unveiled over the old one that's sliding away underneath.
   **`onComplete`** (this is the recycle that makes the carousel endless): remove `firstSlide` from the DOM and **re-append it to the end** of `.slider` (`slider.appendChild(firstSlide)`), then `gsap.set(firstSlide, { clipPath: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)" })` to collapse it back to the hidden sliver, and finally `animating = false`. Next click, the old second slide is the new first, and the just-used slide waits at the back — an infinite ring of the same five images. (Note: the img's `x` is not reset, so the recycled slide keeps whatever x it ended on; it only becomes visible again after five more clicks, freshly clip-collapsed.)

#### B) Timeline shift (the animated clock)
Runs every click, in parallel with the image swap, all tweens `duration:1.5, ease:"{{motion.ease.primary}}"`.

Query `counters = timeline.querySelectorAll("p")`. Capture `lastFlexGrow = counters[last].style.flexGrow` **before** touching anything.

**Recycle check:** if a label currently carrying the class `.last` has text `"7pm"`, call `appendNewcounters()` (below) to graft a fresh 1→8 pm block on the end and drop the exhausted labels off the front. Then strip `.first` and `.last` classes from all counters.

**The shift** — walk `i` from the **last index down to 1** and, for each, tween its `flexGrow` to the value of its **left neighbour**:
```js
gsap.to(counters[i], {
  flexGrow: counters[i-1].style.flexGrow,
  duration: 1.5, ease: "{{motion.ease.primary}}",
  onStart: () => {
    gsap.set(counters[i], { width: counters[i-1].style.flexGrow > 0 ? "max-content" : "0px" });
    if (counters[i-1].style.flexGrow === "5")      { counters[i].classList.add("first"); firstAssigned = true; }
    else if (counters[i-1].style.flexGrow === "1" && !firstAssigned) counters[i].classList.add("last");
  },
});
```
Then wrap the **first** counter around to the captured tail value:
```js
gsap.to(counters[0], {
  flexGrow: lastFlexGrow, duration: 1.5, ease: "{{motion.ease.primary}}",
  onStart: () => {
    gsap.set(counters[0], { width: lastFlexGrow > 0 ? "max-content" : "0px" });
    if (lastFlexGrow === "5") counters[0].classList.add("first");
    else if (lastFlexGrow === "1" && !firstAssigned) counters[0].classList.add("last");
  },
});
```
Net effect: the whole flex-grow pattern **[5,4,3,1.5,1,0,0,0] rotates one step to the right** on every click (index 0 receives what fell off the end). Visually the widest "active hour" marches rightward one slot per click, each hour expanding to `max-content` as it grows and snapping to `0px` width as it collapses — a live, elastic clock that reads like a horizontal timeline sliding under a fixed viewport. The `.first` marker tracks the widest (flex 5) label, the `.last` marker the flex-1 label; these class flags drive the recycling.

**`appendNewcounters()`** — keeps the row from running out of labels: find the index of the `.first` counter, remove every counter before it, then append **eight new `<p>` labels numbered 1–8** each with a `<sup>pm</sup>`, `flexGrow:0`, `width:"0px"`. So the strip perpetually sheds spent hours off the left and grows new ones off the right, looping forever in sync with the image ring.

## Assets / images
**5 full-bleed landscape photographs** (screen-aspect ~16:9, but `object-fit:cover` fills any landscape/portrait source). They read as one cohesive **cinematic, editorial, moody** art-direction series (all sit under a 50% black scrim). By role and order:
1. **Slide 1 (initial visible):** black-and-white close-up of a woman's lower face wrapped in translucent tulle/veil fabric.
2. **Slide 2:** moody product still-life — two dark-red wine bottles on draped blue fabric with hard directional shadows.
3. **Slide 3:** a lone backpacker walking a shoreline under an intense orange-and-red duotone sky.
4. **Slide 4:** editorial fashion portrait — a woman with an afro and a dark silk neck scarf on a blue gradient backdrop.
5. **Slide 5:** long-exposure interior of a grand museum's spiral staircase above a busy lobby.

No logos or brand marks in the imagery.

## Behavior notes
- **Trigger is a click anywhere on the document** (`document.addEventListener("click", …)`), including on the hour labels (which are `cursor:pointer`). There is no autoplay, no scroll, no hover.
- **Re-entrancy lock:** clicks during a 1.5s transition are dropped, not queued.
- **Truly infinite** in both the image ring (slides recycled to the DOM tail) and the clock (labels recycled via `appendNewcounters()`), so it never reaches an end state.
- Desktop and mobile both work (single media query only widens the timeline to 110% at ≤900px); no reduced-motion handling in the original.
- Text is neutral/fictional: nav "Motionprompts" / "( Elite web designs )", footer "Click anywhere to advance the story" / "Motionprompts", labels 1pm–8pm.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/story-world-carousel-slider/img-1.jpg
https://motionprompts.dev/c/story-world-carousel-slider/img-2.jpg
https://motionprompts.dev/c/story-world-carousel-slider/img-3.jpg
https://motionprompts.dev/c/story-world-carousel-slider/img-4.jpg
https://motionprompts.dev/c/story-world-carousel-slider/img-5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--fg`, `--muted`, `--faint`, `--gold`, `--mono`, `--sans`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that waits for the window to finish loading, reaches into the page with `document.querySelector`, and attaches a single document-wide click listener it never removes. React withdraws all three of those guarantees at once, and it does it quietly — the carousel renders, the first click even plays correctly, and then it misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that means two `document` click listeners stacked on the page at once, each closing over its own `animating` flag and its own `slides`/`counters` lookups: the first click after mount fires both handlers, so the outgoing image gets pushed off-screen twice, the incoming slide's clip-path wipe races itself, and the recycle step that moves `firstSlide` to the end of `.slider` runs twice — the second run tries to `appendChild` a node the first run already relocated, and the five-slide ring comes out of order after a single click instead of after five. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for the window `load` event before doing anything. Nothing that follows actually needs it: the clip-path polygons are percentages of the slide's own box, the flex-grow values are static numbers written straight onto inline styles, and `object-fit: cover` sizes every `<img>` from CSS alone — no code here reads an image's natural width/height or a computed layout box. Unlike a component that genuinely has to wait for images to settle before it can measure them, this one has nothing to protect by keeping an explicit, cancellable wait. Drop the `load` listener and move its body directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `.slider`, its five `.slide` children, `.timeline`, and the eight `<p>` hour counters are all found with selectors that assume the component owns the document. Give the component a root `ref`, render it on the element that wraps `.slider`, `.timeline`, `nav` and `footer`, and resolve every lookup off that root — including the ones re-run inside the click handler on every click, since `slides = slider.querySelectorAll(".slide")` has to see the reordering the previous click produced. The click *listener* itself is a different case: the design is "click anywhere on the page," so it belongs on `document`, not on the root — keep it there, but recognize the cost if this stops being a full-page demo: a `document`-wide listener mounted next to any other interactive UI advances the carousel on clicks meant for that other UI. If this becomes one section of a larger app, decide explicitly whether "anywhere" should still mean the whole document, and scope the listener to the root if it should not.

*(3) Cleanup* — Wrap the two setup passes — the clip-path collapse on slides 2–5 and `initializeFlexValues()`'s flex seed — in a `gsap.context` scoped to the root ref. The part that needs care is the click handler: `handleSlider` is not called once inside the factory, it is invoked later, on every `document` click, from outside the synchronous pass `gsap.context` tracks. A `gsap.to` created that way is invisible to the context, so register the handler itself as a named method and call it through the context rather than as a bare closure:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    // gsap.set(...) collapsing slides 2-5 to the right-edge sliver
    // initializeFlexValues(), unchanged
    self.add("advance", () => {
      // the body of handleSlider from the script above: re-query slides,
      // the three tweens for the image swap, and the counters loop — unchanged
    });
  }, rootRef);

  let animating = false;
  const onClick = () => {
    if (animating) return;
    animating = true;
    ctx.advance();
  };
  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("click", onClick);
    ctx.revert();
  };
}, []);
```

The `animating` flag stays a plain closure variable — it only needs to survive between calls made through the same effect instance, which a captured `let` already does — but it has to live in the effect body next to the listener, not inside `handleSlider`, since the flag and the listener that reads it are created and torn down together.

Be precise about what `ctx.revert()` actually undoes here: the clip-path collapse from setup, and every tween created through `ctx.advance()` — the image `x` moves, the clip-path wipe, the counters' `flexGrow`/`width` — because all of those are `gsap.set`/`gsap.to` calls. It does **not** touch the raw inline styles `initializeFlexValues()` writes directly (`counters[i].style.flexGrow = 5`, `.style.width = "max-content"`), and it does not touch the plain DOM surgery in `appendNewcounters()` and the slide recycle (`firstSlide.remove()`, `slider.appendChild(firstSlide)`, `document.createElement("p")`) — none of that goes through GSAP, so GSAP has no record of it to undo. That gap is harmless on a real unmount, since React discards the whole subtree those nodes live in regardless of their shape at that instant. It matters only if the component unmounts mid-transition, with `ctx.advance()` still running: `ctx.revert()` stops the in-flight tweens cleanly, but the `.first`/`.last` class flags and any counters `appendNewcounters()` just spliced in are plain DOM writes the revert leaves exactly as it found them — do not assume the counters or slide order snap back to their pre-click state.

Registering `CustomEase.create("hop", …)` belongs next to `gsap.registerPlugin(CustomEase)`, at module scope rather than inside the effect, for the same reason the plugin registration does: it only needs to run once per page load, and repeating it on every mount is harmless but pointless.
