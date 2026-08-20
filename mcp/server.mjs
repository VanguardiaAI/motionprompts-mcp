#!/usr/bin/env node
// motionprompts MCP server (stdio).
//
// Exposes the GSAP component library as a catalog a coding agent can (1) SEARCH by brief or name,
// (2) FETCH (prompt to rebuild and/or copy-pasteable source), and (3) BROWSE by facet. It reads one
// generated artifact — src/mcp-index.json (produced by `npm run registry`) — and never re-scans the
// tree at runtime, so it can't drift from the live site. Component source is read on demand.
//
// Run:    node mcp/server.mjs        (or: npm run mcp)
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { requireArtifact } from "../schema/data-contract.mjs";
import { RAIZ } from "./lib/raiz.mjs";
import { renderPrompt } from "../scripts/render-prompt.mjs";
import { listSystems as mpListSystems, getSystem, searchComponents as mpSearch, integrationContract, planPage, suggestMechanics, suggestTreatments, componentPrompt } from "./lib/compose.mjs";
import { ROLES, TRATAMIENTOS, ARQUETIPOS } from "./lib/arquitectura.mjs";
import { planImagen } from "./lib/imagineria.mjs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { search } from "./lib/search.mjs";
import { MOOD, USE_CASE, RUNTIME_LEVEL, PERF_COST } from "../schema/vocab.mjs";

// La raíz la resuelve mcp/lib/raiz.mjs. Es la misma en el repositorio y en el paquete publicado,
// que es un subconjunto del repositorio con la estructura intacta.
const ROOT = RAIZ;
const INDEX_PATH = resolve(ROOT, "src/mcp-index.json");

const INDEX = requireArtifact(readFileSync, existsSync, INDEX_PATH, "mcp/server (ejecuta `npm run registry`)");
const SYSTEMS_PATH = resolve(ROOT, "generated/motion/motion-systems.json");
// Sin `existsSync(x) ? … : []`. Un artefacto ausente tiene que reventar el arranque del servidor,
// no dejar que list_motion_systems devuelva una lista vacía como si no hubiera sistemas.
const MOTION_SYSTEMS = requireArtifact(readFileSync, existsSync, SYSTEMS_PATH, "mcp/server");
const BY_SLUG = new Map(INDEX.components.map((c) => [c.slug, c]));

const json = (obj) => ({ content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] });
const fail = (msg) => ({ isError: true, content: [{ type: "text", text: msg }] });

// z.enum needs a non-empty tuple; fall back to plain string if a list is somehow empty.
const enumOf = (arr) => (arr.length ? z.enum(arr) : z.string());

const server = new McpServer(
  { name: "motionprompts", version: "1.0.0" },
  {
    instructions:
      "Catalog of production-grade GSAP motion components. To COMPOSE A PAGE the order is: " +
      "plan_page (information architecture) → suggest_mechanics per section → " +
      "get_integration_contract for all slugs at once → get_component_prompt each → plan_imagery " +
      "before writing a single image prompt. Two failure modes are measured and worth naming up " +
      "front: leaving sections unanimated because 'there is already enough motion' (there is not — " +
      "see plan_page → motion_coverage), and generating images that describe the SECTOR instead of " +
      "the SECTION (see plan_imagery). " +
      "To look things up instead: search_components for a free-text brief or a name, list_facets for " +
      "the filter vocabulary, get_component for the rebuild prompt and/or source. Prefer matching on " +
      "the component's `useWhen`, `mood` and `useCase` over its mechanical description.",
  }
);

