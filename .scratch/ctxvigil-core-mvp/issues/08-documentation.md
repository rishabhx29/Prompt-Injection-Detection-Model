# 08: SDK / CLI / adapter documentation

**What to build:** A new developer can follow the package README end to end: direct SDK import, CLI
usage, and the optional HTTP adapter — with the decision rules, setup, and honest limitations
documented.

**Blocked by:** 06 (CLI), 07 (thin HTTP adapter) — so every documented path is verified real before
it is written down.

**Status:** done

Scope (Phase 5 §8.3 of `docs/02_PHASE_PLAN_RISHABH.md`):

- Package README with direct-import, CLI, and optional-HTTP-adapter examples (FR-6.11).
- Document decision rules, thresholds (as unvalidated development defaults), setup, and honest
  limitations (NFR-8).
- Keep the HTTP adapter clearly optional: library users never need a server (FR-1.6).

- [x] README examples for all three usage modes are copy-paste runnable.
- [x] Decision rules and band thresholds documented with the "development defaults" caveat.
- [x] Limitations section matches the PRD's stated limitations (no universal-detection claims).
- [x] A newcomer can scan a sample request following only the README.

## Comments

- Implemented 2026-09-21: `packages/ctxvigil-core/README.md` (the product entry point),
  `packages/ctxvigil-cli/README.md`, `apps/protection-api/README.md`, and the root README status
  table updated to reflect the implemented layer. 173 tests green.
- FR-6.11: the core README documents all three usage modes — direct import, CLI, and the
  **optional** HTTP adapter (kept explicitly optional per FR-1.6 — library users never need a
  server).
- Every documented example was executed before committing: the direct-import snippet (`block 100`,
  five signals, the action gate's block), the CLI's JSON/report/`--task`/`--check-action` forms, and
  the adapter's `health`/`scan-page`/`check-action` calls.
- Docs do not drift: `examples/readme-snippet.mjs` is a checked-in copy of the primary snippet, and
  `tests/readme.test.ts` runs it plus asserts the README still carries the development-defaults
  caveat, the honest-limitations section, and the "explicitly not claimed" statement (NFR-8).
- Limitations mirror PRD §9 and add the implementation-level ones recorded in tickets 03–07:
  untriggered `role_impersonation`, the `unrelated-account-action` detector true negative,
  keyword-only alignment, vocabulary-based damping, and the statelessness/version caveats of the
  adapter.

