# 09: Evaluation + adversarial hardening

**What to build:** The protection layer's quality is measured and reported honestly: precision/
recall and false positives on derived test states, a multi-view vs visible-only vs DOM-only
baseline comparison, held-back paraphrased variants scored honestly, and a machine-readable
evaluation export. False positives are logged, not hidden.

**Blocked by:** 05 (action gate + seven contract tests green). Can run in parallel with 06–08.

**Status:** ready-for-agent

Scope (Phase 6 §9.1–9.2, §9.4 of `docs/02_PHASE_PLAN_RISHABH.md`):

- 15–30 safe/malicious test states derived from the local fixtures (S1 Phase 6).
- Measure detection precision/recall, false positives, blocked unsafe actions, safe task
  completion, and per-view findings (NFR-7); record latency per fixture honestly, claiming no
  benchmark (NFR-7, NFR-8).
- Compare multi-view scanning against visible-text-only and DOM-only baselines.
- Unit tests for the scoring policy; integration tests for the fixture pages (NFR-10).
- Improve false positives, especially legitimate ARIA labels and accessibility help text; the
  benign-ARIA case must remain functional.
- Held-back fixture variants (paraphrased wording, different selectors, different hidden
  technique) not used to write rules — report the score drop honestly (NFR-8).
- Confirm no fixture-specific sentence is special-cased in rule sources (NFR-11).
- Evaluation export: machine-readable JSON per scenario — scanId, fixture, expected vs observed
  decision, score, risk level, finding views, signals (FR-7.2).

- [ ] `npm run evaluate` writes evaluation JSON per scenario.
- [ ] Precision/recall and false-positive numbers exist for the derived test states.
- [ ] Baseline comparison table (multi-view vs visible-only vs DOM-only) exists.
- [ ] Held-back variants scored and the drop reported honestly; false positives logged in the report.
- [ ] Benign ARIA / accessibility help text no longer produces false positives.
