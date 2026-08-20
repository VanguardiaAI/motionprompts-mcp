---
slug: meetings-slider
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 12
structural_literals: 11
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: duration, literal: "1.25", rule: value/narrated }
  - { kind: ease, literal: "\"power2.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Arc Card Slider with Clip-path Reveal & Counter-rotating Images

## Goal
Build a **click-driven fullscreen slider** that shows **three cards laid out on a horizontal arc** — a `prev` card on the left, the `active` card upright in the center, and a `next` card on the right. Clicking a side card (or a name in the bottom-left list) fires a **single 2-second GSAP transition on a CustomEase called "hop"** where: the clicked side card **orbits into the center**, un-rotating to 0° while its **clip-path opens from a small centered window to a full rectangle**; the old center card **orbits out to the opposite side**, rotating ±90° while its clip-path **closes back into the centered window**; the far outgoing card **scales to zero and fades**; and a brand-new card is spawned on the vacated side, **scaling up from zero**. Throughout, each card's frame rotates while its **inner image counter-rotates** to stay upright. In parallel, the big center **title swaps letter-by-letter** (per-character `<span>` y-staggers), a **blurred background preview image cross-fades**, and a slow CSS `pan` keyframe zooms that preview forever. The star effect is the synchronized clip-path-open / clip-path-close / counter-rotation choreography on the shared "hop" ease.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`CustomEase`**:
```js
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "M0,0 C0.488,0.02 0.467,0.286 0.5,0.5 0.532,0.712 0.58,1 1,1");
```
No Lenis, no ScrollTrigger, no Three.js. The page does not scroll — the whole thing is a fixed fullscreen stage. Wrap all setup in a `DOMContentLoaded` listener.

## Layout / HTML
Body order:

1. `<nav>` — absolute overlay bar at top: `<a id="logo">Motionprompts</a>` on the left and `<a>Watch Showreel</a>` on the right.
2. `.slider` — the fullscreen stage (`100vw × 100vh`, `overflow: hidden`). It contains, in order:
   - `.slide-container.prev` > `.slide-img` > `<img>` — the left card (initial image = slide **7**).
   - `.slide-container.active` > `.slide-img` > `<img>` — the center card (initial image = slide **1**).
   - `.slide-container.next` > `.slide-img` > `<img>` — the right card (initial image = slide **2**).
   - `.slider-title` > `<h1>Serene Space</h1>` — the big centered title.
   - `.slider-counter` > `<p><span>1</span><span>/</span><span>7</span></p>` — bottom-center "current / total" counter. The **first** span is the animated current index.
   - `.slider-items` — bottom-left vertical list of seven `<p>` names; the first has class `activeItem`.
   - `.slider-preview` > `<img>` — the blurred oversized background preview (initial image = slide **1**).
3. `<footer>` — absolute bottom-right, two `<p>`s: "Experiment 0394, 24" and "By Motionprompts".
4. `<script type="module" src="./script.js">`.

Every card is `.slide-container` > `.slide-img` > `<img>`. The JS creates fresh `.slide-container` and `<h1>` and preview `<img>` nodes during each transition and removes the old ones, so the DOM always ends with exactly three cards, one `<h1>`, and one preview image.

Store the seven slides in a JS array (index 0 = slide 1), each `{ name, img }`:
1. `"Serene Space"` — image 1
2. `"Gentle Horizon"` — image 2
3. `"Quiet Flow"` — image 3
4. `"Ethereal Light"` — image 4
5. `"Calm Drift"` — image 5
6. `"Subtle Balance"` — image 6
7. `"Soft Whisper"` — image 7

`totalSlides = 7`. The seven `.slider-items` `<p>` labels are exactly the seven names in order.

## Styling
- Global reset `* { margin:0; padding:0; box-sizing:border-box }`. `html, body { width:100%; height:100%; background:#0f0f0f; color:#fff; }`.
- Fonts: body uses a **Neue-Montreal-style grotesque sans** (`"PP Neue Montreal", sans-serif`); the `#logo` uses a **tall condensed display serif** (`"Timmons NY 2.005"`) at `40px`, color `#d2d2d2`. Use those families with sane fallbacks; exact fonts are not critical.
- `p, a`: `text-decoration:none; font-size:13px; font-weight:500; color:#5e5e5e; text-transform:uppercase;`.
- `img`: `width:100%; height:100%; object-fit:cover;`.
- `nav`: `position:absolute; width:100%; padding:2em; display:flex; justify-content:space-between; align-items:center; z-index:100;`.
- `.slider`: `position:relative; width:100vw; height:100vh; overflow:hidden;`.
- **`.slide-container`**: `position:absolute; width:30%; height:70%; top:50%; left:50%; transform:translate(-50%,-50%); background:#000; cursor:pointer; z-index:2; will-change:transform, opacity, clip-path;`. (A tall portrait card; the JS repositions/rotates it.)
- **`.slide-img`**: `position:absolute; width:100%; height:100%; will-change:transform;`.
- **`.slide-img img`**: `transform:scale(1.5); opacity:0.75; will-change:transform;` — the image is zoomed in and dimmed inside each card.
- **`.slider-title`**: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:50%; height:60px; text-align:center; z-index:10; clip-path:polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);` — the full-rectangle clip-path plus the fixed `60px` height makes this box a **text mask** for the vertically-offset letters.
- **`.slider-title h1`**: `position:absolute; width:100%; height:50px; text-align:center; color:#fff; font-size:50px; font-weight:500;`.
- **`.slider-title h1 span`**: `position:relative; display:inline-block; transform:translateY(50px); will-change:transform;` (the `50px` is just a pre-JS fallback; GSAP overrides it).
- `.slider-counter`: `position:absolute; left:50%; transform:translateX(-50%); bottom:2.5em; text-align:center; z-index:2;`. Its `<p>` is a flex row, `gap:1em`, `color:#fff`.
- `.slider-items`: `position:absolute; left:2.5em; bottom:2.5em; z-index:2;`. Each `<p>` has `transition:0.5s color;`; the `.activeItem` is `color:#fff` (others stay `#5e5e5e`).
- **`.slider-preview`**: `position:absolute; top:25%; left:50%; transform:translateX(-50%); width:75%; height:100%; margin:0 auto; z-index:0; opacity:0.5; overflow:hidden;` — an oversized, dimmed backdrop sitting behind everything.
- **`.slider-preview img`**: `position:absolute; top:0; animation:pan 20s infinite linear;` with `@keyframes pan { 0%{transform:scale(1)} 50%{transform:scale(1.25)} 100%{transform:scale(1)} }` — a continuous slow zoom-in/out.
- `footer`: `position:absolute; right:2em; bottom:2em; z-index:10; text-align:right;`.
- Media query `max-width:900px`: `.slide-container { top:75%; width:70%; height:50%; }` and `.slider-preview { top:0; left:0; transform:translateX(0%); width:100%; height:100%; }`.

