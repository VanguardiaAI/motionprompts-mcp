---
slug: phantom-gallery-javascript
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Phantom Draggable Infinite Gallery
## Goal
Build a full-viewport, black **WebGL infinite gallery**: a single Three.js full-screen quad whose **fragment shader procedurally tiles an endless grid of captioned image cells** (image + title/year label per cell), viewed through a subtle **barrel-distortion lens** with a radial fade to black at the edges. Dragging with mouse or touch **pans the grid in any direction forever** (the offset is lerped every frame for inertial glide) and the view **momentarily pulls back (zoom factor 1.0 → 1.25)** while dragging, easing back to 1.0 on release. A quick tap (no movement, < 200 ms) resolves which cell was hit through the inverse lens math and navigates to that project's link. There is no DOM per cell — the entire grid, borders, images and text live in one shader.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
