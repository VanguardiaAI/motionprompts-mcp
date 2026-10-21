// Contrato de datos del motor de reglas y de la superficie MCP.
//
// Existe porque R11 estuvo leyendo `systems` de `generated/motion/motion-meta.json` —donde ese
// campo NO existe, lo escribe la CAPA 2 en `components/*/meta.json`— y en vez de fallar devolvía
// `undefined`, que `?? []` convertía en lista vacía. Resultado: R11 marcó los 219 componentes como
// incompatibles con su propio sistema en TODAS las composiciones, y nadie se enteró.
//
// Aquí se declara, regla por regla, qué rutas de datos lee cada una. `scripts/validate-rule-schema.mjs`
// las contrasta contra los artefactos reales y falla el build si alguna no resuelve.
//
// Sintaxis de ruta:
//   motion.<slug>.campo      mapa por slug: el campo debe existir en TODOS los slugs
//   evidence.a.b             objeto: la ruta debe existir
//   evidence.a[].b           array: el campo debe existir en TODOS los elementos
//   holders:<clave>          clave concreta que debe existir en conflicts.holders
//
// Un campo con valor `null` SÍ es válido: la CAPA 1 usa null para "no determinable leyendo el
// código" (ver DECISIONS.md D1 y UNRESOLVED.md). Lo que no vale es que la CLAVE no exista.

// ---------------------------------------------------------------- accesores estrictos

/** Lee `key` de `obj`. Lanza si la clave no existe. `null` es un valor válido. */
export function field(obj, key, where) {
  if (obj === null || obj === undefined)
    throw new Error(`[esquema] ${where}: se intentó leer "${key}" de ${obj}`);
  if (!(key in obj))
    throw new Error(
      `[esquema] ${where}: el campo "${key}" no existe. Claves disponibles: ${Object.keys(obj).slice(0, 20).join(", ")}`
    );
  return obj[key];
}

/** Lee una ruta con puntos. Lanza en el primer tramo que no exista. */
export function path(root, dotted, where) {
  let cur = root;
  const parts = dotted.split(".");
  for (let i = 0; i < parts.length; i++) {
    cur = field(cur, parts[i], `${where} → ${parts.slice(0, i + 1).join(".")}`);
  }
  return cur;
}

/**
 * Lectura de un mapa DISPERSO por diseño: `conflicts.capabilities` solo tiene entrada para los
 * componentes que ejercen alguna capacidad (147 de 219), y `conflicts.conflicts` para los 117 que
 * chocan con alguien. La ausencia de clave significa "ninguno", no "dato perdido".
 * Se distingue de `field()` a propósito: aquí el defecto es correcto y está declarado.
 */
export function sparse(map, key, fallback) {
  return key in map ? map[key] : fallback;
}

/** Carga obligatoria de un artefacto. Nada de `existsSync(x) ? parse(x) : []`. */
export function requireArtifact(readFileSync, existsSync, p, who) {
  if (!existsSync(p))
    throw new Error(
      `[esquema] ${who}: falta el artefacto ${p}. Ejecuta \`npm run motion\` y \`npm run api\` antes de usar el motor de reglas.`
    );
  return JSON.parse(readFileSync(p, "utf8"));
}

// ---------------------------------------------------------------- el contrato

/**
 * Qué lee cada regla de COMPOSITION_RULES.md. Si añades una regla que toca datos nuevos, decláralo
 * aquí o el build falla — que es justo lo que no pasó con R11.
 */
