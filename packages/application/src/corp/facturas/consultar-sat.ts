import type { EstadoSat } from '@xangarro/domain/corp';

import { FacturaDesconocidaError, FacturaNoPorVerificarError } from './errors.js';
import type { ConsultaSat, ReceivedInvoiceRepository } from './ports.js';

export interface ConsultarSatDeps {
  readonly facturas: ReceivedInvoiceRepository;
  readonly sat: ConsultaSat;
}

/**
 * «Consultar al SAT» (E-11, board CD-06g): asks the SAT again about a
 * registered invoice it did not answer for at upload. «vigente» and
 * «cancelado» are kept; no answer, or not found yet, leaves it unverified.
 * A cancelled one reverses nothing: the screen warns and a founder cancels
 * it (owner decision, 2026-10-31).
 */
export async function consultarSatFactura(
  deps: ConsultarSatDeps,
  input: { readonly uuid: string },
): Promise<EstadoSat> {
  const f = await deps.facturas.porUuid(input.uuid);
  if (f === null) throw new FacturaDesconocidaError(input.uuid);
  if (f.estado !== 'registrada' || f.estadoSat !== 'sin_verificar') {
    throw new FacturaNoPorVerificarError(input.uuid);
  }
  const estado = await deps.sat.estado(f.cfdi);
  if (estado === 'vigente' || estado === 'cancelado') {
    await deps.facturas.marcarEstadoSat(input.uuid, estado);
  }
  return estado;
}
