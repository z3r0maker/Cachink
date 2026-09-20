import { asc, desc, eq, sql } from 'drizzle-orm';
import { businesses, businessMembers, deviceLastSeen, devices } from '@xangarro/data-pg';
import type { BusinessId } from '@xangarro/domain';

import type {
  TenantDevice,
  TenantDirectory,
  TenantMember,
  TenantQuery,
  TenantSummary,
} from '../tenants/port';
import type { Db, Tx } from './client';
import { deviceStats, isoText, ownerEmails, tenantWhere } from './tenant-queries';

/**
 * Postgres adapter for `TenantDirectory` (N-06). Read-only: it runs as
 * `xangarro_admin`, which 0004_admin_tenant_read.sql lets SELECT across
 * tenants from `businesses`, `business_members`, `devices` and two columns
 * of `auth.users` — and nothing else.
 */
type Conn = Db | Tx;

async function summaries(conn: Conn, q: TenantQuery): Promise<TenantSummary[]> {
  const ds = deviceStats(conn);
  const ow = ownerEmails(conn);
  const li = ownerLastLogin(conn);
  const rows = await conn
    .select({
      id: businesses.id,
      nombre: businesses.nombre,
      createdAt: isoText(businesses.createdAt),
      ownerEmail: ow.email,
      devicesTotal: sql<number>`coalesce(${ds.total}, 0)`,
      devicesActive: sql<number>`coalesce(${ds.active}, 0)`,
      lastSyncAt: isoText(ds.lastSync),
      lastOwnerLoginAt: isoText(li.lastLogin),
    })
    .from(businesses)
    .leftJoin(ds, eq(ds.businessId, businesses.id))
    .leftJoin(ow, eq(ow.businessId, businesses.id))
    .leftJoin(li, eq(li.businessId, businesses.id))
    .where(tenantWhere(q, ds, ow))
    .orderBy(desc(businesses.createdAt), desc(businesses.id))
    .limit(q.limit);
  return rows.map((r) => ({
    ...r,
    id: r.id as BusinessId,
    createdAt: r.createdAt ?? '',
    devicesTotal: Number(r.devicesTotal),
    devicesActive: Number(r.devicesActive),
    lastOwnerLoginAt: r.lastOwnerLoginAt ?? null,
  }));
}

/** N-06: `xangarro.owner_last_login()` (admin migration 0013) as a joinable
 * subquery — one (business_id, last_login) row, live sessions only. The
 * connection is the caller's (`conn`), never a singleton. */
function ownerLastLogin(conn: Conn) {
  return conn
    .select({
      businessId: sql<string>`business_id`,
      lastLogin: sql<string | null>`last_login`,
    })
    .from(sql`xangarro.owner_last_login()`)
    .as('li');
}

async function members(conn: Conn, id: BusinessId): Promise<TenantMember[]> {
  return conn
    .select({
      userId: businessMembers.userId,
      email: sql<string | null>`xangarro.admin_user_email(${businessMembers.userId})`,
      role: businessMembers.role,
    })
    .from(businessMembers)
    .where(eq(businessMembers.businessId, id))
    .orderBy(asc(businessMembers.role), asc(businessMembers.createdAt));
}

async function deviceList(conn: Conn, id: BusinessId): Promise<TenantDevice[]> {
  return conn
    .select({
      id: devices.id,
      nombre: devices.nombre,
      plataforma: devices.plataforma,
      lastSeenAt: isoText(deviceLastSeen),
      revokedAt: isoText(devices.revokedAt),
    })
    .from(devices)
    .where(eq(devices.businessId, id))
    .orderBy(asc(devices.createdAt));
}

export function drizzleTenantDirectory(conn: Conn): TenantDirectory {
  return {
    list: (q) => summaries(conn, q),
    async find(id) {
      const rows = await summaries(conn, { onlyIds: [id], after: null, limit: 1 });
      return rows[0] ?? null;
    },
    members: (id) => members(conn, id),
    devices: (id) => deviceList(conn, id),
  };
}
