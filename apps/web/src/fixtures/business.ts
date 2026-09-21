import { fromCentavos, type Money } from '@xangarro/domain';

import type { Session } from '@/session/types';

/**
 * Sample content — Taquería Don Pedro, the business used across every design
 * file. **Replaced by real data when B-02 lands**; this layer exists so the
 * screens can be built and reviewed before the database does, exactly as Track
 * A builds against the C-09 mock.
 *
 * Money is `bigint` centavos throughout, never a float (CLAUDE.md §2.8), and
 * is formatted only at the boundary with `@xangarro/domain`'s `formatMoney`.
 *
 * The plan is no longer here: `server/billing/plan.ts` reads it from the
 * business's subscription (B-10).
 */

/** @deprecated Superseded by the real session; remaining uses are being migrated. */
export const SESSION: Session = {
  role: 'owner',
  businessId: '01HZ8XQN9GZJXV8AKQ5X0C7BJZ',
  businessName: 'Taquería Don Pedro',
  planId: 'xangarro',
  capabilities: {
    estadosFinancieros: true,
    informeMensual: false,
    permisosPorUsuario: false,
    asesor: 'diario',
    cobrosIntegrados: true,
  },
  features: {
    stock: true,
    barcode: true,
    conversionMateriaPrima: false,
    conversionAutomatica: false,
    auditoriaInventario: false,
    merma: false,
    ventasCredito: false,
  },
};

export const pesos = (amount: number): Money => fromCentavos(Math.round(amount * 100));

export interface TodaySummary {
  readonly ventas: Money;
  readonly gastos: Money;
  readonly utilidad: Money;
  readonly ventasCount: number;
  readonly gastosCount: number;
}

export const TODAY: TodaySummary = {
  ventas: pesos(4850),
  gastos: pesos(1240),
  utilidad: pesos(3610),
  ventasCount: 12,
  gastosCount: 3,
};

export interface MonthSummary {
  readonly utilidad: Money;
  readonly rangeLabel: string;
  readonly deltaPct: number;
}

export const MONTH: MonthSummary = {
  utilidad: pesos(15197.62),
  rangeLabel: '01/may/2026 – 31/may/2026',
  deltaPct: 12,
};
