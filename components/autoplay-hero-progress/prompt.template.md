---
slug: autoplay-hero-progress
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Autoplay Hero with Progress — a hero on a clock, and the clock made visible

## Goal

Build a full-bleed hero carousel that advances **on a timer**, with one progress tick per slide
filling over exactly that slide's duration, and controls that actually work.

Use it when the front page has to show three or four things and none outranks the others: a
season's programme, a line-up, a schedule.

## Tech

**No GSAP, no ScrollTrigger, no Lenis — deliberately.** This hero is driven by a clock, not by the
scroll, and wiring a time-driven component to a scroll library is pretending. Plain ES modules and
one `requestAnimationFrame` loop.

> How the effect was identified in the first place: on the reference site the progress bar read
> **40% scrolling down and 86% scrolling back up at the same scroll position**. That is only
> possible if time is the driver. Nothing in the DOM says so — it took capturing frames on the way
> down and on the way up to see it.

## Structure

```html
<header class="hero" aria-roledescription="carousel">
  <div class="deck">
    <figure class="slide is-on"><img …><figcaption>…</figcaption></figure>
    …four of them…
  </div>
  <div class="bar" role="group" aria-label="Carousel controls">
    <div class="ticks" aria-hidden="true"><i><b></b></i>…</div>
    <div class="keys">
      <button data-go="-1">‹</button><button data-toggle>⏸</button><button data-go="1">›</button>
    </div>
  </div>
</header>
```

## The four decisions that ARE this component

### 1. One rAF loop drives BOTH the advance and the bar.

```js
const paso = (t) => {
  raf = requestAnimationFrame(paso);
  if (pausado || !visible || !enPantalla) { t0 = t; return; }
  const p = Math.min(1, (t - t0) / DURACION);
  ticks[actual].querySelector("b").style.width = `${p * 100}%`;
  if (p >= 1) ir(actual + 1);
};
```

The obvious alternative — a CSS transition on the bar plus a `setInterval` for the slide — has two
clocks, and they come apart the first time the tab is backgrounded or the reader pauses. After
that the bar **lies** about when the next slide lands, which is worse than having no bar.

### 2. Resuming rebases the epoch; it does not preserve elapsed time.

Note the `t0 = t` inside the paused branch. When the loop is idle it keeps moving the origin
forward, so coming back from a hidden tab resumes exactly where it stopped instead of jumping
several slides at once.

### 3. It stops when nobody is looking.

```js
document.addEventListener("visibilitychange", () => { visible = !document.hidden; });
new IntersectionObserver(([e]) => { enPantalla = e.isIntersecting; }, { threshold: 0.25 }).observe(deck);
```

A four-slide hero that keeps cycling at the bottom of a long page is battery spent on nothing.

### 4. Manual advance restarts the clock.

`ir()` sets `t0 = performance.now()`. Without it the slide you just jumped to lasts whatever was
left of the previous one, which reads as a bug even though nothing is broken.

## Crossfade, not slide

```css
.slide { opacity: 0; visibility: hidden; transition: opacity .7s ease, visibility 0s linear .7s; }
.slide.is-on { opacity: 1; visibility: visible; transition: opacity .7s ease, visibility 0s; }
```

With full-bleed photography a translate reads as a jolt, because the eye tracks the image edge
rather than the content. The delayed `visibility` is what keeps the outgoing slide out of the tab
order without killing the fade.

## Accessibility

- `aria-hidden` on every non-active `<figure>`, or a screen reader announces all four sessions at
  once.
- The pause button's label and glyph both change with state.
- `:focus-visible` outline on the controls in the accent colour — this is a component people
  operate.

## Reduced motion

Stop the autoplay, keep the controls. Do **not** hide them: the reader still gets every slide, by
hand, which is exactly what the setting asks for.

## Adapting

