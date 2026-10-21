---
slug: poppr-menu
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 12
structural_literals: 16
structural:
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: duration, literal: "0.75", rule: value/narrated }
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: stagger, literal: "0.01", rule: value/narrated }
  - { kind: ease, literal: "\"power4.in\"", rule: value/narrated }
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
