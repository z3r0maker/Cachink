import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NewPasskey } from '@xangarro/auth-core';
import type { StaffMemberId } from '@xangarro/domain';

import type { EnrolmentLinkRepo, LinkRecord } from '../auth/ports';
import type { Db } from './client';
import { toDate, toDateOrNull } from './parse';
import { staffEnrolmentLinks as l, staffMembers as m } from './schema';
import { insertPasskey } from './staff-passkeys';

/**
 * `EnrolmentLinkRepo` over `staff_enrolment_links` (0023, ADR-160). The
 * console can read a link and spend it (`used_at`), never mint or void one:
 * that is the owner-role CLI's. Spending and storing the passkey happen in
 * one transaction, so a link can never be spent without its passkey or
 * register two.
 */
class NotSpent extends Error {}

async function find(conn: Db, tokenHash: string): Promise<LinkRecord | null> {
  const [row] = await conn
    .select({
      staffId: l.staffId,
      email: m.email,
      nombre: m.nombre,
      expiresAt: l.expiresAt,
      usedAt: l.usedAt,
      voidedAt: l.voidedAt,
      revokedAt: m.revokedAt,
    })
    .from(l)
    .innerJoin(m, eq(m.id, l.staffId))
    .where(eq(l.tokenHash, tokenHash))
    .limit(1);
  if (row === undefined) return null;
  return {
    staffId: row.staffId as StaffMemberId,
    email: row.email,
    nombre: row.nombre,
    expiresAt: toDate(row.expiresAt),
    usedAt: toDateOrNull(row.usedAt),
    dead: row.voidedAt !== null || row.revokedAt !== null,
  };
}

async function spend(conn: Db, tokenHash: string, passkey: NewPasskey, nombre: string) {
  try {
    return await conn.transaction(async (tx) => {
      const [row] = await tx.execute<{ staff_id: string }>(sql`
        UPDATE staff_enrolment_links SET used_at = now()
         WHERE token_hash = ${tokenHash}
           AND used_at IS NULL AND voided_at IS NULL AND expires_at > now()
        RETURNING staff_id`);
      if (row === undefined) throw new NotSpent();
      const staffId = row.staff_id as StaffMemberId;
      if (!(await insertPasskey(tx, staffId, passkey, nombre, 'enlace'))) throw new NotSpent();
      return staffId;
    });
  } catch (error) {
    if (error instanceof NotSpent) return null;
    throw error;
  }
}

export function staffLinkRepo(conn: Db): EnrolmentLinkRepo {
  return {
    find: (hash) => find(conn, hash),
    spend: (hash, passkey, nombre) => spend(conn, hash, passkey, nombre),
  };
}
