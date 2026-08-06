"""
Dataset loading script for Prompt-Injection Detection project.
Downloads and loads the benchmark datasets we're using for evaluation.

Datasets:
  - InjecAgent  (1,054 test cases from uiuc-kang-lab)
  - BIPIA       (indirect prompt injection benchmark from Microsoft)
  - AgentDojo   (97 tasks / 629 security cases — used via pip)

Usage:
  pip install -r requirements.txt
  python data/load_datasets.py
"""

import os
import json
import subprocess
import sys

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def ensure_dir(path):
    """Create a folder if it doesn't already exist."""
    os.makedirs(path, exist_ok=True)


def clone_if_missing(repo_url, dest):
    """Clone a GitHub repo only if we haven't cloned it yet."""
    if os.path.isdir(dest):
        print(f"[skip] {dest} already exists, not re-cloning.")
        return
    print(f"[clone] {repo_url} -> {dest}")
    subprocess.run(["git", "clone", repo_url, dest], check=True)


# ---------------------------------------------------------------------------
# 1.  InjecAgent — 1,054 indirect-prompt-injection test cases
#     Repo: https://github.com/uiuc-kang-lab/InjecAgent
# ---------------------------------------------------------------------------

def load_injecagent(data_root="data/raw"):
    """
    Clone InjecAgent and print basic stats.
    The dataset JSON files live inside the repo under data/.
    """
    dest = os.path.join(data_root, "InjecAgent")
    clone_if_missing("https://github.com/uiuc-kang-lab/InjecAgent.git", dest)

    # Try to find and count the test cases
    data_dir = os.path.join(dest, "data")
    if os.path.isdir(data_dir):
        json_files = [f for f in os.listdir(data_dir) if f.endswith(".json")]
        total_cases = 0
        for jf in json_files:
            with open(os.path.join(data_dir, jf), "r", encoding="utf-8") as fh:
                content = json.load(fh)
                if isinstance(content, list):
                    total_cases += len(content)
                    print(f"  {jf}: {len(content)} cases")
        print(f"  -> InjecAgent total loaded cases: {total_cases}")
    else:
        print("  [warn] data/ subfolder not found — check repo structure.")

    return dest


# ---------------------------------------------------------------------------
# 2.  BIPIA — Benchmarking Indirect Prompt Injection Attacks
#     Uses HuggingFace datasets library for the processed 70k version
#     Original repo: https://github.com/microsoft/BIPIA
# ---------------------------------------------------------------------------

def load_bipia():
    """
    Load the BIPIA dataset from HuggingFace.
    Falls back to cloning the Microsoft repo if HF download fails.
    """
    try:
        from datasets import load_dataset

        print("[load] Loading BIPIA from HuggingFace ...")
        # The processed version with 70k examples (35k malicious + 35k benign)
        # If this specific dataset ID doesn't work, we fall back to the repo.
        ds = load_dataset("Shu0924/Indirect-Prompt-Injection-BIPIA-GPT", split="train")
        print(f"  -> BIPIA loaded: {len(ds)} examples")
        print(f"  -> Columns: {ds.column_names}")
        return ds

    except Exception as e:
        print(f"  [warn] HuggingFace load failed ({e})")
        print("  Falling back to cloning Microsoft/BIPIA repo ...")
        dest = os.path.join("data", "raw", "BIPIA")
        clone_if_missing("https://github.com/microsoft/BIPIA.git", dest)
        return dest


# ---------------------------------------------------------------------------
# 3.  AgentDojo — 97 tasks, 629 security test cases
#     Repo: https://github.com/ethz-spylab/agentdojo
#     Can be installed via pip: pip install agentdojo
# ---------------------------------------------------------------------------

def load_agentdojo():
    """
    Try importing agentdojo (pip package).
    If not installed, clone the repo so we at least have the code.
    """
    try:
        import agentdojo
        print(f"[load] agentdojo package found (version: {agentdojo.__version__})")
        return True

    except ImportError:
        print("[info] agentdojo not installed via pip. Cloning repo instead ...")
        dest = os.path.join("data", "raw", "agentdojo")
        clone_if_missing("https://github.com/ethz-spylab/agentdojo.git", dest)
        return dest


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("Prompt-Injection Detection — Dataset Loader")
    print("=" * 60)

    data_root = os.path.join("data", "raw")
    ensure_dir(data_root)

    print("\n--- 1/3  InjecAgent ---")
    load_injecagent(data_root)

    print("\n--- 2/3  BIPIA ---")
    load_bipia()

    print("\n--- 3/3  AgentDojo ---")
    load_agentdojo()

    print("\n" + "=" * 60)
    print("Done. Raw data is in data/raw/")
    print("=" * 60)
