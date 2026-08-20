// Puntos 3-5 — Lógica de composición que consumen las tools MCP.
//
//   planPage(brief, reference?)        arquitectura de información: secciones con rol y cometido
//   suggestMechanics(role, need, sys)  mecánicas para UNA sección, o la confesión de que no hay
//   integrationContract(slugs, sys)    orden de init, Lenis único, refresh, presupuesto
//   componentPrompt(slug, sys)         los tres bloques (ver DECISIONS.md D18)
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { checkComposition, BUDGET, RENDER_LOOPS } from "../../scripts/check-composition.mjs";
import { MCP_READS, field, sparse, requireArtifact } from "../../schema/data-contract.mjs";
import { search } from "./search.mjs";
import { RAIZ } from "./raiz.mjs";
import { ROLES, TRATAMIENTOS, ARQUETIPOS, detectarArquetipo, sistemaSugerido, politicaMovimiento } from "./arquitectura.mjs";

const ROOT = RAIZ; // ver mcp/lib/raiz.mjs
const GEN = join(ROOT, "generated/motion");

const req = (f) => requireArtifact(readFileSync, existsSync, join(GEN, f), "mcp/lib/compose");
const systems = req("motion-systems.json");
const sysByName = Object.fromEntries(systems.map((s) => [field(s, "name", "motion-systems.json"), s]));
const evidence = req("composition-evidence.json");
const { capabilities } = req("conflicts.json");

