/**
 * Post-build fix for declaration files (ticket 10).
 *
 * `rewriteRelativeImportExtensions` rewrites the emitted `.js` imports but leaves
 * relative `.ts` specifiers inside `.d.ts` output. This mechanical replacement
 * applies the same rewrite to declaration files — `./errors.ts` → `./errors.js` —
 * so a consumer's `tsc` resolves them without needing `allowImportingTsExtensions`.
 * Deterministic, content-preserving, verified by `npm run pack-check`.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, "$1");

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.endsWith(".d.ts")) continue;
    const before = readFileSync(full, "utf8");
    const after = before.replaceAll(/from "(\.{1,2}\/[^"]*?)\.ts"/gu, 'from "$1.js"');
    if (after !== before) {
      writeFileSync(full, after);
      console.log(`rewrote .ts specifiers in ${full}`);
    }
  }
}

walk(ROOT);
