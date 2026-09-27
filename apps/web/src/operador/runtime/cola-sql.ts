/**
 * The outbox readers' plumbing (O-27): batched `IN (…)` reads over the
 * Worker's database, and the shapes every reader returns.
 */

import { sql, type SQL } from 'drizzle-orm';

import type { ClaseMovimiento, PendienteCrudo } from '@xangarro/caja/lectura';
import type { Db } from './db-types';

export type Lector = (db: Db, ids: readonly string[]) => Promise<Map<string, PendienteCrudo>>;

const LOTE = 400;

export async function filas<T>(db: Db, q: SQL): Promise<T[]> {
  return (await db.all(q)) as T[];
}

/** Runs `leer` over `(id, id, …)` lists small enough for SQLite's variables. */
export async function porLotes<T>(
  ids: readonly string[],
  leer: (lote: SQL) => Promise<T[]>,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += LOTE) {
    const lote = ids.slice(i, i + LOTE).map((id) => sql`${id}`);
    out.push(...(await leer(sql`(${sql.join(lote, sql`, `)})`)));
  }
  return out;
}

export const porId = (xs: readonly PendienteCrudo[]) => new Map(xs.map((x) => [x.id, x] as const));

export const movimiento = (
  id: string,
  en: string,
  clase: ClaseMovimiento,
  texto: string | null,
  montoCentavos: string | null,
): PendienteCrudo => ({ tipo: 'movimiento', id, en, clase, texto, montoCentavos });
