---
slug: project-page-overlay-animation
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 2
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Project Overview Modal — Click-to-Reveal Sliding Detail Overlay

## Goal
Build a full-screen **project index**: a numbered list of projects sits at the bottom-left of a dark, non-scrolling viewport. Clicking any list row plays a **paused GSAP timeline** that slides a large white detail panel **up from far off-screen** while **un-rotating it from a 20° tilt to flat**, landing it pinned to the bottom-right. The panel's content (title, category, copy, link, image) is swapped in from a data array for whichever row you clicked. Clicking **Close**, or anywhere outside the panel, **reverses the same timeline** and the panel tilts and drops back off-screen. The star effect is that single tilt-corrected slide-up driven by one reversible timeline.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** only — **no GSAP plugins**, no ScrollTrigger, no Lenis, no SplitText.
```js
import gsap from "gsap";
import { data } from "./data.js";   // project content lives in a sibling module
```
No framework. `script.js` is loaded as `<script type="module" src="./script.js">` at the end of `<body>`, so it runs after the DOM is parsed — no `DOMContentLoaded` wrapper needed. The whole effect is **one `gsap.timeline({ paused: true })` with a single `.to()` tween**, played/reversed on click. Project a Vite-style dev server that resolves the npm import.

## Layout / HTML
Four top-level blocks in `<body>`: a fixed `.nav`, a fixed `.footer`, the hidden `.overlay` panel, and the `.container` holding the list. Class/ID names are load-bearing — the JS/CSS query them.

```html
<body>
  <div class="nav">
    <p>Nanotech</p>          <!-- fictional demo brand, top-left -->
    <p>Showreel</p>          <!-- top-right -->
  </div>

  <div class="footer">
    <p>Nanotech 2023 &copy;</p>   <!-- bottom-right -->
  </div>

  <!-- The white detail panel, parked far off-screen and tilted -->
  <div class="overlay">
    <div class="overlay-header">
      <div class="col">
        <h1 id="item-name">Item 1</h1>
        <p id="item-category">Item Category</p>
      </div>
      <div class="col">
        <p id="close-btn">Close</p>
      </div>
    </div>
    <div class="item-details">
      <p><a id="item-link" href="#"><i class="icon-arrow-up-right"></i> View Site</a></p>
      <p id="item-copy">Lorem ipsum dolor sit amet…</p>
    </div>
    <div class="img-container">
      <img id="item-img" src="(img-1)" alt="" />
    </div>
  </div>

  <!-- The project index -->
  <div class="container">
    <div class="items">
      <div class="item">
        <div class="item-index">01</div>
        <div class="item-name">Advanced Nanotech Fabrics</div>
        <div class="item-year">2022</div>
      </div>
      <!-- …9 more .item rows… -->
    </div>
  </div>

  <script type="module" src="./script.js"></script>
</body>
```

**The 10 list rows** (index / name / year — three flex columns per row):
```
01  Advanced Nanotech Fabrics            2022
02  Natural Bio-luminescent Accents      2021
03  Integrated Electronic Wearables      2023
04  Dynamic Morphing Clothing            2021
05  3D Holographic Prints                2017
06  Atmospheric Aero-adaptable Garments  2018
07  Responsive Skinsync Attire           2019
08  Sustainable Zero-waste Weavings      2023
09  Lab-crafted Synthetic Leather        2022
10  Neuro-responsive Fashion Gear        2021
```

The link's leading `<i>` is an **arrow-up-right glyph**: `<i class="ph-bold ph-arrow-up-right">`, from the Phosphor icon font — see **Icons** below for where to get it. Any icon font or inline SVG arrow works instead, or omit it.

### `data.js` — the swap-in content (one object per list row, same order)
Export `const data = [ … ]; export { data };`. Each object has `itemName`, `itemCategory`, `itemLink` (all `"#"`), `itemCopy` (a ~50-word marketing paragraph), and `itemImg` (path to one of the 5 images). The overlay `itemName` is a shortened form of the list-row name (e.g. row "Advanced Nanotech Fabrics" → overlay "Nanotech Fabrics"). Categories cycle among a few labels like "Eco-Futurism Line", "Neural Nuance", "Galactic Glam", "Digital Elegance". **Images cycle 1→5 then repeat:** items 1 & 6 use `img-1`, items 2 & 7 use `img-2`, 3 & 8 → `img-3`, 4 & 9 → `img-4`, 5 & 10 → `img-5`.

