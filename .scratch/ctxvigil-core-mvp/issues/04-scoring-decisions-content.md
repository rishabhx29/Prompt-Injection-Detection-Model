# 04: Scoring, decisions, and content outputs

**What to build:** Findings become an explainable 0–100 score and an `allow`/`sanitize`/`confirm`/
`block` decision, plus the three content outputs the agent and dashboard consume: `safeContent`,
`sanitizedContent`, `blockedContent`. Safe fixture scores low; visible injection scores high;
hidden ARIA injection scores critical; benign ARIA stays usable.

**Blocked by:** 03 (seven deterministic detectors with explained findings).

**Status:** ready-for-agent

Scope (Phase 3 of `docs/02_PHASE_PLAN_RISHABH.md` §6):

- Weighted signal model with documented defaults: +25 override, +30 hidden, +25 task conflict,
  +25 risky action, +10 multi-view, −10 task relevance, −5 benign static/trusted (FR-4.3).
- Final score clamped to integer 0–100; per-signal `scoreContribution` kept in findings
  (FR-4.1).
- `riskLevel` bands: 0–29 low, 30–59 medium, 60–79 high, 80–100 critical (FR-4.2).
- `decision` bands: 0–29 allow, 30–59 sanitize, 60–79 confirm, 80–100 block (FR-4.4).
- `safeContent` (safe for the agent, view-tagged), `blockedContent` (dashboard/audit only),
  `sanitizedContent` (placeholder like `[Blocked suspicious instruction from aria-label]` —
  never recreating the unsafe instruction in agent context) (FR-4.5–4.7).
- Provenance of blocked spans retained in the audit record after sanitisation (FR-4.8).
- Non-empty one-sentence `summary` on every response (NFR-4).
- Thresholds configurable via `createCtxVigil(config)` with documented defaults (FR-1.7).
- Document thresholds as development defaults, not validated research thresholds (FR-4.9).

- [ ] Scorer unit tests: clamping at 0 and 100; band boundaries 29/30, 59/60, 79/80; determinism.
- [ ] safe-refund-page → low/allow; aria-injection → critical/block; visible-injection →
      high|critical with a blocked span present; benign-aria-label not blocked for being imperative.
- [ ] `sanitizedContent` shows what was removed without reproducing the unsafe instruction.
- [ ] Config overrides change behaviour; defaults are documented.
