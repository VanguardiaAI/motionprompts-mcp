# 3D Circular Image Gallery

## Goal
Build a full-viewport **WebGL image gallery** where ~100 curved image tiles are wrapped around the surface of a tall vertical cylinder that **spins slowly and continuously** on its Y axis. Smooth-scrolling drives the camera **vertically** up and down through the stack, and each burst of scroll velocity briefly **accelerates the cylinder's spin** for an inertial, momentum-based feel. The star effect is the endlessly rotating 3D drum of photos that you travel through as you scroll.

## Tech
Vanilla HTML/CSS/JS with ES module imports, bundled by Vite. No framework.
- `three` (npm) — the entire scene is Three.js WebGL. **No GSAP is used.**
- `lenis` (npm) — smooth scroll, whose scroll position and velocity drive the camera and spin.

Import them as:
```js
import * as THREE from "three";
import Lenis from "lenis";
```

## Layout / HTML
Minimal DOM — the gallery is a `<canvas>` that Three.js appends to `<body>`. Only two fixed overlay blocks of monospace text sit on top:

```html
<div class="nav">
  <div class="nav-col">
    <p>Silhouette</p>
    <p>Microfolio <br />2017 - Ongoing</p>
  </div>
  <div class="nav-col"><p>Info</p></div>
</div>

<div class="footer">
  <p>Experiment CG407</p>
  <p>By Silhouette</p>
</div>
```
(Text is a neutral fictional studio label — swap freely; it is decorative only.)

The `<canvas>` is created by the renderer and appended to `body` from JS — do not hardcode it in HTML.

## Styling
- **Body is 500vh tall** (`html, body { width: 100%; height: 500vh; }`) so there is scroll distance to move the camera. The page is **light**: `background-color: var(--paper)` (`#f5f2ec`) under two fixed radial gradients — a bone lift at 38% height and a powder-blue wash rising from the bottom (`background-attachment: fixed`, so the ground stays put while the gallery flies past).
- Palette:
  ```css
  :root {
    --paper: #f5f2ec;  --paper-high: #fdfbf6;
    --navy: #1c2a4a;   --navy-soft: #48587a;
    --accent: #f26430; --accent-soft: #ffb38a;
    --dust: #a9c1d9;
    --scrim: 245, 242, 236;  /* rgb of --paper, for veils */
  }
  ```
- `canvas { position: fixed; top: 0; left: 0; }` — pinned full-screen behind everything.
- `img { width:100%; height:100%; object-fit:cover; }` (defensive default; images are used as WebGL textures, not `<img>` tags).
- Overlay text `p`: `text-transform: uppercase; font-family: "Space Mono", monospace; font-size: var(--meta-size, 11px); line-height: 1.125; color: var(--navy);` — **Inter** for body copy and **Space Grotesk** for the display line.
- `.nav` — `position: fixed; top:0; left:0; width:100vw; padding:1.5em; display:flex; z-index:2; mix-blend-mode: difference;`
- `.footer` — same but `bottom:0`, `justify-content: space-between`.
- `.nav-col { flex:1; }`; first nav-col is `display:flex` with its `p` children each `flex:1`; second nav-col is `text-align:right`.
- **`mix-blend-mode: difference`** on nav and footer is important — the white labels invert against whatever image passes behind them.
- Include Lenis's recommended CSS (`.lenis.lenis-smooth { scroll-behavior: auto !important; }`, `.lenis.lenis-stopped { overflow: clip; }`, etc.).

## The 3D effect (be exact)

### Renderer, scene, camera
- `THREE.Scene`.
- `THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000)`.
- `THREE.WebGLRenderer({ antialias: true, alpha: true })`; `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`; `renderer.setSize(innerWidth, innerHeight)`; `renderer.setClearColor(0x000000, 0)` (transparent so the bone body shows through). Append `renderer.domElement` to `body`.
- One light only: `THREE.AmbientLight(0xffffff, 1)` added to the scene.
- Camera initial position: `camera.position.z = 12`, `camera.position.y = 0` (looking down −Z at the origin by default).

