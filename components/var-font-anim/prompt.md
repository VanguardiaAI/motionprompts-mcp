# ScrollTrigger Variable-Font Marquee — Weight Blooms as the Strips Drift

## Goal

Build an editorial scroll page whose centerpiece is a stack of four horizontal image marquees. As you scroll, each strip of images drifts sideways (alternating rows drift opposite directions), and — interspersed among the thumbnails — big uppercase words are split into individual letters whose **variable font-weight is scrubbed from 100 (hairline) to 900 (black)** in a staggered wave. Everything is scroll-scrubbed through Lenis smooth scroll, so the text visibly "fattens up" and the strips slide as a direct function of scroll position.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, the `split-type` package (imported as `SplitType`, this is NOT GSAP SplitText), and `lenis` (npm) for smooth scroll. A Vite-style dev server that resolves npm imports is all that's needed.

## Layout / HTML

```
<div class="container">
  <section class="hero">
    <img src="..." alt="" />              <!-- full-bleed opening image -->
  </section>

  <section class="about">
    <p>Step into a surreal, immersive world where reality and fantasy
       intertwine — striking visuals meeting thought-provoking narratives.</p>
  </section>

  <section class="marquees">
    <div class="marquee-container" id="marquee-1">
      <div class="marquee">
        <div class="item"><img src="..." alt="" /></div>
        <div class="item with-text"><h1>Unique</h1></div>
        <div class="item"><img src="..." alt="" /></div>
        <div class="item"><img src="..." alt="" /></div>
        <div class="item"><img src="..." alt="" /></div>
      </div>
    </div>
    <div class="marquee-container" id="marquee-2">
      <div class="marquee">
        <div class="item"><img src="..." alt="" /></div>
        <div class="item"><img src="..." alt="" /></div>
        <div class="item"><img src="..." alt="" /></div>
        <div class="item with-text"><h1>Release</h1></div>
        <div class="item"><img src="..." alt="" /></div>
      </div>
    </div>
    <div class="marquee-container" id="marquee-3">
      <div class="marquee">
        <div class="item"><img src="..." alt="" /></div>
        <div class="item with-text"><h1>2500</h1></div>
        <div class="item"><img src="..." alt="" /></div>
        <div class="item"><img src="..." alt="" /></div>
        <div class="item"><img src="..." alt="" /></div>
      </div>
    </div>
    <div class="marquee-container" id="marquee-4">
      <div class="marquee">
        <div class="item"><img src="..." alt="" /></div>
        <div class="item"><img src="..." alt="" /></div>
        <div class="item"><img src="..." alt="" /></div>
        <div class="item with-text"><h1>Rarity</h1></div>
        <div class="item"><img src="..." alt="" /></div>
      </div>
    </div>
  </section>

  <section class="services">
    <p>In this meticulously designed dystopian world you'll find stories
       of resilience and intrigue.</p>
  </section>

  <section class="footer">
    <h1>The End</h1>
  </section>
</div>
<script type="module" src="./script.js"></script>
```

Key structural facts the JS/CSS depend on: each `.marquee-container` has a unique `id` (`marquee-1`…`marquee-4`), holds exactly one `.marquee` track, and that track holds 5 `.item` children — four `.item` with an `<img>` and one `.item.with-text` with an `<h1>` word. The word position rotates per row: **row 1** word is 2nd (`Unique`), **row 2** word is 4th (`Release`), **row 3** word is 2nd (`2500`), **row 4** word is 4th (`Rarity`).

## Styling

