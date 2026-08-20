# Editorial Contact-Form Overlay — Giant Serif Title Reveals Char-by-Char on Load, Fullscreen Dark Form Wipes In on Click

## Goal
Build a **full-viewport editorial hero on a bone/off-white background** whose star effect is a **per-character display-title reveal**: a colossal serif headline (set at `20vw`) is split into single-character `<span>`s that GSAP tweens **up from a clipped baseline** (each char starts pushed 500px below and rises into a clip-path mask) with a staggered `power4.out` ease on load, while the nav / tagline / CTA / social links fade in a beat later. Clicking the **"Apply now"** button plays a **paused GSAP timeline** that fades a **fullscreen dark contact-form overlay** in over everything and then staggers a giant single-line **"Apply"** wordmark (sized in `vw`, anchored bottom-right) upward with the same clipped char-reveal; clicking **"[ back ]"** inside the overlay **reverses the exact same timeline** to dismiss it. Pure click/load driven — no scroll animation.

The overlay is a **locked two-column grid** — a narrow ~1/3 left column holds the stacked form (logo, vertically-stacked fields, submit button) hard against the left edge; a wide ~2/3 right column holds a short intro paragraph up top and the enormous "Apply" wordmark down in its bottom-right corner. Getting that grid, the vertical field stacking, and the `vw`-scaled single-line wordmark right is as important as the GSAP gesture.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) **only** — no plugins, no ScrollTrigger, no SplitText library, no Lenis, no canvas/WebGL. The character splitting is done by hand in plain JS (see below). Import as:
```js
import gsap from "gsap";
```
All code runs inside `DOMContentLoaded` listeners (two of them in the original — one for the load reveal, one for the overlay toggle). Do **not** use GSAP's SplitText; write a tiny helper that wraps each character in a `<span>`.

## Layout / HTML
```
section.hero                         (the light landing screen)
  .nav > p                           (top-center, tiny uppercase meta — 2 lines via <br>)
  .header                            (absolutely centered block; CLIP-PATH masked)
    .header-text > h1  "La Piga"     (the giant 20vw display title)
    .cta > button#toggle  "Apply now"   (opens the overlay)
  .tagline > p                       (bottom-center, tiny uppercase meta — 2 lines via <br>)
  .links                             (bottom-left) > button ×2  "Instagram" "Twitter"

.overlay                             (fixed fullscreen dark panel, starts opacity:0 / pointer-events:none)
                                     display:flex — a LOCKED two-column grid
  .col   (nth-child 1 → flex:1  ≈ 1/3 width, thin cream border-right, flex COLUMN, space-between)
    .logo > a  "La Pige"           (pinned to the top of the narrow left column)
    .form > form                   (each field is a VERTICALLY STACKED group — see note below)
      label[for=fname] "Name*"      (block, on its own line)  →  input#fname (own line, underline, placeholder "first + surname")
      label[for=lname] "Location*"  (block, on its own line)  →  input#lname (own line, underline, placeholder "e.g france")
      label[for=website] "Website"  (block, on its own line)  →  input#website (own line, underline, placeholder "https://")
      label "Disciplines"           (block, on its own line)
      .jobs
        .job-items > .item ×5   (each = <input type=checkbox> + <label>)   — column A
        .job-items > .item ×5   (each = <input type=checkbox> + <label>)   — column B
      button  "Send Application"    (bottom of the left column)
  .col   (nth-child 2 → flex:2  ≈ 2/3 width, position context for .send)
    .copy > p "[ get featured ]"  + p#back "[ back ]"     (space-between row, top)
    .about > p   (short vetting blurb, ~40% width, top area)
    .send > h1  "Apply"           (the giant display wordmark — ONE line, sized in vw, absolutely
                                    positioned bottom-right of this column; CLIP-PATH masked)

script type="module" src="./script.js"
```

