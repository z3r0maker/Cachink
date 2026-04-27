/**
 * Protocol constants shared between the LAN client and the Rust server
 * (ADR-029). Anything that ever appears on the wire — header names, path
 * prefixes, version numbers, enum literals — lives here so both ends of
 * the protocol import the same source of truth.
 */

/** Protocol version transmitted in the `X-Cachink-Protocol` header. */
export const PROTOCOL_VERSION = 1 as const;

/** Header name used for the version negotiation. */
export const PROTOCOL_HEADER = 'X-Cachink-Protocol' as const;

/** Base path prefix for every LAN sync endpoint. */
export const API_PREFIX = '/api/v1' as const;

/** Concrete endpoint paths (appended to `API_PREFIX`). */
export const API_PATHS = Object.freeze({
  PAIR: '/pair',
  PUSH: '/sync/push',
  PULL: '/sync/pull',
  EVENTS: '/sync/events',
} as const);

/** Maximum deltas accepted in a single push request or returned per pull page. */
export const MAX_BATCH_SIZE = 500;

/** WebSocket idle-close timeout (server). Client sends ping every 20 s. */
export const WS_IDLE_CLOSE_MS = 90_000;
export const WS_HEARTBEAT_MS = 20_000;

/** Valid `op` values on a Delta — deletes are encoded as updates. */
export const DELTA_OPS = Object.freeze(['insert', 'update'] as const);
export type DeltaOp = (typeof DELTA_OPS)[number];

/**
 * The 10 synced tables. Order matters for tests but not at runtime —
 * receivers apply deltas in `__cachink_change_log.id` order.
 *
 * `app_config` is intentionally excluded — it holds device-local settings
 * (current mode, role, notification preferences) that must never propagate
 * to other devices.
 */
export const SYNCED_TABLES = Object.freeze([
  'businesses',
  'sales',
  'expenses',
  'products',
  'inventory_movements',
  'employees',
  'clients',
  'client_payments',
  'day_closes',
  'recurring_expenses',
] as const);
export type SyncedTable = (typeof SYNCED_TABLES)[number];

/** Money columns per synced table. Used by encode/decode to coerce bigint↔string. */
export const MONEY_COLUMNS: Readonly<Record<SyncedTable, readonly string[]>> = Object.freeze({
  businesses: [],
  sales: ['monto_centavos'],
  expenses: ['monto_centavos'],
  products: ['costo_unit_centavos'],
  inventory_movements: ['costo_unit_centavos'],
  employees: ['salario_centavos'],
  clients: [],
  client_payments: ['monto_centavos'],
  day_closes: ['efectivo_esperado_centavos', 'efectivo_contado_centavos', 'diferencia_centavos'],
  recurring_expenses: ['monto_centavos'],
});
