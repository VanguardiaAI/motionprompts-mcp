---
slug: 3d-material-finish-switcher
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# 3D Material Finish Switcher

## Goal

Build a full-viewport hero for a watch atelier. A single 3D object — a vintage pocket watch — hangs slightly right of centre, swaying gently about its own axis with the dial towards the camera, lit by nothing but an image-based environment. Four pill buttons across the bottom left name four finishes: brushed metal, iridescent, red lacquer, cut glass. Press one and the case answers immediately, in the same frame: the material is rebuilt from a table of physically-based numbers and the case swings far enough to show the new finish on the rim before easing back to the dial, so the change reads as a gesture rather than a flicker. The glass crystal over the dial is a **real transmission material** — it refracts what is behind it — while everything else is `MeshPhysicalMaterial`.

Four things separate this from a spinning-model demo, and all four are load-bearing:

1. **No PBR value is written in the JavaScript.** Every finish is read at runtime from a JSON file, mesh by mesh. Adding a fifth finish is a change to that file, not to the code.
2. **The environment is aimed, not chosen.** A watch case is an almost flat disc, so it reflects a narrow cone of directions and whatever fills that cone *is* the finish. The lighting here is a generated studio whose bright panel has its feathered edge exactly where the centre of the case looks — that edge is what splits the case into a lit half and a dark half, and it is the difference between a polished object and a plastic one.
3. **A static poster is the first thing that paints**, and on a device that should not be running this scene it is the *only* thing that paints. The canvas is never created until the section is on screen.
4. **The quality degrades by measured frame time, not by guesswork** — buffer resolution, then pixel ratio, then transmission itself, then back to the poster.

## Tech

Vanilla HTML/CSS/JS with ES module imports. **No GSAP, no Lenis, no scroll library, no tweening library at all.** The motion is one `requestAnimationFrame` loop: an idle sway plus an angular velocity the pointer feeds and friction takes back.

Runtime dependencies (both npm):

- `three`
- `@pmndrs/vanilla` — imported by deep path, `@pmndrs/vanilla/materials/MeshTransmissionMaterial.js` and `@pmndrs/vanilla/materials/MeshDiscardMaterial.js`. Import the package root instead and you pull the whole library into the bundle for two classes.

From three's addons: `three/examples/jsm/loaders/GLTFLoader.js`, `three/examples/jsm/loaders/HDRLoader.js`, `three/examples/jsm/libs/meshopt_decoder.module.js`.

Two notes on that list, both of which cost real time if you find them the hard way:

- **`MeshoptDecoder` is not optional.** The model is compressed with `EXT_meshopt_compression` declared as *required*; without `loader.setMeshoptDecoder(MeshoptDecoder)` the loader throws and there is no mesh.
- **Do not import `DRACOLoader`.** The model does not need it, and `DRACOLoader.js` resolves its decoder with `new URL('../libs/draco/…', import.meta.url)` at module scope. A bundler treats that as a static asset reference, so merely importing the class emits about 1.3 MB of decoder — a `draco_decoder.js`, two `.wasm` files and two wrappers — that nobody ever downloads, because `setDecoderPath()` replaces those URLs at runtime.

`RGBELoader` still exists but is deprecated in three 0.185; it is `HDRLoader` plus a console warning. Use `HDRLoader`.

## Layout / HTML

One section, `.stage`, `height: 100svh`. Inside it, in this order: the poster `<img>`, a hidden fallback line, and the interface layer. The WebGL canvas is created in JS and appended to `.stage`.

```html
<section class="stage" aria-label="Calibre 04 in the selected finish">
  <img class="stage__poster" src="/c/3d-material-finish-switcher/poster-e92111e8.webp"
       width="1600" height="1000" fetchpriority="high" decoding="async"
       alt="The pocket watch, brushed metal case, glass crystal." />
  <p class="stage__fallback" hidden>Showing a still. This device is not set up for the live 3D view.</p>

  <div class="ui">
    <header class="ui__bar"><a class="wordmark">…</a><nav class="nav">…</nav></header>
    <h1 class="headline">…</h1>
    <div class="foot">
      <aside class="spec">…<h2 data-finish-name></h2><p data-finish-note></p></aside>
      <div class="finishes" role="group" aria-label="Case finish"></div>
      <p class="hint">…</p>
    </div>
  </div>
</section>
```

Details that are decisions, not accidents:

