import type { FixtureScenario } from '../types';
import { safeRefundFixture } from './safeRefund';
import { visibleAttackFixture } from './visibleAttack';
import { ariaAttackFixture } from './ariaAttack';
import { taskDeviationFixture } from './taskDeviation';
import { benignAriaFixture } from './benignAria';
import { injecAgentAttackFixture } from './injecAgentAttack';

export const ALL_FIXTURES: FixtureScenario[] = [
  safeRefundFixture,
  injecAgentAttackFixture,
  ariaAttackFixture,
  visibleAttackFixture,
  taskDeviationFixture,
  benignAriaFixture
];

export function getFixtureById(id: string): FixtureScenario {
  const found = ALL_FIXTURES.find(f => f.id === id);
  if (!found) {
    return safeRefundFixture;
  }
  return found;
}
