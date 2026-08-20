---
slug: dotted-path-traveller
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Dotted Path Traveller — a route with stops, drawn by the scroll

## Goal

Build a pinned scene where **a dot travels along a dashed line as you scroll**, the line
revealing itself behind it, and **named milestones light up as it passes each one**. Use it when
there is a journey with stops and the spatial order is the information: where the materials come
from, a route, a timeline that is not a straight bar.

## Tech

Vanilla HTML/CSS/JS with ES modules: `gsap` + `ScrollTrigger`, and `lenis`. **No `MotionPathPlugin`
and no SVG animation library** — `getPointAtLength()` is native, exact, and free.

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

## The decision that holds the whole thing up

**The geometry lives in the path's `d` and nowhere else.** Neither the traveller nor the
milestones carry coordinates. Milestones carry a *fraction of the route*:

```html
<div class="stop" data-t="0.32"><b>Utiel</b><span>el vino</span></div>
```

and everything is placed by asking the path itself:

```js
const pt = ahead.getPointAtLength(length * parseFloat(h.dataset.t));
```

**Measure against the SVG's painted box, but express the result relative to `.map`.** Those are two
different boxes the moment `.map` has any padding — and it needs padding, to give the labels room
— so a conversion that skips the offset is right only by accident:

```js
const toScreen = (pt) => {
  const box  = svg.getBoundingClientRect();     // where the drawing actually is
  const host = map.getBoundingClientRect();     // the positioned ancestor labels live in
  return {
    x: (box.left - host.left) + (pt.x / VIEWBOX.w) * box.width,
    y: (box.top  - host.top)  + (pt.y / VIEWBOX.h) * box.height,
  };
};
```

The viewBox is `0 0 1000 240` and the SVG uses `preserveAspectRatio="xMidYMid meet"`; both numbers
are load-bearing, because the ratio between viewBox units and painted pixels is what the two
divisions above assume.

Change the curve and the line, the traveller and all four labels move together. The alternative —
positioning labels by hand with `left`/`top` — works exactly until somebody adjusts the curve
three weeks later, and then the names point at nothing. There is no second copy of the geometry
to drift.

## The trap: `getPointAtLength` returns viewBox units, not pixels

This is the bug that only shows up when you resize.

The `<svg>` scales with its container, so a point at `x = 500` in a `viewBox="0 0 1000 240"` is at
half the **painted** width — which is not 500 pixels unless the box happens to be exactly 1000
wide. Convert:

```js
const aPantalla = (pt) => {
  const caja = svg.getBoundingClientRect();
  return { x: (pt.x / 1000) * caja.width, y: (pt.y / 420) * caja.height };
};
```

Writing `pt.x` straight into `style.left` works at the one width you developed on and misaligns
at every other. It reads fine in code review.

## Revealing a *dotted* line: use a mask, not the dash array

This is the part that goes wrong twice before it goes right.

Animating `stroke-dashoffset` on the dotted path **slides the dots along the line** instead of
uncovering them, because the offset shifts the whole pattern. The next idea — stuffing the
revealed length into the array as `7 9 ${length * p} ${length}` — is worse and *looks* like it
works: it gives you 16 units of dots followed by one long **solid** dash. The line silently stops
being dotted, and a contact sheet is the only way you notice.

The correct technique is a mask. Three paths, all sharing the same `d`:

```html
<defs>
  <mask id="reveal" maskUnits="userSpaceOnUse">
    <path id="path-mask" fill="none" stroke="#fff" stroke-width="60" stroke-linecap="butt" />
  </mask>
</defs>
<path id="path-ahead" class="ahead" stroke-dasharray="7 9" />                    <!-- route ahead, faint -->
<path id="path-done"  stroke-dasharray="7 9" mask="url(#reveal)" />           <!-- route done -->
```

The **mask** is the thing that gets drawn: one fat single dash of the full length, retracted with
`dashoffset`.

```js
maskPath.style.strokeDasharray  = `${length} ${length}`;
maskPath.style.strokeDashoffset = `${length * (1 - p)}`;
```

The dotted pattern underneath is never touched, so the dots stay put and are simply uncovered.

Keep the faint "route ahead" path visible from the start: it tells the reader where they are
going, and without it the section opens on an empty screen.

## Motion

One ScrollTrigger, no tween on the traveller, no `scrub` — positions are written directly on
every update and Lenis supplies the smoothness:

```js
const advance = (p) => {
  const pt = aPantalla(ahead.getPointAtLength(length * p));
  traveller.style.left = `${pt.x}px`;
  traveller.style.top  = `${pt.y}px`;
  maskPath.style.strokeDashoffset = `${length * (1 - p)}`;
  km.textContent = Math.round(KM_TOTAL * p);
  stops.forEach((h) => h.classList.toggle("encendido", p >= parseFloat(h.dataset.t) - 0.01));
};

ScrollTrigger.create({
  trigger: ".pista", start: "top top", end: "bottom bottom",
  onUpdate: (s) => advance(s.progress),
  onRefresh: (s) => { geometry(); placeStops(); advance(s.progress); },
  invalidateOnRefresh: true,
});
```

