import { desc, eq, isNotNull, isNull } from 'drizzle-orm';

import type { Meta, MotivoMeta, NivelMeta, ObjetivoMeta } from '@xangarro/domain';

import { celebraciones, metas } from '../schema/portal.js';
import type { Db } from '../client.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

type MetaRow = typeof metas.$inferSelect;

/** The table's row as the domain's `Meta` — same fields, dates as text. */
function aMeta(row: MetaRow): Meta {
  return {
    id: row.id,
    objetivo: row.objetivo as ObjetivoMeta,
    motivo: row.motivo as MotivoMeta,
    nivel: row.nivel as NivelMeta,
    objetivoCentavos: row.objetivoCentavos,
    periodo: row.periodo,
    lograda: row.lograda,
    resultadoCentavos: row.resultadoCentavos,
    cerradaAt: row.cerradaAt,
  };
}

/** The running goal, if this month already has one. */
export async function metaActiva(tx: Tx): Promise<Meta | null> {
  const [row] = await tx
    .select()
    .from(metas)
    .where(isNull(metas.cerradaAt))
    .orderBy(desc(metas.createdAt))
    .limit(1);
  return row === undefined ? null : aMeta(row);
}

/** Closed goals, newest first — the trophies and the racha. */
export async function metasCerradas(tx: Tx): Promise<readonly Meta[]> {
  const rows = await tx
    .select()
    .from(metas)
    .where(isNotNull(metas.cerradaAt))
    .orderBy(desc(metas.periodo));
  return rows.map(aMeta);
}

export async function insertarMeta(tx: Tx, businessId: string, m: Meta): Promise<void> {
  await tx.insert(metas).values({
    id: m.id,
    objetivo: m.objetivo,
    motivo: m.motivo,
    nivel: m.nivel,
    objetivoCentavos: m.objetivoCentavos,
    periodo: m.periodo,
    businessId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function cerrarMeta(
  tx: Tx,
  id: string,
  cierre: { readonly lograda: boolean; readonly resultado: bigint; readonly at: string },
): Promise<void> {
  await tx
    .update(metas)
    .set({
      lograda: cierre.lograda,
      resultadoCentavos: cierre.resultado,
      cerradaAt: cierre.at,
      updatedAt: cierre.at,
    })
    .where(eq(metas.id, id));
}

/** The shown-once markers (P-33): `celebrada(clave)` both writes and answers. */
export async function celebrada(tx: Tx, businessId: string, clave: string): Promise<boolean> {
  const now = new Date().toISOString();
  const inserted = await tx
    .insert(celebraciones)
    .values({ clave, businessId, createdAt: now, updatedAt: now })
    .onConflictDoNothing({ target: [celebraciones.businessId, celebraciones.clave] })
    .returning({ clave: celebraciones.clave });
  return inserted.length === 0;
}

/** Which markers already exist — for the server to decide what to show. */
export async function clavesCelebradas(tx: Tx): Promise<readonly string[]> {
  const rows = await tx.select({ clave: celebraciones.clave }).from(celebraciones);
  return rows.map((r) => r.clave);
}
