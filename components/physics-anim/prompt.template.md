---
slug: physics-anim
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Interactive Divs with Physics — floating grayscale cards that scatter from the cursor
## Goal
Build a full-screen, black, zero-gravity playground where **twelve grayscale polaroid-style image cards drift over the whole viewport**. Each card is a real HTML `<div>` whose position and rotation are driven, every frame, by a Matter.js rigid body living in a **gravity-free** physics world. A big centered word sits behind them. The star effect: **moving the mouse near a card fires a random impulse into it**, so nearby cards shoot away, slowly coast to a stop under air friction, gently bounce off the invisible viewport walls, and keep floating. It reads like a slow-motion swarm of photo prints you can bat around with the cursor.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
