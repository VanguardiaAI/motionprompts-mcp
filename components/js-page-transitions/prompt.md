# JS Page Transitions (scaleY split-curtain cover-and-reveal)

## Goal
Build a small single-page site with an **in-page router** where **navigating between "pages" plays a full-screen curtain made of a 2-row × 5-column grid of purple blocks**. The star effect is a two-phase `scaleY` curtain: the top row of blocks grows down from the top edge while the bottom row grows up from the bottom edge — the two halves **meet at the horizontal midline to cover the viewport**, the hero heading is swapped underneath while covered, then the same blocks scale back to zero (top row retracting up, bottom row retracting down) to **part the curtain and reveal the new page**. Every phase sweeps **column by column, left→right**, with a per-column stagger. The reveal half also plays once on initial load, acting as an intro/preloader. Trigger is a click on the fixed top nav links.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) only — **no GSAP plugins, no ScrollTrigger, no SplitText, no Lenis**. There is no scroll interaction at all. Import as:
```js
import gsap from "gsap";
```
No `gsap.registerPlugin` call is needed. All logic runs inside a `DOMContentLoaded` listener.

## Layout / HTML
```
.transition                               (fixed full-viewport overlay; the curtain)
  .transition-row.row-1                    (top half)
    .block × 5                             (5 columns)
  .transition-row.row-2                    (bottom half)
    .block × 5                             (5 columns)

.app
  nav
    .logo
      a[data-route="index"][data-title="Index"]   "Motionprompts"   (wordmark; also routes home)
    .nav-items
      a[data-route="index"][data-title="Index"]     "Home"
      a[data-route="about"][data-title="About"]      "About"
      a[data-route="contact"][data-title="Contact"]  "Contact"
  .hero
    h1                                     "Index"   (the swappable heading; matches the initial route's title)
```
- The curtain markup is **static in the HTML** — exactly 10 `.block` divs (5 per row), written out; JS does not generate them.
- Every nav link (and the logo) carries **`data-route`** (the target route id) and **`data-title`** (the text to write into the hero `h1`). The router compares `data-route` against the current route; the logo and the "Home" link both point to `data-route="index"`.
- Use neutral / fictional labels only: wordmark "Motionprompts", nav Home / About / Contact, hero titles Index / About / Contact. No real brands.

