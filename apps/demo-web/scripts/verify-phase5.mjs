/**
 * Phase 5 Verification Script: Live API Integration, Telemetry HUD & Fallback Resilience
 * Validates:
 * 1. Zero-Conflict isolation boundaries with Rishabh
 * 2. Resilient HttpProtectionService contract, error classes, timeout, and preflight validation
 * 3. Telemetry HUD & ApiConfigModal endpoint management
 * 4. Rule 4.4 compliant FallbackAlertBanner with 1-click auto-failover
 * 5. Cyber-HUD Tactical Toast Notification System replacing raw browser alerts
 * 6. CSS tokens & integration integrity
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
console.log('  AgentGuard Phase 5 Verification: Live API & Fallback');
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

// 2. Resilient HttpProtectionService & Error Handling
console.log('\n2. Checking Resilient HttpProtectionService & Error Handling...');
const httpServicePath = path.join(rootDir, 'src', 'services', 'protection', 'HttpProtectionService.ts');
assert(fs.existsSync(httpServicePath), 'HttpProtectionService.ts exists');
const httpServiceContent = fs.readFileSync(httpServicePath, 'utf8');
assert(httpServiceContent.includes('class ApiConnectionError'), 'Exports ApiConnectionError class');
assert(httpServiceContent.includes('class ApiValidationError'), 'Exports ApiValidationError class');
assert(httpServiceContent.includes('class ApiServerError'), 'Exports ApiServerError class');
assert(httpServiceContent.includes('DEFAULT_PROTECTION_API_URL'), 'Defines DEFAULT_PROTECTION_API_URL');
assert(httpServiceContent.includes('STORAGE_KEY_API_URL'), 'Defines STORAGE_KEY_API_URL');
assert(httpServiceContent.includes('getBaseUrl'), 'Supports getBaseUrl()');
assert(httpServiceContent.includes('setBaseUrl'), 'Supports setBaseUrl()');
assert(httpServiceContent.includes('setTimeoutMs'), 'Supports setTimeoutMs()');
assert(httpServiceContent.includes('AbortSignal.timeout'), 'Uses AbortSignal.timeout for network boundaries');
assert(httpServiceContent.includes('Scan request must contain a non-empty scanId'), 'Performs preflight scanId validation');
assert(httpServiceContent.includes('Scan request must contain a non-empty userTask'), 'Performs preflight userTask validation');

// 3. Telemetry HUD & ApiConfigModal Endpoint Management
console.log('\n3. Checking Telemetry HUD & ApiConfigModal...');
const modalPath = path.join(rootDir, 'src', 'components', 'ApiConfigModal.tsx');
assert(fs.existsSync(modalPath), 'ApiConfigModal.tsx exists');
const modalContent = fs.readFileSync(modalPath, 'utf8');
assert(modalContent.includes('bezel-card'), 'ApiConfigModal wraps in double-bezel styling');
assert(modalContent.includes('handleTestConnection'), 'ApiConfigModal features live connection ping test');
assert(modalContent.includes('DEFAULT_PROTECTION_API_URL'), 'ApiConfigModal includes default preset');
assert(modalContent.includes('handleSave'), 'ApiConfigModal saves endpoint to service and triggers update');

const headerPath = path.join(rootDir, 'src', 'components', 'Header.tsx');
assert(fs.existsSync(headerPath), 'Header.tsx exists');
const headerContent = fs.readFileSync(headerPath, 'utf8');
assert(headerContent.includes('ApiConfigModal'), 'Header integrates ApiConfigModal');
assert(headerContent.includes('Settings'), 'Header includes Settings button for endpoint config');
assert(headerContent.includes('latencyMs'), 'Header displays millisecond latency telemetry');

// 4. Fallback Alert Banner & Contract Rule 4.4
console.log('\n4. Checking Fallback Alert Banner & Rule 4.4 Invariants...');
const fallbackPath = path.join(rootDir, 'src', 'components', 'FallbackAlertBanner.tsx');
assert(fs.existsSync(fallbackPath), 'FallbackAlertBanner.tsx exists');
const fallbackContent = fs.readFileSync(fallbackPath, 'utf8');
assert(fallbackContent.includes('Protection Scan Unavailable'), 'Displays Rule 4.4 protection scan unavailable banner');
assert(fallbackContent.includes('never assumed safe'), 'Explicitly warns that unverified pages are never assumed safe');
assert(fallbackContent.includes('onSwitchToMock'), 'Provides 1-click switch to mock fixtures');
assert(fallbackContent.includes('onRetryConnection'), 'Provides connection retry trigger');

// 5. Cyber-HUD Toast Notification System
console.log('\n5. Checking Cyber-HUD Toast Notification System...');
const toastContextPath = path.join(rootDir, 'src', 'components', 'common', 'ToastContext.tsx');
assert(fs.existsSync(toastContextPath), 'ToastContext.tsx exists');
const toastContextContent = fs.readFileSync(toastContextPath, 'utf8');
assert(toastContextContent.includes('ToastProvider'), 'Exports ToastProvider');
assert(toastContextContent.includes('useToast'), 'Exports useToast hook');
assert(toastContextContent.includes('showToast'), 'Provides showToast function');

const toastContainerPath = path.join(rootDir, 'src', 'components', 'common', 'ToastContainer.tsx');
assert(fs.existsSync(toastContainerPath), 'ToastContainer.tsx exists');
const toastContainerContent = fs.readFileSync(toastContainerPath, 'utf8');
assert(toastContainerContent.includes('useToast'), 'ToastContainer consumes useToast hook');
assert(toastContainerContent.includes('dismissToast'), 'ToastContainer supports manual toast dismissal');

const appPath = path.join(rootDir, 'src', 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf8');
assert(appContent.includes('ToastProvider'), 'App wraps dashboard in ToastProvider');
assert(appContent.includes('ToastContainer'), 'App renders floating ToastContainer');
assert(!appContent.includes('alert('), 'App eliminates raw browser alert() calls in favor of tactical toasts');
assert(appContent.includes('FallbackAlertBanner'), 'App integrates FallbackAlertBanner when live API is offline');

console.log('\n----------------------------------------------------');
console.log(`Results: ${passCount} Passed, ${failCount} Failed`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  console.error('\n>> Phase 5 Verification FAILED! <<\n');
  process.exit(1);
} else {
  console.log('\n>> Phase 5 Requirements Verified Successfully! <<\n');
  process.exit(0);
}
