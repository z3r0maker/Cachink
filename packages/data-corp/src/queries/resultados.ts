import {
  CUENTAS_RESULTADOS,
  esCuentaResultados,
  importeDeLinea,
  type ImporteResultados,
} from '@xangarro/domain/corp';
import { and, between, eq, inArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { CorpDb } from '../client.js';
import { receivedInvoices } from '../schema/facturas.js';
import { entries, entryLines } from '../schema/ledger.js';

/**
 * Resultados' read (E-12): every P&L line of the ledger with the day it was
 * invoiced and the day its money moved. An invoice on credit (E-11, PPD)
 * moves money on its payment's date, and never while unpaid; its
 * cancellation (a reversal of the unpaid invoice) moves none either. Every
 * other entry moves money on its own date.
 */
const propia = alias(receivedInvoices, 'factura_propia');
const original = alias(receivedInvoices, 'factura_original');
const pagoPropio = alias(entries, 'pago_propio');
const pagoOriginal = alias(entries, 'pago_original');

const COLUMNAS = {
  lineId: entryLines.id,
  entryId: entries.id,
  concepto: entries.concepto,
  fecha: entries.fecha,
  cuenta: entryLines.cuenta,
  debe: entryLines.debe,
  haber: entryLines.haber,
  credito: propia.metodoPago,
  pago: pagoPropio.fecha,
  creditoOriginal: original.metodoPago,
  pagoOriginal: pagoOriginal.fecha,
} as const;

interface Fila {
  readonly lineId: string;
  readonly entryId: string;
  readonly concepto: string;
  readonly fecha: string;
  readonly cuenta: string;
  readonly debe: unknown;
  readonly haber: unknown;
  readonly credito: string | null;
  readonly pago: string | null;
  readonly creditoOriginal: string | null;
  readonly pagoOriginal: string | null;
}

function fechaFlujo(f: Fila): string | null {
  if (f.credito === 'PPD') return f.pago;
  if (f.creditoOriginal === 'PPD') return f.pagoOriginal === null ? null : f.fecha;
  return f.fecha;
}

/** A row parsed, never asserted (CLAUDE.md §2.8). */
function toImporte(f: Fila): ImporteResultados {
  if (!esCuentaResultados(f.cuenta)) {
    throw new Error(`corp line ${f.lineId} has cuenta ${f.cuenta}`);
  }
  if (typeof f.debe !== 'bigint' || typeof f.haber !== 'bigint') {
    throw new Error(`corp line ${f.lineId} amounts are not bigint`);
  }
  return {
    entryId: f.entryId,
    concepto: f.concepto,
    cuenta: f.cuenta,
    importe: importeDeLinea(f.cuenta, f.debe, f.haber),
    fecha: f.fecha,
    fechaFlujo: fechaFlujo(f),
  };
}

/** The P&L lines invoiced or paid between two days (`YYYY-MM-DD`, inclusive). */
export async function importesDeResultados(
  db: CorpDb,
  desde: string,
  hasta: string,
): Promise<readonly ImporteResultados[]> {
  const rows = await db
    .select(COLUMNAS)
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .leftJoin(propia, eq(propia.entryId, entries.id))
    .leftJoin(pagoPropio, eq(pagoPropio.id, propia.pagoEntryId))
    .leftJoin(original, eq(original.entryId, entries.reversesEntryId))
    .leftJoin(pagoOriginal, eq(pagoOriginal.id, original.pagoEntryId))
    .where(
      and(
        inArray(entryLines.cuenta, [...CUENTAS_RESULTADOS]),
        or(between(entries.fecha, desde, hasta), between(pagoPropio.fecha, desde, hasta)),
      ),
    );
  return rows.map(toImporte);
}
