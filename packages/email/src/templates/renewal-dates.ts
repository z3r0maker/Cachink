/**
 * Dates as the billing emails write them, on Mexico City's calendar:
 * «31 de octubre», «31 oct al 30 nov de 2026», «31 oct 2026 al 30 oct 2027».
 */
import type { BillingInterval } from '@xangarro/application/billing';

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
] as const;
const CORTO = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

const PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

interface Dia {
  readonly y: number;
  /** 0–11. */
  readonly m: number;
  readonly d: number;
}

function dia(iso: string): Dia {
  const [y, m, d] = PARTS.format(new Date(iso)).split('-').map(Number);
  return { y: y ?? 0, m: (m ?? 1) - 1, d: d ?? 1 };
}

/** «31 de octubre». */
export function diaMes(iso: string): string {
  const x = dia(iso);
  return `${x.d} de ${MESES[x.m]}`;
}

/** The day before the next charge: one month (or year) on, clamped to the month's length. */
function finDelPeriodo(desde: Dia, interval: BillingInterval): Dia {
  const meses = desde.m + (interval === 'month' ? 1 : 12);
  const y = desde.y + Math.floor(meses / 12);
  const m = meses % 12;
  const largo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const siguiente = new Date(Date.UTC(y, m, Math.min(desde.d, largo)));
  siguiente.setUTCDate(siguiente.getUTCDate() - 1);
  return { y: siguiente.getUTCFullYear(), m: siguiente.getUTCMonth(), d: siguiente.getUTCDate() };
}

/** The period a renewal on `chargeAt` pays for. */
export function periodoRenovado(chargeAt: string, interval: BillingInterval): string {
  const a = dia(chargeAt);
  const b = finDelPeriodo(a, interval);
  const corto = (x: Dia) => `${x.d} ${CORTO[x.m]}`;
  return a.y === b.y
    ? `${corto(a)} al ${corto(b)} de ${b.y}`
    : `${corto(a)} ${a.y} al ${corto(b)} ${b.y}`;
}
