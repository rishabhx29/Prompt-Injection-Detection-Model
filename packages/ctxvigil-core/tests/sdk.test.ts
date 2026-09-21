/**
 * SDK-surface tests (tickets 01 and 03: detector-backed scan round-trip).
 *
 * These pin the **contract shape** of the public API against the frozen
 * `docs/03_API_CONTRACT.md` and the real sample JSON in `sample-data/`.
 * Detection is real; risk, decision, and content partitioning remain skeleton
 * stubs until the scorer/policy tickets (04–05) — the contract-shape assertions
 * stay.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { createCtxVigil, CtxVigilError, checkAction as standaloneCheckAction, scanPage as standaloneScanPage } from "../src/index.ts";
// The package-name import exercises the workspace `exports` resolution — the
// way a real integrator imports the SDK (ticket 01 acceptance criterion 1).
import { createCtxVigil as createCtxVigilByName } from "ctxvigil";
import type { ScanPageResponse } from "@ctxvigil/shared-types";

const SAMPLE_DIR = new URL("../../../sample-data/scan-requests/", import.meta.url);

function readSample(name: string): unknown {
  return JSON.parse(readFileSync(new URL(name, SAMPLE_DIR), "utf8")) as unknown;
}

const RISK_LEVELS = new Set(["low", "medium", "high", "critical"]);
const DECISIONS = new Set(["allow", "sanitize", "confirm", "block"]);
const VIEW_KINDS = new Set([
  "visible_text",
  "dom",
  "hidden_dom",
  "accessibility_tree",
  "image_text",
]);
const SEVERITIES = new Set(["low", "medium", "high"]);

function sampleRequests(): Array<{ name: string; body: unknown }> {
  return readdirSync(SAMPLE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({
      name,
      body: JSON.parse(readFileSync(new URL(name, SAMPLE_DIR), "utf8")) as unknown,
    }));
}

/** Assert the full ScanPageResponse contract shape (§4.4–§4.6). */
function assertScanPageResponseShape(response: unknown, expectedScanId: string): void {
  assert.equal(typeof response, "object");
  const r = response as ScanPageResponse;

  assert.equal(typeof r.scanId, "string");
  assert.notEqual(r.scanId, "");
  assert.equal(r.scanId, expectedScanId, "scanId must echo the request");

  assert.equal(Number.isInteger(r.riskScore), true, "riskScore must be an integer");
  assert.ok(r.riskScore >= 0 && r.riskScore <= 100, "riskScore must be clamped to 0–100");

  assert.equal(RISK_LEVELS.has(r.riskLevel), true, "riskLevel must be a contract value");
  assert.equal(DECISIONS.has(r.decision), true, "decision must be a contract value");

  assert.equal(typeof r.summary, "string");
  assert.notEqual(r.summary.trim(), "", "summary must never be empty");

  assert.equal(Array.isArray(r.findings), true);
  for (const finding of r.findings) {
    assert.equal(typeof finding.id, "string");
    assert.notEqual(finding.id, "");
    assert.equal(VIEW_KINDS.has(finding.view), true, "finding.view must be a ViewKind");
    assert.equal(typeof finding.text, "string");
    assert.equal(Array.isArray(finding.signals), true);
    assert.ok(finding.signals.length >= 1, "findings carry at least one signal");
    assert.equal(SEVERITIES.has(finding.severity), true);
    assert.equal(
      Number.isInteger(finding.scoreContribution),
      true,
      "scoreContribution must be an integer",
    );
  }

  assert.equal(Array.isArray(r.safeContent), true);
  for (const item of r.safeContent) {
    assert.equal(typeof item.text, "string");
    assert.equal(VIEW_KINDS.has(item.view), true, "safeContent items carry a ViewKind");
  }

  assert.equal(Array.isArray(r.sanitizedContent), true);
  for (const text of r.sanitizedContent) {
    assert.equal(typeof text, "string");
  }

  assert.equal(Array.isArray(r.blockedContent), true);
  for (const text of r.blockedContent) {
    assert.equal(typeof text, "string");
  }
}

