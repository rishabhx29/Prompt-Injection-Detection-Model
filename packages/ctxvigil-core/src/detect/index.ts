/**
 * Stage 3 — deterministic detectors (FR-3.1–FR-3.12; architecture §6.3).
 *
 * This is the complete v1 detector set: one detector per contract `SignalName`.
 * Detectors are intentionally downstream of validation/normalisation. They never
 * change their inputs; they return explainable hits that ticket 04 scores.
 */

import type { SignalName } from "@ctxvigil/shared-types";
import type { ResolvedConfig } from "../config/types.ts";
import { meaningfulTokens } from "../text/tokens.ts";
import type { TextSegment } from "../normalise/index.ts";

/* -------------------------------------------------------------------------- */
/* Detection context                                                          */
/* -------------------------------------------------------------------------- */

/** Input to every detector. */
export interface DetectionContext {
  /** Normalised segments in deterministic `order`; detectors must not mutate them. */
  segments: readonly TextSegment[];
  /** Validated user goal, used by task-conflict detection. */
  userTask: string;
  /** Fully resolved detector data, thresholds, and weights. */
  config: ResolvedConfig;
}

/** One detector hit before scoring merges hits on the same segment. */
export interface DetectorHit {
  /** Contract detector identifier. */
  signal: SignalName;
  /** Zero-based index into `DetectionContext.segments`. */
  segmentIndex: number;
  /** Exact matched substring, generic class phrase, or task word used as evidence. */
  evidence: string;
  /** Relative seriousness within the v1 detector set. */
  severity: "low" | "medium" | "high";
  /** Integer contribution toward `riskScore`; defaults may be overridden by config. */
  scoreContribution: number;
  /** Plain-language explanation naming both the matched wording and the segment source. */
  reason: string;
}

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                             */
/* -------------------------------------------------------------------------- */

const ACTION_WORD_PATTERN = /[a-z][a-z0-9]*(?:_[a-z0-9]+)+/gu;

/**
 * Word tables used by the relation-based detectors, read from config.
 *
 * Every table lives in `src/config/defaults.ts` — no phrase list or category
 * table is written inline in a detector (FR-3.10, architecture §8).
 */
interface LexiconSets {
  stopwords: ReadonlySet<string>;
  sensitiveNouns: ReadonlySet<string>;
  transferVerbs: ReadonlySet<string>;
  highRiskNouns: ReadonlySet<string>;
  operationVerbs: ReadonlySet<string>;
}

function lexiconSets(config: ResolvedConfig): LexiconSets {
  return {
    stopwords: new Set(config.detectorLexicon.taskStopwords),
    sensitiveNouns: new Set(config.detectorLexicon.sensitiveObjectNouns),
    transferVerbs: new Set(config.detectorLexicon.transferVerbs),
    highRiskNouns: new Set(config.detectorLexicon.highRiskOperationNouns),
    operationVerbs: new Set(config.detectorLexicon.operationVerbs),
  };
}

function findPhrase(text: string, phrases: readonly string[]): string | undefined {
  const normalizedText = text.toLowerCase();
  for (const phrase of phrases) {
    const normalizedPhrase = phrase.toLowerCase();
    if (normalizedPhrase !== "" && normalizedText.includes(normalizedPhrase)) return phrase;
  }
  return undefined;
}

function textWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((word) => word.length > 0);
}

function configTokens(patterns: readonly string[]): Set<string> {
  const tokens = new Set<string>();
  for (const pattern of patterns) {
    const normalized = pattern.toLowerCase();
    for (const word of normalized.split(/[^a-z0-9]+/u)) {
      if (word.length > 2 && word !== "the") tokens.add(word);
    }
  }
  return tokens;
}

function describesSource(segment: TextSegment): string {
  return segment.selector === undefined
    ? `${segment.view} content marked as ${segment.sourceKind}`
    : `${segment.view} content marked as ${segment.sourceKind} at ${segment.selector}`;
}

/* -------------------------------------------------------------------------- */
/* Independent detectors                                                      */
/* -------------------------------------------------------------------------- */

function detectInstructionOverride(context: DetectionContext): DetectorHit[] {
  const phrases = context.config.phraseLists.instructionOverride;
  const weight = context.config.weights.instructionOverride;
  const hits: DetectorHit[] = [];

  context.segments.forEach((segment, segmentIndex) => {
    const phrase = findPhrase(segment.text, phrases);
    if (phrase === undefined) return;
    hits.push({
      signal: "instruction_override",
      segmentIndex,
      evidence: phrase,
      severity: "high",
      scoreContribution: weight,
      reason:
        `Text aimed at overriding the agent ("${phrase}") was found in ` +
        `${describesSource(segment)}.`,
    });
  });

  return hits;
}

