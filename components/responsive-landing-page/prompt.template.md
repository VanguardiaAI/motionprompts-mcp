---
slug: responsive-landing-page
native_system: entry-veil
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 10
structural_literals: 13
structural:
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: duration, literal: "3", rule: value/narrated }
  - { kind: duration, literal: "0.25", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: stagger, literal: "0.05", rule: value/narrated }
  - { kind: stagger, literal: "0.25", rule: value/narrated }
  - { kind: ease, literal: "\"expo.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Full-Screen Preloader → Curtain-Wipe Landing Reveal (counter + layered clip-path wipe)

## Goal

Build an auto-playing landing-page **preloader** for a fictional design studio called **New Reality**. On load a full-screen black panel fills the viewport; a numeric counter races **0 → 100** in the center while an editorial label ("NEW REALITY") reveals **letter-by-letter** from above, holds, then slides letter-by-letter **downward** out of view. At ~3 s the whole preloader **scales down to 0.5** and then, in a tightly staggered sequence, three stacked full-screen layers each **collapse upward** — a black panel and a red panel animate their `height` to 0, and a hero-image layer wipes away via `clip-path` — peeling back like curtains to uncover the site underneath: a giant `20vw` headline whose seven letters **rise up** into place, and two footer thumbnails that **wipe open from the left**. Everything is purely time-delayed on page load — no scroll, hover, or click.

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) only — **no** GSAP plugins, **no** ScrollTrigger, **no** Lenis/smooth-scroll. The page never scrolls; every animation is a load-triggered `gsap.to` / `gsap.from` with a `delay`.

```js
import gsap from "gsap";
```

Two effects are **not** GSAP and must be reproduced as described:

1. **The counter** (0 → 100) is a plain-JS `setTimeout` loop with random increments — not a tween.
2. **The label letter reveal** was originally an **anime.js v3.2.2** timeline using `easeOutExpo`. Reproduce it with GSAP: anime's `easeOutExpo` is mathematically identical to GSAP's **`expo.out`** (`1 − 2^(−10·t)`), so two `gsap.fromTo` tweens reproduce it faithfully with a single dependency (see the GSAP section). Do not add anime.js.

All animation code runs immediately on module execution (no `DOMContentLoaded` wrapper is required).

## Layout / HTML

Two sibling blocks: a `.container` holding the preloader layers, and a `.site-content` block (the real page) that sits **behind** everything (`z-index: -2`). Class/tag names are load-bearing — the JS and CSS query them exactly.

```html
<div class="container">
  <div class="pre-loader">
    <div class="loader"></div>       <!-- opaque BLACK full-screen panel -->
    <div class="loader-bg"></div>    <!-- RED full-screen panel, behind .loader -->
  </div>

  <div class="loader-content">       <!-- centered counter + label, on top -->
    <div class="count"><p>0</p></div>
    <div class="copy"><p class="ml16">New reality</p></div>
  </div>

  <div class="loader-2"></div>       <!-- full-screen HERO IMAGE layer, behind the panels -->
</div>

<div class="site-content">
  <nav>
    <div class="logo"><a href="#">New Reality</a></div>
    <div class="links">
      <a href="#">Info</a>
      <a href="#">Portfolio</a>
      <a href="#">Contact</a>
    </div>
  </nav>

  <div class="header">   <!-- one <h1> per letter → spells "NEWREAL" across the viewport -->
    <h1>N</h1><h1>e</h1><h1>w</h1><h1>r</h1><h1>e</h1><h1>a</h1><h1>l</h1>
  </div>

  <footer>
    <div class="footer-copy">
      <p>New Reality is a design studio based in Tokyo, Japan. We work with many
         companies to build and proactively deliver engaging brand experiences. We are
         unique in our ability to take a strategic approach while being visually driven.</p>
    </div>
    <div class="footer-nav">
      <div class="img"></div>   <!-- footer thumbnail 1 (CSS background-image) -->
      <div class="img"></div>   <!-- footer thumbnail 2 (CSS background-image) -->
    </div>
  </footer>
</div>
```

