// Verificador ejecutable de COMPOSITION_RULES.md. Es la autoridad: si una regla no está aquí,
// no existe. C1 y C2 se validan con esto.
//
//   import { checkComposition } from "./scripts/check-composition.mjs";
//   checkComposition(["mask-reveal", "sticky-cards"]) -> { ok, violations[], warnings[], budget }
//
// CLI:  node scripts/check-composition.mjs slug1 slug2 slug3
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  RULE_READS, EMBEDDED, LIB_CHUNK, UNWEIGHTED,
  field, path as deepPath, sparse, requireArtifact,
} from "../schema/data-contract.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const GEN = join(root, "generated/motion");
const req = (f, who) => requireArtifact(readFileSync, existsSync, join(GEN, f), who);

const motion = req("motion-meta.json", "check-composition");
const { capabilities, conflicts } = req("conflicts.json", "check-composition");
const evidence = req("composition-evidence.json", "check-composition");
const systems = req("motion-systems.json", "check-composition");

// El motor exige su propio contrato AL CARGAR. Si un artefacto se regenera sin un campo que alguna
// regla declara en schema/data-contract.mjs, esto revienta aquí — no más adelante, en silencio y
// con un `?? []` convirtiendo el fallo en "no hay ninguno". Es lo que le pasó a R11.
const declared = Object.values(RULE_READS).flat();
const REQUIRED_MOTION = [...new Set(
  declared.filter((p) => p.startsWith("motion.<slug>.")).map((p) => p.slice(14).split(".")[0])
)];
for (const [slug, m] of Object.entries(motion))
  for (const k of REQUIRED_MOTION) field(m, k, `motion-meta.json → ${slug}`);
for (const p of declared.filter((p) => p.startsWith("evidence.")))
  deepPath(evidence, p.slice(9).replace(/\[\].*$/, ""), "composition-evidence.json");
for (const cap of EMBEDDED.capabilities.values)
  field(evidence.capabilities, cap, "composition-evidence.json → capabilities");

// R7 · el peso de cada librería sale del chunk que Vite emitió de verdad.
// El mapa nombre→chunk y la lista de exentos viven en schema/data-contract.mjs y los valida
// scripts/validate-rule-schema.mjs: un nombre nuevo sin declarar hace fallar el build en vez de
// contar 0 KB en silencio, que es lo que hacía `split-type` (el código comparaba con "splittype").
const LIB_GZIP = Object.fromEntries(
  Object.entries(evidence.library_weight)
    .filter(([, v]) => v && typeof v === "object" && v.gzip)
    .map(([k, v]) => [k, v.gzip])
);
// Devuelve los CHUNKS que aporta una librería, no sus bytes: el presupuesto los mete en un Set
// para que un chunk compartido por dos librerías (gsap_matrix lo importan Flip y Draggable) se
// cuente una sola vez.
function libChunks(lib) {
  const l = lib.toLowerCase();
  if (l in UNWEIGHTED) return [];
  if (!(l in LIB_CHUNK))
    throw new Error(
      `[esquema] R7: la librería "${lib}" no está declarada en LIB_CHUNK ni en UNWEIGHTED ` +
      `(schema/data-contract.mjs). Sin declararla contaría 0 KB de presupuesto en silencio.`
    );
  return LIB_CHUNK[l];
}

export const BUDGET = { js_gzip: 450 * 1024, assets: 6 * 1024 * 1024, pin_vh: 2400, pinned_max: 3 };

// Los literales incrustados también se declaran: scripts/validate-rule-schema.mjs comprueba que
// cada slug, categoría y capacidad siga existiendo, y que la evidencia no mida MÁS killers de los
// que la regla lleva escritos.
const KILLERS = new Set(EMBEDDED.killers.values);
const NON_REPEATABLE = new Set(EMBEDDED.non_repeatable.values);
const INFINITE_LENIS = EMBEDDED.infinite_lenis.values[0];

