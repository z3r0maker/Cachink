import { defineConfig, mergeConfig } from 'vitest/config';
import base from '@cachink/config/vitest';

/**
 * sync-cloud Vitest config.
 *
 * Coverage excludes barrels and adapter code that depends on the runtime
 * PowerSync SDK — those are exercised by contract tests in `@cachink/ui`
 * and by real E2E runs, not unit tests. `supabase-auth.ts` is now
 * covered by `tests/supabase-auth.test.ts` (Slice 8 M3-C13) so it's no
 * longer excluded; coverage thresholds bump to 85% lines accordingly.
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      coverage: {
        exclude: [
          'src/**/*.test.ts',
          'src/index.ts',
          'src/**/index.ts',
          'src/**/*.d.ts',
          'src/bridge/**',
          // Type-only contract module — no executable lines.
          'src/auth/cloud-auth.ts',
          // PowerSync client adapters — depend on the runtime PowerSync
          // SDK and are exercised by E2E runs, not unit tests.
          'src/client/desktop.ts',
          'src/client/mobile.ts',
        ],
        thresholds: { lines: 85, functions: 85, branches: 70, statements: 85 },
      },
    },
  }),
);
