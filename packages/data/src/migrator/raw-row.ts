/**
 * Row shape returned by `db.all(sql.raw(...))` — varies by driver.
 * `better-sqlite3` gives named objects; `sqlite-proxy` gives column-value
 * arrays. Raw queries in the migrator select a single column, so the array
 * form is read at index 0.
 */
export type RawRow = Readonly<Record<string, unknown>> | readonly unknown[];

/** Read a single string column from a raw row, or null when absent. */
export function readStringColumn(row: RawRow, column: string): string | null {
  if (Array.isArray(row)) {
    return typeof row[0] === 'string' ? row[0] : null;
  }
  const value = (row as Readonly<Record<string, unknown>>)[column];
  return typeof value === 'string' ? value : null;
}
