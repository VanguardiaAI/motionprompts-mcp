# GTA-VI-style Scroll Logo Reveal — Pinned Hero with Shrinking SVG Mask

## Goal

Build a cinematic, full-page landing hero in the style of the GTA VI trailer site: as you scroll, a giant dark overlay punched with a logo-shaped SVG mask hole shrinks exponentially (scale 500 → 1), so the dark screen "closes in" until only a logo-shaped window into the scene remains; meanwhile the layered hero artwork zooms out, a white overlay blooms behind the mask, and a big headline is unveiled with a bottom-up gradient wipe. Everything is driven by a single pinned, scrubbed ScrollTrigger smoothed by Lenis.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` for smooth scrolling. No other libraries.

## Layout / HTML

```
body
├── header.site-header                 ← fixed, two spans: "Casa Vicente" / "Autumn Winter 2026 · Lisbon"
├── section.hero
│   ├── div.hero-img-container
│   │   ├── picture               ← image 1: full-bleed campaign photograph (JPG)
│   │   │   ├── source            ← same shot, portrait crop, media="(max-width: 768px)"
│   │   │   └── img
│   │   ├── div.hero-img-logo
│   │   │   └── svg > path        ← the wordmark, inlined and filled with currentColor
│   │   │                            (ivory). A transparent PNG in an <img> works the same.
│   │   ├── img                   ← OPTIONAL foreground subjects cut out (transparent PNG),
│   │   │                            stacked AFTER the logo so they sit in front of it.
│   │   │                            The demo omits this layer (see Assets / images)
│   │   └── div.hero-img-copy
│   │       └── p  "Scroll to enter"
│   ├── div.fade-overlay
│   ├── div.overlay
│   │   └── svg (width="100%" height="100%")
│   │       ├── defs > mask#logoRevealMask
│   │       │   ├── rect width=100% height=100% fill="white"
│   │       │   └── path#logoMask            ← no fill attribute (defaults to black = hole)
│   │       └── rect width=100% height=100% fill="#141414" mask="url(#logoRevealMask)"
│   ├── div.logo-container             ← empty; geometric reference box for fitting the mask
│   └── div.overlay-copy
│       └── h1  "Autumn winter <br> twenty twenty‑six"
└── section.outro
    └── div.outro-inner
        ├── span.outro-kicker  "The atelier"
        ├── h2                 "Made to measure, <em>made to last.</em>"
        ├── p.outro-lede       one paragraph of atelier copy
        └── div.outro-details  two short address/hours lines
```

The mask trick: inside `<mask>`, the white rect keeps the dark `#141414` rect visible everywhere, and the black logo `path` punches a transparent hole through it. Scaling the whole `.overlay` element scales the hole.

### Logo mask path data

Keep a `logo.js` module exporting `export const logoData = "M…Z"` — a single SVG path string drawing a chunky, bold two-letter wordmark (e.g. the Roman numerals "VI") as closed polygon subpaths (straight `M/L/Z` commands are fine, one subpath per letter stroke). The exact coordinate system does not matter: a fitting function normalizes the path via `getBBox()` at runtime. Make the letterforms thick and poster-like so the final hole reads clearly.

## Styling

Palette — near-black ground, ivory type, one ember orange. Two of these values are **locked**: the JS gradient and the overlay `rect` paint `#141414` and `#f04e23` literally, so changing the variables alone will not change them.
```css
:root {
  --bg: #141414;
  --bg-lifted: #1a1a1e;   /* the outro section */
  --ivory: #efece3;       /* all type */
  --ember: #f04e23;       /* kicker, hero caption, the gradient wipe */
  --ember-deep: #7a1f00;  /* the bottom of every ember gradient */
  --gray: #8c8c88;
}
```

