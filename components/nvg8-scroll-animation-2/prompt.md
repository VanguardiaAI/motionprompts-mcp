# Icon-to-Text Pinned Scroll Story (GSAP + Lenis)

## Goal

Build a full-screen pinned hero section driven by a single scrubbed ScrollTrigger: a bottom row of five app icons rises with a staggered catch-up motion, gathers and shrinks to the viewport center while the background flips from dark to light, then the icons are cloned and fly one-by-one along an L-shaped path (vertical, then horizontal) into inline placeholder slots inside a big headline, whose text segments finally fade in one at a time in a shuffled random order.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` for smooth scrolling. No other libraries. Wrap all JS in a `DOMContentLoaded` listener and call `gsap.registerPlugin(ScrollTrigger)`.

## Layout / HTML

- `<section class="hero">` containing:
  - `<div class="hero-header">` with an `<h1>` "MotionpromptsPRO" and a `<p>` "One subscription, endless web design."
  - `<div class="animated-icons">` with five children `<div class="animated-icon icon-1">` … `icon-5`, each wrapping an `<img>` (the five icon images).
  - `<h1 class="animated-text">` containing an interleaved sequence of inline elements, in this exact order:
    1. `<div class="placeholder-icon"></div>`
    2. `<span class="text-segment">Delve into coding</span>`
    3. `<div class="placeholder-icon"></div>`
    4. `<span class="text-segment">without clutter.</span>`
    5. `<span class="text-segment">Unlock source code </span>`
    6. `<div class="placeholder-icon"></div>`
    7. `<span class="text-segment">for every tutorial</span>`
    8. `<div class="placeholder-icon"></div>`
    9. `<span class="text-segment">published on the Motionprompts</span>`
    10. `<div class="placeholder-icon"></div>`
    11. `<span class="text-segment">YouTube channel.</span>`

    That is 6 text segments and 5 placeholders total.
- `<section class="outro">` with an `<h1>` "Link in description".

## Styling

- Google Font **"Host Grotesk"** on `body` (fallback sans-serif). Global reset (`* { margin:0; padding:0; box-sizing:border-box }`).
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1 { font-size:7vw; font-weight:800; line-height:1; }`, `p { font-size:1.5rem; font-weight:400; }`
- `section`: `position:relative; width:100vw; height:100svh; padding:1.5rem; display:flex; align-items:center; justify-content:center; background-color:#141414; color:#e3e3db; overflow:hidden;`
- `.hero`: `flex-direction:column;` and crucially `transition: background-color 0.3s ease;` (the JS swaps its background between `#141414` and `#e3e3db`).
- `.hero-header`: `position:absolute; top:35%; left:50%; transform:translate(-50%,-50%); width:60%; text-align:center; display:flex; flex-direction:column; gap:2rem; will-change:transform,opacity;`
- `.animated-icons`: `position:fixed; bottom:1rem; left:1rem; right:1rem; display:flex; align-items:center; gap:1rem; z-index:2; will-change:transform;` — a full-width row pinned to the bottom of the viewport.
- `.animated-icon`: `flex:1; aspect-ratio:1;` (five equal squares filling the row).
- `.animated-text`: `position:relative; max-width:1000px; text-align:center; color:#141414; font-size:clamp(2rem,5vw,4rem); font-weight:800; line-height:1;` — note the text is DARK (`#141414`), so it is invisible against the dark background and only becomes readable once the background flips to light.
- `.text-segment { opacity:0; }`
- `.placeholder-icon`: `display:inline-block; width:60px; height:60px; margin-top:-10px; vertical-align:middle; visibility:hidden; will-change:transform;` — invisible but reserves inline space inside the headline where the flying icons will land.
- Media query `@media (max-width:1000px)`: `h1 { font-size:12vw; text-align:center; }`, `p { font-size:1.1rem; }`, `.hero-header { top:45%; width:100%; }`, `.placeholder-icon { width:30px; height:30px; margin-top:-4px; }`.

## GSAP effect (exhaustive)

### Lenis setup

