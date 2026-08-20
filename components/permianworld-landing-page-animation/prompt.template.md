---
slug: permianworld-landing-page-animation
native_system: entry-veil
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 2
structural_literals: 15
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "0.75", rule: value/narrated }
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: stagger, literal: "0.075", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Landing Page Reveal — Stepped-Square Preloader + Clip-Path Unmask

## Goal
Build a full-screen editorial landing hero fronted by a cinematic **preloader-to-hero reveal** that plays automatically once on page load (~5.5 seconds). A black full-screen preloader panel holds two columns of small mono copy and a two-digit counter; the masked copy lines and the counter slide up into view, the counter ticks randomly from `00 → 100`, and a centered olive-khaki square scales up from nothing to full-viewport in **five discrete stepped increments** (each with its own duration/ease so it grows in visible pulses rather than one smooth zoom). Then the whole black preloader wipes **upward** via an animated `clip-path` polygon while — in perfect sync — the nav bar, the hero background image, and the hero content caption all slide up from `35svh` below into their final positions. One single GSAP timeline drives the whole thing; the counter is a separate randomized JS ticker.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`SplitText`** (the only plugin). No smooth-scroll library — the page does not scroll during the intro; it is a pure load-triggered timeline. Register with `gsap.registerPlugin(SplitText)` and fire everything on `DOMContentLoaded`.

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```
<div class="preloader">
  <div class="preloader-revealer"></div>

  <div class="preloader-copy">
    <div class="preloader-copy-col">
      <p>Handpicked collections shaped by artistry, balancing rare elements with a focus on purity.</p>
    </div>
    <div class="preloader-copy-col">
      <p>Explore timeless essentials built with care, thoughtfully designed to guide you.</p>
    </div>
  </div>

  <div class="preloader-counter">
    <p>00</p>
  </div>
</div>

<nav>
  <div class="nav-logo"><a href="#">Atelier Vale</a></div>
  <div class="nav-links">
    <a href="#">Collections</a>
    <a href="#">New Arrivals</a>
    <a href="#">The Atelier</a>
    <a href="#">Support</a>
  </div>
  <div class="nav-cta"><a href="#">Create Account</a></div>
</nav>

<section class="hero">
  <div class="hero-img"><img src="..." alt="" /></div>
  <div class="hero-content">
    <div class="product-name"><p>[ Ember No. 04 ]</p></div>
    <div class="product-link"><a href="#">View the Collection</a></div>
  </div>
</section>
```

Notes:
- `.preloader` is a **fixed** full-screen panel that sits on top of everything (`z-index: 2`). `.preloader-revealer` is the centered square that scales up; the two `.preloader-copy-col` paragraphs and the `.preloader-counter p` are the mono copy/number inside it.
- Use **"Atelier Vale"** as the neutral placeholder brand. Keep the copy text as-is (two short editorial paragraphs) and the product caption `[ Ember No. 04 ]` / `View the Collection`.
- The `nav` has three flex zones: logo (left), links (center, 4 links), CTA (right).
- `.hero` is a single section with a full-bleed background image and a small centered two-row caption near the bottom.

## Styling
Font (Google Fonts): **Geist Mono** (variable, `wght 100..900`) is the only web font — import it. Everything is small mono type; there is **no** giant display headline.

Palette (CSS custom properties):
- `--base-100: #fff` (white — inverted text, hero-name panel bg)
- `--base-200: #eff1eb` (pale warm off-white — nav-link chip background)
- `--base-300: #5b553b` (dark olive/khaki — default text color, the revealer square, the product-link bar)
- `--base-400: #000` (black — preloader background)

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `a, p { color:var(--base-300); text-decoration:none; text-transform:uppercase; font-family:"Geist Mono"; font-size:0.8rem; font-weight:500; letter-spacing:-0.0125rem; line-height:1; display:inline-block }`.

Key elements and their **initial states** (the animation depends on these):

- `nav`: `position:fixed; top:0; left:0; width:100%; display:flex; gap:2rem; padding:2rem; z-index:1; will-change:transform`. `.nav-logo, .nav-cta { flex:1; display:flex }`; `.nav-cta { justify-content:flex-end }`; `.nav-links { flex:2; display:flex; justify-content:center; gap:0.5rem }`.
- `nav a`: `height:max-content; color:var(--base-300); background-color:var(--base-200); padding:0.25rem 0.5rem` (small pale chips). `.nav-logo a` is **inverted**: `color:var(--base-100); background-color:var(--base-300)` (white text on olive).

