/**
 * The agent-demo episode runner.
 *
 * One episode = the loop the protection layer exists to guard:
 *
 * ```text
 * fetch page → read the four views → ctxvigil.scanPage → agent reads ONLY safeContent
 *            → agent proposes an action → ctxvigil.checkAction → execute or contain
 * ```
 *
 * **Every verdict comes from the `ctxvigil` SDK.** This module makes no detection,
 * scoring, or policy decisions — it narrates the SDK's answers so a reviewer can
 * watch the layer work (FR-6.5 parity, architecture §4.4).
 *
 * ## Honest labelling (NFR-8)
 *
 * The agent here is a **local scripted agent, not an LLM**: it has no model, makes
 * no network call beyond `localhost`, and needs no API key (S2 B3.7). Its proposed
 * action and user task are declared by the fixture page it fetched, which is what
 * makes the demo deterministic and reproducible offline. A real LLM/agent plugs in
 * at the same two seams — `scanPage` before it reads content, `checkAction` before
 * it acts — and that is the whole point of the exercise.
 */

import type {
  CheckActionResponse,
  CtxVigil,
  MultiViewAgreementResult,
  ScanPageResponse,
} from "ctxvigil";

import {
  extractPageViews,
  type ExtractionDiagnostics,
  type PageViews,
} from "./extract-views.ts";

/** Step status used by both the terminal renderer and the dashboard panel. */
export type AgentStepStatus = "ok" | "warn" | "blocked";

export interface AgentStep {
  id: string;
  title: string;
  detail: string;
  status: AgentStepStatus;
  /** Small machine-readable payload for the panel (never re-derived from text). */
  data?: Record<string, unknown>;
}

/** What the HTTP fetch actually did, for the narration and the audit trail. */
export interface FetchInfo {
  status: number;
  bytes: number;
  elapsedMs: number;
  /** `http` for a real fetch from the fixture host, `disk` for the offline fallback. */
  transport: "http" | "disk";
}

export interface AgentAssertion {
  /** Declared by the page (`ctxvigil:expected-decision`); absent when not declared. */
  expectedDecision?: string;
  expectedRiskLevel?: string;
  /** A more cautious claim by the dashboard's offline mock, if the page records one. */
  catalogClaim?: string;
  observedDecision: string;
  observedRiskLevel: string;
  /** `null` when the page declared nothing to assert. */
  matched: boolean | null;
  gateDecision: string | null;
}

export interface AgentRunResult {
  schemaVersion: 1;
  runId: string;
  startedAt: string;
  durationMs: number;
  url: string;
  scenarioId?: string;
  scenarioTitle?: string;
  userTask: string;
  systemPrompt: string;
  plan: { type: string; label: string; riskCategory: string; source: "page" | "cli" };
  fetch: FetchInfo;
  extraction: {
    diagnostics: ExtractionDiagnostics;
    views: PageViews;
    counts: { visible: number; dom: number; hidden: number; accessibility: number };
  };
  scan: ScanPageResponse;
  action: {
    request: {
      scanId: string;
      userTask: string;
      proposedAction: {
        type: string;
        label: string;
        riskCategory: string;
        triggeredByFindingIds?: string[];
      };
    };
    response: CheckActionResponse;
  };
  agreement: MultiViewAgreementResult;
  /** What the agent was allowed to read, versus what the layer withheld. */
  agentContext: {
    approvedSegments: number;
    withheldSegments: number;
    approvedPreview: string[];
    withheld: string[];
    sanitized: string[];
  };
  assertion: AgentAssertion;
  steps: AgentStep[];
}

export interface RunAgentEpisodeOptions {
  /** The URL the page was fetched from; reproduced in the scan request verbatim. */
  url: string;
  /** The fetched document body. Passed in so tests can run fully offline. */
  html: string;
  /** What the fetch did (status/bytes/elapsed), for the narration. */
  fetchInfo: FetchInfo;
  /** A configured guard. The caller owns configuration (`createCtxVigil`). */
  guard: CtxVigil;
  /** Overrides the page's declared task (`ctxvigil:user-task` / CLI `--task`). */
  userTask?: string;
  /** Overrides the page's declared scan id (`ctxvigil:scan-id`). */
  scanId?: string;
  /**
   * Attribute the proposed action to the scan's findings (FR-5.5).
   *
   * Off by default: the gate must earn its verdict on its own merits, otherwise the
   * demo would only be proving that a hard-coded block blocks. Turn it on to show
   * what happens when an integrator reports that page content triggered the action.
   */
  attributeToFindings?: boolean;
  /** Clock seam so run ids stay deterministic in tests. */
  now?: () => Date;
}

/** A stable, filesystem-safe run id from the scenario and the clock. */
function runIdFor(scenarioId: string, at: Date): string {
  const stamp = at.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/u, "Z");
  return `${scenarioId}-${stamp}`;
}

function summarise(text: string, limit = 140): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

