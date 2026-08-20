# Work-List Hover — Pastel Panel Flip + Tilted Preview Reveal

## Goal
Build a full-viewport, dark **"just went live" work list**: an intro line, three big project rows separated by hairlines, and a pill CTA. The star effect is a **whole-panel hover flip**: hovering any row (a) flips the entire `#141414` panel to that row's **pastel background** and inverts all the text/CTA from white to dark navy, (b) slides a **tilted diagonal strip of three half-transparent GIF preview cards** (sitting behind the text) to a new top/left position so the card matching the hovered project glides center-stage and rotates a touch further, and (c) reveals a round arrow-pill on the hovered row where the arrow does a **conveyor swap** — the resting arrow exits right while a fresh arrow slides in from the left. Everything is CSS `transition` driven; JS only toggles a class and writes two inline overlay offsets.

## Tech
Vanilla HTML/CSS/JS, shipped as `index.html` + `styles.css` + an ES-module `script.js` (`<script type="module" src="./script.js">`). **No GSAP, no npm dependencies, no smooth scroll.** All motion is pure **CSS `transition`**; JS only adds/removes classes and sets `overlay.style.top` / `overlay.style.left`. Arrow glyphs use the **Phosphor Icons web font**, served from your own origin: link the bold weight in `<head>` (`<link rel="stylesheet" href="/vendor/phosphor/bold/style.css" />`), then write `<i class="ph-bold ph-arrow-right">`. Get the file with `npm i @phosphor-icons/web@2.1.2` and copy `node_modules/@phosphor-icons/web/src/bold/` (a `style.css` plus its `.woff2`) into your public directory; do **not** use the package's own `index.js`, which injects the stylesheets from `cdn.jsdelivr.net`. Any right-arrow icon font or inline SVG is an acceptable substitute.

## Layout / HTML
Class/ID names are load-bearing — the CSS and JS query them.

```html
<div class="container">
  <div class="work">
    <div class="overlay">
      <div class="prev" id="prev-1"><img src="prev-1.gif" alt="" /></div>
      <div class="prev" id="prev-2"><img src="prev-2.gif" alt="" /></div>
      <div class="prev" id="prev-3"><img src="prev-3.gif" alt="" /></div>
    </div>

    <p>Just went live with:</p>

    <div class="work-item" id="w-1">
      <div class="work-item-name"><h1>Aster</h1></div>
      <div class="work-item-icon">
        <div class="icon-holder i-1"><i class="ph-bold ph-arrow-right"></i></div>
        <div class="icon-holder i-2"><i class="ph-bold ph-arrow-right"></i></div>
      </div>
    </div>

    <div class="work-item" id="w-2">
      <div class="work-item-name"><h1>Launching Nova Into The World</h1></div>
      <div class="work-item-icon">
        <div class="icon-holder i-1"><i class="ph-bold ph-arrow-right"></i></div>
        <div class="icon-holder i-2"><i class="ph-bold ph-arrow-right"></i></div>
      </div>
    </div>

    <div class="work-item" id="w-3">
      <div class="work-item-name"><h1>Standby x Northwind</h1></div>
      <div class="work-item-icon">
        <div class="icon-holder i-1"><i class="ph-bold ph-arrow-right"></i></div>
        <div class="icon-holder i-2"><i class="ph-bold ph-arrow-right"></i></div>
      </div>
    </div>

    <div class="cta"><button>View all work</button></div>
  </div>
</div>
```
Key points:
- Exactly **three `.work-item` rows** with ids `#w-1`, `#w-2`, `#w-3`. The project titles are arbitrary placeholder names — pick **one short single word** (row 1), **one long title that wraps to two lines** at the big type size (row 2), and **one medium two-part title** (row 3). No real brand or client names.
- Each row holds a `.work-item-name > h1` on the left and a `.work-item-icon` pill on the right, gapped apart.
- Inside every `.work-item-icon` there are **two** `.icon-holder`s (`.i-1` then `.i-2`), each containing one identical right-arrow glyph. The two-arrow duplication is what enables the conveyor swap.
- `.overlay` is the first child of `.work` and holds the three `.prev` GIF cards; it lives **behind** the text (`z-index: 0`).
- The intro `<p>` reads "Just went live with:"; the CTA is a single pill `<button>` reading "View all work".

