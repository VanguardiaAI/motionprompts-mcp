# Landing Page Reveal — Counter Preloader + Clip-Path Hero Unmask

## Goal
Build a full-screen editorial landing hero with a cinematic **preloader-to-hero reveal** that plays automatically once on page load (~8.5 seconds total). A giant number in the lower-left ticks `0 → 100` while it scales up and a thin horizontal progress bar draws itself across the screen. When the count finishes, the number wipes out digit by digit; then a hidden hero background image is unmasked by an animated **clip-path polygon** — collapsed to a single center point, opening to a small centered rectangle, then expanding to the full viewport — with a custom `hop` ease, while the image itself de-zooms from `2x` to `1x`. Masked **SplitText** finishes the sequence: the huge hero headline slides in character by character from the right, and the nav links and footer labels rise up from behind masks. One single GSAP timeline drives everything.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`CustomEase`** and **`SplitText`**. No smooth-scroll library — the page does not scroll during the intro; it is a pure load-triggered timeline. Register the plugins with `gsap.registerPlugin(CustomEase, SplitText)` and fire the whole sequence on `DOMContentLoaded`.

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```
<div class="preloader-counter">
  <h1>0</h1>
</div>

<nav>
  <div class="nav-logo"><a href="#">Canon</a></div>
  <div class="nav-links">
    <a href="#">Index</a>
    <a href="#">Collection</a>
    <a href="#">Material</a>
    <a href="#">Process</a>
    <a href="#">Info</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-bg">
    <img src="..." alt="" />
  </div>

  <div class="header"><h1>Canon</h1></div>

  <div class="hero-footer">
    <p>Permanence</p>
    <p>Craftsmanship</p>
    <p>Expression</p>
  </div>

  <div class="progress-bar">
    <div class="progress"></div>
  </div>
</section>
```

Notes:
- `.preloader-counter` is a **fixed** overlay element that lives outside `.hero`; it holds the big counting number and is `.remove()`d from the DOM at the end.
- Use **"Canon"** as the neutral placeholder brand/name (used both in the nav logo and as the hero headline).
- `.hero-bg` holds a single full-bleed `<img>`; the `.progress` div is a fill nested inside `.progress-bar` (two stacked bars).

## Styling
Fonts: **Space Grotesk** for the big `h1`s, **Space Mono** for the small uppercase labels. `h1 { line-height: 1 }`.

Palette (CSS custom properties):
- `--base-100: #f5f2ec` (all text / progress fill — bone, not pure white)
- `--base-200: #2c2c31` (progress-bar track colour — graphite)
- `--base-300: #0f0f0f` (page background — near-black)
- `--accent: #c9b8f5` (lilac — the live progress fill and secondary labels)
- `--accent-2: #ff5a1f` (one ember hit)

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `body { background: var(--base-300); color: var(--base-100) }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `a, p { text-decoration:none; color: var(--base-100); font-family:"Space Mono", monospace; font-size:0.85rem; line-height:1 }`.

Key elements and their **initial states** (the animation depends on these):

- `.preloader-counter`: `position:fixed; top:50svh; left:2rem; transform: translateY(-50%) scale(0.25); transform-origin:left bottom; will-change:transform; z-index:2`. Its `h1`: `font-size: clamp(2.5rem, 25vw, 25rem)`. (It starts tiny at scale `0.25`, anchored by its bottom-left corner, and grows to full size.)

- `nav`: `position:fixed; width:100%; padding:2rem; display:flex; justify-content:space-between; align-items:flex-start; z-index:1`. `.nav-links`: `display:flex; gap:2rem`.

- `.hero`: `position:relative; width:100%; height:100svh; overflow:hidden`.

- `.hero-bg`: `position:absolute; inset:0; width:100%; height:100%; z-index:-1; will-change:clip-path`. **Initial** `clip-path: polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)` (all four corners collapsed onto the center point → fully hidden).

- `.hero-bg img`: `position:absolute; top:50%; left:50%; transform: translate(-50%, -50%) scale(2); will-change:transform` (centered, zoomed to `2x`).

- `.header`: `position:absolute; bottom:4rem; width:100%; padding:2rem`. Its `h1`: `font-size: clamp(5rem, 18.5vw, 20rem)` (huge, bottom-left).

- `.hero-footer`: `position:absolute; bottom:2rem; width:100%; padding:2rem; display:flex; justify-content:space-between; align-items:flex-start` (three labels spread across the bottom).

- `.progress-bar`: `position:absolute; left:2rem; bottom:6rem; width:calc(100% - 4rem); height:1.5px; background:var(--base-200); transform-origin:left; transform:scaleX(0); will-change:transform; overflow:hidden` (the dark track, starts collapsed).
- `.progress-bar .progress`: `position:absolute; width:100%; height:100%; background:var(--base-100); transform-origin:left; transform:scaleX(0); will-change:transform` (the white fill inside the track, also starts collapsed).

Split-piece init states (these classes are produced by SplitText below; the CSS pre-hides them):
- `.word, .char, .digit { position:relative; will-change:transform }`.
- `.header h1 .char { transform: translateX(100%) }` (each headline char parked one char-width to the **right**, inside its mask).
- `nav a .word, .hero-footer p .word { transform: translateY(100%) }` (each nav/footer word parked one line **below**, inside its mask).

## GSAP effect (be exact)

### Setup
```js
gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create("hop", "0.9, 0, 0.1, 1");   // steep symmetric in-out — used for the whole hero unmask

