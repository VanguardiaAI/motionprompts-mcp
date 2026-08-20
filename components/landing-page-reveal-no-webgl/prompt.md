# Landing Page Reveal with Circular Gallery — Counter Preloader → Flip Ring

## Goal
Build a full-viewport editorial landing intro that plays **once on page load** (≈7 seconds, no scroll). A tiny numeric preloader near the bottom-center counts up `0 → 100`; meanwhile **30 small photo cards** rise from below the fold into a tightly-overlapped, horizontally-centered stack. When the counter finishes it slides away, and the whole stack **morphs — via GSAP Flip — into a rotating circular gallery** (a ring of 30 cards, each rotated tangent to the circle), while the fixed nav labels slide up into view. The star effect is the Flip-driven linear-stack → circle transform where every card simultaneously travels to its slot on the ring **and** spins to its tangent angle, all on a custom `hop` ease.

## Tech
Vanilla HTML/CSS/JS with ES-module imports. Use **`gsap`** (npm) plus the GSAP plugins **`Flip`** and **`CustomEase`** — nothing else (no ScrollTrigger, no Lenis, no SplitText, no Three.js/WebGL/canvas). Register with `gsap.registerPlugin(Flip, CustomEase)`. Fire the whole sequence inside a `DOMContentLoaded` listener. Ship one `index.html` (`<link rel="stylesheet" href="./styles.css">` and `<script type="module" src="./script.js">`), one `styles.css`, one ES-module `script.js`. Must run in a fresh Vite + npm project.

## Layout / HTML
Class names are load-bearing (the JS/CSS query them). The `.gallery` ships **empty** — JS injects all 30 cards.

```html
<div class="container">
  <nav>
    <div class="col">                                  <!-- col 1 (flex 4) -->
      <div class="nav-items"><div class="nav-item"><p>Meridian</p></div></div>
      <div class="nav-items"><div class="nav-item"><p>Youtube Channel</p></div></div>
    </div>
    <div class="col">                                  <!-- col 2 (flex 2) -->
      <div class="nav-items">
        <div class="nav-item"><p>Work</p></div>
        <div class="nav-item"><p>Studio</p></div>
        <div class="nav-item"><p>Contact</p></div>
      </div>
      <div class="nav-items">
        <div class="nav-item"><p>Twitter</p></div>
        <div class="nav-item"><p>Instagram</p></div>
      </div>
    </div>
  </nav>

  <div class="loader"><p>0</p></div>

  <div class="gallery"></div>
</div>
<script type="module" src="./script.js"></script>
```

Notes:
- **7 nav labels total**, split across two `.col` groups. Col 1 holds two side-by-side single-line labels; col 2 holds two stacked lists (Work/Studio/Contact and Twitter/Instagram). Use neutral fictional labels — the logo can be any placeholder studio name (e.g. "Meridian"); **no real brand names.**
- Each label text sits inside `.nav-item > p` — the `<p>` is the element that animates; the `.nav-item` is its clipping mask.
- `.loader > p` starts as the text `0`; JS overwrites it with the counting value.
- `.gallery` is the (unpositioned) host for the 30 injected `.item` cards.

## Styling

**Font:** the original uses a Söhne-style grotesque. Use a neutral grotesque sans fallback (system sans / Inter / Helvetica Neue). All text is tiny — **`font-size: 13px`** for every `p`/`a`.

**Palette:** page background **`#dad8d4`** (warm light grey), text **`#000`**, card placeholder background **`#b0b0b0`** (grey shown before images load).

**Reset & globals:**
```css
* { margin:0; padding:0; box-sizing:border-box; }
html, body { width:100%; height:100vh; font-family:"Söhne", sans-serif; background:#dad8d4; color:#000; }
p, a { text-decoration:none; font-size:13px; }
img { width:100%; height:100%; object-fit:cover; }
```

**Container (the stage):**
```css
.container { position:relative; width:100%; height:100%; overflow:hidden; }
```
`overflow:hidden` is essential — cards start below the fold (`top:150%`) and the ring extends past center; nothing should spill/scroll.

**Nav (fixed top):**
```css
nav { position:fixed; top:0; width:100%; padding:1.5em; display:flex; gap:4em; }
.col { display:flex; gap:1em; }
.col:nth-child(1){ flex:4; }
.col:nth-child(2){ flex:2; display:flex; }
.nav-items{ flex:1; }               /* block children stack vertically */
```

