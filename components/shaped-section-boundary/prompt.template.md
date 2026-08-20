---
slug: shaped-section-boundary
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 1
structural:
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Shaped Section Boundary — the edge between stacked sections is a shape, opened by scroll

## Goal

Build a scrolling page of full-height, flat-colour sections where **the top edge of each section
is a shape, not a straight line** — a wave, a chevron, a diagonal, a torn edge, an arch — and
where **the amplitude of that shape is written by the scroll position**: the edge starts flat as
the section appears from the bottom of the viewport and reaches its full form by the time the
section has risen a little past half the screen.

The point is not decoration. Stacked sections of flat colour with straight butt joins are the
single most recognisable tell of a generated page. Giving the join a shape — and animating that
shape — costs one element and one ScrollTrigger per section.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin
`ScrollTrigger`, and `lenis` (npm) for smooth scroll. No other plugins, no framework, no SVG, no
canvas — the shapes are pure CSS `clip-path`.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```

Wire Lenis to ScrollTrigger — this is not optional:

```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

Lenis animates its own scroll position; ScrollTrigger reads the native one. Without that first line
the two clocks drift and the triggers fire at the wrong moment or not at all — the component looks
broken in a way that never reaches the console. `lagSmoothing(0)` stops GSAP from swallowing a long
frame, which on a scrubbed mechanic shows up as a jump.

Register once with `gsap.registerPlugin(ScrollTrigger)` and wrap setup in `DOMContentLoaded`.

## The three decisions that ARE this component

Get these wrong and you have a wobbly stripe; get them right and it reads as art direction.

### 1. Register the custom property with `@property`. This is not optional.

```css
@property --shape {
  syntax: "<number>";
  inherits: false;
  initial-value: 1;
}
```

An unregistered custom property is an opaque **string** to the engine. `clip-path: polygon(…
calc(60% - var(--shape) * 30%) …)` will still compute, but the browser cannot interpolate
`--shape`, so any CSS `transition` on it jumps from 0 to 1 instead of easing. Registered as
`<number>` it becomes a genuinely animatable value — and `initial-value: 1` guarantees the
shapes are fully open if the JS never runs (bundler failure, JS disabled, error earlier on the
page). **Fail open, not flat.**

### 2. The boundary belongs to the INCOMING section, and uses `background: inherit`.

Each section that wants a shaped top edge contains, as its first child, one empty element:

```html
<section class="panel ink">
  <div class="edge" data-shape="chevron"></div>
  …
</section>
```

```css
.edge {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: clamp(48px, 8vw, 128px);
  background: inherit;                        /* ← the whole trick */
  transform: translateY(calc(-100% + 1px));   /* lift it out, over the previous section */
  pointer-events: none;
  z-index: 2;
}
```

**That `+ 1px` is an overlap, and its sign is load-bearing.** With a plain `translateY(-100%)` the
boundary's bottom edge lands exactly on the section's top edge, and sub-pixel rounding lets a
**1px line of the previous section's colour** through — visible as a hairline stripe running the
full width, right across your new section. Nudging it 1px *down* buries the join inside the
panel. (Writing `inset: -1px 0 auto 0` instead pushes it the wrong way and *causes* the stripe.
This was a real bug in the first build of this component; it is invisible in code review and
obvious in a screenshot.)

`background: inherit` means the edge colour and the section colour are literally the same value.
They cannot drift apart when someone re-dresses the palette — which is exactly the bug you get
if the edge is owned by the *outgoing* section and its colour is hard-coded to match the next
one. Assign the shape by attribute (`data-shape`), never by section colour.

### 3. `overflow-x: clip` on every section.

```css
.panel { position: relative; overflow-x: clip; }
```

A boundary drawn wider than the viewport — or any mechanic that pushes elements out of frame —
lengthens the document and produces horizontal scroll. Use `clip`, **not `hidden`**: `clip` does
not create a scroll container, so unlike `hidden` it will not break `position: sticky` on
anything nested inside.

## The shapes

Every polygon's bottom edge is always `0% 100%` → `100% 100%`. That is the line welded to the
section; it never moves. Only the top vertices depend on `--shape`, from 0 (flat) to 1 (full).

```css
.edge[data-shape="wave"] {          /* wave — three crests, the softest */
  clip-path: polygon(0% 100%,
    0%   calc(62% - var(--shape) * 26%),
    25%  calc(24% + var(--shape) * 40%),
    50%  calc(70% - var(--shape) * 34%),
    75%  calc(24% + var(--shape) * 34%),
    100% calc(58% - var(--shape) * 24%),
    100% 100%);
}

.edge[data-shape="chevron"] {       /* one central vertex, points down */
  clip-path: polygon(0% 100%,
    0%   calc(100% - var(--shape) * 42%),
    50%  calc(100% - var(--shape) * 100%),
    100% calc(100% - var(--shape) * 42%),
    100% 100%);
}

.edge[data-shape="oblique"] {       /* corner to corner, the most aggressive */
  clip-path: polygon(0% 100%,
    0%   calc(100% - var(--shape) * 96%),
    100% calc(100% - var(--shape) * 8%),
    100% 100%);
}
```