**Form-field stacking (load-bearing — the #1 fidelity fix):** every text field is a *vertical* group — the `<label>` renders on its **own line as a block**, and its `<input>` renders on the **next line** as its own full-line underlined field. Label and input are **NEVER on the same line**. In markup this is done with `<label>…</label><br /><input … /><br /><br />` (block label + explicit `<br>` breaks); an equivalent robust approach is to wrap each field in a `display:flex; flex-direction:column` container. The three inputs and the "Disciplines" label all sit flush against the left edge of the narrow left column, stacked one under the next — so nothing floats to the right of a previous input.

Load-bearing ids/classes the JS needs: `#toggle`, `#back`, `.overlay`, `.header-text h1`, `.send h1`, `.cta`, `.nav`, `.tagline`, `.links`. The clip-path masks live on `.header` and `.send`.

**Copy / naming:** use a neutral fictional identity — a freelance-directory demo called **"La Pige"** (giant hero title spelled **"La Piga"**). The `.nav` meta reads like *"The freelance directory / a small studio creation"* and the `.tagline` like *"Indépendant; à la pige; adj release / v1.0 coming soon"*. The `.about` blurb: *"To be considered for a listing on La Pige, please fill out your details opposite. Each application will be carefully reviewed and vetted while v1.0 release is being worked on."* Discipline checkbox labels (10 total): **Digital Design, Front-end, Webgl, Photography, Illustration, Brand Design, Back-end, 3D, Motion, Strategy**. No real brands or personal names.

## Styling

**Reset:** `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; background:#eae9e4; font-family:"Neue Montreal"; }`.

**Palette (lock these four hex values exactly — do not drift to generic black/white):**
- `#eae9e4` — warm bone / off-white: **base page + hero background**, **and** the text/border/placeholder/cream color for *everything inside* the dark overlay (logo, labels, inputs, underlines, the "Apply" wordmark, the thin column divider).
- `#262625` — near-black charcoal: the `.overlay` panel background (a hair warmer than pure black — keep the exact hex).
- `#000` — pure black: default button border + hover fill, `#toggle` background, `.form button` text.
- `#fff` — white: `#toggle` text.

**Typography lock:** the two giant display words — the hero **"La Piga"** and the overlay **"Apply"** — are both set in the high-contrast **serif display** face (`font-weight: lighter`). Everything else (nav/tagline meta, labels, placeholders, the intro blurb, buttons, the "La Pige" logo) is the neutral **grotesque sans**. Do not set the giant words in a sans, and do not set the body UI in a serif.

**Fonts (both proprietary, both intentionally NOT loaded via `@font-face` — so they fall back to platform defaults; the look is defined by the sizes, not the family):**
- Body / UI: **`"Neue Montreal"`** — a neutral grotesque sans. Substitute any clean neutral sans (e.g. a Helvetica/Inter-like grotesque).
- Giant display titles: **`"Timmons NY 2.005"`** — a high-contrast condensed **serif display** face, `font-weight: lighter`. Substitute any elegant high-contrast display serif (Didone/Times-style).

**Buttons:** `background:none; outline:none; border:1px solid #000; text-transform:uppercase; padding:0.5em 1em; border-radius:2em; cursor:pointer;`. `button:hover` and `button#toggle` → `background:#000; color:#fff;`. `.form button` overrides to `color:#000; background:#eae9e4; border:1px solid #eae9e4;`.

**Structural CSS (load-bearing for the effect & look):**
- `.nav, .tagline { position:absolute; width:100%; display:flex; justify-content:center; text-transform:uppercase; font-size:12px; padding:1.5em 0; text-align:center; }`; `.tagline { bottom:0; }` (nav sits at top).
- `.links { position:absolute; bottom:1.5em; left:1.5em; display:flex; gap:1em; }`.
- `.header { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }`.
- `.header-text h1 { font-family:"Timmons NY 2.005"; font-size:20vw; font-weight:lighter; }`.
- `.cta { margin:1em 0; }`.
- `.overlay { position:fixed; top:0; left:0; width:100vw; height:100vh; background:#262625; display:flex; padding:1em; opacity:0; pointer-events:none; }` — the panel that fades in over the hero.
- **The two-column grid is a hard lock.** `.overlay` is `display:flex`; `.col:nth-child(1) { flex:1; ... }` and `.col:nth-child(2) { flex:2; ... }` split the panel into a narrow **≈1/3 left** column and a wide **≈2/3 right** column. This ratio is what anchors the form hard against the left edge instead of drifting toward center — keep `flex:1` / `flex:2`, not `flex:1` / `flex:1`.
- `.col:nth-child(1) { flex:1; height:100%; border-right:1.5px solid #eae9e4; display:flex; flex-direction:column; justify-content:space-between; padding-bottom:3em; }` — a flex **column** with `space-between`, so `.logo` sits at the very top and the `Send Application` button at the very bottom, with the form filling between. The thin cream `border-right` is the divider between the two columns.
- `.col:nth-child(2) { flex:2; padding:0 1em; }` — this column is the positioning context (its `.send` child is absolutely positioned within it).
- `.logo { width:max-content; border:1px solid #eae9e4; }`; `.logo a { padding:0 0.25em; text-decoration:none; color:#eae9e4; text-transform:uppercase; }`.
- `.about { width:40%; color:#eae9e4; margin:1em 0; }`.
- `.copy { display:flex; justify-content:space-between; color:#eae9e4; text-transform:uppercase; font-size:12px; }`; `#back { cursor:pointer; }`.
- **The giant "Apply" wordmark — must stay one line and scale with the viewport.** `.send { position:absolute; bottom:0; right:0; }` anchors it to the **bottom-right corner of the wide right column**. `.send h1 { color:#eae9e4; font-family:"Timmons NY 2.005"; text-transform:uppercase; font-weight:lighter; white-space:nowrap; font-size:~20vw; }`. Two rules are critical: `white-space:nowrap` so "APPLY" **never breaks into two lines**, and a **viewport-relative size (`~18–22vw`, use ~20vw)** so it grows/shrinks with the viewport and always fits inside the ~2/3 right column. Do **not** use a fixed pixel size (e.g. `400px`) — that is exactly what wrapped "APP / LY" onto two lines during reproduction.
- **Form inputs are stacked, full-line, underlined fields — never inline with their label.** `.form label { color:#eae9e4; font-size:20px; display:block; }` (block, so the label owns its own line above the input). `input[type="text"] { display:block; width:100%; outline:none; background:none; border:none; border-bottom:1px solid #eae9e4; padding:0.5em 0; margin:1em 0; color:#eae9e4; }` — each input is a block on its **own line** directly under its label, its underline spanning the full width of the narrow left column, left-aligned. `::placeholder { text-transform:uppercase; color:#eae9e4; font-size:12px; }`. The result is a clean vertical stack: Name / underline / Location / underline / Website / underline / Disciplines — every label flush-left, every underline flush-left, nothing floating to the right.
- `.jobs { margin:1em 0 3em 0; display:flex; gap:1em; }` (two `.job-items` columns side by side); `.job-items label { text-transform:uppercase; font-size:12px; }`; `.item { display:flex; gap:0.5em; align-items:center; }`.

**The clip-path masks (critical for the reveal):**
```css
.send, .header {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%);   /* full-box rect → acts as an overflow mask */
}
.send h1 span,
.header-text h1 span {
  position: relative;
  top: 500px;                                            /* each char starts 500px BELOW, clipped out of view */
}
```
The full-box `clip-path` rectangle clips each title element to its own box; the per-character spans, pushed `top:500px`, sit below that box and are hidden. GSAP animates each span's `top` back to `0`, so characters **rise up into the masked window from below** — a per-character upward reveal with a hard clean baseline.

## GSAP effect (exhaustive)

### 0. Character-splitting helper
Write a plain helper (NOT SplitText): given a selector, take the element's `innerText`, split on `""` (every character, spaces included), wrap each char in `<span>…</span>`, and set the element's `innerHTML` to the joined string:
```js
function splitTextIntoSpans(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML = el.innerText.split("").map(c => `<span>${c}</span>`).join("");
}
```
Call it for **`.send h1`** and **`.header-text h1`** on load, before any tween. (`"La Piga"` → 7 spans incl. the space; `"Apply"` → 5 spans. The spans inherit `position:relative; top:500px` from the CSS above.)

### 1. Load reveal (first `DOMContentLoaded`) — fires immediately, no trigger
After splitting, run two tweens:

**a) Giant header title rises in, char by char:**
```js
gsap.to(".header-text h1 span", {
  top: 0,            // 500px → 0 : each char rises into the clip mask
  duration: 1,
  ease: "power4.out",
  stagger: 0.075,    // left-to-right, 75ms between chars
});
```

