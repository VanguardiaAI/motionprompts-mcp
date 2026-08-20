---
slug: nextjs-view-transitions
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 8
structural:
  - { kind: duration, literal: "1500", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: stagger, literal: "0.075", rule: value/narrated }
  - { kind: ease, literal: "\"power4.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Next.js-style View Transitions — multi-page portfolio with native View Transitions API + GSAP text intros

## Goal

Build a single-page demo that simulates a 3-route portfolio site (Home / Projects / Info) where clicking a nav link triggers a full-page transition powered by the **native View Transitions API** (`document.startViewTransition`): the outgoing page slides up and fades to 20% opacity while the incoming page is revealed from the bottom by an animated `clip-path`, both over 1.5s with a `cubic-bezier(0.87, 0, 0.13, 1)` ease. On top of that, each destination page runs its own GSAP text intro on mount: the Home headline reveals character-by-character and the Info paragraph reveals line-by-line, both sliding up from `y: 400` behind clip-path masks.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm), `split-type` (npm, for splitting text into chars/lines — NOT the GSAP SplitText plugin), and `lenis` (npm) for smooth scrolling. No GSAP plugins are needed. The page-to-page transition itself uses the Web Animations API (`document.documentElement.animate(...)`) targeting `::view-transition-old(root)` / `::view-transition-new(root)` pseudo-elements — not GSAP.

```js
import gsap from "gsap";
import SplitType from "split-type";
import Lenis from "lenis";
```

## Layout / HTML

- `<nav class="nav">` fixed at the top, containing:
  - `<div class="logo">` → `<div class="link">` → `<a href="/" data-route="/">Index</a>`
  - `<div class="links">` → two `<div class="link">` wrappers with `<a href="/projects" data-route="/projects">Projects</a>` and `<a href="/info" data-route="/info">Info</a>`
- `<main id="content">` — initially contains the Home page markup.
- Three `<template>` elements holding the page markup, with ids `page-/`, `page-/projects`, `page-/info`. On navigation, the matching template is cloned into `#content`, replacing its children.

Page markup:

- **Home** (`<div class="home">`): a single `<h1>Kaelon</h1>`.
- **Projects** (`<div class="projects">`): a `<div class="images">` containing 4 stacked `<img>` elements.
- **Info** (`<div class="info">`): two `<div class="col">` columns — the first holds one portrait `<img>`, the second holds a `<p>` with a short bio paragraph (4–5 lines of text), e.g.: "Kaelon is a portrait photographer who captures striking and artistic images. His work focuses on light, shadow, and movement, creating portraits that feel both modern and timeless. With a minimal and moody style, he brings out raw emotion and unique beauty in every subject."

## Styling

- CSS variables: `--bg: #1a1a1a` (page background), `--copy: #fff` (text).
- `body`: `background-color: #000` (visible behind pages during transitions), `color: #fff`, `font-family: "Neue Haas Grotesk Display Pro", "Times New Roman", Times, serif;`.
  - **The font fallback here is load-bearing — read carefully.** The reference declares only the licensed grotesque `"Neue Haas Grotesk Display Pro"` with NO generic fallback. That font is not installed in this (or almost any) reproduction environment, so the browser falls back to its **default serif**. As a result the giant KAELON headline (`.home h1`, inheriting the body font) and the Info bio paragraph render in a **SERIF** face — this is the reference's actual on-screen appearance. Match it by giving `body` the serif fallback stack shown above. Do **NOT** fall back to `Helvetica`/`Arial`/`sans-serif`: a sans-serif headline is materially different from the reference and, since the headline is the dominant focal element, it is the single biggest fidelity mistake you can make on this component.
- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`. All `img`: `width: 100%; height: 100%; object-fit: cover;`.
- `.nav`: `position: fixed; top: 0; left: 0; width: 100vw; padding: 1.75em; display: flex; justify-content: space-between; align-items: center;`. `.links`: `display: flex; gap: 2em;`.
- All `<a>`: no underline, `text-transform: uppercase`, white, `font-family: "Akkurat Mono", "Times New Roman", Times, serif;`, `font-size: 12px; font-weight: 600; padding: 0.5em;`. (Same fallback principle as the body: the licensed `"Akkurat Mono"` is also absent in the reproduction environment, so the small nav labels fall back to the browser-default serif too. Give them a serif fallback stack — do not substitute a monospace font.)
- `.home`: `width: 100vw; height: 100svh; background-color: var(--bg);` flex-centered.
- `.home h1`: `width: 100%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-transform: uppercase; font-size: 20vw; font-weight: bolder; letter-spacing: -0.5rem; line-height: 1;` and crucially `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` — this acts as the mask so split characters translated down by 400px are hidden until they slide up.
- `.home h1 .char`: `position: relative; will-change: transform;` (SplitType adds `.char` spans).
- `.projects`: `width: 100vw; height: 100%; min-height: 100svh; background-color: var(--bg); padding: 20em 1em;`. `.images`: `width: 30%; margin: 0 auto; display: flex; flex-direction: column; gap: 2em;` — a narrow centered column of stacked images that makes the page tall/scrollable.
- `.info`: `width: 100vw; height: 100%; min-height: 100svh; background-color: var(--bg); display: flex;`. Each `.col`: `flex: 1`. Second `.col`: `padding: 2em;` flex-centered. `.col p`: `font-weight: 500; font-size: 2rem;`.
- `.col p .line`: `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` (per-line mask). `.col p .line span`: `position: relative; will-change: transform;`.

**View Transitions CSS (required for the effect to work):**

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none !important;
}
::view-transition-group(root) {
  z-index: auto !important;
}
::view-transition-image-pair(root) {
  isolation: isolate;
  will-change: transform, opacity, clip-path;
  z-index: 1;
}
::view-transition-new(root) {
  z-index: 10000;
  animation: none !important;
}
::view-transition-old(root) {
  z-index: 1;
  animation: none !important;
}
```

This kills the browser's default cross-fade, isolates the image pair, and stacks the new snapshot (z-index 10000) above the old one (z-index 1) so the clip-path wipe reveals the new page over the old.

## Animation (be precise)

### 1. Smooth scroll

Instantiate Lenis with defaults and drive it with a `requestAnimationFrame` loop:

```js
const lenis = new Lenis();
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);
```

### 2. Client-side routing + View Transition

- Attach a click listener to every `.nav a`: `preventDefault()`, read `link.dataset.route`, and call `navigate(route)`.
- `navigate(route)`: bail out if `route === currentRoute`. If `document.startViewTransition` is unsupported, just render the page directly (no transition). Otherwise:

```js
const transition = document.startViewTransition(() => renderPage(route));
transition.ready.then(() => slideInOut());
```

- `renderPage(route)`: clone the matching `<template>` content into `#content` with `replaceChildren`, update `currentRoute`, reset scroll to the top instantly (`lenis.scrollTo(0, { immediate: true })` plus `window.scrollTo(0, 0)`), then run that route's intro animation (Home → char reveal, Info → line reveal, Projects → none).

### 3. `slideInOut()` — the page transition (Web Animations API)

Fired when the view-transition pseudo-elements are ready. Two simultaneous `document.documentElement.animate()` calls:

**Outgoing page** — `pseudoElement: "::view-transition-old(root)"`:
- keyframes: `{ opacity: 1, transform: "translateY(0)" }` → `{ opacity: 0.2, transform: "translateY(-35%)" }`
- `duration: 1500`, `easing: "cubic-bezier(0.87, 0, 0.13, 1)"`, `fill: "forwards"`

**Incoming page** — `pseudoElement: "::view-transition-new(root)"`:
- keyframes: `clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)"` (collapsed to a zero-height line at the bottom edge) → `clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)"` (full viewport)
- `duration: 1500`, `easing: "cubic-bezier(0.87, 0, 0.13, 1)"`, `fill: "forwards"`

