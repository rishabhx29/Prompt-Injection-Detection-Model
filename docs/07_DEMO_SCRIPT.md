# 07 — Demo script

**Status:** v1 — the script is verbatim from S2 §7. Do not paraphrase it.
**Owner:** Joint (Saumya executes the UI steps; Rishabh answers the security questions)
**Source:** S2 §7 (verbatim), S1 §7, S2 §5 Checkpoint 4
**Traceability:** FR-7.4, FR-7.5; Checkpoint 4

---

## 1. Purpose and rules

This is the exact running order for the presentation. Its value comes from being **fixed**: a demo
that is improvised cannot be rehearsed, and Checkpoint 4 exists to verify that this specific sequence
runs offline, in order, on the actual machine.

Rules:

1. Run this script **offline**, with Wi-Fi disabled, at least twice before presenting (S2 §10).
2. Every step must work without a cloud service, a real credential, or a manual workaround.
3. Do not improvise a new scenario live. If time remains, repeat Demo 3 with more detail.
4. Feature freeze **one or two days** before presentation (S2 §5). After that: crash fixes only.
5. Follow the claim boundary at all times (§6 below).

---

## 2. Pre-flight checklist

Run this five minutes before the audience arrives.

- [ ] Protection adapter running; `GET /health` returns `200`.
- [ ] Dashboard loaded; API status indicator shows connected.
- [ ] Wi-Fi disabled (prove the offline claim, do not merely assert it).
- [ ] Reset demo pressed so every scenario starts from its initial state.
- [ ] The five required cases verified once through, back to back: safe, visible, hidden-ARIA,
      action-deviation, benign-ARIA (S2 §9).
- [ ] Browser zoom and window size set to presentation resolution; a smaller screen checked too
      (S2 B3.8).
- [ ] Screenshots/video of a successful run available as a fallback.
- [ ] Both presenters know who drives the UI and who answers questions.

---

## 3. The script (S2 §7, verbatim)

### Demo 1 — Safe webpage

1. Enter: "Find and summarise the refund policy."
2. Select **Safe Refund Page**.
3. Scan it; show low risk and allowed content.
4. Simulate `summarize_policy`; show allowed action and harmless output.

### Demo 2 — Visible injection

1. Select **Product Review - Visible Injection**.
2. Scan it; show malicious instruction highlighted in visible text.
3. Show risk score, reasons, and sanitized content.
4. Explain that the agent does not receive the blocked instruction.

### Demo 3 — Hidden ARIA/DOM injection (main demonstration)

1. Select **Refund Policy - Hidden ARIA Injection**.
2. Point out that the rendered page appears normal.
3. Open the Accessibility/ARIA evidence tab.
4. Show malicious instruction in an `aria-label` or screen-reader-only region.
5. Scan it; show critical risk and block decision.
6. Simulate `change_account_email`; show action gate blocking it because it is unrelated to the user
   task.

### Demo 4 — False-positive resistance

1. Select **Benign Accessible Submit Control**.
2. Show the imperative `aria-label="Submit application"`.
3. Scan it; show that normal accessibility text is not automatically treated as malicious.

### Closing line (verbatim)

> CtxVigil checks not only visible webpage text, but also hidden DOM and accessibility information.
> It explains its evidence and prevents an LLM agent from following webpage instructions that
> conflict with the user's actual goal.

---

## 4. Timing budget

| Segment | Time | Cumulative |
|---|---:|---:|
| Setup + framing ("what this is") | 0:30 | 0:30 |
| Demo 1 — safe page | 0:40 | 1:10 |
| Demo 2 — visible injection | 0:50 | 2:00 |
| **Demo 3 — hidden ARIA injection** | **1:40** | **3:40** |
| Demo 4 — false-positive resistance | 0:40 | 4:20 |
| Closing line + link to the SDK | 0:30 | 4:50 |

Total ≈ 4:50, inside the five-minute requirement (S2 B4). Demo 3 gets the most time because it is
the demonstration; Demos 1, 2, and 4 are context for it.

