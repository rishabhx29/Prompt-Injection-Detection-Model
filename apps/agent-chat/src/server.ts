#!/usr/bin/env node
/**
 * Web chat server for the guarded agent — `npm run agent:web`.
 *
 * Serves the chat page and streams agent events to the browser as NDJSON so the
 * [layer] / [gate] verdicts appear live while the model works:
 *
 *   GET  /              → the chat page
 *   GET  /api/health    → { ok, model }
 *   POST /api/chat      → body { task } · NDJSON stream of { kind, text } events
 *
 * The agent is the same `runAgent` loop the terminal REPL uses; nothing about
 * the layer changes between interfaces.
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createCtxVigil } from "ctxvigil";

import { loadEnvFile, requireEnv } from "./env.ts";
import { runAgent } from "./agent.ts";

loadEnvFile();

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(HERE, "..", "public");
const PORT = Number(process.env["AGENT_CHAT_PORT"] ?? 5174);

const MODEL = process.env["GEMINI_MODEL"] ?? "gemini-flash-latest";

let cachedApiKey: string | undefined;

function getApiKey(): string {
  if (cachedApiKey === undefined) cachedApiKey = requireEnv("GEMINI_API_KEY");
  return cachedApiKey;
}

/** Minimal NDJSON stream helper. */
function writeEvent(response: import("node:http").ServerResponse, record: { kind: string; text: string }): void {
  response.write(`${JSON.stringify(record)}\n`);
}

const server = createServer((request, response) => {
  void (async () => {
    const url = new URL(request.url ?? "/", `http://localhost:${PORT}`);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      try {
        const html = await readFile(path.join(PUBLIC_DIR, "index.html"), "utf8");
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(html);
      } catch {
        response.writeHead(500).end("chat page missing");
      }
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      const hasKey = process.env["GEMINI_API_KEY"] !== undefined;
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: hasKey, model: MODEL, guard: "ctxvigil in-process" }));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      let body = "";
      for await (const chunk of request) body += chunk;
      let task = "";
      try {
        const parsed = JSON.parse(body) as { task?: unknown };
        task = typeof parsed.task === "string" ? parsed.task.trim() : "";
      } catch {
        response.writeHead(400).end(JSON.stringify({ error: "invalid JSON body" }));
        return;
      }
      if (task === "") {
        response.writeHead(400).end(JSON.stringify({ error: "task is required" }));
        return;
      }

      response.writeHead(200, {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      try {
        await runAgent({
          task,
          guard: createCtxVigil(),
          apiKey: getApiKey(),
          model: MODEL,
          onEvent: (event) => writeEvent(response, event),
        });
      } catch (error) {
        writeEvent(response, {
          kind: "error",
          text: error instanceof Error ? error.message : String(error),
        });
      } finally {
        response.end();
      }
      return;
    }

    response.writeHead(404).end("not found");
  })().catch((error: unknown) => {
    response.writeHead(500).end(error instanceof Error ? error.message : String(error));
  });
});

server.listen(PORT, () => {
  const hasKey = process.env["GEMINI_API_KEY"] !== undefined;
  console.log(`CtxVigil agent chat → http://localhost:${PORT}`);
  console.log(`  model ${MODEL} · guard ctxvigil (in-process) · key ${hasKey ? "loaded" : "MISSING (set GEMINI_API_KEY in .env)"}`);
});

export { server, PORT };
