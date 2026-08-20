# Infinite Column Wall — endless vertical belts that ratchet open into a corridor

## Goal

Build a scroll page whose middle section is sticky and filled with six columns of photographs. Each column is an endless belt scrolling vertically on its own clock — column 1 up, column 2 down, column 3 up — that never stops and is not attached to the scroll at all; the top and bottom edges dissolve into the background instead of being cut off. As the user scrolls through the section, three things happen: the background darkens to near-black, a headline that was living *behind* the grid turns lime, and the columns slide apart as two rigid blocks of three until only one column is left peeking in from each edge. Scrolling back up rewinds the colour but **not** the opening: the corridor stays open.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scrolling. Register with `gsap.registerPlugin(ScrollTrigger)`.

Lenis wiring (exact pattern — the belts run on GSAP's ticker and the scroll-driven parts run off ScrollTrigger; give Lenis its own rAF loop and the two clocks drift a frame apart and the whole wall judders):

- `const lenis = new Lenis()` (default options).
- `lenis.on("scroll", ScrollTrigger.update)`.
- `gsap.ticker.add((time) => lenis.raf(time * 1000))`.
- `gsap.ticker.lagSmoothing(0)`.

## Layout / HTML

Three sections in order:

1. `<section class="intro">` — `<p class="label">` ("Archive — 02"), `<h1>` ("Nine thousand frames, and not one of them sitting still."), `<p class="lede">` ("Six belts running on their own clock. Scroll opens the corridor.").
2. `<section class="wall">` — contains `<div class="wall__pin">`, which contains, **in this order**:
   - `<div class="wall__ground">` — the dark layer that fades in.
   - `<h2 class="wall__title">` — "Everything on file, moving at once".
   - `<div class="wall__cols">` — **left empty in the HTML**; the script fills it.
3. `<section class="outro">` — `<p class="label">` ("Index") and `<h2>` ("Browse the full catalogue") on the near-black background.

The grid is built in JS, not written by hand: six columns × seven tiles × two laps is 84 `<figure>` elements, and hand-written nobody maintains the rule that stops a photograph appearing twice on one screen.

## Styling

Fonts: **Anton** (the two big headlines and the wall title, weight 400, uppercase), **Archivo** (body, 400/500/600) and **Space Mono** (microlabels), all from Google Fonts.

Palette — a cold bone neutral, true black, and one saturated lime with cobalt as the microlabel colour. The photographs are **black and white** so that the lime is the only colour that appears when the ground goes dark.

```css
--paper: #f0ede4;
--ink: #0d0d0d;
--lime: #c6f21e;
--cobalt: #1141ff;
--muted: #8c8c88;

--tile-w: 179px;   /* the grid — the script measures the real step from the DOM */
--tile-h: 230px;
--gutter: 52px;
```

Global reset, `body` on `--paper` with Archivo and `overflow-x: hidden`. `.label`: Space Mono, 11px, `.14em` tracking, uppercase, `--cobalt`. `.intro h1` is `clamp(44px, 7.4vw, 104px)` Anton, `line-height: .92`, uppercase, `max-width: 13ch`. `.outro` is `min-height: 80svh` on `--ink` with `--paper` type.

The sticky machinery:

- `.wall { position: relative; height: 300svh; }` and `.wall__pin { position: sticky; top: 0; height: 100svh; overflow: hidden; background: var(--paper); }` — 200svh of travel, which is what a long opening needs so it does not feel like a yank.
- `.wall__ground { position: absolute; inset: 0; background: var(--ink); opacity: 0; }` — a separate layer rather than animating the pin's own `background`, because the pin is also the element that clips, and a colour animated on it cannot be faded without dragging its contents along.
- `.wall__title { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 0; width: min(20ch, 92vw); text-align: center; font-family: Anton; text-transform: uppercase; font-size: clamp(36px, 6vw, 84px); line-height: .94; color: #b9b4a6; }`

**The headline lives underneath the columns** (`z-index: 0` against the columns' `1`). That is why it is legible only in fragments through the 52px gutters while the wall is closed, and whole once the columns part. Put it on top and there is no opening to celebrate — it reads the same from the first frame.

```css
.wall__cols {
  position: absolute; inset: 0; z-index: 1;
  display: flex; justify-content: center; gap: var(--gutter);
  mask-image: linear-gradient(to bottom, transparent 0, #000 23%, #000 87%, transparent 100%);
}
.wall__col { width: var(--tile-w); flex: 0 0 var(--tile-w); will-change: transform; }
.wall__cinta {
  display: flex; flex-direction: column;
  gap: var(--gutter); padding-bottom: var(--gutter);
  will-change: transform;
}
.wall__cinta figure { flex: 0 0 auto; width: var(--tile-w); height: var(--tile-h); overflow: hidden; background: #d8d4c8; }
.wall__cinta img { width: 100%; height: 100%; object-fit: cover; }
```

Two layers per column and not one: the outer `.wall__col` moves horizontally with scroll, the inner `.wall__cinta` runs vertically on time. They are two mechanics with two different clocks, and on the same element the last `transform` written wins and one of them silently disappears.

**That `padding-bottom` on the belt is load-bearing, not air.** The content is duplicated, so the belt is two laps tall. Without the trailing gutter its height is `2N·H + (2N−1)·G`, and half of that falls half a gutter short of one whole lap — the loop would rejoin with a 26px jump every time round. With the extra gutter the height is exactly `2N·(H+G)`, so the animation can run from `yPercent: 0` to `-50` and that is precisely one lap, at any screen size, with nothing measured.

Responsive: `--tile-w/--tile-h/--gutter` drop to `128/165/32` under 900px and `92/118/20` under 560px.

## GSAP effect (the core — follow exactly)

### 1. Building the grid

Six columns; each holds a belt with the seven tiles repeated **twice**:

```js
const N_COLS = 6, POR_COL = 7, BANCO = 24;
// …for c in 0..5, for vuelta in 0..1, for i in 0..6:
img.src = `/path/tile-${((c + i * N_COLS) % BANCO) + 1}.jpg`;
```

`(c + i·6) % 24` is the whole point of the distribution: in one *row* the six columns take six consecutive bank indices, and the three rows that fit on screen at once take eighteen of the twenty-four — so no photograph can appear twice on the same screen. With a bank of twelve (the obvious first try) each photo shows up three or four times and the wall reads as a repeating pattern instead of an archive.

Record each column's direction as `sube: c % 2 === 0`.

### 2. The belts — time, not scroll

```js
columnas.forEach(({ cinta, sube }, c) => {
  gsap.fromTo(cinta,
    { yPercent: sube ? 0 : -50 },
    { yPercent: sube ? -50 : 0, duration: 34 + c * 3, ease: "none", repeat: -1 });
});
```

`repeat: -1` with `yPercent: ±50` wraps invisibly because the content is duplicated: when the belt has travelled one lap, what fills the screen is the copy, so snapping back to zero is not perceptible. Durations differ per column (34, 37, 40, 43, 46, 49 seconds); make them equal and all six beat in the same time signature — the wall pulses instead of flowing.

Attaching this to scroll is the mistake to avoid. Scroll-driven belts stop the moment the finger stops, and they run out of travel before the section does, which opens gaps at the ends.

### 3. The opening — a ratchet, in two rigid blocks

```js
const paso = () => columnas[1].col.offsetLeft - columnas[0].col.offsetLeft; // width + gutter
const salto = () => 2 * paso();

const linea = gsap.timeline({ paused: true });
columnas.forEach(({ col }, c) => {
  const izquierda = c < N_COLS / 2;
  linea.fromTo(col, { x: 0 },
    { x: () => (izquierda ? -1 : 1) * salto(), ease: "none", duration: 0.62, immediateRender: true },
    0.24);
});
linea.to({}, { duration: 0.001 }, 0.999);   // pad the timeline to duration 1
```

- **Two rigid blocks, not six columns spread proportionally.** Spread proportionally, gaps open *between* the columns and the formation falls apart; moving the left three together and the right three together, each block keeps its grid and the only thing that opens is the corridor in the middle.
- **`2 × step` is derived, not chosen.** It is exactly the distance that lands a block's innermost column where its outermost one used to be, which leaves one column visible at each edge and puts the other four off-screen.
- **Measure the step with `offsetLeft`.** It is layout position and no `transform` alters it, so it can be asked for at any time. As a function value, GSAP re-reads it on every `invalidate` — so when a media query changes the tile size, the opening recalculates itself. A constant copied from the 1280px design either shoots the columns off-screen or half-opens them on a phone.
- **Padding the timeline to duration 1** makes the position parameters mean *fraction of the run*. In GSAP they are seconds, and progress is mapped against the timeline's total duration: without the pad, a timeline that lasts 0.86 puts the event written at "0.24" at 28% of the scroll instead of 24%. A large share of the blind number-tweaking people do on scrubbed timelines comes from this.

Driving it — with a ratchet, `scrub` is no use, because a scrub plays the timeline in both directions by definition. Drive progress by hand and refuse to go below the high-water mark:

```js
let tope = 0;
ScrollTrigger.create({
  trigger: ".wall", start: "top top", end: "bottom bottom",
  onRefresh: (self) => { linea.invalidate(); tope = Math.max(tope, self.progress); linea.progress(tope); },
  onUpdate: (self) => { if (self.progress > tope) tope = self.progress; linea.progress(tope); },
});
```

`invalidate()` before setting progress is what forces `salto()` to be re-read after a resize.

### 4. The colour — a plain scrub, and it does rewind

A second, separate timeline:

```js
const tinta = gsap.timeline();
tinta.to(".wall__ground", { opacity: 1, ease: "none", duration: 0.16 }, 0.22);
tinta.to(".wall__title",  { color: "#c6f21e", ease: "none", duration: 0.16 }, 0.22);
tinta.to({}, { duration: 0.001 }, 0.999);

ScrollTrigger.create({ animation: tinta, trigger: ".wall", start: "top top", end: "bottom bottom", scrub: 0.4 });
```

**Geometry ratchets, colour rewinds, and they must be two timelines.** Once seen, the wall should not rebuild itself in the user's face on the way back up — but a dark background that never returns would leave the section black forever and make the rest of the page read wrong. Put both in one timeline and you have to pick one behaviour; neither one alone is what the section should do.

Keep the colour cross-fade short (0.16, not 0.28). Its midpoint is a flat grey that is neither of the two states and reads as something being broken; the less time spent there the better. Below about 0.10 it stops being a transition and becomes a switch.

Finally, refresh measurements as images resolve:

```js
document.querySelectorAll("img").forEach((img) => {
  if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
});
```

## Assets / images

Twenty-four **black and white** photographs in portrait 4:5, served around 358×460 so a 179×230 tile stays sharp at 2× pixel density. The bank must be varied enough that eighteen of them on screen at once look like an archive: mix portraits (profiles, backs of heads, hands, feet), interiors with hard window light, landscape and nature (misty ridges, bare branches, moss, water), and textures (linen, cloth). No brands, no text in frame. The first tile of each column loads eagerly and the second lap lazily.

## Behavior notes

- **Reduced motion** (`prefers-reduced-motion: reduce`): create neither Lenis, nor the belts, nor either ScrollTrigger. The wall stays closed, still and light — a complete, legible state showing all eighteen tiles with the headline glimpsed through the gutters. Leaving it open instead would show two columns and a headline, which is less of the component, not more accessible.
- The mask on `.wall__cols` fades to transparent, so it reveals whatever layer is beneath — which means it keeps working in both the light and the dark state without touching it.
- The component instantiates its own Lenis and owns page scroll. Do not combine it with anything that calls `ScrollTrigger.getAll().kill()`.
