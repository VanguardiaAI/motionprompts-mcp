---
slug: studiodialect-image-gallery
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# 3D Spiral Image Gallery

## Goal
Build a single scrollable hero where **75 curved image tiles wind down a five-revolution 3D helix**, rendered in WebGL. Ten editorial photos are cycled across the tiles, a **custom shader dims each tile as it turns away from the camera** (depth shading around the spiral), the whole spiral **slowly auto-rotates and gets spun by scroll velocity** (with inertial decay), and **scroll progress lerps the camera downward through the helix** so you appear to descend the spiral. On desktop, mouse position adds a subtle X/Z parallax tilt to the whole spiral. Smooth scroll via Lenis. After the tall hero comes a short second section.

## Tech
Vanilla HTML/CSS/JS with ES module imports (Vite/npm project). Use `three` for all WebGL and `lenis` for smooth scroll. **No GSAP, no ScrollTrigger** — all motion is a hand-rolled `requestAnimationFrame` loop with manual lerp/inertia. Put the two GLSL shader strings in a separate `shaders.js` and import them. Instantiate Lenis once with `new Lenis({ autoRaf: true })` (it drives its own rAF; you still run your own render loop separately).

## Layout / HTML
Two stacked sections; the WebGL canvas is injected into the first by JS.

```html
<section class="hero">
  <h1>Somewhere between structure and disorder new forms quietly start to emerge</h1>
</section>
<section class="about">
  <h3>New forms begin here</h3>
</section>
<script type="module" src="./script.js"></script>
```

The JS queries `.hero`, creates the renderer, and appends `renderer.domElement` into `.hero`. Copy text is neutral editorial filler — no brand names.

## Styling
**Font** — a tight uppercase grotesk. Load **Hanken Grotesk** from Google Fonts via `@import url("https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600;700;800&display=swap")` with `sans-serif` fallback; any neutral grotesk of that width is fine.

- `* { margin:0; padding:0; box-sizing:border-box }`
- `body { font-family:"Hanken Grotesk", sans-serif }`
- `h1, h3 { text-transform:uppercase; letter-spacing:-0.1rem; line-height:0.8 }`
- `h1 { font-size:clamp(3.5rem, 10vw, 15rem) }` (massive, wall-of-text)
- `h3 { font-size:clamp(2.5rem, 5vw, 7.5rem) }`
- `section { position:relative; width:100%; padding:2rem; color:#d2d2d2; overflow:hidden }`
- `.hero { height:150svh; background:#242424; text-align:justify }` — the extra height (1.5 viewports) is the scroll runway that drives the camera descent; `text-align:justify` spreads the H1 edge to edge.
- `.about { height:100svh; background:#171717; display:flex; justify-content:center; align-items:center; text-align:center }`
- `canvas { position:absolute; top:0; left:0; width:100%; height:100% }` — fills the hero, sits under the H1.
- `@media (max-width:1000px) { .hero { height:125svh } }`

## The effect (be exhaustive — Three.js helix + shader + interaction)

### Config (module constant `CONFIG`)
```js
const CONFIG = {
  totalImages: 10,
  tilesPerRevolution: 15,
  revolutions: 5,
  startRadius: 5,
  endRadius: 3.5,
  tileHeightRatio: 1.1,
  tileSegments: 24,
  spiralGap: 0.35,
  tileOverlap: 0.005,
  cameraZ: 12,
  cameraSmoothing: 0.075,
  baseRotationSpeed: 0.001,
  scrollRotationMultiplier: 0.0035,
  rotationDecay: 0.9,
  scrollMultiplier: 1.25,
  cameraYMultiplier: 0.2,
  parallaxStrength: 0.1,
};
```
Derived: `totalTiles = Math.floor(tilesPerRevolution * revolutions)` = **75**; `angleStep = (Math.PI*2) / tilesPerRevolution` (24° per tile → 15 tiles per full turn).

