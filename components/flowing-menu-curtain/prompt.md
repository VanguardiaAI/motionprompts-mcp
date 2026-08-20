# Flowing Menu Curtain (closest-edge marquee sheet)

## Goal
Build a contents page whose rows answer the hand. Hovering a row pulls an **inverted sheet** across it — ink where the page is paper — carrying that row's own name on an endless marquee with a photographic still between each repetition. The sheet does not simply rise: it **enters from whichever horizontal edge the pointer actually crossed**, and leaves towards the edge it exits by. Come down onto a row and the sheet comes down with you; come up from below and it rises to meet you.

The demo dress is **Meridian**, a printed quarterly cut into five sections.

## Tech
Vanilla HTML/CSS/JS with ES module imports. **`gsap` (npm), no plugins:**

```js
import gsap from "gsap";
```

No ScrollTrigger, no Lenis, no SplitText. Everything runs inside a `DOMContentLoaded` listener.

Write the engine so it takes **every hook as a `data-` attribute selector** rather than hard-coded class names — `[data-flow-item]`, `[data-flow-panel]`, `[data-flow-strip]`, `[data-flow-part]`. It costs four lines and it means the same engine drops into a page with a completely different naming scheme without an edit.

That does mean each hook is written twice in the markup: a **class for painting** and a **`data-` attribute for moving**. That is the deal, and it is worth it — the alternative is an engine that can only ever be used by a page that agreed to its class names.

One note on the wrapper: `type="module"` scripts are deferred, so the DOM is already parsed by the time the module runs. The `DOMContentLoaded` listener below is a house habit, not a requirement.

## The mechanic, in three pieces

### 1 · Closest edge, measured on BOTH events
```js
const dist2 = (x, y, x2, y2) => (x - x2) * (x - x2) + (y - y2) * (y - y2);

const closestEdge = (x, y, width, height) =>
  dist2(x, y, width / 2, 0) < dist2(x, y, width / 2, height) ? "top" : "bottom";
```

Squared distance from the pointer to the **midpoint of the top edge** and the **midpoint of the bottom edge**. No square root — comparing squares gives the same answer for a third of the work. Only the horizontal edges are tested: on a row far wider than it is tall, the left and right edges are almost never the nearest, and testing them would make the sheet fly in sideways on the rare occasion the pointer clipped a corner.

The measurement runs again on `mouseleave`, from that event's own coordinates. **Do not remember the entry edge and reuse it.** Enter from the top, drift down, leave through the bottom, and the sheet should follow you out through the bottom — a sheet that retreats the way it came reads as a spring, not as something a hand pushed.

### 2 · Counter-movement, which is the whole illusion
```js
gsap.timeline({ defaults: { duration: 0.6, ease: "expo" } })
  .set(panel, { yPercent: edge === "top" ? -101 : 101 }, 0)
  .set(strip, { yPercent: edge === "top" ?  101 : -101 }, 0)
  .to([panel, strip], { yPercent: 0 }, 0);
```

The panel comes in from one side while its content comes from the **other**. Because they cancel, the marquee text stays almost still relative to the window while the sheet wipes across it — it reads as a physical sheet being drawn over a fixed picture, not as a `div` sliding up with its cargo. Animate them in the same direction and the effect collapses into an ordinary reveal; it will still look fine, and it will not look like this.

**`101`, not `100`.** At 100 sub-pixel rounding leaves a one-pixel sliver of the panel showing along the row's edge, and on a dark sheet over a light page that sliver is the first thing you see.

Leaving is the same shape, without the `set`:

```js
gsap.timeline({ defaults: { duration: 0.6, ease: "expo" } })
  .to(panel, { yPercent: edge === "top" ? -101 : 101 }, 0)
  .to(strip, { yPercent: edge === "top" ?  101 : -101 }, 0);
```

### 3 · A seamless loop, which means measuring
```js
// `template` is the ONE part authored in the markup, still in the DOM. Measure a detached clone
// instead and offsetWidth is 0, so the loop never starts and nothing tells you why.
const partWidth = template.offsetWidth;
// Measured against the ROW, not the window: the row is what has to stay covered. A component in a
// narrow column would otherwise build several copies it can never show.
const span = item.offsetWidth || window.innerWidth;
const wanted = Math.max(4, Math.ceil(span / partWidth) + 2);
while (strip.children.length > wanted) strip.lastElementChild.remove();
while (strip.children.length < wanted) strip.append(template.cloneNode(true));

loop?.kill();
gsap.set(strip, { x: 0 });
loop = gsap.to(strip, { x: -partWidth, duration: 18, ease: "none", repeat: -1 });
```

