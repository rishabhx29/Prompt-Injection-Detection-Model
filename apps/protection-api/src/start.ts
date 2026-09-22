/**
 * One-command local start (FR-6.10): `node apps/protection-api/src/start.ts`.
 *
 * No API key, no `.env`, no flags (FR-6.4, NFR-2). `PORT` and
 * `CTXVIGIL_ALLOWED_ORIGIN` may override the contract defaults when the
 * surrounding tooling needs a different port or origin.
 */

import { createApp, DEFAULT_ALLOWED_ORIGIN, DEFAULT_PORT } from "./index.ts";

const port = Number(process.env["PORT"] ?? DEFAULT_PORT);
const server = createApp();

server.listen(Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT, () => {
  console.log(
    `ctxvigil-protection-api listening on http://localhost:${port} ` +
      `(demo origin ${process.env["CTXVIGIL_ALLOWED_ORIGIN"] ?? DEFAULT_ALLOWED_ORIGIN})`,
  );
});
