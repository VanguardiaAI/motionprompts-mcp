---
slug: nextjs-text-reveal-animation
native_system: reveal-on-enter
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 3
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power4.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Text Reveal Animation (Masked Line-by-Line Scroll Reveal)

## Goal
Build a minimal, editorial one-page site for a fictional design studio ("Greyloom") where **every headline, label and paragraph reveals itself line by line**: GSAP **SplitText** breaks each text block into lines, each line is wrapped in an overflow-clipping mask, pushed down to `y: 100%`, and slid up to `y: 0%` with a `power4.out` ease and a 0.1s stagger — triggered **once per block when it scrolls to 75% of the viewport** (the hero headline plays on load with a 0.5s delay). Scrolling is smoothed with Lenis. The reveal system is generic and attribute-driven (`data-copy`, `data-copy-wrapper`, `data-copy-delay`, `data-copy-scroll`).

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`SplitText`** and **`ScrollTrigger`** plugins, plus **`lenis`** for smooth scrolling:
```js
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(SplitText, ScrollTrigger);
```
Everything runs inside a `DOMContentLoaded` listener. Wire Lenis the standard way:
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

## Layout / HTML
One page, six blocks in this order. The attributes `data-copy`, `data-copy-wrapper="true"` and `data-copy-delay` are the animation API — keep them exact.

```html
<nav>
  <div class="col">
    <div class="sub-col"><span>Greyloom</span></div>
    <div class="sub-col">
      <span>Home</span><span>Projects</span><span>About</span><span>Lab</span>
    </div>
  </div>
  <div class="col"><span>Let's talk</span></div>
</nav>

<section class="hero">
  <div class="hero-img"><img src="(hero image)" alt="" /></div>
  <div class="header">
    <h1 data-copy data-copy-delay="0.5">
      We craft identities and experiences for the bold.
    </h1>
  </div>
</section>

<section class="about">
  <span data-copy>Design &amp; Strategy for the Vision-Driven</span>
  <div class="header">
    <h1 data-copy>
      We partner with founders, innovators, and change-makers to shape
      brands that resonate. From first lines of code to global launches,
      we bring focus, elegance, and intent to every stage.
    </h1>
  </div>
</section>

<section class="about-img">
  <img src="(about image)" alt="" />
</section>

<section class="story">
  <div class="col">
    <h1 data-copy>The Story Behind <br /> Our Stillness</h1>
  </div>
  <div class="col">
    <div data-copy data-copy-wrapper="true">
      <p>Greyloom was born from a simple idea: that creativity, when wielded
      with intention, can quietly reshape the world. In an era of
      overstimulation and fleeting trends, we chose a different path. One of
      clarity, restraint, and long-form vision.</p>
      <p>We began as a small collective of designers, developers, and
      strategists who shared an obsession with thoughtful execution. No
      shortcuts, no templates. Just the hard, honest work of listening deeply,
      thinking critically, and building beautifully. Over time, our work began
      to attract the kind of clients we had always hoped for. Visionary
      founders, principled organizations, and global teams with sharp ideas
      and quiet confidence.</p>
      <p>We don't chase virality. We don't trade in noise. We build for the
      long haul: timeless identities, seamless digital experiences, and
      strategies that evolve with clarity and purpose. Greyloom exists for
      those who believe that the most enduring ideas don't demand attention.
      They earn it.</p>
    </div>
  </div>
</section>

<section class="philosophy">
  <span data-copy>The Thought Beneath</span>
  <div class="header">
    <h1 data-copy>
      We believe in the power of quiet conviction. In work that speaks softly
      but lingers long. In design as a tool for clarity, not decoration. We
      believe that the best ideas don't demand attention. Our philosophy is
      simple. Create with purpose.
    </h1>
  </div>
</section>

<footer>
  <div class="col">
    <div class="sub-col"><span>Terms &amp; Conditions</span></div>
    <div class="sub-col">
      <div data-copy data-copy-wrapper="true">
        <h1>Twitter</h1><h1>LinkedIn</h1><h1>Instagram</h1>
        <h1>Awwwards</h1><h1>Email</h1>
      </div>
    </div>
  </div>
  <div class="col"><span>Copyright Greyloom 2025</span></div>
</footer>
```

## Styling
Monochrome editorial palette: black `#000`, mid grey `#909090`, near-black `#202020`, white `#fff` on a default white page.

Typography: the design intends a neutral grotesque sans for headings/body (a premium font in the demo — use a clean grotesque or plain `sans-serif`) and a small monospace-style face for the uppercase labels.

