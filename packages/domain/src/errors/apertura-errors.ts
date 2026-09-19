/** Typed errors for the opening-balances and inventario-inicial flows (N-17, C-20). */

import type { Money } from '../money/index.js';

/** The rows are read-only once locked (N-17's explicit owner lock). */
export class SaldosBloqueadosError extends Error {
  readonly code = 'SALDOS_BLOQUEADOS' as const;

  constructor(readonly lockedAt: string) {
    super(`Los saldos iniciales se bloquearon el ${lockedAt}. Ya no se pueden editar.`);
    this.name = 'SaldosBloqueadosError';
  }
}

export class SaldosInvalidosError extends Error {
  readonly code = 'SALDOS_INVALIDOS' as const;

  constructor(readonly campos: readonly string[]) {
    super(`Revisa estos datos de los saldos iniciales: ${campos.join(', ')}.`);
    this.name = 'SaldosInvalidosError';
  }
}

/** The one-time step already ran; re-capturing would double the opening stock. */
export class InventarioInicialYaCapturadoError extends Error {
  readonly code = 'INVENTARIO_INICIAL_YA_CAPTURADO' as const;

  constructor() {
    super('El inventario inicial ya se capturó; ajústalo con un movimiento.');
    this.name = 'InventarioInicialYaCapturadoError';
  }
}

export class InventarioInicialInvalidoError extends Error {
  readonly code = 'INVENTARIO_INICIAL_INVALIDO' as const;

  constructor(readonly campos: readonly string[]) {
    super(`Revisa estas filas del inventario inicial: ${campos.join(', ')}.`);
    this.name = 'InventarioInicialInvalidoError';
  }
}

/** The valuation the capture step computed (Σ cantidad × costo). */
export interface ValuacionInventarioInicial {
  readonly total: Money;
  readonly movimientos: number;
}
