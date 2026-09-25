import { PLAN_IDS, type PlanId } from '@xangarro/domain';

import { BILLING_STATUSES, type BillingStatus } from '@/server/billing/port';
import type { ListTenantsInput } from '@/server/tenants/list';

import { one, oneOf, type SearchParams } from '../search-params';

/** The tenant list's URL is its state: `?q=&plan=&estado=&sin_sync=1&cursor=&ficha=`. */
export interface TenantView {
  readonly q: string | null;
  readonly plan: PlanId | null;
  readonly estado: BillingStatus | null;
  readonly sinSync: boolean;
  /** The business whose side panel is open (its id), if any. */
  readonly ficha: string | null;
}

export function parseTenantView(sp: SearchParams): TenantView {
  return {
    q: one(sp, 'q')?.trim().slice(0, 100) ?? null,
    plan: oneOf(one(sp, 'plan'), PLAN_IDS),
    estado: oneOf(one(sp, 'estado'), BILLING_STATUSES),
    sinSync: one(sp, 'sin_sync') === '1',
    ficha: one(sp, 'ficha')?.slice(0, 40) ?? null,
  };
}

export function toTenantListInput(view: TenantView, cursor: string | null): ListTenantsInput {
  return {
    ...(view.q ? { q: view.q } : {}),
    ...(view.plan ? { plan: view.plan } : {}),
    ...(view.estado ? { status: view.estado } : {}),
    ...(view.sinSync ? { stale: true } : {}),
    ...(cursor ? { cursor } : {}),
  };
}

/** `/tenants?…` for `view` with `change` applied; the page cursor always resets. */
export function tenantsHref(
  view: TenantView,
  change: Partial<TenantView> = {},
  cursor?: string,
): string {
  const v = { ...view, ...change };
  const q = new URLSearchParams();
  if (v.q) q.set('q', v.q);
  if (v.plan) q.set('plan', v.plan);
  if (v.estado) q.set('estado', v.estado);
  if (v.sinSync) q.set('sin_sync', '1');
  if (cursor) q.set('cursor', cursor);
  if (v.ficha) q.set('ficha', v.ficha);
  const s = q.toString();
  return s === '' ? '/tenants' : `/tenants?${s}`;
}
