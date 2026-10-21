---
slug: kpverse-menu
native_system: curtain-toggle
compatible_systems: [curtain-toggle, entry-veil, pointer-latch, reveal-on-enter, step-advance]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# Sliding Editorial Side-Menu with Text-Scramble Hover
## Goal
Build a fixed **black rounded side panel** navigation menu that lives off-screen to the left and **slides in from the left edge** when a small "Menu" toggle in the top nav is clicked. As the panel arrives, its six big display links **cascade in one after another** from the left, and every label **scrambles through random letters and then resolves** into the real word (a left-to-right settling wave). Hovering any link re-runs the same character-scramble, flips a **chamfered white "bg-hover" block** on behind the word (turning the black text to black-on-white / aquamarine-on-active), and **lights up the small sub-label to its right character-by-character**. A close (X) button in the sidebar slides the panel back out and staggers the links away. The star effect is the **SplitType per-character scramble + the CSS clip-path slide choreography** — there is **no GSAP** here.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
