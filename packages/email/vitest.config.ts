import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@xangarro/config/vitest';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: {
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
      },
    },
  }),
);
