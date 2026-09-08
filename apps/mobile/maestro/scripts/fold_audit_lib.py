#!/usr/bin/env python3
"""
fold_audit_lib — classify "false bottom" defects from a pair of Maestro
iOS view-hierarchy dumps (before scrolling / after scrolling).

THE DEFECT
    A screen overflows so an interactive control sits entirely below the
    fold, while the visible portion looks complete — nothing is partially
    clipped to hint that the screen scrolls. Users never scroll, so they
    never find the control.

WHY THE DIFF IS NEEDED
    `maestro hierarchy` (XCUITest underneath) CLAMPS the reported tree to
    the viewport. Measured across the 44 dumps in e2e-reports/: 6,355
    nodes, ZERO with y1 >= screenHeight, 176 straddling the fold. So a
    single dump can never show below-fold content. Scrolling and diffing
    recovers it — and unlike a screenshot, the result comes out NAMED.

THE KEY DISTINCTION
    An element clipped BY the fold is a feature, not a bug: it is the cue
    that tells the user to scroll. The dangerous case is a fold that lands
    in a clean gap between elements, so the screen reads as finished.
        overflow + a straddling element  -> HIDDEN  (cue present)
        overflow + no straddler          -> NO_CUE  (the real bug)
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass

BOUNDS_RE = re.compile(r"\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]")

# A straddler overhanging by less than this is not a visible cue.
CUE_MIN_PX = 24
# Nodes at least this tall are layout containers, not content. Measured:
# this filter alone cuts the raw straddler count from 176 to 80 — over
# half of all straddlers are invisible full-height wrappers, and counting
# them would mislabel real NO_CUE screens as HIDDEN.
CONTAINER_FRAC = 0.5
# A fixed bottom bar sits ABOVE the home indicator, not flush with the screen
# edge. Measured 34px on an iPhone 17; allow headroom for other devices.
SAFE_AREA_SLACK = 60
# Resource-ids that look like controls rather than content.
CONTROL_RE = re.compile(
    r"(btn|button|submit|save|guardar|continuar|siguiente|cancelar|cerrar|"
    r"confirm|aceptar|fab|link|tab|input|field|toggle|switch|check|picker|"
    r"select|eliminar|borrar|agregar|nuevo|editar)",
    re.I,
)
# Text that is plainly data, not a label (currency, dates, times, percents).
DATA_RE = re.compile(
    r"^\$?[\d.,]+$|^\d{1,2}/\d{1,2}(/\d{2,4})?$|"
    r"^\d{1,2}:\d{2}( ?[ap]\.?m\.?)?$|^-?\d+%$"
)


@dataclass(frozen=True)
class Node:
    rid: str
    text: str
    acc: str
    x1: int
    y1: int
    x2: int
    y2: int
    enabled: bool

    @property
    def h(self) -> int:
        return self.y2 - self.y1

    @property
    def named(self) -> bool:
        return bool(self.rid or self.text or self.acc)

    @property
    def label(self) -> str:
        return self.rid or self.acc or self.text

    def key(self) -> str:
        if self.rid:
            return f"id:{self.rid}"
        if self.acc:
            return f"acc:{_norm(self.acc)}"
        return f"text:{_norm(self.text)}"


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "")).strip().casefold()


def parse(doc: dict) -> list[Node]:
    """Flatten a hierarchy dump into Nodes, dropping degenerate bounds."""
    out: list[Node] = []

    def walk(n):
        if isinstance(n, dict):
            a = n.get("attributes") or {}
            m = BOUNDS_RE.match(a.get("bounds", "") or "")
            if m:
                x1, y1, x2, y2 = (int(v) for v in m.groups())
                if x2 > x1 and y2 > y1:
                    out.append(
                        Node(
                            rid=(a.get("resource-id") or "").strip(),
                            text=(a.get("text") or "").strip(),
                            acc=(a.get("accessibilityText") or "").strip(),
                            x1=x1, y1=y1, x2=x2, y2=y2,
                            enabled=a.get("enabled") == "true",
                        )
                    )
            for c in n.get("children") or []:
                walk(c)

    walk(doc)
    return out


def window_size(doc: dict) -> tuple[int, int]:
    """
    Window bounds, read STRUCTURALLY: the root is [0,0][0,0] and its first
    child is the window.

    Do not infer this as "the tallest element anchored at the origin". On a
    scrolling screen the scroll-content container is anchored at (0,0) and is
    TALLER than the window — measured 1110 vs the real 874 on an iPhone 17
    login screen, which made the before/after heights disagree and the audit
    reject itself as a rotation.
    """
    for child in doc.get("children") or []:
        m = BOUNDS_RE.match((child.get("attributes") or {}).get("bounds", "") or "")
        if m:
            x1, y1, x2, y2 = (int(v) for v in m.groups())
            if x2 > x1 and y2 > y1:
                return x2 - x1, y2 - y1
    # Fallback: the modal width shared by most nodes, and the tallest bottom.
    return (0, 0)


def effective_fold(pre: list[Node], post: list[Node], screen_h: int) -> tuple[int, str | None]:
    """
    The fold is the top of a FIXED bottom bar, not the screen edge.

    Content behind the tab bar is inside screen bounds but not visible.
    Verified on the stored dumps: `bottom-tab-bar` appears in 28 of 44 and
    sits at y=1284..1356 on a 1376-tall screen, so the true fold is 92px
    above the screen edge.

    "Fixed" is established by identical bounds in BOTH dumps after
    scrolling — that is what separates a pinned tab bar from a list row
    that merely happens to sit at the bottom.
    """
    post_bounds = {(n.rid, n.y1, n.y2) for n in post if n.rid}
    best: tuple[int, str] | None = None
    for n in pre:
        if not n.rid or n.h > 140:
            continue
        # The bar does NOT reach the screen edge: it sits above the home
        # indicator. Measured on an iPhone 17 (874 tall), `bottom-tab-bar` is
        # [0,768][402,840] — a 34px safe-area gap. Requiring y2 == screen_h
        # missed it entirely and left 106px of occluded content counted as
        # visible. SAFE_AREA_SLACK covers that inset across devices.
        if n.y2 < screen_h - SAFE_AREA_SLACK:
            continue
        if (n.rid, n.y1, n.y2) not in post_bounds:
            continue          # moved when scrolled => not a fixed bar
        if best is None or n.y1 < best[0]:
            best = (n.y1, n.rid)
    return best if best else (screen_h, None)


def _dedup(nodes: list[Node]) -> list[Node]:
    """Collapse identical (bounds, label) duplicates, keeping the deepest."""
    seen: dict[tuple, Node] = {}
    for n in nodes:
        seen[(n.x1, n.y1, n.x2, n.y2, n.rid, n.text, n.acc)] = n
    return list(seen.values())


def content_nodes(nodes: list[Node], screen_h: int) -> list[Node]:
    """Named, non-container nodes — the ones a user could actually mean."""
    return [
        n for n in _dedup(nodes)
        if n.named and n.h < screen_h * CONTAINER_FRAC
    ]


def classify_kind(n: Node) -> tuple[str, str]:
    """Return (kind, confidence). The iOS tree carries no element-type or
    trait field, so interactivity is a heuristic, never a fact."""
    if n.rid and CONTROL_RE.search(n.rid):
        return "control", "high"
    if not n.rid and DATA_RE.match(n.text or n.acc or ""):
        return "data", "high"
    if n.rid and n.enabled and 24 <= n.h <= 120 and (n.x2 - n.x1) >= 44:
        return "control", "medium"
    return "content", "low"


def collapse_list_rows(revealed: list[Node]) -> tuple[list[Node], int]:
    """
    Virtualized lists unmount off-screen rows, so scrolling reveals data
    rows that never existed in the first dump. Those are not controls and
    not bugs — without this, any list screen is ~90% noise.

    A repeating group is >=4 nodes of near-identical geometry.
    """
    by_shape: dict[tuple[int, int], list[Node]] = {}
    for n in revealed:
        by_shape.setdefault(((n.x2 - n.x1) // 8, n.h // 8), []).append(n)
    kept, collapsed = [], 0
    for group in by_shape.values():
        if len(group) >= 4:
            collapsed += len(group)
            continue
        kept.extend(group)
    return kept, collapsed


def audit(pre_doc: dict, post_doc: dict) -> dict:
    """Compare two dumps and return the finding."""
    pre, post = parse(pre_doc), parse(post_doc)
    if not pre or not post:
        return {"verdict": "PROBE_FAILED", "warnings": ["empty hierarchy dump"]}

    sw, sh = window_size(pre_doc)
    _, sh_post = window_size(post_doc)
    if sh <= 0 or sh_post <= 0:
        return {"verdict": "PROBE_FAILED", "warnings": ["could not determine window bounds"]}
    if sh != sh_post:
        return {
            "verdict": "PROBE_FAILED",
            "warnings": [f"screen height changed {sh} -> {sh_post} (rotation/modal)"],
        }

    fold, bar = effective_fold(pre, post, sh)
    pre_c, post_c = content_nodes(pre, sh), content_nodes(post, sh)

    a = {n.key(): n for n in pre_c}
    b = {n.key(): n for n in post_c}
    revealed = [b[k] for k in b.keys() - a.keys()]
    vanished = b.keys() ^ a.keys() - b.keys()
    shifted = any(a[k].y1 != b[k].y1 for k in a.keys() & b.keys())
    scrolled = bool(set(a) - set(b)) or shifted

    kept, collapsed = collapse_list_rows(revealed)
    hidden = []
    for n in kept:
        kind, conf = classify_kind(n)
        if kind == "data":
            continue
        hidden.append({
            "key": n.key(), "kind": kind, "confidence": conf,
            "resourceId": n.rid, "text": n.text, "accessibilityText": n.acc,
            "enabled": n.enabled, "interactive": kind == "control",
            "bounds": [n.x1, n.y1, n.x2, n.y2],
        })

    straddlers = [
        {"key": n.key(), "overhangPx": n.y2 - fold, "bounds": [n.x1, n.y1, n.x2, n.y2]}
        for n in pre_c
        if n.y1 < fold - CUE_MIN_PX < fold < n.y2
    ]

    if not scrolled:
        verdict = "NO_OVERFLOW"
    elif not hidden:
        verdict = "CLEAN"
    elif straddlers:
        verdict = "HIDDEN"
    else:
        verdict = "NO_CUE"

    interactive = [h for h in hidden if h["interactive"]]
    priority = (
        "P1" if verdict == "NO_CUE" and interactive
        else "P2" if verdict == "NO_CUE"
        else "P3" if verdict == "HIDDEN" and interactive
        else "P4"
    )

    return {
        "schemaVersion": 1,
        "verdict": verdict,
        "priority": priority,
        "screen": {"w": sw, "h": sh, "foldEffective": fold, "bottomBar": bar},
        "probe": {"scrolled": scrolled, "bottomReached": "assumed"},
        "counts": {
            "nodesBefore": len(pre), "nodesAfter": len(post),
            "contentBefore": len(pre_c), "contentAfter": len(post_c),
            "revealed": len(revealed), "hidden": len(hidden),
            "hiddenInteractive": len(interactive),
            "listRowsCollapsed": collapsed, "straddlers": len(straddlers),
        },
        "hidden": hidden[:25],
        "straddlers": straddlers[:10],
        "warnings": [],
    }