- `section.hero`: `position:relative; width:100%; height:100svh; overflow:hidden; will-change:transform`.
- `.hero-img`: `position:absolute; top:0; left:0; width:100%; height:100%; will-change:transform` (full-bleed image layer).
- `.hero-content`: `position:absolute; bottom:5rem; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; will-change:transform` (small centered two-row caption).
- `.product-name, .product-link`: `flex:1; width:100%; display:flex; justify-content:center; align-items:center; padding:0.75rem 2.5rem`. `.product-name { background-color:var(--base-100) }` (white bar, olive text). `.product-link { background-color:var(--base-300) }` with `.product-link a { color:var(--base-100) }` (olive bar, white text).

- `.preloader`: `position:fixed; top:0; left:0; width:100%; height:100svh; display:flex; align-items:center; padding:2rem; background-color:var(--base-400); overflow:hidden; z-index:2; will-change:clip-path`. **Initial** `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rectangle covering the screen). `.preloader p { color:var(--base-100) }` (white text on black).
- `.preloader-revealer`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) scale(0); width:100%; aspect-ratio:1; background-color:var(--base-300); z-index:2; will-change:transform` (a viewport-wide **square**, centered, starting at `scale(0)` → invisible).
- `.preloader-copy, .preloader-copy-col, .preloader-counter { flex:1; display:flex }`. `.preloader-counter { justify-content:flex-end }` (counter pinned to the right). `.preloader-copy p { width:75% }` (the two copy paragraphs are constrained so each wraps to ~2 lines).
- `.line { will-change:transform; transform:translateY(100%) }` — this class is produced by SplitText below; the CSS pre-hides every split line one line-height **below** its mask.

Stacking note: the copy columns and the counter are static flex children (auto z-index), while `.preloader-revealer` is `z-index:2`, so the growing olive square paints **over** the copy — as the square swells it engulfs the text.

## GSAP effect (be exact)

### Setup
```js
gsap.registerPlugin(SplitText);

// Helper: split into LINES, masked, each line wrapped in overflow-hidden and given class "line"
const splitTextIntoLines = (selector, options = {}) =>
  SplitText.create(selector, {
    type: "lines",
    mask: "lines",
    linesClass: "line",
    ...options,
  });

splitTextIntoLines(".preloader-copy p");     // both copy paragraphs → masked .line spans
splitTextIntoLines(".preloader-counter p");  // the "00" → a single masked .line span

// Push the whole page content down, hidden below the preloader, ready to slide up:
gsap.set(["nav", ".hero-img", ".hero-content"], { y: "35svh" });
```

### Counter — randomized JS ticker (NOT GSAP)
A standalone function `animateCounter(selector, duration = 4.5, delay = 2)` drives the two-digit number with `setTimeout`, called as `animateCounter(".preloader-counter p", 4.5, 2)`:

- Capture `startTime = Date.now()` immediately (at `DOMContentLoaded`), `maxDuration = duration * 1000 = 4500ms`, `currentValue = 0`.
- After a `delay * 1000 = 2000ms` timeout, run a self-scheduling `updateCounter()`:
  - `elapsed = Date.now() - startTime`; `progress = elapsed / maxDuration`.
  - While `currentValue < 100 && elapsed < maxDuration`: compute `target = Math.floor(progress * 100)` and a random `jump = Math.floor(Math.random() * 25) + 5` (i.e. **5–29**); set `currentValue = Math.min(currentValue + jump, target, 100)`; write it as `String(currentValue).padStart(2, "0")` into the element's `textContent`; re-schedule via `setTimeout(updateCounter, 200 + Math.random() * 100)` (**200–300ms** between ticks).
  - Otherwise (time's up) set `textContent = "100"`.
- Net behavior: the counter is invisible/`00` until ~**t=2s**, then jumps to the teens/20s and climbs with a stuttering, target-clamped, randomized cadence, reaching `100` at ~**t=4.5s**. Note `textContent` writes replace the SplitText `.line` wrapper with plain text — that's expected (the line-reveal below only animates the initial `00`, then the ticker takes over as plain visible text).

### The master timeline
One timeline: `const tl = gsap.timeline();`. Position params: `"<"` = align to the start of the previous tween; `"-=1"` = start 1s before the current timeline end. **All scale tweens act on the same `.preloader-revealer`, chained sequentially** (except the first, which is parallel to the line reveal).

1. **Copy + counter lines slide up** (`delay: 1` → starts at **t=1**):
```js
tl.to([".preloader-copy p .line", ".preloader-counter p .line"], {
  y: "0%", duration: 1, stagger: 0.075, ease: "power3.out", delay: 1,
});
```
Every masked line rises from `translateY(100%)` (hidden below) to `0%`, staggered `0.075s`, decelerating (`power3.out`).

2. **Revealer square, step 1** (position `"<"` → parallel, starts **t=1**):
```js
tl.to(".preloader-revealer", { scale: 0.1, duration: 0.75, ease: "power2.out" }, "<");
```
Square `scale 0 → 0.1`.

3. **Revealer step 2** (sequential, **t=2**): `{ scale: 0.25, duration: 1, ease: "power3.out" }` — `0.1 → 0.25`.
4. **Revealer step 3** (sequential, **t=3**): `{ scale: 0.5, duration: 0.75, ease: "power3.out" }` — `0.25 → 0.5`.
5. **Revealer step 4** (sequential, **t=3.75**): `{ scale: 0.75, duration: 0.5, ease: "power2.out" }` — `0.5 → 0.75`.
6. **Revealer step 5** (sequential, **t=4.25**): `{ scale: 1, duration: 1, ease: "power3.out" }` — `0.75 → 1` (fills the viewport width; at `aspect-ratio:1` it covers the screen). The five different durations/eases make the square appear to grow in **discrete pulses**.

7. **Preloader wipes upward** (position `"-=1"` → starts **t=4.25**, 1s before step 6 ends):
```js
tl.to(".preloader", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
  duration: {{motion.duration.base}}, ease: "power3.out",
}, "-=1");
```
The clip-path's two bottom corners rise to meet the top (`100% → 0%` on the Y of the lower points), collapsing the black panel's height to zero at the top — the whole preloader (black bg + olive square + text) wipes **up and off** the top of the screen.

8. **Nav + hero slide up into place** (position `"<"` → parallel with step 7, **t=4.25**):
```js
tl.to(["nav", ".hero-img", ".hero-content"], {
  y: "0%", duration: {{motion.duration.base}}, ease: "power3.out",
}, "<");
```
The nav bar, the hero background image, and the hero caption all slide from `y: 35svh` (below) up to `0`, revealed exactly as the black preloader recedes upward.

### Timeline summary (absolute seconds)
| t (s) | what |
|------|------|
| 1.0–2.0 | copy + counter masked lines slide up (`y 100%→0%`, stagger 0.075, power3.out) |
| 1.0–1.75 | revealer square `scale 0→0.1` (power2.out) |
| 2.0–3.0 | revealer `0.1→0.25` (power3.out) |
| 2.0–4.5 | counter ticks `00→100` (randomized JS, independent of timeline) |
| 3.0–3.75 | revealer `0.25→0.5` (power3.out) |
| 3.75–4.25 | revealer `0.5→0.75` (power2.out) |
| 4.25–5.25 | revealer `0.75→1` (power3.out) |
| 4.25–5.5 | preloader clip-path wipes up (dur 1.25, power3.out) **+ simultaneously** nav/hero-img/hero-content slide `y 35svh→0` (dur 1.25, power3.out) |

Total runtime ≈ **5.5s** (counter reaches 100 at ~4.5s, ~1s before the panel clears).

### Ease reference
- `power3.out` — the line reveal, revealer steps 2/3/5, and both the clip-path wipe and the nav/hero slide.
- `power2.out` — revealer steps 1 and 4 only.
- No CustomEase, no ScrollTrigger, no lerp/rAF loop (the counter uses `setTimeout`, not `requestAnimationFrame`).

## Assets / images
**One** full-screen hero background image (landscape, ~3:2), displayed full-bleed (`object-fit: cover`, fills `.hero-img`). Aspect ratio is flexible since it is cover-cropped. The real asset is an **aerial landscape**: banded sandstone strata sweeping across the frame in cream, rust and salmon layers, with mesas on the horizon under a dusk sky. Dominant colors are warm sand, terracotta and pale cream — the same family as the `--base-100` / `--base-300` type palette, which is why the page reads as one piece. Legibility does not depend on the photo: every piece of text over the hero sits on its own solid chip (`nav a`, `.nav-logo a`, `.product-name`, `.product-link`), so a bright image is fine here. Any wide, high-texture landscape works if unavailable.

## Behavior notes
- **Autoplay once** on load (`DOMContentLoaded`); no scroll, hover, or click triggers. The page does not scroll during the intro.
- Uses `100svh` (small viewport height) so mobile browser chrome doesn't clip the preloader or hero.
- Keep the `will-change` hints (`clip-path` on `.preloader`, `transform` on the revealer, nav, hero layers, and split lines) — they matter for smooth clip-path and transform animation.
- **Responsive** (`@media max-width: 1000px`): `nav .nav-links` is hidden (`display:none`); `.preloader` and `.preloader-copy` switch to `flex-direction:column`; `.preloader-revealer` widens to `width:200%` (so the square still covers the taller portrait viewport); `.preloader-copy-col` and `.preloader-counter` become `align-items:center`; `.preloader-copy p` goes full `width:100%`. The animation logic itself is unchanged — only layout adapts.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/permianworld-landing-page-animation/hero.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--base-100`, `--base-200`, `--base-300`, `--base-400`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and — in most of this catalogue — never has to undo itself. This component is a partial exception worth naming up front, because it changes what "port it" actually means here: `script.js` already ships a `mount(config)` / `destroy()` pair, built so this catalogue's own visual editor can tear the preloader down and rebuild it with different knobs (the four entries in `DEFAULTS`) without a page reload. Its `destroy()` already clears every pending counter timeout, kills the timeline, sweeps `gsap.killTweensOf` and `clearProps` over the elements it touched, and reverts both `SplitText` instances — most of the shape a React cleanup needs. What it was not written for is React 19's StrictMode, which mounts, unmounts and mounts again **before anything reaches the screen**, and does it quietly.

Run two `mount()` calls back to back with nothing between them and you get a second `SplitText.create(".preloader-copy p", …)` pass wrapping `.line` spans that are already `.line` spans from the pass a moment earlier; a second `animateCounter` still mid-climb from the first mount, its own timeouts still firing and still writing digits into `.preloader-counter p`, racing the second mount's freshly-started climb on the same node; and two `gsap.timeline()` instances both stepping `.preloader-revealer` through its five scale increments out of phase, so the square visibly jumps size instead of pulsing through it. None of this reproduces in a production build, since React only double-invokes effects in development — treat the cleanup as load-bearing, not defensive.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only falls back to that guard when it isn't running inside `window.MP`, this catalogue's own tuning harness for `mount(config)`. Neither survives the move to React: the harness branch has no shipped equivalent, and the readiness guard is dead weight once `useEffect` already guarantees the DOM is committed. Drop the harness branch, the guard and the `boot` wrapper — the body of `mount(config)` (the two `SplitText.create` calls, the `gsap.set`, `animateCounter`, and the timeline) becomes the effect itself, run with `Object.assign({}, DEFAULTS)` or a `config` prop if those four knobs should stay tunable, inside a `useEffect` with an empty dependency array. `gsap.registerPlugin(SplitText)` moves to module scope, outside the component.

*(2) Element lookups* — Nearly everything here is already a bare selector string handed to a GSAP or `SplitText` call — `"nav"`, `".hero-img"`, `".hero-content"`, `".preloader-revealer"`, `".preloader"`, `".preloader-copy p"`, `".preloader-counter p"` — and once those calls run inside a `gsap.context` scoped to a root ref, GSAP resolves each one against that scope automatically; none of them needs a manual rewrite. The one lookup that does is `animateCounter`'s own `document.querySelector(selector)`, which the vanilla script calls directly against `document` to grab the node it will write `textContent` into for the whole climb from `00` to `100`. Route it through the same root ref (`rootRef.current.querySelector(selector)`) instead — otherwise a StrictMode instant where two copies of `.preloader-counter p` exist can bind the ticker to the copy that is on its way out, and every digit for the rest of the climb writes into a node no longer on screen.

*(3) Cleanup* — Wrap the `gsap.set` on `nav`/`.hero-img`/`.hero-content`, both `SplitText.create` calls and the eight-tween timeline in one `gsap.context` scoped to the root ref. `ctx.revert()` then replaces the vanilla `destroy()`'s manual `tl.kill()` + `gsap.killTweensOf` + `gsap.set(..., { clearProps: "all" })` trio in one step, in the right order relative to each other, for everything that call created synchronously. Two things stay exactly as hand-rolled as they are in the vanilla version, because `gsap.context` has no idea either one exists:

- **The counter's own timer chain.** `animateCounter` schedules itself with a plain, self-rescheduling `setTimeout`, invisible to `gsap.context` for the same reason a `gsap.ticker.add` subscription is: neither is a tween or a trigger. Keep the existing `timers` Set and `destroyed` flag exactly as written, clear every pending entry in the cleanup, and check `destroyed` before every scheduled tick runs — without it, a StrictMode unmount landing mid-climb leaves `updateCounter` rescheduling itself for the rest of its run, still writing into a node this component no longer owns.
- **The two `SplitText` instances.** Neither is a tween, so `ctx.revert()` doesn't touch them. Collect both into an array as they're created and revert them in the cleanup **after** `ctx.revert()` — reverting first would hand the timeline's own tweens nodes that no longer exist. Skip this and the next mount's `SplitText.create(".preloader-copy p", …)` nests fresh `.line` spans inside the leftover ones from the last mount, and `tl`'s first tween ends up animating the wrong, doubly-wrapped nodes.

```jsx
useEffect(() => {
  const splits = [];
  const timers = new Set();
  let destroyed = false;
  const later = (fn, ms) => {
    const t = setTimeout(() => { timers.delete(t); if (!destroyed) fn(); }, ms);
    timers.add(t);
    return t;
  };

  const ctx = gsap.context(() => {
    splits.push(SplitText.create(".preloader-copy p", { type: "lines", mask: "lines", linesClass: "line" }));
    splits.push(SplitText.create(".preloader-counter p", { type: "lines", mask: "lines", linesClass: "line" }));
    gsap.set(["nav", ".hero-img", ".hero-content"], { y: `${DEFAULTS.heroRise}svh` });
    // animateCounter(...), routed through `later`/`timers`/`destroyed` exactly as above, then the
    // eight-tween tl.to(...) chain, unchanged
  }, rootRef);

  return () => {
    destroyed = true;
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    ctx.revert();
    splits.forEach((sp) => sp.revert());
  };
}, []);
```

One gap the vanilla script doesn't carry but is worth closing in the port: only `.preloader-copy p`'s split is at real risk from font timing, since it's constrained to wrap onto about two lines and `mask: "lines"` measures those line breaks against whichever face is current the instant the split runs — Geist Mono is a variable webfont, imported for this page, and if it swaps in after the split already measured against the fallback face, the break points shift and the `.line` spans the first timeline tween slides up no longer line up with where the visible line actually starts. (`.preloader-counter p` splits a two-character `"00"` that never wraps regardless of face, so it carries no such risk.) If your font pipeline doesn't already guarantee Geist Mono is in before this mounts, gate the two splits — and the timeline construction that reads them — behind `document.fonts.ready`, attributed to the same context with the one-argument form of `self.add` so a deferred split still lands inside it:

```jsx
let self;
const ctx = gsap.context((context) => {
  self = context;
  gsap.set(["nav", ".hero-img", ".hero-content"], { y: `${DEFAULTS.heroRise}svh` });
}, rootRef);

let cancelled = false;
document.fonts.ready.then(() => {
  if (cancelled) return;
  self.add(() => {
    splits.push(/* both SplitText.create calls, now safe to measure */);
    // animateCounter(...) and the tl.to(...) chain, unchanged
  });
});

return () => {
  cancelled = true;
  destroyed = true;
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  ctx.revert();
  splits.forEach((sp) => sp.revert());
};
```

A StrictMode unmount landing before fonts settle leaves `cancelled` true, so nothing gets attributed to a context already on its way out; one landing after settles hits `ctx.revert()` exactly as already described.
