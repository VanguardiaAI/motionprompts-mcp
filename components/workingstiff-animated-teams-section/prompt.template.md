---
slug: workingstiff-animated-teams-section
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# WorkingStiff Animated Teams Section — Scroll-Scrubbed Rising Columns + Sliding Team Cards

## Goal
Build a full-screen scroll section that introduces a 3-person team. As the team block scrolls into view, three tall columns **rise up from below the viewport in a stagger**, each revealing a **giant yellow name-initial** that scales up from nothing. Then the section **pins for three viewport heights** and, still scrubbed by scroll, three **white team cards slide in from the right one after another** — each rotating from 20° back to upright and scaling from 0.75 up to 1 — landing centered to **cover the initials** with a portrait + role + name. Framed by a yellow-on-black hero heading above and a yellow-on-black outro heading below. Smooth scroll via Lenis. The two star effects are the **staggered rise + initial pop** and the **pinned staggered card slide-in**. Both are driven by **manual per-element progress math inside `ScrollTrigger.onUpdate` (not GSAP timelines)**. Desktop-only; disabled below 1000px.

## Tech
Vanilla HTML/CSS/JS with ES module imports, fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`ScrollTrigger`**.
- **`lenis`** — smooth scroll.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
```
Register once: `gsap.registerPlugin(ScrollTrigger);`. Run everything inside `document.addEventListener("DOMContentLoaded", …)`. No other plugins, no SplitText/CustomEase, no Three.js.

## Layout / HTML
Four full-viewport `<section>`s in order: `hero`, `team`, `outro`. The `team` section holds exactly **3** `.team-member` columns, each containing a centered **name-initial** layer and a centered **card** layer. Class names are load-bearing (JS/CSS query them).

**Fonts must be loaded via `<link>` in the `<head>` of the HTML — NOT via `@import` in the CSS.** In practice the CSS `@import` fails to apply reliably and the whole display type falls back to an ugly wide serif (Times), which also makes the names overflow the cards. Put these three tags in `<head>` (before the stylesheet link) so the browser fetches the fonts up front:
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100..900;1,100..900&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap" />
  <!-- your own <title> and stylesheet link go here too -->
</head>
```
After load, **Barlow Condensed must be visibly applied to all display type** — the hero/outro headings, the giant initials, and the card names. Barlow Condensed reads as **narrow, tall, geometric, sans-serif** letterforms with tight horizontal proportions. If any of that display type renders in a **wide serif (Times-like) with serifs on the strokes, the fonts did not load and the result is wrong** — the condensed proportions are exactly what lets the big sizes fit.

```html
<section class="hero">
  <h1>Faces Behind the Frame</h1>
</section>

<section class="team">
  <div class="team-member">
    <div class="team-member-name-initial"><h1>C</h1></div>
    <div class="team-member-card">
      <div class="team-member-img"><img src="…" alt="" /></div>
      <div class="team-member-info">
        <p>( Creative Director )</p>
        <h1>Caspian <span>Merlow</span></h1>
      </div>
    </div>
  </div>

  <div class="team-member">
    <div class="team-member-name-initial"><h1>E</h1></div>
    <div class="team-member-card">
      <div class="team-member-img"><img src="…" alt="" /></div>
      <div class="team-member-info">
        <p>( Executive Producer )</p>
        <h1>Evander <span>Coren</span></h1>
      </div>
    </div>
  </div>

  <div class="team-member">
    <div class="team-member-name-initial"><h1>L</h1></div>
    <div class="team-member-card">
      <div class="team-member-img"><img src="…" alt="" /></div>
      <div class="team-member-info">
        <p>( Head of Production )</p>
        <h1>Leopold <span>Draven</span></h1>
      </div>
    </div>
  </div>
</section>

<section class="outro">
  <h1>Where Vision Becomes Work</h1>
</section>

<script type="module" src="./script.js"></script>
```

Notes:
- Each member's initial (`C`, `E`, `L`) is the first letter of its first name.
- Each name splits into first name (yellow) + a `<span>` last name (rendered dark — see styling).
- Use this neutral demo copy verbatim. "WorkingStiff" is the fictional demo brand — no real client names. Hero: "Faces Behind the Frame". Outro: "Where Vision Becomes Work". Roles: "( Creative Director )", "( Executive Producer )", "( Head of Production )".

