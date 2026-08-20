# Orbit-Text SVG Preloader → Hero Reveal

## Goal
Build a full-screen portfolio **preloader** whose star effect is eight words riding eight **concentric circular SVG orbits**. Each word is an SVG `<textPath>` that, as it animates, **stretches** (its `textLength` grows enormously) and **slides** around its ring (its `startOffset` shifts), so the words appear to elongate and smear along nested circles while the whole SVG **wobbles** back and forth in random ±25° rotations and a central counter tweens **0 → 100**. After ~6 s the orbit words **fade out ring by ring**, the loader panel dissolves, and the hero underneath is revealed with a background **1.25 → 1 zoom-out** and a word-masked **SplitText** line sliding up on a custom ease. Everything plays automatically once on page load; there is no scroll.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`SplitText`** and **`CustomEase`**. No smooth-scroll library — the whole thing is a pure load-triggered set of tweens, the page does not scroll. Register: `gsap.registerPlugin(SplitText, CustomEase)`. The animations are created immediately on module execution (no `DOMContentLoaded`/`fonts.ready` wrapper is required, though wrapping in `fonts.ready` is fine).

## Layout / HTML
Two stacked layers. The `.loader` is a **fixed** full-viewport overlay (`z-index: 2`) that sits on top of a `.hero` section (natural flow underneath). Class/tag names are load-bearing — the JS queries them.

```
<div class="loader">
  <svg viewBox="-425 -425 1850 1850" xmlns="http://www.w3.org/2000/svg">
    <!-- 8 concentric orbit paths (see geometry below) -->
    <path id="loader-orbit-1" d="..." />
    <path id="loader-orbit-2" d="..." />
    ...
    <path id="loader-orbit-8" d="..." />

    <!-- 8 words, each riding one orbit path -->
    <text class="orbit-text"><textPath href="#loader-orbit-1" startOffset="30%" textLength="300">Developer</textPath></text>
    <text class="orbit-text"><textPath href="#loader-orbit-2" startOffset="31%" textLength="280">Frontend</textPath></text>
    <text class="orbit-text"><textPath href="#loader-orbit-3" startOffset="33%" textLength="240">Creative</textPath></text>
    <text class="orbit-text"><textPath href="#loader-orbit-4" startOffset="32%" textLength="260">Designer</textPath></text>
    <text class="orbit-text"><textPath href="#loader-orbit-5" startOffset="30%" textLength="290">Portfolio</textPath></text>
    <text class="orbit-text"><textPath href="#loader-orbit-6" startOffset="31%" textLength="200">Digital</textPath></text>
    <text class="orbit-text"><textPath href="#loader-orbit-7" startOffset="33%" textLength="210">Modern</textPath></text>
    <text class="orbit-text"><textPath href="#loader-orbit-8" startOffset="32%" textLength="190">Design</textPath></text>
  </svg>

  <div class="counter"><p>0</p></div>
</div>

<section class="hero">
  <div class="hero-bg"><img src="<hero image>" alt="" /></div>
  <div class="hero-copy"><p>Your content begins here</p></div>
</section>
```

### Orbit geometry (critical)
All eight circles are **concentric at (500, 500)** in SVG user units. The `viewBox` `-425 -425 1850 1850` is deliberately oversized so its own center is exactly (500, 500) and the largest ring has margin. Radii, outermost → innermost:

| id | radius r | top point (500, 500−r) | bottom point (500, 500+r) |
|----|----------|------------------------|---------------------------|
| loader-orbit-1 | 775 | 500,−275 | 500,1275 |
| loader-orbit-2 | 700 | 500,−200 | 500,1200 |
| loader-orbit-3 | 625 | 500,−125 | 500,1125 |
| loader-orbit-4 | 550 | 500,−50  | 500,1050 |
| loader-orbit-5 | 475 | 500,25   | 500,975  |
| loader-orbit-6 | 400 | 500,100  | 500,900  |
| loader-orbit-7 | 325 | 500,175  | 500,825  |
| loader-orbit-8 | 250 | 500,250  | 500,750  |

**Each path traces its full circle three times** so a huge `textLength` has room to wrap around the ring multiple times. The `d` for radius `r` is two semicircle arcs (top→bottom→top) repeated **3×**, ending just shy of the top point to avoid a degenerate close:

```
M 500,{500-r} A r,r 0 0,1 500,{500+r} A r,r 0 0,1 500,{500-r}   (×3, last endpoint 499.99,{500-r})
```

e.g. orbit-1 (r=775):
`M 500,-275 A 775,775 0 0,1 500,1275 A 775,775 0 0,1 500,-275 A 775,775 0 0,1 500,1275 A 775,775 0 0,1 500,-275 A 775,775 0 0,1 500,1275 A 775,775 0 0,1 499.99,-275`

So each path's total length is `2 × π × r × 3` (three circumferences) — this factor of 3 matters for the offset math in the GSAP section.

## Styling
Google Font: **Inter** (variable, ital + opsz `14..32` + wght `100..900`). `body { font-family: "Inter", sans-serif }`.

Palette (CSS custom properties):
- `--base-100: #fff` — white (hero copy text)
- `--base-200: #b8d9b9` — soft sage green (the loader panel background)
- `--base-300: #0f0f0f` — near-black (loader text + orbit-text fill)

Global reset: `* { margin:0; padding:0; box-sizing:border-box }`. `img { width:100%; height:100%; object-fit:cover }`. `p { text-transform:uppercase; font-weight:500 }`.

Key elements and their **initial states** (the animation depends on these):

- `.loader` — `position:fixed; top:0; left:0; width:100%; height:100svh; display:flex; justify-content:center; align-items:center; background:var(--base-200); color:var(--base-300); will-change:opacity; z-index:2`.
- `.loader svg` — `width:85%; height:85%` (centered inside the loader).
- `.loader svg path` — `fill:none` (the orbit circles are invisible guide paths — only the text on them shows).
- `.loader svg .orbit-text` — `fill:var(--base-300); text-transform:uppercase; font-size:2.75rem; font-weight:500`.
- `.loader .counter` — `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)` (dead-center number over the orbits).
- `.hero` — `position:relative; width:100%; height:100svh; display:flex; justify-content:center; align-items:center; overflow:hidden`.
- `.hero-bg` — `position:absolute; width:100%; height:100%; transform:scale(1.25); will-change:transform` (starts zoomed in 25%).
- `.hero-copy p` — `color:var(--base-100)`.
- `.hero-copy p .word` — (this class is produced by SplitText) `position:relative; will-change:transform; transform:translateY(100%)` (each word parked one line **below**, hidden behind its word-mask).

Responsive `@media (max-width:1000px)`: `.loader svg { width:100%; height:100% }` and `.loader svg .orbit-text { font-size:3rem }`. The animation itself is unchanged.

## GSAP effect (be exact)

### Setup
```js
gsap.registerPlugin(SplitText, CustomEase);
CustomEase.create("hop", "0.9, 0, 0.1, 1");   // steep symmetric in-out, used for the hero reveal only

const split = SplitText.create(".hero-copy p", {
  type: "words",
  mask: "words",
  wordsClass: "word",   // → each word wrapped in an overflow-hidden mask, tagged .word (pre-translated 100% down by CSS)
});
```

These are **independent tweens**, all created at load — not one master timeline. The hero reveal is chained off the orbit-text fade-out's `onComplete`. There are four concurrent behaviors (A–D) plus the reveal (E).

### A — Orbit words stretch + slide (perpetual yoyo)
Read the eight `<textPath>` nodes (`document.querySelectorAll(".loader svg textPath")`) and capture their **start** attribute values:
- `startTextLengths` = current `textLength` attrs = `[300, 280, 240, 260, 290, 200, 210, 190]`.
- `startTextOffsets` = current `startOffset` attrs (as numbers, percent) = `[30, 31, 33, 32, 30, 31, 33, 32]`.

Constants:
```js
const targetTextLengths = [4000, 3500, 3250, 3000, 2500, 2000, 1500, 1250];
const orbitRadii        = [775, 700, 625, 550, 475, 400, 325, 250];
const maxOrbitRadius = 775;   // orbitRadii[0]
const maxAnimDuration = 1.25;
const minAnimDuration = 1;
```

