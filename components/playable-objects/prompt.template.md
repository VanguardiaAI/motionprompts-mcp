---
slug: playable-objects
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Playable Objects — Physics Pill Footer
## Goal
Build a two-screen page whose second screen is a **dark footer where 12 white "pill" tags rain down from above the viewport and pile up under real 2D physics (Matter.js)**. A GSAP ScrollTrigger with `once: true` boots the physics engine the first time the footer scrolls into view; every pill is a Matter.js rigid body synced to a DOM element via a `requestAnimationFrame` loop, and a Matter `MouseConstraint` lets the user **grab, drag and fling the pills** in real time. Smooth scrolling via Lenis. The centered footer headline reads "Because why list when you can play?".
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