## Styling
Global reset `* { margin:0; padding:0; box-sizing:border-box }`. Font: a **neutral sans-serif** (original references a proprietary face "Aeonik"; any clean grotesque like Inter / `system-ui` matches).

**Palette (exact hex):**
- `#0f0f0f` — page background (near-black).
- `#fff` — page text, and the **overlay panel background**.
- `#000` — text color inside the white overlay (and link color).

**Page shell — the page never scrolls:**
```css
html, body { width:100vw; height:100vh; overflow:hidden; background:#0f0f0f; color:#fff; }
h1 { font-weight:500; margin-bottom:0.5em; }
a  { text-decoration:none; color:#000; }
img { width:100%; height:100%; object-fit:cover; }
```

**Nav / footer (fixed chrome):**
```css
.nav { position:fixed; width:100%; padding:2em; display:flex; justify-content:space-between; }
.footer { position:fixed; bottom:0; right:0; padding:2em; }
```

**Container + list (bottom-left):**
```css
.container { width:100%; height:100%; display:flex; justify-content:flex-start; align-items:flex-end; padding:2em; }
.items { position:absolute; width:50%; display:flex; flex-direction:column; }   /* left half */
.item  { display:flex; padding:0.25em 0.5em; cursor:pointer; }
.item-index { flex:1; }   /* narrow */
.item-name  { flex:4; }   /* wide */
.item-year  { flex:1; }   /* narrow */
```

**The overlay panel — this CSS defines the animation's START state.** It is parked `1200px` below the viewport and rotated `20deg`, tilting up from its bottom-center pivot:
```css
.overlay {
  position:absolute; bottom:-1200px; right:0;      /* far below the screen */
  width:70%; height:700px; padding:2em;
  background:#fff; color:#000;
  overflow-x:hidden; overflow-y:scroll;            /* the panel scrolls internally… */
  z-index:2;
  will-change:bottom;
  transform:translateZ(0) rotate(20deg);           /* …tilted 20° at rest */
  transform-origin:bottom center;
}
.overlay::-webkit-scrollbar { display:none; }      /* hide its scrollbar */
```

**Overlay internals:**
```css
.overlay-header { width:100%; display:flex; justify-content:space-between; align-items:flex-end; padding:2em 0; }
.col:nth-child(1) { flex:3; }   /* title + category */
.col:nth-child(2) { flex:2; }   /* Close */
#close-btn { cursor:pointer; opacity:0.4; }

.item-details { width:100%; display:flex; justify-content:space-between; padding:1em 0 4em 0; }
.item-details p:nth-child(1) { flex:3; }   /* the View-Site link */
.item-details p:nth-child(2) { flex:2; }   /* the copy paragraph */

.img-container { width:100%; padding-bottom:2em; }   /* the detail image fills the panel width */
```

## GSAP effect (be exhaustive)

There is exactly **one paused timeline holding one tween**, plus three click handlers. All positional/rotational start values live in CSS (above); the timeline animates them to the resting/on-screen state.

### The timeline (built once, on load)
```js
const overlay  = document.querySelector(".overlay");
const closeBtn = document.querySelector("#close-btn");

const tl = gsap.timeline({ paused: true, overwrite: "auto" });
tl.to(overlay, {
  duration: 0.5,
  bottom: "0px",                  // slides UP: bottom -1200px → 0px
  rotation: 0,                    // un-tilts: 20deg → 0deg
  transformOrigin: "bottom center",
  ease: "power2.out",
});
```
- **`paused: true`** — nothing plays until a click.
- **`overwrite: "auto"`** — a rapid re-click won't stack conflicting tweens.
- The tween animates the panel **from its CSS start state** (`bottom:-1200px`, `rotate(20deg)`) **to** `bottom:0px`, `rotation:0` in **0.5 s** with **`power2.out`** (fast start, gentle settle). Because it pivots about `bottom center`, the panel appears to swing upright as it rises into the bottom-right corner.
- No stagger, no delay, no labels — a single tween is the whole timeline.

