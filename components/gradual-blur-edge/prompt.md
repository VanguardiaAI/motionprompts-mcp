# Gradual Blur Edges (Stacked Masked `backdrop-filter` Bands)

## Goal
Build a page whose edges **dissolve instead of being cut**. A progressive blur band is pinned to the bottom of the window and a long index scrolls under it, so the list never "ends" — it fades out of focus. A second band sits under a fixed header that rests on a full-bleed photograph, keeping the navigation legible without drawing a bar. A third sits on the right end of a horizontal rail, so the crop reads as *there is more* rather than as a bug. Each band is a **stack of N `backdrop-filter` layers whose linear-gradient mask windows deliberately overlap**, with a falloff curve distributing the radii. The only scroll-driven motion is the bottom band's height, animated through a single CSS custom property by two scrubbed ScrollTriggers.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin, plus **`lenis`** for smooth scroll:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```
Everything runs inside a `DOMContentLoaded` listener. Register the plugin, then wire Lenis the standard way:
```js
const lenis = new Lenis({ smoothWheel: !reduced });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```
The blur mechanic itself uses **no library at all** — it is DOM elements with inline `mask-image` and `backdrop-filter`. GSAP is only there for the band's height.

## The mechanic, and the mistake almost everyone makes first
The obvious build is one layer with `backdrop-filter: blur(12px)` and `mask-image: linear-gradient(to bottom, transparent, black)`. **It does not work.** The mask fades that layer's *opacity*, but every pixel inside it still carries the same 12px radius — so the top of the band is a 12px blur at 5% opacity, and the eye finds that boundary instantly. You get a visible line where blurring starts, sitting inside what was meant to be a gradient.

A gradual blur is **N layers**. Layer `i` gets its own radius (small at the content end, large at the edge) *and* its own narrow mask window that slides along the band as `i` grows. The windows **overlap**, and that is the whole trick: layer `i` is transparent until step `i-1`, opaque from step `i` to `i+1`, and gone by step `i+2` — exactly where layer `i+1` has already reached full opacity. Every layer hands off inside the next one's opaque region, so no layer's own edge is ever the outermost thing on screen.

```
layer 1  ▁▇▇▁___________     blur 1.1px
layer 2  ___▁▇▇▁________     blur 1.8px
layer 3  ______▁▇▇▁_____     blur 2.9px
layer 4  _________▁▇▇▁__     blur 4.2px
layer 5  ____________▁▇▇     blur 5.6px
```

Drop the two trailing stops from each mask and you get banding — N visible stripes. That is the single most common way this effect ships broken.

**Four to eight layers.** Below four the handoff is coarse enough to see; above eight you pay for compositor work nobody can perceive. Six suits a tall band.

