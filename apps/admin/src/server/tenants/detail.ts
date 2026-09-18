import { ulidField, type BusinessId, type PlanLimits, type PlanOverride } from '@xangarro/domain';

import type { BillingSnapshot, BillingStatusSource } from '../billing/port';
import { UNKNOWN_BILLING } from '../billing/port';
import { invalidTenantInput, TenantError, tenantStore } from './errors';
import { limitsOf, planView, type PlanView } from './plan-view';
import type {
  PlanOverrideRepository,
  TenantDevice,
  TenantDirectory,
  TenantMember,
  TenantSummary,
} from './port';

const BusinessIdSchema = ulidField<BusinessId>();

export interface TenantDetailDeps {
  readonly directory: TenantDirectory;
  readonly billing: BillingStatusSource;
  readonly overrides: PlanOverrideRepository;
}

export interface TenantDetail {
  readonly summary: TenantSummary;
  readonly members: readonly TenantMember[];
  readonly devices: readonly TenantDevice[];
  readonly billing: BillingSnapshot;
  /** Every override ever made, newest first — active and expired. */
  readonly overrides: readonly PlanOverride[];
  readonly plan: PlanView;
  /** What the next entitlement would carry for the effective plan. */
  readonly limits: PlanLimits;
}

/**
 * `loadTenant` — everything the detail page shows about one business (N-06).
 * The id comes from the URL, so it is validated before any query.
 */
export async function loadTenant(
  deps: TenantDetailDeps,
  id: unknown,
  now: Date,
): Promise<TenantDetail> {
  const parsed = BusinessIdSchema.safeParse(id);
  if (!parsed.success) throw invalidTenantInput('Id de negocio inválido.');
  const businessId = parsed.data;
  const summary = await tenantStore(() => deps.directory.find(businessId));
  if (summary === null) throw new TenantError('NOT_FOUND', 'Ese negocio no existe.');

  const [members, devices, snapshots, overrides] = await tenantStore(() =>
    Promise.all([
      deps.directory.members(businessId),
      deps.directory.devices(businessId),
      deps.billing.snapshots([businessId]),
      deps.overrides.listFor(businessId),
    ]),
  );
  const billing = snapshots.get(businessId) ?? UNKNOWN_BILLING;
  const plan = planView(billing, overrides, now);
  return { summary, members, devices, billing, overrides, plan, limits: limitsOf(plan) };
}
