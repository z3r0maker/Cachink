import { sql } from 'drizzle-orm';
import type { ChallengeStore } from '@xangarro/auth-core';

import type { Db, Tx } from './client';

/**
 * `ChallengeStore` over `staff_webauthn_challenges` (0023, ADR-160): a
 * challenge is kept only as its hash, bound to one ceremony, and taking it
 * deletes it — so the database, not the app, decides that it is used once.
 */
export function staffChallengeStore(conn: Db): ChallengeStore {
  return {
    save: async (hash, purpose, ttlSeconds) => {
      await conn.execute(sql`
        INSERT INTO staff_webauthn_challenges (challenge_hash, purpose, expires_at)
        VALUES (${hash}, ${purpose}, now() + make_interval(secs => ${ttlSeconds}))
        ON CONFLICT (challenge_hash) DO NOTHING`);
    },
    take: async (hash, purpose) => {
      const rows = await conn.execute(sql`
        DELETE FROM staff_webauthn_challenges
         WHERE challenge_hash = ${hash} AND purpose = ${purpose} AND expires_at > now()
        RETURNING 1`);
      return rows.length === 1;
    },
  };
}

/** The daily digest cron's sweep: challenges nobody answered. */
export async function pruneChallenges(conn: Db | Tx): Promise<number> {
  const rows = await conn.execute(
    sql`DELETE FROM staff_webauthn_challenges WHERE expires_at < now() RETURNING 1`,
  );
  return rows.length;
}
