import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { sql } from 'drizzle-orm';

import postgres from 'postgres';
import { createDb } from '@xangarro/data-pg';
import { pruneStaffSessions } from '../src/server/db/staff-sessions-prune';

/**
 * The prune (N-05's follow-up): only rows past the 30-day horizon go —
 * expired, revoked, or both — and live rows are never touched. The
 * backoffice suite is otherwise hermetic; this one test needs the seeded
 * Postgres (`pnpm test:e2e:db`) and skips without it.
 */
const URL = process.env.DATABASE_URL;
const suite = URL === undefined || URL === '' ? describe.skip : describe;

suite('pruneStaffSessions', () => {
  it('deletes only sessions past the horizon', async () => {
    const db = createDb(URL as string);
    let owner: ReturnType<typeof postgres> | null = null;
    try {
      const stamp = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();
      // The console's role cannot INSERT staff_members (CLI-only, by design);
      // the fixture goes in over the superuser connection.
      owner = postgres(process.env.DATABASE_SUPER_URL as string, {
        max: 1,
        onnotice: () => undefined,
      });
      await owner`INSERT INTO staff_members (id, email, nombre, created_at)
        VALUES ('01PRUNESTAFF00000000000001', 'prune-fixture@xangarro.mx', 'Fixture', now())
        ON CONFLICT DO NOTHING`;
      const rows: [token: string, expires: string, revoked: string | null][] = [
        ['01PRUNEEEEEEEEEEEEEEEEEE01', stamp(40), null], // expired long ago → gone
        ['01PRUNEEEEEEEEEEEEEEEEEE02', stamp(40), stamp(35)], // + revoked → gone
        ['01PRUNEEEEEEEEEEEEEEEEEE03', stamp(10), null], // recent expiry → stays
        ['01PRUNEEEEEEEEEEEEEEEEEE04', stamp(10), stamp(1)], // revoked recently, not stale → stays
      ];
      for (const [token, expires, revoked] of rows) {
        await owner`INSERT INTO staff_sessions (token_hash, staff_id, aal, created_at, last_seen_at, expires_at, revoked_at)
          SELECT encode(sha256(${token}::bytea), 'hex'), s.id, 'aal2', ${stamp(45)}::timestamptz,
                 ${stamp(45)}::timestamptz, ${expires}::timestamptz, ${revoked}::timestamptz
            FROM staff_members s
           WHERE s.id = '01PRUNESTAFF00000000000001'
             AND NOT EXISTS (SELECT 1 FROM staff_sessions x
                              WHERE x.token_hash = encode(sha256(${token}::bytea), 'hex'))`;
      }
      const pruned = await pruneStaffSessions(db);
      assert.ok(pruned >= 2, `at least the two stale rows (got ${pruned})`);
      const after = await db.execute<{ n: string }>(
        sql`SELECT count(*)::text AS n FROM staff_sessions WHERE token_hash IN (
              encode(sha256('01PRUNEEEEEEEEEEEEEEEEEE03'::bytea), 'hex'),
              encode(sha256('01PRUNEEEEEEEEEEEEEEEEEE04'::bytea), 'hex'))`,
      );
      assert.equal(Number(after[0]?.n ?? 0), 2, 'the live rows survive');
    } finally {
      if (owner !== null) await owner.end({ timeout: 5 }).catch(() => undefined);
      await db.$client.end({ timeout: 5 }).catch(() => undefined);
    }
  });
});