### Open — click a list row → `tl.play()` + swap content
```js
const items = document.querySelectorAll(".item");
items.forEach((item, index) => {
  item.addEventListener("click", () => {
    tl.play();                    // play forward from current position
    updateOverlay(data[index]);   // fill panel with THIS row's data
  });
});

function updateOverlay(dataItem) {
  const itemName     = document.querySelector("#item-category").previousElementSibling; // the <h1>
  const itemCategory = document.querySelector("#item-category");
  const itemLink     = document.querySelector("#item-link");
  const itemCopy     = document.querySelector("#item-copy");
  const itemImg      = document.querySelector("#item-img");

  itemName.textContent     = dataItem.itemName;
  itemCategory.textContent = dataItem.itemCategory;
  itemLink.href            = dataItem.itemLink;
  itemCopy.textContent     = dataItem.itemCopy;
  itemImg.src              = dataItem.itemImg;
}
```
`tl.play()` always drives the same timeline **forward**, so clicking a different row while the panel is already open just re-fills the content in place (the panel is already at `bottom:0`, so the tween has nothing left to travel).

### Close — button, and click-outside → `tl.reverse()`
```js
closeBtn.addEventListener("click", () => { tl.reverse(); });

document.addEventListener("click", (e) => {
  if (!overlay.contains(e.target) && !isItem(e.target)) {
    tl.reverse();               // clicking empty space closes the panel
  }
});
function isItem(target) { return target.closest(".item"); }
```
`tl.reverse()` plays the exact same tween backward: the panel **re-tilts to 20°** and **drops back to `bottom:-1200px`** over 0.5 s (the `power2.out` ease reads as `power2.in` in reverse). The document-level guard reverses on any click that is **neither inside the overlay nor on a list item**, so clicking a row never immediately re-closes it.

### Net choreography
1. Load: panel invisible, parked 1200px below and tilted 20°.
2. Click row *n*: content swaps to `data[n]`; panel **slides up + straightens** into the bottom-right corner in 0.5 s (`power2.out`).
3. Click Close or any empty area: panel **tilts back + slides down** off-screen in 0.5 s (reversed tween).

No SplitText, CustomEase, lerp/rAF loop, ScrollTrigger, Three.js, or canvas — just this one reversible `power2.out` slide-and-rotate.

## Icons

This component uses **Phosphor Icons (web) 2.1.2** — `<i class="ph-bold ph-arrow-up-right">`.
It is an icon **font**, so all it needs is the stylesheet for the `bold` weight; there is no
JavaScript involved.

The demo serves its own copy, pinned and content-hashed. Point at it directly, or download it and
serve it from your own origin:

```
https://motionprompts.dev/c/_vendor/phosphor-icons-web-2.1.2.6e87cf5a/bold/style.css
https://motionprompts.dev/c/_vendor/phosphor-icons-web-2.1.2.6e87cf5a/bold/Phosphor-Bold.woff2
```

```html
<link rel="stylesheet" href="/c/_vendor/phosphor-icons-web-2.1.2.6e87cf5a/bold/style.css" />
```

The stylesheet references its `.woff2` with a relative URL, so keep the two files side by side if
you host them yourself (`npm i @phosphor-icons/web@2.1.2` →
`node_modules/@phosphor-icons/web/src/bold/`). Do **not** use the package's own `index.js`:
it injects the stylesheets from `cdn.jsdelivr.net`.

Any equivalent icon set is an acceptable substitute — keep the element and its selectors so the
animation still has something to target.

