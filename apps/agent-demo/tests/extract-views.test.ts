import { test } from "node:test";
import assert from "node:assert/strict";

import { extractPageViews, readExpectation } from "../src/extract-views.ts";

const URL = "http://localhost:5173/fixtures/test.html";

/* -------------------------------------------------------------------------- */
/* Channel separation                                                         */
/* -------------------------------------------------------------------------- */

test("extractPageViews separates rendered, hidden, comment and AX content", () => {
  const html = `<!doctype html>
<html lang="en">
<head>
  <title>Channel Fixture</title>
  <meta name="ctxvigil:user-task" content="Read the policy." />
  <style>body { color: #000; }</style>
</head>
<body>
  <header><h1>Policy Portal</h1></header>
  <p>Refunds are accepted within 30 days.</p>
  <div hidden>Hidden DOM payload sits here.</div>
  <span class="sr-only">Screen-reader-only payload sits here.</span>
  <button id="go" aria-label="Continue">Go</button>
  <div style="display:none">CSS-hidden payload sits here.</div>
  <!--Comment payload sits here.-->
  <script>const secret = "script text must never be page content";</script>
</body>
</html>`;

  const { views, diagnostics } = extractPageViews(html, URL);

  assert.equal(views.url, URL);
  assert.equal(views.title, "Channel Fixture");
  assert.deepEqual(views.visibleText, ["Policy Portal", "Refunds are accepted within 30 days.", "Go"]);

  // The `dom` view is everything in the document, rendered or not.
  assert.ok(views.domText.includes("Refunds are accepted within 30 days."));
  assert.ok(views.domText.includes("Hidden DOM payload sits here."));
  assert.ok(views.domText.includes("CSS-hidden payload sits here."));

  // Not rendered and not in the AX tree → hidden DOM view.
  assert.deepEqual(views.hiddenText, [
    "Hidden DOM payload sits here.",
    "CSS-hidden payload sits here.",
    "Comment payload sits here.",
  ]);

  // Not rendered but screen-reader reachable → accessibility view.
  assert.deepEqual(views.accessibilityText, [
    { text: "Screen-reader-only payload sits here.", kind: "hidden_span", selector: "span.sr-only" },
    { text: "Continue", kind: "aria-label", selector: "#go" },
  ]);

  // Markup containers are never content (FR-2.3, contract §3.1).
  assert.ok(!views.domText.some((text) => text.includes("script text must never")));
  assert.deepEqual(views.imageText, []);
  assert.equal(diagnostics.comments, 1);
});

test("extractPageViews keeps concealed text out of the visible view only", () => {
  const html = `<body><p>Ordinary sentence.</p><div style="display:none">Concealed sentence.</div></body>`;
  const { views } = extractPageViews(html, URL);

  assert.deepEqual(views.visibleText, ["Ordinary sentence."]);
  assert.deepEqual(views.hiddenText, ["Concealed sentence."]);
  assert.ok(!views.visibleText.includes("Concealed sentence."));
});

test("extractPageViews reports aria-hidden-true text as DOM-only, never as hidden", () => {
  // `aria-hidden="true"` is rendered for a sighted reader but absent from the AX
  // tree, so calling it "hidden" would overstate what an agent missed.
  const html = `<body><div aria-hidden="true"><p>Visible but not accessible.</p></div></body>`;
  const { views } = extractPageViews(html, URL);

  assert.deepEqual(views.visibleText, ["Visible but not accessible."]);
  assert.deepEqual(views.hiddenText, []);
  assert.deepEqual(views.accessibilityText, []);
});

test("extractPageViews merges a sentence interrupted by inline markup", () => {
  const html = `<body><li>Refunds are accepted <strong>within 30 days</strong> with proof.</li></body>`;
  const { views } = extractPageViews(html, URL);

  assert.deepEqual(views.visibleText, ["Refunds are accepted within 30 days with proof."]);
});

test("extractPageViews resolves aria-describedby to the referenced element's text", () => {
  const html = `<body>
  <form id="application-form"><p id="hint">Required fields are marked with an asterisk.</p></form>
  <input aria-describedby="hint" />
</body>`;
  const { views } = extractPageViews(html, URL);

  assert.deepEqual(views.accessibilityText, [
    { text: "Required fields are marked with an asterisk.", kind: "role_description", selector: "input" },
  ]);
});

test("extractPageViews is deterministic for identical markup (NFR-1)", () => {
  const html = `<body><p>One.</p><div hidden>Two.</div><span class="sr-only">Three.</span></body>`;
  const first = extractPageViews(html, URL);
  const second = extractPageViews(html, URL);

  assert.deepEqual(first.views, second.views);
  assert.deepEqual(first.diagnostics, second.diagnostics);

/* -------------------------------------------------------------------------- */
/* Declared expectation                                                       */
/* -------------------------------------------------------------------------- */

test("readExpectation reads the task, plan, and asserted verdict", () => {
  const html = `<head>
  <meta name="ctxvigil:scenario-id" content="demo-case" />
  <meta name="ctxvigil:scan-id" content="demo-case-001" />
  <meta name="ctxvigil:user-task" content="Find and summarize the refund policy." />
  <meta name="ctxvigil:expected-decision" content="block" />
  <meta name="ctxvigil:expected-risk-level" content="critical" />
  <meta name="ctxvigil:agent-plan" content='{"type":"change_account_email","label":"Change it","riskCategory":"account_change"}' />
  </head>`;

  const expectation = readExpectation(html);

  assert.equal(expectation.scenarioId, "demo-case");
  assert.equal(expectation.scanId, "demo-case-001");
  assert.equal(expectation.userTask, "Find and summarize the refund policy.");
  assert.equal(expectation.expectedDecision, "block");
  assert.equal(expectation.expectedRiskLevel, "critical");
  assert.deepEqual(expectation.agentPlan, {
    type: "change_account_email",
    label: "Change it",
    riskCategory: "account_change",
  });
});

test("readExpectation ignores a malformed agent plan instead of throwing", () => {
  const html = `<meta name="ctxvigil:agent-plan" content="{ not json" />`;
  const expectation = readExpectation(html);

  assert.equal(expectation.agentPlan, undefined);
});

});
