import 'server-only';

import { lastCortes, lowStock, recentActivity, totalsForRange } from '@xangarro/data-pg';

import { withTenant } from './db';

/**
 * Inicio's read model.
 *
 * One transaction, one tenant claim, four queries — rather than four
 * round-trips each re-establishing the claim. The screen stays a pure
 * component over this shape, which is what lets Fase 5's sweep force any state
 * from props (ADR-058 §9).
 */
export interface InicioData {
  readonly today: Awaited<ReturnType<typeof totalsForRange>>;
  readonly month: Awaited<ReturnType<typeof totalsForRange>>;
  readonly activity: Awaited<ReturnType<typeof recentActivity>>;
  readonly lowStock: Awaited<ReturnType<typeof lowStock>>;
  readonly cortes: Awaited<ReturnType<typeof lastCortes>>;
}

export async function loadInicio(
  businessId: string,
  today: string,
  monthFrom: string,
  monthTo: string,
): Promise<InicioData> {
  return withTenant(businessId, async (tx) => ({
    today: await totalsForRange(tx, today, today),
    month: await totalsForRange(tx, monthFrom, monthTo),
    activity: await recentActivity(tx, 6),
    lowStock: await lowStock(tx),
    cortes: await lastCortes(tx, 2),
  }));
}
