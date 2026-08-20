---
slug: zajno-page-transitions
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 2
structural_literals: 3
structural:
  - { kind: duration, literal: "1.25", rule: value/narrated }
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: ease, literal: "\"power4.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Nuvoro Page Transitions — View Transitions API + GSAP revealer + masked SplitText

## Goal

Build a minimal editorial four-view single-page site (home, work, studio, contact) for a fictional studio called "nuvoro". The star effect: clicking a nav link swaps views through the native **View Transitions API** — the incoming page is unmasked by a full-screen `clip-path` polygon that expands from a thin horizontal slit at 75% viewport height to the whole screen over 2s — while a dark GSAP "revealer" overlay wipes away vertically and the new view's heading reveals through masked SplitText chars/words/lines.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **SplitText** and **CustomEase**, and **`lenis`** (npm) for smooth scrolling. Register the plugins with `gsap.registerPlugin(SplitText, CustomEase)`. No frameworks, no build-specific code beyond ES imports (assume a Vite dev server).

## Layout / HTML

- Fixed top **nav** (`.nav`) spanning the viewport width with two columns:
  - `.col` 1 (flex: 1): `.nav-logo` containing `<a href="/" data-path="/">nuvoro</a>`.
  - `.col` 2 (flex: 2, `display:flex; justify-content: space-between`): `.nav-items` with three `.nav-item` divs — `work`, `studio`, `contact` — each wrapping an `<a href="/work" data-path="/work">`-style anchor, plus a `.nav-copy` with `<p>toronto, ca</p>`. **`.nav-items` has NO layout rule of its own — do NOT make it a horizontal flex row.** Since the anchors are `display:block` (~0.85rem), the three `.nav-item` divs stack **vertically** as a compact column list sitting at the left edge of this second column, while the column's `justify-content: space-between` pushes `.nav-copy` ("toronto, ca") to the right edge.
- `<main id="views">` containing four `<section class="view" data-path="...">` elements. Only the home view (`data-path="/"`) is visible initially; the other three carry the `hidden` attribute. **Every view's first child is an empty `<div class="revealer"></div>`** (the dark wipe overlay).
  - **Home** (`data-path="/"`): `.home` wrapper with `.header > h1` reading `nuvoro` (huge, centered) and `.hero-img > img` (full-width image anchored to the bottom of the viewport).
  - **Work** (`data-path="/work"`): `.work` wrapper with `<h1>selected work</h1>` and `.projects` containing 4 `<img>` stacked vertically.
  - **Studio** (`data-path="/studio"`): `.studio` wrapper with two `.col`s — first holds `<h2 class="studio-header">Our Story</h2>`, second holds a long `<h2>` paragraph (4–5 lines of studio-manifesto copy about creativity, bold ideas and crafted storytelling) followed by `.about-img > img`.
  - **Contact** (`data-path="/contact"`): `.contact` wrapper with two `.col`s — first holds `<h2>Contact Us</h2>`, second holds two `.contact-copy` blocks (each two `<h2>`s: a label like "Collaborations"/"Inquiries" and an email like `studio@nuvoro.com` / `support@nuvoro.com`) plus a `.socials` row of three `<p>`s (Instagram, Twitter, LinkedIn) pinned to the bottom of the viewport.

## Styling

- CSS variables: `--bg: #fff`, `--fg: #0a0a0a`. Global reset (`* { margin:0; padding:0; box-sizing:border-box }`).
- Font: **Inter variable** from Google Fonts. The import MUST include the optical-size (`opsz`) axis — use exactly:
  ```
  @import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");
  ```
  then `body { font-family: "Inter"; color: var(--fg) }`. **Why `opsz` is load-bearing:** the home wordmark is set at `font-size: 30.5vw` (~439px on a 1440px viewport). With the `opsz` axis present, `font-optical-sizing: auto` snaps Inter to its narrower display metrics and "nuvoro" fits 100vw on a single line. Without it, the word measures wider than the viewport — and because SplitText's mask wraps every char in an `inline-block` (each one a legal line-break point), the final "o" wraps onto a second line and the header (positioned `top:25%` with `translate(-50%,-50%)`) gets cropped at the top of the viewport.
