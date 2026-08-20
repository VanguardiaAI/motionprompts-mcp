---
slug: audemarspiguet-menu
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 1
structural_literals: 10
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "0.75", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Fullscreen Overlay Menu — Rotating Background Doors + Masked Line Reveal

## Goal
Build a fixed top navbar with a circular hamburger toggle that opens a **fullscreen overlay menu**. The signature effect: two full-height background halves, each pre-rotated 180° and scaled ×2 around their inner edge, **rotate back to 0° so they sweep in like two closing blades/doors** on a custom cubic-bezier ease, while the hamburger bars **morph into an X** at the same time; then two columns of menu links plus a footer **reveal line-by-line from a mask with a staggered `power3.out` slide-up**. It is a single **paused GSAP timeline**: clicking the toggle `.play()`s it to open, clicking again `.reverse()`s the exact same timeline to close.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`SplitText`** and **`CustomEase`**. No smooth-scroll library, no ScrollTrigger — the whole thing is click-driven. Import as:
```js
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(SplitText, CustomEase);
```

## Layout / HTML
```
nav                                  (fixed top bar, 3 equal flex columns)
  .nav-toggle
    .nav-toggle-btn                  (circular 60×60 hamburger button — click target)
      span.bar-1
      span.bar-2
  .nav-logo   > a  "Carbon Structure"     (centered wordmark)
  .nav-cta    > a  "Start Journey"        (right pill button)

.menu                                (fixed fullscreen overlay, pointer-events:none until open)
  .menu-bg
    .menu-bg-left  > .menu-bg-left-inner       (left half, its inner is the animated blade)
    .menu-bg-right > .menu-bg-right-inner       (right half, its inner is the animated blade)
  .menu-items                        (flex row)
    .menu-items-col   (col 1)  → 5 × .menu-link > a   (uppercase sans links)
    .menu-items-col   (col 2)  → 5 × .menu-link > a   (serif links)
    .menu-footer                     (absolute bottom bar, space-between)
      .menu-footer-col  → 4 × a  (legal links)
      .menu-footer-col  → p "© 2025 Carbon Structure"

section.hero > h1  "Dense Geometry"  (fullscreen background image sits behind the menu)
```
Use neutral, fictional menu labels — no real brand names. Col 1 links (uppercase): **Manifesto, Spatial Journeys, Material Archive, Visit Atelier, Rituals**. Col 2 links (serif): **Tactile Vault, Form Experiments, Carbon Network, Shadow Library, Collections**. Footer legal links: **Usage Terms, Data & Cookies, Privacy Policy, Accessibility**. Wordmark and hero heading are neutral placeholders.

## Styling
Fonts (Google Fonts): **Instrument Sans** (body/UI, variable 400–700, has italics) and **Instrument Serif** (display/serif accent). `body { font-family: "Instrument Sans"; }`.

Color tokens:
- `--base-100: #fff` (all text is white)
- `--base-200: #474437` (left background blade — muted olive/brown)
- `--base-300: #403d31` (right background blade — slightly darker olive)

Global: `* { margin:0; padding:0; box-sizing:border-box; }`. `a, p { text-decoration:none; color:var(--base-100); font-weight:450; line-height:1; }`.

Type:
- `.hero h1`: Instrument **Serif**, `font-size: clamp(3rem, 10vw, 12rem)`, weight 500, `line-height: 0.75`, `width: 50%`, centered, color white.
- `.menu-items-col:nth-child(1) a`: uppercase (Instrument Sans), `font-size: clamp(1.5rem, 2.5vw, 4rem)`, `line-height: 1.1`.
- `.menu-items-col:nth-child(2) a`: Instrument **Serif**, `font-size: clamp(1.65rem, 2.75vw, 3rem)`, `line-height: 1.2`.
- `.menu-footer a, .menu-footer p`: uppercase, `font-size: 0.75rem`.
- `nav .nav-logo a`: `width: 8rem`, centered, uppercase, `font-size: 0.9rem`, weight 500.
- `nav .nav-cta a`: Instrument Serif, `padding: 0.75rem 1.25rem`, `border: 1px solid rgba(255,255,255,0.15)`, `border-radius: 5rem` (pill).

