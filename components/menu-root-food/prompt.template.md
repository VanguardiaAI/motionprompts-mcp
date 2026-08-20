---
slug: menu-root-food
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 1
structural_literals: 11
structural:
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Editorial Fullscreen Food Menu — Right-Docked Panel Expands to Full-Bleed Columns with Rising Split-Letter Reveal

## Goal
Build a magazine-style navigation overlay. A tiny fixed **"Menu"** button sits over a full-viewport food photo. Clicking it makes a **narrow dark panel docked to the right edge expand across the whole screen** into **five equal vertical columns**, while **giant slab-serif labels reveal letter-by-letter, rising up from below** each column with a staggered climb. Clicking **"Close"** reverses everything. Once open, **hovering a column reveals a food image** (a clip-path box growing from a center point to full rectangle) and **swaps the label** between a dark version sliding out and a muted duplicate sliding in. The star effect is the combination of the **CustomEase "hop" panel-width expansion** and the **per-letter `power3.out` staggered vertical reveal** of oversized rotated type.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) plus the GSAP plugin **`CustomEase`**. No ScrollTrigger, no SplitText (the letter splitting is done by a small hand-written helper, not the plugin), no smooth-scroll library — there is **no scroll interaction at all**; the whole thing is a fixed-position click-toggled overlay. Import as:
```js
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
gsap.registerPlugin(CustomEase);
```
Ship `index.html`, `styles.css`, and an ES-module `script.js` (`<script type="module" src="./script.js">`).

## Layout / HTML
```
.menu                              (fixed, docked TOP-RIGHT, width:20vw, height:100vh, display:flex, z-index:2)
  .menu-item            × 5        (flex:1 vertical column; one per nav entry)
    .menu-item-index
      <p>01</p>                     (the index number, stays horizontal)
      <p>Why</p>                    (the short word label, rotated -90deg)
    .menu-link.menu-link-main
      <p>Why</p>                    (giant slab-serif label — bone)
    .menu-link.menu-link-hover
      <p>Why</p>                    (identical giant label — ember, the hover duplicate)
    .menu-img
      <img>                         (per-column food image, hidden until hover)
  .menu-close                       (fixed TOP-RIGHT, z-index:10)
    <p>Close</p>

.container                          (full-viewport landing view; hero food photo as CSS background)
  .menu-open                        (fixed TOP-LEFT, z-index:1)
    <p>Menu</p>
```
The five items, in order (`index number` / `word label` — the **same word is repeated three times per item**: once in `.menu-item-index`, once in `.menu-link-main`, once in `.menu-link-hover`):

1. `01` / **Why**
2. `02` / **Who**
3. `03` / **What**
4. `04` / **How**
5. `05` / **Join**

No brand, no logo — the only text on screen is `Menu`, `Close`, the five numbers, and the five words. Keep these neutral labels.

## Styling

**Global / typography**
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `html, body { width:100%; height:100%; font-family:"IBM Plex Mono", monospace; }` — a monospace for all the small UI text (Menu, Close, index numbers).
- `img { width:100%; height:100%; object-fit:cover; }`
- `p { text-transform:uppercase; font-size:12px; font-weight:500; line-height:100%; }` — this governs every small label (Menu, Close, index numbers, words).

**Color palette (only three colors)**
```css
:root {
  --char: #131316;    /* page ground: near-black neutral */
  --soot: #1a1a1e;    /* the menu panels */
  --sesame: #f2f2f0;  /* cold bone: display text and the "Menu" button */
  --ember: #ff5a1f;   /* live coal: the index number and the hover label */
  --smoke: #8c8c88;   /* muted labels */
  --hairline: rgba(242, 242, 240, 0.14);
}
```
- The panels are **dark** (`--soot`), the giant labels bone (`--sesame`), and the only colour is the ember on the first index number and on the hover duplicate of each label.

**Landing view**
- `.container { width:100%; height:100%; background:url(<hero>) no-repeat 50% 50%; background-size:cover; }` — full-bleed hero food render behind everything.

