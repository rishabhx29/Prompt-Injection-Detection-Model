/**
 * Stage 6 — the action gate (FR-5.1–FR-5.9; architecture §5, §5.1).
 *
 * An **independent check**, not a repeat of the scan pipeline (FR-5.8): it takes
 * the already-scanned result as context and decides only whether the proposed
 * action may execute. Decision procedure (architecture §5.1):
 *
 * 1. resolve the risk category (given, or inferred from `type`)
 * 2. compute deterministic keyword alignment with the user's task (no LLM, FR-5.2)
 * 3. start from the category's default posture
 * 4. force `block` when `triggeredByFindingIds` matches a finding in the scan (FR-5.5)
 * 5. force `block` for a risky category when **no scan** was provided and the task
 *    shows no authorisation — missing context is never "safe by default" (FR-5.9)
 * 6. destructive actions always block
 * 7. emit a non-empty reason naming the task, the action, and the deciding rule (FR-5.7)
 *
 * Alignment can lower a posture (architecture §5 note 3): an action that is
 * explicitly part of the user's own task is allowed even in a high-risk
 * category — that is the `unrelated-account-action` vs
 * `task-aligned-summary-action` contrast in the seven contract tests.
 */

import type { CheckActionRequest, Decision, ScanPageResponse } from "@ctxvigil/shared-types";
import type { ActionPosture, ResolvedConfig } from "../config/types.ts";
import { meaningfulTokens } from "../text/tokens.ts";

/** Category used when the type matches no configured pattern (never read_only, FR-5.9). */
const UNKNOWN_CATEGORY = "unknown";

/** Internal outcome before the response invariants are applied. */
export interface ActionGateOutcome {
  decision: Decision;
  /** The action's category weight, 0–100 (architecture §5). */
  riskScore: number;
  /** Non-empty explanation naming the task, the action, and the deciding rule. */
  reason: string;
}

/** Arguments for {@link evaluateAction}. */
export interface EvaluateActionArgs {
  /** Already-validated request. */
  request: CheckActionRequest;
  /** The prior scan, when the integrator supplied one. */
  scan: ScanPageResponse | undefined;
  config: ResolvedConfig;
}

interface ResolvedCategory {
  category: string;
  weight: number;
  /** False when the caller supplied a category the config does not know. */
  known: boolean;
}

/**
 * Resolve the risk category: explicit `riskCategory` wins; otherwise infer from
 * `type` using the configured ordered patterns; otherwise unknown (cautious).
 */
function resolveCategory(
  type: string,
  requestedCategory: string | undefined,
  config: ResolvedConfig,
): ResolvedCategory {
  const normalizedType = type.trim().toLowerCase();
  const weights = config.riskCategories.weights;

  if (requestedCategory !== undefined && requestedCategory.trim() !== "") {
    const category = requestedCategory.trim().toLowerCase();
    const weight = weights[category];
    return {
      category,
      weight: weight ?? config.riskCategories.unknownWeight,
      known: weight !== undefined,
    };
  }

  for (const entry of config.riskCategories.inference) {
    for (const pattern of entry.patterns) {
      if (pattern !== "" && normalizedType.includes(pattern.toLowerCase())) {
        return {
          category: entry.category,
          weight: weights[entry.category] ?? config.riskCategories.unknownWeight,
          known: true,
        };
      }
    }
  }

  return { category: UNKNOWN_CATEGORY, weight: config.riskCategories.unknownWeight, known: false };
}

/** The posture a resolved category starts from (architecture §5, as config data). */
function postureFor(
  config: ResolvedConfig,
  category: string,
  known: boolean,
): ActionPosture {
  if (!known) return config.riskCategories.unknownPosture;
  return config.riskCategories.postures[category] ?? config.riskCategories.unknownPosture;
}

/**
 * Deterministic keyword alignment (FR-5.2): the action's **type** shares at
 * least one meaningful vocabulary token with the user's task.
 *
 * The type is the integrator's machine token; the label is deliberately
 * **excluded** — it is free text that untrusted page content can influence, so
 * aligning on it would let a page authorise its own risky action.
 */
function isTaskAligned(request: CheckActionRequest, config: ResolvedConfig): boolean {
  const stopwords = new Set(config.detectorLexicon.taskStopwords);
  const taskTokens = new Set(meaningfulTokens(request.userTask, stopwords));
  if (taskTokens.size === 0) return false;
  const actionTokens = meaningfulTokens(
    request.proposedAction.type.replaceAll("_", " "),
    stopwords,
  );
  return actionTokens.some((token) => taskTokens.has(token));
}

