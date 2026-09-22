import type { ExtractionMode, IExtractionService } from './IExtractionService';
import { LiveDomExtractor } from './LiveDomExtractor';

export * from './IExtractionService';
export * from './LiveDomExtractor';

const liveDomExtractor = new LiveDomExtractor();

export function getExtractor(mode: ExtractionMode): IExtractionService {
  if (mode === 'live-dom') {
    return liveDomExtractor;
  }
  // Default fallback returns live extractor
  return liveDomExtractor;
}
