import { formatMoney, type DiferenciaCorte } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

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
    hint: 'Hay menos efectivo del esperado. Cuenta otra vez antes de explicar la diferencia.',
  },
  sobra: {
    label: 'Sobra',
    bg: colors.blueSoft,
    color: colors.blueText,
    hint: 'Hay más efectivo del esperado. Suele ser una venta no registrada o un cambio mal dado.',
  },
} as const;

export function cerrarHint(pendientes: number, faltaNota: boolean): string {
  if (pendientes > 0) return `Primero se tienen que enviar los ${pendientes} registros pendientes.`;
  if (faltaNota) return 'Elige un motivo y escribe la nota para poder cerrar.';
  return 'Al cerrar se guarda el conteo con tu nombre y ya no puedes capturar en esta caja.';
}

export function lineaCerrado(d: DiferenciaCorte, motivo: string | null, dueno: string): string {
  if (d.tipo === 'cuadra')
    return `El conteo cuadró con lo esperado. ${dueno} ya lo tiene en su portal.`;
  const que = d.tipo === 'falta' ? 'faltante' : 'sobrante';
  return `Quedó un ${que} explicado como «${motivo ?? ''}».`;
}

/** «−$70.00», «+$910.00», «$0.00». */
export function conSigno(d: DiferenciaCorte): string {
  if (d.tipo === 'cuadra') return formatMoney(d.monto);
  return `${d.tipo === 'falta' ? '−' : '+'}${formatMoney(d.monto)}`;
}
