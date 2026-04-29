/**
 * Raw SQL for migration 0003 — mirrors `0003_productoId_required.sql`.
 *
 * ADR-048: Product-only sales. Makes `producto_id` NOT NULL on the
 * `sales` table via SQLite table recreation (SQLite lacks ALTER COLUMN).
 * Pre-launch cleanup deletes any dev rows with NULL producto_id first.
 */

export const migration0003Sql = `-- ADR-048: Product-only sales — productoId becomes NOT NULL.
DELETE FROM sales WHERE producto_id IS NULL;
--> statement-breakpoint
CREATE TABLE sales_new (
  id TEXT PRIMARY KEY NOT NULL,
  fecha TEXT NOT NULL,
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL,
  monto_centavos TEXT NOT NULL,
  metodo TEXT NOT NULL,
  cliente_id TEXT,
  estado_pago TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint
INSERT INTO sales_new
  SELECT id, fecha, concepto, categoria, monto_centavos, metodo,
         cliente_id, estado_pago, producto_id, cantidad,
         business_id, device_id, created_at, updated_at, deleted_at
  FROM sales;
--> statement-breakpoint
DROP TABLE sales;
--> statement-breakpoint
ALTER TABLE sales_new RENAME TO sales;
--> statement-breakpoint
CREATE TRIGGER trg_sales_ai AFTER INSERT ON sales
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_sales_au AFTER UPDATE ON sales
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;`;