- Fonts: **Space Grotesk** for `h1`/`h2`, **Inter** for body copy, **Space Mono** for the header, the hero caption and the kicker (uppercase, `letter-spacing: .08em`). Global reset (`* { margin:0; padding:0; box-sizing:border-box }`).
- `body`: `background: var(--bg)`, `color: var(--ivory)`, `font-family:"Inter"`, `overflow-x: hidden`.
- All `img`: `width:100%; height:100%; object-fit:cover`.
- `h1`: uppercase, `font-family:"Space Grotesk"`, weight 700, `font-size: clamp(3.2rem, 7.8vw, 6.4rem)`, `letter-spacing: -0.03em`, `line-height: 0.95`.
- Every `section`: `position: relative; width: 100vw; height: 100vh; background-color: var(--bg); text-align: center; overflow: hidden`.
- `.site-header`: `position: fixed; top: 0`, a row of two Space Mono spans; the right-hand one sits on a `rgba(20,20,20,.6)` chip so it survives the bright part of the photo.
- `.hero-img-container`, its direct `img`s, and `.fade-overlay`: `position: absolute; top:0; left:0; width:100%; height:100%` (full-bleed stack).
- **The photo is graded in CSS, not in the file** — this is what makes an ordinary campaign shot belong to the palette: `.hero-img-container img { filter: grayscale(1) contrast(1.2) brightness(0.85); }` and, over it, `.hero-img-container picture::after` lays `linear-gradient(180deg, #f04e23 0%, #d8431c 55%, #7a1f00 130%)` with `mix-blend-mode: multiply`. Shadows fall to near-`#141414`, highlights cap at the ember ramp. Neither layer touches the mask.
- `.hero-img-logo`: `position: absolute; top: 25%; left: 50%; transform: translate(-50%, 0); width: 170px; color: var(--ivory)`; its inline `svg` is `display:block; width:100%; height:auto` with `filter: drop-shadow(0 1px 14px rgba(20,20,20,.45))` and `fill="currentColor"`.
- `.hero-img-copy`: `position: absolute; bottom: 20%; left: 50%; transform: translate(-50%, 0); will-change: opacity`; its `p` is Space Mono `11px`, `color: var(--ember)`, with a double `text-shadow` so it reads over the photo.
- `.fade-overlay`: `background-color: var(--ivory); will-change: opacity;` start it at `opacity: 0` (scroll drives it). Note it blooms **ivory**, not white — a pure white flash would fall outside the palette.
- `.overlay`: `position: fixed; top: 0; left: 0; width: 100vw; height: 150vh; z-index: 1; transform-origin: center center`. (If you declare it differently in CSS, force these inline from JS on load: `width 100vw / height 100vh / position fixed / top 0 / left 0 / transform none`.)
- `.logo-container`: `position: fixed; top: 25%; left: 50%; transform: translate(-50%, -50%); transform-origin: center center; width: 400px; height: 400px; z-index: 2`. It stays empty — it only defines where/how big the mask hole ends up.
- `.overlay-copy`: `position: absolute; bottom: 22%; left: 50%; transform: translate(-50%, 0); z-index: 2; width: 100%; padding: 0 2rem`.
- `.overlay-copy h1`: `background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: transparent; transform-origin: center 0%` (the JS paints a gradient into its `background`).
- `.outro`: `background-color: var(--bg-lifted)`, flex, centered both axes. Inside, `.outro-kicker` is Space Mono in `--ember`; `h2` is Space Grotesk, and its `<em>` is painted with `linear-gradient(180deg, var(--ember) 20%, var(--ember-deep) 130%)` through `background-clip: text` so only those two words carry the ember; `.outro-lede` is Inter at `rgba(239,236,227,.8)`.
- `@media (max-width: 900px)`: `h1 { font-size: 2rem; letter-spacing: 0 }`, `p { font-size: 1rem }`, `.overlay-copy { width: 100% }`.

## GSAP effect (the core — follow exactly)

Everything runs after `DOMContentLoaded`. `gsap.registerPlugin(ScrollTrigger)`.

### Lenis setup

```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### Mask fitting (run on load and on resize)

Set the `d` attribute of `path#logoMask` to `logoData`. Then `updateLogoMask()`:

1. `logoDimensions = logoContainer.getBoundingClientRect()`; `logoBoundingBox = logoMask.getBBox()`.
2. `scaleFactor = Math.min(logoDimensions.width / bbox.width, logoDimensions.height / bbox.height)` (contain-fit).
3. Translation centers the scaled path inside the container box, compensating for the bbox origin:
   - `x = logoDimensions.left + (logoDimensions.width − bbox.width × scaleFactor) / 2 − bbox.x × scaleFactor`
   - `y = logoDimensions.top + (logoDimensions.height − bbox.height × scaleFactor) / 2 − bbox.y × scaleFactor`
4. `logoMask.setAttribute("transform", `translate(${x}, ${y}) scale(${scaleFactor})`)`.

### Initial state

```js
const initialOverlayScale = 500;
gsap.set(svgOverlay, {
  transformOrigin: "50% 50%",
  xPercent: 0, yPercent: 0, left: 0, top: 0,
  scale: initialOverlayScale,
});
```

At scale 500 the mask hole is astronomically larger than the viewport, so the dark rect is effectively invisible on load and the hero artwork shows through.

### The single ScrollTrigger

Created by a `setupScrollTrigger()` function that kills any previous instance first (stored in a variable), then:

```js
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${window.innerHeight * 5}px`,   // 5× viewport of scroll distance
  pin: true,
  pinSpacing: true,
  scrub: 1,
  onUpdate: (self) => { /* all animation below, driven by self.progress */ },
});
```

There are **no tweens/timelines** — every value is computed from `progress` (0→1) inside `onUpdate` and applied with `gsap.set`. The phases:

**Phase A — intro fade (progress 0 → 0.15).**
`heroImgLogo` (the `.hero-img-logo` div) and `.hero-img-copy` fade out linearly: `opacity = 1 − progress × (1 / 0.15)`. For `progress > 0.15`, hard-set both to `opacity: 0`.

**Phase B — zoom-out + mask shrink (progress 0 → 0.85).**
Only while `progress <= 0.85`, with `n = progress / 0.85` (normalized 0→1):

- `.hero-img-container` scale: `1.5 − 0.5 × n` — i.e. linear **1.5 → 1.0** (the artwork starts zoomed in and settles).
- `.overlay` scale: **exponential decay** `overlayScale = 500 × (1/500)^n` — 500 → 1 (equal ratio per unit progress, so the shrink feels constant on a log scale rather than slamming shut). Apply with `gsap.set(svgOverlay, { transformOrigin: "50% 25%", scale: overlayScale, force3D: true })` — note the transform origin **switches to `50% 25%`** here so the hole converges on the logo-container position (top 25% of the viewport).
- `.fade-overlay` opacity: `0` until `progress ≥ 0.25`, then `min(1, (progress − 0.25) / 0.4)` — linear **0 → 1 between progress 0.25 and 0.65**. The scene whites out behind the shrinking hole, so the end state reads as a white logo mark on a dark screen.

**Phase C — headline gradient wipe (progress 0.7 → 0.85).**
With `r = (progress − 0.7) / 0.15` (0→1):

- Paint the `h1` background each frame:
  `gradientSpread = 100`; `gradientBottomPosition = 240 − r × 280` (240% → −40%); `gradientTopPosition = gradientBottomPosition − gradientSpread`.
  `h1.style.background = \`linear-gradient(to bottom, #141414 0%, #141414 ${top}%, #f04e23 ${bottom}%, #7a1f00 220%)\`` and `h1.style.backgroundClip = "text"`.
  Because the text is fill-transparent with `background-clip: text`, this sweeps an ember (`#f04e23`, sinking to `#7a1f00`) fill up through dark (`#141414`) letters, bottom to top.
- `gsap.set(h1, { scale: 1.25 − 0.25 × r, opacity: r })` — scales **1.25 → 1** (transform-origin `center 0%`) while fading **0 → 1**.
- For `progress < 0.7`, keep `h1` at `opacity: 0`.

After progress 0.85 everything holds its final state while the pin plays out, then the page releases into the `.outro` section.

### Resize handling