## GSAP effect (the important part — be exact)

### Constants
```js
const clipPath = {
  closed: "polygon(25% 30%, 75% 30%, 75% 70%, 25% 70%)", // small centered window
  open:   "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", // full rectangle
};
const slidePositions = {
  prev:   { left: "15%", rotation: -90 },
  active: { left: "50%", rotation: 0 },
  next:   { left: "85%", rotation: 90 },
};
let activeSlideIndex = 1;   // 1-based
let isAnimating = false;
```

Index wrap helper (1-based): `getSlideIndex(inc) => ((activeSlideIndex + inc - 1 + totalSlides) % totalSlides) + 1`.

Manual character splitter `splitTextIntoSpans(el)`: set `el.innerHTML` to `el.innerText` split into single characters, each wrapped in a `<span>`, with a space replaced by `&nbsp;&nbsp;` (two non-breaking spaces).

### 1) Initial setup (on load)
For each entry of `slidePositions` (`prev`, `active`, `next`):
```js
gsap.set(`.slide-container.${key}`, {
  ...value,                 // left + rotation
  xPercent: -50, yPercent: -50,
  clipPath: key === "active" ? clipPath.open : clipPath.closed,
});
if (key !== "active") {
  gsap.set(`.slide-container.${key} .slide-img`, { rotation: -value.rotation });
}
```
So the **center card** is upright (`rotation:0`) and fully open; each **side card's frame is rotated ±90°** (prev −90°, next +90°) and clipped to the tiny centered window, while its **inner `.slide-img` is counter-rotated ∓90°** (prev's image +90°, next's image −90°) so the photo content stays upright even though the card frame lies on its side.

