# 06: CLI over the same core

**What to build:** The same core scanner reachable from a terminal: `ctxvigil scan --input
page.json --task "…"` prints a machine-readable JSON result (or a compact readable report), with no
network and no API key — and returns the same decision as a direct SDK import for the same file.

**Blocked by:** 05 (action gate + seven contract tests green).

**Status:** ready-for-agent

Scope (Phase 5 §8.1 of `docs/02_PHASE_PLAN_RISHABH.md`):

- New `ctxvigil-cli` package whose `bin` command imports `ctxvigil-core` (FR-6.1).
- `scan` command: `--input` page JSON, `--task` string; JSON output by default or with `--json`,
  plus a compact readable report (FR-6.2).
- `--help` and non-zero exit code on malformed input (FR-6.3).
- No network or API-key requirement (FR-6.4).
- Parity proven: CLI decision equals the direct-import decision for the same JSON file (FR-6.5).

- [ ] `ctxvigil scan --input <sample request> --task "…"` produces contract-shaped JSON output.
- [ ] Compact readable report mode renders the decision, score, and findings.
- [ ] Malformed input exits non-zero with a helpful message; `--help` works.
- [ ] Parity check: CLI vs direct import on the same sample yields identical decisions.
