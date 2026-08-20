---
slug: prototypestudio-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# PrototypeStudio Scroll Animation — Pinned Spotlight Counter + Image Column

## Goal
Build a portfolio "spotlight" section that gets **pinned and scrubbed over five viewport heights** while three things move in lockstep with scroll progress: a large uppercase **`01/10` counter** that both **updates its number** and **slides straight down** the left edge; a **vertical column of ten project images**, centered on screen, that **translates upward** so each image passes through the middle of the viewport in turn; and a bottom-right **list of ten project names** where each name **slides up within its own slice of the scroll** and **turns white while it is the active project**. The image currently crossing the horizontal midline **brightens from 50% to full opacity**. Smooth scroll via Lenis. There is a plain intro screen before and a plain outro screen after. This is **not a GSAP timeline** — it is a single pinned `ScrollTrigger` whose `onUpdate` callback drives everything with `gsap.set` off `self.progress`.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`ScrollTrigger`**.
- **`lenis`** — smooth scroll.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```

Run everything inside `document.addEventListener("DOMContentLoaded", …)`. No other plugins, no SplitText, no CustomEase, no Three.js.

## Layout / HTML
Three full-screen `<section>`s in order: `.intro`, `.spotlight`, `.outro`. Class names are load-bearing — the JS/CSS query them.

```html
<section class="intro">
  <p>A collection of selected works</p>
</section>

<section class="spotlight">
  <div class="project-index">
    <h1>01/10</h1>
  </div>

  <div class="project-images">
    <div class="project-img"><img src="…" alt="" /></div>
    <div class="project-img"><img src="…" alt="" /></div>
    <!-- …ten .project-img wrappers total, each with one <img> -->
  </div>

  <div class="project-names">
    <p>Human Form Study</p>
    <p>Interior Light</p>
    <p>Project 21</p>
    <p>Shadow Portraits</p>
    <p>Everyday Objects</p>
    <p>Unit 07 Care</p>
    <p>Motion Practice</p>
    <p>Noonlight Series</p>
    <p>Material Stillness</p>
    <p>Quiet Walk</p>
  </div>
</section>

<section class="outro">
  <p>Scroll complete</p>
</section>

<script type="module" src="./script.js"></script>
```

Notes:
- `.project-images` holds **exactly 10** `.project-img` wrappers (each one `<img>`). `.project-names` holds **exactly 10** `<p>`. The two counts must match — the counter, the name windows and the image column are all keyed to `totalProjectCount = 10`.
- The counter starts as literal text `01/10`; JS overwrites its `textContent` every frame.
- Use the neutral demo copy verbatim. "PrototypeStudio" is the fictional demo brand — no real client names. Intro paragraph: `A collection of selected works`. Outro paragraph: `Scroll complete`. The ten project names above are arbitrary editorial titles.

## Styling
Fonts: **Inter** for body, **Space Grotesk** for the display headings, **Space Mono** for the small uppercase labels and hints.

Palette — a deep aubergine night with a violet mesh and two soft glass accents:
```css
:root {
  --bg: #17141f;
  --ink: #f5f3f7;
  --muted: #6f6a82;        /* inactive project names */
  --accent: #8b5cf6;       /* violet */
  --accent-warm: #f0a884;
  --accent-cool: #5eead4;
  --glass: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.15);
}
```
- Page background: `var(--bg)`, lifted by a `body::before` mesh gradient.
- Text: `var(--ink)`. Inactive project name: `var(--muted)`; the active one animates to `var(--ink)`.

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { font-family:"Inter", sans-serif; background-color: var(--bg); color: var(--ink); }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1 { font-family:"Space Grotesk", sans-serif; font-size:clamp(3rem, 5vw, 7rem); line-height:1; }`
- `p { font-size:clamp(1.35rem, 2.6vw, 1.9rem); font-weight:400; line-height:1.35; letter-spacing:-0.01em; color: var(--ink); }`

