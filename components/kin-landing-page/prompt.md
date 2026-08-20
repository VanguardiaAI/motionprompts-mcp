# Landing Page Reveal — Revealer Wipe → Image Stack → Flip-to-Corner Intro

## Goal
Build a full-screen editorial fashion landing hero with a cinematic **load-triggered intro** (~8.6 s, plays once). Two white panels (top + bottom) split apart with a custom `hop` ease to reveal a full-bleed image; a deck of 8 images scales down from `1.5×` and fades in one after another so they cascade into place; then **GSAP Flip** shrinks the final three "main" images from full-screen down to a small stacked cluster of thumbnails in the bottom-left corner. Simultaneously the hero furniture slides in — the logo, nav links, address and a **SplitType**-split heading all rise up from behind clip-path masks, and a desaturated team image in the bottom-right unmasks upward. Everything is orchestrated by nested GSAP timelines that fire automatically on `DOMContentLoaded`.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugins **`Flip`** and **`CustomEase`**, and **`split-type`** (npm, imported as `SplitType`) for the line-splitting. No smooth-scroll library — the page does not scroll during the intro; it is a pure load-triggered timeline. Register with `gsap.registerPlugin(Flip, CustomEase)` and fire the whole sequence on `DOMContentLoaded`.

Imports:
```js
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { CustomEase } from "gsap/CustomEase";
import SplitType from "split-type";
gsap.registerPlugin(Flip, CustomEase);
```

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```
<div class="container">
  <div class="revealers">
    <div class="revealer r-1"></div>   <!-- top white panel -->
    <div class="revealer r-2"></div>   <!-- bottom white panel -->
  </div>

  <div class="images">
    <div class="img"><img src="..." alt="" /></div>          <!-- 1: first shown -->
    <div class="img"><img src="..." alt="" /></div>          <!-- 2 -->
    <div class="img"><img src="..." alt="" /></div>          <!-- 3 -->
    <div class="img"><img src="..." alt="" /></div>          <!-- 4 -->
    <div class="img"><img src="..." alt="" /></div>          <!-- 5 -->
    <div class="img main"><img src="..." alt="" /></div>     <!-- 6: Flip target -->
    <div class="img main"><img src="..." alt="" /></div>     <!-- 7: Flip target -->
    <div class="img main"><img src="..." alt="" /></div>     <!-- 8: Flip target -->
  </div>

  <div class="hero-content">
    <div class="site-logo">
      <div class="word"><h1>Arc</h1></div>
      <div class="word"><h1>Worldwide<sup>&copy;</sup></h1></div>
    </div>

    <div class="nav">
      <div class="nav-item"><p>About</p></div>
      <div class="nav-item"><p>Work</p></div>
      <div class="nav-item"><p>Journal</p></div>
      <div class="nav-item"><p>Contact</p></div>
    </div>

    <div class="team-img"><img src="..." alt="" /></div>   <!-- reuse image 3 -->

    <div class="site-info">
      <div class="row">
        <div class="col"><div class="line"><p>Featured Works</p></div></div>
        <div class="col">
          <h2>Arc is a contemporary fashion brand redefining elegance with timeless designs and innovative aesthetics.</h2>
        </div>
      </div>
      <div class="row">
        <div class="col"></div>
        <div class="col">
          <div class="address">
            <div class="line"><p>Arc Studio</p></div>
            <div class="line"><p>Riverstone Building</p></div>
            <div class="line"><p>- 28 Orchard Lane</p></div>
            <div class="line"><p>N1 4DX</p></div>
          </div>
          <div class="socials">
            <div class="line"><p>SayHi@Arc.com</p></div>
            <br />
            <div class="line"><p>Instagram</p></div>
            <div class="line"><p>LinkedIn</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

Notes:
- `.images` holds exactly **8** `.img` wrappers. The **last three** (indices 5,6,7) also carry class `main` — those are the Flip targets that survive into the corner stack; the first five are `.remove()`d from the DOM mid-sequence.
- `.team-img` reuses the **same photo as image 3** (bottom-right, rendered grayscale).
- Use **"Arc" / "Worldwide"** as the neutral placeholder brand. Copyright superscript `©` after "Worldwide".

## Styling
Fonts: the design calls for **"PP Neue Montreal"** (body + all `h1`/`h2`) and **"Apercu Mono Pro"** (the small `.site-info p` labels). These are custom faces — if unavailable, fall back to a clean geometric sans (e.g. Helvetica Neue / Inter) for the display type and a monospace for the small labels. Keep the family names in the CSS with sensible fallbacks.

Palette: dead simple — background `#fff`, all text `#000`. The revealer panels are also `#fff`.

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `html, body { width:100%; height:100%; font-family:"PP Neue Montreal"; background:#fff }`.
- `img { width:100%; height:100%; object-fit:cover }`.

