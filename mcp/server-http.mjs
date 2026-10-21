// El MISMO servidor MCP, servido por HTTP (Streamable HTTP, sin estado) en vez de stdio.
//
//   MCP_HTTP_HOST=127.0.0.1 MCP_HTTP_PORT=4478 node mcp/server-http.mjs
//
// En producción corre bajo PM2 atado a la pasarela de la red del proxy (solo el nginx-proxy
// lo alcanza) y nginx lo publica en https://motionprompts.dev/mcp. Cualquier cliente MCP lo
// añade sin clonar nada:
//
//   claude mcp add --transport http motionprompts https://motionprompts.dev/mcp
//
// SIN ESTADO a propósito (sessionIdGenerator: undefined): cada POST es autosuficiente, no hay
// sesiones que caduquen ni que ocupen memoria, y un reinicio no corta nada. El precio es un
// buildServer() por petición — milisegundos: los datos pesados se cargan una vez a nivel de
// módulo en server.mjs. enableJsonResponse devuelve JSON llano en vez de SSE, que es lo que
// esperan los clientes stateless.
//
// Desde 2026-09 SÍ mira una credencial, y solo una: `Authorization: Bearer mpk_...`, la clave MCP
// del plan Full Stack. Se verifica contra la base de datos de premium en SOLO LECTURA (si el
// fichero no existe todavía, la clave simplemente no vale y se sirve el catálogo gratuito). Sin
// clave el servidor responde igual que siempre, pero los prompts de pago salen recortados.
// Sigue sin hacer llamadas de red salientes.
import { createServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./server.mjs";
import { verifyKey } from "../premium/lib/keys.mjs";

const PORT = Number(process.env.MCP_HTTP_PORT ?? 4478);
const HOST = process.env.MCP_HTTP_HOST ?? "127.0.0.1";
const MAX_BODY = 256 * 1024; // las peticiones MCP legítimas son KBs; esto para los curl creativos

// CORS abierto: el servidor es público, de solo lectura y sin credenciales. Los encabezados
// mcp-* van en la lista porque los clientes de navegador los mandan en el preflight.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

// Plan de esta petición. Una clave inválida, revocada o de un plan que ya no existe no es un
// error: es un cliente gratuito. Rechazarla con 401 solo serviría para que un scraper supiera
// cuándo acierta.
function planDeLaPeticion(req) {
  const auth = req.headers.authorization;
  if (typeof auth !== "string" || !/^Bearer\s+mpk_/i.test(auth)) return "free";
  const cuenta = verifyKey(auth.replace(/^Bearer\s+/i, "").trim());
  return cuenta ? cuenta.plan : "free";
}

const rpcError = (res, status, code, message) => {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }));
};

const httpd = createServer(async (req, res) => {
  const path = new URL(req.url, `http://${req.headers.host ?? "localhost"}`).pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }
  // Sonda de vida para PM2/monitorización — no forma parte del protocolo.
  if (req.method === "GET" && path === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json", ...CORS });
    return res.end(JSON.stringify({ ok: true }));
  }
  // /.well-known/mcp también: hay auditores que hacen el handshake contra la URL del
  // manifiesto. nginx sirve ahí el JSON estático en GET y nos proxya el resto de métodos.
  if (path !== "/mcp" && path !== "/" && path !== "/.well-known/mcp") {
    return rpcError(res, 404, -32000, "Not found. The MCP endpoint is POST /mcp.");
  }
  if (req.method !== "POST") {
    // Sin sesiones no hay stream SSE que reanudar (GET) ni sesión que cerrar (DELETE).
    return rpcError(res, 405, -32000, "Method not allowed. This is a stateless MCP endpoint: POST only.");
  }

  let raw = "";
  let excedido = false;
  req.on("data", (chunk) => {
    raw += chunk;
    if (raw.length > MAX_BODY && !excedido) {
      excedido = true;
      rpcError(res, 413, -32000, "Request body too large.");
      req.destroy();
    }
  });
  req.on("end", async () => {
    if (excedido) return;
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return rpcError(res, 400, -32700, "Parse error: body is not valid JSON.");
    }
    try {
      // El SDK exige `Accept: application/json, text/event-stream` y rechaza con 406 a los
      // clientes que mandan solo application/json (o nada). En modo JSON sin estado la
      // respuesta es JSON siempre, así que normalizamos el encabezado en vez de rebotar.
      // OJO: hay que tocar rawHeaders, no solo headers — el transporte del SDK convierte la
      // petición con Hono, que reconstruye las cabeceras desde rawHeaders.
      for (let i = req.rawHeaders.length - 2; i >= 0; i -= 2) {
        if (req.rawHeaders[i].toLowerCase() === "accept") req.rawHeaders.splice(i, 2);
      }
      req.rawHeaders.push("Accept", "application/json, text/event-stream");
      req.headers.accept = "application/json, text/event-stream";
      const server = buildServer({ plan: planDeLaPeticion(req) });
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      res.on("close", () => { transport.close(); server.close(); });
      for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      console.error("[mcp-http]", err);
      if (!res.headersSent) rpcError(res, 500, -32603, "Internal error.");
    }
  });
});

httpd.listen(PORT, HOST, () => {
  console.log(`[motionprompts-mcp] http listo en ${HOST}:${PORT} (POST /mcp · GET /healthz)`);
});
