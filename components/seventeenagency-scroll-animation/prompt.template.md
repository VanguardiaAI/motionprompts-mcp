---
slug: seventeenagency-scroll-animation
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Infinite-Scroll Contact Page — Center-Crossing Gap "Breathing" + Icon Cycling

## Goal
Build a full-screen, **endlessly looping** contact page. A tall list of contact rows scrolls
vertically forever (seamless infinite loop). As each row passes through the vertical center of
the viewport, the horizontal **gap between its label and value expands then snaps back**, giving a
"breathing" pulse to whichever row is centered. Simultaneously, a single **3D icon fixed at the
exact center of the screen swaps to the next shape** every time a new row locks onto center. That
center-crossing gap pulse synced with the icon swap is the star effect.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Build as a fresh Vite project (`npm create vite`,
vanilla template). Install and import from npm:
- `gsap` and the GSAP plugin **`ScrollTrigger`** (`import { ScrollTrigger } from "gsap/ScrollTrigger"`), registered via `gsap.registerPlugin(ScrollTrigger)`.
- **`lenis`** for smooth scrolling, used in **infinite mode** (`new Lenis({ infinite: true })`).

No other plugins (no SplitText, no CustomEase, no Three.js). All row animation is driven by
`ScrollTrigger.onUpdate` callbacks that write inline styles — no gsap tweens on the rows.

## Layout / HTML
Two top-level sections inside `<body>`:

1. `<section class="contact-visual">` — the fixed centered stage. Contains a single
   `<div class="contact-icon">` wrapping one `<img>` (the cycling icon; `src` points to the first
   icon asset, `alt=""`).
2. `<section class="contact-info">` — the scrolling content. It holds **8** rows, each a
   `<div class="contact-info-row">` containing exactly two `<p>` elements: a right-aligned label and
   a muted value. Sample content (fictional demo studio — keep as-is, no real brands):
   - `Address` / `19 Great Street`
   - `Current Time` / `20:40:30 (GMT)`
   - `General Inquiries` / `hello@deadspacelabs.com`
   - `New Business Inquiries` / `business@deadspacelabs.com`
   - `Collaborations` / `Selective Connections`
   - `Job Inquiries` / `hiring@deadspacelabs.com`
   - `Telephone` / `+44 09 9842 2235`
   - `Social Media` / `@Deadspace`

The script clones the `.contact-info` section to create the tall loop (see effect section).

## Styling
- **Font:** import `Stylish` from Google Fonts (`@import url("https://fonts.googleapis.com/css2?family=Stylish&display=swap")`); `body { font-family: "Stylish", sans-serif }`.
- **Palette (CSS vars):** `--base-100: #fff` (text), `--base-200: #4f4f4f` (muted value text),
  `--base-300: #0f0f0f` (page background). Body background = `--base-300`, color = `--base-100`.
- **Reset:** `* { margin:0; padding:0; box-sizing:border-box }`. Hide the scrollbar entirely
  (`::-webkit-scrollbar { display:none }`).
- **Images:** `img { width:100%; height:100%; object-fit:cover }`.
- **Paragraphs:** `font-size: 1.4rem; font-weight: 400; line-height: 0.95; letter-spacing: -0.025rem`.
- **`.contact-visual`:** `position: fixed; top:0; left:0; width:100%; height:100svh;` flexbox
  centered (`justify-content:center; align-items:center`); `overflow:hidden`. It sits on top of the
  scrolling content and never moves.
- **`.contact-icon`:** `position: relative; width: 8rem; height: 8rem;` (the icon is 128×128).
- **`.contact-info`:** `position: relative; width:100%; height:100svh;` flex **column**,
  `justify-content:center; gap:1.5rem; overflow:hidden`. Each cloned copy is exactly one viewport
  tall so rows are evenly distributed down the page.
- **`.contact-info-row`:** `display:flex; justify-content:center; gap:1rem; will-change:gap;`
  (the `gap` is what animates — hint it for perf).
- **Row paragraphs:** `.contact-info-row p { flex: 1 }`; first `<p>` (`:nth-child(1)`) is
  `text-align:right`; second `<p>` (`:nth-child(2)`) uses `color: var(--base-200)`.