// Helper: split + assign a class + wrap each piece in an overflow-hidden mask
const splitText = (selector, type, className) =>
  SplitText.create(selector, {
    type: type,                 // "chars" | "words"
    [`${type}Class`]: className, // charsClass / wordsClass = className
    mask: type,                  // mask each char/word so translated pieces are clipped
  });

const headerSplit = splitText(".header h1", "chars", "char");   // → .char (masked chars)
const navSplit    = splitText("nav a", "words", "word");        // → .word (masked words)
const footerSplit = splitText(".hero-footer p", "words", "word"); // → .word (masked words)

const counterProgress  = document.querySelector(".preloader-counter h1");
const counterContainer = document.querySelector(".preloader-counter");
const counter = { value: 0 };  // plain object we tween and read in onUpdate
```

Everything runs on **one** timeline: `const tl = gsap.timeline();`. Position params below are **absolute times** (numbers) or `"<"` (align to the previously-added tween's start).

### 1 — Counter ticks up (`t = 0`, the timeline's first tween)
```js
tl.to(counter, {
  value: 100,
  duration: 3,
  ease: "power3.out",
  onUpdate: () => { counterProgress.textContent = Math.floor(counter.value); },
  onComplete: () => { /* digit wipe-out, see below */ },
});
```
The number counts `0 → 100` over **3s**, decelerating (`power3.out`), written as an integer each frame.

**onComplete (fires at `t ≈ 3`) — digit wipe-out:** split the now-`"100"` number into masked chars (`splitText(counterProgress, "chars", "digit")`), then:
```js
gsap.to(counterSplit.chars, {
  x: "-100%",
  duration: 0.75,
  ease: "power3.out",
  stagger: 0.1,
  delay: 1,                 // waits 1s after the count finishes → starts ~t=4
  onComplete: () => counterContainer.remove(),  // yank the whole counter out of the DOM
});
```
Each digit of "100" slides **left** out of its mask (`x: -100%`), staggered `0.1s`, so the number wipes away character by character; then the entire `.preloader-counter` element is removed.

### 2 — Counter scales up (parallel, `"<"` → `t = 0`)
```js
tl.to(counterContainer, { scale: 1, duration: 3, ease: "power3.out" }, "<");
```
The whole counter grows from its CSS `scale(0.25)` to `scale(1)` over the same 3s, anchored at its bottom-left (`transform-origin: left bottom`), so the number swells up from the corner as it counts.

### 3 — Progress-bar track draws in (parallel, `"<"` → `t = 0`)
```js
tl.to(".progress-bar", { scaleX: 1, duration: 3, ease: "power3.out" }, "<");
```
The dark track (`.progress-bar`) grows `scaleX 0 → 1` from the left edge over the same 3s — a thin line drawing itself across the screen in lockstep with the count.

### 4 — Hero image unmask, part 1: point → small rectangle (`t = 4.5`)
```js
tl.to(".hero-bg", {
  clipPath: "polygon(35% 35%, 65% 35%, 65% 65%, 35% 65%)",
  duration: 1.5,
  ease: "hop",
}, 4.5);
```
The `.hero-bg` clip-path opens from the collapsed center point to a **small centered rectangle** (30%×30% of the viewport) — the image first appears as a small window in the middle.

### 5 — Image de-zoom, part 1 (parallel, `"<"` → `t = 4.5`)
```js
tl.to(".hero-bg img", { scale: 1.5, duration: 1.5, ease: "hop" }, "<");
```
Simultaneously the image scales from `2 → 1.5`.

### 6, 7, 8 — Full unmask + de-zoom finish + progress fill (all at `t = 6`)
```js
tl.to(".hero-bg", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  duration: 2, ease: "hop",
}, 6);
tl.to(".hero-bg img", { scale: 1, duration: 2, ease: "hop" }, 6);
tl.to(".progress",    { scaleX: 1, duration: 2, ease: "hop" }, 6);
```
- `.hero-bg` clip-path expands from the small rectangle out to the **full viewport** (`0%,0% … 100%,100%`) over 2s — the image blooms open to full-bleed.
- `.hero-bg img` finishes de-zooming `1.5 → 1` over the same 2s, so the image settles to its natural framing as it fills the frame.
- `.progress` (the white fill inside the track) sweeps `scaleX 0 → 1` from the left over the same 2s — a white line racing across the already-drawn dark track.

### 9 — Hero headline slides in char by char (`t = 7`)
```js
tl.to(".header h1 .char", {
  x: "0%",
  duration: 1,
  ease: "power4.out",
  stagger: 0.075,
}, 7);
```
Each headline character slides from `translateX(100%)` (parked right, hidden by its mask) into place, left to right, staggered `0.075s`, with a snappy `power4.out`.

### 10, 11 — Nav + footer words rise up (both at `t = 7.5`)
```js
tl.to("nav a .word",        { y: "0%", duration: 1, ease: "power4.out", stagger: 0.075 }, 7.5);
tl.to(".hero-footer p .word", { y: "0%", duration: 1, ease: "power4.out", stagger: 0.075 }, 7.5);
```
All nav-link words and all footer-label words slide up from `translateY(100%)` (below, hidden by their masks) into view, staggered `0.075s`, `power4.out`. Both start together at `t = 7.5`.

### Timeline summary (absolute seconds)
| t (s) | what |
|------|------|
| 0–3  | counter `0→100` (power3.out), counter scales `0.25→1`, progress track draws `scaleX 0→1` |
| ~3   | count done → onComplete splits digits |
| ~4–5 | digits wipe left (`x:-100%`, stagger 0.1) then `.preloader-counter` removed |
| 4.5–6 | hero clip-path point→small rect + image `2→1.5` (`hop`) |
| 6–8  | hero clip-path small-rect→full + image `1.5→1` + white progress fill `scaleX 0→1` (`hop`) |
| 7–8  | headline chars slide in from right (stagger 0.075, power4.out) |
| 7.5–8.5 | nav + footer words rise up (stagger 0.075, power4.out) |

Total runtime ≈ **8.5s**.

### Ease reference
- `hop` = `CustomEase.create("hop", "0.9, 0, 0.1, 1")` — steep symmetric in-out used for the entire hero clip-path unmask and image de-zoom.
- Counter, counter-scale, progress-track, and the digit wipe use `power3.out`.
- All SplitText slide-ins (headline chars, nav words, footer words) use `power4.out`.

## Assets / images
**One** hero background image (`hero.jpg`), used as the full-bleed backdrop (`object-fit: cover`, centered, initially `scale(2)`). It is the single subject of the clip-path reveal and the `2x → 1x` de-zoom.

The real asset is a **landscape (~3:2), dark Baroque oil painting** — a mythological scene of winged Mercury reclining above the slain giant Argus, a white cow watching from the shadows, under a moody blue sky. It is chosen for its **tonal structure, not its palette**: deep shadow across most of the frame with one lit figure, so the near-black `#0f0f0f` page and the bone type sit on it without a scrim, and the cover-crop lands on the lit area. Aspect ratio is flexible since it is cover-cropped; any low-key painterly or editorial full-bleed image works in its place.

