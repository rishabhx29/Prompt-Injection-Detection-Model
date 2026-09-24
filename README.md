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

**Protection layer implemented and green.** The frozen contract is unchanged; the SDK, CLI, and
optional HTTP adapter all walk one pipeline (`validate → normalise → detect → score → policy →
action gate`), and the seven contract tests are the gate for dashboard integration.

| Artefact | State |
|---|---|
| `docs/00`–`docs/07` | Complete (specification phase) |
| `packages/ctxvigil-core/` | **Implemented** — SDK pipeline + 145 tests ([README](packages/ctxvigil-core/README.md)) |
| `packages/shared-types/` | **Implemented** — contract types only |
| `packages/ctxvigil-cli/` | **Implemented** — CLI over the SDK ([README](packages/ctxvigil-cli/README.md)) |
| `apps/protection-api/` | **Implemented** — optional HTTP transport ([README](apps/protection-api/README.md)) |
| The seven contract tests | **Green** — `npm run test:contract` (the Checkpoint 1 gate) |
| `apps/demo-web/`, `fixtures/` | Saumya — not built here |
| Evaluation tables | Phase 6 (ticket 09); `npm test` writes observed results to `tests/results/` |
| `npm pack` / install verification | Phase 6 (ticket 10) |

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

---

## DA1 artifacts

Earlier DA-1 deliverables live at the repo root: `DA1 AI (Prompt injection model ).docx`
(the DA-1 report), `data/` (dataset loaders), and `diagrams/` (DA-1 architecture figures).
The DA-2 review report (IEEE conference format, with architecture diagrams and evaluation
figures) is in [`submission/report/`](submission/report/).
