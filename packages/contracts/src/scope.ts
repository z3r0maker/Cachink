/**
 * Table scope (docs/plan/02-contracts.md §8) as data, so both sides derive
 * their behaviour from one list.
 */

/** Device → cloud, insert + update. */
export const UP_TABLES = [
  'sales',
  'expenses',
  'inventory_movements',
  'caja_turnos',
  'caja_movimientos',
  'cancelacion_logs',
  'day_closes',
  'client_payments',
  'entregas_credito',
  'conversions',
  'auditorias_inventario',
] as const;

/** Insert up only; every edit is portal-only and flows down. */
export const HYBRID_TABLES = ['products', 'clients'] as const;

/** Cloud → device only. */
export const DOWN_TABLES = [
  'businesses',
  'users',
  'employees',
  'recurring_expenses',
  'conversion_recetas',
] as const;

/** Local-only tables that never cross the wire (sync bookkeeping included). */
export const NEVER_SYNCED_TABLES = [
  'app_config',
  'director_alerts',
  '__sync_row_status',
  '__stock_baseline',
] as const;

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
