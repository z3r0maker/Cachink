import type { DeclaracionRepository } from '@xangarro/application/corp';
import type { Declaracion } from '@xangarro/domain/corp';
import { asc, between, eq } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { taxReturns } from '../schema/impuestos.js';

/**
 * The contador's declarations (E-13, ADR-148): one row per month, upserted
 * until the month is paid (the use case refuses a change after that).
 */
type Row = typeof taxReturns.$inferSelect;

const bigintDe = (value: unknown, que: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(`corp impuestos: ${que} is not bigint`);
  return value;
};

/** A row parsed, never asserted (CLAUDE.md §2.8). */
const toDeclaracion = (r: Row): Declaracion => ({
  periodo: r.period,
  isr: bigintDe(r.isr, `isr of ${r.period}`),
  iva: bigintDe(r.iva, `iva of ${r.period}`),
  retencionIsr: bigintDe(r.retencionIsr, `retencion_isr of ${r.period}`),
  retencionIva: bigintDe(r.retencionIva, `retencion_iva of ${r.period}`),
  lineaImporte:
    r.lineaImporte === null ? null : bigintDe(r.lineaImporte, `linea_importe of ${r.period}`),
  lineaVigencia: r.lineaVigencia,
});

export function createDeclaracionRepository(db: CorpDb): DeclaracionRepository {
  return {
    async porPeriodo(periodo) {
      const [row] = await db.select().from(taxReturns).where(eq(taxReturns.period, periodo));
      return row === undefined ? null : toDeclaracion(row);
    },
    async lista(desde, hasta) {
      const rows = await db
        .select()
        .from(taxReturns)
        .where(between(taxReturns.period, desde, hasta))
        .orderBy(asc(taxReturns.period));
      return rows.map(toDeclaracion);
    },
    async guardar(d, founderId) {
      const now = new Date().toISOString();
      const set = {
        isr: d.isr,
        iva: d.iva,
        retencionIsr: d.retencionIsr,
        retencionIva: d.retencionIva,
        lineaImporte: d.lineaImporte,
        lineaVigencia: d.lineaVigencia,
        updatedBy: founderId,
        updatedAt: now,
      };
      await db
        .insert(taxReturns)
        .values({ period: d.periodo, ...set, createdBy: founderId, createdAt: now })
        .onConflictDoUpdate({ target: taxReturns.period, set });
    },
  };
}
