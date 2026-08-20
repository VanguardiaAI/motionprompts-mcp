# Capsules Animated Sticky Columns — scroll-pinned phased column swap

## Goal

Build a full-page scroll experience with a pinned full-screen section containing four rounded "capsule" columns (two text capsules, two image capsules). As the user scrolls through the pinned section, the columns swap in two discrete phases: new capsules slide in from the right/bottom while the previous one fades and scales away, an image is revealed with a growing clip-path wipe, and a text block swaps via SplitText line masks. Scrolling back up reverses each phase.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins `ScrollTrigger` and `SplitText`, and `lenis` (npm) for smooth scrolling. Everything runs inside a `DOMContentLoaded` listener. Register plugins with `gsap.registerPlugin(ScrollTrigger, SplitText)`.

Lenis wiring (exact pattern):

- `const lenis = new Lenis()` (default options).
- `lenis.on("scroll", ScrollTrigger.update)`.
- `gsap.ticker.add((time) => lenis.raf(time * 1000))`.
- `gsap.ticker.lagSmoothing(0)`.

## Layout / HTML

Three sections, each `100vw` × `100svh`:

1. `<section class="intro">` — a single centered `<h1>` (e.g. "We create modern interiors that feel effortlessly personal.").
2. `<section class="sticky-cols">` — the pinned section. Inside it a `<div class="sticky-cols-wrapper">` containing four absolutely-positioned columns:
   - `<div class="col col-1">` → `<div class="col-content">` → `<div class="col-content-wrapper">` with an `<h1>` (e.g. "We design spaces where comfort meets quiet sophistication.") and a `<p>` (a two-sentence supporting paragraph about layered textures and thoughtful details).
   - `<div class="col col-2">` → two stacked image capsules: `<div class="col-img col-img-1">` and `<div class="col-img col-img-2">`, each containing `<div class="col-img-wrapper">` → `<img>` (image 1 and image 2).
   - `<div class="col col-3">` → two stacked text blocks: `<div class="col-content-wrapper">` (an `<h1>` like "Our interiors are crafted to feel as calm as they look." + a supporting `<p>`) and `<div class="col-content-wrapper-2">` (an `<h1>` like "Every detail is chosen to bring ease and elegance into your space." + a supporting `<p>`).
   - `<div class="col col-4">` → `<div class="col-img">` → `<div class="col-img-wrapper">` → `<img>` (image 3).
3. `<section class="outro">` — a single centered `<h1>` (e.g. "Timeless design begins with a conversation.").

## Styling

- Fonts: **Inter** on `body`, **Space Grotesk** for `h1`, **Space Mono** for the small uppercase labels (eyebrow, image tags, scroll hint, footer).
- CSS variables — the page is a **pour of acid lime**, and the capsules are bone-white plates floating on it:
  ```css
  :root {
    --acid-hi: #eff28f;   /* lime, top of the pour */
    --acid-lo: #dcea4e;   /* lime, bottom of the pour */
    --acid: #e5ee6e;      /* flat lime for pills and hover fills */
    --paper: #fbfbf3;     /* the capsule surface */
    --ink: #111111;
    --ink-soft: rgba(17, 17, 17, 0.72);
    --hairline: rgba(17, 17, 17, 0.14);
  }
  ```
- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `section { position: relative; width: 100vw; height: 100svh; background: linear-gradient(to bottom, var(--acid-hi), var(--acid-lo)); color: var(--ink); overflow: hidden; }` — every section carries the same vertical lime gradient, so the scroll reads as one continuous pour.
- Type: `h1 { font-size: 2.5rem; font-weight: 500; line-height: 1.1; }`, `p { font-size: 1rem; font-weight: 500; }`. Intro/outro sections are flex-centered and their `h1` is `width: 50%; text-align: center;`.
- `img { width: 100%; height: 100%; object-fit: cover; }`.
- `.sticky-cols { padding: 0.5rem; }`, `.sticky-cols-wrapper { position: relative; width: 100%; height: 100%; }`.
- `.col { position: absolute; width: 50%; height: 100%; will-change: transform; }`. Inside columns the type is ink on the bone capsule: `h1 { width: 60%; }`, `p { color: var(--ink-soft); width: 60%; }`.
- Initial offsets (plain CSS transforms — these are the "off-stage" positions):
  - `.col-2 { transform: translateX(100%); }` (right half, on screen).
  - `.col-3 { transform: translateX(100%) translateY(100%); padding: 0.5rem; }` (off-screen bottom-right).
  - `.col-4 { transform: translateX(100%) translateY(100%); }` (off-screen bottom-right).
  - `.col-1` has no offset (left half, on screen).
