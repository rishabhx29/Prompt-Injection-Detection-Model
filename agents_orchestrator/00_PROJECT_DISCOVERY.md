# 00 — Project Discovery (read-only, first session)

Run **before any substantial work**. Strictly read-only: during discovery you may not create,
modify, or delete anything except `config/agent_config.yaml` (which you update to record
findings). Purpose: ground routing in reality, not assumptions.

**Shortcut:** `python agents_orchestrator/scripts/detect_and_validate.py` — detects providers
(Graft/Graphify/Mem0/Headroom/lessons) and validates `config/agent_config.yaml` (exit 0 = ok,
1 = warnings, 2 = errors). Run first, then spot-check findings manually.

## What to inspect (existence only; never dump .env values)

```
.git/                       README.md / AGENTS.md / CLAUDE.md
package.json                pnpm-lock.yaml / package-lock.yaml / yarn.lock / bun.lock
requirements.txt            pyproject.toml / poetry.lock / uv.lock
Cargo.toml  go.mod          pom.xml / build.gradle(.kts)
Dockerfile  compose.yaml / docker-compose.yml
Makefile / justfile / Taskfile.yml      .github/workflows, .gitlab-ci.yml
tsconfig/eslint/prettier/ruff configs    testing config (vitest, jest, pytest, ...)
.mcp.json / .claude/ / .cursor/ / mcp configs (list server NAMES only, never values)
.agents/, .claude/skills/   existing agent config
graft/  graphify-out/       existing structure-tool artifacts
```

## What to determine

Languages · frameworks (manifest deps) · frontend/backend/DB · package manager (lockfile) ·
build system · testing framework · monorepo layout (workspaces) · deployment (Docker/CI/IaC) ·
MCP servers configured · existing agent config (AGENTS.md/CLAUDE.md/.cursorrules).

## Provider detection — reuse, don't reinstall

| Evidence | Means |
|---|---|
| `graft/` dir, graft hooks in `.claude/`, `@nanonets/graft` in global npm, graft MCP entry | Graft set up → don't reinstall; verify freshness |
| `graphify-out/` (graph.json, GRAPH_REPORT.md) or `graphifyy` in env | Graphify set up → reuse |
| `mem0ai` in deps, Mem0/OpenMemory MCP entry, `MEM0_API_KEY` env NAME | Mem0 present → check mode |
| `headroom` in PATH/deps, proxy config, `headroom_compress` MCP tool | Headroom present → check mode |
| `state/lessons.md` has `[LS-###]` entries | Lessons store populated |

If a provider is detected but disabled in config, ask before enabling. If missing, do NOT
install yet — present options per `01_INSTALLATION.md` and wait for confirmation.

## Record findings

Update `config/agent_config.yaml`: set `structure.primary` to the detected/better-fit tool
(confirm with user), align `enabled` flags with reality, note languages/frameworks in a top
comment, record the date.

## Output to user (keep short)

```
Project: <name> | Languages: <…> | Frameworks: <…> | Pkg mgr: <…> | Tests: <…>
Providers: Graft ✓/✗ · Graphify ✓/✗ · Mem0 ✓/✗ · Headroom ✓/✗ · lessons: N
Proposed config changes: <list> — confirm before applying
```

Rules: read-only; env var/config NAMES only, never values; on a huge monorepo map only the
top level plus areas relevant to the current task.
