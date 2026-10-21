---
slug: bitkraft-menu
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 1
structural_literals: 15
structural:
  - { kind: duration, literal: "0.3", rule: value/narrated }
  - { kind: duration, literal: "0.075", rule: duration/loop }
  - { kind: duration, literal: "0.05", rule: duration/loop }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
  - { kind: ease, literal: "\"back.out(1.7)\"", rule: ease/overshoot }
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
