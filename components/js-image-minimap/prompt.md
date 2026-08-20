# Sticky Image Minimap — Thumbnail Strip That Glides Through a Fixed Indicator as You Scroll a Tall Gallery

## Goal
Build a **tall, black, editorial vertical image gallery** with a **sticky sidebar minimap** on the left. The gallery column (75% wide) holds ten large stacked photos; the minimap (25% wide) is pinned to the viewport and contains a vertical strip of the same ten photos as small thumbnails. The star effect: as the page scrolls through the gallery, the whole thumbnail strip **slides vertically (translateY)** behind a **fixed bordered indicator box**, so the minimap "plays through" its thumbnails in lockstep with the scroll — the thumbnail currently framed by the indicator matches the large photo you're looking at. The indicator uses `mix-blend-mode: difference` so its outline stays legible over any thumbnail. A second scroll trigger: once you've scrolled past **four viewport heights**, the entire page **inverts from a black theme to a white theme** with a smooth 0.5s color transition.

## Tech
Vanilla HTML/CSS/JS. **No GSAP, no animation library, no smooth-scroll library.** The entire effect is two plain `window` scroll listeners that write `element.style.transform` and toggle a CSS class; all easing/transitions are pure CSS `transition`. Ships as an ES module (`<script type="module" src="./script.js">`) but imports nothing. Everything runs inside a single `DOMContentLoaded` handler.

## Layout / HTML
```
.wrapper                                  (full-page shell; carries the theme class)
  nav                                     (fixed top strip)
    a  "Motionprompts"                    (fictional brand / logo — left)
    a  "Subscribe"                        (right)

  .gallery                                (flex row: minimap | images)
    .minimap                              (sticky left column, 25%)
      .preview                            (the vertical thumbnail STRIP — this is what translates)
        .item-preview > img   × 10        (100×125 thumbnails, one per gallery photo, same order)
      .active-img-indicator               (fixed bordered box that frames the "current" thumbnail)

    .images                               (the tall gallery column, 75%)
      .item            × 10
        .item-img > img                   (large 500×550 photo)
        .item-copy
          p  "img_01.jpg" … "img_010.jpg" (filename label — left)
          p  "01" … "10"                  (index — right)

  .container                              (lower editorial text section)
    h1   <long travel headline paragraph>
    .hero-img > img                       (full-width wide hero photo)
    h1   <second travel headline paragraph>
    h1   <third travel headline paragraph>
```
Key classes the JS depends on: `.images`, `.preview`, `.minimap`, `.wrapper`. The `.preview` strip and its ten `.item-preview` thumbnails hold the **same ten images in the same order** as the ten `.item` photos in `.images`. Nav brand is the fictional **"Motionprompts"** / **"Subscribe"** — no real brand names. Headline copy is generic travel-editorial prose (three paragraphs about horizons, hidden gems, and curated expeditions).

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. Fonts: **Space Grotesk** for the page and headings, **Space Mono** for the small uppercase labels. `img { width:100%; height:100%; object-fit:cover; }` (every image hard-crops to its slot).

**Palette (P10 Sky):** the page is not black but a **fixed sky gradient** — `background-color:#2f8bff` under `linear-gradient(180deg, #2f8bff 0%, #3d8bfa 55%, #4f8ff5 82%, #9cc8ff 100%)` with `background-attachment: fixed`, so the sky holds still while the plates scroll over it. Type over the sky is white `#ffffff`; ink is `#0d0d0d`; the accent is lime `#c6f21e`, always carrying black ink on top. `.wrapper` itself is `background-color: transparent` so the body gradient shows through.

**Type:**
- `a, p { text-decoration:none; color:#ffffff; font-size:14px; font-weight:500; text-transform:uppercase; transition:0.5s color; }` — the small labels run in Space Mono.
- `h1 { font-size:50px; font-weight:500; margin-bottom:1em; transition:0.5s color; }`

