---
slug: fluid-splash-cursor
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Fluid Splash Cursor (page-level GPU Navier–Stokes overlay)

## Goal
Build a page whose pointer drags **liquid ink across the entire document** — not inside a hero box, not behind the content, but on a transparent full-window layer that composites over headlines, tables, borders and photographs alike. Moving the pointer pushes a force and a puff of dye into a fluid simulation running on the GPU; the ink curls, spreads and dissipates on its own. Clicking bursts. The page underneath is never touched: no blend mode inverts it, no canvas covers it, no listener steals its clicks.

The demo dress is **Nocturne Baths № 4**, a municipal swimming pool that only opens after dark.

## Tech
**Vanilla HTML/CSS/JS. No library at all** — not GSAP, not three.js, not a shader loader. Raw WebGL2 with a WebGL1 fallback, one `requestAnimationFrame` loop, ES module syntax so it drops into a bundler or a plain `<script type="module">` unchanged. The whole solver is one exported function:

```js
const fluid = splashCursor({ curl: 12, densityDissipation: 3, color: "#ff0000" });
```

If you are tempted to reach for three.js: don't. The entire GPU side is ten fragment shaders and a fullscreen quad — copy, clear, splat, advection, divergence, curl, vorticity, pressure, gradient-subtract and display — and pulling in a scene graph to draw a quad triples the bundle for nothing.

## The mechanic

### What a fluid solver actually is here
Two fields live in floating-point textures:

- **velocity** — a low-resolution vector field (128 on the short side is plenty; it is a force field, nobody sees it)
- **dye** — the visible ink, high resolution (1440 on the short side), because this one *is* seen

Every frame, in this exact order:

1. **curl** — measure the local rotation of the velocity field
2. **vorticity confinement** — push energy back into the small eddies the numerics keep eating, so the ink keeps curling instead of going smooth and dead. This is the `curl` parameter, and it is the single knob that decides whether the effect reads as *smoke* or as *paint*
3. **divergence** — measure where the field is compressing
4. **pressure decay**, then **20 Jacobi pressure iterations** — solve for a pressure field that cancels that compression
5. **gradient subtract** — remove the pressure gradient from velocity, which is what makes the fluid incompressible and therefore *swirl* instead of pile up
6. **advect velocity**, then **advect dye** — semi-Lagrangian: for each texel look *backwards* along the velocity field and fetch what used to be there. Unconditionally stable at any timestep, which is why the effect survives a dropped frame

Each advection divides by `1 + dissipation * dt`, and that is the whole of "fading".

Everything is **double-buffered**: you cannot read and write the same texture in one pass, so every field is a read/write pair that swaps after each blit.

### The splat
A splat is a gaussian **added** to a target, written by one shader used twice:

```glsl
vec2 p = vUv - point.xy;
p.x *= aspectRatio;              // or the splat is an ellipse on a wide window
vec3 splat = exp(-dot(p, p) / radius) * color;
gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
```

First into **velocity**, where the "colour" is the force vector `(dx, dy) * splatForce`. Then into **dye** at the same point, where the colour is ink. Same shader, two targets — that is the whole input path.

### The part that makes it an OVERLAY rather than a background
This is what separates it from every fluid hero you have seen. Three things, all load-bearing:

```js
canvas.getContext("webgl2", { alpha: true, preserveDrawingBuffer: false });
```

```glsl
float a = max(c.r, max(c.g, c.b));    // alpha comes from the ink's own brightness
gl_FragColor = vec4(c, a);            // premultiplied
```

```js
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
```

Unpainted water has zero brightness, therefore zero alpha, therefore the document shows through untouched. Painted water composites *over* it. And **nothing ever clears the drawing buffer by hand**: with `preserveDrawingBuffer: false` the browser wipes it to transparent black between frames, which is exactly the behaviour we want. Turn preservation on "to be safe" and the ink smears permanently across the screen.

The fourth thing is not a flag but a number: **`intensity`**, which scales every dye colour down to ~15%. At full value the splats are opaque paint and the page dies underneath them.