- **Variable font (required for the effect):** load a display sans that exposes a full weight axis (100–900) as a single variable file. The original uses **"Big Shoulders Display"** — available as a variable webfont on Google Fonts, or self-hosted via `@font-face` with a `.ttf`/`.woff2` weight-variable file. Apply it to `html, body` as the global `font-family`. The weight axis MUST be continuous, otherwise the fontWeight tween won't interpolate.
- Global reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`.
- `html, body`: `width: 100%; height: 100%; overflow-x: hidden;` plus the variable font-family.
- `img { width: 100%; height: 100%; object-fit: cover; }`.
- Palette: warm olive-tan `#87795f`, near-black `#13120e`, pure white `#fff`.
- `p`: `font-size: 42px; font-weight: 500; text-transform: uppercase;`.
- Every `section`: `width: 100%; height: 100vh;`.
- `section.about`, `section.services`: `padding: 4em; background: #87795f;`.
- `section.footer`: flex-centered, `background-color: #13120e; color: #87795f;`. Its `h1`: `font-size: 10vw; text-transform: uppercase;`.
- `section.marquees`: `height: 150vh; display: flex; flex-direction: column; justify-content: center; background-color: #fff;` (the white plate the strips live on; taller than one viewport so the strips scroll through it).
- `.marquee-container`: `position: relative; width: 125%; height: 250px; display: flex; gap: 1em; margin-bottom: 1em; overflow: hidden;`. **The 125% width intentionally overflows the viewport** so the strip has slack to slide horizontally; `overflow: hidden` crops it.
- `.marquee`: `width: 100%; height: 100%; position: absolute; top: 50%; left: 0; transform: translateY(-50%); display: flex; gap: 1em;`.
- `#marquee-1 .marquee, #marquee-3 .marquee { left: -15%; }` — rows 1 and 3 start pre-shifted 15% to the left (only these two).
- `.item`: `flex: 1; display: flex; justify-content: center; align-items: center;`.
- `.item.with-text`: `flex: 1.5;` (the word cell is wider than the image cells).
- `.item h1`: `text-transform: uppercase; font-size: 140px;`.
- Include the standard Lenis helper CSS: `html.lenis, html.lenis body { height: auto; }`, `.lenis.lenis-smooth { scroll-behavior: auto !important; }`, `.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }`, `.lenis.lenis-stopped { overflow: hidden; }`, `.lenis.lenis-smooth iframe { pointer-events: none; }`.
- Responsive `@media (max-width: 900px)`: `section.marquees` → `height: 100vh`; `.marquee-container` → `width: 250%; height: 150px`; `#marquee-2 .marquee, #marquee-4 .marquee { left: -35%; }`; `.item.with-text { flex: 1; }`; `.item h1 { font-size: 60px; }`.

## GSAP effect (be exhaustive)

Wrap everything in a `DOMContentLoaded` listener. `gsap.registerPlugin(ScrollTrigger)`.

### 1. Split the words into characters

`const splitText = new SplitType(".item h1", { types: "chars" });` — SplitType wraps every character of every word `<h1>` in a `.char` span (inline-block), which is what lets each letter carry its own animated `fontWeight`. Run this once, before creating the tweens.

### 2. Per-character font-weight bloom (the star effect)

Define a helper:

```
function animateChars(chars, reverse = false) {
  gsap.fromTo(
    chars,
    { fontWeight: 100 },
    {
      fontWeight: 900,
      duration: 1,
      ease: "none",
      stagger: {
        each: 0.35,
        from: reverse ? "start" : "end",
        ease: "linear",
      },
      scrollTrigger: {
        trigger: chars[0].closest(".marquee-container"),
        start: "50% bottom",
        end: "top top",
        scrub: true,
      },
    }
  );
}
```

