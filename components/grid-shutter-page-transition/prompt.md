# Grid Shutter Page Transition (scaleX row-shutter cover-and-reveal)

## Goal
Build a client-side "fake router" for a small three-page site where **navigating between pages plays a full-screen 4×16 grid of cream blocks that scale open horizontally to shutter the viewport closed, swaps the page content underneath while covered, then scales the same blocks back down to reveal the new page**. The star effect is the two-phase `scaleX` shutter: a fixed grid of blocks whose rows animate concurrently but with **alternating sweep direction** — even rows grow anchored to the left edge sweeping left→right, odd rows grow anchored to the right edge sweeping right→left — each row carrying its own per-block stagger. Trigger is a click on the fixed top navbar links.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) only — **no GSAP plugins, no ScrollTrigger, no SplitText, no Lenis**. There is no scroll interaction at all. Import as:
```js
import gsap from "gsap";
```
No `gsap.registerPlugin` call is needed.

## Layout / HTML
```
.transition-grid                          (fixed full-viewport overlay; JS fills it with blocks — starts EMPTY)

nav.navbar                                (fixed top row, logo left / links right)
  .navbar-logo
    .navbar-item > a[data-route="/"]      "Duskfield"   (wordmark; also routes home)
  .navbar-items
    .navbar-item > a[data-route="/"]        "Genesis"
    .navbar-item > a[data-route="/cascade"] "Cascade"
    .navbar-item > a[data-route="/orbit"]   "Orbit"

section.hero.genesis.page.active[data-route="/"]      > h1 "Genesis"   (visible on load)
section.hero.cascade.page[data-route="/cascade"]      > h1 "Cascade"
section.hero.orbit.page[data-route="/orbit"]          > h1 "Orbit"
```
- The `.transition-grid` starts **empty** in the HTML — JS builds and appends all the block `<div>`s.
- Each nav link carries a `data-route` matching a `section.page`'s `data-route`. Only one `section.page` has class `active` at a time (the home page `/` on load).
- Note both the logo `a` and the first nav item `a` point to `data-route="/"`; both are wired the same way (clicking either navigates home).
- Use neutral fictional names (fictional studio wordmark "Duskfield"; three cosmic page labels Genesis / Cascade / Orbit). No real brands.

## Styling
Fonts (Google Fonts):
- Display: **Instrument Serif** (regular + italic), used for the giant `h1`.
- UI: **Instrument Sans** (weights 400–700 + italics), used for nav links.

Color tokens (`:root`):
- `--bg: #0f0f0f` (near-black page background, seen only briefly under a hero image)
- `--fg: #f2f0e6` (warm cream — text color)
- `--transition-grid: #f2f0e6` (the same cream — **the shutter block color**)

Type:
- `h1`: `font-family:"Instrument Serif", serif; font-size: clamp(5rem, 15vw, 20rem); font-weight:500; letter-spacing:-3%; line-height:1;`
- nav `a`: `text-decoration:none; color: var(--fg); font-family:"Instrument Sans", sans-serif; font-weight:500; letter-spacing:-2%;`

Key structural CSS (load-bearing):
- `.navbar`: `position: fixed; width:100%; padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; z-index:2;`
- `.navbar-items`: `display:flex; gap: clamp(1rem, 4vw, 2rem);`
- `.navbar-item`: `padding:1.5rem;` (large hit area).
- `.hero`: `position:relative; width:100%; height:100svh; background-color:var(--bg); color:var(--fg); display:flex; justify-content:center; align-items:center; overflow:hidden;` — each hero is a full-viewport centered stage for its `h1`.
- Each hero gets a **full-bleed CSS background image** (not an `<img>` tag): `background: url(<img>) no-repeat 50% 50%; background-size: cover;` — one per page (genesis / cascade / orbit).
- **Fake-router visibility:** `.page { display:none; }` and `.page.active { display:flex; }` — only the active page is in the layout; the others are removed entirely.
- `.transition-grid`: `position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:100; overflow:hidden;` — sits above everything (navbar z-index 2, grid z-index 100) and never blocks clicks.
- `.transition-block`: `position:absolute; background-color: var(--transition-grid); will-change: transform;` — every block is absolutely positioned via inline `left`/`top`/`width`/`height`/`transform-origin` from JS.

