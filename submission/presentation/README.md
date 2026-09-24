# CtxVigil — DA2 Presentation Decks

One faculty-presentation deck per DA2 evaluation requirement, built only from
verifiable material (notebook cells, repo artifacts, and runnable commands —
every slide carries a small gray "source" note).

| DA2 requirement | Deck |
|---|---|
| 1. Proposed Project Architecture | `01_architecture.pdf` — block + detailed diagrams, component walkthrough, input→output data flow, tech/hardware stack |
| 2. Data Collected / Dataset Used | `02_dataset.pdf` — all three self-collected datasets: composition, classes, collection code, preprocessing, splits, verifiability map |
| 4. Results and Evaluation Metrics | `04_results.pdf` — classifier metrics + confusion matrix/ROC, fusion network results, rule-layer fixture table, live-episode latency, honest limitations |
| 3. Implementation & working demo | demonstrated live (`npm run demo:web`, `npm run agent:demo`, `npm run agent:chat`) |
| 5. GitHub repository | https://github.com/rishabhx29/Prompt-Injection-Detection-Model |

Sources (`.tex`) are alongside each PDF; figures come from `../report/figures/`
(the two architecture diagrams are editable `.drawio` files there).
Recompile locally with `pdflatex <deck>.tex` (twice for references) or on Overleaf.
