import type { TopesRepository } from '@xangarro/application/corp';
import type { TopesDelAnio } from '@xangarro/domain/corp';
import { and, asc, between, desc, eq, sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { annualCaps } from '../schema/limites.js';
import { entries, entryLines } from '../schema/ledger.js';
import { projects } from '../schema/projects.js';

/**
 * Límites' reads and writes (E-15, board CD-12d): the year's caps, and the
 * income the gauges measure, per project and summed (the caps are always on
 * the whole company, ADR-125 §3).
 */

const bigintDe = (value: unknown, que: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(`corp límites: ${que} is not bigint`);
  return value;
};

type CapRow = typeof annualCaps.$inferSelect;

const toTopes = (r: CapRow): TopesDelAnio => ({
  anio: r.anio,
  sas: bigintDe(r.topeSas, `tope_sas of ${r.anio}`),
  resico: bigintDe(r.topeResico, `tope_resico of ${r.anio}`),
});

export function createTopesRepository(db: CorpDb): TopesRepository {
  return {
    async topes() {
      const rows = await db.select().from(annualCaps).orderBy(desc(annualCaps.anio));
      return rows.map(toTopes);
    },
    async guardar(t, founderId) {
      const set = {
        topeSas: t.sas,
        topeResico: t.resico,
        updatedBy: founderId,
        updatedAt: new Date().toISOString(),
      };
      await db
        .insert(annualCaps)
        .values({ anio: t.anio, ...set })
        .onConflictDoUpdate({ target: annualCaps.anio, set });
    },
  };
}

export interface IngresoDeProyecto {
  readonly projectId: string | null;
  /** The project's name; «Compartidos» for income with no project. */
  readonly nombre: string;
  /** Centavos, without IVA: the `ingresos` account's credits less its debits. */
  readonly monto: bigint;
}

/** Income between two days (inclusive), per project, largest first. */
export async function ingresosPorProyecto(
  db: CorpDb,
  desde: string,
  hasta: string,
): Promise<readonly IngresoDeProyecto[]> {
  const monto = sql`sum(${entryLines.haber} - ${entryLines.debe})::bigint`;
  const rows = await db
    .select({
      projectId: entries.projectId,
      nombre: projects.nombre,
      monto: monto.mapWith(entryLines.haber),
    })
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .leftJoin(projects, eq(projects.id, entries.projectId))
    .where(and(eq(entryLines.cuenta, 'ingresos'), between(entries.fecha, desde, hasta)))
    .groupBy(entries.projectId, projects.nombre)
    .orderBy(desc(monto), asc(projects.nombre));
  return rows.map((r) => ({
    projectId: r.projectId,
    nombre: r.nombre ?? 'Compartidos',
    monto: bigintDe(r.monto, `income of ${r.projectId ?? 'no project'}`),
  }));
}
