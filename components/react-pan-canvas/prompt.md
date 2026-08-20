# Build: Mousemove Pan-Canvas Video Gallery

## Goal

A full-viewport black canvas holds an **oversized 200vw × 200vh grid of media tiles**, centered so only the middle of the grid is visible at rest. **Moving the mouse pans the whole grid in the opposite direction of the cursor**, letting you "explore" the offscreen tiles by simply steering — no scroll, no drag, no click. The motion is buttery and weighty because the pan is written as a single `transform` on the grid and eased by a **2-second `cubic-bezier` CSS transition**, so the grid glides toward each new cursor position and trails behind fast movements. Each tile **hover-reveals a looping video** (its still preview fades out, a zoomed-in looping clip fades in) with the project title centered on top. The star effect is the **cursor-inverse translate + long cubic-bezier easing** that makes the entire gallery feel like a heavy, floating canvas.

## Tech

Vanilla HTML/CSS/JS in a Vite + npm project. **No GSAP, no libraries, no framework, no npm dependencies at all** — the entire pan is done with one `mousemove` listener that writes `element.style.transform`, and *all* of the easing/smoothing lives in a **CSS `transition` on the grid element** (not in JS, not in a rAF loop). The hover reveals are pure CSS `:hover` opacity transitions. Load the script as `<script type="module" src="./script.js">`. Do not reach for a tween library, ScrollTrigger, Lenis, or a requestAnimationFrame loop — the whole point is that the smoothing is delegated to the browser's CSS transition engine.

## Layout / HTML

```html
<body>
  <div class="container">
    <div class="gallery">
      <!-- Row 1 — 4 items -->
      <div class="row">
        <div class="item">
          <div class="preview-img">
            <img src="{preview-1}" alt="Sport Power Ad Campaign" />
          </div>
          <p id="videoName">Sport Power Ad Campaign</p>
          <div class="work-video-wrapper">
            <div class="react-player" style="width: 100%; height: 100%">
              <img src="{reveal-1}" alt="Sport Power Ad Campaign" />
            </div>
          </div>
        </div>
        <!-- 3 more .item blocks: "Brand Vision Promo", "Minimal Motion Graphics", "Project Momentum Highlights" -->
      </div>

      <!-- Row 2 — 3 items -->
      <div class="row">
        <!-- "Ad Strategy Execution", "Sport Drive Showcase", "Brand Essence Storytelling" -->
      </div>

      <!-- Row 3 — 4 items -->
      <div class="row">
        <!-- "Minimal Flair Presentation", "Project Pulse Documentary", "Ad Creativity Concepts", "Sport Icon Journey" -->
      </div>
    </div>
  </div>

  <script type="module" src="./script.js"></script>
</body>
```

Structure rules the CSS/JS depend on:

- **`.container`** — the fixed full-viewport window; the JS attaches its `mousemove` listener here and reads *its* bounding rect for the center.
- **`.gallery`** — the single oversized panning surface; the JS writes its `transform`. It is the ONLY element that moves.
- **`.row`** — 3 rows total. **Row 1 = 4 items, Row 2 = 3 items, Row 3 = 4 items** (11 tiles, so 22 image slots).
- **`.item`** — one tile. Contains, in this order: a `.preview-img` (still shown at rest), a `<p id="videoName">` title (note: `id` is intentionally reused across tiles — it is styled/hovered by CSS, never queried by JS), and a `.work-video-wrapper` whose **direct child `<div class="react-player">`** holds the reveal media.
- The reveal media is a **looping, muted, autoplay video** in the original; a second still image is a valid stand-in (the hover cross-fade behaves identically). Keep it as a media element inside the `.react-player` child div.

Tile titles in DOM order:
Row 1 — *Sport Power Ad Campaign*, *Brand Vision Promo*, *Minimal Motion Graphics*, *Project Momentum Highlights*.
Row 2 — *Ad Strategy Execution*, *Sport Drive Showcase*, *Brand Essence Storytelling*.
Row 3 — *Minimal Flair Presentation*, *Project Pulse Documentary*, *Ad Creativity Concepts*, *Sport Icon Journey*.

## Styling

**Reset:** `* { margin:0; padding:0; box-sizing:border-box; }`

