/**
 * Evaluation harness (ticket 09; docs/06_EVALUATION_PLAN.md §2–§9).
 *
 * Runs every case in `cases/index.json` through the public SDK, computes the
 * plan's metrics M1–M12 with denominators always included, runs the two
 * single-view baselines (§5), evaluates the held-back variants (§8.1), and
 * writes the machine-readable artifact from §9.
 *
 * Plain `.mjs` importing `ctxvigil` by package name — the harness is part of the
 * evaluation, not of the product; it adds no rules and tunes nothing.
 */

import { readFileSync } from "node:fs";

import { checkAction, scanPage } from "ctxvigil";

const EVAL_DIR = new URL("./", import.meta.url);
const SAMPLE_DIR = new URL("../../../../sample-data/", import.meta.url);

function loadJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

/** Case paths starting with `scan-requests/` or `action-checks/` are contract
 *  bytes from sample-data; everything else is relative to the manifest's dir. */
function resolveRequest(baseDir, relative) {
  if (relative.startsWith("scan-requests/") || relative.startsWith("action-checks/")) {
    return loadJson(new URL(relative, SAMPLE_DIR));
  }
  return loadJson(new URL(relative, baseDir));
}

/** Baseline view blanking (docs/06 §5): same scanner, only the input changes. */
function withBaseline(request, baseline) {
  const page = { ...request.page };
  if (baseline === "visible") {
    page.domText = [];
    page.hiddenText = [];
    page.accessibilityText = [];
    page.imageText = [];
  } else if (baseline === "dom") {
    page.visibleText = [];
    page.hiddenText = [];
    page.accessibilityText = [];
    page.imageText = [];
  }
  return { ...request, page };
}

function matchesExpectation(observed, expected) {
  if (expected === undefined) return true;
  if (Array.isArray(expected)) return expected.includes(observed);
  return observed === expected;
}

/** A state counts as "flagged" when its scan is not `allow`, or its gated
 *  action was blocked or demanded confirmation (docs/06 §6 note 2: `confirm`
 *  counts as flagged). */
function isFlagged(record) {
  return (
    record.observedScanDecision !== "allow" ||
    ["block", "confirm"].includes(record.observedActionDecision)
  );
}

async function runCase(testCase, baseDir, baseline = "full") {
  const request = withBaseline(
    { ...resolveRequest(baseDir, testCase.scanRequest), userTask: testCase.userTask },
    baseline,
  );

  const started = performance.now();
  const scan = await scanPage(request);
  const latencyMs = Math.round((performance.now() - started) * 100) / 100;

  let action;
  const actionRequest = testCase.actionRequest
    ? resolveRequest(baseDir, testCase.actionRequest)
    : undefined;
  const proposedAction = testCase.proposedAction
    ? { ...testCase.proposedAction }
    : undefined;
  if (actionRequest !== undefined || proposedAction !== undefined) {
    const gateInput = actionRequest ?? {
      scanId: scan.scanId,
      userTask: testCase.userTask,
      proposedAction,
    };
    action = await checkAction({ ...gateInput, scan });
  }

  return {
    caseId: testCase.caseId,
    basedOnFixture: testCase.basedOnFixture,
    testId: testCase.testId,
    label: testCase.label,
    expectedChannel: testCase.expectedChannel,
    expectedScanDecision: testCase.expectedScanDecision,
    observedScanDecision: scan.decision,
    observedRiskLevel: scan.riskLevel,
    observedRiskScore: scan.riskScore,
    findingViews: [...new Set(scan.findings.map((finding) => finding.view))],
    signals: scan.findings.map((finding) => ({ view: finding.view, signals: finding.signals })),
    evidenceComplete: scan.findings.every(
      (finding) =>
        typeof finding.view === "string" &&
        finding.signals.length >= 1 &&
        typeof finding.severity === "string" &&
        finding.text.trim() !== "",
    ),
    expectedActionDecision: testCase.expectedActionDecision,
    observedActionDecision: action?.decision,
    latencyMs,
    variant: testCase.variant,
  };
}

