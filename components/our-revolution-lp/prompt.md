# Landing Page Reveal — Portrait-Strip Preloader Wipe-Up

## Goal
Build a full-screen editorial landing hero with a cinematic **preloader-to-hero reveal** that plays automatically once on page load (~6.5 seconds total). A black full-screen loader holds a horizontal strip of **seven tall portrait images** (six photos plus a centered white monogram logo). On load the seven images **rise up from below** and stagger in, then the whole strip **slides sideways**; the six photos (but not the center logo) **wipe away upward** one after another via an animated `clip-path`; the entire black loader panel then **wipes upward** the same way, uncovering the page beneath; finally the nav links, the three-line hero headline, and the four footer thumbnails all **slide up and fade in**. Everything is driven by one single GSAP timeline using `power3.inOut` easing.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) only — **no** GSAP plugins and **no** smooth-scroll library (the page never scrolls; `body` is `overflow:hidden`). Import the default export (`import gsap from "gsap"`) and fire the whole sequence inside a `DOMContentLoaded` listener.

## Layout / HTML
Semantic structure (class names / the `#loader-logo` id are load-bearing — the JS/CSS query them):

```
<div class="container">

  <!-- fixed black preloader on top of everything -->
  <div class="loader">
    <div class="loader-imgs">
      <div class="img"><img src="..." alt="" /></div>          <!-- photo 1 -->
      <div class="img"><img src="..." alt="" /></div>          <!-- photo 2 -->
      <div class="img"><img src="..." alt="" /></div>          <!-- photo 3 -->
      <div class="img" id="loader-logo"><img src="logo.png" alt="" /></div>  <!-- CENTER logo, survives the wipe -->
      <div class="img"><img src="..." alt="" /></div>          <!-- photo 4 -->
      <div class="img"><img src="..." alt="" /></div>          <!-- photo 5 -->
      <div class="img"><img src="..." alt="" /></div>          <!-- photo 6 -->
    </div>
    <div class="loader-tag">Umbra &middot; a film &amp; motion studio</div>
  </div>

  <!-- the page underneath, revealed when the loader wipes away -->
  <div class="website-content">
    <nav>
      <div class="nav-item"><a href="#">( work )</a></div>
      <div class="nav-item" id="logo"><a href="#">Umbra</a></div>
      <div class="nav-item"><a href="#">( contact )</a></div>
    </nav>

    <div class="hero">
      <div class="h1"><h1>films made</h1></div>
      <div class="h1"><h1>in light and</h1></div>
      <div class="h1"><h1><span>shadow</span></h1></div>
    </div>

    <footer>
      <div class="item"><img src="..." alt="" /></div>
      <div class="item"><img src="..." alt="" /></div>
      <div class="item"><img src="..." alt="" /></div>
      <div class="item"><img src="..." alt="" /></div>
    </footer>
  </div>

</div>
```

Notes:
- `.loader-imgs` holds exactly **7** `.img` wrappers. The **4th one (the center)** carries `id="loader-logo"` and holds the monogram logo — it is the one image that is **excluded** from the photo wipe and stays visible until the whole loader panel wipes away.
- `.website-content` holds the nav, the hero, and the footer, and sits underneath the loader.
- Use **"Umbra"** as the neutral placeholder brand name in the center nav slot; the side links are `( work )` and `( contact )`. The three headline lines read "films made / in light and / shadow" — the word **"shadow"** is wrapped in a `<span>` so it can be painted lilac.
- `.loader-tag` is one extra line inside the loader, under the strip: `Umbra · a film & motion studio`. It is purely typographic (no animation of its own) and rides the loader's clip-path collapse with everything else.

## Styling
Fonts, all free: **Space Grotesk** for the headline and the wordmark, **Inter** for the page default, **Space Mono** for the nav links and the loader tagline (uppercase, wide tracking).

Palette — a near-black room with one lilac lead and one ember pop:
```css
:root {
  --bg: #0f0f0f;
  --bg-glow: #17151d;   /* the projector pool behind the headline */
  --ink: #f5f2ec;
  --muted: #8c8c88;     /* nav links at rest */
  --accent: #c9b8f5;    /* lilac: the highlighted word, the loader tag, hover */
  --pop: #ff5a1f;       /* ember: exactly one 52×2px rule above the headline */
}
```

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `html, body { font-family:"Inter"; background: var(--bg); color: var(--ink); overflow:hidden }` (no scrolling).
- `body` additionally carries `background: radial-gradient(ellipse 90% 70% at 38% 42%, var(--bg-glow) 0%, var(--bg) 62%)` — a soft pool of light where the headline sits, so the black is not flat.
- `img { width:100%; height:100%; object-fit:cover }`.
- `a { text-decoration:none; color: var(--ink) }`.
- The photographs are graded down with `filter: saturate(.72) contrast(1.06) brightness(.96)` (both the strip frames and the footer thumbnails, but **not** the logo) so a set of warm film stills sits inside the cold palette.

