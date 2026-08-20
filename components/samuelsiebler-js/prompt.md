# Rotating Hand Animation — pinned scroll hero with a spinning clock-hand rod

## Goal

Build a full-page scroll-driven hero: the section pins for 8 viewport heights while a thin vertical rod (like a clock hand) spins 5 full turns (1800°) around the center of the screen, driven directly by scroll progress. Each completed 360° cycle swaps the intro headline text. On the 4th cycle a portrait photo fades in inside the rod and two paragraphs slide in. In the final stretch the rod grows to full height, scales up 20×, fades out, and a giant brand wordmark is revealed underneath.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) with the `ScrollTrigger` plugin, plus `lenis` for smooth scrolling. No other libraries.

## Layout / HTML

- `<section class="sticky">` — the pinned hero. Inside it, three absolutely-positioned layers:
  - `<div class="hand-container">` containing `<div class="hand">` which contains a single `<img>` (the portrait).
  - `<div class="intro">` containing `<h1><span>time to</span> be brave</h1>` followed by two `<p>` elements of placeholder lorem-ipsum copy (2–3 lines each).
  - `<div class="website-content">` containing `<h1>harrnish</h1>` (the brand wordmark).
- `<section class="about">` after it — a simple white section with a centered paragraph like "(Your next section goes here)" so there is somewhere to scroll to after the pin releases.
- Module script tag at the end of `<body>`.

## Styling

- Global reset (`* { margin:0; padding:0; box-sizing:border-box }`), antialiased font smoothing.
- `html, body`: `width: 100vw; height: 1000vh` (tall page), font-family "PP Neue Montreal", sans-serif fallback, color `#fff`.
- Every `section`: `width: 100vw; height: 100vh`.
- `.sticky`: background `#161616` (near-black).
- `.about`: white background (`#ffffff`), flex-centered content, its `p` in black.
- `h1`: `font-size: 30px; font-weight: 500; letter-spacing: -0.01em`. The `h1 span` is muted grey `#6e6e6e` (so "time to" is grey and the rest is white).
- `p`: `font-size: 16px; font-weight: 500; color: #555555; text-align: justify; line-height: 130%`.
- `img`: `width: 100%; height: 100%; object-fit: cover; opacity: 0` (hidden by default — revealed later by GSAP).
- `.hand-container`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)`, `width: 800px; height: 800px`, `display: flex; justify-content: center; align-items: flex-start` (the rod hangs from the top edge of the container so rotating the container swings it like a clock hand), `transform-origin: center center; transform-style: preserve-3d; will-change: transform; z-index: 2`.
- `.hand`: `position: absolute; width: 5.5%; height: 52.75%` (a thin rod slightly longer than the container's radius), `background-color: rgb(238, 238, 238)` (off-white), `border-radius: 1000px` (fully pill-shaped), `overflow: hidden; will-change: transform; opacity: 1`.
- `.intro`: `position: absolute; top: calc(50% - 20px); left: 25%; width: 22.5%`.
- `.intro p`: `position: relative; margin-top: 0.75em; transform: translateX(20px); opacity: 0` (hidden, offset 20px right — GSAP slides them in).
- `.website-content`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; opacity: 0`. Its `h1` is huge: `font-size: 10vw; letter-spacing: -0.03em`.
- Include the standard Lenis helper CSS (`.lenis.lenis-smooth { scroll-behavior: auto !important; }`, `[data-lenis-prevent] { overscroll-behavior: contain; }`, `.lenis.lenis-stopped { overflow: hidden; }`, `.lenis.lenis-smooth iframe { pointer-events: none; }`).
- Media query `max-width: 900px`: `.intro { width: 35%; left: 2em; }`, `h1 { font-size: 18px; }`, `p { font-size: 13px; }`.

## GSAP effect (be exact)

Register `ScrollTrigger`. Everything runs inside a `DOMContentLoaded` listener.

**Lenis setup:** `const lenis = new Lenis()`; `lenis.on("scroll", ScrollTrigger.update)`; drive it from GSAP's ticker: `gsap.ticker.add((time) => lenis.raf(time * 1000))`; `gsap.ticker.lagSmoothing(0)`.

**Single ScrollTrigger** (no timeline, no scrub property — all animation is computed manually in `onUpdate` from `self.progress`):

- `trigger: .sticky`, `start: "top top"`, `end: "+=" + (window.innerHeight * 8)` (pinnedHeight = 8 viewport heights), `pin: true`, `pinSpacing: true`.

**Headline cycling state:** an array of 5 headline HTML strings (each keeps the grey `<span>` prefix):
1. `<span>time to</span> be brave`
2. `<span>time to</span> be playful`
3. `<span>time to</span> design the future`
4. `<span>time to</span> meet harrnish`
5. `<span>time to</span> see project one`

Track `currentCycle` (init `-1`) and `imageRevealed` (init `false`). An `updateHeaderText()` helper sets `h1Element.innerHTML = introHeaders[Math.min(currentCycle, introHeaders.length - 1)]` and re-queries the `span` reference (it is replaced by innerHTML). Call `updateHeaderText()` once on load after creating the ScrollTrigger so the first headline renders.

