---
slug: creative-clutter
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 2
structural:
  - { kind: duration, literal: "1.25", rule: value/narrated }
  - { kind: ease, literal: "\"power3.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Creative Clutter — Flip Layout Switch

## Goal
Build a full-viewport, light "messy desk" hero: **11 cut-out desk objects** (music player card, CD, error dialog, folder icon, mini computer, ruled paper, passport, portrait poster, app icon, lighter, cursor) float at scattered positions and angles around a **centered display headline block**. Three small icon buttons at the bottom switch between **three named arrangements** — `chaos` (a random-looking scatter), `cleanup` (a tidier, un-rotated spread with the header pushed to the right), and `notebook` (a tight cluster). The star effect: on each button press, **GSAP Flip** captures the current layout and smoothly morphs every object AND the header from its old position/size/rotation to the new one, with a slow `power3.inOut` ease and a center-out stagger, so the whole desk re-organizes itself in one fluid choreographed move.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`Flip`** (imported from `gsap/all` and registered with `gsap.registerPlugin(Flip)`). No smooth-scroll, no other libraries. Ship one `index.html` (`<link rel="stylesheet" href="./styles.css">` and `<script type="module" src="./script.js">`), one `styles.css`, one ES-module `script.js`. Must run in a fresh Vite + npm project.

## Layout / HTML
```html
<section class="desk">
  <div class="header">
    <h1>Creative Clutter</h1>
    <p>The best ideas live somewhere between a coffee stain and a half-open
       folder, scattered things have a way of finding others when you stop
       trying to organize.</p>
  </div>

  <div class="item" id="music"><img src="<music player card>" /></div>
  <div class="item" id="cd"><img src="<compact disc>" /></div>
  <div class="item" id="dialog"><img src="<retro error dialog>" /></div>
  <div class="item" id="folder"><img src="<folder icon>" /></div>
  <div class="item" id="macmini"><img src="<mini desktop computer>" /></div>
  <div class="item" id="paper"><img src="<ruled notebook sheet>" /></div>
  <div class="item" id="passport"><img src="<passport booklet>" /></div>
  <div class="item" id="portrait"><img src="<framed portrait poster>" /></div>
  <div class="item" id="appicon"><img src="<rounded-square app icon>" /></div>
  <div class="item" id="lighter"><img src="<disposable lighter>" /></div>
  <div class="item" id="cursor"><img src="<arrow cursor + spinner>" /></div>

  <div class="modes">
    <button class="active" data-mode="chaos" aria-label="Chaos mode"><svg…/></button>
    <button data-mode="cleanup" aria-label="Cleanup mode"><svg…/></button>
    <button data-mode="notebook" aria-label="Notebook mode"><svg…/></button>
  </div>
</section>
```
- Every draggable object is a `.item` with a **unique `id`** (`music`, `cd`, `dialog`, `folder`, `macmini`, `paper`, `passport`, `portrait`, `appicon`, `lighter`, `cursor`) — the JS keys sizes and per-mode positions off these ids.
- `.modes` holds exactly three `<button>` elements, each with a `data-mode` of `chaos` / `cleanup` / `notebook`. The first (`chaos`) starts with class `active`. Icons are inline monoline SVGs (`stroke="currentColor"`, `stroke-width="32"`, viewBox `0 0 512 512`): a **lightning bolt** for chaos, a **2×2 rounded-square grid** for cleanup, an **open book** for notebook.

## Styling

**Fonts**: body **Inter**; headline **Space Grotesk**; the small uppercase labels and the mode pills **Space Mono**. Two voices on purpose — the grotesk pair is the machine, the mono is the label-maker.

**Palette (CSS vars on `:root`)**
```css
:root {
  --desk: #f2f2f2;      /* the page: a cool neutral desk */
  --desk-hi: #f7f7f7;
  --desk-low: #e8e8ea;
  --desk-edge: #dfdfe2;
  --card: #ffffff;      /* the mode pills at rest */
  --ink: #16161a;
  --muted: #2b2b31;
  --accent: #ff4e45;    /* one warm red: the active pill and the spellcheck squiggle */
}
```

**Reset**: `* { margin:0; padding:0; box-sizing:border-box; }`. `body { font-family:"Inter", sans-serif; background: var(--desk); color: var(--ink); }`. `img { width:100%; height:100%; object-fit:contain; }` (so each object keeps its own aspect ratio, centered inside its square box).

**Stage** — `.desk { position:relative; width:100%; height:100svh; max-width:1400px; margin:0 auto; }`. This element's measured `offsetWidth`/`offsetHeight` drive all position math.

**Header** — `.header { position:absolute; width:400px; text-align:center; display:flex; flex-direction:column; gap:0.75rem; pointer-events:none; z-index:10; }`.
- `.header h1 { font-family:"Space Grotesk"; font-weight:600; font-size:clamp(3rem, 5.6vw, 4.8rem); letter-spacing:-0.03em; line-height:0.98; text-wrap:balance; }` — and one word inside it is an `<em>` reset to `font-style:normal` and given `text-decoration: underline wavy var(--accent)`: the spellcheck moment, which is where the single red lives.
- `.lede { font-size:0.95rem; line-height:1.7; color: var(--muted); max-width:40ch; margin:0 auto; }`

**Items** — `.item { position:absolute; will-change:top,left,transform; }`. They are positioned entirely by GSAP via inline transforms + inline `width`/`height` (see below), never by CSS coordinates.

**Mode buttons** — `.modes { position:fixed; bottom:7.5svh; left:50%; transform:translateX(-50%); display:flex; gap:0.5rem; z-index:10; }`.
- `.modes button { display:flex; align-items:center; gap:0.45rem; padding:0.6rem 1.05rem; font-family:"Space Mono"; font-size:0.6875rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color: var(--ink); background: var(--card); border:1px solid rgba(22,22,26,.16); border-radius:999px; box-shadow:0 1px 2px rgba(22,22,26,.07); cursor:pointer; }` — pills with a label, not bare icon squares.
- `.modes button:active { transform:scale(0.9); }`
- `.modes button.active { background: var(--accent); border-color: var(--accent); color: var(--ink); }` — the active mode is the warm red pill.

**Responsive**
- `@media (max-width:1400px) { .desk { overflow-x:hidden; } }`
- `@media (max-width:1000px)`: overlay a semi-transparent wash with `.desk::after { content:""; position:absolute; inset:0; width:100%; height:100%; background-color:rgba(245,242,237,0.5); }`, and desaturate the objects with `.item { filter:saturate(0); }`.

## GSAP effect (be exhaustive)

### Plugin & targets
```js
import gsap from "gsap";
import { Flip } from "gsap/all";
gsap.registerPlugin(Flip);

const desk    = document.querySelector(".desk");
const header  = document.querySelector(".header");
const items   = gsap.utils.toArray(".item");   // the 11 objects
const flipTargets = [header, ...items];         // 12 elements flip together
const switches = document.querySelectorAll(".modes button");
let activeMode = "chaos";
```

### Object sizes (square box, px — used as both `width` and `height`)
```
music: 325   appicon: 100   cd: 400    cursor: 125   dialog: 300   folder: 150
lighter: 225   macmini: 250   paper: 375   passport: 250   portrait: 375
```
Each object's box is square; `object-fit:contain` letterboxes the real image inside it.

### Arrangements (per-mode data)
Positions are **percentages of the desk's width (`x`) and height (`y`)**, applied as `gsap.set` translate offsets (top-left of the box lands at that percent point; values can be negative or >100 so boxes bleed off-stage). `rotation` in degrees. The header also carries `x`/`y` percentages plus a `center` flag.

**chaos** — `header {x:50, y:47.5, center:true}`
```
music    x:-2.5  y:-2.5  r:-15      appicon  x:20    y:15    r:5
cd       x:72.5  y:5     r:0        cursor   x:72.5  y:75    r:0
dialog   x:80    y:60    r:15       folder   x:90    y:50    r:5
lighter  x:2.5   y:45    r:-10      macmini  x:9.5   y:55    r:15
paper    x:5     y:15    r:10       passport x:-2.5  y:65    r:-35
portrait x:65    y:20    r:-5
```

**cleanup** — `header {x:70, y:37.5, center:false}`  (header shifts right, no center-offset, all objects un-rotated)
```
music    x:76.5  y:-5    r:0        appicon  x:64.5  y:6     r:0
cd       x:0     y:47.5  r:0        cursor   x:63.5  y:23    r:0
dialog   x:34.5  y:59    r:0        folder   x:24.5  y:33    r:0
lighter  x:-6    y:3.5   r:0        macmini  x:82.5  y:66    r:0
paper    x:9     y:-3.5  r:0        passport x:60    y:65.5  r:0
portrait x:36.5  y:5.5   r:0
```

**notebook** — `header {x:50, y:47.5, center:true}`  (tight, tilted cluster)
```
music    x:45    y:0.5   r:20       appicon  x:65    y:70    r:25
cd       x:27.5  y:15    r:10       cursor   x:75    y:35    r:0
dialog   x:30    y:57.5  r:10       folder   x:25    y:40    r:10
lighter  x:30    y:7.5   r:30       macmini  x:50    y:50    r:-5
paper    x:10    y:10    r:-30      passport x:16.5  y:50    r:-20
portrait x:57.5  y:20    r:10
```

### `setLayout(mode)` — writes the target layout instantly (no animation)
```js
function setLayout(mode) {
  const deskWidth  = desk.offsetWidth;
  const deskHeight = desk.offsetHeight;
  const layout     = arrangements[mode];
  const isMobile   = deskWidth < 1000;

  // header offset: subtract half its own size only when centered (or always on mobile)
  const offsetX = isMobile ? header.offsetWidth  / 2
                : layout.header.center ? header.offsetWidth  / 2 : 0;
  const offsetY = isMobile ? header.offsetHeight / 2
                : layout.header.center ? header.offsetHeight / 2 : 0;
  const headerX = isMobile ? 50   : layout.header.x;
  const headerY = isMobile ? 47.5 : layout.header.y;

  gsap.set(header, {
    x: (headerX / 100) * deskWidth  - offsetX,
    y: (headerY / 100) * deskHeight - offsetY,
    rotation: 0,
  });

  layout.items.forEach(({ id, x, y, rotation }) => {
    gsap.set(`#${id}`, {
      x: (x / 100) * deskWidth,
      y: (y / 100) * deskHeight,
      width:  itemSizes[id],
      height: itemSizes[id],
      rotation,
    });
  });
}
```
Notes: the header's percent point is `(x,y)`, and when `center:true` (chaos, notebook) we subtract half the header's own width/height so it is centered on that point; in `cleanup` (`center:false`) the header's top-left anchors at the point instead, sliding it toward the right. On mobile (`deskWidth < 1000`) the header is forced to the centered `(50, 47.5)` position regardless of mode.

### `switchMode(mode)` — the Flip morph (the star effect)
```js
function switchMode(mode) {
  if (mode === activeMode) return;
  const state = Flip.getState(flipTargets);   // record current position/size/rotation of all 12
  setLayout(mode);                            // jump them to the new layout instantly
  Flip.from(state, {
    duration: 1.25,
    ease: "power3.inOut",
    stagger: { amount: 0.1, from: "center" },
    absolute: true,
  });
  activeMode = mode;
}
```
- **Mechanism**: `Flip.getState` snapshots the header + all 11 objects. `setLayout` mutates them to the destination layout in a single frame. `Flip.from(state, …)` then plays the animation **from** the recorded snapshot **to** the now-current layout, tweening `x`, `y`, `width`, `height`, and `rotation` for each element simultaneously.
- **duration**: `1.25` s. **ease**: `"power3.inOut"` (slow start, fast middle, slow settle). **stagger**: `{ amount: 0.1, from: "center" }` — total 0.1 s of stagger spread across the 12 targets, radiating out from the center of the array so the middle objects lead and the outer ones follow. **absolute**: `true` — Flip pins each element to `position:absolute` for the duration so the staggered moves don't reflow each other.
- No opacity/scale keyframes; the entire visual change is position + size + rotation interpolation.

### Wiring
```js
setLayout("chaos");   // initial paint, no animation

