# Landing Page Reveal — Grid Shuffle to Hero Zoom Intro

## Goal

Build an autoplay landing-page intro (runs once on page load, no scroll): a full-screen black overlay reveals a gradient-fill logo and staggered project/location lists, then a centered 3×3 image grid clips open and rapidly shuffles through random editorial photos. The outer cells clip shut again, the center "hero" cell scales up 4× into a large framed hero image, two banner images pop in and rotate outward to its sides, the nav drops in from the top, and masked word-by-word text reveals push in the intro copy and title.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `CustomEase`, and `split-type` (npm package, `SplitType` class — NOT GSAP's SplitText). No smooth-scroll library needed (the page never scrolls).

## Layout / HTML

Single page, `<body>` containing in this order:

1. `div.overlay` — full-screen fixed black overlay with three flex columns:
   - `div.projects` containing `div.projects-header` with two `<p>`: `Project` and `Director`. (Rows are appended by JS.)
   - `div.loader` containing `h1.logo-line-1` with text `Nova` and `h1.logo-line-2` with text `Vice` (stacked two-line logo).
   - `div.locations` containing `div.locations-header` with one `<p>`: `Location`. (Rows appended by JS.)
2. `div.image-grid` — three `div.grid-row`, each with three `div.img` wrappers, each wrapping an `<img>`. The middle cell of the middle row additionally has class `hero-img` (i.e. `div.img.hero-img`). Fill the 9 `<img>` `src`s with the first 9 images of the pool (image 5 in the hero cell).
3. `nav` — three flex sections: `div.links` with two anchors `Index`, `Work`; `div.nav-logo` with one anchor containing `Nova<br />Vice`; another `div.links` with anchors `About`, `Contact`.
4. `div.banner-img.banner-img-1` and `div.banner-img.banner-img-2`, each wrapping an `<img>` (use image 7 and image 16 of the pool).
5. `div.intro-copy` with two `<h3>`: `Creative Solutions` and `Impactful Results`.
6. `div.title` with one `<h1>`: `Crafting bold experiences`.

Also create a small data module `projects.js` exporting `projectsData`: an array of ~16 objects `{ name, director, location }` with fictional film-production entries (e.g. `{ name: "Lunar Eclipse", director: "Amelia Crawford", location: "Toronto, ON" }`; some directors styled like `"Sophia // Chen"`, some locations like `"Elevation Studios - Denver"`).

On DOMContentLoaded, JS appends to `.projects` one `div.project-item` per entry (two `<p>`: name, director) and to `.locations` one `div.location-item` per entry (one `<p>`: location).

## Styling

- Reset `* { margin:0; padding:0; box-sizing:border-box }`. Body background `#e3e3db`, body font a neue-grotesque sans (`"PP Neue Montreal", sans-serif`).
- All `<p>` and `<a>`: uppercase, monospace (`"Akkurat Mono", monospace`), `font-size: 0.7rem`; anchors `color: #000`, no underline.
- Display type (`.loader h1`, `.nav-logo a`, `.intro-copy h3`, `.title h1`): condensed poster font (`"Druk", sans-serif`), italic, uppercase, `line-height: 0.9`.
- `.overlay`: `position: fixed; inset from top-left; width 100vw; height 100svh; padding 2em; background #000; color #fff; display flex; gap 2em; overflow hidden`. Its three children (`.projects`, `.loader`, `.locations`) each `flex: 1; display flex; flex-direction column; justify-content center; gap 1em`. `.loader` centers items with `gap: 0`. `.locations` centers items; `.locations-header` and `.location-item` are `width: 50%`.
- `.loader h1`: `font-size 2.5rem; text-align center`, and the gradient-fill trick that lets GSAP "fill up" the text by animating `background-position`:
  ```
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-image: linear-gradient(0deg, #3a3a3a, #3a3a3a 50%, #fff 0);
  background-size: 100% 200%;
  background-position: 0% 100%;
  color: #3a3a3a;
  ```
- `.projects-header`, `.project-item`, `.locations-header`, `.location-item`: `display flex; gap 2em; opacity 0` (hidden until animated). Children of the projects rows get `flex: 1` (two equal columns). `.project-item` and `.location-item` start `color: #4f4f4f` (dim gray, later flashed to white).
- `.image-grid`: `position fixed; top 50%; left 50%; transform translate(-50%, -50%); width 30%; aspect-ratio 1; display flex; flex-direction column; gap 1em; z-index 2`. Each `.grid-row`: `width 100%; display flex; gap 1em`. Each `.img`: `position relative; flex 1; aspect-ratio 1;` and the crucial initial clip: `clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)` (collapsed to the top edge — invisible). Global `img { width 100%; height 100%; object-fit: cover }`.
- `nav`: `position fixed; width 100vw; padding 1em; display flex; gap 2em`, its three children `flex: 1`; `.links` spreads anchors with `justify-content: space-around`; `.nav-logo` centered, its anchor `font-size 1.75rem; font-weight bolder`.
- `.banner-img`: `position absolute; top 45%; left 50%; transform translate(-50%, -50%) scale(0); width 20%; aspect-ratio 4/5` (hidden at scale 0, both stacked at center; GSAP later animates `left` and `rotate`).
- `.intro-copy`: `position absolute; top 45%; transform translateY(-50%); width 100%; padding 0 8em; display flex; justify-content space-between; align-items center`. `h3` at `font-size 1.5rem`.
- `.title`: `position absolute; bottom 10%; left 50%; transform translateX(-50%)`. `h1` at `font-size 3.5rem`.
- `.intro-copy h3` and `.title h1`: `font-weight 500; color #000; position relative;` and `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%)` so the split words can slide up from below the mask. Their `.word` spans (created by SplitType): `display inline-block; position relative; will-change transform; margin-right 0.1rem`.
- Media query `max-width: 900px`: hide `.projects`, `.locations`, `.intro-copy`, `.banner-img`; absolutely center `.loader`; `.title` becomes full-width, centered, `bottom 20%`, `h1` 2.5rem; `.image-grid` grows to `width 75%` with `0.5em` gaps (rows `width 95%; justify-content space-around`).

## GSAP effect (exhaustive)

Everything runs on `DOMContentLoaded`. Register `CustomEase` and create the signature ease used almost everywhere:

```js
CustomEase.create("hop", "0.9, 0, 0.1, 1");
```

Split text with SplitType (words only): `new SplitType(".intro-copy h3", { types: "words", absolute: false })` and the same for `".title h1"`. Keep references — you animate `splitInstance.words`.

Element sets: `gridImages` = all `.img` (9); `heroImage` = `.img.hero-img`; `images` = the 8 grid cells excluding the hero.

Image pool: an array of 35 image URLs (`img1 … img35`). Helper `getRandomImageSet()` shuffles a copy of the pool (`sort(() => 0.5 - Math.random())`) and returns the first 9.

**Initial states** (`gsap.set`): `nav` → `y: "-125%"`; all intro-copy words and all title words → `y: "110%"` (below their clip masks).

**Three timelines, all created at once so they run in parallel from t=0:**

### 1) overlayTimeline (the black loader screen)

1. `.logo-line-1` → `{ backgroundPosition: "0% 0%", color: "#fff", duration: 1, ease: "none", delay: 0.5 }` — the gradient fill wipes the first logo line from dark gray to white, bottom to top. Its `onComplete` fires an independent `gsap.to(".logo-line-2", { backgroundPosition: "0% 0%", color: "#fff", duration: 1, ease: "none" })` so line 2 fills right after line 1.
2. `[".projects-header", ".project-item"]` → `{ opacity: 1, duration: 0.15, stagger: 0.075, delay: 1 }` — the project list types in row by row.
3. At the same position (`"<"`): `[".locations-header", ".location-item"]` → same `{ opacity: 1, duration: 0.15, stagger: 0.075 }`.
4. `.project-item` → `{ color: "#fff", duration: 0.15, stagger: 0.075 }` — rows flash from gray to white in sequence; at `"<"` the same for `.location-item`.
5. `[".projects-header", ".project-item"]` → `{ opacity: 0, duration: 0.15, stagger: 0.075 }` — lists stagger back out; at `"<"` the same for the locations.
6. `.overlay` → `{ opacity: 0, duration: 0.5, delay: 1.5 }` — the whole black overlay fades away (the loader logo stays visible longer because the overlay fade is delayed; the logo itself is faded separately below).

### 2) imagesTimeline (grid reveal → shuffle → hero zoom)

1. All `.img` → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1, delay: 2.5, stagger: 0.05, ease: "hop" }` — each cell wipes open top-to-bottom. Its `onStart` schedules, via `setTimeout(..., 1000)`:
   - `startImageRotation()` (see below), and
   - `gsap.to(".loader", { opacity: 0, duration: 0.3 })` (the logo fades out as the shuffle begins).
2. `images` (the 8 non-hero cells) → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", duration: 1, delay: 2.5, stagger: 0.05, ease: "hop" }` — outer cells wipe shut again (collapse back to the top edge), leaving only the hero cell visible.
3. `.hero-img` → `{ y: -50, duration: 1, ease: "hop" }` — the hero cell nudges up 50px.
4. `.hero-img` → `{ scale: 4, clipPath: "polygon(20% 10%, 80% 10%, 80% 90%, 20% 90%)", duration: 1.5, ease: "hop" }` — the center cell blows up 4× while its clip contracts to an inset frame (20%/10% margins), producing the "zoom into hero" feel. Its `onStart` fires three parallel tweens:
   - `.hero-img img` → `{ scale: 1, duration: 1.5, ease: "hop" }` (the inner image was pre-scaled to 2 during the last shuffle cycle, so it settles down as the wrapper scales up — a counter-zoom).
   - `.banner-img` → `{ scale: 1, delay: 0.5, duration: 0.5 }` (both banners pop in from scale 0 at screen center).
   - `nav` → `{ y: "0%", duration: 1, ease: "hop", delay: 0.25 }` (nav drops in).
