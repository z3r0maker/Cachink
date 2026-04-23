import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

/**
 * Data-package Vitest config.
 *
 * Coverage excludes repository *interface* files (one level deep inside
 * `src/repositories/`) because they are pure TypeScript declarations with no
 * runtime — v8 reports 0/0 for them which drags the totals below threshold.
 * Concrete implementations land in `src/repositories/drizzle/*.ts` in
 * Phase 1B-M4 and are picked up by the default include glob.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: {
        exclude: [
          'src/**/*.test.ts',
          'src/index.ts',
          'src/**/*.d.ts',
          'src/repositories/*-repository.ts',
        ],
        thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      },
    },
  }),
);
