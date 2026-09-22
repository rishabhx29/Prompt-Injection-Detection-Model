import type { IProtectionService, HealthStatus } from './IProtectionService';
import type { 
  ScanPageRequest, 
  ScanPageResponse, 
  CheckActionRequest, 
  CheckActionResponse 
} from '../../types/agentguard-contract';
import { ALL_FIXTURES } from '../../fixtures/catalog';

export class MockProtectionService implements IProtectionService {
  readonly modeName = 'mock' as const;

  async checkHealth(): Promise<HealthStatus> {
    // Simulated instant health response for standalone demo
    return {
      online: true,
      version: '0.1.0-mock-standalone',
      latencyMs: 12,
      message: 'Mock Protection Engine: Ready (Zero backend dependency)'
    };
  }

  async scanPage(request: ScanPageRequest): Promise<ScanPageResponse> {
    // Add brief 250ms realistic delay for animated UI feedback
    await new Promise(resolve => setTimeout(resolve, 260));

    // Match by scanId or URL
    const fixture = ALL_FIXTURES.find(f => 
      f.scanRequest.scanId === request.scanId ||
      f.scanRequest.page.url === request.page.url ||
      f.id === request.scanId
    );

    if (fixture) {
      return JSON.parse(JSON.stringify(fixture.mockScanResponse));
    }

    // Default safe fallback if custom task entered
    return {
      scanId: request.scanId,
      riskScore: 12,
      riskLevel: 'low',
      decision: 'allow',
      summary: 'No anomalous prompt injection signatures detected in supplied text representations.',
      findings: [],
      safeContent: request.page.visibleText.map(t => ({ text: t, view: 'visible_text' })),
      sanitizedContent: request.page.visibleText,
      blockedContent: []
    };
  }

  async checkAction(request: CheckActionRequest): Promise<CheckActionResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const fixture = ALL_FIXTURES.find(f => 
      f.scanRequest.scanId === request.scanId || 
      f.proposedAction.type === request.proposedAction.type
    );

    if (fixture) {
      return JSON.parse(JSON.stringify(fixture.mockActionResponse));
    }

    // Default fallback: allow low-risk actions
    const isRisky = request.proposedAction.riskCategory !== 'general';
    return {
      decision: isRisky ? 'block' : 'allow',
      riskScore: isRisky ? 85 : 15,
      reason: isRisky 
        ? 'Action involves elevated risk category without prior alignment.'
        : 'Action aligns with benign user task.',
      allowed: !isRisky,
      confirmationRequired: false
    };
  }
}
