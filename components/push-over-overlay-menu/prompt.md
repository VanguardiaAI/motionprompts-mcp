# Minimal Push Overlay Menu

## Goal
Build a dark, minimal one-page site with a fixed menu bar whose star effect is a **fullscreen "push-over" overlay menu**: clicking the circular hamburger toggle runs a single GSAP timeline (custom "hop" ease) that simultaneously **pushes the entire page content down by 100svh**, **wipes the dark overlay open top-to-bottom via an animated `clip-path` polygon**, slides the overlay's inner content up from `-50%` to `0`, fades in a side media image, and reveals every menu link/tag/footer line with **SplitText line-masked reveals in reverse stagger**. Clicking again plays the mirrored closing timeline and the page slides back up.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`CustomEase`** and **`SplitText`**, and **`lenis`** for smooth scrolling. All logic in one `script.js` (`<script type="module">`), one `styles.css`, one `index.html`. Register plugins with `gsap.registerPlugin(CustomEase, SplitText)` and run everything inside a `DOMContentLoaded` listener.

## Layout / HTML
```html
<nav>
  <div class="menu-bar">
    <div class="menu-logo"><a href="#"><img src="<logo>" alt="" /></a></div>
    <div class="menu-toggle-btn">
      <div class="menu-toggle-label"><p>Menu</p></div>
      <div class="menu-hamburger-icon"><span></span><span></span></div>
    </div>
  </div>
  <div class="menu-overlay">
    <div class="menu-overlay-content">
      <div class="menu-media-wrapper"><img src="<menu image>" alt="" /></div>
      <div class="menu-content-wrapper">
        <div class="menu-content-main">
          <div class="menu-col">
            <!-- 5 large links, each: <div class="menu-link"><a href="#">…</a></div> -->
            <!-- Index · Portfolio · Studio · Journal · Connect -->
          </div>
          <div class="menu-col">
            <!-- 3 small tags, each: <div class="menu-tag"><a href="#">…</a></div> -->
            <!-- Web Animations · Interactive Media · Motion Craft -->
          </div>
        </div>
        <div class="menu-footer">
          <div class="menu-col"><p>Toronto, Canada</p></div>
          <div class="menu-col"><p>+1 437 555 0199</p><p>hello@nullspace.studio</p></div>
        </div>
      </div>
    </div>
  </div>
</nav>

<div class="container">
  <section class="hero"><h1>Modern design system made that looks timeless</h1></section>
  <section class="banner"><img src="<banner image>" alt="" /></section>
  <section class="outro"><h1>Let’s build something quietly iconic</h1></section>
</div>
```

## Styling

**Palette (CSS variables)**
- `--bg: #171717` (page background), `--fg: #fff`, `--menu-bg: #0f0f0f` (overlay background), `--menu-fg-secondary: #5f5f5f` (muted grey for tags/footer/menu-bar), `--hamburger-icon-border: rgba(255, 255, 255, 0.1)`.

**Typography**
- `body { font-family: "Hanken Grotesk", "Inter", sans-serif; }` — import both from Google Fonts: `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap");` and the equivalent for Inter. Everything is weight 500.
- `h1`: `7.5rem`, `letter-spacing: -0.2rem`, `line-height: 1`.
- `p`: `0.95rem`. Base `a`: `1.5rem`, `color: var(--fg)`, no underline.
- `.menu-link a`: `3.5rem`, `line-height: 1.2`. `.menu-tag a` and `.menu-footer p`: color `var(--menu-fg-secondary)`.
- Global reset (`* { margin:0; padding:0; box-sizing:border-box; }`), `img { width:100%; height:100%; object-fit: cover; }`.

**Page**
- `.container`: `position: relative; transform: translateY(0svh); background: var(--bg); color: var(--fg);` — the initial `translateY(0svh)` matters because GSAP pushes it to `100svh`.
- `section`: `position: relative; width: 100vw; height: 100svh; padding: 2rem; display:flex; justify-content:center; align-items:center; overflow:hidden; z-index: -1;` (the negative z-index keeps sections under the fixed nav). `section h1 { width: 75%; }`, `section img { opacity: 0.5; }`.

