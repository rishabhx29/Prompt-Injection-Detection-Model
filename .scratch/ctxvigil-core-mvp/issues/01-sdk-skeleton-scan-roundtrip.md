# 01: SDK skeleton with a walkable scan round-trip

**What to build:** A developer can install/import the `ctxvigil-core` SDK in a tiny Node script,
hand it one of the frozen contract scan requests, and get back a contract-shaped response — even
though detection is still a stub. This is the skeleton every later slice walks through.

**Blocked by:** None (can start immediately).

**Status:** done

Scope notes (from Phase 0 remainder of `docs/02_PHASE_PLAN_RISHABH.md` §3 — the doc/sample tasks of
Phase 0 are already done):

- Initialise `ctxvigil-core` as the primary TypeScript package and `shared-types` as the
  joint contract-types package, in the workspace, with a minimal test runner.
- Export `createCtxVigil`, `scanPage`, `checkAction` and the public types from the core entrypoint.
- `scanPage` accepts a contract request (per `docs/03_API_CONTRACT.md`) and returns a
  contract-shaped stub response; `checkAction` is exported as a stub with the same rule.
- Package metadata is publish-ready from day one: name, version, `exports`, `types`, `files`,
  licence, repository placeholder (FR-1.4).

- [x] A one-line Node script can `require`/import the core package and call `createCtxVigil`.
- [x] Feeding a `sample-data/scan-requests/*.json` file to `scanPage` returns JSON whose field
      names match `docs/03_API_CONTRACT.md` exactly (values may be stubs).
- [x] The test runner runs at least one smoke test proving the round-trip.
- [x] `package.json` carries all publishability fields listed above.

## Comments

- Implemented 2026-09-21. `src/index.ts` exports `createCtxVigil`/`scanPage`/`checkAction`,
  re-exports the contract types, and walks the real validation + normalisation stages; detection,
  scoring, and policy are stubs (tickets 03–05). `checkAction` fails **closed** with `confirm`.
- `checkAction` takes `CheckActionInput = CheckActionRequest & { scan? }` per contract §10
  point 3; the stub ignores `scan` (ticket 05's gate consumes it).
- Test scripts switched to `node --test "<glob>"` — the bare-directory form does not discover
  `.ts` test files under Node's native type-stripping.
- No `tsc` typecheck in this phase by design: the core `package.json` `//publish` note defers
  adding the TypeScript devDependency (and the `dist` switch) to Phase 6.
- `test:contract` scripts still point at the contract harness that ticket 05 creates.
- 13 tests green via `npm test` at the repo root.
