---
slug: voltlites-scroll-animation
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Voltlites Scroll Animation — Pinned Hero Zoom-Out Reveal
## Goal
Build a full-screen dark hero that is **pinned for four viewport heights** while a giant **3×3 spotlight image grid** (300% of the viewport, 300svh tall) **zooms out** from the center. As you scroll: the whole grid scales `1 → 0.5` while every image **counter-zooms** `1.25 → 1` (so the images stay full-bleed inside their cells as the grid shrinks); a **fixed brand logo** shrinks from a huge `6×` (`2×` on mobile) down to `1×` and **travels from the bottom-left corner up toward the top**; a small **footer tagline blurs and fades away** early; and a centered **SplitText headline reveals word-by-word** followed by a CTA button, each fading in as you scroll. When the next section reaches the viewport, a second scrubbed trigger **slides the whole hero up 25% under a darkening black overlay** as an exit parallax. All of it is driven by **manual `lerp` + `mapRange` math inside `onUpdate`** (not scrub tweens), with Lenis smooth scroll.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
