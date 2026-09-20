# agents_orchestrator

A **project-local instruction and orchestration layer for AI coding agents.** Copy this folder
into any project; the agent reads it and gains consistent rules for using its providers
correctly. It contains rules, not runtime software — project data stays project-local, and no
data is ever shared between projects.

## What the providers do

| Provider | Package | What it is | Owns |
|---|---|---|---|
| **Graft** | `@nanonets/graft` | Codebase **context graph**: linked plain-English markdown nodes + per-symbol `wiring.json`; MCP server + CLI; auto-refresh | Codebase structure & orientation |
| **Graphify** | `graphifyy` (PyPI, double-y) | Deterministic AST **knowledge graph** (`graph.json`), plus docs/PDF/media mapping; explain/path/query | Codebase structure & deep queries |
| **Mem0** | `mem0ai` | Long-term memory layer (self-hosted OSS or platform); OpenMemory MCP | Durable project memory |
| **Headroom** | `headroom-ai` | Local **context compression**; library/proxy/wrap/MCP; reversible (CCR) | Context management |
| **Lessons store** | `state/lessons.md` | Plain-markdown experience memory | Verified lessons from this project |

Graft and Graphify overlap: **one is primary per project** (`config/agent_config.yaml` →
`structure.primary`). The lessons store fills the "experience memory" role.

## How the agent uses it

1. Read `AGENTS.md` (the entrypoint — rules, truth hierarchy, context tiers, per-task flow).
2. First session: run `00_PROJECT_DISCOVERY.md` read-only; update `config/agent_config.yaml`.
3. Per task: analyze → select the fewest providers that own the needed info → retrieve
   minimally → verify claims against source → implement → verify → store memory only
   deliberately.
4. Guides are read **on demand** (`02_STRUCTURE_TOOLS.md`, `03_MEMORY.md`, `04_HEADROOM.md`,
   `01_INSTALLATION.md`, `05_SAFETY_RULES.md`, `06_ROUTING_EXAMPLES.md`) — most tasks need
   none of them.

## Files

| File | Purpose |
|---|---|
| `AGENTS.md` | **Entrypoint — the only mandatory read**: rules, hierarchy, per-task flow |
| `00_PROJECT_DISCOVERY.md` | Read-only first-session inspection + provider detection |
| `01_INSTALLATION.md` | When to install, verified commands, verify/disable/remove per provider |
| `02_STRUCTURE_TOOLS.md` | Graft & Graphify: choosing primary, commands, non-negotiables |
| `03_MEMORY.md` | Lessons store & Mem0: what qualifies, format, lifecycle, repair |
| `04_HEADROOM.md` | Context compression: modes, decision rule, verification |
| `05_SAFETY_RULES.md` | Hard rules: secrets, installs, git, isolation, compression |
| `06_ROUTING_EXAMPLES.md` | Optional: worked examples, task-category routes, matrix |
| `config/agent_config.yaml` | Project-local governance: enabled providers, routing, safety |
| `state/lessons.md` | The lessons store (gitignored by default; project-local) |
| `scripts/detect_and_validate.py` | Stdlib-only provider detection + config validation |

## Design principles

- **Minimum retrieval, minimum context.** Use the fewest providers needed; never use all four
  because they exist. The repo is the source of truth — graphs, memories, and lessons are
  maps/memories and can be stale (supersede them when they are).
- **Lightweight.** One mandatory-read file (`AGENTS.md`); everything else is on-demand
  reference. No daemon, no runtime, no cross-project state.
- **Safety first.** No installs without verification + confirmation; no secrets in memory; no
  auto-commit/push; no compression of CRITICAL context.

## Initializing in a new project

1. Copy this folder in.
2. If the folder isn't at the repo root, add a one-line pointer at the root:
   `Read agents_orchestrator/AGENTS.md first and follow it for every task.`
3. Have the agent run discovery (`00_PROJECT_DISCOVERY.md`) and adjust
   `config/agent_config.yaml` to reality.
