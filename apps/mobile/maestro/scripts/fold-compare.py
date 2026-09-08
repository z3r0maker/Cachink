#!/usr/bin/env python3
"""
fold-compare — diff fold-audit results across device classes.

    fold-compare.py e2e-reports/fold-tours/iphone e2e-reports/fold-tours/ipad

Answers the question the whole exercise exists for: which controls are
reachable on the bigger device but sit below the fold on the smaller one?

Join key is the SCREEN (tour name), then the element key within it. Do NOT
join on a screen fingerprint — the same screen legitimately renders a
different element set per breakpoint ($gtMd reflows), which is exactly what
flows/ipad-form-factor-audit.yaml exists to police.
"""
from __future__ import annotations

import json
import os
import sys

# Ordered smallest -> largest. A control hidden on a smaller device but
# visible on a larger one is a responsive regression; the reverse is not.
SIZE_ORDER = ["se", "iphone", "ipad"]


def load(dirpath: str) -> dict[str, dict]:
    """screen name -> fold-audit.json"""
    out = {}
    if not os.path.isdir(dirpath):
        return out
    for screen in sorted(os.listdir(dirpath)):
        p = os.path.join(dirpath, screen, "fold-audit.json")
        if os.path.exists(p):
            try:
                with open(p) as fh:
                    out[screen] = json.load(fh)
            except (json.JSONDecodeError, OSError):
                pass
    return out


def hidden_keys(rec: dict, interactive_only: bool = False) -> set[str]:
    return {
        h["key"] for h in rec.get("hidden", [])
        if not interactive_only or h.get("interactive")
    }


def label_of(rec: dict, key: str) -> str:
    for h in rec.get("hidden", []):
        if h["key"] == key:
            return h.get("accessibilityText") or h.get("text") or ""
    return ""


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2

    devices: list[tuple[str, dict[str, dict]]] = []
    for d in sys.argv[1:]:
        name = os.path.basename(d.rstrip("/"))
        devices.append((name, load(d)))

    devices.sort(key=lambda kv: SIZE_ORDER.index(kv[0]) if kv[0] in SIZE_ORDER else 99)
    names = [n for n, _ in devices]

    print("=" * 74)
    print("FOLD AUDIT — CROSS-DEVICE COMPARISON")
    print("=" * 74)
    for n, recs in devices:
        print(f"  {n:<10} {len(recs)} screen(s) audited")
    print()

    screens = sorted(set().union(*[set(r) for _, r in devices]) if devices else [])

    # ── Per-screen summary ────────────────────────────────────────────
    print(f"{'SCREEN':<18}" + "".join(f"{n.upper():<26}" for n in names))
    print("-" * 74)
    for s in screens:
        row = f"{s:<18}"
        for _, recs in devices:
            r = recs.get(s)
            if not r:
                row += f"{'— not reached':<26}"
            else:
                v = r.get("verdict", "?")
                c = r.get("counts", {})
                row += f"{v + ' (' + str(c.get('hiddenInteractive', 0)) + ' ctrl)':<26}"
        print(row)
    print()

    # ── The headline: hidden on small, reachable on large ─────────────
    if len(devices) >= 2:
        small_name, small = devices[0]
        large_name, large = devices[-1]
        print("=" * 74)
        print(f"REGRESSIONS — reachable on {large_name}, BELOW THE FOLD on {small_name}")
        print("=" * 74)
        found = False
        for s in screens:
            sr, lr = small.get(s), large.get(s)
            if not sr or not lr:
                continue
            only_small = hidden_keys(sr, True) - hidden_keys(lr, True)
            if only_small:
                found = True
                print(f"\n  {s}:")
                for k in sorted(only_small):
                    lbl = label_of(sr, k)
                    print(f"     🔘 {k}" + (f"  — {lbl}" if lbl else ""))
        if not found:
            print("\n  none — no control is hidden on the small device but reachable on the large one")
        print()

        # ── Hidden everywhere: a layout bug, not a responsive one ──────
        print("=" * 74)
        print("HIDDEN ON EVERY DEVICE (layout bug, independent of screen size)")
        print("=" * 74)
        any_univ = False
        for s in screens:
            recs = [d.get(s) for _, d in devices]
            if not all(recs):
                continue
            common = set.intersection(*[hidden_keys(r, True) for r in recs])
            if common:
                any_univ = True
                print(f"\n  {s}:")
                for k in sorted(common):
                    print(f"     🔘 {k}")
        if not any_univ:
            print("\n  none")
        print()

    # ── Screens not comparable ────────────────────────────────────────
    incomparable = [s for s in screens if not all(s in r for _, r in devices)]
    if incomparable:
        print("=" * 74)
        print("NOT COMPARABLE (screen not reached on every device)")
        print("=" * 74)
        for s in incomparable:
            reached = [n for n, r in devices if s in r]
            print(f"  {s:<18} reached on: {', '.join(reached) or 'none'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
