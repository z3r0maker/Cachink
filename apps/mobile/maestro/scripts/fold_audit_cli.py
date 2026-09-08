#!/usr/bin/env python3
"""
CLI wrapper around fold_audit_lib — reads two hierarchy dumps, writes
fold-audit.json. Kept thin so the classifier stays unit-testable
(scripts/tests/test_fold_audit.py), mirroring how analyze-failure.py is
used by maestro-diagnose.sh.
"""
import argparse
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fold_audit_lib import audit  # noqa: E402

# A real dump is 30-450 KB. Refuse anything implausible rather than load
# it: on 2026-09-07 a maestro device-selection prompt loop produced a
# 62 GB "hierarchy.json", and json.load() on it exhausted system swap.
MAX_BYTES = 16 * 1024 * 1024


def load(path: str):
    if not os.path.exists(path):
        return None, f"missing {os.path.basename(path)}"
    size = os.path.getsize(path)
    if size > MAX_BYTES:
        return None, f"{os.path.basename(path)} is {size} bytes — refusing to parse"
    with open(path, "rb") as fh:
        if fh.read(1)[:1] != b"{":
            return None, f"{os.path.basename(path)} is not JSON"
    try:
        with open(path) as fh:
            return json.load(fh), None
    except Exception as exc:
        return None, f"{os.path.basename(path)}: {exc}"


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--before", required=True)
    p.add_argument("--after", required=True)
    p.add_argument("--flow", required=True)
    p.add_argument("--device", default="unknown")
    p.add_argument("--output", required=True)
    a = p.parse_args()

    pre, err1 = load(a.before)
    post, err2 = load(a.after)
    warnings = [e for e in (err1, err2) if e]

    if pre is None or post is None:
        result = {"schemaVersion": 1, "verdict": "PROBE_FAILED", "warnings": warnings}
    else:
        result = audit(pre, post)
        result.setdefault("warnings", []).extend(warnings)

    result["flow"] = a.flow
    result["device"] = a.device
    result["capturedAt"] = datetime.datetime.now().astimezone().isoformat(timespec="seconds")

    with open(a.output, "w") as fh:
        json.dump(result, fh, indent=2, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