- **Responsive `@media (max-width:1000px)`:** `p { font-size: 1rem }` and
  `.contact-icon { width:4rem; height:4rem }`.

## GSAP effect (be precise — this is the core)

### 0. Smooth-scroll + infinite loop plumbing
```
const lenis = new Lenis({ infinite: true });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```
`infinite: true` makes the page wrap seamlessly — scrolling past the end returns to the start with
no visible seam, so the row/icon animation runs forever in both directions.

### 1. Clone the content into a tall column
- Read `const contactRowMaxGap = window.innerWidth < 1000 ? 5 : 10;` (max gap in **rem**; 10 on
  desktop, 5 on mobile).
- Take the single `.contact-info` section and **clone it 10 times**, appending each deep clone
  (`cloneNode(true)`) to its parent (`<body>`). Result: **11** identical `.contact-info` sections
  stacked (1 original + 10 clones), i.e. **88** total `.contact-info-row` elements. This gives the
  infinite scroll enough length to loop smoothly.
- **After** cloning, query all rows: `const contactRows = document.querySelectorAll(".contact-info-row")`.

### 2. Per-row gap pulse (two scrubbed ScrollTriggers each — the breathing effect)
Compute the vertical center of the fixed stage with a helper re-read on every refresh:
```
function getVisualCenter() {
  return contactVisual.offsetTop + contactVisual.offsetHeight / 2;
}
```
(`.contact-visual` is fixed at top:0, so this ≈ half the viewport height.)

For **each** of the 88 rows, create **two** `ScrollTrigger`s (no tweens — pure `onUpdate`
callbacks writing `row.style.gap`). Both use **functional** start/end so they recompute on
`refresh`, `scrub: true`, and the scroller-position keyword `center` (the viewport's vertical
middle):

**Trigger A — EXPAND (gap 1rem → maxGap):**
- `trigger: row`
- `start: () => \`top+=${getVisualCenter() - 550} center\``
- `end:   () => \`top+=${getVisualCenter() - 450} center\``
- `scrub: true`
- `onUpdate: (self) => { const gap = 1 + (contactRowMaxGap - 1) * self.progress; row.style.gap = \`${gap}rem\`; }`
- Effect: over a **100px** scroll band as the row rises toward center, gap interpolates linearly
  from `1rem` up to `maxGap` (10rem desktop / 5rem mobile).

**Trigger B — CONTRACT (gap maxGap → 1rem):**
- `trigger: row`
- `start: () => \`top+=${getVisualCenter() - 400} center\``
- `end:   () => \`top+=${getVisualCenter() - 300} center\``
- `scrub: true`
- `onUpdate: (self) => { const gap = contactRowMaxGap - (contactRowMaxGap - 1) * self.progress; row.style.gap = \`${gap}rem\`; }`
- Effect: over the **next 100px** band, gap interpolates linearly from `maxGap` back down to `1rem`.

Notes on the band geometry: the four hardcoded pixel offsets are `-550, -450, -400, -300` relative
to `getVisualCenter()`. So relative to the moment the row reaches center there is: a 100px **expand**
window, a ~50px **hold** at max gap (between the `-450` end of A and the `-400` start of B), then a
100px **contract** window. The net feel: each row's two columns fan apart as the row nears the
screen center and slam back together just after — a rhythmic pulse row after row. Because it's
scrubbed, it's fully reversible and tied 1:1 to scroll position/velocity (no ease, linear by
`self.progress`).

### 3. Center-locked icon cycling (swap the fixed 3D icon)
Target `const contactIcon = document.querySelector(".contact-icon img")`. Keep two state vars:
`let currentIconIndex = 1;` and `let lastCenteredRow = null;`.

