# Stories Slideshow — Fullscreen Instagram-Stories Carousel with Clip-Path Image Swaps & Custom Cursor

## Goal
Build a **fullscreen, single-view "Stories" slideshow** (Instagram-Stories style). One story is on screen at a time over a dimmed full-bleed background image. Each story **auto-advances every 4s**, and a segmented progress bar at the top fills linearly over that 4s. You can also **step manually by clicking**: clicking the left half of the screen goes **Prev**, the right half goes **Next**. The star effect is the **transition between stories**: the incoming background image **wipes in via an animated `clip-path`** (from the right on Next, from the left on Prev) while the outgoing image **scales up to 2× and rotates** as the incoming image **scales down from 2× and counter-rotates** into place — a zoom/rotate crossfade. Simultaneously the **profile name and the three title lines slide-swap inside clip-path masks** (old text scrolls out, new text scrolls in), and the completed progress segment **swipes away**. A **blurred glassy custom cursor** follows the pointer with lag and reads `PREV` / `NEXT` depending on which half of the screen you're on.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) only — **no plugins, no ScrollTrigger, no Lenis, no SplitText**. All motion is imperative `gsap.to` / `gsap.fromTo` / `gsap.set` driven by timers and pointer events. Runs in one `script.js` with a separate `data.js` exporting the story array. No build framework beyond a Vite-style dev server that resolves the `gsap` npm import.

## Layout / HTML
A single `.container` holding: the custom cursor, the background-image layer, and the centered story content (progress indices + profile row, then the title + link). Class names are load-bearing — the JS queries them. The initial DOM is pre-populated with **story 1**.

```html
<div class="container">
  <div class="cursor"><p></p></div>

  <div class="story-img">
    <div class="img"><img src="/story-1.jpg" alt="" /></div>
  </div>

  <div class="story-content">
    <div class="row">
      <div class="indices">
        <div class="index"><div class="index-highlight"></div></div>
        <div class="index"><div class="index-highlight"></div></div>
        <div class="index"><div class="index-highlight"></div></div>
        <div class="index"><div class="index-highlight"></div></div>
        <div class="index"><div class="index-highlight"></div></div>
        <div class="index"><div class="index-highlight"></div></div>
      </div>

      <div class="profile">
        <div class="profile-icon"><img src="/profile-1.jpg" alt="" /></div>
        <div class="profile-name"><p>Palette</p></div>
      </div>
    </div>

    <div class="row">
      <div class="title">
        <div class="title-row"><h1>Showcasing creative</h1></div>
        <div class="title-row"><h1>portfolios and projects</h1></div>
        <div class="title-row"><h1>from top designers</h1></div>
      </div>
      <div class="link"><a href="#" target="_blank">Read More</a></div>
    </div>
  </div>
</div>

<script type="module" src="./script.js"></script>
```

There are **6 stories** and therefore **6 `.index` segments** (one segment per story). The number of `.title-row`s (3) is fixed — every story's title is exactly **3 lines**.

### Story data (`data.js`) — fictional demo copy, no real brands
Export `const stories = [...]` with **6** entries; each has `profileImg`, `profileName`, a **3-line** `title` array, `linkLabel`, `linkSrc`, `storyImg`. The initial DOM above must match `stories[0]`.

| # | profileName | title (3 lines) | linkLabel |
|---|---|---|---|
| 1 | Palette | "Showcasing creative" / "portfolios and projects" / "from top designers" | Read More |
| 2 | Driftwork | "Inspiring design" / "ideas and visual" / "creations from experts" | Discover |
| 3 | Laureate | "Award-winning web" / "design and development" / "projects" | Check It Out |
| 4 | Formary | "Curated design" / "inspiration for" / "creative professionals" | See More |
| 5 | Bloomfield | "The latest in" / "design trends" / "and tutorials" | Explore |
| 6 | Foundry | "Practical tips" / "for web designers" / "and developers" | Visit Site |