**Inside `onUpdate(self)`, with `progress = self.progress` (0→1 across the 8-viewport pin):**

1. **Rotation (occupies the first 5/8 of the pin):**
   - `rotationProgress = Math.min((progress * 8) / 5, 1)` — rotation completes at progress 5/8 and clamps at 1 after.
   - `totalRotation = rotationProgress * 1800 - 90` — 5 full turns (1800°), starting at −90° (rod pointing horizontally).
   - `rotationInCycle = ((totalRotation + 90) % 360) - 90` — wraps to the current cycle's angle.
   - `gsap.set(handContainer, { rotationZ: rotationInCycle })` — set directly every frame (scrubbed by scroll, no easing).

2. **Cycle detection / headline swap:** `newCycle = Math.floor((totalRotation + 90) / 360)`. When `newCycle !== currentCycle` and `0 <= newCycle < 5`, store it and call `updateHeaderText()`. Additionally:
   - When entering cycle 3 (and `!imageRevealed`): `gsap.to(handImage, { opacity: 1, duration: 0.3 })` and `gsap.to(introCopy, { x: 0, opacity: 1, duration: 0.5, stagger: 0.1 })` (the two paragraphs slide from x:20 to 0). Set `imageRevealed = true`.
   - When leaving cycle 3 (any other cycle while `imageRevealed`): reverse it — `gsap.to(handImage, { opacity: 0, duration: 0.3 })`, `gsap.to(introCopy, { x: 20, opacity: 0, duration: 0.5, stagger: 0.1 })`, `imageRevealed = false`.
   - These four tweens are the only time-based tweens; everything else is `gsap.set` scrubbed from progress.

3. **Rod stretch + headline fade (progress 5/8 → 6/8):** while `progress <= 6/8`:
   - `animationProgress = Math.max(0, (progress - 5/8) / (1/8))`.
   - Height: `gsap.utils.interpolate(52.75, 100, animationProgress)` → `gsap.set(hand, { height: newHeight + "%" })` (rod grows to full container height).
   - `gsap.set(intro, { opacity: 1 })` and fade the h1 and its span: `gsap.utils.interpolate(1, 0, animationProgress)` applied via `gsap.set` to both `h1Element` and `h1Span`.
   - Else (progress > 6/8): `gsap.set(intro, { opacity: 0 })`.

4. **Rod scale-up (progress 6/8 → 7/8):** while `progress <= 7/8`: `scaleProgress = Math.max(0, (progress - 6/8) / (1/8))`, `newScale = gsap.utils.interpolate(1, 20, scaleProgress)`, `gsap.set(hand, { scale: newScale })` — the rod blows up to 20× and floods the screen.

5. **Rod fade-out (progress 7/8 → 7.5/8):** while `progress <= 7.5/8`: `opacityProgress = Math.max(0, (progress - 7/8) / (0.5/8))`, opacity `gsap.utils.interpolate(1, 0, opacityProgress)` set on `.hand`.

6. **Wordmark reveal (progress 7.5/8 → 1):** when `progress > 7.5/8`: `revealProgress = (progress - 7.5/8) / (0.5/8)`, `gsap.set(".website-content", { opacity: gsap.utils.interpolate(0, 1, revealProgress) })`. Otherwise keep `.website-content` at `opacity: 0`.

All the `gsap.set` phases are fully reversible by scrolling back up because every value derives from `progress`.

## Assets / images

