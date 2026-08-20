# Griflan Hover Effect — Elastic Service Rows with Falling Physics Tags

## Goal
Build a dark, full-viewport list of **three stacked "service" rows**, each a single huge uppercase word (`SILHOUETTE`, `CHROMA`, `PERSONA`). On **hover** a row does three things at once: it springs open to more than double its height with a bouncy elastic tween, a **fanned stack of three overlapping images** slides up into view from behind the title, and the title **recolors from red to cream**. Then, 0.2s later, the row's category **tags — pill-shaped labels — drop in from the top under real gravity** (a Matter.js physics simulation), bounce, and settle in a little heap on an invisible floor at the bottom of the row. On **mouseleave** the tags fade out, the images slide back down behind the title, the color returns to red, and the row springs shut. The star effect is the combination of the elastic expand + image-stack reveal + physics-driven tag drop.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) and `matter-js` (npm) — **no GSAP plugins, no smooth-scroll, no Three.js**. GSAP drives the row expand/collapse, the image slide, the color change and the tag opacity; Matter.js runs a per-row rigid-body world that makes the tags fall and pile up. Ship one `index.html` (`<link rel="stylesheet" href="./styles.css">` and `<script type="module" src="./script.js">`), one `styles.css`, one ES-module `script.js`. Must run in a fresh Vite + npm project.

## Layout / HTML
```html
<section class="services">
  <div class="service"
       data-tags="Editorial, Fashion Identity, Monochrome, Shadow Play, Minimalism, Studio Portraits">
    <div class="service-name"><h1>Silhouette</h1></div>
    <div class="service-images">
      <div class="img"><img src="<row1 image 1>" /></div>
      <div class="img"><img src="<row1 image 2>" /></div>
      <div class="img"><img src="<row1 image 3>" /></div>
    </div>
  </div>

  <div class="service"
       data-tags="Color Theory, Graphics, Poster Design, Saturation, Pop Art, Visual Energy">
    <div class="service-name"><h1>Chroma</h1></div>
    <div class="service-images">
      <div class="img"><img src="<row2 image 1>" /></div>
      <div class="img"><img src="<row2 image 2>" /></div>
      <div class="img"><img src="<row2 image 3>" /></div>
    </div>
  </div>

  <div class="service"
       data-tags="Character Design, Portraits, Visual Storytelling, Emotion, Identity, Artistic Direction">
    <div class="service-name"><h1>Persona</h1></div>
    <div class="service-images">
      <div class="img"><img src="<row3 image 1>" /></div>
      <div class="img"><img src="<row3 image 2>" /></div>
      <div class="img"><img src="<row3 image 3>" /></div>
    </div>
  </div>
</section>
```
- Exactly **three `.service` rows**, each with the same internal structure: a `.service-name > h1` (the giant word) plus a `.service-images` wrapper holding **three `.img` boxes**, each with one `<img>`.
- Each row carries a **`data-tags`** attribute: a **comma-separated** list of ~6 short category labels. The JS reads it with `.split(",")` (labels keep their leading space — do not trim). These strings become the physics pills.
- The `.tags-container` and each `.tag` element are **created at runtime by the JS** (not authored in HTML), but the `.tag` CSS class must exist in the stylesheet so runtime measurement and styling are correct.

## Styling

**Fonts** (Google Fonts): the titles use **`"Barlow Condensed"` weight 900**; the pill tags use **`"Instrument Serif"`**. Import both.

**Palette**
- Section background: `#171717` (near-black).
- Title default color: `#ff3831` (bright red). Title hover color: `#FFFFD9` (cream).
- Tag text/border: `#ffffd9` (cream) on a `#171717` fill.

**Reset / base**: `* { margin:0; padding:0; box-sizing:border-box; }`. `img { width:100%; height:100%; object-fit:cover; }`.

**Section** — `.services { position:relative; width:100%; height:100svh; padding:2rem; background:#171717; color:#ff3831; display:flex; flex-direction:column; justify-content:center; align-items:center; }` (the three rows stack vertically, centered on screen).

