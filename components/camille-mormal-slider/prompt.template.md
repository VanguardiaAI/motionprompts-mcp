---
slug: camille-mormal-slider
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 7
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Framed-Plate Portrait Slider — Clip-Path Wipe + Image Parallax + CustomEase Odometers

## Goal

Build a one-screen portrait slider that presents each photograph as a **framed plate on a paper wall**, not as a full-bleed background. The page is split into a **naming rail on the left** (series blurb, slide title, sampled ground colour, counter, progress rail, thumbnails) and a **stage on the right** holding the plate itself, surrounded by printer's crop marks.

Navigation is by clicking either half of the plate, by the two rotating `+` marks flanking it, by a thumbnail, or by the arrow keys. On each navigation the incoming photograph is revealed by a **`clip-path` wipe** growing from the edge you came from, its inner `<img>` slides in with a **parallax offset** while the outgoing image pushes off the opposite side. In sync, three **vertically sliding odometers** (slide title, ground hex, counter), a **progress fill**, an **accent-colour change across the whole page**, and the **±90° rotation of the two `+` marks** all move on a shared CustomEase curve called `"hop"`. No scroll, no autoplay.

### The decision that makes this component

The obvious build for a photo slider is `width:100vw; height:100vh; object-fit:cover` with the type floated on top and a scrim to keep it legible. **Do not build that here.** It is the reason most photo sliders look cheap: a viewport is never the aspect ratio of the picture, so every frame gets cropped differently, a portrait and a landscape in the same deck stop reading as one series, and the type has to fight whatever happens to be under it that second.

Instead:

- The photograph lives in a **plate of fixed ratio** (10:7, the ratio of the source files) sized so it always fits one screen. Every frame crops identically, so a set of pictures reads as a set.
- **All type lives beside the plate, never on it.** No scrim, no text-shadow, no dark gradient over the artwork. Contrast is solved by layout instead of by veiling the picture.
- **Colour is the only thing that changes per slide.** A single `--accent`, sampled from the actual seamless-paper backdrop of the current photograph, drives the swatch, the ground hex line, the progress fill, the active thumbnail rule and the nav underline. Nothing else in the palette moves. The rest of the page is one warm bone paper and one near-black ink.

## Tech

Vanilla HTML/CSS/JS with ES module imports. `gsap` (npm) plus the single GSAP plugin **`CustomEase`** (`import { CustomEase } from "gsap/CustomEase"`). No other libraries — no ScrollTrigger, no Lenis, no carousel library. Everything runs inside a `DOMContentLoaded` listener; call `gsap.registerPlugin(CustomEase)` first.

## Layout / HTML

```
header.masthead                       ← flex row, hairline bottom rule
  a.wordmark            "Camille Mormal"
  nav.masthead-nav
    a[aria-current]     "Work"        (underlined in the accent colour)
    a                   "Studio"
    a                   "Contact"

main.slider                           ← grid: [rail minmax(288px,30%)] [stage 1fr]

  section.meta                        ← the naming rail, hairline right rule
    .meta-head
      p.eyebrow         "Portrait series · 2026"
      p.series          "Four Grounds"
      p.series-note     one or two lines about the shoot

    .meta-plate
      .slide-title                    ← odometer window, exactly 1 line tall
        .slide-title-wrapper          ← translated vertically
          p "Vermilion"  p "Verdigris"  p "Ochre"  p "Amethyst"
      .slide-ground
        span.swatch                   ← 11px square filled with --accent
        .slide-hex                    ← odometer window, exactly 1 line tall
          .slide-hex-wrapper
            p "Ground #B30B15" … one per plate

    .meta-foot
      .counter-row
        .counter-window               ← odometer window, exactly 1 line tall
          .counter
            p "01"  p "02"  p "03"  p "04"
        span.counter-total  "/ 04"
      .rail > span.rail-fill          ← 2px progress bar, scaleX driven
      .thumbs[role=group]
        button.thumb.is-active > img  (plate 1)
        button.thumb            > img (plates 2–4)

  section.stage                       ← grid place-items:center, relative
    .plate                            ← 10:7, the click target
      .slider-images                  ← absolute, overflow hidden (clips the wipe)
        .img > img                    ← ONE slide hard-coded (image #1)
      span.crop-tl / .crop-tr / .crop-bl / .crop-br
    button.step[data-dir=prev] > span.step-mark "+"
    button.step[data-dir=next] > span.step-mark "+"
    p.browse                          ← one-line interaction hint
```