On **`lenis.on("scroll", ...)`** (a second scroll listener), each frame:
```
const viewportCenter = window.innerHeight / 2;
let closestRow = null, minDistance = Infinity;
contactRows.forEach((row) => {
  const rect = row.getBoundingClientRect();
  const rowCenter = rect.top + rect.height / 2;
  const distance = Math.abs(rowCenter - viewportCenter);
  if (distance < minDistance && distance < 25) { minDistance = distance; closestRow = row; }
});
if (closestRow && closestRow !== lastCenteredRow) {
  lastCenteredRow = closestRow;
  currentIconIndex = (currentIconIndex % 7) + 1;      // cycle 1→2→…→7→1
  contactIcon.src = `/path/to/icon_${currentIconIndex}.png`;
}
```
So: whenever a **new** row comes within **25px** of the exact viewport center, advance the icon to
the next of **7** shapes (wrapping 7→1) and set the `<img>` src. The icon change is a hard image
swap (no crossfade), tightly synchronized with each row hitting center — which is also the moment
that row's gap pulse peaks.

## Assets / images
**7** files (`icon_1.jpg` … `icon_7.jpg`), all **PNG on a fully transparent background**, **square
1:1** aspect ratio, displayed at 128×128 (8rem). They are glossy **3D-rendered "Y2K / chrome"
glyphs**, each a distinct figurative sculpture with strong specular highlights and iridescent
edge reflections. The set holds **6 unique subjects** (`icon_7.jpg` is a duplicate of `icon_1.jpg`):
1. **`icon_1.jpg` / `icon_7.jpg`** — a chrome/liquid-metal **robotic hand and forearm** reaching
   up, mirror-silver body with hot pink, red and violet iridescent streaks. This is the one shown
   on load.
2. **`icon_2.jpg`** — a **furry/fuzzy hollow diamond (rhombus) outline**, dominant vivid orange
   fur with lighter yellow-orange highlights.
3. **`icon_3.jpg`** — a glossy chrome **smiley-face outline** (two oval eyes + a smile), purple and
   magenta metallic finish with pink and blue reflections on black.
4. **`icon_4.jpg`** — an inflated, balloon-like glossy **bubble letter "W"**, deep electric blue /
   indigo chrome with white specular highlights.
5. **`icon_5.jpg`** — a translucent **wireframe globe / gridded sphere** (latitude + longitude
   lines), iridescent green-to-teal with faint pink chromatic fringing.
6. **`icon_6.jpg`** — a multi-pointed **3D star pierced by an orbiting ring**, purple-to-magenta
   chrome with blue highlights.
No brand marks; the figurative shapes are decorative studio glyphs. Reference each as
`icon_${n}.png` from your assets path.

## Behavior notes
- **Desktop + mobile:** the only responsive change is `contactRowMaxGap` (10 vs 5 rem, chosen once
  at load by `window.innerWidth < 1000`) plus the CSS font-size/icon-size media query.
- The effect is **scroll-driven and infinite** — it never idles; with Lenis `infinite: true` the
  content wraps forever, so both the gap pulse and icon cycling repeat indefinitely as you scroll
  either direction.
- Order matters: **clone first, then query `.contact-info-row`, then create the ScrollTriggers** so
  every cloned row is animated.
- The `.contact-visual` icon layer is `position: fixed` and stays dead-center; only its `<img>` src
  changes.

## Images

This component ships with 14 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/seventeenagency-scroll-animation/icon_1.jpg
https://motionprompts.dev/c/seventeenagency-scroll-animation/icon_1.jpg
https://motionprompts.dev/c/seventeenagency-scroll-animation/icon_2.jpg
https://motionprompts.dev/c/seventeenagency-scroll-animation/icon_2.jpg
https://motionprompts.dev/c/seventeenagency-scroll-animation/icon_3.jpg
https://motionprompts.dev/c/seventeenagency-scroll-animation/icon_3.jpg
… 8 more under https://motionprompts.dev/c/seventeenagency-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--line`, `--amber`, `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen. This script's own failure mode under that cycle is not the usual doubled
listener — it is doubled *content*: the row list itself grows on every remount, because building
the infinite loop means mutating the DOM by hand, not just animating it.

*(1) The entry point* — the script runs at the top level, the moment the module is evaluated. In
React that is import time, before the component has rendered `.contact-visual` or `.contact-info`,
so `document.querySelector(".contact-info")` would return nothing. Move the whole body — the Lenis
setup, the clone loop, the trigger creation, the icon cycler — into a `useEffect` with an empty
dependency array. Do not leave any of it in the component body: the clone loop must run exactly
once per mount, not once per render.

