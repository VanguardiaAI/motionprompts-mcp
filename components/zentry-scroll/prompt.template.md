---
slug: zentry-scroll
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 2
structural_literals: 5
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Cosmic Scroll Story — Pinned Section with Clip-Path Reveals, Deep Zoom & Flip-Open Headline

## Goal
Build a long-scroll "scrollytelling" page whose centerpiece is a single section pinned for **4 viewport heights** while every stage is scrubbed by scroll. As you scroll through the pinned section: the letters of two intro paragraphs **flicker in** one-by-one in a random order; a small centered rectangle **expands via an animated `clip-path`** into a fullscreen image (its photo scaling up at the same time); then a third image **opens outward from a central seam** while it is held at a heavy 3× zoom, and finally **zooms back out** to natural scale; and as a closing beat a headline that starts folded away at `rotateY(-75deg)` **swings flat to camera** to reveal the last line of copy. All of it is driven by GSAP `ScrollTrigger` (one pin + many scrubbed tweens) with Lenis smooth scroll.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**, and **`lenis`** for smooth scroll. Register with `gsap.registerPlugin(ScrollTrigger)`. Run everything inside a `DOMContentLoaded` handler. No SplitText, no CustomEase, no Three.js — the letter split is done by hand.

## Layout / HTML
Single `.container` wrapping five full-viewport sections in order. Class names are load-bearing (JS/CSS query them):

```
<div class="container">
  <section class="hero">
    <h1>Genesis</h1>
    <p>At the nexus of infinite realities, the Aethoria Spire rises: a beacon of limitless potential in the cosmic tapestry.</p>
  </section>

  <section class="about">
    <div class="about-img"><img src="..." alt="" /></div>
    <div class="about-copy"><h1>The Omniversal Fulcrum</h1></div>
  </section>

  <section class="sticky">
    <div class="intro">
      <div class="intro-col">
        <p>Veiled depths of eternity</p>
        <p>Currents of cosmic wisdom</p>
      </div>
      <div class="intro-col">
        <p>Nexus of all existence</p>
      </div>
    </div>
    <div class="img-1"><img src="..." alt="" /></div>
    <div class="img-2"><img src="..." alt="" /></div>
    <div class="img-3"><img src="..." alt="" /></div>
    <div class="copy">
      <h1>The cosmic keystone within Aethoria unlocks the gates to multiversal transformation</h1>
    </div>
  </section>

  <section class="footer">
    <h1>Infinite Realms <br /> Beckon Beyond</h1>
  </section>
</div>
```

All copy is fictional cosmic flavor text — keep it neutral, no brand names.

## Styling
Fonts: body/paragraphs use **Roboto Mono** (Google Fonts, weights 100–700). Every `h1` uses a **heavy condensed uppercase display face** — declare `font-family: "FK Screamer"` with a robust fallback (e.g. a bold grotesque like `"Anton", "Archivo Black", sans-serif`); it must render as a massive, tightly-set, all-caps headline.

Global reset & base:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `html, body { width:100%; height:700vh !important; font-family:"Roboto Mono", monospace }` — the **700vh body height is essential**: it is the total scroll runway that makes the pin + all scrubbed ranges reachable.
- `img { width:100%; height:100%; object-fit:cover }`.
- `h1 { text-transform:uppercase; font-size:15vw; font-weight:600; line-height:90%; letter-spacing:2px; color:#fff }`.
- `p { text-transform:uppercase; font-size:14px; font-weight:400; color:#fff }`.
- `section { width:100vw; height:100vh }`.

Sections:
- `.hero`: `padding:4em; display:flex; flex-direction:column; justify-content:space-between; align-items:center`; full-bleed background image `background: url(...) no-repeat 50% 50%; background-size:cover`. `.hero p { width:50%; text-align:center }`.
- `.about`: `padding:4em 12em; display:flex; justify-content:center; align-items:center; gap:10em; background-color:#667e74` (muted sage green). `.about-img, .about-copy { flex:1 }`. `.about-img { height:75%; border:2px solid #000 }`. `.about-copy h1 { text-align:center; font-size:10vw; color:#263a30 }` (dark green, overrides the white).
- `.footer`: `padding:2em; display:flex; justify-content:center; align-items:center; text-align:center; background-color:#1d2944` (dark navy).
- `.sticky`: `position:relative; perspective:1000px` — the **`perspective:1000px` is required** for the closing headline's 3D `rotateY` swing to read as depth.