**Toggle buttons (Menu / Close) — clip-path is the reveal mask**
- `.menu-open { position:fixed; top:0; left:0; z-index:1; color: var(--sesame); }`
- `.menu-close { position:fixed; top:0; right:0; z-index:10; color: var(--smoke); }`
- Shared: `.menu-open, .menu-close { margin:0.75em; padding:0.75em; clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%); cursor:pointer; }` — the rectangular `clip-path` acts as an **overflow mask**: a `<p>` translated vertically out of the padding box is clipped, giving a text-slide reveal.
- `.menu-open p, .menu-close p { position:relative; }`

**The panel & columns**
- `.menu { position:fixed; top:0; right:0; width:20vw; height:100vh; display:flex; z-index:2; }` — starts as a slim right-edge strip; GSAP animates its `width`.
- `.menu-item { position:relative; flex:1; height:100%; display:flex; justify-content:center; background: var(--soot); border-left:1px solid var(--hairline); clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%); margin-left:-1px; }` — the full-rectangle `clip-path` masks the oversized type that overflows the column.
- `.menu-item-index { height:100%; padding:1.5rem 0.5rem 2rem 0.5rem; display:flex; flex-direction:column; justify-content:space-between; align-items:center; color: var(--smoke); }` — its **first** `p` is `color: var(--ember)`, the second is 11px rotated `-90deg`.
- `.menu-item-index p:nth-child(2) { position:relative; transform:rotate(-90deg); }` — the word label at the bottom of the index column reads vertically.

**The giant rotated labels**
- `.menu-link { position:absolute; bottom:2.5%; left:55%; transform:translate(-50%,-50%) rotate(-90deg); }` — anchored near the column's bottom, rotated so the huge text reads vertically (bottom-to-top).
- **Third column exception:** `.menu-item:nth-child(3) .menu-link { bottom:7.5%; }` (the longer word "What" needs a bit more room).
- `.menu-link p { position:relative; display:flex; font-family:"Alfa Slab One", Georgia, serif; text-transform:uppercase; font-size:158px; font-weight:400; line-height:0.9; transition:all 0.5s; }` — a **heavy slab serif** at 158px (any weighty display serif works; the mass is the point). `display:flex` so the per-letter `<span>`s sit in a row. On mobile it drops to `clamp(2.2rem, 10vw, 4.25rem)`.
- `.menu-link p span { position:relative; }`
- `.menu-link-main p { color: var(--sesame); }` (bone)
- `.menu-item .menu-link-main, .menu-item .menu-link-hover { transition:all 0.5s; }`
- `.menu-item .menu-link-hover { left:150%; color:rgba(163,155,137,0.85); }` — the duplicate hover label starts parked off to the right.

**Per-column image**
- `.menu-img { position:absolute; width:75%; height:35%; top:25%; left:50%; transform:translate(-50%,-50%); clip-path:polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%); transition:0.5s all cubic-bezier(0.165, 0.84, 0.44, 1); }` — the collapsed-to-a-point `clip-path` hides the image entirely; it lives in the upper portion of the column.

**CSS hover interactions (pure CSS transitions — NOT GSAP)**
- Label swap: `.menu-item:hover .menu-link-main { left:-100%; }` (bone label slides out to the left) and `.menu-item:hover .menu-link-hover { left:50%; }` (the ember duplicate slides in from `150%` to center, with a `text-shadow: 0 0 34px rgba(255,90,31,.45)` glow) — both over the `all 0.5s` transition, a horizontal label cross-swap.
- Image reveal (only once the menu is fully open): `.menu-item.menu-opened:hover .menu-img { clip-path:polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%); }` — the clip-path grows from a center point to a full rectangle over `0.5s cubic-bezier(0.165, 0.84, 0.44, 1)` (easeOutQuart), unmasking the food image. The `.menu-opened` class is only present after the open animation completes (see GSAP §3), so images never reveal in the collapsed strip.

## GSAP effect (exhaustive)

### Setup (runs once on load)
1. Register the plugin and define the signature ease:
   ```js
   CustomEase.create("hop", "M0,0 C0.091,0.543 0.148,0.662 0.277,0.786 0.405,0.909 0.596,0.979 1,1");
   ```
   This "hop" curve rises fast, eases through a soft mid-plateau, then settles — used **only** for the panel-width tween.
