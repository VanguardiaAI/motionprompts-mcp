# Full-screen Infinite Carousel with Clip-path Wipe Transitions

## Goal

Build a full-screen, infinitely looping image carousel driven by mouse wheel and touch swipes. Every scroll step spawns a brand-new slide and reveals it with a synchronized GSAP timeline: the full-bleed background image wipes in via an animated `clip-path` polygon (from the bottom when scrolling down, from the top when scrolling up) while the outgoing background zooms to 1.5x behind it; simultaneously a centered portrait thumbnail wipes in the opposite vertical direction with an inner-image parallax, and the title, description and slide counter slide out/in through clipped text masks. All tweens share one 1.25s duration and one custom cubic-bezier ease, so the whole transition feels like a single cinematic wipe.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `CustomEase` (`import { CustomEase } from "gsap/CustomEase"` and `gsap.registerPlugin(CustomEase)`). No other libraries — no Lenis, no ScrollTrigger. The page never actually scrolls; wheel/touch events are intercepted and hijacked.

## Layout / HTML

Body contains, in order:

1. `<nav>` — fixed overlay bar at the top:
   - `.logo` with a `<p>` wordmark (e.g. "Motionprompts").
   - `.nav-items` with four `<p>` links: "Work", "Studio", "News", "Contact".
2. `<footer>` — fixed overlay bar at the bottom:
   - a `<p>` reading "All Projects" on the left.
   - `.slider-counter` on the right containing three children in a row: `.count` (a `<div>` holding a `<p>1</p>` — this is the animated current-slide digit), a `<p>/</p>`, and a `<p>7</p>` (the static total).
3. `.slider` — the full-viewport stage. Initially contains:
   - one `.slide` > `.slide-bg-img` > `<img>` (full-bleed background, slide 1 image).
   - `.slide-main-img` > `.slide-main-img-wrapper` > `<img>` (the centered portrait thumbnail, same slide 1 image).
   - `.slide-copy` > `.slide-title` (with `<h1>Field Unit</h1>`) and `.slide-description` (with `<p>Concept Art</p>`).

The JS clones/creates new `.slide`, `.slide-main-img-wrapper`, `<h1>`, `<p>` and counter `<p>` nodes on every transition and removes the old ones when the timeline completes, so the DOM always ends up with exactly one of each.

Store slide data in two JS arrays (index 0 = slide 1):

- Titles: `"Field Unit", "Astral Convergence", "Eclipse Core", "Luminous", "Serenity", "Nebula Point", "Horizon"`.
- Descriptions: `"Concept Art", "Soundscape", "Experimental Film", "Editorial", "Music Video", "VFX", "Set Design"`.

Image paths follow the pattern `./img${n}.jpeg` with `n` from 1 to 7 (7 slides total, `totalSlides = 7`).

## Styling

- Global reset (`* { margin:0; padding:0; box-sizing:border-box }`). `html, body` are `width/height: 100%`, on `var(--bone)`.
- Palette and fonts (P4 Cobalt-Lime):
  ```css
  :root {
    --bone: #f0ede4;     /* the page, and all type over the photographs */
    --cobalt: #1141ff;
    --lime: #c6f21e;     /* the one highlight surface, black ink on top */
    --ink: 13, 13, 13;   /* #0d0d0d as an rgb triplet, for scrims */
    --display: "Space Grotesk", sans-serif;
    --text: "Inter", sans-serif;
    --mono: "Space Mono", monospace;
  }
  ```
  All UI text over the slides is `var(--bone)`.
