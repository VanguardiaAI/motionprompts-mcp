---
slug: savoirfaire-lp
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 2
structural_literals: 5
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "4", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Savoir-Faire Click Reveal — click-to-spawn floating media cards + sparkle cursor

## Goal

Build a full-screen, black editorial landing page for a creative studio. A big uppercase serif wordmark sits at the bottom, a fixed nav sits at the top, and a custom **white circular cursor with a black sparkle glyph** trails the mouse. The star effect: **every click anywhere on the page spawns a random media card** (50/50 an image or an autoplaying video) at the pointer — it pops in from `scale: 0` with a slight random tilt, then **drifts 500px straight up over 4s while holding full opacity**, and finally **fades out and removes itself**. A short click sound plays on each spawn. Cards pile up as the user keeps clicking.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) only — **no GSAP plugins**, no ScrollTrigger, no smooth-scroll library. Single import:

```js
import gsap from "gsap";
```

Everything is mouse-driven (mousemove + click); there is no scroll behavior (the page is `overflow: hidden`, exactly one viewport tall).

## Layout / HTML

```
<body>
  <div class="items-container"></div>          <!-- empty; spawned media cards are appended here -->

  <div class="cursor">                         <!-- custom cursor, follows the mouse -->
    <img src="/c/savoirfaire-lp/cursor.png" alt="" />
  </div>

  <div class="wrapper">
    <nav>
      <div class="nav-item">
        <p>Knowing by Building <br /> ATELIER OKO</p>
      </div>
      <div class="nav-item">
        <p>Digital &amp; Brand Design <br /> Photography &amp; Film Production</p>
        <p>Founded in 2020 <br /> Brooklyn, NY</p>
      </div>
    </nav>
    <div class="header">
      <h1>ATELIER OKO</h1>
    </div>
  </div>

  <script type="module" src="./script.js"></script>
</body>
```

Use a short invented studio name (e.g. **ATELIER OKO**) for the `<h1>` wordmark and the nav copy — no real brand names. The nav copy is neutral studio boilerplate (discipline lines + "Founded in … / City").

## Styling

Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.

- `body`: `width: 100vw; height: 100vh; overflow: hidden; background: #000;` font-family a modern grotesque sans (e.g. `"PP Neue Montreal", "Helvetica Neue", Arial, sans-serif`).
- `.wrapper`: `position: relative; width: 100%; height: 100%; z-index: -1;` — the nav + title layer sits **behind** the spawned cards (which live in `.items-container` at the default stacking level, so cards always render on top of the text).
- `nav`: `position: fixed; top: 0; width: 100vw; display: flex; padding: 2em;`.
  - `.nav-item:nth-child(1) { flex: 3; }`
  - `.nav-item:nth-child(2) { flex: 2; display: flex; }` and its `p { flex: 1; }` (two columns of small copy).
- `p`: `font-weight: 500; color: #fff; opacity: 0.5; letter-spacing: 0;` (dim white).
- `.header`: `position: absolute; bottom: 0; width: 100%;`.
- `.header h1`: `text-transform: uppercase; font-family: "PP Editorial Old", "Times New Roman", serif; font-size: 14vw; font-weight: 300; color: #fff; text-align: center; line-height: 100%;` — a giant, thin, light editorial serif spanning the bottom.
- Global media rule: `video, img { width: 100%; height: 100%; object-fit: cover; }`.
- **Media card containers** — `.video-container, .img-container { position: absolute; width: 700px; height: 500px; transform: translateY(-50%); pointer-events: none; }`. The `700×500` box (7:5 landscape) is centered on the click point (JS sets `left`/`top`, and `translateY(-50%)` re-centers vertically). `pointer-events: none` so cards never block subsequent clicks. **Keep the `translateY(-50%)`** — GSAP preserves it as `yPercent: -50` and animates `y` (px) on top of it.
- `.cursor`: `position: absolute; width: 150px; height: 150px; background: #fff; border-radius: 100%; display: flex; justify-content: center; align-items: center; font-size: 50px; z-index: -1;` — a white circle; the `cursor.png` sparkle fills it (via the global `img` 100% rule). It also sits at `z-index: -1`, so a spawned card passing over it will cover it.

## GSAP effect (exhaustive)

### 1. Cursor follow (document `mousemove`)

On every `mousemove`, tween the `.cursor` element toward the pointer, offset so the circle is centered on the cursor:

```js
document.addEventListener("mousemove", (e) => {
  gsap.to(cursor, {
    x: e.clientX - cursor.offsetWidth / 2,   // -75px offset (half of 150)
    y: e.clientY - cursor.offsetHeight / 2,
    duration: 0.5,
    ease: "power2.out",
  });
});
```

This is a lagging follow — the 0.5s `power2.out` tween makes the circle glide/trail behind the real pointer. (Before the first mousemove the cursor rests at the top-left corner, `x/y = 0`.)