## Behavior notes
- **Autoplay once** on load (`DOMContentLoaded`); no scroll, hover, or click triggers. The page does not scroll during the intro.
- The `.preloader-counter` element is permanently `.remove()`d from the DOM once its digits wipe out — do not rely on it existing afterward.
- Uses `100svh` (small viewport height) so mobile browser chrome doesn't clip the hero.
- Keep the `will-change` hints (`clip-path` on `.hero-bg`, `transform` on the image, counter, progress bars, and split pieces) — they matter for smooth clip-path and transform animation.
- **Responsive** (`@media max-width: 1000px`): `.nav-links` becomes a right-aligned vertical column (`flex-direction:column; align-items:flex-end; gap:0.5rem`); `.header` re-anchors to vertical center (`bottom:unset; top:50svh; transform:translateY(-50%)`, centered) and its `h1` drops to `font-size:4rem`. The animation itself is unchanged — only layout adapts.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/laserbysonymusic-landing-page-reveal-animation/hero.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--base-100`, `--base-200`, `--base-300`, `--accent`, `--accent-2`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two timelines racing over the same counter, two `.hero-bg` clip-paths unmasking out of phase. The visible symptom is jitter or a doubled reveal, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the preloader-to-hero reveal never plays — no error, no animation, nothing to debug. Delete the listener and put its body directly inside a `useEffect` with an empty dependency array: the counter tween, the clip-path unmask and the three `SplitText` reveals all start from there instead, on mount.

*(2) Element lookups* — `.preloader-counter`, `.preloader-counter h1`, `.header h1`, `nav a`, `.hero-footer p`, `.hero-bg`, `.hero-bg img`, `.progress-bar` and `.progress` all assume this component owns the document. Give the component a root `ref` on the outermost wrapper — the element that renders the preloader, the nav and `.hero` together — and scope every one of these lookups to it. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of this markup exist for an instant, and an unscoped `.hero-bg` lookup can bind the departing timeline's clip-path tween to the `.hero-bg` that is on its way out.

*(3) Cleanup* — Register the plugins and the custom ease once, at module scope, next to the imports: `gsap.registerPlugin(CustomEase, SplitText)` and `CustomEase.create("hop", …)` are idempotent, not per-mount setup, and doing them inside the effect just repeats work on every remount for nothing. Everything else — the three initial splits, the counter timeline, the clip-path unmask — goes inside a `gsap.context` scoped to the root ref:

```jsx
gsap.registerPlugin(CustomEase, SplitText);
CustomEase.create("hop", /* the same four control points named above */);