export const RULE_READS = {
  R0: ["motion.<slug>"],
  R1: ["holders:page-scroll-owner", "capabilities[].capability", "motion.<slug>.needs_lenis"],
  R2: ["holders:entry-veil", "capabilities[].capability"],
  R3: ["capabilities[].capability"],
  R4: ["evidence.webgl.count", "evidence.webgl.components[].slug", "evidence.webgl.components[].fullViewport"],
  R5: [
    "motion.<slug>.pinned",
    "motion.<slug>.viewport_heights",
    "motion.<slug>.cluster",
    "holders:document-height",
    "evidence.corridor.count",
    "evidence.corridor.unpinned",
  ],
  R6: ["motion.<slug>.category"],
  R7: ["motion.<slug>.libs", "motion.<slug>.assets_required.bytes", "evidence.library_weight"],
  R8: ["holders:page-scroll-lock", "holders:first-canvas", "holders:window-onload"],
  R9: ["conflicts[].kind", "conflicts[].with", "conflicts[].reason"],
  R10: ["evidence.conflicts.killers", "motion.<slug>.trigger", "motion.<slug>.pinned"],
  R11: ["meta.motion.systems"],
  R12: ["motion.<slug>.solo_on_page", "motion.<slug>.solo_reasons"],
  R13: ["evidence.fixed_chrome.count", "evidence.fixed_chrome.components[].slug", "evidence.fixed_chrome.components[].bars"],
  R14: [
    "evidence.fixed_overlays.count",
    "evidence.fixed_overlays.declared_full",
    "evidence.fixed_overlays.unsized_only",
    "evidence.fixed_overlays.components[].slug",
    "evidence.fixed_overlays.components[].full",
    "evidence.fixed_overlays.components[].unsized",
  ],
  R15: [],
  R16: [
    "evidence.render_loops.count",
    "evidence.render_loops.webgl",
    "evidence.render_loops.non_webgl",
    "evidence.render_loops.components[].slug",
    "evidence.render_loops.components[].fn",
    "evidence.render_loops.components[].webgl",
  ],
  R17: [
    "evidence.absolute_positioned.count",
    "evidence.absolute_positioned.total_rules",
    "evidence.absolute_positioned.components[].slug",
    "evidence.absolute_positioned.components[].count",
  ],
  R18: [
    "evidence.layout_animated.count",
    "evidence.layout_animated.components[].slug",
    "evidence.layout_animated.components[].props",
  ],
};

/** Qué lee cada tool del MCP, más allá de lo que ya cubren las reglas. */
export const MCP_READS = {
  list_motion_systems: ["systems[].name", "systems[].ease.primary", "systems[].duration.base", "systems[].stagger.base", "systems[].transition_contract"],
  get_motion_system: ["systems[].name", "systems[].custom_ease_defs", "meta.motion.native_system"],
  search_components_motion: [
    "meta.motion.category", "meta.motion.trigger", "meta.motion.complexity", "meta.motion.libs",
    "meta.motion.systems", "meta.motion.native_system", "meta.motion.pinned",
    "meta.motion.viewport_heights", "meta.motion.needs_lenis", "meta.motion.solo_on_page",
    "meta.motion.motion_signature", "meta.motion.title",
  ],
  get_integration_contract: ["systems[].custom_ease_defs", "evidence.capabilities"],
  plan_page: ["meta.motion.systems", "meta.motion.complexity", "meta.motion.assets_required.bytes"],
  get_component_prompt: ["meta.motion.native_system"],
};

/** Lo que `/api/components.json` publica desde src/registry.json. */
export const API_READS = {
  "api/components.json": ["registry[].slug", "registry[].description", "registry[].thumb", "registry[].preview"],
};

/**
 * Literales incrustados en el motor de reglas que DEBEN existir en los datos. Son la otra forma de
 * leer en falso: no una ruta rota, sino un slug o una clave que ya no existe.
 */
export const EMBEDDED = {
  // R10 · componentes que ejecutan ScrollTrigger.getAll().kill()
  killers: {
    values: [
      "kaitonote-3d-gallery-showcase-scroll-animation",
      "madeinuxstudio-page-transition",
      "nakedcityfilms-scroll-animation",
    ],
    check: "slug",
    against: "evidence.conflicts.killers",
  },
  // R1 · el único con Lenis infinite:true
  infinite_lenis: { values: ["seventeenagency-scroll-animation"], check: "slug" },
  // R6 · categorías que no se repiten
  non_repeatable: { values: ["preloader", "transition", "menu", "footer"], check: "category" },
  // R1/R2/R5/R8 · capacidades exclusivas
  capabilities: {
    values: ["page-scroll-owner", "entry-veil", "document-height", "page-scroll-lock", "first-canvas", "window-onload"],
    check: "holders-key",
  },
  // R9/R10 · tipos de conflicto específico
  conflict_kinds: { values: ["ease-name", "kills-all"], check: "conflict-kind" },
};

/**
 * R7 · mapa de nombre de librería declarado → chunk medido en dist/assets.
 *
 * Vivía como una escalera de `if` dentro de `libGzip()` con un `?? 0` al final, y ahí se coló el
 * segundo fallo silencioso: el código comparaba con `"splittype"` mientras el corpus declara
 * `split-type` (con guion), así que esos componentes contaban 0 KB. Ahora el mapa es explícito y
 * `UNWEIGHTED` declara, uno a uno, los nombres que a sabiendas no suman peso de bundle — con el
 * motivo. Un nombre que no esté ni en uno ni en otro hace fallar el build.
 */
