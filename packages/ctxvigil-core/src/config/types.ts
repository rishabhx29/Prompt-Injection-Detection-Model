/**
 * Internal, fully-resolved configuration types.
 *
 * The public surface is {@link CtxVigilConfig} (partial, all sections optional).
 * Inside the pipeline every section is required, so no code path has to defend
 * against a missing value. Resolution happens once in `resolveConfig()`.
 */

import type {
  ActionCategoryConfig,
  PhraseListConfig,
  ThresholdConfig,
  WeightConfig,
} from "@ctxvigil/shared-types";

/** Risk-category weights, architecture §5. */
export interface RiskCategoryConfig {
  /** Category name → risk weight (0–100). */
  weights: Record<string, number>;
  /**
   * `proposedAction.type` pattern → risk category.
   * Used to infer a category when the caller omits `riskCategory`.
   */
  inference: Array<{ category: string; patterns: string[] }>;
  /** Weight applied when a category cannot be inferred. Never treated as safe (FR-5.9). */
  unknownWeight: number;
  /** Weight for an action that is task-aligned and read-only. */
  taskAlignedReadOnlyWeight: number;
}

/** Generic detector word tables, fully resolved (FR-3.10; defaults §5). */
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

/** The complete, resolved configuration used by every pipeline stage. */
export interface ResolvedConfig {
  thresholds: ThresholdConfig;
  weights: WeightConfig;
  phraseLists: PhraseListConfig;
  detectorLexicon: DetectorLexiconConfig;
  actionCategories: ActionCategoryConfig;
  riskCategories: RiskCategoryConfig;
}
