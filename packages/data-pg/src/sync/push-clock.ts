/**
 * A pushed row's own clock, held to the server's (security audit 2026-11,
 * F-05 a).
 *
 * A device writes its rows' `createdAt` / `updatedAt` / `deletedAt`, and an
 * upsert lets the newest `updated_at` win. So a device whose clock said «year
 * 2099» — broken, or on purpose — held its row against every later edit, from
 * any device, for good; and a `created_at` in a future month moved the row out
 * of the month it is counted in.
 *
 * A timestamp later than the server's time plus {@link MAX_CLOCK_SKEW_MS} is
 * therefore stored **as the server's time**. The row is never refused: a phone
 * with a wrong clock must still sync (CLAUDE.md §2.2). Within the skew a
 * device is believed, as before; the past is never touched — a week offline is
 * honest.
 *
 * Only the three audit clocks. A row's business dates (`fecha`, a turno's
 * hours) are what the shopkeeper recorded, not what orders writes.
 */
type Row = Record<string, unknown>;

/** How far ahead of the server a device's clock may run and still be believed. */
export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

const CLOCK_FIELDS = ['createdAt', 'updatedAt', 'deletedAt'] as const;

/** The latest instant a row's clock may claim when the server's reads `now`, ISO-8601. */
export const futureLimit = (now: Date): string =>
  new Date(now.getTime() + MAX_CLOCK_SKEW_MS).toISOString();

/**
 * `row` with every audit clock past the limit set to `now`; the same object
 * when none is. A value that is not a timestamp is left for the database to
 * refuse, as it always was.
 */
export function clampRowClock<R extends Row>(row: R, now: Date): R {
  const limit = now.getTime() + MAX_CLOCK_SKEW_MS;
  const ahead = CLOCK_FIELDS.filter((field) => {
    const value = row[field];
    return typeof value === 'string' && Date.parse(value) > limit;
  });
  if (ahead.length === 0) return row;
  const serverTime = now.toISOString();
  return { ...row, ...Object.fromEntries(ahead.map((field) => [field, serverTime])) };
}
