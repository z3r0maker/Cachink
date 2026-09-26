import { sum, type Money } from '@xangarro/domain';

import { matches } from '../ui/search';
import type { MetodoVenta, VentaTurno } from './types';

/** The wire's words as the operator's screens say them: «Crédito» is «Fiado». */
const DICHO: Readonly<Record<string, MetodoVenta>> = { Crédito: 'Fiado', 'QR/CoDi': 'QR / CoDi' };

export function comoMetodo(metodo: string): MetodoVenta {
  return DICHO[metodo] ?? (metodo as MetodoVenta);
}

export interface ResumenVentas {
  readonly activas: number;
  readonly cobrado: Money;
  readonly efectivo: Money;
}

/** The turno's figures; a cancelled sale stays visible but counts nowhere (rule 6). */
export function resumen(ventas: readonly VentaTurno[]): ResumenVentas {
  const activas = ventas.filter((v) => !v.cancelada);
  return {
    activas: activas.length,
    cobrado: sum(activas.map((v) => v.monto)),
    efectivo: sum(activas.filter((v) => v.metodo === 'Efectivo').map((v) => v.monto)),
  };
}

export function filtrar(
  ventas: readonly VentaTurno[],
  metodo: 'Todos' | MetodoVenta,
  query: string,
): readonly VentaTurno[] {
  return ventas
    .filter((v) => metodo === 'Todos' || v.metodo === metodo)
    .filter((v) => matches(query, v.folio, v.concepto, v.cliente ?? ''));
}
