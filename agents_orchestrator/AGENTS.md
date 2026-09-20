# agents_orchestrator — Agent Entrypoint

You are an AI coding agent operating in a project that uses **agents_orchestrator** — an
instruction layer, not runtime software. Project data stays project-local; never move data
between projects.

## The 8 rules

1. **Minimum retrieval.** Use the fewest providers needed, retrieving the minimum relevant
   information. Never use all four because all four exist. When in doubt, don't retrieve —
   direct source reading is always a valid route.
2. **The repository is the only source of truth.** Graphs (Graft/Graphify), memories (Mem0),
   and lessons are maps/memories, not truth. Confirm against actual source files before editing.
3. **Never run a fixed pipeline.** Analyze the task, then select tools.
4. **Route by information owner.** Structure → the configured structure provider (one primary:
   Graft or Graphify, per `config/agent_config.yaml`). Experience → lessons store. Durable
   facts → Mem0. Context overload → Headroom, only when it happens.
5. **Never store secrets, `.env` values, credentials, or other projects' data** in any memory.
6. **Install nothing without checking it isn't already installed**, verifying it against its
   official source, and getting user confirmation where `agent_config.yaml` requires it.
7. **Verify every meaningful change** (tests → lint/type → behavior → diff review) before
   declaring done or storing anything as memory.
8. **Memory writes are deliberate, never automatic.** Default answer is "no"; storing requires
   a stated reason and post-verification. Silence is correct.

## Truth hierarchy (when sources disagree, higher wins)

```
source code > current user instruction > current tests > just-verified state
            > Mem0 memory > lessons > old information
```

Do not blend contradictions. Establish current truth (read the file, run the test), act on it,
then repair the stale source (supersede the memory/lesson — never silently delete).

## Context tiers

```
CRITICAL  keep verbatim, never compressed: current request · explicit requirements ·
          security constraints · current errors · current tests · code you're about to edit
IMPORTANT keep facts while relevant: provider results, lessons, memories, supporting excerpts
OPTIONAL  first to drop: old turns, redundant tool output, off-topic hits, repeats
```

Compress only on real context pressure, OPTIONAL tier first, reversibly (CCR/retrieve), and
never the CRITICAL tier. If you routinely compress, fix the cause: narrower queries, smaller
reads.

## Per-task flow (trivial tasks: skip to step 7 and say so)

```
1 UNDERSTAND (restate goal; ask if ambiguous on a load-bearing point)
2 CLASSIFY   (structure? experience? durable-facts? context-pressure? or none)
3 SELECT     (fewest providers owning required info; enabled+verified only; soft cap 2)
4 RETRIEVE   (minimal targeted queries; filter: drop stale/off-topic/duplicates)
5 VERIFY CLAIMS against actual source files — always, before editing
6 BUILD CONTEXT (tiers above; size-check; compress only if needed)
7 IMPLEMENT  (edit source files only; never edit graft/, graphify-out/ — regenerate instead)
8 VERIFY     (tests → lint/type → behavior → diff review; unverified = never stored)
9 MEMORY DECISION (deliberate: lesson if reusable+verified; Mem0 if durable fact; repair stale)
```

## Read the guide matching your task (only when needed)

| Situation | Read |
|---|---|
| First session in this project | `00_PROJECT_DISCOVERY.md` — read-only inspection, then update config |
| A needed provider is missing | `01_INSTALLATION.md` — decision table + verified install commands |
| Using Graft or Graphify | `02_STRUCTURE_TOOLS.md` — commands, non-negotiables, query discipline |
| Reading/writing memory | `03_MEMORY.md` — what qualifies, format, lifecycle, repair |
| Installing/using Headroom | `04_HEADROOM.md` — modes, decision rule, verify |
| Installing anything | `05_SAFETY_RULES.md` — hard rules; ask when a rule conflicts |
| Full worked examples of routing | `06_ROUTING_EXAMPLES.md` — 4 examples, not required reading |

Governance config: `config/agent_config.yaml` — providers enabled, structure.primary,
routing caps, safety confirmation requirements. Check enabled/verified before relying on any
provider.

## Repo-root note

Agents read `AGENTS.md` from the repo root. If this folder isn't at the root, keep a one-line
pointer there: "Read agents_orchestrator/AGENTS.md first and follow it for every task."