- All `img`: `width:100%; height:100%; object-fit:cover`.
- Type scale: `h1` 4.25rem / weight 600 / letter-spacing -0.1rem / line-height 1. `h2` 2rem / weight 700 / letter-spacing -0.04rem / line-height 1.125 / antialiased. `a, p` display block, no underline, 0.85rem / weight 600, color `--fg`.
- `.nav`: `position: fixed; top:0; left:0; width:100vw; padding:1em; display:flex; gap:1em; z-index:2`. `.nav .col:nth-child(1) { flex: 1 }`; `.nav .col:nth-child(2) { flex: 2; display:flex; justify-content: space-between }`. There are **no CSS rules for `.nav-items` or `.nav-item`** — leave them default block so the three nav links render as a vertical column list (do NOT add `display:flex` or `gap` to `.nav-items`).
- `.home`: `width:100%; height:100svh; overflow:hidden; background: var(--bg)`. `.home .header`: absolute, `top:25%; left:50%; transform:translate(-50%,-50%); width:100%`; its `h1` is `font-size: 30.5vw; text-align:center` (the wordmark fills the viewport width). `.home .hero-img`: absolute, `left:50%; bottom:0; transform:translateX(-50%); width:95%; height:50vh; overflow:hidden`.
- `.work`: `text-align:center; padding:15em 1em; display:flex; flex-direction:column; gap:2em; background:var(--bg)`. `.work .projects`: `width:32%; margin:0 auto; column flex; gap:4em`; project images `aspect-ratio:4/5`.
- `.studio, .contact`: `padding:15em 1em; display:flex; gap:1em; background:var(--bg)`; first `.col` flex 1, second `.col` flex 2 as a column with `gap:2em`. `.studio .about-img`: `aspect-ratio:5/7`. `.contact`: `width:100vw; min-height:100svh`. `.contact .socials`: absolute, `bottom:1.5em; display:flex; gap:1em`.
- SplitText helper classes: `.letter, .word, .line { position:relative; display:inline-block; will-change:transform }`.
- `.revealer`: `position:fixed; top:0; left:0; width:100vw; height:100svh; transform-origin:center top; background-color:var(--fg); pointer-events:none; z-index:2`. It starts covering the whole viewport in dark and is scaled away by GSAP.
- **View Transitions CSS (required for the clip-path effect to work):**
  ```
  ::view-transition-old(root), ::view-transition-new(root) { animation: none !important; }
  ::view-transition-group(root) { z-index: auto !important; }
  ::view-transition-image-pair(root) { isolation: isolate; will-change: clip-path; z-index: 1; }
  ::view-transition-new(root) { z-index: 10000; animation: none !important; }
  ::view-transition-old(root) { z-index: 1; animation: none !important; }
  ```
  (Default snapshot cross-fades are disabled; the new snapshot sits on top at z-index 10000 so the custom clip-path animation controls the whole reveal.)
- Responsive at `max-width: 900px`: `.work .projects` becomes `width:90%`; `.studio` and `.contact` switch to `flex-direction: column`.

## GSAP effect (be precise)

### Setup

- `CustomEase.create("hop", "0.9, 0, 0.1, 1")` — this "hop" ease drives the revealer wipe. The same bezier is reused as `cubic-bezier(0.9, 0, 0.1, 1)` in the WAAPI clip-path animation.
- Start Lenis smooth scroll globally: `const lenis = new Lenis()` plus the standard `requestAnimationFrame` loop calling `lenis.raf(time)`.
- Build a `Map` of `data-path → section.view` and track `currentPath` (starts at `"/"`). Also keep a `Map` of view → SplitText instance so a revisit can `revert()` the previous split before re-splitting.

### 1. Revealer wipe (per view entrance)

For the entering view's `.revealer`:
- `gsap.set(revealer, { scaleY: 1 })` (fully covering the viewport in `--fg` dark).
- `gsap.to(revealer, { scaleY: 0, duration: 1.25, delay: 1, ease: "{{motion.ease.primary}}" })` — because `transform-origin` is `center top`, the dark panel collapses upward, unveiling the page beneath it after a 1s hold.

