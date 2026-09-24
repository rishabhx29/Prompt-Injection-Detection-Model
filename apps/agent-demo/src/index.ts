#!/usr/bin/env node
/**
 * CtxVigil agent demo — `npm run agent:demo`.
 *
 * The demo the whole project is a prototype of: a web agent goes to a page on
 * localhost, reads it, and the protection layer decides what the agent is allowed to
 * read and to do. The layer is `ctxvigil` itself, called in-process; the agent is a
 * local scripted reader (no LLM, no API key, no external network — NFR-8, S2 B3.7).
 *
 * ```text
 * npm run agent:demo                      # every fixture page (HTTP, needs demo:web)
 * npm run agent:demo -- --url <url>       # one URL
 * npm run agent:demo -- --file <path>     # one page from disk, no server needed
 * npm run agent:demo -- --json            # machine-readable, no narration
 * ```
 *
 * Exit codes: 0 all assertions satisfied · 1 a page's engine verdict did not match the
 * verdict that page declares · 2 usage or I/O error.
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runAgentEpisode, type AgentRunResult } from "./agent.ts";

/* -------------------------------------------------------------------------- */
/* Paths                                                                      */
/* -------------------------------------------------------------------------- */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..", "..", "..");
const FIXTURE_DIR = path.join(REPO_ROOT, "apps", "demo-web", "public", "fixtures");
const DEFAULT_BASE_URL = "http://localhost:5173/fixtures";
const DEFAULT_OUT = path.join(REPO_ROOT, "apps", "demo-web", "public", "agent-runs", "latest.json");

/** The page that is a directory listing, not an episode. */
const NON_EPISODE_PAGES = new Set(["index.html"]);

/* -------------------------------------------------------------------------- */
/* Terminal palette                                                           */
/* -------------------------------------------------------------------------- */

const USE_COLOR =
  process.stdout.isTTY === true &&
  process.env["NO_COLOR"] === undefined &&
  !process.argv.includes("--no-color");

const paint = (code: string) => (text: string) => (USE_COLOR ? `\u001b[${code}m${text}\u001b[0m` : text);
const dim = paint("2");
const bold = paint("1");
const red = paint("31");
const green = paint("32");
const yellow = paint("33");
const cyan = paint("36");
const magenta = paint("35");

const GLYPH = { ok: green("✔"), warn: yellow("▲"), blocked: red("✖") } as const;

/* -------------------------------------------------------------------------- */
/* Argument parsing                                                           */
/* -------------------------------------------------------------------------- */

export interface CliOptions {
  url?: string;
  file?: string;
  all: boolean;
  baseUrl: string;
  fixtureDir: string;
  userTask?: string;
  json: boolean;
  out: string;
  attributeToFindings: boolean;
  help: boolean;
}

class UsageError extends Error {}

function takeValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new UsageError(`Flag "${flag}" needs a value.`);
  }
  return value;
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    all: false,
    baseUrl: DEFAULT_BASE_URL,
    fixtureDir: FIXTURE_DIR,
    json: false,
    out: DEFAULT_OUT,
    attributeToFindings: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] as string;
    switch (arg) {
      case "--url":
        options.url = takeValue(argv, index, arg);
        index += 1;
        break;
      case "--file":
        options.file = takeValue(argv, index, arg);
        index += 1;
        break;
      case "--base-url":
        options.baseUrl = takeValue(argv, index, arg).replace(/\/+$/u, "");
        index += 1;
        break;
      case "--fixture-dir":
        options.fixtureDir = path.resolve(takeValue(argv, index, arg));
        index += 1;
        break;
      case "--task":
        options.userTask = takeValue(argv, index, arg);
        index += 1;
        break;
      case "--out":
        options.out = path.resolve(takeValue(argv, index, arg));
        index += 1;
        break;
      case "--all":
        options.all = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "--no-color":
        break;
      case "--attribute-findings":
        options.attributeToFindings = true;
        break;
      case "--help":
        options.help = true;
        break;
      default:
        throw new UsageError(`Unknown flag "${arg}". Run "npm run agent:demo -- --help".`);
    }
  }

  if (!options.help && options.url === undefined && options.file === undefined && !options.all) {
    options.all = true;
  }
  if (options.url !== undefined && options.file !== undefined) {
    throw new UsageError('Use either "--url" or "--file", not both.');
  }
  return options;
}


