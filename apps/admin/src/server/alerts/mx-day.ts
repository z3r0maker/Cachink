/**
 * America/Mexico_City calendar days (N-10). Mexico abolished DST in 2022, so
 * the offset is UTC-6 today — but it is read from the tz database, not
 * hard-coded, so a future change to the law is a Node upgrade, not a bug.
 */
export const MX_TZ = 'America/Mexico_City';

const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: MX_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Mexico City wall-clock minus UTC at `at`, in ms (e.g. -6 h). */
function offsetMs(at: Date): number {
  const p = Object.fromEntries(parts.formatToParts(at).map((x) => [x.type, Number(x.value)]));
  const wall = Date.UTC(p.year ?? 0, (p.month ?? 1) - 1, p.day ?? 1, p.hour, p.minute, p.second);
  return wall - (at.getTime() - at.getUTCMilliseconds());
}

/** The UTC instant at which `at`'s Mexico City calendar day began. */
export function mxDayStart(at: Date): Date {
  const wall = new Date(at.getTime() + offsetMs(at));
  const midnight = Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate());
  return new Date(midnight - offsetMs(new Date(midnight)));
}

/**
 * What a digest sent at `now` covers: the whole previous Mexico City day,
 * `[start, end)`. Consecutive daily runs tile time with no gap and no overlap.
 */
export function digestWindow(now: Date): { readonly start: Date; readonly end: Date } {
  const end = mxDayStart(now);
  return { start: mxDayStart(new Date(end.getTime() - 1)), end };
}

const dayLabel = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: MX_TZ });

/** e.g. «16 sept 2026» — the Mexico City date of `at`. */
export function mxDayLabel(at: Date): string {
  return dayLabel.format(at);
}
