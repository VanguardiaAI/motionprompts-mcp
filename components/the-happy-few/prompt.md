# Landing Preloader + Hero Reveal with Cursor Emoji Confetti

## Goal
Build a full-screen playful/editorial landing intro. A neutral beige **preloader** holds a small spinning square loader for a few seconds, then wipes upward off the top of the screen to reveal a bright-yellow hero. As it reveals, the two-line headline animates in character by character (each glyph slides up from below its clip mask), and a circular orbit mark pops in beside the headline and starts an **endless slow rotation**. The signature detail: **while the preloader is still running**, moving the cursor sprinkles round emoji "stickers" at the pointer — each pops in with a bouncy `back.out` ease, hangs for a beat, then drops off the bottom of the screen and unmounts. All motion is GSAP core; text is split into `<span>`s manually (no SplitText plugin).

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap`** (npm) only — **no plugins** (no ScrollTrigger, no SplitText, no CustomEase) and no smooth-scroll library. The page does not scroll; it is a pure load-triggered sequence plus a `mousemove` particle spawner. `import gsap from "gsap";` at the top of the module. Everything runs immediately on module load (script is `type="module"`, placed at end of `<body>`).

## Layout / HTML
Semantic structure (class names are load-bearing — the JS/CSS query them):

```
<div class="container">
  <div class="preloader">
    <div class="loader"></div>
  </div>

  <div class="emojis"></div>   <!-- empty; runtime particles are appended here -->

  <section class="hero">
    <div class="nav">
      <div class="site-info">
        <p>Welcome to The Quiet Crowd! This is your gateway to a world of
           refined branding, where elegance meets ingenuity. Step into a realm
           where your brand's uniqueness whispers louder than a shout,
           captivating the hearts of your audience. The Quiet Crowd doesn't
           just create brands—it curates timeless identities that resonate.</p>
      </div>
      <div class="logo"><img src="/assets/logo.png" alt="" /></div>
      <div class="menu-btn"><img src="/assets/menu-btn.png" alt="" /></div>
    </div>

    <div class="hero-img" role="img" aria-label="The Quiet Crowd orbit mark">
      <!-- inline SVG, no image file: concentric circles + crossed ellipses = an orbit mark -->
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g stroke-linecap="round">
          <circle cx="100" cy="100" r="93" stroke="#16150c" stroke-width="1.1" opacity="0.85" />
          <circle cx="100" cy="100" r="66" stroke="#16150c" stroke-width="0.9" opacity="0.65" />
          <ellipse cx="100" cy="100" rx="93" ry="31" stroke="#0f7a5f" stroke-width="1.15" />
          <ellipse cx="100" cy="100" rx="31" ry="93" stroke="#16150c" stroke-width="0.9" opacity="0.8" />
          <ellipse cx="100" cy="100" rx="66" ry="93" stroke="#16150c" stroke-width="0.7" opacity="0.4" />
          <line x1="100" y1="7" x2="100" y2="193" stroke="#16150c" stroke-width="0.7" opacity="0.4" />
          <circle cx="100" cy="100" r="3.2" fill="#0f7a5f" />
        </g>
      </svg>
    </div>

    <div class="header">
      <div class="header-row"><h1>The</h1></div>
      <div class="header-row"><h1>Quiet Crowd</h1></div>
    </div>
  </section>
