# 11: Optional extras — OCR and lightweight ML classifier (Phase 7)

**What to build:** *Optional, only if time remains.* An extra capability beyond the deterministic
rule baseline — OCR screenshot scanning (`image_text` view, `ocr` provenance tag) and/or a
lightweight classifier/calibrator — that is clearly labelled optional and never blocks the demo.

**Blocked by:** 10 (packaging + release readiness) — Phase 7 work may only start after the Phase 6
DoD is fully met (S2 §6, timeboxing rule 3: OCR/ML never block the demo).

**Status:** ready-for-agent

Scope (Phase 7 of `docs/02_PHASE_PLAN_RISHABH.md` §10):

- OCR screenshot scanning feeding the `image_text` view with the `ocr` provenance tag — only after
  the DOM/AXTree pipeline is reliable.
- Lightweight classifier/calibrator (e.g. logistic regression, TF-IDF + linear model, or small
  embedding classifier) — must be compared against the transparent rule baseline; never train a
  large model.
- Always keep the deterministic path as the default.

- [ ] The extra works and is labelled optional/auxiliary in docs (and UI where applicable).
- [ ] The core demo still passes with the extra disabled.
- [ ] Classifier (if built) is compared against the rule baseline with honest numbers.
- [ ] No large-model training at any point.