Notes:

- Only **one** `.img` is present in the HTML. Every subsequent slide is created in JS and appended to `.slider-images`.
- The thumbnails are real `<button>`s in a labelled `role="group"`, each carrying its plate's ground colour in `data-accent` and a descriptive `aria-label`.
- The two `+` marks are real `<button>`s with `aria-label`, 48×48 of hit area, `disabled` at the ends of the deck — they are the controls, not decoration that happens to sit near one.
- Names are neutral pigment words (Vermilion / Verdigris / Ochre / Amethyst) — no real brands, no invented sitters.

## Styling

- Fonts: **Instrument Serif** (display: wordmark, series line, slide title, counter numerals) and **Inter** (everything else: labels, eyebrows, notes). The hierarchy is carried by size and family, not by weight alone — one 58px serif title against 10px tracked uppercase Inter labels.
- Palette on `:root`: `--paper:#ebe6dc`, `--ink:#16130f`, `--ink-soft:rgba(22,19,15,.58)`, `--ink-faint:rgba(22,19,15,.34)`, `--rule:rgba(22,19,15,.14)`, `--accent:#b30b15` (rewritten per slide by JS). Also `--edge`, `--chrome`, `--serif`, `--sans`.
- `* { margin:0; padding:0; box-sizing:border-box; user-select:none }`. `body` is a column flexbox at `min-height:100dvh` with the paper background.
- `.slider`: `display:grid; grid-template-columns: minmax(288px, 30%) 1fr; flex:1; min-height:0`.
- `.meta`: column flexbox, `justify-content:space-between`, `border-right:1px solid var(--rule)` — the rule, not a background change, is what separates rail from stage.
- **The plate** — `.stage { display:grid; place-items:center; padding:clamp(1.5rem,3.2vw,3.5rem); overflow:hidden }`; `.plate { position:relative; aspect-ratio:10/7; width:min(100%, calc((100dvh - var(--chrome)) * 1.4286)) }` where `--chrome: 13rem` is the vertical room the masthead and the stage padding take. That one `min()` is what guarantees the plate keeps its ratio *and* never pushes the page past one screen — no JS sizing.
- **`.plate` must not clip.** `overflow:hidden` goes on `.slider-images` instead, because the four crop marks are positioned 9px *outside* the plate's corners and a clip on the plate would eat them.
- **Odometer windows** — `.slide-title`, `.slide-hex`, `.counter-window` each set their own `font-size` and `line-height` and then `height: 1.22em` / `1.7em` / `1.15em` — i.e. exactly one line — with `overflow:hidden`. Their `p` children use `font: inherit` and `white-space: nowrap`.
- **Thumbnails** — `aspect-ratio:10/7; min-height:46px` (56px on mobile) so they stay finger-sized, `filter:grayscale(1); opacity:.55` at rest, full colour when active or hovered, with a 2px accent bar sliding in underneath via `::after { transform:scaleX(0→1) }`. Desaturating the inactive ones is not decoration: the ground colour *is* the subject of the series, so withholding it is the clearest possible "not this one".
- **Progress** — `.rail` is a 2px `--rule` line; `.rail-fill` is an absolutely-positioned accent bar with `transform-origin:0 50%`, tweened to `scaleX(current/total)`.
- `:focus-visible { outline:2px solid var(--accent); outline-offset:3px }` — every control is reachable by keyboard and shows it.
- Responsive `@media (max-width:900px)`: `.slider` becomes a column flexbox with the stage first (`order:1`) and the rail second; the plate goes to `width:100%` at the same 10:7; the two `+` buttons lose their gutter, so they move onto the plate edges with a 46px translucent paper chip behind them; `.browse` is dropped. `@media (max-width:480px)` also drops `.series-note` **and shrinks the masthead**. `@media (prefers-reduced-motion: reduce)` collapses every CSS transition.
- **Shrink the masthead on a phone, and check it with arithmetic.** It is the most rigid row on the page — an italic serif wordmark next to three uppercase links tracked out at `0.2em` — and `space-between` cannot save a line that does not fit: it drops the padding and lets the last link run off the screen. At the desktop sizes the row asks for **410px** (20 padding + 127 wordmark + 24 gap + 219 nav + 20 padding), which does not fit a 390px phone, never mind a 320px one. Under 480px take the wordmark to `1rem`, the links to `0.5625rem` and — this is the half people forget — the tracking to `0.1em`, because `0.2em` on three uppercase words is ~17px of pure letter-spacing. Same three items, ~300px, so 320px clears with 20px to spare. Add `flex-wrap: wrap` as the net for the font-size control at 160%, where no size keeps three tracked links on one line: the nav drops to a second row instead of being cut.
- Mobile type overrides target the odometer **windows** (`.slide-title`, `.counter-window`), never the `p` inside them — see the trap below.

