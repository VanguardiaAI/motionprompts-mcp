---
slug: js-image-minimap
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Sticky Image Minimap — Thumbnail Strip That Glides Through a Fixed Indicator as You Scroll a Tall Gallery
## Goal
Build a **tall, black, editorial vertical image gallery** with a **sticky sidebar minimap** on the left. The gallery column (75% wide) holds ten large stacked photos; the minimap (25% wide) is pinned to the viewport and contains a vertical strip of the same ten photos as small thumbnails. The star effect: as the page scrolls through the gallery, the whole thumbnail strip **slides vertically (translateY)** behind a **fixed bordered indicator box**, so the minimap "plays through" its thumbnails in lockstep with the scroll — the thumbnail currently framed by the indicator matches the large photo you're looking at. The indicator uses `mix-blend-mode: difference` so its outline stays legible over any thumbnail. A second scroll trigger: once you've scrolled past **four viewport heights**, the entire page **inverts from a black theme to a white theme** with a smooth 0.5s color transition.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
