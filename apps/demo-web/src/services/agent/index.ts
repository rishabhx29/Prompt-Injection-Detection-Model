import type { IAgentSimulationService } from './IAgentSimulationService';
import { DeterministicAgentSimulator } from './DeterministicAgentSimulator';
import { LlmAgentAdapterPlaceholder } from './LlmAgentAdapterPlaceholder';

export type * from './IAgentSimulationService';
export * from './DeterministicAgentSimulator';
export * from './LlmAgentAdapterPlaceholder';

let defaultAgentSimulator: IAgentSimulationService | null = null;

export function getAgentSimulationService(useLlmPlaceholder: boolean = false): IAgentSimulationService {
  if (useLlmPlaceholder) {
    return new LlmAgentAdapterPlaceholder();
  }
  if (!defaultAgentSimulator) {
    defaultAgentSimulator = new DeterministicAgentSimulator();
  }
  return defaultAgentSimulator;
}
