import { ZONA_NEGOCIO } from '../dates/periodo.js';

/**
 * A timestamp as the business reads it: «12 may 2026, 13:05», in Mexico
 * City's clock — the portal's server runs in UTC, and a sync at 21:00 must not
 * read as tomorrow's. An unparseable value renders as «—», never «Invalid Date».
 */
const FMT = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_NEGOCIO,
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Fixed abbreviations: ICU's differ between Node versions («sep» / «sept»). */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatFechaHora(iso: string | null | undefined): string {
  const t = iso ? Date.parse(iso) : Number.NaN;
  if (Number.isNaN(t)) return '—';
  const parts = Object.fromEntries(FMT.formatToParts(t).map((p) => [p.type, p.value]));
  const mes = MESES[Number(parts.month) - 1] ?? '';
  return `${parts.day} ${mes} ${parts.year}, ${parts.hour}:${parts.minute}`;
}
