---
slug: bennett-clive-scroll-animation
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Sticky Title Bar over Scrolling Logo List — Gap-Spread + Scale Scroll Animation

## Goal

Build a single-page editorial scroll experience. A **fixed wordmark** reading "Barrett & Hale", **centered on both axes of the viewport**, is painted with `mix-blend-mode: difference` so it inverts against everything scrolling behind it: near-black over the light client index, near-white over the dark full-bleed stills. As each row of a long client-logo list crosses the wordmark's band, the row's two logos **spread apart and then snap back together** (animated flex `gap`, driven by scrub ScrollTriggers). At the end of the page a very tall black footer section scrolls in; while it does, the wordmark **drifts downward** toward the bottom and **grows into a full-width title card**. Two effects carry the piece: the inversion, and the scrubbed flex-`gap` spread as rows pass through the wordmark.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**. No smooth-scroll library (native browser scroll). No SplitText, no CustomEase, no Three.js, no canvas. Entry: `<script type="module" src="./script.js">`, `import gsap from "gsap"` and `import { ScrollTrigger } from "gsap/ScrollTrigger"`, then `gsap.registerPlugin(ScrollTrigger)` inside a `DOMContentLoaded` handler.

## Layout / HTML

Single `.container` wrapping, in order:

1. `.sticky-bar` — a boxless wrapper (`display: contents`) holding **two identical `.wordmark-layer` divs**. Each layer contains one `p.wordmark` with three spans: `span.wordmark-word` "Barrett", `span.wordmark-amp` "&", `span.wordmark-word` "Hale".
   - `.wordmark-layer--invert` is the blended layer; it hides its ampersand.
   - `.wordmark-layer--accent` is `aria-hidden`, hides its two words, and shows only the ampersand.
   - Duplicating the whole wordmark (rather than positioning a lone ampersand) is what keeps the accent glyph pixel-aligned with the gap left for it: same markup, same font metrics, same box.
2. `section.hero` — one full-bleed `<img>` (hero image).
3. `section.clients` — **16 `.row` divs, each containing exactly two `.logo` divs**, each `.logo` holding a `<p>` placeholder (`Logo 1` … `Logo 32`). 32 logo cells total.
4. `section.trigger-footer` — one full-bleed `<img>` (footer image).

The class names `.sticky-bar`, `.wordmark`, `.row`, `.logo` and `.trigger-footer` are load-bearing for the JS — keep them exact.

## Styling

- Reset: `* { margin:0; padding:0; box-sizing:border-box }`. `html, body { width:100%; height:100%; overscroll-behavior:none }`.
- Font family: a modern neo-grotesque sans-serif — `font-family: "PP Neue Montreal"` (fall back to `"Neue Montreal", Helvetica, Arial, sans-serif`), `font-weight: 600`. The wordmark is the one tracked-uppercase element; the client names stay title case, like a credit roll.
- `img { width:100%; height:100%; object-fit:cover }`.
- **`.sticky-bar`**: `display: contents` — it must not generate a box. See the trap below.
- **`.wordmark-layer`**: `position: fixed; inset: 0; z-index: 10; pointer-events: none; overflow: hidden;` — a full-viewport transparent sheet. `.wordmark-layer--invert { mix-blend-mode: difference }`; `.wordmark-layer--accent { z-index: 11 }` (no blend, painted on top).
  - **The trap — put the blend on the fixed layer itself, never on anything inside it.** A `position: fixed` element is already a stacking context, and so is any ancestor carrying a `transform`, `filter`, `backdrop-filter`, `opacity < 1` or `isolation: isolate`. A `mix-blend-mode` declared *inside* such an element can only blend against that element's own backdrop — which is empty — so it silently renders as flat, un-inverted color, with no error anywhere. White type over a light section then reads as *invisible*, not as a blend bug. The chain from the blended element up to the root must be free of all of those.