Sticky-section children (all layered inside `.sticky`):
- `.intro { position:absolute; top:50%; transform:translateY(-50%); width:100%; padding:1em; display:flex; z-index:2 }` — sits above the images. `.intro-col { flex:1; display:flex }`, `.intro-col p { flex:1 }`, `.intro-col p span { display:inline-block }`. Second column right-aligned: `.intro-col:nth-child(2) p { text-align:right }`.
- `.img-1, .img-2, .img-3 { position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden }` — three stacked full-cover layers (img-1 bottom, img-3 top).
- `.img-2` initial `clip-path: polygon(40% 25%, 60% 25%, 60% 75%, 40% 75%)` — a small centered rectangle (20% wide × 50% tall).
- `.img-3` initial `clip-path: polygon(50% 25%, 50% 25%, 50% 75%, 50% 75%)` — a zero-width vertical seam down the center. `.img-3 img { transform-origin:top right; transform:scale(3) }` — the top image starts zoomed to 3×, anchored to its top-right.
- `.copy { width:50%; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotateY(-75deg) scale(0.5); transform-origin:bottom left; display:none }` — the closing headline starts hidden, folded 75° away and half-scale. `.copy h1 { font-size:5vw; text-align:center }`.

Responsive (`max-width:900px`): `h1` → `font-size:20vw`; `.hero p` → `width:100%`; `.about` stacks column (`flex-direction:column; gap:4em; padding:4em 2em`), `.about-copy { flex:0.5 }`, `.about-img { margin-top:4em; height:100% }`; `.intro` and `.intro-col` become `flex-direction:column`, `.intro-col p { text-align:center !important }`; `.copy { width:90% }`, `.copy h1 { font-size:10vw }`.

## GSAP effect (be exact)

