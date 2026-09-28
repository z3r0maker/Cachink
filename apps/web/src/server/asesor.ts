import 'server-only';

import { calcularCapacidades, type Capacidad, type Insight } from '@xangarro/domain';

import { listNotices, notices } from '@xangarro/data-pg';

import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { withTenant, type Tx } from './db';
import { hoy } from './clock';
import { materializarParaNegocio, type Cadencia } from './asesor/pipeline';

/**
 * The Asesor page's read model (P-26): run the deterministic pipeline
 * (`./asesor/pipeline.ts`, shared with the scheduled run so the two can never
 * disagree), then read the feed plus its history back — ADR-088, the feed
 * still reads the table and dismissals are state transitions on real rows.
 */
export interface AsesorPageData {
  readonly feed: Awaited<ReturnType<typeof listNotices>>;
  readonly anteriores: Awaited<ReturnType<typeof listNotices>>;
  readonly capacidades: readonly Capacidad[];
}

export async function loadAsesorPage(
  businessId: string,
  cadencia: Cadencia,
): Promise<AsesorPageData> {
  const { inputs } = await materializarParaNegocio(businessId, cadencia, hoy());

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