### 2. Masked SplitText heading reveal (per view entrance)

Each view splits its heading(s) with `SplitText.create(elements, { type, <class option>, mask })` where `mask` equals the split type — this wraps each fragment in an overflow-clipping mask element so fragments slide in from below their own line box. Then:
- `gsap.set(fragments, { y: "110%" })` (hidden below the mask).
- `gsap.to(fragments, { y: "0%", duration: 1.5, stagger, delay, ease: "power4.out" })`.

Per-view configuration table:

| view path  | target | type    | class option              | mask    | animated set | stagger | delay |
|------------|--------|---------|---------------------------|---------|--------------|---------|-------|
| `/`        | `h1`   | `chars` | `charsClass: "letter"`    | `chars` | `.chars`     | 0.1     | 1.25  |
| `/work`    | `h1`   | `words` | `wordsClass: "word"`      | `words` | `.words`     | 0.25    | 1.75  |
| `/studio`  | `h2`   | `lines` | `linesClass: "line"`      | `lines` | `.lines`     | 0.1     | 1.5   |
| `/contact` | `h2`   | `lines` | `linesClass: "line"`      | `lines` | `.lines`     | 0.1     | 1.75  |

Notes: the studio and contact views select ALL `h2`s in the view (headers, paragraph, emails), splitting them into lines together. Before splitting a view that was split previously, call `revert()` on its stored SplitText instance.

`playView(view)` = run the revealer wipe (1) + the SplitText reveal (2) together.

### 3. Clip-path page transition (nav click)

Each nav `<a data-path>` gets a click handler that `preventDefault()`s and calls `navigate(path)`:
- If `path === currentPath`, do nothing.
- **DOM swap function**: hide the current view (`hidden = true`), unhide the target, `gsap.set(targetView.querySelector(".revealer"), { scaleY: 1 })` so the incoming snapshot is captured with the dark overlay covering the viewport, then reset scroll with `window.scrollTo(0, 0)` and `lenis.scrollTo(0, { immediate: true })`.
- If `document.startViewTransition` is unavailable, just swap, update `currentPath`, and `playView(target)` (graceful fallback).
- Otherwise: `const transition = document.startViewTransition(() => { swap; currentPath = path; })`, then in `transition.ready.then(...)` run BOTH:
  1. The WAAPI clip-path animation on the new snapshot:
     ```
     document.documentElement.animate(
       [
         { clipPath: "polygon(25% 75%, 75% 75%, 75% 75%, 25% 75%)" },
         { clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)" }
       ],
       { duration: {{motion.duration.slow}}, easing: "cubic-bezier(0.9, 0, 0.1, 1)", pseudoElement: "::view-transition-new(root)" }
     );
     ```
     The new page appears as a zero-height horizontal slit centered at 75% of the viewport height (from x=25% to x=75%) and expands to cover the full viewport.
  2. `playView(targetView)` — so the revealer wipe (dark cover collapsing upward after its 1s delay) and the masked text reveal play *inside* the expanding clip.

### 4. Initial load

On `document.fonts.ready`, run `playView` on the home view: the dark revealer holds 1s, collapses upward over 1.25s with the "hop" ease, and the giant `nuvoro` wordmark letters rise out of their character masks (chars, stagger 0.1, delay 1.25, power4.out).

## Assets / images

6 monochrome/black-and-white art-direction images (abstract sculptural photography works well — spheres, distorted portraits, smoke, rock textures):

1. **Hero** — 1 wide image, displayed full-bleed at 95% viewport width × 50vh, anchored to the bottom of the home view (e.g. a grainy grey gradient orb on a near-white ground).
2. **Projects** — 4 portrait images at **4:5** aspect ratio, stacked vertically in the work view (surreal B/W portrait, glossy stone spheres, rocket engines firing through fog, cluster of floating grey spheres — any cohesive monochrome set).
3. **Studio** — 1 portrait image at **5:7** aspect ratio in the studio view's second column (e.g. a cracked metallic rock splitting apart).

## Acceptance checks