**Row** — `.service { position:relative; width:max-content; height:10rem; display:flex; align-items:flex-end; will-change:height; overflow:hidden; cursor:pointer; }`. The row is only as wide as its word; **`overflow:hidden` is essential** — it clips the fanned images (which live above the title) and the falling tags to the row's box. Height is the animated property.

**Title** — `.service-name h1 { position:relative; text-transform:uppercase; font-family:"Barlow Condensed",sans-serif; font-size:10rem; font-weight:900; letter-spacing:-0.1rem; line-height:1; background-color:#171717; z-index:2; }`. The **solid `#171717` background on the `h1` is load-bearing**: it paints over the lower part of the image stack so the images look like they emerge from *behind* the letters. `z-index:2` keeps the title above the images.

**Image wrapper** — `.service-images { position:absolute; top:0%; left:50%; transform:translate(-50%,0%); width:25rem; height:20rem; overflow:hidden; }` (centered horizontally over the row, anchored to its top).

**Image boxes** — `.img { position:absolute; top:50%; left:50%; transform:translate(-50%,50%); width:15rem; height:10rem; border-radius:0.35rem; overflow:hidden; }`. All three start translated **down** by 50% of their own height (`translate(-50%,50%)`), so at rest they sit low behind the title. They are fanned:
- `.img:nth-child(1) { transform-origin:bottom left; transform:translate(-50%,50%) rotate(-5deg); margin-top:-1.5rem; }`
- `.img:nth-child(2) { transform-origin:bottom right; transform:translate(-50%,50%) rotate(2.5deg); margin-top:-1.5rem; }`
- `.img:nth-child(3)` keeps the default (no rotation) and sits on top of the fan.

**Tag pill** — `.tag { position:absolute; font-family:"Instrument Serif",sans-serif; color:#ffffd9; background:#171717; border:1px solid #ffffd9; border-radius:4rem; padding:0.5rem 1.5rem; white-space:nowrap; opacity:0; will-change:transform,opacity; }`. Fully rounded (border-radius 4rem) so it reads as a lozenge. Starts invisible (opacity 0) and is positioned/rotated only via inline `transform` written each frame by the physics loop.

**Tags container** — `.tags-container { position:absolute; top:0; left:0; width:100%; height:100%; z-index:10; pointer-events:none; }` (overlays the whole row, above the images, and never eats hover events).

## GSAP + Matter.js effect (be exhaustive)

### Imports & setup
```js
import gsap from "gsap";
import Matter from "matter-js";

const services = document.querySelectorAll(".service");
const { Engine, World, Bodies, Body } = Matter;
```

### Measuring pill sizes up front
Before any physics, measure each pill's rendered size so the rigid bodies match the DOM. A helper creates a throwaway `.tag`, appends it to `<body>`, reads `offsetWidth`/`offsetHeight`, and removes it:
```js
function getTagDimensions(label) {
  const ghost = document.createElement("div");
  ghost.classList.add("tag");
  ghost.textContent = label;
  document.body.appendChild(ghost);
  const size = { width: ghost.offsetWidth, height: ghost.offsetHeight };
  ghost.remove();
  return size;
}
```
Per row: `tagLabels = service.dataset.tags.split(",")` and `tagSizes = tagLabels.map(getTagDimensions)`.

### Per-row state
For each `.service`, capture `serviceImages = service.querySelectorAll(".img")` (the 3 boxes) and `serviceName = service.querySelector("h1")`, and hold mutable state: `engine`, `tagElements[]`, `tagBodies[]`, `rafId`, `tagsContainer`, `isHovered` (bool), `tagDropTimer` (a GSAP delayedCall handle).

