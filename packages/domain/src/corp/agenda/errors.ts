/** Typed errors of the Agenda (E-04, CLAUDE.md §8). */

export class FechaInvalidaError extends Error {
  readonly code = 'FECHA_INVALIDA' as const;
  constructor(readonly valor: string) {
    super(`«${valor}» no es una fecha.`);
    this.name = 'FechaInvalidaError';
  }
}

export class EvidenciaFaltanteError extends Error {
  readonly code = 'EVIDENCIA_FALTANTE' as const;
  constructor(readonly falta: string) {
    super(`Para marcarla así, adjunta ${falta}.`);
    this.name = 'EvidenciaFaltanteError';
  }
}

export class TransicionInvalidaError extends Error {
  readonly code = 'TRANSICION_INVALIDA' as const;
  constructor(
    readonly desde: string,
    readonly hacia: string,
  ) {
    super(`Una obligación ${desde} no puede pasar a ${hacia}.`);
    this.name = 'TransicionInvalidaError';
  }
}

export class ObligacionDesconocidaError extends Error {
  readonly code = 'OBLIGACION_DESCONOCIDA' as const;
  constructor(readonly clave: string) {
    super('Esa obligación no existe.');
    this.name = 'ObligacionDesconocidaError';
  }
}

export class ArchivoInvalidoError extends Error {
  readonly code = 'ARCHIVO_INVALIDO' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ArchivoInvalidoError';
  }
}

export class ObligacionExentaError extends Error {
  readonly code = 'OBLIGACION_EXENTA' as const;
  constructor(readonly plantillaId: string) {
    super('Esa obligación no aplica a MEXIA, así que no lleva fechas.');
    this.name = 'ObligacionExentaError';
  }
}