For each textPath at `index` (0…7):
```js
const animationDelay = (textPaths.length - 1 - index) * 0.1;   // index 0 → 0.7s, index 7 → 0.0s (inner rings start first)
const r = orbitRadii[index];
const currentDuration = minAnimDuration + (r / maxOrbitRadius) * (maxAnimDuration - minAnimDuration); // 1.0 … 1.25, larger ring = slower

const pathLength = 2 * Math.PI * r * 3;                        // 3 circumferences (the path is traced 3×)
const textLengthIncrease = targetTextLengths[index] - startTextLengths[index];
const offsetAdjustment  = (textLengthIncrease / 2 / pathLength) * 100;  // percent to shift so growth stays roughly centered
const targetOffset      = startTextOffsets[index] - offsetAdjustment;

gsap.to(textPath, {
  attr: {
    textLength: targetTextLengths[index],   // e.g. 300 → 4000: the word stretches ~13× along its ring
    startOffset: targetOffset + "%",         // shift back by offsetAdjustment so the stretch spreads both ways
  },
  duration: currentDuration,
  delay: animationDelay,
  ease: "power2.inOut",
  yoyo: true,
  repeat: -1,        // forever: stretch out, then contract back, endlessly
  repeatDelay: 0,
});
```
Net effect: each word repeatedly balloons out to a huge `textLength` (wrapping several times around its circle) and snaps back, with the inner rings leading and outer rings lagging by 0.1 s each, giving a rippling, breathing nest of text.

### B — Whole SVG random wobble (perpetual)
A self-chaining recursive rotation. Start `loaderRotation = 0`, then:
```js
function animateRotation() {
  const spinDirection = Math.random() < 0.5 ? 1 : -1;
  loaderRotation += 25 * spinDirection;                 // ±25° accumulated
  gsap.to(".loader svg", {
    rotation: loaderRotation,
    duration: 2,
    ease: "power2.inOut",
    onComplete: animateRotation,                         // loop forever
  });
}
animateRotation();
```
The entire SVG swings a random 25° left or right every 2 s (accumulating on `loaderRotation`), so the whole orbit stack gently rocks unpredictably.

### C — Center counter 0 → 100
```js
const counterText = document.querySelector(".counter p");
const count = { value: 0 };
gsap.to(count, {
  value: 100,
  duration: 4,
  delay: 1,
  ease: "power1.out",
  onUpdate: () => { counterText.textContent = Math.floor(count.value); },
  onComplete: () => {
    gsap.to(".counter", { opacity: 0, duration: 0.5, delay: 1 });  // fade the number away 1s after it hits 100
  },
});
```
The number ticks up from 0 to 100 over 4 s (starting 1 s in, `power1.out`), then 1 s later fades out over 0.5 s.

### D — Orbit words fade in (ring by ring)
```js
const orbitTextElements  = document.querySelectorAll(".orbit-text");
gsap.set(orbitTextElements, { opacity: 0 });                 // all words start invisible
const orbitTextsReversed = Array.from(orbitTextElements).reverse();  // innermost first

gsap.to(orbitTextsReversed, {
  opacity: 1,
  duration: 0.75,
  stagger: 0.125,      // inner ring appears first, outer rings cascade in
  ease: "power1.out",
});
```

### E — Orbit words fade out → hero reveal (the finale)
```js
gsap.to(orbitTextsReversed, {
  opacity: 0,
  duration: 0.75,
  stagger: 0.1,
  delay: 6,            // starts at t≈6s (after the counter and a good look at the orbits)
  ease: "power1.out",
  onComplete: () => {
    // 1) dissolve the loader panel, then rip it out of the DOM
    gsap.to(".loader", {
      opacity: 0,
      duration: 1,
      onComplete: () => document.querySelector(".loader").remove(),
    });

    // 2) hero background de-zoom 1.25 → 1
    gsap.to(".hero-bg", { scale: 1, duration: 2, delay: -0.5, ease: "hop" });

    // 3) hero copy words rise up out of their masks
    gsap.to(".hero-copy p .word", { y: 0, duration: 2, delay: -0.25, stagger: 0.1, ease: "hop" });
  },
});
```
Notes:
- The orbit words fade out one ring at a time (0.1 s stagger), and only when the last word's fade completes does the reveal fire.
- **Negative delays are intentional:** `delay: -0.5` / `-0.25` fast-forward those tweens by half/quarter of a second so the hero background and copy are already mid-motion the instant the loader begins dissolving — the de-zoom and word-rise overlap the loader fade rather than waiting for it.
- `.hero-bg` scales from its CSS `scale(1.25)` back to `1` over 2 s on the `hop` ease (steep, cinematic settle).
- `.hero-copy p .word` each translate from `translateY(100%)` (below, masked) to `y:0`, staggered 0.1 s, 2 s, `hop` — the line slides up word by word.

