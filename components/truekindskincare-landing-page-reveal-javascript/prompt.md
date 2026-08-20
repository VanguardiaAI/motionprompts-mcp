# Skincare Landing Page Reveal — counter preloader into full-bleed hero

## Goal

Build a full-page preloader-to-hero reveal for a natural skincare brand landing page. On load, a single GSAP timeline (with a custom "hop" ease) rolls a giant two-digit counter through 00 → 27 → 65 → 98 → 99, slides the logo words together over a growing vertical divider, then wipes two dark overlay blocks upward with clip-path while the background hero image de-zooms from 1.5 to 1 and the nav, masked headline lines, subcopy and CTA pill animate into place. It plays automatically, exactly once.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `CustomEase`. Icons come from Ionicons v7 served from your own origin (`/vendor/ionicons/ionicons.esm.js` as `type="module"`, plus the `nomodule` fallback `ionicons.js`); get them with `npm i ionicons@7.1.0` and copy the whole `node_modules/ionicons/dist/ionicons/` folder, since the loader fetches its chunks and one SVG per icon relative to the script's own URL. No smooth-scroll library, no ScrollTrigger — everything runs on `DOMContentLoaded`.

## Layout / HTML

Two top-level siblings in `<body>`:

1. `div.loader` — fixed full-viewport overlay (`z-index: 2`) containing:
   - `div.overlay` with two `div.block` children (side-by-side dark panels, each 100% height / 50% width via flex).
   - `div.intro-logo` centered, with two words: `div.word#word-1 > h1 > span` containing "Kind" (the span gets the italic serif font) and `div.word#word-2 > h1` containing "Root".
   - `div.divider` — a 1px-wide vertical white line, full height, horizontally centered.
   - `div.spinner-container` (centered, `bottom: 10%`) with `div.spinner` inside.
   - `div.counter` centered, holding five `div.count` groups stacked on top of each other (each absolutely positioned at the same center point). Each `.count` has two `div.digit > h1` children. The digit pairs, in DOM order, are: `0 0`, `2 7`, `6 5`, `9 8`, `9 9`.

2. `div.container` — relative, `100vw × 100svh`, `overflow: hidden`, containing:
   - `div.hero-img > img` — absolutely positioned full-viewport background image, `z-index: -1`, `object-fit: cover`.
   - `div.nav` — absolute top bar, flex with three equal-flex children: `div.logo > a` ("KindRoot"), `div.nav-links` with four links ("Rituals", "Our Roots", "Lookbook", "Stories"), and `div.btn > a` containing `<ion-icon name="cart-outline">`.
   - `div.header` — centered column (`padding-top: 25svh`, `gap: 1.5em`) with `div.hero-copy` holding two `div.line > h1` headline lines — line 1: `<span>Rooted</span> in care,`; line 2: `grown with <span>kindness</span>` (spans use the italic serif font) — and one more `div.line > p` below with "Skincare that stays true to nature and to you".
   - `div.cta` — white pill anchored bottom-center (`bottom: 3em`), containing `div.cta-label > p` ("View all products", absolutely centered in the pill) and `div.cta-icon` (`<ion-icon name="arrow-forward-outline">`) hugging the right edge.

## Styling

- Fonts, both from Google Fonts: `@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..600&family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap");`. Body font: `"Hanken Grotesk", sans-serif`. Accent serif for the italic spans and big counter digits: `font-family: "Fraunces", "Hanken Grotesk"`, `font-style: italic` for the spans, `-webkit-font-smoothing: antialiased`.
- Global reset (`* { margin:0; padding:0; box-sizing:border-box }`). `img { width:100%; height:100%; object-fit:cover }`.
- `h1`: centered, `#fff`, `5rem`, weight 500, `line-height: 1`. `h1 span`: the italic serif, weight 500.
- `a, p`: uppercase, `#fff`, `12px`, weight 500, `line-height: 1`, no underline. Logo link is capitalized (not uppercase), `14px`, bolder.
- `.nav`: `padding: 1.25em 1.5em`, flex, `gap: 1.5em`, each direct child `flex: 1`; `.nav-links` centered with `gap: 1.5em`; `.btn` right-aligned, its link a white pill `60px × 40px`, `border-radius: 40px`, black icon, `font-size: 16px`.
- `.cta`: `left: 50%`, `transform: translateX(-50%)`, width `50%`, height `60px`, `padding: 0.5rem`, white background, `border-radius: 4rem`, flex with `justify-content: flex-end`. `.cta-label p` is black. `.cta-icon`: square (`aspect-ratio: 1`, full height), dark `#303030` circle (`border-radius: 60px`), white icon, centered content.
- Loader: `.block` background `#303030`. `.intro-logo` centered via `top/left 50% + translate(-50%,-50%)`, flex `gap: 0.25rem`; `#word-1` nudged `left: -0.5rem` with `padding-right: 0.25rem`; `.word h1` is `2.5rem`. `.divider`: `1px` wide, full height, white, `transform-origin: center top`. `.spinner`: `50px` circle, `1.4px solid #fff` border with `border-top-color: rgba(255,255,255,0.125)`, spun by a CSS keyframe (`rotate 360deg`, 1s linear infinite).
- Counter digits: `.count .digit h1` uses the italic serif family at `15rem`, weight 400; each `.digit` has `padding-top: 1rem`; `.count` is absolutely centered so all five pairs occupy the same spot.
- **Initial (pre-animation) states set in CSS** — critical:
  - `.nav { transform: translateY(-120%) }`
  - `.cta { transform: translateX(-50%) scale(0) }` and `.cta-icon { transform: scale(0) }`
  - `.line`, `.cta-label`, `.word`, `.count .digit` all get `clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)` to act as reveal masks (`overflow` stays visible; the clip does the masking).
  - `.line h1`, `.line p`, `.cta-label p`, `.count .digit h1` start at `transform: translateY(120%)` (hidden below their mask), with `will-change: transform`.
  - `#word-1 h1` starts at `translateY(-120%)` (enters from above); `#word-2 h1` starts at `translateY(120%)` (enters from below).
  - `.block` starts with full-cover `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`.
  - `.divider` starts at `transform: scaleY(0)`.
  - `.hero-img` starts at `transform: scale(1.5)`.