// `systems` lo asigna la CAPA 2 y vive en components/*/meta.json — NO en motion-meta.json, que es
// el derivado de la CAPA 1. Leerlo de ahí daba `undefined` para los 219 y R11 marcaba TODA
// composición como incompatible con su propio sistema. Ver DECISIONS.md D22.1.
for (const slug of Object.keys(motion)) {
  const p = join(root, "components", slug, "meta.json");
  const j = requireArtifact(readFileSync, existsSync, p, `R11 → components/${slug}`);
  motion[slug].systems = field(field(j, "motion", `components/${slug}/meta.json`), "systems", `components/${slug}/meta.json → motion`);
}

// `conflicts.capabilities` y `conflicts.conflicts` son mapas DISPERSOS a propósito: solo tienen
// entrada para los componentes que ejercen alguna capacidad (147 de 219) o que chocan con alguien
// (117). Ausencia de clave = "ninguno", no dato perdido. Por eso `sparse()` y no `field()`.
const capsOf = (slug) => new Set(sparse(capabilities, slug, []).map((c) => c.capability));

// Las secciones de la evidencia SÍ son obligatorias: si una desaparece al regenerar el artefacto,
// la regla que la usa debe morir, no desactivarse sola.
const evSection = (name) => deepPath(evidence, `${name}.components`, `check-composition → ${name}`);
const CHROME = new Map(evSection("fixed_chrome").map((c) => [c.slug, c.bars]));
// Superposiciones fijas: las que declaran cubrir el viewport, y las fijas sin dimensionar (lo que
// ocupan lo decide su contenido; se resuelven con la aserción en runtime del montaje).
const OVERLAY_FULL = new Map(evSection("fixed_overlays").filter((c) => c.full.length).map((c) => [c.slug, c.full]));
const OVERLAY_UNSIZED = new Map(evSection("fixed_overlays").filter((c) => c.unsized.length).map((c) => [c.slug, c.unsized]));
// Componentes cuyo bucle rAF además pinta: son los que hay que gatear con IntersectionObserver.
// Cubre TODA la biblioteca, no solo los WebGL: un bucle sobre canvas 2D consume igual.
export const RENDER_LOOPS = new Map(evSection("render_loops").map((c) => [c.slug, c.fn]));
const ABSOLUTE = new Map(evSection("absolute_positioned").map((c) => [c.slug, c.count]));
const LAYOUT_ANIM = new Map(evSection("layout_animated").map((c) => [c.slug, c.props]));

