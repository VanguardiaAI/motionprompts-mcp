---
slug: metalab-lp-rebuild
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 1
structural_literals: 11
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "0.75", rule: value/narrated }
  - { kind: duration, literal: "0.1", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Thetalab — Hover Preview Landing

## Goal
Build a dark, full-screen studio/portfolio landing page. The left third of the screen holds a vertical list of 10 project names (pill chips). **Hovering a name crossfades a full-bleed background photo AND reveals a floating "preview card"** for that project — a portrait image that wipes open via an animated `clip-path`, plus a large title, a tags line, and a short description that each slide into place from different directions. Each project uses one of 3 rotating layout **variants** that place the card pieces in different corners and make the image wipe open from a different edge. Moving off the list crossfades everything back to a default muted background.

## Tech
Vanilla HTML/CSS/JS with ES module imports, bundled by Vite. Use **`gsap`** (npm) only — no GSAP plugins are needed (the `clip-path` polygon is tweened by GSAP's built-in CSSPlugin because both keyframes share the same 4-point count). No smooth-scroll / Lenis (the page never scrolls). No canvas, no WebGL.

```
import gsap from "gsap";
```

## Layout / HTML
Everything lives inside one fixed, `overflow: hidden`, 100vw×100vh black container. Static markup:

- `.container` (fixed, `background-image: var(--sky)`, overflow hidden)
  - `nav` — three equal flex columns (`nav > div { flex:1 }`):
    - `.menu-btn` → `<p>Menu</p>` (a frosted pill, left aligned)
    - `.logo` → `<a href="#">Thetalab</a>` (centered)
    - `.local-time` → `<p>ON 11:34AM</p>` (right aligned)
  - `footer` — two items, space-between: `<p>Watch Showreel</p>` and `<p>Collection 2024</p>`
  - `.items` — the left-third project list, containing 10 `.item` blocks, each `<div class="item"><p>NAME</p></div>` with names, in order:
    `Casting`, `Hinterland`, `Material studies`, `Nightshade`, `Table service`, `Vertical city`,
    `Heirlooms`, `Panthera`, `Form`, `Iris`
  - `.preview-bg` — the background image layer; starts with a single `<img>` pointing at the default background.

The **preview cards are built in JS** (not in the static HTML) from a data array, and appended into `.container`. Each generated card is:

```html
<div class="preview variant-N preview-{i}">
  <div class="preview-img"><img src="{thumb}" alt=""/></div>
  <div class="preview-title"><h1>{title}</h1></div>
  <div class="preview-tags"><p>{tags}</p></div>
  <div class="preview-description"><p>{description}</p></div>
</div>
```

Card data (index → title / tags / description / variant / images). Variants cycle 1,2,3,1,2,3,1,2,3:

| # | title | tags | description | variant |
|---|-------|------|-------------|---------|
| 1 | Casting | On set · Black &amp; white | Production stills from casting week: one chair, one light, a grey infinity wall. | variant-1 |
| 2 | Hinterland | Landscape · 35mm film | Dry hills and lone oaks between Volterra and the coast, shot in the last week of August. | variant-2 |
| 3 | Material studies | Still life · Glass &amp; stone | Marble, water and refracted light, photographed for a stone supplier's annual catalogue. | variant-3 |
| 4 | Nightshade | Still life · Velvet | Garden tools on crushed velvet — a hardware commission treated like jewellery. | variant-1 |
| 5 | Table service | Food · Ceramics | Stoneware and beechwood for the opening menu of a twelve-seat restaurant in Lyon. | variant-2 |
| 6 | Vertical city | Architecture · Commission | Glass towers against a noon sky, documented over two summers for a Lisbon developer. | variant-3 |
| 7 | Heirlooms | Jewellery · Editorial | Silver rings shot close and quiet for an antique dealer's first campaign. | variant-1 |
| 8 | Panthera | Portrait · Studio | A black panther on seamless paper. Four hours, one keeper, eleven usable frames. | variant-2 |
| 9 | Form | Objects · Clay | Unfired clay spheres in raking light — a study in shadow for a ceramics school. | variant-3 |
| 10 | Iris | Botanical · Colour | Irises against oxblood walls: our standing love letter to saturated colour. | variant-1 |

The variant column is the array `["variant-1","variant-2","variant-3"]` cycled over the ten items,
so it wraps and item 10 lands back on `variant-1` — two `variant-1` cards in a row (10 and 1) is
correct, not a mistake.

Item `i` (0-based) maps to card `preview-(i+1)`, background image `bg-(i+1)`, and thumbnail `main-(i+1)`.

## Styling
- Base: a **sky gradient**, not a flat colour, with white type over it and near-black type inside the glass chips:
  ```css
  :root {
    --sky-top: #2f8bff;
    --sky-bottom: #9cc8ff;
    --sky: linear-gradient(180deg, var(--sky-top), var(--sky-bottom));
    --ink: #0d0d0d;        /* type inside the glass pills */
    --ink-sky: #ffffff;    /* type over the sky */
    --ink-dim: #0b2545;    /* deep blue for secondary copy */
    --lime: #c6f21e;       /* the single accent */
    --card: #ffffff;
    --glass: rgba(255, 255, 255, 0.72);
    --glass-edge: rgba(13, 13, 13, 0.12);
  }
  ```
- Fonts: **Inter** for body, **Space Grotesk** for the big preview titles.
- `img { width:100%; height:100%; object-fit:cover; }` globally.
- `nav`: fixed, full width, `padding:2em`, flex align-center, `z-index:2`. `nav p`, `footer p` → `font-size:12px`.
- `.menu-btn p` and `.item p` share a frosted-pill look: `background:rgba(255,255,255,0.1)`, `border-radius:40px`, `backdrop-filter:blur(20px)`, `padding:6px 12px`, `width:max-content`.
- `.logo a`: `font-size:20px; font-weight:500; text-decoration:none`.
- `footer`: fixed bottom, full width, `padding:2em`, flex `space-between`, `z-index:2`.
- `.items`: fixed, `width:30%`, `height:100vh`, `padding:0 2em`, flex column, `justify-content:center`, `z-index:2`. `.item`: `width:max-content; padding:0.25em 0; cursor:pointer`. `.item p` is a **glass pill**: `color: var(--ink); padding:7px 15px; font-size:13px; background: var(--glass); border:1px solid var(--glass-edge); border-radius:40px; backdrop-filter: blur(20px); transition:0.3s` — the hover state only shifts those values (CSS-only, separate from the GSAP effect).
- `.preview-bg`: `position:absolute; width:100%; height:100%; opacity:0.35` — this permanent 35% opacity is what mutes ALL background photos so overlaid text stays readable.
- `.preview`: `position:absolute; width:100vw; height:100vh; color: var(--ink-sky); z-index:1` (sits above `.preview-bg` at z-index 0, below nav/footer/items at z-index 2). All cards are stacked full-screen; only their inner pieces are positioned/animated.
- `.preview-title h1`: `font-family:"Space Grotesk"; font-weight:600; font-size:clamp(56px, 6.5vw, 84px); line-height:1.02; letter-spacing:-0.03em; color: var(--ink-sky); text-shadow: 0 1px 24px rgba(15,60,130,.25)`. `.preview-tags p`, `.preview-description p`: `font-size:14px; line-height:120%`.

### Variant positioning + collapsed clip-paths (this defines the wipe direction)
Each variant absolutely positions `.preview-img` (fixed `300px × 400px`, `margin:2em`), `.preview-title`, `.preview-tags`, `.preview-description` (`width:250px`) differently, and gives `.preview-img` a **collapsed** starting `clip-path`:

- **variant-1** (image wipes UP from the bottom edge):
  - `.preview-img`: `bottom:0; right:0; clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)`
  - `.preview-title`: `top:35%; left:25%` · `.preview-tags`: `bottom:25%; right:40%` · `.preview-description`: `right:25%; top:25%`
- **variant-2** (image wipes LEFT from the right edge):
  - `.preview-img`: `top:10%; right:5%; clip-path: polygon(100% 0, 100% 0, 100% 100%, 100% 100%)`
  - `.preview-title`: `bottom:30%; left:50%` · `.preview-tags`: `top:25%; left:25%` · `.preview-description`: `right:10%; bottom:15%`
- **variant-3** (image wipes RIGHT from the left edge):
  - `.preview-img`: `bottom:10%; left:15%; clip-path: polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)`
  - `.preview-title`: `bottom:40%; right:15%` · `.preview-tags`: `bottom:20%; right:30%` · `.preview-description`: `left:20%; top:15%`

## GSAP effect (exhaustive)

### Lookup tables (JS)
```
defaultClipPaths = {
  "variant-1": "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)",  // collapsed to bottom line
  "variant-2": "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",     // collapsed to right line
  "variant-3": "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)"            // collapsed to left line
}
// per-variant hidden offsets for the three text blocks (px), all opacity:0
variantTransforms = {
  "variant-1": { title:{x:75,opacity:0},  tags:{y:-75,opacity:0}, description:{x:-75,opacity:0} },
  "variant-2": { title:{x:-75,opacity:0}, tags:{y:-75,opacity:0}, description:{y:75,opacity:0}  },
  "variant-3": { title:{x:75,opacity:0},  tags:{y:75,opacity:0},  description:{x:75,opacity:0}  }
}
```
The revealed (full) image clip-path is always `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rectangle).

### Initial state (on DOMContentLoaded, right after each card is created & appended)
For every card, read its variant and `gsap.set()` its `.preview-title`, `.preview-tags`, `.preview-description` to the corresponding `variantTransforms` offset + `opacity:0`. The `.preview-img` starts hidden purely from its CSS collapsed `clip-path` (no JS needed). Cards themselves keep `opacity:1` by default but read as empty because the image is clipped to a line and the text is at opacity 0. Track `activePreview` (starts as none) and a boolean `isMouseOverItem`.

> **`.preview.default` — the selector you will find in the source and must not chase.** The
> reference implementation seeds `activePreview` with `document.querySelector(".preview.default")`
> and, on `mouseleave`, looks it up again to fade it back in. **There is no such element.** No card
> is authored with a `default` class: the ten cards are generated as
> `preview variant-N preview-{i}`, and the static markup holds only `.preview-bg`. So both lookups
> return `null`, `activePreview` starts as `null`, and the `gsap.to(null, …)` in the `mouseleave`
> branch is a no-op — GSAP ignores null targets silently.
>
> The behaviour that ships is therefore exactly what this section describes: **no card on load, no
> card at rest.** The "default" state is the muted `default-bg.jpg` background with an empty stage
> over it. Do **not** build a tenth, always-on `.preview.default` card to satisfy the selector — you
> would be adding a card the demo never shows. Either drop the selector entirely (cleanest) or keep
> it verbatim for fidelity, knowing it resolves to nothing. If your framework throws on null targets
> where GSAP shrugs — React refs, a strict animation wrapper — guard both call sites; that is the
> one place this dead selector can actually bite you.

### Background crossfade — `changeBg(src)`
Create a fresh `<img>`, absolutely fill it (`top/left:0; width/height:100%; object-fit:cover`), start at `opacity:0`, append into `.preview-bg`, then:
- `gsap.to(newImg, { opacity: 1, duration: 0.5 })` (default ease `power1.out`).
- If `.preview-bg` now holds more than one child, fade the OLD (first) child: `gsap.to(oldImg, { opacity: 0, duration: 0.5, onComplete: () => remove it })`.

This yields a 0.5s dissolve between backgrounds (always seen through the layer's fixed 0.35 opacity).

### On `item.mouseenter` (index `i`)
Fire these simultaneously (no timeline object; independent tweens, no stagger, no delay unless noted):
1. `isMouseOverItem = true`.
2. `changeBg("bg-" + (i+1) + ".jpg")` → the 0.5s background dissolve above.
3. Resolve `newActivePreview = .preview-(i+1)`.
4. **If** a *different* `activePreview` was already showing, retract it first:
   - `gsap.to(prevImg, { clipPath: itsDefaultCollapsedClipPath, duration: 0.75, ease: "power3.out" })` — its image wipes closed toward its own edge.
   - `gsap.to(prevPreview, { opacity: 0, duration: {{motion.duration.fast}}, delay: 0.2 })`.
   - Instantly `gsap.set()` the previous card's title/tags/description back to their hidden `variantTransforms` offsets.
5. `gsap.to(newActivePreview, { opacity: 1, duration: 0.1 })`; set `activePreview = newActivePreview`.
6. Slide the three text blocks in — for each of `.preview-title`, `.preview-tags`, `.preview-description`:
   `gsap.to(el, { x: 0, y: 0, opacity: 1, duration: 0.5 })` (default ease `power1.out`). They travel from their variant offsets (±75px x or y) to rest, fading 0→1, all at once (0.5s).
7. Open the image: `gsap.to(activeImg, { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1, ease: "power3.out" })` — a 1s wipe from the collapsed edge line to the full rectangle. Direction per variant: v1 up, v2 leftward, v3 rightward.

Net timing per hover: bg dissolve 0.5s, text in 0.5s, image wipe 1s — all starting together; card opacity snaps in over 0.1s.

### On `item.mouseleave`
1. `isMouseOverItem = false`.
2. Immediately `gsap.set()` the current `activePreview`'s title/tags/description back to their hidden `variantTransforms` offsets (text snaps out with no tween).
3. `setTimeout(…, 10)`; inside, **only if** `isMouseOverItem` is still false (i.e. the cursor didn't jump straight to another item):
   - `changeBg("default-bg.jpg")` → dissolve back to the muted default background.
   - `gsap.to(activePreview, { opacity: 0, duration: 0.1 })` to hide the card.
   - `gsap.to(activeImg, { clipPath: itsDefaultCollapsedClipPath, duration: 1, ease: "power3.out" })` — image wipes closed over 1s.
   - Clear `activePreview` so the next hover starts clean.

   (Moving directly from one item to another skips this reset because the new `mouseenter` sets `isMouseOverItem=true` before the 10ms timeout runs; the retract logic in step 4 of `mouseenter` handles the handoff instead.)

## Assets / images
A cohesive editorial pool of photography — studio interiors, landscape, architecture and abstract still life — shot cool or neutral so it sits inside the blue sky ground rather than fighting it:
- **10 portrait preview thumbnails**, aspect ratio **3:4** (rendered at 300×400) — one per project card (`main-1 … main-10`).
- **10 full-bleed landscape backgrounds** (~16:9, cover) — one per project (`bg-1 … bg-10`); always shown through the 0.35 opacity layer.
- **1 default full-bleed background** (`default-bg`) — a moody architectural nook, shown before/after hovering.
No brand logos or client marks. Thumbnails and backgrounds can share the same visual family.

## Behavior notes
- **Desktop / hover only.** The whole experience is pointer-driven; there is no touch fallback and the page never scrolls (single fixed viewport).
- No `prefers-reduced-motion` branch in the original.
- Nav/footer/list sit at `z-index:2` above the cards (`z-index:1`) and background (`z-index:0`), so they stay legible during every transition.

## Images

This component ships with 21 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/metalab-lp-rebuild/bg-1.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-10.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-2.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-3.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-4.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-5.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-6.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-7.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-8.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/bg-9.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/default-bg.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-1.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-2.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-3.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-4.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-5.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-6.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-7.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-8.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-9.jpg
https://motionprompts.dev/c/metalab-lp-rebuild/main-10.jpg
```

Ten backgrounds, ten thumbnails and the one default background — `bg-i` and `main-i` both belong to
item `i`, so they always travel together.

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--sky-top`, `--sky-bottom`, `--sky`, `--ink`, `--ink-sky`, `--ink-dim`, `--lime`, `--card`, `--glass`, `--glass-edge`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything
reaches the screen — on the same DOM nodes, since StrictMode's double-invoke does not recreate the
page in between. Setup that runs twice with teardown that runs never leaves you two of everything
here too: two independent `mouseenter`/`mouseleave` pairs bound to the same `.item` rows, each
closing over its own `activePreview`/`isMouseOverItem`, and a second, silently-appended batch of
the ten `.preview` cards this component builds for itself. None of it reproduces in a production
build, because React only double-invokes in development. Treat the cleanup as part of the effect,
not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded`. By the time a React component
mounts, that event has already fired, so the listener is never called and the effect never
runs — no error, no animation, nothing to debug. Delete the listener and move its entire body —
the `previews.forEach` loop that builds the ten `.preview` cards *and* the `items.forEach` loop
that wires their hover listeners — into a single `useEffect` with an empty dependency array. Keep
both loops together: they share `activePreview` and `isMouseOverItem`, and splitting them across
two effects splits that shared state too.

*(2) Element lookups* — Every unscoped `document.querySelector` above assumes the component owns
the page: `.container`, `.preview-bg`, `document.querySelectorAll(".item")`, and the fallback
`document.querySelector(".preview.default")` used both to seed `activePreview` and inside
`mouseleave`. Give the component a root ref on `.container` and scope all of these to it. The
per-card lookups nested inside `applyVariantStyles` and the hover handlers —
`previewElement.querySelector(...)`, `newActivePreview.querySelector(...)`,
`activePreview.querySelector(".preview-img")` — are already scoped to a specific card and need no
change.

There is a sharper version of the same problem in how the cards get built. `previews.forEach`
doesn't just read the DOM, it writes to it: for each of the ten entries it calls
`document.createElement`, sets `innerHTML`, and `appendChild`s the result into `.container` — ten
`.preview-N` nodes with no JSX counterpart. `gsap.context().revert()` (below) undoes the
`gsap.set()` calls `applyVariantStyles` makes on those nodes' title/tags/description, but not the
nodes themselves — appending a child is not something GSAP tracks. If the first StrictMode pass
runs this loop before its cleanup fires, its ten cards are still sitting inside `.container`,
ahead of the second pass's own ten in document order, when that second effect run appends a fresh
set on top. From then on, every `document.querySelector(`.preview-${index + 1}`)` inside a hover
handler resolves to the *first* match — the stale card from the already-reverted first pass, whose
inline offsets have already snapped back to their at-rest values — never the correctly-hidden card
the current mount just built. Hovering opens and closes a card that isn't wired to anything
current, while the one this mount actually owns sits underneath it, permanently collapsed. Build
the cards from `previews.map()` in JSX instead of the imperative loop and this failure mode
disappears outright; if you keep the loop, clear out `.container`'s generated children at the top
of the effect before appending a new set.

*(3) Cleanup* — Wrap the card construction in a `gsap.context` scoped to the root ref:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    // previews.forEach(...): build the ten cards, call applyVariantStyles on each
  }, rootRef);
  return () => ctx.revert();
}, []);
```

That covers the setup pass, but none of the tweens this component spends most of its life running
are created there. Every `gsap.to` inside `mouseenter`/`mouseleave` — the `changeBg` dissolve, the
retract-and-reveal pair on the outgoing and incoming card, the text-block slide-in, the clip-path
wipe — fires later, from a DOM event, well after the synchronous factory call has already
returned. `gsap.context` only auto-tracks what runs during that synchronous call, so a context
that merely wraps card construction tracks none of the hover animations, and `ctx.revert()` leaves
every one of them untouched. Register the hover bodies as named context methods instead, and have
the listeners call those:

```jsx
const ctx = gsap.context((self) => {
  // previews.forEach(...): build the ten cards, call applyVariantStyles on each
  self.add("activate", (index) => {
    // the full mouseenter body: changeBg, retract the outgoing card, reveal the
    // incoming one, slide its text in, wipe its image open
  });
  self.add("deactivate", () => {
    // the full mouseleave body: snap the text back, then the guarded revert-to-default
  });
}, rootRef);

