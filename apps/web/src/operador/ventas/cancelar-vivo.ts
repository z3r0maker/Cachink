'use client';

/**
 * Cancelling a sale on a linked register (O-32): through the Worker's
 * `CancelarTicketUseCase`, NIP and permission included, then the queue carries
 * it up. Operador · Ventas and Cobrar's «Deshacer» both cancel here, so a
 * cancel reads and behaves the same from either.
 */

import { formatMoney } from '@xangarro/domain';

import type { VentaTurno } from '@xangarro/caja/ventas';
import { desencolar } from '../shell/cola';
import { registerRuntime } from '../runtime/client';
import type { Credenciales } from '../runtime/use-credenciales';

/**
 * The Worker hands an error over as text, its class names first («Error:
 * TypeError: PIN incorrecto»): the dialog shows the sentence alone.
 */
export function sinClase(e: unknown): string {
  return (e instanceof Error ? e.message : String(e)).replace(/^(?:\w*Error: )+/, '');
}

/** The reason as the log keeps it: the chosen one, and the owner's note after it. */
export const motivoCompleto = (motivo: string, nota: string): string =>
  nota.trim() === '' ? motivo : `${motivo}: ${nota.trim()}`;

/** Cancel through the use case; the confirmation sentence is ours to build. */
export async function cancelarEnVivo(
  cred: Credenciales,
  venta: VentaTurno,
  nip: string,
  motivo: string,
): Promise<string> {
  const { device, sesion } = cred;
  if (device === null || sesion === null || venta.id === undefined) throw new Error('sin sesión');
  const r = await registerRuntime().cancelar({
    businessId: device.businessId,
    deviceId: device.deviceId,
    userId: sesion.userId,
    ticketId: venta.id,
    pin: nip,
    motivo,
  });
  const devuelve =
    r.cashToReturnCentavos === null
      ? ''
      : ` Devuelve ${formatMoney(BigInt(r.cashToReturnCentavos))}.`;
  return `${venta.folio} cancelada · ${motivo}.${devuelve}`;
}

/** The sentence to show once cancelled, or the dialog's error; queued up when online. */
export async function cancelarVinculada(
  cred: Credenciales,
  venta: VentaTurno,
  campos: { readonly motivo: string; readonly nip: string; readonly nota: string },
): Promise<{ readonly aviso: string } | { readonly error: string }> {
  try {
    const motivo = motivoCompleto(campos.motivo, campos.nota);
    const aviso = await cancelarEnVivo(cred, venta, campos.nip, motivo);
    if (navigator.onLine) void desencolar();
    return { aviso };
  } catch (e: unknown) {
    return { error: `No se pudo cancelar: ${sinClase(e)}` };
  }
}
