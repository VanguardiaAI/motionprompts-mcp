# Scroll-Powered SVG Stroke Draw — Serpentine Line Drawn On Scroll

## Goal
Build an editorial scroll page whose star effect is a **thick orange serpentine SVG stroke that draws itself behind the content as you scroll**. The stroke lives in a background layer (`z-index:-1`) spanning a tall middle section; using the classic `strokeDasharray` / `strokeDashoffset` technique, the whole squiggly path starts fully hidden and is progressively "inked in" from start to finish, scrubbed 1:1 to scroll position across that section. Smooth scrolling via Lenis. Above and below the drawing section sit a full-viewport intro and outro heading.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`ScrollTrigger`**.
- **`lenis`** — smooth scroll (it owns the scroll driving the scrub).

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```
No SplitText, no CustomEase, no Three.js, no lerp/rAF interpolation. Run everything inside `document.addEventListener("DOMContentLoaded", …)`.

## Layout / HTML
Three top-level `<section>`s: an intro `.hero`, the tall `.spotlight` that holds both the content rows **and** the background SVG, and an `.outro`. Class/id names are load-bearing — the JS/CSS query them.

```html
<section class="hero">
  <h1>Designed to keep information clear and connected</h1>
</section>

<section class="spotlight">
  <div class="row">
    <div class="img"><img src="/img_1.svg" alt="" /></div>
  </div>

  <div class="row">
    <div class="col">
      <div class="card">
        <h2>A cleaner way to handle incoming updates</h2>
        <p>Instead of showing every message or notification instantly, the app
        groups related items and presents them in an organized panel. It keeps
        your workspace calm, even when activity spikes.</p>
      </div>
    </div>
    <div class="col">
      <div class="img"><img src="/img_2.svg" alt="" /></div>
    </div>
  </div>

  <div class="row">
    <div class="col">
      <div class="img"><img src="/img_3.svg" alt="" /></div>
    </div>
    <div class="col">
      <div class="card">
        <h2>Built for increasing information demands</h2>
        <p>Whether it is files, notes, or incoming messages, the app sorts and
        prioritizes items automatically. It prevents clutter and helps maintain
        clarity during busy periods.</p>
      </div>
    </div>
  </div>

  <div class="row">
    <div class="img"><img src="/img_4.svg" alt="" /></div>
  </div>

  <div class="svg-path">
    <svg viewBox="0 0 1378 2760" fill="none" xmlns="http://www.w3.org/2000/svg"
         preserveAspectRatio="xMidYMin meet">
      <path id="stroke-path"
        d="M639.668 100C639.668 100 105.669 100 199.669 601.503C293.669 1103.01 1277.17 691.502 1277.17 1399.5C1277.17 2107.5 -155.332 1968 140.168 1438.5C435.669 909.002 1442.66 2093.5 713.168 2659.5"
        stroke="#FF5A1F" stroke-width="200" stroke-linecap="round" />
    </svg>
  </div>
</section>

<section class="outro">
  <h1>Clearer organization ready for whatever comes next</h1>
</section>

<script type="module" src="./script.js"></script>
```

Notes:
- The **`<path>` `d` above is load-bearing** — it defines the exact serpentine S-curve that loops left, right, back left, then swings down. Reproduce it verbatim, along with `stroke="#FF5A1F"`, `stroke-width="200"`, `stroke-linecap="round"`, the `viewBox="0 0 1378 2760"` and `preserveAspectRatio="xMidYMin meet"`. The tall, narrow viewBox is what makes the stroke snake vertically down the section.
- The 4 `.row`s alternate: **row 1** = one centered half-width image; **row 2** = text card (left) + image (right); **row 3** = image (left) + text card (right); **row 4** = one centered half-width image.
- Keep the demo copy verbatim (neutral SaaS-ish prose, no brands).

## Styling
Reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `img { width:100%; height:100%; object-fit:cover; }`.

Fonts: **Manrope** for the headings and body, **Space Mono** for the small uppercase labels.
```css
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap");
```
- `body { font-family:"Manrope", sans-serif; }`
- `h1, h2 { font-weight:500; line-height:1.1; }`
- `h1 { font-size:4rem; letter-spacing:-0.1rem; }`
- `h2 { font-size:2.5rem; letter-spacing:-0.075rem; }`
- `p { font-size:1.125rem; font-weight:500; }`

Palette (CSS variables — exact hex; the stroke orange is separate and hard-coded on the SVG):
```css
--paper: #f4f4f0;     /* page background — cool bone */
--panel: #e7e7e2;     /* hero + outro background AND the text-card background */
--ink: #16161a;       /* near-black — all text */
--ink-soft: #5f6368;  /* cool grey — secondary copy */
--accent: #ff5a1f;    /* the stroke colour, echoed in the small labels */
```
Body: `background-color: var(--paper); color: var(--ink);`. The stroke colour is `#FF5A1F`, the same value as `--accent` — it lives on the SVG `stroke` attribute, so if you change one you must change both.

