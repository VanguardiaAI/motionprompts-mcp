---
slug: zajno-lp
native_system: entry-veil
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 2
structural_literals: 13
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power3.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"hop\"", rule: value/narrated }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Landing Page Reveal — Random-Tick Counter Preloader + Clip-Path Hero Unmask

## Goal
Build a full-viewport editorial studio landing hero with a **preloader-to-hero reveal** that plays automatically once on page load (~7 seconds total). A tiny centered number, masked inside a small clipping window, slides up into view and rapidly ticks `0 → 100` with irregular random jumps. The instant it hits 100 it slides up and out of its window, and that same moment fires the reveal: a scaled-down (`0.7`), clip-path-collapsed hero opens from its bottom edge upward while scaling up to full size; the dark overlay covering it wipes upward off the top; the bottom hero image strip de-zooms from `2x` to `1x`; and the giant `38.5vw` headline's per-character `<span>`s rise up from far below into place with a stagger. Everything is driven by chained standalone GSAP tweens (no master timeline), stitched together with `onComplete` / `onStart` callbacks, using a `CustomEase` named `hop` plus `power3`/`power4` eases.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the single GSAP plugin **`CustomEase`** (`import { CustomEase } from "gsap/CustomEase"`). No smooth-scroll library — the page does not scroll (`.container` is `overflow: hidden`, exactly one viewport). Register the plugin with `gsap.registerPlugin(CustomEase)` and run the whole sequence inside a `DOMContentLoaded` listener.

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```
<div class="container">
  <div class="counter">
    <p>0</p>
  </div>

  <section class="hero">
    <div class="overlay"></div>

    <nav>
      <div class="nav-col">
        <div class="nav-items"><a href="#">zayno</a></div>
        <div class="nav-items"><p>digital studio</p></div>
      </div>
      <div class="nav-col">
        <div class="nav-items">
          <a href="#">work</a><a href="#">studio</a><a href="#">contact</a>
        </div>
        <div class="nav-items">
          <a href="#">twitter</a><a href="#">instagram</a>
        </div>
        <div class="nav-items"><p>toronto, ca</p></div>
      </div>
    </nav>

    <div class="header"><h1>zayno</h1></div>

    <div class="hero-img"><img src="..." alt="" /></div>
  </section>
</div>
```

Notes:
- `.container` is the single 100vw × 100vh clipping frame (`overflow: hidden`); everything is absolutely positioned inside it.
- `.counter` holds one `<p>0</p>` — this same element is later mutated by the ticker and also GSAP-animated.
- Use **"zayno"** as the neutral placeholder studio name (both the nav logo and the hero headline). Nav text is neutral studio boilerplate: `digital studio`, `work / studio / contact`, `twitter / instagram`, `toronto, ca`.
- `.hero` wraps four stacked layers in DOM order: `.overlay` (dark cover, top of stack), `nav`, `.header` (giant word), `.hero-img` (bottom image strip).

## Styling
Fonts: body declares `font-family: "Test Söhne"`; the headline declares `.header h1 { font-family: "Blanquotey" }`. **Both are proprietary faces that are NOT bundled and NOT loaded** (no `@font-face`, no `<link>`) — declare the exact family names but do not attempt to fetch them; the browser falls back to its default (serif) for both, which is how the original renders. Optionally append a generic fallback.

Palette:
- Background `#ebebeb` (light warm grey) — the page/body.
- Text / overlay `#1a1a1a` (near-black).

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `html, body { width:100%; height:100%; font-family:"Test Söhne"; background:#ebebeb; color:#1a1a1a }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `p, a { text-decoration:none; font-size:13px; color:#1a1a1a }`.

Key elements and their **initial states** (the animation depends on these exactly):

- `.container`: `width:100vw; height:100vh; overflow:hidden`.

- `.counter`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:40px; height:20px; text-align:center; z-index:0`. **Initial** `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%)` (full rectangle — a fixed 40×20px window that clips its content).
- `.counter p`: `position:relative; display:block; transform:translateY(20px)` (pushed down exactly one window-height, so it sits just BELOW the window and is hidden).

- `.hero`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) scale(0.7); width:100vw; height:100vh; will-change:transform; z-index:1`. **Initial** `clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)` (all four corners collapsed onto the BOTTOM edge → zero height → hidden). So the hero starts shrunk to `0.7` and clipped to nothing.