**Fixed nav shell**
- `nav`: `position: fixed; inset-top-left; width:100vw; height:100svh; pointer-events: none; overflow: hidden; z-index: 2;` — the nav itself is click-through; only its children re-enable pointer events.
- `.menu-bar`: `position: fixed; top:0; left:0; width:100vw; padding:2rem; display:flex; justify-content: space-between; align-items:center; pointer-events: all; color: var(--menu-fg-secondary); z-index: 2;`
- `.menu-logo`: `2rem × 2rem`. `.menu-toggle-btn`: flex row, `gap: 1rem`, `cursor: pointer`.
- `.menu-toggle-label`: `overflow: hidden` (this clips the label when GSAP slides the `<p>` up). Its `p`: `position: relative; transform: translateY(0%); will-change: transform;`.

**Hamburger icon (pure CSS morph)**
- `.menu-hamburger-icon`: `position: relative; width:3rem; height:3rem;` circular (`border-radius: 100%`), `border: 1px solid var(--hamburger-icon-border)`, flex column centered.
- Each `span`: `position:absolute; width:15px; height:1.25px; background: var(--fg); transform-origin: center; will-change: transform;` and — key — `transition: all 0.75s cubic-bezier(0.87, 0, 0.13, 1);` (the same curve as the GSAP "hop" ease).
- Resting state: span 1 `translateY(-3px)`, span 2 `translateY(3px)` (two parallel lines).
- `.menu-hamburger-icon.active` state: span 1 `translateY(0) rotate(45deg) scaleX(1.05)`, span 2 `translateY(0) rotate(-45deg) scaleX(1.05)` — the lines merge into an X. JS only toggles the `active` class; CSS animates it.

**Overlay**
- `.menu-overlay` and `.menu-overlay-content`: both `position: fixed; top:0; left:0; width:100vw; height:100svh; color: var(--fg); overflow: hidden; z-index: 1;`.
- `.menu-overlay`: `background: var(--menu-bg);` with initial `clip-path: polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)` (a zero-height strip pinned to the top edge — fully hidden) and `will-change: clip-path`.
- `.menu-overlay-content`: `display: flex; transform: translateY(-50%); will-change: transform; pointer-events: all;` — it starts shifted up half a screen; GSAP parses that as `yPercent: -50`.
- `.menu-media-wrapper`: `flex: 2; opacity: 0; will-change: opacity;` and its `img { opacity: 0.25; }` (a dim, moody panel).
- `.menu-content-wrapper`: `flex: 3; position: relative; display: flex;`.
- `.menu-content-main`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);`. `.menu-footer`: `margin: 0 auto;`. Both: `width: 75%; padding: 2rem; display: flex; align-items: flex-end; gap: 2rem;`.
- `.menu-col`: flex column, `gap: 0.5rem`; inside `.menu-content-main` / `.menu-footer` the first col gets `flex: 3`, the second `flex: 2`.
- `.line` (the class SplitText assigns to each line): `position: relative; will-change: transform;`.

## GSAP effect (exhaustive)

**Setup**
1. `gsap.registerPlugin(CustomEase, SplitText)`; then `CustomEase.create("hop", ".87,0,.13,1")` — this bezier is the signature ease used by every structural tween.
2. Lenis smooth scroll: `const lenis = new Lenis()` driven by a `requestAnimationFrame` loop calling `lenis.raf(time)`.
3. **SplitText prep** — for every `.menu-col` container (there are 4: links col, tags col, and the 2 footer cols), select all its `a` and `p` elements and split **each element** with `SplitText.create(element, { type: "lines", mask: "lines", linesClass: "line" })` (the `mask: "lines"` option wraps every line in its own overflow-clipping mask wrapper). Keep the splits grouped **per container** in an array of arrays (`splitTextByContainer`). Immediately hide every line: `gsap.set(split.lines, { y: "-110%" })` — each line waits above its mask.

**State guards** — `isMenuOpen` and `isAnimating` booleans. The toggle click handler returns early while `isAnimating` is true, so the animation can never be interrupted mid-flight.

**OPEN timeline** (click while closed): set `isAnimating = true`, call `lenis.stop()` (page scroll is frozen while the menu is open), then build one `gsap.timeline()` where the first five tweens all start together at position `"<"` (time 0):
1. `.menu-toggle-label p` → `y: "-110%"`, `duration: 1`, `ease: "hop"` — the word "Menu" slides up out of its overflow-hidden wrapper and disappears.
2. `.container` → `y: "100svh"`, `duration: 1`, `ease: "hop"` — the whole page is pushed down one full viewport (the "push-over").
3. `.menu-overlay` → `clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"`, `duration: 1`, `ease: "hop"` — the overlay's bottom edge sweeps from the top of the screen down to the bottom, revealing the dark menu in a top-anchored wipe that moves in lockstep with the page being pushed down.
4. `.menu-overlay-content` → `yPercent: 0`, `duration: 1`, `ease: "hop"` — the content rides up from its initial `translateY(-50%)` to its natural position (a parallax counter-movement against the wipe).
5. `.menu-media-wrapper` → `opacity: 1`, `duration: 0.75`, `ease: "power2.out"`, `delay: 0.5`, positioned at `"<"` — the side image fades in during the second half of the wipe (effective window ≈ 0.5s→1.25s).

