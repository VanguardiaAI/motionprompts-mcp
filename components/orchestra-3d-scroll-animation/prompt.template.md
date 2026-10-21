---
slug: orchestra-3d-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Orchestra 3D Scroll Animation
## Goal
Build a pinned full-screen hero where six image-mapped CSS 3D cubes fly in from extremely deep 3D space (`translateZ(-30000px)`) and assemble into a symmetric spread as the user scrolls, while a geometric block logo blurs away, a large intro headline scales up and fades out, and a second headline de-blurs into view. Everything is driven by a single scrubbed, pinned ScrollTrigger whose `onUpdate` manually interpolates every value from scroll progress (no tweens).
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
