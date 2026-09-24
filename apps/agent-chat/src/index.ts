#!/usr/bin/env node
/**
 * Terminal chat with the guarded agent — `npm run agent:chat`.
 *
 * A fixed-chrome chat CLI: the header (logo, model, commands) stays at the top,
 * the transcript scrolls in the middle, and the message box is pinned to the
 * bottom of the terminal like a real chatbot CLI. The `❯` prompt lives inside
 * the box; while the model works, the box shows an animated status line.
 *
 * Non-interactive sessions (piped stdin/stdout, CI) fall back to plain
 * append-only printing — no screen clearing, same transcript content.
 *
 * Commands: /help · /clear · /history · /exit
 * Requires GEMINI_API_KEY in the environment or repo-root .env.
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { createCtxVigil } from "ctxvigil";

import { loadEnvFile, requireEnv } from "./env.ts";
import { runAgent, type AgentHistoryTurn, type AgentTurnEvent } from "./agent.ts";

loadEnvFile();

/* -------------------------------------------------------------------------- */
/* Palette                                                                     */
/* -------------------------------------------------------------------------- */

const USE_COLOR =
  stdout.isTTY === true && process.env["NO_COLOR"] === undefined && !process.argv.includes("--no-color");

const paint = (code: string) => (text: string) => (USE_COLOR ? `\u001b[${code}m${text}\u001b[0m` : text);
const cyan = paint("36");
const magenta = paint("35");
const red = paint("31");
const green = paint("32");
const yellow = paint("33");
const dim = paint("2");
const bold = paint("1");
const white = paint("97");

const MODEL = process.env["GEMINI_MODEL"] ?? "gemini-flash-latest";

const SAMPLE_TASK =
  "go to http://localhost:5173/fixtures/aria-injection.html and summarize the refund policy";

const INTERACTIVE = stdout.isTTY === true && stdin.isTTY === true && USE_COLOR;

/** ASCII logo for the backing provider — Gemini sparkle, Claude burst, or shield. */
function providerLogo(): { art: string[]; color: (text: string) => string } {
  const model = MODEL.toLowerCase();
  if (model.includes("gemini")) {
    return { art: ["     ✦", "   ✦ ✦ ✦", " ✦ ✦ ✦ ✦ ✦", "   ✦ ✦ ✦", "     ✦"], color: cyan };
  }
  if (model.includes("claude")) {
    return { art: ["    ✳", "  ✳ ✳ ✳", "✳ ✳ ● ✳ ✳", "  ✳ ✳ ✳", "    ✳"], color: yellow };
  }
  return { art: [" ▄▀▀▄", " █◆◆█", " ▀▄▄▀"], color: green };
}

/** Single-glyph provider mark used on cards and the status line. */
function providerGlyph(): string {
  const model = MODEL.toLowerCase();
  if (model.includes("gemini")) return "✦";
  if (model.includes("claude")) return "✳";
  return "◆";
}

/* -------------------------------------------------------------------------- */
/* Geometry & text helpers                                                     */
/* -------------------------------------------------------------------------- */

function termWidth(): number {
  const columns = typeof stdout.columns === "number" && stdout.columns > 20 ? stdout.columns : 100;
  return Math.min(columns, 110);
}

function termHeight(): number {
  return typeof stdout.rows === "number" && stdout.rows > 24 ? stdout.rows : 40;
}

/** Word-wrap plain text (no ANSI) into lines of at most `width` characters. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/u)) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/\s+/u)) {
      if (current === "") {
        current = word.slice(0, width);
      } else if (current.length + 1 + word.length <= width) {
        current += ` ${word}`;
      } else {
        lines.push(current);
        current = word.slice(0, width);
      }
    }
    if (current !== "") lines.push(current);
  }
  return lines;
}

/** Visible length of a string that may contain ANSI colour codes. */
function visibleLength(text: string): number {
  return text.replace(/\u001b\[\d*m/gu, "").length;
}

function padTo(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - visibleLength(text)));
}

