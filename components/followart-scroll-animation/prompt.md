# FollowArt Scroll Animation

## Goal
Build a vertical scroll page of six stacked full-screen sections (plus a footer). The signature effect: each section's inner content block starts tilted at **30 degrees** (pivoting from its bottom-left corner) and, as you scroll it into view, **scrubs back to level (0deg)**. At the same time each section **pins** at the bottom of the viewport so the next section slides up and overlaps it — producing a layered "card-deck" reveal where straightened panels stack underneath the incoming tilted one. Smooth scroll via Lenis.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scroll. No other plugins, no framework — plain Vite-style module imports:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```

## Layout / HTML
`<main>` contains six `<section>` elements followed by a `<footer>`. Every section wraps its content in a single `.container`. The class order matters — sections are `.one` … `.six` and each has a distinct background color.

Per-section internal structure (classes the CSS/JS rely on: `section`, `.container`, `.col`, `.img`, `h1`, `p`):

- **`.one`** — `.container` > two `.col`. col1: `<h1>` (short title). col2: `<p>` (paragraph, aligned to bottom).
- **`.two`** — `.container` > two `.col`. col1: `.img` > `<img>` (centered). col2: `<h1>` at top + `<p>` at bottom (space-between column).
- **`.three`** — `.container` > two `.col`. col1: `<h1>` at top + `<p>` at bottom (space-between column). col2: `.img` > `<img>` (centered).
- **`.four`** — `.container` (no `.col`, it is a centered column) containing `.img` > `<img>`, then `<h1>`, then two `<p>` blocks. This is the tallest section (200svh).
- **`.five`** — `.container` > two `.col`. col1: `<h1>`. col2: `<p>` (aligned to bottom).
- **`.six`** — `.container` > two `.col`. col1: `<h1>`. col2: `<p>` (aligned to bottom).
- **`<footer>`** — a single centered `<h1>` (e.g. "Footer"). The footer is NOT a `<section>` and is not animated.

Use neutral editorial placeholder copy. Suggested headings in order: "Entry Point", "Gesture", "Variation", "The Stance", "Stillness", "Release". Paragraphs are 1–3 sentences of abstract art-direction prose.

## Styling
Import fonts:
```css
@import url("https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap");
```

Palette (CSS variables, one solid background per section container, with matching text color):
- `--base-100: #8e9487` → `.one` bg, text `#000`
- `--base-200: #1e1e1c` → `.two` bg, text `#fff`
- `--base-300: #f681ff` → `.three` bg, text `#000`
- `--base-400: #62f008` → `.four` bg, text `#000`
- `--base-500: #bca147` → `.five` bg, text `#fff`
- `--base-600: #c2c1c2` → `.six` bg, text `#000`
- footer bg `#0f0f0f`, text `#fff`

Typography:
- Three families: **Anton** for `h1` (heavy condensed display), **Archivo** for `p`, **Space Mono** for the `.kicker` and the small ruled labels.
- `h1`: font-family `"Anton", "Arial Narrow", sans-serif` (a heavy condensed uppercase display face), `text-transform: uppercase`, `font-size: clamp(3rem, 10vw, 15rem)`, `font-weight: 500`, `letter-spacing: -0.025rem`, `line-height: 1`.
- `p`: font-family `"DM Sans", sans-serif`, `font-size: 1.75rem`, `font-weight: 400`, `letter-spacing: -0.025rem`, `line-height: 1.25`.

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `img { width:100%; height:100%; object-fit:cover; }`
- Hide the scrollbar: `::-webkit-scrollbar { display:none; }`

Sections & container (this is what the effect hangs on):
- `section { position:relative; width:100%; height:100svh; min-height:100svh; overflow:hidden; }`
- `section.four { height:200svh; }` (extra scroll length for the tallest panel).
- `.container { position:relative; width:100%; height:100%; padding:2rem; display:flex; transform: rotate(30deg); transform-origin: bottom left; will-change: transform; }` — **the initial 30deg tilt lives in CSS; GSAP animates it to 0.** The `transform-origin: bottom left` is essential: the panel swings from its bottom-left corner.
- `.container .col { flex:1; display:flex; }`
- `.container .col .img { width:35%; height:auto; aspect-ratio:4/5; overflow:hidden; }`
- Column alignment rules:
  - `.one/.five/.six .col:nth-child(2)` → `align-items:flex-end` (paragraph sits at bottom).
  - `.two .col:nth-child(1)`, `.three .col:nth-child(2)` → `justify-content:center; align-items:center` (image centered).
  - `.two .col:nth-child(2)`, `.three .col:nth-child(1)` → `flex-direction:column; justify-content:space-between` (title top, paragraph bottom).
