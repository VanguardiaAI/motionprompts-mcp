---
slug: fluid-splash-cursor
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Fluid Splash Cursor (page-level GPU Navier–Stokes overlay)
## Goal
Build a page whose pointer drags **liquid ink across the entire document** — not inside a hero box, not behind the content, but on a transparent full-window layer that composites over headlines, tables, borders and photographs alike. Moving the pointer pushes a force and a puff of dye into a fluid simulation running on the GPU; the ink curls, spreads and dissipates on its own. Clicking bursts. The page underneath is never touched: no blend mode inverts it, no canvas covers it, no listener steals its clicks.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