## GSAP effect (exhaustive)

### CustomEase `"hop"` (shared by every tween)

```js
gsap.registerPlugin(CustomEase);
CustomEase.create("hop", "M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1");
```

The curve rises steeply and reaches ~1 early (around x≈0.5) then flattens — a fast "snap-then-settle". **Every** tween in this component uses `ease: "{{motion.ease.primary}}"`.

### State

```js
const total   = thumbs.length;   // 4, read from the DOM — not a literal
let current   = 1;               // 1-based index of the visible plate
let markRotation = 0;            // accumulated degrees for the two "+" marks

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SLIDE = reduced ? 0.01 : 1.5;   // the three transition tweens
const STEP  = reduced ? 0.01 : 1;     // odometers, rail, mark rotation
```

### Odometer translation — `place(duration)`

The three odometers are translated by whole lines. **The step is read from the clipping window at call time, never hard-coded:**

```js
const odometers = [titles, hexes, counter];

function place(duration) {
  odometers.forEach((track) => {
    gsap.to(track, {
      y: -track.parentElement.clientHeight * (current - 1),
      duration, ease: "{{motion.ease.primary}}", overwrite: true,
    });
  });
}
```

Since each window is styled to be exactly one line tall, `clientHeight` *is* the step. A `ResizeObserver` on the title window calls `place(0)` whenever that height changes — a breakpoint, a rotated phone, a font-size control feeding a new `:root` size — so the odometers re-seat themselves instead of drifting.

### Per-slide repaint — `paint()`

```js
document.documentElement.style.setProperty("--accent", thumbs[current-1].dataset.accent);
// toggle .is-active + aria-current on the thumbnails
gsap.to(railFill, { scaleX: current / total, duration: STEP, ease: "{{motion.ease.primary}}" });
// disable the prev button at slide 1 and the next button at the last slide
```

Rewriting one custom property is the whole colour change: the swatch, the hex line, the rail fill, the active thumbnail bar and the nav underline all reference `var(--accent)` and all carry a `0.7s` CSS transition on the concrete property, so they cross-fade together without a single extra tween.

### Slide transition — `animateSlide(direction)`

`direction` is `"left"` (backward) or `"right"` (forward).

1. **Grab the outgoing slide**: the last `.img` currently inside `.slider-images`.
2. **Compute the push distance from the plate, not from a constant**:
   ```js
   const push = Math.min(500, plate.clientWidth * 0.45);
   ```
   A fixed ±500px reads as a graceful drift in a 900px plate and as a violent throw in a 340px one on a phone.