5. At `"<"`: `.banner-img-1` → `{ left: "40%", rotate: -20, duration: 1.5, delay: 0.5, ease: "hop" }` and `.banner-img-2` → `{ left: "60%", rotate: 20, duration: 1.5, ease: "hop" }` — the two banner cards slide out from behind the hero and tilt outward like fanned polaroids.

**startImageRotation()** — the rapid shuffle: loop `cycle` from 0 to 19 (20 cycles). For each cycle schedule a zero-duration tween (`gsap.to({}, { duration: 0, delay: cycle * 0.15, onComplete })`) whose callback assigns a fresh `getRandomImageSet()` to the 9 grid `<img>` elements — so all 9 cells swap images every 150ms for 3 seconds. On the LAST cycle only, the hero cell instead gets its final fixed hero image (image 5 of the pool) and `gsap.set(".hero-img img", { scale: 2 })` pre-zooms the inner image so step 4 above can counter-animate it back to 1.

### 3) textTimeline (masked word reveals)

1. Title words (`titleHeading.words`) → `{ y: "0%", duration: 1, stagger: 0.1, delay: 9.5, ease: "power3.out" }` — words slide up from `110%` into view behind the h1's clip mask, one every 0.1s. The 9.5s delay lands this right after the hero zoom finishes.
2. At `"<"`: intro-copy words (`introCopy.words`) → `{ y: "0%", duration: 1, stagger: 0.1, delay: 0.25, ease: "power3.out" }` — the two side headings follow 0.25s later.

