/** Typed errors of Impuestos (E-13, CLAUDE.md §8). */
export class ImpuestosInvalidosError extends Error {
  readonly code = 'IMPUESTOS_INVALIDOS' as const;
  constructor(detalle: string) {
    super(`No se pueden estimar los impuestos: ${detalle}.`);
    this.name = 'ImpuestosInvalidosError';
  }
}

export class DeclaracionInvalidaError extends Error {
  readonly code = 'DECLARACION_INVALIDA' as const;
  constructor(detalle: string) {
    super(`Declaración inválida: ${detalle}.`);
    this.name = 'DeclaracionInvalidaError';
  }
}