Responsive (`@media (max-width: 1000px)`): `.navbar` padding grows to `2rem`; `.navbar-items` becomes a right-aligned vertical column (`align-items:flex-end; flex-direction:column; gap:0;`) and `.navbar-item` padding shrinks to `0.25rem`. (Purely nav layout; the shutter effect is unchanged.)

## GSAP effect (exhaustive)

### Constants & grid generation
- `const ROWS = 4;` and `const COLS = 16;` — a fixed 4-row × 16-column grid (64 blocks total), **independent of viewport size** (blocks stretch to fit).
- `createTransitionGrid()` builds the shutter:
  - `blockWidth = window.innerWidth / COLS;` and `blockHeight = window.innerHeight / ROWS;` — each cell exactly tiles the viewport.
  - Nested loop `row` (0→3) × `col` (0→15): create `div.transition-block` and set inline styles:
    - `width = blockWidth + 1px`, `height = blockHeight + 1px` — the **+1px** overlap hides sub-pixel seams between blocks when covered.
    - `left = col * blockWidth`, `top = row * blockHeight`.
    - `transform-origin: ${row % 2 === 0 ? "left" : "right"} center;` — **even rows (0, 2) anchor to their LEFT edge; odd rows (1, 3) anchor to their RIGHT edge.** This is what makes rows grow from opposite sides.
  - Append each block to `.transition-grid` and push into a `blocks[]` array.
  - Before generating, clear: `transitionGrid.innerHTML = ""` and reset `blocks = []`.
  - After building, `gsap.set(blocks, { scaleX: 0 })` — all blocks start collapsed (invisible, zero-width).
- Call `createTransitionGrid()` once on load, and **rebuild it on `window.resize`** (`window.addEventListener("resize", createTransitionGrid)`).
- Helper: `getRowBlocks(row) = blocks.slice(row * COLS, row * COLS + COLS)` — returns the 16 blocks of one row.

### The two transition timelines (this is the whole effect)
Two functions, each building a `gsap.timeline({ onComplete })` and adding **one `.to()` per row, all positioned at `"<"`** so every row starts at the same time (time 0) yet keeps its own internal stagger.

**`animateIn(onComplete)` — shutter CLOSED (cover the screen):**
```js
const tl = gsap.timeline({ onComplete });
[0, 1, 2, 3].forEach((row) => {
  const rowBlocks = getRowBlocks(row);
  tl.to(rowBlocks, {
    scaleX: 1,
    duration: 0.6,
    ease: "power3.inOut",
    stagger: { each: 0.025, from: row % 2 === 0 ? "start" : "end" },
  }, "<");
});
return tl;
```
- Every block animates `scaleX: 0 → 1`.
- Per-block `duration: 0.6`, `ease: "power3.inOut"`.
- Per-row `stagger: { each: 0.025, from: <start|end> }` — **0.025s** between consecutive blocks in the row. `from: "start"` on **even rows** makes the reveal ripple left→right; `from: "end"` on **odd rows** ripples right→left. Combined with the alternating `transform-origin`, adjacent rows sweep in opposite directions (an interleaved shutter).
- All four `.to()` calls use position param **`"<"`** (start of the previous tween) so the rows animate **concurrently**, not sequentially.
- Per-row wall time ≈ `0.025 × 15 + 0.6 ≈ 0.975s`; because rows overlap, `animateIn` total ≈ **~0.975s**.

**`animateOut(onComplete)` — shutter OPEN (reveal the new page):**
```js
const tl = gsap.timeline({ onComplete });
[0, 1, 2, 3].forEach((row) => {
  const rowBlocks = getRowBlocks(row);
  tl.to(rowBlocks, {
    scaleX: 0,
    duration: 0.6,
    ease: "power3.inOut",
    stagger: { each: 0.025, from: row % 2 === 0 ? "start" : "end" },
  }, "<");
});
return tl;
```
- Identical structure but `scaleX: 1 → 0` — the blocks collapse back to zero width, uncovering the (already-swapped) page. Same `duration`, `ease`, `stagger`, `from` direction per row, and `"<"` concurrency. Total ≈ **~0.975s**.

