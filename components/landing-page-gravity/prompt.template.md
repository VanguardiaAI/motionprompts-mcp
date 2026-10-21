---
slug: landing-page-gravity
native_system: continuous-follow
compatible_systems: [continuous-follow]
tokens_used: 0
structural_literals: 11
structural:
  - { kind: duration, literal: "1.5", rule: value/narrated }
  - { kind: duration, literal: "1", rule: value/narrated }
  - { kind: stagger, literal: "0.1", rule: value/narrated }
  - { kind: stagger, literal: "-0.1", rule: stagger/shape }
  - { kind: ease, literal: "\"power3.inOut\"", rule: value/narrated }
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