`linkSrc` can be `#` for all. `storyImg`/`profileImg` point at the 6 background images and 6 avatars.

## Styling
Global reset `* { margin:0; padding:0; box-sizing:border-box }`. `html, body { width:100%; height:100%; background:#000; cursor:none; font-family:"PP Neue Montreal", "Neue Montreal", "Inter", system-ui, sans-serif }` — a clean neutral grotesque; the original uses a proprietary Neue Montreal, any similar grotesque is fine. **`cursor:none`** globally hides the native cursor (we draw our own).

- `img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover }` — every image cover-fills its box.
- Type: `h1, p, a { color:#fff; text-decoration:none; font-weight:400 }`. `h1 { font-size:36px }`. `p, a { font-size:16px }`.
- `.container { width:100vw; height:100vh; overflow:hidden }`.

**Custom cursor** — a glassy blurred disc:
```css
.cursor {
  position:absolute; top:0; left:0; width:100px; height:100px;
  display:flex; justify-content:center; align-items:center;
  background:rgba(255,255,255,0.05); backdrop-filter:blur(10px);
  border-radius:100%; pointer-events:none; z-index:2;
}
.cursor p { font-size:12px; text-transform:uppercase; }   /* reads PREV / NEXT */
```

**Background layer** — dimmed full-bleed:
```css
.story-img { position:absolute; top:0; left:0; width:100vw; height:100vh; overflow:hidden; opacity:0.5; }
.img       { position:absolute; top:0; left:0; width:100%; height:100%; }
```
`.story-img` holds one or two `.img` children during a transition (old + new); `opacity:0.5` darkens the photo so the white text stays legible.

**Centered content column** (30% wide, vertically split top/bottom):
```css
.story-content {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  padding:4em 0; width:30%; height:100%;
  display:flex; flex-direction:column; justify-content:space-between;
}
```

**Segmented progress bar** (thin hairlines across the top):
```css
.indices { width:100%; height:10px; display:flex; justify-content:space-between; align-items:center; gap:0.25em; }
.index   { position:relative; width:100%; height:1px; background:rgba(255,255,255,0.25); }
.index-highlight { position:absolute; top:0; left:0; width:0%; height:100%; background:#fff; transform:scaleX(100%); }
```
Each `.index` is a full-width 1px track at 25% white; its `.index-highlight` is the white fill that grows in `width`.

**Profile row & masked text windows:**
```css
.profile { width:100%; height:60px; display:flex; gap:1em; align-items:center; }
.profile-icon { position:relative; width:40px; height:40px; border-radius:100%; overflow:hidden; }
.profile-name { position:relative; width:200px; height:20px; clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
.title-row    { position:relative; width:100%; height:42px; clip-path:polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
.title-row h1, .profile-name p { position:absolute; top:0; }
```
The rectangular `clip-path` on `.profile-name` (20px tall) and each `.title-row` (42px tall) acts as an **overflow mask**: the absolutely-positioned `<p>`/`<h1>` inside can slide vertically and be clipped at the window edges. This is what makes the text swap read as a rolling reveal.

**"Read More" link** with a 1px underline:
```css
.link { position:relative; width:max-content; margin:2em 0; padding:0.25em 0; }
.link::after { content:""; position:absolute; top:100%; left:0; width:100%; height:1px; background:#fff; }
```

**Palette:** pure black `#000` ground, pure white `#fff` text/fills, backgrounds dimmed to 0.5 opacity. No accent colors.

## GSAP effect (be exact)

### Module state & constants
```js
import gsap from "gsap";
import { stories } from "./data.js";

let activeStory = 0;
const storyDuration = 4000;       // ms per story (progress fill + auto-advance)
const contentUpdateDelay = 0.4;   // s — delay applied to every text slide tween
let direction = "next";           // updated by pointer half; drives manual clicks
let storyTimeout;                 // the auto-advance timer

const cursor = document.querySelector(".cursor");
const cursorText = cursor.querySelector("p");
```

