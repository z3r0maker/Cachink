import { CUENTAS_CAJA, CUENTAS_SOCIOS, type MovimientoCaja } from '@xangarro/domain/corp';
import { eq, inArray, lte, sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { entries, entryLines } from '../schema/ledger.js';

/**
 * Cash's read (E-16's «Autonomía», E-23's Caja): each entry's net effect on
 * Bancos plus Stripe por depositar, and whether it moves partner money. Netted
 * per entry, so a Stripe payout counts only its fee and a transfer between the
 * two counts nothing.
 */
export interface MovimientoCajaDeEntrada extends MovimientoCaja {
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
      importe: efecto,
      socios: sql<unknown>`bool_or(${inArray(entryLines.cuenta, SOCIOS)})`,
    })
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .where(lte(entries.fecha, hasta))
    .groupBy(entries.id, entries.fecha)
    .having(sql`${efecto} <> 0`);
  return rows.map((r) => {
    if (typeof r.socios !== 'boolean') throw new Error(`corp entry ${r.entryId} has no lines`);
    return {
      entryId: r.entryId,
      fecha: r.fecha,
      importe: centavos(r.entryId, r.importe),
      socios: r.socios,
    };
  });
}