- **Wordmark:** the home `h1` "nuvoro" must render on a **SINGLE line** spanning roughly the full viewport width (~95–98vw), fully visible below the nav. If it wraps to a second line or overflows the viewport, the Inter font import is wrong (missing the `opsz` axis) — fix the `@import`, not the font-size.
- **Nav:** the three nav links (work / studio / contact) stack vertically at the start of the nav's second column, with "toronto, ca" alone at the right edge. If they render in a horizontal row, a stray `display:flex` was added to `.nav-items`.

## Behavior notes

- The whole document participates in the view transition (root snapshots); the CSS pseudo-element rules above are mandatory or the clip-path animation will not be visible.
- Clicking the currently-active nav link is a no-op.
- Scroll position resets to the top on every navigation (both native and Lenis, immediate).
- Lenis smooth scrolling applies to the taller inner views (work, studio, contact).
- In browsers without the View Transitions API, navigation still works: instant swap + revealer wipe + text reveal, no clip-path.
- Below 900px the project gallery widens to 90% and studio/contact stack into a single column.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/zajno-page-transitions/hero.jpg
https://motionprompts.dev/c/zajno-page-transitions/img1.jpg
https://motionprompts.dev/c/zajno-page-transitions/img2.jpg
https://motionprompts.dev/c/zajno-page-transitions/img3.jpg
https://motionprompts.dev/c/zajno-page-transitions/img4.jpg
https://motionprompts.dev/c/zajno-page-transitions/studio.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--paper`, `--fg`, `--muted`, `--line`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two `.revealer` wipes racing on the same overlay, two `click` listeners on the same nav link both calling `navigate()`, two `Lenis` instances pulling on the same wheel event, two `raf` loops each calling `lenis.raf()` into their own instance. The visible symptom is a doubled wipe or a transition that fires twice per click, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The whole script runs at the top level, the moment the module is evaluated: building the `views` Map from `document.querySelectorAll(".view")`, wiring the `click` listener on every `.nav a[data-path]` link, and the terminal `document.fonts.ready.then(() => playView(views.get("/")))` that plays the home view's entrance. None of it waits for an event. In React that moment is import time, before this component has rendered a single `.nav` or `.view` node, so `document.querySelectorAll(".view")` would return an empty `NodeList`, `views` would stay empty, and every nav link would ship with no listener at all — no error, just a nav that does nothing when clicked. Move the whole body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(SplitText, CustomEase)` and the `CustomEase.create("hop", ...)` call can stay at module scope exactly as written — the eased curve only needs to exist once, not once per mount.

*(2) Element lookups* — `document.querySelectorAll(".view")`, `document.querySelectorAll(".nav a[data-path]")`, and, inside each view, `view.querySelector(".revealer")` and `view.querySelectorAll(cfg.tag)` (the `h1`/`h2` targets from `SPLIT_CONFIG`) all assume this component owns the document. Give the component one root `ref` around the whole page: `.nav` and `<main id="views">` are siblings in the markup, and the click handler that reads `.nav a[data-path]` has to live in the same tree as the `.view` lookups, so the ref needs to wrap both, not just `#views`. Scope every lookup in the effect to `rootRef.current`. This is not just hygiene: during the StrictMode remount two copies of `.nav` and the four `.view` sections exist for an instant, and an unscoped `querySelectorAll(".view")` can hand the `views` Map elements from whichever copy happens to be attached last, not necessarily the one that survives.

*(3) Cleanup* —

**GSAP.** `animateReveal` and `animateText` — the two halves of `playView` — never run inside the synchronous pass of a `gsap.context` factory. Every call to `playView` happens later: once from `document.fonts.ready.then(...)` on first load, and again from `navigate()`'s `transition.ready.then(...)` on every click after that. Register `playView` as a named method on the context's own `self`, and call it through the context from then on:

```jsx
useEffect(() => {
  let cancelled = false;
  const ctx = gsap.context((self) => {
    self.add("playView", playView);
  }, rootRef);

  document.fonts.ready.then(() => {
    if (cancelled) return;
    ctx.playView(views.get("/"));
  });

  // the views.querySelectorAll(".nav a[data-path]") click wiring goes here too

  return () => {
    cancelled = true;
    ctx.revert();
  };
}, []);
```

