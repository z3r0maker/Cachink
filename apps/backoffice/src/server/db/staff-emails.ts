import { and, inArray, isNull } from 'drizzle-orm';

import type { Db } from './client';
import { staffMembers } from './schema';

/**
 * The email of each staff member still allowed in, by id. The corp database
 * knows founders by staff id only; their address lives here (ADR-124 §1).
 */
export async function emailsDeStaff(
  db: Db,
  ids: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: staffMembers.id, email: staffMembers.email })
    .from(staffMembers)
    .where(and(inArray(staffMembers.id, [...ids]), isNull(staffMembers.revokedAt)));
  return new Map(rows.map((r) => [r.id, r.email]));
}