### 1. Progress-segment fill — `animateIndexHighlight(index)`
Resets the segment then fills it linearly over the full story duration:
```js
gsap.set(highlight, { width: "0%", scaleX: 1, transformOrigin: "right center" });
gsap.to(highlight, { width: "100%", duration: storyDuration / 1000 /* 4 */, ease: "none" });
```
So the active story's white bar grows `width 0% → 100%` over **4s, linear**. When it completes, the auto-advance fires.

### 2. Retire a finished/left segment — `resetIndexHighlight(index, dir)`
Kills any running tween on that highlight, then:
```js
gsap.killTweensOf(highlight);
gsap.to(highlight, {
  width: dir === "next" ? "100%" : "0%",
  duration: 0.3,
  onStart: () => {
    gsap.to(highlight, { transformOrigin: "right center", scaleX: 0, duration: 0.3 });
  },
});
```
On **Next**, the segment snaps its `width` to `100%` (complete) while simultaneously `scaleX → 0` from `transformOrigin:right center` — it fills then **swipes out to the right** over 0.3s. On **Prev**, `width → 0%` while `scaleX → 0`. Both tweens are 0.3s (default ease).

### 3. Incoming image clip-path wipe — `animateNewImage(imgContainer, dir)`
The new `.img` starts collapsed to one edge and expands to a full rectangle:
```js
gsap.set(imgContainer, {
  clipPath: dir === "next"
    ? "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)"   // collapsed to right edge
    : "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)",          // collapsed to left edge
});
gsap.to(imgContainer, {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", // full rect
  duration: 1, ease: "power4.inOut",
});
```
So the new background **wipes in from the right (Next) or left (Prev)** over **1s, `power4.inOut`**.

### 4. Zoom/rotate crossfade — `animateImageScale(currentImg, upcomingImg, dir)`
The outgoing image blows up and rotates away; the incoming image shrinks in from an over-scaled counter-rotation:
```js
gsap.fromTo(currentImg,
  { scale: 1, rotate: 0 },
  { scale: 2, rotate: dir === "next" ? -25 : 25, duration: 1, ease: "power4.inOut",
    onComplete: () => currentImg.parentElement.remove() }   // remove old .img after
);
gsap.fromTo(upcomingImg,
  { scale: 2, rotate: dir === "next" ? 25 : -25 },
  { scale: 1, rotate: 0, duration: 1, ease: "power4.inOut" }
);
```
Both are **1s, `power4.inOut`**. Outgoing: `scale 1→2`, `rotate 0→∓25°`. Incoming: `scale 2→1`, `rotate ±25°→0°`. The old `.img` container is removed on complete so only the settled image remains.

### 5. Masked text swap (profile name + 3 title lines)
This spans two phases inside `changeStory(...)`, `t` measured from the call:

**(a) Slide the OLD text out — fired immediately, delayed 0.4s:**
```js
gsap.to(".profile-name p", { y: dir === "next" ? -24 : 24, duration: 0.5, delay: contentUpdateDelay });
gsap.to(".title-row h1",   { y: dir === "next" ? -48 : 48, duration: 0.5, delay: contentUpdateDelay });
```
On Next the current profile `<p>` slides **up** `-24px` and each title `<h1>` slides **up** `-48px` (out the top of their masks); on Prev they slide **down** `+24/+48px`. (Slide distances exceed the 20px / 42px mask heights so the text fully clears.) Runs `t=0.4s → 0.9s`, duration 0.5s.