**Load-bearing structural CSS** (the JS reads offsets off this geometry and the sticky/fixed positioning is the whole trick — keep the pixel values):
- `.wrapper { width:100%; height:100%; background-color:transparent; transition:0.5s background-color; }`
- `nav { position:fixed; width:100%; display:flex; justify-content:space-between; align-items:center; padding:2.5em; z-index:2; }`
- `.gallery { position:relative; width:100%; display:flex; z-index:0; }`
- `.minimap { position:sticky; top:0; width:25%; height:100vh; padding-top:300px; overflow:hidden; background-color:#000; transition:0.5s background-color; }` — **sticky**, so it pins for the full length of the gallery; `overflow:hidden` clips the strip; `padding-top:300px` pushes the strip's static top down to 300px so the first thumbnail starts aligned with the indicator.
- `.preview { position:absolute; left:50%; transform:translateX(-50%); width:100%; height:1254px; display:flex; flex-direction:column; align-items:center; }` — a fixed-height (**1254px**) vertical column of the ten thumbnails (10 × 125px ≈ 1250). **This is the element the JS translates on Y**; its base transform is `translateX(-50%)` and the JS re-appends a `translateY(...)`.
- `.item-preview { position:relative; width:100px; height:125px; padding:10px; overflow:hidden; }` — one thumbnail slot (inner image ≈ 80×105 after padding).
- `.active-img-indicator { position:absolute; top:300px; left:50%; transform:translateX(-50%); width:100px; height:125px; border:1.5px solid #fff; border-radius:4px; mix-blend-mode:difference; z-index:2; }` — a **fixed-in-place** (relative to the sticky minimap) bordered box, exactly one thumbnail-slot in size (100×125), sitting at the 300px offset. It never moves; the strip slides under it. `mix-blend-mode:difference` inverts the white border against whatever thumbnail is behind, so the outline stays visible on both dark and light photos and in both themes.
- `.images { position:relative; top:0; width:75%; }` — the tall gallery column.
- `.item { position:relative; width:500px; height:600px; overflow:hidden; margin:50px auto; }` (at `max-width:900px` → `width:400px; height:500px`).
- `.item-img { width:500px; height:550px; }` (the photo; the remaining ~50px of the item is the `.item-copy` caption row).
- `.item-copy { width:100%; display:flex; justify-content:space-between; padding:5px 0; text-transform:uppercase; }` — filename pinned left, index pinned right.
- `.container { width:100%; height:100%; padding:5em 2.5em; }`, `.hero-img { margin-bottom:2em; }`.

**Theme-invert CSS** (toggled by adding `.dark-theme` to `.wrapper`; note the class name says "dark" but it produces the WHITE/light look):
```css
.wrapper.dark-theme,
.wrapper.wrapper.dark-theme .minimap { background-color:#cfe0f8; }   /* pale sky, not white */
.wrapper.dark-theme a,
.wrapper.dark-theme p,
.wrapper.dark-theme h1 { color:#0d0d0d; }
```
Because `.wrapper`, `.minimap`, `a`, `p`, `h1` all carry `transition:0.5s` on their `background-color`/`color`, adding/removing the class cross-fades the whole page between black-on-white and white-on-black over 0.5s.

## The effect (exhaustive — this IS the component)

All of it runs once inside `document.addEventListener("DOMContentLoaded", …)`.