The milestone toggle is a **class**, so the fade is a CSS `transition` (0.35s) rather than a
tween: scrubbing back and forth past a milestone must not queue up animations.

The `- 0.01` margin stops the last milestone flickering when progress lands on 1 by rounding.

**`onRefresh` must redo three things in this order**: the path (it may have swapped at the
breakpoint), then its length, then the milestones — each depends on the previous.

## Placing the labels: three rules, all learned by looking

**1. The offset is measured, never a constant.** The label is centred with
`translate(-50%, -50%)`, so clearing the line takes half its OWN height plus a gap:

```js
const half = stop.offsetHeight / 2;
const top = (side) => (side === "above" ? p.y - half - GAP : p.y + half + GAP);
```

A hardcoded `-52` against a 126px label puts **every** label 11px on top of the line it is
annotating. The number was right for the sketch and wrong for the content, and it stays wrong the
moment anybody edits a caption.

**2. Which side a label goes on is asked of the curve.** Sample the path slightly before and
after each stop: on a crest the label goes above, in a trough below.

```js
const sideOf = (t) => {
  const step = 0.05;
  const y0 = path.getPointAtLength(len * Math.max(0, t - step)).y;
  const y1 = path.getPointAtLength(len * Math.min(1, t + step)).y;
  return path.getPointAtLength(len * t).y <= (y0 + y1) / 2 ? "above" : "below";
};
```

Alternating is what stops four labels crowding the same side of an S — and like everything else
here it is derived from `d`, so it survives a change to the curve.

**3. The curve's preference is only a preference.** Near the ends of a path that climbs the whole
frame the preferred side runs out of room and the label leaves the map. Fall back to the other
side rather than hand-tuning the path:

```js
let side = sideOf(t);
if (!fits(side)) side = side === "above" ? "below" : "above";
```

And give `.map` vertical padding — that is where the below-labels live. Vertical only: horizontal
padding shrinks the SVG and squeezes the route.

## Use `ResizeObserver`, not the `resize` event

The SVG box changes size without the window changing width: a font finishing loading, a
scrollbar appearing, a parent container animating. `resize` misses all of those.

```js
new ResizeObserver(() => { placeStops(); ScrollTrigger.refresh(); }).observe(svg);
```

## Responsive

Below 760px, **swap the path for a flatter one**. A three-curve S in 390px of width stacks the
labels on top of each other; there is no amount of font-size tuning that fixes it. Two paths,
one `setAttribute("d", …)` in `geometry()`.

## Reduced motion

Draw the line complete, light every milestone, put the traveller at the end, and collapse the
track to `min-height: 0`. The whole route is visible at once — which is the information. Do not
make the reader scroll 260svh for a static picture.

## Details that matter more than they look

- Each milestone needs a **leader and an anchor dot on the line** (`::before` + `::after`).
  Without them the name floats and says nothing about which part of the route it belongs to.
- `transform: translate(-50%, -50%)` on traveller and milestones: centres them on the point
  without subtracting their own size in the maths.
- A live counter (`0 → 88 km`) turns the traveller from decoration into a readout.
- `#path-ahead` is a document-wide id — two instances on one page collide. Scope it if you need two.

## Adapting