**(b) After a `setTimeout(..., 200)`**, build & slide the NEW text in. Append a fresh `<p>` to `.profile-name` and fresh `<h1>`s to each `.title-row`, pre-offset off-window, then tween to `y:0`:
```js
newProfileName.style.transform = dir === "next" ? "translateY(24px)" : "translateY(-24px)";
gsap.to(newProfileName, { y: 0, duration: 0.5, delay: contentUpdateDelay });

// for each of the 3 title lines:
newTitle.style.transform = dir === "next" ? "translateY(48px)" : "translateY(-48px)";
gsap.to(newTitle, { y: 0, duration: 0.5, delay: contentUpdateDelay });
```
On Next the new text starts **below** its mask (`+24 / +48`) and rises to `0`; on Prev it starts **above** (`-24 / -48`) and drops to `0`. Because the tween is created inside the 200ms timeout with its own `delay:0.4`, the new text arrives at `t≈0.6s → 1.1s` — overlapping the old text's exit for a continuous rolling swap.

**(c) `cleanUpElements()`** keeps at most **2** children in `.profile-name` and in each `.title-row` (removes the oldest `firstChild` when count > 2) so stale DOM doesn't pile up across transitions.

### 6. `changeStory(isAutomatic = true)` — the orchestrator
```js
const previousStory = activeStory;
const currentDirection = isAutomatic ? "next" : direction;   // auto is always Next
activeStory = currentDirection === "next"
  ? (activeStory + 1) % stories.length
  : (activeStory - 1 + stories.length) % stories.length;      // wraps both ways
const story = stories[activeStory];
```
Then, in order:
1. Fire the **old-text-out** tweens (§5a).
2. Capture `currentImgContainer = ".story-img .img"` and its `<img>`.
3. **`setTimeout(200ms)`:** append new text (§5b) and tween in; create a new `.img` div + `<img src=story.storyImg>` appended to `.story-img`; call `animateNewImage(newImgContainer, dir)` (§3) and `animateImageScale(currentImg, newImg, dir)` (§4); `resetIndexHighlight(previousStory, dir)` (§2) and `animateIndexHighlight(activeStory)` (§1); `cleanUpElements()` (§5c); then `clearTimeout(storyTimeout)` and schedule the next auto-advance: `storyTimeout = setTimeout(() => changeStory(true), storyDuration)`.
4. **`setTimeout(600ms)`:** swap the `.profile-icon img` `src` to `story.profileImg`, and set `.link a` text to `story.linkLabel` + `href` to `story.linkSrc`.

### 7. Custom cursor follow + direction (pointer move)
```js
document.addEventListener("mousemove", ({ clientX, clientY }) => {
  gsap.to(cursor, {
    x: clientX - cursor.offsetWidth / 2,   // center the 100px disc on the pointer
    y: clientY - cursor.offsetHeight / 2,
    ease: "power2.out", duration: 0.3,     // lagged follow
  });
  if (clientX < window.innerWidth / 2) { cursorText.textContent = "Prev"; direction = "prev"; }
  else                                 { cursorText.textContent = "Next"; direction = "next"; }
});
```
The disc trails the pointer with a 0.3s `power2.out` ease and its label flips **PREV** (left half) / **NEXT** (right half), which also sets the click direction.

### 8. Click to step
```js
document.addEventListener("click", () => {
  clearTimeout(storyTimeout);
  resetIndexHighlight(activeStory, direction);   // retire the current segment in the click direction
  changeStory(false);                            // step manually using `direction`
});
```

### 9. Init (on load)
```js
storyTimeout = setTimeout(() => changeStory(true), storyDuration);  // first auto-advance in 4s
animateIndexHighlight(activeStory);                                 // start filling segment 0
```

### Per-transition timeline summary (t in seconds from `changeStory`)
- `t=0.2 → 1.2` — background clip-path wipe (§3) + zoom/rotate crossfade (§4), `power4.inOut`; old `.img` removed at 1.2.
- `t=0.2 → 0.5` — previous progress segment fills-and-swipes-away (§2).
- `t=0.2 → 4.2` — new progress segment fills linearly (§1); auto-advance fires at ~4.2.
- `t=0.4 → 0.9` — old profile/title text slides out (§5a).
- `t≈0.6 → 1.1` — new profile/title text slides in (§5b).
- `t=0.6` — profile avatar + link label/href swap (step 6.4).

