/**
 * Public surface of `ctxvigil` (FR-1.1–FR-1.3; architecture §4.2, contract §10).
 *
 * Everything a consumer needs is exported from here: the two hook functions,
 * the factory, the contract types, and the typed error. Nothing else in the
 * package is public.
 *
 * **Skeleton status (ticket 01):** the pipeline below walks validation and
 * normalisation — both fully implemented — and stops there. Detection, scoring,
 * policy, and the action gate are stubs (tickets 03–05 replace them):
 *
 * - `scanPage` returns an empty-findings, score-0, `allow` response whose
 *   `safeContent` currently exposes every segment. **This is not a safety
 *   judgement** — no detector has run — and the `summary` says so explicitly.
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
import { CtxVigilError, isCtxVigilError } from "./errors.ts";
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

/**
 * The scan pipeline, stages 1–2 real, 3–5 stubbed (architecture §6).
 *
 * Stage order is fixed: `validate → normalise → detect → score → policy`.
 * The stub occupies stages 3–5 only; tickets 03–05 slot in without touching
 * stages 1–2 or the response assembly below.
 */
async function runScanPage(input: unknown, config: ResolvedConfig): Promise<ScanPageResponse> {
  // Stage 1 — validation (real).
  const request = validateScanPageRequest(input);

  // Stage 2 — normalisation (real): provenance-tagged, deduplicated segments.
  const segments = normalisePage(request.page);

  /* -------------------------------------------------------------------------
   * SKELETON STUB — stages 3–5 (tickets 03–05).
   * Not a safety judgement: no detector has run, so no finding exists yet.
   * The summary must say so — an unexplained `allow` would violate NFR-8.
   * ---------------------------------------------------------------------- */
  const findings: ScanPageResponse["findings"] = [];
  const riskScore = 0;
  const riskLevel: RiskLevel = riskScore <= config.thresholds.low ? "low" : "medium";
  const decision: Decision = riskScore <= config.thresholds.low ? "allow" : "sanitize";

  return {
    scanId: request.scanId,
    riskScore,
    riskLevel,
    decision,
    summary:
      segments.length === 0
        ? `Skeleton scan ${request.scanId}: the page supplied no content, and detection is not implemented yet, so nothing was flagged.`
        : `Skeleton scan ${request.scanId}: ${segments.length} content segment(s) normalised, but detection is not implemented yet, so nothing was flagged and nothing was blocked.`,
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
