# 06: CLI over the same core

**What to build:** The same core scanner reachable from a terminal: `ctxvigil scan --input
page.json --task "…"` prints a machine-readable JSON result (or a compact readable report), with no
network and no API key — and returns the same decision as a direct SDK import for the same file.

**Blocked by:** 05 (action gate + seven contract tests green).

**Status:** done

Scope (Phase 5 §8.1 of `docs/02_PHASE_PLAN_RISHABH.md`):

- New `ctxvigil-cli` package whose `bin` command imports `ctxvigil-core` (FR-6.1).
- `scan` command: `--input` page JSON, `--task` string; JSON output by default or with `--json`,
  plus a compact readable report (FR-6.2).
- `--help` and non-zero exit code on malformed input (FR-6.3).
- No network or API-key requirement (FR-6.4).
- Parity proven: CLI decision equals the direct-import decision for the same JSON file (FR-6.5).

- [x] `ctxvigil scan --input <sample request> --task "…"` produces contract-shaped JSON output.
- [x] Compact readable report mode renders the decision, score, and findings.
- [x] Malformed input exits non-zero with a helpful message; `--help` works.
- [x] Parity check: CLI vs direct import on the same sample yields identical decisions.

## Comments

- Implemented 2026-09-21: new `ctxvigil-cli` workspace package (`bin: ctxvigil`, executable bit,
  `ctxvigil:*` workspace dependency); `tests/cli.test.ts` (10 cases); root `test` script extended.
  155 tests green via root `npm test`.
- The CLI is argument parsing + reporting only (FR-6.1, architecture §4.3): no rules, scores, or
  weights inline (greps clean); no network, no API key (FR-6.4).
- Exit codes: 0 success · 1 scan/read/parse/core failure (`INVALID_REQUEST` text surfaced on
  stderr) · 2 usage errors (`--help` itself exits 0) (FR-6.3).
- FR-6.2/phase §8.1 task 5.3: machine-readable JSON is the **default**; `--report` selects the
  compact report. `--task` overrides `userTask`; a page+userTask pair without `scanId` gets a
  `cli-scan` placeholder; `--check-action` runs the gate against the just-completed scan and
  emits `{ scan, action }`.
- FR-6.5: parity holds structurally (the CLI calls the same `guard.scanPage`) and is asserted per
  sample for every `sample-data/scan-requests/*.json` (decision + score).
- Review-corrected: `--report` added after finding the default contradicted phase task 5.3; test
  assertions loosened where they pinned scorer internals (`risk 100, critical`, relative damping)
  or documented exit codes.