2. **Split every giant label into per-character spans** with a hand-rolled helper (no SplitText plugin):
   ```js
   function splitTextIntoSpans(selector){
     document.querySelectorAll(selector).forEach((el) => {
       el.innerHTML = el.innerText.split("")
         .map((ch) => `<span>${ch === " " ? "&nbsp;&nbsp;" : ch}</span>`).join("");
     });
   }
   splitTextIntoSpans(".menu-link p");
   ```
   (A literal space becomes two `&nbsp;`.) Runs on both `.menu-link-main p` and `.menu-link-hover p`.
3. **Initial GSAP states:**
   - `gsap.set(".menu-close p", { y: 40 })` — the "Close" word is pushed 40px down, clipped out of its masked button (hidden on load).
   - `gsap.set(".menu-link p span", { y: 250 })` — every letter is pushed 250px down its own axis, sitting below the column's masked bottom edge (hidden on load).
   - `.menu-open p` is left at its default `y:0` (the "Menu" word is visible on load).
4. State flag `let isMenuOpen = false;`. Wire `click` on **both** `.menu-open` and `.menu-close` to the same `handleMenu` handler.

### The single toggle handler (`handleMenu`)
Every click fires the following tweens **in parallel**. Crucially, `isMenuOpen` is read *before* it flips — it only flips inside the `onComplete` of the align-items tween — so on a given click all ternaries use the pre-click value. `isMenuOpen === false` ⇒ **OPEN targets**; `isMenuOpen === true` ⇒ **CLOSE targets**.

1. **Panel width (the hero move):**
   ```js
   gsap.to(menu, { width: isMenuOpen ? "20vw" : "100vw", duration: 1, ease: "{{motion.ease.primary}}" });
   ```
   Open: `20vw → 100vw` (the right strip stretches across the whole viewport, so the five `flex:1` columns each become 20vw wide and fill the screen). Close: `100vw → 20vw`. **This is the only tween using the `"hop"` CustomEase.**

2. **Column content alignment:**
   ```js
   gsap.to(".menu-item", { justifyContent: isMenuOpen ? "center" : "flex-start", duration: 1, ease: "power3.out" });
   ```
   Open: `center → flex-start`. Close: reverse. (Animating a flex keyword — GSAP tweens it as a discrete/step change synced to the 1s duration.)

3. **Index column alignment + state flip (drives the `.menu-opened` class):**
   ```js
   gsap.to(".menu-item-index", {
     alignItems: isMenuOpen ? "center" : "flex-start",
     duration: 1, ease: "power3.out",
     onComplete: () => {
       isMenuOpen = !isMenuOpen;
       menuItems.forEach((it) => it.classList.toggle("menu-opened", isMenuOpen));
     },
   });
   ```
   Open: `center → flex-start`. On complete it flips `isMenuOpen` and **adds `.menu-opened`** to every item (enabling the hover image reveal); on close it removes the class. This is the single source of truth for the toggle state.

4. **"Close" button reveal:**
   ```js
   gsap.to(".menu-close p", { y: isMenuOpen ? 40 : 0, duration: 1, ease: "power3.out" });
   ```
   Open: `y 40 → 0` ("Close" slides up into its masked button). Close: `y → 40` (slides back out of view).

5. **"Menu" button hide:**
   ```js
   gsap.to(".menu-open p", { y: isMenuOpen ? 0 : -40, duration: 1, ease: "power3.out" });
   ```
   Open: `y 0 → -40` ("Menu" slides up and out of its mask). Close: `y → 0` (slides back in).

6. **Per-letter staggered label reveal (the signature climb):** loop over each `.menu-item`, grab its letters (`.menu-link p span`), and tween them **per column**:
   ```js
   menuItems.forEach((menuItem) => {
     const letters = menuItem.querySelectorAll(".menu-link p span");
     gsap.to(letters, {
       delay: isMenuOpen ? 0 : 0.25,
       y: isMenuOpen ? 250 : 0,
       duration: 1,
       stagger: isMenuOpen ? -0.075 : 0.075,
       ease: "power3.out",
     });
   });
   ```
   - **Open** (`isMenuOpen === false`): `delay 0.25`, `y 250 → 0` (letters rise up from below the clipped edge into place), `stagger 0.075` (forward — letters appear left-to-right along the rotated baseline). The 0.25s delay lets the panel begin expanding before the type climbs.
   - **Close** (`isMenuOpen === true`): `delay 0`, `y 0 → 250` (letters drop back down out of view), `stagger -0.075` (reverse order). No delay — type retreats immediately.
   - Because both `.menu-link-main` and `.menu-link-hover` spans are selected, both label copies rise/fall together. Each of the five columns runs its own independent stagger in parallel, so all columns reveal simultaneously (each internally left-to-right).

