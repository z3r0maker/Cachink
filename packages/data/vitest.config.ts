import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

/**
 * Data-package Vitest config.
 *
 * Coverage excludes two groups of declarative TypeScript:
 *  1. Repository interface files (`src/repositories/*-repository.ts`) —
 *     pure type declarations; v8 reports 0/0 which drags the totals below
 *     threshold. Concrete implementations land in `src/repositories/drizzle/`
 *     during P1B-M4 and are picked up by the default include glob.
 *  2. Drizzle schema files (`src/schema/**`) — declarative table
 *     definitions with no runtime branches; exercised end-to-end by the
 *     in-memory SQLite integration test in `tests/schema.integration.test.ts`.
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
          'src/repositories/drizzle/_db.ts',
          'src/repositories/drizzle/index.ts',
          'src/schema/**',
        ],
        thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      },
    },
  }),
);