Layout / positioning (the pieces that make the layering + drawing work):
- `.hero, .outro`: `position:relative; width:100%; height:100svh; padding:2rem; background-color:var(--panel); display:flex; justify-content:center; align-items:center; overflow:hidden;`. Their `h1` is `width:60%; text-align:center;`.
- `.spotlight`: `position:relative; width:100%; height:100%; padding:2rem; display:flex; flex-direction:column; gap:10rem; overflow:hidden;` — a tall column of rows with big 10rem gaps. Its natural (unpinned) height is the scroll runway the stroke draws across.
- `.spotlight .row`: `display:flex; justify-content:center; gap:2rem;`.
- `.spotlight .row .col`: `flex:1; display:flex; flex-direction:column; justify-content:center;`.
- `.spotlight .row:nth-child(1) .img, .spotlight .row:nth-child(4) .img`: `width:50%;` — the two solo images are half-width and centered.
- `.spotlight .card`: `width:75%; margin:0 auto; padding:3rem; background-color:var(--panel); border-radius:1rem; display:flex; flex-direction:column; gap:1rem;`.
- `.spotlight .svg-path`: `position:absolute; top:25svh; left:50%; transform:translateX(-50%); width:90%; height:100%; z-index:-1;` — **this is the background drawing layer**; `z-index:-1` puts the whole stroke behind the cards/images/text. `.spotlight .svg-path svg { width:100%; height:auto; }` so the tall SVG scales to the section width and overflows vertically down the page.

## GSAP effect (the important part — be exact)

### Smooth-scroll wiring (Lenis + GSAP ticker)
Lenis is created with **`autoRaf:false`** and driven off GSAP's ticker (converting the ticker's seconds to milliseconds), with lag smoothing off so the scrub stays glued to scroll:
```js
const lenis = new Lenis({ autoRaf: false });
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

### Measure the path, then hide it with a dash
Grab `#stroke-path`, bail if missing, measure its total length, and set the dash so the entire stroke is initially invisible (one dash the full length of the path, offset by that same full length — nothing is painted yet):
```js
const path = document.getElementById("stroke-path");
if (!path) return;

const pathLength = path.getTotalLength();
path.style.strokeDasharray  = pathLength;
path.style.strokeDashoffset = pathLength;   // fully hidden at scroll top
```

### The single scrubbed tween — draw the stroke
One `gsap.to` animates `strokeDashoffset` from `pathLength` → **`0`** (offset shrinking to zero reveals the stroke progressively from its start point to its end), with **linear `ease:"none"`** so the drawn length maps 1:1 to scroll progress, scrubbed by a ScrollTrigger tied to the whole `.spotlight` section:
```js
gsap.to(path, {
  strokeDashoffset: 0,
  ease: "none",
  scrollTrigger: {
    trigger: ".spotlight",
    start: "top top",       // begins when spotlight's top reaches viewport top
    end: "bottom bottom",   // finishes when spotlight's bottom reaches viewport bottom
    scrub: true,
  },
});
```
- **No pin.** The section scrolls normally; the stroke simply inks in as the `.spotlight` passes from `start` to `end`.
- `scrub: true` (no numeric smoothing) — offset is bound directly to scroll position, so it draws forward on scroll-down and un-draws on scroll-up. Parking the scroll freezes the stroke mid-draw.
- Because the SVG lives in the `z-index:-1` background layer, the orange line appears to weave **behind** the images and cards as it grows down the page.

That is the entire effect: Lenis smooth scroll + one scrubbed dashoffset tween. No timeline, no stagger, no delay, no other tweens.

## Assets / images
Four **square (1:1) monochrome line-art illustrations** on a white background — simple black single-weight outline drawings (thin `~3px` stroke, rounded caps/joins) with occasional small orange accents, in an editorial "quiet productivity" mood. Rendered with `object-fit:cover`; the two solo ones (rows 1 & 4) sit at half-width, the two paired ones (rows 2 & 3) fill their column. Roles / subjects (generic, no brands):
1. Person working late at a desk against a starry night blob — wall clock, flame, mug, stacked books.
2. Character hiding under a desk hugging their knees while chat bubbles pop above the monitor.
3. Overwhelmed person kneeling at a laptop desk clutching their head, surrounded by stacks of binders and envelopes.
4. Embarrassed character at a laptop covering their face while a hand points at them, heart mug beside.

