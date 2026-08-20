# Cursor Image Trail (vanilla JS + CSS transitions)

## Goal

Build a three-section page whose middle, light-colored full-viewport panel spawns a trail of photos under the cursor: every time the mouse travels far enough (or sits idle, or the page scrolls) a new 200×200 image pops in at the cursor position with a random tilt, scaling up from 0, then collapses back to scale 0 and unmounts after a short lifespan. The result is a continuous, self-cleaning stream of tilted photos chasing the pointer.

## Tech

Vanilla HTML/CSS/JS with ES module imports. **No GSAP is used** — the animation engine is a `requestAnimationFrame` loop plus CSS `transform` transitions with custom `cubic-bezier` easings. Install and import `lenis` (npm) for smooth scrolling. Everything runs inside a `DOMContentLoaded` handler.

## Layout / HTML

Three stacked `<section>` elements, each exactly one viewport tall:

```
<section class="intro">
  <h1>Dynamic Cursor Trail Animation</h1>
</section>

<section class="trail-container">
  <p>( Move your cursor around and see the magic unfold )</p>
</section>

<section class="outro">
  <h1>Wrapping Up</h1>
</section>
```

The `.trail-container` section is the interactive zone: trail `<img class="trail-img">` elements are created and appended directly into it at runtime. Load the script with `<script type="module" src="./script.js">`.

## Styling

- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `body`: `font-family: "PP Neue Montreal", sans-serif` (any clean grotesque sans fallback is fine); `background-color: #1e1e1e`.
- `h1`: color `#fff`, `font-size: 5vw`, `font-weight: 500`, `user-select: none`.
- `p`: `text-transform: uppercase`, `text-align: center`, `font-family: "Akkurat Mono", monospace` (monospace fallback fine), `font-weight: 600`, `user-select: none`. Default black text.
- Every `section`: `position: relative`, `width: 100vw`, `height: 100vh`, `display: flex`, `justify-content: center`, `align-items: center`, `overflow: hidden` (crucial — trail images spawning near the edges must be clipped by the section).
- `.trail-container`: `background-color: #fcfcfc` (near-white panel sandwiched between the two dark sections).
- `.trail-img`: `position: absolute`, `width: 200px`, `height: 200px`, `object-fit: cover`, `border-radius: 4px`, `transform-origin: center`, `pointer-events: none`, `will-change: transform`.

## Animation engine (be precise — no GSAP, no ScrollTrigger)

### Config constants

```
imageCount: 35            // pool of image URLs
imageLifespan: 750        // ms an image lives before its exit starts
removalDelay: 50          // ms minimum between two consecutive removals
mouseThreshold: 100       // px of cursor travel needed to spawn a new image
scrollThreshold: 50       // ms throttle between scroll-spawned images
idleCursorInterval: 300   // ms between spawns while the cursor rests in the panel
inDuration: 750           // ms entrance transition
outDuration: 1000         // ms exit transition
inEasing:  cubic-bezier(.07, .5, .5, 1)    // fast start, soft settle
outEasing: cubic-bezier(.87, 0, .13, 1)    // aggressive ease-in-out
```

Build an array of 35 image URLs (`img1 … img35`). Keep a `trail` queue of live images, each entry `{ element, rotation, removeTime }`.

### State

Track `mouseX/mouseY`, `lastMouseX/lastMouseY` (position of the last spawn), booleans `isMoving`, `isCursorInContainer`, `isScrolling`, `scrollTicking`, and timestamps `lastRemovalTime`, `lastSteadyImageTime`, `lastScrollTime`.

`isInContainer(x, y)` compares viewport coordinates against `container.getBoundingClientRect()` (left/right/top/bottom inclusive).

Seed the initial cursor position with a one-shot `mouseover` listener on `document`: on first fire, set `mouseX/Y` and `lastMouseX/Y` from `event.clientX/clientY`, compute `isCursorInContainer`, then remove the listener.

### Spawning an image — `createImage()`

