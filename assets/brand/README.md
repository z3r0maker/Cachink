# assets/brand — Canonical Brand Masters

This directory holds the **single source of truth** for Xangarro's brand
artwork. Nothing in this directory should ever be edited in place — to update
a master, replace the PNG wholesale and bump a version note in
`ARCHITECTURE.md` (see ADR-016).

## Files

### `icons/` — the Xangarro icon kit (X-07, ADR-054 §6)

The angular-X coin. Three SVG masters; every PNG/ICO beside them is a rendering
of one of them. Edit a master, re-render, then re-copy the derivatives below.

| Master                   | What it is                                                      |
| ------------------------ | --------------------------------------------------------------- |
| `coin-master.svg`        | Detailed coin on a `#111111` square — the app icon.             |
| `maskable-master.svg`    | The same coin inset to 78 %, safe inside any OS mask.           |
| `mark-flat.svg`          | Flat yellow disc + X for small sizes (`favicon.svg` is a copy). |
| `android-foreground.svg` | Maskable coin without the square — adaptive-icon foreground.    |
| `android-monochrome.svg` | Single-colour silhouette — Android 13+ themed icon.             |

| Derivative                                                                 | Copied to                                                                                     |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `app-icon-1024.png` (RGB, **no alpha**)                                    | `apps/mobile/assets/icon.png` — the App Store rejects an icon with an alpha channel.          |
| `android-foreground-432.png`                                               | `apps/mobile/assets/adaptive-icon.png` (background is `#111111` in `app.json`).               |
| `android-monochrome-432.png`                                               | `apps/mobile/assets/adaptive-icon-monochrome.png`                                             |
| `favicon-48.png`                                                           | `apps/mobile/assets/favicon.png` (Expo web)                                                   |
| `favicon.ico`, `favicon.svg`, `app-icon-180.png`                           | `apps/{web,backoffice}/src/app/{favicon.ico,icon.svg,apple-icon.png}` (Next file conventions) |
| `favicon.ico`                                                              | `apps/landing/public/favicon.ico`                                                             |
| `favicon.svg`, `app-icon-{180,192,512}.png`, `icon-maskable-{192,512}.png` | `apps/landing/public/assets/` (`app-icon-180.png` → `apple-touch-icon.png`)                   |

`favicon-16.png` and `favicon-32.png` are kept as masters for anything that
needs a PNG favicon; nothing consumes them today.

### Still to land (X-07)

| File                | What it is                                           | Consumed by                                                                               |
| ------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `logo.png`          | In-app brand logo (~1536×1024)                       | **Copied once** into `packages/ui/src/assets/logo.png`, used by `<BrandLogo />`.          |
| `splash-mobile.png` | Mobile launch splash (~852×1846, portrait, no alpha) | **Copied** into `apps/mobile/assets/splash.png` — the current one still reads «Cachink!». |

`icon-padded.png` predates the kit and fed the archived Tauri desktop app.

## Regenerating `icon-padded.png`

If `icon.png` ever changes (redesign, color tweak), re-run:

```bash
python3 scripts/pad-icon.py assets/brand/icon.png assets/brand/icon-padded.png --scale 0.82
pnpm --filter @xangarro/desktop tauri icon ../../assets/brand/icon-padded.png
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
3. **Background colour for the splash is `#FFD60A`** (`colors.yellow`); the
   icon kit's square and the Android adaptive-icon background are `#111111`.
4. **Do not add new brand assets here without an ADR.** The set is
   intentionally small: one icon, one logo, and one splash per platform
   target (mobile + desktop). New shapes belong to their feature's package,
   not to the brand master. Adding a _third_ splash variant (e.g. a future
   web target) requires a new ADR — see ADR-019.

## Why this layout?

Per CLAUDE.md §2.3 ("code lives in exactly one place") the **in-app logo**
has a single source in `packages/ui` that both apps consume via
`@xangarro/ui`. The **app icon** and **splash** must exist in each platform's
native asset location (Expo convention for mobile, Tauri convention for
desktop) — this is build-output duplication, not code duplication, and it is
allowed because the platforms require it. This directory is the upstream
source that both derivatives are reproduced from.

The splash is the only brand master that is _naturally_ platform-shaped —
mobile is portrait, desktop is landscape — so it lives here as two
per-platform masters. Icons are square everywhere and the in-app logo is
rendered by `<BrandLogo />` which handles responsive layout itself, so both
of those remain single masters.

See `ARCHITECTURE.md` ADR-016 — Brand asset management strategy, amended by
ADR-019 (per-platform splash masters).
