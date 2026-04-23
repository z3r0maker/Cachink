import { defineConfig } from 'vitest/config';

/**
 * Base Vitest config consumed by all pure-TS packages.
 *
 * Coverage thresholds are enforced per CLAUDE.md §6. Individual packages may
 * override these (e.g. domain requires ≥ 95% while ui only requires ≥ 70%) by
 * spreading this config and tightening the numbers in their local
 * vitest.config.ts.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      // Only exclude the TOP-LEVEL package barrel (src/index.ts). Nested
      // barrel-style files like src/money/index.ts ARE the implementation
      // in this repo — excluding all index.ts would nullify coverage.
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
