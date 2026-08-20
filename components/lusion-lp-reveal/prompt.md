# Landing Page Reveal — Rolling-Digit Counter Preloader + Exploding Loader Bar + Masked Heading Rise

## Goal
Build a full-screen **preloader-to-content intro** that plays once automatically on page load (~8.5 s total). Three digit columns in the lower-left corner spin upward like a mechanical odometer to count `000 → 100`, while a two-segment white bar fills a grey track in the center. When the count lands on 100, the digit columns lift up and vanish behind a clip-path window; then the white loader bar snaps (one half rotates), balloons **40×**, rotates and flies off-screen to the bottom-right as a wipe; the black loading screen fades to nothing; and behind it a big centered "Website Content" heading rises up from behind a white revealer edge. Everything is driven by plain standalone `gsap.to` / `gsap.from` tweens (no timeline object, no ScrollTrigger) synchronized purely by `delay`.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use only **`gsap`** (npm) — `import gsap from "gsap"`. No GSAP plugins, no smooth-scroll library, no canvas/WebGL. The counter-column setup runs inside a `DOMContentLoaded` handler; the rest of the tweens run at module top level (they fire as soon as the script loads). The whole thing is a pure load-triggered animation — no scroll, hover, or click.

## Layout / HTML
Two sibling roots directly in `<body>`: `.website-content` (the page revealed at the end) and `.loading-screen` (the black overlay on top). Class names are load-bearing — the JS/CSS query them.

```html
<div class="website-content">
  <div class="header">
    <div class="h1">
      <h1>Website</h1>
      <h1>Content</h1>
    </div>
    <div class="header-revealer"></div>
  </div>
</div>

<div class="loading-screen">
  <div class="loader">
    <div class="loader-1 bar"></div>
    <div class="loader-2 bar"></div>
  </div>
  <div class="counter">
    <div class="counter-1 digit">
      <div class="num">0</div>
      <div class="num num1offset1">1</div>
    </div>
    <div class="counter-2 digit">
      <div class="num">0</div>
      <div class="num num1offset2">1</div>
      <div class="num">2</div><div class="num">3</div><div class="num">4</div>
      <div class="num">5</div><div class="num">6</div><div class="num">7</div>
      <div class="num">8</div><div class="num">9</div><div class="num">0</div>
    </div>
    <div class="counter-3 digit">
      <div class="num">0</div><div class="num">1</div><div class="num">2</div>
      <div class="num">3</div><div class="num">4</div><div class="num">5</div>
      <div class="num">6</div><div class="num">7</div><div class="num">8</div>
      <div class="num">9</div>
    </div>
  </div>
</div>
```

Counter columns are three stacked strips of `.num` cells (each cell one digit); animating the strip's `y` upward is what rolls the digits. Their final resting cells must read **1 / 0 / 0** so the counter ends on "100":
- `.counter-1` (hundreds): exactly **2** cells — `0`, `1`. The `1` carries the extra class `num1offset1`.
- `.counter-2` (tens): exactly **11** cells — `0,1,2,3,4,5,6,7,8,9,0` (one full 0→9 cycle plus a trailing `0`). The `1` carries `num1offset2`.
- `.counter-3` (units): **31** cells total — digits `0–9` repeated **three times** then one trailing `0`. In the original, the HTML holds only the first `0–9` (10 cells) and JS appends the remaining 21 on `DOMContentLoaded`:
  ```js
  const counter3 = document.querySelector(".counter-3");
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 10; j++) {
      const div = document.createElement("div");
      div.className = "num";
      div.textContent = j;
      counter3.appendChild(div);
    }
  }
  const finalDiv = document.createElement("div");
  finalDiv.className = "num";
  finalDiv.textContent = "0";
  counter3.appendChild(finalDiv);
  ```
  (You may equivalently hardcode all 31 cells in HTML — the animation only cares that there are 31 and the last is `0`.)

No nav, no footer, no images.

## Styling
Font: the CSS declares `font-family: "Aeonik_OVERVIEW"` on `html, body` with **no fallback** and **no @font-face** — it is a custom face that is not bundled, so it resolves to the browser default. Keep it declared verbatim for faithfulness (do not add a web font). Everything is `font-weight: 400`.

