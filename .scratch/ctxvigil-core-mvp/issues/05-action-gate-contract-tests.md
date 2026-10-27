# 05: Action gate + the seven contract tests green

**What to build:** `checkAction` independently blocks an unsafe action that arose from untrusted
content — even when the page itself scored only moderate — and a test harness proves all seven
frozen contract scenarios pass. This is the Checkpoint 1 gate: Saumya's dashboard integration must
not begin until this ticket is done.

**Blocked by:** 04 (scoring, decisions, and content outputs).

**Status:** done

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

- [x] `unrelated-account-action` → `block`; `task-aligned-summary-action` → `allow`
      (alignment example: task "Summarise refund policy" + `summarize_policy` → aligned,
      + `change_account_email` → blocked) (S2 A3.5).
- [x] A safe scan plus an unrelated risky action is still blocked (S2 A3.7).
- [x] `npm test` shows all seven contract tests green (safe-refund-page, visible-injection,
      hidden-dom-injection, aria-injection, benign-aria-label, unrelated-account-action,
      task-aligned-summary-action).
- [x] Both decision invariants hold for every checkAction response in the suite.

## Comments

- Implemented 2026-09-21: `src/action/index.ts` (the action gate, architecture §5.1's decision
  procedure) wired into `checkAction`; `tests/gate.test.ts` (16 cases) and
  `tests/contract.test.ts` (the Checkpoint 1 gate: all seven scenarios, oracle-driven, scan-level
  **and** action-level expectations). 145 tests green via root `npm test`.
- Category postures are config data (`riskCategories.postures` + `unknownPosture`, architecture
  §5's "Default posture" column), never inline in the gate (FR-3.10). Alignment lowers a posture
  one step; `always_block` (destructive) has no alignment exception.
- Review-corrected: unknown categories now get account_change-level caution per architecture
  §5 note 2 (block unless explicitly task-aligned); alignment reads the action **type only** — the
  label is untrusted free text and must never authorise a high-risk action (regression test in
  gate.test.ts); the `weight >= 100` destructive keying and the stale stub header in `src/index.ts`
  are gone.
- Missing scan: risky posture + no scan → block; task-authorised + no scan → confirm; read-only →
  allow (FR-5.9, never converts missing context to allow).
- `triggeredByFindingIds` forces block only when the id matches a finding in the provided scan;
  a dangling id does not force block.
- `tests/contract.test.ts` also verifies all seven request files exist (FR-7.2) and writes
  `tests/results/observed-contract-results.json` (gitignored; the Phase 6 evaluation artifact).
- The gate's decision space is `allow`/`confirm`/`block` — `sanitize` is not emitted for actions
  (content sanitisation is the scan policy's job).

### Honest limitations (carry into the report)

- Alignment is deterministic keyword overlap on the action type (FR-5.2), not semantics: a
  paraphrased task (e.g. "summarise" vs "get") can read as unaligned — conservative direction.
- A task-aligned high-risk action with a scan is still lowered only one step (`block` →
  `confirm`), not allowed outright — intentional: task wording alone should not unblock
  account-changing actions.