## Layout / HTML
```html
<body>
  <header class="chrome">
    <a class="mark" href="#">Kiln&nbsp;Seven</a>
    <nav class="chrome-nav">…three links…</nav>
  </header>

  <!-- Page level, and BELOW the header: a band placed inside the header paints over its own
       navigation and erases it. See "Stacking is a parameter" below. -->
  <div class="edge edge--top" data-edge="top" data-layers="5" data-strength="2.4"
       data-curve="ease-out" data-target="page" data-z="45" data-height="7rem"></div>

  <section class="hero">
    <img class="hero-img" src="(raked grit, full bleed)" alt="…" />
    <div class="hero-copy">
      <p class="eyebrow">Stoneware · reduction fired · Cone 10</p>
      <h1>Every glaze we<br />have ever pulled<br />out of the kiln.</h1>
      <p class="lede">…two lines…</p>
    </div>
  </section>

  <section class="book" id="book">
    <div class="book-head">
      <h2>Glaze book</h2>
      <div class="dial" role="group" aria-label="Falloff curve">
        <span class="dial-label">Falloff</span>
        <button class="dial-btn" data-curve="linear">Linear</button>
        <button class="dial-btn is-on" data-curve="bezier">Bezier</button>
        <button class="dial-btn" data-curve="exponential">Exponential</button>
      </div>
    </div>
    <ol class="index">
      <li class="entry">
        <img src="…" alt="" />
        <span class="code">KS-014</span>
        <span class="name">Bone ash, thin</span>
        <span class="cone">Cone 10 R</span>
        <span class="date">March 2009</span>
      </li>
      …twelve rows…
    </ol>
  </section>

  <section class="shelf" id="shelf">
    <h2>On the shelf this month</h2>
    <div class="rail-wrap">
      <div class="rail">…five figures with figcaption…</div>
      <div class="edge edge--right" data-edge="right" data-layers="6"
           data-strength="3" data-curve="bezier" data-z="30"></div>
    </div>
  </section>

  <section class="visit" id="visit">…heading, one paragraph, one CTA…</section>

  <!-- data-height is a custom property ON PURPOSE. The script writes the thickness inline, and an
       inline height beats any stylesheet rule — so if the markup gave a plain "8rem" here, the
       scrubbed tween on --edge-height would still be running and simply never be seen. Handing the
       band `var(--edge-height)` keeps the inline style resolving through the property the tween
       drives. Both page-level bands must also declare data-target="page" or the documented default
       (`parent`) makes them absolute and they detach from the window. -->
  <div class="edge edge--bottom" id="bottomEdge" data-edge="bottom" data-layers="6"
       data-strength="3.2" data-curve="bezier" data-target="page" data-z="40"
       data-height="var(--edge-height)"></div>
</body>
```
The bands are empty containers; the script fills them. Read every knob off `data-` attributes so the markup stays the single source of truth and the values can be retuned without touching JS.

## Styling
```css
.edge { position: absolute; pointer-events: none; isolation: isolate; z-index: 30; }
.edge > i { position: absolute; inset: 0; display: block; }

.edge--top    { position: fixed; top: 0; left: 0; right: 0; height: 7rem; }
.edge--bottom { position: fixed; bottom: 0; left: 0; right: 0;
                height: var(--edge-height); }
.edge--right  { top: 0; bottom: 0; right: 0; width: 9rem; }

/* The chrome outranks the top band, so its own type stays sharp on the blurred photograph. */
.chrome { z-index: 50; }
.mark,
.chrome-nav { position: relative; z-index: 2; }

@supports not (backdrop-filter: blur(1px)) {
  .edge > i { background: var(--ground); opacity: 0.42; }   /* the PAGE ground, never black */
}
```
`--edge-height: 8rem` lives on `:root` so one scrubbed tween can drive it. The per-band `z-index`
comes from `data-z`, applied by the builder — see below for why that has to be a knob.

**Palette.** Fired-clay near-black `#14100d`, poured-slip off-white `#f0ebe2`, one celadon signal `#8fb3a3` for codes, the eyebrow and the CTA. Nothing else carries colour.

**Type.** `Anybody` for display at `font-stretch: 88%` (76% for the wordmark) — a variable width axis reads as workshop stencilling, not as a brand face. `Sometype Mono` everywhere else, because a glaze book is a technical document.

