#!/usr/bin/env python3
"""
One-shot script: convert Director.webp / Operador.webp DALL·E silhouettes
into transparent PNG role avatars for the Cachink! app.

Each source image is a 1024×1024 RGB with DALL·E's checkerboard "transparency"
baked in. We:
  1. Threshold to separate the dark silhouette from the bright checkerboard.
  2. Produce TWO colour variants per role:
       - "dark"  → black  silhouette on transparent (for yellow bg — Operativo)
       - "light" → yellow silhouette on transparent (for black bg — Director)
     This preserves interior detail lines (tie, collar, apron strings).
  3. Resize to 132×132 (@3x for the 44-pt avatar) with Lanczos resampling.
  4. Write to assets/brand/ (source-of-truth) and packages/ui/src/assets/.

Run from the repo root:
    python3 scripts/process-role-icons.py
"""

from pathlib import Path
from PIL import Image
import numpy as np

REPO = Path(__file__).resolve().parent.parent
SIZE = 132  # @3x for 44 pt
THRESHOLD = 130  # brightness below this → silhouette; above → checkerboard bg

# Brand colours from packages/ui/src/theme.ts
YELLOW = (255, 214, 10)  # #FFD60A
BLACK  = (13, 13, 13)    # #0D0D0D

ROLES = {
    "Director": "director",
    "Operador": "operativo",
}


def process(source_name: str, role_slug: str) -> None:
    src_path = REPO / f"{source_name}.webp"
    img = Image.open(src_path).convert("RGBA")
    arr = np.array(img)

    # Build an alpha mask: silhouette pixels (dark) → opaque; bg → transparent.
    avg_brightness = arr[:, :, :3].mean(axis=2)
    is_silhouette = avg_brightness < THRESHOLD

    # --- Dark variant (black silhouette, transparent bg) ---
    dark = np.zeros_like(arr)
    dark[:, :, 0] = BLACK[0]
    dark[:, :, 1] = BLACK[1]
    dark[:, :, 2] = BLACK[2]
    dark[:, :, 3] = 0
    dark[is_silhouette, 3] = 255
    # Preserve brightness modulation so detail lines stay visible:
    # within the silhouette, lighter pixels get reduced alpha.
    sil_brightness = avg_brightness[is_silhouette]
    # Map [0, THRESHOLD] → [255, 60] so darker is more opaque.
    alpha_range = np.clip(255 - (sil_brightness / THRESHOLD * 195), 60, 255).astype(np.uint8)
    dark[is_silhouette, 3] = alpha_range

    dark_img = Image.fromarray(dark).resize((SIZE, SIZE), Image.LANCZOS)

    # --- Light variant (yellow silhouette, transparent bg) ---
    light = np.zeros_like(arr)
    light[:, :, 0] = YELLOW[0]
    light[:, :, 1] = YELLOW[1]
    light[:, :, 2] = YELLOW[2]
    light[:, :, 3] = 0
    light[is_silhouette, 3] = alpha_range

    light_img = Image.fromarray(light).resize((SIZE, SIZE), Image.LANCZOS)

    # Write outputs
    for variant, pil_img in [("dark", dark_img), ("light", light_img)]:
        filename = f"role-{role_slug}-{variant}.png"
        for dest_dir in [REPO / "assets" / "brand", REPO / "packages" / "ui" / "src" / "assets"]:
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / filename
            pil_img.save(dest, "PNG")
            print(f"  ✓ {dest.relative_to(REPO)}")


def main() -> None:
    for source_name, role_slug in ROLES.items():
        print(f"\nProcessing {source_name} → {role_slug}")
        process(source_name, role_slug)
    print("\nDone.")


if __name__ == "__main__":
    main()
