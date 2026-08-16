# Prompt-Injection Detection for LLM-Integrated Web Applications

**Course:** BCSE306L — B.Tech (Artificial Intelligence)  
**Team:** Saumya (24BRS1065) | Rishabh Tripathi (24BRS1136)

## What This Project Is About

LLM-based web agents (browser copilots, email assistants, etc.) consume untrusted web content while performing actions for users. Prompt injection happens when someone hides malicious instructions inside that content to hijack the agent. This project builds a detection system that looks at the same webpage through multiple representations (DOM, visible text, accessibility tree, screenshot) and flags suspicious cross-representation disagreements before the agent takes any high-impact action.

## Repository Structure

```
.
├── data/
│   └── load_datasets.py      # Downloads and loads benchmark datasets
├── diagrams/
│   ├── architecture_block_diagram.png
│   └── detailed_model_diagram.png
├── DA1 AI (Prompt injection model).docx   # DA-1 report
├── requirements.txt
├── .gitignore
└── README.md
```

## Datasets Used

| Dataset | Size | Source |
|---------|------|--------|
| InjecAgent | 1,054 test cases, 17 user + 62 attacker tools | [GitHub](https://github.com/uiuc-kang-lab/InjecAgent) |
| BIPIA | 626,250 train + 86,250 test prompts | [GitHub](https://github.com/microsoft/BIPIA) / [HuggingFace](https://huggingface.co/datasets/Shu0924/Indirect-Prompt-Injection-BIPIA-GPT) |
| AgentDojo | 97 tasks, 629 security test cases | [GitHub](https://github.com/ethz-spylab/agentdojo) |
| WASP | End-to-end web agent environment | [GitHub](https://github.com/facebookresearch/wasp) |

## How to Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Download / load datasets
python data/load_datasets.py
```

## Current Status

- [x] DA-1: Problem identification, literature survey, architecture
- [ ] DA-2: Implementation and baseline comparison
- [ ] DA-3: IEEE paper / patent draft


Collaborators : Saumya , Rishabh