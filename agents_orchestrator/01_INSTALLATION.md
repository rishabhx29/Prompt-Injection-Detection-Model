# 01 — Installation Guide

> **Rule zero: before installing anything, determine whether it is already installed and
> whether it is actually needed.** Not needed for foreseeable tasks → don't install. Already
> installed → verify, don't reinstall. Never silently modify project dependencies. Never
> install system-level software without explicit user authorization
> (`safety.require_confirmation_for_installation`).

All commands reflect the tools' **current official documentation at time of writing
(verified Sep 2026)**. Spot-check the linked official source before installing — package
names, flags, and APIs change. **Never invent commands; if unsure, look it up or ask.**

## Decision first: do you need this provider?

| Provider | Install when… | Do NOT install when… |
|---|---|---|
| Graft | Fast plain-English orientation, impact analysis, MCP code-graph tools wanted; Node ecosystem fine | Project tiny (grep is faster); `structure.primary` ≠ graft; fresh `graft/` already exists |
| Graphify | Deterministic AST queries, docs/PDF/media mapping, HTML graph; Python ecosystem fine | `structure.primary` ≠ graphify and no fallback need; Graft answers pure-code questions |
| Mem0 | Durable cross-session facts/decisions genuinely accumulate AND user wants memory | Short-lived project; AGENTS.md/CLAUDE.md already carries conventions; no user buy-in |
| Headroom | Context pressure actually occurs; predictably huge-output tasks | No context problems observed; user declines; native compaction suffices |

Pick **one** primary structure provider (see `02_STRUCTURE_TOOLS.md` comparison) — don't run
both for the same job.

## Graft — codebase context graph

**Official source:** https://github.com/trailhq/Graft · https://trailhq.com/graft
Maps the repo into linked plain-English markdown nodes (`graft/`) plus a deterministic
per-symbol tree-sitter graph (`graft/.graph/wiring.json`). MCP server + CLI
(`graft ask/grep/callers/skeleton/map/viz/check`). Every query auto-refreshes against the
working tree (~3 ms unchanged). No server, no DB, no embeddings — the graph is files.

- **Requirements:** Node.js/npm (check current Node minimum in the repo README). Optional LLM
  provider key (OpenAI/Anthropic/OpenRouter/Groq/local) for `--deep` summaries; the structural
  build needs **no key**.
- **Install:**
  ```bash
  npm install -g @nanonets/graft   # or: npx @nanonets/graft init
  graft init                        # builds graft/, wires agents (.claude/, MCP, AGENTS.md)
  graft init --dry-run              # preview every file it would touch FIRST
  graft init --agents claude        # wire one agent explicitly
  ```
  `graft build` adds `graft/` to `.gitignore` (regenerable local cache). What gets committed is
  only the wiring in `.claude/`/MCP config. **Project-local by design.**
- **Config:** LLM provider/key for summaries in graft's own config (repo README);
  `graft build --lsp` adds compiler-grade edges when language servers are on PATH; `--deep`
  enables per-symbol summaries.
- **Verify:** `graft check`; run `graft map` or `graft ask "test"` for sensible output; MCP
  tools appear in the agent client if wired.
- **Disable:** stop invoking; remove MCP wiring; `GRAFT_NO_REFRESH=1` disables auto-refresh.
- **Remove:** `rm -rf graft/`; remove wiring (`.claude/` hooks/statusline, MCP entry);
  `npm uninstall -g @nanonets/graft`.
- **Common problems:** command not found → PATH/global npm bin; stale answers shouldn't happen
  (auto-refresh) but `graft build --no-reuse` forces a cold rebuild; monorepos → README section
  "Monorepos & multi-repo folders".

## Graphify — AST knowledge graph

**Official source:** https://github.com/Graphify-Labs/graphify · https://graphify.net
Parses the codebase with tree-sitter into a real graph (`graph.json`), every edge tagged
EXTRACTED vs INFERRED, plus `GRAPH_REPORT.md` and clickable `graph.html`. CLI:
`graphify explain <node>` / `path A B` / `query "<question>"`. Also maps docs, PDFs, images,
video into the same graph (optional semantic pass using your model/API key).

- **Requirements:** Python 3.10+; **uv** (recommended) or pipx. PyPI package is **`graphifyy`
  (double-y)** — other `graphify*` packages are not affiliated; the CLI command is `graphify`.
- **Install:**
  ```bash
  uv tool install graphifyy         # or: pipx install graphifyy
  graphify install                  # registers the skill with your AI assistant
  graphify install --project        # project-scoped skill instead of user profile
  graphify .                        # create graphify-out/
  ```
  Code parsing is fully local, no LLM. Docs/media semantic pass needs a configured backend
  (e.g., `graphifyy[ollama]` local; `graphifyy[openai|anthropic|gemini]` API). Extras: `[mcp]`
  stdio server, `[sql]`, `[neo4j]`/`[falkordb]` push, `[pdf]`, `[video]`, `[leiden]`. Install
  only what you need.
- **Runtime/DB:** none for code-only use; Neo4j/FalkorDB push optional.
- **Verify:** `graphify --version`; `graphify .` creates `graphify-out/graph.json`;
  `graphify explain "<known-symbol>"` returns connections.
