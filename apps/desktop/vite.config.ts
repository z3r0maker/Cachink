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
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
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
}));
