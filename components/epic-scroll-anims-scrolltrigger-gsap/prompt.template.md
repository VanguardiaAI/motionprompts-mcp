---
slug: epic-scroll-anims-scrolltrigger-gsap
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 12
structural:
  - { kind: duration, literal: "0", rule: value/narrated }
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Epic Scroll Story — Rotating Clip-Path Cross that Scales Up to Wipe the Screen

## Goal
Build a long, cinematic single-page scroll story. A tiny white **plus/cross shape** sits over a pinned dark editorial section; as you scroll, it **rotates a full 360°**, its `clip-path` **expands** from a thin cross into a solid white square, it **drifts horizontally** from left-of-center to center, and finally **scales up ~13×** to white-out the entire viewport and hand off to a final white content section. Everything is driven by several scrubbed / `onUpdate` GSAP ScrollTriggers over Lenis-smoothed scrolling, plus two pinned sections.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**, and **`lenis`** for smooth scroll.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);
```

Run everything inside a `DOMContentLoaded` handler.

## Layout / HTML
Class names are load-bearing — the JS and CSS query them. Stack these sections inside a single `.container`:

```html
<div class="container">
  <section class="hero">
    <h1>Symphonia</h1>
  </section>

  <section class="info">
    <div class="header-rows">
      <div class="header-row"><h1>Motion</h1></div>
      <div class="header-row"><h1>Stills</h1></div>
    </div>
  </section>

  <section class="header-info">
    <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Labore praesentium eaque ipsa illum rem cumque iusto natus, saepe provident quasi?</p>
    <div class="header-images">
      <div class="img"><img src="hero-images/img-1.jpg" alt="" /></div>
      <div class="img"><img src="hero-images/img-2.jpg" alt="" /></div>
      <div class="img"><img src="hero-images/img-3.jpg" alt="" /></div>
      <div class="img"><img src="hero-images/img-4.jpg" alt="" /></div>
    </div>
  </section>

  <section class="whitespace"></section>

  <section class="pinned">
    <div class="revealer">
      <div class="revealer-1"></div>
      <div class="revealer-2"></div>
    </div>
  </section>

  <section class="website-content">
    <h1>Lorem ipsum dolor sit amet consectetur adipisicing elit. Mollitia nobis qui corrupti sit, ad facilis, natus magnam culpa facere sunt pariatur? Voluptatum qui quis sit dolore, dolorum est neque animi!</h1>
  </section>
</div>
```

- Hero title: **"Symphonia"**. Info headers: **"Motion"** (top row) and **"Stills"** (bottom row). Paragraph and final content use placeholder lorem ipsum as above.
- The DOM order matters: `.whitespace` comes **before** `.pinned` in the markup even though `.pinned` is absolutely positioned to overlay earlier sections (see Styling).

## Styling
**Fonts:** **Inter** for body, **Space Grotesk** for every display line (hero title, header rows, the wordmark, the header-info paragraph) and **Space Mono** for the small uppercase labels.

**Palette:**
```css
:root {
  --ink: #16161a;      /* the dark sections and the hero base */
  --paper: #f2f2f2;    /* type on dark, and the closing panel */
  --accent: #ff4e45;   /* one hot red */
  --graphite: #2b2b31;
  --gray: #8f8f96;
  --gutter: 2rem;
}
```

Global:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `html, body { width:100%; height:100%; font-family:"Inter"; background-color: var(--ink); overflow-x:hidden; }`
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1 { text-transform:uppercase; font-family:"Space Grotesk"; font-weight:600; font-size: clamp(56px, 12vw, 180px); letter-spacing:0.02em; line-height:1; }` — display headings that scale with the viewport instead of a fixed 200px.

Sections (all full-bleed width):
- `section.hero { position:relative; width:100vw; height:100vh; background-color: var(--ink); display:flex; justify-content:center; align-items:center; isolation:isolate; }` — the photo is **not** on the section itself but on `::before` (`z-index:0`), stacked as a legibility gradient over `url(hero.jpg) no-repeat 50% 40%` with `background-size:cover` and `filter: grayscale(1) contrast(1.05)`; then `::after` (`z-index:1`) lays `rgba(255,78,69,.22)` in `mix-blend-mode: multiply`. That is the duotone: any photograph lands in the palette, and the title (`z-index:2`, `color: var(--paper)`) stays clean. The painted `background-color` means the panel is never blank if the image fails.
- `section.info { width:100vw; height:150vh; background-color: var(--ink); color: var(--paper); }`. Inside, `.header-row { width:100%; height:250px; padding:0 2em; display:flex; align-items:center; }`; the **1st** row is `justify-content:flex-start` (Motion pinned left), the **2nd** is `justify-content:flex-end` (Stills pinned right).
- `.header-info { position:relative; width:100%; height:100vh; display:flex; flex-direction:column; justify-content:space-between; background-color: var(--ink); color: var(--paper); }`. `.header-info p { padding:1em; font-family:"Space Grotesk"; }` (paragraph sits at the top). `.header-images { width:100%; height:250px; padding:1em; display:flex; gap:1em; }` (four thumbnails in a row at the bottom); `.img { width:100%; height:100%; }`.
- `section.whitespace { position:relative; width:100%; height:300vh; background-color: var(--ink); z-index:-1; }` — a tall dark spacer that provides scroll runway; sits **behind** everything (`z-index:-1`).
- `section.pinned { position:absolute; top:100vh; width:100%; height:250vh; z-index:2; }` — absolutely positioned so it overlays starting exactly one viewport down (right after the hero), floating above the black sections.
- `section.website-content { position:relative; width:100%; height:150vh; background-color: var(--paper); color: var(--ink); z-index:10; }` — the light panel on top of everything, where the accent appears only as a pill surface behind ink text.