Net effect: the old page drifts up 35% and dims to 20% opacity underneath while the new page wipes upward from the bottom edge over it, both eased with the same strong symmetric bezier.

### 4. Home intro — GSAP character reveal

```js
const heroText = new SplitType(".home h1", { types: "chars" });
gsap.set(heroText.chars, { y: 400 });
gsap.to(heroText.chars, {
  y: 0,
  duration: 1,
  stagger: 0.075,
  ease: "power4.out",
  delay: 1,
});
```

Characters start 400px below (hidden by the h1's clip-path) and slide up one by one, left to right. Runs on initial page load AND every time the user navigates back to Home. The 1s delay lets the page transition mostly finish before the headline reveals.

### 5. Info intro — GSAP line reveal

```js
const text = new SplitType(".info p", {
  types: "lines",
  tagName: "div",
  lineClass: "line",
});
// wrap each line's content in a <span> so the span can translate inside the clipped .line
text.lines.forEach((line) => {
  line.innerHTML = `<span>${line.innerHTML}</span>`;
});
gsap.set(".info p .line span", { y: 400, display: "block" });
gsap.to(".info p .line span", {
  y: 0,
  duration: 2,
  stagger: 0.075,
  ease: "power4.out",
  delay: 0.25,
});
```

Each line slides up from 400px inside its own clip-path mask, staggered 0.075s top to bottom, over a slow 2s power4.out.

### 6. Initial load

On first load, `#content` already shows the Home page — run the Home intro immediately (no view transition).

## Assets / images

5 photographs, dark moody editorial-photography style (fits the black/#1a1a1a palette):

- **Projects page** — 4 images stacked vertically in the narrow centered column, each roughly portrait/square aspect (around 4:5 to 1:1): editorial fashion portraits, all shot hard and directional so they hold up against the near-black page — a warm-lit beauty close-up on a soft beige ground, a model in a cobalt coat against a warm orange seamless, a profile under teal-and-red gel light, and a figure with fabric in motion in a dark studio.
- **Info page** — 1 portrait-orientation image in the left column (fills half the viewport, `object-fit: cover`): a cinematic low-key portrait, subject looking away.

## Behavior notes

- The demo simulates Next.js routes in one HTML file via `<template>` cloning — no real navigation, URLs don't change.
- If `document.startViewTransition` is unavailable (Firefox/older browsers), pages must still swap instantly and run their GSAP intros — only the slide/clip transition is skipped.
- Clicking the link for the page you're already on does nothing.
- The Projects page is intentionally taller than the viewport (padding `20em 1em`) so Lenis smooth scrolling is noticeable; navigating always resets scroll to the top.
- The nav stays fixed and visible on every page and is captured inside the root snapshot during transitions (no separate `view-transition-name`).

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/nextjs-view-transitions/img1.jpeg
https://motionprompts.dev/c/nextjs-view-transitions/img2.jpeg
https://motionprompts.dev/c/nextjs-view-transitions/img3.jpeg
https://motionprompts.dev/c/nextjs-view-transitions/img4.jpeg
https://motionprompts.dev/c/nextjs-view-transitions/portrait.jpeg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-deep`, `--paper`, `--muted`, `--accent`, `--hair`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two Lenis instances pulling on the same wheel event, two character reveals racing on the same headline. The visible symptom is jitter or a doubled stagger, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point.* This file's own comments already name the React shape it was flattened out of — "was `<ReactLenis root>` wrapping every page", "was `src/app/page.js` useGSAP", "was `src/app/info/page.jsx` useGSAP", "Replaces next-view-transitions `router.push(route, { onTransitionReady })`" — so this is less "wrap the file in one `useEffect`" and more "put it back into that shape." The script runs at the top level, the moment the module is evaluated: the `Lenis` instantiation, the `raf` loop and the `.nav a` click bindings execute at import time, before any component has rendered, and so does the initial `runIntro("/")` call. Split it along the seams the comments already mark:

- The Lenis instance, its `raf` loop and the `.nav a` listeners are shell-level — one `useEffect` on the layout that wraps every route (the piece the comment calls `<ReactLenis root>`), not on any single page.
- `animateHome` and `animateInfo` are page-level. Each becomes its own `useEffect`, with an empty dependency array, inside the `Home` and `Info` page components respectively. `Projects` has no intro at all — give it no effect. The `runIntro(route)` dispatcher and the `currentRoute` variable disappear: which intro fires is decided by which page component the router actually mounted, not by a string comparison, and "navigates back to Home" becomes nothing more than Home's effect re-running on remount — which a normal route change already gives you for free.
- `navigate`, `document.startViewTransition`, `transition.ready.then(() => slideInOut())` and the `<template id="page-...">` cloning into `#content` are the hand-rolled stand-in for the package this component is named after. In the real app, `next-view-transitions`' own router (its `useTransitionRouter().push(href, { onTransitionReady })`, typically reached through its `<ViewTransitions>` provider wrapping the root layout) replaces `navigate()` and takes `slideInOut` as the `onTransitionReady` argument directly, exactly as the comment states. `content.replaceChildren`, the three `<template>` elements and `currentRoute` all go with it — the router now owns which page is mounted, and the three routes become three real route files. One timing detail survives the move either way: `transition.ready` is a promise, and if the shell unmounts before it settles, its `.then()` fires `slideInOut()` against a component that is already gone. Guard it with a boolean the shell effect's cleanup flips, the same way you would guard any continuation that can outlive the effect that started it.

*(2) Element lookups.* `.home h1` and `.info p .line span` are safe as bare class selectors scoped to whichever page currently renders them, since only one page is mounted at a time. `.nav a` is different: it's queried once, at module scope, inside a nav that — unlike the pages — never unmounts across a route change. Give the nav its own root ref in the shell layout and scope that query to it, so a StrictMode remount of the layout can't leave the outgoing copy's click listeners attached underneath the incoming one.

*(3) Cleanup.*

**GSAP.** Neither intro uses `ScrollTrigger`, but both still need a `gsap.context` scoped to the page's root ref, reverted on unmount — that is what undoes the inline `transform` a `gsap.to` on `heroText.chars` (or on `.line span`) leaves behind if the page unmounts mid-reveal:

```jsx
useEffect(() => {
  let heroText;
  const ctx = gsap.context(() => {
    heroText = new SplitType(".home h1", { types: "chars" });
    gsap.set(heroText.chars, { y: 400 });
    gsap.to(heroText.chars, { y: 0 /* same offset, stagger, delay and easing curve as above */ });
  }, rootRef);
  return () => {
    ctx.revert();
    heroText.revert();
  };
}, []);
```

**Lenis.** This is the shell's smooth scroll, so it belongs in the layout effect, not per page: one instance, destroyed in that effect's cleanup. Since the source comment already points at `<ReactLenis root>` from `lenis/react`, prefer it over hand-instantiating — it owns the instance's create/destroy and runs its own internal loop, which removes the next bullet's bookkeeping entirely. If you keep the manual version instead, the scroll reset that used to run inside `renderPage` (`lenis.scrollTo(0, { immediate: true })` plus `window.scrollTo(0, 0)`) has to move into whatever now observes the route changing — there is no more `renderPage` to call it from.

**rAF.** If you keep the hand-rolled loop instead of `<ReactLenis root>`, keep the handle the last `requestAnimationFrame` call returned and cancel it in the same layout-effect cleanup that destroys Lenis. Left uncancelled, it keeps calling `lenis.raf` on an already-destroyed instance for the life of the page.

**SplitType.** `heroText.revert()` and `text.revert()` need to run on unmount, in the same cleanup as `ctx.revert()`, before the page component that owns those nodes is gone — otherwise the next mount of the same page splits markup that is already split. For the Info page specifically, the manual `line.innerHTML = `<span>...</span>`` wrap that runs right after the line split needs no separate teardown: `text.revert()` restores the whole `.info p` back to the plain-text markup SplitType cached before the split ran, which erases the injected `<span>` wrappers along with the `.line` divs in the same call.