Sections:
- `section { position:relative; width:100%; height:100svh; padding:2rem; overflow:hidden; }` — every section is exactly one viewport tall with a **2rem padding** (this padding value is read by the JS, so keep it at `2rem`).
- `.intro, .outro { display:flex; justify-content:center; align-items:center; text-align:center; }` — a single centered line of copy.

`.project-index` (the counter) — no special positioning of its own; it sits in the normal flow at the top-left of the padded `.spotlight`. Its `h1` is the element GSAP moves.

`.project-images` (the centered image column):
- `position:absolute; top:0; left:50%; transform:translateX(-50%);` — horizontally centered.
- `width:35%;` — the column is 35% of viewport width; each image is 16:9 within it.
- `padding:50svh 0;` — **half-a-viewport of top and bottom padding** (this is what lets the first/last images sit near mid-screen at the extremes of scroll).
- `display:flex; flex-direction:column; gap:0.5rem;`
- `z-index:-1;` — the column sits **behind** the counter and names.

`.project-img`:
- `width:100%; aspect-ratio:16/9; overflow:hidden;`
- `opacity:0.5;` — **dimmed by default**.
- `transition:all 0.3s ease;` — so the JS-driven opacity flip eases smoothly.

`.project-names` (bottom-right name list):
- `position:absolute; right:2rem; bottom:2rem; display:flex; flex-direction:column; align-items:flex-end;` — right-aligned stack anchored to the bottom-right corner.
- `.project-names p { color: var(--muted); font-weight:500; letter-spacing:-0.01em; transition:color 0.3s ease; }` — dim by default, eased color change.

Performance hint (keep it): `.project-index h1, .project-images, .project-names p { will-change:transform; }`.

## GSAP effect (the important part — be exhaustive)

### Lenis ↔ GSAP wiring
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

### Grab elements + measure geometry (all measured once, at load)
```js
const spotlightSection        = document.querySelector(".spotlight");
const projectIndex            = document.querySelector(".project-index h1");
const projectImgs             = document.querySelectorAll(".project-img");        // 10
const projectImagesContainer  = document.querySelector(".project-images");
const projectNames            = document.querySelectorAll(".project-names p");    // 10
const projectNamesContainer   = document.querySelector(".project-names");
const totalProjectCount       = projectNames.length;                             // 10

const spotlightSectionHeight  = spotlightSection.offsetHeight;                   // ≈ 100svh
const spotlightSectionPadding = parseFloat(getComputedStyle(spotlightSection).padding); // 2rem → 32
const projectIndexHeight      = projectIndex.offsetHeight;                       // counter h1 height
const containerHeight         = projectNamesContainer.offsetHeight;             // name-list height
const imagesHeight            = projectImagesContainer.offsetHeight;            // tall image column (10 imgs + gaps + 100svh padding)

// Travel distances:
const moveDistanceIndex  = spotlightSectionHeight - spotlightSectionPadding * 2 - projectIndexHeight;  // + (counter slides DOWN)
const moveDistanceNames  = spotlightSectionHeight - spotlightSectionPadding * 2 - containerHeight;     // + (names slide UP by -value)
const moveDistanceImages = window.innerHeight - imagesHeight;                                          // − (column slides UP)

const imgActivationThreshold = window.innerHeight / 2;  // the horizontal midline of the viewport
```
- `moveDistanceIndex` is the vertical span from the top of the padded content box to where the counter's bottom edge reaches the bottom of that box → the counter travels **down** by this many px across the full scroll.
- `moveDistanceNames` is the analogous span for the name list → each name travels **up** by up to this much (applied negatively).
- `moveDistanceImages` is `innerHeight − imagesHeight`, a **negative** number (the column is far taller than the viewport), so multiplying by progress translates the column **upward**.

