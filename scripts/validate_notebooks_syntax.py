import json
import ast
import sys

def check_notebook(path):
    print(f"Checking {path}...")
    with open(path, "r", encoding="utf-8") as f:
        nb = json.load(f)
        
    for i, cell in enumerate(nb["cells"]):
        if cell["cell_type"] == "code":
            source = "".join(cell["source"])
            # Filter out shell commands starting with ! for ast checking
            python_lines = []
            for line in source.split("\n"):
                if line.strip().startswith("!"):
                    python_lines.append("# " + line)
                else:
                    python_lines.append(line)
            code = "\n".join(python_lines)
            try:
                ast.parse(code)
                print(f"  Cell {i+1} (code): Syntax OK")
            except SyntaxError as e:
                print(f"  [ERROR] Cell {i+1} SyntaxError: {e}")
                sys.exit(1)

check_notebook("notebooks/01_DeBERTa_Prompt_Injection_Classifier.ipynb")
check_notebook("notebooks/02_CtxVigil_MultiView_Fusion_Network.ipynb")
print("[+] All code cells in both notebooks have 100% valid Python syntax!")