**Nav label mask (each label is a 20px-tall clip window):**
```css
.nav-item{
  width:max-content; height:20px; margin-bottom:0.125em;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);   /* full-rect mask */
}
```

**Cards (all absolutely positioned in the container):**
```css
.item{ position:absolute; width:175px; height:250px; background:#b0b0b0; }
```
Fixed **175×250 px** (≈5:7 portrait). They are positioned entirely by JS via `left`/`top`/`rotation`/`transform` — never by flow.

**Loader (bottom-center numeric preloader, also a 20px clip window):**
```css
.loader{
  position:absolute; bottom:15%; left:50%; transform:translate(-50%,-50%);
  width:40px; height:20px; text-align:center;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);   /* full-rect mask */
}
```

**The two masked text elements start pushed BELOW their window:**
```css
.loader p, .nav-item p{ position:relative; display:block; transform:translateY(20px); }
```
Because each mask is exactly 20px tall and the `<p>` starts translated down 20px, the text is initially hidden just below the clip window; animating `y → 0` slides it up into view, and animating `y → -20` slides it up out of view.

## GSAP effect (be exhaustive)

### Setup
```js
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(Flip, CustomEase);
CustomEase.create("hop", "M0,0 C0.053,0.604 0.157,0.72 0.293,0.837 0.435,0.959 0.633,1 1,1");

const itemsCount = 30;
const container = document.querySelector(".container");
const gallery   = document.querySelector(".gallery");
```
`hop` is a fast-rise, soft-settle ease (steep at the start, decelerating to 1 with no overshoot) — used for the card rise and the Flip morph.

### Step 0 — Build the cards
Loop `i = 1..30`: create `div.item`, create an `img` with `img.src` = the i-th portrait photo (e.g. `/images/img${i}.jpg`) and `alt="Image ${i}"`, append `img` to the item, append the item to `.gallery`. (30 `.item` cards, each holding one full-bleed `img`.)

### Step 1 — Initial linear stack + rise-in (fires immediately on load)
```js
const items = document.querySelectorAll(".item");
const totalItemsWidth = (items.length - 1) * 10 + items[0].offsetWidth;  // 29*10 + 175 = 465
const startX = (container.offsetWidth - totalItemsWidth) / 2;            // centers the strip

items.forEach((item, index) => {
  gsap.set(item, { left: `${startX + index * 10}px`, top: "150%", rotation: 0 });
});

gsap.to(items, {
  top: "50%",
  transform: "translateY(-50%)",
  duration: 1,
  ease: "hop",
  stagger: 0.03,
});
```
- Cards are **175px wide but stepped only 10px apart** on `left` → a heavily-overlapping, near-collapsed horizontal deck, centered by `startX`.
- They start at `top:150%` (fully below the fold) and animate up to `top:50%` with `transform:translateY(-50%)` (vertically centered).
- `duration:1`, `ease:"hop"`, **`stagger:0.03`** left-to-right (index order) → the deck rises like a fan, ~0.9s of stagger tail.

### Step 2 — Counter reveal (starts at delay 1s)
```js
gsap.to(".loader p", {
  y: 0, duration: 1, ease: "power3.out", delay: 1,
  onComplete: animateCounter,
});
```
The loader `0` slides up from `translateY(20px)` into its 20px window over 1s (`power3.out`), starting 1s after load. `onComplete` → `animateCounter`.

### Step 3 — The count-up (manual, NOT a tween)
`animateCounter()` ticks the number with `setTimeout`, not GSAP:
```js
function animateCounter(){
  const el = document.querySelector(".loader p");
  let currentValue = 0;
  const updateInterval = 300;   // ms per tick
  const maxDuration    = 2000;  // ms total counting window
  const endValue       = 100;
  const startTime = Date.now();

  const update = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed < maxDuration){
      currentValue = Math.min(currentValue + Math.floor(Math.random() * 30) + 5, 100);
      el.textContent = currentValue;
      setTimeout(update, 300);
    } else {
      el.textContent = 100;
      setTimeout(() => {
        gsap.to(el, {
          y: -20, duration: 1, ease: "power3.inOut",
          onComplete: () => {
            animateToCircularLayout();
            setTimeout(() => {
              gsap.to(".nav-item p", { y: 0, duration: 1, ease: "power3.inOut", stagger: 0.075 });
            }, 100);
          },
        });
      }, -300);   // negative delay → fires on next tick (≈0ms)
    }
  };
  update();
}
```
- Every **300ms** the value jumps by a **random 5–34** (`floor(random*30)+5`), clamped to 100 — so it counts up erratically, not smoothly, over the 2s window.
- After 2s it's pinned to `100`, then the number **slides up and out** (`y:-20`, 1s, `power3.inOut`) above its mask.
- On that tween's complete: **fire the Flip morph** (`animateToCircularLayout`), and **100ms later** reveal the nav labels — `.nav-item p` slide `y → 0`, `duration:1`, `ease:"power3.inOut"`, **`stagger:0.075`** across all 7 labels (DOM order).

