import { and, count, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { CorpDb } from '../client.js';
import { documents } from '../schema/agenda.js';
import { receivedInvoices } from '../schema/facturas.js';
import { entries } from '../schema/ledger.js';
import { sumasAl } from './balance.js';
import { monthBounds } from './movimientos.js';

/**
 * What Cierre del mes reads from the corp ledger (E-14, board CD-10): the
 * month's expenses and whether each has its CFDI, the XMLs still to review,
 * and Bancos at a day. The rest of its steps come from screens that already
 * read them (Emitidas, Impuestos, Agenda, Expediente).
 */
export interface GastoSinFactura {
  readonly id: string;
  readonly concepto: string;
  readonly fecha: string;
}

export interface RecibidasDelMes {
  /** Expenses of the month that stand (neither reversed nor a reversal). */
  readonly gastos: number;
  /** Of those, marked non-deductible: they need no CFDI. */
  readonly noDeducibles: number;
  /** Deductible ones with neither a registered XML nor a filed document. */
  readonly sinFactura: readonly GastoSinFactura[];
  /** XMLs uploaded with an issue date in the month and not yet registered. */
  readonly porRevisar: number;
}

function bounds(mes: string): readonly [string, string] {
  const b = monthBounds(mes);
  if (b === null) throw new Error(`corp cierre: «${mes}» is not a month`);
  return b;
}

function gastosDelMes(db: CorpDb, desde: string, hasta: string) {
  const reversa = alias(entries, 'reversa');
  const conXml = sql<boolean>`EXISTS (SELECT 1 FROM ${receivedInvoices} WHERE ${receivedInvoices.entryId} = ${entries.id})`;
  const conDoc = sql<boolean>`EXISTS (SELECT 1 FROM ${documents} WHERE ${documents.entryId} = ${entries.id})`;
  return db
    .select({
      id: entries.id,
      concepto: entries.concepto,
      fecha: entries.fecha,
      deducible: entries.deducible,
      factura: sql<boolean>`(${conXml} OR ${conDoc})`,
    })
    .from(entries)
    .leftJoin(reversa, eq(reversa.reversesEntryId, entries.id))
    .where(
      and(
        eq(entries.kind, 'gasto'),
        gte(entries.fecha, desde),
        lt(entries.fecha, hasta),
        isNull(entries.reversesEntryId),
        isNull(reversa.id),
      ),
    )
    .orderBy(entries.fecha, entries.id);
}

async function porRevisarDelMes(db: CorpDb, desde: string, hasta: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(receivedInvoices)
    .where(
      and(
        eq(receivedInvoices.estado, 'por_revisar'),
        gte(receivedInvoices.fecha, desde),
        lt(receivedInvoices.fecha, hasta),
      ),
    );
  return row?.n ?? 0;
}

export async function recibidasDelMes(db: CorpDb, mes: string): Promise<RecibidasDelMes> {
  const [desde, hasta] = bounds(mes);
  const [rows, porRevisar] = await Promise.all([
    gastosDelMes(db, desde, hasta),
    porRevisarDelMes(db, desde, hasta),
  ]);
  return {
    gastos: rows.length,
    noDeducibles: rows.filter((r) => r.deducible === false).length,
    sinFactura: rows
      .filter((r) => r.deducible !== false && r.factura !== true)
      .map((r) => ({ id: r.id, concepto: r.concepto, fecha: r.fecha })),
    porRevisar,
  };
}

/** Bancos' balance at the end of `hasta` (`YYYY-MM-DD`, inclusive), in centavos. */
export async function saldoDeBancos(db: CorpDb, hasta: string): Promise<bigint> {
  const sumas = await sumasAl(db, hasta);
  return sumas.filter((s) => s.cuenta === 'bancos').reduce((acc, s) => acc + s.debe - s.haber, 0n);
}