// ── search_components ────────────────────────────────────────────────────────
server.registerTool(
  "search_components",
  {
    title: "Search components",
    description:
      "Find the components that best fit a natural-language brief (e.g. \"un hero elegante para una marca " +
      "de lujo\", \"cartas apiladas al hacer scroll\") or a name/alias. Returns a ranked, compact list with a " +
      "`why` for each hit. Combine the free-text `query` with facet filters to narrow. Then call " +
      "get_component on the chosen slug. Leave `query` empty to browse purely by filters.",
    inputSchema: {
      query: z.string().optional().describe("Free-text brief or component name/alias. Spanish or English; accent-insensitive."),
      mood: z.array(enumOf(MOOD)).optional().describe(`Aesthetic filter. One of: ${MOOD.join(", ")}`),
      useCase: z.array(enumOf(USE_CASE)).optional().describe(`Page-role filter. One of: ${USE_CASE.join(", ")}`),
      level: z.array(enumOf(RUNTIME_LEVEL)).optional().describe("page (owns the whole page/scroll) | section (a block) | widget (small embeddable)."),
      category: z.array(z.string()).optional().describe("Animation-family filter (e.g. scroll, cards, menu, 3d-webgl)."),
      deps: z.array(z.string()).optional().describe("Require these runtime deps (e.g. [\"three\"], [\"lenis\"]). AND semantics."),
      maxPerfCost: enumOf(PERF_COST).optional().describe("Cap runtime weight: light | medium | heavy."),
      mobileSafe: z.boolean().optional().describe("If true, only components that degrade well on touch/small screens."),
      limit: z.number().int().min(1).max(50).optional().describe("Max results (default 12)."),
    },
  },
  async (args) => {
    const results = search(INDEX.components, args);
    return json({
      query: args.query ?? null,
      filters: { mood: args.mood, useCase: args.useCase, level: args.level, category: args.category, deps: args.deps, maxPerfCost: args.maxPerfCost, mobileSafe: args.mobileSafe },
      count: results.length,
      results,
      lexical_coverage_note:
        "`lexical_coverage` is the IDF-weighted fraction of your query that each hit actually " +
        "matched, and `missed_terms` are the words it did not. It is a FLOOR test, reliable in one " +
        "direction only: low coverage is good evidence the catalog has nothing for you; high " +
        "coverage is NOT proof of a good fit — a hit can cover the ordinary words of a query and " +
        "miss every word that defined it. Read `useWhen` and `category` before adopting anything.",
      next:
        "Call get_component with a slug to fetch its prompt and/or source. If you are building a " +
        "planned page, prefer suggest_mechanics({role, need}) — it filters by the role's real " +
        "catalog facets and can tell you the catalog has nothing, which this tool cannot.",
    });
  }
);

// ── get_component ────────────────────────────────────────────────────────────
server.registerTool(
  "get_component",
  {
    title: "Get component",
    description:
      "Fetch one component by slug. `include` controls the payload: 'meta' (full catalog record), " +
      "'preview' (thumbnail + live demo URL), 'prompt' (a self-contained brief to REBUILD it faithfully), " +
      "'source' (the actual index.html/styles.css/script.js to copy, plus an integration note). " +
      "Default: meta + preview + prompt. Add 'source' when you want the real code.",
    inputSchema: {
      slug: z.string().describe("Component slug, e.g. \"brandappart-sticky-cards\"."),
      include: z
        .array(z.enum(["meta", "preview", "prompt", "source"]))
        .optional()
        .describe("Which payloads to return. Default: [\"meta\",\"preview\",\"prompt\"]."),
    },
  },
  async ({ slug, include }) => {
    const c = BY_SLUG.get(slug);
    if (!c) {
      const near = INDEX.components.map((x) => x.slug).filter((s) => s.includes(slug) || slug.includes(s)).slice(0, 5);
      return fail(`Unknown slug "${slug}".${near.length ? " Did you mean: " + near.join(", ") + "?" : " Use search_components or list_components."}`);
    }
    const want = new Set(include?.length ? include : ["meta", "preview", "prompt"]);
    const out = { slug };

    if (want.has("meta")) out.meta = c;

    if (want.has("preview")) {
      out.preview = { thumb: `${INDEX.site}${c.thumb}`, demo: c.demo, promptUrl: c.promptUrl };
    }

    if (want.has("prompt")) {
      const p = resolve(ROOT, "components", slug, "prompt.md");
      out.prompt = c.hasPrompt && existsSync(p)
        ? { markdown: readFileSync(p, "utf8") }
        : { markdown: null, note: "No validated prompt for this component." };
    }

    if (want.has("source")) {
      // Solo el CÓDIGO del componente. `sourceFiles` incluye prompt.template.md, que es un prompt,
      // no código: contarlo hacía que esta rama pareciera tener fuente cuando no la tenía.
      const CODIGO = new Set(["index.html", "script.js", "styles.css"]);
      const files = c.sourceFiles.filter((n) => CODIGO.has(n)).map((name) => {
        const fp = resolve(ROOT, "components", slug, name);
        return existsSync(fp) ? { file: name, content: readFileSync(fp, "utf8") } : null;
      }).filter(Boolean);
      // El mirror público NO lleva el código fuente de los componentes: solo los prompts, que son
      // los que enseñan a reconstruir la mecánica. Cuando no está, se dice, en vez de devolver una
      // lista vacía que parezca un componente sin código.
      out.source = files.length ? {
        files,
        assetsPath: `${INDEX.site}/c/${slug}/`,
        assetCount: c.assetCount,
        integration: {
          level: c.level,
          deps: c.deps,
          gsapPlugins: c.gsapPlugins,
          hijacksScroll: c.hijacksScroll,
          needsWebgl: c.needsWebgl,
          note:
            "Standalone vanilla HTML/CSS/JS (ES-module imports). " +
            (c.hijacksScroll ? "Uses Lenis smooth-scroll — it takes over page scroll; run only one Lenis instance per page. " : "") +
            (c.level === "page" ? "This is a page-level piece (exclusive); don't compose two on one page. " : "") +
            (c.needsWebgl ? "Needs WebGL/Three.js. " : "") +
            "Image assets are served from the assetsPath above (replace with your own).",
        },
      } : {
        files: [],
        available: false,
        note:
          "This distribution ships the PROMPTS, not the component source. The prompt is the " +
          "product: it is a self-contained brief that rebuilds the mechanic from scratch, which is " +
          "how these components are meant to be used — adapted to your page, not pasted into it. " +
          "Call get_component with include:['prompt'] (or get_component_prompt for the prompt plus " +
          "the motion-system tokens). The live demo shows the finished behaviour.",
        demo: c.demo,
        promptUrl: c.promptUrl,
        integration: { level: c.level, deps: c.deps, gsapPlugins: c.gsapPlugins, hijacksScroll: c.hijacksScroll, needsWebgl: c.needsWebgl },
      };
    }
    return json(out);
  }
);

