# 05 — Safety Rules

Hard rules. Not overridden by task pressure, hints short of explicit authorization, or "just
this once." Where confirmation is required, ask and wait. When a rule conflicts with what a
task seems to require, **the rule wins**: state the conflict in one line and ask the user.

## Secrets and sensitive data

- Never expose secrets, API keys, tokens, passwords, connection strings — in output, logs, or
  memory.
- Never read `.env`/secrets files unless the task requires it AND the user authorized it; if
  you must, read names/shape only — never echo values into context reaching external tools.
- Never store secrets or credential material in Mem0, lessons, logs, or committed config.

## External actions

- Never send source code, docs, or data to external services without authorization. Note:
  Graphify's doc/media semantic pass and Mem0's hosted platform both send content to an LLM —
  require user sign-off before enabling them; local modes don't.
- Never install software that wasn't checked against its official source (`01_INSTALLATION.md`)
  and confirmed by the user per `safety.require_confirmation_for_installation`.
- Never modify system-level configuration (shell profiles, OS settings, global tool config)
  without explicit authorization.

## Repository integrity

- Never delete files without explicit authorization.
- Never commit automatically. Never push — under any circumstances — unless the user asked.
- Never modify files unrelated to the task.
- Never hand-edit generated artifacts (`graft/`, `graphify-out/`) — regenerate them.

## Memory and isolation

- Never use memories, lessons, graphs, or context from another project. The reusable artifact
  is the orchestration rules — never the project data.
- Never treat historical memory (Mem0 or lessons) as current truth; the repository wins.
- Never blindly apply a previous solution without re-verifying it applies here and now.
- Never auto-store memory; writes are deliberate and confirmed per `agent_config.yaml`.

## Context and compression

- Never compress, summarize, or drop CRITICAL context — the current request, explicit
  requirements, security constraints, current errors and tests.
- Never let a compression layer decide what is true.
