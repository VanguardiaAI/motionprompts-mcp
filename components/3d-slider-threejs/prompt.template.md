---
slug: 3d-slider-threejs
native_system: scrub-welded
compatible_systems: [scrub-lagged, scrub-welded]
tokens_used: 0
structural_literals: 0
# Generado por scripts/build-motion-templates. NO editar a mano: se regenera.
# El prompt standalone intacto vive en prompt.md y es el que sirve la web.
---
# ThreeJS 3D Curved Slider (WebGL canvas-texture, Lenis scroll, no GSAP)
## Goal
Build a full-screen **3D curved plane that displays an endless vertical slideshow of captioned images**, rendered entirely in Three.js. Seven images with title captions are painted onto a tall repeating **2D canvas** that is used as a texture on one big **parabolically curved plane** tilted in 3D space. **Lenis smooth-scroll progress (0→1 over a very tall page) is fed into a scroll listener that shifts the texture's vertical offset and re-renders the WebGL scene**, so scrolling pushes the strip of images continuously up through the curved 3D sheet and loops forever. The star effect: the **image strip appears to bend and flow over a concave wave** because the flat canvas is mapped onto a plane whose vertices curve toward the camera at the top and bottom edges, viewed from an angled, rolled camera. A dark radial vignette overlay and fixed nav/footer frame the scene.
...

> This prompt requires the Unlimited plan (Full Stack for MCP access). Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. Pricing: https://motionprompts.dev/pricing/