- All `<img>`: `width/height: 100%; object-fit: cover; will-change: transform`.
- `nav` and `footer`: `position: fixed`, full `100vw` width, `padding: 3em`, `display: flex; justify-content: space-between; align-items: center; z-index: 2`. Their `<p>` text is `15px`, `font-weight: lighter`. `.nav-items` is a flex row with `gap: 2em`.
- `.slider-counter`: flex row; each `<p>` and the `.count` div are `24px` wide with centered content; the `/` and total `<p>`s are `opacity: 0.35` while the current digit is full opacity `16px`, `line-height: 1`.
- `.count`: `position: relative; height: 18px` with `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` — it acts as an 18px-tall mask for the vertically-sliding digit. Its `<p>` is absolutely positioned with `will-change: transform`.
- `.slider`: `position: relative; width: 100vw; height: 100vh; overflow: hidden`.
- `.slide`: absolutely positioned, inset 0, full size.
- `.slide-bg-img`: absolutely positioned full size, `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%)` (full rectangle), `will-change: clip-path`. Its `::after` is not a flat wash but a **directional scrim** — stacked `linear-gradient`s in `rgba(var(--ink), …)` that fall from `.62` on the left to transparent by 54%, so the copy block keeps contrast while the right half of the photograph stays clean.
- `.slide-main-img`: absolutely centered (`top: 50%; left: 50%; transform: translate(-50%,-50%)`), `width: 25%; height: 50%` of the viewport, `z-index: 2` — a portrait-ish window floating over the background.
- `.slide-main-img-wrapper`: absolute, full size of its parent, full-rectangle `clip-path` like above, `will-change: clip-path`.
- `.slide-copy`: absolutely positioned at `top: 50%; left: 30%; transform: translate(-50%,-50%)`, white, `z-index: 2` — so the text block sits left of the centered thumbnail.
- `.slide-title`: `position: relative; width: 500px; height: 50px; margin-bottom: 0.75em` with the full-rectangle `clip-path` (a 50px-tall text mask). Its `<h1>` is absolute, `48px`, `font-weight: 400`, `line-height: 1`, `will-change: transform`.
- `.slide-description`: same pattern but `height: 20px`; its `<p>` is absolute, `18px`, `font-weight: lighter`, `line-height: 1`.
- Media query `max-width: 900px`: `.slide-main-img` widens to `75%` and `.slide-copy` moves to `top: 60%; left: 60%`.

## GSAP effect (the important part — be exact)

**Ease and timing.** Every single tween uses `duration: 1.25` and `ease: CustomEase.create("", ".87,0,.13,1")` (a steep symmetric bezier — slow start, fast middle, slow settle). All tweens are placed at position `0` of one `gsap.timeline()`, so everything moves in perfect sync.

**State machine.** Track `currentSlide` (starts at 1), `isAnimating`, `scrollAllowed` (starts true) and `lastScrollTime`. A transition may only start if not animating, scrolling is allowed, and at least **1000ms** have passed since the last accepted scroll. Infinite wrap: scrolling down past slide 7 goes to 1; scrolling up past 1 goes to 7.

**Building the incoming elements (before the timeline runs).** For direction `"down"` (next slide) / `"up"` (previous):

1. New `.slide` > `.slide-bg-img` > `<img>` appended to `.slider`. Its `.slide-bg-img` starts fully collapsed via inline clip-path:
   - down: `polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)` (zero-height sliver at the **bottom** edge).
   - up: `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)` (zero-height sliver at the **top** edge).
2. New `.slide-main-img-wrapper` > `<img>` appended inside `.slide-main-img`. It starts collapsed the **opposite** way:
   - down: `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)` (collapsed at top).
   - up: `polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)` (collapsed at bottom).
   Its inner `<img>` is pre-offset with `gsap.set` to `y: "-50%"` (down) or `y: "50%"` (up) for a parallax reveal.
