---
slug: spencergabor-magnetic-cards
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Magnetic Cards — Cursor-Reactive Physics Fan
## Goal
Build a single full-viewport dark section holding a **fanned stack of four square image cards centered on screen**. The star effect: the cards react **magnetically to cursor velocity**. When the mouse moves quickly near the stack, the cards nearest the pointer are shoved and tilted in the direction of the swipe; slower/farther motion barely nudges them. Neighboring cards get dragged along a little, and when the cursor stops or leaves, every card springs back to its resting fan layout with an elastic, slightly-bouncy settle. There is **no GSAP tween or timeline** — the whole thing is a hand-rolled spring-and-friction physics integrator run every frame by `gsap.ticker`, with `gsap.set` writing the transforms.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
