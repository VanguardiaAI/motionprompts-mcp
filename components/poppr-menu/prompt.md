# Fullscreen Overlay Menu — Gooey SVG-Path Liquid Curtain + Elastic SplitText Links

## Goal
Build a fixed navbar with a **Menu / Close** text toggle in the top-right corner that opens a **fullscreen overlay menu**. The signature effect: clicking the toggle drops a **gooey liquid "curtain"** down over the whole viewport by morphing a single SVG `<path>`'s `d` attribute through a quadratic-Bézier belly (it sags down like dripping paint before flattening to fill the screen), and as it lands the nav-link characters **snap in one-by-one from far off the right edge with a springy `elastic.out` ease** while the contact-info lines stagger up from below. Clicking **Close** reverses the whole thing: content fades, and the curtain retreats back up through an upward Bézier belly until it vanishes off the top. Entirely click-driven — no scroll, no autoplay.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the single GSAP plugin **`SplitText`**. No ScrollTrigger, no smooth-scroll library. Import as:
```js
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
gsap.registerPlugin(SplitText);
```
Wrap all code in a `DOMContentLoaded` listener.

## Layout / HTML
```
.nav                                 (fixed fullscreen layer, pointer-events:none, z-index 10)
  .nav-logo > a > img                (top-left wordmark, visible over the hero)

  .nav-toggle                        (top-right click target — holds both toggle words stacked)
    p.nav-toggle-menu   "Menu"       (white, shown when closed)
    p.nav-toggle-close  "Close"      (dark, absolutely positioned over "Menu", opacity 0)

  .menu                              (absolute fullscreen overlay, pointer-events:none until open)
    svg.menu-bg-svg                  (the animated liquid curtain — see below)
      path#menu-path
    .menu-logo > a > img             (top-left wordmark revealed inside the open menu, opacity 0)
    .menu-col.menu-col-info          (left column — contact block)
      p   "Get in touch"             (small pink uppercase label)
      h3  "studio@orbit.co"
      h3  "+1 (437) 982 4412"
      br
      h6  "42 Mercer Street"
      h6  "Toronto, ON M5V"
    .menu-col.menu-col-links         (right column — 6 big nav links)
      a "work"  a "services"  a "about"  a "insights"  a "careers"  a "contact"

section.hero                          (fullscreen background image behind everything)
```
The `svg.menu-bg-svg` MUST have `viewBox="0 0 1131 861"` and `preserveAspectRatio="none"` (so the path stretches to any viewport size). Its `#menu-path` starts with `fill="#f0eeee"` and an initial `d="M1131,0 Q565.5,0 0,0 L0,0 L1131,0 Z"` (a flat, zero-height line collapsed at the very top).

Use neutral, fictional copy — **no real brand names**. Nav-link labels (lowercase): **work, services, about, insights, careers, contact**.

## Styling
Fonts (Google Fonts): **Boldonse** (the big display font for the nav links only) and **Google Sans Flex** (variable, everything else — body/UI/contact info). `body { font-family: "Google Sans Flex", sans-serif; }`.

Color tokens:
- `--base-100: #f0eeee` (curtain fill + white nav text/logo over the hero — near-white)
- `--base-200: #ff74ee` (hot-pink accent — the "Get in touch" label only)
- `--base-300: #222225` (near-black — all menu text once the curtain is down)

Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `img { width:100%; height:100%; object-fit:cover; }`.

Type:
- `p`: `text-transform: uppercase; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.25rem;` (Google Sans Flex).
- `h3`: Google Sans Flex, weight 450, `font-size: clamp(1.5rem, 3vw, 3rem)`, `line-height: 1.35`, `letter-spacing: -2%`.
- `h6`: same family/weight, `font-size: clamp(1rem, 1.25vw, 1.5rem)`.
- `.menu-col a`: **Boldonse**, `font-size: clamp(2.5rem, 5vw, 5rem)`, `line-height: 1.35`, `text-decoration:none`, `color: var(--base-300)`, `display: block`, `width: max-content`, **`overflow: visible`** (critical — lets the split characters sit far off-screen to the right before they slide in).
- `.menu-col p`: `color: var(--base-200)` (pink), `margin-bottom: 1rem`.