1. Create an `<img>` with class `trail-img`; pick a **random** URL from the pool.
2. Random rotation: `(Math.random() - 0.5) * 50` → uniform in **−25°…+25°**.
3. Position it relative to the container: `left = mouseX - rect.left`, `top = mouseY - rect.top` (rect from `getBoundingClientRect()`), in px.
4. Initial inline transform: `translate(-50%, -50%) rotate(<r>deg) scale(0)`, with inline `transition: transform 750ms cubic-bezier(.07,.5,.5,1)`.
5. Append to the container, then after a **10 ms** `setTimeout` set the transform to the same translate/rotate but `scale(1)` so the transition plays (scale 0 → 1 pop-in; rotation stays fixed for the image's whole life).
6. Push `{ element, rotation, removeTime: Date.now() + 750 }` onto the `trail` queue.

### Per-frame spawner — `createTrailImage()` (called every rAF)

- Bail if the cursor isn't inside the container.
- If `isMoving` **and** the Euclidean distance from `lastMouseX/Y` to `mouseX/Y` exceeds 100 px: update `lastMouseX/Y` to the current position and spawn.
- Else if **not** moving and `now - lastSteadyImageTime >= 300` ms: update `lastSteadyImageTime` and spawn (a resting cursor keeps emitting a gentle pulse of images every 300 ms).

### Scroll-driven spawner — `createScrollTrailImage()`

Bail if the cursor isn't in the container. Otherwise fake enough travel to force a spawn: offset `lastMouseX` **and** `lastMouseY` each by `(mouseThreshold + 10)` px with an independent random sign (±110), call `createImage()`, then reset `lastMouseX/Y` back to the real `mouseX/Y`.

### Removal — `removeOldImages()` (called every rAF)

- Throttle: return if `now - lastRemovalTime < 50` ms or the queue is empty.
- Only inspect the **oldest** entry (`trail[0]`). If `now >= removeTime`, shift it off the queue, overwrite its inline transition to `transform 1000ms cubic-bezier(.87,0,.13,1)`, set its transform to `translate(-50%, -50%) rotate(<same r>deg) scale(0)`, record `lastRemovalTime`, and remove the element from the DOM via `setTimeout` after 1000 ms (guard that it still has a parent). So images die strictly FIFO, at most one every 50 ms.

### Event wiring

- `document mousemove`: update `mouseX/Y` and `isCursorInContainer`. When inside the container set `isMoving = true` and debounce it back to `false` after **100 ms** of no movement (clear/reset a timeout each event).
- `window scroll` (passive) — listener 1: recompute `isCursorInContainer` from the stored mouse position; if inside, set `isMoving = true`, nudge `lastMouseX` by `(Math.random() - 0.5) * 10`, and debounce `isMoving = false` after 100 ms.
- `window scroll` (passive) — listener 2: set `isScrolling = true`; throttle to one pass per **50 ms** (`lastScrollTime`); use a `scrollTicking` flag so only one `requestAnimationFrame` callback is queued at a time — inside it, if still scrolling, call `createScrollTrailImage()` and clear `isScrolling`, then release the tick flag.
- Main loop: `const animate = () => { createTrailImage(); removeOldImages(); requestAnimationFrame(animate); }; animate();`
- Smooth scroll: `new Lenis({ autoRaf: true })` — no other Lenis config.

## Assets / images

35 editorial fashion/beauty portraits (moody studio photography — dramatic lighting, bold styling, mixed dark and vividly colored backdrops). Any source aspect works since each is cropped to a 200×200 square by `object-fit: cover`. Reference them as `img1.jpeg` … `img35.jpeg` (adjust paths/extensions to whatever assets are available).

## Behavior notes

- Desktop / pointer-driven experience: without a mouse nothing spawns (no touch handling).
- The trail self-cleans: with a 750 ms lifespan, ~1 s exit and FIFO removal throttled at 50 ms, a fast-moving cursor keeps roughly a dozen images alive at once.
- Because images are absolutely positioned children of the section with `overflow: hidden`, they scroll with the panel and clip at its edges.
- No console errors on load; the effect needs no user interaction to initialize, only to display.

## Images

This component ships with 35 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/burocratik-image-trail-js/img1.jpeg
https://motionprompts.dev/c/burocratik-image-trail-js/img10.jpeg
https://motionprompts.dev/c/burocratik-image-trail-js/img11.jpeg
https://motionprompts.dev/c/burocratik-image-trail-js/img12.jpeg
https://motionprompts.dev/c/burocratik-image-trail-js/img13.jpeg
https://motionprompts.dev/c/burocratik-image-trail-js/img14.jpeg
… 29 more under https://motionprompts.dev/c/burocratik-image-trail-js/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ground`, `--paper`, `--print`, `--muted-on-ink`, `--muted-on-paper`, `--safelight`, `--safelight-deep`, `--hairline-on-paper`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought. This particular script is already shaped like an effect before you touch it: `mount(config)` builds the whole trail — one `Lenis` instance, one `trail` queue, one `animate()` loop, five `document`/`window` listeners — inside a closure and hands back a single function that undoes every one of them. The adaptation is about relocating that call, not restructuring it.

*(1) The entry point* — The script only reaches `mount` through the bottom guard, `if (document.readyState === "loading") … else boot()`. That guard exists to survive being evaluated late inside a plain `<script type="module">` tag; `useEffect` already runs after the DOM is committed, so it is dead weight here. Drop the `window.MP` branch, the `readyState` check and `boot`, and invoke `mount`'s body directly inside a `useEffect` with an empty dependency array, using the props or defaults this component needs in place of `DEFAULTS`. Return exactly the function `mount` already builds — do not write a new cleanup, the one in the code above already frees every resource this section lists below.

*(2) Element lookups* — Every `document.querySelector` in the code above assumes this component owns the document. Give the component a root `ref`, render it on the outermost element, and scope every lookup to it. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of the subtree exist for an instant, and an unscoped selector will bind to the one that is on its way out. Concretely, that means `document.querySelector(".trail-container")` becomes a ref read (`ref.current`), guarded the same way the original guards a missing container — bail out and return a no-op cleanup. The other five listeners — the one-shot `mouseover`/`touchstart` pair on `document`, the ongoing `mousemove`/`touchmove` pair on `document`, and the two `scroll` listeners on `window` — stay global on purpose: `isCursorInContainer` is decided by comparing the live cursor position against `getBoundingClientRect()`, not by where the listener is attached, so scoping them to the ref would only drop events without changing what the handlers do with them.

*(3) Cleanup* — Everything the effect creates must be undone in the function it returns. The test of a correct adaptation is not that it looks right on first load — it is that you can navigate away to another route and come back and nothing has accumulated. This component has two independent tickers, and losing either one under a StrictMode remount produces a different, separately debuggable symptom:

- **Lenis.** This instance is built with autoRaf enabled, so it runs its own internal `requestAnimationFrame` loop; there is no `lenis.raf()` call to wire up and no loop of your own to cancel for scrolling. The one obligation is `lenis.destroy()` in the cleanup — skip it under a double mount and you get two `Lenis` instances both bound to the same wheel/touch input, fighting over the same scroll position.
- **The trail's own rAF loop.** `animate()` is a second, unrelated loop: it drives `createTrailImage()` and `removeOldImages()`, nothing to do with scrolling. Keep the handle `frame` already stores and call `cancelAnimationFrame(frame)` in the cleanup, exactly as written. Miss this one and the failure is specific, not generic: a second `animate()` loop keeps calling `createTrailImage()` against its own `trail` array and its own copy of the `mousemove`/`scroll` listeners, so a single cursor movement spawns two images into the same container instead of one, and `removeOldImages()` runs twice in parallel against two different `trail[0]` heads — the queue never drains at the rate the design (a dozen images alive at once) assumes.
- **Timers and DOM the effect wrote by hand.** The `timers` `Set` already tracks every `setTimeout` scheduled by `createImage()`'s pop-in and `removeOldImages()`'s removal, plus `moveTimeout` and `scrollTimeout` — the returned function already clears all of them. Keep that intact: a `later()` callback that fires after unmount would otherwise call `.style.transform` or `.removeChild` against a container React has already torn down. The same function also runs `container.querySelectorAll(".trail-img").forEach(el => el.remove())` before `lenis.destroy()` — keep that line too, since React never rendered those `<img>` elements and has no other way to know they need to go; without it, a remount starts with the previous mount's images still sitting in `.trail-container`.