Containers:
- `.container`: `position:relative; width:100vw; height:100vh; overflow:hidden`.
- `.revealers`: `position:fixed; inset:0; width:100vw; height:100vh; display:flex; flex-direction:column; z-index:2`. Each `.revealer`: `flex:1; width:100%; background:#fff` (so the two panels each fill 50% of the viewport height). **Initial** `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rectangle — both panels fully opaque and covering everything).
- `.images`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:100%; height:100%; transform-origin:center center; will-change:transform`.
- `.img`: `position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) scale(1.5); width:100%; height:100%; opacity:0; will-change:transform`. **`.img:first-child { opacity:1 }`** (only the first image is visible at the start; all start zoomed to `1.5×`).

Stacked (post-Flip) state — these classes are added by the JS, but the CSS must define them:
- `.images.stacked-container`: `position:fixed; left:2em; bottom:2em; width:auto; height:auto; display:flex; flex-direction:column-reverse; align-items:flex-start; gap:1em; transform:none; will-change:transform`.
- `.img.stacked`: `position:relative; width:150px; height:100px; transform:none; top:auto; left:auto; opacity:1; will-change:transform`.

Hero furniture:
- `.hero-content`: `position:relative; width:100%; height:100%`.
- `.site-logo`: `position:absolute; top:2em; left:2em; display:flex; gap:1em`. `.site-logo h1`: `color:#000; font-size:5vw; font-weight:500; line-height:1; letter-spacing:-0.01em`. `.site-logo h1 sup`: `position:absolute; top:-0.125em; font-size:2rem`.
- `.nav`: `position:absolute; right:0; width:50%; padding:2em; display:flex; justify-content:flex-end; gap:1em`. `.nav .nav-item p`: `font-size:16px; font-weight:500`.
- `.team-img`: `position:absolute; right:2em; bottom:2em; width:40%; height:50%`. **Initial** `clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0% 100%)` (collapsed onto the bottom edge → hidden). `.team-img img { filter:saturate(0) }` (grayscale).
- `.site-info`: `position:absolute; bottom:2em; left:2em; width:50%; height:50%; display:flex; flex-direction:column; justify-content:space-between`. `.site-info .row`: `display:flex; gap:2em`; `.row .col { flex:1 }`. `.site-info h2`: `font-size:25px; font-weight:500; line-height:1.25`. `.site-info p`: `text-transform:uppercase; font-family:"Apercu Mono Pro"; font-size:11px; font-weight:500; color:#000; line-height:1.25`. The second row's second col is `display:flex` so `.address` and `.socials` sit side by side (each `flex:1`).

Mask / initial hidden states (critical — the reveal depends on these):
- `.word, .nav-item, .line { clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%) }` — each is an overflow-clipping mask window.
- `.word h1, .nav-item p, .line p { position:relative; will-change:transform; transform:translateY(100%) }` — the text sits one full line **below** its mask (hidden).
- `.site-info h2 .line span { display:block; transform:translateY(100%) }` — the split heading lines also start pushed one line down inside their masks.

## GSAP effect (be exact)

### Setup
```js
document.addEventListener("DOMContentLoaded", () => {
  CustomEase.create("hop",  "M0,0 C0.355,0.022 0.448,0.079 0.5,0.5 0.542,0.846 0.615,1 1,1");
  CustomEase.create("hop2", "M0,0 C0.078,0.617 0.114,0.716 0.255,0.828 0.373,0.922 0.561,1 1,1");
```
- `hop` — a slightly "sticky" ease-in-out (hangs near the middle, then snaps to the end). Used for the revealer wipe, the Flip, and the team-image unmask.
- `hop2` — an ease-out-ish curve that leaps early then settles. Used for the masked-text rise.