There is no timeline object and no ScrollTrigger — everything is concurrent `gsap.to`/`gsap.set` calls sharing the same 1s duration, with the 0.25s letter delay on open being the only offset.

## Assets / images
Six **glossy, stylized 3D-rendered fast-food "icon" images on a solid near-black background** (studio-lit, high-saturation, single hero object centered). All are `object-fit:cover`, so exact aspect ratio is forgiving — supply roughly **portrait / square** renders (the reveal box is a small landscape-ish window, ~75%×35% of a column). One hero + one per column:

- **hero** (`.container` background, full-bleed): a domed-lid takeaway cup of **iced coffee / frappé with a swirl of whipped topping and chocolate drizzle**, warm caramel tones. Fills the whole landing viewport behind the "Menu" button.
- **img1 — "Why":** a **pink-glazed ring donut with rainbow sprinkles**, three-quarter view.
- **img2 — "Who":** a **frothy glass mug of golden lager** with an overflowing foam head.
- **img3 — "What":** a **glossy cheeseburger** — sesame bun, melted cheese, tomato, lettuce.
- **img4 — "How":** a **red carton of thick-cut french fries** standing upright.
- **img5 — "Join":** a whole **pepperoni pizza**, top-down.

Any cohesive set of playful, saturated 3D food renders on a dark background works — no brands or logos.

## Behavior notes
- **Desktop-oriented** (`mobileSafe:false`). At `max-width:900px` the CSS reflows: `.menu` becomes `flex-direction:column`, labels un-rotate and drop to `font-size:80px` centered (`top/left:50%`, `rotate(0)`), `.menu-link-hover` and `.menu-img` are `display:none`, and the index column centers. The GSAP width tween still runs (20vw→100vw), so on narrow screens the columns stack vertically once expanded.
- No `prefers-reduced-motion` branch; no resize listener; no infinite loops. Every animation is a one-shot, 1-second click-driven toggle.
- The hover label-swap and hover image-reveal are **CSS transitions**, gated by the `.menu-opened` class that GSAP adds/removes on toggle completion — so hovering does nothing while the panel is still the collapsed strip.
- Re-clicking mid-animation is not guarded in the original; the tweens simply retarget. Keep it simple and match that (no re-entrancy lock).
- Fonts: **IBM Plex Mono** for UI text and **Alfa Slab One** for the giant labels — both free. Substitute any monospace plus a heavy display serif; the weight and the 158px scale are what carry the look.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/menu-root-food/hero.jpg
https://motionprompts.dev/c/menu-root-food/img1.jpg
https://motionprompts.dev/c/menu-root-food/img2.jpg
https://motionprompts.dev/c/menu-root-food/img3.jpg
https://motionprompts.dev/c/menu-root-food/img4.jpg
https://motionprompts.dev/c/menu-root-food/img5.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--char`, `--soot`, `--sesame`, `--ember`, `--smoke`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — Every statement in this script runs at the top level, the instant the module is evaluated: the four lookups for `.menu-open`, `.menu-close`, `.menu` and the `.menu-item` list, the `splitTextIntoSpans(".menu-link p")` call that rewrites every label's markup into per-character spans, and the two `gsap.set` calls that push the "Close" label and every letter span out of view before the first paint. In React that is import time — before this component has rendered a single element — so `document.querySelectorAll(".menu-item")` returns an empty `NodeList` and the rest cascades from there. Move all of it into a `useEffect` with an empty dependency array. `gsap.registerPlugin(CustomEase)` and `CustomEase.create("hop", ...)` are the one exception: registering a plugin or an ease curve is idempotent module state that touches no DOM, so both stay at module scope, evaluated once, the way `gsap.registerPlugin` already does for the 197 other GSAP components in this catalogue — putting them inside the effect would just re-register the same curve on every mount for no benefit.

