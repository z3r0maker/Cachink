/**
 * Desktop-shell Vitest config (Round 3 F10/F11).
 *
 * Mirror of `apps/mobile/vitest.config.ts`. Node-only — verifies the
 * graceful-degrade behaviour of `loadDesktopPowerSyncDb` and the
 * desktop `useCheckForUpdates` adapter when their respective optional
 * dependencies (`@powersync/web`, `@tauri-apps/plugin-updater`)
 * aren't installed.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { NODE_ENV: 'development' },
    globals: false,
  },
});
