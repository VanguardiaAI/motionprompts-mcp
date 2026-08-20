---
slug: rejoice-menu
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 12
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "0.75", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: stagger, literal: "0.05", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power1.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power4.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Clip-Path Drop-Down Overlay Menu — Top Panel Wipe + Staggered Link Reveal + Growing Reel Thumbnail + Divider Line Draw

## Goal
Build a page with a fixed top navbar (logo + a "Menu" text button) sitting over a full-bleed photographic background. Clicking **Menu** opens a lime-green **overlay panel that drops down from the top edge** via an animated `clip-path`, and clicking **Close** reverses it. The signature effect is a single **paused, reversible GSAP timeline** whose four tweens all fire together at time 0: (1) the overlay's `clip-path` polygon expands from a zero-height top strip to the full panel (wipes down from top); (2) the nav links + CTA button **fade up from below** with a small stagger; (3) the reel thumbnail **grows in height** from 0 to 200px; and (4) the footer divider **draws itself** from 0% to 100% width. Open plays the timeline forward, Close plays the exact same timeline in reverse. It is entirely click-driven — no scroll, no autoplay.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) only — **no GSAP plugins**, no ScrollTrigger, no smooth-scroll library. Import as:
```js
import gsap from "gsap";
```
Icons: **Phosphor Icons (web)** — see **Icons** below for the exact version and where to get it. Two filled glyphs: a `play` inside `.video-preview` (`<i class="ph-fill ph-play"></i>`) and a `play-circle` in `.video-details` (`<i class="ph-fill ph-play-circle"></i>`). If unavailable, any small play-circle icon substitutes.

## Layout / HTML
```
.container                              (position: relative, full width/height)
  .website-content                      (the underlying page copy — sits behind everything)
    h1 / p ...                          (a few heading + paragraph blocks of filler copy)
  nav                                   (fixed top bar, flex space-between, white text)
    .logo            "Impulse"
    .menu-open-btn   "Menu"             (click target → open)
  .menu-overlay                         (fixed top green panel; clip-path collapsed closed)
    .menu-nav                           (flex space-between)
      .menu-logo     "Impulse"
      .menu-close-btn "Close"           (click target → close)
    .menu-cols                          (flex row of two .col)
      .col
        .video                          (width: 50%)
          .video-preview               (reel thumbnail bg; height 0 closed → grows)
            span.video-play → <i ph-fill ph-play>
          .video-details               (flex space-between)
            p  → <i ph-fill ph-play-circle> "Play reel"
            p  "-01:18"
      .col
        .menu-link > a  "Home"
        .menu-link > a  "Workplace"
        .menu-link > a  "Services & Models"
        .menu-link > a  "Our Story"
        .menu-link > a  "Contact"
        .btn      > a  "Take a seat"    (CTA button)
    .menu-footer
      .menu-divider                     (width 0% → draws to 100%)
      .menu-footer-copy                 (flex space-between)
        .slogan  > p  "Tomorrow's Brands, Today.™"
        .socials → a "Twitter"  a "Instagram"  a "LinkedIn"
```
Use the neutral, fictional brand name **"Impulse"** and the labels above — no real brand names.

## Styling
Font: **"Neue Montreal", sans-serif** (a clean neutral grotesque; substitute a similar sans such as Inter/Helvetica if the face is unavailable). Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`.

Color tokens (CSS custom properties):
- `--color-menu-overlay: #a0e806` (bright lime/chartreuse — the overlay panel fill)
- `--color-menu-text: #000` (black — all text/links/icons inside the overlay)
- `--color-divider: #000000` (black — the footer divider line)