### Lenis + ScrollTrigger wiring
```js
const stickySection = document.querySelector(".sticky");
const totalStickyHeight = window.innerHeight * 4;

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Lenis drives scroll; GSAP's ticker drives Lenis (seconds → ms via `* 1000`). `totalStickyHeight` (4 × viewport) is the pin length and the reference for every absolute scroll marker below.

### 1. Manual letter split (no SplitText)
For each `.intro-col p`, take its `textContent`, split on whitespace (keep the spaces), and for every non-space chunk wrap **each character** in `<span style="opacity:0; display:inline-block;">…</span>`. Reassemble as `innerHTML`. Result: every letter is an individually-addressable, initially-invisible inline-block span; spaces stay as plain text.

### 2. Flicker-in / flicker-out of the intro letters
A reusable helper animates all letter spans to a target opacity with a **random-order flicker**:
```js
function flickerAnimation(targets, toOpacity) {
  gsap.to(targets, {
    opacity: toOpacity,
    duration: {{motion.duration.fast}},
    stagger: { amount: 0.3, from: "random" },
  });
}
```
- `duration:{{motion.duration.fast}}` per letter (near-instant snap), `stagger.amount:0.3` spreads the whole batch across 0.3s total, `from:"random"` scatters the order → a flickering, non-linear appearance.

Fire it from a **callback-only** ScrollTrigger (not scrubbed):
```js
ScrollTrigger.create({
  trigger: stickySection,
  start: "top top",
  end: () => `${window.innerHeight * 3}`,   // absolute scroll position (px), NOT "+="
  onEnter:     () => flickerAnimation(".intro-col p span", 1),
  onLeave:     () => flickerAnimation(".intro-col p span", 0),
  onEnterBack: () => flickerAnimation(".intro-col p span", 1),
  onLeaveBack: () => flickerAnimation(".intro-col p span", 0),
});
```
So the letters flicker **on** when the pin begins and flicker **off** near the end of the third viewport of scroll; scrolling back reverses it. (Because `end` is a bare number string it is treated as an absolute page-scroll position of `3 × innerHeight`px, not a relative offset.)

### 3. Pin the sticky section
```js
ScrollTrigger.create({
  trigger: stickySection,
  start: "top top",
  end: () => `+=${totalStickyHeight}`,   // +=4×innerHeight
  pin: true,
  pinSpacing: true,
});
```
The section locks to the viewport for 4 viewport-heights of scrolling; `pinSpacing:true` inserts that runway so the footer follows afterward.

### 4. img-2 reveal — clip-path expand + photo scale (first viewport, scroll 0 → 1×vh)
Two scrubbed tweens over `start:"top top"`, `end:() => "+="+window.innerHeight`, `scrub:true`, `ease:"none"`:

**(a) clip-path** driven manually in `onUpdate` by interpolating the small centered rectangle out to the full frame:
```js
scrollTrigger: {
  trigger: stickySection, start: "top top",
  end: () => `+=${window.innerHeight}`, scrub: true,
  onUpdate: (self) => {
    const p = self.progress;
    gsap.set(".img-2", { clipPath: `polygon(
      ${gsap.utils.interpolate(40, 0, p)}% ${gsap.utils.interpolate(25, 0, p)}%,
      ${gsap.utils.interpolate(60, 100, p)}% ${gsap.utils.interpolate(25, 0, p)}%,
      ${gsap.utils.interpolate(60, 100, p)}% ${gsap.utils.interpolate(75, 100, p)}%,
      ${gsap.utils.interpolate(40, 0, p)}% ${gsap.utils.interpolate(75, 100, p)}%
    )` });
  },
}
```
Corner journeys: left x 40→0, right x 60→100, top y 25→0, bottom y 75→100. The centered rectangle grows outward on all four edges into `polygon(0 0,100 0,100 100,0 100)` — a rectangular iris opening to fullscreen. (The tween's own `clipPath` target is that full polygon; the `onUpdate` overrides each frame so the interpolation is explicit.)

**(b) `.img-2 img` scale** `→ 1.125` over the same range (a slow inward push while the frame opens).

### 5. img-3 open + hold-zoom (fourth viewport, scroll 3×vh → 4×vh)
These use **absolute** scroll markers `start:() => window.innerHeight*3`, `end:() => window.innerHeight*4`, `scrub:true`, `ease:"none"`.

**(a) clip-path** opens from the center outward, again interpolated in `onUpdate`:
```js
onUpdate: (self) => {
  const p = self.progress;
  gsap.set(".img-3", { clipPath: `polygon(
    ${gsap.utils.interpolate(50, 0, p)}% ${gsap.utils.interpolate(50, 0, p)}%,
    ${gsap.utils.interpolate(50, 100, p)}% ${gsap.utils.interpolate(50, 0, p)}%,
    ${gsap.utils.interpolate(50, 100, p)}% ${gsap.utils.interpolate(50, 100, p)}%,
    ${gsap.utils.interpolate(50, 0, p)}% ${gsap.utils.interpolate(50, 100, p)}%
  )` });
}
```
All four corners start at the center point 50% 50% and expand to the frame corners → the top image irises open from the middle to fullscreen. (Target `clipPath` is the full polygon.)

**(b) `.img-2 img` continues scaling** `fromTo(1.125 → 1.25)` over this same 3×→4× range (keeps the middle layer creeping in).

**(c) `.img-3 img` scale** `to: 2.9` over 3×→4× — it is essentially held at its heavy 3× zoom (CSS start scale is `3`, animating to `2.9`), so as img-3 opens you see a deep, tightly-cropped detail.

### 6. img-3 zoom-out (scroll 4×vh → 6×vh)
```js
gsap.fromTo(".img-3 img", { scale: 2.9 }, {
  scale: 1, ease: "none",
  scrollTrigger: {
    trigger: stickySection,
    start: () => `${window.innerHeight * 4}`,
    end:   () => `${window.innerHeight * 6}`,
    scrub: true,
  },
});
```
Over the next two viewports the top image pulls back from 2.9× to its natural 1× — the "reveal the whole picture" beat. (This range extends past the 4×vh pin release, so the zoom-out finishes as the section scrolls away.)

### 7. Closing headline flip-open (scroll 4.5×vh → 5.5×vh)
```js
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: stickySection,
    start: () => `${window.innerHeight * 4.5}`,
    end:   () => `${window.innerHeight * 5.5}`,
    scrub: true,
    toggleActions: "play reverse play reverse",
  },
});
tl.to(".copy", { display: "block", rotateY: 0, scale: 1, duration: 1 });
```
`.copy` (hidden, `rotateY(-75deg) scale(0.5)`, `transform-origin:bottom left`) swings flat to `rotateY(0) scale(1)` and becomes visible — with the parent `perspective:1000px`, it reads as a panel hinging open toward the viewer to present the final line. Scrubbed and reversible.

### Timing summary (in units of `window.innerHeight` of scroll)
- `0 → 1`: intro letters flickered in (from pin start); img-2 clip-path iris opens to fullscreen; img-2 photo scales 1→1.125.
- `1 → 3`: pinned, mostly holding (letters still on).
- `~3`: intro letters flicker out (flicker trigger ends at `3`).
- `3 → 4`: img-3 clip-path irises open from center; img-3 photo held ~3× (3→2.9); img-2 photo continues 1.125→1.25.
- `4 → 6`: img-3 photo zooms out 2.9 → 1 (pin releases at 4).
- `4.5 → 5.5`: closing `.copy` headline flips from `rotateY(-75deg) scale(0.5)` to flat.

All scrubbed tweens use `ease:"none"` so motion is linearly tied to scroll; the only non-scrubbed animation is the flicker (its own short easing/stagger).

## Assets / images
Five images, all photographic and atmospheric — a matched cinematic/cosmic set (nebulae, celestial landscapes, monolithic sci-fi structures, deep-space vistas), no logos or text:
- **1 hero background** — full-bleed landscape (≈16:9), the opening cosmic backdrop behind the "Genesis" title.
- **1 about image** — portrait-ish framed photo (roughly 3:4), sits inside a 2px black border beside the green section's heading.
- **3 fullscreen sticky images** — each fills a 100vw × 100vh layer with `object-fit:cover`, so use large landscape-or-square images (≈16:9). img-1 is the bottom backdrop; img-2 is the rectangle that irises open; img-3 is the top layer that opens from the seam and holds a deep zoom, so it benefits from an image with strong central detail that rewards the 3× crop.

## Behavior notes
- The page **hijacks scroll** via Lenis and pins a full section for 4 viewport-heights; it is a page-level, immersive experience (desktop-first but the `max-width:900px` query reflows it for mobile).
- Everything except the letter flicker is **fully scrubbed and reversible** — scrolling back plays every reveal, zoom and flip backwards.
- The 700vh body height, the pin length (`4×innerHeight`), and the absolute scroll markers (`3×`, `4×`, `4.5×`, `5.5×`, `6×` innerHeight) must line up — they're what sequence the beats; recompute them from `window.innerHeight` (the demo reads it at load).
- Light performance cost (no canvas/WebGL); the clip-path morphs are the heaviest part.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/zentry-scroll/about.jpg
https://motionprompts.dev/c/zentry-scroll/hero.jpg
https://motionprompts.dev/c/zentry-scroll/img-1.jpg
https://motionprompts.dev/c/zentry-scroll/img-2.jpg
https://motionprompts.dev/c/zentry-scroll/img-3.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--dusk`, `--amber`, `--bone`, `--mist`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component wires one `Lenis` instance into the GSAP ticker and builds ten `ScrollTrigger`-driven pieces off a single `.sticky` section: the callback-only flicker trigger, the pin, and eight scrubbed tweens (including the closing `.copy` reveal timeline). Setup that runs twice with teardown that runs never leaves you two of everything: two pins on the same `.sticky`, each claiming its own four-viewport-height scroll runway and inserting its own pin-spacer, two Lenis instances pulling on the same wheel event, and two flicker triggers racing to fade the same letter spans in and out. The visible symptom is a pinned section that holds for eight viewport-heights instead of four, or intro letters that flicker twice on the same scroll tick, and none of it reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The whole effect — registering `ScrollTrigger`, constructing `Lenis` and wiring it into `gsap.ticker`, splitting the two `.intro-col p` paragraphs into per-letter spans, and creating all ten `ScrollTrigger` pieces — runs inside a bare `document.addEventListener("DOMContentLoaded", () => { ... })`, with no `readyState` guard. By the time a React component mounts, `DOMContentLoaded` has already fired, so the listener above is dead code: no error, nothing to debug, the letters simply never split and the pin never engages. Delete the listener and move its entire body into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `stickySection` (`document.querySelector(".sticky")`) is the only lookup this script names explicitly, and it's already scoped with respect to itself — every `scrollTrigger.trigger` below reuses that one reference instead of re-querying `.sticky`. Everything else — `.intro-col p`, `.intro-col p span`, `.img-1 img`, `.img-2`, `.img-2 img`, `.img-3`, `.img-3 img`, `.copy` — is a bare string handed straight to `gsap.to`/`gsap.fromTo`/`gsap.set`/`querySelectorAll`, each resolved through its own unscoped, internal `document.querySelector[All]` call, independent of `stickySection`. Give the component a root ref, resolve `stickySection` off it (`root.querySelector(".sticky")`), and resolve every tween target the same way before handing it to GSAP: a string like `".img-2"` doesn't know which copy of the subtree to bind to during the StrictMode remount, and several of these — the split, and `.intro-col p span` again on every flicker — are re-resolved on every call, not just once at setup, so any one of them can pick up the outgoing copy. The letter split itself needs no revert of its own: it rebuilds from `paragraph.textContent`, which flattens straight back to the plain original string even after a previous run wrapped every character in a span, so a second pass — the StrictMode remount, say — regenerates the same spans instead of nesting them the way an unreverted SplitText run would.

