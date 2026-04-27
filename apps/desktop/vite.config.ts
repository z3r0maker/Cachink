import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

const workspaceRoot = path.resolve(__dirname, '../..');

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => ({
  plugins: [react()],

  // Vite options tailored for Tauri development.
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    // Allow Vite to read files from the pnpm workspace root so
    // `@cachink/*` source files hoisted to the monorepo root can be served.
    fs: {
      allow: [workspaceRoot],
    },
  },
  // Mirror @cachink/ui's peer-dependency Tamagui resolution back to the
  // workspace-root copy so only one @tamagui/web flows through the bundle.
  resolve: {
    dedupe: ['react', 'react-dom', '@tamagui/core', '@tamagui/web'],
  },
  // Tamagui 2.x references `process.env.*` at module-eval time. The Tauri
  // webview has no Node globals. Three layers handle this:
  //   1. `index.html` runtime polyfill — installs `window.process` before
  //      any bundle loads (catches reads AND Tamagui's own assignment to
  //      `process.env.TAMAGUI_TARGET`).
  //   2. `define` below — Vite replaces known process.env.* keys in the
  //      app's own source at transform time.
  //   3. `optimizeDeps.esbuildOptions.define` — applies the same static
  //      substitution to Vite's pre-bundled deps under node_modules/.vite.
  //      Without this, esbuild pre-bundles Tamagui with 40+ raw
  //      process.env.* references that survive into the served dep chunk.
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
    'process.env.TEST_NATIVE_PLATFORM': 'undefined',
    'process.env.DEBUG': 'undefined',
    'process.env.TAMAGUI_DISABLE_WARN_DYNAMIC_THEME': 'undefined',
    'process.env.TAMAGUI_ANIMATED_PRESENCE_SHORT_CIRCUIT': 'undefined',
  },
  optimizeDeps: {
    // Constrain the dep-discovery scanner to the HTML entry only. Without
    // this, Vite's scanner walks every `.ts`/`.tsx` file under
    // `server.fs.allow` (the workspace root), including platform-variant
    // `.native.*` files that are never runtime-reachable on desktop but
    // still get statically read for bare-import discovery — breaking on
    // their `import from 'react-native'` (Flow syntax esbuild cannot
    // parse). See ADR-029 which supersedes ADR-028.
    entries: ['index.html'],
    // Belt-and-braces: even if the scanner finds `react-native` as a bare
    // dep (e.g., a future file scans in), do not attempt to pre-bundle
    // it. The desktop runtime never renders a `react-native` primitive —
    // feature code routes through `.web.*` platform variants instead.
    exclude: [
      'react-native',
      // Sync packages and their heavy peer deps are loaded via dynamic
      // `import()` from packages/ui — keep them out of the dep-prebundle
      // so `pnpm dev` boot time stays small for Local-standalone users.
      // (See `manualChunks` below for the production split.)
      '@cachink/sync-lan',
      '@cachink/sync-cloud',
      '@powersync/web',
      '@powersync/common',
    ],
    esbuildOptions: {
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
        'process.env.TEST_NATIVE_PLATFORM': 'undefined',
        'process.env.DEBUG': 'undefined',
        'process.env.IS_STATIC': 'undefined',
        'process.env.TAMAGUI_DISABLE_WARN_DYNAMIC_THEME': 'undefined',
        'process.env.TAMAGUI_ANIMATED_PRESENCE_SHORT_CIRCUIT': 'undefined',
      },
    },
  },
  // Production bundle layout (CLAUDE.md §7 — sync code is *additive*,
  // never required). Both sync packages are dynamic-imported via
  // `await import('@cachink/sync-{lan,cloud}')` from
  // `packages/ui/src/sync/{lan,cloud}-bridge.ts`, so Rollup already
  // emits separate code-split chunks for them. The function-form
  // `manualChunks` below co-locates the heavy peers (PowerSync,
  // Supabase, wa-sqlite) into the same chunk Rollup spawns for the
  // dynamic import — without forcing those packages into the static
  // graph the way the array-form `manualChunks` would. This keeps a
  // Local-standalone build from ever downloading the cloud bundle.
  //
  // `external` reaches Rollup directly (the production-build
  // counterpart to `optimizeDeps.exclude` which only affects dev
  // pre-bundling). `react-native` is a phantom static reach via
  // `share.native.ts` — never runtime-reachable on desktop because
  // `share/index.ts` explicitly imports `./share.web`. Treating it
  // as external prevents Rollup from parsing its Flow-syntax
  // `index.js` during the production build (extends ADR-032 to the
  // build path).
  build: {
    rollupOptions: {
      external: ['react-native'],
      output: {
        manualChunks(id: string) {
          if (
            id.includes('/@cachink/sync-cloud/') ||
            id.includes('/@powersync/web/') ||
            id.includes('/@powersync/common/') ||
            id.includes('/@supabase/supabase-js/') ||
            id.includes('/@journeyapps/wa-sqlite/')
          ) {
            return 'sync-cloud';
          }
          if (id.includes('/@cachink/sync-lan/')) {
            return 'sync-lan';
          }
          return undefined;
        },
      },
    },
  },
}));