### Scene / renderer / camera
- `scene = new THREE.Scene()`.
- `camera = new THREE.PerspectiveCamera(75, hero.clientWidth / hero.clientHeight, 0.1, 1000)`; `camera.position.z = CONFIG.cameraZ` (12). Aspect is tall because the hero is 150svh.
- `renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true })`; `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`; `renderer.setSize(hero.clientWidth, hero.clientHeight)`; append `renderer.domElement` to `.hero`.
- Shared uniform object: `const cameraPositionUniform = { value: new THREE.Vector3(0, 0, CONFIG.cameraZ) }` — every tile material references this same object, updated each frame.

### Textures
Load 10 images with `THREE.TextureLoader` from `/c/studiodialect-image-gallery/img${i+1}.jpg` (i = 0..9). In each load callback set `t.minFilter = THREE.LinearMipmapLinearFilter` and `t.anisotropy = renderer.capabilities.getMaxAnisotropy()`. Store in a `textures` array.

### Precompute the vertical edges of every tile (`tileEdgesY`)
Start `const tileEdgesY = [0];`. For `i` in `0..totalTiles-1`:
```
progress  = i / totalTiles;
radius    = startRadius + (endRadius - startRadius) * progress;   // 5 → 3.5 (radius tapers inward as you descend)
arcWidth  = (2*Math.PI*radius) / tilesPerRevolution;
tileHeight= arcWidth * tileHeightRatio;                            // 1.1× → slightly taller than wide
tileEdgesY.push(tileEdgesY[i] - (tileHeight + spiralGap) / tilesPerRevolution);
```
This yields a monotonically decreasing array of Y break-points; consecutive tiles step down by a fraction of `(tileHeight + gap)`, so a full revolution (15 tiles) drops by roughly one tile-height + gap.

### Build the spiral (custom curved geometry per tile)
`const spiral = new THREE.Group(); scene.add(spiral);` Then for each `i` in `0..totalTiles-1`:
- Recompute `progress, radius, arcWidth, tileHeight` as above.
- `tileAngle = arcWidth/radius + tileOverlap` (angular width of the panel, plus a hair of overlap to hide seams).
- `centerY = (tileEdgesY[i] + tileEdgesY[i+1]) / 2` (vertical center of this tile).
- `slope = tileEdgesY[i+1] - tileEdgesY[i]` (negative — the amount the tile must shear downward across its width so its edges meet the neighbours into a continuous ramp).

Build a `BufferGeometry` by hand — a 2-row × (`tileSegments`+1)-column strip (segments = 24 → 25 columns). Loop `row` 0→1, `col` 0→segments:
```
angle = (col/segments - 0.5) * tileAngle;
position = [ Math.sin(angle)*radius,
            (row-0.5)*tileHeight + (col/segments - 0.5)*slope,
            Math.cos(angle)*radius ];
uv = [ col/segments, row ];
```
So each tile is a **curved arc** at distance `radius` from the Y axis (x/z from sin/cos), spanning `tileHeight` vertically, sheared by `slope` across its width so it leans down the helix. Indices: for each `col` 0..segments-1, two triangles `(current, below, current+1)` and `(below, below+1, current+1)` where `below = current + segments + 1`. Call `computeVertexNormals()`.

Material (per tile):
```js
new THREE.ShaderMaterial({
  vertexShader, fragmentShader,
  uniforms: {
    uMap: { value: textures[i % CONFIG.totalImages] },   // photos cycle every 10 tiles
    uCameraPosition: cameraPositionUniform,               // shared object
  },
  side: THREE.DoubleSide,
});
```
Then: `mesh.position.y = centerY;` wrap it in a per-tile `THREE.Group` whose `rotation.y = i * angleStep;` add the mesh to that group and the group to `spiral`. The Y-rotation per tile (24°) plus the descending `centerY` is what coils the 75 tiles into a 5-turn helix.

Finally: `const spiralHeight = Math.abs(tileEdgesY[totalTiles]);` — total vertical span of the helix, used to scale the camera descent.