- 1 image: a black-and-white portrait photograph of a person, roughly portrait/square aspect. It sits inside the thin rod (`object-fit: cover`, mostly cropped by the rod's pill shape) and only becomes visible during the 4th rotation cycle.

## Behavior notes

- The effect is scroll-scrubbed and reversible; there is no autoplay.
- The page is intentionally very tall (`height: 1000vh` on body plus pin spacing) so the pin has room.
- Works on mobile (media query shrinks type and repositions the intro), no WebGL/canvas.
- The rod starts pointing horizontally (−90°) and sweeps clockwise like a clock hand as the user scrolls.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/samuelsiebler-js/portrait.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--muted-soft`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the rod keeps spinning, the headline keeps cycling, and the effect shows up later, in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Without a proper teardown, that leaves two `ScrollTrigger`s pinned to the same `.sticky` element, each computing its own `rotationZ` and `scale` from an independently progressing scroll position and overwriting the other's writes on the same `handContainer`/`hand` every tick, plus two `Lenis` instances and two ticker subscriptions both driving the same wheel event. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

**(1) The entry point.** The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called — and because this script puts everything inside that one listener, that is not just the pin and the rotation: the `Lenis` instance, the ticker wiring, and the `updateHeaderText()` call that seeds the very first headline never run either. No error, just a `.sticky` section sitting inert with whatever headline the static markup happens to contain. Delete the listener and move its body into a `useEffect` with an empty dependency array.

**(2) Element lookups.** Give the component a root ref on the outermost element and scope every lookup to it. `stickySection`, `handContainer`, `hand`, `handImage`, `intro`, `h1Element`, and `introCopy` are all queried once and cached in a variable, so redirecting those seven through the ref covers them. `.website-content` does not go through that pattern: it is the one target passed as a bare string straight to `gsap.set(".website-content", { opacity: ... })` inside `onUpdate`, re-resolved against the whole document on every call instead of read from a cached, scoped reference. During the StrictMode remount two `.website-content` nodes exist for an instant, and this one lookup — unlike the other six — will happily bind to whichever copy is currently in the live document, independent of how carefully you scoped everything else. Query it once alongside the rest (`rootRef.current.querySelector(".website-content")`) and pass the element, not the string.

**(3) Cleanup.**

```jsx
useEffect(() => {
  const lenis = new Lenis();
  const onLenisScroll = () => ScrollTrigger.update();
  lenis.on("scroll", onLenisScroll);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const ctx = gsap.context((self) => {
    const stickySection = rootRef.current.querySelector(".sticky");
    const handContainer = rootRef.current.querySelector(".hand-container");
    const hand = handContainer.querySelector(".hand");
    const handImage = hand.querySelector("img");
    const intro = rootRef.current.querySelector(".intro");
    const h1Element = intro.querySelector("h1");
    const introCopy = intro.querySelectorAll("p");
    const websiteContent = rootRef.current.querySelector(".website-content");
    const pinnedHeight = window.innerHeight * 8;
    let h1Span = h1Element.querySelector("span");
    let currentCycle = -1;
    let imageRevealed = false;

    function updateHeaderText() {
      h1Element.innerHTML = introHeaders[Math.min(currentCycle, introHeaders.length - 1)];
      h1Span = h1Element.querySelector("span");
    }

    const onProgress = self.add("onProgress", () => {
      /* the rotation, the cycle detection, the hand / intro / websiteContent gsap.set calls,
         and the two conditional gsap.to pairs, exactly as described above */
    });

    ScrollTrigger.create({
      trigger: stickySection,
      start: "top top",
      end: `+=${pinnedHeight}`,
      pin: true,
      pinSpacing: true,
      onUpdate: onProgress,
    });

    updateHeaderText();
  }, rootRef);

  return () => {
    ctx.revert();
    gsap.ticker.remove(tick);
    lenis.off("scroll", onLenisScroll);
    lenis.destroy();
  };
}, []);
```

Name the wrapped callback with `self.add`, never `ctx.add`. Inside the factory the only bound name is `self` — `ctx` is still in its temporal dead zone at that point, and reaching for it throws `Cannot access 'ctx' before initialization` and takes the whole tree down. `onUpdate` is exactly the kind of callback GSAP can invoke synchronously while a trigger is still being created or refreshed, so writing `ctx.add(...)` inline inside it fails the same way a bare reference would.

The two conditional `gsap.to` pairs — the `handImage` fade and the `introCopy` slide, fired when cycle three is entered or left — are the only time-based tweens this component creates (the prompt already calls this out above); every other write inside `onUpdate` is a `gsap.set`, which has nothing left to finish once it runs. Those two pairs are created from inside `onUpdate`, which fires on every trigger update, long after the factory's synchronous pass — so `gsap.context` never sees them unless `onUpdate` itself is registered through `self.add`. Skip that, and a fade or slide that is still mid-flight the moment `ctx.revert()` kills the pin keeps animating toward its target on its own for however long that fade takes, against a `handImage`/`introCopy` that the rest of the effect just tore down. It is simplest to wrap the whole `onUpdate` body rather than pick out just those two branches — `self.add` doesn't care that most of what runs inside is inert `gsap.set` calls with nothing to revert, and passing the function it hands back straight through as the `onUpdate` option needs no extra indirection through `ctx`.

`currentCycle`, `imageRevealed`, and `h1Span` need no `useRef` here. Every read and write happens inside the `onProgress` closure and the `updateHeaderText` closure declared right next to it inside the same factory call, so plain `let` bindings scoped there behave exactly like the top-level variables in the original script — nothing outside that scope, like a DOM listener registered elsewhere, ever needs to see them. `h1Span` specifically has to be reassigned, not mutated, on every `updateHeaderText()` call: the previous `innerHTML` write destroyed the old `<span>`, so the requery has to live in the same function that owns the write, exactly as above — a version that hoists `h1Span` out and only queries it once will fade the wrong, now-detached span from the second headline onward.

`gsap.ticker.add(tick)` is the smooth-scroll loop here — this component has no `requestAnimationFrame` of its own; driving `lenis.raf` off the GSAP ticker is the whole mechanism. The context does not track a ticker subscription, so `ctx.revert()` leaves it calling into a `Lenis` instance you are about to destroy. Keep the `tick` reference and remove it with `gsap.ticker.remove`, before `lenis.destroy()` runs — a tick landing between `destroy()` and the removal throws into a component that no longer exists.

`Lenis` is a document-level resource. This component is written to own the whole page (see the "Using this outside its demo page" note above), so one instance created per mount and destroyed in the cleanup is correct as long as nothing else on the page also runs Lenis. If you embed this hero as one section of a larger app instead, lift the instance to the app shell and drop everything above except the `lenis.on("scroll", ScrollTrigger.update)` wiring.