</div>
```

Notes:
- Use **"The Quiet Crowd"** as the neutral placeholder brand. Headline is exactly two rows: `The` and `Quiet Crowd`.
- `.emojis` starts empty — the JS creates `<div class="emoji">` particles inside it at runtime.
- The nav is a 3-column row: welcome paragraph (left), logo (center), menu button (right).

## Styling
Fonts: body is **Inter**; the headline is set in a light-weight grotesque.

Palette (exact hex — a warm sand page with one deep green as the only chromatic note):
```css
:root {
  --paper: #e7dfc4;                     /* the hero ground */
  --ink: #16150c;                       /* type, and the preloader panel */
  --ink-soft: rgba(22, 21, 12, 0.68);
  --line: rgba(22, 21, 12, 0.18);
  --rubric: #0f7a5f;                    /* deep green: the loader square, the orbit mark's ring, the accents */
}
```
- The **preloader is dark** (`background-color: var(--ink)`) with a `40 × 40px` `var(--rubric)` square spinning in it — not a pale panel.
- The hero underneath is `var(--paper)`.
- Emoji chips are circular (`border-radius: 100%`) with the sticker drawn as a `background-image` at `background-size: contain`.

Global:
- `* { margin:0; padding:0; box-sizing:border-box }`.
- `img { width:100%; height:100%; object-fit:cover }`.
- `html, body { width:100%; height:100%; font-family:"Inter" }`.
- **Custom cursor:** `html, body { cursor: url("/assets/cursor.svg") 32 32, auto }` — a custom circular cursor graphic with a 32×32 hotspot.
- `.container { width:100%; height:100% }`.

Key elements and their **initial states** (the animation depends on these):

- `.preloader`: `position:fixed; inset:0; width:100vw; height:100vh; background: var(--ink); display:flex; justify-content:center; align-items:center; overflow:hidden; z-index:1`. **Initial** `clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)` (full rectangle, covering everything). `will-change:clip-path`.
- `.loader`: `position:relative; width:40px; height:40px; background: var(--rubric); will-change:transform` (a small solid square, centered in the preloader).
- `.emojis`: `position:fixed; inset:0; width:100%; height:100%; overflow:hidden; pointer-events:none; z-index:2` (a full-screen clipping overlay above everything; never intercepts the pointer).
- `.emoji` (runtime particle): `position:absolute; border-radius:100%; overflow:hidden; pointer-events:none; will-change:transform; background-repeat:no-repeat; background-position:50% 50%; background-size:contain` (a **circular** chip holding its sticker image; width/height/left/top/background-image are set inline per-particle).
- `.hero`: `position:relative; width:100vw; height:100vh; overflow:hidden; background: var(--paper); display:flex; flex-direction:column; justify-content:space-between; z-index:0` (nav pinned to top, header pinned to bottom).
- `.nav`: `width:100vw; display:flex; align-items:flex-start`. `.nav > div { flex:1; padding:1.5em }` (three equal columns).
- `.site-info p`: `width:450px; font-size:18px; font-weight:400`.
- `.logo`: `display:flex; justify-content:center`. `.logo img { width:200px; object-fit:contain; transform:scale(0.5) }` (rendered ~100px, centered).
- `.menu-btn`: `display:flex; justify-content:flex-end`. `.menu-btn img { width:70px; object-fit:contain }` (top-right).
- `.hero-img`: `position:absolute; top:16%; right:2.5rem; width:31%; max-width:470px; aspect-ratio:1; transform:scale(0); transform-origin:center; will-change:transform` — the mark is anchored to the **right** of the hero, above the headline, not centred; it **starts at scale 0** = invisible. Its `svg` is `display:block; width:100%; height:100%; overflow:visible`. Below `900px` it moves to `top:32%; left:17%; right:auto; width:66%`.
- `.header`: `width:100%; display:flex; flex-direction:column; gap:0.75em; padding:1em 2em` (the two rows, bottom-left of hero).
- `.header-row`: `position:relative; padding-top:0.5em; clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%)` — a full-rect **clip mask** so the below-parked glyphs are hidden until they slide up into the row.
- `.header h1`: `font-size:1em; font-weight:450; line-height:0.95; letter-spacing:-0.01em` — the size comes from its `.header-row` parent (`10.5vw`, and `4vw` on the first row), so the two lines set at different scales.
- `.header h1 span`: `position:relative; display:inline-block; transform:translateY(200px)` — **every character is parked 200px below** its baseline, clipped by the row's `clip-path`, waiting to slide up.

## GSAP effect (be exact)

### Setup — manual character split (no SplitText)
Before any animation, run a helper that splits both headline `h1`s into per-character `<span>`s:
```js
function splitTextIntoSpans(selector) {
  document.querySelectorAll(selector).forEach((el) => {
    el.innerHTML = el.innerText
      .split("")
      .map((c) => `<span>${c === " " ? "&nbsp;&nbsp;" : c}</span>`)
      .join("");
  });
}
splitTextIntoSpans(".header h1");
```
Each glyph becomes its own `<span>` (spaces → two `&nbsp;`). Combined with the CSS `.header h1 span { transform: translateY(200px) }`, every character starts pushed 200px down and clipped by its row mask.

### Preloader phase — three independent load tweens (fire immediately)

**1 — Preloader wipe (`delay: 5`):**
```js
gsap.to(".preloader", {
  clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
  duration: 1.5,
  delay: 5,
  ease: "power4.inOut",
});
```
After a **5s** hold, the preloader's clip-path collapses its two bottom corners up to the top edge — the whole beige panel **wipes upward off the top** over 1.5s (revealing the yellow hero beneath). Runs from t≈5.0 → t≈6.5.

**2 — Loader spin, then shrink (`delay: 1`):**
```js
gsap.to(".loader", {
  rotation: "+=180",
  duration: 1.5,
  delay: 1,
  repeat: 1,           // plays twice → two 180° half-turns, 3s total
  ease: "power4.inOut",
  onComplete: () => {
    gsap.to(".loader", {
      scale: 0,
      duration: 2,
      ease: "power4.inOut",
      onComplete: initializePageAnimations,  // hands off to the hero reveal
    });
  },
});
```
The small square starts spinning at t=1: `+=180°` with `power4.inOut`, `repeat:1` so it does the half-turn **twice** (3s of rotation, ends ~t=4). Then it scales `1 → 0` over 2s (ends ~t=6) and calls `initializePageAnimations`. So the hero reveal (below) kicks off at **t≈6**, overlapping the tail of the preloader wipe.

**3 — Emoji spawning gate:** a module-level `let isLoading = true;` is set to `false` as the very first line of `initializePageAnimations`. The `mousemove` particle spawner (below) only runs **while `isLoading` is true** — i.e. the emoji confetti is a preloader-only interaction and stops the moment the hero reveal begins.

### Hero reveal — `initializePageAnimations()` (one timeline, everything at position 0)
```js
function initializePageAnimations() {
  isLoading = false;
  const tl = gsap.timeline();

  // headline: each row's chars slide up into view, both rows in parallel
  document.querySelectorAll(".header-row").forEach((row) => {
    tl.to(row.querySelectorAll("span"), {
      y: 0,
      duration: 1,
      ease: "power4.out",
      stagger: { amount: 0.25, from: "start" },
    }, 0);
  });

  // the orbit mark pops in AND begins an endless spin, both at position 0
  tl.to(".hero-img", { scale: 1, duration: 1.5, ease: "power4.out" }, 0)
    .to(".hero-img", { rotation: 360, duration: 20, ease: "none", repeat: -1 }, 0);
}
```
- **Headline reveal:** for each `.header-row`, its character `<span>`s tween `y: 200px → 0` over **1s**, `power4.out`, `stagger { amount: 0.25, from: "start" }` (the 0.25s of stagger is distributed across that row's glyphs, left to right). Both rows are added at **position `0`**, so "The" and "Quiet Crowd" reveal simultaneously. The row `clip-path` masks each glyph until it arrives.
- **Medallion pop-in:** `.hero-img` scales `0 → 1` over **1.5s**, `power4.out`, at position `0`.
- **Medallion endless spin:** simultaneously (also position `0`) `.hero-img` tweens `rotation: 0 → 360` over **20s**, `ease:"none"` (linear), `repeat:-1` (infinite) — a slow, perpetual clockwise rotation that continues forever after the reveal settles.

### Cursor emoji confetti — `mousemove` spawner (only while `isLoading`)
Module constants and state:
```js
const mouseDistance   = 400;                 // px of travel needed to spawn
const emojiWaitTime   = 500;                 // ms a particle hangs before dropping
const emojiFallDelay  = 200;                 // ms min gap that paces sequential drops
const emojiRotations  = [90, -90];           // random initial/exit tilt
const emojiSizes      = [150, 200, 250, 300];// random chip diameter (px)
const totalEmojiVariants = 4;                // emoji-1..4
let lastMouseX = 0, lastMouseY = 0, lastEmojiTime = 0;
```

**Listener:**
```js
document.addEventListener("mousemove", (e) => {
  if (!isLoading) return;                     // preloader-phase only
  const d = Math.hypot(e.clientX - lastMouseX, e.clientY - lastMouseY);
  if (d > mouseDistance) {                     // spawn once per 400px of travel
    lastEmojiTime = createEmoji(e.clientX, e.clientY);
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }
});
```
Every time the cursor has travelled more than **400px** from the last spawn point, drop a new emoji at the current pointer position.

**`createEmoji(mouseX, mouseY)`:**
1. Pick a random `size` from `[150,200,250,300]` and a random `variant` in `1..4`.
2. Create `<div class="emoji">`; set inline `width`/`height` = `size`px, `backgroundImage = url(/assets/emoji-${variant}.png)`, and position it centered on the cursor: `left = mouseX - size/2`, `top = mouseY - size/2` (px). Append to `.emojis`.
3. Pick `initialRotation` randomly from `[90, -90]`.
4. Compute a pacing delay so rapid spawns don't all drop at once:
   `delayFromLast = Math.max(0, emojiFallDelay - (Date.now() - lastEmojiTime)) / 1000` (seconds).
5. `gsap.set(emoji, { scale: 0, rotation: initialRotation })` — starts invisible and tilted.
6. Two-step timeline:
   ```js
   gsap.timeline()
     .to(emoji, {                       // POP IN
       scale: 1, rotation: 0,
       duration: 0.5,
       ease: "back.out(1.75)",          // bouncy overshoot
     })
     .to(emoji, {                       // HANG, THEN DROP
       y: window.innerHeight + size,    // falls fully off the bottom
       rotation: initialRotation,       // tilts back as it falls
       duration: 0.5,
       ease: "power2.in",               // accelerating fall
       delay: emojiWaitTime / 1000 + delayFromLast,  // 0.5s + pacing
       onComplete: () => emoji.remove(),// unmount when off-screen
     });
   ```
   So each chip springs up from `scale 0` to `1` while un-tilting to `0°` (`back.out(1.75)`, 0.5s), hangs ~0.5s (plus pacing), then falls straight down past the viewport bottom (`y: innerHeight + size`) while re-tilting to its `initialRotation`, accelerating (`power2.in`), and removes itself on completion.
7. Return `Date.now()` (stored as `lastEmojiTime` for the pacing math).

### Timeline summary (approximate seconds)
| t (s) | what |
|------|------|
| 0–1  | idle; cursor movement spawns emoji confetti (pop-in `back.out`, hang, drop) |
| 1–4  | loader square spins `+=180°` twice (`power4.inOut`) |
| 4–6  | loader scales `1 → 0` (`power4.inOut`) |
| 5–6.5 | preloader clip-path wipes upward off the top (`power4.inOut`) |
| ~6   | `isLoading=false` (emojis stop); hero reveal timeline starts |
| 6–7  | headline chars slide up `y:200→0`, both rows, stagger 0.25, `power4.out` |
| 6–7.5 | orbit mark scales `0 → 1` (`power4.out`) |
| 6 →∞ | orbit mark rotates `0 → 360` linearly, `repeat:-1` (endless) |

### Ease reference
- Preloader wipe, loader spin, loader shrink: **`power4.inOut`**.
- Headline char reveal and orbit-mark scale-in: **`power4.out`**.
- Medallion infinite spin: **`none`** (linear).
- Emoji pop-in: **`back.out(1.75)`**; emoji fall: **`power2.in`**.

## Assets / images
All PNGs on transparent (or square) backgrounds; the emoji stickers are cover-cropped inside circular chips, everything else is `object-fit:contain`/`cover` as noted.

- **The orbit mark is not an image file** — it is the inline SVG shown above (concentric circles, three crossed ellipses, a meridian line and a green centre dot, drawn in the page ink `#16150c` with one green `#0f7a5f` ring). Being vector is what lets it spin forever without softening. Any bold, radially symmetrical square graphic works in its place; if you use a raster one, keep the interior transparent so the yellow shows through.
- **`logo.png`** — 1 small **wide (~2:1)** brand lockup illustration for the centered nav logo. Reference: a flat editorial illustration of a figure in a trench coat and glasses pointing. Any compact horizontal wordmark/illustration works.
- **`menu-btn.png`** — 1 small **square** icon for the top-right menu button. Reference: a glossy 3D inflated balloon letter. Any playful square icon works.
- **`emoji-1.png … emoji-4.png`** — **4 square (1:1) sticker graphics**, a deliberately mixed set of playful 3D and flat illustrations (e.g. a chrome star, a holographic blob, flat-illustrated characters). Each is displayed cover-filling a circular chip, so any square image works; they're spawned at random.
- **`cursor.svg`** — 1 custom **circular cursor** graphic (~48px, 32×32 hotspot) replacing the default pointer site-wide.

