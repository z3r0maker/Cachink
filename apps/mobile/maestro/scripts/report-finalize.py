#!/usr/bin/env python3
"""
report-finalize.py — end-of-run finalizer for the Maestro E2E report system.

Called once at the end of a test run (also on trap/interrupt for partial runs).
Builds the manifest, data.js for the viewer, regenerates the global runs index,
and prunes old runs.

Usage:
  python3 report-finalize.py --run-dir e2e-reports/runs/2026-07-09_1430_full-regression_all

What it does:
  1. Reads results.ndjson → builds manifest.json with totals and per-test summaries
  2. Reads each tests/<flow>/result.json → builds data.js (window.RUN_DATA={...})
  3. Regenerates runs-index.js from all runs/*/manifest.json
  4. Computes flaky flags (status flipped ≥2× in last 10 runs)
  5. Atomically updates latest.json
  6. Prunes runs beyond MAX_RUNS (oldest first)
"""

import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

MAX_RUNS = 30
REPORT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent / "e2e-reports"


def read_ndjson(run_dir: str) -> List[Dict]:
    """Read results.ndjson into a list of dicts."""
    ndjson_path = os.path.join(run_dir, "results.ndjson")
    results = []
    if not os.path.exists(ndjson_path):
        return results
    with open(ndjson_path) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    results.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return results


def read_test_results(run_dir: str) -> List[Dict]:
    """Read all tests/<flow>/result.json files."""
    tests_dir = os.path.join(run_dir, "tests")
    results = []
    if not os.path.isdir(tests_dir):
        return results
    for flow_name in sorted(os.listdir(tests_dir)):
        result_file = os.path.join(tests_dir, flow_name, "result.json")
        if os.path.exists(result_file):
            try:
                with open(result_file) as f:
                    results.append(json.load(f))
            except (json.JSONDecodeError, OSError):
                continue
    return results


def read_commands_json(run_dir: str, flow_name: str) -> Optional[List]:
    """Read commands.json for a flow (trimmed for data.js)."""
    commands_path = os.path.join(run_dir, "tests", flow_name, "commands.json")
    if not os.path.exists(commands_path):
        return None
    try:
        with open(commands_path) as f:
            raw = json.load(f)
        # Trim to essential fields for the viewer
        steps = []
        for entry in raw:
            meta = entry.get("metadata", {})
            cmd = entry.get("command", {})
            step: Dict[str, Any] = {
                "s": meta.get("status", "UNKNOWN"),
                "d": meta.get("duration", 0),
            }
            err = meta.get("error", {})
            if err:
                step["e"] = err.get("message", "")

            # Decode command type + selector
            if "tapOnElement" in cmd:
                sel = cmd["tapOnElement"].get("selector", {})
                step["t"] = "tapOn"
                if sel.get("idRegex"):
                    step["id"] = sel["idRegex"]
                if sel.get("textRegex"):
                    step["tx"] = sel["textRegex"]
                if cmd["tapOnElement"].get("optional"):
                    step["opt"] = True
            elif "assertConditionCommand" in cmd:
                cond = cmd["assertConditionCommand"].get("condition", {})
                if "visible" in cond:
                    vis = cond["visible"]
                    step["t"] = "assertVisible"
                    if vis.get("idRegex"):
                        step["id"] = vis["idRegex"]
                    if vis.get("textRegex"):
                        step["tx"] = vis["textRegex"]
                elif "notVisible" in cond:
                    nv = cond["notVisible"]
                    step["t"] = "assertNotVisible"
                    if nv.get("idRegex"):
                        step["id"] = nv["idRegex"]
                    if nv.get("textRegex"):
                        step["tx"] = nv["textRegex"]
                else:
                    step["t"] = "assert"
                if cmd["assertConditionCommand"].get("optional"):
                    step["opt"] = True
            elif "launchAppCommand" in cmd:
                step["t"] = "launchApp"
            elif "inputTextCommand" in cmd:
                step["t"] = "inputText"
                step["tx"] = cmd["inputTextCommand"].get("text", "")
            elif "eraseTextCommand" in cmd:
                step["t"] = "eraseText"
            elif "swipeCommand" in cmd:
                step["t"] = "swipe"
            elif "runFlowCommand" in cmd:
                step["t"] = "runFlow"
                step["tx"] = str(cmd["runFlowCommand"].get("path", ""))
            elif "scrollUntilVisibleCommand" in cmd:
                step["t"] = "scrollUntilVisible"
            elif "waitForAnimationToEndCommand" in cmd:
                step["t"] = "waitForAnimation"
            elif "backPressCommand" in cmd:
                step["t"] = "backPress"
            elif "hideKeyboardCommand" in cmd:
                step["t"] = "hideKeyboard"
            else:
                keys = list(cmd.keys())
                step["t"] = keys[0] if keys else "unknown"

            steps.append(step)

        # Maestro stores most-recent-first; reverse for chronological
        steps.reverse()
        return steps
    except (json.JSONDecodeError, OSError):
        return None