### Approximate timeline (seconds from load)
| t | event |
|---|-------|
| 0 | orbit stretch (A) begins per-ring (delays 0–0.7s), SVG wobble (B) starts, orbit words fade **in** ring by ring (D) |
| 1–5 | counter (C) ticks 0→100 |
| ~6 | counter fades out; orbit words begin fading **out** ring by ring (E, delay 6, stagger 0.1) |
| ~7.5 | last orbit word gone → `onComplete`: loader dissolves (1s) + hero de-zoom (2s) + copy words rise (2s), overlapped via negative delays |
| ~9 | loader `.remove()`d, hero settled |

A/B (orbit stretch + wobble) run as infinite loops but are destroyed with the loader when it is removed.

## Assets / images
**One** hero background image, full-bleed (`object-fit: cover`, starts `scale(1.25)`), landscape (~3:2). It is a close-up of **glossy white-and-grey marble**: smooth, sculptural wave-like folds in polished stone with wispy dark-grey/charcoal veining threading through a bright white ground. Dominant colors are **white and light grey with soft grey shadows and thin charcoal veins** — a calm, high-key, monochrome texture. Aspect ratio is flexible since it is cover-cropped; any soft, tactile editorial stone/liquid texture works in the same role. It is the single subject of the `1.25 → 1` de-zoom reveal.

