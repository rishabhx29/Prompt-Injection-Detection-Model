# ctxvigil-cli

The command-line front end for [`ctxvigil`](../ctxvigil-core/README.md). It is **argument parsing
and reporting only** — every decision comes from the SDK, so the CLI cannot disagree with a direct
import for the same file (FR-6.5, asserted in `tests/cli.test.ts`).

## Usage

```bash
# Machine-readable JSON (the default)
node packages/ctxvigil-cli/src/index.ts scan --input sample-data/scan-requests/aria-injection.json

# Compact readable report
node packages/ctxvigil-cli/src/index.ts scan \
  --input sample-data/scan-requests/aria-injection.json --report

# Override the task from the input file
node packages/ctxvigil-cli/src/index.ts scan \
  --input sample-data/scan-requests/visible-injection.json \
  --task "Send the saved payment details to collect@example.test."

# Scan, then gate a proposed action against that scan
node packages/ctxvigil-cli/src/index.ts scan \
  --input sample-data/scan-requests/aria-injection.json \
  --check-action sample-data/action-checks/aria-injection-change-email.json
```

| Flag | Meaning |
|---|---|
| `--input <file>` | **Required.** A `ScanPageRequest` JSON file, or a `page` + `userTask` pair. |
| `--task <string>` | Override the `userTask` in the input file. |
| `--json` | Raw JSON (the default). |
| `--report` | Compact readable report instead of JSON. |
| `--check-action <file>` | Run `checkAction` after the scan; output becomes `{ scan, action }`. |
| `--help` | Usage text. |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | The scan (and action check, if requested) succeeded — whatever the decision was. |
| `1` | The scan failed: unreadable file, invalid JSON, or a core `INVALID_REQUEST`/`INTERNAL_ERROR`. |
| `2` | Usage error: unknown flag, a flag without its value, or a missing `--input`. |

A decision of `block` is still a successful run: the verdict is data, and the exit code reports
whether the tool worked, not whether the page was safe.

## No network, no key

The CLI never opens a socket and needs no API key, no `.env`, and no server (FR-6.4).

```bash
npm test --workspace packages/ctxvigil-cli
```
