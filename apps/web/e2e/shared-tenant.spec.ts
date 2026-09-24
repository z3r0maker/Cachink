import { expect, test } from './test';
import postgres from 'postgres';

import { SHARED_BIZ } from './shared-tenant';

/**
 * The guard's own canary.
 *
 * Everything else in this suite trusts that while the viewport projects run,
 * Postgres refuses writes to the seeded tenant — that is what lets 300-odd
 * specs read Taquería Don Pedro's rows without owning them. This test is the
 * one that checks it, in every run, from inside the phase it protects.
 *
 * It runs in the viewport projects only: it carries no `@serial` tag, so the
 * serial project never picks it up — and by then the lock is off by design.
 */
test('the seeded tenant refuses writes while the viewport projects run', async () => {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${SHARED_BIZ}, false)`;
    // The most harmless write there is — and still refused, because what the
    // guard watches is the tenant, not the column.
    const attempt = sql`UPDATE businesses SET updated_at = now() WHERE id = ${SHARED_BIZ}`;
    await expect(
      attempt,
      'the shared-tenant guard is not armed — an untagged write would go unnoticed',
    ).rejects.toThrow(/@serial/);
  } finally {
    await sql.end({ timeout: 5 });
  }
});
