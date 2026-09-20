# Changelog

All notable changes to the CtxVigil contract and SDK are recorded here.
Field-name, enum, or HTTP-status changes are **breaking** and follow
`docs/03_API_CONTRACT.md` §11.

## [Unreleased] — Phase 0: repository and specification

### Added

- **Documentation set** (`docs/`): source extraction, PRD, phase plan, API contract, architecture,
  integration/handoff, evaluation plan, demo script.
- **Frozen API contract** (`docs/03_API_CONTRACT.md`): `GET /health`, `POST /scan-page`,
  `POST /check-action`; four decisions (`allow`, `sanitize`, `confirm`, `block`) and no others.
- **Fixture contract** (`fixtures/CONTRACT.md`): the scenario schema Saumya implements, decoupling
  the fixture/dashboard work from the SDK work.
- **Sample data** (`sample-data/`): 7 scan requests, 4 action checks, 2 reference responses, and
  `EXPECTATIONS.json` — the normative test oracle mapping test ID → expected decision.
- **Workspace skeleton**: root `package.json` with npm workspaces, `tsconfig.base.json`,
  `packages/shared-types`, `packages/ctxvigil-core`.

### Notes

- Phase 0 runs **dependency-free**: package manifests are versioned from the outset, but the shared
  types, core package, and tests use only the Node.js runtime (Node ≥ 22.18 for native TypeScript
  type stripping). This satisfies the offline requirement (NFR-2) and avoids a network dependency
  during early development.
- `npm pack` / `npm publish` readiness is **Phase 6** work: publication needs a compiled `dist/`
  output and a TypeScript devDependency, and the package's `main`/`exports` must be switched from
  source to build output before any tarball is produced. No claim of public installability is made
  until that task is complete (NFR-8).
