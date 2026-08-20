# Phantom Draggable Infinite Gallery

## Goal
Build a full-viewport, black **WebGL infinite gallery**: a single Three.js full-screen quad whose **fragment shader procedurally tiles an endless grid of captioned image cells** (image + title/year label per cell), viewed through a subtle **barrel-distortion lens** with a radial fade to black at the edges. Dragging with mouse or touch **pans the grid in any direction forever** (the offset is lerped every frame for inertial glide) and the view **momentarily pulls back (zoom factor 1.0 → 1.25)** while dragging, easing back to 1.0 on release. A quick tap (no movement, < 200 ms) resolves which cell was hit through the inverse lens math and navigates to that project's link. There is no DOM per cell — the entire grid, borders, images and text live in one shader.

## Tech
Vanilla HTML/CSS/JS with ES module imports. Use **`three` (npm) only — no GSAP, no plugins, no Lenis**:
```js
import * as THREE from "three";
```
All motion is a manual `requestAnimationFrame` loop with linear interpolation (`lerpFactor = 0.075`). Keep the data in a separate `data.js` (array of `{ title, image, year, href }`) and the GLSL in `shaders.js` (exported `vertexShader` / `fragmentShader` template strings).

## Layout / HTML
The page is nearly empty — everything renders into a canvas appended by JS:
```html
<body>
  <section id="gallery">
    <div class="vignette-overlay"></div>
  </section>
  <script type="module" src="./script.js"></script>
</body>
```
JS appends the `renderer.domElement` canvas into `#gallery`.

## Styling
- Google Font **IBM Plex Mono** (weights 400, 500) — it is the page font AND the font drawn into the canvas text labels.
- `html, body { width:100%; height:100%; font-family:"IBM Plex Mono", monospace; background:#000; cursor:grab; user-select:none; overflow:hidden; }`
- `body.dragging { cursor:grabbing; }` (class toggled on drag start/end).
- `#gallery { position:relative; width:100vw; height:100svh; }`
- `.vignette-overlay`: `position:absolute; inset:0 (top/left 0, width/height 100%); pointer-events:none;` with
  `background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.75) 90%, rgba(0,0,0,1) 100%);`
  — a CSS vignette layered over the canvas that, together with the shader's own radial fade, sinks the grid edges into black.
- Global reset `* { margin:0; padding:0; box-sizing:border-box; }`.

## Config (use these exact values)
```js
const config = {
  cellSize: 0.75,                            // world units per grid cell
  zoomLevel: 1.25,                           // zoom factor while dragging (pull-back)
  lerpFactor: 0.075,                         // inertia for offset + zoom
  borderColor: "rgba(255, 255, 255, 0.15)",  // grid lines
  backgroundColor: "rgba(0, 0, 0, 1)",       // clear color / cell background
  textColor: "rgba(128, 128, 128, 1)",       // canvas label grey
  hoverColor: "rgba(255, 255, 255, 0)",      // hover tint (alpha 0 = effectively off)
};
```
A small helper parses these `rgba()` strings into `[r,g,b,a]` arrays with rgb normalized /255, to feed `THREE.Vector4` uniforms and the clear color.

## Scene setup
- `THREE.Scene`, `THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)` at `z = 1`.
- `THREE.WebGLRenderer({ antialias: true, alpha: false })`, sized to `#gallery`'s offsetWidth/offsetHeight, `setPixelRatio(window.devicePixelRatio)`, clear color = background (black, alpha 1).
- One `THREE.PlaneGeometry(2, 2)` mesh with a `THREE.ShaderMaterial` — a full-screen quad; the camera never moves.

## Text label textures (canvas-drawn, one per project)
For each project draw a **2048×256 canvas**: `ctx.font = "80px IBM Plex Mono"`, `fillStyle` = the grey textColor, `textBaseline = "middle"`, `imageSmoothingEnabled = false`. Draw `title.toUpperCase()` left-aligned at `(30, 128)` and the year right-aligned at `(2048 − 30, 128)`. Wrap in a `THREE.CanvasTexture` with `ClampToEdgeWrapping` (both axes), `NearestFilter` (min+mag), `flipY: false`, `generateMipmaps: false`, `format: THREE.RGBAFormat`. (Tip for fidelity: make sure the font is loaded — e.g. `document.fonts.load('80px "IBM Plex Mono"')` — before drawing, or labels fall back to a default font.)

