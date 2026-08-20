# Pinned Horizontal-Scroll 404 — Giant Serif Headline Pans Sideways While Image Cards Parallax and Rotate

## Goal
Build a **full-screen black 404 page** whose star effect is a **pinned, scroll-driven horizontal pan**. A colossal white serif headline ("Page Not Found", set at `48vw`) lives on a `400vw`-wide stage; as the visitor scrolls **down**, the whole stage is pinned in place and slides **left** (its `x` goes `0 → −350vw`), so the giant letters sweep across the viewport from right to left. Scattered over the headline are **four small rounded image cards** that each **drift sideways at their own rate and rotate** as you scroll — a layered parallax. When the pan completes, a centered closing message ("This page doesn't exist anymore… but that's okay. We'll get you right back on the track!") is revealed on the now-empty black stage. Everything is driven by GSAP **ScrollTrigger** (`scrub` + `pin`) with a distinctive double-smoothed, trailing feel.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the single GSAP plugin **`ScrollTrigger`**. No smooth-scroll library, no canvas/WebGL, no SplitText. Import as:
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
```
All animation code runs inside a `DOMContentLoaded` listener.

## Layout / HTML
```
.container                                   (the tall scroll driver — height: 1200vh)
  nav > a  "Motionprompts"                    (fixed strip, top-center)

  section.wrapper-404                         (the 400vw-wide pinned stage)
    h1  "Page Not Found"                      (one line, 48vw serif, spans the whole stage)
    .card#card-1 > img                        (4 absolutely-positioned square image cards)
    .card#card-2 > img
    .card#card-3 > img
    .card#card-4 > img

  section.outro                               (the closing message, lower in the container)
    h1  "This page doesn't exist anymore... but that's okay. <br> We'll get you right back on the track!"

script type="module" src="./script.js"
```
Key classes/ids the JS depends on: `.wrapper-404`, `#card-1`…`#card-4`. Nav brand text is the neutral demo name **"Motionprompts"** — no real brand marks.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; background:#000; overflow-x:hidden; }`. `img { width:100%; height:100%; object-fit:cover; }`.

**Palette:** pure black `#000` background, white `#fff` text. The image cards supply all the color.

**Font:** `html, body { font-family: "Roslindale Display Condensed"; }` — a proprietary **high-contrast condensed serif display** face. **No `@font-face`/web-font is loaded**, so it simply falls back to the platform default serif (Times-like); substitute any elegant high-contrast serif (e.g. a Didone/Times-style display serif). The look is defined by the sizes below, not the family name.