Key elements (positioning + the **clip-paths and initial states the animation depends on**):

- `.loader`: `position:fixed; width:100vw; height:100vh; background:#000; pointer-events:none` (pure black here, one step below the page `--bg`, so the intro reads as a separate surface). **Initial** `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rectangle — covers the whole viewport). This exact 4-point full-rect clip-path is required so GSAP can later animate it to a collapsed polygon.
- `.loader-imgs`: `width:150%; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); display:flex; gap:50px`; same full-rect `clip-path`. It is **150% wide**, centered, so the strip overflows the viewport on both sides.
- `.img`: `position:relative; flex:1` (seven equal columns filling the 150% strip); same full-rect `clip-path` on each.
- `nav`: `width:100%; padding:32px 48px; display:flex; align-items:baseline`.
  - `.nav-item`: `position:relative; flex:1` (three equal thirds). Their links are Space Mono 11px uppercase in `--muted`, turning `--accent` on hover. `.nav-item:nth-child(2)` (the brand): `text-align:center`, Space Grotesk 22px/600 in `--ink`, not uppercased. `.nav-item:nth-child(3)`: `text-align:right`.
- `.hero`: `width:100%; position:absolute; top:46%; transform:translateY(-50%); text-align:left; padding:0 48px`. A `.hero::before` draws the single ember rule (`52px × 2px`, `background: var(--pop)`, `margin: 0 0 30px 4px`) above the first line — the only warm thing on the page, and the reason the lilac reads as cool.
  - `.h1`: `width:100%; text-align:left`; same full-rect `clip-path` on each line.
  - `h1`: `position:relative; font-family:"Space Grotesk"; font-weight:600; font-size:9vw; line-height:0.96; letter-spacing:-0.03em`.
  - `h1 span`: `display:inline-block; color: var(--accent); text-shadow: 0 0 60px rgba(201,184,245,.12)` (the word "shadow" steps out of the dark in lilac).
- `footer`: `width:100%; position:absolute; bottom:40px; right:48px; display:flex; align-items:flex-end; justify-content:flex-end; gap:10px`; same full-rect `clip-path`.
  - `.item`: `position:relative; width:92px; height:116px; overflow:hidden; outline:1px solid rgba(245,242,236,.12); outline-offset:-1px` (four **portrait** thumbnails, bottom-right, `object-fit:cover`).
- `#loader-logo img`: `object-fit:contain` with `filter: drop-shadow(0 0 34px rgba(201,184,245,.45))` — a faint lilac halo so the wordmark reads against the black intro.
- **Mobile (`max-width: 768px`)**: the strip stops being 150% wide (`width:auto`, `gap:14px`) and each `.img` becomes a `88vw × 52vh` card, so the centre logo lands on screen instead of off it.

## GSAP effect (be exact)

### Initial states — set BEFORE building the timeline
```js
gsap.set(".img",        { y: 500 });            // all 7 strip images pushed 500px DOWN
gsap.set(".loader-imgs",{ x: 500 });            // whole strip shifted 500px to the RIGHT
gsap.set(".nav-item",   { y: 25, opacity: 0 }); // nav items 25px down, invisible
gsap.set("h1, .item, footer", { y: 200 });      // hero headlines, footer thumbs AND the footer container 200px down
```
(The full-rect `clip-path` initial states come from the CSS above, not from `gsap.set`.)

### One single timeline, delayed 1s
```js
const tl = gsap.timeline({ delay: 1 });
```
The whole sequence waits **1s** after `DOMContentLoaded`, then plays as a chain of five tweens. Position parameters are **relative offsets** (`"-=X"` = start X seconds before the current end of the timeline) — reproduce them exactly.

**Tween 1 — images rise (starts at timeline t=0):**
```js
tl.to(".img", {
  y: 0,
  duration: 1.5,
  stagger: 0.05,
  ease: "power3.inOut",
});
```
All 7 `.img` wrappers rise from `y:500` to `y:0`, left-to-right stagger `0.05s`, each `1.5s`, `power3.inOut`. (Strip fills from `t≈0` to `t≈1.8`.)