// ── list_facets ──────────────────────────────────────────────────────────────
server.registerTool(
  "list_facets",
  {
    title: "List facets",
    description:
      "Return the filter vocabulary (mood, useCase, level, perfCost, category, deps) with how many components " +
      "carry each value. Call this first to learn the exact values search_components accepts.",
    inputSchema: {},
  },
  async () => json({
    total: INDEX.count,
    vocab: { mood: MOOD, useCase: USE_CASE, level: RUNTIME_LEVEL, perfCost: PERF_COST },
    counts: INDEX.facets,
  })
);

// ── list_components ──────────────────────────────────────────────────────────
server.registerTool(
  "list_components",
  {
    title: "List components",
    description:
      "Browse the whole catalog as a compact list (slug, title, useWhen, mood, useCase, level, perfCost). " +
      "Use for an overview or when a brief is vague; use search_components when you have a specific brief.",
    inputSchema: {
      limit: z.number().int().min(1).max(500).optional().describe("Max items (default: all)."),
      offset: z.number().int().min(0).optional().describe("Skip N items (pagination)."),
    },
  },
  async ({ limit, offset = 0 }) => {
    const all = INDEX.components.map((c) => ({
      slug: c.slug, title: c.title, useWhen: c.useWhen,
      mood: c.mood, useCase: c.useCase, level: c.level, perfCost: c.perfCost,
    }));
    const page = all.slice(offset, limit ? offset + limit : undefined);
    return json({ total: all.length, offset, count: page.length, components: page });
  }
);

// ── list_motion_systems ──────────────────────────────────────────────────────
server.registerTool(
  "list_motion_systems",
  {
    title: "List motion systems",
    description:
      "The 8 motion systems of the library: token sets (ease/duration/stagger/lenis) derived from " +
      "the measured inventory, not invented. Use this FIRST when composing a page: pick one system " +
      "and render every component's prompt with it so the page moves coherently.",
    inputSchema: {},
  },
  async () => json(mpListSystems())
);

// ── get_motion_system ────────────────────────────────────────────────────────
server.registerTool(
  "get_motion_system",
  {
    title: "Get one motion system with its members",
    description: "Full token set of a motion system plus the components that are native to it.",
    inputSchema: { name: z.string().describe("System name, e.g. scrub-lagged.") },
  },
  async ({ name }) => {
    try { return json(getSystem(name)); }
    catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
  }
);

