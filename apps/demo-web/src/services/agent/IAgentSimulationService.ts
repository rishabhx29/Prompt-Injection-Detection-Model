import type { 
  ScanPageResponse, 
  CheckActionResponse, 
  ProposedAction 
} from '../../types/agentguard-contract';

export type AgentStepPhase = 
  | 'perception'    // Ingesting content (safe vs raw)
  | 'deliberation'  // LLM internal reasoning / goal alignment
  | 'formulation'   // Constructing tool/action call
  | 'gating'        // AgentGuard intercept
  | 'execution';    // Sandbox state change or block

export interface StepTelemetry {
  inputTokens?: number;
  contextSizeChars?: number;
  targetEntity?: string;
  quarantinedSpansCount?: number;
  toolParameters?: Record<string, unknown>;
  riskScore?: number;
  gateDecision?: string;
  sandboxMutationBytes?: number;
  threatSignals?: string[];
  rawCodeSnippet?: string;
}

export interface AgentTraceStep {
  id: string;
  stepNumber: number;
  phase: AgentStepPhase;
  title: string;
  detail: string;
  status: 'pending' | 'active' | 'success' | 'blocked' | 'warning';
  timestamp: string;
  latencyMs: number;
  payload?: any;
  telemetry?: StepTelemetry;
}

export interface AgentSimulationOutcome {
  steps: AgentTraceStep[];
  proposedAction: ProposedAction;
  gateVerdict: CheckActionResponse;
  initialSandboxState: string;
  attemptedStateMutation: string;
  finalSandboxState: string;
  mutationPrevented: boolean;
  executionSummary: string;
}

export interface IAgentSimulationService {
  readonly isRealLlm: boolean;
  
  runAgentTrace(
    userTask: string,
    scanResponse: ScanPageResponse,
    proposedAction: ProposedAction,
    gateVerdict: CheckActionResponse,
    fixtureId: string
  ): Promise<AgentSimulationOutcome>;
}

