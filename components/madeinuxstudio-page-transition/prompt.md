# Silhouette Page Transition — Block Wipe + SVG Logo Draw

## Goal
Build a minimal editorial multi-page demo ("Silhouette") with a cinematic **full-page route transition**: clicking a nav link makes 20 vertical dark blocks wipe across the screen left→right (staggered `scaleX`), then a full-screen dark overlay appears where a line-art logo **draws itself** via `strokeDashoffset` and fills in; the overlay fades, the new page is swapped in underneath, and the blocks wipe away right→left to reveal it. Page headings animate in with a **SplitText masked character reveal**, and the archive route scrolls with **Lenis** smooth scroll. There is no real navigation — a tiny fake client-side router swaps innerHTML.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`SplitText`** and **`ScrollTrigger`**, and **`lenis`** (npm) for smooth scroll on one route. Register with `gsap.registerPlugin(SplitText, ScrollTrigger)`. Initialize on `DOMContentLoaded` (or immediately if the document is already ready).

## Layout / HTML
Class names and ids are load-bearing — the JS/CSS query them:

```
<nav>
  <div class="nav-logo"><a href="/">Silhouette</a></div>
  <div class="nav-links">
    <a href="/">Index</a>
    <a href="/archive">Archive</a>
    <a href="/contact">Contact</a>
  </div>
</nav>

<div class="transition-overlay" id="transition-overlay"></div>   <!-- empty; 20 .block divs injected by JS -->

<div class="logo-overlay" id="logo-overlay">
  <div class="logo-container">
    <svg id="logo" width="160" height="160" viewBox="-4 -4 133 136" fill="none">
      <path d="M82.6306 0C79.8604 5.32092 74.9984 15.6531 72.43 24.0313C80.497 18.2644 89.0129 13.5149 97.6896 10.449C93.9825 17.5694 87.0092 32.5146 84.7598 42.5941C93.0521 37.1488 101.702 32.6834 110.474 29.7215C105.427 39.0923 95.1513 60.5111 94.4257 71.2193C83.5883 74.5743 52.906 88.8011 18.5906 118.443C25.5824 101.301 45.556 73.6638 70.6591 53.0204C57.6282 59.6057 38.4488 71.4317 17.8355 89.7486C22.896 76.8262 36.1412 57.0952 53.4438 40.1036C42.5167 46.1741 28.2058 55.6353 13 69.1471C20.7367 49.3908 50.4126 11.3841 82.6306 0Z"
        fill="none" stroke="#e3e4d8" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>
</div>

<div id="page-content"></div>   <!-- fake router injects the current route's markup here -->
```

The logo is a **single continuous `<path>`** — an abstract flame/leaf-like silhouette of swooping strokes (use the exact path data above so the stroke-draw reads the same; if you must substitute, it MUST remain one single `<path>` because the draw effect relies on `path.getTotalLength()`).

### Routes (JS object, keyed by pathname)
```
"/"         → <div class="container"><div class="page-header"><h1>Timeless Form</h1></div></div>
"/archive"  → <div class="container"><div class="archive">
                 <img src="..."/><img src="..."/><img src="..."/><img src="..."/>
               </div></div>
"/contact"  → <div class="container"><div class="page-header"><h1>Get in touch</h1></div></div>
```

## Styling
Fonts (Google Fonts): **Barlow Condensed** (body + headings, load weights up to 800) and **DM Mono** (links).

Palette: page background **`#e3e4d8`** (pale sage/bone), text **`#141414`**, blocks + logo overlay **`#222`**, logo stroke/fill **`#e3e4d8`**.

- `* { margin:0; padding:0; box-sizing:border-box }`; `body { font-family:"Barlow Condensed", sans-serif }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `h1`: `text-transform:uppercase; color:#141414; font-size:12rem; font-weight:800; line-height:1`. At `max-width:900px` → `font-size:2rem`.
- `a`: `text-decoration:none; text-transform:uppercase; color:#141414; font-family:"DM Mono"; font-size:0.9rem; font-weight:500`.
- `nav`: `position:fixed; width:100vw; padding:2rem; display:flex; justify-content:space-between; align-items:center; z-index:1`. `.nav-logo a`: Barlow Condensed, `1.25rem`, weight 700. `.nav-links`: `display:flex; gap:2rem`.
- `.container`: `position:relative; width:100%; height:100%; min-height:100svh; background-color:#e3e4d8`.
- `.page-header`: `width:100vw; height:100svh; display:flex; justify-content:center; align-items:center; padding:2rem` (heading dead-center).
- `.archive`: `width:30%; margin:0 auto; padding:15rem 2rem; display:flex; flex-direction:column; gap:2rem`. `.archive img { aspect-ratio:5/7 }` — a narrow centered column of portrait photos.
- `.transition-overlay`: `position:fixed; top:0; left:0; width:100vw; height:100svh; display:flex; pointer-events:none; z-index:2`.
- `.block` (created in JS): `flex:1; height:100%; background:#222; transform:scaleX(0); transform-origin:left` — 20 of them side by side fill the row, each a thin vertical column.
- `.logo-overlay`: `position:fixed; top:0; left:0; width:100vw; height:100svh; z-index:10000; display:flex; justify-content:center; align-items:center; background:#222; pointer-events:none; opacity:0`.
- `.logo-container`: `width:200px; height:200px; display:flex; justify-content:center; align-items:center; padding:20px`.
- `.char` (SplitText char wrappers): `position:relative; display:inline-block; will-change:transform`.