### Step 4 — THE STAR EFFECT: Flip linear-stack → circular ring
Compute the target ring layout, capture the pre-state, apply it, then let Flip animate the delta:
```js
const setCircularLayout = () => {
  const items = document.querySelectorAll(".item");
  const n = items.length;                       // 30
  const angleIncrement = (2 * Math.PI) / n;     // 12° per card
  const radius  = 210;
  const centerX = container.offsetWidth  / 2;
  const centerY = container.offsetHeight / 2;

  items.forEach((item, index) => {
    const angle = index * angleIncrement;
    const x = centerX + radius * Math.cos(angle) - item.offsetWidth  / 2;
    const y = centerY + radius * Math.sin(angle) - item.offsetHeight / 2;
    gsap.set(item, {
      left: `${x}px`,
      top:  `${y}px`,
      rotation: (angle * 180) / Math.PI - 90,   // tangent to the circle
      transform: "translateY(0%)",              // drop the -50% centering offset
    });
  });
};

const animateToCircularLayout = () => {
  const items = document.querySelectorAll(".item");
  const state = Flip.getState(items);           // capture current (linear-stack) position + rotation
  setCircularLayout();                          // instantly jump cards to their ring slots
  Flip.from(state, {
    duration: 2,
    ease: "hop",
    stagger: -0.03,                             // NEGATIVE: last card leads, first trails
    onEnter: (element) => gsap.to(element, { rotation: "+=360" }),
  });
};
```
Key mechanics:
- **Ring geometry:** 30 cards spaced `2π/30` (12°) apart on a circle of **radius 210px** centered in the container. Each card's `left/top` places its center on the ring; each card's **`rotation` is its polar angle in degrees minus 90°**, i.e. tangent to the circle (cards lie along the rim, not all upright).
- **Flip captures both position AND rotation.** Because the pre-state has every card at `rotation:0` in the overlapping strip and the post-state has each at its tangent angle on the ring, `Flip.from` interpolates **both** — so cards simultaneously slide out to their slot and **spin into their tangent orientation**. This dual travel+spin is the signature moment.
- `duration:2`, `ease:"hop"`.
- **`stagger:-0.03` (negative)** → reverse-order stagger: the last-indexed card begins first and the first-indexed trails, so the ring assembles in reverse.
- `onEnter` would add an extra `+=360` spin to any *entering* element, but since all 30 cards exist in both states none actually enter — it does not fire in practice; keep it for fidelity.

### Step 5 — init
```js
createItems();
setInitialLinearLayout();   // called at load; Step 2's loader tween is also scheduled at load
```

### Timing / easing summary (from load)
| t (s) | Action | Property | From → To | Duration | Ease | Stagger / Notes |
|---|---|---|---|---|---|---|
| 0 | Cards rise into strip | `top` / `translateY` | `150%` → `50% / -50%` | 1 | `hop` | `0.03` (index order) |
| 1 | Loader `0` reveals | `y` | `20` → `0` | 1 | `power3.out` | `delay:1` |
| 2–4 | Count up (setTimeout) | `textContent` | `0` → `100` | 2s window | — | +random 5–34 every 300ms |
| ≈4 | Number slides out | `y` | `0` → `-20` | 1 | `power3.inOut` | fires ~immediately after count |
| ≈5 | **Flip stack → ring** | `left`/`top`/`rotation` | strip → circle (radius 210) | 2 | `hop` | `-0.03` (reverse) |
| ≈5.1 | Nav labels reveal | `y` | `20` → `0` | 1 | `power3.inOut` | `0.075`, 7 labels, +100ms after Flip |

Total runtime ≈ 7s.

## Assets / images
**30 editorial fashion / portrait photographs**, portrait orientation, cropped by `object-fit:cover` to the **175×250 (≈5:7)** cards. Single subjects — models and portraits, plus a couple of still-lifes — shot against saturated or moody studio backdrops (terracotta, deep red-orange, green, cobalt blue, warm neutral grey), cinematic editorial mood, mixed warm/cool color stories (they need not match as a set). Because each card is small, initially heavily overlapped, then splayed onto a rotating ring, exact content barely reads — any cohesive set of moody portrait/editorial images works. Provide them as an array or a `/images/img${i}.jpg` path for `i = 1..30`. If fewer than 30 are available, repeat to fill.

