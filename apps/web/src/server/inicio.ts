import 'server-only';

import {
  lastCortes,
  lowStock,
  recentActivity,
  serieDiaria,
  totalsForRange,
} from '@xangarro/data-pg';
import { parseIsoDate, ultimosDias } from '@xangarro/domain';

import { buildChecklist, type Checklist } from '@/onboarding/checklist';

import { loadChecklistSignals } from './onboarding/load';
import { withTenant } from './db';

/**
 * Inicio's read model.
 *
 * One transaction, one tenant claim, six queries — rather than four
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
  /** «Últimos 30 días»: one point per day ending today, zeros included. */
  readonly serie: Awaited<ReturnType<typeof serieDiaria>>;
  /** «¿Cómo empiezo?» (P-04/N-14) — every item detected from data. */
  readonly checklist: Checklist;
  /** The month's bounds, so the hero never prints a date literal. */
  readonly mesDesde: string;
  readonly mesHasta: string;
}

export async function loadInicio(
  businessId: string,
  today: string,
  monthFrom: string,
  monthTo: string,
): Promise<InicioData> {
  const rows = await withTenant(businessId, async (tx) => ({
    today: await totalsForRange(tx, today, today),
    month: await totalsForRange(tx, monthFrom, monthTo),
    activity: await recentActivity(tx, 6),
    lowStock: await lowStock(tx),
    cortes: await lastCortes(tx, 2),
    serie: await (async () => {
      const r = ultimosDias(parseIsoDate(today), 30);
      return serieDiaria(tx, r.desde, r.hasta);
    })(),
  }));
  // The checklist reads its own signals outside the tenant transaction above;
  // both are reads, so there is no window worth closing between them.
  const signals = await loadChecklistSignals(businessId);
  return { ...rows, checklist: buildChecklist(signals), mesDesde: monthFrom, mesHasta: monthTo };
}
