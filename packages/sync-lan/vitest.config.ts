import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

/**
 * sync-lan Vitest config.
 *
 * Coverage excludes the `protocol/index.ts` barrel and the `client/index.ts`
 * barrel because they are pure re-exports with no runtime branches — the
 * v8 reporter would count them as 0/0 and drag the threshold down.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: {
        exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/**/index.ts', 'src/**/*.d.ts'],
        thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
      },
    },
  }),
);
