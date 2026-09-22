import type { 
  ScanPageRequest, 
  ScanPageResponse, 
  CheckActionRequest, 
  CheckActionResponse
} from '../../types/agentguard-contract';

export interface HealthStatus {
  online: boolean;
  version?: string;
  latencyMs?: number;
  message?: string;
}

export interface IProtectionService {
  readonly modeName: 'mock' | 'live';
  
  checkHealth(): Promise<HealthStatus>;
  scanPage(request: ScanPageRequest): Promise<ScanPageResponse>;
  checkAction(request: CheckActionRequest): Promise<CheckActionResponse>;
}
