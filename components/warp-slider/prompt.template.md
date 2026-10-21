---
slug: warp-slider
native_system: step-advance
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 6
structural_literals: 11
structural:
  - { kind: duration, literal: "2.5", rule: value/narrated }
  - { kind: duration, literal: "0.6", rule: value/narrated }
  - { kind: duration, literal: "0.5", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
