# Landing Page Reveal — Preloader-to-Hero Intro

## Goal
Build a full-screen fashion/editorial landing hero with a cinematic **preloader-to-hero reveal** that plays automatically once on page load (~7 seconds). A dark overlay counts `0 → 100` while a small masked label steps through three words; five portrait images rise from below, collapse their gap and scale up; the four side images wipe away upward with a clip-path while the center image scales to fill the screen; finally the dark overlay wipes upward to reveal a giant hero name that slides in word by word. Everything is driven by three parallel GSAP timelines sharing one custom ease called `hop`.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`CustomEase`** and **`SplitText`**. No smooth-scroll library (the page does not scroll during the intro). Register the plugins with `gsap.registerPlugin(CustomEase, SplitText)`. Fire the whole sequence on `DOMContentLoaded`.

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```
<nav>
  <div class="nav-logo"><a href="#">Elara Vandenberg</a></div>
  <div class="nav-items">
    <a>Runway</a><a>Lookbook</a><a>Campaigns</a><a>Biography</a>
  </div>
</nav>

<section class="hero">
  <div class="hero-overlay">
    <div class="counter"><h1>0</h1></div>
    <div class="overlay-text-container">
      <div class="overlay-text">
        <p>Structure</p>
        <p>Designed Identity</p>
        <p>Welcome</p>
      </div>
    </div>
  </div>

  <div class="hero-images">
    <div class="img"><img src="..." alt="" /></div>
    <div class="img"><img src="..." alt="" /></div>
    <div class="img hero-img"><img src="..." alt="" /></div>  <!-- center, index 2 -->
    <div class="img"><img src="..." alt="" /></div>
    <div class="img"><img src="..." alt="" /></div>
  </div>

  <div class="hero-header"><h1>Elara Vandenberg</h1></div>
</section>
```

Notes:
- `.hero-images` holds exactly **5** `.img` wrappers; the **third one (index 2)** also gets class `hero-img` — it is the center image that survives and scales to fill.
- Use "Elara Vandenberg" as the neutral placeholder brand/name.

## Styling
Fonts: **Inter** (body), **Space Grotesk** (all big headings) and **Space Mono** (nav links + overlay label) — all free.

Palette (CSS vars) — cool paper, near-black ink, and one saturated red that owns **all** the colour on the page:
```css
:root {
  --paper: #f2f2f2;
  --ink: #16161a;
  --overlay: #ff4e45;   /* the panel that wipes away */
  --light: #f2f2f2;
  --accent: #ff4e45;
  --graphite: #2b2b31;
  --display: "Space Grotesk", sans-serif;
  --sans: "Inter", sans-serif;
  --mono: "Space Mono", ui-monospace, monospace;
}
```
**Every photograph runs as black and white** — `filter: grayscale(1) contrast(1.06)` — precisely so the red overlay is the only colour in the frame. That is the whole colour idea: one red panel over a monochrome page.

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`; `body { font-family: var(--sans); background-color: var(--paper); color: var(--ink); }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `a, p`: `text-decoration:none; text-transform:uppercase; font-family: var(--mono); font-size:0.9rem; line-height:1.25; color: var(--ink)`.

`nav`: `position:fixed; width:100%; padding:2rem; display:flex; justify-content:space-between; align-items:flex-start`. `.nav-items` is a `flex-direction:column; align-items:flex-end` stack.

`.hero`: `position:relative; width:100%; height:100svh; overflow:hidden`.

`.hero-overlay` (the dark preloader panel):
- `position:absolute; width:100%; height:100svh; background-color: var(--overlay); z-index:0` — the **red** panel, not a dark one.
- **Initial** `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rectangle covering everything). `will-change: clip-path`.
- `.counter` inside it: `position:absolute; right:2rem; bottom:2rem; color:var(--light)`. Its `h1`: `font-size:4rem; font-weight:500`.
- `.overlay-text-container`: `position:absolute; top:2rem; left:2rem; height:2rem; overflow:hidden` (a 2rem-tall clipping window — only one line shows at a time).
- `.overlay-text`: `display:flex; flex-direction:column; transform:translateY(2rem); will-change:transform` (starts pushed one line DOWN, so the window is initially empty).
- `.overlay-text p`: `color:var(--light); height:2rem; display:flex; align-items:center` (each line is exactly the window height).

`.hero-images`:
- `position:absolute; top:50%; transform:translateY(-50%); width:100%; padding:0 2rem; display:flex; justify-content:center; z-index:2`.
- `gap: 0.75vw` plus a custom property `--strip-gap-start: 10vw`. The gap is **laid out once and never animated**, and it is frozen at the **converged** value, not at the spread one; `--strip-gap-start` is the spread the strip starts from and is applied by the script as a transform. See the trap under "images converge with `x`, not with `gap`" for why both of those matter.
- `.hero-images .img`: `width:10vw; aspect-ratio:5/7`. **Initial** `transform:translateY(50%) scale(0.5); opacity:0; clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rect). `will-change:opacity, transform, clip-path`.