**Tween 2 — strip slides sideways (position `"-=2.5"`):**
```js
tl.to(".loader-imgs", {
  x: 0,
  duration: 3,
  ease: "power3.inOut",
}, "-=2.5");
```
The whole strip slides from `x:500` to `x:0` (moves left ~500px) over `3s`. Position `"-=2.5"` computes to a negative insertion point (GSAP clamps it to `0`), so this runs **in parallel with the rising images**, starting at `t≈0` and ending at `t≈3`.

**Tween 3 — the six photos wipe away upward (position `"-=1"`):**
```js
tl.to(".img:not(#loader-logo)", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
  duration: 1,
  stagger: 0.1,
  ease: "power3.inOut",
}, "-=1");
```
Every `.img` **except the center `#loader-logo`** (i.e. the 6 photos) animates its clip-path from the full rectangle to `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)` — the bottom edge collapses up to the top edge, so each photo **wipes away upward**, staggered `0.1s`, `1s` each. Starts at `t≈2`. The center logo stays visible on the black panel.

**Tween 4 — the whole black loader wipes upward (position `"-=0.5"`):**
```js
tl.to(".loader", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
  duration: 1,
  ease: "power3.inOut",
}, "-=0.5");
```
The entire black `.loader` panel (still carrying the center logo) collapses its bottom edge up to the top the same way — wiping the whole preloader **upward off the screen** over `1s`, uncovering `.website-content` beneath. Starts at `t≈3`.

**Tween 5 — page content slides up + fades in (position `"-=0.5"`):**
```js
tl.to(".nav-item, h1, footer, .item", {
  y: 0,
  opacity: 1,
  stagger: 0.1,
  duration: 1,
  ease: "power3.inOut",
}, "-=0.5");
```
All nav items (3), all hero headline `h1`s (3), the footer container, and the footer thumbnails (4) — 11 targets total — slide from their offset (`y:200`, or `y:25` for nav) to `y:0` and fade `opacity 0→1` (only the nav items were transparent), staggered `0.1s`, `1s` each. Starts at `t≈3.5`, ends at `t≈5.5`.

### Timeline summary (timeline-relative seconds; add the 1s delay for wall-clock)
| t (s) | what |
|-------|------|
| 0.0–1.8 | 7 strip images rise `y:500→0` (stagger 0.05, dur 1.5) |
| 0.0–3.0 | strip slides `x:500→0` (dur 3) — parallel |
| 2.0–3.5 | 6 photos wipe upward via clip-path (stagger 0.1, dur 1) |
| 3.0–4.0 | whole black loader wipes upward via clip-path (dur 1) |
| 3.5–5.5 | nav + hero h1s + footer + thumbs slide up & fade in (stagger 0.1, dur 1) |

Total runtime ≈ **6.5s** (including the 1s start delay). Every tween uses `ease: "power3.inOut"`.

### Ease reference
- **Everything** uses `power3.inOut`. There is no CustomEase, SplitText, ScrollTrigger, lerp loop, or Three.js in this component — it is a pure load-triggered timeline of `y`, `x`, `clip-path` and `opacity` tweens.

## Assets / images
Thirteen image slots total: **6 tall portrait photos** + **1 portrait logo** in the loader strip, and **4 square thumbnails** in the footer.

- **Loader strip photos (6)** — tall **portrait ~2:3** editorial/cinematic frames, `object-fit:cover`, each a single subject with a moody, atmospheric palette (mixed teals, golds, greens). Roughly, in strip order: (1) a lone figure walking a wet reflective floor toward a shaft of light between dark angular walls; (2) extreme close-up of a glossy helmet with a swirled gold visor on lime-green; (3) a spacesuited figure before a huge pale sphere in hazy golden light; then the center logo; (4) a dark slit-view of a lower face holding a lit cigarette; (5) an orange-lit silhouette pressing a hand on frosted glass; (6) a side-lit portrait of a woman in dark clothing on a dark teal backdrop. They are only briefly seen before wiping away, so the palettes need not match.
- **Center logo (`#loader-logo`)** — an ornate **white cursive monogram letter on a solid black background**, **portrait ~3:4**. This is the one image that stays visible while the six photos wipe, then leaves with the black panel. Keep it on a black field so it blends into the loader.
- **Footer thumbnails (4)** — small **square** images (cropped to 100×100 via `object-fit:cover`), bottom-right. Any editorial/3D-render/portrait subjects work (e.g. a surreal metallic-faced 3D figure, a golden lucky-cat figurine in a red niche, a veiled portrait, a warm hazy city skyline). Do not use real brand marks.

If you have fewer fixtures than slots, repeat images to fill; if more, use the first ones.

