# Fullscreen Portfolio Menu — Clip-Path Overlay with Staggered Giant Links

## Goal

Build a fullscreen overlay navigation for an editorial portfolio site. A burger button in the top-right toggles the menu: a single GSAP timeline sweeps a dark `clip-path` overlay down over the entire viewport, then staggers three oversized menu words up from behind a mask, grows a colored underline bar across the active item (animated via `CSSRulePlugin` on a `::after` pseudo-element), and fades a social sub-nav up into place. Clicking the burger again plays the exact same timeline in reverse. The burger morphs into an X. The top nav uses `mix-blend-mode: difference` so its text/lines invert against whatever is behind them.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`CSSRulePlugin`** (this is required — the active-item underline is a CSS `::after` pseudo-element and can only be tweened through `CSSRulePlugin.getRule(...)`).

```js
import gsap from "gsap";
import { CSSRulePlugin } from "gsap/CSSRulePlugin";
gsap.registerPlugin(CSSRulePlugin);
```

Wrap all JS in a `DOMContentLoaded` listener. No smooth-scroll library, no ScrollTrigger, no canvas/WebGL.

## Layout / HTML

```
<div class="website-content">
  <div class="hero-img"><img src="./hero.jpg" alt="" /></div>
</div>

<nav>
  <div class="info"><p>Folio Vol. 1</p></div>
  <div class="logo"><p><a href="#">The Elite Portfolio</a></p></div>
  <div class="toggle-btn">
    <button class="burger" onclick="this.classList.toggle('active');"></button>
  </div>
</nav>

<div class="overlay">
  <div class="overlay-menu">
    <div class="menu-item"><div class="menu-item-name"><p id="active"><a href="#">Index</a></p></div></div>
    <div class="menu-item"><div class="menu-item-name"><p><a href="#">Work</a></p></div></div>
    <div class="menu-item"><div class="menu-item-name"><p><a href="#">About</a></p></div></div>
  </div>
  <div class="sub-nav">
    <p><a href="#">Twitter</a></p><p>·</p>
    <p><a href="#">Instagram</a></p><p>·</p>
    <p><a href="#">Dribble</a></p><p>·</p>
    <p><a href="#">Behance</a></p>
  </div>
</div>

<script type="module" src="./script.js"></script>
```

Notes:
- The burger `<button>` has an inline `onclick="this.classList.toggle('active');"` that toggles the X shape via CSS — keep it. The JS adds a *separate* click listener on `.burger` that drives the GSAP timeline.
- The first menu item's `<p>` carries `id="active"` — its `::after` is the animated underline.
- Stacking order (via z-index): `.website-content` = 0 (base page), `.overlay` sits above it, `nav` = 2 (always on top).

## Styling

Reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`. `html, body { width: 100%; height: 100%; }`.

**Palette (exact):**
- `#cdc6be` — warm greige / off-white (page background, most text, links)
- `#141412` — near-black (overlay background, hero border)
- `#fff` — white (menu text, burger lines)
- `#c03f13` — burnt orange-red (the active-item underline bar)

**Fonts (by role):** the small UI text (`info`, links) uses a clean neutral grotesque — name it `"Neue Montreal"` with a sans-serif fallback (substitute Inter/Helvetica Neue). The logo, the giant menu words and the sub-nav use an elegant high-contrast display serif — name it `"Canopee"` with a serif fallback (substitute any refined display serif such as Cormorant/Playfair if unavailable). The named families can stay declared even without `@font-face`; the layout is what matters.

