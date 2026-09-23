/**
 * Migration 0013 — saldos iniciales on the device (C-20, N-17).
 *
 * The cloud has served both tables since data-pg 0025 and the wire lists them
 * in `DOWN_TABLES`; the device had no home for them, so a pull dropped the
 * business's opening balances on the floor. This is the SQLite half: the same
 * two tables, same columns, same audit shape.
 *
 * DOWN tables, so no change-log triggers: the phone never pushes these rows,
 * it only receives them. `locked_at` is carried, not enforced here — the lock
 * is the portal's (N-17), and the device is a reader.
 *
 * Money stays integer centavos (`numeric` with Drizzle's bigint mode, as
 * `clients.limite_centavos` does), never a float.
 */

export const migration0013Sql = `
-- 0013_opening_balances
--> statement-breakpoint
CREATE TABLE opening_balances (
  id TEXT PRIMARY KEY NOT NULL,
  fecha_apertura TEXT NOT NULL,
  caja_centavos INTEGER NOT NULL,
  bancos_centavos INTEGER NOT NULL,
  locked_at TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
)
--> statement-breakpoint
CREATE TABLE opening_balance_clients (
  id TEXT PRIMARY KEY NOT NULL,
  cliente_id TEXT NOT NULL,
  saldo_centavos INTEGER NOT NULL,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
)
--> statement-breakpoint
CREATE INDEX idx_opening_balances_biz ON opening_balances (business_id, fecha_apertura)
--> statement-breakpoint
CREATE INDEX idx_opening_balance_clients_cliente ON opening_balance_clients (business_id, cliente_id)
`;
