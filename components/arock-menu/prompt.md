# Responsive Fullscreen Menu — Clip-Path Sweep-Up + Staggered Reveal + 3D Parallax Image Stack

## Goal
Build a minimal editorial landing page with a tiny fixed top navbar (a small logo mark on the left, a **"Menu"** label on the right) sitting over a full-bleed hero photo with an oversized display heading. Clicking **"Menu"** opens a **fullscreen dark overlay menu**: the dark panel **sweeps up from the bottom edge** by animating a `clip-path` polygon on a `power4.inOut` ease while the hero photo simultaneously slides up and fades away. Once the panel is up, the menu logo, four oversized nav links, and two footer columns of tiny mono lines **rise and reveal from behind clip-path masks** with staggered `power3.out` `y`-translations. On the wide left side of the open menu sits a **stack of four semi-transparent copies of the hero image** that **parallax and tilt in 3D (`rotate3d`)** continuously as the mouse moves — each layer offset by a different amount for depth. Clicking **"Close"** reverses it: the panel collapses off the top edge, the menu column slides up and fades, and the hero photo slides back up into view from below; on complete everything hard-resets for the next open. All motion is click/mousemove-driven with plain GSAP tweens (no timeline).

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) only — **no plugins** (no ScrollTrigger, no SplitText, no CustomEase), no smooth-scroll library. The whole thing is click- and mousemove-driven. Import as:
```js
import gsap from "gsap";
```
Ship `index.html`, `styles.css`, and an ES-module `script.js` (`<script type="module" src="./script.js">`). Wrap logic in a `DOMContentLoaded` listener (the file uses two separate `DOMContentLoaded` handlers — one for open/close, one for the mouse tilt — but a single one is fine).

## Layout / HTML
Use neutral, fictional labels — no real brand names. The demo wordmark/heading is **"Break"**.
```
.container
  nav                                   (fixed top bar, space-between)
    .logo > img                         (small logo mark, left)
    p.menu-open  "Menu"                 (right — THE open click target)

  section.hero                          (fullscreen background photo)
    .header
      h1  "Break"                       (giant display heading, centered)
      sup  ©                            (small superscript copyright next to it)

  .menu                                 (fixed fullscreen dark overlay, clipped shut, pointer-events:none)
    .menu-nav > p.menu-close  "Close"   (fixed top-right — THE close click target)

    .menu-col.menu-img                  (wide left column — the 3D image stack)
      img#img-1                         (four copies of the SAME hero photo,
      img#img-2                          descending opacity 0.9 / 0.7 / 0.5 / 0.3)
      img#img-3
      img#img-4

    .menu-col.menu-items                (narrow right column)
      .menu-logo > img                  (logo mark, larger)
      .menu-links
        .menu-link > p > a  "About"
        .menu-link > p > a  "Story"
        .menu-link > p > a  "Projects"
        .menu-link > p > a  "Releases"
      .menu-footer                      (two flex sub-columns of tiny mono lines)
        .menu-sub-col
          .menu-sub-item > p  ×N   (labels + a fictional address block, <br/> separators)
        .menu-sub-col
          .menu-sub-item > p  ×N   (socials + a second fictional address block)
```
Footer copy is fictional filler, e.g. col 1: `Connect / Break / — / Explore / Break / — / Contact Us / — / Ocean City / Rhythmic Sound / 2000 Coastal Hwy / Ocean City, MD 21842`; col 2: `Instagram / Youtube / — / Spotify / Mixcloud / — / Email / — / Vice City / Echo Beats / 933 South View Ave / Vice City, VC 3270`. Use `<br />` for the blank separator lines. All four `.menu-img` `<img>` use the **same** hero photo `src`.

