import type { 
  ScanPageRequest, 
  ScanPageResponse, 
  CheckActionResponse, 
  ProposedAction 
} from '../types/agentguard-contract';

export interface FixtureScenario {
  id: string;
  title: string;
  tagline: string;
  category: 'Safe Baseline' | 'Direct Injection' | 'Indirect / Hidden Injection' | 'Policy Alignment' | 'Hard Negative';
  description: string;
  defaultUserTask: string;
  expectedRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  expectedDecision: 'allow' | 'sanitize' | 'confirm' | 'block';
  
  // Contract-compliant scan request payload
  scanRequest: ScanPageRequest;
  
  // Default mock response when running in offline/standalone mode
  mockScanResponse: ScanPageResponse;
  
  // Default proposed agent action
  proposedAction: ProposedAction;
  
  // Default mock action check response
  mockActionResponse: CheckActionResponse;

  // Local simulated sandbox state change after execution
  simulatedAgentResult: {
    benignOutput?: string;
    attemptedExploit?: string;
    sandboxStateMutation: string;
  };

  // DA-1 §4.1 Multi-View Neural Fusion & Uncertainty Metrics
  multiViewNeuralMetrics?: {
    debertaInjectionProb: number;
    uncertaintyScore: number;
    views: {
      userTask: string;
      systemPrompt: string;
      proposedAction: string;
      observationContext: string;
    };
    pairwiseCosineAgreements: {
      s12_task_system: number;
      s13_task_action: number;
      s14_task_context: number;
      s23_system_action: number;
      s24_system_context: number;
      s34_action_context: number;
    };
    agreementMatrix: number[][];
    actionGateDecision: 'ALLOW' | 'QUARANTINE' | 'BLOCK';
    gateRationale: string;
  };
}
