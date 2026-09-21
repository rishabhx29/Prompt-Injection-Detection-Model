/**
 * The seven contract tests (ticket 05; S2 A3.8; docs/05 Checkpoint 1 gate).
 *
 * Everything is driven by the frozen oracle `sample-data/EXPECTATIONS.json`:
 * for each test ID the normative scan request (and action request, when present)
 * is executed through the public SDK and every declared expectation is asserted.
 * A failing assertion here blocks Saumya's dashboard integration by design —
 * this file is the Checkpoint 1 gate.
 */

import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  checkAction as standaloneCheckAction,
  scanPage as standaloneScanPage,
} from "../src/index.ts";
import type { CheckActionInput, ScanPageResponse } from "../src/index.ts";

const SAMPLE_DIR = new URL("../../../sample-data/", import.meta.url);

interface Expectations {
  tests: Array<{
    testId: string;
    scanRequest: string;
    actionRequest: string | null;
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
      actionDecision?: string[];
      actionAllowed?: boolean;
      actionConfirmationRequired?: boolean;
      reasonNonEmpty?: boolean;
    };
  }>;
}

const ORACLE = JSON.parse(
  readFileSync(new URL("EXPECTATIONS.json", SAMPLE_DIR), "utf8"),
) as Expectations;

function readSample(relative: string): unknown {
  return JSON.parse(readFileSync(new URL(relative, SAMPLE_DIR), "utf8")) as unknown;
}

describe("the seven contract tests (Checkpoint 1 gate)", () => {
  for (const testCase of ORACLE.tests) {
    it(`contract test "${testCase.testId}"`, async () => {
      const request = readSample(testCase.scanRequest);
      const scan = (await standaloneScanPage(request as never)) as ScanPageResponse;
      const expected = testCase.expect;

      if (expected.riskLevel !== undefined) {
        assert.ok(
          expected.riskLevel.includes(scan.riskLevel),
          `${testCase.testId}: riskLevel ${scan.riskLevel} not in ${expected.riskLevel.join("|")}`,
        );
      }
      if (expected.riskScoreMin !== undefined) {
        assert.ok(scan.riskScore >= expected.riskScoreMin, `${testCase.testId}: score too low`);
      }
      if (expected.riskScoreMax !== undefined) {
        assert.ok(scan.riskScore <= expected.riskScoreMax, `${testCase.testId}: score too high`);
      }
      if (expected.decision !== undefined) {
        assert.ok(
          expected.decision.includes(scan.decision),
          `${testCase.testId}: decision ${scan.decision} not in ${expected.decision.join("|")}`,
        );
      }
      if (expected.requiredSignals !== undefined) {
        const seen = new Set(scan.findings.flatMap((finding) => finding.signals));
        for (const signal of expected.requiredSignals) {
          assert.ok(seen.has(signal as never), `${testCase.testId}: missing signal ${signal}`);
        }
      }
      if (expected.requiredViews !== undefined) {
        const seen = new Set(scan.findings.map((finding) => finding.view));
        for (const view of expected.requiredViews) {
          assert.ok(seen.has(view as never), `${testCase.testId}: missing finding view ${view}`);
        }
      }
      if (expected.findingsExpected === "none_high_severity") {
        for (const finding of scan.findings) {
          assert.notEqual(finding.severity, "high", `${testCase.testId}: unexpected high severity`);
        }
      }
      if (expected.blockedContentNonEmpty === true) {
        assert.ok(scan.blockedContent.length > 0, `${testCase.testId}: expected a blocked span`);
      }
      if (expected.blockedContentEmpty === true) {
        assert.deepEqual(scan.blockedContent, [], `${testCase.testId}: expected no blocked span`);
      }
      if (expected.mustNotBlockSolelyForImperativeAccessibleLabel === true) {
        assert.notEqual(
          scan.decision,
          "block",
          `${testCase.testId}: an imperative accessible label must never block on its own (FR-3.11)`,
        );
      }

      // Action-level oracle: the gate runs with the scan from this same test.
      if (testCase.actionRequest) {
        const actionRequest = readSample(testCase.actionRequest);
        const actionResponse = await standaloneCheckAction({
          ...(actionRequest as object),
          scan,
        } as CheckActionInput);

        if (expected.actionDecision !== undefined) {
          assert.ok(
            expected.actionDecision.includes(actionResponse.decision),
            `${testCase.testId}: action decision ${actionResponse.decision} not in ${expected.actionDecision.join("|")}`,
          );
        }
        if (expected.actionAllowed !== undefined) {
          assert.equal(actionResponse.allowed, expected.actionAllowed, `${testCase.testId}: allowed`);
        }
        if (expected.actionConfirmationRequired !== undefined) {
          assert.equal(
            actionResponse.confirmationRequired,
            expected.actionConfirmationRequired,
            `${testCase.testId}: confirmationRequired`,
          );
        }

describe("observed results recorded for evaluation", () => {
  it("verifies all seven request files exist (FR-7.2) and writes the observed outcomes", async () => {
    const observed: Array<{
      testId: string;
      fixture: string;
      riskScore: number;
      riskLevel: string;
      decision: string;
      findingViews: string[];
      signals: string[];
    }> = [];

    for (const testCase of ORACLE.tests) {
      // A missing or malformed request file must fail loudly here, not be skipped.
      const request = readSample(testCase.scanRequest);
      const scan = (await standaloneScanPage(request as never)) as ScanPageResponse;
      observed.push({
        testId: testCase.testId,
        fixture: testCase.scanRequest,
        riskScore: scan.riskScore,
        riskLevel: scan.riskLevel,
        decision: scan.decision,
        findingViews: scan.findings.map((finding) => finding.view),
        signals: [...new Set(scan.findings.flatMap((finding) => finding.signals))],
      });
    }

    assert.equal(observed.length, 7, "all seven contract scenarios ran");

    // The artifact is gitignored (`tests/results/`) — it is evidence for the
    // Phase 6 evaluation tables, regenerated on every run, never edited by hand.
    const resultsDir = new URL("../src/../tests/results/", import.meta.url);
    mkdirSync(resultsDir, { recursive: true });
    writeFileSync(
      new URL("observed-contract-results.json", resultsDir),
      `${JSON.stringify({ generatedBy: "tests/contract.test.ts", version: 1, observed }, null, 2)}\n`,
    );
  });
});

        if (expected.reasonNonEmpty === true) {
          assert.notEqual(actionResponse.reason.trim(), "", `${testCase.testId}: reason is empty`);
        }

        // The invariants hold on every action response (contract §4.9, FR-7.4).
        assert.equal(actionResponse.allowed, actionResponse.decision === "allow");
        assert.equal(actionResponse.confirmationRequired, actionResponse.decision === "confirm");
      }
    });
  }
});