- **The poster is a real `<img>`, not a CSS background.** The preload scanner finds an `<img>` before any script runs; it never finds a `background-image`. This element is the LCP and it must stay that way.
- `width` and `height` are on the tag so the box is reserved before the bytes arrive. Nothing about the canvas appearing later may move layout.
- **The interface layer lives inside the section and is `position: absolute`, not `fixed`.** A fixed `inset: 0` overlay stays on top of the rest of the page long after the section has scrolled away.
- **The four buttons are generated by the script from the finishes file** — the order and the labels live in the JSON. Leave `.finishes` empty in the HTML.

## Styling

Dark, editorial, one accent. The visual weight is the object; the type stays out of its way.

- Global reset, `body` background `#0b0a09`, text `#f2eee6`, dim text `#a29a8c`, a hairline rule at `rgba(242,238,230,.16)`, accent `#c9a227`. Serif display face for the wordmark and the headline, a neutral sans for everything else.
- `.stage` is `position: relative`, `overflow: hidden`, with a radial gradient behind everything: `radial-gradient(120% 90% at 50% 30%, #1a1713 0%, #0b0a09 70%)`. The renderer is created with `alpha: true` and a clear alpha of 0, so this gradient — not a colour baked into WebGL — is what you see around the object.
- `.stage__poster` and the canvas share the same box: both `position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover`.
- The poster fades out with a 700ms opacity transition, driven by a class the script adds. **Never `display: none` on the poster** — pulling it out of flow at the exact moment the canvas appears is a layout shift, and it is the LCP element.
- `.ui` is a three-row grid (`auto 1fr auto`) with `pointer-events: none`, and `pointer-events: auto` restored only on links and buttons. Without that the overlay eats the drag on the object.
- `.foot` is a two-column grid: the finish card and the buttons stack in column one, the drag hint sits in column two. Below 900px it collapses to a single column.
- The finish buttons are pills with a 16px round colour chip. **The chip colour is set by the script from the material's own `color`**, as an inline custom property — not a hand-picked swatch that can drift from what the material actually does.
- The headline carries `text-shadow: 0 2px 28px rgba(11,10,9,.75)`, and it sits at the **bottom** of its grid row at every width. Do not centre it below 900px: the object lives in the top ~56% of a phone viewport, and a vertically centred headline lands straight across the case — type over the one surface the whole component exists to show. At the bottom of the row it stacks with the finish card instead and the watch gets the upper half to itself.
- Under `@media (prefers-reduced-motion: reduce)` the hint dot stops pulsing and the poster and button transitions are removed.

## Assets

Everything is served from this domain with a content hash in the filename. **No third-party CDN, for any of it** — not the model, not the environment, not the fonts. These are the exact URLs; the hash is part of the name and must be copied verbatim.

| URL | what it is |
| --- | --- |
| `https://motionprompts.dev/c/3d-material-finish-switcher/model-1386d117.glb` | 241 KB, 16.098 triangles, six meshes, no textures |
| `https://motionprompts.dev/c/3d-material-finish-switcher/env-ced5c4d3.hdr` | 72 KB, 512×256 Radiance RGBE, a generated studio |
| `https://motionprompts.dev/c/3d-material-finish-switcher/finishes-2c8f5795.json` | the four finishes, mesh by mesh |
| `https://motionprompts.dev/c/3d-material-finish-switcher/poster-e92111e8.webp` | 30 KB, 1600×1000 |
| `https://motionprompts.dev/c/3d-material-finish-switcher/fonts/fraunces-latin-48282a41.woff2` | Fraunces variable, latin subset, 66 KB (OFL) |
| `https://motionprompts.dev/c/3d-material-finish-switcher/fonts/inter-latin-c9407645.woff2` | Inter variable, latin subset, 47 KB (OFL) |

In the demo they are referenced as root-relative paths — `/c/3d-material-finish-switcher/model-1386d117.glb` and so on. Point them at your own host if you self-host, but **do not shorten the names**: the hash is what lets them be cached forever.

**On the model.** It came out of an asset pipeline that welds, decimates to a triangle target, **strips every texture**, and compresses with meshopt. Stripping the textures is the point: the finish comes from the material at runtime, so a generator's baked maps are pure weight and they fight the preset.

Its six meshes carry these names, and they are the same strings the finishes file uses in `nombre` — match on the name, do not assume an order:

| mesh | triangles | what it is |
| --- | --- | --- |
| `Circle001` | 512 | the glass crystal over the dial — the one that takes the transmission material |
| `Circle001_1` | 14.880 | the case body |
| `Circle001_2` | 480 | the pinion the hands turn on, at the centre of the dial |
| `vintage_pocket_watch_hour_hand` | 154 | hour hand |
| `vintage_pocket_watch_minute_hand` | 44 | minute hand |
| `vintage_pocket_watch_second_hand` | 28 | second hand |