### Shading
Optional, on by default, and cheap: take the gradient of the dye field's own brightness, treat it as a surface normal, dot it with a head-on light. The ink gains volume and stops looking like an airbrush. It is a `#define` in the display shader, so switching it needs a re-link, not a uniform.

## Layout / HTML
A page-level overlay needs a page to be over. Three screens, all CSS — **no images anywhere**, so the only thing the fluid can be compositing with is ordinary document content:

```html
<body>
  <header class="chrome">…mark, three links, "Open until 02:00" with a pip…</header>

  <main id="top">
    <section class="basin">
      <div class="tiles"></div>   <!-- pool floor: two repeating-linear-gradients -->
      <div class="lamp"></div>    <!-- one blurred radial: a sodium lamp -->
      <div class="basin-copy">
        <p class="eyebrow">Municipal Baths № 4 · Ostend · since 1934</p>
        <h1>The water is<br />warmest at<br /><em>one in the morning.</em></h1>
        <p class="lede">…two sentences…</p>
        <p class="hint"><span class="hint-dot"></span>Move your hand across the surface</p>
      </div>
      <div class="gauge">…four readouts: surface, air, salinity, swimmers…</div>
      <div class="dial">
        <span class="dial-label">Water</span>
        <button data-water="still">Still</button>
        <button data-water="wake" class="is-on">Wake</button>
        <button data-water="riptide">Riptide</button>
        <span class="dial-label">Dye</span>
        <button data-dye="spectrum" class="is-on">Spectrum</button>
        <button data-dye="sodium">Sodium</button>
      </div>
    </section>

    <section class="waters">…four pools, each a row: numeral, name, temperature, depth…</section>
    <section class="hours">…four opening slots in a hairline grid…</section>
    <footer class="foot">…"Season keys are issued on the first cold night." + a pill CTA…</footer>
  </main>
</body>
```

The tiled floor is not decoration. **Dye over a flat field reads as a smudge; dye crossing grout lines reads as water.** A 64px grid of 1px hairlines under a radial mask is enough, and it costs nothing.

## Dress
Ostend, 1934, a glass-roofed pool open only between 21:00 and 02:00.

- **Ground** `#06090c` night, `#0a1218` basin, `#0e1a22` tile — nearly black, because the ink is additive and needs somewhere dark to glow
- **Ink** `#e7edee` bone, `#78898f` dim
- **Accent** `#ffb45a`, a sodium poolside lamp. Exactly one accent: the dye already brings every hue there is, and a second brand colour turns the page into noise
- **Type** `Bricolage Grotesque` for the voice (`wdth` 82, `opsz` 96, `wght` 620 on the display; the italic at `wght` 380 for the amber line) and `Azeret Mono` for **every** readout, label and button. A municipal bath is signage and instrumentation before it is design
- Display at `clamp(2.3rem, 5.4vw, 4.6rem)`, line-height 0.94, tracking −0.028em

## Config
Everything is an option with a real default. The three presets on the page are the same solver, named after water instead of after parameters, because nobody browsing knows what vorticity confinement feels like until they see it:

```js
const WATERS = {
  still:   { curl: 2,  densityDissipation: 1.6, velocityDissipation: 1.4, splatForce: 4200, splatRadius: 0.28 },
  wake:    { curl: 12, densityDissipation: 3,   velocityDissipation: 2.4, splatForce: 6000, splatRadius: 0.2  },
  riptide: { curl: 34, densityDissipation: 4.4, velocityDissipation: 3.8, splatForce: 7400, splatRadius: 0.14 },
};
```

| option | default | what it does |
|---|---|---|
| `simResolution` | 128 | velocity/pressure grid, short side |
| `dyeResolution` | 1440 | the visible ink. This is the expensive one |
| `densityDissipation` | 3.5 | how fast the ink fades |
| `velocityDissipation` | 2 | how fast the motion stops |
| `pressure` | 0.1 | how much pressure survives each frame |
| `pressureIterations` | 20 | below ~12 the flow goes blocky |
| `curl` | 3 | vorticity confinement: the swirl |
| `splatRadius` | 0.2 | |
| `splatForce` | 6000 | |
| `shading` | true | fake normals from the dye gradient |
| `colorUpdateSpeed` | 10 | hue re-rolls per second while `rainbow` |
| `rainbow` | true | cycle hues, or hold `color` |
| `color` | `"#ff0000"` | used only when `rainbow` is false |
| `intensity` | 0.15 | master dye level |
| `maxDpr` | 2 | |
| `idleStopMs` | 4000 | stop the loop this long after the last input |
| `respectReducedMotion` | true | |
| `zIndex` | 50 | |
| `mount` | `document.body` | |

