/**
 * Drizzle table objects for every pushable table in the cloud contract (§8),
 * keyed by wire table name.
 */

import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { PushableTable } from '@xangarro/contracts';
import {
  auditoriasInventario,
  cajaMovimientos,
  cajaTurnos,
  cancelacionLogs,
  clientPayments,
  clients,
  conversions,
  dayCloses,
  entregasCredito,
  expenses,
  inventoryMovements,
  products,
  sales,
  tickets,
  respuestasOperador,
} from '@xangarro/data';

export const PUSH_TABLES: Readonly<Record<PushableTable, SQLiteTable>> = {
  tickets,
  sales,
  expenses,
  inventory_movements: inventoryMovements,
  caja_turnos: cajaTurnos,
  caja_movimientos: cajaMovimientos,
  cancelacion_logs: cancelacionLogs,
  day_closes: dayCloses,
  client_payments: clientPayments,
  entregas_credito: entregasCredito,
  conversions,
  auditorias_inventario: auditoriasInventario,
  respuestas_operador: respuestasOperador,
  products,
  clients,
};

/** Stable key for a (table, row) pair. */
export function rowKey(table: string, rowId: string): string {
  return `${table}:${rowId}`;
}