## Placing the band (do this in JS, not in CSS)
```js
function placeBand(el, edge, { height, width, target, z } = {}) {
  const mode = target === "page" ? "page" : "parent";   // `parent` is the default (see the knobs table)
  const vertical = edge === "top" || edge === "bottom";
  el.style.position = mode === "parent" ? "absolute" : "fixed";
  if (mode === "parent") el.style.overflow = "hidden";
  // Number.isFinite, never `||`: z-index 0 is legal and useful — it is how a band goes BEHIND the
  // content it softens — and `z || 1000` throws it away.
  const layer = Number.isFinite(Number(z)) && z !== "" && z != null ? Number(z) : 1000;
  el.style.zIndex = String(layer + (mode === "page" ? 100 : 0));

  el.style.top = el.style.right = el.style.bottom = el.style.left = "";
  if (vertical) {
    el.style.left = "0"; el.style.right = "0"; el.style[edge] = "0";
    if (height) el.style.height = height;
    if (width) el.style.width = width;
  } else {
    el.style.top = "0"; el.style.bottom = "0"; el.style[edge] = "0";
    el.style.height = "100%";
    const thickness = width || height;      // for a horizontal band, `height` IS the thickness
    if (thickness) el.style.width = thickness;
  }
}
```
**Once JS owns the box, `responsive` stops being optional.** A stylesheet media query can no longer win against an inline `width`, so a `@media` rule on the band is dead code that *looks* alive. Either answer the breakpoint in JS — `responsive` with the original's three thresholds and a 100 ms debounce on resize, because a drag fires it dozens of times and each pass rebuilds every layer — or do not write the box inline at all. Leaving both is the worst of the three: measured on the demo's rail band at 390px, the CSS asked for 5rem and the inline gave 9rem, 37% of the viewport.

**Every knob has a default and the defaults have to be usable.** A band declared with nothing but `edge` must come out 6rem thick, anchored to its parent, at z-index 1000. And guard the numbers with `Number.isFinite`, not `||` — `layers: 0` (draw nothing) and `strength: 0` (present but not blurring) are both legal values that `||` silently replaces with the default.

**Do not split this between CSS and JS.** If the stylesheet owns the box and the script owns the layers, a direction can exist in the code and be invisible on screen — `left` in the direction map with no `.edge--left` rule builds five perfectly correct layers inside a 0×0 container. Deriving the box from `edge` in one place means the four directions cannot drift apart. Note the axis swap: for `left`/`right`, `height` means *thickness*, and `width` overrides it.

`target: "parent"` also clips the band to itself with `overflow: hidden`, so a band anchored inside a section cannot spill past it.

