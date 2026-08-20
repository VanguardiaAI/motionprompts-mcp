---
slug: fractal-glass-effect
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Fractal Glass Parallax Hero — build prompt

## Goal
Build a full-viewport hero for a fictional design studio called **"Glassform"**. A single editorial portrait fills the screen, but it is not shown directly: it is rendered on a WebGL plane and refracted through a custom fragment shader that bends the image into dozens of vertical **fractal-glass ribbons** (like looking through fluted / reeded glass). Moving the mouse feeds a smoothed pointer position into the shader that produces a subtle **horizontal parallax**, amplified inside the distorted stripes so the ribbons appear to slide over each other. The star effect is the shader itself, driven by a lerped mouse uniform on a `requestAnimationFrame` loop.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`three`** (npm) only — there is **no GSAP and no scroll library** in this component. All motion comes from the Three.js render loop + a GLSL fragment shader. Assume a fresh Vite project; `three` is installed via npm and imported as `import * as THREE from "three"`.

Split the code into three files:
- `index.html`
- `styles.css`
- `script.js` — the Three.js app (`<script type="module" src="./script.js">`)
- Put the GLSL strings in a small `shaders.js` module that exports `vertexShader` and `fragmentShader`, imported by `script.js`. (Inlining them in `script.js` is also fine.)

## Layout / HTML
```
nav
  .logo > a            → "Ω Glassform"   (use the Ω ohm sign, HTML entity &#8486;, before the word)
  .nav-links > a ×3    → "Experiments", "Objects", "Exhibits"
section.hero
  img#glassTexture     → src to the hero image, alt=""   (this <img> is hidden via CSS; it is only a source for the WebGL texture)
  .hero-content
    h1                 → "Designed for the space between silence and noise."
    p                  → "Developed by Glassform"
```
The Three.js renderer's `<canvas>` is appended to `.hero` by JS at runtime (it becomes a child of `.hero`).

## Styling
- Fonts: **Inter** for body, **Space Grotesk** for the headline, **Space Mono** for the plate caption.
- Colors — the CSS ground exists so the page is never blank while the canvas loads, and it is pulled *from the photograph*: `--bg` is the studio wall the portrait was shot against, so the pre-decode frame is not a flash of an unrelated colour. Everything you actually look at comes from the refracted texture:
  ```css
  :root {
    --bg: #0b2e38;        /* the studio wall behind the canvas while the photo decodes */
    --scrim: 8, 34, 42;   /* darker than --bg; the type scrims are mixed from it */
    --ink: #f5f3f7;
    --ink-soft: rgba(245, 243, 247, 0.72);
    --peach: #f0a884;     /* the plate caption's accent — warm against the teal wall */
    --violet: #8b5cf6;    /* focus ring, nothing else */
    --teal: #5eead4;      /* selection */
    --hairline: rgba(255, 255, 255, 0.18);
    --glass: rgba(8, 34, 42, 0.34);        /* smoked, not clear — see below */
    --glass-border: rgba(255, 255, 255, 0.22);
  }
  ```
  Note `--glass`: the caption plate is tinted with the scrim colour rather than the usual white-at-6%. Over a mid-tone photographic background a white film has nothing to lift itself off, and the card dissolves; smoked glass keeps its edges. If you swap in a very dark image, invert that decision.
