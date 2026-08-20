---
slug: exoape-menu-javascript
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 1
structural_literals: 20
structural:
  - { kind: duration, literal: "1.25", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Fullscreen Overlay Menu with Skewed Clip-Path Reveal & Hover Image Preview

## Goal

Build a fullscreen overlay navigation menu (ExoApe-style). Clicking a "Menu" toggle fires a set of synchronized GSAP tweens: the page content rotates/scales/translates away to the bottom-right, a dark overlay opens via an animated `clip-path` polygon with a skewed bottom edge, the menu content "settles" from a rotated/zoomed state into place, and the nav links rise into view with a stagger. Hovering each link cross-fades a stacked preview image with a scale + rotate entrance.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm). No GSAP plugins are needed — only core tweens (`gsap.to` / `gsap.set`) animating transforms and `clipPath`.

```js
import gsap from "gsap";
```

Wrap all JS in `DOMContentLoaded`.

## Layout / HTML

```
<nav>
  <div class="logo"><a href="#">Void Construct</a></div>
  <div class="menu-toggle">
    <p id="menu-open">Menu</p>
    <p id="menu-close">Close</p>
  </div>
</nav>

<div class="menu-overlay">
  <div class="menu-content">
    <div class="menu-items">
      <div class="col-lg">
        <div class="menu-preview-img"><img src="./img-1.jpg" alt="" /></div>
      </div>
      <div class="col-sm">
        <div class="menu-links">
          <div class="link"><a href="#" data-img="./img-1.jpg">Visions</a></div>
          <div class="link"><a href="#" data-img="./img-2.jpg">Core</a></div>
          <div class="link"><a href="#" data-img="./img-3.jpg">Signals</a></div>
          <div class="link"><a href="#" data-img="./img-4.jpg">Connect</a></div>
        </div>
        <div class="menu-socials">
          <div class="social"><a href="#">Behance</a></div>
          <div class="social"><a href="#">Dribbble</a></div>
          <div class="social"><a href="#">LinkedIn</a></div>
          <div class="social"><a href="#">Instagram</a></div>
        </div>
      </div>
    </div>
    <div class="menu-footer">
      <div class="col-lg"><a href="#">Run Sequence</a></div>
      <div class="col-sm"><a href="#">Origin</a><a href="#">Join Signal</a></div>
    </div>
  </div>
</div>

<div class="container">
  <section class="hero">
    <div class="hero-img"><img src="./hero.jpg" alt="" /></div>
    <h1>Digital architecture that rises from the void.</h1>
  </section>
</div>
```

Note the stacking: `nav` sits above everything (`z-index: 2`), `.menu-overlay` above the page (`z-index: 1`), and `.container` holds the actual page (a fullscreen hero).

## Styling