## The blur builder (the important part — be exhaustive)
```js
const CURVES = {
  linear:        (p) => p,
  bezier:        (p) => p * p * (3 - 2 * p),      // smoothstep
  "ease-in":     (p) => p * p,
  "ease-out":    (p) => 1 - (1 - p) ** 2,
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
};
const DIRECTION = { top: "to top", bottom: "to bottom", left: "to left", right: "to right" };

function buildGradualBlur(el, { layers = 5, strength = 2, curve = "linear",
                                edge = "bottom", exponential = false, opacity = 1 } = {}) {
  const f = CURVES[curve] ?? CURVES.linear;
  const step = 100 / layers;
  // Reuse the existing <i> when the count has not changed. A blanket replaceChildren() is the
  // reason a radius "transition" never fires: a brand-new element has no previous value to
  // interpolate from, so every rebuild is a jump. Only rebuild when the layer count changes.
  const reuse = animated && el.children.length === layers;
  if (!reuse) el.replaceChildren();

  for (let i = 1; i <= layers; i++) {
    // The curve ALWAYS runs first. It decides where on the ramp this layer sits; the ramp decides
    // how steeply the radius grows. Two independent knobs — five curves x two ramps = ten
    // combinations. Folding them into one ("exponential" as a sixth curve) silently throws the
    // curve away on the exponential branch and costs you four of the ten.
    const p = f(i / layers);

    // 0.0625rem = 1px at the default root size, so the band survives a larger base font.
    const radius = exponential
      ? 2 ** (p * 4) * 0.0625 * strength
      : 0.0625 * (p * layers + 1) * strength;

    const a = +(step * (i - 1)).toFixed(1);
    const b = +(step * i).toFixed(1);
    const c = +(step * (i + 1)).toFixed(1);
    const d = +(step * (i + 2)).toFixed(1);

    let stops = `transparent ${a}%, #000 ${b}%`;
    if (c <= 100) stops += `, #000 ${c}%`;   // the overlap — omit and you get stripes
    if (d <= 100) stops += `, transparent ${d}%`;

    const mask = `linear-gradient(${DIRECTION[edge]}, ${stops})`;
    const layer = document.createElement("i");
    layer.style.cssText =
      `-webkit-mask-image:${mask};mask-image:${mask};` +
      `-webkit-backdrop-filter:blur(${radius.toFixed(3)}rem);` +
      `backdrop-filter:blur(${radius.toFixed(3)}rem);`;
    el.append(layer);
  }
}
```

**The falloff curve** distributes the radii across the band; it is not the same knob as strength.

| curve | reads as |
|---|---|
| `linear` | mechanical — the very first step is already visibly soft |
| `bezier` | natural: first steps stay nearly sharp, the change happens in the middle |
| `ease-in` | holds sharp a long time, then goes fast |
| `ease-out` | softens immediately — right under a header where the top row must be legible now |
| `exponential` | for tall bands that have to swallow a lot of detail |

**Direction.** The mask always runs *towards the edge the band is pinned to*, so it is opaque at the page side and transparent at the window side. One builder serves all four; the band's size and position come from CSS, and the builder only fills it.

**Stacking is a parameter, not a detail.** Expose the band's `z-index` (`data-z`) and read it in the builder. The documented default is 1000 (+100 when `target: "page"`) so that a band dropped into an unknown page lands on top of things; the demo deliberately works on a much lower scale — 45, 40, 30 against a chrome at 50 — because here the page IS known and the bands have to sit *under* the navigation. Both are correct; what matters is that the number is chosen against the host page's own scale, not inherited.

**And mind the `+100`.** A band with `target: "page"` is placed at `z + 100`, so `data-z="45"` lands at **145**, not 45. Anything that must stay sharp above it has to clear the resolved number, not the one written in the markup — the demo's header sits at 150 for exactly this reason. Getting this wrong is subtle and expensive: the band is correctly lifted out of the header, and then quietly climbs back over it and blurs the navigation into a smear. It is also invisible to automated layout checks, because the band carries `pointer-events: none` and `document.elementFromPoint` therefore reports the *header* as the topmost element at that point. The only way to catch it is to look at the page. A band dropped *inside* the element whose content it is meant to protect will paint **over** that content: the band is positioned and its siblings usually are not, so it wins the paint order and blurs the very type it exists to keep legible. Either give it a lower z-index than the protected content, or — better for a header — lift it out to page level as a `position: fixed` band sitting *below* the chrome's stacking context, and give the chrome's own children `position: relative; z-index: 2`.

## GSAP effect
Two scrubbed ScrollTriggers on `.book`, both driving the same custom property, both skipped entirely under `prefers-reduced-motion` (the band stays at its CSS default):
```js
gsap.to(document.documentElement, {
  "--edge-height": "11rem", ease: "none",
  scrollTrigger: { trigger: book, start: "top 80%", end: "top 20%", scrub: 0.4 },
});
gsap.to(document.documentElement, {
  "--edge-height": "3rem", ease: "none",
  scrollTrigger: { trigger: book, start: "bottom 90%", end: "bottom 40%", scrub: 0.4 },
});
```
`ease: "none"` because the scrub owns the timing — an ease here fights it. **Scrub, not toggle:** a band that snaps between two heights is more distracting than no band at all.

The dial buttons **rebuild** the bottom stack. Note what they actually switch: `Linear` and `Bezier` set the *curve* and put the ramp back to linear; `Exponential` switches the *ramp* and leaves the curve alone — because those are two knobs, not three values of one. Rebuilding is cheap (the layers are six empty `<i>` elements) and it is also the honest demo: the curve is a build-time decision, not a transition.

## Behavior notes
- **`isolation: isolate` on the container.** `backdrop-filter` samples the backdrop of its stacking context. Without explicit isolation, an unrelated element elsewhere on the page in a blend mode can land inside that sample and tint the band on one section only.
- **`pointer-events: none`.** A fixed band across the bottom of the window otherwise eats every click in that strip, and the bug reads as "the last row of my list is broken".
- **It is invisible on flat colour.** The band only reads over texture or type. Put it where something detailed passes under it.
- **Ship the `@supports` fallback, and put it on the LAYERS.** `@supports not (backdrop-filter: blur(1px)) { .edge > i { background: var(--ground); opacity: 0.42 } }`. On the container it collapses to one flat wash; on the layers each one keeps its mask window, so the same overlapping ladder still builds a gradient. Use the page's ground colour, not black — a black tint on a dark page is invisible, and legibility was the point.
- **Fade the band in with `el.animate()`, not with a CSS transition.** A transition needs the browser to compute a painted frame at `opacity: 0` before it sees the `1`. Mounting happens inside `DOMContentLoaded`, before first paint, so both writes land in the same style change — measured 1 ms apart, with no `transitionrun` ever firing and the band simply appearing. `void el.offsetHeight` does not save it. The Animations API has no such dependency, and its `finished` promise is a cleaner `onAnimationComplete` than a `transitionend` that may never come. The *layers'* radius transition is a normal CSS transition and does work, because by then the element has been painted — but it only interpolates if the rebuild **reuses the existing nodes**: new nodes have nothing to transition from.
- **Animate the band's height, never the radii.** Height is a cheap layout change on a fixed element. Re-rasterising N backdrop filters every frame is not, and it shows up on mid-range phones first.
- Set `document.documentElement.dataset.movimientoListo = "1"` once the layers are built and the triggers are wired.

## Assets / images
Fourteen photographs, all quiet still life of clay, cloth, plaster and dried grasses. They are the substrate the blur acts on, so they need texture and mid-tones — a page of high-contrast graphics would fight the band instead of feeding it. The hero is raked grit filling the frame, chosen precisely because its high-frequency detail is what makes the top band legible.

## Images

This component ships with 14 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

| file | what it is | where |
|---|---|---|
| `kiln-floor.jpg` | Raked ridges of warm sand-coloured grit, low raking light | Full-bleed hero |
| `throwing.jpg` | Two hands centring a wet clay bowl on a wheel | Last card of the shelf rail |
| `glaze-01…08.jpg` | Vessels, plates, a clay block, a dried fern, hands with a raw bowl | 56×44 thumbnails in the index |
| `shelf-01…04.jpg` | Concrete blocks, folded cloth, a plant on a bare wall, backlit grasses | Cards in the shelf rail |

```
https://motionprompts.dev/c/gradual-blur-edge/kiln-floor.jpg
https://motionprompts.dev/c/gradual-blur-edge/throwing.jpg
https://motionprompts.dev/c/gradual-blur-edge/glaze-01.jpg
https://motionprompts.dev/c/gradual-blur-edge/glaze-02.jpg
https://motionprompts.dev/c/gradual-blur-edge/glaze-03.jpg
https://motionprompts.dev/c/gradual-blur-edge/glaze-04.jpg
https://motionprompts.dev/c/gradual-blur-edge/glaze-05.jpg
https://motionprompts.dev/c/gradual-blur-edge/glaze-06.jpg
https://motionprompts.dev/c/gradual-blur-edge/glaze-07.jpg
https://motionprompts.dev/c/gradual-blur-edge/glaze-08.jpg
https://motionprompts.dev/c/gradual-blur-edge/shelf-01.jpg
https://motionprompts.dev/c/gradual-blur-edge/shelf-02.jpg
https://motionprompts.dev/c/gradual-blur-edge/shelf-03.jpg
https://motionprompts.dev/c/gradual-blur-edge/shelf-04.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page
`buildGradualBlur` has no dependency on the rest of the page. The full knob set, all readable from `data-` attributes:

