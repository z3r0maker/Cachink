import type { PayrollFrequency } from '../entities/employee.js';
import type { Money } from '../money/index.js';

/**
 * A salary as its weekly equivalent, in centavos (P-12's «Nómina de la
 * semana»). A quincena is 15 days, a month 12/52 of a year; integer maths,
 * rounded half up — money is never a float (CLAUDE.md §2.8).
 */
const RATIO: Readonly<Record<PayrollFrequency, readonly [bigint, bigint]>> = {
  semanal: [1n, 1n],
  quincenal: [7n, 15n],
  mensual: [12n, 52n],
};

export function salarioSemanal(salario: Money, periodo: PayrollFrequency): Money {
  const [num, den] = RATIO[periodo];
  return (salario * num * 2n + den) / (den * 2n);
}