- Global reset: `* { margin:0; padding:0; box-sizing:border-box; }`.
- `h1`: `font-family:"Space Grotesk"; font-size: 4rem; letter-spacing: -0.03em; line-height: 1;`
- `a, p`: `color: var(--ink); text-decoration:none; font-size:0.85rem; line-height:1; display:inline-block;`
- `nav`: `position:fixed; width:100%; padding:2rem; display:flex; justify-content:space-between; align-items:flex-start; z-index:2;`
- `nav .nav-links`: `display:flex; gap:0.75rem;`
- `.hero`: `position:relative; width:100%; height:100svh; overflow:hidden;`
- `.hero img#glassTexture`: `display:none;` (critical — the raw `<img>` must never be visible; it only feeds the texture).
- `.hero-content`: `position:absolute; left:0; bottom:0; width:100%; padding:2rem; display:flex; justify-content:space-between; align-items:flex-end;` (it paints above the static WebGL canvas because it is positioned).
- `.hero-content h1`: `width:60%;`
- Responsive `@media (max-width:1000px)`: `.hero-content { align-items:flex-start; flex-direction:column-reverse; gap:1rem; }` and `.hero-content h1 { width:100%; }`.

## The effect (be exact — this is the whole component)

### Three.js scene setup
- `scene = new THREE.Scene()`.
- `camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)` — left/right/top/bottom/near/far. This maps a `[-1,1]` quad to the full viewport.
- `renderer = new THREE.WebGLRenderer({ antialias: true })`; `renderer.setSize(window.innerWidth, window.innerHeight)`; `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`; append `renderer.domElement` to the `.hero` container.
- Geometry: `new THREE.PlaneGeometry(2, 2)` (fills the whole ortho space). `mesh = new THREE.Mesh(geometry, material)`; `scene.add(mesh)`.
- Material: `THREE.ShaderMaterial` with the uniforms below plus the vertex + fragment shaders.

### Config constants (exact values — they define the look)
```
lerpFactor:            0.035   // pointer smoothing per frame
parallaxStrength:      0.1     // base parallax amount (uParallaxStrength)
distortionMultiplier:  10      // how much the ribbons amplify parallax (uDistortionMultiplier)
glassStrength:         2.0     // displacement gain per stripe (uGlassStrength)
glassSmoothness:       0.0001  // sample spacing for the 11-tap blur (uglassSmoothness)
stripesFrequency:      35      // number of vertical glass ribbons (ustripesFrequency)
edgePadding:           0.1     // fade width at left/right edges (uEdgePadding)
```

### Uniforms (initial values)
- `uTexture`: `null` initially, set once the image loads.
- `uResolution`: `vec2(window.innerWidth, window.innerHeight)`.
- `uTextureSize`: `vec2(1, 1)` initially, set to the image's natural pixel size on load.
- `uMouse`: `vec2(0.5, 0.5)` (centered).
- `uParallaxStrength` = 0.1, `uDistortionMultiplier` = 10, `uGlassStrength` = 2.0, `ustripesFrequency` = 35, `uglassSmoothness` = 0.0001, `uEdgePadding` = 0.1.

### Texture loading
The hidden `#glassTexture` `<img>` is the source. When it is `complete` (or on its `onload`), build `new THREE.Texture(imgElement)`, read `naturalWidth`/`naturalHeight` into `uTextureSize`, set `texture.needsUpdate = true`, and assign it to `uTexture`. Handle both the already-cached case and the async `onload` case.

### Pointer smoothing (the only "animation" driver)
- Keep two objects: `mouse = {x:0.5, y:0.5}` (current, smoothed) and `targetMouse = {x:0.5, y:0.5}` (raw target).
- `window` `mousemove`: `targetMouse.x = e.clientX / innerWidth`; `targetMouse.y = 1.0 - e.clientY / innerHeight` (**note the Y flip** — WebGL origin is bottom-left).
- `lerp(a, b, f) = a + (b - a) * f`.
- In the render loop every frame: `mouse.x = lerp(mouse.x, targetMouse.x, 0.035)`, same for `y`, then `uMouse.value.set(mouse.x, mouse.y)`. This gives a slow, floaty follow (~0.035 easing factor).

### Render loop
`function animate(){ requestAnimationFrame(animate); /* lerp mouse + update uMouse */ renderer.render(scene, camera); }` — call `animate()` once. Runs continuously; no start/stop trigger.

