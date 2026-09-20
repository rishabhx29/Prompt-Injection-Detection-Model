# 03: Seven deterministic detectors with explained findings

**What to build:** Every malicious demo page produces at least one specific, human-explained
finding — with no dashboard required — naming the signal, evidence text, severity, and score
contribution. Benign pages do not.

**Blocked by:** 02 (validation + provenance-preserving normalisation).

**Status:** ready-for-agent

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

- [ ] Unit test per detector: positive and negative cases, including the benign imperative label.
- [ ] Every malicious sample yields ≥1 specific finding; every finding has a readable reason.
- [ ] Running the same request twice produces byte-identical output (determinism diff).
- [ ] Grep for a distinctive fixture phrase outside sample/fixture data finds no special-casing.