## Behavior notes
- **Autoplay once** on load; no scroll, hover, or click. Total intro ~8–9 s.
- The orbit stretch (A) and SVG wobble (B) are `repeat: -1` / self-chaining loops that only stop when `.loader` is removed from the DOM at the end.
- Uses `100svh` so mobile browser chrome doesn't clip the panels.
- Keep the `will-change` hints (`opacity` on `.loader`, `transform` on `.hero-bg` and `.word`) — they matter for smooth compositing.
- Responsive (`≤1000px`): the SVG fills the whole loader (`width/height:100%`) and orbit text bumps to `3rem`; the animation logic is identical.
- No `reduced-motion` handling in the original; add one if desired, but it is not part of the reference behavior.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/maxmilkin-preloader/hero.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--stone`, `--stone-deep`, `--ink`, `--bone`, `--bone-soft`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the rings breathe, the SVG rocks, the counter climbs, and roughly eight seconds later the reveal fires and the loader panel tears itself out of the DOM, all without anything here checking whether the component that started the sequence is still around to finish it.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. A double mount that leaves the first generation's wobble alive hands `.loader svg` two rotation chains pulling on the same element from two different `loaderRotation` closures — the visible symptom is a spin that looks twice as fast and increasingly erratic, not a clean doubling anyone would recognize as "two of something." It will not reproduce in a production build, because React only does the double mount in development.

*(1) The entry point* — The real file is not the top-level script the rest of this prompt implies: everything lives inside `mount(config)`, which returns a `destroy()`, and only the tail of the file — a `document.readyState === "loading"` check before subscribing to `DOMContentLoaded`, falling back to a `window.MP.register` branch — decides when `mount` runs. The `window.MP` branch exists only so this catalogue's own live-editor can remount the component with different values for its five tunables (`ringStagger`, `spinStep`, `counterDuration`, `orbitInStagger`, `wordStagger`); it has no equivalent in a page you own. Drop that branch, the `readyState` guard and the listener, inline the five tunables as ordinary constants, and move `mount`'s body directly into a `useEffect` with an empty dependency array. What `mount` already returns is worth keeping intact, though: it is a real cleanup function, written for the same reason React wants one — the live-editor has to tear down one instance before it mounts the next. The two lines that sit above `mount` — `gsap.registerPlugin(SplitText, CustomEase)` and the `CustomEase.create` call that names the reveal's ease — already live at module scope, outside the function this port is dissolving into an effect; leave them exactly where they are, once, at the top of the component's file.

*(2) Element lookups* — `document.querySelector(".loader")`, `.querySelectorAll(".loader svg textPath")`, `.querySelector(".counter p")` and `.querySelectorAll(".orbit-text")` all assume this component owns the document. Give the component a root ref over the element wrapping `.loader` and `.hero`, and resolve all four from it. `.loader` itself needs more than scoping: the finale calls `loader.remove()` directly on the node once the panel has faded to nothing. Detaching a node React still believes it is rendering is fragile the moment this component remounts or a route change lands mid-sequence. Model it as state instead — a `loaderGone` flag flipped inside the reveal's completion, with the `.loader` JSX conditionally rendered on it — rather than reaching past React with an imperative `.remove()`.

*(3) Cleanup* — Wrap the eight `textPath` stretch tweens, the wobble's first spin, the counter's climb to 100 and the two orbit-text opacity passes in a `gsap.context` scoped to the root ref; all five are built synchronously in that one pass, so the context's own tracking captures them for free. Three other pieces of this script are not built in that pass, and each has to be registered as its own context method:

```jsx
useEffect(() => {
  const split = SplitText.create(".hero-copy p", { type: "words", mask: "words", wordsClass: "word" });

  const ctx = gsap.context((self) => {
    // the eight textPath attr tweens, the initial orbit-text fade-in — exactly as constructed above

    let loaderRotation = 0;
    const rotateLoader = self.add("rotateLoader", () => {
      // pick spinDirection, advance loaderRotation — exactly as above
      gsap.to(svgRef.current, {
        rotation: loaderRotation,
        onComplete: () => rotateLoader(),   // re-enters through the registered method, not a bare closure
      });
    });
    rotateLoader();

    const count = { value: 0 };
    gsap.to(count, {
      value: 100,
      onUpdate: () => { counterTextRef.current.textContent = Math.floor(count.value); },
      onComplete: self.add("fadeCounter", () => {
        gsap.to(counterRef.current, { opacity: 0 });
      }),
    });

    const revealHero = self.add("revealHero", () => {
      gsap.to(loaderRef.current, { opacity: 0, onComplete: () => setLoaderGone(true) });
      gsap.to(heroBgRef.current, { scale: 1 });
      gsap.to(split.words, { y: 0 });
    });
    gsap.to(orbitTextsReversed, { opacity: 0, onComplete: revealHero });
  }, rootRef);

  return () => {
    ctx.revert();     // reaches whichever generation of rotateLoader is running, and revealHero if it already fired
    split.revert();
  };
}, []);
```

The wobble's `onComplete` calls `rotateLoader` again, which means each spin schedules the next `gsap.to` from inside a callback that fires on a later frame, outside the factory's own synchronous pass — the exact case `self.add` exists for. So does the counter's own fade-away, and so does the entire reveal: `revealHero` fires only after the last orbit word's fade-out completes, seconds after mount. Skip `self.add` on any of these three and `ctx.revert()` only reaches what finished executing *inside* the factory call — the counter tween reaching 100, say — while the fade it triggers, whichever spin is currently mid-flight, or the entire reveal chain, keep running against a component that no longer exists. This is the same failure the vanilla script already had to hand-solve, just for a page instead of a component tree: `animateRotation`'s own `if (destroyed) return` guard, and the `if (!destroyed) loader?.remove()` guard inside the finale, exist precisely because a `gsap.to`/`onComplete` recursion has no owner to stop it otherwise. `self.add` gives it that owner — `ctx.revert()` now finds and kills whichever generation of the loop is live — so both manual guards, and the `destroyed` boolean itself, can go away.

`split.revert()` runs after `ctx.revert()`, not before: `ctx.revert()` is what kills the reveal tween still holding references to `split.words`, and reverting the split first would rewrite those nodes back into plain text out from under a tween that has not been told to stop. `SplitText.create(".hero-copy p", …)` also matches all three lines the demo actually ships — eyebrow, headline and sub, not just the single line the layout sketch above shows — and none of them wait on `document.fonts.ready`. Inter loads from a `<link>`, not a preload; a fast mount can split the headline against the fallback face, and if that face wraps differently than Inter does, the per-word masks end up sized against a layout that shifts under them the moment the real font paints. If that is a real risk in your setup, gate the `SplitText.create` call — only that call, not the rest of the effect — behind `document.fonts.ready`, keep the effect itself synchronous, and check a cancellation flag before touching anything once the promise resolves.
