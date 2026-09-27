import { ZONA_NEGOCIO } from '@xangarro/domain';

/**
 * Dates the way the owner reads them in Mi negocio: «31 de octubre de 2026»,
 * and «12 de mayo de 2026, 09:00» when the hour matters, on the business's
 * clock (the server runs in UTC). An unparseable value says so in words.
 */
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

const FMT = new Intl.DateTimeFormat('es-MX', {
  timeZone: ZONA_NEGOCIO,
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function partes(iso: string | null | undefined): Record<string, string> | null {
  const t = iso ? Date.parse(iso) : Number.NaN;
  if (Number.isNaN(t)) return null;
  return Object.fromEntries(FMT.formatToParts(t).map((p) => [p.type, p.value]));
}

export const SIN_FECHA = 'sin fecha';

export function fechaLarga(iso: string | null | undefined): string {
  const p = partes(iso);
  if (p === null) return SIN_FECHA;
  return `${p.day} de ${MESES[Number(p.month) - 1] ?? ''} de ${p.year}`;
}

export function fechaHoraLarga(iso: string | null | undefined): string {
  const p = partes(iso);
  if (p === null) return SIN_FECHA;
  const hora = p.hour === '24' ? '00' : p.hour;
  return `${fechaLarga(iso)}, ${hora}:${p.minute}`;
}

/** «septiembre de 2026», for the concept of a monthly payment. */
export function mesLargo(iso: string | null | undefined): string {
  const p = partes(iso);
  if (p === null) return SIN_FECHA;
  return `${MESES[Number(p.month) - 1] ?? ''} de ${p.year}`;
}