**Load-bearing structural CSS** (the pin math and transforms depend on this geometry):
- `.container { width:100%; height:1200vh; }` — the tall element that creates the page's scroll length.
- `nav { position:fixed; top:0; width:100%; padding:1em; display:flex; justify-content:center; }`; `a { text-decoration:none; color:#fff; font-size:20px; }`.
- `h1 { width:100%; color:#fff; font-size:48vw; font-weight:400; text-align:center; margin:0; }` — the giant headline; because it's `width:100%` inside the `400vw` stage, it stretches across the whole stage as one enormous line.
- `.wrapper-404 { position:absolute; top:0; width:400vw; height:100vh; will-change:transform; }` — **the stage GSAP pins and translates on `x`.** It is 4 viewports wide and exactly 1 viewport tall.
- `.card { position:absolute; width:300px; height:300px; background:gray; border-radius:20px; overflow:hidden; }` — a fixed 300×300 rounded square; the `<img>` inside fills it via `object-fit:cover`.
- Card anchor positions (percentages are relative to the `400vw` stage, so they're spread across its width):
  - `#card-1 { top:50%; left:20%; }`
  - `#card-2 { top:25%; left:40%; }`
  - `#card-3 { top:45%; left:60%; }`
  - `#card-4 { top:15%; left:80%; }`
- `.outro { position:absolute; top:150vh; width:100%; height:100vh; }`, and `.outro h1 { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:max-content; font-size:40px; font-weight:lighter; text-align:center; }` — a small centered two-line message (NOT the giant 48vw size; this h1 is overridden to 40px).
- Mobile tweak: `@media (max-width:900px){ .wrapper-404 { padding-top:20em; } }`.

## GSAP effect (exhaustive — this is the whole component)

Two kinds of ScrollTrigger, all created once inside `DOMContentLoaded`. **Note the unusual pattern:** every trigger uses `scrub` **and** re-issues a short `gsap.to()` tween inside its `onUpdate`, so the motion is *double-smoothed* (scrub inertia + a trailing 0.5s `power3.out` on top). This gives the pan and the cards a soft, laggy, momentum-like glide rather than a rigid 1:1 scrub.

### Card data
```js
const cards = [
  { id: "#card-1", endTranslateX: -2000, rotate:  45 },
  { id: "#card-2", endTranslateX: -1000, rotate: -30 },
  { id: "#card-3", endTranslateX: -2000, rotate:  45 },
  { id: "#card-4", endTranslateX: -1500, rotate: -30 },
];
```

### 1. Main ScrollTrigger — pin the stage + horizontal pan
```js
ScrollTrigger.create({
  trigger: ".wrapper-404",
  start: "top top",
  end: "+=900vh",
  scrub: 1,
  pin: true,
  onUpdate: (self) => {
    gsap.to(".wrapper-404", {
      x: `${-350 * self.progress}vw`,
      duration: 0.5,
      ease: "power3.out",
    });
  },
});
```
Precise behavior:
- **`pin: true`** freezes `.wrapper-404` in the viewport for the whole active range while the page scrolls; **`start:"top top"`** (stage top hits viewport top → the very start of the page) and **`end:"+=900vh"`** define the pin length.
- **`scrub: 1`** ties the trigger's own `self.progress` to the scrollbar with ~1s catch-up smoothing.
- **`onUpdate`** re-tweens the pinned stage's `x` **on the same `.wrapper-404` element** every update: target `x = −350·progress` **vw**. So `progress 0 → x:0` (headline starts, first letters on screen), `progress 1 → x:−350vw` (the whole 400vw stage has swept left by 3.5 viewports, headline gone, black stage). Each `onUpdate` overwrites the in-flight 0.5s `power3.out` tween, layering a trailing ease over the scrub.

### 2. Per-card ScrollTriggers — parallax x-drift + rotation
For **each** of the four cards, create an independent ScrollTrigger:
```js
cards.forEach((card) => {
  ScrollTrigger.create({
    start: "top top",
    end: "+=1200vh",
    scrub: 1,
    onUpdate: (self) => {
      gsap.to(card.id, {
        x:      `${card.endTranslateX * self.progress}px`,
        rotate: `${card.rotate * self.progress * 2}`,
        duration: 0.5,
        ease: "power3.out",
      });
    },
  });
});
```
Precise behavior:
- These four triggers are **NOT anchored to the card elements**. In the original they are created with a trigger selector that does not resolve to any real element, so each one effectively measures **overall page-scroll progress from the top of the page** (`start` at the page top, running for `end:"+=1200vh"`). Reproduce that: do **not** pass a card element as `trigger` — let each card trigger track the page's scroll progress. (If you tie them to the card elements instead, the progress mapping changes and the parallax rates come out wrong.)
- Per update, each card is tweened to `x = endTranslateX · progress` **px** and `rotate = (rotate · progress · 2)` **degrees** — again via a re-fired `gsap.to(..., {duration:0.5, ease:"power3.out"})`, so cards glide/lag exactly like the stage.
- **End values at `progress = 1`** (the flung, rotated resting state):
  - `#card-1`: `x −2000px`, rotate **+90°** (`45·2`)
  - `#card-2`: `x −1000px`, rotate **−60°** (`−30·2`)
  - `#card-3`: `x −2000px`, rotate **+90°**
  - `#card-4`: `x −1500px`, rotate **−60°**
- Because the cards' end distance is `+=1200vh` while the stage's pin is `+=900vh`, the cards travel/rotate at a **different (slower) rate than the stage pans** — that rate mismatch is the parallax: cards slide/spin at a `900:1200` (3:4) pace relative to the headline, some clockwise (`+45`) and some counter-clockwise (`−30`), so they scatter, tilt, and fly off-screen left as the pan finishes.

### Net journey (what's on screen)
- **Start (progress 0):** nav "Motionprompts" top-center; the giant serif "P a g…" of "Page Not Found" filling the frame; cards sitting at their anchor spots (e.g. card #1 lower-right).
- **Mid:** the stage slides left ("…Found" letters sweep through), each card drifting left and tilting at its own angle, overlapping the letterforms.
- **End (progress 1):** stage panned fully `−350vw`, headline gone, cards flung far left off-screen — an almost-empty black page with the small centered outro line ("This page doesn't exist anymore… but that's okay. We'll get you right back on the track!") revealed.

## Assets / images
**4 images**, each shown inside a **300×300 rounded (`border-radius:20px`) square card**, hard-cropped with `object-fit:cover` (so source aspect is forgiving — mix of portrait and landscape works). This is an **intentionally eclectic, non-matching set** (they don't form one series). By role/order:
1. **#card-1** — a moody **product still-life**: a sleek matte-aluminium gadget (rounded-rectangle device with a circular directional-pad button and a USB-C-style port) shot close-up on a dark charcoal surface with soft dramatic lighting. (Source portrait ~2:3.)
2. **#card-2** — a bold **pop-art / comic-style illustration**: a woman with stylized **blue** skin wearing **yellow-framed** sunglasses and a blue/yellow/black striped sweater, against a flat **bright-red** background. (Portrait ~2:3.)
3. **#card-3** — another **pop-art comic portrait**: a woman with a dark bob and blunt fringe, **blue** skin tones and blue lips, wearing a navy-and-cream Breton-striped top, against a flat **bright-blue** background. (Portrait ~2:3.)
4. **#card-4** — an **aerial landscape photo**: a **turquoise river** meandering in an S-curve through vast green grassland and rolling hills under a pale sky. (Landscape ~3:2.)

## Behavior notes
- **Scroll-only, no autoplay** — nothing moves until the user scrolls; at rest the stage sits at `x:0`. There is no loop and no reverse-autoplay; scrolling back up simply rewinds the scrubbed timeline.
- **The whole sequence lives inside the pin.** Because the `onUpdate` tweens `x` on the *same* pinned `.wrapper-404`, and the container is `1200vh`, the entire pan + card parallax completes within a compact scroll span and then holds — scrolling to the bottom leaves the end/outro state on screen.
- **Desktop-first** (the giant `48vw` headline and pinned horizontal pan are built for wide viewports); the mobile media query only nudges the stage down with `padding-top`.
- **Reduced motion:** the original has no `prefers-reduced-motion` guard; all motion is user-scroll-driven, so it's calm when the user isn't scrolling.

## Images

This component ships with 4 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/404/img-1.jpg
https://motionprompts.dev/c/404/img-2.jpg
https://motionprompts.dev/c/404/img-3.jpg
https://motionprompts.dev/c/404/img-4.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--paper`, `--ink`, `--gray`, `--gray-read`, `--red`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, reaches into the page with plain selector strings, and never has to undo anything. React withdraws all three of those guarantees at once, and it does it quietly — the pin and the pan look right on first load, and the damage only shows up on a second mount or a real navigation away.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: here that means two `ScrollTrigger`s pinning the same `.wrapper-404` and disagreeing about the same scrub, plus two full sets of the four card triggers, each pair re-tweening `#card-1`–`#card-4` on every scroll tick. The visible symptom is a stage that pans at roughly twice the rate, or cards whose `x`/`rotate` visibly stutter between two competing targets, and it will not reproduce in a production build, because React only does the double mount in development.

*(1) The entry point* — the whole effect lives inside `document.addEventListener("DOMContentLoaded", function () {...})`: the `cards` array (the four `{ id, travelVW, rotate }` descriptors) is declared there, and so are all five `ScrollTrigger.create` calls — the pin-and-pan trigger on `.wrapper-404` and one trigger per card. By the time a React component mounts, `DOMContentLoaded` has already fired, so that listener is registered and never called: nothing pins, nothing scrubs, the stage just sits at rest and the container scrolls past it like an ordinary tall page, with nothing in the console to explain why. Delete the listener and move its entire body — the `cards` array and all five `ScrollTrigger.create` calls — directly into a `useEffect` with an empty dependency array.

*(2) Element lookups* — the pin trigger is the string `".wrapper-404"`, each card trigger is keyed off `card.id` (one of `"#card-1"`–`"#card-4"`), and every `onUpdate` re-resolves that same string again to re-tween the stage or the card it belongs to. All of this assumes there is exactly one `.wrapper-404` and one of each `#card-N` in the whole document. Give the pinned stage a root `ref`, render it on `.wrapper-404` (or the element that wraps it and the four cards), and scope every one of these lookups to it. That matters more here than in most components in this catalogue: `#card-1`–`#card-4` are IDs, and during the StrictMode remount two copies of the subtree exist for an instant, each declaring its own `#card-1`. A bare `"#card-1"` — whether handed to `ScrollTrigger.create` as a `trigger` or to `gsap.to` as a target — resolves to whichever copy happens to come first in the document, not necessarily the one this effect run owns.

*(3) Cleanup* — wrap the pin-and-pan trigger and all four card triggers in one `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    const cards = [ /* the four { id, travelVW, rotate } descriptors, unchanged */ ];
    const q = self.selector; // scopes "#card-1" etc. to this component's own copy
    ScrollTrigger.create({ trigger: q(".wrapper-404")[0], pin: true, scrub: true /* … */ });
    cards.forEach((card) =>
      ScrollTrigger.create({ trigger: q(card.id)[0], scrub: true /* … */ })
    );
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` kills all five `ScrollTrigger`s and unpins the stage in a single call, which is exactly what prevents the doubled pin and the doubled card triggers described above. `gsap.registerPlugin(ScrollTrigger)` already sits at module scope in the source, above the listener — leave it there; it does not belong inside the effect.

One thing `ctx.revert()` does not reach: every `onUpdate` here doesn't just read `self.progress`, it calls `gsap.to(".wrapper-404", …)` or `gsap.to(card.id, …)` again, by string, on every scroll tick — that's the trailing, momentum-like glide this component layers on top of the raw scrub. Those `gsap.to()` calls run from inside a callback GSAP itself invokes long after the synchronous function passed to `gsap.context()` has already returned, so, unlike the `ScrollTrigger.create()` calls that spawned them, they are never recorded into the context. Reverting kills the triggers, which stops `onUpdate` from firing again after unmount — so no new stray tween gets created — but it will not reach back and cancel a re-tween that was already mid-flight at the exact moment of teardown, since that particular tween instance was never added to the context to begin with. In practice that is a short animation finishing against a node that may already be detached, not a growing leak, but it is the reason to resolve the target inside `onUpdate` through the same scoped `q()` shown above (`gsap.to(q(".wrapper-404")[0], …)`, `gsap.to(q(card.id)[0], …)`) instead of the bare global string: it keeps every one of these re-issued tweens, present and future, pointed only at the copy this effect actually owns.
