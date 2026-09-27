import { sum, type Money } from '@xangarro/domain';

import { matches } from '../comun/search';
import type { MetodoVenta, VentaTurno } from './types';

/**
 * The wire's words as the operator's screens say them: «Crédito» is «Fiado».
 * A ticket paid by QR/CoDi before ADR-108 retired it was a bank transfer, so
 * it reads back as «Transferencia»; the stored value is untouched.
 */
const DICHO: Readonly<Record<string, MetodoVenta>> = {
  Crédito: 'Fiado',
  'QR/CoDi': 'Transferencia',
  'QR / CoDi': 'Transferencia',
};

export function comoMetodo(metodo: string): MetodoVenta {
  return DICHO[metodo] ?? (metodo as MetodoVenta);
}

export interface ResumenVentas {
  readonly activas: number;
  readonly cobrado: Money;
  readonly efectivo: Money;
  readonly canceladas: number;
}

/** The turno's figures; a cancelled sale stays visible but counts nowhere (rule 6). */
export function resumen(ventas: readonly VentaTurno[]): ResumenVentas {
  const activas = ventas.filter((v) => !v.cancelada);
  return {
    activas: activas.length,
    cobrado: sum(activas.map((v) => v.monto)),
    efectivo: sum(activas.filter((v) => v.metodo === 'Efectivo').map((v) => v.monto)),
    canceladas: ventas.length - activas.length,
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