const motion = {};
for (const d of readdirSync(join(ROOT, "components"), { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const p = join(ROOT, "components", d.name, "meta.json");
  if (!existsSync(p)) continue;
  const j = requireArtifact(readFileSync, existsSync, p, `mcp/lib/compose → components/${d.name}`);
  if (j.motion) motion[d.name] = { ...j.motion, description: j.description ?? "" };
}
const ALL = Object.keys(motion);

// Las tools del MCP exigen su contrato al cargar, igual que el motor de reglas. Un bloque `motion`
// al que le falte un campo declarado revienta aquí y no devuelve un resultado a medias.
const REQUIRED_META = [...new Set(
  Object.values(MCP_READS).flat().filter((p) => p.startsWith("meta.motion.")).map((p) => p.slice(12).split(".")[0])
)];
for (const [slug, m] of Object.entries(motion))
  for (const k of REQUIRED_META) field(m, k, `components/${slug}/meta.json → motion`);

// El índice enriquecido es lo que consulta suggestMechanics: mismas facetas que search_components,
// para que un rol y una búsqueda libre hablen del mismo catálogo.
const INDEX = requireArtifact(readFileSync, existsSync, join(ROOT, "src/mcp-index.json"), "mcp/lib/compose (ejecuta `npm run registry`)");

const capsOf = (s) => new Set(sparse(capabilities, s, []).map((c) => c.capability));
const glFull = new Set(evidence.webgl.components.filter((c) => c.fullViewport).map((c) => c.slug));

export function listSystems() { return systems.map(({ _evidence, ...s }) => s); }
export function getSystem(name) {
  const s = sysByName[name];
  if (!s) throw new Error(`motion system desconocido: "${name}". Existen: ${systems.map((x) => x.name).join(", ")}`);
  const members = ALL.filter((sl) => motion[sl].native_system === name);
  return { ...s, members: members.length, member_slugs: members };
}

export function searchComponents({ category, trigger, libs, complexity, motion_system, max_complexity, limit = 50 } = {}) {
  let out = ALL.filter((s) => {
    const m = motion[s];
    if (category && m.category !== category) return false;
    if (trigger && m.trigger !== trigger) return false;
    if (complexity != null && m.complexity !== complexity) return false;
    if (max_complexity != null && m.complexity > max_complexity) return false;
    if (motion_system && !m.systems.includes(motion_system)) return false;
    if (libs?.length && !libs.every((l) => m.libs.some((x) => x.toLowerCase() === l.toLowerCase()))) return false;
    return true;
  });
  out.sort((a, b) => motion[a].complexity - motion[b].complexity || a.localeCompare(b));
  return out.slice(0, limit).map((s) => ({
    slug: s, title: motion[s].title, category: motion[s].category,
    trigger: motion[s].trigger, complexity: motion[s].complexity,
    native_system: motion[s].native_system, pinned: motion[s].pinned,
    viewport_heights: motion[s].viewport_heights, needs_lenis: motion[s].needs_lenis,
    libs: motion[s].libs, capabilities: [...capsOf(s)],
    solo_on_page: motion[s].solo_on_page,
    motion_signature: motion[s].motion_signature,
  }));
}

// ---------------------------------------------------------------- contrato de integración

export function integrationContract(slugs, motion_system, moving_sections) {
  const check = checkComposition(slugs, { motion_system });
  const veil = slugs.find((s) => capsOf(s).has("entry-veil"));
  const owner = slugs.find((s) => capsOf(s).has("page-scroll-owner"));
  const pins = slugs.filter((s) => motion[s].pinned);
  const gl = slugs.filter((s) => glFull.has(s));
  const sys = motion_system ? sysByName[motion_system] : null;

  // Orden de init. Deriva de AUDIT.md §6: el velo primero (ocupa el documento desde t=0), luego
  // el dueño único del scroll, luego lo que mide layout (pins), y refresh AL FINAL — una sola vez.
  const steps = [];
  // Las reparaciones van PRIMERO: son ediciones al código de los componentes que hay que hacer
  // antes de montarlos. Sin ellas el montaje colisiona.
  for (const rep of check.repairs ?? []) {
    steps.push({
      step: steps.length + 1, phase: "repair",
      action: `[${rep.rule}] ${rep.message}. → ${rep.repair}`,
      slugs: rep.slugs,
      evidence: "violación reparable en el montaje; ver COMPOSITION_RULES.md",
    });
  }
  // Lenis va SIEMPRE, reclame o no el scroll algún componente. Antes esto decía "ningún componente
  // reclama el scroll: no crear Lenis", y era una lectura estrecha: el scroll suave no es un
  // requisito de un componente, es una decisión de la página. Aporta valor en casi cualquier sitio
  // y es una de las cosas que más separan una página cuidada de una hecha a la ligera. Ver D29.
  steps.push({
    step: steps.length + 1, phase: "lenis",
    action: owner
      ? `Crear UNA sola instancia de Lenis y exponerla. El componente "${owner}" trae la suya: elimínala de su script y pásale la instancia compartida.`
      : "Crear UNA sola instancia de Lenis. Ningún componente la reclama, pero el scroll suave va " +
        "en todas las páginas: es decisión de página, no requisito de componente. Y hay que " +
        "parchear los anclajes `a[href^=\"#\"]`, que con Lenis dejan de suavizarse solos.",
    code:
      "const lenis = new Lenis({ lerp: 0.1 });\n" +
      "gsap.ticker.add((t) => lenis.raf(t * 1000));\n" +
      "gsap.ticker.lagSmoothing(0);\n" +
      "lenis.on('scroll', ScrollTrigger.update);\n" +
      "// anclajes: con Lenis, un href=\"#x\" nativo no se suaviza\n" +
      "document.querySelectorAll('a[href^=\"#\"]').forEach((a) => a.addEventListener('click', (e) => {\n" +
      "  const d = document.querySelector(a.getAttribute('href'));\n" +
      "  if (!d) return; e.preventDefault(); lenis.scrollTo(d);\n" +
      "}));\n" +
      "// y no se crea con prefers-reduced-motion: reduce",
    evidence: `${evidence.capabilities["page-scroll-owner"].holders} de 219 componentes instancian su propio Lenis; todos apuntan a window (AUDIT.md §6.1-G)`,
  });
  if (sys && Object.keys(field(sys, "custom_ease_defs", `motion-systems.json → ${sys.name}`)).length) {
    steps.push({
      step: steps.length + 1, phase: "eases",
      action: `Registrar las CustomEase del motion system ANTES de cualquier componente. Los componentes que las usan deben NO volver a registrarlas.`,
      code: Object.entries(sys.custom_ease_defs).map(([n, v]) => `CustomEase.create("${n}", "${v.curve}");`).join("\n"),
      evidence: "22 componentes registran 'hop' con 13 curvas distintas; la última evaluada gana en silencio (AUDIT.md §6.1-C)",
    });
  }
  if (veil) {
    steps.push({
      step: steps.length + 1, phase: "entry",
      action: `Inicializar "${veil}" (velo de entrada). TODO lo demás va en su onComplete: es el único que puede correr en DOMContentLoaded.`,
      evidence: "128 de 219 componentes se atan a DOMContentLoaded sin comprobar readyState (AUDIT.md §6.1-F)",
    });
    if (pins.length) {
      steps.push({
        step: steps.length + 1, phase: "entry-lock",
        action:
          `Bloquear el scroll mientras el velo esté en pantalla y soltarlo en su onComplete. Con ` +
          `${pins.length} pin(s), ScrollTrigger insertará el relleno de pinSpacing al montarlos: si ` +
          `eso ocurre con el documento ya desplazado, el contenido salta bajo el cursor.`,
        code: "lenis.stop();\ndocument.documentElement.style.overflow = 'hidden';\n// en onComplete: lenis.start(); document.documentElement.style.overflow = '';",
        evidence: "verificado montando la composición del brief de portfolio (C3); ver examples/portfolio-scrub-lagged/",
      });
    }
    steps.push({
      step: steps.length + 1, phase: "entry-cost",
      action:
        `Coste de este paso: nada empieza a cargar hasta que el velo termina. Si el velo dura N ` +
        `segundos, el primer píxel de contenido llega a N + lo que tarden los assets. Si eso no es ` +
        `aceptable, monta los componentes DETRÁS del velo (que es opaco) y deja para su onComplete ` +
        `solo el arranque del movimiento. Esta variante NO está verificada.`,
      evidence: "medido en C3: velo de 8.0s → estado ready a 9.4s con 2.31MB de assets",
    });
  }
  steps.push({
    step: steps.length + 1, phase: "components",
    action: `Inicializar los ${slugs.length - (veil ? 1 : 0)} componentes restantes en este orden: ${slugs.filter((s) => s !== veil).join(" → ")}. Cada uno acotado a su elemento raíz, nunca con document.querySelector.`,
    evidence: "159 componentes consultan el documento entero; 134 comparten selector raíz con otro (AUDIT.md §6.1-E)",
  });
  if (pins.length) {
    // Un componente puede crear su ScrollTrigger dentro de un callback asíncrono (carga de
    // imágenes con `new Image()`, que además no aparecen en document.images). Esperar solo a
    // document.images deja el refresh corriendo antes de que ese trigger exista.
    const asyncTriggers = slugs.filter((s) => motion[s].assets_required.count > 0 && motion[s].trigger === "scroll");
    steps.push({
      step: steps.length + 1, phase: "refresh",
      action:
        `Llamar ScrollTrigger.refresh() UNA sola vez, después de que todos los pins existan y de ` +
        `que las imágenes hayan cargado. Ningún componente debe llamarlo por su cuenta. ` +
        (asyncTriggers.length
          ? `Antes del refresh, esperar a los componentes que crean su ScrollTrigger dentro de un ` +
            `callback asíncrono: haz que su init() devuelva una promesa y await a todas. Candidatos ` +
            `en esta página: ${asyncTriggers.join(", ")}.`
          : ""),
      code:
        (asyncTriggers.length ? "await Promise.all(mounted.map(m => m.ready ?? Promise.resolve()));\n" : "") +
        "await Promise.all([...document.images].filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; })));\nScrollTrigger.refresh();",
      slugs: asyncTriggers,
      evidence: `${pins.length} pin(s) en esta página; solo 6 de 77 componentes con ScrollTrigger llaman refresh, y las distancias se hornean al crearse (AUDIT.md §6.1-G)`,
    });
  }
  // Solo se gatean los que tienen un bucle rAF que ADEMÁS pinta. Un rAF que solo alimenta a Lenis
  // no se toca: pararlo congelaría el scroll de la página entera (hallazgo de C3).
  const loops = slugs.filter((s) => RENDER_LOOPS.has(s));
  if (loops.length) {
    steps.push({
      step: steps.length + 1, phase: "render-loops",
      action:
        `${loops.map((s) => `"${s}" (bucle \`${RENDER_LOOPS.get(s)}\`)`).join(" y ")} ` +
        `${loops.length > 1 ? "corren bucles de pintado que nunca se pausan" : "corre un bucle de pintado que nunca se pausa"}. ` +
        `Envolver cada uno en un IntersectionObserver que cancele su rAF al salir del viewport, y ` +
        `llamar renderer.dispose() al desmontar los que sean WebGL.`,
      slugs: loops,
      evidence:
        `${evidence.render_loops.count} de 219 componentes tienen bucle de pintado perpetuo ` +
        `(${evidence.render_loops.webgl} WebGL, ${evidence.render_loops.non_webgl} sobre canvas 2D o transform); ` +
        `ninguno lo limita (AUDIT.md §6.1-H)`,
    });
  }
  const glNoLoop = gl.filter((s) => !RENDER_LOOPS.has(s));
  if (glNoLoop.length) {
    steps.push({
      step: steps.length + 1, phase: "webgl-nogate",
      action: `NO gatear ${glNoLoop.map((s) => `"${s}"`).join(", ")}: pinta dentro del callback del scroll, no en un bucle. Si además usa rAF, ese rAF alimenta a Lenis y pararlo congela el scroll de toda la página.`,
      slugs: glNoLoop,
      evidence: "verificado montando la composición del brief de portfolio (C3)",
    });
  }

  // Auditoría de cobertura. Es opcional porque el contrato no conoce el plan, pero cuando se le
  // pasa la lista de secciones que deben moverse hace la única cuenta que importa al terminar:
  // cuántas de ellas se han quedado sin nada. Ver plan_page → motion_coverage.
  const movibles = Array.isArray(moving_sections) ? moving_sections.length : (moving_sections ?? null);
  const adoptadas = slugs.length;
  const cobertura = movibles == null ? null : (() => {
    const ratio = movibles ? adoptadas / movibles : 1;
    return {
      moving_sections: movibles,
      adopted_mechanics: adoptadas,
      ratio: Number(ratio.toFixed(2)),
      // Menos de la mitad no es contención: es que se han repartido cuatro mecánicas por una página
      // de trece secciones y el resto ha quedado en blanco. Ver examples/grieta/README.md, donde
      // ese mismo recuento obligó a rehacer la capa de movimiento entera.
      verdict: ratio >= 0.7 ? "suficiente" : ratio >= 0.45 ? "justo" : "insuficiente",
      note: ratio >= 0.7
        ? `${adoptadas} mecánicas para ${movibles} secciones que deben moverse. Las que no adopten ` +
          `componente tienen que llevar su receta escrita desde los tokens, no quedarse quietas.`
        : `SOLO ${adoptadas} mecánicas para ${movibles} secciones que deben moverse. Vuelve a ` +
          `suggest_mechanics para las que faltan, pasando en \`avoid\` lo que ya has adoptado: hay ` +
          `más de cien candidatos por rol y están empatados, así que no adoptar más es una decisión ` +
          `tuya, no una limitación del catálogo. Repetir una mecánica entre páginas no molesta a ` +
          `nadie; una sección que no hace nada, sí.`,
    };
  })();

  return {
    slugs, motion_system: motion_system ?? null,
    // Un montaje es válido si no queda ninguna colisión IRREPARABLE. Las reparables se resuelven
    // con los pasos `repair` de init_order, que son parte del contrato.
    valid: check.plannable,
    motion_coverage: cobertura,
    clean_without_repairs: check.ok,
    violations: check.irreparable,
    repairs: check.repairs,
    warnings: check.warnings,
    budget: check.budget,
    budget_limits: BUDGET,
    init_order: steps,
    single_lenis: owner ?? null,
    entry_veil: veil ?? null,
    scroll_trigger_refresh: pins.length > 0,
    // Lo último del contrato, y lo que más veces se ha saltado: mirar la página. Los defectos que
    // han llegado a producción desde aquí no violaban ninguna regla ni escribían en consola.
    verificacion_visual: {
      obligatoria: true,
      por_que:
        "Ninguno de los defectos que han llegado a producción en este repositorio se veía leyendo: " +
        "un pin que arrancaba 1 500px antes de tiempo por culpa de una sección que crecía encima " +
        "(R18), ocho imágenes con `loading=\"lazy\"` esperadas con await que nunca resuelven y " +
        "dejaban la página sin capa de movimiento, y rutas de imagen escritas como cadena en JS " +
        "que el empaquetador no reescribe. Cero errores de consola en los tres casos.",
      que_mirar: [
        "algo pintado por encima de un texto que no sea de su misma sección",
        "un bloque que ya se ve entero antes de que le toque, se apaga y vuelve — es un scrub que nunca pintó su estado de reposo",
        "la altura del documento a lo largo del recorrido: si crece, todo pin por debajo está mal colocado (R18)",
        "imágenes con naturalWidth 0 y peticiones con código de error",
        "una pantalla entera sin nada pintado en medio de un pasillo pinneado",
      ],
      en_este_repositorio: "node scripts/qc-layout.mjs --url <url> [--out dir]",
    },
  };
}

// ---------------------------------------------------------------- plan_page

// Vocabulario de briefs → intención. Deliberadamente pequeño y explícito: no se infiere movimiento
// de la referencia (punto 5), solo dirección de arte y elección de sistema.
// ---------------------------------------------------------------- plan_page
//
// Lo que había aquí antes: BRIEF_SIGNALS (seis expresiones regulares → cinco huecos fijos),
// SLOT_QUERY y pickForSlot (un argmax por hueco sobre los 219 componentes). Se ha quitado entero.
//
// Medía cinco secciones de techo y devolvía los mismos cinco slugs para briefs distintos, porque
// arrancaba de las mecánicas de animación y deducía la página desde ellas. El orden correcto es al
// revés: primero la arquitectura de información, después —y sólo para las secciones que se lo
// ganen— las mecánicas. Ver mcp/lib/arquitectura.mjs y DECISIONS.md D27.
//
// Los desempates que vivían en pickForSlot (D20, D21: preferir lo pinneado, preferir complejidad
// media) no se han perdido: ahora ordenan dentro de un rol en suggestMechanics.

export function planPage(brief, reference, opciones = {}) {
  const deteccion = opciones.archetype && ARQUETIPOS[opciones.archetype]
    ? { archetype: opciones.archetype, confidence: "impuesta", alternatives: [] }
    : detectarArquetipo(brief);

  const arq = ARQUETIPOS[deteccion.archetype];
  const system = reference?.motion_system_hint && sysByName[reference.motion_system_hint]
    ? reference.motion_system_hint
    : sistemaSugerido(deteccion.archetype);

  const sections = arq.sections.map((s, i) => {
    const rol = ROLES[s.role] ?? {};
    return {
      order: i + 1,
      id: s.id,
      role: s.role,
      role_label: rol.label ?? s.role,
      purpose: s.purpose,
      content: s.content,
      ...politicaMovimiento(s.role),
      catalog_may_cover: !!rol.catalogo,
    };
  });

  const sinCatalogo = [...new Set(sections.filter((s) => !s.catalog_may_cover).map((s) => s.role))];

  return {
    brief,
    // EL AVISO VA PRIMERO, ANTES QUE NADA. Cuando no casa ninguna expresión, `archetype` es
    // "agency" por descarte y la lista de secciones que sigue es la de una consultora. Ese dato
    // ya viajaba en `archetype_confidence`, pero como un campo más entre treinta: en un encargo
    // de hamburguesería medido, el consumidor se quedó con las catorce secciones —casos de
    // estudio, principios, equipo, contratación— y no lo miró. Aquí es lo primero que se lee.
    aviso: deteccion.fallback
      ? "NO HE RECONOCIDO EL TIPO DE PÁGINA. Ninguna expresión encajó con el encargo, así que " +
        "las secciones de abajo son la plantilla de AGENCIA por descarte, no una decisión. " +
        "Antes de seguir: mira `archetype_alternatives`, elige el que corresponda y vuelve a " +
        "llamar con `archetype`. Si de verdad no es ninguno, reescribe la lista de secciones a " +
        "mano — pero no la uses tal cual."
      : null,
    archetype: deteccion.archetype,
    archetype_label: arq.label,
    archetype_confidence: deteccion.confidence,
    archetype_fallback: !!deteccion.fallback,
    archetype_alternatives: deteccion.alternatives,
    archetype_note:
      deteccion.confidence === "ninguna"
        ? "El brief no dio señal de ningún arquetipo; se ha usado el más genérico. Revisa la lista " +
          "de secciones antes de construir, o vuelve a llamar pasando `archetype` a mano."
        : "La detección por expresión regular es tosca a propósito. Equivocarse aquí te da una lista " +
          "de secciones que puedes editar, no un componente absurdo incrustado en la página. " +
          "Añade, quita y reordena secciones: esto es un punto de partida, no un contrato.",
    motion_system: system,
    system_tokens: getSystem(system),
    section_count: sections.length,
    sections,
    motion_policy: {
      rule:
        "El movimiento es opt-in POR SECCIÓN, pero el valor por defecto es QUE SE MUEVA. " +
        "`earned` = esta sección justifica un momento orquestado. `optional` = adopta una mecánica " +
        "del catálogo, y las hay para casi todo. `still` = QUIETO AL LEER, que no es lo mismo que " +
        "inmóvil: el bloque puede tener UNA entrada, lo que no puede es escalonar sus filas ni " +
        "atarse al scroll mientras se consulta.\n" +
        "OJO CON EL EXCESO CONTRARIO, que es el que se comete: `optional` no significa 'escríbelo " +
        "tú sobrio'. Significa adopta. El catálogo son animaciones complejas ya depuradas, y su " +
        "valor está justamente en las que costaría muchas iteraciones reescribir. Una página que " +
        "sólo usa fundidos y desplazamientos de 20 px no necesitaba este MCP.\n" +
        "Y NO REPARTAS EL MOVIMIENTO A CUENTAGOTAS. Una página de agencia con tres secciones " +
        "animadas y nueve quietas no se lee como contención: se lee como una página a medio " +
        "terminar. Pasarse es un defecto menor y recuperable; quedarse corto se nota en la primera " +
        "pantalla que no hace nada.",
      earned: sections.filter((s) => s.motion === "earned").map((s) => s.id),
      still: sections.filter((s) => s.motion === "still").map((s) => s.id),
    },
    // La cobertura es el número que hay que mirar al terminar. Se devuelve calculada para que no
    // haya que estimarla: cada sección de esta lista acaba con una mecánica adoptada o con una
    // receta escrita, y las que se queden sin nada hay que poder nombrarlas.
    motion_coverage: (() => {
      const conMovimiento = sections.filter((s) => s.motion !== "still");
      const adoptables = conMovimiento.filter((s) => s.catalog_may_cover);
      const aMano = conMovimiento.filter((s) => !s.catalog_may_cover);
      return {
        sections_total: sections.length,
        must_move: conMovimiento.map((s) => s.id),
        adopt_from_catalog: adoptables.map((s) => s.id),
        write_from_recipe: aMano.map((s) => s.id),
        quiet_while_read: sections.filter((s) => s.motion === "still").map((s) => s.id),
        target:
          `${conMovimiento.length} de ${sections.length} secciones tienen que moverse: ` +
          `${adoptables.length} adoptando una mecánica del catálogo y ${aMano.length} escritas ` +
          `desde la receta que trae suggest_mechanics para su rol. Que una sección de esta lista ` +
          `se quede quieta es un defecto de la página, no una decisión de estilo — y si decides ` +
          `dejarla quieta de verdad, dilo y di por qué.`,
        antipatron:
          "El fallo que se repite: el agente adopta cuatro o cinco mecánicas, las reparte por las " +
          "secciones vistosas y deja el resto sin nada porque 'ya hay bastante movimiento'. No lo " +
          "hay. Las páginas que se toman de referencia mueven ALGO en todas las secciones, y lo " +
          "que las salva del ruido no es la escasez, es que todo se mueve con el mismo idioma — " +
          "que es exactamente lo que garantiza el motion system.",
        no_repitas_slug:
          "Una misma mecánica no debe aparecer dos veces en la MISMA página. Pero si el nº1 de una " +
          "sección ya lo usaste en otra, la respuesta es el nº2 —hay más de cien candidatos por " +
          "rol y están empatados—, NUNCA dejar la sección quieta. Pasa lo ya usado en `avoid` y " +
          "vuelve a preguntar.",
      };
    })(),
    // Los tratamientos NO son secciones: no ocupan hueco en `sections` ni cuentan para
    // `motion_coverage`. Son la familia de mecánicas que el planificador no podía pedir porque
    // todo el modelo asumía que una mecánica llena un hueco de la lista.
    page_treatments: {
      note:
        "Se aplican a la PÁGINA o ENTRE secciones, no dentro de una. No suman a motion_coverage. " +
        "Pide candidatos con suggest_page_treatments({ kind }).",
      kinds: Object.entries(TRATAMIENTOS).map(([kind, t]) => ({
        kind,
        label: t.label,
        default: t.por_defecto,
        when: t.cuando,
        catalog_has_it: !!t.catalogo,
      })),
      always: Object.entries(TRATAMIENTOS).filter(([, t]) => t.por_defecto).map(([k]) => k),
    },
    catalog_gaps: {
      roles: sinCatalogo,
      note: sinCatalogo.length
        ? "Estos roles NO tienen nada en el catálogo: ni categoría ni useCase entre los 219 " +
          "componentes sirve. No los busques con search_components — devolverá el menos malo con " +
          "aire de respuesta. Escríbelos desde los tokens del motion system."
        : null,
    },
    art_direction: reference
      ? {
          source: reference.url ?? reference.image ?? null,
          note:
            "La referencia aporta SOLO dirección de arte estática (paleta, escala tipográfica, densidad) " +
            "y la elección del motion system más cercano de los 8. El movimiento NO se deriva de la " +
            "referencia: sale de los tokens del sistema, que están medidos del código real. " +
            "GUARDARRAÍL DE PALETA (design system 2026, docs/redesign-2026/DESIGN-SYSTEM.md): un " +
            "neutro dominante de alto contraste + UN acento saturado, máximo 2 familias cromáticas. " +
            "VETADO el tono-sobre-tono cálido (crema + tan + marrón, hue 20-45 con saturación media): " +
            "si la referencia lo trae, sustitúyelo por una de las paletas P1-P10 del documento. El " +
            "crema aceptable es hueso frío-neutro con tinta negra pura y acento de otra familia. " +
            "Tipografías libres: Space Grotesk / Inter / Hanken Grotesk / Anton / Space Mono / " +
            "Playfair. Texto siempre en inglés, poco y con intención; glassmorphism y blur " +
            "izquierda→derecha en texto son motivos de la casa.",
          palette: reference.palette ?? null,
          type_scale: reference.type_scale ?? null,
          density: reference.density ?? null,
        }
      : null,
    next:
      "1) Ajusta la lista de secciones al encargo real. 2) Para cada sección con motion != 'still', " +
      "llama suggest_mechanics({ role, need, avoid }) con lo que esa sección tiene que hacer, y " +
      "ADOPTA un candidato: escribir la animación a mano sólo es la respuesta correcta para los " +
      "roles de catalog_gaps, y para ésos la receta viene dada. 3) get_integration_contract con " +
      "todos los slugs a la vez, pasando `moving_sections` para que te audite la cobertura. 4) " +
      "get_component_prompt por cada uno. Re-viste la mecánica —imágenes, textos, paleta, " +
      "tipografía, número de elementos— y conserva el motor. 5) plan_imagery con esta misma lista " +
      "de secciones ANTES de generar una sola imagen: es donde se decide qué modelo hace cada toma " +
      "y cómo se escribe un prompt que sea de esta sección y no del sector. 6) Con la página " +
      "montada, MÍRALA con un navegador de verdad de arriba abajo: los tres defectos que han " +
      "llegado a producción en este repositorio —un pin que arrancaba 1 500px antes de tiempo, " +
      "ocho imágenes diferidas que colgaban el montaje y un lote de rutas que el empaquetador no " +
      "reescribe— no dieron ni un error de consola. En este repositorio: " +
      "`node scripts/qc-layout.mjs --url <url>`.",
  };
}

// ---------------------------------------------------------------- suggest_mechanics
//
// El veredicto de verdad vive aquí y no en la búsqueda libre, porque el conocimiento que discrimina
// es curado: qué facetas del catálogo corresponden a cada rol. La cobertura léxica de search.mjs
// sólo es fiable hacia abajo (ver el comentario largo allí), así que aquí se usa para ordenar y
// para avisar, nunca para decidir sola.

// Dos páginas seguidas adoptaron los mismos cuatro componentes. La causa medida NO era el charco
// —los 219 son alcanzables y `context` ofrece 154 candidatos— sino que:
//
//   · la separación entre el nº1 y el nº5 es del 30 % en los roles anchos: son EMPATES, no un
//     ranking, y elegir siempre el primero es arbitrario;
//   · el orden es inestable a la redacción (cuatro formas de pedir lo mismo dan cuatro nº1
//     distintos), así que repetir la misma cadena `need` garantiza repetir el componente.
//
// La herramienta invitaba a hacer `candidates[0]`. Ahora marca la banda de empate y admite `avoid`
// para excluir lo ya usado en otra página. Ver DECISIONS.md D30.
const UMBRAL_EMPATE = 0.7;

export function suggestMechanics(role, need = "", motion_system, limit = 5, avoid = [], adopted = []) {
  const rol = ROLES[role];
  if (!rol) {
    return {
      role, verdict: "unknown-role",
      known_roles: Object.keys(ROLES),
      guidance: `"${role}" no es un rol conocido. Usa uno de los de known_roles.`,
    };
  }

  const base = {
    role,
    role_label: rol.label,
    need: need || null,
    ...politicaMovimiento(role),
  };

  // Hueco declarado: se miró el catálogo entero y no hay. Decirlo es el punto de esta herramienta.
  if (!rol.catalogo) {
    return {
      ...base,
      verdict: "none",
      catalog_has_role: false,
      candidates: [],
      guidance:
        `El catálogo no cubre el rol "${role}". No es que la consulta esté mal escrita: no hay ` +
        `ninguna categoría ni ningún useCase entre los 219 componentes para esto. Si buscas igual ` +
        `con search_components te devolverá el menos malo con aire de respuesta. ` +
        `PERO "no hay componente" NO ES "esta sección se queda quieta", y ése es el error que se ` +
        `comete: los roles huecos son entre tres y cinco secciones de una página de trece, y ` +
        `dejarlas todas paradas es justo la sensación de que a la página le falta algo. ` +
        `Tienes la receta en \`hand_written_recipe\`: escríbela con los tokens de ` +
        `"${motion_system ?? "el sistema de la página"}", que están abajo.`,
      motion_system_tokens: motion_system ? getSystem(motion_system) : null,
    };
  }

  // Filtro duro por las facetas del rol; la búsqueda libre sólo ordena dentro de ese charco.
  // `tags` se admite además de categoría y useCase porque hay roles cuyo charco correcto es UNO
  // o dos componentes concretos, y no hay categoría que los aísle. `testimonial` es el caso:
  // ampliarlo a `cards` o `gallery` devolvería tarjetas genéricas con aire de respuesta, que es
  // justo lo que esta herramienta existe para no hacer.
  const { categories = [], useCases = [], tags = [] } = rol.catalogo;
  const excluidos = new Set(avoid);
  const charco = INDEX.components.filter(
    (c) => !excluidos.has(c.slug) && (
      categories.includes(c.category) ||
      (c.useCase ?? []).some((u) => useCases.includes(u)) ||
      (c.tags ?? []).some((g) => tags.includes(g))
    )
  );

  const ordenados = need.trim()
    ? search(charco, { query: need, limit: limit * 3 })
    : charco.slice(0, limit * 3).map((c) => ({ slug: c.slug, title: c.title, category: c.category, useCase: c.useCase, useWhen: c.useWhen, level: c.level, score: 0, lexical_coverage: 0, lexical: "low", why: [] }));

  // Desempates heredados de pickForSlot (D20/D21): a igualdad léxica, lo que pinnea y narra es la
  // firma de esta biblioteca, y la complejidad media es su cuerpo.
  // lint-artefacto-ok: el charco sale del índice enriquecido (219 entradas) y el bloque `motion`
  // vive en components/<slug>/meta.json. Un componente indexado sin bloque motion es posible, y la
  // respuesta correcta es devolver sus campos de movimiento a null, no reventar la sugerencia.
  // Compatibilidad con lo YA ADOPTADO en esta página. Sin esto, la herramienta que sugiere sección
  // a sección es ciega a la página que se está montando: elige el mejor candidato de cada rol por
  // separado y el choque no aparece hasta get_integration_contract, cuando ya has escrito código.
  //
  // El caso que lo destapó: el rol `cta` incluye la categoría `footer` en su charco, así que `cta`
  // y `footer` adoptaban los dos un componente de pie y R6 invalidaba la página («categoría footer
  // repetida; no es repetible»). Salió en cinco de seis briefs en cuanto se arregló la cobertura
  // (D31): antes no se veía porque la mitad de las secciones se quedaban sin adoptar nada.
  const yaPuestos = adopted.filter((s) => motion[s]);
  const compone = (slug) => {
    if (!yaPuestos.length) return { ok: true, motivo: null };
    try {
      const r = checkComposition([...yaPuestos, slug], { motion_system });
      return r.plannable
        ? { ok: true, motivo: null }
        : { ok: false, motivo: r.irreparable.map((v) => `[${v.rule}] ${v.message}`).join(" · ") };
    } catch { return { ok: true, motivo: null }; }
  };

  // lint-artefacto-ok: el charco sale del índice enriquecido (219 entradas) y el bloque `motion`
  // vive en components/<slug>/meta.json. Un componente indexado sin bloque motion es posible, y la
  // respuesta correcta es devolver sus campos de movimiento a null, no reventar la sugerencia.
  const m = (s) => motion[s] ?? {};
  const candidatos = ordenados
    .map((r) => {
      const mm = m(r.slug);
      const c = compone(r.slug);
      return {
        ...r,
        native_system: mm.native_system ?? null,
        compatible_with_page_system: motion_system ? !!mm.systems?.includes(motion_system) : null,
        pinned: mm.pinned ?? null,
        complexity: mm.complexity ?? null,
        composes_with_adopted: c.ok,
        collision: c.motivo ?? undefined,
      };
    })
    .sort((a, b) => {
      // Lo que NO compone con lo ya adoptado va al final, pase lo que pase con la puntuación: un
      // candidato que invalida la página no es un candidato mejor ni peor, es uno que no sirve.
      if (a.composes_with_adopted !== b.composes_with_adopted) return a.composes_with_adopted ? -1 : 1;
      // El ajuste con lo que pide la sección manda. La compatibilidad con el sistema de la página
      // es un DESEMPATE, no la clave principal: ordenarla primero hundía al mejor candidato por ser
      // de tiempo nativo scrub, que es justo lo que R11 permite conservar. Es lo que pasaba con
      // scroll-powered-svg-stroke-2 en una página reveal-on-enter.
      if (b.score !== a.score) return b.score - a.score;
      if (motion_system) {
        const ca = a.compatible_with_page_system ? 0 : 1, cb = b.compatible_with_page_system ? 0 : 1;
        if (ca !== cb) return ca - cb;
      }
      const pa = a.pinned ? 0 : 1, pb = b.pinned ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return Math.abs((a.complexity ?? 3) - 3) - Math.abs((b.complexity ?? 3) - 3);
    })
    .slice(0, limit);

  // Banda de empate: todo lo que queda por encima del 70 % de la mejor puntuación está,
  // estadísticamente, igual de bien. Marcarlo es lo que evita el `candidates[0]` automático. Se
  // mide sólo entre los que componen: un candidato que invalida la página no empata con nadie.
  const tope = candidatos.find((c) => c.composes_with_adopted)?.score ?? 0;
  for (const c of candidatos) c.tied = c.composes_with_adopted && tope > 0 && c.score >= tope * UMBRAL_EMPATE;
  const empatados = candidatos.filter((c) => c.tied).length;
  const chocan = candidatos.filter((c) => !c.composes_with_adopted).length;

  const mejor = candidatos.find((c) => c.composes_with_adopted) ?? candidatos[0];
  const cobertura = mejor?.lexical_coverage ?? 0;

  // Si el rol tiene charco, el veredicto es ADOPTAR. La cobertura léxica baja significa que el
  // orden es menos fiable, NO que haya que escribir la sección a mano: para eso está el `need`,
  // para ordenar, no para vetar. Ver DECISIONS.md D28.
  const verdict = !mejor ? "none" : "adopt";
  const ranking_confidence = cobertura >= 0.35 ? "alta" : "baja";

  return {
    ...base,
    verdict,
    ranking_confidence,
    catalog_has_role: true,
    pool_size: charco.length,
    tied_count: empatados,
    filtered_by: { categories, useCases },
    excluded: avoid.length ? avoid : undefined,
    adopted_so_far: yaPuestos.length ? yaPuestos : undefined,
    colliding_count: chocan || undefined,
    collision_note: chocan
      ? `${chocan} de los ${candidatos.length} candidatos INVALIDAN la página junto con lo que ya ` +
        `has adoptado (llevan \`composes_with_adopted: false\` y el motivo en \`collision\`). Van al ` +
        `final de la lista a propósito. Coge el primero que componga: seguir el orden de puntuación ` +
        `a ciegas te deja el choque para get_integration_contract, cuando ya has escrito el código.`
      : undefined,
    candidates: candidatos,
    diversity_warning: empatados > 1
      ? `Los ${empatados} primeros están EMPATADOS (dentro del 70 % de la mejor puntuación). ` +
        `Este orden no significa que el primero sea mejor: elige por su \`useWhen\`, no por la ` +
        `posición. Y ojo — la puntuación es inestable a la redacción: pedir lo mismo con otras ` +
        `palabras cambia el nº1, así que reutilizar la misma cadena \`need\` entre páginas ` +
        `GARANTIZA repetir componente. Si estás componiendo una página nueva, pasa en \`avoid\` ` +
        `lo que ya usaste en otra.`
      : undefined,
    // `avoid` es para no repetirse, no para animar menos. La confusión entre las dos cosas es la
    // que deja secciones quietas: se excluye lo ya usado, el nº1 desaparece y en vez de tomar el
    // nº2 se abandona la sección.
    exclusion_note:
      `Este charco tiene ${charco.length} componentes${avoid.length ? ` (ya se han excluido ${avoid.length})` : ""}. ` +
      `Excluir NUNCA deja una sección sin candidato: si has descartado el nº1 por repetido, coge ` +
      `el nº2 — están empatados. Dejar la sección quieta porque "ya hay bastante movimiento en la ` +
      `página" es el defecto más común de este flujo, y se nota más que repetir una mecánica.`,
    guidance:
      `${charco.length} componentes del catálogo cubren este rol. ADOPTA UNO. Estos componentes ` +
      `son animaciones complejas ya resueltas y depuradas: reescribirlas a mano cuesta muchas ` +
      `iteraciones y sale peor. El trabajo es RE-VESTIRLAS —imágenes, textos, paleta, tipografía, ` +
      `número de elementos— conservando la mecánica. Repetir una mecánica entre páginas no es un ` +
      `problema si encaja; reimplementarla sí lo es.` +
      (ranking_confidence === "baja"
        ? ` La cobertura léxica del primero es baja (${cobertura}), así que este orden es poco ` +
          `fiable: mira los ${Math.min(candidatos.length, 5)} y elige por su \`useWhen\`, no por ` +
          `la posición.`
        : ` Lee el \`useWhen\` y la \`category\` antes de decidir: el nombre de un componente no es ` +
          `su mecánica.`) +
      ` Descarta un candidato sólo si su MECÁNICA no sirve para esta sección, nunca por gusto ` +
      `estético: el estilo se cambia, la mecánica es lo que estás comprando.`,
  };
}

// ---------------------------------------------------------------- get_component_prompt

// ---------------------------------------------------------------- suggest_page_treatments
//
// El gemelo de suggest_mechanics para lo que NO ocupa una sección. Misma maquinaria —charco
// filtrado por facetas curadas, búsqueda libre sólo para ordenar dentro— y la misma honestidad:
// sabe contestar que un tratamiento no es un componente (`scroll-suave` es una decisión, no algo
// que se adopte) y sabe contestar que no hay nada.
export function suggestTreatments(kind, need = "", motion_system, limit = 5, avoid = []) {
  const t = TRATAMIENTOS[kind];
  if (!t) {
    return {
      kind, verdict: "unknown-kind",
      known_kinds: Object.keys(TRATAMIENTOS),
      guidance: `"${kind}" no es un tratamiento conocido. Usa uno de known_kinds.`,
    };
  }

  const base = { kind, label: t.label, when: t.cuando, note: t.nota, default: t.por_defecto };

  // Hay tratamientos que no son componentes. Devolver candidatos aquí sería mentir.
  if (!t.catalogo) {
    return {
      ...base, verdict: "not-a-component", candidates: [],
      guidance:
        `"${kind}" no se adopta del catálogo: es una decisión de página que se implementa a mano. ` +
        `Léete \`note\` y aplícala. No busques componente para esto.`,
      motion_system_tokens: motion_system ? getSystem(motion_system) : null,
    };
  }

  const { categories = [], useCases = [], tags = [] } = t.catalogo;
  const excluidos = new Set(avoid);
  const charco = INDEX.components.filter(
    (c) => !excluidos.has(c.slug) && (
      categories.includes(c.category) ||
      (c.useCase ?? []).some((u) => useCases.includes(u)) ||
      (c.tags ?? []).some((g) => tags.includes(g))
    ),
  );

  if (!charco.length) {
    return {
      ...base, verdict: "none", candidates: [],
      guidance: `El catálogo no tiene nada para "${kind}". Escríbelo con los tokens del sistema.`,
      motion_system_tokens: motion_system ? getSystem(motion_system) : null,
    };
  }

  const ordenados = need.trim()
    ? search(charco, { query: need, limit: limit * 3 })
    : charco.map((c) => ({ slug: c.slug, title: c.title, category: c.category, useCase: c.useCase, useWhen: c.useWhen, score: 0, lexical_coverage: 0, why: [] }));

  return {
    ...base,
    verdict: "ok",
    candidates: ordenados.slice(0, limit).map((c) => ({
      slug: c.slug, title: c.title, category: c.category, useCase: c.useCase, useWhen: c.useWhen,
      motion: motion[c.slug] ? {
        trigger: motion[c.slug].trigger, complexity: motion[c.slug].complexity,
        needs_lenis: motion[c.slug].needs_lenis, native_system: motion[c.slug].native_system,
      } : null,
    })),
    guidance:
      "Un tratamiento NO ocupa un hueco de `sections` y NO cuenta para `motion_coverage`: se " +
      "suma a lo que ya hay. Pásalo igualmente a get_integration_contract junto con los slugs " +
      "de las secciones, porque compite por las mismas capacidades (dueño del scroll, altura del " +
      "documento) que cualquier otro componente.",
  };
}

export function componentPrompt(slug, motion_system) {
  const p = join(ROOT, "components", slug, "prompt.md");
  if (!existsSync(p)) throw new Error(`no existe prompt para "${slug}"`);
  const m = motion[slug];
  const name = motion_system ?? m.native_system;
  const sys = sysByName[name];
  if (!sys) throw new Error(`motion system desconocido: "${name}"`);

  return {
    slug,
    // (a) el prompt standalone íntegro, sin tocar
    prompt: readFileSync(p, "utf8"),
    prompt_is_verbatim: true,
    // (b) los tokens del motion system pedido
    motion_system: {
      name: sys.name,
      description: sys.description,
      ease: sys.ease,
      duration: sys.duration,
      stagger: sys.stagger,
      lenis: sys.lenis,
      scroll_philosophy: sys.scroll_philosophy,
      custom_ease_defs: field(sys, "custom_ease_defs", `motion-systems.json → ${sys.name}`),
      transition_contract: sys.transition_contract,
    },
    is_native_system: name === m.native_system,
    // (c) la instrucción al agente consumidor
    instructions: [
      "El bloque `prompt` es del autor original del componente y NO ha sido modificado. Sus valores de",
      "ease, duración y stagger son los que ese autor eligió.",
      "",
      "Tu trabajo es ajustarlos a los tokens de `motion_system` para que esta página se mueva con un",
      "solo idioma. Hazlo TÚ, leyendo el prompt: no hay sustitución mecánica y no debes hacerla.",
      "",
      "REGLA CRÍTICA — preserva las relaciones aritméticas:",
      "Si una duración sostiene una suma, un encadenado o un invariante (por ejemplo: 'las posiciones",
      "son enteras y las duraciones son 1, así que las cuatro transiciones van seguidas sin huecos', o",
      "'el intro completo dura ~8,5s', o un `end` de ScrollTrigger calculado desde la duración),",
      "RECALCULA EL CONJUNTO ENTERO de forma coherente. Nunca cambies un valor suelto dejando que la",
      "prosa, la suma o el `end` sigan diciendo lo anterior.",
      "",
      "Si un valor es estructural al efecto —un `elastic` que dejaría de rebotar, un `ease:'none'`",
      "dentro de un scrub, la cadencia de un bucle, una constante de shader o de física— NO lo toques",
      "y di por qué lo dejas.",
      "",
      "Cuando termines, la prosa del prompt y el código deben decir lo mismo. Si no puedes lograrlo",
      "sin romper el efecto, deja el timing original e indícalo.",
    ].join("\n"),
    // contrato de este componente en particular
    contract: {
      capabilities: [...capsOf(slug)],
      solo_on_page: m.solo_on_page,
      solo_reasons: m.solo_reasons,
      pinned: m.pinned,
      viewport_heights: m.viewport_heights,
      needs_lenis: m.needs_lenis,
    },
  };
}
