---
slug: p10-landing-page-reveal-gsap
native_system: entry-veil
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 4
structural_literals: 15
structural:
  - { kind: duration, literal: "0.75", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"hop\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Landing Page Reveal — Typographic Preloader with Split-Screen Unveil

## Goal
Build a full-screen landing intro that plays automatically once on page load (~7.5s). On a dark preloader, the studio name "Nullspace Studio" drops in character by character through masks while three small grey corner tags flip in; every character except the leading "N" then exits downward, a large "10" drops in beside it, the "N" and the "10" slide toward each other and morph into a logo lockup (the "N" shrinks and goes extra-bold, the "10" blows up to 14rem). Then the dark screen **splits in half along a horizontal seam**: the top half slides up, the bottom half slides down, and the page content (full-bleed hero image, nav, footer, and a white center card whose title rises per character) is revealed through an expanding clip-path letterbox. One GSAP timeline, one custom `hop` ease.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`CustomEase`** and **`SplitText`**. No smooth-scroll library. Register with `gsap.registerPlugin(CustomEase, SplitText)` and run everything inside `DOMContentLoaded`.

## Layout / HTML
Class names are load-bearing — the JS/CSS query them:

```
<div class="preloader">
  <div class="intro-title"><h1>Nullspace Studio</h1></div>
  <div class="outro-title"><h1>10</h1></div>
</div>

<div class="split-overlay">
  <div class="intro-title"><h1>Nullspace Studio</h1></div>
  <div class="outro-title"><h1>10</h1></div>
</div>

<div class="tags-overlay">
  <div class="tag tag-1"><p>Negative Space</p></div>
  <div class="tag tag-2"><p>Form & Void</p></div>
  <div class="tag tag-3"><p>Light Studies</p></div>
</div>

<div class="container">
  <nav>
    <p id="logo">N10</p>
    <p>Menu</p>
  </nav>
  <div class="hero-img"><img src="..." alt="" /></div>
  <div class="card"><h1>Nullspace</h1></div>
  <footer>
    <p>Scroll Down</p>
    <p>Made by Nullspace Studio</p>
  </footer>
</div>
```

Key idea: `.split-overlay` is an **exact duplicate** of the preloader's content. It sits underneath the preloader and is pre-positioned (via `gsap.set`) to the preloader's FINAL logo-lockup state. At the end of the lockup animation the preloader is clipped to the top half of the screen and the split-overlay to the bottom half — a pixel-perfect invisible swap — so the two halves can then slide apart in opposite directions.

## Styling
Font (Google Fonts): **DM Sans** — the only family.

- `* { margin:0; padding:0; box-sizing:border-box }`; `body { font-family:"DM Sans", sans-serif }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `h1 { text-transform:uppercase; font-size:6rem; font-weight:600; line-height:1 }`.
- `p { text-transform:uppercase; font-size:13px; font-weight:500 }`.

Layers:
- `.preloader, .split-overlay, .tags-overlay { position:fixed; width:100vw; height:100svh }`.
- `.preloader, .split-overlay { background-color:#0a0a0a; color:#fff }`.
- z-index: `.preloader` and `.tags-overlay` = `2`; `.split-overlay` = `1`.
- `.intro-title { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; text-align:center }` (applies inside both dark layers).
- `.outro-title { position:absolute; top:50%; left:calc(50% + 10rem); transform:translate(-50%,-50%) }`.

Tags:
- `.tag { position:absolute; width:max-content; color:#5a5a5a; overflow:hidden }`.
- `.tag-1 { top:15%; left:15% }`, `.tag-2 { bottom:15%; left:25% }`, `.tag-3 { bottom:30%; right:15% }`.

Page content:
- `.container { position:relative; width:100%; height:100%; min-height:100svh; display:flex; flex-direction:column; justify-content:space-between; z-index:2; clip-path: polygon(0 48%, 0 48%, 0 52%, 0 52%) }` — **initial clip-path is a zero-width sliver at the left edge** (all x = 0, y between 48% and 52%), so the content is invisible until the timeline sweeps the slit open.
- `.container .hero-img { position:absolute; width:100%; height:100% }` (full-bleed image behind everything in the container).
- `nav, footer { position:relative; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:center; color:#fff; z-index:2 }`. `nav p#logo { font-weight:600; font-size:20px }`.
- `.card { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:30%; height:70%; display:flex; justify-content:center; align-items:center; background-color:#fff; clip-path: polygon(0% 50%, 100% 50%, 100% 50%, 0% 50%) }` — initial clip-path is a degenerate horizontal line at mid-height (card hidden). Its `h1 { text-align:center; width:100%; font-size:3rem }`.

SplitText piece styles (these create the masks):
- `.intro-title .char, .outro-title .char, .card .char { position:relative; display:inline-block; overflow:hidden }` — each char is its own overflow-hidden mask.
- `.intro-title .char, .outro-title .char { margin-top: 0.75rem }`.
- `.intro-title .char span, .outro-title .char span, .tag .word { position:relative; display:inline-block; transform:translateY(-100%); will-change:transform }` — title chars and tag words start hidden ABOVE their mask.
- `.card .char span { position:relative; display:inline-block; transform:translateY(100%); will-change:transform }` — card chars start hidden BELOW their mask.
- `.intro-title .first-char { transform-origin: top left }` (matters for its `scale` tween).

## GSAP effect (be exact)

### Setup
```js
CustomEase.create("hop", ".8, 0, .3, 1");
```

SplitText helper — split, then manually wrap each char's text in an inner `<span>` (the CSS above animates `.char span`, not `.char`):

```js
const splitTextElements = (selector, type = "words,chars", addFirstChar = false) => {
  document.querySelectorAll(selector).forEach((element) => {
    const splitText = new SplitText(element, {
      type,
      wordsClass: "word",
      charsClass: "char",
    });
    if (type.includes("chars")) {
      splitText.chars.forEach((char, index) => {
        const originalText = char.textContent;
        char.innerHTML = `<span>${originalText}</span>`;
        if (addFirstChar && index === 0) char.classList.add("first-char");
      });
    }
  });
};

splitTextElements(".intro-title h1", "words, chars", true); // hits BOTH preloader & split-overlay copies
splitTextElements(".outro-title h1");                        // words + chars ("1","0"), both copies
splitTextElements(".tag p", "words");                        // words only, no inner spans
splitTextElements(".card h1", "words, chars", true);

const isMobile = window.innerWidth <= 1000;
```

### Pre-position the split-overlay duplicate to the FINAL state
```js
gsap.set(
  [".split-overlay .intro-title .first-char span",
   ".split-overlay .outro-title .char span"],
  { y: "0%" }                          // its "N" and "10" are already visible
);
gsap.set(".split-overlay .intro-title .first-char", {
  x: isMobile ? "7.5rem" : "18rem",
  y: isMobile ? "-1rem" : "-2.75rem",
  fontWeight: "900",
  scale: 0.75,
});
gsap.set(".split-overlay .outro-title .char", {
  x: isMobile ? "-3rem" : "-8rem",
  fontSize: isMobile ? "6rem" : "14rem",
  fontWeight: "500",
});
```
(The non-first intro chars of the split-overlay keep their CSS `translateY(-100%)`, i.e. hidden — the duplicate shows only the finished "N + 10" lockup.)

### The timeline
One timeline, `gsap.timeline({ defaults: { ease: "hop" } })`. All position params below are **absolute times in seconds**. `tags = gsap.utils.toArray(".tag")`.

1. **Tags in** — for each tag `i` (0,1,2), at time `0.5 + i * 0.1`: its `p .word` → `{ y: "0%", duration: 0.75 }` (words drop down into view from `-100%`).
2. **Intro title in** — at `0.5`: `".preloader .intro-title .char span"` → `{ y: "0%", duration: 0.75, stagger: {{motion.stagger.tight}} }`. "Nullspace Studio" drops in char by char from above through the per-char masks.
3. **Intro title out (except first char)** — at `2`: `".preloader .intro-title .char:not(.first-char) span"` → `{ y: "100%", duration: 0.75, stagger: {{motion.stagger.tight}} }`. Every char except the leading "N" continues DOWN and out of its mask (in through the top, out through the bottom).
4. **Outro "10" in** — at `2.5`: `".preloader .outro-title .char span"` → `{ y: "0%", duration: 0.75, stagger: {{motion.stagger.tight}} }`.
5. **Slide together** — at `3.5`, two simultaneous 1s tweens:
   - `".preloader .intro-title .first-char"` → `{ x: isMobile ? "9rem" : "21.25rem", duration: 1 }` (the "N" travels right toward center; it overshoots its final x slightly).
   - `".preloader .outro-title .char"` → `{ x: isMobile ? "-3rem" : "-8rem", duration: 1 }` (the "10" chars travel left).
6. **Morph into logo lockup** — at `4.5`, two simultaneous 0.75s tweens:
   - `".preloader .intro-title .first-char"` → `{ x: isMobile ? "7.5rem" : "18rem", y: isMobile ? "-1rem" : "-2.75rem", fontWeight: "900", scale: 0.75, duration: 0.75 }` — the "N" pulls back/up, shrinks to 75% (transform-origin top left) and becomes extra-bold.
   - `".preloader .outro-title .char"` → `{ x: isMobile ? "-3rem" : "-8rem", fontSize: isMobile ? "6rem" : "14rem", fontWeight: "500", duration: 0.75 }` — the "10" scales up via animated `fontSize` (6rem → 14rem on desktop). These values EXACTLY match the split-overlay `gsap.set` pre-positioning.
   - The second tween's `onComplete` performs the **invisible swap**:
     ```js
     gsap.set(".preloader",     { clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" });   // top half
     gsap.set(".split-overlay", { clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }); // bottom half
     ```
     Since both layers now render identical pixels, nothing appears to change.
7. **Letterbox slit opens** — at `5`: `".container"` → `{ clipPath: "polygon(0% 48%, 100% 48%, 100% 52%, 0% 52%)", duration: 1 }`. The content's clip sweeps from the zero-width left-edge sliver to a thin full-width band between 48% and 52% viewport height — a glowing slit of the hero image appears across the seam.
8. **Tags out** — for each tag `i`, at `5.5 + i * 0.1`: its `p .word` → `{ y: "100%", duration: 0.75 }` (exit downward).
9. **The split** — at `6`, three overlapping tweens:
   - `[".preloader", ".split-overlay"]` → `{ y: (i) => (i === 0 ? "-50%" : "50%"), duration: 1 }` — top half slides up offscreen, bottom half slides down.
   - `".container"` → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1 }` — the letterbox expands to full screen in sync with the halves parting.
   - at `6.25`: `".container .card"` → `{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 0.75 }` — the white card unmasks vertically from its center line.
10. **Card title in** — at `6.5`: `".container .card h1 .char span"` → `{ y: "0%", duration: 0.75, stagger: {{motion.stagger.tight}} }` — "Nullspace" rises from BELOW (its spans start at `translateY(100%)`, unlike the title chars which started at `-100%`).

### Ease reference
- `hop` = `CustomEase.create("hop", ".8, 0, .3, 1")` — used by every tween (timeline default). No other eases.

## Assets / images
**One image**: a full-bleed hero background revealed behind the split — a wide, desaturated architectural interior with strong negative space and directional light (calm, minimal, editorial mood). Landscape orientation (roughly 16:9), displayed with `object-fit: cover` filling the viewport. White nav/footer text sits on top of it, so darker/muted imagery reads best.

## Behavior notes
- **Autoplay once** on load; no scroll/hover/click triggers, no ScrollTrigger. Total runtime ≈ 7.25s.
- `isMobile` breakpoint at `window.innerWidth <= 1000` swaps the rem offsets/font sizes as listed above.
- Responsive CSS (`max-width: 1000px`): `h1 { font-size:2.5rem }`; `.outro-title { left: calc(50% + 4rem) }`; `.card { width:75% }`; `.card h1 { font-size:2.5rem }`; `.intro-title .char, .outro-title .char { margin-top:0.5rem }`.
- Use `100svh` for all full-height layers so mobile browser chrome doesn't clip.
- The preloader/split-overlay never get removed from the DOM — after sliding ±50% they sit offscreen behind the revealed page (the container is z-index 2, above the split-overlay's z-index 1).
- Keep the `will-change: transform` hints on the animated `.char span` / `.word` elements.

## Images

This component ships with 1 reference asset, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/p10-landing-page-reveal-gsap/hero-img.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Rules on `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Here that leaves you two of nearly everything this timeline touches: two `gsap.timeline()` instances both racing to drop the same "Nullspace Studio" characters through the same masks, two invisible clip-path swaps trying to flip `.preloader` and `.split-overlay` between their halves at once, and — because `splitTextElements` runs a second time without undoing the first — a second `SplitText` pass wrapping `.char` spans that are already wrapped, nesting the mask markup one level deeper than the CSS positioning `.char span` expects. The visible symptom is a stutter through the tag-flip-in / lockup-morph / split sequence and a card title whose characters never rise into place, and none of it reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no readiness guard. By the time a React component mounts, that event has already fired, so the listener never runs and none of the roughly seven-and-a-quarter-second sequence — the tag flips, the "N"/"10" drop-and-morph into the logo lockup, the halves parting, the letterbox opening onto the hero image — ever plays: no error, no animation, nothing to debug. Delete the listener and move its body — the plugin registration, the `hop` custom ease, all four `splitTextElements` calls, the `.split-overlay` pre-position `gsap.set`s, and the timeline itself — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — Give the component a root `ref` on the outermost element — the one that renders `.preloader`, `.split-overlay`, `.tags-overlay` and `.container` together — and scope every lookup in this script to it. That covers two different kinds of lookup here. Every `.to()` and `.set()` call in the timeline, plus `gsap.utils.toArray(".tag")`, hands GSAP a selector string (`.preloader .intro-title .char span`, `.split-overlay .outro-title .char`, `.container .card h1 .char span`, and so on) — wrap the whole effect in a `gsap.context` scoped to that ref and every one of those strings, `toArray` included, resolves against the ref automatically, with nothing to touch on any of them. What the context does **not** reach is `splitTextElements`'s own four `document.querySelectorAll` calls (`.intro-title h1`, `.outro-title h1`, `.tag p`, `.card h1`) — those are plain DOM lookups the helper makes itself, outside any GSAP API, so point them at `rootRef.current.querySelectorAll(...)` by hand. Skipping that half matters more here than in most components: `.intro-title h1` and `.outro-title h1` each match **two** elements at once — the copy inside `.preloader` and its duplicate inside `.split-overlay` — and an unscoped query during the StrictMode remount can end up splitting the outgoing pair instead of the incoming one.

*(3) Cleanup* — Register `gsap.registerPlugin(CustomEase, SplitText)` and `CustomEase.create("hop", …)` once at module scope, not inside the effect; neither needs to run per mount. Everything else goes inside a context scoped to the root ref, and `splitTextElements` needs one change on the way in: as written it builds and discards a `SplitText` instance per matched element inside its own `forEach` and never keeps a reference, so there is nothing left to revert later. Collect them:

```jsx
useEffect(() => {
  const splits = [];
  const ctx = gsap.context((self) => {
    const splitTextElements = (selector, type = "words,chars", addFirstChar = false) => {
      rootRef.current.querySelectorAll(selector).forEach((element) => {
        const splitText = new SplitText(element, { type, wordsClass: "word", charsClass: "char" });
        splits.push(splitText);
        // wrap each char's text in an inner span, tag the first char, exactly as above
      });
    };
    splitTextElements(".intro-title h1", "words, chars", true);
    // the other three splitTextElements calls, then the .split-overlay pre-position
    // gsap.set()s, then the timeline — in that order, since the pre-position sets target
    // the .first-char / .char classes the splits above are what create
  }, rootRef);
  return () => { splits.forEach((s) => s.revert()); ctx.revert(); };
}, []);
```

Without `splits.push(splitText)`, a remount runs `SplitText` again against markup the previous mount already rewrote — the doubled-mask failure described above. And because `.split-overlay`'s pre-position `gsap.set()`s style `.first-char` and `.char` directly, reverting the split out of order (or not at all) before the next mount's split runs leaves those classes one level deeper than the pre-position code expects, so the "finished lockup" the duplicate is supposed to show statically ends up positioned on the wrong nodes.

The one animation call that sits outside the context's synchronous pass is the clip-path swap inside the lockup-morph tween's `onComplete` — it fires when that tween finishes, roughly five seconds into the sequence, long after the factory function above has already returned, so a bare `gsap.set(".preloader", …)` there is neither scoped to the root nor tracked for revert. Wrap it in the single-argument form of `self.add`, which runs its callback immediately but *inside* the context:

```jsx
onComplete: () => {
  self.add(() => {
    gsap.set(".preloader", { clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" });
    gsap.set(".split-overlay", { clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" });
  });
},
```

Do not give this one a name — nothing outside the factory ever needs to call it back, so the named `self.add("name", fn)` form would just leave an unused method hanging off `ctx`.

One gap the current script doesn't cover but is worth closing in the port: none of the four `splitTextElements` calls wait for the "DM Sans" face to finish loading, and `.intro-title h1`, `.outro-title h1` and `.card h1` all sit at several `rem` sizes apiece — including the 14rem the "10" grows into during the lockup morph — so the per-`.char` mask geometry SplitText computes is exactly the kind of measurement a fallback-then-swap font reflow throws off. Gate the four calls behind `document.fonts.ready`, keep the effect itself synchronous around that gate, and guard the deferred split with the same cancellation flag the cleanup sets — `fonts.ready` can resolve after a StrictMode unmount has already run `ctx.revert()`.