const USAGE = `${bold("CtxVigil agent demo")} — a local web agent guarded by the ctxvigil layer

Usage:
  npm run agent:demo                       Run every fixture page (${dim("apps/demo-web/public/fixtures")})
  npm run agent:demo -- --url <url>        Run one page over HTTP
  npm run agent:demo -- --file <path>      Run one page from disk (no server needed)
  npm run agent:demo -- --help

Flags:
  --url <url>            Fetch one page over HTTP, e.g. ${dim("http://localhost:5173/fixtures/aria-injection.html")}
  --file <path>          Read one page from disk instead of the network
  --all                  Run every fixture page (the default when no target is given)
  --base-url <url>       Base URL for --all (default ${DEFAULT_BASE_URL})
  --fixture-dir <path>   Directory used by --all and by the disk fallback
  --task <string>        Override the user task declared by the page
  --attribute-findings   Attribute the proposed action to the scan findings (FR-5.5)
  --out <path>           Where to write the run record (default ${dim("apps/demo-web/public/agent-runs/latest.json")})
  --json                 Print the run record instead of the narrated view
  --no-color             Plain text (also honours NO_COLOR)

The agent is a ${bold("local scripted agent")}: no LLM, no API key, and no network call
beyond localhost. Its task and its proposed action come from the fixture page's own
ctxvigil:* meta tags, so every episode is deterministic and reproducible offline.`;

/* -------------------------------------------------------------------------- */
/* Fetching and reading                                                       */
/* -------------------------------------------------------------------------- */

interface LoadedPage {
  url: string;
  html: string;
  status: number;
  bytes: number;
  elapsedMs: number;
  transport: "http" | "disk";
}

/** Fetch one page over HTTP from the local fixture host. */
async function fetchPage(url: string): Promise<LoadedPage> {
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "text/html" } });
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new UsageError(
      `Could not reach ${url} (${cause}).\n` +
        `Start the fixture host with "npm run demo:web" (Vite serves apps/demo-web/public at /), ` +
        `or use "--file <path>" to read a page from disk.`,
    );
  }
  const html = await response.text();
  return {
    url,
    html,
    status: response.status,
    bytes: Buffer.byteLength(html, "utf8"),
    elapsedMs: Date.now() - started,
    transport: "http",
  };
}

/** Read one page from disk, reported with the same shape as an HTTP fetch. */
async function readPageFile(filePath: string, url: string): Promise<LoadedPage> {
  const started = Date.now();
  try {
    const html = await readFile(filePath, "utf8");
    return {
      url,
      html,
      status: 200,
      bytes: Buffer.byteLength(html, "utf8"),
      elapsedMs: Date.now() - started,
      transport: "disk",
    };
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new UsageError(`Could not read ${filePath} (${cause}).`);
  }
}

/** Every fixture page, in a stable order (index.html is the listing, not an episode). */
async function listFixturePages(fixtureDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(fixtureDir);
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new UsageError(`Could not list ${fixtureDir} (${cause}).`);
  }
  return entries.filter((name) => name.endsWith(".html") && !NON_EPISODE_PAGES.has(name)).sort();
}


/* -------------------------------------------------------------------------- */
/* Narration                                                                  */
/* -------------------------------------------------------------------------- */

const DECISION_PAINT: Record<string, (text: string) => string> = {
  allow: green,
  sanitize: yellow,
  confirm: yellow,
  block: red,
};

/** How many approved segments to list before summarising the rest. */
const APPROVED_PREVIEW_LIMIT = 6;

function rule(label: string): string {
  const inner = ` ${label} `;
  const width = Math.max(0, 74 - inner.length);
  return dim("─".repeat(3)) + bold(inner) + dim("─".repeat(width));
}