### Shaders (`shaders.js`)
**Vertex** — pass through UV and world-space normal/position:
```glsl
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
void main() {
  vUv = uv;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
```
**Fragment** — sample the photo and **dim tiles facing away from the camera**:
```glsl
uniform sampler2D uMap;
uniform vec3 uCameraPosition;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
void main() {
  vec4 tex = texture2D(uMap, vUv);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  float facing = max(dot(-normalize(vWorldNormal), viewDir), 0.0);
  float falloff = smoothstep(-0.2, 0.5, facing) * 0.45 + 0.42;   // ~0.42 (back) → ~0.87 (front)
  vec3 color = mix(vec3(1.0), tex.rgb * falloff, 0.975) * 1.25;   // slight white lift, then ×1.25 brighten
  gl_FragColor = vec4(color, tex.a);
}
```
Net look: tiles on the far side of the spiral read noticeably darker; tiles facing the camera are bright and slightly washed/lifted. The `-normalize(vWorldNormal)` inverts the normal so DoubleSide back-faces still shade correctly.

### Input state
- `let scrollY = 0, spinVelocity = 0;`
- `lenis.on("scroll", (e) => { scrollY = window.pageYOffset; spinVelocity = e.velocity * CONFIG.scrollRotationMultiplier; })` — Lenis reports scroll velocity; multiply by 0.0035 to convert it into an angular kick.
- Mouse (range −1..1): on `window` `mousemove`, `mouseX = (e.clientX/window.innerWidth - 0.5)*2`, `mouseY = (e.clientY/window.innerHeight - 0.5)*2`. Keep smoothed copies `smoothX, smoothY` (start 0).
- `let isMobile = window.innerWidth < 1000;`

### Render loop (`requestAnimationFrame`, the star)
```js
function animate() {
  requestAnimationFrame(animate);

  // 1. Scroll progress → camera descent (eased)
  const progress = Math.min(scrollY / (window.innerHeight * CONFIG.scrollMultiplier), 1); // 0→1 over 1.25 viewports
  camera.position.y +=
    (-(progress * spiralHeight * CONFIG.cameraYMultiplier) - camera.position.y)
    * CONFIG.cameraSmoothing;                       // lerp toward −(progress·spiralHeight·0.2), factor 0.075

  // 2. Desktop-only mouse parallax tilt on the whole spiral
  if (!isMobile) {
    smoothX += (mouseX - smoothX) * 0.02;           // slow 0.02 follow
    smoothY += (mouseY - smoothY) * 0.02;
    spiral.rotation.x =  smoothY * CONFIG.parallaxStrength;         // pitch  ±0.1 rad
    spiral.rotation.z = -smoothX * CONFIG.parallaxStrength * 0.3;   // roll   ±0.03 rad
  }

  // 3. Feed camera position to the shader (drives the facing/dimming)
  cameraPositionUniform.value.copy(camera.position);

  // 4. Continuous spin + scroll-velocity kick with inertial decay
  spiral.rotation.y += CONFIG.baseRotationSpeed + spinVelocity;     // always drifts at 0.001 rad/frame
  spinVelocity *= CONFIG.rotationDecay;                             // 0.9 decay → spins settle after scroll stops

  renderer.render(scene, camera);
}
animate();
```
Key feel: the spiral **always** rotates slowly (`baseRotationSpeed 0.001`); scrolling injects extra angular velocity proportional to scroll speed, which **decays by ×0.9 each frame** so a flick keeps spinning and coasts to a stop. Camera Y eases (0.075) toward a target proportional to scroll progress × total helix height × 0.2, so scrolling walks the camera down the spiral. Mouse tilt is a separate, very slow (0.02) parallax overlay applied only on desktop.

### Resize
On `window` `resize`: recompute `isMobile = window.innerWidth < 1000`; `camera.aspect = hero.clientWidth / hero.clientHeight`; `camera.position.z = isMobile ? 15 : CONFIG.cameraZ` (pull the camera back on mobile); `camera.updateProjectionMatrix()`; `renderer.setSize(hero.clientWidth, hero.clientHeight)`.

## Assets / images
**10 dreamlike, high-fashion editorial photos, all TALL PORTRAIT orientation (~2:3, roughly 960×1440)** — the texture is stretched across each curved panel so exact ratio is flexible. They cycle across the 75 tiles (`textures[i % 10]`), so each photo appears ~7–8 times around the helix. The set is deliberately **mixed**, not one single mood: it swings between three registers — (a) **soft, hazy, desaturated color** scenes (misty whites, muted greens, warm faded daylight) built around pale, white/platinum-haired figures in ceremonial white dress; (b) **bold saturated studio color** (deep crimson against electric cobalt blue); and (c) **stark, high-contrast black-and-white studio portraits**. Surreal fashion-editorial feel; the contrast between the airy white/green scenes and the punchy studio shots is part of the look. Representative roles by form and content (no brands):