Z stack: nav `1` < transition blocks `2` < logo overlay `10000`.

## GSAP effect (be exact)

### State
`let blocks = [], isTransitioning = false, pathLength = 0, currentPath = "/", currentSplit = null, revealTimeout = null;`

### Init (once)
1. **Create blocks:** clear `#transition-overlay`, append **20** `div.block`, keep them in the `blocks` array.
2. `gsap.set(blocks, { scaleX: 0, transformOrigin: "left" })`.
3. **Prime the logo path:** `pathLength = path.getTotalLength()`; `gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength, fill: "transparent" })` — the path starts fully undrawn and unfilled.
4. `renderPage("/")` then `revealPage()` (so the initial load also plays the outgoing block wipe over the home heading reveal).
5. Attach a click handler to **every** `a[href^="/"]` (nav links).

### Click handler → `handleRouteChange`
- While `isTransitioning`, `preventDefault()` and bail.
- Let modified clicks pass through untouched (`metaKey || ctrlKey || shiftKey || altKey || button !== 0 || target === "_blank"`).
- Otherwise `preventDefault()`, resolve `new URL(href).pathname`; if it differs from `currentPath`, set `isTransitioning = true` and run `coverPage(url)`.

### `coverPage(url)` — the cover timeline (the star)
Set `pointer-events:auto` on both overlays, then build one `gsap.timeline({ onComplete: () => navigateTo(url) })`:

1. **Block wipe in:** `tl.to(blocks, { scaleX: 1, duration: 0.4, stagger: 0.02, ease: "power2.out", transformOrigin: "left" })` — each column grows from its **left** edge, staggering left→right across the screen (total ≈ 0.4 + 19×0.02 ≈ 0.78s) until the page is fully covered by the `#222` wall.
2. **Logo overlay pops on:** `.set(logoOverlay, { opacity: 1 }, "-=0.2")` — an instant set 0.2s before the wipe finishes (no fade in).
3. **Reset the draw:** `.set(path, { strokeDashoffset: pathLength, fill: "transparent" }, "-=0.25")` — re-primed every transition so it redraws each time.
4. **Stroke draw:** `.to(path, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut" }, "-=0.5")` — the silhouette draws itself over 2s, slow-fast-slow.
5. **Fill fade:** `.to(path, { fill: "#e3e4d8", duration: 1, ease: "power2.out" }, "-=0.5")` — starts 0.5s before the draw ends; the outline floods with the pale fill.
6. **Logo overlay fades off:** `.to(logoOverlay, { opacity: 0, duration: 0.25, ease: "power2.out" })` — revealing the solid block wall still standing beneath it.

`onComplete` → `navigateTo(url)`.

### `navigateTo(url)`
`currentPath = url` → `renderPage(url)` → `window.scrollTo(0, 0)` → `revealPage()`.

### `revealPage()` — the outgoing wipe
- `gsap.set(blocks, { scaleX: 1, transformOrigin: "right" })` (flip the origin).
- `gsap.to(blocks, { scaleX: 0, duration: 0.4, stagger: 0.02, ease: "power2.out", transformOrigin: "right" })` — each column collapses toward its **right** edge, staggering across and uncovering the new page. `onComplete`: `isTransitioning = false` and `pointer-events:none` on both overlays.
- **Safety net:** clear any previous timeout, then `setTimeout(…, 1000)`: if the first block still has `gsap.getProperty(block, "scaleX") > 0`, force all blocks to `scaleX: 0` (`duration: 0.2, ease: "power2.out", transformOrigin: "right"`) with the same onComplete cleanup.

