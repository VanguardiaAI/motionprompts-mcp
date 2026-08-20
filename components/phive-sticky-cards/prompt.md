# Sticky Cards that Fold Away in 3D on Scroll

## Goal

Build a scroll-driven "sticky card deck" page: four full-height, brightly colored art cards stack on top of each other. As you scroll, each card stays pinned while its inner panel folds away in 3D — sliding up, pushing back in Z and tilting 45° on the X axis — and darkens under a fading black overlay as the next card slides over it. Smooth scrolling via Lenis.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm), the GSAP plugin `ScrollTrigger`, and `lenis` for smooth scrolling.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);
```

## Layout / HTML

Three sections in order:

1. `section.hero` — a centered `<h1>` reading "Art That Lives Online".
2. `section.sticky-cards` — contains four `div.card` elements with ids `card-1` … `card-4`. Each card contains one `div.card-inner` with, in this order:
   - `div.card-info > p` — a short one-line tagline.
   - `div.card-title > h1` — a huge one-word title.
   - `div.card-description > p` — a 2–3 sentence description.
   - `div.card-img > img` — the artwork image.
3. `section.outro` — a centered `<h1>` reading "Next Canvas Awaits".

Card copy (title / tagline / description theme):

1. **Reverie** — "A surreal dive into neon hues and playful decay" — a psychedelic skull study in bold candy tones and liquid vector forms, made for covers and prints.
2. **Vaporwave** — "A retro-futurist scene where nostalgia meets glitch" — an 80s-UI dreamscape of stacked windows, checkerboard floors and sunset gradients, like a loading screen to another world.
3. **Kaleido** — "A kaleidoscope of folk motifs reimagined in digital form" — ornamental folk symmetry with stained-glass glow, designed as a seamless tileable pattern.
4. **Menagerie** — "A portrait framed by oddball creatures and doodles" — a playful portrait surrounded by mascots, monsters and midnight snacks; loose linework meets pastel whimsy.

## Styling

Fonts (Google Fonts): **Barlow Condensed** (all weights, notably 900) for all `h1`s, **Host Grotesk** as the body font.

Global:

- `* { margin: 0; padding: 0; box-sizing: border-box; }`
- `img { width: 100%; height: 100%; object-fit: cover; }`
- `h1 { text-transform: uppercase; font-family: "Barlow Condensed"; font-size: 5rem; font-weight: 900; line-height: 1; }`
- `p { text-transform: uppercase; font-weight: 500; }`

Palette (CSS variables on `:root`):

- `--accent-1: #b1c0ef` (light periwinkle blue) → card 1 background
- `--accent-2: #f2acac` (soft pink) → card 2
- `--accent-3: #fedd93` (pale yellow) → card 3
- `--accent-4: #81b7bf` (muted teal) → card 4

Sections:

- `.hero, .outro`: `position: relative; width: 100vw; height: 100svh; padding: 2rem;` flex centered, `text-align: center`, background `#f9f4eb` (warm cream), color `#141414`.
- `.sticky-cards`: `position: relative; width: 100vw; background-color: #0f0f0f;` (near-black — visible behind the cards while they fold).

Cards (this is what makes the 3D fold work — do not skip any of it):

- `.card`: `position: sticky; width: 100%; height: 125svh; transform-style: preserve-3d; perspective: 1000px;`
- `.card-inner`: `position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; transform-origin: 50% 100%; will-change: transform; text-align: center;` Each card's inner gets its accent variable as `background-color` (`#card-1 .card-inner { background-color: var(--accent-1); }`, etc.).
- `.card-info`: `width: 25%; padding: 4em; text-align: left;` with `p { font-size: 0.9rem; }`
- `.card-title h1`: `font-size: 10rem; padding: 2rem 0;`
- `.card-description`: `width: 60%; margin: 0 auto 2em auto;` with `p { font-size: 1.5rem; }`
- `.card-img`: `width: 100%; height: 100%; margin-top: 4em; overflow: hidden;` (it fills all remaining vertical space; the image inside covers it).