## Assets / images
- **6 full-bleed background images** (`story-1…6`) — moody, editorial/creative photography (studio scenes, design workspaces, abstract textures, portraits). Any aspect ratio — each is `object-fit:cover` into the 100vw×100vh box and shown at **0.5 opacity** over black, so mid-tones/dark grounds keep the white text legible. No logos or brand text baked in.
- **6 circular profile avatars** (`profile-1…6`) — small (~40px) square images cropped to a circle: simple abstract emblems / monogram marks / solid-color badges. Generic, no real brands. Order them to match the 6 story entries.

If you have fewer than 6 of either, repeat in order — the effect is identical regardless of content.

## Behavior notes
- **Auto-advance:** every story lives 4s; the progress fill and the `setTimeout` share `storyDuration`, so the bar completing coincides with the next slide. Auto-advance is always **Next**; only clicks can go **Prev**.
- **Manual step:** a click reads the last pointer half (`direction`) — left half → Prev, right half → Next — cancels the pending auto-advance, and immediately transitions. Indices wrap in both directions (story 6 → story 1 on Next, story 1 → story 6 on Prev).
- **Custom cursor:** the native cursor is hidden (`cursor:none`); the blurred glass disc with PREV/NEXT text is the only pointer. It never intercepts clicks (`pointer-events:none`).
- **Responsive** (`max-width:900px`): restore the native cursor (`html, body { cursor:default }`), **hide** `.cursor` (`display:none`), and widen the content column to full width with padding: `.story-content { width:100%; padding:2em }`. (No dedicated tap/swipe handling — clicks still work.)
- **No scroll, no pin, no plugins** — a single fixed viewport driven entirely by timers + pointer events + core GSAP tweens. Light runtime cost.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/stories/story-1.jpg
https://motionprompts.dev/c/stories/story-2.jpg
https://motionprompts.dev/c/stories/story-3.jpg
https://motionprompts.dev/c/stories/story-4.jpg
https://motionprompts.dev/c/stories/story-5.jpg
https://motionprompts.dev/c/stories/story-6.jpg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two triggers on the same element disagreeing about the same scrub, two smooth scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

For this component the doubling is concrete, not abstract. The script wires `mousemove` and `click` straight onto `document` and seeds `storyTimeout` at module scope. A remount that leaves the first pass's listeners attached gives you two `click` handlers both calling `changeStory`: one tap appends two new `.img` containers to `.story-img`, starts two overlapping clip-path wipes, and races two `animateImageScale` crossfades against the same `currentImg` — visible as a stutter, and as the `onComplete: () => currentImg.parentElement.remove()` from each pass fighting over which `.img` gets torn down. The same doubling on `mousemove` means two competing cursor tweens chasing the same pointer position and two writers racing to set `direction` on every move.

*(1) The entry point* — The script runs at the top level, the moment the module is evaluated: the `.cursor` lookup, both `addEventListener` calls, the seed `storyTimeout = setTimeout(() => changeStory(true), storyDuration)`, and the first `animateIndexHighlight(activeStory)` all fire at import time, before your component has rendered anything. Move the whole body into a `useEffect` with an empty dependency array. Do not leave it in the component body: that re-runs the seed timer and the DOM lookups on every render. `activeStory`, `direction`, and `storyTimeout` are module-level `let`s in the original precisely because the document only ever loads this script once; a React component doesn't get that guarantee. Declare them as locals inside the effect closure instead — two mounted instances of this component, or a StrictMode remount that doesn't fully unwind the first pass, would otherwise share one story counter and one pending timer between them.

