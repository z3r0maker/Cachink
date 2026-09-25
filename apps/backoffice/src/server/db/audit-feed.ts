import { desc, eq } from 'drizzle-orm';

import type { Db } from './client';
import { staffAuditLog, staffMembers } from './schema';

/** One line of Inicio's «Bitácora»: who did what, when. Never the payload. */
export interface AuditEntry {
  readonly id: string;
  /** ISO-8601. */
  readonly at: string;
  readonly action: string;
  readonly staffEmail: string;
  readonly businessId: string | null;
}

/** The newest `limit` rows of `staff_audit_log` (0001 grants SELECT to the console). */
export async function recentAudit(conn: Db, limit: number): Promise<AuditEntry[]> {
  const rows = await conn
    .select({
      id: staffAuditLog.id,
      at: staffAuditLog.at,
      action: staffAuditLog.action,
      staffEmail: staffMembers.email,
      businessId: staffAuditLog.businessId,
    })
    .from(staffAuditLog)
    .innerJoin(staffMembers, eq(staffMembers.id, staffAuditLog.staffId))
    .orderBy(desc(staffAuditLog.at), desc(staffAuditLog.id))
    .limit(limit);
  // mode 'string' comes back in Postgres' own rendering; normalise to ISO.
  return rows.map((r) => ({ ...r, at: new Date(r.at).toISOString() }));
}
