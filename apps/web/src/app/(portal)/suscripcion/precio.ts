import type { BillingInterval } from '@xangarro/application/billing';
import type { PlanId } from '@xangarro/domain';

import { precioDePlan } from '@/data/planes';

/**
 * A plan's price as Plan y pagos writes it: «$199» and «MXN al mes + IVA».
 * The figure is billing's (precioDePlan); only the words are this screen's.
 */
export interface PrecioTexto {
  readonly cifra: string;
  readonly periodo: string;
}

export function precioTexto(plan: PlanId, interval: BillingInterval): PrecioTexto {
  if (plan === 'xangarrito') return { cifra: '$0', periodo: 'para siempre gratis' };
  const { price } = precioDePlan(plan, interval);
  return {
    cifra: `$${price}`,
    periodo: interval === 'month' ? 'MXN al mes + IVA' : 'MXN al año + IVA',
  };
}

/** The hero's line: «$199.00 MXN al mes + IVA». */
export function precioLinea(plan: PlanId, interval: BillingInterval): string {
  if (plan === 'xangarrito') return '$0.00 MXN, sin cobro';
  const p = precioTexto(plan, interval);
  return `${p.cifra}.00 ${p.periodo}`;
}
