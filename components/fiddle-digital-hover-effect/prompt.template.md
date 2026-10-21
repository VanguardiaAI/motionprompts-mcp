---
slug: fiddle-digital-hover-effect
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Digital Scramble Hover Effect
## Goal
Build a full-viewport page with a single centered hero image. The star effect: an **invisible grid of tiny fixed cells** is overlaid exactly on top of the image, and each cell secretly holds a random monospace symbol (`O X * > $ W`). As the cursor moves across the image, the cell nearest the pointer — **plus a short random chain of up to 7 of its neighbors** — briefly flips to a solid black tile with a visible white glyph, and a subset of those tiles **scrambles its symbol every 150 ms**. Each activated tile stays lit for ~300 ms then fades back to invisible. The net result is a live **digital-noise / glitch trail** of black glyph-blocks that follows the mouse across the picture, like the image is being "read" pixel-by-pixel.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
