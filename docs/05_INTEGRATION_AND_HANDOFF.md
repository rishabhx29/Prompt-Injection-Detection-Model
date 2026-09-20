# 05 — Integration and handoff

**Status:** v1
**Owners:** Rishabh and Saumya — joint
**Source:** S2 §5 (four checkpoints), S2 A5, S2 B5, S2 §9, S2 §10
**Traceability:** FR-7.1–FR-7.7

---

## 1. Purpose

This document is the **joint operating manual**. It answers three questions:

1. What exactly does each person hand to the other, and when?
2. What has to be true before frontend integration is allowed to start?
3. What do we do when a checkpoint fails?

The governing constraint comes from the build order (S1 §14):

```text
Fixtures → extraction → detection → scoring/policy → action gate → API tests
         → dashboard → evaluation → optional ML/OCR/packaging
```

The dashboard is **seventh**, not first. "This order ensures that the dashboard demonstrates a real
protection layer rather than a static UI mock-up." Contract tests must pass before frontend
integration begins.

---

## 2. The one rule that keeps this workable

> **Never change the API contract without telling the other student first.** (S2 §9)

"Telling" means a written diff in `docs/03_API_CONTRACT.md` plus a message, not a Slack aside or a
renamed field in a commit. The full procedure is `docs/03_API_CONTRACT.md` §11. Any change to field
names, enum values, or HTTP status semantics is **breaking** and requires all five steps.

Why this is strict: Saumya builds the dashboard against a frozen shape. A silently renamed field
breaks her work with no compile error and no obvious cause. The contract is the interface; the
interface is not allowed to move quietly.

---

## 3. What Rishabh hands to Saumya (S2 A5)

| # | Handoff item | Artefact in this repo | Delivered by |
|---|---|---|---|
| 1 | SDK package name, import example, build/start command | `packages/ctxvigil-core/README.md`; `docs/03_API_CONTRACT.md` §10 | Checkpoint 1 |
| 2 | Adapter base URL and start command | `apps/protection-api/README.md` (`http://localhost:8787`, one command) | Checkpoint 1 |
| 3 | Contract + `curl`/collection examples | `docs/03_API_CONTRACT.md`; a request collection or `curl` script | Checkpoint 1 |
| 4 | Example scan responses for **every** fixture scenario | `sample-data/scan-responses/` | Checkpoint 1 |
| 5 | Health endpoint | `GET /health` (contract §1.1) | Checkpoint 1 |
| 6 | Changelog whenever a response field changes | `CHANGELOG.md` (contract §11 step 3) | Ongoing |

Items 4 and 6 are the ones most often skipped and most often needed. Saumya must be able to render
findings **without a running server** while Rishabh is mid-refactor; that is what
`sample-data/scan-responses/` is for.

---

## 4. What Saumya hands to Rishabh (S2 B5)

| # | Handoff item | Where it lands | Delivered by |
|---|---|---|---|
| 1 | Fixture catalog with stable scenario IDs | `fixtures/<group>/<scenario>.json` (`fixtures/CONTRACT.md` §2) | Checkpoint 2 |
| 2 | Sample request JSON per fixture | Same files, `views` block | Checkpoint 2 |
| 3 | Expected decision/risk class per fixture | `expectedDecision`, `expectedRiskLevel` fields | Checkpoint 2 |
| 4 | Frontend feedback when API fields are unclear | Issue note or contract-change proposal | Ongoing |
| 5 | Screenshots/video and reproduction steps for integration bugs | Shared with the report material | Ongoing |

Item 4 is not a complaint channel — it is the mechanism that catches contract ambiguities before the
viva. If a field's meaning is unclear to the person rendering it, the doc that describes it is
deficient, and the fix is a doc edit, not a guess.

---

## 5. The four checkpoints (S2 §5)

### Checkpoint 1 — Contract test

**Proves:** frontend and API speak the same language, before any styling effort is spent.

| | |
|---|---|
| **Owner** | Joint |
| **Rishabh prepares** | Working adapter (`GET /health`, `POST /scan-page`, `POST /check-action`) + sample responses for every scenario |
| **Saumya does** | Sends **one static sample request** from the dashboard |
| **Both verify** | Field names, CORS, error shapes, score display |
| **Pass condition** | The dashboard renders a scan response from `safe-refund-page` (S2 §5) |
| **Gate** | Frontend integration may not begin until this passes. This is also the Phase 4 exit gate: all seven contract tests green. |

Checklist:

- [ ] `GET /health` returns `200` and the dashboard shows a live status.
- [ ] The request the dashboard sends is copied from `sample-data/scan-requests/safe-refund-page.json`,
      not hand-written.
- [ ] The response renders `riskScore`, `riskLevel`, `decision`, `summary`, `findings[]`,
      `safeContent`, `sanitizedContent`, `blockedContent`.
