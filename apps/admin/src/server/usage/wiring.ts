import type { Db, Tx } from '../db/client';
import { drizzleUsageSource } from '../db/usage';
import { tenantDeps } from '../tenants/wiring';
import type { UsageListDeps } from './list';

/**
 * The usage page's adapters: usage from `admin_tenant_usage()`, plans from
 * the same billing source and overrides as the tenant pages. When N-02's
 * `usage_counters` lands, only the `usage` line changes.
 */
export function usageDeps(conn: Db | Tx): UsageListDeps {
  const { billing, overrides } = tenantDeps(conn);
  return { usage: drizzleUsageSource(conn), billing, overrides };
}