// ── search_components (motion-aware) ─────────────────────────────────────────
server.registerTool(
  "search_components_motion",
  {
    title: "Search components by measured motion metadata",
    description:
      "Filters by the CAPA-1 motion block (trigger, libs, complexity, motion system) rather than by " +
      "prose. Prefer this over search_components when composing a page: `category` describes how a " +
      "component LOOKS, `trigger`/`cluster` describe how it MOVES, and they disagree — the `slider` " +
      "label alone splits across 3 opposite physics.",
    inputSchema: {
      category: z.string().optional(),
      trigger: z.enum(["scroll", "hover", "click", "load", "pointer", "wheel", "drag"]).optional(),
      libs: z.array(z.string()).optional().describe("Todas deben estar presentes."),
      complexity: z.number().int().min(1).max(5).optional(),
      max_complexity: z.number().int().min(1).max(5).optional(),
      motion_system: z.string().optional(),
      limit: z.number().int().min(1).max(200).optional(),
    },
  },
  async (args) => {
    const results = mpSearch(args);
    return json({ count: results.length, results });
  }
);

// ── get_integration_contract ─────────────────────────────────────────────────
server.registerTool(
  "get_integration_contract",
  {
    title: "Integration contract for a set of components",
    description:
      "Given the slugs you intend to put on ONE page, returns: rule violations (hard, invalidate the " +
      "page), warnings, the measured budget (JS gzip / assets / scroll corridor), and an ordered init " +
      "plan — single Lenis instance, CustomEase registration, entry veil first, one ScrollTrigger." +
      "refresh() at the end, WebGL loop gating. Every step cites the evidence it comes from.",
    inputSchema: {
      slugs: z.array(z.string()).min(1),
      motion_system: z.string().optional(),
      moving_sections: z.union([z.number().int().min(0), z.array(z.string())]).optional()
        .describe("Las secciones que DEBEN moverse (plan_page → motion_coverage.must_move), o cuántas son. Con esto el contrato audita la cobertura y te dice si te has quedado corto."),
    },
  },
  async ({ slugs, motion_system, moving_sections }) => {
    try { return json(integrationContract(slugs, motion_system, moving_sections)); }
    catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
  }
);

// ── plan_imagery ─────────────────────────────────────────────────────────────
server.registerTool(
  "plan_imagery",
  {
    title: "Dirección de imagen de una página, sección a sección",
    description:
      "Qué imagen necesita cada sección, CON QUÉ MODELO se hace y cómo se redacta el prompt. Con la " +
      "arquitectura y el movimiento resueltos, lo que sigue delatando una página generada son las " +
      "imágenes: genéricas del sector en vez de específicas de la sección, sin una sola persona, y " +
      "todas rectángulos con fondo. Esta tool devuelve el enrutado por modelo (personas ≠ objetos ≠ " +
      "paisaje: no son intercambiables), la receta de transparencia (fondo magenta plano y quitado " +
      "después, porque ningún modelo devuelve alfa), la de las hojas de seis recortes por " +
      "generación, y de dónde salen los logotipos reales (Wikimedia, nunca generados). " +
      "NO genera imágenes, no usa ninguna clave y no hace ninguna llamada de red: devuelve texto. " +
      "Llámala DESPUÉS de plan_page y ANTES de escribir un solo prompt de imagen.",
    inputSchema: {
      brief: z.string().optional().describe("El mismo brief que le diste a plan_page."),
      archetype: z.string().optional(),
      sections: z.array(z.object({
        id: z.string(),
        role: z.string(),
        purpose: z.string().optional(),
      })).optional().describe("Las secciones de plan_page, tal cual. Sin esto sólo se devuelven las reglas generales."),
      palette: z.array(z.string()).optional().describe("La paleta ya fijada: las tomas obedecen al diseño, no al revés."),
    },
  },
  async ({ brief, archetype, sections, palette }) => {
    try { return json({ brief: brief ?? null, ...planImagen({ archetype, sections: sections ?? [], paleta: palette ?? null }) }); }
    catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
  }
);