**Line reveals** — after those five, loop over `splitTextByContainer`; for each container, flatten its splits into one array of line elements (`containerSplits.flatMap(split => split.lines)`) and add:
- `tl.to(copyLines, { y: "0%", duration: 2, ease: "hop", stagger: -0.075 }, -0.15)`
- Details that matter: `stagger: -0.075` is **negative**, so within each group the **last line starts first** and the reveal runs bottom-up, 0.075s apart. The position parameter `-0.15` means "insert 0.15s before the current end of the timeline" — and since each added tween extends the timeline's end (its span is `2 + 0.075 × (lines − 1)` seconds), the four container groups **chain into a cascade**, each group beginning 0.15s before the previous group's tween finishes: group 1 (5 link lines) starts at ≈1.1s, group 2 (3 tag lines) at ≈3.25s, group 3 (1 footer line) at ≈5.25s, group 4 (2 footer lines) at ≈7.1s. Do NOT insert them all at the same time — add them sequentially in a loop with position `-0.15` so this cascade emerges naturally.

Also on open: `hamburgerIcon.classList.add("active")` (CSS morphs the icon to an X over 0.75s), and finish with `tl.call(() => { isAnimating = false; })`. Set `isMenuOpen = true`.

**CLOSE timeline** (click while open): set `isAnimating = true`, remove the `active` class from the hamburger, then one timeline with five tweens all starting together (first at default position, the rest at `"<"`), all `duration: 1`, `ease: "hop"`:
1. `.container` → `y: "0svh"` — the page slides back up.
2. `.menu-overlay` → `clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)"` — the overlay collapses back to a zero-height strip at the top (bottom edge sweeps upward).
3. `.menu-overlay-content` → `yPercent: -50` — the content slides back up behind the wipe.
4. `.menu-toggle-label p` → `y: "0%"` — the word "Menu" slides back down into view.
5. All `.menu-col` containers → `opacity: 0.25` — the menu copy dims as it exits.

End the close timeline with a `tl.call()` that resets everything instantly for the next open: `gsap.set` all split lines back to `y: "-110%"`, `gsap.set` the `.menu-col` containers back to `opacity: 1`, `gsap.set(.menu-media-wrapper, { opacity: 0 })`, then `isAnimating = false` and `lenis.start()`. Set `isMenuOpen = false`.

## Assets / images
3 images, described by role:
1. **Logo** — a small square (1:1) abstract studio logo mark on transparent background (PNG), rendered at 2rem in the top-left of the menu bar.
2. **Menu overlay media** — one moody, dark editorial photograph (roughly portrait/full-height crop; it fills the left 2/5 of the overlay at full viewport height, `object-fit: cover`) shown at 25% opacity as an ambient panel inside the open menu.
3. **Page banner** — one large atmospheric photograph filling the middle full-screen section (`100vw × 100svh`, `object-fit: cover`) at 50% opacity behind the dark background.