| knob | what it does |
|---|---|
| `layers` | how many stacked layers (4–8) |
| `strength` | multiplier on every radius |
| `curve` | where each layer sits on the ramp — the five functions above |
| `exponential` | which ramp the curve feeds. **Orthogonal to `curve`** |
| `edge` | top · bottom · left · right |
| `height` / `width` | band thickness, default `6rem`; for horizontal bands `height` is the thickness and `width` overrides |
| `target` | `parent` (default: absolute, clipped to itself) or `page` (fixed) |
| `z` | stacking order, default 1000, `+100` when `target` is `page` — see above for why this must be a knob |
| `opacity` | per-layer opacity |
| `animated` + `duration` + `easing` | the band fades in **and** its layers transition their radius instead of snapping. Two things, not one |
| `hoverIntensity` | band becomes interactive (`pointer-events: auto`) and rebuilds at `strength × intensity` under the pointer. It must **propagate the band's own `animated`**, not force it — otherwise a band that never asked for animation gets a transition it does not declare |
| `responsive` + `mobileHeight` / `tabletHeight` / `desktopHeight` | thickness per breakpoint (≤480 / ≤768 / ≤1024), recomputed on resize with a 100 ms debounce |
| `preset` | a named bundle. A preset only fills knobs the markup did not set |

