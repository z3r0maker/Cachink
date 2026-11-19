import { leerRefRecurrente } from '@xangarro/domain/corp';
import { and, asc, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { CorpDb } from '../client.js';
import { receivedInvoices } from '../schema/facturas.js';
import { entries, entryLines, recurringTemplates } from '../schema/ledger.js';
import { monthBounds } from './movimientos.js';

/**
 * What each service posted (E-24): the charges registered against its
 * template, by the month they pay, and the invoices of its template's RFC
 * (E-11), by their own month. A charge's cost is its total, IVA included:
 * the sum of its debits. A reversed one does not count.
 */
export interface CargoDeServicio {
  readonly plantillaId: string;
  /** `YYYY-MM`: the month it pays. */
  readonly mes: string;
  readonly entryId: string;
  readonly fecha: string;
  readonly concepto: string;
  /** MXN centavos. */
  readonly monto: bigint;
}

const bigintDe = (value: unknown, que: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(`corp servicios: ${que} is not bigint`);
  return value;
};

function limites(desde: string, hasta: string): readonly [string, string] {
  const a = monthBounds(desde);
  const b = monthBounds(hasta);
  if (a === null || b === null) throw new Error(`not a month: ${desde} or ${hasta}`);
  return [a[0], b[1]];
}

const total = sql`sum(${entryLines.debe})::bigint`.mapWith(entryLines.debe);

/** Charges registered against a template, `desde`–`hasta` (months, inclusive). */
async function cargosRecurrentes(db: CorpDb, desde: string, hasta: string) {
  const [inicio] = limites(desde, hasta);
  const reversal = alias(entries, 'reversal');
  const rows = await db
    .select({
      id: entries.id,
      ref: entries.sourceRef,
      fecha: entries.fecha,
      concepto: entries.concepto,
      monto: total,
    })
    .from(entries)
    .innerJoin(entryLines, eq(entryLines.entryId, entries.id))
    .leftJoin(reversal, eq(reversal.reversesEntryId, entries.id))
    // A month's charge may be paid in a later month: read from the first month on.
    .where(and(eq(entries.source, 'recurring'), gte(entries.fecha, inicio), isNull(reversal.id)))
    .groupBy(entries.id)
    .orderBy(asc(entries.fecha));
  return rows.flatMap((r): CargoDeServicio[] => {
    const ref = r.ref === null ? null : leerRefRecurrente(r.ref);
    if (ref === null || ref.mes < desde || ref.mes > hasta) return [];
    const monto = bigintDe(r.monto, `entry ${r.id}`);
    return [
      {
        plantillaId: ref.plantillaId,
        mes: ref.mes,
        entryId: r.id,
        fecha: r.fecha,
        concepto: r.concepto,
        monto,
      },
    ];
  });
}

/** Registered invoices of a template's RFC dated `desde`–`hasta` (months, inclusive). */
async function cargosFacturados(db: CorpDb, desde: string, hasta: string) {
  const [inicio, fin] = limites(desde, hasta);
  const reversal = alias(entries, 'reversal');
  const rows = await db
    .select({
      plantillaId: recurringTemplates.id,
      id: entries.id,
      fecha: entries.fecha,
      concepto: entries.concepto,
      monto: total,
    })
    .from(recurringTemplates)
    .innerJoin(receivedInvoices, eq(receivedInvoices.emisorRfc, recurringTemplates.rfc))
    .innerJoin(entries, eq(entries.id, receivedInvoices.entryId))
    .innerJoin(entryLines, eq(entryLines.entryId, entries.id))
    .leftJoin(reversal, eq(reversal.reversesEntryId, entries.id))
    .where(
      and(
        eq(receivedInvoices.estado, 'registrada'),
        isNotNull(receivedInvoices.entryId),
        gte(receivedInvoices.fecha, inicio),
        lt(receivedInvoices.fecha, fin),
        isNull(reversal.id),
      ),
    )
    .groupBy(recurringTemplates.id, entries.id, receivedInvoices.fecha)
    .orderBy(asc(entries.fecha));
  return rows.map((r) => ({
    plantillaId: r.plantillaId,
    mes: r.fecha.slice(0, 7),
    entryId: r.id,
    fecha: r.fecha,
    concepto: r.concepto,
    monto: bigintDe(r.monto, `entry ${r.id}`),
  }));
}

/** Every template's charges for the months `desde`–`hasta`, oldest first. */
export async function cargosDeServicios(
  db: CorpDb,
  desde: string,
  hasta: string,
): Promise<readonly CargoDeServicio[]> {
  const [a, b] = await Promise.all([
    cargosRecurrentes(db, desde, hasta),
    cargosFacturados(db, desde, hasta),
  ]);
  return [...a, ...b].sort((x, y) => x.fecha.localeCompare(y.fecha));
}

/**
 * Stripe's fee per month, `desde`–`hasta` (months, inclusive): the cost a
 * payout posts (`costo_servicio`), by the payout's date. The ledger's only
 * commission is Stripe's, so this is what a `comision` service cost.
 */
export async function comisionesPorMes(
  db: CorpDb,
  desde: string,
  hasta: string,
): Promise<ReadonlyMap<string, bigint>> {
  const [inicio, fin] = limites(desde, hasta);
  const reversal = alias(entries, 'reversal');
  const mes = sql<string>`to_char(${entries.fecha}, 'YYYY-MM')`;
  const rows = await db
    .select({ mes, monto: total })
    .from(entries)
    .innerJoin(entryLines, eq(entryLines.entryId, entries.id))
    .leftJoin(reversal, eq(reversal.reversesEntryId, entries.id))
    .where(
      and(
        eq(entries.kind, 'payout'),
        eq(entryLines.cuenta, 'costo_servicio'),
        gte(entries.fecha, inicio),
        lt(entries.fecha, fin),
        isNull(reversal.id),
      ),
    )
    .groupBy(sql`1`);
  return new Map(rows.map((r) => [r.mes, bigintDe(r.monto, `fees of ${r.mes}`)]));
}
