import { fileURLToPath } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@xangarro/config/vitest';

export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      alias: {
        // See tests/support/server-only.ts: the guard stays in the source.
        'server-only': fileURLToPath(new URL('./tests/support/server-only.ts', import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      include: ['tests/**/*.test.ts'],
    },
  }),
);