`.hero-header`:
- `position:absolute; bottom:2rem; width:100%; z-index:3` — **in front of the images**. On a desktop viewport the giant name and the zoomed centre image overlap, and the name must cross in FRONT of the photo; a header behind the image reads as a headline sliced in half by a rectangle.
- `h1`: `text-transform:uppercase; text-align:center; font-size:15vw; font-weight:500; line-height:0.85`, plus **`visibility:hidden`** — see the trap below.
- `.hero-header h1 .word` (the SplitText word wrappers): `transform:translateY(100%); will-change:transform` (each word starts hidden below its masked line).

Z-index stack (important for the reveal to read right): overlay `0` < images `2` < header `3` < nav `4`.

**Trap — the header's initial state.** Putting the header in front only works if the header has an initial state of its own. The `translateY(100%)` that hides the words lives on `.word`, and those wrappers do not exist until `SplitText` runs; between first paint and the module executing, the raw `<h1>` is just visible text — which used to be invisible for free, because a header at `z-index:-1` was covered by the full-screen red panel. In front of the panel it flashes. Hide `.hero-header h1` with `visibility:hidden` in CSS and clear it (`gsap.set(heroHeader, { visibility: "visible" })`) immediately after the split; `visibility:hidden` still lays out, so SplitText measures the words correctly.

That is a hard dependency on the script, taken knowingly: the whole hero is script-driven (the images are `opacity:0` in CSS too, and the red panel never wipes without GSAP), so a page where the module never runs has nothing to show either way. It gets one net — `@media (scripting: none) { .hero-header h1 { visibility: visible } }` — so a reader with scripting off keeps the name rather than a blank page. Write that query in the **positive** form: `not all and (scripting: enabled)` looks equivalent but evaluates to *true* in a browser that has never heard of the `scripting` feature, which would un-hide the headline for everyone and bring the flash straight back. The net does not cover "the script 404'd or threw", and nothing in CSS can.

**Trap — stacking contexts.** `z-index:3` on the header beats `z-index:2` on the images only because `.hero` is a plain positioned box: give `.hero` a `transform`, `filter`, `opacity < 1` or `will-change` on any of them and it opens a stacking context that the header can never climb out of. `.hero-images` *does* open one (it carries `transform:translateY(-50%)`), but it is a sibling of the header, so the two are compared directly and the higher value wins.

## GSAP effect (be exact)

### Setup
```js
CustomEase.create("hop", "0.85, 0, 0.15, 1");

const counterEl  = document.querySelector(".hero-overlay .counter h1");
const heroHeader = document.querySelector(".hero-header h1");
const overlayText= document.querySelector(".overlay-text");
const heroImages = document.querySelector(".hero-images");
const images     = gsap.utils.toArray(".hero-images .img"); // length 5
const heroOverlay= document.querySelector(".hero-overlay");
const counter    = { value: 0 };

// The centre image is read from the markup (class .hero-img), not hard-coded as index 2: it is the
// pivot both for "who survives the wipe" and for the converge maths below.
const heroIndex = Math.max(0, images.findIndex((el) => el.classList.contains("hero-img")));

// Spread/converge distances, measured once, before anything moves.
const rowStyle  = getComputedStyle(heroImages);
const layoutGap = parseFloat(rowStyle.columnGap) || 0;                     // px, the frozen CSS gap
const startGap  = vwToPx(rowStyle.getPropertyValue("--strip-gap-start"));  // px, the spread
const targetGap = (0.75 * window.innerWidth) / 100;                        // px, normally == layoutGap
const itemWidth = parseFloat(getComputedStyle(images[0]).width);           // used width, transform-free
// One xPercent per image for any gap: the offset from where CSS actually laid it out.
const shiftFor  = (gap) => (i) => ((i - heroIndex) * (gap - layoutGap) * 100) / itemWidth;

gsap.set(images, { xPercent: shiftFor(startGap) }); // spread, before anything animates

const split = new SplitText(heroHeader, {
  type: "words",
  mask: "words",        // each word gets an overflow-hidden mask wrapper
  wordsClass: "word",   // matches the CSS translateY(100%) init above
});

gsap.set(heroHeader, { visibility: "visible" }); // the words are masked now, so the h1 can show
```

