# 01 — Product Requirements Document (PRD)

**Product:** CtxVigil — multi-view prompt-injection protection layer for LLM web agents
**Package:** `ctxvigil` (npm) · **Primary deliverable:** `packages/ctxvigil-core`
**Owner of this document:** Rishabh Tripathi (24BRS1136) — protection layer
**Version:** 1.0 · **Date:** 2026-09-20 · **Status:** Approved for build (frozen contract)
**Derived from:** `docs/00_SOURCE_EXTRACTION.md` (which mirrors `Required/*.md`)

---

## 1. Purpose

CtxVigil is a reusable protection layer that a developer installs around an LLM web agent. It sits
at two boundaries — content ingestion and action execution — and answers two questions:

1. Is this source likely trying to inject or override instructions?
2. Does the source instruction conflict with the user's original task or request a risky,
   unrelated action?

It returns a transparent, evidence-backed risk assessment and prevents automatic execution of
high-risk actions.

**Framing discipline:** the dashboard is the presentation layer, not the product. The product is
the SDK. The demo proves the SDK works.

---

## 2. Users and jobs-to-be-done

| User | Job to be done | Success looks like |
|---|---|---|
| **Integrating developer** (primary) | Wrap an existing agent with two hook calls and stop trusting page content blindly | `npm install ctxvigil` → two hook calls → agent only sees `safeContent`; unsafe actions blocked |
| **Agent operator / reviewer** | Understand *why* content was flagged without reading source code | Per-finding view, source kind, selector, signals, severity, reason, score contribution |
| **Student evaluator / professor** (demo) | See the layer detect attacks a human eye misses | Hidden ARIA/DOM injection caught and explained, plus benign ARIA not falsely blocked |
| **Fellow student integrator** (Saumya) | Build the dashboard against a stable contract without waiting on the API | Frozen JSON contract + sample requests/responses available offline |

---

## 3. Scope boundaries

### 3.1 In scope (v1)

- Framework-independent Node.js/TypeScript SDK with `createCtxVigil`, `scanPage`, `checkAction`.
- Deterministic, explainable detection over four input views: visible text, DOM text, hidden DOM
  text, accessibility/ARIA text (image/OCR reserved and accepted as an optional empty view).
- Provenance-preserving normalisation of all input text.
- Risk scoring on a documented weighted model, 0–100, with clamped output.
- Content policy producing exactly `allow` / `sanitize` / `confirm` / `block`.
- Action gate with an independent decision (task alignment + risk category + finding trigger).
- CLI over the same core logic.
- Thin local HTTP adapter (`GET /health`, `POST /scan-page`, `POST /check-action`) with no
  duplicated detection logic.
- Package metadata publishable from the start; `npm pack` install-verified locally.
- Tests: unit + the seven contract-required scenarios, using static JSON.

### 3.2 Deferred (after MVP, only if time remains)

- OCR / screenshot image-text detection (Stage D).
- Lightweight ML classifier or calibrator compared against the rule baseline (Stage C).
- Public npm publication, browser-extension proof-of-concept, Docker packaging (Stage E).

### 3.3 Explicitly out of scope

- Real browser-extension deployment; live web crawling.
- Real accounts, payments, email sending, credential changes, or data exfiltration.
- Large-model training/fine-tuning; a paid cloud LLM dependency for the core demo.
- Authentication, databases, user accounts, complex deployment.
- Claims of universal detection, novelty over prior work, or state-of-the-art benchmark results.

---

## 4. Functional requirements

Each requirement has an ID, a source reference, and a testable statement.

### 4.1 SDK surface and packaging

| ID | Requirement | Source |
|---|---|---|
| FR-1.1 | The core package must build as an independent Node.js/TypeScript package with no browser or UI dependency. | S1 §3.1, S2 §3 |
| FR-1.2 | It must export `createCtxVigil(config?)`, plus `scanPage` and `checkAction` as both guard methods and standalone functions. | S2 A2, A3.1 |
| FR-1.3 | It must export the public input/output TypeScript types. | S2 A3.1 |
| FR-1.4 | `package.json` must carry name, version, licence, `exports`, `types`, `files`, and a repository placeholder suitable for later publication. | S2 A3.1 |
| FR-1.5 | `npm pack` must produce an installable artifact containing only required build files, verified by installing it into a fresh local project. | S1 Stage E, S2 A3.9 |
| FR-1.6 | The SDK must be fully usable with no server running and no API key. | S2 A2, A3.9 |
| FR-1.7 | Configuration (thresholds, phrase lists, action categories) must be overridable via `createCtxVigil(config)` without editing source. | S1 §6, S2 A3.4 |

