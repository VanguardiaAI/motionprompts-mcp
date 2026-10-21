---
slug: gentlerain
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Water Ripple Text Simulation — build prompt
## Goal
Build a full-screen hero for a fictional product studio called **"Soft Horizon"**. The whole viewport is a WebGL water surface: a giant canvas-drawn wordmark (**"softhorizon"**) sits under a real-time **wave simulation**, and as the pointer moves across the screen the cursor injects pressure into the fluid, leaving **rippling wakes that refract the text and throw off bright specular glints**, like poking the surface of a still pool. Nav and footer text float above the water. The star effect is the physics itself: a double-buffered (ping-pong) GPU wave-equation solver whose gradient field distorts and lights the text every frame. **No GSAP, no scroll** — everything is driven by `mousemove` on the canvas plus a `requestAnimationFrame` loop.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
