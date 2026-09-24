import type { IProtectionService, HealthStatus } from './IProtectionService';
import type { 
  ScanPageRequest, 
  ScanPageResponse, 
  CheckActionRequest, 
  CheckActionResponse 
} from '../../types/agentguard-contract';

export class ApiConnectionError extends Error {
  readonly endpoint: string;
  readonly latencyMs?: number;

  constructor(message: string, endpoint: string, latencyMs?: number) {
    super(message);
    this.name = 'ApiConnectionError';
    this.endpoint = endpoint;
    this.latencyMs = latencyMs;
  }
}

export class ApiValidationError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status = 400, details?: unknown) {
    super(message);
    this.name = 'ApiValidationError';
    this.status = status;
    this.details = details;
  }
}

export class ApiServerError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiServerError';
    this.status = status;
  }
}

export const DEFAULT_PROTECTION_API_URL = 'http://localhost:8787';
export const STORAGE_KEY_API_URL = 'agentguard_api_url';

export class HttpProtectionService implements IProtectionService {
  readonly modeName = 'live' as const;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl?: string, timeoutMs = 4000) {
    this.timeoutMs = timeoutMs;
    if (baseUrl) {
      this.baseUrl = baseUrl.replace(/\/+$/, '');
    } else {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_API_URL) : null;
      this.baseUrl = (stored || (import.meta as any).env?.VITE_PROTECTION_API_URL || DEFAULT_PROTECTION_API_URL).replace(/\/+$/, '');
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl.replace(/\/+$/, '');
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_API_URL, this.baseUrl);
    }
  }

  setTimeoutMs(ms: number): void {
    this.timeoutMs = ms;
  }

  async checkHealth(overrideUrl?: string): Promise<HealthStatus> {
    const targetUrl = (overrideUrl || this.baseUrl).replace(/\/+$/, '');
    const startTime = performance.now();

    try {
      const response = await fetch(`${targetUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs)
      });
      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          online: false,
          latencyMs,
          message: `Protection API returned HTTP ${response.status} (${response.statusText})`
        };
      }

      const data = await response.json().catch(() => ({}));
      return {
        online: true,
        version: data.version || '1.0.0',
        latencyMs,
        message: `Live AgentGuard SDK connected (${latencyMs}ms)`
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const isTimeout = err.name === 'TimeoutError' || (err.message && err.message.toLowerCase().includes('timeout'));
      const msg = isTimeout 
        ? `Protection API timed out after ${this.timeoutMs}ms at ${targetUrl}`
        : `Protection API unreachable at ${targetUrl} (${err.message || 'Connection refused'})`;

      return {
        online: false,
        latencyMs,
        message: msg
      };
    }
  }

  async scanPage(request: ScanPageRequest): Promise<ScanPageResponse> {
    // Pre-flight contract validation
    if (!request.scanId) {
      throw new ApiValidationError('Scan request must contain a non-empty scanId.');
    }
    if (!request.userTask || !request.userTask.trim()) {
      throw new ApiValidationError('Scan request must contain a non-empty userTask.');
    }
    if (!request.page || typeof request.page !== 'object') {
      throw new ApiValidationError('Scan request must contain a page representation object.');
    }

    const startTime = performance.now();
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/scan-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      throw new ApiConnectionError(
        `Failed to reach AgentGuard scan service at ${this.baseUrl}/scan-page: ${err.message || 'Network error'}`,
        `${this.baseUrl}/scan-page`,
        latencyMs
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      if (response.status === 400) {
        throw new ApiValidationError(`Protection API rejected scan payload: ${errorText}`, 400);
      }
      throw new ApiServerError(`Protection API scan failed (HTTP ${response.status}): ${errorText}`, response.status);
    }

    const json = await response.json();
    return json as ScanPageResponse;
  }

  async checkAction(request: CheckActionRequest): Promise<CheckActionResponse> {
    // Pre-flight contract validation
    if (!request.scanId) {
      throw new ApiValidationError('Action check request must contain a valid scanId.');
    }
    if (!request.proposedAction || !request.proposedAction.type) {
      throw new ApiValidationError('Action check request must contain proposedAction with valid type.');
    }

    const startTime = performance.now();
    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/check-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      throw new ApiConnectionError(
        `Failed to reach AgentGuard action gate at ${this.baseUrl}/check-action: ${err.message || 'Network error'}`,
        `${this.baseUrl}/check-action`,
        latencyMs
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      if (response.status === 400) {
        throw new ApiValidationError(`Action Gate rejected request: ${errorText}`, 400);
      }
      throw new ApiServerError(`Action Gate check failed (HTTP ${response.status}): ${errorText}`, response.status);
    }

    const json = await response.json();
    return json as CheckActionResponse;
  }
}

