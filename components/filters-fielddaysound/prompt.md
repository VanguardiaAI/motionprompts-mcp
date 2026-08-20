# Filter Gallery with Letter-by-Letter Swelling Headings

## Goal

Build a full-screen editorial gallery on a white page: a **two-column staggered (masonry-ish) image grid** fills the left, and a stack of **oversized category filters** sits bottom-right. Clicking a filter is the star effect — the clicked category's heading is split into per-character `<span>`s and its **`font-size` tweens up letter-by-letter with a stagger** (a small word swelling into a giant magenta headline), the previously-active heading simultaneously **shrinks back down** the same way, and the item grid **cross-fades out and back in** to swap in only the items matching that category.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) only — **no GSAP plugins**, no smooth-scroll library.

```js
import gsap from "gsap";
```

The character-splitting is done by hand (not SplitText). Run everything inside a `DOMContentLoaded` listener.

## Layout / HTML

Class names are load-bearing (JS and CSS query them). Static markup is minimal — the gallery items are injected by JS.

```html
<div class="container">
  <div class="filters">
    <div class="filter active" data-filter="all">
      <p>(34)</p>
      <h1>All</h1>
    </div>
    <div class="filter" data-filter="mix">
      <p>(13)</p>
      <h1>Remixes</h1>
    </div>
    <div class="filter" data-filter="design">
      <p>(11)</p>
      <h1>Sound Designing</h1>
    </div>
    <div class="filter" data-filter="music">
      <p>(10)</p>
      <h1>Production</h1>
    </div>
  </div>

  <div class="items">
    <div class="items-col"></div>
    <div class="items-col"></div>
  </div>
</div>
```

- Four filters. The first (`data-filter="all"`) starts with class `active`. Each filter has a small count `<p>` (the parenthesised number) sitting above a big `<h1>` label.
- Filter labels / counts / filter-keys: **All (34) → `all`**, **Remixes (13) → `mix`**, **Sound Designing (11) → `design`**, **Production (10) → `music`**. (Neutral music-studio category words — no brand.)
- `.items` holds exactly **two** empty `.items-col` columns; JS fills them.

### Data model (drives the grid)

