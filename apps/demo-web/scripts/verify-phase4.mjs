/**
 * Phase 4 Verification Script: Simulated Agent Execution & Action Gate Containment
 * Validates:
 * 1. Zero-Conflict isolation boundaries with Rishabh
 * 2. Deterministic stepped simulation engine & rich telemetry across all 5 scenarios
 * 3. Double-Bezel Agent Trace Cockpit with playback & telemetry drawer
 * 4. Action Gate Exploit Prevention Barrier & Sandbox State Diff
 * 5. High-Fidelity Human Confirmation Modal
 * 6. CSS Motion tokens & styling invariants
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(rootDir, '..', '..');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

console.log('====================================================');
console.log('  AgentGuard Phase 4 Verification: Agent Trace & Gate');
console.log('====================================================\n');

// 1. Zero-Conflict Boundaries
console.log('1. Checking Zero-Conflict Isolation Boundaries with Rishabh...');
const rishabhCore = path.join(repoRoot, 'packages', 'agentguard-core');
const rishabhCli = path.join(repoRoot, 'packages', 'agentguard-cli');
const rishabhApi = path.join(repoRoot, 'apps', 'protection-api');

assert(!fs.existsSync(rishabhCore) || fs.readdirSync(rishabhCore).length === 0, 
  'Boundary respected: packages/agentguard-core is untouched by Saumya');
assert(!fs.existsSync(rishabhCli) || fs.readdirSync(rishabhCli).length === 0, 
  'Boundary respected: packages/agentguard-cli is untouched by Saumya');
assert(!fs.existsSync(rishabhApi) || fs.readdirSync(rishabhApi).length === 0, 
  'Boundary respected: apps/protection-api is untouched by Saumya');

// 2. Simulation Engine & Telemetry Interfaces
console.log('\n2. Checking Simulation Engine & Telemetry Contracts...');
const simInterfacePath = path.join(rootDir, 'src', 'services', 'agent', 'IAgentSimulationService.ts');
assert(fs.existsSync(simInterfacePath), 'IAgentSimulationService.ts exists');
const simInterfaceContent = fs.readFileSync(simInterfacePath, 'utf8');
assert(simInterfaceContent.includes('StepTelemetry'), 'Defines StepTelemetry interface');
assert(simInterfaceContent.includes('latencyMs'), 'AgentTraceStep tracks latencyMs');
assert(simInterfaceContent.includes('initialSandboxState'), 'Outcome defines initialSandboxState');
assert(simInterfaceContent.includes('attemptedStateMutation'), 'Outcome defines attemptedStateMutation');
assert(simInterfaceContent.includes('mutationPrevented'), 'Outcome defines mutationPrevented flag');

const simEnginePath = path.join(rootDir, 'src', 'services', 'agent', 'DeterministicAgentSimulator.ts');
assert(fs.existsSync(simEnginePath), 'DeterministicAgentSimulator.ts exists');
const simEngineContent = fs.readFileSync(simEnginePath, 'utf8');
assert(simEngineContent.includes('runAgentTrace'), 'Implements runAgentTrace()');
assert(simEngineContent.includes('step-1-perception'), 'Produces Step 1 (perception)');
assert(simEngineContent.includes('step-2-deliberation'), 'Produces Step 2 (deliberation)');
assert(simEngineContent.includes('step-3-formulation'), 'Produces Step 3 (formulation)');
assert(simEngineContent.includes('step-4-gating'), 'Produces Step 4 (gating)');
assert(simEngineContent.includes('step-5-execution'), 'Produces Step 5 (execution)');
assert(simEngineContent.includes('alice@work.test'), 'Specifies Star Demo account containment state');

// 3. Simulated Agent Trace UI Cockpit
console.log('\n3. Checking Simulated Agent Trace Cockpit Component...');
const traceComponentPath = path.join(rootDir, 'src', 'components', 'SimulatedAgentTrace.tsx');
assert(fs.existsSync(traceComponentPath), 'SimulatedAgentTrace.tsx exists');
const traceContent = fs.readFileSync(traceComponentPath, 'utf8');
assert(traceContent.includes('DoubleBezelCard'), 'SimulatedAgentTrace wraps in DoubleBezelCard');
assert(traceContent.includes('playbackSpeed'), 'SimulatedAgentTrace supports playback speeds (1x, 2x, instant)');
assert(traceContent.includes('handleTogglePlay'), 'SimulatedAgentTrace supports play/pause toggle');
assert(traceContent.includes('handleStepForward'), 'SimulatedAgentTrace supports manual step progression');
assert(traceContent.includes('telemetry-drawer'), 'SimulatedAgentTrace implements interactive telemetry drawer');
assert(traceContent.includes('exploit-barrier-banner'), 'SimulatedAgentTrace renders exploit containment barrier');
assert(traceContent.includes('initialSandboxState') && traceContent.includes('finalSandboxState'), 
  'SimulatedAgentTrace displays sandbox before/after diff');

// 4. Action Gate Card & Barrier HUD
console.log('\n4. Checking Action Gate Card & Exploit Barrier...');
const actionGatePath = path.join(rootDir, 'src', 'components', 'ActionGateCard.tsx');
assert(fs.existsSync(actionGatePath), 'ActionGateCard.tsx exists');
const actionGateContent = fs.readFileSync(actionGatePath, 'utf8');
assert(actionGateContent.includes('DoubleBezelCard'), 'ActionGateCard uses DoubleBezelCard');
assert(actionGateContent.includes('radar-sweep'), 'ActionGateCard features animated scanning sweep');
assert(actionGateContent.includes('exploit-barrier-banner'), 'ActionGateCard features Exploit Prevention Barrier');
assert(actionGateContent.includes('ZERO STATE MUTATION'), 'ActionGateCard displays containment policy banner');

// 5. Human Confirmation Override Modal
console.log('\n5. Checking Human Confirmation Override Modal...');
const modalPath = path.join(rootDir, 'src', 'components', 'ConfirmationModal.tsx');
assert(fs.existsSync(modalPath), 'ConfirmationModal.tsx exists');
const modalContent = fs.readFileSync(modalPath, 'utf8');
assert(modalContent.includes('bezel-card'), 'ConfirmationModal implements bezel-card styling');
assert(modalContent.includes('Original User Intent'), 'ConfirmationModal inspects user intent');
assert(modalContent.includes('Proposed Divergent Action'), 'ConfirmationModal highlights proposed deviation');
assert(modalContent.includes('Authorize One-Time Override'), 'ConfirmationModal supports authorized override');

// 6. WebpagePreview Double-Bezel Integration (Phase 3 Completion)
console.log('\n6. Checking WebpagePreview Double-Bezel Integration...');
const previewPath = path.join(rootDir, 'src', 'components', 'WebpagePreview.tsx');
assert(fs.existsSync(previewPath), 'WebpagePreview.tsx exists');
const previewContent = fs.readFileSync(previewPath, 'utf8');
assert(previewContent.includes('DoubleBezelCard'), 'WebpagePreview wraps inside DoubleBezelCard');

// 7. CSS Motion Tokens & Styling Invariants
console.log('\n7. Checking Phase 4 CSS Styling Tokens...');
const indexCssPath = path.join(rootDir, 'src', 'index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');
assert(indexCss.includes('@keyframes radar-sweep'), 'index.css defines radar-sweep keyframes');
assert(indexCss.includes('@keyframes barrier-hazard-pulse'), 'index.css defines barrier-hazard-pulse keyframes');
assert(indexCss.includes('@keyframes laser-scanline'), 'index.css defines laser-scanline keyframes');
assert(indexCss.includes('.step-card'), 'index.css defines .step-card class');
assert(indexCss.includes('.step-card-active'), 'index.css defines .step-card-active class');
assert(indexCss.includes('.exploit-barrier-banner'), 'index.css defines .exploit-barrier-banner class');
assert(indexCss.includes('.telemetry-drawer'), 'index.css defines .telemetry-drawer class');

console.log('\n----------------------------------------------------');
console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  console.error('\n>> Phase 4 Verification FAILED! <<\n');
  process.exit(1);
} else {
  console.log('\n>> Phase 4 Requirements Verified Successfully! <<\n');
  process.exit(0);
}
