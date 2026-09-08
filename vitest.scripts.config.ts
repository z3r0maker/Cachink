import { defineConfig } from 'vitest/config';

/**
 * Vitest config for repo-level tooling under `scripts/`.
 *
 * `scripts/` is not a pnpm workspace, so `turbo run test` never reaches it.
 * This config gives that code a home without changing the workspace pipeline;
 * `pnpm test:scripts` runs it, and CI runs it alongside `pnpm test`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.ts'],
  },
});
