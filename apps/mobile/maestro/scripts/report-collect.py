#!/usr/bin/env python3
"""
report-collect.py — per-flow result collector for the Maestro E2E report system.

Called by runners (full-regression.sh, run-flow.sh, run-ipad.sh) after each
flow completes. Extracts artifacts from Maestro debug output, resolves the
feature area, and writes structured result files into the run directory.

Usage:
  python3 report-collect.py \
    --run-dir e2e-reports/runs/2026-07-09_1430_full-regression_all \
    --flow apps/mobile/maestro/flows/venta-efectivo.yaml \
    --status passed \
    --duration-ms 12345 \
    --phase "Phase 4: Sales" \
    --debug-dir apps/mobile/maestro/reports/venta-efectivo/debug

Produces:
  <run-dir>/tests/<flow-name>/
    ├── result.json       # status, duration, failedStep, probableCause, artifact paths
    ├── commands.json     # step trace (all tests — pass AND fail)
    ├── screenshot.png    # failures only (copied from debug/diagnose output)
    ├── hierarchy.json    # failures only
    └── report.md         # failures only (from analyze-failure.py)

Also appends one NDJSON line to <run-dir>/results.ndjson (crash-safe log).
"""

import argparse
import json
import os
import re
import shutil
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional

SCRIPT_DIR = Path(__file__).resolve().parent
FEATURE_AREAS_PATH = SCRIPT_DIR / "feature-areas.json"


def load_feature_areas() -> List[Dict]:
    """Load feature area regex rules from feature-areas.json."""
    if not FEATURE_AREAS_PATH.exists():
        return []
    with open(FEATURE_AREAS_PATH) as f:
        return json.load(f)


def resolve_feature_area(flow_name: str, rules: List[Dict]) -> str:
    """Match flow name against feature area rules. First match wins."""
    name_lower = flow_name.lower()
    for rule in rules:
        if re.search(rule["pattern"], name_lower):
            return rule["area"]
    return "Sin categoría"


def read_entrypoint(flow_path: str) -> str:
    """Read x-entrypoint metadata from flow YAML header."""
    try:
        with open(flow_path) as f:
            for i, line in enumerate(f):
                if i >= 15:
                    break
                m = re.match(r"^#\s*x-entrypoint:\s*(\S+)", line)
                if m:
                    return m.group(1)
    except (OSError, IOError):
        pass
    return ""


def find_commands_json(debug_dir: str, flow_name: str) -> Optional[str]:
    """Find the commands JSON file in the debug output directory."""
    if not debug_dir or not os.path.isdir(debug_dir):
        return None

    # Search for commands-*<flow_name>* pattern
    for f in os.listdir(debug_dir):
        if f.startswith("commands-") and flow_name in f and f.endswith(".json"):
            return os.path.join(debug_dir, f)

    # Fallback: any commands-*.json
    for f in os.listdir(debug_dir):
        if f.startswith("commands-") and f.endswith(".json"):
            return os.path.join(debug_dir, f)

    return None


