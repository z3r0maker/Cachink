/**
 * What is inside a statement line (P-14's disclosure rows): ingresos by
 * payment method, costo de ventas and gastos operativos by category — largest
 * first. Classified with `esCostoDeVentas`, the same rule the Estado de
 * Resultados uses, so each breakdown adds up to its line exactly.
 */

import type { Expense } from '../entities/expense.js';
import type { Sale } from '../entities/sale.js';
import type { Money } from '../money/index.js';
import { esCostoDeVentas } from './estado-resultados.js';

export interface Partida {
  readonly clave: string;
  readonly monto: Money;
}

export interface Desglose {
  readonly ingresos: readonly Partida[];
  readonly costoDeVentas: readonly Partida[];
  readonly gastosOperativos: readonly Partida[];
}

function agrupar<T>(
  items: readonly T[],
  clave: (t: T) => string,
  monto: (t: T) => Money,
): Partida[] {
  const m = new Map<string, Money>();
  for (const it of items) m.set(clave(it), (m.get(clave(it)) ?? 0n) + monto(it));
  return [...m.entries()]
    .map(([k, v]) => ({ clave: k, monto: v }))
    .sort((a, b) =>
      b.monto > a.monto ? 1 : b.monto < a.monto ? -1 : a.clave.localeCompare(b.clave),
    );
}

export function desgloseDeResultados(input: {
  readonly ventas: readonly Sale[];
  readonly egresos: readonly Expense[];
}): Desglose {
  const costo = input.egresos.filter((e) => esCostoDeVentas(e.categoria));
  const gastos = input.egresos.filter((e) => !esCostoDeVentas(e.categoria));
  return {
    ingresos: agrupar(
      input.ventas,
      (v) => v.metodo,
      (v) => v.monto,
    ),
    costoDeVentas: agrupar(
      costo,
      (e) => e.categoria,
      (e) => e.monto,
    ),
    gastosOperativos: agrupar(
      gastos,
      (e) => e.categoria,
      (e) => e.monto,
    ),
  };
}
