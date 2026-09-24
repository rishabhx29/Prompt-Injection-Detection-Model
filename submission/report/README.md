# CtxVigil — DA2 Project Review Report

IEEE conference-format report covering the DA2 evaluation requirements:

| DA2 requirement | Where |
|---|---|
| 1. Proposed architecture + block diagrams | Fig. 1 (application), Fig. 2 (layer) |
| 2. Dataset / preprocessing | Section IV (Table I) |
| 3. Implementation + working demo pointers | Section V |
| 4. Results + evaluation metrics | Section VI (Tables II–V, Figs. 3–6) |
| 5. GitHub repository | linked in Section VII |

## Files

- `ctxvigil_da2_report.tex` — LaTeX source (IEEEtran conference class)
- `ctxvigil_da2_report.pdf` — compiled output (7 pages)
- `figures/` — all figures (regenerate data figures with the scripts in the repo)

## Compile

- **Overleaf**: upload this whole folder as a project, set the compiler to pdfLaTeX, recompile. No bibliography step needed.
- **Local**: `pdflatex ctxvigil_da2_report.tex` (twice, for cross-references). Requires `IEEEtran`, `graphicx`, `amsmath`, `amssymb`, `booktabs`.

## TODO before printing

Fill in the author block (marked with `% TODO` in the `.tex`):
Saumya's full name, roll numbers, institution, and guide name.