Structural / load-bearing CSS:
- `.hero`: `position: relative; width: 100%; height: 100svh;` fullscreen background image `no-repeat 50% 50% / cover`, flex-centered, `overflow: hidden`.
- `nav`: `position: fixed; width: 100%; padding: 2rem;` flex, `align-items: center`, `z-index: 2`. `nav > div { flex: 1; }`. `.nav-logo` centers its child; `.nav-cta` right-aligns its child.
- `.nav-toggle-btn`: `width: 60px; height: 60px; padding: 20px;` flex column, `justify-content: center; gap: 5px;` `border: 1px solid rgba(255,255,255,0.15); border-radius: 10rem;` `cursor: pointer` (a circular ring). Each `span` (`.bar-1`, `.bar-2`): `width: 100%; height: 1.25px; background: var(--base-100); will-change: transform;` (two thin white bars ~5px apart inside a 20px-wide content box).
- `.menu`: `position: fixed; inset: 0; width: 100%; height: 100svh; pointer-events: none; overflow: hidden; z-index: 1;`. `.menu.active { pointer-events: all; }` (JS toggles `active`).
- `.menu-bg`: `position: absolute; inset: 0; width:100%; height:100%; pointer-events:none;`.
- `.menu-bg-left`, `.menu-bg-right`: `position: absolute; width: 50%; height: 100%; overflow: hidden;` — left docked `left:0`, right docked `right:0`. **The `overflow:hidden` is what clips the oversized rotating inner blade.**
- `.menu-bg-left-inner`, `.menu-bg-right-inner`: `position: absolute; width: 100%; height: 100%; will-change: transform;`.
  - `.menu-bg-left-inner`: `background-color: var(--base-200); transform-origin: 100% 50%; transform: rotate(180deg) scale(2, 2);`
  - `.menu-bg-right-inner`: `background-color: var(--base-300); transform-origin: 0% 50%; transform: rotate(-180deg) scale(2, 2);`
  - i.e. each half's inner panel is doubled in size and flipped 180° about the **inner (center-facing) edge**, so at rest it is swung out of frame; animating rotation to 0 swings it back to cover the half.
- `.menu-items`: `position: absolute; inset: 0; width:100%; height:100%;` flex row. `.menu-items-col`: `flex: 1;` flex column, `justify-content: center; align-items: center; gap: 2rem;`.
- `.menu-footer`: `position: absolute; bottom: 0; left: 0; width: 100%; padding: 2rem;` flex `space-between`, `align-items: flex-end`. `.menu-footer-col { display:flex; gap:2rem; }`.
- **Masked-line initial state** (set in CSS, matched by SplitText output): `.menu a .line, .menu p .line { position: relative; transform: translateY(110%); will-change: transform; }` — every split line starts pushed down 110%, hidden behind its line-mask.

## GSAP effect (exhaustive)

### 0. CustomEase
Register one custom ease before building the timeline:
```js
CustomEase.create("hop", "0.85, 0, 0.15, 1");
```
This `"hop"` ease (a symmetric slow-in/slow-out, ~`cubic-bezier(0.85, 0, 0.15, 1)`) drives the background blades and the hamburger morph.

### 1. SplitText — split every menu text into masked lines
Run once at init, before the timeline:
```js
SplitText.create(".menu a, .menu p", {
  type: "lines",
  mask: "lines",
  linesClass: "line",
});
```
- Selector targets **all anchors and the copyright `<p>`** inside `.menu` (both link columns + all footer text).
- `type: "lines"` splits into line elements; `mask: "lines"` wraps each line in an overflow-hidden mask so the line can be hidden below it; `linesClass: "line"` gives each line the `.line` class that the CSS pre-offsets to `translateY(110%)`.

### 2. The single paused timeline
```js
const tl = gsap.timeline({ paused: true });
```
Add these tweens (positions noted — this is the exact order and timing):

**At absolute time `0` (all four fire together, `ease: "{{motion.ease.primary}}"`, `duration: 1`):**
1. `.nav-toggle-btn .bar-1` → `{ y: 3.25, rotation: 45, scaleX: 0.75 }` — top bar drops 3.25px, rotates +45°, shrinks to 75% width.
2. `.nav-toggle-btn .bar-2` → `{ y: -3.25, rotation: -45, scaleX: 0.75 }` — bottom bar rises 3.25px, rotates −45°, shrinks to 75%. Together the two bars form an **X**.
3. `.menu .menu-bg-left-inner` → `{ rotate: 0 }` — swings the left blade from 180° back to 0° (sweeping in from the center edge to cover the left half).
4. `.menu .menu-bg-right-inner` → `{ rotate: 0 }` — swings the right blade from −180° back to 0° (covering the right half).

