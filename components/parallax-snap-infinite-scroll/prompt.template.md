---
slug: parallax-snap-infinite-scroll
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Infinite Vertical Project List — Lerp-Smoothed Scroll, Recycled Slides, Per-Image Parallax, Cubic Snap
## Goal
Build a **full-viewport, endlessly looping vertical project gallery**. Each "slide" is a 100vw × 100vh split screen — one half is a project title (name + catalog number), the other half is a full-bleed image — and the halves **alternate sides** down the list. Wheel and touch scrolling drive a `translateY` on every slide through a **lerp inside a `requestAnimationFrame` loop**, so nothing jumps: the whole column glides and settles with inertia-like smoothness. Three details sell it: (1) the list is **infinite in both directions** — slides are procedurally created around the viewport and recycled out of a `Map`, so you can scroll forever; (2) each slide's image gets an **independent parallax offset** (it drifts against the scroll at a 0.2 ratio, with its own secondary lerp); and (3) when scrolling **stops**, the list eases with a **cubic ease-out** to snap the nearest slide perfectly into the frame.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
