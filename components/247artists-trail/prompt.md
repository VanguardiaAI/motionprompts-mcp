# Cursor Image Trail with Striped Clip-Path Reveal (dark editorial hero)

## Goal
Build a full-viewport dark hero where **moving the mouse leaves a trail of 175×175px editorial portrait images: each time the cursor travels past a distance threshold, a new image spawns at a smoothed (lerped) trailing position and slides toward the live cursor position while it is revealed through 10 horizontal strip masks that expand from a center line outward with a middle-first stagger; ~1 second later the strips collapse back to the center (edges first) while the image dims, and the element is removed**. The star effect is the striped clip-path in/out reveal combined with the lerp-lagged spawn-and-slide motion.

## Tech
Vanilla HTML/CSS/JS with an ES module script (`<script type="module" src="./script.js">`). **No GSAP, no plugins, no Lenis, no libraries at all** — the whole effect is native CSS `transition`s (on `clip-path`, `left`, `top`, `opacity`) driven by a `requestAnimationFrame` loop, `mousemove` tracking, manual linear interpolation (lerp), and `setTimeout`-based staggers. There is no scroll interaction.

## Layout / HTML
```
section.hero                      (full-viewport stage)
  .hero-img > img                 (full-bleed faint background image)
  p                               "[ The Future Moves in Frames ]"
  p                               "Experiment 457 by Motionprompts"
  .trail-container                (empty; JS appends the trail images here)
```
- `.trail-container` starts **empty** — JS creates every `.trail-img` element on the fly.
- Each spawned trail element has this exact runtime structure (built by JS):
```
.trail-img                        (175×175 absolutely positioned box)
  .mask-layer  × 10               (stacked full-size layers, one per 10%-tall horizontal strip)
    .image-layer                  (full-size div with the portrait as background-image)
```

