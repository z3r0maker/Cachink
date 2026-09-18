import { unknownBillingSource } from '../billing/stub';
import type { Db, Tx } from '../db/client';
import { drizzlePlanOverrides } from '../db/plan-overrides';
import { drizzleTenantDirectory } from '../db/tenants';
import type { TenantDetailDeps } from './detail';

/**
 * The one place the tenant pages' adapters are chosen. When B-10 lands, the
 * billing source changes here and nowhere else.
 */
export function tenantDeps(conn: Db | Tx): TenantDetailDeps {
  return {
    directory: drizzleTenantDirectory(conn),
    overrides: drizzlePlanOverrides(conn),
    billing: unknownBillingSource,
  };
}
