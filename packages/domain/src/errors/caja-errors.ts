/**
 * Typed errors for the Caja gate flow.
 *
 * Thrown when a sale is attempted without an open CajaTurno.
 */

export class CajaNoAbiertaError extends Error {
  readonly code = 'CAJA_NO_ABIERTA' as const;

  constructor() {
    super('No hay un turno de caja abierto. Abre la caja para registrar ventas.');
    this.name = 'CajaNoAbiertaError';
  }
}
