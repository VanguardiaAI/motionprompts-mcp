// Single source of truth for the motionprompts metadata vocabulary.
//
// The extended `meta.json` adds two blocks on top of the existing fields:
//   - `intent`  → how a component is CHOSEN (mood / use-case / when-to-use / aliases). Authored by hand
//                 (LLM-assisted) during the enrichment step. This is what powers "match by description".
//   - `runtime` → how a component BEHAVES when integrated (scroll hijack, WebGL, plugins, cost). Almost
//                 entirely auto-derived from fields that already exist (`deps`, `gsap`, `images`, `tags`).
//
// Everything downstream (build-registry, the MCP `search`/`list_facets` tools, the validator) reads these
// enums from here. Do not hard-code the lists anywhere else — extend them here and re-run the validator.

/**
 * MOOD — aesthetic / vibe of the component. Closed list so 200+ components stay searchable by
 * the adjectives a real brief uses ("una landing de lujo", "algo minimalista y editorial").
 * A component carries 1–3 of these. Keep the list orthogonal; add sparingly.
 */
export const MOOD = [
  "minimal",       // sparse, lots of whitespace, restrained motion
  "elegant",       // refined, smooth, understated sophistication
  "luxury",        // premium/high-end feel (fashion, watches, real estate)
  "editorial",     // magazine/fashion layout energy, type-driven
  "bold",          // high-contrast, loud, statement-making
  "playful",       // fun, bouncy, whimsical
  "corporate",     // serious, trustworthy, business/SaaS
  "retro",         // vintage / nostalgic (CRT, print, old-web)
  "futuristic",    // sci-fi, tech-forward, sleek
  "experimental",  // artsy, unconventional, gallery-piece
  "cinematic",     // dramatic, filmic pacing and reveals
  "brutalist",     // raw, grid-exposed, harsh
  "organic",       // fluid, natural, soft/liquid motion
  "technical",     // precise, data/engineering aesthetic
];

/**
 * USE_CASE — WHERE on a page / WHAT section the component serves. Orthogonal to `category`
 * (category = the animation family; useCase = the job on the page). A component carries 1–3.
 * This is the primary axis for "necesito X para la sección Y".
 */
export const USE_CASE = [
  "hero",              // above-the-fold statement / landing reveal
  "preloader",         // intro / loading sequence before content
  "page-transition",   // navigation between pages/routes
  "navigation",        // menus, navbars, overlay menus
  "footer",            // footer sections
  "gallery",           // multi-image grids / editorial galleries
  "slider",            // carousels / sliders / coverflow
  "card-deck",         // stacked / sticky / magnetic card sets
  "scroll-story",      // long scroll-driven narrative sections
  "image-reveal",      // reveal/uncover a single image on scroll or interaction
  "text-reveal",       // headline / paragraph reveal & split-text
  "hover-interaction",  // hover-driven micro-interactions
  "cursor-effect",     // cursor-following / spotlight / trail
  "logo",              // interactive logo / brand mark intros
  "background",        // ambient full-bleed backdrops (fluid, shader, noise)
  "product-showcase",  // 3D product / feature showcase
  "marquee",           // scrolling / magnetic marquees & tickers
  "team-section",      // team / people / roster sections
  "cta",               // call-to-action moments
  "contact",           // contact / footer-form sections
];

/** RUNTIME_LEVEL — how much of the page the component owns. Needs human/heuristic review. */
export const RUNTIME_LEVEL = [
  "page",     // takes over the whole page/scroll (Lenis-driven stories, full preloaders, transitions)
  "section",  // a self-contained section block you drop into an existing page
  "widget",   // a small embeddable element (hover fx, cursor, button, logo)
];

/** PERF_COST — rough runtime weight, to help an agent balance a page. Auto-derived first pass. */
export const PERF_COST = ["light", "medium", "heavy"];

/**
 * deriveRuntime(meta) — compute the auto-derivable `runtime` fields from EXISTING meta fields.
 * The build/enrichment step calls this so humans never hand-type these. `level` and `mobileSafe`
 * are intentionally NOT set here — they require judgement and are filled during review.
 */
