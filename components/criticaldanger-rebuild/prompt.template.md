---
slug: criticaldanger-rebuild
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Scroll-Pinned Horizontal Heading + Fly-Across Product Cards
## Goal
Build a scroll-driven, **pinned** section where a **giant single-line heading slides horizontally to the left** as you scroll, while **five product cards fly in from off the right edge, travel all the way across the screen and off the left**, each one **staggered by a scroll delay** and following its own hand-authored path of vertical bob + rotation. The whole section is pinned for 5 viewport heights of scroll, smooth-scrolled with Lenis. The star effect is the interplay between the massive horizontally-panning title and the swarm of cards arcing across it, all scrubbed 1:1 to scroll via a single `ScrollTrigger.onUpdate` that recomputes every element per frame with `gsap.utils.interpolate`. A full-bleed hero image sits above the pinned section and a plain dark outro sits below it.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