Change the slide count (three to five), the duration (4–7 s; below 4 nobody finishes reading the
caption), the palette, the type. Keep: one rAF for both jobs, the epoch rebase, the two pause
conditions, the clock restart on manual advance, and opacity-only transitions.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, reaches into the page with `document.querySelector(".deck")` and its siblings, and owns a `requestAnimationFrame` loop, a `visibilitychange` listener and an `IntersectionObserver` for the rest of the page's life. React withdraws all three guarantees at once, and it does it quietly — the carousel keeps advancing, but something underneath is now doubled.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves two of everything here: two `paso` loops, each holding its own `actual`/`t0` closure, independently calling `ir()` against the same `<figure>` and `<i><b></b></i>` nodes; two `visibilitychange` listeners each flipping their own `visible` flag; two `IntersectionObserver`s each watching `.deck`. The remount detaches the first loop's nodes from the document, but nothing tells that loop to stop — it keeps calling `requestAnimationFrame(paso)` forever, computing progress against a `<figure>` that is no longer there. That is a sharp irony for this particular component: the entire point of the `visibilitychange`/`IntersectionObserver` pair is to stop burning cycles when nobody is looking, and a leaked, uncancelled loop defeats it — it keeps running regardless of whether its own nodes are even attached. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — This script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the callback that resolves `deck`, `slides`, `ticks`, `toggle`, seeds `pintar(0)` and starts `raf = requestAnimationFrame(paso)` never runs — no carousel, no error, nothing to debug. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its entire body into a `useEffect` with an empty dependency array exactly as it reads today: the `let actual = 0, t0 = 0, …` closure, `pintar`, `ir`, `paso`, the initial paint and the first `requestAnimationFrame(paso)` call all belong inside that one effect.

*(2) Element lookups* — `.deck`, `.slide`, `.ticks i`, `[data-toggle]` and `[data-go]` are all queried against `document`, which assumes this component owns the whole page. Give the component a root `ref` on the `<header class="hero">` and rewrite all five lookups to search inside that ref instead of `document`. This is not cosmetic here: during the StrictMode remount two `<header>` subtrees briefly coexist, and an unscoped `querySelectorAll(".slide")` has no way to prefer the copy that is staying — `pintar` and `paso` can end up toggling `is-on` on figures that are already on their way out.

*(3) Cleanup* — there is no GSAP context or Lenis instance to fold this into; every long-lived subscription this effect opens needs its own explicit reversal, and this component opens three:

- **The `paso` loop.** Keep the exact handle `raf` holds and call `cancelAnimationFrame(raf)` in the cleanup. Without it, the closure holding `actual`, `t0`, `pausado`, `visible` and `enPantalla` keeps computing `p` and calling `ir()` against detached nodes for the life of the page — one more such loop per remount.
- **The `visibilitychange` listener.** It is attached to `document`, not to any node this component owns, so removing it needs the same function reference the effect registered — an inline arrow handed straight to `addEventListener`, as the script has it today, cannot be named again later to remove. Bind it to a name inside the effect and pass that same name to both `addEventListener` and the cleanup's `removeEventListener`.
- **The `IntersectionObserver`.** It watches `deck`; call `.disconnect()` on it in the cleanup, or it keeps flipping `enPantalla` for a `<div class="deck">` that no longer exists.

Two things about the state this effect owns are worth being explicit about, because a naive port gets them wrong in ways that only surface once the tab is backgrounded or a control is clicked mid-slide:

- **Don't lift `actual`, `t0`, `pausado`, `visible` or `enPantalla` into `useState`.** `paso` reads and writes several of them on every single frame; routing that through `setState` would re-render the component on every tick for values nothing in the JSX needs to react to. Keep them as plain variables closed over by the effect (or `useRef`s where the click handlers below also need to reach them), and keep writing `ticks[actual].querySelector("b").style.width` and toggling `is-on` directly — the same imperative writes the script already does.
- **Preserve the epoch rebase and the manual-advance restart unchanged.** `t0 = t` inside the paused branch of `paso`, and `t0 = performance.now()` inside `ir()`, are what let a backgrounded tab resume where it left off instead of skipping slides, and what keep a manually-advanced slide from inheriting whatever time was left on the one before it. Neither is an artifact of a particular DOM API — refactor the surrounding code as much as the port requires, but leave both assignments exactly where they sit relative to `paso` and `ir`.

`[data-go]` and `[data-toggle]` are the one part of this effect that maps cleanly onto JSX: those are plain click handlers on elements the component already renders, so an inline `onClick` calling `ir(actual + 1)` or toggling `pausado` and rebasing `t0` before calling `marcarToggle()` replaces the corresponding `addEventListener` call with no cleanup burden of its own — React detaches them together with the elements. Only the loop, the document-level listener and the observer need the manual teardown above.
