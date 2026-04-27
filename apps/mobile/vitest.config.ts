/**
 * Mobile-shell Vitest config (Round 3 F10/F11).
 *
 * Apps were originally test-stubbed (`"test": "echo …"`) because the
 * full Jest + React Native Testing Library setup is parked. Round 3
 * adds a thin Vitest setup so we can guard the graceful-degrade
 * paths in the shell-only hooks (`useMobileCloudHandle`,
 * `useMobileUpdateAdapter`) without dragging in RNTL.
 *
 * Node-only environment — these hooks expose pure async helpers
 * (`loadMobilePowerSyncDb`, `loadMobileExpoUpdates`) that do dynamic
 * imports and return a result. Tests call those helpers directly,
 * stubbing the dynamic imports via `vi.mock`.
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