**The revealer (the star element)** — a tiny cross built from two clipped white boxes:
- `.revealer { position:absolute; transform:translate(-50%,0%); left:35%; margin-top:325px; width:120px; height:120px; }` — a 120×120 box, positioned left-of-center (35%) and pushed down 325px inside `.pinned`.
- `.revealer .revealer-1 { position:absolute; inset:0; width:100%; height:100%; background-color: var(--paper); clip-path:polygon(45% 0%, 55% 0%, 55% 100%, 45% 100%); }` — a thin **vertical** bone bar (only the center 45–55% column shows).
- `.revealer .revealer-2 { position:absolute; inset:0; transform:rotate(90deg); width:100%; height:100%; background-color: var(--paper); clip-path:polygon(45% 0%, 55% 0%, 55% 100%, 45% 100%); }` — same clip but **rotated 90°**, so it reads as a thin **horizontal** bar. The two bars together form a small bone **plus (+) / cross**.

**Lenis boilerplate CSS** (recommended): `html.lenis, html.lenis body { height:auto; } .lenis.lenis-smooth { scroll-behavior:auto !important; } .lenis.lenis-stopped { overflow:hidden; }`

**Responsive (`@media (max-width:900px)`):** `.hero h1 { font-size:42px; letter-spacing:0; }`; `.header-row { height:100px; }` and `.header-row h1 { font-size:60px; letter-spacing:0; }`; `.header-info p { font-size:24px; }`; `.website-content h1 { font-size:48px; padding:1em; }`; and re-center the revealer: `.revealer { left:50% !important; width:100px; height:100px; margin-top:400px; }`.

## GSAP effect (be exact)

### Lenis ↔ ScrollTrigger wiring
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Lenis drives scrolling; GSAP's ticker drives Lenis (seconds → ms, hence `* 1000`); every Lenis scroll calls `ScrollTrigger.update`.

Then create **six** ScrollTriggers, in this order:

**1. Pin `.pinned`.**
```js
ScrollTrigger.create({
  trigger: ".pinned",
  start: "top top",
  endTrigger: ".whitespace",
  end: "bottom top",
  pin: true,
  pinSpacing: false,
});
```
The `.pinned` section (with the revealer) sticks to the top of the viewport from the moment its top hits the top, until the **bottom of `.whitespace`** reaches the top of the viewport. `pinSpacing:false` so it doesn't add layout space.

**2. Pin `.header-info`.**
```js
ScrollTrigger.create({
  trigger: ".header-info",
  start: "top top",
  endTrigger: ".whitespace",
  end: "bottom top",
  pin: true,
  pinSpacing: false,
});
```
Same end point as the first pin, so the dark editorial block (paragraph + 4 thumbnails) stays frozen behind the revealer across the entire whitespace runway. `pinSpacing:false`.

**3. Rotate the revealer 0° → 360°.**
```js
ScrollTrigger.create({
  trigger: ".pinned",
  start: "top top",
  endTrigger: ".header-info",
  end: "bottom bottom",
  onUpdate: (self) => {
    const rotation = self.progress * 360;
    gsap.to(".revealer", { rotation });
  },
});
```
No `scrub`. On every scroll update it fires a `gsap.to(".revealer", { rotation })` with **GSAP defaults** (duration ≈ 0.5s, ease `power1.out`) — this gives the rotation a slight trailing/catch-up smoothing (unlike the instant tweens below). Progress is measured from `.pinned` top-top to `.header-info` bottom-bottom.