## Styling
- Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `img { width:100%; height:100%; object-fit:cover; }`.
- Font: a clean neutral grotesque sans for everything (original uses a proprietary "Helvetica Now" variable face — Helvetica / Arial / Inter reads right).
- `.work`: `position:relative; width:100vw; height:100vh; background:#141414; padding:6em 4em; overflow:hidden; transition: background-color 0.5s ease;` — this is the panel that flips color. `overflow:hidden` clips the oversized tilted preview strip.
- `.overlay`: `position:absolute; top:0%; left:13.25%; width:100%; height:100%; pointer-events:none; z-index:0; display:flex; justify-content:center; align-items:center; gap:10em; opacity:0.5; transition:1s;` — the previews sit half-transparent behind the text, and the whole strip tweens its `top`/`left` over **1s**.
- `.prev`: `position:relative; width:500px; height:600px; background:gray; transform:rotate(10deg) scale(1); transition:transform 0.5s ease;` — large portrait (~5:6) cards, all tilted 10°.
- `.prev.active`: `transform:rotate(12.5deg) scale(1);` — the active card rotates a touch further (10°→12.5° over 0.5s).
- Diagonal stagger via per-card `top`: `#prev-1 { top:-500px; }`, `#prev-2 { top:0; }`, `#prev-3 { top:500px; }` — inside the centered flex row this makes a descending diagonal staircase of three cards.
- `p` (intro line): `position:relative; color:#fff; font-size:30px; margin-bottom:1em; z-index:2; transition:0.5s;`.
- `h1` (titles): `color:#fff; opacity:0.5; font-size:80px; font-weight:500; letter-spacing:-0.025em; transition:0.5s;` — dim white by default.
- `.work-item`: `position:relative; width:100%; padding:2em 0; display:flex; align-items:center; gap:2em; border-bottom:1px solid rgba(255,255,255,0.5); cursor:pointer; z-index:2; transition:0.5s;`. The last row has no divider: `.work-item#w-3 { border-bottom:none; }`.
- `.work-item-icon`: `position:relative; width:70px; height:70px; border-radius:100%; background:#0b1925; color:#fff; overflow:hidden; left:-20px; opacity:0; transition:0.2s;` — a dark-navy round pill, hidden by default and nudged 20px left. `overflow:hidden` clips the sliding arrows.
- `.icon-holder`: `position:absolute; width:70px; height:70px; border-radius:100%; display:flex; justify-content:center; align-items:center; transition:0.5s;`.
  - `.i-1 { transition-delay:0.2s; left:-70px; }` — parked one pill-width off to the left (out of the clipped pill).
  - `.i-2 { left:0px; }` — the visible/centered arrow at rest.
- `button`: `position:relative; background:#fff; color:#0b1925; border:none; padding:2em 4em; margin:2em 0; font-size:15px; border-radius:100px; font-weight:500; z-index:2; transition:0.5s;` — a white pill, dark text.

**Three pastel background classes** (added to `.work` on hover — note the class *names* are arbitrary and do NOT match the actual hues; use the hex values):
```css
.bg-color-red   { background-color: rgb(164, 250, 249); }  /* pale aqua / cyan */
.bg-color-blue  { background-color: rgb(246, 250, 164); }  /* pale yellow      */
.bg-color-green { background-color: rgb(250, 164, 164); }  /* pale pink/salmon */
```

**Hovered-panel inversions** (all gated behind a `.hovered` class on `.work`, so they tween together with the background over their 0.5s transitions):
```css
.work.hovered button        { background:#0b1925; color:#fff; }  /* pill inverts */
.work.hovered h1            { color:#0b1925; opacity:1; }        /* titles go dark & full-opacity */
.work.hovered p             { color:#0b1925; }
.work.hovered .work-item    { border-bottom:1px solid #0b1925; } /* dividers go dark */
.work.hovered .work-item#w-3{ border-bottom:none; }
```

**Per-row arrow pill (native CSS `:hover` on the individual `.work-item`):**
```css
.work-item:hover .work-item-icon   { opacity:1; left:0px; }   /* pill fades in, slides right 20px */
.work-item:hover .icon-holder.i-1  { left:0; }                /* fresh arrow slides in from left  */
.work-item:hover .icon-holder.i-2  { left:70px; }             /* resting arrow exits to the right  */
```

## The effect (exhaustive — this replaces the GSAP section)
There is **no GSAP and no JS tweening loop**. Two CSS transition engines plus a tiny vanilla-JS controller produce the whole thing. Durations/eases to reproduce exactly:

- Panel background: `background-color 0.5s ease` on `.work`.
- Text/CTA/divider inversions: `0.5s` (default ease) on `p`, `h1`, `.work-item`, `button` — they retint the moment `.hovered` is toggled.
- Preview strip travel: `transition: 1s` on `.overlay` (drives `top`/`left`).
- Active card extra tilt: `transform 0.5s ease` on `.prev` (10°→12.5°).
- Arrow-pill reveal: `0.2s` on `.work-item-icon` (opacity 0→1, left −20px→0).
- Arrow conveyor: `0.5s` on each `.icon-holder`, with `.i-1` delayed `0.2s` so the swap reads as sequential (out-going arrow leaves, then incoming arrow lands).

### JS controller (runs inside `DOMContentLoaded`)
```js
const workItems   = document.querySelectorAll(".work-item");
const work        = document.querySelector(".work");
const overlay     = document.querySelector(".overlay");
const prevElements= document.querySelectorAll(".prev");

// Initial state:
overlay.style.top  = "0%";
overlay.style.left = "13.25%";
document.querySelector("#prev-2").classList.add("active");   // middle card active at rest

function removeActiveClass() {
  prevElements.forEach((prev) => prev.classList.remove("active"));
}
```

For each `.work-item` (with its `index` 0/1/2), attach two listeners:

**`mouseover`** →
1. `removeActiveClass()`, then add `active` to `#prev-${index+1}` (so the hovered row's matching card gains the 12.5° tilt).
2. Add `hovered` to `.work`, then set the panel's full class string **and** the overlay offsets per index (the class assignment `work.className = "work bg-color-… hovered"` both applies the pastel bg and keeps `hovered`):
   - **index 0** (row 1): `overlay.style.top = "50%"; overlay.style.left = "50%";` and `work.className = "work bg-color-red hovered";` → **pale aqua** panel; the diagonal strip slides down-right so **prev-1** lands center.
   - **index 1** (row 2): `overlay.style.top = "0%"; overlay.style.left = "13.25%";` and `work.className = "work bg-color-blue hovered";` → **pale yellow** panel; overlay stays at its rest position with **prev-2** center.
   - **index 2** (row 3): `overlay.style.top = "-50%"; overlay.style.left = "-23.5%";` and `work.className = "work bg-color-green hovered";` → **pale pink** panel; the strip slides up-left so **prev-3** lands center.

**`mouseout`** → reset everything: remove `hovered`, `work.className = "work"` (back to `#141414`), `overlay.style.top = "0%"; overlay.style.left = "13.25%";`, `removeActiveClass()`, and re-add `active` to `#prev-2`.

Because the overlay is a 100%×100% absolutely-positioned box holding a diagonal strip of three oversized cards, shifting its `top`/`left` by these percentages glides a *different* card behind the centered text column, and the 1s transition makes that a smooth slide. The pastel flip (0.5s) and the arrow pill (native `:hover`) fire simultaneously since the cursor triggers both the JS `mouseover` and the CSS `:hover` at once.

No ScrollTrigger, no timelines, no stagger arrays, no rAF loop, no scroll behavior — the only triggers are per-row **mouseover / mouseout** (JS) and per-row **:hover** (CSS), plus the one on-load initial state.

## Assets / images
- **3 looping GIF preview cards**, portrait **~5:6** (rendered at 500×600), shown `object-fit: cover` at `opacity: 0.5` behind the text. Each should be **dark, cinematic, editorial motion footage** — moody, low-key lit, low-contrast — so text stays legible over them. One per project row; the middle one (`prev-2`) is the default/at-rest card. Suggested distinct subjects: an overhead aerial of figures on a marked ground; a moody dusk tracking shot along a long wall; a low-key interior looking outward past objects toward a colored glow. No brands, logos, or recognizable client work. Static JPGs work as a fallback if GIFs aren't available.

## Behavior notes
- **Desktop-only effect** (large 500×600 previews). Responsive at `max-width: 900px`: `.work { padding:4em 1em; }`, `.work-item { gap:1em; }`, `p { font-size:16px; }`, `h1 { font-size:30px; }`, `.work-item-icon { transform:scale(0.75); }`, `button { padding:1em 2em; }`.
- No reduced-motion handling in the original; transitions are short (≤1s) and gentle.
- Only one row is ever "hovered" at a time; leaving a row instantly returns the panel to dark, prev-2 active, overlay at rest.
- Dark UI at rest: `#141414` ground, white 30px intro line, 80px dim-white titles (opacity 0.5), 50%-white hairline dividers, white CTA pill with `#0b1925` text.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/media-monks-hover/prev-1.jpg
https://motionprompts.dev/c/media-monks-hover/prev-2.jpg
https://motionprompts.dev/c/media-monks-hover/prev-3.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, finds its own DOM with `document.querySelectorAll(".work-item")`, `document.querySelector(".work")`, and `document.querySelector(".overlay")`, writes an initial `overlay.style.top` / `overlay.style.left` and marks `#prev-2` `.active`, then attaches one `mouseover` and one `mouseout` listener per row — and it never expects to run a second time. React withdraws that guarantee. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Because the effect finds its rows with a bare class selector rather than anything scoped to the mount that created them, a first pass whose listeners are never removed and a second pass that attaches its own six listeners (two per row, three rows) both end up bound to the *same* three `<div class="work-item">` nodes. The bug this produces is unusually quiet: every value both copies write — `work.className`, `overlay.style.top`/`left`, the `.active` class on `#prev-N` — is the same idempotent string either copy would have written alone, so the very next hover still looks correct. What actually happened is that a spare pair of listeners now lives on each row, and it happens again on every remount this route goes through — a leak with no visible symptom, exactly the kind the "navigate away and come back" test in the note above is meant to catch.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired for this page load, so the listener is never invoked and the whole body — the four queries, the two initial writes, and the `workItems.forEach` loop that wires up `mouseover`/`mouseout` — never runs. There is no error and no animation; the panel simply never flips. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its body into a `useEffect` with an empty dependency array. That is step one; see (3) for where this particular component actually ends up.

*(2) Element lookups* — `document.querySelector(".work")` / `".overlay"` and `document.querySelectorAll(".work-item")` / `".prev"` all assume this script owns the whole document. Give the component a root ref on the element playing `.work`'s role and scope every lookup to it, if you keep any imperative lookups at all. During the StrictMode remount, two copies of this subtree exist for an instant, and an unscoped selector — or worse, the `document.querySelector("#prev-" + (index + 1))` / `document.querySelector("#prev-2")` calls sitting inside the handlers themselves, which re-query the live document on every hover instead of anything captured once — can resolve against the copy that is already on its way out.

*(3) Cleanup — or why this component doesn't need an effect at all* — Every `mouseover`/`mouseout` pair the effect attaches has to be removed in the returned cleanup, and the literal port does exactly that: keep the six handler references and call `removeEventListener` on each of them in the function the effect returns. But look at what those handlers actually do. For a given row, `mouseover` always writes the same three things: one of `bg-color-red` / `bg-color-blue` / `bg-color-green` onto `work.className` alongside `hovered`, one fixed pair of `overlay.style.top` / `overlay.style.left` values, and `.active` on the one `#prev-N` matching that row (after `removeActiveClass()` clears the other two). `mouseout` always resets to the same three literals — `work.className = "work"`, the overlay back to its rest position, `#prev-2` active again. None of that reads layout, none of it depends on the previous frame, and none of it needs to run before paint: it is a pure function of one number, the index of the currently hovered row, or `null` when the pointer is off every row. Model that number as one piece of state (`const [hovered, setHovered] = useState(null)`), put `onMouseEnter` / `onMouseLeave` handlers that set and clear it directly on the three row elements in JSX, and derive the panel's class name, the overlay's inline `top`/`left`, and which `.prev` gets `.active` from `hovered` at render time — a three-entry lookup indexed by the hovered row, falling back to the middle entry when `hovered` is `null`, reproduces `#prev-2`'s default exactly. Once the rows carry their own handlers and the panel/overlay/active-card values are computed during render instead of written imperatively, the `DOMContentLoaded` body — the queries, the initial write, the `forEach`, both listeners — has nothing left to do, so there is no effect and no cleanup left to get wrong. The pastel background swap, the text-and-divider inversion, the overlay's glide, the active card's extra tilt, and the arrow conveyor on `.icon-holder` are all still driven by the same CSS `transition`s and the native `:hover` on `.work-item`; none of that changes. Only the two class strings and the one inline style that today come from imperative DOM writes need to come from `hovered` instead.