- `.four .container { flex-direction:column; justify-content:center; align-items:center; text-align:center; gap:1rem; }`
- `.four .img { width:30%; margin-bottom:4rem; }` (this `.img` is a direct child of the container, so it keeps its natural aspect ratio — no 4/5 clamp here).
- `.four p { width:50%; }`
- `footer { position:relative; width:100%; height:70svh; padding:2rem; display:flex; justify-content:center; align-items:center; }`

## GSAP effect (the important part — be exact)

### Smooth scroll wiring (Lenis + GSAP ticker)
Inside `DOMContentLoaded`:
```js
const lenis = new Lenis({ autoRaf: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Lenis is driven by GSAP's ticker (not its own rAF), Lenis scroll events call `ScrollTrigger.update`, and lag smoothing is disabled so scrub stays glued to scroll position.

Register the plugin once: `gsap.registerPlugin(ScrollTrigger);`

### Per-section loop
`const sections = document.querySelectorAll("section");` (six of them — the footer is excluded). Then `sections.forEach((section, index) => { ... })`. Inside, grab `const container = section.querySelector(".container");` and set up TWO things:

**1) Un-tilt tween (applies to every section, including the last):**
```js
gsap.to(container, {
  rotation: 0,
  ease: "none",
  scrollTrigger: {
    trigger: section,
    start: "top bottom",   // section's top hits the viewport bottom
    end: "top 20%",        // section's top reaches 20% down from the viewport top
    scrub: true,
  },
});
```
- Animated property: `rotation` from **30deg** (the CSS start value GSAP reads off the element) → **0deg**.
- `ease: "none"` + `scrub: true` → strictly linear, driven by scroll position.
- Effect: as the panel rises from the bottom of the screen toward the top, it straightens from a 30° tilt (pivoting bottom-left) to perfectly level; it is fully level by the time its top reaches 20% from the top.

**2) Pin / stack (every section EXCEPT the last):**
```js
if (index === sections.length - 1) return; // skip pin for the 6th section
ScrollTrigger.create({
  trigger: section,
  start: "bottom bottom",  // section's bottom reaches the viewport bottom (fully in view)
  end: "bottom top",       // section's bottom reaches the viewport top
  pin: true,
  pinSpacing: false,       // CRITICAL — no spacer, so the next section scrolls up OVER this one
});
```
- `pinSpacing: false` is what creates the overlap/stacking: the pinned section holds in place while the following section slides up and covers it, layering the deck.
- The pin holds from the moment the section is fully in view until its bottom scrolls off the top.

No SplitText, no CustomEase, no manual lerp/rAF interpolation — the only easing is linear scrub. The whole effect is: **CSS gives the 30deg start tilt → ScrollTrigger scrubs rotation to 0 on entry → a second pinned ScrollTrigger with `pinSpacing:false` stacks the panels.**

## Assets / images
Three images total, all portrait-oriented stylized character portraits in a screen-print / pop-art comic aesthetic: a single woman rendered with cool blue-toned skin and heavy black hair, drawn in flat inked cel-shading with a subtle grainy paper texture, each set against a saturated flat solid-color background. Framing is head-and-shoulders (bust). Portrait aspect ~4:5. Use whatever imagery fits this look; roles and treatment:
- **Section two image** — displayed inside a `.col`, so it renders at `width:35%`, `aspect-ratio: 4/5`, `object-fit: cover`, cropped/overflow hidden. Subject: woman with dark shoulder-length hair, gold hoop earring and a cream/off-white blazer, on a bold cobalt/royal-blue background. Dominant colors: royal blue + cream, with a gold accent.
- **Section three image** — same treatment as section two (35% width, 4/5 portrait, cover, centered in its column). Subject: woman in yellow-framed sunglasses and a yellow-and-blue horizontally striped sweater, on a vivid red background. Dominant colors: red + yellow + blue.
- **Section four image** — centered near the top of the tall panel at `width:30%`, keeping its natural aspect ratio (no 4/5 clamp). Subject: woman with a dark chin-length bob and blunt bangs wearing a cream-and-blue striped Breton top, on a light sky-blue background. Dominant colors: sky blue + cream.

Describe generically: three vivid, high-contrast pop-art bust portraits of a blue-skinned woman, each on a different saturated flat background, portrait framing ~4:5.

## Behavior notes
- Desktop-first layout. At `max-width: 1000px`: `p` font-size drops to `1.25rem`; `.container` switches to `flex-direction: column`; `.two .col:nth-child(2)` and `.three .col:nth-child(1)` become `justify-content:center; gap:1rem`; `section.four` height becomes `125svh`; `.four p` becomes `width:100%`. The rotation + pin effect still runs on all viewport sizes.
- Heights use `svh` units so mobile browser chrome doesn't break the full-screen sections.
- The footer stays static (never tilts, never pins).
- No reduced-motion handling in the original; the animation is purely scroll-scrubbed (nothing autoplays).

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/followart-scroll-animation/img1.jpg
https://motionprompts.dev/c/followart-scroll-animation/img2.jpg
https://motionprompts.dev/c/followart-scroll-animation/img3.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--riso-blue`, `--riso-pink`, `--riso-yellow`, `--riso-green`, `--board`, `--grain`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, then reaches into the page with two unscoped lookups — `document.querySelectorAll("section")` for the six panels, and `section.querySelector(".container")` inside the loop for each panel's tilting block — and never has to undo the `Lenis` instance, the `gsap.ticker` subscription, or the eleven `ScrollTrigger` instances the loop produces, because the tab reloads long before any of it could run twice. React withdraws all of that at once, and it does it quietly.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. The six `<section>` elements here are not created by the script — they exist in JSX exactly as they exist in the static markup above — so an un-reverted second pass does not duplicate DOM, it duplicates triggers bound to the same nodes: twelve rotation tweens instead of six, each pair scrubbing the same `.container` from the same **top bottom** start to the same **top 20%** end, and ten pin triggers instead of five, each pair pinning the same section between **bottom bottom** and **bottom top** with `pinSpacing: false`. Two pins racing to hold the same section is exactly the failure mode this pattern is known for: the section's held position flickers between whatever the two independent trigger instances separately decide it should be, instead of settling into the single clean pin the deck-stacking effect depends on. Add a second `Lenis` instance, each with its own `gsap.ticker` subscription independently calling `.raf()`, and the wheel gets consumed twice per frame on top of that. None of this reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — the whole body — the `Lenis` construction, the `lenis.on("scroll", …)` and `gsap.ticker.add(...)` wiring, and the `sections.forEach` loop that builds the un-tilt tween and the pin for every section but the last — sits inside `document.addEventListener("DOMContentLoaded", () => {...})`. A React component mounts after that event has already fired on the document, so the listener is registered and never called: no `Lenis` instance, no rotation tween, no pin, and every section just sits frozen at its CSS-authored 30-degree tilt with nothing in the console to explain why. Delete the listener and move its body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can move to module scope — it doesn't need to re-run on every mount.

