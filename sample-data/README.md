# Sample data — how to use it

This directory is the shared, offline handoff between Rishabh (protection layer) and Saumya
(dashboard). **Nothing here needs a server.** Both students can work from these files at any time
(S2 §4.4).

---

## 1. Layout

```text
sample-data/
  README.md                 ← this file
  EXPECTATIONS.json         ← normative expected decisions per test ID
  scan-requests/            ← seven POST /scan-page request bodies
    safe-refund-page.json
    visible-injection.json
    hidden-dom-injection.json
    aria-injection.json
    benign-aria-label.json
    unrelated-account-action.json
    task-aligned-summary-action.json
  scan-responses/           ← reference responses (shape examples; numbers illustrative)
    aria-injection.response.json
    safe-refund-page.response.json
  action-checks/            ← POST /check-action request bodies
    aria-injection-change-email.json
    unrelated-account-action-change-email.json
    task-aligned-summary-action-summarize.json
    benign-aria-label-submit.json
```

Every file in `scan-requests/` and `action-checks/` is a **verbatim contract body**: paste it
straight into a request. Field names, nesting, and enum values are frozen by
`docs/03_API_CONTRACT.md`.

---

## 2. The seven contract test IDs (S2 A3.8)

| Test ID | Scan request | Expected scan result |
|---|---|---|
| `safe-refund-page` | `scan-requests/safe-refund-page.json` | `riskLevel: low`, `decision: allow` |
| `visible-injection` | `scan-requests/visible-injection.json` | high/critical; blocked span; finding `view: visible_text` |
| `hidden-dom-injection` | `scan-requests/hidden-dom-injection.json` | high/critical; finding `view: hidden_dom` |
| `aria-injection` | `scan-requests/aria-injection.json` | high/critical; finding `view: accessibility_tree` |
| `benign-aria-label` | `scan-requests/benign-aria-label.json` | **not** blocked solely for the imperative accessible label |
| `unrelated-account-action` | `scan-requests/unrelated-account-action.json` | scan completes; action check blocks |
| `task-aligned-summary-action` | `scan-requests/task-aligned-summary-action.json` | low risk; action check allows |

Action expectations live in `EXPECTATIONS.json` and in `docs/06_EVALUATION_PLAN.md`.

---

## 3. Using the samples

### As a library consumer (Saumya's dashboard)

```ts
// Load a request body, POST it, render the response.
const request = await fetch("/sample-data/scan-requests/aria-injection.json").then(r => r.json());
const response = await fetch("http://localhost:8787/scan-page", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(request)
});
```

If that fetch fails or returns non-200, show **"Protection scan unavailable"** and never imply the
page was safe (S2 §4.4).

### As a library consumer (Rishabh's tests)

```ts
import request from "../sample-data/scan-requests/aria-injection.json" assert { type: "json" };
const scan = await scanPage(request);
// assert against EXPECTATIONS.json
```

### From the CLI

```bash
npx ctxvigil scan --input sample-data/scan-requests/aria-injection.json
```

---

## 4. Rules for adding sample data

1. Add the file here **first**, then write the test that consumes it.
2. Every scan request must include `scanId`, `userTask`, and `page`.
3. All content arrays are optional but should be present (`[]` when empty) so the shape stays
   obvious.
4. All fixture data must be fictional: `*.test` domains and emails only, and actions simulated
   locally (NFR-9, S2 §9).
5. Never hard-code these sentences as special cases in detection rules — they are examples, not
   rules (S2 §9, NFR-11).
6. Numeric values in `scan-responses/` are illustrative. Field names and enum members are
   normative; numbers are not.

---

## 5. Naming reconciliation (test ID vs. scan ID vs. fixture ID)

Three identifiers exist and they are **not** the same thing:

| Identifier | Where it lives | Meaning |
|---|---|---|
| **test ID** | `docs/01_PRD.md` §6.1, this README §2, `EXPECTATIONS.json` `tests[].testId` | The label used by the seven contract tests. Stable, frozen. |
| **fixture / scenario ID** | `fixtures/<group>/<scenario>.json` `id` | Saumya's stable page ID, kebab-case. See `fixtures/CONTRACT.md` §3. |
| **`scanId`** | The wire field in a `POST /scan-page` body | Free-form correlation string chosen by the caller. **Not** a test ID and **not** validated against any list. |

`sample-data/scan-requests/aria-injection.json` carries `"scanId": "refund-aria-attack-001"`
because it is copied verbatim from the S2 §4.1 contract example, whose fixture is
`refund-aria-attack`. This is correct and intentional:

- The test ID for that case is `aria-injection` (what the test harness asserts against).
- The fixture ID is `refund-aria-attack` (`fixtures/CONTRACT.md` §3, row 3).
- The `scanId` on the wire is `refund-aria-attack-001`, an opaque correlation handle.

The other six requests happen to use `scanId` equal to their test ID, which is also legal. Neither
form is privileged. **Tests must key off `EXPECTATIONS.json`, never off `scanId`.** If you rewrite
a `scanId`, nothing breaks; if you rewrite a `testId` in `EXPECTATIONS.json`, the harness breaks.

### 5.1 `unrelated-account-action` expected scan decision

S2 A3.8 states for this case only that the action is blocked; it does not fix a scan decision. The
source page redirects a policy task toward an account change, so `task_conflict` is expected to fire
and push the score into the medium/high range. Accordingly `EXPECTATIONS.json` deliberately asserts
**no** `riskLevel` or `decision` for this test — only the action-gate outcome
(`actionDecision: block`). The scan must still complete successfully with a non-empty `reason`.

This is a deliberate assertion gap, not an oversight. Do not tighten it without a contract change
(`docs/03_API_CONTRACT.md` §11).