**Fonts:** **Inter** (`--sans`) for the page, **Space Grotesk** (`--display`) for the work titles, **Space Mono** (`--mono`) for the small uppercase type labels.

**Colour:**
```css
:root {
  --canvas: #0f0f0f;   /* the pannable ground */
  --ink: #f5f2ec;      /* titles */
  --muted: #8c8c88;
  --lilac: #c9b8f5;    /* the small type label over each tile */
  --pop: #ffd24a;
}
```
Everything else on screen is imagery.

**`.container`** — the viewport window:
```css
.container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;         /* clips the oversized gallery */
  position: relative;
  background: #000;
}
```

**`.gallery`** — the oversized, centered, eased panning surface (this transition IS the effect):
```css
.gallery {
  width: 200vw;             /* twice the viewport each way → room to pan */
  height: 200vh;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);   /* centered: grid center = container center */
  transition: transform 2000ms cubic-bezier(0.075, 0.82, 0.165, 1);  /* the whole easing lives here */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10em;
}
```

**`.row`** — full width, tiles spread across:
```css
.row { width: 100%; display: flex; justify-content: space-between; }
.row:nth-child(2) { justify-content: space-around; }   /* the 3-item middle row spaces differently */
```

**`.item`** — fixed-size clipped tile:
```css
.item { position: relative; width: 400px; height: 275px; overflow: hidden; }
```

**Global image fill:** `img { width:100%; height:100%; object-fit:cover; }`

**`.preview-img`** — the still shown at rest, on top by default:
```css
.preview-img { position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; }
.preview-img img { opacity:1; transition:300ms; }
.item:hover .preview-img img { opacity:0; }   /* fades OUT on hover */
```

**`.work-video-wrapper`** — the reveal layer, permanently **zoomed 2×** so the clip is cropped/close inside the tile:
```css
.work-video-wrapper {
  position:absolute; top:0; left:0; width:100%; height:100%;
  transform: scale(2);          /* always 2× — the reveal media is zoomed in */
  transition: 0.3s all;
}
.work-video-wrapper > div { opacity:0; transition:300ms; }        /* the react-player child */
.item:hover .work-video-wrapper > div { opacity:1; }              /* fades IN on hover */
```

**`#videoName`** — centered title overlay:
```css
/* film-credit caption, lower third — not a centred title */
.video-name {
  position:absolute; left:0; bottom:0; width:100%;
  padding:18px 20px; display:flex; flex-direction:column; gap:6px;
  opacity:0; transform: translateY(8px);
  transition: opacity 250ms, transform 450ms cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events:none; z-index:3;
}
.item:hover .video-name { opacity:1; transform: translateY(0); }

.work-type  { font-family: var(--mono); font-size:10px; font-weight:700;
              letter-spacing:0.08em; text-transform:uppercase; color: var(--lilac); }
.work-title { font-family: var(--display); font-weight:600; font-size:23px;
              line-height:1.12; letter-spacing:-0.02em; color: var(--ink); text-wrap:balance; }
```
Each caption is two lines — a mono type label ("Music film", "Aftermovie") over the work's title — rising from the lower third on hover, over a gradient scrim.

## The effect (be exact — this is the whole component)

There is **no animation library and no JS easing**. The effect is: (1) a `mousemove` handler that computes a cursor-inverse offset and writes it as a `transform` on `.gallery`, and (2) the long **CSS `cubic-bezier` transition** on `.gallery` that smooths every write into a gliding pan. Reproduce the math and the transition verbatim.

### 1. Bootstrap

```js
const init = () => {
  const container = document.querySelector(".container");
  const gallery   = document.querySelector(".gallery");
  if (!container || !gallery) return;
  container.addEventListener("mousemove", handleMouseMove);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
```

Only ONE listener, on `.container`, for `mousemove`. Nothing else — no resize, no rAF, no scroll.

### 2. The pan math (`handleMouseMove`)

