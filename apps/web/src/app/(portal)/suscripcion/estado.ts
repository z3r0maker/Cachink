import { totalCentavos, type BillingStatusSnapshot } from '@xangarro/application/billing';
import { formatMoney } from '@xangarro/domain';

import { fechaLarga } from './fecha';

/**
 * What «Tu plan» says about the subscription (P-10), from Stripe's status as
 * the webhook stored it. Past due is not yet a loss: seven days of grace, then
 * the account drops to Xangarrito (ADR-053 §5), said plainly, with the fix.
 */
export interface EstadoCopy {
  readonly linea: string;
  /** A problem the owner must act on: rendered as a warning banner. */
  readonly aviso: string | null;
}

/** «$230.84 con IVA»: what the next charge will be (LFPC 76 Bis: the total, never only the subtotal). */
export function totalLinea(s: BillingStatusSnapshot): string {
  return `${formatMoney(BigInt(totalCentavos(s.planId, s.interval)))} con IVA`;
}

/** Cancelled but still running until `cancelAt` (LFPC 76 Bis): «Seguir con mi plan» undoes it. */
export function seCancela(s: BillingStatusSnapshot | null): s is BillingStatusSnapshot & {
  cancelAt: string;
} {
  return s !== null && s.status !== 'lapsed' && s.cancelAt !== null;
}

export function estadoCopy(s: BillingStatusSnapshot | null): EstadoCopy {
  if (s === null) return { linea: 'Gratis para siempre.', aviso: null };
  if (seCancela(s) && s.status !== 'past_due') {
    return { linea: `Termina el ${fechaLarga(s.cancelAt)}. No se te cobrará más.`, aviso: null };
  }
  const fin = fechaLarga(s.currentPeriodEnd);
  switch (s.status) {
    case 'trialing':
      return { linea: `Prueba gratis hasta el ${fin}.`, aviso: null };
    case 'active':
      return { linea: `Siguiente cobro: ${fin} · ${totalLinea(s)}`, aviso: null };
    case 'past_due':
      return {
        linea: 'Tu último pago no pasó.',
        aviso:
          'Tienes 7 días de gracia para actualizar tu método de pago; después tu cuenta baja a Xangarrito. Tus registros no se pierden.',
      };
    case 'lapsed':
      return {
        linea: 'Tu suscripción venció.',
        aviso: 'Estás en Xangarrito hasta que vuelvas a pagar. Tus registros siguen aquí.',
      };
  }
}

/** The hero's status tag: one word per Stripe state, never colour alone. */
export type EstadoTono = 'gratis' | 'prueba' | 'activo' | 'atrasado' | 'vencido' | 'cancelando';

export function estadoTono(s: BillingStatusSnapshot | null): EstadoTono {
  if (s === null) return 'gratis';
  if (seCancela(s) && s.status !== 'past_due') return 'cancelando';
  if (s.status === 'trialing') return 'prueba';
  if (s.status === 'active') return 'activo';
  return s.status === 'past_due' ? 'atrasado' : 'vencido';
}

export const TONO_LABEL: Record<EstadoTono, string> = {
  gratis: 'Gratis',
  prueba: 'En prueba',
  activo: 'Al corriente',
  atrasado: 'Pago pendiente',
  vencido: 'Vencida',
  cancelando: 'Se cancela',
};