Global reset: `* { margin:0; padding:0; box-sizing:border-box }`. `html, body { width:100vw; height:100vh }`. The page has **no background color of its own**, so the body is the browser default white — this is what shows through when the black loading screen fades.

**Loading screen (the black overlay):**
- `.loading-screen`: `position:fixed; top:0; left:0; width:100%; height:100%; background:#000; color:#fff; pointer-events:none`.

**Counter (lower-left odometer):**
- `.counter`: `position:fixed; left:50px; bottom:50px; display:flex; height:100px; font-size:100px; line-height:102px; font-weight:400; clip-path: polygon(0 0, 100% 0, 100% 100px, 0 100px)`. The clip-path is the key mask: it clips each column to a **single 100px-tall window** so only one digit shows at a time; the rest of the strip is hidden above/below.
- `.counter-1, .counter-2, .counter-3 { position:relative; top:-15px }` (nudges the visible digit up into the window; these are the `.digit` elements animated later).
- `.num1offset1 { position:relative; right:-25px }` and `.num1offset2 { position:relative; right:-10px }` — the glyph `1` is narrower than other digits, so these push it right to keep the rolling column visually aligned.

**Loader (center progress bar):**
- `.loader`: `position:absolute; top:50%; left:50%; width:300px; height:50px; transform:translate(-50%,-50%); display:flex; background:rgb(80,80,80)` — a 300×50 grey track centered on screen.
- `.loader-1`: `position:relative; background:#fff; width:200px` (left white segment).
- `.loader-2`: `position:relative; background:#fff; width:100px` (right white segment).
- `.bar { height:50px }`. The two white segments sit side by side inside the flex track and together fill it (200 + 100 = 300).

**Website content (revealed heading):**
- `.website-content`: `position:absolute; width:100%; height:100%; top:0; left:0; display:flex; justify-content:center; align-items:center` (centers the header).
- `.header`: `position:relative; width:max-content; height:max-content`.
- `.h1 { display:flex }` (the two words sit side by side).
- `h1 { font-size:80px }`.
- `.header .h1 h1`: `text-align:center; position:relative; top:80px; margin:0 10px; text-transform:uppercase; font-weight:400`. The `top:80px` **pushes the text down 80px** so it sits below the header box, hidden behind the revealer.
- `.header-revealer`: `position:absolute; top:0; width:100%; height:100%`.
- `.header-revealer::after`: `content:""; position:absolute; left:0; top:80px; width:105%; height:110%; background:#fff`. This is a solid **white curtain** whose top edge sits at `80px` — exactly where the shifted-down text begins — so the words are fully hidden below it. When each `h1` slides up by 80px (see effect), it rises above this white edge and is revealed. (The heading is black default text on the white body background.)

## GSAP effect (be exact)
No timeline object is used — every tween below is an independent `gsap.to()`/`gsap.from()`, scheduled by its own `delay`. Times given are absolute seconds from page load. All counter tweens live inside `DOMContentLoaded`; all others run at module top level.

### 1 — Rolling digit counter, `000 → 100` (t = 0 → 6)
A shared helper translates each column up by `(cellCount − 1) × cellHeight`, so the last cell of the strip ends inside the 100px clip window:
```js
function animate(counter, duration, delay = 0) {
  const numHeight = counter.querySelector(".num").clientHeight;              // ≈102px (line-height)
  const totalDistance = (counter.querySelectorAll(".num").length - 1) * numHeight;
  gsap.to(counter, { y: -totalDistance, duration, delay, ease: "power2.inOut" });
}
animate(document.querySelector(".counter-3"), 5);      // units:    y ≈ -(30×102),  t 0 → 5
animate(document.querySelector(".counter-2"), 6);      // tens:     y ≈ -(10×102),  t 0 → 6
animate(document.querySelector(".counter-1"), 2, 4);   // hundreds: y ≈ -(1×102),   t 4 → 6
```
- **Units (`.counter-3`)**: rolls through 0→9 three times over **5 s** (`power2.inOut`), the fastest spinning column.
- **Tens (`.counter-2`)**: rolls 0→9 once over **6 s** (`power2.inOut`), landing back on 0.
- **Hundreds (`.counter-1`)**: waits `delay 4`, then flips `0 → 1` over **2 s** (ends at t = 6).
- All three finish by **t ≈ 6**, reading **100**. `power2.inOut` gives every column an eased start and a soft settle.

