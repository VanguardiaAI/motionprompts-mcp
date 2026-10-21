---
slug: ingamana-scroll-animation
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Ingamana Scroll Animation
## Goal
Build a long scroll page: a full-screen intro, then a **10-row image grid**, then a full-screen outro. The signature effect: **each grid row continuously widens as you scroll it through the viewport** — from `125%` to `500%` of the viewport width (`250% → 750%` on mobile) — and because every row is horizontally centered inside an `overflow:hidden` container, the extra width bleeds off both edges symmetrically, so the whole row (and its images) reads as a smooth **zoom-in / push-in** the deeper it travels up the screen. Every row runs its own zoom independently, keyed to that row's own scroll progress, producing a staggered cascade of expanding rows. Smooth scroll via Lenis. Crucially, this is **NOT a ScrollTrigger effect** — it is hand-computed every frame from `window.scrollY` inside a `gsap.ticker` callback.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
