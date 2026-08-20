# Art Tech Overlay Navigation

## Goal
Build a fullscreen overlay navigation for an editorial/tech studio site. The star effect: clicking a burger button plays a single paused GSAP timeline that reveals a black fullscreen overlay by wiping **eight vertical blocks** downward via animated `clip-path` (staggered, `power3.inOut`), and — overlapping the tail of that wipe — fades in a menu title plus a list of menu items. Clicking again reverses the exact same timeline to close.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) only — no plugins, no ScrollTrigger, no smooth-scroll library. Google Font `Space Mono` (weights 400 & 700) loaded via `<link>`.

## Layout / HTML
Body contains four top-level regions, in this DOM order (order matters for stacking):

1. `.website-content` — fixed, full viewport, `z-index: 0`. Holds a single `.header` div with an `<img>` of the wide wordmark. This is the background "page" behind everything.
2. `nav` — fixed, full width, `z-index: 2` (sits ABOVE the overlay so the burger stays clickable). Three flex children, each `flex: 1`:
   - `.logo` → `<img>` of the small square brand mark.
   - `.logo-main` → `<img>` of the wide wordmark, centered.
   - `.toggle-btn` → a `<button class="burger">` aligned to the right. The button has an inline `onclick="this.classList.toggle('active');"` that toggles the CSS X-morph (this is separate from the GSAP handler).
3. `.overlay` — fixed, full viewport, `display: flex`. Contains **exactly 8** `<div class="block">` siblings, no content inside.
4. `.overlay-menu` — fixed, full viewport, flex column centered, white text. Contains:
   - `.menu-title` → `<p>[menu]</p>`
   - four `.menu-item` rows, each with three parts: `.menu-item-year` (`<p>`), `.menu-item-name` (`<p>`), `.menu-item-link` (`<a href="#">[explore]</a>`).

Menu content (year / name / link), top to bottom:
- `2023` / `Digital Art Collecting` / `[explore]`
- `2022` / `Art NFT Collecting` / `[explore]`
- `2021` / `Collectors Edition` / `[explore]`
- `Learn More` / `About` / `[explore]`

## Styling
Palette:
- Page background: `#2f24f2` (electric indigo/blue).
- Overlay blocks: `#000` solid black.
- Text & links: `#fff`.

Typography:
- Global `p` and `a`: `Space Mono`, `text-transform: uppercase`, `font-size: 14px`.
- `.menu-item-name p`: a large display face — use a bold/condensed technical sans (original uses "PP Formula"; if unavailable let it fall back to a heavy sans-serif). Size `4vw`, `text-align: center`.
- `img { width:100%; height:100%; object-fit:cover; }` globally.

Key positioning / sizing:
- `.website-content .header`: `width: 800px`, absolutely centered (`top/left: 50%` + `translate(-50%,-50%)`).
- `.logo img`: `width: 100px`. `.logo-main img`: `width: 300px`, centered in its flex cell. `.toggle-btn`: `justify-content: flex-end`, `padding: 0 1.5em`.
- `nav` has `padding: 0 1em`, `display:flex`, `justify-content: space-between`, `align-items:center`.

Burger button (`.burger`):
- `display:flex; justify-content:center; align-items:center; padding: 1.5em 2em; height:20px; width:28px; background: rgba(255,255,255,0.25); border-radius:0.25em; border:none; cursor:pointer; transition: all 250ms ease-out;`
- Two bars via `::before` and `::after`: each `width:28px; height:1.5px; position:absolute; background:#fff; transition: all 250ms ease-out; will-change: transform;`. `::before` is `translateY(-3px)`, `::after` is `translateY(3px)`.
- `.active.burger::before` → `translateY(0) rotate(45deg)`; `.active.burger::after` → `translateY(0) rotate(-45deg)` (morphs to an X).
- `:hover` → background becomes solid white `rgba(255,255,255,1)`, and the two bars turn black `#000`.

Overlay blocks (`.block`):
- `flex: 1; height: 100%; background: #000; margin-right: -2px;` (the negative margin hides seams between blocks).
- **Initial** `clip-path: polygon(0 0, 100% 0, 100% 0, 0 0)` — all four vertices collapsed onto the TOP edge, so the block has zero visible height (hidden at the top).
- The `.overlay` itself is `display:flex` so the 8 blocks split the width into 8 equal vertical columns.

Overlay menu (`.overlay-menu`):
- `padding: 10em 5em; flex-direction: column; justify-content: center; align-items: center;`
- `.menu-title` and every `.menu-item`: `flex: 1; width: 100%; opacity: 0;` (start invisible — GSAP fades them in).
- `.menu-item`: `display:flex; padding:1em; cursor:pointer; transition: 0.3s;`. Children flex ratios: `.menu-item-year` = `flex:1`, `.menu-item-name` = `flex:3` (centered), `.menu-item-link` = `flex:1` right-aligned.
- `.menu-title`: flex-centered.
- No `z-index` on `.overlay-menu`; it stacks above `.overlay` purely by DOM order, and below `nav` (which is `z-index:2`).

## GSAP effect (be exhaustive)
Trigger: **click** on `.burger`. State tracked by a boolean `isOpen` (starts `false`).

Build ONE timeline, created paused:
```
const timeline = gsap.timeline({ paused: true });
```

**Tween 1 — block wipe (added first):**
- Targets: `.block` (all 8).
- Animate `clipPath` → `"polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"` (full rectangle). Because CSS starts the blocks collapsed at the top edge, this wipes each block DOWNWARD to full height.
- `duration: 1`
- `stagger: 0.075` (blocks reveal left → right, 75ms apart).
- `ease: "power3.inOut"`.

