import { sql } from 'drizzle-orm';
import type { BusinessId } from '@xangarro/domain';
import type { PeriodUsage } from '@xangarro/domain/usage';

import type { TenantUsage, UsagePageQuery, UsageSource } from '../usage/port';
import type { Db, Tx } from './client';

/**
 * Postgres adapter for `UsageSource` (N-07): one call to
 * `admin_tenant_usage()` (0005_admin_usage_read.sql), which recomputes the
 * page's usage from source rows with the OQ-5 rules. Rows arrive one per
 * tenant per month, tenants already in keyset order.
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

export function drizzleUsageSource(conn: Conn): UsageSource {
  return {
    async page(q: UsagePageQuery): Promise<TenantUsage[]> {
      const rows = await conn.execute<Row>(sql`
        SELECT * FROM public.admin_tenant_usage(
          ${q.period},
          ${q.after?.createdAt ?? null}::timestamptz,
          ${q.after?.id ?? null}::text,
          ${q.limit}::int)`);
      return group(rows);
    },
  };
}
