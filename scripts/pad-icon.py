#!/usr/bin/env python3
"""
Pad + squircle-mask the Cachink brand icon to macOS-dock convention.

macOS / Apple HIG requires app icons to:
  1. Have transparent padding around the artwork (~9% on each side, so the
     art occupies ~82% of a 1024×1024 canvas — Apple's 824/1024 grid). This
     makes icons visually match in size across the Dock, Launchpad, and
     Finder.
  2. Be shaped as a **squircle** (rounded-rectangle / superellipse) rather
     than a hard square. macOS does **not** auto-mask icons at render time —
     an icon PNG drawn as a sharp square stays a sharp square on the Dock,
     making it look out-of-place next to system icons (Finder, Preview,
     etc. which are all squircles).

This script takes a square source PNG and produces a 1024×1024 RGBA PNG
where:
  - The source is scaled to occupy the configured fraction of the canvas.
  - A squircle alpha mask clips the corners to the Apple icon-grid shape.
  - The remaining area is fully transparent.

The squircle is approximated as a rounded rectangle with corner radius =
~22.5% of the artwork edge — visually indistinguishable from Apple's true
superellipse at Dock sizes (16–128 px) and close enough at 512+ px.

Usage:
    python3 scripts/pad-icon.py <input.png> <output.png> \
      [--scale 0.82] [--radius 0.225]

--scale   fraction of the 1024 canvas the artwork occupies (default 0.82,
          = Apple's 824/1024 grid). Raise to 0.86 for marks that don't fill
          their bounding box; lower to 0.76 for designs already
          square-to-the-edge.
--radius  corner radius as fraction of the artwork edge (default 0.225,
          ≈ Apple squircle). Use 0.5 for a perfect circle, 0.0 for a sharp
          rectangle, 0.18–0.25 for squircle approximations.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


CANVAS = 1024


def make_squircle_mask(size: int, radius_ratio: float) -> Image.Image:
    """
    Build a single-channel alpha mask shaped as a rounded rectangle
    (squircle approximation). `radius_ratio` is the corner radius as a
    fraction of the side length.
    """
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    radius = int(round(size * radius_ratio))
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=radius,
        fill=255,
    )
    return mask


def pad_icon(src: Path, dst: Path, scale: float, radius: float) -> None:
    if not (0.5 <= scale <= 1.0):
        raise SystemExit(f"--scale must be between 0.5 and 1.0, got {scale}")
    if not (0.0 <= radius <= 0.5):
        raise SystemExit(f"--radius must be between 0.0 and 0.5, got {radius}")

    img = Image.open(src).convert("RGBA")
    if img.width != img.height:
        raise SystemExit(
            f"Source must be square; got {img.width}×{img.height}. "
            "Crop first and re-run."
        )

    target = int(round(CANVAS * scale))
    resized = img.resize((target, target), resample=Image.LANCZOS)

    # Multiply the squircle mask with the source's own alpha so:
    #   - Pixels outside the squircle → fully transparent.
    #   - Pixels inside the squircle → keep whatever alpha the source had.
    # For our full-bleed yellow source (no alpha), this is equivalent to
    # stamping the squircle shape directly.
    squircle_mask = make_squircle_mask(target, radius)
    source_alpha = resized.split()[3]
    combined_alpha = ImageChops.multiply(squircle_mask, source_alpha)
    resized.putalpha(combined_alpha)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    offset = (CANVAS - target) // 2
    canvas.paste(resized, (offset, offset), resized)

    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, format="PNG")
    print(
        f"Wrote {dst} — {CANVAS}×{CANVAS} with {target}×{target} squircle "
        f"artwork (scale={scale}, corner-radius={radius}, "
        f"padding={offset}px on each side)."
    )


def main() -> None:
    args = sys.argv[1:]
    scale = 0.82
    radius = 0.225
    positional: list[str] = []
    i = 0
    while i < len(args):
        if args[i] == "--scale":
            scale = float(args[i + 1])
            i += 2
        elif args[i] == "--radius":
            radius = float(args[i + 1])
            i += 2
        else:
            positional.append(args[i])
            i += 1

    if len(positional) != 2:
        raise SystemExit(
            "Usage: pad-icon.py <input.png> <output.png> "
            "[--scale 0.82] [--radius 0.225]"
        )

    pad_icon(Path(positional[0]), Path(positional[1]), scale, radius)


if __name__ == "__main__":
    main()
