# Scroll-Driven Card Deal & 3D Flip Sequence

## Goal
Build a multi-section scroll page (with Lenis smooth scroll) where three pastel process cards — "Plan 01", "Design 02", "Develop 03" — star in a two-act scroll story. Act 1: as you scroll past the hero, the three stacked cards fan apart (outer cards slide sideways and tilt ±15°) while dropping down, shrinking and fading. Act 2: a pinned "services" section (pinned for 4 viewport heights) where the same three cards fly up from tiny 0.25-scale thumbnails parked above the viewport, settle into a centered row at full size, then each flips 180° on the Y axis to reveal a white back listing that phase's deliverables. All the scroll motion is scrub-driven via `ScrollTrigger.onUpdate` with `gsap.set` + manual `smoothstep` interpolation (no tweens), while a CSS keyframe animation keeps the cards gently floating the whole time.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`ScrollTrigger`**, and **`lenis`** for smooth scroll. Register with `gsap.registerPlugin(ScrollTrigger)`. Everything runs inside a `DOMContentLoaded` listener.

Lenis wiring (standard GSAP integration):
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

## Layout / HTML
Class names are load-bearing — the JS/CSS query them.

```
<nav>
  <div class="logo"><span>Site Logo</span></div>
  <div class="menu-btn"><span>Menu</span></div>
</nav>

<section class="hero">
  <div class="hero-cards">
    <div class="card" id="hero-card-1"> … </div>
    <div class="card" id="hero-card-2"> … </div>
    <div class="card" id="hero-card-3"> … </div>
  </div>
</section>

<section class="about"><h1>Keep scrolling — it gets good</h1></section>

<section class="services">
  <div class="services-header"><h1>Stuff I make so you don’t have to</h1></div>
  <div class="mobile-cards">
    <div class="cards-container">
      <div class="card" id="mobile-card-1"> …flip card markup… </div>
      <div class="card" id="mobile-card-2"> … </div>
      <div class="card" id="mobile-card-3"> … </div>
    </div>
  </div>
</section>

<section class="cards">
  <div class="cards-container">
    <div class="card" id="card-1"> …flip card markup… </div>
    <div class="card" id="card-2"> … </div>
    <div class="card" id="card-3"> … </div>
  </div>
</section>

<section class="outro"><h1>The story’s not over yet</h1></section>
```

**Hero card markup** (each `#hero-card-N`) — two mirrored title rows, no flip structure:
```
<div class="card-title"><span>Plan</span><span>01</span></div>   <!-- top row: word left, number right -->
<div class="card-title"><span>01</span><span>Plan</span></div>   <!-- bottom row: mirrored -->
```
Card 1 = Plan/01, card 2 = Design/02, card 3 = Develop/03.

**Flip card markup** (each `#card-N` and `#mobile-card-N`):
```
<div class="card-wrapper">
  <div class="flip-card-inner">
    <div class="flip-card-front">
      <div class="card-title"><span>Plan</span><span>01</span></div>
      <div class="card-title"><span>01</span><span>Plan</span></div>
    </div>
    <div class="flip-card-back">
      <div class="card-title"><span>Plan</span><span>01</span></div>
      <div class="card-copy">
        <p>Discovery</p><p>Audit</p><p>User Flow</p><p>Site Map</p><p>Personas</p><p>Strategy</p>
      </div>
      <div class="card-title"><span>01</span><span>Plan</span></div>
    </div>
  </div>
</div>
```
Back-copy lists (6 items each):
- Card 1 "Plan / 01": Discovery, Audit, User Flow, Site Map, Personas, Strategy.
- Card 2 "Design / 02": Wireframes, UI Kits, Prototypes, Visual Style, Interaction, Design QA.
- Card 3 "Develop / 03": HTML/CSS/JS, CMS Build, GSAP Motion, Responsive, Optimization, Launch.

## Styling
Fonts (Google Fonts): **DM Sans** (body, headings) and **DM Mono** (all `span`s). Import both.

Palette (CSS vars): `--dark: #000`, `--light: #f9f4eb` (warm off-white), `--light2: #f0ece5`, `--accent-1: #e5d9f6` (lavender), `--accent-2: #ffd2f3` (pink), `--accent-3: #fcdca6` (peach).

