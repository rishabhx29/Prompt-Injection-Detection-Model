/**
 * Local `.env` loader (zero-dependency).
 *
 * Node 22+ exposes real `process.env` for actual environment variables; this
 * module only fills in keys that are missing from a repo-root `.env` file
 * (already gitignored). No key is ever logged.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..", "..");
const ENV_FILE = path.join(REPO_ROOT, ".env");

function parseEnvFile(content: string): Map<string, string> {
  const parsed = new Map<string, string>();
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key !== "") parsed.set(key, value);
  }
  return parsed;
}

/** Populate `process.env` from the repo-root `.env` without overriding real env vars. */
export function loadEnvFile(filePath: string = ENV_FILE): void {
  if (!existsSync(filePath)) return;
  const parsed = parseEnvFile(readFileSync(filePath, "utf8"));
  for (const [key, value] of parsed) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/** Read one config value, throwing an actionable error when it is missing. */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `Missing ${key}. Put it in a repo-root .env file (gitignored) or export it in your shell:\n` +
        `  ${key}=... `,
    );
  }
  return value.trim();
}