Change the path, the number of milestones (three to six), the traveller (a dot, an icon, a small
image), the counter's unit, the palette. Keep: geometry only in `d`, `data-t` fractions instead
of coordinates, the viewBox→pixel conversion, the trailing-gap reveal, the class-based milestone
toggle, and the `ResizeObserver`.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`,
reaches into the page with `document.querySelector` and `document.getElementById` for the svg,
the three paths, the traveller, the stops and the counter, computes the geometry once, and then —
unless `prefers-reduced-motion` short-circuits it — wires one `Lenis` instance, one `gsap.ticker`
subscription that pumps it, one `ScrollTrigger` pinned to `.track`, a `ResizeObserver` on the
`<svg>`, and a `fonts.ready` continuation, none of which it ever expects to undo. React withdraws
all three of those guarantees at once — the ready-made document, the free run of an unscoped
lookup, the license to run exactly once — and it does it quietly: the traveller walks the curve
correctly on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. By the time that first unmount can land, this component already has a `Lenis`
instance receiving wheel input, a ticker callback pumping it every frame, a pinned `ScrollTrigger`
reading `.track`'s scroll range, a `ResizeObserver` watching the `<svg>`, and possibly a
`fonts.ready` promise still pending. A double mount that doesn't undo all of it doesn't draw a
second traveller next to the first — `geometry()` and `placeStops()` re-run unconditionally at the
top of the effect and overwrite the shared `d`, length and label positions either way — it leaves
two `Lenis` instances fighting over the same wheel event, a ticker calling `.raf()` on whichever
instance got destroyed first, and two `ScrollTrigger`s both driving `advance()` off the same
scrub. None of this reproduces in a production build, since React only double-invokes effects in
development, so the teardown below is load-bearing, not defensive.

*(1) The entry point* — the whole body sits inside `document.addEventListener("DOMContentLoaded",
...)`. A React component mounts after that event has already fired on the document, so the
listener attaches and is never called back: the path never gets a `d`, the traveller never moves,
nothing to debug. Delete the listener and move its entire body — plugin registration, the `reduce`
check, `geometry()`/`placeStops()`, the `Lenis` and ticker wiring, `ScrollTrigger.create`, the
`ResizeObserver`, and the `fonts.ready` call — into a `useEffect` with an empty dependency array.
`gsap.registerPlugin(ScrollTrigger)` can move to module scope; re-running it on every mount is
harmless but buys nothing.

*(2) Element lookups* — most of the lookups here (`.map svg`, `.traveller`, `.km`, `.map` itself)
are plain `document.querySelector` calls and need the usual root-ref scoping. The three that
actually break under a remount are the ones using `document.getElementById`: `path-ahead`,
`path-done` and `path-mask` are document-wide ids, and `getElementById` has no notion of which of
the two subtrees present during the StrictMode remount is "this" component's — it returns
whichever copy comes first in document order, so the live effect's `ahead`/`done`/`maskPath`
variables can end up pointing at the outgoing instance's paths instead of its own. Give the root
element a ref and replace every `getElementById("path-x")` with a scoped
`root.querySelector("#path-x")`, which restricts the match to this instance's own subtree — the
same fix the vanilla version already needs the moment a second copy of this component lands on one
page (see the note above about `#path-ahead` colliding). `gsap.utils.toArray(".stop")` and the
`trigger: ".track"` string handed to `ScrollTrigger.create` don't need the same rewrite: once both
sit inside the `gsap.context` below, GSAP resolves that selector text against the context's own
scope automatically.

*(3) Cleanup* — wrap the reduced-motion check, `geometry()`/`placeStops()`, the `Lenis` setup and
the one `ScrollTrigger` in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // reduce check, geometry()/placeStops(), Lenis + ticker wiring, ScrollTrigger.create
  }, rootRef);
  return () => ctx.revert();
}, []);
```

There are no tweens in this component — `advance()` writes `left`/`top`/`strokeDashoffset`
straight onto the traveller and the mask path, and `placeStops()` writes straight onto each
`.stop` — so `ctx.revert()`'s only job here is removing the one `ScrollTrigger` that calls
`advance()` on scroll and on refresh. It does **not** reach
`gsap.ticker.add((t) => lenis.raf(t * 1000))` — a ticker subscription is neither a tween nor a
trigger — and this component has no `requestAnimationFrame` loop of its own to fall back on: that
one subscription is the entire frame pump for smooth scroll. Keep the callback by reference and
tear things down in this order:

```jsx
const pumpLenis = (t) => lenis.raf(t * 1000);
gsap.ticker.add(pumpLenis);
// cleanup:
gsap.ticker.remove(pumpLenis);
lenis.destroy();
ctx.revert();
```

Removing the ticker subscription before destroying `Lenis` matters here specifically:
`lenis.on("scroll", ScrollTrigger.update)` means any frame landing between the two calls would
otherwise invoke `.raf()` on a dead instance and then push a stale scroll value into
`ScrollTrigger.update()`. `Lenis` is a document-level resource, not this section's alone — if the
route map ships as one part of a larger page, lift the `new Lenis()` call to the app shell and have
this effect call `lenis.on("scroll", ScrollTrigger.update)` on the instance that already exists,
instead of constructing a second one that fights the first over the same wheel event.

The `ResizeObserver` watching the `<svg>` needs its own `disconnect()` in the same cleanup — it
isn't a GSAP object, so the context doesn't know it exists, and left running it keeps a reference
to the `<svg>` node alive, along with everything its callback closes over (`placeStops`,
`ScrollTrigger.refresh`), past the unmount:

```jsx
const ro = new ResizeObserver(() => { placeStops(); ScrollTrigger.refresh(); });
ro.observe(svg);
// cleanup, in addition to the above:
ro.disconnect();
```

Finally, `document.fonts?.ready.then(() => ScrollTrigger.refresh())` is a real gap — font loading
time depends on cache and network, easily long enough for a StrictMode unmount or a genuine
navigation away to land inside it. `ScrollTrigger.refresh()` is not scoped to this component: it
recalculates every trigger on the page, so a call landing after unmount runs against a layout that
has already lost `.track`'s contribution to the page's scroll height. Guard the continuation with
the same cancellation flag the cleanup sets:

```jsx
let cancelled = false;
document.fonts?.ready.then(() => {
  if (cancelled) return;
  ScrollTrigger.refresh();
});
return () => {
  cancelled = true;
  ro.disconnect();
  gsap.ticker.remove(pumpLenis);
  lenis.destroy();
  ctx.revert();
};
```

The `prefers-reduced-motion` branch needs none of this: it calls `advance(1)` and returns before
`Lenis`, the ticker, the trigger or the observer ever get created, so on that path there is simply
nothing for the cleanup above to do.