function Hero() {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context((self) => {
      const headerSplit = splitText(".header h1", "chars", "char");
      const navSplit = splitText("nav a", "words", "word");
      const footerSplit = splitText(".hero-footer p", "words", "word");
      const counterProgress = rootRef.current.querySelector(".preloader-counter h1");
      const counterContainer = rootRef.current.querySelector(".preloader-counter");
      const counter = { value: 0 };

      self.add("wipeDigits", () => {
        const counterSplit = splitText(counterProgress, "chars", "digit");
        gsap.to(counterSplit.chars, {
          x: "-100%",
          onComplete: () => counterContainer.remove(),
        });
      });

      const tl = gsap.timeline();
      tl.to(counter, {
        value: 100,
        onUpdate: () => { counterProgress.textContent = Math.floor(counter.value); },
        onComplete: () => self.wipeDigits(),
      });
      // … the rest of the timeline (counter scale, progress-bar draw, hero clip-path
      // unmask, image de-zoom, header/nav/footer word- and char-ins) exactly as above.
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return <div ref={rootRef}>…</div>;
}
```

This component needs the named-method form of `self.add`, not just the plugin-registration boilerplate. The counter tween's own `onComplete` — the one that splits `"100"` into digits and wipes them out — fires roughly three seconds into playback, long after the synchronous pass through the `gsap.context` factory has already returned. A `SplitText.create` and a `gsap.to` written directly inside that inline callback are created outside the window the context is watching, so `ctx.revert()` has no record of them: on an unmount that lands between the count finishing and the digit-wipe tween finishing, that second `SplitText` instance and its tween keep running against a `.preloader-counter` whose ancestors may already be gone. Registering the wipe as `self.add("wipeDigits", …)` and calling it as `self.wipeDigits()` from inside `onComplete` brings that later-created split and tween back under the same context, so the one `ctx.revert()` in the cleanup reverts them along with everything created up front.

`counterContainer.remove()` is the other trap specific to this component: it deletes a real DOM node that React still believes it renders. `.preloader-counter` is JSX like everything else here, and once this imperative call yanks it out from under React, any later re-render or unmount of the surrounding tree that tries to reconcile or remove that node throws on `removeChild`, because the node it expects to find is already gone. Do not call `.remove()` on a node React rendered. Either swap it for `gsap.set(counterContainer, { display: "none" })` inside the same `onComplete` and leave the element mounted-but-hidden, or lift a boolean into component state (`setShowPreloader(false)`) and flip it from that callback so React unmounts `.preloader-counter` declaratively on its next render instead of GSAP doing it directly.

`headerSplit`, `navSplit` and `footerSplit` need no separate handling: all three are created synchronously inside the factory, so the context picks them up and `ctx.revert()` un-splits `.header h1`, `nav a` and `.hero-footer p` back to their original markup. `counterSplit` only exists once `wipeDigits` has actually run — if the component unmounts before the count finishes, there is nothing there to revert, and the `self.add` registration above already accounts for the case where there is.
