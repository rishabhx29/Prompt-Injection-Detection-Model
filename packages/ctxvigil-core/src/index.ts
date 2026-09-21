/**
 * Public surface of `ctxvigil` (FR-1.1–FR-1.3; architecture §4.2, contract §10).
 *
 * Everything a consumer needs is exported from here: the two hook functions,
 * the factory, the contract types, and the typed error. Nothing else in the
 * package is public.
 *
 * **Skeleton status:** stages 1–3 walk validation, normalisation, and detection —
 * all fully implemented. Scoring, policy, and the action gate are stubs
 * (tickets 04–05 replace them):
 *
 * - `scanPage` returns real detector findings (each with signal, evidence,
 *   severity, and score contribution). Risk, decision, `safeContent`, and
 *   `blockedContent` remain stubs until the scorer and policy land, and the
 *   `summary` says so explicitly.
 * - `checkAction` fails **closed**: it returns `confirm` so no proposed action
 *   can execute without user confirmation until the real gate lands
 *   (architecture §7: no code path may convert uncertainty into `allow`).
 */

import type {
  CheckActionRequest,
  CheckActionResponse,
  CtxVigilConfig,
  Decision,
  RiskLevel,
  ScanPageRequest,
  ScanPageResponse,
} from "@ctxvigil/shared-types";

import { resolveConfig } from "./config/defaults.ts";
import type { ResolvedConfig } from "./config/types.ts";
import { CtxVigilError, internalError, isCtxVigilError } from "./errors.ts";
import { detectPage } from "./detect/index.ts";
import type { DetectorHit } from "./detect/index.ts";
import { normalisePage } from "./normalise/index.ts";
import { validateCheckActionRequest, validateScanPageRequest } from "./validate/index.ts";

/* -------------------------------------------------------------------------- */
/* Re-exports                                                                 */
/* -------------------------------------------------------------------------- */

/** The typed error the SDK throws on every failure path (contract §9.1). */
export { CtxVigilError, isCtxVigilError };

// Contract types (architecture §3: `shared-types` may be re-exported so
// consumers install one package).
export type {
  AccessibilityTextItem,
  ActionCategoryConfig,
  CheckActionRequest,
  CheckActionResponse,
  CtxVigilConfig,
  Decision,
  DetectorLexiconConfig,
  ErrorCode,
  Finding,
  HealthResponse,
  PageRepresentation,
  PhraseListConfig,
  ProposedAction,
  RiskLevel,
  SafeContentItem,
  ScanPageRequest,
  ScanPageResponse,
  Severity,
  SignalName,
  ThresholdConfig,
  ViewKind,
  WeightConfig,
} from "@ctxvigil/shared-types";

/* -------------------------------------------------------------------------- */
/* Pipeline — scanPage                                                        */
/* -------------------------------------------------------------------------- */

const SEVERITY_RANK: Record<DetectorHit["severity"], number> = { low: 0, medium: 1, high: 2 };

/** Group detector hits by segment, preserving first-seen segment order. */
function groupHitsBySegment(hits: readonly DetectorHit[]): Map<number, DetectorHit[]> {
  const grouped = new Map<number, DetectorHit[]>();
  for (const hit of hits) {
    const existing = grouped.get(hit.segmentIndex);
    if (existing === undefined) {
      grouped.set(hit.segmentIndex, [hit]);
    } else {
      existing.push(hit);
    }
  }
  return grouped;
}

/** The most serious severity among a segment's hits. */
function highestSeverity(hits: readonly DetectorHit[]): DetectorHit["severity"] {
  let highest: DetectorHit["severity"] = "low";
  for (const hit of hits) {
    if (SEVERITY_RANK[hit.severity] > SEVERITY_RANK[highest]) highest = hit.severity;
  }
  return highest;
}

/**
 * The scan pipeline, stages 1–3 real, 4–5 stubbed (architecture §6).
 *
 * Stage order is fixed: `validate → normalise → detect → score → policy`.
 * Detection populates `findings` with contract-shaped evidence now; ticket 04
 * replaces the stub risk/decision/content outputs with the real scorer and policy.
 */
