---
slug: navigate-scroll-animated-text-javascript
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Scroll Animated Text Reveal (word-by-word highlight pills)

## Goal

Build a one-page scroll experience where two paragraph sections are pinned while scrolling and their text reveals word by word: each word fades in behind a dark grey rounded "highlight pill", the pill then dissolves to expose the letters, special keywords reveal inside brightly colored pills, and past 70% of the pinned scroll the whole sequence re-highlights the words in reverse (letters fade back out behind grey pills).

## Tech

Vanilla HTML/CSS/JS with ES module imports. Use `gsap` (npm) with the GSAP plugin `ScrollTrigger`, and `lenis` (npm) for smooth scrolling. No other libraries. Three files: `index.html` (links `./styles.css`, loads `<script type="module" src="./script.js">`), `styles.css`, `script.js`.

## Layout / HTML

Five full-viewport `<section>` elements, in this order:

1. `<section class="hero">` — contains `<div class="copy-container">` with an `<h1>`: "Playground for bold ideas and creative interfaces."
2. `<section class="about anime-text-container">` — `<div class="copy-container">` wrapping `<div class="anime-text">` with **two `<p>` paragraphs** of marketing copy for a fictional design tool called "Huebase". The copy must naturally contain the keywords **vibrant, living, clarity, expression** (e.g. "Huebase is a vibrant space for designers who think in motion… bold ideas turn into living interfaces… great design starts with clarity and expression ends… your palette comes to life…"). Roughly 40–50 words per paragraph.
3. `<section class="cta">` — `copy-container` with `<h1>`: "Join Huebase now to create expressive interfaces."
4. `<section class="features anime-text-container">` — same structure as `.about` (a `copy-container` > `anime-text` > two `<p>`), with copy that naturally contains the keywords **shape, intuitive, storytelling, interactive, vision** (e.g. "Huebase brings motion, structure, and creativity together in one intuitive space… explore rich storytelling visuals… interactive components… bring your creative vision to life…").
5. `<section class="outro">` — `copy-container` with `<h1>`: "Built for designers who shape the web."

## Styling

- Google Font **"DM Sans"** on `body`; global reset (`* { margin:0; padding:0; box-sizing:border-box }`).
- `body { background-color: #141414 }`.
- Every `section`: `position: relative; width: 100vw; height: 100svh; padding: 2em; overflow: hidden`.
- `.copy-container`: fills its section (`width/height: 100%`), flex centered both axes, `text-align: center`, `border-radius: 2rem`.
- `.copy-container h1`: `width: 70%`, color `#141414` (dark text on colored cards), `font-size: 5rem`, `font-weight: 900`, `line-height: 1`.
- Colored card backgrounds: `.hero .copy-container { background: #fe6d38 }` (orange), `.cta .copy-container { background: #c6fe69 }` (lime green), `.outro .copy-container { background: #7a78ff }` (violet).
- `.about .copy-container, .features .copy-container`: no background, just a dashed border `0.15rem dashed rgb(60, 60, 60)`.
- `.anime-text { width: 60% }`; `.anime-text p`: color `#fff`, `text-align: center`, `margin-bottom: 2rem`, `font-size: 2rem`, `font-weight: 900`, `line-height: 1`.
- Word wrappers (created by JS): `.anime-text .word { display: inline-block; position: relative; margin-right: 0.2rem; margin-bottom: 0.2rem; padding: 0.1rem 0.2rem; border-radius: 2rem; will-change: background-color, opacity }`. Keyword wrappers get extra horizontal room: `.anime-text .word.keyword-wrapper { margin: 0 0.4rem 0.2rem 0.2rem }`.
- Inner text span: `.anime-text .word span { position: relative }`.
- Keyword spans: `.anime-text .word span.keyword { border-radius: 2rem; display: inline-block; width: 100%; height: 100%; padding: 0.1rem 0; color: #141414 }` plus a `::before` pseudo-element that draws the colored pill behind the text: `content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: calc(100% + 1rem); height: calc(100% + 0.4rem); background-color: #fff; border-radius: 2rem; z-index: -1`.
- Per-keyword pill colors (class on the span equals the keyword itself): `vibrant`, `shape`, `interactive` → `#7a78ff`; `living`, `expression`, `storytelling` → `#fe6d38`; `clarity`, `intuitive`, `vision` → `#c6fe69`.
- **Initial state in CSS**: `.anime-text .word, .anime-text .word span { opacity: 0 }` — both the wrapper and the inner span start invisible; JS drives their opacity inline.

## GSAP effect (exhaustive)

### Setup

- All code runs inside `DOMContentLoaded`.
- `gsap.registerPlugin(ScrollTrigger)`.
- Lenis smooth scroll with default options, wired into GSAP the canonical way:
  - `lenis.on("scroll", ScrollTrigger.update)`
  - `gsap.ticker.add((time) => lenis.raf(time * 1000))`
  - `gsap.ticker.lagSmoothing(0)`

### Word splitting (manual, no SplitText)

For every `.anime-text p`:

