const DAY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * A `YYYY-MM-DD` day in CDMX time — the same calendar `xangarro.geo_record`
 * stamps rows with, so a range filter here lines up with what was written.
 *
 * Parts are looked up by type, never by position: the order of an
 * `Intl.DateTimeFormat` part list is a locale's business, not ours.
 */
export function mexicoDay(at: Date, minusDays = 0): string {
  const parts = DAY_FORMAT.formatToParts(new Date(at.getTime() - minusDays * 86_400_000));
  const of = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${of('year')}-${of('month')}-${of('day')}`;
}