Structural / load-bearing CSS:
- `.hero`: `position: relative; width: 100%; height: 100svh;` fullscreen background image `no-repeat 50% 50% / cover`.
- `.nav`: `position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;`.
- `.nav-logo`, `.menu-logo`: `position: absolute; top: 2rem; left: 2rem; width: 6rem; padding: 0.5rem;`.
- `.nav-toggle`: `position: absolute; top: 2rem; right: 2rem; padding: 0.5rem; color: var(--base-100); cursor: pointer; pointer-events: all; z-index: 100;` (`.nav-logo` and `.nav-toggle` re-enable `pointer-events: all`).
- `.nav-toggle-menu`: `color: var(--base-100);` (white "Menu").
- `.nav-toggle-close`: `position: absolute; top: 0.5rem; right: 0.5rem; color: var(--base-300); opacity: 0;` (dark "Close" stacked exactly over "Menu").
- `.menu`: `position: absolute; top: 0; left: 0; width: 100%; height: 100svh; padding: 2.5rem; display: flex; gap: 2rem; color: var(--base-300); pointer-events: none; z-index: 10;`. `.menu.is-open { pointer-events: all; }` (JS toggles `is-open`).
- `.menu-bg-svg`: `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;` (sits behind the menu columns; only the path shows).
- `.menu-logo`: `opacity: 0;` (revealed by JS).
- `.menu-col`: `flex: 1; display: flex; flex-direction: column; justify-content: flex-end;` (both columns bottom-align their content).
- `will-change: transform, opacity;` on `.menu a .char, .menu-col h3, .menu-col h6, .menu-col p`.

## GSAP effect (exhaustive)

### 0. Read the SVG geometry & define the six path states
Read the dimensions off the viewBox so the path math is resolution-independent:
```js
const svgWidth   = menuBgSvg.viewBox.baseVal.width;   // 1131
const svgHeight  = menuBgSvg.viewBox.baseVal.height;  // 861
const svgCenterX = svgWidth / 2;                       // 565.5
```
Every state is one filled quad: a **top edge that is a quadratic Bézier curve** (`M rightX,y Q centerX,ctrlY leftX,y`) closed down to two anchored corners. The `ctrlY` control point is what creates the gooey belly (below the endpoints = sag down, above = pull up). Define all six as template strings:
```js
const svgPathStates = {
  // top-anchored, zero height — curtain hidden above the top edge (rest state)
  OPEN_HIDDEN:  `M${svgWidth},0 Q${svgCenterX},0 0,0 L0,0 L${svgWidth},0 Z`,
  // curtain has dropped ~40%: edge at y=345, control sagging DOWN to y=620 (drip belly)
  OPEN_BULGE:   `M${svgWidth},345 Q${svgCenterX},620 0,345 L0,0 L${svgWidth},0 Z`,
  // flat bottom edge at y=861 — curtain fills the whole viewport
  OPEN_FULL:    `M${svgWidth},${svgHeight} Q${svgCenterX},${svgHeight} 0,${svgHeight} L0,0 L${svgWidth},0 Z`,
  // full-screen but now anchored at the BOTTOM (moving edge is the flat top at y=0)
  CLOSE_START:  `M${svgWidth},0 Q${svgCenterX},0 0,0 L0,${svgHeight} L${svgWidth},${svgHeight} Z`,
  // retreating up: top edge at y=350, control pulled UP to y=130 (belly rising)
  CLOSE_BULGE:  `M${svgWidth},350 Q${svgCenterX},130 0,350 L0,${svgHeight} L${svgWidth},${svgHeight} Z`,
  // bottom-anchored, zero height — curtain gone off the bottom
  CLOSE_HIDDEN: `M${svgWidth},${svgHeight} Q${svgCenterX},${svgHeight} 0,${svgHeight} L0,${svgHeight} L${svgWidth},${svgHeight} Z`,
};
gsap.set(menuBg, { attr: { d: svgPathStates.OPEN_HIDDEN } });
```
All path tweens animate `attr: { d: ... }` (GSAP interpolates the path string command-by-command; every state must have the **same number/order of commands** — M, Q, L, L, Z — so it morphs cleanly).

### 1. SplitText — chars of every nav link, parked far right
For each of the 6 `.menu-col-links a`, split into characters and hide them off-screen to the right:
```js
const splits = [];
menuLinks.forEach((link) => {
  const split = new SplitText(link, { type: "chars", charsClass: "char" });
  splits.push(split);
  gsap.set(split.chars, { opacity: 0, x: "750%" });   // 750% of each char's own width
});
```
Also collect the contact-info items (all direct children of `.menu-col-info` except the `<br>`) and park them below:
```js
const menuInfoItems = [...document.querySelectorAll(".menu-col-info > *:not(br)")]; // p, h3, h3, h6, h6
gsap.set(menuInfoItems, { opacity: 0, y: 100 });
```