**At absolute time `0.6` (position param passed as the string `"0.6"`):**
5. `.menu-items-col:nth-child(1) .line` → `{ y: 0 }`, `duration: 0.75`, `ease: "power3.out"`, `stagger: 0.1` — column-1 link lines rise from `translateY(110%)` up into view, one after another 0.1s apart.

**At the same start as the previous tween (position `"<"`, i.e. also 0.6):**
6. `.menu-items-col:nth-child(2) .line` → `{ y: 0 }`, `duration: 0.75`, `ease: "power3.out"`, `stagger: 0.1`.
7. `.menu-footer .line` → `{ y: 0 }`, `duration: 0.75`, `ease: "power3.out"`, `stagger: 0.1`.

So the two background blades + hamburger X animate over 0→1s on the `"hop"` ease, and starting at 0.6s the two link columns and the footer all reveal their lines simultaneously (each column staggered internally 0.1s) with `power3.out`. Total timeline ≈ 1.35s.

### 3. Toggle wiring
```js
const menu = document.querySelector(".menu");
const menuToggle = document.querySelector(".nav-toggle-btn");
let isMenuOpen = false;

menuToggle.addEventListener("click", () => {
  if (isMenuOpen) {
    tl.reverse();
    menu.classList.remove("active");
  } else {
    tl.play();
    menu.classList.add("active");
  }
  isMenuOpen = !isMenuOpen;
});
```
- Open: `tl.play()` runs the timeline forward and `.menu` gets `active` (enables pointer events).
- Close: `tl.reverse()` plays the **same** timeline backwards — lines drop back into their masks, blades swing back out to ±180°, the X un-morphs into a hamburger — and `active` is removed.
- No re-entrancy guard; GSAP handles mid-flight reversal naturally.

## Assets / images
**1 image**, role = *fullscreen hero background* sitting behind the whole menu. Square (1:1) source. Subject: a single centered abstract 3D render of a soft, organically-twisted torus/ring (a doughnut-shaped loop with gentle wavy, molten undulations) resting on a flat surface, lit from above. Colors are a cool, near-monochrome palette — a brushed/satin **silver-metallic** ring in soft light and mid grays against a plain **medium-gray** studio background, with subtle darker shadow beneath. Clean, minimal, low-contrast and neutral, so the white nav/menu text and the olive blade overlay read clearly on top of it. Displayed `background-size: cover` at `50% 50%`.

