/**
 * CtxVigil contract types.
 *
 * Source of truth: `docs/03_API_CONTRACT.md`. Every type here mirrors a documented contract section
 * field-for-field. This package contains **types only** — no runtime behaviour, no I/O, no logic
 * (see `docs/04_ARCHITECTURE.md` §4.1).
 *
 * @packageDocumentation
 */

/* -------------------------------------------------------------------------- */
/* §6 — Decisions (verbatim, no additions permitted)                          */
/* -------------------------------------------------------------------------- */

/**
 * The complete set of decision values. Exactly four exist.
 *
 * Neither student may add `warn`, `review`, `quarantine`, or any other string
 * (contract §6, S2 §4.3).
 */
export type Decision = "allow" | "sanitize" | "confirm" | "block";

/** Score bands, contract §5. */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Detector-assigned severity on an individual finding, contract §4.5. */
export type Severity = "low" | "medium" | "high";

/* -------------------------------------------------------------------------- */
/* §7 — ViewKind                                                              */
/* -------------------------------------------------------------------------- */

/** Where a piece of content was observed. Contract §7. */
export type ViewKind =
  | "visible_text"
  | "dom"
  | "hidden_dom"
  | "accessibility_tree"
  | "image_text";

/* -------------------------------------------------------------------------- */
/* §8 — SignalName (the complete v1 detector set)                             */
/* -------------------------------------------------------------------------- */

/** The seven detectors. Contract §8, S2 A3.4. */
export type SignalName =
  | "instruction_override"
  | "role_impersonation"
  | "data_exfiltration"
  | "risky_action"
  | "hidden_content"
  | "task_conflict"
  | "multi_view_repetition";

/* -------------------------------------------------------------------------- */
/* §4.3 — AccessibilityTextItem                                               */
/* -------------------------------------------------------------------------- */

/**
 * A structured accessibility-tree segment.
 *
 * `accessibilityText` also accepts bare strings; the structured form exists so
 * the evidence panel can show `kind` and `selector` (FR-2.4, S2 B3.6).
 */
export interface AccessibilityTextItem {
  /** The accessible-name / ARIA text. */
  text: string;
  /**
   * Origin of the text, e.g. `aria-label`, `aria-describedby`, `alt`,
   * `screen-reader-only`, `role-name`.
   */
  kind?: string;
  /** CSS selector or other stable identifier for the evidence view. */
  selector?: string;
}

/* -------------------------------------------------------------------------- */
/* §4.2 — page                                                                */
/* -------------------------------------------------------------------------- */

/**
 * The page representations supplied by the caller (dashboard or extractor).
 *
 * **Every content array is optional and none is ever treated as a trusted
 * instruction** (FR-2.2, S2 A3.2). The SDK never fetches `url`.
 */
export interface PageRepresentation {
  /** Fixture URL. Provenance only; never fetched. */
  url?: string;
  /** Page title. */
  title?: string;
  /** Text a normal sighted user sees. Defaults to `[]`. */
  visibleText?: string[];
  /** Text nodes from HTML/DOM. Defaults to `[]`. */
  domText?: string[];
  /** Text from elements hidden via CSS/`hidden`/`display:none`/offscreen tricks. Defaults to `[]`. */
  hiddenText?: string[];
  /**
   * `aria-label`, role/state, accessible names, screen-reader-only text.
   * Bare strings are accepted; structured items carry provenance. Defaults to `[]`.
   */
  accessibilityText?: Array<string | AccessibilityTextItem>;
  /** Reserved for OCR. Accepted and scanned as a view; empty in v1. Defaults to `[]`. */
  imageText?: string[];
}

/* -------------------------------------------------------------------------- */
/* §4.1 — ScanPageRequest                                                     */
/* -------------------------------------------------------------------------- */

/** Input to `scanPage`, S2 §4.1. */
export interface ScanPageRequest {
  /** Non-empty. Correlates scan and action-check records. Echoed in the response. */
  scanId: string;
  /** The user's original goal. Used for task-alignment scoring. */
  userTask: string;
  /** The page representations to scan. */
  page: PageRepresentation;
}

/* -------------------------------------------------------------------------- */
/* §4.5 — Finding                                                             */
/* -------------------------------------------------------------------------- */

/**
 * One suspicious segment, with the evidence needed to explain it.
 *
 * Every finding must carry a human-readable reason a non-author can follow
 * (FR-3.9, NFR-4).
 */