The controller it returns: `{ canvas, config, running, splat(x, y, dx, dy, color?), set(partial), destroy() }`. `splat` takes **CSS pixels in viewport coordinates**; `dx`/`dy` are a push in the same units the solver uses internally, so compute them the way a real pointer does — travel as a fraction of the window, times `splatForce` — or a scripted trace hits ten times harder than a hand and the ink comes out as a bruise. **The dye field is y-up and the DOM is y-down**, so a push downward on screen is a *negative* `dy`; and correct both components by aspect ratio the way the internal handler does (`dx *= aspect` when `aspect < 1`, `dy /= aspect` when `aspect > 1`) or a vertical flick pushes harder than a horizontal one of the same length.

## Behaviour worth building deliberately

**Attract mode, and the cap it must have.** A page whose only effect is pointer-driven shows *nothing* until someone moves the mouse — and on a phone, where there is no hover, possibly never. So the basin traces itself, on a Lissajous with two incommensurate frequencies so the stroke never retraces itself and never settles into a loop that piles dye into one blob:

```js
const x = box.left + box.width  * (0.44 + 0.40 * Math.sin(t * 5.6));
const y = box.top  + box.height * (0.34 + 0.22 * Math.sin(t * 7.3 + 0.6));
fluid.splat(x, y, ((x - px) / innerWidth) * force, (-(y - py) / innerHeight) * force);
```

It ends in one of two ways, and **both are required**:

- a real `pointermove` or `pointerdown` takes over — the invitation was answered, so fade the hint out with it and never come back;
- **or a hard time cap (12 s)** — and this one is the whole ballgame. Every traced splat resets the solver's idle timer, so a trace with no end feeds the loop *for ever*, and it does that hardest in exactly the case the trace exists for: a phone nobody touches, left open at the top of the page. Without the cap, "leave it alone and the GPU work stops" is false on the one device where it matters. On this exit leave the hint **up**: nobody was there to read it.

Measured on the finished page, untouched: draws continue while the trace runs, keep going through the solver's four-second idle window, and hit **zero** from about 17 s onward.

**The click burst.** A `pointerdown` writes one splat, not a stroke: the same colour multiplied by **10** and a random kick of `10 * (Math.random() - 0.5)` horizontally and `30 * (Math.random() - 0.5)` vertically. It exists so that tapping does something on a touchscreen, where there is no hover to trail from. Seed the pointer's position from the same event first, then suppress the move-splat, or the tap fires twice.

**Idle stop.** Cancel the rAF four seconds after the last pointer input; any movement or `splat()` call restarts it. This is the difference between a decorative canvas and a laptop fan, and it is the single most valuable thing to add to any port of this effect.

**Reduced motion.** The ink keeps swirling and the hue keeps cycling after the hand has stopped, so this is autonomous motion, not a direct response to input. Under `prefers-reduced-motion: reduce` mount **nothing** — return the same shape of controller (`canvas: null`, `running: false`, no-op `splat`/`set`/`destroy`) so callers do not have to branch — and make sure the page reads without it. That includes hiding the hint in CSS: "Move your hand across the surface" invites an interaction that, under this setting, does not exist.

**Cleanup.** `destroy()` removes every listener, cancels the frame, deletes every framebuffer and texture, drops the two buffers and calls `WEBGL_lose_context`. Also listen for `webglcontextlost` and stop, rather than looping against a dead context.

## Traps

