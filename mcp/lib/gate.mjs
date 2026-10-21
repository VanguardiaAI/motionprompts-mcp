// Muro de pago del MCP. Desde 2026-09 la mayoría de los prompts y todo el código fuente son de
// pago (docs/premium/DECISIONES.md §3): este módulo decide, con el plan que trae la petición, si
// se devuelve el texto entero o las doce primeras líneas más la nota que explica cómo desbloquearlo.
//
// El plan llega por `Authorization: Bearer mpk_…` en el transporte HTTP (mcp/server-http.mjs).
// Por stdio no hay cabeceras: se usa MP_MCP_PLAN, que es para el uso local de Pablo, y por
// defecto `free`.
//
// La tabla de capacidades es de `premium/plans.mjs`, que es la única fuente. Se importa en
// caliente y con red de seguridad porque el PAQUETE PUBLICADO del MCP (scripts/pack-mcp.mjs) no
// lleva el directorio premium/: allí el import falla y el servidor tiene que seguir arrancando,
// gratis y sin prompts de pago, en vez de reventar.
let CAPS = { prompt: ["unlimited", "fullstack"], source: ["fullstack"] };
try {
  const plans = await import("../../premium/plans.mjs");
  CAPS = plans.CAPS;
} catch {
  // Distribución sin premium/: se queda la tabla de arriba, que dice lo mismo.
}

export const PREVIEW_LINES = 12;

export const can = (plan, cap) => (CAPS[cap] || []).includes(plan);

// Las 12 primeras líneas NO vacías. Misma regla que el servidor premium y que el preview
// estático de la ficha: lo que enseña el escaparate tiene que ser exactamente lo mismo en los
// tres sitios, o el "ya lo he visto" del cliente deja de cuadrar.
export const preview = (text) =>
  String(text).split("\n").filter((l) => l.trim()).slice(0, PREVIEW_LINES).join("\n") + "\n...";

const HOW =
  "Get a key at https://motionprompts.dev/account/ and pass it as `Authorization: Bearer mpk_...`. " +
  "Pricing: https://motionprompts.dev/pricing/";

export const NOTE_PROMPT = `This prompt requires the Unlimited plan (Full Stack for MCP access). ${HOW}`;
export const NOTE_SOURCE = `The component source is part of the Full Stack plan. ${HOW}`;

// `access` viene del índice (src/mcp-index.json, campo nuevo de esta tanda). Si todavía no está
// —índice construido antes del cambio— se trata como `free`: el muro no se inventa restricciones
// sobre datos que no existen.
export const accessOf = (record) => (record && record.access === "paid" ? "paid" : "free");

// Devuelve el bloque `prompt` ya resuelto: entero, o recortado con su nota.
export function gatePrompt(record, text, plan) {
  if (accessOf(record) === "free" || can(plan, "prompt")) return { markdown: text };
  return {
    markdown: preview(text),
    gated: true,
    access: "paid",
    requires: "unlimited",
    note: NOTE_PROMPT,
  };
}

// Para el bloque `source`, que es de otro plan (Full Stack) aunque el ítem sea free: el código es
// el producto del plan de arriba, no una consecuencia del prompt.
export function gateSource(plan) {
  if (can(plan, "source")) return null;
  return {
    files: [],
    available: false,
    gated: true,
    requires: "fullstack",
    note: NOTE_SOURCE,
  };
}
