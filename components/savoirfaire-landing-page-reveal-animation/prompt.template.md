---
slug: savoirfaire-landing-page-reveal-animation
native_system: entry-veil
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 16
structural:
  - { kind: duration, literal: "0.85", rule: value/narrated }
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Landing Page Reveal — Slot-Machine Counter Preloader + Sparkle Wipe + 3D Headline Swing

## Goal
Build a full-screen, black editorial landing intro with a cinematic **preloader-to-hero reveal** that plays automatically once on page load (~10 seconds total). A giant two-digit number counts up like a slot machine (`00 → 24 → 47 → 79 → 85 → 99`) in the lower-left while the whole two-digit block slides across the bottom of the screen from left to right. Then three stacked four-point **sparkle/star SVGs** scale up from nothing to fill the screen in sequence — white, then lime, then black — wiping the loader away. Finally the loader is removed and the hero appears: the huge brand word **swings in with a 3D `rotateY` "page-turn"** while fading in, a white circular toggle button pops into place, and two small masked info lines slide up from behind their clips. Everything is plain GSAP (no plugins), driven by one timeline for the counter plus a few standalone tweens.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) **only** — no GSAP plugins (no ScrollTrigger, no SplitText, no CustomEase), no smooth-scroll library. The page never scrolls during the intro; it is a pure load-triggered sequence. Fire everything inside a `DOMContentLoaded` listener. `import gsap from "gsap";`.

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them). There is a fixed full-screen `.loader` overlay that sits on top of the `.container` hero and is `.remove()`d from the DOM at the very end.

```html
<div class="loader">
  <!-- TENS column: 6 stacked digits inside a clipped 180px window -->
  <div class="count-wrapper">
    <div class="count">
      <div class="digit"><h1>9</h1></div>
      <div class="digit"><h1>8</h1></div>
      <div class="digit"><h1>7</h1></div>
      <div class="digit"><h1>4</h1></div>
      <div class="digit"><h1>2</h1></div>
      <div class="digit"><h1>0</h1></div>
    </div>
  </div>

  <!-- UNITS column: 6 stacked digits inside a clipped 180px window -->
  <div class="count-wrapper">
    <div class="count">
      <div class="digit"><h1>9</h1></div>
      <div class="digit"><h1>5</h1></div>
      <div class="digit"><h1>9</h1></div>
      <div class="digit"><h1>7</h1></div>
      <div class="digit"><h1>4</h1></div>
      <div class="digit"><h1>0</h1></div>
    </div>
  </div>

  <!-- Three stacked centered sparkle stars used as the wipe -->
  <div class="revealer revealer-1"><svg><!-- sparkle path, fill: #fff --></svg></div>
  <div class="revealer revealer-2"><svg><!-- sparkle path, fill: #CDFD50 --></svg></div>
  <div class="revealer revealer-3"><svg><!-- sparkle path, fill: #000 --></svg></div>
</div>

<div class="container">
  <div class="site-info">
    <div class="line"><p>Digital &amp; Brand Design</p></div>
    <div class="line"><p>Photography &amp; Film Production</p></div>
  </div>
  <div class="toggle-btn">
    <img src="./icon.svg" alt="" />
  </div>
  <div class="header">
    <h1>HauteMuse</h1>
  </div>
</div>
```

Notes:
- Use **"HauteMuse"** as the neutral placeholder brand name (the hero headline).
- The **exact digit order matters** — as the strips step across their windows they reveal, in visited order, the sequence `00, 24, 47, 79, 85, 99` (a loader ticking toward 99). The tens column digits (top→bottom) are `9 8 7 4 2 0`; the units column digits are `9 5 9 7 4 0`.
- Each `.count-wrapper` is a **180px-wide clipped viewport**; the `.count` inside is a **1080px** flex row of six 180px digits, so only one digit shows through the window at a time.
- The three `.revealer` SVGs are the **same four-point sparkle/star shape**, only the `fill` differs: `.revealer-1` white `#fff`, `.revealer-2` lime `#CDFD50`, `.revealer-3` black `#000`. Use this exact path (viewBox `0 0 151 148`, width 151, height 148):
  ```
  M75.9817 0L77.25 34.2209C78.0259 55.1571 94.8249 71.9475 115.762 72.7127L150.982 74L115.762 75.2873C94.8249 76.0525 78.0259 92.8429 77.25 113.779L75.9817 148L74.7134 113.779C73.9375 92.8429 57.1385 76.0525 36.2019 75.2873L0.981689 74L36.2018 72.7127C57.1384 71.9475 73.9375 55.1571 74.7134 34.2209L75.9817 0Z
  ```
  (A four-pointed "twinkle" star with sharp tips and concave, pinched sides.)

