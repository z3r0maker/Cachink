/** Typed errors of received invoices (E-11, CLAUDE.md §8). */

export class RfcMexiaPendienteError extends Error {
  readonly code = 'RFC_MEXIA_PENDIENTE' as const;
  constructor() {
    super('Registra el RFC de MEXIA en Corporativo para revisar a nombre de quién vienen.');
    this.name = 'RfcMexiaPendienteError';
  }
}

export class SinArchivosError extends Error {
  readonly code = 'SIN_ARCHIVOS' as const;
  constructor(readonly maximo: number) {
    super(`Elige de 1 a ${maximo} archivos XML.`);
    this.name = 'SinArchivosError';
  }
}

export class FacturaDesconocidaError extends Error {
  readonly code = 'FACTURA_DESCONOCIDA' as const;
  constructor(readonly uuid: string) {
    super('Esa factura no está entre las recibidas.');
    this.name = 'FacturaDesconocidaError';
  }
}

export class FacturaNoPendienteError extends Error {
  readonly code = 'FACTURA_NO_PENDIENTE' as const;
  constructor(readonly uuid: string) {
    super('Esa factura ya no está por revisar.');
    this.name = 'FacturaNoPendienteError';
  }
}

export class FacturaNoPorPagarError extends Error {
  readonly code = 'FACTURA_NO_POR_PAGAR' as const;
  constructor(readonly uuid: string) {
    super('Esa factura no está por pagar.');
    this.name = 'FacturaNoPorPagarError';
  }
}
