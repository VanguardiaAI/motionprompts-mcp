---
slug: lottie-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 2
structural:
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Lottie Scroll Animation (Scroll-Scrubbed Full-Screen Lottie Hero)

## Goal
Build a cinematic, full-viewport hero whose background is a **Lottie animation scrubbed frame-by-frame by scroll position**. A fixed, full-screen Lottie (a movie exported to a JSON of embedded frames) sits behind the page; a **GSAP ScrollTrigger with `scrub` tweens a virtual playhead from frame 0 to the Lottie's last frame**, calling `goToAndStop` on every update, so the clip plays forward as you scroll down and reverses as you scroll up — never autoplaying on its own. A tall `gradient` section wipes the fixed animation to black, and normal black website content scrolls up over it. A slowly-jittering film-grain overlay and a `saturate(2)` filter give it a warm, analog, cinematic finish.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`gsap` (npm)** with the **`ScrollTrigger`** plugin, plus **`lottie-web`** for the Lottie player. No Lenis, no other plugins.
```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import lottie from "lottie-web";

gsap.registerPlugin(ScrollTrigger);
```
Everything runs inside a `DOMContentLoaded` listener. There is exactly **one tween** (a `gsap.to` on a playhead object) whose motion is entirely scroll-driven — the Lottie is loaded with `autoplay:false`, `loop:false`, so nothing moves except via scroll.

## Layout / HTML
```html
<body>
  <nav>
    <div class="logo"><a href="#">Motionprompts<sup>&copy;</sup></a></div>
    <div class="links">
      <a href="#">Home</a><a href="#">Work</a><a href="#">Expertise</a>
      <a href="#">Agency</a><a href="#">Jobs</a><a href="#">Contact</a>
    </div>
  </nav>

  <section class="lottie-container">
    <div class="animation"></div>        <!-- the Lottie mounts here; JS injects the SVG -->
  </section>

  <section class="gradient"></section>   <!-- transparent→black wipe over the fixed Lottie -->

  <section class="website-content">
    <div class="end-lottie"></div>       <!-- invisible 1px marker = ScrollTrigger endTrigger -->
    <h1>Your website content goes here</h1>
    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus magnam est, fuga earum repudiandae aliquid corrupti repellendus nesciunt culpa ipsam possimus cupiditate veritatis minima, ratione itaque…</p>
  </section>
  <script type="module" src="./script.js"></script>
</body>
```
The class names `.animation`, `.end-lottie` (and the sections `.gradient`, `.website-content`) are what the JS/CSS query — keep them exact. `.animation` is where lottie-web mounts the rendered SVG; `.end-lottie` is a zero-content marker used only to define where the scroll scrub finishes.

## Styling
Font family `"PP Neue Montreal"` (a tight modern grotesk; if unavailable fall back to a neutral geometric/grotesk sans like Helvetica/Arial). Everything sits on pure black `#000`, text white `#fff`.

- Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`.
- `body { width:100%; height:500vh; background:#000; font-family:"PP Neue Montreal"; }` — **the page is 5 viewport-heights tall; that scroll length is the scrub track.**
- `h1 { font-size:80px; font-weight:500; letter-spacing:-0.02em; margin:0.25em 0; }`.
- `p { width:80%; font-size:24px; font-weight:400; line-height:175%; }`.
- `nav`: `position:fixed; top:0; width:100vw; padding:2em; display:flex; justify-content:space-between; align-items:flex-start; z-index:2;`. `.links { display:flex; align-items:center; gap:2em; }`. `nav a { text-decoration:none; color:#fff; font-weight:500; }`. `.logo a { font-size:28px; }`, its `sup` is `position:relative; top:-2px; font-size:14px;`.
- **`.lottie-container .animation`** (the Lottie stage): `position:fixed; top:0; width:100vw; height:100vh; z-index:-1; filter:saturate(2);` — pinned behind everything, full-screen, colors boosted. Because it is fixed with `z-index:-1`, it never moves; only its frames change.
- **Grain overlay** — `.animation:after`: `content:""; background-image:url("noise.png"); position:fixed; top:0; left:0; width:200%; height:200%; opacity:0.1; animation:animateGrain 8s steps(10) infinite;`. The `animateGrain` keyframes jitter `transform:translate()` in stepped hops between roughly `(-5%,-10%)` and `(-15%,-20%)` across 0→100% (10 stepped stops), giving a restless film-grain shimmer.
- **`.gradient`**: `position:relative; width:100vw; height:200vh; z-index:1; background:linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%);` — 2 viewport-heights tall; **transparent at its top (Lottie shows through) fading to solid black at its bottom**, so scrolling gradually curtains the fixed animation to black.
- **`.website-content`**: `position:relative; width:100%; height:300vh; padding:2em; background:#000; color:#fff; z-index:1;` — 3 viewport-heights of normal black content that scrolls up over the (now-hidden) Lottie.
- **`.end-lottie`**: `position:absolute; top:100vh; width:100%; height:1px;` — a 1px-tall invisible line one viewport down inside `.website-content`; it exists purely as the ScrollTrigger `endTrigger`.

Layout math: `.gradient` (200vh) + `.website-content` (300vh) = 500vh of flow, matching `body`. `.animation` and `.lottie-container` are out of normal flow (fixed).

## GSAP effect (the important part — be exhaustive)

The whole thing is a small helper, `LottieScrollTrigger(vars)`, called once on DOM ready. It loads the Lottie, then binds a scrub tween to a fake playhead.

### 1. The call site (exact config)
Inside `document.addEventListener("DOMContentLoaded", …)`:
```js
LottieScrollTrigger({
  trigger:  ".animation",
  start:    "top center",
  endTrigger: ".end-lottie",
  end: `bottom center+=${document.querySelector(".animation").offsetHeight}`,
  renderer: "svg",
  target:   ".animation",
  path:     "hero-lottie.json",   // the movie-to-lottie JSON
  scrub:    2,
});
```
Note `end` is built from a template literal: `.animation`'s `offsetHeight` is one viewport height (100vh), so the end resolves to **`"bottom center+=<innerHeight>"`** — i.e. the scrub completes when the bottom of `.end-lottie` reaches viewport-center plus one extra viewport. The scrub therefore runs across roughly the first ~300vh of scroll (all of `.gradient` plus the first third of `.website-content`), then holds on the last frame.

### 2. The helper (`LottieScrollTrigger`) — reproduce faithfully
```js
function LottieScrollTrigger(vars) {
  let playhead = { frame: 0 },
    target = gsap.utils.toArray(vars.target)[0],
    speeds = { slow: "+=2000", medium: "+=1000", fast: "+=500" },
    st = {                       // ScrollTrigger defaults, overridden by vars below
      trigger: ".trigger",
      end: speeds[vars.speed] || "+=1000",
      scrub: 1,
      markers: false,
    },
    ctx = gsap.context && gsap.context(),
    animation = lottie.loadAnimation({
      container: target,
      renderer: vars.renderer || "svg",
      loop: false,
      autoplay: false,
      path: vars.path,
      rendererSettings: vars.rendererSettings || {
        preserveAspectRatio: "xMidYMid slice",   // cover-fit, centered, cropped
      },
    });

  for (let p in vars) { st[p] = vars[p]; }        // merge caller vars over the defaults

  animation.addEventListener("DOMLoaded", function () {
    let createTween = function () {
      animation.frameTween = gsap.to(playhead, {
        frame: animation.totalFrames - 1,          // 0 → last frame (this Lottie: 0 → 99)
        ease: "none",                              // strictly linear; scroll = time
        onUpdate: () => animation.goToAndStop(playhead.frame, true), // true = value is a FRAME
        scrollTrigger: st,                         // the whole scrub config
      });
      return () => animation.destroy && animation.destroy();
    };
    ctx && ctx.add ? ctx.add(createTween) : createTween();
  });

  return animation;
}
```

### 3. Mechanics that must be exact
- **Single tween on a playhead object.** `playhead = { frame: 0 }` is a plain JS object; GSAP tweens its `frame` from `0` to `animation.totalFrames - 1`. This Lottie has **100 frames (in-point 0, out-point 100, 25 fps)**, so the playhead runs **0 → 99**.
- **`onUpdate` drives the Lottie manually.** Every tick calls `animation.goToAndStop(playhead.frame, true)`. The second arg `true` tells lottie-web the number is a **frame index, not milliseconds** — this is what makes the scrub land on discrete frames.
- **`ease: "none"`** — the frame maps linearly to scroll; all smoothing comes from `scrub`, not easing.
- **`scrub: 2`** (from the caller, overriding the default `scrub:1`) — ScrollTrigger takes **2 seconds to catch the playhead up** to the scroll position, giving a heavy, floaty, filmic lag. Reversing scroll runs the Lottie backward with the same 2s damping. Do **not** use `scrub:true` (instant) — the lag is the signature.
- **Load flags `loop:false, autoplay:false`** — the animation is inert until the scrub touches it; there is no idle playback.
- **`preserveAspectRatio:"xMidYMid slice"`** — the SVG covers the full 100vw×100vh stage (center-cropped like `object-fit:cover`), so the 16:9 frames fill any viewport.
- **`DOMLoaded` gate** — the tween is only created after lottie-web has parsed and mounted the SVG (`animation.totalFrames` isn't known before then). Wrap in `gsap.context()` when available so it can be reverted cleanly.
- The `speeds`/`st.trigger:".trigger"`/`markers:false` bits are generic defaults inside the helper; the caller's `vars` (above) override `trigger`, `start`, `end`, `endTrigger`, `scrub`, etc., so the effective ScrollTrigger is: `trigger:".animation"`, `start:"top center"`, `endTrigger:".end-lottie"`, `end:"bottom center+=<innerHeight>"`, `scrub:2`.

### 4. Net visual behavior
As you scroll from the top: the fixed full-screen Lottie plays forward (the model sweeps the fan across her face) while the `.gradient` section simultaneously fades a black curtain over it; by the time the black gradient is opaque the Lottie is fully hidden and the black `.website-content` (headline + paragraph) scrolls up in its place. Scroll back up and everything reverses — the Lottie rewinds frame-by-frame, always 2 seconds behind your input.

## Assets / images
- **1 Lottie JSON (`hero-lottie.json`)** — a **"movie-to-lottie" export: 100 layers, each an embedded 1920×1080 JPEG frame (`fr_0.jpg` … `fr_99.jpg`), 25 fps, 100 frames, 16:9.** It is effectively a short video baked into a Lottie. Content: a **cinematic studio portrait clip** — a model in a **coral/pink floral-print kimono with dark contrast sleeve linings** holds a **round red paper hand-fan (uchiwa)** and slowly sweeps it down across her face, from raised beside her head to fully covering her face, in front of a **large glowing warm-yellow spotlight circle** on a neutral warm-grey seamless backdrop. Slow, elegant, continuous motion so adjacent frames differ only slightly and the scrub reads as smooth video. Any such short, slow, warm-toned studio clip exported to a frames-based Lottie works; the `saturate(2)` CSS filter intensifies the reds/yellows.
- **1 film-grain texture (`noise.png`)** — a seamless grayscale monochrome noise/grain tile, tiled at 200% and animated as the overlay (`opacity:0.1`). Any fine photographic grain PNG works.

No real brand names — the nav wordmark is the neutral demo brand "Motionprompts©".

## Behavior notes
- **Reversible & scrub-only:** the Lottie never autoplays; it only moves with scroll and rewinds on scroll-up, always ~2s damped.
- **Lightweight & mobile-safe:** SVG renderer, one tween, no WebGL/canvas. Works down to mobile; the fixed stage uses `100vh` (swap to `100svh` if you want to avoid mobile browser-chrome clipping).
- **No SplitText, no CustomEase, no lerp loop, no Three.js, no pinning** — the only "easing" is ScrollTrigger's `scrub:2` catch-up plus the linear frame mapping.
- The grain overlay and `saturate(2)` are pure CSS and run independently of scroll.
- No explicit reduced-motion branch in the original; if desired, gate the ScrollTrigger creation behind `matchMedia("(prefers-reduced-motion: no-preference)")`.

## Images

This component ships with 2 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/lottie-scroll-animation/hero-lottie.json
https://motionprompts.dev/c/lottie-scroll-animation/noise.png
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--paper`, `--paper-dim`, `--ember`, `--amber`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a `LottieScrollTrigger(vars)` helper that wires together two independent asynchronous systems — lottie-web's own JSON fetch-and-parse cycle, and GSAP's tween/ScrollTrigger creation — from a single `DOMContentLoaded` listener that assumes it will only ever run once. React withdraws that guarantee, and this component's helper has a subtlety that makes the withdrawal more dangerous than usual: it does not create its own GSAP context, it borrows whichever one happens to be active when it runs.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen — and because `lottie.loadAnimation()` constructs its renderer and appends its `<svg>` into the container **synchronously**, before the JSON has even been requested over the network, the second mount's animation instance lands in `.animation` well before the first mount's has any chance to finish loading and reconcile itself. Without an explicit teardown, you get two `<svg>` renderers stacked in the same box and, once the first instance's JSON eventually resolves, a second scrubbed tween fighting the live one for the same `playhead`-driven `goToAndStop` calls. None of this reproduces in a production build, because only development double-invokes effects.

*(1) The entry point* — The script listens for `DOMContentLoaded` with no `readyState` guard. That event has already fired by the time a React component mounts, so `LottieScrollTrigger(...)` is never called and the hero never scrubs — no error, nothing to see. Delete the listener, drop the `document.querySelectorAll(".animation")` truthiness check (a mounted ref is guaranteed to exist), and call `LottieScrollTrigger` directly from a `useEffect` with an empty dependency array. `gsap.registerPlugin(ScrollTrigger)` is already outside that block, at module scope; leave it there.

*(2) Element lookups* — Three separate lookups assume one global `.animation`: the mount check above, `document.querySelector(".animation").offsetHeight` used to build the `end` string, and the `trigger`/`target`/`endTrigger` values passed into the helper as the selector strings `".animation"` and `".end-lottie"`. Give the component a root ref for the fixed Lottie stage and a second ref for the zero-height `.end-lottie` marker, then pass the elements themselves — `animationRef.current`, `endLottieRef.current` — instead of selector strings; `gsap.utils.toArray` and ScrollTrigger's `trigger`/`endTrigger` both accept a node directly, so this sidesteps any question of whether the string would resolve inside or outside this instance's subtree. Read `offsetHeight` off the same ref rather than re-querying the document.

*(3) Cleanup* — Wrap the call to `LottieScrollTrigger` in a `gsap.context` scoped to the root ref and revert it in the cleanup, exactly as the general rule above says — but here that wrapping is not just good hygiene, it is the only thing that gives the helper anything to register with. Look at what `ctx = gsap.context && gsap.context()` actually does inside the helper: called with **no** arguments, `gsap.context()` does not construct a new context, it returns whichever context is currently active on the call stack. Called synchronously inside your effect's `gsap.context(() => { LottieScrollTrigger(vars); }, rootRef)`, that ambient lookup correctly captures your outer context — but call `LottieScrollTrigger` unwrapped, the way the standalone script does, and `ctx` is `undefined`, so the `ctx && ctx.add ? ctx.add(createTween) : createTween()` branch falls through to a bare `createTween()`: the tween, its ScrollTrigger and the lottie instance all get created with no revert path whatsoever, on every single mount.

### The lottie instance is not a GSAP object, and it exists before its own data does

`gsap.context`'s revert only ever undoes tweens, timelines and triggers — never the `AnimationItem` `lottie.loadAnimation()` returns. The helper's only attempt at covering that gap is the function `createTween` returns (`() => animation.destroy && animation.destroy()`), which `ctx.add()` registers as a custom cleanup — but only once `animation`'s `DOMLoaded` event fires, and that event waits on a network fetch and parse of a full frame-by-frame video export, not a small file. A StrictMode remount happens on the same tick; the fetch does not. So on unmount, `ctx.revert()` runs against a context that never received that cleanup function, `animation.destroy()` is never called, and the `<svg>` this instance already appended (synchronously, at `loadAnimation()` time, independent of whether the JSON has arrived) is left behind in `.animation` for the next mount's instance to sit on top of. Do not depend on the helper's own deferred registration for this: call `animation.destroy()` unconditionally from the effect's cleanup, at teardown time, regardless of whether `DOMLoaded` has fired yet. It is always safe to call — the renderer it tears down is constructed the moment `loadAnimation()` returns, before any network round trip.

### Guard the `DOMLoaded` callback itself, not just the instance

There is a second failure mode past the one above: if `DOMLoaded` fires **after** your `ctx.revert()` has already run, the helper's `ctx.add(createTween)` call still executes — against a context whose internal bookkeeping was already cleared by that revert. The tween and ScrollTrigger it creates get produced and pushed into that dead context's arrays, but nothing will traverse those arrays again; no future revert reaches them. The result is a scrub loop that outlives the component and keeps calling `goToAndStop` on a `renderer` you already tore down in the paragraph above. Give the effect a `cancelled` flag, set it in the same cleanup that calls `animation.destroy()`, and check it at the top of the `DOMLoaded` handler before `ctx.add(createTween)` runs — if the flag is set, skip tween creation entirely rather than letting it register into a context that can no longer do anything with it:

```jsx
useEffect(() => {
  let cancelled = false;
  const ctx = gsap.context(() => {
    LottieScrollTrigger({
      trigger: animationRef.current,
      start: "top center",
      endTrigger: endLottieRef.current,
      end: `bottom center+=${animationRef.current.offsetHeight}`,
      renderer: "svg",
      target: animationRef.current,
      path: "/c/lottie-scroll-animation/hero-lottie.json",
      scrub: 2,
      isCancelled: () => cancelled, // checked inside the DOMLoaded handler before ctx.add(createTween)
    });
  }, rootRef);
  return () => {
    cancelled = true;
    ctx.revert();
  };
}, []);
```