/**
 * Decide whether the proposed action may execute (architecture §5.1).
 *
 * Deterministic for identical input (NFR-1): keyword sets and ordered pattern
 * lists only — no clock, randomness, or model call.
 */
export function evaluateAction(args: EvaluateActionArgs): ActionGateOutcome {
  const { request, scan, config } = args;
  const actionType = request.proposedAction.type;
  const task = request.userTask;
  const { category, weight, known } = resolveCategory(
    actionType,
    request.proposedAction.riskCategory,
    config,
  );
  const aligned = isTaskAligned(request, config);

  // Step 1 — a finding-triggered action is blocked regardless of category or
  // alignment, but only when the referenced id actually matches this scan
  // (architecture §5 note 4, FR-5.5).
  const referenced = request.proposedAction.triggeredByFindingIds ?? [];
  if (scan !== undefined && referenced.length > 0) {
    const scanFindingIds = new Set(scan.findings.map((finding) => finding.id));
    const matched = referenced.filter((id) => scanFindingIds.has(id));
    if (matched.length > 0) {
      return {
        decision: "block",
        riskScore: weight,
        reason:
          `Action "${actionType}" is blocked because it was triggered by ${matched.join(", ")} ` +
          `on this page, and actions prompted by page content conflict with the task "${task}".`,
      };
    }
  }

  // Step 2 — a risky action (any non-allow posture) without a scan is never
  // silently allowed (FR-5.9): the posture decides, not a weight literal.
  if (scan === undefined && postureFor(config, category, known) !== "allow") {
    if (aligned) {
      return {
        decision: "confirm",
        riskScore: weight,
        reason:
          `The task "${task}" appears to authorise "${actionType}", but no prior scan was ` +
          `provided, so user confirmation is required before it executes.`,
      };
    }
    return {
      decision: "block",
      riskScore: weight,
      reason:
        `No prior scan was provided for action "${actionType}" (${category}), and the task ` +
        `"${task}" does not authorise it; without a scan the action is blocked.`,
    };
  }

  // Step 3 — a risky action on a page the scanner already blocked.
  if (
    scan !== undefined &&
    scan.decision === "block" &&
    postureFor(config, category, known) !== "allow"
  ) {
    return {
      decision: "block",
      riskScore: weight,
      reason:
        `The scan of this page ended in "block", so the risky action "${actionType}" ` +
        `(${category}) is blocked; the task "${task}" does not make a flagged page safe.`,
    };
  }

  // Step 5 — apply the category's configured posture, lowered one step when the
  // action is explicitly part of the task (architecture §5 note 3). The postures
  // are data in `src/config/defaults.ts` — never inline in the gate (FR-3.10).
  switch (postureFor(config, category, known)) {
    case "always_block":
      return {
        decision: "block",
        riskScore: weight,
        reason:
          `Action "${actionType}" is destructive, and destructive actions are always blocked; ` +
          `the task "${task}" does not change that.`,
      };
    case "block":
      return aligned
        ? {
            // Note 3 lowers the posture one step for an explicitly task-aligned action.
            decision: "confirm",
            riskScore: weight,
            reason:
              `Action "${actionType}" (${category}) is part of the task "${task}", but its ` +
              `risk category keeps it behind user confirmation.`,
          }
        : {
            decision: "block",
            riskScore: weight,
            reason:
              `Action "${actionType}" (${category}) is high-risk and unrelated to the task ` +
              `"${task}", so it is blocked.`,
          };
    case "confirm":
      return aligned
        ? {
            decision: "allow",
            riskScore: weight,
            reason:
              `Action "${actionType}" (${category}) is clearly part of the task "${task}", so it is allowed.`,
          }
        : {
            decision: "confirm",
            riskScore: weight,
            reason:
              `Action "${actionType}" (${category}) is sensitive and not clearly part of the task ` +
              `"${task}"; user confirmation is required.`,
          };
    default:
      return {
        decision: "allow",
        riskScore: weight,
        reason: aligned
          ? `Action "${actionType}" (${category}) directly serves the task "${task}", so it is allowed.`
          : `Action "${actionType}" (${category}) is low-risk for the task "${task}", so it is allowed.`,
      };
  }
}