## Behavior notes
- **Autoplay once on load; no scroll, hover, or click triggers.** The page never scrolls (`overflow:hidden` on `.container`, `100vh` body).
- Layout math (`startX`, `centerX/Y`) reads live `offsetWidth`/`offsetHeight`, so the strip centers and the ring centers to the viewport at load time; it is not re-run on resize in the original.
- No reduced-motion branch in the original.
- The two clip-path masks (nav labels + loader) plus the `translateY(20/-20)` on their `<p>` are what make the label/number "slide in/out of a slit" reveal — keep both the 20px mask height and the 20px translate in sync.

## Images

This component ships with 30 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/landing-page-reveal-no-webgl/img1.jpg
https://motionprompts.dev/c/landing-page-reveal-no-webgl/img10.jpg
https://motionprompts.dev/c/landing-page-reveal-no-webgl/img11.jpg
https://motionprompts.dev/c/landing-page-reveal-no-webgl/img12.jpg
https://motionprompts.dev/c/landing-page-reveal-no-webgl/img13.jpg
https://motionprompts.dev/c/landing-page-reveal-no-webgl/img14.jpg
… 24 more under https://motionprompts.dev/c/landing-page-reveal-no-webgl/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--canvas`, `--ink`, `--muted`, `--hairline`, `--signal`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that waits for `DOMContentLoaded`, builds its own DOM with `document.createElement`, and then runs an unattended, roughly-seven-second relay of `setTimeout` and `onComplete` callbacks with nothing watching whether the page underneath it still exists. React withdraws all of that at once, and it does so quietly — the ring assembles, looks right once, and a StrictMode remount leaves a second, uncoordinated relay running against cards the first one already retired.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component's sequence is not one synchronous burst of GSAP calls the way a hover effect is — the rise-in, the counter, the Flip morph and the nav reveal each schedule the next stage from inside a callback that fires long after the code that started it has returned. A double mount with incomplete teardown does not just leave two 30-card decks sharing `.gallery`; it leaves two independent counters each racing to call `Flip.getState` on the same nodes and each convinced it owns the ring. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — the shipped `script.js` wraps its real boot logic in a `mount(config)` / `destroy()` pair behind a `window.MP` branch; that is this catalogue's own editor hook (`window.MP.register`), letting the demo page live-edit knobs like the ring radius or the entry stagger and remount with a new config. Drop that branch — it is not something a consuming app ships. What is left is the plain path: `document.readyState` is checked before subscribing to `DOMContentLoaded`, a guard that exists to survive being loaded late into a plain document. `useEffect` already runs after the DOM is committed, so drop the guard and the listener both, and move `createItems()`, `setInitialLinearLayout()`, and the loader tween that follows them directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — `document.querySelector(".container")`, `document.querySelector(".gallery")`, and every later `document.querySelectorAll(".item")`, `document.querySelector(".loader p")` and `document.querySelectorAll(".nav-item p")` assume this component owns the document. Give the component a root ref, render `.container` as the outermost element it points to, and resolve every one of those off it instead. This is more than a style objection for this component specifically: `.item` gets re-queried three separate times, minutes apart on the wall clock (the initial rise-in, `Flip.getState` inside the morph, `setCircularLayout` right after) — and an unscoped query at any one of those moments can bind to the copy of the subtree a StrictMode remount is on its way to discarding, rather than the one still on screen.