If fewer than 4 emoji stickers are available, repeat to fill the set.

## Behavior notes
- **Autoplay once** on load; total intro ≈ 6.5s to the hero, then the orbit mark spins forever. No scroll, no click triggers.
- **Emoji confetti is preloader-only** and **desktop/pointer-only** — it requires `mousemove` and stops permanently once `isLoading` flips to `false` at the start of the hero reveal. No touch handling (not mobile-safe).
- `.emojis` overlay is `pointer-events:none` and `overflow:hidden` — particles never block interaction and are clipped to the viewport; each self-removes after falling off-screen.
- Keep the `will-change` hints (`clip-path` on `.preloader`, `transform` on `.loader`, `.hero-img`, and `.emoji`) — they matter for smooth clip-path and transform animation.
- No console errors expected on load; the sequence self-starts and needs no interaction to complete (interaction only adds the emoji layer).
```

## Images

This component ships with 8 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/the-happy-few/cursor.svg
https://motionprompts.dev/c/the-happy-few/emoji-1.png
https://motionprompts.dev/c/the-happy-few/emoji-2.png
https://motionprompts.dev/c/the-happy-few/emoji-3.png
https://motionprompts.dev/c/the-happy-few/emoji-4.png
https://motionprompts.dev/c/the-happy-few/hero-2.png
… 2 more under https://motionprompts.dev/c/the-happy-few/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--ink-soft`, `--line`, `--rubric`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the
page with `document.querySelector`, and never has to undo itself. React withdraws all three of
those guarantees at once, and it does it quietly — the component renders, looks right for a
moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before
anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two
of everything: two triggers on the same element disagreeing about the same scrub, two smooth
scrollers pulling on the same wheel event. The visible symptom is jitter or doubled speed, and
it will not reproduce in a production build, because React only does the double mount in
development. Treat the cleanup as part of the effect, not as an afterthought.

