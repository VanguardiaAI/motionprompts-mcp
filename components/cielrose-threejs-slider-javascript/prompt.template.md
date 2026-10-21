---
slug: cielrose-threejs-slider-javascript
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Three.js Wheel-Driven Shader Slider
## Goal
Build a full-viewport **WebGL image slider driven by the mouse wheel**. A single 16:9 plane floats in the center of the screen over a soft grey-to-white gradient page. Scrolling wheels through an endless loop of 7 images: a custom fragment shader performs a **vertical filmstrip wipe** (the next image slides up from the bottom edge while the current one slides out the top), a vertex shader **bulges the plane toward the camera** proportionally to scroll velocity, and the whole plane **swells/shrinks slightly** with scroll intensity. When scrolling stops, a lerp **snaps to the nearest whole image** and the project title (clipped inside a 16px-tall mask) **slides back up into view** with the new slide's name. Everything is hand-rolled in a `requestAnimationFrame` loop plus one CSS transition — **no GSAP, no ScrollTrigger, no page scroll**.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
