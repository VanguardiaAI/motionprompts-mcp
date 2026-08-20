// Pure, dependency-free retrieval over the MCP catalog. Kept separate from the server so it can be
// unit-tested / evaluated without stdio. Strategy: cheap hard facet filters first (scales to 1000s),
// then weighted keyword scoring over the enriched fields. The interface is deliberately
// implementation-agnostic — swapping in embeddings later means changing scoreComponent(), nothing else.

const STOP = new Set([
  "de","la","el","los","las","un","una","unos","unas","para","por","con","que","del","al","en","y","o","u",
  "se","lo","le","su","sus","me","te","nos","les","mi","tu","es","son","como","mas","muy","si","ya","hacer",
  // domain noise — every useWhen starts "Úsalo cuando quieras…"
  "usalo","cuando","quieras","quieres","quiera",
  "the","a","an","for","of","and","or","to","with","that","this","when","where","your","you","it","on","in",
]);

// Fold accents + lowercase so "galería" matches "galeria" and Spanish queries hit English vocab.
export function fold(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function tokenize(s) {
  return fold(s).split(/[^a-z0-9]+/).filter((t) => t.length >= 2 && !STOP.has(t));
}

const PERF_RANK = { light: 1, medium: 2, heavy: 3 };

// Weighted fields. Higher weight = stronger signal for a match.
const FIELDS = [
  ["title", 3.0],
  ["aliases", 3.0],
  ["mood", 2.5],
  ["useCase", 2.5],
  ["tags", 2.0],
  ["useWhen", 1.5],
  ["category", 1.5],
  ["description", 1.0],
];

function fieldText(c, field) {
  const v = c[field];
  if (Array.isArray(v)) return v.join(" ");
  return v ?? "";
}

// IDF: rare tokens ("apiladas", "crt") should outweigh corpus-frequent ones ("scroll", "hover").
// Document frequency is computed once per catalog and cached by array reference.
const dfCache = new WeakMap();
function docFreq(components) {
  if (dfCache.has(components)) return dfCache.get(components);
  const df = new Map();
  for (const c of components) {
    const seen = new Set();
    for (const [field] of FIELDS) for (const t of tokenize(fieldText(c, field))) seen.add(t);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const info = { df, N: components.length };
  dfCache.set(components, info);
  return info;
}
const idf = (token, { df, N }) => Math.log((N + 1) / ((df.get(token) ?? 0) + 1)) + 0.5;

function passFilters(c, f) {
  if (f.mood?.length && !f.mood.some((m) => c.mood.includes(m))) return false;
  if (f.useCase?.length && !f.useCase.some((u) => c.useCase.includes(u))) return false;
  if (f.level?.length && !f.level.includes(c.level)) return false;
  if (f.category?.length && !f.category.includes(c.category)) return false;
  if (f.deps?.length && !f.deps.every((d) => c.deps.includes(d))) return false;
  if (f.maxPerfCost && (PERF_RANK[c.perfCost] ?? 3) > (PERF_RANK[f.maxPerfCost] ?? 3)) return false;
  if (typeof f.mobileSafe === "boolean" && c.mobileSafe !== f.mobileSafe) return false;
  return true;
}

function scoreComponent(c, qTokens, qPhrase, idfInfo) {
  let score = 0;
  const matched = {}; // field -> Set(tokens)
  const cubiertos = new Set(); // unión de tokens de la consulta que casaron en ALGÚN campo

  for (const [field, weight] of FIELDS) {
    const toks = new Set(tokenize(fieldText(c, field)));
    const raw = fold(fieldText(c, field));
    for (const qt of qTokens) {
      // exact token hit, or substring for longer tokens (handles plurals / partials)
      const hit = toks.has(qt) || (qt.length >= 4 && raw.includes(qt));
      if (hit) {
        score += weight * idf(qt, idfInfo);
        (matched[field] ??= new Set()).add(qt);
        cubiertos.add(qt);
      }
    }
  }

  // Phrase bonus — a near-name match ("cartas apiladas", "monitor crt") should dominate.
  if (qPhrase.length >= 4) {
    if (fold(c.title).includes(qPhrase)) score += 6;
    if (fold(fieldText(c, "aliases")).includes(qPhrase)) score += 6;
    if (fold(c.slug).includes(qPhrase.replace(/\s+/g, "-"))) score += 5;
    if (fold(c.useWhen).includes(qPhrase)) score += 2;
  }

  const why = Object.entries(matched)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 3)
    .map(([field, set]) => `${field}: ${[...set].join(", ")}`);

  // Cobertura: qué fracción del PESO de la consulta casó de verdad. La puntuación cruda no sirve
  // para decidir si hay respuesta o no — es una suma sin techo, y un componente puede sumar 30
  // acertando solo "scroll" y "animated", los dos tokens más frecuentes del corpus. La cobertura
  // sí lo dice: pondera por IDF, así que acertar los tokens raros de la consulta ("dashoffset",
  // "accordion") vale mucho y acertar los comunes vale poco.
  const pesoConsulta = qTokens.reduce((a, t) => a + idf(t, idfInfo), 0);
  const pesoCubierto = [...cubiertos].reduce((a, t) => a + idf(t, idfInfo), 0);
  const coverage = pesoConsulta ? pesoCubierto / pesoConsulta : 0;
  const missed = qTokens.filter((t) => !cubiertos.has(t));

  return { score, why, coverage, missed };
}

// La cobertura es un test de SUELO, no de techo, y conviene no venderla como otra cosa. Medida
// contra las ocho consultas por rol de la página de café (examples/grieta/README.md):
//
//   cifras  0,16   cartas 0,30   → huecos reales del catálogo. La cobertura baja acierta.
//   barra   0,59   → infinite-horizontal-scroll. Cobertura ALTA y aun así es un fallo: casó las
//                    palabras corrientes de la consulta y ninguna de las que la definían.
//   entrada 0,35   → lusion-lp-reveal. Cobertura BAJA y aun así es el acierto: el catálogo
//                    describe sus velos con otro vocabulario.
//
// O sea: cobertura baja es señal fiable de que no hay nada; cobertura alta NO es prueba de que
// haya algo. Por eso las etiquetas describen lo que se mide (solape léxico) y no un veredicto, y
// el veredicto de verdad lo da suggest_mechanics cruzando con el rol, que es conocimiento curado.
const ALTA = 0.55;
const MEDIA = 0.35;

export function nivelLexico(cobertura) {
  if (cobertura >= ALTA) return "high";
  if (cobertura >= MEDIA) return "medium";
  return "low";
}

function skinny(c) {
  return {
    slug: c.slug,
    title: c.title,
    useWhen: c.useWhen,
    mood: c.mood,
    useCase: c.useCase,
    level: c.level,
    perfCost: c.perfCost,
    mobileSafe: c.mobileSafe,
    category: c.category,
    deps: c.deps,
    thumb: c.thumb,
    demo: c.demo,
    hasPrompt: c.hasPrompt,
    hasSource: c.hasSource,
  };
}

/**
 * search(components, params) → ranked skinny hits with score + why.
 * params: { query?, mood?, useCase?, level?, category?, deps?, maxPerfCost?, mobileSafe?, limit? }
 */
export function search(components, params = {}) {
  const { query = "", limit = 12 } = params;
  const pool = components.filter((c) => passFilters(c, params));

  if (!query.trim()) {
    return pool
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, limit)
      .map((c) => ({ ...skinny(c), score: 0, why: [] }));
  }

  // tokens únicos: repetir una palabra en la consulta no debe inflar ni la puntuación ni el peso
  const qTokens = [...new Set(tokenize(query))];
  const qPhrase = fold(query).replace(/\s+/g, " ").trim();
  const idfInfo = docFreq(components);
  return pool
    .map((c) => ({ c, ...scoreComponent(c, qTokens, qPhrase, idfInfo) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.title.localeCompare(b.c.title))
    .slice(0, limit)
    .map(({ c, score, why, coverage, missed }) => ({
      ...skinny(c),
      score: Math.round(score * 10) / 10,
      lexical_coverage: Math.round(coverage * 100) / 100,
      lexical: nivelLexico(coverage),
      missed_terms: missed,
      why,
    }));
}