*(2) Element lookups* — give the component a root ref and scope every lookup to it:
`root.querySelector(".contact-info")`, `root.querySelector(".contact-visual")`,
`root.querySelector(".contact-icon img")`. Keep the original ordering intact — clone
`.contact-info` first, and only call `querySelectorAll(".contact-info-row")` once the ten clones
are already in the DOM, or the `ScrollTrigger.create` calls that follow skip every row inside them.
During a StrictMode remount two copies of the subtree briefly coexist; an unscoped
`document.querySelector` can bind to the copy that is on its way out.

*(3) Cleanup* — this component asks more of cleanup than most, because its effect manufactures DOM
instead of only animating what render already produced:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const lenis = new Lenis({ infinite: true });
  const tickerFn = (time) => lenis.raf(time * 1000);
  const clones = [];

  const ctx = gsap.context(() => {
    const contactInfo = root.querySelector(".contact-info");
    for (let i = 0; i < 10; i++) {
      const clone = contactInfo.cloneNode(true);
      contactInfo.parentElement.appendChild(clone);
      clones.push(clone);
    }
    // query .contact-info-row here, create the two ScrollTriggers per row,
    // and wire the lenis "scroll" listener that advances .contact-icon img
  }, root);

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(tickerFn);

  return () => {
    ctx.revert();
    gsap.ticker.remove(tickerFn);
    lenis.destroy();
    clones.forEach((clone) => clone.remove());
  };
}, []);
```

**What `ctx.revert()` covers, and what it doesn't.** It un-registers everything created during that
synchronous factory pass: the 176 `ScrollTrigger` instances (two per row, across the 88 rows the
clone loop produces). It does **not** cover the ten cloned `.contact-info` sections themselves —
`cloneNode` and `appendChild` are plain DOM calls, not GSAP API, so nothing records them. Skip the
`clones.forEach((clone) => clone.remove())` above and a StrictMode remount finds the same original
`.contact-info` (React still owns that one) sitting untouched, clones it ten more times on top of
the ten orphaned clones the first pass never removed, and ends up feeding fresh triggers to 21
sections and 168 rows instead of 11 and 88. It also does not cover `row.style.gap`: that value is
written by hand inside `onUpdate`, never through a tween, so it is not one of the inline styles a
revert restores — the last gap each row computed stays on the element after teardown instead of
resetting to the base value.

**`gsap.ticker.add` is not covered by the context either.** It drives `lenis.raf`, not a tween or a
trigger, so `ctx.revert()` leaves it running — now calling into a `Lenis` instance the same cleanup
just destroyed. Keep the exact function reference (`tickerFn` above) and remove it with
`gsap.ticker.remove` in the same cleanup that calls `lenis.destroy()`; doing only one half of that
pair still leaves the other pointed at nothing.

**Lenis.** This page runs Lenis in `infinite: true` mode, which is a whole-document scrolling
behavior, not a per-section one. If this contact page ends up as one route inside a larger app that
already runs its own Lenis instance for ordinary scrolling, do not reuse that shared instance here —
switching it to infinite mode to satisfy this component breaks scrolling on every other route.
Create a scoped instance inside this effect and destroy it in the cleanup, as above, rather than
lifting it to the app shell. The two `lenis.on("scroll", …)` subscriptions — the one forwarding to
`ScrollTrigger.update` and the one running the closest-row search for the icon cycler — both go
away with `lenis.destroy()`, since destroying the instance discards its internal emitter along with
them; neither needs its own `.off()`.

**Icon-cycling state.** `currentIconIndex` and `lastCenteredRow` are plain variables the vanilla
script closes over from module scope. Declare them inside the effect instead (or as refs, if
something else in the component needs to read the current icon) so each mount starts a fresh cycle
at the first icon with the centered-row tracker reset to nothing. Carrying either value over from a
reverted instance would make the icon resume mid-cycle, or fail to advance on the first row that
re-crosses center, against triggers that no longer exist.