### 2 — Loader bar fills the track (t = 0 → 6)
```js
gsap.from(".loader-1", { width: 0, duration: 6, ease: "power2.inOut" });               // t 0 → 6
gsap.from(".loader-2", { width: 0, delay: 1.9, duration: 2, ease: "power2.inOut" });    // t 1.9 → 3.9
```
- Left segment `.loader-1` grows `width 0 → 200px` over the full **6 s** (`power2.inOut`).
- Right segment `.loader-2` stays collapsed at `width 0` until **t = 1.9**, then grows `0 → 100px` over **2 s**. Between them the white progressively fills the grey 300px track in lockstep with the count.

### 3 — A late loader-2 nudge (t ≈ 6, hidden under the fly-off)
```js
gsap.to(".loader-2", { x: -75, y: 75, duration: 0.5, delay: 6 });
```
A standalone tween that slides `.loader-2` by `x:-75, y:75` over 0.5 s. **Give it `delay: 6`** so it fires at t ≈ 6 — the exact moment the whole `.loader` is being told to drop its grey track, rotate `.loader-1`, and (at t = 7) balloon 40× and fly off-screen. Because the nudge happens after loader-2 has already finished filling the track and while the bar is exploding away, its offset is **never visible**.

**Why `delay: 6` and NOT the original's `"<"` — read carefully, this is the one thing that breaks blind repros.** The real source writes this line as `gsap.to(".loader-2", { x:-75, y:75, duration:0.5 }, "<")`. That trailing `"<"` is **not ignored** and it does **not** run at t = 0. GSAP appends every bare `gsap.to`/`gsap.from` to `gsap.globalTimeline` and reads the 3rd argument as a **position parameter**; `"<"` means "start at the start of the tween that was created immediately before this one." In the original the tween created right before it is the `.loader-1 { rotate:90, y:-50, delay:6 }` tween, so `"<"` resolves to **t ≈ 6** — identical to `delay: 6`. This makes the `"<"` form **order-dependent and fragile**: if you create this nudge after a different bare tween (e.g. the `.loader-2` width fill at `delay:1.9`), `"<"` resolves to **t ≈ 2** instead, and a **stray white box appears below-left of the loader bar during t ≈ 2–6** — a visible defect that is wrong. Using an explicit `delay: 6` is behaviour-identical to the original and immune to this ordering trap, so **prefer it** (or omit the nudge entirely — it has no visible effect either way). If you insist on reproducing the `"<"` verbatim, you MUST place this line immediately after the `.loader-1` rotate tween of section 5 and nowhere else.

**Observable ground truth — use this to self-verify your repro:** throughout the entire count/loading phase (t ≈ 2–6 s) `.loader-2` must stay **inside** the grey 300px track, sitting flush against `.loader-1` so the two white segments fill the track cleanly. There must be **no stray white box** appearing below or to the left of the bar at any moment before the fly-off. If you see one, your nudge fired early — switch it to `delay: 6`.

### 4 — Digit columns lift away (t = 6 → 7)
```js
gsap.to(".digit", {
  top: "-150px",
  stagger: { amount: 0.25 },
  delay: 6,
  duration: 1,
  ease: "power4.inOut",
});
```
All three `.digit` columns animate their CSS `top` from `-15px` to `-150px` — sliding up out of the 100px clip window (so the finished "100" disappears upward). `stagger.amount: 0.25` spreads the three column starts across a total of 0.25 s (left column first). `power4.inOut`, duration 1.

### 5 — Loader snaps, then explodes off-screen (t = 6 → 8)
```js
gsap.to(".loader",   { background: "none", delay: 6, duration: 0.1 });                  // t 6 → 6.1
gsap.to(".loader-1", { rotate: 90, y: -50, duration: 0.5, delay: 6 });                  // t 6 → 6.5
gsap.to(".loader",   { scale: 40, duration: 1, delay: 7, ease: "power2.inOut" });       // t 7 → 8
gsap.to(".loader",   { rotate: 45, y: 500, x: 2000, duration: 1, delay: 7, ease: "power2.inOut" }); // t 7 → 8
```
- **t = 6**: the grey track `background` is removed (`"none"`, near-instant 0.1 s), leaving only the white bars.
- **t = 6 → 6.5**: `.loader-1` rotates `90°` and shifts `y:-50` — the left white segment kicks up and turns vertical, breaking the flat bar shape.
- **t = 7 → 8**: the whole `.loader` receives **two simultaneous** tweens (different properties, so both apply): it scales up **40×** while also rotating `45°` and translating to `x:2000, y:500`. Net result: the white bars balloon to fill/sweep the screen and fling off toward the bottom-right — a white wipe transition. Both use `power2.inOut`.

