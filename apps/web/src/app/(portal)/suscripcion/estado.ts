import type { BillingStatusSnapshot } from '@xangarro/application/billing';
import { formatFechaHora } from '@xangarro/domain';

/**
 * What «Tu plan» says about the subscription (P-10), from Stripe's status as
 * the webhook stored it. Past due is not yet a loss: seven days of grace, then
 * the account drops to Xangarrito (ADR-053 §5) — said plainly, with the fix.
 */
export interface EstadoCopy {
  readonly linea: string;
  /** A problem the owner must act on: rendered as a warning banner. */
  readonly aviso: string | null;
}

const dia = (iso: string | null) => formatFechaHora(iso).split(',')[0] ?? '—';

export function estadoCopy(s: BillingStatusSnapshot | null): EstadoCopy {
  if (s === null) return { linea: 'Gratis para siempre.', aviso: null };
  const fin = dia(s.currentPeriodEnd);
  switch (s.status) {
    case 'trialing':
      return { linea: `Prueba gratis hasta el ${fin}.`, aviso: null };
    case 'active':
      return { linea: `Siguiente cobro: ${fin}.`, aviso: null };
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