### Group + invisible reference cylinder
- Create `const galleryGroup = new THREE.Group()` and add it to the scene. **All tiles and the reference cylinder are children of this group; the whole group is what rotates.**
- Global constants: `radius = 6`, `height = 30`, `segments = 30`.
- Add an **invisible** guide cylinder to the group: `THREE.CylinderGeometry(radius, radius, height, segments, 1, true)` (open-ended) with `MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide })`. It renders nothing — it just documents the drum's dimensions; keep it for fidelity.

### Curved image plane geometry (custom BufferGeometry)
Write `createCurvedPlane(width, height, radius, segments)` that returns a `THREE.BufferGeometry` — a rectangular mesh **bent horizontally to hug a cylinder of the given radius**:
- `segmentsX = segments * 4`, `segmentsY = Math.floor(height * 12)`, `theta = width / radius` (the angular arc the tile subtends).
- Build the vertex grid: for `y` in `0..segmentsY`, `yPos = (y/segmentsY - 0.5) * height` (vertically centered on 0). For `x` in `0..segmentsX`, `xAngle = (x/segmentsX - 0.5) * theta`, then `xPos = Math.sin(xAngle) * radius`, `zPos = Math.cos(xAngle) * radius`. Push `(xPos, yPos, zPos)` — this curves the tile outward on the +Z side of a radius-`radius` circle.
- **UVs with a 10% inset crop:** `u = (x/segmentsX) * 0.8 + 0.1`, `v = y/segmentsY`. (The `*0.8 + 0.1` samples only the middle 80% of the texture horizontally, trimming the left/right edges.)
- Indices: two triangles per quad — `a = x + (segmentsX+1)*y`, `b = x + (segmentsX+1)*(y+1)`, `c = x+1 + (segmentsX+1)*(y+1)`, `d = x+1 + (segmentsX+1)*y`; push `(a,b,d)` and `(b,c,d)`.
- Set `position` (Float32, itemSize 3) and `uv` (Float32, itemSize 2) attributes, `setIndex(indices)`, then `computeVertexNormals()`.

### Texture loading
- `const textureLoader = new THREE.TextureLoader()`.
- `getRandomImageNumber()` → `Math.floor(Math.random() * 50) + 1` (integer 1–50).
- `loadImageTexture(n)` returns a Promise that loads `/c/ashfall-3d-image-gallery/img${n}.jpg`; in the onLoad callback set `generateMipmaps = true`, `minFilter = THREE.LinearMipmapLinearFilter`, `magFilter = THREE.LinearFilter`, `anisotropy = renderer.capabilities.getMaxAnisotropy()`, then resolve with the texture.

### Placing the tiles on the drum
Layout constants: `numVerticalSections = 20`, `blocksPerSection = 5`, `verticalSpacing = 5`.
- `totalBlockHeight = numVerticalSections * verticalSpacing` (100); `heightBuffer = (height - totalBlockHeight) / 2` (= −35); `startY = -height/2 + heightBuffer + verticalSpacing` (= −45).
- `sectionAngle = (Math.PI * 2) / blocksPerSection` (72°); `maxRandomAngle = sectionAngle * 0.3` (±21.6° jitter).

`createBlock(baseY, yOffset, sectionIndex, blockIndex)` (async):
- `blockGeometry = createCurvedPlane(2.5, 1.75, radius, 10)` — each tile is **2.5 wide × 1.75 tall** wrapped on the radius-6 drum.
- Load a random texture; material = `MeshPhongMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false })`.
- `block = new THREE.Mesh(blockGeometry, blockMaterial)`; `block.position.y = baseY + yOffset`.
- Wrap it: `const blockContainer = new THREE.Group()`. `baseAngle = sectionAngle * blockIndex`; `randomAngleOffset = (Math.random()*2 - 1) * maxRandomAngle`; `blockContainer.rotation.y = baseAngle + randomAngleOffset`. Add the block to the container and return the container.

