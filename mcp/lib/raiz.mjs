// Raíz del catálogo.
//
// El servidor y el motor de reglas leen la misma estructura: `src/mcp-index.json`,
// `generated/motion/*.json` y `components/<slug>/{meta.json,prompt.md,…}`. El paquete publicado es
// un SUBCONJUNTO del repositorio con esa estructura intacta (ver el campo `files` de package.json),
// así que la raíz es la misma en los dos casos y las rutas relativas no cambian.
//
// La primera versión de esto empaquetaba el catálogo aparte, en mcp/data/. Se descartó: dejaba DOS
// copias de los mismos artefactos —scripts/check-composition.mjs resuelve su propia raíz y seguía
// leyendo generated/— y dos copias es una que se queda vieja sin avisar.
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
