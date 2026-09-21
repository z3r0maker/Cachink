#!/usr/bin/env bash
# The receipt families for local macOS dev (N-20): darwin's raster path is
# CoreText, which only sees installed fonts. Linux (CI/deploys) resolves
# through the fontconfig conf the server generates at runtime instead.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/../assets/comprobante-fonts/fonts" && pwd)"
if [ "$(uname)" = "Darwin" ]; then
  mkdir -p "$HOME/Library/Fonts"
  cp "$DIR"/*.ttf "$HOME/Library/Fonts/"
  echo "fuentes de comprobantes instaladas en ~/Library/Fonts"
else
  echo "nada que hacer: linux resuelve vía fontconfig en runtime"
fi