### Sequencing (`navigate(route)`)
State: `currentRoute = "/"`, `isTransitioning = false`.
- Guard: if `isTransitioning` or `route === currentRoute`, return (ignore re-clicks and clicks on the current page).
- Set `isTransitioning = true`, then:
  1. `animateIn(() => { … })` — blocks scale IN to fully cover the viewport.
  2. In `animateIn`'s `onComplete`: `showPage(route)` (toggle `.active` so the target `section.page` becomes the only visible page) and `currentRoute = route`. **The swap happens while the screen is fully covered by the cream shutter.**
  3. Then call `animateOut(() => { isTransitioning = false; })` — blocks scale OUT to reveal the new page, and re-entrancy unlocks on complete.
- `showPage(route)`: loop all `.page` sections, `page.classList.toggle("active", page.dataset.route === route)`.
- There is **no hold/delay** between the two phases — `animateOut` fires immediately in `animateIn`'s `onComplete`. Total door-to-door ≈ **~1.95s**.

### Trigger wiring
For every `.navbar a` (this includes the logo link and all three nav links), `addEventListener("click", e => { e.preventDefault(); navigate(link.dataset.route); })`. No History API / URL change — it is a purely visual fake router.

## Assets / images
**3 images**, one full-bleed CSS `background` per hero page (`background-size: cover`, centered), all **16:9 / landscape** to fill the viewport behind each giant serif `h1`. Role: atmospheric cosmic backdrops, each with a distinct palette so the swap is obvious the instant the shutter opens:
- **Genesis** — a tall dark monolith/slab standing edge-on and glowing, wreathed in billowing amber-orange smoke and drifting embers against a near-black starfield; dominant colors are fiery orange against deep black.
- **Cascade** — a wide, painterly nebula cloudscape of warm rust-orange clouds meeting cool teal-blue, with a scatter of small tan and grey planetary spheres and a dense field of stars; dominant colors are orange and blue.
- **Orbit** — a single large pale ice-blue ringed gas planet, encircled by a thin dusty orange ring, floating against a starry deep-blue nebula; dominant colors are soft blue with an orange ring accent.
Provide 3 distinct landscape images in that order.

## Behavior notes
- **Desktop and mobile** both work; there is no `prefers-reduced-motion` branch and no min-width gate — only the navbar layout changes below 1000px.
- The grid is a **fixed 4×16** regardless of viewport; on resize it is fully rebuilt so cell dimensions re-fit the new size, and `gsap.set` re-collapses `scaleX` to 0.
- `.transition-grid` has `pointer-events: none`, so even at full cover the navbar underneath can't be clicked — but the `isTransitioning` guard already blocks input during a transition.
- No infinite loops; each transition is one-shot per click.
- The home page (`/` Genesis) is visible on load with no intro animation; the shutter only fires on nav clicks.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/grid-shutter-page-transition/img1.jpg
https://motionprompts.dev/c/grid-shutter-page-transition/img2.jpg
https://motionprompts.dev/c/grid-shutter-page-transition/img3.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--night`, `--starlight`, `--ember`, `--dusk`, `--dusk-zenith`, `--dusk-violet`, `--dusk-rose`, `--dusk-horizon`, `--font-instrument-serif`, `--font-instrument-sans`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone module: it wires four navbar links and one `resize` listener, and only tears any of it down through a `destroy()` that nothing on the demo page ever calls — the fake router is a closed system that runs once and is never asked to unwind. React withdraws the "runs once" half of that, and it does it quietly — the shutter still closes and opens correctly on the very first click, and the damage only shows up as the click count climbs.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This script is unusual for this catalogue in that its own author already anticipated remounting: `mount(config)` does nothing but query the page, build the grid, and wire the listeners, and it returns a `destroy` that reverses all three — a contract built for this catalogue's own live-knob editor (`window.MP`), which re-mounts `grid-shutter-page-transition` every time `rows`, `cols`, or either duration knob changes on the fly. A React port is closer than usual here — the effect body is already `mount()`, unmodified. What breaks is the very last line of the file: `mount(Object.assign({}, DEFAULTS))` calls it and throws the returned `destroy` into the void. A `useEffect` that reproduces that line and forgets to return what it gets back reintroduces the exact failure `destroy` exists to prevent: two live `mount()` closures, each with its own click listener on all four `.navbar a` elements (the "Duskfield" wordmark plus Genesis/Cascade/Orbit — JSX is not torn down between the two StrictMode passes, only the effect body re-runs) and its own `resize` listener on `window`. From then on, every navbar click fires `navigate()` twice — once per surviving listener — each call spinning up its own `animateIn`/`animateOut` pair of timelines against the 64 blocks and calling `showPage()` a second, redundant time. Nothing about a single click looks broken enough to chase; what actually happens is the live-tween count and the listener count both double once and hold there, permanently, in production too, because this script never calls `removeEventListener`.