Notes:
- The seven `.header h1` each contain **one** letter; with `text-transform: uppercase` they read **NEWREAL** spread across the full width, each letter in its own equal-flex column.
- The two `.img` divs get their images from CSS `background-image` (not `<img>` tags).

## Styling

Global reset: `* { margin:0; padding:0; box-sizing:border-box }`. `html, body { width:100vw; height:100vh; font-family:"Neue Montreal" }`.

**Palette** (literal values):
- Loader panel: **black `#000`**, text **white `#fff`**.
- Second panel `.loader-bg`: **`red` (#ff0000)**.
- Site text / links: **black `#000`** on the page's default (transparent → white) background.

**Typography:**
- Body: **"Neue Montreal"** (a neutral grotesque sans; fall back to a clean `sans-serif`).
- `.copy` label and `.header h1`: **"PP Editorial Old"** (a high-contrast editorial serif; fall back to a `serif`). These are custom fonts and are simply referenced by name — load them via CDN/`@font-face` if available, otherwise the serif/sans fallbacks are fine.
- `.copy`: `font-size: 30px; text-transform: uppercase; line-height: 1`.
- `.header h1`: `font-size: 20vw; font-weight: 500; text-transform: uppercase; line-height: 1; text-align: center`.

**Key positioning & the states the animation depends on** (initial values matter):

- `.pre-loader` — `position: fixed; top:0; width:100%; height:100%; clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (a full-rect clip; present so the panel is a clean fixed layer).
- `.loader` — `position: absolute; top:0; width:100%; height:100%; background:#000; color:#fff; display:flex; justify-content:center; align-items:center` (opaque black, full screen; **starts at `height:100%`**).
- `.loader-bg` — `position: absolute; top:0; width:100%; height:100%; background:red; z-index:-1` (red panel sitting **behind** the black one; **starts at `height:100%`**).
- `.loader-content` — `position: absolute; top:50%; left:50%; transform: translate(-50%,-50%); display:flex; width:400px; z-index:2; color:#fff` (the centered counter+label, on top of everything).
  - `.count` — `flex: 2; text-align: right; line-height: 1; padding: 0 1em`.
  - `.copy` — `flex: 6` (the serif label, styled as above).
- `.ml16` — **`overflow: hidden`** (this masks the letters as they slide in/out).
- `.ml16 .letter` — `display: inline-block; line-height: 1em` (JS wraps each non-space character in `<span class="letter">`).
- `.loader-2` — `position: absolute; top:0; width:100%; height:100%; background: url(<hero image>) no-repeat 50% 50%; background-size: cover; z-index:-1; clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (the hero-image layer, **starts as a full-rect clip = fully visible**, sitting behind the red/black panels).
- `.site-content` — `position: relative; z-index: -2` (the real page, behind all preloader layers).
- `nav` — `width:100%; padding:2em; display:flex`. `nav > div { flex:1 }`. `.links { display:flex; justify-content:flex-end; gap:5em }`. `a { text-decoration:none; color:#000 }`.
- `.header` — `display:flex; padding:1em`. `.header h1 { flex:1; position:relative }` (see typography). **No** `overflow:hidden` here.
- `footer` — `position: fixed; bottom:0; width:100%; display:flex; align-items:flex-end; padding:2em`. `footer > div { flex:1 }`. `.footer-copy p { width:50% }`. `.footer-nav { display:flex; gap:2em; justify-content:flex-end }`.
- `.img` — `width:225px; height:150px; background-size:cover; background-position:50% 50%` and **`clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)`** (a zero-width sliver pinned to the **left** edge → the image is initially hidden and reveals by wiping open rightward). Assign each a background image (`.img:nth-child(1)`, `.img:nth-child(2)`).

## GSAP effect (be exhaustive)

Fire everything at module load. There is **no** master timeline — these are independent `gsap` tweens plus one plain-JS counter and a two-step letter animation. Times below are **seconds from load**.

### 1. Counter 0 → 100 (plain JS, not GSAP)

```js
function startLoader() {
  const el = document.querySelector(".count p");
  let value = 0;
  (function tick() {
    if (value < 100) {
      value = Math.min(value + (Math.floor(Math.random() * 10) + 1), 100); // +1..+10
      el.textContent = value;
      setTimeout(tick, Math.floor(Math.random() * 200) + 25);              // 25..225 ms
    }
  })();
}
startLoader();
```

The number jumps up in random steps of 1–10 with random 25–225 ms gaps, hitting 100 around ~2–3 s. It is then faded out by GSAP (steps 2 & 5 below).

### 2. Label letters — reveal, hold, exit (GSAP `expo.out`, reproducing the anime.js `easeOutExpo` timeline)

First wrap each visible character of `.ml16` in a span, then run two `fromTo` tweens:

```js
const wrap = document.querySelector(".ml16");
wrap.innerHTML = wrap.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
const letters = document.querySelectorAll(".ml16 .letter"); // "Newreality" → 10 letters (space not wrapped)

// Phase 1 — reveal: each letter drops in from 100px above to 0
gsap.fromTo(letters,
  { y: -100 },
  { y: 0, ease: "expo.out", duration: 1.5, stagger: {{motion.stagger.tight}} }   // stagger 30ms per letter, from load
);

// Phase 2 — exit: each letter slides 100px downward out of view
gsap.fromTo(letters,
  { y: 0 },
  { y: 100, ease: "expo.out", duration: 3, stagger: {{motion.stagger.tight}}, delay: 3.77 }
);
```

Timing rationale (matching the original anime.js timeline): phase 1 is `translateY [-100 → 0]`, 1.5 s, `easeOutExpo`, per-letter delay `30·i` ms. Phase 2 is appended after phase 1 ends (~1.77 s) with an additional per-letter delay of `2000 + 30·i` ms → each letter begins its downward exit at ≈ **3.77 s + 30 ms·i**, animating `translateY [0 → 100]` over 3 s. The `overflow:hidden` on `.ml16` masks the letters through both phases.

### 3. Counter fade (early)

```js
gsap.to(".count", { opacity: 0, delay: 3.5, duration: 0.25 });
```

### 4. Preloader scale-down

```js
gsap.to(".pre-loader", { scale: 0.5, ease: "{{motion.ease.exit}}", duration: 2, delay: 3 });
```

The entire preloader (black + red panels) shrinks from scale 1 → 0.5 toward the viewport center, starting at 3 s over 2 s.

### 5. Counter fade (final, redundant with #3)

```js
gsap.to(".count", { opacity: 0, ease: "{{motion.ease.exit}}", duration: {{motion.duration.fast}}, delay: 3.75 });
```

### 6. Black panel collapses upward

```js
gsap.to(".loader", { height: "0", ease: "{{motion.ease.exit}}", duration: 1.5, delay: 3.75 });
```

`.loader` is `top:0`, so animating `height` 100% → 0 collapses the black panel upward.

### 7. Red panel collapses upward

```js
gsap.to(".loader-bg", { height: "0", ease: "{{motion.ease.exit}}", duration: 1.5, delay: 4 });
```

Same collapse for the red panel, 0.25 s behind the black one — so you glimpse the red layer as the black one clears.

### 8. Hero-image layer wipes away (clip-path)

```js
gsap.to(".loader-2", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
  ease: "{{motion.ease.exit}}", duration: 1.5, delay: 3.5,
});
```

The hero-image layer's clip goes from a **full rectangle** (`0 0, 100% 0, 100% 100%, 0 100%`) to a **zero-height line at the top** (both bottom corners pulled up to `y:0`) — the image collapses/wipes upward and disappears, exposing the `.site-content` behind it. Because the black (#6) and red (#7) panels are collapsing at almost the same moment, the three layers peel back like stacked curtains.

### 9. Headline letters rise in

```js
gsap.from(".header h1", { y: 200, ease: "{{motion.ease.exit}}", duration: 1.5, delay: 3.75, stagger: 0.05 });
```

The seven `NEWREAL` letters each animate from `y:200` (200px below) up to their resting position, staggered 0.05 s.

### 10. Footer thumbnails wipe open

```js
gsap.to(".img", {
  clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
  ease: "{{motion.ease.exit}}", duration: 1.5, delay: 4.5, stagger: 0.25,
});
```

Each `.img` clip animates from its CSS zero-width left sliver to a full rectangle → the two thumbnails wipe open left-to-right, 0.25 s apart.

### Approximate timeline (seconds from load)

| t | event |
|---|-------|
| 0 | counter starts ticking; label letters reveal from above (phase 1) |
| ~2–3 | counter reaches 100 |
| 3.0 | preloader begins scaling 1 → 0.5 (#4) |
| 3.5 | counter fade #3; hero-image layer begins clip-wipe up (#8) |
| 3.75 | final counter fade (#5); black panel height→0 (#6); headline letters rise (#9); label letters begin downward exit (phase 2) |
| 4.0 | red panel height→0 (#7) |
| 4.5 | footer thumbnails begin wiping open (#10) |
| ~5.5–6.5 | all reveals settle; site fully visible |

Total intro ≈ **6.5 s**.

## Assets / images

- **1 hero background image** on `.loader-2`, full-bleed (`background-size: cover`, landscape ~16:9). A warm, richly-toned editorial/artwork image — it flashes into view mid-transition as the panels peel back, then wipes upward. Any bold, warm full-bleed image works in this role; it is only visible for a moment during the curtain wipe.
- **2 footer thumbnails** on the `.img` divs, each rendered **225×150 px (~3:2 landscape)**, `background-size: cover`. Editorial/photographic in tone (e.g. a motion-blurred warm-monochrome crowd, and a moody hand-holding-glass-crystal shot). They reveal by clip-path wiping open from the left. Cropping via cover is expected.

No client branding — the demo studio name is **"New Reality"** ("Newreal" in the split headline). Keep all copy neutral/placeholder.

## Behavior notes

- **Autoplay once** on load; no scroll, hover, or click anywhere. The page itself does not scroll.
- Keep the layer stacking exact: `.loader-content` `z-index:2` (top) → `.loader` (black) → `.loader-bg` (red, `z-index:-1`) → `.loader-2` (hero, `z-index:-1`) → `.site-content` (`z-index:-2`, bottom). The reveal reads correctly only with this order.
- The `overflow:hidden` on `.ml16` and the exact initial `clip-path` values on `.loader-2` and `.img` are essential — they are what the tweens animate away from.
- Responsive `@media (max-width: 900px)`: `footer` becomes `flex-direction: column; gap: 2em`, `.footer-copy p` widens to `width:100%`, and `.footer-nav` becomes `width:100%; justify-content:space-between`. The animation logic is unchanged.
- No reduced-motion handling exists in the original; add a `prefers-reduced-motion` guard if desired, but it is not part of the reference behavior.
```

## Images

This component ships with 3 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/responsive-landing-page/hero.gif
https://motionprompts.dev/c/responsive-landing-page/nav-1.avif
https://motionprompts.dev/c/responsive-landing-page/nav-2.avif
```

`hero.gif` is the animated hero backdrop, set as a `background-image` in the CSS rather than as an
`<img>`, which is why it is easy to miss when reading the markup. The two `nav-*.avif` are the
navigation thumbnails.

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--muted`, `--line`, `--accent`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs at module scope, reaches into the page with `document.querySelector` and bare GSAP selector strings, and never has to undo itself once the intro finishes. React withdraws all of that at once, and it does so quietly — the wipe plays once, looks right, and a StrictMode remount leaves a second copy of the whole schedule running underneath the first.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component has no scroll trigger and no loop that outlives its own intro, but the double mount still doubles a one-shot sequence: two counters racing to write into `.count p`, two `.header h1` rise-ins fighting over the same seven letters, two clip-path wipes scheduled against the same pair of `.img` thumbnails a few hundred milliseconds apart. None of this throws, so it will not reproduce in a production build — it just makes the intro look glitchy in development, in a way nobody will trace back to StrictMode. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — the script runs at the top level, the instant the module is evaluated: no `DOMContentLoaded`, no `readyState` check, no `load` listener. `startLoader()`, the `.count` opacity fade, and the `.ml16` letter-wrap all execute immediately, and the rest of the sequence — `.pre-loader` scaling down, `.loader`/`.loader-bg` collapsing, `.loader-2` and `.img` wiping open, `.header h1` rising — is scheduled with `delay` on tweens created at that same import-time instant. In React, import time is before the component has rendered anything, so none of `.count`, `.ml16`, `.pre-loader`, `.header h1` or `.img` exist yet. Move the entire body — the counter, the letter-wrap, and every tween — into a `useEffect` with an empty dependency array. Leaving it in the component body would replay the whole intro, counter included, on every re-render.

*(2) Element lookups* — this script's targets split into two groups that need different treatment. Every `gsap.to`/`gsap.from`/`gsap.fromTo` call already addresses its target with a bare selector string — `.count`, `.pre-loader`, `.loader`, `.loader-bg`, `.loader-2`, `.header h1`, `.img`, `.ml16 .letter` — rather than a pre-queried element, and `gsap.context(fn, rootRef)` scopes string targets to the ref's subtree automatically, so none of those need rewriting inside the tween calls themselves. The two lookups written as plain `document.querySelector` do **not** get that scoping for free: `document.querySelector(".count p")` inside `startLoader()`, and `document.querySelector(".ml16")` before the letter-wrap. Rewrite both against `rootRef.current`. Left unscoped, either can resolve against the copy of the subtree a StrictMode remount is discarding rather than the one still mounted, so the counter ticks into a detached node while the visible one never updates.

*(3) Cleanup — GSAP context, the counter's own timer, and the letter-wrap* — wrap the sequence in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const timeoutRef = { current: null };
  const ctx = gsap.context(() => {
    const el = rootRef.current.querySelector(".count p");
    let value = 0;
    (function tick() {
      if (value >= 100) return;
      value = Math.min(value + (Math.floor(Math.random() * 10) + 1), 100);
      el.textContent = value;
      timeoutRef.current = setTimeout(tick, Math.floor(Math.random() * 200) + 25);
    })();

    const wrap = rootRef.current.querySelector(".ml16");
    wrap.innerHTML = wrap.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

    // the .count fade, the pre-loader scale, the loader/loader-bg collapse, the
    // loader-2 and .img clip-path wipes, the header rise, and the two letter
    // fromTo tweens all go here unchanged, addressed by the selector strings above
  }, rootRef);
  return () => {
    clearTimeout(timeoutRef.current);
    ctx.revert();
  };
}, []);
```

Every tween in this component schedules its start with `delay` rather than waiting on a callback — there is no `onComplete` chain here, unlike a relay that stages itself step by step. That means every one of them is *created* synchronously, in the same pass as everything else in the factory, even though it does not *play* until seconds later: `gsap.context` attributes a tween to itself the moment it is created, not the moment it starts, so `ctx.revert()` catches the entire schedule — the fade, the scale, both height collapses, both clip-path wipes, the header rise — with no need for `self.add` anywhere in this component. That is different from a sequence staged through nested `onComplete` callbacks, where later stages are created only once an earlier tween finishes and so fall outside the factory's synchronous window.

What `ctx.revert()` does not see is the counter's own recursive `setTimeout` — plain JS, not a GSAP object, the same blind spot as `gsap.ticker.add`. Hold its pending id (`timeoutRef` above) and `clearTimeout` it in the same cleanup that reverts the context. Skip that and a StrictMode-discarded mount keeps ticking for a while after its DOM is gone, still calling `setTimeout` against a node nothing displays.

The letter-wrap has the same blind spot for a different reason: `wrap.innerHTML = wrap.textContent.replace(...)` is a manual DOM rewrite, not a GSAP-tracked one, so revert leaves it in place. That is only a latent bug in the vanilla page, which never remounts — but a StrictMode remount runs it twice, and the second pass regexes over markup that already contains `<span class="letter">` tags instead of plain text, nesting spans inside spans and pointing the two letter tweens at the wrong nodes. The cleanup fix would be reverting the markup by hand; the better fix is not mutating `innerHTML` at all. Render the ten wrapped letters declaratively instead — map the characters of "New reality" to `<span className="letter">` elements in JSX, one per non-space character, in place of the `<p class="ml16">` — and target `.ml16 .letter` with the same two `fromTo` calls. A remount then re-renders the same ten spans instead of wrapping an already-wrapped string a second time.
