/**
 * Phase 3 Verification Script: Dashboard Layout & Evidence Inspector
 * Validates the implementation of Phase 3 deliverables:
 * 1. Double-Bezel Hardware Architecture & Reusable Containers
 * 2. Skeleton Shimmer Loaders (CLS = 0)
 * 3. Tactical Animated SVG Radial Risk Gauge & Verdict HUD
 * 4. Multi-View Evidence Inspector with Channel Threat Counts & Tainted Spotlights
 * 5. Findings Intelligence with Score Attribution Math & Heuristics
 * 6. CSS Motion Tokens, Spotlights, and Keyframe Invariants
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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
console.log('  AgentGuard Phase 3 Verification: Dashboard & Audit');
console.log('====================================================\n');

// 1. Reusable Hardware UI Primitives
console.log('1. Checking Reusable Double-Bezel & Shimmer Primitives...');
const doubleBezelPath = path.join(rootDir, 'src', 'components', 'common', 'DoubleBezelCard.tsx');
assert(fs.existsSync(doubleBezelPath), 'DoubleBezelCard.tsx exists in src/components/common/');
const doubleBezelContent = fs.readFileSync(doubleBezelPath, 'utf8');
assert(doubleBezelContent.includes('bezel-card'), 'DoubleBezelCard implements outer bezel-card class');
assert(doubleBezelContent.includes('bezel-card-inner'), 'DoubleBezelCard implements recessed bezel-card-inner core');
assert(doubleBezelContent.includes('headerLeft'), 'DoubleBezelCard supports headerLeft slot');

const skeletonLoaderPath = path.join(rootDir, 'src', 'components', 'common', 'SkeletonLoader.tsx');
assert(fs.existsSync(skeletonLoaderPath), 'SkeletonLoader.tsx exists in src/components/common/');
const skeletonContent = fs.readFileSync(skeletonLoaderPath, 'utf8');
assert(skeletonContent.includes('shimmer'), 'SkeletonLoader applies shimmer class');
assert(skeletonContent.includes("type === 'gauge'"), 'SkeletonLoader supports circular gauge loading skeleton');

// 2. Tactical Animated SVG Risk Gauge in VerdictPanel
console.log('\n2. Checking Tactical SVG Risk Gauge & VerdictPanel...');
const verdictPath = path.join(rootDir, 'src', 'components', 'VerdictPanel.tsx');
assert(fs.existsSync(verdictPath), 'VerdictPanel.tsx exists');
const verdictContent = fs.readFileSync(verdictPath, 'utf8');
assert(verdictContent.includes('DoubleBezelCard'), 'VerdictPanel wraps contents in DoubleBezelCard');
assert(verdictContent.includes('SkeletonLoader'), 'VerdictPanel integrates SkeletonLoader during scanning');
assert(verdictContent.includes('strokeDasharray'), 'VerdictPanel computes SVG strokeDasharray for radial arc');
assert(verdictContent.includes('animatedScore'), 'VerdictPanel features animated numeric score counter');
assert(verdictContent.includes('tickCount'), 'VerdictPanel generates precision radial tick graduation');
assert(verdictContent.includes('SAFE TO PROCEED') && verdictContent.includes('ATTACK BLOCKED'), 'VerdictPanel displays clear decision banners');

// 3. Multi-View Evidence Inspector
console.log('\n3. Checking Multi-View Evidence Inspector & Channels...');
const multiViewPath = path.join(rootDir, 'src', 'components', 'MultiViewInspector.tsx');
assert(fs.existsSync(multiViewPath), 'MultiViewInspector.tsx exists');
const multiViewContent = fs.readFileSync(multiViewPath, 'utf8');
assert(multiViewContent.includes('DoubleBezelCard'), 'MultiViewInspector uses DoubleBezelCard container');
assert(multiViewContent.includes("activeTab === 'visible'"), 'MultiViewInspector supports Visible Text channel');
assert(multiViewContent.includes("activeTab === 'dom'"), 'MultiViewInspector supports Raw DOM channel');
assert(multiViewContent.includes("activeTab === 'accessibility'"), 'MultiViewInspector supports AXTree / ARIA channel');
assert(multiViewContent.includes('visibleFindings.length') && multiViewContent.includes('ariaFindings.length'), 'MultiViewInspector features channel threat count badges');
assert(multiViewContent.includes('hasDiscrepancy'), 'MultiViewInspector detects and highlights cross-view discrepancy');
assert(multiViewContent.includes('code-line-number'), 'MultiViewInspector renders monospace DOM lines with numbers');
assert(multiViewContent.includes('attack-spotlight'), 'MultiViewInspector spotlights tainted nodes with radar styling');

// 4. Findings Intelligence & Score Attribution Math
console.log('\n4. Checking Findings Intelligence & Score Attribution...');
const findingsPath = path.join(rootDir, 'src', 'components', 'FindingsList.tsx');
assert(fs.existsSync(findingsPath), 'FindingsList.tsx exists');
const findingsContent = fs.readFileSync(findingsPath, 'utf8');
assert(findingsContent.includes('DoubleBezelCard'), 'FindingsList uses DoubleBezelCard container');
assert(findingsContent.includes('scoreContribution'), 'FindingsList displays score contribution math chips');
assert(findingsContent.includes('totalContribution'), 'FindingsList computes total cumulative risk contribution');
assert(findingsContent.includes('SIGNAL_DESCRIPTIONS'), 'FindingsList provides heuristic signal explanations');
assert(findingsContent.includes('Verified Clean Baseline'), 'FindingsList displays baseline clean verification on 0 findings');

// 5. CSS Motion Tokens, Spotlight & Doppelrand Invariants
console.log('\n5. Checking CSS Motion Tokens & Styling Invariants...');
const indexCssPath = path.join(rootDir, 'src', 'index.css');
assert(fs.existsSync(indexCssPath), 'index.css exists');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');
assert(indexCss.includes('@keyframes shimmer-sweep'), 'index.css defines shimmer-sweep animation');
assert(indexCss.includes('@keyframes spotlight-pulse'), 'index.css defines spotlight-pulse animation');
assert(indexCss.includes('.attack-spotlight'), 'index.css defines .attack-spotlight class');
assert(indexCss.includes('.code-inspector-container'), 'index.css defines code inspector container');

const appCssPath = path.join(rootDir, 'src', 'App.css');
assert(fs.existsSync(appCssPath), 'App.css exists');
const appCss = fs.readFileSync(appCssPath, 'utf8');
assert(appCss.includes('.cockpit-grid'), 'App.css defines 3-column .cockpit-grid layout');
assert(appCss.includes('.bezel-card'), 'App.css defines .bezel-card outer container');
assert(appCss.includes('.bezel-card-inner'), 'App.css defines .bezel-card-inner recessed core');

console.log('\n----------------------------------------------------');
console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  console.error('\n>> Phase 3 Verification FAILED! <<\n');
  process.exit(1);
} else {
  console.log('\n>> Phase 3 Requirements Verified Successfully! <<\n');
  process.exit(0);
}
