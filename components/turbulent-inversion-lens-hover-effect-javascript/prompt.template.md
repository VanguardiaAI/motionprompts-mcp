---
slug: turbulent-inversion-lens-hover-effect-javascript
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Turbulent Inversion Lens Hover Effect
## Goal
Build a full-viewport WebGL image viewer with a "turbulent inversion lens". A single photograph fills the screen, rendered on a Three.js fullscreen quad through a custom fragment shader. The star effect: as the cursor moves over the image, a **circular lens trails the mouse with a smooth lag**, and everything inside that circle is shown as **inverted grayscale** (a photographic-negative look). The lens edge is not a clean circle — it is **jittered by animated fractal turbulence (fBm noise)**, so the boundary constantly boils and crackles like static. The lens radius **grows open when the cursor enters** the container and **shrinks closed to nothing when it leaves** (or when the section scrolls out of view). No scroll effects, no clicks — just cursor-driven shading.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