## Styling
Fonts (these are the original demo's licensed faces; if unavailable, fall back as noted — the giant 15vw hero size and the layout are what matter):
- Body / nav: **"Bagoss Standard TRIAL"** (a clean geometric grotesque sans). Fallback: any neutral sans-serif.
- Hero `h1`: **"VTC Carrie"** (a casual hand-lettered / marker display face). Fallback: a bold display/handwritten face.

Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`.

Color palette:
- Page background: **`#f3f3f0`** (warm off-white / cream) on `html, body`.
- Curtain block color: **`#746df8`** (periwinkle purple) — `.block` `background-color`.
- Text: **`#000`** (links and hero).

Type & structure (load-bearing):
- `html, body { width:100%; height:100%; }`.
- `a { text-decoration:none; color:#000; font-size:16px; font-weight:500; }`.
- `nav`: `position:fixed; top:0; left:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center; z-index:1;` (logo left, nav-items right).
- `.nav-items { display:flex; justify-content:center; align-items:center; gap:2em; }`.
- `.hero`: `position:absolute; top:47.5%; left:50%; transform:translate(-50%,-50%);` (dead-center, nudged slightly above middle).
- `.hero h1`: `font-family:"VTC Carrie"; font-size:15vw; line-height:90%;` — one enormous word filling the viewport width.

Curtain CSS (the effect surface — reproduce exactly):
- `.transition`: `position:fixed; top:0; left:0; width:100vw; height:100vh; display:flex; flex-direction:column; z-index:2; pointer-events:none;` — it stacks **above** the nav (nav is z-index 1, curtain z-index 2) yet **never blocks clicks** thanks to `pointer-events:none`.
- `.transition-row`: `flex:1; display:flex;` — the two rows split the viewport height into equal top/bottom halves, and each row lays its 5 blocks out in a horizontal flex line.
- `.block`: `flex:1; background-color:#746df8; transform:scaleY(1); will-change:transform; visibility:visible;` — each block is 1/5 of the row width, full row height, and **starts fully expanded and visible** (so on first paint the whole screen is a solid purple curtain before any JS runs).
- **Transform origins (this is what makes the two halves split):**
  - `.transition-row.row-1 .block { transform-origin: top; }` — top-row blocks scale from their **top** edge.
  - `.transition-row.row-2 .block { transform-origin: bottom; }` — bottom-row blocks scale from their **bottom** edge.
  - So `scaleY: 1 → 0` makes the top half retract **upward** and the bottom half retract **downward** (curtain opens from the center line); `scaleY: 0 → 1` grows the top half **down** and the bottom half **up** until they meet (curtain closes).

## GSAP effect (exhaustive)

### Shared constants & state
- `const ease = "power4.inOut";` — used by **both** phases.
- `const heroTitle = document.querySelector(".hero h1");`
- `let currentRoute = "index";` — matches the initial hero title "Index".
- `let isTransitioning = false;` — re-entrancy guard.

### On load
Run the reveal once, then hide the blocks:
```js
revealTransition().then(() => {
  gsap.set(".block", { visibility: "hidden" });
});
```
Because the blocks are painted solid purple (`scaleY:1`, visible) before JS executes, this plays as an intro: the curtain parts to reveal the "Index" hero, then the blocks are set `visibility:hidden` so they don't sit invisibly over the page.

### `revealTransition()` — part the curtain (open)
Returns a Promise resolved on the tween's `onComplete`:
```js
function revealTransition() {
  return new Promise((resolve) => {
    gsap.set(".block", { scaleY: 1 });
    gsap.to(".block", {
      scaleY: 0,
      duration: 1,
      stagger: { each: 0.1, from: "start", grid: "auto", axis: "x" },
      ease: ease,
      onComplete: resolve,
    });
  });
}
```
- First force all 10 blocks to `scaleY:1` (fully covering), then tween **`scaleY: 1 → 0`** — the curtain retracts to the center line and vanishes.
- `duration: 1` per block, `ease: "power4.inOut"`.
- **`stagger: { each: 0.1, from: "start", grid: "auto", axis: "x" }`** — GSAP auto-detects the block layout as a 2×5 grid; `axis: "x"` means the stagger distance is computed **only from each block's column** (its x position), so the two blocks sharing a column (one in row-1, one in row-2) animate **in unison**, and columns fire left→right at **0.1s** apart. Column 0 at t=0, col 1 at 0.1, … col 4 at 0.4. Total wall time ≈ `0.4 + 1 = 1.4s`.

### `animateTransition()` — draw the curtain (close)
Returns a Promise resolved on `onComplete`:
```js
function animateTransition() {
  return new Promise((resolve) => {
    gsap.set(".block", { visibility: "visible", scaleY: 0 });
    gsap.to(".block", {
      scaleY: 1,
      duration: 1,
      stagger: { each: 0.1, from: "start", grid: [2, 5], axis: "x" },
      ease: ease,
      onComplete: resolve,
    });
  });
}
```
- First make the blocks visible and collapsed (`visibility:visible; scaleY:0`), then tween **`scaleY: 0 → 1`** — the top half grows down and the bottom half grows up until they meet and fully cover the viewport (solid purple).
- Same `duration: 1`, same `ease: "power4.inOut"`, same per-column `each: 0.1`, `from: "start"`, `axis: "x"`. The only difference from `revealTransition` is the grid is stated **explicitly as `grid: [2, 5]`** (2 rows, 5 columns) instead of `"auto"` — behaviorally identical (both stagger by column left→right). Total ≈ **1.4s**.

### Sequencing (nav-click router)
Wire **every** `<a>` on the page:
```js
document.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const route = link.dataset.route;
    const title = link.dataset.title;
    if (route && route !== currentRoute && !isTransitioning) {
      isTransitioning = true;
      animateTransition()
        .then(() => {
          currentRoute = route;
          heroTitle.textContent = title;   // swap the hero heading WHILE fully covered
          return revealTransition();
        })
        .then(() => {
          gsap.set(".block", { visibility: "hidden" });
          isTransitioning = false;
        });
    }
  });
});
```
- Guard: ignore the click unless there's a `route`, it **differs** from `currentRoute`, and no transition is already running.
- Order: **close curtain** (`animateTransition`) → **swap `heroTitle.textContent` to the link's `data-title`** (the content change is hidden behind full purple cover) → **open curtain** (`revealTransition`) → set blocks `visibility:hidden` and release the guard.
- There is **no hold/delay** between close and open — the reveal fires immediately in the cover's `onComplete`. Door-to-door ≈ **~2.8s** (1.4s close + 1.4s open). This is a purely visual in-page router: no History API, no URL change, no separate page loads — only the hero `h1` text changes.

## Assets / images
**None.** This component uses no images, icons, canvas, or video — just solid-colored CSS blocks, nav text, and one giant hero word. No logos or brand marks.

## Behavior notes
- On first paint the screen is a **solid purple curtain** (blocks default to `scaleY:1`, visible in CSS); the load-time `revealTransition()` parts it to unveil the hero. If you want to avoid a flash, ensure the reveal runs on `DOMContentLoaded`.
- The curtain sits above the nav (`z-index:2` vs `1`) but has `pointer-events:none`, so it never intercepts clicks even at full cover; the `isTransitioning` flag is what actually blocks re-entrant navigation.
- Blocks are `visibility:hidden` between transitions so they never overlay the resting page.
- No `prefers-reduced-motion` branch, no min-width gate — the effect is identical on desktop and mobile (blocks are flex-sized, so the 2×5 grid always fits the viewport). No infinite loops; each transition is one-shot per click.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--violet`, `--dim`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: `mount(config)` runs once, wires a click listener onto every `<a>` it can find, and returns a `destroy()` written for this catalogue's own knob-tuning editor — not because a plain page ever calls it. React keeps the "may run twice" half of that contract while dropping the "never has to undo itself" half, and it drops it quietly: the curtain still opens and closes, right up until the click that trips the failure finds it.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here: two `revealTransition()` tweens racing on the same ten `.block` elements at first paint, and — worse — two `click` listeners stacked on the same nav `<a>`s, each carrying its own `isTransitioning`/`currentRoute` closure. One click then drives two curtains at once and swaps `heroTitle.textContent` twice in a row, and neither copy's guard can see the other's state. None of this reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The bootstrap checks `document.readyState` before subscribing to `DOMContentLoaded`; that guard exists to survive being loaded late in a plain document, and `useEffect` already runs after commit, so it is dead weight here. Drop the guard and the listener, and move the body of `mount(config)` — from the initial `revealTransition()` call through the `querySelectorAll("a")` wiring — into a `useEffect` with an empty dependency array, returning the function `mount()` already builds as `destroy`. The pair is already the shape `useEffect` wants. `DEFAULTS` (`blockDuration`, `blockStagger`, `columns`, `rows`) stops being a config object an external editor hands to `mount`; read those as local constants inside the effect, or lift the ones a host app should vary into props — `grid`, derived from `rows`/`columns`, just moves inside the effect body along with them. The `window.MP` branch is this catalogue's editor runtime and has no equivalent in a deployed app; delete it along with the `boot` wrapper.

*(2) Element lookups* — The curtain and the page it covers are not nested: `.transition` (the two `.transition-row`s of `.block`s) and `.app` (nav plus `.hero h1`) are siblings in the layout, so the root `ref` has to wrap a fragment containing both, not just one of them. Inside that scope, the `.block` lookups need no change at all: they only ever appear as GSAP selector text (`gsap.to(".block", …)`, `gsap.set(".block", …)`), and a `gsap.context` scoped to the root ref rewrites that selector text for you automatically — including from calls made later through `self.add` (see below). What the context's scope does *not* reach is plain DOM API calls: `heroTitle = document.querySelector(".hero h1")` and `document.querySelectorAll("a")` both need to become `rootRef.current.querySelector(...)` / `rootRef.current.querySelectorAll(...)`. The second one matters beyond StrictMode: as written it attaches a `click` listener, with an unconditional `event.preventDefault()`, to **every** `<a>` in the document — not just this component's own nav. Drop this component onto a page with other links and it finds and defuses them too; scoping the query to the root ref is what confines the hijack to this component's three nav links and its logo.

*(3) Cleanup* — `revealTransition()` and `animateTransition()` don't only run during the effect's synchronous setup: the load-time call does, but every other call happens later, from inside a nav link's `click` listener. A `gsap.context` whose factory contains only that first call auto-tracks nothing from the calls after it. Register both as named context methods instead, so invoking them later still runs inside the context:

```jsx
const ctx = gsap.context((self) => {
  self.add("revealTransition", () => new Promise((resolve) => {
    gsap.set(".block", { scaleY: 1 });
    gsap.to(".block", { scaleY: 0, /* same per-block timing and per-column stagger as above */ onComplete: resolve });
  }));
  self.add("animateTransition", () => new Promise((resolve) => {
    gsap.set(".block", { visibility: "visible", scaleY: 0 });
    gsap.to(".block", { scaleY: 1, /* same timing and stagger, grid stated explicitly */ onComplete: resolve });
  }));

  self.revealTransition().then(() => {
    if (!cancelled) gsap.set(".block", { visibility: "hidden" });
  });
}, rootRef);
```

`ctx.revert()` in the cleanup then kills whichever tween is in flight and clears every inline style either one wrote — the same job the vanilla `destroy()`'s explicit `gsap.killTweensOf(".block")` plus `gsap.set(".block", { clearProps: "all" })` are doing by hand today. Drop both once the context owns them. The listener bookkeeping needs no rewrite: keep the `offs` array exactly as the script builds it, now scoped to the root's own anchors, and run it in the same cleanup, after `ctx.revert()`.

*(4) The click-driven promise chain outlives a guard that only covers half of it* — The vanilla script already carries a cancellation flag (`destroyed`) for exactly the reason the load-time call needs one: `revealTransition()` on mount resolves later, possibly after an unmount. But the nav-click chain only checks that flag in its *second* `.then()` — the first one, which writes `heroTitle.textContent = title` and starts the next `revealTransition()`, runs unconditionally. A click that starts a transition, followed by an unmount before `animateTransition()`'s promise settles, still writes into `heroTitle` and still calls into a context whose scope may already be gone. Carry the same cancellation flag the cleanup sets (call it `cancelled`) into both `.then()`s, not just the last one:

```jsx
ctx.animateTransition()
  .then(() => {
    if (cancelled) return;
    currentRoute = route;
    heroTitle.textContent = title;
    return ctx.revealTransition();
  })
  .then(() => {
    if (cancelled) return;
    gsap.set(".block", { visibility: "hidden" });
    isTransitioning = false;
  });
```

`currentRoute` and `isTransitioning` need no `useRef`: nothing here reads them to render JSX — the hero heading is written straight to the DOM the same way the vanilla version does — so they can stay exactly what they are, plain variables closed over by the effect.
