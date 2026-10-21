---
slug: kvs-studio-image-reveal
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Studio Scroll-Powered Image Reveal — clip-path wipe with ASCII dissolve band
## Goal
Build a pinned, full-viewport **stack of five images** that is scrubbed through by scrolling. As you scroll, the top image's `clip-path` **wipes upward** (its top edge slides down) to uncover the next image below it, one image at a time — four transitions total. The star effect: riding exactly on the moving wipe edge is a **band of orange ASCII glyphs** (a fixed 16px grid of random characters) that **dithers/dissolves** the boundary — a dense scatter of flickering monospace characters that fades out above and below the edge with a probabilistic density falloff, so the hard clip line reads as a granular, disintegrating transition. Everything is driven by a single pinned `ScrollTrigger` with `scrub`, synced to Lenis smooth scrolling.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