*(1) The entry point* — The script runs at the top level: the closing `if (window.MP…) { … } else { mount(...) }` executes the instant the module is evaluated, before `.transition-grid`, `nav.navbar`, or any `section.page` exists in a React tree. Delete that whole block — the `window.MP` branch is this catalogue's editor hook and has no equivalent in a plain app. Call `mount` from inside a `useEffect` with an empty dependency array, and — this is the one thing the toplevel call site gets wrong — keep and return what it hands back:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS });
  return destroy;
}, []);
```

Do not leave the call in the component body instead of the effect — `createTransitionGrid()` rebuilds all 64 blocks from `window.innerWidth`/`window.innerHeight` every time it runs, so calling `mount` on every render would tear down and regenerate the entire grid on every parent re-render, not just on resize.

*(2) Element lookups* — `mount` resolves `.transition-grid`, `.navbar a`, and `.page` off `document`, which assumes it owns the whole page. Give the component a root `ref` wrapping the grid overlay, the navbar, and the three hero sections, and change the lookups inside `mount` to search under that ref instead: `rootRef.current.querySelector(".transition-grid")`, `rootRef.current.querySelectorAll(".navbar a")`, `rootRef.current.querySelectorAll(".page")`. This is not cosmetic for this component specifically — `.transition-grid` is `position: fixed`, so an unscoped `document.querySelector` will resolve to *some* full-viewport overlay on the page even if this fake router is one of several route transitions mounted at once, and there is no guarantee it lands on this instance's own grid rather than a sibling's.

*(3) Cleanup* — `mount`'s own `destroy` already does the work this catalogue usually asks a `gsap.context` to do by hand: it removes all four link listeners, removes the `resize` listener, kills whatever tween is still running on the current `blocks` array, and empties `.transition-grid`. Keeping that function exactly as written and returning it from the effect is sufficient — there is no second cleanup mechanism to bolt on. The one thing worth understanding, if you fold this into a `gsap.context` anyway for consistency with the rest of a larger app, is that `animateIn` and `animateOut` never run while `mount` itself is executing — they run later, from inside `navigate`, which only runs from a click. Wrapping the `mount(...)` call in a context's factory does **not** make `ctx.revert()` aware of those two timelines, because a context only auto-tracks GSAP calls made during its own synchronous factory pass, and that pass has already returned by the time a navbar link is clicked. Making `ctx.revert()` catch a shutter that is mid-sweep when the route unmounts means routing `navigate` through the context by name:

```jsx
const ctx = gsap.context((self) => {
  self.add("navigate", (route) => { /* the navigate(route) body above, unchanged */ });
}, rootRef);
// wire the click handlers to call ctx.navigate(link.dataset.route) instead of the local navigate
```

That said, this is an addition, not a fix for a bug that exists — `mount`'s own kill-on-teardown already reaches whatever `blocks` currently points to at the moment `destroy` runs, which is the same guarantee a context gives you for a plain tween with no `ScrollTrigger` involved.