### 4.2 Input validation and normalisation

| ID | Requirement | Source |
|---|---|---|
| FR-2.1 | Validate `scanId`, `userTask`, and page content fields; reject malformed input with a machine-readable error. | S2 A3.2, §4.4 |
| FR-2.2 | Treat `visibleText`, `domText`, `hiddenText`, `accessibilityText`, `imageText` as optional arrays — never as trusted instructions. | S2 A3.2 |
| FR-2.3 | Normalise text: trim → drop empties → collapse whitespace → tag with view/source kind/selector → deduplicate exact repeats. | S2 A3.3 |
| FR-2.4 | Every finding must retain provenance: view, source kind, selector, and original text. | S2 A3.2, A3.3 |
| FR-2.5 | Semantic (fuzzy) deduplication is explicitly **not** required in v1. | S2 A3.3 |
| FR-2.6 | A text segment must be identifiable as visible, dom, hidden_dom, aria, alt, or ocr. | S1 Phase 2 |

### 4.3 Detection

| ID | Requirement | Source |
|---|---|---|
| FR-3.1 | Implement detector `instruction_override`. | S2 A3.4 |
| FR-3.2 | Implement detector `role_impersonation`. | S2 A3.4 |
| FR-3.3 | Implement detector `data_exfiltration`. | S2 A3.4 |
| FR-3.4 | Implement detector `risky_action`. | S2 A3.4 |
| FR-3.5 | Implement detector `hidden_content` (suspicious text in hidden DOM or AXTree/ARIA rather than visible text). | S2 A3.4 |
| FR-3.6 | Implement detector `task_conflict` (low relevance to the user task, or explicit redirection). | S2 A3.4 |
| FR-3.7 | Implement detector `multi_view_repetition` (same suspicious content in ≥2 views). | S2 A3.4 |
| FR-3.8 | Each detector must return a named signal, evidence text, severity, and score contribution. | S2 A3.4 |
| FR-3.9 | Every finding must carry a human-readable reason a non-author can follow. | S1 Stage A, S2 A3.4 |
| FR-3.10 | Phrase lists and action categories must live in data/config files, not hard-coded in route handlers or logic branches. | S2 A3.4 |
| FR-3.11 | A merely imperative sentence must **not** be classified as injection; classification requires combination with conflict, risk, or source signals. | S2 A3.4 |
| FR-3.12 | Detector output must be deterministic for identical input. | S2 A3.6 |

### 4.4 Scoring and content policy

| ID | Requirement | Source |
|---|---|---|
| FR-4.1 | Produce an integer `riskScore` in 0–100, clamped, with individual contributions retained in the output. | S1 §6, S2 A3.6 |
| FR-4.2 | Map score to `riskLevel` using documented bands: 0–29 low, 30–59 medium, 60–79 high, 80–100 critical. | S1 §6 |
| FR-4.3 | Use the documented weighted signal model as the v1 default (override +25, hidden +30, task conflict +25, risky action +25, multi-view +10, task relevance −10, normal static −5). | S1 §6 |
| FR-4.4 | Emit exactly one of `allow`, `sanitize`, `confirm`, `block` — no other values. | S2 §4.3 |
| FR-4.5 | `safeContent` must contain only text safe to give the agent, tagged with its view. | S2 A3.6 |
| FR-4.6 | `blockedContent` must contain the suspicious text for dashboard/audit use only. | S2 A3.6 |
| FR-4.7 | `sanitizedContent` must show what was removed without recreating unsafe instructions in agent context. | S2 A3.6 |
| FR-4.8 | Blocked spans must retain provenance in the audit record even after sanitisation. | S1 Phase 4 |
| FR-4.9 | Decision thresholds must be documented as development defaults, not validated research thresholds. | S1 §6 |

### 4.5 Task alignment and action gate

