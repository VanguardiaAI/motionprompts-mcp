// CAPA 3 — Renderiza la plantilla parametrizada de un componente con los tokens de un motion
// system. Es la función que expone la API; el prompt standalone no pasa por aquí.
//
//   import { renderPrompt, listRenderable } from "./scripts/render-prompt.mjs";
//   renderPrompt("mask-reveal", "entry-veil") -> { markdown, applied, structural, warnings }
//
// CLI:
//   node scripts/render-prompt.mjs <slug> [system]      imprime el markdown renderizado
//   node scripts/render-prompt.mjs <slug> --tokens      solo el informe de tokens
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const COMP = join(root, "components");
const GEN = join(root, "generated/motion");

const systems = JSON.parse(readFileSync(join(GEN, "motion-systems.json"), "utf8"));
const sysByName = Object.fromEntries(systems.map((s) => [s.name, s]));
const compSystems = JSON.parse(readFileSync(join(GEN, "component-systems.json"), "utf8"));

export function listSystems() { return systems; }
export function listRenderable() {
  return Object.keys(compSystems).filter((s) => existsSync(join(COMP, s, "prompt.template.md")));
}

// Resuelve un token `motion.a.b` contra un motion system.
function resolveToken(path, sys) {
  const parts = path.split(".");
  if (parts[0] !== "motion") return undefined;
  let cur = sys;
  for (const p of parts.slice(1)) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/**
 * @param {string} slug
 * @param {string} [systemName] por defecto, el sistema nativo del componente
 * @returns {{markdown:string, system:string, applied:object[], structural:object[], warnings:string[]}}
 */
export function renderPrompt(slug, systemName) {
  const tplPath = join(COMP, slug, "prompt.template.md");
  if (!existsSync(tplPath)) throw new Error(`no hay plantilla para "${slug}"`);
  const entry = compSystems[slug];
  if (!entry) throw new Error(`"${slug}" no tiene sistemas asignados`);

  const name = systemName ?? entry.native_system;
  const sys = sysByName[name];
  if (!sys) throw new Error(`motion system desconocido: "${name}"`);

  const warnings = [];
  // La compatibilidad la decide la autoridad del tiempo (DECISIONS.md D9). Renderizar fuera de
  // ella no se bloquea, pero se avisa: el resultado puede no ser ejecutable.
  if (!entry.systems.includes(name)) {
    warnings.push(
      `"${slug}" es nativo de "${entry.native_system}" y NO es compatible con "${name}": ` +
      `distinta autoridad del tiempo. Los tokens se sustituyen igual, pero el resultado puede no ser coherente.`
    );
  }

  const raw = readFileSync(tplPath, "utf8");
  // Separar el frontmatter: no forma parte del prompt renderizado.
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  const frontmatter = m ? m[1] : "";
  let body = m ? raw.slice(m[0].length) : raw;

  const applied = [];
  body = body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (full, path) => {
    const v = resolveToken(path, sys);
    if (v === undefined || v === null) {
      warnings.push(`token sin valor en "${name}": ${path} — se deja el literal de la plantilla`);
      return full;
    }
    applied.push({ token: path, value: v });
    return String(v);
  });

  // Si el sistema prescribe curvas de CustomEase, se inyecta la definición canónica. Sin esto un
  // `ease: "hop"` renderizado no significa nada: AUDIT.md §6.1-C midió 13 curvas para ese nombre.
  const usedCustom = Object.keys(sys.custom_ease_defs ?? {}).filter((n) =>
    new RegExp(`["']${n}["']`).test(body));
  if (usedCustom.length) {
    const defs = usedCustom.map((n) =>
      `CustomEase.create("${n}", "${sys.custom_ease_defs[n].curve}");`).join("\n");
    body += `\n\n## Motion system: curvas requeridas\n\nEste prompt usa eases registradas por nombre. ` +
      `Regístralas EXACTAMENTE así — el mismo nombre con otra curva es un choque global silencioso:\n\n` +
      "```js\n" + defs + "\n```\n";
  }

  const structural = parseStructural(frontmatter);
  if (structural.length) {
    body += `\n\n## Valores no parametrizables\n\n` +
      `Los siguientes valores se dejan literales a propósito: son estructurales al efecto y ` +
      `sustituirlos lo rompe.\n\n` +
      structural.map((s) => `- \`${s.kind}: ${s.literal}\` — ${RULE_TEXT[s.rule] ?? s.rule}`).join("\n") + "\n";
  }

  return { markdown: body, system: name, applied, structural, warnings };
}

const RULE_TEXT = {
  "ease/overshoot": "la curva tiene sobreimpulso/rebote y ESE es el efecto; una power lo elimina",
  "ease/scrub-linear": "va dentro de un tween scrubbeado: el scrub ya mapea la distancia, una curva de tiempo produce doble easing",
  "duration/loop": "es la cadencia de un bucle (repeat:-1 / yoyo), no un tiempo de revelado",
  "duration/coupled": "el prompt lo declara acoplado a otro valor",
  "stagger/shape": "el signo o la aleatoriedad son la forma del efecto, no su ritmo",
  "lerp/retention": "coeficiente de retención de un integrador: cambiarlo cambia la física, no la velocidad",
  "value/simulation": "vive en un uniform de shader o en la config de un motor físico",
};

function parseStructural(fm) {
  const out = [];
  for (const line of fm.split("\n")) {
    const m = line.match(/^\s*-\s*\{\s*kind:\s*(\w+),\s*literal:\s*("(?:[^"\\]|\\.)*"),\s*rule:\s*([\w/-]+)\s*\}/);
    if (m) out.push({ kind: m[1], literal: JSON.parse(m[2]), rule: m[3] });
  }
  return out;
}

// ---------------------------------------------------------------- CLI
if (process.argv[1] && process.argv[1].endsWith("render-prompt.mjs")) {
  const argv = process.argv.slice(2);
  const wantTokens = argv.includes("--tokens");
  const [slug, arg] = argv.filter((a) => !a.startsWith("--"));
  if (!slug) {
    console.log("uso: node scripts/render-prompt.mjs <slug> [system|--tokens]");
    console.log("sistemas:", systems.map((s) => s.name).join(", "));
    process.exit(0);
  }
  const r = renderPrompt(slug, arg);
  if (wantTokens) {
    console.log(`${slug} · sistema ${r.system}`);
    console.log(`aplicados: ${r.applied.length}`);
    const byToken = {};
    for (const a of r.applied) byToken[a.token] = a.value;
    for (const [t, v] of Object.entries(byToken)) console.log(`   ${t} = ${v}`);
    console.log(`estructurales preservados: ${r.structural.length}`);
    for (const s of r.structural) console.log(`   ${s.kind}: ${s.literal} (${s.rule})`);
    for (const w of r.warnings) console.log(`   ⚠ ${w}`);
  } else {
    console.log(r.markdown);
  }
}
