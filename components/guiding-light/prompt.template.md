---
slug: guiding-light
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Guiding Light — Cursor Spotlight with Trailing Flame

## Goal

Build a three-section scrolling page. The middle section is the star: a **cursor-driven spotlight**. When the pointer enters that section a **dark veil drops over the whole section**, punched through by a soft circular hole that follows the cursor — so content (heading + paragraph) is dimmed everywhere except a moving "flashlight" window around the pointer. Inside that section a small **animated flame (Lottie) with a pulsing warm glow trails the cursor with a smooth lag**, drifting from its home position toward wherever you point and easing back to center when the pointer leaves the section. Both the spotlight hole and the flame move with lerped smoothing, not snapping. The other two sections (before/after) are plain full-screen headings you scroll past with Lenis smooth scroll.

## Tech

Vanilla HTML/CSS/JS with ES module imports. **No GSAP is used at all.** The only runtime dependencies are:

- `lenis` (npm) — page-wide smooth scroll, started with `new Lenis({ autoRaf: true })`.
- `lottie-web` (npm) — loads and plays the flame animation JSON, `renderer: "svg"`, `loop: true`, `autoplay: true`.

All motion of the spotlight and flame is produced by a single hand-rolled `requestAnimationFrame` loop that linearly interpolates (lerps) values into CSS custom properties and a `transform`. Do not reach for any tween library.

## Layout / HTML

Three stacked full-viewport `<section>`s. The middle one holds the spotlight machinery.

```html
<section class="intro">
  <h1>Enter the Field</h1>
</section>

<section class="spotlight">
  <div class="lottie-container">
    <div class="lottie"></div>
    <div class="fire-glow"></div>
  </div>

  <h1>Guided by Interaction</h1>
  <p>This space reacts with subtlety rather than instruction, responding to
     presence instead of force. Movement becomes a signal, gently shifting
     emphasis as light traces what matters in the moment. Nothing here
     competes for attention or demands a fixed outcome. Focus forms gradually,
     shaped by interaction, hesitation, and intent, allowing detail to surface
     only when it is approached.</p>

  <div class="spotlight-mask"></div>
</section>

<section class="outro">
  <h1>The Interaction Ends</h1>
</section>

<script type="module" src="./script.js"></script>
```

Use this neutral placeholder copy (no real brand names). The class names `.spotlight`, `.lottie-container`, `.lottie`, `.fire-glow`, `.spotlight-mask` are load-bearing (JS and CSS target them). lottie-web injects its SVG inside `.lottie`.

## Styling

Fonts: **Inter** for body copy, **Space Grotesk** for headings, **Space Mono** for the small uppercase eyebrow labels — all free.

Color tokens (on `:root`):

```css
:root {
  --dark: #141414;        /* near-black — background & the veil */
  --light: #efece3;       /* ivory — text */
  --dim: #8c8c88;
  --faded: #5f6368;
  --ember: #f04e23;       /* the flame's own colour, and every glow */
  --ember-glow: #ffb38a;
  --ember-deep: #7a1f00;
  --mouse-x: 0;           /* px, live-updated by JS */
  --mouse-y: 0;           /* px, live-updated by JS */
}
```

- Global reset: `* { margin:0; padding:0; box-sizing:border-box; user-select:none; }`.
- `body { font-family:"Inter","Helvetica Neue",sans-serif; background-color:var(--dark); color:var(--light); }` — **Space Grotesk** for the headings, **Space Mono** for the eyebrow labels.
- `h1 { font-family:"Space Grotesk",sans-serif; font-size:clamp(3rem, 5vw, 7rem); letter-spacing:-0.03em; }`.
- `p { font-size:2rem; }`; `.spotlight p { width:60%; text-align:center; }`.
- `section { position:relative; width:100%; height:100svh; padding:2rem; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:1rem; }` — every section is a centered full-height column.

**Flame container:**