The first three come from one glTF mesh with three primitives, which is why the loader gives them the `_1` / `_2` suffixes.

**On the HDRI, and why it is not a photograph.** It is the only light in the scene — there are no `THREE.Light` objects at all — so it decides the whole appearance of every finish, and on this object it decides it through a very small window.

The watch case is nearly flat. A flat surface reflects a narrow cone of directions (here about ±45° around one axis, widening only at the rim), so the environment inside that cone is the entire finish and everything outside it is invisible. This component originally shipped `empty_warehouse_01`, picked for having the brightest worst case across the four finishes; what it actually put in the cone was one large, evenly lit concrete wall — a single flat value — under which a mirror-polished steel and a matte plastic render identically. **Brightness is the wrong objective. Contrast inside the reflected cone is the objective.**

So the environment is generated rather than photographed, and it is aimed at the geometry:

- The camera is at +Z looking at −Z and the model is tilted −0.3 rad about X, which puts the centre of the case reflecting azimuth +90° (behind the camera) at elevation ≈ +34°.
- A large soft panel occupies that azimuth from about +29° to +78° of elevation, so its **feathered lower edge lands at +34°**: that edge is the terminator across the case.
- Two soft vertical gaps in the panel — window mullions — are what a polished case sweeps across as it sways. Without them a big panel reflects as one flat field.
- Two thin bright bars inside the panel give the mirror finishes (roughness 0.09) a crisp highlight; the rougher ones simply blur them away.
- Two narrow rim strips near ±150° rake the bezel and the bow while the visitor drags the case around.
- The room itself is nearly black (about 0.015 of radiance) with a weak, broad ceiling. The ceiling is not decoration: the red lacquer is the one finish with a diffuse term, and without it the lacquer and the blank caseback go black.

Any generator will do; the numbers that matter are the ones above. Keep 512 px of width whatever you build: `PMREMGenerator._fromTexture()` calls `_setSize(image.width / 4)`, so the cubemap three builds is 128² per face whatever you feed it beyond that. A studio like this also encodes to 72 KB where the warehouse photograph cost 416 KB, because most of the frame is a constant.

**On the finishes file.** The top level is an **object**, not an array. Everything the component needs is under the `acabados` key:

```jsonc
{
  "_procedencia": "…",          // de dónde salió cada export, en prosa
  "_presets": "…",
  "_entorno": "…",
  "_exposicion": 1.15,          // el toneMappingExposure con el que se calibró
  "acabados": [                 // ← esto es lo que se recorre
    { "id": "metal", "etiqueta": "Brushed metal", "sandbox": { /* … */ } }
  ]
}
```

The keys that begin with an underscore are provenance notes for whoever opens the file; ignore them at runtime, except `_exposicion` if you would rather read the exposure than hard-code it.

Each `sandbox` value is the untouched export of a material sandbox; the part the component reads is `sandbox.modelo.meshes[]`, and each entry there is:

```json
{ "nombre": "Circle001", "visible": true, "preset": "cristal",
  "material": { "mode": "transmission", "samples": 10, "resolution": 1024, "transmission": 1,
                "thickness": 0.9, "roughness": 0.06, "chromaticAberration": 0.06,
                "anisotropicBlur": 0.1, "distortion": 0.12, "distortionScale": 0.35,
                "temporalDistortion": 0.08, "ior": 1.5, "backside": true,
                "backsideThickness": 0.35, "transmissionSampler": false } }
```

`mode` is either `"transmission"` or `"physical"` and decides which class to build. A `"physical"` entry carries `color, roughness, metalness, ior, clearcoat, clearcoatRoughness, sheen, sheenColor, sheenRoughness, iridescence, iridescenceIOR, iridescenceThicknessRange, anisotropy, anisotropyRotation, envMapIntensity, transmission, thickness` — copy them one to one onto a `MeshPhysicalMaterial`, with one exception below. **Copy `iridescenceThicknessRange` as a new array**, not the reference: the JSON is re-read on every finish change and three keeps the array you hand it.