switches.forEach((btn) => {
  btn.addEventListener("click", () => {
    switches.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    switchMode(btn.dataset.mode);
  });
});

window.addEventListener("resize", () => setLayout(activeMode));
```
On resize, `setLayout(activeMode)` re-runs to re-derive pixel positions from the new desk size — **instant, no Flip animation** (only mode-button clicks trigger the Flip morph).

## Assets / images
11 cut-out objects, each a **PNG on a transparent background**, framed roughly to fit inside a square box (the box side equals the size listed above; images are `object-fit:contain`, so real aspect ratios vary):
1. `music` — a light, minimal "now playing" music-player UI card with album art, track title, progress bar and playback controls.
2. `cd` — a shiny silver compact disc, top-down, with rainbow light refractions.
3. `dialog` — a small retro OS-style error dialog window with a title bar, warning icon and an OK button.
4. `folder` — a plain glossy OS-style folder icon in flat **teal / turquoise** with a soft rounded tab, no emblem or label, and a faint magenta rim glow (roughly landscape, slightly wider than tall).
5. `macmini` — a compact **silver / aluminium** square desktop-computer unit seen from a top-front 3/4 angle, with a small dark logo emblem centered on its top face and a subtle magenta edge glow (near-square footprint).
6. `paper` — a neat stack of blank **white** printer/paper sheets seen from a 3/4 isometric angle, edges lightly defined, with a faint magenta rim shadow (landscape crop, clearly wider than tall).
7. `passport` — a brown leather passport booklet with embossed lettering and a small silver compass resting on it.
8. `portrait` — an illustrated stylized side-profile portrait poster of a person, with a white border and soft drop shadow (reads like a framed print).
9. `appicon` — a **near-black / charcoal** rounded-square app icon inside a bright **silver-white** frame, filled with thin white geometric guide lines (concentric circles, diagonals and a grid), wrapped in a soft **pink/magenta** outer glow (square).
10. `lighter` — a **green** disposable pocket lighter standing upright, with a brushed-**silver** metal hood and a small **red** ignition button (tall portrait crop, much taller than wide).
11. `cursor` — a black arrow cursor next to a rainbow spinning wait-cursor / beachball.

No client or third-party branding anywhere; keep the sticky-note text neutral.

## Behavior notes
- **Desktop-first**: the scatter is tuned for wide viewports; below 1000px the objects desaturate (`filter:saturate(0)`), a translucent wash is laid over the desk, and the header is force-centered.
- Layout is fully **derived from percentages of the live desk size**, so it stays correctly placed on every resize.
- The Flip morph fires **only on a mode-button click** and is a no-op if you click the already-active mode. Repeated switching between the three modes should always animate cleanly because `Flip.getState` re-reads the true current layout each time.

## Images

This component ships with 11 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/creative-clutter/appicon.png
https://motionprompts.dev/c/creative-clutter/cd.png
https://motionprompts.dev/c/creative-clutter/cursor.png
https://motionprompts.dev/c/creative-clutter/dialog.png
https://motionprompts.dev/c/creative-clutter/folder.png
https://motionprompts.dev/c/creative-clutter/lighter.png
… 5 more under https://motionprompts.dev/c/creative-clutter/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--desk`, `--desk-hi`, `--desk-low`, `--desk-edge`, `--card`, `--ink`, `--muted`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script runs at the top level, the moment the module is evaluated: the `desk`, `header`, `items` and `switches` lookups, the `itemSizes` and `arrangements` tables, and the three closing statements — the initial `setLayout("chaos")` paint, the `switches.forEach` click wiring, and the `resize` listener — all execute at import time, before your component has rendered the eleven `.item` boxes or the three mode buttons. Move all of it into a `useEffect` with an empty dependency array. Do not leave it in the component body: that re-runs on every render and would stack a second set of click and resize listeners on top of the ones already attached.

