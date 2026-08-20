# Sci-Fi Terminal Preloader Button → Hero Clip-Path Reveal

## Goal
Build a **self-playing terminal-styled preloader** that fills a circular SVG "loading" button, then waits for a **click to wipe the whole preloader away and reveal a hero headline**. On load: monospace status lines rise into view from behind masks (SplitText), a thin **circular SVG outline draws itself while the whole ring rotates 270°**, and a second **progress stroke fills in randomized, jittery stages** like a loader stalling and jumping. When it finishes, the centered logo fades out and an **"Engage" label rises up** — the button is now armed. **Clicking** the button scales the black preloader down, **unwinds both SVG strokes off the ring**, swaps the label from "Engage" up-and-out to "Access Granted" in, then **wipes the black preloader and a white revealer panel leftward via `clip-path`** while the hero **scales up from 0.75 → 1** and its headline **words stagger up out of masks**. The star effect is the **self-drawing + rotating + randomly-stepping SVG loader ring**, followed by the **synchronized left clip-path wipe → hero word reveal**.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`SplitText`** and **`CustomEase`**. No smooth-scroll library and no scroll interaction at all — the intro is a load-triggered timeline and the reveal is a `click`-triggered timeline. Imports:
```js
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import CustomEase from "gsap/CustomEase";
```
Register once at module top: `gsap.registerPlugin(SplitText, CustomEase)`. Immediately create two custom eases:
```js
CustomEase.create("hop",   "0.9, 0, 0.1, 1");
CustomEase.create("glide", "0.8, 0, 0.2, 1");
```
All logic runs inside `document.addEventListener("DOMContentLoaded", ...)`.

## Layout / HTML
Three stacked fixed/relative layers, painted back-to-front by z-index:

- **`.preloader-backdrop`** (fixed, full-viewport, **white** bg, gray text, `z-index: 0`) — a decorative terminal HUD sitting behind everything. Flex column, `justify-content: space-between`, so its content pins to top and bottom. It holds two `.pb-row`s (each `display:flex; justify-content:space-between; padding:1.5rem`):
  - Top `.pb-row`: five `.pb-col`s of monospace `<p>` lines — e.g. a repeated call-sign stacked 5×, a sector/id pair, a material/status pair, then a `.pb-col` containing **`#pb-logo`** (a small `<img>` with a dashed border), then a decorative glyph line.
  - Bottom `.pb-row`: six `.pb-col`s of short status `<p>` lines (single-word and two-line labels, a code like "F-9"), aligned to `flex-end`.
- **`.preloader`** (fixed, full-viewport, **black** bg, white text, `z-index: 2`, `overflow` visible) — the active layer. Flex column, `justify-content: space-between`. Its initial `clip-path` is the **full rectangle** `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`. Contains:
  - `.p-row` with a single `<p>` "Initiating".
  - `.p-row` with a `.p-col` (two `.p-sub-col` groups of stacked `<p>` labels, `gap: 6rem`, aligned `flex-end`) and a second `.p-col` with a `<p>` code (e.g. "PX-17").
  - `.preloader-btn-container` — **absolutely centered, 20rem × 20rem**, the click target. Inside, all absolutely centered on the same point:
    - `#pbc-logo` — a white `<img>` logo mark, `4rem × 4rem`.
    - `#pbc-label` — `<p>` "Engage".
    - `#pbc-outro-label` — `<p>` "Access Granted".
    - `.pbc-svg-strokes` — an `<svg viewBox="0 0 320 320">` containing **two concentric `<circle>`s**, `cx=160 cy=160 r=155 stroke-width=2`:
      - `.stroke-track` — dark stroke (`#2b2b2b`).
      - `.stroke-progress` — white stroke (`#fff`).
      Both start with `stroke-dasharray` and `stroke-dashoffset` equal to the circumference (≈974) so nothing is drawn.