*(2) Element lookups* — `menuOpen`, `menuClose`, `menu` and the `menuItems` list are all captured with unscoped selectors that assume this component owns the document. Give the component a root ref and re-query all four from it inside the effect. The ref has to wrap more than `.menu`: in the markup, `.menu` and `.container` are siblings, and `.menu-open` lives inside `.container` while `.menu-close` and every `.menu-item` live inside `.menu` — scope the ref to `.menu` alone and `menuOpen` resolves against a subtree that never contained it. During the StrictMode remount two copies of both subtrees exist for an instant; an unscoped `querySelectorAll(".menu-item")` can bind the open animation to the five columns on their way out instead of the five that survive.

*(3) Cleanup* — `splitTextIntoSpans` and the two setup `gsap.set` calls run synchronously once, so wrapping them in a `gsap.context` scoped to the root ref is enough to make `ctx.revert()` see them. `handleMenu` is different: it does not execute when that factory runs, it executes once per click, from the two `addEventListener` calls that come after the context is already built. `gsap.context` only tracks animations created while its factory is synchronously on the stack, so the seven `gsap.to` calls `handleMenu` fires on every toggle — the panel-width tween, the two `justifyContent`/`alignItems` tweens, the two label-`y` tweens on "Close" and "Menu", and the five per-column letter-stagger tweens it loops out over `menuItems` — need to be registered as a named context method and invoked by name, or they never end up in the set `ctx.revert()` tears down:

```jsx
useEffect(() => {
  const root = rootRef.current;
  const menuOpen = root.querySelector(".menu-open");
  const menuClose = root.querySelector(".menu-close");
  const menu = root.querySelector(".menu");
  const menuItems = root.querySelectorAll(".menu-item");
  let isMenuOpen = false;

  const ctx = gsap.context((self) => {
    splitTextIntoSpans(".menu-link p");
    gsap.set(".menu-close p", { y: 40 });
    gsap.set(".menu-link p span", { y: 250 });

    self.add("handleMenu", () => {
      /* the seven gsap.to calls exactly as described above, still reading
         isMenuOpen before the alignItems tween's onComplete flips it */
    });
  }, rootRef);

  const onToggle = () => ctx.handleMenu();
  menuOpen.addEventListener("click", onToggle);
  menuClose.addEventListener("click", onToggle);

  return () => {
    menuOpen.removeEventListener("click", onToggle);
    menuClose.removeEventListener("click", onToggle);
    ctx.revert();
  };
}, []);
```

Every selector `handleMenu` targets internally — `.menu-item`, `.menu-item-index`, `.menu-close p`, `.menu-open p`, `.menu-link p span` — is plain selector text, not a captured element, so nothing about it needs rewriting: `gsap.context` resolves selector-text arguments against descendants of `rootRef` automatically for any GSAP call made while the context is active, and calling the registered method as `ctx.handleMenu()` keeps it active for exactly that call. Skip the `self.add` step and call the original `handleMenu` directly instead, and the tweens still play — they just play untracked, so the StrictMode remount's `ctx.revert()` leaves the previous mount's in-flight width tween and letter stagger running against elements a second copy of this component is now also animating.

Skip removing the two listeners in the cleanup and the remount stacks a second one on the same reused `.menu-open`/`.menu-close` nodes, since StrictMode's unmount-then-remount reuses the committed DOM rather than recreating it. Every real click after that fires `handleMenu` twice in the same synchronous pass, and the second call reads `isMenuOpen` before the first call's `alignItems` `onComplete` has had a chance to flip it — both calls target the same width, alignment and stagger tweens with the same pre-click ternary, so the second `gsap.to` retargets a tween the first one just started rather than reinforcing it, and the panel's width and the letters' offsets settle wherever the last of the two overlapping tweens happened to land.

`ctx.revert()` restores the panel, the labels, the close button and every letter span to their pre-mount inline styles, but it does not undo `splitTextIntoSpans`: that helper only rewrites `innerHTML`, which is structural DOM, not a tween or a `gsap.set` write, so `gsap.context` never tracks it and there is no revert counterpart the way `SplitText.revert()` would provide. That happens to be harmless here — "Why", "Who", "What", "How" and "Join" are single words, so `splitTextIntoSpans` never hits its space-to-`&nbsp;&nbsp;` branch, and reading `element.innerText` back off an already-split node reconstructs the identical string before re-splitting it into the identical spans on the next mount. The moment any label becomes two words, that coincidence stops holding, and the split needs an explicit "already split" guard before it is safe to leave outside the context's teardown.