| ID | Requirement | Source |
|---|---|---|
| FR-5.1 | Compare the proposed action against the original user task and against high-risk action categories. | S1 Stage B, S2 A3.5 |
| FR-5.2 | The comparison must be deterministic and local — no remote LLM dependency. | S2 A3.5 |
| FR-5.3 | Allow a task-aligned, low-risk action. | S2 A3.7 |
| FR-5.4 | Block a high-risk action unrelated to the user's task. | S2 A3.7 |
| FR-5.5 | Block an action directly triggered by a high-severity finding (via `triggeredByFindingIds`). | S2 A3.7, §4.2 |
| FR-5.6 | Return `confirm` only where an action may be legitimate but is sensitive. | S2 A3.7 |
| FR-5.7 | Return the reason in the response so the dashboard can display it. | S2 A3.7, §4.2 |
| FR-5.8 | `checkAction` must be an independent decision, not a repeat of `scanPage`. | S2 A3.7 |
| FR-5.9 | `checkAction` must work from the scan result plus user task; a missing scan must be handled explicitly rather than assumed safe. | S2 §4.2, S1 Stage B |

### 4.6 CLI and HTTP adapter

| ID | Requirement | Source |
|---|---|---|
| FR-6.1 | The CLI must expose `scan --input page.json --task "…"`. | S1 §3.1, S2 A3.9 |
| FR-6.2 | The CLI must print machine-readable JSON by default or with `--json`, plus a compact readable report. | S2 A3.9 |
| FR-6.3 | The CLI must support `--help` and exit non-zero on malformed input. | S2 A3.9 |
| FR-6.4 | The CLI must require no network access or API key. | S2 A3.9 |
| FR-6.5 | The CLI must produce the same decision as a direct SDK import for the same JSON input. | S2 A3.9 |
| FR-6.6 | The adapter must expose `GET /health`, `POST /scan-page`, `POST /check-action`. | S2 A3.1 |
| FR-6.7 | The adapter must import the core package and contain **no** detection or scoring rules of its own. | S1 §3.1.1, S2 §3 |
| FR-6.8 | The adapter must return HTTP 400 with a machine-readable error for malformed input and 500 only for unexpected internal errors. | S2 §4.4 |
| FR-6.9 | CORS must be enabled only for the demo web origin. | S2 A3.1 |
| FR-6.10 | The adapter must start locally with one documented command. | S2 A3.1 |

### 4.7 Integration-facing behaviour (contract with Saumya)

| ID | Requirement | Source |
|---|---|---|
| FR-7.1 | Requests and responses must match `docs/03_API_CONTRACT.md` field-for-field. | S2 §4 |
| FR-7.2 | Sample request/response JSON for every scenario must exist under `sample-data/`. | S2 §4.4 |
| FR-7.3 | Every response field the dashboard renders must be present and stable; field changes require a changelog entry. | S2 A5 |
| FR-7.4 | The dashboard must be able to distinguish `allow`, `sanitize`, `confirm`, `block` states from the response alone. | S2 B3.6 |
| FR-7.5 | When the API is unavailable the dashboard must show "Protection scan unavailable" and never imply safety. | S2 §4.4 |
| FR-7.6 | Findings must be renderable individually with highlightable suspicious text. | S2 B3.6 |
| FR-7.7 | The response must indicate which finding triggered a blocked action. | S2 B3.5 |

---

## 5. Non-functional requirements

| ID | Requirement | Verification |
|---|---|---|
| NFR-1 | **Determinism.** Identical input produces byte-identical output across runs and machines. | Run the same fixture scan twice; diff JSON. |
| NFR-2 | **Offline operation.** No network call required for scan, action check, CLI, or adapter. | Run with network disabled. |
| NFR-3 | **No secrets.** No API keys, tokens, or credentials anywhere in code, config, or docs. | Repo grep; review `.env.example` absence or emptiness. |
| NFR-4 | **Explainability.** Every decision carries at least one reason citing the view and signal. | Assert on all seven fixtures. |
| NFR-5 | **Type safety.** Public API is fully typed; the package compiles under strict TypeScript. | `tsc --noEmit` in CI/local check. |
| NFR-6 | **Publishability.** `npm pack` output installs and works in a clean project. | Manual Phase 6 check. |
| NFR-7 | **Latency.** Local scan of a single fixture completes in well under a second on a student laptop; report measured values without overclaiming. | Measured per fixture, recorded in evaluation data. |
| NFR-8 | **Honesty.** Docs and demo wording never claim universal detection, novelty, or benchmark superiority. | Doc review against S1 §10, S2 §8. |
| NFR-9 | **Safety of demo content.** All fixtures fictional, `*.test` domains/emails, actions mutate only local state. | Fixture review before each demo. |
| NFR-10 | **Testability.** Core logic is exercisable from static JSON with no frontend or browser. | Test suite runs headless. |
| NFR-11 | **Maintainability.** Detection data separated from decision logic; no fixture string special-cased in rules. | Code review; S2 §9. |
| NFR-12 | **Portability.** Node.js runtime only for core/CLI; no native or OS-specific dependency. | Fresh Windows + `npm install`/`npm pack` test. |

