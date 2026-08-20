---
slug: barba-js-page-transitions
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 5
structural_literals: 6
structural:
  - { kind: duration, literal: "0.85", rule: value/narrated }
  - { kind: stagger, literal: "0.07", rule: value/narrated }
  - { kind: ease, literal: "\"power4.inOut\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# BarbaJS Page Transitions — Two-Sheet Curtain Wipe + Masked Heading Reveal Between Routes

## Goal
Build a small **three-page editorial site** — a fictional press called **Recto** — where the pages are swapped in place, and make the swap the star of the page. A fixed masthead holds the brand and three real nav links (**Index / Studio / Contact**). Clicking one fires the transition: a **blue accent sheet leads a solid ink panel** up from the bottom of the content stage, both travelling in one direction; while the stage is covered the route is replaced underneath; the two sheets keep going **off the top**, uncovering the new page, whose giant `<h1>` **lifts out of a mask** and whose rows **step up** behind it. The ink panel carries the **name and number of the page you are travelling to**, so even a frame grabbed mid-wipe reads as "we are on our way to Studio" rather than as a coloured rectangle.

The whole thing reproduces Barba.js's `sync: true` lifecycle (leave + enter overlap, the outgoing container is dropped mid-transition) with a hand-rolled in-page router — no real multi-page fetch, no framework.

**Three things make this legible, and all three are design decisions, not decoration:**
1. **The masthead never moves.** The curtain covers the content stage only, not the whole viewport. You watch the nav highlight jump to the link you clicked while the page area is being replaced — which is what tells the viewer this is *navigation*, not a loose animation.
2. **Each route has genuinely different content and a different layout** — a numbered work list, a two-column studio statement with a facts table, a huge mail address with a channel grid. If all three routes were the same big word on an empty field, nothing would read as a page change.
3. **The first paint is the first page.** The sheets park *below* the stage and the first route is authored in the HTML, so the very first frame is the Index page, never a full-bleed panel.

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) only. **No GSAP plugins, no ScrollTrigger, no SplitText, no Lenis, no Three.js.**

```js
import gsap from "gsap";
```
No `gsap.registerPlugin(...)` — nothing to register. The original site used `@barba/core`; here you **emulate** Barba's sync lifecycle in ~60 lines of plain JS (details in the router section). Single entry: one `<script type="module" src="./script.js">`.

## Layout / HTML
Body is a flex column: a `.masthead` that never moves, and a `.stage` that takes the remaining height. Every route is an absolutely positioned `.view` inside the stage, so the outgoing and incoming pages can coexist without any layout shift. The curtain lives inside the stage too, above the views.

```html
<body data-barba="wrapper">
  <header class="masthead">
    <a class="brand" href="index.html">Recto <span class="brand__mark"></span></a>

    <nav class="nav" aria-label="Pages">
      <a href="index.html" aria-current="page"><span class="nav__no">01</span>Index</a>
      <a href="about.html"><span class="nav__no">02</span>Studio</a>
      <a href="contact.html"><span class="nav__no">03</span>Contact</a>
    </nav>

    <p class="masthead__note">Three pages — one curtain</p>
  </header>

  <main class="stage">
    <section class="view" data-barba="container" data-barba-namespace="home">
      <div class="view__head">
        <p class="kicker"><span class="kicker__no">01</span>Selected work — 2021 to 2026</p>
        <h1 class="title"><span class="title__line">Index</span></h1>
      </div>
      <div class="view__body">…route content…</div>
      <div class="view__foot">
        <p class="foot__note" data-enter>…</p>
        <p class="foot__mark" data-enter>…</p>
      </div>
    </section>

    <div class="sweep" aria-hidden="true">
      <div class="sweep__lead"></div>
      <div class="sweep__panel">
        <span class="sweep__no">01</span>
        <span class="sweep__label">Index</span>
      </div>
    </div>
  </main>

  <script type="module" src="./script.js"></script>
</body>
```