### The single pinned ScrollTrigger (no timeline — everything in `onUpdate`)
```js
ScrollTrigger.create({
  trigger: ".spotlight",
  start: "top top",
  end: `+=${window.innerHeight * 5}px`,   // pinned/scrubbed across FIVE viewport heights
  pin: true,
  pinSpacing: true,
  scrub: 1,                                // 1s catch-up smoothing on the scrub
  onUpdate: (self) => {
    const progress = self.progress;        // 0 → 1 over the 5vh runway

    // 1) COUNTER TEXT — which project index are we on (1-based, clamped to 10)
    const currentIndex = Math.min(
      Math.floor(progress * totalProjectCount) + 1,
      totalProjectCount,
    );
    projectIndex.textContent =
      `${String(currentIndex).padStart(2, "0")}/${String(totalProjectCount).padStart(2, "0")}`;
    // → "01/10", "02/10", … "10/10"

    // 2) COUNTER POSITION — slide the h1 straight down
    gsap.set(projectIndex, { y: progress * moveDistanceIndex });

    // 3) IMAGE COLUMN — translate the whole column upward
    gsap.set(projectImagesContainer, { y: progress * moveDistanceImages });

    // 4) IMAGE OPACITY — brighten whichever image is crossing the midline
    projectImgs.forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.top <= imgActivationThreshold && r.bottom >= imgActivationThreshold) {
        gsap.set(img, { opacity: 1 });     // the image spanning the viewport's vertical center
      } else {
        gsap.set(img, { opacity: 0.5 });   // everything else stays dimmed
      }
    });

    // 5) PROJECT NAMES — each name owns a 1/10 slice of progress
    projectNames.forEach((p, index) => {
      const startProgress = index / totalProjectCount;
      const endProgress   = (index + 1) / totalProjectCount;
      const projectProgress = Math.max(
        0,
        Math.min(1, (progress - startProgress) / (endProgress - startProgress)),
      );

      gsap.set(p, { y: -projectProgress * moveDistanceNames });  // slide UP within its window

      if (projectProgress > 0 && projectProgress < 1) {
        gsap.set(p, { color: "#f5f3f7" }); // active → --ink
      } else {
        gsap.set(p, { color: "#6f6a82" }); // idle → --muted
      }
    });
  },
});
```

Precise behavior of each sub-effect:
- **Counter number** — `Math.floor(progress * 10) + 1`, capped at 10. It steps `01/10 → 10/10` as you scrub; the `/10` denominator is `totalProjectCount` zero-padded. It only reads `10/10` at the very end (the `Math.min` clamp).
- **Counter slide** — a simple linear `y = progress * moveDistanceIndex` (a `gsap.set`, so it tracks the scrub 1:1). Moves the big `01/10` from the top of the padded box down to the bottom.
- **Image column** — `y = progress * moveDistanceImages` (moveDistanceImages is negative), so the tall centered column glides upward the whole scroll. Because of the `50svh` top/bottom padding, at `progress ≈ 0` the first image sits near the vertical center and at `progress ≈ 1` the last image sits near the vertical center; in between, each of the ten images passes through the midline in sequence.
- **Image activation** — every frame, each image's live `getBoundingClientRect()` is tested: if the viewport midline (`innerHeight/2`) falls between the image's `top` and `bottom`, that image is set to `opacity:1`, all others to `opacity:0.5`. Combined with the CSS `transition:all 0.3s ease`, the "spotlight" image brightens as it reaches center and dims as it leaves. Exactly one image is typically full-opacity at a time.
- **Name windows** — the ten names divide the 0→1 progress into ten equal slices. Name `index` is "active" only while `progress` is inside `[index/10, (index+1)/10)`; within that slice its local `projectProgress` ramps 0→1. It uses that local ramp to (a) slide up by `-projectProgress * moveDistanceNames` and (b) hold color `#f5f3f7`. Outside its slice `projectProgress` clamps to 0 or 1, the name returns to `#6f6a82`, and its `y` sits at `0` (before its slice) or `-moveDistanceNames` (after its slice — i.e. it stays parked up). The CSS `transition:color 0.3s ease` softens the grey↔white flip.

