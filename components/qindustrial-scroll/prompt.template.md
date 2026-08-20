---
slug: qindustrial-scroll
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 7
structural:
  - { kind: duration, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"none\"", rule: ease/scrub-linear }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Lenis Smooth Scroll + ScrollTrigger — Expanding Service-Row Thumbnails

## Goal
Build a long, smooth-scrolling page with a full-screen photo hero, a black "All Services" list section, and a full-screen photo footer. The star effect is in the services list: it is a stack of thin service rows, and **as each row scrolls up into view its small thumbnail expands from 30% to 100% width while the row itself grows in height from 150px to 450px**, driven by two per-row scrubbed ScrollTriggers. Scrolling is smoothed by Lenis synced to GSAP's ticker, and the per-row triggers are created **lazily** the first time each row enters the viewport (via an IntersectionObserver).

## Tech
Vanilla HTML/CSS/JS with ES module imports, in a fresh Vite project. Install and import from npm:
- **`gsap`** (3.x) plus the plugin **`ScrollTrigger`**.
- **`lenis`** — smooth scroll, wired into GSAP's ticker.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);
```

No other GSAP plugins, no SplitText, no CustomEase, no Three.js, no framework. Run all setup inside `document.addEventListener("DOMContentLoaded", …)`.

## Layout / HTML
One `.container` wrapping three stacked blocks in order: a `.hero` section, a `.services` section, and a `.footer` section. Class names are load-bearing — the JS queries `.service` and `.img`.

```html
<div class="container">
  <section class="hero"></section>

  <section class="services">
    <div class="services-header">
      <div class="col"></div>
      <div class="col"><h1>All Services</h1></div>
    </div>

    <div class="service">
      <div class="service-info">
        <h1>Custom Web Development</h1>
        <p>We provide bespoke web development solutions tailored to your business needs. Our team ensures top-notch performance and scalability.</p>
      </div>
      <div class="service-img">
        <div class="img"><img src="…thumb-1" alt="" /></div>
      </div>
    </div>

    <!-- 4 more identical .service rows, see copy below -->
  </section>

  <section class="footer"></section>
</div>

