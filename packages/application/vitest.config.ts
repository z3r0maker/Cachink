import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: {
        thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
      },
    },
  }),
);