3. **Build the incoming slide**: create `div.img` + `img` with `src = img${current}.jpg` (`current` is already the destination index) and copy the matching thumbnail's `alt`. Pre-offset it with `gsap.set(img, { x: direction === "left" ? -push : push })`, then append.
4. **Push the outgoing image off**: `gsap.to(outgoing.querySelector("img"), { x: direction === "left" ? push : -push, duration: SLIDE, ease: "{{motion.ease.primary}}" })`.
5. **Wipe the incoming slide open** from the edge you came from — with the horizontal edges of the polygon pushed 2% *outside* the plate:
   ```js
   gsap.fromTo(frame,
     { clipPath: direction === "left"
         ? "polygon(0% -2%, 0% -2%, 0% 102%, 0% 102%)"
         : "polygon(100% -2%, 100% -2%, 100% 102%, 100% 102%)" },
     { clipPath: "polygon(0% -2%, 100% -2%, 100% 102%, 0% 102%)",
       duration: SLIDE, ease: "{{motion.ease.primary}}", onComplete: dropSpentFrames });
   ```
   The overshoot clips nothing — the frame has no paint above 0% or below 100% — and it buys the one thing a `100%` edge cannot give you: the clip boundary no longer lands on the same fractional pixel row as the plate's own edge. **The trap:** the frame *underneath* is a GSAP-transformed layer, so the compositor snaps it to whole device pixels while the clipped frame on top is not snapped. Where the plate's height lands on a half pixel — which on a phone it does — one device row at the top of the plate ends up painted by the outgoing photograph: a coloured hairline exactly `plateWidth − push` long, on the top edge, in the previous slide's ground colour. It looks like a stray border and it is not one; do not chase it with `border-top` or a background, and do not "fix" it by rounding the plate size.
6. **Parallax the incoming image to rest**: `gsap.to(img, { x: 0, duration: SLIDE, ease: "{{motion.ease.primary}}" })`. The picture drifts into place *while* the mask opens over it — the two move at different rates, which is the parallax.
7. **Prune** the stack, twice over. Straight after appending, if `.slider-images` holds more than `total` frames, remove the oldest — that is the cap for someone hammering the deck. Then, in the wipe's `onComplete`, drop everything *below* the frame that just finished and clear its own `clipPath` and the image's transform: once the wipe is over that frame covers the plate on its own, so the frames underneath are pure liability — composited layers that can peek past the plate's edge, holding decoded images alive. Guard it with `if (frame !== sliderImages.lastElementChild) return;`: if the visitor clicked again mid-wipe, this callback belongs to a frame that is no longer on top and must not delete the ones still animating — the newer frame's own `onComplete` will clean up.
8. **Rotate the marks**: `markRotation += direction === "left" ? -90 : 90; gsap.to(marks, { rotate: markRotation, duration: STEP, ease: "{{motion.ease.primary}}" })`. A `+` at 90° reads as `×`, so the two marks flip between `+` and `×` on every step and keep winding.

### Navigation — `goTo(index)`

```js
function goTo(index) {
  if (index === current || index < 1 || index > total) return;
  const direction = index < current ? "left" : "right";
  current = index;
  animateSlide(direction);
  place(STEP);
  paint();
}
```

Four entry points, all routed through it:

- **`.plate` click** — compares `event.clientX` against the plate's own `getBoundingClientRect()` midpoint, so the split follows the picture, not the window. The listener is on the plate, not on `document`: clicking the rail, a thumbnail or an arrow button must not also advance the deck.
- **`.step` buttons** — `goTo(current ∓ 1)` off `data-dir`.
- **thumbnails** — `goTo(i + 1)`; a multi-step jump still plays a single wipe, in the direction of the jump.
- **`keydown` on `document`** — `ArrowLeft` / `ArrowRight`.

Navigation is clamped: no wrap-around, and the buttons go `disabled` at the ends.

## The trap

