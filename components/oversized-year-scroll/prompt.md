# Oversized Year, Counter-Scrolled — the date as scenery, not as data

## Goal

Build a timeline where each era is one full-height band, and each band carries an **enormous
four-digit year as a watermark behind its content** — drifting **against** the scroll while the
copy rises with it.

Use it when a story has dates and you want the year to register as *atmosphere*, not as a figure
in a table. If the reader needs to compare the dates against each other, this is the wrong
mechanic and a table is the right one.

## Tech

Vanilla HTML/CSS/JS with ES modules: `gsap` + `ScrollTrigger`, and `lenis`. No other plugins.

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
<section class="timeline">
  <article class="era">
    <b class="year" aria-hidden="true">1984</b>
    <div class="body">
      <img src="…" alt="" width="720" height="540">
      <div class="text"><p class="tag">The shed</p><p>…</p></div>
    </div>
  </article>
  <!-- ×3 -->
</section>
```

Three bands is the right count. Two reads as a before/after, five turns into a list and the
mechanic stops paying for the height it costs.

## The three decisions that ARE this component

### 1. The numeral is a watermark, not a heading.

```css
.year {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  font-size: clamp(11rem, 30vw, 26rem);
  color: rgba(36, 29, 23, 0.07);
  white-space: nowrap; pointer-events: none; user-select: none;
  z-index: 0;
}
```

`aria-hidden`, 7% opacity, behind everything, and **the readable date lives in the copy**. Put it
in front, or above 12% opacity, and it stops being atmosphere and starts competing with the
paragraph it is dating.

**The band has no heading element at all** — a `.tag` and a paragraph, nothing more. That is
deliberate and it is why the watermark works: the numeral is the only large thing in the band, so
it never has to win an argument with a headline. Add an `<h2>` and you have two display elements
fighting, and the year loses because it is the one at 7%.

### 2. It travels AGAINST the scroll — and the direction alternates.

```js
gsap.utils.toArray(".era").forEach((era, i) => {
  const dir = i % 2 ? -1 : 1;
  gsap.fromTo(era.querySelector(".year"),
    { xPercent: -50 - 16 * dir },
    { xPercent: -50 + 16 * dir, ease: "none",
      scrollTrigger: { trigger: era, start: "top bottom", end: "bottom top", scrub: 1, invalidateOnRefresh: true } });
});
```

Three things here, all load-bearing:

**`xPercent`, never `x`.** The numeral is enormous and its pixel width changes with the viewport,
so an offset that reads well at 1440 throws it clean off frame at 390. A percentage of its own
width is stable at every size.

**The sign alternates.** Three numerals drifting the same way read as one long background pan and
the effect disappears. Opposing directions is what makes each band feel like its own moment.

**The window is the band's FULL passage** — `top bottom` → `bottom top`. Anything shorter and the
numeral is still where it started at the exact moment the band is centred, which is when the
reader is looking at it. The travel has to be spent *while* the band crosses, not after.

### 3. The band clips horizontally.

```css
.era { position: relative; overflow-x: clip; }
```

The numeral is deliberately wider than the viewport and would otherwise lengthen the document and
produce horizontal scroll. `clip`, **not `hidden`** — `hidden` creates a scroll container and
breaks `position: sticky` on anything nested.

## The opposition needs something to oppose

The content must rise **with** the scroll, or the drift has nothing to work against and reads as
a wobble:

```js
gsap.from(era.querySelector(".body"), {
  y: 48, opacity: 0, duration: 0.9, ease: "power3.out",
  scrollTrigger: { trigger: era, start: "top 72%" },
});
```

Note this one is a plain entrance, not a scrub. Only the numeral is welded to the scroll; the
content arrives once and stays. Scrubbing both makes the whole band feel like it is sliding
around.

## Layout

Alternate the image/text sides band to band. The cheapest way is `direction: rtl` on the grid and
`direction: ltr` on its children — no second grid definition, no `order` juggling.

Below 760px collapse to one column, drop the alternation, and shrink the numeral to
`clamp(7rem, 38vw, 12rem)`.

## Reduced motion

Park every numeral centred (`transform: translate(-50%, -50%) !important`) and create no
triggers. The layout and the atmosphere survive; only the drift goes.

## Adapting

Change the palette, the type, the subject, the number of bands (three to four), the numeral
opacity within 5–10%. The mechanic is *a date used as ground rather than as figure* and it works
for anything with eras: a studio's history, a product's generations, a season's chapters. Keep:
`xPercent` not `x`, the alternating sign, the full-passage window, the watermark opacity, and
`overflow-x: clip` on the band.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the timeline renders, the bands look right for
a moment, and then the numerals drift wrong in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. Setup that runs twice with teardown that runs never leaves you two of
everything here: two `Lenis` instances both listening for the wheel and both feeding `lenis.raf`
from the ticker, and two scrub triggers per band fighting over the same `.year` element's
`xPercent`. The visible symptom is a numeral that stutters or snaps between two positions as the
band scrolls, and it will not reproduce in a production build, because React only does the double
mount in development. Treat the cleanup as part of the effect, not as an afterthought.

**(1) The entry point.** The script waits for `DOMContentLoaded`. By the time a React component
mounts, that event has already fired, so the listener is never called and nothing inside it ever
runs — not the reduced-motion check, not the `Lenis` instance, not the three per-era scrub
triggers. No error, nothing to debug, just three `.era` sections sitting inert with their numerals
wherever the CSS left them. Delete the listener and move its body into a `useEffect` with an empty
dependency array. The `prefers-reduced-motion` check stays exactly where it is, as the first line
of that effect, and its early `return` is why the cleanup below has to be conditional rather than
unconditional — see point (3).

**(2) Element lookups.** `gsap.utils.toArray(".era")` assumes it can walk the whole document; the
`era.querySelector(".year")` and `era.querySelector(".body")` calls inside the loop are already
scoped to the `era` element each iteration closes over, so those two are fine as written. Give the
component a root ref on the `<section class="timeline">`, and collect the bands from that ref
instead of the bare string — `gsap.utils.toArray(rootRef.current.querySelectorAll(".era"))`. During
the StrictMode remount two copies of `.timeline` exist for an instant, and an unscoped `toArray`
call will bind a scrub trigger to the copy that's already on its way out.

**(3) Cleanup.** Wrap the `Lenis` setup, the ticker subscription, and the per-era loop — both the
counter-scrolled numeral and the rising `.body` entrance — in one `gsap.context` scoped to the
root ref, and revert it in the cleanup:

```jsx
useEffect(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { /* park every numeral centred, no triggers, no cleanup needed */ return; }

  const lenis = new Lenis();
  const onLenisScroll = () => ScrollTrigger.update();
  lenis.on("scroll", onLenisScroll);
  const tick = (t) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const ctx = gsap.context(() => {
    /* the era.forEach loop — the alternating xPercent tween and the .body entrance — exactly as above */
  }, rootRef);

  return () => {
    ctx.revert();
    gsap.ticker.remove(tick);
    lenis.off("scroll", onLenisScroll);
    lenis.destroy();
  };
}, []);
```

Four things in that teardown are load-bearing, and reverting only the context leaves three of them
running:

- The context is what undoes the alternating `fromTo` on each `.year` and its scrub trigger, plus
  the entrance tween on each `.body`. Skip the revert and the StrictMode remount leaves a second
  scrub trigger per band disagreeing with the first about where the numeral should be.
- **The ticker sits outside the context.** This component has no `requestAnimationFrame` loop of
  its own — `gsap.ticker.add((t) => lenis.raf(t * 1000))` *is* the loop that drives smooth scroll,
  and `ctx.revert()` does not know about it. Keep the function reference (`tick` above) and call
  `gsap.ticker.remove` on that same reference. Without it, the remounted instance's ticker keeps
  calling `raf` on a `Lenis` instance the very next line is about to destroy.
- **`Lenis` is a document-level resource.** `lenis.on("scroll", ScrollTrigger.update)` is the line
  that keeps the smooth-scrolled position and `ScrollTrigger`'s reading of it in step; take that
  subscription off before `destroy()`, using the same named reference you registered it with — an
  inline arrow at registration time can't be removed later. If this timeline ends up embedded in a
  larger page rather than owning the whole document, lift the `Lenis` instance to the app shell and
  have this effect subscribe to the existing one instead of constructing its own.
- **The reduced-motion branch means the cleanup can't assume any of this was built.** When `reduce`
  is true the effect returns before `lenis` or `ctx` exist, so a cleanup that unconditionally calls
  `ctx.revert()` and `lenis.destroy()` throws on that path. Return the matching no-op cleanup from
  the early branch, or hold `lenis` and `ctx` in variables declared before the branch and guard each
  teardown call on whether it actually got assigned.

One more asynchronous edge, separate from mount/unmount timing: `document.fonts.ready.then(() =>
ScrollTrigger.refresh())` can resolve after a StrictMode unmount has already reverted the context.
At that point the refresh is wasted work at best — walking triggers this instance no longer owns —
and if this timeline is one section among several on the page, it refreshes everyone else's
triggers on behalf of an instance that's already gone. Guard the continuation with a `cancelled`
flag the same cleanup flips:

```jsx
let cancelled = false;
document.fonts?.ready.then(() => { if (!cancelled) ScrollTrigger.refresh(); });
return () => {
  cancelled = true;
  /* ...the rest of the teardown above */
};
```
