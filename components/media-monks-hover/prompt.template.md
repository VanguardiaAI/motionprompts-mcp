---
slug: media-monks-hover
native_system: pointer-latch
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Work-List Hover — Pastel Panel Flip + Tilted Preview Reveal
## Goal
Build a full-viewport, dark **"just went live" work list**: an intro line, three big project rows separated by hairlines, and a pill CTA. The star effect is a **whole-panel hover flip**: hovering any row (a) flips the entire `#141414` panel to that row's **pastel background** and inverts all the text/CTA from white to dark navy, (b) slides a **tilted diagonal strip of three half-transparent GIF preview cards** (sitting behind the text) to a new top/left position so the card matching the hovered project glides center-stage and rotates a touch further, and (c) reveals a round arrow-pill on the hovered row where the arrow does a **conveyor swap** — the resting arrow exits right while a fresh arrow slides in from the left. Everything is CSS `transition` driven; JS only toggles a class and writes two inline overlay offsets.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
