# assets/brand — Canonical Brand Masters

This directory holds the **single source of truth** for Cachink's brand
artwork. Nothing in this directory should ever be edited in place — to update
a master, replace the PNG wholesale and bump a version note in
`ARCHITECTURE.md` (see ADR-016).

## Files

| File | What it is | Consumed by |
|---|---|---|
| `icon.png` | Full-bleed app-icon artwork (1254×1254, no alpha) | **Copied** into `apps/mobile/assets/icon.png` — the iOS App Store requires a full-bleed, no-alpha 1024×1024 icon; iOS adds the squircle mask at render time. |
| `icon-padded.png` | Dock/Launchpad-ready icon (1024×1024 RGBA, ~82% artwork + 9% transparent safe-area padding per side — Apple HIG grid) | Fed to `pnpm tauri icon` for `apps/desktop/src-tauri/icons/*`. Matches the neighbouring macOS dock icons (Adobe, Preview, etc.) so Cachink doesn't render visually oversized. |
| `logo.png` | In-app brand logo (~1536×1024) | **Copied once** into `packages/ui/src/assets/logo.png`, then used by `<BrandLogo />` (Phase 1A-M2). Never copied into an app. |
| `splash.png` | Splash / banner artwork (~1672×941) | **Copied** into `apps/mobile/assets/splash.png` and `apps/desktop/src/shell/splash/splash.png` |

## Regenerating `icon-padded.png`

If `icon.png` ever changes (redesign, color tweak), re-run:

```bash
python3 scripts/pad-icon.py assets/brand/icon.png assets/brand/icon-padded.png --scale 0.82
pnpm --filter @cachink/desktop tauri icon ../../assets/brand/icon-padded.png
```

`--scale 0.82` matches Apple's 824/1024 grid (~80%). Tune this up (e.g. 0.86)
if the mark doesn't fill its own bounding box, down (e.g. 0.76) if the design
is already square-to-the-edge. The script validates the input is square.

## Rules

1. **These files are the only authoritative brand artwork.** Every other
   copy in the repo (mobile `assets/`, desktop `src-tauri/icons/`, the ui
   `packages/ui/src/assets/`) is a derivative of what lives here.
2. **Never edit a derivative directly.** If a derivative drifts from the
   master, replace it from this directory.
3. **Background colour for splash / adaptive-icon layers is `#FFD60A`**
   (`colors.yellow` from CLAUDE.md §8.1). Keep it consistent everywhere.
4. **Do not add new brand assets here without an ADR.** The set is
   intentionally small: one icon, one logo, one splash. New shapes belong to
   their feature's package, not to the brand master.

## Why this layout?

Per CLAUDE.md §2.3 ("code lives in exactly one place") the **in-app logo**
has a single source in `packages/ui` that both apps consume via
`@cachink/ui`. The **app icon** and **splash** must exist in each platform's
native asset location (Expo convention for mobile, Tauri convention for
desktop) — this is build-output duplication, not code duplication, and it is
allowed because the platforms require it. This directory is the upstream
source that both derivatives are reproduced from.

See `ARCHITECTURE.md` ADR-016 — Brand asset management strategy.
