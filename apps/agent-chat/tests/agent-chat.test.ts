/**
 * Offline tests for the guarded agent loop.
 *
 * Gemini is faked with a scripted `fetchImpl`, and the pages are fetched from a
 * stub HTTP server that serves the real fixture markup. Every other piece is the
 * production code path: the real `ctxvigil` SDK, the real extractor, the real
 * gate — so the tests verify the layer's behaviour, not a mock of it.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createCtxVigil } from "ctxvigil";

import { runAgent, firstUrl, type AgentTurnEvent } from "../src/agent.ts";
import { TOOL_DECLARATIONS, readPage, proposeAction, RISK_CATEGORIES } from "../src/tools.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.resolve(HERE, "..", "..", "demo-web", "public", "fixtures");

/** Scripted Gemini: pops queued responses, asserting the call order. */
function fakeGemini(responses: Array<Record<string, unknown>>): typeof fetch {
  let index = 0;
  return (async (input: unknown) => {
    const next = responses[index];
    index += 1;
    if (next === undefined) throw new Error(`fakeGemini ran out of scripted responses (call ${index})`);
    return {
      ok: true,
      status: 200,
      json: async () => next,
      text: async () => JSON.stringify(next),
    } as unknown as Response;
  }) as typeof fetch;
}

function modelText(text: string): Record<string, unknown> {
  return { candidates: [{ content: { parts: [{ text }] } }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } };
}

function modelCalls(...calls: Array<{ name: string; args: Record<string, unknown> }>): Record<string, unknown> {
  return {
    candidates: [{ content: { parts: calls.map((call) => ({ functionCall: call })) } }],
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
  };
}

