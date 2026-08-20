# Award List Hover — direction-aware row flip + stacked corner image preview

## Goal

Build a full-page awards list where hovering a row slides a 3-panel wrapper vertically (GSAP `y` tween) so the row flips from an award-name panel to an inverted project panel — the slide direction depends on whether the cursor enters/leaves from the top or the bottom of the row. Simultaneously, a fixed preview box in the bottom-right corner stacks up that row's image, scaling it in from 0; images scale back out and are removed when the cursor leaves the list or idles.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) and `lenis` (npm) for smooth scrolling. No GSAP plugins are needed (no ScrollTrigger — scroll handling is a manual listener). Everything runs inside `DOMContentLoaded`.

## Layout / HTML

```
<body>
  <section class="intro"><h1>Intro</h1></section>
  <section class="awards">
    <p>Recognition and awards</p>
    <div class="awards-list"></div>
  </section>
  <section class="outro"><h1>Outro</h1></section>
  <div class="award-preview"></div>
  <script type="module" src="./script.js"></script>
</body>
```

The rows are generated in JS from a data array of **17 award objects**, each with 4 strings: `name`, `type`, `project`, `label`. Use neutral portfolio-style copy, e.g. `{ name: "Site of the day", type: "Awwwards", project: "Open Field Audio", label: "See Live" }`, a first row like `{ name: "Independent of the year", type: "Nominee", project: "INNOVATE 2024", label: "Awwwards" }`, and several `{ name: "Developer Award", ... }` rows with varied project names (invented, no real brands).

For each award object append to `.awards-list`:

```
<div class="award">
  <div class="award-wrapper">
    <div class="award-name"><h1>{name}</h1><h1>{type}</h1></div>
    <div class="award-project"><h1>{project}</h1><h1>{label}</h1></div>
    <div class="award-name"><h1>{name}</h1><h1>{type}</h1></div>
  </div>
</div>
```

Note the wrapper holds **three stacked 80px panels** (name / project / duplicated name) = 240px total, clipped to an 80px-tall row.

## Styling

- Reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `body`: background `#e3e3db`; a bold modern grotesque sans-serif (e.g. `"Saans", "Helvetica Neue", Arial, sans-serif`).
- `h1`: uppercase, `font-size: 72px`, `font-weight: 800`, `letter-spacing: -1px`, `line-height: 0.9`.
- `p`: uppercase, `1.5rem`, weight 700. `.awards p` gets `padding: 5px 20px`.
- `section`: `position: relative; width: 100vw; height: 100vh; overflow: hidden;`. `.intro` and `.outro` are flex-centered. `.awards`: `min-height: 100vh; height: max-content;`.
- `.awards-list`: `border-top: 1px solid #000`.
- `.award`: `height: 80px;` clipped with `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%)` (a full-rect clip that hides the overflowing wrapper).
- `.award-wrapper`: `position: relative; height: 240px; will-change: transform; transform: translateY(-160px);` — **initial state shows the bottom (duplicate) name panel**.
- `.award-name`, `.award-project`: `width: 100%; height: 80px; display: flex; justify-content: space-between; align-items: center; padding: 5px 15px; cursor: pointer; border-bottom: 1px solid #000;`.
- `.award-name`: background `#e3e3db`, color `#000`. `.award-project`: inverted — background `#000`, color `#e3e3db`.
- `.award-preview`: `position: fixed; bottom: 15px; right: 15px; width: 30%; height: 30%; z-index: 2;`.
- Global `img`: `position: absolute; width: 100%; height: 100%; object-fit: cover; will-change: transform;`.

## GSAP effect (exhaustive)

Initialize Lenis smooth scroll: `new Lenis({ autoRaf: true })`.

Define three wrapper positions (px for the `y` transform):
`BOTTOM = 0` (shows top name panel), `MIDDLE = -80` (shows project panel), `TOP = -160` (shows bottom name panel — the resting state).

Those three numbers are **one row height, zero / one / two times over** — `0`, `-h`, `-2h`. The demo hard-codes 80 because its rows are 80px; derive them from the row's measured height (`el.getBoundingClientRect().height`) and the same mechanic drops into a list of any row height without a single other change. Hard-coding them is the one thing that stops this being portable, and it fails silently: the wrapper still animates, it just stops at the wrong third of itself.

The duplicated third panel is what makes the whole thing work. Because the resting state is the *bottom* copy rather than the top one, the row has somewhere to travel in both directions — down towards `MIDDLE` when the pointer arrives from above, and up towards it when the pointer arrives from below — and it never has to jump back to a start position where the eye could catch it.

Keep module-level state: `lastMousePosition {x,y}`, `activeAward` (element or null), `ticking` (rAF flag), `mouseTimeout`, `isMouseMoving`. Each row also keeps its own `currentPosition`, initialized to `TOP`.