- `.lottie-container { position:relative; width:8rem; height:8rem; pointer-events:none; }` — the element JS translates.
- `.lottie { width:100%; height:100%; transform:scale(1.25); }` — the SVG flame, slightly enlarged.

**Warm glow behind the flame** (pure CSS, independent of JS):

- `.fire-glow { position:absolute; top:48%; left:50%; transform:translate(-50%,-50%); width:240%; height:240%; pointer-events:none; filter:blur(26px); opacity:0.55; }`
- Background is a radial gradient built from the ember tokens:
  `radial-gradient(circle, rgba(240,78,35,0.5) 0%, rgba(240,78,35,0.32) 22%, rgba(255,179,138,0.14) 42%, transparent 66%)` — ember core → soft ember → transparent. It is the **only** warm thing on the page, which is what makes the flame read as the light source.
- Continuously animated with `animation: firePulse 2s ease-in-out infinite;`:

```css
@keyframes firePulse {
  0%, 100% { transform:translate(-50%,-50%) scaleY(1);   opacity:0.5;  }
  25%      { transform:translate(-50%,-50%) scaleY(1.2);  opacity:0.4;  }
  50%      { transform:translate(-50%,-50%) scaleY(0.9);  opacity:0.35; }
  75%      { transform:translate(-50%,-50%) scaleY(1.1);  opacity:0.5;  }
}
```

**The spotlight veil / mask** (the heart of the look):

```css
.spotlight-mask {
  position:absolute; top:0; left:0; width:100%; height:100%;
  pointer-events:none;
  background: var(--dark);
  -webkit-mask: radial-gradient(
    circle 200px at var(--mouse-x) var(--mouse-y),
    transparent 0%,
    transparent 40%,
    var(--dark) 80%,
    var(--dark) 100%
  );
  mask: radial-gradient(
    circle 200px at var(--mouse-x) var(--mouse-y),
    transparent 0%,
    transparent 40%,
    var(--dark) 80%,
    var(--dark) 100%
  );
  transition: opacity 0.3s ease;
  opacity: 0;
}
.spotlight-mask.active { opacity: 0.85; }
```

How this reads: `.spotlight-mask` is a full-section overlay filled with the dark background color. The CSS mask (alpha mask) is a **200px-radius radial gradient centered at `(--mouse-x, --mouse-y)`**: alpha 0 (fully transparent) from the center out to 40% of the radius, ramping to opaque (`var(--dark)` is fully opaque) by 80%. Where the mask is transparent the veil is punched out → the section content shows through **bright**; where it's opaque the veil covers the content → **dimmed**. So the result is an inverted spotlight: a soft ~160px-radius clear circle around the cursor, everything else darkened. The veil is invisible (`opacity:0`) until JS adds `.active` (fades to `opacity:0.85` over 0.3s) when the cursor is inside the section. `--mouse-x/--mouse-y` are set live by JS on the `.spotlight` element and inherited by the mask.

Responsive: `@media (max-width:1000px){ .spotlight p { font-size:1.5rem; width:100%; } }`.

## The effect (be exhaustive — this is the whole component)

No GSAP timeline. Two synchronized behaviors both run off one `requestAnimationFrame` loop with a **lerp factor of 0.1**: (A) the spotlight hole position (via CSS vars) and (B) the flame container `translate`. Trigger is `mousemove` (plus scroll to keep it aligned).

### Init on load

- `new Lenis({ autoRaf: true })` — smooth scroll for the whole page.
- Load the flame: `lottie.loadAnimation({ container: .lottie, renderer:"svg", loop:true, autoplay:true, path: "/path/to/fire.json" })`.
- Grab `spotlight` (`.spotlight`), `lottieContainer` (`.lottie-container`), `spotlightMask` (`.spotlight-mask`).

### State & position bookkeeping

```js
const state = { isTracking: false, cursorDetected: false };
const pos = {
  mouse:  { target:{x:0,y:0}, current:{x:0,y:0}, last:{x:0,y:0} },
  lottie: { current:{x:0,y:0}, center:{x:0,y:0} },
};
```

