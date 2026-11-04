/**
 * Migration 0014 — product photos on the device (ADR-134, C-24).
 *
 * `product_images` is the fourth HYBRID table: the phone inserts a photo it
 * took (or a tombstone when the operator removes one), the portal inserts
 * too, and every insert flows down to every phone. Append-only: nothing is
 * updated, the newest row per product wins. So the change-log triggers are
 * the same pair every synced table carries, into `__xangarro_change_log`
 * (0009's name), and the `_au` trigger exists for parity only — a local
 * update is never pushed (`isPushable`).
 *
 * `bytes` is base64 text, NULL on a tombstone; `width`/`height` go with it.
 */

export const migration0014Sql = `
-- 0014_product_images
--> statement-breakpoint
CREATE TABLE product_images (
  id TEXT PRIMARY KEY NOT NULL,
  producto_id TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT 'image/webp',
  bytes TEXT,
  width INTEGER,
  height INTEGER,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
)
--> statement-breakpoint
CREATE INDEX idx_product_images_producto ON product_images (business_id, producto_id, created_at)
--> statement-breakpoint
CREATE TRIGGER trg_product_images_ai AFTER INSERT ON product_images
BEGIN
  INSERT INTO __xangarro_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('product_images', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_product_images_au AFTER UPDATE ON product_images
BEGIN
  INSERT INTO __xangarro_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('product_images', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
`.trim();