**4. Expand the cross into a solid square via `clip-path`.**
```js
ScrollTrigger.create({
  trigger: ".pinned",
  start: "top top",
  endTrigger: ".header-info",
  end: "bottom bottom",
  onUpdate: (self) => {
    const p = self.progress;
    const clipPath = `polygon(
      ${45 - 45 * p}% ${0}%,
      ${55 + 45 * p}% ${0}%,
      ${55 + 45 * p}% ${100}%,
      ${45 - 45 * p}% ${100}%
    )`;
    gsap.to(".revealer-1, .revealer-2", { clipPath, ease: "none", duration: 0 });
  },
});
```
Same trigger window as #3. As progress 0 → 1, each bar's clip left edge goes **45% → 0%** and right edge **55% → 100%**, so both bars widen from thin strips into the full 120×120 box. Because one bar is rotated 90°, the pair morphs from a small plus into a **filled white square**. `duration:0, ease:"none"` → the clip is bound instantly to scroll (no smoothing lag).

**5. Drift the revealer horizontally `left:35% → 50%` (toward center).**
```js
ScrollTrigger.create({
  trigger: ".header-info",
  start: "top top",
  end: "bottom 50%",
  scrub: 1,
  onUpdate: (self) => {
    const left = 35 + (50 - 35) * self.progress;
    gsap.to(".revealer", { left: `${left}%`, ease: "none", duration: 0 });
  },
});
```
Scrubbed with `scrub:1` (≈1s smoothing). While `.header-info` travels from top-top to bottom-at-50%-of-viewport, the revealer's `left` interpolates 35% → 50%, sliding it to horizontal center. `duration:0, ease:"none"` inside the update, so the smoothing comes purely from `scrub:1`.

**6. Scale the revealer up `1× → 13×` to white-out the screen.**
```js
ScrollTrigger.create({
  trigger: ".whitespace",
  start: "top 50%",
  end: "bottom bottom",
  scrub: 1,
  onUpdate: (self) => {
    const scale = 1 + 12 * self.progress;
    gsap.to(".revealer", { scale, ease: "none", duration: 0 });
  },
});
```
Scrubbed `scrub:1`. Over `.whitespace` (from its top reaching 50% of the viewport to its bottom reaching the bottom), the now-solid white square scales `1 → 13`, ballooning to cover the whole viewport — a white wipe. Because `.website-content` is a white panel at `z-index:10`, the enlarged white square hands off seamlessly into the final content section as it scrolls up.

### Net choreography (top → bottom scroll)
Hero "Symphonia" → dark "Motion / Stills" headers scroll past → `.header-info` and `.pinned` both **pin**; the tiny white cross **spins 360°** while its clip-path **expands into a solid square**, meanwhile **drifting** left→center → then over the whitespace it **scales ~13×** into a full white-out → the white `.website-content` is revealed. All reversible on scroll-up (scrubbed triggers reverse; the two `onUpdate`-driven triggers track progress both ways).

## Assets / images
- **1 hero background:** an atmospheric full-bleed photograph (landscape, cropped with `background-size:cover`). Its own colour does not matter — the CSS greyscales it and multiplies the warm red over it — but its **tonal structure** does: keep the middle of the frame quiet so the display title reads.
- **4 editorial thumbnails** for the `.header-images` row: matched editorial/photographic images, each cropped into a wide cell (~250px tall, `object-fit:cover`), so roughly landscape 3:2–16:9 crops. They should read as one cohesive editorial set (elegant, muted).

No brand marks or logos — neutral placeholder imagery only. Total **5 images**: `hero.jpg` plus `img-1.jpg … img-4.jpg`.