## Styling

### Fonts
- Big display type (all the `h1`s: the digits and the hero word) uses **"PP Editorial Old"** — a light-weight editorial **serif** display face. It is a commercial font; keep the family name but supply a serif fallback (e.g. `"PP Editorial Old", Georgia, "Times New Roman", serif`). The important look is a **very light-weight, large serif** (`font-weight: lighter`).
- The two info lines (`.line p`) use **"PP Neue Montreal"** — a neutral grotesque **sans-serif** at `font-weight: 500`; fall back to `Helvetica, Arial, sans-serif`.

### Palette
- Background: `#000` (black) — both the `body` and the `.loader`.
- Text: `#fff` (white).
- Lime accent: `#CDFD50` (the middle revealer star).
- Toggle button fill: `#fff` (white circle) with a small black sparkle icon inside.

### Global
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `html, body { width:100%; height:100%; background:#000; color:#fff; font-family:"PP Editorial Old", Georgia, serif }`.
- `img { width:100%; height:100%; object-fit:cover }`.

### Loader + counter (initial states are load-bearing)
- `.loader`: `position:fixed; inset:0; width:100%; height:100%; background:#000; color:#fff; display:flex; align-items:flex-end; overflow:hidden`. The two `.count-wrapper` columns therefore sit **bottom-left**, side by side.
- `.count-wrapper`: `position:relative; width:180px; height:360px; clip-path:polygon(0 0,100% 0,100% 100%,0 100%); will-change:transform`. (The clip-path is the rectangular window that hides everything outside the 180px column.)
- `.count`: `position:relative; width:1080px; height:360px; display:flex; justify-content:space-between; transform:translateX(-1080px); will-change:transform`. **Initial `translateX(-1080px)`** parks the whole strip off to the left (window starts blank).
- `.digit`: `position:relative; width:180px; height:360px`.
- `.digit h1`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:max-content; font-size:360px; font-weight:lighter; line-height:1`. (Each numeral is huge and centered inside its 180px slot; the wrapper clip trims the overflow.)
- `.revealer`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)` (all three stacked dead-center of the screen).

### Hero (`.container`) — initial states are load-bearing
- `.container`: `position:relative; width:100vw; height:100vh; overflow:hidden`.
- `.site-info`: `position:absolute; top:2em; left:2em; display:flex; flex-direction:column; gap:0.125em` (two stacked labels, top-left).
- `.line`: `clip-path:polygon(0 0,100% 0,100% 100%,0 100%); height:18px` (an 18px-tall mask around each line).
- `.line p`: `position:relative; font-family:"PP Neue Montreal", Helvetica, sans-serif; font-size:14px; font-weight:500; letter-spacing:-0.125px; opacity:0.5; transform:translateY(18px); will-change:transform` (each line **parked one line-height below**, hidden inside its mask; note the muted `opacity:0.5`). Add `-webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale`.
- `.toggle-btn`: `position:absolute; top:2em; right:2em; width:60px; height:50px; background:#fff; border-radius:100%; transform:scale(0)` (a white pill/circle, top-right, **starts collapsed at scale 0**).
- `.toggle-btn img`: `transform:scale(0.5)` (the small black sparkle icon, shrunk to half inside the circle).
- `.header`: `position:absolute; left:0; bottom:0; padding:1em; transform-style:preserve-3d; perspective:2000px` (the 3D stage for the headline).
- `.header h1`: `position:relative; font-size:25vw; font-weight:lighter; letter-spacing:-0.02em; line-height:0.85; transform:rotateY(60deg); transform-origin:bottom left; will-change:transform; opacity:0`. (**Starts rotated 60° in Y, hinged on its bottom-left corner, and invisible** — an edge-on, closed "page" pinned to the lower-left.)

