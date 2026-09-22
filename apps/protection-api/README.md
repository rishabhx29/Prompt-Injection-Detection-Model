# protection-api (optional)

A thin HTTP transport over the [`ctxvigil`](../../packages/ctxvigil-core/README.md) SDK, so the
demo dashboard can integrate without importing the package. **It is optional**: library users never
need a server (FR-1.6).

It contains **zero** detection or scoring logic (FR-6.7). It parses HTTP, calls the SDK, and maps
SDK errors onto statuses.

## Start

```bash
npm start --workspace apps/protection-api        # → http://localhost:8787
```

No API key, no `.env`, no flags (FR-6.10, FR-6.4). `PORT` and `CTXVIGIL_ALLOWED_ORIGIN` may
override the defaults (`8787`, `http://localhost:5173`).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness probe. Non-200, a timeout, or a connection failure means **unavailable** — never "safe". |
| `POST` | `/scan-page` | Scan content before the simulated agent reads it. |
| `POST` | `/check-action` | Validate a proposed action before it executes. |

```bash
curl http://localhost:8787/health
# {"status":"ok","service":"ctxvigil-protection-api","version":"0.1.0"}

curl -X POST http://localhost:8787/scan-page \
  -H "Content-Type: application/json" \
  --data-binary @sample-data/scan-requests/aria-injection.json

curl -X POST http://localhost:8787/check-action \
  -H "Content-Type: application/json" \
  --data-binary @sample-data/action-checks/unrelated-account-action-change-email.json
```

## Statuses

| Status | Code | Meaning |
|---|---|---|
| `200` | — | The SDK's answer. |
| `400` | `INVALID_REQUEST` | The request is wrong (bad JSON, oversized body, missing field). The `error.field` says which. |
| `404` | `NOT_FOUND` | Unknown route or method. |
| `500` | `INTERNAL_ERROR` | The layer failed. Generic message only, no internals. Treat the page as unavailable. |

## CORS

Answers **only** the demo web origin (`http://localhost:5173` by default), never `*`, including the
preflight response (`Allow-Methods: GET, POST, OPTIONS`; `Allow-Headers: Content-Type`).

## Request bodies

`scan-page` takes contract §2.1 exactly. `check-action` takes contract §3.1 exactly
(`scanId`, `userTask`, `proposedAction`) and **additionally accepts an optional `scan` object** —
the prior `/scan-page` response, which enables the finding-triggered block (FR-5.5). Omitting it is
fully supported and never yields `allow` for a risky action (FR-5.9).

```bash
npm test --workspace apps/protection-api
```