### 6 — Black screen fades out (t = 7.5 → 8)
```js
gsap.to(".loading-screen", { opacity: 0, duration: 0.5, delay: 7.5, ease: "power1.inOut" });
```
As the loader flings away, the entire black overlay fades `opacity 1 → 0` over 0.5 s (`power1.inOut`), uncovering the white website content beneath.

### 7 — Heading rises from behind the revealer (t = 7 → 8.5)
```js
gsap.to("h1", 1.5, {                     // legacy signature: 2nd arg = duration
  delay: 7,
  y: -80,
  ease: "power4.inOut",
  stagger: { amount: 0.1 },
});
```
Both `<h1>` words ("Website", "Content") slide `y: -80` — exactly cancelling their CSS `top:80px`, so they rise up above the white revealer's top edge and become visible. Duration **1.5 s** (legacy `gsap.to(target, duration, vars)` form), `stagger.amount: 0.1` (the two words offset by a hair), `power4.inOut`, starting at t = 7 as the black screen is vanishing. This is the payoff reveal.

### Timeline summary (absolute seconds)
| t (s)     | what happens |
|-----------|--------------|
| 0 → 5     | units column rolls 0→9 ×3 (`power2.inOut`) |
| 0 → 6     | tens column rolls 0→9 once; `.loader-1` fills `0→200px` |
| 1.9 → 3.9 | `.loader-2` fills `0→100px` |
| 4 → 6     | hundreds column flips `0→1` → counter reads **100** |
| ~6.1      | grey loader track `background:none` |
| 6 → 6.5   | `.loader-1` rotate 90° + `y:-50` |
| 6 → 6.5   | `.loader-2` nudge `x:-75, y:75` — invisible, hidden under the fly-off (`delay:6`, not `"<"`) |
| 6 → 7     | `.digit` columns slide `top -15→-150px` and vanish (stagger 0.25, `power4.inOut`) |
| 7 → 8     | `.loader` scale ×40 + rotate 45° + fly to `x:2000,y:500` (`power2.inOut`) |
| 7 → 8.5   | both `h1` rise `y:-80` from behind white revealer (dur 1.5, stagger 0.1, `power4.inOut`) |
| 7.5 → 8   | `.loading-screen` fades `opacity 1→0` |

Total runtime ≈ **8.5 s**.

### Ease reference
- Counter columns and the loader-bar fills: `power2.inOut`.
- Loader scale/rotate/fly-off: `power2.inOut`.
- Digit lift-away and heading rise: `power4.inOut`.
- Loading-screen fade: `power1.inOut`.
- `.loader-1` rotate/`y` (t=6) and the loader-2 nudge (t≈6): default ease (no ease specified → `power1.out`).

## Assets / images
**None.** This component uses no images, video, canvas, or WebGL — everything is DOM boxes, text, and CSS. The only "graphics" are the grey/white loader rectangles and the numeric text.

