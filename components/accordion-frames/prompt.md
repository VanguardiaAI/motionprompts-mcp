# Accordion Frames — Spotlight Row

## Goal
Build a full-viewport, dark hero section containing a single horizontal **accordion row of tall, thin image slivers**. All panels sit collapsed to a 20px-wide sliver by default; hovering one panel (tapping on mobile) makes it smoothly **expand to a wide 400px "frame"** while every other panel simultaneously **collapses back to 20px**, all sliding to make room via a slow, decelerating ease. A crisp **white focus frame** with two thin vertical crosshair lines running the full height of the viewport glides along the row to sit exactly over the currently focused panel. The star effect is this synchronized expand/collapse "accordion" motion plus the tracking frame.

## Tech
Vanilla HTML/CSS/JS. **No GSAP, no npm animation libraries, no smooth-scroll** — the entire motion is a **CSS `transition`** on `left`/`width` driven by a small vanilla-JS layout engine, plus a `ResizeObserver`. Ship it as one `index.html`, one `styles.css`, one ES-module `script.js` (`<script type="module">`). It must run in a fresh Vite project with zero dependencies.

## Layout / HTML
Minimal semantic skeleton — the JS injects the panels at runtime:

```html
<main>
  <section class="spotlight">
    <div class="spotlight-track">
      <div class="spotlight-panels">
        <div class="spotlight-focus-indicator"></div>
      </div>
    </div>
  </section>
</main>
```

- `.spotlight` — the full-viewport bone stage.
- `.spotlight-track` — a centered, width-constrained band (this is the element observed by the `ResizeObserver`; its measured content width drives all the math).
- `.spotlight-panels` — the relative-positioned container the JS fills with absolutely-positioned panels.
- `.spotlight-focus-indicator` — a single pre-existing white frame element that the JS positions over the focused panel.

Each panel the JS creates:
```html
<div class="spotlight-panel">
  <img src="<panel image>" />
</div>
```

## Styling

**Palette / light stage** — the stage is **bone paper**, not a dark room; the only saturated things on it are the cobalt tracking frame and a lime highlight that always carries black ink:
```css
:root {
  --paper: #f0ede4;
  --paper-lift: #f7f5ee;
  --ink: #0d0d0d;
  --ink-dim: #3a3a38;
  --muted: #5f6368;
  --mark: #1141ff;   /* cobalt: the focus frame and its crosshairs */
  --pop: #c6f21e;    /* lime highlight, black ink on top */
  --edge: max(5vw, calc((100vw - 1400px) / 2));
}
```
- `.spotlight`: `position: relative; width: 100%; height: 100svh; background-color: var(--paper); overflow: hidden;` (the `overflow: hidden` is essential — panels and crosshairs must be clipped to the stage).

**Track**
- `.spotlight-track`: `position: absolute; top: 50%; left: 50%; width: 90%; max-width: 1400px; transform: translate(-50%, -50%);` — a centered band.

**Panels container**
- `.spotlight-panels`: `position: relative; width: 100%; height: 400px;` (drops to `260px` at `max-width: 1000px`).

**Panel**
- `.spotlight-panel`: `position: absolute; top: 0; height: 100%; overflow: hidden; cursor: pointer; will-change: left, width;`
- **The motion lives here:** `transition: all 1s cubic-bezier(0.075, 0.82, 0.165, 1);` — a slow (1 second) ease-out ("easeOutCirc"-style) curve. `left` and `width` are set inline by the JS in pixels; the CSS transition interpolates every change.

**Panel image**
- `.spotlight-panel img`: `position: absolute; left: 50%; transform: translateX(-50%); width: 400px; height: 100%; object-fit: cover; pointer-events: none; user-select: none;`
- Trick: the `<img>` is a **fixed 400px wide**, horizontally centered inside its panel. When the panel is a 20px sliver, the image is cropped by the panel's `overflow: hidden` to a 20px-wide vertical slice taken from the image's horizontal center. When the panel expands to 400px the full image is revealed — so the sliver is a live crop of the eventual full frame, and there is no image resize during the transition, only the panel window widening.
- On mobile (`max-width: 1000px`) the image width drops to `200px` and the expanded panel width to `100px`.