**`anisotropy` is the exception, and getting it wrong is the single worst bug this component can have.** Setting it above 0 defines `USE_ANISOTROPY`, and from that moment the environment reflection leaves `getIBLRadiance` for `getIBLAnisotropyRadiance`, which bends the normal along the surface **bitangent**. That bitangent comes from `normal_fragment_begin`: with `USE_TANGENT` it is the attribute, otherwise it is `getTangentFrame(-vViewPosition, normal, vUv)`, derived from `dFdx(uv)` / `dFdy(uv)`. This model has **neither tangents nor UVs** — the pipeline strips texture coordinates along with the textures — so `vUv` is the constant `(0,0)`, both derivatives are zero, the frame comes back with two zero columns, and `normalize(cross(vec3(0), viewDir))` sends every fragment of the case to the same undefined direction.

What that looks like is not a subtle shading error. The case renders **one flat colour with no reflection at all**, only a faint Fresnel rim: a cream plastic egg where a steel case should be. It hits exactly one preset, `metal` — `anisotropy: 0.9` — which is the default one, which is the one every poster, social card and thumbnail gets made from. The other three carry `anisotropy: 0` and are unaffected.

So keep consuming the JSON verbatim and check the capability against the geometry instead: pass `anisotropy` through only if every mesh you are about to paint has a `tangent` or a `uv` attribute, and pass `0` otherwise. Give the model tangents and the grain comes back on its own.

```js
const supportsAnisotropy = (meshes) =>
  [...meshes.values()].every(
    (m) => m.geometry?.getAttribute("tangent") || m.geometry?.getAttribute("uv"),
  );
```

An entry whose `material` is `null` means "leave the file's own material alone"; skip it. `visible: false` means hide that mesh.

The four `id` values are `metal`, `tornasol`, `laca` and `cristal`, in that order, and their `etiqueta` values are `Brushed metal`, `Iridescent`, `Red lacquer` and `Cut glass`. **The one-line note under the finish name is not in the JSON** — the file describes materials, not copy. It lives in the component as a small map keyed by `id`:

```js
const NOTES = {
  metal: "Satin steel, drawn on the lathe. The crystal is left as glass.",
  tornasol: "A thin film over polished steel: the hue walks with the angle.",
  laca: "Twelve coats of red lacquer under a mirror clearcoat.",
  cristal: "The case itself in glass. Only the hands stay metal.",
};
```

## Core effect (be exhaustive — this is the whole component)

### Renderer, scene, camera

- `WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })`, clear colour `0x000000` with alpha `0`.
- `toneMapping = ACESFilmicToneMapping`, `outputColorSpace = SRGBColorSpace`, `toneMappingExposure = 1.15`. **The exposure is part of the finish**, not a taste knob: the numbers in the JSON were calibrated against this value and this HDRI. Change it and every finish shifts.
- `PerspectiveCamera(32, w / h, 0.01, 100)`, positioned on the +Z axis looking at the origin. No controls library.
- Environment: load the `.hdr` with `HDRLoader`, then

  ```js
  envMap.mapping = THREE.EquirectangularReflectionMapping;
  envMap.colorSpace = THREE.LinearSRGBColorSpace;
  scene.environment = envMap;
  ```

  and stop there. **Do not run `PMREMGenerator` by hand.** Assigning an equirectangular texture to `scene.environment` makes the renderer build the cubeUV internally; doing it yourself produces a different image. `scene.background` stays `null` so the CSS gradient shows through — except for one frame-local exception described below.

### Framing

Load the model, then scale and recentre it so the composition does not depend on the units the file was exported in: measure a `Box3`, scale by `2.05 / max(size.x, size.y, size.z)`, re-measure, and subtract the new centre from the model's position.

Then wrap the model in a `Group` and move **the group**, not the model. The group is what rotates; a model displaced inside its own pivot would orbit instead of turning in place. Tilt the group about X by about −0.3 rad.

That tilt and the environment are a **pair**, not two independent taste calls: −0.3 rad is what puts the centre of the case reflecting elevation ≈ +34°, which is where the studio panel has its edge. Change the tilt and the finish loses its terminator; change the environment and you have to move the edge to wherever the new tilt looks.

Placement is responsive, and it lives in JS because what moves is the camera and the pivot, not a box: above 900px the group sits right of centre and slightly up with the camera closer; at or below 900px it centres, rises, and the camera pulls back. Recompute on resize together with `camera.aspect`, `updateProjectionMatrix()` and `setSize`.

### Building a material from a finish entry

`mode: "physical"` is a plain `MeshPhysicalMaterial` with the keys copied across. `mode: "transmission"` is `MeshTransmissionMaterial` from `@pmndrs/vanilla`, and there are exactly three traps in it:

