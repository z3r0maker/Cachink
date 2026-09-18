import { describe } from 'vitest';

/**
 * Where an integration suite gets its database — and why it may not skip.
 *
 * `const describeDb = URL ? describe : describe.skip` is a convenience that
 * keeps the unit suite hermetic, and it becomes a lie the moment CI runs it:
 * fourteen assertions about tenant isolation reported as "skipped" next to
 * twenty-two green drift tests reads, at a glance, as a green suite. An RLS
 * policy that does not isolate is worse than no policy, and a skipped proof of
 * one is worse still.
 *
 * So the skip is opt-out, not the default: when `REQUIRE_DB=1` the absence of a
 * database is a **failure**. `test:db` sets it, locally and in CI. Plain
 * `pnpm test` does not, so `pnpm test` stays hermetic and fast.
 *
 * `scripts/integration-coverage.test.ts` is the other half: it asserts from the
 * real workflow that some Postgres-backed CI job actually runs this.
 */
export interface IntegrationSuite {
  /** The connection string, or `undefined` when the suite will skip. */
  readonly url: string | undefined;
  /** `describe`, or `describe.skip` when no database is configured. */
  readonly describe: typeof describe;
}

export function integrationSuite(): IntegrationSuite {
  const url = process.env.DATABASE_URL;
  if (url !== undefined && url !== '') return { url, describe };

  if (process.env.REQUIRE_DB === '1') {
    throw new Error(
      'REQUIRE_DB=1 but DATABASE_URL is unset.\n' +
        'This suite is the only thing that proves the RLS policies bind.\n' +
        'Start Postgres with `pnpm --filter @xangarro/data-pg db:reset`, ' +
        'or fix the workflow — do not skip it.',
    );
  }

  return { url: undefined, describe: describe.skip };
}
