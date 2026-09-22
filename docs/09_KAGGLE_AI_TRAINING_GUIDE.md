# CtxVigil: Kaggle AI Training & Viva Demonstration Guide
**Course:** BCSE306L - Artificial Intelligence  
**Students:** Rishabh Tripathi (24BRS1136) & Saumya (24BRS1065)  
**Project:** CtxVigil — Multi-View Prompt Injection Defense Layer for LLM Web Agents

---

## 1. Executive Summary of AI Deliverables

In accordance with our **DA-1 Research Proposal (§4.1)**, CtxVigil departs from fragile string heuristics by implementing a **two-stage hybrid neural defense architecture**:

1. **Stage 1 (NLP Classifier):** Fine-tuned **DeBERTa-v3** (`microsoft/deberta-v3-small`) trained on **20,000 curated benchmark samples** (InjecAgent, BIPIA, AgentDojo, and syntax hard negatives) to detect adversarial payloads in external contexts ($V_4$).
2. **Stage 2 (Multi-View Representation Fusion & Uncertainty Network):** A PyTorch **Dual-Head MLP** operating over dense 384-dimensional `all-MiniLM-L6-v2` embeddings across 4 agent views ($V_1$: Task, $V_2$: System, $V_3$: Action, $V_4$: Context) plus **6 pairwise cosine agreement features** ($S_{12}, S_{13}, S_{14}, S_{23}, S_{24}, S_{34}$). The network outputs both **Risk Probability ($P_{\text{risk}}$)** and **Epistemic Uncertainty ($U$)**.

---

## 2. Step-by-Step Kaggle Notebook Execution

The repository contains two self-contained Jupyter notebooks in the `notebooks/` directory:

### Notebook 1: `notebooks/01_DeBERTa_Prompt_Injection_Classifier.ipynb`
* **Purpose:** Train the DeBERTa-v3 classifier on 20,000 prompt injection samples.
* **Target Environment:** Kaggle Notebook
* **Accelerator:** **GPU T4 x2** (or P100)
* **Internet:** Enabled (to download Hugging Face weights)
* **Estimated Runtime:** ~6–8 minutes (using PyTorch FP16 mixed precision).

