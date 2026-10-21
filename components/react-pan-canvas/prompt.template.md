---
slug: react-pan-canvas
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Build: Mousemove Pan-Canvas Video Gallery
## Goal
A full-viewport black canvas holds an **oversized 200vw × 200vh grid of media tiles**, centered so only the middle of the grid is visible at rest. **Moving the mouse pans the whole grid in the opposite direction of the cursor**, letting you "explore" the offscreen tiles by simply steering — no scroll, no drag, no click. The motion is buttery and weighty because the pan is written as a single `transform` on the grid and eased by a **2-second `cubic-bezier` CSS transition**, so the grid glides toward each new cursor position and trails behind fast movements. Each tile **hover-reveals a looping video** (its still preview fades out, a zoomed-in looping clip fades in) with the project title centered on top. The star effect is the **cursor-inverse translate + long cubic-bezier easing** that makes the entire gallery feel like a heavy, floating canvas.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
