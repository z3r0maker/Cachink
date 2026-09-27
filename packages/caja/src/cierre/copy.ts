import { formatMoney, type DiferenciaCorte } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { mayuscula } from '../comun/dueno';

/** Every sentence of the close that changes with the difference or the queue. */
export const DIF = {
  cuadra: {
    label: 'Cuadra',
    bg: colors.greenSoft,
    color: colors.greenText,
    hint: 'Lo contado coincide con lo esperado. Puedes cerrar.',
  },
  falta: {
    label: 'Falta',
    bg: colors.redSoft,
    color: colors.redText,
    hint: 'Cuenta otra vez antes de explicar. Pasa seguido.',
  },
  sobra: {
    label: 'Sobra',
    bg: colors.blueSoft,
    color: colors.blueText,
    hint: 'Hay más efectivo del esperado. Suele ser una venta no registrada o un cambio mal dado.',
  },
} as const;

/** While records wait, a shortfall is not final: the expected cash can still move. */
export const FALTA_PENDIENTE =
  'Hay menos efectivo del esperado. Cuenta otra vez antes de explicar. Cuando se envíen los registros, la diferencia se vuelve a calcular.';

/** «Cerrar turno», or with the difference in the button itself. */
export function cerrarLabel(d: DiferenciaCorte): string {
  if (d.tipo === 'cuadra') return 'Cerrar turno';
  const que = d.tipo === 'falta' ? 'faltante' : 'sobrante';
  return `Cerrar turno con ${que} de ${formatMoney(d.monto)}`;
}

export function cerrarHint(faltaMotivo: boolean, faltaNota: boolean): string {
  if (faltaMotivo) return 'Elige un motivo para poder cerrar.';
  if (faltaNota) return 'Escribe la nota para poder cerrar.';
  return 'Al cerrar se guarda el conteo con tu nombre y ya no puedes capturar en esta caja.';
}

/** The band's second line, and what a failed retry says. */
export const BANDA_CUERPO =
  'Para cerrar, primero se tienen que enviar: el efectivo esperado se calcula con ellos.';
export const BANDA_SIN_RED = 'Todavía no hay internet. Lo volvemos a intentar solos en un momento.';

export function lineaCerrado(d: DiferenciaCorte, motivo: string | null, dueno: string): string {
  if (d.tipo === 'cuadra')
    return `El conteo cuadró con lo esperado. ${mayuscula(dueno)} ya lo tiene en su portal.`;
  const que = d.tipo === 'falta' ? 'faltante' : 'sobrante';
  return `Quedó un ${que} explicado como «${motivo ?? ''}».`;
}

/** «−$70.00», «+$910.00», «$0.00». */
export function conSigno(d: DiferenciaCorte): string {
  if (d.tipo === 'cuadra') return formatMoney(d.monto);
  return `${d.tipo === 'falta' ? '−' : '+'}${formatMoney(d.monto)}`;
}
