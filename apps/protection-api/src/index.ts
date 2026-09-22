/**
 * Thin HTTP adapter over the `ctxvigil` SDK (FR-6.6–FR-6.10; contract §1, §9.1).
 *
 * **Transport only.** This module maps HTTP onto `guard.scanPage` /
 * `guard.checkAction` and SDK errors onto HTTP statuses. It holds no detector
 * phrase lists, no score weights, no thresholds, and no policy bands
 * (FR-6.7, architecture §4.4 — a grep for any of those outside
 * `packages/ctxvigil-core` must return nothing).
 *
 * Status contract (FR-6.8): a valid body → the SDK's answer, 200.
 * `CtxVigilError` → its mapped status with `toResponse()` (400 INVALID_REQUEST).
 * Unparseable or oversized JSON → 400 INVALID_REQUEST. Unknown routes/methods →
 * 404 NOT_FOUND. Anything else → 500 INTERNAL_ERROR with a generic message —
 * never a stack trace or internals.
 *
 * **One documented extension to §3.1.** The HTTP `check-action` body is exactly
 * contract §3.1 (`scanId`, `userTask`, `proposedAction`). The adapter *also*
 * accepts an optional `scan` object carrying the prior `/scan-page` response,
 * because contract §10 point 3 defines `checkAction` as taking the request "plus
 * the prior scan". Supplying it enables the finding-triggered block (FR-5.5);
 * omitting it is fully supported and never yields `allow` for a risky action
 * (FR-5.9). Saumya's dashboard may send either shape.
 */

import { readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import { createCtxVigil, CtxVigilError } from "ctxvigil";
import type { CtxVigil } from "ctxvigil";

/** Local base URL for the demo (contract §1). */
export const DEFAULT_PORT = 8787;

/** The only origin that receives CORS headers (contract §1, FR-6.9). */
export const DEFAULT_ALLOWED_ORIGIN = "http://localhost:5173";

/**
 * Read the version from this package's own manifest, so `/health` can never
 * drift from the released artifact (contract §1.1).
 */
export const PACKAGE_VERSION: string = (
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  }
).version;

/** Bodies larger than this are rejected before parsing (1 MiB). */
const MAX_BODY_BYTES = 1024 * 1024;

export interface AdapterOptions {
  port?: number;
  /** Overrides `DEFAULT_ALLOWED_ORIGIN`; the demo web origin stays the default. */
  allowedOrigin?: string;
  /** Testing seam: inject a guard to exercise the 500 path. Defaults to the real SDK. */
  guard?: CtxVigil;
}

/**
 * Apply the CORS policy: the demo origin only, never `*` (contract §1).
 *
 * A permitted origin gets the preflight contract too, so a browser POST with a
 * JSON content type survives its `OPTIONS` preflight.
 */
function applyCors(request: IncomingMessage, response: ServerResponse, allowedOrigin: string): void {
  response.setHeader("Vary", "Origin");
  if (request.headers.origin !== allowedOrigin) return;
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(
  response: ServerResponse,
  status: number,
  value: unknown,
): void {
  const body = `${JSON.stringify(value)}\n`;
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(body);
}

/** Read the full body or fail with a contract-shaped error payload. */
async function readJsonBody(request: IncomingMessage): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const chunks: Buffer[] = [];
  let received = 0;
  for await (const chunk of request) {
    const buffer = chunk as Buffer;
    received += buffer.length;
    if (received > MAX_BODY_BYTES) return { ok: false };
    chunks.push(buffer);
  }
  try {
    return { ok: true, value: JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown };
  } catch {
    return { ok: false };
  }
}

function invalidRequest(message: string, field?: string): { status: 400; body: unknown } {
  return {
    status: 400,
    body: {
      error: {
        code: "INVALID_REQUEST",
        message,
        ...(field === undefined ? {} : { field }),
      },
    },
  };
}

/** Build the app. `server.listen(port)` is the caller's job (tests pick 0). */
export function createApp(options: AdapterOptions = {}): Server {
  const guard = options.guard ?? createCtxVigil();
  const allowedOrigin = options.allowedOrigin ?? process.env["CTXVIGIL_ALLOWED_ORIGIN"] ?? DEFAULT_ALLOWED_ORIGIN;

  return createServer((request, response) => {
    void handle(request, response, allowedOrigin).catch(() => {
      // The last line of defence: a generic 500 with no internals (contract §9.1).
      if (!response.headersSent) {
        response.writeHead(500, { "Content-Type": "application/json" });
        response.end('{"error":{"code":"INTERNAL_ERROR","message":"Unexpected failure."}}\n');
      } else {
        response.end();
      }
    });
  });

  async function handle(
    request: IncomingMessage,
    response: ServerResponse,
    origin: string,
  ): Promise<void> {
    applyCors(request, response, origin);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, {
        status: "ok",
        service: "ctxvigil-protection-api",
        version: PACKAGE_VERSION,
      });
      return;
    }

    if (request.method === "POST" && (url.pathname === "/scan-page" || url.pathname === "/check-action")) {
      const parsed = await readJsonBody(request);
      if (!parsed.ok) {
        const failure = invalidRequest("Request body must be valid JSON within the size limit.");
        sendJson(response, failure.status, failure.body);
        return;
      }
      try {
        const result =
          url.pathname === "/scan-page"
            ? await guard.scanPage(parsed.value as never)
            : await guard.checkAction(parsed.value as never);
        sendJson(response, 200, result);
      } catch (error) {
        if (error instanceof CtxVigilError) {
          sendJson(response, error.status, error.toResponse());
        } else {
          throw error;
        }
      }
      return;
    }

    sendJson(response, 404, {
      error: {
        code: "NOT_FOUND",
        message: `Unknown route ${request.method ?? "?"} ${url.pathname}.`,
      },
    });
  }
}
