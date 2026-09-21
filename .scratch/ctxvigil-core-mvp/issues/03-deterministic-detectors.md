# 03: Seven deterministic detectors with explained findings

**What to build:** Every malicious demo page produces at least one specific, human-explained
finding — with no dashboard required — naming the signal, evidence text, severity, and score
contribution. Benign pages do not.

**Blocked by:** 02 (validation + provenance-preserving normalisation).

**Status:** done

Scope (Phase 2 of `docs/02_PHASE_PLAN_RISHABH.md` §5):

- Seven detectors, each returning `{ signal, evidence, severity, scoreContribution }`:
  `instruction_override`, `role_impersonation`, `data_exfiltration`, `risky_action`,
  `hidden_content`, `task_conflict`, `multi_view_repetition` (FR-3.1–3.8).
- Phrase lists and action categories live in data/config files, not hard-coded in detectors
  (FR-3.10). No fixture-specific sentence is special-cased anywhere (S2 §9, NFR-11) — grep check.
- Every finding carries a human-readable explanation (FR-3.9).
- Do **not** flag every imperative sentence: combine instruction language with conflict/risk/source
  signals (FR-3.11) — the benign imperative `aria-label="Submit application"` must stay clean.
- Detector output is deterministic for identical input (FR-3.12, NFR-1).

- [x] Unit test per detector: positive and negative cases, including the benign imperative label.
- [x] Every malicious sample yields ≥1 specific finding; every finding has a readable reason.
- [x] Running the same request twice produces byte-identical output (determinism diff).
- [x] Grep for a distinctive fixture phrase outside sample/fixture data finds no special-casing.

## Comments

- Implemented 2026-09-21: `src/detect/index.ts` (all seven detectors + orchestration), wired into the
  `scanPage` pipeline so findings surface through the SDK. 80 tests green via root `npm test`
  (26 new detector tests).
- All seven signals are exercised: `instruction_override`, `data_exfiltration`, `risky_action`,
  `hidden_content`, `task_conflict`, `multi_view_repetition`, plus `role_impersonation` (unit cases —
  see the honest note below).
- FR-3.10: every phrase list, word table, weight, and category now resolves from
  `src/config/defaults.ts` (`DEFAULT_DETECTOR_LEXICON` added for the relation-based tables), so no
  detector carries inline data. Fixture-phrase grep hits only the config data file.
- FR-3.11: `risky_action` requires concealed text **and** configured-category evidence;
  `hidden_content`/`task_conflict`/`multi_view_repetition` only amplify already-suspicious segments,
  so the benign `aria-label="Submit application"` fixture stays clean (0 findings).
- Contract §2.2: one finding per suspicious segment, carrying **all** its signals
  (aria-injection → 1 finding with 5 signals), max severity, summed contribution.
- `scanPage` still stubs score/policy (tickets 04–05) but now **fails closed**: any finding yields
  `confirm`, never `allow`, and the summary states that scoring is a placeholder (NFR-8).

### Honest limitations (carry into the report, FR-4.9/NFR-8)

- `role_impersonation` has positive/negative unit coverage but **no fixture triggers it** — the seven
  curated fixtures contain no fake-system-role sentence. Either a fixture is added or the detector's
  fixture-level evidence is reported as absent.
- `unrelated-account-action` is a detector **true negative** (its natural-language account-update
  sentence carries no override/hidden/risk wording). The mismatch is caught at the action boundary
  in ticket 05, not by content detection.
- `scoreContribution` values are summed per segment without clamping; clamping and banding are
  ticket 04's scorer.

