# Exploded Product with Leader Labels — the object comes apart and names its own pieces

## Goal

Build a pinned stage where a layered product **separates along Z as you scroll**, and each part
names itself with a hairline leader running back to the stack.

Use it when the argument is *what the thing is made of*. A named exploded view beats a bullet list
of features because the reader can see the relationship between the parts, not just their names.

## Tech

Vanilla HTML/CSS/JS with ES modules: `gsap` + `ScrollTrigger`, and `lenis`.

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

**The layers are CSS, not a photograph.** A photo of a product cannot come apart. Six flat
ellipses in a shallow `rotateX` read as a stack the moment they separate.

## Structure

```html
<div class="stack">
  <i class="layer" data-i="0" style="--tone:#f5f2ec"></i>   <!-- bone -->
  <i class="layer" data-i="1" style="--tone:#f26430"></i>   <!-- the one orange, mid-stack -->
  <i class="layer" data-i="2" style="--tone:#6d82a6"></i>
  <i class="layer" data-i="3" style="--tone:#a9c1d9"></i>
  <i class="layer" data-i="4" style="--tone:#3d5178"></i>
  <i class="layer" data-i="5" style="--tone:#f5f2ec"></i>
</div>
<ul class="notes left">
  <li data-for="0"><b>Top plate</b><span>Milled aluminium, 0.8 mm</span></li>
  <li data-for="2"><b>Shutter</b><span>Leaf type, near silent</span></li>
  <li data-for="4"><b>Sensor</b><span>The part the rest serves</span></li>
</ul>
<ul class="notes right">
  <li data-for="1"><b>Lens ring</b><span>Knurled brass, focus by feel</span></li>
  <li data-for="3"><b>Body shell</b><span>Magnesium, wrapped in grip</span></li>
  <li data-for="5"><b>Base plate</b><span>Cast from recycled stock</span></li>
</ul>
```

## The four decisions that ARE this component

### 1. The label is bound to the LAYER, never to a position.

`data-for` on the label points at `data-i` on the layer, and **both** the label's vertical
position and the leader's width are computed from that layer's live bounding box every frame.

Hand-placing labels works exactly until somebody adds a seventh part or swaps two — and then every
name points at the wrong thing. **A wrong label is worse than no label**, because it still looks
authoritative.

### 2. The separation is staggered per layer, not uniform.

```js
const desde = (i / n) * 0.34;                       // each layer gets its own slice
const t = gsap.utils.clamp(0, 1, (p - desde) / 0.52);
const eased = 1 - Math.pow(1 - t, 3);
gsap.set(layer, { z: ((n - 1) / 2 - i) * SEP() * (0.22 + 0.78 * eased) });   // i=0 ends up ON TOP
```

Move all six at the same rate and they stay evenly spaced the whole way — the object never reads
as *coming apart*, only as *getting taller*. Giving each layer its own slice makes them peel off
one after another, which is the thing worth watching.

**The `0.22 +` is a resting separation.** With the layers exactly coincident at rest the object
reads as one small ellipse and there is nothing to suggest it opens — a QC pass flagged that
screen as 0.2% painted, correctly.

### 3. The leader stops at the edge of the STACK, not at its own layer.

```js
const hasta = lista.classList.contains("left")
  ? cajaStack.left - cajaLista.right
  : cajaLista.left - cajaStack.right;
```

If each leader chased its own layer, its length would breathe with the separation and the whole
diagram would read as nervous. Anchoring every leader to the stack's edge keeps the column of
labels calm while the object moves.

### 4. De-collide the labels within each column.

When two layers end up close, their labels overlap and one hides the other — in a diagram that is
worse than a misplaced name, because it simply cannot be read.

`MIN_GAP` is **54px** — a little more than a two-line label — and the labels alternate columns by
index (0, 2, 4 left; 1, 3, 5 right).

```js
for (const col of Object.values(byColumn)) {
  col.sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top));
  for (let i = 1; i < col.length; i++) {
    const prev = parseFloat(col[i - 1].style.top);
    if (parseFloat(col[i].style.top) - prev < MIN_GAP) col[i].style.top = `${prev + MIN_GAP}px`;
  }
}
```

The label moves; the leader still points at its layer. That asymmetry is the point — the anchor is
truth, the label position is negotiable.

## Give the layers a gradient, not a flat colour

```css
background: linear-gradient(145deg,
  color-mix(in srgb, var(--tone) 82%, white) 0%,
  var(--tone) 46%,
  color-mix(in srgb, var(--tone) 72%, black) 100%);
```

Visually: a flat ellipse reads as a paper disc; a sweep of light reads as a machined part.

