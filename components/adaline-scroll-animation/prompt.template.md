---
slug: adaline-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Adaline-Style Scroll Animation (Canvas Image-Sequence Hero)
## Goal
Build a cinematic landing hero where a **104-frame image sequence plays back frame-by-frame on a full-viewport `<canvas>`, driven entirely by scroll**. The hero section is **pinned for 7 viewport-heights** of scrolling; as the user scrolls, a single ScrollTrigger's `onUpdate` maps progress to (1) the current video frame drawn on canvas, (2) a fade-out of the fixed nav, (3) the headline block being **pushed away on the Z axis** (`translateZ` 0 → −500px) while fading, and (4) a product-dashboard mockup that **flies in from deep 3D space** (`translateZ(1000px)` → `0`) and lands centered as the sequence ends. A plain outro section follows. Scroll is smoothed with Lenis.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