- `.overlay`: `position:absolute; top:0; left:0; width:100%; height:100%; background:#1a1a1a; z-index:2`. **Initial** `clip-path: polygon(0 100%, 100% 100%, 100% 0, 0 0)` (full rectangle — a solid dark panel covering the entire hero; it is the top-most layer inside `.hero`).

- `nav`: `position:absolute; top:0; left:0; width:100%; padding:1em; display:flex` (no z-index → sits below the overlay, revealed when the overlay wipes). `.nav-col { flex:1; display:flex }`. `.nav-items { flex:1; display:flex; flex-direction:column }`. `.nav-col:nth-child(2) .nav-items:last-child p { text-align:right }`.

- `.header`: `position:absolute; width:100%; top:-5%; left:0; z-index:1`. **Static** `clip-path: polygon(0 100%, 100% 100%, 100% 0, 0 0)` (full rectangle — this one is NEVER animated; it just masks the overflow of the rising spans).
- `.header h1`: `font-family:"Blanquotey"; font-size:38.5vw; font-weight:lighter; text-align:center; line-height:100%` (one enormous centered word spanning the viewport).
- `.header h1 span`: `position:relative; display:inline-block; transform:translateY(500px)` (each character parked 500px below its final position, hidden well under the `.header` clip window).

- `.hero-img`: `position:absolute; bottom:0; width:100%; height:35vh; overflow:hidden; z-index:0` (a full-width strip pinned to the bottom, 35vh tall).
- `.hero-img img`: `transform:scale(2)` (the image starts zoomed to 2×, cover-cropped).

Z-index stack inside `.hero` (matters for the reveal to read right): `.hero-img` (0) & `nav` (auto) < `.header` (1) < `.overlay` (2). The dark overlay covers everything until it wipes up.

## GSAP effect (be exact)

### Setup
```js
gsap.registerPlugin(CustomEase);
CustomEase.create(
  "hop",
  "M0,0 C0.29,0 0.348,0.05 0.422,0.134 0.494,0.217 0.484,0.355 0.5,0.5 0.518,0.662 0.515,0.793 0.596,0.876 0.701,0.983 0.72,0.987 1,1 "
);
```
Note: `hop` is defined in **SVG-path form** (not the 4-number cubic-bezier shorthand). Reproduce this exact path string — it is a springy, slightly wavy accelerate-then-settle in-out curve used for the two clip-path animations.

**Manual character split** (NOT the SplitText plugin): a small helper wraps every character of `.header h1` in its own `<span>`. Take the element's `innerText`, `split("")`, map each char to `` `<span>${char === " " ? "&nbsp;&nbsp;" : char}</span>` `` (a space becomes two `&nbsp;`), `join("")`, and write it back as `innerHTML`. Run this on `.header h1` before animating. (For the word "zayno" this yields 5 spans, no spaces.)

There is **no master timeline** — the effect is a chain of independent `gsap.to()` calls wired together through callbacks. Sequence:

### 1 — Counter number slides into its window (fires on load, `delay: 1`)
```js
gsap.to(".counter p", {
  y: 0,
  duration: 1,
  ease: "power3.out",
  delay: 1,
  onComplete: () => animateCounter(),
});
```
After a **1s** initial delay, the `<p>` slides from `translateY(20px)` up to `y: 0` over **1s** with `power3.out`, sliding "0" up into the 20px clip window. On complete it launches the ticker.

### 2 — The random-increment ticker (`animateCounter`, plain JS, NOT a GSAP tween)
A hand-rolled counter, not a tween:
```js
const el = document.querySelector(".counter p");
let currentValue = 0;
const updateInterval = 300;   // ms between ticks
const maxDuration   = 2000;   // ms total counting window
const endValue      = 100;
const startTime = Date.now();

const updateCounter = () => {
  const elapsed = Date.now() - startTime;
  if (elapsed < maxDuration) {
    currentValue = Math.min(currentValue + Math.floor(Math.random() * 30) + 5, endValue);
    el.textContent = currentValue;
    setTimeout(updateCounter, updateInterval);
  } else {
    el.textContent = endValue;                 // snap to 100
    setTimeout(() => {
      gsap.to(el, {
        y: -20,
        duration: 1,
        ease: "power3.inOut",
        onStart: () => revealLandingPage(),
      });
    }, -500);                                   // negative delay → fires next tick
  }
};
updateCounter();
```
So the number jumps upward by a random `5–34` every **300ms**, clamped at 100, for **2000ms** (~7 irregular ticks). When the 2s window closes it snaps to `100`, then the same `<p>` tweens `y: 0 → -20` (slides up and out the TOP of its window) over **1s** `power3.inOut`, and its `onStart` triggers the whole page reveal at the same instant.