// ── plan_page ────────────────────────────────────────────────────────────────
server.registerTool(
  "plan_page",
  {
    title: "Plan a page's information architecture from a brief",
    description:
      "Returns the SECTIONS a page of this kind needs — 10 to 14 of them, each with a role, what it " +
      "has to accomplish, what content it needs, and whether it should move — plus a motion system " +
      "and its tokens. It returns NO components on purpose: a page can only be as rich as the list " +
      "it is composed from, and composing from animation mechanics caps every page at five sections. " +
      "Ask for mechanics afterwards, one section at a time, with suggest_mechanics. " +
      "It also names the roles the catalog cannot cover, so you write those from the system tokens " +
      "instead of adopting the least-bad search hit. An optional `reference` contributes STATIC art " +
      "direction and biases the motion system — motion is NEVER derived from the reference.",
    inputSchema: {
      brief: z.string().describe("e.g. 'tostaduría de café de especialidad', 'agencia de software a medida'."),
      archetype: enumOf(Object.keys(ARQUETIPOS)).optional()
        .describe(`Fuerza el patrón de arquitectura en vez de detectarlo del brief. Uno de: ${Object.keys(ARQUETIPOS).join(", ")}`),
      reference: z.object({
        url: z.string().optional(),
        image: z.string().optional(),
        palette: z.array(z.string()).optional(),
        type_scale: z.string().optional(),
        density: z.string().optional(),
        motion_system_hint: z.string().optional().describe("Uno de los 8; sesga la elección."),
      }).optional(),
    },
  },
  async ({ brief, reference, archetype }) => {
    try { return json(planPage(brief, reference, { archetype })); }
    catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
  }
);

// ── suggest_mechanics ────────────────────────────────────────────────────────
server.registerTool(
  "suggest_mechanics",
  {
    title: "Mechanics for ONE section, by its role",
    description:
      "Given a section role from plan_page and what that section has to do, returns ranked candidate " +
      "components — filtered first by the catalog facets that actually correspond to the role, then " +
      "ranked by the free-text need. Prefer this over search_components when building a planned page. " +
      "Crucially, it can answer that the catalog has NOTHING for a role (counters, progress bars, " +
      "pricing tables, FAQ accordions, data tables) instead of returning the least-bad hit dressed up " +
      "as an answer — search_components cannot tell you that, and its top result for 'accordion' is a " +
      "horizontal image gallery. When the verdict is `none`, write the section from the motion system " +
      "tokens; that is a legitimate outcome, not a failure.",
    inputSchema: {
      role: enumOf(Object.keys(ROLES)).describe(`Section role from plan_page. One of: ${Object.keys(ROLES).join(", ")}`),
      need: z.string().optional().describe("What this section must do, in prose. e.g. 'the roast curve draws itself as you scroll'."),
      motion_system: z.string().optional().describe("The page's system; ranks compatible components first and is echoed back when there is nothing to adopt."),
      limit: z.number().int().min(1).max(20).optional().describe("Max candidates (default 5)."),
      avoid: z.array(z.string()).optional()
        .describe("Slugs to exclude — pass everything you already used on OTHER pages. Wide roles offer 100+ candidates whose top scores are statistically tied, so without this you will keep adopting the same handful. NOTE: `avoid` is for not repeating yourself, NOT for animating less — if you drop the #1 because it is taken, take the #2; never leave the section still."),
      adopted: z.array(z.string()).optional()
        .describe("What you have ALREADY adopted on THIS page. Candidates that would invalidate the page alongside them come back with `composes_with_adopted: false`, the reason in `collision`, and sorted last. Without this the tool is blind to the page you are building and the clash only surfaces at get_integration_contract, after you wrote the code."),
    },
  },
  async ({ role, need, motion_system, limit, avoid, adopted }) => {
    try { return json(suggestMechanics(role, need ?? "", motion_system, limit ?? 5, avoid ?? [], adopted ?? [])); }
    catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
  }
);

// ── suggest_page_treatments ──────────────────────────────────────────────────
server.registerTool(
  "suggest_page_treatments",
  {
    title: "Mechanics that apply to the PAGE, not to a section",
    description:
      "The twin of suggest_mechanics for the family that does not fill a section slot: smooth " +
      "scroll, the shaped edge BETWEEN two stacked sections, a background that runs behind the " +
      "whole page, a custom cursor, route transitions. These were unreachable from the planner " +
      "because the whole model assumed a mechanic occupies one slot in `sections` — which is why " +
      "a page could be planned end to end and still butt every section together with a straight " +
      "line. A treatment does NOT consume a section and does NOT count toward motion_coverage; it " +
      "adds on top. Some kinds are decisions rather than components (`scroll-suave`) and come back " +
      "with verdict `not-a-component` instead of a fake candidate list. Still pass whatever you " +
      "adopt to get_integration_contract: treatments compete for the same capabilities (scroll " +
      "owner, document height) as any other component.",
    inputSchema: {
      kind: enumOf(Object.keys(TRATAMIENTOS)).describe(`Treatment kind. One of: ${Object.keys(TRATAMIENTOS).join(", ")}`),
      need: z.string().optional().describe("What it has to do, in prose. Only reorders within the kind's pool."),
      motion_system: z.string().optional().describe("The page's system; echoed back when there is nothing to adopt."),
      limit: z.number().int().min(1).max(20).optional().describe("Max candidates (default 5)."),
      avoid: z.array(z.string()).optional().describe("Slugs to exclude."),
    },
  },
  async ({ kind, need, motion_system, limit, avoid }) => {
    try { return json(suggestTreatments(kind, need ?? "", motion_system, limit ?? 5, avoid ?? [])); }
    catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
  }
);

