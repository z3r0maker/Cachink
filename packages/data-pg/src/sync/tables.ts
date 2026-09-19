import type { SyncedTable } from '@xangarro/contracts';

import { openingBalanceClients, openingBalances } from '../schema/opening-balances.js';

import {
  conversionRecetas,
  conversions,
  inventoryMovements,
  products,
  auditoriasInventario,
} from '../schema/catalog.js';
import { cajaMovimientos, cajaTurnos, cancelacionLogs, dayCloses } from '../schema/caja.js';
import {
  clientPayments,
  entregasCredito,
  expenses,
  recurringExpenses,
  sales,
} from '../schema/ledger.js';
import { businesses, clients, employees, users } from '../schema/tenant.js';
import { mensajesOperador, respuestasOperador } from '../schema/mensajes.js';

/**
 * Every synced table by its wire name (contract §8) — the one map from the
 * name a delta carries to the Drizzle table it lands in. Typed against
 * `SyncedTable`, so a table added to the contract without a home here is a
 * compile error rather than a push that fails at run time.
 */
export const SYNCED_TABLES = {
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
  products,
  clients,
  businesses,
  users,
  employees,
  recurring_expenses: recurringExpenses,
  conversion_recetas: conversionRecetas,
  mensajes_operador: mensajesOperador,
  respuestas_operador: respuestasOperador,
  opening_balances: openingBalances,
  opening_balance_clients: openingBalanceClients,
} as const satisfies Record<SyncedTable, unknown>;