- **`.hero`** (relative, full-viewport, **black** bg, white text, `z-index` below preloader) — flex-centered, `text-align:center`, and **starts `transform: scale(0.75)`**. Contains:
  - `.preloader-revealer` — an absolutely positioned **white** panel covering the hero, with initial `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rectangle → hero hidden behind white).
  - `<h1>` headline — e.g. "The system is now visible", width 90%.

Keep all copy neutral/fictional sci-fi terminal text (call-signs, phase labels, "Engage", "Access Granted"). No real brand or client names.

## Styling
Google Fonts: **Barlow Condensed** (weights 100–900, italics available) and **Geist Mono** (100–900).

Color tokens:
- `--base-100: #fff` (white)
- `--base-200: #7a7a7a` (mid gray)
- `--base-300: #000` (black)

Type:
- `h1`: Barlow Condensed, **uppercase**, `font-size: clamp(5rem, 15vw, 15rem)`, weight **800**, `letter-spacing: -2%`, `line-height: 0.8`.
- `p`: Geist Mono, **uppercase**, `font-size: 0.75rem`, weight 500, `line-height: 1` (button labels `#pbc-label`/`#pbc-outro-label` are `0.9rem`).
- `.preloader-backdrop` is white bg + `--base-200` gray text; `.preloader` and `.hero` are black bg + white text.

**Split-piece initial state (load-bearing for the masked reveals):**
```css
h1 .word,
p  .line {
  position: relative;
  transform: translateY(100%);   /* every split line/word starts one line below */
  will-change: transform;
}
```

Key positioning / will-change (the animation depends on these):
- `.preloader` → `will-change: transform, clip-path`.
- `.preloader-btn-container` → `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:20rem; height:20rem`.
- `.pbc-svg-strokes`, `#pbc-logo`, `#pbc-label`, `#pbc-outro-label` → all `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)` (perfectly stacked). `.pbc-svg-strokes` and its `svg` are `width:100%; height:100%; will-change:transform`.
- `#pbc-logo` → `4rem × 4rem`. `#pb-logo` → `2.5rem × 2.5rem`, `padding:0.25rem`, `border:1px dashed var(--base-200)`.
- `.hero` → `transform: scale(0.75); will-change:transform`.
- `.hero .preloader-revealer` → `position:absolute; inset:0; width:100%; height:100%; background:var(--base-100); will-change:clip-path`.

Responsive `@media (max-width:1000px)`: hide the top `.pb-row`'s 1st, 2nd, and 5th `.pb-col`s (`display:none`) to declutter the HUD on narrow screens. Nothing else about the animation changes.

## GSAP effect (exhaustive)

### Setup (once, inside DOMContentLoaded)
```js
let preloaderComplete = false;

const preloaderTexts   = document.querySelectorAll(".preloader p");
const preloaderBtn     = document.querySelector(".preloader-btn-container");
const btnOutlineTrack  = document.querySelector(".stroke-track");
const btnOutlineProgress = document.querySelector(".stroke-progress");
const svgPathLength    = btnOutlineTrack.getTotalLength();   // ≈ 973.9 for r=155
```
- `gsap.set([btnOutlineTrack, btnOutlineProgress], { strokeDasharray: svgPathLength, strokeDashoffset: svgPathLength })` — normalize both circles to the measured circumference and hide them (nothing drawn).
- **SplitText**: for **each** `.preloader p`, `new SplitText(p, { type: "lines", linesClass: "line", mask: "lines" })` (masked lines). For the hero, `new SplitText(".hero h1", { type: "words", wordsClass: "word", mask: "words" })` (masked words). The `mask` option wraps each piece in a clipped element so the `translateY(100%)` start state hides it fully.

### Intro timeline (auto-plays on load)
`const introTl = gsap.timeline({ delay: 1 });` — a **1s initial delay**, then:

1. **Status lines rise.** `.to(".preloader .p-row p .line", { y: "0%", duration: 0.75, ease: "power3.out", stagger: 0.1 })` — every masked line inside the two `.p-row`s slides up into view, 0.1s apart. (Only `.p-row` lines here — the button labels are split too but animated later.)
2. **Track draws itself.** `.to(btnOutlineTrack, { strokeDashoffset: 0, duration: 2, ease: "hop" }, "<")` — position `"<"` = starts together with step 1. The dark ring outline draws from nothing to a full circle over 2s.
3. **Whole ring rotates.** `.to(".pbc-svg-strokes svg", { rotation: 270, duration: 2, ease: "hop" }, "<")` — also starts with step 1; the SVG spins 0° → 270° while it draws, so the stroke appears to sweep around.
4. **Randomized progress fill.** Build stops:
   ```js
   const progressStops = [0.2, 0.25, 0.85, 1].map((base, i) =>
     i === 3 ? 1 : base + (Math.random() - 0.5) * 0.1);   // last is exactly 1; others jitter ±0.05
   ```
   For each `stop` (index `i`), append:
   ```js
   introTl.to(btnOutlineProgress, {
     strokeDashoffset: svgPathLength - svgPathLength * stop,  // fills to `stop` fraction
     duration: 0.75,
     ease: "glide",
     delay: i === 0 ? 0.3 : 0.3 + Math.random() * 0.2,        // stalls between jumps
   });
   ```
   These are sequential (default end-of-timeline position). Net feel: the white progress stroke jumps to ~20%, pauses, nudges to ~25%, pauses, leaps to ~85%, then snaps to 100% — a stuttering, "real loader" fill.
5. **Logo fades out.** `.to("#pbc-logo", { opacity: 0, duration: 0.35, ease: "power1.out" }, "-=0.25")` — overlaps back 0.25s into the last progress jump.
6. **Button shrinks.** `.to(preloaderBtn, { scale: 0.9, duration: 1.5, ease: "hop" }, "-=0.5")` — the whole button container eases from scale 1 → 0.9.
7. **"Engage" label rises + arm the button.** `.to("#pbc-label .line", { y: "0%", duration: 0.75, ease: "power3.out", onComplete: () => { preloaderComplete = true; } }, "-=0.75")` — the masked "Engage" text slides up where the logo was, and its `onComplete` flips `preloaderComplete = true` so the click handler will now fire.

### Exit timeline (click `.preloader-btn-container`)
Listener on `preloaderBtn`: bail if `!preloaderComplete`; otherwise set `preloaderComplete = false` (one-shot) and run `const exitTl = gsap.timeline();`:

1. **Preloader scales down.** `.to(".preloader", { scale: 0.75, duration: 1.25, ease: "hop" })`.
2. **Both strokes unwind off the ring.** `.to([btnOutlineTrack, btnOutlineProgress], { strokeDashoffset: -svgPathLength, duration: 1.25, ease: "hop" }, "<")` — offset goes to **negative** circumference, so both circles animate out of view (unraveling), starting together with step 1.
3. **"Engage" exits up.** `.to("#pbc-label .line", { y: "-100%", duration: 0.75, ease: "power3.out" }, "-=1.25")` — the current label slides up and out of its mask.
4. **"Access Granted" enters.** `.to("#pbc-outro-label .line", { y: "0%", duration: 0.75, ease: "power3.out" }, "-=0.75")` — the outro label rises up into the same spot right behind it.
5. **Preloader wipes left.** `.to(".preloader", { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)", duration: 1.5, ease: "hop" })` — the two right-hand corners collapse onto the left edge, so the black preloader wipes off to the left.
6. **Revealer wipes left (reveals hero).** `.to(".preloader-revealer", { clipPath: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)", duration: 1.5, ease: "hop", onComplete: () => gsap.set(".preloader", { display: "none" }) }, "-=1.45")` — starts 1.45s before the previous ends, i.e. **nearly in lockstep** with the preloader wipe. The white revealer covering the hero collapses to the left too, uncovering the black hero + headline; on complete the now-empty preloader layer is hidden.
7. **Hero scales up.** `.to(".hero", { scale: 1, duration: 1.25, ease: "hop" })` — hero eases 0.75 → 1 (settles to full size as it's revealed).
8. **Headline words stagger in.** `.to(".hero h1 .word", { y: "0%", duration: 1, ease: "glide", stagger: 0.05 }, "-=1.75")` — each masked word slides up into place 0.05s apart, overlapping back 1.75s so the words are rising while the hero is still scaling/revealing.

### Eases used
- **`hop`** = `CustomEase "0.9, 0, 0.1, 1"` — a hard, near-symmetric ease used for the ring draw/rotate, the scale changes, the stroke unwind, and the clip-path wipes.
- **`glide`** = `CustomEase "0.8, 0, 0.2, 1"` — softer S-curve for the progress fill and the final headline words.
- `power3.out` for the masked text rises, `power1.out` for the logo fade.

## Assets / images
Two logo images (a third dark variant may exist but is unused by the component), all **~1:1 square PNGs on transparent background**, each a small **monochrome geometric emblem** (e.g. a fragmented/split-hexagon glyph):
1. **Neutral/gray mark** — used as `#pb-logo`, the tiny dashed-bordered badge in the white backdrop HUD (`2.5rem`).
2. **White mark** — used as `#pbc-logo`, centered inside the circular button (`4rem`), and fades out mid-intro.

Provide simple, high-contrast marks; exact glyph is not important, aspect 1:1.

## Behavior notes
- **Two triggers only:** the intro is `load`-driven (1s delay, ~6s total), then it **waits for a user click**. The `preloaderComplete` boolean gates the click — the exit can't run until "Engage" has finished rising, and it's reset to `false` on click so the exit fires exactly once.
- No ScrollTrigger, no Lenis, no scroll interaction anywhere.
- The whole thing is percentage/`clip-path`/`vw`-based, so it scales fluidly; the `≤1000px` media query only hides three decorative HUD columns.
- Reduced-motion is **not** handled in the original — the animation always plays.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/aminezegmou-landing-page/logo-dark.png
https://motionprompts.dev/c/aminezegmou-landing-page/logo-light.png
https://motionprompts.dev/c/aminezegmou-landing-page/logo.png
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--paper-grid`, `--ink-soft`, `--ink-strong`, `--console`, `--console-text`, `--phosphor`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the ring draws, "Engage" rises, the click wipes the preloader away, and only later does something misbehave in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. The exit path here is gated by one boolean, `preloaderComplete`, closed over by the `click` listener on `.preloader-btn-container` — and neither that flag nor the listener is a tween, a timeline, or a trigger, so a `gsap.context` wrapped around the effect cannot see either of them. A double mount that reverts `introTl` but leaves the listener attached hands the button two closures on the same node: the first mount's, whose `introTl` already ran to completion and flipped its own `preloaderComplete` true, and the live mount's. One click then fires two `exitTl` instances at once, both scaling the same `.preloader`, unwinding the same `btnOutlineTrack`/`btnOutlineProgress` pair, and wiping the same `.preloader-revealer` — invisible until a user actually clicks, and by then it reads as the wipe stuttering or the hero settling at the wrong scale, not as a doubled mount. None of this reproduces in a production build, because React only does the double mount in development. Treat the click listener's removal as load-bearing cleanup, on the same footing as the ticker rule below — it is not a GSAP object, and `ctx.revert()` will not touch it.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no lines split, no ring drawn, no click ever arms. Delete the listener and move its entire body — both `SplitText` passes, `introTl`, the `progressStops` construction, and the click listener registration — directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — `preloaderTexts`, `preloaderBtn`, `btnOutlineTrack` and `btnOutlineProgress` are unscoped lookups, and `svgPathLength` is a one-time `getTotalLength()` read off whichever `.stroke-track` the query happens to find. Give the component a root ref over the element wrapping `.preloader-backdrop`, `.preloader` and `.hero`, and resolve all four from it. The circle's own geometry fixes what `getTotalLength()` returns, so a stray match during the StrictMode remount would not corrupt the number itself — but if `btnOutlineTrack` or `btnOutlineProgress` end up holding the outgoing copy, every tween built against those direct node references — the track draw, the ring rotation, the progress jumps, the unwind on exit — animates a circle the DOM has already discarded, and the ring the user is looking at never moves.

*(3) Cleanup* — Wrap the `SplitText` passes and `introTl` in a `gsap.context` scoped to the root ref. `introTl` is built synchronously inside the effect body, so the context's own tracking captures it for free. `exitTl` is not: it is only constructed inside the click listener's callback, which fires later, on the user's click, well outside the context factory's one synchronous pass. Wrapping the listener's *registration* in the context does nothing for the timeline it builds when the listener actually runs. Register the exit logic as a context method instead, and invoke that method from the listener:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    // both SplitText passes, then introTl exactly as constructed above
    self.add("runExit", () => {
      // exitTl exactly as constructed above
    });
  }, rootRef);

  const btn = rootRef.current.querySelector(".preloader-btn-container");
  const onClick = () => {
    if (!preloaderComplete.current) return;
    preloaderComplete.current = false;
    ctx.runExit();
  };
  btn.addEventListener("click", onClick);

  return () => {
    btn.removeEventListener("click", onClick);
    ctx.revert();
  };
}, []);
```

Build `exitTl` straight from the closure instead of through `ctx.add`, and the next `ctx.revert()` kills only `introTl` — any `exitTl` already in flight, and the inline `clipPath`/`scale`/`strokeDashoffset` values it wrote onto `.preloader`, `.preloader-revealer` and `.hero`, survive the revert untouched. Keep `preloaderComplete` itself in a ref (`useRef(false)`) rather than state: it is read only inside the click handler and inside `introTl`'s own completion callback, and neither needs to trigger a render. `gsap.registerPlugin(SplitText, CustomEase)` and the two `CustomEase.create` calls for the two named eases stay at module scope, outside the component — rebuilding them on every mount is harmless but pointless.

This component runs `SplitText` once per element the `.preloader p` selector matches — every status line under both `.pb-row`s, plus `#pbc-label` and `#pbc-outro-label` themselves, since both are `<p>` tags the same query picks up — and a further, separate pass on `.hero h1`. Collect every instance the loop produces into an array alongside the hero split, and revert all of them, inside the context, in the cleanup, not just the more visible hero one:

```jsx
const splits = [
  ...Array.from(root.querySelectorAll(".preloader p")).map((p) => new SplitText(p /* lines, mask */)),
  new SplitText(root.querySelector(".hero h1") /* words, mask */),
];
// return () => splits.forEach((s) => s.revert());
```

Miss the `.preloader p` loop and only revert the hero split, and the next mount's pass over `#pbc-label`/`#pbc-outro-label` wraps `.line` spans that are already `.line` spans — nested one level deeper than `introTl`'s `"#pbc-label .line"` and `exitTl`'s `"#pbc-outro-label .line"` selectors expect, so the button's labels stop rising or exiting at all.

Both passes also run before either font — Barlow Condensed for the hero headline, Geist Mono for every status label and both button labels — is guaranteed to have loaded, since nothing in this script waits on `document.fonts.ready`. The masked-line technique measures each line box against whatever face is current the instant `SplitText` runs; split against the fallback face and the swap-in reflows the very lines `introTl` is about to animate up out of their masks. If your font pipeline makes this a real risk, gate the two `SplitText` passes and the construction of `introTl` behind `document.fonts.ready`, keep the effect callback itself synchronous, and check a cancellation flag before touching anything once that promise resolves — a StrictMode unmount that lands before fonts settle would otherwise run `new SplitText` against status lines and a headline that are already gone.
