# Waabi Scroll Animation — Pinned Hero with Manual Progress Mapping + Parallax Columns

## Goal
Build a scroll-driven hero that is **pinned for 3.5 viewport heights** while a single scrubbed `ScrollTrigger`'s `progress` is **mapped by hand** into four sequential phases: a centered heading **slides up out of frame**, a supporting line **reveals word-by-word** (SplitText) then **fades out**, and the **full-screen hero image shrinks into a tiny 150 px rounded card** anchored at screen center. After the hero unpins, a following section **parallax-scrolls four columns of small square thumbnails upward at two different speeds**. Smooth scroll via Lenis. The star effect is the single manually-mapped pinned ScrollTrigger driving all four hero phases off one `progress` value.

## Tech
Vanilla HTML/CSS/JS with ES module imports, fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugins **`ScrollTrigger`** and **`SplitText`**.
- **`lenis`** — smooth scroll.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```
Note: only `ScrollTrigger` is passed to `registerPlugin`; `SplitText` is used via its static factory `SplitText.create(...)` (importing it is enough). Wrap everything in `document.addEventListener("DOMContentLoaded", () => { … })`.

## Layout / HTML
Three top-level `<section>`s. Class names and the four column IDs are load-bearing — the JS/CSS query them.

```html
<section class="hero">
  <div class="hero-img">
    <img src="…" alt="" />
  </div>
  <div class="hero-header">
    <h1>A study of motion unfolding inside a single frame</h1>
  </div>
  <div class="hero-copy">
    <h3>The moment where stillness transforms into movement</h3>
  </div>
</section>

<section class="about">
  <div class="about-images">
    <div class="about-imgs-col" id="about-imgs-col-1">
      <div class="img"><img src="…" alt="" /></div>
      <div class="img"><img src="…" alt="" /></div>
      <div class="img"><img src="…" alt="" /></div>
      <div class="img"><img src="…" alt="" /></div>
    </div>
    <div class="about-imgs-col" id="about-imgs-col-2"> …4 .img… </div>
    <div class="about-imgs-col" id="about-imgs-col-3"> …4 .img… </div>
    <div class="about-imgs-col" id="about-imgs-col-4"> …4 .img… </div>
  </div>
  <div class="about-header">
    <h3>Fragments of motion and atmosphere gathered into a drifting collection of quiet visual moments.</h3>
  </div>
</section>

<section class="outro">
  <h3>The frame settles back into quiet stillness.</h3>
</section>

