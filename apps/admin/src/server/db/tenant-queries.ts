/**
 * The SQL pieces behind the tenant list (N-06), kept apart from the adapter
 * so each stays small.
 *
 * **Last sync** is `GREATEST(max(devices.last_push_at), max(devices.last_pull_at))`
 * over the tenant's devices. On main, `last_push_at` is stamped at the end of
 * every accepted push (`apps/portal/src/server/sync/pg-push-store.ts`,
 * `finish()`) and `last_pull_at` on every pull (`apps/portal/src/server/sync/pull.ts`).
 * `sync_receipts.received_at` (B-08) records the same pushes per *row*, has no
 * index on that column and grows with every sale — a max over it per tenant
 * would scan the tenant's whole history, and it misses pulls entirely.
 */
import { and, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { businesses, businessMembers, devices } from '@xangarro/data-pg';

import type { TenantQuery } from '../tenants/port';
import type { Db, Tx } from './client';
import { authUsers } from './override-schema';

/** A timestamptz as ISO-8601 text, full precision (the keyset needs every microsecond). */
export const isoText = (col: AnyPgColumn | SQL | SQL.Aliased) =>
  sql<string | null>`to_json(${col}) #>> '{}'`;

export function deviceStats(conn: Db | Tx) {
  return conn
    .select({
      businessId: devices.businessId,
      total: sql<number>`count(*)::int`.as('total'),
      active: sql<number>`(count(*) FILTER (WHERE ${devices.revokedAt} IS NULL))::int`.as('active'),
      lastSync: sql<
        string | null
      >`GREATEST(max(${devices.lastPushAt}), max(${devices.lastPullAt}))`.as('last_sync'),
    })
    .from(devices)
    .groupBy(devices.businessId)
    .as('ds');
}

export function ownerEmails(conn: Db | Tx) {
  return conn
    .select({
      businessId: businessMembers.businessId,
      email: sql<string | null>`min(${authUsers.email})`.as('owner_email'),
    })
    .from(businessMembers)
    .leftJoin(authUsers, sql`${authUsers.id}::text = ${businessMembers.userId}`)
    .where(eq(businessMembers.role, 'owner'))
    .groupBy(businessMembers.businessId)
    .as('ow');
}

/** `%`, `_` and `\` are literal in a search, not wildcards. */
const likePattern = (s: string) => `%${s.replace(/[\\%_]/g, '\\$&')}%`;

type Stats = ReturnType<typeof deviceStats>;
type Owners = ReturnType<typeof ownerEmails>;

export function tenantWhere(q: TenantQuery, ds: Stats, ow: Owners): SQL | undefined {
  const b = businesses;
  const conds: (SQL | undefined)[] = [isNull(b.deletedAt)];
  if (q.search !== undefined) {
    const p = likePattern(q.search);
    conds.push(or(ilike(b.nombre, p), ilike(ow.email, p), eq(b.id, q.search)));
  }
  if (q.staleBefore !== undefined) {
    conds.push(or(isNull(ds.lastSync), sql`${ds.lastSync} < ${q.staleBefore}::timestamptz`));
  }
  if (q.onlyIds !== undefined) conds.push(inArray(b.id, [...q.onlyIds]));
  if (q.after !== null) {
    conds.push(sql`(${b.createdAt}, ${b.id}) < (${q.after.createdAt}::timestamptz, ${q.after.id})`);
  }
  return and(...conds);
}