- Capsule look: `.col-content, .col-img { position: relative; width: 100%; height: 100%; padding: 0.5rem; }`; `.col-content-wrapper, .col-img-wrapper { position: relative; width: 100%; height: 100%; background-color: var(--paper); border-radius: 3rem; overflow: hidden; box-shadow: inset 0 0 0 1px var(--hairline); }` (radius drops to `1.6rem` on mobile). `.col-content-wrapper` also gets `padding: 2.5rem; display: flex; flex-direction: column; justify-content: space-between;` (h1 at top, p at bottom).
- `.col-content-wrapper-2 { position: absolute; top: 0; left: 0; width: 100%; height: 100%; padding: 2.5rem; display: flex; flex-direction: column; justify-content: space-between; }` — it sits exactly on top of col-3's first wrapper (note: no background of its own).
- Stacked images in col-2: `.col-img-1, .col-img-2 { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }`.
- `.col-img-2 { clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%); }` — a zero-height sliver at the top, so image 2 starts fully hidden.
- `.col-img-2 img { scale: 1.25; }` — image 2 starts zoomed in.
- Line-mask helpers for SplitText: `.line { overflow: hidden; }` and `.line span { display: block; will-change: transform; }`.
- Media query `@media (max-width: 1000px)`: `h1 { font-size: 1.25rem; }`, `p { font-size: 0.85rem; }`, `.col h1, .col p { width: 100%; }`, wrappers' padding drops to `2rem`.

### On a phone

Two capsules share a 390px screen, so each one is ~187px wide and the whole mobile pass is about making a half-width capsule readable. **The 50% column width is not a style choice and must not be touched.** Every phase tween moves a column by `translateX(100%)`, and a percentage translate is measured against the element's own width: at 50% a column lands exactly on the other half. Widen `.col` to 58% "so the text fits" and `col-2`/`col-3` — the two columns that have to occupy *both* slots during the sequence — hang off the right edge on one of their two stops, while `col-4`, which is only ever tweened on `y`, walks off screen entirely and its photo is never seen. Compensating with `left` fixes one slot and breaks the other. Widen the content, never the column:

- `@media (max-width: 768px)`: `p { font-size: 0.8125rem; }` (13px is the floor for running copy in a strip this narrow), `h1 { font-size: 1.1rem; line-height: 1.2; }`, capsule radius `1.6rem`, wrapper padding `1.5rem 1.15rem`.
- **Centre the capsule copy** — swap `justify-content: space-between` for `center` plus a `gap` on `.col-content-wrapper` and `.col-content-wrapper-2`. The desktop split (heading pinned to the top, paragraph to the bottom) works on an 845px-tall plate; on a phone the same rule leaves a dead middle two thirds of the capsule high, and the paragraph sits so low it is still below the fold while the section is settling into the pin. Resist the temptation to fill that hole with a decorative label: in `col-3` only the *first* text block would carry it, so it blinks out halfway through the swap.
- **Push the pinned section below the fixed header** — `.sticky-cols { padding-top: 3.4rem; }`. With the desktop `0.5rem` the capsule starts 8px from the top and the wordmark sits on the bone plate, a few pixels above the capsule's own eyebrow. It costs ~54px of capsule height and gives the header its own band of lime.
- **The image tags wrap, they do not ellipse** — the base rule is `p.img-tag` (type + class). A mobile override written as `.img-tag { … }` loses the specificity contest and silently does nothing: the tag keeps its desktop `white-space: nowrap` and renders "Casa Alzina …". Repeat the type in the override and allow two lines.
- **`object-position` is horizontal-only here** — the photos are 4:5 and the mobile capsule is roughly 1:4, so `cover` matches the height and crops ~70% of the *width*. The vertical half of `object-position` has no effect at all; nudge the frame sideways (e.g. `40% 50%`) to keep the subject in the sliver.
- Sections are `100svh`, not `100vh`, so the pinned height never jumps when the mobile URL bar retracts. The trade is a strip of body background uncovered at the bottom when it does — paint `body` with the bottom colour of the gradient (`--acid-lo`) on mobile so it reads as more pour instead of a band.

## GSAP effect (the core — follow exactly)

### 1. SplitText setup (col-3 text swap)

On init, split every `.col-3 h1, .col-3 p` element with `new SplitText(element, { type: "lines", linesClass: "line" })`. Then, for each resulting line element, manually wrap its text in a span: `line.innerHTML = `<span>${line.textContent}</span>``. Combined with the `.line { overflow: hidden }` CSS this creates per-line masks.