- Media query `max-width: 900px`: `h1` drops to `2.5rem`, `.nav-links` hidden, `.cta` width `90%`.

## GSAP effect (the important part)

Register `CustomEase` and create a custom ease named `"hop"` from the cubic-bezier `0.9, 0, 0.1, 1`. On `DOMContentLoaded`, build ONE `gsap.timeline({ delay: 0.3, defaults: { ease: "hop" } })`. All tweens below use that ease unless stated.

1. **Counter roll.** Select all `.count` groups; for each `count` at `index`, grab its two `.digit h1`:
   - `tl.to(digits, { y: "0%", duration: 1, stagger: 0.075 }, index * 1)` — absolute position param: pair *n* starts exactly at *n* seconds into the timeline.
   - `tl.to(digits, { y: "-100%", duration: 1, stagger: 0.075 }, index * 1 + 1)` — each pair rolls up and out one second after it rolled in. Apply this to every pair (including the last). Net effect: each number slides up into the mask, holds implicitly via the overlap, and exits upward as the next slides in — a continuous odometer roll through 00, 27, 65, 98, 99 over ~5s.
2. **Spinner out.** `tl.to(".spinner", { opacity: 0, duration: 0.3 })` (appended after the counter finishes).
3. **Logo words in.** `tl.to(".word h1", { y: "0%", duration: 1 }, "<")` — starts at the same time as the spinner fade; "Kind" drops in from above while "Root" rises from below, meeting at center.
4. **Divider grows.** `tl.to(".divider", { scaleY: "100%", duration: 1 })` (appended). Its `onComplete` fires a separate `gsap.to(".divider", { opacity: 0, duration: 0.3, delay: 0.3 })` so the line fades out shortly after fully drawing.
5. **Logo words out.** `tl.to("#word-1 h1", { y: "100%", duration: 1, delay: 0.3 })` (appended) and simultaneously `tl.to("#word-2 h1", { y: "-100%", duration: 1 }, "<")` — the words exit in the opposite directions they entered (crossing past each other).
6. **Block wipe + hero de-zoom.** `tl.to(".block", { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", duration: 1, stagger: 0.1, delay: 0.75 }, "<")` — both dark panels collapse to a zero-height strip at the top (an upward wipe), the second panel trailing the first by 0.1s. Its `onStart` fires `gsap.to(".hero-img", { scale: 1, duration: 2, ease: "hop" })` so the background image settles from 1.5 → 1 while the blocks lift.
7. **Nav + headline + copy in.** `tl.to([".nav", ".line h1", ".line p"], { y: "0%", duration: 1.5, stagger: 0.2 }, "<")` — the nav slides down from `-120%` while each masked headline line and the paragraph rise from `120%`, 0.2s apart, starting together with the block wipe.
8. **CTA pill.** `tl.to([".cta", ".cta-icon"], { scale: 1, duration: 1.5, stagger: 0.75, delay: 0.75 }, "<")` — the white pill scales up from 0 (keeping its `translateX(-50%)` centering), then the dark icon circle pops in 0.75s later.
9. **CTA label.** `tl.to(".cta-label p", { y: "0%", duration: 1.5, delay: 0.5 }, "<")` — the "View all products" text rises inside its clip mask.

Note the chained `"<"` position params on steps 6–9: they all anchor to the start of step 5's word-exit, offset only by their own `delay` values, so the loader exit and hero entrance overlap into one continuous move. Total sequence runs roughly 9–10 seconds and never repeats.

## Assets / images

