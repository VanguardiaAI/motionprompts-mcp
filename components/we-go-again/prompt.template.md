---
slug: we-go-again
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 21
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: stagger, literal: "0.05", rule: value/narrated }
  - { kind: ease, literal: "\"power2.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power4.in\"", rule: value/narrated }
  - { kind: ease, literal: "\"power4.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# We Go Again — Click-to-Swap Project Showcase

## Goal
Build a full-viewport, three-column creative-agency showcase. The right column is a slim, internally-scrollable **vertical thumbnail gallery**; the wide middle column shows the currently featured project (big title, a paragraph of copy split into lines, credits, a large featured image); the left column holds the site nav + agency intro. Behind everything sits a **full-screen, heavily-blurred version of the featured image** as an ambient color wash. The star effect: **clicking any thumbnail runs a two-phase GSAP transition** — the current title/copy/credits lines slide **up and out** (staggered, accelerating) while the featured image **shrinks, rises and zooms**; then the details are rebuilt for the new project and the new text **rises in from below** while the new image **grows up from below and zooms back to normal** — and the blurred background **crossfades** between the two images the whole time.

## Tech
Vanilla HTML/CSS/JS with ES module imports, bundled by Vite. No framework.
- `gsap` (npm) — all motion. **No GSAP plugins, no ScrollTrigger.**
- `split-type` (npm, `SplitType`) — splits the copy paragraph into lines so each line can be masked/animated.

Import them as:
```js
import gsap from "gsap";
import SplitType from "split-type";
```

There is **no smooth-scroll library** and **no ScrollTrigger** — the only scroll is native `overflow: auto` inside the gallery column.

## Data model
All project content lives in a separate `data.js` that exports an array of ~**15** objects, one per gallery item:
```js
export const galleryItems = [
  { title: "Beyond The Summit",
    copy: "One or two sentences of editorial description...",
    director: "Alex Honnold",
    cinematographer: "Jimmy Chin" },
  // ...14 more with the same four fields
];
```
Fields: `title` (string), `copy` (a 2–3 sentence paragraph), `director` (name), `cinematographer` (name). Content is neutral placeholder film/documentary metadata — invent 15 varied entries. The number of gallery thumbnails is driven by `galleryItems.length`.

## Layout / HTML
```html
<div class="container">
  <!-- full-screen blurred backdrop -->
  <div class="blurry-prev">
    <img src="<image 1>" alt="" />
    <div class="overlay"></div>
  </div>

  <!-- LEFT column: nav + agency intro -->
  <div class="col site-info">
    <nav>
      <a href="#">Home</a>
      <a href="#">Work</a>
      <a href="#">Contact</a>
    </nav>
    <div class="header"><h1>Welcome to Studio</h1></div>
    <div class="copy">
      <p>We are a full-service creative agency delivering innovative
         design solutions for businesses around the globe.</p>
    </div>
  </div>

  <!-- MIDDLE column: featured project (item 0 at load) -->
  <div class="col project-preview">
    <div class="project-details">
      <div class="title"><h1>Beyond The Summit</h1></div>
      <div class="info"><p>...item 0 copy paragraph...</p></div>
      <div class="credits"><p>Credits</p></div>
      <div class="director"><p>Director: Alex Honnold</p></div>
      <div class="cinematographer"><p>Cinematographer: Jimmy Chin</p></div>
    </div>
    <div class="project-img"><img src="<image 1>" alt="" /></div>
  </div>

  <!-- RIGHT column: gallery (thumbnails injected by JS) -->
  <div class="gallery-wrapper">
    <div class="gallery"></div>
  </div>
</div>
<script type="module" src="./script.js"></script>
```
The middle column's `.project-details` and `.project-img` for **item 0** are hardcoded in HTML; every subsequent project is destroyed and rebuilt in JS. The gallery thumbnails are all created by JS.

"Welcome to Studio" and the agency blurb are neutral placeholders — no real brand marks.

## Styling

**Globals**
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `html, body { width:100vw; height:100vh; background:#0f0f0f; font-family:"PP Neue Montreal", sans-serif; }` (use any clean neutral sans as fallback).
- `img { width:100%; height:100%; object-fit:cover; }`
- `h1 { color:#fff; font-size:36px; font-weight:500; }`
- `a, p { color:#fff; font-size:16px; font-weight:500; text-decoration:none; }`

**Container** — `position:relative; width:100%; height:100%; display:flex; overflow:hidden;` (the three columns are flex children; `overflow:hidden` clips the transitions).

**Blurred backdrop** — `.blurry-prev { position:absolute; inset:0; width:100%; height:100%; }` holds one or more `<img>` plus `.overlay { position:absolute; inset:0; backdrop-filter:blur(80px); }`. The overlay blurs the image(s) behind it into a soft ambient wash over the whole screen. (It sits at the bottom of the stacking order; the three columns render on top.)

**Left column** — `.col { position:relative; padding:1em; }`. `.site-info { flex:1; display:flex; flex-direction:column; justify-content:space-between; border-right:1px solid rgba(255,255,255,0.1); }`. `nav { display:flex; gap:1em; }`. `.header { position:absolute; top:50%; transform:translateY(-50%); }` (vertically centers the H1).

**Middle column** — `.project-preview { flex:2; }`.
- `.project-details { position:absolute; top:1em; left:1em; width:50%; }`
- `.title { margin-bottom:0.5em; }`  `.info { margin-bottom:1em; }`
- **Masks (essential):** `.title, .credits, .director, .cinematographer, .line { clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }` — a full-box clip that acts as an overflow mask so text sliding vertically inside each block is clipped at the block's edges.
- **Initial hidden offsets (CSS):** `.title h1 { position:relative; transform:translateY(40px); will-change:transform; }` and `.info p .line span, .credits p, .director p, .cinematographer p { display:inline-block; position:relative; transform:translateY(20px); will-change:transform; }`. These push the text below its mask; JS snaps them into view at load (see effect).
- `.project-img { position:absolute; left:1em; bottom:1em; width:75%; height:50%; overflow:hidden; will-change:transform; }` with `.project-img img { will-change:transform; }`. The large featured image; `overflow:hidden` clips its inner img zoom.

**Right column (frosted gallery panel)**
- `.gallery-wrapper { z-index:2; overflow:auto; padding:0.75em; background:rgba(255,255,255,0.1); border-left:1px solid rgba(255,255,255,0.1); backdrop-filter:blur(20px); }` — a frosted, scrollable strip.
- `.gallery { width:100px; height:300vh; display:flex; flex-direction:column; gap:0.75em; }` — a **tall** stack (3× viewport) so the thumbnails scroll internally.
- `.item { position:relative; flex:1; background:#aeaeae; }` — each thumbnail is a tall sliver, its image `object-fit:cover`.
- **Thumbnail dim/undim overlay:** `.item::after { content:""; position:absolute; inset:0; background:rgba(0,0,0,0.65); transition:background-color 0.5s ease-in-out; transition-delay:0.5s; }` and `.item.active::after { background:rgba(0,0,0,0); }`. So every thumbnail is darkened except the active one, which brightens via a 0.5s CSS transition that waits 0.5s before starting.

**Responsive** — `@media (max-width:900px)`: `.container` becomes `flex-direction:column`; `.site-info { flex:0.5; border-right:none; border-bottom:1px solid rgba(255,255,255,0.1); }`; `.header { top:unset; bottom:1em; transform:none; }`; `.site-info .copy { display:none; }`; `.project-details { width:calc(100% - 1em); }`; `.project-img { width:93%; }`; `.gallery-wrapper` uses `border-top` instead of left; `.gallery { width:300vw; height:100px; flex-direction:row; }` (horizontal thumbnail strip).

## The GSAP effect (be exhaustive)

### SplitText helper
`createSplitText(element)`:
1. `const split = new SplitType(element, { types: "lines" });`
2. Clear `element.innerHTML = ""`.
3. For **each** `split.lines`: build `<div class="line"><span>lineText</span></div>` (line text = the split line's `textContent`) and append to `element`. So every visual line becomes a `.line` mask wrapping a `<span>` — the span is what animates, the `.line` clip-path masks it.

### On load (init, inside `DOMContentLoaded`)
1. `createSplitText(document.querySelector(".info p"))` — split item 0's copy into masked lines.
2. Select the animatable set `elementsToAnimate = ".title h1, .info p .line span, .credits p, .director p, .cinematographer p"` and **`gsap.set(elementsToAnimate, { y: 0 })`** — this cancels the CSS `translateY(40px/20px)` offsets, snapping item 0's text into its visible resting position (item 0 has **no** entrance animation; it just appears).
3. Build the gallery: loop `i` from `0` to `galleryItems.length-1`, create `.item` (add class `active` only when `i === 0`), append an `<img src="/c/we-go-again/img${i+1}.jpg">`, set `dataset.index = i`, attach a `click` listener → `handleItemClick(i)`, append to `.gallery`.

State variables: `activeItemIndex = 0`, `isAnimating = false`.

### On thumbnail click — `handleItemClick(index)`
Guard: `if (index === activeItemIndex || isAnimating) return;` then `isAnimating = true`.

**(A) Swap active class** — remove `active` from `gallery.children[activeItemIndex]`, add `active` to `gallery.children[index]`, set `activeItemIndex = index`. (Fires the CSS `::after` un-dim/dim: the new thumbnail brightens, the old darkens, each over 0.5s after a 0.5s delay.)

**(B) Blurred background crossfade** (`ease: "power2.inOut"`, `duration: 1`, both delayed `0.5`):
- Create a new `<img src="/c/we-go-again/img${index+1}.jpg">`, `gsap.set(newImg, { opacity:0, position:"absolute", top:0, left:0, width:"100%", height:"100%", objectFit:"cover" })`, and **insert it as the first child** of `.blurry-prev` (`insertBefore(newImg, blurryPrev.firstChild)`).
- Grab the previous backdrop image (now `.blurry-prev img:nth-child(2)`); `gsap.to(prevImg, { opacity:0, duration:1, delay:0.5, ease:"power2.inOut", onComplete: () => remove it })`.
- `gsap.to(newImg, { opacity:1, duration:1, delay:0.5, ease:"power2.inOut" })`.

**(C) Phase 1 — animate the CURRENT project OUT** (starts immediately, `duration:1`):
- **Text out:** `gsap.to(elementsToAnimate, { y:-60, duration:1, ease:"power4.in", stagger:0.05 })` — every current title h1 / info line span / credits / director / cinematographer slides **up** to `y:-60`, accelerating (`power4.in`), cascading with a 0.05s stagger; the clip-path masks swallow them.
- **Featured image out:** `gsap.to(currentProjectImg /* the .project-img wrapper */, { scale:0, bottom:"10em", duration:1, ease:"power4.in", onStart, onComplete })`:
  - `onStart` → simultaneously `gsap.to(currentProjectImg's inner <img>, { scale:2, duration:1, ease:"power4.in" })`. So the wrapper collapses `scale 1→0` and lifts `bottom 1em→10em` while the inner image **zooms in** `scale 1→2` (a push-in as the frame shrinks away upward).
  - `onComplete` → **Phase 2** (below).

**(D) Phase 2 — rebuild + animate the NEW project IN** (runs in Phase-1's `onComplete`, ~1s after click):
1. Remove the old `.project-details` and old `.project-img` from the DOM.
2. Build a fresh `.project-details` with the new item's data — same structure: `.title h1`, `.info p` (raw paragraph, not yet split), `.credits p` = "Credits", `.director p` = `Director: <name>`, `.cinematographer p` = `Cinematographer: <name>`. Build a fresh `.project-img` with `<img src="/c/we-go-again/img${index+1}.jpg">`. Append both to `.project-preview`.
3. `createSplitText(newInfoP)` — split the new copy into masked `.line > span`.
4. Select the new set (`.title h1, .info p .line span, .credits p, .director p, .cinematographer p` within the new details) and:
   - **Text in:** `gsap.fromTo(newTextEls, { y:40 }, { y:0, duration:1, ease:"power4.out", stagger:0.05 })` — all rise from `y:40` up to `y:0`, decelerating (`power4.out`), staggered 0.05s. (Note: every element animates from `y:40`, overriding the CSS 20px/40px offsets.)
   - **Featured wrapper in:** `gsap.fromTo(newProjectImg, { scale:0, bottom:"-10em" }, { scale:1, bottom:"1em", duration:1, ease:"power4.out" })` — grows `scale 0→1` and rises `bottom -10em→1em` (comes up from below the frame).
   - **Featured inner img in:** `gsap.fromTo(newProjectImg's <img>, { scale:2 }, { scale:1, duration:1, ease:"power4.out", onComplete: () => isAnimating = false })` — the inner image zooms back out `scale 2→1` to settle. Its `onComplete` releases the `isAnimating` lock.

**Timing summary:** total ≈ **2s** — Phase 1 (out) 1s + Phase 2 (in) 1s; the backdrop crossfade overlaps both (0.5s delay + 1s). OUT eases are `power4.in` (accelerate away, upward); IN eases are `power4.out` (decelerate in, from below); backdrop is `power2.inOut`. Stagger is `0.05` on both text sets. No timeline object is used — these are parallel `gsap.to`/`gsap.fromTo` tweens coordinated by the wrapper tween's `onStart`/`onComplete` callbacks.

## Assets / images
**15 images** named `img1.jpg … img15.jpg`, served from `/c/we-go-again/`. Each image plays three roles at once: (1) a **tall vertical thumbnail** in the ~100px-wide gallery (cover-cropped to a slim strip), (2) the **large featured image** (a 75%×50% landscape-ish framed box) when its item is active, and (3) the **full-screen blurred ambient background** when active.

Visually it's a curated **high-end editorial / commercial** mix — roughly half **fashion & beauty portraits** (studio-lit models against warm brown, grey or orange seamless backdrops, ~2:3 vertical) and half **product / design still-lifes** (matte cosmetic pump bottles, beverage cans, capsule containers, an amber dropper serum bottle on beige podiums under dramatic spotlights, plus a colorful mechanical keyboard, a curved metallic building, and a warm sunlit interior). Framing is mixed (portrait to square); `object-fit:cover` handles all crops. Because they are heavily blurred as backgrounds and sliver-cropped as thumbnails, **any centered, moody editorial/commercial photo set works** — keep subjects roughly centered. **No brand names or logos** on any product.

## Behavior notes
- **Interaction is click-only** on gallery thumbnails; no hover, no scroll-trigger, no autoplay. Item 0 is active at load with no entrance animation.
- The `isAnimating` lock blocks re-clicks mid-transition; clicking the already-active item is a no-op.
- The gallery column scrolls **internally** (native `overflow:auto`; the `.gallery` is 300vh / 300vw tall) to reach all 15 thumbnails.
- Responsive at `900px`: layout stacks vertically and the gallery becomes a horizontal strip; otherwise the effect is identical.
- No reduced-motion handling in the original. Fully client-side, light performance cost (no WebGL/canvas).

## Images

This component ships with 8 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/we-go-again/img1.jpg
https://motionprompts.dev/c/we-go-again/img2.jpg
https://motionprompts.dev/c/we-go-again/img3.jpg
https://motionprompts.dev/c/we-go-again/img4.jpg
https://motionprompts.dev/c/we-go-again/img5.jpg
https://motionprompts.dev/c/we-go-again/img6.jpg
… 2 more under https://motionprompts.dev/c/we-go-again/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--ink`, `--ink-dim`, `--ink-faint`, `--accent`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and here the failure is easy to miss, because the two-phase click transition still looks right the first time anyone fires it — it only misbehaves on the click after that, or after a remount nobody watches fail.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Nothing here undoes what the first pass builds, so the second pass appends its own fifteen `.item` thumbnails after the first pass's fifteen — thirty children in `.gallery` — each batch closed over its own `activeItemIndex` and `isAnimating`, each batch's `handleItemClick` trusting that `gallery.children[i]` is the node index `i` was assigned to. It no longer is: click a thumbnail from the second batch and its handler flips the `active` class on a node that belongs to the first batch instead of the one actually clicked, and because the two batches' `isAnimating` flags are independent, nothing stops both from running the two-phase transition at once. The same remount hands `createSplitText` the item-0 paragraph a second time — except by then it no longer holds the plain sentence this helper expects, it holds the first pass's `.line`/`<span>` structure standing in for it. None of this reproduces in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no `readyState` guard. By the time a React component mounts, that event has already fired, so the listener is never called and nothing here runs — no gallery, no featured project, nothing to debug. Delete the listener and move its entire body — the gallery-building loop, and the eventual `createSplitText`/`gsap.set` pair over the `elementsToAnimate` selection (`.title h1, .info p .line span, .credits p, .director p, .cinematographer p`) for item 0 — into a `useEffect` with an empty dependency array. `activeItemIndex` and `isAnimating` should stay exactly what they already are, plain `let` bindings local to the effect, not `useState`: neither is read by JSX, both only ever gate a synchronous click handler, and promoting either to state would re-render the tree on every click for no benefit.

*(2) Element lookups* — `gallery`, `blurryPrev` and `projectPreview` are three separate `document.querySelector` calls made once at setup; `document.querySelector(".project-img")` and `document.querySelector(".project-details")` inside `handleItemClick`, plus the `elementsToAnimate` NodeList it rebuilds on every call, repeat the same assumption on every click. Give the component's outermost element — the one this markup calls `.container` — a root `ref`, and resolve all five from it instead of from `document`. This isn't cosmetic here: `gallery.children[activeItemIndex]` is positional, not id-based, so anything that changes how many children `.gallery` actually has — including an unscoped lookup binding to a copy of this subtree that's on its way out during the StrictMode remount — desyncs the index `handleItemClick` trusts from the node it's actually supposed to point at.

*(3) Cleanup* — this component builds its animations from exactly one place, `handleItemClick`, but it builds them **later** than the click that triggers it: the exit tween's own `onStart` schedules a second tween, and its `onComplete` — firing roughly a second after the click — is where the entire incoming project gets rebuilt and animated. Both are the deferred-registration case `self.add` exists for, and this component needs it twice over, not once.

Wrap the gallery-building loop and the click handler in a `gsap.context` scoped to the root ref, and register `handleItemClick` as a named method so the thumbnails' listeners can call `ctx.handleItemClick(i)` instead of a free-standing function:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const infoText = root.querySelector(".info p")?.textContent ?? "";
  let cancelled = false;
  let self;

  const ctx = gsap.context((s) => {
    self = s;
    // the gallery-building loop, exactly as above, then:
    self.add("handleItemClick", (index) => {
      // the activeItemIndex/isAnimating guard, the active-class swap, the
      // blurry-backdrop crossfade and the exit tween on elementsToAnimate,
      // exactly as constructed above
      gsap.to(currentProjectImg, {
        onStart: () => self.add(() => {
          // the inner scale-up tween on currentProjectImgElem
        }),
        onComplete: () => self.add(() => {
          // remove the old project-details/project-img, build the new ones,
          // createSplitText(newInfoP), and the three entrance tweens,
          // exactly as constructed above
        }),
        // same scale, bottom, duration and ease this tween already specifies above
      });
    });
  }, root);

  root.querySelectorAll(".gallery .item").forEach((item, i) =>
    item.addEventListener("click", () => ctx.handleItemClick(i))
  );

  document.fonts.ready.then(() => {
    if (cancelled) return;
    self.add(() => {
      createSplitText(root.querySelector(".info p"));
      gsap.set(
        root.querySelectorAll(
          ".title h1, .info p .line span, .credits p, .director p, .cinematographer p"
        ),
        { y: 0 }
      );
    });
  });

  return () => {
    cancelled = true;
    const infoP = root.querySelector(".info p");
    if (infoP) infoP.textContent = infoText;
    ctx.revert();
    root.querySelector(".gallery")?.replaceChildren();
  };
}, []);
```

`self.add("handleItemClick", …)` makes everything `handleItemClick` builds **synchronously** when it's called — the blurry-backdrop crossfade, the exit tween on `elementsToAnimate` — tracked automatically. It doesn't reach the two things that fire later, off GSAP's own ticker rather than off the call to `ctx.handleItemClick`: the inner scale-up tween `onStart` builds, and the entire rebuilt-project entrance — `createProjectDetails`, `createSplitText`, the three `fromTo` tweens — that `onComplete` builds a second or so afterward. Wrap each of those in its own single-argument `self.add(() => { … })`, which runs the callback immediately, inside the context, the moment GSAP actually calls it. Skip that and `ctx.revert()` on unmount only ever reaches the first half of a transition; a click made just before navigating away can leave the incoming project's entrance tweens running against a `.project-preview` React has already torn down.

*Splitting `.info p`, and why only one of its two call sites is at risk.* `createSplitText` runs twice over this component's life: once at setup, against the item-0 paragraph that ships as static markup in this component's own JSX, and once per click, against a `<p>` `createProjectDetails` has just created and never split before. The second call site can't double-split anything — the node is new every time. The first can: `createSplitText` doesn't keep the `SplitType` instance it builds, or call `.revert()` on it — it reads `.lines`, discards the instance, then rebuilds the paragraph by hand from `line.textContent`. There's no instance left to revert, so what has to be undone instead is the text itself: capture `.info p`'s original `textContent` before the first split (`infoText`, above) and write it back in the cleanup, so a StrictMode remount hands the second `createSplitText` call the sentence, not the first call's `.line`/`<span>` output standing in for it. This matters only for the double-invoke: once a real click has swapped in a different project, whatever `.info p` exists at unmount belongs to a `createProjectDetails` call the unmounting subtree already owns outright, with no original text worth restoring.

Line-based splitting also measures against whichever face is actually painted, and `.info p` renders in this component's own display sans — gate the setup split behind `document.fonts.ready`, guarded by the same `cancelled` flag the cleanup sets, so a `.then()` that resolves after a StrictMode unmount doesn't split a paragraph this component no longer owns. The per-click split needs no such gate: by the time anyone can click a thumbnail, the font has been resolved for as long as the component has existed.

`root.querySelector(".gallery")?.replaceChildren()` is what makes the thumbnail count idempotent: it removes every `.item` the previous run appended, listeners included — a node's listeners go with it once it's detached, there's nothing left to unbind by hand. Skip it and the StrictMode remount's fresh fifteen land on top of a `.gallery` that already has fifteen, which is exactly the doubled-batch failure described above.
