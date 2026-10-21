---
slug: nvg8-scroll-animation
native_system: scrub-lagged
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 9
structural:
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: duration, literal: "2", rule: value/narrated }
  - { kind: stagger, literal: "0.15", rule: value/narrated }
  - { kind: ease, literal: "\"power2.out\"", rule: value/narrated }
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