- **The first pointer event has no previous position.** Its delta is measured from `(0, 0)`, which is the whole screen, which is one enormous splat wherever the pointer entered. Seed the previous coordinates on the first event and emit nothing.
- **`preserveDrawingBuffer: true` smears the ink permanently.** It looks like a bug in the dissipation; it is not.
- **A resize keeps the ink and throws away the maths.** `dye` and `velocity` are copied into the new size with the copy shader — losing them means the picture blinks out mid-stroke — while pressure, divergence and curl are simply recreated at zero, because they are rebuilt from scratch every frame anyway. Free the targets you replace: a resize that only allocates leaks two textures and two framebuffers per double buffer, every time.
- **Clamp `dt`.** `dt = min((now - last) / 1000, 1/60)`. Advection is stable at any timestep, but a tab that was backgrounded for two seconds hands you a two-second step and the whole field jumps.
- **Device pixel ratio must be capped *and* recomputed.** A 3× phone buffer is 2.25× the pixels of a 2× one for no visible gain in a blurry fluid. And capturing the ratio once means dragging the window to a different display desyncs the pointer from the buffer — the classic version of this bug in every fluid port.
- **Half-float render targets are not guaranteed.** Probe each format with a 4×4 test attachment and fall back R16F → RG16F → RGBA16F. Without linear filtering, advection has to interpolate by hand (`#define MANUAL_FILTERING`) and the dye buffer must drop to 256 or the page crawls.
- **`idleStopMs` must exceed the dye's visible lifetime.** At any sane dissipation the ink is long gone before four seconds; push `densityDissipation` below ~0.5 and the last trail will freeze on screen until the pointer moves again.
- **Resolution is the SHORT side, and the long side follows the aspect ratio.** Hard-code a square and splats become ellipses on a wide window.
- **`pointer-events: none` on the canvas is not optional.** It is a fixed, full-window element at z-index 50; without it the entire document becomes unclickable.
- **The overlay is only over what is below its z-index.** A modal or a fixed nav at z-index 100 will sit on top of the ink and the effect will look like it stops at that element. That is why the z-index is a constructor option and not a constant.
- **On a light ground, lower `intensity`.** The same value that reads as a glow on black reads as a stain on paper.

## Definition of done
Move the pointer anywhere on the page and coloured ink follows it, curls behind it and dissolves — over the headline, over the pool table, over the footer, with the text still perfectly legible through it. Click and it bursts. Press *Riptide* and the same stroke becomes tighter and more filamentary; press *Sodium* and every hue collapses to one amber. Leave it alone for five seconds and the GPU work stops completely; move again and it resumes instantly. Under `prefers-reduced-motion` there is no canvas in the DOM at all and the page is still a page.

## Adapting this to React

Everything above describes a `mount(config)` that already returns exactly what a `useEffect` cleanup wants: it calls `splashCursor()` to get a `fluid` controller with its own `destroy()`, wires the six preset buttons and the attract-mode trace on top of it, and hands back one function that unwinds all three. What's missing isn't machinery, it's an owner — the dispatch that currently invokes `mount()` runs at import time, gated on nothing but `window.MP`, and every DOM lookup inside it assumes the whole document belongs to this component.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Call `mount()` a second time without first running the cleanup the first call returned, and you get two of everything at once: two `position: fixed; inset: 0` canvases stacked at the same z-index, each running its own WebGL2 context, its own solver loop, and its own `window` pointer listeners, so one mouse move splats ink into two independent dye fields on two independently-rolling rainbow timers — the colour under the cursor stops being a single hue. Both copies also wire the same six `[data-water]`/`[data-dye]` buttons, so one click toggles two solvers at once, and both run their own attract-mode trace over the same basin at the same time. None of this throws, and none of it reproduces in a production build — only development double-invokes the effect — which is exactly why it survives review: the ink still looks right, just doubled.