No real brand names — use the neutral fictional studio contact shown in the HTML above.

## Behavior notes
- The open/close animations are click-triggered only; `isAnimating` locks out clicks mid-animation.
- Lenis smooth scroll runs on the page and is stopped while the menu is open, restarted on close.
- The page sections use `z-index: -1` so the fixed nav/overlay always sit above them; the nav shell is `pointer-events: none` with `pointer-events: all` re-enabled only on the menu bar and the overlay content.
- Responsive at `max-width: 1000px`: `h1` drops to `3rem` (letter-spacing `-0.05rem`, full width), the media wrapper is hidden (`display: none`), `.menu-content-main` and `.menu-footer` go full width, `.menu-content-main` becomes a column (`align-items: flex-start; gap: 5rem`), `.menu-link a` drops to `3rem` and `.menu-tag a` to `1.25rem`.
- Use `svh` units throughout (heights and the container push) for correct mobile viewport behavior.

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/push-over-overlay-menu/hero.jpg
https://motionprompts.dev/c/push-over-overlay-menu/logo.png
https://motionprompts.dev/c/push-over-overlay-menu/menu-media.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--fg`, `--menu-bg`, `--menu-fg-secondary`, `--hairline`, `--accent`, `--hamburger-icon-border`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, then wires a single click listener to `.menu-toggle-btn` that builds a brand-new `gsap.timeline()` on every open and every close, and never expects a second copy of itself to exist. React withdraws that guarantee.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component is unusually exposed to that, because `isMenuOpen`, `isAnimating`, and the click listener that reads them all live inside one closure: leave the vanilla `addEventListener` in place with no matching `removeEventListener`, and the remount leaves two listeners on the same button, one of them closing over state from a copy of the component that no longer exists. A single click then fires both handlers — two open timelines racing to push the same `.container` and wipe the same `.menu-overlay`'s `clip-path`, and two `SplitText` passes splitting the already-split `.menu-col` lines into spans nested one level deeper, so from that click on the line-mask reveal targets the wrong nodes. None of this shows up in a production build, where the double-invoke never happens — only in development, and only starting on the second click.