1. Profile-ish shot of a **blindfolded bald young figure** with a bright **red satin ribbon** over the eyes, wearing a ruffled white lace collar and loose white shirt, standing under **gothic stone arches** draped in ivy and small white blossoms; soft green-and-grey daylight — a white scene with one hot red accent.
2. **White-haired figure in a flowing white robe** seated in a **derelict, flower-flooded room** — peeling off-white walls, tall bright window, gilt mirror, stone fireplace, and a vintage TV, with white blossoms carpeting the floorboards; misty white-green palette.
3. **Pale, platinum/albino woman in a long white Victorian lace dress** standing on a small grassy islet flanked by **two black swans** on a **misty dawn pond**, pines behind, water lilies in the foreground; muted foggy greens and whites.
4. Sunlit near-profile of a **platinum-blonde woman** with long hair and **translucent, crystalline glass flowers/butterflies** in her hair and over a sheer dress, set in a pastel **rose garden** under a hazy blue sky; luminous washed-out palette.
5. Full-length studio shot of a **woman in a deep crimson maxi dress and matching red overcoat**, standing against a flat **electric cobalt-blue backdrop** — the most saturated, high-key-color image in the set (bold red-on-blue, no haze).
6. **High-contrast black-and-white profile portrait** of a woman with a sleek dark bob and **pearl drop earrings**, in a black blazer against a plain pale-grey backdrop; crisp monochrome.
7. **High-contrast black-and-white studio portrait** of a bald, androgynous young face, three-quarter view with dramatic side-lit shadow, dark collar, plain grey backdrop.
8. **Soft, grainy black-and-white portrait** of a face seen through billowing **sheer white organza/veil fabric** that half-obscures it; dreamy high-key monochrome.

The remaining tiles continue in these same registers — pale white/floral scenes, one bold saturated studio color shot, and several stark black-and-white portraits — all in the same tall portrait crop. Any similarly eclectic surreal-editorial set works; the deliberate mix of airy washed-out color, one punchy red-on-blue, and high-contrast B&W portraiture matters more than the exact subjects.

## Behavior notes
- **Desktop-only parallax:** the mouse tilt branch is gated behind `!isMobile` (`innerWidth < 1000`); on mobile the spiral only auto-rotates + reacts to scroll, and the camera sits farther back (`z = 15`).
- **Inertia, not scrub:** scroll doesn't directly rotate the spiral — it deposits velocity that decays, so the spin feels weighty and keeps coasting after you stop.
- **Camera descent is clamped:** `progress` maxes at 1 after ~1.25 viewports of scroll, so the camera settles at the bottom of the helix and the `.about` section follows.
- **No reduced-motion guard** in the original; the auto-rotation and render loop run continuously. All colors sit in a near-black palette (`#242424` / `#171717`) so the bright bright tiles pop against the dark surround.

## Images

This component ships with 12 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/studiodialect-image-gallery/img1.jpg
https://motionprompts.dev/c/studiodialect-image-gallery/img10.jpg
https://motionprompts.dev/c/studiodialect-image-gallery/img11.jpg
https://motionprompts.dev/c/studiodialect-image-gallery/img12.jpg
https://motionprompts.dev/c/studiodialect-image-gallery/img2.jpg
https://motionprompts.dev/c/studiodialect-image-gallery/img3.jpg
… 6 more under https://motionprompts.dev/c/studiodialect-image-gallery/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--charcoal`, `--bone`, `--stone`, `--line`, `--vermilion`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that already does most of what a `useEffect` needs: `mount` builds the Lenis instance, the shared `cameraPositionUniform` vector every tile's material reads from, the 75-tile spiral group, the camera and renderer, and the `animate()` loop that drives all three every frame; the function it returns is already a working teardown — cancels the frame, unhooks the `mousemove` and `resize` listeners, tears Lenis down, walks the scene disposing every tile's geometry and material, disposes the ten textures, drops the canvas, and force-loses the WebGL context. What's missing is the same thing missing everywhere else in this catalogue: the file decides for itself when to call `mount`, and neither of its two branches has anything to do with how React schedules effects.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Call `mount()` without returning its own `destroy` as the effect's cleanup, and the second mount finds the first Lenis instance and the first `animate()` loop still alive: two rAF loops racing to render into two canvases stacked inside `.hero`, two `mousemove`/`resize` listeners double-applying the same parallax tilt to two spirals, two Lenis instances fighting over the same wheel event. None of this reproduces in a production build, since only development performs the double mount.