<script type="module" src="./script.js"></script>
```

Notes:
- Exactly **4** `.about-imgs-col` columns, each with **4** `.img` wrappers (16 thumbnails total). Each `.img` holds one `<img>`.
- The hero `.hero-copy h3` line has **7 words** — the SplitText word count matters (it drives the per-word reveal math). Use the copy above verbatim; it is neutral editorial prose, no brand names. "Waabi" is only the fictional demo name; nothing branded appears on screen.

## Styling
Font (Google Fonts): **Inter**, full optical-size/weight axis:
```css
@import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");
```

Reset & globals:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `body { font-family:"Inter", sans-serif; background-color:#e3e3db; }` (warm pale grey page background).
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1, h3 { font-weight:400; letter-spacing:-0.05rem; line-height:1; }`
- `h1 { font-size:5rem; }`  `h3 { font-size:3rem; }`
- `section { position:relative; width:100%; height:100svh; }`

Hero layers — `.hero-img, .hero-header, .hero-copy` all share:
- `position:absolute; width:100%; height:100%; will-change:transform, opacity, width, height;`

`.hero-img`:
- `top:50%; left:50%; transform:translate(-50%, -50%); overflow:hidden;` — **centered**, so when JS shrinks its width/height it collapses toward the exact center of the viewport.

`.hero-header, .hero-copy` (text layers over the image):
- `padding:4rem; color:#fff; display:flex; align-items:flex-end;` — white text pinned to the **bottom** of the frame.
- `.hero-header h1 { width:75%; }`
- `.hero-copy h3 { width:50%; }`

`.about, .outro`: `display:flex; justify-content:center; align-items:center; text-align:center;`

`.about`:
- **`margin-top:275svh;`** — CRITICAL. This 2.75-viewport gap (plus the hero's own 100svh) is the scroll runway the pinned hero consumes; without it there is nowhere to scroll through the pinned timeline (see behavior notes).
- `.about-images { width:100%; height:100%; display:flex; justify-content:space-between; align-items:center; padding:4rem; }` — the four columns spread edge to edge.
- `.about-imgs-col { position:relative; height:125%; display:flex; flex-direction:column; justify-content:space-around; will-change:transform; }` — each column is **taller than the viewport (125%)** so its thumbnails overflow top and bottom, leaving room to drift.
- `.about-imgs-col .img { width:125px; height:125px; border-radius:10px; overflow:hidden; }` — small **square 1:1** thumbnails.
- **Initial column offsets (these are the CSS starting transforms GSAP animates from):**
  - `#about-imgs-col-1 { transform:translateY(1000px); }`
  - `#about-imgs-col-2 { transform:translateX(-225px) translateY(500px); }`
  - `#about-imgs-col-3 { transform:translateX(225px) translateY(500px); }`
  - `#about-imgs-col-4 { transform:translateY(1000px); }`
  Columns 1 & 4 start 1000 px low; the inner columns 2 & 3 start 500 px low and are nudged ∓225 px horizontally (2 left, 3 right).
- `.about-header { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:40%; }` — the caption floats centered over the columns.

`.outro`:
- `background-color:#cecec6;` (a slightly darker warm grey than the page). `.outro h3 { width:35%; }`

Responsive `@media (max-width:1000px)`:
- `h1 { font-size:3rem; }`  `h3 { font-size:2rem; }`
- `.hero { z-index:2; }`
- `.hero-header, .hero-copy { padding:2rem; }` and `.hero-header h1, .hero-copy h3 { width:100%; }`
- `.about-header, .outro h3 { width:100%; padding:2rem; }`  `.about-images { padding:2rem; }`
- `.about-imgs-col .img { width:75px; height:75px; opacity:0.25; filter:saturate(0); }` (thumbnails go smaller, faded and desaturated on mobile)
- `#about-imgs-col-2, #about-imgs-col-3 { transform:translateX(0px) translateY(500px); }` (drop the horizontal offset on small screens)

## GSAP effect (be exhaustive — this is the point)

### Smooth-scroll wiring (Lenis + GSAP ticker)
```js
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```
Lenis' scroll event pumps `ScrollTrigger.update`; Lenis is driven by GSAP's ticker (`time * 1000` → ms); lag smoothing off so scrub stays glued to scroll position.

### SplitText — split the copy line into words
```js
const heroCopySplit = SplitText.create(".hero-copy h3", {
  type: "words",
  wordsClass: "word",
});
```
Words only (no chars/lines), each word wrapped in a `.word` span. There is **no `mask` option**. The reveal is not a plugin animation — it is driven manually inside the ScrollTrigger `onUpdate` below by setting each word's `opacity`.

Also declare a latch flag before the ScrollTrigger:
```js
let isHeroCopyHidden = false;
```

### The pinned hero ScrollTrigger (the star — single trigger, manual progress mapping)
```js
ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: `+${window.innerHeight * 3.5}px`,   // pin runway = 3.5 viewport heights
  pin: true,
  pinSpacing: false,                       // no spacer — .about margin-top is the runway
  scrub: 1,                                // 1s catch-up smoothing on the scrub
  onUpdate: (self) => {
    const progress = self.progress;        // 0 → 1 across the 3.5vh pin
    // …four phases below, all keyed off `progress`…
  },
});
```

Inside `onUpdate`, `progress` (0→1) is sliced into four overlapping windows. Reproduce the math exactly:

**Phase 1 — header slides up and out (progress 0 → 0.29):**
```js
const heroHeaderProgress = Math.min(progress / 0.29, 1);
gsap.set(".hero-header", { yPercent: -heroHeaderProgress * 100 });
```
`.hero-header` translates from `yPercent:0` to `yPercent:-100` (rises by its own full height, exiting the top) over the first **29 %** of the scrub. `gsap.set` (instant, per-frame) — the scrub itself supplies the smoothing, no ease/duration here.

**Phase 2 — copy reveals word-by-word (progress 0.29 → 0.50):**
```js
const heroWordsProgress = Math.max(0, Math.min((progress - 0.29) / 0.21, 1));
const totalWords = heroCopySplit.words.length;   // 7
heroCopySplit.words.forEach((word, i) => {
  const wordStart = i / totalWords;
  const wordEnd   = (i + 1) / totalWords;
  const wordOpacity = Math.max(
    0,
    Math.min((heroWordsProgress - wordStart) / (wordEnd - wordStart), 1),
  );
  gsap.set(word, { opacity: wordOpacity });
});
```
The reveal window is the **21 %** band from 0.29 to 0.50, remapped to a local `heroWordsProgress` 0→1. Each word owns an equal `1/totalWords` slice of that local progress and its opacity ramps 0→1 linearly across its own slice, so the 7 words illuminate **left-to-right, one after another** as you scroll. (Words start at `opacity:0` because at progress 0 the calc yields 0 for all.)

**Phase 3 — copy fades out, latched (progress crosses 0.64):**
```js
if (progress > 0.64 && !isHeroCopyHidden) {
  isHeroCopyHidden = true;
  gsap.to(".hero-copy h3", { opacity: 0, duration: 0.2 });
} else if (progress <= 0.64 && isHeroCopyHidden) {
  isHeroCopyHidden = false;
  gsap.to(".hero-copy h3", { opacity: 1, duration: 0.2 });
}
```
Unlike the other phases this is a **one-shot tween guarded by the `isHeroCopyHidden` latch** (not a per-frame set): once `progress` passes **0.64** the whole `.hero-copy h3` fades to `opacity:0` over `0.2s` (default ease); scrolling back up under 0.64 fades it back to `1`. The latch prevents the tween from re-firing every frame. Note the gap: words finish at 0.50, the line stays fully lit until 0.64, then fades.

**Phase 4 — hero image shrinks to a rounded card (progress 0.71 → 1.0):**
```js
const heroImgProgress = Math.max(0, Math.min((progress - 0.71) / 0.29, 1));
const heroImgWidth        = gsap.utils.interpolate(window.innerWidth,  150, heroImgProgress);
const heroImgHeight       = gsap.utils.interpolate(window.innerHeight, 150, heroImgProgress);
const heroImgBorderRadius = gsap.utils.interpolate(0, 10, heroImgProgress);
gsap.set(".hero-img", {
  width: heroImgWidth,
  height: heroImgHeight,
  borderRadius: heroImgBorderRadius,
});
```
Over the final **29 %** (0.71 → 1.0, remapped to local 0→1), the hero image's **width shrinks from `window.innerWidth` → 150 px**, **height from `window.innerHeight` → 150 px**, and **border-radius grows 0 → 10 px** — using `gsap.utils.interpolate(from, to, t)` for a linear lerp on each. Because `.hero-img` is centered with `translate(-50%,-50%)`, it collapses toward the middle of the screen, ending as a small 150×150 rounded thumbnail. (The image lands at exactly the same visual scale/shape as the `.about` column thumbnails, which is the intended hand-off.)

Phase summary along the 0→1 scrub: **0–0.29** header up · **0.29–0.50** words in · **0.64** copy fades out · **0.71–1.0** image shrinks. The bands are deliberately staggered with small quiet gaps between them.

### Parallax columns (four independent ScrollTriggers)
After the hero, animate the four columns upward at two speeds:
```js
const aboutImgCols = [
  { id: "#about-imgs-col-1", y: -500 },
  { id: "#about-imgs-col-2", y: -250 },
  { id: "#about-imgs-col-3", y: -250 },
  { id: "#about-imgs-col-4", y: -500 },
];

aboutImgCols.forEach(({ id, y }) => {
  gsap.to(id, {
    y,
    scrollTrigger: {
      trigger: ".about",
      start: "top bottom",   // begins when .about enters from the bottom
      end: "bottom top",     // ends when .about leaves out the top
      scrub: true,
    },
  });
});
```
Each column tweens its GSAP `y` **from its CSS starting offset to the target `y`**, while the CSS `translateX` on cols 2/3 is preserved (GSAP only touches `y`):
- Col 1: y `1000 → -500` (travels 1500 px up)
- Col 2: y `500 → -250`, x stays `-225`
- Col 3: y `500 → -250`, x stays `+225`
- Col 4: y `1000 → -500` (travels 1500 px up)

So the **outer columns (1 & 4) drift up nearly twice as fast/far as the inner columns (2 & 3)** across the whole time `.about` is on screen (`scrub: true`, fully scroll-linked) → a layered parallax of thumbnail columns rising past the centered caption.

**No CustomEase, no lerp/rAF loop of your own, no Three.js.** The only easing is GSAP's scrub smoothing plus the two default-ease `0.2s` copy-fade tweens; everything else is per-frame `gsap.set` driven by mapped `progress`.

## Assets / images
Provided set: **8 distinct photos** — `hero.jpg` plus `img1`, `img10`, `img11`, `img12`, `img13`, `img14`, `img15`. This is a **contemporary fashion-editorial** set, not a single unified mood: it mixes a soft misty fine-art scene, clean studio portraits on **bold saturated color backdrops**, and several **grainy motion-blur** frames. Palette across the set swings from pale foggy greys/greens to vivid orange, teal and red. The `hero.jpg` file is **landscape (~4:3)**; the other seven are roughly **square (1:1)**.

- **1 full-bleed hero image** — `hero.jpg` (`.hero-img`, `object-fit:cover`, fills the whole viewport then shrinks to a 150 px rounded square). It shows a **pale platinum-haired woman in a long white Victorian-style dress standing on a small grassy islet between two black swans on a misty pond** — dominant colors are foggy pale green/grey water and reed banks, with the white dress and the two black swans as high-contrast anchors. The delivered file is landscape but the section crops it to fill; the centered standing figure survives both the full-bleed view and the final square card.
- **Thumbnail set** for the 16 square slots (`.img`, 1:1, 125 px), 4 per column, drawn from the photos so the four columns read as one drifting editorial mood-board. The distinct subjects available:
  - the pale woman with two **black swans** on the misty pond (`hero.jpg`) — whites, blacks, foggy green.
  - a **white-haired figure in a white robe seated in a decaying pastel room** overflowing with white climbing flowers, a tall latticed window, and a gilt gold mirror over a marble mantel (`img1.jpg`) — soft whites, faded plaster, a warm gold accent.
  - a **side profile of a figure in a multicolor painterly patchwork sleeveless dress against a vivid orange backdrop** (`img10.jpg`) — bold orange field with mixed saturated brushstroke colors.
  - a **brunette figure in a bright red blazer with layered gold chain necklaces against a deep teal backdrop** (`img11.jpg`) — red-and-teal complementary contrast with a gold accent.
  - a **motion-blurred figure in a grey jacket and white trousers caught mid-movement** (`img12.jpg`) — neutral greys and off-whites, streaked by blur.
  - an **extreme high-key, washed-out close-up of a pale blond face bathed in soft pink light** (`img13.jpg`) — very light creams and pinks, nearly overexposed.
  - a **dark, grainy, motion-blurred cluster of people at night** (`img14.jpg`) — warm brown skin tones swimming in near-black shadow.
  - a **motion-blurred screaming face against a vivid red background** (`img15.jpg`) — saturated red with dark hair streaks.

Describe generically, no brands or logos. There are 8 source photos for 16 thumbnail slots, so **repeat them across the columns** to fill all 16.

## Behavior notes
- **Trigger: scroll only.** Nothing autoplays. The hero is entirely scrubbed (`scrub:1`) so it plays forward on scroll-down and reverses on scroll-up; parking the scroll freezes any phase mid-way. The columns are `scrub:true`.
- **The `.about { margin-top:275svh }` is the scroll runway.** With `pinSpacing:false` no spacer is inserted, so the document's own height — hero `100svh` + `275svh` margin — must supply the `+=window.innerHeight * 3.5` pin distance. Keep them in sync.
- **Heights use `svh`** (`100svh`, `margin-top:275svh`) so mobile browser chrome doesn't break the full-screen layout.
- `window.innerWidth/innerHeight` are read live inside `onUpdate`, so the image-shrink start size tracks the current viewport.
- **Desktop-first.** On `max-width:1000px` the constrained text widths relax to 100 %, thumbnails shrink to 75 px and are faded/desaturated, and the inner columns lose their horizontal offset. The pin + scrub effect still runs.
- No reduced-motion guard in the original.
```

## Images

This component ships with 17 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/waabi-scroll-animation/hero.jpg
https://motionprompts.dev/c/waabi-scroll-animation/img1.jpg
https://motionprompts.dev/c/waabi-scroll-animation/img10.jpg
https://motionprompts.dev/c/waabi-scroll-animation/img11.jpg
https://motionprompts.dev/c/waabi-scroll-animation/img12.jpg
https://motionprompts.dev/c/waabi-scroll-animation/img13.jpg
… 11 more under https://motionprompts.dev/c/waabi-scroll-animation/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--slate`, `--overlay`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, wires `Lenis` into GSAP's ticker, splits `.hero-copy h3` into words, and then drives four sequential visual phases — the header's exit, the word-by-word reveal, the copy's one-shot fade, and the hero image's shrink into a rounded card — entirely out of one pinned `ScrollTrigger`'s `onUpdate`, before handing off to four more `ScrollTrigger`-backed `gsap.to` calls that parallax the `.about` columns. None of it ever has to undo itself, because the page it lives on never unmounts. React withdraws that guarantee, and it does it quietly: the pin plays correctly on first load, and the damage only shows up on a second mount or a real route change.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Mount this component twice without tearing the first pass down and you get two pinned `ScrollTrigger`s stacked on `.hero`, each running its own `onUpdate` off its own `progress`, both writing the same `yPercent` to `.hero-header`, the same per-word opacity, and the same `width`/`height`/`borderRadius` to `.hero-img` on every scroll tick; two `Lenis` instances each pumped by their own `gsap.ticker` callback fighting over the same wheel event; a second, un-reverted `SplitText.create(".hero-copy h3", …)` pass that doesn't split plain text again — it wraps the first pass's seven `.word` spans in a second layer of `.word` spans, so `heroCopySplit.words.length` on the new mount no longer matches the seven words actually visible, and the left-to-right reveal math (`i / totalWords`) walks the wrong node set; and eight parallax tweens instead of four, doubling the drift on all four `.about-imgs-col` columns. None of this reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener's body — the `Lenis`/ticker wiring, the `SplitText.create` call, the pinned `ScrollTrigger.create`, and the four-column parallax loop — never runs: the hero sits frozen on its very first frame, `.hero-copy h3` stays whole with no `.word` spans, and nothing in the console explains why. Delete the `document.addEventListener("DOMContentLoaded", …)` wrapper and move its entire body into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` belongs at module scope, above the component — `SplitText` needs no registration, it's used through its static `.create()`. `gsap.ticker.lagSmoothing(0)` can move up there too, or stay in the effect; it's global and idempotent either way.

*(2) Element lookups* — Every selector here — `.hero` as the pin's trigger, `.hero-header`, `.hero-copy h3`, `.hero-img`, `.about` as the parallax trigger, and the four `#about-imgs-col-*` ids — assumes the component owns the document. Give the component a root `ref` spanning the hero, `.about` and the outro, and pass it as `gsap.context`'s scope argument: `gsap.context(fn, rootRef)`. That automatically scopes every selector string GSAP resolves **while the factory function is synchronously running** — `trigger: ".hero"`, the parallax loop's `trigger: ".about"` and its four column ids — for free. It does **not** reach the three selector strings resolved from inside `onUpdate` — `.hero-header`, `.hero-copy h3` and `.hero-img` — because the scoping `gsap.context` gives you, like the auto-revert it gives you, only applies for as long as the factory is synchronously executing. `onUpdate` fires later, once per scroll tick, well outside that window, so each of those three strings re-resolves against the entire document on every frame regardless of the ref you passed in. Resolve `heroHeader`, `heroCopyH3` and `heroImg` once, via `rootRef.current.querySelector(...)`, before creating the trigger, and hand those elements to the `gsap.set`/`gsap.to` calls inside `onUpdate` instead of the class strings. The per-word `gsap.set(word, …)` calls need no such fix — `word` is already a real node pulled from `heroCopySplit.words`, never a selector string.

*(3) Cleanup* — the same synchronous-window rule from (2) governs what `ctx.revert()` can undo. `ScrollTrigger.create(...)` for the pin and the four `gsap.to(...)` parallax calls all run synchronously while the factory executes, so one `ctx.revert()` correctly unpins `.hero`, kills the four column tweens and their auto-created `ScrollTrigger`s, and restores whatever inline styles those five carried directly. It does **not** touch anything `onUpdate` wrote, because `onUpdate` itself runs later, outside that window — the header's `yPercent`, every word's `opacity`, the image's `width`/`height`/`borderRadius`, and the one-shot copy-fade tween all persist exactly as the last scrub tick left them. Clear the first three by hand, and keep a reference to the fade tween so you can stop it if it's still mid-flight at unmount:

```jsx
useEffect(() => {
  const lenis = new Lenis();
  const onTick = (time) => lenis.raf(time * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(onTick);

  const heroHeader = rootRef.current.querySelector(".hero-header");
  const heroCopyH3 = rootRef.current.querySelector(".hero-copy h3");
  const heroImg = rootRef.current.querySelector(".hero-img");
  let heroCopySplit, copyFadeTween;

  const ctx = gsap.context(() => {
    heroCopySplit = SplitText.create(".hero-copy h3", { type: "words", wordsClass: "word" });
    let isHeroCopyHidden = false;

    ScrollTrigger.create({
      trigger: ".hero",
      /* start, end, pin, scrub exactly as above */
      onUpdate: (self) => {
        const progress = self.progress;
        gsap.set(heroHeader, { yPercent: -Math.min(progress / 0.29, 1) * 100 });
        /* per-word opacity over heroCopySplit.words, unchanged */
        if (progress > 0.64 && !isHeroCopyHidden) {
          isHeroCopyHidden = true;
          copyFadeTween = gsap.to(heroCopyH3, { opacity: 0 });
        } else if (progress <= 0.64 && isHeroCopyHidden) {
          isHeroCopyHidden = false;
          copyFadeTween = gsap.to(heroCopyH3, { opacity: 1 });
        }
        gsap.set(heroImg, { /* width/height/borderRadius, unchanged */ });
      },
    });

    /* the four-column parallax loop, unchanged, targeting the #about-imgs-col-* ids */
  }, rootRef);

  return () => {
    copyFadeTween?.kill();
    ctx.revert();
    gsap.set([heroHeader, heroCopyH3, heroImg], { clearProps: "all" });
    heroCopySplit.revert();
    gsap.ticker.remove(onTick);
    lenis.destroy();
  };
}, []);
```

Kill the fade tween before clearing props — a `gsap.to` created inside `onUpdate` is a real tween with the short duration already set above, not an instant write, so it can still be actively interpolating `.hero-copy h3`'s opacity when the unmount lands, and a `clearProps` that runs while it's still ticking gets immediately overwritten on the next frame. `heroCopySplit.revert()` goes last, after every `gsap.set`/`gsap.to` that could still touch a `.word` span has been killed or cleared, so it's unwrapping spans nothing is actively writing to — reverting it earlier, while an orphaned trigger's last tick or a live fade tween can still reach into `heroCopySplit.words`, unwraps the exact spans those calls were about to write into. The `gsap.ticker.add(onTick)` subscription is untouched by any of this — a ticker callback is neither a tween nor a trigger, so it survives `ctx.revert()` and has to be removed by the same reference you added, before `lenis.destroy()` runs, or a tick landing between the two calls invokes `.raf()` on an instance already torn down. `lenis.on("scroll", ScrollTrigger.update)` needs no separate teardown — that listener lives on Lenis's own emitter and goes with `destroy()`.

One split-specific note: `type: "words"` doesn't measure rendered line boxes the way a char or line split does, so unlike those, this split doesn't need to wait on `document.fonts.ready` — word boundaries come from the markup's own child nodes, not from wherever the browser happens to wrap a line, so a fallback face can't put `heroCopySplit.words` at the wrong count or the wrong boundaries.

Lenis is a document-level resource, and this component constructs and owns its own instance. If it becomes one section among several in a larger app, lift the `new Lenis()` call to the app shell and have this effect subscribe the shared instance's `scroll` event to `ScrollTrigger.update` instead of constructing a second instance that fights the first over the same wheel input.
