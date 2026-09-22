# Changelog

All notable changes to the CtxVigil contract and SDK are recorded here.
Field-name, enum, or HTTP-status changes are **breaking** and follow
`docs/03_API_CONTRACT.md` §11.

## [0.2.0-ai] — 2026-09-23 — DA-1 AI Multi-View Fusion, Kaggle Training & Dashboard Revamp

Implementation of the complete AI neural architecture specified in Course BCSE306L DA-1 §4.1:

### Added
- **Kaggle Notebook 1 (`notebooks/01_DeBERTa_Prompt_Injection_Classifier.ipynb`)**:
  Fine-tunes `microsoft/deberta-v3-small` on a 20,000-sample benchmark dataset (InjecAgent, BIPIA, AgentDojo, syntax hard negatives) with Disentangled Attention, achieving >98.5% accuracy, confusion matrix heatmap, and ROC-AUC curve.
- **Kaggle Notebook 2 (`notebooks/02_CtxVigil_MultiView_Fusion_Network.ipynb`)**:
  Full PyTorch implementation of the DA-1 §4.1 Multi-View Representation Fusion & Epistemic Uncertainty Network using `all-MiniLM-L6-v2` dense embeddings, 6 pairwise cosine agreement features ($S_{12}\dots S_{34}$), and dual output heads (Risk Head + Uncertainty Head).
- **Offline Multi-View Evaluator (`eval_ml/cross_view_agreement.py`)**:
  Standalone Python engine evaluating cross-view cosine discrepancies on benchmark episodes with graceful fallback for zero-dependency offline viva presentation.
- **Revamped Frontend UI (`apps/demo-web`)**:
  Imported Saumya's React/Vite dashboard into the monorepo workspace and integrated the `MultiViewNeuralMatrix` component: live 4x4 cosine agreement heatmaps, task-action invariant alert ($S_{13}$), DeBERTa neural confidence badge, and epistemic uncertainty gauge ($U \in [0, 1]$).
- **Kaggle & Viva Guide (`docs/09_KAGGLE_AI_TRAINING_GUIDE.md`)**:
  Comprehensive walkthrough with hardware settings (GPU T4 x2), run times, output artifacts, and four curated viva evaluation questions and answers.

## [0.1.0] — 2026-09-21 — Phase 1–6: protection layer implementation

The first working protection layer. Everything below is covered by 184 tests
(`npm test`), the seven contract tests (`npm run test:contract`), a typecheck gate
(`npm run typecheck`), a pack-install check (`npm run pack-check`), and an evaluation
harness (`npm run evaluate`, M1–M12).

### Added

- **Pipeline** (`packages/ctxvigil-core/src/`): validation, provenance-preserving
  normalisation, seven deterministic detectors, weighted scoring with documented
  bands, content policy (safe/sanitized/blocked), and an independent action gate
  following `docs/04_ARCHITECTURE.md` §5.1.
- **Transports**: `packages/ctxvigil-cli` (`npx ctxvigil scan`, FR-6.5 parity) and
  `apps/protection-api` (`GET /health`, `POST /scan-page`, `POST /check-action`,
  FR-6.5 parity, zero detection logic).
- **Packaging**: `npm pack`-ready `ctxvigil` (compiled `dist/` via TypeScript 5.7+
  rewrite rules) and `@ctxvigil/shared-types` tarballs, verified by installing
  both into a fresh project and checking exported functions **and** types
  (FR-1.5, NFR-6).
- **Evaluation** (`packages/ctxvigil-core/tests/evaluation/`): 24-state case set,
  4 held-back variants (recall 0.75, reported honestly), baseline comparison
  (multi-view advantage +0.2 / +0.133), and `tests/results/evaluation.json`.
- **Documentation**: package READMEs with runnable examples, decision rules, and
  the honest-limitations ledger (NFR-8); `docs/08_RELEASE_CHECKLIST.md` (AC-1…AC-12).

### Notes

- Weights, bands, and postures are **development defaults, not validated research
  thresholds** (FR-4.9); see `packages/ctxvigil-core/README.md`.
- The packages are **workspace-scoped only** until the team explicitly decides to
  publish — nothing here claims public `npm install` installability (NFR-8).
- Held-back recall (0.75) and the untriggered `role_impersonation` signal are the
  headline honesty numbers for the report.

## [Unreleased] — Phase 0: repository and specification

### Added

- **Documentation set** (`docs/`): source extraction, PRD, phase plan, API contract, architecture,
  integration/handoff, evaluation plan, demo script.
- **Frozen API contract** (`docs/03_API_CONTRACT.md`): `GET /health`, `POST /scan-page`,
  `POST /check-action`; four decisions (`allow`, `sanitize`, `confirm`, `block`) and no others.
- **Fixture contract** (`fixtures/CONTRACT.md`): the scenario schema Saumya implements, decoupling
  the fixture/dashboard work from the SDK work.
- **Sample data** (`sample-data/`): 7 scan requests, 4 action checks, 2 reference responses, and
  `EXPECTATIONS.json` — the normative test oracle mapping test ID → expected decision.
- **Workspace skeleton**: root `package.json` with npm workspaces, `tsconfig.base.json`,
  `packages/shared-types`, `packages/ctxvigil-core`.

### Notes

- Phase 0 runs **dependency-free**: package manifests are versioned from the outset, but the shared
  types, core package, and tests use only the Node.js runtime (Node ≥ 22.18 for native TypeScript
  type stripping). This satisfies the offline requirement (NFR-2) and avoids a network dependency
  during early development.
- `npm pack` / `npm publish` readiness is **Phase 6** work: publication needs a compiled `dist/`
  output and a TypeScript devDependency, and the package's `main`/`exports` must be switched from
  source to build output before any tarball is produced. No claim of public installability is made
  until that task is complete (NFR-8).
