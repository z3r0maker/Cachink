/**
 * Migration 0016 — the gasto's receipt photo on the device (ADR-149, M-18).
 *
 * `expense_receipts` is an UP table: the phone inserts the photo of a gasto's
 * ticket and the outbox pushes it; nothing is pulled back. Insert only: the
 * newest row per gasto is the receipt, and there is no tombstone, so `bytes`,
 * `width` and `height` are NOT NULL. The change-log triggers are the pair
 * every synced table carries, into `__xangarro_change_log` (0009's name); the
 * `_au` trigger is there for parity, as on `product_images`.
 *
 * `gasto_id` names the expense without a foreign key, as `product_images`
 * names its product: the wipe and the retention purge empty tables in their
 * own order. `bytes` is base64 text, so the row travels the wire unchanged.
 * Postgres side: data-pg's `expense_receipts`.
 */

export const migration0016Sql = `
-- 0016_expense_receipts
--> statement-breakpoint
CREATE TABLE expense_receipts (
  id TEXT PRIMARY KEY NOT NULL,
  gasto_id TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT 'image/webp',
  bytes TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
)
--> statement-breakpoint
CREATE INDEX idx_expense_receipts_gasto ON expense_receipts (gasto_id, created_at)
--> statement-breakpoint
CREATE TRIGGER trg_expense_receipts_ai AFTER INSERT ON expense_receipts
BEGIN
  INSERT INTO __xangarro_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('expense_receipts', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_expense_receipts_au AFTER UPDATE ON expense_receipts
BEGIN
  INSERT INTO __xangarro_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('expense_receipts', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
`.trim();