`init()` (run once via `setTimeout(init, 100)` and again on window `resize`):

- `spotlightRect = spotlight.getBoundingClientRect()`, `lottieRect = lottieContainer.getBoundingClientRect()`.
- Store the flame's home center **relative to the spotlight section's top-left**:
  `pos.lottie.center.x = lottieRect.left - spotlightRect.left + lottieRect.width/2`; same for `.y`.
- Seed the mouse at the section center: `pos.mouse.current.x = pos.mouse.target.x = spotlightRect.width/2`; same for `.y`.

### Pointer / scroll input → `updateCursor(x, y)`

```js
function updateCursor(x, y) {
  if (!state.cursorDetected) return;
  pos.mouse.last.x = x; pos.mouse.last.y = y;              // remember last screen pos
  const r = spotlight.getBoundingClientRect();
  const inside = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  if (inside) {
    pos.mouse.target.x = x - r.left;                       // target = pointer, relative to section
    pos.mouse.target.y = y - r.top;
    state.isTracking = true;
    spotlightMask.classList.add("active");                // fade the veil in
  } else {
    state.isTracking = false;
    spotlightMask.classList.remove("active");             // fade the veil out
  }
}
```

Wire it up:

- `window` `mouseenter` (`{ once:true }`) and `mouseover` (`{ once:true }`): set `state.cursorDetected = true` then `updateCursor(e.clientX, e.clientY)` — first-contact bootstrap so the effect can start.
- `document` `mousemove`: `state.cursorDetected = true; updateCursor(e.clientX, e.clientY)` — the main driver.
- `window` `scroll`: if `state.cursorDetected`, call `updateCursor(pos.mouse.last.x, pos.mouse.last.y)` — re-evaluates using the last known cursor position so the spotlight stays aligned to the content as it scrolls under a stationary pointer (and correctly deactivates when the section scrolls away from the cursor).
- `window` `resize`: `init`.

### The rAF loop (`animate`) — runs forever

```js
function animate() {
  // (A) smooth the spotlight hole toward the pointer (lerp 0.1)
  pos.mouse.current.x += (pos.mouse.target.x - pos.mouse.current.x) * 0.1;
  pos.mouse.current.y += (pos.mouse.target.y - pos.mouse.current.y) * 0.1;
  spotlight.style.setProperty("--mouse-x", `${pos.mouse.current.x}px`);
  spotlight.style.setProperty("--mouse-y", `${pos.mouse.current.y}px`);

  // (B) flame target: offset from its home center while tracking, else 0 (return home)
  const targetX = state.isTracking ? pos.mouse.current.x - pos.lottie.center.x : 0;
  const targetY = state.isTracking ? pos.mouse.current.y - pos.lottie.center.y : 0;
  pos.lottie.current.x += (targetX - pos.lottie.current.x) * 0.1;   // lerp 0.1
  pos.lottie.current.y += (targetY - pos.lottie.current.y) * 0.1;
  lottieContainer.style.transform =
    `translate(${pos.lottie.current.x}px, ${pos.lottie.current.y}px)`;

  requestAnimationFrame(animate);
}
setTimeout(init, 100);
animate();
```

Behavior that produces:

- **Spotlight hole:** `pos.mouse.current` eases toward `pos.mouse.target` at 0.1/frame, and its value is written into `--mouse-x/--mouse-y`, which reposition the mask gradient's center. The hole therefore chases the cursor with a soft trailing lag rather than snapping.
- **Flame trail:** while `isTracking`, the flame's target is `current mouse − flame home center`, i.e. the vector from its resting spot to the pointer; lerping `pos.lottie.current` toward that at 0.1/frame drifts the flame toward the cursor. When the pointer leaves the section (`isTracking=false`), the target becomes `0`, so the flame eases back to its home position. The `.fire-glow` keeps pulsing independently via its CSS `firePulse` keyframes the whole time.
- Because both use the same 0.1 factor, hole and flame feel unified — a gentle, weighty follow, never instantaneous.