function match(record) {
  if (!matchesExpectation(record.observedScanDecision, record.expectedScanDecision)) return false;
  if (record.expectedChannel !== undefined && record.label === "malicious") {
    if (record.expectedChannel !== "none" && !record.findingViews.includes(record.expectedChannel)) {
      return false;
    }
  }
  if (record.observedActionDecision !== undefined) {
    if (!matchesExpectation(record.observedActionDecision, record.expectedActionDecision)) {
      return false;
    }
  }
  return true;
}

function confusion(records) {
  const tp = records.filter((r) => r.label === "malicious" && isFlagged(r)).length;
  const fn = records.filter((r) => r.label === "malicious" && !isFlagged(r)).length;
  const fp = records.filter((r) => r.label === "benign" && isFlagged(r)).length;
  const tn = records.filter((r) => r.label === "benign" && !isFlagged(r)).length;
  return { tp, fn, fp, tn };
}

function ratio(numerator, denominator) {
  if (denominator === 0) return null; // report "n/a", never a fake 0% (docs/06 §6)
  return Math.round((numerator / denominator) * 1000) / 1000;
}

function metricsFor(records) {
  const { tp, fn, fp, tn } = confusion(records);
  return {
    tp,
    fn,
    fp,
    tn,
    precision: ratio(tp, tp + fp),
    recall: ratio(tp, tp + fn),
    benignFalsePositiveRate: ratio(fp, fp + tn),
  };
}

/**
 * Run the whole evaluation and return the §9 artifact (in-memory).
 *
 * Warm-up pass first, then the timed pass (docs/06 §7): the reported latency is
 * the warm per-case wall-clock time, with no logging inside the timing loop.
 */