*(2) Element lookups* — `desk` and `header` are captured once via `document.querySelector` and reused for the object's whole life; `items` is captured once via `gsap.utils.toArray(".item")`. Give the root `<section class="desk">` a ref and reuse it as `desk` — it is the same element `gsap.context`'s scope argument needs anyway — and put a second ref on `.header`, since `setLayout` reads its own `offsetWidth`/`offsetHeight` to center or offset it. The `.item` collection and the per-object `gsap.set(\`#${id}\`, …)` calls inside `setLayout` don't need refs of their own: once everything runs inside a `gsap.context` scoped to the root, GSAP resolves every string selector called within it — class or id — against that root's descendants instead of the whole document. That matters most for the id lookups, because ids are only unique within one copy of the DOM, and during the StrictMode remount two copies of the eleven objects exist for an instant, each with its own `#cd`, `#folder`, and so on. An unscoped `#id` lookup returns whichever copy is first in document order, not necessarily the one that is staying; scoping through the context is what keeps each mount's `setLayout` calls talking only to its own eleven elements.

*(3) Cleanup* — Wrap the layout math and the Flip morph in a `gsap.context` scoped to the root ref, and revert it in the cleanup. `gsap.context` accepts a return value from the function you pass it: if that function returns its own cleanup callback, `ctx.revert()` runs that callback alongside undoing whatever GSAP wrote, which matters here because the `resize` listener is a plain `addEventListener`, not a tween or a `Flip` call, so the context doesn't know about it on its own:

