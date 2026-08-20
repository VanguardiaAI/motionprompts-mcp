---
slug: anchored-headline-speech-bubbles
native_system: reveal-on-enter
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 1
structural_literals: 3
structural:
  - { kind: ease, literal: "\"back.out(1.9)\"", rule: ease/overshoot }
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Anchored Headline with Speech Bubbles — testimonials that arrive around a pinned statement

## Goal

Build a testimonial section where **a short, loud headline pins itself to the middle of the
screen** and **individual quotes arrive around it, one at a time, out of the left and right
margins**, as you scroll through a deliberately over-tall track. Scroll back up and the field
empties again.

No carousel, no arrows, no dots. Nothing to click. The reader gets the statement, the voices
accumulate around it while they read it, and then it is over.

## Tech

Vanilla HTML/CSS/JS with ES module imports: `gsap` plus the `ScrollTrigger` plugin, and `lenis`
for smooth scroll. No other plugins, no framework.

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

## Layout

```html
<section class="voices">
  <div class="track">
    <h2 class="shout">They order<br>they bite<br>they come back.</h2>

    <figure class="bubble"       style="--x: 2%;  --y: 14%"> … </figure>
    <figure class="bubble right" style="--x: 74%; --y: 24%"> … </figure>
    <figure class="bubble"       style="--x: 3%;  --y: 56%"> … </figure>
    <figure class="bubble right" style="--x: 75%; --y: 66%"> … </figure>
    <figure class="bubble"       style="--x: 4%;  --y: 84%"> … </figure>
  </div>
</section>
```

Each `<figure>` holds a `<blockquote>` and a `<figcaption>` with a round avatar, a name and a
short qualifier ("since 2021", "Ruzafa", "with kids"). Five is the right number: three reads
thin, seven overruns the track.

## The four decisions that ARE this component

### 1. The track needs top padding, or the headline straddles the section boundary.

A sticky element renders at its **static** position until it sticks, and that position is the top
of the track. So `transform: translateY(-50%)` pulls half the headline up over the **previous**
section, and the first thing the reader sees is a line of type sliced in half across a colour
change. Push the static position deep inside the section:

```css
.track { min-height: 175svh; padding-top: 50svh; }
```

Measured on the live demo. It is invisible in code review and unmistakable on screen.

### 2. Position the bubbles with `top`, never with `bottom`.

This is a measured bug, not a preference. Anchored with `bottom`, a bubble sits relative to the
end of a 175svh track — and when the headline is pinned at the vertical centre of the viewport,
that point is **off-screen below**. The bubble animates perfectly and nobody ever sees it.

Everything is positioned in **percentages of the track**, via `--x` / `--y`, because that is the
same space the scroll traverses.

```css
.bubble { position: absolute; left: var(--x); top: var(--y); }
```

### 3. Bubbles live in the margins. They never cover the headline.

The headline is the anchor and has to stay readable for the whole section. Their width and `--x` are computed
**against the headline**: with the headline capped at `620px` and centred, each margin measures
`(100vw − 620px) / 2` — 330px at 1440, so a 260px bubble clears it. The first build used
`min(280px, 30vw)` with `--x: 62%` and the right-hand bubble invaded the headline by 126px. If a
bubble covers the headline the section has lost its anchor and becomes a pile of cards.

Give the headline `pointer-events: none` so text in the bubbles behind it stays selectable.

### 4. `overflow-x: clip` on the section — never `hidden`.

`hidden` creates a scroll container and **kills the `position: sticky` on the headline**, which
is the entire mechanism. `clip` does the same visual job without creating one.

## Motion

**One ScrollTrigger per bubble, fired by the bubble's own position** — not by an index-based
delay:

```js
gsap.fromTo(bubble,
  { opacity: 0, x: fromRight ? 40 : -40, y: 18, rotate: tilt * 2, scale: 0.9 },
  { opacity: 1, x: 0, y: 0, rotate: tilt, scale: 1,
    duration: {{motion.duration.base}}, ease: "back.out(1.9)",
    scrollTrigger: { trigger: bubble, start: "top 78%",
                     toggleActions: "play none none reverse", invalidateOnRefresh: true } });
```

Because each bubble triggers on **its own** `--y`, the stagger falls out of the layout for free:
move a bubble in the HTML and its arrival time moves with it. The visual order and the temporal
order are the same datum, so they can never drift apart.

**Enter from the side you live on.** A bubble that rises from below reads as one more card. A
bubble that comes in from the edge reads as somebody leaning in. Sign the `x` offset and the
rotation off the bubble's column.

**`ease: "back.out(1.9)"`** — the one place in this component where the ease is not the page
system's. A testimonial that lands on `power2.out` reads as a block of text appearing; it needs
the small overshoot of something being set down.

**`toggleActions: "play none none reverse"` — the field empties on the way up.** This is a
behaviour decision, not an oversight. A testimonial that stays put turns the section into a
heap the second time the reader passes through it.

**The headline cedes focus without leaving:**

```js
gsap.to(".shout", { opacity: 0.55, ease: "none",
  scrollTrigger: { trigger: track, start: "top top", end: "bottom bottom", scrub: 0.8 } });
```

## Tuning the rhythm — one number

```css
.track { min-height: 175svh; padding-top: 50svh; }
```

The **surplus** height is the distribution: 50svh of padding keeps the headline off the boundary
(decision 1) and the rest is the travel the five bubbles share. More height → arrivals further apart;
less → they pile up. This is the only number you need to touch to change the pacing.

## Responsive

Below 760px there are no margins to put anything in. Stop the bubbles floating, stack them under
the headline, move the headline to `top: 14%` with no translate, drop the padding, and
**lengthen the track to ~210svh** so they still arrive one at a time rather than all at once.

## Reduced motion

