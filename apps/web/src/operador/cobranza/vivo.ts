'use client';

/**
 * The linked register's credit accounts (O-33): the Worker's accounts (said
 * as the screen's `CuentaCliente` by `comoCuenta`, in `@xangarro/caja`), the
 * today label, and the abono write through the real use case — shared by
 * Cobranza and Detalle de cliente.
 */

import { registerRuntime } from '../runtime/client';
import { desencolar } from '../shell/cola';
import type { Credenciales } from '../runtime/use-credenciales';
import type { CuentaPara } from '../runtime/protocol';
import type { MetodoAbono } from '@xangarro/caja/cobranza';

export { hoyLocal } from '@xangarro/caja';
export { comoCuenta } from '@xangarro/caja/cobranza';

/** Read the business's accounts from the register's own database. */
export async function leerCuentas(cred: Credenciales): Promise<readonly CuentaPara[]> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  return registerRuntime().cuentas(device.businessId, device.deviceId);
}

/** Record an abono through the use case; the queue carries it up (O-33). */
export async function abonarEnVivo(
  cred: Credenciales,
  clienteId: string,
  metodo: MetodoAbono,
  monto: bigint,
  hoy: string,
): Promise<void> {
  const { device } = cred;
  if (device === null) throw new Error('sin sesión');
  await registerRuntime().abonar({
    businessId: device.businessId,
    deviceId: device.deviceId,
    clienteId,
    montoCentavos: monto,
    metodo,
    fecha: hoy,
  });
  if (navigator.onLine) await desencolar();
}