*(1) The entry point* — The script runs at the top level, the moment the module is evaluated. In
React that is import time — before your component has rendered anything — so the elements it
looks for do not exist yet. Move the body into a `useEffect` with an empty dependency array. Do
**not** leave it in the component body: that re-runs on every render.

*(2) Element lookups* — Every `document.querySelector` in the code above assumes this component
owns the document. Give the component a root `ref`, render it on the outermost element, and
scope every lookup to it. Unscoped selectors are not a style problem here: during the StrictMode
remount two copies of the subtree exist for an instant, and an unscoped selector will bind to
the one that is on its way out.

*(3) Cleanup* — Wrap every tween and trigger this component creates in a `gsap.context` scoped
to the root ref, and revert that context in the cleanup. The context records everything GSAP
creates inside it, so one call undoes the tweens, the triggers and the inline styles GSAP wrote,
in one step:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* the effect exactly as described above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

**No prometas más de lo que el contexto registra.** `ctx.revert()` deshace lo que se creó
durante la pasada síncrona de la factory o dentro de un `self.add(...)`, y nada más. Enumera lo
que el revert cubre y lo que hay que deshacer a mano, y que las dos listas cuadren con el código
del ejemplo.

Without the revert, the StrictMode remount leaves a second trigger on the same element and both
stay subscribed to the scroll. Registering the plugin (`gsap.registerPlugin`) belongs at module
scope, not inside the effect — registering it repeatedly is harmless but pointless.

