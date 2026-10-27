# 02: Validation + provenance-preserving normalisation

**What to build:** Messy multi-view input becomes source-tagged, deduplicated text segments — and
bad input is rejected with a helpful `INVALID_REQUEST` error. After this ticket, a response can say
*which view* suspicious text came from (visible, DOM, hidden DOM, ARIA, alt).

**Blocked by:** 01 (SDK skeleton with a walkable scan round-trip).

**Status:** done

Scope (Phase 1 of `docs/02_PHASE_PLAN_RISHABH.md` §4):

- Validate `scanId`, `userTask`, and page content fields; malformed/incomplete input returns
  `INVALID_REQUEST` (FR-2.1).
- All five content arrays are optional (default `[]`) and never treated as trusted instructions
  (FR-2.2).
- `accessibilityText` accepts bare strings *and* `{text, kind, selector}` items (FR-2.4).
- Normalisation pipeline: trim → drop empties → collapse whitespace → tag
  view/sourceKind/selector → deduplicate exact repeats. No semantic/fuzzy dedup in v1 (FR-2.3–2.5).
- Every segment preserves provenance: `view`, `sourceKind`, `selector`, original `text`;
  provenance tags: `visible`, `dom`, `hidden_dom`, `aria`, `alt` (and `ocr` reserved) (FR-2.6).

- [x] A request with missing `userTask` or malformed JSON returns `INVALID_REQUEST` with a helpful message.
- [x] Bare-string and object forms of `accessibilityText` both validate (S2 A3.2).
- [x] Overlapping visible/DOM text deduplicates to one segment; whitespace collapses.
- [x] Feeding the aria-injection sample request yields segments carrying
      `view: accessibility_tree` and `sourceKind: aria-label` (S2 A3.3 verification).
- [x] Normalisation is deterministic for identical input (NFR-1).

## Comments

- Implemented 2026-09-21: added `tests/validate.test.ts` and `tests/normalise.test.ts`;
  54 tests green via root `npm test`.
- Reconciled `docs/04_ARCHITECTURE.md` §6.2 with the implemented concealment-preferring
  primary-view rule and the implementation's `views` field; the rule matches frozen contract §2.2.
- Removed unused `channelsPresent()`; extracted shared `optionalString()` in validation.
- Remaining doc flag for the next joint checkpoint, not a code change: contract §7
  says `sourceKind` is "free-form but must use this vocabulary" (requires the §11 protocol).
- `validateCheckActionRequest` predates this ticket; its tests remain because ticket 05 needs them.