### 2. State guards
`let isOpen = false; let isAnimating = false;`. The toggle handler bails if `isAnimating` is true, else sets it true, flips `isOpen`, and calls `openMenu()` or `closeMenu()`. Each timeline clears `isAnimating` on complete.

### 3. openMenu()
Add `is-open` to `.menu`. First, cross-fade the toggle words (independent tweens, `ease: "none"`):
- `navToggleMenu` → `{ opacity: 0, duration: 0.25 }` ("Menu" out).
- `navToggleClose` → `{ opacity: 1, duration: 0.25, delay: 0.25 }` ("Close" in, after the other fades).

Then a single timeline (`onComplete → isAnimating = false`) with this **exact order + timing**:

1. **Curtain drop, part 1** — `menuBg` → `{ attr:{ d: OPEN_BULGE }, duration: 0.5, ease: "power4.in" }`. The flat top line accelerates down into the sagging belly.
2. **Curtain drop, part 2** (chained, starts at t=0.5) — `menuBg` → `{ attr:{ d: OPEN_FULL }, duration: 0.5, ease: "power4.out" }`. The belly flattens out to fill the screen. (Curtain total ≈ 0→1s.)
3. **Menu logo** at position **`"-=0.75"`** (i.e. absolute t≈0.25) — `menuLogo` → `{ opacity: 1, duration: 0.1, ease: "none" }`.
4. **Contact info** at position **`"-=0.35"`** (i.e. absolute t≈0.65) — `menuInfoItems` → `{ opacity: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.075 }` (label, then each line, rise up from `y:100`).
5. **Nav-link chars slide in** at **absolute position `0.45`** — `menuLinksChars` (`splits.flatMap(s => s.chars)`) → `{ x: "0%", duration: 1.5, ease: "elastic.out(1, 0.25)", stagger: 0.01 }`. Every character springs from `x:750%` back to home with a bouncy overshoot, one after another 0.01s apart.
6. **Nav-link chars fade in** at **absolute position `0.45`** (same start, runs concurrently) — `menuLinksChars` → `{ opacity: 1, duration: 0.75, ease: "power2.out", stagger: 0.01 }`.

So: the pink label + email + phone + address stagger up while the six words' letters come flying in from the right and settle with a spring — all landing as the curtain reaches full screen.

### 4. closeMenu()
First `gsap.set(menuBg, { attr:{ d: CLOSE_START } })` — instantly re-anchor the (currently full) curtain to the bottom so its moving edge becomes the flat top. Cross-fade the toggle words back (`ease: "none"`):
- `navToggleClose` → `{ opacity: 0, duration: 0.3 }`.
- `navToggleMenu` → `{ opacity: 1, duration: 0.3, delay: 0.25 }`.

Then a timeline whose `onComplete` **fully resets state**: remove `is-open`, `gsap.set(menuBg, { attr:{ d: OPEN_HIDDEN } })`, re-hide every char (`opacity:0, x:"750%"`), restore each link `<a>` to `opacity:1`, re-park `menuInfoItems` (`opacity:0, y:100`), `isAnimating = false`.