def read_hierarchy_summary(run_dir: str, flow_name: str) -> Optional[Dict]:
    """Read a trimmed hierarchy.json for the viewer (IDs + texts only)."""
    hier_path = os.path.join(run_dir, "tests", flow_name, "hierarchy.json")
    if not os.path.exists(hier_path):
        return None
    try:
        with open(hier_path) as f:
            tree = json.load(f)

        ids: List[str] = []
        texts: List[str] = []

        def walk(node: Dict) -> None:
            attrs = node.get("attributes", {})
            rid = attrs.get("resource-id", "")
            text = attrs.get("text", "")
            if rid:
                ids.append(rid)
            if text:
                texts.append(text)
            for child in node.get("children", []):
                walk(child)

        walk(tree)
        return {"ids": ids[:50], "texts": texts[:50]}
    except (json.JSONDecodeError, OSError, KeyError):
        return None


def build_manifest(run_dir: str, ndjson_results: List[Dict]) -> Dict:
    """Build manifest.json from NDJSON results."""
    run_id = os.path.basename(run_dir)

    totals = {"passed": 0, "failed": 0, "skipped": 0, "total": 0, "durationMs": 0}
    tests_summary: List[Dict] = []

    for entry in ndjson_results:
        status = entry.get("status", "unknown")
        duration = entry.get("durationMs", 0)
        totals["total"] += 1
        totals["durationMs"] += duration
        if status in totals:
            totals[status] += 1

        tests_summary.append({
            "flow": entry.get("flow", ""),
            "status": status,
            "durationMs": duration,
            "phase": entry.get("phase", ""),
            "featureArea": entry.get("featureArea", "Sin categoría"),
        })

    pass_rate = (totals["passed"] / totals["total"] * 100) if totals["total"] > 0 else 0

    manifest = {
        "runId": run_id,
        "timestamp": ndjson_results[0]["timestamp"] if ndjson_results else time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "totals": totals,
        "passRate": round(pass_rate, 1),
        "tests": tests_summary,
    }

    manifest_path = os.path.join(run_dir, "manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, default=str)

    return manifest



def read_fold_audit(run_dir, flow_name):
    """Trimmed fold-audit.json for inlining into data.js.

    The viewer runs over file://, where fetch() is CORS-blocked, so anything
    rendered inline must be embedded here rather than fetched.
    """
    path = os.path.join(run_dir, "tests", flow_name, "fold-audit.json")
    if not os.path.exists(path):
        return None
    try:
        with open(path) as fh:
            fold = json.load(fh)
    except (json.JSONDecodeError, OSError):
        return None
    return {
        "verdict": fold.get("verdict"),
        "priority": fold.get("priority"),
        "counts": fold.get("counts", {}),
        "hidden": fold.get("hidden", [])[:25],
        "straddlers": fold.get("straddlers", [])[:10],
        "warnings": fold.get("warnings", []),
    }

def build_data_js(run_dir: str, manifest: Dict) -> None:
    """Build data.js for the viewer (window.RUN_DATA = {...})."""
    test_results = read_test_results(run_dir)

    tests_data: List[Dict] = []
    for result in test_results:
        flow_name = result.get("flow", "")
        entry: Dict[str, Any] = {
            "flow": flow_name,
            "status": result.get("status", "unknown"),
            "durationMs": result.get("durationMs", 0),
            "phase": result.get("phase", ""),
            "featureArea": result.get("featureArea", "Sin categoría"),
            "entrypoint": result.get("entrypoint", ""),
            "failedStep": result.get("failedStep"),
            "probableCause": result.get("probableCause"),
            "artifacts": result.get("artifacts", {}),
        }

        # Include step trace
        steps = read_commands_json(run_dir, flow_name)
        if steps is not None:
            entry["steps"] = steps

        # Include hierarchy summary for failures
        if result.get("status") == "failed":
            hier = read_hierarchy_summary(run_dir, flow_name)
            if hier:
                entry["hierarchy"] = hier

        # Fold audit applies to PASSING flows too — a false bottom is a
        # defect on a screen that otherwise works, which is why it hides.
        fold = read_fold_audit(run_dir, flow_name)
        if fold:
            entry["fold"] = fold

        tests_data.append(entry)

    run_data = {
        "runId": manifest["runId"],
        "timestamp": manifest["timestamp"],
        "totals": manifest["totals"],
        "passRate": manifest["passRate"],
        "tests": tests_data,
    }

    data_js_path = os.path.join(run_dir, "data.js")
    with open(data_js_path, "w") as f:
        f.write("window.RUN_DATA = ")
        json.dump(run_data, f, default=str)
        f.write(";\n")


def list_all_runs(report_root: Path) -> List[Path]:
    """List all run directories sorted by name (newest first)."""
    runs_dir = report_root / "runs"
    if not runs_dir.is_dir():
        return []
    runs = [d for d in runs_dir.iterdir() if d.is_dir() and (d / "manifest.json").exists()]
    runs.sort(key=lambda d: d.name, reverse=True)
    return runs


def compute_flaky_flags(all_manifests: List[Dict]) -> Set[str]:
    """Detect flaky tests: status flipped ≥2× in last 10 runs."""
    # Collect per-flow status history (last 10 runs)
    recent = all_manifests[:10]
    flow_history: Dict[str, List[str]] = {}

    for manifest in recent:
        for test in manifest.get("tests", []):
            flow = test.get("flow", "")
            status = test.get("status", "unknown")
            if flow not in flow_history:
                flow_history[flow] = []
            flow_history[flow].append(status)

    flaky: Set[str] = set()
    for flow, statuses in flow_history.items():
        if len(statuses) < 2:
            continue
        flips = sum(1 for i in range(1, len(statuses)) if statuses[i] != statuses[i - 1])
        if flips >= 2:
            flaky.add(flow)

    return flaky


def build_runs_index(report_root: Path) -> None:
    """Regenerate runs-index.js from all runs/*/manifest.json."""
    runs = list_all_runs(report_root)
    manifests: List[Dict] = []

    for run_path in runs:
        manifest_file = run_path / "manifest.json"
        try:
            with open(manifest_file) as f:
                manifests.append(json.load(f))
        except (json.JSONDecodeError, OSError):
            continue

    flaky = compute_flaky_flags(manifests)

    index_entries = []
    for m in manifests:
        entry = {
            "runId": m.get("runId", ""),
            "timestamp": m.get("timestamp", ""),
            "totals": m.get("totals", {}),
            "passRate": m.get("passRate", 0),
        }
        index_entries.append(entry)

    index_data = {
        "runs": index_entries,
        "flaky": sorted(flaky),
    }

    index_path = report_root / "runs-index.js"
    with open(index_path, "w") as f:
        f.write("window.RUNS_INDEX = ")
        json.dump(index_data, f, default=str)
        f.write(";\n")


def update_latest(report_root: Path, run_id: str) -> None:
    """Atomically update latest.json."""
    latest_path = report_root / "latest.json"
    tmp_path = report_root / "latest.json.tmp"

    data = {"runId": run_id, "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z")}

    with open(tmp_path, "w") as f:
        json.dump(data, f, indent=2, default=str)

    os.replace(str(tmp_path), str(latest_path))