**SplitType on the heading, then re-wrap each line in a mask.** Split `.site-info h2` into **lines**, then for every produced line replace it with a `<div class="line"><span>…</span></div>` wrapper (so it picks up the `.line` clip-path mask and the `span { translateY(100%) }` init):
```js
const splitH2 = new SplitType(".site-info h2", { types: "lines" });
splitH2.lines.forEach((line) => {
  const text = line.textContent;
  const wrapper = document.createElement("div");
  wrapper.className = "line";
  const span = document.createElement("span");
  span.textContent = text;
  wrapper.appendChild(span);
  line.parentNode.replaceChild(wrapper, line);
});
```

Three timelines:
```js
const mainTl     = gsap.timeline();
const revealerTl = gsap.timeline();
const scaleTl    = gsap.timeline();
```

### `revealerTl` — the two white panels split apart (both start together, `"<"`)
```js
revealerTl
  .to(".r-1", {
    clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",   // bottom edge collapses UP to the top → wipes up
    duration: 1.5, ease: "hop",
  })
  .to(".r-2", {
    clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)", // top edge collapses DOWN to the bottom → wipes down
    duration: 1.5, ease: "hop",
  }, "<");   // simultaneous
```
The top panel wipes upward and the bottom panel wipes downward at the same time, splitting open like a horizontal shutter over 1.5 s to reveal the image deck behind.

### `scaleTl` — image deck scales in and cascades
```js
scaleTl.to(".img:first-child", { scale: 1, duration: 2, ease: "power4.inOut" });

const images = document.querySelectorAll(".img:not(:first-child)"); // the other 7
images.forEach((img) => {
  scaleTl.to(img, {
    opacity: 1, scale: 1, duration: 1.25, ease: "power3.out",
  }, ">-0.95");   // start 0.95s BEFORE the previous tween ends → heavy overlap
});
```
- The already-visible **first** image de-zooms `scale 1.5 → 1` over **2 s** (`power4.inOut`).
- Each of the other **7** images fades `opacity 0 → 1` and de-zooms `1.5 → 1` over **1.25 s** (`power3.out`), each inserted at `">-0.95"` (0.95 s before the previous one finishes). Because duration 1.25 − 0.95 = **~0.3 s effective step**, the images cascade in quick succession, each layer landing on top of the last. `scaleTl` total ≈ **4.1 s**.

### `mainTl` — the master sequence
```js
mainTl
  .add(revealerTl)              // t = 0 .. 1.5
  .add(scaleTl, "-=1.25")       // inserted at 0.25 → images start scaling while panels still opening
  .add(() => { /* Flip, see below */ })   // fires at ~t = 4.35 (end of scaleTl)
  .to(".word h1, .nav-item p, .line p, .site-info h2 .line span", {
    y: 0, duration: 3, ease: "hop2", stagger: 0.1, delay: 1.25,
  })
  .to(".team-img", {
    clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
    duration: 2, ease: "hop", delay: -4.75,
  });
```

**Placement math** (position params / delays resolve to absolute times):
- `revealerTl` at **0** → spans [0, 1.5].
- `scaleTl` at `"-=1.25"` → inserted at **0.25** → spans [0.25, ~4.35]. So the deck begins de-zooming while the revealer shutter is still opening.
- The Flip callback is appended at the end (**~4.35 s**) — a zero-duration `.add(fn)`.
- The masked-text `.to(...)` is appended at ~4.35 with `delay: 1.25` → animates **[5.6, 8.6]**.
- The team-image `.to(...)` is appended at the new end (~8.6) with `delay: -4.75` → pulled back to **[3.85, 5.85]** (overlaps the Flip and the text rise).

Total runtime ≈ **8.6 s**.