function detectRoleImpersonation(context: DetectionContext): DetectorHit[] {
  const phrases = context.config.phraseLists.roleImpersonation;
  const weight = context.config.weights.roleImpersonation;
  const hits: DetectorHit[] = [];

  context.segments.forEach((segment, segmentIndex) => {
    const phrase = findPhrase(segment.text, phrases);
    if (phrase === undefined) return;
    hits.push({
      signal: "role_impersonation",
      segmentIndex,
      evidence: phrase,
      severity: "high",
      scoreContribution: weight,
      reason:
        `Text claiming elevated authority ("${phrase}") was found in ` +
        `${describesSource(segment)}.`,
    });
  });

  return hits;
}

function detectDataExfiltration(context: DetectionContext): DetectorHit[] {
  const phrases = context.config.phraseLists.dataExfiltration;
  const weight = context.config.weights.dataExfiltration;
  const sets = lexiconSets(context.config);
  const hits: DetectorHit[] = [];

  context.segments.forEach((segment, segmentIndex) => {
    const phrase = findPhrase(segment.text, phrases);
    if (phrase !== undefined) {
      hits.push({
        signal: "data_exfiltration",
        segmentIndex,
        evidence: phrase,
        severity: "high",
        scoreContribution: weight,
        reason:
          `Text requesting private data be revealed or moved ("${phrase}") was found in ` +
          `${describesSource(segment)}.`,
      });
      return;
    }

    // Generic verb + sensitive-object relation. The configured phrase list is substring based;
    // this catches the same relation for wording variants without naming fixtures (NFR-11).
    const words = textWords(segment.text);
    const transfer = words.find((word) => sets.transferVerbs.has(word));
    const target = words.find((word) => sets.sensitiveNouns.has(word));
    if (transfer === undefined || target === undefined) return;
    hits.push({
      signal: "data_exfiltration",
      segmentIndex,
      evidence: `${transfer} ${target}`,
      severity: "high",
      scoreContribution: weight,
      reason:
        `Text asks the agent to move sensitive material ("${transfer}" with "${target}") in ` +
        `${describesSource(segment)}.`,
    });
  });

  return hits;
}

/* -------------------------------------------------------------------------- */
/* Source, interaction, and visibility detectors                              */
/* -------------------------------------------------------------------------- */

function detectHiddenContent(
  context: DetectionContext,
  independentHits: ReadonlySet<number>,
): DetectorHit[] {
  const weight = context.config.weights.hiddenContent;
  const hits: DetectorHit[] = [];

  context.segments.forEach((segment, segmentIndex) => {
    if (!independentHits.has(segmentIndex)) return;
    if (segment.view === "visible_text") return;
    if (!segment.channels.some((channel) => channel !== "rendered")) return;
    hits.push({
      signal: "hidden_content",
      segmentIndex,
      evidence: segment.view,
      severity: "medium",
      scoreContribution: weight,
      reason:
        `Suspicious wording also appears where a sighted reader cannot see it: ${segment.view} ` +
        `content marked as ${segment.sourceKind}.`,
    });
  });

  return hits;
}

function isConcealed(segment: TextSegment): boolean {
  return segment.view === "hidden_dom" || segment.view === "accessibility_tree";
}

function detectRiskyAction(
  context: DetectionContext,
  independentHits: ReadonlySet<number>,
): DetectorHit[] {
  const riskyTokens = configTokens(context.config.actionCategories.riskyActions);
  const weight = context.config.weights.riskyAction;
  const sets = lexiconSets(context.config);
  const hits: DetectorHit[] = [];

  context.segments.forEach((segment, segmentIndex) => {
    if (!independentHits.has(segmentIndex) || !isConcealed(segment)) return;
    const words = new Set(textWords(segment.text));
    const matches = [...riskyTokens].filter(
      (token) => words.has(token) || words.has(`${token}s`),
    );
    if (matches.length === 0) return;

    // Whole-token overlap can be coincidental, so this detector asks for stronger evidence:
    // two independent configured operation tokens, or one decisive high-risk token.
    const operationMatches = matches.filter((token) => sets.operationVerbs.has(token));
    const decisiveMatches = matches.filter((token) => sets.highRiskNouns.has(token));
    const strongOperationPair =
      operationMatches.length >= 1 &&
      matches.some((token) => sets.highRiskNouns.has(token));
    if (operationMatches.length < 2 && !strongOperationPair && decisiveMatches.length < 2) return;

    const evidence = [...matches].sort().join(", ");
    hits.push({
      signal: "risky_action",
      segmentIndex,
      evidence,
      severity: "high",
      scoreContribution: weight,
      reason:
        `Concealed text requests a high-risk operation matching configured categories (${evidence}). ` +
        `Requested operation targets ${segment.view} content marked as ${segment.sourceKind}.`,
    });
  });

  return hits;
}