**Trap — images converge with `x`, not with `gap`.** The obvious way to pull the filmstrip together is to tween `gap` on the flex row. Do not. Tweening `gap` re-runs flex layout on every frame, and on any viewport where the row overflows its container the items are *shrink-to-fit*, so their used width is a function of the gap: `(100vw − padding − 4·gap) / 5`. Closing the gap therefore grows every image on every frame; `aspect-ratio` turns that into a changing height; and `top:50% + translateY(-50%)` re-centres the whole row vertically every frame. The result is a sub-pixel shimmer/tremble that is invisible on desktop — where `5·10vw + 4·10vw + padding` still fits, so the declared widths are honoured and the gap tween is a pure slide — and obvious on phones and tablets, where `5·26vw + 4·4vw = 146vw` does not fit. It is a layout bug that only shows on small screens, so it survives desktop review.

The fix is arithmetic: in a centred flex row every item sits at `centre + (i − heroIndex) · (width + gap)`, so going from gap `G` to gap `G'` is exactly a translation of `(i − heroIndex) · (G' − G)` — the item width cancels out. Freeze the CSS `gap` (the shrink-to-fit width is then computed once and never moves) and animate `xPercent` on the images instead. Use `xPercent` rather than `x`: it is resolved against the item's own border-box width and GSAP emits it as a percentage, and since both terms of the ratio are `vw`-derived the offsets survive a viewport resize the way a `vw`-based gap did.

**And freeze it at the converged end, not the spread end.** This is the part that is easy to get backwards. Whichever gap you leave in the CSS is the one whose shrink-to-fit width becomes permanent, so it decides the size of the images for the whole reveal. Freeze the *spread* gap and the strip keeps its small intro width forever: the final full-bleed frame — the one composition anybody actually looks at, and the only one a screenshot catches — comes out ~14% narrower (~26% less area) and no longer fills the width. Freeze the *converged* gap (`gap: 0.75vw`) and the final frame is laid out by CSS at exactly its intended size, the images end on `xPercent: 0` (pure layout, so it tracks a resize by itself with nothing left over), and the whole difference is pushed back to the start of the reveal — where the images are at `scale(0.5)` behind `opacity: 0` and nobody is measuring them. Same algebra, opposite sign.

The one cost of freezing at the far end: the intro images are now as wide as the final layout makes them (~19vw on a phone instead of ~16vw), so the starting spread has to be *tighter* or the outer pair begins off-screen. That is why `--strip-gap-start` drops to `3.4vw` below 768px rather than the `4vw` you would expect: at the top of that range (768px) a 4vw spread pushes the outer images ~5px past the viewport edge. It is a ceiling, not a taste call — check it if you change the widths.

Create **three independent timelines** that run in parallel (each with its own `delay`):

### Timeline 1 — `counterTl` (delay `0.5`)
One tween on the plain object `counter`:
- `counter.value: 0 → 100`, `duration: 5`, `ease: "power2.out"`.
- `onUpdate`: write `Math.floor(counter.value)` into `counterEl.textContent` (so the bottom-right number ticks up from 0 to 100 over 5s, decelerating).

### Timeline 2 — `overlayTextTl` (delay `0.75`)
Four sequential tweens on `overlayText`, each `duration: 0.75, ease: "hop"`, stepping the flex column up one line per beat through the 2rem window (label text: Structure → Designed Identity → Welcome → empty):
1. `y: "0"` — reveals line 1 ("Structure").
2. `y: "-2rem"`, `delay: 0.75` — reveals line 2 ("Designed Identity").
3. `y: "-4rem"`, `delay: 0.75` — reveals line 3 ("Welcome").
4. `y: "-6rem"`, `delay: 1` — scrolls everything out (empty window again).