const listeners = Array.from(items).map((item, index) => {
  const onEnter = () => ctx.activate(index);
  const onLeave = () => ctx.deactivate();
  item.addEventListener("mouseenter", onEnter);
  item.addEventListener("mouseleave", onLeave);
  return { item, onEnter, onLeave };
});

return () => {
  listeners.forEach(({ item, onEnter, onLeave }) => {
    item.removeEventListener("mouseenter", onEnter);
    item.removeEventListener("mouseleave", onLeave);
  });
  ctx.revert();
};
```

Routed this way, a call through `ctx.activate`/`ctx.deactivate` is what makes the dissolve, the
wipe and the text tweens tracked children of the context — including the manually appended `<img>`
layers `changeBg` stacks inside `.preview-bg`. The incoming image's opacity tween reverts cleanly
to the value `changeBg` set on it before the tween started, but the outgoing image is only ever
removed from that same tween's own `onComplete`, and a revert kills the tween without firing it.
Interrupt a dissolve mid-flight and the layer that was supposed to fade out and remove itself is
left in `.preview-bg` at full opacity instead, sitting under every background this component
stacks above it afterward.

The `addEventListener` calls are the other half of the doubling the intro paragraph names. Each
effect run's `items.forEach` closes over its own `activePreview`/`isMouseOverItem` pair; if the
listeners from a first StrictMode pass are never removed, the second pass's listeners fire
alongside them on the same rows — two independent state machines, each convinced it owns the
hover, each running its own `changeBg` (two new `<img>` layers racing into `.preview-bg`, each
treating the other's freshly appended layer as the "old" one to fade out) and its own
retract/reveal pair against the same card. The `removeEventListener` calls above are what prevent
that, not `ctx.revert()` — a DOM listener is not a GSAP animation and the context has no idea it
exists.

Last, `deactivate`'s closing `setTimeout(..., 10)` is a plain timer that neither the context nor a
removed listener touches. If the component unmounts inside that ten-millisecond window — a fast
StrictMode churn is enough — the callback still runs, driving `changeBg` and the default-preview
tweens through a context that has already been reverted. Keep the id `setTimeout` returns and
`clearTimeout` it in the same cleanup.
