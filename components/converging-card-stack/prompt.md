# Converging Card Stack — six scattered photos gather into one pile on scroll

## Goal

Build a scroll page whose middle section is sticky. Inside it, six square photo cards start scattered across the viewport at authored offsets and rotations, and as the user scrolls through the section they all converge on the *same* point and land unrotated — so the section ends with what looks like a single photograph, a neat pile. A headline sits above the cards, legible the whole way through, and the pile closes underneath it. The scroll link is a **lagged scrub**: let go of the wheel and the cards keep travelling for about a second, and scrolling back up finds them still bunched together, behind where the scroll actually is.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scrolling. Register with `gsap.registerPlugin(ScrollTrigger)`.

Lenis wiring (exact pattern — Lenis must run on GSAP's ticker, not its own rAF, or the smooth scroll and the timeline advance a frame apart and the convergence shimmers):

- `const lenis = new Lenis()` (default options).
- `lenis.on("scroll", ScrollTrigger.update)`.
- `gsap.ticker.add((time) => lenis.raf(time * 1000))`.
- `gsap.ticker.lagSmoothing(0)`.

## Layout / HTML

Three sections in order:

1. `<section class="intro">` — `<p class="label">` microlabel ("Archive — 01"), an `<h1>` ("Six years of pictures, one desk to put them on."), and a `<p class="lede">` ("Keep scrolling. The set gathers itself.").
2. `<section class="stack">` — contains `<div class="stack__pin">`, which contains, **in this order**:
   - `<h2 class="stack__title">` — "Everything we shot ends up in the `<em>`same pile`</em>`". The `<em>` is not italic; it is the accent-coloured span.
   - `<div class="stack__cards">` with six `<figure class="card">`, each holding one `<img>`.
3. `<section class="outro">` — `<p class="label">` ("Next") and an `<h2>` ("Selected work, 2019 — 2025"), on the dark graphite background.

Each card carries its scatter position as data attributes, in pixels measured on a 1280-wide screen, plus a rotation in degrees:

```html
<figure class="card" data-x="-560" data-y="-210" data-r="-9">…</figure>
<figure class="card" data-x="-460" data-y="200"  data-r="7">…</figure>
<figure class="card" data-x="-160" data-y="290"  data-r="-5">…</figure>
<figure class="card" data-x="180"  data-y="-280" data-r="11">…</figure>
<figure class="card" data-x="540"  data-y="-60"  data-r="-13">…</figure>
<figure class="card" data-x="440"  data-y="260"  data-r="6">…</figure>
```

Keep the scatter in the HTML rather than in the script. Repositioning the spread is the thing anyone adapting this component will want to change, and it should not mean opening the animation code.

## Styling

Fonts: **Space Grotesk** (display and body, weights 400/700) and **DM Mono** (microlabels, weight 500), both from Google Fonts.

Palette — one dominant neutral, near-black ink, one saturated accent. The photographs are in **full colour**, which means the red is not the only colour in the frame and has to work next to whatever the photographs bring: keep it to two small places (the microlabel and the last two words of the headline) so it still reads as an accent rather than as one more hue.

```css
--paper: #f2f2f2;   /* page background        */
--ink: #16161a;     /* type                   */
--graphite: #2b2b31;/* outro background, card placeholder */
--accent: #ff4e45;  /* microlabels, the <em>  */
--muted: #6e6e76;   /* lede                   */
--card: min(360px, 40svh); /* card side, capped by viewport height */
```

Global reset `* { margin:0; padding:0; box-sizing:border-box }`. `body` gets `--paper`, `--ink`, Space Grotesk, `overflow-x: hidden`.

`.label`: DM Mono, 11px, `letter-spacing: .14em`, uppercase, `--accent`.

`.intro, .outro`: `min-height: 100svh`, padding `clamp(24px, 5vw, 80px)`, `display: grid; align-content: center; gap: 20px`. `.intro h1` is `clamp(40px, 6.4vw, 88px)`, `line-height: .98`, weight 700, `letter-spacing: -.035em`, `max-width: 15ch`. `.outro` is `min-height: 80svh` on `--graphite` with `--paper` type.

The sticky machinery:

- `.stack { position: relative; height: 260svh; }` — the ratio between this and the pin height is the speed control. 260 / 100 leaves 160svh of travel.
- `.stack__pin { position: sticky; top: 0; height: 100svh; overflow: hidden; }` — `overflow: hidden` is required, or the cards that start off-screen create horizontal scroll.
- `.stack__title { position: absolute; left: 50%; top: 33%; transform: translate(-50%,-50%); z-index: 3; width: min(19ch, 92vw); text-align: center; font-size: clamp(32px, 5.2vw, 70px); line-height: 1.02; font-weight: 700; letter-spacing: -.035em; }`. `.stack__title em { font-style: normal; color: var(--accent); }`
- `.stack__cards { position: absolute; inset: 0; z-index: 2; }`

**The headline goes on top of the cards, not behind them.** Putting it behind is the tempting version — it gets uncovered as the six converge — but it does not survive contact with motion: the cards cross the screen through exactly that band, so the headline spends most of the run cut in half by a photograph. Two frames of a reveal do not pay for twenty frames of unreadable type. On top, it is legible throughout, and what gets revealed is the imagery: six pictures become one.

**The headline sits high and the pile lands low**, so that at rest the type is over clean background instead of over the top card. The resting point has to clear the headline's band on short viewports too, which is why the card size is capped against viewport *height* (`min(360px, 40svh)`) rather than being a flat pixel value: at 640px tall, a 360px card eats into the headline from below.

The cards all share one resting place; only their transform separates them, which is why the animation can simply target `x:0, y:0, rotate:0` for all six:

```css
.card {
  position: absolute; left: 50%; top: 67%;
  width: var(--card); height: var(--card);
  margin: calc(var(--card) / -2) 0 0 calc(var(--card) / -2);
  border-radius: 4px; overflow: hidden;
  background: var(--graphite);
  box-shadow: 0 8px 18px rgba(22,22,26,.07);
  will-change: transform;
}
.card img { width: 100%; height: 100%; object-fit: cover; }
```

**Keep that shadow short and weak.** At the end of the run there are six identical shadows exactly on top of each other. With a normal card shadow (say `0 18px 40px rgba(0,0,0,.16)`) the six add up to a 40px fuzzy halo around the pile that reads as a rendering fault; with this one, six stacked come out roughly like the shadow of a single card, which is what the pile has become.

Stacking order via `.card:nth-child(n) { z-index: n }` — that is layout, not motion, so it belongs in CSS.

Responsive: `--card: min(210px, 30svh)` under 900px, `min(168px, 26svh)` under 560px (and narrow the title to `min(13ch, 88vw)` — `width`, not `max-width`, since the base rule sets `width`).

## GSAP effect (the core — follow exactly)

One timeline containing six `fromTo` tweens, all starting at position `0`, all with `duration: 1` and `ease: "none"`. Linear is right here: the easing the user feels comes from the scrub filter, not from the tween, and stacking an ease on top of a lagged scrub makes the end of the travel mushy.

```js
const cards = gsap.utils.toArray(".card");
const escala = () => Math.min(1, window.innerWidth / 1280);
const linea = gsap.timeline();

cards.forEach((card) => {
  linea.fromTo(card,
    {
      x: () => Number(card.dataset.x || 0) * escala(),
      y: () => Number(card.dataset.y || 0) * escala(),
      rotate: () => Number(card.dataset.r || 0),
    },
    { x: 0, y: 0, rotate: 0, ease: "none", duration: 1, immediateRender: true },
    0);
});
```

Two details that are not optional:

- **Function-based start values, not numbers computed once.** GSAP re-evaluates them on every `invalidate`, so `invalidateOnRefresh: true` on the ScrollTrigger makes the scatter recompute when the window is resized. With fixed numbers, rotating a tablet leaves the cards flying in from coordinates that no longer exist.
- **`immediateRender: true` on all six.** Inside a timeline a `fromTo` does not adopt its start state until its turn comes up unless told to. With it only on the first tween, the other five are born already at the centre and the section shows exactly one card travelling.

The scroll link:

```js
ScrollTrigger.create({
  animation: linea,
  trigger: ".stack",
  start: "top top",
  end: "bottom bottom",
  scrub: 1.1,
  invalidateOnRefresh: true,
});
```

**`scrub: 1.1`, a number, not `true`.** That difference is the component:

- `scrub: true` makes the rendered value a pure function of scroll position. Stop the wheel and the pile stops in the same frame. It reads like a progress bar.
- `scrub: <seconds>` puts a real time-constant filter between scroll and timeline. Let go and the cards keep travelling for close to a second before settling where the scroll said they should be. It reads like weight.

1.1s is deliberately long. All six converge on one point, so each card's remaining distance is small by the end and a short lag would not be visible; a long one also means that when the user scrolls back up, the six are still bunched over the headline for a while before spreading out again. That gap between what the finger does and what the screen does *is* the effect.

Finally, re-measure once images resolve — the pin's start/end are computed against a document that still has images pending, and the symptom of skipping this is not that it fails but that it works at the wrong scroll offsets:

```js
document.querySelectorAll("img").forEach((img) => {
  if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
});
```

## Assets / images

Six **full-colour** photographs, square (1:1), served at roughly 680×680 so they stay sharp on a 360px card at 2× pixel density. Mix subjects so the pile reads as an archive rather than a set: two or three portraits (a profile, the back of a neck, hands), one or two landscapes (a dune ridge, water from above), one or two textures (woven linen, folded cloth). Keep the grade consistent — warm daylight across all six — or the pile looks like six stock photos rather than one shoot. No brands, no text in frame.

## Behavior notes

- **Reduced motion** (`prefers-reduced-motion: reduce`): do not create Lenis and do not create the ScrollTrigger. Build the timeline and call `linea.progress(1)` so the cards sit converged under the headline. That is the state the component exists to show.
- Nothing here reacts to hover. Resist adding a hover zoom to the cards: they already carry a `transform` written by the timeline, and a second tween on the same element fights it every frame.
- The component instantiates its own Lenis, so it owns page scroll — do not drop two of these on one page, and do not combine it with anything that calls `ScrollTrigger.getAll().kill()`.