**Never let a magic number in the CSS have to agree with a magic number in the JS.** The naive build of this odometer is `height:60px; line-height:60px` in the stylesheet and `y: -60 * (current - 1)` in the script. It works exactly once. Change the title size, cross a breakpoint, ship a font-size control, or let the demo run on a machine where the display font falls back — and the two numbers disagree by a few pixels. The failure is silent and ugly: the window shows a sliver of the next title above or below the current one, forever, and nothing writes to the console.

The fix is to give the height a single owner. The CSS sets the type **on the window** and gives it `height: 1.22em` — one line, by construction, at whatever size the window is currently rendering. The JS reads `parentElement.clientHeight` and never states an opinion about it. Two consequences you must respect:

- The odometer paragraphs need `white-space: nowrap`. A title that wraps is two lines tall inside a one-line window, and the measurement is right while the layout is wrong.
- Responsive overrides must resize the **window** (`.slide-title { font-size: … }`), not the paragraphs inside it (`.slide-title-wrapper p { font-size: … }`). Resizing the paragraph changes the line while leaving `1.22em` computed against the window's old size — which is the very desync you just removed.

## Assets / images

**4 landscape photographs at 1200×840 (10:7), one series.** This is the point of the component: same sitter distance, same lighting, same lens, same seamless-paper studio setup, varying only in the colour of the paper. Strict profile head-and-shoulders portraits work best because the repetition of the pose is what turns four pictures into one body of work.

Whatever you substitute, keep the rule: **one shoot, one ratio, one distance, four grounds.** Mixing a full-length shot into a set of head-and-shoulders, or a 16:9 crop into a set of 4:3, is what the framed-plate treatment is designed to make impossible to hide. Sample each file's backdrop colour and paste it into that slide's `data-accent` and its "Ground #XXXXXX" line — the accent must be the real colour of the paper, not a colour you liked.

File naming `img1.jpg … img4.jpg`. No logos or brand marks.

## Behavior notes

- **One screen, no scroll hijack, no autoplay.** On mobile the layout stacks (plate, then rail) and stays within a phone screen.
- **No wrap**: navigation clamps at the first and last plate, and the `+` buttons reflect it with `disabled`.
- Re-clicks during an in-flight tween are not guarded — GSAP retargets and overlaps. `place()` uses `overwrite: true` so the odometers never fight themselves; the image tweens are allowed to stack, which is the original feel.
- `prefers-reduced-motion` is honoured in both directions: JS collapses every tween duration, CSS collapses every transition.
- Accessibility is part of the build, not a retrofit: `aria-current` on the active thumbnail inside a labelled group, `aria-label` on the two marks, `aria-live="polite"` on the title window, arrow-key navigation, visible focus rings, and 46–48px touch targets throughout.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same 10:7 ratio.

```
https://motionprompts.dev/c/camille-mormal-slider/img1.jpg
https://motionprompts.dev/c/camille-mormal-slider/img2.jpg
https://motionprompts.dev/c/camille-mormal-slider/img3.jpg
https://motionprompts.dev/c/camille-mormal-slider/img4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--ink-soft`, `--ink-faint`, `--rule`, `--accent`, `--edge`, `--chrome`, `--serif`, `--sans`. These names are not namespaced and they collide: `--ink` is defined by 164 of the components in this catalogue and `--paper` by 94, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **`--accent` is written to `document.documentElement`** by `paint()` on every navigation. If you scope the palette to a wrapper, move that `setProperty` call onto the same wrapper element or the slider will keep recolouring your whole page.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **`--chrome: 13rem`** encodes the height of *this page's* masthead plus the stage padding. In a different shell, re-measure it or the plate will size itself against room it does not have.

## Adapting this to React

Everything above describes a standalone document: one script that runs once behind `DOMContentLoaded`, closes over `current` and `markRotation` as plain variables, wires click handlers onto elements it queried from `document`, and additionally registers a `keydown` listener on `document` and a `ResizeObserver` on the title window. Nothing here expects to be asked to run a second time, and nothing undoes itself.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. The element-scoped listeners are harmless — they die with the nodes they were attached to. The two that are not are the ones bound above the component: the `keydown` listener on `document` and the `ResizeObserver`.

