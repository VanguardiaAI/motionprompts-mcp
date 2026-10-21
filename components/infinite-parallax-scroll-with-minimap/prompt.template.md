---
slug: infinite-parallax-scroll-with-minimap
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Build: Infinite Parallax Scroll with Synchronized Minimap
## Goal
A full-screen, **infinitely looping vertical scroll** through editorial project images, with a **centered floating minimap** that mirrors the exact same scroll at miniature scale. The star effect: a hand-rolled `requestAnimationFrame` engine that lerps a virtual scroll position driven by wheel + touch, recycles a small window of DOM slides for endless looping, applies **per-image parallax**, and **magnetically snaps to the nearest project** after the user stops scrolling. The big slides and the tiny minimap move in perfect proportional lockstep.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
