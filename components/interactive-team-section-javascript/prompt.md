# Interactive Team Section — hover thumbnails reveal giant staggered names

## Goal

Build a full-viewport "meet the team" section: a centered row of 9 small square portrait thumbnails sits above a giant clip-masked headline area. Hovering a thumbnail smoothly enlarges it (70px → 140px) while that member's name slides up into view as huge red condensed type, animated character-by-character with a center-out SplitText stagger. When the cursor enters the row at all, a default title ("The Squad") animates in the same way in an off-white color; leaving the row hides it again.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `SplitText` (`import { SplitText } from "gsap/SplitText"`, then `gsap.registerPlugin(SplitText)`). No other libraries, no smooth-scroll.

## Layout / HTML

```
<section class="team">
  <div class="profile-images">
    <div class="img"><img src="..." alt="" /></div>   <!-- x9 -->
  </div>
  <div class="profile-names">
    <div class="name default"><h1>The Squad</h1></div>
    <div class="name"><h1>Colin</h1></div>
    <div class="name"><h1>Liam</h1></div>
    <div class="name"><h1>Tabitha</h1></div>
    <div class="name"><h1>Tyson</h1></div>
    <div class="name"><h1>Max</h1></div>
    <div class="name"><h1>Everest</h1></div>
    <div class="name"><h1>Simon</h1></div>
    <div class="name"><h1>Gideon</h1></div>
    <div class="name"><h1>Benton</h1></div>
  </div>
</section>
```

- Exactly 9 `.img` thumbnails and 10 `.name` blocks: the first one has the extra class `default` and holds the group title; the remaining 9 map 1:1 (in order) to the 9 thumbnails.
- Load the JS with `<script type="module" src="./script.js">`.

## Styling

- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`. All `img` elements: `width: 100%; height: 100%; object-fit: cover;`.
- Google Font: **Barlow Condensed** (import the full weight range; weight 900 is the one used).
- `.team`: `position: relative; width: 100vw; height: 100svh; background-color: #0f0f0f; color: #e3e3db;` flex column, `justify-content: center; align-items: center; gap: 2.5em; overflow: hidden;`.
- `.profile-images`: `width: max-content;` flex row, centered items.
- `.img`: `position: relative; width: 70px; height: 70px; padding: 5px; cursor: pointer; will-change: width, height;` — the padding creates the gutter between thumbnails, so animating width/height grows the tile in place. Inner `img { border-radius: 0.5rem; }`.
- `.profile-names`: `width: 100%; height: 15rem; overflow: hidden;` plus `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` (a full-rect clip that hard-masks the sliding text).
- `.name h1`: `position: absolute; width: 100%; text-align: center; text-transform: uppercase; font-family: "Barlow Condensed"; font-size: 15rem; font-weight: 900; letter-spacing: -0.2rem; line-height: 1; color: #f93535; user-select: none; transform: translateY(100%);` — every heading is absolutely stacked in the same spot and parked one full line **below** the mask.
- `.name.default h1`: overrides `color: #e3e3db;` and `transform: translateY(-100%);` — the default title is parked one full line **above** instead.
- `.name h1 .letter` (class added by JS to each SplitText char): `position: relative; transform: translateY(0%); will-change: transform;`.

### The reveal mechanism (critical)

Each `h1` keeps a **static** CSS translateY offset (+100% for member names, −100% for the default) and is never animated itself. GSAP only animates the **letters inside**. Because the letters are `position: relative` children, their y transform adds to the parent's: letters at `y: -100%` inside a `+100%` parent net out to 0 → the name is visible; letters at `y: 0%` leave it hidden below. For the default title it's mirrored: letters at `y: 100%` inside a `−100%` parent net to 0 → visible (this is the initial state, so "The Squad" shows on load); letters at `y: 0%` hide it above.

## GSAP effect (exhaustive)

Everything runs inside `DOMContentLoaded`. Triggers are pure **hover** (mouseenter/mouseleave); no ScrollTrigger, no timelines — independent `gsap.to` tweens.

