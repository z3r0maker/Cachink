import { formatMoney, type Money } from '@xangarro/domain';

import type { VentaDetalle } from './types';

/** The file's sentences, which change with the method (fiado or not) and the state. */
export function cancelHint(v: VentaDetalle, cancelada: boolean): string {
  if (cancelada)
    return 'Ya está cancelada. Queda visible en tu turno y en el corte, con tu nombre.';
  return v.fiado
    ? 'Puedes cancelarla porque es de tu turno abierto. Si ya tenía abonos, el dinero abonado queda como saldo a favor del cliente.'
    : 'Solo puedes cancelar ventas de tu turno abierto, y siempre con un motivo.';
}

export function cancelIntro(v: VentaDetalle, total: Money): string {
  return v.fiado
    ? `Esta venta es fiada. Al cancelarla, el saldo de ${v.fiado.cliente} baja ${formatMoney(total)}.`
    : 'La venta no se borra: queda marcada como cancelada, con tu nombre y el motivo.';
}

/** The fiado warning explains the «saldo a favor» (README §6). */
export function cancelAviso(v: VentaDetalle): string {
  return v.fiado
    ? 'Si el cliente ya abonó contra esta venta, ese dinero no sale de la caja: queda como saldo a favor suyo y se aplica solo a su siguiente compra. Pedro lo ve marcado en su portal.'
    : 'Si fue en efectivo, el monto sale de lo esperado en tu caja al cerrar el turno.';
}

export const fiadoDetalle = (saldo: Money) =>
  `Se sumó a su saldo, que quedó en ${formatMoney(saldo)}. No entró efectivo a la caja.`;
