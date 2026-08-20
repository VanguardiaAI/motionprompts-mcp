# Frame Collapse Reveal — a full-bleed photo folds into its own window, then a row fans out

## Goal

Build a scroll page whose middle section is sticky and starts as a single full-bleed photograph with a thin rounded frame inset from the edges. Three acts follow, driven by scroll:

1. the frame contracts down to the size of a window in the centre of the screen;
2. the full-bleed photograph **fades out** — and because that centre window is showing the *same* photograph at the *same* screen coordinates, what the eye reads is the picture shrinking to fit the rectangle, while in fact not one pixel has moved;
3. only once the fade has finished, six tall slabs slide out from behind the window towards both sides, innermost pair first, and lock in place. They do not move again.

The second act is the whole idea. Actually shrinking the photo rescales and displaces the subject and reads as a zoom-out; fading it leaves the subject exactly where it was, and the effect becomes "the world cropped itself around the image" rather than "the image changed size".

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scrolling. Register with `gsap.registerPlugin(ScrollTrigger)`.

Lenis wiring (exact pattern):

- `const lenis = new Lenis()` (default options).
- `lenis.on("scroll", ScrollTrigger.update)`.
- `gsap.ticker.add((time) => lenis.raf(time * 1000))`.
- `gsap.ticker.lagSmoothing(0)`.

## Layout / HTML

Three sections in order:

1. `<section class="intro">` — `<p class="label">` ("Reel — 03"), `<h1>` ("One long take, and then the whole roll."), `<p class="lede">` ("The frame closes in. The picture stays exactly where it was.").
2. `<section class="collapse">` — contains `<div class="collapse__pin">` with **four layers, in this order**:
   - `<img class="collapse__bleed">` — the full-bleed photograph.
   - `<div class="collapse__row">` — seven `<figure class="slab">`: three, then `<figure class="slab slab--window">`, then three. The window slab contains an `<img>` with **the same `src` as the bleed** plus a `<figcaption class="slab__card">` holding `<span class="pill">Take 01</span>` and a `<p>` ("The hour before anyone shows up.").
   - `<div class="collapse__frame">` — the frame, `aria-hidden`.
   - (the pin's own background is the fourth layer, underneath everything.)
3. `<section class="outro">` — `<p class="label">` ("Credits") and `<h2>` ("Shot on location, 2025").

While the bleed layer is lit, the window slab is indistinguishable from it: same photo, same crop, same pixels. When the bleed goes out, the only thing still showing photograph is that window.

## Styling

Fonts: **Archivo** (display and body, 400/500/600) and **IBM Plex Mono** (microlabels and the pill), from Google Fonts.

Palette — true black, ivory, one saturated yellow. Photographs are **black and white**, so the yellow is the only colour in the piece.

```css
--paper: #0a0a0a;
--ink: #f4f4f0;
--accent: #ffe500;
--muted: #8c8c88;

--slab-w: min(256px, 20vw);
--slab-h: min(556px, 70svh);
--win-w:  min(632px, 50vw);
--slab-gap: 16px;
```

Global reset; `body` on `--paper` with Archivo, `overflow-x: hidden`. `.label`: IBM Plex Mono, 11px, `.14em` tracking, uppercase, `--accent`. `.intro h1` / `.outro h2`: `clamp(40px, 6.2vw, 86px)`, weight 600, `letter-spacing: -.035em`, `max-width: 14ch`.

The sticky machinery:

- `.collapse { position: relative; height: 360svh; }`, `.collapse__pin { position: sticky; top: 0; height: 100svh; overflow: hidden; background: var(--paper); }`. The motion occupies the first half of the timeline and the second half is stillness on purpose: once the row finishes deploying, the eye needs time to read it before the pin lets go.

**The two photo layers must resolve to the exact same rectangle**, and this is where the effect is won or lost:

```css
.collapse__bleed,
.slab.slab--window img {
  position: absolute; left: 50%; top: 50%;
  width: var(--pw, 100vw); height: var(--ph, 100svh);
  max-width: none; transform: translate(-50%, -50%);
  object-fit: cover;
}
.collapse__bleed { z-index: 1; }
```

`--pw` / `--ph` are written by the script with the pin's real size. It looks like `inset: 0` for the bleed and `100vw / 100svh` for the window would do, but they would not: `100vw` includes the scrollbar and the pin's width does not, so the two layers would resolve rectangles about fifteen pixels apart — and since the trick is that fading one leaves *exactly* the same pixels underneath, fifteen pixels of mismatch shows up as a sideways jump in the very frame that pays the act off.

Note the selector weight: `.slab.slab--window img` and not `.slab--window img`. `.slab img { width:100%; height:100% }` below has the same specificity and would win on order, handing the window back its own 632×556 box. The symptom is baffling and points nowhere near the cascade: the subject appears **twice**, once inside the rectangle and once outside it.

The row and the slabs:

```css
.collapse__row { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; gap: var(--slab-gap); }
.slab { position: relative; flex: 0 0 var(--slab-w); width: var(--slab-w); height: var(--slab-h);
        border-radius: 8px; overflow: hidden; background: #1a1a1a; z-index: 1; will-change: transform; }
.slab img { width: 100%; height: 100%; object-fit: cover; }
.slab--window { flex: 0 0 var(--win-w); width: var(--win-w); z-index: 2; }
```

The window sits **above** its siblings. While they are tucked behind it, it hides them; without that `z-index` you see the edges of six stacked slabs in the centre from the first frame and the fan-out stops being a reveal. Because the row is symmetrical — three equal slabs each side, one gap size — the window's centre coincides with the pin's centre, which is what makes the shared centring above exact.

The label card, glass, on the window:

```css
.slab__card {
  position: absolute; left: 20px; bottom: 20px; width: calc(100% - 40px);
  padding: 18px 20px 20px; border-radius: 10px;
  background: rgba(12,12,12,.40);
  border: 1px solid rgba(255,255,255,.18);
  backdrop-filter: blur(20px) saturate(1.2);
  visibility: hidden;
}
@supports not (backdrop-filter: blur(1px)) { .slab__card { background: rgba(10,10,10,.82); } }
```

**Dark glass, not white**, even on a dark palette. The usual `rgba(255,255,255,.08)` recipe assumes the page background is what shows through; here it is a *photograph*, and this one has half a frame of bright sky — white glass leaves ivory text on white. Tinting dark keeps the card legible over whatever frame lands behind it, which is the only guarantee worth having when an image supplies the backdrop.

**It starts `visibility: hidden` and is switched on, never faded.** Translucent and fading are not the same thing: the panel may be glass, but it must never exist half-painted. Animating its opacity from 0 to 1 means the intermediate frames have the text already there and the panel not yet, so the sentence floats loose on the photograph.

The frame:

```css
.collapse__frame {
  position: absolute; left: 50%; top: 50%; z-index: 3;
  width: calc(100% - 72px); height: calc(100% - 72px);
  transform: translate(-50%, -50%);
  border: 1.5px solid rgba(244,244,240,.85);
  box-shadow: 0 0 0 1px rgba(10,10,10,.16);
  border-radius: 40px; pointer-events: none;
}
```

`translate(-50%,-50%)` and not a fixed `margin`: with a margin, shrinking width and height pins the top-left corner and the frame closes **towards that corner** instead of towards its own centre — 20px of margin on one side against 197 on the other — and no amount of tweaking the animation numbers fixes it. The ivory border plus a 1px dark ring outside gives it a line that survives crossing a photograph that runs from white sky to dark hair.

Responsive under 900px: `--slab-w: min(150px, 26vw)`, `--win-w: min(420px, 62vw)`, `--slab-h: min(440px, 62svh)`, `--slab-gap: 10px`, and the frame inset drops to 40px with a 24px radius.

## GSAP effect (the core — follow exactly)

First, publish the pin's real size and keep it fresh:

```js
const medir = () => {
  pin.style.setProperty("--pw", `${pin.clientWidth}px`);
  pin.style.setProperty("--ph", `${pin.clientHeight}px`);
};
medir();
ScrollTrigger.addEventListener("refreshInit", medir);
```

Then one timeline, positions expressed as fractions of the run:

```js
const linea = gsap.timeline();

// act 1 — the frame contracts to the window's measured box
linea.to(frame, {
  width:  () => ventana.offsetWidth,
  height: () => ventana.offsetHeight,
  borderRadius: 8, ease: "none", duration: 0.14,
}, 0.04);

// act 2 — the bleed goes out; the pin's own black is underneath
linea.to(bleed, { opacity: 0, ease: "none", duration: 0.10 }, 0.20)
     .to(frame, { opacity: 0, ease: "none", duration: 0.05 }, 0.27);

// act 3 — the slabs leave the centre, innermost pair first
lados.forEach((el, i) => {
  const dentro = Math.min(i, lados.length - 1 - i);
  linea.fromTo(el,
    { x: () => salidaDe(el) },
    { x: 0, ease: "power3.out", duration: 0.16, immediateRender: true },
    0.32 + dentro * 0.03);
});

linea.set(card, { visibility: "visible" }, 0.42);
linea.fromTo(card, { y: 24 }, { y: 0, ease: "power2.out", duration: 0.06 }, 0.42);

linea.to({}, { duration: 0.001 }, 0.999);   // pad to duration 1

ScrollTrigger.create({
  animation: linea, trigger: ".collapse",
  start: "top top", end: "bottom bottom",
  scrub: true, invalidateOnRefresh: true,
});
```

with

```js
const salidaDe = (el) => {
  const cx = ventana.offsetLeft + ventana.offsetWidth / 2;
  return cx - (el.offsetLeft + el.offsetWidth / 2);
};
```

The details that are not optional:

- **Measure the fan-out offsets with `offsetLeft`, not `getBoundingClientRect`.** At module-execution time the row is not laid out yet and rect returns zero for all six, so every slab is born already in place and never leaves — which from the outside reads as "the cards are stuck", a symptom that points nowhere near its cause. `offsetLeft` is layout position, unaffected by any `transform`, so it can be asked for at any moment; as a function value GSAP re-reads it on every refresh, so image loads and resizes recompute it.
- **`immediateRender: true` on all six.** Inside a timeline, a `fromTo` does not adopt its start state until its turn arrives unless told to; with it only on the first, the other five are born already positioned and only one is seen to travel.
- **Act 3 starts at 0.32, two hundredths after the fade ends at 0.30.** Move the slabs while the cross-fade is still running and they travel over a photograph that is still visible, and act 2 stops reading.
- **The frame is retired two hundredths before the fade completes.** Left up, it is a drawn border sitting on top of the window's real edge and you see two lines almost touching.
- **`scrub: true`, welded, no lag.** A lagged scrub leaves the bleed layer forever chasing its value, so any frame you stop on has a translucent ghost of the photograph over the window — the picture visible twice at different opacities.
- **Padding the timeline to duration 1** makes the position parameters mean fraction-of-run. In GSAP they are seconds and `scrub` maps progress against the timeline's total duration: without the pad, a timeline lasting 0.48 puts the act written at "0.20" at 42% of the scroll. Half the blind fiddling people do on scrubbed timelines — convinced the problem is the ease — comes from exactly this.

Finally, refresh as images resolve:

```js
document.querySelectorAll("img").forEach((img) => {
  if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
});
```

## Assets / images

- One **black and white** landscape photograph at 16:10, around 2560×1600, used **twice** — as the bleed layer and inside the window. **Its subject must sit near the horizontal centre of the frame**, because the window shows roughly the middle half of it; a subject in the right third gets cut in half by the window edge and the payoff frame looks like an accident. Crop the source accordingly before you ship it rather than trying to fix it with transforms: shifting the shared image sideways far enough to centre an off-centre subject uncovers the edge of the bleed layer, and scaling up to compensate pushes the subject further out again.
- Six **black and white** photographs cropped tall, roughly 1:2.2 (about 512×1112 for a 256×556 slab at 2× pixel density). Mix subjects — a close-up, foliage, cloth, a portrait, a texture — so the row reads as a contact sheet.

## Behavior notes

- **Reduced motion** (`prefers-reduced-motion: reduce`): create no Lenis and no timeline. Set the end state directly — bleed at `opacity: 0`, frame at `opacity: 0`, card `visibility: visible` — so the row is deployed, the photo is sitting in its window and the label is up. That is what the component has to say.
- The still second half of the timeline is part of the design, not padding. Shortening the section so the pin releases the moment the slabs land makes the whole thing feel rushed.
- The component instantiates its own Lenis and owns page scroll. Do not combine it with anything that calls `ScrollTrigger.getAll().kill()`.
