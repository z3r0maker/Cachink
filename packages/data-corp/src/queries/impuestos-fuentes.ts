import type { FuentesFiscales, LineaFiscal, RetencionIsr } from '@xangarro/domain/corp';
import { and, between, eq, inArray, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { CorpDb } from '../client.js';
import { entries, entryLines } from '../schema/ledger.js';
import { importesDeResultados } from './resultados.js';

/**
 * What Impuestos estimates from (E-13): Resultados' P&L lines with the day
 * their money moved, the IVA and withholding lines, and the ISR each movement
 * withheld as captured. A tax payment is left out: it settles these figures,
 * it is not one of them.
 */
const CUENTAS = ['iva_trasladado', 'iva_acreditable', 'retenciones_por_pagar'] as const;
const original = alias(entries, 'entrada_original');

function ultimoDia(mes: string): string {
  const [y, m] = mes.split('-').map(Number) as [number, number];
  return `${mes}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
}

const bigintDe = (value: unknown, que: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(`corp impuestos: ${que} is not bigint`);
  return value;
};

/** A payload's withheld ISR: stored as a string of centavos (`toJson`), parsed strictly. */
function retenidoDe(payload: unknown): bigint {
  if (typeof payload !== 'object' || payload === null) return 0n;
  const p = payload as { kind?: unknown; pagado?: unknown; retencionIsr?: unknown };
  if (p.kind === 'gasto' && p.pagado !== true) return 0n;
  const v = p.retencionIsr;
  if (typeof v !== 'string' || !/^\d+$/.test(v)) return 0n;
  return BigInt(v);
}

const esReversa = (payload: unknown): boolean =>
  typeof payload === 'object' && payload !== null && 'reversal' in payload;

async function lineasFiscales(db: CorpDb, de: string, a: string): Promise<LineaFiscal[]> {
  const rows = await db
    .select({
      id: entryLines.id,
      fecha: entries.fecha,
      cuenta: entryLines.cuenta,
      debe: entryLines.debe,
      haber: entryLines.haber,
    })
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .where(
      and(
        inArray(entryLines.cuenta, [...CUENTAS]),
        ne(entries.kind, 'pago_impuestos'),
        between(entries.fecha, de, a),
      ),
    );
  return rows.map((r) => {
    const cuenta = CUENTAS.find((c) => c === r.cuenta);
    if (cuenta === undefined) throw new Error(`corp line ${r.id} has cuenta ${r.cuenta}`);
    return {
      fecha: r.fecha,
      cuenta,
      debe: bigintDe(r.debe, `debe of ${r.id}`),
      haber: bigintDe(r.haber, `haber of ${r.id}`),
    };
  });
}

async function retencionesIsr(db: CorpDb, de: string, a: string): Promise<RetencionIsr[]> {
  const rows = await db
    .select({ fecha: entries.fecha, payload: entries.payload, delOriginal: original.payload })
    .from(entries)
    .leftJoin(original, eq(original.id, entries.reversesEntryId))
    .where(and(inArray(entries.kind, ['gasto', 'pago_proveedor']), between(entries.fecha, de, a)));
  return rows
    .map((r) => ({
      fecha: r.fecha,
      monto: esReversa(r.payload) ? -retenidoDe(r.delOriginal) : retenidoDe(r.payload),
    }))
    .filter((r) => r.monto !== 0n);
}

/** The sources from `desde` to `hasta` (`YYYY-MM`, inclusive). */
export async function fuentesFiscales(
  db: CorpDb,
  desde: string,
  hasta: string,
): Promise<FuentesFiscales> {
  const de = `${desde}-01`;
  const a = ultimoDia(hasta);
  const [importes, lineas, retenciones] = await Promise.all([
    importesDeResultados(db, de, a),
    lineasFiscales(db, de, a),
    retencionesIsr(db, de, a),
  ]);
  return { desde, hasta, importes, lineas, retencionesIsr: retenciones };
}