And a method note worth knowing: a QC pass that counts "painted" blocks as *text, media or
`background-image`* does **not** count a `background-color`. A scene made only of CSS shapes comes
back as an empty screen. A gradient *is* a background-image, so here the aesthetic fix and the
metric fix are the same edit.

### 5. `perspective` on the stage is not decoration — without it there is no exploded view.

`perspective` must sit on the **direct** parent of the transformed element. Slip a wrapper between
`.stage` and `.stack` without giving it `transform-style: preserve-3d` and the perspective dies
silently: everything still moves, nothing foreshortens, and there is no error anywhere.

```css
.stage { perspective: 1400px; perspective-origin: 50% 42%; }
.stack { transform: translateY(var(--lift, 0px)) rotateX(46deg); }
```

`translateZ` inside a `preserve-3d` context still *moves* things without a perspective on an
ancestor, but with no foreshortening: every layer stays the same size, so the stack reads as
sliding rather than as parts pulling apart in depth. With perspective the near layer grows and the
far one shrinks, and that size difference is what the eye reads as separation.

Two numbers that follow from it:

**The separation is a fraction of the object, not a constant.** `stack.offsetWidth / 3.4`. A fixed
26 px looked reasonable while writing it and produced a stack that was still a closed puck at the
end of the scroll. And the on-screen travel is always *less* than the number written — with
`rotateX(46deg)` the vertical displacement is `z·sin(46°) ≈ 0.72·z`.

**Mind the sign.** `data-i=0` is the lid, so it has to finish at the top of the stack:
`((n-1)/2 - i)`, not `(i - (n-1)/2)`. Flip it and the object comes apart upside down — which still
looks like an exploded view until somebody reads the labels.

**Perspective magnification drags the centroid down**, because the near layers grow and fall. Left
alone, the finished diagram sits on the bottom edge with an empty upper half. Measure the layers'
union box against the stage and correct it into `--lift` — applied *before* the `rotateX`, so one
screen pixel of lift is one pixel of correction and a single pass converges.

## Also

- Keep the tilt shallow-ish (`rotateX(46deg)`). Push past ~60° and the ellipses close into rings and
  the object stops reading as a stack of flat parts; go much below 40° and the layers overlap each
  other and the separation is hidden.
- **Alternate light and dark tones down the stack.** Six variations of one tone on a dark stage is
  six invisible layers — the first pass had exactly that and the object looked like a single disc
  no matter how far it opened. The demo alternates bone against navy blues and puts the single
  orange mid-stack, so the eye can count the parts.
- `ResizeObserver` on the stack, not the `resize` event: the stack's box changes when fonts land.
- On mobile drop the label descriptions and keep the names — the name is the data.

## Reduced motion

Show the object already apart with every label and leader up, and collapse the track to
`min-height: 0`. The diagram reads in full, which is the information.

## Adapting

Change the part count (four to seven; beyond seven the labels crowd whatever you do), the tones,
the perspective angle, the subject — a shoe, a lamp, a sandwich, a battery. Keep: `data-for`
binding, the staggered slices, the resting separation, leaders anchored to the stack, and the
de-collision pass.

## Adapting this to React

Everything above describes a standalone document: one script that waits for the page to finish
loading, reaches into it with `document.querySelector` and `gsap.utils.toArray`, and never has to
undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the
stack renders, the layers separate for a moment, and then it misbehaves in a way that does not
point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. Setup that runs twice with teardown that runs never leaves you two of
everything here: two `ScrollTrigger`s both scrubbing `z` on the same six `.layer` elements from two
different `progress` reads, two `Lenis` instances both feeding `ScrollTrigger.update` off the same
wheel event, and two `ResizeObserver`s both calling `place()` on the same `.stack`. The visible
symptom is layers jittering between two z-stacks, or leader lines snapping between two lengths as
two copies of `place()` fight over the same `--leader` custom property, and it will not reproduce
in a production build, because React only does the double mount in development. Treat the cleanup
as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component
mounts, that event has already fired, so the listener is never called and the diagram never
explodes — no error, nothing to debug, just six flat ellipses sitting there forever. Delete the
listener and move its body — the `.layer`/`.notes li` lookups, `stack`/`bar`, the
`prefers-reduced-motion` check, `place`, `explode`, the conditional `Lenis` + ticker +
`ScrollTrigger.create` block, the `ResizeObserver`, and the `document.fonts.ready` call — into a
`useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` is the one line
that moves to module scope instead, outside the component: registering it on every mount is
harmless but pointless.