### The Flip callback (the signature move) — full-screen images → corner thumbnail stack
Fires at ~t = 4.35. It captures the current geometry of the three `.main` images (currently full-bleed and centered), reparents/restyles them into a small bottom-left column, then Flips from the old geometry to the new:
```js
() => {
  // 1. Drop the first five images out of the DOM — only the 3 .main survive.
  document.querySelectorAll(".img:not(.main)").forEach((img) => img.remove());

  // 2. Snapshot the .main images while they're still full-screen.
  const state = Flip.getState(".main");

  // 3. Restyle the container + images into the stacked-corner layout.
  const imagesContainer = document.querySelector(".images");
  imagesContainer.classList.add("stacked-container");        // → fixed bottom-left, column-reverse, gap 1em
  document.querySelectorAll(".main").forEach((img, i) => {
    img.classList.add("stacked");                            // → position:relative, 150×100px
    img.style.order = i;
    gsap.set(".img.stacked", { clearProps: "transform,top,left" });
  });

  // 4. Animate from the snapshot to the new layout.
  return Flip.from(state, {
    duration: 2,
    ease: "hop",
    absolute: true,
    stagger: { amount: -0.3 },   // reverse-order stagger, 0.3s total spread
  });
}
```
Visual result: the three overlapping full-screen images simultaneously **shrink and fly down to the bottom-left corner**, landing as a tidy vertical stack of three `150×100` thumbnails (gap `1em`, `column-reverse` order), the reverse stagger (`amount: -0.3`) making the last one lead. `absolute: true` lets them animate freely from their overlapping full-bleed positions. Runs 2 s, independent of `mainTl` (the returned tween is standalone).

### Masked text rise (`hop2`, t = 5.6 → 8.6)
```js
.to(".word h1, .nav-item p, .line p, .site-info h2 .line span", {
  y: 0, duration: 3, ease: "hop2", stagger: 0.1, delay: 1.25,
})
```
Every masked text piece — the two logo words (`Arc`, `Worldwide©`), the four nav links, the "Featured Works" / address / socials lines, and each split heading line — slides from `translateY(100%)` (parked below, clipped by its `.word` / `.nav-item` / `.line` mask) up to `y:0`. Duration **3 s**, ease **hop2**, staggered **0.1 s** across all pieces in DOM order.

### Team image unmask (`hop`, t = 3.85 → 5.85)
```js
.to(".team-img", {
  clipPath: "polygon(0% 100%, 100% 100%, 100% 0%, 0% 0%)",
  duration: 2, ease: "hop", delay: -4.75,
})
```
The bottom-right grayscale image reveals from its collapsed bottom edge upward — its two top corners travel from `y:100%` to `y:0%`, so the frame grows up from the bottom to fill its box. Duration **2 s**, ease **hop**.

### Timeline summary (absolute seconds)
| t (s)      | what |
|-----------|------|
| 0 – 1.5   | revealer panels split apart (r-1 up, r-2 down), `hop` |
| 0.25 – 2.25 | first image de-zooms `1.5→1`, `power4.inOut` |
| ~1.3 – 4.35 | other 7 images fade in + de-zoom, ~0.3s cascade, `power3.out` |
| ~4.35 – 6.35 | Flip: 3 main images shrink/fly to bottom-left thumbnail stack, `hop`, reverse stagger |
| 3.85 – 5.85 | team image clip-path unmasks upward, `hop` |
| 5.6 – 8.6 | logo/nav/address/heading lines rise up from masks, `hop2`, stagger 0.1 |

### Ease reference
- `hop`  = `CustomEase.create("hop",  "M0,0 C0.355,0.022 0.448,0.079 0.5,0.5 0.542,0.846 0.615,1 1,1")` — revealer wipe, Flip, team-image unmask.
- `hop2` = `CustomEase.create("hop2", "M0,0 C0.078,0.617 0.114,0.716 0.255,0.828 0.373,0.922 0.561,1 1,1")` — masked text rise.
- Image deck: first image `power4.inOut`; the other seven `power3.out`.

