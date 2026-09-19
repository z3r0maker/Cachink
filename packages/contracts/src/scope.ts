/**
 * Table scope (docs/plan/02-contracts.md §8) as data, so both sides derive
 * their behaviour from one list.
 */

/** Device → cloud, insert + update. */
export const UP_TABLES = [
  'tickets',
  'sales',
  'expenses',
  'caja_turnos',
  'caja_movimientos',
  'cancelacion_logs',
  'day_closes',
  'client_payments',
  'entregas_credito',
  'conversions',
  'auditorias_inventario',
  'respuestas_operador',
] as const;

/**
 * Inserted by phones **and** the portal; every insert flows down to every
 * phone; edits are portal-only (products, clients) or never happen (movements).
 *
 * `inventory_movements` moved here from UP (ADR-081): phones compute stock by
 * summing movements, so a movement only one phone had — another phone's sale,
 * or an entrada recorded in the portal — left every other phone's stock wrong.
 */
export const HYBRID_TABLES = ['products', 'clients', 'inventory_movements'] as const;

/** Cloud → device only. */
export const DOWN_TABLES = [
  'businesses',
  'users',
  'employees',
  'recurring_expenses',
  'conversion_recetas',
  'mensajes_operador',
  // Day-one facts (C-20); default [] below until every server sends them.
  'opening_balances',
  'opening_balance_clients',
] as const;

/** Local-only tables that never cross the wire. */
export const NEVER_SYNCED_TABLES = ['app_config', 'director_alerts'] as const;

export type UpTable = (typeof UP_TABLES)[number];
export type HybridTable = (typeof HYBRID_TABLES)[number];
export type DownTable = (typeof DOWN_TABLES)[number];
export type PushableTable = UpTable | HybridTable;
export type PullableTable = DownTable | HybridTable;
export type SyncedTable = UpTable | HybridTable | DownTable;

export type DeltaOp = 'insert' | 'update';

const UP: ReadonlySet<string> = new Set(UP_TABLES);
const HYBRID: ReadonlySet<string> = new Set(HYBRID_TABLES);
const DOWN: ReadonlySet<string> = new Set(DOWN_TABLES);

export function isPushable(table: string, op: DeltaOp): table is PushableTable {
  if (UP.has(table)) return true;
  if (HYBRID.has(table)) return op === 'insert';
  return false;
}

export function isPullable(table: string): table is PullableTable {
  return DOWN.has(table) || HYBRID.has(table);
}

export function isSyncedTable(table: string): table is SyncedTable {
  return UP.has(table) || HYBRID.has(table) || DOWN.has(table);
}