**Si necesitas `ctx.add(...)`, usa el parámetro `self`, nunca la variable `ctx`**:

```jsx
// MAL: gsap.context ejecuta la factory de forma SINCRONA, antes de que `const ctx` quede
// asignada, asi que `ctx` esta en su zona muerta temporal y esto lanza
// "Cannot access 'ctx' before initialization" — y con ello se cae el arbol entero.
// const ctx = gsap.context(() => {
//   ctx.add("runExit", () => { /* ... */ });
// }, rootRef);

// BIEN: la factory recibe el propio contexto como argumento.
const ctx = gsap.context((self) => {
  self.add("runExit", () => { /* ... */ });
}, rootRef);
```

**La regla es absoluta: en los ejemplos nunca se escribe `ctx.add(`, siempre `self.add(`.** La
tentación es decir «solo es un error dentro de la pasada síncrona; desde un callback diferido
vale». Es falso: **ScrollTrigger invoca `onEnter` de forma síncrona al crear o refrescar el
trigger**, todavía dentro de la factory, así que `onEnter: () => ctx.add(...)` revienta igual.
Con `self` no hay excepciones que recordar.

**Y `self.add` tiene DOS sobrecargas que no hacen lo mismo:**

```jsx
// UN argumento función: la ejecuta AHORA MISMO, dentro del contexto. No devuelve un
// envoltorio, y a tu función le pasa el propio contexto como primer parámetro — no tus
// argumentos. Sirve para atribuir al contexto algo que estás creando en este instante.
self.add(() => { /* se ejecuta ya */ });

// NOMBRE + función: registra el método como `self.nombre` / `ctx.nombre` y lo devuelve, para
// llamarlo MÁS TARDE desde un listener. Esto es lo que se quiere para los handlers diferidos.
self.add("expand", (item) => { /* se ejecuta cuando alguien llame a ctx.expand(item) */ });
// ...
card.addEventListener("click", () => ctx.expand(card));
```

