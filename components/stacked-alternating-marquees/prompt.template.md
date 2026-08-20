---
slug: stacked-alternating-marquees
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Stacked Alternating Marquees — rows that run opposite ways and lean into the scroll

## Goal

Build a block of **four full-width marquee rows stacked with no gap**, running continuously in
**alternating directions**, with the palette inverting row to row — and with the whole block
**leaning into the scroll**: scrolling speeds each row up in its own direction, and the push
decays when you stop.

Use it for a list of categories or claims that are read at a glance. If the reader has to
actually read and compare the items, this is the wrong mechanic and a list is the right one.

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

**Do not use a CSS `@keyframes` marquee.** That is the whole reason this is hand-written: a CSS
animation runs on its own clock and cannot know the scroll exists, so the coupling below is
impossible. One `gsap.ticker` loop drives all four rows.

## Structure

```html
<section class="rows">
  <div class="row"     data-dir="1"  data-speed="26"><div class="strip">…</div></div>
  <div class="row inv" data-dir="-1" data-speed="34"><div class="strip">…</div></div>
  <div class="row"     data-dir="1"  data-speed="30"><div class="strip">…</div></div>
  <div class="row inv" data-dir="-1" data-speed="22"><div class="strip">…</div></div>
</section>
```

Each strip holds `<span>` labels and round `<img>` tiles interleaved. Direction and speed live on
the row as data attributes, so re-ordering rows in the HTML re-orders the motion with them.

## The four decisions that ARE this component

### 1. The speeds must NOT be multiples of each other.

`26 / 34 / 30 / 22`. With equal or harmonic speeds the rows re-align every few seconds and the eye
catches the repeat immediately. Near-coprime values keep the pattern from ever settling. This is
the single most noticeable difference between a marquee block that looks alive and one that looks
like a GIF.

### 2. Alternate the direction AND the colour.

Four rows running the same way read as one wide element sliding. Alternating the direction fixes
that — but at a glance the opposition is invisible unless the rows also invert:

```css
.row     { background: var(--cream); color: var(--ink);   }
.row.inv { background: var(--ink);   color: var(--cream); }
```

### 3. The loop wraps at half the MEASURED width, re-measured after images load.

Clone the strip's children once at runtime and wrap the transform at half the total:

```js
const copia = strip.cloneNode(true);
for (const c of [...copia.children]) {
  c.setAttribute("aria-hidden", "true");             // ON THE CHILDREN — see below
  strip.appendChild(c);
}
```

**The `aria-hidden` must go on the appended children, not on the cloned container.** Setting it on
`copia` reads correctly and does nothing at all: only `copia.children` are moved into the strip and
`copia` itself is thrown away, so the attribute never reaches the DOM and a screen reader still
announces every label twice. This component shipped with exactly that bug.

```js

const medir = () => { mitad = strip.scrollWidth / 2; };
medir();
addEventListener("load", medir);
document.fonts?.ready.then(medir);
```

**Re-measuring is not optional.** Images change the strip's width when they load; without it the
wrap point is computed against a width that no longer exists and the loop jumps visibly once per
cycle. Cloning in JS rather than in the markup keeps the HTML readable and keeps the duplicate out
of the accessibility tree.

### 4. The scroll PUSHES; it does not drive.

```js
let empuje = 0;
ScrollTrigger.create({
  trigger: document.body, start: "top top", end: "bottom bottom",
  onUpdate: (s) => { empuje = gsap.utils.clamp(-2.5, 2.5, s.getVelocity() / 900); },
});

gsap.ticker.add((_, dt) => {
  const seg = dt / 1000;
  for (const f of filas) {
    f.x -= f.dir * f.vel * seg * (1 + Math.abs(empuje)) + f.dir * empuje * 60 * seg;
    if (f.x <= -f.mitad) f.x += f.mitad;
    if (f.x >= 0)        f.x -= f.mitad;
    f.strip.style.transform = `translate3d(${f.x}px,0,0)`;
  }
});
gsap.ticker.add(() => { empuje *= 0.92; });   // ← the decay
```

The rows always move; the scroll only adds to it. **The decay is load-bearing**: without
`empuje *= 0.92` per frame, stopping the scroll leaves the rows racing at the last frame's
velocity for a long second, which reads as a bug.