- **Disable:** don't invoke; remove skill wiring (`graphify install --project` artifacts under
  `.claude/skills/` or `.agents/skills/`); `GRAPHIFY_HOOK_STRICT=0`.
- **Remove:** delete `graphify-out/`, skill files, `uv tool uninstall graphifyy`.
- **Common problems:** command not found → `uv tool update-shell` / add tool bin to PATH;
  `uvx graphify …` fails → `uvx --from graphifyy graphify …`; prefer `uv tool install`/`pipx`
  over bare `pip install`; PowerShell: `graphify .`, not `/graphify .`.

## Mem0 — durable project memory

**Official source:** https://docs.mem0.ai · https://github.com/mem0ai/mem0 ·
https://mem0.ai/openmemory
Memory layer for agents: extracts/stores/retrieves facts, decisions, preferences with an LLM +
vector store. Modes: **self-hosted OSS** (`pip install mem0ai`) or **hosted platform** (API
key). **OpenMemory MCP** gives coding agents project-aware memory tools.

- **When:** durable facts accumulate AND user wants memory. **When not:** no user buy-in, or
  AGENTS.md/CLAUDE.md already carries all durable conventions.
- **Requirements (self-hosted):** Python 3.9+; an LLM (OpenAI key, or **local via Ollama**); a
  vector store (defaults fine for small projects — verify current default in docs at install
  time).
- **Install (self-hosted — preferred per config):**
  1. `pip install mem0ai` into the project's environment manager, not system-wide.
  2. Configure LLM + vector store via Mem0's `MemoryConfig` (docs.mem0.ai — don't hard-code
     internals here; check current API).
  3. For MCP-based agents: set up **OpenMemory** (self-hostable; mem0.ai/openmemory) so the
     agent gets memory tools (`add_memory`, `search_memory`, …) scoped per project.
- **Install (platform):** API key from the Mem0 dashboard; keep it in the environment (never
  committed); wire the hosted MCP per docs.mem0.ai/platform/mem0-mcp.
- **Config:** this orchestrator requires `scope: project` — all memories namespaced/sandboxed
  to THIS project (OpenMemory supports project scoping; OSS: include a project identifier in
  memory metadata per current docs). LLM: local Ollama for privacy.
- **Verify:** add a test memory ("connection test for project <name>"), search it, **delete the
  test memory**. Confirm MCP tools reachable from the agent client.
- **Disable:** `enabled: false` in agent_config; stop calling memory tools.
- **Remove:** uninstall the package / stop the OpenMemory stack; delete local data dir or
  platform project — confirm with the user first; that data may be wanted.
- **Common problems:** missing LLM key → configure Ollama/local first; memories bleeding across
  projects → enforce project scope in metadata/MCP config; slow first search → embedding
  warmup.

## Headroom — context compression layer

**Official source:** https://github.com/headroomlabs-ai/headroom · https://www.headroomlabs.ai
Compresses tool outputs, logs, files, RAG chunks, and history **locally before the LLM**;
reversible — originals cached locally (CCR), retrievable via `headroom_retrieve`. Ships as a
Python/TS **library**, a **proxy** (`headroom proxy --port 8787`), an agent **wrapper**
(`headroom wrap claude|codex|…`), and an **MCP server** (`headroom_compress`,
`headroom_retrieve`, `headroom_stats`).

- **When:** config mode set and user confirms; realistically once context pressure has actually
  been observed, or for predictably huge-output tasks. **When not:** no problems observed.
- **Requirements:** Python 3.13+ for the CLI (`uv tool install --python 3.13
  "headroom-ai[all]"`); the npm `headroom-ai` package is the **TypeScript SDK only** (no CLI).
- **Install:**
  ```bash
  uv tool install --python 3.13 "headroom-ai[all]"
  headroom doctor            # health check
  # pick the mode from agent_config.yaml:
  headroom mcp install       # MCP server for the agent client   (mode: mcp)
  headroom proxy --port 8787 # drop-in proxy                    (mode: proxy)
  headroom wrap claude       # wrap an agent                    (mode: wrap)
  ```
- **Verify:** `headroom doctor`; `headroom stats`/`headroom dashboard` show savings once
  traffic flows; MCP client lists compress/retrieve tools.
- **Disable:** `enabled: false`; unwrap (`headroom unwrap <tool>`); stop the proxy.
- **Remove:** `uv tool uninstall headroom-ai`; remove MCP entry; unwrap wrapped agents.
- **Common problems:** CLI not found → installed the npm SDK instead of the PyPI CLI;
  compression "changed" an answer → pull the original via `headroom_retrieve`; Python version
  → CLI needs 3.13 per current docs.

## After any install (mandatory)

1. **Verify** the tool works (commands above) — an installed-but-broken tool is worse than none.
2. **Update `agent_config.yaml`**: `enabled: true` only after verification; note the mode.
3. **Re-run** `python agents_orchestrator/scripts/detect_and_validate.py` — must reach exit 0
   once config and reality agree.
4. **Report** to the user exactly what was installed, where, and how to undo it.
5. Confirm the **project-local** guarantee: no data left this project; no global/shared stores
   created (the tool's own user-level binary install is fine — it contains no project data).