### Resize
On `window` `resize`: `renderer.setSize(innerWidth, innerHeight)` and update `uResolution` to the new size. (Do not touch `uTextureSize`.)

### Vertex shader
Pass-through: a `varying vec2 vUv`; `vUv = uv;` `gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);`.

### Fragment shader (the fractal-glass refraction — reproduce this math exactly)
Helpers:
- **`getCoverUV(uv, textureSize)`** — emulates CSS `background-size: cover`. If either `textureSize` component `< 1.0`, return `uv` unchanged. Else: `s = uResolution / textureSize; scale = max(s.x, s.y); scaledSize = textureSize * scale; offset = (uResolution - scaledSize) * 0.5; return (uv * uResolution - offset) / scaledSize;`
- **`displacement(x, num_stripes, strength)`** → `modulus = 1.0 / num_stripes; return mod(x, modulus) * strength;` (a per-stripe sawtooth ramp).
- **`fractalGlass(x)`** — an 11-tap box blur of the sawtooth: `float d = 0.0; for (int i = -5; i <= 5; i++) { d += displacement(x + float(i) * uglassSmoothness, ustripesFrequency, uGlassStrength); } d /= 11.0; return x + d;` (i.e. offset X by the averaged displacement — this is what "bends" the image into ribbons).
- **`smoothEdge(x, padding)`** — returns 1.0 in the middle and fades the effect to 0 at the left/right edges: `edge = padding; if (x < edge) return smoothstep(0.0, edge, x); else if (x > 1.0 - edge) return smoothstep(1.0, 1.0 - edge, x); return 1.0;` (note the descending `smoothstep(1.0, 1.0-edge, x)` on the right side).

`main()` order:
1. `vec2 uv = vUv; float originalX = uv.x;`
2. `float edgeFactor = smoothEdge(originalX, uEdgePadding);`
3. `float distortedX = fractalGlass(originalX);`
4. `uv.x = mix(originalX, distortedX, edgeFactor);` — apply the ribbon distortion, faded near edges.
5. `float distortionFactor = uv.x - originalX;` — how much this pixel got bent.
6. Parallax:
   - `float parallaxDirection = -sign(0.5 - uMouse.x);` (mouse right of center ⇒ +1, left ⇒ −1).
   - `vec2 parallaxOffset = vec2( parallaxDirection * abs(uMouse.x - 0.5) * uParallaxStrength * (1.0 + abs(distortionFactor) * uDistortionMultiplier), 0.0 );` — horizontal only, scaled by pointer distance from center and **amplified where the glass is most distorted**.
   - `parallaxOffset *= edgeFactor;` (also fade parallax at edges).
   - `uv += parallaxOffset;`
7. `vec2 coverUV = getCoverUV(uv, uTextureSize);`
8. If any component of `coverUV` is `< 0.0` or `> 1.0`, `coverUV = clamp(coverUV, 0.0, 1.0);` (clamp to avoid sampling outside the image).
9. `gl_FragColor = texture2D(uTexture, coverUV);`

Net visual result: 35 crisp vertical glass ribbons refracting the portrait, softly faded to the true image at the far-left/far-right ~10% of the width, with the whole field sliding horizontally as the (smoothed) mouse moves off-center — the slide being strongest along the ribbon seams.

