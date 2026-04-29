-- ADR-048: Product-only sales — productoId becomes NOT NULL.
--
-- SQLite does not support ALTER COLUMN. We recreate the table with the
-- new constraint, copy data, drop old, rename. Any rows with NULL
-- producto_id are cleaned up first (dev data only — app hasn't shipped).

-- Step 1: Remove dev rows with NULL producto_id (pre-launch cleanup).
DELETE FROM sales WHERE producto_id IS NULL;

-- Step 2: Recreate the table with producto_id NOT NULL.
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

-- Step 3: Copy all surviving rows.
INSERT INTO sales_new
  SELECT id, fecha, concepto, categoria, monto_centavos, metodo,
         cliente_id, estado_pago, producto_id, cantidad,
         business_id, device_id, created_at, updated_at, deleted_at
  FROM sales;

-- Step 4: Drop old table (triggers go away with it).
DROP TABLE sales;

-- Step 5: Rename.
ALTER TABLE sales_new RENAME TO sales;

-- Step 6: Re-create the change-log triggers that were on the old table.
CREATE TRIGGER trg_sales_ai AFTER INSERT ON sales
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;

CREATE TRIGGER trg_sales_au AFTER UPDATE ON sales
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('sales', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