*(1) The entry point* — the module ends with `if (window.MP && window.MP.register) { window.MP.register(...) } else { mount(Object.assign({}, KNOB_DEFAULTS)) }`. `window.MP` is this catalogue's own editor bridge; it won't exist in a React host, so this always falls to the `else` branch and runs the instant the module is evaluated — before this component's own JSX, the header/basin/dial markup `mount()` depends on, has committed anything. Unlike a lookup that throws on a missing container, this one fails quietly in two different ways at once: `splashCursor()` doesn't need any of that markup — it defaults its own mount target to `document.body` and appends a canvas there directly — so the fluid overlay actually starts and tracks the pointer correctly from the very first paint, while `document.querySelector(".hint")`/`".basin"` return null and the `document.querySelectorAll("[data-water]")`/`"[data-dye]"` loops run over empty, already-captured NodeLists and wire nothing, permanently. The attract-mode trace doesn't even get that far: with `stage` undefined, `stage?.getBoundingClientRect()` is undefined too, so the very first scheduled frame satisfies `!box` and calls `stopDrift()` before a single splat is drawn. The ink works from the first paint; the buttons and the self-drawing hint never will. Move the whole body — dropping the `window.MP` dispatch entirely — into a `useEffect` with an empty dependency array, and only call it once this component's own markup is on the page.

*(2) Element lookups* — not every lookup here wants the same fix. The `pointermove`/`pointerdown`/`touchmove`/`resize` listeners `splashCursor()` binds to `window` and `document` are supposed to stay unscoped: this component's entire premise is a page-level overlay, and confining pointer tracking to a container would undo the one thing the rest of this prompt is about. What does need a root ref is the furniture `mount()` itself queries — `.hint`, `.basin`, `[data-water]`, `[data-dye]` — since those are elements this component renders. Give the component a root ref, render the header/basin/dial markup under it, and query those four off the ref instead of `document`; during the StrictMode remount two copies of that markup exist for an instant, and an unscoped `querySelectorAll` will happily wire buttons on the copy that's on its way out.

*(3) Cleanup* — there's no GSAP, ScrollTrigger, Lenis, or SplitText anywhere in this file, and nothing here awaits a promise — no texture, no font, no fetch — so those variants don't apply. What has to survive the port intact is the teardown `mount()` already assembles out of two independent `requestAnimationFrame` loops and two independent sets of `window` listeners, and the discipline needed is narrow: use the exact function `mount()` returns as the effect's cleanup, not a shorter one written by hand.

### Two rAF loops, not one

`fluid.destroy()` only unwinds what `splashCursor()` itself created: its own solver loop, its own `pointermove`/`pointerdown`/`touchmove`/`resize` listeners, its framebuffers, and — critically — the WebGL2 context itself, released through `WEBGL_lose_context`. It knows nothing about the attract-mode `trace()` loop `mount()` layers on top, which has its own `requestAnimationFrame` handle (`drift`), its own twelve-second `setTimeout` (`expira`), and its own pair of `window` hand-off listeners (`tomaElRelevo`, on `pointermove` and `pointerdown`) that exist only to notice a real pointer arriving. Cleaning up only `fluid` leaves all of that running: a second mount adds a second attract trace racing the first over the same basin, and the hand-off listeners keep multiplying on every remount. Worse, because `fluid.destroy()` is also the only thing that frees the live WebGL2 context, skipping it doesn't just leak DOM listeners — it leaks a GPU context per skipped remount, and browsers cap how many of those can exist at once; eventually a later mount's own `canvas.getContext("webgl2", ...)` call returns null and the whole effect goes dark, canvas and all, with nothing in the console to explain why. Call `stopAttract()` and `offs.forEach((off) => off())` in the same cleanup, exactly as `mount()`'s own returned function already does — do not reach past it and call `fluid.destroy()` directly, or you keep the fluid and lose everything `mount()` built on top of it.

### Where the canvas actually lives

The canvas is `position: fixed; inset: 0`, and `config.mount` defaults to `document.body` — `splashCursor()` appends it there itself rather than into any JSX tree. Keep doing that from inside the effect rather than rendering `<canvas>` bound by a ref: a fixed-position element's containing block becomes the nearest ancestor with a CSS transform, filter, or `perspective` instead of the viewport, so if this component's root ever ends up nested under an animated wrapper elsewhere in the app — a parallax section, a page-transition container — a JSX-rendered fixed canvas would start covering only that ancestor's box instead of the whole document, and "ink over the entire page" would quietly become "ink over one card." Appending straight to `document.body` (or to another explicit, untransformed node passed through `config.mount`) sidesteps that regardless of where the React component itself renders, and lets `destroy()`'s own `canvas.remove()` stay the only thing that ever touches its place in the tree.