## Assets / images
- **1 image sampled at a time**, wired into `#glassTexture` — and the entire component lives or dies on what that image is. The demo ships `hero-portrait.jpg` (1920×1200): an editorial studio portrait, a model in an oversized scarlet blazer facing camera against a petrol-teal wall.
- **The one trap here: never feed this shader a gradient.** An earlier version of this demo did exactly that — a hand-written SVG mesh gradient, a soft violet/peach/teal aurora — and the effect went invisible. The reason is in the math above. `fractalGlass()` does not blur, tint or shade anything; all it does is **move the sample point sideways**, by at most `glassStrength / stripesFrequency` of the frame width (≈5.7% at the shipped 35 / 2.0). Displace a soft gradient sideways and you land on a colour almost identical to the one you left, so 35 ribbons of imperceptibly-shifted mauve read as one flat mauve wall with faint vertical banding. There is nothing to refract. Give it hard edges instead — a jaw, a shoulder line, a scarlet lapel against a teal wall — and the same displacement drops each ribbon onto a *different object*: the silhouette breaks into overlapping shards, the face repeats down the frame, and the effect announces itself in the very first still frame, before any mouse has moved. **Contrast is the raw material of this shader, and a gradient has none.** `mesh-nocturne.svg` is still served alongside the photographs, kept deliberately as the counter-example: load it into `#glassTexture` for ten seconds and you will see the failure mode for yourself.
- What to swap in: a **landscape ~16:10 photograph** with one dominant subject, hard-edged, and strongly separated from its background in *both* hue and value. Figures and portraits are the safest bet — a face is the thing a viewer most immediately recognises as being sliced. Avoid gradients, bokeh, mist, fog, evenly-lit flat-lays and anything low-contrast; they all collapse back into banding. No brand logos or text either: the ribbons shred them and it reads as a rendering bug rather than an effect.
- Frame the subject **horizontally centred**. At phone widths `getCoverUV` crops to roughly the middle 30% of the plate, so a subject composed off to one side simply is not there on mobile. If your source is a portrait crop, extend its backdrop sideways rather than upscaling the whole thing: the demo's plate is a 995px-wide portrait sitting on a 1920px canvas whose flanks are the photograph's own wall, taken from a 28px edge strip, blurred and stretched — the seam is invisible because the strip carries the wall's real vignette, and a little grain is dusted back on so the flat extension matches the film texture of the plate.
- Set the chosen file as the `src` of `#glassTexture`, with `fetchpriority="high"`: the `<img>` stays `display:none` (it exists purely as a texture source, and must never be visible), and browsers de-prioritise hidden images — but this one *is* the page, so it needs to be treated as the LCP asset it really is.

## Behavior notes
- Desktop, pointer-driven. There is no click, scroll, or keyboard interaction; touch devices simply see the centered (un-parallaxed) refraction.
- The loop runs forever at rAF cadence; there is no reduced-motion branch in the original (the motion is subtle and pointer-gated — at rest the image sits still and centered).
- `pixelRatio` is capped at 2 for performance. The canvas always matches the window size.
- **Narrow-viewport branch.** At `window.innerWidth <= 480` the uniforms are rewritten before every render pass: `ustripesFrequency = round(stripesFrequency * 0.75)` (35 → 26) and `uGlassStrength = glassStrength * 1.5` (2.0 → 3.0). Recompute this on `resize`, not only at mount. The reason is that the ribbon count is expressed in *fractions of the viewport*, not pixels: 35 ribbons across a 390px phone are 11px each, and an 11px-wide refraction jump reads as texture rather than as glass. Keep the boost mild, though — pushing it to 0.6 / 2.2 (which is what a gradient needed) shreds a photographed face into confetti and you lose the subject.
- Cap the effect to WebGL-capable browsers; if `uTexture` is still null (image not yet decoded) the plane simply renders empty/black until the texture loads.

## Images

This component ships with 6 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios. The first one is what the demo wires into `#glassTexture`; the four `hero*`
photographs are swappable alternates. The last one, `mesh-nocturne.svg`, is the counter-example
described above — the gradient that makes this effect disappear. It is listed so you can see the
failure mode, not so you can ship it.