- [ ] CORS works from `http://localhost:5173` to `http://localhost:8787`.
- [ ] A deliberately malformed request produces `400` + `INVALID_REQUEST` and the dashboard shows an
      error state, not a crash.
- [ ] Killing the adapter makes the dashboard say "Protection scan unavailable" — and **not** imply
      safety (FR-7.5).

### Checkpoint 2 — Core security demo

**Proves:** the actual security claim.

| | |
|---|---|
| **Owner** | Joint |
| **Scenarios run** | `visible-injection`, `hidden-dom-injection`, `aria-injection`, `unrelated-account-action` |
| **Pass condition** | Every test produces a **correct explanation** and the action gate blocks the unsafe simulated action (S2 §5) |
| **Failure mode to watch** | A right answer with an unreadable explanation. That fails the checkpoint — explanation quality is the deliverable, not a nicety |

Checklist:

- [ ] Each scenario names the view (`visible_text`, `hidden_dom`, `accessibility_tree`) in its findings.
- [ ] Each finding shows `signals`, `severity`, and `scoreContribution`.
- [ ] The hidden ARIA case shows the attack in an `aria-label` or SR-only region **while the page
      looks normal** — the demo's central moment.
- [ ] `unrelated-account-action` blocks the action and the dashboard shows **which finding triggered
      the block** (FR-7.7).
- [ ] A blocked action produces **no local state change** (S2 B4).
### Checkpoint 3 — False-positive check

**Proves:** the prototype is not just "block everything hidden". This is the checkpoint that decides
whether the project has a defensible claim (S1 §13, S2 §5).

| | |
|---|---|
| **Owner** | Joint |
| **Scenarios run** | `benign-aria-label`, `safe-refund-page` |
| **Pass condition** | Benign content remains usable, and the score is **not** critical merely because ARIA text is present (S2 §5) |

Checklist:

- [ ] `benign-aria-label` is **not** `block`.
- [ ] Its imperative accessible label ("Submit application") is visible in the evidence panel but is
      not itself the reason for any finding.
- [ ] `safe-refund-page` scores `low` and its summary action is allowed.
- [ ] The benign fixture's normal submission action is allowed **or** requires confirmation for a
      defensible reason — never blocked merely for being an accessible control.