### 2. Click → spawn a media card (document `click`)

On every `click` anywhere:

1. **Play the click SFX**: `new Audio("/c/savoirfaire-lp/click-sfx.mp3").play();` (a fresh `Audio` each click, so overlapping clicks stack the sound).
2. **Pick the type**: `const itemType = Math.random() < 0.5 ? "video" : "image";` (50/50).
3. **Build the element** into a throwaway wrapper div's `innerHTML`, then grab `container.firstChild`:
   - Video: `videoNumber = Math.floor(Math.random() * 7) + 1` (1–7) → `<div class="video-container"><video autoplay loop><source src="/c/savoirfaire-lp/vid-${n}.mp4" type="video/mp4"/></video></div>`.
   - Image: `imgNumber = Math.floor(Math.random() * 6) + 1` (1–6) → `<div class="img-container"><img src="/c/savoirfaire-lp/img-${n}.jpg" alt=""/></div>`.
4. **Append** the element to `.items-container`.
5. **Position it at the pointer** via inline style: `left = (event.clientX - 700/2) + "px"` (elementWidth = 700), `top = event.clientY + "px"`.
6. **Random tilt**: `randomRotation = Math.random() * 10 - 5` → a value in **[-5°, +5°]**.
7. **Seed the transform** instantly:

```js
gsap.set(appendedElement, {
  scale: 0,
  rotation: randomRotation,
  transformOrigin: "center",
});
```

8. **Run the lifetime timeline** (`const tl = gsap.timeline();`), with `randomScale = Math.random() * 0.5 + 0.5` → a final scale in **[0.5, 1.0]**:

```js
// A — pop in
tl.to(appendedElement, {
  scale: randomScale,
  duration: 0.5,
  delay: 0.1,
});

// B — drift up + hold visible (starts together with A, position "<")
tl.to(appendedElement, {
  y: () => `-=500`,        // move 500px UP (function value)
  opacity: 1,             // element is already opaque -> effectively a 4s "hold"
  duration: 4,
  ease: "{{motion.ease.primary}}",           // linear drift
}, "<")

// C — fade out, then self-destruct (starts 0.5s before the timeline's current end)
.to(appendedElement, {
  opacity: 0,
  duration: 1,
  onComplete: () => {
    appendedElement.parentNode.removeChild(appendedElement);
    // (also splice it out of an itemsArray bookkeeping list if you keep one)
  },
}, "-=0.5");
```

**Timeline semantics — reproduce exactly:**
- **Tween A** (pop): `scale 0 → randomScale` over **0.5s** with a **0.1s delay**, default ease (`power1.out`). The card also carries its static `rotation` and `transformOrigin: center` from the `gsap.set`.
- **Tween B** (drift): inserted at position **`"<"`** so it begins at the **same time as tween A**. It animates `y` by **`-=500`** (relative, 500px upward) over **4s** with **`ease: "{{motion.ease.primary}}"`** (constant-velocity float). `opacity: 1` is a no-op hold because the element starts fully opaque (opacity was never zeroed) — its role is just to keep the card visible for the full 4s.
- **Tween C** (fade + remove): inserted at position **`"-=0.5"`**, i.e. it starts **0.5s before the end of the timeline built so far** (the end of the 4s drift). It fades `opacity 1 → 0` over **1s** and on complete **removes the node from the DOM**. So the fade begins while the card is still drifting and finishes ~0.5s after the drift stops. Net card lifetime ≈ **4.6s**.

Every click spawns an independent element + timeline, so many cards float and fade concurrently. Nothing is pooled — each card is created on click and deleted on its own `onComplete`.

## Assets / images

- **6 editorial photographs** `img-1.jpg … img-6.jpg` — moody, high-end fashion/beauty/still-life imagery (studio portraits, close-up beauty shots, luxury product shots). Displayed in a **700×500 (7:5 landscape)** box, `object-fit: cover`, so any roughly landscape editorial photo works. Coherent dark/cinematic palette. No logos or brand marks.
- **7 short video loops** `vid-1.mp4 … vid-7.mp4` — silent, muted-safe editorial/fashion film clips, same 7:5 landscape crop, played `autoplay loop`. Any short cinematic b-roll works.
- **1 cursor glyph** `cursor.png` — a small **black four-pointed sparkle/star** on a **transparent** background, centered so it reads well filling the 150px white circle.
- **1 click SFX** `click-sfx.mp3` — a short, soft UI click/pop, played once per click.

## Behavior notes