`initializeBlocks()` (async): loop `section` `0..numVerticalSections`, `baseY = startY + section * verticalSpacing`; inner loop `i` `0..blocksPerSection`, `yOffset = Math.random()*0.2 - 0.1`; `await createBlock(...)`, push to a `blocks[]` array, and add the container to `galleryGroup`. Call `initializeBlocks()` once at startup.

Net result: **20 stacked rings × 5 tiles = ~100 curved photo tiles** on a radius-6 cylinder, spanning roughly y = −45…+50, each tile evenly spaced 72° apart with random angular and tiny vertical jitter so the rings don't look mechanical. Each tile independently picks one of 50 source images, so duplicates naturally appear.

### Scroll → camera, velocity → spin (the animated part)
State: `currentScroll = 0`, `totalScroll = document.documentElement.scrollHeight - window.innerHeight`, `rotationSpeed = 0`, `baseRotationSpeed = 0.0025`, `maxRotationSpeed = 0.05`.

Init Lenis with `new Lenis({ autoRaf: true })`. On its scroll event:
```js
lenis.on("scroll", (e) => {
  currentScroll = window.pageYOffset;
  rotationSpeed = e.velocity * 0.005;   // fresh spin impulse from scroll speed
});
```

`requestAnimationFrame` render loop `animate()`:
- `scrollFraction = currentScroll / totalScroll` (0→1 top→bottom).
- `targetY = scrollFraction * height - height/2`; **`camera.position.y = -targetY`** — so at the top the camera sits at y ≈ +15, at the bottom y ≈ −15, i.e. scrolling **down** flies the camera **down** through the drum (about 30 units of vertical travel).
- **`galleryGroup.rotation.y += baseRotationSpeed + rotationSpeed`** — the constant `0.0025` gives the always-on slow spin; the scroll-derived `rotationSpeed` adds a temporary boost.
- Then `rotationSpeed *= 2;` each frame — the impulse is re-amplified frame to frame but gets overwritten by the next scroll event, so it flares while you scroll and collapses back to ~0 (the slow base spin) once the scroll velocity settles.
- `renderer.render(scene, camera)`; call `requestAnimationFrame(animate)` at the top of the function; kick it off once with `animate()`.

### Resize
`window.addEventListener("resize", ...)`: update `camera.aspect = innerWidth/innerHeight`, `camera.updateProjectionMatrix()`, `renderer.setSize(innerWidth, innerHeight)`, `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.

## Assets / images
- **50 source images** named `img1.jpg … img50.jpg`, served from `/c/ashfall-3d-image-gallery/`. They are randomly mapped onto the ~100 tiles.
- Visually: **still-life photography and quiet landscape**, one plate per frame — ceramics on stone, stacked stoneware, incense smoke, rippled dune sand, folded cloth, single objects on plain grounds. Restrained, cool-leaning neutrals so fifty frames flying past never turn into confetti; the page's own orange accent is the only saturated colour on screen.
- Roughly **square to slightly landscape** framing; the geometry crops ~10% off each horizontal edge via the UV inset, so keep subjects centered. Any set of centered abstract renders works.

## Behavior notes
- Desktop-first, **not mobile-safe** (heavy WebGL; scroll is hijacked by Lenis). No reduced-motion handling in the original — the base spin runs forever.
- The drum spins continuously even with no scroll input (`baseRotationSpeed`). Scrolling both moves the camera and briefly speeds the spin proportional to velocity.
- Everything is transparent-cleared over the bone body; the fixed monospace nav/footer use `mix-blend-mode: multiply` so they stay legible over passing images without punching a hole in them.

## Images

This component ships with 50 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/ashfall-3d-image-gallery/img1.jpg
https://motionprompts.dev/c/ashfall-3d-image-gallery/img10.jpg
https://motionprompts.dev/c/ashfall-3d-image-gallery/img11.jpg
https://motionprompts.dev/c/ashfall-3d-image-gallery/img12.jpg
https://motionprompts.dev/c/ashfall-3d-image-gallery/img13.jpg
https://motionprompts.dev/c/ashfall-3d-image-gallery/img14.jpg
… 44 more under https://motionprompts.dev/c/ashfall-3d-image-gallery/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--paper`, `--paper-high`, `--navy`, `--navy-soft`, `--accent`, `--accent-soft`, `--dust`, `--scrim`, plus the scale tokens `--meta-size`, `--space-1` … `--space-4`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`, `body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.
- **Smooth scroll (Lenis)** — this creates its own Lenis instance, and a page may only have one. If your project already runs Lenis, drop the setup shown above and reuse the existing instance, keeping the `lenis.on("scroll", ScrollTrigger.update)` wiring once. Two instances fight over the same scroll and stutter visibly, with no error in the console.
- **Full-screen overlay** — a fixed element covers the viewport (a loader or transition). Only one may exist per page and it must remove itself when done. If your page already has one, keep that and drop this; otherwise the second silently hides the first.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that is already most of the way to a `useEffect`: `mount` builds the Lenis instance, the invisible guide cylinder, the ~100 curved-plane tiles it loads asynchronously, the camera and renderer, and the `animate()` loop that drives both; the function it returns walks all of that back — canceling the frame, destroying Lenis, disposing every mesh's geometry/material/texture, force-losing the WebGL context, and removing the canvas it created. What's missing is the wiring: the file decides for itself when to call `mount`, through two branches — a `window.MP.register` hook for this catalogue's own editor, and a `document.readyState` guard for everyone else — and neither has anything to do with how React schedules effects.

