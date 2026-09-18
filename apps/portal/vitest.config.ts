import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@xangarro/config/vitest';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ['tests/**/*.test.ts'],
    },
  }),
);
