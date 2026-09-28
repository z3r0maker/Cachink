import { defineConfig } from 'vitest/config';

/**
 * Vitest config for repo-level tooling under `scripts/`.
 *
 * `scripts/` is not a pnpm workspace, so `turbo run test` never reaches it.
 * This config gives that code a home without changing the workspace pipeline;
 * `pnpm test:scripts` runs it, and CI runs it alongside `pnpm test`. The
 * Supabase edge functions are here for the same reason (F-10).
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.ts', 'supabase/functions/**/*.test.ts'],
    /**
     * These tests read the repository — every tracked file, the ESLint config,
     * the workflow, the `.env.example` files — so they are I/O bound and slow
     * down with the machine, not with the code. Three have now failed vitest's
     * 5 s default for being slow rather than wrong: `lint-coverage` (measured
     * at 6–47 s beside a build), `import-case`, and `env-example`, which takes
     * 600 ms alone and timed out beside twelve other files. The first two
     * carry their own budgets; this is the same budget for all of them, so the
     * fourth one does not have to learn this again.
     *
     * A real hang still fails — three minutes, not never.
     */
    testTimeout: 180_000,
  },
});