function renderRun(run: AgentRunResult, index: number, total: number): string[] {
  const lines: string[] = [];
  let shown = 0;
  const title = run.scenarioTitle ?? run.scenarioId ?? run.url;
  lines.push("");
  lines.push(rule(`${cyan(`${index + 1}/${total}`)} ${title}`));
  lines.push(`  ${dim("page  ")} ${run.url} ${dim(`(${run.fetch.transport}, ${run.fetch.bytes} bytes, ${run.fetch.elapsedMs} ms)`)}`);
  lines.push(`  ${dim("task  ")} "${run.userTask}"`);
  lines.push(
    `  ${dim("agent ")} local scripted agent ${dim("(no LLM, no API key, offline)")} · plan declared by the page`,
  );

  for (const step of run.steps) {
    lines.push(`  ${GLYPH[step.status]} ${bold(step.title)}`);
    lines.push(`      ${dim(step.detail)}`);
    if (step.id === "scan" && run.scan.findings.length > 0) {
      for (const finding of run.scan.findings) {
        const where = `${finding.view}${finding.selector === undefined ? "" : ` ${finding.selector}`}`;
        lines.push(
          `      ${magenta("↳")} ${where} ${dim(`+${finding.scoreContribution}`)} ${dim(`[${finding.signals.join(", ")}]`)}`,
        );
        lines.push(`        ${dim(`"${finding.text.length > 120 ? `${finding.text.slice(0, 119)}…` : finding.text}"`)}`);
      }
    }
    if (step.id === "quarantine" && run.agentContext.withheld.length > 0) {
      lines.push(`      ${dim("withheld from the agent:")}`);
      for (const text of run.agentContext.withheld) {
        lines.push(`        ${red(`"${text.length > 110 ? `${text.slice(0, 109)}…` : text}"`)}`);
      }
      lines.push(`      ${dim("what the agent read instead (placeholders replace the attack):")}`);
      for (const text of run.agentContext.sanitized) {
        const safe = run.scan.safeContent.some((item) => item.text === text);
        if (!safe) {
          lines.push(`        ${cyan(`"${text}"`)}`);
          continue;
        }
        if (shown < APPROVED_PREVIEW_LIMIT) {
          shown += 1;
          lines.push(`        ${dim(`"${text.length > 96 ? `${text.slice(0, 95)}…` : text}"`)}`);
        }
      }
      const hidden = run.agentContext.approvedSegments - Math.min(shown, APPROVED_PREVIEW_LIMIT);
      if (hidden > 0) {
        lines.push(`        ${dim(`… plus ${hidden} more approved segment(s)`)}`);
      }
    }
  }
  return lines;
}