export async function runEvaluation() {
  const cases = loadJson(new URL("cases/index.json", EVAL_DIR));
  const heldback = loadJson(new URL("heldback/index.json", EVAL_DIR));

  // Warm-up: module loading and first-touch caches must not pollute M10.
  for (const testCase of cases) {
    await runCase(testCase, new URL("cases/", EVAL_DIR));
  }

  const records = [];
  for (const testCase of cases) {
    records.push(await runCase(testCase, new URL("cases/", EVAL_DIR)));
  }

  // Baselines (docs/06 §5): the same cases with the other views blanked out.
  const baselineRecords = { visible: [], dom: [] };
  for (const baseline of ["visible", "dom"]) {
    for (const testCase of cases) {
      baselineRecords[baseline].push(await runCase(testCase, new URL("cases/", EVAL_DIR), baseline));
    }
  }

  // Held-back variants (docs/06 §8.1): scored, never tuned against.
  const heldbackRecords = [];
  for (const testCase of heldback) {
    heldbackRecords.push(await runCase(testCase, new URL("heldback/", EVAL_DIR)));
  }

  const contractTestIds = new Set(
    cases.filter((testCase) => testCase.testId !== undefined).map((testCase) => testCase.testId),
  );
  const contractRecords = records.filter((record) => record.testId !== undefined);
  const contractPassing = contractRecords.filter((record) => match(record)).length;

  const contentMetrics = metricsFor(records);
  const flaggedMalicious = records.filter(
    (record) => record.label === "malicious" && isFlagged(record),
  );
  const attributed = flaggedMalicious.filter(
    (record) =>
      record.expectedChannel === undefined ||
      record.expectedChannel === "none" ||
      record.findingViews.includes(record.expectedChannel),
  );

  const actionStates = records.filter((record) => record.observedActionDecision !== undefined);
  const unsafeActions = actionStates.filter((record) => record.expectedActionDecision === "block");
  const safeActions = actionStates.filter((record) => record.expectedActionDecision === "allow");

  // M5 (docs/06 §6 note 2): a benign state counts as a false positive only when
  // it is flagged *and* its expectation did not already grant that posture.
  const benignFalsePositives = records.filter(
    (record) =>
      record.label === "benign" &&
      isFlagged(record) &&
      (!matchesExpectation(record.observedScanDecision, record.expectedScanDecision) ||
        (record.observedActionDecision !== undefined &&
          !matchesExpectation(record.observedActionDecision, record.expectedActionDecision))),
  );
  const benignBlockOrConfirm = records.filter(
    (record) =>
      record.label === "benign" &&
      (["block", "confirm"].includes(record.observedScanDecision) ||
        ["block", "confirm"].includes(record.observedActionDecision)),
  );

  const full = metricsFor(records);
  const visibleOnly = metricsFor(baselineRecords.visible);
  const domOnly = metricsFor(baselineRecords.dom);

  const latencies = records.map((record) => record.latencyMs).sort((a, b) => a - b);
  const median =
    latencies.length === 0
      ? 0
      : latencies.length % 2 === 1
        ? latencies[(latencies.length - 1) / 2]
        : (latencies[latencies.length / 2 - 1] + latencies[latencies.length / 2]) / 2;

  return {
    generatedBy: "ctxvigil-evaluate",
    version: "0.1.0",
    machine: `Node ${process.version}`,
    cases: records,
    baselines: {
      visibleOnly: { metrics: visibleOnly },
      domOnly: { metrics: domOnly },
      full: { metrics: full },
    },
    heldback: {
      note: "Variants under tests/evaluation/heldback/ were written before any run and never used to author or tune a rule (docs/06 §8.1). Reported side by side with the curated set, no commentary excusing the gap.",
      cases: heldbackRecords,
      metrics: metricsFor(heldbackRecords),
    },
    falsePositiveLog: benignBlockOrConfirm.map((record) => ({
      caseId: record.caseId,
      observedScanDecision: record.observedScanDecision,
      observedActionDecision: record.observedActionDecision,
      expectedActionDecision: record.expectedActionDecision,
      defensible:
        match(record) &&
        record.expectedActionDecision !== undefined &&
        matchesExpectation(record.observedActionDecision, record.expectedActionDecision),
      cause:
        record.observedActionDecision === "confirm"
          ? "sensitive action posture on an unaligned action (by-design confirmation, not a detection error)"
          : "see case expectation",
    })),
    summary: {
      total: records.length,
      contractTestsPassing: `${contractPassing}/${contractTestIds.size}`,
      precision: contentMetrics.precision,
      recall: contentMetrics.recall,
      benignFalsePositiveRate: contentMetrics.benignFalsePositiveRate,
      benignBlockOrConfirmCount: benignBlockOrConfirm.length,
      falsePositiveCount: benignFalsePositives.length,
      unsafeActionBlockRate: ratio(
        unsafeActions.filter((record) => record.observedActionDecision === "block").length,
        unsafeActions.length,
      ),
      unsafeActionCount: unsafeActions.length,
      safeActionAllowRate: ratio(
        safeActions.filter((record) => record.observedActionDecision === "allow").length,
        safeActions.length,
      ),
      safeActionCount: safeActions.length,
      evidenceCompleteness: ratio(
        records.filter((record) => record.evidenceComplete).length,
        records.length,
      ),
      attribution: ratio(attributed.length, flaggedMalicious.length),
      latencyMedianMs: median,
      latencyMaxMs: latencies[latencies.length - 1] ?? 0,
      multiViewAdvantage: {
        overVisibleOnly:
          full.recall === null || visibleOnly.recall === null
            ? null
            : Math.round((full.recall - visibleOnly.recall) * 1000) / 1000,
        overDomOnly:
          full.recall === null || domOnly.recall === null
            ? null
            : Math.round((full.recall - domOnly.recall) * 1000) / 1000,
      },
      heldbackRecall: metricsFor(heldbackRecords).recall,
    },
  };
}
