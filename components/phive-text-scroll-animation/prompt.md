# Giant Stretching Text Scroll Animation

## Goal

Build a scroll-driven typographic page: a sequence of full-screen pinned sections where a single giant uppercase word vertically stretches open (scaleY from 0 to the exact scale that fills the viewport) as the section scrolls into view, then collapses back to 0 while pinned. The final section instead blows the whole word block up 10x, cross-fades its dark backdrop away to reveal a full-bleed background photo, and finishes with a headline that reveals word-by-word via SplitText.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) with the GSAP plugins `ScrollTrigger` and `SplitText`, plus `lenis` for smooth scrolling. No build framework needed beyond a Vite-style dev server that resolves npm imports.

## Layout / HTML

Five stacked `<section>` elements, each `100vw` x `100svh`:

1. `<section class="hero">` — `<h1>This space intentionally loud</h1>`
2. `<section class="sticky-text-1">` — `<div class="text-container"><h1>Overdrive</h1></div>`
3. `<section class="sticky-text-2">` — `<div class="text-container"><h1>Static</h1></div>`
4. `<section class="sticky-text-3">` — three children, in this order:
   - `<div class="bg-img"><img src="..." alt=""></div>` (the background photo)
   - `<div class="text-container"><h1>Friction</h1></div>`
   - `<div class="header"><h1>Overdrive always breaks the system</h1></div>`
5. `<section class="outro">` — `<h1>End of transmission</h1>`

Load the script with `<script type="module" src="./script.js">`.

## Styling

- Palette as CSS custom properties on `:root`: `--dark: rgba(17, 39, 11, 1)` (near-black green) and `--light: rgba(162, 255, 91, 1)` (acid lime green).
- Font: "Roboto Condensed" (Google Fonts, full variable weight range), applied to `body`. Global reset (`* { margin:0; padding:0; box-sizing:border-box }`).
- All `h1`: `text-transform: uppercase; font-size: 5rem; font-weight: 900; letter-spacing: -0.02em; line-height: 0.85; text-align: center;`.
- `img { width:100%; height:100%; object-fit: cover; }`.
- Every `section`: `position: relative; width: 100vw; height: 100svh; overflow: hidden;`.
- `.hero` and `.outro`: flex-centered, background `var(--dark)`, color `var(--light)`, their `h1` at `width: 50%`.
- `.sticky-text-1` and `.sticky-text-2`: background `var(--light)`, color `var(--dark)`.
- `.sticky-text-3`: color `var(--light)`; its `.text-container` additionally gets `background-color: var(--dark)` (this dark plate is what fades out later).
- `.text-container` and `.bg-img`: `position: absolute; inset: 0 (top:0; left:0); width:100%; height:100%; will-change: opacity, transform; z-index: 1;`.
- `.text-container h1`: `position: relative; left: -0.035em; letter-spacing: -0.05em; transform-origin: 50% 0%; transform: scaleY(0);` — critical: the words start vertically collapsed and stretch from the TOP edge.
- Per-section word sizes: `.sticky-text-1 h1` = `23vw`, `font-weight: 300`; `.sticky-text-2 h1` = `35vw` (weight 900); `.sticky-text-3 .text-container h1` = `27vw`, weight 900. Add `will-change: transform` on the first two.
- `.header`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50%; z-index: 2;` (sits above the text-container).
- Media query `max-width: 1000px`: base `h1` drops to `3rem`; `.hero h1`, `.outro h1` and `.header` get `width: calc(100% - 4rem)`.

## GSAP effect (exhaustive)

Wrap everything in `DOMContentLoaded`. Register `ScrollTrigger` and `SplitText`.

### Lenis smooth scroll

```
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

### SplitText setup

Split the `.header h1` with `SplitText.create(header, { type: "words", wordsClass: "spotlight-word" })` and immediately `gsap.set(split.words, { opacity: 0 })` so the headline starts invisible.

### Dynamic target scale

For each of the three sticky sections compute `targetScales[i] = section.offsetHeight / h1.offsetHeight` (viewport height divided by the rendered text height). Recompute on `window.resize`. This is the scaleY value at which the stretched word exactly fills the section top-to-bottom. Scaling is applied by writing the inline style directly: `element.style.transform = "scaleY(" + scale + ")"` inside ScrollTrigger `onUpdate` callbacks (no tweens — everything is progress-mapped).

### Sections 1 and 2 — stretch in, collapse while pinned

