/**
 * Stage 4 — scoring (FR-4.1–FR-4.3, FR-4.9; architecture §6.4).
 *
 * ```text
 * contribution(segment) = max(0, Σ hit contributions + damping(segment))
 * score                 = clamp(Σ contributions, 0, 100)   // integer
 * band                  = bandFor(score, config)            // riskLevel + decision
 * ```
 *
 * **Damping rules (FR-4.3).** The two negative weights exist so legitimate
 * content is not scored like an attack, and both are applied narrowly:
 *
 * - `benignTaskRelevance` (−10) applies per **flagged** segment whose text shares
 *   meaningful vocabulary with the user's task — a task-aligned instruction is
 *   less likely to be a conflict.
 * - `benignStatic` (−5) applies per **unflagged** visible segment — the
 *   documented meaning is "non-instructional policy text". It is a bounded credit
 *   for ordinary surrounding content, never a discount on a flagged attack:
 *   damping an attack's own weight eats the safety margin (it once put
 *   `visible-injection` exactly on the `high` floor), and accumulating credit from
 *   unrelated paragraphs would let page size launder an attack. Total credit is
 *   therefore capped at `|benignTaskRelevance|`.
 *
 * Weights and bands are **development defaults, not validated research
 * thresholds** (FR-4.9); they are tunable through `createCtxVigil(config)`
 * (FR-1.7) and must not be presented as validated.
 */

import type { Decision, Finding, RiskLevel } from "@ctxvigil/shared-types";
import type { ResolvedConfig } from "../config/types.ts";
import type { DetectorHit } from "../detect/index.ts";
import { internalError } from "../errors.ts";
import type { TextSegment } from "../normalise/index.ts";
import { meaningfulTokens } from "../text/tokens.ts";

const SEVERITY_RANK: Record<DetectorHit["severity"], number> = { low: 0, medium: 1, high: 2 };

/** Everything stage 4 produces. */
export interface ScoredScan {
  /** One finding per suspicious segment, contributions summing to the pre-clamp score. */
  findings: Finding[];
  /** Indexes of the flagged segments, so the content policy need not re-match text. */
  flaggedSegmentIndexes: number[];
  /** The clamped integer score, 0–100. */
  riskScore: number;
  /** Banded from `riskScore` (contract §5). */
  riskLevel: RiskLevel;
  /** Banded from `riskScore` (contract §6) — the single decision source. */
  decision: Decision;
}

/** Arguments for {@link scoreScan}. */
export interface ScoreScanArgs {
  segments: readonly TextSegment[];
  hits: readonly DetectorHit[];
  userTask: string;
  config: ResolvedConfig;
}

/**
 * The one band table (contract §5/§6) — the only place thresholds are compared.
 *
 * `riskLevel` and `decision` read the same edges, so they can never drift:
 * 0–29 `low`/`allow`, 30–59 `medium`/`sanitize`, 60–79 `high`/`confirm`,
 * 80–100 `critical`/`block`.
 */
export function bandFor(
  score: number,
  config: ResolvedConfig,
): { riskLevel: RiskLevel; decision: Decision } {
  const { low, medium, high } = config.thresholds;
  if (score <= low) return { riskLevel: "low", decision: "allow" };
  if (score <= medium) return { riskLevel: "medium", decision: "sanitize" };
  if (score <= high) return { riskLevel: "high", decision: "confirm" };
  return { riskLevel: "critical", decision: "block" };
}

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
 * Damping for one segment (FR-4.3).
 *
 * `flagged` segments may only be damped for task relevance — a task-aligned
 * instruction is plausibly legitimate. Unflagged visible segments earn the
 * benign-static credit. Both amounts come from config; nothing is inline.
 */
function segmentDamping(
  segment: TextSegment,
  flagged: boolean,
  taskTokens: ReadonlySet<string>,
  config: ResolvedConfig,
): number {
  if (flagged) {
    const words = meaningfulTokens(segment.text, new Set(config.detectorLexicon.taskStopwords));
    const sharesTaskVocabulary = words.some((word) => taskTokens.has(word));
    return sharesTaskVocabulary ? config.weights.benignTaskRelevance : 0;
  }
  return segment.view === "visible_text" ? config.weights.benignStatic : 0;
}

/**
 * Turn detector hits into contract findings and a clamped integer score.
 *
 * Deterministic for identical input (FR-3.12, NFR-1): segment order and detector
 * order are both stable, and no clock, randomness, or locale is consulted.
 */
export function scoreScan(args: ScoreScanArgs): ScoredScan {
  const { segments, hits, userTask, config } = args;
  const stopwords = new Set(config.detectorLexicon.taskStopwords);
  const taskTokens = new Set(meaningfulTokens(userTask, stopwords));
  const grouped = groupHitsBySegment(hits);

  const findings: Finding[] = [];
  const flaggedSegmentIndexes: number[] = [];
  let total = 0;
  // Bounded benign-static credit: surrounding content may soften the score by at
  // most the documented task-relevance weight, so page size cannot launder an attack.
  let staticCreditRemaining = Math.abs(config.weights.benignTaskRelevance);

  segments.forEach((segment, index) => {
    const segmentHits = grouped.get(index) ?? [];
    if (segmentHits.length === 0) {
      // Unflagged visible segments earn a bounded benign-static credit; the credit
      // is spent once, so a long benign page cannot keep discounting an attack.
      const damping = segmentDamping(segment, false, taskTokens, config);
      if (damping !== 0) {
        const credit = Math.min(staticCreditRemaining, Math.abs(damping));
        staticCreditRemaining -= credit;
        total -= credit;
      }
      return;
    }

    flaggedSegmentIndexes.push(index);
    const raw = segmentHits.reduce((sum, hit) => sum + hit.scoreContribution, 0);
    // Floor at zero so a finding never reports a negative contribution; the sum of
    // contributions therefore still reconstructs the pre-clamp score.
    const contribution = Math.max(0, raw + segmentDamping(segment, true, taskTokens, config));
    total += contribution;

    findings.push({
      id: `finding-${findings.length + 1}`,
      view: segment.view,
      sourceKind: segment.sourceKind,
      ...(segment.selector === undefined ? {} : { selector: segment.selector }),
      text: segment.text,
      // Detector order is stable, so the strongest signal is listed first.
      signals: [...new Set(segmentHits.map((hit) => hit.signal))],
      severity: highestSeverity(segmentHits),
      scoreContribution: contribution,
    });
  });

  for (const segmentIndex of grouped.keys()) {
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      // Fail loudly with a typed error, never silently (architecture §7).
      throw internalError(`Detector hit references missing segment ${segmentIndex}.`);
    }
  }

  const riskScore = Math.min(100, Math.max(0, Math.round(total)));
  const { riskLevel, decision } = bandFor(riskScore, config);
  return { findings, flaggedSegmentIndexes, riskScore, riskLevel, decision };
}
