import { sql } from 'drizzle-orm';
import type { BusinessId } from '@xangarro/domain';
import type { PeriodUsage } from '@xangarro/domain/usage';

import type { TenantUsage, UsagePageQuery, UsageSource } from '../usage/port';
import type { Db, Tx } from './client';

/**
 * Postgres adapters for `UsageSource` (N-07). Both make one call and receive
 * rows one per tenant per month, tenants already in keyset order:
 *
 * - `drizzleUsageSource` — `admin_tenant_usage()` (0006/0009), which
 *   recomputes the page's usage from source rows with the OQ-5 rules. /uso.
 * - `drizzleStoredUsageSource` — `admin_tenant_usage_stored()` (0022), the
 *   same page from `usage_counters`, as the nightly job last stored it. The
 *   digest reads this one (DB2-CRON-01): a day-old view, at the cost of an
 *   index lookup instead of a recount of every tenant's history.
 */
type Conn = Db | Tx;

interface Row extends Record<string, unknown> {
  business_id: string;
  nombre: string;
  created_at: string;
  period: string;
  transactions: number;
  active_products: number;
}

function group(rows: readonly Row[]): TenantUsage[] {
  const out: { t: TenantUsage; history: PeriodUsage[] }[] = [];
  for (const r of rows) {
    let last = out.at(-1);
    if (last === undefined || last.t.id !== r.business_id) {
      const history: PeriodUsage[] = [];
      last = {
        t: { id: r.business_id as BusinessId, nombre: r.nombre, createdAt: r.created_at, history },
        history,
      };
      out.push(last);
    }
    last.history.push({
      period: r.period,
      transactions: Number(r.transactions),
      activeProducts: Number(r.active_products),
    });
  }
  return out.map((o) => o.t);
}

type UsageFunction = 'admin_tenant_usage' | 'admin_tenant_usage_stored';

function source(conn: Conn, fn: UsageFunction): UsageSource {
  return {
    async page(q: UsagePageQuery): Promise<TenantUsage[]> {
      const rows = await conn.execute<Row>(sql`
        SELECT * FROM public.${sql.raw(fn)}(
          ${q.period},
          ${q.after?.createdAt ?? null}::timestamptz,
          ${q.after?.id ?? null}::text,
          ${q.limit}::int)`);
      return group(rows);
    },
  };
}

export const drizzleUsageSource = (conn: Conn): UsageSource => source(conn, 'admin_tenant_usage');

export const drizzleStoredUsageSource = (conn: Conn): UsageSource =>
  source(conn, 'admin_tenant_usage_stored');
