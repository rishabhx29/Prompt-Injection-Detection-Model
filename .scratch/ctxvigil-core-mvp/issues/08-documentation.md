# 08: SDK / CLI / adapter documentation

**What to build:** A new developer can follow the package README end to end: direct SDK import, CLI
usage, and the optional HTTP adapter — with the decision rules, setup, and honest limitations
documented.

**Blocked by:** 06 (CLI), 07 (thin HTTP adapter) — so every documented path is verified real before
it is written down.

**Status:** ready-for-agent

Scope (Phase 5 §8.3 of `docs/02_PHASE_PLAN_RISHABH.md`):

- Package README with direct-import, CLI, and optional-HTTP-adapter examples (FR-6.11).
- Document decision rules, thresholds (as unvalidated development defaults), setup, and honest
  limitations (NFR-8).
- Keep the HTTP adapter clearly optional: library users never need a server (FR-1.6).

- [ ] README examples for all three usage modes are copy-paste runnable.
- [ ] Decision rules and band thresholds documented with the "development defaults" caveat.
- [ ] Limitations section matches the PRD's stated limitations (no universal-detection claims).
- [ ] A newcomer can scan a sample request following only the README.