/** The one-line-per-scenario table that closes the run. */
function renderSummary(runs: AgentRunResult[], transport: string, outPath: string): string[] {
  const lines: string[] = [];
  lines.push("");
  lines.push(rule("Summary"));
  const nameWidth = Math.max(26, ...runs.map((run) => (run.scenarioId ?? run.url).length)) + 2;
  lines.push(
    `  ${bold("scenario".padEnd(nameWidth))}${bold("scan".padEnd(24))}${bold("gate".padEnd(11))}${bold("assertion")}`,
  );
  for (const run of runs) {
    const decisionPlain = `${run.scan.decision} (${run.scan.riskLevel}) ${run.scan.riskScore}`.padEnd(24);
    const gatePlain = (run.assertion.gateDecision ?? "-").toUpperCase().padEnd(11);
    const verdict =
      run.assertion.matched === null
        ? yellow("no assertion")
        : run.assertion.matched
          ? green("PASS")
          : red(`FAIL (declared ${run.assertion.expectedDecision})`);
    lines.push(
      `  ${(run.scenarioId ?? run.url).padEnd(nameWidth)}` +
        `${(DECISION_PAINT[run.scan.decision] ?? dim)(decisionPlain)}` +
        `${(DECISION_PAINT[run.assertion.gateDecision ?? ""] ?? dim)(gatePlain)}` +
        verdict,
    );
  }

  const matched = runs.filter((run) => run.assertion.matched === true).length;
  const failed = runs.filter((run) => run.assertion.matched === false).length;
  const blocked = runs.filter((run) => run.scan.decision === "block").length;
  const allowed = runs.filter((run) => run.scan.decision === "allow").length;

  lines.push("");
  lines.push(
    `  ${bold("episodes")} ${runs.length} · ${green("blocked")} ${blocked} · ${yellow("escalated")} ${runs.length - blocked - allowed} · ${green("allowed")} ${allowed}`,
  );
  lines.push(`  ${bold("assertions")} ${matched} matched · ${failed} mismatched ${dim(`(checked against each page's ctxvigil:expected-decision)`)}`);
  lines.push(`  ${bold("transport")} ${transport}`);
  lines.push(`  ${bold("record")}    ${outPath} ${dim("→ shown by the dashboard's Agent Console panel")}`);
  lines.push("");
  return lines;
}


/* -------------------------------------------------------------------------- */
/* Run record (the dashboard's Agent Console panel reads this file)            */
/* -------------------------------------------------------------------------- */

export interface AgentRunRecord {
  schemaVersion: 1;
  generatedAt: string;
  agent: { kind: "scripted-local"; isLlm: false; note: string };
  engine: { package: "ctxvigil"; mode: "sdk-in-process" };
  transport: "http" | "disk";
  baseUrl: string;
  runs: AgentRunResult[];
  summary: {
    episodes: number;
    matched: number;
    mismatched: number;
    unasserted: number;
    blocked: number;
    escalated: number;
    allowed: number;
    withheldSegments: number;
  };
}

function buildRecord(
  runs: AgentRunResult[],
  transport: "http" | "disk",
  baseUrl: string,
  now: Date,
): AgentRunRecord {
  const blocked = runs.filter((run) => run.scan.decision === "block").length;
  const allowed = runs.filter((run) => run.scan.decision === "allow").length;
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    agent: {
      kind: "scripted-local",
      isLlm: false,
      note:
        "Local scripted agent: deterministic, offline, no API key. Its task and proposed " +
        "action are declared by each fixture page, and every verdict comes from the ctxvigil SDK.",
    },
    engine: { package: "ctxvigil", mode: "sdk-in-process" },
    transport,
    baseUrl,
    runs,
    summary: {
      episodes: runs.length,
      matched: runs.filter((run) => run.assertion.matched === true).length,
      mismatched: runs.filter((run) => run.assertion.matched === false).length,
      unasserted: runs.filter((run) => run.assertion.matched === null).length,
      blocked,
      escalated: runs.length - blocked - allowed,
      allowed,
      withheldSegments: runs.reduce((total, run) => total + run.agentContext.withheldSegments, 0),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

/** Load the SDK from its built `dist/`, with an actionable message when absent. */
async function loadGuard(): Promise<import("ctxvigil").CtxVigil> {
  try {
    const sdk = await import("ctxvigil");
    return sdk.createCtxVigil();
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new UsageError(
      `Could not load the ctxvigil SDK (${cause}).\n` +
        `Build it first: npm run build --workspace packages/ctxvigil-core`,
    );
  }
}


export async function main(argv: string[], io: { out(text: string): void }): Promise<number> {
  const options = parseArgs(argv);

  if (options.help) {
    io.out(USAGE);
    return 0;
  }

  const guard = await loadGuard();
  const targets: Array<{ url: string; page: LoadedPage }> = [];

  if (options.file !== undefined) {
    const filePath = path.resolve(options.file);
    const url = `file://${filePath.replace(/\\/gu, "/")}`;
    targets.push({ url, page: await readPageFile(filePath, url) });
  } else if (options.url !== undefined) {
    targets.push({ url: options.url, page: await fetchPage(options.url) });
  } else {
    const pages = await listFixturePages(options.fixtureDir);
    if (pages.length === 0) {
      throw new UsageError(`No .html fixture pages found in ${options.fixtureDir}.`);
    }
    let fixtureHostDown = false;
    for (const page of pages) {
      const url = `${options.baseUrl}/${page}`;
      if (fixtureHostDown) {
        targets.push({ url, page: await readPageFile(path.join(options.fixtureDir, page), url) });
        continue;
      }
      try {
        targets.push({ url, page: await fetchPage(url) });
      } catch {
        // The fixture host is not running: fall back to disk once, with a clear note.
        fixtureHostDown = true;
        io.out(
          `${yellow("▲")} ${bold("Fixture host not reachable")} — reading the same pages from disk instead.`,
        );
        io.out(`  ${dim("Start it with: npm run demo:web  (then re-run for the HTTP path)")}`);
        io.out("");
        targets.push({ url, page: await readPageFile(path.join(options.fixtureDir, page), url) });
      }
    }
  }

  const runs: AgentRunResult[] = [];
  for (const target of targets) {
    runs.push(
      await runAgentEpisode({
        url: target.url,
        html: target.page.html,
        fetchInfo: {
          status: target.page.status,
          bytes: target.page.bytes,
          elapsedMs: target.page.elapsedMs,
          transport: target.page.transport,
        },
        guard,
        ...(options.userTask === undefined ? {} : { userTask: options.userTask }),
        ...(options.attributeToFindings ? { attributeToFindings: true } : {}),
      }),
    );
  }

  const transport: "http" | "disk" = targets.every((target) => target.page.transport === "disk")
    ? "disk"
    : "http";
  const record = buildRecord(runs, transport, options.baseUrl, new Date());

  await mkdir(path.dirname(options.out), { recursive: true });
  await writeFile(options.out, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  if (options.json) {
    io.out(JSON.stringify(record, null, 2));
  } else {
    io.out(`${bold("CtxVigil agent demo")} ${dim("· the layer wraps the agent, not the other way round")}`);
    io.out(
      `${dim("guard")} ctxvigil SDK, in-process ${dim("·")} ${dim("agent")} local scripted reader ` +
        `${dim("·")} ${dim("transport")} ${transport}`,
    );
    runs.forEach((run, index) => {
      io.out(renderRun(run, index, runs.length).join("\n"));
    });
    io.out(renderSummary(runs, transport, path.relative(REPO_ROOT, options.out)).join("\n"));
  }

  return record.summary.mismatched > 0 ? 1 : 0;
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

const isDirectRun =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main(process.argv.slice(2), { out: (text) => console.log(text) })
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${red("✖")} ${message}`);
      process.exitCode = error instanceof UsageError ? 2 : 1;
    });
}

