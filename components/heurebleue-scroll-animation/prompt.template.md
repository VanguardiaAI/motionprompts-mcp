---
slug: heurebleue-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Scroll Zoom-Through Image Gallery ("Serene Drift")
## Goal
Build a scroll-driven **fly-through-the-images** effect: a fixed 5-column grid of photos sits pinned behind the page, and as a tall transparent spacer section scrolls past, a single `ScrollTrigger` (scrub) reads its progress and **scales the whole gallery wrapper up** (1 → ~3.65x on desktop, 1 → ~5x on mobile) while it **pushes the four side columns downward** and **shrinks the centered focal image from scale 2 down to ~1.15**. The viewer appears to accelerate forward through a wall of images. Opaque editorial sections (hero, intro, outro, footer) sit above the gallery; only the transparent spacer section lets the zooming gallery show through. Lenis drives smooth scrolling synced to GSAP's ticker.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