### `createTags()` — build the physics world and drop the pills
1. Call `cleanupTags()` first (idempotent reset).
2. Read `serviceWidth = service.offsetWidth`, `serviceHeight = service.offsetHeight` (the *expanded* size, since this runs after the row has grown).
3. Create a `div.tags-container` and append it to the row.
4. `engine = Engine.create({ gravity: { x: 0, y: 2 } })` — gravity points down at 2× the Matter default, so tags fall briskly.
5. Build three **static** boundary bodies with `wallThickness = 20` and `floorOffset = window.innerWidth < 1000 ? 25 : 50`:
   - **Floor**: `Bodies.rectangle(serviceWidth/2, serviceHeight - floorOffset + wallThickness/2, serviceWidth*3, wallThickness, { isStatic:true })` — a wide bar set **`floorOffset` px above the row's bottom edge**, so the pile settles a little inset from the bottom.
   - **Left wall**: `Bodies.rectangle(-wallThickness/2, serviceHeight/2, wallThickness, serviceHeight*3, { isStatic:true })`.
   - **Right wall**: `Bodies.rectangle(serviceWidth+wallThickness/2, serviceHeight/2, wallThickness, serviceHeight*3, { isStatic:true })`.
   - `World.add(engine.world, [floor, leftWall, rightWall])`.