Structural / load-bearing CSS:
- `html, body`: `width:100%; height:100%;` background = **the hero image** `no-repeat 50% 50%`, `background-size: cover`; `overflow-x: hidden`. Links: `text-decoration:none; color: var(--color-menu-text);`. `i { position: relative; top: 1px; }`.
- `.container`: `position: relative; width:100%; height:100%;`.
- `nav`: `position: fixed; top:0; width:100%;` flex `justify-content: space-between; padding: 2em; color:#fff; z-index:0;`. `.menu-open-btn { cursor:pointer; }`.
- `.website-content`: `position:absolute; top:0; width:100%; margin-top:10em; padding:6em 2em; color:#fff; background: rgba(0,0,0,0.5); z-index:0;`. `h1 { font-size:80px; font-weight:500; margin-bottom:0.25em; }` `p { font-size:24px; font-weight:400; }`.
- `.menu-overlay`: `position: fixed; top:0; width:100%; padding: 2em;` `background: var(--color-menu-overlay);` `pointer-events: none;` **`clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);`** `z-index: 1000 !important;`. Note: **no explicit height** on desktop, so the panel is only as tall as its content (a drop-down, not fullscreen); the closed clip-path is a degenerate zero-height rectangle pinned to the top edge (top two points at `y:0`, bottom two also at `y:0`), making the panel invisible until the timeline opens it. `.menu-close-btn { cursor:pointer; }`.
- `.menu-nav`: flex `justify-content: space-between; margin-bottom: 1em; color: var(--color-menu-text);`.
- `.menu-cols`: `display: flex;`. `.menu-cols > div { flex:1; padding: 1em 0; }`.
- `.video`: `width: 50%;`. `.video-preview`: `width:100%; height:0px;` background = **the reel thumbnail image** `no-repeat 50% 50%`, `background-size: cover; border-radius: 4px;` (starts fully collapsed to 0 height). `.video-details`: `width:100%;` flex `justify-content: space-between; padding: 0.5em 0; color: var(--color-menu-text);`.
- `.menu-link`: `position: relative; width: max-content;`. `.menu-link a { font-size: 40px; }`. Hover underline: `.menu-link:after { content:""; position:absolute; top:100%; left:0; width:0; height:2px; background: var(--color-menu-text); transition: 0.3s all; }` and `.menu-link:hover:after { width:100%; }`.
- `.btn`: `position: relative; margin: 2em 0; border: 1px solid var(--color-menu-text); width: max-content; padding: 1.25em 2.5em; border-radius: 4px; overflow: hidden; cursor: pointer;`. Fill-on-hover: `.btn:before { content:""; position:absolute; top:0; left:0; width:0; height:100%; background: var(--color-menu-text); transition: 0.3s all; z-index:-1; }`, `.btn:hover:before { width:100%; }`, `.btn:hover a { color: var(--color-menu-overlay); }` (text flips to lime as the black fill sweeps in).
- `.menu-footer`: flex column, `color: var(--color-menu-text);`.
- `.menu-divider`: `width: 0%; height: 1px; background: var(--color-divider); margin: 1em 0;` (starts at zero width).
- `.menu-footer-copy`: flex `justify-content: space-between;`. `.socials`: flex `gap: 1em;`.

## GSAP effect (exhaustive)

### 1. Build one paused timeline at DOMContentLoaded
Everything runs inside `document.addEventListener("DOMContentLoaded", …)`. Create a single paused timeline; **append four tweens, three of them positioned at `"<"`** so they all begin at time 0 together:
```js
let tl = gsap.timeline({ paused: true });

// Tween A — overlay clip-path wipe open (appended at t = 0)
tl.to(".menu-overlay", {
  duration: 1,
  clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  ease: "power2.out",
});

// Tween B — nav links + CTA fade up (position "<" = start of previous tween = t = 0)
tl.from(".menu-link, .btn", {
  opacity: 0,
  y: 60,
  stagger: 0.05,
  duration: 0.75,
  ease: "power1.inOut",
}, "<");

// Tween C — reel thumbnail grows (position "<" = t = 0)
tl.to(".video-preview", {
  duration: 1,
  height: "200px",
  ease: "power2.out",
}, "<");

// Tween D — footer divider draws (position "<" = t = 0)
tl.to(".menu-divider", {
  duration: 2,
  width: "100%",
  ease: "power4.out",
}, "<");
```