If the `keydown` listener is not removed on that first throwaway unmount, the remount adds a second one — two closures, each with its own `current` starting at `1` and its own `markRotation` starting at `0`, both bound to the same `document`, both reacting to the same key press. Because the two closures track the same key sequence their indices stay numerically in step, which makes the bug easy to miss in testing and ugly in practice: one arrow key now runs `animateSlide` twice, so two incoming `.img` layers get appended instead of one. The first closure queries `.slider-images` and finds its own freshly-appended frame as the last entry — call it frame A. The second closure runs immediately after, re-queries, now finds frame A (not the plate that was actually on screen before the key press) sitting last, and pushes *that* off as "the outgoing image" while stacking its own frame B on top with a second wipe and a second parallax tween. The visible result is a plate that flashes in and is immediately shoved back out on every key press, plus the pruning step running twice per press. The stale `ResizeObserver` is quieter but worse-behaved: it holds a reference to a detached window node forever and keeps calling `place(0)` on odometers nobody is looking at.

None of this reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no `readyState` guard. By the time a React component mounts, that event has already fired, so the body would simply never run — no slider, no error, nothing to debug. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its body into a `useEffect` with an empty dependency array. `current` and `markRotation` do not need to become refs or state: they live entirely inside the effect and are rebuilt from scratch on every effect run, which is exactly the reset a fresh mount should produce.

*(2) Element lookups* — `plate`, `sliderImages`, `titles`, `hexes`, `counter`, `railFill`, `marks`, `steps` and `thumbs` are all resolved off `document`. Give the component's outermost element a root `ref` and resolve every one of them from it (`rootRef.current.querySelector(".plate")`, and so on) instead of from `document`. This matters most for the query inside `animateSlide` that finds the outgoing frame: during the instant both StrictMode passes coexist, an unscoped `querySelectorAll` can resolve against the departing copy of the markup and push the wrong node off screen. The one write that stays intentionally global is `document.documentElement.style.setProperty("--accent", …)` — and if you scope the palette to your wrapper, retarget it there too.

*(3) Cleanup* — `place`, `paint` and `animateSlide` never run synchronously while the effect sets up; they run later, from inside the handlers. A `gsap.context` whose factory only registers listeners auto-tracks nothing, because no tween is created during that synchronous pass — so wrap them as named context methods and call those from the handlers:

```jsx
useEffect(() => {
  let current = 1;
  let markRotation = 0;

  const ctx = gsap.context((self) => {
    self.add("place", (duration) => { /* the three odometer tweens, y read from clientHeight */ });
    self.add("paint", () => { /* accent, thumbnails, rail scaleX, button disabled state */ });
    self.add("animateSlide", (direction) => { /* build the frame, wipe, push, parallax, prune, rotate */ });
  }, rootRef);

  const goTo = (index) => { /* clamp, set direction, ctx.animateSlide/place/paint */ };

  const onKey = (e) => {
    if (e.key === "ArrowLeft") goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  };
  document.addEventListener("keydown", onKey);

  const ro = new ResizeObserver(() => ctx.place(0));
  ro.observe(titleWindowRef.current);

  return () => {
    document.removeEventListener("keydown", onKey);
    ro.disconnect();
    ctx.revert();
  };
}, []);
```

`ctx.revert()` alone would leave both the `keydown` listener and the `ResizeObserver` untouched — neither is a tween or a trigger, so the context has no record of them — which is exactly the leftover that produces the doubled navigation described above. Removing them explicitly in the same cleanup, alongside the revert, is what makes a StrictMode remount (and a real unmount on route change) leave nothing behind. Registering `CustomEase` and building the `"hop"` curve belong at module scope, not inside the effect — both are idempotent, global, one-time registrations.