function timestamp(): string {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

/** Colour a string only in its first `visible` characters (keeps alignment). */
function tag(label: string, color: (text: string) => string): string {
  return color(`● ${label}`) + dim(" ".repeat(Math.max(0, 8 - label.length)));
}

/* -------------------------------------------------------------------------- */
/* Transcript blocks (pre-rendered ANSI lines)                                 */
/* -------------------------------------------------------------------------- */

/** One message/group in the transcript: a list of fully styled lines. */
type Block = string[];

function userBlock(text: string): Block {
  const W = termWidth();
  return [
    `${dim(`${timestamp()} `)}${bold(cyan("you"))}`,
    ...wrap(text, W - 4).map((line) => `  ${line}`),
  ];
}

function agentBlock(text: string): Block {
  const inner = termWidth() - 8;
  const title = `${bold(green(` ${providerGlyph()} agent`))} ${dim(`· ${MODEL.split("-").slice(0, 2).join("-")} · ${timestamp()}`)}`;
  return [
    `${dim("╭")}${dim("─".repeat(inner))}${dim("╮")}`,
    `${dim("│")}${padTo(title, inner)}${dim("│")}`,
    `${dim("├")}${dim("─".repeat(inner))}${dim("┤")}`,
    ...wrap(text, inner - 2).map((line) => `${dim("│")} ${padTo(line, inner - 2)} ${dim("│")}`),
    `${dim("╰")}${dim("─".repeat(inner))}${dim("╯")}`,
  ];
}

function eventBlock(kind: "layer" | "gate" | "error", text: string): Block {
  const label = kind === "layer" ? tag("layer", cyan) : kind === "gate" ? tag("gate", magenta) : tag("error", red);
  const width = termWidth() - 14;
  return wrap(text, width).map((line, index) =>
    index === 0 ? `  ${label} ${dim(line)}` : `  ${" ".repeat(9)} ${dim(line)}`,
  );
}

function haltBlock(text: string): Block {
  const inner = termWidth() - 8;
  const title = `${bold(red(" ⛔ halted by the protection layer"))} ${dim(`· ${timestamp()}`)}`;
  return [
    `${red("╭")}${red("─".repeat(inner))}${red("╮")}`,
    `${red("│")}${padTo(title, inner)}${red("│")}`,
    `${red("├")}${red("─".repeat(inner))}${red("┤")}`,
    ...wrap(text, inner - 2).map((line) => `${red("│")} ${padTo(line, inner - 2)} ${red("│")}`),
    `${red("╰")}${red("─".repeat(inner))}${red("╯")}`,
  ];
}

function helpBlock(): Block {
  return [
    `${bold("  how this works")}`,
    `${dim("  you give the agent a task; it reads pages through the ctxvigil layer and")}`,
    `${dim("  proposes actions through its gate. every verdict is printed as it happens:")}`,
    `  ${tag("layer", cyan)} ${dim("page scan verdict (allow / sanitize / confirm / block)")}`,
    `  ${tag("gate", magenta)} ${dim("action-gate verdict (allowed / confirmation / blocked)")}`,
    `  ${tag("error", red)} ${dim("transport or API failure (the layer never fails open)")}`,
    `${dim("  commands: /clear resets the screen · /history shows this session's scans · /exit quits")}`,
  ];
}

function historyBlock(scans: Array<{ url: string; decision: string; riskScore: number; withheld: number }>): Block {
  if (scans.length === 0) return [`${dim("  no pages read yet this session.")}`];
  const lines = [`${bold("  this session")}`];
  for (const scan of scans) {
    const colour = scan.decision === "allow" ? green : scan.decision === "block" ? red : yellow;
    lines.push(
      `  ${tag("scan", cyan)} ${dim(scan.url)}`,
      `  ${" ".repeat(9)} ${colour(scan.decision.toUpperCase())} ${dim(`score ${scan.riskScore} · ${scan.withheld} segment(s) withheld`)}`,
    );
  }
  return lines;
}

/* -------------------------------------------------------------------------- */
/* Fixed-chrome screen renderer                                                */
/* -------------------------------------------------------------------------- */

/** The pinned prompt string: the box's left edge is part of the readline prompt. */
const PROMPT = `  ${dim("│")} ${cyan("❯")} `;

function headerLines(): string[] {
  const logo = providerLogo();
  const sampleLines = wrap(SAMPLE_TASK, termWidth() - 10);
  return [
    ...logo.art.map((row) => `  ${logo.color(row)}`),
    `  ${bold(white("CtxVigil Agent Chat"))}  ${dim("v1.1")}`,
    `  ${cyan("model")}   ${MODEL}`,
    ...sampleLines.map((line, index) => (index === 0 ? `  ${cyan("try")}    ${line}` : `         ${line}`)),
    `  ${dim("commands: /clear · /history · /help · /exit   ·   every read is scanned · every action is gated")}`,
  ];
}

class Screen {
  private readonly transcript: Block[] = [];
  /** 1-indexed terminal row the prompt sits on after the last render. */
  public lastPromptRow = 1;

  append(block: Block): void {
    this.transcript.push(block);
  }

  reset(): void {
    this.transcript.length = 0;
  }

  /** Full redraw: header, transcript tail, pinned message box. Positions the
   *  cursor on the prompt row (col 1) so either the working status or the
   *  readline prompt can take it. */
  render(status?: string): void {
    const W = termWidth();
    const header = headerLines();
    const contentRows = Math.max(4, termHeight() - header.length - 5);

    const flat = this.transcript.flat();
    const tail = flat.length > contentRows ? flat.slice(-(contentRows - 1)) : flat;
    const hidden = flat.length - tail.length;

    const out: string[] = [];
    out.push(...header);
    out.push(dim("─".repeat(W)));
    if (hidden > 0) out.push(dim(`  ··· ${hidden} earlier line${hidden === 1 ? "" : "s"} ···`));
    out.push(...tail);
    while (out.length < header.length + 1 + contentRows) out.push("");

    const boxTop = `  ${dim("╭─ message ")}${dim("─".repeat(Math.max(2, W - 14)))}${dim("╮")}`;
    const boxBottom = `  ${dim("╰")}${dim("─".repeat(W - 4))}${dim("╯")}`;
    out.push("");
    out.push(boxTop);
    out.push(PROMPT);
    out.push(boxBottom);

    this.lastPromptRow = out.length - 1;
    stdout.write(`\u001b[2J\u001b[H${out.join("\n")}\n`);
    this.moveToPrompt();
    if (status !== undefined) stdout.write(`\u001b[2K${status}`);
  }

  moveToPrompt(): void {
    stdout.write(`\u001b[${this.lastPromptRow};1H`);
  }
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

class WorkingStatus {
  private timer: NodeJS.Timeout | undefined;
  private frame = 0;
  private started = 0;

  start(redraw: (status: string) => void): void {
    this.stop();
    this.started = Date.now();
    this.timer = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frame % SPINNER_FRAMES.length] ?? "⠋";
      this.frame += 1;
      const seconds = Math.floor((Date.now() - this.started) / 1000);
      redraw(`  ${dim("│")} ${cyan(frame)} ${dim(`${providerGlyph()} agent is working… ${seconds}s`)}   \u001b[0K`);
    }, 120);
  }

  stop(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}