## Styling
Font: **IBM Plex Mono** (Google Fonts `@import`, all weights 100–700 + italics available; regular is what's used).

- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { background: #101010; }` (near-black)
- `img { width:100%; height:100%; object-fit:cover; }`
- `p { color:#4e4e4e; text-transform:uppercase; font-family:"IBM Plex Mono"; font-size:0.85rem; }` — dim grey mono captions.
- `.hero`: `position:relative; width:100vw; height:100svh; display:flex; flex-direction:column; justify-content:center; align-items:center; overflow:hidden;` — the two `<p>` lines end up stacked dead-center.
- `.hero-img`: `position:absolute; width:100%; height:100%; opacity:0.4;` — the background plate is heavily knocked back, keeping the page near-black. Tune this to the plate you actually use (see Assets): the value only has to leave the haze visible without lifting the ground.
- `.trail-container`: `position:absolute; width:100%; height:100%; overflow:hidden; z-index:2;` — sits above the text/background and hosts the trail.
- `.trail-img`: `position:absolute; width:175px; height:175px; pointer-events:none;`
- `.trail-img .mask-layer`: `position:absolute; top:0; left:0; width:100%; height:100%; background-color:#000000; will-change:clip-path;`
- `.trail-img .mask-layer .image-layer`: `position:absolute; top:0; left:0; width:100%; height:100%; background-size:cover; background-position:center;`

## The effect (exhaustive — vanilla JS, CSS transitions, rAF)

### Config constants (use these exact values)
```js
const config = {
  imageLifespan: 1000,        // ms an image lives before its out-animation starts
  mouseThreshold: 150,        // px the cursor must travel to spawn the next image
  inDuration: 750,            // ms for the strip-reveal clip-path transition
  outDuration: 1000,          // ms for the strip-collapse + fade-out transitions
  staggerIn: 100,             // ms per strip-distance unit on the way IN
  staggerOut: 25,             // ms per strip-distance unit on the way OUT
  slideDuration: 1000,        // ms for the left/top slide toward the cursor
  slideEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",  // gentle ease-out for the slide
  easing: "cubic-bezier(0.87, 0, 0.13, 1)",             // aggressive ease-in-out for all clip-path/opacity moves
};
const trailImageCount = 20;   // 20 image URLs, cycled round-robin with an index modulo 20
```

### State & helpers
- `trail = []` (FIFO queue of live images), `currentImageIndex = 0`, `mousePos {x,y}`, `lastMousePos {x,y}` (position at the last spawn), `interpolatedMousePos {x,y}` (the lerped/lagged cursor), `isDesktop = window.innerWidth > 1000`.
- `lerp(a, b, n) = (1 - n) * a + n * b`; distance via `Math.hypot`.
- `isInTrailContainer(x, y)` — bounds check of the raw mouse position against `trailContainer.getBoundingClientRect()`.
- Mouse tracking: `document.addEventListener("mousemove", e => { mousePos.x = e.clientX; mousePos.y = e.clientY; })`.

### rAF render loop (runs every frame while desktop)
1. `distance = Math.hypot(mousePos - lastMousePos)` (distance traveled since the last spawn).
2. Lerp the lagged cursor with **factor 0.1**:
   `interpolatedMousePos.x = lerp(interpolatedMousePos.x || mousePos.x, mousePos.x, 0.1)` (same for `y`; the `|| mousePos.x` fallback seeds it on the first frames).
3. If `distance > config.mouseThreshold` **and** the raw mouse is inside the trail container → `createTrailImage()` and `lastMousePos = { ...mousePos }`.
4. `removeOldImages()`.
5. `requestAnimationFrame(render)` again.

### `createTrailImage()` — spawn + slide + striped reveal
1. Create `div.trail-img`; pick `images[currentImageIndex]` then `currentImageIndex = (currentImageIndex + 1) % 20`.
2. Positions are container-relative and centered on the point (offset by **87.5** = half of 175):
   - `startX/Y = interpolatedMousePos − containerRect.left/top − 87.5` (the **lagged** position — this is where the image appears),
   - `targetX/Y = mousePos − containerRect.left/top − 87.5` (the **live** cursor position — this is where it slides to).
3. Set inline `left/top` to the start position and
   `transition: left 1000ms cubic-bezier(0.25,0.46,0.45,0.94), top 1000ms cubic-bezier(0.25,0.46,0.45,0.94)` (i.e. `slideDuration` + `slideEasing`).
4. Build **10 mask layers** (`i = 0…9`). For each:
   - `startY = i * 10`, `endY = (i + 1) * 10` (each layer owns one 10%-tall horizontal strip).
   - Inner `div.image-layer` with `background-image: url(imgSrc)` (all 10 layers use the SAME image; each strip just reveals its own slice because the parent clip crops it).
   - Initial **closed** clip: `clip-path: polygon(50% startY%, 50% startY%, 50% endY%, 50% endY%)` — a zero-width vertical sliver at the horizontal center of the strip.
   - `transition: clip-path 750ms cubic-bezier(0.87,0,0.13,1)` (`inDuration` + `easing`), plus GPU hints `transform: translateZ(0)` and `backface-visibility: hidden`.
5. Append the container to `.trail-container`, then inside a `requestAnimationFrame` callback (so initial styles commit first):
   - set `left/top` to the target position (kicks off the 1s slide toward the cursor),
   - for each layer `i`, after `delay = Math.abs(i - 4.5) * config.staggerIn` (via `setTimeout`), set the **open** clip:
     `clip-path: polygon(0% startY%, 100% startY%, 100% endY%, 0% endY%)` — the strip expands to full width.
     Distance-from-middle stagger: the two middle strips (i=4,5 → 0.5 × 100 = 50ms) open first, the outermost (i=0,9 → 4.5 × 100 = 450ms) open last → the image "blooms" open from its vertical center outward.
6. Push `{ element, maskLayers, imageLayers, removeTime: Date.now() + config.imageLifespan }` onto the `trail` queue.

### `removeOldImages()` — striped collapse + dim + cleanup
Each frame, check only `trail[0]` (the oldest). When `Date.now() >= removeTime`, shift it off the queue and:
- For each mask layer `i`: re-set `transition: clip-path 1000ms cubic-bezier(0.87,0,0.13,1)` (`outDuration`), then after `delay = (4.5 - Math.abs(i - 4.5)) * config.staggerOut` (via `setTimeout`) set the clip back to the **closed** center-sliver polygon. Note the inverted stagger: **edge strips (i=0,9 → 0ms) collapse first, middle strips last (i=4,5 → 4 × 25 = 100ms)** — the reverse of the reveal.
- Simultaneously, every `.image-layer` gets `transition: opacity 1000ms cubic-bezier(0.87,0,0.13,1)` and `opacity: 0.25` — the image dims as its strips close.
- Remove the element from the DOM after `config.outDuration + 112` ms (`setTimeout`).

### Desktop gate & lifecycle
- The whole effect only runs when `window.innerWidth > 1000`. `startAnimation()` attaches the `mousemove` listener and starts the rAF loop (and returns a cleanup fn that removes the listener); `stopAnimation()` cancels the rAF and removes every live trail element (clearing the queue).
- On `window.resize`, detect the boundary crossing: mobile→desktop calls `startAnimation()`, desktop→mobile calls `stopAnimation()` plus the mousemove cleanup.
- **Declaration order matters:** wrap the entire effect in a single `init` function, and inside it declare ALL state (config, `trail`, `currentImageIndex`, mouse position objects, the `isDesktop` flag, the rAF id variable, the `cleanUpMouseListener` reference) **before** defining/wiring any listeners or calling `startAnimation()`. Nothing outside `init` may reference these variables — this prevents any use-before-declaration (TDZ) crash.
- **Bootstrapping (use this exact pattern, nothing else):** define `init` fully first, then at the very bottom of the module a single branch:
  ```js
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  ```
  Do NOT also call `init()` at top level, and do NOT add an "already initialized" guard flag — exactly one branch of the `if/else` runs, so a guard is unnecessary (and a flag declared after a top-level call is a fatal TDZ `ReferenceError`). Since the script is an ES module (deferred), the `else` branch is what normally runs.

## Assets / images
**21 images total:**
- **1 hero background** (`.hero-img > img`, full-bleed landscape ~16:9): **an abstract, subjectless plate** — lit studio haze, diagonal shafts of light raking through smoke over near-black, with a warm ochre glow low-left. It renders at 40% opacity over the near-black body, so on the page it reads as a deep prussian-blue atmosphere with faint shafts in it. **Do not use a portrait here.** A face in the background competes with the twenty portraits streaming over it: the eye keeps trying to read the big blurry figure instead of the small sharp ones, and the headline ends up sitting on a cheek. The background's job is to give the trail something to be *lit against* — texture and direction, no subject. Anything with a recognisable subject (a person, a product, a building) fails that job, however faint you make it. Mark it `alt=""`: it is decoration, not content.
  - Two consequences of choosing a plate instead of a photo of something: crop it dead centre (`object-position: 50% 50%`) at every aspect ratio, since there is nothing to keep in frame; and keep the mobile de-blocking blur light (`blur(1px)`, not 2–3px) — smoke is fine wisps and a heavy blur flattens the whole thing into a grey wash. Choose the opacity by measurement, not habit: aim for the headline colour to clear ~5:1 against the brightest pixel it can land on. A darker plate needs a *higher* opacity than a bright one to stay visible at all.
- **20 trail portraits** (roughly square, displayed as 175×175 with `background-size: cover`): bold, high-fashion studio editorial portraits of diverse models — saturated mono-color backdrops (red, yellow, blue, magenta, orange, grey), dramatic colored lighting, sunglasses, sculptural styling. Visually punchy crops that read instantly at 175px. They are cycled round-robin, so variety between consecutive images matters.

No real brands or client names anywhere; the two caption lines are the neutral demo strings given in the Layout section.

## Behavior notes
- **Desktop-only** (>1000px viewport width); on smaller screens nothing spawns and any live trail is cleared.
- No `prefers-reduced-motion` branch, no scroll behavior, no infinite loop other than the rAF watcher.
- Spawn cadence is governed purely by cursor travel distance (150px), not time — fast sweeps produce a dense trail, slow movement produces none.
- The lerp factor 0.1 makes the spawn point trail noticeably behind the cursor, so every new image visibly slides ~toward the cursor over 1s while it opens.
- Trail elements never intercept pointer events (`pointer-events: none`), and `.trail-container`'s `overflow: hidden` clips images spawned near the edges.

## Images

This component ships with 21 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/247artists-trail/hero.jpg
https://motionprompts.dev/c/247artists-trail/trail-images/img1.jpeg
https://motionprompts.dev/c/247artists-trail/trail-images/img10.jpeg
https://motionprompts.dev/c/247artists-trail/trail-images/img11.jpeg
https://motionprompts.dev/c/247artists-trail/trail-images/img12.jpeg
https://motionprompts.dev/c/247artists-trail/trail-images/img13.jpeg
… 15 more under https://motionprompts.dev/c/247artists-trail/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-deep`, `--paper`, `--crimson`, `--slate`, `--line`, `--serif`, `--mono`, `--pad`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: a script that reaches into the page with a single `document.querySelector(".trail-container")`, then keeps a `pointermove` listener and a self-recursing `requestAnimationFrame` loop alive for as long as the page is open. React withdraws all of that at once, and it does it quietly — the trail keeps following the cursor, but something underneath is now doubled.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that never runs leaves two of everything here: two `pointermove` listeners each writing to their own `mousePos`, two `render` loops independently lerping their own `interpolatedMousePos` and independently deciding to call `createTrailImage()` against the same `.trail-container` once the same swipe crosses the distance threshold — so one gesture spawns twice the images it should, and both copies keep fighting over the same DOM node long after only one of them should exist. The symptom is a doubled or overlapping trail, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — This script is already closer to React's shape than most in this catalogue: the original top-level `init()` has been rewritten as `mount(config)`, returning a `destroy()` that undoes exactly what `mount()` built — that split exists so this catalogue's own editor runtime (`window.MP.register`) can tear the effect down and remount it live with a different `config`. Drop the `window.MP` branch entirely; it is the editor's hook into this file, not something a consuming app ships. Drop the `document.readyState` check and its `DOMContentLoaded` listener too — that guard exists to survive being loaded late into a plain document, and `useEffect` already runs after the DOM is committed, so there is nothing here for it to guard against. What's left is exactly the effect body:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS });
  return destroy;
}, []);
```

*(2) Element lookups* — `mount()` opens with `document.querySelector(".trail-container")` and quietly returns a no-op `destroy` if it doesn't find one — harmless as a guard, but the lookup itself assumes this component owns the whole document. Scope it to a root ref: pass the container element into `mount` (or have it query inside `rootRef.current` instead of `document`) rather than letting it search globally. This is more than a style objection during the StrictMode remount specifically — for an instant two `.trail-container` elements exist in the tree, and an unscoped `querySelector` can bind the trail to the one that's on its way out while the visible copy never gets its listener.

*(3) Cleanup* — `mount()`'s own `destroy()` already does what the rAF-driven components in this catalogue usually need adding by hand: it calls `cancelAnimationFrame` on the exact handle `animationState` holds, and it removes the same `handlePointerMove` reference `addEventListener` was given. Return that `destroy` unmodified from the effect — it is already the correct cleanup function, not a legacy shape to be translated into something more idiomatic.

One part of it is worth understanding rather than just trusting: `createTrailImage()` and `removeOldImages()` each schedule several `setTimeout` calls per spawned image — the middle-out stagger that opens the ten mask layers, the edge-out stagger that closes them, and the final removal fired after the out-animation finishes. None of those timer ids are captured, so `destroy()` has no way to cancel them individually. That is safe only because of the line right after it: `trailContainer.innerHTML = ""` detaches every node those pending timeouts still reference in one shot, so a timer that fires after unmount just sets a `clipPath` or an `opacity` on an element nothing renders anymore. Keep that wholesale clear exactly where it is in the returned cleanup — the correctness here comes from clearing the whole container at once, not from tracking every stray timer, and adding per-timeout bookkeeping would be solving a problem this component doesn't actually have.

The `matchMedia("(pointer: coarse)").matches` check that lowers the spawn threshold for touch runs once, synchronously, when `mount()` is called — it isn't a subscription, so it needs no listener removal in the cleanup. Don't add a `matchMedia` change handler where the original has none; a device switching pointer types mid-session is not a case this component ever handled.