Animate **exactly one measured copy width** and the wrap is invisible, because the strip at `-partWidth` is pixel-identical to the strip at `0`. Any other number — a round `-2000`, a percentage, two copies — and the jump shows on every cycle.

The copy count is measured, not fixed: one narrow copy on a wide row leaves a gap at the end of the travel and the seam appears. Two spare copies as headroom, a floor of four, and a rebuild on a **120 ms debounced** resize, because a drag fires resize dozens of times and each pass rebuilds every row.

Re-measure after `document.fonts.ready` as well. Web fonts change the measured width after first paint, and the first measurement is otherwise the fallback typeface's.

## The trap that will cost you an hour

**GSAP has to be told to own the transform.**

The stylesheet parks the panel offstage so it cannot flash before the script runs:

```css
.curtain { transform: translate3d(0, 101%, 0); }
```

`getComputedStyle` hands that back **already resolved to pixels**. GSAP reads it as `y: 132px, yPercent: 0` and from then on it *adds*: asking for `yPercent: -101` lands at 132 − 132 = 0 — open — and animating to `yPercent: 0` returns it to 132 — closed. **The effect runs exactly backwards, opening on leave and closing on enter, and not one line appears in the console.**

Pin it once per element, before any timeline touches it:

```js
gsap.set(panel, { y: 0, yPercent: 101 });
gsap.set(strip, { y: 0, yPercent: 0 });
```

## Layout / HTML
```html
<section class="index">
  <p class="index-head"><span>Contents</span><span>Hover a strand</span></p>

  <a class="row" href="#order" data-flow-item>
    <span class="row-no">01</span>
    <span class="row-name">Portrait</span>
    <span class="row-count">18 plates</span>
    <span class="curtain" data-flow-panel aria-hidden="true">
      <span class="curtain-strip" data-flow-strip>
        <span class="curtain-part" data-flow-part>
          <span class="curtain-word">Portrait</span>
          <i class="curtain-still" style="--still: url(/c/flowing-menu-curtain/portrait.jpg)"></i>
        </span>
      </span>
    </span>
  </a>
  …four more: Object, Landscape, Interior, Archive…
</section>
```

Exactly **one** `[data-flow-part]` is authored; the script clones it to fill. The curtain is `aria-hidden` because it repeats the row's own name — a screen reader should hear "Portrait, 18 plates", not "Portrait Portrait Portrait Portrait".

The rest of the page is a cover with a masked plate and masthead copy, a stock-and-binding spec grid, and a footer with a pill CTA.

## Styling
```css
.row {
  position: relative;      /* the panel's frame */
  overflow: hidden;        /* or the sheet paints over the rows above and below on the way past */
  display: grid;
  grid-template-columns: 5rem 1fr auto;
  height: var(--row);      /* a definite height: the curtain's stage */
}

.curtain {
  position: absolute; inset: 0; z-index: 1;
  display: block; overflow: hidden;
  pointer-events: none;    /* NOT optional — see below */
  background: var(--ink);
  transform: translate3d(0, 101%, 0);
}

.curtain-strip { display: flex; align-items: center; height: 100%; width: max-content; }
.curtain-part  { display: flex; align-items: center; flex-shrink: 0; height: 100%; }

.curtain-still {
  width: clamp(120px, 15vw, 210px);
  height: 62%;
  border-radius: 999px;
  background-image: var(--still);
  background-size: cover;
}
```

Three of those lines are load-bearing and easy to lose:

- **`pointer-events: none` on the panel.** It covers the whole row, so without it the sheet swallows the click on the very link it decorates — and worse, the pointer entering the panel counts as leaving the row, so the curtain flickers open and shut for ever.
- **`width: max-content` on the strip.** A flex row inside a clipped box will otherwise shrink to the box and every copy will squash.
- **`height: 100%` on the part.** The still is sized as a *percentage*, and a percentage height against an auto-height parent does not resolve — the still comes out full width and **zero tall**, taking up its space in the rhythm and showing nothing at all. This one is quiet: the spacing looks right and the pictures are simply absent.