The nine bundles, in full — naming them without their values leaves the most reusable part of the
component to be guessed:

```js
const PRESETS = {
  top:    { edge: "top",    height: "6rem" },
  bottom: { edge: "bottom", height: "6rem" },
  left:   { edge: "left",   height: "6rem" },
  right:  { edge: "right",  height: "6rem" },
  subtle:  { height: "4rem",  strength: 1, opacity: 0.8, layers: 3 },
  intense: { height: "10rem", strength: 4, layers: 8, exponential: true },
  smooth:  { height: "8rem",  curve: "bezier", layers: 10 },
  sharp:   { height: "5rem",  curve: "linear", layers: 4 },
  header:  { edge: "top",    height: "8rem", curve: "ease-out" },
  footer:  { edge: "bottom", height: "8rem", curve: "ease-out" },
  sidebar: { edge: "left",   height: "6rem", strength: 2.5 },
  "page-header": { edge: "top",    height: "10rem", target: "page", strength: 3 },
  "page-footer": { edge: "bottom", height: "10rem", target: "page", strength: 3 },
};
```

`animated` has a third value, `"scroll"`: the band mounts at opacity 0 and fades in when an `IntersectionObserver` (threshold 0.1) says it has entered the viewport. In that mode the *layers* do not transition their radius — the fade is the whole animation. For a header band use `curve: "ease-out"` and 4–5 layers; for a page-bottom band use `curve: "bezier"` and 6; for a tall hero band use `exponential` and 8. If you drop the GSAP height animation the component still works — the mechanic is entirely CSS, and the scroll wiring is a refinement, not a requirement.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, mounts three `.edge` bands by reading their `data-*` attributes, wires one page-wide `Lenis` instance to `ScrollTrigger`, and drives the bottom band's height with two scrubbed tweens keyed to `.book`. None of it expects to run twice, and none of it expects to be undone. React withdraws both guarantees at once — the effect renders once, looks right, and only shows the damage on the next mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before the user sees anything. This component accumulates state fast: a `Lenis` instance, the `gsap.ticker` callback that pumps it, two scrubbed `ScrollTrigger`s pinned to `.book`, and three click listeners on `.dial-btn`. A double mount that does not undo all four leaves two smooth-scrollers fighting over the same wheel event, two tickers each calling `.raf()` on a different `Lenis` instance, two triggers disagreeing about the current `--edge-height`, and — the one that is easiest to miss, because clicking still "works" — every dial click rebuilding the bottom band's six layers twice, once per surviving listener. None of this shows up in a production build; React only double-invokes effects in development.

*(1) The entry point* — everything from `gsap.registerPlugin(ScrollTrigger)` down through `edges.forEach(mountBand)`, the `Lenis` construction, the dial-button wiring, the two `--edge-height` tweens and the closing `ScrollTrigger.refresh()` lives inside `document.addEventListener("DOMContentLoaded", ...)`. By the time a React component mounts, that event has already fired, so the listener is registered and never called: no band gets its layers, no scroll smoothing exists, the dial does nothing. Delete the listener and move its whole body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can move to module scope instead — it only needs to run once per page load, not once per mount.

