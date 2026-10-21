---
slug: 247artists-trail
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Cursor Image Trail with Striped Clip-Path Reveal (dark editorial hero)
## Goal
Build a full-viewport dark hero where **moving the mouse leaves a trail of 175×175px editorial portrait images: each time the cursor travels past a distance threshold, a new image spawns at a smoothed (lerped) trailing position and slides toward the live cursor position while it is revealed through 10 horizontal strip masks that expand from a center line outward with a middle-first stagger; ~1 second later the strips collapse back to the center (edges first) while the image dims, and the element is removed**. The star effect is the striped clip-path in/out reveal combined with the lerp-lagged spawn-and-slide motion.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