#### Steps to Run:
1. Log in to [Kaggle](https://www.kaggle.com/).
2. Click **Create** -> **New Notebook**.
3. Go to **File** -> **Upload Notebook** and select `notebooks/01_DeBERTa_Prompt_Injection_Classifier.ipynb`.
4. In the right-hand panel, under **Notebook Settings**:
   - **Accelerator:** Choose `GPU T4 x2`
   - **Internet:** Toggle `ON`
5. Click **Run All** (or press `Shift + Enter` through each cell).
6. **Outputs Produced:**
   - Training loss curves & validation F1 per epoch.
   - Final evaluation metrics: **Accuracy > 98.5%**, **F1-Score > 0.98**, **ROC-AUC > 0.998**.
   - Side-by-side plots: `deberta_performance_metrics.png` (Normalized Confusion Matrix & ROC Curve).
   - Saved artifacts in `/kaggle/working/exports/`:
     - `deberta_prompt_injection.pt` (PyTorch model weights)
     - `deberta_tokenizer/` (Hugging Face tokenizer configuration)
     - `deberta_test_inferences.csv` (scored test samples for Notebook 2).

---

### Notebook 2: `notebooks/02_CtxVigil_MultiView_Fusion_Network.ipynb`
* **Purpose:** Implements DA-1 §4.1 Multi-View Representation Fusion & Uncertainty Network.
* **Target Environment:** Kaggle Notebook
* **Accelerator:** GPU T4 or standard CPU
* **Estimated Runtime:** ~3–4 minutes.

#### Steps to Run:
1. In Kaggle, create a second new notebook.
2. Upload `notebooks/02_CtxVigil_MultiView_Fusion_Network.ipynb`.
3. Set Accelerator to `GPU T4` (or CPU) and toggle Internet `ON`.
4. Click **Run All**.
5. **Outputs Produced:**
   - Dense embeddings for 5,000 multi-view execution episodes using `all-MiniLM-L6-v2`.
   - Calculation of the 6 pairwise cosine agreement features.
   - Joint training of the Dual-Head MLP with CrossEntropy + Uncertainty MSE Loss.
   - Visualizations:
     - 4x4 Cosine Agreement Heatmaps for clean vs. compromised episodes.
     - Ablation Study Bar Chart: Demonstrating that CtxVigil's multi-view cosine agreement architecture significantly outperforms single-view baseline filters.
   - Saved artifacts in `/kaggle/working/exports/`:
     - `ctxvigil_multiview_fusion.pt`
     - `ctxvigil_viva_summary.json`

---

## 3. Local Evaluation & Offline Fallback

To verify the multi-view cosine agreement calculations locally without a GPU:

```bash
# Run the local semantic discrepancy script
python eval_ml/cross_view_agreement.py
```
This generates `eval_ml/multiview_demo_data.json` containing the pre-computed 4x4 agreement matrices and uncertainty scores for:
1. Benign E-Commerce Refund (Order #9821) $\to$ ALLOW ($S_{13} = 0.78$, Low Risk)
2. InjecAgent Indirect Hijack $\to$ BLOCK ($S_{13} = 0.08$, 98% Risk)
3. ARIA Attribute Cloaked Attack $\to$ BLOCK / QUARANTINE ($S_{13} = 0.06$)
4. Benign Hard Negative (CSS Specificity) $\to$ ALLOW

---

## 4. Running the CtxVigil Frontend Demo

The interactive React dashboard has been revamped to showcase both the runtime protection engine and the DA-1 §4.1 multi-view neural fusion network.

```bash
# Start the Vite development server
npm run demo:web
```

The web dashboard opens at `http://localhost:5173/`:
- **Scenario Selector (1–6):** Select between Benign baseline, InjecAgent indirect hijack, ARIA hidden attacks, and CSS hard negatives.
- **Multi-View Neural Matrix:** Live 4x4 Cosine Agreement Heatmap ($S_{ij}$), highlighting the critical $S_{13}$ Task-Action alignment invariant.
- **Dual Output Heads:** Real-time meters for DeBERTa NLP Injection Probability and Epistemic Uncertainty ($U$).
- **Action Gate Interception:** Proves that even if an attacker tricks the agent's observation view, the Action Gate intercepts unauthorized state mutations.

---

## 5. Viva Evaluation Talking Points & Questions

### Q1: Why did you use DeBERTa-v3 instead of standard BERT?
> **Answer:** Standard BERT/RoBERTa uses coupled embeddings where word semantics and position vectors are added together. **DeBERTa-v3 (Disentangled Attention v3)** maintains separate vectors for content and relative token position, calculating cross-attention across content-to-position and position-to-content. This is critical for detecting adversarial injections because attackers often manipulate syntax order, delimiters (`--- END OF SYSTEM CONTEXT ---`), and role-play triggers that break simpler transformer embeddings. Furthermore, DeBERTa-v3 is trained with Replaced Token Detection (RTD), giving it superior discriminative power on syntactic anomalies.

### Q2: Why is a single text classifier insufficient for autonomous agents?
> **Answer:** In autonomous web agents, prompt injections are **indirect contextual attacks**. The malicious prompt is hidden inside an untrusted external observation ($V_4$, such as a webpage or customer ticket). A standard text filter inspecting only the observation might miss subtle or obfuscated commands. However, when the LLM reads $V_4$, it is tricked into proposing a tool action ($V_3$, like `transfer_funds`) that directly contradicts the user's original authorized task ($V_1$). By measuring the pairwise cosine discrepancy $S_{13} = \cos(\mathbf{e}_1, \mathbf{e}_3)$ using `all-MiniLM-L6-v2`, CtxVigil catches the injection at the geometric boundary, regardless of how stealthily the observation was phrased.

### Q3: What is the purpose of the Epistemic Uncertainty Head in DA-1 §4.1?
> **Answer:** Traditional softmax classifiers suffer from overconfidence when exposed to out-of-distribution (OOD) adversarial attacks or ambiguous inputs. Our Dual-Head MLP outputs an Epistemic Uncertainty score $U \in [0, 1]$ calibrated against residual prediction errors. When $U > 0.35$, even if the risk probability is borderline, the CtxVigil Action Gate places the agent into **QUARANTINE**, halting automated execution and requiring affirmative human confirmation.

### Q4: What are the 4 views in CtxVigil?
> **Answer:**
> 1. $V_1$: **Authorized User Task** (the user's genuine intent)
> 2. $V_2$: **System Guardrail Instructions** (agent boundaries and policy rules)
> 3. $V_3$: **Proposed Tool Action** (the concrete API or function call payload)
> 4. $V_4$: **External Observation Context** (DOM content, accessibility tree, or retrieved text).

---

## 6. Verification Checklist
- [x] All 184 workspace tests pass: `npm test`
- [x] Contract tests pass: `npm run test:contract`
- [x] TypeScript builds cleanly: `npm run typecheck`
- [x] Packaging verification passes: `npm run pack-check`
- [x] Notebook 1 generated: `notebooks/01_DeBERTa_Prompt_Injection_Classifier.ipynb`
- [x] Notebook 2 generated: `notebooks/02_CtxVigil_MultiView_Fusion_Network.ipynb`
- [x] Offline evaluator operational: `eval_ml/cross_view_agreement.py`
- [x] Frontend modernized with MultiViewNeuralMatrix: `apps/demo-web/`