Global: `* { margin:0; padding:0; box-sizing:border-box }`; `body { font-family:"DM Sans" }`; `h1 { font-size:1.5rem; font-weight:500 }`; `p { font-size:1.1rem; font-weight:500 }`; `span { text-transform:uppercase; font-family:"DM Mono"; font-size:0.75rem; font-weight:500 }`.

`nav`: `position:fixed; width:100vw; padding:2rem; display:flex; justify-content:space-between; align-items:center; z-index:2`. `.logo span` and `.menu-btn span` are small pills: `font-size:0.8rem; padding:0.75rem; border-radius:0.25rem` — logo pill dark bg / light text, menu pill `--light2` bg / dark text.

`section`: `position:relative; width:100vw; height:100svh; padding:2rem; overflow:hidden`.
- `.hero`: background `--light`, dark text.
- `.about`, `.outro`: dark bg, light text, flex-centered h1.
- `.services`: `padding:8rem 2rem` and **NO background** — it's a transparent window so the fixed `.cards` layer behind it shows through.

`.hero-cards`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:35%; display:flex; justify-content:center; gap:1rem`. Each `.hero-cards .card`: `flex:1; position:relative; aspect-ratio:5/7; padding:0.75rem; border-radius:0.5rem; display:flex; flex-direction:column; justify-content:space-between`; spans at `0.7rem`. `.card-title`: `width:100%; display:flex; justify-content:space-between`. Per card: `#hero-card-1` bg `--accent-1`, `transform-origin: top right`, `z-index:2`; `#hero-card-2` bg `--accent-2`, `z-index:1`; `#hero-card-3` bg `--accent-3`, `transform-origin: top left`, `z-index:0`.

`.services-header`: `position:relative; width:100%; text-align:center; transform:translateY(400%); will-change:transform` (starts pushed 4 line-heights below; the JS scrubs it up).

`.cards` (the fixed flip-card stage): `position:fixed; top:0; left:0; width:100vw; height:100svh; display:flex; justify-content:center; z-index:-1; background-color:var(--light)`. Because it's z-index -1, the opaque hero/about/outro sections cover it — it's only visible through the transparent `.services` section.

`.cards-container`: `position:relative; width:75%; height:100%; margin-top:4rem; display:flex; justify-content:center; align-items:center; gap:4rem`. Each `.cards-container .card`: `flex:1; position:relative; aspect-ratio:5/7; perspective:1000px`.

`.card-wrapper`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; height:100%` plus an infinite CSS floating animation:
```css
animation: floating 2s infinite ease-in-out;
@keyframes floating {
  0%   { transform: translate(-50%, -50%); }
  50%  { transform: translate(-50%, -55%); }
  100% { transform: translate(-50%, -50%); }
}
```
Stagger the float per card with `animation-delay`: card-1 `0`, card-2 `0.25s`, card-3 `0.5s`.

Flip structure: `.flip-card-inner { position:relative; width:100%; height:100%; transform-style:preserve-3d }`. `.flip-card-front, .flip-card-back { position:absolute; width:100%; height:100%; border-radius:1rem; backface-visibility:hidden; overflow:hidden }`. Front: `padding:1rem; display:flex; flex-direction:column; justify-content:space-between; align-items:center`; bg per card = accent-1 / accent-2 / accent-3. Back: `padding:1rem; display:flex; flex-direction:column; justify-content:space-between; gap:2rem; background:#fff; transform:rotateY(180deg)`. `.card-copy { width:100%; height:100%; display:flex; flex-direction:column; gap:0.5rem }`; each `.card-copy p { flex:1; display:flex; justify-content:center; align-items:center; font-size:1rem; background:var(--light2); border-radius:0.25rem }`.

**Initial resting transforms** of the flip cards (in CSS — these match the scrub's start values so there's no jump):
```css
.cards #card-1 { transform: translateX(100%)  translateY(-100%) rotate(-5deg) scale(0.25); z-index:2; }
.cards #card-2 { transform: translateX(0%)    translateY(-100%) rotate(0deg)  scale(0.25); z-index:1; }
.cards #card-3 { transform: translateX(-100%) translateY(-100%) rotate(5deg)  scale(0.25); z-index:0; }
.cards .cards-container .card { opacity: 0; }
```