*(3) Cleanup — GSAP / Flip* — the vanilla `destroy()` takes a brute-force approach that works because it enumerates its own targets by hand: it clears every pending timer it scheduled, calls `gsap.killTweensOf` on the cards plus the loader and nav text, removes the injected `.item` nodes, and clears the inline styles left on the loader and nav paragraphs. That is a legitimate strategy, but it is not the one the rest of this catalogue uses, and it does not generalize past this component's particular target list. Wrap the sequence in a `gsap.context` scoped to the root ref instead, and keep the `self` the factory receives — you need it again long after the factory itself has returned:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    createItems();
    setInitialLinearLayout();

    const loaderEl = rootRef.current.querySelector(".loader p");
    gsap.to(loaderEl, { y: 0, onComplete: animateCounter });

    function animateCounter() {
      // the setTimeout counting loop above is unchanged — it never touches GSAP.
      // once it reaches its ceiling and is ready to slide the number away:
      self.add(() => {
        gsap.to(loaderEl, { y: -20, onComplete: animateToCircularLayout });
      });
    }

    function animateToCircularLayout() {
      const items = rootRef.current.querySelectorAll(".item");
      const state = Flip.getState(items);
      setCircularLayout();
      self.add(() => {
        Flip.from(state, {
          onEnter: (element) => gsap.to(element, { rotation: "+=360" }),
        });
      });
      self.add(() => {
        gsap.to(rootRef.current.querySelectorAll(".nav-item p"), { y: 0 });
      });
    }
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Only the rise-in tween and that first loader tween are created while the factory itself is on the stack, so those two are the only ones `gsap.context` tracks automatically. Everything downstream — the counter's slide-away tween, the Flip morph, the nav-label reveal — is built inside a later `onComplete`, each of which fires only after the factory's synchronous window has already closed. Route every one of those through `self`, never through a variable named `ctx`: `gsap.context` invokes its factory synchronously, so `const ctx = gsap.context(...)` has not finished being assigned at the moment that factory body runs, and reaching for `ctx` from inside it throws `Cannot access 'ctx' before initialization` and takes the tree down with it. The factory's own argument is the same context object under a name with no such restriction. `self.add` called with a single function, as above, runs that function immediately, right where you call it, and attributes whatever GSAP creates during the call to the context — it does not schedule anything, it claims, at the moment a deferred callback finally fires, that whatever it does next belongs to this mount. The other overload of `self.add` — a name plus a function, called later as `ctx.thatName(...)` from an outside event listener — does not apply here: nothing in this relay is re-entered from a click or a scroll, each stage only ever fires once, so there is no handle worth registering.

The `onEnter` inside `Flip.from` is Flip's own callback, not `ScrollTrigger`'s — it runs per element entering the Flip state, and since all 30 cards exist in both the stacked and the ringed layout, none of them ever "enter," so in practice it never fires. Keep it wrapped in the same `self.add` anyway if you keep it at all: were it to run, it would be doing so from inside Flip's own asynchronous machinery, the same distance from the context factory as everything else in this relay.

Get every one of these attributions right and `ctx.revert()` is sufficient on its own for the GSAP side: reverting a context restores the pre-mount state of anything it tracked, including plain `gsap.set` calls, so it undoes the `left`/`top`/`rotation`/`transform` that the rise-in, `setCircularLayout`, and the Flip morph each wrote onto the cards — not just the tweens. That is a stronger guarantee than the vanilla `destroy()` gets from its manual `clearProps` call, and it means you do not need to reproduce that call by hand as long as every `gsap.set`/`gsap.to`/`Flip.from` in the chain is properly attributed. What `gsap.context` cannot see is the counter's own tick loop: `animateCounter`'s repeating `setTimeout` is plain JS with no GSAP object in it, so hold its pending timer id in a ref and `clearTimeout` it in the same cleanup that calls `ctx.revert()`. Without that, a tick scheduled just before unmount still fires after `ctx.revert()` has run, and writes a stray digit into a `.loader p` node the context just finished cleaning up.

*(4) Card creation* — `createItems()` builds all 30 `.item`/`img` nodes with `document.createElement` and appends them to `.gallery`; the vanilla page never needs to run it twice, because the page never remounts. React does. Move that loop into JSX instead: render `.gallery`'s 30 children by mapping over a plain array of indices, and let React own creating and destroying them entirely — the effect above should only ever call `gsap.set`, `gsap.to` and `Flip` against nodes that are already there. This is also what makes the `ctx.revert()`-only cleanup above sufficient: with the cards built and torn down by hand each mount, correctness would depend on that removal step erasing whatever position the previous mount's ring left behind; with React holding the same 30 nodes for the life of the component, there is nothing left to remove, only positions to revert — which the context already does.

*(5) Module-scope registration* — `gsap.registerPlugin(Flip, CustomEase)` and the `CustomEase.create` call that defines the fast-rise, soft-settle ease used throughout this sequence are both one-time global registrations, not per-mount setup. Hoist both above the component, called once at module scope. Repeating `CustomEase.create` on every mount doesn't corrupt anything — it just replaces the lookup table entry for that name with an identical one — but it re-parses the same control-point string on every remount for no benefit, exactly the waste moving `registerPlugin` into the effect would be.
