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

| File                       | Source                                 | Purpose                                |
| -------------------------- | -------------------------------------- | -------------------------------------- |
| `assets/icon.png`          | `../../assets/brand/icon.png`          | iOS + Android app icon                 |
| `assets/adaptive-icon.png` | `../../assets/brand/icon.png`          | Android adaptive-icon foreground layer |
| `assets/splash.png`        | `../../assets/brand/splash-mobile.png` | Launch splash image                    |

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

## Performance budget (P1C-M12-T05)

- **Cold start target:** < 2000 ms to first paint on a mid-range Android
  tablet (CLAUDE.md §1). The launch-time budget is the reference for
  Phase 1F launch-prep regressions.
- Heavy exports (`exceljs`, `@react-pdf/renderer`) are **dynamic-imported**
  from `packages/ui/src/export/` so they don't land in the cold-start
  bundle. Slice 4 C20 confirms the `await import(...)` pattern is
  already in place.
- To record a baseline, run `pnpm tsx scripts/measure-cold-start.ts` from
  the repo root — writes a JSON artefact under `perf-artifacts/`.

## Running

- **iOS Simulator** (Mac): `pnpm --filter @cachink/mobile exec expo run:ios`
- **Android emulator**: `pnpm --filter @cachink/mobile exec expo run:android`
- **Physical device via Expo Go** (JS changes only): `pnpm --filter @cachink/mobile start` then scan the QR code.

Once a native module is added (SQLite, camera, etc.), Expo Go no longer works — build a custom dev client via `eas build --profile development`.

### Native-module rebuild after adding `react-native-gesture-handler`, `react-native-webview`, or `react-native-view-shot`

These three native modules require a prebuild + pod install + EAS
rebuild before the app starts. The same procedure applies whether you
just pulled the Phase C1 commit (gesture-handler), the Phase E1 commit
(webview), the Phase E2 commit (view-shot), or any future native-module
bump:

1. **Regenerate native projects** (Expo Continuous Native Generation):
   ```sh
   pnpm --filter @cachink/mobile exec expo prebuild --clean
   ```
2. **iOS** — install pods after prebuild:
   ```sh
   cd apps/mobile/ios && pod install && cd -
   ```
3. **Re-run the dev client**:
   ```sh
   pnpm --filter @cachink/mobile exec expo run:ios
   pnpm --filter @cachink/mobile exec expo run:android
   ```
4. **EAS Build** — rebuild any profile that distributes a binary
   (development / preview / production) so the new native module is
   bundled:
   ```sh
   pnpm --filter @cachink/mobile exec eas build --profile development --platform all
   ```

If you skip the prebuild + pod install, the app crashes on launch
with one of:

- `RNGestureHandlerModule could not be found` (gesture-handler)
- `RNCWebView could not be found` (webview — used by the comprobante
  preview frame on RN, see `comprobante-preview-frame.native.tsx`)
- `RNViewShot could not be found` (view-shot — used by the
  comprobante share path to rasterize the WebView to PNG)

The JS-side wrappers (`<GestureHandlerRootView>` at
`apps/mobile/src/app/_layout.tsx`, `<WebView source={{ html }}>` in
the comprobante preview, and `captureRef` in the rasterize helper)
won't compensate for the missing native side.

## Cloud mode prerequisites (Phase 1E carry-over)

The Cloud onboarding card (`<CloudOnboardingScreen>`) only activates
when the build has a usable Supabase backend. Three EAS Build secrets
need to be set before any Cloud-mode dev client or production build:

| Secret                       | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| `EXPO_PUBLIC_CLOUD_API_URL`  | Cachink-hosted Supabase project URL (e.g. `https://abc.supabase.co`). |
| `EXPO_PUBLIC_CLOUD_ANON_KEY` | Anonymous JWT for the same project — safe to bake into the binary.    |
| `EXPO_PUBLIC_POWERSYNC_URL`  | PowerSync instance the app should connect to once signed in.          |

Set them via `eas secret:create` (one-time per environment) or as
plain env vars in `app.config.ts` for local dev. Without them, the
wizard's Cloud card renders the disabled-notice variant pointing at
**Settings → Avanzado** for the BYO-backend flow.

## LAN mode pairing (Slice 5 / S9-B1)

The mobile app is always a LAN **client** — it never hosts. To pair:

1. Open the wizard, pick **"Conectar a un servidor local"**.
2. The app surfaces `<LanJoinScreen>` with a **Escanear QR** CTA
   (powered by `expo-camera`).
