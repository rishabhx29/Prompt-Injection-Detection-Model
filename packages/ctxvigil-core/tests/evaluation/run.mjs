/**
 * `npm run evaluate` — writes tests/results/evaluation.json and exits non-zero
 * when any fixed expectation mismatches (docs/06 §9), so the evaluation is a
 * check, not just a report generator.
 */

import { mkdirSync, writeFileSync } from "node:fs";

import { runEvaluation } from "./harness.mjs";

const artifact = await runEvaluation();
const resultsDir = new URL("../results/", import.meta.url);
mkdirSync(resultsDir, { recursive: true });
const artifactPath = new URL("evaluation.json", resultsDir);
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);

const mismatched = artifact.cases.filter((record) => !matchSilent(record));
function matchSilent(record) {
  const expected = record.expectedScanDecision;
  const scanOk =
    expected === undefined ||
    (Array.isArray(expected) ? expected.includes(record.observedScanDecision) : expected === record.observedScanDecision);
  const actionOk =
    record.observedActionDecision === undefined ||
    record.expectedActionDecision === undefined ||
    (Array.isArray(record.expectedActionDecision)
      ? record.expectedActionDecision.includes(record.observedActionDecision)
      : record.expectedActionDecision === record.observedActionDecision);
  const channelOk =
    record.expectedChannel === undefined ||
    record.label !== "malicious" ||
    record.expectedChannel === "none" ||
    record.findingViews.includes(record.expectedChannel);
  return scanOk && actionOk && channelOk;
}

console.log(`evaluation: ${artifact.summary.total} cases → ${artifactPath.pathname.replace(/^\/([A-Za-z]:)/, "$1")}`);
console.log(
  `M1 contract: ${artifact.summary.contractTestsPassing} · M3 precision: ${artifact.summary.precision} · ` +
    `M4 recall: ${artifact.summary.recall} · M5 benign FP: ${artifact.summary.falsePositiveCount} · ` +
    `M6 unsafe blocked: ${artifact.summary.unsafeActionBlockRate} (of ${artifact.summary.unsafeActionCount}) · ` +
    `M7 safe allowed: ${artifact.summary.safeActionAllowRate} (of ${artifact.summary.safeActionCount})`,
);
console.log(
  `M10 latency median/max: ${artifact.summary.latencyMedianMs}/${artifact.summary.latencyMaxMs} ms · ` +
    `M11 advantage over visible-only: ${artifact.summary.multiViewAdvantage.overVisibleOnly}, over DOM-only: ${artifact.summary.multiViewAdvantage.overDomOnly} · ` +
    `M12 held-back recall: ${artifact.summary.heldbackRecall}`,
);

process.exit(mismatched.length === 0 ? 0 : 1);