## Styling
Fonts (Google Fonts): **Barlow Condensed** (full weight axis 100–900, italics too) for everything, and **DM Mono** (weights 300/400/500) for the small role labels. **Load them via the `<link>` tags in `<head>` shown above — do NOT use `@import` in the CSS** (it is unreliable and leaves the display type in a fallback serif).

**Every `font-family` declaration MUST include a safe fallback stack that stays narrow and sans-serif — NEVER let it fall back to a serif.** Barlow Condensed is much narrower than a default serif, so a serif fallback both looks wrong and makes the big card names overflow the card horizontally. Use:
- for Barlow Condensed usages: `font-family: "Barlow Condensed", "Oswald", "Arial Narrow", sans-serif;`
- for DM Mono usages (the role labels): `font-family: "DM Mono", ui-monospace, monospace;`

Palette (CSS variables — exact hex):
```css
--base-100: #171717;  /* near-black — page/body background */
--base-200: #f2f5ea;  /* warm off-white/cream — the team card background */
--base-300: #fcf34c;  /* bright lemon yellow — hero/outro headings, giant initials, first names */
```

Global / reset:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { font-family:"Barlow Condensed","Oswald","Arial Narrow",sans-serif; background-color:var(--base-100); }` — condensed sans fallback stack; never a serif.
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1 { text-transform:uppercase; font-size:12rem; font-weight:800; line-height:0.8; }` — inherits the Barlow Condensed stack from `body`; must render condensed & sans, never a wide serif.
- `p { text-transform:uppercase; font-family:"DM Mono",ui-monospace,monospace; font-size:0.9rem; font-weight:500; line-height:1; }`

Sections & framing:
- `section { position:relative; width:100%; height:100svh; overflow:hidden; padding:1rem; }`
- `.hero, .outro { display:flex; justify-content:center; align-items:center; text-align:center; }`
- `.hero h1, .outro h1 { width:75%; color:var(--base-300); }` (giant 12rem yellow heading, centered).

Team row & columns:
- `.team { display:flex; gap:1rem; }` — 3 columns side by side, filling the `100svh` section.
- `.team-member { flex:1; position:relative; width:100%; height:100%; border:2px dashed rgba(242,245,234,0.35); border-radius:1.5rem; will-change:transform; }` — a dashed-outline placeholder column.
- **Stacking (critical for the cards covering each other correctly):** `.team-member:nth-child(1){ z-index:2; }` `:nth-child(2){ z-index:1; }` `:nth-child(3){ z-index:0; }` — first member paints on top.

Initial layer (the giant letter behind each card):
- `.team-member-name-initial { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }`
- `.team-member-name-initial h1 { color:var(--base-300); font-size:20rem; will-change:transform; }` — a huge yellow letter centered in the column.

Card layer (the white card that slides in over the initial):
- `.team-member-card { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:calc(100% + 4px); height:calc(100% + 4px); padding:2rem; display:flex; flex-direction:column; align-items:center; gap:2rem; background-color:var(--base-200); border-radius:1.5rem; will-change:transform; }` — cream card, slightly oversized (`+4px`) so it fully covers the dashed border, centered via `translate(-50%,-50%)`.
- `.team-member-img { aspect-ratio:1; border-radius:1rem; margin-bottom:1rem; overflow:hidden; }` — square portrait at the top of the card.
- `.team-member-info { display:flex; flex-direction:column; align-items:center; text-align:center; gap:1rem; }`
- `.team-member-info h1 { font-size:6.5rem; color:var(--base-300); }` — the name, yellow…
- `.team-member-info h1 span, .team-member-info p { color:var(--base-100); }` — …except the last-name `<span>` and the role label, which are near-black.
- **The two-line name (first name in yellow + last-name `<span>` in near-black) is centered and MUST fit inside the card without overflowing.** This only works because Barlow Condensed is narrow: at 6.5rem the longest last name ("MERLOW") sits comfortably within the card's padding. If the fonts fall back to a wide serif the names blow past both edges of the card — that is the failure to avoid. Keep the condensed-sans fallback stack so it fits even before the web font finishes loading.