Confundirlas produce un fallo desconcertante: `const expand = self.add((item) => …)` se ejecuta
**al montar**, con `item` valiendo el contexto de GSAP, así que la primera línea que trate `item`
como un elemento revienta (`item.querySelector is not a function`) y se lleva el árbol por
delante. Lo único que se nombra como `ctx` es `ctx.revert()` en la limpieza.

**`gsap.ticker.add` is not covered by the context.** The context records tweens and triggers; a
ticker subscription is neither, so `ctx.revert()` leaves it running. Keep the exact function
reference you passed and call `gsap.ticker.remove(fn)` in the same cleanup.

---

**This component's preloader→hero handoff is a chain of tweens created inside `onComplete`
callbacks, not inside the `gsap.context` factory's synchronous pass — which is exactly the gap
`ctx.revert()` does not cover.** The `.loader` spin tween (`rotation: "+=180"`, `repeat: 1`) is
created synchronously, so the context does track it, and reverting early does kill it before its
`onComplete` fires. But the two tweens *that `onComplete` builds* — the loader's scale-to-zero,
and everything `initializePageAnimations` creates (the `.header-row` character stagger, the
`.hero-img` scale-in, and its endless `rotation: 0 → 360` spin with an infinite repeat) — are
created later, at the moment the spin tween actually finishes. That moment is not a synchronous
call the context can see, so those tweens are never registered. Unmount between the spin
finishing and the shrink tween finishing, and `ctx.revert()` has nothing to revert: the shrink
tween keeps shrinking a loader with no parent document, then still calls
`initializePageAnimations`, which starts the orbit mark's endless rotation on a detached node —
a tween with no ceiling on its `repeat`, running for the remaining life of the tab.

