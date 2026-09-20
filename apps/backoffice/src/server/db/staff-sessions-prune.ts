import { sql } from 'drizzle-orm';

import type { Db, Tx } from './client';

/**
 * Prune expired staff sessions (N-05's follow-up): a row whose `expires_at`
 * passed more than `RETENTION_DAYS` ago has answered every question a
 * session can answer — it is audit dead weight. Revoked rows past the same
 * horizon go too. The digest cron runs this daily; the answer feeds the log.
 */
export async function pruneStaffSessions(conn: Db | Tx): Promise<number> {
  const rows = await conn.execute(
    sql`DELETE FROM staff_sessions
         WHERE expires_at < now() - interval '30 days'
            OR (revoked_at IS NOT NULL AND revoked_at < now() - interval '30 days')
        RETURNING 1`,
  );
  return rows.length;
}
