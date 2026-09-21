/**
 * Action-gate tests (ticket 05; FR-5.1–FR-5.9; architecture §5/§5.1).
 *
 * The gate is an **independent check** (FR-5.8): it re-validates the request,
 * resolves the action's risk category, computes keyword alignment with the task,
 * and applies the documented postures — it never re-runs the scan pipeline.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { resolveConfig } from "../src/config/defaults.ts";
import type { ResolvedConfig } from "../src/config/types.ts";
import { checkAction as standaloneCheckAction, scanPage as standaloneScanPage } from "../src/index.ts";
import type { CheckActionInput, CheckActionResponse, ScanPageResponse } from "../src/index.ts";

const SAMPLE_DIR = new URL("../../../sample-data/", import.meta.url);
const CONFIG = resolveConfig();

function readJson(relative: string): unknown {
  return JSON.parse(readFileSync(new URL(relative, SAMPLE_DIR), "utf8")) as unknown;
}

/** Run checkAction exactly as an integrator would: scan first, then the action. */
async function gate(
  actionRequest: unknown,
  scan: ScanPageResponse | undefined,
  config: ResolvedConfig = CONFIG,
): Promise<CheckActionResponse> {
  const input = { ...(actionRequest as object), ...(scan === undefined ? {} : { scan }) };
  return standaloneCheckAction(input as CheckActionInput, config);
}

/** Assert the contract invariants of §4.9 on every outcome. */
function assertInvariants(response: CheckActionResponse): void {
  assert.equal(response.allowed, response.decision === "allow");
  assert.equal(response.confirmationRequired, response.decision === "confirm");
  assert.ok(Number.isInteger(response.riskScore));
  assert.ok(response.riskScore >= 0 && response.riskScore <= 100);
  assert.notEqual(response.reason.trim(), "", "the reason is never empty (FR-5.7)");
}

describe("the two alignment fixtures (S2 A3.5)", () => {
  it("allows summarize_policy for the refund task (task-aligned, read-only)", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/task-aligned-summary-action.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      readJson("action-checks/task-aligned-summary-action-summarize.json"),
      scan,
    );
    assertInvariants(response);
    assert.equal(response.decision, "allow");
    assert.equal(response.allowed, true);
    assert.equal(response.confirmationRequired, false);
    assert.ok(response.reason.includes("summarize_policy"));
    assert.ok(response.reason.includes("Find and summarize the refund policy."));
  });

  it("blocks change_account_email for the refund task (high-risk, unrelated)", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/unrelated-account-action.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      readJson("action-checks/unrelated-account-action-change-email.json"),
      scan,
    );
    assertInvariants(response);
    assert.equal(response.decision, "block");
    assert.equal(response.allowed, false);
    assert.equal(response.confirmationRequired, false);
    assert.ok(response.reason.includes("change_account_email"));
  });
});

describe("triggeredByFindingIds forces block (FR-5.5)", () => {
  it("blocks an action whose id matches a finding in the provided scan", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/aria-injection.json") as never,
    )) as ScanPageResponse;
    const response = await gate(readJson("action-checks/aria-injection-change-email.json"), scan);
    assertInvariants(response);
    assert.equal(response.decision, "block");
    assert.ok(response.reason.includes("finding-1"));
  });

  it("does not force block when the id matches nothing in the scan", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/safe-refund-page.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      {
        scanId: "safe-refund-page",
        userTask: "Find and summarize the refund policy.",
        proposedAction: {
          type: "summarize_policy",
          triggeredByFindingIds: ["finding-does-not-exist"],
        },
      },
      scan,
    );
    assertInvariants(response);
    assert.equal(response.decision, "allow", "a dangling id is not a match");
  });
});