/* -------------------------------------------------------------------------- */
/* Relevance and cross-view detectors                                        */
/* -------------------------------------------------------------------------- */

/** Meaningful content words after removing the configured stopwords. */
function detectTaskConflict(
  context: DetectionContext,
  independentHits: ReadonlySet<number>,
): DetectorHit[] {
  const weight = context.config.weights.taskConflict;
  const sets = lexiconSets(context.config);
  const hits: DetectorHit[] = [];
  const taskTokenSet = new Set(meaningfulTokens(context.userTask, sets.stopwords));
  // Redirect wording comes from the configured override list (FR-3.10) — a
  // detector never carries its own phrase table.
  const dismissalPhrases = context.config.phraseLists.instructionOverride;

  context.segments.forEach((segment, segmentIndex) => {
    if (!independentHits.has(segmentIndex)) return;
    const haystack = segment.text.toLowerCase();
    const dismissal = dismissalPhrases.find(
      (phrase) => phrase.trim() !== "" && haystack.includes(phrase.toLowerCase()),
    );
    if (dismissal !== undefined) {
      hits.push({
        signal: "task_conflict",
        segmentIndex,
        evidence: dismissal,
        severity: "medium",
        scoreContribution: weight,
        reason:
          `The text explicitly redirects the agent away from the user task ("${dismissal}"), ` +
          `which asks: "${context.userTask}".`,
      });
      return;
    }

    // Otherwise use low token overlap with the task vocabulary as evidence of conflict.
    // `task_conflict` is only meaningful for already-suspicious segments, and an aligned
    // task vocabulary suppresses it (FR-3.11).
    const words = meaningfulTokens(segment.text, sets.stopwords);
    if (words.length === 0 || taskTokenSet.size === 0) return;
    const overlap = words.filter((word) => taskTokenSet.has(word)).length;
    if (overlap / words.length >= 0.3) return;

    const evidence = words.find((word) => !taskTokenSet.has(word)) ?? words[0] ?? segment.text;
    hits.push({
      signal: "task_conflict",
      segmentIndex,
      evidence,
      severity: "medium",
      scoreContribution: weight,
      reason:
        `The suspicious wording shares little vocabulary with the user task ("${evidence}" ` +
        `is not part of a task asking: "${context.userTask}").`,
    });
  });

  return hits;
}

function detectMultiViewRepetition(
  context: DetectionContext,
  independentHits: ReadonlySet<number>,
): DetectorHit[] {
  const weight = context.config.weights.multiView;
  const hits: DetectorHit[] = [];

  context.segments.forEach((segment, segmentIndex) => {
    if (!independentHits.has(segmentIndex)) return;
    const distinctChannels = new Set(segment.channels);
    // `visible_text` and `dom` are the same observation channel, so only a
    // genuinely separate channel counts as repetition.
    if (distinctChannels.size < 2) return;
    if (segment.view === "visible_text" && !isConcealed(segment)) {
      const concealed = segment.channels.some((channel) => channel !== "rendered");
      if (!concealed) return;
    }
    hits.push({
      signal: "multi_view_repetition",
      segmentIndex,
      evidence: segment.views.join("+"),
      severity: "low",
      scoreContribution: weight,
      reason:
        `The same suspicious wording appears across independent observation channels ` +
        `(${segment.views.join(", ")}), which makes accidental duplication less likely.`,
    });
  });

  return hits;
}

/* -------------------------------------------------------------------------- */
/* Orchestration                                                              */
/* -------------------------------------------------------------------------- */

const SEVERITY_ORDER = { low: 0, medium: 1, high: 2 } as const;

function independentHitIndexes(hits: readonly DetectorHit[]): Set<number> {
  const independent = new Set<number>();
  for (const hit of hits) independent.add(hit.segmentIndex);
  return independent;
}

/**
 * Run all seven v1 detectors over normalised segments.
 *
 * Order is fixed and output order follows segment order (architecture §6.3,
 * FR-3.12/NFR-1): independent phrase detectors first, then detectors that only
 * amplify already-suspicious segments.
 */
export function detectPage(context: DetectionContext): DetectorHit[] {
  const independent: DetectorHit[] = [
    ...detectInstructionOverride(context),
    ...detectRoleImpersonation(context),
    ...detectDataExfiltration(context),
  ];
  const independentIndexes = independentHitIndexes(independent);
  const dependent: DetectorHit[] = [
    ...detectHiddenContent(context, independentIndexes),
    ...detectRiskyAction(context, independentIndexes),
    ...detectTaskConflict(context, independentIndexes),
    ...detectMultiViewRepetition(context, independentIndexes),
  ];
  return [...independent, ...dependent].sort((a, b) => {
    if (a.segmentIndex !== b.segmentIndex) return a.segmentIndex - b.segmentIndex;
    return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
  });
}
