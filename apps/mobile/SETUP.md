# apps/mobile — Setup

This directory will hold the **Expo SDK 55+** application targeting iOS and Android tablets (CLAUDE.md §3).

## One-time setup

Run these commands from the repository root after `pnpm install` succeeds at the root level.

```bash
cd apps/mobile

# Initialize a fresh Expo app with the TypeScript template.
# Using ^55 will pick up the latest SDK 55 point release at init time.
pnpm create expo-app@latest . --template blank-typescript

# Install core runtime deps (versions resolve to current at install time)
pnpm add expo-router expo-sqlite expo-camera expo-localization i18next react-i18next zustand @tanstack/react-query zod react-hook-form ulid dinero.js

# Install Tamagui for cross-platform UI (CLAUDE.md §3)
pnpm add tamagui @tamagui/core @tamagui/config

# Wire up the workspace packages
pnpm add @cachink/domain@workspace:* @cachink/application@workspace:* @cachink/data@workspace:* @cachink/ui@workspace:*
```

## Required edits after init

1. **package.json** — change `"name"` to `"@cachink/mobile"`. Add a `test` script that runs Jest with `jest-expo`. Add `"lint": "eslint 'src/**/*.{ts,tsx}' --config ../../eslint.config.js"`.

2. **tsconfig.json** — extend `../../tsconfig.base.json` and add the workspace packages as references.

3. **Folder structure** — create `src/app/` (Expo Router root) and `src/shell/` (platform bootstrap) per CLAUDE.md §4.1 and §5.6. **Do not** create a `src/components/` directory — all reusable components live in `@cachink/ui`.

4. **App shell** (`src/app/_layout.tsx`) — set up the Expo Router root, load Plus Jakarta Sans, render a "Hello Cachink" screen that imports a component from `@cachink/ui` to validate the cross-platform pipeline (ROADMAP P0-M4-T05).

5. **Metro config** — enable symlinks and add the monorepo workspace roots so Metro resolves `@cachink/*` packages correctly. Create `metro.config.js`:

   ```js
   const { getDefaultConfig } = require('expo/metro-config');
   const path = require('node:path');
   const workspaceRoot = path.resolve(__dirname, '../..');
   const config = getDefaultConfig(__dirname);
   config.watchFolders = [workspaceRoot];
   config.resolver.nodeModulesPaths = [
     path.resolve(__dirname, 'node_modules'),
     path.resolve(workspaceRoot, 'node_modules'),
   ];
   config.resolver.disableHierarchicalLookup = true;
   module.exports = config;
   ```

## Brand assets (pre-staged in `apps/mobile/assets/`)

Three PNGs are already staged here before the Expo init runs:

| File | Source | Purpose |
|---|---|---|
| `assets/icon.png` | `../../assets/brand/icon.png` | iOS + Android app icon |
| `assets/adaptive-icon.png` | `../../assets/brand/icon.png` | Android adaptive-icon foreground layer |
| `assets/splash.png` | `../../assets/brand/splash.png` | Launch splash image |

Canonical masters live in the repo-root `assets/brand/` directory — see
ADR-016 in `ARCHITECTURE.md`. These local copies are derivatives. Never
edit them in place; replace them from the master if the brand art changes.

Expo's `create-expo-app` template preserves pre-existing files under
`assets/`, so the init step will not overwrite them. After init, wire them
into `app.json`:

```json
{
  "expo": {
    "name": "Cachink!",
    "slug": "cachink",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "cover",
      "backgroundColor": "#FFD60A"
    },
    "ios": {
      "bundleIdentifier": "mx.cachink.mobile"
    },
    "android": {
      "package": "mx.cachink.mobile",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFD60A"
      }
    }
  }
}
```

`#FFD60A` is `colors.yellow` from CLAUDE.md §8.1 — use that exact value
for both the splash background and the Android adaptive-icon background
so the edge of the launch experience blends cleanly into the first
screen.

## Running

- **iOS Simulator** (Mac): `pnpm --filter @cachink/mobile exec expo run:ios`
- **Android emulator**: `pnpm --filter @cachink/mobile exec expo run:android`
- **Physical device via Expo Go** (JS changes only): `pnpm --filter @cachink/mobile start` then scan the QR code.

Once a native module is added (SQLite, camera, etc.), Expo Go no longer works — build a custom dev client via `eas build --profile development`.

## ROADMAP tasks completed by this setup

Tick these on ROADMAP.md once the init runs clean:

- [ ] P0-M4-T01 — Initialize Expo SDK 55
- [ ] P0-M4-T02 — Wire Expo Router, TypeScript, Plus Jakarta Sans
- [ ] P0-M4-T03 — Create apps/mobile/src/app/_layout.tsx app-shell only
- [ ] P0-M4-T04 — Verify dev server launches in simulator
- [ ] P0-M4-T05 — Placeholder "Hello Cachink" screen imports from @cachink/ui