## Assets / images
**8 editorial fashion photographs**, all rendered full-bleed (`object-fit: cover`), so exact aspect ratios are flexible since they are cover-cropped. Roles:
- **Images 1–5** — the hero deck layers that scale in and fade; they are `.remove()`d once the Flip fires, so they're only seen briefly stacking up. Image **2** reads best in **portrait** orientation. Image **3** is **also reused** (grayscale/desaturated) as the bottom-right `.team-img`.
- **Images 6–8** — the three `.main` frames that survive the Flip and become the `150×100` (≈3:2 landscape) corner thumbnails. Image **7** works well roughly **square**.

All are moody, high-fashion editorial portraits (single subject, studio or atmospheric backdrop) with a cohesive elegant, minimal look. No brand marks. If you have fewer than eight, repeat images to fill the deck; the three used in the corner stack (6–8) should be distinct so the final cluster reads as three photos.

## Behavior notes
- **Autoplay once** on `DOMContentLoaded`; no scroll, hover, or click triggers. The page does not scroll during the intro (`.container` is `overflow:hidden`, viewport-sized).
- The first five `.img` wrappers are permanently removed from the DOM once the Flip fires — do not rely on them existing afterward.
- Keep every `will-change` hint (transform on `.images`/`.img`/`.stacked`, and on the masked text pieces) — they matter for smooth transform + clip-path animation.
- The whole piece is viewport-height (`100vh`) full-screen; it is a preloader-style hero, so it is intended to sit above the fold and animate on first paint.

## Images

This component ships with 8 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/kin-landing-page/img1.jpeg
https://motionprompts.dev/c/kin-landing-page/img2.jpeg
https://motionprompts.dev/c/kin-landing-page/img3.jpeg
https://motionprompts.dev/c/kin-landing-page/img4.jpeg
https://motionprompts.dev/c/kin-landing-page/img5.jpeg
https://motionprompts.dev/c/kin-landing-page/img6.jpeg
… 2 more under https://motionprompts.dev/c/kin-landing-page/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ground`, `--plaster`, `--rose`, `--vermilion`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Here that leaves you two of nearly everything `mount()` builds: two `SplitType` passes over `.site-info h2`, each discarding the previous pass's `.line` wrapper into a new one nested inside it; two independent `mainTl` / `revealerTl` / `scaleTl` timelines pulling the same `.r-1` / `.r-2` panels and the same eight `.img` elements through the same clip-path and scale tweens at once; and, once both playheads reach the Flip callback, two competing `Flip.from` sequences fighting over the same three `.main` images — one flying them into the corner stack while the other is still mid-flight. The visible symptom is a heading whose lines never line up with their masks and a thumbnail stack that jitters or lands twice, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`, and only falls back to that guard when it isn't running inside this catalogue's own tuning harness — the `window.MP && window.MP.register` branch that lets the live editor call `mount(config)` directly with a knob-adjusted config and re-mount it later. Neither survives the move to React: the harness branch has no equivalent in a shipped component, and the readiness guard is dead weight once `useEffect` guarantees the DOM is already committed. Drop the harness branch, the guard, and the `boot` wrapper, and call `mount(Object.assign({}, DEFAULTS))` — or a `config` prop, if you want `textStagger`, `stackStagger`, `imageOverlap` and `revealDuration` to stay tunable — directly inside a `useEffect` with an empty dependency array. The function `mount()` already returns is not incidental: it's the same `destroy()` the live editor calls before re-mounting with a new config, and its shape — kill the three timelines, undo the Flip restructuring, revert the split — is close to a correct React cleanup already. What follows closes the two gaps it still leaves.

*(2) Element lookups* — `mount()` reaches into `document` for `.site-info h2`, `.r-1` / `.r-2`, `.img:first-child`, `.img:not(:first-child)`, `.img:not(.main)`, `.main`, `.images`, `.img.stacked`, `.team-img`, and the combined text selector `.word h1, .nav-item p, .line p, .site-info h2 .line span` — nine separate global lookups, each trusting this markup is the only copy on the page. Put a ref on the `.container` element this component renders as its root and resolve all of them from it instead of from `document`. This is not cosmetic here: the Flip callback first calls `Flip.getState(".main")` and only afterward re-queries `document.querySelectorAll(".main")` to add the `stacked` class — two separate lookups a beat apart. During the StrictMode remount two copies of `.container` exist for that instant, and an unscoped second lookup can restyle the incoming copy while the captured state belongs to the outgoing one, so the images that fly into the corner are not the ones the page actually keeps.