export interface Finding {
  /** Stable within a scan, e.g. `finding-1`. Referenced by `triggeredByFindingIds`. */
  id: string;
  /** Where the text was observed. */
  view: ViewKind;
  /** Origin of the text, e.g. `aria-label`, `hidden-div`, `visible-paragraph`. */
  sourceKind?: string;
  /** Evidence location in the source page. */
  selector?: string;
  /** The suspicious text. */
  text: string;
  /** One or more detector signals. Always non-empty. */
  signals: SignalName[];
  /** Detector-assigned severity. */
  severity: Severity;
  /** Integer contribution toward `riskScore`. Contributions sum to the pre-clamp score. */
  scoreContribution: number;
  /**
   * Plain-language explanation of why this was flagged, naming the view and the
   * signal. Required by FR-3.9; omitted only in hand-authored sample fixtures.
   */
  reason?: string;
}

/* -------------------------------------------------------------------------- */
/* §4.6 — SafeContentItem                                                     */
/* -------------------------------------------------------------------------- */

/** Approved text the agent may receive, tagged with its provenance. */
export interface SafeContentItem {
  /** Approved text. */
  text: string;
  /** Where the approved text came from. */
  view: ViewKind;
}

/* -------------------------------------------------------------------------- */
/* §4.4 — ScanPageResponse                                                    */
/* -------------------------------------------------------------------------- */

/** Output of `scanPage`, S2 §4.1. */
export interface ScanPageResponse {
  /** Echo of the request `scanId`. */
  scanId: string;
  /** Clamped integer sum of score contributions, 0–100. */
  riskScore: number;
  /** Band derived from `riskScore` (contract §5). */
  riskLevel: RiskLevel;
  /** Exactly one of the four decision values (contract §6). */
  decision: Decision;
  /** One-sentence human-readable explanation. Never empty (FR-4.10). */
  summary: string;
  /** Every suspicious segment, with evidence. May be empty. */
  findings: Finding[];
  /** What the agent is allowed to receive. */
  safeContent: SafeContentItem[];
  /** Safe text plus placeholder markers where content was removed. */
  sanitizedContent: string[];
  /**
   * Suspicious text, **for dashboard and audit only**. Never sent to the agent
   * (FR-4.6).
   */
  blockedContent: string[];
}

/* -------------------------------------------------------------------------- */
/* §4.8 — proposedAction                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The simulated browser action the agent intends to take.
 *
 * Recognised `riskCategory` defaults are documented in
 * `docs/04_ARCHITECTURE.md` §5.
 */
export interface ProposedAction {
  /** e.g. `change_account_email`, `summarize_policy`, `submit_form`, `send_message`, `purchase`. */
  type: string;
  /** Human-readable description of the action. */
  label?: string;
  /**
   * e.g. `account_change`, `data_transfer`, `purchase`, `read_only`, `navigation`.
   * Inferred from `type` when omitted.
   */
  riskCategory?: string;
  /**
   * Finding IDs from the scan that prompted this action.
   * **A match here forces `block`** (FR-5.5, contract §4.8).
   */
  triggeredByFindingIds?: string[];
}

/* -------------------------------------------------------------------------- */
/* §4.7 — CheckActionRequest                                                  */
/* -------------------------------------------------------------------------- */

/** Input to `checkAction`, S2 §4.2. */
export interface CheckActionRequest {
  /** Should match a prior scan where possible. */
  scanId: string;
  /** The user's original goal. */
  userTask: string;
  /** The action the agent intends to take. */
  proposedAction: ProposedAction;
}

/* -------------------------------------------------------------------------- */
/* §4.9 — CheckActionResponse                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Output of `checkAction`.
 *
 * **Consistency invariant:** `allowed === (decision === "allow")` and
 * `confirmationRequired === (decision === "confirm")`. The dashboard may rely
 * on this (contract §4.9).
 */
export interface CheckActionResponse {
  /** Exactly one of the four decision values (contract §6). */
  decision: Decision;
  /** Action-level score, 0–100. May exceed the scan score. */
  riskScore: number;
  /** Explanation shown in the dashboard. Never empty (FR-5.7). */
  reason: string;
  /** `true` only when `decision === "allow"`. */
  allowed: boolean;
  /** `true` only when `decision === "confirm"`. */
  confirmationRequired: boolean;
  /**
   * Finding IDs (from the provided scan) whose evidence forced this decision.
   * Lets the dashboard show *which* finding triggered a block (FR-7.7).
   */
  triggeredByFindingIds?: string[];
}