export function checkComposition(slugs, opts = {}) {
  const violations = [];
  const warnings = [];
  // Una violación REPARABLE se puede arreglar en el montaje con un paso concreto (quitar un Lenis
  // sobrante, acotar un overflow). Una IRREPARABLE exige editar el componente o cambiar la
  // selección. plan_page admite las primeras — y entonces el contrato DEBE emitir la reparación —
  // y nunca las segundas. Ver DECISIONS.md D19.
  const V = (rule, msg, detail) => violations.push({ rule, message: msg, repairable: false, ...detail });
  const R = (rule, msg, repair, detail) => violations.push({ rule, message: msg, repairable: true, repair, ...detail });
  const W = (rule, msg, detail) => warnings.push({ rule, message: msg, ...detail });

  const unknown = slugs.filter((s) => !motion[s]);
  if (unknown.length) {
    V("R0", `componentes desconocidos: ${unknown.join(", ")}`, { slugs: unknown });
    return { ok: false, violations, warnings, budget: null };
  }
  const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dup.length) V("R0", `componentes repetidos en la composición: ${[...new Set(dup)].join(", ")}`, { slugs: dup });

  // --- R1 dueño del scroll ---
  const owners = slugs.filter((s) => capsOf(s).has("page-scroll-owner"));
  if (owners.length > 1)
    R("R1", `${owners.length} titulares de page-scroll-owner; solo puede haber 1`,
      `Conservar el Lenis de "${owners[0]}" y eliminar la instancia de los otros ${owners.length - 1}: ` +
      `pasarles la compartida. 80 de los 83 usan configuración por defecto idéntica, así que compartir es gratis.`,
      { slugs: owners });
  if (slugs.includes(INFINITE_LENIS) && slugs.length > 1)
    V("R1", `${INFINITE_LENIS} usa Lenis infinite:true: envuelve el documento entero y desarma las demás instancias`, { slugs: [INFINITE_LENIS] });

  // --- R2 velo de entrada ---
  const veils = slugs.filter((s) => capsOf(s).has("entry-veil"));
  if (veils.length > 1) V("R2", `${veils.length} velos de entrada; solo puede haber 1`, { slugs: veils });

  // --- R3 preloader → hero (orden, no cantidad): se reporta como contrato, no violación ---
  if (veils.length === 1 && slugs.length > 1)
    W("R3", `${veils[0]} es velo de entrada: todo lo demás debe inicializarse tras su onComplete`, { slugs: veils });

  // --- R4 WebGL hero ---
  const glHeroes = slugs.filter((s) => (evidence.webgl.components.find((c) => c.slug === s)?.fullViewport));
  const gl = slugs.filter((s) => evidence.webgl.components.some((c) => c.slug === s));
  if (glHeroes.length > 1)
    V("R4", `${glHeroes.length} efectos WebGL a viewport completo; máximo 1 (ninguno pausa su bucle de render)`, { slugs: glHeroes });

  // --- R5 pins y pasillo ---
  const pins = slugs.filter((s) => motion[s].pinned);
    // lint-artefacto-ok: `cluster` existe siempre (comprobado al cargar) pero vale null cuando el
  // componente no cae en ningún clúster; el "" es para que el test de la regex no reviente.
  const scrubPins = pins.filter((s) => /SCROLL-WELDED|SCROLL-LAGGED/.test(motion[s].cluster || ""));
  if (scrubPins.length > BUDGET.pinned_max)
    V("R5", `${scrubPins.length} secciones pinned con scrub; máximo ${BUDGET.pinned_max}`, { slugs: scrubPins });
  // lint-artefacto-ok: la clave `viewport_heights` existe siempre (se comprueba al cargar) pero
  // vale `null` cuando el pasillo no se puede leer del código. D1 y UNRESOLVED.md: null es "no
  // determinable", no "cero"; para sumar hace falta un 0.
  const pinVh = pins.reduce((a, s) => a + (motion[s].viewport_heights ?? 0), 0);
  // El pasillo NO son solo los pins. 26 de 219 declaran viewport_heights sin estar pinneados: su
  // pasillo es un `html,body{height:Nvh}` y ocupa documento igual. Sumar solo los pins daba 1500vh
  // en la composición de C3 cuando el pasillo real era 2500. Ver DECISIONS.md D21.
  // lint-artefacto-ok: mismo caso que pinVh — null es "no determinable", y no declara pasillo.
  const corridor = slugs.filter((s) => (motion[s].viewport_heights ?? 0) > 100);
  // lint-artefacto-ok: mismo caso que pinVh.
  const totalVh = corridor.reduce((a, s) => a + (motion[s].viewport_heights ?? 0), 0);
  if (totalVh > BUDGET.pin_vh)
    R("R5", `pasillo total ${totalVh}vh supera el presupuesto de ${BUDGET.pin_vh}vh`,
      `Recortar el pasillo de las secciones con scrub hasta bajar de ${BUDGET.pin_vh}vh. Es seguro ` +
      `cuando el efecto lee un progreso normalizado (0→1 sobre su rango): acortar cambia la ` +
      `velocidad, no el recorrido. NO lo es si el componente cuenta píxeles absolutos.`,
      { slugs: corridor.map((s) => `${s}:${motion[s].viewport_heights}vh`), totalVh });
  // `document-height` es una declaración CSS global, no una instancia de JS: basta UNO para
  // recortar el documento entero de la página compuesta. El umbral correcto es 0, no 1.
  const docH = slugs.filter((s) => capsOf(s).has("document-height"));
  if (docH.length && slugs.length > 1)
    R("R5", `${docH.length} componente(s) fijan la altura del documento con html/body{height}`,
      `Quitar el \`html/body { height: Nvh }\` de TODOS —incluso si solo hay uno— y dejar que la ` +
      `altura la genere el pinSpacing de ScrollTrigger, o moverla a un wrapper propio de cada ` +
      `componente. Con un único titular la regla anterior daba la página por válida y el documento ` +
      `quedaba recortado a la altura que declarase ese componente.`, { slugs: docH });

  // --- R6 categorías no repetibles ---
  const byCat = {};
  for (const s of slugs) (byCat[motion[s].category] ??= []).push(s);
  for (const [cat, list] of Object.entries(byCat))
    if (NON_REPEATABLE.has(cat) && list.length > 1)
      V("R6", `categoría "${cat}" repetida ${list.length} veces; no es repetible`, { slugs: list });

  // --- R7 presupuesto ---
  const libs = new Set(slugs.flatMap((s) => motion[s].libs));
  // El desglose va por CHUNK, no por nombre declarado: dos nombres que apuntan al mismo chunk
  // (EffectComposer y UnrealBloomPass, p.ej.) no pueden sumar dos veces.
  const chunks = new Set(); const declaredBy = {};
  for (const l of libs) for (const c of libChunks(l)) { chunks.add(c); (declaredBy[c] ??= []).push(l); }
  let jsGzip = 0;
  const libBreakdown = {};
  for (const c of chunks) {
    const g = field(LIB_GZIP, c, `R7 → library_weight (chunk "${c}", pedido por ${declaredBy[c].join("/")})`);
    jsGzip += g; libBreakdown[c] = g;
  }
  const assetBytes = slugs.reduce((a, s) => a + motion[s].assets_required.bytes, 0);
  if (jsGzip > BUDGET.js_gzip)
    W("R7", `JS ${(jsGzip / 1024).toFixed(0)}KB gzip supera el presupuesto de ${BUDGET.js_gzip / 1024}KB`, { jsGzip });
  if (assetBytes > BUDGET.assets)
    W("R7", `assets ${(assetBytes / 1024 / 1024).toFixed(1)}MB superan el presupuesto de ${BUDGET.assets / 1024 / 1024}MB`, { assetBytes });

  // --- R8 capacidades restantes ---
  // El umbral no es el mismo para todas. Una capacidad que se ejerce ASIGNANDO algo (window.onload)
  // solo choca si hay dos. Una que se ejerce DECLARANDO CSS global (page-scroll-lock) o
  // reclamando un singleton del documento (first-canvas) rompe la página con un solo titular en
  // cuanto hay alguien más. Ver DECISIONS.md D21.
  const REPAIR_R8 = {
    "page-scroll-lock": "Acotar el `overflow:hidden` al contenedor del componente en vez de a html/body.",
    "first-canvas": 'Sustituir `document.querySelector("canvas")` por una consulta acotada a la raíz del componente.',
    "window-onload": "Cambiar `window.onload = fn` por `window.addEventListener('load', fn)`.",
  };
  const glCount = gl.length;
  const R8_THRESHOLD = {
    // basta 1 en una página compuesta: es CSS global sobre html/body
    "page-scroll-lock": () => (slugs.length > 1 ? 1 : 2),
    // basta 1 si hay más de un canvas en juego: se llevaría el del vecino
    "first-canvas": () => (glCount > 1 ? 1 : 2),
    "window-onload": () => 2,
  };
  for (const cap of ["page-scroll-lock", "first-canvas", "window-onload"]) {
    const h = slugs.filter((s) => capsOf(s).has(cap));
    const min = R8_THRESHOLD[cap]();
    if (h.length >= min)
      R("R8", h.length > 1
        ? `${h.length} titulares de "${cap}"; solo puede haber 1`
        : `"${h[0]}" ejerce "${cap}" sobre el documento entero, y no está solo en la página`,
        REPAIR_R8[cap], { slugs: h, capability: cap });
  }

  // --- R14 superposición fija a pantalla completa ---
  // R13 solo mira barras (nav/header/footer). En la FASE 1 del brief editorial, `.model` —el
  // contenedor del canvas WebGL de offficestud— se quedó `position:fixed` sobre las 21 pantallas
  // de la página y ninguna regla lo veía. Un elemento fijo que cubre el viewport es cromo, se
  // llame como se llame. El velo de entrada es la excepción legítima: cubrirlo todo es su función.
  if (slugs.length > 1) {
    const veilers = new Set(slugs.filter((s) => capsOf(s).has("entry-veil")));
    const full = slugs.filter((s) => OVERLAY_FULL.has(s) && !veilers.has(s));
    if (full.length)
      R("R14", `${full.length} componente(s) declaran un elemento fijo que cubre el viewport y no son el velo de entrada`,
        `Acotar cada uno a su sección con \`position: sticky; top: 0; height: 100vh\` más un ` +
        `\`margin\` negativo que lo saque del flujo. Queda clavado al viewport mientras su sección ` +
        `esté en pantalla y se va con ella al terminar. NO usar \`position: absolute\`: eso lo clava ` +
        `a un extremo de la sección y deja de seguir al viewport, que es justo lo que el efecto hacía.`,
        { slugs: full.map((s) => `${s}:${OVERLAY_FULL.get(s).join(",")}`) });
    const unsized = slugs.filter((s) => OVERLAY_UNSIZED.has(s) && !veilers.has(s));
    if (unsized.length)
      W("R14", `${unsized.length} componente(s) declaran un elemento \`position:fixed\` SIN dimensionar: lo que ocupe lo decide su contenido. Comprobarlo en el navegador tras montar`,
        { slugs: unsized.map((s) => `${s}:${OVERLAY_UNSIZED.get(s).join(",")}`) });
  }

  // --- R15 acotado del CSS ---
  // Deja de ser un "esto no lo cubrimos" y pasa a ser un paso obligatorio del montaje. La FASE 1
  // del brief editorial lo midió: 78 de 203 propiedades computadas (38%) cambian respecto del
  // componente aislado sin que nadie lo pida. AUDIT.md §6.2: 0 de 219 usan @layer/@scope/contain.
  if (slugs.length > 1)
    R("R15", `${slugs.length} hojas de estilo sin frontera de componente: se re-tematizan entre sí y el orden de pegado decide`,
      `Pasar cada styles.css por \`node scripts/scope-css.mjs <slug> <.raíz> <destino>\` antes de ` +
      `pegarlas. Reasigna el :root a la raíz de la sección, elimina las reglas sobre html/body y ` +
      `prefija el resto. Verificar con \`node scripts/verify-theming.mjs\`: la deriva debe ser 0 ` +
      `salvo la que pidan otras reparaciones.`,
      { slugs });

  // --- R17 bloque contenedor ---
  // Un `position:absolute` se resuelve contra el ancestro posicionado más cercano. En la demo de
  // un componente ese ancestro normalmente NO existe, así que resuelve contra el bloque contenedor
  // inicial — que ahí es la propia página, y por eso se ve bien. Al componer, el bloque contenedor
  // inicial pasa a ser un documento de 20 000px y el elemento se va al principio del todo.
  // Descubierto en la FASE 2 del brief editorial: el retrato de la narrativa y el nav de la
  // sección de texto se fueron los dos a la cabecera del documento.
  const abs = slugs.filter((s) => ABSOLUTE.has(s));
  if (abs.length && slugs.length > 1)
    R("R17", `${abs.length} componente(s) posicionan elementos en absoluto (${abs.reduce((a, s) => a + ABSOLUTE.get(s), 0)} reglas) y su raíz no es bloque contenedor`,
      `Declarar \`position: relative\` en la raíz de cada sección Y en cada \`<section>\` que haya ` +
      `dentro. Sin eso, todo \`position:absolute\` se resuelve contra el documento entero y aparece ` +
      `al principio de la página. Y solo con la raíz tampoco basta: cada componente escribió su CSS ` +
      `creyendo que un \`<section>\` suyo ERA la página, así que un \`top:50%\` espera el 50% de una ` +
      `pantalla, no el 50% del pasillo entero de su raíz. Afecta a 207 de los 219 componentes.`,
      { slugs: abs.map((s) => `${s}:${ABSOLUTE.get(s)}`) });

  // --- R18 una mecánica que crece por encima de un pin ---
  // Medido componiendo ASCUA. `qindustrial-scroll` lleva sus cinco filas de 150 a 450px de alto EN
  // EL FLUJO: el documento crece 1 500px mientras el visitante baja. ScrollTrigger horneó la
  // posición del pin de la sección de cierre en el único `refresh()` del arranque, así que ese pin
  // arrancaba 1 500px antes de tiempo y el cierre se dibujaba ENCIMA de la sección anterior. Sin un
  // error de consola, y sin solape geométrico que buscar: las dos secciones estaban donde decían
  // estar, el problema era que el pin no.
  //
  // Avisa y no bloquea porque la medida no distingue si el elemento animado está en el flujo: un
  // menú en `position:absolute` que anima su altura sale marcado y es inofensivo.
  const crecen = slugs.filter((s) => LAYOUT_ANIM.has(s));
  const pinsAqui = slugs.filter((s) => motion[s].pinned);
  if (crecen.length && pinsAqui.length)
    W("R18", `${crecen.length} componente(s) animan una propiedad de layout y ${pinsAqui.length} pinnean: si lo que crece está en el flujo, todo pin por debajo arranca donde ya no toca`,
      {
        crecen: crecen.map((s) => `${s}:${LAYOUT_ANIM.get(s).join("/")}`),
        pinned: pinsAqui,
        repair:
          "Comprobar si el elemento animado está en el flujo normal (si lo está, la altura del " +
          "documento cambia al animarse). Si lo está: o se saca del flujo reservándole su tamaño " +
          "final, o se llama a `ScrollTrigger.refresh()` UNA vez por elemento cuando termina de " +
          "crecer —en los callbacks onEnter/onLeave/onEnterBack/onLeaveBack de su propio trigger, " +
          "no en cada tick del scrub—. Se comprueba con `node scripts/qc-layout.mjs --url …`.",
      });

  // --- R13 cromo fijo ---
  // Descubierto montando C3: tres de sus cinco componentes traían su propio `nav{position:fixed}`.
  // Se apilan en la misma esquina y ninguna regla lo veía. 44 de 219 declaran cromo fijo.
  const chrome = slugs.filter((s) => CHROME.has(s));
  if (chrome.length > 1)
    R("R13", `${chrome.length} componentes traen su propia barra fija (nav/header/footer a top:0 o bottom:0)`,
      `Quedarse con UNA como cromo de la página y, en las demás, pasar la barra a ` +
      `\`position:absolute\` dentro del envoltorio de su sección: se va con ella al terminar su ` +
      `pasillo en vez de quedarse encima de todo el documento. Ojo al contraste: la barra que se ` +
      `conserva viajará sobre fondos de otras secciones.`,
      { slugs: chrome.map((s) => `${s}:${CHROME.get(s).join("/")}`) });

  // --- R9 ease-name ---
  const easePairs = [];
  for (const s of slugs) {
    for (const c of sparse(conflicts, s, [])) {
      if (c.kind === "ease-name" && slugs.includes(c.with) && s < c.with)
        easePairs.push([s, c.with, c.reason]);
    }
  }
  if (easePairs.length && !opts.motion_system)
    V("R9", `${easePairs.length} pares registran la misma CustomEase con curvas distintas y no se ha fijado motion system`, { pairs: easePairs.map((p) => p.slice(0, 2)) });
  else if (easePairs.length)
    W("R9", `${easePairs.length} pares comparten nombre de CustomEase; el motion system "${opts.motion_system}" fija la curva`, { pairs: easePairs.map((p) => p.slice(0, 2)) });

  // --- R10 kills-all ---
  const killers = slugs.filter((s) => KILLERS.has(s));
  const scrollUsers = slugs.filter((s) => motion[s].pinned || motion[s].trigger === "scroll");
  for (const k of killers) {
    const victims = scrollUsers.filter((v) => v !== k);
    if (victims.length)
      V("R10", `${k} ejecuta ScrollTrigger.getAll().kill() y destruye los triggers de ${victims.length} componente(s)`, { slugs: [k, ...victims] });
  }

  // --- R11 coherencia de motion system ---
  if (opts.motion_system) {
    const incompatible = slugs.filter((s) => !motion[s].systems.includes(opts.motion_system));
    if (incompatible.length)
      W("R11", `${incompatible.length} componente(s) no son compatibles con "${opts.motion_system}" (otra autoridad del tiempo); conservan su timing nativo`, { slugs: incompatible });
  }

  // --- R12 solo_on_page ---
  const solos = slugs.filter((s) => motion[s].solo_on_page);
  if (solos.length && slugs.length > 1)
    W("R12", `${solos.length} componente(s) marcados solo_on_page`, {
      detail: solos.map((s) => ({ slug: s, reasons: motion[s].solo_reasons })),
    });

  const irreparable = violations.filter((v) => !v.repairable);
  return {
    ok: violations.length === 0,
    // plan_page usa esto: una composición es PLANIFICABLE si no tiene violaciones irreparables.
    plannable: irreparable.length === 0,
    irreparable,
    repairs: violations.filter((v) => v.repairable),
    violations,
    warnings,
    budget: {
      js_gzip: jsGzip, js_gzip_kb: +(jsGzip / 1024).toFixed(1), js_breakdown: libBreakdown,
      assets_bytes: assetBytes, assets_mb: +(assetBytes / 1024 / 1024).toFixed(2),
      // pin_vh = solo los pinneados (lo que se reportaba antes). corridor_vh = el pasillo REAL,
      // que es contra el que se mide el presupuesto.
      pin_vh: pinVh, corridor_vh: totalVh, pinned: pins.length, scrub_pinned: scrubPins.length,
      webgl: gl.length, webgl_full_viewport: glHeroes.length,
    },
  };
}