## GSAP effect (be exact)

All code runs inside `document.addEventListener("DOMContentLoaded", () => { ... })`.

### Setup / measurements
```js
const windowWidth = window.innerWidth;
const wrapperWidth = 180;
const finalPosition = windowWidth - wrapperWidth;   // how far the counter travels right
const stepDistance  = finalPosition / 6;            // rightward distance per count step
const tl = gsap.timeline();
```

### 1 — Counter strip: first step into view (`delay 0.5`)
```js
tl.to(".count", {
  x: -900,
  duration: 0.85,
  delay: 0.5,
  ease: "power4.inOut",
});
```
The `.count` strip moves from its CSS `-1080px` to `x:-900`, which slides the **last** digit (`0` / `0`) of each column into its 180px window → the counter reads **`00`**. `power4.inOut`, `0.85s`, after a `0.5s` initial delay.

### 2 — Counter strip: step through the remaining digits (6 chained tweens)
```js
for (let i = 1; i <= 6; i++) {
  const xPosition = -900 + i * 180;   // -720, -540, -360, -180, 0, 180
  tl.to(".count", {
    x: xPosition,
    duration: 0.85,
    ease: "power4.inOut",
    onStart: () => {
      gsap.to(".count-wrapper", {          // BOTH columns move right together
        x: stepDistance * i,               // step*1 … step*6 (absolute targets)
        duration: 0.85,
        ease: "power4.inOut",
      });
    },
  });
}
```
Each iteration appends a tween to the same timeline, so the six steps run **back-to-back** (`0.85s` each). As `.count` advances by `+180px` per step, the next digit up the column slides into each window, producing the read-out sequence **`00 → 24 → 47 → 79 → 85 → 99`** (and one final blank step at `x:180`, hidden by the wipe).

Crucially, each step's `onStart` fires a **separate** `gsap.to` on `.count-wrapper` (which matches **both** columns) to `x: stepDistance * i`. These are absolute targets, so the two-digit block marches rightward in six equal steps, ending flush against the right edge (`stepDistance*6 = finalPosition = windowWidth - 180`). Net effect: the counter counts up **and** sweeps from bottom-left to bottom-right, in lockstep, over ~6s (`0.5 + 7×0.85 ≈ 6.45s`).

### 3 — Sparkle-star wipe (three standalone tweens, delays 6 / 6.5 / 7)
```js
gsap.set(".revealer svg", { scale: 0 });   // all three stars start invisible

const delays = [6, 6.5, 7];
document.querySelectorAll(".revealer svg").forEach((el, i) => {
  gsap.to(el, {
    scale: 45,
    duration: 1.5,
    ease: "power4.inOut",
    delay: delays[i],
    onComplete: () => {
      if (i === delays.length - 1) {
        document.querySelector(".loader").remove();   // only after the LAST (black) star
      }
    },
  });
});
```
Each centered sparkle scales from `0` to **`45`** (~6800px wide — far larger than the viewport) over `1.5s`, `power4.inOut`. Staggered by their `delay`s they bloom one after another:
- `t=6.0–7.5`: **white** star grows and floods the screen white.
- `t=6.5–8.0`: **lime `#CDFD50`** star grows over it → screen goes lime.
- `t=7.0–8.5`: **black** star grows over that → screen goes black; on its `onComplete` the entire `.loader` is removed from the DOM, revealing the (black) hero seamlessly behind it.

### 4 — Hero headline 3D swing-in + toggle + info lines (`delay 8`)
```js
gsap.to(".header h1", {
  onStart: () => {
    gsap.to(".toggle-btn", { scale: 1, duration: 1, ease: "power4.inOut" });
    gsap.to(".line p",    { y: 0, duration: 1, stagger: 0.1, ease: "power3.out" });
  },
  rotateY: 0,
  opacity: 1,
  duration: 2,
  ease: "power3.out",
  delay: 8,
});
```
At `t=8` (well after the wipe finished and the loader is gone), the giant hero word animates from its initial `rotateY(60deg) / opacity:0` to `rotateY(0) / opacity:1` over **2s** with `power3.out` — because `.header` has `perspective:2000px` and the h1 has `transform-origin:bottom left`, the word swings open in 3D from an edge-on "closed page" into a flat, face-on headline while fading in.