One image: a full-bleed background hero, revealed behind the loader — a close-up natural beauty/skincare editorial portrait (bare glowing skin, soft warm neutral backdrop). Landscape orientation works best; it covers the whole viewport via `object-fit: cover`, so any high-res photo ≥ 1920×1080 is fine.

## Behavior notes

- The animation runs once on page load; there is no scroll interaction and the page is exactly one viewport tall (`overflow: hidden` on the container).
- The loader stays in the DOM after finishing (the blocks are clipped away and the divider/spinner faded to 0), which is fine because everything inside it is invisible by then; keep `pointer-events` a non-issue by simply leaving it — or optionally set `pointer-events: none` on `.loader` so nav links remain clickable.
- Use `will-change: transform` on the animated movers (nav, cta, cta-icon, divider, hero-img, masked h1/p elements) for smoothness.
- Use `100svh` (not `100vh`) for the loader and container heights so mobile browser chrome doesn't cause jumps.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/truekindskincare-landing-page-reveal-javascript/hero-img.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--sage`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, reaches into the page through a dozen unscoped selectors, and plays a single timeline exactly once. React withdraws all three of those guarantees at once, and it does it quietly — the counter still rolls through its five pairs, the divider still grows, and it misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component builds exactly one `gsap.timeline` that carries the whole reveal — the five `.count` pairs rolling 00 → 27 → 65 → 98 → 99, the "Kind"/"Root" wordmark crossing, the divider growing and then fading, the two `.block` panels wiping upward while `.hero-img` de-zooms underneath them, then the nav, the masked headline lines, the subcopy and the CTA pill entering — end to end, once. Mount it twice without tearing the first one down and you get two timelines driving the same digits, the same two panels and the same background image at once: the counter jitters between two positions instead of rolling cleanly, both blocks wipe a second time immediately after the first, and the CTA pill scales in and then scales in again. None of this reproduces in a production build, because React only double-mounts in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`: it registers the listener only when the document is still `"loading"`, and calls its boot function directly otherwise. That guard exists to make the script safe to drop in late on a plain HTML page; `useEffect` already runs after the DOM is committed, so in React the guard and the listener are both dead weight. Delete both and move the timeline construction — every `.to()` call from the counter roll through the CTA label — directly inside a `useEffect` with an empty dependency array. `gsap.registerPlugin(CustomEase)` and the creation of the named "hop" ease are already sitting above the boot logic, at module scope: leave them exactly there. They register a bezier-based ease once for the whole module, not per-mount state, and re-running that registration inside the effect on every mount would be harmless but pointless — the same reasoning that keeps `gsap.registerPlugin` itself out of the effect.

*(2) Element lookups* — Every selector this component reaches for is unscoped and resolved straight off `document`: `.count`, `.digit h1`, `.spinner`, `.word h1`, `.divider`, `#word-1 h1`, `#word-2 h1`, `.block`, `.hero-img`, `.nav`, `.line h1`, `.line p`, `.cta`, `.cta-icon`, `.cta-label p`. Give the component a root ref standing in for the page's two top-level siblings — the loader overlay and the hero container — and resolve every one of these off that ref instead of off `document`. The two ID selectors carry the sharper risk: `#word-1` and `#word-2` are supposed to be unique per document, but nothing stops this hero from existing twice on the same page — two demo variants rendered side by side, or the instant during a StrictMode remount when two copies of the subtree exist at once. `document.querySelector("#word-1 h1")` does not error on a duplicate id, it silently binds to whichever `#word-1` comes first in the DOM, so one instance's "Kind" wordmark ends up driven by both timelines while the other instance's copy never moves, with nothing in the console to point at the collision.

*(3) Cleanup* — Wrap the timeline in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the effect exactly as described above: the single gsap.timeline covering the
       counter roll, the logo cross, the divider draw, the block wipe with its nested
       hero-img de-zoom, and the nav/headline/CTA entrance */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

The script already ships a hand-written teardown for its own editor-driven re-mount path — killing the timeline, then calling `gsap.killTweensOf()` and clearing every inline style GSAP wrote, over a maintained list of every selector the sequence touches. That list is worth reading before you replace it, because it shows exactly what a correct cleanup has to cover, including the two tweens that live outside the timeline itself: the divider's fade-out, fired from the divider tween's own completion callback, and the hero image's de-zoom, fired from the block wipe's start callback. Both are easy to drop from a hand-maintained selector list the moment someone adds a step to the sequence later; `gsap.context` catches them automatically, because it tracks everything created inside its scope during the effect, not everything reachable through one timeline variable. Skip the revert and a StrictMode remount leaves two timelines animating the same `.count` digits, the same two `.block` panels and the same `.hero-img`, so the counter jitters between two positions and the wipe fires twice back to back. There is no `ScrollTrigger` and no `gsap.ticker` subscription anywhere in this component — the whole effect lives inside the one timeline — so the context revert is the complete cleanup, with nothing else left to unwind.