Total choreography lasts ~11s from load.

## Assets / images

A pool of **35 editorial fashion portraits** (moody studio photography: dramatic close-up faces, silhouettes on saturated backgrounds, avant-garde styling). All are used as square crops via `object-fit: cover`, so any aspect works, but roughly square-to-portrait sources look best:

- Images 1–9: initial grid cells (image 5 sits in the center hero cell).
- Image 5: also the final hero image the zoom locks onto.
- Images 7 and 16: also the two banner images (displayed at 4:5).
- The whole pool of 35 feeds the random shuffle.

Reference them in an array like `` Array.from({ length: 35 }, (_, i) => `./images/img${i + 1}.jpeg`) `` (adjust the path to wherever the images live).

## Behavior notes

- Pure intro animation: no ScrollTrigger, no user input; everything autoplays once per load.
- Under 900px wide, the side lists, intro copy and banners are hidden; only the logo fill, grid reveal/shuffle, hero zoom, nav and title reveal run.
- The overlay stays in the DOM after fading (opacity 0); that's fine for a demo.
- Brand text is the fictional "Nova / Vice"; keep all names/locations fictional.

## Images

This component ships with 35 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/nite-riot-landing-page-reveal-javascript/img1.jpeg
https://motionprompts.dev/c/nite-riot-landing-page-reveal-javascript/img10.jpeg
https://motionprompts.dev/c/nite-riot-landing-page-reveal-javascript/img11.jpeg
https://motionprompts.dev/c/nite-riot-landing-page-reveal-javascript/img12.jpeg
https://motionprompts.dev/c/nite-riot-landing-page-reveal-javascript/img13.jpeg
https://motionprompts.dev/c/nite-riot-landing-page-reveal-javascript/img14.jpeg
… 29 more under https://motionprompts.dev/c/nite-riot-landing-page-reveal-javascript/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--ink-soft`, `--overlay`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Here that leaves you two of nearly everything `mount()` builds: a second `project-item`/`location-item` row appended underneath every row the first call already created, because `initializeDynamicContent` only ever appends to `.projects`/`.locations` and never clears them first; two `SplitType` passes over `.intro-copy h3` and `.title h1`, each one nesting its own fresh `.word` spans one layer inside the leftover spans of the last; and two independent `overlayTimeline` / `imagesTimeline` / `textTimeline` trios both clipping the same nine `.img` cells and both writing random `src`s onto the same nine `<img>` elements every hundred-fifty milliseconds, so the shuffle flickers between two competing rotations and the hero cell never settles on the one final portrait it's supposed to lock onto. The visible symptom is a doubled project/location list sitting under a grid that shuffles forever instead of resolving, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only falls back to that guard when it isn't running inside this catalogue's own tuning harness — the `window.MP && window.MP.register` branch that lets the live editor call `mount(config)` directly and re-mount it later with different `totalCycles` / `listStagger` / `gridStagger` / `heroZoom` / `heroScale` knobs. Neither survives the move to React: the harness branch has no equivalent in a shipped component, and the readiness guard is dead weight once `useEffect` guarantees the DOM is already committed. Drop the harness branch, the guard and the `boot` wrapper, and call `mount(Object.assign({}, DEFAULTS))` — or a `config` prop, if you want those five knobs to stay tunable — directly inside a `useEffect` with an empty dependency array. The function `mount()` already returns is not incidental: it's the same `destroy()` the live editor calls before re-mounting with a new config, and its shape — stop the timelines and the shuffle tweens, remove the rows it created, revert the two splits, restore the original `src` attributes, clear the inline styles it touched — is close to a correct React cleanup already. What follows closes the two gaps it still leaves.