**No ease/duration/stagger anywhere** — every motion is a `gsap.set` inside `onUpdate`, so the *only* easing/smoothing is (a) ScrollTrigger's `scrub: 1` on the driving progress and (b) the two CSS `transition`s (0.3s ease on image opacity and name color). No `gsap.to`/`gsap.timeline` is used. No SplitText, CustomEase, lerp/rAF interpolation, or Three.js.

## Assets / images
**Ten landscape 16:9 photos**, each rendered `100%` width/height with `object-fit:cover` inside a column that is 35% of viewport width — so they read as a vertical portfolio strip. Source them roughly landscape 16:9; the exact crop doesn't matter (`cover` handles it). The set mixes **studio portraits** with **object and architecture studies**, all shot dark and directional so they sit inside the aubergine page rather than punching holes in it: an athlete stretching against a plain backdrop; a woman in headphones under warm studio light; a sunlit minimal interior with leaf shadows; a close portrait in sunglasses under hard light; a sculptural lamp on a plinth under a spotlight; an architectural model under raking light; a cyclist against a dark olive backdrop; a chrome-and-glass composition in a dark studio; a low-light portrait with film grain; a profile against a deep amber wall. No brands or logos anywhere.

- **Responsive** (`@media (max-width:1000px)`): the image column relaxes to `width: calc(100% - 4rem)` and `gap: 25svh` (near-full-width images spaced far apart), and every project name is forced to full ink (`.project-names p { color: var(--ink) !important; }`) since the dim/active distinction is less useful at that size. The pin + scrub effect still runs.
- Keep the `will-change:transform` hints on the counter h1, the image column and the name paragraphs.
- No reduced-motion handling in the original.

## Images

This component ships with 10 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/prototypestudio-scroll-animation/img1.jpg
https://motionprompts.dev/c/prototypestudio-scroll-animation/img10.jpg
https://motionprompts.dev/c/prototypestudio-scroll-animation/img2.jpg
https://motionprompts.dev/c/prototypestudio-scroll-animation/img3.jpg
https://motionprompts.dev/c/prototypestudio-scroll-animation/img4.jpg
https://motionprompts.dev/c/prototypestudio-scroll-animation/img5.jpg
… 4 more under https://motionprompts.dev/c/prototypestudio-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--muted`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, reaches into the page with six separate `document.querySelector`/`querySelectorAll` calls, and drives its entire animation out of one `ScrollTrigger.create({ onUpdate })` that runs for the life of the page — there is no timeline, no per-tween cleanup to reason about, just a single pinned trigger and a callback that keeps calling `gsap.set`. React withdraws all three of those guarantees at once — the fired-once startup, the document-wide reach, the assumption that nothing outlives this instance — and it does it quietly.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component is unusually exposed to that, because it pins `.spotlight` with `pin: true, pinSpacing: true` and an `end` of five viewport-heights. Leave the first `ScrollTrigger` alive when the second mount creates its own on the same section, and GSAP inserts a second pin spacer stacked on the first: the spotlight now needs **ten** viewport-heights of scroll to reach the outro, not five, and both triggers write to the same counter, image column and name list from two different `progress` values on every scroll frame. The visible symptom is a spotlight that jitters between two positions and a scroll distance that doubled, and none of it reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no `readyState` guard first. By the time a React component mounts, that event has already fired, so the listener is never called and the whole body — the Lenis instance, the six element lookups, the five `moveDistance*`/`imgActivationThreshold` measurements, and the `ScrollTrigger.create` call — silently never runs. Delete the listener and move its body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` already sits at module scope, above the listener; leave it there.

*(2) Element lookups* — Every lookup here is an unscoped `document.querySelector`/`querySelectorAll`: `.spotlight`, `.project-index h1`, all ten `.project-img`, `.project-images`, all ten `.project-names p`, and `.project-names` itself. Scope every one of them to a root ref on the `.spotlight` section instead. This bites harder here than in most of the catalogue, because `totalProjectCount` isn't a constant — it's `projectNames.length`, read straight off the query result. If an unscoped `querySelectorAll(".project-names p")` ever returned more than ten nodes — the instant during a StrictMode remount when two copies of the subtree exist, or a second copy of this section elsewhere on the page — every fraction downstream would be computed against the wrong total with no error to point at the cause: the counter's `/10` denominator, the `Math.floor(progress * totalProjectCount)` step that picks `currentIndex`, and each name's own `startProgress`/`endProgress` window.

