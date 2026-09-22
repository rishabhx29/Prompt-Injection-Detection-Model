# 10: Packaging + release readiness (global DoD)

**What to build:** The core package is release-ready: the `npm pack` tarball installs and works in a
fresh throwaway project, docs/metadata are stable, and the whole AC-1…AC-12 acceptance checklist is
reproducible on a clean checkout.

**Blocked by:** 08 (documentation), 09 (evaluation + adversarial hardening).

**Status:** closed (completed)

Scope (Phase 6 §9.3 of `docs/02_PHASE_PLAN_RISHABH.md`):

- Stable package name, version, licence, README, and changelog (FR-1.5, FR-1.4).
- `npm pack` produces an installable package containing only required build files (FR-1.5).
- Install the tarball into a fresh throwaway project and verify exported functions **and types**
  work (FR-1.5, NFR-6).
- Keep the package workspace-scoped locally; publish publicly only when the team explicitly
  decides — never claim public installability before then (NFR-8).
- Core SDK imports and works without running a server (FR-1.6, NFR-12).

- [x] `npm pack` tarball installs in a fresh project; `createCtxVigil` and types resolve there.
- [x] AC-1…AC-12 checklist from `docs/02_PHASE_PLAN_RISHABH.md` §13 all pass on a clean checkout.
- [x] Full `npm test` suite green; CLI `--help` works; `/health` responds.
- [x] Changelog written; no claim of public npm installability anywhere in docs.