## Behavior notes
- **Autoplay once** on `DOMContentLoaded`; no scroll, hover, or click triggers. The page never scrolls (`overflow:hidden`).
- The clip-path target `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)` is the "wipe upward" shape (bottom edge collapsed to the top). The full-rectangle initial clip-paths on `.loader`, `.loader-imgs`, `.img`, `.h1` and `footer` must be present in CSS so GSAP can tween between matching 4-point polygons.
- No `will-change` hints, no reduced-motion handling, and no responsive breakpoints in the original — it renders the same at all widths (the loader strip is `150%` wide and centered, so it always overflows). Layout is light and mobile-safe.

## Images

This component ships with 11 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/our-revolution-lp/img1.jpg
https://motionprompts.dev/c/our-revolution-lp/img10.jpg
https://motionprompts.dev/c/our-revolution-lp/img2.jpg
https://motionprompts.dev/c/our-revolution-lp/img3.jpg
https://motionprompts.dev/c/our-revolution-lp/img4.jpg
https://motionprompts.dev/c/our-revolution-lp/img5.jpg
… 5 more under https://motionprompts.dev/c/our-revolution-lp/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--bg-glow`, `--ink`, `--muted`, `--accent`, `--pop`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with plain selector strings, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, plays its reveal, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component only ever builds one thing — a single chained `gsap.timeline` that autoplays once, a second after mount — so a double-invoke does not double a scrub or a loop, it starts a second, independent six-and-a-half-second reveal on top of the first: two `.loader` panels each racing their own clip-path collapse, two strips of the same seven `.img` wrappers rising and re-wiping on different clocks, and the `.nav-item`/`h1`/`footer` fade-in firing twice with each pass's final inline values stomping the other's. The visible symptom is a preloader that never fully clears, or hero text and thumbnails that settle at the wrong opacity, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — the whole effect lives inside `document.addEventListener("DOMContentLoaded", function () {...})`, with no `readyState` guard. By the time a React component mounts, `DOMContentLoaded` has already fired, so that listener is registered and never called: the four initial `gsap.set` calls never run, the `delay`-based timeline is never built, and the page just sits on `.loader`'s fully opaque black rectangle forever, uncovering nothing, with nothing in the console to explain why. Delete the listener and move its entire body — the four `gsap.set` calls and the `tl` construction with its five chained `.to()` calls — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — there is no `document.querySelector` anywhere in this script; every target is a bare selector string handed straight to `gsap.set`/`.to`: `.img`, `.loader-imgs`, `.nav-item`, the compound `"h1, .item, footer"`, `.loader`, and the exclusion `.img:not(#loader-logo)` that keeps the center monogram out of the six-photo wipe. The risk these strings carry is identical to an unscoped `querySelector`: resolved against the whole document, not this component's own subtree. `gsap.context` closes that gap for free, but only if you pass the root ref as its second argument — every plain selector string used inside the factory is then auto-scoped to that ref's descendants, with no need to touch the selector strings themselves. That matters most for `"h1, .item, footer"`: three bare tag/class names with no component-specific prefix, exactly the kind of selector that can also match an `h1` or a `footer` belonging to a different section of the host page, or — during the StrictMode remount, when two copies of this subtree briefly coexist — the outgoing copy instead of the one this effect run actually owns.

*(3) Cleanup* — wrap the four `gsap.set` calls and the five-tween timeline in one `gsap.context` scoped to the root ref, and revert that context in the effect's cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // the four gsap.set(...) initial states, then `tl` and its five chained .to() calls, unchanged
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Every write this component makes — the four initial-state calls and all five tweens on `tl` — happens synchronously inside that one factory pass: nothing here registers a deferred handler through `self.add`, and nothing ticks outside of GSAP's own timeline (no `ScrollTrigger`, no `gsap.ticker`, no rAF loop of its own). That makes `ctx.revert()` a complete teardown by itself. It kills `tl` wherever it currently sits in its run — still inside the one-second start delay, mid-rise, or already collapsing `.loader`'s clip-path — and strips every inline style the four `gsap.set` calls and five tweens wrote, so a StrictMode-triggered second mount starts from the untouched CSS defaults (the full-rectangle clip-paths, the `y:500`/`x:500` offsets, the zero nav opacity) instead of from wherever the reverted first pass happened to leave `.img`, `.loader-imgs`, `.nav-item`, or the hero `h1`s. Skip the revert and the leftover first-pass timeline keeps writing to elements the second, independent timeline is now also driving — the failure mode described above, where the black panel never finishes wiping away or the footer thumbnails settle at a value neither pass intended.