`.mobile-cards { display:none }` on desktop.

## GSAP effect (be exact)

All scroll animation is **desktop-only**: wrap every ScrollTrigger in `if (window.innerWidth > 1000) { … }`.

Define the easing helper used for ALL interpolation:
```js
const smoothStep = (p) => p * p * (3 - 2 * p);  // classic smoothstep
```
There are **no tweens** — every ScrollTrigger uses `onUpdate` + `gsap.utils.interpolate` / `gsap.utils.clamp` + `gsap.set`. Four ScrollTriggers total:

### ScrollTrigger 1 — hero cards fan apart (scrubbed)
```js
ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "75% top", scrub: 1, onUpdate })
```
In `onUpdate` with `progress = self.progress`:
- Container fade: `.hero-cards` opacity = interpolate(`1 → 0.5`, `smoothStep(progress)`).
- For each of `["#hero-card-1", "#hero-card-2", "#hero-card-3"]` at `index` 0/1/2, compute a **staggered per-card progress**:
  ```js
  const delay = index * 0.9;
  const cardProgress = clamp(0, 1, (progress - delay * 0.1) / (1 - delay * 0.1));
  ```
  (so card 1 starts immediately, card 2 at 9% progress, card 3 at 18%, each still finishing at 1).
- Every value below is interpolated with `smoothStep(cardProgress)` and applied via `gsap.set(cardId, { x, y, rotation, scale })`:
  - `y`: `"0%" → "350%"` (all cards drop far below).
  - `scale`: `1 → 0.75`.
  - index 0 (left card): `x: "0%" → "90%"`, `rotation: 0 → -15`.
  - index 2 (right card): `x: "0%" → "-90%"`, `rotation: 0 → 15`.
  - index 1 (middle): `x` stays `"0%"`, `rotation` stays `0`.

  Net effect: the outer cards slide inward/over the middle one (crossing paths thanks to the `top right` / `top left` transform-origins) while tilting outward, and all three sink away shrinking as the hero scrolls out.

### ScrollTrigger 2 — pin the services section
```js
ScrollTrigger.create({
  trigger: ".services", start: "top top",
  end: `+=${window.innerHeight * 4}px`,
  pin: ".services", pinSpacing: true,
});
```

### ScrollTrigger 3 — release the fixed cards layer after the pin
Same trigger/start/end as #2, no scrub. This swaps the `.cards` stage between `fixed` and `absolute` so it scrolls away with the page once the pinned sequence ends:
- `onLeave`: measure the services section's document offset (`window.pageYOffset + getBoundingClientRect().top`) and `gsap.set(".cards", { position: "absolute", top: servicesTop, left: 0, width: "100vw", height: "100vh" })`.
- `onEnterBack`: `gsap.set(".cards", { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" })`.

### ScrollTrigger 4 — header rise + card fly-in + 3D flip (the main act, scrubbed)
```js
ScrollTrigger.create({ trigger: ".services", start: "top bottom", end: `+=${window.innerHeight * 4}`, scrub: 1, onUpdate })
```
Note it starts at `top bottom` (as soon as services enters the viewport) so the animation is already underway when the pin engages.

In `onUpdate` with `progress = self.progress`:

**Header:** `headerProgress = clamp(0, 1, progress / 0.9)`; then `gsap.set(".services-header", { y: interpolate("400%", "0%", smoothStep(headerProgress)) })` — the centered heading rides up from below over the first 90% of the range.

**Cards:** for each of `["#card-1", "#card-2", "#card-3"]` at `index` 0/1/2:
```js
const delay = index * 0.5;
const cardProgress = clamp(0, 1, (progress - delay * 0.1) / (0.9 - delay * 0.1));
```
(card 1 spans 0→0.9 of progress, card 2 spans 0.05→0.9, card 3 spans 0.10→0.9 — a light stagger, all finishing together at 90%.)

Each card's motion is piecewise over its own `cardProgress`, every segment eased with `smoothStep` of the segment-normalized progress:

- **`y`** (of the outer `#card-N`):
  - `cardProgress < 0.4`: interpolate `"-100%" → "50%"` over `cardProgress/0.4` (drops in from above and overshoots below center).
  - `0.4 ≤ cardProgress < 0.6`: interpolate `"50%" → "0%"` over `(cardProgress-0.4)/0.2` (settles back up to center).
  - else: `"0%"`.
- **`scale`**:
  - `< 0.4`: `0.25 → 0.75` ; `0.4–0.6`: `0.75 → 1` ; else `1`.
- **`opacity`**:
  - `< 0.2`: `smoothStep(cardProgress / 0.2)` (fade 0→1 in the first fifth) ; else `1`.
- **`x` / `rotate` / `rotationY`** (x and rotate on the card; rotationY on that card's `.flip-card-inner`):
  - `cardProgress < 0.6`: hold the fanned pose — `x` = `"100%"` / `"0%"` / `"-100%"` for index 0/1/2, `rotate` = `-5` / `0` / `5`, `rotationY = 0`.
  - `0.6 ≤ cardProgress < 1`: with `n = (cardProgress - 0.6) / 0.4`: interpolate `x → "0%"` and `rotate → 0` with `smoothStep(n)`, and `rotationY = smoothStep(n) * 180` — the cards glide from the fanned positions into a tight centered row WHILE flipping to their white backs.
  - `≥ 1`: `x: "0%"`, `rotate: 0`, `rotationY: 180`.

Apply per frame:
```js
gsap.set(cardId, { opacity, y, x, rotate, scale });
gsap.set(innerCard, { rotationY });   // innerCard = `${cardId} .flip-card-inner`
```

Because the CSS floating keyframes live on `.card-wrapper` (between the transformed `.card` and the flipping `.flip-card-inner`), the bobbing float persists throughout and composes with the scrubbed transforms.

## Assets / images
None — the whole piece is typographic: pastel solid-color cards, mono uppercase labels, and solid dark/light section backgrounds. No images to source.

## Behavior notes
- **Scrub everywhere** (`scrub: 1`), so scrolling backwards plays every phase in reverse; the `onLeave`/`onEnterBack` position swap keeps the flip-card stage anchored after the pin ends and re-fixes it when scrolling back up.
- **Responsive** (`max-width: 1000px`): all ScrollTriggers are skipped. `.hero-cards` widens to `calc(100% - 4rem)`. `.services` becomes auto-height (`min-height:100svh; height:100%`), `.services-header` resets to `translateY(0)`. `.mobile-cards` becomes visible as a static stacked column (`display:block`, cards `margin-bottom:2rem`, no floating animation) with the flip pre-resolved in CSS: `.mobile-cards .flip-card-front { transform: rotateY(180deg) }` and `.mobile-cards .flip-card-back { transform: rotateY(0deg) }` so the white backs show. The fixed `.cards` section stays behind the opaque sections and effectively unseen.
- Use `100svh` for section heights so mobile browser chrome doesn't clip layouts.
- The page must be tall enough to scroll: hero (100svh) → about (100svh) → services (pinned +4×100vh) → outro (100svh).

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--dark`, `--light`, `--light2`, `--card-face`, `--accent-1`, `--accent-2`, `--accent-3`, `--ink-1`, `--ink-2`, `--ink-3`, `--press-blue`, `--ink-hairline`, `--radius-card`, `--radius-chip`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script waiting on `DOMContentLoaded`, wiring a `Lenis` instance pumped by a `gsap.ticker` callback, and then — gated behind a `window.innerWidth > 1000` check — creating four `ScrollTrigger` instances that never have to undo themselves, because the page they live on never unmounts. The first drives the hero cards' fan-apart-and-sink; the second pins `.services` for four viewport heights; the third carries no scrub at all and exists purely to swap `.cards` between `fixed` and `absolute` positioning on `onLeave`/`onEnterBack`; the fourth scrubs the header rise and, per card, a piecewise `y`/`scale`/`opacity`/`x`/`rotate`/`rotationY` sequence that ends in a 180° `flip-card-inner` flip. React withdraws the "runs once, never unmounts" guarantee, and it does so quietly: the sequence scrubs correctly on first load, and the damage only shows up on a second mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Mount this component twice without tearing the first pass down and you get two `Lenis` instances both pumping `raf` off the same `gsap.ticker`, two pins on `.services` stacking two spacer elements (doubling the scrollable length of that section), and two copies of the fourth trigger's `onUpdate` writing conflicting `rotationY` values to the same three `.flip-card-inner` nodes on every scrub frame. None of this reproduces in a production build, because React only double-invokes in development — the cleanup below is not optional polish.

*(1) The entry point* — delete the `document.addEventListener("DOMContentLoaded", ...)` wrapper and move its body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` and `gsap.ticker.lagSmoothing(0)` belong at module scope instead — both are one-time, page-wide configuration, not per-mount state — and the `smoothStep` helper is a pure function that can live at module scope too, next to them, rather than being redefined on every effect run.

*(2) Element lookups* — this is the part that's easy to get wrong here specifically, because the markup is not one section but six siblings: `nav`, `.hero`, `.about`, `.services` (with `.mobile-cards` nested inside), the standalone `.cards` stage, and `.outro`. `.cards` is not inside `.services` — it's a sibling, kept in view only because it's `position: fixed` (or, once the pin releases, absolutely positioned to sit behind `.services`'s old slot). Whatever root ref you scope `gsap.context` to has to contain **all six**, not just `.services` or `.hero`: `gsap.context`'s automatic selector-scoping resolves `".cards"`, `"#hero-card-1"`, `"#card-2"` and the rest via a lookup rooted at that ref, and a selector for an element the root doesn't contain resolves to an empty list — every `gsap.set` call against it becomes a silent no-op, no error, just a layer that stops animating. Put the ref on the top-level wrapper around the whole page, not on any individual section.