### Timeline 3 — `revealTl` (delay `0.5`) — the main reveal
Sequential unless a position param says otherwise. All tweens `ease: "hop"` unless noted.
1. **Images rise + fade in:** `images` → `{ y: 0, opacity: 1, stagger: 0.05, duration: 1 }`. (From `translateY(50%) scale(0.5) opacity:0` to `y:0 opacity:1`, still at scale 0.5, left-to-right stagger.)
2. **Filmstrip converges and scales up — ONE tween, both properties:** `images` → `{ xPercent: shiftFor(targetGap), scale: 1, duration: 1, delay: 0.5 }` (scale 0.5 → 1 while the visual gap goes from `--strip-gap-start` down to the knob's `0.75vw` — i.e. back to `xPercent: 0`, the position CSS already laid out, unless the knob has been moved off its default). Keep these in a single tween on a single target list: two concurrent tweens writing to the same element's transform is the other classic source of jitter here, and they always ran together anyway.
3. *(folded into step 2 — do not add a second tween for the scale.)*
4. **Side images wipe away upward:** `images.filter((_, i) => i !== heroIndex)` (the 4 non-center images) → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", duration: 1, stagger: 0.1 }`. The clip-path collapses each image's bottom edge up to the top edge, so they vanish upward one after another, leaving only the center image.
5. **Center image scales to fill:** `images[heroIndex]` → `{ scale: 2, duration: 1 }` (1 → 2, grows to dominate the frame). Its `xPercent` is `0` by construction, so it grows exactly where it already sits.
6. **Overlay wipes upward:** `heroOverlay` → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", duration: 1 }`. Same collapse-to-top-edge clip-path, so the whole red preloader panel wipes up and off, leaving the paper background, the zoomed centre image and — in front of it — the hero name.
7. **Hero name slides in word by word** (position param `"-=0.5"`, i.e. starts 0.5s before step 6 ends, overlapping the overlay wipe): `".hero-header h1 .word"` → `{ y: "0", duration: 0.75, stagger: 0.1, ease: "power3.out" }`. Each word slides up from `translateY(100%)` into its mask (`ease: "power3.out"`, NOT hop, for this one).

### Ease reference
- `hop` = `CustomEase.create("hop", "0.85, 0, 0.15, 1")` — a steep symmetric in-out used for nearly everything.
- `counterTl` uses `power2.out`; the final word slide uses `power3.out`.

## Assets / images
Five **portrait editorial fashion photos**, aspect-ratio roughly **5/7**, each a single subject against a flat studio or atmospheric backdrop. **All five are greyscaled by the CSS**, so their original colour stories are irrelevant — what matters is that each has one clear subject and enough tonal separation to survive at both 0.5× and full-bleed. In row order (positions 1–5 = img_1–img_5):
- **img_1**: a woman in a heavy coat over a draped gown, three-quarter turn.
- **img_2**: a man in a tailored suit facing camera against a painterly backdrop.
- **img_3** — the **center image (index 2, the third)** that scales up to fill the screen: a side profile of a woman with her hair in a low bun and a hoop earring. Being the hero frame, its off-centre profile still reads well full-bleed.
- **img_4**: a model in an open blazer with layered necklaces against a plain ground.
- **img_5**: a figure in a long lace dress on a grassy islet flanked by two black swans in a misty lake — the one landscape-led frame.

Use `object-fit: cover`. The four non-center frames are only seen briefly as a tight filmstrip before they wipe away upward, so their differing palettes and moods don't need to match. If you have fewer than five images, repeat one to fill the row.

## Behavior notes
- **Autoplay once** on load; no scroll, hover or click triggers. Total runtime ≈ 7s.
- **Responsive** (`max-width: 1000px`): `nav` padding → `1rem`; `.counter` → `right:1rem; bottom:1rem`; `.hero-images` → `padding:0 0.5rem; gap:2.5vw`; `.hero-images .img` → `width:20vw`, `--strip-gap-start:2.5vw`; and (`max-width: 768px`) `.hero-images` → `--strip-gap-start:3.4vw`, `.hero-images .img` → `width:26vw`, `hero-header` font → `17vw`. Only the *spread* changes per breakpoint — the laid-out `gap` stays `0.75vw` at every width, which is what keeps the final frame identical everywhere. Note that below 1000px `width:26vw` **overflows the row on purpose** (`5·26vw > 100vw`), so the items are shrink-to-fit and each ends up ~`19vw` wide; that is fine as a static layout and is exactly why the gap must never be animated — see the converge trap above. Also note that on phones the name sits well below the image and the two never overlap, so the header's `z-index` only matters on desktop.
- Uses `100svh` (small viewport height) so mobile browser chrome doesn't clip the hero.
- `will-change` hints are set on the overlay clip-path, the image transforms/clip-path, the overlay-text transform and the header words — keep them, they matter for the smoothness of the clip-path wipes. There is deliberately **no** hint on the row's `gap`, because the gap no longer animates. Drop the hints again on `revealTl`'s `onComplete` (`gsap.set([...], { willChange: "auto" })`): five promoted, filtered images plus a full-screen clip-path panel are worth their compositor layers for seven seconds and are pure memory for the rest of the session.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/aladesign-landing-page-reveal/img_1.jpg
https://motionprompts.dev/c/aladesign-landing-page-reveal/img_2.jpg
https://motionprompts.dev/c/aladesign-landing-page-reveal/img_3.jpg
https://motionprompts.dev/c/aladesign-landing-page-reveal/img_4.jpg
https://motionprompts.dev/c/aladesign-landing-page-reveal/img_5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--overlay`, `--light`, `--accent`, `--graphite`, plus the type variables `--display`, `--sans`, `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that leaves you two of nearly everything this reveal builds: two `counterTl` instances both racing to write into the same `counterEl.textContent`, two `revealTl` instances pulling the same five `.hero-images .img` elements through the same clip-path collapse at once, and — worse — a header that has been split by `SplitText` twice, so the second pass wraps words that are already wrapped in `.word` spans. The visible symptom is a counter that stutters or overshoots and a hero title whose words never slide into place, because `revealTl`'s final tween is targeting nodes one level removed from the ones the CSS actually masks. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only reaches that guard at all when it is not running inside this catalogue's own tuning harness (the `window.MP` branch). Neither survives the move to React: the harness branch is specific to this repository's authoring tool and has no equivalent in a shipped component, and the readiness guard is dead weight once `useEffect` guarantees the DOM is already committed. Drop both, along with the `boot` wrapper, and move the body of `mount()` — the `SplitText` call, the construction of `counterTl`, `overlayTextTl` and `revealTl`, and their tweens — directly into a `useEffect` with an empty dependency array. The `destroy()` this component already returns is not incidental — its shape (kill the three timelines, clear the inline styles GSAP wrote, revert the split) is close to what a correct cleanup function looks like; the work below is about tightening it, not replacing it.

*(2) Element lookups* — `counterEl`, `heroHeader`, `overlayText`, `heroImages`, `images` (via `gsap.utils.toArray`) and `heroOverlay` are six separate global lookups, each trusting that this markup is the only copy in the document. Put a ref on the outermost element this component owns — the `<section class="hero">` — and resolve all six from it (`rootRef.current.querySelector(".hero-images .img")` and so on) instead of from `document`. This is not cosmetic here: during the StrictMode remount two copies of the hero markup exist for an instant, and an unscoped `.hero-header h1` can bind to the copy that is being torn down, so the split runs on a node about to be detached.

*(3) Cleanup* — Wrap the `SplitText` call and all three timelines in one `gsap.context` scoped to that root ref, and revert the context on cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const split = new SplitText(rootRef.current.querySelector(".hero-header h1"), {
      type: "words",
      mask: "words",
      wordsClass: "word",
    });
    // counterTl, overlayTextTl and revealTl exactly as constructed above
    return () => split.revert();
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` now does what `destroy()` currently does by hand — kill `counterTl`, `overlayTextTl` and `revealTl`, and strip every inline style GSAP wrote onto the counter, the overlay text, the five images and the overlay panel — so the manual `gsap.killTweensOf` / `clearProps: "all"` pair in the existing `destroy()` becomes redundant once the context is in place. The one thing the context cannot infer on its own is the split, since reverting it is a DOM operation, not a tween; returning `split.revert()` from inside the context callback (as above) registers it as part of the same teardown, so it runs as part of `ctx.revert()` rather than needing its own separate call. Get the split un-reverted and the next mount's `new SplitText(...)` wraps `.word` spans that are already inside `.word` spans, which is exactly the doubled-nesting failure described above.

`gsap.registerPlugin(CustomEase, SplitText)` and `CustomEase.create("hop", …)` stay at module scope, outside the component. Re-registering the plugins or recreating the `hop` ease on every mount is harmless but pointless — the ease only needs to exist once for the whole page.

One gap the current `script.js` doesn't cover but is worth closing in the port: `SplitText`'s word masks are measured against whichever font is loaded at the moment the split runs, and this component splits a large, prominent headline. If the display face for `.hero-header h1` is still loading when the effect fires, the words get masked against the fallback font's line metrics, and the reveal can play against boundaries that don't match the font that then swaps in. Gate the split behind `document.fonts.ready` if that risk applies to your font-loading setup, keep the effect itself synchronous, and guard the deferred split with a cancellation flag so a StrictMode unmount that lands before fonts resolve doesn't run `new SplitText` against a header that has already been removed.