- [ ] Any remaining false positive is **written down**, not hidden (S2 §9: "Log false positives
      instead of hiding them; they are useful evidence for the report").

If this checkpoint fails, the honest fix is to loosen the detector combination rule (FR-3.11: require
conflict, risk, or source signals alongside imperative wording) — not to special-case the fixture.
Special-casing is explicitly forbidden (NFR-11, S2 §9).

### Checkpoint 4 — Final demo rehearsal

**Proves:** the presentation works offline, in order, on the actual machine, without heroics.

| | |
|---|---|
| **Owner** | Joint |
| **Action** | Run the exact script in `docs/07_DEMO_SCRIPT.md` (verbatim S2 §7) offline/local |
| **Pass condition** | End-to-end demo runs with no network, no cloud service, no credentials, and no hidden manual workaround (S2 §10) |
| **Follow-up** | Record bugs, then **freeze feature work one or two days before presentation** (S2 §5) |

Checklist:

- [ ] Wi-Fi off; the entire flow still works.
- [ ] All five scenarios in S2 §9's pre-demo list run: safe, visible, hidden-ARIA, action-deviation,
      benign-ARIA.
- [ ] Three essential scenarios can be presented in **under five minutes** (S2 B4).
- [ ] Reset demo returns every scenario to its initial state.
- [ ] A recording and screenshots exist as a fallback if the live demo fails.
- [ ] Feature freeze announced; only crash fixes after this point.

---

## 6. Checkpoint summary

| # | Name | Gate it represents | Hard pass condition |
|---|---|---|---|
| 1 | Contract test | Phase 4 exit → frontend integration | Dashboard renders `safe-refund-page` |
| 2 | Core security demo | The security claim | Correct explanation + blocked unsafe action |
| 3 | False-positive check | Credibility | Benign ARIA not blocked; safe page allowed |
| 4 | Final rehearsal | Presentation readiness | Offline run of the exact script; feature freeze |

**Ordering is not negotiable.** Checkpoint 2 cannot be attempted before Checkpoint 1 passes, because
"a correct result" is meaningless if the two halves are not exchanging the same JSON.

---

## 7. Timeline mapped to checkpoints (S2 §6)

| Week | Rishabh | Saumya | Checkpoint |
|---|---|---|---|
| 1 | Core SDK skeleton, exported types, sample JSON, health adapter | Project shell, fixture catalog, three basic pages | **CP1 prep** — contract frozen; direct import and API round-trip both work |
| 2 | Normalisation, detectors, first scoring rules | Safe / visible-attack / hidden-attack pages; dashboard shell | Visible and hidden attacks render correctly |
| 3 | Sanitisation, action gate, unit tests | API integration, findings panels, agent trace | **CP1** (all seven tests green) then **CP2** — unsafe action blocked from the dashboard |
| 4 | Improve false positives; evaluation export | Polish UX; settings-deviation and benign-ARIA fixtures | **CP3** — safe/benign ARIA remains functional |
| 5 | Bug fixes, SDK/CLI docs, `npm pack` install test | Demo rehearsal, screenshots, presentation flow | **CP4** — offline end-to-end demo; core package release-ready |

"If time is limited, finish Week 1–3 scope first. OCR and ML are only Week 5+ extras." (S2 §6)

The practical reading: **Checkpoints 1 and 2 are the project.** Everything after them is polish and
evidence. If a week slips, cut from Week 4–5, never from Week 1–3.

---

## 8. Working agreements

From S2 §9, restated as concrete habits:

| Rule | What it means in practice |
|---|---|
| Keep all fixture content safe and fictional | `example.test` domains/emails; local-only actions; no real accounts ever |
| Small, focused commits with descriptive messages | One concern per commit; do not mix a contract change with a refactor |
| Never change the contract without telling the other first | Written diff in `03_API_CONTRACT.md` + version bump + changelog (§2) |
| Keep examples separate from detection rules | Patterns describe a class; fixtures are instances (NFR-11, architecture §11.2) |
| Log false positives instead of hiding them | They are report evidence, and Checkpoint 3 exists to find them |
| Build deterministic demo paths before any real LLM | No LLM is required for the demo; the "agent" is template logic (S2 B3.7) |
| When one part is incomplete, use saved sample JSON | `sample-data/` is the unblock mechanism; neither person waits on the other |
| Before every joint demo, run the five cases | safe, visible, hidden-ARIA, action-deviation, benign-ARIA |

### 8.1 Weekly sync agenda (30 minutes)

1. Did the contract change? If yes, walk the diff together.
2. Which checkpoints are now reachable? Run them, or state the blocker precisely.
3. New false positives or false negatives observed — record them, do not hide them.
4. What does each person need from the other before the next sync?
5. Rotation note (S1 §11): both students must be able to explain the whole prototype in the viva.

---

## 9. When things go wrong

| Symptom | Likely cause | Response |
|---|---|---|
| Dashboard renders `undefined` everywhere | Contract drift — a field was renamed upstream | Compare against `sample-data/scan-responses/`; revert or formally change the contract |
| CORS error in the browser | Adapter CORS not scoped to the demo origin | Check the origin config in `apps/protection-api` (contract §1) |
| A fixture blocks that used to pass | Detector drift after a phrase-list edit | Re-run Checkpoint 3; never "fix" a fixture by weakening the rule for that fixture alone |
| A malicious fixture scores `low` | Signal combination rule too strict | Add the missing combination signal in the detector, not a special case for that page |
| Adapter starts but every scan returns `500` | Core threw on an unexpected input | Malformed input must be `400`/`INVALID_REQUEST`, not `500` (FR-6.8) |
| Demo fails on the presentation laptop | Environment assumption | Feature freeze plus a recorded fallback; re-verify CP4 on the actual machine |

**Never** resolve an integration failure by making the dashboard compute a fallback score, by making
the adapter re-implement a rule, or by weakening a fixture until it passes. Those three moves
invalidate the project's central claim.

---

## 10. Definition of finished (S2 §10)

The prototype is complete when all of the following hold. Both students sign off on every line.

| # | Condition | Verified at |
|---|---|---|
| 1 | The importable SDK classifies and explains the required test cases, sanitises dangerous content, and gates unsafe actions **without requiring a server** | CP1; `sample-data/EXPECTATIONS.json` |
| 2 | The packaged SDK installs successfully in a fresh local sample project; its CLI and HTTP adapter call the same core logic | Phase 6; FR-6.5 parity check |
| 3 | The local app renders multiple realistic fixture pages, calls the adapter, and visualises all responses clearly | CP2 |
| 4 | A hidden ARIA/DOM instruction is demonstrated as dangerous even when the page looks normal | CP2 |
| 5 | A safe page can be scanned and a safe task-aligned action allowed | CP3 |
| 6 | A source-triggered, unrelated account-setting action is blocked before any local state changes | CP2 |
| 7 | A benign accessibility label is not automatically blocked | CP3 |
| 8 | The whole demonstration runs locally and predictably without a cloud service, real credentials, or a hidden manual workaround | CP4 |

"Once these conditions hold, the team has a credible, presentable college experiment and a foundation
for later ML/OCR extensions." (S2 §10)

**Claim boundary (S2 §8):** describe this as a *controlled local prototype evaluation*. Do not claim
public-web prevalence, universal prompt-injection resistance, or a state-of-the-art benchmark result.