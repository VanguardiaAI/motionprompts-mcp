---
slug: threejs-slider-final
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Three.js Infinite Curved-Distortion Slider — Velocity-Reactive Vertex Warp
## Goal
Build a **full-viewport, infinitely looping horizontal image slider rendered entirely in Three.js**. Ten textured planes drift left/right in 3D space, driven by mouse wheel, touch drag, or arrow keys. The star effect: as the strip moves, the planes **bend toward the camera in a radial bulge centered on the middle of the screen** — a curved-screen distortion whose intensity is proportional to scroll velocity. Fast flicks warp the slides dramatically; when motion settles, the planes relax back to perfectly flat. The strip wraps seamlessly, so you can scroll forever in either direction. Everything is lerped every frame — position, per-slide easing, and the distortion factor itself — so the whole thing feels weighty and fluid, never snappy.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