Then the intro title: `splitTextIntoSpans(initial h1)` and
```js
gsap.fromTo(initialTitle.querySelectorAll("span"),
  { y: 60 },
  { y: 0, duration: 1, stagger: {{motion.stagger.tight}}, ease: "{{motion.ease.primary}}" });
```
Finally `updateCounterAndHighlight(1)` (counter shows `1`, first list item gets `.activeItem`).

### 2) The transition — `transitionSlides(direction)`
Guard: `if (isAnimating) return; isAnimating = true;`.

Resolve which side is leaving vs. entering:
```js
const [outgoingPos, incomingPos] =
  direction === "next" ? ["prev", "next"] : ["next", "prev"];
const outgoingSlide = slider.querySelector(`.${outgoingPos}`);
const activeSlide   = slider.querySelector(".active");
const incomingSlide = slider.querySelector(`.${incomingPos}`);
```

Helper used for both moving cards — animates the frame **and** counter-rotates the inner image, both `duration:2, ease:"{{motion.ease.primary}}"`:
```js
function animateSlide(slide, props) {
  gsap.to(slide, { ...props, duration: 2, ease: "{{motion.ease.primary}}" });
  gsap.to(slide.querySelector(".slide-img"),
    { rotation: -props.rotation, duration: 2, ease: "{{motion.ease.primary}}" });
}
```

Fire these tweens (all at once — no timeline, they simply share `duration:2` + `ease:"{{motion.ease.primary}}"` so they stay in sync):

1. **Incoming side card → center**: `animateSlide(incomingSlide, { ...slidePositions.active, clipPath: clipPath.open })` → moves to `left:50%`, `rotation:0`, clip-path **opens** to full rectangle; its inner image un-rotates to 0.
2. **Old center card → outgoing side**: `animateSlide(activeSlide, { ...slidePositions[outgoingPos], clipPath: clipPath.closed })` → moves to the outgoing side's `left`/`rotation` (for `next`: `left:15%`, `rotation:-90`), clip-path **closes** to the centered window; its inner image counter-rotates to `+90` (i.e. `-rotation`).
3. **Far outgoing card leaves**: `gsap.to(outgoingSlide, { scale: 0, opacity: 0, duration: 2, ease: "{{motion.ease.primary}}" })`.
4. **Spawn a fresh card on the vacated side**:
   ```js
   const newSlideIndex = getSlideIndex(direction === "next" ? 2 : -2);
   const newSlide = createSlide(slides[newSlideIndex - 1], incomingPos); // .slide-container.<incomingPos> with .slide-img>img
   slider.appendChild(newSlide);
   gsap.set(newSlide, {
     ...slidePositions[incomingPos], xPercent: -50, yPercent: -50,
     scale: 0, opacity: 0, clipPath: clipPath.closed,
   });
   gsap.to(newSlide, { scale: 1, opacity: 1, duration: 2, ease: "{{motion.ease.primary}}" });
   ```
   Note faithfully: the new card's **frame** gets the side `rotation` (e.g. `+90` for `next`) but its inner `.slide-img` is **left un-rotated at 0** (no counter-rotation is applied on creation) — it just scales up from 0 inside the tiny clip window.
