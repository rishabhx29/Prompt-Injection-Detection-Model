import type { 
  IAgentSimulationService, 
  AgentTraceStep, 
  AgentSimulationOutcome 
} from './IAgentSimulationService';
import type { 
  ScanPageResponse, 
  CheckActionResponse, 
  ProposedAction 
} from '../../types/agentguard-contract';
import { getFixtureById } from '../../fixtures/catalog';

export class DeterministicAgentSimulator implements IAgentSimulationService {
  readonly isRealLlm = false;

  async runAgentTrace(
    userTask: string,
    scanResponse: ScanPageResponse,
    proposedAction: ProposedAction,
    gateVerdict: CheckActionResponse,
    fixtureId: string
  ): Promise<AgentSimulationOutcome> {
    const fixture = getFixtureById(fixtureId);
    const steps: AgentTraceStep[] = [];
    const baseTime = Date.now();

    // Determine scenario sandbox before/after specifications
    let initialSandboxState = 'Browser session active. Sandbox memory: pristine.';
    let attemptedStateMutation = `Invoke browser tool: ${proposedAction.type}()`;
    let mutationPrevented = !gateVerdict.allowed;

    if (fixtureId === 'safe-refund-page') {
      initialSandboxState = 'Active shopper session at /refund-policy. State: authenticated.';
      attemptedStateMutation = 'Read-only policy analysis & natural language summary synthesis.';
      mutationPrevented = false;
    } else if (fixtureId === 'visible-injection') {
      initialSandboxState = 'Client Storage: auth_session_token="jwt.sec.98a12b"';
      attemptedStateMutation = 'HTTP POST to http://attacker-c2.test/collect with bearer token';
      mutationPrevented = true;
    } else if (fixtureId === 'aria-injection') {
      initialSandboxState = 'User Account: email="alice@work.test", security_role="admin"';
      attemptedStateMutation = 'Mutate account email to "attacker@example.test"';
      mutationPrevented = true;
    } else if (fixtureId === 'task-deviation-settings') {
      initialSandboxState = 'User Profile: recovery_phone="+1-555-0199", profile_name="Alice"';
      attemptedStateMutation = 'Redirect & update recovery phone to "+1-999-0000"';
      mutationPrevented = true;
    } else if (fixtureId === 'benign-aria-negative') {
      initialSandboxState = 'Warranty registration form draft: verified session';
      attemptedStateMutation = 'POST /api/v1/warranty_registration (matching user task)';
      mutationPrevented = false;
    }

    // Step 1: Perception / Ingestion
    const contentReceived = scanResponse.safeContent.length > 0 
      ? scanResponse.safeContent.map(s => s.text).join(' ') 
      : '(No safe content approved)';

    steps.push({
      id: 'step-1-perception',
      stepNumber: 1,
      phase: 'perception',
      title: 'Context Ingestion & Sanitization',
      detail: `Agent context populated with approved safe segments (${scanResponse.safeContent.length} chunks). Blocked/quarantined attack spans were isolated from model prompt.`,
      status: 'success',
      timestamp: new Date(baseTime).toLocaleTimeString(),
      latencyMs: 34,
      payload: { 
        safeContentLength: scanResponse.safeContent.length, 
        contentSnippet: contentReceived.slice(0, 160) + '...' 
      },
      telemetry: {
        inputTokens: Math.max(120, Math.round(contentReceived.length / 4)),
        contextSizeChars: contentReceived.length,
        quarantinedSpansCount: scanResponse.findings.length,
        threatSignals: scanResponse.findings.flatMap(f => f.signals)
      }
    });

    // Step 2: Reasoning / Deliberation
    const isAttacked = scanResponse.decision === 'block' || scanResponse.riskScore >= 70;
    steps.push({
      id: 'step-2-deliberation',
      stepNumber: 2,
      phase: 'deliberation',
      title: 'Goal Deliberation & Policy Alignment',
      detail: isAttacked
        ? `Adversarial instruction detected attempting to divert agent toward "${proposedAction.label}". AgentGuard flags risk score (${scanResponse.riskScore}/100).`
        : `User goal "${userTask}" parsed. Synthesizing authorized response from approved context.`,
      status: isAttacked ? 'warning' : 'success',
      timestamp: new Date(baseTime + 120).toLocaleTimeString(),
      latencyMs: 120,
      telemetry: {
        riskScore: scanResponse.riskScore,
        gateDecision: scanResponse.decision,
        targetEntity: isAttacked ? 'Adversarial Shift Vector' : 'Authorized User Intent'
      }
    });

    // Step 3: Tool / Action Formulation
    steps.push({
      id: 'step-3-formulation',
      stepNumber: 3,
      phase: 'formulation',
      title: `Proposed Browser Action: [${proposedAction.type}]`,
      detail: `Agent formulated browser tool intent: "${proposedAction.label}". Risk category: ${proposedAction.riskCategory}. Submitting to AgentGuard action gate.`,
      status: 'active',
      timestamp: new Date(baseTime + 240).toLocaleTimeString(),
      latencyMs: 85,
      payload: proposedAction,
      telemetry: {
        toolParameters: { 
          actionType: proposedAction.type, 
          label: proposedAction.label, 
          riskCategory: proposedAction.riskCategory 
        },
        rawCodeSnippet: `agent.executeTool("${proposedAction.type}", {\n  label: "${proposedAction.label}",\n  riskCategory: "${proposedAction.riskCategory}"\n});`
      }
    });

    // Step 4: Action Gate Intercept
    steps.push({
      id: 'step-4-gating',
      stepNumber: 4,
      phase: 'gating',
      title: `AgentGuard Action Gate: [${gateVerdict.decision.toUpperCase()}]`,
      detail: gateVerdict.allowed
        ? `Verdict: PERMITTED. ${gateVerdict.reason}`
        : `Verdict: INTERCEPTED & BLOCKED. ${gateVerdict.reason}`,
      status: gateVerdict.allowed ? 'success' : (gateVerdict.confirmationRequired ? 'warning' : 'blocked'),
      timestamp: new Date(baseTime + 310).toLocaleTimeString(),
      latencyMs: 42,
      payload: gateVerdict,
      telemetry: {
        gateDecision: gateVerdict.decision,
        riskScore: gateVerdict.riskScore,
        threatSignals: gateVerdict.reason ? [gateVerdict.reason] : []
      }
    });

    // Step 5: Execution & Sandbox Outcome
    const sandboxState = gateVerdict.allowed
      ? (fixture.simulatedAgentResult.benignOutput || 'Action executed successfully in local sandbox.')
      : (fixture.simulatedAgentResult.sandboxStateMutation || 'BLOCKED: Zero state change occurred.');

    steps.push({
      id: 'step-5-execution',
      stepNumber: 5,
      phase: 'execution',
      title: gateVerdict.allowed ? 'Execution Permitted' : 'Containment Active (Zero Mutation)',
      detail: sandboxState,
      status: gateVerdict.allowed ? 'success' : (gateVerdict.confirmationRequired ? 'warning' : 'blocked'),
      timestamp: new Date(baseTime + 360).toLocaleTimeString(),
      latencyMs: 18,
      telemetry: {
        sandboxMutationBytes: gateVerdict.allowed ? 240 : 0,
        targetEntity: gateVerdict.allowed ? 'Local Browser Sandbox (State Intact)' : 'Containment Perimeter (Exploit Blocked)'
      }
    });

    return {
      steps,
      proposedAction,
      gateVerdict,
      initialSandboxState,
      attemptedStateMutation,
      finalSandboxState: sandboxState,
      mutationPrevented,
      executionSummary: gateVerdict.allowed 
        ? 'Agent executed user task safely with sanitized context.' 
        : (gateVerdict.confirmationRequired 
            ? 'Execution held pending human authorization.' 
            : 'AgentGuard prevented unauthorized exploit execution. Sandbox state intact.')
    };
  }
}

