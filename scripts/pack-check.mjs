/**
 * `npm run pack-check` — the FR-1.5/AC-3 release check.
 *
 * Builds `dist/` for the SDK (plain `tsc` + the declaration-import fix), packs
 * `@ctxvigil/shared-types` and `ctxvigil`, installs both tarballs into a
 * throwaway project, and verifies there that:
 *
 * 1. the tarballs contain only the required build files (no node_modules, no
 *    tests, no evaluation data);
 * 2. the SDK imports and runs from plain compiled JavaScript — `createCtxVigil` /
 *    `scanPage` / `checkAction` produce the documented verdict for the
 *    aria-injection sample;
 * 3. the public types resolve and are assignable from the installed packages
 *    (the workspace's own `tsc` does the check, so no registry access is needed).
 */

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, "$1");
const TSC = join(ROOT, "node_modules", ".bin", "tsc.cmd");

function npm(args, cwd) {
  const result = spawnSync("npm", args, { cwd, shell: true, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(" ")} failed in ${cwd}:\n${result.stderr ?? result.stdout}`);
  }
  return result.stdout;
}

function fail(message) {
  console.error(`pack-check: ${message}`);
  process.exit(1);
}

const packDir = mkdtempSync(join(tmpdir(), "ctxvigil-pack-"));
const freshDir = mkdtempSync(join(tmpdir(), "ctxvigil-fresh-"));

/* Build the SDK first: the tarball ships compiled dist/, not sources. */
npm(["run", "build", "--workspace", "packages/ctxvigil-core"], ROOT);

try {
  /* 1. Pack both packages ------------------------------------------------- */
  // `npm pack --dry-run --json` reports the tarball contents (the check below
  // reads them); the real `npm pack` then produces the artifact.
  const sharedListing = npm(["pack", "--dry-run", "--json"], join(ROOT, "packages", "shared-types"));
  const coreListing = npm(["pack", "--dry-run", "--json"], join(ROOT, "packages", "ctxvigil-core"));

  for (const [name, listing] of [["shared-types", sharedListing], ["ctxvigil", coreListing]]) {
    const files = JSON.parse(listing)[0].files.map((entry) => entry.path);
    const leaked = files.filter((file) => /node_modules|^tests[\\/]|evaluation/u.test(file));
    if (leaked.length > 0) {
      fail(`${name} tarball leaks ${leaked.join(", ")}`);
    }
    // shared-types is types-only: src *is* its build output (no runtime, no bin).
    const required = name === "shared-types" ? ["src/index.ts"] : ["dist/index.js", "dist/index.d.ts"];
    for (const expected of required) {
      if (!files.includes(expected)) {
        fail(`${name} tarball is missing ${expected}: ${files.join(", ")}`);
      }
    }
    console.log(`   ${name}: ${files.length} files (${files.slice(0, 4).join(", ")}…)`);
  }
  console.log("1. tarballs contain only required build files ✓");

  npm(["pack", "--pack-destination", packDir], join(ROOT, "packages", "shared-types"));
  npm(["pack", "--pack-destination", packDir], join(ROOT, "packages", "ctxvigil-core"));

  /* 2. Fresh throwaway project --------------------------------------------- */
  writeFileSync(
    join(freshDir, "package.json"),
    JSON.stringify({ name: "pack-check-fresh", private: true, type: "module" }, null, 2) + "\n",
  );
  npm(
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      join(packDir, "ctxvigil-shared-types-0.1.0.tgz"),
      join(packDir, "ctxvigil-0.1.0.tgz"),
    ],
    freshDir,
  );
  console.log("2. tarballs installed in a fresh project ✓");

  /* 3. Runtime smoke: the exported functions produce the documented verdict - */
  copyFileSync(
    join(ROOT, "sample-data", "scan-requests", "aria-injection.json"),
    join(freshDir, "aria-injection.json"),
  );
  writeFileSync(
    join(freshDir, "smoke.mjs"),
    `import { createCtxVigil } from "ctxvigil";\n` +
      `import { readFileSync } from "node:fs";\n` +
      `const guard = createCtxVigil();\n` +
      `const scan = await guard.scanPage(JSON.parse(readFileSync("aria-injection.json", "utf8")));\n` +
      `const action = await guard.checkAction({ scanId: scan.scanId, userTask: "Find and summarize the refund policy.", proposedAction: { type: "change_account_email" }, scan });\n` +
      `if (scan.decision !== "block" || action.decision !== "block") process.exit(1);\n` +
      `console.log("runtime smoke:", scan.decision, scan.riskScore, "/", action.decision);\n`,
  );
  const smoke = spawnSync(process.execPath, ["smoke.mjs"], { cwd: freshDir, encoding: "utf8" });
  if (smoke.status !== 0) fail(`runtime smoke failed:\n${smoke.stderr}`);
  console.log(`3. ${smoke.stdout.trim()} ✓`);

  /* 4. Type resolution from the installed packages -------------------------- */
  writeFileSync(
    join(freshDir, "smoke-types.ts"),
    `import { createCtxVigil } from "ctxvigil";\n` +
      `import type { CtxVigilConfig, Decision, RiskLevel, ScanPageResponse } from "ctxvigil";\n` +
      `const guard = createCtxVigil({ thresholds: { low: 29 } } satisfies CtxVigilConfig);\n` +
      `const pending: Promise<ScanPageResponse> = guard.scanPage({ scanId: "s", userTask: "t", page: {} });\n` +
      `const decision: Decision = (await pending).decision;\n` +
      `const level: RiskLevel = (await pending).riskLevel;\n` +
      `void decision; void level;\n`,
  );
  writeFileSync(
    join(freshDir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        target: "ES2023",
        module: "NodeNext",
        moduleResolution: "NodeNext",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
      },
      include: ["smoke-types.ts"],
    }),
  );
  const typecheck = spawnSync(TSC, ["-p", "tsconfig.json"], {
    cwd: freshDir,
    encoding: "utf8",
    shell: true,
  });
  if (typecheck.status !== 0) {
    fail(`type resolution failed:\n${typecheck.stdout ?? ""}\n${typecheck.stderr ?? ""}`);
  }
  console.log("4. exported functions and types resolve in the fresh project ✓");

  console.log("pack-check passed");
} finally {
  rmSync(packDir, { recursive: true, force: true });
  rmSync(freshDir, { recursive: true, force: true });
}
