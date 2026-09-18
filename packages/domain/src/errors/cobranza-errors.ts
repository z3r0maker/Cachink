/**
 * Typed errors for receivables (ADR-074).
 */

export class AbonoInvalidoError extends Error {
  readonly code = 'ABONO_INVALIDO' as const;

  constructor() {
    super('El abono debe ser mayor a cero.');
    this.name = 'AbonoInvalidoError';
  }
}