/** Serve the real fixture pages on a local port. */
async function startFixtureServer(): Promise<{ url: (page: string) => string; close: () => Promise<void> }> {
  const server = createServer((request, response) => {
    void (async () => {
      const name = new URL(request.url ?? "/", "http://localhost").pathname.replace(/^\//u, "") || "index.html";
      try {
        const html = await readFile(path.join(FIXTURE_DIR, name), "utf8");
        response.writeHead(200, { "Content-Type": "text/html" }).end(html);
      } catch {
        response.writeHead(404).end("not found");
      }
    })().catch(() => response.writeHead(500).end());
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address !== null ? address.port : 0;
  return {
    url: (page: string) => `http://localhost:${port}/${page}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

const guard = createCtxVigil();

describe("tools", () => {
  test("declarations expose exactly the two guarded chokepoints with valid schemas", () => {
    assert.deepEqual(TOOL_DECLARATIONS.map((d) => d.name), ["read_page", "propose_action"]);
    assert.ok(RISK_CATEGORIES.includes("account_change"));
    for (const declaration of TOOL_DECLARATIONS) {
      assert.equal(declaration.parameters.type, "object");
      assert.ok(Object.keys(declaration.parameters.properties ?? {}).length > 0);
    }
  });

  test("readPage withholds the payload: model payload never contains blocked text", async () => {
    const fixtureServer = await startFixtureServer();
    try {
      const outcome = await readPage({
        url: fixtureServer.url("aria-injection.html"),
        scanId: "test-aria",
        userTask: "Summarize the refund policy.",
        guard,
      });

      assert.equal(outcome.scan.decision, "block");
      const payloadJson = JSON.stringify(outcome.modelPayload);
      const payload = outcome.scan.blockedContent[0] ?? "";
      assert.ok(payload.length > 0, "expected a withheld segment");
      assert.ok(!payloadJson.includes(payload), "withheld text must never reach the model payload");
      assert.ok(Array.isArray(outcome.modelPayload["approvedContent"]));
    } finally {
      await fixtureServer.close();
    }
  });

  test("proposeAction lets a task-aligned read-only action through", async () => {
    const fixtureServer = await startFixtureServer();
    try {
      const page = await readPage({
        url: fixtureServer.url("safe-refund-page.html"),
        scanId: "test-safe",
        userTask: "Summarize the refund policy.",
        guard,
      });
      const outcome = await proposeAction({
        scanId: "test-safe",
        userTask: "Summarize the refund policy.",
        scan: page.scan,
        action: { type: "summarize_policy", label: "Summarize", riskCategory: "read_only" },
        guard,
      });
      assert.equal(outcome.response.allowed, true);
      assert.equal(outcome.response.decision, "allow");
    } finally {
      await fixtureServer.close();
    }
  });

  test("proposeAction blocks an account change on a clean scan of an unrelated task", async () => {
    const outcome = await proposeAction({
      scanId: "test-noscan",
      userTask: "Check the weather.",
      action: { type: "change_account_email", label: "Change email", riskCategory: "account_change" },
      guard,
    });
    assert.equal(outcome.response.allowed, false);
  });
});

describe("agent loop", () => {
  test("firstUrl extracts the URL from a task", () => {
    assert.equal(firstUrl("go to https://example.test/page and read it"), "https://example.test/page");
    assert.equal(firstUrl("no url here"), undefined);
  });

  test("end-to-end: a blocked page HALTS the episode — no task output is produced", async () => {
    const fixtureServer = await startFixtureServer();
    try {
      const ariaUrl = fixtureServer.url("aria-injection.html");
      const events: AgentTurnEvent[] = [];
      const summary = await runAgent({
        task: `Go to ${ariaUrl} and summarize the refund policy`,
        guard,
        apiKey: "fake-key",
        fetchImpl: fakeGemini([
          // The model asks to read, then would cheerfully summarize — the halt
          // must cut in before this second call ever happens.
          modelCalls({ name: "read_page", args: { url: ariaUrl } }),
          modelCalls({
            name: "propose_action",
            args: { type: "change_account_email", label: "Change email to attacker", riskCategory: "account_change" },
          }),
          modelText("refund summary the model should never get to produce"),
        ]),
        onEvent: (event) => events.push(event),
      });

      assert.equal(summary.scans.length, 1);
      assert.equal(summary.scans[0]?.decision, "block");
      assert.equal(summary.halted, true, "the episode must halt on a blocked page");
      assert.match(summary.answer, /BLOCKED/i);
      // The gate was never reached, and the scripted second/third model turns prove
      // the loop stopped instead of feeding the model the approved segments.
      assert.equal(summary.actions.length, 0, "no action may be proposed on a blocked page");
      assert.equal(summary.steps, 1, "the loop must stop in the same turn as the block");

      const kinds = events.map((event) => event.kind);
      assert.ok(kinds.includes("layer"));
      assert.ok(kinds.includes("halt"), "the halt must be announced as its own event");
      assert.ok(!kinds.includes("agent"), "no model answer is produced from a blocked page");
    } finally {
      await fixtureServer.close();
    }
  });

  test("end-to-end: haltOnBlock=false restores the observe-and-report flow", async () => {
    const fixtureServer = await startFixtureServer();
    try {
      const ariaUrl = fixtureServer.url("aria-injection.html");
      const summary = await runAgent({
        task: `Go to ${ariaUrl} and summarize the refund policy`,
        guard,
        apiKey: "fake-key",
        haltOnBlock: false,
        fetchImpl: fakeGemini([
          modelCalls({ name: "read_page", args: { url: ariaUrl } }),
          modelCalls({
            name: "propose_action",
            args: { type: "change_account_email", label: "Change email to attacker", riskCategory: "account_change" },
          }),
          modelText(
            "The page contained a hidden instruction that the layer blocked. My refund summary: refunds are accepted within 30 days.",
          ),
        ]),
      });

      assert.equal(summary.halted, undefined);
      assert.equal(summary.scans[0]?.decision, "block");
      assert.equal(summary.actions.length, 1);
      assert.equal(summary.actions[0]?.decision, "block");
      assert.ok(summary.answer.includes("refund"));
    } finally {
      await fixtureServer.close();
    }
  });

  test("end-to-end: safe page, allowed action", async () => {
    const fixtureServer = await startFixtureServer();
    try {
      const safeUrl = fixtureServer.url("safe-refund-page.html");
      const summary = await runAgent({
        task: `Go to ${safeUrl} and summarize the refund policy`,
        guard,
        apiKey: "fake-key",
        fetchImpl: fakeGemini([
          modelCalls({ name: "read_page", args: { url: safeUrl } }),
          modelCalls({
            name: "propose_action",
            args: { type: "summarize_policy", label: "Summarize", riskCategory: "read_only" },
          }),
          modelText("Refunds are accepted within 30 days of delivery."),
        ]),
      });

      assert.equal(summary.halted, undefined);
      assert.equal(summary.scans[0]?.decision, "allow");
      assert.equal(summary.actions[0]?.decision, "allow");
    } finally {
      await fixtureServer.close();
    }
  });

  test("tool failure is returned to the model as an error response, not a crash", async () => {
    const summary = await runAgent({
      task: "Go to http://localhost:1/unreachable and read it",
      guard,
      apiKey: "fake-key",
      fetchImpl: fakeGemini([
        modelCalls({ name: "read_page", args: { url: "http://localhost:1/unreachable" } }),
        modelText("The page could not be fetched."),
      ]),
    });
    assert.equal(summary.scans.length, 0);
    assert.ok(summary.answer.length > 0);
  });

  test("step budget produces a fallback answer instead of looping forever", async () => {
    const calls = Array.from({ length: 12 }, () =>
      modelCalls({ name: "read_page", args: { url: "http://localhost:1/x" } }),
    );
    const summary = await runAgent({
      task: "loop forever",
      guard,
      apiKey: "fake-key",
      maxSteps: 3,
      fetchImpl: fakeGemini(calls),
    });
    assert.ok(summary.answer.includes("step budget"));
  });
});
