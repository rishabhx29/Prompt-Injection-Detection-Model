# 06 — Routing Examples (optional reading)

Worked examples of the per-task flow from `AGENTS.md`, plus the selection matrix. Guidance,
not law — use judgment, and state your reasoning when a routing decision is non-obvious.

## Worked examples

**"Fix the failing checkout test."** — Classify: DEBUGGING. Select: lessons (has checkout
failed before?) → structure provider to trace the checkout path if unfamiliar. Retrieve
narrowly, verify claims in source, reproduce, fix, run the suite. Memory: store a lesson only
if a real reusable lesson emerged; otherwise nothing.

**"What does the payments subsystem depend on?"** — Classify: CODE_NAVIGATION. Select:
structure provider only. One or two targeted queries, then read the actual files to confirm.
No lessons, no Mem0, no Headroom.

**"We decided: all new endpoints use the standard error shape."** — Classify:
PROJECT_CONVENTION + durable decision. After confirming with the user, store in Mem0 (dated,
scoped). A lesson is NOT the right store — it's a convention, not a debugging insight.

**"Audit this entire module for dead code."** — Classify: LARGE_CONTEXT_TASK +
CODE_NAVIGATION. Structure provider to enumerate; expect the size check to fire → compress
bulk file dumps via Headroom, keeping CRITICAL tier (the task, the file list being verified)
verbatim.

## Task categories → default routes

| Category | Primary route |
|---|---|
| CODE_NAVIGATION | Structure provider |
| ARCHITECTURE_ANALYSIS | Structure provider (+ Mem0 for recorded decisions) |
| IMPLEMENTATION | Structure provider if unfamiliar area; lessons for known pitfalls |
| REFACTORING | Structure provider (impact analysis first) |
| DEBUGGING | Lessons → structure provider to trace → reproduce in source |
| MEMORY_LOOKUP | Mem0 / lessons — only if the answer isn't already in context |
| PROJECT_CONVENTION | Mem0 → AGENTS.md/CLAUDE.md → source conventions |
| LARGE_CONTEXT_TASK | Headroom at the context-check step |
| GENERAL_TASK | Usually **no provider at all** — just read the relevant files |

## Selection matrix

| Task | Structure | Lessons | Mem0 | Headroom |
|---|---|---|---|---|
| Find implementation | YES | NO | NO | NO |
| Understand dependencies | YES | NO | NO | NO |
| Impact analysis / refactoring | YES | MAYBE | NO | NO |
| Previous debugging solution | NO | YES | MAYBE | NO |
| Architecture decision context | MAYBE | NO | YES | NO |
| User/project preference | NO | NO | YES | NO |
| Huge codebase analysis | YES | MAYBE | MAYBE | MAYBE (at context check) |
| Context overflow | NO | NO | NO | YES |
| Simple bug fix (known area) | MAYBE | MAYBE | NO | NO |
| New feature in unfamiliar subsystem | YES | MAYBE | MAYBE | NO |
| One-line obvious change | NO | NO | NO | NO |

## Routing constraints (recap)

- Enabled-and-verified providers only (`agent_config.yaml` gates everything).
- Never the unconditional pipeline. Soft cap: `max_providers_per_task` (default 2) — exceed
  only with a one-line stated reason.
- If two providers can answer, pick the cheaper/narrower one; the structure fallback is used
  only when the primary genuinely cannot answer.
- When in doubt whether retrieval adds value: don't retrieve — read the specific source file.
