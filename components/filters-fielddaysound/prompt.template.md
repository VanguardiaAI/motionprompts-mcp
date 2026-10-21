---
slug: filters-fielddaysound
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 8
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "0.25", rule: value/narrated }
  - { kind: stagger, literal: "0.025", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
