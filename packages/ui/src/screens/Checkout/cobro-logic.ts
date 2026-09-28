/**
 * The cobro's rules, pure (MvCobro, the web caja's `efectivo.tsx` and
 * `use-caja.ts`): the four ways a sale is paid and how they reach the domain,
 * the keypad, the round bills offered for cash, and what the confirm button
 * says. The amounts are `@xangarro/caja/caja` (`parseRecibido`, `cambio`).
 */
import { formatMoney, type Money, type PaymentMethod } from '@xangarro/domain';
import { cambio, parseRecibido } from '@xangarro/caja/caja';

/** The four ways a sale is paid (ADR-108: no QR/CoDi). */
export type MetodoCobro = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Fiado';

export const METODOS: readonly MetodoCobro[] = ['Efectivo', 'Tarjeta', 'Transferencia', 'Fiado'];

/** The screen says «Fiado»; the ticket stores the domain's «Crédito». */
export const metodoDominio = (m: MetodoCobro): PaymentMethod => (m === 'Fiado' ? 'Crédito' : m);

/** The methods this business takes, in the boards' order; Fiado is always there. */
export function metodosDisponibles(habilitados: readonly PaymentMethod[]): readonly MetodoCobro[] {
  return METODOS.filter((m) => m === 'Fiado' || habilitados.includes(m));
}

export type Tecla = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | '0' | 'borrar';

export const TECLAS: readonly Tecla[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '.',
  '0',
  'borrar',
];

/** One key on «¿Con cuánto paga?»: two decimals at most, seven digits at most. */
export function teclear(actual: string, k: Tecla): string {
  if (k === 'borrar') return actual.slice(0, -1);
  if (k === '.') return actual.includes('.') ? actual : `${actual === '' ? '0' : actual}.`;
  const [, dec] = actual.split('.');
  if (dec !== undefined && dec.length >= 2) return actual;
  if (actual.replace('.', '').length >= 7) return actual;
  return actual === '0' ? k : actual + k;
}

/** «Exacto» and the round bills at or above the total, four at most (web `quickAmounts`). */
export function billetes(total: Money): readonly Money[] {
  const todos = [total, 100_00n, 200_00n, 500_00n, 1000_00n];
  return todos.filter((v, i) => todos.indexOf(v) === i && v >= total).slice(0, 4);
}

/** Whole pesos type as «200», not «200.00». */
export const comoTecleado = (v: Money): string =>
  v % 100n === 0n ? String(v / 100n) : `${v / 100n}.${String(v % 100n).padStart(2, '0')}`;

export interface EstadoEfectivo {
  readonly recibido: Money | null;
  /** Positive: change to give. Negative: still missing. Null: nothing typed. */
  readonly diferencia: Money | null;
  readonly alcanza: boolean;
}

export function estadoEfectivo(tecleado: string, total: Money): EstadoEfectivo {
  const recibido =
    tecleado === ''
      ? null
      : parseRecibido(tecleado.endsWith('.') ? tecleado.slice(0, -1) : tecleado);
  const diferencia = cambio(recibido, total);
  return { recibido, diferencia, alcanza: diferencia !== null && diferencia >= 0n && total > 0n };
}

/** The confirm button's words for each method and amount (MvCobro). */
export function etiquetaCobrar(metodo: MetodoCobro, total: Money, e: EstadoEfectivo): string {
  const monto = formatMoney(total);
  if (metodo !== 'Efectivo') return `Cobrar ${monto}`;
  if (e.diferencia === null) return `Falta ${monto}`;
  if (e.diferencia < 0n) return `Falta ${formatMoney(-e.diferencia)}`;
  return e.diferencia === 0n ? `Cobrar ${monto}` : `Cobrar y dar ${formatMoney(e.diferencia)}`;
}

/** «V-0413»: the folio as the caja writes it (web `use-ventas.ts`). */
export const folioTexto = (folio: number): string => `V-${String(folio).padStart(4, '0')}`;
