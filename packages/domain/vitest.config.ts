import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: {
        thresholds: {
          lines: 95,
          functions: 95,
          branches: 95,
          statements: 95,
        },
      },
    },
  }),
);