Initial states (gsap.set):

- `.col-3 .col-content-wrapper .line span` → `{ y: "0%" }` (first text block visible).
- `.col-3 .col-content-wrapper-2 .line span` → `{ y: "-125%" }` (second text block hidden above its line masks).

### 2. ScrollTriggers

Two separate ScrollTriggers on the same trigger element `.sticky-cols`:

- **Pin trigger:** `{ trigger: ".sticky-cols", start: "top top", end: `+=${window.innerHeight * 5}px`, pin: true, pinSpacing: true }`. No animation attached — it only pins.
- **Progress trigger:** `{ trigger: ".sticky-cols", start: "top top", end: `+=${window.innerHeight * 6}px`, onUpdate: (self) => { ... } }`. Note the end distance is 6× viewport height (intentionally longer than the pin), so the phase thresholds at 33%/66% of this trigger land inside the pinned range.

### 3. Phase state machine (inside onUpdate)

Keep a `let currentPhase = 0` variable outside the trigger. In `onUpdate`, read `self.progress` and fire tweens ONCE per threshold crossing (not scrubbed — these are discrete `gsap.to` tweens triggered by crossing a progress value):

**Phase 0 → 1** (when `progress >= 0.33 && currentPhase === 0`; set `currentPhase = 1`). All tweens `duration: 0.75`, default ease:

- `.col-1` → `{ opacity: 0, scale: 0.75 }` (left text capsule fades/shrinks away).
- `.col-2` → `{ x: "0%" }` (image column slides from the right half to the left half).
- `.col-3` → `{ y: "0%" }` (text column rises from below into the right half — its X stays at 100% from the CSS transform).
- `.col-img-1 img` → `{ scale: 1.25 }` (first image zooms in).
- `.col-img-2` → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }` (second image wipes open from the top edge to full height, revealing it over image 1).
- `.col-img-2 img` → `{ scale: 1 }` (second image zooms out from 1.25 to 1 while being revealed).

**Phase 1 → 2** (when `progress >= 0.66 && currentPhase === 1`; set `currentPhase = 2`). All `duration: 0.75`:

- `.col-2` → `{ opacity: 0, scale: 0.75 }` (image column fades/shrinks away).
- `.col-3` → `{ x: "0%" }` (text column slides from right half to left half).
- `.col-4` → `{ y: "0%" }` (final image column rises from below into the right half).
- `.col-3 .col-content-wrapper .line span` → `{ y: "-125%", duration: 0.75 }` (first text block's lines exit upward through their masks).
- `.col-3 .col-content-wrapper-2 .line span` → `{ y: "0%", duration: 0.75, delay: 0.5 }` (second text block's lines drop in from above, starting 0.5s later).

**Reverse 1 → 0** (when `progress < 0.33 && currentPhase >= 1`; set `currentPhase = 0`). Mirror every phase-1 tween back to its start value, all `duration: 0.75`: `.col-1` → `{ opacity: 1, scale: 1 }`, `.col-2` → `{ x: "100%" }`, `.col-3` → `{ y: "100%" }`, `.col-img-1 img` → `{ scale: 1 }`, `.col-img-2` → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" }`, `.col-img-2 img` → `{ scale: 1.25 }`.

**Reverse 2 → 1** (when `progress < 0.66 && currentPhase === 2`; set `currentPhase = 1`). All `duration: 0.75`: `.col-2` → `{ opacity: 1, scale: 1 }`, `.col-3` → `{ x: "100%" }`, `.col-4` → `{ y: "100%" }`, `.col-3 .col-content-wrapper .line span` → `{ y: "0%", duration: 0.75, delay: 0.5 }` (delay on the incoming block), `.col-3 .col-content-wrapper-2 .line span` → `{ y: "-125%", duration: 0.75 }`.

No custom eases anywhere — every tween uses GSAP's default ease (`power1.out`). No timelines; all tweens in a phase start simultaneously (except the noted `delay: 0.5`).

## Assets / images

3 interior-design photographs, used as full-bleed `object-fit: cover` fills inside rounded capsules of roughly half the viewport width × full viewport height (portrait-ish crop is safest). Each capsule also carries a small `.img-tag` pill naming the project. Against the lime pour, rooms shot quiet and neutral work best — the ground is already the loudest thing on screen:

1. Image 1 — first image capsule in col-2, visible from the start.
2. Image 2 — second image capsule in col-2, hidden by the zero-height clip-path and revealed in phase 1.
3. Image 3 — final image capsule in col-4, slides up in phase 2.