## Behavior notes
- Page-level component: Lenis hijacks the whole-page scroll for smoothing.
- The tall section heights (`.info` 150vh, `.whitespace` 300vh, `.pinned` 250vh absolute at `top:100vh`) are what create the scroll runway — keep them; the ScrollTrigger start/end/endTrigger relationships depend on this stacking and on `.pinned` being `position:absolute; top:100vh; z-index:2` while `.whitespace` is `z-index:-1` and `.website-content` is `z-index:10`.
- The two pins share the **same end** (`.whitespace` bottom top), so the dark block and the revealer stay locked together through the whole reveal.
- Rotation (trigger #3) is intentionally the only motion using GSAP's default eased `gsap.to` (a soft ~0.5s catch-up); clip-path, left and scale all use `duration:0, ease:"none"` so they bind tightly to scroll (smoothing on #5/#6 comes from `scrub:1`).
- On `max-width:900px` the revealer is re-centered (`left:50%`) and shrunk (100×100, `margin-top:400px`); headings shrink substantially. Effect still works because all revealer transforms are percentage/scale based.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/epic-scroll-anims-scrolltrigger-gsap/hero.jpg
https://motionprompts.dev/c/epic-scroll-anims-scrolltrigger-gsap/img-1.jpg
https://motionprompts.dev/c/epic-scroll-anims-scrolltrigger-gsap/img-2.jpg
https://motionprompts.dev/c/epic-scroll-anims-scrolltrigger-gsap/img-3.jpg
https://motionprompts.dev/c/epic-scroll-anims-scrolltrigger-gsap/img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--accent`, `--graphite`, `--gray`, `--gutter`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a single script that boots on `DOMContentLoaded`, wires Lenis straight into GSAP's ticker, and drives six `ScrollTrigger.create()` calls that address `.pinned`, `.header-info`, `.whitespace` and the `.revealer` cross purely through selector strings — there is no `document.querySelector` anywhere in this file. It never has to undo any of it: the tab closes and the browser reclaims everything. React withdraws that guarantee the moment this becomes a component, and it does it quietly — the story scrubs correctly on first load, and the damage only shows up on a second mount or a real route change.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. By the time that first unmount lands, this effect has already stood up one `Lenis` instance, a `gsap.ticker` callback pumping it every frame, two pinned triggers sharing the same `.whitespace` end point, and four more triggers that each fire a fresh `gsap.to()` on every `onUpdate`. Undo it incompletely and the remount leaves two Lenis instances fighting over the same wheel event, two ticker callbacks each calling `.raf()`, and two copies of the `.pinned` / `.header-info` pin writing competing transforms onto the same elements — the cross visibly stutters or double-rotates. None of this reproduces in a production build, because React only double-invokes in development.

*(1) The entry point* — the whole body (Lenis construction, the ticker wiring, `gsap.registerPlugin`, and the six `ScrollTrigger.create` calls) sits inside a bare `document.addEventListener("DOMContentLoaded", ...)` with no `readyState` check. A React component mounts well after that event has already fired, so the listener registers and is never called: no Lenis instance, no pins, a `.revealer` that never rotates. Delete the listener and move its entire body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can move to module scope — it only needs to run once, not once per mount.

*(2) Element lookups* — this script never calls `document.querySelector`; every target is a selector string handed straight to `ScrollTrigger.create({ trigger: ".pinned", endTrigger: ".header-info", ... })` or `gsap.to(".revealer-1, .revealer-2", ...)`. That doesn't make it exempt from scoping — it changes the fix. Wrap the whole effect body in `gsap.context(() => { ... }, rootRef)`: GSAP resolves selector text used inside that factory — including the `trigger` and `endTrigger` strings ScrollTrigger reads — against the context's own scope, so `.pinned`, `.header-info`, `.whitespace` and `.revealer` all resolve to the elements inside your component's root, not to whatever half-detached `.pinned` a StrictMode remount left behind in the document. You never have to rewrite a single selector string to get this; the scoping comes from where the calls run, not from how they're spelled.

*(3) Cleanup* — `ctx.revert()` handles less of this component's live state than it looks like it should:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, plugin registration, all six ScrollTrigger.create calls
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Both pins run with `pinSpacing: false`, so there is no pin-spacer element for `ctx.revert()` to remove — but ScrollTrigger still rewrites `.pinned` and `.header-info`'s own inline transform for as long as each stays pinned, and reverting the trigger is what restores it. Leave a second pin alive after a bad remount and you get two triggers writing to the same transform from two different scroll positions at once.

`gsap.ticker.add((time) => lenis.raf(time * 1000))` is the trap this catalogue keeps running into: a ticker subscription is neither a tween nor a trigger, so the context never records it, and `ctx.revert()` leaves it calling `.raf()` on a `Lenis` instance you are about to destroy. Keep the function reference, remove it before destroying Lenis, and destroy Lenis before reverting the context:

```jsx
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

The four progress-driven triggers open a second gap `ctx.revert()` doesn't close. Their `onUpdate` callbacks aren't part of the factory's synchronous run — they fire later, from inside ScrollTrigger's own scroll handling — so every `gsap.to()` they create is a tween the context never saw and therefore never reverts. Three of the four (the clip-path expansion and the left and scale drifts) set their own tween length to zero and turn off easing entirely, so each one resolves on the very next tick regardless. The rotation trigger doesn't: its call to `gsap.to(".revealer", { rotation })` overrides neither the tween length nor the easing, so GSAP falls back to its own multi-hundred-millisecond eased tween. Scroll to a stop mid-gesture at the exact moment a StrictMode remount — or a real route change — tears the effect down, and that tween keeps writing `rotation` onto `.revealer` for the rest of its run, into a component that no longer owns that element. Kill both targets explicitly, alongside the revert, rather than trusting the trigger's own teardown to reach into them:

```jsx
return () => {
  gsap.killTweensOf(".revealer");
  gsap.killTweensOf(".revealer-1, .revealer-2");
  gsap.ticker.remove(onTick);
  lenis.destroy();
  ctx.revert();
};
```

Lenis itself is the resource this effect owns outright — nothing here suggests a shared, app-level instance the way a partial-page component would. Construct it inside the effect exactly as shown and destroy it in the cleanup above; the single-instance-per-page constraint is a document-level concern, already addressed above under "Using this outside its demo page."