<script type="module" src="./script.js"></script>
```

- **Five `.service` rows.** Each row is: a `.service-info` column (an `<h1>` title on top, a `<p>` description below, pushed apart top/bottom) + a `.service-img` column that contains a single `.img` wrapper with one `<img>`.
- `.hero` and `.footer` are **empty** sections — their imagery comes entirely from CSS `background`.
- The `.services-header` has two `.col`s: the first is an empty spacer, the second holds the `<h1>` "All Services".
- Neutral corporate copy (no brands). The five rows, in order — title / description:
  1. **Custom Web Development** — "We provide bespoke web development solutions tailored to your business needs. Our team ensures top-notch performance and scalability."
  2. **Mobile App Development** — "Crafting intuitive and engaging mobile applications for both Android and iOS platforms. Enhance your user experience with our expert team."
  3. **Digital Marketing** — "Comprehensive digital marketing services to boost your online presence. From SEO to social media campaigns, we cover it all."
  4. **Cloud Solutions** — "Reliable and secure cloud solutions to streamline your business operations. Leverage the power of the cloud with our expertise."
  5. **IT Consultancy** — "Expert IT consultancy services to guide your business through digital transformation. Optimize your IT infrastructure with our insights."

## Styling
Font: **"PP Neue Montreal"** (a clean neutral grotesque) on `html, body`; fall back to a system sans-serif if unavailable.

Reset & base:
- `* { margin:0; padding:0; box-sizing:border-box; }`
- `.container { width:100%; height:100%; }`
- `h1 { color:#fff; font-size:36px; font-weight:500; }`
- `p  { color:#fff; font-size:15px; font-weight:400; line-height:150%; }`
- `img { width:100%; height:100%; object-fit:cover; }`

Sections:
- `.hero { width:100vw; height:100vh; background:url(…hero) no-repeat 50% 50%; background-size:cover; padding:2em; }`
- `.footer { width:100%; height:100vh; background:url(…footer) no-repeat 50% 50%; background-size:cover; }`
- `.services { background:#000; padding:8em 2em; display:flex; flex-direction:column; }` — the list sits on a **pure black** background between the two photo panels.

Services header:
- `.services-header { width:100%; display:flex; gap:4em; }`
- `.services-header .col:nth-child(1) { flex:2; }` (empty spacer, matches the 2/5 column split below)
- `.services-header .col:nth-child(2) { flex:5; padding:1em; }` ("All Services" heading, left-aligned over the image column)

Service rows (**the structure the effect hangs on**):
- `.service { display:flex; gap:2em; height:150px; border-top:1px solid rgba(255,255,255,0.2); }` — every row starts **150px tall** with a faint 1px top divider (so rows read as a ruled list).
- `.service-info { flex:2; width:100%; height:100%; display:flex; flex-direction:column; justify-content:space-between; padding:1em; }` (title top, description bottom)
- `.service-img { flex:5; width:100%; height:100%; padding:1em; }` — the image column is **2.5× wider** than the text column (flex 5 vs 2).
- `.img { width:30%; height:100%; border-radius:10px; overflow:hidden; }` — **the thumbnail starts at 30% of the image column's width and full row height**, with rounded corners and clipped overflow. This 30% start width and the 150px row height are the two values the GSAP effect animates.

### Lenis recommended CSS (include verbatim — one line is critical)
```css
html.lenis, html.lenis body { height: 500vh; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }
.lenis.lenis-smooth iframe { pointer-events: none; }
```
**`html.lenis, html.lenis body { height: 500vh; }` is essential.** Lenis stamps the classes `lenis lenis-smooth` onto `<html>` when it initializes, which activates this rule and forces the document to **500 viewport-heights tall**. That long runway is what gives every row a generous scroll distance for its width/height scrub — without it the page would be far too short for the effect to read.

## GSAP effect (the important part — be exhaustive)

### 1) Smooth-scroll wiring (Lenis ↔ GSAP ticker)
```js
const lenis = new Lenis();               // default options
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```
Lenis is driven by GSAP's ticker (so `lenis.raf` is called each frame with `time*1000`), every Lenis scroll event calls `ScrollTrigger.update`, and lag smoothing is disabled so the scrub stays glued to the scroll position. (The original also has a debug `lenis.on("scroll", (e)=>console.log(e))` — omit it to keep the console clean.)

### 2) Lazy per-row trigger creation via IntersectionObserver
Collect the rows and observe them; only when a row first becomes ~10% visible do we build its two ScrollTriggers, then stop observing it:
```js
const services = gsap.utils.toArray(".service"); // the 5 rows

const observerOptions = { root: null, rootMargin: "0px", threshold: 0.1 };

const observerCallback = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const service = entry.target;
      const imgContainer = service.querySelector(".img");

      /* --- Trigger A + Trigger B created here (see below) --- */

      observer.unobserve(service); // create each row's triggers exactly once
    }
  });
};

const observer = new IntersectionObserver(observerCallback, observerOptions);
services.forEach((service) => observer.observe(service));
```
So the triggers are built **just-in-time**, once per row, the moment the row scrolls into view. Reproduce this lazy pattern (not an up-front loop) for identical behavior.

### 3) Trigger A — thumbnail width 30% → 100% (scrubbed)
```js
ScrollTrigger.create({
  trigger: service,
  start: "bottom bottom",   // row's bottom edge reaches the viewport bottom
  end:   "top top",         // row's top edge reaches the viewport top
  scrub: true,
  onUpdate: (self) => {
    const progress = self.progress;          // 0 → 1
    const newWidth = 30 + 70 * progress;     // 30% → 100%
    gsap.to(imgContainer, {
      width: newWidth + "%",
      duration: 0.1,
      ease: "none",
    });
  },
});
```
As the row travels from "its bottom at the viewport bottom" up to "its top at the viewport top", the `.img` wrapper **grows linearly from 30% to 100% width**, so the thumbnail expands rightward to fill the whole image column.

### 4) Trigger B — row height 150px → 450px (scrubbed)
```js
ScrollTrigger.create({
  trigger: service,
  start: "top bottom",      // row's top edge enters at the viewport bottom
  end:   "top top",         // row's top edge reaches the viewport top
  scrub: true,
  onUpdate: (self) => {
    const progress = self.progress;          // 0 → 1
    const newHeight = 150 + 300 * progress;  // 150px → 450px
    gsap.to(service, {
      height: newHeight + "px",
      duration: 0.1,
      ease: "none",
    });
  },
});
```
Over the row's top edge crossing the full viewport (bottom → top), the `.service` row **grows linearly from 150px to 450px tall**. Because `.img` is `height:100%`, the thumbnail gets taller as the row grows, and simultaneously wider via Trigger A — the two combine so the thumbnail blooms open as the row rises.

### Exact mechanics to reproduce
- **Two independent ScrollTriggers per row**, both `scrub: true` (bound directly to scroll, no numeric catch-up). They target the same row but have **different start points**: Trigger B (height) starts earlier at `top bottom`; Trigger A (width) starts later at `bottom bottom`; both end at `top top`. So the height begins growing as soon as the row's top peeks in, and the width expansion kicks in a little later once the row's bottom clears the viewport bottom.
- **Not `gsap.set` — a tiny `gsap.to`.** Each `onUpdate` fires a `gsap.to(..., { duration: 0.1, ease: "none" })`, i.e. a 0.1s linear catch-up tween toward the freshly computed value every frame. This adds a subtle smoothing/lag on top of the scrub + Lenis (do not replace it with an instantaneous `gsap.set`).
- **Linear everywhere.** `ease: "none"`; the value maps are plain linear formulas (`30 + 70*p`, `150 + 300*p`). No easing curve, no stagger, no timeline, no labels, no delay.
- **No SplitText, no CustomEase, no manual lerp/rAF loop, no Three.js.** Lenis owns the rAF loop through `gsap.ticker`; ScrollTrigger owns the scroll mapping.

Net read: a black ruled list where each row, as you scroll it up the screen, simultaneously **stretches taller (150→450px) and its rounded thumbnail widens (30%→100%)** to fill the row — a calm, corporate, scroll-scrubbed image reveal, one row after another, all under Lenis smooth scroll.

## Assets / images
Seven photographs total, all `object-fit:cover` / `background-size:cover` (so exact source aspect is flexible — cover-crop handles it). Use a cohesive set of **moody, richly-colored editorial photographs** (mixed subjects, saturated color on dark or neutral backgrounds — abstract art-direction, NOT literal depictions of the service titles).

- **Hero background** (1 image, landscape ~3:2): full-bleed atmospheric macro — e.g. pale golden botanical sprouts against a deep indigo/violet bokeh. Fills the top `.hero` viewport.
- **Five row thumbnails** (`.service .img`, in row order): landscape-to-square editorial photos, cover-cropped into the expanding rounded frame (frame aspect changes live from a narrow 30%-wide sliver to a full-width band as it animates):
  1. sepia/beige portrait — a figure covering their face with both hands wearing many chunky silver rings (~3:2).
  2. warm copper/bronze macro of curled dried autumn leaves on a dark ground (~16:9).
  3. tight close-up of a black panther's face with pale eyes on a soft grey ground (**1:1 square**).
  4. two cream/ivory moths in flight against a deep maroon velvet ground (~3:2).
  5. three purple bearded irises against a deep red tiled ground (~3:2).
- **Footer background** (1 image, portrait ~3:4): full-bleed still-life — e.g. an ornate spoon holding amber rock-sugar crystals against a dark teal-blue ground. Fills the closing `.footer` viewport.

Any cohesive moody-editorial photo set works; provide the images in the order above. If fewer thumbnails are available than 5 rows, repeat in order.

## Behavior notes
- **Trigger:** scroll only, fully scrubbed. Parking the scroll freezes each row mid-expansion; scrolling back up reverses it. Nothing autoplays.
- **Lazy init:** a row's two triggers don't exist until it first intersects the viewport (threshold 0.1), then it's `unobserve`d so they're created exactly once. Keep this — creating all triggers up front changes the exact progress mapping for the first rows.
- **The `500vh` document height** (applied via the `html.lenis` class Lenis adds) is what supplies the long scroll runway; keep the Lenis CSS block intact.
- **No reduced-motion guard and no `invalidateOnRefresh`** in the original — desktop-first; the `end`/`start` are resolved by ScrollTrigger from element position. The layout is a simple 2/5 flex split that holds up down to tablet widths.

## Images

This component ships with 7 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/qindustrial-scroll/footer.jpg
https://motionprompts.dev/c/qindustrial-scroll/hero.jpg
https://motionprompts.dev/c/qindustrial-scroll/img1.jpg
https://motionprompts.dev/c/qindustrial-scroll/img2.jpg
https://motionprompts.dev/c/qindustrial-scroll/img3.jpg
https://motionprompts.dev/c/qindustrial-scroll/img4.jpg
… 1 more under https://motionprompts.dev/c/qindustrial-scroll/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-soft`, `--bone`, `--bone-dim`, `--bone-faint`, `--amber`, `--oxblood`, `--line`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the hero and footer render fine, and it's the row-by-row thumbnail bloom in the middle that breaks, in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything here: two `Lenis` instances both feeding `lenis.raf` off the same ticker, two `IntersectionObserver`s watching the same five `.service` rows, and — for whichever rows have already scrolled into view during that first, discarded mount — two pairs of scrubbed `ScrollTrigger`s fighting over the same row's width and height. The visible symptom is a thumbnail that snaps between two sizes as you scroll, or a row whose height scrub runs at double speed, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

**(1) The entry point.** The script waits for `DOMContentLoaded`. By the time a React component mounts, that event has already fired, so the listener body never runs — not the `Lenis` instance, not the ticker wiring, not the `IntersectionObserver`, not one of the five rows' eventual triggers. No error, just five `.service` rows sitting at their CSS-authored starting size forever. Delete the listener and move its body into a `useEffect` with an empty dependency array.

**(2) Element lookups.** `gsap.utils.toArray(".service")` walks the whole document; scope it to the component instead — `gsap.utils.toArray(".service", rootRef.current)` — with the root ref on the outer `.container` that wraps the hero, the services list and the footer. `service.querySelector(".img")` inside the observer callback is already scoped to the row `entry.target` closes over, so that lookup is fine as written.

**(3) Cleanup.** The tricky part of this component isn't the triggers themselves, it's *when* they get built: each row's pair of `ScrollTrigger`s is created lazily, inside the `IntersectionObserver` callback, the first time that row crosses 10% visible — which for most of the five rows happens well after the effect's synchronous pass has already finished, whenever the user actually scrolls that far down the 500vh page. That timing is exactly what decides whether `gsap.context` can undo them.

```jsx
useEffect(() => {
  let lenis;
  let tick;
  let observer;

  const ctx = gsap.context((self) => {
    lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const services = gsap.utils.toArray(".service", rootRef.current);

    observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const service = entry.target;
        const imgContainer = service.querySelector(".img");
        self.add(() => {
          // Trigger A (width, on imgContainer) and Trigger B (height, on service) — unchanged from above
        });
        obs.unobserve(service);
      });
    }, { root: null, rootMargin: "0px", threshold: 0.1 });

    services.forEach((service) => observer.observe(service));
  }, rootRef);

  return () => {
    observer?.disconnect();
    gsap.ticker.remove(tick);
    lenis?.destroy();
    ctx.revert();
  };
}, []);
```

- **Wrap each row's pair of `ScrollTrigger.create()` calls in `self.add(...)`, not a bare call.** `ctx.revert()` only undoes what ran during the factory's synchronous pass or inside a `self.add(...)` call — and for this component almost none of the five rows' triggers are built during that synchronous pass, since a row's `IntersectionObserver` entry usually fires long after mount. Call the two `ScrollTrigger.create()`s for that row through `self.add(() => { … })` from inside the observer callback; `self` is a plain closed-over parameter captured when the factory ran, not a `const` sitting in a temporal dead zone like `ctx`, so calling it later from an async callback is safe. Skip this and a StrictMode remount leaves the *majority* of the component's triggers behind, not an edge case: the row the visitor is currently looking at is exactly the one whose triggers were just built, and exactly the one a remount duplicates.

- **The `IntersectionObserver` is not a GSAP object; `ctx.revert()` does not know it exists.** If the effect unmounts before all five rows have intersected — the common case, since the page is 500vh tall and most visits never reach the footer — the observer is still armed and watching the other rows. Disconnect it in this same cleanup, or a row crossing the threshold after unmount calls `self.add` against a context that has already been reverted, creating a `ScrollTrigger` on a row that's on its way out of the DOM and that nothing left in memory will ever revert.

- **The ticker subscription is this component's rAF loop.** There's no separate `requestAnimationFrame` call to cancel, but `gsap.ticker.add(tick)` is what calls `lenis.raf` every frame, and `ctx.revert()` does not touch the ticker. Leave `gsap.ticker.remove(tick)` out of the cleanup and the callback survives the unmount — it keeps closing over the now-destroyed `lenis` and calling `raf` on it for the life of the page, one more surviving ticker callback each time this route mounts.

- **`Lenis` is a document-level resource.** This component is written as a full page — hero, services, footer — so it owns its instance outright and `destroy()` in the cleanup is correct as shown. If you embed the services section inside a larger app instead — see "Using this outside its demo page" above — lift `Lenis` to the app shell and drop the `new Lenis()` / `tick` / `destroy()` lines from this effect entirely; keep only the `lenis.on("scroll", ScrollTrigger.update)` line, pointed at the shared instance.
