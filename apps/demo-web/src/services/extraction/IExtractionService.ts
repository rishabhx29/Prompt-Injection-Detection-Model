import type { PageRepresentation } from '../../types/agentguard-contract';

export type ExtractionMode = 'catalog' | 'live-dom';

export interface ExtractionMetadata {
  mode: ExtractionMode;
  extractedAt: string;
  durationMs: number;
  nodeCount: number;
  ariaElementCount: number;
}

export interface ExtractionResult {
  page: PageRepresentation;
  metadata: ExtractionMetadata;
}

export interface IExtractionService {
  readonly mode: ExtractionMode;
  extractFromContainer(
    container: HTMLElement | null,
    fallbackPage: PageRepresentation
  ): Promise<ExtractionResult>;
}
