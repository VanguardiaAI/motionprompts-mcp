---
slug: larevoltosa-scroll-animation
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Larevoltosa Scroll Animation — Pinned "Zoom Into The Glasses" Spotlight
## Goal
Build a three-section scroll page whose middle **`.spotlight` section pins and, over three viewport-heights of scrubbed scroll, a giant inline SVG doodle character zooms up toward its glasses**. As it zooms, three things happen inside the two lens shapes: **white glare bands sweep across each lens**, a **full-bleed photo fades in clipped to the lens silhouettes**, and a **word-by-word headline reveals** in the centre. Everything is driven by a single pinned `ScrollTrigger` (`scrub: true`) reading `self.progress`, with Lenis smooth scroll. The lenses and their glare/photo layers are **generated at runtime** by cloning shapes out of the doodle SVG into `clipPath`s.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
