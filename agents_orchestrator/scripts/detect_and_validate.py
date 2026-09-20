#!/usr/bin/env python3
"""agents_orchestrator - provider detection + config validation helper.

Read-only, dependency-free (pure Python stdlib) tool that:

1. DETECTS which providers are present in the project: Graft, Graphify,
   Mem0, Headroom, plus the local lessons store. Detection uses filesystem
   evidence, PATH lookup, import probes, and MCP-config mentions.
   It never reads secret VALUES (env var names only) and never sends
   anything anywhere.

2. VALIDATES config/agent_config.yaml: structure (missing/unknown keys),
   types, semantic rules from the orchestrator docs (e.g.
   routing.allow_fixed_pipeline must be false), and consistency between
   the config and what detection actually found.

Usage:
    python agents_orchestrator/scripts/detect_and_validate.py
    python agents_orchestrator/scripts/detect_and_validate.py --root /path/to/project
    python agents_orchestrator/scripts/detect_and_validate.py --json
    python agents_orchestrator/scripts/detect_and_validate.py --strict   # warnings fail too

Exit codes: 0 = clean, 1 = warnings only, 2 = errors (or --strict with warnings).

Docs: 00_PROJECT_DISCOVERY.md (detection), 01_INSTALLATION.md (install/verify),
config/agent_config.yaml (the config being validated).

Limitations: CLI detection is a PATH lookup (no subprocesses are spawned);
Python-package probes only see the interpreter running this script. For
runtime health use the tools' own checks: `graft check`, `graphify --version`,
`headroom doctor`, and a Mem0 add/search/delete round-trip (01_INSTALLATION.md).

Output is intentionally ASCII-only so it renders cleanly on every terminal.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path

try:
    from importlib.util import find_spec
except ImportError:  # pragma: no cover (Python < 3.5 era; not expected)
    find_spec = None  # type: ignore[assignment]

SCRIPT_DIR = Path(__file__).resolve().parent
ORCH_DIR = SCRIPT_DIR.parent
CONFIG_REL = Path("config") / "agent_config.yaml"
LESSONS_REL = Path("state") / "lessons.md"

MCP_CONFIG_PATHS = (
    ".mcp.json",
    ".cursor/mcp.json",
    ".vscode/mcp.json",
    ".claude/settings.json",
    ".claude/settings.local.json",
)

# ---------------------------------------------------------------------------
# Minimal YAML subset parser (fallback when PyYAML is unavailable).
# Supports: comments, nested mappings by indentation, scalars
# (bool/null/int/float/quoted-or-plain strings). No lists, anchors, or
# block scalars - agent_config.yaml deliberately stays within this subset.
# ---------------------------------------------------------------------------


class ConfigError(Exception):
    pass


def _strip_comment(line: str) -> str:
    in_single = in_double = False
    for i, ch in enumerate(line):
        if ch == "'" and not in_double:
            in_single = not in_single
        elif ch == '"' and not in_single:
            in_double = not in_double
        elif ch == "#" and not in_single and not in_double and (i == 0 or line[i - 1] in " \t"):
            return line[:i]
    return line


def _parse_scalar(raw: str):
    s = raw.strip()
    if s == "":
        return None
    low = s.lower()
    if low in ("true", "yes", "on"):
        return True
    if low in ("false", "no", "off"):
        return False
    if low in ("null", "~"):
        return None
    try:
        return int(s)
    except ValueError:
        pass
    try:
        return float(s)
    except ValueError:
        pass
    if len(s) >= 2 and s[0] == s[-1] and s[0] in ("'", '"'):
        return s[1:-1]
    return s


def _mini_yaml(text: str):
    root: dict = {}
    stack = [(-1, root)]
    for lineno, raw_line in enumerate(text.splitlines(), start=1):
        line = _strip_comment(raw_line.replace("\t", "  "))
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip(" "))
        body = line.strip()
        if ":" not in body:
            raise ConfigError(
                "line %d: expected 'key: value' (lists and block scalars are not "
                "supported by the fallback parser)" % lineno
            )
        key, _, value = body.partition(":")
        key = key.strip().strip("'\"")
        value = value.strip()
        if not key:
            raise ConfigError("line %d: empty key" % lineno)
        while len(stack) > 1 and indent <= stack[-1][0]:
            stack.pop()
        container = stack[-1][1]
        if not isinstance(container, dict):
            raise ConfigError("line %d: nesting error" % lineno)
        if value == "":
            new_map: dict = {}
            container[key] = new_map
            stack.append((indent, new_map))
        else:
            container[key] = _parse_scalar(value)
    return root


def load_config(path: Path):
    """Return (data, parser_name). Raises ConfigError on parse failure."""
    try:
        text = path.read_text(encoding="utf-8-sig")
    except OSError as exc:
        raise ConfigError("cannot read %s: %s" % (path, exc))
    try:
        import yaml  # type: ignore
    except ImportError:
        return _mini_yaml(text), "fallback-parser (PyYAML not installed)"
    try:
        return yaml.safe_load(text), "pyyaml"
    except Exception as exc:  # yaml.YAMLError and friends
        raise ConfigError("YAML parse error: %s" % exc)


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------


def _mcp_mentions(root: Path) -> dict:
    mentions: dict = {}
    for rel in MCP_CONFIG_PATHS:
        p = root / rel
        if not p.is_file():
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="replace").lower()
        except OSError:
            continue
        for name in ("graft", "graphify", "mem0", "openmemory", "headroom"):
            if name in text:
                mentions.setdefault(name, []).append(rel)
    return mentions


def _importable(module: str) -> bool:
    if find_spec is None:
        return False
    try:
        return find_spec(module) is not None
    except Exception:
        return False


def _env_set(name: str) -> bool:
    return name in os.environ  # presence only - value is never read or printed


def detect(root: Path) -> dict:
    mcp = _mcp_mentions(root)
    result: dict = {}

    graft_ev = []
    if shutil.which("graft"):
        graft_ev.append("CLI on PATH")
    if (root / "graft").is_dir():
        graft_ev.append("graft/ directory present")
    if (root / "graft" / ".graph" / "wiring.json").is_file():
        graft_ev.append("graft/.graph/wiring.json present")
    for rel in mcp.get("graft", []):
        graft_ev.append("mentioned in %s" % rel)
    result["graft"] = {"detected": bool(graft_ev), "evidence": graft_ev}

    graphify_ev = []
    if shutil.which("graphify"):
        graphify_ev.append("CLI on PATH")
    if (root / "graphify-out" / "graph.json").is_file():
        graphify_ev.append("graphify-out/graph.json present")
    if (root / "graphify-out" / "GRAPH_REPORT.md").is_file():
        graphify_ev.append("graphify-out/GRAPH_REPORT.md present")
    for mod in ("graphifyy", "graphify"):
        if _importable(mod):
            graphify_ev.append("package '%s' importable in current Python" % mod)
            break
    for rel in mcp.get("graphify", []):
        graphify_ev.append("mentioned in %s" % rel)
    result["graphify"] = {"detected": bool(graphify_ev), "evidence": graphify_ev}

    mem0_ev = []
    if _importable("mem0ai"):
        mem0_ev.append("package 'mem0ai' importable in current Python")
    if _env_set("MEM0_API_KEY"):
        mem0_ev.append("env var MEM0_API_KEY is set (name only; value not read)")
    for name in ("mem0", "openmemory"):
        for rel in mcp.get(name, []):
            if name == "openmemory":
                label = "OpenMemory MCP mentioned in %s" % rel
            else:
                label = "mentioned in %s" % rel
            if label not in mem0_ev:
                mem0_ev.append(label)
    result["mem0"] = {"detected": bool(mem0_ev), "evidence": mem0_ev}

    headroom_ev = []
    if shutil.which("headroom"):
        headroom_ev.append("CLI on PATH")
    if _importable("headroom"):
        headroom_ev.append("package 'headroom' importable in current Python")
    for rel in mcp.get("headroom", []):
        headroom_ev.append("mentioned in %s" % rel)
    result["headroom"] = {"detected": bool(headroom_ev), "evidence": headroom_ev}

    # The lessons store lives inside the orchestrator folder itself, so resolve
    # it relative to ORCH_DIR (independent of where the folder is mounted).
    result["lessons"] = _lessons_stats(ORCH_DIR / LESSONS_REL)
    return result


RECORD_HEADER = re.compile(r"^##\s+\[LS-\d+\]", re.IGNORECASE)


def _lessons_stats(path: Path):
    """Count lesson records in state/lessons.md, ignoring the template's own
    format documentation: fenced code blocks are skipped, and only real record
    headers (`## [LS-<digits>] ...`) count - placeholders like `[LS-###]` or
    `[LS-NNN]` in headings/examples do not."""
    if not path.is_file():
        return {"present": False, "active": 0, "superseded": 0, "invalidated": 0}
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return {"present": False, "active": 0, "superseded": 0, "invalidated": 0}
    statuses = []  # one entry per real record, in file order
    current = None
    in_fence = False
    for raw in text.splitlines():
        stripped = raw.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if RECORD_HEADER.match(stripped):
            if current is not None:
                statuses.append(current)
            current = "active"
            continue
        if current is not None:
            low = stripped.lower()
            if "status:" in low:
                if "superseded" in low:
                    current = "superseded"
                elif "invalidated" in low:
                    current = "invalidated"
    if current is not None:
        statuses.append(current)
    return {
        "present": True,
        "active": statuses.count("active"),
        "superseded": statuses.count("superseded"),
        "invalidated": statuses.count("invalidated"),
    }


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

BOOL, INT, STR = bool, int, str

SCHEMA = {
    "version": INT,
    "providers": {
        "structure": {
            "primary": STR,
            "fallback": STR,
            "graft": {"enabled": BOOL, "mcp": BOOL, "deep_summaries": BOOL, "lsp_edges": BOOL},
            "graphify": {"enabled": BOOL, "mcp": BOOL, "semantic_pass": BOOL},
        },
        "mem0": {"enabled": BOOL, "mode": STR, "mcp": STR, "local_llm": STR, "store_policy": STR},
        "headroom": {"enabled": BOOL, "mode": STR, "only_when_needed": BOOL, "reversible": BOOL},
    },
    "routing": {
        "automatic_tool_selection": BOOL,
        "allow_fixed_pipeline": BOOL,
        "max_providers_per_task": INT,
    },
    "context": {
        "compression": {"enabled": BOOL, "only_when_needed": BOOL, "protect_critical": BOOL},
    },
    "memory": {
        "auto_store": BOOL,
        "lessons": {"enabled": BOOL, "path": STR, "commit": BOOL, "max_active_lessons": INT},
        "mem0": {"scope": STR, "supersede_stale": BOOL},
    },
    "safety": {
        "require_confirmation_for_installation": BOOL,
        "never_auto_commit": BOOL,
        "never_auto_push": BOOL,
        "never_cross_project_memory": BOOL,
        "never_store_secrets": BOOL,
    },
}

TOP_LEVEL_KEYS = ("version", "providers", "routing", "context", "memory", "safety")
STRUCTURE_CHOICES = ("graft", "graphify", "none")
MEM0_MODES = ("self-hosted", "platform")
HEADROOM_MODES = ("mcp", "proxy", "wrap", "library", "off")
STORE_POLICIES = ("confirm_with_user", "auto", "disabled")


def _check_schema(node, schema, path, issues, top=False):
    if not isinstance(node, dict):
        issues.append(
            ("ERROR", "%s should be a mapping, got %s" % (path or "config", type(node).__name__))
        )
        return
    for key, spec in schema.items():
        if key not in node:
            issues.append(("ERROR" if top else "WARN", "missing key: %s%s" % (path, key)))
    for key, value in node.items():
        if key not in schema:
            issues.append(("WARN", "unknown key: %s%s (typo?)" % (path, key)))
            continue
        spec = schema[key]
        here = "%s%s." % (path, key)
        if isinstance(spec, dict):
            if not isinstance(value, dict):
                issues.append(("ERROR", "%s%s should be a mapping" % (path, key)))
                continue
            _check_schema(value, spec, here, issues)
        elif spec is BOOL:
            if not isinstance(value, bool):
                issues.append(("WARN", "%s%s should be a boolean (got %r)" % (path, key, value)))
        elif spec is INT:
            if not isinstance(value, int) or isinstance(value, bool):
                issues.append(("WARN", "%s%s should be an integer (got %r)" % (path, key, value)))
        elif spec is STR:
            if not isinstance(value, str):
                issues.append(("WARN", "%s%s should be a string (got %r)" % (path, key, value)))


def _check_semantics(cfg, issues):
    prov = cfg.get("providers") or {}
    structure = prov.get("structure") or {}
    primary = structure.get("primary")
    fallback = structure.get("fallback")

    if primary not in STRUCTURE_CHOICES:
        issues.append(
            ("ERROR", "providers.structure.primary must be one of %s (got %r)"
             % (", ".join(STRUCTURE_CHOICES), primary))
        )
    if fallback not in STRUCTURE_CHOICES:
        issues.append(
            ("ERROR", "providers.structure.fallback must be one of %s (got %r)"
             % (", ".join(STRUCTURE_CHOICES), fallback))
        )
    if primary == fallback and primary != "none":
        issues.append(
            ("WARN", "providers.structure.fallback equals primary (%r) - pointless fallback" % primary)
        )

    if primary in ("graft", "graphify"):
        tool_cfg = structure.get(primary) or {}
        if tool_cfg.get("enabled") is not True:
            issues.append(
                ("ERROR", "providers.structure.primary=%s but providers.structure.%s.enabled "
                          "is not true" % (primary, primary))
            )

    mem0 = prov.get("mem0") or {}
    if mem0.get("mode") not in (None,) and mem0.get("mode") not in MEM0_MODES:
        issues.append(
            ("ERROR", "providers.mem0.mode must be one of %s (got %r)"
             % (", ".join(MEM0_MODES), mem0.get("mode")))
        )
    if mem0.get("store_policy") not in (None,) and mem0.get("store_policy") not in STORE_POLICIES:
        issues.append(
            ("WARN", "providers.mem0.store_policy should be one of %s (got %r)"
             % (", ".join(STORE_POLICIES), mem0.get("store_policy")))
        )

    headroom = prov.get("headroom") or {}
    if headroom.get("mode") not in (None,) and headroom.get("mode") not in HEADROOM_MODES:
        issues.append(
            ("ERROR", "providers.headroom.mode must be one of %s (got %r)"
             % (", ".join(HEADROOM_MODES), headroom.get("mode")))
        )

    routing = cfg.get("routing") or {}
    if routing.get("allow_fixed_pipeline") is True:
        issues.append(
            ("ERROR", "routing.allow_fixed_pipeline=true violates AGENTS.md "
                      "(never run a fixed pipeline)")
        )
    mpt = routing.get("max_providers_per_task")
    if isinstance(mpt, int) and not isinstance(mpt, bool):
        if mpt < 1:
            issues.append(("ERROR", "routing.max_providers_per_task must be >= 1"))
        elif mpt > 4:
            issues.append(
                ("WARN", "routing.max_providers_per_task=%d - only 4 providers exist" % mpt)
            )

    ctx = (cfg.get("context") or {}).get("compression") or {}
    if ctx.get("protect_critical") is False:
        issues.append(
            ("ERROR", "context.compression.protect_critical=false violates "
                      "AGENTS.md context tiers (CRITICAL tier is never compressed)")
        )
    if ctx.get("only_when_needed") is False:
        issues.append(
            ("WARN", "context.compression.only_when_needed=false - compression must not "
                     "run preemptively (04_HEADROOM.md)")
        )

    memory = cfg.get("memory") or {}
    if memory.get("auto_store") is True:
        issues.append(
            ("WARN", "memory.auto_store=true - the docs require deliberate memory writes "
                     "only (03_MEMORY.md)")
        )
    lessons = memory.get("lessons") or {}
    if lessons.get("enabled") is True:
        rel = lessons.get("path")
        if isinstance(rel, str):
            p = Path(rel).expanduser()
            if not p.is_absolute():
                p = _root_hint / p
            if not p.is_file():
                issues.append(
                    ("WARN", "memory.lessons.path points to %r but the file does not exist "
                             "(create it from the template)" % rel)
                )
            else:
                try:
                    p.resolve().relative_to(_root_hint.resolve())
                except ValueError:
                    issues.append(
                        ("ERROR", "memory.lessons.path resolves outside the project root - "
                                  "violates project isolation (05_SAFETY_RULES.md)")
                    )
    mem0_mem = memory.get("mem0") or {}
    if mem0_mem.get("scope") not in (None, "project"):
        issues.append(
            ("ERROR", "memory.mem0.scope must be 'project' - cross-project memory is "
                      "forbidden (05_SAFETY_RULES.md)")
        )
    if mem0.get("store_policy") == "auto" and memory.get("auto_store") is not True:
        issues.append(
            ("WARN", "providers.mem0.store_policy=auto but memory.auto_store is false - "
                     "inconsistent")
        )

    safety = cfg.get("safety") or {}
    for key in SCHEMA["safety"]:
        if key in safety and safety[key] is not True:
            issues.append(
                ("WARN", "safety.%s is not true - this weakens a documented safety rule "
                         "(05_SAFETY_RULES.md)" % key)
            )


def _check_consistency(cfg, detection, issues):
    prov = cfg.get("providers") or {}
    primary = (prov.get("structure") or {}).get("primary")

    for name in ("graft", "graphify", "mem0", "headroom"):
        detected = detection.get(name, {}).get("detected", False)
        if name == "graft":
            enabled = ((prov.get("structure") or {}).get("graft") or {}).get("enabled")
        elif name == "graphify":
            enabled = ((prov.get("structure") or {}).get("graphify") or {}).get("enabled")
        else:
            enabled = (prov.get(name) or {}).get("enabled")

        if primary == name and detected is False:
            issues.append(
                ("ERROR", "providers.structure.primary=%s but %s was not detected in this "
                          "project - install/verify it first (01_INSTALLATION.md)"
                          % (name, name.capitalize()))
            )
            continue
        if enabled is True and not detected:
            issues.append(
                ("WARN", "%s is enabled in config but was not detected - verify the "
                         "installation (01_INSTALLATION.md) or set enabled: false" % name)
            )
        elif enabled is False and detected:
            issues.append(
                ("INFO", "%s detected but disabled in config (fine - leave it unless it is "
                         "needed)" % name)
            )


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def _print_report(root, config_path, parser_name, detection, issues):
    print("agents_orchestrator - detect & validate")
    print("Project root : %s" % root)
    if config_path is None:
        print("Config       : NOT FOUND (expected %s)" % (ORCH_DIR / CONFIG_REL))
    elif parser_name is None:
        print("Config       : %s (parse failed)" % config_path)
    else:
        print("Config       : %s (parsed with %s)" % (config_path, parser_name))
    print()

    print("Provider detection (filesystem / PATH / import / MCP-config evidence)")
    for name in ("graft", "graphify", "mem0", "headroom"):
        info = detection.get(name, {})
        status = "DETECTED    " if info.get("detected") else "not detected"
        print("  %-9s %s" % (name, status))
        for ev in info.get("evidence", []):
            print("            - %s" % ev)
    lessons = detection.get("lessons", {})
    if lessons.get("present"):
        print(
            "  %-9s %s (active=%d, superseded=%d, invalidated=%d)"
            % ("lessons", "present    ", lessons["active"], lessons["superseded"], lessons["invalidated"])
        )
    else:
        print("  %-9s not present (create from the template in state/lessons.md)" % "lessons")
    print()

    counts = {"ERROR": 0, "WARN": 0, "INFO": 0}
    for severity, message in issues:
        counts[severity] += 1
    if issues:
        print(
            "Validation findings (%d error(s), %d warning(s), %d info)"
            % (counts["ERROR"], counts["WARN"], counts["INFO"])
        )
        order = {"ERROR": 0, "WARN": 1, "INFO": 2}
        for severity, message in sorted(issues, key=lambda i: order[i[0]]):
            print("  [%-5s] %s" % (severity, message))
    else:
        print("Validation findings: none - config is consistent with the docs and with detection.")
    print()
    print("Runtime health is NOT checked here - use 'graft check', 'graphify --version',")
    print("'headroom doctor', and a Mem0 add/search/delete round-trip (01_INSTALLATION.md).")


def main(argv=None):
    global _root_hint
    parser = argparse.ArgumentParser(description="agents_orchestrator detect/validate (read-only)")
    parser.add_argument("--root", help="project root (default: the directory containing agents_orchestrator/)")
    parser.add_argument("--json", action="store_true", help="emit JSON instead of a human-readable report")
    parser.add_argument("--strict", action="store_true", help="treat warnings as errors for the exit code")
    args = parser.parse_args(argv)

    root = Path(args.root).resolve() if args.root else ORCH_DIR.parent
    _root_hint = root
    config_path = ORCH_DIR / CONFIG_REL

    issues = []
    detection = detect(root)

    parser_name = None
    if not config_path.is_file():
        issues.append(
            ("ERROR", "agent_config.yaml not found at %s - copy the orchestrator folder "
                      "intact (README.md)" % config_path)
        )
        config_path = None
    else:
        try:
            cfg, parser_name = load_config(config_path)
            if not isinstance(cfg, dict):
                raise ConfigError("top level of the config must be a mapping")
            _check_schema(cfg, SCHEMA, "", issues, top=True)
            _check_semantics(cfg, issues)
            _check_consistency(cfg, detection, issues)
        except ConfigError as exc:
            issues.append(("ERROR", str(exc)))
            parser_name = None

    errors = sum(1 for s, _ in issues if s == "ERROR")
    warnings = sum(1 for s, _ in issues if s == "WARN")

    if args.json:
        print(json.dumps({
            "root": str(root),
            "config": str(config_path) if config_path else None,
            "config_parser": parser_name,
            "detection": detection,
            "issues": [{"severity": s, "message": m} for s, m in issues],
            "summary": {"errors": errors, "warnings": warnings},
        }, indent=2))
    else:
        _print_report(root, config_path, parser_name, detection, issues)

    if errors:
        return 2
    if warnings and args.strict:
        return 2
    if warnings:
        return 1
    return 0


# Set by main(); used by semantic checks that need the project root.
# NOTE: deliberately NOT annotated (no `: Path`) - a module-level annotated
# assignment for a name declared `global` inside a function is a SyntaxError.
_root_hint = ORCH_DIR.parent

if __name__ == "__main__":
    sys.exit(main())