On `window.resize`: call `updateLogoMask()`, `ScrollTrigger.refresh()`, and `setupScrollTrigger()` again (kill + recreate so the `end` distance tracks the new viewport height).

## Assets / images

The layered version of this hero uses three images (roles described, no brands):

1. **Background scene** — full-bleed campaign photograph (~16:9, JPG): the demo ships a fashion frame, a model in an olive wool suit standing before a hand-painted mural. Bottom layer. Its own colours barely matter: the CSS greyscales it and multiplies the ember gradient over it, so **any** photograph with clear tonal structure lands in the same palette. Pick it for composition and contrast, not for hue.
2. **Foreground cut-out** — the same subjects isolated on a transparent background (PNG), pixel-aligned with image 1 so that stacking them recreates the scene with the subjects on a separate layer (they overlap the intro logo).
3. **Wordmark logo** — an ivory logo/wordmark on a transparent background (PNG), shown centered at the top quarter of the hero before it fades out. The demo inlines it as SVG instead (see below).

**What the demo actually ships, and how to build it without the other two.** Only image 1 is a
published asset, in two crops — that is deliberate, and none of the motion depends on the other two:

- **Image 1** is `hero-campaign.jpg` (desktop) plus `hero-campaign-mobile.jpg`, a portrait crop of
  the same artwork wired as a `<source media="(max-width: 768px)">` inside the `<picture>`. Both
  URLs are in the **Images** section below. Two crops of one layer, not two layers.
- **Image 2 (foreground cut-out) is not shipped.** The demo omits that layer entirely: the
  `<picture>` is the only thing inside `.hero-img-container`. Nothing in the scroll timeline reads
  it, so leaving it out costs you no motion — the subjects simply do not pass in front of the intro
  logo. Add it only if you have a cut-out that is pixel-aligned with your background; a misaligned
  one is worse than none.
- **Image 3 (wordmark) is not a PNG here.** `.hero-img-logo` holds an **inline `<svg>`** whose
  single `<path fill="currentColor">` draws the wordmark, so it stays crisp at any size and needs no
  file. Use a PNG instead if you prefer — the fade in the timeline targets the `.hero-img-logo`
  element, not its contents, so either works unchanged. This is a **different** path from
  `logoData`: that one is the mask hole in `#logoMask`, this one is the visible intro wordmark.

## Behavior notes

- Page-level effect: it owns the scroll (Lenis) and pins the hero for 5 viewport heights; total page = pinned hero + one normal outro screen.
- No autoplay animation — everything is scrubbed; scrolling back up reverses every phase perfectly.
- The mask fit is fully responsive: any logo path works at any viewport because `updateLogoMask()` re-measures on resize.
- Works without WebGL/canvas; keep the dark `#141414` background during load to avoid flashes.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/gta-vi-landing-page-scroll-final/hero-campaign-mobile.jpg
https://motionprompts.dev/c/gta-vi-landing-page-scroll-final/hero-campaign.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--bg-lifted`, `--ivory`, `--ember`, `--ember-deep`, `--gray`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`/`getElementById`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, the reveal plays once, and then it misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here: two pinned `ScrollTrigger`s on `.hero`, each inserting its own pin-spacer and each claiming its own several-viewport scroll distance for the same section; two `Lenis` instances pulling on the same wheel event; two `onUpdate` callbacks racing to scale the same `.overlay` mask, zoom the same hero photo, and paint the same gradient into the same `h1` on every scrub tick. The visible symptom is a hero that stays pinned for twice the scroll distance it should, or a mask hole that jitters between two disagreeing scales mid-scrub, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only once the DOM is ready does it look up `.overlay`, `.hero-img-container`, `.hero-img-logo`, `.hero-img-copy`, `.fade-overlay`, the `h1`, `.logo-container` and the mask `path#logoMask`, wire `Lenis` into the GSAP ticker, force the inline reset onto `.overlay` (`width`/`height`/`position`/`top`/`left`/`transform`), stamp `logoData` onto the mask path, run `updateLogoMask()` once, set the overlay's starting scale, and create the single pinned `ScrollTrigger`. That guard exists to survive being loaded late in a plain document; in React it is dead weight, because `useEffect` already runs after the DOM is committed. Drop the guard and the listener both, and move that whole sequence into a `useEffect` with an empty dependency array.