Details that matter:
- **Animated property:** `fontWeight` `100 → 900` on each `.char`. Because the font's weight axis is continuous, letters visibly thicken from hairline to black.
- **`ease: "none"`** on the tween and **`ease: "linear"`** on the stagger — the weight ramp is perfectly linear; the scrub supplies the feel.
- **`stagger.each: 0.35`** with **`from`** flipping per row creates a directional wave: when `reverse` is `false` the stagger starts `from: "end"` (last letter blooms first, wave travels right-to-left); when `reverse` is `true` it starts `from: "start"` (first letter first, left-to-right).
- **ScrollTrigger:** triggered by the word's own `.marquee-container`, `start: "50% bottom"` (begins when the row's mid-point hits the bottom of the viewport), `end: "top top"` (finishes when the row's top reaches the top), `scrub: true` — so the weight is a direct, reversible function of scroll.

### 3. Horizontal drift of each marquee strip + wiring the char bloom

Iterate every `.marquee-container` with its index:

```
document.querySelectorAll(".marquee-container").forEach((container, index) => {
  let start = "0%";
  let end   = "-15%";
  if (index % 2 === 0) {           // rows 1 & 3 (0-based even)
    start = "0%";
    end   = "10%";
  }

  const marquee = container.querySelector(".marquee");
  const words   = marquee.querySelectorAll(".item h1");

  gsap.fromTo(
    marquee,
    { x: start },
    {
      x: end,
      scrollTrigger: {
        trigger: container,
        start: "top bottom",
        end: "150% top",
        scrub: true,
      },
    }
  );

  words.forEach((word) => {
    const chars = Array.from(word.querySelectorAll(".char"));
    if (chars.length) {
      const reverse = index % 2 !== 0;   // odd rows reverse the bloom
      animateChars(chars, reverse);
    }
  });
});
```

Details that matter:
- **`x` is animated as a percentage string** (`"0%"`, `"10%"`, `"-15%"`) — GSAP interprets this as a percentage of the strip's own width, not pixels. **Even-index rows (1 & 3)** drift `x: "0%" → "10%"` (rightward); **odd-index rows (2 & 4)** drift `x: "0%" → "-15%"` (leftward). Adjacent rows therefore slide in opposite directions.
- Combined with the CSS `left: -15%` on rows 1 & 3, this opposing motion plus the 125%-wide overflowing strips gives the classic contra-scrolling marquee look.
- **ScrollTrigger for the drift:** `trigger: container`, `start: "top bottom"` (begins as the row enters from the bottom), `end: "150% top"` (ends well after it passes), `scrub: true`. Note this drift trigger has a **wider scroll window** than the char-bloom trigger (which runs `"50% bottom" → "top top"`), so the letters finish blooming before the strip finishes drifting.
- The `reverse` flag passed to `animateChars` is tied to row parity, so the bloom wave direction alternates row to row in sync with the drift direction.

### 4. Lenis smooth scroll wired into GSAP's ticker

```
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Lenis drives the scroll; ScrollTrigger reads it via the `scroll` event, and Lenis's `raf` is stepped from GSAP's ticker (with `lagSmoothing(0)`). This is what makes the scrubbed weight-blooms and drifts feel buttery.

No timeline, no CustomEase, no Three.js, no pinning. Every animation is an independent scrubbed `fromTo` — the two families of tweens (per-strip `x` drift and per-character `fontWeight` bloom) run in parallel, each governed by its own ScrollTrigger.

## Assets / images

17 images total, all `object-fit: cover`, no logos or brand marks:

- **1 hero image** — a full-bleed, surreal/dystopian, dreamlike 3D-rendered scene filling the opening 100vh viewport (portrait-friendly, but it's cropped to cover).
- **16 marquee thumbnails** — surreal dystopian 3D-rendered stills in the same visual family, distributed 4 per row across the 4 strips. In their 250px-tall cells they read as roughly square-to-portrait crops. They interleave with the four word cells (`Unique`, `Release`, `2500`, `Rarity`) exactly in the positions listed in the Layout section.

## Behavior notes

- Whole page hijacks native scroll via Lenis; all animation is scroll-scrubbed and fully reversible (scrolling up un-blooms the weights and reverses the drift).
- The font-weight bloom depends entirely on a **weight-variable font** — with a static font nothing will interpolate, so verify the variable file loads.
- Alternating drift directions come purely from `index % 2` (rows 1 & 3 vs rows 2 & 4); the bloom-wave direction alternates the same way via the `reverse` flag.
- Responsive: on ≤900px the strips get wider (250%) and shorter (150px), the headline size drops to 60px, and rows 2 & 4 gain a `left: -15%`-equivalent pre-shift (`-35%`); the animation logic is unchanged.
- Desktop-first editorial showcase; no reduced-motion branch in the original.

## Images

This component ships with 17 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/var-font-anim/hero.jpg
https://motionprompts.dev/c/var-font-anim/img1.jpg
https://motionprompts.dev/c/var-font-anim/img10.jpg
https://motionprompts.dev/c/var-font-anim/img11.jpg
https://motionprompts.dev/c/var-font-anim/img12.jpg
https://motionprompts.dev/c/var-font-anim/img13.jpg
… 11 more under https://motionprompts.dev/c/var-font-anim/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--surface`, `--surface-2`, `--neon`, `--cyan`, `--paper`, `--muted`, `--font-display`, `--font-body`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two `ScrollTrigger`s scrubbing the same strip's `x`, two font-weight blooms fighting over the same `.char` spans, two `Lenis` instances pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener is never called and the effect never runs — no split, no marquees, no bloom, nothing to debug. Delete the listener and put its body (plugin registration, `animateChars`, the `SplitType` call, the container loop, the `Lenis` wiring) directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — Every lookup here — `new SplitType(".item h1", …)`, `document.querySelectorAll(".marquee-container")`, `container.querySelector(".marquee")`, `marquee.querySelectorAll(".item h1")`, `word.querySelectorAll(".char")`, and `chars[0].closest(".marquee-container")` inside `animateChars` — assumes this component owns the document. Give the component a root `ref` on the `.container` element, and scope the two top-level queries (the `SplitType` selector and the `.marquee-container` list) to it; the rest are already relative (`container.querySelector`, `word.querySelectorAll`, `closest`) and stay correct once the root ones are scoped. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of the four-row `.marquee-container` subtree exist for an instant, and an unscoped `querySelectorAll` will collect both, doubling every tween this effect creates.

*(3) Cleanup* — Everything the effect creates must be undone in the function it returns. The test of a correct adaptation is not that it looks right on first load — it is that you can navigate away to another route and come back and nothing has accumulated.

**GSAP / ScrollTrigger.** Wrap the whole body — the `animateChars` helper's `fromTo`, the per-container drift `fromTo`, and their `scrollTrigger` configs — in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* animateChars, the SplitType call, the marquee-container loop */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

This component creates two independent families of scrubbed tweens per row — one drift tween on `.marquee` (its `x` goes from one percentage string to another) and one `fontWeight` tween per word's `.char` set — each with its own `scrollTrigger`. `ctx.revert()` unwinds all of them in one call: every `ScrollTrigger` this effect registered, and the inline `transform`/`font-weight` styles GSAP wrote on the strips and the characters. Nothing here needs `ctx.add`/`self.add` — every trigger is created synchronously in the loop, none of it is a named method invoked later from an event listener — so don't introduce it. Without the revert, the StrictMode remount leaves four extra `ScrollTrigger`s (one per row) plus one per bloomed word, all scrubbing against the same scroll position as the surviving set.

**`gsap.ticker.add` is not covered by the context.** This component's `Lenis` instance is stepped from GSAP's ticker rather than its own `requestAnimationFrame` loop:

```js
gsap.ticker.add((time) => lenis.raf(time * 1000));
```

That callback is neither a tween nor a trigger, so `gsap.context` never records it and `ctx.revert()` leaves it running — it will keep calling `.raf()` on a `Lenis` instance the same cleanup is about to destroy. Keep the function reference and remove it explicitly, in the same cleanup, before (or as part of) destroying `Lenis`:

```js
const scrub = (time) => lenis.raf(time * 1000);
gsap.ticker.add(scrub);
// ...
return () => {
  gsap.ticker.remove(scrub);
  lenis.destroy();
  ctx.revert();
};
```

`gsap.ticker.lagSmoothing(0)` is a global ticker setting, not a per-instance subscription — it needs no counterpart in cleanup, but calling it once at module scope (next to `gsap.registerPlugin`) instead of inside every mount avoids reapplying it on each StrictMode pass for no reason.

**Lenis.** This page has exactly one `Lenis` instance and nothing else on it claims the scroll, so creating it inside this effect and destroying it in the cleanup is the right shape (there is no app shell here to lift it to). `lenis.on("scroll", ScrollTrigger.update)` has no matching `.off()` call in the original script; that's fine only because `lenis.destroy()` tears down the emitter that subscription lives on, so destroying it in the cleanup — after removing the ticker callback above — retires the listener along with everything else. Keep the two in the order shown: remove the ticker step first, then destroy `Lenis`, then revert the GSAP context, so nothing calls into an instance that already stopped existing.

**SplitType.** `new SplitType(".item h1", { types: "chars" })` runs once against all four rows' headline words and wraps every letter of `Unique`, `Release`, `2500`, and `Rarity` in its own `.char` span — that's the DOM `animateChars` and the container loop both depend on afterward (`word.querySelectorAll(".char")`, `chars[0].closest(".marquee-container")`). Call it once inside the effect and revert it (`splitText.revert()`) in the cleanup, ordered before `ctx.revert()` if you keep the reference outside the context, or inside the `gsap.context` factory if you create it there — either way, the split has to be undone before or together with the tweens that target the `.char` nodes it created, never after some of them have already been reverted. Skipping the revert means a StrictMode remount finds `.item h1` already split, re-splits the already-split spans, and the wave of nested single-letter wrappers breaks `word.querySelectorAll(".char")` — it now matches a mix of outer and inner spans, so the stagger runs against the wrong count of elements. This component's whole effect is animating a font-weight axis on those spans, so treat the split as fully owned by this effect, not a one-time page mutation you can leave in place.
