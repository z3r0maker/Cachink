# apps/desktop — Setup

This directory will hold the **Tauri 2.10+** application targeting Windows and macOS (CLAUDE.md §3, ADR-001).

## Prerequisites

Tauri requires a working Rust toolchain and platform-specific system dependencies. Install these **before** running the init commands.

- **Rust** (stable): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Windows**: Microsoft Visual Studio C++ Build Tools (see [Tauri prerequisites docs](https://v2.tauri.app/start/prerequisites/))
- **Linux** (dev only): WebKit2GTK and related system packages

Verify: `rustc --version && cargo --version`.

### Once Rust is on PATH, run the Tauri compile gate

```bash
pnpm --filter @cachink/desktop tauri:check
```

This runs `cargo check --locked` inside `src-tauri/` — it compiles the
LAN sync server (the Rust axum module bundled with the desktop app per
ADR-029) without producing a binary, so it's a fast feedback loop for
"does the Rust side still type-check?". The agent toolchain in CI cannot
install `rustup` system-wide; this verification is a one-time
developer-laptop step that's part of the pre-push gate.

`pnpm --filter @cachink/desktop tauri:test` runs the Rust unit tests
under the same gate.

## One-time setup

Run these commands from the repository root after `pnpm install` succeeds at the root level.

```bash
cd apps/desktop

# Initialize a Tauri 2 app with Vite + React + TypeScript frontend.
pnpm create tauri-app@latest . --template react-ts --manager pnpm --identifier com.cachink.desktop

# Install core runtime deps
pnpm add @tauri-apps/api @tauri-apps/plugin-sql zustand @tanstack/react-query zod react-hook-form ulid dinero.js i18next react-i18next

# Install Tamagui for cross-platform UI (CLAUDE.md §3)
pnpm add tamagui @tamagui/core @tamagui/config react react-dom

# Wire up the workspace packages
pnpm add @cachink/domain@workspace:* @cachink/application@workspace:* @cachink/data@workspace:* @cachink/ui@workspace:*
```

## Required edits after init

1. **package.json** — change `"name"` to `"@cachink/desktop"`. Add `"lint": "eslint 'src/**/*.{ts,tsx}' --config ../../eslint.config.js"` and a `test` script that runs Playwright once E2E is added (Phase 1C-M12).

2. **tsconfig.json** — extend `../../tsconfig.base.json` and add workspace package references.

3. **Folder structure** — create `src/app/` and `src/shell/` per CLAUDE.md §4.1 and §5.6. **Do not** create `src/components/` — all reusable components live in `@cachink/ui`.

4. **App shell** (`src/app/main.tsx`) — render a "Hello Cachink" screen that imports a component from `@cachink/ui` to prove the cross-platform pipeline works (ROADMAP P0-M5-T06).

5. **Tauri config** (`src-tauri/tauri.conf.json`) — set `productName` to "Cachink", `version` to match `package.json`, and configure the bundle `identifier` as `com.cachink.desktop`.

6. **Register the SQL plugin** in `src-tauri/src/lib.rs`:

   ```rust
   fn main() {
       tauri::Builder::default()
           .plugin(tauri_plugin_sql::Builder::default().build())
           .run(tauri::generate_context!())
           .expect("error while running tauri application");
   }
   ```

   And in `src-tauri/Cargo.toml` add `tauri-plugin-sql = { version = "2", features = ["sqlite"] }`.

7. **Vite config** — in the generated `vite.config.ts`, add the workspace root to `server.fs.allow` so Vite can read packages hoisted to the monorepo root.

## Brand assets (consumed from repo-root `assets/brand/`)

Unlike the mobile app, **do not** pre-copy any icon or splash files into
`apps/desktop/` before running `pnpm create tauri-app`. Tauri refuses to
scaffold into a non-empty `src-tauri/` directory, and the generator owns
the initial icon set. Canonical brand masters live in the repo-root
`../../assets/brand/` directory — see ADR-016 in `ARCHITECTURE.md`.

### After `pnpm create tauri-app` completes

#### 1. Generate all native icon formats

From `apps/desktop/`:

```bash
# Generates src-tauri/icons/* for every platform size and format.
# Use the PADDED master (icon-padded.png) so the macOS Dock icon has
# the standard Apple safe-area padding and visually matches neighbouring
# icons like Finder, Preview, Adobe, etc. The full-bleed `icon.png` is
# only correct for iOS App Store submission.
pnpm tauri icon ../../assets/brand/icon-padded.png
```

Tauri's CLI writes `icon.icns`, `icon.ico`, multiple PNG sizes
(`32x32.png`, `128x128.png`, `128x128@2x.png`), and Windows Store tiles
into `src-tauri/icons/`. If you ever replace `icon.png` with new brand art,
regenerate `icon-padded.png` first (see `assets/brand/README.md`). Then update `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Cachink",
  "identifier": "mx.cachink.desktop",
  "bundle": {
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

#### 2. Splash screen (two-window pattern)

Copy the splash master into the app-shell folder and register a splash
window alongside the main window:

```bash
mkdir -p src/shell/splash
cp ../../assets/brand/splash-desktop.png src/shell/splash/splash.png
```

In `src-tauri/tauri.conf.json` under `app.windows`:

```json
[
  {
    "label": "splash",
    "url": "splash.html",
    "width": 600,
    "height": 340,
    "decorations": false,
    "center": true,
    "visible": true,
    "alwaysOnTop": true
  },
  {
    "label": "main",
    "url": "index.html",
    "visible": false,
    "width": 1200,
    "height": 800
  }
]
```

Create `apps/desktop/splash.html` that renders
`src/shell/splash/splash.png` full-bleed on `#FFD60A`
(`colors.yellow` — CLAUDE.md §8.1). From `src/app/main.tsx`, once the
app has bootstrapped (theme loaded, DB opened, initial route mounted),
invoke `close_splashscreen` to hide the splash window and reveal the
main window — the standard Tauri two-window recipe.

`#FFD60A` is `colors.yellow` from CLAUDE.md §8.1 — use that exact
value for the splash background so the transition from splash to app
shell is seamless.

## Running

```bash
# Development (launches a native window with HMR)
pnpm --filter @cachink/desktop tauri dev

# Production build (creates a .dmg on macOS or .msi on Windows)
pnpm --filter @cachink/desktop tauri build
```

## LAN sync server

The Phase 1D LAN sync server is a Rust module that lives inside `src-tauri/src/lan_sync/` and ships with the desktop app. Per ADR-007, this is a first-party component — no external sync vendor. Wiring starts in ROADMAP P1D-M2.

### LAN mode hosting (Slice 5 / S9-B / S9.6)

When a user picks **"Ser el servidor local"** in the first-launch
wizard, the desktop shell takes the host path:

1. `useDesktopLanBridges` wires the `lan_server_start` Tauri command
   into `<LanHostScreen>` via the `startServer` prop.
2. `<LanHostScreen>` invokes the command, gets back `{ url,
pairingToken, qrPngBase64 }`, and renders the QR + URL + token
   for tablets to scan.
3. Once the user presses **Continuar**,
   `useLanBridgeCallbacks.onServerStarted` stamps the explicit
   `lanHostReady` sync-state scope (Slice 8 A2 revision — replaces
   the prior `'cachink-host'` access-token sentinel).
4. `<LanGate>` then falls through via
   `(token || (lanRole === 'host' && hostReady))` and the host
   proceeds to the role picker.

The Tauri side of the pairing flow lives in
`apps/desktop/src-tauri/src/lan_sync/`; the QR + token UI lives in
`packages/ui/src/screens/LanPairing/`.

## Cloud mode (Phase 1E carry-over)

Cloud mode on desktop reads three Vite env vars (mirroring the EAS
secrets on mobile) — set them in `apps/desktop/.env.local`:

```
VITE_CLOUD_API_URL=https://abc.supabase.co
VITE_CLOUD_ANON_KEY=eyJhanon...
VITE_POWERSYNC_URL=https://wss.powersync.example.com
```

Without these, the wizard's Cloud card renders the disabled-notice
variant pointing at **Settings → Avanzado** for the BYO-backend
flow. The handle factory `useDesktopCloudHandle` lazy-imports
`@powersync/web` once the user signs in (Slice 8 M2-C10 added
`@powersync/web` as a direct desktop dep so the import always
resolves).

## E2E specs (Playwright — manual setup)

The four desktop integration specs under `apps/desktop/playwright/`
exercise multi-window LAN + Cloud flows. They assume `tauri dev` is
already running plus two Expo web tabs (one per simulated tablet).
See the header comment in `apps/desktop/playwright.config.ts` for
the full step-by-step. Quick reference:

```sh
# Terminal 1 — desktop app
pnpm --filter @cachink/desktop dev

# Terminals 2/3 — two mobile web tabs
pnpm --filter @cachink/mobile web

# Terminal 4 — drive the suite
pnpm --filter @cachink/desktop test:lan    # LAN specs only
pnpm --filter @cachink/desktop test:cloud  # cloud specs only
pnpm --filter @cachink/desktop test:e2e    # everything
```

These specs are **not** in CI — they're integration scaffolds for
human-driven manual QA before a release.

## ROADMAP tasks completed by this setup

Tick these on ROADMAP.md once the init runs clean:

- [ ] P0-M5-T01 — Initialize Tauri 2.10+ inside apps/desktop
- [ ] P0-M5-T02 — Wire Vite + React + TypeScript frontend
- [ ] P0-M5-T03 — Install @tauri-apps/plugin-sql
- [ ] P0-M5-T04 — Create apps/desktop/src/app/main.tsx app-shell only
- [ ] P0-M5-T05 — Verify tauri dev launches a native window
- [ ] P0-M5-T06 — Placeholder "Hello Cachink" imports from @cachink/ui
