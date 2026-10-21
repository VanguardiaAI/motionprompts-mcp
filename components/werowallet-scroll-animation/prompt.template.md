---
slug: werowallet-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 2
structural_literals: 4
structural:
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"power2.in\"", rule: value/narrated }
  - { kind: ease, literal: "\"back.out(2)\"", rule: ease/overshoot }
  - { kind: ease, literal: "\"back.in(2)\"", rule: ease/overshoot }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
