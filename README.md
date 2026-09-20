# CtxVigil

**A multi-view prompt-injection protection layer for LLM web agents.**

CtxVigil sits between an AI agent and the untrusted content it reads. It scans that content
through multiple representations (visible text, DOM/hidden DOM, accessibility tree / ARIA, and
later OCR), detects possible prompt injection and task deviation, and returns a risk score with
an `allow` / `sanitize` / `confirm` / `block` decision — plus the evidence behind it.

The **product is the reusable npm SDK** (`ctxvigil`). The local dashboard is only the
presentation layer for the college demonstration.

> Positioning used in the report/presentation (do not overclaim):
> *"A practical, explainable multi-view protection-layer prototype for detecting prompt injection
> and checking task alignment in LLM web agents."*

---

## Repository layout

```text
CtxVigil/
  Required/                  # Source-of-truth briefs (read-only input)
    PROTOTYPE_BUILD_CONTEXT.md
    TEAM_DEVELOPMENT_PLAN.md
  docs/                      # All planning, contract, and architecture docs
    00_SOURCE_EXTRACTION.md
    01_PRD.md
    02_PHASE_PLAN_RISHABH.md
    03_API_CONTRACT.md
    04_ARCHITECTURE.md
    05_INTEGRATION_AND_HANDOFF.md
    06_EVALUATION_PLAN.md
    07_DEMO_SCRIPT.md
  packages/
    ctxvigil-core/           # Rishabh — publishable SDK + tests (primary deliverable)
    ctxvigil-cli/            # Rishabh — CLI over ctxvigil-core
    shared-types/            # Joint — contract types only
  apps/
    protection-api/          # Rishabh — thin HTTP adapter over ctxvigil-core
    demo-web/                # Saumya — fixtures + dashboard (built separately)
  fixtures/                  # Saumya — fixture pages + catalog (see fixtures/CONTRACT.md)
    CONTRACT.md              # the fixture schema Saumya implements
  sample-data/
    README.md                # how to use the samples
    EXPECTATIONS.json        # normative expected outcome per test ID (the test oracle)
    scan-requests/           # Contract-exact request JSON, usable by both sides
    scan-responses/          # Reference response JSON (field names normative, numbers illustrative)
    action-checks/           # Contract-exact /check-action request JSON
  agents_orchestrator/       # Project-local AI agent instruction layer
```

`packages/*` and `apps/protection-api` are created in Phase 1 of
[`docs/02_PHASE_PLAN_RISHABH.md`](docs/02_PHASE_PLAN_RISHABH.md). `apps/demo-web` and
`fixtures/` are Saumya's; this repo only reserves the agreed path and schema
([`fixtures/CONTRACT.md`](fixtures/CONTRACT.md)).

---

## Ownership boundary

| Area | Owner |
|---|---|
| Detection, scoring, policy, sanitisation, action gate, SDK exports, CLI, HTTP adapter, tests, SDK/API docs | Rishabh |
| Fixture pages/content, dashboard UI, UX states, demo script execution, screenshots | Saumya |
| API contract (`docs/03_API_CONTRACT.md`), shared types, evaluation, report, final demo | Both |

**Boundary rule (S2 §1):** neither person silently changes the shared SDK/API contract. Contract
changes are made in `docs/03_API_CONTRACT.md` first.

---

## Start here

| If you want to… | Read |
|---|---|
| Know exactly what the two briefs said | `docs/00_SOURCE_EXTRACTION.md` |
| Know what is being built and why, with numbered requirements | `docs/01_PRD.md` |
| Know the week-by-week build order and definition of done | `docs/02_PHASE_PLAN_RISHABH.md` |
| Build against the API without guessing field names | `docs/03_API_CONTRACT.md` + `sample-data/scan-requests/` |
| Understand the pipeline internals | `docs/04_ARCHITECTURE.md` |
| Prepare for the joint demo/integration | `docs/05_INTEGRATION_AND_HANDOFF.md`, `docs/07_DEMO_SCRIPT.md` |
| Reproduce or write up results | `docs/06_EVALUATION_PLAN.md` |

---

## Current status

**Specification phase complete.** All seven planning documents are written; the API contract is
frozen; sample request/response JSON and the normative expectation manifest exist. No source code has
been written yet — implementation begins at Phase 0
([`docs/02_PHASE_PLAN_RISHABH.md`](docs/02_PHASE_PLAN_RISHABH.md) §3).

| Artefact | State |
|---|---|
| `docs/00`–`docs/05` | Complete |
| `docs/06_EVALUATION_PLAN.md` | Complete — plan only; produces no numbers until Phase 6 |
| `docs/07_DEMO_SCRIPT.md` | Complete — script verbatim from S2 §7 |
| `fixtures/CONTRACT.md` | Complete — Saumya can build fixtures in parallel from this alone |
| `sample-data/` | 7 scan requests, 4 action checks, 2 reference responses, 1 expectation manifest |
| `packages/`, `apps/` | **Not started** (Phase 0 onward) |

Quoted requirement text throughout `docs/` is preserved verbatim from `Required/` so the traceability
in `docs/00_SOURCE_EXTRACTION.md` §24–§25 can be checked against the originals.

---

## Non-negotiable safety constraints

- All fixture content is fictional. Use `*.test` domains and `.test` email addresses.
- All actions are simulated; they mutate only local UI/sandbox state.
- No real accounts, credentials, payments, emails, or data exfiltration at any point.
- The core demonstration must run offline with no paid LLM API and no API key.
- If the protection API is unavailable, the dashboard must say "Protection scan unavailable" and
  must **not** imply the page was safe.