## Texture atlases (image + text)
Load the 25 project images with `THREE.TextureLoader` (`ClampToEdgeWrapping`, `LinearFilter`; resolve a Promise when all have loaded). Then bake **two atlases**, each a square canvas of `atlasSize × atlasSize` tiles where `atlasSize = Math.ceil(Math.sqrt(count))` (25 → 5×5) and every tile is **512×512**:
- **Image atlas**: canvas pre-filled black, each loaded image drawn stretched into its 512×512 tile (row-major: `x = (i % atlasSize) * 512`, `y = floor(i / atlasSize) * 512`).
- **Text atlas**: canvas left transparent (`clearRect`), each 2048×256 label canvas drawn squashed into its 512×512 tile.

Both atlases become `THREE.CanvasTexture` with `ClampToEdgeWrapping`, `LinearFilter`, `flipY: false`.

## Shader (the core effect — reproduce exactly)

### Vertex shader
Pass-through: forward `uv` as `vUv`, standard `projectionMatrix * modelViewMatrix * position`.

### Fragment shader uniforms
```
uOffset (vec2)  uResolution (vec2)  uBorderColor (vec4)  uHoverColor (vec4)
uBackgroundColor (vec4)  uMousePos (vec2, canvas px, -1,-1 = off)
uZoom (float, start 1.0)  uCellSize (float, 0.75)  uTextureCount (float, 25)
uImageAtlas (sampler2D)  uTextAtlas (sampler2D)
```