**Torn edge** — twelve points at *fixed* heights. Fixed is the decision: a torn edge that
re-randomises on every load does not read as torn paper, it reads as a rendering bug.

The x-positions are 9% apart **except the last one, which jumps from 90% to 100%** so the polygon
closes on the right edge instead of leaving a 1% straight sliver:

```css
.edge[data-shape="torn"] {
  clip-path: polygon(
    0% 100%,
    0%   calc(100% - var(--shape) * 34%),   9%  calc(100% - var(--shape) * 72%),
    18%  calc(100% - var(--shape) * 41%),  27%  calc(100% - var(--shape) * 88%),
    36%  calc(100% - var(--shape) * 56%),  45%  calc(100% - var(--shape) * 95%),
    54%  calc(100% - var(--shape) * 48%),  63%  calc(100% - var(--shape) * 79%),
    72%  calc(100% - var(--shape) * 37%),  81%  calc(100% - var(--shape) * 84%),
    90%  calc(100% - var(--shape) * 52%), 100%  calc(100% - var(--shape) * 68%),
    100% 100%);
}
```

Every y is `calc(100% - var(--shape) * H%)`, so `--shape: 0` flattens all twelve to the baseline and
the edge disappears — which is what makes the whole set animatable from one custom property.

**Arch** — do this one with `border-radius`, not a polygon:

```css
.edge[data-shape="arch"] {
  clip-path: none;
  border-radius: calc(var(--shape) * 50%) calc(var(--shape) * 50%) 0 0 /
                 calc(var(--shape) * 100%) calc(var(--shape) * 100%) 0 0;
}
```

A true curve approximated with polygon vertices shows visible facets at large boundary heights.

## Motion

One ScrollTrigger per boundary. Nothing else.

```js
gsap.fromTo(edge, { "--shape": 0 }, {
  "--shape": 1,
  ease: "none",
  scrollTrigger: {
    trigger: edge.closest(".panel"),
    start: "top bottom",
    end: "top 55%",
    scrub: 0.6,
    invalidateOnRefresh: true,
  },
});
```

**Why this window and not another.** The shape opens as the edge appears from the bottom and is
finished by the time the section has risen past mid-screen. If you let it run to `top top`, the
edge is still moving while the reader is already on the headline, and the boundary competes with
the text — that is the mistake that makes this effect look cheap. **The movement must be over
before the reading starts.**

**`scrub: 0.6`, not `scrub: true`.** The lag makes the edge *chase* the scroll rather than being
welded to it. With a hard scrub, a mouse wheel with coarse steps makes the shape jump between
states and the polygon visibly stair-steps.

**Refresh after fonts load.** Web fonts change headline heights and therefore every section's
position. Without this the triggers stay computed against the fallback-font layout and the edges
open out of sync with their sections:

```js
if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
```

## Responsive and reduced motion

Only the oblique form needs a width correction — at 390px a full-slope diagonal eats half the
screen. Cut its travel to ~62% below 640px.

For `prefers-reduced-motion: reduce`, lock the shape open and create **no triggers at all**:

```css
@media (prefers-reduced-motion: reduce) { .edge { --shape: 1 !important; } }
```

The art direction survives; only the animation goes. That is what the setting asks for.

## Choosing a form (this is the part that is taste, not code)

- **Wave** — softest, points at nothing. Best above long text blocks.
- **Chevron** — points down, so it pushes the reader onward. Good before a section that continues
  an argument; bad before a grid, where it fights the grid's own alignment.
- **Oblique** — most aggressive, strongly directional. One per page, maximum.
- **Torn** — carries a material connotation (paper, packaging, print). Only use it if the brand
  can carry that; on a fintech page it reads as a mistake.
- **Arch** — the quietest. The page breathes and nobody can say why.

**Do not use a different form for every boundary on a real page.** The demo shows five so you can
compare them. A finished page picks **one, at most two**, and repeats. Five different edges is a
sampler, not art direction.

## Adapting

