# 04 — Headroom (context compression)

**What it is (verified — github.com/headroomlabs-ai/headroom):** a context-management layer —
not another memory database. Compresses tool outputs, logs, files, RAG chunks, and history
**locally before the LLM**; **reversible** — originals cached locally (CCR), retrievable via
`headroom_retrieve`. Install/verify/remove: `01_INSTALLATION.md`.

**Role:** last-mile fix for context pressure — the *only* provider triggered by a condition
rather than a question type, and that condition is real pressure, not habit.

## Modes (pick per `agent_config.yaml`)

| Mode | What | Fits |
|---|---|---|
| `mcp` | Tools: `headroom_compress`, `headroom_retrieve`, `headroom_stats` | Selective compression of big payloads — most surgical, orchestrator default |
| `proxy` | `headroom proxy --port 8787`; any OpenAI-compatible client routes through it | Constant heavy tool-output traffic |
| `wrap` | `headroom wrap <agent>` launches the agent wired through a local proxy | Always-on savings for one agent |
| `library` | `compress(messages)` inline | Custom pipelines |

## Decision rule

Compress **only when, after assembling context normally, one of these is true:**

- Assembled context is approaching/over practical limits, or the task visibly drowned in large
  dumps you must keep *some* of.
- A tool returned a huge payload of which you need only part (compress now, retrieve the rest
  if needed).
- History accumulated redundant outputs, repeated logs, stale dumps.
- You're in a predictably huge-output task (bulk refactors, log forensics, massive search
  results) and can see the blow-up coming.

**Do NOT:** compress preemptively per task (most need none) · compress to "tidy up" ·
compress CRITICAL context (current request, explicit requirements, security constraints,
current errors, current tests).

## Workflow position

```
… → retrieve → filter → assemble context → CONTEXT SIZE CHECK
     too large? → compress OPTIONAL/low-value bulk → re-check
     still too large? → reduce scope (split task, narrow area) — never compress into CRITICAL
→ LLM → implement → verify
```

If you routinely hit the size check, fix the **cause** first (narrower queries, smaller file
reads, relevance filtering) — Headroom is a pressure valve, not a license to retrieve
everything.

## Verify it's working

`headroom doctor` (health) · `headroom stats`/`headroom dashboard` (savings once traffic
flows) · spot-check that task-relevant facts survived compression; when in doubt,
`headroom_retrieve` the original instead of guessing.