Structure notes — these are load-bearing:
- `data-barba="wrapper"` / `data-barba="container"` / `data-barba-namespace` are the router's selectors. The `href`s (`index.html` / `about.html` / `contact.html`) are only keys mapped to a namespace; every click is `preventDefault`ed — nothing actually navigates.
- **The first route is written in the HTML, not built by JS.** That is what guarantees the first paint is a page. The other two are built from a `PAGES` object with the same markup shape.
- `.title` is the mask window (`overflow: hidden`); `.title__line` is the block that rides up inside it. No `SplitText`, no absolute-positioning trick, no mask colour that has to match the background.
- Everything that should step in after the heading is tagged `data-enter` — list rows, statement, facts, footer lines. The enter animation targets that attribute, so adding content to a route needs no JS change.
- The curtain is two absolutely positioned sheets inside `.sweep`; the panel carries the destination number and title.
- Labels are neutral fictional copy (Recto, Halcyon Atlas, Marea Editions…). No real brands.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; }`.

**World.** A two-person press that sets type and builds interfaces: cool paper stock, ink-black type, one press-blue signal, printer's column guides drawn in CSS. Type pairing: **Bodoni Moda** (display, 400 upright + italic) for titles, work names, facts and the curtain label; **Archivo** (400/500) for nav, kickers, metadata — small, uppercase, wide tracking.

**Palette (CSS custom properties on `:root`):**
```css
--bg: #e8e6df;      /* cool paper stock */
--ink: #14131a;     /* type */
--flame: #1f2fd0;   /* press blue — accent AND the leading sheet */
--curtain: #16151d; /* the ink panel */
--muted:    color-mix(in srgb, var(--ink) 52%, var(--bg));
--line:     color-mix(in srgb, var(--ink) 20%, var(--bg));
--hairline: color-mix(in srgb, var(--ink) 10%, var(--bg));
```
Deriving `--muted` / `--line` / `--hairline` with `color-mix` from the two base colours means recolouring the component is a two-variable job and the hairlines never go out of tune.

**Load-bearing CSS:**
- `body { display:flex; flex-direction:column; height:100vh; overflow:hidden; }`; `.masthead { flex:none; }`; `.stage { position:relative; flex:1; min-height:0; overflow:hidden; }`. The stage clipping is what lets the sheets park outside it.
- Printer's column guides, no image involved:
  ```css
  .stage {
    background-image: repeating-linear-gradient(
      90deg, var(--hairline) 0 1px, transparent 1px clamp(72px, 9vw, 132px));
  }
  ```
- `.view { position:absolute; inset:0; display:flex; flex-direction:column; padding:clamp(1.25rem,3vw,2.75rem); }` — absolute so two routes can overlap; flex so head / body / foot stay pinned while the body takes the slack (`.view__body { flex:1; min-height:0; justify-content:center; }`). On route 01 the list itself takes the slack — `.works { flex:1; justify-content:space-between; }` spreads its five rows over the whole body, so a tall desktop viewport reads as a generous editorial index instead of leaving a dead band under the title; on mobile the list goes back to `flex:none` and the body centres it.
- **The mask — critical geometry, and simpler than the original's:**
  ```css
  .title { width: max-content; max-width: 100%; overflow: hidden; }
  .title__line {
    display: block;
    padding-bottom: 0.06em;         /* keeps descenders out of the clip */
    font-family: "Bodoni Moda", Georgia, serif;
    font-size: clamp(3.6rem, 9vw, 8.5rem);
    line-height: 0.98;
  }
  ```
  The line starts at `yPercent: 112` (below its own window) and is tweened to `0`. Because the window clips, no mask panel and no background-matched colour are needed — which removes the original's fragile "mask colour must equal the body background" coupling.
- **The curtain:**
  ```css
  .sweep { position:absolute; inset:0; z-index:5; pointer-events:none; }
  .sweep__lead, .sweep__panel { position:absolute; inset:0; transform:translateY(100%); }
  .sweep__lead  { background: var(--flame); }
  .sweep__panel {
    display:flex; align-items:flex-end; gap:.75em;
    padding: clamp(1.25rem,3vw,2.75rem);
    background: var(--curtain); color: var(--bg);
    border-top: 6px solid var(--flame);   /* the lip of the curtain */
  }
  ```
  `pointer-events:none` keeps them from swallowing clicks. The `border-top` accent gives the panel a visible leading edge, so the direction of travel is obvious even in a still.

  **The `translateY(100%)` here is only half the rest state, and getting the other half wrong silently kills the whole component.** The CSS declaration exists so the sheets are already below the stage before a single line of script runs — no frame where the curtain covers the first paint. But GSAP cannot read a percentage back out of that: `getComputedStyle` returns a pixel matrix, and `CSSPlugin` only ever infers a `yPercent` for the exact `-50` centering case; anything else comes back as `y = <height> px, yPercent = 0`. So a `to({ yPercent: 0 })` written against a CSS-only rest state tweens `0 → 0`, the sheets never move, and the re-park at the end of the timeline **adds** another screen of travel on top of the stale pixel `y`. The symptom is not an error — it is a click that shows a frozen page, a hard cut where the route swaps with nothing covering it, and a heading rising out of an empty stage. Restate the rest position in GSAP's own units, once, before any tween is built:
  ```js
  gsap.set([sweepLead, sweepPanel], { yPercent: 100, y: 0 });
  ```
  and re-park with the same `{ yPercent: 100, y: 0 }`, never a bare percentage.

**Responsive.** One `@media (max-width: 768px)` block: the masthead wraps and the nav drops to its own full-width row; the work rows collapse from 4 columns to 2 (discipline left, year right on a second row); the studio grid and the contact channel grid go single-column; the view body centres instead of bottom-aligning. Nothing overflows horizontally.

## GSAP effect (the important part — be exhaustive)

Two functions and a queued router. **No plugins, no ScrollTrigger, no SplitText, no CustomEase, no lerp/rAF loop.**

### 1. `pageTransition(tl, position)` — the curtain
Both sheets travel in **one continuous direction** (up), in two moves separated by a hold. They never come back down on screen; they are reset below the stage after they have left the top.

```js
function pageTransition(tl, position) {
  return tl
    .to([sweepLead, sweepPanel],
        { yPercent: 0, duration: 0.85, ease: "power4.inOut", stagger: 0.07 }, position)
    .addLabel("covered")
    .to([sweepLead, sweepPanel],
        { yPercent: -100, duration: 0.85, ease: "power4.inOut", stagger: 0.07 }, "covered+=0.18")
    .set([sweepLead, sweepPanel], { yPercent: 100, y: 0 });
}
```
- The `0.07` stagger makes the blue sheet arrive first and leave first. Because it sits **behind** the ink panel, you only ever see it on the way in — a blue lip racing ahead of the ink. On the way out it is hidden under the panel the whole time, which is exactly what you want.
- `power4.inOut` over `0.85s` is the character of the whole piece: slow to commit, violently fast in the middle, slow to land.
- `addLabel("covered")` lands at the end of the cover move (`0.85 + 0.07 stagger = 0.92s`) and is the anchor every other piece of the transition hangs off. The `0.18s` gap after it is the hold — long enough to register as a beat, short enough not to feel like a stall.
- The trailing `.set(…, { yPercent: 100, y: 0 })` re-parks the sheets below the stage for the next navigation. Forget it and the second click plays with the curtain already at the top: the panel drops in from above instead of rising.

### 2. `contentAnimation(container)` — the incoming route
Returns **its own timeline** so the caller can drop it anywhere on the transition, and so its `fromTo` start values are applied the moment it is built (that is what keeps the incoming route hidden until its turn).

```js
function contentAnimation(container) {
  const title = container.querySelector(".title__line");
  const items = container.querySelectorAll("[data-enter]");

  return gsap.timeline()
    .fromTo(title, { yPercent: 112 },
                   { yPercent: 0, duration: {{motion.duration.slow}}, ease: "{{motion.ease.primary}}" }, 0)
    .fromTo(items, { y: 22, autoAlpha: 0 },
                   { y: 0, autoAlpha: 1, duration: {{motion.duration.base}}, stagger: {{motion.stagger.tight}}, ease: "{{motion.ease.primary}}" }, 0.25);
}
```
Scoped to the container it is given — never a global `"h1"` selector, because two routes are in the DOM at once during a transition and a global selector would animate the outgoing heading too.

### 3. The router (emulates Barba `sync: true`)

```js
let current = stage.querySelector('[data-barba="container"]');
let currentNamespace = current.dataset.barbaNamespace;
let requested = null;   // where the user last asked to go
let running = false;    // is a transition on screen right now
```

`transitionTo(namespace)` — one navigation, resolved when the timeline finishes:

```js
function transitionTo(namespace) {
  const page = PAGES[namespace];
  sweepNo.textContent = page.no;          // the panel announces the destination
  sweepLabel.textContent = page.title;

  const next = buildView(namespace);
  const outgoing = current;
  gsap.set(next, { autoAlpha: 0 });       // in the DOM, invisible until covered
  outgoing.after(next);
  current = next;

  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });
    pageTransition(tl, 0);

    tl.add(() => {                        // afterLeave, behind the closed curtain
      outgoing.remove();
      gsap.set(next, { autoAlpha: 1 });
    }, "covered");

    tl.add(contentAnimation(next), "covered+=0.3");
  });
}
```
The incoming container is appended next to the current one and both live in the DOM for the width of the curtain — that is the Barba `sync` overlap, and it is what makes the swap invisible. It is hidden with `autoAlpha` rather than left visible, because until the curtain is closed the new page would otherwise be stacked on top of the old one in plain sight.

`drain()` — **the queue, and the reason a double click cannot strand the user:**

```js
async function drain() {
  if (running) return;
  running = true;
  while (requested && requested !== currentNamespace) {
    const target = requested;
    await transitionTo(target);
    currentNamespace = target;
    if (requested === target) requested = null;
  }
  running = false;
}