Darkening overlay — drive it with a CSS custom property so GSAP can animate it:

```css
.card-inner::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
  opacity: var(--after-opacity, 0);
  will-change: opacity;
  pointer-events: none;
  z-index: 2;
}
```

Mobile (`@media (max-width: 1000px)`): `h1` and `.card-description` become `width: calc(100% - 4rem); font-size: 3rem; margin: 0 auto;`; `.card-info` becomes `width: 75%; margin: 0 auto; padding: 4em 2em; text-align: center;`; `.card-title h1` drops to `3rem`; `.card-description p` to `1.25rem`.

## GSAP effect (the important part — be exact)

Everything runs inside a `DOMContentLoaded` handler.

### 1. Lenis ↔ ScrollTrigger sync

```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);
```

### 2. Per-card fold animation

Collect the cards with `gsap.utils.toArray(".card")`. Loop over them with their index. **Only cards that have a card after them animate** (i.e. skip the last card — it never folds; guard with `if (index < cards.length - 1)`). For each animating card, grab its `.card-inner` and create TWO scrubbed tweens, both triggered by the NEXT card (`cards[index + 1]`):

**Tween A — the 3D fold (`gsap.fromTo` on the card's `.card-inner`):**

- From: `{ y: "0%", z: 0, rotationX: 0 }`
- To: `{ y: "-50%", z: -250, rotationX: 45 }`
- ScrollTrigger config:
  - `trigger: cards[index + 1]` (the following card)
  - `start: "top 85%"`
  - `end: "top -75%"`
  - `scrub: true`
  - `pin: card` — pin the CURRENT card while its successor scrolls over it
  - `pinSpacing: false` — critical: no spacer is added, so the next card overlaps and covers the pinned one

No `ease`/`duration` matter here (fully scrub-driven). Because `.card` has `perspective: 1000px` and `.card-inner` has `transform-origin: 50% 100%` (bottom-center), the panel visually tips backwards from its bottom edge while receding, like a card falling away into the page.

**Tween B — the darkening overlay (`gsap.to` on the same `.card-inner`):**

- Animates the CSS custom property `"--after-opacity"` from its default `0` to `1` (this drives the `::after` black layer's opacity).
- ScrollTrigger config:
  - `trigger: cards[index + 1]`
  - `start: "top 75%"`
  - `end: "top -25%"`
  - `scrub: true`
  - (no pin on this one)

Note the deliberately offset ranges: the fold spans a longer scroll distance (85% → -75%) than the darkening (75% → -25%), so the shadow ramps up faster and finishes while the card is still folding, selling the "next card casts a shadow over the previous one" illusion.

## Assets / images

4 images, one per card, used as full-bleed fillers of the card's lower region (`.card-img` takes the remaining ~half of a 125svh card at full width, image cropped with `object-fit: cover` — landscape/wide crops work best, roughly 16:9 or wider). Described by role:

1. Card 1 (periwinkle, "Reverie"): psychedelic pop-art vector illustration — a stylized skull with candy-colored accents amid liquid shapes on a deep saturated background.
2. Card 2 (pink, "Vaporwave"): retro-futurist vaporwave scene — stacked 80s OS windows, a striped sunset, black-and-white checkerboard floor, pastel gradient shapes.
3. Card 3 (yellow, "Kaleido"): symmetrical kaleidoscopic mandala of folk motifs in warm oranges, browns and pinks, centered on an eye surrounded by flowers and hearts.
4. Card 4 (teal, "Menagerie"): busy doodle-art portrait of a stylized figure surrounded by cartoon mascots, monsters and small objects in loose pastel linework.

## Behavior notes

- The effect is purely scroll-scrubbed — scrolling back up reverses the fold perfectly.
- The last card never animates or pins; it simply gets covered by the outro section scrolling over the stack's flow.
- Cards are 125svh tall on purpose (taller than the viewport) so consecutive cards overlap generously during the transition.
- Works on mobile (the media query only adjusts typography/widths; the fold effect is unchanged).
- No load-in animation: the page is static until the user scrolls.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/phive-sticky-cards/img1.jpg
https://motionprompts.dev/c/phive-sticky-cards/img2.jpg
https://motionprompts.dev/c/phive-sticky-cards/img3.jpg
https://motionprompts.dev/c/phive-sticky-cards/img4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--pop`, `--accent-1`, `--accent-2`, `--accent-3`, `--accent-4`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. For this component that means two failures at once: a second `Lenis` instance gets created, and both the stale one and the live one get their `raf` driven off `gsap.ticker` and both call `ScrollTrigger.update` on scroll, so the whole page scrolls at double speed, not just this section. At the same time, every card that folds (all but the last — the `index < cards.length - 1` guard skips only that one) gets a second pin-and-scrub pair whose `trigger` is still `cards[index + 1]`, so the stale set and the live set disagree about the same `rotationX`/`z`/`y` fold and the same `--after-opacity` fade on the same `.card-inner`. Neither failure throws and neither reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) Entry point* — The whole script body sits inside `document.addEventListener("DOMContentLoaded", () => { ... })`. By the time a React component mounts, that event has already fired, so the listener is never called: the Lenis setup never runs, `gsap.utils.toArray(".card")` never executes, and no card ever pins or folds — no error, nothing in the console, just a page that scrolls like a plain document. Delete the `addEventListener` wrapper and move its body directly inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — `gsap.utils.toArray(".card")` walks the whole document, so it has to become `gsap.utils.toArray(rootRef.current.querySelectorAll(".card"))`, with the ref placed on the outermost element wrapping `.hero`, `.sticky-cards` and `.outro`. Once `cards` is built from that scoped root, the `card.querySelector(".card-inner")` inside the loop is already scoped through `card` and needs no change. This matters specifically here because the trigger for card *N*'s pair is `cards[index + 1]`, not `card` itself: during the StrictMode remount two `.sticky-cards` subtrees briefly coexist, and an unscoped `toArray` would let a card from the outgoing tree get pinned against a `trigger` element from the incoming one.

*(3) Cleanup* — Wrap the `forEach` in a `gsap.context` scoped to the root ref, and revert it in the returned cleanup: that one call kills every `ScrollTrigger` the loop created and un-pins every `.card` still pinned, snapping `.card-inner`'s `rotationX`, `z`, `y` and `--after-opacity` back off. There's no spacer to clean up separately — `pinSpacing: false` never creates one — but without the revert those fold values stay frozen on whichever card was mid-transition at unmount. `gsap.context` does not track `gsap.ticker.add`, though, and this component uses the ticker to drive Lenis's own `raf` rather than running a `requestAnimationFrame` loop of its own, so `ctx.revert()` alone leaves that ticker callback firing into a `Lenis` instance you are about to destroy. Keep the function reference, remove it explicitly, and destroy Lenis in the same cleanup, in this order:

```jsx
useEffect(() => {
  const lenis = new Lenis();
  const syncLenis = (time) => lenis.raf(time * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(syncLenis);
  gsap.ticker.lagSmoothing(0);

  const ctx = gsap.context(() => {
    const cards = gsap.utils.toArray(rootRef.current.querySelectorAll(".card"));
    cards.forEach((card, index) => {
      /* the fold tween and the --after-opacity tween, exactly as described above */
    });
  }, rootRef);

  return () => {
    ctx.revert();
    gsap.ticker.remove(syncLenis);
    lenis.destroy();
  };
}, []);
```

Since this page instantiates its own Lenis rather than joining a host app's, there is nothing to lift here — but if you drop this component into a page that already runs Lenis, delete the `new Lenis()` / `gsap.ticker.add` block entirely, reuse the existing instance, and keep only the `lenis.on("scroll", ScrollTrigger.update)` wiring, added once.