**b) Meta / CTA / links fade up a beat later:**
```js
gsap.from(".cta, .nav, .tagline, .links", {
  opacity: 0,
  duration: 1,
  stagger: 0.1,
  delay: 1,          // waits ~1s so the title reveal reads first
});
```
Net load choreography: title characters climb up out of the masked baseline (staggered `power4.out`), then after the delay the tiny nav, tagline, social buttons and the "Apply now" CTA fade on in a 0.1s-staggered cascade.

### 2. Overlay toggle timeline (second `DOMContentLoaded`) — a single paused timeline reused for open AND close
```js
const timeline = gsap.timeline({ paused: true });

timeline.to(".overlay", {
  opacity: 1,
  duration: 0.3,
  pointerEvents: "all",        // panel fades up over the hero and becomes interactive
});

timeline.to(".send h1 span", {
  top: 0,                      // giant "Apply" wordmark rises into its clip mask
  duration: 1,
  ease: "power4.out",
  stagger: 0.075,             // same char cadence as the header
});
```
The two steps are **sequential** (default timeline position): first the dark `.overlay` fades in over 0.3s, then the `.send h1` "Apply" characters stagger up from `top:500px → 0`.

### 3. Play / reverse wiring (shared `isOpen` flag across both buttons)
```js
let isOpen = false;
function toggle() {
  isOpen ? timeline.reverse() : timeline.play();
  isOpen = !isOpen;
}
document.querySelector("#toggle").addEventListener("click", toggle);  // "Apply now"
document.querySelector("#back").addEventListener("click", toggle);     // "[ back ]"
```
Both **"Apply now"** (`#toggle`) and **"[ back ]"** (`#back`) call the same handler and share one `isOpen` boolean. So: first click on "Apply now" **plays** the timeline (overlay fades in, "Apply" reveals) and sets `isOpen = true`; clicking "[ back ]" then **reverses** the same timeline (letters retract downward into the mask, overlay fades back to `opacity:0` / `pointer-events:none`) and sets `isOpen = false`. Reversing plays both steps backward, so pointer-events returns to none and the overlay is dismissed cleanly. There is no separate close animation — it is literally the open timeline run in reverse.

