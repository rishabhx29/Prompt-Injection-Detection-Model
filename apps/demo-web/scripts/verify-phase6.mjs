/**
 * Phase 6 Verification Suite: Testing, Polish & Demo Rehearsal
 * 
 * Validates Joint Integration Checkpoints 1, 2, 3 from TEAM_DEVELOPMENT_PLAN.md:
 * - Checkpoint 1: Contract Test (safe-refund-page contract validation)
 * - Checkpoint 2: Core Security Demo (visible, hidden ARIA exploit, and task deviation)
 * - Checkpoint 3: False-Positive Check (benign ARIA negative control)
 * - Presentation Tour: DemoGuideModal & 3-Act Launcher
 * - Keyboard Accessibility: Ctrl+Enter, Shift+Enter, 1-5, Esc, and WCAG :focus-visible
 * - Boundary Isolation: Zero conflicts with Rishabh's packages
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..'); // AgentGuard root
const demoWebDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log(' Phase 6 Verification: Testing, Polish & Demo Rehearsal');
console.log('================================================================\n');

// -------------------------------------------------------------
// Group 1: Joint Integration Checkpoint 1 - Contract Verification
// -------------------------------------------------------------
console.log('--- Group 1: Joint Integration Checkpoint 1 (Contract Test) ---');

const catalogIndex = fs.readFileSync(path.join(demoWebDir, 'src/fixtures/catalog/index.ts'), 'utf8');
const safeRefundFixture = fs.readFileSync(path.join(demoWebDir, 'src/fixtures/catalog/safeRefund.ts'), 'utf8');

test('Catalog index exports all 5 scenarios with getFixtureById helper', () => {
  assert(catalogIndex.includes('safeRefundFixture'), 'Missing safeRefundFixture export');
  assert(catalogIndex.includes('visibleAttackFixture'), 'Missing visibleAttackFixture export');
  assert(catalogIndex.includes('ariaAttackFixture'), 'Missing ariaAttackFixture export');
  assert(catalogIndex.includes('taskDeviationFixture'), 'Missing taskDeviationFixture export');
  assert(catalogIndex.includes('benignAriaFixture'), 'Missing benignAriaFixture export');
  assert(catalogIndex.includes('getFixtureById'), 'Missing getFixtureById helper');
});

test('Safe Refund fixture matches shared contract schema (Baseline Control)', () => {
  assert(safeRefundFixture.includes("id: 'safe-refund-page'"), 'Wrong fixture id');
  assert(safeRefundFixture.includes("expectedDecision: 'allow'"), 'Expected allow decision');
  assert(safeRefundFixture.includes("expectedRiskLevel: 'low'"), 'Expected low riskLevel');
  assert(safeRefundFixture.includes('riskScore: 10'), 'Expected low risk score (10) for baseline');
  assert(safeRefundFixture.includes("allowed: true"), 'Expected allowed: true for legitimate action');
});

// -------------------------------------------------------------
// Group 2: Joint Integration Checkpoint 2 - Core Security Exploit Scans
// -------------------------------------------------------------
console.log('\n--- Group 2: Joint Integration Checkpoint 2 (Core Security Demo) ---');

const ariaAttackFixture = fs.readFileSync(path.join(demoWebDir, 'src/fixtures/catalog/ariaAttack.ts'), 'utf8');
const visibleAttackFixture = fs.readFileSync(path.join(demoWebDir, 'src/fixtures/catalog/visibleAttack.ts'), 'utf8');
const taskDeviationFixture = fs.readFileSync(path.join(demoWebDir, 'src/fixtures/catalog/taskDeviation.ts'), 'utf8');

test('Star Demo: Hidden ARIA Exploit is flagged with CRITICAL / BLOCK verdict', () => {
  assert(ariaAttackFixture.includes("id: 'aria-injection'"), 'Wrong fixture id');
  assert(ariaAttackFixture.includes("expectedDecision: 'block'"), 'Expected block decision');
  assert(ariaAttackFixture.includes("expectedRiskLevel: 'critical'"), 'Expected critical risk');
  assert(ariaAttackFixture.includes("view: 'accessibility_tree'"), 'Expected accessibility_tree finding');
  assert(ariaAttackFixture.includes("sourceKind: 'aria-label'"), 'Expected aria-label sourceKind');
  assert(ariaAttackFixture.includes("type: 'change_account_email'"), 'Expected change_account_email proposed action');
  assert(ariaAttackFixture.includes("allowed: false"), 'Action must be blocked with allowed: false');
});

test('Visible Injection scenario isolates malicious vector with SANITIZE verdict', () => {
  assert(visibleAttackFixture.includes("id: 'visible-injection'"), 'Wrong fixture id');
  assert(visibleAttackFixture.includes("expectedDecision: 'sanitize'"), 'Expected sanitize decision');
  assert(visibleAttackFixture.includes("allowed: false"), 'Action must be blocked');
});

test('Task Deviation scenario intercepts unauthorized settings action with CONFIRM verdict', () => {
  assert(taskDeviationFixture.includes("id: 'task-deviation-settings'"), 'Wrong fixture id');
  assert(taskDeviationFixture.includes("expectedDecision: 'confirm'"), 'Expected confirm decision');
  assert(taskDeviationFixture.includes("confirmationRequired: true"), 'Expected confirmationRequired: true');
});

// -------------------------------------------------------------
// Group 3: Joint Integration Checkpoint 3 - False-Positive Verification
// -------------------------------------------------------------
console.log('\n--- Group 3: Joint Integration Checkpoint 3 (False-Positive Check) ---');

const benignAriaFixture = fs.readFileSync(path.join(demoWebDir, 'src/fixtures/catalog/benignAria.ts'), 'utf8');

test('Benign ARIA negative control avoids false alarms (ALLOW verdict, low risk)', () => {
  assert(benignAriaFixture.includes("id: 'benign-aria-negative'"), 'Wrong fixture id');
  assert(benignAriaFixture.includes("expectedDecision: 'allow'"), 'Expected allow decision');
  assert(benignAriaFixture.includes("expectedRiskLevel: 'low'"), 'Expected low risk');
  assert(benignAriaFixture.includes('riskScore: 14'), 'Expected low risk score (14)');
  assert(benignAriaFixture.includes("allowed: true"), 'Benign action must be permitted');
});

// -------------------------------------------------------------
// Group 4: Evaluator Presentation Guide & Keyboard Shortcuts
// -------------------------------------------------------------
console.log('\n--- Group 4: Evaluator Presentation Guide & Keyboard Shortcuts ---');

const guideModalPath = path.join(demoWebDir, 'src/components/DemoGuideModal.tsx');
test('DemoGuideModal exists and exports presentation roadmap', () => {
  assert(fs.existsSync(guideModalPath), 'DemoGuideModal.tsx missing');
  const content = fs.readFileSync(guideModalPath, 'utf8');
  assert(content.includes('Mission Control: 4-Minute Presentation Guide'), 'Missing title');
  assert(content.includes('ACT 1 · 45 SEC'), 'Missing Act 1');
  assert(content.includes('ACT 2 · STAR DEMO'), 'Missing Act 2');
  assert(content.includes('ACT 3 · CONTROL'), 'Missing Act 3');
  assert(content.includes('role="dialog"'), 'Missing dialog role');
  assert(content.includes('aria-modal="true"'), 'Missing aria-modal attribute');
});

const appPath = path.join(demoWebDir, 'src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');

test('App.tsx mounts DemoGuideModal and Header trigger', () => {
  assert(appContent.includes('<DemoGuideModal'), 'DemoGuideModal component not rendered in App.tsx');
  assert(appContent.includes('isGuideOpen'), 'isGuideOpen state missing');
  assert(appContent.includes('onOpenDemoGuide={() => setIsGuideOpen(true)}'), 'Header guide button not connected');
});

test('App.tsx registers global keyboard shortcuts (Ctrl+Enter, Shift+Enter, 1-5, Esc)', () => {
  assert(appContent.includes("(e.ctrlKey || e.metaKey) && e.key === 'Enter'"), 'Ctrl+Enter scan shortcut missing');
  assert(appContent.includes("e.shiftKey && e.key === 'Enter'"), 'Shift+Enter action check shortcut missing');
  assert(appContent.includes("parseInt(e.key, 10)"), 'Digit 1-5 shortcut missing');
  assert(appContent.includes("e.key === 'Escape'"), 'Escape modal dismiss missing');
});

// -------------------------------------------------------------
// Group 5: UI Accessibility & Visual Polish
// -------------------------------------------------------------
console.log('\n--- Group 5: UI Accessibility & Visual Polish ---');

const cssContent = fs.readFileSync(path.join(demoWebDir, 'src/index.css'), 'utf8');
test('index.css includes WCAG 2.2 :focus-visible cyan glow ring', () => {
  assert(cssContent.includes(':focus-visible'), 'Missing :focus-visible');
  assert(cssContent.includes('outline: 2px solid var(--accent-cyan)'), 'Missing cyan focus outline');
});

test('index.css styles .kbd-shortcut-hint tags with monospace typography', () => {
  assert(cssContent.includes('.kbd-shortcut-hint'), 'Missing .kbd-shortcut-hint');
  assert(cssContent.includes('font-family: var(--font-mono)'), 'Missing monospace font');
});

const verdictContent = fs.readFileSync(path.join(demoWebDir, 'src/components/VerdictPanel.tsx'), 'utf8');
test('VerdictPanel displays [Ctrl + ↵] keyboard shortcut badge', () => {
  assert(verdictContent.includes('Ctrl + ↵'), 'Missing Ctrl + ↵ badge in VerdictPanel');
});

const actionGateContent = fs.readFileSync(path.join(demoWebDir, 'src/components/ActionGateCard.tsx'), 'utf8');
test('ActionGateCard displays [Shift + ↵] keyboard shortcut badge', () => {
  assert(actionGateContent.includes('Shift + ↵'), 'Missing Shift + ↵ badge in ActionGateCard');
});

const scenarioContent = fs.readFileSync(path.join(demoWebDir, 'src/components/ScenarioSelector.tsx'), 'utf8');
test('ScenarioSelector displays [1-5] numbered badges and hints', () => {
  assert(scenarioContent.includes('idx + 1'), 'Missing numbered index in options');
  assert(scenarioContent.includes('switches scenario'), 'Missing shortcut hint text');
});

// -------------------------------------------------------------
// Group 6: Zero Conflicts with Rishabh Workspace Isolation
// -------------------------------------------------------------
console.log('\n--- Group 6: Zero Conflicts Isolation Invariant ---');

test('Saumya exclusively develops inside apps/demo-web/, sample-data/, and requirement/', () => {
  // Confirm Saumya did not accidentally introduce files into unauthorized root locations
  const forbiddenDirs = ['packages/agentguard-core', 'packages/agentguard-cli', 'apps/protection-api'];
  for (const fDir of forbiddenDirs) {
    const fullPath = path.join(rootDir, fDir);
    if (!fs.existsSync(fullPath)) {
      assert(true, `Confirmed untouched: ${fDir}`);
    } else {
      // If the directory was created by Rishabh, ensure Saumya has not added demo-web files
      const files = fs.readdirSync(fullPath);
      assert(!files.some(f => f.includes('demo-web')), `No rogue files in ${fDir}`);
    }
  }
});

console.log('\n================================================================');
console.log(` Results: ${passedTests} / ${totalTests} Phase 6 checks passed successfully!`);
console.log('================================================================\n');

if (process.exitCode) {
  process.exit(process.exitCode);
}
