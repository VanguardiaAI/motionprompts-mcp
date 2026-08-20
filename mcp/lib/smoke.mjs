// End-to-end smoke test: spins up the real server over stdio via the MCP SDK client and exercises
// every tool + a resource through the actual protocol.  node mcp/lib/smoke.mjs
import { readFileSync } from "node:fs";
const INDEX = JSON.parse(readFileSync(new URL("../../src/mcp-index.json", import.meta.url), "utf8"));
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const G = "\x1b[32m", R = "\x1b[31m", D = "\x1b[2m", RST = "\x1b[0m";
let failures = 0;
const ok = (label, cond, extra = "") => {
  console.log(`${cond ? G + "✓" : R + "✗"}${RST} ${label}${extra ? "  " + D + extra + RST : ""}`);
  if (!cond) failures++;
};
const callJson = async (client, name, args) => JSON.parse((await client.callTool({ name, arguments: args })).content[0].text);

const transport = new StdioClientTransport({ command: "node", args: [resolve(ROOT, "mcp/server.mjs")], cwd: ROOT });
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(transport);

try {
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  ok("tools/list", ["get_component","list_components","list_facets","search_components","list_motion_systems","render_prompt","plan_page","suggest_mechanics","get_integration_contract","plan_imagery"].every((n) => names.includes(n)), names.join(","));

  // 1) search by brief
  const s1 = await callJson(client, "search_components", { query: "cartas apiladas que se revelan al hacer scroll", limit: 3 });
  ok("search by brief finds sticky cards", s1.results.some((r) => r.slug.includes("sticky-cards") || r.slug.includes("magnetic-cards")), `top: ${s1.results[0]?.slug} (why: ${s1.results[0]?.why?.[0]})`);

  // 2) search with facet filters (no query)
  const s2 = await callJson(client, "search_components", { useCase: ["hero"], maxPerfCost: "light", mobileSafe: true, limit: 5 });
  ok("facet-only search returns light mobile heroes", s2.results.length > 0 && s2.results.every((r) => r.useCase.includes("hero") && r.perfCost === "light" && r.mobileSafe === true), `${s2.count} hits`);

  // 3) get_component default (meta+preview+prompt)
  const g1 = await callJson(client, "get_component", { slug: "3d-crt-display" });
  ok("get_component default has meta+preview+prompt", !!g1.meta && !!g1.preview?.demo && typeof g1.prompt?.markdown === "string", `prompt ${g1.prompt?.markdown?.length} chars`);
  ok("get_component preview demo is absolute URL", /^https?:\/\//.test(g1.preview.demo));

  // 4) get_component source
  const g2 = await callJson(client, "get_component", { slug: "3d-crt-display", include: ["source"] });
  // Esta aserción tiene DOS modos legítimos, y antes solo comprobaba uno. El mirror público no
  // distribuye el código de los componentes, así que `source` devuelve `available:false` con la
  // explicación y los enlaces. Comprobar solo `files.length > 0` daba un pase en falso allí.
  const conFuente = g2.source?.files?.length > 0;
  ok(conFuente ? "get_component source devuelve código + integración"
               : "get_component source explica que esta distribución no lleva código",
    conFuente
      ? (g2.source.files.every((f) => /\.(html|js|css)$/.test(f.file)) && !!g2.source.integration)
      : (g2.source?.available === false && /PROMPTS, not the component source/.test(g2.source.note) && !!g2.source.demo && !!g2.source.promptUrl),
    conFuente ? `files: ${g2.source.files.map((f) => f.file).join(", ")}` : "modo prompts");
  ok("integration declara WebGL en una pieza three.js", g2.source.integration.needsWebgl === true);

  // 5) unknown slug → error
  const gErr = await client.callTool({ name: "get_component", arguments: { slug: "does-not-exist" } });
  ok("unknown slug returns isError", gErr.isError === true);

  // motion systems (CAPA 2/3)
  const ms = await callJson(client, "list_motion_systems", {});
  ok("list_motion_systems returns 8 token sets", Array.isArray(ms) && ms.length === 8, `${ms.length} systems`);
  ok("systems carry real tokens", ms.every((x) => x.ease?.primary && x.duration?.base != null && x.transition_contract));

  // componente CON cobertura: el sistema elegido debe cambiar el resultado
  const rp = await callJson(client, "render_prompt", { slug: "ripple-displacement-slider" });
  ok("render_prompt renders native system", !!rp.markdown && rp.system === "step-advance" && rp.tokens_applied > 0, `${rp.system}, ${rp.tokens_applied} tokens`);
  ok("render_prompt leaves no unresolved placeholders", !/\{\{/.test(rp.markdown));
  const rp2 = await callJson(client, "render_prompt", { slug: "ripple-displacement-slider", system: "curtain-toggle" });
  ok("render_prompt honours a foreign system", rp2.system === "curtain-toggle" && rp2.markdown !== rp.markdown);
  // componente SIN cobertura (todos sus valores están narrados en prosa): debe devolverse intacto,
  // no a medio sustituir. Es la garantía de D15 — nunca un prompt incoherente.
  const rp3 = await callJson(client, "render_prompt", { slug: "sticky-cards-ashfall-rebuild-js", system: "entry-veil" });
  ok("zero-coverage component returns coherent (unchanged) prompt", rp3.tokens_applied === 0 && !/\{\{/.test(rp3.markdown), `${rp3.tokens_applied} tokens`);

  // --- superficie de composición (punto 3) ---------------------------------------------------
  const gs = await callJson(client, "get_motion_system", { name: "scrub-lagged" });
  ok("get_motion_system devuelve miembros y tokens", gs.members > 0 && gs.member_slugs.includes("eseagency-scroll-carousel-javascript"), `${gs.members} miembros`);

  const sc = await callJson(client, "search_components_motion", { motion_system: "scrub-lagged", category: "slider" });
  ok("search_components_motion filtra por el bloque motion",
    sc.count > 0 && sc.results.every((r) => r.category === "slider" && r.native_system),
    `${sc.count} hits`);

  // El contrato de la composición de C3: seis reparaciones, cero irreparables.
  // El quinto miembro era `3d-parallax-footer`, oculto el 2026-08-16 a petición de Pablo (le falta
  // el modelo 3D del final). Ocultar un componente lo saca del catálogo MCP, así que esta fixture
  // dejaba de resolver y la prueba reventaba con "cannot read properties of undefined".
  // `playable-objects` es el sustituto exacto: también es un pie de página con bucle de render
  // propio, cae en la misma fase `render-loops` y deja el presupuesto idéntico (2500/1500), de modo
  // que las cinco aserciones D21 siguen midiendo lo mismo.
  const C3 = ["lusion-lp-reveal", "3d-slider-threejs", "eseagency-scroll-carousel-javascript", "kpverse-menu", "playable-objects"];
  const ic = await callJson(client, "get_integration_contract", { slugs: C3, motion_system: "scrub-lagged" });
  ok("get_integration_contract: composición de C3 planificable", ic.valid === true && ic.violations.length === 0, `${ic.repairs.length} reparaciones`);
  ok("emite la reparación de Lenis único", ic.repairs.some((r) => r.rule === "R1") && ic.single_lenis === "3d-slider-threejs");
  // Regresiones de D21: estas tres se daban por buenas y rompían la página.
  ok("D21.1 · page-scroll-lock con UN titular ya es reparación", ic.repairs.some((r) => r.capability === "page-scroll-lock"));
  ok("D21.2 · el pasillo cuenta los no pinneados", ic.budget.corridor_vh === 2500 && ic.budget.pin_vh === 1500, `corridor=${ic.budget.corridor_vh} pin=${ic.budget.pin_vh}`);
  ok("D21.3 · se gatea el footer, no el héroe",
    ic.init_order.some((s) => s.phase === "render-loops" && s.slugs.includes("playable-objects")) &&
    ic.init_order.some((s) => s.phase === "webgl-nogate" && s.slugs.includes("3d-slider-threejs")));
  ok("D21.4 · bloquea el scroll durante el velo", ic.init_order.some((s) => s.phase === "entry-lock"));
  ok("D21.5 · R13 detecta las tres barras fijas", ic.repairs.some((r) => r.rule === "R13"));

  // Regresiones del brief editorial (FASE 1 → FASE 2). Ver DECISIONS.md D22.
  const ED = ["offficestud", "samuelsiebler-js", "nextjs-text-reveal-animation", "lukebaffait-animated-footer"];
  const ic2 = await callJson(client, "get_integration_contract", { slugs: ED, motion_system: "reveal-on-enter" });
  const rules2 = ic2.repairs.map((r) => r.rule);
  ok("editorial: planificable", ic2.valid === true && ic2.violations.length === 0, `${ic2.repairs.length} reparaciones: ${rules2.join(",")}`);
  ok("D22.1 · R11 ya no marca incompatible a todo el mundo",
    !ic2.warnings.some((w) => w.rule === "R11"),
    JSON.stringify(ic2.warnings.filter((w) => w.rule === "R11")));
  ok("D22.2 · R14 ve la capa fija que R13 no veía", rules2.includes("R14"));
  ok("D22.2 · R14 repara con sticky, no con absolute",
    /sticky/.test(ic2.repairs.find((r) => r.rule === "R14").repair) &&
    /NO usar `position: absolute`/.test(ic2.repairs.find((r) => r.rule === "R14").repair));
  ok("D22.3 · R15 exige acotar el CSS", rules2.includes("R15") && /scope-css\.mjs/.test(ic2.repairs.find((r) => r.rule === "R15").repair));
  ok("D22.4 · R16 gatea también el bucle de canvas 2D",
    ic2.init_order.some((s) => s.phase === "render-loops" && s.slugs.includes("lukebaffait-animated-footer")),
    JSON.stringify(ic2.init_order.find((s) => s.phase === "render-loops")?.slugs));
  ok("D22.5 · R17 pide bloque contenedor en la raíz y en cada section",
    rules2.includes("R17") && /<section>/.test(ic2.repairs.find((r) => r.rule === "R17").repair));

  // ── D23 · plan_page devuelve arquitectura, no componentes ──────────────────
  const pp = await callJson(client, "plan_page", { brief: "portfolio de un fotógrafo" });
  ok("D27.1 · plan_page ya no devuelve componentes", pp.components === undefined && Array.isArray(pp.sections));
  ok("D27.2 · devuelve una página entera, no cinco huecos", pp.section_count >= 9, `${pp.section_count} secciones`);
  ok("D27.3 · cada sección trae rol, cometido y política de movimiento",
    pp.sections.every((s) => s.role && s.purpose && s.content && ["earned", "optional", "still"].includes(s.motion)));
  ok("D27.4 · el arquetipo se detecta del brief", pp.archetype === "portfolio", `${pp.archetype} (${pp.archetype_confidence})`);

  // El fallo que motivó todo esto: briefs distintos devolvían lo mismo.
  const ppAg = await callJson(client, "plan_page", { brief: "agencia de software a medida, casos B2B" });
  const ppCafe = await callJson(client, "plan_page", { brief: "tostaduría de café de especialidad" });
  ok("D27.5 · briefs distintos dan arquitecturas distintas",
    new Set([pp.archetype, ppAg.archetype, ppCafe.archetype]).size === 3,
    `${pp.archetype} / ${ppAg.archetype} / ${ppCafe.archetype}`);

  const ppRef = await callJson(client, "plan_page", { brief: "portfolio de un fotógrafo", reference: { url: "https://ejemplo.test", palette: ["#111", "#eee"] } });
  ok("la referencia no deriva movimiento", ppRef.motion_system === pp.motion_system && ppRef.art_direction.palette.length === 2);

  // ── D23 · suggest_mechanics sabe decir que no tiene algo ───────────────────
  const sm = await callJson(client, "suggest_mechanics", { role: "signature", need: "svg path stroke draws itself tied to scroll position", motion_system: "reveal-on-enter" });
  ok("D27.6 · un rol cubierto devuelve el componente correcto",
    sm.verdict === "adopt" && sm.candidates[0].slug === "scroll-powered-svg-stroke-2",
    `${sm.verdict} ${sm.candidates[0]?.slug}`);

  // GUARDA DE HUECOS: si alguien añade un componente de acordeón, de contador o de tabla de precios
  // y le pone su faceta, esto falla y recuerda actualizar ROLES en mcp/lib/arquitectura.mjs.
  //
  // Ya ha pasado una vez y funcionó: el 2026-08-02 se escribió `anchored-headline-speech-bubbles`
  // —abstraído de la sección de testimonios de terryhoproducts.com, observada por fotogramas— y
  // esta guarda saltó al instante. `testimonial` salió de la lista, y su receta a mano dejó de
  // servirse porque el rol ya tiene charco. Quedan CUATRO huecos, no cinco.
  const facets = await callJson(client, "list_facets", {});
  const vocabulario = JSON.stringify(facets.vocab).toLowerCase();
  const HUECOS = ["faq", "data", "pricing", "reference"];
  for (const role of HUECOS) {
    const r = await callJson(client, "suggest_mechanics", { role, need: "cualquier cosa", motion_system: "reveal-on-enter" });
    ok(`D27.7 · el catálogo sigue sin cubrir "${role}"`, r.verdict === "none" && r.catalog_has_role === false, r.verdict);
  }
  {
    const r = await callJson(client, "suggest_mechanics", { role: "testimonial", need: "reseñas de clientes", motion_system: "reveal-on-enter" });
    ok('D27.7b · "testimonial" dejó de ser hueco y adopta de verdad',
      r.verdict === "adopt" && (r.candidates ?? []).some((c) => c.slug === "anchored-headline-speech-bubbles"),
      `${r.verdict} · ${(r.candidates ?? []).map((c) => c.slug).join(", ")}`);
  }
  ok("D27.8 · el vocabulario de facetas sigue sin términos para los huecos",
    !/"(faq|accordion|acorde|counter|contador|pricing|precio|table|tabla)"/.test(vocabulario));

  // El falso positivo más constante: buscar "acordeón" en libre devuelve una galería horizontal.
  const libre = await callJson(client, "search_components", { query: "accordion panel expands and collapses on click", limit: 1 });
  ok("D27.9 · search libre sigue devolviendo el falso positivo de acordeón",
    libre.results[0].slug === "accordion-frames" && libre.results[0].category === "hover",
    `${libre.results[0].slug} (${libre.results[0].category}) — por eso existe suggest_mechanics`);
  ok("D27.10 · search libre reporta cobertura léxica y lo que falló",
    typeof libre.results[0].lexical_coverage === "number" && Array.isArray(libre.results[0].missed_terms),
    `cob=${libre.results[0].lexical_coverage} falló=${libre.results[0].missed_terms.join(",")}`);

  // ── D31 · cobertura de movimiento: el hueco viene con receta y excluir no apaga la sección ──
  const ppRest = await callJson(client, "plan_page", { brief: "restaurante español en Nueva York" });
  ok("D31.1 · plan_page devuelve el objetivo de cobertura",
    ppRest.motion_coverage?.must_move?.length >= 8 &&
    ppRest.motion_coverage.must_move.length + ppRest.motion_coverage.quiet_while_read.length === ppRest.section_count,
    `${ppRest.motion_coverage?.must_move?.length}/${ppRest.section_count} deben moverse`);
  ok("D31.2 · separa lo que se adopta de lo que se escribe con receta",
    ppRest.motion_coverage.adopt_from_catalog.length > 0 && ppRest.motion_coverage.write_from_recipe.length > 0,
    `${ppRest.motion_coverage.adopt_from_catalog.length} adoptar / ${ppRest.motion_coverage.write_from_recipe.length} receta`);

  for (const role of HUECOS) {
    const r = await callJson(client, "suggest_mechanics", { role, need: "lo que sea", motion_system: "reveal-on-enter" });
    ok(`D31.3 · el hueco "${role}" trae receta escrita, no un folio en blanco`,
      typeof r.hand_written_recipe === "string" && r.hand_written_recipe.length > 80 &&
      /duration|stagger|ease/.test(r.hand_written_recipe),
      r.hand_written_recipe?.slice(0, 60) + "…");
  }

  const smEx = await callJson(client, "suggest_mechanics", { role: "context", need: "photograph revealed by an expanding mask on scroll", motion_system: "reveal-on-enter", avoid: ["mask-reveal"] });
  ok("D31.4 · excluir el nº1 deja candidatos, no una sección quieta",
    smEx.verdict === "adopt" && smEx.candidates.length > 0 && !smEx.candidates.some((c) => c.slug === "mask-reveal") && /nº2|Excluir NUNCA/.test(smEx.exclusion_note),
    `${smEx.pool_size} en el charco, nº1 ahora ${smEx.candidates[0].slug}`);

  // El choque que destapó arreglar la cobertura: el charco del rol `cta` incluye la categoría
  // `footer`, así que `cta` y `footer` adoptaban los dos un pie y R6 invalidaba la página. La
  // sugerencia por sección tiene que ver la página que se está montando, no sólo su rol.
  const smSolo = await callJson(client, "suggest_mechanics", { role: "cta", need: "closing call to action revealed on enter", motion_system: "reveal-on-enter" });
  const smCon = await callJson(client, "suggest_mechanics", { role: "cta", need: "closing call to action revealed on enter", motion_system: "reveal-on-enter", adopted: ["lukebaffait-animated-footer"] });
  ok("D31.4b · `adopted` marca los candidatos que invalidarían la página",
    smCon.candidates.some((c) => c.composes_with_adopted === false && typeof c.collision === "string") &&
    smCon.candidates[0].composes_with_adopted === true &&
    smSolo.candidates.every((c) => c.composes_with_adopted === true),
    `${smCon.colliding_count} chocan; nº1 ahora ${smCon.candidates[0].slug}`);
  ok("D31.4c · los que chocan van al final, no al principio",
    smCon.candidates.findIndex((c) => !c.composes_with_adopted) === smCon.candidates.length - (smCon.colliding_count ?? 0));

  const icCob = await callJson(client, "get_integration_contract", { slugs: ED, motion_system: "reveal-on-enter", moving_sections: ppRest.motion_coverage.must_move });
  ok("D31.5 · el contrato audita la cobertura y llama corto a lo corto",
    icCob.motion_coverage?.verdict === "insuficiente" && icCob.motion_coverage.moving_sections === ppRest.motion_coverage.must_move.length,
    `${icCob.motion_coverage?.adopted_mechanics}/${icCob.motion_coverage?.moving_sections} → ${icCob.motion_coverage?.verdict}`);
  const icSin = await callJson(client, "get_integration_contract", { slugs: ED, motion_system: "reveal-on-enter" });
  ok("D31.6 · sin moving_sections el contrato no inventa una cobertura", icSin.motion_coverage === null);

  // ── D31 · plan_imagery ────────────────────────────────────────────────────
  const pi = await callJson(client, "plan_imagery", {
    brief: "restaurante español en Nueva York",
    archetype: ppRest.archetype,
    sections: ppRest.sections.map((s) => ({ id: s.id, role: s.role, purpose: s.purpose })),
    palette: ["#111", "#c9451a"],
  });
  // El reparto es el que da la salida del `escena` a nano-banana-2: lo que tiene que parecer REAL
  // va a nano, lo que tiene que parecer BONITO a seedream y lo que tiene que estar bien DIBUJADO a
  // gpt. `escena` estaba en seedream y eso es lo que dejaba la sexta página con aire de ensayo
  // fotográfico en vez de web de un negocio.
  ok("D31.7 · plan_imagery enruta los tres modelos por tipo de toma",
    pi.modelos.gente.modelo === "nano-banana-2" &&
    pi.modelos.escena.modelo === "nano-banana-2" &&
    pi.modelos.paisaje.modelo === "seedream/5-pro-text-to-image" &&
    pi.modelos.artistica.modelo === "seedream/5-pro-text-to-image" &&
    pi.modelos.hoja.modelo === "gpt-image-2-text-to-image" &&
    pi.reparto["nano-banana-2"].includes("escena"));
  ok("D31.8 · pide personas y recortes, no sólo rectángulos",
    pi.resumen.tomas_con_personas > 0 && pi.resumen.hojas_de_recortes > 0,
    `${pi.resumen.tomas_con_personas} con gente, ${pi.resumen.hojas_de_recortes} hojas de recortes`);
  ok("D31.9 · la regla de especificidad trae la prueba de la competencia",
    /competidor/i.test(pi.reglas.especificidad.prueba) && !!pi.reglas.especificidad.mal && !!pi.reglas.especificidad.bien);
  ok("D31.10 · la transparencia se explica por el magenta, y los logos por Wikimedia",
    /FF00FF/.test(pi.reglas.transparencia.regla) && /Wikidata|Commons/.test(pi.reglas.logotipos.como));
  ok("D31.11 · las secciones de consulta se declaran SIN imagen",
    pi.por_seccion.filter((s) => ["reference", "pricing", "faq"].includes(s.role)).every((s) => s.lleva_imagen === false),
    `sin imagen: ${pi.resumen.secciones_sin_imagen.join(", ")}`);

  // D32 · los dos defectos de la sexta página: la página bonita y deshabitada, y el pin que arranca
  // donde ya no toca. Los dos estaban permitidos por todo lo anterior.
  ok("D32.1 · el censo de personas cuenta y da veredicto",
    typeof pi.censo_de_personas?.tomas_con_personas === "number" &&
    ["suficiente", "escasa", "deshabitada"].includes(pi.censo_de_personas.veredicto) &&
    pi.censo_de_personas.minimo === 3,
    `${pi.censo_de_personas?.tomas_con_personas} de ${pi.censo_de_personas?.tomas_fotograficas} → ${pi.censo_de_personas?.veredicto}`);
  ok("D32.2 · la cuota de personas exige que alguna se vea SIN interactuar",
    /sin pasar el ratón|SIN HACER NADA/i.test(pi.reglas.personas.visibilidad) &&
    /reposo/i.test(pi.reglas.personas.visibilidad));
  ok("D32.3 · la regla de foto de negocio trae la prueba del sitio abierto",
    /abierto/i.test(pi.reglas.foto_de_negocio.prueba) && !!pi.reglas.foto_de_negocio.mal && !!pi.reglas.foto_de_negocio.bien);
  ok("D32.4 · una interfaz de producto se maqueta, no se genera",
    /no se genera nunca|maqueta/i.test(pi.reglas.producto_digital.regla));

  // R18 con el par exacto que lo destapó: la mecánica que crece y la que pinnea debajo.
  const ic18 = await callJson(client, "get_integration_contract", {
    slugs: ["qindustrial-scroll", "navigate-scroll-animated-text-javascript"],
    motion_system: "reveal-on-enter",
  });
  ok("D32.5 · R18 avisa cuando algo que crece convive con un pin",
    ic18.warnings.some((w) => w.rule === "R18") && ic18.valid === true,
    ic18.warnings.find((w) => w.rule === "R18")?.message?.slice(0, 60));
  ok("D32.6 · el contrato exige mirar la página, no sólo leerla",
    ic18.verificacion_visual?.obligatoria === true &&
    ic18.verificacion_visual.que_mirar.length >= 4 &&
    /qc-layout/.test(ic18.verificacion_visual.en_este_repositorio));

  // get_component_prompt: prompt VERBATIM, sin renderizar (D18)
  const raw = readFileSync(resolve(ROOT, "components/sticky-cards-ashfall-rebuild-js/prompt.md"), "utf8");
  const cp = await callJson(client, "get_component_prompt", { slug: "sticky-cards-ashfall-rebuild-js", motion_system: "scrub-lagged" });
  ok("get_component_prompt devuelve el prompt intacto", cp.prompt === raw && cp.prompt_is_verbatim === true, `${cp.prompt.length} chars`);
  ok("acompaña tokens del sistema e instrucciones", !!cp.motion_system?.ease?.primary && /aritm/i.test(JSON.stringify(cp.instructions)));

  // 6) list_facets
  const f = await callJson(client, "list_facets", {});
  ok("list_facets returns vocab + counts", f.vocab?.mood?.length === 14 && !!f.counts?.level, `total ${f.total}`);

  // 7) list_components
  const l = await callJson(client, "list_components", { limit: 10 });
  ok("list_components paginates", l.total === INDEX.count && l.count === 10, `total ${l.total}`);

  // 8) resources
  const res = await client.listResources();
  ok("catalog resource present", res.resources.some((r) => r.uri === "motionprompts://catalog"));
  const rc = await client.readResource({ uri: "motionprompts://component/audemarspiguet-menu" });
  const rec = JSON.parse(rc.contents[0].text);
  ok("component resource reads back", rec.slug === "audemarspiguet-menu" && rec.useCase.includes("navigation"));
} finally {
  await client.close();
}

console.log("\n" + "─".repeat(56));
console.log(failures ? `${R}${failures} check(s) failed${RST}` : `${G}all checks passed${RST}`);
console.log("─".repeat(56));
process.exit(failures ? 1 : 0);
