# 07: Thin HTTP adapter

**What to build:** The same core logic reachable over HTTP: `GET /health`, `POST /scan-page`,
`POST /check-action` — with **zero** detection or scoring logic in the adapter. Saumya's dashboard
can integrate against this without waiting.

**Blocked by:** 05 (action gate + seven contract tests green). Independent of 06 (CLI); either can
land first.

**Status:** ready-for-agent

Scope (Phase 5 §8.2 of `docs/02_PHASE_PLAN_RISHABH.md`):

- New `protection-api` app exposing the three endpoints (FR-6.6); it imports `ctxvigil-core` and
  adds no rules (FR-6.7).
- `400` + machine-readable error body for malformed input; `500` only for unexpected errors;
  `404` for unknown routes (FR-6.8).
- CORS enabled only for the demo web origin (default `http://localhost:5173`) (FR-6.9).
- Starts locally with one documented command (FR-6.10); no API key / `.env` required for the MVP
  (FR-6.4, NFR-2).

- [ ] `/health` responds; `/scan-page` and `/check-action` return contract-shaped JSON identical
      (same decision) to the direct import for the same request body.
- [ ] Malformed body → 400 with machine-readable error; unknown route → 404.
- [ ] Rule-leak check: no phrase lists or scoring logic appear in the adapter source.
- [ ] One command starts the server; CORS allows only the demo origin.