### Initial (pre-animation) transform states — CRITICAL
These CSS transforms ARE the "from" states the JS scrubs out of. Set them exactly:
- `.team-member { transform: translateY(125%); }` — every column starts **fully below** the viewport.
- `.team-member-name-initial h1 { transform: scale(0); }` — every giant initial starts **invisible (scaled to 0)**.
- The three cards start **off to the right, shrunk and tilted**, staggered by horizontal offset:
  - `.team-member:nth-child(1) .team-member-card { transform: translate(300%, -50%) scale(0.75) rotate(20deg); }`
  - `.team-member:nth-child(2) .team-member-card { transform: translate(200%, -50%) scale(0.75) rotate(20deg); }`
  - `.team-member:nth-child(3) .team-member-card { transform: translate(100%, -50%) scale(0.75) rotate(20deg); }`
  - i.e. X offsets of **300% / 200% / 100%**, all at `scale(0.75)` and `rotate(20deg)`, vertically centered at `-50%`. Their resting (animated-to) position is `translate(-50%, -50%) scale(1) rotate(0)`.

## GSAP effect (be exhaustive)

### Smooth scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

### Element grab
```js
const teamSection    = document.querySelector(".team");
const teamMembers    = gsap.utils.toArray(".team-member");        // 3 columns
const teamMemberCards = gsap.utils.toArray(".team-member-card");  // 3 cards
```
Keep two module-scope handles so they can be killed/rebuilt on resize: `let cardPlaceholderEntrance = null;` and `let cardSlideInAnimation = null;`.

