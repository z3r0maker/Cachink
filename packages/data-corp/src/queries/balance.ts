import type { SumaDeCuenta } from '@xangarro/domain/corp';
import { and, asc, between, eq, lte, sql } from 'drizzle-orm';

import type { CorpDb } from '../client.js';
import { entries, entryLines } from '../schema/ledger.js';

/**
 * Balance's reads (E-12, board CD-08). The sheet is the ledger summed per
 * account up to a day, with the lines before that day's year apart: their
 * results are the accumulated ones (`balanceGeneral`).
 */

const bigintDe = (value: unknown, que: string): bigint => {
  if (typeof value !== 'bigint') throw new Error(`corp balance: ${que} is not bigint`);
  return value;
};

const booleanDe = (value: unknown, que: string): boolean => {
  if (typeof value !== 'boolean') throw new Error(`corp balance: ${que} is not boolean`);
  return value;
};

/** Every account's debits and credits up to `hasta` (`YYYY-MM-DD`, inclusive). */
export async function sumasAl(db: CorpDb, hasta: string): Promise<readonly SumaDeCuenta[]> {
  const previo = sql`(${entries.fecha} < ${`${hasta.slice(0, 4)}-01-01`}::date)`;
  const rows = await db
    .select({
      cuenta: entryLines.cuenta,
      previo,
      debe: sql`sum(${entryLines.debe})::bigint`.mapWith(entryLines.debe),
      haber: sql`sum(${entryLines.haber})::bigint`.mapWith(entryLines.haber),
      entryId: sql<string>`min(${entries.id})`,
    })
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .where(lte(entries.fecha, hasta))
    // By position: the year's date is a parameter, and Postgres would read a
    // second copy of the expression as another one.
    .groupBy(sql`1, 2`)
    .orderBy(asc(entryLines.cuenta));
  return rows.map((r) => ({
    cuenta: r.cuenta,
    previo: booleanDe(r.previo, `${r.cuenta} previo`),
    debe: bigintDe(r.debe, `${r.cuenta} debe`),
    haber: bigintDe(r.haber, `${r.cuenta} haber`),
    entryId: r.entryId,
  }));
}

export interface LineaDeCuenta {
  readonly entryId: string;
  readonly fecha: string;
  readonly concepto: string;
  /** Centavos. */
  readonly debe: bigint;
  readonly haber: bigint;
}

/** One account's lines between two days (inclusive): what a Balance line opens into. */
export async function lineasDeCuenta(
  db: CorpDb,
  cuenta: string,
  desde: string,
  hasta: string,
): Promise<readonly LineaDeCuenta[]> {
  const rows = await db
    .select({
      entryId: entries.id,
      fecha: entries.fecha,
      concepto: entries.concepto,
      debe: entryLines.debe,
      haber: entryLines.haber,
    })
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .where(and(eq(entryLines.cuenta, cuenta), between(entries.fecha, desde, hasta)))
    .orderBy(asc(entries.fecha), asc(entries.createdAt), asc(entryLines.id));
  return rows.map((r) => ({
    ...r,
    debe: bigintDe(r.debe, `line of ${r.entryId}`),
    haber: bigintDe(r.haber, `line of ${r.entryId}`),
  }));
}