export const LIB_CHUNK = {
  three: ["three"],
  gsap: ["gsap_core"],
  lenis: ["lenis"],
  scrolltrigger: ["ScrollTrigger"],
  splittext: ["SplitText"],
  // `SplitType` y `split-type` son el paquete npm split-type, que NO es el SplitText de gsap:
  // son librerías distintas con chunks distintos. Confundirlas fue el segundo error de este mapa.
  splittype: ["split_type"],
  "split-type": ["split_type"],
  customease: ["CustomEase"],
  // Flip y Draggable importan la utilidad de matrices de gsap; el Set del presupuesto la cuenta
  // una sola vez aunque estén los dos.
  flip: ["Flip", "gsap_matrix"],
  draggable: ["Draggable", "gsap_matrix"],
  gltfloader: ["GLTFLoader"],
  orbitcontrols: ["OrbitControls"],
  "matter-js": ["matter"],
  "lottie-web": ["lottie"],
  // El chunk de UnrealBloomPass se lleva dentro CopyShader, EffectComposer, RenderPass y ShaderPass:
  // los cuatro nombres apuntan al mismo chunk y el Set lo cuenta una vez.
  unrealbloompass: ["UnrealBloomPass"],
  effectcomposer: ["UnrealBloomPass"],
  renderpass: ["UnrealBloomPass"],
  shaderpass: ["UnrealBloomPass"],
};

/**
 * Nombres que a sabiendas NO suman peso de bundle, con el motivo. No es una lista de descartes:
 * es una declaracion. Un nombre que no este ni aqui ni en LIB_CHUNK hace fallar el build.
 */
export const UNWEIGHTED = {
  ionicons: "se carga desde unpkg con <script type=module>: no entra en el bundle (si es coste de red)",
  "phosphor-icons": "se carga desde CDN: no entra en el bundle (si es coste de red)",
  p5: "no es dependencia del proyecto; el componente la trae por su cuenta",
  "anime.js (vendored v3.2.2)": "vendorizada dentro del fichero JS del propio componente",
  scrolltoplugin: "plugin de gsap sin chunk compartido: Vite lo inlinea en el chunk del componente",
  cssruleplugin: "plugin de gsap sin chunk compartido: Vite lo inlinea en el chunk del componente",
  roomenvironment: "addon de three sin chunk compartido: inlineado en el chunk del componente",
  pmremgenerator: "clase del core de three, ya contada dentro del chunk `three`",
  hdrloader: "addon de three sin chunk compartido: inlineado en el chunk del componente",
  meshoptdecoder: "addon de three (el .wasm va en base64 dentro del .js): inlineado en el chunk del componente",
  // Un nombre de LIB_CHUNK tiene que existir en `evidence.library_weight`, y ese
  // mapa solo lleva los chunks COMPARTIDOS que Vite emitió; `@pmndrs/vanilla` lo
  // usa un solo componente, así que Rollup lo mete dentro de `c-<slug>-*.js` y no
  // hay chunk propio que declarar. Medido en el build del 2026-08-10: el chunk de
  // 3d-material-finish-switcher pesa 15,7 KB gzip ENTERO — su código, el material
  // de @pmndrs/vanilla, HDRLoader y MeshoptDecoder incluidos. Contra los 151 KB de
  // `three` y los 13,5 KB de `GLTFLoader`, que R7 sí cuenta, es ruido; forzar un
  // chunk propio con manualChunks costaría una petición más y cambiaría el reparto
  // de TODO el catálogo.
  "@pmndrs/vanilla": "solo lo usa un componente: Vite lo inlinea en su chunk (15,7 KB gzip el chunk entero). Sin chunk compartido no hay entrada de library_weight que declarar",
};


/**
 * Identificadores que apuntan a datos de artefacto en cada consumidor, por fichero.
 * `scripts/lint-artifact-access.mjs` los usa para saber sobre qué objetos está prohibido el `?.`
 * y el `??` crudos — y comprueba que cada nombre declarado siga existiendo en su fichero, para que
 * un renombrado no desactive el lint en silencio.
 */
export const ARTIFACT_ROOTS = {
  "scripts/check-composition.mjs": ["motion", "capabilities", "conflicts", "evidence", "systems", "LIB_GZIP"],
  "mcp/lib/compose.mjs": ["motion", "capabilities", "evidence", "systems", "sysByName", "sys", "m"],
  "scripts/build-api.mjs": ["motion", "capabilities", "holders", "conflicts", "evidence", "systems", "registry", "byslug", "m"],
  "mcp/server.mjs": ["INDEX", "MOTION_SYSTEMS", "BY_SLUG", "c"],
  // La capa SEO lee el registro, el índice MCP y el bloque motion de cada componente para decidir
  // qué publica y con qué enlaces internos: son datos de artefacto como cualquier otro.
  "scripts/build-seo.mjs": ["registry", "mcpIndex", "mcpBySlug", "nativeSystem", "state", "m", "c"],
};