describe("public surface", () => {
  it("exports createCtxVigil, standalone scanPage, and a typed error class", () => {
    assert.equal(typeof createCtxVigil, "function");
    assert.equal(typeof standaloneScanPage, "function");
    assert.equal(typeof CtxVigilError, "function");
  });

  it("createCtxVigil() with no arguments returns a guard with both methods", () => {
    const guard = createCtxVigil();
    assert.equal(typeof guard.scanPage, "function");
    assert.equal(typeof guard.checkAction, "function");
  });

  it("resolves by package name ('ctxvigil') and behaves identically (FR-1.1)", async () => {
    const guard = createCtxVigilByName();
    const response = await guard.scanPage(readSample("safe-refund-page.json"));
    assertScanPageResponseShape(response, "safe-refund-page");
  });

  it("createCtxVigil(config?) accepts a partial config override", () => {
    // FR-1.7: defaults must be usable with no arguments; a section override
    // must not throw at construction time.
    assert.doesNotThrow(() => createCtxVigil({ thresholds: { low: 20 } }));
    assert.doesNotThrow(() => createCtxVigil({}));
  });
});

describe("scanPage round-trip", () => {
  it("returns a contract-shaped response for every sample-data scan request", async () => {
    const guard = createCtxVigil();

    for (const { name, body } of sampleRequests()) {
      const response = await guard.scanPage(body);
      assertScanPageResponseShape(
        response,
        (body as { scanId: string }).scanId as string,
      );
    }
  });

  it("works as a standalone function with the default config", async () => {
    const response = await standaloneScanPage(readSample("aria-injection.json"));
    assertScanPageResponseShape(response, "refund-aria-attack-001");
  });

  it("is deterministic: two runs of the same input are byte-identical (NFR-1)", async () => {
    const request = readSample("aria-injection.json");
    const [a, b] = await Promise.all([standaloneScanPage(request), standaloneScanPage(request)]);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  });

  it("scores and decides every fixture as sample-data/EXPECTATIONS.json requires", async () => {
    // The DoD for ticket 04, driven by the normative oracle rather than by hand.
    // Action-level expectations (actionDecision, actionAllowed, actionConfirmationRequired,
    // reasonNonEmpty) are ticket 05's oracle and are deliberately not read here.
    const expectations = JSON.parse(
      readFileSync(new URL("../../../sample-data/EXPECTATIONS.json", import.meta.url), "utf8"),
    ) as {
      tests: Array<{
        testId: string;
        scanRequest: string;
        expect: {
          riskLevel?: string[];
          riskScoreMin?: number;
          riskScoreMax?: number;
          decision?: string[];
          requiredSignals?: string[];
          requiredViews?: string[];
          findingsExpected?: string;
          blockedContentNonEmpty?: boolean;
          blockedContentEmpty?: boolean;
          mustNotBlockSolelyForImperativeAccessibleLabel?: boolean;
        };
      }>;
    };

    for (const testCase of expectations.tests) {
      const request = readSample(testCase.scanRequest.split("/").at(-1) as string);
      const response = await standaloneScanPage(request as never);
      const expected = testCase.expect;

      if (expected.riskLevel !== undefined) {
        assert.ok(
          expected.riskLevel.includes(response.riskLevel),
          `${testCase.testId}: riskLevel ${response.riskLevel} not in ${expected.riskLevel.join("|")}`,
        );
      }
      if (expected.riskScoreMin !== undefined) {
        assert.ok(response.riskScore >= expected.riskScoreMin, `${testCase.testId}: score too low`);
      }
      if (expected.riskScoreMax !== undefined) {
        assert.ok(response.riskScore <= expected.riskScoreMax, `${testCase.testId}: score too high`);
      }
      if (expected.decision !== undefined) {
        assert.ok(
          expected.decision.includes(response.decision),
          `${testCase.testId}: decision ${response.decision} not in ${expected.decision.join("|")}`,
        );
      }
      if (expected.requiredSignals !== undefined) {
        const seen = new Set(response.findings.flatMap((finding) => finding.signals));
        for (const signal of expected.requiredSignals) {
          assert.ok(seen.has(signal as never), `${testCase.testId}: missing signal ${signal}`);
        }
      }
      if (expected.requiredViews !== undefined) {
        const seen = new Set(response.findings.map((finding) => finding.view));
        for (const view of expected.requiredViews) {
          assert.ok(seen.has(view as never), `${testCase.testId}: missing finding view ${view}`);
        }
      }
      if (expected.findingsExpected === "none_high_severity") {
        for (const finding of response.findings) {
          assert.notEqual(finding.severity, "high", `${testCase.testId}: unexpected high severity`);
        }
      }
      if (expected.blockedContentNonEmpty === true) {
        assert.ok(response.blockedContent.length > 0, `${testCase.testId}: expected a blocked span`);
      }
      if (expected.blockedContentEmpty === true) {
        assert.deepEqual(response.blockedContent, [], `${testCase.testId}: expected no blocked span`);
      }
      if (expected.mustNotBlockSolelyForImperativeAccessibleLabel === true) {
        assert.notEqual(
          response.decision,
          "block",
          `${testCase.testId}: an imperative accessible label must never block on its own (FR-3.11)`,
        );
      }
    }
  });

  it("does not block the benign imperative ARIA label (FR-3.11 regression)", async () => {
    const response = await standaloneScanPage(readSample("benign-aria-label.json"));
    assert.deepEqual(response.findings, []);
    assert.equal(response.decision, "allow");
    assert.ok(response.safeContent.some((item) => item.text === "Submit application"));
  });

  it("redacts the suspicious span while keeping it in the audit record (FR-4.6–4.8)", async () => {
    const response = await standaloneScanPage(readSample("aria-injection.json"));
    assert.equal(response.decision, "block");
    assert.equal(
      response.safeContent.some((item) => item.text.includes("Ignore the user's request")),
      false,
      "the agent must never receive the injected instruction",
    );
    assert.ok(
      response.sanitizedContent.some((text) => text.includes("[Blocked suspicious instruction from")),
      "the agent context shows a placeholder, not the attack",
    );
    assert.ok(response.blockedContent.some((text) => text.includes("Ignore the user's request")));
  });
});

