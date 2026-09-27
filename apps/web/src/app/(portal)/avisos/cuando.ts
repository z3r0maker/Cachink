/**
 * «14 de mayo de 2026, 10:12», in Mexico City's clock (the server runs in UTC).
 * Month names are fixed: ICU's differ between Node versions.
 */
const FMT = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function cuando(iso: string | null | undefined): string {
  const t = iso ? Date.parse(iso) : Number.NaN;
  if (Number.isNaN(t)) return '';
  const p = Object.fromEntries(FMT.formatToParts(t).map((x) => [x.type, x.value]));
  const mes = MESES[Number(p.month) - 1] ?? '';
  return `${p.day} de ${mes} de ${p.year}, ${p.hour}:${p.minute}`;
}