6. For each label `i`:
   - Create a `div.tag`, set `textContent = label`, append to the container.
   - `tagWidth = tagSizes[i].width`, `tagHeight = tagSizes[i].height`.
   - Spawn position: `startX = serviceWidth*0.25 + Math.random()*serviceWidth*0.5` (random within the middle 50% of the row), `startY = -(tagHeight/2) - i*5` (just above the top, each successive pill nudged 5px higher so they don't spawn stacked exactly).
   - `angle = (Math.random() - 0.5) * 0.4` (a small random tilt, ±0.2 rad).
   - `body = Bodies.rectangle(startX, startY, tagWidth, tagHeight, { chamfer:{ radius: tagHeight/2 }, restitution:0.15, friction:0.6, density:0.002 })` — **chamfer radius = half the height** rounds the rectangle into a true pill shape; low restitution (0.15) = little bounce; high friction (0.6) so they don't slide; light density (0.002).
   - `Body.setAngle(body, angle)`, then `World.add(engine.world, body)`.
   - **Fade the pill in with GSAP**: `gsap.to(tagElement, { opacity:1, duration:0.3, delay:i*0.04, ease:"power2.out" })` — a staggered 0.04s-per-tag reveal.
   - Push into `tagElements` / `tagBodies`.
7. Start a **rAF loop** `update()`: each frame call `Engine.update(engine, 1000/60)` (fixed ~16.67ms step), then for every tag write `tagElement.style.transform = translate(${body.position.x - tagWidth/2}px, ${body.position.y - tagHeight/2}px) rotate(${body.angle}rad)` (convert the body's center-based position to the element's top-left, and mirror its rotation). Store `rafId = requestAnimationFrame(update)` and re-arm each frame.

### `cleanupTags()`
`cancelAnimationFrame(rafId)`, `Engine.clear(engine)`, remove the `tagsContainer` from the DOM, and reset `tagElements=[]`, `tagBodies=[]`, `engine=null`, `rafId=null`, `tagsContainer=null`.

### `mouseenter` (open the row)
```js
isHovered = true;
const expandedHeight = window.innerWidth < 1000 ? "12.5rem" : "25rem";
gsap.killTweensOf(service);
gsap.killTweensOf(serviceImages);
gsap.killTweensOf(serviceName);
```
Then run three tweens in parallel:
- **Row height** → `gsap.to(service, { height: expandedHeight, duration:0.75, ease:"elastic.out(1,0.5)" })` — the springy over-shoot open.
- **Title color** → `gsap.to(serviceName, { color:"#FFFFD9", duration:0.25, ease:"power4.out" })` (red → cream, fast).
- **Image stack** → `gsap.to(serviceImages, { y:"-50%", duration:0.75, ease:"elastic.out(1,0.5)", stagger:0.075 })`. This animates each `.img`'s translateY **from its CSS rest of `+50%` up to `-50%`** (i.e. the fan slides up from behind/below the title into full view above it). The `stagger:0.075` makes the three images arrive one after another with the same elastic spring.
- **Delayed tag drop** → `tagDropTimer = gsap.delayedCall(0.2, () => { if (isHovered) createTags(); })`. After 200ms — only if the pointer is still over the row — the physics tags spawn and fall.

### `mouseleave` (close the row)
```js
isHovered = false;
const collapsedHeight = window.innerWidth < 1000 ? "5rem" : "10rem";
if (tagDropTimer) tagDropTimer.kill();          // cancel a pending drop
gsap.killTweensOf(service);
gsap.killTweensOf(serviceImages);
gsap.killTweensOf(serviceName);
```
- **Fade out & remove tags**: `if (tagElements.length) gsap.to(tagElements, { opacity:0, duration:0.25, ease:"power2.out", onComplete:cleanupTags });` else call `cleanupTags()` directly (covers leaving before the 0.2s drop fired).
- **Title color** → `gsap.to(serviceName, { color:"#ff3831", duration:0.25, ease:"power4.out" })` (cream → red).
- **Image stack** → `gsap.to(serviceImages, { y:"50%", duration:0.75, ease:"elastic.out(1,0.5)", stagger:0.075 })` (slide back down behind the title).
- **Row height** → `gsap.to(service, { height: collapsedHeight, duration:0.5, ease:"elastic.out(1,0.75)" })` — note the **collapse is faster (0.5s) and stiffer** (`elastic.out(1,0.75)`) than the open.

### Timing / easing summary
| Action | property | from → to | duration | ease | stagger/delay |
|---|---|---|---|---|---|
| open row | `height` | 10rem → 25rem (5→12.5 mobile) | 0.75 | `elastic.out(1,0.5)` | — |
| open title | `color` | `#ff3831` → `#FFFFD9` | 0.25 | `power4.out` | — |
| open images | `y` | `50%` → `-50%` | 0.75 | `elastic.out(1,0.5)` | 0.075 |
| tag drop | (physics spawn) | — | — | — | delayedCall 0.2s |
| tag fade-in | `opacity` | 0 → 1 | 0.3 | `power2.out` | delay i×0.04 |
| close tags | `opacity` | 1 → 0 | 0.25 | `power2.out` | — |
| close title | `color` | `#FFFFD9` → `#ff3831` | 0.25 | `power4.out` | — |
| close images | `y` | `-50%` → `50%` | 0.75 | `elastic.out(1,0.5)` | 0.075 |
| close row | `height` | 25rem → 10rem (12.5→5 mobile) | 0.5 | `elastic.out(1,0.75)` | — |

## Assets / images
**Stylized editorial portrait illustrations**, provided as small sets per row (the JS references up to three `<img>` per `.service`). The real asset set is **8 images** — three for row 1, three for row 2, two for row 3, some reused across rows. Each is framed **3:2 landscape** (roughly 1200×800, displayed in a 15rem×10rem box with `object-fit:cover`). All images share **one consistent visual language** — flat, graphic pop-art / silkscreen illustration of a single head-and-shoulders figure with **cool blue-toned (monochrome-blue) skin**, bold black linework and cel-shading, set against a **flat single-color background**; no photos, no client or third-party branding. Backgrounds vary across a small palette of **warm cream, mid/cobalt blue, and bright red**, with sparse yellow accents (gold hoop earrings, sunglasses, striped knit). The actual subjects: a short-haired figure in a **white cap and dark jacket on a cream ground**; a wavy-haired figure in a **cream/off-white blazer with a gold earring on a cobalt-blue ground**; a figure in **yellow sunglasses and a blue-yellow striped sweater on a red ground**; and a **bob-haired figure in a blue-and-cream striped top on a blue ground** — all rendered in the same blue-skinned illustrated style.

Because every image reads the same graphically, the effect does not depend on per-row themes: any set of 3 same-style portraits works, and sets may reuse the same illustrations. Keep them tonally consistent so the fanned stack looks like one collection.

Within each row the three images fan as: **image 1** rotated −5° (back-left), **image 2** rotated +2.5° (back-right), **image 3** flat on top.

## Behavior notes
- **Per-row independent physics**: each service builds and tears down its own Matter.js engine on hover in/out — never a shared world. The rAF loop only runs while a row is open; `cleanupTags()` fully disposes it.
- **Race-safe drop**: the tag drop is a 0.2s `delayedCall` guarded by `if (isHovered)`, and `mouseleave` kills that timer — quickly flicking across a row never leaves orphaned tags.
- **Kill-before-tween**: every hover handler calls `gsap.killTweensOf()` on the row, images and title first, so rapid re-hover snaps cleanly to the new target instead of queuing conflicting elastic tweens.
- **Responsive (`< 1000px` / CSS `max-width:999px`)**: row height 5rem→12.5rem (vs 10→25rem), title 5rem, image wrapper 12.5rem×10rem, image boxes 7.5rem×5rem (margin-top −0.75rem), smaller tag padding/font, and `floorOffset` 25 (vs 50). The layout is otherwise identical; the effect is pointer/hover-driven so it targets desktop.

## Images

This component ships with 9 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/griflan-hover-effect/service_1_img_1.jpg
https://motionprompts.dev/c/griflan-hover-effect/service_1_img_2.jpg
https://motionprompts.dev/c/griflan-hover-effect/service_1_img_3.jpg
https://motionprompts.dev/c/griflan-hover-effect/service_2_img_1.jpg
https://motionprompts.dev/c/griflan-hover-effect/service_2_img_2.jpg
https://motionprompts.dev/c/griflan-hover-effect/service_2_img_3.jpg
… 3 more under https://motionprompts.dev/c/griflan-hover-effect/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--vermilion`, `--bone`, `--cobalt`, `--bone-dim`, `--bone-faint`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: `mount()` runs once against `document`, wires a `mouseenter`/`mouseleave` pair onto each of the three `.service` rows, and never expects to be asked to run a second time except through its own editor's re-mount contract — the `destroy()` it returns exists for the knob-tuning tool, not because a plain page ever calls it. React withdraws the "never has to undo itself" half of that contract while keeping the "may run twice" half, and it does it quietly: the rows still expand and spring shut on hover, right up until the pointer that would trip the failure finds it.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen — on the *same* three `.service` nodes, since StrictMode's double-invoke does not remount the DOM in between. Two independent closures each end up with their own `mouseenter`/`mouseleave` listener bound to the same row. Hover it once and both fire: two elastic height tweens race on the same `.service`, two staggered image-stack tweens fight over the same three `.img` boxes, and — the expensive half of the doubling — two independent `gsap.delayedCall`s each build their own Matter `Engine`, append their own `.tags-container` into the same row, and start their own `requestAnimationFrame` loop stepping physics nobody asked for twice. `createTags()`'s own call to `cleanupTags()` at its top only resets *that closure's* state; it has no way to see or stop the sibling closure's engine, so the two simulations run side by side, each convinced it owns the row. None of this reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The bootstrap at the bottom of the file checks `window.MP` for the editor runtime, and otherwise guards `DOMContentLoaded` behind `document.readyState`. Both branches are dead weight in React: there is no `window.MP` in a deployed app, and `useEffect` already runs after the DOM this component measures — `service.offsetWidth`, `service.offsetHeight`, used to size the physics boundaries — has committed. Delete the whole `if (window.MP...) / else` block and the `boot` wrapper, and move the body of `mount(config)` — from `services.forEach` through the per-row closures it builds — into a `useEffect` with an empty dependency array. `DEFAULTS` (`expandedHeight`, `gravity`, `restitution`, `friction`, `floorOffset`, `dropSpread`) stops being a config object an external editor hands to `mount`; read those as local constants inside the effect, or lift the ones a host app actually needs to vary into props. `WALL_THICKNESS` was never a knob and stays a plain in-effect constant either way.

*(2) Element lookups* — `services = document.querySelectorAll(".service")` is exactly the query behind the doubled-listener failure above: give the section a root ref and query `rootRef.current.querySelectorAll(".service")` instead, so each effect run only ever binds to the copy of the subtree it actually owns. The per-row lookups nested inside the loop — `service.querySelectorAll(".img")`, `service.querySelector("h1")` — are already scoped off `service` and need no change. `getTagDimensions()` reaches further than any of those, though: its throwaway ghost `.tag` is appended straight to `document.body` to read `offsetWidth`/`offsetHeight` before any pill exists. That's harmless while `.tag`'s rule lives in a global stylesheet, but the moment this component is dropped into a host app and `.tag` gets renamed or nested under a scoping class — exactly what "Using this outside its demo page" above tells you to do — a ghost node appended to `document.body` falls outside that scope, picks up unstyled font metrics, and hands the physics bodies a size that no longer matches what the real `.tag` elements render at. Append the ghost node under the root ref instead of `document.body`.

*(3) Cleanup* — This script is unusual for the catalogue in already shipping a real teardown: the closure each row pushes into `teardowns` — removing both listeners, killing `tagDropTimer`, calling `cleanupTags()`, then `gsap.killTweensOf` and `clearProps:"all"` on `service`/`serviceImages`/`serviceName` — is functionally the effect's cleanup already, written for the editor's re-mount path. Porting it is mostly a matter of routing its GSAP half through a `gsap.context` instead of the manual kill-and-clear calls, and carrying its Matter/rAF half across close to verbatim.

**GSAP.** The row's tweens are not created during the effect's synchronous setup — `onEnter`, `onLeave`, and the tag-fade tweens inside `createTags` all run later, from a DOM event or a delayed call, well after `useEffect` has already returned. A `gsap.context` that only wraps the listener registration auto-tracks nothing, because nothing runs synchronously inside its factory. Register the handlers as named context methods instead, and call those from the DOM listeners:

```jsx
const ctx = gsap.context((self) => {
  self.add("onEnter", () => { /* the elastic height/color/image tweens, plus the delayedCall that arms the tag drop */ });
  self.add("onLeave", () => { /* the reverse tweens and the tag fade-out */ });
  self.add("createTags", () => { /* build the Matter world, append tagsContainer, start the rAF loop */ });
}, rootRef);
service.addEventListener("mouseenter", () => ctx.onEnter());
service.addEventListener("mouseleave", () => ctx.onLeave());
```

so a call routed through `ctx.onEnter()` — or the delayed `ctx.createTags()` the armed `gsap.delayedCall` fires later — gets tracked the same as if it had run inside the original factory. `ctx.revert()` then kills every elastic tween, the still-pending `tagDropTimer`, and the tag opacity tweens together, and clears the inline `height`/`color`/`transform` styles GSAP wrote — the same job the script's own `gsap.killTweensOf` plus `clearProps:"all"` calls are doing by hand today.

**Matter.js and the rAF loop.** There is no `Matter.Runner` here — `update()` is a hand-rolled loop that calls `Engine.update(engine, …)` once per frame and then writes each tag's position straight onto its element's inline `transform`, re-arming itself through `requestAnimationFrame` into `rafId`. `gsap.context` knows nothing about either of these, so keep `cleanupTags()` close to as-is: cancel `rafId` first, so no further frame steps the world or writes a `transform` once cleanup has started, then `World.clear(engine.world, false)` and `Engine.clear(engine)`, then remove `tagsContainer` — which takes every `.tag` div growing out of it along with it. The one change that matters: call `cleanupTags()` unconditionally from the effect's own cleanup, not only from `onLeave`'s fade-out completion. A component that unmounts mid-hover — tags mid-fall, `rafId` still live — has no `mouseleave` left to fire it, and without an unconditional call here the physics world this row built keeps integrating, and the `transform` writes keep landing on DOM nodes React has already discarded.