function go(namespace) {
  if (!PAGES[namespace]) return;
  if (namespace === (requested || currentNamespace)) return;  // compare against the destination
  requested = namespace;
  setActiveNav(namespace);   // the nav commits immediately, the content catches up
  drain();
}
```
A click that lands mid-transition is neither dropped nor stacked: it is remembered and played the moment the running transition ends, so the nav highlight and the visible route always agree. The no-op test compares against `requested || currentNamespace`, not against what is on screen — clicking the page you are already travelling to must do nothing.

Wiring: `.nav a` **and** `.brand` are click targets (the brand routes home); only `.nav a` gets the `.is-active` class and `aria-current="page"`.

Finally, Barba's `once`: the first route is already printed in the HTML, so the load runs **the content reveal only** — the curtain is never involved in the first paint.

```js
const intro = contentAnimation(current);
```

Under `prefers-reduced-motion: reduce` there is **no timeline at all** — not a fast one. `transitionTo()` drops the outgoing route, shows the incoming one and resolves immediately, and the load skips the reveal so the first page is simply there. Scaling the timelines up instead would still leave half a second of curtain sweeping across the screen, which is the exact motion the setting asks you not to make.

## Assets / images
**None.** Type, flat colour, CSS hairlines and one `repeating-linear-gradient`. Do not add any images.

## Behavior notes
- **Trigger:** click on a nav link (or the brand). No scroll, no hover, no autoplay, no infinite loops.
- Total length of one navigation ≈ **2.1s** (0.92 cover + 0.18 hold + 0.92 uncover, with the content reveal overlapping the uncover and ending last).
- Every route is reachable from every route, in both directions; there is no dead end and no state the component cannot leave.
- The curtain covers the **stage**, not the viewport. That is deliberate — see the Goal. If you move it to `position: fixed; inset: 0` you get the original's full-screen wipe, and you lose the thing that made the mechanic legible.
- The sheets rest **below** the stage: declared once in CSS (for the first paint) and immediately restated with `gsap.set(…, { yPercent: 100, y: 0 })` (for GSAP), then re-parked in those same units at the end of every timeline. See the Styling section — leaving the rest state to CSS alone is the one mistake that makes this component do nothing at all.
- No `@font-face` in the component itself; the demo loads Bodoni Moda + Archivo from a stylesheet in the document head.
- `color-mix(in srgb, …)` is used for the derived greys — modern browsers only.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--muted`, `--line`, `--hairline`, `--flame`, `--curtain`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body`** — the demo owns the whole document, so these set the page background, typography, the flex column and `overflow: hidden`. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **The stage must be a positioned, clipped box of a fixed height.** Inside a normal-flow page, give your wrapper `position: relative; overflow: hidden;` and an explicit height (or `min-height`), otherwise the absolutely positioned routes collapse and the parked sheets show.

## Adapting this to React

Everything above describes a standalone document: a script that runs once at module load, builds three in-memory "pages," and drives navigation by mutating a handful of top-level variables and the DOM directly — no framework router, no re-render, nothing that expects a second pass. React withdraws exactly that guarantee, and it does it quietly: the curtain still wipes and the heading still lifts, but the state machine underneath (`current`, `currentNamespace`, `requested`, `running`) and the `drain()` loop that keeps running long after the click handler returned are no longer safe to leave as free-floating module state.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that means two sets of click listeners firing per click, two independent `contentAnimation()` calls racing to reveal the same first heading, and — if a nav click lands mid-remount — a `drain()` loop whose `await transitionTo(...)` resolves against a `current` container the first mount's cleanup has already reverted. The visible symptom is a heading that flickers or a curtain that fires twice for one click, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script runs at the top level, the moment the module is evaluated: it resolves the initial `[data-barba="container"]`, grabs the two curtain sheets, wires every `.nav a` and `.brand` with a `click` listener, calls `setActiveNav`, and fires the first-load `contentAnimation()`, all before React has rendered anything. Move that entire block into a `useEffect` with an empty dependency array. Leave `PAGES` and `HREF_TO_NAMESPACE` as module-level constants outside the component; they're static data, not DOM state.

*(2) Element lookups* — `document.querySelector(".stage")`, `.sweep__lead`, `.sweep__panel`, `document.querySelectorAll(".nav a")` all assume this component owns the document. Scope every one of them to a root ref. `contentAnimation()` is already scoped to the container it is handed, which is the shape you want: keep it that way rather than reaching for `document`. Two routes are mounted at once during a transition, so an unscoped `.title__line` would animate the outgoing heading as well as the incoming one — and a second instance of the component elsewhere on the page on top of that.

*(3) Cleanup* — Wrap the animations in a `gsap.context` scoped to the root ref, and revert it in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    contentAnimation(rootRef.current.querySelector('[data-barba="container"]'));
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Without the revert, a StrictMode remount leaves the first mount's timeline holding an inline `transform` on a curtain sheet or a `yPercent` on some heading, and the second mount's own tween starts from whatever that leftover left behind. The curtain is the one that bites: a stale inline `translateY(-100%)` left mid-flight parks it above the stage, so the next navigation drops a panel in from the ceiling. Note that `ctx.revert()` strips the inline transform back to the CSS declaration — which GSAP still cannot read as a percentage — so the `gsap.set(…, { yPercent: 100, y: 0 })` that restates the rest position belongs **inside** the effect, running on every mount, not at module scope where it would only ever run once.

*(4) The bookkeeping* — `current`, `currentNamespace`, `requested` and `running` are not React state; nothing should re-render when they change, they are what the click handler reads and writes across calls. Hold them in refs (`currentRef`, `namespaceRef`, `requestedRef`, `runningRef`) initialised inside the effect from the same DOM lookup the original uses, so every navigation reads and writes the instance the effect created rather than a stale one from a prior mount. The nav highlight is the exception: it *is* view state, so drive `.is-active` from a `useState` set inside `go()`, not by toggling classes by hand.

*(5) The async continuation* — `drain()` is the part that genuinely breaks on unmount. Its `await transitionTo(...)` can still be pending when the route unmounts, whether that's a StrictMode remount or the user routing away mid-transition. The continuation that runs after the await — reassigning `currentNamespace`, clearing `requested`, looping again — currently runs unconditionally. Give the effect a `cancelled` flag it sets in its cleanup alongside `ctx.revert()`, check it right after every `await`, and `return` instead of starting another lap. Also resolve the `transitionTo` promise from `onComplete` **and** on `ctx.revert()`; a timeline killed by the revert never calls `onComplete`, and an `await` that never settles leaves `running` stuck `true` forever — the exact dead state the queue exists to prevent.

*(6) The two coexisting containers* — `buildView()`'s `view.innerHTML = …` is the one piece with no direct React idiom, because it is solving a problem the reconciler doesn't hand you for free: two `.view` elements — outgoing and incoming — genuinely coexist in the DOM for the width of the curtain, which is what lets the sheets hide the swap. Reaching for that with a single `currentNamespace` state value and letting React reconcile it away would collapse the two routes into one commit and lose the overlap. Track `currentNamespace` and, only while a transition is in flight, a second `incomingNamespace` piece of state; render both `PAGES[…]` blocks from JSX while `incomingNamespace` is set (the incoming one with `visibility: hidden` until the `"covered"` callback), and fold it into `currentNamespace` — which unmounts the outgoing route in React's own commit, taking the place of the manual `outgoing.remove()` — from inside the same guarded continuation described above.