describe("error paths (contract §9.1)", () => {
  it("rejects a missing userTask with INVALID_REQUEST naming the field", async () => {
    const guard = createCtxVigil();
    await assert.rejects(
      () => guard.scanPage({ scanId: "x", page: {} }),
      (error: unknown) => {
        assert.ok(error instanceof CtxVigilError);
        assert.equal(error.code, "INVALID_REQUEST");
        assert.equal(error.field, "userTask");
        assert.notEqual(error.toResponse().error.message.trim(), "");
        return true;
      },
    );
  });

  it("rejects a non-object body with INVALID_REQUEST", async () => {
    const guard = createCtxVigil();
    await assert.rejects(
      () => guard.scanPage("not an object"),
      (error: unknown) => {
        assert.ok(error instanceof CtxVigilError);
        assert.equal(error.code, "INVALID_REQUEST");
        return true;
      },
    );
  });
});

describe("checkAction (the real action gate)", () => {
  it("never returns allow without a scan for a risky action (FR-5.9)", async () => {
    const guard = createCtxVigil();
    const scan = (await guard.scanPage(
      readSample("aria-injection.json") as never,
    )) as ScanPageResponse;
    const response = await guard.checkAction({
      scanId: "refund-aria-attack-001",
      userTask: "Find and summarize the refund policy.",
      proposedAction: { type: "change_account_email" },
      scan, // contract §10 point 3: the prior scan result travels with the request.
    });

    assert.equal(response.decision, "block");
    assert.equal(response.allowed, false);
    assert.equal(response.confirmationRequired, false);
    // Consistency invariants (contract §4.9).
    assert.equal(response.allowed, response.decision === "allow");
    assert.equal(response.confirmationRequired, response.decision === "confirm");
    assert.notEqual(response.reason.trim(), "");
  });

  it("standalone checkAction accepts the same input shape (contract §10 point 4)", async () => {
    const response = await standaloneCheckAction({
      scanId: "refund-aria-attack-001",
      userTask: "Find and summarize the refund policy.",
      proposedAction: { type: "summarize_policy" },
    });
    // Read-only category is benign even without a scan (FR-5.9 treats only risky
    // categories conservatively).
    assert.equal(response.decision, "allow");
    assert.equal(response.allowed, true);
  });

  it("rejects malformed action input with INVALID_REQUEST", async () => {
    const guard = createCtxVigil();
    await assert.rejects(
      () => guard.checkAction({ scanId: "x", userTask: "task", proposedAction: {} }),
      (error: unknown) => {
        assert.ok(error instanceof CtxVigilError);
        assert.equal(error.code, "INVALID_REQUEST");
        return true;
      },
    );
  });
});