```
https://motionprompts.dev/c/fractal-glass-effect/hero-portrait.jpg
https://motionprompts.dev/c/fractal-glass-effect/hero.jpg
https://motionprompts.dev/c/fractal-glass-effect/hero2.jpg
https://motionprompts.dev/c/fractal-glass-effect/hero3.jpg
https://motionprompts.dev/c/fractal-glass-effect/hero4.jpg
https://motionprompts.dev/c/fractal-glass-effect/mesh-nocturne.svg
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--bg`, `--scrim`, `--ink`, `--ink-soft`, `--peach`, `--violet`, `--teal`, `--hairline`, `--glass`, `--glass-border`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already tears itself down: `mount` builds the scene, the orthographic camera, the renderer, the ten-uniform `ShaderMaterial` on its full-viewport quad, the three `window` listeners (`mousemove`, `touchmove`, `resize`), and the `animate()` loop that drives the pointer-lerp into `uMouse`, and the function it returns cancels that loop, removes all three listeners, clears any pending image callback, disposes the texture (if one ever loaded), the geometry, the material and the renderer, force-loses the WebGL context, and detaches the canvas. This shape exists so the catalogue's own editor (`window.MP.register`) can re-invoke the component whenever a config knob changes without leaking the previous instance — most of the discipline a React effect needs is already on the page. What is missing is the wiring: `mount`/`destroy` were built for one external caller re-triggering them on purpose, not for React's StrictMode remount, and the two only line up if `destroy` becomes the effect's own cleanup rather than a value `mount()` returns and nobody reads. Under React 19 with StrictMode, every effect mounts, unmounts and mounts again before anything reaches the screen. Call `mount()` without capturing what it returns, and the second mount appends a second `<canvas>` into `.hero`, binds a second `mousemove`/`touchmove`/`resize` triple to the same `window`, and starts a second `animate()` loop racing the first to write `uMouse` and call `renderer.render` — the visible symptom is a parallax that answers the pointer at twice the intended speed, and it will not reproduce in a production build, because only development does the double mount.

*(1) The entry point* — the bottom of the file checks `window.MP` first, and only in its absence checks `document.readyState` before deciding whether to wait for `DOMContentLoaded`. Both branches exist for the standalone demo and this catalogue's visual editor; neither has a job inside a host React component. Delete the whole `if`/`else`, including the `window.MP.register` branch, and call `mount(Object.assign({}, DEFAULTS))` directly inside a `useEffect` with an empty dependency array, keeping its return value as the effect's own cleanup. `useEffect` already runs after the DOM is committed, so the race the `readyState` guard exists to survive — the script running before `.hero` and `#glassTexture` exist — cannot happen here.

*(2) Element lookups* — `mount` resolves `.hero` and `#glassTexture` against the document and already returns a no-op `destroy` (`() => {}`) if either is missing; keep that guard, it is cheap insurance against a malformed host page. What is not safe unscoped is the lookup itself: give the component a root ref on the element playing the role of `.hero`, render the hidden `<img>` inside it, and resolve both nodes from that ref instead of `document.querySelector` / `getElementById`. During the StrictMode remount two copies of this subtree exist for an instant, and an unscoped `getElementById("glassTexture")` can hand the second `mount()` call the `<img>` node the first mount's `destroy()` is still tearing down — the renderer would keep sampling a texture built from a node about to be removed.

*(3) Cleanup* — two things here outlive a naive `return` if you copy the body without the discipline it already has.

The `animate()` loop is the only thing producing frames: every call it lerps `mouse` toward `targetMouse` by the pointer-smoothing factor already specified above, writes the smoothed pair into `uMouse`, and calls `renderer.render`, before scheduling its own next call. Keep the `frame` handle exactly as used and call `cancelAnimationFrame(frame)` in the returned cleanup — each `mount()` builds its own `renderer`, so dropping this leaves the first loop still calling `render()` on a context the second `destroy()` never touches, and two canvases keep painting into `.hero` at once.

The texture load is this component's one asynchronous seam: `loadImageFromElement` checks `imageElement.complete` and, if the image has not decoded yet, assigns itself as `imageElement.onload` and returns — so it can fire after this exact `mount()` call has already been torn down, if the image is still loading when the route changes away. `destroy` guards this by setting `imageElement.onload = null` before disposing anything; keep that line, and keep it ordered before the disposal calls, not after — a late `onload` that fires between disposing the material and nulling the callback would still try to write a freshly built `THREE.Texture` onto `material.uniforms.uTexture.value` after `material.dispose()` has already run.