Show every bubble, create no triggers. The section still reads completely — that is the test.

```css
@media (prefers-reduced-motion: reduce) { .bubble { opacity: 1 !important; transform: none !important; } }
```

## Adapting

The mechanic is *statement pinned, evidence accumulating around it*, and it is not only for
reviews: it works for press quotes, awards, community messages, or anything where the point is
that **many people say this** rather than what any one of them says. Change the palette, the
bubble shape, the avatar treatment (give the `<img>` explicit width/height so a late-loading face does not reflow the caption and make every bubble jump), the copy, the count (four to six). Keep: positioning by
`top`/track percentage, the margins staying clear of the headline, `overflow-x: clip`, per-bubble
triggers, entry from the owning side, and the reverse on the way up.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`,
bails immediately under `prefers-reduced-motion`, otherwise constructs one `Lenis` instance,
drives it from `gsap.ticker.add`, builds one `ScrollTrigger` per `.bubble` keyed to that bubble's
own `--y` position inside `.track`, adds a single scrubbed opacity tween on `.shout`, and finally
waits on `document.fonts.ready` to call `ScrollTrigger.refresh()`. React withdraws the guarantees
this relies on — a document that is already parsed before the script runs, selectors that only
ever match one thing, a script body that only ever executes once — and it withdraws them quietly:
the headline pins and the five bubbles arrive correctly on first load, and the damage only shows
up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. By the time that first unmount can land, this component has already built five
bubble triggers, one scrub trigger on `.shout`, one `Lenis` instance and one `gsap.ticker`
subscription, with a `fonts.ready` promise still pending. A double mount that does not undo all of
it does not politely double the section — it produces ten bubble triggers instead of five, each
pair disagreeing about whether its own bubble has already played and should reverse on the way
back up, two `Lenis` instances pumping the same wheel event, and a ticker callback calling `.raf()`
on whichever `Lenis` instance got destroyed first. None of this shows up in a production build,
since React only double-invokes effects in development, so the teardown below is load-bearing, not
defensive.

*(1) The entry point* — the whole body sits inside `document.addEventListener("DOMContentLoaded",
...)`. A React component mounts after that event has already fired on the document, so the
listener attaches and is never called back: the reduced-motion check never runs, `Lenis` never
gets constructed, and none of the five bubbles ever receives a trigger. Delete the listener and
move its entire body — plugin registration, the `matchMedia` check and its early return, the
`Lenis` construction and ticker wiring, the per-bubble loop, the `.shout` scrub, and the
`fonts.ready` call — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)`
can move to module scope; re-running it on every mount is harmless but buys nothing.

*(2) Element lookups* — `document.querySelector(".track")` is a raw DOM call with no idea this
component owns only part of the page; scope it to a root ref (`root.querySelector(".track")`) so a
StrictMode remount cannot hand it the copy of `.track` that is on its way out. `gsap.utils.toArray(".bubble")`
and the bare string passed to `gsap.to(".shout", ...)` are a different case: once both sit inside
the `gsap.context` below, GSAP resolves that selector text against the context's own scope
automatically, so neither call needs a manual rewrite — only the bare `document.querySelector`
does.

*(3) Cleanup* — wrap the reduced-motion check, the `Lenis` setup, the five bubble triggers and the
`.shout` scrub in one `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // matchMedia check, Lenis + ticker wiring, per-bubble triggers, .shout scrub
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` undoes the five `fromTo` tweens, the five bubble `ScrollTrigger`s and the `.shout`
scrub trigger in one call, along with the inline `opacity`/`transform`/`rotate` GSAP wrote onto
each bubble. It does **not** reach `gsap.ticker.add((t) => lenis.raf(t * 1000))` — a ticker
subscription is neither a tween nor a trigger, so the context never recorded it, and this
component has no separate `requestAnimationFrame` loop of its own: the entire frame pump for
smooth scroll rides on that one subscription. Keep the callback by reference and tear things down
in this order:

```jsx
const pumpLenis = (t) => lenis.raf(t * 1000);
gsap.ticker.add(pumpLenis);
// cleanup:
gsap.ticker.remove(pumpLenis);
lenis.destroy();
ctx.revert();
```

Remove the ticker subscription before destroying `Lenis`, or a frame landing between the two calls
invokes `.raf()` on an instance that no longer exists. `lenis.on("scroll", ScrollTrigger.update)`
needs no separate teardown of its own — it is registered on the `Lenis` instance's own emitter, so
`lenis.destroy()` clears it along with everything else that instance owns.

`Lenis` is not this component's alone to keep — it is a document-level resource, and there must be
exactly one instance on the page. If `.voices` ships as one section inside a larger app, lift the
`new Lenis()` call to the app shell and have this effect call `lenis.on("scroll", ScrollTrigger.update)`
on the instance that already exists, instead of constructing a second one that fights the first
over the same wheel event. Only construct and destroy it here if this component genuinely owns
scroll for the whole page.

The last thing the effect starts is `document.fonts.ready.then(() => ScrollTrigger.refresh())` — a
real gap, since font loading is asynchronous and its length depends on cache and network, easily
long enough for a StrictMode unmount or a real navigation away to land inside it.
`ScrollTrigger.refresh()` is not scoped to this component: it recalculates start positions for
every trigger registered anywhere on the page, so a call firing after this component has already
unmounted still runs — against a layout that has already lost the padded `.track` and its five
bubbles from the page's total scroll height. Guard the continuation with the same cancellation flag
the cleanup sets:

```jsx
let cancelled = false;
document.fonts.ready.then(() => {
  if (cancelled) return;
  ScrollTrigger.refresh();
});
return () => {
  cancelled = true;
  gsap.ticker.remove(pumpLenis);
  lenis.destroy();
  ctx.revert();
};
```