**Focus indicator (the cobalt tracking frame + crosshairs)**
- `.spotlight-focus-indicator`: `position: absolute; top: 0; height: 100%; border: 3px solid var(--mark); pointer-events: none; z-index: 100; will-change: left, width; transition: all 1s cubic-bezier(0.075, 0.82, 0.165, 1);` — **the exact same transition as the panels**, so the frame glides in perfect sync with the accordion.
- Two full-viewport-height vertical crosshair lines via pseudo-elements, both `content: ""; position: absolute; left: 50%; transform: translateX(-50%); width: 3px; background: var(--mark);`:
  - `::before` → `bottom: 100%; height: 100svh;` (line shooting up from the frame's top edge to the top of the viewport).
  - `::after` → `top: 100%; height: 100svh;` (line shooting down from the frame's bottom edge to the bottom of the viewport).
- Net look: a bright white rectangle hugging the focused frame, with thin white vertical guide lines extending above and below it across the whole screen.

## The effect (be exhaustive — this replaces the GSAP section)

There is **no GSAP timeline**. The animation is achieved entirely by (a) CSS `transition: all 1s cubic-bezier(0.075, 0.82, 0.165, 1)` on the panels and the focus indicator, and (b) a JS function that, on every focus change or resize, recomputes each panel's exact pixel `left` and `width` and writes them inline. The browser then tweens from old to new values over 1s with that ease. Reproduce the math precisely:

**Constants**
```
PANEL_WIDTH_COLLAPSED       = 20    // px sliver width
PANEL_WIDTH_EXPANDED        = 400   // px focused frame width (desktop)
PANEL_WIDTH_EXPANDED_MOBILE = 100   // px focused frame width (mobile)
PANEL_GAP                   = 5     // px gap between panels
PANEL_COUNT_DESKTOP         = 20    // panels on desktop
PANEL_COUNT_MOBILE          = 10    // panels on mobile
BREAKPOINT_MOBILE           = 1000  // px; window.innerWidth < this => mobile
```

**State**: `trackWidth` (measured), `isMobile` (boolean), `focusedPanel` (index, default `0`), `panels` (array of elements).

**Per-panel position math** — `getPanelPosition(panelIndex)`:
1. `panelCount` = mobile ? 10 : 20. `expandedWidth` = mobile ? 100 : 400.
2. `totalTrackWidth = (panelCount - 1) * (PANEL_WIDTH_COLLAPSED + PANEL_GAP) + expandedWidth` — total width of the row (every panel is a 20px collapsed sliver except one 400px expanded one, with 5px gaps).
3. `offsetToCenter = (trackWidth - totalTrackWidth) / 2` — horizontal offset that centers the whole row inside the track. This is the starting `left`.
4. Walk from index 0 up to `panelIndex`, adding each preceding panel's width plus `PANEL_GAP`: a preceding panel contributes `expandedWidth` if it is the focused one, else `PANEL_WIDTH_COLLAPSED` (20). Accumulate into `left`.
5. `width` = `panelIndex === focusedPanel ? expandedWidth : PANEL_WIDTH_COLLAPSED`.
6. Return `{ left, width }`.

**Apply** — `applyPositions()`: loop all panels, compute `{left,width}`, set `panel.style.left = left+"px"` and `panel.style.width = width+"px"`. Then compute the focused panel's `{left,width}` and set the **focus indicator's** `left`/`width` to the same, so the white frame lands exactly on the focused panel. Because both the panels and the indicator carry the 1s cubic-bezier transition, changing these inline values makes everything glide together.

**Focus** — `focusPanel(index)`: set `focusedPanel = index`, then `applyPositions()`. This one call causes the newly-focused panel to widen 20→400, its neighbors to shift, the previously-focused panel to shrink 400→20, and the frame to slide — all in a single synchronized 1s ease.

**Build** — `buildPanels()`: remove any existing panels, reset `focusedPanel = 0`, then for `i` in `0..panelCount`: create `.spotlight-panel`, append an `<img>` whose `src` is the i-th panel image, and attach the interaction:
- desktop → `mouseenter` calls `focusPanel(i)`
- mobile → `click` calls `focusPanel(i)`

Append each panel to `.spotlight-panels`, push to `panels`, then `applyPositions()`. (Panel index 0 is focused/expanded on first paint.)

**Trigger & interaction model**
- Desktop: **hover** — moving the mouse onto any panel expands it; sweeping the mouse across the row makes the frames "accordion" open one after another following the cursor, the white frame chasing along.
- Mobile: **tap/click** to focus a panel.
- No scroll, no click-to-toggle, no auto-play. Idle state = panel 0 expanded.

**ResizeObserver** — observe `.spotlight-track`. On every callback: read `entry.contentRect.width` into `trackWidth`; compute `nextIsMobile = window.innerWidth < 1000`. If the mobile state flipped, set `isMobile` and **rebuild** the panels (count changes 20↔10). Otherwise just `applyPositions()` to re-center for the new width. Kick everything off by calling `buildPanels()` once, then `observer.observe(track)`. Run all of this inside a `DOMContentLoaded` listener.

**Easing note**: the single most important motion detail is the ease — `cubic-bezier(0.075, 0.82, 0.165, 1)` over `1s`. It starts fast and decelerates hard into a long slow settle, giving the panels a weighty, glidey "drawer" feel. Do not substitute a linear or default ease.

## Assets / images
20 **square (1:1) grainy, moody editorial fashion-film photographs**, all filling the same role: interchangeable panel fills, one per accordion sliver. There is no single subject type — the set is a curated mix that shares a soft, filmic, high-art mood rather than a literal theme. Two visual families run through it:
- **Monochrome portraits** — tight black-and-white studio-style headshots against flat light-grey grounds: a woman's sharp profile with pearl-drop earrings in a black blazer; a bald young face carved by hard directional shadow; a soft, near-overexposed face seen through a veil of translucent white gauze. High grain, deep blacks, luminous pale skin.
- **Ethereal desaturated-color scenes** — pale, almost-albino figures in white dresses inside dreamlike environments: a white-gowned figure flanked by two black swans on a misty green pond with water lilies; a white-clad figure seated in a decayed flower-filled interior with a gilt mirror; a red-blindfolded bald figure under ivy-wrapped gothic stone arches; a platinum-haired woman crowned with clear-crystal butterflies in a sunlit rose garden. Only one image (the opening panel) is a genuine **motion-blurred** figure — a runner in a loose grey jacket and cream trousers smeared across a muted grey-blue backdrop.

Dominant colors across the set: creamy whites and pale skin, deep blacks and charcoal greys, soft muted greens and misty pastels, with the occasional saturated accent (a red blindfold). Overall low-saturation, high-grain, cinematic and quiet — not clean commercial studio work.

Each image is displayed at a fixed 400px render width (200px on mobile) and cropped to a 20px vertical sliver when collapsed, so **the horizontal center of each image is what shows in the sliver** — the central subject (a face, a standing figure) generally sits mid-frame and is what reads in the collapsed sliver. The native files are square, and since the desktop panel is 400px tall the effective render is ~400×400; `object-fit: cover` fills the panel so any square or tall crop works. Only the first 10 are needed on mobile. No logos, no brand marks — neutral, editorial-artistic film photography. File paths follow a simple indexed pattern (e.g. `spotlight-1.jpg` … `spotlight-20.jpg`).

## Behavior notes
- Fully responsive via the single `1000px` breakpoint: 20 panels / 400px expanded / 400px image on desktop, 10 panels / 100px expanded / 200px image on mobile; interaction switches hover↔tap accordingly.
- The layout is recomputed in pixels on every resize, keeping the row centered inside the `max-width: 1400px`, 90%-wide track.
- No infinite loops or timers; motion only occurs in response to hover/tap/resize.
- The full-height crosshair lines rely on the stage's `overflow: hidden` to clip cleanly at the viewport edges; keep the `100svh` stage and `svh` units for correct mobile viewport height.

## Images

This component ships with 20 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/accordion-frames/spotlight/spotlight-1.jpg
https://motionprompts.dev/c/accordion-frames/spotlight/spotlight-10.jpg
https://motionprompts.dev/c/accordion-frames/spotlight/spotlight-11.jpg
https://motionprompts.dev/c/accordion-frames/spotlight/spotlight-12.jpg
https://motionprompts.dev/c/accordion-frames/spotlight/spotlight-13.jpg
https://motionprompts.dev/c/accordion-frames/spotlight/spotlight-14.jpg
… 14 more under https://motionprompts.dev/c/accordion-frames/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-lift`, `--paper`, `--paper-dim`, `--muted`, `--mark`, `--edge`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself — the tab reloads long before `buildPanels()` or the `ResizeObserver` feeding it could ever run twice against the same DOM. React withdraws that guarantee, and here the failure is concrete rather than cosmetic.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen — but the JSX this component renders (the `<section class="spotlight">` skeleton with `.spotlight-track` / `.spotlight-panels` / `.spotlight-focus-indicator` already in it) is not torn down between those two runs; only the effect body re-executes. `buildPanels()` opens with `panels.forEach((panel) => panel.remove()); panels = [];`, but `panels` is a variable local to the effect's own closure. The first run's closure and the second run's closure each start with their own empty `panels` array, so the second `buildPanels()` call has nothing to remove — it appends a fresh set of twenty (ten on mobile) `.spotlight-panel` elements into `.spotlight-panels` on top of the twenty the first run already left sitting there, and a second `ResizeObserver` starts watching the same `.spotlight-track` alongside the first. The visible symptom is a stack of doubled, overlapping frames, each generation answering `mouseenter`/`click` independently and tracking its own copy of `focusedPanel`, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script subscribes straight to `DOMContentLoaded` with no `document.readyState` guard in front of it. By the time a React component mounts, that event has already fired, so a listener wired up this way would simply never run — no error, no accordion, nothing to debug. Drop the `document.addEventListener("DOMContentLoaded", …)` wrapper entirely and move its body — the three `querySelector` lookups, `getPanelCount`/`getExpandedWidth`/`getPanelPosition`/`applyPositions`/`focusPanel`/`buildPanels`, and the closing `buildPanels(); observer.observe(track);` pair — into a `useEffect` with an empty dependency array. The module-level constants (`PANEL_WIDTH_COLLAPSED`, `PANEL_WIDTH_EXPANDED`, `PANEL_GAP`, `PANEL_COUNT_DESKTOP`, `BREAKPOINT_MOBILE`, `FRAME_NOTES`, …) can stay outside the component exactly as they are — nothing about them is DOM-dependent.

*(2) Element lookups* — `.spotlight-track`, `.spotlight-panels`, and `.spotlight-focus-indicator` are all looked up by class off `document`. Give the outer `<section>` a root `ref` and either scope the three lookups to it or, cleaner given how often each one is read inside the closures above, hold three separate refs (`trackRef`, `panelsRef`, `focusRef`) set directly on the JSX and dereferenced once at the top of the effect. The optional counter — `.frame-index` / `.frame-total` / `.frame-note`, gated in the original by `if (!counterIndex) return`, precisely so the markup can be absent — is simpler not to port as a ref-and-`textContent` pair at all: `focusedPanel` and `FRAME_NOTES[focusedPanel]` are already the values that would feed it, so render those three pieces straight from state in JSX and drop the imperative writes and the null-check they exist for.

*(3) Cleanup* — There is no GSAP, no smooth-scroll, and no self-driven `requestAnimationFrame` loop in this component; the motion is a plain CSS `transition` reacting to inline `left`/`width` writes. The only long-lived object the effect creates is the `ResizeObserver`, and the only accumulating side effect is the panel elements `buildPanels()` injects — both have to be undone in the function the effect returns, using the same `panels` and `observer` bindings the effect body already declares:

```jsx
useEffect(() => {
  let panels = [];
  // ...getPanelCount, getExpandedWidth, getPanelPosition, applyPositions,
  // focusPanel and buildPanels exactly as described above, closing over `panels`...

  const observer = new ResizeObserver(([entry]) => { /* as above */ });
  buildPanels();
  observer.observe(trackRef.current);

  return () => {
    observer.disconnect();
    panels.forEach((panel) => panel.remove());
  };
}, []);
```

`panels` already tracks exactly what `buildPanels()` last appended, including after a mobile/desktop rebuild triggered from inside the `ResizeObserver` callback — so removing it in the cleanup is not new bookkeeping, it is running the same removal `buildPanels()` already performs on every rebuild, one final time, on the way out. Skipping that is what produces the doubled panels described above. Skipping only `observer.disconnect()` is quieter but just as real: on an actual unmount (a route change, not a StrictMode dev remount), a live observer left running keeps calling into a `focusPanel`/`applyPositions` closure whose panel elements have already been removed, writing `left`/`width` onto nodes nothing shows anymore.