- **`p.wordmark`**: `position:absolute; left:50%; top: var(--bar-y, 50%); transform: translate(-50%,-50%); display:flex; align-items:baseline; gap:.32em; width:max-content; line-height:1; white-space:nowrap; color:#fff;` — centered as **one unit** on both axes. Never position the words at the two edges of a 100%-wide bar: at narrow widths they run off the screen, and the eye stops reading it as a single name. `--bar-y` is the band's center line (the JS walks it down at the end); `--wordmark-size` is the type size the JS overrides during the closing title card.
  - `font-size: var(--wordmark-size, clamp(1.6rem, 8.4vw, 5.5rem))` — display size, not a caption. The inversion has to read as *the effect*; at ~20px it reads as a stray label. The `vw` middle term is what keeps it working from 320px to 2560px.
  - `.wordmark-word { text-transform:uppercase; letter-spacing:.06em; margin-inline-end:-.06em }` (the negative margin cancels the trailing letter-space so the unit is optically centered). `.wordmark-amp` carries the accent color.
  - `.wordmark-layer--invert .wordmark-amp, .wordmark-layer--accent .wordmark-word { visibility: hidden }` — hidden, not removed: the boxes must stay so both layers keep identical geometry.
- **`section.hero`**: `width:100vw; height:100vh` (full opening viewport).
- **`.clients`**: `width:100%; padding:8rem 2rem 10rem; background:#f2f2f2; overflow:hidden;` — a light ground is required, otherwise `difference` has nothing to invert against. The `overflow:hidden` catches rows at full spread.
- **`.row`**: `width:100%; display:flex; justify-content:center; gap:16px` (10px below 768px) — this resting `gap` is what the JS animates, and it has to match the JS `minGap()` exactly or the first row to reach the band jumps before it starts spreading.
- **`.logo`**: two equal halves — `flex: 1 1 0; min-width: 0;`, the first `justify-content: flex-end`, the second `flex-start`. `justify-content:center` on the row centers the **pair**, not the hole between them, so a wide name paired with a narrow one drags the hole off-center by `(w1 - w2) / 2` and the wordmark ends up touching one name while floating away from the other. Equal halves put the hole's center on the row's center at every gap. `min-width: 0` is what keeps them equal once the gap grows past the names — without it they refuse to shrink below their content and the symmetry breaks exactly when it matters. `.logo p { font-size:1.25rem; white-space:nowrap }`; measure the `<p>`, never the box.
- **`section.trigger-footer`**: `width:100%; height:300vh; background:#000;` — deliberately 3× viewport tall so the closing animations have a long scrub runway.
- Mobile (`@media (max-width:768px)`): tracking, the resting row gap (10px) and `.logo p { font-size: .8rem }`. The names are deliberately smaller than the desktop credit roll: the narrower they are, the wider the hole they can open, and that hole is what caps how big the wordmark is allowed to be down here (`holeCap()` below). The wordmark's own `clamp()` adapts by itself, so there is no second type scale to keep in sync.

Color palette: light paper `#f2f2f2` (client index), near-black `#16161a` (hero + footer ground), pure white `#fff` for the wordmark — pure, because `difference` is only as strong as the distance between the type color and the ground, and white-over-near-white inverts to nothing. One warm accent (`#ff4e45`) for the ampersand and two short caption lines, used on the dark ground only. The imagery supplies the rest.

## GSAP effect (exhaustive)

All animations are **ScrollTrigger `scrub: true`** triggers that **do not** use `gsap.to`/timelines — each one manually mutates inline styles inside its `onUpdate(self)` using `self.progress` (0→1) and linear interpolation `value = start + (end - start) * progress`. There are **four families of triggers**.

**Measure the wordmark once, then drive everything off that measurement** — no magic pixel offsets, because they only hold at one viewport size:

```js
let baseSize = 0;    // px, the resting type size, after both caps
let widthPerEm = 0;  // the wordmark's width expressed in em

function measure() {
  root.style.removeProperty("--wordmark-size");           // read the CSS clamp back
  const declared = parseFloat(getComputedStyle(gauge).fontSize);
  widthPerEm = gauge.offsetWidth / declared;              // every metric is in em, so this ratio holds
  baseSize = Math.min(declared, fitSize(), holeCap());
  // Only override the clamp when it asks for more than the viewport or the
  // rows can hold; leaving the property unset keeps the type responsive to
  // the root font-size a size control may be driving.
  if (baseSize < declared) root.style.setProperty("--wordmark-size", `${baseSize}px`);
}

// room a row can open between its two names — measured on the <p>, never on
// the .logo box, because the boxes are flexible halves and would report
// their own share of the gap straight back into this number
const rowHole = (row) => {
  const names = row.querySelectorAll(".logo p");
  return row.clientWidth - names[0].offsetWidth - names[1].offsetWidth - 16;
};

const fitSize    = () => (window.innerWidth * 0.92) / widthPerEm;  // largest size that fits the viewport
const bandCenter = () => window.innerHeight / 2;                   // the resting center line
const bandRadius = () => baseSize * 1.1 + 40;                      // how far out a row starts to part
const minGap     = () => (window.innerWidth <= 768 ? 10 : 16);     // px, mirrors the CSS resting gap

// largest size the narrowest row can still let through, allowing one em of
// deliberate overlap per side
const holeCap = () => {
  const hole = rows.reduce((min, row) => Math.min(min, rowHole(row)), Infinity);
  const nameSize = parseFloat(getComputedStyle(rows[0].querySelector("p")).fontSize);
  return Math.max(hole / Math.max(1, widthPerEm - 2), nameSize * 1.6);
};
```

Call `measure()` once and re-run it on `ScrollTrigger.addEventListener("refreshInit", measure)`. Because every horizontal metric (`gap`, `letter-spacing`) is in `em`, width scales linearly with font-size, so one ratio covers every size and every viewport. All `start`/`end` values are written as **functions** with `invalidateOnRefresh: true` so they recompute on resize.

Three things invalidate that measurement and none of them is a scroll or a window resize, so each needs its own hook:
- **The webfont.** Measured under `DOMContentLoaded`, `widthPerEm` may come from the fallback face and then poisons `fitSize()`, `holeCap()` and `bandRadius()` alike. `document.fonts.ready.then(() => ScrollTrigger.refresh())`. ScrollTrigger's own `load` refresh usually covers this, but only by accident.
- **A type-size control**, if the component exposes one: it moves the root font-size the `clamp()` hangs off. A `ResizeObserver` on the wordmark catches it. Guard it twice — skip while the closing title card is deliberately resizing the wordmark, and skip when the width already matches what the last `measure()` produced — or the observer refreshes on its own output.
- **`holeCap()` reads the rows**, so it must run after they have their real widths.

**On the overlap `holeCap()` allows.** On a phone the two names cannot part far enough to clear a display-sized wordmark: full clearance at ~390px would mean roughly 20px type, the caption size this component exists to escape. So the overlap is bounded, not eliminated — the names slide under the outer letters and invert there, which *is* the effect, not a collision. The floor (`1.6x` the client names) keeps the wordmark dominant on the narrowest screens.

Row triggers are timed against `bandCenter()` — the **resting** center line. That is only sound because the wordmark cannot leave that line until the index is out of the way; see trigger #3.

