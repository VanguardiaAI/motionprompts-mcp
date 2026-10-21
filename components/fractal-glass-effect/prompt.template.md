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
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