```js
const handleMouseMove = (e) => {
  const { clientX, clientY, currentTarget } = e;
  const { width, height } = currentTarget.getBoundingClientRect();  // the container's size
  const centerX = width / 2;
  const centerY = height / 2;

  const factor = 1;                          // 1 → full 1:1 inverse follow (no damping)
  const deltaX = (centerX - clientX) / factor;
  const deltaY = (centerY - clientY) / factor;

  gallery.style.transform =
    `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
};
```

Key facts to keep exact:

- **The offset is cursor-INVERSE:** `delta = center - cursor`. When the cursor is at the container's **right** edge, `deltaX = centerX - width = -centerX` (negative) → the gallery translates **left**, revealing its right side. Cursor left edge → gallery moves right. Same inversion vertically. The grid always moves *away* from the cursor.
- **`factor = 1`** means no damping: `deltaX` ranges over `±width/2` (≈ ±50vw) and `deltaY` over `±height/2` (≈ ±50vh). Because the gallery is 200vw × 200vh centered with `translate(-50%,-50%)`, it overhangs the container by exactly 50vw / 50vh on each side — so a full-range cursor sweep pans the grid through its **entire** hidden extent (corner to corner), never past it.
- **The transform preserves the `-50%,-50%` centering** by keeping it inside the `calc()`: `translate(calc(-50% + Δx), calc(-50% + Δy))`. Do not replace the percentage centering with pixels.
- **`clientX/clientY` are viewport-relative** and the container fills the viewport, so no offset subtraction is needed.

### 3. The easing (CSS, not JS)

Every `mousemove` fires many times a second and each one instantly rewrites `gallery.style.transform` to the *raw* target for the current cursor position — there is **no interpolation in JS**. The smoothing is entirely the `transition: transform 2000ms cubic-bezier(0.075, 0.82, 0.165, 1)` on `.gallery`:

- The **2000ms** duration is long, so the grid takes ~2s to fully catch up to a new target and **trails/floats** behind quick cursor moves, continuously re-targeting as the cursor keeps moving.
- The bezier **`cubic-bezier(0.075, 0.82, 0.165, 1)`** is a strong ease-out (fast start, very soft settle) — the grid lunges toward the new position then decelerates gently into place. This exact curve is what gives the "heavy floating canvas" feel; keep the four control values.

### 4. Hover reveal (per tile, pure CSS)

On `.item:hover`, three CSS transitions run simultaneously (all defined above, no JS):

- `.preview-img img` opacity **1 → 0** over **300ms** (still fades out).
- `.work-video-wrapper > div` (the `.react-player`) opacity **0 → 1** over **300ms** (the always-`scale(2)` looping clip fades in, cropped by the tile's `overflow:hidden`).
- `#videoName` opacity **0 → 1** over **150ms** (title appears slightly ahead of the media swap).

Net feel: hover a tile and its still cross-dissolves into a zoomed-in looping video with the project title floating centered in white; the whole grid meanwhile drifts under the cursor.

## Assets / images