## Assets / images
**No images.** This component uses zero image assets — the entire visual is typography, borders, and the two flat background colors. Do not add any `<img>` tags or background images.

## Behavior notes
- **No scroll animation whatsoever** — everything is load-triggered (the hero reveal) or click-triggered (the overlay). No ScrollTrigger, no Lenis, no `requestAnimationFrame` loop.
- **Overlay starts hidden** at `opacity:0; pointer-events:none;` so it never blocks the hero until "Apply now" is clicked.
- **Re-entrancy:** the original uses a single paused timeline plus one boolean; rapid clicks simply play/reverse. No animating-guard is used.
- **Responsive (`@media (max-width:900px)`):** `.logo` gains `margin-bottom:2em`; `.links` becomes `display:none`; `.overlay` switches to `flex-direction:column-reverse` (form stacks under the giant title, so the single-column layout keeps the form left-aligned above); `.col:nth-child(1)` drops its border; `.send` keeps `right:1em`. Because the hero title (`20vw`) and the "Apply" wordmark (`~20vw`, `white-space:nowrap`) are already viewport-relative, they stay on one line and rescale automatically at narrow widths — no fixed-px override needed (if you cap it, keep it single-line, e.g. `font-size:150px`).
- **Reduced motion:** the original ships no `prefers-reduced-motion` guard; motion is short and user-initiated.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--paper-soft`, `--paper-line`, `--ink`, `--ink-ground`, `--ink-soft`, `--rouge`, `--rouge-bright`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: two scripts, each waiting on its own `DOMContentLoaded`, reaching into the page with plain selector strings, and neither expecting to ever run a second time against the same markup. React withdraws that guarantee. Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen, and the double-invoke does **not** give you a fresh DOM in between — `.header-text h1`, `.send h1`, `.overlay`, `#toggle` and `#back` are the same nodes on both passes. Run this component's two listener bodies twice with no cleanup and you get: a second `splitTextIntoSpans` pass rebuilding `.header-text h1`'s and `.send h1`'s `<span>`s out from under whatever the first pass already animated into place, a second `gsap.timeline({ paused: true })` whose steps target the same `.overlay` and `.send h1 span` as the first, and two `click` listeners stacked on both `#toggle` and `#back`. None of this reproduces in a production build, because only development double-invokes effects. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — the script waits for `DOMContentLoaded` twice: one listener splits `.header-text h1` and `.send h1` into character spans and runs the load reveal, the other builds the paused overlay timeline and wires `#toggle`/`#back` to it. By the time a React component mounts, that event has already fired, so neither body ever runs — no split, no reveal, and clicking "Apply now" does nothing, with no error to explain why. Delete both listeners and move their bodies into `useEffect`(s) with empty dependency arrays, keeping the split ahead of the timeline construction in the same relative order the two `DOMContentLoaded` listeners already run in — see the cleanup note below for why that order is load-bearing, not cosmetic.

