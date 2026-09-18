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

/** A cash count or an expected-cash input that cannot be true (negative, fractional). */
export class CorteInvalidoError extends Error {
  readonly code = 'CORTE_INVALIDO' as const;

  constructor(detalle: string) {
    super(`El corte no es válido: ${detalle}.`);
    this.name = 'CorteInvalidoError';
  }
}
