---
slug: eduardbodak-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Scroll-Driven Card Deal & 3D Flip Sequence
## Goal
Build a multi-section scroll page (with Lenis smooth scroll) where three pastel process cards — "Plan 01", "Design 02", "Develop 03" — star in a two-act scroll story. Act 1: as you scroll past the hero, the three stacked cards fan apart (outer cards slide sideways and tilt ±15°) while dropping down, shrinking and fading. Act 2: a pinned "services" section (pinned for 4 viewport heights) where the same three cards fly up from tiny 0.25-scale thumbnails parked above the viewport, settle into a centered row at full size, then each flips 180° on the Y axis to reveal a white back listing that phase's deliverables. All the scroll motion is scrub-driven via `ScrollTrigger.onUpdate` with `gsap.set` + manual `smoothstep` interpolation (no tweens), while a CSS keyframe animation keeps the cards gently floating the whole time.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