Exact behavior of each tween:
- **A — clip-path panel wipe.** `.menu-overlay` `clip-path` animates from the degenerate closed polygon `polygon(0 0, 100% 0, 100% 0, 0 0)` (zero-height strip at top) to the full rectangle `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, so the lime panel **wipes open downward from the top edge** over **1s** on **`power2.out`**.
- **B — links/CTA reveal.** A `.from()` on all `.menu-link` and `.btn` elements: they animate **from** `opacity:0, y:60` **to** their natural state (`opacity:1, y:0`), i.e. they fade in while sliding up 60px. `duration: 0.75`, `ease: "power1.inOut"`, **`stagger: 0.05`** so the six items (5 links + CTA) cascade up 0.05s apart top-to-bottom. Because this is a `.from()` on a paused timeline sitting at t=0, the items render pre-hidden (opacity 0, pushed down) while the menu is closed.
- **C — reel thumbnail grow.** `.video-preview` `height` animates `0px → 200px` over **1s** on **`power2.out`**, so the thumbnail expands open from a zero-height sliver.
- **D — divider draw.** `.menu-divider` `width` animates `0% → 100%` over **2s** on **`power4.out`** — a slow line that draws left-to-right and is the last thing to finish (the timeline's total length is 2s, set by this longest tween).

All four start simultaneously at t=0; the timeline runs 0 → ~2s. There is no `delay`, no labels beyond the `"<"` position params.

### 2. Open / close = play / reverse the same timeline
```js
function openMenu() {
  document.querySelector(".menu-overlay").style.pointerEvents = "all";
  tl.play();
}
function closeMenu() {
  document.querySelector(".menu-overlay").style.pointerEvents = "none";
  tl.reverse();
}
document.querySelector(".menu-open-btn").addEventListener("click", openMenu);
document.querySelector(".menu-close-btn").addEventListener("click", closeMenu);

tl.reverse();   // prime the timeline in its reversed/closed state at init
```
- **Open:** flip the overlay's `pointer-events` to `all` (so its links/close button become clickable) and `tl.play()` — panel wipes down, links fade up, thumbnail grows, divider draws.
- **Close:** set `pointer-events` back to `none` and `tl.reverse()` — the identical timeline runs backwards: divider retracts, thumbnail collapses, links fade back down, panel wipes up and re-hides.
- **Init:** call `tl.reverse()` once at the end. On a paused timeline sitting at time 0 this sets the play direction to reverse and holds it at the start, ensuring the `.from()` link tween is committed to its hidden start values and the menu begins fully closed.

## Icons

This component uses **Phosphor Icons (web) 2.1.2** — `<i class="ph-fill ph-play">`, `<i class="ph-fill ph-play-circle">`.
It is an icon **font**, so all it needs is the stylesheet for the `fill` weight; there is no
JavaScript involved.

The demo serves its own copy, pinned and content-hashed. Point at it directly, or download it and
serve it from your own origin:

```
https://motionprompts.dev/c/_vendor/phosphor-icons-web-2.1.2.6e87cf5a/fill/style.css
https://motionprompts.dev/c/_vendor/phosphor-icons-web-2.1.2.6e87cf5a/fill/Phosphor-Fill.woff2
```

```html
<link rel="stylesheet" href="/c/_vendor/phosphor-icons-web-2.1.2.6e87cf5a/fill/style.css" />
```

The stylesheet references its `.woff2` with a relative URL, so keep the two files side by side if
you host them yourself (`npm i @phosphor-icons/web@2.1.2` →
`node_modules/@phosphor-icons/web/src/fill/`). Do **not** use the package's own `index.js`:
it injects the stylesheets from `cdn.jsdelivr.net`.

Any equivalent icon set is an acceptable substitute — keep the element and its selectors so the
animation still has something to target.

## Assets / images
- **1 hero image** — role: *full-bleed page background behind the site content and navbar* (set on `body`, `background-size: cover` at `50% 50%`). A moody, atmospheric photographic backdrop (dim/low-key so the white nav text and the semi-transparent dark content block read on top). Landscape, ~16:9 (e.g. 1600×900 or larger).
- **1 reel thumbnail** — role: *background of the `.video-preview` panel inside the open overlay* (`background-size: cover`, `50% 50%`, `border-radius: 4px`). A single video-still / showreel frame; it renders inside a half-width column and grows to 200px tall, so a landscape ~16:9 still works best.

No logos or icon images are needed beyond the two Phosphor glyphs (`ph-play`, `ph-play-circle`); the "Impulse" logo and slogan are plain text.

## Behavior notes
- Entirely **click-driven** — no scroll, no ScrollTrigger, no autoplay, no loops. One paused, reversible timeline is the single source of truth for open/close.
- The closed overlay is `pointer-events: none` (never blocks the page); `pointer-events` is toggled to `all` on open so only the open menu is interactive.
- **Responsive (`max-width: 900px`):** `.menu-overlay` gets `height: 100vh` (fullscreen on mobile instead of a content-height drop-down); `.menu-cols` switches to `display: block` (columns stack); `.video-preview` gets `height: 125px`; `.menu-link a` shrinks to `font-size: 30px`.
- Hover niceties (pure CSS, not GSAP): each `.menu-link` grows a 2px underline left-to-right; the `.btn` fills black from the left while its text flips to lime.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/rejoice-menu/hero.jpg
https://motionprompts.dev/c/rejoice-menu/showreel-thumbnail.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--color-menu-overlay`, `--color-menu-text`, `--color-accent`, `--color-divider`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one `DOMContentLoaded` listener that builds a single paused timeline once, wires it to two buttons with plain `addEventListener` calls, and never expects a second copy of itself to exist. React withdraws that assumption quietly — the menu still opens on the first click, and the damage only shows up on a StrictMode remount or an ordinary route-away-and-back.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen, and the double-invoke does **not** remount the DOM subtree in between — `.menu-open-btn` and `.menu-close-btn` are the same nodes on both passes. Nothing in this script ever calls `removeEventListener`, so a naive port leaves two `click` listeners on each button, each pair closing over its own `tl` built by its own effect run. One click on "Menu" now calls `.play()` on both timelines at once: two clip-path wipes targeting the same `.menu-overlay`, two staggered rises on the same `.menu-link`/`.btn` nodes, two `.video-preview` grows and two `.menu-divider` draws, all fighting over the same handful of CSS properties. This is not a development-only curiosity — because nothing here ever tears itself down, the identical doubling happens on every real visit back to this route, one more stacked pair of listeners each time.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no `readyState` check first. By the time a React component mounts, that event has already fired, so the listener body — building `tl`, defining `openMenu`/`closeMenu`, wiring them to the two buttons, and the closing `tl.reverse()` that primes the menu shut — never runs. Delete the listener and move its body into a `useEffect` with an empty dependency array.