### Fragment shader logic, step by step
1. **Screen space**: `screenUV = (vUv - 0.5) * 2.0` → [−1, 1].
2. **Barrel lens**: `radius = length(screenUV); distortion = 1.0 - 0.08 * radius * radius; distortedUV = screenUV * distortion;` — coordinates contract toward the center as radius grows, bulging the grid at the periphery.
3. **World space**: `worldCoord = distortedUV * vec2(uResolution.x / uResolution.y, 1.0)` (aspect correction), then `worldCoord *= uZoom; worldCoord += uOffset;`.
4. **Grid**: `cellPos = worldCoord / uCellSize; cellId = floor(cellPos); cellUV = fract(cellPos);`.
5. **Hovered cell**: run the mouse position through the *same* inverse transform (NDC → distortion → aspect → zoom → offset → cellId): convert `uMousePos` to NDC with `(uMousePos / uResolution) * 2.0 - 1.0` and **negate y**. Compute `cellDistance = length(cellCenter - mouseCellCenter)` between cell centers and `hoverIntensity = 1.0 - smoothstep(0.4, 0.7, cellDistance)`; if hovered and `uMousePos.x >= 0.0`, mix the cell background toward `uHoverColor.rgb` by `hoverIntensity * uHoverColor.a`. (With the config's alpha 0 this is visually disabled — keep the plumbing.)
6. **Grid lines**: `lineWidth = 0.005` in cellUV space; `gridMask = smoothstep(0.0, lineWidth, cellUV.x) * smoothstep(0.0, lineWidth, 1.0 - cellUV.x)` × same for y. Later: `color = mix(color, uBorderColor.rgb, (1.0 - gridMask) * uBorderColor.a);` → hairline white 15% grid.
7. **Image window**: `imageSize = 0.6`, centered → `imageBorder = 0.2`; `imageUV = (cellUV - 0.2) / 0.6`. Soft edge: `edgeSmooth = 0.01`, alpha = product of `smoothstep(-edgeSmooth, edgeSmooth, imageUV)` and `smoothstep(-edgeSmooth, edgeSmooth, 1.0 - imageUV)` (x·y). Inside the window:
   - `texIndex = mod(cellId.x + cellId.y * 3.0, uTextureCount)` — this **`+ y*3` diagonal stride** is what scatters the 25 images across the infinite plane without obvious repetition.
   - Atlas lookup: `atlasSize = ceil(sqrt(uTextureCount)); atlasPos = vec2(mod(texIndex, atlasSize), floor(texIndex / atlasSize)); atlasUV = (atlasPos + imageUV) / atlasSize;` and **flip `atlasUV.y = 1.0 - atlasUV.y` for the image atlas only**. Mix sampled rgb over the background by the soft-edge alpha.
8. **Caption band**: occupies `cellUV.x ∈ [0.05, 0.95]`, `cellUV.y ∈ [0.88, 0.96]` (`textY = 0.88`, `textHeight = 0.08`) — a thin strip below the image. Remap to `textCoord` (x normalized over 0.9, y over 0.08, then `textCoord.y = 1.0 - textCoord.y`), same atlas-position math (no extra y flip), sample the **text atlas** and composite by its alpha over the cell background.
9. **Radial fade**: `fade = 1.0 - smoothstep(1.2, 1.8, radius); gl_FragColor = vec4(color * fade, 1.0);` — the shader itself darkens toward the screen corners underneath the CSS vignette.

## Interaction + animation loop (exact values)

State: `offset` and `targetOffset` `{x, y}` (start 0,0), `zoomLevel`/`targetZoom` (start 1.0), `mousePosition` (start −1,−1), flags `isDragging`, `isClick`, `clickStartTime`, `previousMouse`.

- **Drag start** (`mousedown` on document / `touchstart` with `preventDefault`): set `isDragging = true`, `isClick = true`, `clickStartTime = Date.now()`, add `.dragging` to body, record pointer. Then `setTimeout(150ms)` → if *still* dragging, set `targetZoom = 1.25` (press-and-hold also triggers the pull-back).
- **Drag move** (`mousemove` / `touchmove` with `preventDefault`): if dragging, compute `deltaX/deltaY` from the previous pointer. If `|deltaX| > 2 || |deltaY| > 2`: mark `isClick = false` and, if `targetZoom` is still 1.0, set it to 1.25 immediately. Pan: `targetOffset.x -= deltaX * 0.003; targetOffset.y += deltaY * 0.003;` (y inverted — world y is up). Store the pointer.
- **Release** (`mouseup`, `mouseleave` on document, `touchend`): `isDragging = false`, remove `.dragging`, `targetZoom = 1.0`. **Tap-to-navigate**: if `isClick` and elapsed `< 200 ms`, invert the full lens math in JS to find the cell under the pointer: NDC `screenX/screenY` (y negated), `distortion = 1.0 - 0.08 * r²`, `worldX = screenX * distortion * (rect.width / rect.height) * zoomLevel + offset.x` (same for y without aspect), `cellX/cellY = floor(world / cellSize)`, `texIndex = floor((cellX + cellY * 3.0) % count)` with negative wrap (`if < 0, add count`), then `window.location.href = projects[index].href`.
- **Hover uniform**: `mousemove` on the canvas writes the pointer position (canvas-relative px) into `uMousePos`; `mouseleave` resets it to `(-1, -1)`.
- **Resize**: update renderer size, pixel ratio and `uResolution` from `#gallery`'s dimensions.
- `contextmenu` is prevented; touch listeners registered with `{ passive: false }`.

**rAF loop** (every frame):
```js
offset.x += (targetOffset.x - offset.x) * 0.075;
offset.y += (targetOffset.y - offset.y) * 0.075;
zoomLevel += (targetZoom - zoomLevel) * 0.075;
// write uOffset + uZoom uniforms, then renderer.render(scene, camera)
```
The 0.075 lerp gives the drag a smooth, weighty glide — the grid keeps drifting briefly after release, and the zoom pull-back/return breathes in and out rather than snapping.

## Data
25 projects, each `{ title, image, year, href: "/sample-project" }`. Use these titles/years (they are painted on the cells):
Motion Study 2024, Idle Form 2023, Blur Signal 2024, Still Drift 2023, Tidewalk 2024, Core Motion 2022, White Bloom 2024, Backrun 2023, Rushline 2024, Afterimage 2023, Shadowhead 2022, Opal Lace 2024, Glassprint 2024, Redshift 2023, White Noise 2023, Twin Field 2024, Petalloop 2023, Ghostwalk 2024, Heatwave 2023, Sky Drift 2024, Spindle 2022, Pacer 2023, Stride 2024, Cryo Pulse 2022, Velvet Blur 2024.

## Assets / images
**25 gallery images**, one per project. Each is displayed **stretched into a square 512×512 atlas tile** and shown in the square image window of a cell, so square or near-square sources look best (any aspect will be squashed to 1:1). They read as one cohesive **moody editorial / experimental motion-photography** set on black: motion-blurred runners and striding figures, dramatic low-key portraits (hats, sunglasses, windswept hair), ghostly high-key figures and busts, abstract motion-blur vortices and spinning-blade radial blurs, a blurred flower, a surfer in a hazy seascape — muted palettes (blacks, whites, greys, pale blues) punctuated by a few vivid orange-red and green backdrops. Interchangeable in role; sequence them img1…img25 to match the title order above.

## Behavior notes
- The gallery is **infinite in every direction** — the grid is procedural, so panning never runs out; the 25 textures repeat on the `x + 3y` stride.
- Works with **mouse and touch** (touch events preventDefault; page never scrolls — `overflow: hidden`).
- The hover tint is wired but transparent (`hoverColor` alpha 0); changing that alpha lights up the hovered cell's background.
- Heavy on GPU (full-screen fragment shader at device pixel ratio) but mobile-safe; no reduced-motion handling in the original — all motion is user-driven.
- Nothing animates on load: the grid renders at offset (0,0), zoom 1.0, and waits for input.

## Images

This component ships with 25 reference assets, served publicly.
Use them as-is to reproduce the demo faithfully, then swap in your own — the layout expects the
same aspect ratios.

```
https://motionprompts.dev/c/phantom-gallery-javascript/img1.jpeg
https://motionprompts.dev/c/phantom-gallery-javascript/img10.jpeg
https://motionprompts.dev/c/phantom-gallery-javascript/img11.jpeg
https://motionprompts.dev/c/phantom-gallery-javascript/img12.jpeg
https://motionprompts.dev/c/phantom-gallery-javascript/img13.jpeg
https://motionprompts.dev/c/phantom-gallery-javascript/img14.jpeg
… 19 more under https://motionprompts.dev/c/phantom-gallery-javascript/
```

They are hotlinkable for prototyping. For anything you ship, replace them: they are licensed for
demonstration of this component, not for redistribution.

## Using this outside its demo page

This component is written as a complete page — that is how the demo is meant to look. If you are dropping it into an existing project, or combining it with other components, these are the things it declares at document level and that you need to move or reconcile first.

- **Palette on `:root`** — `--ink`, `--ink-muted`, `--ink-faint`, `--signal`, `--bg`. These names are not namespaced and they collide: `--ink` is defined by 164 of the 219 components in this catalogue, `--paper` by 94, `--muted` by 80, each with different values — and they will also collide with whatever your own project defines. Move them onto the component's wrapper (`.my-section { --ink: … }`) or rename them with a prefix.
- **Rules on `*`, `html, body`** — the demo owns the whole document, so these set the page background, typography and resets. Dropped into an existing project they restyle the entire page, not just this section. Re-target them at the component's wrapper before using it.

## Adapting this to React

Everything above describes a `mount(config)` / `destroy()` pair that is already most of the way to a `useEffect`: `mount` builds the scene, the orthographic camera, the renderer, the single full-screen quad and its two baked texture atlases, wires eleven event listeners across `document`, `window` and the renderer's own canvas, and starts the `animate()` loop that interpolates the pan offset and the zoom pull-back into the quad's uniforms every frame; the function it returns cancels that frame, removes every listener, disposes the plane's geometry and both atlas textures, disposes the material, force-loses the WebGL context and removes the canvas. What the file adds on top, and what has nothing to do with React, is the two-way dispatch at the bottom that decides *when* to call `mount` in the first place.

Under React 19 with StrictMode, every effect mounts, unmounts, and mounts again before anything reaches the screen. Call `mount()` without returning its own `destroy` as the effect's cleanup, and the second mount finds the first renderer's canvas still appended to `#gallery`, the first `animate()` loop still running, and a second full set of `mousedown`/`mousemove`/`touchmove` listeners racing the first on the same document — two grids drifting at once behind each other, both interpolating toward independent offsets from the same drag. It will not reproduce in a production build, because only development does the double mount.

*(1) The entry point* — the file's own guard is `dcl-guarded`: `if (window.MP && window.MP.register) { … } else { const boot = () => mount(Object.assign({}, DEFAULTS)); if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot(); }`. Delete the whole dispatch, `window.MP` branch included — that hook belongs to this catalogue's own visual editor, not to a React host — and call `mount` directly from a `useEffect` with an empty dependency array, keeping its return value as the effect's cleanup:

```jsx
useEffect(() => {
  return mount({ ...DEFAULTS, ...props });
}, []);
```

Note the spread order: `mount` never falls back to `DEFAULTS` internally — every field it reads (`config.cellSize`, `config.zoomLevel`, `config.textColor`, and the rest) is read straight off the object it was called with — so the merge the vanilla `boot()` does inline has to happen at the call site in the React version too, not inside `mount`. Hand it a partial `props` object with no merge and a missing field renders `undefined` into a shader uniform instead of falling back to anything.

*(2) Element lookups* — `mount` queries `document.getElementById("gallery")` twice, once in `init()` and again in `onWindowResize`, and appends the renderer's canvas into whatever that lookup returns. Give the component a root `ref`, render the equivalent of `#gallery` as that ref's element, and resolve the container from the ref instead of the document — during a StrictMode remount two elements can carry that id for an instant, and an unscoped `getElementById` will happily bind the second mount's renderer to whichever one it finds first. The eleven listeners split into two groups, and the split matters: nine of them (`mousedown`, `mousemove`, `mouseup`, `mouseleave`, the three touch equivalents, `resize`, `contextmenu` — the exact set the file's own comment counts and `removeEventListeners()` reverses) are deliberately bound to `document`/`window` rather than to the canvas, because the drag has to keep tracking the pointer even after a fast flick carries it past the edge of `#gallery`, where a listener scoped to the canvas element would stop receiving events. Keep that scoping exactly as it is. Only the remaining pair — `updateMousePosition` and the canvas-side `mouseleave` that feed `uMousePos` — is bound to `renderer.domElement` specifically, because hover is meant to turn off the moment the pointer actually leaves the grid, and `destroy()` removes that pair separately, alongside the renderer's own disposal. One more document-level side effect rides along with the drag: `document.body.classList.add("dragging")` / `.remove("dragging")` toggles a class the stylesheet uses for the grab/grabbing cursor. That is a page-level style hook, not scoped to this component's subtree — harmless for a component that owns the whole page, worth moving onto the root ref's own class list if this gallery ever has to share the page with something else that sets cursor styles on `body`.

