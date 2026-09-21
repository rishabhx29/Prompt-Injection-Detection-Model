/**
 * Stage 5 — content policy (FR-4.4–FR-4.8, FR-4.10; architecture §6.5).
 *
 * Maps the score onto exactly one `Decision` and partitions content by audience:
 *
 * | Field | Audience | Contains |
 * |---|---|---|
 * | `safeContent` | the simulated agent | approved text, view-tagged |
 * | `sanitizedContent` | the agent's context after redaction | safe text + placeholders |
 * | `blockedContent` | dashboard / audit only | the suspicious text verbatim |
 *
 * Two rules that are easy to get wrong (architecture §6.5):
 *
 * 1. A placeholder must **not** recreate the unsafe instruction. It names what
 *    was removed and from where — it never quotes the attack.
 * 2. Provenance survives redaction: blocked spans keep `view`, `sourceKind`, and
 *    `selector` on the finding even though the text leaves the agent's view
 *    (FR-4.8).
 */

import type { Decision, Finding, SafeContentItem } from "@ctxvigil/shared-types";
import type { ResolvedConfig } from "../config/types.ts";
import type { TextSegment } from "../normalise/index.ts";

/** Everything stage 5 produces for a scan response. */
export interface PolicyOutcome {
  decision: Decision;
  /** Approved text for the agent, each item tagged with its view. */
  safeContent: SafeContentItem[];
  /** Agent context after redaction: safe text plus placeholders. */
  sanitizedContent: string[];
  /** Suspicious text, verbatim, for the dashboard and audit record only. */
  blockedContent: string[];
  /** One non-empty sentence naming the deciding signal and affected view. */
  summary: string;
}

/** Arguments for {@link applyPolicy}. */
export interface ApplyPolicyArgs {
  scanId: string;
  segments: readonly TextSegment[];
  findings: readonly Finding[];
  /** Indexes into `segments` of the flagged spans (from the scorer). */
  flaggedSegmentIndexes: readonly number[];
  /** The banded decision from the scorer — never recomputed here. */
  decision: Decision;
  config: ResolvedConfig;
}

/** The placeholder that replaces a blocked span in the agent's context. */
function placeholderFor(segment: TextSegment): string {
  return `[Blocked suspicious instruction from ${segment.sourceKind}]`;
}

/** The finding that drives the verdict: the largest contribution, first on ties. */
function decidingFinding(findings: readonly Finding[]): Finding | undefined {
  let strongest: Finding | undefined;
  for (const finding of findings) {
    if (strongest === undefined || finding.scoreContribution > strongest.scoreContribution) {
      strongest = finding;
    }
  }
  return strongest;
}

/**
 * A single sentence naming the deciding signal and the affected view.
 *
 * The strongest signal of the deciding finding is named, not every signal, so the
 * sentence stays readable and points at the evidence that actually set the band.
 */
function buildSummary(
  scanId: string,
  finding: Finding | undefined,
  segmentCount: number,
  decision: Decision,
): string {
  if (finding === undefined) {
    return (
      `Scan ${scanId} found no suspicious wording in ${segmentCount} content segment(s) ` +
      `across the supplied views, so the content is approved for the agent.`
    );
  }
  const signal = finding.signals[0] ?? "suspicious_wording";
  return (
    `Scan ${scanId} flagged ${finding.view} content from ${finding.sourceKind} for ${signal}, ` +
    `which is why the decision is ${decision}.`
  );
}

/**
 * Partition every segment by whether a finding flagged it.
 *
 * Flagged segment indexes come from the scorer, so two segments that happen to
 * share text are still partitioned correctly (no text re-matching).
 */
export function applyPolicy(args: ApplyPolicyArgs): PolicyOutcome {
  const { scanId, segments, findings, flaggedSegmentIndexes, decision } = args;
  const flagged = new Set(flaggedSegmentIndexes);

  const safeContent: SafeContentItem[] = [];
  const sanitizedContent: string[] = [];
  const blockedContent: string[] = [];

  segments.forEach((segment, index) => {
    if (!flagged.has(index)) {
      safeContent.push({ text: segment.text, view: segment.view });
      sanitizedContent.push(segment.text);
      return;
    }
    // Flagged span: withheld from `safeContent` unless the whole page is approved.
    blockedContent.push(segment.text);
    if (decision === "allow") {
      // Low-risk band: nothing is withheld from the agent (architecture §6.5).
      safeContent.push({ text: segment.text, view: segment.view });
      sanitizedContent.push(segment.text);
    } else {
      // The placeholder names what was removed and from where — never the attack.
      sanitizedContent.push(placeholderFor(segment));
    }
  });

  const deciding = decidingFinding(findings);
  return {
    decision,
    safeContent,
    sanitizedContent,
    blockedContent: decision === "allow" ? [] : blockedContent,
    summary: buildSummary(scanId, deciding, segments.length, decision),
  };
}