Under React 19 with StrictMode, **every effect mounts, unmounts, and mounts again** before anything reaches the screen. Call `mount()` without returning its own `destroy` as the effect's cleanup, and the second mount finds the first Lenis instance, the first `animate()` frame loop and the first canvas still alive: two rAF loops racing to render into two canvases behind the same overlay text, two Lenis instances fighting over the same wheel event. It will not reproduce in a production build, because only development does the double mount.

*(1) The entry point* — delete the `if (window.MP && window.MP.register) { … } else { … }` dispatch at the bottom of the file; both halves belong to the standalone demo page and its editor, not to a React host. The `else` branch is the `document.readyState` guard: it exists so the script survives being parsed after `DOMContentLoaded` has already fired in a plain document, a race `useEffect` never hits because it only runs after the DOM is committed. `mount` already falls back to `DEFAULTS` internally, field by field, through its own `num()`/`count()` helpers — so the effect doesn't need to spread `DEFAULTS` itself, it can hand `mount` this component's own props directly:

```jsx
useEffect(() => {
  return mount(props);
}, []);
```

Do not `await` anything inside that effect body to sequence it after `initializeBlocks()` finishes — `mount` fires that off deliberately without waiting on it, and making the effect callback `async` (or awaiting inside it) turns the callback into something that returns a promise instead of `destroy`, which React has nothing to call on unmount.

*(2) Element lookups* — this script never queries the DOM by selector; its one DOM interaction is `document.body.appendChild(renderer.domElement)`. That's actually a point in its favor over slugs that re-query a class name: `destroy()` already removes the exact canvas this mount created, via the `renderer.domElement` reference closed over in scope, not a re-query that could bind to a sibling. What still needs fixing is scope: appending straight to `document.body` puts the canvas outside any component's own subtree, so it always lands as the last child of `body`, stacking on top of whatever else the app mounts later — a modal, a second instance of this same gallery. Give the component a viewport-sized root `ref` and append into `ref.current` instead of `document.body`, so the canvas's position in the DOM belongs to wherever this component is rendered.

*(3) Cleanup* — three independent resources; there is no GSAP or ScrollTrigger anywhere in this file, so the context-revert pattern doesn't apply here.

Lenis is constructed with `autoRaf: true`, so it drives its own internal frame loop — there is no `lenis.raf(time)` call in this file to cancel by hand. `lenis.destroy()` alone stops that internal loop; keep it and `lenis.off("scroll", onLenisScroll)` exactly as written. Don't conflate that with the separate `frame` loop `animate()` schedules: that one belongs to this component, drives the camera's vertical position and the drum's rotation, and needs its own `cancelAnimationFrame(frame)` in the cleanup regardless of what Lenis does internally.