### 3 — The reveal (`revealLandingPage`) — one outer tween whose `onStart` fires four parallel tweens
```js
const revealLandingPage = () => {
  gsap.to(".hero", {
    clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
    duration: 2,
    ease: "hop",
    onStart: () => {
      gsap.to(".hero", {
        transform: "translate(-50%, -50%) scale(1)",
        duration: {{motion.duration.slow}}, ease: "power3.inOut", delay: 0.25,
      });
      gsap.to(".overlay", {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
        duration: 2, delay: 0.5, ease: "hop",
      });
      gsap.to(".hero-img img", {
        transform: "scale(1)",
        duration: {{motion.duration.slow}}, ease: "power3.inOut", delay: 0.25,
      });
      gsap.to(".header h1 span", {
        y: 0,
        stagger: 0.1,
        duration: 2, ease: "power4.inOut", delay: 0.75,
      });
    },
  });
};
```
Breaking down each simultaneous tween (all start at reveal time `t0`, offset by their own `delay`):

- **(a) Hero clip-path opens — `t0`, duration 2, `hop`.** `.hero` clip-path animates from the collapsed bottom edge `polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)` to the full rectangle `polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)` — the top two vertices travel from `y:100%` up to `y:0%`, so the hero unmasks from the bottom upward. This is the outer tween; its `onStart` fires the other three the same frame.

- **(b) Hero scales up — `t0 + 0.25`, duration 2.25, `power3.inOut`.** `.hero` `transform` goes from `translate(-50%,-50%) scale(0.7)` to `... scale(1)` — the whole hero grows from 70% to full size, staying centered, in near-lockstep with the clip-path opening.

- **(c) Overlay wipes upward off the top — `t0 + 0.5`, duration 2, `hop`.** `.overlay` clip-path animates from the full rectangle `polygon(0 100%, 100% 100%, 100% 0, 0 0)` to the top-edge-collapsed `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)` — the bottom two vertices travel from `y:100%` up to `y:0%`, so the dark panel retracts upward and off, uncovering the nav, headline and image beneath it.

- **(d) Hero image de-zooms — `t0 + 0.25`, duration 2.25, `power3.inOut`.** `.hero-img img` `transform` goes from `scale(2)` to `scale(1)` — the bottom image strip un-zooms to its natural framing as the overlay clears it.

- **(e) Headline characters rise — `t0 + 0.75`, duration 2, `power4.inOut`, stagger 0.1.** Every `.header h1 span` animates `y: 500px → 0`, left-to-right, each starting **0.1s** after the previous, so the giant word climbs into place letter by letter behind the (static) header mask.

### Timeline summary (approximate absolute seconds from load)
| t (s) | what |
|-------|------|
| 1.0–2.0 | counter `<p>` slides up into its window (`y:20→0`, power3.out) |
| ~2.0–4.0 | random ticker `0 → 100` (jumps of 5–34 every 300ms, over 2000ms) |
| ~4.0 | snap to 100 → counter slides out top (`y:0→-20`, power3.inOut) AND reveal fires (`onStart`) |
| ~4.0–6.0 | hero clip-path opens bottom→full (`hop`) |
| ~4.25–6.5 | hero scales `0.7→1` + hero image de-zooms `2→1` (power3.inOut) |
| ~4.5–6.5 | dark overlay wipes upward off the top (`hop`) |
| ~4.75–6.9 | headline spans rise `y:500→0`, stagger 0.1 (power4.inOut) |

Total runtime ≈ **7s**.

### Ease reference
- `hop` = the SVG-path `CustomEase` above (springy in-out) — used for BOTH clip-path animations (hero open + overlay wipe).
- Counter slide-in uses `power3.out`; counter slide-out uses `power3.inOut`.
- Hero scale + image de-zoom use `power3.inOut`.
- Headline character rise uses `power4.inOut`.

