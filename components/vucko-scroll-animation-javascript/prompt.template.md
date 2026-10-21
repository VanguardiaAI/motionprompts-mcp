---
slug: vucko-scroll-animation-javascript
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Scroll-Grow Showreel Video Reveal (Scrub + Mouse Parallax)
## Goal
Build a minimal editorial landing page where a **tiny video-preview thumbnail (scaled to 0.25, pulled up above its section) grows into a full-width 16:9 showreel as the intro section scrolls into view**. A GSAP ScrollTrigger scrub timeline drives nothing directly — its `onUpdate` only interpolates values into a shared state object (`translateY`, `scale`, column `gap`, and a **two-phase title font-size**), and a `requestAnimationFrame` loop applies them as a transform string, adding an **eased mouse-follow horizontal parallax** that fades out as the video reaches full scale. Scroll is smoothed with Lenis. Desktop-only effect.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