## Styling
Fonts (name these families; supply close free substitutes if the originals aren't available):
- **Display / links**: `"Saans TRIAL"` — a clean neutral grotesque sans (substitute: Inter / Helvetica Now / a general grotesque). Used on `.hero h1` and `.menu-link p`.
- **Mono / labels**: `"Akkurat Mono"` — a monospace (substitute: Space Mono / Roboto Mono). Used on all `<p>` (nav "Menu"/"Close", footer lines).

Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; font-family:"Saans TRIAL"; background:#000; }`. `img { width:100%; height:100%; object-fit:cover; }`. Base `p { color:#fff; font-family:"Akkurat Mono"; font-size:11px; font-weight:300; text-transform:uppercase; }`.

Color tokens: page/hero text **white `#fff`**; page background **`#000`**; overlay menu background **dark `#101010`**.

Type sizes (large / load-bearing):
- `.hero h1`: white, uppercase, Saans, **`font-size: 12vw`**, `font-weight: 900`, `letter-spacing: -0.024em`, `line-height: 100%`.
- `sup`: white, `font-size: 3vw`, `position: relative; top: 0.25em;` (sits beside the h1 in a flex `.header` with `gap: 0.5em`).
- `.menu-link p`: Saans, **`font-size: 36px`**, `font-weight: 700`. `.menu-link a { text-decoration:none; color:#fff; }`.
- `.logo`: `width: 24px;` · `.menu-logo`: `width: 48px;`.

Structural / load-bearing CSS:
- `.hero`: `position: absolute; top: 0; width: 100vw; height: 100vh; overflow: hidden; z-index: 0;` with the **hero photo as its background** (`background: url(hero.jpg) no-repeat 50% 50%; background-size: cover;`). `.hero .header` is `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); display:flex; gap:0.5em;`.
- `nav`: `position: fixed; top: 0; padding: 1.5em 2em; width: 100%; display: flex; justify-content: space-between; align-items: center; z-index: 1;`. `.menu-open, .menu-close { cursor: pointer; }`.
- `.menu`: `position: fixed; top: 0; padding: 1.5em; width: 100vw; height: 100vh; background: #101010; color: #fff; display: flex; gap: 1.5em; overflow: hidden; z-index: 2; pointer-events: none;` and the **collapsed initial clip-path** `clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);` (a zero-height line pinned to the **bottom edge**, so the panel is invisible at rest).
- `.menu-nav`: `position: fixed; top: 0; left: 0; padding: 2em; width: 100%; display: flex; justify-content: flex-end;` (the "Close" label sits top-right).
- `.menu-img`: `position: relative; flex: 3; overflow: hidden;` (wide left column, ~75%). **`overflow:hidden` clips the tilted/parallaxing image stack.**
- `.menu-items`: `position: relative; top: 0px; flex: 1; padding: 3em; display: flex; flex-direction: column; justify-content: space-between; z-index: -1;` (narrow right column, ~25%).
- `.menu-img img`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);` — all four stacked and centered. Per-image opacity: `#img-1 {0.9}`, `#img-2 {0.7}`, `#img-3 {0.5}`, `#img-4 {0.3}`.
- **Clip-path masks (these make the staggered text/logo reveal read as a slide-up-from-behind-a-mask):** `.menu-logo`, `.menu-link`, and `.menu-sub-item` each get `clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);` (a full rectangle acting as an overflow mask). Their inner elements (`.menu-logo img`, `.menu-link p`, `.menu-sub-item p`) are `position: relative;` so a positive `y` offset hides them below the mask edge.
- `.menu-footer`: `width: 100%; display: flex;`. `.menu-sub-col { flex: 1; }`.

## GSAP effect (exhaustive)