*(3) Cleanup* — Wrap the split and all ten `ScrollTrigger` pieces in one `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const stickySection = root.querySelector(".sticky");

  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);
  const onTick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(onTick);
  gsap.ticker.lagSmoothing(0);

  const ctx = gsap.context((self) => {
    // the letter split, the pin, and the eight scrubbed tweens, exactly as
    // above, resolved off `root` instead of `document`
    self.add("flicker", flickerAnimation);

    ScrollTrigger.create({
      trigger: stickySection,
      start: "top top",
      end: () => `${window.innerHeight * 3}`,
      onEnter: () => self.flicker(root.querySelectorAll(".intro-col p span"), 1),
      onLeave: () => self.flicker(root.querySelectorAll(".intro-col p span"), 0),
      onEnterBack: () => self.flicker(root.querySelectorAll(".intro-col p span"), 1),
      onLeaveBack: () => self.flicker(root.querySelectorAll(".intro-col p span"), 0),
    });
  }, rootRef);

  return () => {
    gsap.ticker.remove(onTick);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
    ctx.revert();
    gsap.set([".img-2", ".img-3"], { clearProps: "clipPath" });
  };
}, []);
```

The pin and the eight scrubbed tweens are all created synchronously inside the factory, so `ctx.revert()` alone kills every trigger and restores every inline style GSAP wrote for those. The flicker trigger is different: the `ScrollTrigger.create` call above is synchronous too, so the trigger itself is adopted fine, but the animation it produces is not — `flickerAnimation`'s `gsap.to(...)` only runs later, from inside `onEnter`/`onLeave`/`onEnterBack`/`onLeaveBack`, on an actual scroll event, well after the factory has already returned and stopped recording. Call it straight (`onEnter: () => flickerAnimation(...)`) and `ctx.revert()` kills the trigger but leaves a live opacity tween running against letter spans this component is in the middle of unmounting. `self.add("flicker", flickerAnimation)` closes that: it registers the function once, inside the factory, and re-opens the recording window every time `self.flicker(...)` (or, from outside the factory, `ctx.flicker(...)`) runs later, so whatever tween that call creates gets adopted and reverted with everything else. Use `self`, not `ctx`, inside these callbacks even though they only ever fire after `gsap.context()` has returned: `self` is the factory's own parameter, valid from the instant the factory starts running, while `ctx` is a `const` that isn't assigned until `gsap.context()` returns — if this trigger's `start: "top top"` condition already holds at creation time (a client-side route restoring scroll mid-page, say), `onEnter` fires synchronously, inside the factory, and `ctx.flicker` would throw `Cannot access 'ctx' before initialization` right there.

