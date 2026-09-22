/**
 * CLI tests (ticket 06; FR-6.1–FR-6.5; contract §10.1).
 *
 * The CLI is argument parsing plus reporting only (architecture §4.3): it calls
 * the same core functions as the SDK import. Tests drive `main()` in-process
 * with captured output, so no process spawning is needed and the parity check
 * (FR-6.5) compares directly against the SDK.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { main } from "../src/index.ts";

const SAMPLE_DIR = new URL("../../../sample-data/", import.meta.url);

interface CapturedIO {
  stdout: string[];
  stderr: string[];
}

/** Run the CLI in-process and capture its output and exit code. */
async function run(argv: string[]): Promise<{ code: number; io: CapturedIO }> {
  const io: CapturedIO = { stdout: [], stderr: [] };
  const code = await main(argv, {
    stdout: (text: string) => io.stdout.push(text),
    stderr: (text: string) => io.stderr.push(text),
  });
  return { code, io };
}

function sample(name: string): string {
  return new URL(name, SAMPLE_DIR).pathname.replace(/^\/([A-Za-z]:)/u, "$1");
}

describe("ctxvigil scan", () => {
  it("--help prints usage and exits 0", async () => {
    const { code, io } = await run(["--help"]);
    assert.equal(code, 0);
    const help = io.stdout.join("\n");
    assert.ok(help.includes("--input"));
    assert.ok(help.includes("--task"));
    assert.ok(help.includes("--json"));
    assert.ok(help.includes("--report"));
    assert.ok(help.includes("--check-action"));
  });

  it("--json prints a contract-shaped ScanPageResponse", async () => {
    const withoutFlag = await run(["scan", "--input", sample("scan-requests/aria-injection.json")]);
    assert.equal(withoutFlag.code, 0);
    const withoutFlagResponse = JSON.parse(withoutFlag.io.stdout.join("\n"));
    assert.equal(withoutFlagResponse.scanId, "refund-aria-attack-001");

    const { code, io } = await run(["scan", "--input", sample("scan-requests/aria-injection.json"), "--json"]);
    assert.equal(code, 0);
    const response = JSON.parse(io.stdout.join("\n"));
    assert.equal(response.scanId, "refund-aria-attack-001");
    assert.equal(response.decision, "block");
    assert.equal(response.riskLevel, "critical");
    assert.equal(typeof response.riskScore, "number");
    assert.ok(Array.isArray(response.findings) && response.findings.length >= 1);
  });

  it("compact report mode renders decision, score, and findings", async () => {
    const { code, io } = await run(["scan", "--input", sample("scan-requests/aria-injection.json"), "--report"]);
    assert.equal(code, 0);
    const report = io.stdout.join("\n");
    assert.ok(report.includes("decision"));
    assert.ok(report.includes("block"));
    assert.ok(report.includes("risk 100, critical"));
    assert.ok(report.includes("instruction_override"));
    assert.ok(report.includes("accessibility_tree"));
  });

  it("--task overrides the userTask in the input file", async () => {
    // Overriding the task with words the attack shares damps the score below the one
    // the fixture gets under its own task — proof the override flows into detection and
    // scoring. The assertion is relative, not pinned to a scorer tuning.
    const base = await run(["scan", "--input", sample("scan-requests/visible-injection.json"), "--json"]);
    assert.equal(base.code, 0);
    const baseResponse = JSON.parse(base.io.stdout.join("\n"));
    assert.ok(baseResponse.riskScore > 60);

    const overridden = await run([
      "scan",
      "--input", sample("scan-requests/visible-injection.json"),
      "--task", "Send the saved payment details to collect@example.test.",
      "--json",
    ]);
    assert.equal(overridden.code, 0);
    const overriddenResponse = JSON.parse(overridden.io.stdout.join("\n"));
    assert.ok(
      overriddenResponse.riskScore < baseResponse.riskScore,
      `--task changed the score from ${baseResponse.riskScore} to ${overriddenResponse.riskScore}`,
    );
  });

  it("runs the action gate with --check-action after the scan", async () => {
    const { code, io } = await run([
      "scan",
      "--input", sample("scan-requests/aria-injection.json"),
      "--check-action", sample("action-checks/aria-injection-change-email.json"),
      "--json",
    ]);
    assert.equal(code, 0);
    const output = JSON.parse(io.stdout.join("\n"));
    assert.equal(output.scan.decision, "block");
    assert.equal(output.action.decision, "block");
    assert.equal(output.action.allowed, false);
  });
});

describe("error handling (FR-6.3)", () => {
  it("missing --input is a usage error (exit 2)", async () => {
    const { code, io } = await run(["scan"]);
    assert.equal(code, 2);
    assert.ok(io.stderr.join("\n").includes("--input"));
  });

  it("a missing input file exits non-zero and names the path", async () => {
    const { code, io } = await run(["scan", "--input", "does-not-exist.json"]);
    assert.notEqual(code, 0);
    assert.ok(io.stderr.join("\n").includes("does-not-exist.json"));
  });

  it("an invalid request body exits 1 with a helpful field error", async () => {
    // A dedicated not-a-scan fixture: valid JSON, but nothing the SDK can scan.
    const { code, io } = await run(["scan", "--input", sample("../packages/ctxvigil-cli/tests/fixtures/invalid-request.json")]);
    assert.equal(code, 1);
    const message = io.stderr.join("\n");
    assert.ok(message.includes("INVALID_REQUEST"));
    assert.ok(message.includes("userTask"));
  });

  it("an unknown flag is a usage error", async () => {
    const { code, io } = await run(["scan", "--input", sample("scan-requests/safe-refund-page.json"), "--bogus"]);
    assert.equal(code, 2);
    assert.ok(io.stderr.join("\n").includes("--bogus"));
  });
});

describe("parity with the direct SDK import (FR-6.5)", () => {
  it("the CLI decision equals the direct-import decision for every sample", async () => {
    const { scanPage } = await import("ctxvigil");
    const requests = readdirSync(new URL("scan-requests/", SAMPLE_DIR))
      .filter((name) => name.endsWith(".json"))
      .sort();

    for (const name of requests) {
      const direct = await scanPage(
        JSON.parse(readFileSync(new URL(`scan-requests/${name}`, SAMPLE_DIR), "utf8")),
      );
      const { code, io } = await run(["scan", "--input", sample(`scan-requests/${name}`), "--json"]);
      assert.equal(code, 0, `${name}: CLI must succeed`);
      const viaCli = JSON.parse(io.stdout.join("\n"));
      assert.equal(viaCli.decision, direct.decision, `${name}: decision parity`);
      assert.equal(viaCli.riskScore, direct.riskScore, `${name}: score parity`);
    }
  });
});