- Global reset `* { margin:0; padding:0; box-sizing:border-box; }`; `body { font-family: sans-serif; }` (grotesque stack).
- `h1 { font-size:3.5rem; font-weight:500; letter-spacing:-0.05rem; line-height:1; }`
- `p { font-size:1.125rem; font-weight:500; line-height:1.25; margin-bottom:1em; }`
- `span { color:#000; display:block; text-transform:uppercase; font-size:0.75rem; font-weight:500; }` — mono-style label face.
- `img { width:100%; height:100%; object-fit:cover; }`
- `nav { position:absolute; top:0; left:0; width:100%; display:flex; padding:1.5em 2em; }` — first `.col` is `display:flex`, second is `text-align:right`. `nav span { color:#909090; mix-blend-mode:difference; }` so the nav stays legible over the hero image.
- `section { position:relative; width:100vw; height:100svh; padding:2em; }`
- `.col, .sub-col { flex:1; }`
- `.hero, .about-img { display:flex; justify-content:center; align-items:center; }`
- `.hero-img { position:absolute; width:100%; height:100%; overflow:hidden; z-index:-1; }` — full-bleed background image behind the headline.
- `.hero .header { width:50%; text-align:center; }` and `.hero .header h1 { color:#909090; }`
- `.about, .philosophy { display:flex; flex-direction:column; justify-content:space-between; }` — small label at the top, big headline at the bottom.
- `.philosophy { background-color:#202020; }` with `h1`/`span` in `#fff` (the one dark section).
- **`.about h1, .philosophy h1 { text-indent:25%; }`** — this first-line indent is load-bearing: the JS transfers it to the first split line (see below).
- `.about-img { height:max-content; padding:8em 2em; }` and `.about-img img { width:20%; aspect-ratio:4/5; }` — a small centered portrait between text sections.
- `.story { height:max-content; display:flex; gap:1em; margin-bottom:8em; }`
- `footer { display:flex; justify-content:space-between; align-items:flex-end; gap:1em; padding:6em 2em 1.5em 2em; }`; `footer .col { display:flex; justify-content:flex-end; }`; `footer .sub-col { display:flex; align-items:flex-end; }`
- **`.line { transform:translateY(100%); will-change:transform; }`** — SplitText lines get this class, so text is hidden inside its mask before JS runs (no flash of visible text).
- `@media (max-width:900px)`: `h1 { font-size:2rem; }`; hide the nav's second sub-col (the menu links); `.hero .header { width:95%; }`; `.about-img img { width:100%; }`; `.story { flex-direction:column; }`; footer's first col becomes `column-reverse` with `gap:4em` and its second col is hidden.

## GSAP effect (the important part — be exhaustive)

### Init gate
Wait for **`document.fonts.ready`**, then run `initCopy(container)` for every `[data-copy]` element in DOM order. (Splitting before fonts load would compute wrong line breaks.)

### `initCopy(container)` — the reveal system
1. **Read the attribute API:**
   - `animateOnScroll = container.dataset.copyScroll !== "false"` (defaults to true; no element in this page sets it to false, but support it).
   - `delay = parseFloat(container.dataset.copyDelay || "0")` — only the hero `h1` sets `data-copy-delay="0.5"`.
2. **Resolve targets:** if the container has the `data-copy-wrapper` attribute, split **each direct child** (`Array.from(container.children)` — the story paragraphs and the footer link h1s); otherwise split the container itself.
3. **Split each target element with SplitText:**
   ```js
   const split = SplitText.create(element, {
     type: "lines",
     mask: "lines",        // wraps every line in an overflow-clipping mask element
     linesClass: "line++", // each line gets class "line" plus an incremented "line1", "line2", …
     lineThreshold: 0.1,
   });
   ```
   `mask: "lines"` (GSAP 3.13+) is what creates the clipping wrappers — the reveal must look like lines rising out of invisible slots, not fading in.
4. **Text-indent transfer (crucial for `.about`/`.philosophy` h1s):** read `getComputedStyle(element).textIndent`; if it's set and not `"0px"`, apply that value as `paddingLeft` on **the first split line only** (`split.lines[0].style.paddingLeft = textIndent`) and set the element's own `text-indent` to `0`. Without this, every wrapped line would inherit the 25% indent.
5. **Collect** all `split.lines` from all targets into one `lines` array per container.
6. **Initial state:** `gsap.set(lines, { y: "100%" })` (each line fully below its mask; matches the `.line` CSS fallback).
7. **The tween** (shared props):
   ```js
   {
     y: "0%",
     duration: 1,
     stagger: 0.1,
     ease: "power4.out",
     delay: delay,
   }
   ```
   - If `animateOnScroll` (default): `gsap.to(lines, { ...props, scrollTrigger: { trigger: container, start: "top 75%", once: true } })` — fires **once**, never reverses, no scrub, no pin.
   - Else: plain `gsap.to(lines, props)` on load.