*(2) Element lookups* — Every `document.querySelector`/`querySelectorAll` here assumes this component owns the document: `.cursor`, `.index .index-highlight` (picked by numeric index), `.profile-name`, `.title-row`, `.story-img .img`, `.profile-icon img`, `.link a`. Give the component a root `ref`, render it on the outermost element, and scope every one of those to it. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of the subtree exist for an instant, and `document.querySelector(".story-img .img")` will happily grab the outgoing copy's image instead of the one that's about to remain.

*(3) Cleanup* — Wrap every tween this component creates in a `gsap.context` scoped to the root ref, and revert that context in the cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the effect exactly as described above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

Without the revert, the StrictMode remount leaves the first pass's `.index-highlight` and cursor tweens live alongside the second pass's. Registering the plugin belongs at module scope, not inside the effect.

If you need `ctx.add(...)`, use the `self` parameter the factory receives, never the `ctx` variable — `gsap.context` runs its factory synchronously, before the `const ctx = …` assignment finishes, so referring to `ctx` inside it throws `Cannot access 'ctx' before initialization` and takes the tree down. This component needs `self.add`'s named overload for a reason specific to it: `changeStory`, the auto-advance chain, and the pointer handler all run **after** the factory's synchronous pass has already returned — from a `setTimeout`, from `document.addEventListener("click", …)`, from `document.addEventListener("mousemove", …)` — so none of the tweens they create are tracked unless each re-enters the context at the moment it actually runs. Register `changeStory` once, by name, so the listeners can call it later through the context:

```jsx
const ctx = gsap.context((self) => {
  self.add("changeStory", changeStory);
}, rootRef);

document.addEventListener("click", () => {
  clearTimeout(timeoutId);
  ctx.changeStory(false); // called from outside the factory: tracked because it re-enters via `self`
});
```

That single registration does not reach as far as it looks like it should. `changeStory` schedules two more `setTimeout` calls internally — the one that builds the incoming text and image nodes and starts `animateNewImage`/`animateImageScale`/`resetIndexHighlight`/`animateIndexHighlight`, and the later one that swaps the avatar `src` and the link's label/href. Both bodies run after `changeStory`'s own synchronous pass has already returned, exactly like the click handler above, so wrapping `changeStory` once does **not** cover them — each has to re-enter the context itself, with the one-argument overload, right where its tweens are created:

```jsx
self.add("changeStory", (isAutomatic) => {
  /* the two "old text out" tweens fire synchronously here — these ARE covered */
  setTimeout(() => {
    self.add(() => {
      /* new text + new .img node, animateNewImage, animateImageScale, reset/animate highlight */
    });
  }, 200);
});
```

Skip that inner `self.add` and nothing errors — the transition still plays — it just means `ctx.revert()` won't undo it, so a StrictMode unmount mid-transition leaves an orphaned clip-path wipe or crossfade animating nodes React has already discarded.

None of the above touches the three plain (non-GSAP) timers this component owns: the seed and every re-seeded `storyTimeout`, plus the two `setTimeout` calls inside `changeStory`. `gsap.context` doesn't know these exist, so `ctx.revert()` never clears them. `clearTimeout` only cancels the single handle you pass it, and `changeStory` reassigns `storyTimeout` on every call, so track it in an effect-local variable (or a ref, if anything outside the effect needs to read it) and clear whatever it holds *at unmount*, not whatever it held at mount. If one of the three fires after unmount against unscoped lookups, `document.querySelector(".profile-name")` returns `null` and `profileNameDiv.childElementCount` throws; scoping the lookups to the root ref (point 2) only turns that crash into a silent no-op if the ref itself has been cleared by then, so pair it with a `cancelled` flag set in the same cleanup and checked at the top of each deferred callback.

Also remove the `mousemove` and `click` listeners in the same cleanup that reverts the context. Both are attached to `document`, which React never unmounts on its own, so nothing else will ever detach them — store the function references you pass to `addEventListener` and pass the same references to `removeEventListener`.
