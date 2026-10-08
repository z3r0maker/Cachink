import { formatMoney } from '../../format/money.js';

/** Typed errors of the agreement's money rules (E-03, CLAUDE.md §8). */

export class ReembolsoExcedeSaldoError extends Error {
  readonly code = 'REEMBOLSO_EXCEDE_SALDO' as const;
  constructor(
    readonly saldo: bigint,
    readonly monto: bigint,
  ) {
    super(
      saldo === 0n
        ? 'Ese socio no tiene préstamos por reembolsar.'
        : `El reembolso pasa del saldo del préstamo: quedan ${formatMoney(saldo)}.`,
    );
    this.name = 'ReembolsoExcedeSaldoError';
  }
}

export class TrimestreInvalidoError extends Error {
  readonly code = 'TRIMESTRE_INVALIDO' as const;
  constructor(readonly valor: string) {
    super(`«${valor}» no es un trimestre.`);
    this.name = 'TrimestreInvalidoError';
  }
}
