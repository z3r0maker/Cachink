/**
 * Mobile-shell Vitest config (Round 3 F10/F11) + the first coverage gate
 * (the ADR-102 treatment, sized for the phone): the floor sits at the
 * first honest measurement of the shell's testable surface. Screens are
 * Maestro's territory (`apps/mobile/maestro/`), so `src/app/` is out by
 * name and the gate holds the shell.
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
  resolve: {
    alias: {
      // Same contract as @xangarro/ui's config: the real RN package ships
      // Flow syntax that Vite can't parse; the web shim exports the same
      // surface (Platform.OS, ...) in plain JS.
      'react-native': 'react-native-web',
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: { NODE_ENV: 'development' },
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/**/*.tsx'],
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: {
        // The first honest floor (ADR-102's calibration: one under the
        // measurement): 11 / 9 / 13 / 25 measured, the floor holds 10 of it.
        lines: 10,
        statements: 9,
        functions: 13,
        branches: 25,
      },
    },
  },
});
