import { fileURLToPath } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@xangarro/config/vitest';

import { UNIT_DIR, rawStage } from './scripts/coverage-gate/options';

export default mergeConfig(
  base,
  defineConfig({
    // The app tsconfig says `jsx: preserve` (Next), which vite's transform
    // honors and leaves JSX untransformed — invalid JS to the test runner.
    // Component tests (jsdom) need it compiled; `automatic` matches the app.
    // (Vite 8: the option moved from `esbuild` to `oxc`.)
    oxc: { jsx: 'automatic' },
    resolve: {
      alias: {
        // See tests/support/server-only.ts: the guard stays in the source.
        'server-only': fileURLToPath(new URL('./tests/support/server-only.ts', import.meta.url)),
        // tsconfig's `@/*` path, so a test can import any module the app can.
        '@/': fileURLToPath(new URL('./src/', import.meta.url)),
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
      // The portal's number is unit + E2E together (ADR-102), so this run only
      // writes raw V8 data; `pnpm coverage:check` merges it and holds the floor.
      coverage: {
        provider: 'custom',
        customProviderModule: 'vitest-monocart-coverage',
        include: ['src/**/*.{ts,tsx}'],
        // Vitest empties this before each run; the default `coverage/` would
        // take the E2E stage's data with it.
        reportsDirectory: UNIT_DIR,
        coverageReportOptions: rawStage('Portal — unit', UNIT_DIR),
      },
    },
  }),
);