```js
const m = new MeshTransmissionMaterial({
  samples: Math.max(1, Math.round(c.samples)),   // (1)
  transmissionSampler: !!c.transmissionSampler,
});
m.uniforms.transmission.value  = c.transmissionSampler ? c.transmission : 0;   // (2)
m.uniforms._transmission.value = c.transmission;                               // (2)
m.uniforms.thickness.value = c.thickness;
m.uniforms.roughness.value = c.roughness;
m.uniforms.chromaticAberration.value = c.chromaticAberration;
m.uniforms.anisotropicBlur.value = c.anisotropicBlur;
m.uniforms.distortion.value = c.distortion;
m.uniforms.distortionScale.value = c.distortionScale;
m.uniforms.temporalDistortion.value = c.temporalDistortion;
m.ior = c.ior;                                                                 // (3)
```

1. **`samples` is interpolated raw into the GLSL** (`for (float i = 0.0; i < ${samples}.0; i ++)`). A non-integer emits `10.5.0`, the shader fails to compile, and the mesh renders black with nothing in the console worth reading. It is also baked in: changing it later means building a new material, not assigning a uniform.
2. **The `transmission` uniform must stay 0** unless `transmissionSampler` is on, and the real value travels in `_transmission`. If `material.transmission` is greater than zero, `WebGLRenderer` puts the mesh in its own transmissive pass and pays two extra renders per frame that this component never reads. The injected shader chunk assigns `_transmission` to `material.transmission` internally.
3. **`ior` is not a constructor option.** The class defines uniform accessors for its own keys only, and `ior` is not one of them, so this is the inherited `MeshPhysicalMaterial` property. Passing it to the constructor silently does nothing.

Cache **by preset, not by mesh**: six meshes carry at most two distinct finishes at a time, so one material instance per preset saves five shader compilations on every change. Dispose the previous set before building the new one.

### The shared refraction buffer

The class from `@pmndrs/vanilla` is *only the material*. It declares a `buffer` uniform and reads it in the shader, but **nothing fills it** — in the React component that is a `useFrame`, and here it is yours. Once per frame, before the main render:

```js
for (const { material } of transmissive) material.uniforms.time.value = elapsedSeconds;

const oldTone = renderer.toneMapping;
const oldBackground = scene.background;
renderer.toneMapping = THREE.NoToneMapping;   // (a)
scene.background = envMap;                    // (b)

for (const { mesh } of transmissive) mesh.material = discardMaterial;   // (c)
renderer.setRenderTarget(target);
renderer.render(scene, camera);
renderer.setRenderTarget(null);

renderer.toneMapping = oldTone;
scene.background = oldBackground;
for (const { mesh, material } of transmissive) {
  mesh.material = material;
  material.uniforms.buffer.value = target.texture;
}
```

- (a) No tone mapping into the buffer: the shader applies it again when composing, and doing it twice washes out the highlights.
- (b) The main pass leaves the canvas transparent so the CSS gradient shows. If the buffer were filled with that same emptiness the glass would refract black, so the environment is used as the background **for this pass only**, then restored.
- (c) The transmissive meshes are swapped for a material that discards every fragment, so the glass does not appear inside its own refraction.

The render target is `WebGLRenderTarget(size, size, { minFilter: LinearFilter, magFilter: LinearFilter, type: HalfFloatType })` with `samples = 0`. Its size comes from the `resolution` value in the JSON, scaled by the current quality rung.

**One pass for all of them**, not one per material. This is the whole reason for using the class instead of the React component: that component allocates two render targets and renders the entire scene *per instance*, so the all-glass finish would cost six scene passes. The price of the shared path is that there is **no backside pass** — on a lone convex solid that second pass is what gives volume; over an arbitrary mesh it doubles the cost without an equivalent gain. `backside` and `backsideThickness` are in the JSON and this component ignores them.

### The loop

One `requestAnimationFrame` loop. The rotation is two angles added together: an idle **sway**, and an **offset** the pointer owns, which is an integrator — there is no authored duration anywhere.

```js
live.phase += dt;
live.velocity *= Math.pow(1 - config.friction, dt);
live.offset += live.velocity * dt;
if (!live.dragging) live.offset *= Math.pow(1 - config.recenter, dt);
live.model.rotation.y =
  live.offset +
  Math.sin((live.phase * Math.PI * 2) / config.swaySeconds) * ((config.sway * Math.PI) / 180);
```

