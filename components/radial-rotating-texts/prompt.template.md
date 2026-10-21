---
slug: radial-rotating-texts
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 15
structural:
  - { kind: duration, literal: "0.05", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: ease, literal: "\"elastic.out(1, 0.3)\"", rule: ease/overshoot }
  - { kind: ease, literal: "\"power3.out\"", rule: value/narrated }
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
