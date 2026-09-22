/**
 * HTTP adapter tests (ticket 07; FR-6.6–FR-6.10; contract §1, §9.1).
 *
 * The adapter is pure transport: it maps HTTP onto the SDK and SDK errors onto
 * HTTP statuses, and nothing else (architecture §4.4). Tests boot the server on
 * an ephemeral port, so no fixed port can collide and no external service is needed.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, describe, it } from "node:test";

import { createApp } from "../src/index.ts";

const SAMPLE_DIR = new URL("../../../sample-data/", import.meta.url);
const ORIGIN = "http://localhost:5173";

interface Running {
  base: string;
  close: () => Promise<void>;
}

async function boot(options: Parameters<typeof createApp>[0] = {}): Promise<Running> {
  const server = createApp(options);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("the test server did not bind a TCP port");
  }
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
  };
}

const running = await boot();
after(() => running.close());

function sample(relative: string): unknown {
  return JSON.parse(readFileSync(new URL(relative, SAMPLE_DIR), "utf8")) as unknown;
}

async function post(path: string, body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(`${running.base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("GET /health", () => {
  it("responds 200 with the contract liveness body", async () => {
    const response = await fetch(`${running.base}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: "ok",
      service: "ctxvigil-protection-api",
      version: "0.1.0",
    });
  });
});

describe("POST /scan-page", () => {
  it("returns the same decision as a direct SDK import (FR-6.5)", async () => {
    const { scanPage } = await import("ctxvigil");
    const body = sample("scan-requests/aria-injection.json");
    const direct = await scanPage(body);
    const response = await post("/scan-page", body);
    assert.equal(response.status, 200);
    const viaHttp = (await response.json()) as typeof direct;
    // The adapter is a transport: the whole response must match, not just the decision.
    assert.deepEqual(viaHttp, direct);
    assert.equal(viaHttp.scanId, "refund-aria-attack-001");
  });

  it("rejects a malformed body with 400 and a machine-readable error (FR-6.8)", async () => {
    const response = await post("/scan-page", { scanId: "x" });
    assert.equal(response.status, 400);
    const body = (await response.json()) as {
      error: { code: string; message: string; field?: string };
    };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(typeof body.error.message, "string");
    assert.notEqual(body.error.message.trim(), "");
    assert.equal(body.error.field, "userTask");
  });

  it("rejects unparseable JSON with 400, not 500", async () => {
    const response = await post("/scan-page", "{not json", { "Content-Type": "application/json" });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });
});

describe("POST /check-action", () => {
  it("blocks the unsafe action from the untrusted aria page", async () => {
    const { scanPage } = await import("ctxvigil");
    const scan = await scanPage(sample("scan-requests/aria-injection.json"));
    const actionRequest = sample("action-checks/aria-injection-change-email.json");
    const response = await post("/check-action", { ...(actionRequest as object), scan });
    assert.equal(response.status, 200);
    const body = (await response.json()) as { decision: string; allowed: boolean };
    assert.equal(body.decision, "block");
    assert.equal(body.allowed, false);
  });

  it("matches the SDK's checkAction result for the same scan and request (FR-6.5)", async () => {
    const { checkAction, scanPage } = await import("ctxvigil");
    const scan = await scanPage(sample("scan-requests/aria-injection.json"));
    const actionRequest = sample("action-checks/aria-injection-change-email.json");
    const direct = await checkAction({ ...(actionRequest as object), scan } as never);
    const response = await post("/check-action", { ...(actionRequest as object), scan });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), direct);
  });

  it("rejects a malformed action body with 400", async () => {
    const response = await post("/check-action", { scanId: "x", userTask: "y" });
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string; field?: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
    assert.equal(body.error.field, "proposedAction");
  });

  it("lets the gate decide without a prior scan, never assuming safe (FR-5.9)", async () => {
    const actionRequest = sample("action-checks/unrelated-account-action-change-email.json");
    const response = await post("/check-action", actionRequest);
    assert.equal(response.status, 200);
    const body = (await response.json()) as { decision: string; allowed: boolean };
    assert.equal(body.decision, "block");
    assert.equal(body.allowed, false);
  });
});

describe("routing, CORS, and failures (FR-6.8, FR-6.9)", () => {
  it("answers 404 with a machine-readable body on unknown routes", async () => {
    const response = await fetch(`${running.base}/no-such-route`);
    assert.equal(response.status, 404);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "NOT_FOUND");
  });

  it("answers 404 on an unknown method, never implying safe", async () => {
    const response = await fetch(`${running.base}/health`, { method: "POST" });
    assert.equal(response.status, 404);
  });

  it("echoes CORS only for the demo web origin", async () => {
    const allowed = await fetch(`${running.base}/health`, {
      headers: { Origin: ORIGIN },
    });
    assert.equal(allowed.headers.get("access-control-allow-origin"), ORIGIN);

    const denied = await fetch(`${running.base}/health`, {
      headers: { Origin: "https://evil.test" },
    });
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
  });

  it("rejects an oversized body with 400, not 500", async () => {
    const response = await post("/scan-page", JSON.stringify({ pad: "x".repeat(1024 * 1024 + 16) }));
    assert.equal(response.status, 400);
    const body = (await response.json()) as { error: { code: string } };
    assert.equal(body.error.code, "INVALID_REQUEST");
  });

  it("answers a permitted preflight with allow-methods and allow-headers", async () => {
    const response = await fetch(`${running.base}/scan-page`, {
      method: "OPTIONS",
      headers: {
        Origin: ORIGIN,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
    assert.ok((response.headers.get("access-control-allow-methods") ?? "").includes("POST"));
    assert.ok((response.headers.get("access-control-allow-headers") ?? "").includes("Content-Type"));
  });

  it("honours an overridden allowed origin", async () => {
    const custom = await boot({ allowedOrigin: "http://localhost:4321" });
    try {
      const allowed = await fetch(`${custom.base}/health`, {
        headers: { Origin: "http://localhost:4321" },
      });
      assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:4321");
      const demoDefault = await fetch(`${custom.base}/health`, { headers: { Origin: ORIGIN } });
      assert.equal(demoDefault.headers.get("access-control-allow-origin"), null);
    } finally {
      await custom.close();
    }
  });
});

describe("unexpected failures never leak internals (FR-6.8, architecture §7)", () => {
  it("maps a non-SDK throw to a generic 500 INTERNAL_ERROR", async () => {
    const failing = await boot({
      guard: {
        scanPage: () => {
          throw new Error("internal detail that must not leak");
        },
        checkAction: () => {
          throw new Error("internal detail that must not leak");
        },
      } as never,
    });
    try {
      const response = await fetch(`${failing.base}/scan-page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sample("scan-requests/safe-refund-page.json")),
      });
      assert.equal(response.status, 500);
      const raw = await response.text();
      assert.ok(raw.includes("INTERNAL_ERROR"));
      assert.ok(!raw.includes("internal detail"), "the thrown message must not leak");
      assert.ok(!raw.includes("stack"));
    } finally {
      await failing.close();
    }
  });
});

describe("a truncated body leaves no stack-bearing response", () => {
  it("closes the connection quietly when Content-Length is unmet", async () => {
    // Raw socket, because fetch refuses to send a mismatched Content-Length itself.
    const { default: net } = await import("node:net");
    const address = new URL(running.base);
    const raw = await new Promise<string>((resolve, reject) => {
      const socket = net.connect(Number(address.port), "127.0.0.1", () => {
        socket.write(
          "POST /scan-page HTTP/1.1\r\n" +
            "Host: 127.0.0.1\r\n" +
            "Content-Type: application/json\r\n" +
            "Content-Length: 9999\r\n" +
            "Connection: close\r\n\r\n" +
            "{",
        );
        socket.end();
      });
      let data = "";
      socket.on("data", (chunk) => {
        data += chunk.toString();
      });
      socket.on("end", () => resolve(data));
      socket.on("error", reject);
    });
    assert.ok(!raw.includes("stack"), "no internals may leak over the socket");
  });
});