### Resulting choreography
- **Hero headline:** its ScrollTrigger (`top 75%`) is already past at load, so it fires immediately — but the `0.5`s delay makes the two centered grey lines rise ~half a second after page load.
- **Each subsequent block** (about label, about headline, story title, three story paragraphs, philosophy label, philosophy headline, footer links) reveals independently when it crosses 75% of the viewport height.
- Within a block, lines cascade top-to-bottom 0.1s apart; `power4.out` gives a fast launch with a long soft landing over the 1s duration.
- For `data-copy-wrapper` containers the lines of all children join one array, so the stagger runs continuously across paragraph boundaries (the three story paragraphs read as a single cascading column; the five footer h1s rise one after another).

There is no timeline, no scrub, no pin — just one `gsap.to` per `[data-copy]` container.

## Assets / images
2 images, described by role:
1. **Hero background** — full-bleed landscape image behind the centered grey headline: a glossy black abstract sculptural/fluid form with soft highlights on a bright white background (monochrome, high-key).
2. **About portrait** — vertical 4:5 image shown small (20% width) and centered in its own section: a dark, moody close-up of a glossy black draped/fluid form with subtle grey highlights on a near-black background (monochrome, low-key).

No logos or brand marks — the nav/footer are plain text labels for the fictional studio "Greyloom".

## Behavior notes
- Every reveal uses `once: true` — scrolling back up never re-hides or replays text.
- Text must be invisible before its animation: the `.line` CSS class (translateY 100%) plus the SplitText masks guarantee zero flash even before `document.fonts.ready` resolves.
- Lenis provides the smooth, damped scroll feel; ScrollTrigger is updated from Lenis's scroll event and `gsap.ticker` drives `lenis.raf(time * 1000)` with `lagSmoothing(0)`.
- Sections use `100svh` so mobile browser chrome doesn't clip them; the `.about-img` and `.story` sections are `height: max-content` exceptions.
- Responsive at ≤900px (smaller type, stacked story, simplified nav/footer) — the reveal effect itself runs unchanged on mobile.
- No CustomEase, no Three.js, no canvas, no reduced-motion branch.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/nextjs-text-reveal-animation/about.jpg
https://motionprompts.dev/c/nextjs-text-reveal-animation/hero.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--muted`, `--line`, `--dark`, `--on-dark`, `--hero-head`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, wires one `Lenis` instance and its `gsap.ticker` pump, then waits again on `document.fonts.ready` before calling `initCopy` on the eight `[data-copy]` containers spread across five sections — hero, about, story, philosophy, footer (the `about-img` portrait section has none). React withdraws the guarantees this relies on — a document already parsed before the script runs, a single scroll owner, a script body that only ever executes once — and it withdraws them quietly: the lines still rise on first load, and the damage only shows up on the second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. By the time that first unmount can land, `initCopy` has already run eight times: each `SplitText.create` call has wrapped its target's lines in `.line` masks, each of the eight containers has its own `ScrollTrigger` (all keyed to `top 75%`, `once: true`), and `Lenis` plus one `gsap.ticker` subscription are alive and pumping. A double mount that doesn't undo all of it doesn't just double the section — it re-splits text that is already split, nesting `.line` spans one level deeper than the CSS `.line { transform: translateY(100%) }` fallback expects, it leaves two `ScrollTrigger`s per container disagreeing about whether that block already fired its once-only reveal, and it leaves two `Lenis` instances fighting over the same wheel event with a ticker callback calling `.raf()` on whichever instance got destroyed first. Worse, `document.fonts.ready` is a real promise: on a slow font load it can resolve after a StrictMode unmount — or a genuine route change — has already landed, and its callback would then try to split and animate a page that, from React's perspective, no longer exists. None of this reproduces in a production build, since React only double-invokes effects in development — treat the teardown below as load-bearing, not defensive.