*(2) Element lookups* — `document.querySelectorAll("section")` is a bare tag selector with no scoping at all. On this component's own demo page that happens to match exactly the six panels the effect wants, because the footer is a `<footer>`, not a `<section>` — but the moment this ships as one region of a larger app, the same query will also pick up every `<section>` anywhere else on that page and try to scrub and pin content this component has no business touching. Give the component a root `ref` wrapping the six panels and query off it instead: `rootRef.current.querySelectorAll("section")`. This is more than a hygiene objection during the StrictMode remount specifically — for an instant two copies of this subtree exist in the tree, and an unscoped query can hand the second pass's triggers the outgoing copy instead of the one that stays on screen. `section.querySelector(".container")` inside the loop is already scoped to the `section` the outer query just handed it, so it needs no change beyond inheriting the corrected root.

*(3) Cleanup* — wrap the `sections.forEach` loop in one `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const sections = rootRef.current.querySelectorAll("section");
    sections.forEach((section, index) => {
      const container = section.querySelector(".container");
      // the un-tilt tween (top bottom -> top 20%) and, for every section
      // but the last, the pin ScrollTrigger.create (bottom bottom -> bottom
      // top, pinSpacing false), exactly as described above
    });
  }, rootRef);
  return () => ctx.revert();
}, []);
```

One call to `ctx.revert()` kills all eleven `ScrollTrigger` instances the loop created and, because the rotation is written by a tween rather than by hand, also strips the inline `transform` GSAP wrote on each `.container` — which is what lets the CSS rule underneath (the 30-degree starting tilt, pivoted from the bottom-left corner) show through again, exactly the pose a fresh load starts from. It also reverses whatever pin-related inline styling a section picked up while held in place, so a panel that was mid-pin at the moment of unmount doesn't stay stuck to the viewport.

`Lenis` is the one resource the context doesn't know about. Create it inside the effect, keep the exact function reference you hand to `gsap.ticker.add` so the cleanup can remove that same reference, and destroy the instance after removing it from the ticker — in that order, so no tick already in flight calls `.raf()` on an instance that no longer exists:

```jsx
const lenis = new Lenis({ autoRaf: false });
const pumpLenis = (time) => lenis.raf(time * 1000);
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add(pumpLenis);
gsap.ticker.lagSmoothing(0); // global, idempotent — re-running it on a second mount changes nothing

// cleanup:
gsap.ticker.remove(pumpLenis);
lenis.destroy();
ctx.revert();
```

`lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — it lives on the `Lenis` instance's own emitter and goes with it on `destroy()`. This component is written as a full-page demo with exactly one `Lenis` instance driving the whole document, and that assumption is the first thing to break once it becomes one region inside a larger app. Smooth scroll is a document-level resource — there can only be one — so lift the `Lenis` instance and the ticker wiring to whatever shell already owns scrolling, and have this effect subscribe `ScrollTrigger.update` to that existing instance instead of constructing a second one to fight it over the same wheel input.
