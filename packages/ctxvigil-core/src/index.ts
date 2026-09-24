/**
 * Public surface of `ctxvigil` (FR-1.1–FR-1.3; architecture §4.2, contract §10).
 *
 * Everything a consumer needs is exported from here: the two hook functions,
 * the factory, the contract types, and the typed error. Nothing else in the
 * package is public.
 *
 * **Status:** the full pipeline is implemented — validation, normalisation,
 * detection, scoring, content policy, and the action gate.
 *
 * - `scanPage` returns a clamped 0–100 score, a banded `riskLevel`, one decision
 *   from `allow`/`sanitize`/`confirm`/`block`, one finding per suspicious
 *   segment, and the three audience-separated content fields.
 * - `checkAction` decides independently whether a proposed action may execute
 *   (architecture §5.1); a missing scan is a supported call, handled
 *   conservatively — a risky category never returns `allow` for lack of context
 *   (FR-5.9, architecture §7).
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
import { CtxVigilError, isCtxVigilError } from "./errors.ts";
import { evaluateAction } from "./action/index.ts";
import { detectPage } from "./detect/index.ts";
import { normalisePage } from "./normalise/index.ts";
import { applyPolicy } from "./policy/index.ts";
import { scoreScan } from "./score/index.ts";
import { validateCheckActionRequest, validateScanPageRequest } from "./validate/index.ts";
import {
  evaluateMultiViewAgreement,
  type MultiViewInput,
  type MultiViewAgreementResult,
} from "./multiview/index.ts";

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

// Multi-View Semantic Agreement Layer (DA-1 §4.1)
export {
  evaluateMultiViewAgreement,
  embedSemanticText,
  cosineSimilarity,
} from "./multiview/index.ts";
export type {
  MultiViewInput,
  PairwiseAgreements,
  MultiViewAgreementResult,
} from "./multiview/index.ts";

/* -------------------------------------------------------------------------- */
/* Pipeline — scanPage                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The scan pipeline, stages 1–5 (architecture §6).
 *
 * Stage order is fixed: `validate → normalise → detect → score → policy`.
 * Every stage is a pure function; this function only sequences them.
 */
async function runScanPage(input: unknown, config: ResolvedConfig): Promise<ScanPageResponse> {
  // Stage 1 — validation.
  const request = validateScanPageRequest(input);

  // Stage 2 — normalisation: provenance-tagged, deduplicated segments.
  const segments = normalisePage(request.page);

  // Stage 3 — detection: explainable hits, one per signal per segment.
  const hits = detectPage({ segments, userTask: request.userTask, config });

  // Stage 4 — scoring: findings + clamped integer score + banded risk level/decision.
  const { findings, flaggedSegmentIndexes, riskScore, riskLevel, decision } = scoreScan({
    segments,
    hits,
    userTask: request.userTask,
    config,
  });

  // Stage 5 — content policy: audience-separated content + summary. The decision
  // comes from the scorer's single band table and is never recomputed here.
  const policy = applyPolicy({
    scanId: request.scanId,
    segments,
    findings,
    flaggedSegmentIndexes,
    decision,
    config,
  });

  return {
    scanId: request.scanId,
    riskScore,
    riskLevel,
    decision: policy.decision,
    summary: policy.summary,
    findings,
    safeContent: policy.safeContent,
    sanitizedContent: policy.sanitizedContent,
    blockedContent: policy.blockedContent,
  };
}

/* -------------------------------------------------------------------------- */
/* Pipeline — checkAction                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The action gate (stage 6, architecture §5.1) — an independent check, not a
 * repeat of the scan pipeline (FR-5.8).
 *
 * Calling without a prior scan is a **supported call**, handled conservatively:
 * a risky category never returns `allow` merely because context is missing
 * (FR-5.9, architecture §7).
 */
async function runCheckAction(input: unknown, config: ResolvedConfig): Promise<CheckActionResponse> {
  const request = validateCheckActionRequest(input);
  const scan = (input as CheckActionInput).scan;
  const outcome = evaluateAction({ request, scan, config });

  // Consistency invariants (contract §4.9): derived, never asserted independently.
  return {
    decision: outcome.decision,
    riskScore: outcome.riskScore,
    reason: outcome.reason,
    allowed: outcome.decision === "allow",
    confirmationRequired: outcome.decision === "confirm",
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

/** The hook functions and evaluators an integrator wraps around an agent (contract §10, DA-1 §4.1). */
export interface CtxVigil {
  /** Scan content before the agent reads it. */
  scanPage(input: ScanPageRequest): Promise<ScanPageResponse>;
  /** Validate a proposed action before it executes. */
  checkAction(input: CheckActionInput): Promise<CheckActionResponse>;
  /** Evaluate multi-view semantic agreement across V1 (task), V2 (system), V3 (action), and V4 (observation context). */
  evaluateMultiViewAgreement(input: MultiViewInput): MultiViewAgreementResult;
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
    evaluateMultiViewAgreement: (input) => evaluateMultiViewAgreement(input),
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