*(3) Cleanup* — `init()` is itself asynchronous: it awaits `document.fonts.load(...)`, then awaits the `Promise` `loadTextures()` returns once every one of the twenty-five `TextureLoader.load()` calls has fired its callback. `mount` is already written the right way around that: `mount` itself stays synchronous, fires `init()` without awaiting it, and returns the synchronous cleanup immediately. Preserve that shape verbatim in the effect — do not make the effect callback itself `async` or await inside it, or the effect returns a promise instead of a teardown function and React has nothing to call on unmount. The `destroyed` flag `init()` checks right after its two `await`s is exactly the cancellation guard this needs: if the effect has already cleaned up by the time fonts and all twenty-five textures resolve, `init()` disposes the atlases, the geometry, the material and the renderer it just finished building instead of appending a second canvas and starting a second `animate()` loop into a component that no longer exists. Keep the flag, and keep both atlas textures (`uImageAtlas`, `uTextAtlas`) in the disposal list alongside the geometry and material in the returned cleanup — they are canvas-baked `CanvasTexture` instances the plane's uniforms hold onto, not textures three tracks for you automatically.

*(4) Mapping to `@react-three/fiber`* — three 0.185, `@react-three/fiber` 9, drei 10.7, React 19.

The scene here has no perspective camera and nothing orbiting — it is one `PlaneGeometry(2, 2)` filling the frustum of an `OrthographicCamera(-1, 1, 1, -1, 0.1, 10)` sitting at `z = 1`, i.e. a full-screen shader pass. `<Canvas orthographic camera={{ position: [0, 0, 1], left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10 }} gl={{ antialias: true, alpha: false }}>` reproduces that frustum exactly and replaces the manual `WebGLRenderer`/`Scene`/`OrthographicCamera` construction outright. The quad becomes `<mesh><planeGeometry args={[2, 2]} /><shaderMaterial ref={materialRef} args={[{ uniforms, vertexShader, fragmentShader }]} /></mesh>` — the vertex/fragment source is untouched, only how the material attaches to the scene graph changes.

