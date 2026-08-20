# Landing Page Reveal — Stacked-Image Preloader to Editorial Hero

## Goal
Build a full-screen fashion-archive landing hero with a cinematic **preloader-to-hero reveal** that plays automatically once on page load (~6 seconds total). On a near-black full-screen panel, **six portrait images stacked dead-center** — each pre-tilted at a different random angle — scale up from nothing and un-clip open one after another, while a giant `ARCHIVE` title reveals character by character in random order and a small `000 → 100` counter ticks beside it. Everything then reverses: the counter and title characters slide up out of view, the six images collapse back to nothing in reverse order, and the whole dark panel wipes upward via an animated clip-path to uncover the pale hero underneath — where the huge `ARCHIVE` headline, the nav links and the three footer labels all rise up into place from behind masks. One single GSAP timeline drives the entire sequence.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`SplitText`** and **`CustomEase`**. No smooth-scroll library — the page does not scroll during the intro; it is a pure load-triggered timeline. Register the plugins with `gsap.registerPlugin(CustomEase, SplitText)` and run the timeline immediately as the module executes (module `import` guarantees the DOM elements exist).

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```html
<div class="preloader">
  <div class="preloader-images">
    <div class="preloader-img"><img src="..." alt="" /></div>
    <div class="preloader-img"><img src="..." alt="" /></div>
    <div class="preloader-img"><img src="..." alt="" /></div>
    <div class="preloader-img"><img src="..." alt="" /></div>
    <div class="preloader-img"><img src="..." alt="" /></div>
    <div class="preloader-img"><img src="..." alt="" /></div>
  </div>

  <div class="preloader-header">
    <h1>Archive</h1>
    <div class="preloader-counter">
      <p>000</p>
    </div>
  </div>
</div>

<nav>
  <div class="nav-logo"><a href="#">Archive</a></div>
  <div class="nav-links">
    <a href="#">Index</a>
    <a href="#">Collection</a>
    <a href="#">Material</a>
    <a href="#">Process</a>
    <a href="#">Info</a>
  </div>
</nav>

<section class="hero">
  <div class="header"><h1>Archive</h1></div>
  <div class="hero-footer">
    <p>Permanence</p>
    <p>Craftsmanship</p>
    <p>Expression</p>
  </div>
</section>
```

Notes:
- `.preloader-images` holds exactly **6** `.preloader-img` wrappers, each with one `<img>`. All six are absolutely stacked on the exact same center point.
- `.preloader-counter` is nested **inside** `.preloader-header`, positioned to sit just above the top-right corner of the big preloader title.
- Use **"Archive"** as the neutral placeholder brand/name — it appears three times: the preloader title, the nav logo, and the hero headline (all rendered uppercase via CSS).

## Styling
Font (single web font): **Hanken Grotesk** (Google Fonts) — import via `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap");`. Everything (`h1, a, p`) is `font-family: "Hanken Grotesk", sans-serif; font-weight: 500; line-height: 1; letter-spacing: -0.02em; text-decoration: none`.

Palette (CSS custom properties):
- `--base-100: #fff` — white (preloader text/title, counter, images layer text)
- `--base-200: #e0e2db` — pale warm sage/off-white (the hero background)
- `--base-300: #141414` — near-black (the preloader background, nav-link + hero text color)

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `img { width:100%; height:100%; object-fit:cover }`.

Key elements and their **initial states** (the animation depends on these exactly):

- `.preloader`: `position:fixed; inset:0; width:100%; height:100svh; background:var(--base-300); color:var(--base-100); overflow:hidden; z-index:2; will-change:clip-path`. **Initial** `clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%)` (full rectangle — covers the whole viewport).

- `.preloader-images`: `position:absolute; top:0; left:0; width:100%; height:100%`.

- `.preloader-img`: `position:absolute; top:50%; left:50%; transform: translate(-50%,-50%) scale(0); transform-origin:center center; width:250px; height:300px; will-change:transform, clip-path`. **Initial** `clip-path: polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)` (a centered inset rectangle = the middle 60%×60% of the element is visible). All six share the identical center position — they are a perfect stack. (Per-image rotation is applied by JS `gsap.set`, see below.)

- `.preloader-header`: `position:absolute; top:50%; left:50%; transform: translate(-50%,-50%)` (dead center). Its `h1`: `text-transform:uppercase; font-size: clamp(2rem, 10vw, 15rem); line-height:0.85`.

