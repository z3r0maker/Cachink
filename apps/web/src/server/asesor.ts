import 'server-only';

import {
  calcularCapacidades,
  calcularInsights,
  filtrarPorCadencia,
  type Capacidad,
  type Insight,
} from '@xangarro/domain';

import { asesorInputs, listNotices, materializarInsights, notices } from '@xangarro/data-pg';

import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { withTenant, type Tx } from './db';
import { hoy } from './clock';

/**
 * The Asesor page's read model (P-26): compute the deterministic insights from
 * the tenant's own rows, keep only what the plan's cadence receives
 * («semanal» sees the two most urgent; ADR-059), materialise them into
 * `notices` (ADR-087 — the feed still reads the table; dismissals are state
 * transitions on real rows) and read the feed plus its history back.
 */
export interface AsesorPageData {
  readonly feed: Awaited<ReturnType<typeof listNotices>>;
  readonly anteriores: Awaited<ReturnType<typeof listNotices>>;
  readonly capacidades: readonly Capacidad[];
}

export async function loadAsesorPage(
  businessId: string,
  cadencia: 'semanal' | 'diario' | 'completo',
): Promise<AsesorPageData> {
  const today = hoy();
  const inputs = await withTenant(businessId, (tx) => asesorInputs(tx, today));
  const visibles = filtrarPorCadencia(calcularInsights(inputs), cadencia);
  await withTenant(businessId, (tx) => materializarInsights(tx, businessId, visibles));

  return withTenant(businessId, async (tx) => ({
    feed: await listNotices(tx, 'asesor'),
    anteriores: await listNoticesCerradas(tx),
    capacidades: calcularCapacidades(inputs.cuenta),
  }));
}

/** Closed asesor rows — the «Anteriores» history, newest first. */
async function listNoticesCerradas(tx: Tx) {
  return tx
    .select({
      id: notices.id,
      source: notices.source,
      severity: notices.severity,
      title: notices.title,
      body: notices.body,
      ctaLabel: notices.ctaLabel,
      ctaHref: notices.ctaHref,
      state: notices.state,
      createdAt: notices.createdAt,
    })
    .from(notices)
    .where(and(eq(notices.source, 'asesor'), isNotNull(notices.resolvedAt)))
    .orderBy(desc(notices.resolvedAt))
    .limit(10);
}

export type { Insight };