**Do not make this a continuous turn**, however tempting a slowly revolving object is. Only one side of this watch is worth looking at — the bezel, the crystal and the hands — and the other is a blank polished lid. An earlier version turned at 1.6 rpm, which meant a 37-second cycle with half of every one of them spent on the lid, and any still taken of the page (the poster, the social card, the gallery thumbnail, the first second of a screen recording) had a coin-flip chance of catching it. A sway keeps the dial towards the camera and still moves the highlight across the case, which is the thing that actually sells a finish.

`sway` is the amplitude in degrees (about 24) and `swaySeconds` one full swing (about 11). `friction` is the fraction of the drag impulse lost per second (about 0.86) and `recenter` the fraction of the leftover angle given back per second (about 0.35), which is what walks the case home to the dial; do not apply it while the pointer is down, because dragging against a spring feels like a fault. Dragging adds `deltaX * 0.02` to `velocity` on every move; pressing a finish button adds a fixed kick of about 2.4, enough to swing the case round to the rim and back. Clamp `dt` to 0.1 s so a backgrounded tab does not jump on return.

The starting angle on Y is **zero, on purpose**: the dial of this `.glb` faces +Z (its glass sits at z = +0.15 against a case centred on z = −0.02) and the camera is on +Z, so at rest the visitor is already looking at the crystal.

The class **does not advance `time` by itself**: write `material.uniforms.time.value` every frame or `temporalDistortion` is frozen.

After the first successful render — not when the canvas is created — add the class that fades the poster out. Between those two moments sit the model download and the transmission shader compilation, which is the most expensive thing in the whole start-up.

### Pointer

`pointerdown` on the stage with `setPointerCapture`, `pointermove` / `pointerup` / `pointercancel` on the window, matching the captured `pointerId`. `touch-action: pan-y` on `.stage` so a vertical swipe still scrolls the page.

### The capability gate

Decided **once**, before anything is downloaded, and it sets a **ceiling**, not a floor. Three rungs: `full` (real transmission), `physical` (`MeshPhysicalMaterial` everywhere, and the crystal becomes a transparent white physical material with the same roughness and ior but `transmission` at zero), and `poster` (no canvas at all).

Straight to `poster`:

- `matchMedia("(prefers-reduced-motion: reduce)")` — and this must run **before** the fetches, so a visitor who asked for less motion downloads none of the ~340 KB.
- `navigator.connection?.saveData`.
- No WebGL2 context at all.
- `hardwareConcurrency <= 2` or `deviceMemory <= 2`.

Capped at `physical`:

- A WebGL2 context that succeeds normally but **fails with `{ failIfMajorPerformanceCaveat: true }`**. That difference is the signal: the browser is telling you it would rasterise in software. It is far more reliable than reading `UNMASKED_RENDERER`, which many browsers now obfuscate.
- Coarse pointer **and** a narrow viewport (`min(innerWidth, innerHeight) <= 820`). Coarse pointer alone would sweep in touch laptops, which handle the full scene fine.
- `hardwareConcurrency <= 4` or `deviceMemory <= 4`.

Release the probe context with `WEBGL_lose_context` — a browser only allows on the order of eight to sixteen live contexts per tab.

This gate is deliberately harsher than the usual one, and the reason is measurable: the transmission shader in `@pmndrs/vanilla` is an earlier revision than the one in the React component and does roughly three times the per-pixel work. It recomputes the Fresnel term once per colour channel, it has no shortcut when `chromaticAberration` is zero nor when `roughness` is zero, and it recomputes the Beer coefficient inside the sample loop. Same picture, more work. A phone should never see it.

### Deferred creation and the pause

An `IntersectionObserver` with `rootMargin: "200px"` owns the canvas. First intersection builds the scene; leaving the viewport cancels the loop; returning restarts it. Guard the build with a flag — the build is asynchronous, and a second notification while the first is still in flight would create a second renderer.

### Degrading under load

Measure the mean frame time over a rolling window of 60 frames, roughly a second at 60Hz — long enough not to react to the first shader compilation, short enough to help before the visitor gives up. Over budget (1000/30 ms) for three consecutive windows: drop one rung and reset the count. **Never climb back up**; an object oscillating between two qualities looks worse than one that stayed at the bad one.

The rungs, in order: buffer at full resolution and pixel ratio up to 2 → buffer at half → buffer at a quarter and pixel ratio pinned to 1 → the `physical` tier with no buffer at all → unmount everything and leave the poster. That last step only fires from the bottom rung and only when the mean is worse than 1000/10 ms. Note that `setPixelRatio` alone does not resize the drawing buffer; call `setSize` again after it.

Publish the current rung on the section as `data-tier` and `data-quality`. It is not decoration: it is the only way anyone — a test, or a person with the inspector open — can confirm from outside that the gate and the ladder did what they claim.