Everything except the three decisions above is dressing. Change the palette, the section content,
the boundary height (`--alto-edge`), the number of sections, the type. Add new forms by writing
another `polygon()` whose top vertices multiply by `var(--shape)` and whose bottom edge stays at
100%. Keep: the `@property` registration, `background: inherit`, `overflow-x: clip`, the window
that closes at `top 55%`, and the soft scrub.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`,
bails out under `prefers-reduced-motion` before creating anything, otherwise wires one
document-level `Lenis` instance into GSAP's ticker, walks every `.edge` on the page with
`gsap.utils.toArray(".edge").forEach(...)` to give each boundary its own scrubbed tween-and-trigger
pair, and finally waits on `document.fonts.ready` to refresh those triggers once headline metrics
settle. React withdraws the free run of the page, the one-shot lifetime, and the licence to never
tear anything down — quietly: the boundaries open on schedule the first time, and the damage only
shows up on a second mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. This setup is short but leaves four live things behind: a `Lenis` instance, the
`gsap.ticker` callback pumping it, one tween-and-`ScrollTrigger` pair per `.edge` (five in the demo
— wave, chevron, oblique, torn, arch), and a pending `document.fonts.ready` continuation. A double
mount that doesn't undo all four leaves two `Lenis` instances fighting over the same wheel event,
twice the triggers scrubbing the same `--shape` custom property on the same nodes, and a second
`ScrollTrigger.refresh()` queued behind the first once fonts settle.

*(1) The entry point* — the whole body sits inside `document.addEventListener("DOMContentLoaded",
...)`. A React component mounts after that event has already fired, so the listener registers and
is never called: no `Lenis`, no triggers, every edge stays flat forever with nothing in the console
to point at. Delete the listener and move its body — the reduced-motion check and its early
`return`, the `Lenis` construction and ticker wiring, the `gsap.utils.toArray(".edge").forEach(...)`
loop, and the `document.fonts.ready` call — into a `useEffect` with an empty dependency array.
`gsap.registerPlugin(ScrollTrigger)` can move to module scope; re-registering on every mount is
harmless but pointless. The reduced-motion branch stays trivial either way: it returns before
creating anything, so on that path the effect has nothing to clean up.

*(2) Element lookups* — `gsap.utils.toArray(".edge")` is the lookup that needs scoping: called
synchronously inside a `gsap.context` factory, GSAP resolves any selector string against that
context's root instead of the whole document, so wrapping the loop in a context scoped to this
component's root ref is enough — no manual `root.querySelectorAll` rewrite needed. The very next
line, `edge.closest(".panel")`, needs no change at all: it climbs the ancestor chain from an `edge`
node you already hold, not from a fresh document-wide selector, so once `edge` itself resolves
inside this component's subtree, the panel `.closest` finds is already the right one.

*(3) Cleanup* — wrap the reduced-motion check and the `.forEach` loop in a `gsap.context` scoped to
the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the reduced-motion check, then the toArray(".edge").forEach loop */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` covers exactly the tween-and-`ScrollTrigger` pair `gsap.fromTo` creates for each
`.edge` — as many pairs as the page renders, all created synchronously inside the loop — and
nothing outside that loop. It does **not** cover `gsap.ticker.add((t) => lenis.raf(t * 1000))`: a
ticker subscription is neither a tween nor a trigger, so the context never records it, and this is
exactly the case where that gap matters most — that callback is what keeps `Lenis`'s own frame loop
alive. Keep the reference and remove it before destroying `Lenis`:

```jsx
const onTick = (t) => lenis.raf(t * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

Reverse the first two calls and a ticker frame landing between them calls `.raf()` on a `Lenis`
instance you have already destroyed.

`Lenis` here is this component's own document-level resource — it drives every boundary's scrub,
not just one. If the shaped sections are one route or one section of a larger app, lift the
`new Lenis()` call to the app shell and have this effect read the shared instance instead of
constructing a second one; if it genuinely owns the whole page's scroll, construct it in the effect
as shown. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown of its own — in
this Lenis version `destroy()` clears the instance's internal emitter along with it — which is
exactly what makes the ticker callback the one piece that does need explicit removal: it lives on
GSAP's ticker, a resource `Lenis` does not own and `destroy()` cannot reach.

The remaining loose end is `document.fonts.ready.then(() => ScrollTrigger.refresh())`. That promise
can resolve after a StrictMode unmount, or after a real navigation away, and its callback would
then call a global refresh on behalf of a component whose triggers `ctx.revert()` has already
removed. Guard it with the same cancellation flag the cleanup sets:

```jsx
let cancelled = false;
document.fonts.ready.then(() => {
  if (cancelled) return;
  ScrollTrigger.refresh();
});
return () => {
  cancelled = true;
  gsap.ticker.remove(onTick);
  lenis.destroy();
  ctx.revert();
};
```

Leave the refresh call itself un-scoped and fired once, exactly as above — it exists because a
web-font swap changes headline heights and therefore every panel's position, and limiting it to
this component's own triggers would leave every other panel on the page still measured against the
fallback-font layout.