*(3) Cleanup* — Wrap the `SplitType` pass and the construction of `revealerTl`, `scaleTl` and `mainTl` in one `gsap.context` scoped to the root ref. The step that needs care is the Flip callback: `mainTl.add(() => { …; return Flip.from(state, { … }); })` doesn't run while `mount()` executes — it runs later, whenever the timeline's playhead reaches that position, roughly four seconds into the eight-and-a-half-second intro. `gsap.context` only auto-tracks animations created synchronously during the factory call, so by the time that callback fires the context has already stopped recording, and the `Flip.from` tween it returns is invisible to `ctx.revert()` unless the callback is registered through `self`, never the outer `ctx` binding:

```jsx
useEffect(() => {
  const restaurar = [];
  const ctx = gsap.context((self) => {
    // CustomEase.create("hop", …) / ("hop2", …), the SplitType pass and its
    // line -> wrapper replacement, revealerTl and scaleTl exactly as constructed above
    mainTl
      .add(revealerTl)
      .add(scaleTl, "-=1.25")
      .add(() => {
        // stash the five non-main .img in restaurar, Flip.getState(".main"),
        // add stacked-container / stacked, set order — exactly as constructed above
        return self.add(() => Flip.from(state, {
          absolute: true,
          // same easing and reverse stagger this callback already specifies above
        }));
      });
      // then the masked-text rise and the team-img unmask .to(...) calls, exactly as above
    return () => splitH2.revert();
  }, rootRef);

  return () => {
    document.querySelector(".images")?.classList.remove("stacked-container");
    document.querySelectorAll(".img.stacked").forEach((el) => {
      el.classList.remove("stacked");
      el.style.order = "";
    });
    restaurar.forEach(({ el, parent, next }) => {
      if (parent && !el.isConnected) parent.insertBefore(el, next);
    });
    restaurar.length = 0;
    ctx.revert();
  };
}, []);
```

`ctx.revert()` now takes over what `destroy()` currently does by hand with `mainTl.kill()` / `revealerTl.kill()` / `scaleTl.kill()` and the trailing `gsap.killTweensOf(tocados)` / `gsap.set(tocados, { clearProps: "all" })` pair — all of it becomes redundant once the Flip tween is tracked through `self` and everything else is built inside the context. What `ctx.revert()` cannot infer is the plain DOM surgery that same callback also does: the five `.img` elements it removed and stashed in `restaurar`, the `stacked` / `stacked-container` classes, and the inline `order` style. Keep that part of the existing `destroy()` and run it *before* `ctx.revert()`, exactly as the current code already comments — restore the DOM first, clear the inline styles second, or the reinserted images keep the scale and opacity `scaleTl` last wrote onto them and the next mount starts from the wrong geometry.

Fold `splitH2.revert()` into the same teardown by returning it from inside the context factory, as above, so `ctx.revert()` calls it once the tracked tweens are already killed. Reverting it is what makes a second `useEffect` invocation safe: this callback doesn't just split `.site-info h2` into lines — it immediately discards `SplitType`'s own `.line` element for each one via `line.parentNode.replaceChild(wrapper, line)` and inserts a custom `<div class="line"><span>` in its place. Skip the revert and the next `new SplitType(".site-info h2", { types: "lines" })` splits that replacement wrapper's rendered line boxes instead of the original sentence, nesting one `.line > span` inside another and leaving both the CSS mask and the masked-text rise pointed at the wrong nodes.

One gap the current `script.js` doesn't cover but is worth closing in the port: `.site-info h2` renders in **PP Neue Montreal**, the custom display face this component's own type stack calls for, and `SplitType` measures line boxes against whatever font is actually painted the moment it runs. If that face is still loading when the effect fires, the lines break against the fallback sans's metrics, and the per-line masks this callback builds end up sized for breaks the swapped-in font won't honor. Gate the `SplitType` call behind `document.fonts.ready`, keep the effect itself synchronous, and guard the deferred split with the same cancellation flag the cleanup sets, so a StrictMode unmount that lands before fonts resolve doesn't split a heading this component no longer owns.