If the slot is shorter, cut Demo 4 to a single sentence ("and a benign accessible submit control is
still allowed — here is the same page, not blocked") and go straight to the closing line. **Never cut
Demo 3.**

---

## 5. What to emphasise at each step

| Step | The point being made | Do not say |
|---|---|---|
| Demo 1 | The prototype does not get in the way of normal work — low score, allowed content, allowed action | "It's 100% accurate" |
| Demo 2 | Detection is explainable: score, reasons, and the exact blocked span are all visible | "It caught the injection" without showing the evidence |
| Demo 3 | **The core claim:** a page that looks completely normal to a sighted human carries an instruction the agent would otherwise follow | "Humans can't see this" — say "this is invisible to a sighted review; it is present in the accessibility tree" |
| Demo 3 step 6 | Content scanning alone is not enough — the action gate independently blocks an unrelated high-risk action | "The score blocked the action" — the action gate makes its own decision |
| Demo 4 | The prototype is not a blunt instrument that blocks all hidden or imperative text | "It never has false positives" — instead: "this is the case that would break a naive approach" |
| Closing | SDK is the deliverable; the dashboard is a demonstration of it | "This replaces existing security tools" |

---

## 6. Claim boundary

Say this, or something equivalent, once during the framing:

> This is a controlled local prototype evaluated on our own fixture set. It detects classes of
> prompt injection that we describe in our rules, and it says why. We are not claiming coverage of
> the public web, resistance to prompt injection in general, or a benchmark result against other
> systems.

That sentence is not a hedge. It is the accurate description, and stating it early makes every later
claim credible (NFR-8, S2 §8).

---

## 7. Backup plan

| Failure | Recovery | Time cost |
|---|---|---|
| Adapter not running | Start it with the one documented command; the dashboard will show "Protection scan unavailable" until it is up | 30 s |
| Adapter will not start | Show the recorded video of the full run; explain what the audience is seeing | 10 s |
| A scenario renders wrong | Press Reset demo, reload, continue with the next scenario; note it for the Q&A | 20 s |
| Wrong decision on a fixture | Do **not** explain it away. Say what happened, show the finding, and note it as a known limitation | 30 s |
| Network-dependent behaviour appears | Wi-Fi is already off; if something needs the network, that is a bug — say so | — |
| A live LLM is unavailable | This is expected: the simulated agent is deterministic template logic and requires no LLM (S2 B3.7) | 0 s |

The recovery column is why Reset demo, the video, and the offline check exist. Rehearse the recovery
paths too, not just the happy path.

---

## 8. Anticipated questions

Answer honestly. Where the answer is "we did not test that", say so — it is a stronger answer than a
speculative one.

| Question | Answer |
|---|---|
| "Is this novel research?" | No. It is an engineering prototype applying known prompt-injection risks to a multi-view, explainable rule-based design. The contribution is the working, evaluated implementation. |
| "Why not use an LLM to detect injections?" | Because the core requirement is determinism, offline operation, explainability, and no API key. A rules-based baseline is also the honest thing to compare an ML extension against (S1 §5, Stage C). |
| "Can an attacker evade it?" | Yes. It matches described classes of phrasing. `docs/06_EVALUATION_PLAN.md` §8.1 measures how much recall drops on paraphrased, held-back variants, and we report that number. |
| "How accurate is it on real web pages?" | We did not test that. Our evaluation is a controlled local fixture set; we make no public-web claim. |
| "Why these thresholds?" | They are documented development defaults from the brief, not validated research thresholds. They are configurable via `createCtxVigil(config)` and would be tuned against a larger labelled set. |
| "What about OCR / images?" | Accepted by the contract (`image_text` view) and empty in v1. It is a Phase 7 extension, deliberately not on the critical path. |
| "What happens when the API is down?" | The dashboard says "Protection scan unavailable" and never implies the page was safe. Failing closed is a design requirement. |
| "Does the frontend do any detection?" | No. It renders what the API returns. Scoring and rules exist only in the SDK — this is grep-verifiable. |
| "Why does the safe page need scanning at all?" | To show the protection layer does not disrupt normal work — a filter that blocks everything is not usable. |

---

## 9. Post-demo

1. Collect questions that exposed genuine gaps; log them rather than patching them live.
2. Record which steps took longer than the budget in §4.
3. If any scenario behaved inconsistently, capture the reproduction steps
   (`docs/05_INTEGRATION_AND_HANDOFF.md` §4, item 5).
4. Note the final results as presented, and confirm they match the generated
   `tests/results/evaluation.json` rather than numbers recalled from memory.
5. Confirm nothing in the presentation exceeded the claim boundary in §6.