5. **Title swap** — `createAndAnimateTitle(slides[getSlideIndex(direction === "next" ? 1 : -1) - 1], direction)`:
   - Create a new `<h1>`, set its text to the incoming name, append to `.slider-title`, and `splitTextIntoSpans` it.
   - `yOffset = direction === "next" ? 60 : -60`. `gsap.set(newSpans, { y: yOffset })`, then `gsap.to(newSpans, { y: 0, duration: 1.25, stagger: {{motion.stagger.tight}}, ease: "{{motion.ease.primary}}", delay: 0.25 })`.
   - The **old** `<h1>` (`h1:not(:last-child)`) exits: `gsap.to(oldSpans, { y: -yOffset, duration: 1.25, stagger: {{motion.stagger.tight}}, ease: "{{motion.ease.primary}}", delay: 0.25, onComplete: () => oldH1.remove() })`.
   - So on `next` the new title rises from **below** (+60→0) and the old title exits **up** (→−60); on `prev` it's mirrored (new drops from above −60→0, old exits **down** →+60). The `.slider-title` 60px mask clips the offset letters.
6. **Preview cross-fade** — `updatePreviewImage(sameIncomingSlideContent)`: create a new `<img>`, append to `.slider-preview`, then
   ```js
   gsap.fromTo(newImage, { opacity: 0 },
     { opacity: 1, duration: 1, ease: "power2.inOut", delay: 0.5,
       onComplete: () => sliderPreview.querySelector("img:not(:last-child)")?.remove() });
   ```
   (The freshly appended image inherits the CSS `pan` keyframe automatically.)
7. **Counter + list highlight** — `setTimeout(() => updateCounterAndHighlight(nextActiveIndex), 1000)` where `updateCounterAndHighlight(i)` sets the first counter span's text to `i` and toggles `.activeItem` on the `i-1`-th list `<p>`.
8. **Commit the new state** — `setTimeout(..., 2000)` (matching the 2s tweens):
   ```js
   outgoingSlide.remove();
   activeSlide.className   = `slide-container ${outgoingPos}`; // old center becomes a side card
   incomingSlide.className = "slide-container active";         // incoming becomes center
   newSlide.className      = `slide-container ${incomingPos}`; // spawned card becomes the new side
   activeSlideIndex = nextActiveIndex;
   isAnimating = false;
   ```

### Timing recap
- All card motion (position/rotation/clip-path/scale/opacity) = **2s, ease "hop"**, fired simultaneously.
- Title letter tweens = **1.25s, stagger 0.02, delay 0.25, ease "hop"** (intro is 1s, no delay).
- Preview cross-fade = **1s, power2.inOut, delay 0.5**.
- Counter/highlight updates at **1000ms**; class reassignment + unlock at **2000ms**.

### Input handling
- Click listener on `.slider`: `const card = e.target.closest(".slide-container"); if (card && !isAnimating) transitionSlides(card.classList.contains("next") ? "next" : "prev");` — clicking the **right/next** card goes forward, clicking the left/active card goes back.
- Click listener on each `.slider-items p` (index `i`): if `i+1 !== activeSlideIndex && !isAnimating`, call `transitionSlides(i+1 > activeSlideIndex ? "next" : "prev")` — it always steps exactly one slide in the chosen direction (it does not jump straight to the clicked item).

## Assets / images
**7 images**, one per slide, in a cohesive dark, abstract, editorial-3D register (each is `object-fit: cover`, zoomed to 1.5× and dimmed to 0.75 opacity inside the cards, and one is reused as the blurred backdrop). Any aspect works; portrait or square crops best fill the tall cards. Suggested roles:
1. **Serene Space** — abstract 3D render of smooth undulating matte blob/cloud forms fading from black to soft light grey. (Also the initial center card **and** the initial background preview.)
2. **Gentle Horizon** — crumpled satin fabric in glossy black with warm gold and bronze highlights catching the light. (Initial `next` card.)
3. **Quiet Flow** — monochrome 3D human head sculpture built entirely from tangled grass-like fibers on a black background.
4. **Ethereal Light** — dense pile of matte black and dark-grey rounded capsule shapes over a blue-grey backdrop.
5. **Calm Drift** — smooth pale sphere resting on a field of soft dark-grey fur against black.
6. **Subtle Balance** — intertwined ribbed black segmented tubes with speckled highlights on pure black.
7. **Soft Whisper** — dark speckled sphere balanced on jagged black rock formations under a moody teal-grey gradient sky. (Initial `prev` card.)