3. Scan the QR shown by the desktop host (or paste the
   `cachink-lan://...?token=...` URL into the fallback input).
4. `useLanBridgeCallbacks.onPaired` writes the bearer token into
   `__cachink_sync_state` and the gate flips to the role picker.

The pairing UI is documented end-to-end in
`packages/ui/src/screens/LanPairing/` and tested via
`maestro/flows/lan-pair.yaml`.

## Settings → Avanzado (BYO Cloud backend)

Power users (and developers running their own Supabase project) can
override the baked-in defaults from **Settings → Avanzado** without
forking. The screen lives at `<AdvancedBackendRoute>` (mounted on
mobile via `<CloudInnerScreenHost />`) and persists the URL +
anon-key to `__cachink_sync_state` under `cloud.byoBackend`. ADR-035
formalises the precedence: BYO config wins over the build-baked
defaults whenever it's present.

## ROADMAP tasks completed by this setup

Tick these on ROADMAP.md once the init runs clean:

- [ ] P0-M4-T01 — Initialize Expo SDK 55
- [ ] P0-M4-T02 — Wire Expo Router, TypeScript, Plus Jakarta Sans
- [ ] P0-M4-T03 — Create apps/mobile/src/app/\_layout.tsx app-shell only
- [ ] P0-M4-T04 — Verify dev server launches in simulator
- [ ] P0-M4-T05 — Placeholder "Hello Cachink" screen imports from @cachink/ui

## Maestro local-dev setup (Audit M-1 Step 0 — added 2026-04-26)

`pnpm --filter @cachink/mobile test:e2e` runs Maestro flows against
the iPad Pro 11" simulator (or Android emulator behind
`MAESTRO_ANDROID=1`). The runner is the `~/.maestro/bin/maestro`
launcher script bundled under `~/.maestro/`.

### Java 17

Maestro requires Java 17+. The dev laptop ships with Java 8 from
Oracle's Internet Plug-In, which is **not** acceptable to Maestro's
launcher (`maestro --version` will exit with `Java 17 or higher is
required`).

```bash
brew install openjdk@17
# Optional symlink (requires sudo, not strictly required —
# `JAVA_HOME` below is sufficient for Maestro's launcher):
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk \
  /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

Add to your shell rc (`~/.zshrc` and/or `~/.bash_profile`):

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$HOME/.maestro/bin:$PATH"
```

Verify: `java -version` should report `17.x` and `maestro --version`
should print a version string (e.g. `2.4.0`).

### CocoaPods + UTF-8 locale

`pod install` from inside `apps/mobile/ios/` fails with a
`Encoding::CompatibilityError` (`Unicode Normalization not
appropriate for ASCII-8BIT`) when the shell `LANG` is unset. The
workspace path contains a `!` (`/Users/.../Downloads/Cachink!/`)
which triggers the bug. Always run `pod install` (and any `expo
prebuild` that wraps it) with the locale exported:

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

Add these to the same shell rc.

### Native rebuild (one-time per `expo prebuild --clean`)

```bash
cd apps/mobile
pnpm exec expo prebuild --clean --platform ios
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pod install --repo-update
cd -
pnpm exec expo run:ios --device "iPad Pro 11-inch (M5)"
```

The `expo run:ios` step builds the .app bundle, installs it on the
booted simulator, and starts Metro on port 8081. First build is
~5–10 min; incrementals are ~30 s.

### `hoist-non-react-statics` workaround

`react-native-gesture-handler@2.31.1` imports `hoist-non-react-statics`
but pnpm's default isolated linker does **not** expose it inside
`apps/mobile/node_modules/`. Metro then fails to bundle with
`Unable to resolve module hoist-non-react-statics from
react-native-gesture-handler/src/components/gestureHandlerRootHOC.tsx`.

Fix: keep `hoist-non-react-statics` listed in `apps/mobile/package.json`
as a direct dep so pnpm symlinks it. (We add it explicitly rather
than using `node-linker=hoisted` because the latter would fan out to
every workspace package.)

### Run a flow

```bash
~/.maestro/bin/maestro test apps/mobile/maestro/flows/smoke-launch.yaml
```

The full sweep (`pnpm --filter @cachink/mobile test:e2e`) requires the
audit M-1 ConsentModal-dismiss + Btn-tap blockers to be resolved
first — see the Audit M-1 ROADMAP entries.

### Android emulator (deferred)

`MAESTRO_ANDROID=1 pnpm --filter @cachink/mobile test:e2e` runs the
flows against an Android emulator. The dev laptop only has Xcode +
iOS sims today; Android testing is a follow-up slice.
