/**
 * Documentation tests (ticket 08; FR-6.11, NFR-8).
 *
 * The README claims its snippets are copy-paste runnable. This runs the checked-in
 * copy of the primary snippet, so that claim is verified on every test run instead
 * of relying on a one-off manual check.
 */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { promisify } from "node:util";

const run = promisify(execFile);

const SNIPPET = new URL("../examples/readme-snippet.mjs", import.meta.url);

describe("README examples stay runnable", () => {
  it("the documented direct-import snippet runs and produces the documented verdict", async () => {
    const { stdout } = await run(process.execPath, [SNIPPET.pathname.replace(/^\/([A-Za-z]:)/u, "$1")]);
    assert.ok(stdout.includes("decision: block 100"), `unexpected output:\n${stdout}`);
    assert.ok(stdout.includes("instruction_override"));
    assert.ok(stdout.includes("safeContent: 1 blockedContent: 1"));
    assert.ok(stdout.includes("action: block"));
  });

  it("the README documents the development-defaults caveat and the limitations", () => {
    const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
    assert.ok(
      readme.includes("development defaults, not validated research thresholds"),
      "the threshold caveat must stay in the README (FR-4.9, NFR-8)",
    );
    assert.ok(readme.includes("Honest limitations"), "the limitations section must stay (PRD §9)");
    assert.ok(
      readme.includes("Explicitly not claimed"),
      "the no-overclaiming statement must stay (NFR-8)",
    );
    assert.ok(
      readme.includes("role_impersonation") && readme.includes("no fixture triggers it"),
      "the honest note about untriggered role_impersonation must stay",
    );
  });
});