Everything below lives in an `initTeamAnimations()` function (called once at start, and again — after killing the old triggers — on debounced resize). **Both ScrollTriggers use `scrub:1` and drive elements exclusively through manual `gsap.set` calls inside `onUpdate` using `self.progress`; there are no tweens or timelines.** The per-element easing is purely the linear progress math below (plus scrub's 1s smoothing).

### ScrollTrigger #1 — staggered column rise + initial pop-in (`cardPlaceholderEntrance`)
```js
cardPlaceholderEntrance = ScrollTrigger.create({
  trigger: teamSection,
  start: "top bottom",   // begins when the team section's top hits the viewport bottom
  end:   "top top",      // ends when the team section's top reaches the viewport top
  scrub: 1,
  onUpdate: (self) => {
    const progress = self.progress; // 0 → 1 across that entrance window
    teamMembers.forEach((member, index) => {
      const entranceDelay    = 0.15;                 // per-column stagger
      const entranceDuration = 0.7;                  // each column's share of progress
      const entranceStart    = index * entranceDelay; // 0.00 / 0.15 / 0.30
      const entranceEnd      = entranceStart + entranceDuration; // 0.70 / 0.85 / 1.00

      if (progress >= entranceStart && progress <= entranceEnd) {
        const memberEntranceProgress = (progress - entranceStart) / entranceDuration; // 0→1
        // rise from translateY 125% up to 0%
        const entranceY = 125 - memberEntranceProgress * 125;
        gsap.set(member, { y: `${entranceY}%` });
        // giant initial scales 0→1, but only during the LAST 60% of this column's rise
        const initial = member.querySelector(".team-member-name-initial h1");
        const initialLetterScaleDelay = 0.4;
        const initialLetterScaleProgress = Math.max(
          0,
          (memberEntranceProgress - initialLetterScaleDelay) / (1 - initialLetterScaleDelay)
        );
        gsap.set(initial, { scale: initialLetterScaleProgress });
      } else if (progress > entranceEnd) {
        gsap.set(member, { y: `0%` });
        gsap.set(member.querySelector(".team-member-name-initial h1"), { scale: 1 });
      }
    });
  },
});
```
Effect: as you scroll the team block up into view, column 1 rises first, then column 2 (0.15 later), then column 3 (0.30 later), each translating `y:125% → 0%` over a 0.7-progress span. Each column's giant initial stays at `scale:0` for the first 40% of that column's rise, then scales `0 → 1` over the remaining 60%, so the letter "pops" in just as the column finishes settling.

### ScrollTrigger #2 — pinned, staggered card slide-in (`cardSlideInAnimation`)
```js
cardSlideInAnimation = ScrollTrigger.create({
  trigger: teamSection,
  start: "top top",
  end: `+=${window.innerHeight * 3}`, // pinned across 3 viewport heights of scroll
  pin: true,
  scrub: 1,
  onUpdate: (self) => {
    const progress = self.progress; // 0 → 1 across the 3vh pin
    teamMemberCards.forEach((card, index) => {
      // --- Phase A: slide X + un-rotate ---
      const slideInStagger  = 0.075;
      const xRotationDuration = 0.4;
      const xRotationStart = index * slideInStagger;      // 0.000 / 0.075 / 0.150
      const xRotationEnd   = xRotationStart + xRotationDuration; // 0.400 / 0.475 / 0.550

      if (progress >= xRotationStart && progress <= xRotationEnd) {
        const cardProgress = (progress - xRotationStart) / xRotationDuration; // 0→1
        const cardInitialX = 300 - index * 100;  // 300 / 200 / 100  (matches CSS start X)
        const cardTargetX  = -50;                 // centered resting X
        const cardSlideInX = cardInitialX + cardProgress * (cardTargetX - cardInitialX);
        const cardSlideInRotation = 20 - cardProgress * 20; // 20° → 0°
        gsap.set(card, { x: `${cardSlideInX}%`, rotation: cardSlideInRotation });
      } else if (progress > xRotationEnd) {
        gsap.set(card, { x: `-50%`, rotation: 0 });
      }

      // --- Phase B: scale 0.75 → 1 (independent stagger + window) ---
      const cardScaleStagger = 0.12;
      const cardScaleStart = 0.4 + index * cardScaleStagger; // 0.40 / 0.52 / 0.64
      const cardScaleEnd   = 1;

      if (progress >= cardScaleStart && progress <= cardScaleEnd) {
        const scaleProgress = (progress - cardScaleStart) / (cardScaleEnd - cardScaleStart);
        const scaleValue = 0.75 + scaleProgress * 0.25; // 0.75 → 1
        gsap.set(card, { scale: scaleValue });
      } else if (progress > cardScaleEnd) {
        gsap.set(card, { scale: 1 });
      }
    });
  },
});
```
Effect: the moment the team section top hits the viewport top, it **pins**. Across the next 3 viewport heights of scroll, each card runs two overlapping phases:
- **Phase A (X + rotation):** card slides horizontally from its CSS start X (`300% / 200% / 100%`) to the centered `-50%`, while its rotation eases from `20°` back to `0°`. Staggered start `0 / 0.075 / 0.15`, each lasting `0.4` of progress. Because GSAP only writes `x` and `rotation` (leaving `y` at the CSS `-50%` and scale untouched here), the cards travel in from the right and straighten.
- **Phase B (scale):** independently, each card scales `0.75 → 1`, starting later (`0.40 / 0.52 / 0.64`) and all finishing exactly at progress `1`. So a card first slides/straightens, then keeps growing to full size as the pin completes.

Combined with the `z-index` stacking (member 1 on top), the three cream cards land centered over the giant yellow initials, hiding them and revealing the portrait + role + name. The whole thing is scroll-scrubbed — scrolling up reverses it.

### Resize handling
Debounced 250ms resize: re-run `initTeamAnimations()` then `ScrollTrigger.refresh()`.
```js
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { initTeamAnimations(); ScrollTrigger.refresh(); }, 250);
});
initTeamAnimations();
```
At the top of `initTeamAnimations()`, always kill any existing `cardPlaceholderEntrance` / `cardSlideInAnimation` before rebuilding.

## Assets / images
Three **editorial fashion portraits**, one per team card. The source files are tall **4:5 portrait** JPEGs but they are displayed **square** inside `.team-member-img` (`aspect-ratio:1`, `object-fit:cover`), so each is cropped to a head-and-shoulders square. All three are shot in the same high-end, softly-lit studio style with saturated color blocking, so they read as one cohesive campaign. Actual subjects:
1. Creative Director — young man facing camera, dark brown curly/tousled hair, wearing an **olive/moss-green blazer** over a cream shirt with a matching green tie. Backdrop is a **painterly abstract wash** in warm peach/terracotta orange with cool teal accents.
2. Executive Producer — androgynous model facing camera with a short dark shag haircut and blunt bangs, wearing an open **bright crimson-red blazer** over bare chest with layered gold necklaces. Backdrop is a flat, richly saturated **teal/petrol-blue** studio wall.
3. Head of Production — woman in **side profile**, dark hair pulled back into a low bun with a gold hoop earring, wearing a sleeveless top in a **multicolor abstract brushstroke print** (blues, reds, yellows, cream). Backdrop is a flat, vivid **orange** studio wall.

The dominant palette across the set is warm oranges/reds against cool teals, tying into the yellow/black/cream section colors. No brands or logos. If you have fewer than three, repeat.

## Behavior notes
- **Desktop-only.** The whole effect runs **only when `window.innerWidth >= 1000`**. At the very top of `initTeamAnimations()`, if `window.innerWidth < 1000`: kill both ScrollTriggers, then `gsap.set(..., { clearProps: "all" })` on every `.team-member`, every `.team-member-name-initial h1`, and every `.team-member-card`, and `return` (no animation).
- **Mobile CSS fallback** (`@media (max-width:1000px)`): `h1 { font-size:4rem; }`; `.hero h1, .outro h1 { width:100%; }`; `.team { height:250svh; flex-direction:column; align-items:center; }`; `.team-member { max-width:400px; transform:translateY(0%) !important; }`; `.team-member-name-initial h1 { transform:scale(1); }`; `.team-member .team-member-card { transform:translate(-50%,-50%) scale(1) rotate(0deg) !important; }`; `.team-member-info h1 { font-size:5rem; }`. So on mobile everything sits in its final resting state, stacked vertically, no scroll animation.
- Heights use `svh` so mobile browser chrome doesn't break the full-screen layout.
- Both ScrollTriggers are **scrubbed (`scrub:1`)** — nothing autoplays; the sequence plays forward on scroll-down and reverses on scroll-up. `scrub:1` adds ~1s of catch-up smoothing.
- No reduced-motion guard in the original.
- Keep the `will-change:transform` hints on `.team-member`, the initial `h1`, and `.team-member-card`.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/workingstiff-animated-teams-section/team-member-1.jpg
https://motionprompts.dev/c/workingstiff-animated-teams-section/team-member-2.jpg
https://motionprompts.dev/c/workingstiff-animated-teams-section/team-member-3.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--base-100`, `--base-200`, `--base-300`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component holds more live state than most by the time that first unmount could land: a `Lenis` instance pumped by a `gsap.ticker` callback, two `ScrollTrigger`s (`cardPlaceholderEntrance` for the staggered column rise, and `cardSlideInAnimation`, which pins `.team` for three viewport heights while the cards slide in), a debounced `resize` listener that tears both down and rebuilds them, and — only below the 1000px breakpoint — an `IntersectionObserver` toggling `.is-visible` on each `.team-member`. A double mount that doesn't undo all of it leaves two `Lenis` instances fighting over the same wheel event, a second pin-spacer stacked under `.team` doubling the scroll runway the cards need, and two observers racing to add `.is-visible` to the same three columns. None of this reproduces in a production build — React only double-invokes in development — so treat the teardown below as load-bearing, not an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, then calls `mount({ ...DEFAULTS })` — or, if `window.MP.register` exists, hands `mount` to this catalogue's own editor runtime instead. Neither survives the port: `useEffect` already runs after the DOM is committed, so the guard is dead weight, and `window.MP` is this catalogue's live-knob tooling, not something a consuming app wires up. Drop both, and what remains is the boot call itself:

```jsx
useEffect(() => {
  const destroy = mount({ ...DEFAULTS }); // same shallow copy Object.assign({}, DEFAULTS) makes today
  return destroy;
}, []);
```

`gsap.registerPlugin(ScrollTrigger)` sits at module scope above `mount` already and can stay there — repeating it on every mount is harmless but pointless. `mount()`'s own body still needs the changes below before the `destroy` it returns is a correct React cleanup.

*(2) Element lookups* — `mount()` opens with `document.querySelector(".team")`, `gsap.utils.toArray(".team-member")` and `.team-member-card`, bailing out to a no-op `destroy` if the section isn't there — a reasonable guard, but the lookups themselves assume this component owns the document. Give it a root ref on the outermost wrapper and resolve `teamSection`, `teamMembers` and `teamMemberCards` from that ref instead. The same goes for the nested lookup that follows, `member.querySelector(".team-member-name-initial h1")`, cached once per column into `teamMemberInitials` before either trigger exists — already correct in not re-querying on every scroll frame, but still a document-wide search each time `mount()` runs. During the StrictMode remount two `.team` sections exist for an instant; an unscoped lookup can hand the whole animation to the copy on its way out while the copy actually on screen never gets its triggers.

*(3) Cleanup* — Wrap the pieces of `mount()` that create `ScrollTrigger`s in a `gsap.context` scoped to the root ref. This component's `initTeamAnimations()` already runs more than once by design — once eagerly, then again from the debounced resize handler, each time killing the previous `cardPlaceholderEntrance`/`cardSlideInAnimation` pair (and, below the breakpoint, the previous `IntersectionObserver`) before building fresh ones — so a `gsap.context(() => { ... })` that only wraps the first call would leave the pair rebuilt on resize outside its tracking, and `ctx.revert()` at unmount would miss whichever pair survived the last resize. Register the rebuild as a named method instead, so every later call is still made inside the context, however far outside the synchronous factory pass it runs:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    self.add("rebuildTeamTriggers", () => {
      // initTeamAnimations(): kill the previous pair (and observer, below the
      // breakpoint), paint each column/initial/card's exit pose with gsap.set,
      // then re-create cardPlaceholderEntrance and cardSlideInAnimation
    });
    self.rebuildTeamTriggers(); // first build, still inside the synchronous pass
  }, rootRef);

  const onResize = () => {
    // same debounce as today, then:
    ctx.rebuildTeamTriggers();
    ScrollTrigger.refresh();
  };
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    ctx.revert();
  };
}, []);
```

`ctx.revert()` then kills whichever pair is current at unmount, undoing the pin and the pin-spacer `cardSlideInAnimation` inserts under `.team`, and it clears the one-time exit-pose `gsap.set` calls at the top of the rebuild, because those run inside the same `self.add`-tracked call. It clears nothing beyond that. What actually drives every visible motion here — the column's rise, the initial's pop-in scale, the card's slide, rotation and grow — is a `gsap.set` call made from inside each trigger's `onUpdate`, keyed off `self.progress`; there are no tweens or timelines for the context to record. Those calls fire on scroll, long after the tracked call that built the trigger has returned, so `ctx.revert()` leaves the very last values `onUpdate` wrote sitting on the elements as inline styles. Reproduce what this component's own `destroy()` already does about it, after the revert:

```jsx
const animated = [...teamMembers, ...teamMemberInitials, ...teamMemberCards];
gsap.killTweensOf(animated);
gsap.set(animated, { clearProps: "all" });
```

Skip this and a remount starts from whatever transform the last `onUpdate` before unmount happened to write — a column parked mid-rise, or a card frozen mid-slide at a stale rotation — instead of the CSS-authored exit pose the fresh trigger pair expects to scrub from zero.

Two more subscriptions sit outside `gsap.context` entirely, because neither is a tween or a trigger. `gsap.ticker.add(raf)` pumps `lenis.raf` off GSAP's own ticker instead of a `requestAnimationFrame` loop of its own — keep that exact `raf` reference and call `gsap.ticker.remove(raf)` yourself, then `lenis.off("scroll", ScrollTrigger.update)` and `lenis.destroy()`, in that order, so nothing still ticking calls into an instance already torn down. And whichever `IntersectionObserver` is live when the component unmounts needs `disconnect()` regardless of the breakpoint at the time — it's a plain browser API, not a GSAP construct, so it was never going to be covered by the revert either way.

This component constructs its own `Lenis` instance, correct only if `.hero`/`.team`/`.outro` are the entire scrollable page. Dropped into a larger app that already runs Lenis — likely, since this ships as a three-section page rather than a single widget — don't construct a second one: take the existing instance instead, and keep only the `lenis.on("scroll", ScrollTrigger.update)` wiring shown above, dropping the `new Lenis()` and `lenis.destroy()` calls from this effect. Two instances both smoothing the same wheel event is what actually produces doubled-speed jitter here — the column stagger and the card slide-in both stutter, because each instance races the other to be the one that resolves this frame's scroll position.