Define a module-level array `items` of **34** objects, each `{ title: string, tag: [oneOf "mix" | "design" | "music"], img: string }`. Titles are evocative music/art phrases; keep this exact order and tagging (it determines each filter's count and which cards appear):

| # | title | tag |
|---|-------|-----|
| 1 | Echoes of Silence | mix |
| 2 | Midnight Canvas | design |
| 3 | Vibrant Rhythms | music |
| 4 | Shadow Dance | mix |
| 5 | Colorful Serenity | design |
| 6 | Dream Weaver | mix |
| 7 | Urban Mirage | design |
| 8 | Sonic Bloom | music |
| 9 | Celestial Nights | mix |
| 10 | Harmony Quest | music |
| 11 | Abstract Harmony | design |
| 12 | Rhythm and Space | mix |
| 13 | Ethereal Echoes | music |
| 14 | Whispers of Twilight | mix |
| 15 | Mosaic of Dreams | design |
| 16 | Glimpse of Eternity | mix |
| 17 | Infinite Palette | mix |
| 18 | Soul's Resonance | music |
| 19 | Spectral Designs | design |
| 20 | Temporal Visions | mix |
| 21 | Luminous Journey | design |
| 22 | Melodic Horizon | music |
| 23 | Eclipse of the Heart | mix |
| 24 | Canvas of Sound | design |
| 25 | Aurora's Whisper | mix |
| 26 | Visions in Bloom | design |
| 27 | Harmonious Disarray | music |
| 28 | Orchestral Dreams | music |
| 29 | Symphony of Night | design |
| 30 | Echoing Serenade | music |
| 31 | Mystical Frequencies | mix |
| 32 | Serenity in Chaos | mix |
| 33 | Rhythmic Illusions | music |
| 34 | The Color of Sound | design |

(This yields mix = 13, design = 11, music = 10, all = 34 — matching the filter counts.)

Each item's markup, generated at runtime:

```html
<div class="item">
  <div class="item-img"><img src="{item.img}" alt=""></div>
  <div class="item-copy"><p>{item.title}</p></div>
</div>
```

## Styling

Palette: page background is default **white** (`#fff`, no explicit background), text **black** (`#000`), and the **active heading accent is magenta `#fb5eff`**. That's the whole palette — a stark white editorial layout with one hot-pink highlight.

Fonts:
- Headings (`.filter h1`): a **heavy, wide display grotesque** — original uses "Druk Trial". Use a very bold condensed/wide display face (e.g. `"Druk Trial"` with a fallback like `Anton`, or any ultra-bold sans). It must read as a big blocky headline.
- Counts and item captions (`.filter p`, `.item-copy p`): a **clean neutral sans** — original uses `"PP Neue Montreal"`, weight 500 (fallback: system grotesque like `Helvetica`, `Arial`).

Global: `* { margin:0; padding:0; box-sizing:border-box }`. `body { width:100%; height:100%; font-family:"Druk Trial" }`. `img { width:100%; height:100%; object-fit:cover }`.

**Filters (fixed, bottom-right):**
- `.filters { position:fixed; top:0; right:0; width:50vw; height:100vh; padding:1em; display:flex; flex-direction:column; justify-content:flex-end; align-items:flex-end }` — the four filters stack at the bottom, right-aligned. (Because each label is right-aligned `max-content` and grows huge, the active headline overflows leftward across the page.)
- `.filter { width:max-content; height:max-content; padding:1.5em 0 0.5em 0; display:flex; align-items:flex-end; cursor:pointer }`.
- `.filter.active { padding-top:2.5em }` (active row gets a bit more headroom — snaps, not animated).
- `.filter p { position:relative; bottom:10px; padding:0 0.5em; font-family:"PP Neue Montreal"; font-size:20px; font-weight:500 }`; `.filter.active p { bottom:24px }` (the little count floats a touch higher when active).
- `.filter h1 span { position:relative; text-transform:uppercase; font-size:75px; color:#000; line-height:80%; transition:color 0.3s }` — **note the styling targets `h1 span`, not `h1`**, because JS wraps every character in a span. `line-height:80%` keeps the giant type tight. The `transition:color 0.3s` handles the black↔magenta color swap in CSS.
- `.filter.active h1 span { color:#fb5eff }` — active heading letters turn magenta.

**Items (absolute, left):**
- `.items { position:absolute; top:0; left:0; width:60%; height:100%; padding:2em; display:flex }`.
- `.items-col { flex:1; height:max-content; padding:2em 1em }`.
- `.items-col:nth-child(2) { position:relative; top:10em }` — the second column is pushed **down 10em**, creating the staggered/masonry offset between the two columns.
- `.item { padding:1em 1em 4em 1em }` (generous bottom gap between cards).
- `.item-img { width:100%; height:300px }` — every card image is a fixed **300px-tall** box, `object-fit:cover`.
- `.item-copy p { font-family:"PP Neue Montreal"; font-size:15px; font-weight:500; margin:0.5em 0 }` — small caption under each image.

**Responsive (`@media (max-width:900px)`):** `.items { width:100% }`; `.filters { z-index:2 }` (filters float over the grid); `.filter` gets a frosted-glass chip look: `background:rgba(255,255,255,0.1); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.25)`.

## GSAP effect (be exact)

There are three moving parts, all plain `gsap.to` tweens (no timeline, no plugins). The magic is that headings are **split into per-character spans** so `font-size` can be staggered across letters.

### 1. Split every heading into character spans

Helper `splitTextIntoSpans(selector)`: for each element matching the selector, take its `innerText`, split on `""` (every character, **including spaces**), and replace `innerHTML` with each char wrapped as `<span>${char}</span>` (joined with `""`). Call it once on load with selector `".filter h1"`, so all four headings become sequences of single-character spans. All CSS font sizing/coloring targets these spans.

### 2. Font-size swell/shrink tween (the star)

Helper `animateFontSize(target, fontSize)`:

```js
function animateFontSize(target, fontSize) {
  const spans = target.querySelectorAll("span");
  gsap.to(spans, {
    fontSize: fontSize,   // e.g. "300px" / "250px" / "75px"
    stagger: 0.025,       // 25ms between consecutive letters, left→right
    duration: 0.5,
    ease: "power2.out",
  });
}
```

- Animated property: **`fontSize`** of each `<span>`, from its current CSS size (base `75px`) to the target string.
- `stagger: 0.025` → each successive letter starts 25ms after the previous, so the word appears to inflate/deflate letter by letter from left to right.
- `duration: 0.5`, `ease: "power2.out"`, no delay.

**Size constants** (note the deliberate quirk — the on-load size and the on-click size differ):
- `defaultFontSize = "75px"` (inactive resting size).
- `activeFontSize = "250px"` (size a filter grows to **when clicked**).
- On initial load, the pre-active "All" heading is grown to **`"300px"`** (a hardcoded value, larger than the 250px used for click-activations).

### 3. Item grid cross-fade + rebuild

Helper `animateItems(filter)` fades the whole `.items` container out, swaps its DOM contents, then fades back in:

```js
function animateItems(filter) {
  gsap.to(itemsContainer, {
    opacity: 0,
    duration: 0.25,
    onComplete: () => {
      clearItems();            // empty both .items-col innerHTML
      addItemsToCols(filter);  // rebuild with filtered items
      gsap.to(itemsContainer, { opacity: 1, duration: 0.25 });
    },
  });
}
```

- Two back-to-back opacity tweens: `1 → 0` (0.25s), then in the `onComplete` rebuild the DOM and tween `0 → 1` (0.25s). No easing specified (GSAP default `power1.out`). Net: a ~0.5s cross-fade that hides the content swap.

`addItemsToCols(filter = "all")`: filter the `items` array with `filter === "all" || item.tag.includes(filter)`, then loop the survivors and **alternate them between the two columns** — maintain a running `colIndex`, append each item to `itemsCols[colIndex % 2]`, increment `colIndex`. So item 0 → col 0, item 1 → col 1, item 2 → col 0, … The DOM node for each item is the `.item` template above.

### On load (in order)

```js
splitTextIntoSpans(".filter h1");
animateFontSize(document.querySelector(".filter.active h1"), "300px"); // grow "All" to 300px
addItemsToCols();  // populate both columns with all 34 items
```

### Click handler (on each `.filter`)

For every `.filter`, add a `click` listener:

1. If the clicked filter already has class `active`, **return** (no-op).
2. Grab the currently active heading (`.filter.active h1`) and call `animateFontSize(previousActiveH1, "75px")` — shrink it back to base, letter by letter.
3. Remove `active` from **all** filters, add `active` to the clicked one. (This flips the CSS color: old heading letters transition #fb5eff→#000 over 0.3s, new ones →#fb5eff.)
4. Call `animateFontSize(clickedH1, "250px")` — swell the new heading to 250px, letter by letter.
5. Read the clicked filter's `data-filter` and call `animateItems(filterValue)` to cross-fade the grid to that category.

So a click plays three concurrent tweens: old heading shrinking (0.5s staggered), new heading swelling (0.5s staggered, magenta), and the grid cross-fade (0.25s + 0.25s).

## Assets / images

**34 moody editorial photographs**, mixed subjects (as a music/creative-studio portfolio wall): **studio gear** shot like still life (analog synth knobs, a reel-to-reel tape machine under tungsten, a microphone in an acoustic booth, mixing-console faders under blue light), low-light **portraits** (a neon-lit profile, a hooded face cut by a slash of light, black-and-white close-ups, a silhouette against a softbox), **workspaces** (a pottery bench, a plant-filled desk, a drafting table), **architecture** (a brutalist facade, terracotta arches, a curved plaster alcove), **landscapes** (salt flat, dunes, ocean, forest sunbeams, above the clouds) and **movement** (a dancer leaping at sunset, long-exposure blurs, satin in motion). Any aspect ratio works — each is cropped to a fixed **300px-tall** landscape card via `object-fit:cover`; roughly half-column-wide, so ~4:3–3:2 landscape crops read best. Name them `img1.jpg … img34.jpg` and map them to the `items` array in the table order above (img N → item N). Each card shows its `title` as a small caption beneath the image.

## Behavior notes

- **Click-only** interaction — no scroll, hover, or load-time motion beyond the initial "All" swell. Re-clicking the active filter does nothing.
- The active headline grows so large (250–300px) that it deliberately overflows the 50vw filters column and sprawls left across the page, overlapping the gallery — that oversized-type collision is the intended editorial look.
- No `prefers-reduced-motion` handling in the original.
- The whole piece is desktop-first; on ≤900px the grid goes full-width and the filters become frosted-glass chips layered above it (`z-index:2`).
- Nothing here uses ScrollTrigger, Lenis, SplitText, CustomEase, canvas, or WebGL — it's pure `gsap.to` on `fontSize` (staggered across hand-made character spans) and on container `opacity`.

## Images

This component ships with 34 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/filters-fielddaysound/img1.jpg
https://motionprompts.dev/c/filters-fielddaysound/img10.jpg
https://motionprompts.dev/c/filters-fielddaysound/img11.jpg
https://motionprompts.dev/c/filters-fielddaysound/img12.jpg
https://motionprompts.dev/c/filters-fielddaysound/img13.jpg
https://motionprompts.dev/c/filters-fielddaysound/img14.jpg
… 28 more under https://motionprompts.dev/c/filters-fielddaysound/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--accent`, `--muted`, `--line`, `--display`, `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two heading spans mid-tween off the same click, two full sets of item cards stacked inside the same two columns. The visible symptom is jitter or a doubled grid, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no split headings, no items, nothing to debug. Delete the listener and move its body — `splitTextIntoSpans(".filter h1")`, the initial `animateFontSize` call on the active heading, `addItemsToCols()`, the `resize` listener, and the four `.filter` click listeners — directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — Every `document.querySelector` in the code above assumes this component owns the document. Give the component a root `ref`, render it on the outermost element, and scope every lookup to it. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of the subtree exist for an instant, and an unscoped selector will bind to the one that is on its way out.

*(3) Cleanup* — Wrap the on-load work — the character split, the initial swell of the active heading, the item build, and the wiring of the resize and click listeners — in a `gsap.context` scoped to the root ref, and revert it in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    splitTextIntoSpans(".filter h1");
    animateFontSize(rootRef.current.querySelector(".filter.active h1"), getActiveFontSize());
    addItemsToCols();
    // wire the resize listener and the four .filter click listeners here
  }, rootRef);
  return () => ctx.revert();
}, []);
```

None of the three real animations this component performs run during that synchronous pass, though. `animateFontSize` on the outgoing and the newly-active heading, and the pair of `gsap.to` calls inside `animateItems` — the fade-out, and, nested inside its own `onComplete`, the fade-back-in — all fire later, from a `.filter`'s `click` listener, an arbitrary amount of time after the factory has already returned, possibly after a StrictMode remount has thrown this closure away for a new one. Attribute each to the context explicitly, at the moment it runs, with the immediate-invoke form of `self.add`:

```jsx
filterEl.addEventListener("click", () => {
  if (filterEl.classList.contains("active")) return;
  self.add(() => {
    animateFontSize(previousActiveH1, getDefaultFontSize());
    filters.forEach((f) => f.classList.remove("active"));
    filterEl.classList.add("active");
    animateFontSize(newActiveH1, getActiveFontSize());
    animateItems(filterEl.dataset.filter);
  });
});
```

`self` is safe to close over here: the listener is declared inside the same factory that received `self` as its argument, so there is no re-entry into `gsap.context` and none of the temporal-dead-zone hazard that rules out naming `ctx` inside the factory body. The nested tween inside `animateItems`'s `onComplete` — the return to full opacity, once `clearItems()`/`addItemsToCols(filter)` have rebuilt the columns — needs its own `self.add`, not a free ride from the outer one: `onComplete` fires after the fade-out tween finishes, well outside the call that invoked the outer one, so wrap that inner `gsap.to` the same way, or it survives `ctx.revert()` and keeps writing opacity onto a container React has already discarded mid-transition.

The `resize` listener that recalculates every heading's font size (`gsap.set` on each filter's spans) has the mirror-image problem: it is a plain `window` listener, not a GSAP construct, so `ctx.revert()` never reaches it no matter where in the factory you attach it. Keep the function reference and call `window.removeEventListener("resize", handleResize)` in the same cleanup — skip this and the remount leaves two resize listeners each rewriting `fontSize` on the same spans on every orientation change.

`ctx.revert()` also does not touch the item cards themselves: `addItemsToCols` builds each `.item` with `createElement`/`innerHTML` and appends it into one of the two `.items-col` elements, and the on-load call never clears them first — `clearItems()` is otherwise only reached from inside `animateItems`, right before a click-driven rebuild. Call `clearItems()` (or `replaceChildren()` on both `.items-col` elements) in the effect's own cleanup too, or the StrictMode remount's second `addItemsToCols()` appends a second full set of 34 cards behind the first, doubling both columns instead of replacing their contents.

One thing this component does *not* need extra guarding for: `splitTextIntoSpans` rebuilds each `<h1>` from `element.innerText`, not `innerHTML`, so re-running it against an already-split heading reads back the plain characters and re-wraps them once — it does not nest a `<span>` inside a `<span>` the way re-running GSAP's `SplitText` plugin on its own output would. The only precondition is that `ctx.revert()` has already put the previous pass's spans back to their CSS default size before the second `splitTextIntoSpans` call runs, so the two mounts start from the same clean markup.
