import { sum, type Money } from '@xangarro/domain';

import { matches } from '../comun/search';
import type { CategoriaGasto, GastoTurno } from './types';

export interface ResumenGastos {
  readonly cuantos: number;
  readonly total: Money;
  readonly sinComprobante: number;
}

/** The three KPIs: how many, how much left the drawer, how many lack a receipt. */
export function resumen(gastos: readonly GastoTurno[]): ResumenGastos {
  return {
    cuantos: gastos.length,
    total: sum(gastos.map((g) => g.monto)),
    sinComprobante: gastos.filter((g) => !g.comprobante).length,
  };
}

/** Category chip, then an accent-insensitive search over concept and supplier. */
export function filtrar(
  gastos: readonly GastoTurno[],
  categoria: 'Todos' | CategoriaGasto,
  query: string,
): readonly GastoTurno[] {
  return gastos
    .filter((g) => categoria === 'Todos' || g.categoria === categoria)
    .filter((g) => matches(query, `${g.concepto} ${g.detalle}`));
}

/** 65000n → «650.00», what the amount field holds when the drawer opens filled. */
export const montoCrudo = (m: bigint): string => `${m / 100n}.${String(m % 100n).padStart(2, '0')}`;