def prune_old_runs(report_root: Path) -> int:
    """Remove runs beyond MAX_RUNS (oldest first). Returns count pruned."""
    runs = list_all_runs(report_root)
    pruned = 0
    if len(runs) > MAX_RUNS:
        to_remove = runs[MAX_RUNS:]
        for run_path in to_remove:
            try:
                shutil.rmtree(run_path)
                pruned += 1
                print(f"  🗑️  Pruned old run: {run_path.name}")
            except OSError as e:
                print(f"  ⚠️  Could not prune {run_path.name}: {e}", file=sys.stderr)
    return pruned


def main() -> None:
    parser = argparse.ArgumentParser(description="Finalize a Maestro E2E report run")
    parser.add_argument("--run-dir", required=True, help="Path to the run directory")
    parser.add_argument(
        "--report-root",
        default="",
        help="Path to e2e-reports root (default: auto-detect from repo root)",
    )
    parser.add_argument(
        "--interrupted",
        action="store_true",
        help="Mark this run as interrupted (Ctrl-C / crash)",
    )
    args = parser.parse_args()

    report_root = Path(args.report_root) if args.report_root else REPORT_ROOT

    if not os.path.isdir(args.run_dir):
        print(f"⚠️  Run directory not found: {args.run_dir}", file=sys.stderr)
        sys.exit(1)

    print("📊  Finalizing report...")

    # 1. Read NDJSON
    ndjson_results = read_ndjson(args.run_dir)
    if not ndjson_results:
        print("  ⚠️  No results found in results.ndjson")

    # 2. Build manifest
    manifest = build_manifest(args.run_dir, ndjson_results)
    if args.interrupted:
        manifest["interrupted"] = True
        # Re-write manifest with interrupted flag
        manifest_path = os.path.join(args.run_dir, "manifest.json")
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2, default=str)

    total = manifest["totals"]["total"]
    passed = manifest["totals"]["passed"]
    failed = manifest["totals"]["failed"]
    print(f"  📋  Manifest: {total} tests ({passed} passed, {failed} failed)")

    # 3. Build data.js
    build_data_js(args.run_dir, manifest)
    print(f"  📦  data.js built")

    # 4. Regenerate runs-index.js
    build_runs_index(report_root)
    print(f"  📑  runs-index.js regenerated")

    # 5. Update latest.json
    run_id = os.path.basename(args.run_dir)
    update_latest(report_root, run_id)
    print(f"  🔗  latest.json → {run_id}")

    # 6. Prune old runs
    pruned = prune_old_runs(report_root)
    if pruned:
        print(f"  🧹  Pruned {pruned} old run(s)")

    # Final message
    report_path = report_root / "index.html"
    print(f"\n  🌐  Report: {report_path}")
    if args.interrupted:
        print(f"  ⚠️  Run was interrupted — partial results only")


if __name__ == "__main__":
    main()
