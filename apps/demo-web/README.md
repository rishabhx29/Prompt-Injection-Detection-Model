# AgentGuard Demonstration Web Application (`apps/demo-web`)

**Owner:** Saumya (24BRS1065)  
**Collaborator:** Rishabh Tripathi (24BRS1136)  
**Tech Stack:** React 19 + TypeScript + Vite + Vanilla CSS Glassmorphism + Lucide Icons  

---

## 1. Overview

`apps/demo-web` is the presentation cockpit and demonstration environment for **AgentGuard**. It provides an interactive visual security dashboard showing how multi-view prompt injection protection works in real time against autonomous LLM web agents.

### Key Capabilities
- **5 High-Fidelity Test Webpage Templates**:
  - `SafeRefundTemplate`: E-commerce refund policy with 4-step interactive return stepper.
  - `AriaAttackTemplate`: Customer support portal carrying hidden `aria-label` injection vector with real-time AX spotlight radar overlay.
  - `VisibleAttackTemplate`: Audio gear product page with ratings, verified customer feedback, and hostile review.
  - `TaskDeviationTemplate`: User profile settings with hardware 2FA and deceptive secondary recovery email phishing notice.
  - `BenignAriaTemplate`: Warranty registration form with valid imperative accessibility labels (`Submit application form`).
- **Dynamic Multi-View Extraction Layer (`src/services/extraction/`)**:
  - Supports both **Catalog Spec Mode** (frozen JSON specification) and **Live DOM Mode** (real-time extraction of visible text nodes, raw DOM tags, and `aria-*` attributes from rendered container elements).
- **Asymmetric Security Cockpit UI**:
  - **Left Column:** Scenario selector, customizable user task input, simulated browser preview with mode toggle.
  - **Center Column:** Circular SVG animated risk gauge (0–100), decision badge (`ALLOW`, `SANITIZE`, `CONFIRM`, `BLOCK`), plain-language summary, and expandable findings breakdown.
  - **Right Column:** Multi-View Evidence Inspector (`Visible Text`, `Raw DOM`, `AXTree/ARIA`) highlighting detected hostile spans, and interactive Action Gate card.
  - **Bottom Timeline:** Step-by-step simulated LLM agent execution lifecycle trace (`Observe` → `Orient` → `Plan` → `Gate Check` → `Executed/Blocked`).
- **Zero-Conflict Dual-Mode Architecture (`src/services/protection/`)**:
  - **Mock Mode (Default):** 100% offline development and demonstration using fixture catalog data.
  - **Live Mode:** Real-time HTTP bridge calling Rishabh's `protection-api` (`GET /health`, `POST /scan-page`, `POST /check-action`) with automatic latency monitoring and fallback resilience.

---

## 2. Directory Structure

```text
apps/demo-web/
├── index.html                             # App HTML entry point
├── package.json                           # Dependencies & verification scripts
├── tsconfig.json                          # TypeScript configuration
├── vite.config.ts                         # Vite configuration
├── scripts/
│   ├── verify-phase1.mjs                  # Phase 1 verification suite (59 checks)
│   ├── verify-phase2.mjs                  # Phase 2 verification suite (39 checks)
│   ├── verify-integration-contract.mjs    # Contract parity verification suite (122 checks)
│   └── verify-all.mjs                     # Master runner executing all suites sequentially
└── src/
    ├── App.tsx                            # Main cockpit orchestrator & state machine
    ├── App.css                            # Layout grid & cockpit styling
    ├── index.css                          # High-tech dark design system & tokens
    ├── components/
    │   ├── Header.tsx                     # Top navigation bar, mode switcher, health badge
    │   ├── ScenarioSelector.tsx           # Scenario dropdown & category badges
    │   ├── TaskInput.tsx                  # User task input with reset capability
    │   ├── WebpagePreview.tsx             # Simulated browser chrome with extractor toggle
    │   ├── VerdictPanel.tsx               # Circular risk score gauge & decision badge
    │   ├── FindingsList.tsx               # Findings cards with severity & signal tags
    │   ├── MultiViewInspector.tsx         # Tabbed evidence viewer with span highlights
    │   ├── ActionGateCard.tsx             # Proposed action evaluation & gate outcome
    │   ├── SimulatedAgentTrace.tsx        # 5-step LLM agent execution timeline
    │   └── ConfirmationModal.tsx          # Interactive human-in-the-loop modal
    ├── fixtures/
    │   ├── catalog/                       # 5 scenario data fixtures & helpers
    │   ├── templates/                     # 5 modular React webpage templates
    │   └── types.ts                       # Fixture scenario interfaces
    ├── services/
    │   ├── protection/                    # Mock & HTTP protection services
    │   ├── extraction/                    # Catalog & Live DOM text/AXTree extractors
    │   └── agent/                         # Deterministic simulator & LLM adapter placeholder
    └── types/
        └── agentguard-contract.ts         # Frozen contract types matching TEAM_DEVELOPMENT_PLAN
```

---

## 3. Available Scripts

```bash
# Start local development server
npm run dev

# Run Phase 1 verification suite
npm run verify:phase1

# Run Phase 2 verification suite
npm run verify:phase2

# Run Contract Parity & Integration verification suite
npm run verify:contract

# Run Master Verification Suite (Runs all 220 automated checks)
npm run verify:all
```