## Assets / images
**One** hero image, used as the bottom full-width strip (`.hero-img`, `height:35vh`, `object-fit:cover`, starting `scale(2)`, de-zooming to `1`). It is a **moody, warm-toned editorial photograph** — low-key, atmospheric, with warm amber/brown tones that sit well against the light-grey page and dark type. Aspect ratio is flexible since it is cover-cropped inside the strip; any dark, warm, editorial full-bleed image works. If unavailable, use any single moody warm-toned photo.

## Behavior notes
- **Autoplay once** on load (`DOMContentLoaded`); no scroll, hover, or click triggers. The page never scrolls — `.container` is exactly one viewport with `overflow: hidden`.
- The counter number and its slide/tick logic operate on the **same** `.counter p` element throughout (slide-in → text-ticker → slide-out); don't split these into separate nodes.
- Keep the `will-change: transform` hint on `.hero` — it matters for the smooth simultaneous scale + clip-path.
- The `.header` clip-path is static (a mask); only the `.overlay` and `.hero` clip-paths animate.
- **Responsive** (`@media max-width: 900px`): the first nav column's second `<p>` becomes right-aligned; the entire second nav column is `display:none`; `.header` re-anchors to `top:30%`; `.hero-img` grows to `height:50vh`. The animation itself is unchanged — only layout adapts.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/zajno-lp/hero-img-3.jpg
https://motionprompts.dev/c/zajno-lp/work-01.jpg
https://motionprompts.dev/c/zajno-lp/work-02.jpg
https://motionprompts.dev/c/zajno-lp/work-03.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--muted`, `--ember`, `--cream`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, drives its entire preloader-to-hero reveal exactly once with plain `document.querySelector` lookups, and never has to undo any of it because the page underneath it never reloads. React withdraws all three of those guarantees at once, and it does it quietly — the counter still ticks and the hero still opens, but something underneath can now be running twice, or still running after the section it was animating is gone.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component's reveal is not one timeline you can revert in a single step — it is a relay of independent `gsap.to()` calls chained through `onComplete`/`onStart`, kicked off by a hand-rolled `setTimeout` ticker, exactly as described above. Run that relay twice without a teardown that catches every link in it and you get two counters racing toward 100 in the same 20px window, two reveals opening the same `.hero`, or — the more insidious case — a first mount's ticker still alive and writing into the second mount's live DOM well after the first mount is gone. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no `readyState` guard. By the time a React component mounts, that event has already fired, so the listener is never invoked and the entire reveal — `CustomEase.create`, the character split, the counter, the four-tween hero open — silently never runs, with nothing to point at why. Delete the listener and move its body into a `useEffect` with an empty dependency array.

*(2) Element lookups* — This script mixes two lookup styles for the same elements, and only one of them gets scoped for free. The tweens created with a selector string — `gsap.to(".counter p", …)`, and every `.hero` / `.overlay` / `.hero-img img` / `.header h1 span` tween inside `revealLandingPage` — are automatically confined to the root ref's subtree once that ref is passed as `gsap.context`'s scope; those strings need no rewriting. What is *not* covered is the two places the script calls the DOM API directly: `splitTextIntoSpans`'s `document.querySelectorAll(".header h1")` and `animateCounter`'s `document.querySelector(".counter p")`. Rewrite both against the root ref instead of `document`. This isn't cosmetic here: during the StrictMode remount two `.header h1` elements briefly coexist, and an unscoped `querySelectorAll` can split the copy that's on its way out, leaving the surviving copy with its original, unsplit text and no per-character spans for the headline tween to find.