1. Take `textContent`, split on whitespace (`/\s+/`), clear the paragraph's `innerHTML`.
2. For each non-empty word create `<div class="word"><span>WORD</span></div>` and append it to the paragraph.
3. Normalize the word (lowercase, strip punctuation `[.,!?;:"]`). If it matches one of the nine keywords `["vibrant","living","clarity","expression","shape","intuitive","storytelling","interactive","vision"]`, add class `keyword-wrapper` to the `.word` div and add classes `keyword` **and the normalized word itself** to the inner span (this is what selects the pill color in CSS).

### ScrollTrigger — one per text section

For each `.anime-text-container` (the `.about` and `.features` sections), create a ScrollTrigger with:

- `trigger: container`, `pin: container`, `start: "top top"`, `end: "+=" + window.innerHeight * 4` (pinned for 4 viewport heights), `pinSpacing: true`.
- **No tweens/timelines** — everything is computed in `onUpdate(self)` from `self.progress` (0→1 across the pinned distance) and written as inline styles on each word. Collect all `.anime-text .word` elements in the container (`totalWords` = count; both paragraphs together). The grey highlight color is `rgba(60, 60, 60, α)`.

### Phase 1 — reveal (progress ≤ 0.7)

Map scroll progress to `revealProgress = min(1, progress / 0.7)`. Each word animates over its own staggered window using this exact math (a manual stagger with 15-word overlap):

- `overlapWords = 15`
- `totalAnimationLength = 1 + overlapWords / totalWords`
- `wordStart = index / totalWords`; `wordEnd = wordStart + overlapWords / totalWords`
- `timelineScale = 1 / min(totalAnimationLength, 1 + (totalWords - 1) / totalWords + overlapWords / totalWords)`
- `adjustedStart = wordStart * timelineScale`; `adjustedEnd = wordEnd * timelineScale`; `duration = adjustedEnd - adjustedStart`
- `wordProgress` = 0 before `adjustedStart`, 1 after `adjustedEnd`, otherwise linear `(revealProgress - adjustedStart) / duration`.

Then per word, per frame:

- **Wrapper opacity**: `word.style.opacity = wordProgress` (the grey pill fades in with the word).
- **Pill background**: fully grey while `wordProgress < 0.9`, then fades out linearly over the last 10%: `backgroundFadeStart = wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0`; `word.style.backgroundColor = rgba(60,60,60, max(0, 1 - backgroundFadeStart))`.
- **Text opacity**: hidden until `wordProgress` reaches the 0.9 threshold, then revealed with a square-root curve: `textRevealProgress = wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0`; `span.style.opacity = Math.pow(textRevealProgress, 0.5)`.

Net effect: a grey rounded pill sweeps across the paragraphs word by word; as each word's pill completes, the pill dissolves and the letters appear in its place (keywords keep their colored CSS pill behind the text).

### Phase 2 — reverse re-highlight (progress > 0.7)

`reverseProgress = (progress - 0.7) / 0.3`. Wrapper opacity is forced to 1. Same staggered-window math but with `reverseOverlapWords = 5`:

- `reverseWordStart = index / totalWords`; `reverseWordEnd = reverseWordStart + reverseOverlapWords / totalWords`
- `reverseTimelineScale = 1 / max(1, (totalWords - 1) / totalWords + reverseOverlapWords / totalWords)`
- `reverseWordProgress` = clamped linear over the scaled window, as before.

Per word: if `reverseWordProgress > 0`, `span.style.opacity = 1 - reverseWordProgress` and `word.style.backgroundColor = rgba(60,60,60, reverseWordProgress)` — the grey pill swallows the text again, word by word from the top. Otherwise text opacity stays 1 and background alpha 0.

Scrolling back up plays everything in reverse automatically since it's all derived from `self.progress`.

## Assets / images

None. The component is pure typography and colored CSS shapes — no images, icons, or SVGs.

## Behavior notes

- The page relies on Lenis smooth scrolling for the buttery pinned feel; both pinned sections behave identically.
- Responsive (`@media (max-width: 1000px)`): `h1` → `width: 90%; font-size: 2rem`; `.anime-text` → `width: 90%`; `.anime-text p` → `font-size: 1.25rem`; `.word` → `margin-right: 0.1rem; margin-bottom: 0.15rem; padding: 0.1rem 0.2rem`; `.word.keyword-wrapper` → `margin: 0 0.2rem 0.1rem 0.1rem`.
- No reduced-motion handling, no resize recalculation needed beyond ScrollTrigger defaults.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--violet`, `--coral`, `--mint`, `--hairline`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: a script that waits for `DOMContentLoaded`, rewrites the `.about` and `.features` paragraphs into per-word markup with plain DOM calls, and pins each of those two sections behind a `ScrollTrigger` whose `onUpdate` writes `opacity` and `backgroundColor` straight onto every `.word` and its inner `span` — no tweens, no timelines, just arithmetic on `self.progress` landing as inline styles every frame. React withdraws the free run of the document and the license to never tear anything down, and it does it quietly: the reveal scrubs correctly the first time, and the damage only shows up on a second mount.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen — and critically, the underlying DOM nodes for `.about` and `.features` are **not** thrown away between that unmount and the remount, only the effect's cleanup and then its body run again. That single fact drives two of the three hazards below, on top of the usual doubled `Lenis` instance and doubled pins.

*(1) The entry point* — the whole effect is wrapped in `document.addEventListener("DOMContentLoaded", ...)`. By the time a React component mounts, that event has already fired, so the listener is registered and never called: no plugin registration, no Lenis, no word split, no pins. Delete the listener and move its entire body — plugin registration, the Lenis wiring, the word-splitting pass over every `.anime-text p`, and the two `ScrollTrigger.create` calls — directly into a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` can move to module scope instead; re-registering on every mount is harmless but pointless.

