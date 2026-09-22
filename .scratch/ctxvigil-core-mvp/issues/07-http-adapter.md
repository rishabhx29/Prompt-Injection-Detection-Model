# 07: Thin HTTP adapter

**What to build:** The same core logic reachable over HTTP: `GET /health`, `POST /scan-page`,
`POST /check-action` — with **zero** detection or scoring logic in the adapter. Saumya's dashboard
can integrate against this without waiting.

**Blocked by:** 05 (action gate + seven contract tests green). Independent of 06 (CLI); either can
land first.

**Status:** done

Scope (Phase 5 §8.2 of `docs/02_PHASE_PLAN_RISHABH.md`):

- New `protection-api` app exposing the three endpoints (FR-6.6); it imports `ctxvigil-core` and
  adds no rules (FR-6.7).
- `400` + machine-readable error body for malformed input; `500` only for unexpected errors;
  `404` for unknown routes (FR-6.8).
- CORS enabled only for the demo web origin (default `http://localhost:5173`) (FR-6.9).
- Starts locally with one documented command (FR-6.10); no API key / `.env` required for the MVP
  (FR-6.4, NFR-2).

- [x] `/health` responds; `/scan-page` and `/check-action` return contract-shaped JSON identical
      (same decision) to the direct import for the same request body.
- [x] Malformed body → 400 with machine-readable error; unknown route → 404.
- [x] Rule-leak check: no phrase lists or scoring logic appear in the adapter source.
- [x] One command starts the server; CORS allows only the demo origin.

## Comments

- Implemented 2026-09-21: `apps/protection-api` (`src/index.ts` adapter, `src/start.ts` one-command
  start, `tests/api.test.ts` — 16 cases). Root `test` script extended. 171 tests green.
- Zero-dependency `node:http` transport (FR-6.6, §1); no detector data, weights, thresholds, or
  bands anywhere in `apps/` (grep-verified, FR-6.7); no API key or `.env` (FR-6.4, NFR-2).
- Statuses per FR-6.8: 200 valid; `CtxVigilError` → mapped status + `toResponse()` (400
  INVALID_REQUEST with `field`); unparseable **or oversized** (>1 MiB) body → 400; unknown
  route/method → 404 NOT_FOUND; any non-SDK throw → generic 500 INTERNAL_ERROR with no message,
  no stack (proved by an injected-failing-guard test).
- CORS (FR-6.9): echoes only the demo origin (`http://localhost:5173`), never `*`, with
  `Allow-Methods`/`Allow-Headers` so a browser JSON POST survives preflight; overridable via
  option or `CTXVIGIL_ALLOWED_ORIGIN`.
- Parity (FR-6.5): `deepEqual` against the direct SDK import for both endpoints, not just the
  decision.
- `/health` version is read from this package's `package.json`, so it cannot drift from the
  artifact (contract §1.1).
- **Documented extension to §3.1** (see the module header): the HTTP `check-action` body is exactly
  the frozen contract shape, and the adapter *additionally* accepts an optional `scan` object so the
  finding-triggered block (FR-5.5) is reachable over HTTP, per contract §10 point 3. §3.1-only
  bodies remain fully supported and never produce `allow` for a risky action (FR-5.9) — both shapes
  are tested. Flagged for Saumya's awareness at Checkpoint 2.
- `apps/protection-api/package.json` carries its own name/version; unifying versions across the
  publishable packages is ticket 10's job.

