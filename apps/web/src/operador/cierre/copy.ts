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
    hint: 'Cuenta otra vez antes de explicar. Pasa seguido.',
  },
  sobra: {
    label: 'Sobra',
    bg: colors.blueSoft,
    color: colors.blueText,
    hint: 'Hay más efectivo del esperado. Suele ser una venta no registrada o un cambio mal dado.',
  },
} as const;

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

/**
 * The band while records wait (DS-06 option (a), ADR-121): the close stays
 * open — the expected cash comes from this caja's own rows, all of them here —
 * and the queue goes up by itself when the connection comes back.
 */
export function bandaTitulo(porEnviar: number, reintentando: number): string {
  const n = porEnviar === 1 ? '1 registro' : `${porEnviar} registros`;
  if (reintentando === 0) return `Tienes ${n} por enviar.`;
  const m = reintentando === 1 ? '1 se reintentará solo' : `${reintentando} se reintentarán solos`;
  return `Tienes ${n} por enviar (${m}).`;
}
export const BANDA_CUERPO = 'Puedes cerrar; se enviarán cuando vuelva la conexión.';
export const BANDA_SIN_RED = 'Todavía no hay internet. Lo volvemos a intentar solos en un momento.';

/** The closed line; with records still to send the owner sees the close once they go up. */
export function lineaCerrado(
  d: DiferenciaCorte,
  motivo: string | null,
  dueno: string,
  porEnviar = 0,
): string {
  if (d.tipo === 'cuadra')
    return porEnviar > 0
      ? `El conteo cuadró con lo esperado. ${dueno} lo verá en su portal cuando se envíen los registros.`
      : `El conteo cuadró con lo esperado. ${dueno} ya lo tiene en su portal.`;
  const que = d.tipo === 'falta' ? 'faltante' : 'sobrante';
  return `Quedó un ${que} explicado como «${motivo ?? ''}».`;
}

/** «−$70.00», «+$910.00», «$0.00». */
export function conSigno(d: DiferenciaCorte): string {
  if (d.tipo === 'cuadra') return formatMoney(d.monto);
  return `${d.tipo === 'falta' ? '−' : '+'}${formatMoney(d.monto)}`;
}