## Behavior notes
- **Autoplay once** on load — no scroll, hover, or click triggers, and nothing repeats. The `.loading-screen` has `pointer-events:none` so it never blocks the page.
- The counter's `clip-path` 100px window is essential — without it every digit in each column would show at once instead of a single rolling digit.
- Reproduce the standalone-tween structure exactly (no `gsap.timeline()`): the choreography relies entirely on matching `delay` values. **Do not** copy the loader-2 nudge's `"<"` position argument blindly — it is a `gsap.globalTimeline` position param that resolves to the start time of whichever bare tween was created just before it (t ≈ 6 in the original), NOT t = 0. Use `delay: 6` on that nudge instead (see section 3); getting this wrong is the one mistake that produces a visible stray white box.
- **Slow eased-in start:** the counter and both loader fills use `power2.inOut`, so the first ~1 s has near-zero visible motion before things ramp up. This is expected. A frame diff taken over just the opening second may read as "no animation" — that is the eased start settling in, not a dead effect; sample later frames (t ≈ 2–8) to confirm motion.
- Not explicitly responsive — fixed px sizing (100px digits, 300px loader, 80px heading, 50px offsets). It is a desktop-oriented intro; on small screens the elements simply keep their absolute px sizes.
- No `prefers-reduced-motion` handling in the original.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--paper-2`, `--muted`, `--accent`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that means running `mount()` and its returned teardown back to back before the intro ever paints: the loop that appends 21 more `.num` cells to `.counter-3` runs twice, and if the first pass's cleanup does not remove its own batch before the second pass starts, the column ends up with 52 cells instead of 31, so the `totalDistance` that `animate()` computes is measured against a strip half again as long as the one the clip-path window was sized for — the odometer overshoots the window and settles on the wrong glyph, or never settles inside it at all. The current `destroy()` already tracks every cell it creates in `added` and removes it by reference, so that specific failure is guarded — but the companion `gsap.killTweensOf(tocados)` / `gsap.set(tocados, { clearProps: "all" })` pair depends on `tocados`, a hand-written list of nine selector strings that has to stay in exact sync with every `gsap.to`/`gsap.from` call below it, and nothing here catches it silently drifting the day a tenth tween is added and its target is forgotten from the list — that tween's inline style then survives into the next mount undetected. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only reaches that guard when it is not running inside this catalogue's own tuning harness (the `window.MP` branch that lets an editor re-mount the intro with a different `digitCycles` / `digitRise` / `curtainScale` config). Neither survives the move to React: the harness branch has no equivalent in a shipped component, and the readiness guard is dead weight once `useEffect` guarantees the DOM is already committed. Drop both, along with the `boot` wrapper, and move the body of `mount()` — the loop that builds `.counter-3`'s extra digit cells, the three `animate()` calls, and the dozen standalone tweens that follow — directly into a `useEffect` with an empty dependency array. `destroy()` already returns a real teardown; the work below tightens it, it does not replace it.

*(2) Element lookups* — Only `.counter-3` gets an explicit `document.querySelector` call, to read a cell's `clientHeight` and to append the extra digits onto it. Everything else this file animates — `.counter-1`, `.counter-2`, `.digit`, `.loader`, `.loader-1`, `.loader-2`, `.loading-screen`, and the bare tag selector `"h1"` — is handed straight to `gsap.to`/`gsap.from` as a string, which GSAP resolves against the whole document itself, not through any lookup code you control. That is a sharper version of the same problem: `"h1"` is about as generic a selector as this catalogue has, and it will just as happily grab an unrelated heading elsewhere on the host page, or the copy of this intro that the StrictMode remount is in the middle of tearing down. Give the component a root ref and pass it to `gsap.context` as the scope (below) — that scopes every one of those string targets to descendants of the ref automatically, with no need to rewrite any of them into a `querySelector` call.

*(3) Cleanup* — Wrap the digit-cell loop and every tween in one `gsap.context` scoped to that root ref, and have the factory itself register the teardown for the cells it creates, the same way a `SplitText` revert would be folded in:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    const counter3 = rootRef.current.querySelector(".counter-3");
    const added = [];
    // the cell-building loop exactly as above, pushing each created div into `added`
    // the three animate() calls and every tween that follows, exactly as above
    return () => added.forEach((el) => el.remove());
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` now does what the current `destroy()` does by hand for tweens — kill everything the factory started and strip every inline style it wrote onto the counters, the loader bars, `.digit`, `.loading-screen` and the two `h1` words — so the `gsap.killTweensOf(tocados)` / `gsap.set(tocados, { clearProps: "all" })` pair, and the `tocados` list it leans on, become redundant. What the context cannot infer on its own is the digit cells: creating a node with `document.createElement` is not a GSAP action, so revert never touches it. Returning the cell-removal function from inside the factory folds it into `ctx.revert()` instead of needing a second call in the outer cleanup. Skip that return and the next mount's loop runs against a `.counter-3` that still carries the previous mount's 21 extra cells, which is the overshoot described above.