**Every tween in this component uses `duration: 0.4`, `ease: "power2.out"`, via `gsap.to`.** There are no timelines, delays or staggers.

### 1. Row `mouseenter`

- Set `activeAward = thisRow`.
- Compute `enterFromTop = e.clientY < rect.top + rect.height / 2` (rect = row's `getBoundingClientRect()`).
- If `enterFromTop` **or** `currentPosition === BOTTOM`: set `currentPosition = MIDDLE` and tween the row's `.award-wrapper` to `y: -80` (duration 0.4, power2.out). (Entering from the bottom while resting at `TOP` intentionally does nothing — the wrapper stays put.)
- Create a new `<img>` for this row: `src = ./img{index+1}.jpg` (row index 0 → `img1.jpg` … row 16 → `img17.jpg`). Style it inline: `position: absolute; top: 0; left: 0;`, initial `scale: 0` (element style), and `zIndex = Date.now()` so newer images always stack on top. Append it to `.award-preview`, then tween it with `gsap.to(img, { scale: 1, duration: 0.4, ease: "power2.out" })`. A fresh image is appended on **every** enter, even re-hovers of the same row, so images pile up.

### 2. Row `mouseleave`

- Set `activeAward = null`.
- `leavingFromTop = e.clientY < rect.top + rect.height / 2`.
- `currentPosition = leavingFromTop ? TOP : BOTTOM`, then tween the wrapper to that `y` (`-160` or `0`), 0.4s power2.out. So leaving downward rolls the project panel up out of view (name panel slides in from below), and leaving upward rolls it down.

### 3. Document `mousemove`

- Update `lastMousePosition` from `e.clientX/clientY`; set `isMouseMoving = true` and clear any pending `mouseTimeout`.
- If the cursor is inside the `.awards-list` bounding rect, arm a **2000ms `setTimeout`**: when it fires (mouse idle), set `isMouseMoving = false` and, if `.award-preview` holds more than one `<img>`, keep only the last one — every other image tweens `scale: 0` (0.4s, power2.out) and is removed with `onComplete: () => img.remove()`.
- Then call `animatePreview()`: if `lastMousePosition` is **outside** the `.awards-list` rect (any side), tween **all** images in `.award-preview` to `scale: 0` (0.4s, power2.out) and remove each `onComplete`.

### 4. Scroll handling (hover state survives scrolling)

Add a passive `document` `scroll` listener with a rAF `ticking` guard: on scroll, `requestAnimationFrame(updateAwards)` once per frame. `updateAwards()`:

1. Calls `animatePreview()` (clears the preview stack if the cursor rect-check fails after scrolling).
2. If there is an `activeAward`, re-check whether `lastMousePosition` is still inside its current bounding rect; if not, tween its wrapper to `TOP` (`-160`) when the cursor is above the row's vertical midpoint, else to `BOTTOM` (`0`) — 0.4s power2.out — and clear `activeAward`.
3. Loop all rows (skipping the active one): if `lastMousePosition` now falls inside a row's rect (the page scrolled under a stationary cursor), tween that wrapper to `MIDDLE` (`-80`), 0.4s power2.out, and mark it as `activeAward`.
4. Reset `ticking = false`.

## Assets / images

17 editorial photographs (`img1.jpg` … `img17.jpg`), one per row, loaded relative to the page. They display inside a corner box that is 30% of viewport width × 30% of viewport height, cropped with `object-fit: cover`, so any roughly landscape (≈3:2 / 16:10) imagery works — e.g. moody architecture, product or portrait shots with a coherent palette. No logos or brand marks.

## Behavior notes

- Desktop / mouse-driven only; there is no touch fallback (fine to leave as-is).
- The preview images intentionally accumulate as a stack while the user keeps moving over rows; cleanup happens only on the 2s idle timeout (keep last) or when the cursor exits the list bounds (remove all).
- `scale` on the preview images is animated via GSAP's `scale` transform (initial `0` set via the element's inline `scale` style).
- No console errors; the page scrolls normally (intro → awards → outro) with Lenis smoothing.

## Images

This component ships with 18 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/henriheymans-hover/img1.jpg
https://motionprompts.dev/c/henriheymans-hover/img10.jpg
https://motionprompts.dev/c/henriheymans-hover/img11.jpg
https://motionprompts.dev/c/henriheymans-hover/img12.jpg
https://motionprompts.dev/c/henriheymans-hover/img13.jpg
https://motionprompts.dev/c/henriheymans-hover/img14.jpg
… 12 more under https://motionprompts.dev/c/henriheymans-hover/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--cobalt`, `--cobalt-bright`, `--grey`, `--gutter`, `--list-type`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen — and StrictMode's fake unmount does not remove the DOM subtree, it only re-runs the effect against the nodes already sitting there. For this component that turns a missing cleanup into something you can literally count: the effect's first act is `awards.forEach(...)` appending 17 freshly built `.award` rows into `.awards-list`. Run that a second time without first emptying the container and the list does not gain a duplicate tween, it gains 34 rows, each pair carrying its own `mouseenter`/`mouseleave`/`touchstart` handlers hovering the same award underneath. It will not reproduce in a production build, because React only does the double invoke in development.

