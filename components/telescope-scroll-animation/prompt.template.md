---
slug: telescope-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Telescope Scroll Animation
## Goal
Build a pinned, scroll-driven "spotlight" gallery section. As the user scrolls, two intro words ("Beneath" / "Beyond") split apart horizontally while a full-bleed background image scales up from zero behind them; then a diamond-shaped `clip-path` "telescope viewfinder" takes over: a vertical column of 10 project titles scrolls up through the viewfinder while small thumbnail images fly across the right half of the screen along a quadratic bezier arc. The title closest to the vertical center of the viewport is highlighted (full opacity) and **swaps the full-bleed background image** to its matching photo. Everything is driven by a **single ScrollTrigger** (pin + scrub over 10× viewport height, Lenis-smoothed) whose `onUpdate` maps `self.progress` across phased ranges using `gsap.set` — there is no timeline.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
