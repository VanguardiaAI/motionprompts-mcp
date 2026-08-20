---
slug: jamarea-menu
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 6
structural_literals: 18
structural:
  - { kind: duration, literal: "1.25", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "0.3", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"expo.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power4.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Full-Screen Overlay Menu with Clip-Path Wipe & Lerped Highlighter

## Goal
Build a fixed top navbar whose **Menu** toggle opens a full-screen dark overlay that **wipes open from the bottom edge upward via an animated `clip-path` polygon**. As it opens, two columns of meta text fade/slide in, a small centered image scales up, and a row of five oversized (Anton, 10rem) menu links **stagger up into view from a mask**. On desktop, each link does a **per-character vertical swap on hover** (SplitText), a lime **highlighter bar slides + resizes to track the hovered link** using a lerp loop, and the **entire link strip pans horizontally with the mouse X position** (also lerped). It is a click-to-open/close menu, not scroll-driven.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm), the GSAP plugins **`ScrollTrigger`** and **`SplitText`**, and **`lenis`** for smooth scroll. Import as:
```js
import { gsap } from "gsap";
import { ScrollTrigger, SplitText } from "gsap/all";
import Lenis from "lenis";
```
Register `gsap.registerPlugin(ScrollTrigger, SplitText)` inside `DOMContentLoaded`. (ScrollTrigger is only wired to Lenis for smooth scroll updates; there are no scroll-triggered animations in this component — everything is click/hover/mousemove driven.)

## Layout / HTML
```
nav                       (fixed top bar)
  .nav-toggle > p "Menu"        (left — click target that opens/closes)
  .nav-item   > p "Archive"     (right — decorative)

.menu-overlay             (fixed full-viewport dark panel, clipped closed)
  .menu-content                 (two meta-text columns, absolutely centered-ish)
    .menu-col   → stacked <p> lines separated by <br> (studio name, address, city, edition, contact email, phone)
    .menu-col   → stacked <p> lines separated by <br> (social links, language, credits/ref) — right-aligned
  .menu-img                     (single small centered image)
    img
  .menu-links-wrapper           (bottom-left horizontal row)
    .menu-link × 5              (each links to "#")
      a
        span  (visible copy)    ← duplicate text
        span  (hover copy)      ← same text, stacked absolutely on top
    .link-highlighter           (the lime tracking bar)

.container
  section.hero > h1 "Shaping Ideas"   (full-viewport light hero behind the overlay)
```
The five link labels are: **Index, Persona, Biography, Work, Journal**. Each `.menu-link a` contains the **same word twice** in two `<span>`s (span 1 = visible copy, span 2 = hover copy stacked directly on top).

Use a neutral fictional studio identity for the meta text (e.g. "Jam Area", a street/city, an edition/volume number, a contact email, a phone number, social platforms, a language, credits/imprint, a reference code). No real brands.

## Styling
Fonts (Google Fonts): **Anton** (display) and **DM Sans** (UI/body, variable, italic + optical size + weight axes).

Color tokens:
- `--dark: #1e1e1e`
- `--light: #fefff8`
- `--accent: #9dfc11` (lime green)
- `body { background: #000; }`

Type:
- `h1`: Anton, uppercase, `font-size: 10rem`, weight 500, `letter-spacing: -0.1rem`, `line-height: 0.9`. `.hero h1` width 70%.
- `p, a`: uppercase, `font-size: 0.8rem`, weight 600, `line-height: 1`, no underline, `user-select: none`.
- `.menu-link a`: **Anton, `font-size: 10rem`, weight 500, `letter-spacing: -0.2rem`, `display: inline-block`, `overflow: hidden`**, color `--light`.
- `img { width:100%; height:100%; object-fit: cover; }`

