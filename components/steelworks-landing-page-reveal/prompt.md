# Landing Page Reveal — Progress-Bar Preloader to Gliding-Image-Row Hero

## Goal
Build a full-screen editorial landing hero with a cinematic **preloader-to-hero reveal** that plays automatically once on page load (~7.5 seconds total). First a thin white **progress bar** draws itself left-to-right across the top of a solid dark overlay, then retracts to the right; the dark overlay then **wipes upward** via an animated clip-path. Underneath, **five small tilted image thumbnails** — pre-parked far off-screen to the left — **glide in with a custom ease to form a centered horizontal row**. The row then **splits apart**: the two left thumbnails fly off-screen left, the two right thumbnails fly off-screen right, while the **center thumbnail simultaneously scales up, un-rotates and un-rounds into a full-bleed hero background**. Finally, masked **SplitText** lines finish the sequence: the nav, the big headline paragraph and the footer contact links all **rise up line by line** from behind masks. One single GSAP timeline drives the entire sequence.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`SplitText`** and **`CustomEase`**. No smooth-scroll library — the page does not scroll during the intro; it is a pure load-triggered timeline. Register the plugins with `gsap.registerPlugin(CustomEase, SplitText)`. Run everything inside `document.addEventListener("DOMContentLoaded", …)` **wrapped in `document.fonts.ready.then(…)`** so the geometry math and SplitText run only after the web font has loaded.

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```html
<div class="preloader-overlay">
  <div class="preloader"></div>
</div>

<nav>
  <div class="nav-logo">
    <a href="#">Foundry &amp; Form<br />Industrial Design Consultancy</a>
  </div>
  <div class="nav-items">
    <a href="#">Work</a>
    <a href="#">Catalogue</a>
    <a href="#">About</a>
  </div>
</nav>

<section class="hero">
  <div class="intro-img"><img src="..." alt="" /></div>
  <div class="intro-img"><img src="..." alt="" /></div>
  <div class="intro-img hero-img"><img src="..." alt="" /></div>
  <div class="intro-img"><img src="..." alt="" /></div>
  <div class="intro-img"><img src="..." alt="" /></div>

  <div class="hero-content">
    <div class="hero-header">
      <h1>
        We design objects that carry the weight of their own conviction,
        where every curve and joint exists not for beauty but because the
        material demanded it.
      </h1>
    </div>
    <div class="hero-social">
      <p>Say Hello</p>
      <a href="#">info@foundryandform.com</a>
      <a href="#">View Enquiries</a>
    </div>
  </div>
</section>
```

Notes:
- Exactly **5** `.intro-img` wrappers, each holding one `<img>`. They are all absolutely stacked at full-viewport size (see CSS); JS scales/positions them into a row. The **3rd** one additionally has the class **`.hero-img`** — it is the one that becomes the full-bleed hero background.
- `.preloader` is a thin bar nested inside a full-screen `.preloader-overlay` panel.
- Use **"Foundry & Form — Industrial Design Consultancy"** as the neutral placeholder brand, `info@foundryandform.com` as the neutral contact. No real brand names.
- `.hero-content` (headline paragraph + contact block) sits above the images.

## Styling
Font (single web font): **DM Sans** (variable, ital + opsz + wght) via Google Fonts — `@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap");`. `body { font-family: "DM Sans", sans-serif }`.

Palette (only two colors):
- `#fff` — all text, the progress bar (white).
- `#0f0f0f` — the preloader-overlay panel (near-black).

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `h1 { color:#fff; font-size:3rem; font-weight:400; letter-spacing:-1%; line-height:1.1 }`.
- `a, p { color:#fff; text-decoration:none; font-weight:400; letter-spacing:-1%; display:block }`.
- `img { width:100%; height:100%; object-fit:cover }`.

Key elements and their **initial states** (the animation depends on these exactly):

- `nav`: `position:fixed; top:0; width:100%; padding:2rem; display:flex; justify-content:space-between; align-items:flex-start; z-index:2`. `.nav-items`: `display:flex; gap:4rem`.

- `.preloader-overlay`: `position:fixed; top:0; width:100%; height:100svh; background-color:#0f0f0f; z-index:10`. **Initial** `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rectangle — covers the whole viewport).
- `.preloader-overlay .preloader`: `position:absolute; top:0; width:100%; height:0.5rem; background-color:#fff; transform:scaleX(0); transform-origin:left; will-change:transform` (a thin white bar pinned to the very top, starting collapsed, growing from the left).

