---
slug: tunnel
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# 3D Tunnel Image Slider — WebGL Shader Tunnel + Scroll-Driven Z-Flight Carousel
## Goal
Build a full-screen experience where **ten framed portrait images fly toward the camera down the Z axis of a CSS-perspective tunnel**, over a **hypnotic monochrome neon-tunnel pattern rendered by a Three.js fragment shader** that fills the whole background. Smooth scrolling (Lenis) feeds a GSAP `ScrollTrigger` with `scrub: 1`: the same scroll progress (a) pushes every slide's `translateZ` from deep-space toward the viewer, fading each one in as it nears, and (b) drives a `scrollOffset` uniform that warps/advances the shader tunnel in sync. Result: as you scroll, images emerge one after another out of a spinning light-tunnel and rush past you, with the pattern accelerating in lock-step.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
