import { sql } from 'drizzle-orm';

import type { CapacityProbe, CapacityReading, TableSize } from '../capacity/port';
import type { Db, Tx } from './client';

/**
 * Postgres adapter for the capacity card (N-07) — the queries of the DB audit
 * (docs/audits/db-2026-09-17.md §3.2), run as `xangarro_admin`. Catalog
 * functions need no grant; the active-tenant count reads `devices`, which
 * 0004_admin_tenant_read.sql already opened to the console.
 *
 * Once N-51 partitions a table its rows live in the partitions: this reads
 * `relkind IN ('r', 'p')`, so the parent shows 0 and each partition its own
 * share. N-51 switches the largest-table line to `pg_partition_tree` sums.
 */
type Conn = Db | Tx;

/** Days without a push after which a tenant stops counting as active (audit §3.2). */
export const ACTIVE_TENANT_DAYS = 30;

async function dbBytes(conn: Conn): Promise<number> {
  const rows = await conn.execute<{ bytes: string }>(
    sql`SELECT pg_database_size(current_database())::text AS bytes`,
  );
  return Number(rows[0]?.bytes ?? 0);
}

async function topTables(conn: Conn): Promise<TableSize[]> {
  const rows = await conn.execute<{ name: string; rows: string; bytes: string }>(sql`
    SELECT c.relname AS name,
           greatest(c.reltuples, 0)::bigint::text AS rows,
           pg_total_relation_size(c.oid)::text AS bytes
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
     ORDER BY c.reltuples DESC, pg_total_relation_size(c.oid) DESC
     LIMIT 10`);
  return rows.map((r) => ({ name: r.name, approxRows: Number(r.rows), bytes: Number(r.bytes) }));
}

async function activeTenants(conn: Conn): Promise<number> {
  const rows = await conn.execute<{ n: number }>(sql`
    SELECT count(DISTINCT business_id)::int AS n
      FROM public.devices
     WHERE revoked_at IS NULL
       AND last_push_at > now() - make_interval(days => ${ACTIVE_TENANT_DAYS})`);
  return Number(rows[0]?.n ?? 0);
}

export function drizzleCapacityProbe(conn: Conn): CapacityProbe {
  return {
    async read(): Promise<CapacityReading> {
      const [bytes, tables, tenants] = await Promise.all([
        dbBytes(conn),
        topTables(conn),
        activeTenants(conn),
      ]);
      return {
        dbBytes: bytes,
        topTables: tables,
        activeTenants: tenants,
        syncP95Ms: null,
        measuredAt: new Date().toISOString(),
      };
    },
  };
}