No logos or brand marks; keep copy neutral (interior design studio voice).

## Behavior notes

- The whole animation is scroll-driven but the tweens themselves are time-based (0.75s), fired at thresholds — it should feel like snappy state changes, not scrubbing.
- Scrolling back up must reverse each phase via the mirror tweens above.
- The intro and outro sections scroll normally before/after the pinned section; pinSpacing keeps the document flow.
- Works at any viewport; below 1000px the type scales down per the media query, and below 768px the capsule copy is re-centred and re-scaled per "On a phone" above — the column geometry itself never changes. No reduced-motion handling required.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/capsules-animated-columns/img_01.jpg
https://motionprompts.dev/c/capsules-animated-columns/img_02.jpg
https://motionprompts.dev/c/capsules-animated-columns/img_03.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--acid-hi`, `--acid-lo`, `--acid`, `--paper`, `--ink`, `--ink-soft`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no error, no animation, nothing to debug. Delete the listener; what is left underneath it is `whenFontsReady().then(() => mount(config))`, and that is not a plain body you can drop straight into `useEffect` — see cleanup below, because this is exactly the asynchronous-continuation case the rest of this catalogue keeps tripping over.

*(2) Element lookups* — Every selector here — `.sticky-cols`, `.col-1` through `.col-4`, `.col-img-1 img`, `.col-img-2`, `.col-3 h1, .col-3 p` — assumes this component owns the document. Give the component a root ref, render it on the outermost element, and scope every lookup to it. This component also tracks a `currentPhase` counter across scroll updates, so an unscoped selector binding to a leftover subtree during the StrictMode remount would not just animate the wrong element once — it would let a phantom `ScrollTrigger` keep advancing a phase counter nobody is reading, invisibly, until the user scrolls past a threshold and two sets of columns move at once.

*(3) Cleanup* — The mount/destroy pair above already anticipates one React-shaped problem: `mount` cannot run synchronously, because `SplitText` needs the display faces (`Space Grotesk`, `Inter`) loaded before it measures line breaks, so the real setup sits behind that `whenFontsReady().then(...)`. Do not make the effect callback itself `async`, and do not treat the promise chain as the cleanup — `useEffect` needs a synchronous function back, and a promise is not one. Keep the same shape the vanilla mount already uses for the editor runtime (a boolean flag flipped by the returned cleanup, checked before the deferred setup runs), but wire it to the effect instead of to `window.MP`:

```jsx
useEffect(() => {
  let cancelled = false;
  let teardown = null;
  whenFontsReady().then(() => {
    if (cancelled) return;
    teardown = mount(config); // registers plugins, splits .col-3, builds both ScrollTriggers
  });
  return () => {
    cancelled = true;
    if (teardown) teardown();
  };
}, []);
```

Without the flag, a StrictMode remount fires `whenFontsReady()` twice; fonts are already cached after the first load, so the second call usually resolves almost immediately too, and you end up with two `Lenis` instances, two pinning `ScrollTrigger`s on the same `.sticky-cols`, and two independent `currentPhase` counters racing each other on every scroll event.

Wrap the body of `mount` in a `gsap.context` scoped to the root ref, and revert that context from inside `teardown`. Both `ScrollTrigger.create` calls — the pin and the phase-progress trigger — are tracked by the context, so reverting it kills both, and because the pin trigger is among them, the revert also removes the pin-spacer it inserted; killing the triggers without going through that revert path is what leaves the spacer behind and the page keeps the extra scroll height the pin used to occupy.

`gsap.ticker.add(raf)` is not covered by the context: it drives `lenis.raf`, and the context only tracks tweens and triggers it creates, not ticker subscriptions. Keep the exact `raf` function reference and call `gsap.ticker.remove(raf)` yourself, then `lenis.destroy()`, in that order — removing the ticker callback first stops anything from calling into the Lenis instance you are about to tear down.

Revert the two `SplitText` instances (one per `.col-3` content wrapper) after the context reverts, not before: the animated targets are the `.line span` elements `SplitText` generated, and killing those tweens while the spans still exist is what lets GSAP clear the inline styles it wrote to them; reverting the split first would merge the lines back into plain text nodes GSAP no longer holds references to. And keep `currentPhase` declared inside the effect (or inside the `mount` closure the effect calls), never lifted to module scope — this state machine advances on discrete progress thresholds rather than a continuous scrub, so a counter that survived across mounts would let a fresh pair of triggers start firing phase transitions from whatever phase the previous instance was left in, out of step with where the columns actually sit on screen.
