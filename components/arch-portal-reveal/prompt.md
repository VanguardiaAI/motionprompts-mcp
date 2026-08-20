# Arch Portal Reveal — a doorway that grows until it is the whole frame

## Goal

Build a pinned stage where an **arch-shaped opening grows from a doorway to the full viewport** as
you scroll, revealing the scene behind it. The scene does not move, does not scale, does not
reframe: only the opening changes size.

Use it as a transition into a place — an interior, an exhibition, a chapter that is somewhere
*else*. The mechanic is literally walking through a door, so it pays for its height only when the
thing on the other side is worth arriving at.

## Tech

Vanilla HTML/CSS/JS with ES modules: `gsap` + `ScrollTrigger`, and `lenis`. No plugins beyond
ScrollTrigger.

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

## Structure

```html
<section class="gate">
  <div class="track">              <!-- tall: 260svh -->
    <div class="stage">            <!-- sticky, 100svh, overflow hidden -->
      <div class="reveal">         <!-- THE OPENING — this is what grows -->
        <div class="scene">        <!-- 100vw × 100svh, never changes size -->
          <img src="…" alt="" width="900" height="1200">
          <div class="scene-copy">…</div>
        </div>
      </div>
    </div>
  </div>
</section>
```

Two nested boxes and nothing else. The whole component is the relationship between them.

## The four decisions that ARE this component

### 1. The opening grows. The scene never does.

This is the entire trick, and it is the one thing that separates this from a zoom.

```css
.reveal { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%);
          width: var(--w); height: var(--h); overflow: hidden; }
.scene  { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%);
          width: 100vw; height: 100svh; }
```

The obvious implementation animates `scale` on a container. Everything inside scales with it: the
headline balloons, the photograph loses its crop, and the result reads as pushing in with a camera
— not as an opening widening in front of you.

Growing `--w` / `--h` on a box with `overflow: hidden`, while the content keeps its own
viewport-sized box, is what makes it read as a door. **You are revealing more of a fixed thing,
not enlarging a small thing.**

### 2. Both boxes anchor to the SAME point: bottom centre.

`left: 50%; bottom: 0; transform: translateX(-50%)` on both. If the scene is centred in its parent
instead, it drifts as the parent grows — a slow slide that nobody can name but everybody notices,
and it destroys the illusion that you are looking through a stationary opening. Sharing the anchor
means the scene sits still in viewport coordinates for the whole travel.

### 3. The corner radius falls FASTER than the box grows.

```js
const narrow = () => innerWidth < 760;
const open = (p) => {
  const w0 = narrow() ? 58 : 26;          // starting width  in vw
  const h0 = narrow() ? 28 : 34;          // starting height in svh
  reveal.style.setProperty("--w", `${w0 + (100 - w0) * p}vw`);
  reveal.style.setProperty("--h", `${h0 + (100 - h0) * p}svh`);
  reveal.style.setProperty("--r", `${50 * Math.pow(1 - p, 1.9)}%`);   // <- its own curve
};
```