describe("missing scan is handled explicitly, never assumed safe (FR-5.9)", () => {
  it("blocks a risky action with no scan", async () => {
    const response = await gate(
      {
        scanId: "any",
        userTask: "Find and summarize the refund policy.",
        proposedAction: { type: "change_account_email" },
      },
      undefined,
    );
    assertInvariants(response);
    assert.equal(response.decision, "block");
    assert.ok(response.reason.includes("no prior scan") || response.reason.includes("No prior scan"));
  });

  it("requires confirmation for an aligned risky action with no scan", async () => {
    const response = await gate(
      {
        scanId: "any",
        userTask: "Change my account email to the new address.",
        proposedAction: { type: "change_account_email" },
      },
      undefined,
    );
    assertInvariants(response);
    assert.equal(
      response.decision,
      "confirm",
      "task authorisation is detectable, but without a scan the gate stays cautious",
    );
  });

  it("still allows a read-only action with no scan", async () => {
    const response = await gate(
      {
        scanId: "any",
        userTask: "Find and summarize the refund policy.",
        proposedAction: { type: "summarize_policy" },
      },
      undefined,
    );
    assertInvariants(response);
    assert.equal(response.decision, "allow");
  });
});

describe("category postures (architecture §5)", () => {
  it("confirms a sensitive action that is not clearly task-aligned", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/safe-refund-page.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      {
        scanId: "safe-refund-page",
        userTask: "Find and summarize the refund policy.",
        proposedAction: { type: "submit_form", label: "Submit the contact form" },
      },
      scan,
    );
    assertInvariants(response);
    assert.equal(response.decision, "confirm");
  });

  it("always blocks destructive actions, even task-aligned ones", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/safe-refund-page.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      {
        scanId: "safe-refund-page",
        userTask: "Delete my old refund requests.",
        proposedAction: { type: "delete_data" },
      },
      scan,
    );
    assertInvariants(response);
    assert.equal(response.decision, "block");
  });

  it("blocks an unclassifiable, unaligned action instead of assuming it safe (FR-5.9)", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/safe-refund-page.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      {
        scanId: "safe-refund-page",
        userTask: "Find and summarize the refund policy.",
        proposedAction: { type: "do_the_thing" },
      },
      scan,
    );
    assertInvariants(response);
    // Unknown category gets account_change-level caution (architecture §5 note 2):
    // block unless the task explicitly authorises it.
    assert.equal(response.decision, "block");
  });

  it("does not let a crafted label authorise a high-risk action (label is untrusted)", async () => {
    // Regression for the label-alignment hole: the label shares a task token, but
    // alignment reads only the integrator's machine token (`type`).
    const scan = (await standaloneScanPage(
      readJson("scan-requests/safe-refund-page.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      {
        scanId: "safe-refund-page",
        userTask: "Find and summarize the refund policy.",
        proposedAction: {
          type: "change_account_email",
          label: "Email me the refund policy summary",
        },
      },
      scan,
    );
    assertInvariants(response);
    assert.equal(response.decision, "block");
  });

  it("honours an explicit riskCategory over inference", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/safe-refund-page.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      {
        scanId: "safe-refund-page",
        userTask: "Find and summarize the refund policy.",
        proposedAction: { type: "refresh_view", riskCategory: "read_only" },
      },
      scan,
    );
    assertInvariants(response);
    assert.equal(response.decision, "allow");
  });

  it("blocks a risky action on a page the scanner already blocked", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/aria-injection.json") as never,
    )) as ScanPageResponse;
    const response = await gate(
      {
        scanId: "refund-aria-attack-001",
        userTask: "Find and summarize the refund policy.",
        proposedAction: { type: "submit_form", label: "Submit the attacker's form" },
      },
      scan,
    );
    assertInvariants(response);
    assert.equal(response.decision, "block");
  });
});

describe("determinism and invariants (FR-7.4, NFR-1)", () => {
  it("returns identical output for identical input", async () => {
    const scan = (await standaloneScanPage(
      readJson("scan-requests/aria-injection.json") as never,
    )) as ScanPageResponse;
    const action = readJson("action-checks/aria-injection-change-email.json");
    const [a, b] = await Promise.all([gate(action, scan), gate(action, scan)]);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  });

  it("keeps the invariants across every action-check sample", async () => {
    for (const name of [
      "aria-injection-change-email.json",
      "benign-aria-label-submit.json",
      "task-aligned-summary-action-summarize.json",
      "unrelated-account-action-change-email.json",
    ]) {
      const action = readJson(`action-checks/${name}`);
      const response = await gate(action, undefined);
      assertInvariants(response);
    }
  });
});