The `destroyed` flag already does the job this template asks of asynchronous continuations, correctly: `createBlock` checks it the moment `await loadImageTexture(...)` resolves, and disposes the geometry (and the texture, if one arrived) instead of handing a mesh to a `galleryGroup` that a finished cleanup has already cleared. `initializeBlocks` checks the same flag again after every `await`, inside its section/block loops, so a StrictMode unmount landing mid-drum stops the remaining tiles from ever being queued. Keep both checks exactly where they sit — they're guarding ~100 loads that resolve one at a time (`initializeBlocks` awaits each `createBlock` in turn, which is why the drum visibly fills in ring by ring rather than all at once), not a single promise.

*(4) Mapping to `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

`<Canvas gl={{ alpha: true }} camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 12] }}>` replaces the `WebGLRenderer` / `Scene` / `PerspectiveCamera` block outright; leave the scene background unset so the page's dark background shows through the transparent canvas, the effect `setClearColor(0x000000, 0)` gets by hand today. `renderer.capabilities.getMaxAnisotropy()` becomes one `useThree(({ gl }) => gl.capabilities.getMaxAnisotropy())` call, read once and cached in a ref — not re-read as each of the ~100 textures resolves, for the same reason the vanilla version reads it once, live, right after the renderer is built.

`animate()` becomes a single `useFrame` callback: no `requestAnimationFrame` loop of your own belongs inside a `<Canvas>`, since it already runs one, and a second would double the render work against the same GPU context. The values `animate()` mutates every frame — `currentScroll`, `rotationSpeed`, and `camera.position.y` — belong in refs, not component state: they change on every Lenis scroll event and on every frame respectively, and routing either through `setState` would re-render the tree at frame rate for numbers nothing in JSX ever reads back. Move the camera-position ease and the rotation-speed decay into the `useFrame` callback as the same per-frame arithmetic already written above, mutating the group's rotation through a ref to the `<group>` instead of the module-level `THREE.Group`.

`createCurvedPlane` stays a plain function — there's no drei equivalent for a hand-built curved `BufferGeometry` — but it currently runs once per tile with identical arguments for all ~100 tiles on one drum (only `radius` varies between drums, never between tiles within one). Compute it once with `useMemo` keyed on `radius` and hand the same `BufferGeometry` to every tile's `<mesh geometry={...}>`, disposing that one shared instance in the effect's cleanup instead of walking a hundred meshes for it. `textureLoader.load(...)` maps to drei's `useTexture(path)` per tile — keep applying the same anisotropy and mipmap-filter settings to whatever it resolves with — and keep each tile's random image pick (`getRandomImageNumber()`) in a `useMemo` or state initializer scoped to that tile, not inline in its render body, or a re-render would swap the photo out from under an already-visible tile. Do not wrap all ~100 tiles in one `<Suspense>` boundary the way a fully-parallel load would justify (see this catalogue's `asset-orb-js` for that pattern): this drum's loads are sequential by design, and a single `Suspense` would instead fire all hundred `useTexture` calls in parallel and pop the whole drum in at once — a visibly different reveal. Preserve the trickle by mounting tile components progressively, in the same section/block order `initializeBlocks` already uses, instead of relying on Suspense's all-or-nothing commit.

Resize handling disappears with `<Canvas>`, which already tracks its own container: drop the manual `resize` listener, `updateProjectionMatrix`, and the `setSize`/`setPixelRatio` calls.

**A static poster is mandatory here, more than usually so.** Because the drum's tiles load one at a time rather than as one parallel batch, a cold visit can leave it visibly sparse for longer than a component that fires every load at once. Cover the full viewport with a poster matching the dark background and swap it out once enough of the drum has populated to read as a wall of images — not the instant the effect equivalent of `mount` returns.

**Do not reach for drei's `Environment`,** preset or otherwise: the only light in this scene is a single `AmbientLight`, which has no direction for an environment map to add anything to, and a `preset` fetches its HDRI from a third-party CDN hard-coded into drei that leaves the scene unlit the moment that host is unreachable. If a future variant wants directional shading on the tiles, add an explicit light instead.