- Reset: `* { margin: 0; padding: 0; box-sizing: border-box; }`. `body { overflow-x: hidden; }`.
- Font: `"TWK Lausanne", "Inter", sans-serif` — import Inter from Google Fonts as the working fallback.
- `img { width: 100%; height: 100%; object-fit: cover; }`.
- `h1`: color `#fff`, `font-size: 7rem`, `font-weight: 400`, `letter-spacing: -0.2rem`, `line-height: 1`. Inside `.hero`, the h1 is `width: 80%`.
- All `a, p`: `position: relative`, no underline, color `#fff`, `font-size: 1rem`, `font-weight: 300`, `user-select: none`. Logo link is `font-weight: 600`.
- `nav`: `position: fixed`, `width: 100vw`, `padding: 2.5em`, flex `space-between` + centered, `z-index: 2`.
- `.menu-toggle`: `position: relative`, `width: 3rem`, `height: 1.5rem`, `cursor: pointer`. Both `p` children are `position: absolute` with `transform-origin: top left` and `will-change: transform, opacity` (they stack on top of each other).
- `.menu-overlay`: `position: fixed`, `width: 100vw`, `height: 100svh`, background `#0f0f0f`, `z-index: 1`.
- `.menu-content`: `position: relative`, 100% width/height, flex centered, `transform-origin: left bottom`, `will-change: opacity, transform`.
- `.menu-items` and `.menu-footer`: `width: 100%`, `padding: 2.5em`, `display: flex`, `gap: 2.5em`. `.col-lg { flex: 3 }`, `.col-sm { flex: 2 }`. `.menu-footer` is absolutely positioned at `bottom: 0`; its `.col-sm` is flex `space-between`.
- `.menu-items .col-lg`: flex, centered — it holds `.menu-preview-img`: `position: relative`, `width: 45%`, `height: 100%`, `overflow: hidden`. Its `img`s are `position: absolute` (they stack for the cross-fade), `will-change: transform, opacity`.
- `.menu-items .col-sm`: `padding: 2.5em 0`, column flex, `gap: 2.5em`. `.menu-links` and `.menu-socials` are column flex with `gap: 0.5em`.
- `.link` and `.social` wrappers: `padding-bottom: 6px` and `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%)` — this rectangle clip is the mask that hides the links when they are translated down.
- `.link a, .social a`: `display: inline-block`, `will-change: transform`, `transition: color 0.5s`. `.link a` is `font-size: 3.5rem`, `letter-spacing: -0.02rem`. `.social a` is `#8f8f8f` and turns `#fff` on hover.
- Underline hover on `.link a`, `.social a`, `.menu-footer a` via `::after`: absolute, `top: 102.5%`, `left: 0`, full width, `height: 2px`, white, `transform: scaleX(0)` with `transform-origin: right`, `transition: transform 0.3s cubic-bezier(0.6, 0, 0.4, 1)`; on hover `scaleX(1)` with `transform-origin: left` (draws left→right in, right→left out).
- `.container`: `position: relative`, 100% width/height, `transform-origin: right top`, `will-change: transform`.
- `.hero`: `position: relative`, `100vw × 100svh`, `padding: 2.5em`, flex with `align-items: flex-end`, `overflow: hidden`. `.hero-img`: absolute, top/left 0, `100% × 100svh`, `z-index: -1`.

### Initial (closed) states — set these in CSS

```css
.menu-toggle p#menu-close {
  opacity: 0;
  transform: translateX(-5px) translateY(10px) rotate(5deg);
}
.link a, .social a {
  transform: translateY(120%);
  opacity: 0.25;
}
.menu-content {
  transform: translateX(-100px) translateY(-100px) scale(1.5) rotate(-15deg);
  opacity: 0.25;
}
.menu-overlay {
  clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%); /* collapsed to zero height */
}
```

## GSAP effect (exhaustive)

State: two booleans, `isOpen = false` and `isAnimating = false`. Clicking `.menu-toggle` calls `openMenu()` if closed, `closeMenu()` if open. Both bail out if `isAnimating` is true (or if already in the target state).

### openMenu() — five parallel tweens, all fired at once

1. **Page container pushed away** — `gsap.to(".container", { rotation: 10, x: 300, y: 450, scale: 1.5, duration: 1.25, ease: "power4.inOut" })`. Because `.container` has `transform-origin: right top`, the page swings down-right and zooms.
2. **Toggle label swap** (shared helper, see below) — "Menu" out, "Close" in.
3. **Menu content settles** — `gsap.to(".menu-content", { rotation: 0, x: 0, y: 0, scale: 1, opacity: 1, duration: 1.25, ease: "power4.inOut" })` — from its CSS initial state `(-100, -100, scale 1.5, -15deg, opacity 0.25)` to identity. With `transform-origin: left bottom` it reads as the content rotating/zooming into place.
4. **Links + socials rise** — `gsap.to([".link a", ".social a"], { y: "0%", opacity: 1, delay: 0.75, duration: 1, stagger: 0.1, ease: "power3.out" })`. They come up from `y: 120%` behind the wrappers' clip-path masks. Single flat stagger across all 8 anchors (4 links then 4 socials), 0.1s apart.
5. **Overlay clip-path opens** — `gsap.to(".menu-overlay", { clipPath: "polygon(0% 0%, 100% 0%, 100% 175%, 0% 100%)", duration: 1.25, ease: "power4.inOut" })`. The bottom-right corner overshoots to 175%, so while opening the bottom edge is diagonal/skewed (the overlay wipes down with a slanted edge). `onComplete`: set `isOpen = true`, `isAnimating = false`.

### closeMenu() — mirror of open, all fired at once