```
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### Pre-computed values (once, on load)

- Collect the 6 `.text-segment` elements into an array of `{ segment, originalIndex }` objects and **shuffle it with a Fisher–Yates shuffle** (random per page load). This shuffled order drives the final text reveal.
- `isMobile = window.innerWidth <= 1000`; `headerIconSize = isMobile ? 30 : 60` (px — matches the placeholder CSS size).
- `currentIconSize = ` width of the first `.animated-icon` via `getBoundingClientRect()`.
- `exactScale = headerIconSize / currentIconSize` — the scale factor that makes a row icon exactly placeholder-sized.

### ScrollTrigger

One single ScrollTrigger, no timelines or tweens — **everything is set imperatively with `gsap.set` inside `onUpdate`**, mapped from `self.progress` (fully deterministic and reversible):

```
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+=${window.innerHeight * 8}px`,   // pinned for 8 viewport heights
  pin: true,
  pinSpacing: true,
  scrub: 1,
  onUpdate: (self) => { ... }
});
```

At the top of every `onUpdate`, first `gsap.set` every `.text-segment` to `opacity: 0` (they are re-revealed only in phase 4). Then branch on `progress`:

### Phase 1 — icons rise (progress 0 → 0.3)

- `moveProgress = progress / 0.3`.
- Header fade: for `progress <= 0.15`, `headerProgress = progress / 0.15`; set `.hero-header` to `transform: translate(-50%, calc(-50% + ${-50 * headerProgress}px))` and `opacity: 1 - headerProgress` (fades up 50px and out during the first half of the phase). For `0.15 < progress <= 0.3`, hold it at `translate(-50%, calc(-50% + -50px))`, `opacity: 0`.
- If clone icons from a later phase exist (stored on `window.duplicateIcons`), remove them from the DOM and null the reference (this makes scrolling back up clean).
- Container: `gsap.set(".animated-icons", { x: 0, y: -window.innerHeight * 0.3 * moveProgress, scale: 1, opacity: 1 })` — the whole row travels upward by 30% of the viewport height across the phase.
- **Staggered catch-up per icon**: for each of the 5 `.animated-icon`s (index `i`):
  - `staggerDelay = i * 0.1`; the icon's active window is `[staggerDelay, staggerDelay + 0.5]` within `moveProgress`.
  - `iconProgress = gsap.utils.mapRange(iconStart, iconEnd, 0, 1, moveProgress)`, clamped to [0, 1].
  - Set the icon's individual `y` to `(-containerMoveY) * (1 - clampedProgress)` where `containerMoveY` is the container's current negative y. Effect: each icon starts offset downward exactly canceling the container's upward motion, then catches up in sequence — leftmost first — creating a wave.

### Phase 2 — gather to center + theme flip (progress 0.3 → 0.6)

- `scaleProgress = (progress - 0.3) / 0.3`.
- Keep the header held at `-50px`, `opacity: 0`.
- **Background flip**: when `scaleProgress >= 0.5` set `heroSection.style.backgroundColor = "#e3e3db"` (light), else `"#141414"` (dark). The CSS transition makes it a smooth 0.3s crossfade. This flip reveals the dark headline text color context for later.
- Remove `window.duplicateIcons` if present (same cleanup as phase 1).
- Move the container to the viewport center: measure the container's live `getBoundingClientRect()` center each update, compute `deltaX/deltaY` to the viewport center (`innerWidth/2`, `innerHeight/2`), multiply by `scaleProgress`, and set `{ x: deltaX, y: -window.innerHeight * 0.3 + deltaY, scale: 1 + (exactScale - 1) * scaleProgress, opacity: 1 }`. So the row shrinks from full width down to placeholder icon size while drifting to the exact center.
- Reset each individual icon to `{ x: 0, y: 0 }`.

### Phase 3 — clones fly into the headline (progress 0.6 → 0.75)