### `renderPage(path)` — fake router
1. If a previous SplitText exists → `split.revert()`; kill **all** ScrollTriggers (`ScrollTrigger.getAll().forEach(st => st.kill())`); destroy Lenis + cancel its rAF if running.
2. `content.innerHTML = routes[path] || routes["/"]`.
3. If `path === "/archive"` → start Lenis: `lenis = new Lenis()` plus a `requestAnimationFrame` loop calling `lenis.raf(time)`.
4. Otherwise → apply the **Copy reveal** to the page's `h1` with `delay: 0.3`.

### Copy reveal (SplitText heading animation)
```
const split = SplitText.create(element, { type: "chars", mask: "chars", charsClass: "char++" });
gsap.set(split.chars, { y: "100%" });
gsap.to(split.chars, {
  y: "0%", duration: 1, stagger: 0.03, ease: "power4.out", delay,   // delay = 0.3
  scrollTrigger: { trigger: element, start: "top 75%", once: true },
});
```
Each character starts translated 100% below its own overflow-hidden mask line and slides up into place with a fast-deceleration ease, 0.03s apart left→right. The ScrollTrigger (`once: true`) fires immediately for the centered headings (they're already in view), so it reads as a load-in reveal happening behind/under the block wipe-out. Keep the returned split instance so it can be `revert()`-ed on the next route change.

## Assets / images
**4 editorial portrait photographs**, displayed at **aspect-ratio 5:7** (portrait) with `object-fit: cover`, stacked vertically in the narrow centered archive column. Warm, intimate fashion/beauty photography works best — e.g. an extreme close-up of a freckled face half-covered by a striped towel; a sunlit swimsuit portrait against sky and sea; a wet-hair beauty close-up; a low-angle portrait in a sheer red top on a cream backdrop. No brands or text in the images.

## Behavior notes
- **Triggers:** the transition runs on nav-link **click** only; the heading reveal runs per route render (immediately-firing ScrollTrigger); the initial page load plays `revealPage()` once (quick right-origin wipe-out) over the home heading reveal.
- **Re-entrancy:** `isTransitioning` blocks double-clicks mid-transition; overlays toggle `pointer-events` so the page is inert while covered.
- **Total transition time** ≈ 3s cover (wipe + draw + fill + fade) then ≈ 0.8s reveal.
- **Lenis only on `/archive`** (the only scrollable route) and is destroyed on every route change; other routes use native (non-)scroll. `window.scrollTo(0,0)` after each swap.
- Blocks are created once at init and reused for every transition (origins flipped via `transformOrigin` in the tweens).
- **Responsive:** only the `h1` shrinks (`12rem` → `2rem` at ≤900px); the archive column stays 30% width. Uses `100svh` throughout so mobile browser chrome doesn't clip full-screen layers. No reduced-motion guard in the original.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/madeinuxstudio-page-transition/img_01.jpg
https://motionprompts.dev/c/madeinuxstudio-page-transition/img_02.jpg
https://motionprompts.dev/c/madeinuxstudio-page-transition/img_03.jpg
https://motionprompts.dev/c/madeinuxstudio-page-transition/img_04.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bone`, `--ink`, `--graphite`, `--mute`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document, and this one leans on that harder than most: it is not just an animated widget dropped onto a page, it **is** the page — its own fake router (`routes`, `currentPath`, `renderPage`), the nav bar whose links it intercepts, and the two overlays that cover the swap. React withdraws the guarantees a standalone script relies on (one run, `document.querySelector` reaching anywhere, no teardown) at once and quietly: the component renders, the first block wipe looks right, and it misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that means `createBlocks()` runs twice against the same `#transition-overlay`, and since it does not check for existing children before appending, the second pass wipes the node's `innerHTML` and rebuilds fresh — the leak is not doubled blocks, it's that the first `blocks` array now points at 20 detached nodes while a second `revealPage()` starts a wipe-out against them at the same time a second one starts against the live set. Worse, `document.querySelectorAll('a[href^="/"]').forEach(link => link.addEventListener(...))` runs twice with no matching removal, so every nav `<a>` ends up with two `click` listeners: one click fires `handleRouteChange` twice, and the second call reads `isTransitioning` before the first call's `coverPage()` has had a chance to set it, so both build a `gsap.timeline()` against the same 20 blocks and race to call `navigateTo()`. None of this reproduces in a production build — only in development, only during the double-mount — which is exactly why it has to be designed out rather than tested away. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only once the document is ready does it call `init()` — the function that creates the 20 blocks, primes the logo path's `strokeDasharray`, renders the initial route, plays the opening `revealPage()` wipe-out, and wires the nav clicks. That guard exists to survive being loaded late in a plain document; `useEffect` already runs after the DOM is committed, so the guard and the `DOMContentLoaded` listener are both dead weight. Move the body of `init()` as-is into a `useEffect` with an empty dependency array — including the initial `renderPage(currentPath)` / `revealPage()` pair, which is part of mount, not part of navigation.

*(2) Element lookups* — `getElementById("page-content")`, `getElementById("transition-overlay")`, `getElementById("logo-overlay")`, `getElementById("logo")`, and the nav's `querySelectorAll('a[href^="/"]')` all assume this component owns the document. Give the root element — the one wrapping the `<nav>`, both overlays, and `#page-content` together, since the click interceptor has to reach the nav that sits beside the routed content, not just the content itself — a `ref`, and resolve every one of those lookups off it. If you split this apart later (nav living in a persistent app shell, `#page-content` in a routed subtree underneath), the click interception has to move up to wherever the nav actually renders; scoping it to the routed subtree alone would leave the nav's clicks unintercepted. During the StrictMode remount two copies of this subtree exist for an instant, and an unscoped `document.getElementById` will happily bind `overlay`/`logoOverlay` to the copy on its way out.

*(3) Cleanup* — Two things create GSAP objects here on different schedules, and only one of them is inside the synchronous window `gsap.context` can see. The block-priming (`gsap.set` on the 20 blocks) and the path's dash setup run once, synchronously, during mount — a plain `gsap.context` factory catches those. `coverPage()` and `revealPage()` do not: they build a fresh `gsap.timeline()` / `gsap.to()` from a nav click or from a timeline's own `onComplete`, both long after the factory has returned, so a context that only wraps the mount body never sees them and `ctx.revert()` leaves whatever wipe is in flight running. Register both as named methods with the context argument instead of calling them directly, and call them through the context from then on:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    createBlocks();
    gsap.set(blocks, { scaleX: 0, transformOrigin: "left" });
    primeLogoPath();
    self.add("coverPage", coverPage);
    self.add("revealPage", revealPage);
    renderPage(currentPathRef.current);
    self.revealPage();
  }, rootRef);
  document.querySelectorAll('a[href^="/"]').forEach((link) =>
    link.addEventListener("click", onAnchorClick)
  );
  return () => ctx.revert();
}, []);
```

and inside `coverPage`'s `onComplete`, call `ctx.revealPage()` rather than the bare `revealPage()` reference — the reveal it triggers on navigation needs the same tracking the initial one gets. `isTransitioning`, `currentPath`, `pathLength` and the `revealTimeout` handle belong in refs, not state: nothing here reads them to decide what to render, and a StrictMode remount that resets a plain module variable is exactly how the double-click race above happens — a ref survives the remount because it lives on the fiber, not in the closure `init()` recreates.

The remaining three pieces sit outside anything `gsap.context` tracks. `ScrollTrigger.getAll().forEach(st => st.kill())`, called at the top of every `renderPage()` to clear the previous route's heading reveal, kills every `ScrollTrigger` on the page, not just this component's — harmless in the standalone demo where it's the only trigger-owning script running, but a real hazard next to any other `ScrollTrigger`-driven component. Keep the tween `applyCopy` returns instead and kill `tween.scrollTrigger` specifically. The `revealTimeout` safety net (the one-second fallback that force-finishes a stuck wipe) has to be cleared in the same effect cleanup — an unmount mid-transition otherwise leaves it armed to call `gsap.to` on blocks React has already unmounted. And Lenis: `destroyLenis()` today only runs from inside the next `renderPage()` call, which means unmounting while `/archive` is showing leaves `lenis` and its `requestAnimationFrame` loop (`lenisRaf`) running forever, since no further navigation ever arrives to trigger the teardown. Call `destroyLenis()` unconditionally in the effect's cleanup, in addition to the per-navigation call — it's a no-op when Lenis isn't active. Note this component never needs the usual `lenis.on("scroll", ScrollTrigger.update)` relay: Lenis only ever runs on `/archive`, which has no `ScrollTrigger`, and the char-reveal `ScrollTrigger` only ever runs on the routes where Lenis is torn down — the two are never live at once, so wiring them together would be dead code, not a fix.

SplitText follows the same reasoning as the block timelines: `applyCopy` runs from inside `renderPage`, itself invoked from a click handler or from `coverPage`'s `onComplete`, never from the mount factory. Register `renderPage` with `self.add` alongside `coverPage`/`revealPage` so the split's masked-character tween and its `once: true` ScrollTrigger get grouped into the same context, and keep the existing `currentSplit.revert()` at the top of `renderPage` — that guards against splitting already-split output across route changes, which `ctx.revert()` at unmount does not address, since it only fires once, at the end.