*(2) Element lookups* — Two different things are being resolved here. The four tween targets (`.menu-overlay`, `.menu-link, .btn`, `.video-preview`, `.menu-divider`) are selector strings handed straight to `tl.to()`/`tl.from()`, not `document.querySelector` calls — passing the root ref as `gsap.context`'s second argument is what confines GSAP's own resolution of those strings to this component's subtree. The other four lookups — `.menu-open-btn` and `.menu-close-btn` for attaching the click listeners, and the two separate `document.querySelector(".menu-overlay")` calls inside `openMenu`/`closeMenu` that only exist to flip `pointerEvents` — are raw DOM calls GSAP never sees, so the context scope does nothing for them. Resolve all four off the root ref explicitly.

*(3) Cleanup* — Every tween runs during the effect's own synchronous pass — `tl` is built once, up front, not recreated inside `openMenu`/`closeMenu` — so a plain `gsap.context` wrapped around the whole body captures the timeline for free, no `self.add()` needed. `openMenu`/`closeMenu` themselves must still be reachable from outside the factory, though, or the cleanup has nothing to pass to `removeEventListener`:

```jsx
useEffect(() => {
  const menuOpenBtn = rootRef.current.querySelector(".menu-open-btn");
  const menuCloseBtn = rootRef.current.querySelector(".menu-close-btn");
  let openMenu, closeMenu;

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({ paused: true });
    // the four "<"-positioned tweens exactly as above

    openMenu = () => {
      rootRef.current.querySelector(".menu-overlay").style.pointerEvents = "all";
      tl.play();
    };
    closeMenu = () => {
      rootRef.current.querySelector(".menu-overlay").style.pointerEvents = "none";
      tl.reverse();
    };

    menuOpenBtn.addEventListener("click", openMenu);
    menuCloseBtn.addEventListener("click", closeMenu);
    tl.reverse();
  }, rootRef);

  return () => {
    menuOpenBtn.removeEventListener("click", openMenu);
    menuCloseBtn.removeEventListener("click", closeMenu);
    ctx.revert();
  };
}, []);
```

`ctx.revert()` undoes exactly what the four tweens wrote during that synchronous pass: the `.menu-overlay` clip-path, the opacity/transform GSAP put on `.menu-link` and `.btn`, the `.video-preview` height, and the `.menu-divider` width. It does **not** touch the two things attached by hand, outside of any tween: the `click` listeners on `.menu-open-btn`/`.menu-close-btn`, and the `pointerEvents` toggle inside `openMenu`/`closeMenu`. Skip the explicit `removeEventListener` pair above and the StrictMode remount — or the next real visit to this route — leaves both buttons with one extra listener apiece, which is the doubled-timeline failure described at the top of this section. The closing `tl.reverse()` needs no separate handling: it only flips the play direction of the timeline `ctx.revert()` already knows about, it does not create anything new.