function workingStatusLine(frame: string): string {
  return `  ${dim("│")} ${cyan(frame)} ${dim(`${providerGlyph()} agent is working…`)}   \u001b[0K`;
}

/* -------------------------------------------------------------------------- */
/* Non-interactive fallback (piped stdin/stdout)                               */
/* -------------------------------------------------------------------------- */

function printBlock(block: Block): void {
  stdout.write(`\n${block.join("\n")}\n`);
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

interface SessionScan {
  url: string;
  decision: string;
  riskScore: number;
  withheld: number;
}

const EXIT_LINES = [
  ``,
  `  ${dim("✦ session ended — the layer stayed between the agent and the web the whole time.")}`,
  ``,
];

async function main(): Promise<void> {
  let apiKey: string;
  try {
    apiKey = requireEnv("GEMINI_API_KEY");
  } catch (error) {
    stdout.write(`${red("✖")} ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
    return;
  }

  const guard = createCtxVigil();
  const history: AgentHistoryTurn[] = [];
  const sessionScans: SessionScan[] = [];

  const renderEvent = (event: AgentTurnEvent): Block => {
    if (event.kind === "layer") return eventBlock("layer", event.text);
    if (event.kind === "gate") return eventBlock("gate", event.text);
    if (event.kind === "error") return eventBlock("error", event.text);
    if (event.kind === "halt") return haltBlock(event.text);
    return agentBlock(event.text);
  };

  if (INTERACTIVE) {
    /* -------------------------- fixed-chrome mode -------------------------- */

    const screen = new Screen();
    const status = new WorkingStatus();
    let busy = false;

    const rl = createInterface({ input: stdin, output: stdout, prompt: PROMPT });

    const redrawStatus = (line: string): void => {
      screen.moveToPrompt();
      stdout.write(`\u001b[2K${line}`);
    };

    const prompt = (): void => {
      screen.moveToPrompt();
      stdout.write("\u001b[2K");
      rl.prompt();
    };

    rl.on("SIGINT", () => {
      status.stop();
      stdout.write(`\u001b[2J\u001b[H${EXIT_LINES.join("\n")}`);
      process.exit(0);
    });

    screen.render();
    prompt();

    rl.on("line", (raw: string) => {
      const line = raw.trim();

      if (line.toLowerCase() === "exit" || line.toLowerCase() === "quit" || line === "/exit") {
        rl.close();
        return;
      }

      if (busy) {
        // Typed input while the agent works is discarded; the transcript stays fixed.
        screen.render(workingStatusLine("⠋"));
        return;
      }

      if (line === "") {
        prompt();
        return;
      }

      if (line === "/clear") {
        screen.reset();
        screen.render();
        prompt();
        return;
      }

      if (line === "/help") {
        screen.append(helpBlock());
        screen.render();
        prompt();
        return;
      }

      if (line === "/history") {
        screen.append(historyBlock(sessionScans));
        screen.render();
        prompt();
        return;
      }

      screen.append(userBlock(line));
      busy = true;
      rl.pause();
      screen.render(workingStatusLine("⠋"));
      status.start(redrawStatus);

      void (async () => {
        try {
          const summary = await runAgent({
            task: line,
            guard,
            apiKey,
            model: MODEL,
            history,
            onEvent: (event) => {
              status.stop();
              screen.append(renderEvent(event));
              screen.render(workingStatusLine("⠋"));
              status.start(redrawStatus);
            },
          });
          history.push({ role: "user", text: `User task: ${line}` });
          history.push({ role: "model", text: summary.answer });
          for (const scan of summary.scans) {
            sessionScans.push({ url: scan.url, decision: scan.decision, riskScore: scan.riskScore, withheld: scan.withheld });
          }
        } catch (error) {
          status.stop();
          screen.append(eventBlock("error", error instanceof Error ? error.message : String(error)));
        } finally {
          status.stop();
          busy = false;
          rl.resume();
          screen.render();
          prompt();
        }
      })();
    });

    rl.on("close", () => {
      status.stop();
      stdout.write(`\u001b[2J\u001b[H${EXIT_LINES.join("\n")}`);
    });
  } else {
    /* ---------------------- append-only fallback mode ---------------------- */

    stdout.write(`\n  ${bold(white("CtxVigil Agent Chat"))}  ${dim(`v1.1 · ${MODEL} · plain output (not a TTY)`)}\n\n`);

    for await (const raw of stdin) {
      const line = String(raw).trim();
      if (line === "") continue;

      if (line.toLowerCase() === "exit" || line.toLowerCase() === "quit" || line === "/exit") break;
      if (line === "/help") {
        printBlock(helpBlock());
        continue;
      }
      if (line === "/clear") continue;
      if (line === "/history") {
        printBlock(historyBlock(sessionScans));
        continue;
      }

      printBlock(userBlock(line));
      try {
        const summary = await runAgent({
          task: line,
          guard,
          apiKey,
          model: MODEL,
          history,
          onEvent: (event) => printBlock(renderEvent(event)),
        });
        history.push({ role: "user", text: `User task: ${line}` });
        history.push({ role: "model", text: summary.answer });
        for (const scan of summary.scans) {
          sessionScans.push({ url: scan.url, decision: scan.decision, riskScore: scan.riskScore, withheld: scan.withheld });
        }
      } catch (error) {
        printBlock(eventBlock("error", error instanceof Error ? error.message : String(error)));
      }
    }
    stdout.write(EXIT_LINES.join("\n"));
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  (await import("node:url")).pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(`${red("✖")} ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
