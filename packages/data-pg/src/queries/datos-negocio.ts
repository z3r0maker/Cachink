import { sql, type SQL } from 'drizzle-orm';

import type { Db } from '../client.js';
import { LOTE_EXPORTACION, type EnTx } from './exportaciones.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * «Descargar todo» (the aviso de privacidad's «Exportar (Excel y JSON)»): every
 * row a business owns, as JSON, for the owner to take with them.
 *
 * **Generic on purpose.** The tables are read from the catalogue rather than
 * listed by hand: every `public` table with a `business_id` column that the
 * connecting role may `SELECT`. A table added next year is in the file the day
 * it ships, which a hand-kept list would forget. What a tenant may read is
 * decided where it always is — the RLS policies under the caller's
 * `withTenant` — so a table the role cannot select (billing ledgers) is simply
 * not listed, and a readable one yields only this tenant's rows.
 *
 * Postgres writes the JSON (`to_jsonb`), so nothing is parsed into JavaScript
 * and back: a value reaches the file exactly as stored. Two kinds of column
 * are changed on the way:
 *
 * - **`bigint`** (centavos, sequences) is written as a *string*: a JSON number
 *   past 2^53 is rounded by every JavaScript reader, and money is never a
 *   float (CLAUDE.md §2.8).
 * - **bytes and credentials are left out**: `bytea` (logos, photos, uploaded
 *   files — megabytes of base64 nobody reads in a JSON) and any column named
 *   like a secret (`*_hash`, `*secret*`, `*token*`: the operadores' NIP
 *   hashes, an activation QR's token hash). An export is a copy of the data,
 *   not of the keys to it.
 *
 * Timestamps are ISO 8601 in UTC: each batch sets the transaction's time zone.
 */
export interface TablaDelNegocio {
  readonly nombre: string;
  /** The primary key's columns, in index order: the keyset the walk pages by. */
  readonly llave: readonly string[];
  /** Columns not written: bytes and credential hashes. */
  readonly omitidas: readonly string[];
  /** `bigint` columns, written as strings. */
  readonly enteros: readonly string[];
}

/** A column whose name says it holds a credential. Case-insensitive. */
const SECRETO = '(_hash$|secret|token)';

/** Columns of `c` matching `cond`, in table order, as `text[]`. */
const columnas = (cond: SQL): SQL => sql`ARRAY(
  SELECT a.attname::text FROM pg_attribute a
   WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped AND ${cond}
   ORDER BY a.attnum)`;

/**
 * The tenant's tables, by name. A table without a primary key has no keyset
 * to page by and is not listed — the integration test fails if one appears,
 * rather than letting it drop out of the file unnoticed.
 */
export async function tablasDelNegocio(tx: Tx): Promise<readonly TablaDelNegocio[]> {
  const rows = await tx.execute<{
    nombre: string;
    llave: string[];
    omitidas: string[];
    enteros: string[];
  }>(sql`
    SELECT c.relname::text AS nombre,
           ARRAY(SELECT a.attname::text
                   FROM unnest(i.indkey::int2[]) WITH ORDINALITY k(attnum, ord)
                   JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
                  ORDER BY k.ord) AS llave,
           ${columnas(sql`(a.atttypid = 'bytea'::regtype OR a.attname ~* ${SECRETO})`)} AS omitidas,
           ${columnas(sql`a.atttypid = 'int8'::regtype`)} AS enteros
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      JOIN pg_index i ON i.indrelid = c.oid AND i.indisprimary
     WHERE c.relkind IN ('r', 'p') AND NOT c.relispartition
       AND has_table_privilege(c.oid, 'SELECT')
       AND EXISTS (SELECT 1 FROM pg_attribute b
                    WHERE b.attrelid = c.oid AND b.attname = 'business_id' AND NOT b.attisdropped)
     ORDER BY c.relname`);
  return [...rows].map((r) => ({ ...r }));
}

/** `jsonb_build_object` takes at most 100 arguments: fifty columns a call. */
const comoTexto = (enteros: readonly string[]): SQL => {
  if (enteros.length === 0) return sql`'{}'::jsonb`;
  const partes: SQL[] = [];
  for (let i = 0; i < enteros.length; i += 50) {
    const pares = enteros
      .slice(i, i + 50)
      .map((c) => sql`${c}::text, t.${sql.identifier(c)}::text`);
    partes.push(sql`jsonb_build_object(${sql.join(pares, sql`, `)})`);
  }
  return sql.join(partes, sql` || `);
};

/** `'{a,b}'` as one `text[]` parameter. Column names from the catalogue need no quoting here. */
const arreglo = (xs: readonly string[]): string =>
  `{${xs.map((x) => `"${x.replace(/(["\\])/g, '\\$1')}"`).join(',')}}`;

type Raw = { fila: string; cursor: string[] };

/** One keyset batch: the rows after `cursor`, in key order, as JSON text. */
async function leerLote(
  tx: Tx,
  tabla: TablaDelNegocio,
  cursor: readonly string[] | null,
  lote: number,
): Promise<readonly Raw[]> {
  const t = sql.identifier(tabla.nombre);
  const llave = tabla.llave.map((c) => sql`t.${sql.identifier(c)}`);
  const despues =
    cursor === null
      ? sql`true`
      : sql`(${sql.join(llave, sql`, `)}) > (${sql.join(
          cursor.map((v) => sql`${v}`),
          sql`, `,
        )})`;
  await tx.execute(sql`SELECT set_config('TimeZone', 'UTC', true)`);
  const rows = await tx.execute<Raw>(sql`
    SELECT ((to_jsonb(t) - ${arreglo(tabla.omitidas)}::text[]) || ${comoTexto(tabla.enteros)})::text AS fila,
           ARRAY[${sql.join(
             llave.map((k) => sql`${k}::text`),
             sql`, `,
           )}] AS cursor
      FROM ${t} t
     WHERE ${despues}
     ORDER BY ${sql.join(llave, sql`, `)}
     LIMIT ${lote}`);
  return [...rows];
}

/**
 * Every row of one table this tenant may read, each a JSON object's text, in
 * keyset batches of `lote` — each batch through `enTx`, so the portal gives
 * every batch a short transaction of its own (DB3-EXP-01).
 */
export async function* exportarTabla(
  enTx: EnTx,
  tabla: TablaDelNegocio,
  lote = LOTE_EXPORTACION,
): AsyncGenerator<readonly string[]> {
  let cursor: readonly string[] | null = null;
  for (;;) {
    const c: readonly string[] | null = cursor;
    const rows: readonly Raw[] = await enTx((tx) => leerLote(tx, tabla, c, lote));
    if (rows.length > 0) yield rows.map((r) => r.fila);
    const ultima: Raw | undefined = rows.at(-1);
    if (rows.length < lote || ultima === undefined) return;
    cursor = ultima.cursor;
  }
}
