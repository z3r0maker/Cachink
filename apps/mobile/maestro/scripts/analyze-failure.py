#!/usr/bin/env python3
"""
analyze-failure.py — Maestro test failure diagnostic engine.

Combines three data sources to produce a structured markdown report:
  1. commands.json  — the step trace (find the failed step + warnings)
  2. hierarchy.json — what's actually on screen (extract testIDs + text)
  3. flow YAML      — what the flow expected (parse targets)

Usage:
  python3 analyze-failure.py \
    --flow path/to/flow.yaml \
    --commands path/to/commands.json \
    --hierarchy path/to/hierarchy.json \
    --screenshot path/to/screenshot.png \
    --output path/to/report.md
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple


def parse_commands(path: str) -> List[Dict]:
    """Parse commands JSON into a list of step dicts (chronological order)."""
    with open(path) as f:
        raw = json.load(f)

    steps = []
    for entry in raw:
        meta = entry.get("metadata", {})
        cmd = entry.get("command", {})
        step = {
            "status": meta.get("status", "UNKNOWN"),
            "duration": meta.get("duration", 0),
            "error_message": "",
        }

        err = meta.get("error", {})
        if err:
            step["error_message"] = err.get("message", "")

        # Decode command type
        if "tapOnElement" in cmd:
            sel = cmd["tapOnElement"].get("selector", {})
            step["type"] = "tapOn"
            step["id"] = sel.get("idRegex", "")
            step["text"] = sel.get("textRegex", "")
            step["optional"] = cmd["tapOnElement"].get("optional", False)
        elif "assertConditionCommand" in cmd:
            cond = cmd["assertConditionCommand"].get("condition", {})
            if "visible" in cond:
                vis = cond["visible"]
                step["type"] = "assertVisible"
                step["id"] = vis.get("idRegex", "")
                step["text"] = vis.get("textRegex", "")
            elif "notVisible" in cond:
                nv = cond["notVisible"]
                step["type"] = "assertNotVisible"
                step["id"] = nv.get("idRegex", "")
                step["text"] = nv.get("textRegex", "")
            else:
                step["type"] = "assert"
                step["id"] = ""
                step["text"] = ""
            step["optional"] = cmd["assertConditionCommand"].get("optional", False)
        elif "launchAppCommand" in cmd:
            step["type"] = "launchApp"
            step["id"] = ""
            step["text"] = ""
            step["optional"] = False
        elif "inputTextCommand" in cmd:
            step["type"] = "inputText"
            step["text"] = cmd["inputTextCommand"].get("text", "")
            step["id"] = ""
            step["optional"] = False
        elif "eraseTextCommand" in cmd:
            step["type"] = "eraseText"
            step["id"] = ""
            step["text"] = ""
            step["optional"] = False
        elif "swipeCommand" in cmd:
            step["type"] = "swipe"
            step["id"] = ""
            step["text"] = ""
            step["optional"] = False
        elif "runFlowCommand" in cmd:
            step["type"] = "runFlow"
            step["id"] = ""
            step["text"] = str(cmd["runFlowCommand"].get("path", ""))
            step["optional"] = False
        else:
            step["type"] = str(list(cmd.keys()))
            step["id"] = ""
            step["text"] = ""
            step["optional"] = False

        steps.append(step)

    # Maestro stores commands most-recent-first; reverse for chronological
    steps.reverse()
    return steps


def parse_hierarchy(path: str) -> Dict:
    """Parse hierarchy JSON, return {ids: set, texts: set, tree_summary: str}."""
    if not os.path.exists(path):
        return {"ids": set(), "texts": set(), "tree_summary": "(hierarchy not captured)"}

    with open(path) as f:
        tree = json.load(f)

    ids: Set[str] = set()
    texts: Set[str] = set()
    lines: List[str] = []

    def walk(node: Dict, depth: int = 0) -> None:
        attrs = node.get("attributes", {})
        rid = attrs.get("resource-id", "")
        text = attrs.get("text", "")
        a11y = attrs.get("accessibilityText", "")

        if rid:
            ids.add(rid)
        if text:
            texts.add(text)
        if a11y and a11y != text:
            texts.add(a11y)

        has_content = rid or text or (a11y and len(a11y) > 2)
        if has_content and depth < 6:
            indent = "  " * depth
            parts = []
            if rid:
                parts.append(f'id="{rid}"')
            if text:
                parts.append(f'text="{text}"')
            if a11y and a11y != text:
                parts.append(f'a11y="{a11y}"')
            lines.append(f"{indent}{' '.join(parts)}")

        for child in node.get("children", []):
            walk(child, depth + (1 if has_content else 0))

    walk(tree)
    summary = "\n".join(lines[:40])
    if len(lines) > 40:
        summary += f"\n  ... ({len(lines) - 40} more elements)"

    return {"ids": ids, "texts": texts, "tree_summary": summary}


def format_step(i: int, step: dict) -> str:
    """Format a step as a one-line summary."""
    emoji = {"COMPLETED": "✅", "FAILED": "❌", "WARNED": "⚠️"}.get(step["status"], "❓")
    target = ""
    if step.get("id"):
        target = f'id="{step["id"]}"'
    if step.get("text"):
        target += f' text="{step["text"]}"'
    opt = " [optional]" if step.get("optional") else ""
    return f'{emoji} #{i + 1:2d}  [{step["status"]:9s}]  {step["duration"]:6d}ms  {step["type"]} {target}{opt}'


def find_failed_step(steps: List[Dict]) -> Tuple[int, Optional[Dict]]:
    """Find the first FAILED step (chronological)."""
    for i, s in enumerate(steps):
        if s["status"] == "FAILED":
            return i, s
    return -1, None


def find_warned_steps(steps: List[Dict]) -> List[Tuple[int, Dict]]:
    """Find all WARNED (optional) steps."""
    return [(i, s) for i, s in enumerate(steps) if s["status"] == "WARNED"]


def diagnose(
    failed_step: Optional[Dict],
    warned_steps: List[Tuple[int, Dict]],
    hierarchy: Dict,
) -> str:
    """Generate a probable cause + suggested fix."""
    if failed_step is None:
        return "No failed step found in the commands trace."

    causes: List[str] = []

    # Check if expected element is on screen
    expected_id = failed_step.get("id", "")
    expected_text = failed_step.get("text", "")

    if expected_id and expected_id in hierarchy["ids"]:
        if failed_step["type"] == "assertNotVisible":
            causes.append(
                f'The element id="{expected_id}" IS on screen but the flow expected it to be GONE. '
                "A modal or overlay may not have closed yet."
            )
        else:
            causes.append(
                f'The element id="{expected_id}" IS on screen but Maestro couldn\'t interact with it. '
                "It might be obscured by an overlay, not yet interactive, or the view hierarchy is stale."
            )
    elif expected_id and expected_id not in hierarchy["ids"]:
        if failed_step["type"] in ("tapOn", "assertVisible"):
            causes.append(
                f'The element id="{expected_id}" is NOT on screen. '
                "The app may be on a different screen than expected."
            )

    if expected_text:
        text_found = any(expected_text in t for t in hierarchy["texts"])
        if failed_step["type"] == "assertVisible" and not text_found:
            causes.append(
                f'The text "{expected_text}" is NOT visible on screen. '
                "The app is on a different screen than the flow expects."
            )
        elif failed_step["type"] == "assertNotVisible" and text_found:
            causes.append(
                f'The text "{expected_text}" IS still visible. '
                "A dismiss/navigation action may not have completed."
            )

    # Check if warned optional steps could be blockers
    for idx, ws in warned_steps:
        warned_id = ws.get("id", "")
        if warned_id:
            # Check if a parent modal for this ID is on screen
            prefix = warned_id.rsplit("-", 1)[0] if "-" in warned_id else warned_id
            matches = [h for h in hierarchy["ids"] if h.startswith(prefix)]
            if matches:
                causes.append(
                    f'Optional step #{idx + 1} (tapOn id="{warned_id}") WARNED — '
                    f"but related elements {matches} ARE on screen. "
                    "A modal may be blocking and the optional tap didn't dismiss it."
                )

    if not causes:
        causes.append(
            "Could not determine an automated cause. "
            "Check the screenshot and hierarchy for unexpected UI state."
        )

    return "\n   ".join(causes)


def generate_report(
    flow_path: str,
    screenshot_path: str,
    steps: List[Dict],
    hierarchy: Dict,
) -> str:
    """Generate the full markdown diagnostic report."""
    flow_name = Path(flow_path).stem
    failed_idx, failed_step = find_failed_step(steps)
    warned = find_warned_steps(steps)

    lines = [
        "━" * 60,
        f"🔴 FAILURE REPORT: {flow_name}",
        "━" * 60,
        "",
    ]

    # Failed step section
    lines.append("📍 FAILED STEP")
    if failed_step:
        target = ""
        if failed_step.get("id"):
            target += f'id="{failed_step["id"]}" '
        if failed_step.get("text"):
            target += f'text="{failed_step["text"]}" '
        lines.append(f'   Step #{failed_idx + 1}: {failed_step["type"]} {target.strip()}')
        lines.append(f'   Duration: {failed_step["duration"]:,}ms (timeout)')
        if failed_idx > 0:
            prev = steps[failed_idx - 1]
            lines.append(f"   Previous: {format_step(failed_idx - 1, prev)}")
    else:
        lines.append("   (no failed step found)")
    lines.append("")

    # Screenshot section
    lines.append("📸 SCREENSHOT AT FAILURE")
    if os.path.exists(screenshot_path):
        lines.append(f"   → {screenshot_path}")
    else:
        lines.append("   (screenshot not captured)")
    lines.append("")

    # Hierarchy section
    lines.append("🔎 VIEW HIERARCHY (elements on screen)")
    lines.append(hierarchy["tree_summary"])
    lines.append("")

    # Expected vs Actual
    lines.append("❌ EXPECTED vs ACTUAL")
    if failed_step:
        if failed_step.get("id"):
            found = failed_step["id"] in hierarchy["ids"]
            marker = "✅ found" if found else "❌ NOT found"
            lines.append(f'   Expected id: "{failed_step["id"]}" → {marker}')
        if failed_step.get("text"):
            found = any(failed_step["text"] in t for t in hierarchy["texts"])
            marker = "✅ found" if found else "❌ NOT found"
            lines.append(f'   Expected text: "{failed_step["text"]}" → {marker}')

        # Show what IS on screen (top-level IDs)
        top_ids = sorted(hierarchy["ids"])[:15]
        if top_ids:
            lines.append(f'   On screen: {", ".join(top_ids)}')
    lines.append("")

    # Warnings section
    if warned:
        lines.append("⚠️  WARNINGS (optional steps that didn't match)")
        for idx, ws in warned:
            target = ws.get("id") or ws.get("text") or "?"
            lines.append(f'   Step #{idx + 1}: {ws["type"]} "{target}" → WARNED (not found)')
        lines.append("")

    # Diagnosis section
    lines.append("💡 PROBABLE CAUSE")
    diagnosis = diagnose(failed_step, warned, hierarchy)
    lines.append(f"   {diagnosis}")
    lines.append("")

    # Full step trace
    lines.append("📋 FULL STEP TRACE")
    for i, s in enumerate(steps):
        lines.append(f"   {format_step(i, s)}")
    lines.append("")
    lines.append("━" * 60)

    return "\n".join(lines)


def diagnose_failure(
    commands_path: str,
    hierarchy_path: str,
    flow_path: str = "",
    screenshot_path: str = "",
) -> Dict:
    """High-level entry point for programmatic callers (e.g. report-collect.py).

    Returns a dict with:
      - steps: list of step dicts
      - failed_index: int (-1 if none)
      - failed_step: dict or None
      - warned_steps: list of (index, step) tuples
      - probable_cause: str
      - hierarchy_summary: str
      - hierarchy_ids: set of str
      - hierarchy_texts: set of str
    """
    steps = parse_commands(commands_path)
    hierarchy = parse_hierarchy(hierarchy_path)
    failed_idx, failed_step = find_failed_step(steps)
    warned = find_warned_steps(steps)
    cause = diagnose(failed_step, warned, hierarchy)

    return {
        "steps": steps,
        "failed_index": failed_idx,
        "failed_step": failed_step,
        "warned_steps": warned,
        "probable_cause": cause,
        "hierarchy_summary": hierarchy["tree_summary"],
        "hierarchy_ids": hierarchy["ids"],
        "hierarchy_texts": hierarchy["texts"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Maestro failure diagnostic")
    parser.add_argument("--flow", required=True, help="Path to the flow YAML")
    parser.add_argument("--commands", required=True, help="Path to commands JSON")
    parser.add_argument("--hierarchy", required=True, help="Path to hierarchy JSON")
    parser.add_argument("--screenshot", default="", help="Path to failure screenshot")
    parser.add_argument("--output", default="", help="Path to write the report")
    args = parser.parse_args()

    if not os.path.exists(args.commands):
        print(f"⚠️  Commands file not found: {args.commands}", file=sys.stderr)
        sys.exit(1)

    steps = parse_commands(args.commands)
    hierarchy = parse_hierarchy(args.hierarchy)
    report = generate_report(args.flow, args.screenshot, steps, hierarchy)

    if args.output:
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, "w") as f:
            f.write(report)
        print(f"📄 Report written to {args.output}")

    print(report)


if __name__ == "__main__":
    main()