/**
 * Run one episode: read the page the way an agent would, ask the layer, act or stay
 * contained, and report the SDK's own verdicts.
 *
 * Deterministic for identical input (NFR-1): the only clock use is the run id and
 * timestamps, and no step consults the network, a model, or randomness.
 */
export async function runAgentEpisode(
  options: RunAgentEpisodeOptions,
): Promise<AgentRunResult> {
  const { url, html, fetchInfo, guard } = options;
  const startedAt = (options.now ?? (() => new Date()))();
  const steps: AgentStep[] = [];

  /* -- Step 1: the agent asks for the page -------------------------------- */
  steps.push({
    id: "navigate",
    title: "Navigate",
    detail: `Agent requested ${url} over HTTP and received ${fetchInfo.bytes} bytes (${fetchInfo.status}).`,
    status: fetchInfo.status >= 200 && fetchInfo.status < 300 ? "ok" : "blocked",
    data: {
      url,
      status: fetchInfo.status,
      bytes: fetchInfo.bytes,
      elapsedMs: fetchInfo.elapsedMs,
      transport: fetchInfo.transport,
    },
  });

  /* -- Step 2: perception — the four contract views ------------------------ */
  const { views, expectation, diagnostics } = extractPageViews(html, url);
  const counts = {
    visible: views.visibleText.length,
    dom: views.domText.length,
    hidden: views.hiddenText.length,
    accessibility: views.accessibilityText.length,
  };
  steps.push({
    id: "perceive",
    title: "Perceive content",
    detail:
      `Agent read 4 observation channels: ${counts.visible} visible, ${counts.dom} DOM, ` +
      `${counts.hidden} hidden-DOM, ${counts.accessibility} accessibility text. ` +
      `Nothing is judged yet — this is only what the page exposes.`,
    status: "ok",
    data: { counts, diagnostics },
  });

  /* -- Step 3: the protection layer scans before the agent reads ---------- */
  const userTask = options.userTask ?? expectation.userTask ?? "No task declared for this page.";
  const scanId = options.scanId ?? expectation.scanId ?? `${expectation.scenarioId ?? "episode"}-scan`;
  const scan = await guard.scanPage({ scanId, userTask, page: views });

  steps.push({
    id: "scan",
    title: "CtxVigil scan",
    detail:
      `riskScore ${scan.riskScore} (${scan.riskLevel}) → decision "${scan.decision}". ` +
      `${scan.findings.length} finding(s). ${scan.summary}`,
    status: scan.decision === "allow" ? "ok" : scan.decision === "block" ? "blocked" : "warn",
    data: {
      riskScore: scan.riskScore,
      riskLevel: scan.riskLevel,
      decision: scan.decision,
      findings: scan.findings.map((finding) => ({
        id: finding.id,
        view: finding.view,
        sourceKind: finding.sourceKind,
        selector: finding.selector,
        signals: finding.signals,
        severity: finding.severity,
        scoreContribution: finding.scoreContribution,
        text: finding.text,
      })),
    },
  });

  /* -- Step 4: containment — what the agent is actually allowed to read ---- */
  const withheld = scan.decision === "allow" ? [] : scan.blockedContent;
  steps.push({
    id: "quarantine",
    title: "Contain untrusted text",
    detail:
      withheld.length === 0
        ? `No span was withheld. The agent's context holds ${scan.safeContent.length} approved segment(s).`
        : `${withheld.length} segment(s) never reached the agent's context; the agent saw ` +
          `${scan.safeContent.length} approved segment(s) and ${Math.max(0, scan.sanitizedContent.length - scan.safeContent.length)} placeholder(s).`,
    status:
      withheld.length === 0 ? "ok" : scan.decision === "block" ? "blocked" : "warn",
    data: {
      approvedSegments: scan.safeContent.length,
      withheldSegments: withheld.length,
      withheld,
      sanitized: scan.sanitizedContent,
    },
  });


  /* -- Step 5: the action the agent proposes ------------------------------ */
  const plan = expectation.agentPlan;
  if (plan === undefined) {
    throw new Error(
      `Page ${url} declares no agent plan. Add a "ctxvigil:agent-plan" meta tag with type, label, and riskCategory.`,
    );
  }

  const proposedAction: {
    type: string;
    label: string;
    riskCategory: string;
    triggeredByFindingIds?: string[];
  } = { type: plan.type, label: plan.label, riskCategory: plan.riskCategory };
  if (options.attributeToFindings === true && scan.findings.length > 0) {
    proposedAction.triggeredByFindingIds = scan.findings.map((finding) => finding.id);
  }

  steps.push({
    id: "plan",
    title: `Propose action: ${plan.type}`,
    detail:
      `Scripted agent step "${plan.label}" (${plan.riskCategory}), declared by the page's ` +
      `ctxvigil:agent-plan tag. Submitted to the action gate before anything executes.`,
    status: "ok",
    data: {
      plan: proposedAction,
      declaredByPage: true,
      attributedToFindings: proposedAction.triggeredByFindingIds !== undefined,
    },
  });

  /* -- Step 6: the action gate ------------------------------------------- */
  const actionRequest = { scanId, userTask, proposedAction };
  const action = await guard.checkAction({ ...actionRequest, scan });

  steps.push({
    id: "gate",
    title: `Action gate: ${action.decision.toUpperCase()}`,
    detail:
      `${action.allowed ? "PERMITTED" : action.confirmationRequired ? "HELD for human confirmation" : "BLOCKED"}` +
      ` — ${action.reason}`,
    status: action.allowed ? "ok" : action.confirmationRequired ? "warn" : "blocked",
    data: {
      decision: action.decision,
      allowed: action.allowed,
      confirmationRequired: action.confirmationRequired,
      riskScore: action.riskScore,
      reason: action.reason,
    },
  });

  /* -- Step 7: cross-view agreement (DA-1 §4.1) -------------------------- */
  const strongest = [...scan.findings].sort(
    (a, b) => b.scoreContribution - a.scoreContribution,
  )[0];
  const observationContext =
    strongest?.text ?? [...views.visibleText, ...views.hiddenText].join(" ");
  const systemPrompt =
    expectation.systemPrompt ??
    "System: You are an autonomous web agent. Act only within the user's stated task.";
  const agreement = guard.evaluateMultiViewAgreement({
    userTask,
    systemPrompt,
    proposedAction: `${plan.type}(${plan.label})`,
    observationContext,
  });

  steps.push({
    id: "agreement",
    title: `Cross-view agreement (advisory): S13 = ${agreement.pairwiseAgreements.s13_task_action}`,
    detail:
      `${agreement.rationale} (task↔action ${agreement.pairwiseAgreements.s13_task_action}, ` +
      `action↔context ${agreement.pairwiseAgreements.s34_action_context}). ` +
      `Advisory only: the scan and the action gate remain the decisions of record.`,
    status:
      agreement.decision === "allow" ? "ok" : agreement.decision === "block" ? "blocked" : "warn",
    data: {
      decision: agreement.decision,
      riskScore: agreement.riskScore,
      uncertaintyScore: agreement.uncertaintyScore,
      pairwise: agreement.pairwiseAgreements,
      divergent: agreement.isTaskActionDivergent,
    },
  });

  /* -- Step 8: did the layer's verdict match what the page asserts? -------- */
  const expectedDecision = expectation.expectedDecision;
  const matched = expectedDecision === undefined ? null : expectedDecision === scan.decision;
  steps.push({
    id: "assert",
    title:
      matched === null
        ? "No declared verdict to assert"
        : matched
          ? "Verdict matches the page's declared expectation"
          : `Verdict MISMATCH: page declares "${expectedDecision}", engine says "${scan.decision}"`,
    detail:
      matched === null
        ? `Page declared no ctxvigil:expected-decision, so nothing is asserted.`
        : `Declared ${expectedDecision}/${expectation.expectedRiskLevel ?? "?"} · ` +
          `observed ${scan.decision}/${scan.riskLevel}` +
          (expectation.catalogClaim === undefined
            ? ""
            : ` · dashboard mock claims ${expectation.catalogClaim}`),
    status: matched === null ? "warn" : matched ? "ok" : "blocked",
    data: {
      expectedDecision,
      expectedRiskLevel: expectation.expectedRiskLevel,
      catalogClaim: expectation.catalogClaim,
      matched,
    },
  });

  const finishedAt = (options.now ?? (() => new Date()))();
  return {
    schemaVersion: 1,
    runId: runIdFor(expectation.scenarioId ?? "episode", startedAt),
    startedAt: startedAt.toISOString(),
    durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
    url,
    ...(expectation.scenarioId === undefined ? {} : { scenarioId: expectation.scenarioId }),
    ...(expectation.scenarioTitle === undefined
      ? {}
      : { scenarioTitle: expectation.scenarioTitle }),
    userTask,
    systemPrompt,
    plan: { ...plan, source: "page" as const },
    fetch: fetchInfo,
    extraction: { diagnostics, views, counts },
    scan,
    action: { request: actionRequest, response: action },
    agreement,
    agentContext: {
      approvedSegments: scan.safeContent.length,
      withheldSegments: withheld.length,
      approvedPreview: scan.safeContent.map((item) => summarise(item.text)),
      withheld,
      sanitized: scan.sanitizedContent,
    },
    assertion: {
      ...(expectedDecision === undefined ? {} : { expectedDecision }),
      ...(expectation.expectedRiskLevel === undefined
        ? {}
        : { expectedRiskLevel: expectation.expectedRiskLevel }),
      ...(expectation.catalogClaim === undefined
        ? {}
        : { catalogClaim: expectation.catalogClaim }),
      observedDecision: scan.decision,
      observedRiskLevel: scan.riskLevel,
      matched,
      gateDecision: action.decision,
    },
    steps,
  };
}

