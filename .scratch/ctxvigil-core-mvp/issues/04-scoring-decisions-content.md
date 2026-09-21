# 04: Scoring, decisions, and content outputs

**What to build:** Findings become an explainable 0–100 score and an `allow`/`sanitize`/`confirm`/
`block` decision, plus the three content outputs the agent and dashboard consume: `safeContent`,
`sanitizedContent`, `blockedContent`. Safe fixture scores low; visible injection scores high;
hidden ARIA injection scores critical; benign ARIA stays usable.

**Blocked by:** 03 (seven deterministic detectors with explained findings).

**Status:** done

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

- [x] Scorer unit tests: clamping at 0 and 100; band boundaries 29/30, 59/60, 79/80; determinism.
- [x] safe-refund-page → low/allow; aria-injection → critical/block; visible-injection →
      high|critical with a blocked span present; benign-aria-label not blocked for being imperative.
- [x] `sanitizedContent` shows what was removed without reproducing the unsafe instruction.
- [x] Config overrides change behaviour; defaults are documented.

## Comments

- Implemented 2026-09-21: `src/score/index.ts` (stage 4) and `src/policy/index.ts` (stage 5),
  wired into the `scanPage` pipeline; 39 new tests; 119 green via root `npm test`.
- Single band table `bandFor(score, config)` produces both `riskLevel` and `decision`, so the
  two cascades can never drift (contract §5/§6 edges 29/30, 59/60, 79/80 pinned by tests).
- Contribution arithmetic: per-flagged-segment sum, floored at 0 so a finding never reports a
  negative contribution; the sum of contributions still reconstructs the pre-clamp score, then
  clamp to 0–100 (architecture §6.4).
- **Damping design (review-corrected).** `benignTaskRelevance` (−10) damps a flagged segment that
  shares *meaningful* task vocabulary (stopword-filtered — function-word overlap must not count).
  `benignStatic` (−5) is a credit for **unflagged visible** segments, capped in aggregate at
  |benignTaskRelevance| — an early draft damped the visible attack itself, landing
  visible-injection at exactly the 60 floor; the fix restores a 5-point margin (now 65).
- Policy partitions by scorer-supplied `flaggedSegmentIndexes` (no text re-matching, so duplicate
  texts can't misattribute); placeholders name the sourceKind and never quote the attack (FR-4.6);
  provenance of blocked spans stays on the finding in the response (FR-4.8).
- Shared tokenizer `src/text/tokens.ts` used by detect + score; `role_impersonation` and
  `data_exfiltration` now have their own configurable weights (25/25 defaults, added to
  `WeightConfig`).
- Oracle harness in `sdk.test.ts` reads the scan-level fields of `sample-data/EXPECTATIONS.json`
  (riskLevel/decision/score bounds, requiredSignals, requiredViews, findingsExpected,
  blockedContent*, mustNotBlockSolelyForImperativeAccessibleLabel). Action-level oracle fields
  (actionDecision, actionAllowed, actionConfirmationRequired, reasonNonEmpty) are ticket 05's.
- Architecture §11.2 grep scope clarified to `packages/*/src`: tests may quote fixtures; rules may not.

### Honest limitations (carry into the report)

- Weights/bands remain development defaults, not validated research thresholds (FR-4.9).
- The summary names the single strongest finding's strongest signal (readable); a page with two
  unrelated attacks gets one sentence about the dominant one.
- Task-relevance damping uses vocabulary overlap, not semantics — a paraphrased task-aligned
  instruction may not be damped (conservative direction).