*(2) Element lookups* — `.header-text h1`, `.send h1` (and the character spans inside each, once split), `.cta, .nav, .tagline, .links`, `.overlay`, and the buttons `#toggle`/`#back` are all reached with unscoped `document.querySelector`. Give the component a root ref on the outermost wrapper and scope every one of these lookups to it. `#toggle` and `#back` are IDs: during the StrictMode remount two copies of the subtree exist for an instant, each declaring its own `#toggle`, and a bare `document.querySelector("#toggle")` binds to whichever copy the browser happens to encounter first — not necessarily the one this effect run owns.

*(3) Cleanup* — wrap the character split, both tweens, and the paused overlay timeline in one `gsap.context` scoped to the root ref, and keep a reference to the timeline the click handlers can reach:

```jsx
useEffect(() => {
  let timeline;
  const ctx = gsap.context(() => {
    splitTextIntoSpans(".header-text h1");
    splitTextIntoSpans(".send h1");            // must finish before either tween below is built

    gsap.to(".header-text h1 span", { top: 0 /* …the load reveal, unchanged */ });
    gsap.from(".cta, .nav, .tagline, .links", { opacity: 0 /* …unchanged */ });

    timeline = gsap.timeline({ paused: true })
      .to(".overlay", { opacity: 1, pointerEvents: "all" })
      .to(".send h1 span", { top: 0 /* …the same per-character climb as the header */ });
  }, rootRef);

  let isOpen = false;
  function handleToggle() {
    isOpen ? timeline.reverse() : timeline.play();
    isOpen = !isOpen;
  }
  const toggleBtn = rootRef.current.querySelector("#toggle");
  const backBtn = rootRef.current.querySelector("#back");
  toggleBtn.addEventListener("click", handleToggle);
  backBtn.addEventListener("click", handleToggle);

  return () => {
    toggleBtn.removeEventListener("click", handleToggle);
    backBtn.removeEventListener("click", handleToggle);
    ctx.revert();
  };
}, []);
```

Two things about this ordering are specific to how this component is wired, not generic GSAP advice. First: GSAP resolves a string target to actual DOM nodes the instant a tween or timeline step is created, not lazily when it plays. The overlay timeline's step targeting `.send h1 span` has to be built *after* `splitTextIntoSpans(".send h1")` has already replaced that `<h1>`'s text with per-character `<span>`s — if it runs first, that step locks onto an empty node list forever. Clicking "Apply now" would still fade `.overlay` to visible on schedule, because that step targets an element that already exists, but the giant "Apply" wordmark would never rise into view, and re-clicking wouldn't fix it — the timeline step doesn't re-query the DOM later, it already resolved to nothing. The source gets this ordering for free because both `DOMContentLoaded` listeners fire against the same event in registration order; porting them into two separate effects only preserves that by accident, so keep the split and the timeline construction inside one context, in this order.

Second: `#toggle` and `#back` are wired with `addEventListener`, not created as GSAP tweens, so `ctx.revert()` never touches them — they need their own `removeEventListener` in the same cleanup, with the exact function reference that was attached. Skipping this is worse here than an ordinary listener leak, because `isOpen` is shared: a second, un-removed pair of listeners doesn't just double-fire the animation, it cancels it. One click now invokes `handleToggle` twice in the same tick — the first call reads `isOpen` as false, plays the timeline, and flips it to true; the second call, from the stale listener, reads it as true and immediately reverses the very timeline the first call just started. The overlay flashes and the "Apply" wordmark barely twitches before both retract, and there is nothing in the console pointing at why the button "stopped working" after a route change. Keep `isOpen` a plain variable closed over by the effect (or a ref, if the toggle logic needs to live in a second effect) rather than component state — it only remembers which half of the timeline the last click landed on, and reading it never needs to trigger a render.