export function deriveRuntime(meta) {
  const deps = meta.deps || [];
  const gsap = meta.gsap || [];
  const tags = meta.tags || [];
  const assetCount = (meta.images || []).length;

  const needsWebgl = deps.includes("three");
  const physics = deps.includes("matter-js");
  const lottie = deps.includes("lottie-web");
  const needsCanvas = needsWebgl || tags.includes("canvas");

  let perfCost = "light";
  if (needsWebgl || physics) perfCost = "heavy";
  else if (needsCanvas || gsap.length >= 2 || assetCount >= 20) perfCost = "medium";

  return {
    hijacksScroll: deps.includes("lenis"),
    needsWebgl,
    needsCanvas,
    physics,
    lottie,
    gsapPlugins: [...gsap],
    assetCount,
    perfCost,
  };
}

// Fields of `runtime` that deriveRuntime owns. Used by the validator to detect drift between a
// hand-edited meta and what the source actually implies.
export const DERIVED_RUNTIME_FIELDS = [
  "hijacksScroll",
  "needsWebgl",
  "needsCanvas",
  "physics",
  "lottie",
  "gsapPlugins",
  "assetCount",
  "perfCost",
];

const isStr = (v) => typeof v === "string";
const subset = (arr, allowed) => Array.isArray(arr) && arr.every((v) => allowed.includes(v));

/**
 * validateMeta(meta) → { errors, warnings }
 *   errors   → hard schema violations (invalid vocab value, wrong type). Must be fixed.
 *   warnings → migration gaps (block missing / not yet enriched) and runtime drift vs. source.
 * Legacy components (no intent/runtime yet) produce warnings, never errors — this is a migration tool.
 */
export function validateMeta(meta) {
  const errors = [];
  const warnings = [];

  // ---- intent (manual) ----
  if (!meta.intent) {
    warnings.push("intent: missing — needs enrichment (mood / useCase / useWhen / aliases)");
  } else {
    const it = meta.intent;
    if (!subset(it.mood, MOOD)) errors.push(`intent.mood: values outside vocab or wrong type → ${JSON.stringify(it.mood)}`);
    else if (it.mood.length < 1 || it.mood.length > 3) warnings.push(`intent.mood: expected 1–3 values, got ${it.mood.length}`);

    if (!subset(it.useCase, USE_CASE)) errors.push(`intent.useCase: values outside vocab or wrong type → ${JSON.stringify(it.useCase)}`);
    else if (it.useCase.length < 1 || it.useCase.length > 3) warnings.push(`intent.useCase: expected 1–3 values, got ${it.useCase.length}`);

    if (!isStr(it.useWhen) || !it.useWhen.trim()) warnings.push("intent.useWhen: missing one-line selection hint");
    else if (it.useWhen.length > 160) warnings.push(`intent.useWhen: too long (${it.useWhen.length} > 160 chars)`);

    if (it.aliases !== undefined && !(Array.isArray(it.aliases) && it.aliases.every(isStr)))
      errors.push("intent.aliases: must be an array of strings");
  }

  // ---- runtime (auto-derived + 2 manual) ----
  if (!meta.runtime) {
    warnings.push("runtime: missing — run deriveRuntime() then set level + mobileSafe");
  } else {
    const rt = meta.runtime;
    if (!RUNTIME_LEVEL.includes(rt.level)) errors.push(`runtime.level: must be one of ${RUNTIME_LEVEL.join("|")} → got ${JSON.stringify(rt.level)}`);
    if (rt.perfCost !== undefined && !PERF_COST.includes(rt.perfCost)) errors.push(`runtime.perfCost: must be one of ${PERF_COST.join("|")} → got ${JSON.stringify(rt.perfCost)}`);
    if (rt.mobileSafe !== undefined && rt.mobileSafe !== null && typeof rt.mobileSafe !== "boolean")
      errors.push("runtime.mobileSafe: must be boolean or null (unknown)");

    // Drift: does the stored runtime disagree with what the source implies?
    const derived = deriveRuntime(meta);
    for (const f of DERIVED_RUNTIME_FIELDS) {
      if (rt[f] === undefined) continue;
      const a = JSON.stringify(rt[f]);
      const b = JSON.stringify(derived[f]);
      if (a !== b) warnings.push(`runtime.${f}: drift — stored ${a} but source implies ${b}`);
    }
  }

  return { errors, warnings };
}

export const VOCAB = { MOOD, USE_CASE, RUNTIME_LEVEL, PERF_COST };