*(4) Rendering this in `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

The camera needs care before anything else: this component uses `new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)`, not the perspective camera `<Canvas>` defaults to, specifically so a `[-1,1]` quad fills the frame exactly. Pass `orthographic` to `<Canvas>` and set `camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1, position: [0, 0, 1] }}`, or use drei's `<OrthographicCamera makeDefault left={-1} right={1} top={1} bottom={-1} near={0} far={1} position={[0, 0, 1]} />` as its own element. Match `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` with `<Canvas dpr={[1, 2]}>`, and the `antialias: true` renderer option with `gl={{ antialias: true }}`. The `PlaneGeometry(2, 2)` mesh becomes a plain declarative `<mesh><planeGeometry args={[2, 2]} /><shaderMaterial args={[{ uniforms, vertexShader, fragmentShader }]} /></mesh>` — no `scene.add`, and R3F disposes the geometry and material for you once the element unmounts.

The texture is worth rethinking rather than porting line by line: the vanilla script builds `new THREE.Texture(imageElement)` from a hidden, hand-managed `<img>` and re-checks `imageElement.complete` on every call to cover both the cached and the not-yet-loaded case. Drei's `useTexture(url)` replaces that whole mechanism — it loads the image straight from a URL, with no DOM `<img>` involved, and suspends the tree until it decodes, so there is no `complete` branch and no `onload` to null out in cleanup. Read the loaded texture's own `image.width` / `image.height` to feed `uTextureSize`, in a `useEffect` keyed on the texture, in place of the `naturalWidth`/`naturalHeight` read `loadImageFromElement` does today.

`animate()` becomes the callback passed to `useFrame`: the `mouse`/`targetMouse` lerp and the `uMouse.value.set(...)` call move in unchanged, and the trailing `renderer.render(scene, camera)` is dropped, since `<Canvas>` renders the frame once `useFrame` returns. Keep `mouse` and `targetMouse` as refs, not `useState` — this body runs every frame, and routing either through state would re-render the React tree at that same rate for values that only ever feed a shader uniform. Get the material with a `ref` on the `<shaderMaterial>` element and mutate `materialRef.current.uniforms.uMouse.value` from inside `useFrame`, the same way the vanilla loop mutates `material.uniforms` directly. The `mousemove`, `touchmove` and `resize` listeners stay page-level `window` listeners, not pointer events on the mesh — attach them from a `useEffect` alongside the `Canvas`-hosting component and tear them down the same way `destroy()` already does. `<Canvas>` tracks its own container size, but `uResolution` is a custom uniform R3F has no opinion about, so keep updating it from the `resize` handler (or from `useThree(({ size }) => size)` inside a small effect) — the canvas resizing on its own does not update it for you.

A static poster matters more here than in most three-family components in this catalogue: there is exactly one thing on screen, the refracted portrait, and until the texture resolves the plane renders solid black over a black page background — a cold visit shows nothing at all, not even a placeholder shape. Render the same hero photo as a plain `<img>`, covered the same way `getCoverUV` covers it in the shader, filling `.hero`, and swap it out only once the texture has loaded and the `Canvas` has actually painted a frame with it, not the instant the component mounts.

Skip drei's `Environment` regardless of preset temptation: the `ShaderMaterial` here is fully custom and unlit — it samples `uTexture` directly in the fragment shader through `getCoverUV`/`fractalGlass` and never reads scene lighting — so there is nothing for an environment map to feed. If a future variant of this component adds a lit material, light it with explicit lights or a self-hosted HDRI passed to `Environment`, never a `preset`, which is fetched from a third-party CDN hard-coded into drei and leaves the scene unlit the moment that host is unreachable.