Fix it by wrapping both creation points in the immediately-invoked `self.add(() => { … })` form,
so each nested tween is attributed to the context at the moment it is actually built, not at the
moment the factory ran:

```jsx
useEffect(() => {
  const ctx = gsap.context((self) => {
    // preloader wipe, .loader tween below, and the manual header split all run here,
    // in the factory's synchronous pass

    gsap.to(".loader", {
      rotation: "+=180",
      repeat: 1,
      onComplete: () => {
        // this fires later, once the spin finishes — outside the synchronous pass, so
        // whatever it builds needs self.add to be swept by ctx.revert()
        self.add(() => {
          gsap.to(".loader", {
            scale: 0,
            onComplete: () => self.add(() => initializePageAnimations()),
          });
        });
      },
    });
  }, rootRef);

  return () => ctx.revert();
}, []);
```

**The `mousemove` spawner has the same shape, triggered by an event instead of chained through
`onComplete`.** Every call to `createEmoji` builds a two-step timeline — pop in with the
overshoot ease, hang, then fall off the bottom of the screen — from inside the `mousemove`
listener, which again runs outside the factory's synchronous pass. Wrap the body of
`createEmoji` in the same `self.add(() => { … })` so a chip mid-fall is swept by `ctx.revert()`
on unmount, instead of finishing its fall and calling `emoji.remove()` against a component that
is already gone.

**The context does not know about the emoji `<div>`s themselves.** They are plain
`document.createElement` nodes appended into `.emojis`, not GSAP-created objects, so wrapping
their tweens in `self.add` stops the animation but leaves the element sitting in the DOM if a
chip is mid-flight at unmount. Keep the explicit sweep the vanilla teardown already does —
query `.emoji` under the root ref and remove each node — in the `useEffect` cleanup, after
`ctx.revert()`.

**The character split is hand-rolled, not the `SplitText` plugin, but it needs the same
revert-before-re-split discipline.** `splitTextIntoSpans` overwrites each `.header h1`'s
`innerHTML`; run it twice without restoring the original text first, and the second pass splits
the already-split `<span>`s into fragments of markup instead of letters. Capture each header's
original `innerHTML` before splitting — the vanilla version already does this — and restore it
synchronously in the cleanup function, so a StrictMode remount starts from the real headline
text instead of the first mount's leftovers, and do it outside `ctx.revert()`: reverting the
context undoes tweens and inline styles, not markup you rewrote by hand.

**`isLoading`, `lastMouseX`, `lastMouseY` and `lastEmojiTime` want to be refs, not state.** They
are read and written from inside the `mousemove` handler and from GSAP's own callback network on
every pointer move, never to drive a render — routing them through `useState` would either
re-render on every qualifying mouse move or read a stale value from a closure captured before
the last update. A `useRef` per value keeps the read-modify-write in `onMouseMove` synchronous
and re-render-free, matching what the module-level `let` bindings already do outside React.
