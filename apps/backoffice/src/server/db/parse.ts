/**
 * Values read back from raw `sql` queries, parsed rather than asserted
 * (CLAUDE.md §2.8): the driver may hand a timestamp over as a `Date` or as
 * text depending on how the connection was built.
 */
export function toDate(value: unknown): Date {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new TypeError(`not a timestamp: ${String(value)}`);
  return date;
}

export function toDateOrNull(value: unknown): Date | null {
  return value === null || value === undefined ? null : toDate(value);
}

export function toText(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('expected text');
  return value;
}
