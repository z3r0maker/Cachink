import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import type { StaffMemberId } from '@xangarro/domain';

import type { SessionSubject, StaffSession, StaffSessionStore } from '../auth/ports';
import { toAal } from '../gate';
import type { Db } from './client';
import { staffMembers as m, staffSessions as s } from './schema';

/**
 * `StaffSessionStore` over `staff_sessions` (0008) — the portal's
 * `session_resolve` pattern (ADR-079) for staff: resolving a session joins the
 * staff row as it is **now**, so revoking a staff member (`revoked_at`) ends
 * every session they hold on their very next request. Expiry and idleness are
 * checked in the same statement that touches `last_seen_at`.
 *
 * No `server-only`: `src/proxy.ts` resolves sessions.
 */
async function open(conn: Db, tokenHash: string, subject: SessionSubject, ttlSeconds: number) {
  await conn.insert(s).values({
    tokenHash,
    staffId: subject.staffId,
    aal: subject.aal,
    expiresAt: sql`now() + make_interval(secs => ${ttlSeconds})`,
  });
}

async function resolve(
  conn: Db,
  tokenHash: string,
  idleSeconds: number,
): Promise<StaffSession | null> {
  const [row] = await conn
    .update(s)
    .set({ lastSeenAt: sql`now()` })
    .from(m)
    .where(
      and(
        eq(s.tokenHash, tokenHash),
        isNull(s.revokedAt),
        gt(s.expiresAt, sql`now()`),
        gt(s.lastSeenAt, sql`now() - make_interval(secs => ${idleSeconds})`),
        eq(m.id, s.staffId),
        isNull(m.revokedAt),
      ),
    )
    .returning({
      id: m.id,
      email: m.email,
      nombre: m.nombre,
      aal: s.aal,
      enrolledAt: m.totpEnrolledAt,
    });
  const aal = toAal(row?.aal);
  if (row === undefined || aal === null) return null;
  const { id, email, nombre, enrolledAt } = row;
  return { staffId: id as StaffMemberId, email, nombre, aal, enrolled: enrolledAt !== null };
}

async function revoke(conn: Db, tokenHash: string) {
  await conn
    .update(s)
    .set({ revokedAt: sql`now()` })
    .where(and(eq(s.tokenHash, tokenHash), isNull(s.revokedAt)));
}

export function staffSessionStore(conn: Db): StaffSessionStore {
  return {
    open: (hash, subject, ttl) => open(conn, hash, subject, ttl),
    resolve: (hash, idle) => resolve(conn, hash, idle),
    revoke: (hash) => revoke(conn, hash),
  };
}