Its `onStart` (also at `t=8`) fires two parallel standalone tweens:
- **Toggle button** pops from `scale(0)` to `scale(1)` over `1s`, `power4.inOut` (the white circle with the sparkle icon appears top-right).
- **Info lines** (`.line p`) slide from `translateY(18px)` up to `y:0` over `1s`, `power3.out`, **`stagger:0.1`** — each masked label rises into view one after the other from behind its 18px clip.

### Timeline summary (absolute seconds)
| t (s) | what |
|------|------|
| 0.5–1.35 | `.count` → `x:-900`; counter reads `00` |
| 1.35–6.45 | six chained steps: read-out `24 → 47 → 79 → 85 → 99` (`+180px`/step, `power4.inOut`), both `.count-wrapper` columns march right `step×1 … step×6` |
| 6.0–7.5 | white sparkle scales `0 → 45` (screen → white) |
| 6.5–8.0 | lime `#CDFD50` sparkle scales `0 → 45` (screen → lime) |
| 7.0–8.5 | black sparkle scales `0 → 45` (screen → black); on finish `.loader` removed |
| 8.0–10.0 | hero word swings `rotateY 60°→0°` + `opacity 0→1` (`power3.out`) |
| 8.0–9.0 | toggle button `scale 0→1` (`power4.inOut`); info lines `y:18→0`, `stagger 0.1` (`power3.out`) |

Total runtime ≈ **10s** (allow ~11s before considering it settled).

### Ease reference
- Counter strip steps **and** the wrapper travel **and** the sparkle wipe: `power4.inOut`.
- Toggle-button pop: `power4.inOut`.
- Hero headline swing **and** the info-line rise: `power3.out`.

## Assets / images
- **One raster/vector icon**, `icon.svg`: a small **black four-point sparkle/star glyph on a transparent background**, centered (at `scale(0.5)`) inside the white circular toggle button, top-right of the hero. Same "twinkle" silhouette as the revealer stars.
- The three **revealer sparkle SVGs are inline** (not image files) — reuse the path given above, colored white / `#CDFD50` / black. No photographic assets are used anywhere.

## Behavior notes
- **Autoplay once** on `DOMContentLoaded`; no scroll, hover, or click triggers. The page does not scroll during the intro.
- The `.loader` element is permanently `.remove()`d from the DOM after the black sparkle finishes — nothing relies on it existing afterward.
- The counter geometry reads `window.innerWidth` **once** on load, so `stepDistance` (how far the counter travels right) is computed for the initial viewport width; a mid-intro resize is not handled (fine for a one-shot preloader).
- Keep the `will-change` hints (`transform` on `.count`, `.count-wrapper`, `.line p`, `.header h1`) and the `clip-path` masks on `.count-wrapper` and `.line` — they are essential to both the reveal look and smooth performance.
- Keep `transform-style:preserve-3d` + `perspective:2000px` on `.header` and `transform-origin:bottom left` on its `h1`; without them the `rotateY` swing looks flat/wrong.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/savoirfaire-landing-page-reveal-animation/icon.svg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--noir`, `--ivory`, `--ivory-dim`, `--gold`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. That matters more here than in a quick hover effect: this is a single, roughly ten-second run-once sequence, so an unmount can land anywhere along it — mid-march through the slot-machine counter, mid-wipe while a sparkle star is scaling past the viewport, or after the loader is already gone and the hero word is mid-swing. Setup that runs twice with teardown that runs never leaves you two counters ticking out of step across the bottom of the screen, two sets of sparkle stars wiping the screen white/lime/black at staggered times, and — worse — a `.loader` node a stale copy of the component tries to delete out from under the one that replaced it. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`. That guard exists to survive being loaded late into a plain document; a React component's `useEffect` already runs after the DOM has committed, so the check and the listener are both dead weight. Drop both and move everything they wrap — the timeline that drives the two `.count` strips, the `gsap.set` that zeroes out the three `.revealer svg` stars, the loop that schedules them with their staggered delays, and the final `.header h1` swing — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — Most of this component's targets are plain CSS-selector strings handed straight to GSAP (`".count"`, `".count-wrapper"`, `".revealer svg"` in the `gsap.set`, `".header h1"`, `".toggle-btn"`, `".line p"`), so once they're created inside a `gsap.context` scoped to a root ref, GSAP resolves them against that ref automatically — there's no need to rewrite these as `rootRef.current.querySelector` calls. What the context's scoping does *not* reach is the two places this script talks to the DOM directly instead of handing GSAP a selector string: `document.querySelector(".loader")` and `document.querySelectorAll(".revealer svg")` (used to iterate the three stars and attach a different delay and `onComplete` to each). Both need to become `rootRef.current.querySelector(...)` / `querySelectorAll(...)`. The root ref itself has to wrap `.loader` and `.container` together — they're siblings, the full-screen overlay sitting on top of the hero, not container and content — so put it on whatever element renders both.

