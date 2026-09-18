import { and, eq, isNull } from 'drizzle-orm';
import type { StaffAuditEntry, StaffMemberId } from '@xangarro/domain';

import type { AuditSink } from '../audit';
import type { Db, Tx } from './client';
import { staffAuditLog, staffMembers } from './schema';

export interface ActiveStaff {
  readonly id: StaffMemberId;
  readonly email: string;
  readonly nombre: string;
}

/** The live allowlist row for an `auth.users` id, or null. Revoked rows never match. */
export async function findActiveStaff(conn: Db | Tx, userId: string): Promise<ActiveStaff | null> {
  const rows = await conn
    .select({ id: staffMembers.id, email: staffMembers.email, nombre: staffMembers.nombre })
    .from(staffMembers)
    .where(and(eq(staffMembers.userId, userId), isNull(staffMembers.revokedAt)))
    .limit(1);
  const row = rows[0];
  return row ? { ...row, id: row.id as StaffMemberId } : null;
}

/** An audit sink bound to one transaction — the mutation's own. */
export function auditSink(tx: Tx): AuditSink {
  return {
    insert: async (entry: StaffAuditEntry) => {
      await tx.insert(staffAuditLog).values(entry);
    },
  };
}