## Behavior notes
- **Responsive (`max-width: 1000px`):** `nav` becomes `flex-direction: row-reverse; justify-content: space-between;` (toggle right, wordmark left); `.nav-cta` is hidden. The **right background half is hidden** and `.menu-bg-left` grows to `width: 100%` (single blade fills the screen). `.menu-items` becomes `padding: 6rem 2rem; flex-direction: column-reverse; gap: 4rem;`, columns switch to `align-items: flex-start; gap: 0.5rem`, and the footer columns stack (`flex-direction: column; gap: 0`).
- Menu overlay is `pointer-events: none` until opened (`.active`), so it never blocks the hero when closed.
- All motion is click-driven off one paused, reversible timeline — no scroll, no autoplay, no loops.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/audemarspiguet-menu/hero.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--rhodium`, `--nuit`, `--door-left`, `--door-right`, `--muted`, `--brass`, `--ruby`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, at the moment the module is evaluated, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the toggle looks right on the first click and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Run this component's setup twice against the same DOM and you get two `click` listeners stacked on the same `.nav-toggle-btn`, each closed over its own `isMenuOpen` and its own paused `tl`; one click now fires both, so two timelines write into the same four inline-transform targets (`.bar-1`, `.bar-2`, both `.menu-bg-*-inner` panels) on the same frame, and `.menu`'s `active` class gets added and removed by two flags free to drift out of sync after a couple of clicks — one convinced the menu is open, the other convinced it's closed. Layered on top of that, a second, unreverted `SplitText.create` pass wraps a fresh `.line` around text that already has one, so the three staggered reveal tweens end up targeting whichever nesting depth their selector happens to match, not necessarily the depth the CSS mask actually clips. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — Nothing in this script waits for anything: `gsap.registerPlugin(SplitText, CustomEase)`, `CustomEase.create("hop", …)`, the `document.querySelector` calls for `.menu` and `.nav-toggle-btn`, the `SplitText.create` pass, the `tl` timeline with its seven tweens, and the `click` listener on `menuToggle` all run at module-evaluation time. In a React app that moment is import time — before this component has rendered anything — so `document.querySelector(".nav-toggle-btn")` resolves to `null` and `menuToggle.addEventListener(...)` throws immediately. That's a harder failure than a missed `DOMContentLoaded`: a crash at import, not a silent no-op. Move everything from the `SplitText.create` call through the `click` listener into a `useEffect` with an empty dependency array. `gsap.registerPlugin` and `CustomEase.create("hop", …)` are the two exceptions — neither touches the DOM, and both stay at module scope; recreating the `"hop"` ease on every mount is harmless but pointless.

*(2) Element lookups* — `menu` and `menuToggle` are two separate `document.querySelector` calls, and `SplitText.create` runs its own selector (`.menu a, .menu p`) that a `gsap.context` scope does not reach — context scoping only rewrites selector strings passed as tween or timeline targets, not the query `SplitText` runs internally. Give the component a root ref on the wrapper around `nav` and `.menu`, resolve `menu` and `menuToggle` from it, and hand `SplitText.create` an actual node list — `rootRef.current.querySelectorAll(".menu a, .menu p")` — instead of the bare selector string. The seven tween targets (`.nav-logo`, `.nav-toggle-btn .bar-1`/`.bar-2`, `.menu-bg-left-inner`/`.menu-bg-right-inner`, both `.menu-items-col … .line` groups, `.menu-footer .line`) can stay as plain strings, since those do get scoped once the context's second argument is the root ref. The distinction matters here specifically: during the StrictMode remount two copies of `.nav-toggle-btn` exist for an instant, and an unscoped `SplitText.create` selector has no way to tell which copy's anchors belong to the subtree that's staying.

*(3) Cleanup* — Wrap the split and the timeline construction in one `gsap.context` scoped to the root ref, keep the split instance and a named click handler, and unwind both explicitly:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const split = SplitText.create(
      rootRef.current.querySelectorAll(".menu a, .menu p"),
      { type: "lines", mask: "lines", linesClass: "line" }
    );
    const tl = gsap.timeline({ paused: true });
    // the seven tweens exactly as built above, addressed off `tl`
    return () => split.revert();
  }, rootRef);

  let isMenuOpen = false;
  const handleToggle = () => {
    /* the branch above: tl.play()/tl.reverse() and the .active class toggle */
  };
  const toggleBtn = rootRef.current.querySelector(".nav-toggle-btn");
  toggleBtn.addEventListener("click", handleToggle);

  return () => {
    toggleBtn.removeEventListener("click", handleToggle);
    ctx.revert();
  };
}, []);
```

`ctx.revert()` kills `tl` and every inline transform it wrote onto the bars, the two background panels and the split lines, and — because the factory function returns `split.revert()` — reverts the split as part of that same call, after the tweens referencing those lines are already gone. Two things the context does not reach on its own: the `click` listener, because it isn't a GSAP object — the original script hands `addEventListener` an inline arrow with nothing to pass to `removeEventListener` later, so give the handler a name when you port it and remove it in the same cleanup; and `isMenuOpen` itself, which should stay a plain variable local to the effect rather than become `useState` — it never drives a render, `.active` and the timeline already own everything visible, and a fresh `isMenuOpen` reset on every effect run is exactly the behavior you want on remount.

One risk the current script doesn't carry but a port should close: `.menu a, .menu p` spans both link columns, and the two use different faces — column one is Instrument Sans (uppercase), column two Instrument Serif — plus the Instrument Sans footer copy. `mask: "lines"` measures line boxes against whichever face is active the instant `SplitText.create` runs; if either one is still loading, the lines get masked against the fallback face's metrics, and the break points — so what each staggered tween actually reveals — shift once the real font swaps in. If your app's font-loading setup doesn't already guarantee both faces are in before this mounts, gate the split behind `document.fonts.ready`: keep the effect itself synchronous, start the split from inside a `.then()`, and check the same cancellation flag the cleanup sets before touching `rootRef` there, since that promise can resolve after a StrictMode unmount has already reverted the context it would otherwise add to.
