/**
 * The closed turno in words (OpCierre's «¡Turno cerrado!», MvCierreHecho):
 * the title, the chip and the corte as one line of text to send the owner.
 * Pure; the web's `hecho.tsx` and the phone say the same thing.
 */

import { formatMoney, type DiferenciaCorte, type Money } from '@xangarro/domain';

import { conSigno } from './copy';

/** The chip beside Don. */
export const CHIP_HECHO: Readonly<Record<DiferenciaCorte['tipo'], string>> = {
  cuadra: 'Cuadró',
  falta: 'Faltante',
  sobra: 'Sobrante',
};

/** «¡Turno cerrado!» / «Cuadró al centavo.», or the difference in the second line. */
export function tituloHecho(d: DiferenciaCorte): readonly [string, string] {
  if (d.tipo === 'cuadra') return ['¡Turno cerrado!', 'Cuadró al centavo.'];
  const que = d.tipo === 'falta' ? 'faltante' : 'sobrante';
  return ['Turno cerrado', `Con un ${que} de ${formatMoney(d.monto)}.`];
}

/** «14 may», the day the turno closed. */
export function fechaCorta(d: Date = new Date()): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}

/** «Corte Caja 1, Ana Robledo, 14 may: contado $2,710.00, esperado $2,710.00, cuadró.» */
export function textoCorte(p: {
  readonly caja: string;
  readonly operador: string;
  readonly fecha: string;
  readonly contado: Money;
  readonly esperado: Money;
  readonly dif: DiferenciaCorte;
}): string {
  const dif = p.dif.tipo === 'cuadra' ? 'cuadró' : `diferencia ${conSigno(p.dif)}`;
  return `Corte ${p.caja}, ${p.operador}, ${p.fecha}: contado ${formatMoney(p.contado)}, esperado ${formatMoney(p.esperado)}, ${dif}.`;
}