// ── get_component_prompt ─────────────────────────────────────────────────────
server.registerTool(
  "get_component_prompt",
  {
    title: "Get a component prompt + motion tokens (no rendering)",
    description:
      "THE way to get a build prompt. Returns three blocks: (a) the standalone prompt VERBATIM, " +
      "untouched; (b) the tokens of the requested motion system; (c) an explicit instruction telling " +
      "you to adapt (a) to (b) YOURSELF, preserving arithmetic relationships — if a duration holds up " +
      "a sum, a chained sequence or a ScrollTrigger `end`, recompute the whole set, never a lone " +
      "value. Replaces render_prompt, which substituted mechanically and produced prompts whose prose " +
      "contradicted their code (11/30 in judged evaluation). See DECISIONS.md D15 and D18.",
    inputSchema: {
      slug: z.string(),
      motion_system: z.string().optional().describe("Default: the component's native system."),
    },
  },
  async ({ slug, motion_system }) => {
    try { return json(componentPrompt(slug, motion_system)); }
    catch (e) { return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true }; }
  }
);

// ── render_prompt ────────────────────────────────────────────────────────────
server.registerTool(
  "render_prompt",
  {
    title: "[DEPRECATED — use get_component_prompt] Render a prompt by mechanical substitution",
    description:
      "DEPRECATED in favour of get_component_prompt. Mechanical substitution does not fit this " +
      "corpus: the prompts narrate their own numbers in prose, so replacing only the code values makes " +
      "prose and code specify different components (judged 11/30). Coverage is deliberately narrow: 164 of 219 components have ZERO substitutable " +
      "values because their prompts narrate their own numbers in prose ('over 4s', 'durations are 1'), " +
      "and substituting those would make prose and code contradict each other. For those components " +
      "this returns the prompt unchanged. See DECISIONS.md D15. " +
      "Returns the component's build prompt with its motion tokens (ease/duration/stagger) replaced " +
      "by the chosen motion system's values, so several components share one timing language. " +
      "Values that are STRUCTURAL to the effect (elastic overshoot, loop cadence, scrub linearity, " +
      "shader/physics constants) are never substituted — they come back listed under " +
      "'Valores no parametrizables'. Omit `system` to use the component's native one.",
    inputSchema: {
      slug: z.string().describe("Component slug."),
      system: z.string().optional().describe("Motion system name. Default: the component's native system."),
    },
  },
  async ({ slug, system }) => {
    try {
      const r = renderPrompt(slug, system);
      return json({
        slug, system: r.system,
        tokens_applied: r.applied.length,
        structural_preserved: r.structural.map((x) => ({ ...x, why: x.rule })),
        warnings: r.warnings,
        markdown: r.markdown,
      });
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// ── Resources (passive discovery / AEO) ──────────────────────────────────────
server.registerResource(
  "catalog",
  "motionprompts://catalog",
  { title: "motionprompts catalog", description: "Full component index with facets.", mimeType: "application/json" },
  async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(INDEX, null, 2) }] })
);

server.registerResource(
  "component",
  new ResourceTemplate("motionprompts://component/{slug}", {
    list: async () => ({
      resources: INDEX.components.map((c) => ({
        uri: `motionprompts://component/${c.slug}`,
        name: c.title,
        description: c.useWhen,
        mimeType: "application/json",
      })),
    }),
  }),
  { title: "Component record", description: "One component's full catalog record.", mimeType: "application/json" },
  async (uri, { slug }) => {
    const c = BY_SLUG.get(slug);
    if (!c) throw new Error(`Unknown component: ${slug}`);
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(c, null, 2) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[motionprompts-mcp] ready · ${INDEX.count} components (${INDEX.enriched} enriched)`);