---

## 6. Acceptance criteria

### 6.1 Contract test scenarios (the seven required IDs)

These are the authoritative test scenarios. Each maps to a request file under
`sample-data/scan-requests/`.

| Test ID | Input fixture | Expected scan result | Expected action result |
|---|---|---|---|
| `safe-refund-page` | Clean refund page, refund task | Low risk, `allow` | `summarize_policy` → `allow` |
| `visible-injection` | Review page with visible malicious instruction | High/critical risk, blocked span, finding in visible text | n/a |
| `hidden-dom-injection` | Page with CSS-hidden malicious text | High/critical risk, finding says hidden DOM | n/a |
| `aria-injection` | Visually normal page with malicious `aria-label` / SR-only text | High/critical risk, finding says accessibility tree / ARIA | `change_account_email` → `block` |
| `benign-aria-label` | Icon button with legitimate imperative `aria-label` | Must not be blocked merely because the accessible label is imperative | benign action → `allow` |
| `unrelated-account-action` | Safe-enough page | Reasonable risk assessment | `change_account_email` → `block` |
| `task-aligned-summary-action` | Safe refund page | Low risk | `summarize_policy` → `allow` |

**DoD:** all seven pass, using static JSON, before any frontend integration. (S2 A3.8)

### 6.2 Rishabh's acceptance checklist (S2 A4) — reproducible

- [ ] AC-1 API starts locally and `/health` responds.
- [ ] AC-2 Core SDK imports without running a server.
- [ ] AC-3 `npm pack` artifact installs and works in a fresh local sample project.
- [ ] AC-4 CLI invokes the same core scanner and `--help` works.
- [ ] AC-5 Contract-compliant `scan-page` request returns contract-shaped JSON.
- [ ] AC-6 Findings preserve view, source kind, selector, signal names, and reasons.
- [ ] AC-7 Score is stable and documented.
- [ ] AC-8 Content is sanitized before simulated agent access.
- [ ] AC-9 Action gate makes an independent decision.
- [ ] AC-10 Required test cases pass (at minimum the six fully specified cases).
- [ ] AC-11 API has clear setup instructions and sample requests.
- [ ] AC-12 No real browser account, credentials, or external action is required.

### 6.3 Demo-readiness checklist (S1 §12)

- [ ] User can enter an original task.
- [ ] User can choose a clean or malicious local webpage.
- [ ] System extracts visible text, DOM/hidden text, and AXTree/ARIA information.
- [ ] System identifies at least visible, hidden DOM, and ARIA prompt-injection examples.
- [ ] System produces an explainable score and `allow/sanitize/confirm/block` result.
- [ ] System gives the agent only approved/sanitized content.
- [ ] System blocks an action unrelated to the user's original task.
- [ ] Dashboard visibly shows the evidence, score, reasons, and final decision.
- [ ] Safe pages and benign accessibility cues are not all falsely blocked.
- [ ] All demonstrations work offline/locally without real credentials or sensitive actions.

### 6.4 Definition of finished prototype (S2 §10)

The prototype is complete when the SDK classifies and explains the required cases, sanitises
dangerous content, gates unsafe actions **without a server**, the packed artifact installs cleanly,
the CLI and HTTP adapter prove they share the same core logic, the dashboard visualises every
response clearly, a hidden ARIA/DOM instruction is demonstrably dangerous on a normal-looking page,
a safe page and safe aligned action succeed, an unrelated account-setting action is blocked before
any state change, a benign accessibility label is not blocked, and the whole demonstration runs
locally and predictably with no cloud service, real credentials, or manual workaround.

