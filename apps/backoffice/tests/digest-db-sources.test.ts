import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import postgres from 'postgres';

import { createDb } from '@xangarro/data-pg';
import { prunePortalSecurity } from '../src/server/db/security-prune';
import { drizzleStoredUsageSource } from '../src/server/db/usage';

/**
 * The digest's two DB2-CRON-01 adapters against the real functions (admin
 * 0021, 0022), as the console's own role. Like `staff-sessions-prune.test.ts`
 * this needs the seeded Postgres with the admin migrations applied
 * (`pnpm test:e2e:db`) and skips without it; the migrations themselves are
 * proven old → new in data-pg's `migration-admin-perf.integration.test.ts`.
 */
const URL = process.env.DATABASE_URL;
const suite = URL === undefined || URL === '' ? describe.skip : describe;
const BIZ = '01HZDIGESTSRC0000000000BIZ';

suite('digest sources on Postgres', () => {
  it('prunePortalSecurity deletes only dead portal sessions and returns the count', async () => {
    const db = createDb(URL as string);
    const owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    try {
      const user = '3f1c0e2a-0000-4000-8000-00000000d001';
      await owner`INSERT INTO xangarro.portal_sessions (token_hash, user_id, business_id, expires_at, revoked_at)
                  VALUES ('digest-src-dead', ${user}::uuid, ${BIZ}, now() - interval '3 days', NULL),
                         ('digest-src-live', ${user}::uuid, ${BIZ}, now() + interval '3 days', NULL)
                  ON CONFLICT (token_hash) DO NOTHING`;
      assert.ok((await prunePortalSecurity(db)) >= 1);
      const left = await owner<{ token_hash: string }[]>`
        SELECT token_hash FROM xangarro.portal_sessions WHERE token_hash LIKE 'digest-src-%'`;
      assert.deepEqual(
        left.map((r) => r.token_hash),
        ['digest-src-live'],
      );
      await owner`DELETE FROM xangarro.portal_sessions WHERE token_hash LIKE 'digest-src-%'`;
    } finally {
      await owner.end({ timeout: 5 }).catch(() => undefined);
      await db.$client.end({ timeout: 5 }).catch(() => undefined);
    }
  });

  it('drizzleStoredUsageSource pages tenants with three stored months each', async () => {
    const db = createDb(URL as string);
    try {
      const page = await drizzleStoredUsageSource(db).page({
        period: '2026-09',
        after: null,
        limit: 5,
      });
      assert.ok(page.length > 0, 'the seed has tenants');
      for (const t of page) {
        assert.deepEqual(
          t.history.map((h) => h.period),
          ['2026-09', '2026-08', '2026-07'],
        );
        assert.ok(t.history.every((h) => Number.isInteger(h.transactions)));
      }
    } finally {
      await db.$client.end({ timeout: 5 }).catch(() => undefined);
    }
  });
});