*(3) Cleanup* — Wrap the sequence in a `gsap.context` scoped to the root ref, and revert it on cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    // CustomEase is already registered at module scope (see below);
    // the split, the counter tween, and everything it eventually triggers go here
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` only undoes what was *created* during that synchronous call — and for this script, that's a smaller set than it looks like.

### Most of this component's tweens are created after the factory has already returned

The prompt above is explicit that there is no master timeline: the reveal is "a chain of independent `gsap.to()` calls wired together through callbacks." That structure is exactly what breaks a naive `gsap.context` wrap. Only the very first tween — `gsap.to(".counter p", { y: 0, onComplete: animateCounter, … })` — is *called* synchronously inside the factory, so it's the only one `gsap.context` auto-tracks. Everything downstream is created from inside a callback that fires later, once the factory has already returned control: `animateCounter`'s `onComplete`, the counter's slide-out tween built inside `updateCounter`'s terminal branch, and the four parallel tweens `revealLandingPage` builds from that tween's `onStart`. None of those are auto-recorded. A bare `ctx.revert()` on an unmount mid-sequence would leave the hero clip-path mid-open, the overlay mid-wipe, and the headline spans mid-rise.

Wrap each deferred creation site in `self.add(() => { … })`, closing over the `self` the factory received — which means `revealLandingPage`, `animateCounter`, and `updateCounter` all need to be nested functions defined inside the `gsap.context` factory from (3), not hoisted above it. Never `ctx` for this (the absolute rule holds here too: inside anything that runs as part of this factory, including callbacks defined within it, the binding is `self`, never `ctx`):

```jsx
const revealLandingPage = () => {
  self.add(() => {
    gsap.to(".hero", { clipPath: OPEN_PATH, onStart: () => {
      gsap.to(".hero", { transform: SCALE_TO_FULL });
      gsap.to(".overlay", { clipPath: WIPE_PATH });
      gsap.to(".hero-img img", { transform: DEZOOM });
      gsap.to(".header h1 span", { y: 0 });
      // eases, delays and the stagger between spans are exactly as specified above
    }});
  });
};
```

### The counter's ticker is a self-rescheduling `setTimeout`, and nothing cancels it

`updateCounter` is not a tween — it's a hand-rolled `setTimeout` relay that reschedules itself every tick until the counting window closes, then schedules one more `setTimeout` that starts `revealLandingPage`. None of these timer ids are captured anywhere in the script, so nothing in the original code can stop the relay once it starts, and `gsap.context` cannot help either: a pending `setTimeout` is not a GSAP object, and `self.add` only registers a tween once its creation call actually runs — a call still sitting in the timer queue when the component unmounts hasn't run yet.

The StrictMode double-mount happens to be harmless here for an incidental reason, not a structural one: the first mount's cleanup runs well inside the first tween's one-second delay, so `ctx.revert()` kills that tween before its `onComplete` ever calls `animateCounter`, and the discarded mount's ticker never starts. A real unmount is a different case — a user navigating away partway through the sequence leaves the relay running independently of any tween the context knows about; the next scheduled tick fires anyway, re-queries `.counter p`, and writes into whatever element that selector now matches.

Keep the handle and a cancellation flag, and check both before scheduling the next tick and before kicking off the reveal:

```jsx
function animateCounter() {
  const el = /* the scoped .counter p lookup, per (2) above */;
  const start = Date.now();
  const tick = () => {
    if (cancelled) return;
    if (Date.now() - start < COUNTING_WINDOW) {
      // bump the value, write it to el.textContent, exactly as above
      tickHandle = setTimeout(tick, TICK_INTERVAL);
    } else {
      el.textContent = END_VALUE;
      tickHandle = setTimeout(() => {
        if (cancelled) return;
        self.add(() => gsap.to(el, { y: -20, onStart: revealLandingPage }));
      }, REVEAL_KICKOFF_DELAY);
    }
  };
  tick();
}
```

with `cancelled` and `tickHandle` declared alongside `ctx` in the effect, and the cleanup extended to `() => { cancelled = true; clearTimeout(tickHandle); ctx.revert(); }`.

### The character split needs no revert call, but still has to run inside the scoped effect

`splitTextIntoSpans` is a hand-rolled split, not the SplitText plugin — it reads `.header h1`'s `innerText` and overwrites `innerHTML` wholesale, so a repeat call doesn't nest a second layer of spans inside the first the way re-running SplitText on its own output does; it just regenerates the same flat set of character spans from the same underlying text. A StrictMode remount's second split is harmless on its own for that reason. It only becomes a problem in combination with the scoping issue in (2): an unscoped split racing against whichever `.header h1` happens to exist at that instant is what causes damage, not the split itself.

### `CustomEase.create("hop", …)` belongs next to `gsap.registerPlugin`, not inside the effect

Both calls register something globally on the `gsap` engine — a plugin and a named ease — and neither touches the DOM nor needs to be undone. Put them together at module scope, next to the imports. Re-creating the `"hop"` ease on every mount and every StrictMode remount is harmless but pointless, exactly like re-registering the plugin.