**22 image slots (2 per tile × 11 tiles)**, alternating roles: for each tile, one **preview** still (shown at rest) and one **reveal** frame (the looping video's poster / the zoomed hover state). Source files are **landscape ~16:9**, but every tile is a fixed **400×275 box with `object-fit:cover`** (and the reveal layer is scaled 2×), so exact aspect is flexible — center-croppable framing matters more than resolution. The set is a cohesive **cinematic creative-agency reel**: editorial, minimal, high-production imagery with a mix of full-color and black-and-white frames. By role/mood:

1. Dynamic figures in motion — energetic sport-campaign feel.  2. Sneaker + apparel product shot, athletic gear.  3. Surreal editorial composition, bold brand-vision imagery.  4. Abstract 3D render, sculptural forms.  5. Minimal metallic still life, clean motion-graphics vibe.  6. Architectural interior, minimal geometry.  7. Warm lifestyle scene, momentum and movement.  8. People in motion, highlight-reel energy.  9. Color portrait, editorial subject.  10. Surreal editorial frame, conceptual imagery.  11. Dynamic people in motion, sport-drive showcase.  12. Neon-lit street scene, night-time energy.  13. Black-and-white portrait, brand-essence storytelling.  14. Warm lifestyle moment, human and inviting.  15. Architectural interior, minimal flair.  16. Abstract render, sculptural composition.  17. Backlit silhouette, documentary mood.  18. Black-and-white portrait, intimate documentary tone.  19. Pop-art portrait, creative ad concept.  20. Surreal editorial image, imaginative concept work.  21. Sneaker + apparel hero, sport-icon styling.  22. Figure in motion, athletic journey.

Assign them in DOM order (tile 1 preview = image 1, tile 1 reveal = image 2, tile 2 preview = image 3, …). No brand logos or real client imagery — the project titles are neutral placeholder copy; keep or swap for any neutral names. Any cohesive set of ~22 cinematic editorial frames works; strong tonal contrast makes the hover reveal read best.

## Behavior notes

- **Desktop / pointer only.** The entire experience is `mousemove`-driven — no touch, scroll, drag, click, or keyboard, and no reduced-motion branch. It is not mobile-safe (touch devices get a static centered grid with hover reveals unavailable).
- **At rest** (before any mouse movement) the grid sits centered showing only its middle tiles; move the mouse to pan and discover the offscreen rows/columns.
- **No resize handling** in the original — the container reads its live bounding rect on each `mousemove`, so a resized window is handled implicitly on the next move.
- **Light perf cost** — a single `transform` write per mouse event with GPU-composited CSS transition; no rAF loops, no per-frame layout.

## Images

This component ships with 23 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/react-pan-canvas/img1.jpg
https://motionprompts.dev/c/react-pan-canvas/img10.jpg
https://motionprompts.dev/c/react-pan-canvas/img11.jpg
https://motionprompts.dev/c/react-pan-canvas/img12.jpg
https://motionprompts.dev/c/react-pan-canvas/img13.jpg
https://motionprompts.dev/c/react-pan-canvas/img14.jpg
… 17 more under https://motionprompts.dev/c/react-pan-canvas/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--canvas`, `--ink`, `--muted`, `--lilac`, `--pop`, plus the type variables `--sans`, `--display`, `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two `mousemove` listeners on the same container, two independent touch-drag state machines tracking the same finger. The visible symptom is jitter or doubled writes, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`. That guard exists to survive being loaded late in a plain document; in React it is dead weight, because `useEffect` already runs after the DOM is committed. Drop the guard and the listener both, and keep only `init`'s body, inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — `init` looks up `.container` and `.gallery` exactly once, at setup, and never queries again afterward: `handleMouseMove` reads `e.currentTarget` for the bounding rect and closes over the `gallery` reference for the write, and the touch handlers do the same. So there's no per-event `document.querySelector` to worry about — only these two initial lookups. Give the component a root `ref`, render `.container` on it, and resolve `.gallery` through that same root (`root.querySelector(".gallery")`) rather than the bare `document`. An unscoped lookup will happily bind the mousemove handler to whichever `.gallery` is first in the whole document, and during the StrictMode remount two copies of this subtree briefly coexist.

*(3) Cleanup* — There is no GSAP context, ticker, Lenis instance, or rAF handle to revert here: the entire component is four raw listeners bound to `.container` (`mousemove`, `touchstart`, `touchmove`, `touchend`). Cleanup is nothing more than calling `removeEventListener` four times with the exact function references `addEventListener` was given — declare `handleMouseMove` and the three touch handlers as named consts inside the effect rather than inline arrows, or the function `removeEventListener` receives in the cleanup won't be the same reference that was registered and the call will silently no-op. Skip this and the StrictMode remount leaves the first pass's four listeners bound alongside the second pass's four, permanently, on the same node. For `handleMouseMove` the leak is silent rather than visibly broken, because it's a pure function of cursor position with no interpolation or accumulator: a duplicate just recomputes and rewrites the identical `transform` string a second time per event. The touch path is where it stops being silent — `panX`, `panY`, `lastX`, `lastY` and `dragging` are closured variables private to one call of `init`, so a leaked set from an earlier mount keeps its own copy of that state, tracks the same finger independently of the current mount's copy, and both write `gallery.style.transform` on every `touchmove`; whichever handler happens to run last for that dispatch wins the paint, a race decided by listener-registration order rather than anything in the effect. Also reset `gallery.style.transform` to an empty string in the same cleanup: the pan lives entirely in that inline style — the CSS rule only supplies the initial centered transform, and the first `mousemove` overwrites it for good — so without clearing it, a component that unmounts mid-pan and later remounts starts already offset instead of centered.
