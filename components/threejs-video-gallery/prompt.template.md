---
slug: threejs-video-gallery
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Framecast — 3D Curved Video Wall (Three.js)
## Goal
Build a full-viewport, white WebGL scene: a **7×7 grid of 49 flat planes**, each textured with a **looping muted video**, bent into a **parabolic wall** that curves back toward the viewer on both the horizontal and vertical axes (a shallow satellite-dish / IMAX-screen shape). As the user **moves the mouse**, the whole wall reacts: every plane gets independent **parallax + gentle sinusoidal oscillation**, the **camera eases its `lookAt` target** around so the wall appears to turn, and a fixed CSS-3D headline ("FRAMECAST") **tilts in 3D** like a card catching the light. A small lime nav badge ("FRAMES 2024") floats top-center. This is a pure Three.js piece — **no GSAP at all**; all motion lives in a `requestAnimationFrame` loop driven by mouse position through eased/`lerp`-style interpolation.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