*(2) Element lookups* — `document.querySelectorAll(".anime-text p")` and `document.querySelectorAll(".anime-text-container")` both assume this component owns the whole document. Give the wrapping element a root `ref` and scope both lookups to it (`root.querySelectorAll(".anime-text p")`, and so on). During the StrictMode remount two copies of this markup exist for an instant, and an unscoped lookup can bind to the copy already on its way out — the effect would then spend the pinned scroll writing word-by-word opacity onto paragraphs nobody renders.

*(3) Cleanup* — wrap the word split and both `ScrollTrigger.create` calls in a `gsap.context` scoped to the root ref, and revert it on cleanup. Because both `ScrollTrigger.create` calls run synchronously in the factory, the context sees and registers both pins without needing `self.add`:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // word split over every ".anime-text p", then one ScrollTrigger.create per
    // ".anime-text-container" (".about" and ".features")
  }, rootRef);
  return () => ctx.revert();
}, []);
```

`ctx.revert()` only reaches what it watched itself create: the two pins on `.about` and `.features`, and the pin-spacer each one inserts around its container. It does **not** reach the per-word visuals, because those are never written through `gsap.set`/`gsap.to` — the prompt above is explicit that there are no tweens or timelines here, only `word.style.opacity = …` and `word.style.backgroundColor = …` assigned by hand inside `onUpdate`. A raw property assignment on a DOM node is invisible to a context that never made it. Because the StrictMode remount keeps the same `.word`/`span` nodes alive across the revert, every one of them is left holding whatever opacity and background-color value was current at the scroll position where the first effect's `onUpdate` last fired — not the zero-opacity, transparent-pill state the stylesheet starts them in. Clear that by hand, in the same cleanup, before reverting the context:

```jsx
return () => {
  gsap.set(rootRef.current.querySelectorAll(".anime-text .word, .anime-text .word span"), {
    clearProps: "opacity,backgroundColor",
  });
  ctx.revert();
};
```

Skip it and a StrictMode remount can render a paragraph with some words already faded in and colored before the new pin has scrolled anywhere near that position — the leftover inline styles from the pass that just got reverted are still sitting on the nodes.

### Lenis is driven by the ticker, not a private loop

This component has no `requestAnimationFrame` of its own: `gsap.ticker.add((time) => lenis.raf(time * 1000))` is the entire render pump for Lenis, and `ctx.revert()` does not touch it — a ticker callback is neither a tween nor a trigger, so the context never records it. Keep the exact function reference and remove it explicitly, and destroy Lenis only once the ticker can no longer reach it:

```jsx
const ctx = gsap.context(() => { /* word split + both ScrollTrigger.create calls */ }, rootRef);
const onTick = (time) => lenis.raf(time * 1000);
gsap.ticker.add(onTick);
lenis.on("scroll", ScrollTrigger.update);
// cleanup, in this order:
return () => {
  gsap.ticker.remove(onTick);
  lenis.destroy();
  gsap.set(rootRef.current.querySelectorAll(".anime-text .word, .anime-text .word span"), {
    clearProps: "opacity,backgroundColor",
  });
  ctx.revert();
};
```

Reverse the first two calls and a ticker frame landing between them calls `.raf()` on a Lenis instance that has already been destroyed. As the rest of this prompt already notes, Lenis is a document-level resource — if this reveal ships as one section of a larger app, wire `lenis.on("scroll", ScrollTrigger.update)` onto the app's existing instance instead of constructing a second one here.

### The word split reads the DOM it just rewrote

The split is manual, not `SplitText`, but it hits the same failure `SplitText` hits when run twice, for the same underlying reason. For each `.anime-text p`, the code reads `paragraph.textContent`, splits on whitespace, clears `paragraph.innerHTML`, and writes every word back as `<div class="word"><span>…</span></div>` with no whitespace text node between the sibling `div`s. StrictMode's double-invoke does not remove that rebuilt markup between the first cleanup and the second effect run — the `.word` divs are still there when the effect body runs again. The second pass's `paragraph.textContent` then walks through those divs and returns every word glued to the next with no separator, because `textContent` never inserts whitespace between block-level children. Splitting that string on `/\s+/` yields one run-on token per paragraph instead of the original forty-some words, `keywords.includes(...)` stops matching any of the nine keyword strings, and the whole two-phase reveal degrades to a single pill spanning the entire paragraph. Do not source the split from the paragraph's live `textContent` on every run: capture the original words once (a `dataset` attribute on the paragraph, or an array kept in a ref) before the first rewrite, and rebuild from that saved copy every time the effect body runs.
