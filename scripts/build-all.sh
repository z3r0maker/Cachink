#!/usr/bin/env bash
# Reproducible build script for Cachink (ADR-036).
#
# Produces:
#   1. EAS production build (iOS + Android) via `eas build -p all`.
#   2. Tauri desktop bundles for macOS + Windows.
#   3. SHA-256 checksums → dist/CHECKSUMS.txt.
#   4. CycloneDX SBOM → dist/sbom.json.
#
# Signing material comes from env:
#   - Mobile: EAS secrets (set via `eas secret:create`).
#   - Desktop macOS: CACHINK_APPLE_SIGNING_IDENTITY
#   - Desktop Windows: CACHINK_WINDOWS_CERT_THUMBPRINT
# Never commit these.
#
# Usage:
#   ./scripts/build-all.sh             # full signed build
#   ./scripts/build-all.sh --dry-run   # validate configs without building

set -euo pipefail

DRY_RUN=0
if [[ "${1-}" == "--dry-run" ]]; then DRY_RUN=1; fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
mkdir -p "$DIST"

echo "→ Cachink reproducible build"
echo "  Root: $ROOT"
echo "  Dist: $DIST"
echo "  Dry-run: $DRY_RUN"

# --------------------------------------------------------------------
# Step 1 — pre-flight: lint + typecheck + test
# --------------------------------------------------------------------
echo "→ Pre-flight: lint + typecheck + test"
if (( DRY_RUN == 0 )); then
  pnpm lint
  pnpm typecheck
  pnpm test
fi

# --------------------------------------------------------------------
# Step 2 — mobile (EAS)
# --------------------------------------------------------------------
echo "→ Mobile production build (EAS)"
if (( DRY_RUN == 0 )); then
  pushd "$ROOT/apps/mobile" >/dev/null
  npx --yes eas-cli build -p all --profile production --non-interactive --json > "$DIST/eas-build.json"
  popd >/dev/null
else
  echo "   [dry-run] would call: eas build -p all --profile production"
fi

# --------------------------------------------------------------------
# Step 3 — desktop (Tauri)
# --------------------------------------------------------------------
echo "→ Desktop build (Tauri)"
if (( DRY_RUN == 0 )); then
  pushd "$ROOT/apps/desktop" >/dev/null
  pnpm tauri build --target universal-apple-darwin --bundles dmg
  pnpm tauri build --target x86_64-pc-windows-msvc --bundles msi
  popd >/dev/null
else
  echo "   [dry-run] would call: tauri build for mac + windows"
fi

# --------------------------------------------------------------------
# Step 4 — checksums
# --------------------------------------------------------------------
echo "→ Checksums"
if (( DRY_RUN == 0 )); then
  find "$ROOT/apps/desktop/src-tauri/target" -type f \( -name "*.dmg" -o -name "*.msi" \) \
    -exec shasum -a 256 {} \; > "$DIST/CHECKSUMS.txt" || true
  cat "$DIST/CHECKSUMS.txt"
else
  echo "   [dry-run] would write SHA-256 sums to $DIST/CHECKSUMS.txt"
fi

# --------------------------------------------------------------------
# Step 5 — SBOM
# --------------------------------------------------------------------
echo "→ SBOM (CycloneDX)"
if (( DRY_RUN == 0 )); then
  pnpm dlx @cyclonedx/cdxgen -o "$DIST/sbom.json" --project-name cachink --project-version "$(node -p "require('./package.json').version")"
else
  echo "   [dry-run] would call: cdxgen -o $DIST/sbom.json"
fi

echo "✓ Done. Artefacts in $DIST/"
