/**
 * Migration 0004 — receivables, expected cash and review status (C-18,
 * ADR-074).
 *
 * `client_payments` move from per-sale to per-client: cliente_id is
 * backfilled from each payment's sale, then venta_id leaves (a payment whose
 * sale had no client keeps cliente_id NULL — pre-launch seed/test data; the
 * old→new test documents it). clients/products gain the «creado en caja»
 * review status (existing rows are `aprobado`), expenses gain their turno,
 * and caja_turnos gains the immutable denomination count.
 */

export const migration0004Sql = `
ALTER TABLE clients ADD COLUMN limite_centavos NUMERIC;
--> statement-breakpoint
ALTER TABLE clients ADD COLUMN plazo_dias INTEGER;
--> statement-breakpoint
ALTER TABLE clients ADD COLUMN estado_revision TEXT NOT NULL DEFAULT 'aprobado';
--> statement-breakpoint
ALTER TABLE clients ADD COLUMN fusionado_con_id TEXT;
--> statement-breakpoint
ALTER TABLE products ADD COLUMN estado_revision TEXT NOT NULL DEFAULT 'aprobado';
--> statement-breakpoint
ALTER TABLE products ADD COLUMN fusionado_con_id TEXT;
--> statement-breakpoint
ALTER TABLE expenses ADD COLUMN caja_turno_id TEXT;
--> statement-breakpoint
ALTER TABLE caja_turnos ADD COLUMN denominaciones TEXT;
--> statement-breakpoint
ALTER TABLE client_payments ADD COLUMN cliente_id TEXT;
--> statement-breakpoint
UPDATE client_payments
SET cliente_id = (SELECT cliente_id FROM sales WHERE sales.id = client_payments.venta_id);
--> statement-breakpoint
CREATE TABLE client_payments_migrated (
  id TEXT PRIMARY KEY NOT NULL,
  cliente_id TEXT NOT NULL,
  fecha TEXT NOT NULL,
  monto_centavos INTEGER NOT NULL,
  metodo TEXT NOT NULL CHECK (metodo IN ('Efectivo','Transferencia','Tarjeta','QR/CoDi','Crédito')),
  nota TEXT,
  created_by_user_id TEXT,
  business_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
--> statement-breakpoint
INSERT INTO client_payments_migrated
  SELECT id, cliente_id, fecha, monto_centavos, metodo, nota,
         created_by_user_id, business_id, device_id, created_at, updated_at, deleted_at
  FROM client_payments WHERE cliente_id IS NOT NULL;
--> statement-breakpoint
DROP TABLE client_payments;
--> statement-breakpoint
ALTER TABLE client_payments_migrated RENAME TO client_payments;
--> statement-breakpoint
CREATE INDEX idx_client_payments_cliente ON client_payments (cliente_id);
--> statement-breakpoint
CREATE TRIGGER trg_client_payments_ai AFTER INSERT ON client_payments
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('client_payments', NEW.id, NEW.updated_at, NEW.device_id, 'insert');
END;
--> statement-breakpoint
CREATE TRIGGER trg_client_payments_au AFTER UPDATE ON client_payments
BEGIN
  INSERT INTO __cachink_change_log (table_name, row_id, row_updated_at, row_device_id, op)
  VALUES ('client_payments', NEW.id, NEW.updated_at, NEW.device_id, 'update');
END;
`.trim();