*(2) Element lookups* — `mount()` opens with a flat run of global lookups: `.projects`, `.locations`, `.img` (via `gsap.utils.toArray`), `.img.hero-img`, `nav`, `.overlay`, `.loader`, `.logo-line-1`, `.logo-line-2`, `.projects-header`, `.locations-header`, `.banner-img` (again via `toArray`), `.banner-img-1`, `.banner-img-2`, plus the combined `.intro-copy h3, .title h1` set — fourteen separate trips to `document`, each trusting this markup is the only copy on the page. Put a ref on the element this component renders as its root and resolve every one of them from it instead. Keep the existing early-return guard (`if (!projectsContainer || !locationsContainer || !gridImages.length || !heroImage) return () => {}`), just pointed at the ref-scoped lookups — a StrictMode instant where two copies of the subtree exist is exactly when an unscoped selector would grab the outgoing copy, and this guard already knows how to bail out cleanly with a no-op cleanup instead of animating half a grid.

*(3) Cleanup* — Wrap the two `SplitType` calls and the construction of `overlayTimeline`, `imagesTimeline` and `textTimeline` in one `gsap.context` scoped to the root ref. That covers everything created synchronously: the three timelines and the initial `gsap.set` calls on `nav` and on the two sets of split words. It does **not** cover the second wave of animations this component fires from *inside* those timelines' own `onStart`/`onComplete` callbacks, well after `mount()` has returned — the `logo-line-2` fill fired from `logo-line-1`'s `onComplete`; the twenty shuffle tweens `startImageRotation()` schedules from inside the grid-open tween's `onStart`, by way of the `setTimeout` that also fades `.loader`; and the hero-inner counter-scale, the two banner pop-ins and the nav drop-in, all three fired from the hero-zoom tween's `onStart`. `gsap.context` only auto-tracks animations created during the synchronous execution of its factory function, and by the time any of those callbacks actually runs — one to three-and-a-half seconds into the choreography — that window has long closed, so none of them register with the context. Killing the three timelines through `ctx.revert()` stops a callback that hasn't fired yet from ever firing, but it does nothing for one that already has. This is exactly the gap the current `destroy()` was written by hand to close, and the fix carries over unchanged rather than getting reinvented: keep pushing the shuffle tweens into their own array and `.kill()` every entry, and keep the flat list of every element a still-pending callback could be mid-tween on — `loader`, `logoLine2`, `heroInner`, the two banner images, `navEl` — so a trailing `gsap.killTweensOf(...)` sweep catches whichever of those callbacks already fired before unmount. Sequence still matters, and the current comment already states the right order: stop everything animating or ticking first (the three timelines, the shuffle tweens, and the pending `setTimeout` behind `revealTimer`), then put the DOM back (drop the rows `initializeDynamicContent` created, revert the two splits after killing any tween still targeting their words, restore the saved `src` attributes on the grid photos), and only then clear inline styles with `clearProps` — reverse that last step and `clearProps` runs against nodes already detached or already back to plain text, and the shuffle's last `opacity`/`scale` write is left stuck on whatever it last touched.