*(1) The entry point* — the whole body sits inside `document.addEventListener("DOMContentLoaded", () => { ... })`. A React component mounts after that event has already fired on the document, so the listener attaches and is never called back: `Lenis` never gets constructed, `initCopy` is never defined, and the `fonts.ready` gate is never reached — no error, no reveal, nothing to debug. Delete the listener and move its entire body — the `Lenis` construction and ticker wiring, the `initCopy` function, and the `document.fonts.ready.then(...)` call — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(SplitText, ScrollTrigger)` belongs at module scope instead, next to the imports; re-registering it on every mount is harmless but pointless.

*(2) Element lookups* — the one raw, document-wide lookup in this script is `document.querySelectorAll("[data-copy]")` inside the `fonts.ready` callback. Scope it to a root ref (`rootRef.current.querySelectorAll("[data-copy]")`) so a StrictMode remount can't hand this instance the seven containers belonging to the copy that's on its way out. Everything `initCopy` does after that — `container.dataset.copyScroll`, `container.children`, `getComputedStyle(element).textIndent`, and the target elements it hands to `SplitText.create` — already operates on the specific node it was passed rather than the document, so none of it needs rewriting once the containers it's called with are the scoped ones.

*(3) Cleanup* — `initCopy` as written throws its `SplitText` instances away: `split` is a local inside the `elements.forEach` loop, folded into the shared `lines` array and never kept anywhere a cleanup could reach it. A container built with `data-copy-wrapper` (the story column, the footer link list) calls `SplitText.create` once per child, so a single container can own more than one split instance. Have `initCopy` return the array of splits it created, collect them across all eight containers, and defer the whole pass — plus the `ScrollTrigger`s it creates — until `fonts.ready` resolves, inside the context:

```jsx
useEffect(() => {
  let cancelled = false;
  const splits = [];
  let self;
  const ctx = gsap.context((ctxSelf) => { self = ctxSelf; }, rootRef);

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  const pumpLenis = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(pumpLenis);
  gsap.ticker.lagSmoothing(0);

  document.fonts.ready.then(() => {
    if (cancelled) return;
    self.add(() => {
      rootRef.current.querySelectorAll("[data-copy]").forEach((container) => {
        splits.push(...initCopy(container)); // initCopy now returns its SplitText instances
      });
    });
  });

  return () => {
    cancelled = true;
    ctx.revert();
    splits.forEach((split) => split.revert());
    gsap.ticker.remove(pumpLenis);
    lenis.destroy();
  };
}, []);
```

`self.add(...)` here is the one-argument, run-immediately form: called from inside the `.then()`, well after the factory's own synchronous pass has finished, it still attributes the `gsap.set` calls and the `gsap.to`/`ScrollTrigger` each `initCopy` invocation creates to this context, so `ctx.revert()` later can undo them. Order matters: `ctx.revert()` has to run *before* `splits.forEach((split) => split.revert())`. Reverting the context first kills the eight `ScrollTrigger`s and the tweens riding on the `.line` nodes; only once those are gone is it safe to collapse each split's wrapper spans back into the original `h1`/`span`/`p` elements. Revert the split first and a still-live `ScrollTrigger` or an in-flight tween can reach for a `.line` node the split just removed from the DOM.

One inline-style write this component makes falls outside anything `split.revert()` restores. For the `.about h1` and `.philosophy h1` cases, `initCopy` reads `getComputedStyle(element).textIndent`, and when it isn't `"0px"` it sets `element.style.textIndent = "0"` directly on the host element — a plain assignment outside any GSAP tween, made so the browser stops indenting a first line that no longer exists once the text is split into masked lines. Reverting the split undoes the wrapper spans it created; it has no idea about that inline style, because SplitText never wrote it — this component's own code did. Left alone, the StrictMode double-invoke's first pass zeroes `textIndent` on the real, persistent DOM node, and the second, live pass then reads back a computed `"0px"` on an element it never actually touched — so `split.lines[0].style.paddingLeft` never gets set on the pass that survives, and the 25% first-line indent silently disappears in development on a headline that will indent correctly in a production build (where the effect only runs once). Capture the original `textIndent` once, before the first split ever runs — or explicitly clear the inline override (`element.style.textIndent = ""`) in the same cleanup that reverts the split — rather than trusting `getComputedStyle` to still report the pre-split value on a later pass.

`ctx.revert()` doesn't reach `pumpLenis` — a ticker subscription is neither a tween nor a trigger, so the context never recorded it, and this is exactly where it matters: that subscription is what drives Lenis's own frame loop, since this component has no separate `requestAnimationFrame` loop of its own. Remove it before calling `lenis.destroy()`, in the order shown above, or a tick landing between the two calls invokes `.raf()` on an instance that no longer exists. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — it's registered on the `Lenis` instance's own emitter, so `destroy()` clears it along with everything else that instance owns. (Whether this component should even own its `Lenis` instance, rather than reuse one lifted to the app shell, is already covered above, in "Using this outside its demo page.")
