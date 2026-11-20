import {
  CUENTAS_CAJA,
  CUENTAS_SOCIOS,
  MOVEMENT_KINDS,
  type MovementKind,
  type MovimientoCajaConTipo,
} from '@xangarro/domain/corp';
import { eq, inArray, lte, sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { sumasAl } from './balance.js';
import { entries, entryLines } from '../schema/ledger.js';

/**
 * Cash's read (E-16's «Autonomía», E-23's Caja): each entry's net effect on
 * Bancos plus Stripe por depositar, and whether it moves partner money. Netted
 * per entry, so a Stripe payout counts only its fee and a transfer between the
 * two counts nothing.
 */
export interface MovimientoCajaDeEntrada extends MovimientoCajaConTipo {
  readonly entryId: string;
}

const CAJA = [...CUENTAS_CAJA];
const SOCIOS = [...CUENTAS_SOCIOS];

/** `sum()` over bigint comes back as numeric text: parsed, never asserted (CLAUDE.md §2.8). */
function centavos(entryId: string, v: unknown): bigint {
  const texto = typeof v === 'bigint' ? v.toString() : String(v);
  if (!/^-?\d+$/.test(texto)) throw new Error(`corp entry ${entryId} cash is not an integer`);
  return BigInt(texto);
}

function kindDe(entryId: string, v: string): MovementKind {
  const k = MOVEMENT_KINDS.find((x) => x === v);
  if (k === undefined) throw new Error(`corp entry ${entryId} has kind «${v}»`);
  return k;
}

/** Every entry up to a day (`YYYY-MM-DD`, inclusive) that moved cash. */
export async function movimientosDeCaja(
  db: CorpDb,
  hasta: string,
): Promise<readonly MovimientoCajaDeEntrada[]> {
  const efecto = sql<unknown>`sum(case when ${inArray(entryLines.cuenta, CAJA)}
    then ${entryLines.debe} - ${entryLines.haber} else 0 end)`;
  const rows = await db
    .select({
      entryId: entries.id,
      fecha: entries.fecha,
      kind: entries.kind,
      importe: efecto,
      socios: sql<unknown>`bool_or(${inArray(entryLines.cuenta, SOCIOS)})`,
    })
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .where(lte(entries.fecha, hasta))
    .groupBy(entries.id, entries.fecha, entries.kind)
    .having(sql`${efecto} <> 0`);
  return rows.map((r) => {
    if (typeof r.socios !== 'boolean') throw new Error(`corp entry ${r.entryId} has no lines`);
    return {
      entryId: r.entryId,
      fecha: r.fecha,
      kind: kindDe(r.entryId, r.kind),
      importe: centavos(r.entryId, r.importe),
      socios: r.socios,
    };
  });
}

/** Bancos and Stripe por depositar at the end of a day, centavos (E-23, board CD-15c). */
export async function saldosDeCaja(
  db: CorpDb,
  hasta: string,
): Promise<{ readonly bancos: bigint; readonly stripe: bigint }> {
  const sumas = await sumasAl(db, hasta);
  const de = (cuenta: string) =>
    sumas.filter((s) => s.cuenta === cuenta).reduce((t, s) => t + s.debe - s.haber, 0n);
  return { bancos: de('bancos'), stripe: de('stripe_por_depositar') };
}