**Tween 2 — menu fade (added second, overlapping):**
- Targets: `".menu-title, .menu-item"` (1 title + 4 items = 5 elements).
- Animate `opacity` → `1`.
- `duration: 0.3`
- `stagger: 0.05`.
- **Position parameter: `"-=0.5"`** — this tween starts 0.5s before the previous tween ends, so the text begins fading in while the last blocks are still wiping down.

Click handler on `.burger`:
```
toggleButton.addEventListener("click", () => {
  isOpen ? timeline.reverse() : timeline.play();
  isOpen = !isOpen;
});
```
So the first click `.play()`s (open), the next `.reverse()`s (close, running the exact same timeline backward — blocks retract upward and text fades out), and so on. Wrap everything in `DOMContentLoaded`.

Note the burger's `active` X-morph is driven independently by the inline `onclick` toggling the `.active` class (pure CSS transition), firing on the same click as the GSAP handler.

## Assets / images
Two images, both flat white graphics on transparent backgrounds (no real brand names — use a neutral studio wordmark):
1. **Wide wordmark lockup** (roughly 4:1, landscape) — white letterforms of a studio name. Used twice: as the big centered background logo (in `.header`, 800px wide) and as the centered logo in the nav bar (300px wide).
2. **Small square brand mark** (1:1) — a compact white monogram/glyph. Used as the top-left nav logo (100px wide).

## Behavior notes
- Desktop-first. At `max-width: 900px`: hide the centered `.logo-main img` (`display:none`) and shrink the background `.header` to `width: 300px`.
- The timeline is fully reversible and idempotent — repeated open/close clicks just play/reverse the same instance.
- No scroll interaction, no canvas, no WebGL; lightweight and mobile-safe.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/art-tech-nav/logo-main.png
https://motionprompts.dev/c/art-tech-nav/logo.png
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--electric`, `--electric-dim`, `--paper`, `--accent`, `--muted`, `--mono`, `--display`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, wires one `click` listener onto the burger, and never has to undo either. React withdraws both guarantees at once, and it does it quietly — the overlay still slides in and out, but the burger silently drifts out of sync with what is actually playing.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves two of everything here: two `click` listeners on the same `.burger`, each holding its own `isOpen` flag and its own paused timeline built from the same eight `.block` elements and the same five text nodes (`.menu-title` plus the four `.menu-item`s). The first click after that double-mount fires both handlers at once — one timeline plays forward while the other, still reading its own `isOpen` as false, also plays forward instead of reversing, so the wipe runs twice on the same blocks and the second click no longer closes what the first click opened. The visible symptom is an overlay that opens or closes out of step with its own click count, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no error, no overlay, nothing to debug. Delete the listener and move its whole body — the `.burger` lookup, the `isOpen` flag, the two-tween timeline, and the click handler — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `document.querySelector(".burger")` assumes this component owns the whole document. Give the nav's root element a `ref` and resolve the burger off it instead of off `document` (`rootRef.current.querySelector(".burger")`, or a dedicated ref on the `<button>` itself). The two tween targets don't need that treatment by hand: once the timeline is built inside a `gsap.context` scoped to the same root ref, GSAP resolves the `.block` and `.menu-title, .menu-item` selector strings against that scope element instead of the document, so the eight blocks and the five fading nodes stay correctly scoped for free. During the StrictMode remount two copies of this markup exist for an instant; an unscoped `.burger` lookup can bind the click listener to the copy that is on its way out, leaving the burger actually on screen inert while its clicks go nowhere.

*(3) Cleanup* — Wrap the timeline construction and the click listener in one `gsap.context` scoped to the root ref, and revert it in the cleanup. `gsap.context` accepts a return value from the function you pass it: if that function returns its own cleanup callback, `ctx.revert()` runs it alongside undoing the tweens — which matters here because a plain `addEventListener` is not a tween or a timeline, so the context does not know about it on its own:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const toggleButton = rootRef.current.querySelector(".burger");
    let isOpen = false;

    const timeline = gsap.timeline({ paused: true });
    timeline.to(".block", { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" /* wipe, staggered per block, as above */ });
    timeline.to(".menu-title, .menu-item", { opacity: 1 /* fade, staggered, overlapping the tail of the wipe as above */ }, "-=0.5");

    const handleClick = () => {
      isOpen ? timeline.reverse() : timeline.play();
      isOpen = !isOpen;
    };
    toggleButton.addEventListener("click", handleClick);

    return () => toggleButton.removeEventListener("click", handleClick);
  }, rootRef);

  return () => ctx.revert();
}, []);
```

Without the returned callback, the StrictMode remount leaves a second `click` listener on the same burger permanently — `ctx.revert()` kills the first timeline and rolls back the inline `clipPath` and `opacity` values it wrote, but a bare `addEventListener` call is invisible to it, so the first mount's handler keeps firing next to the second mount's on every click, each toggling its own `isOpen` and driving its own dead timeline.

`isOpen` itself never needs to become a ref or a piece of state: it lives entirely inside this effect's closure, next to the `timeline` it gates, and StrictMode's remount rebuilds the closure — button reference, timeline, flag and listener together — from scratch on every effect run. There is nothing to preserve across the double-mount, only something to make sure gets thrown away completely, which is exactly what reverting the whole context does.

The burger's `active`-class X-morph is unrelated to this effect: it is driven by the inline `onclick` attribute in the markup above, a plain CSS transition with no GSAP and no state of its own, so it needs no cleanup here — an inline handler string is not something JSX can express as-is, but converting it to an `onClick` prop that toggles a class or a piece of local state is a JSX-authoring detail, not a lifecycle one, and does not interact with the timeline built in this effect.