if (process.argv[1] && process.argv[1].endsWith("check-composition.mjs")) {
  const argv = process.argv.slice(2);
  const sysIdx = argv.indexOf("--system");
  const sys = sysIdx >= 0 ? argv[sysIdx + 1] : undefined;
  const slugs = argv.filter((a, i) => !a.startsWith("--") && !(sysIdx >= 0 && i === sysIdx + 1));
  if (!slugs.length) { console.log("uso: node scripts/check-composition.mjs <slug…> [--system <name>]"); process.exit(0); }
  const r = checkComposition(slugs, { motion_system: sys });
  console.log(
    r.ok ? "✓ composición limpia, sin reparaciones"
      : r.plannable ? `✓ composición planificable — ${r.repairs.length} reparación(es) al montar`
        : `✗ ${r.irreparable.length} violación(es) IRREPARABLE(s)`
  );
  for (const v of r.irreparable) console.log(`  ✗ [${v.rule}] ${v.message}`);
  for (const v of r.repairs) console.log(`  🔧 [${v.rule}] ${v.message}\n       → ${v.repair}`);
  for (const w of r.warnings) console.log(`  ⚠ [${w.rule}] ${w.message}`);
  console.log("presupuesto:", JSON.stringify(r.budget));
  process.exit(r.plannable ? 0 : 1);
}