- `moveProgress = (progress - 0.6) / 0.15`.
- Header stays hidden; background stays light (`#e3e3db`).
- Park the real container at the exact viewport center (full deltas, `scale: exactScale`) but with `opacity: 0` — it is hidden and replaced by clones.
- **Create clones once** (guard with a `window.duplicateIcons` null-check): for each `.animated-icon`, `cloneNode(true)`, class `duplicate-icon`, `position: absolute`, width/height `headerIconSize`px, appended to `document.body`; store them in `window.duplicateIcons`.
- Each of the 5 clones flies from its source icon's current center (from `getBoundingClientRect()` + `window.pageXOffset/pageYOffset`, i.e. page coordinates) to the center of the matching `.placeholder-icon` (same index, also in page coordinates). The path is an **L-shape driven by `moveProgress`**:
  - First half (`moveProgress <= 0.5`): move **vertically only** — `currentY = moveY * (moveProgress / 0.5)`, `currentX = 0`.
  - Second half: vertical done (`currentY = moveY`), move **horizontally** — `currentX = moveX * ((moveProgress - 0.5) / 0.5)`.
  - Position each clone with `style.left/top = final page coords - headerIconSize / 2` (centered), `opacity: 1`, `display: flex`.

### Phase 4 — text reveal (progress 0.75 → 1)

- Header held at `translate(-50%, calc(-50% + -100px))`, `opacity: 0`; background light; real icon container `opacity: 0`.
- Snap every clone exactly onto its placeholder's center (recomputed each update so it tracks layout).
- **Shuffled per-segment fade-in**: iterate the shuffled array; for shuffled position `r`, the segment's window is `segmentStart = 0.75 + r * 0.03`, `segmentEnd = segmentStart + 0.015`. Map global `progress` through `gsap.utils.mapRange(segmentStart, segmentEnd, 0, 1, progress)`, clamp to [0, 1], and set it as the segment's `opacity`. Result: the six headline fragments pop in quickly (each over 1.5% of scroll), one after another, in random order, finishing around progress 0.9.

## Assets / images

Five square (1:1) app-style icons on colored tiles, used in order in the bottom row:

1. Green rounded-square tile with a black interlocking pinwheel / eight-point star mark.
2. Yellow circular badge with a black abstract triangular "A" mark made of two angled strokes over a bar.
3. Blue rounded-square tile with a black yin-yang-style droplet spiral inside a thin ring.
4. Orange circular badge with four black rounded squares arranged in a diamond/plus layout.
5. Periwinkle rounded-square tile with a black rounded frame containing a 2×2 grid of circles.

Any set of five colorful, flat, app-icon-style square images works — they just need to read clearly at both large (row) and small (60px inline) sizes.

## Behavior notes

- The whole effect is scrub-driven state (`gsap.set` from `progress`), so scrolling backwards fully reverses it; the clone cleanup in phases 1–2 guarantees no orphaned duplicates when scrubbing back.
- The random segment order is shuffled once per page load, so each visit reveals the headline words in a different order.
- Mobile (≤1000px) uses 30px placeholders/clones instead of 60px and the adjusted typography above; everything else is identical.
- The outro section provides the scroll runway exit after the pin ends.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/nvg8-scroll-animation-2/icon_1.png
https://motionprompts.dev/c/nvg8-scroll-animation-2/icon_2.png
https://motionprompts.dev/c/nvg8-scroll-animation-2/icon_3.png
https://motionprompts.dev/c/nvg8-scroll-animation-2/icon_4.png
https://motionprompts.dev/c/nvg8-scroll-animation-2/icon_5.png
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, reaches into the page with six separate `document.querySelector`/`querySelectorAll` calls, and drives every visible outcome — the five `.animated-icon` positions, the `.hero-header` fade, the `heroSection` background flip, the six `.text-segment` opacities, and a set of cloned icon nodes it appends straight to `document.body` — from a single `onUpdate` on one pinned `ScrollTrigger`. React withdraws the free run of the document, the guarantee that setup happens exactly once, and the license to never tear anything down, and it does it quietly: the hero pins and scrubs correctly the first time, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component keeps more state outside both React's and GSAP's own bookkeeping than most: `window.duplicateIcons`, a plain global, holding five DOM nodes it clones and appends to `document.body` — a location neither this component's own subtree nor a `gsap.context` scoped to it has any reach into. A double mount that doesn't undo all of it leaves two `Lenis` instances fighting over the same wheel event, two pinned `ScrollTrigger`s scrubbing the same `.hero` in disagreement, and a second batch of clones piling up in `document.body` next to the first. None of it shows up in a production build — React only double-invokes effects in development — so treat the cleanup below as load-bearing, not optional.