```jsx
useEffect(() => {
  const modeRef = { current: "chaos" };

  const ctx = gsap.context((self) => {
    const items = gsap.utils.toArray(".item");
    const flipTargets = [headerRef.current, ...items];

    function setLayout(mode) {
      /* the same percent-to-pixel math as above, now scoped to the root ref */
    }

    self.add("switchMode", (mode) => {
      if (mode === modeRef.current) return;
      const state = Flip.getState(flipTargets);
      setLayout(mode);
      Flip.from(state, {
        /* the same values already named above, unchanged */
        absolute: true,
      });
      modeRef.current = mode;
    });

    setLayout("chaos");

    const onResize = () => setLayout(modeRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, rootRef);

  ctxRef.current = ctx;
  return () => ctx.revert();
}, []);
```

Two things break if this is ported literally. First, `switchMode` has to be reachable from the three button clicks, which live in JSX outside this effect — register it as a named method on the context, called later as `ctx.switchMode(mode)`, and not as an immediately-invoked `self.add(fn)`. The single-argument form runs synchronously during the factory pass and hands the callback the GSAP context itself as its argument, not a mode string, so the `setLayout` call inside it would try to read `.center` and `.items` off the context object and throw before any click ever happens. Stash the context in a ref (`ctxRef`) so the click handlers, defined in JSX, can call `ctxRef.current.switchMode(mode)`. Rewrite the `switches.forEach(...)` wiring as three JSX `onClick` props instead of the imperative loop — React already owns attaching and detaching those, so the only listener left needing manual teardown is the one on `window`, which the factory's returned cleanup above provides. `gsap.registerPlugin(Flip)` itself stays at module scope, outside the effect; calling it again on every mount is harmless but buys nothing.

Second, `activeMode` in the original script quietly does two jobs: it's the guard `switchMode` reads to skip a repeat click on the already-active mode, and it's the flag that decides which button renders with the `active` class. Those need to split in React. Keep the guard in `modeRef` above — a plain mutable ref, not `useState` — because putting it in state and listing it as an effect dependency would tear the whole context down and rebuild it on every switch, calling `ctx.revert()` while a `Flip.from` tween is still mid-flight on those same twelve elements and undoing the very transform it's animating. Drive the button's `active` styling from a separate `useState`, updated in the click handler right alongside the `ctxRef.current.switchMode(mode)` call, but never added to the effect's dependency array.