If you have fewer than four, repeat; exact drawings don't matter as long as they read as a cohesive line-art set.

## Behavior notes
- **Trigger:** scroll only. The whole animation is scroll-scrubbed — nothing autoplays. Reversible: scrolling back up un-inks the stroke.
- **Fresh load (scroll at top):** stroke fully hidden (`strokeDashoffset === pathLength`); hero heading visible.
- **Responsive** (`@media (max-width:1000px)`): `h1 → 2rem`, `h2 → 1.5rem`, `p → 1rem`, `letter-spacing:0` on headings; `.hero h1, .outro h1 → width:100%`; `.spotlight` gap drops to `5rem`; `.spotlight .row` stacks (`flex-direction:column`); the solo images and cards go `width:100%`; and the background SVG grows to `.svg-path { top:15svh; width:275%; }` (much wider so the stroke still reads on narrow screens).
- The stroke's `stroke-width:200` in a `1378`-wide viewBox is intentionally thick — it should read as a bold ribbon, not a hairline. No reduced-motion guard in the original.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/scroll-powered-svg-stroke/img_1.svg
https://motionprompts.dev/c/scroll-powered-svg-stroke/img_2.svg
https://motionprompts.dev/c/scroll-powered-svg-stroke/img_3.svg
https://motionprompts.dev/c/scroll-powered-svg-stroke/img_4.svg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--panel`, `--ink`, `--ink-soft`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, wires a `Lenis` instance pumped by the GSAP ticker, and then does exactly one thing — reads `#stroke-path`'s total length, hides the path behind a dasharray/dashoffset pair sized to that length, and scrubs `strokeDashoffset` down to zero as `.spotlight` scrolls past. Nothing here ever has to undo itself, because the page it lives on never unmounts. React withdraws that guarantee quietly: the stroke draws correctly on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Mount this twice without tearing the first pass down and you get two `Lenis` instances both pumping `.raf()` off the same ticker, and two `ScrollTrigger`s scrubbing the same `#stroke-path` element's `strokeDashoffset` against two different scroll listeners — the line will visibly jump or stutter between two offsets instead of drawing smoothly. None of this reproduces in a production build, because React only double-invokes in development.

*(1) The entry point* — the script waits for `DOMContentLoaded`; by the time a React component mounts, that event has already fired, so the listener is registered and never called: the path sits with no dash applied at all, fully stroked and visible from the first frame, and nothing in the console points at why. Delete the listener and move its body — the Lenis/ticker wiring, the `getElementById` lookup with its early return, the dasharray setup, and the single `gsap.to` call — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` stays at module scope; it is one-time, page-wide configuration, not per-mount state.

*(2) Element lookups* — `document.getElementById("stroke-path")` resolves against the whole document, and an `id` is not multi-instance-safe: two copies of this component on one page, or the instant overlap during a StrictMode remount, share one `#stroke-path`, and whichever tween is created last owns the dash animation for both. Give the component a root ref on the element wrapping `.hero`, `.spotlight` and `.outro`, and look the path up as `rootRef.current.querySelector("#stroke-path")` instead. The `".spotlight"` string handed to `scrollTrigger.trigger` does not need the same treatment by itself — once the tween is created inside a `gsap.context` scoped to that root ref, GSAP resolves it against the root's subtree rather than the whole document.

*(3) Cleanup* — wrap the Lenis wiring and the tween in one `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, then the getTotalLength/dasharray setup and
    // the single scrubbed gsap.to(path, { strokeDashoffset: 0, scrollTrigger: {...} })
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` removes the one `ScrollTrigger` this component creates and cleans up the `strokeDashoffset` inline style the tween wrote while scrubbing. The two lines that measure `getTotalLength()` and set `strokeDasharray`/`strokeDashoffset` before the tween exists are plain DOM writes, not GSAP calls — the context has no opinion on them either way, and none is needed: they recompute from the path's own geometry every time the effect runs, so a fresh mount hides the stroke again on its own without any hand-written restoration.

What the context does not reach is `gsap.ticker.add((time) => { lenis.raf(time * 1000); })` — the only thing driving Lenis here, since this component has no `requestAnimationFrame` loop of its own. A ticker subscription is neither a tween nor a trigger, so `ctx.revert()` leaves it running against a `Lenis` instance you are about to destroy:

```jsx
const onTick = (time) => { lenis.raf(time * 1000); };
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

Lenis is a document-level resource, and this component is written as a complete page, so owning the instance here is correct as long as it stays that way. If this stroke-draw section becomes one part of a larger app that already runs Lenis, drop the `new Lenis()` call and the ticker wiring above, and instead create this component's single `ScrollTrigger` and let it read scroll from the shared instance rather than racing a second one over the same wheel event.