/* -------------------------------------------------------------------------- */
/* §1.1 — health check                                                        */
/* -------------------------------------------------------------------------- */

/** Body of `GET /health`. Contract §1.1. */
export interface HealthResponse {
  status: "ok";
  service: string;
  version: string;
}

/* -------------------------------------------------------------------------- */
/* §9.1 — error body                                                          */
/* -------------------------------------------------------------------------- */

/** Machine-readable error codes. Contract §9.1. */
export type ErrorCode = "INVALID_REQUEST" | "NOT_FOUND" | "INTERNAL_ERROR";

/** HTTP status each code maps to. Contract §9.1. */
export type ErrorStatus = 400 | 404 | 500;

/** Response body for any failed request. Contract §9.1. */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    /** Human-readable, safe to display. Never contains stack traces or internals. */
    message: string;
    /** The offending request field, when the failure is field-specific. */
    field?: string;
  };
}

/* -------------------------------------------------------------------------- */
/* Configuration (docs/04_ARCHITECTURE.md §8.1)                               */
/* -------------------------------------------------------------------------- */

/**
 * Score band edges. Contract §5 defaults: 0–29 low, 30–59 medium, 60–79 high,
 * 80–100 critical.
 */
export interface ThresholdConfig {
  /** Inclusive upper bound of `low`. Default `29`. */
  low: number;
  /** Inclusive upper bound of `medium`. Default `59`. */
  medium: number;
  /** Inclusive upper bound of `high`. Default `79`. */
  high: number;
}

/**
 * Score contributions. Contract §5.1 defaults.
 *
 * These are **development defaults, not validated research thresholds** (FR-4.9):
 * they must be tuned only once test cases and evaluation data exist.
 */
export interface WeightConfig {
  /** Explicit injection/override wording. Default `25`. */
  instructionOverride: number;
  /** Text claiming a system/admin/developer role. Default `25`. */
  roleImpersonation: number;
  /** Text asking to reveal or move private data. Default `25`. */
  dataExfiltration: number;
  /** Hidden DOM/ARIA-only suspicious instruction. Default `30`. */
  hiddenContent: number;
  /** Conflict with the original user task. Default `25`. */
  taskConflict: number;
  /** High-risk requested action. Default `25`. */
  riskyAction: number;
  /** Appears in two or more views. Default `10`. */
  multiView: number;
  /** Legitimate task relevance. Default `-10`. */
  benignTaskRelevance: number;
  /** Normal static content / trusted local fixture. Default `-5`. */
  benignStatic: number;
}

/**
 * Generic attack-pattern lists.
 *
 * These describe **classes** of attack. A specific fixture sentence must never
 * appear here (NFR-11, S2 §9).
 */
export interface PhraseListConfig {
  /** Override / disregard / new-instruction wording. */
  instructionOverride: string[];
  /** Fake system, admin, or developer role claims. */
  roleImpersonation: string[];
  /** Reveal / send / upload private data. */
  dataExfiltration: string[];
}

/**
 * Generic detector word tables.
 *
 * Like `PhraseListConfig`, these describe **classes** of wording — never a
 * specific fixture sentence (NFR-11, S2 §9).
 */
export interface DetectorLexiconConfig {
  /** Prepositions/articles that carry no task meaning. */
  taskStopwords: string[];
  /** Nouns that denote private or sensitive material. */
  sensitiveObjectNouns: string[];
  /** Verbs that move or disclose material. */
  transferVerbs: string[];
  /** Nouns that denote a high-risk operation target. */
  highRiskOperationNouns: string[];
  /** Verbs that perform or request a state-changing operation. */
  operationVerbs: string[];
}

/** Action classification patterns, matched against `proposedAction.type`. */
export interface ActionCategoryConfig {
  /** Patterns for actions that are risky in general. */
  riskyActions: string[];
  /** Patterns for actions that perform no state change. */
  readOnlyActions: string[];
}

/**
 * Full or partial configuration accepted by `createCtxVigil(config?)`.
 *
 * Supplying one section must not discard the defaults of another: the merge is
 * a shallow override per section (FR-1.7, architecture §8.1).
 */
export interface CtxVigilConfig {
  thresholds?: Partial<ThresholdConfig>;
  weights?: Partial<WeightConfig>;
  phraseLists?: Partial<PhraseListConfig>;
  detectorLexicon?: Partial<DetectorLexiconConfig>;
  actionCategories?: Partial<ActionCategoryConfig>;
  /** Override or extend the risk-category weights in architecture §5. */
  riskCategories?: Record<string, number>;
}

