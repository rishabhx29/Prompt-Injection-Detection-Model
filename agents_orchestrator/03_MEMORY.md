# 03 — Memory (Lessons Store & Mem0)

Two stores, two roles:

| Store | Medium | Holds | Lifetime |
|---|---|---|---|
| **Lessons** (`state/lessons.md`) | Plain markdown, project-local | Reusable experience: problems, failed attempts, verified solutions | Until superseded |
| **Mem0** | Memory layer (self-hosted OSS or platform) | Durable facts, decisions, conventions, preferences | Until superseded |

`memory.auto_store: false` in `config/agent_config.yaml` governs both: **all memory writes are
deliberate decisions made after verification passed** (entrypoint rule 8). Not memory:
conversation history, session notes, task scratch, tool output, logs.

## Route here when the task asks

- **Experience** (→ lessons): "Have we solved/failed this before?" · "Why does this workaround
  exist?" · "What did we learn debugging this?" — **always re-verify the lesson against
  current source before applying it.**
- **Durable facts** (→ Mem0): "What DB/auth/API conventions did we commit to?" · "What was
  decided about X?" · "Standing requirements/preferences?" — if AGENTS.md/CLAUDE.md already
  answers it, don't query.

## What qualifies — the test

*Would a fresh session be wrong or meaningfully slower without it? AND is it not re-derivable
from the repo in under a minute?* Both must hold.

**Good Mem0 memories:** "Project uses MongoDB Atlas (confirmed 2026-09)" · "Auth: JWT with
rotating refresh tokens; AUTH_SECRET required in deploy env" · "API errors use RFC 7807 shape
in src/lib/errors.ts" · "New UI uses Tailwind" · "No Redux without explicit justification
(decision 2026-09-12)" · "Migrations are forward-only".

**Good lessons:** symptom → cause → verified fix; failed approaches worth remembering
("approach X breaks Y, here's why"); build/deploy gotchas specific to this project;
non-obvious invariants found the hard way.

**Never store:** secrets/keys/`.env` values · activity logs ("opened dashboard.tsx") ·
derivable repo facts ("the suite has 412 tests") · session state/TODOs · anything from another
project · unverified results.

**Store selection rule:** verified *while solving something* → lessons. *Decided/stated as how
the project is* → Mem0. Both? The lesson may reference the Mem0 fact; don't duplicate.

## Lessons record format

One record per reusable insight. Header: `## [LS-NNN] <short imperative title>`. Fields:
Date · Status (`active | superseded (by [LS-###]) | invalidated (reason)`) · Tags · Problem ·
Investigation · Attempt(s) · Solution · Result (`verified (<how>)`) · Lesson (1–2 sentences,
the generalizable takeaway) · Scope hint (file pointers, not truth). Full template and
good/bad examples live in `state/lessons.md` itself.

## Mem0 read/write discipline

- **Read:** query only when the task needs durable context; search narrowly ("auth
  conventions", "database decisions"); don't dump all memories; treat results as **claims
  about the past**.
- **Write triggers (after verification):** user states a durable preference/decision; a
  convention was explicitly agreed; a durable fact emerged that isn't visible in the repo
  (e.g., deploy-env behavior). Keep entries atomic — one fact per memory — with date + project
  scope identifier.
- **Scoping (hard rule):** every read/write is scoped to THIS project (`memory.mem0.scope:
  project`). Self-hosted: project identifier in metadata, filter searches by it. Platform:
  one project/user per codebase. Never query global scopes; never reuse another project's
  memories.

## Lifecycle

```
Observe → Extract (candidate) → Classify (which store? durable? safe? in-scope?)
→ Validate (true NOW, verified against repo) → Store (scoped, dated, atomic)
→ Retrieve when relevant → Verify against repo on every reuse
→ Update / supersede when stale
```

## Updating, superseding, pruning

- Stale Mem0 fact: confirm reality in repo → add/update with new fact (dated, scoped) →
  supersede/remove the old → tell the user in one line. Never stack contradictions.
- Stale lesson: set `Status: superseded (by [LS-###])` or `invalidated (reason)` — never
  silently delete.
- Lessons pruning: `max_active_lessons` (default 200) — supersede/merge the weakest entries.
- Stale memory discovered mid-task: correct it now; that's part of the task.
