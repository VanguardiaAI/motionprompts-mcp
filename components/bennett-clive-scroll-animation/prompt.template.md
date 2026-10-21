---
slug: bennett-clive-scroll-animation
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Sticky Title Bar over Scrolling Logo List — Gap-Spread + Scale Scroll Animation
## Goal
Build a single-page editorial scroll experience. A **fixed wordmark** reading "Barrett & Hale", **centered on both axes of the viewport**, is painted with `mix-blend-mode: difference` so it inverts against everything scrolling behind it: near-black over the light client index, near-white over the dark full-bleed stills. As each row of a long client-logo list crosses the wordmark's band, the row's two logos **spread apart and then snap back together** (animated flex `gap`, driven by scrub ScrollTriggers). At the end of the page a very tall black footer section scrolls in; while it does, the wordmark **drifts downward** toward the bottom and **grows into a full-width title card**. Two effects carry the piece: the inversion, and the scrubbed flex-`gap` spread as rows pass through the wordmark.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