- `.hero`: `position:relative; width:100%; height:100svh; overflow:hidden`.
- `.intro-img`: `position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; border-radius:0.5rem; transform-origin:center center; will-change:transform` (each wrapper is the full viewport, all five stacked; JS scales them down to thumbnails and moves them via `x`).

- `.hero-content`: `position:absolute; top:0; left:0; width:100%; height:100svh; padding:15svh 2rem 15svh 2rem; display:flex; flex-direction:column; justify-content:space-between; z-index:2`.
- `.hero-header`: `width:60%`.

- `.line`: `position:relative; will-change:transform` (this class is produced by SplitText; see below).

## GSAP effect (be exact)

### Setup
```js
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import CustomEase from "gsap/CustomEase";
gsap.registerPlugin(CustomEase, SplitText);

CustomEase.create("hop",   "0.9, 0, 0.1, 1");   // steeper in-out — preloader retract + overlay wipe
CustomEase.create("glide", "0.8, 0, 0.2, 1");   // softer in-out — the whole image-row choreography
```

### Compute the image-row geometry (before the timeline)
Each `.intro-img` is full-viewport-sized and scaled to `0.2`, positioned by `x`-translation to form a horizontal centered row of 5 thumbnails with a fixed 40px gap. Because `transform-origin` is `center center`, a thumbnail's on-screen center sits at `innerWidth/2 + x`; the target `x` is therefore `desiredCenter − innerWidth/2`.

```js
const introImages = document.querySelectorAll(".intro-img");
const introImgScale = 0.2;
const introImgGap = 40;                                // px between thumbnails
const introImgRotations = [-15, 5, -7.5, 10, -2.5];    // per-index tilt in degrees

const introImgScaledWidth = window.innerWidth * introImgScale;
const introImgRowWidth     = introImgScaledWidth * 5 + introImgGap * 4;   // 5 thumbs + 4 gaps
const introImgCenteredX    = (window.innerWidth - introImgRowWidth) / 2;  // left edge of the centered row
const introImgOffScreenX   = introImgCenteredX - window.innerWidth * 1.3; // same row, shoved 1.3 vw to the left

introImages.forEach((img, i) => {
  const centeredX =
    introImgCenteredX + i * (introImgScaledWidth + introImgGap) + introImgScaledWidth / 2 - window.innerWidth / 2;
  const offScreenX =
    introImgOffScreenX + i * (introImgScaledWidth + introImgGap) + introImgScaledWidth / 2 - window.innerWidth / 2;

  gsap.set(img, {
    scale: introImgScale,          // 0.2
    x: offScreenX,                 // parked far off-screen left, in row order
    rotation: introImgRotations[i],
    borderRadius: "2.5rem",        // overrides the CSS 0.5rem while it's a thumbnail
  });

  img.dataset.centeredX = centeredX; // stash the row target for later
});
```

### Split the text into masked lines (before the timeline)
```js
SplitText.create("nav a, .hero-header h1, .hero-social p, .hero-social a", {
  type: "lines",
  linesClass: "line",   // each line element gets class "line"
  mask: "lines",        // wrap each line in an overflow-hidden mask
  autoSplit: true,      // re-split on font-load / resize
});
gsap.set(".line", { y: "125%" });  // park every line 125% below its mask (hidden)
```