*(3) Cleanup* — Wrap the body in a `gsap.context` scoped to that root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    const tl = gsap.timeline();
    tl.to(".count", { x: -900 /* same delay + ease as above */ });

    for (let i = 1; i <= 6; i++) {
      const xPosition = -900 + i * 180;
      tl.to(".count", {
        x: xPosition,
        // same ease as above
        onStart: () => {
          // GSAP calls this only once the timeline actually reaches this step —
          // well after this factory has returned — so `self.add` is what
          // attributes the tween it creates back to this context.
          self.add(() => {
            gsap.to(".count-wrapper", { x: stepDistance * i /* same ease as above */ });
          });
        },
      });
    }

    gsap.set(".revealer svg", { scale: 0 });
    const delays = [6, 6.5, 7];
    rootRef.current.querySelectorAll(".revealer svg").forEach((el, i) => {
      gsap.to(el, {
        scale: 45,
        delay: delays[i],
        onComplete: () => {
          if (i === delays.length - 1) onLoaderDone();
        },
      });
    });

    gsap.to(".header h1", {
      rotateY: 0,
      opacity: 1,
      delay: 8,
      onStart: () => {
        self.add(() => {
          gsap.to(".toggle-btn", { scale: 1 });
          gsap.to(".line p", { y: 0 /* same stagger as above */ });
        });
      },
    });
  }, rootRef);

  return () => ctx.revert();
}, []);
```

`ctx.revert()` reaches everything created synchronously during that pass: both `.count` tweens chained onto `tl` (the initial step and all six that follow, even though each one waits its turn on the timeline), the `gsap.set` that zeroes the three stars, the three star tweens themselves — despite carrying delays of six, six-and-a-half and seven seconds each — and the standalone `.header h1` swing. Kill any of those before they've played and their callbacks simply never fire, so an unmount early in the sequence leaves nothing running.

It does not reach the four tweens this script creates *inside* an `onStart`: the `.count-wrapper` march (one instance per step of the six-step loop) and the `.toggle-btn` / `.line p` pair fired from the header tween's own `onStart`. None of those four exist yet when the factory above returns — GSAP calls `onStart` only once the timeline's playhead actually reaches that tween, which for the last pair is eight seconds into the mount. Wrapping the `gsap.to` inside each `onStart` in `self.add(() => { … })` is what attributes it to the context regardless of when GSAP happens to call it. Skip that wrapper and an unmount that lands after even one of these `onStart` callbacks has already fired — a real possibility given how much of this component's ten-second runtime happens after the callback that creates the toggle button and the info lines — leaves that tween still animating `.toggle-btn` or `.line p` on a subtree `ctx.revert()` has already reverted around it.

`onLoaderDone` above stands in for whatever replaces this script's `document.querySelector(".loader").remove()`. That call deletes a real DOM node while `.loader` is still JSX this component renders; do the same thing in React and the next time this subtree re-renders or unmounts, React throws trying to reconcile or remove a child it can no longer find. Flip a `showLoader` piece of state to `false` from `onLoaderDone` instead, and let `.loader`'s conditional render do the removal declaratively — or, if the loader has to stay mounted for some other reason, swap the `.remove()` for `gsap.set(loaderEl, { display: "none" })` and leave the node in place. Neither needs a cancellation flag the way an async continuation would: the tween carrying that `onComplete` is created synchronously above, so `ctx.revert()` already kills it outright on an early unmount, and a killed tween never reaches its `onComplete` at all.