*(2) Element lookups* — `document.querySelectorAll(".edge")`, `document.getElementById("bottomEdge")`, `document.querySelector(".book")` and `document.querySelectorAll(".dial-btn")` all assume this script owns the whole document. Scope the first, third and fourth to a root ref (`root.querySelectorAll(".edge")`, `root.querySelector(".book")`, `root.querySelectorAll(".dial-btn")`), and replace the `id` lookup with a ref on the bottom band — an `id` is a page-wide name, so two mounted instances of this component collide on `bottomEdge` and only one band is ever found. Leave `document.documentElement` alone: the two `--edge-height` tweens and the `:root` fallback in the Styling section are a deliberate page-level design, not an oversight to scope away. During the StrictMode remount, two copies of `.edge`, `.book` and the dial buttons exist for an instant, and an unscoped lookup can bind to the copy that is on its way out.

*(3) Cleanup* — wrap the body in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, mountBand() for each .edge, the dial-button
    // listeners, and the two --edge-height ScrollTriggers keyed to .book
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` reaches both `--edge-height` tweens even though their target, `document.documentElement`, sits outside the component's own subtree — GSAP tracks what it creates while the factory runs, not where the target happens to live. Reverting removes the inline `--edge-height` value the tweens wrote to `<html>`, which hands the property straight back to the 8rem `:root` fallback the stylesheet declares — the resting state the Styling section describes, restored for free.

What `ctx.revert()` will not touch is anything wired with a plain `addEventListener`. The three `.dial-btn` click listeners are attached inside the factory but are neither tweens nor triggers, so a StrictMode remount leaves six listeners on three buttons, and every later click rebuilds the same six `<i>` layers twice. The original attaches an inline arrow per button, which cannot be removed by identity later — name the handler instead so cleanup can find it:

```jsx
const onDialClick = (btn) => { /* the curve/exponential toggle, then buildGradualBlur(bottom, optsOf(bottom)) */ };
dialButtons.forEach((btn) => btn.addEventListener("click", () => onDialClick(btn)));
// cleanup:
dialButtons.forEach((btn) => btn.removeEventListener("click", onDialClick));
```

The same rule covers `gsap.ticker.add((t) => lenis.raf(t * 1000))`: a ticker subscription is not a tween or a trigger, so the context does not record it either. Keep the reference and remove it before destroying `Lenis`, in this order:

```jsx
const onTick = (t) => lenis.raf(t * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

Remove the ticker after destroying Lenis instead, and any frame landing between the two calls invokes `.raf()` on an instance that is already gone.

The closing `ScrollTrigger.refresh()` runs synchronously right after `mountBand`, before the browser has necessarily finished decoding the fourteen photographs the page depends on — the eight `glaze-0X.jpg` thumbnails inside `.book .index` matter most here, since they sit inside the very element the two `--edge-height` triggers measure. A thumbnail that decodes after this call changes `.book`'s height and invalidates the `"top 80%"` / `"bottom 90%"` start points the triggers already captured against the old layout. Wait for the images inside `.book` to settle — `Promise.all` over their `decode()` calls, guarded by the same cancellation flag the cleanup sets, so a late resolution after unmount does not call `refresh()` on a trigger that no longer exists — before the one `refresh()` call, instead of firing it the instant the bands exist.

**Lenis** — this page has exactly one smooth-scroll instance, and it belongs to this component: the whole document scrolls through it. Construct it inside the effect as the original does, and destroy it in the cleanup shown above. If this band system is ever mounted as one section inside a larger app that already runs its own `Lenis`, drop the local construction and subscribe the existing instance's `scroll` event to `ScrollTrigger.update` instead of starting a second smooth-scroller against the same wheel.
