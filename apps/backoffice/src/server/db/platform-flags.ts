import { count, desc, eq, inArray } from 'drizzle-orm';
import { businesses } from '@xangarro/data-pg';
import {
  PlatformFlagSchema,
  type PlatformFlag,
  type PlatformFlagEventId,
  type StaffMemberId,
} from '@xangarro/domain';

import type { PlatformFlagEvent, PlatformFlagStore } from '../flags/port';
import type { Db, Tx } from './client';
import { platformFlagEvents, platformFlags } from './flag-schema';
import { staffMembers } from './schema';

/**
 * Postgres adapter for `PlatformFlagStore` (N-09). Rows are re-validated on
 * the way out, so a row the CHECKs let through but the domain would refuse
 * surfaces as an error instead of reaching a screen.
 */
type FlagColumns = typeof platformFlags.$inferSelect;

function toFlag(row: FlagColumns): PlatformFlag {
  return PlatformFlagSchema.parse({
    key: row.flagKey,
    mode: row.mode,
    allowlistBusinessIds: row.allowlistBusinessIds,
    reason: row.reason,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt.toISOString(),
  });
}

export function drizzlePlatformFlags(conn: Db | Tx): PlatformFlagStore {
  const t = platformFlagEvents;
  return {
    async append(e: PlatformFlagEvent) {
      await conn.insert(t).values({
        id: e.id,
        flagKey: e.key,
        mode: e.mode,
        allowlistBusinessIds: [...e.allowlistBusinessIds],
        reason: e.reason,
        updatedBy: e.updatedBy,
        updatedAt: new Date(e.updatedAt),
      });
    },
    async current() {
      const rows = await conn.select().from(platformFlags);
      return rows.map(toFlag);
    },
    async history(key, limit) {
      const rows = await conn
        .select()
        .from(t)
        .where(eq(t.flagKey, key))
        .orderBy(desc(t.updatedAt), desc(t.id))
        .limit(limit);
      return rows.map((r) => ({ id: r.id as PlatformFlagEventId, ...toFlag(r) }));
    },
    async tenantCount() {
      const [row] = await conn.select({ n: count() }).from(businesses);
      return Number(row?.n ?? 0);
    },
    async staffNames(ids) {
      const rows = await conn
        .select({ id: staffMembers.id, nombre: staffMembers.nombre })
        .from(staffMembers)
        .where(inArray(staffMembers.id, [...ids]));
      return new Map(rows.map((r) => [r.id as StaffMemberId, r.nombre]));
    },
  };
}
