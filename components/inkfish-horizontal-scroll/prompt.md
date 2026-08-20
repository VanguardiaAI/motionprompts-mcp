# Draggable Timeline Horizontal Scroll — 500vw Editorial Track Panned by a Bottom Scrubber

## Goal
Build a **full-screen, black editorial fashion gallery** whose content lives on one enormous **500vw horizontal track** (five side-by-side full-viewport sections that alternate text and image spreads). The page itself never scrolls. Instead a **draggable "timeline" scrubber pinned to the bottom** of the screen — sitting over a ruler of thin vertical tick-marks — is dragged left/right, and that drag **pans the whole track horizontally**. The star effect: as you drag the scrubber, its position is normalized to a 0→1 progress that maps onto a **0 → −400vw** pan, and the track **eases to that target with a trailing, momentum-style `power3.out` tween** (each drag frame re-fires a 1s tween, so the track glides and lags smoothly behind your hand rather than snapping). Built with GSAP **Draggable**.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the single GSAP plugin **`Draggable`**. No ScrollTrigger, no smooth-scroll library, no canvas/WebGL. Import as:
```js
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";   // or "gsap/all"
gsap.registerPlugin(Draggable);
```

## Layout / HTML
```
nav                                  (fixed strip across the top)
  a  "Urban Eclipse"                 (fictional brand / logo)
  a  "About"
  a  "Contact"
  a  "Work"

.container                           (the 500vw horizontal track — flex row of 5 sections)
  section#section-1                  (TEXT spread: heading + paragraph)
    h1  <long editorial headline>
    p   <two editorial paragraphs, separated by <br><br>>
  section#section-2                  (IMAGE spread: 3 images)
    .img.img-1 > img                 (wide slot, flex:2)
    .img.img-2 > img                 (narrow slot, flex:1)
    .img.img-3 > img                 (narrow slot, flex:1)
  section#section-3                  (IMAGE spread: 3 images)
    .img.img-4 > img                 (narrow, flex:1)
    .img.img-5 > img                 (wide,   flex:2)
    .img.img-6 > img                 (narrow, flex:1)
  section#section-4                  (TEXT spread: heading + paragraph)
    h1
    p
  section#section-5                  (IMAGE spread: 3 images)
    .img.img-7 > img                 (narrow, flex:1)
    .img.img-8 > img                 (wide,   flex:2)
    .img.img-9 > img                 (narrow, flex:1)

.timeline                            (fixed scrubber rail across the bottom)
  .scroller > p                      (the draggable handle)  "[<span>Drag</span>]"
  (+ 50 .marker tick divs injected by JS)
```
All copy is fictional/neutral — brand **"Urban Eclipse"**, nav links **About / Contact / Work**, and long dystopian-fashion editorial paragraphs. No real brand names.