*(1) The entry point* — The script wraps its entire body — the `CustomEase` registration, the Lenis instance and its own `requestAnimationFrame` loop, the `SplitText` prep over every `.menu-col`, and the click listener on `.menu-toggle-btn` — inside `document.addEventListener("DOMContentLoaded", …)`. By the time a React component mounts, that event has already fired, so the listener is never called: no split lines, no working toggle, no error either. Delete the listener and move its body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(CustomEase, SplitText)` and the `CustomEase.create("hop", …)` call right after it touch no DOM and gain nothing from re-running on every mount — leave both at module scope, next to the imports.

*(2) Element lookups* — The markup is two siblings under the page root: `nav` (holding `.menu-bar` and `.menu-overlay`) and `.container` (the three sections the toggle pushes down). Wrap both in one root element with a ref and scope every lookup to it: `.container`, `.menu-toggle-btn`, `.menu-overlay`, `.menu-overlay-content`, `.menu-media-wrapper`, `.menu-toggle-label p`, `.menu-hamburger-icon`, and `.menu-col`. That last one is queried twice in the script — once as `textContainers` to build the splits, again as `copyContainers` to reset opacity on close — resolve it once through the context's scoped selector and reuse the result for both instead of asking the DOM for the same four nodes a second time.

*(3) Cleanup* — Wrap the `SplitText` prep and the Lenis setup in a `gsap.context` scoped to the root ref. Neither `openMenu` nor `closeMenu` exists yet when that factory runs — each is a fresh `gsap.timeline()` built later, inside `handleClick`, on whichever click triggers it — so register both as named context methods:

```jsx
useEffect(() => {
  let rafId;
  let lenis;
  let splitTextByContainer = [];
  let isMenuOpen = false;
  let isAnimating = false;

  const ctx = gsap.context((self) => {
    const q = self.selector;
    const menuCols = q(".menu-col");

    menuCols.forEach((container) => {
      const textElements = container.querySelectorAll("a, p");
      const containerSplits = [];
      textElements.forEach((element) => {
        const split = SplitText.create(element, { type: "lines", mask: "lines", linesClass: "line" });
        containerSplits.push(split);
        gsap.set(split.lines, { y: "-110%" });
      });
      splitTextByContainer.push(containerSplits);
    });

    lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    self.add("openMenu", () => {
      /* the OPEN timeline exactly as documented above, built against q(...) targets and the
         flattened splitTextByContainer lines; its tl.call() at the end flips isAnimating false */
    });

    self.add("closeMenu", () => {
      /* the CLOSE timeline; its tl.call() resets every split line and menuCols back to hidden,
         restarts lenis, and flips isAnimating false */
    });
  }, rootRef);

  const toggleBtn = rootRef.current.querySelector(".menu-toggle-btn");
  const handleClick = () => {
    if (isAnimating) return;
    isAnimating = true;
    if (!isMenuOpen) {
      lenis.stop();
      ctx.openMenu();
    } else {
      ctx.closeMenu();
    }
    isMenuOpen = !isMenuOpen;
  };
  toggleBtn.addEventListener("click", handleClick);

  return () => {
    toggleBtn.removeEventListener("click", handleClick);
    cancelAnimationFrame(rafId);
    lenis.destroy();
    ctx.revert();
    splitTextByContainer.flat().forEach((split) => split.revert());
  };
}, []);
```

The `gsap.set` calls inside the `menuCols.forEach` loop run during the context's synchronous pass, so `ctx.revert()` already knows to undo that hidden line-mask offset on teardown. `openMenu` and `closeMenu` do not get that for free: both are built from scratch, later, from inside `handleClick`, so without `self.add` neither the push-over tween on `.container`, nor the `clip-path` wipe on `.menu-overlay`, nor the line reveal, is ever visible to `ctx.revert()` — a StrictMode unmount that lands mid-open leaves that timeline running against a `.container` React has already discarded. Call the two methods back as `ctx.openMenu()` / `ctx.closeMenu()`, never `openMenu()`/`closeMenu()` directly, and never write `ctx.add(` inside the factory itself — the parameter the factory receives is `self`; `ctx` is still in its temporal dead zone there. `isMenuOpen` and `isAnimating` stay plain closured `let`s rather than `useRef`: nothing in the JSX reads them (the hamburger's morph to an X is the `.active` class reacting in CSS, not a React re-render), and because `handleClick` is removed on every unmount, each new effect run starts with its own clean pair — there is no stale-closure case here the way there is when a leaked listener lets two generations of state coexist.

Lenis's `raf` loop lives inside the same factory, driven by your own `requestAnimationFrame`, not Lenis's own scheduling. Keep the handle and cancel it in the cleanup before calling `destroy()`, or a frame already queued calls `lenis.raf()` against an instance that no longer exists. Nothing about this page implies a shared scroller — the whole document is this component — so owning the Lenis instance here, rather than lifting it to an app shell, is the right default; revisit that only if this menu ends up mounted as one section inside a larger app that already runs its own Lenis.

Splitting rewrites every `a`/`p` inside `.menu-col` into per-line spans wrapped in a masking element; because `splitTextByContainer` holds one `SplitText` instance per text element (the two footer columns each hold two `<p>` tags, not one), flatten it and revert every instance in the cleanup — after `ctx.revert()`, not before, so any `openMenu`/`closeMenu` tween still in flight against `.line` nodes is killed before the nodes it targets are removed. One element here is genuinely sensitive to which face is active when the split runs: `.menu-tag a` holds two-word labels ("Web Animations", "Interactive Media") narrow enough to wrap depending on the metrics of whichever font is current. If Hanken Grotesk swaps in after the split already ran against the Inter fallback and a tag's line count changes, the newly-created line span never gets the initial hidden offset — that `gsap.set` already fired — so it renders in place, out of step with the rest of the cascade. If this component might mount before the custom face is active, gate the `.menu-col` split behind `document.fonts.ready`, with a `cancelled` flag the cleanup sets so a resolution that lands after unmount doesn't split a node that is already gone.