### 1. Row gap — SPREAD APART (one trigger per `.row`)
For every `.row`:
- `trigger: row`, `scrub: true`, `invalidateOnRefresh: true`
- `start: () => \`center ${bandCenter() + bandRadius()}px\`` (the row's own center is still below the band)
- `end:   () => \`center ${bandCenter()}px\`` (the row's center sits on the band)
- `maxGap()` per row: `Math.max(minGap(), Math.min(wordmarkWidth + baseSize * 0.6, rowHole(row)))` — open just wide enough to let the wordmark through, but never wider than the row can hold, or the names get pushed off-screen.
- `onUpdate`: `gap = minGap() + (maxGap() - minGap()) * progress`, written in **px** (`em` would drift with the root font-size the size control can change).

### 2. Row gap — SNAP BACK TOGETHER (one trigger per `.row`)
Same trigger, mirrored: `start: () => \`center ${bandCenter()}px\``, `end: () => \`center ${bandCenter() - bandRadius()}px\``, and `gap = maxGap() - (maxGap() - minGap()) * progress`.

**Combined behavior of #1 + #2:** each row opens as it rises into the wordmark's band and closes as it leaves — the title splits the two names apart while it passes through them. Because `bandRadius()` is tied to the type size, desktop and mobile open on the same beat instead of on two hand-tuned pixel windows. During the ramps the names *do* overlap the wordmark, which is the moment the inversion is most visible; the fully-open state is what keeps them legible.

### 3. Footer — wordmark DRIFTS DOWN (single trigger)
- `trigger`: **the last `.row`** — `endTrigger: trigger-footer`, `scrub: true`, `invalidateOnRefresh: true`
- `start: () => \`bottom ${bandCenter() - bandRadius()}px\`` — **not** `"top bottom"` on the footer.
  - **The trap.** "The footer's top edge has entered the viewport" sounds like the end of the index, but it is not: the last two rows plus the section's bottom padding are still above it and still have to cross the band. Because the rows are timed against the *resting* center line, they open where the wordmark no longer is, and you get a fully-parted row with the wordmark sitting a whole row below it. The drift is only ~40px, which is half a wordmark on desktop and a whole one on a phone — so it looks fine in the desktop capture and broken in the mobile one, and it is easy to misfile as a mobile-only bug. Trigger the descent off the **last row's bottom edge clearing the far end of the band** instead: that is the same guarantee stated structurally, and it survives a change to the section padding, the viewport height or the type size. (Delaying the start to `"top center"` on the footer also works today, but only because the current padding happens to be larger than `bandRadius()`.)
- `end: () => \`top+=${footerTrigger.offsetHeight - window.innerHeight} center\`` (measured on the `endTrigger`)
- `onUpdate`: set `--bar-y` on the root to `50 + (endY() - 50) * progress` percent, where
  `endY() = Math.min(88, 100 - ((fitSize() * 0.62 + 24) / window.innerHeight) * 100)`.
- The end position is **computed, not a hard-coded 92%**: the grown wordmark is over a hundred pixels tall, so a fixed percentage clips its descender on short viewports.

### 4. Footer — wordmark GROWS INTO A TITLE CARD (single trigger)
- `trigger: trigger-footer`, `scrub: true`, `invalidateOnRefresh: true`
- `start: () => \`top+=${footerTrigger.offsetHeight - (window.innerHeight + 100)} bottom\``
- `end: "bottom bottom"` (footer bottom reaches viewport bottom)
- `onUpdate`: `--wordmark-size = baseSize + (fitSize() - baseSize) * progress` px.
- Net: the name grows until it nearly spans the screen — whatever the screen is — still inverted against the dark footer, so it reads bright. Driving one CSS custom property on the root (rather than writing `font-size` on each `<p>`) is what keeps the two layers in lockstep for free.

**Timing/ordering:** #1 and #2 fire continuously and independently per row throughout the logo section (16 rows → 16 + 16 triggers). #3 and #4 only engage once the index has fully cleared the band. The two are interlocked: #1/#2 assume the wordmark is at rest, #3 is what guarantees it. Verify the pair in one frame — a fully-open row and the wordmark centered in its hole, at the same height — because each defect here masks the other. A row that opens too narrow is invisible if the wordmark has already drifted away from it. Everything is scrub-linked to scroll position — there is no autoplay, no `duration`, no `ease`, no `stagger`, no `delay`; the "ease" is the linear `progress` interpolation and the browser's scroll.

## Assets / images

Two full-bleed editorial photographs, each meant to fill the viewport (~16:9 landscape / full-screen crop, `object-fit: cover`):
1. **Hero** — full-screen opening image at the top of the page.
2. **Footer** — closing image inside the tall black footer trigger section.
Use neutral, high-contrast editorial photography (fashion/architectural mood works well since the title inverts over it). No brand marks. If only one image is available, reuse it for both slots.

## Behavior notes

- Desktop and mobile share one set of numbers: the type size comes from a `clamp()` capped by the row hole, and the spread window and the spread distance are both derived from it. The only breakpoint branches left are the resting gap (10px vs 16px), the tracking and the client-name size. `mobileSafe`, and no horizontal scroll at any width — the fixed layers are `overflow: hidden` and the JS caps the type at 92% of the viewport width.
- Light performance cost: no WebGL/canvas/physics; only inline-style writes on scroll. The blended layer covers the viewport, so the browser composites the visible area each frame — cheap here because nothing else animates.
- The effect depends on three things at once, and it disappears if any one of them is missing: (a) the client list must physically travel *through* the wordmark's band — if it stops short or runs in another lane, the inversion never happens; (b) the ground behind must actually contrast (white type over a near-white section inverts to nothing perceptible); (c) no stacking context between the blended element and the root.
- The effect also depends on the footer being **300vh** and the logo section being long (16 rows) — keep those proportions so the scrub windows have room.
- `overscroll-behavior: none` on `html, body` prevents scroll chaining/bounce.
- Wrap all setup in `DOMContentLoaded` and register `ScrollTrigger` before creating triggers so the measurements are valid.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/bennett-clive-scroll-animation/footer.jpg
https://motionprompts.dev/c/bennett-clive-scroll-animation/hero.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--black`, `--paper`, `--ink`, `--ink-soft`, `--hairline`, `--rule-strong`, `--gold-dark-ground`, `--gold-light-ground`, `--white`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, the sticky bar sits at center, the rows look fine, and then it misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two `ScrollTrigger` instances on every one of the sixteen rows (the spread trigger and the collapse trigger, each doubled), plus a second pair riding the footer. Both copies write to the same `row.style.gap`, the same `stickyBar.style.top`, the same `p.style.fontSize` on every scrub tick, so the visible symptom is the gap or the bar position jittering between two slightly different values rather than interpolating smoothly. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no row spread, no bar drift, no type scale-up, nothing to debug. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its body — everything from `gsap.registerPlugin` down through the four `ScrollTrigger.create` families — directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — `.sticky-bar`, `.trigger-footer`, and the sixteen `.row` elements are all found with unscoped `document.querySelector` / `document.querySelectorAll`, which assumes this component owns the document. Give the component a root `ref` standing in for `.container`, render it on the outermost element, and resolve every one of these off that ref instead of off `document`. The `.wordmark` gauge is resolved off `stickyBar`, so it stays correctly scoped for free once `stickyBar` itself was found under the root ref — it is a live reference to the already-scoped node, not a fresh document-wide query. The two footer triggers, though, write `--bar-y` and `--wordmark-size` onto `document.documentElement`: that is genuinely global state, so on unmount you must remove both properties or a second instance inherits the first one's closing title card. During the StrictMode remount two copies of the subtree exist for an instant; an unscoped selector binds to whichever copy is on its way out, and `footerTrigger.offsetHeight` — read once, synchronously, right after the lookup, and then closed over by both footer triggers' `start`/`end` functions for the life of the component — would freeze in a height measured off a node about to be unmounted.

*(3) Cleanup* — Wrap the four trigger families this effect creates in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the effect exactly as described above: the row-gap spread and
       collapse triggers for all sixteen rows, plus the footer's
       bar-drift and type-scale triggers */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`gsap.context` records every `ScrollTrigger` this component creates — the two per-row triggers on all sixteen rows (spread and collapse) plus the footer's drift and scale-up triggers, thirty-four instances in total — so one `ctx.revert()` call kills all of them and undoes the inline `gap`, `top`, and `font-size` values their `onUpdate` handlers wrote, in one step. Without the revert, the StrictMode remount leaves a second full set of triggers bound to the same rows and the same footer, and both sets stay subscribed to scroll, each pushing its own value into the same style property on every scrub tick. Register `ScrollTrigger` (`gsap.registerPlugin(ScrollTrigger)`) at module scope, not inside the effect — registering it again on every mount is harmless but pointless.
