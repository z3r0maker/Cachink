import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

/**
 * Testing-package Vitest config.
 *
 * The package hosts two things:
 *   1. In-memory repository implementations (production code in `src/`).
 *   2. Shared contract-test factories in `src/contract/` — executed by
 *      `packages/data/tests/drizzle/*.test.ts` against the real Drizzle
 *      impls and by `tests/*.test.ts` here against the in-memory ones.
 *
 * Coverage excludes the contract factories + fixtures from the lines
 * numerator: they export helpers, and v8 reports them as "uncovered" unless
 * the consuming suite runs from inside this package. The in-memory
 * implementations themselves are covered end-to-end.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['../ui/tests/setup.ts'],
      coverage: {
        exclude: [
          'src/**/*.test.ts',
          'src/index.ts',
          'src/**/*.d.ts',
          'src/contract/**',
          'src/fixtures/**',
        ],
        thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      },
    },
  }),
);
