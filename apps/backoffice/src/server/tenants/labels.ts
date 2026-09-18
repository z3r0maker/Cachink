import type { PlanId, PlanOverrideKind } from '@xangarro/domain';

import type { BillingStatus } from '../billing/port';

/** Spanish copy for the tenant pages' enums — one place, shared by list and detail. */
export const PLAN_LABELS: Record<PlanId, string> = {
  xangarrito: 'Xangarrito',
  xangarro: 'Xangarro',
  xangarrote: 'Xangarrote',
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  active: 'Activa',
  trialing: 'En prueba',
  past_due: 'Pago vencido',
  grace: 'En gracia',
  lapsed: 'Vencida',
  free: 'Gratis',
  unknown: 'Sin datos',
};

export const OVERRIDE_LABELS: Record<PlanOverrideKind, string> = {
  extend_trial: 'Extender prueba',
  comp_plan: 'Regalar plan',
  reissue_entitlement: 'Reemitir licencia',
};

/** The `staff_audit_log` action each override writes (`area.verbo`). */
export const OVERRIDE_AUDIT_ACTIONS: Record<PlanOverrideKind, string> = {
  extend_trial: 'tenant.extender_prueba',
  comp_plan: 'tenant.regalar_plan',
  reissue_entitlement: 'tenant.reemitir_licencia',
};

export const ROLE_LABELS = { owner: 'Dueño', admin: 'Administrador', viewer: 'Contador' } as const;

const day = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeZone: 'America/Mexico_City',
});

/** An ISO instant as a CDMX calendar day, or «—». */
export function formatDay(iso: string | null): string {
  return iso === null ? '—' : day.format(new Date(iso));
}

/** Stripe Dashboard link for a customer; null until B-10 gives us the id. */
export function stripeCustomerUrl(customerId: string | null): string | null {
  return customerId === null
    ? null
    : `https://dashboard.stripe.com/customers/${encodeURIComponent(customerId)}`;
}
