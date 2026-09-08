#!/usr/bin/env python3
"""
Unit tests for fold_audit_lib — synthetic before/after hierarchy pairs.

Run: python3 apps/mobile/maestro/scripts/tests/test_fold_audit.py

Uses stdlib unittest only, matching the no-extra-deps convention of the
other scripts in this directory.
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from fold_audit_lib import audit  # noqa: E402

SCREEN_W, SCREEN_H = 750, 1334


def node(rid="", text="", acc="", bounds=(0, 0, 0, 0), enabled=True, children=None):
    x1, y1, x2, y2 = bounds
    return {
        "attributes": {
            "resource-id": rid,
            "text": text,
            "accessibilityText": acc,
            "bounds": f"[{x1},{y1}][{x2},{y2}]",
            "enabled": "true" if enabled else "false",
        },
        "children": children or [],
    }


def screen(*kids):
    """Root is [0,0][0,0]; its first child is the window — as iOS reports it."""
    return node(bounds=(0, 0, 0, 0),
                children=[node(bounds=(0, 0, SCREEN_W, SCREEN_H), children=list(kids))])


def tab_bar():
    """A fixed bottom bar, identical in both dumps.

    Deliberately NOT flush with the screen edge: a real iOS tab bar sits above
    the home indicator (measured 34px on an iPhone 17). Detection must tolerate
    that safe-area gap.
    """
    return node(rid="bottom-tab-bar", bounds=(0, 1240, SCREEN_W, SCREEN_H - 34))


class TestFoldAudit(unittest.TestCase):

    def test_no_overflow_when_nothing_moves(self):
        s = screen(node(rid="card-a", bounds=(20, 100, 730, 300)))
        self.assertEqual(audit(s, s)["verdict"], "NO_OVERFLOW")

    def test_no_cue_is_the_bug(self):
        """Button revealed only after scrolling, nothing straddling the fold."""
        before = screen(node(rid="card-a", bounds=(20, 100, 730, 600)))
        after = screen(
            node(rid="card-a", bounds=(20, -200, 730, 300)),
            node(rid="guardar-btn", text="Guardar", bounds=(20, 900, 730, 970)),
        )
        r = audit(before, after)
        self.assertEqual(r["verdict"], "NO_CUE")
        self.assertEqual(r["priority"], "P1")
        self.assertEqual(r["counts"]["hiddenInteractive"], 1)
        self.assertIn("id:guardar-btn", [h["key"] for h in r["hidden"]])

    def test_hidden_with_cue_is_less_severe(self):
        """Same overflow, but a card is clipped by the fold => a scroll cue."""
        before = screen(
            node(rid="card-a", bounds=(20, 100, 730, 600)),
            node(rid="card-b", bounds=(20, 1200, 730, 1500)),   # straddles 1334
        )
        after = screen(
            node(rid="card-a", bounds=(20, -200, 730, 300)),
            node(rid="card-b", bounds=(20, 400, 730, 700)),
            node(rid="guardar-btn", text="Guardar", bounds=(20, 900, 730, 970)),
        )
        r = audit(before, after)
        self.assertEqual(r["verdict"], "HIDDEN")
        self.assertGreater(r["counts"]["straddlers"], 0)

    def test_two_pixel_overhang_is_not_a_cue(self):
        """A 2px sliver is not a visible affordance (CUE_MIN_PX)."""
        before = screen(
            node(rid="card-a", bounds=(20, 100, 730, 600)),
            node(rid="card-b", bounds=(20, 1332, 730, 1336)),   # 2px over
        )
        after = screen(
            node(rid="card-a", bounds=(20, -200, 730, 300)),
            node(rid="guardar-btn", text="Guardar", bounds=(20, 900, 730, 970)),
        )
        self.assertEqual(audit(before, after)["verdict"], "NO_CUE")

    def test_full_height_container_is_not_a_cue(self):
        """
        Regression test for the measured 176 -> 80 straddler filter: over half
        of raw straddlers are invisible full-height wrappers. Counting them
        would mislabel a real NO_CUE screen as HIDDEN.
        """
        before = screen(
            node(rid="scroll-container", bounds=(0, 0, SCREEN_W, 1500)),  # 1500 > 0.5*H
            node(rid="card-a", bounds=(20, 100, 730, 600)),
        )
        after = screen(
            node(rid="scroll-container", bounds=(0, 0, SCREEN_W, 1500)),
            node(rid="card-a", bounds=(20, -200, 730, 300)),
            node(rid="guardar-btn", text="Guardar", bounds=(20, 900, 730, 970)),
        )
        self.assertEqual(audit(before, after)["verdict"], "NO_CUE")

    def test_fixed_bottom_bar_lowers_the_fold(self):
        """Content behind the tab bar is on-screen but not visible."""
        before = screen(tab_bar(), node(rid="card-a", bounds=(20, 100, 730, 600)))
        after = screen(tab_bar(),
                       node(rid="card-a", bounds=(20, -200, 730, 300)),
                       node(rid="guardar-btn", bounds=(20, 900, 730, 970)))
        r = audit(before, after)
        self.assertEqual(r["screen"]["foldEffective"], 1240)
        self.assertEqual(r["screen"]["bottomBar"], "bottom-tab-bar")

    def test_virtualized_rows_are_collapsed_not_reported(self):
        """FlatList unmounts off-screen rows; revealing them is not a bug."""
        before = screen(node(rid="stock-list", bounds=(0, 100, 730, 600)))
        after = screen(
            node(rid="stock-list", bounds=(0, -200, 730, 300)),
            *[node(rid=f"producto-card-{i}", bounds=(20, 300 + i * 90, 730, 360 + i * 90))
              for i in range(6)],
        )
        r = audit(before, after)
        self.assertGreaterEqual(r["counts"]["listRowsCollapsed"], 4)
        self.assertEqual(r["counts"]["hidden"], 0)
        self.assertEqual(r["verdict"], "CLEAN")

    def test_currency_noise_is_not_a_finding(self):
        """Revealed bare numbers are data, not controls."""
        before = screen(node(rid="card-a", bounds=(20, 100, 730, 600)))
        after = screen(
            node(rid="card-a", bounds=(20, -200, 730, 300)),
            node(text="$1,240.00", bounds=(20, 900, 300, 930)),
        )
        r = audit(before, after)
        self.assertEqual(r["counts"]["hidden"], 0)

    def test_orientation_change_invalidates_the_diff(self):
        before = screen(node(rid="card-a", bounds=(20, 100, 730, 600)))
        after = node(bounds=(0, 0, 0, 0),
                     children=[node(bounds=(0, 0, 1334, 750),
                                    children=[node(rid="card-a", bounds=(20, 100, 730, 600))])])
        self.assertEqual(audit(before, after)["verdict"], "PROBE_FAILED")

    def test_duplicate_bounds_counted_once(self):
        """iOS reports the same element at several depths with equal bounds."""
        dup = node(rid="guardar-btn", text="Guardar", bounds=(20, 900, 730, 970))
        before = screen(node(rid="card-a", bounds=(20, 100, 730, 600)))
        after = screen(node(rid="card-a", bounds=(20, -200, 730, 300)), dup, dup, dup)
        r = audit(before, after)
        self.assertEqual(r["counts"]["hidden"], 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
