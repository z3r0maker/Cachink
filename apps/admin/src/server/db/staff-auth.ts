import { and, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { StaffMemberId } from '@xangarro/domain';

import type { LoginRecord, StaffAuthRepo, TotpState } from '../auth/ports';
import type { Db } from './client';
import { staffMembers as m } from './schema';

/**
 * `StaffAuthRepo` over `staff_members` (0008). Every write is a single
 * conditional UPDATE … RETURNING, so the database — not a read-then-write in
 * the app — decides races: one enrolment wins, a TOTP step is accepted once,
 * a recovery code is removed once. Revoked rows never match.
 */
const live = (id: StaffMemberId) => and(eq(m.id, id), isNull(m.revokedAt));

async function findForLogin(conn: Db, email: string): Promise<LoginRecord | null> {
  const [row] = await conn
    .select({ id: m.id, email: m.email, passwordHash: m.passwordHash })
    .from(m)
    .where(and(eq(sql`lower(${m.email})`, email), isNull(m.revokedAt)))
    .limit(1);
  return row ? { ...row, id: row.id as StaffMemberId } : null;
}

async function totpState(conn: Db, id: StaffMemberId): Promise<TotpState | null> {
  const [row] = await conn
    .select({ secretEnc: m.totpSecretEnc, enrolledAt: m.totpEnrolledAt, lastStep: m.totpLastStep })
    .from(m)
    .where(live(id))
    .limit(1);
  return row ?? null;
}

/** One conditional UPDATE; true when it matched the row. */
async function updateIf(
  conn: Db,
  values: PgUpdateSetSource<typeof m>,
  where: ReturnType<typeof and>,
): Promise<boolean> {
  const rows = await conn.update(m).set(values).where(where).returning({ id: m.id });
  return rows.length === 1;
}

async function consumeRecoveryCode(conn: Db, id: StaffMemberId, hash: string) {
  const [row] = await conn
    .update(m)
    .set({ recoveryCodes: sql`array_remove(${m.recoveryCodes}, ${hash})` })
    .where(and(live(id), isNotNull(m.totpEnrolledAt), sql`${hash} = ANY(${m.recoveryCodes})`))
    .returning({ left: sql<number>`cardinality(${m.recoveryCodes})` });
  return row === undefined ? null : Number(row.left);
}

export function staffAuthRepo(conn: Db): StaffAuthRepo {
  return {
    findForLogin: (email) => findForLogin(conn, email),
    totpState: (id) => totpState(conn, id),
    savePendingSecret: (id, previous, sealed) =>
      updateIf(
        conn,
        { totpSecretEnc: sealed },
        and(
          live(id),
          isNull(m.totpEnrolledAt),
          previous === null ? isNull(m.totpSecretEnc) : eq(m.totpSecretEnc, previous),
        ),
      ),
    completeEnrolment: (id, step, hashes) =>
      updateIf(
        conn,
        { totpEnrolledAt: sql`now()`, totpLastStep: step, recoveryCodes: [...hashes] },
        and(live(id), isNull(m.totpEnrolledAt), isNotNull(m.totpSecretEnc)),
      ),
    advanceStep: (id, step) =>
      updateIf(
        conn,
        { totpLastStep: step },
        and(
          live(id),
          isNotNull(m.totpEnrolledAt),
          or(isNull(m.totpLastStep), lt(m.totpLastStep, step)),
        ),
      ),
    consumeRecoveryCode: (id, hash) => consumeRecoveryCode(conn, id, hash),
  };
}