```jsx
useEffect(() => {
  const shuffleTweens = [];
  let revealTimer = null;
  let destroyed = false;

  const ctx = gsap.context(() => {
    // gridImages / heroImage / images / introCopy / titleHeading / createdItems,
    // all looked up from rootRef.current; startImageRotation still pushes each
    // cycle's tween into shuffleTweens and still checks `destroyed` in its
    // onComplete before writing an img.src, exactly as constructed above
  }, rootRef);

  return () => {
    destroyed = true;
    if (revealTimer) clearTimeout(revealTimer);
    shuffleTweens.forEach((tween) => tween.kill());
    // remove the created project/location rows, revert the two SplitType
    // instances, restore the grid photos' original src — exactly as above
    const styledElements = [/* loader, logoLine2, heroInner, banner images, navEl, … */];
    gsap.killTweensOf(styledElements);
    gsap.set(styledElements, { clearProps: "all" });
    ctx.revert();
  };
}, []);
```

One split-specific note: both `SplitType` calls here use a words-only split, not a line split, so unlike a component whose masks depend on real line-break geometry, this one has no reason to gate the split behind `document.fonts.ready` — tokenizing on whitespace doesn't require measuring wrapped line boxes, so a fallback face swapping in mid-choreography can't move where the splits land. It still has to be reverted before the next mount, in the order the current code already uses: kill any tween still targeting `introCopy.words` / `titleHeading.words` first, then call `.revert()` on both `SplitType` instances — reverse that and the next mount's split runs against the previous mount's leftover `.word` spans instead of the original text, nesting one level deeper each time.