1. **SplitText setup (all 10 headings):** `new SplitText(heading, { type: "chars" })` on every `.name h1`; add the class `letter` to every resulting char element (`split.chars.forEach(char => char.classList.add("letter"))`).
2. **Initial state:** `gsap.set` the default title's letters (`.name.default` → `.letter`) to `y: "100%"`. Combined with the parent's CSS `-100%` this makes "The Squad" visible on load.
3. **Desktop gate:** wrap all event wiring in `if (window.innerWidth >= 900)` — below 900px there are no listeners and no animation at all.
4. **Per-thumbnail hover (index i pairs with name i+1, skipping the default):**
   - `mouseenter` on `.img`:
     - Tween the `.img` wrapper: `width: 140, height: 140, duration: 0.5, ease: "power4.out"` (grows from 70×70 to 140×140, pushing siblings apart).
     - Tween that member's letters: `y: "-100%", duration: 0.75, ease: "power4.out", stagger: { each: 0.025, from: "center" }` → the name rises into the mask, characters unfolding from the middle outward.
   - `mouseleave` on `.img`:
     - Tween the wrapper back: `width: 70, height: 70, duration: 0.5, ease: "power4.out"`.
     - Tween the letters back: `y: "0%", duration: 0.75, ease: "power4.out", stagger: { each: 0.025, from: "center" }` → the name sinks back below the mask.
5. **Row-level hover (default title):**
   - `mouseenter` on `.profile-images` container: tween the default letters to `y: "0%", duration: 0.75, ease: "power4.out", stagger: { each: 0.025, from: "center" }` → "The Squad" slides **up and out** of view (so a member name can take the stage).
   - `mouseleave` on the container: tween them back to `y: "100%"` with the same duration/ease/stagger → "The Squad" drops back into view.
   - Note these container events fire alongside the per-thumbnail ones (entering a thumbnail also means entering the container), which is exactly what produces the crossfade-like swap: default title exits upward while the hovered name enters from below.

## Assets / images

9 square (1:1) editorial studio portraits — tight head-and-shoulders shots of different people against solid, saturated color-block backgrounds (warm reds, oranges, ochres, sage/olive greens, teal), consistent fashion-editorial lighting. One per thumbnail, in row order. Any cohesive square portrait set works; no logos or brand marks.

## Behavior notes