1. `gsap.to(".container", { rotation: 0, x: 0, y: 0, scale: 1, duration: 1.25, ease: "power4.inOut" })`.
2. Toggle label swap — "Close" out, "Menu" in.
3. `gsap.to(".menu-content", { rotation: -15, x: -100, y: -100, scale: 1.5, opacity: 0.25, duration: 1.25, ease: "power4.inOut" })`.
4. `gsap.to(".menu-overlay", { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", duration: 1.25, ease: "power4.inOut" })` — collapses back to the zero-height polygon. `onComplete`: `isOpen = false`, `isAnimating = false`, then `gsap.set([".link a", ".social a"], { y: "120%" })` (instantly re-hide the links for the next open — only `y` is reset, not opacity), and reset the preview container back to a single default `img-1` (`menuPreviewImg.innerHTML = ""` then append a fresh `<img src="./img-1.jpg">`).

Note: the links are NOT animated out during close — the overlay clip-path and content transform hide them; they are snapped back down only after the close completes.

### Toggle label swap helper — `animateMenuToggle(isOpening)`

Two tweens on the stacked `p#menu-open` / `p#menu-close`:

- Outgoing label (`#menu-open` when opening, `#menu-close` when closing): `gsap.to(el, { x: -5, y: isOpening ? -10 : 10, rotation: isOpening ? -5 : 5, opacity: 0, delay: 0.25, duration: 0.5, ease: "power2.out" })` — it drifts up-left with a small counter-rotation when opening, down-left with positive rotation when closing.
- Incoming label: `gsap.to(el, { x: 0, y: 0, rotation: 0, opacity: 1, delay: 0.5, duration: 0.5, ease: "power2.out" })` — returns to identity from wherever the previous cycle left it (the CSS initial state gives `#menu-close` its offscreen pose on first load).

### Hover image preview (link → stacked image cross-fade)

For every `.link a`, on `mouseover`:

- Ignore unless `isOpen && !isAnimating`.
- Read the link's `data-img`. Bail if the LAST `<img>` currently inside `.menu-preview-img` already has that src (compare with `src.endsWith(imgSrc)`), so re-hovering the same link does nothing.
- Create a new `<img>` with that src, give it inline starting styles `opacity: 0` and `transform: scale(1.25) rotate(10deg)`, and append it on top of the stack inside `.menu-preview-img`.
- Cleanup: if the container now holds more than 3 images, remove the oldest ones so at most 3 remain (old images just sit underneath — no exit animation).
- Animate the new image in: `gsap.to(newImg, { opacity: 1, scale: 1, rotation: 0, duration: {{motion.duration.base}}, ease: "power2.out" })`.

## Assets / images

5 photographs, all `object-fit: cover` so exact ratios are forgiving:

- `hero.jpg` — 1 moody, dark architectural/editorial photo, full-bleed landscape (~16:9), used as the fullscreen hero background behind the big white headline.
- `img-1.jpg` … `img-4.jpg` — 4 atmospheric editorial photos in the same dark visual family, displayed in a portrait-ish frame (the preview box is 45% of the left column's width and full height, roughly 3:4). `img-1` doubles as the default preview shown when the menu opens; each of the 4 links maps to one image via `data-img`.

## Behavior notes

- Under `max-width: 900px`: hero h1 becomes `4rem`, full width, `letter-spacing: 0`; the preview column (`.menu-items .col-lg`) is hidden entirely; the `::after` hover underlines are disabled.
- The overlay stays permanently in the DOM covering the viewport — it is only ever hidden by its collapsed clip-path, so no `display` toggling.
- The `isAnimating` lock prevents re-triggering the toggle and hover swaps mid-transition; all open/close tweens share the same `1.25s` / `power4.inOut` signature so everything moves as one gesture.
- No scroll behavior, no ScrollTrigger, no smooth-scroll library — this is a click/hover-driven, page-level component.

## Images

This component ships with 5 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/exoape-menu-javascript/hero.jpg
https://motionprompts.dev/c/exoape-menu-javascript/img-1.jpg
https://motionprompts.dev/c/exoape-menu-javascript/img-2.jpg
https://motionprompts.dev/c/exoape-menu-javascript/img-3.jpg
https://motionprompts.dev/c/exoape-menu-javascript/img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--plaster`, `--clay`, `--muted`, `--accent`, `--hairline`, `--display`, `--text`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before
anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two
of everything: two triggers on the same element disagreeing about the same scrub, two smooth
scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and
it will not reproduce in a production build, because React only does the double mount in
development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component
mounts, that event has already fired, so the listener is never called and the effect never
runs — no error, no menu, nothing to debug. Delete the listener and put its body directly inside
a `useEffect` with an empty dependency array.

*(2) Element lookups* — Every `document.querySelector` in the code above (`.container`,
`.menu-toggle`, `.menu-overlay`, `.menu-content`, `.menu-preview-img`, `.link a`, and the pair
`p#menu-open` / `p#menu-close` re-queried inside `animateMenuToggle` on every call) assumes this
component owns the document. Give the component a root `ref`, render it on the outermost
wrapper, and scope every lookup to it (`root.querySelector(...)`, `root.querySelectorAll(".link
a")`). Unscoped selectors are not a style problem here: during the StrictMode remount two copies
of the menu markup exist for an instant, and an unscoped selector will bind to the copy that is
on its way out — so a click on the toggle you see on screen could animate the container GSAP
already reverted.

*(3) Cleanup* — Wrap the whole effect in a `gsap.context` scoped to the root ref, and revert
that context on cleanup. But `gsap.context` only tracks tweens it sees created **during the
synchronous call it makes to your factory**. `openMenu`, `closeMenu`, and the per-link hover
handler here all fire later, from a click or a `mouseover` — outside that synchronous pass — so
if you leave them as plain functions, `ctx.revert()` will not know about the tweens they start
and an in-flight open/close animation survives an unmount untouched. Register each one with the
factory's `self` parameter instead of calling it directly, and drive every listener through the
name the context now exposes:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const ctx = gsap.context((self) => {
    self.add("openMenu", () => { /* the five parallel tweens from openMenu() above */ });
    self.add("closeMenu", () => { /* the mirrored tweens from closeMenu() above */ });
    self.add("previewHover", (link) => {
      /* build the new <img>, append it, then gsap.to(newImg, { ... }) */
    });
  }, root);

  const toggle = root.querySelector(".menu-toggle");
  const onToggleClick = () => (isOpenRef.current ? ctx.closeMenu() : ctx.openMenu());
  toggle.addEventListener("click", onToggleClick);

  const links = root.querySelectorAll(".link a");
  const onHover = (e) => ctx.previewHover(e.currentTarget);
  links.forEach((link) => link.addEventListener("mouseover", onHover));

  return () => {
    toggle.removeEventListener("click", onToggleClick);
    links.forEach((link) => link.removeEventListener("mouseover", onHover));
    ctx.revert();
  };
}, []);
```

The `isOpen` / `isAnimating` booleans can stay plain variables closed over by this same effect
(a `ref` if anything outside the effect needs to read them) — they gate behavior, not what
renders, so putting them in `useState` would only trigger re-renders no part of this component
needs. What must not stay a plain closure is the click and `mouseover` wiring itself:
`addEventListener` is not a GSAP resource, so `ctx.revert()` never touches it. Without the
explicit `removeEventListener` pair above, a StrictMode remount leaves the first mount's toggle
listener attached to a node that has been reverted, and a click after that fires `ctx.openMenu`
against tweens whose targets GSAP no longer owns.

*(4) The preview image stack is raw DOM, not JSX, and it lives inside a node React also
renders into* — The layout's `.menu-preview-img` starts with one `<img>` written in JSX, matching
the markup above. `previewHover` and `resetPreviewImage` then manage that same container with
`appendChild`, `removeChild`, and `innerHTML = ""`, stacking and trimming plain `<img>` elements
that React never put there and does not know about. This works as long as React never
re-renders that subtree after mount. If any state change in a parent component causes this
component to re-render with new children for `.menu-preview-img`, React's reconciler will diff
against the single `<img>` it remembers rendering and can remove or reorder the images the
effect appended, out of step with whatever `gsap.to` is mid-tween on. Keep that container's
contents entirely on one side of the boundary: render it once as an empty ref target with no
children in JSX, and let `previewHover` / `resetPreviewImage` — including the very first
default image — populate it imperatively from inside the effect, the same way `closeMenu`'s
`onComplete` already does today.