Key positioning / structural CSS (these are load-bearing for the effect):
- `nav`: `position: fixed; top:0; left:0; width:100vw; padding:1rem;` flex `space-between`, color `--light`, **`mix-blend-mode: difference`**, `z-index:2`. `nav p { padding:1rem; cursor:pointer; }`
- `.menu-overlay`: `position: fixed; inset:0 auto auto 0; width:100vw; height:100svh; overflow:hidden;` background `--dark`, color `--light`, `z-index:1`, `will-change: clip-path`. **Initial closed state: `clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)`** (a degenerate rectangle collapsed onto the bottom edge — overlay invisible).
- `.menu-content`: `position:absolute; top:45%; transform:translateY(-50%); width:100%; padding:2rem;` flex `space-between` / `align-items:center`. `.menu-col:nth-child(2){ text-align:right; }`
- `.menu-img`: `position:absolute; top:45%; left:50%; transform:translate(-50%,-50%); width:150px;`
- `.menu-links-wrapper`: `position:absolute; left:0; bottom:0; width:max-content; padding:2rem;` flex, `gap:2rem`, `will-change: transform`.
- `.menu-link`: `position:relative; overflow:hidden;` `will-change:transform`. (Overflow toggles to `visible` once open so the highlighter/hover chars aren't clipped — see GSAP section.)
- `.menu-link a span:nth-child(2)`: `position:absolute; top:0; left:0;` (hover copy stacked on the visible copy).
- `.link-highlighter`: `position:absolute; bottom:0; left:0; width:400px; height:0.75rem;` background `--accent`, `will-change: transform, width`. (JS overwrites width to the first link's measured width.)
- `.char` (created by SplitText): `position:relative; display:inline-block; will-change:transform;`
- `section`: `width:100vw; height:100svh;` flex-centered, background `--light`, color `--dark`, `padding:2rem`.
- `.container`: `position:relative; z-index:0; will-change:transform, opacity;`

## GSAP effect (exhaustive)

### 0. Smooth scroll bootstrap
`const lenis = new Lenis();` → `lenis.on("scroll", ScrollTrigger.update)`; drive it from the GSAP ticker: `gsap.ticker.add((time)=> lenis.raf(time*1000))`; `gsap.ticker.lagSmoothing(0)`.

### 1. SplitText per link + initial states
For each `.menu-link a`, grab its two `<span>`s. For **each** span run `new SplitText(span, { type: "chars" })` and add class `.char` to every resulting char. For the **second** span only (index 1, the hover copy), `gsap.set(split.chars, { y: "110%" })` so its characters sit one line-height below (hidden by the `a`'s `overflow:hidden`).

Then set the closed/pre-open states:
- `gsap.set(menuContent, { y: "50%", opacity: 0.25 })`
- `gsap.set(menuImage, { scale: 0.5, opacity: 0.25 })`
- `gsap.set(menuLinks, { y: "150%" })`  ← `menuLinks` = all `.menu-link a`
- `gsap.set(linkHighlighter, { y: "150%" })`

### 2. Measure highlighter to first link
Read the first link's first span `offsetWidth` → set `linkHighlighter.style.width` to that px and seed `currentHighlighterWidth = targetHighlighterWidth = linkWidth`. Compute `initialX = firstLink.getBoundingClientRect().left - menuLinksWrapper.getBoundingClientRect().left` → seed `currentHighlighterX = targetHighlighterX = initialX`.

### 3. Open sequence (click `.nav-toggle`, `isMenuOpen === false`)
Guard with `isMenuAnimating` (bail if already animating; set true at start). These are **independent `gsap.to` tweens fired simultaneously**, each with its own delay — not a single timeline. **All eases are `expo.out`.**
- `container` → `{ y: "-40%", opacity: 0.25, duration: 1.25 }` (pushes the hero back).
- `menuOverlay` → `{ clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)", duration: 1.25 }` — this grows the top two corners up to `0%`, wiping the panel open **from the bottom edge upward to full-screen**. `onComplete`: `gsap.set(container, { y: "40%" })`, `gsap.set(".menu-link", { overflow: "visible" })`, then `isMenuOpen = true; isMenuAnimating = false`.
- `menuContent` → `{ y: "0%", opacity: 1, duration: {{motion.duration.slow}} }`.
- `menuImage` → `{ scale: 1, opacity: 1, duration: {{motion.duration.slow}} }`.
- `menuLinks` → `{ y: "0%", duration: 1.25, stagger: 0.1, delay: 0.25 }` — the five oversized links rise up out of the mask left-to-right.
- `linkHighlighter` → `{ y: "0%", duration: 1, delay: 1 }` — the lime bar drops in last.

### 4. Close sequence (click `.nav-toggle`, `isMenuOpen === true`)
Again independent simultaneous tweens, all `expo.out`, `duration: 1.25` unless noted:
- `container` → `{ y: "0%", opacity: 1 }` (hero returns).
- `menuLinks` → `{ y: "-200%" }` (links shoot up out of frame).
- `menuContent` → `{ y: "-100%", opacity: 0.25 }`.
- `menuImage` → `{ y: "-100%", opacity: 0.5 }`.
- `menuOverlay` → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" }` — collapses the panel **upward into the top edge**. `onComplete` resets everything to the closed state: overlay clip-path back to the bottom-collapsed polygon `polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)`, `menuLinks y:"150%"`, `linkHighlighter y:"150%"`, `menuContent {y:"50%", opacity:0.25}`, `menuImage {y:"0%", scale:0.5, opacity:0.25}`, `.menu-link { overflow: "hidden" }`, `menuLinksWrapper { x: 0 }` and reset `currentX = targetX = 0`; then `isMenuOpen = false; isMenuAnimating = false`.

### 5. Per-character hover swap (desktop only, `window.innerWidth >= 1000`)
On each `.menu-link` `mouseenter`: get the two spans' `.char` sets.
- visible copy chars → `gsap.to({ y: "-110%", stagger: {{motion.stagger.tight}}, duration: 0.5, ease: "expo.inOut" })`
- hover copy chars → `gsap.to({ y: "0%", stagger: {{motion.stagger.tight}}, duration: 0.5, ease: "expo.inOut" })`

On `mouseleave`:
- hover copy chars → `{ y: "110%", stagger: {{motion.stagger.tight}}, duration: 0.5, ease: "expo.inOut" }`
- visible copy chars → `{ y: "0%", stagger: {{motion.stagger.tight}}, duration: 0.5, ease: "expo.inOut" }`

Net effect: the word rolls upward, the visible copy exiting through the top while the duplicate copy rides in from below, character by character.

### 6. Mouse-driven horizontal pan of the link strip (desktop only)
Listen for `mousemove` on `.menu-overlay`. Compute:
- `maxMoveLeft = 0`, `maxMoveRight = viewportWidth - menuLinksWrapperWidth` (negative-space room to slide the strip fully right).
- `sensitivityRange = viewportWidth * 0.5`; `startX = (viewportWidth - sensitivityRange)/2`; `endX = startX + sensitivityRange`.
- `mousePercentage`: `0` if `mouseX <= startX`, `1` if `mouseX >= endX`, else `(mouseX - startX) / sensitivityRange`.
- `targetX = maxMoveLeft + mousePercentage * (maxMoveRight - maxMoveLeft)`.

So only the **central 50% of the screen width** is active: sweeping the cursor across it pans the whole `.menu-links-wrapper` from its left-docked position to fully right-docked.

### 7. Highlighter target on hover (desktop only)
On each `.menu-link` `mouseenter`: `targetHighlighterX = linkRect.left - menuWrapperRect.left` and `targetHighlighterWidth = (that link's first span).offsetWidth`. On `.menu-links-wrapper` `mouseleave`: reset both targets back to the **first** link's position/width.

### 8. Lerp rAF loop (`animate()`)
A `requestAnimationFrame` loop with **`lerpFactor = 0.05`** interpolates each `current` toward its `target`:
```
currentX               += (targetX               - currentX)               * 0.05
currentHighlighterX    += (targetHighlighterX    - currentHighlighterX)    * 0.05
currentHighlighterWidth+= (targetHighlighterWidth- currentHighlighterWidth)* 0.05
```
Then each frame apply:
- `gsap.to(menuLinksWrapper, { x: currentX, duration: 0.3, ease: "power4.out" })`
- `gsap.to(linkHighlighter, { x: currentHighlighterX, width: currentHighlighterWidth, duration: 0.3, ease: "power4.out" })`

This double-smooths (lerp + short `power4.out` tween) so the strip pan and the bar's slide/resize feel fluid and trailing.

## Assets / images
**1 image**, role = *small centered menu image*. A single portrait-oriented black-and-white editorial photograph displayed at ~150px wide (`object-fit: cover`), sitting dead-center of the open overlay between the two text columns. The real asset is a tightly-cropped monochrome studio headshot of a young person facing the camera, short hair, dark top, shot against a plain light-grey seamless backdrop — dominant tones are soft greys and near-blacks with bright highlights, no color. The high-contrast grayscale reads cleanly against the dark panel. Provide one image; aspect ratio ~3:4 portrait.

## Behavior notes
- **Desktop-only interactions:** the hover char-swap, mouse pan, and highlighter tracking all early-return when `window.innerWidth < 1000`.
- **Responsive (`max-width: 1000px`):** hero `h1` becomes `width:100%; font-size:4rem`; `.menu-content` `top:25%`; `.menu-img` and `.link-highlighter` are `display:none`; `.menu-links-wrapper` switches to `flex-direction: column; gap: 0`; `.menu-link a` shrinks to `font-size:4rem; letter-spacing:-0.05rem` (links stack vertically).
- **Re-entrancy guard:** `isMenuAnimating` blocks toggling mid-animation; `isMenuOpen` tracks state. The open tween's `onComplete` flips `container` to `y:"40%"` (so the hero peeks from below while open) and unhides link overflow.
- The `animate()` rAF loop runs continuously for the lifetime of the page.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/jamarea-menu/menu_img.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--dark`, `--light`, `--muted`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two Lenis instances fighting over the same wheel event, two sets of `SplitText` chars nested inside the same five links, two `animate()` loops nudging the same highlighter toward two different targets. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`; that guard exists to survive being loaded late in a plain document, and in React it is dead weight, because `useEffect` already runs after the DOM is committed. Drop the guard, the listener, and also the `window.MP` branch above it — that hook exists for this catalogue's live-knobs editor, which has no React equivalent here. What remains is `mount(config)` and the function it returns, already shaped as a matched setup/teardown pair; move that body into a `useEffect` with an empty dependency array and return its existing cleanup as the effect's cleanup.

*(2) Element lookups* — Every `document.querySelector` in the code above assumes this component owns the document. Give the component a root `ref`, render it on the outermost element, and scope every lookup to it. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of the subtree exist for an instant, and an unscoped selector will bind to the one that is on its way out. Concretely, that means the seven nodes destructured at the top of `mount()` (`.container`, `.nav-toggle`, `.menu-overlay`, `.menu-content`, `.menu-img`, `.menu-links-wrapper`, `.link-highlighter`, each bailing the whole effect out via an early return if any is missing) as well as the two repeated queries — `.menu-link a` / `.menu-link` for the five-link collections, and `.menu-link:first-child` for the "reset to default" reads used both at initial seeding and again inside the wrapper's `mouseleave` handler.

The closure also carries four flags that are not DOM state — `destroyed`, `alive`, `isMenuOpen`, `isMenuAnimating` — read and written synchronously from click handlers and from a loop that runs every animation frame. Keep these as `useRef` values seeded once inside the effect. Routing them through `useState` buys nothing the render output ever reads and would either fight React's batching or force a render on every frame.

*(3) Cleanup* — Everything the effect creates must be undone in the function it returns.

`ScrollTrigger` is registered here only to keep it synchronized with Lenis's virtual scroll (`lenis.on("scroll", ScrollTrigger.update)`); this component defines no `ScrollTrigger.create()` triggers of its own, so there is no scrubbed trigger to wrap. Wrap the rest — the initial `gsap.set` calls that hide the menu, the links and the highlighter before anything opens — in a `gsap.context` scoped to the root ref, and revert that context in the cleanup. But that initial batch is not everything this component animates: `toggleMenu`, the per-link `mouseenter`/`mouseleave` pair, the overlay's `mousemove` handler and `animate()`'s own frame loop all fire their `gsap.to` calls later, from event listeners and from `requestAnimationFrame`, not while the context factory is synchronously running — so `gsap.context` never sees them, and `ctx.revert()` on the StrictMode remount will unwind the initial `gsap.set` calls while leaving the open/close tweens, the hover tweens, and the per-frame wrapper/highlighter tweens running against elements a second copy of the component is now also animating. Register each of these as a named method with the context's second `self.add` overload — `self.add("toggleMenu", () => { ... })`, `self.add("onLinkEnter", (link) => { ... })`, `self.add("tick", () => { ... })` — and call them from the DOM listeners as `ctx.toggleMenu()`, `ctx.onLinkEnter(link)`, `ctx.tick()`. Only then does every tween this component ever fires end up inside the set `ctx.revert()` tears down.

Lenis here is driven off the GSAP ticker rather than its own `requestAnimationFrame` call: `gsap.ticker.add(raf)`, where `raf` forwards each tick into `lenis.raf()`. Keep that wiring, and in the cleanup unwind it in the same order the original does — ticker callback removed before the scroll subscription is dropped before `destroy()` runs. That order is not arbitrary: `lenis.raf()` calls after `destroy()` throw, so if the ticker still holds the reference when the next tick lands, it throws into a component that no longer exists. If this menu ends up embedded as one section of a larger app rather than owning the whole page, lift this Lenis instance to a shared provider instead of creating one per mount, per the note on document-level resources further up.

`animate()` is not tied to the menu's open state or to `ScrollTrigger` — it starts once and keeps re-scheduling itself via `requestAnimationFrame` for as long as the component exists, continuously lerping the link strip's horizontal offset and the highlighter's position and width toward whatever the latest pointer move set as their targets, then issuing a fresh `gsap.to` on the wrapper and one on the highlighter every single frame. Capture the handle the last `requestAnimationFrame(animate)` call returned and cancel it in the cleanup no matter whether the menu happens to be open or closed at that moment — nothing else stops this loop, so a missed `cancelAnimationFrame` leaves it retargeting a highlighter that is no longer on the page, forever, one more copy per remount. A second, easy-to-miss detail belongs next to it: the highlighter's pixel width is written straight to `linkHighlighter.style.width`, not through `gsap.set`, specifically so that value survives the later `gsap.set(el, { clearProps: "all" })` — `clearProps` only removes inline styles GSAP itself wrote. Capture the pre-effect width the same way the original does before overwriting it, and restore it by hand in the cleanup, or the underline carries a stale pixel width — measured against whatever font metrics were loaded at the previous mount — into the next one.

Each of the five links carries two spans, the visible copy and the hover copy stacked on top of it, and both get their own `SplitText` call — the effect creates ten `SplitText` instances, not one. Collect all ten and revert every one in the cleanup, in the order the effect already enforces: kill the tweens running on the `.char` elements first, then revert the ten splits, and only then clear the animated properties on the containers — reverting the splits first would delete nodes GSAP still has tweens targeting. The `offsetWidth`/`getBoundingClientRect` reads that seed the highlighter's starting position and width happen immediately after this split, measured against the Anton display face at the ten-root-em size the link labels render at. If the effect runs before that face has swapped in, those measurements lock in the fallback font's metrics for the life of the mount — nothing here ever recomputes them except a later hover. Gate the split and the initial measurement behind `document.fonts.ready`, using the same cancellation-flag shape described above for asynchronous continuations, so a StrictMode unmount that lands before the fonts settle doesn't split, or measure, a node that is already gone.
