---
slug: moblinks-interactive-logo
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Interactive Logo Depth Tunnel
## Goal
Build a full-viewport hero that frames a centered monogram logo inside a **tunnel of concentric, logo-shaped holes** receding into depth. Five solid, purple, full-bleed layers each have the **same glyph silhouette punched out of them** at progressively smaller sizes (via `mask-composite: subtract`), stacked with a sixth layer that holds the real logo image at the very center. As the pointer moves over the hero, every layer **trails the cursor** — but each one reads a progressively *older* cursor position from a frame-buffer (an 8-frame stagger per layer) and eases toward it with a slow lerp. The result is a soft, cascading parallax "wormhole": the inner logo leads, the outer rings lag behind like a comet tail, and the whole tunnel swings toward wherever the mouse is. No scroll, no click — pure `mousemove` + a per-frame ticker.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
