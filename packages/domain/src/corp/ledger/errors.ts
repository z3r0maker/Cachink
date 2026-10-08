/**
 * Typed errors of MEXIA's ledger (E-02, CLAUDE.md §8): each carries a code
 * the console maps to its message.
 */

export class MontoInvalidoError extends Error {
  readonly code = 'MONTO_INVALIDO' as const;
  constructor(detalle: string) {
    super(`Monto inválido: ${detalle}.`);
    this.name = 'MontoInvalidoError';
  }
}

export class AsientoDesbalanceadoError extends Error {
  readonly code = 'ASIENTO_DESBALANCEADO' as const;
  constructor(
    readonly debe: bigint,
    readonly haber: bigint,
  ) {
    super(`El asiento no cuadra: cargos ${debe} y abonos ${haber} (centavos).`);
    this.name = 'AsientoDesbalanceadoError';
  }
}

export class MotivoRequeridoError extends Error {
  readonly code = 'MOTIVO_REQUERIDO' as const;
  constructor() {
    super('Un ajuste necesita su motivo.');
    this.name = 'MotivoRequeridoError';
  }
}

export class PeriodoCerradoError extends Error {
  readonly code = 'PERIODO_CERRADO' as const;
  constructor(readonly fecha: string) {
    super(`El mes de ${fecha} ya está cerrado, o la fecha no es válida.`);
    this.name = 'PeriodoCerradoError';
  }
}

export class TipoCambioInvalidoError extends Error {
  readonly code = 'TIPO_CAMBIO_INVALIDO' as const;
  constructor(readonly valor: string) {
    super(`Tipo de cambio inválido: «${valor}».`);
    this.name = 'TipoCambioInvalidoError';
  }
}
