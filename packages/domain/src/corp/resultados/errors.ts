/** Typed errors of Resultados (E-12, CLAUDE.md §8). */
export class CuentaFueraDeResultadosError extends Error {
  readonly code = 'CUENTA_FUERA_DE_RESULTADOS' as const;
  constructor(readonly cuenta: string) {
    super(`La cuenta ${cuenta} no está en el estado de resultados.`);
    this.name = 'CuentaFueraDeResultadosError';
  }
}