Two lookups in this script won't be caught by that automatic scoping at all, because they're plain `document.querySelector` calls rather than GSAP targets: the `onLeave`/`onEnterBack` pair on the third trigger calls `document.querySelector(".services")` to read its bounding rect, and the fourth trigger's `onUpdate` calls `document.querySelector(\`${cardId} .flip-card-inner\`)` for each of the three cards, on every single scrub frame. Both need to go through the root ref explicitly (`rootRef.current.querySelector(...)`), or — better for the per-frame one — resolved once outside the `onUpdate` closure: look up the three inner-card elements when the effect sets up and close over that array, instead of re-querying the DOM sixty times a second for nodes that never change. Left unscoped, either query can resolve into the outgoing copy of the tree during the instant a StrictMode remount has two copies mounted at once.

*(3) Cleanup* — wrap the whole body, Lenis wiring included, in one `gsap.context` scoped to that root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // Lenis + ticker wiring, then the four ScrollTrigger.create calls
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills all four triggers, including the pinned one — which also tears down its spacer and restores `.services` to an unpinned layout — and reverts every inline style the four `onUpdate`/`onLeave`/`onEnterBack` callbacks wrote via `gsap.set`: the hero cards' `x`/`y`/`rotation`/`scale`, `.services-header`'s `y`, `.cards`'s `position`/`top`/`left`/`width`/`height`, and each flip card's `opacity`/`y`/`x`/`rotate`/`scale` plus its inner element's `rotationY`.

What the context does not reach is `gsap.ticker.add((time) => { lenis.raf(time * 1000); })` — the only thing driving Lenis here, since this component has no `requestAnimationFrame` loop of its own. A ticker subscription is neither a tween nor a trigger, so `ctx.revert()` leaves it running against a `Lenis` instance you are about to destroy:

```jsx
const onTick = (time) => { lenis.raf(time * 1000); };
gsap.ticker.add(onTick);
// cleanup, in this order:
gsap.ticker.remove(onTick);
lenis.destroy();
ctx.revert();
```

`lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — it lives on the Lenis instance's own emitter and goes away with `lenis.destroy()`. Lenis is a document-level resource: this component is written as a complete page, so owning the instance here is correct as long as it stays that way — but if you fold this into a larger app that runs its own smooth scroll, lift the `new Lenis()` call to the app shell and have this effect subscribe to the shared instance instead of fighting it over the same wheel event.
