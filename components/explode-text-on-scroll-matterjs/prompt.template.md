---
slug: explode-text-on-scroll-matterjs
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 9
structural:
  - { kind: duration, literal: "0.1", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: ease, literal: "\"power2.inOut\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.in\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Explode Text On Scroll (Matter.js physics)

## Goal

Build a scroll-driven text effect: a full-screen pinned paragraph starts invisible (text is the same color as the background), its words progressively light up in red as you scroll, then the highlighted keywords turn white — and at 60% of the pinned scroll they **shatter into individual characters that fall and bounce on the floor with real Matter.js physics**. Scrolling back up reverses everything and re-assembles the text.

## Tech

Vanilla HTML/CSS/JS with ES module imports (Vite-style npm imports). Use:

- `gsap` (npm) plus the GSAP plugin `ScrollTrigger` (register it with `gsap.registerPlugin(ScrollTrigger)`).
- `lenis` (npm) for smooth scroll.
- `split-type` (npm, the `SplitType` class) to split the paragraph into words.
- `matter-js` (npm) for the physics simulation (use `Engine`, `Runner`, `World`, `Bodies`, `Body`, `Events`).

No images and no canvas rendering — Matter.js runs headless and drives DOM spans via CSS transforms.

Wire Lenis into GSAP the standard way:

- `lenis.on("scroll", ScrollTrigger.update)`
- `gsap.ticker.add((time) => lenis.raf(time * 1000))`
- `gsap.ticker.lagSmoothing(0)`

Run everything inside `DOMContentLoaded`.

## Layout / HTML

Three stacked full-viewport sections:

1. `section.intro` — contains:
   - a `nav` with two `<p>` pill labels: `Menu` and `Let's talk`.
   - an `<h1>` reading `Motionprompts`, centered.
2. `section.sticky` — contains a single long `<p>` (this is the section that gets pinned). Use this exact paragraph text (it must contain the highlight keywords listed below):

   > Motionprompts is a YouTube channel where you learn to code modern web designs using HTML, CSS, JavaScript, React and NextJS. Focused on creating aesthetic interfaces, web animations, and immersive experiences, Motionprompts draws inspiration from the captivating websites showcased on platforms like Awwwards and Godly. With a keen eye for design, Motionprompts crafts elements and interfaces that exhibit a similar taste, often employing the power of GSAP and ScrollTrigger. In a nutshell, Motionprompts is all about coding elite web designs. In 2017, inspired by the standout designs of Awwwards, Motionprompts emerged. Beyond merely admiring these designs, there was a vision: to recreate them. The channel identified a gap — although these designs were exceptional, there wasn't a clear method for many to replicate them. It was this void that Motionprompts sought to fill. From its very inception, the platform has dedicated itself to converting design marvels into structured, comprehensible guides for coders of all proficiency levels. Recently, MotionpromptsPRO was introduced, a subscription-based service tailored to the needs of passionate web designers. As a PRO member, you gain exclusive access to source code for each tutorial and monthly website templates. These resources are carefully curated to support and inspire your creativity, helping you take your web design skills to the next level. MotionpromptsPRO opens up a realm of opportunities for professional growth and empowers you to bring your ideas to life with ease.

3. `section.outro` — contains an `<h1>` reading `One subscription, endless web design.`, centered.

## Styling

- Google Font **Space Mono** (weights 400 and 700, plus italics), applied to `body`. `* { margin:0; padding:0; box-sizing:border-box; }`, `body { overflow-x: hidden; }`.
- Every `section`: `position: relative; width: 100vw; height: 100vh; padding: 2em; overflow: hidden;`.
- `.intro` and `.outro`: flex, center both axes.
- Palette:
  - `.intro`: background `#EBEAE4`, text `#0F0F0F`.
  - `.outro`: background `#EB4330` (red-orange), text `#0F0F0F`.
  - `.sticky`: background `#0F0F0F`.
  - **Key trick:** `.sticky p { color: #0F0F0F; }` — identical to the section background, so the paragraph is invisible until GSAP animates the word colors.
- `nav`: `position: absolute; top: 0; left: 0; width: 100vw; padding: 2em; display: flex; justify-content: space-between; align-items: center;`. Each `nav p` is a pill: `text-transform: uppercase; font-size: 12px; padding: 2px 8px; border-radius: 20px; background: #0F0F0F; color: #EBEAE4;`.
- `.char` (the physics character spans created in JS): `display: inline-block; position: absolute; pointer-events: none; opacity: 0;`.

## GSAP effect (be precise)

### 1. Word splitting and highlight words

- Split `.sticky p` with `new SplitType(".sticky p", { types: "words" })` and collect `text.words`.
- Define the highlight keyword list:
  `["YouTube", "aesthetic", "immersive", "exceptional", "inspiration", "recreate", "void", "passionate", "PRO", "creativity", "life"]`
- `wordsToHighlight` = every split word whose `textContent` **includes** any keyword (substring match, so `MotionpromptsPRO` and `creativity,` match too). Set `word.style.opacity = 1` on each of them.

### 2. Matter.js setup

- `Engine.create({ gravity: { x: 0, y: 0 } })` — gravity starts OFF. Create a `Runner` and `Runner.run(runner, engine)` immediately.
- Add one static floor: `Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 5, window.innerWidth, 20, { isStatic: true })` — a bar sitting just below the bottom edge of the viewport.

### 3. Per-character physics bodies

For each word in `wordsToHighlight`, split its `textContent` into characters. For each character:

- Create a `<span class="char">` with the character as text, `position: absolute`, and append it to `.sticky` (NOT inside the word).
- Position it to exactly overlay its character within the word: `charWidth = word.offsetWidth / chars.length`, `x = wordRect.left − stickyRect.left + charIndex * charWidth`, `y = wordRect.top − stickyRect.top` (rects measured with `getBoundingClientRect()` at build time). Set `left = x px`, `top = y px`, and copy the word's computed `color`.
- Create a Matter rectangle body centered at `(x + charWidth/2, y + charSpan.offsetHeight/2)` with size `charWidth × charSpan.offsetHeight` and options `{ restitution: 0.75, friction: 0.5, frictionAir: 0.0175, isStatic: true }`. Add it to the world.
- Keep a record `{ body, element, initialX: x, initialY: y }` in a `charBodies` array (and the spans in a `charElements` array).

The spans stay at `opacity: 0` (CSS) until the explosion.

### 4. Pinned, scrubbed master timeline

Create the master timeline with this ScrollTrigger:

```
trigger: ".sticky"
start: "top top"
end: "+=" + (window.innerHeight * 4) + "px"   // 4 viewport-heights of pinned scroll
pin: true
scrub: true
```

Master timeline content (total duration 4 timeline-seconds, scrubbed across the pin distance):

- **Phase 1 — words turn red (timeline position 0):** build a nested timeline. Shuffle a copy of ALL words (Fisher–Yates). For each shuffled word add `phase1.to(word, { color: "#EB4330", duration: 0.1, ease: "power2.inOut" }, Math.random() * 0.9)` — i.e. every word flips to red in a 0.1s tween placed at a random time within the first ~1 second, producing a sparkling random-order colorization. Add with `tl.add(phase1, 0)`.
- **Phase 2 — highlight words turn white (timeline position 1):** build a second nested timeline. Shuffle a copy of `wordsToHighlight` (Fisher–Yates). For each add `phase2.to(word, { color: "#FFFFFF", duration: 0.1, ease: "power2.inOut" }, Math.random() * 0.9)`. Add with `tl.add(phase2, 1)`.
- **Padding:** append `tl.to({}, { duration: 2 })` — two seconds of empty timeline so the color phases finish by 50% progress and the last stretch of scroll is reserved for the explosion moment.

### 5. Explosion trigger (in ScrollTrigger `onUpdate`)

Track `lastProgress` to derive scroll direction, and a `physicsEnabled` boolean flag.

- **When `self.progress >= 0.6`, scrolling DOWN, and physics not yet enabled:**
  - Set `physicsEnabled = true` and `engine.world.gravity.y = 1`.
  - Hide every highlight word (`word.style.opacity = 0`) and show every char span (`element.style.opacity = 1; element.style.color = "#FFFFFF"`).
  - For each char body: `Body.setStatic(body, false)`, `Body.setAngularVelocity(body, (Math.random() − 0.5) * 0.25)`, `Body.setVelocity(body, { x: (Math.random() − 0.5) * 5, y: −Math.random() * 5 })` — a small random upward/sideways kick with spin, then gravity takes over and they fall and bounce on the floor.
  - Simultaneously fade OUT all non-highlight words with `gsap.to(nonHighlightWords, { opacity: 0, duration: 0.5, ease: "power2.out" })` so only the flying letters remain visible.
- **When `self.progress < 0.6`, scrolling UP, and physics is enabled:** reset everything:
  - `physicsEnabled = false`, `gravity.y = 0`.
  - For each char body: `Body.setStatic(body, true)`, `Body.setPosition` back to `(initialX + element.offsetWidth/2, initialY + element.offsetHeight/2)`, `Body.setAngle(body, 0)`, zero out velocity and angular velocity; clear the span's `transform` and set its `opacity = 0`.
  - Fade ALL words back in: `gsap.to(word, { opacity: 1, duration: 0.5, ease: "power2.in" })` for each word.

### 6. Physics → DOM sync

Subscribe to Matter's `Events.on(engine, "afterUpdate", ...)`. On every tick, if `physicsEnabled`, for each `{ body, element, initialX, initialY }` compute the offset from the initial body center:

```
deltaX = body.position.x − (initialX + element.offsetWidth / 2)
deltaY = body.position.y − (initialY + element.offsetHeight / 2)
element.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${body.angle}rad)`
```

This makes each character span follow its physics body (position + rotation) while falling and bouncing.

## Assets / images

None. The whole piece is typography and solid color blocks.

## Behavior notes

- Desktop-oriented; the layout/measurement happens once on load (no resize handling needed).
- The explosion is a one-shot state toggled by scroll direction: it fires once past 60% scrolling down, and fully resets (letters snap back, words fade in) once you scroll back above 60% going up. Scrubbing the color phases remains fully reversible at all times.
- The floor is invisible; characters come to rest along the bottom edge of the pinned viewport.
- Expect the characters to render in white (`#FFFFFF`) while flying, on the near-black `#0F0F0F` sticky background, with the red `#EB4330` outro section revealed after the pin ends.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--ink`, `--ultramarine`, `--ink-soft`, `--paper-soft`, `--rule-ink`, `--rule-paper`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. This component builds a Matter `Engine`, a `Runner`, a `Lenis` instance and a `SplitType` instance the moment it mounts. Run that construction twice without tearing the first copy down and you get two physics worlds simulating into the same character spans, two `afterUpdate` listeners writing `transform` onto the same `.char` nodes, two Lenis instances pulling on the same wheel event, and a paragraph split into words twice over — so the second split's "words" are actually spans wrapping already-split spans, and the highlight-word substring match starts missing text it should have caught. The visible symptom is characters falling twice as fast with jittery rotation, or the word color sweep never reaching a stable end state, and none of it will reproduce in a production build, because React only does the double mount in development. The teardown this script already documents — the block under "Desmontaje" that stops the runner, clears the engine, removes the char spans and reverts the split — is not an optional nicety layered on top of the effect; it *is* the effect, half of it, and React needs it back verbatim as the function the effect returns.

**(1) The entry point.** `mount` currently boots itself by checking `document.readyState` and subscribing to `DOMContentLoaded` only if the document is still loading. That guard exists so this file works when dropped into a plain HTML page at any point in the load sequence; inside React it is dead weight, because `useEffect` already runs after the DOM this effect measures — `.sticky`, its `<p>`, `wordRect`, `stickyRect` — has committed. Drop the `readyState` check, the `DOMContentLoaded` listener, and the `window.MP` editor-registration branch entirely. What's left — everything from resolving `gravityY`/`restitution`/`friction`/`frictionAir`/`burstSpeed`/`spin` off the config, through building the floor body and wiring the pinned timeline — becomes the body of a `useEffect` with an empty dependency array. The config values that used to arrive through `DEFAULTS` or the editor's `window.MP.register` become the effect's own local constants, or props if the host app needs to drive them.

**(2) Element lookups.** `document.querySelector(".sticky")` and the `sticky.querySelector("p")` beneath it assume this component owns the whole document. Give the pinned section a root `ref`, resolve `sticky` and `paragraph` from that ref instead of from `document`, and take `stickyRect` from the same scoped node. This is not a style nit here specifically: during the StrictMode remount, two `.sticky` sections briefly coexist in the DOM, and an unscoped `document.querySelector` will bind to whichever one the browser hands back first — not necessarily the copy this particular effect run is about to build char spans and physics bodies against. Bind everything through the ref and each mount only ever touches its own subtree.

**(3) Cleanup — GSAP and ScrollTrigger.** Wrap the pinned master timeline, the two nested color-sweep timelines (`phase1`, `phase2`) and the `ScrollTrigger` they carry in a `gsap.context` scoped to the root ref, and revert that context in the effect's cleanup:

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    /* build the floor body, the char spans + bodies, and the pinned
       ScrollTrigger timeline exactly as described above */
  }, rootRef);
  return () => ctx.revert();
}, []);
```

This one call kills the master timeline, `phase1`, `phase2` and the pin's spacer together, so a StrictMode remount doesn't leave a second pin fighting the first one over the same trigger element. One thing the context does **not** catch here: the tweens this effect creates *after* the synchronous setup returns. `resetAnimation()` and the explosion branch both call `gsap.to(word, …)` from inside the `ScrollTrigger`'s `onUpdate`, which fires later, on scroll — outside the window during which `gsap.context` auto-tracks what it creates. Left alone those tweens survive `ctx.revert()`. Wrap each of those calls in `ctx.add(() => { … })` so the context adopts them too, or keep the script's own belt-and-suspenders move and call `gsap.killTweensOf(words)` in the cleanup regardless — the same explicit safety net the original `destroy()` already relies on, for exactly this reason.

`gsap.ticker.add(raf)` is the other thing the context doesn't cover — a ticker subscription is neither a tween nor a timeline. Keep the `raf` function reference this effect creates and call `gsap.ticker.remove(raf)` directly in the cleanup, in the same place the script's own `destroy()` puts it. Skipping it leaves Lenis's `raf` pump running against a destroyed instance after every remount, because `gsap.ticker` is a global shared across the whole page, not something scoped to this component.

**Cleanup — Lenis.** This component owns its Lenis instance outright (it drives the pin's `scrub` and nothing else on the page needs smooth scroll), so create it inside the effect and call `lenis.destroy()` in the cleanup, after removing the `lenis.on("scroll", ScrollTrigger.update)` subscription with the matching `lenis.off`. If this component ends up as one section of a larger app that already runs Lenis elsewhere, don't create a second instance here — there can only be one Lenis on the page — and instead subscribe the existing instance's scroll event to `ScrollTrigger.update` once, at the app shell.

**Cleanup — SplitType.** `new SplitType(paragraph, { types: "words" })` rewrites the paragraph's DOM into one span per word, and every highlight word gets a further layer of manually created `.char` spans appended as siblings inside `.sticky`. Revert in the opposite order things were built: remove the `.char` spans first (they hold live references to the words' `getBoundingClientRect()` measurements, taken once at mount and never revisited), *then* call `text.revert()` to hand the paragraph back its original, unsplit markup. Do this inside the same `gsap.context` cleanup, after `ctx.revert()` has already killed the tweens that still target those word spans — reverting the split while a tween is still targeting one of the split nodes is what corrupts the second mount's highlight-word matching.

**Cleanup — matter-js.** The physics side of this component is a running simulation, not a one-shot calculation, and it is the most expensive thing on this list to leave alive: `Runner.run(runner, engine)` keeps stepping the world every frame for as long as the runner exists, whether or not anyone is looking at the page, and `Events.on(engine, "afterUpdate", onAfterUpdate)` keeps writing `transform` onto this mount's specific `charBodies` closures forever. In the cleanup, in this order: `Events.off(engine, "afterUpdate", onAfterUpdate)` first, so nothing writes to the DOM after the elements it targets may already be gone; `Runner.stop(runner)`; then `World.clear(engine.world, false)` and `Engine.clear(engine)`. Do this before reverting the split, or the runner can fire one more `afterUpdate` tick against character spans the split revert is about to remove.

Put together, the effect's return function is the fixed sequence the script's own `destroy()` already lays out — kill the ScrollTrigger and timelines, remove the ticker subscription, tear down Lenis, stop and clear the Matter engine, remove the char spans, revert the split, then clear any inline styles left on `sticky`/`paragraph` — and that sequence is what makes the component safe to mount, unmount, and mount again without the falling letters getting heavier, faster, or more numerous each time.