`animate()` becomes the callback passed to `useFrame`. Everything it currently mutates — `offset`, `targetOffset`, `zoomLevel`, `targetZoom` — has to live in refs, not `useState`: this loop reassigns all four every frame, and routing any of them through `setState` would re-render the component tree at that same rate for numbers nothing in JSX ever reads. Inside `useFrame`, run the same interpolation this loop already does and write the results straight into `materialRef.current.uniforms.uOffset.value` and `.uZoom.value`, dropping the trailing `renderer.render(scene, camera)` call — `<Canvas>` renders the frame once `useFrame` returns.

The atlas bake does not collapse into drei's `useTexture`: this component does not just load twenty-five images, it draws each into a shared square canvas at a computed tile position, and separately rasterizes each project's title/year pair through the canvas text API into a second atlas — that compositing step is inherently imperative and has no declarative equivalent. Keep `loadTextures`, `createTextTexture` and `createTextureAtlas` as plain async helpers invoked from the effect after the `document.fonts.load` wait (the captions are baked into a texture, so a font swapping in after the bake would need a full re-bake, not just a reflow, which is exactly why the original waits for it first), guarded by the same cancellation flag as `(3)`, and assign the two resulting `CanvasTexture`s to the `shaderMaterial`'s uniforms once both atlases are ready.

