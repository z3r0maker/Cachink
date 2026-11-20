import { and, eq, isNull, sql } from 'drizzle-orm';
import type { StaffMemberId } from '@xangarro/domain';

import type { SessionSubject, StaffSession, StaffSessionStore } from '../auth/ports';
import type { Db } from './client';
import { toDate, toText } from './parse';
import { staffSessions as s } from './schema';

/**
 * `StaffSessionStore` over `staff_sessions` (0008, 0023) — the portal's
 * `session_resolve` pattern (ADR-079) for staff: resolving a session joins the
 * staff row and the passkey that opened it as they are **now**, so revoking a
 * member or removing that passkey ends the session on its very next request.
 * A session from before passkeys has no `passkey_id` and never resolves.
 * Expiry and idleness are checked in the same statement that touches
 * `last_seen_at`.
 *
 * No `server-only`: `src/proxy.ts` resolves sessions.
 */
async function open(conn: Db, tokenHash: string, subject: SessionSubject, ttlSeconds: number) {
  await conn.insert(s).values({
    tokenHash,
    staffId: subject.staffId,
    aal: 'aal2',
    passkeyId: subject.passkeyId,
    steppedUpAt: sql`now()`,
    expiresAt: sql`now() + make_interval(secs => ${ttlSeconds})`,
  });
}

async function resolve(
  conn: Db,
  tokenHash: string,
  idleSeconds: number,
): Promise<StaffSession | null> {
  const [row] = await conn.execute<Record<string, unknown>>(sql`
    UPDATE staff_sessions AS s SET last_seen_at = now()
      FROM staff_members AS m, staff_passkeys AS p
     WHERE s.token_hash = ${tokenHash}
       AND s.revoked_at IS NULL
       AND s.expires_at > now()
       AND s.last_seen_at > now() - make_interval(secs => ${idleSeconds})
       AND m.id = s.staff_id AND m.revoked_at IS NULL
       AND p.id = s.passkey_id AND p.staff_id = s.staff_id AND p.revoked_at IS NULL
    RETURNING m.id, m.email, m.nombre, s.passkey_id, s.stepped_up_at, s.created_at, s.expires_at`);
  if (row === undefined) return null;
  return {
    staffId: toText(row.id) as StaffMemberId,
    email: toText(row.email),
    nombre: toText(row.nombre),
    passkeyId: toText(row.passkey_id),
    steppedUpAt: toDate(row.stepped_up_at),
    openedAt: toDate(row.created_at),
    expiresAt: toDate(row.expires_at),
  };
}

const live = (tokenHash: string) => and(eq(s.tokenHash, tokenHash), isNull(s.revokedAt));

export function staffSessionStore(conn: Db): StaffSessionStore {
  return {
    open: (hash, subject, ttl) => open(conn, hash, subject, ttl),
    resolve: (hash, idle) => resolve(conn, hash, idle),
    revoke: async (hash) => {
      await conn
        .update(s)
        .set({ revokedAt: sql`now()` })
        .where(live(hash));
    },
    stepUp: async (hash) => {
      await conn
        .update(s)
        .set({ steppedUpAt: sql`now()` })
        .where(live(hash));
    },
  };
}