**The door starts at 26vw × 34svh on desktop and 58vw × 28svh below 760px.** The CSS declares the
same pair as the initial `--w` / `--h` so the first paint is correct before any script runs; the JS
recomputes `w0`/`h0` on every call, which is why a resize across the breakpoint is picked up (the
trigger's `onRefresh` fires `open()` again). Those two numbers living in two files is the one piece
of duplication here — if you change one, change the other.

Width and height are linear; the radius is not. Animate the radius linearly and the shape spends
most of the scroll as a lozenge and is only recognisably an arch in the first few percent — which
is the part nobody is looking at yet. The `1.9` exponent pulls the radius down ahead of the box, so
the silhouette is unmistakably an arch through the first third and has squared off by the time it
fills the frame.

The arch is `border-radius`, **not `clip-path`**: a true curve with no facets, and two numbers to
animate instead of a polygon whose vertex count has to stay constant across states.

```css
border-radius: var(--r) var(--r) 0 0 / calc(var(--r) * 0.9) calc(var(--r) * 0.9) 0 0;
```

The two-axis form (`/`) is what makes it a doorway rather than a semicircle — the vertical radius
is slightly shorter than the horizontal one, which is the proportion of an actual arched opening.

### 4. No `scrub`. Write on every update.

```js
ScrollTrigger.create({
  trigger: ".track", start: "top top", end: "bottom bottom",
  onUpdate: (s) => open(s.progress),
  onRefresh: (s) => open(s.progress),
  invalidateOnRefresh: true,
});
```

Lenis already smooths the scroll. A `scrub` on top of it inserts a second lag, and the door visibly
trails the wheel — on a mechanic this literal, that lag reads as the page being slow rather than as
easing. `onRefresh` matters as much as `onUpdate`: without it a resize or a late font leaves the
door at whatever size it happened to have.

## Pacing

`min-height: 260svh` on the track — 160svh of actual travel with the stage pinned. That is the only
number that controls the pace, so put it somewhere obvious. Below ~200svh the door snaps open
before the reader has registered there is a door.

## Responsive

The starting size has to change, not just shrink with the units:

```css
@media (max-width: 760px) { .reveal { --w: 58vw; --h: 28svh; } }
```

26vw on a phone is a slot, not a doorway — too narrow to show that there is a scene behind it. And
the scene collapses to one column with a shorter image, because it must be readable at every width
including the very first frame, when only a sliver of it is visible.

## Reduced motion

Open the door and leave it open:

```css
@media (prefers-reduced-motion: reduce) {
  .track { min-height: 0; }
  .stage { position: static; height: auto; }
  .reveal { --w: 100vw !important; --h: 100svh !important; --r: 0% !important; }
}
```

Bail out of the JS before creating any trigger. Collapsing the track matters — otherwise there are
260svh of empty scrolling after a scene that is already fully visible.

## Adapting

Change the palette, the type, the subject, the arch proportion (the `0.9` vertical ratio), the
radius exponent within roughly 1.5–2.5, the travel height. The mechanic is *an opening that grows
around a stationary scene* and it works for any arrival: a building interior, a garden, a
storefront, a chapter break.

Keep: the two boxes sharing a bottom-centre anchor, the scene at fixed viewport size, the radius on
its own faster curve, `border-radius` rather than `clip-path`, and no `scrub`.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page
with `document.querySelector`, and never has to undo itself. React withdraws all three of those
guarantees at once, and it does it quietly — the door still opens correctly on first load, and the
damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. This component's whole mechanic lives in one closure — `open(p)`, which writes
`--w`, `--h` and `--r` straight onto `.reveal` — driven by a single `ScrollTrigger` bound to
`.track`, itself driven by a single `Lenis` instance ticking through `gsap.ticker.add`. A double
mount that doesn't undo all of it leaves two `Lenis` instances fighting over the same wheel and
touch events — Lenis owns document-level scroll, not a scoped element — and, because
`gsap.ticker.add` is never undone by anything short of an explicit `remove`, a ticker permanently
carrying two `raf` callbacks, one of them driving a `Lenis` instance whose section no longer
exists. The visible symptom on a real remount is scroll that feels doubled or fights itself; on a
StrictMode double-invoke it is two triggers both computing `--w`/`--h`/`--r` from a `.track`
progress each thinks it alone owns. None of this reproduces in a production build, because React
only does the double mount in development. Treat the cleanup as part of the effect, not as an
afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component
mounts, that event has already fired, so the listener is never called and the door never opens —
no error, nothing in the console. Delete the `document.addEventListener("DOMContentLoaded", …)`
wrapper and move its body — the reduced-motion check, the `Lenis` construction, the `open()`
closure, and the `ScrollTrigger.create` call — directly inside a `useEffect` with an empty
dependency array. `gsap.registerPlugin(ScrollTrigger)` can move to module scope; re-registering it
on every mount is harmless but pointless.

*(2) Element lookups* — `document.querySelector(".reveal")` assumes there is exactly one `.reveal`
in the whole document. Give the component a root ref on the section wrapping `.track`, and resolve
`.reveal` from it instead. During the StrictMode remount, two copies of `.track`/`.stage`/`.reveal`
exist for an instant, and an unscoped lookup binds to whichever copy `querySelector` returns first
— often the one on its way out — so `open()` spends the rest of the scroll writing
`--w`/`--h`/`--r` onto a node that is about to be detached, while the live copy never advances past
the opening size the CSS default (`26vw` / `34svh` / `50%`) already gave it.

*(3) Cleanup* — Wrap the `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref,
and revert it on cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // the open() closure and ScrollTrigger.create exactly as above
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills the one `ScrollTrigger` this component creates and strips the inline
`--w`/`--h`/`--r` it wrote onto `.reveal`, so the node falls back to whatever the CSS declares. It
does **not** touch `gsap.ticker.add((t) => lenis.raf(t * 1000))` or the `Lenis` instance itself —
neither is a tween or a trigger, so the context never records them. Keep the exact function
reference passed to `gsap.ticker.add` and remove it in the same cleanup, and destroy `lenis`
alongside it, ticker first:

```jsx
const onTick = (t) => lenis.raf(t * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
return () => {
  gsap.ticker.remove(onTick);
  lenis.destroy();
  ctx.revert();
};
```

Get the order wrong — destroy `lenis` while `onTick` is still registered — and any ticker frame
landing between the two calls invokes `.raf()` on an instance that no longer exists.

Lenis is a document-level resource, and a door this literal is the kind of section that plausibly
ships inside a larger page. If so, lift the `new Lenis()` call to the app shell and have this
effect subscribe `lenis.on("scroll", ScrollTrigger.update)` on the shared instance rather than
construct a second one that fights the first over the same wheel event. If this door genuinely owns
scroll for the whole page, construct and destroy it exactly as shown above.

Two things this effect does *not* need in the port, worth naming so they don't get added by habit:
the `.stage` pin is `position: sticky` in CSS, not `ScrollTrigger`'s `pin: true` — there is no
pin-spacer for `ctx.revert()` to remove, and none should be introduced. And the resize handling
that lets `narrow()` pick up a crossed breakpoint already comes from `ScrollTrigger`'s own resize
listener, which calls `onRefresh` — and `onRefresh` calls `open()` again. No separate `resize`
listener needs porting.

One asynchronous continuation remains: `document.fonts.ready.then(() => ScrollTrigger.refresh())`.
`fonts.ready` can resolve after a StrictMode unmount, or after a real navigation away, and the
`.then()` callback would then call `refresh()` on a `ScrollTrigger` that `ctx.revert()` has already
killed. Guard it with the same cancellation flag the cleanup sets:

```jsx
useEffect(() => {
  let cancelled = false;
  const ctx = gsap.context(() => {
    // open() and ScrollTrigger.create
  }, rootRef);
  document.fonts?.ready.then(() => {
    if (cancelled) return;
    ScrollTrigger.refresh();
  });
  return () => {
    cancelled = true;
    gsap.ticker.remove(onTick);
    lenis.destroy();
    ctx.revert();
  };
}, []);
```

The reduced-motion branch needs no cleanup of its own: it returns before constructing `Lenis` or
creating the `ScrollTrigger`, so on that path the effect has nothing to tear down — CSS alone holds
the door fully open.
