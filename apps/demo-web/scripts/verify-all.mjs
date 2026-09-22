/**
 * Master Verification Runner for Saumya's Workstream
 * Runs Phase 1, Phase 2, and Contract Parity test suites sequentially.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suites = [
  { name: 'Phase 1 Verification', script: 'verify-phase1.mjs' },
  { name: 'Phase 2 Verification', script: 'verify-phase2.mjs' },
  { name: 'Phase 3 Verification', script: 'verify-phase3.mjs' },
  { name: 'Phase 4 Verification', script: 'verify-phase4.mjs' },
  { name: 'Phase 5 Verification', script: 'verify-phase5.mjs' },
  { name: 'Phase 6 Verification', script: 'verify-phase6.mjs' },
  { name: 'Contract Parity & Integration', script: 'verify-integration-contract.mjs' }
];

console.log('================================================================');
console.log('       AgentGuard Master Verification Suite (Saumya Workstream)');
console.log('================================================================\n');

let totalPassedSuites = 0;

for (const suite of suites) {
  const scriptPath = path.join(__dirname, suite.script);
  console.log(`>>> Executing Suite: ${suite.name} (${suite.script})`);
  
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: process.env
  });

  if (result.status === 0) {
    totalPassedSuites++;
    console.log(`>>> [SUCCESS] ${suite.name} completed with 0 errors.\n`);
  } else {
    console.error(`>>> [FAILURE] ${suite.name} failed with exit code ${result.status}.\n`);
    process.exit(result.status || 1);
  }
}

console.log('================================================================');
console.log(`  ALL ${totalPassedSuites} VERIFICATION SUITES PASSED FLAWLESSLY!`);
console.log('  Zero Conflicts with Rishabh\'s workspace confirmed.');
console.log('================================================================\n');
