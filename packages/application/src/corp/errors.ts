/** Typed errors of the corp ledger's use cases (E-02, CLAUDE.md §8). */

export class ConceptoRequeridoError extends Error {
  readonly code = 'CONCEPTO_REQUERIDO' as const;
  constructor() {
    super('Escribe el concepto del movimiento.');
    this.name = 'ConceptoRequeridoError';
  }
}

export class ProyectoDesconocidoError extends Error {
  readonly code = 'PROYECTO_DESCONOCIDO' as const;
  constructor(readonly projectId: string) {
    super(`No existe el proyecto «${projectId}».`);
    this.name = 'ProyectoDesconocidoError';
  }
}

export class MovimientoDesconocidoError extends Error {
  readonly code = 'MOVIMIENTO_DESCONOCIDO' as const;
  constructor(readonly entryId: string) {
    super('Ese movimiento no existe.');
    this.name = 'MovimientoDesconocidoError';
  }
}

export class TrimestreEnCursoError extends Error {
  readonly code = 'TRIMESTRE_EN_CURSO' as const;
  constructor(readonly trimestre: string) {
    super('El dinero de un trimestre se cierra cuando el trimestre termina.');
    this.name = 'TrimestreEnCursoError';
  }
}

export class LlamadaDesconocidaError extends Error {
  readonly code = 'LLAMADA_DESCONOCIDA' as const;
  constructor(readonly callId: string) {
    super('Ese fondeo no existe.');
    this.name = 'LlamadaDesconocidaError';
  }
}

export class VencimientoInvalidoError extends Error {
  readonly code = 'VENCIMIENTO_INVALIDO' as const;
  constructor(readonly vence: string) {
    super('Elige una fecha límite de hoy en adelante.');
    this.name = 'VencimientoInvalidoError';
  }
}

export class YaRevertidoError extends Error {
  readonly code = 'YA_REVERTIDO' as const;
  constructor(readonly entryId: string) {
    super('Ese movimiento ya se revirtió.');
    this.name = 'YaRevertidoError';
  }
}
