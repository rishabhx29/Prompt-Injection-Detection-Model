#!/usr/bin/env node
/**
 * ctxvigil CLI (FR-6.1–FR-6.5; contract §10.1; architecture §4.3).
 *
 * Argument parsing and reporting only — no detection, scoring, or policy logic
 * lives here. Every answer comes from the `ctxvigil` SDK (FR-6.5 parity is
 * therefore structural, and covered by the parity test).
 *
 * Exit codes: 0 success · 1 the scan failed (unreadable/invalid input, core
 * error) · 2 usage error (bad flags or a missing `--input`).
 *
 * Machine-readable JSON is the default output (phase plan §8.1 task 5.3);
 * `--report` selects the compact readable report instead.
 */

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { createCtxVigil, CtxVigilError } from "ctxvigil";
import type { CheckActionResponse, ScanPageResponse } from "ctxvigil";

/** Capturable output — tests drive `main` in-process instead of spawning. */
export interface CliIO {
  stdout(text: string): void;
  stderr(text: string): void;
}

const USAGE = `ctxvigil — multi-view prompt-injection protection for LLM web agents

Usage:
  ctxvigil scan --input <file> [--task <string>] [--json] [--report] [--check-action <file>]
  ctxvigil --help

Flags (contract §10.1, plus --report from the phase plan):
  --input <file>         Path to a ScanPageRequest JSON file (or a page + userTask pair).
  --task <string>        Override the userTask in the input file.
  --json                 Print raw JSON (machine-readable; the default).
  --report               Print a compact readable report instead of JSON.
  --check-action <file>  Run checkAction with this CheckActionRequest after the scan.
  --help                 Show this text.`;

interface ParsedArgs {
  input: string | undefined;
  task: string | undefined;
  json: boolean;
  report: boolean;
  help: boolean;
  checkAction: string | undefined;
}

/** Parse argv; throws a `UsageError` for anything the contract doesn't name. */
class UsageError extends Error {}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    input: undefined,
    task: undefined,
    json: false,
    report: false,
    help: false,
    checkAction: undefined,
  };
  let commandSeen = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] as string;
    if (arg === "scan" && !commandSeen) {
      commandSeen = true;
      continue;
    }
    switch (arg) {
      case "--input":
        parsed.input = takeValue(argv, index, arg);
        index += 1;
        break;
      case "--task":
        parsed.task = takeValue(argv, index, arg);
        index += 1;
        break;
      case "--check-action":
        parsed.checkAction = takeValue(argv, index, arg);
        index += 1;
        break;
      case "--json":
        parsed.json = true;
        break;
      case "--report":
        parsed.report = true;
        break;
      case "--help":
        parsed.help = true;
        break;
      default:
        throw new UsageError(`Unknown flag "${arg}". Run "ctxvigil --help".`);
    }
  }

  if (!commandSeen && !parsed.help) {
    throw new UsageError('Missing command. Expected "scan". Run "ctxvigil --help".');
  }
  return parsed;
}

function takeValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new UsageError(`Flag "${flag}" needs a value.`);
  }
  return value;
}

/** Read and parse a JSON input file; every failure is a clear non-zero exit. */
async function readJsonInput(path: string, io: CliIO): Promise<unknown | undefined> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch {
    io.stderr(`Cannot read input file "${path}". Check the path exists and is readable.`);
    return undefined;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    io.stderr(`Input file "${path}" is not valid JSON.`);
    return undefined;
  }
}

/** Compact readable report (FR-6.2): decision, score, findings, content counts. */
function formatReport(scan: ScanPageResponse, action: CheckActionResponse | undefined): string[] {
  const lines: string[] = [
    `scanId: ${scan.scanId}`,
    `decision: ${scan.decision} (risk ${scan.riskScore}, ${scan.riskLevel})`,
    `summary: ${scan.summary}`,
  ];
  if (scan.findings.length > 0) {
    lines.push(`findings (${scan.findings.length}):`);
    for (const finding of scan.findings) {
      const location = finding.selector ?? finding.sourceKind;
      lines.push(
        `  - [${finding.severity}] ${finding.signals.join(", ")} — ${finding.view} (${location})`,
      );
      lines.push(`    ${finding.text}`);
    }
  }
  lines.push(
    `content: ${scan.safeContent.length} safe / ${scan.blockedContent.length} blocked ` +
      `(${scan.sanitizedContent.length} in agent context)`,
  );
  if (action !== undefined) {
    lines.push(
      `action: ${action.decision} (allowed=${action.allowed}, confirmationRequired=${action.confirmationRequired})`,
    );
    lines.push(`reason: ${action.reason}`);
  }
  return lines;
}

/** The CLI entry point. Returns the exit code instead of calling process.exit. */
export async function main(argv: string[], io: CliIO): Promise<number> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    if (error instanceof UsageError) {
      io.stderr(error.message);
      return 2;
    }
    throw error;
  }

  if (parsed.help) {
    io.stdout(USAGE);
    return 0;
  }
  if (parsed.input === undefined) {
    io.stderr('Missing required flag "--input". Run "ctxvigil --help".');
    return 2;
  }

  const input = await readJsonInput(parsed.input, io);
  if (input === undefined) return 1;

  // A page+userTask pair has no scanId; the CLI supplies a placeholder (contract §10.1).
  const request =
    typeof input === "object" && input !== null
      ? {
          scanId: (input as Record<string, unknown>)["scanId"] ?? "cli-scan",
          ...(input as Record<string, unknown>),
          ...(parsed.task === undefined ? {} : { userTask: parsed.task }),
        }
      : input;

  try {
    const guard = createCtxVigil();
    const scan = await guard.scanPage(request as never);

    let action: CheckActionResponse | undefined;
    if (parsed.checkAction !== undefined) {
      const actionRequest = await readJsonInput(parsed.checkAction, io);
      if (actionRequest === undefined) return 1;
      action = await guard.checkAction({ ...(actionRequest as object), scan } as never);
    }

    if (parsed.report && !parsed.json) {
      for (const line of formatReport(scan, action)) {
        io.stdout(line);
      }
    } else {
      io.stdout(JSON.stringify(action === undefined ? scan : { scan, action }, null, 2));
    }
    return 0;
  } catch (error) {
    if (error instanceof CtxVigilError) {
      io.stderr(`${error.code}: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

// Run when invoked directly, not when imported by tests.
const invokedDirectly =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  main(process.argv.slice(2), { stdout: console.log, stderr: console.error })
    .then((code) => {
      process.exit(code);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