No brands or logos; any seven images in this minimal, cinematic register work.

## Behavior notes
- Everything is **click-driven** — no scroll, no wheel/touch hijack, no autoplay. The stage is a fixed 100vh viewport.
- Transitions are **locked** while one runs (`isAnimating` guard released at the 2000ms mark); clicks during a transition are ignored.
- The slider is **infinite** in both directions via the modulo `getSlideIndex` wrap (past slide 7 → 1, before 1 → 7).
- The blurred background preview always shows the **incoming** slide's image and animates the CSS `pan` zoom continuously (20s linear loop) regardless of transitions.
- Responsive: below 900px the cards drop lower and grow (`top:75%; width:70%; height:50%`) and the preview fills the whole viewport.
- No reduced-motion branch in the original.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/meetings-slider/img1.jpg
https://motionprompts.dev/c/meetings-slider/img2.jpg
https://motionprompts.dev/c/meetings-slider/img3.jpg
https://motionprompts.dev/c/meetings-slider/img4.jpg
https://motionprompts.dev/c/meetings-slider/img5.jpg
https://motionprompts.dev/c/meetings-slider/img6.jpg
… 1 more under https://motionprompts.dev/c/meetings-slider/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--bg`, `--muted`, `--muted-strong`, `--accent`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component is more exposed to that than most, because `transitionSlides` does not just tween the three `.slide-container` cards already on the page: every click builds a fourth one with `createSlide`/`appendChild`, appends a second `<h1>` into `.slider-title`, and appends a second `<img>` into `.slider-preview`, then deletes the old ones from `setTimeout` callbacks fired one and two seconds later. If the first StrictMode pass's `destroy()` has not fully finished before the second pass's `mount` runs, one click now drives two independent `transitionSlides` calls sharing the same `.slider` — two spawned cards, two extra `<h1>`s racing through the same title mask, two `later()` timers writing conflicting `className`s onto the same nodes at the one- and two-second marks — and the second mount's `sliderHTML` snapshot ends up capturing a subtree the first mount is still in the middle of mutating. None of this reproduces in a production build, because React only double-invokes effects in development. Treat `destroy()` as the effect's cleanup, not as editor-only plumbing a consuming app can skip.

*(1) The entry point* — Ignore the `window.MP.register` branch; it exists only so this catalogue's own knob editor can remount the slider with a different `config`, and a consuming app has no equivalent for it. The branch that matters is the other one, and it is the guarded form the classification names: it checks `document.readyState` before subscribing to `DOMContentLoaded`. `useEffect` already runs after the DOM is committed, so both the guard and the listener are dead weight — drop them and put the body of `mount` directly inside a `useEffect` with an empty dependency array, called with `Object.assign({}, DEFAULTS)` (or props) standing in for whatever `window.MP` would have supplied. Leave `gsap.registerPlugin(CustomEase)` and the `CustomEase.create("hop", …)` call exactly where they already sit, at module scope, outside the effect — the source comment is right that `CustomEase.create` is idempotent by name, so re-registering it on a StrictMode remount is harmless, but there is nothing to gain by moving it, and module scope keeps it out of the effect's own cleanup obligations entirely.

*(2) Element lookups* — `mount` resolves its attachment point with one unscoped `document.querySelector(".slider")` and never leaves that subtree again: `sliderTitle`, `sliderCounter`, `sliderItems`, `sliderPreview` and `initialTitle` are all found with `slider.querySelector(...)`, already scoped to it. Give the component a root `ref` on the element playing `.slider`'s role — `.slider` is a sibling of `<nav>` and `<footer>` in the layout above, not their parent, so the ref belongs on `.slider` itself, not on some wrapper around all three — and read it as `rootRef.current` in place of that one `document.querySelector` call. During the StrictMode remount two `.slider` elements exist for an instant; an unscoped lookup landing on the outgoing one takes its `sliderHTML` snapshot from a copy that is about to be discarded, and every `gsap.set` in "Initial setup" then runs against cards that never render.

