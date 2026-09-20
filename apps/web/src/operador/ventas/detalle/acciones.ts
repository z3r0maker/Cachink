'use client';

/**
 * Detalle de venta's writes and shares (O-34): the linked register's cancel
 * — the same door Ventas uses — and the comprobante the share dialog takes.
 */

import { registerRuntime } from '../../runtime/client';
import { readDevice } from '../../runtime/device-store';
import { readSesion } from '../../runtime/session-store';
import { desencolar } from '../../shell/cola';
import type { DetalleData, VentaDetalle } from './types';

/** The linked register's cancel write — same use case, PIN and all. */
export async function cancelarEnVivo(ticketId: string, motivo: string, nip: string): Promise<void> {
  const device = readDevice();
  const sesion = readSesion();
  if (device === null || sesion === null) return;
  await registerRuntime().cancelar({
    businessId: device.businessId,
    deviceId: device.deviceId,
    userId: sesion.userId,
    ticketId,
    pin: nip,
    motivo,
  });
  if (navigator.onLine) await desencolar();
}

export function comprobante(data: DetalleData, v: VentaDetalle, total: bigint) {
  const cambio = v.recibido === undefined ? null : v.recibido - total;
  return {
    negocio: data.negocio,
    folio: v.folio,
    venta: { lines: v.lineas, total, metodo: v.metodo, cambio, nota: '' },
  };
}