## Assets / images

**One Lottie JSON** (no bitmap images): a **looping stylized animated flame** — a small candle/torch-like fire, warm palette (hot red core, orange mid, pale-yellow tips), transparent background, roughly **4:3** source (≈1600×1200), a **seamless ~2s loop at 60fps**. Rendered as inline SVG at `8rem` box, scaled 1.25. Any tasteful animated flame works; do not use branded artwork. Load it from an assets path such as `/path/to/fire.json`.

## Behavior notes

- **Desktop / pointer-driven only.** The whole spotlight is `mousemove`-based (plus `scroll` re-alignment); there is no touch/click path. Outside the `.spotlight` section the veil is inactive and the flame sits at home.
- Lenis smooth scroll applies to the entire 3-section page; the spotlight/flame effect is scoped to the middle section.
- `init` is deliberately delayed 100ms after load (so layout is settled) and re-run on resize to recompute the flame's home center and section geometry.
- The rAF loop runs continuously. Keep `--light #efece3`, `--dark #141414`, the ember glow gradient, and the mask stops (200px radius; transparent 0–40%, opaque 80–100%) at these values for the look to read correctly. Under `prefers-reduced-motion` the glow stops pulsing (`animation:none; opacity:.6`).

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/guiding-light/fire.json
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--dark`, `--light`, `--dim`, `--faded`, `--ember`, `--ember-glow`, `--ember-deep`, `--mouse-x`, `--mouse-y`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the spotlight looks right for a moment, then drifts wrong in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here: two `Lenis` instances each driving their own internal scroll loop on the same page, two `animate` loops both racing to write `--mouse-x`/`--mouse-y` onto the same `.spotlight` element and both setting `transform` on the same `.lottie-container`, and — because `lottie.loadAnimation()` appends its rendered `<svg>` into `.lottie` synchronously, independent of whether `fire.json` has finished loading — two flame renderers stacked on top of each other in the same box. The visible symptom is a flame that jitters or briefly doubles and a spotlight hole that trails unevenly, and none of it reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script runs at the top level, the moment the module is evaluated: there is no `DOMContentLoaded` listener, not even a `readyState` check. `new Lenis(...)`, `lottie.loadAnimation(...)`, the three `document.querySelector` lookups (`spotlight`, `lottieContainer`, `spotlightMask`), all six `addEventListener` calls, `setTimeout(init, 100)`, and the first call to `animate()` are import-time side effects — they run before your component has rendered anything, against elements that do not exist yet. Move all of it into one `useEffect` with an empty dependency array. Do not leave the listeners or the rAF loop in the component body: left there, they re-run on every render and pile a new subscription on top of the one the previous render already attached.

*(2) Element lookups* — `spotlight`, `lottieContainer`, and `spotlightMask` should come from refs on `.spotlight`, `.lottie-container`, and `.spotlight-mask` rather than three unscoped `document.querySelector` calls. During the StrictMode remount two copies of that markup exist for an instant, and an unscoped lookup can bind to the copy that is on its way out, so its writes to `--mouse-x`/`--mouse-y` land on a node nobody is looking at anymore.

The six listeners are the exception to "scope every lookup to the root," and deliberately so: `mouseenter`/`mouseover` on `window` and `mousemove`/`touchmove` on `document` have to be global because the spotlight must detect the cursor before it has ever entered `.spotlight`, and `scroll` on `window` re-evaluates `pos.mouse.last` against the page's own scroll, not the section's. Attach them exactly where the vanilla script does, but hold a named reference to every handler so the cleanup can remove precisely what was added. This matters most for the two `{ once: true }` listeners: `once` only detaches a listener after it fires, so if the pointer never crosses `window` before an unmount, both are still attached for the life of the page unless the cleanup calls `removeEventListener` on them explicitly — `once` saves you from tracking whether the handler already ran, it is not a substitute for teardown.

*(3) Cleanup* — Nothing in this component touches GSAP, so there is no `gsap.context` to revert. Every resource this effect creates has to be named and torn down individually:

```jsx
useEffect(() => {
  const spotlight = spotlightRef.current;
  const lottieContainer = lottieContainerRef.current;
  const spotlightMask = spotlightMaskRef.current;

  const lenis = new Lenis({ autoRaf: true });
  const animation = lottie.loadAnimation({
    container: lottieRef.current,
    renderer: "svg",
    loop: true,
    autoplay: true,
    path: "/c/guiding-light/fire.json",
  });

  // state, pos, init, updateCursor — exactly as above, closing over these refs
  // instead of the module-level consts the standalone script used

  const onFirstContact = (e) => { state.cursorDetected = true; updateCursor(e.clientX, e.clientY); };
  const onMouseMove = (e) => { state.cursorDetected = true; updateCursor(e.clientX, e.clientY); };
  const onTouchMove = (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    state.cursorDetected = true;
    updateCursor(touch.clientX, touch.clientY);
  };
  const onScroll = () => { if (state.cursorDetected) updateCursor(pos.mouse.last.x, pos.mouse.last.y); };
  const onResize = () => init();

  window.addEventListener("mouseenter", onFirstContact, { once: true });
  window.addEventListener("mouseover", onFirstContact, { once: true });
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("scroll", onScroll);
  window.addEventListener("resize", onResize);

  let rafId;
  function animate() {
    /* the lerp loop, exactly as above */
    rafId = requestAnimationFrame(animate);
  }
  const timeoutId = setTimeout(init, 100);
  animate();

  return () => {
    clearTimeout(timeoutId);
    cancelAnimationFrame(rafId);
    window.removeEventListener("mouseenter", onFirstContact);
    window.removeEventListener("mouseover", onFirstContact);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    animation.destroy();
    lenis.destroy();
  };
}, []);
```

- **`Lenis` is created with `autoRaf: true`, so it drives its own internal loop** — this component's `animate` function never calls `lenis.raf`; the smooth scroll and the spotlight/flame lerp are two entirely independent clocks, and neither cancellation stands in for the other. `destroy()` is still mandatory on unmount; it is also what stops that internal loop. If this section ends up embedded in a larger page instead of owning the document, lift the `Lenis` instance to the app shell and drop the `new Lenis(...)` call from this effect — a page gets one smooth-scroll instance, not one per mounted section.
- **The rAF loop reschedules itself by name** — `animate` calls `requestAnimationFrame(animate)` at its own tail, so the id worth cancelling is whichever one the *most recent* call returned, not the one from `animate()`'s first invocation. Reassign the same variable every frame (as above) and cancel that variable in the cleanup; canceling only the very first id does nothing once the loop has rescheduled itself past it.

Two more resources this effect creates have no covering rule elsewhere in this catalogue, because the standalone script never needed to give either one back:

- **`lottie.loadAnimation(...)`'s return value is thrown away in the vanilla script** — a document that never tears itself down has no use for it. React does: capture the `AnimationItem` as `animation` and call `animation.destroy()` in the cleanup. Skip this and a remount does not replace the flame, it stacks a second `<svg>` inside `.lottie` on top of the first, and both keep looping and repainting.
- **`setTimeout(init, 100)` is a live timer at unmount time, not something that has necessarily already fired.** If the component unmounts inside that 100ms window, an uncancelled timeout still calls `init()` afterward, re-measuring `spotlight.getBoundingClientRect()` and `lottieContainer.getBoundingClientRect()` and rewriting `pos.lottie.center` for a loop whose own `rafId` has already been cancelled — wasted work at best, and one more thing to rule out if the flame's home position ever looks off after a fast navigate-away-and-back. Keep the id `setTimeout` returns and `clearTimeout` it alongside everything else above.