## Assets / images
**5 editorial fashion photographs**, full-bleed (shown `object-fit:cover`, filling the panel's full width — roughly portrait/3:4). Mood: **futuristic, high-fashion, avant-garde** — models in sculptural techwear / iridescent fabrics / metallic and bio-luminescent styling against clean studio or moody sets. They are the detail image shown inside the white overlay, one per project, cycling `img-1`…`img-5` and repeating for rows 6–10. No brands or logos.

## Behavior notes
- **No scroll on the page** — `html, body { overflow:hidden }`; the only scrollable region is inside the open overlay (its scrollbar hidden). The effect is entirely **click-driven**, not scroll-driven.
- **Fully reversible** off one timeline: the same 0.5 s tween opens and closes; state is preserved so mid-flight clicks just reverse direction (`overwrite:"auto"` guards against tween pile-up).
- **Responsive** (`max-width: 900px`): `.items { width:100%; bottom:8em; }` (list spans full width, lifted off the bottom); `.overlay { width:100%; height:100vh; }` (panel becomes a full-screen sheet). The GSAP tween is unchanged.
- No reduced-motion branch in the original; if adding one, swap the slide for an instant show/hide.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/project-page-overlay-animation/img-1.jpg
https://motionprompts.dev/c/project-page-overlay-animation/img-2.jpg
https://motionprompts.dev/c/project-page-overlay-animation/img-3.jpg
https://motionprompts.dev/c/project-page-overlay-animation/img-4.jpg
https://motionprompts.dev/c/project-page-overlay-animation/img-5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--paper-ink`, `--fg`, `--muted`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two `.item` listeners each calling `updateOverlay` on the same click, two document-level outside-click listeners each closing over their own timeline. The visible symptom is content flashing between two rows before it settles, or the panel refusing to close on some outside clicks and not others — and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script runs at the top level, the moment the module is evaluated: `const overlay = document.querySelector(".overlay")`, the timeline build, the `.item` loop, the close-button listener and the document-level listener all fire at import time, before your component has rendered the `.overlay` panel or the ten `.item` rows they all depend on. Move the entire body — timeline construction through the document listener at the bottom — into a `useEffect` with an empty dependency array. Do not leave it in the component body: that reruns on every render, rebuilding the timeline and re-adding every listener each time.

*(2) Element lookups* — Every selector here assumes the script owns the document: `.overlay`, `#close-btn`, the `.item` rows, and inside `updateOverlay`, `#item-category`, `#item-link`, `#item-copy`, `#item-img`. Give the component a root ref, render it on the element wrapping both `.overlay` and `.container`, and scope each lookup to it. One of them needs more than scoping: `updateOverlay` finds the title not by querying `#item-name` but by walking sideways from the category paragraph — `document.querySelector("#item-category").previousElementSibling`. That DOM-order dependency is fragile even in the original page, and more so once the markup is JSX your own component renders: give the `<h1>` its own ref and write to it directly instead of relying on it being the category paragraph's immediate predecessor. The outside-click guard's `overlay.contains(e.target)` needs the same treatment — `overlayRef.current.contains(e.target)`.

*(3) Cleanup* — Wrap the timeline in a `gsap.context` scoped to the root ref, and tear the document-level listener down in the same effect so the two die together:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ paused: true, overwrite: "auto" });
    tl.to(overlayRef.current, {
      bottom: "0px",
      rotation: 0,
      transformOrigin: "bottom center",
    });
    timelineRef.current = tl;
  }, rootRef);

  const handleOutsideClick = (e) => {
    if (!overlayRef.current.contains(e.target) && !e.target.closest(".item")) {
      timelineRef.current.reverse();
    }
  };
  document.addEventListener("click", handleOutsideClick);

  return () => {
    document.removeEventListener("click", handleOutsideClick);
    ctx.revert();
  };
}, []);
```

`ctx.revert()` undoes exactly what the factory created between the `gsap.context` call and now: the tween, and the inline `bottom` / `transform` / `rotation` styles it wrote onto the panel. It does not know about `handleOutsideClick`, or about the two other listeners the original script wires with plain `addEventListener` — the per-`.item` click and the close button — because none of the three are GSAP objects. That is why the example above removes the document listener by hand, in the same return: it is the one listener with nowhere else to live, since "anywhere that isn't the panel or a row" has no element of its own to hang an `onClick` off of. The other two do have one: convert the `.item` loop and the close button to JSX props — `onClick={() => { updateOverlay(dataItem); timelineRef.current.play(); }}` per row, `onClick={() => timelineRef.current.reverse()}` on `#close-btn` — and React attaches and detaches those for you, so two of the script's three listeners stop needing manual bookkeeping entirely.

Skipping the manual removal on the one that's left is not cosmetic: a StrictMode remount leaves the first effect's `handleOutsideClick` attached, its closure still pointing at the first effect's `tl` — a timeline the first effect's `ctx.revert()` has already killed. The next outside click reaches both the stale and the live listener, and whichever fires last decides whether the panel actually closes, changing from click to click.
