import type { Db, Tx } from '../db/client';
import { drizzleBillingSource } from '../db/billing';
import { drizzlePlanOverrides } from '../db/plan-overrides';
import { drizzleTenantDirectory } from '../db/tenants';
import type { TenantDetailDeps } from './detail';

/**
 * The one place the tenant pages' adapters are chosen. Billing reads B-10's
 * `subscriptions` (N-06, admin migration 0017); `billing/stub.ts` stays for
 * the tests that want «nothing known».
 */
export function tenantDeps(conn: Db | Tx): TenantDetailDeps {
  return {
    directory: drizzleTenantDirectory(conn),
    overrides: drizzlePlanOverrides(conn),
    billing: drizzleBillingSource(conn),
  };
}