Default ease constant: `const defaultEase = "power4.inOut";`. No `gsap.timeline` anywhere — every step is an independent `gsap.to`/`gsap.set`, and the choreography comes purely from `delay` and `stagger` values. A single boolean `isOpen` (flipped inside the tweens' `onComplete`) gates re-clicks.

### 0. Initial hidden states (set once on load)
```js
gsap.set(".menu-logo img", { y: 50 });
gsap.set(".menu-link p",   { y: 40 });
gsap.set(".menu-sub-item p", { y: 12 });
gsap.set(["#img-2, #img-3, #img-4"], { top: "150%" });   // #img-1 stays at top:50%
```
So the logo, each link, and each footer line start pushed **down** behind their clip-path masks (hidden), and images 2–4 start pushed **below** the viewport (`top:150%`) while `#img-1` sits centered.

### 1. OPEN — clicking `.menu-open` runs `openMenu()` (six parallel tweens)
All start at the click (t = 0); the `delay`s are absolute offsets from that click.
1. **Panel sweep-up** — `gsap.to(".menu", { clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)", pointerEvents: "all", duration: 1.25, ease: defaultEase })`. The clip-path goes from the bottom-collapsed line to a **full rectangle**, so the dark panel wipes upward to fill the screen; pointer events are enabled.
2. **Hero slides up + fades** — `gsap.to(".hero", { top: "-50%", opacity: 0, duration: 1.25, ease: defaultEase })`. The background photo pushes up off the top and fades to 0 as the panel covers it.
3. **Menu logo rises** — `gsap.to(".menu-logo img", { y: 0, duration: 1, delay: 0.75, ease: "power3.out" })`. Slides from `y:50` up into its clip-mask.
4. **Nav links rise (staggered)** — `gsap.to(".menu-link p", { y: 0, duration: 1, stagger: 0.075, delay: 1, ease: "power3.out" })`. The 4 links slide from `y:40` up into view, 0.075s apart.
5. **Footer lines rise (staggered)** — `gsap.to(".menu-sub-item p", { y: 0, duration: 0.75, stagger: 0.05, delay: 1, ease: "power3.out" })`. All footer mono lines slide from `y:12` up, a tighter 0.05s apart.
6. **Image stack slides in (staggered)** — `gsap.to(["#img-2, #img-3, #img-4"], { top: "50%", duration: 1.25, ease: defaultEase, stagger: 0.1, delay: 0.25, onComplete: () => { gsap.set(".hero", { top: "50%" }); isOpen = !isOpen; } })`. Images 2–4 rise from `top:150%` to the centered `top:50%`, 0.1s apart, layering behind `#img-1`. On complete it parks the (already invisible) hero at `top:50%` and flips `isOpen` true.

Net feel: the dark panel sweeps up over the fading hero (0→1.25s); starting ~0.75–1s in, the logo, links, and footer lines stagger up from behind their masks while the four image layers rise into the stack.

### 2. CLOSE — clicking `.menu-close` runs `closeMenu()` (three tweens + a reset)
1. **Panel collapse off top** — `gsap.to(".menu", { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", pointerEvents: "none", duration: 1.25, ease: defaultEase })`. The clip-path collapses to a zero-height line at the **top edge**, so the dark panel wipes up and off; pointer events disabled.
2. **Menu column exits up + fades** — `gsap.to(".menu-items", { top: "-300px", opacity: 0, duration: 1.25, ease: defaultEase })`. The whole right column slides up 300px and fades.
3. **Hero slides back in + fades in** — `gsap.to(".hero", { top: "0%", opacity: 1, duration: 1.25, ease: defaultEase, onComplete: () => { /* full reset */ } })`. The hero animates from `top:50%` (parked below) back up to `top:0` while fading from 0→1, re-revealing the landing photo from below. Its `onComplete` **hard-resets everything** for the next open:
   ```js
   gsap.set(".menu", { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" }); // re-arm at bottom
   gsap.set(".menu-logo img", { y: 50 });
   gsap.set(".menu-link p",   { y: 40 });
   gsap.set(".menu-sub-item p", { y: 12 });
   gsap.set(".menu-items", { opacity: 1, top: "0px" });
   gsap.set(["#img-2, #img-3, #img-4"], { top: "150%" });
   isOpen = !isOpen;
   ```

### 3. Click wiring + re-entry guard
```js
menuOpen.addEventListener("click", () => { if (isOpen) return; openMenu(); });
menuClose.addEventListener("click", () => { if (!isOpen) return; closeMenu(); });
```
`isOpen` starts `false` and is only flipped inside the tweens' `onComplete`, so a second click is ignored until the current open/close fully finishes.

### 4. Continuous 3D parallax + tilt on the image stack (mousemove)
Independent of the open/close logic. Track the mouse against the viewport center:
```js
const menuImgContainer = document.querySelector(".menu-img");
const images = document.querySelectorAll(".menu-img img");
let mouse = { x: 0, y: 0 };
let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
const scales = [0.81, 0.84, 0.87, 0.9];   // per-layer scale (img-1..img-4)
```
On every `mousemove` on `document.body`, store `mouse.x/​y = event.clientX/​Y` and call `update()`:
```js
function update() {
  let dx = mouse.x - cx, dy = mouse.y - cy;
  let tiltx = (dy / cy) * 20;             // up to ±20 on the X axis
  let tilty = (dx / cx) * 20;             // up to ±20 on the Y axis

  gsap.to(menuImgContainer, {
    duration: 2,
    transform: `rotate3d(${tiltx}, ${tilty}, 0, 15deg)`,   // whole stack tilts 15° about a mouse-driven axis
    ease: "power3.out",
  });

  images.forEach((img, index) => {
    let parallaxX = -(dx * (index + 1)) / 100;   // deeper layers move MORE
    let parallaxY = -(dy * (index + 1)) / 100;
    gsap.to(img, {
      duration: 2,
      transform: `translate(calc(-50% + ${parallaxX}px), calc(-50% + ${parallaxY}px)) scale(${scales[index]})`,
      ease: "power3.out",
    });
  });
}
```
- The `.menu-img` container is rotated in 3D via `rotate3d(tiltx, tilty, 0, 15deg)` — a fixed 15° tilt whose **axis** is steered by the mouse offset, so the stack appears to lean toward/away from the cursor.
- Each of the four images gets a parallax `translate` **on top of** its `translate(-50%,-50%)` centering, with the offset scaled by `(index+1)` — so `#img-1` barely moves and `#img-4` moves ~4× as far, producing depth. Each layer is also held at its own `scale` (0.81→0.9, front layer largest).
- Both tweens use `duration: 2` + `ease: "power3.out"`, so the stack drifts smoothly and lags behind the cursor (a heavy, floaty parallax). `resize` recomputes `cx`/`cy`.

## Assets / images
- **1 full-bleed editorial photograph** — landscape orientation (~3:2). Role: (a) the fullscreen hero background behind the closed state, and (b) reused **four times** as the stacked, semi-transparent (`0.9 / 0.7 / 0.5 / 0.3` opacity) images inside the open menu's left column. A neutral, well-lit studio subject on a plain light background reads well; displayed `object-fit: cover` / `background-size: cover` at `50% 50%`. All four stack `<img>` share this one source.
- **1 small logo mark (PNG, transparent background)** — a simple white brand mark. Role: top-left in the fixed navbar (`24px` wide) and again inside the open menu (`48px` wide).

## Behavior notes
- **Re-entry guard:** the `isOpen` flag (toggled only in `onComplete`) blocks new clicks until the current open/close finishes; there is no timeline to reverse — open and close are separate tween sets.
- **Responsive (`max-width: 900px`):** `.menu-img` is `display: none` — the 3D image stack is hidden on mobile and the open menu shows only the links/footer column. (The mousemove parallax still runs but has nothing visible to move.) Treat this as a desktop-first effect.
- All motion is click-driven (open/close) plus a continuous mousemove parallax loop — no scroll, no ScrollTrigger, no autoplay, no infinite timeline.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/arock-menu/hero.jpg
https://motionprompts.dev/c/arock-menu/logo.png
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--panel`, `--paper`, `--muted`, `--accent`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: two separate `DOMContentLoaded` listeners, each firing once, each reaching into the page with bare `document.querySelector`/`querySelectorAll` and raw `click`/`mousemove`/`resize` listeners, neither ever expecting to run twice or to undo itself. React withdraws all of that at once, and it does it quietly — the menu still sweeps up, the four-layer image stack still tilts under the cursor, and the damage only shows up on a second mount or an ordinary route-away-and-back.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything, and this component's own re-entry guard makes the doubling worse than usual: `isOpen` is a plain `let` local to the effect body, so a StrictMode remount produces two independent closures, each starting its own `isOpen` at `false`. `if (isOpen) return` only ever protects a listener from itself — it says nothing about a second listener on the same element — so one click on "Menu" fires both `openMenu()`s at once: two panel sweeps racing on the same `.menu` clip-path, two hero fade-outs, two staggered rises stacking `y` tweens on the same four `.menu-link p`, two image-stack tweens both driving `#img-2`–`#img-4` toward the same centered position. The tilt effect doubles the same way: two `mousemove` listeners on `document.body` mean every cursor move now calls `update()` twice, issuing two competing `rotate3d` tweens on `.menu-img` and two parallax tweens per image. None of this reproduces in a production build, because React only double-invokes effects in development — but nothing in this script ever calls `removeEventListener`, so the same doubling happens for real, permanently, on every ordinary visit back to this route.

*(1) The entry point* — Both bodies wait for `DOMContentLoaded`, which has already fired by the time a React component mounts, so neither ever runs: no click target responds, the image stack never tilts, nothing to debug. Delete both listeners. Since the two bodies touch disjoint elements — the open/close plumbing versus the tilt loop on `.menu-img` and `window` — keep them as two separate `useEffect`s with empty dependency arrays, matching the split already in the source, rather than merging them into one effect whose cleanup would have to interleave both.

*(2) Element lookups* — `menuOpen`, `menuClose`, `.menu`, `.hero`, `.menu-logo img`, `.menu-link p`, `.menu-sub-item p`, `.menu-items`, `.menu-img` and its four `<img>` children are all resolved off the document root. Give the component a root `ref` wrapping the `nav`, the `.hero` and the `.menu` overlay, and resolve every one of these from it. `#img-1`–`#img-4` are IDs, which makes scoping matter more here than usual: during the StrictMode remount two copies of the subtree exist for an instant, each declaring its own `#img-2`, and an unscoped `gsap.set(["#img-2, #img-3, #img-4"], …)` binds to whichever copy the browser resolves first, not necessarily the one this effect run owns. Reaching these through the `gsap.context` selector in point (3) below scopes an ID selector to the root exactly the way it scopes a class selector.

*(3) Cleanup* — The four `gsap.set` calls that establish the hidden starting state (the logo, the links, the footer lines, `#img-2`–`#img-4`) run synchronously the moment the effect fires, so a plain `gsap.context` around them captures them for free. `openMenu` and `closeMenu` are different: their tweens are created later, inside click handlers, well after the context's own synchronous call has already returned, so wrapping only the initial state in a context does not make its `revert()` aware of the sweep, the fade, the rises, or the image-stack tween either function triggers on the next click. Route both through the context's own `add()` so their animations register no matter when they later run, and keep the re-entry guard as a ref instead of a plain closure variable so it survives across the effect body cleanly:

```jsx
const isOpenRef = useRef(false);

useEffect(() => {
  const ctx = gsap.context((self) => {
    const q = self.selector;
    gsap.set(q(".menu-logo img"), { y: 50 });
    // …the rest of the initial-state gsap.set calls, unchanged, all through q()

    self.add("openMenu", () => {
      // the five other open tweens, targets resolved through q(), unchanged
      gsap.to(q("#img-2, #img-3, #img-4"), {
        top: "50%",
        onComplete: () => { gsap.set(q(".hero"), { top: "50%" }); isOpenRef.current = true; },
      });
    });

    self.add("closeMenu", () => {
      // the two other close tweens, unchanged
      gsap.to(q(".hero"), {
        top: "0%", opacity: 1,
        onComplete: () => { /* the six hard-reset gsap.set calls, unchanged */ isOpenRef.current = false; },
      });
    });
  }, rootRef);

  const handleOpen = () => { if (!isOpenRef.current) ctx.openMenu(); };
  const handleClose = () => { if (isOpenRef.current) ctx.closeMenu(); };
  menuOpenEl.addEventListener("click", handleOpen);
  menuCloseEl.addEventListener("click", handleClose);

  return () => {
    menuOpenEl.removeEventListener("click", handleOpen);
    menuCloseEl.removeEventListener("click", handleClose);
    ctx.revert();
  };
}, []);
```

`self` and the returned `ctx` are the same Context instance, so `self.add("openMenu", fn)` during setup is what makes `ctx.openMenu()` callable from the click handler later, with every tween it creates tracked exactly as if it had run synchronously. With that in place, `ctx.revert()` kills whichever tween either function is mid-flight on and rolls back the inline `clipPath`/`opacity`/`top` values GSAP wrote, so a StrictMode unmount mid-sweep leaves nothing running and — because a killed tween never reaches `onComplete` — never flips `isOpenRef` into a state that no longer matches reality. It still does not touch the two `click` listeners themselves: those are plain DOM subscriptions, the same category `gsap.ticker.add` falls into for a smooth-scroll setup, which is why they need the explicit `removeEventListener` pair above, keyed off the exact function references handed to `addEventListener`. Skip that pair and the StrictMode remount leaves two listeners on `.menu-open` and two on `.menu-close`, permanently defeating the guard the way described above — in production, not just in development.

The tilt effect needs the same two moves, independently. `update()`'s five tweens — the container's `rotate3d`, plus one parallax `translate`/`scale` per image — are created from inside the `mousemove` handler, not from a context's synchronous setup, so route them through their own `self.add()`-wrapped function, or kill them by hand (`gsap.killTweensOf(menuImgContainer)` and `gsap.killTweensOf(images)`) in that effect's cleanup; otherwise a tween already in flight when the component unmounts keeps writing `transform` onto a node React has already detached. Remove the `mousemove` listener on `document.body` and the `resize` listener on `window` by the same named-reference pattern used for the click handlers above.