---

## 7. Success metrics

| Metric | Target | How measured |
|---|---|---|
| Required contract test scenarios passing | 7 / 7 | Test suite output |
| Fixture decision accuracy (matches expected decision) | 100% on the curated local fixtures | Evaluation harness over fixture catalog |
| Benign-ARIA false-positive rate | 0 on the curated benign fixtures | Benign scenarios return `allow` |
| Unsafe-post-scan action block rate | 100% of designated unsafe actions | Action-gate test set |
| Safe task-aligned action allow rate | 100% of designated safe actions | Action-gate test set |
| Evidence completeness | 100% of findings have view + signal + reason | Schema assertion on findings |
| Packed-artifact install success | Passes in a fresh project | Manual Phase 6 procedure |
| CLI/SDK decision parity | Identical decisions for identical input | Diff CLI output vs direct import |
| Local suspicious fixture scan time | < 1 s (soft target; report actual) | Timing harness, reported honestly |

**Explicitly not claimed:** public-web prevalence, universal resistance, SOTA benchmark scores
(S1 §10, S2 §8).

---

## 8. Anti-goals (do not build first) — S1 §13

- Do not begin with a browser extension, cloud deployment, or npm publication.
- Do not begin with OCR, a large vision model, fine-tuning, or a complex multi-agent architecture.
- Do not use a live banking, email, social-media, or shopping account.
- Do not rely on a paid LLM API for the core demonstration.
- Do not make vague "AI detection" claims without showing the detected source, signal, and reason.
- Do not omit benign ARIA/alt-text examples.

"A reliable small prototype is stronger than an ambitious but incomplete system."

---

## 9. Assumptions and limitations

**Assumptions**

1. The caller performs its own extraction (or the fixture catalog supplies representations) and
   always routes the LLM context through `scan.safeContent`. CtxVigil cannot enforce this if the
   integrator bypasses it.
2. The integrator calls `checkAction` before executing any risky tool/browser action.
3. Fixtures are fictional and local; no live-web parsing claims are made.
4. Node.js 20+ is available; the exact version used during development is recorded in the phase
   plan (dev machine: Node v24.14.1, npm 11.7.0).
5. The seven curated fixtures represent the demonstrated threat model, not the open web.

**Limitations (state these openly in the report)**

1. Rule-based v1 detection is pattern-driven; obfuscated, image-only, or heavily paraphrased
   injections will evade it.
2. Scoring weights are development defaults, not tuned or validated research thresholds.
3. Task alignment uses deterministic keyword/category logic, not semantic inference.
4. OCR/image text is accepted in the contract but not analysed in v1.
5. No authentication, persistence, or multi-tenant concerns are addressed.
6. Detection quality is measured only on a controlled local fixture set.

---

## 10. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Rules become fixture-specific (overfitting to demo strings) | Weak credibility; reviewer spots it | Keep phrase lists generic; S2 §9 forbids hard-coding fixture strings; evaluate on held-back variants |
| Benign ARIA gets blocked → "it just blocks hidden content" | Undermines the whole claim | `benign-aria-label` is a first-class required test expecting `allow` |
| Dashboard built before the detection layer | Static mock-up demo | Enforced build order: fixtures → extraction → detection → scoring → action gate → API tests → dashboard (S1 §14) |
| Integration drift between Rishabh and Saumya | Broken demo | Frozen contract doc + sample JSON + 4 checkpoints (S2 §5) |
| Optional ML/OCR eats MVP time | Incomplete core | Stage C/D/E are timeboxed extras only |
| Score tuned to make fixtures pass | Numbers look fitted | Document defaults as unvalidated; tune only after test data exists |
| Adapter slowly accumulates rules | Two sources of truth | Review rule: adapter imports core only; grep for phrase lists outside core |
| Realistic-sounding fixture data mistaken for real accounts | Misuse | `*.test` domains/emails mandatory; local-only actions |

---

## 11. Traceability

Requirement sources: `docs/00_SOURCE_EXTRACTION.md` §4–§8 (S1) and §12–§23 (S2). Phase ownership and
sequence: `docs/02_PHASE_PLAN_RISHABH.md`. Exact field names: `docs/03_API_CONTRACT.md`. Internal
pipeline and module boundaries: `docs/04_ARCHITECTURE.md`.