import { enPalabras } from '../inicio/copy';

/**
 * Sentences that Inicio, Turno and Detalle de cliente build from counts and dates.
 * The design writes them in `Operador Inicio`, `Operador Turno` and
 * `Operador Detalle de cliente`; one copy lives here.
 */

/**
 * Hint under the first KPI: «Ninguna cancelada», «Una cancelada a las 12:58»,
 * «Dos canceladas, la última a las 13:40». The file spells the plural in
 * lowercase («dos canceladas»); it opens a hint, so it is capitalised like every
 * other hint (plan §4b).
 */
export function hintCanceladas(n: number, ultima: string | null): string {
  if (n === 0 || !ultima) return 'Ninguna cancelada';
  if (n === 1) return `Una cancelada a las ${ultima}`;
  return `${enPalabras(n)} canceladas, la última a las ${ultima}`;
}

/** Hint under Turno's «Gastos»: how many expenses carry a receipt. */
export function hintComprobantes(n: number): string {
  if (n === 0) return 'Ninguno lleva comprobante';
  if (n === 1) return 'Un comprobante';
  return `${enPalabras(n)} con comprobante`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
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

/** Days from `hoy` to `fecha`, both `YYYY-MM-DD`. */
export function diasEntre(hoy: string, fecha: string): number {
  const ms = Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/** `fecha` (`YYYY-MM-DD`) moved by `dias`. */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * A due date said the way the design says it: today and tomorrow in words,
 * within the week by weekday, further out by date. Past dues are the caller's.
 */
export function textoVence(hoy: string, fecha: string): string {
  const dif = diasEntre(hoy, fecha);
  if (dif <= 0) return 'Vence hoy';
  if (dif === 1) return 'Vence mañana';
  const d = new Date(`${fecha}T00:00:00Z`);
  if (dif <= 6) return `Vence el ${DIAS[d.getUTCDay()] ?? ''}`;
  return `Vence el ${d.getUTCDate()} de ${MESES[d.getUTCMonth()] ?? ''}`;
}
