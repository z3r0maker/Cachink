import { sql, type SQL, type SQLWrapper } from 'drizzle-orm';

import { parseIsoDate, sumarDias } from '@xangarro/domain';

/**
 * Day ranges over `fecha` that an index can serve (audit DB2-QRY-04).
 *
 * `fecha` is text on both sides of the wire: a calendar day (`2026-05-31`) or,
 * from older rows, a timestamp (`2026-05-31T18:02:00Z`). Filtering with
 * `left(fecha, 10) BETWEEN from AND to` handled both, but no index can serve a
 * function of the column, so a one-month statement read the tenant's whole
 * history (280 ms against 48 ms a month on the audit's whale, and growing).
 *
 * `fecha >= from AND fecha < dayAfter(to)` is the same set: a string is below a
 * ten-character date exactly when its first ten characters are, so a
 * timestamped fecha on `to` stays in and one on `dayAfter(to)` stays out — and
 * the comparison is on the bare column, which `(business_id, fecha)` serves.
 */
const DIA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The exclusive upper bound for a range ending on `hasta`, or `null` when
 * there is none to write: the day after 9999-12-31 is not a ten-character
 * date, and «open to the end of time» is what a caller passing it means.
 */
export function diaSiguiente(hasta: string): string | null {
  const siguiente = sumarDias(parseIsoDate(hasta), 1);
  return DIA.test(siguiente) ? siguiente : null;
}

/**
 * `col` falls on a day in [desde, hasta], both included. Either side may be
 * omitted for a range open on that side. Throws a `TypeError` for anything
 * that is not a `YYYY-MM-DD` date — a malformed bound is a caller's bug, and
 * silently widening the range would hide it.
 */
export function fechaEnDias(col: SQLWrapper, desde?: string | null, hasta?: string | null): SQL {
  const partes: SQL[] = [];
  if (desde !== undefined && desde !== null) partes.push(sql`${col} >= ${parseIsoDate(desde)}`);
  const fin = hasta === undefined || hasta === null ? null : diaSiguiente(hasta);
  if (fin !== null) partes.push(sql`${col} < ${fin}`);
  return partes.length === 0 ? sql`true` : sql.join(partes, sql` AND `);
}