*(2) Element lookups* — Every one of those eight lookups assumes this component owns the document, and `ScrollTrigger.create` compounds it by re-resolving `trigger: ".hero"` on its own instead of taking an element. Give the component a root `ref` on `section.hero`, resolve the other seven lookups off it, and pass the ref's current element as the trigger instead of the class string. During the StrictMode remount two `.hero` sections exist for an instant, and a bare class selector can bind the pin to the copy that is on its way out while the `onUpdate` closure still holds the elements from the copy that stays.

*(3) Cleanup* — Wrap the mask stamp, `updateLogoMask()`, the initial overlay `gsap.set`, and the trigger creation in a `gsap.context` scoped to the root ref, and revert that context in the cleanup. Register the trigger-creating function itself as a **named** method on the context, because this component calls it again later — from the resize handler, to kill and recreate the pin when the viewport width actually changes — and that second call happens from an event listener, not from inside the synchronous factory pass, so the context has no way to adopt the new trigger unless you hand it the function up front:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    updateLogoMask();
    gsap.set(svgOverlay, { transformOrigin: "50% 50%", scale: initialOverlayScale });
    self.add("setupScrollTrigger", setupScrollTrigger);
    self.setupScrollTrigger();
  }, rootRef);

  const onResize = () => {
    updateLogoMask();
    if (window.innerWidth === lastWidthRef.current) return;
    lastWidthRef.current = window.innerWidth;
    ScrollTrigger.refresh();
    ctx.setupScrollTrigger();
  };
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    ctx.revert();
    gsap.ticker.remove(raf);
    lenis.destroy();
  };
}, []);
```

Without the named registration, calling `setupScrollTrigger()` straight from `onResize` still produces a working trigger, but `ctx.revert()` on unmount would only know about the very first one — a trigger the resize handler recreated survives with its pin intact and keeps consuming scroll on whatever page the user navigated to next.

There is a second gap the revert does not close, and it is specific to how this component animates: `onUpdate` never builds a timeline, it computes every value straight from `self.progress` and applies it with `gsap.set` — the hero photo's scale, the overlay's scale, `.fade-overlay`'s opacity, the `h1`'s scale and opacity. Every one of those calls happens later, from a scroll event, well outside the synchronous window in which `gsap.context` listens for calls to adopt, so `ctx.revert()` leaves each of them holding whatever value the last scrub tick wrote. Clear them explicitly, after the revert: `gsap.set([heroImgContainer, svgOverlay, fadeOverlay, heroImgLogo, heroImgCopy, h1], { clearProps: "all" })`.

That still does not reach the headline. The bottom-up gradient wipe is painted with a plain assignment — `h1.style.background = …` and `h1.style.backgroundClip = "text"` — written directly on the node, never through a GSAP call, so it is invisible to both the context and `clearProps`. Remove it by hand in the same cleanup (`h1.style.removeProperty("background")`, and the same for `background-clip`), or the next mount's headline briefly shows the previous mount's frozen mid-wipe gradient before the first scrub tick repaints it.

**Lenis** — the mask hole only reads as a continuous shrink because `ScrollTrigger.update` fires on every Lenis `scroll` event, and Lenis itself only advances because `gsap.ticker.add` calls its `raf` method on every tick. Nothing else on this page expects a scroller, so this component can own the instance outright: create it inside the effect and call `destroy()` in the cleanup, but remove the ticker callback first, with the same function reference `gsap.ticker.add` was given, so a tick already in flight cannot call into an instance you have already destroyed. `gsap.ticker.lagSmoothing(0)` is a global GSAP setting, not a per-component one — leaving it patched after this component unmounts silently disables lag smoothing for every other GSAP animation on the page for the rest of the session. Restore GSAP's own defaults, `gsap.ticker.lagSmoothing(500, 33)`, in the same cleanup rather than leaving the `0` in place.