*(1) The entry point* — delete the `if (window.MP && window.MP.register) { … } else { … }` dispatch at the bottom of the file; both halves belong to the standalone demo page and its own visual editor, not to a React host. The `else` branch is the `document.readyState` guard: it exists so a script parsed after `DOMContentLoaded` has already fired still boots, a race `useEffect` never hits because it only runs once the DOM has committed. `mount` already merges whatever config it receives against `DEFAULTS` field by field, through its own `num()`/`count()` helpers, so the effect doesn't need to spread `DEFAULTS` itself — it can hand `mount` this component's own props directly and return whatever it returns:

```jsx
useEffect(() => {
  return mount(props);
}, []);
```

Do not wrap that call, or the effect callback, in `async`. Nothing here is awaited — each of the ten `TextureLoader.load` calls fires a request and returns immediately, and the `destroyed` check inside its callback is what protects a texture that resolves late — so there is nothing to sequence with `await`, and doing it anyway turns the effect's return value into a promise instead of `destroy`, which React has nothing to call on unmount.

*(2) Element lookups* — `mount` looks up its host once, by class, and bails to a no-op cleanup if it isn't there: `const heroSection = document.querySelector(".hero"); if (!heroSection) return () => {};`. Replace that with a root `ref` sized like `.hero` and pass `ref.current` in its place; a StrictMode remount briefly keeps two live copies of the subtree, and an unscoped class selector can bind to the copy that's on its way out instead of the one that just mounted. Once the lookup is ref-scoped, `heroSection.appendChild(renderer.domElement)` already lands the canvas in the right subtree — there's no second selector to fix. The `mousemove` and `resize` listeners are bound to `window` on purpose, because the parallax tilt and the mobile breakpoint both need the whole viewport; leave those two where they are.

*(3) Cleanup* — there is no GSAP or ScrollTrigger anywhere in this file, so the context-revert pattern doesn't apply. Four independent resources have to survive the round trip: the rAF loop, Lenis, the two window listeners, and the GPU memory the spiral holds.

`frame` is a real handle from `requestAnimationFrame`, so `cancelAnimationFrame(frame)` in the cleanup is already correct — keep the `if (frame)` guard, since a remount whose `animate()` hasn't scheduled its first frame yet would otherwise call `cancelAnimationFrame(null)`. Lenis here is built with `{ autoRaf: true }`, so it runs its own internal frame loop; there is no `lenis.raf(time)` call anywhere in this file for you to cancel by hand, and `lenis.destroy()` alone stops that internal loop. Don't conflate it with `animate()`'s own `frame` — that loop drives the camera's descent and the spiral's rotation independently of Lenis's internal tick, and needs its own cancellation regardless of what Lenis does.

The GPU-disposal block — walking `scene` for every mesh's geometry and material, disposing all ten textures, `renderer.dispose()`, `renderer.forceContextLoss()` — has nothing React-specific to change; carry it into the returned cleanup exactly as written. Order matters here: the canvas is removed from `.hero` *before* any disposal call runs, so a throw partway through disposal can't leave the previous mount's canvas stuck behind the next one. Preserve that ordering if you restructure this around R3F's own cleanup.

The `destroyed` flag guarding each texture's load callback already does the job this template asks of asynchronous continuations that can resolve after unmount: a StrictMode teardown landing between issuing the ten `TextureLoader.load` calls and their responses coming back is exactly when a late callback would otherwise write `minFilter`/`anisotropy` onto a texture a finished cleanup has already told to `dispose()`. Keep that check as the first line of every texture callback you port.