`ctx.revert()` then undoes the revealer's scale tween and the `SplitText` fragments' `y` tween from whichever `playView` call ran last, including the inline `transform` GSAP wrote on the fragments mid-animation. Guard both async continuations that call into the context — the `document.fonts.ready` one above, and `navigate()`'s `transition.ready.then(() => { triggerPageTransition(); ctx.playView(targetView); })` — with the same `cancelled` flag the cleanup sets, and check it before either touches `ctx`. This is not a defensive nicety: a reverted `gsap.context` does not remove the method `self.add` registered on it, `ctx.playView` is a plain property that survives `ctx.revert()`, and calling it late does not throw. It re-executes `playView` against whatever `views.get(path)` still points to and re-arms tracking on the context, but nothing will ever call `ctx.revert()` a second time to undo it, since the effect's own teardown has already run. In a StrictMode dev remount the DOM is still the copy the surviving mount is using, so the visible result is a wipe or reveal firing out of nowhere on a live page; after a real unmount, the elements the `views` Map cached are detached, and the tween runs against them harmlessly but not for free — it still occupies a slot on GSAP's ticker for its full stated hold-and-collapse timing.

**Lenis.** This component owns the page's one `Lenis` instance and drives it with its own loop rather than `gsap.ticker`. Cancel that loop before destroying the instance, so no frame already scheduled calls `.raf()` on an instance that is already gone:

```jsx
let rafId;
function raf(time) {
  lenis.raf(time);
  rafId = requestAnimationFrame(raf);
}
rafId = requestAnimationFrame(raf);

// cleanup, in this order:
cancelAnimationFrame(rafId);
lenis.destroy();
```

If this ships as one region of a larger app instead of the whole page, lift `Lenis` to whichever shell already owns scrolling — `swapDOM`'s `lenis.scrollTo(0, { immediate: true })` then targets that shared instance instead of this effect constructing a second one to fight it over the same wheel input.

**SplitText.** `animateText` already reverts a view's previous split before re-splitting it (`splits.get(view).revert()`), which stops a revisit from splitting already-split output — keep that check exactly as written. It does not cover unmount: any view visited during this mount still has a live `SplitText` instance sitting in the `splits` Map when the component goes away, and `ctx.revert()` cannot see it — the character/word/line spans `SplitText.create` writes into the DOM are plain markup, invisible to the GSAP context. In the same cleanup, revert every entry the map still holds, before reverting the context, so the fragment-wrapping spans are gone before anything else tries to read them:

```jsx
splits.forEach((instance) => instance.revert());
```

*(4) What is specific to this component* —

- **`currentPath` belongs in a ref, not React state.** Nothing here reads it to decide what to render — all four `.view` sections are already present in the markup, and which one is visible is the plain `hidden` property `swapDOM` toggles, not a conditional mount. A StrictMode remount resets an unguarded module-level variable the same way it resets any other closure state the throwaway first pass wrote to, so a bare `let currentPath` would forget which view was showing between that pass and the one that sticks; a ref survives the remount because it lives on the fiber instead of being recreated with the closure.
- **`swapDOM`'s plain DOM mutation is what lets `document.startViewTransition` work here without `flushSync`.** The transition's callback has to mutate the DOM synchronously, before the browser captures its "after" snapshot. Because `swapDOM` sets `.hidden` directly on the outgoing and incoming `<section>` elements — a property write, not a React state update feeding a conditional render — that requirement is already satisfied the instant the callback returns; there is no batched `setState` anywhere in this path that would need forcing through early. Keep the view-toggling exactly this way, off refs and `.hidden`, rather than reaching for `useState` to pick which view is "active" — doing that would reopen the timing gap this component currently avoids for free.
- **The nav's `click` listeners need their own explicit teardown.** They are plain `addEventListener` calls on `.nav a[data-path]`, not GSAP tweens or triggers, so nothing above removes them. Keep a reference to each handler (or attach one delegated listener on the nav root instead of one per link) and call `removeEventListener` in the same cleanup — otherwise a StrictMode remount leaves the outgoing copy's listeners attached underneath the incoming one, and the next click fires `navigate()` once per surviving listener, racing two view transitions against each other.
