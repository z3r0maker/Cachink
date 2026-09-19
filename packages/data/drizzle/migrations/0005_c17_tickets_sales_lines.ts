/**
 * Migration 0005 — a sale becomes a ticket + its lines (C-17, ADR-073).
 *
 * Every existing sale becomes a one-line ticket: the ticket copies the
 * sale's header facts (metodo, cliente, estado, efectivo recibido, turno,
 * cancellation) and takes the next folio of its device; the line keeps
 * product/quantity/amount and points at the ticket. Then the header columns
 * leave `sales`. Lines keep `fecha` (copied, immutable) so date-scoped
 * queries keep working without a join.
 */

export const migration0005Sql = `
CREATE TABLE tickets (
  id TEXT PRIMARY KEY NOT NULL,
  folio INTEGER NOT NULL,
  fecha TEXT NOT NULL,
  hora TEXT,
  concepto TEXT NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('Efectivo','Transferencia','Tarjeta','QR/CoDi','Crédito')),
  cliente_id TEXT,
  estado_pago TEXT NOT NULL CHECK (estado_pago IN ('pagado','pendiente','parcial')),
  efectivo_recibido_centavos INTEGER,
  cambio_centavos INTEGER,
  caja_turno_id TEXT,
  cancel_motivo TEXT,
  cancelled_by_user_id TEXT,
  cancelled_at TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (device_id, folio)
);
--> statement-breakpoint
INSERT INTO tickets (id, folio, fecha, hora, concepto, metodo, cliente_id, estado_pago,
  efectivo_recibido_centavos, caja_turno_id, cancel_motivo, cancelled_by_user_id, cancelled_at,
  created_by_user_id, business_id, device_id, created_at, updated_at, deleted_at)
SELECT
  id,
  ROW_NUMBER() OVER (PARTITION BY device_id ORDER BY created_at, id),
  fecha, hora, concepto, metodo, cliente_id, estado_pago,
  efectivo_recibido_centavos, caja_turno_id, cancel_motivo, cancelled_by_user_id, cancelled_at,
  created_by_user_id, business_id, device_id, created_at, updated_at, deleted_at
FROM sales;
--> statement-breakpoint
CREATE TABLE sales_migrated (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  fecha TEXT NOT NULL,
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('Producto','Servicio','Anticipo','Suscripción','Otro')),
  monto_centavos INTEGER NOT NULL,
  producto_id TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint
INSERT INTO sales_migrated (id, ticket_id, fecha, concepto, categoria, monto_centavos,
  producto_id, cantidad, created_by_user_id, business_id, device_id, created_at, updated_at, deleted_at)
SELECT id, id, fecha, concepto, categoria, monto_centavos,
  producto_id, cantidad, created_by_user_id, business_id, device_id, created_at, updated_at, deleted_at
FROM sales;
--> statement-breakpoint
DROP TABLE sales;
--> statement-breakpoint
ALTER TABLE sales_migrated RENAME TO sales;
--> statement-breakpoint
CREATE INDEX idx_sales_ticket ON sales (ticket_id);
--> statement-breakpoint
-- The rebuild drops 0000's partial indexes; re-create them, minus cliente_id.
CREATE INDEX idx_sales_biz_fecha
  ON sales(business_id, fecha)
  WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX idx_tickets_biz_fecha
  ON tickets(business_id, fecha)
  WHERE deleted_at IS NULL;
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
END;
--> statement-breakpoint
CREATE TRIGGER trg_tickets_ai AFTER INSERT ON tickets
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('tickets', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_tickets_au AFTER UPDATE ON tickets
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('tickets', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
--> statement-breakpoint
-- Cancellation is ticket-level too: cancelacion_logs points at tickets.
CREATE TABLE cancelacion_logs_migrated (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_id TEXT NOT NULL,
  cancelled_by_user_id TEXT NOT NULL,
  motivo TEXT NOT NULL,
  monto_original_centavos INTEGER NOT NULL,
  metodo_original TEXT NOT NULL,
  cash_returned_centavos INTEGER,
  stock_reversed INTEGER NOT NULL DEFAULT 0,
  cantidad_devuelta INTEGER,
  producto_id TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint
INSERT INTO cancelacion_logs_migrated
  SELECT id, sale_id, cancelled_by_user_id, motivo, monto_original_centavos, metodo_original,
         cash_returned_centavos, stock_reversed, cantidad_devuelta, producto_id,
         created_by_user_id, business_id, device_id, created_at, updated_at, deleted_at
  FROM cancelacion_logs;
--> statement-breakpoint
DROP TABLE cancelacion_logs;
--> statement-breakpoint
ALTER TABLE cancelacion_logs_migrated RENAME TO cancelacion_logs;
--> statement-breakpoint
-- 0004 left client_payments pointing at sales via cliente backfill; nothing
-- here touches it — a line's ticket carries the client from now on.
`.trim();