- `.preloader-counter`: `position:absolute; top:-1.5rem; left:calc(100% + 1.5rem); overflow:hidden` (sits just above and to the right of the title's top-right corner; the `overflow:hidden` masks the counter text). Its `p`: `color:var(--base-100); font-size: clamp(1rem, 1.5vw, 2rem); line-height:0.85`.

- `nav`: `position:fixed; width:100%; padding:2rem; display:flex; justify-content:space-between; align-items:flex-start; z-index:1`. `.nav-links`: `display:flex; gap:2rem`. `nav a`: `color:var(--base-300); line-height:1`.

- `.hero`: `position:relative; width:100%; height:100svh; background:var(--base-200); color:var(--base-300); overflow:hidden`.

- `.header`: `position:absolute; top:50%; left:50%; transform: translate(-50%,-50%); display:flex; justify-content:center; width:100%; height:max-content; overflow:hidden` (the `overflow:hidden` on this container is what masks the headline characters). Its `h1`: `text-transform:uppercase; font-size: clamp(2.5rem, 15vw, 25rem); line-height:0.85`.

- `.hero-footer`: `position:absolute; width:100%; bottom:0; padding:2rem; display:flex; justify-content:space-between; align-items:flex-end` (three labels spread across the bottom).

Split-piece init states (these classes are produced by SplitText below; the CSS pre-hides them by parking them one line below):
```css
.char,
.word,
.preloader-counter p {
  transform: translateY(100%);
  will-change: transform;
}
```
So every split character/word, **and** the counter `<p>`, start pushed down by 100% (hidden below their mask / clipping container) before the timeline runs.

## GSAP effect (be exact)

### Setup
```js
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/all";

gsap.registerPlugin(CustomEase, SplitText);

CustomEase.create("hop",  "0.8, 0, 0.2, 1");   // used for the image OPEN + all final hero reveals
CustomEase.create("hop2", "0.9, 0, 0.1, 1");   // slightly steeper — used for the preloader interior + exit

// Split helper: split into chars/words, tag each piece with a class,
// and (optionally) wrap each piece in an overflow-hidden mask.
const splitText = (selector, type, className, mask = true) =>
  SplitText.create(selector, {
    type: type,                       // "chars" | "words"
    [`${type}Class`]: className,      // charsClass / wordsClass = className
    ...(mask && { mask: type }),      // mask each char/word individually
  });

const preloaderHeaderSplit = splitText(".preloader-header h1", "chars", "char");        // masked chars
const navSplit             = splitText("nav a",               "words", "word");        // masked words
const headerSplit          = splitText(".header h1",          "chars", "char", false); // chars, NOT masked (the .header container clips instead)
const footerSplit          = splitText(".hero-footer p",      "words", "word");        // masked words
```
Note the fourth argument: the hero `.header h1` is split into chars **without** per-char masks — its clipping comes from the `overflow:hidden` on the `.header` container itself. The other three splits use per-piece masks.

### Pre-set the six image tilts
Before the timeline, stamp a fixed per-index rotation onto the stacked images (in degrees, in DOM order):
```js
const preloaderImgInitRotations = [7.5, -2.5, -10, 12.5, -5, 5];
gsap.set(".preloader-img", { rotate: (i) => preloaderImgInitRotations[i] });
```
Each of the six images is tilted a different amount, so as they scale up they read as a lightly fanned, scattered stack rather than a clean pile.

### Timeline
Everything runs on **one** timeline with a leading delay:
```js
const tl = gsap.timeline({ delay: 0.5 });
```
Position params below are **absolute times** (bare numbers, or numeric **strings** like `"0.35"` which GSAP also treats as absolute seconds) or `"<"` (align to the start of the previously-added tween). All times are measured from the timeline start (i.e. after the 0.5s delay).

**1 — Images scale up + un-clip open** (position: default → `t = 0`)
```js
tl.to(".preloader-img", {
  scale: 1,
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  duration: 1,
  ease: "hop",
  stagger: 0.2,
});
```
Each stacked image grows `scale 0 → 1` and its clip-path opens from the centered inset window (`20% 20% … 80% 80%`) out to the full element rectangle — so the images bloom open at their tilt, one every `0.2s`, front to back.

**2 — Preloader title characters slide in** (position: `"0.35"`)
```js
tl.to(".preloader-header h1 .char", {
  y: "0%",
  duration: 1,
  ease: "hop2",
  stagger: { each: 0.125, from: "random" },
}, "0.35");
```
Each `ARCHIVE` character rises from `translateY(100%)` to `0%` inside its mask, revealed in **random order** with `0.125s` between pieces.

**3 — Counter slides in AND counts up** (position: `"<"` → same start as step 2, `t = 0.35`)
```js
tl.to(".preloader-counter p", {
  y: "0%",
  duration: 1,
  ease: "hop2",
  onStart: () => {
    const counterEl = document.querySelector(".preloader-counter p");
    const counter = { value: 0 };
    gsap.to(counter, {
      value: 100,
      duration: 2,
      delay: 0.5,
      ease: "power2.inOut",
      onUpdate: () => {
        counterEl.textContent = String(Math.round(counter.value)).padStart(3, "0");
      },
    });
  },
}, "<");
```
The counter `<p>` rises into its `overflow:hidden` window (`y 100% → 0%`). Its `onStart` kicks off a **separate** tween on a plain `{ value: 0 }` object → `100`, `duration: 2`, `delay: 0.5`, `ease: "power2.inOut"`; each frame writes `Math.round(value)` zero-padded to 3 digits (`"000" → "100"`) into the text. So the number ticks `000 → 100` over 2s, starting ~0.5s after the counter appears.

**4 — Counter slides out up** (position: `t = 3.25`)
```js
tl.to(".preloader-counter p", { y: "-100%", duration: 0.75, ease: "hop2" }, 3.25);
```
Once counting is done, the counter `<p>` slides up and out of its window (`y 0% → -100%`).

**5 — Preloader title characters slide out up** (position: `t = 3.25`)
```js
tl.to(".preloader-header h1 .char", {
  y: "-100%",
  duration: 0.75,
  ease: "hop2",
  stagger: { each: 0.125, from: "random" },
}, 3.25);
```
Simultaneously each title char slides up and out of its mask (`y 0% → -100%`), again in **random order**, `0.125s` apart.

**6 — Images collapse back down (reverse order)** (position: `t = 3.5`)
```js
tl.to(".preloader-images .preloader-img", {
  scale: 0,
  clipPath: "polygon(20% 20%, 80% 20%, 80% 80%, 20% 80%)",
  duration: 1,
  ease: "hop2",
  stagger: -0.075,
}, 3.5);
```
The six images reverse their entrance: `scale 1 → 0` and clip-path re-closes to the inset window. The **negative stagger (`-0.075`)** means they animate in reverse DOM order (last image first).

**7 — Preloader panel wipes upward** (position: `t = 4.35`)
```js
tl.to(".preloader", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
  duration: 1,
  ease: "hop2",
}, 4.35);
```
The whole dark panel's clip-path collapses its **bottom edge up to the top edge** (the two bottom coords go `100% → 0%`), so the preloader wipes up and off, uncovering the pale hero underneath.

**8 — Hero headline characters rise in** (position: `t = 4.65`)
```js
tl.to(".header h1 .char", {
  y: "0%",
  duration: 1,
  ease: "hop",
  stagger: { each: 0.075, from: "random" },
}, 4.65);
```
The huge hero `ARCHIVE` reveals character by character from `translateY(100%)` to `0%` (clipped by the `.header` container's `overflow:hidden`), in **random order**, `0.075s` apart.

**9 — Nav words rise in** (position: `t = 4.75`)
```js
tl.to("nav a .word", { y: "0%", duration: 1, ease: "hop", stagger: 0.075 }, 4.75);
```
Each nav-link word slides up from behind its mask (`y 100% → 0%`), left-to-right, `0.075s` apart.

**10 — Footer words rise in** (position: `t = 4.75`, simultaneous with step 9)
```js
tl.to(".hero-footer p .word", { y: "0%", duration: 1, ease: "hop", stagger: 0.075 }, 4.75);
```
The three footer labels rise up the same way, starting together with the nav.

### Timeline summary (absolute seconds, after the 0.5s lead delay)
| t (s) | what |
|------|------|
| 0–1+ | 6 images `scale 0→1` + clip open, stagger `0.2` (`hop`) |
| 0.35 | title chars rise in, random stagger `0.125` (`hop2`) |
| 0.35 | counter `<p>` rises in; +0.5s later `000→100` over 2s (`power2.inOut`) |
| 3.25 | counter `<p>` slides up out (0.75s, `hop2`) |
| 3.25 | title chars slide up out, random stagger `0.125` (`hop2`) |
| 3.5  | 6 images `scale 1→0` + re-clip, **negative** stagger `-0.075` (`hop2`) |
| 4.35 | preloader panel clip-path wipes up off (1s, `hop2`) |
| 4.65 | hero headline chars rise in, random stagger `0.075` (`hop`) |
| 4.75 | nav words + footer words rise in, stagger `0.075` (`hop`) |

Total runtime ≈ **6.25s** including the lead delay.

### Ease reference
- `hop` = `CustomEase.create("hop", "0.8, 0, 0.2, 1")` — steep symmetric in-out; used for the image OPEN (step 1) and all three final hero reveals (steps 8–10).
- `hop2` = `CustomEase.create("hop2", "0.9, 0, 0.1, 1")` — even steeper; used for the entire preloader interior + exit (steps 2, 3, 4, 5, 6, 7).
- The counter number tween uses `power2.inOut`.

## Assets / images
**Six** editorial "archive" images, all portrait / vertical aspect (each frame is displayed at `250×300px`, i.e. ~**5:6**), `object-fit: cover`. They read as an eclectic, cross-genre mood-board set — no shared subject, unified only by a moody, elevated-fashion tone. In DOM order (the order also drives the per-image tilt):

1. **Soft over-exposed studio portrait** — a young, fair-haired person shot head-on, heavily blown-out and hazy. Dominant colors: pale cream and washed pink, almost white.
2. **Cosmic nebula graphic** — a deep-space scene of swirling clouds, scattered stars and a few small planets. Dominant colors: warm amber/orange against dark teal-blue and near-black.
3. **Abstract minimal sculpture** — a smooth, soft-focus rounded form / bulge on a plain seamless surface. Dominant colors: near-monochrome light greys and off-white.
4. **Still-life with flowers** — a bunch of purple irises in a clear glass vase on a dark green marble tabletop against a warm wall. Dominant colors: violet-purple blooms, green stems/marble, terracotta-red backdrop.
5. **Black-and-white beauty portrait** — a woman in strict side profile with a sleek dark bob, pearl drop earrings and a black blazer, on a pale seamless backdrop. Dominant colors: grayscale — black hair/jacket, light grey ground.
6. **Macro botanical close-up** — young sprouting seedlings / thin stems with small leaves, backlit. Dominant colors: pale golden-green shoots against a deep navy-purple background.

Any cohesive set of six moody editorial images works — only the count and order matter to the motion: each image gets a fixed tilt by index (`[7.5, -2.5, -10, 12.5, -5, 5]` degrees). If you have fewer than six, repeat to reach six.

## Behavior notes
- **Autoplay once** on load; no scroll, hover or click triggers. The page does not scroll during the intro.
- Uses `100svh` (small viewport height) so mobile browser chrome doesn't clip the full-height preloader/hero.
- Keep the `will-change` hints (`clip-path` on `.preloader`; `transform, clip-path` on `.preloader-img`; `transform` on the split pieces + counter) — they matter for smooth clip-path and transform animation.
- **Responsive** (`@media max-width: 1000px`): the counter re-anchors slightly (`left: calc(100% + 0.5rem)`), and `.nav-links` becomes a right-aligned vertical column (`flex-direction:column; gap:0; text-align:right`). The animation itself is unchanged — only layout adapts. All big type uses `clamp()` so it scales down fluidly on its own.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/outfit-landing-page-reveal/img1.jpg
https://motionprompts.dev/c/outfit-landing-page-reveal/img2.jpg
https://motionprompts.dev/c/outfit-landing-page-reveal/img3.jpg
https://motionprompts.dev/c/outfit-landing-page-reveal/img4.jpg
https://motionprompts.dev/c/outfit-landing-page-reveal/img5.jpg
https://motionprompts.dev/c/outfit-landing-page-reveal/img6.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--base-100`, `--base-200`, `--base-300`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that leaves you two of nearly everything this preloader builds: two `tl` timelines both racing to scale and un-clip the same six `.preloader-img` elements from the same stacked start state, two counters both writing into the same `.preloader-counter p` text node, and — worse — a `.preloader-header h1`, a `nav a`, a `.header h1` and a `.hero-footer p` that have each already been split into `.char`/`.word` spans by `SplitText`, so a second, un-reverted pass wraps spans that are already wrapped — one level deeper than the tweens above expect. The visible symptom is a preloader that glitches or double-plays, characters and words settling into place twice, and a counter that jumps backward or overshoots `100` — none of which reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The bottom of the script is a module-scope `if`/`else`: when `window.MP` (this catalogue's own tuning harness) is absent, it calls `mount(Object.assign({}, DEFAULTS))` immediately, at import time. Neither branch survives the move to React — the harness branch has no equivalent in a shipped component, and calling `mount()` at module scope means it runs before your component has rendered the `.preloader`, `nav` and `.hero` markup it reaches for. Drop the `window.MP` check and the top-level call, and move the body of `mount()` — the four splits, the `gsap.set` on the image tilts, and the construction of `tl` — into a `useEffect` with an empty dependency array. Do not leave it in the component body; a component re-renders far more often than this module used to re-evaluate. The `config` argument (`imgStagger`, `charStagger`, `headerStagger`, `imgTilt`, `counterDuration`) is that same harness's tuning API — a plain port just inlines the values from `DEFAULTS`, or turns them into props if you want them adjustable.

*(2) Element lookups* — The static markup has no wrapper around `.preloader`, `nav` and `.hero`: they are three top-level siblings on the demo page, not children of one container. `gsap.context` needs a single DOM node to scope to, so give the component a root element that actually contains all three (`<div ref={rootRef}>` around `.preloader`, `nav`, `.hero`) — unless `nav` is really shared chrome owned by a layout one level up, in which case leave it there and accept that this component's own cleanup can only reach the pieces inside its own ref. Nearly every selector the effect touches — `.preloader-img`, `.preloader-header h1 .char`, `nav a .word`, `.header h1 .char`, `.hero-footer p .word`, `.preloader` — is passed as string text into `SplitText.create`, `gsap.set` or `tl.to`, and `gsap.context` scopes that selector text automatically to whatever element you give it as scope, so none of those need to become `rootRef.current.querySelector(...)` by hand. The one exception is the raw `document.querySelector(".preloader-counter p")` inside the counter's `onStart` — that's a plain DOM call, not a GSAP target, so the context's scoping does not touch it. Left as `document.querySelector`, it binds to whichever `.preloader-counter p` exists anywhere on the page at the instant `onStart` fires, which during a StrictMode remount is not guaranteed to be this instance's own node. Resolve it from the ref instead: `rootRef.current.querySelector(".preloader-counter p")`.

*(3) Cleanup* — Wrap the four splits and the whole timeline in one `gsap.context` scoped to the root, and revert both the context and the splits on cleanup:

```jsx
useEffect(() => {
  const splits = [
    splitText(".preloader-header h1", "chars", "char"),
    splitText("nav a", "words", "word"),
    splitText(".header h1", "chars", "char", false),
    splitText(".hero-footer p", "words", "word"),
  ];

  const ctx = gsap.context((self) => {
    gsap.set(".preloader-img", { rotate: (i) => preloaderImgInitRotations[i] });
    const tl = gsap.timeline({ delay: 0.5 });
    // … steps 1 through 10, exactly as documented above …
    tl.to(".preloader-counter p", {
      y: "0%",
      // ease and timing exactly as documented above
      onStart: () => {
        self.add(() => {
          const counterEl = rootRef.current.querySelector(".preloader-counter p");
          const counter = { value: 0 };
          gsap.to(counter, {
            value: 100,
            // ease and timing exactly as documented above
            onUpdate: () => {
              counterEl.textContent = String(Math.round(counter.value)).padStart(3, "0");
            },
          });
        });
      },
    }, "<");
  }, rootRef);

  return () => {
    ctx.revert();
    splits.forEach((sp) => sp.revert());
  };
}, []);
```

The counter's `onStart` fires when `tl` reaches that step during playback — well after the synchronous pass through the `gsap.context` factory has already returned — so the plain `gsap.to(counter, {...})` created inside it is invisible to the context, and `ctx.revert()` alone will not kill it. Wrapping that call in `self.add(() => { … })` re-opens the context just long enough to record it, so a cleanup that fires mid-count — the real test here, per the note above, is navigating away and back before the roughly six-second sequence finishes — kills the counter's own tween along with everything else, instead of leaving it to keep writing into a `textContent` on a node the rest of the cleanup has already reverted. Revert the context before reverting the splits, in that order: the tweens target the `.char`/`.word` spans, so killing them first keeps the teardown from fighting a split that has already collapsed those spans back into plain text. `gsap.registerPlugin(CustomEase, SplitText)` and the two `CustomEase.create` calls stay at module scope, outside the component — re-registering the plugins or recreating an already-registered ease on every mount is harmless but pointless.

One gap the current script doesn't cover and is worth closing in the port: all four splits measure character and word boxes against whatever face is loaded for the single web font at the moment the effect runs. If that font is still swapping in, the masks on `.preloader-header h1`, `nav a`, `.header h1` and `.hero-footer p` get sized against the fallback metrics, and the reveal can play against boundaries that stop matching once the real font swaps in a frame later. Gate the four `splitText(...)` calls behind `document.fonts.ready` if that risk applies to your font-loading setup, keep the effect itself synchronous, and guard the deferred split with a cancellation flag so a StrictMode unmount landing before fonts resolve doesn't call `SplitText.create` against a header that is already gone.