Each of `.sticky-text-1` and `.sticky-text-2` gets TWO ScrollTriggers:

1. **Entry (stretch open):** `trigger: section, start: "top bottom", end: "top top", scrub: 1`. In `onUpdate`, set the h1's `scaleY = targetScale * self.progress` — the word grows from 0 to full viewport height as the section travels up into view.
2. **Pinned (collapse):** `trigger: section, start: "top top", end: "+=" + window.innerHeight + "px", pin: true, pinSpacing: false, scrub: 1`. In `onUpdate`, set `scaleY = targetScale * (1 - self.progress)` — the word squashes back to 0 over one extra viewport of scroll. Because `pinSpacing` is false, the next section slides up and covers the pinned one while it collapses.

### Section 3 — stretch in, then 10x blow-up reveal

1. **Entry:** identical pattern — `trigger: ".sticky-text-3", start: "top bottom", end: "top top", scrub: 1`, `onUpdate` sets the h1 `scaleY = targetScales[2] * self.progress`.
2. **Pinned mega-zoom:** `trigger: ".sticky-text-3", start: "top top", end: "+=" + (window.innerHeight * 4) + "px", pin: true, pinSpacing: true, scrub: 1`. All choreography lives in `onUpdate`, mapped to `self.progress` (0→1 across 4 viewport heights), manipulating the whole `.text-container` (not the h1) via inline styles:
   - **Scale phase, progress 0 → 0.75:** `scaleProgress = progress / 0.75`; apply `transform: scale3d(s, s, 1)` with `s = 1 + 9 * scaleProgress` (i.e. 1 → 10). For progress > 0.75 clamp at `scale3d(10, 10, 1)`.
   - **Backdrop fade, progress 0.25 → 0.5:** the container's `background-color` stays fully opaque `rgba(17, 39, 11, 1)` below 0.25, then its alpha lerps 1 → 0 linearly across [0.25, 0.5] (`alpha = 1 - (progress - 0.25) / 0.25`, clamped 0..1), and stays alpha 0 above 0.5 — revealing the full-bleed photo underneath.
   - **Text fade, progress 0.5 → 0.75:** the container's `opacity` lerps 1 → 0 across [0.5, 0.75] (`opacity = 1 - (progress - 0.5) / 0.25`); stays 0 above 0.75.
   - **At progress 0 reset:** background back to opaque dark, opacity back to 1.
   - **Headline word reveal, progress 0.75 → 0.95:** map `textProgress = (progress - 0.75) / 0.2`. For each SplitText word at `index`, show it with a hard cut (no fade tween): `opacity = textProgress >= index / totalWords ? 1 : 0` via `gsap.set(word, { opacity })` — words pop in sequentially left-to-right. Below 0.75 force all words `opacity: 0`; above 0.95 force all `opacity: 1`.

No eases, durations or staggers apply anywhere — every value is a pure linear function of ScrollTrigger progress with `scrub: 1` providing ~1s of smoothing/lag.

## Assets / images

One image: a full-bleed background photograph (landscape orientation, roughly 16:9 or wider, moody/atmospheric works well) that fills the third section behind the dark plate and is revealed as the plate fades out. It is displayed with `object-fit: cover` inside an absolutely positioned full-viewport wrapper.

## Behavior notes

