---
slug: asset-orb-js
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Asset Orb — Draggable WebGL Image Sphere
## Goal
Build a full-viewport, pitch-black WebGL scene containing a single **"orb" made of 100 small photo planes** arranged on the surface of a sphere via a **Fibonacci-sphere (golden-spiral) distribution**, every plane textured with one of 30 editorial photographs picked at random. The user **drags to spin the orb** (with damped inertia, so it keeps gliding after release) and **scrolls/pinches to zoom** between a near and far limit. A fixed HTML nav ("ORB") and footer ("[ ARCHIVE BEYOND REALITY ]") float over the canvas. This is a pure Three.js piece — **no GSAP at all**; all motion comes from OrbitControls damping inside a `requestAnimationFrame` loop.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