3. New `<h1>` (title), `<p>` (description) and counter `<p>` (the digit) appended into `.slide-title`, `.slide-description` and `.count` respectively, pre-offset with `gsap.set`:
   - title: `y: 50` (down) / `y: -50` (up).
   - description: `y: 20` / `y: -20`.
   - counter digit: `y: 18` / `y: -18`.
   (Each offset equals its clipped container's height, so the incoming text waits just outside the mask.)

**The timeline (all tweens at position 0, each 1.25s with the CustomEase above):**

1. New `.slide-bg-img` clip-path expands to a full rectangle:
   - down: to `polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)` (wipes upward from the bottom edge).
   - up: to `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (wipes downward from the top edge).
2. The **outgoing** slide's background `<img>` scales to `scale: 1.5` (cinematic push-in behind the wipe).
3. New `.slide-main-img-wrapper` clip-path expands to full:
   - down: to `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`.
   - up: to `polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)`.
4. Outgoing wrapper's `<img>` parallaxes out: `y: "50%"` (down) / `y: "-50%"` (up).
5. Incoming wrapper's `<img>` parallaxes to `y: "0%"`.
6. Outgoing `<h1>` to `y: -50` (down) / `y: 50` (up); incoming `<h1>` to `y: 0`.
7. Outgoing description `<p>` to `y: -20` / `y: 20`; incoming to `y: 0`.
8. Outgoing counter digit to `y: -18` / `y: 18`; incoming to `y: 0`.

So on scroll-down everything (text and thumbnail image) flows upward while the background wipe rises from the bottom; on scroll-up every direction is mirrored.

**Cleanup.** The timeline's `onComplete` removes the old `.slide`, old `.slide-main-img-wrapper`, old `<h1>`, old description `<p>` and old counter `<p>`, sets `isAnimating = false`, and after a `setTimeout` of **100ms** re-enables `scrollAllowed` and refreshes `lastScrollTime`.

**Input handling.**

- `wheel` listener on `window` with `{ passive: false }`, calling `e.preventDefault()`; `deltaY > 0` means "down". Route through a `handleScroll(direction)` guard that enforces the flags plus the 1000ms cooldown.
- Touch: on `touchstart` record `touches[0].clientY` and set a touch-active flag. On `touchmove` (`passive: false`, `preventDefault()`), once the vertical delta exceeds **10px**, clear the flag and trigger `handleScroll` — positive delta (finger moved up) = "down". `touchend` clears the flag.

## Assets / images

7 photographs, one per slide, each used **twice** in a slide (full-bleed background AND the centered thumbnail — always the same image for both). They read as a moody, cinematic portfolio set (landscape orientation works; they are cropped with `object-fit: cover`):

1. Two figures in white clothing walking away down a softly lit cream-toned corridor tunnel.
2. A crescent-moon-shaped sculpture with a small lizard resting on it against a warm textured wall.
3. A large translucent draped plastic sheet billowing on a frame in a desert at golden sunset.
4. A 3D-render portrait of a red-haired freckled woman in an ornate white hood encrusted with crystals.
5. A lone faceless figure in white walking through a vast curved concrete tunnel, soft cinematic light.
6. An abstract macro of an organic white-and-black porous surface with rounded cavities.
7. A person in a red robe standing before enormous red drapes hung between sandstone desert cliffs.

## Behavior notes

- The carousel is infinite in both directions (wraps 7 → 1 and 1 → 7).
- The page itself never scrolls; wheel and touchmove are fully prevented.
- Rapid scrolling is throttled: one transition per ~1s minimum (1000ms cooldown + 100ms post-animation delay), and re-entry is blocked while a timeline is running.
- Works on touch devices (swipe up = next, swipe down = previous) and adapts below 900px viewport width (larger thumbnail, repositioned copy).
- Wrap all setup in a `DOMContentLoaded` listener.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/exo-ape-infinite-carousel/img1.jpeg
https://motionprompts.dev/c/exo-ape-infinite-carousel/img2.jpeg
https://motionprompts.dev/c/exo-ape-infinite-carousel/img3.jpeg
https://motionprompts.dev/c/exo-ape-infinite-carousel/img4.jpeg
https://motionprompts.dev/c/exo-ape-infinite-carousel/img5.jpeg
https://motionprompts.dev/c/exo-ape-infinite-carousel/img6.jpeg
… 1 more under https://motionprompts.dev/c/exo-ape-infinite-carousel/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bone`, `--cobalt`, `--lime`, `--ink`, plus the type variables `--display`, `--text`, `--mono`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: a `DOMContentLoaded` listener that owns the whole page, clones a brand-new `.slide`, `.slide-main-img-wrapper`, `<h1>`, description `<p>` and counter `<p>` into the DOM on every wheel tick or swipe, wires four `window`-level listeners to a set of closured flags (`isAnimating`, `scrollAllowed`, `lastScrollTime`, `currentSlide`), and removes the outgoing nodes itself once the timeline finishes. React withdraws the assumption that this is the only script that will ever touch that DOM, and the failure mode here is not a crash on load — the first slide renders fine, the first transition even looks right, and only later does a second wheel event, or a route revisit, produce two overlapping wipes on the same background image, or a `removeChild` call that throws because the node it expected to still be there is already gone.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. For this component that means two `wheel` listeners on `window` and two independent 1000ms cooldown clocks racing from the very first scroll: the first mount's handler and the second mount's handler both see `scrollAllowed` still true, both call into `animateSlide`, and two new `.slide` elements clip in over each other on the same tick. Treat the cleanup as part of the effect, not an afterthought — it has to remove every listener it added and be able to kill a timeline still in flight, or the surviving copy from the aborted mount keeps intercepting scroll input the visible carousel never asked for.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the carousel never wires up — no error, nothing to debug, just a static first slide that never responds to a wheel or a swipe. Delete the listener and move its body — the four state variables, the three `create*` helpers, `animateSlide`, `handleScroll`, and the four `addEventListener` calls — into a `useEffect` with an empty dependency array. `gsap.registerPlugin(CustomEase)` already sits above the listener, at true module scope; leave it exactly there, outside the component and outside the effect.