Drag panning and the zoom pull-back stay outside R3F's synthetic pointer system for the same reason noted in `(2)`: they are bound to `document`/`window` so a flick that leaves the canvas keeps updating the pan, and R3F's `onPointerDown`/`onPointerMove` mesh props only fire while the pointer is over the mesh itself. Keep them as a plain `addEventListener` block in a `useEffect` that writes into the same offset/zoom refs `useFrame` reads, run alongside the `<Canvas>` rather than through it. Only the hover pair — `uMousePos`, scoped to `renderer.domElement` — has an R3F-native equivalent: `useThree(({ gl }) => gl.domElement)` gives you that same canvas, or the mesh's own `onPointerMove`/`onPointerOut` props give you the position directly without a manual `getBoundingClientRect`. Resize disappears the way it does for every slug in this family: `<Canvas>` already observes its container, so `onWindowResize`'s manual `setSize`/`setPixelRatio` calls go away, and `uResolution` can be kept in step from `useThree(({ size }) => size)` instead of a `resize` listener. The tap-to-navigate math in `onPointerUp` is untouched by any of this — it reads the *current* `offset`/`zoomLevel`, and once those are refs it reads `.current` instead of a closed-over variable; nothing else about the inverse lens math changes.

**A static poster is mandatory here, specifically because the first correct frame is gated on three async steps landing together**: the font load, all twenty-five image decodes, and the two atlas bakes that depend on both. Until then the clear color is opaque black with nothing drawn into it, so a cold visit sees a blank black rectangle, not a partially-formed grid, for as long as those three take. Render a static crop of the grid — a handful of cells with their images and captions, pre-rendered as a plain image — filling the same box, and swap it out only once the plane has actually rendered its first frame, not the instant the component mounts.

**Do not reach for drei's `Environment`, preset or otherwise.** The `ShaderMaterial` here is fully custom and unlit — every pixel it produces comes from sampling the two atlases and mixing in the border/hover/vignette math, never from a light — so there is nothing in this scene for an environment map to feed, and a `preset` would only add a dependency on a third-party CDN this component has no other reason to need.