*(2) Element lookups* — `gsap.utils.toArray(".layer")`, `gsap.utils.toArray(".notes li")`,
`document.querySelector(".stack")`, `.progress i`, and the `.track` trigger target are all
unscoped, which assumes this component owns the document. Give the section a root ref, render
`.stack`, both `.notes` lists, `.track`, and `.progress` underneath it, and resolve every one of
those off the ref instead of off `document`. During the StrictMode remount two copies of this
markup exist for an instant; an unscoped `gsap.utils.toArray(".layer")` can hand `explode()` the
six layers that are on their way out, and the `data-for`/`data-i` binding — the whole mechanism
this component exists to demonstrate — ends up placing labels against elements that are already
gone.

*(3) Cleanup* — Wrap the lookups, `place`, `explode`, and the conditional `ScrollTrigger.create` in
one `gsap.context` scoped to the root ref. Keep the `Lenis` instance, its ticker function, the
`ResizeObserver`, and a cancellation flag for the `fonts.ready` continuation as plain variables
outside that context — none of those four is a tween or a trigger, so the context has nothing to
track them by:

```jsx
useEffect(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cancelled = false;
  let lenis = null;
  let raf = null;
  let observer = null;

  const ctx = gsap.context(() => {
    const layers = gsap.utils.toArray(".layer", rootRef.current);
    const labels = gsap.utils.toArray(".notes li", rootRef.current);
    const stack = rootRef.current.querySelector(".stack");
    const bar = rootRef.current.querySelector(".progress i");
    const place = () => { /* exactly as above, closing over stack/labels/layers */ };
    const explode = (p) => { /* exactly as above, ending in a call to place() */ };

    if (reduce) { explode(1); return; }

    lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    raf = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    explode(0);
    ScrollTrigger.create({
      trigger: rootRef.current.querySelector(".track"),
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => explode(s.progress),
      onRefresh: (s) => explode(s.progress),
      invalidateOnRefresh: true,
    });

    if (window.ResizeObserver) {
      observer = new ResizeObserver(place);
      observer.observe(stack);
    }
    document.fonts?.ready.then(() => { if (!cancelled) ScrollTrigger.refresh(); });
  }, rootRef);

  return () => {
    cancelled = true;
    observer?.disconnect();
    if (raf) gsap.ticker.remove(raf);
    lenis?.off("scroll", ScrollTrigger.update);
    lenis?.destroy();
    ctx.revert();
  };
}, []);
```

Five things in that teardown are load-bearing on their own:

- **The reduced-motion branch never builds `Lenis`, the trigger, or the observer.** The original
  script's early `return` after `explode(1)` means that path has nothing for three quarters of this
  cleanup to undo. `lenis`, `raf`, and `observer` start `null` and stay `null` there, so the
  optional-chained calls above become no-ops instead of throwing on a `null` receiver — do not
  assume the four resources are always created together, or a `matchMedia` check on a
  reduced-motion visitor will crash the unmount of every other visitor's mount too, once the
  branches get merged carelessly.
- **The ticker sits outside the context.** This component has no `requestAnimationFrame` loop of
  its own — `gsap.ticker.add(raf)` *is* the loop that turns GSAP's clock into `lenis.raf`, and
  `ctx.revert()` does not know about it. Keep the exact `raf` reference and remove it explicitly, or
  the first mount's ticker keeps calling `lenis.raf` on a `Lenis` instance the very next line
  destroys.
- **`Lenis` here takes the whole page's wheel** — `new Lenis()` is constructed with no target. If
  this exploded view ends up as one section among several on a longer page, lift the instance to
  the app shell and have this effect drive `ScrollTrigger.update` off the existing instance instead;
  two `Lenis`es each claiming the same wheel event fight each other on every scroll tick, not just
  during the StrictMode double-mount.
- **The `document.fonts.ready` continuation can fire after the unmount.** It calls the global
  `ScrollTrigger.refresh()`, not a method scoped to this component's own trigger, so nothing stops
  it from running against a page that no longer has this trigger — or, if the route was revisited
  quickly, against a different mounted copy's trigger, forcing a recalculation of `top`/`bottom`
  bounds that copy never asked for. Guard the continuation with the same `cancelled` flag the
  cleanup sets.
- **The context is what undoes the trigger, and with it, the `data-for` wiring.** `ctx.revert()`
  kills the single `ScrollTrigger.create` instance, which is what stops `onUpdate`/`onRefresh` from
  calling `explode()` — and therefore `gsap.set`ting `z` on six layers and `opacity`/`x` on their
  labels — against a fiber that no longer exists. Neither `place` nor `explode` needs `self.add`:
  nothing here registers a context method for a click handler to call later, the way a
  hover-triggered or click-triggered animation would. `onUpdate` and `onRefresh` call `explode`
  directly, and both run inside the one trigger the context already owns.
