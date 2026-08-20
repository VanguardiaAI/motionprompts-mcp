// Retrieval sanity eval: natural-language briefs -> the slug(s) we expect near the top.
// Not a unit test of scoring internals — a guardrail that the catalog stays findable as it grows.
//   node mcp/lib/search.eval.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { search } from "./search.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { components } = JSON.parse(readFileSync(resolve(root, "src/mcp-index.json"), "utf8"));

// Each case: a brief a user might type, and slugs any of which is an acceptable top hit.
const CASES = [
  { q: "cartas apiladas que se revelan al hacer scroll", want: ["brandappart-sticky-cards", "sticky-cards", "maximatherapy-sticky-cards", "spencergabor-magnetic-cards"] },
  { q: "un monitor CRT retro con efecto glitch", want: ["3d-crt-display"] },
  { q: "menú overlay a pantalla completa elegante de lujo", want: ["audemarspiguet-menu", "overlay-menu", "poppr-menu"] },
  { q: "pantalla de carga preloader con contador", want: ["maxmilkin-preloader", "aladesign-landing-page-reveal", "outfit-landing-page-reveal", "steelworks-landing-page-reveal"] },
  { q: "galería de fotos con efecto ascii", want: ["ascii-image-reveal-effect"] },
  { q: "efecto de cursor tipo linterna que revela texto en la oscuridad", want: ["guiding-light"] },
  { q: "footer con un modelo 3d en parallax", want: ["3d-parallax-footer"] },
  { q: "marquesina magnética de texto", want: ["magnetic-marquee"] },
  { q: "transición entre páginas con bloques pixelados", want: ["block-reveal-page-transition", "grid-shutter-page-transition"] },
  { q: "simulación de fluido líquido controlada por el mouse", want: ["cappen-fluid-simulation"] },
  { q: "sección de equipo animada", want: ["workingstiff-animated-teams-section"] },
  { q: "slider carrusel en 3d", want: ["threejs-slider", "ripple-displacement-slider"] },
  { q: "menú que se arrastra draggable", want: ["draggable-menu"] },
  { q: "titular de texto que se revela palabra por palabra", want: ["text-reveal-animation", "aminezegmou-landing-page"] },
];

const K = 5;
let pass = 0;
const fails = [];

for (const { q, want } of CASES) {
  const hits = search(components, { query: q, limit: K }).map((h) => h.slug);
  const rank = hits.findIndex((s) => want.includes(s));
  const ok = rank !== -1;
  if (ok) pass++;
  else fails.push({ q, want, hits });
  const tag = ok ? `\x1b[32m✓ @${rank + 1}\x1b[0m` : `\x1b[31m✗ miss\x1b[0m`;
  console.log(`${tag}  ${q}`);
  if (!ok) console.log(`        want one of: ${want.join(", ")}\n        got:  ${hits.join(", ") || "(none)"}`);
}

console.log("\n" + "─".repeat(60));
console.log(`Recall@${K}: ${pass}/${CASES.length}  (${Math.round((pass / CASES.length) * 100)}%)`);
console.log("─".repeat(60));
process.exit(fails.length > CASES.length * 0.25 ? 1 : 0); // fail if >25% miss