- **Desktop-only interaction:** below 900px viewport width no listeners are attached; the section renders statically with "The Squad" visible.
- Responsive layout at `max-width: 900px`: `.team` becomes `flex-direction: column-reverse` (names above the images), `.profile-images` wraps (`flex-wrap: wrap; max-width: 90%;`), `.img` shrinks to `60px × 60px` with `2.5px` padding, `.profile-names` height drops to `4rem`, and `h1` becomes `font-size: 4rem; letter-spacing: 0;`.
- No loops, no scroll hijacking; overlapping tweens on quick hover swaps are fine (GSAP's default overwrite behavior handles it).

## Images

This component ships with 9 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/interactive-team-section-javascript/img1.jpeg
https://motionprompts.dev/c/interactive-team-section-javascript/img2.jpeg
https://motionprompts.dev/c/interactive-team-section-javascript/img3.jpeg
https://motionprompts.dev/c/interactive-team-section-javascript/img4.jpeg
https://motionprompts.dev/c/interactive-team-section-javascript/img5.jpeg
https://motionprompts.dev/c/interactive-team-section-javascript/img6.jpeg
… 3 more under https://motionprompts.dev/c/interactive-team-section-javascript/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--muted`, `--accent`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and only bothers to structure its own teardown because this catalogue's own editor demands it — `mount(config)` returns a `destroy()` purely so a knob change can re-mount the section cleanly, not because a plain shipped page ever calls it. React needs exactly that same discipline, but it needs it to live in `useEffect`'s cleanup instead of a hand-rolled harness, and it needs it to run even when no editor is watching.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Run this component's setup twice against the same DOM without ever tearing it down, and the failure is concrete: `SplitText` splits the nine member headings and the default "The Squad" heading a second time, so the `.letter` class lands on an already-split wrapper instead of a bare character, and the `y` tweens in the hover/tap handlers now animate the wrong nodes — the reveal stalls, or only part of a name slides into view. It will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The bottom of the script checks `document.readyState` before subscribing `boot` to `DOMContentLoaded`; that guard exists so the module survives being evaluated after the DOM has already parsed, which in React is guaranteed unconditionally by `useEffect` running post-commit. Drop the guard, the listener, and the `window.MP && window.MP.register` branch above it entirely — that branch exists only so this catalogue's visual editor can re-invoke `mount` with a different `config` when a knob moves, and it has no equivalent in a shipped app. What survives is the body of `mount(config)` itself: the `SplitText` setup over the ten headings, the `gsap.set` that parks the default letters, the `window.innerWidth >= 900` branch and the listener wiring inside it. Put that body inside a `useEffect` with an empty dependency array, and turn `config` — currently `DEFAULTS`, i.e. the hover/base portrait sizes and the two letter-reveal timing knobs — into props or a values object read inside that same effect.

*(2) Element lookups* — `document.querySelector(".profile-images")`, the `.profile-images .img` and `.profile-names .name` queries, and the `.name h1` lookup that feeds `SplitText` all assume this component owns the whole document. Give the `<section className="team">` a root `ref` and rewrite every one of those as a scoped `rootRef.current.querySelectorAll(...)`. This isn't cosmetic here: during the StrictMode remount two copies of `.team` exist for an instant, and an unscoped `querySelectorAll` will split and wire whichever copy happens to be on its way out.

*(3) Cleanup* — Wrap the setup in a `gsap.context` scoped to the root ref and revert it in the cleanup. `gsap.registerPlugin(SplitText)` already sits at module scope in the current file; leave it there — it doesn't belong inside the effect, and re-registering on every mount is harmless but pointless.

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* SplitText over the ten headings, gsap.set on the default letters,
       then the innerWidth >= 900 branch and its listener wiring */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` cancels every hover- and tap-driven `gsap.to` this component starts, including whatever is mid-flight at the moment of a StrictMode unmount. It does **not** cover two things the vanilla `destroy()` already handles by hand, and the React cleanup still needs both, in the same order the original uses:

- **The native listeners.** `wire()` attaches `mouseenter`/`mouseleave` on each portrait and on the `.profile-images` container (desktop), or `click` on each portrait (the sub-900px branch), straight through `addEventListener` — `gsap.context` has no visibility into these, since it only tracks objects GSAP itself created. Keep the `offs` array of `removeEventListener` calls (or an equivalent) and run it inside the same cleanup function.
- **The `SplitText` instances.** All ten headings get split, the nine member names plus `.name.default`. Revert every entry from the `splits` array inside the same cleanup, and do it after the tweens on those letters have been killed — the vanilla `destroy()` calls `gsap.killTweensOf` on the touched portraits, name blocks and letters before it calls `split.revert()`, precisely because a tween still targeting a node that `split.revert()` has just removed will throw. Keep that ordering: kill/revert the tweens first, `ctx.revert()` and the split reverts after.

Two mechanics that already work correctly in the vanilla script and should not be "improved" in the port: the `window.innerWidth >= 900` check that decides between the desktop hover wiring and the touch tap-toggle wiring runs exactly once, at mount — it is not a resize listener, and adding one would change documented behavior, not fix a React problem. And the touch branch's `activeIndex`, which tracks which portrait is currently popped open, is closure state read only inside event handlers; it never drives a render, so it stays a plain variable declared inside the effect rather than becoming `useState`.

One font dependency worth carrying over deliberately: `SplitText` measures character boxes against whatever face is loaded at call time, and this component's headline face is Barlow Condensed at its heaviest weight. If your host app defers loading that weight, splitting on first effect run measures against the fallback font and the center-out stagger can shift once the real face swaps in. Guard against that by awaiting `document.fonts.ready` before the split if your font-loading strategy can't otherwise guarantee the weight is already in.