## Dress
A printed quarterly's contents page. Warm uncoated paper, near-black ink, one hot orange lifted out of the plates.

- **Ground** `#f4f1ea` paper, `#eae5da` for the footer
- **Ink** `#14120f`, `#7c766c` for labels
- **Accent** `#e0521f`, and it earns its keep on almost nothing: the row numerals, the selection colour, and a focus ring. On a page this quiet one 0.68rem numeral per row is enough to key the whole thing; spend it anywhere else and the contents page starts competing with the plates
- **Type** `Funnel Display` for the masthead and the row names (700 on the display at `-0.035em`, 600 on the rows at `-0.03em`) and `Overpass Mono` at `0.68rem` uppercase with `0.08em` tracking for **every** label, count and spec
- Rows at `clamp(3.4rem, 8vw, 6.6rem)` tall — large enough that the sheet is an event, short enough that five of them fit on a screen

**The curtain is the negative of the page**: ink ground, paper type. A coloured panel reads as a highlight; an inverted one reads as a different sheet of paper being pulled across. If you adapt this to a brand colour, check it — a mid-tone panel makes the marquee text fight the ground and the whole thing turns muddy.

## Behaviour worth building deliberately

**No hover, no work.** Bail out of the whole per-row setup when `(hover: hover) and (pointer: fine)` does not match. The panel never opens on a touchscreen, so cloning its copies and leaving an infinite tween spinning behind it is one wasted tween per row, for ever, on every phone.

**`mouseenter`/`mouseleave`, not their pointer equivalents.** On a touchscreen a tap fires `pointerenter` and very often never fires `pointerleave`, so the curtain stays open on top of the link.

**Reduced motion.** The marquee runs on its own for ever, so it is autonomous motion: under `prefers-reduced-motion: reduce`, do not start the loop, and shorten the curtain to a 0.2s `power1.out` move. The rows stay links either way.

**Cleanup.** Return a `destroy()` that kills each loop, clears the debounce timer and removes the resize and hover listeners.