Key rules:
- `a { text-decoration: none; color: #cdc6be; }`
- `.website-content` — `position: fixed; inset: 0; width/height 100%; z-index: 0; background: #cdc6be; padding: 2em;`
- `.hero-img` — `margin-top: 4em; width: 100%; height: 100%; border: 2px solid #141412;` and its `img { width:100%; height:100%; object-fit: cover; }`
- `nav` — `position: fixed; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1.5em 2em; color: #cdc6be; mix-blend-mode: difference; z-index: 2;`. `nav > div { flex: 1; }`. **The `mix-blend-mode: difference` is essential** — it makes the nav text/burger invert against the light page and the dark overlay.
- `.logo` — `text-align: center; font-family: "Canopee";`. `.logo p { position: relative; top: 0.225em; }`. `.logo a { font-size: 30px; color: #cdc6be; }` (drops to `20px` under `@media (max-width: 900px)`).
- `.toggle-btn { display: flex; justify-content: flex-end; }`
- `.burger` — `display: flex; justify-content: center; align-items: center; padding: 1.75em 2em 1.5em 2em; background: rgba(255,255,255,0); border-radius: 0.25em; outline: none; height: 20px; width: 28px; border: none; cursor: pointer; transition: all 250ms ease-out;`
- `.burger:before, .burger:after` — `content: ""; width: 40px; height: 2px; position: absolute; background: #fff; transition: all 250ms ease-out; will-change: transform;`. `:before { transform: translateY(-3px); }`, `:after { transform: translateY(3px); }`. When `.burger.active`: `:before { transform: translateY(0) rotate(45deg); }`, `:after { transform: translateY(0) rotate(-45deg); }` — the two bars cross into an **X**.
- `.overlay` — `position: fixed; inset: 0; width: 100vw; height: 100vh; display: flex; background: #141412; clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); will-change: transform;`. **The initial clip-path is collapsed flat against the top edge (zero height)** so the overlay is invisible until animated.
- `.overlay-menu` — `position: fixed; inset: 0; width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 1em; color: #fff;`
- `.menu-item` — `display: flex; cursor: pointer; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);`. **This rectangular clip-path is the mask** that hides each word while it sits pushed down (y: 225) so it can rise into view.
- `.menu-item p` — `position: relative; text-align: center; font-family: "Canopee"; font-size: 15vw; line-height: 80%; will-change: transform; transition: letter-spacing 0.3s;`. On `:hover`, `letter-spacing: 0.075em;`.
- `.menu-item p#active::after` — `content: ""; position: absolute; top: 45%; left: 0; transform: translateY(-50%); background: #c03f13; width: 0%; height: 12px;`. **Starts at `width: 0%`** — GSAP grows it to 100%.
- `.menu-item a { color: #cdc6be; }`
- `.sub-nav` — `position: absolute; bottom: 5%; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5em; opacity: 0;`. `.sub-nav p { font-family: "Canopee"; font-size: 20px; color: #cdc6be; }`.

## GSAP effect (exhaustive)

State: a single boolean `isOpen = false` and one **paused** timeline built once on load.

### Setup (runs immediately on `DOMContentLoaded`)

1. Grab the underline pseudo-element rule:
   `const activeItemIndicator = CSSRulePlugin.getRule(".menu-item p#active::after");`
2. `const toggleButton = document.querySelector(".burger");`
3. Set the closed/initial state of the giant words: `gsap.set(".menu-item p", { y: 225 });` — all three words pushed 225px down, hidden behind each `.menu-item`'s clip-path mask.
4. `const timeline = gsap.timeline({ paused: true });`

### Timeline (4 tweens, in this exact order and position)

**Tween 1 — overlay wipes down.** Target `.overlay`.
- `clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"` (from the CSS initial collapsed-top polygon → full rectangle, i.e. the dark panel unrolls downward covering the viewport).
- `duration: 1.5`, `ease: "power4.inOut"`. Inserted at the timeline start (t = 0).

**Tween 2 — menu words rise, staggered.** Target `.menu-item p`.
- `y: 0` (from the preset `y: 225` → 0, so each word slides up into its mask).
- `duration: 1.5`, `stagger: 0.2` (Index, then Work, then About, 0.2s apart), `ease: "power4.out"`.
- **Position parameter `"-=1"`** — starts 1s before the previous tween ended, i.e. at t ≈ 0.5s, overlapping the overlay wipe.

**Tween 3 — active underline grows.** Target `activeItemIndicator` (the `CSSRulePlugin` rule).
- `width: "100%"` (from `0%` → `100%`, the burnt-orange bar draws left→right across the "Index" word).
- `duration: 1`, `ease: "power4.out"`, `delay: 0.5`.
- **Position parameter `"<"`** — inserted at the *start* of Tween 2 (t ≈ 0.5s); with its own `delay: 0.5` it effectively begins around t ≈ 1.0s and finishes at ≈ 2.0s.

**Tween 4 — social sub-nav fades up.** Target `.sub-nav`.
- `bottom: "10%"` (from `5%` → `10%`, rises slightly) and `opacity: 1` (from `0` → `1`).
- `duration: 0.5`, `delay: 0.5`.
- **Position parameter `"<"`** — inserted at the start of Tween 3 (t ≈ 0.5s); with `delay: 0.5` it effectively begins around t ≈ 1.0s.

### Trigger

Add a click listener on `.burger`:
```js
toggleButton.addEventListener("click", () => {
  if (isOpen) timeline.reverse();
  else timeline.play();
  isOpen = !isOpen;
});
```
So the first click plays the timeline forward (menu opens), the next click reverses it (everything retracts along the same eases), and so on. The inline `onclick` on the button independently toggles the `.active` class that morphs the burger into an X (250ms CSS transition), in sync with the toggle.

## Assets / images

One image: `hero.jpg` — a large, moody, editorial photograph (portrait mood works well) filling the bordered hero frame full-bleed via `object-fit: cover`. It sits on the base page behind the overlay and is only visible when the menu is closed. Any single high-quality editorial/fashion-style photo works; aspect ratio is flexible since it is cropped to fill the frame.

## Behavior notes