def collect_result(
    run_dir: str,
    flow_path: str,
    status: str,
    duration_ms: int,
    phase: str,
    debug_dir: str,
) -> Dict:
    """Collect artifacts and build the result dict for one flow."""
    flow_name = Path(flow_path).stem
    test_dir = os.path.join(run_dir, "tests", flow_name)
    os.makedirs(test_dir, exist_ok=True)

    feature_rules = load_feature_areas()
    feature_area = resolve_feature_area(flow_name, feature_rules)
    entrypoint = read_entrypoint(flow_path)

    result: Dict = {
        "flow": flow_name,
        "flowPath": flow_path,
        "status": status,
        "durationMs": duration_ms,
        "phase": phase,
        "featureArea": feature_area,
        "entrypoint": entrypoint,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "artifacts": {},
        "failedStep": None,
        "probableCause": None,
    }

    # ── Extract commands.json (for ALL tests — pass and fail) ──────────
    commands_src = find_commands_json(debug_dir, flow_name)
    if commands_src and os.path.exists(commands_src):
        dest = os.path.join(test_dir, "commands.json")
        shutil.copy2(commands_src, dest)
        result["artifacts"]["commands"] = f"tests/{flow_name}/commands.json"

        # Parse step trace for failure details
        if status == "failed":
            try:
                # Import analyze-failure functions
                sys.path.insert(0, str(SCRIPT_DIR))
                from importlib import import_module
                af = import_module("analyze-failure")
                diagnosis = af.diagnose_failure(
                    commands_path=dest,
                    hierarchy_path=os.path.join(test_dir, "hierarchy.json")
                    if os.path.exists(os.path.join(test_dir, "hierarchy.json"))
                    else "",
                    flow_path=flow_path,
                )
                if diagnosis["failed_step"]:
                    fs = diagnosis["failed_step"]
                    result["failedStep"] = {
                        "index": diagnosis["failed_index"],
                        "type": fs.get("type", ""),
                        "id": fs.get("id", ""),
                        "text": fs.get("text", ""),
                        "errorMessage": fs.get("error_message", ""),
                        "durationMs": fs.get("duration", 0),
                    }
                result["probableCause"] = diagnosis["probable_cause"]
            except Exception as e:
                result["probableCause"] = f"Analysis error: {e}"
    elif status == "passed" and debug_dir:
        # For passing tests, try to find commands in ~/.maestro/tests
        maestro_tests = os.path.expanduser("~/.maestro/tests")
        if os.path.isdir(maestro_tests):
            candidates = []
            for root, dirs, files in os.walk(maestro_tests):
                for f in files:
                    if f.startswith("commands-") and flow_name in f and f.endswith(".json"):
                        full = os.path.join(root, f)
                        candidates.append((os.path.getmtime(full), full))
            if candidates:
                candidates.sort(reverse=True)
                dest = os.path.join(test_dir, "commands.json")
                shutil.copy2(candidates[0][1], dest)
                result["artifacts"]["commands"] = f"tests/{flow_name}/commands.json"

    # ── Copy failure-only artifacts ────────────────────────────────────
    if status == "failed":
        # Screenshot
        for candidate_name in ["screenshot.png"]:
            src = os.path.join(test_dir, candidate_name)
            if os.path.exists(src):
                result["artifacts"]["screenshot"] = f"tests/{flow_name}/screenshot.png"
                break
        # Also check debug_dir for screenshot
        if "screenshot" not in result["artifacts"] and debug_dir:
            for f in sorted(os.listdir(debug_dir)) if os.path.isdir(debug_dir) else []:
                if "screenshot" in f.lower() and f.endswith(".png"):
                    dest = os.path.join(test_dir, "screenshot.png")
                    shutil.copy2(os.path.join(debug_dir, f), dest)
                    result["artifacts"]["screenshot"] = f"tests/{flow_name}/screenshot.png"
                    break

        # Hierarchy
        hier_path = os.path.join(test_dir, "hierarchy.json")
        if os.path.exists(hier_path):
            result["artifacts"]["hierarchy"] = f"tests/{flow_name}/hierarchy.json"

        # Report.md
        report_path = os.path.join(test_dir, "report.md")
        if os.path.exists(report_path):
            result["artifacts"]["report"] = f"tests/{flow_name}/report.md"

    # ── Write result.json ──────────────────────────────────────────────
    result_path = os.path.join(test_dir, "result.json")
    with open(result_path, "w") as f:
        json.dump(result, f, indent=2, default=str)

    # ── Append to results.ndjson (crash-safe incremental log) ──────────
    ndjson_path = os.path.join(run_dir, "results.ndjson")
    ndjson_entry = {
        "flow": flow_name,
        "status": status,
        "durationMs": duration_ms,
        "phase": phase,
        "featureArea": feature_area,
        "timestamp": result["timestamp"],
    }
    with open(ndjson_path, "a") as f:
        f.write(json.dumps(ndjson_entry, default=str) + "\n")

    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Collect Maestro flow result into the report run directory"
    )
    parser.add_argument("--run-dir", required=True, help="Path to the run directory")
    parser.add_argument("--flow", required=True, help="Path to the flow YAML")
    parser.add_argument(
        "--status",
        required=True,
        choices=["passed", "failed", "skipped"],
        help="Flow result status",
    )
    parser.add_argument(
        "--duration-ms", type=int, default=0, help="Flow duration in milliseconds"
    )
    parser.add_argument("--phase", default="", help="Phase label (e.g. 'Phase 4: Sales')")
    parser.add_argument(
        "--debug-dir", default="", help="Maestro debug output directory"
    )
    args = parser.parse_args()

    if not os.path.isdir(args.run_dir):
        os.makedirs(args.run_dir, exist_ok=True)

    result = collect_result(
        run_dir=args.run_dir,
        flow_path=args.flow,
        status=args.status,
        duration_ms=args.duration_ms,
        phase=args.phase,
        debug_dir=args.debug_dir,
    )

    flow_name = Path(args.flow).stem
    emoji = {"passed": "✅", "failed": "❌", "skipped": "⏭️"}.get(args.status, "❓")
    print(f"  📊  {emoji} {flow_name} → {args.run_dir}/tests/{flow_name}/result.json")


if __name__ == "__main__":
    main()