Timeline tweens:
1. `menuLogo` → `{ opacity: 0, duration: 0.3 }`.
2. `menuLinks` (the `<a>` elements, not the chars) → `{ opacity: 0, duration: 0.3 }` at `"<"` (same time as #1).
3. `menuInfoItems` → `{ opacity: 0, duration: 0.3 }` at `"<"`.
4. **Curtain retreat, part 1** — `menuBg` → `{ attr:{ d: CLOSE_BULGE }, duration: 0.5, ease: "power3.in" }` at `"<"` (starts with the content fade). Top edge rises into an upward belly.
5. **Curtain retreat, part 2** (chained) — `menuBg` → `{ attr:{ d: CLOSE_HIDDEN }, duration: 0.5, ease: "power3.out" }`. Belly slides up and off the bottom edge until the curtain is gone.

Note the close curtain uses **power3** (in then out), a touch softer than the **power4** open; the belly geometry is inverted (control point above the edge instead of below).

### 5. Toggle wiring
```js
navToggle.addEventListener("click", () => {
  if (isAnimating) return;
  isAnimating = true;
  isOpen = !isOpen;
  isOpen ? openMenu() : closeMenu();
});
```

## Assets / images
- **1 fullscreen hero background** (`bg.jpg`), role = the page behind the closed menu. A close-up of swirling white marble — glossy, liquid-looking folds of near-white stone veined with soft grey and charcoal marbling that ripples in wavy diagonal bands. Overall very light/high-key (whites and pale greys dominant, thin darker grey veins), so the white logo and "Menu" toggle need a subtle shadow/contrast treatment to read against it. Landscape ~16:9, `background-size: cover`.
- **2 wordmark logos** (same file used twice), role = a simple **lowercase sans-serif wordmark on a transparent background** (SVG). One (`.nav-logo`) shows white over the dark hero when closed; one (`.menu-logo`) is revealed top-left once the light curtain is down. Displayed ~6rem wide, roughly 3:1 (wide) aspect.

## Behavior notes
- Purely **click-driven** off two independent (open / close) timelines — no scroll, no ScrollTrigger, no loops, no autoplay.
- The `isAnimating` flag debounces clicks so a new open/close can't start mid-animation.
- The overlay is `pointer-events: none` until `.is-open`, so the closed hero stays interactive.
- Every path state keeps the identical command sequence (`M Q L L Z`) — required for GSAP's `attr:{d}` string morph to interpolate without jumping.
- Responsive (`max-width: 1000px`): `.menu` becomes `flex-direction: column-reverse` (links on top, contact below) and `.menu-col-links` gets `flex: 1.5`.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/poppr-menu/bg.jpg
https://motionprompts.dev/c/poppr-menu/menu-logo.svg
https://motionprompts.dev/c/poppr-menu/nav-logo.svg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--ink-soft`, `--accent`, `--base-100`, `--base-200`, `--base-300`, `--font-boldonse`, `--font-google-sans-flex`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone module that waits for `DOMContentLoaded`, resolves `.nav-toggle`, `.menu`, the SVG curtain and its `#menu-path`, the six `.menu-col-links a` and the `.menu-col-info` children straight off `document`, builds a brand-new `gsap.timeline()` inside `openMenu()`/`closeMenu()` on every single click rather than one persistent timeline it plays and reverses, and wires exactly one click listener that flips `isOpen`/`isAnimating` together. It never expects to run a second time or to undo anything it created.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component is unusually exposed to that because its open/close state lives entirely in two closured flags read by a single `click` listener. Leave the vanilla `addEventListener` in place with no matching `removeEventListener`, and the remount leaves two listeners on the same `.nav-toggle`, each closing over its own `isOpen`/`isAnimating` pair. One click then fires both handlers: two independent `openMenu()` calls each build their own `gsap.timeline()` and start writing to the same `#menu-path`'s `d` attribute and the same `.char` spans split out of the six links. Whichever timeline's tweens were created second wins the properties it shares with the first — GSAP kills conflicting tweens on the same target automatically — which means the first timeline's tweens are killed before they can finish, so its `onComplete` (the one that flips *that* listener's own `isAnimating` back to false) never runs. That listener is now stuck believing an animation is permanently in flight; every later click on it does nothing but toggle its own `isOpen`, silently out of step with the DOM and with the second listener's copy of the same flag. The visible symptom — some clicks doing nothing, others reopening a curtain that should have closed — will not reproduce in a production build, because React only double-invokes effects in development.

*(1) The entry point* — Nothing in the effect body needs the `DOMContentLoaded` listener: by the time a React component mounts, that event has already fired, so the listener would simply never run. Delete it and move its entire body — the SVG geometry reads, the six path states, the `SplitText` calls, `openMenu`, `closeMenu`, and the click wiring — directly into a `useEffect` with an empty dependency array. `gsap.registerPlugin(SplitText)` stays at module scope.

*(2) Element lookups* — `menuBgSvg`, `menuBg`, `menuLogo`, `navToggleMenu`, `navToggleClose`, `menu`, the six `menuLinks` and the `menuInfoItems` list all come from unscoped `document.querySelector`/`querySelectorAll` calls today. Give the component a root `ref`, render `.nav`, `.menu` and `section.hero` under it, and resolve every one of those lookups through `gsap.context`'s scoped selector instead — `self.selector` (`q` below) rewrites the same selector strings against the root, so the `svgWidth`/`svgHeight`/`svgCenterX` reads off `menuBgSvg.viewBox.baseVal`, and the six-state path math built from them, stay tied to *this* instance's SVG rather than whichever copy of it a StrictMode remount happens to leave in the DOM.

*(3) Cleanup* — Wrap the geometry setup and the six `SplitText` calls in a `gsap.context` scoped to the root ref, and register `openMenu`/`closeMenu` with `self.add` rather than calling them directly:

```jsx
useEffect(() => {
  let isOpen = false;
  let isAnimating = false;
  const splits = [];

  const ctx = gsap.context((self) => {
    const q = self.selector;
    const menuBgSvg = q(".menu-bg-svg")[0];
    const menuBg = q("#menu-path")[0];
    const menuLogo = q(".menu-logo")[0];
    const navToggleMenu = q(".nav-toggle-menu")[0];
    const navToggleClose = q(".nav-toggle-close")[0];
    const menu = q(".menu")[0];
    const menuLinks = q(".menu-col-links a");
    const menuInfoItems = q(".menu-col-info > *:not(br)");

    const svgWidth = menuBgSvg.viewBox.baseVal.width;
    const svgHeight = menuBgSvg.viewBox.baseVal.height;
    const svgCenterX = svgWidth / 2;
    const svgPathStates = { /* the same six states as above, unchanged */ };

    gsap.set(menuBg, { attr: { d: svgPathStates.OPEN_HIDDEN } });

    menuLinks.forEach((link) => {
      const split = new SplitText(link, { type: "chars", charsClass: "char" });
      splits.push(split);
      gsap.set(split.chars, { opacity: 0, x: "750%" });
    });
    gsap.set(menuInfoItems, { opacity: 0, y: 100 });

    self.add("openMenu", () => {
      /* the openMenu body exactly as documented above, closing over
         menuBg, svgPathStates, menuLogo, menuInfoItems and splits */
    });

    self.add("closeMenu", () => {
      /* the closeMenu body exactly as documented above */
    });
  }, rootRef);

  const navToggle = rootRef.current.querySelector(".nav-toggle");
  const handleClick = () => {
    if (isAnimating) return;
    isAnimating = true;
    isOpen = !isOpen;
    isOpen ? ctx.openMenu() : ctx.closeMenu();
  };
  navToggle.addEventListener("click", handleClick);

  return () => {
    navToggle.removeEventListener("click", handleClick);
    ctx.revert();
    splits.forEach((split) => split.revert());
  };
}, []);
```

`gsap.set(menuBg, …)`, the per-link `SplitText` calls and their matching `gsap.set(split.chars, …)` all run during the context's synchronous pass, so `ctx.revert()` already knows to undo the inline `opacity`/`x`/`d` values they wrote. `openMenu` and `closeMenu` do not run then — each one only executes later, from inside `handleClick`, on whatever click happens to land — so without `self.add` neither the curtain tween on `menuBg`'s `d` attribute nor the elastic tween on the `.char` spans would be visible to `ctx.revert()` at all: an unmount that lands mid-curtain would leave that tween running against a `#menu-path` React has already detached, still writing new `d` strings to a node with no parent. Call the registered methods back as `ctx.openMenu()`/`ctx.closeMenu()`, never as bare function references — those are what `self.add` returns from, and what `ctx.revert()` looks for.

Revert the six splits *after* `ctx.revert()`, not before: whichever of `openMenu`'s elastic tween or `closeMenu`'s fade may still be running at unmount targets the `.char` spans each `split` created, and killing those tweens first is what makes tearing the splits back down into six plain `<a>` labels safe.

`isOpen` and `isAnimating` stay plain closured `let`s rather than `useRef`: neither drives JSX — the curtain is an imperatively-written SVG `d` string, not React-rendered markup — and because `handleClick` is removed in the same cleanup that runs `ctx.revert()`, every remount starts both flags fresh. There is no earlier generation's listener left around to disagree with a newer one, provided the removal above is in place.

One dependency worth carrying over deliberately: `new SplitText(link, { type: "chars", … })` measures each character against whichever face is active the instant it runs, and the `x: "750%"` park position is a percentage of that character's own rendered width — in **Boldonse**. If the effect splits before Boldonse has swapped in, every char is parked at 750% of its *fallback-face* width, and when Boldonse finishes loading afterward, that stored `x` no longer corresponds to 750% of the real glyph — the entrance elastic then springs in from a distance that quietly drifts depending on how the font-loading race happened to land. Gate the `SplitText` calls (and the `gsap.set` that parks their output) behind `document.fonts.ready`, with the same cancellation flag the async-effect rule above describes, and don't attach `handleClick` until that split exists.
