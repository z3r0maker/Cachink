/**
 * LWW upsert composer — builds a driver-agnostic `INSERT ... ON CONFLICT
 * DO UPDATE` statement that accepts the inbound row only if its
 * `updated_at` is strictly greater, or equal and its `device_id` is
 * lexicographically smaller (ADR-029 §Conflict resolution).
 *
 * Table and column names come from the wire-protocol allowlist
 * (`isSyncedTable` + the shape in `constants.ts`) so inline interpolation
 * is safe; bound parameters are only used for the actual row values.
 */

import { sql, type SQL } from 'drizzle-orm';

export function buildUpsertLww(table: string, row: Readonly<Record<string, unknown>>): SQL {
  const cols = Object.keys(row);
  if (cols.length === 0) {
    throw new Error('buildUpsertLww: cannot upsert an empty row');
  }
  const colList = cols.map((c) => `"${c}"`).join(', ');
  const setList = cols
    .filter((c) => c !== 'id')
    .map((c) => `"${c}" = excluded."${c}"`)
    .join(', ');
  const q = (s: string) => `"${s}"`;

  const valuesChunks = cols.flatMap((c, i) =>
    i === 0 ? [sql`${row[c]}`] : [sql`, `, sql`${row[c]}`],
  );

  const prefix = sql.raw(`INSERT INTO ${q(table)} (${colList}) VALUES (`);
  const suffix = sql.raw(
    `) ON CONFLICT(${q('id')}) DO UPDATE SET ${setList}
     WHERE excluded.${q('updated_at')} > ${q(table)}.${q('updated_at')}
        OR (excluded.${q('updated_at')} = ${q(table)}.${q('updated_at')}
            AND excluded.${q('device_id')} < ${q(table)}.${q('device_id')})`,
  );
  return sql.join([prefix, ...valuesChunks, suffix]);
}

/**
 * Runs the upsert and decides whether the row was accepted (inserted or
 * actually updated) based on the driver's `changes`/`rowsAffected`
 * surface. When the LWW `WHERE` rejects the row, SQLite reports 0 rows
 * affected and we classify the delta as "stale".
 */
export function rowsAffectedFrom(raw: unknown): number {
  if (!raw || typeof raw !== 'object') return 0;
  const r = raw as Record<string, unknown>;
  const candidates = [r['changes'], r['rowsAffected'], r['changed']];
  for (const c of candidates) {
    if (typeof c === 'number') return c;
  }
  return 0;
}