Note this ScrollTrigger uses `document.body` end to end. It is a **global velocity reader**, not a
section animation — do not give it the section as trigger or the rows stop reacting once the block
leaves the viewport.

## Details

- `overflow: hidden` on the **row** (it is genuinely the window the strip runs behind, and it
  contains no sticky) but `overflow-x: clip` on the **section** (the usual reason).
- `will-change: transform` on the strip, `translate3d` in the write: four continuously animating
  full-width elements is exactly the case where the compositor hint pays for itself.
- With `line-height: 0.8` on the hero headline the glyphs **overflow their box** and invade the
  line above. Add `padding-block: 0.1em` or a QC pass will flag it as covered text, correctly.

## Reduced motion

Leave the strips still. The rows still read as a stack of categories, which is the information.
Note the measuring still runs — only the ticker is skipped.

## Adapting

Change the row count (three to five; six starts to read as noise), the labels, the tile shape, the
palette. Keep: non-harmonic speeds, alternating direction *and* colour, the re-measured wrap, the
`aria-hidden` clone, and the decaying scroll push.

## Adapting this to React

Everything above describes a standalone document: one script that runs once behind
`DOMContentLoaded`, mutates each strip's real DOM once to build the seamless loop, and never has
to undo any of it. React withdraws that guarantee, and it does it quietly — the component renders,
the rows scroll, and the failure shows up as a slow drift in the loop period rather than as an
error.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen, and that double invocation reuses the same `.strip` DOM nodes the first pass
already mutated — StrictMode re-runs the effect body, not the render that produced the markup.
Run the cloning step a second time against a strip that already carries its first clone and you
clone the doubled content, not the original: a loop meant to repeat every `mitad` pixels now
repeats every four widths, and doubles again on the next remount. Two `Lenis` instances also end
up pulling on the same wheel event, and two velocity-reading `ScrollTrigger`s end up feeding two
separate `empuje` closures into two competing `gsap.ticker` loops writing the same rows' `transform`
on every frame. None of it throws, none of it reproduces in a production build, and none of it
looks like a bug in the ten seconds most testing gives a marquee. Treat the cleanup as part of the
effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no `readyState` guard. That
event has already fired by the time a React component mounts, so this listener would simply never
run — no rows, no error, nothing to debug. Delete it and move everything from
`gsap.registerPlugin(ScrollTrigger)` down to the final `dataset.movimientoListo = "1"` write —
including the `reduce` check and its early return — into a `useEffect` with an empty dependency
array. `gsap.registerPlugin(ScrollTrigger)` itself belongs at module scope next to the imports;
re-registering it on every mount is harmless but pointless.

*(2) Element lookups* — `gsap.utils.toArray(".row")` and the `row.querySelector(".strip")` inside
its mapper both assume the document belongs to this component alone. Give `<section class="rows">`
a root `ref` and query from it instead —
`gsap.utils.toArray(rootRef.current.querySelectorAll(".row"))` — so that during the instant the
StrictMode remount has two copies of the section in the tree, the loop cannot bind to the `.row`
set that is on its way out.

*(3) Cleanup* — Nothing here builds a GSAP tween or timeline; the only thing a `gsap.context` on
the root ref has to track is the single `ScrollTrigger.create` call, so that is all `ctx.revert()`
will undo. Everything else this effect does — the cloned strip children, three independent
`gsap.ticker.add` subscriptions, the `Lenis` instance, the `load` listener, and the `fonts.ready`
continuation — is invisible to the context, because none of it is a tween, a timeline or a trigger:

```jsx
useEffect(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cancelled = false;
  const clones = [];

  const filas = gsap.utils.toArray(rootRef.current.querySelectorAll(".row")).map((row) => {
    const strip = row.querySelector(".strip");
    const copia = strip.cloneNode(true);
    const added = [...copia.children];
    for (const c of added) {
      c.setAttribute("aria-hidden", "true");
      strip.appendChild(c);
    }
    clones.push(added);
    return { strip, dir: +row.dataset.dir, vel: +row.dataset.speed, x: 0, mitad: 0 };
  });

  const medir = () => { if (!cancelled) filas.forEach((f) => { f.mitad = f.strip.scrollWidth / 2; }); };
  medir();
  window.addEventListener("load", medir);
  document.fonts?.ready.then(medir);

  if (reduce) {
    document.documentElement.dataset.movimientoListo = "1";
    return () => {
      cancelled = true;
      window.removeEventListener("load", medir);
      clones.forEach((added) => added.forEach((n) => n.remove()));
    };
  }

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  const driveLenis = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(driveLenis);
  gsap.ticker.lagSmoothing(0);

  let empuje = 0;
  const ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: document.body, start: "top top", end: "bottom bottom",
      onUpdate: (s) => { empuje = gsap.utils.clamp(-2.5, 2.5, s.getVelocity() / 900); },
    });
  }, rootRef);

  const tick = (_, dt) => { /* the per-row translate3d advance, unchanged from above */ };
  const decay = () => { empuje *= 0.92; };
  gsap.ticker.add(tick);
  gsap.ticker.add(decay);

  document.documentElement.dataset.movimientoListo = "1";

  return () => {
    cancelled = true;
    window.removeEventListener("load", medir);
    gsap.ticker.remove(driveLenis);
    gsap.ticker.remove(tick);
    gsap.ticker.remove(decay);
    gsap.ticker.lagSmoothing(500, 33); // GSAP's own default — restore it, don't just clear it
    ctx.revert();
    lenis.destroy();
    clones.forEach((added) => added.forEach((n) => n.remove()));
  };
}, []);
```

Three points this fragment exists to fix, each specific to what this script actually does:

- **The cloned children are the one mutation here that is neither a GSAP object nor a
  document-level singleton, and it is the one the revert cannot see.** `strip.appendChild(c)` is a
  plain DOM write. Track exactly the nodes each row's effect pass appended (`clones` above) and
  remove exactly those on cleanup. That is what stops the doubling described at the top of this
  section — re-querying `.strip` and cloning again without first removing the previous pass's
  children is how a StrictMode remount turns one repeat of the strip into four, permanently.
- **`ctx.revert()` does not reach the three `gsap.ticker.add` calls.** The context only unwinds
  tweens, timelines and triggers created during its synchronous factory pass; a ticker subscription
  is none of those. Keep the exact reference each call was given — `driveLenis`, `tick`, `decay` —
  and remove all three with `gsap.ticker.remove` in the same cleanup. Miss `driveLenis` and it goes
  on calling `lenis.raf` on an instance `destroy()` already tore down; miss `tick` and it goes on
  writing `transform` to `strip` elements a later mount no longer measures.
  `gsap.ticker.lagSmoothing(0)` is a global GSAP setting too, not scoped to this component — leaving
  it patched after unmount silently changes frame-drop behavior for every other GSAP animation on
  the page for the rest of the session, so restore GSAP's own default in the same cleanup rather
  than leaving the `0` in place.
- **The `reduce` branch changes what exists to clean up, not just what runs.** With
  `prefers-reduced-motion` set, the effect returns before `Lenis`, the `ScrollTrigger`, or any of
  the three ticker callbacks are created, so that branch's cleanup is only the `load` listener, the
  `fonts.ready` guard, and the clone removal. Calling `lenis.destroy()` or `ctx.revert()` from that
  path throws on a variable that was never assigned — the two returned cleanup functions above are
  not interchangeable. The `cancelled` flag guards `medir` itself against firing from a `fonts.ready`
  continuation that resolves after either kind of unmount and writing `mitad` onto rows a gone
  component no longer scrolls.

**Lenis** — this instance exists only to keep `ScrollTrigger.update` in step with the smoothed
scroll position; the row speed itself reads `getVelocity()` off `ScrollTrigger`, not off Lenis
directly. If this block is one section inside a page that already runs its own Lenis instance for
the rest of the scroll experience, do not construct a second one here — subscribe this component's
`ScrollTrigger.create` to the existing instance's `scroll` event the way the app shell already does,
and skip the `driveLenis` ticker call and `destroy()` entirely. Only own the instance, as the
fragment above does, when this component is the one place in the app responsible for smooth
scroll.