async function runScanPage(input: unknown, config: ResolvedConfig): Promise<ScanPageResponse> {
  // Stage 1 — validation (real).
  const request = validateScanPageRequest(input);

  // Stage 2 — normalisation (real): provenance-tagged, deduplicated segments.
  const segments = normalisePage(request.page);

  // Stage 3 — detection (real): contract-shaped, explainable hits.
  const hits = detectPage({ segments, userTask: request.userTask, config });

  /* -------------------------------------------------------------------------
   * SKELETON STUB — stages 4–5 (tickets 04–05).
   * Findings are real detector output; risk, decision, and content partitioning
   * below remain stubs until the scorer and content policy land. The summary
   * must say so — an unexplained score would violate NFR-8.
   * ---------------------------------------------------------------------- */

  // One contract finding per suspicious segment — contract §2.2 shows a single
  // finding carrying several signal names for the same text.
  const findings: ScanPageResponse["findings"] = [];
  for (const [segmentIndex, segmentHits] of groupHitsBySegment(hits)) {
    const segment = segments[segmentIndex];
    if (segment === undefined) {
      // Fail loudly, never silently: a missing segment means the detector and
      // normaliser disagree (architecture §7).
      throw internalError(`Detector hit references missing segment ${segmentIndex}.`);
    }
    findings.push({
      id: `finding-${findings.length + 1}`,
      view: segment.view,
      sourceKind: segment.sourceKind,
      ...(segment.selector === undefined ? {} : { selector: segment.selector }),
      text: segment.text,
      // Detector order is stable, so the strongest signal is listed first.
      signals: [...new Set(segmentHits.map((hit) => hit.signal))],
      severity: highestSeverity(segmentHits),
      scoreContribution: segmentHits.reduce((sum, hit) => sum + hit.scoreContribution, 0),
    });
  }

  // Scoring is not implemented yet, so the score stays a placeholder. The
  // decision still fails closed: any finding keeps the response out of `allow`
  // until the real policy can judge it (architecture §7).
  const riskScore = 0;
  const riskLevel: RiskLevel = riskScore <= config.thresholds.low ? "low" : "medium";
  const decision: Decision = findings.length === 0 ? "allow" : "confirm";

  return {
    scanId: request.scanId,
    riskScore,
    riskLevel,
    decision,
    summary:
      findings.length === 0
        ? `Scan ${request.scanId}: no suspicious wording found in ${segments.length} content segment(s); scoring is not implemented yet, so the score is a placeholder.`
        : `Scan ${request.scanId}: ${findings.length} suspicious segment(s) flagged by detection; scoring and content policy are not implemented yet, so the score is a placeholder and the decision fails closed pending review.`,
    findings,
    safeContent: segments.map((segment) => ({ text: segment.text, view: segment.view })),
    sanitizedContent: segments.map((segment) => segment.text),
    blockedContent: [],
  };
}

/* -------------------------------------------------------------------------- */
/* Pipeline — checkAction                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The action gate, stubbed until ticket 05.
 *
 * Fails **closed** (architecture §7, contract §10 point 6): until the real
 * gate exists, no action may be silently allowed. `confirm` keeps the action
 * pending behind user confirmation — the weakest safe decision.
 *
 * The prior `scan` result (contract §10 point 3) is accepted on the input and
 * deliberately unused by this stub; ticket 05's gate consumes it.
 */
async function runCheckAction(input: unknown, _config: ResolvedConfig): Promise<CheckActionResponse> {
  const request = validateCheckActionRequest(input);

  const decision: Decision = "confirm";
  return {
    decision,
    riskScore: 0,
    reason:
      "The action gate is not implemented in this skeleton build, so the proposed action cannot be evaluated; user confirmation is required before it executes (fail-closed placeholder, replaced by the action-gate ticket).",
    allowed: decision === "allow",
    confirmationRequired: decision === "confirm",
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * SDK input for `checkAction`: the contract `CheckActionRequest` **plus** the
 * prior `scan` result (contract §10 point 3). The skeleton validates the
 * request part and ignores `scan`; ticket 05's gate consumes it.
 */
export interface CheckActionInput extends CheckActionRequest {
  /** The prior `scanPage` result, when one exists (FR-5.9). */
  scan?: ScanPageResponse;
}

/** The two hook functions an integrator wraps around an agent (contract §10). */
export interface CtxVigil {
  /** Scan content before the agent reads it. */
  scanPage(input: ScanPageRequest): Promise<ScanPageResponse>;
  /** Validate a proposed action before it executes. */
  checkAction(input: CheckActionInput): Promise<CheckActionResponse>;
}

/**
 * Create a configured guard (FR-1.2, FR-1.7).
 *
 * Defaults are usable with no arguments; a partial config is merged over the
 * defaults per section (see `resolveConfig`).
 */
export function createCtxVigil(config: CtxVigilConfig = {}): CtxVigil {
  const resolved = resolveConfig(config);
  return {
    scanPage: (input) => runScanPage(input, resolved),
    checkAction: (input) => runCheckAction(input, resolved),
  };
}

/**
 * Standalone `scanPage` with the default configuration (contract §10 point 4).
 */
export function scanPage(
  input: ScanPageRequest,
  config: CtxVigilConfig = {},
): Promise<ScanPageResponse> {
  return runScanPage(input, resolveConfig(config));
}

/**
 * Standalone `checkAction` with the default configuration (contract §10 point 4).
 */
export function checkAction(
  input: CheckActionInput,
  config: CtxVigilConfig = {},
): Promise<CheckActionResponse> {
  return runCheckAction(input, resolveConfig(config));
}