*(1) The entry point* — The `document.addEventListener("DOMContentLoaded", ...)` wrapping the whole component here has already fired by the time a React component mounts, so the listener is registered and never called: no rows, no preview box, no listeners, no error to chase. Delete it and move everything it wraps — the Lenis instantiation, the row generation, `animatePreview`/`updateAwards`, and every `addEventListener` call below them — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `awardsListContainer`, `awardPreview`, and `awardsList` (the same `.awards-list` node, looked up twice under two different names) all resolve against `document` because the effect currently owns the whole page. Give the component a root ref, render `.awards`, `.awards-list` and `.award-preview` inside it, and resolve those three off the ref instead — along with the `awardsElements = document.querySelectorAll(".award")` capture, which must still run *after* the rows are appended, exactly as it does today. The three listeners bound to `document` itself (`mousemove`, `touchmove`, `scroll`) are a different case: they need to see the pointer and the page scroll wherever they occur, not just inside this section, so leave them on `document`. That makes them the listeners a missing cleanup leaks most silently, since removing this component's own markup never touches anything living on `document` — see below.

*(3) Cleanup* — Wrap the effect in a `gsap.context` scoped to the root ref, but do it knowing what this component's shape does to that pattern: almost none of its tweens run during the factory's synchronous pass. The row-flip tween lives inside `mouseenter`/`mouseleave`, the preview-image tween inside the pointer-driven `showAwardPreview`/idle-timeout path, and the re-sync tween inside the scroll-driven `updateAwards` — all three fire later, from event callbacks, well after the factory has already returned. A `gsap.to` called from a bare closure at that point is not attributed to any context, so `ctx.revert()` will not touch it. Register each of those as a named method on the context and invoke it through the context, not through a bare closure:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    // row creation + Lenis setup run here, once, synchronously

    self.add("enterRow", (row, clientY) => { /* showAwardPreview body: gsap.to(wrapper, {...}) */ });
    self.add("leaveRow", (row, clientY) => { /* mouseleave body */ });
    self.add("syncOnScroll", () => { /* updateAwards body */ });

    row.addEventListener("mouseenter", (e) => ctx.enterRow(row, e.clientY));
    row.addEventListener("mouseleave", (e) => ctx.leaveRow(row, e.clientY));
  }, rootRef);

  return () => ctx.revert();
}, []);
```

That covers the tweens and the inline `transform`/`scale` GSAP wrote. It covers nothing else this effect creates, and this component creates plenty:

- **The document listeners** (`mousemove`, `touchmove`, `scroll`) and the **per-row listeners** (`mouseenter`, `touchstart`, `mouseleave`) are plain `addEventListener` calls — `gsap.context` has no idea they exist. Keep a reference to each handler and remove all of them in the same cleanup, or the StrictMode remount leaves two full sets of listeners alive, both mutating the same `lastMousePosition`/`activeAward` state.
- **`mouseTimeout`** is a bare `setTimeout` outside any GSAP API — clear it in cleanup, or the idle callback it schedules fires against a component that has already torn down, reading `awardPreview` and `activeAward` as they stood at the moment it was armed.
- **The scroll-driven `requestAnimationFrame`** is not the persistent animation loop this catalogue usually means by "its own rAF" — it is a once-per-frame throttle guarding the `scroll` listener (`ticking`), rearmed on every scroll event rather than self-rescheduling. It still has to be cancellable: today `ticking` is only a boolean, so there is no id to hand `cancelAnimationFrame`. Keep the id `requestAnimationFrame` returns in a ref and cancel it in cleanup, or a scroll that fires the instant before unmount schedules `updateAwards` for a moment after teardown, and it runs against wrappers `ctx.revert()` has already reset, laying a fresh, untracked tween back on top of them.
- **The rows and the preview images are DOM nodes this effect appended by hand**, not JSX — `ctx.revert()` does not remove them and nothing else does either. Empty `.awards-list` and `.award-preview` in the same cleanup, or the next mount's `awards.forEach` builds its 17 rows on top of the previous 17 instead of into an empty list.

Lenis here is constructed with `autoRaf` turned on, which means it already drives its own internal frame loop — skip the usual "drive Lenis's raf from your own loop and cancel that loop" step this catalogue's other Lenis components need, it does not apply to this setup. The one obligation that remains is calling Lenis's destroy method in the same cleanup; skip that and its internal loop keeps ticking against a scrollbar the user has already navigated away from. If this section is meant to share one continuous scroll experience with the rest of the app rather than own its own, lift this Lenis instance to the app shell and consume the existing one instead of constructing a second — two instances fight over the same wheel event with no error in the console to point at.