## Definition of done
Run the pointer down the list from above: each row's sheet drops in from the top as you arrive and drops out through the bottom as you leave, one after another, with the marquee text sitting almost still behind the wipe. Come back up from below and every sheet rises instead. Rest on one row and the ink band scrolls its name and stills past for ever with no visible seam. Resize the window and the seam still never shows. On a phone there is no sheet at all and the contents page is just a contents page.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/flowing-menu-curtain/archive.jpg
https://motionprompts.dev/c/flowing-menu-curtain/cover.jpg
https://motionprompts.dev/c/flowing-menu-curtain/interior.jpg
https://motionprompts.dev/c/flowing-menu-curtain/landscape.jpg
https://motionprompts.dev/c/flowing-menu-curtain/object.jpg
https://motionprompts.dev/c/flowing-menu-curtain/portrait.jpg
```

One still per row, and the file name is the row name lowercased: the `Portrait` row's
`--still` is `portrait.jpg`, the `Archive` row's is `archive.jpg`, and so on. The markup above
writes them as site-relative `url(/c/flowing-menu-curtain/portrait.jpg)`; outside this site use the
absolute URLs.

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Adapting this to React

Everything above describes a standalone module: `flowingMenu(root, options)` is a self-contained engine that takes a root element, wires up every row it finds under it, and hands back a `destroy()` that the demo never actually calls — the page just runs it once from `DOMContentLoaded` and lets the tab's own lifetime be the cleanup. React removes that assumption without removing the plumbing, and the interesting part is how much of `destroy()` already survives the transition unhelped.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Calling `flowingMenu` twice against the same `<section class="index">` is not, by itself, the danger here: the returned `destroy()` already kills each mount's own `loop` tween, clears its own debounce timer, and removes its own `mouseenter`/`mouseleave`/`resize` listeners, so the two calls do not stack duplicate listeners the way a bare `addEventListener` with no cleanup would. The one thing `destroy()` cannot reach is `document.fonts?.ready.then(rebuild)` — that promise is not in `teardown` at all, and because the StrictMode remount reuses the exact same DOM (the section and its five rows are not recreated between the unmount and the second mount, only the effect body re-runs), the first mount's `rebuild` closure is still pointing at the very `strip` the second mount's own `loop` is already animating. When the web font finishes loading, both the dead first-mount `rebuild` and the live second-mount `rebuild` are pending on that one promise. The dead one fires anyway: it recomputes the clone count, calls `gsap.set(strip, { x: 0 })` on top of wherever the live loop has already animated to, and starts a brand-new infinite tween that nothing will ever kill, because the closure that owns that particular `loop` variable already had its one and only `destroy()` call, seconds or a whole render earlier. The marquee does not visibly double — GSAP's own overwrite handling on a shared `x` property takes care of that — but it does visibly **jump**, once, at whatever moment the font happens to resolve, with nothing on screen at that instant to explain why. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script waits for `DOMContentLoaded` with no `readyState` guard in front of it. By the time a React component mounts, that event has already fired, so neither call made from inside it would ever run: `flowingMenu(document.querySelector(".index"), { gsap, speed: 18 })`, and the row-number `gsap.from(".row-no", …)` stagger reveal right after it. Delete the listener and move both calls into a `useEffect` with an empty dependency array, in the same order — the reveal only makes visual sense once the rows it targets exist, not because it has any real dependency on `flowingMenu` having finished setting anything up.

*(2) Element lookups* — `flowingMenu` itself never touches `document`. `root.querySelectorAll(o.item)`, and every `item.querySelector(o.panel)` / `item.querySelector(o.strip)` / `strip.querySelector(o.part)` inside it, are already scoped to the `root` element the function was handed — that is exactly the property that lets "the same engine drop into a page with a completely different naming scheme" the way the prompt above describes. The only unscoped reference in the whole feature is the call site, `document.querySelector(".index")`. Give the `<section class="index">` a root `ref` and pass `rootRef.current` in its place; nothing inside the engine needs to change.

*(3) Cleanup* — Because `flowingMenu`'s own `destroy()` already tracks the loop tween, the resize debounce and the two hover listeners correctly regardless of when it runs, the remaining work is narrower than the usual GSAP port. Wrap the call in a `gsap.context` scoped to the root ref mainly to catch the row-number reveal — a bare `gsap.from` that lives outside `flowingMenu`'s own bookkeeping entirely, which a StrictMode unmount mid-stagger would otherwise leave frozen at partial opacity on whichever numerals hadn't animated in yet — and let the context's factory return `destroy` itself, so `ctx.revert()` runs it too:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from(".row-no", { yPercent: 60, opacity: 0 /* stagger, as above */ });
    const controller = flowingMenu(rootRef.current, { gsap, speed: 18 });
    return () => controller.destroy();
  }, rootRef);
  return () => ctx.revert();
}, []);
```

That still leaves two gaps `ctx.revert()` cannot see, because neither tween is created while the context's factory is synchronously executing:

- **The `enter`/`leave` timelines.** Each is built fresh inside a `mouseenter`/`mouseleave` handler, well after the factory returned, so `ctx.revert()` has no record of whichever one is mid-flight at unmount. It targets a `panel`/`strip` pair React is about to detach, so nothing this row's audience would ever see, but it keeps a tween alive for no reason. Add `gsap.killTweensOf([panel, strip])` to the per-item `teardown` array inside `flowingMenu`, right next to the `loop?.kill()` already sitting there — same closure, one extra line, not a restructuring.
- **`document.fonts?.ready.then(rebuild)`.** This is the jump described above, and it is not something registering the loop tween with `self.add` would fix — no amount of context bookkeeping stops a `.then()` callback from firing after `destroy()` already ran. Thread a `cancelled` flag through the closure instead, flip it inside `destroy()`, and check it before the continuation touches anything:

```js
let cancelled = false;
// … existing per-item setup …
document.fonts?.ready.then(() => { if (!cancelled) rebuild(); });
// … existing per-item listeners …
teardown.push(() => {
  cancelled = true;
  // … existing loop.kill() / clearTimeout / removeEventListener lines …
});
```

This is the "resolves after unmount" hazard in its least visible form: there is no detached node to guard against here, because the row the stale closure keeps reaching for is not detached — it is the very row the live instance is also driving.