*(2) Element lookups* — This script doesn't look elements up once at setup; `animateSlide` re-runs all seven `document.querySelector` calls (`.slider`, the current `.slide`, `.slide-main-img`, its `.slide-main-img-wrapper`, `.slide-title`, `.slide-description`, `.count`) on every single scroll, for as long as the carousel stays mounted. Give the element that carries `.slider` (or a wrapper around the whole nav/slider/footer group) a root `ref`, and scope every one of those seven lookups to it — `root.querySelector(".slide-main-img")` instead of `document.querySelector(...)`. This matters more here than usual: because the lookups happen fresh on every scroll rather than once at mount, a lookup made during the instant the outgoing and incoming StrictMode subtrees briefly coexist can latch onto the copy that's on its way out, and every transition after that races against a detached node.

*(3) Cleanup* — Wrap the setup in a `gsap.context` scoped to the root ref. The part that needs care is `animateSlide` itself: it isn't called once during setup, it's called later, from the `wheel` and `touchmove` handlers, once per scroll for the life of the component — exactly the case plain synchronous auto-tracking by `gsap.context` doesn't cover. Register it through the context's name-plus-function form so every timeline it builds gets attributed to the context no matter when the call happens, and invoke it through the context rather than calling the closure directly:

```jsx
useEffect(() => {
  const root = rootRef.current;
  let lastScrollTime = 0;

  const ctx = gsap.context((self) => {
    let isAnimating = false;
    let scrollAllowed = true;

    self.add("animateSlide", (direction) => {
      if (isAnimating || !scrollAllowed) return;
      isAnimating = true;
      scrollAllowed = false;
      // build the new slide, wrapper and text nodes scoped to `root`,
      // gsap.set their starting offsets, then build and play the
      // gsap.timeline() with the shared clip-path wipe, background
      // scale and text/thumbnail parallax tweens, exactly as above
    });

    function handleScroll(direction) {
      const now = Date.now();
      if (now - lastScrollTime < 1000) return;
      lastScrollTime = now;
      ctx.animateSlide(direction);
    }

    const onWheel = (e) => {
      e.preventDefault();
      handleScroll(e.deltaY > 0 ? "down" : "up");
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    // onTouchStart / onTouchMove / onTouchEnd follow the same pattern —
    // name each one so it can be removed below
  }, rootRef);

  return () => ctx.revert();
}, []);
```

Without the name-plus-function wrapper, every timeline `animateSlide` builds is invisible to `ctx.revert()` — an unmount that lands mid-wipe leaves that timeline running against nodes React may since have discarded, and a StrictMode remount that fires a scroll before the first mount's cleanup runs can leave two timelines clipping the same `.slide-bg-img` at once.

The four `window` listeners (`wheel`, `touchstart`, `touchmove`, `touchend`) are plain DOM subscriptions, not GSAP objects — `ctx.revert()` does nothing for them. Give each one a name, the way `onWheel` is named above, and remove all four with matching `removeEventListener` calls in the same cleanup that calls `ctx.revert()`. The script above passes anonymous arrows to all four `addEventListener` calls, which is exactly the shape that can't be removed later.

Finally, this component's own DOM management has to stay in charge after the port, not get replaced by React state. `createSlide`, `createMainImageWrapper` and `createTextElements` append raw nodes next to the existing ones, and the timeline's `onComplete` removes the old ones directly — the DOM under `.slider`, `.slide-main-img`, `.slide-title`, `.slide-description` and `.count` briefly holds two children mid-transition and is never a pure function of `currentSlide`. Render the initial slide once in JSX, exactly as the static markup already describes it, and leave those five containers alone after that: don't drive their children from React state or re-render into them on scroll. If `currentSlide` becomes state and an index change makes React reconcile that subtree, it will fight the effect over nodes it already appended or already removed — the concrete failure is a `removeChild` on a node one side has already detached.