- Desktop-oriented; the `15vw` menu type and centered flex layout scale down gracefully. `@media (max-width: 900px)` only shrinks the logo to `20px`.
- The whole effect is a single reusable paused timeline — no re-creation per click, just `play()` / `reverse()`.
- No infinite loops, no scroll hijacking; lightweight and mobile-safe.
- `will-change: transform` hints are set on the overlay, menu words and burger bars for smoothness.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/nm-menu-rebuild/hero.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--bone`, `--ash`, `--ember`, `--paper`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the menu opens and closes correctly on the first click and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Run this component's setup twice against the same DOM and you get two paused timelines built from the same starting pose (`gsap.set(".menu-item p", { y: 225 })`), and two `click` listeners stacked on the same `.burger`, each closed over its own `isOpen`. One click now fires both handlers at once: each still reads its own fresh `isOpen` as false, so both call `.play()` instead of one playing and one reversing — the `.overlay` clip-path wipe restarts mid-sweep, the three staggered `.menu-item p` words jump back down and rise a second time, and the burnt-orange underline tween fights itself for the same `width` on `activeItemIndicator`. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener body — the `CSSRulePlugin.getRule` lookup, the `gsap.set`, the timeline build, the `.burger` click wiring — never runs, and the menu is simply inert with nothing to debug. Delete the `DOMContentLoaded` listener and move its body directly into a `useEffect` with an empty dependency array. `gsap.registerPlugin(CSSRulePlugin)` is the one line that stays outside it, at module scope — it touches no DOM, and re-registering the plugin on every mount is harmless but pointless.

*(2) Element lookups* — `document.querySelector(".burger")` assumes this component owns the document; resolve it off a root ref instead (`rootRef.current.querySelector(".burger")`). The three selector-string tween targets built inside the timeline — `.overlay`, `.menu-item p`, `.sub-nav` — don't need that same treatment: `gsap.context`'s second argument rewrites selector-string targets to the root automatically. Only `.burger`, reached through a bare `document.querySelector` rather than as a tween target, needs the manual scoping. During the StrictMode remount two copies of `.burger` exist for an instant, and an unscoped query has no way to tell which one belongs to the copy on its way out.

*(3) Cleanup* — Wrap the `CSSRulePlugin.getRule` call, the initial `gsap.set`, and the timeline build in a `gsap.context` scoped to the root ref. Keep the timeline and the `isOpen` flag in the effect's own closure rather than `useState` — neither ever drives a render, and a fresh `isOpen` reset to false on every effect run is exactly what a clean remount wants. Give the click handler a name so it can be removed explicitly:

```jsx
useEffect(() => {
  let timeline;

  const ctx = gsap.context(() => {
    const activeItemIndicator = CSSRulePlugin.getRule(
      ".menu-item p#active::after"
    );
    gsap.set(".menu-item p", { y: 225 });
    timeline = gsap.timeline({ paused: true });
    // the same four tweens, in the same order and positions, targeting
    // .overlay, .menu-item p, activeItemIndicator, and .sub-nav
  }, rootRef);

  let isOpen = false;
  const toggleButton = rootRef.current.querySelector(".burger");
  const handleClick = () => {
    if (isOpen) timeline.reverse();
    else timeline.play();
    isOpen = !isOpen;
  };
  toggleButton.addEventListener("click", handleClick);

  return () => {
    toggleButton.removeEventListener("click", handleClick);
    ctx.revert();
  };
}, []);
```

`ctx.revert()` undoes the timeline's four tweens and the inline `clip-path`/`transform`/`width` values they wrote, plus the `y` offset `gsap.set` applied to the three words — everything the factory touched during its synchronous pass. It does not touch `handleClick`: `addEventListener` isn't a GSAP object, so the listener needs its own `removeEventListener`, keyed off the exact function reference passed in, run before `ctx.revert()`. Nothing here needs `self.add`, either — unlike a menu whose open/close handler builds new tweens on every click, this one only calls `.play()`/`.reverse()` on the single timeline the factory already built, so there's no later tween creation for the context to miss.

`CSSRulePlugin.getRule` is not a DOM query, and root-ref scoping doesn't apply to it the way it does to `.burger`: it searches `document.styleSheets` for a rule whose selector text matches a literal string, against the real, compiled CSS. If this component's styles ship through CSS Modules, `.menu-item` gets renamed at build time (for example `.menu-item_a3f1b`), and `".menu-item p#active::after"` no longer matches anything the browser actually parsed — `getRule` returns `null`, and the third tween has nothing to grow the underline bar on, silently. The `#active` id is untouched by CSS Modules either way, so only the `.menu-item` class piece is at risk; keep this rule's declaration in a global, un-scoped stylesheet, or write it inside a `:global(...)` block, so the literal string the effect passes to `getRule` and the one the browser registered are the same text.