One more gap `ctx.revert()` doesn't close: the clip-path shape actually visible mid-scrub on `.img-2`/`.img-3` is painted by the plain `gsap.set(...)` call inside each tween's own `onUpdate`, not by the tween's declared `clipPath` end value — and `onUpdate` fires on every scroll tick, same as the flicker callbacks, outside the factory's synchronous pass. Reverting the outer tween restores whatever it cached at creation; the last `onUpdate` write sits on top of that as a separate, untracked call. Clear the property explicitly in the cleanup (`gsap.set([...], { clearProps: "clipPath" })`, above) instead of trusting the revert to have the last word on it.

**Lenis** — nothing else on this page drives scroll, so the component can own the instance outright: create it in the effect, `destroy()` it in the cleanup. `gsap.ticker.lagSmoothing(0)` here is a global GSAP setting, not a per-component one — leaving it patched after unmount silently disables lag smoothing for every other GSAP animation on the page for the rest of the session, so restore GSAP's own defaults (`gsap.ticker.lagSmoothing(500, 33)`) in the same cleanup. Do that, and `gsap.ticker.remove(onTick)`, and `lenis.destroy()`, before `ctx.revert()`, not after: a tick landing in the gap can still call `lenis.raf()` on an instance mid-teardown, or push a `ScrollTrigger.update` into triggers `revert()` hasn't killed yet. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — it lives on the Lenis instance's own emitter and goes away with `destroy()`. If this section ends up sharing a page with other Lenis-driven components, the singleton note already in this document under "Using this outside its demo page" still applies unchanged.