### Timeline
Everything runs on **one** timeline with a 1s lead delay:
```js
const tl = gsap.timeline({ delay: 1 });
```
Position params below are `"<"` (align to the start of the previously-added tween), `"<N"` (N seconds after that start), or a **string label** (`"spread"` — created at the current timeline end the first time it's used, then reused).

**1 — Progress bar draws in** (default position → `t = 0`)
```js
tl.to(".preloader", {
  scaleX: 1,
  duration: 1.5,
  ease: "glide",
  onComplete: () => gsap.set(".preloader", { transformOrigin: "right" }),
});
```
The white bar grows `scaleX 0 → 1` from the left edge over 1.5s. Its `onComplete` flips `transform-origin` to `right` so the next tween collapses it toward the right.

**2 — Progress bar retracts** (default position → `t = 1.5`, sequential)
```js
tl.to(".preloader", { scaleX: 0, duration: 1.25, ease: "hop" });
```
The bar shrinks `scaleX 1 → 0` back toward the **right** edge over 1.25s.

**3 — Dark overlay wipes upward** (position `"<0.75"` → `t = 2.25`)
```js
tl.to(".preloader-overlay", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
  duration: 1,
  ease: "hop",
}, "<0.75");
```
Starting 0.75s after the retract began, the overlay's clip-path collapses its **bottom edge up to the top** (both bottom coords `100% → 0%`), so the near-black panel wipes up and off, uncovering the hero beneath.

**4 — Five thumbnails glide into a centered row** (loop, each at `"<0.025"`)
```js
introImages.forEach((img) => {
  tl.to(img, {
    x: parseFloat(img.dataset.centeredX),
    duration: 1.5,
    ease: "glide",
  }, "<0.025");
});
```
Each image tweens `x` from its off-screen-left position to its row slot over 1.5s (`glide`). The `"<0.025"` chains them: the first starts 0.025s after step 3's start (≈ `t = 2.275`), and each subsequent image starts 0.025s after the previous one (`2.300, 2.325, 2.350, 2.375`) — a tight cascade so the row assembles left-to-right.

**5 — Left pair flies off-screen left** (position label `"spread"` → created at `t ≈ 3.875`)
```js
tl.to(".intro-img:nth-child(1), .intro-img:nth-child(2)",
  { x: "-100vw", duration: 1.5, ease: "glide" }, "spread");
```
The 1st and 2nd thumbnails slide out to `x: -100vw`. The `"spread"` label does not yet exist, so GSAP creates it at the **current end of the timeline** (right after the glide-in loop finishes, ≈ `t = 3.875`) and places this tween there.

**6 — Right pair flies off-screen right** (position `"spread"` → `t ≈ 3.875`)
```js
tl.to(".intro-img:nth-child(4), .intro-img:nth-child(5)",
  { x: "100vw", duration: 1.5, ease: "glide" }, "spread");
```
The 4th and 5th thumbnails slide out to `x: 100vw`, starting together with step 5 (the `"spread"` label now exists).

**7 — Center thumbnail expands into the hero** (position `"<"` → same start as step 6, `t ≈ 3.875`)
```js
tl.to(".hero-img", {
  scale: 1,
  x: 0,
  rotation: 0,
  borderRadius: 0,
  duration: 1.5,
  ease: "glide",
}, "<");
```
Simultaneously with the pairs flying apart, the 3rd/center image (`.hero-img`) `scale 0.2 → 1`, `x → 0`, `rotation → 0`, `borderRadius 2.5rem → 0` — it blooms from a small tilted thumbnail into the full-bleed, upright, square-cornered hero background over 1.5s.

**8 — Nav lines rise in** (position `"<1"` → `t ≈ 4.875`)
```js
tl.to("nav .line", { y: "0%", duration: 1, stagger: 0.1, ease: "power3.out" }, "<1");
```
1s after the hero-expand began, every nav line (the 2-line logo + the 3 nav items) rises from `y:125%` to `0%` inside its mask, staggered `0.1s`, `power3.out`.

**9 — Headline lines rise in** (position `"<"` → same start as step 8, `t ≈ 4.875`)
```js
tl.to(".hero-header .line", { y: "0%", duration: 1, stagger: 0.1, ease: "power3.out" }, "<");
```
The big headline paragraph reveals line by line the same way, starting together with the nav.

**10 — Footer contact lines rise in** (position `"<0.25"` → `t ≈ 5.125`)
```js
tl.to(".hero-social .line", { y: "0%", duration: 1, stagger: 0.1, ease: "power3.out" }, "<0.25");
```
0.25s after the headline started, the "Say Hello" label, the email and the "View Enquiries" link rise up line by line, staggered `0.1s`, `power3.out`.

### Timeline summary (absolute seconds, after the 1s lead delay)
| t (s) | what |
|------|------|
| 0–1.5   | progress bar draws in `scaleX 0→1` from left (`glide`); on end → `transform-origin:right` |
| 1.5–2.75 | progress bar retracts `scaleX 1→0` toward right (`hop`) |
| 2.25–3.25 | dark overlay clip-path wipes upward off screen (`hop`) |
| 2.275–3.875 | 5 thumbnails glide `x: offscreen→row`, chained `+0.025` each (`glide`) |
| 3.875–5.375 | thumbs 1&2 → `x:-100vw`, thumbs 4&5 → `x:100vw` (`glide`) |
| 3.875–5.375 | center `.hero-img` `scale 0.2→1`, `x→0`, `rotation→0`, `radius→0` (`glide`) |
| 4.875–~6 | nav lines + headline lines rise `y:125%→0%`, stagger 0.1 (`power3.out`) |
| 5.125–~6.5 | footer contact lines rise `y:125%→0%`, stagger 0.1 (`power3.out`) |

Total runtime ≈ **7.5s** including the 1s lead delay.

### Ease reference
- `glide` = `CustomEase.create("glide", "0.8, 0, 0.2, 1")` — the softer in-out used for the progress-bar **draw-in** (step 1) and the entire image-row choreography (steps 4–7).
- `hop` = `CustomEase.create("hop", "0.9, 0, 0.1, 1")` — the steeper in-out used for the progress-bar **retract** (step 2) and the overlay **wipe** (step 3).
- All three SplitText line reveals (nav, headline, footer) use `power3.out`.

## Assets / images
**Five** moody editorial images, `object-fit: cover` (aspect ratio is flexible since each is cover-cropped — each wrapper is full-viewport, so as a `0.2` thumbnail it reads as a small viewport-aspect tile, and the center one ends full-bleed). The set here mixes four landscape frames with one portrait frame; only the count and order matter to the motion. What the current images actually show:
- **Image 1** — exits to the **left**. Landscape. A warm sepia-toned macro close-up of an eyebrow, brow bone and lash line; dominant colors are monochrome browns and beige skin tones.
- **Image 2** — exits to the **left**. Landscape. A centered waist-up portrait of a young man with dark curly hair in an olive-green suit and tie, shot against a soft painterly backdrop; dominant colors are olive green, warm peach/apricot and pale teal.
- **Image 3 (`.hero-img`)** — the star: it becomes the fullscreen hero background. Portrait orientation, cover-cropped to full-bleed. A high-contrast black-and-white side profile of a woman with a short dark bob in a black blazer against a pale off-white ground; dominant colors are grayscale black, white and light grey.
- **Image 4** — exits to the **right**. Landscape. A minimal product-style still of a matte silver twisted-torus (wavy metal ring) sculpture resting on a flat neutral grey surface; dominant colors are brushed silver and mid grey.
- **Image 5** — exits to the **right**. Landscape. A moody still-life of purple bearded iris blooms with yellow-and-white throats against a deep glossy red tiled backdrop; dominant colors are violet-purple, oxblood red and touches of green and yellow.

Each thumbnail is pre-tilted by index with rotations `[-15, 5, -7.5, 10, -2.5]` degrees. If you swap in your own images, keep the roles by position (two exit left, center is the hero, two exit right) — texture/portrait/still-life all work. If you have fewer than five, repeat to reach five. No brand logos.

## Behavior notes
- **Autoplay once** on load (`DOMContentLoaded` → `document.fonts.ready`); no scroll, hover or click triggers. The page does not scroll during the intro.
- The geometry (`window.innerWidth`) is measured once at load, so the row is centered for the initial viewport size; `autoSplit: true` keeps the SplitText lines valid across font-load/resize.
- Uses `100svh` (small viewport height) so mobile browser chrome doesn't clip the full-height overlay/hero.
- Keep the `will-change` hints (`transform` on `.preloader`, `.intro-img`, `.line`) — they matter for smooth transform and clip-path animation.
- **Responsive** (`@media max-width: 1000px`): `.nav-items` becomes a right-aligned vertical column (`flex-direction:column; align-items:flex-end; gap:0`); `.hero-content` padding drops to `15svh 2rem 2rem 2rem`; `.hero-header` widens to `width:100%`. The animation itself is unchanged — only layout adapts.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/steelworks-landing-page-reveal/img-1.jpg
https://motionprompts.dev/c/steelworks-landing-page-reveal/img-2.jpg
https://motionprompts.dev/c/steelworks-landing-page-reveal/img-3.jpg
https://motionprompts.dev/c/steelworks-landing-page-reveal/img-4.jpg
https://motionprompts.dev/c/steelworks-landing-page-reveal/img-5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--brass`, `--steel`, `--white`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that waits for the DOM, reaches into the page with plain selector strings, and never has to undo itself once the seven-and-a-half-second reveal finishes. React withdraws all three of those guarantees at once, and it does it quietly — the reveal plays, looks right, and the failure only surfaces on the second mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that means two `SplitText` passes over the same `nav a`, `.hero-header h1`, `.hero-social p` and `.hero-social a` nodes — the second pass wraps lines that are already wrapped in `.line` masks, one level deeper than the CSS expects — and two `tl` timelines racing to drive the same five `.intro-img` elements through the same off-screen-to-row-to-spread choreography, so the thumbnails jitter or `.hero-img` never settles at its full-bleed `scale: 1`. Worse, the whole sequence is gated behind `document.fonts.ready`, a promise that has every opportunity to resolve only after the first, throwaway mount has already been torn down — at which point its callback would still try to split and animate a page that, from React's perspective, no longer exists. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script's own bottom branch is `if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();`, guarding a `boot()` that only runs when this isn't loaded inside the catalogue's own tuning harness (the `window.MP.register({ defaults: DEFAULTS, mount })` branch). Neither survives the port: the harness branch has no equivalent in a shipped component, and the readiness guard is redundant once `useEffect` guarantees the DOM is already committed. Drop both, along with `boot` and the `DEFAULTS`/`config` indirection, and move the body of `mount()` into a `useEffect` with an empty dependency array — starting from the `document.fonts.ready.then(...)` call, not from inside it.

*(2) Element lookups* — The markup this component owns is three top-level siblings, not one: `.preloader-overlay`, `nav` and `section.hero` all sit directly under the document root with nothing wrapping them (see Layout/HTML above). Give the component a single root element — a Fragment won't do, since `gsap.context` needs a real DOM node to scope to — and render all three inside it, then put a `ref` on that wrapper and scope every lookup to it. That also covers the one query in this script that isn't a GSAP call: `document.querySelectorAll(".intro-img")`, used to compute `introImgCenteredX`/`introImgOffScreenX` and stash `dataset.centeredX` on each image before the timeline reads it back. That line sits outside any tween or trigger, so `gsap.context`'s selector-text scoping never reaches it on its own — call `gsap.utils.toArray(".intro-img")` in its place, from inside the context (below), so it resolves against this component's own five images rather than whichever copy of `.intro-img` a StrictMode remount happens to leave in the DOM first.

*(3) Cleanup* — The `destroyed` flag this component already carries (`let destroyed = false` at the top of `mount()`, checked as `if (destroyed) return` inside the `.then()`) is the exact cancellation idiom a React port needs — keep the idiom, just fold it into the effect:

```jsx
useEffect(() => {
  let cancelled = false;
  let split = null;
  let tl = null;
  let self;
  const ctx = gsap.context((ctxSelf) => { self = ctxSelf; }, rootRef);

  document.fonts.ready.then(() => {
    if (cancelled) return;
    self.add(() => {
      const introImages = gsap.utils.toArray(".intro-img");
      // the geometry math against introImages, unchanged, then:
      split = SplitText.create("nav a, .hero-header h1, .hero-social p, .hero-social a", {
        type: "lines",
        linesClass: "line",
        mask: "lines",
        autoSplit: true,
      });
      gsap.set(".line", { y: "125%" });
      tl = gsap.timeline({ delay: 1 });
      // the ten-step sequence exactly as built above, ending on
      // nav .line / .hero-header .line / .hero-social .line
    });
  });

  return () => {
    cancelled = true;
    tl?.kill();
    ctx.revert();
    split?.revert();
  };
}, []);
```

The effect itself stays synchronous — it starts the `document.fonts.ready` chain and returns immediately, and it is never itself declared `async` — so React always gets a real cleanup function back, never a dangling promise. The setup only actually runs once fonts have resolved *and* `cancelled` is still `false`, which is what keeps a StrictMode unmount landing mid-font-load from splitting and animating a header that has already been removed.

`self.add(...)` here is the one-argument form: it runs the callback immediately, inside the context, which is what makes the plain string selectors inside it — `".preloader"`, `"nav .line"`, `".hero-header .line"`, `".hero-social .line"`, the `SplitText.create` target list — resolve against the root ref instead of the whole document. Nothing in this timeline needs calling back in from an outside event: the reveal autoplays once and never responds to a click or a hover, so there's no reason to reach for the name-and-call-later overload instead.

`gsap.registerPlugin(CustomEase, SplitText)` and the two `CustomEase.create` calls that define `hop` and `glide` belong at module scope, exactly where the current script already puts them — they don't depend on any DOM node this component owns, and redefining the same two eases on every mount is harmless but pointless.

Order the cleanup the same way the existing `destroy()` already does, and for the same reason: kill `tl` and revert the context *before* reverting `split`. The context's revert restores every inline transform, `clipPath` and `borderRadius` GSAP wrote onto `.preloader`, `.preloader-overlay`, the five `.intro-img` elements and `.hero-img`, and stops the timeline from reaching for `.line` nodes mid-tween; only once that has settled is it safe to call `split.revert()` and collapse the masked `.line` spans back into the plain `nav a`, `h1`, `p` and `a` elements SplitText found. Revert it out of order — or skip it — and the next mount's `SplitText.create` finds spans already sitting inside spans, and masks lines that sit one level deeper than the CSS expects.
