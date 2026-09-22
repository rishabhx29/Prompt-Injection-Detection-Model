# 08 — Release checklist (AC-1…AC-12)

**Status:** complete on this checkout — every item below was verified by running it, not by reading
it. Reproduce with: `npm test`, `npm run test:contract`, `npm run typecheck`,
`npm run pack-check`, `npm run evaluate`.

- [x] **AC-1** API starts locally and `/health` responds → `npm start --workspace apps/protection-api`,
      `/health` returns exactly `{"status":"ok","service":"ctxvigil-protection-api","version":"0.1.0"}`.
- [x] **AC-2** Core SDK imports without running a server → `import { createCtxVigil } from "ctxvigil"`
      in a plain Node process with nothing else running.
- [x] **AC-3** `npm pack` artifact installs and works in a fresh local sample project →
      `npm run pack-check` (both tarballs installed in a throwaway project; runtime smoke
      `block 100 / block`; public types resolve under the project's own `tsc`).
- [x] **AC-4** CLI invokes the same core scanner and `--help` works → `npx ctxvigil scan --input …`
      prints the SDK's response; `--help` lists every flag. Parity is asserted per sample
      (FR-6.5, `tests/cli.test.ts`).
- [x] **AC-5** Contract-compliant `scan-page` request returns contract-shaped JSON → response keys are
      `scanId,riskScore,riskLevel,decision,summary,findings,safeContent,sanitizedContent,blockedContent`
      (contract §4.4–§4.6; asserted per fixture against `sample-data/EXPECTATIONS.json`).
- [x] **AC-6** Findings preserve view, source kind, selector, signal names, and reasons → e.g.
      `finding-1 | accessibility_tree | aria-label | #account-menu | instruction_override+… | high | 115`.
- [x] **AC-7** Score is stable and documented → identical requests byte-identify; integer 0–100,
      banded 0–29/30–59/60–79/80–100; documented in `packages/ctxvigil-core/README.md` as
      development-default weights, not validated thresholds (FR-4.9).
- [x] **AC-8** Content is sanitized before simulated agent access → `safeContent` carries only the
      approved spans; the agent context shows `[Blocked suspicious instruction from aria-label]`,
      never the injected instruction (FR-4.5–FR-4.7).
- [x] **AC-9** Action gate makes an independent decision → `checkAction` computes category, alignment,
      and posture without re-running the scan (FR-5.8): `block | allowed=false | confirm=false |
      riskScore=80 | reason=non-empty` for the attacker email-change on a refund task.
- [x] **AC-10** Required test cases pass → `npm test` 184/184 green; `npm run test:contract` 7/7.
- [x] **AC-11** API has clear setup instructions and sample requests → three package READMEs
      (`packages/ctxvigil-core`, `packages/ctxvigil-cli`, `apps/protection-api`); seven sample
      scan requests + four action checks under `sample-data/`.
- [x] **AC-12** No real browser account, credentials, or external action is required → all sample
      content is fictional (`*.test` domains, `localhost` fixtures — grep-checked); all actions are
      simulated (local state only); the core demo runs offline (NFR-2).
