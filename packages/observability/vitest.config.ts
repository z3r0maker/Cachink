import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: {
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80,
        },
      },
    },
  }),
);