### 1. Measure the geometry (once, on load)
```js
const imagesContainer = document.querySelector(".images");
const preview = document.querySelector(".preview");
const minimap = document.querySelector(".minimap");

function getElementTop(element) {          // absolute document-top of an element
  let top = 0;
  while (element) { top += element.offsetTop; element = element.offsetParent; }
  return top;
}

const imagesStart   = getElementTop(imagesContainer);       // ≈ 0 (gallery sits at page top under the fixed nav)
const imagesEnd     = imagesStart + imagesContainer.offsetHeight;   // bottom of the tall gallery column
const viewportHeight = window.innerHeight;
const previewHeight  = preview.offsetHeight;                 // = 1254 (fixed in CSS)
const previewMaxTranslate = (minimap.offsetHeight - previewHeight) * 2.84;
```
- `minimap.offsetHeight` is `100vh`. Since the strip (1254px) is taller than the viewport, `minimap.offsetHeight − previewHeight` is **negative**, so `previewMaxTranslate` is a **negative** number (the strip's maximum *upward* travel). The **`2.84`** is an empirical tuning multiplier: at the reference viewport it makes the strip's total travel ≈ one full preview height, so scrolling the gallery from top to bottom walks the strip from thumbnail 1 to thumbnail 10 under the indicator.

### 2. The scroll-linked strip translate (`handleScroll`, bound to `window` `scroll`)
```js
function handleScroll() {
  const scrollPosition = window.scrollY;
  const scrollRange = imagesEnd - imagesStart - viewportHeight;                 // scroll distance the gallery spans
  const previewScrollRange = Math.min(previewMaxTranslate, scrollRange);        // = previewMaxTranslate (negative)

  if (scrollPosition >= imagesStart && scrollPosition <= imagesEnd - viewportHeight) {
    let scrollFraction   = (scrollPosition - imagesStart) / scrollRange;        // 0 → 1 through the gallery
    let previewTranslateY = scrollFraction * previewScrollRange;                // 0 → previewMaxTranslate (0 → negative)
    preview.style.transform = `translateX(-50%) translateY(${previewTranslateY}px)`;
  } else if (scrollPosition < imagesStart) {
    preview.style.transform = "translateX(-50%) translateY(0px)";               // before gallery: strip parked at top
  } else {
    preview.style.transform = `translateX(-50%) translateY(${previewMaxTranslate}px)`;  // after gallery: strip parked at bottom
  }
}
window.addEventListener("scroll", handleScroll);
```
Precise behavior:
- **Mapping:** the page-scroll fraction through the gallery (`0` when the gallery top hits the viewport top, `1` when its bottom is one viewport above) maps **linearly** onto the strip's `translateY`, from `0` down to `previewMaxTranslate` (a negative value → the strip moves **up**). No easing, no lerp — it's a direct 1:1 scroll-scrub, so the strip tracks the scrollbar exactly (as smooth as the browser's own scroll).
- Because `previewMaxTranslate` is negative and `Math.min(previewMaxTranslate, scrollRange)` therefore returns it, `previewScrollRange` is that negative travel; multiplying by the `0→1` fraction slides the strip upward through its ten thumbnails.
- **Clamps:** above the gallery (`scrollPosition < imagesStart`) the strip is pinned at `translateY(0)` (thumbnail 1 framed); below the gallery it's pinned at `translateY(previewMaxTranslate)` (thumbnail 10 framed). No overshoot.
- The base `translateX(-50%)` is **always re-written** together with the Y so the strip stays horizontally centered in the minimap.
- The minimap being `position:sticky` means it stays fixed on screen for the entire gallery, so the moving strip + stationary `.active-img-indicator` read as a little live navigator: whatever thumbnail is inside the 100×125 bordered box corresponds to the large photo currently centered in the viewport.

### 3. The theme inversion (`checkScroll`, a second `window` `scroll` listener)
```js
const togglePoint = window.innerHeight * 4;
const wrapper = document.querySelector(".wrapper");

function checkScroll() {
  if (window.scrollY >= togglePoint) wrapper.classList.add("dark-theme");
  else                               wrapper.classList.remove("dark-theme");
}
window.addEventListener("scroll", checkScroll);
```
- Threshold is **4 × viewport height** of scroll. Cross it going down → add `.dark-theme` → page cross-fades to a **pale sky background (`#cfe0f8`) with ink text and a matching minimap** over 0.5s (via the CSS transitions). Scroll back up above the threshold → class removed → cross-fades back to the saturated sky. It's a hard boolean at `scrollY = 4·innerHeight`, not a gradient.

## Assets / images
**11 photographs**, one cohesive **sky series** running day to night — cloudscapes seen from above, sunrise and sunset skies, ridgelines under the Milky Way. It is the same subject as the page ground (which is a fixed blue gradient), so the plates read as windows onto the same sky rather than as unrelated pictures. All hard-cropped with `object-fit:cover`, so source aspect ratio is forgiving.
- **10 gallery images** (`img_01`…`img_010`): each appears **twice** — once large in a `.item-img` slot (500×550, a nearly-square-to-portrait crop) and once small as an `.item-preview` thumbnail (100×125, portrait) in the minimap strip, **in the same order**. Roughly portrait-to-square source images read best.
- **1 hero image**: a **wide landscape** photo (full-container width) placed between the second and third closing headline paragraphs in the lower `.container` section; the demo uses a photographer at a tripod on a rock ledge at blue hour.

No logos or brand marks. Filenames shown in the captions (`img_01.jpg`, `01` … `img_010.jpg`, `10`) are decorative labels only.

## Behavior notes
- **No autoplay / no loop** — nothing moves until the user scrolls; both listeners are pure scroll-driven. On load the strip is parked at `translateY(0)` (thumbnail 1) and the page is in the black theme.
- **All geometry is measured once on load** (`imagesStart`, `imagesEnd`, `previewMaxTranslate`, `viewportHeight`, `togglePoint`) with no `resize` re-measure — the mapping is correct at the initial viewport size; a mid-session resize would leave the strip travel and 4-viewport threshold slightly off (this matches the original).
- **The `2.84` multiplier is viewport-tuned**, so the exact thumbnail-to-photo registration is calibrated for a typical desktop height; it stays visually coherent across sizes but is precise at the reference height.
- **Responsive:** at `max-width:900px` the gallery items shrink to 400×500; the minimap/strip mechanics are unchanged.
- **Reduced motion:** the only motion is (a) the direct scroll-scrub of the strip, which is as calm as scrolling itself, and (b) the 0.5s theme cross-fade; there's no reduced-motion guard in the original.
- Mobile-safe and lightweight — no canvas, no WebGL, no heavy libraries; just two scroll handlers and CSS transitions.

## Images

This component ships with 11 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/js-image-minimap/hero.jpg
https://motionprompts.dev/c/js-image-minimap/img1.jpg
https://motionprompts.dev/c/js-image-minimap/img10.jpg
https://motionprompts.dev/c/js-image-minimap/img2.jpg
https://motionprompts.dev/c/js-image-minimap/img3.jpg
https://motionprompts.dev/c/js-image-minimap/img4.jpg
… 5 more under https://motionprompts.dev/c/js-image-minimap/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws that guarantee. Under React 19 with StrictMode, the effect that measures the gallery's geometry and wires up the two scroll listeners mounts, unmounts, and mounts again before anything reaches the screen. Because `handleScroll` and `checkScroll` are pure functions of `window.scrollY` — they overwrite `preview.style.transform` and toggle `dark-theme` rather than accumulate state — a leaked pair from the first pass produces no visible glitch, only a silent doubling: every scroll event now runs the geometry math and the two DOM writes twice, on two listeners that agree with each other, for as long as the page stays mounted. Nothing about that is visible in dev tools and it disappears entirely in a production build, since React only double-invokes effects in development. Treat the two `removeEventListener` calls as part of the effect, not as an afterthought.

**(1) The entry point.** This script is `dcl-unguarded`: everything runs inside `document.addEventListener("DOMContentLoaded", …)`. By the time a React component mounts, that event has already fired, so the callback body would simply never execute. Delete the `DOMContentLoaded` wrapper and move its contents — the `getElementTop` measurement, the `imagesStart`/`imagesEnd`/`previewMaxTranslate` computation, both handler definitions, and both `window.addEventListener("scroll", …)` calls — directly into a `useEffect` with an empty dependency array.

**(2) Element lookups.** The four `document.querySelector` calls this component makes — `.images`, `.preview`, `.minimap`, and `.wrapper` (fetched separately, for the theme toggle) — assume it owns the whole document. Because you already need four distinct handles, attach a `ref` to each of the four JSX nodes directly (`imagesRef`, `previewRef`, `minimapRef`, `wrapperRef`) rather than running `querySelector` against a scoped root. This isn't just tidiness here: `getElementTop` walks `offsetParent` upward from whatever node it's handed, so if a stale query ever resolved against the outgoing copy of the tree during the StrictMode remount, `imagesStart` would be computed by walking a subtree that's about to be detached — and there is no `resize` listener anywhere in this component to ever recompute it afterward. A wrong measurement on mount is wrong for the component's whole lifetime.

**(3) Cleanup.** Neither `handleScroll` nor `checkScroll` belongs to an animation library, so there's no context to revert — the cleanup is the two matching `removeEventListener` calls, using the same function references the effect subscribed with:

```jsx
useEffect(() => {
  const imagesContainer = imagesRef.current;
  const preview = previewRef.current;
  const minimap = minimapRef.current;
  const wrapper = wrapperRef.current;

  // ...getElementTop, imagesStart, imagesEnd, previewMaxTranslate,
  // handleScroll and checkScroll declared exactly as above...

  window.addEventListener("scroll", handleScroll);
  window.addEventListener("scroll", checkScroll);
  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("scroll", checkScroll);
  };
}, []);
```

Declare `handleScroll` and `checkScroll` inside the effect body itself, not at module scope and not recreated by a render outside it — the reference `removeEventListener` needs is the exact one `addEventListener` was given. This is also the practical test for "did the cleanup work": since both handlers are stateless, an accumulated duplicate produces no visual symptom, only extra work per scroll frame that never shows up until you actually navigate away from this route and back and check that the listener count hasn't grown.

No other variant applies. The component ships no animation library and defines no `gsap.context` or `Lenis` instance to tear down; both effects are plain `scroll` listeners, not a `requestAnimationFrame` loop, so there's no ticker handle to cancel; nothing here splits text or touches a WebGL/three scene. The template's warning about promises resolving after unmount doesn't apply either: `.item` and `.item-img` carry fixed pixel heights in the CSS, so `imagesContainer.offsetHeight` is correct at mount regardless of whether the ten gallery photographs have finished decoding — there is no `image.decode()` or `fonts.ready` wait to guard against a late resolution firing into an unmounted component.