- **Desktop / mouse-driven only** — no touch fallback, no scroll, no `ScrollTrigger`, no reduced-motion handling in the original. The page never scrolls (`overflow: hidden`, single viewport).
- Cards are `pointer-events: none`, so they never intercept clicks — you can keep spawning through an existing pile.
- The randomised type (image vs video), source number, tilt (±5°), and final scale (0.5–1.0) mean no two spawns look identical.
- For reliable autoplay across browsers you may add `muted playsinline` to the spawned `<video>` (the source uses `autoplay loop`; the clips carry no important audio).
- The custom cursor and the nav/title layer both live at `z-index: -1`; the spawned `.items-container` cards render above them at the default stacking level.

## Images

This component ships with 14 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/savoirfaire-lp/cursor.png
https://motionprompts.dev/c/savoirfaire-lp/img-1.jpg
https://motionprompts.dev/c/savoirfaire-lp/img-2.jpg
https://motionprompts.dev/c/savoirfaire-lp/img-3.jpg
https://motionprompts.dev/c/savoirfaire-lp/img-4.jpg
https://motionprompts.dev/c/savoirfaire-lp/img-5.jpg
… 8 more under https://motionprompts.dev/c/savoirfaire-lp/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--bone`, `--muted`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script runs at the top level, the moment the module is evaluated: the `itemsArray` declaration, the `cursor` lookup, and the two `document.addEventListener` calls for `mousemove` and `click` all execute at import time, before your component has rendered the `.cursor` circle or the empty `.items-container` those clicks spawn cards into. Move all of it into a `useEffect` with an empty dependency array. Do not leave it in the component body: that re-runs on every render, and because both listeners bind to `document` rather than anything this component renders, a leftover copy from a missing cleanup does not just double a visual effect — it means every future click on the page, anywhere, spawns one media card per copy still attached (see Cleanup, below).

*(2) Element lookups* — `cursor` is captured once with `document.querySelector(".cursor")` and reused for the component's whole life; `.items-container` is looked up fresh with its own `document.querySelector` call inside the click handler, once per click. Put a ref directly on each instead: `cursorRef` on the `.cursor` div and `itemsRef` on `.items-container`. The click handler then appends into `itemsRef.current` instead of re-querying the document on every single click, and the mousemove handler reads `cursorRef.current` instead of a variable captured once at import time.

*(3) Cleanup* — Both listeners are deliberately global, not scoped to this component's markup: the cursor has to follow the pointer anywhere in the viewport, and a click anywhere on the page has to spawn a card. Leave both bound to `document`. That choice is exactly why the cleanup matters more than usual here — an orphaned `document` listener is invisible in the React tree, so removing this component's own JSX on unmount does nothing to it. Wrap the wiring in a `gsap.context`, and have the factory return its own teardown so `ctx.revert()` calls it alongside anything GSAP tracked:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    const onMouseMove = (e) => {
      const cursor = cursorRef.current;
      gsap.to(cursor, {
        x: e.clientX - cursor.offsetWidth / 2,
        y: e.clientY - cursor.offsetHeight / 2,
      });
    };

    const onClick = (event) => {
      self.add(() => {
        /* build the video/img element exactly as above, append it to itemsRef.current,
           gsap.set its initial scale + rotation, then run the pop-in / drift / fade timeline */
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("click", onClick);
    };
  }, rootRef);

  return () => ctx.revert();
}, []);
```

The pop-in/drift/fade timeline is the one animation here that is never created while the factory runs — it is built later, once per click, from a listener the factory only attaches. `onClick` closes over `self` safely because it is defined inside the same factory call that received `self` as its argument; there is no re-entry into `gsap.context` and none of the temporal-dead-zone hazard that rules out naming `ctx` there. But a tween built inside that listener is not automatically part of the context just because the listener itself was registered from inside the factory — it has to be attributed at the moment it is actually created, with the immediate-invoke form of `self.add`, exactly as shown. Skip that, and `ctx.revert()` has nothing on record to kill: a card that was mid-drift when the route changed keeps drifting and fading for the rest of its cycle, writing styles onto a node the user can no longer see — `.items-container` is still its `parentNode`, just no longer attached to the visible document, so the `removeChild` call in its `onComplete` still succeeds without error. Nothing crashes, but it is exactly the kind of untracked, still-running resource `gsap.context` exists to prevent, and it keeps a full spawn cycle's worth of GSAP work alive for several seconds after nobody can see it.

Do not give `onMouseMove` the same wrapping. It fires on every pointer move, not once per user action, and `self.add` has no way to retire an entry once the tween it created finishes — each call is one more permanent record for `ctx.revert()` to walk later, for as long as the component stays mounted. Wrapping a handler that fires dozens of times a second turns a single page visit into an unbounded list, for a failure mode that, left unwrapped, is trivial by comparison: one stray tween writing to a cursor node that is a fraction of a second from being garbage-collected anyway. Reserve `self.add` for `onClick`, where calls are rate-limited by the user and the thing each one creates stays alive and visible for the rest of its multi-second lifecycle — long enough to be worth tracking.