*(1) The entry point* — the whole effect is wrapped in `document.addEventListener("DOMContentLoaded", ...)`. By the time a React component mounts, that event has already fired, so the listener is registered and never called: no `Lenis` instance, no `ScrollTrigger`, nothing on screen, and no error pointing at why. Delete the listener and move its entire body — plugin registration, the Lenis wiring, the Fisher–Yates shuffle, the one-time size measurements, and the `ScrollTrigger.create` call — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can move to module scope instead of re-running inside the effect on every mount.

*(2) Element lookups* — `.hero`, `.hero-header`, `.animated-icons`, the five `.animated-icon`s, the six `.text-segment`s and the five `.placeholder-icon`s are all found with unscoped selectors, and the `ScrollTrigger` itself is told to trigger off the string `".hero"` rather than an element. Put a root ref on the section wrapping `.hero` and `.outro`, scope every lookup to it, and pass the resolved `.hero` element as the `trigger` option instead of the class string. During the StrictMode remount two copies of this markup exist for an instant; an unscoped selector or a string trigger can resolve against the copy on its way out, and the running `onUpdate` then spends the rest of the scroll writing `transform`, `opacity`, and the cloned icons' inline `left`/`top` to detached nodes.

*(3) Cleanup* — wrap the Lenis setup and the `ScrollTrigger.create` call in a `gsap.context` scoped to the root ref, and revert it in the returned cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis setup, the shuffle, the size measurements, ScrollTrigger.create
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` only undoes what runs during that synchronous factory call. The `ScrollTrigger.create({...})` call itself is inside it, so reverting kills the trigger, un-pins `.hero`, and removes the pin spacer it inserted. **Everything the trigger's `onUpdate` does is not covered**, because `onUpdate` fires later, on scroll, from outside the window the context is tracking: every `gsap.set` on `.animated-icons`, the five icons and the six text segments, the raw `heroSection.style.backgroundColor` write, and the `cloneNode`/`appendChild(document.body)` calls that build the `.duplicate-icon` elements all happen there. For targets inside this component's own subtree that stops mattering once the component unmounts — the nodes and whatever inline styles `onUpdate` last wrote to them go with it. The five `.duplicate-icon` clones do not get that free pass: they were appended to `document.body`, outside anything React or this `gsap.context` owns, so unmounting the component removes neither them nor the closure still holding `window.duplicateIcons`. Track them in a ref instead of on `window`, and remove them by hand in the same cleanup:

```jsx
return () => {
  cloneIconsRef.current?.forEach((node) => node.remove());
  cloneIconsRef.current = null;
  ctx.revert();
};
```

Moving `window.duplicateIcons` to `cloneIconsRef` is not just tidiness: a `window` global survives the component it came from, so a StrictMode remount — or a second copy of this section on the same page — can see clones a previous mount already built and either skip creating its own or try to animate nodes it never appended.

*(4) Lenis* — this effect owns its `Lenis` instance and drives it from `gsap.ticker.add((time) => lenis.raf(time * 1000))`, with `lenis.on("scroll", ScrollTrigger.update)` keeping the trigger in sync with it. The ticker subscription is the one piece `ctx.revert()` cannot see — a ticker callback is neither a tween nor a trigger, so the context never records it, and this is the case where that gap matters most, since it is the thing pumping Lenis's own frame loop. Keep the function reference and tear the three pieces down in order — ticker, then instance, then context:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
// cleanup:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

Reverse that order and a ticker frame landing between destroying `lenis` and removing `onTick` calls `.raf()` on an instance that no longer exists. Since the note above already flags that a page may only run one `Lenis`, decide up front which case this is: if this hero owns scroll for the whole document, construct and destroy the instance here as shown; if it is one section of a larger app, lift `new Lenis()` to the app shell and have this effect only add its `lenis.on("scroll", ScrollTrigger.update)` subscription to the shared instance — removing that subscription, not the shared instance, on cleanup.