*(3) Cleanup* — Create Lenis, then wrap the six element lookups, the geometry measurements and the `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref, and revert it in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    // lenis wiring, the six lookups, the five measurements, ScrollTrigger.create(...)
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`gsap.ticker.add((time) => { lenis.raf(time * 1000); })` is not covered by that revert — a ticker subscription is neither a tween nor a trigger — so keep the function reference and call `gsap.ticker.remove` on it explicitly, and call `lenis.destroy()` alongside it. This component owns its Lenis instance outright (nothing else in this document shares scroll), so only skip creating one if the host page already runs Lenis, per the note above about smooth scroll being a document-level resource.

### `ctx.revert()` kills the trigger, not the twenty-two elements it was styling

This is where the generic context rule bites hardest on this component specifically. `gsap.context` only records what runs during the factory's synchronous pass, and that covers exactly the `ScrollTrigger.create(...)` call — so revert does kill the trigger and undo the pin/spacer correctly. It does **not** cover anything the trigger's `onUpdate` does, and `onUpdate` is where the whole animation actually lives: every scroll frame it calls `gsap.set` on the counter `h1` (position), on `.project-images` (position), on all ten `.project-img` (opacity), and on all ten `.project-names p` (position and color) — twenty-two elements, none of it recorded by the context, because those calls happen later, from a callback GSAP invokes on its own schedule, not while the factory is running. `ctx.revert()` stops future `onUpdate` calls but leaves whatever inline `transform`, `opacity` and `color` those twenty-two elements were carrying at the moment of teardown, and `projectIndex.textContent` — a plain string write, not a GSAP property at all — is invisible to GSAP under any circumstances. On the StrictMode remount, the new trigger starts fresh at the current scroll position, but the DOM nodes still show whatever frame the previous instance froze until the next `onUpdate` fires: the counter can briefly read a stale project number, and an image or name that happened to be mid-transition stays stuck bright or white.

Register a resetter through the context so the cleanup can call it before reverting, using the named form of `self.add` — not the one-argument form, which would run immediately instead of later:

```jsx
const ctx = gsap.context((self) => {
  // ...ScrollTrigger.create(...)
  self.add("reset", () => {
    gsap.set([projectIndexEl, projectImagesEl, ...projectImgEls, ...projectNameEls], {
      clearProps: "transform,opacity,color",
    });
    projectIndexEl.textContent = `01/${String(totalProjectCount).padStart(2, "0")}`;
  });
}, rootRef);
return () => {
  ctx.reset();
  ctx.revert();
};
```

Inside the factory this variable is `self`, never `ctx` — `const ctx = gsap.context(...)` has not finished assigning while the factory body is still running, and ScrollTrigger can invoke `onUpdate` synchronously during setup, still inside that same window, so writing `ctx.add` anywhere in there throws `Cannot access 'ctx' before initialization` and takes the whole tree down. `ctx.reset()` in the snippet above is called from the returned cleanup, well after the factory has finished — that's the one place `ctx` itself is the right name.

### The counter's text is not React state

`currentIndex`/`projectIndex.textContent` looks exactly like the value a React component keeps in `useState` and renders as `{currentIndex}/10` — a number that changes on scroll is the shape state usually takes. Don't: the pinned trigger's scrub means `onUpdate` fires on effectively every animation frame the browser produces while the user is scrolling, and routing that count through `setState` would re-render this component, and everything under it, at that same rate. Keep it exactly as imperative as the original — write straight to the counter element's `textContent` inside `onUpdate`, the same way the position, opacity and color writes on the other twenty-one elements stay outside React's render cycle entirely.