- The whole page hijacks native scroll via Lenis; ScrollTrigger updates on Lenis's `scroll` event.
- Target scales recompute on resize so words always stretch exactly to viewport height.
- Sections 1–2 use `pinSpacing: false` (next section overlaps them); section 3 uses `pinSpacing: true` and consumes 4 extra viewport heights of scroll.
- Total flow: hero → word 1 stretches/collapses → word 2 stretches/collapses → word 3 stretches, zooms 10x, dark plate fades, photo reveals, headline appears word-by-word → outro.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/phive-text-scroll-animation/img.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--dark`, `--signal`, `--paper`, `--muted`, `--light`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Mount this component twice without tearing the first pass down and you get two `Lenis` instances both pumping `raf` off the same `gsap.ticker`, twelve `ScrollTrigger` instances instead of six — for `.sticky-text-1` and `.sticky-text-2` that means two independent progress trackers racing to write conflicting `scaleY` values onto the same `h1` on every scrub frame, and for `.sticky-text-3` it means two `pin: true` triggers with `pinSpacing: true` stacked on the same section, doubling the four extra viewport-heights of scroll it consumes — plus a second, un-reverted `SplitText.create` pass on `.header h1` that does not re-split plain text on the second mount: it wraps the first run's `.spotlight-word` spans in a fresh layer of `.spotlight-word` spans, so the word-count-driven reveal (`index / totalWords` in the final trigger's `onUpdate`) ends up walking a different node set than the one whose opacity is actually visible. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener body — the `Lenis` construction and ticker wiring, the header split, `calculateDynamicScale`, the resize listener, and the six `ScrollTrigger.create` calls — never runs: the three words sit permanently collapsed at `scaleY(0)`, with nothing in the console to explain why. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its body directly into a `useEffect` with an empty dependency array. Hoist `gsap.registerPlugin(ScrollTrigger, SplitText)` out to module scope above the component — the source calls it from inside the listener, but it is one-time, page-wide registration, not per-mount state.

*(2) Element lookups* — Every lookup here is a bare `document.querySelector`: `.header h1` (the split target), the three `.sticky-text-{1,2,3} .text-container h1` nodes (`textElement1`/`2`/`3`), `.sticky-text-3 .text-container` (`textContainer3`), and — inside `calculateDynamicScale`, which runs once at setup and again on every `resize` — the paired `.sticky-text-${i}` / `.sticky-text-${i} .text-container h1` for `i` from 1 to 3. Give the component a root ref on the wrapper containing all five sections (`.hero` through `.outro`) and resolve every one of those through it instead of through `document`. During the StrictMode remount two copies of the section markup exist for an instant; an unscoped lookup can hand `calculateDynamicScale` the outgoing copy's `offsetHeight` while the triggers that read `targetScales` a moment later are scrubbing the incoming copy, so the word stretches to the wrong fraction of the viewport.

*(3) Cleanup* — Wrap the Lenis wiring, the header split, `calculateDynamicScale`'s first call, and all six `ScrollTrigger.create` calls in one `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const lenis = new Lenis();
  const driveLenis = (time) => lenis.raf(time * 1000);
  let headerSplit = null;
  const targetScales = [];

  function calculateDynamicScale() {
    for (let i = 1; i <= 3; i++) {
      const section = rootRef.current.querySelector(`.sticky-text-${i}`);
      const text = rootRef.current.querySelector(`.sticky-text-${i} .text-container h1`);
      if (!section || !text) continue;
      targetScales[i - 1] = section.offsetHeight / text.offsetHeight;
    }
  }

  const ctx = gsap.context(() => {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(driveLenis);
    gsap.ticker.lagSmoothing(0);

    const header = rootRef.current.querySelector(".header h1");
    if (header) {
      headerSplit = SplitText.create(header, { type: "words", wordsClass: "spotlight-word" });
      gsap.set(headerSplit.words, { opacity: 0 });
    }

    calculateDynamicScale();
    // the six ScrollTrigger.create calls, each `trigger` and each h1 /
    // .text-container reference resolved through rootRef.current.querySelector
  }, rootRef);

  window.addEventListener("resize", calculateDynamicScale);

  return () => {
    window.removeEventListener("resize", calculateDynamicScale);
    gsap.ticker.remove(driveLenis);
    lenis.destroy();
    ctx.revert();
    headerSplit?.revert();
  };
}, []);
```

`ctx.revert()` kills all six triggers — unpinning `.sticky-text-3` and dropping its spacer, restoring `.sticky-text-1`/`2` to their unpinned layout — and reverts every inline `transform`/`opacity`/`background-color` the `onUpdate` callbacks wrote via `element.style` and `gsap.set`. It does not reach `gsap.ticker.add(driveLenis)`: a ticker subscription is neither a tween nor a trigger, so without the explicit `gsap.ticker.remove` above, the ticker keeps calling `driveLenis`, and `driveLenis` keeps calling `.raf()` on a `Lenis` instance whose `destroy()` has already run. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — it lives on the Lenis instance's own emitter and goes with `lenis.destroy()`. The window `resize` listener is a plain DOM subscription the context never tracked either way, hence the explicit `removeEventListener`.

`headerSplit.revert()` has to run after `ctx.revert()`, not before: while the triggers are still live, the final section's `onUpdate` is still reading `headerSplit.words` on every scrub frame to decide which `.spotlight-word` gets `opacity: 1`, and reverting the split out from under a still-scrubbing trigger unwraps the very spans that callback is about to set opacity on. Revert the split only once the trigger that reads it is gone. Guard the call (`headerSplit?.revert()`) since `header` can be absent and `headerSplit` then stays `null`, exactly as the source's own `if (header)` guard allows.