*(3) Cleanup* — Resist treating `gsap.context` as the whole answer here. Nearly every tween this component creates — both `animateSlide` calls, the far card's fade-to-nothing, the new card's scale-in, both title-swap tweens, the preview crossfade — fires from inside `transitionSlides`, which only ever runs later, off the `.slider` click listener or an item's click listener, never during the synchronous pass through a `gsap.context` factory. Reaching any of it from a context would mean turning `transitionSlides`, `createAndAnimateTitle` and `updatePreviewImage` into named registrations behind `self.add("name", fn)`, and even then `ctx.revert()` still would not remove the DOM nodes those functions build and delete by hand with `createElement`/`appendChild`/`remove()`. The reference implementation reaches for none of that — it has no `gsap.context` anywhere — and instead solves cleanup with the same primitives a context wraps, applied directly. That solution is already correct; port it unchanged rather than replacing it:

```jsx
useEffect(() => {
  const slider = rootRef.current;
  let destroyed = false;
  const sliderHTML = slider.innerHTML;   // pristine markup, captured before any gsap.set runs
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      if (!destroyed) fn();
    }, ms);
    timers.add(t);
    return t;
  };
  // initial gsap.set on the three cards, splitTextIntoSpans plus the intro title tween,
  // the .slider click listener, and one click listener per .slider-items <p> — all as
  // described above, with transitionSlides and its helpers closing over this `destroyed`
  // and this `later` instead of module-level versions

  return () => {
    if (destroyed) return;
    destroyed = true;
    timers.forEach(clearTimeout);
    timers.clear();
    slider.removeEventListener("click", onSliderClick);
    offs.forEach((off) => off());
    gsap.killTweensOf(slider.querySelectorAll("*"));
    slider.innerHTML = sliderHTML;
  };
}, []);
```

Order matters and every step earns its place. `destroyed = true` has to flip first, because `createAndAnimateTitle`'s and `updatePreviewImage`'s `onComplete` callbacks — the ones that `.remove()` the outgoing `<h1>` and the outgoing preview `<img>` — already guard themselves on that same flag; keep that closure intact and a title-swap or crossfade whose delayed `onComplete` lands after unmount becomes a no-op instead of a stray DOM mutation. Clearing `timers` next stops the 1-second counter update and the 2-second class-reassignment (`activeSlide.className = …`, `incomingSlide.className = …`) from ever firing against a torn-down instance. `gsap.killTweensOf(slider.querySelectorAll("*"))` has to run before the `innerHTML` reset, not after: a transition started on the render right before unmount can still have its two-second tweens in flight, and overwriting `innerHTML` first doesn't stop them — GSAP keeps ticking against the detached nodes it already holds references to until something kills the tweens explicitly. Only then does `slider.innerHTML = sliderHTML` erase what a context could never have reached anyway: the extra `.slide-container`, the extra `<h1>`, the extra preview `<img>`, and every inline `transform`/`clipPath`/`opacity` GSAP wrote in between. Capture `sliderHTML` at the very top of the effect, before the initial `gsap.set` calls run, exactly as the source does — capture it any later and the "pristine" snapshot bakes in the opening pose, so a remount restores a slider that looks mid-transition instead of freshly loaded.

The one place `gsap.context` would nominally apply — the three synchronous `gsap.set` calls in "Initial setup" plus the intro title's `gsap.fromTo` — is also the one place it buys nothing: those inline styles live on nodes the `innerHTML` reset above already erases wholesale. Introducing a context just to revert a subset of what the manual reset already reverts is two cleanup mechanisms doing overlapping work; skip it.

Finally, do not respond to this component's own DOM churn by lifting `activeSlideIndex` into `useState`. `.slide-container.active`'s `className` gets reassigned in place at the two-second mark, a fourth card gets appended and a third removed on every click, and none of it goes through React again after mount. Render the initial three cards, the one `<h1>`, and the one preview `<img>` once from JSX inside the `rootRef` element and never let this component's own state trigger a re-render of that subtree — a re-render would hand JSX a stale three-card list while the live DOM already has four, and React's reconciler would start patching against a tree it no longer recognizes.