### Context loss

Listen for `webglcontextlost` on the stage **in the capture phase** — the event fires on the canvas, which does not exist yet when the listener is registered. Call `preventDefault()`, then tear the scene down and leave the poster. Do not attempt to restore: a machine that just lost its context is the last place to start recompiling a transmission shader. The rest of the page must stay exactly as it was.

### Teardown

Cancel the frame. Dispose every geometry in the model, every material you built, the discard material, the render target and the HDR texture. Call `renderer.dispose()` and remove the canvas from the DOM. The cubeUV texture that actually lights the scene is a *derived* texture the renderer built; it goes with `renderer.dispose()`, not with disposing the file's texture. Remove all four pointer listeners, the resize listener, the context-lost listener, and disconnect the observer.

## Behavior notes

- The default finish is the first entry in the JSON. The card above the buttons shows its label and a one-line note; both update on selection, and `aria-pressed` moves with them.
- The model keeps swaying while a finish is being rebuilt; nothing blocks the loop.
- `#0b0a09` and the radial gradient are the CSS background, not the clear colour, so the poster, the canvas and the empty state all sit on the same surface.

## Using this outside its demo page

The section is self-contained: one root element, one canvas, no page-level side effects beyond the global CSS reset and the `body` colours, which you should scope if you are dropping this into an existing page. It does not own the scroll, it does not lock `overflow`, it does not assign `window.onload`, and it does not touch any element outside `.stage`. Two copies on one page would both target the first `.stage`; scope the lookup to a root element if you need more than one. The asset URLs are absolute paths under `/c/3d-material-finish-switcher/` — point them at your own host and keep the content hashes.

## Adapting this to React

Everything above describes a standalone document: one script that runs once, reaches into the page with `document.querySelector`, and never has to undo itself. React withdraws all three of those guarantees at once, and it does it quietly — the component renders, looks right for a moment, and then misbehaves in a way that does not point back at any of this.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Setup that runs twice with teardown that runs never leaves you two of everything: two WebGL contexts on the same section, two render loops driving the same GPU. The visible symptom is a halved framerate or a blank canvas once the browser hits its context limit, and it will not reproduce in a production build, because React only does the double mount in development. Treat the cleanup as part of the effect, not as an afterthought.

**There are two valid paths below, and you pick one.** The first keeps the imperative code above and only fixes its lifecycle. The second replaces it with `@react-three/fiber`. They are alternatives, not stages — do not mix pieces of the two.

The choice is not a matter of taste, and it is decided by one question: **is `@react-three/fiber` already in your app?** If it is, take Path B — running an imperative `WebGLRenderer` next to a `<Canvas>` means two renderers and two clocks against the same GPU. If it is not, take Path A and keep the code above; adding R3F to a project for one hero costs about 150 KB gzip of React-side runtime, which is a bigger bill than this component. A third case decides itself: `@pmndrs/vanilla` is a dependency of Path A only, so if you cannot add it, Path B is the one that will build.

### Path A — keep the imperative scene

*(1) The entry point* — The script checks `document.readyState` before subscribing to `DOMContentLoaded`. That guard exists to survive being loaded late in a plain document; in React it is dead weight, because `useEffect` already runs after the DOM is committed. Drop the guard and the listener both, and keep only the body, inside a `useEffect` with an empty dependency array.

*(2) Element lookups* — Every `document.querySelector` above assumes this component owns the document. Give the component a root `ref`, render it on the section, and scope every lookup to it. Unscoped selectors are not a style problem here: during the StrictMode remount two copies of the subtree exist for an instant, and an unscoped selector will bind to the one that is on its way out — you would append the canvas to a section that is about to be discarded and see nothing at all.

*(3) The effect must not be `async`* — This scene waits for three fetches before it can build anything, and the obvious way to write that is the one that breaks. Do not make the effect callback `async`, and do not wrap the setup in an `async` function whose return value you treat as the cleanup. Both produce the same silent break: the setup returns a **promise**, not a teardown function, so React has nothing to call on unmount — and in React 19 that is not a no-op, it throws `cleanup is not a function` and takes the whole tree down with it. The shape that works is a synchronous effect that starts the asynchronous work and returns a synchronous cleanup, with a flag the cleanup flips:

```jsx
useEffect(() => {
  let cancelled = false;
  let raf = 0;
  let scene = null;
  loadEverything().then((built) => {
    if (cancelled) { built.dispose(); return; }   // el desmontaje ya paso
    scene = built;
    const tick = () => { raf = requestAnimationFrame(tick); scene.render(); };
    raf = requestAnimationFrame(tick);
  });
  return () => { cancelled = true; cancelAnimationFrame(raf); scene?.dispose(); };
}, []);
```

Note what that cleanup has to survive: it can run **before** the model has finished downloading. If it only cancels the loop, the model resolves a second later, gets added to a scene nobody draws, and its GPU memory is never freed. The flag has to be checked inside the continuation and the already-built resources disposed there.

*(4) The loop* — Keep the handle the last `requestAnimationFrame` returned and call `cancelAnimationFrame` in the cleanup. A loop that re-schedules itself and is never cancelled survives the unmount and keeps running for the life of the page — one more copy every time the user visits this route, each one still rendering a scene that is no longer on screen.

*(5) Everything else the effect created* — the `IntersectionObserver` (disconnect it), the four pointer listeners, the resize listener, the context-lost listener, and the whole GPU teardown described under **Teardown** above. The test of a correct adaptation is not that it looks right on first load — it is that you can navigate away to another route and come back and nothing has accumulated.

### Path B — `@react-three/fiber`

**If your host app is React**, the imperative setup maps onto R3F rather than being ported line by line. Reference versions: three 0.185, `@react-three/fiber` 9, `@react-three/drei` 10.7, React 19.

- The renderer, scene and camera stop being yours: `<Canvas>` owns them. Delete the `new WebGLRenderer` / `new Scene` / `new PerspectiveCamera` block and describe the scene as JSX. Pass the renderer settings through `gl` and `camera` props — the tone mapping, the colour space, the exposure of 1.15 and `alpha: true` all still apply, and the exposure in particular is part of the finish.
- The `requestAnimationFrame` loop becomes `useFrame`. Do not start a loop of your own inside a `<Canvas>`; you would be running a second clock against the same GPU work. Give `<Canvas>` `frameloop="demand"` or `"never"` while the section is off screen instead of cancelling anything by hand.
- `GLTFLoader.load(...)` becomes `useGLTF(url)`, and the model must come **from your own domain**. `useGLTF` accepts a third argument to configure the loader — that is where `setMeshoptDecoder` goes, and it is still mandatory.
- `dpr={[1, 2]}` on `<Canvas>` replaces the manual `setPixelRatio`, and R3F already observes the container, so drop the resize listener and the `setSize` call.
- **Use drei's `<MeshTransmissionMaterial>` and delete the shared-buffer function entirely.** The class you were importing from `@pmndrs/vanilla` *is* the material drei wraps; what drei adds is exactly the per-frame buffer pass you were writing by hand, plus a backside pass this component gave up. Its props map straight onto the JSON: `samples`, `thickness`, `roughness`, `chromaticAberration`, `anisotropicBlur`, `distortion`, `distortionScale`, `temporalDistortion`, `ior`, `backside`, `backsideThickness`, `transmissionSampler` keep their names, and `resolution` — which has no equivalent on the class, because the render target was yours — becomes a prop. Pass the JSON's `transmission` value straight to the `transmission` prop: the component handles the `_transmission` swap internally, so the trap described above disappears on this path. **Do not** also set `_transmission`.
- Be honest about the trade you just made: drei allocates two render targets **per instance**. On the all-glass finish that is six materials, twelve render targets and six full scene passes per frame. Either keep that finish off the R3F path, or raise the capability gate to match.
- Anything you create by hand inside a component — geometries, materials, render targets — must be disposed when it unmounts. Prefer the declarative form so R3F disposes it for you.

**A static poster is mandatory, not a nicety**, and on this component it is also the fallback the capability gate falls back to. Render it as a real `<img>` in the same box and swap it out after the first frame. Keep it mounted underneath rather than unmounting it — you need it back if the context is lost.

**Do not use drei's `Environment` with a `preset`.** The presets are fetched from a third-party CDN hard-coded inside drei, so a page that uses one depends forever on a host neither you nor this catalogue controls — and it fails closed, with an unlit scene, when that host is unreachable. Point `<Environment files="…" />` at your own `.hdr` instead, which is what the asset list above already gives you.

**Guard every continuation.** `useGLTF` suspends, the HDR load resolves whenever it resolves, and either can land **after** the StrictMode unmount. A callback that runs against a component that no longer exists will write to a ref that has been cleared or call a global refresh on behalf of something that is gone. Guard the asynchronous continuations with the same cancellation flag the cleanup sets, and cancel what can be cancelled.