*(4) Mapping to `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

`<Canvas gl={{ antialias: true, alpha: true }} dpr={[1, 2]} camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 12] }}>` replaces the `WebGLRenderer` / `Scene` / `PerspectiveCamera` block outright — `dpr={[1, 2]}` reproduces the existing `Math.min(devicePixelRatio, 2)` cap, and `<Canvas>` already tracks its own container, so the `setSize` call in `mount` and the `camera.aspect` / `renderer.setSize` lines in the `resize` listener both disappear. What the resize listener still has to do by hand is the mobile pull-back: past the `1000px` breakpoint it also moves the camera farther back along Z. That branch has no `<Canvas>` equivalent — keep a resize listener (or a media-query hook) that writes the target distance into a ref, and apply it to `camera.position.z` inside the same `useFrame` that eases the vertical position.

`cameraPositionUniform` is a **single shared object** passed by reference into all 75 tiles' `uCameraPosition` uniform — the whole depth-dimming shader works only because updating that one `Vector3` in place, once per frame, is visible to every tile's material in the same write. Recreate that sharing on purpose: hold `const sharedUniform = useMemo(() => ({ value: new THREE.Vector3(0, 0, cameraZ) }), [])` once at the gallery's top level, and pass the same object into every tile's `<shaderMaterial uniforms={{ uMap: { value: texture }, uCameraPosition: sharedUniform }} side={THREE.DoubleSide} />`. The one line that must run every frame is `sharedUniform.value.copy(camera.position)`, inside one `useFrame` — not inside a per-tile hook, and not something `useMemo` should ever recompute, since memoizing the uniforms object away would stop this copy from reaching materials built on an earlier render.

`animate()` becomes that same `useFrame` callback. Its mutable state — `scrollY` and `spinVelocity` from the Lenis scroll handler, `mouseX`/`mouseY`/`smoothX`/`smoothY` from `mousemove` — belongs in refs, not component state: every one of them changes on a scroll or pointer event and is read back on every animation frame, and routing any of them through `setState` would re-render the tree at that rate for numbers nothing in JSX reads back. Give the `<group>` wrapping the 75 tiles its own ref and mutate its rotation directly inside `useFrame`: advance `rotation.y` by the constant drift plus the current spin velocity, decay that velocity by the same factor afterward, and — behind the same desktop-only check — ease the smoothed pointer readings toward the latest raw ones before deriving `rotation.x` and `rotation.z` from them exactly as written above. The camera's own vertical ease is the same arithmetic, moved into this callback and applied to `camera.position.y` via the `camera` object `useThree()` hands you.

The per-tile curved geometry has no drei equivalent — it's a hand-built two-row strip sheared so consecutive tiles' edges meet into a continuous ramp — and unlike a gallery where one shape serves every tile, here **radius, arc width, tile height, center Y and slope are all different for every one of the 75 tiles**, because they taper continuously from the start radius to the end radius across the whole descent. Compute each tile's `BufferGeometry` in a `useMemo` keyed on that tile's own index (and on the segment count and height ratio, if those become props) — building 75 vertex arrays inline on every render would rebuild the entire spiral's shape for state changes that have nothing to do with it. `TextureLoader.load(...)` maps to drei's `useTexture(url)`; keep applying the same `minFilter`/`anisotropy` settings once each texture resolves, and keep the `i % totalImages` cycling so the same ten photos repeat around all 75 tiles exactly as they do today.

**A static poster is mandatory, not a nicety.** Building 75 custom curved geometries and waiting on ten separate texture loads both take real time, and until the last of the ten resolves, tiles render with whatever `uMap` defaults to — an untextured spiral flickering into shape tile by tile reads worse than the plain page underneath it. Cover `.hero` with a poster image sized like the finished spiral and swap it out once the renderer has produced its first real frame, not the instant the effect mounts.

**Do not reach for drei's `Environment`.** This scene has no lights and no `envMap` anywhere in it — the entire depth-dimming effect is the fragment shader comparing each tile's world-space normal against the vector toward `uCameraPosition`, computed purely from geometry and camera position. An `Environment` preset would light nothing this material samples, while still making the page depend on drei's third-party CDN for an HDRI it never needed.
