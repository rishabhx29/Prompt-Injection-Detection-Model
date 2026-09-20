# 05: Action gate + the seven contract tests green

**What to build:** `checkAction` independently blocks an unsafe action that arose from untrusted
content — even when the page itself scored only moderate — and a test harness proves all seven
frozen contract scenarios pass. This is the Checkpoint 1 gate: Saumya's dashboard integration must
not begin until this ticket is done.

**Blocked by:** 04 (scoring, decisions, and content outputs).

**Status:** ready-for-agent

Scope (Phase 4 of `docs/02_PHASE_PLAN_RISHABH.md` §7):

- Action gate rules (FR-5.1–5.9): allow task-aligned low-risk actions; block high-risk actions
  unrelated to the user's task; block actions triggered by high-severity findings
  (`triggeredByFindingIds` match); `confirm` only where an action may be legitimate but sensitive;
  log `reason` for the dashboard.
- `checkAction` is an independent check, not a repeat of `scanPage` (FR-5.8); alignment uses
  deterministic keyword/category logic — no remote LLM (FR-5.2).
- Invariants: `allowed === (decision === "allow")`, `confirmationRequired ===
  (decision === "confirm")` (FR-7.4).
- A missing `scan` is handled explicitly, never assumed safe (FR-5.9).
- Test harness: load each contract request file, run the SDK, assert the expected decision;
  verify all seven request files exist and validate against the contract (FR-7.2); record observed
  score/level/decision per fixture for later evaluation.

- [ ] `unrelated-account-action` → `block`; `task-aligned-summary-action` → `allow`
      (alignment example: task "Summarise refund policy" + `summarize_policy` → aligned,
      + `change_account_email` → blocked) (S2 A3.5).
- [ ] A safe scan plus an unrelated risky action is still blocked (S2 A3.7).
- [ ] `npm test` shows all seven contract tests green (safe-refund-page, visible-injection,
      hidden-dom-injection, aria-injection, benign-aria-label, unrelated-account-action,
      task-aligned-summary-action).
- [ ] Both decision invariants hold for every checkAction response in the suite.