## Styling
Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`. `html, body { width:100%; height:100%; background:#000; color:#fff; }`. `img { width:100%; height:100%; object-fit:cover; }`.

**Palette:** pure black `#000` background, white `#fff` text/markers. Nothing else.

**Fonts** (the original uses two proprietary faces — name them with sane web fallbacks):
- **"Akkurat Mono"** (monospace) for the nav links and the scrubber label — any clean monospace substitute is fine. Nav links `a`: `text-decoration:none; color:#fff; text-transform:uppercase; font-size:12px;`. Scrubber `span`: `font-size:13px; padding:0 3em; text-transform:uppercase;`.
- **"PP Neue Montreal"** (a neutral neo-grotesque sans) for `h1` and `p` — substitute Inter / Neue Haas / any clean grotesque. `h1 { width:50%; font-weight:400; font-size:40px; text-transform:uppercase; }`, `p { width:40%; font-weight:400; font-size:16px; }`.

**Load-bearing structural CSS** (the JS reads pixel widths off these, so keep the geometry):
- `nav { position:fixed; top:0; width:100vw; padding:2em; display:flex; justify-content:space-between; }`.
- `.container { position:absolute; top:0; left:0; width:500vw; height:90vh; display:flex; }` — the single wide track. (**This is the element GSAP translates on `x`.**)
- `section { position:relative; width:100vw; height:100%; padding:6em 2em 0 2em; display:flex; gap:2em; overflow:hidden; }` — each section is exactly one viewport wide.
- Text sections only: `#section-1, #section-4 { display:flex; justify-content:space-between; }` (heading pinned left, paragraph pinned right).
- `.img { width:100%; height:100%; }`. Image sizing is done purely by flex within the section row: `.img-1, .img-5, .img-8 { flex:2; }` (the wide slot) and `.img-2,.img-3,.img-4,.img-6,.img-7,.img-9 { flex:1; }` (narrow slots). So each image section is a `wide | narrow | narrow` or `narrow | wide | narrow` composition, all `90vh` tall, hard-cropped with `object-fit:cover`.
- `.timeline { position:fixed; bottom:0; left:0; width:100vw; height:10vh; padding:2.25em 1em; display:flex; justify-content:space-around; }` — the bottom rail; `justify-content:space-around` evenly distributes the 50 tick markers across the full width.
- `.marker { width:1px; height:100%; background:#fff; }` — a thin vertical ruler tick (50 of them, injected by JS).
- `.scroller { position:absolute; top:50%; left:0; transform:translate(0%, -50%); background:#000; cursor:pointer; text-transform:uppercase; line-height:120%; }` — the draggable handle; a small black `[ Drag ]` pill floating over the ruler, vertically centered in the 10vh rail. `font-family` mono.

## GSAP effect (exhaustive — this is the whole component)

Everything runs once inside `window.onload` (so all fonts/layout are final and `offsetWidth` reads are correct).

### 1. Measure the rail
```js
const timeline   = document.querySelector(".timeline");
const scroller   = document.querySelector(".scroller");
const container  = document.querySelector(".container");
const timelineWidth = timeline.offsetWidth;                                  // ≈ viewport width (100vw)
const scrollerWidth = scroller.offsetWidth;                                  // width of the [Drag] pill
const gap = parseInt(window.getComputedStyle(document.body).fontSize);       // root font-size in px (≈16)

const maxDragX = timelineWidth - scrollerWidth - 2 * gap;                    // usable travel of the handle
```
`gap` (= the computed body font-size, ~16px) is reused as the left/right inset of the handle's travel.

### 2. Inject the 50 ruler ticks
Before creating the Draggable, append **50** `.marker` divs into `.timeline`:
```js
for (let i = 0; i < 50; i++) {
  const marker = document.createElement("div");
  marker.classList.add("marker");
  timeline.appendChild(marker);
}
```
They become flex children spread by `justify-content:space-around`, forming the tick ruler behind/around the scrubber.

### 3. The Draggable scrubber → track pan
```js
Draggable.create(scroller, {
  type: "x",
  bounds: {
    minX: gap,
    maxX: timelineWidth - scrollerWidth - gap,
  },
  onDrag: function () {
    let progress   = (this.x - gap) / maxDragX;                 // normalize handle x → 0..1
    let containerX = -400 * (timelineWidth / 100) * progress;   // 0..1 → 0 .. -400vw
    gsap.to(container, {
      x: containerX,
      duration: 1,
      ease: "power3.out",
    });
  },
});
```

Precise behavior:
- **`type: "x"`** — the handle only slides horizontally.
- **`bounds`** clamp the handle between `minX = gap` and `maxX = timelineWidth − scrollerWidth − gap`, i.e. it can never leave the ruler (a one-`gap` inset on each side). The width of that travel equals `maxDragX`.
- **`onDrag`** fires every frame the handle moves. `this.x` is the handle's live x-offset in px. `progress = (this.x − gap) / maxDragX` converts it to a **0→1** ratio across the rail.
- The pan target is `containerX = −400 · (timelineWidth/100) · progress`. Since `timelineWidth/100` is one `vw` in px, this is exactly **−400vw · progress** → at `progress = 0` the track sits at `x = 0` (section 1 visible), at `progress = 1` the track is at **−400vw**, revealing the 5th (last) 100vw section. The 500vw track minus the 100vw viewport = 400vw of travel — the mapping consumes it exactly.
- **The momentum/trailing feel**: each `onDrag` re-issues `gsap.to(container, { x: containerX, duration: 1, ease: "power3.out" })`. GSAP overwrites the in-flight tween on every frame, so the track is continuously chasing a moving 1-second `power3.out` target. The result is a soft, inertial lag — the track glides toward and eases to a stop behind the handle instead of tracking it rigidly, and keeps easing for up to ~1s after you release.

No ScrollTrigger, no scrub, no pin, no timeline sequencing, no other tweens.

## Assets / images
**9 images**, a cohesive **moody editorial fashion series** on a black page, each filling its flex slot at **90vh tall** with `object-fit:cover` (so source aspect is forgiving; the wide `flex:2` slots read landscape-ish, the narrow `flex:1` slots read portrait-ish). Mix warm golden-hour outdoor fashion, high-contrast black-and-white studio portraits, motion shots, and clean product still-lifes of leather accessories — all dark, elegant, dystopian-editorial. By role:
1. **img-1** (section 2, wide `flex:2`): warm golden-hour outdoor fashion shot, figures seen from behind in earth-tone outerwear in a dry grassy field.
2. **img-2** (section 2, narrow `flex:1`): clean product still-life — a hand holding a tan leather zip pouch against a plain off-white backdrop.
3. **img-3** (section 2, narrow `flex:1`): moody black-and-white studio torso in an oversized tailored blazer, diagonal shafts of light.
4. **img-4** (section 3, narrow `flex:1`): product still-life — a hand carrying a tan leather flat clutch/sleeve against a light crumpled-paper backdrop.
5. **img-5** (section 3, wide `flex:2`): editorial portrait lit by a hard shaft of light inside a derelict concrete interior, layered casualwear.
6. **img-6** (section 3, narrow `flex:1`): black-and-white low-angle portrait, sunglasses, wind blowing hair against a bright sky.
7. **img-7** (section 5, narrow `flex:1`): product still-life — a figure carrying a tan leather shoulder/hobo bag against a warm beige backdrop.
8. **img-8** (section 5, wide `flex:2`): golden-hour outdoor portrait from behind, earth-tone wool coat, weathered fence in a dry field.
9. **img-9** (section 5, narrow `flex:1`): black-and-white motion shot — a figure twirling in a flowing dark dress and platform boots.

## Behavior notes
- The **page never scrolls** — `.container` is `position:absolute` and moved only by GSAP; the sole interaction is dragging the bottom scrubber. Nav and timeline are `position:fixed` over the stage.
- **No autoplay / no loop** — the track is at rest (`x:0`, section 1) on load and only moves while (and shortly after) the handle is dragged.
- The mapping is anchored to `timelineWidth` (read on load), so it is correct at the initial viewport size; there is no `resize` re-measure — a mid-session resize would leave the pan ratio slightly off (matches the original, which sets everything once in `window.onload`).
- Desktop-oriented drag interaction; Draggable also handles touch, so a finger-drag on the pill works on touch devices.
- Reduced-motion: nothing animates on its own, so it's already calm; the only motion is user-initiated dragging.

## Images

This component ships with 9 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/inkfish-horizontal-scroll/img-1.jpg
https://motionprompts.dev/c/inkfish-horizontal-scroll/img-2.jpg
https://motionprompts.dev/c/inkfish-horizontal-scroll/img-3.jpg
https://motionprompts.dev/c/inkfish-horizontal-scroll/img-4.jpg
https://motionprompts.dev/c/inkfish-horizontal-scroll/img-5.jpg
https://motionprompts.dev/c/inkfish-horizontal-scroll/img-6.jpg
… 3 more under https://motionprompts.dev/c/inkfish-horizontal-scroll/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--mist`, `--steel`, `--hairline`, `--mono`, `--grot`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that waits for the window `load` event, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component is more exposed to that than most, because its setup is half plain DOM insertion: the marker loop appends 50 `.marker` divs into `.timeline` with a bare `appendChild`, unconditionally, every time the effect body runs. Setup that runs twice with teardown that runs never leaves you two triggers disagreeing over a scrub — it leaves you a ruler with **100** ticks where the layout expects 50, plus two `Draggable` instances bound to the same `.scroller` handle, each wiring its own `onDrag` and independently retargeting the same `container` `x` tween on every pointer move. Nothing throws; the ruler just gets visibly denser and the drag starts to feel like it's fighting itself, and none of it reproduces in a production build, because React only double-invokes effects in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `window.onload`, trusting that images and fonts have settled before it trusts the pixel widths it's about to read. `useEffect` fires far earlier than that, at commit. Of the three measurements this component takes, two don't actually need the wait: `timelineWidth` comes from `.timeline`'s own `100vw` in CSS, and `gap` comes from the body's numeric font-size — neither shifts once the stylesheet applies. `scrollerWidth` is the one that does: it's `offsetWidth` of the `[ Drag ]` pill, and that number is however wide "Akkurat Mono" (or its fallback) renders that text plus the `em`-based padding around it. Since `scrollerWidth` feeds both `maxDragX` and the `Draggable`'s own `bounds.maxX`, measuring it before that font is active means the handle's whole travel range — not just one frame of it — is wrong for the rest of the session. Replace the `window.onload` wait with `document.fonts.ready`, and make it cancellable; see (3) for the shape, since the same construct that survives a pre-resolution unmount also has to end up owning the `Draggable` this wait unblocks.

*(2) Element lookups* — `.timeline`, `.scroller` and `.container` are three separate `document.querySelector` calls that assume this page owns the document. Scope all three to a root `ref`. This matters past the usual reason here: `timelineWidth` and `scrollerWidth` are read once and closed over by both `maxDragX` and the `Draggable`'s `bounds` for the life of the mount, so an unscoped lookup that resolves against the StrictMode copy on its way out — the two briefly coexist mid-remount — leaves every drag for the rest of the session panning against widths measured off a node that no longer exists.

*(3) Cleanup — GSAP* — `Draggable.create(scroller, { ... })` is a GSAP object, so wrapping it in a `gsap.context` scoped to the root ref and reverting that context in the cleanup is enough to kill the handle's drag behavior on its own — no need to keep the array `Draggable.create` returns and call `.kill()` on it by hand. But the tween that actually pans the track is not created inside that synchronous call: the `gsap.to(container, { ... })` lives inside `onDrag`, which `Draggable` invokes later, once per pointer move, well outside the window a context factory auto-tracks. Left alone, a drag in progress when the route changes leaves that tween still easing `container`'s `x` toward its last target on a node nothing is managing anymore. Register `onDrag`'s body as a named context method instead of writing the `gsap.to` call straight inside the callback, and keep the callback itself a plain `function` rather than an arrow, so `this.x` still resolves to the live `Draggable` instance:

```jsx
self.add("pan", (dragX) => {
  const progress = (dragX - gap) / maxDragX;
  gsap.to(container, {
    x: -400 * (timelineWidth / 100) * progress,
    // same duration and ease the vanilla tween above already specifies
  });
});

Draggable.create(scroller, {
  type: "x",
  bounds: { minX: gap, maxX: timelineWidth - scrollerWidth - gap },
  onDrag: function () {
    self.pan(this.x);
  },
});
```

That block needs a `self`, and the only place to get one for code that runs after fonts resolve is to defer it the same way (1) already requires: build the context empty up front so it exists for the cleanup no matter what, and register this whole block onto it with `ctx.add((self) => { ... })` once `document.fonts.ready` settles — that call is exactly where the `self` above comes from:

```jsx
useEffect(() => {
  let cancelled = false;
  const markers = [];
  const ctx = gsap.context(() => {}, rootRef);

  document.fonts.ready.then(() => {
    if (cancelled) return;
    // measure timelineWidth / scrollerWidth / gap / maxDragX off rootRef.current,
    // append the 50 .marker divs (pushing each into `markers`), then register
    // the self.add("pan", ...) and Draggable.create block above
  });

  return () => {
    cancelled = true;
    markers.forEach((marker) => marker.remove());
    ctx.revert();
  };
}, []);
```

The last piece is the one `ctx.revert()` was never going to reach: the 50 `.marker` divs are plain nodes appended with `appendChild`, not GSAP output, so the context has no record of them no matter where in the effect they get created. Push each one into `markers` as you create it and remove them by hand in the same cleanup — skip this and every remount leaves 50 more sitting in `.timeline` behind the ones already there, which is exactly the "100 ticks" failure the top of this section describes.
